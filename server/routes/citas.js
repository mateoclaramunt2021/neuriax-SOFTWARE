const express = require('express');
const { getDatabase, saveDatabase } = require('../database/init');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// Helper para obtener tenantId
const getTenantId = (req) => req.tenantId || req.user?.tenantId || req.usuario?.tenantId || req.headers['x-tenant-id'] || 'demo';

// Obtener todas las citas
router.get('/', verificarToken, (req, res) => {
  try {
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const { fecha, empleado_id, cliente_id, estado } = req.query;

    let citas = [...(db.citas || [])].filter(c => c.tenantId === tenantId || c.tenant_id === tenantId);

    // Filtros
    if (fecha) {
      citas = citas.filter(c => c.fecha && c.fecha.startsWith(fecha));
    }
    if (empleado_id) {
      citas = citas.filter(c => c.empleado_id === parseInt(empleado_id));
    }
    if (cliente_id) {
      citas = citas.filter(c => c.cliente_id === parseInt(cliente_id));
    }
    if (estado) {
      citas = citas.filter(c => c.estado === estado);
    }

    // Enriquecer con datos de cliente, empleado y servicios
    const citasEnriquecidas = citas.map(cita => {
      const cliente = (db.clientes || []).find(c => c.id === cita.cliente_id && (c.tenantId === tenantId || c.tenant_id === tenantId));
      const empleado = (db.empleados || []).find(e => e.id === cita.empleado_id && (e.tenantId === tenantId || e.tenant_id === tenantId));
      const servicios = (cita.servicios_ids || []).map(sid => {
        const servicio = (db.servicios || []).find(s => s.id === sid);
        return servicio ? { id: servicio.id, nombre: servicio.nombre, duracion: servicio.duracion } : null;
      }).filter(s => s !== null);

      return {
        ...cita,
        cliente: cliente ? { id: cliente.id, nombre: cliente.nombre, telefono: cliente.telefono } : null,
        empleado: empleado ? { id: empleado.id, nombre: empleado.nombre, cargo: empleado.cargo } : null,
        servicios
      };
    });

    res.json({
      success: true,
      citas: citasEnriquecidas
    });
  } catch (error) {
    console.error('Error obteniendo citas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener citas',
      citas: []
    });
  }
});

// Obtener cita por ID
router.get('/:id', verificarToken, (req, res) => {
  try {
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const cita = (db.citas || []).find(c => c.id === parseInt(req.params.id) && c.tenantId === tenantId);

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    const cliente = (db.clientes || []).find(c => c.id === cita.cliente_id && c.tenantId === tenantId);
    const empleado = (db.empleados || []).find(e => e.id === cita.empleado_id && e.tenantId === tenantId);
    const servicios = (cita.servicios_ids || []).map(sid => {
      return (db.servicios || []).find(s => s.id === sid);
    }).filter(s => s !== undefined);

    res.json({
      success: true,
      cita: {
        ...cita,
        cliente,
        empleado,
        servicios
      }
    });
  } catch (error) {
    console.error('Error obteniendo cita:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener cita' 
    });
  }
});

