/**
 * RUTAS CAMBIO CITAS - Endpoints para modificar citas online
 * ===========================================================
 * Permitir que clientes cambien sus citas desde portal público
 * 
 * KEYWORD: CAMBIO CITAS ONLINE - Reschedule de reservas
 */

const express = require('express');
const router = express.Router();
const dbService = require('../database/dbService');
const twilioService = require('../services/twilioService');

/**
 * POST /api/public/cambio-cita
 * Cambiar cita sin autenticación (acceso público)
 * Requiere: citaId, codigoConfirmacion, nuevaFecha, nuevaHora
 */
router.post('/cambio-cita', async (req, res) => {
  try {
    const { citaId, codigoConfirmacion, nuevaFecha, nuevaHora } = req.body;

    // Validar datos
    if (!citaId || !codigoConfirmacion || !nuevaFecha || !nuevaHora) {
      return res.status(400).json({
        error: 'Datos incompletos: citaId, codigoConfirmacion, nuevaFecha y nuevaHora requeridos'
      });
    }

    // Validar formato de fecha y hora
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    const horaRegex = /^\d{2}:\d{2}$/;

    if (!fechaRegex.test(nuevaFecha) || !horaRegex.test(nuevaHora)) {
      return res.status(400).json({
        error: 'Formato inválido. Usa YYYY-MM-DD para fecha y HH:mm para hora'
      });
    }

    // Buscar cita
    const citas = dbService.readJSON('citas.json') || {};
    const cita = citas[citaId];

    if (!cita) {
      return res.status(404).json({
        error: 'Cita no encontrada'
      });
    }

    // Verificar código de confirmación
    if (cita.codigoConfirmacion !== codigoConfirmacion) {
      console.warn(`⚠️ [CAMBIO CITA] Código incorrecto para ${citaId}`);
      return res.status(403).json({
        error: 'Código de confirmación incorrecto'
      });
    }

    // Verificar que la cita sea futura
    const ahora = new Date();
    const fechaCita = new Date(cita.fecha);
    
    if (fechaCita < ahora) {
      return res.status(400).json({
        error: 'No puedes cambiar una cita pasada'
      });
    }

    // Verificar que la nueva fecha sea futura
    const nuevaFechaCita = new Date(`${nuevaFecha}T${nuevaHora}`);
    if (nuevaFechaCita < ahora) {
      return res.status(400).json({
        error: 'La nueva fecha debe ser en el futuro'
      });
    }

    // Verificar que la nueva hora esté dentro de horario comercial (8:00 - 20:00)
    const [hora, minutos] = nuevaHora.split(':').map(Number);
    if (hora < 8 || hora > 20 || (hora === 20 && minutos > 0)) {
      return res.status(400).json({
        error: 'Horario disponible: 08:00 - 20:00'
      });
    }

    // Verificar disponibilidad en nueva fecha/hora
    const disponible = verificarDisponibilidad(
      citas,
      nuevaFecha,
      nuevaHora,
      cita.employeeId,
      citaId // Excluir cita actual de conflictos
    );

    if (!disponible) {
      return res.status(409).json({
        error: 'Horario no disponible. Intenta con otro horario.'
      });
    }

    // Guardar datos anteriores
    const fechaAnterior = cita.fecha;
    const horaAnterior = cita.hora;

    // Actualizar cita
    cita.fecha = nuevaFecha;
    cita.hora = nuevaHora;
    cita.cambiadaEn = new Date().toISOString();
    cita.cambios = (cita.cambios || 0) + 1;

    // Reset flags de recordatorios
    cita.recordado24h = false;
    cita.recordado1h = false;
    cita.recordado24hAt = null;
    cita.recordado1hAt = null;

    dbService.writeJSON('citas.json', citas);

    console.log(`✅ [CAMBIO CITA] ${citaId}: ${fechaAnterior} ${horaAnterior} → ${nuevaFecha} ${nuevaHora}`);

    // Obtener datos del cliente para SMS
    const clientes = dbService.readJSON('clientes.json') || {};
    const cliente = Object.values(clientes).find(c => c.id === cita.clienteId);

    if (cliente && cliente.telefono) {
      await twilioService.confirmacionCambio(
        cliente.nombre,
        cliente.telefono,
        fechaAnterior,
        horaAnterior,
        nuevaFecha,
        nuevaHora
      );
    }

    // Registrar cambio en log
    const logCambios = dbService.readJSON('cambios_citas.json') || [];
    logCambios.push({
      citaId,
      clienteId: cita.clienteId,
      fechaAnterior,
      horaAnterior,
      fechaNueva: nuevaFecha,
      horaNueva: nuevaHora,
      timestamp: new Date().toISOString(),
      ipCliente: req.ip,
      userAgent: req.headers['user-agent']
    });
    dbService.writeJSON('cambios_citas.json', logCambios);

    res.json({
      success: true,
      message: 'Cita cambiad exitosamente',
      cita: {
        id: citaId,
        fechaAnterior,
        horaAnterior,
        fechaNueva: nuevaFecha,
        horaNueva: nuevaHora,
        confirmado: true
      }
    });

  } catch (error) {
    console.error('[CAMBIO CITA] Error:', error.message);
    res.status(500).json({
      error: 'Error al cambiar la cita',
      details: error.message
    });
  }
});