// Crear nueva cita
router.post('/', verificarToken, (req, res) => {
  try {
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const { 
      cliente_id, 
      empleado_id, 
      fecha, 
      hora, 
      servicios_ids, 
      notas 
    } = req.body;

    // Validaciones
    if (!cliente_id || !empleado_id || !fecha || !hora || !servicios_ids || servicios_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cliente, empleado, fecha, hora y servicios son requeridos'
      });
    }

    // Inicializar arrays si no existen
    if (!db.citas) db.citas = [];

    // Verificar que el cliente existe y pertenece al tenant
    const cliente = (db.clientes || []).find(c => c.id === parseInt(cliente_id) && c.tenantId === tenantId);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Verificar que el empleado existe y pertenece al tenant
    const empleado = (db.empleados || []).find(e => e.id === parseInt(empleado_id) && e.tenantId === tenantId);
    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Calcular duración total
    const duracionTotal = servicios_ids.reduce((total, sid) => {
      const servicio = (db.servicios || []).find(s => s.id === parseInt(sid));
      return total + (servicio ? servicio.duracion : 0);
    }, 0);

    // Crear fecha/hora completa
    const fechaHora = `${fecha}T${hora}:00`;

    // Verificar disponibilidad del empleado (solo citas del mismo tenant)
    const citasEmpleado = db.citas.filter(c => 
      c.tenantId === tenantId &&
      c.empleado_id === parseInt(empleado_id) && 
      c.fecha && c.fecha.startsWith(fecha) &&
      c.estado !== 'cancelada'
    );

    const nuevaHoraInicio = new Date(`${fecha}T${hora}:00`);
    const nuevaHoraFin = new Date(nuevaHoraInicio.getTime() + duracionTotal * 60000);

    for (const citaExistente of citasEmpleado) {
      const citaInicio = new Date(citaExistente.fecha);
      const citaDuracion = (citaExistente.servicios_ids || []).reduce((total, sid) => {
        const servicio = (db.servicios || []).find(s => s.id === sid);
        return total + (servicio ? servicio.duracion : 0);
      }, 0);
      const citaFin = new Date(citaInicio.getTime() + citaDuracion * 60000);

      if ((nuevaHoraInicio >= citaInicio && nuevaHoraInicio < citaFin) ||
          (nuevaHoraFin > citaInicio && nuevaHoraFin <= citaFin) ||
          (nuevaHoraInicio <= citaInicio && nuevaHoraFin >= citaFin)) {
        return res.status(400).json({
          success: false,
          message: 'El empleado no está disponible en ese horario'
        });
      }
    }

    const nuevaCita = {
      id: db.citas.length > 0 ? Math.max(...db.citas.map(c => c.id)) + 1 : 1,
      tenantId,
      cliente_id: parseInt(cliente_id),
      empleado_id: parseInt(empleado_id),
      fecha: fechaHora,
      servicios_ids: servicios_ids.map(id => parseInt(id)),
      duracion_total: duracionTotal,
      estado: 'confirmada',
      notas: notas || '',
      fecha_creacion: new Date().toISOString(),
      usuario_creacion: req.usuario ? req.usuario.id : 1
    };

    db.citas.push(nuevaCita);
    saveDatabase(db);

    res.json({
      success: true,
      message: 'Cita creada exitosamente',
      cita: nuevaCita
    });
  } catch (error) {
    console.error('Error creando cita:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear cita' 
    });
  }
});

// Actualizar cita
router.put('/:id', verificarToken, (req, res) => {
  try {
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const citaId = parseInt(req.params.id);
    const citaIndex = (db.citas || []).findIndex(c => c.id === citaId && c.tenantId === tenantId);

    if (citaIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    const { 
      cliente_id, 
      empleado_id, 
      fecha, 
      hora, 
      servicios_ids, 
      estado,
      notas 
    } = req.body;

    // Si se cambia fecha/hora/empleado, verificar disponibilidad
    if (fecha && hora && empleado_id) {
      const fechaHora = `${fecha}T${hora}:00`;
      const duracionTotal = servicios_ids ? servicios_ids.reduce((total, sid) => {
        const servicio = (db.servicios || []).find(s => s.id === parseInt(sid));
        return total + (servicio ? servicio.duracion : 0);
      }, 0) : db.citas[citaIndex].duracion_total;

      const citasEmpleado = db.citas.filter(c => 
        c.tenantId === tenantId &&
        c.empleado_id === parseInt(empleado_id) && 
        c.id !== citaId &&
        c.fecha && c.fecha.startsWith(fecha) &&
        c.estado !== 'cancelada'
      );

      const nuevaHoraInicio = new Date(fechaHora);
      const nuevaHoraFin = new Date(nuevaHoraInicio.getTime() + duracionTotal * 60000);

      for (const citaExistente of citasEmpleado) {
        const citaInicio = new Date(citaExistente.fecha);
        const citaDuracion = citaExistente.duracion_total || 30;
        const citaFin = new Date(citaInicio.getTime() + citaDuracion * 60000);

        if ((nuevaHoraInicio >= citaInicio && nuevaHoraInicio < citaFin) ||
            (nuevaHoraFin > citaInicio && nuevaHoraFin <= citaFin) ||
            (nuevaHoraInicio <= citaInicio && nuevaHoraFin >= citaFin)) {
          return res.status(400).json({
            success: false,
            message: 'El empleado no está disponible en ese horario'
          });
        }
      }
    }

    // Actualizar cita
    const citaActualizada = {
      ...db.citas[citaIndex],
      cliente_id: cliente_id !== undefined ? parseInt(cliente_id) : db.citas[citaIndex].cliente_id,
      empleado_id: empleado_id !== undefined ? parseInt(empleado_id) : db.citas[citaIndex].empleado_id,
      fecha: fecha && hora ? `${fecha}T${hora}:00` : db.citas[citaIndex].fecha,
      servicios_ids: servicios_ids !== undefined ? servicios_ids.map(id => parseInt(id)) : db.citas[citaIndex].servicios_ids,
      duracion_total: servicios_ids !== undefined ? servicios_ids.reduce((total, sid) => {
        const servicio = (db.servicios || []).find(s => s.id === parseInt(sid));
        return total + (servicio ? servicio.duracion : 0);
      }, 0) : db.citas[citaIndex].duracion_total,
      estado: estado !== undefined ? estado : db.citas[citaIndex].estado,
      notas: notas !== undefined ? notas : db.citas[citaIndex].notas,
      tenantId
    };

    db.citas[citaIndex] = citaActualizada;
    saveDatabase(db);

    res.json({
      success: true,
      message: 'Cita actualizada exitosamente',
      cita: citaActualizada
    });
  } catch (error) {
    console.error('Error actualizando cita:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar cita' 
    });
  }
});

// Cambiar estado de cita
router.patch('/:id/estado', verificarToken, (req, res) => {
  try {
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const citaId = parseInt(req.params.id);
    const { estado } = req.body;

    const citaIndex = (db.citas || []).findIndex(c => c.id === citaId && c.tenantId === tenantId);
    if (citaIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    const estadosPermitidos = ['confirmada', 'en_proceso', 'completada', 'cancelada', 'no_asistio'];
    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    db.citas[citaIndex].estado = estado;
    saveDatabase(db);

    res.json({
      success: true,
      message: `Cita marcada como ${estado}`,
      cita: db.citas[citaIndex]
    });
  } catch (error) {
    console.error('Error cambiando estado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al cambiar estado' 
    });
  }
});

// Eliminar cita
router.delete('/:id', verificarToken, (req, res) => {
  try {
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const citaId = parseInt(req.params.id);
    const citaIndex = (db.citas || []).findIndex(c => c.id === citaId && c.tenantId === tenantId);

    if (citaIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    db.citas.splice(citaIndex, 1);
    saveDatabase(db);

    res.json({
      success: true,
      message: 'Cita eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando cita:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar cita' 
    });
  }
});

// Obtener disponibilidad de empleado
router.get('/disponibilidad/:empleado_id', verificarToken, (req, res) => {
  try {
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const { fecha } = req.query;
    const empleadoId = parseInt(req.params.empleado_id);

    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: 'Fecha es requerida'
      });
    }

    const empleado = (db.empleados || []).find(e => e.id === empleadoId);
    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Obtener citas del empleado en esa fecha
    const citasDelDia = (db.citas || []).filter(c => 
      c.empleado_id === empleadoId && 
      c.fecha && c.fecha.startsWith(fecha) &&
      c.estado !== 'cancelada'
    ).map(c => {
      const inicio = new Date(c.fecha);
      const fin = new Date(inicio.getTime() + (c.duracion_total || 30) * 60000);
      return {
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
        duracion: c.duracion_total || 30
      };
    });

    res.json({
      success: true,
      empleado: {
        id: empleado.id,
        nombre: empleado.nombre
      },
      fecha,
      citas: citasDelDia
    });
  } catch (error) {
    console.error('Error consultando disponibilidad:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al consultar disponibilidad' 
    });
  }
});

module.exports = router;