/**
 * POST /api/public/solicitar-cambio
 * Solicitar cambio de cita (frontend formula solicitud)
 * Requiere: emailCliente, codigoConfirmacion
 * Devuelve: horarios disponibles en próximos 7 días
 */
router.post('/solicitar-cambio', async (req, res) => {
  try {
    const { emailCliente, codigoConfirmacion } = req.body;

    if (!emailCliente || !codigoConfirmacion) {
      return res.status(400).json({
        error: 'Email y código de confirmación requeridos'
      });
    }

    // Buscar cita por email
    const citas = dbService.readJSON('citas.json') || {};
    const cita = Object.values(citas).find(c => {
      const clientes = dbService.readJSON('clientes.json') || {};
      const cliente = Object.values(clientes).find(cl => cl.id === c.clienteId);
      return cliente && cliente.email === emailCliente && c.codigoConfirmacion === codigoConfirmacion;
    });

    if (!cita) {
      return res.status(404).json({
        error: 'Cita o código incorrecto'
      });
    }

    // Generar horarios disponibles para los próximos 7 días
    const horarios = generarHorariosDisponibles(citas, cita.employeeId, 7);

    res.json({
      success: true,
      citaId: Object.keys(citas).find(key => citas[key] === cita),
      citaActual: {
        fecha: cita.fecha,
        hora: cita.hora,
        servicio: cita.servicio
      },
      horariosDisponibles: horarios,
      mensaje: 'Selecciona un nuevo horario para tu cita'
    });

  } catch (error) {
    console.error('[SOLICITAR CAMBIO] Error:', error.message);
    res.status(500).json({
      error: 'Error solicitando cambio',
      details: error.message
    });
  }
});

/**
 * POST /api/admin/cambios-citas
 * Listar todos los cambios de citas (admin)
 */
router.post('/cambios-citas', async (req, res) => {
  try {
    const cambios = dbService.readJSON('cambios_citas.json') || [];

    // Filtrar y paginar
    const { desde = 0, hasta = 50, clienteId = null } = req.body;

    let resultado = cambios;
    if (clienteId) {
      resultado = resultado.filter(c => c.clienteId === clienteId);
    }

    resultado = resultado
      .slice(desde, hasta)
      .reverse();

    res.json({
      success: true,
      total: cambios.length,
      mostrados: resultado.length,
      cambios: resultado
    });

  } catch (error) {
    console.error('[LISTAR CAMBIOS] Error:', error.message);
    res.status(500).json({
      error: 'Error listando cambios',
      details: error.message
    });
  }
});

/**
 * FUNCIONES AUXILIARES
 */

/**
 * Verificar si un horario está disponible
 */
function verificarDisponibilidad(citas, fecha, hora, employeeId, excludeCitaId = null) {
  const citasDelEmpleado = Object.values(citas).filter(
    c => c.employeeId === employeeId &&
        c.fecha === fecha &&
        c.id !== excludeCitaId &&
        c.estado !== 'cancelada'
  );

  // Verificar conflictos (asumiendo duraciones de 1 hora)
  const [horaRequest, minRequest] = hora.split(':').map(Number);
  
  for (const c of citasDelEmpleado) {
    const [horaExistente, minExistente] = c.hora.split(':').map(Number);
    // Conflicto si empiezan en la misma hora
    if (horaRequest === horaExistente) {
      return false;
    }
  }

  return true;
}

/**
 * Generar horarios disponibles para los próximos N días
 */
function generarHorariosDisponibles(citas, employeeId, dias = 7) {
  const horarios = {};
  const ahora = new Date();
  
  // Horario comercial: 08:00 - 20:00
  const horaInicio = 8;
  const horaFin = 20;

  for (let i = 1; i <= dias; i++) {
    const fecha = new Date(ahora);
    fecha.setDate(fecha.getDate() + i);
    
    // Excluir domingos
    if (fecha.getDay() === 0) continue;

    const fechaStr = fecha.toISOString().split('T')[0];
    horarios[fechaStr] = [];

    // Generar intervalos de 30 minutos
    for (let hora = horaInicio; hora < horaFin; hora++) {
      for (const min of ['00', '30']) {
        const horaStr = `${String(hora).padStart(2, '0')}:${min}`;
        
        if (verificarDisponibilidad(citas, fechaStr, horaStr, employeeId)) {
          horarios[fechaStr].push(horaStr);
        }
      }
    }
  }

  return horarios;
}

module.exports = router;
