/**
 * Rutas Públicas - Sistema de Reservas Online
 * Endpoints accesibles sin autenticación para clientes finales
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Helper para leer archivos JSON de tenants
const readTenantData = (tenantId, filename) => {
  try {
    const filePath = path.join(__dirname, '..', 'database', `tenant_${tenantId}`, `${filename}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return [];
  } catch (error) {
    console.error(`Error leyendo ${filename} de tenant ${tenantId}:`, error);
    return [];
  }
};

// Helper para escribir archivos JSON de tenants
const writeTenantData = (tenantId, filename, data) => {
  try {
    const dirPath = path.join(__dirname, '..', 'database', `tenant_${tenantId}`);
    const filePath = path.join(dirPath, `${filename}.json`);
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error escribiendo ${filename} de tenant ${tenantId}:`, error);
    return false;
  }
};

// Leer lista de tenants
const getTenantsDB = () => {
  try {
    const filePath = path.join(__dirname, '..', 'database', 'tenants.json');
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return [];
  } catch (error) {
    return [];
  }
};

/**
 * GET /api/public/salones
 * Lista todos los salones públicos disponibles para reservas
 */
router.get('/salones', async (req, res) => {
  try {
    const tenants = getTenantsDB();
    const { busqueda, ciudad, orden } = req.query;
    
    // Filtrar solo tenants activos con reservas online habilitadas
    let salones = tenants
      .filter(t => t.activo !== false && t.configuracion?.reservasOnline !== false)
      .map(t => {
        // Cargar configuración adicional del tenant
        const config = readTenantData(t.id, 'configuracion');
        const servicios = readTenantData(t.id, 'servicios');
        const empleados = readTenantData(t.id, 'empleados');
        
        return {
          id: t.id,
          nombre: t.nombre || t.empresa || 'Salón de Belleza',
          slug: t.slug || t.id,
          descripcion: t.descripcion || config.descripcion || 'Tu salón de confianza',
          logo: t.logo || config.logo || null,
          imagen: t.imagen || config.imagenPortada || '/default-salon.jpg',
          direccion: t.direccion || config.direccion || '',
          ciudad: t.ciudad || config.ciudad || '',
          telefono: t.telefono || config.telefono || '',
          email: t.email || '',
          horario: t.horario || config.horario || {
            lunes: { abierto: true, apertura: '09:00', cierre: '20:00' },
            martes: { abierto: true, apertura: '09:00', cierre: '20:00' },
            miercoles: { abierto: true, apertura: '09:00', cierre: '20:00' },
            jueves: { abierto: true, apertura: '09:00', cierre: '20:00' },
            viernes: { abierto: true, apertura: '09:00', cierre: '20:00' },
            sabado: { abierto: true, apertura: '09:00', cierre: '14:00' },
            domingo: { abierto: false }
          },
          serviciosCount: servicios.length || 0,
          empleadosCount: empleados.filter(e => e.activo !== false).length || 0,
          valoracion: t.valoracion || 4.5,
          numResenas: t.numResenas || 0,
          destacado: t.destacado || false,
          precioMinimo: servicios.length > 0 
            ? Math.min(...servicios.map(s => s.precio || 0))
            : 0,
          categorias: [...new Set(servicios.map(s => s.categoria).filter(Boolean))]
        };
      });

    // Aplicar filtros
    if (busqueda) {
      const term = busqueda.toLowerCase();
      salones = salones.filter(s => 
        s.nombre.toLowerCase().includes(term) ||
        s.descripcion.toLowerCase().includes(term) ||
        s.ciudad.toLowerCase().includes(term)
      );
    }

    if (ciudad) {
      salones = salones.filter(s => 
        s.ciudad.toLowerCase() === ciudad.toLowerCase()
      );
    }

    // Ordenar
    switch (orden) {
      case 'valoracion':
        salones.sort((a, b) => b.valoracion - a.valoracion);
        break;
      case 'precio':
        salones.sort((a, b) => a.precioMinimo - b.precioMinimo);
        break;
      case 'nombre':
        salones.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      default:
        // Por defecto: destacados primero, luego por valoración
        salones.sort((a, b) => {
          if (a.destacado !== b.destacado) return b.destacado ? 1 : -1;
          return b.valoracion - a.valoracion;
        });
    }

    res.json({
      success: true,
      total: salones.length,
      salones
    });

  } catch (error) {
    console.error('Error obteniendo salones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener salones'
    });
  }
});

/**
 * GET /api/public/salones/:id
 * Obtiene información detallada de un salón específico
 */
router.get('/salones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenants = getTenantsDB();
    
    const tenant = tenants.find(t => t.id === id || t.slug === id);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Salón no encontrado'
      });
    }

    // Cargar datos del tenant
    const config = readTenantData(tenant.id, 'configuracion');
    const servicios = readTenantData(tenant.id, 'servicios');
    const empleados = readTenantData(tenant.id, 'empleados')
      .filter(e => e.activo !== false)
      .map(e => ({
        id: e.id,
        nombre: e.nombre,
        especialidad: e.especialidad || e.cargo || 'Estilista',
        foto: e.foto || null,
        servicios: e.servicios || [],
        horario: e.horario || {}
      }));

    const salon = {
      id: tenant.id,
      nombre: tenant.nombre || tenant.empresa || 'Salón de Belleza',
      slug: tenant.slug || tenant.id,
      descripcion: tenant.descripcion || config.descripcion || 'Tu salón de confianza',
      logo: tenant.logo || config.logo || null,
      imagen: tenant.imagen || config.imagenPortada || '/default-salon.jpg',
      galeria: config.galeria || [],
      direccion: tenant.direccion || config.direccion || '',
      ciudad: tenant.ciudad || config.ciudad || '',
      codigoPostal: config.codigoPostal || '',
      telefono: tenant.telefono || config.telefono || '',
      email: tenant.email || '',
      web: config.web || '',
      instagram: config.instagram || '',
      facebook: config.facebook || '',
      horario: tenant.horario || config.horario || {
        lunes: { abierto: true, apertura: '09:00', cierre: '20:00' },
        martes: { abierto: true, apertura: '09:00', cierre: '20:00' },
        miercoles: { abierto: true, apertura: '09:00', cierre: '20:00' },
        jueves: { abierto: true, apertura: '09:00', cierre: '20:00' },
        viernes: { abierto: true, apertura: '09:00', cierre: '20:00' },
        sabado: { abierto: true, apertura: '09:00', cierre: '14:00' },
        domingo: { abierto: false }
      },
      valoracion: tenant.valoracion || 4.5,
      numResenas: tenant.numResenas || 0,
      servicios: servicios.map(s => ({
        id: s.id,
        nombre: s.nombre,
        descripcion: s.descripcion || '',
        precio: s.precio || 0,
        duracion: s.duracion || 30,
        categoria: s.categoria || 'General',
        imagen: s.imagen || null
      })),
      empleados,
      politicaCancelacion: config.politicaCancelacion || 'Cancelación gratuita hasta 24 horas antes de la cita.',
      requiereDeposito: config.requiereDeposito || false,
      porcentajeDeposito: config.porcentajeDeposito || 0
    };

    res.json({
      success: true,
      salon
    });

  } catch (error) {
    console.error('Error obteniendo salón:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del salón'
    });
  }
});

/**
 * GET /api/public/salones/:id/disponibilidad
 * Obtiene horarios disponibles para un día específico
 */
router.get('/salones/:id/disponibilidad', async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, servicioId, empleadoId } = req.query;

    if (!fecha || !servicioId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere fecha y servicioId'
      });
    }

    const tenants = getTenantsDB();
    const tenant = tenants.find(t => t.id === id || t.slug === id);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Salón no encontrado'
      });
    }

    // Cargar datos
    const config = readTenantData(tenant.id, 'configuracion');
    const servicios = readTenantData(tenant.id, 'servicios');
    const empleados = readTenantData(tenant.id, 'empleados').filter(e => e.activo !== false);
    const citas = readTenantData(tenant.id, 'citas');

    const servicio = servicios.find(s => s.id === servicioId);
    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    const duracionServicio = servicio.duracion || 30;
    const fechaDate = new Date(fecha);
    const diaSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][fechaDate.getDay()];
    
    // Obtener horario del día
    const horario = tenant.horario || config.horario || {
      [diaSemana]: { abierto: true, apertura: '09:00', cierre: '20:00' }
    };
    
    const horarioDia = horario[diaSemana];
    
    if (!horarioDia || !horarioDia.abierto) {
      return res.json({
        success: true,
        disponibilidad: [],
        mensaje: 'El salón está cerrado este día'
      });
    }

    // Generar slots de tiempo
    const slots = [];
    const [horaApertura, minApertura] = horarioDia.apertura.split(':').map(Number);
    const [horaCierre, minCierre] = horarioDia.cierre.split(':').map(Number);
    
    let currentTime = horaApertura * 60 + minApertura;
    const endTime = horaCierre * 60 + minCierre;

    // Filtrar empleados que ofrecen este servicio
    let empleadosDisponibles = empleados;
    if (empleadoId) {
      empleadosDisponibles = empleados.filter(e => e.id === empleadoId);
    }

    // Citas del día
    const citasDelDia = citas.filter(c => 
      c.fecha === fecha && 
      c.estado !== 'cancelada' &&
      c.estado !== 'no_asistio'
    );

    while (currentTime + duracionServicio <= endTime) {
      const hora = Math.floor(currentTime / 60);
      const minutos = currentTime % 60;
      const horaStr = `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
      
      // Verificar disponibilidad por empleado
      const empleadosLibres = empleadosDisponibles.filter(emp => {
        // Verificar horario del empleado
        const horarioEmp = emp.horario?.[diaSemana];
        if (horarioEmp && !horarioEmp.trabaja) {
          return false;
        }

        // Verificar si tiene cita en ese horario
        const tieneConflicto = citasDelDia.some(cita => {
          if (cita.empleadoId !== emp.id) return false;
          
          const [citaHora, citaMin] = cita.hora.split(':').map(Number);
          const citaInicio = citaHora * 60 + citaMin;
          const citaFin = citaInicio + (cita.duracion || 30);
          
          const slotInicio = currentTime;
          const slotFin = currentTime + duracionServicio;
          
          return (slotInicio < citaFin && slotFin > citaInicio);
        });
        
        return !tieneConflicto;
      });

      if (empleadosLibres.length > 0) {
        slots.push({
          hora: horaStr,
          disponible: true,
          empleados: empleadosLibres.map(e => ({
            id: e.id,
            nombre: e.nombre
          }))
        });
      }

      currentTime += 30; // Slots cada 30 minutos
    }

    res.json({
      success: true,
      fecha,
      servicio: {
        id: servicio.id,
        nombre: servicio.nombre,
        duracion: duracionServicio,
        precio: servicio.precio
      },
      disponibilidad: slots
    });

  } catch (error) {
    console.error('Error obteniendo disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener disponibilidad'
    });
  }
});

/**
 * POST /api/public/reservas
 * Crea una nueva reserva
 */
router.post('/reservas', async (req, res) => {
  try {
    const {
      salonId,
      servicioId,
      empleadoId,
      fecha,
      hora,
      cliente
    } = req.body;

    // Validaciones
    if (!salonId || !servicioId || !fecha || !hora || !cliente) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos'
      });
    }

    if (!cliente.nombre || !cliente.telefono) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere nombre y teléfono del cliente'
      });
    }

    const tenants = getTenantsDB();
    const tenant = tenants.find(t => t.id === salonId || t.slug === salonId);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Salón no encontrado'
      });
    }

    // Verificar servicio
    const servicios = readTenantData(tenant.id, 'servicios');
    const servicio = servicios.find(s => s.id === servicioId);
    
    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    // Verificar empleado si se especifica
    let empleado = null;
    if (empleadoId) {
      const empleados = readTenantData(tenant.id, 'empleados');
      empleado = empleados.find(e => e.id === empleadoId && e.activo !== false);
      
      if (!empleado) {
        return res.status(404).json({
          success: false,
          message: 'Empleado no encontrado'
        });
      }
    }

    // Verificar disponibilidad
    const citas = readTenantData(tenant.id, 'citas');
    const duracion = servicio.duracion || 30;
    
    const [horaReserva, minReserva] = hora.split(':').map(Number);
    const inicioReserva = horaReserva * 60 + minReserva;
    const finReserva = inicioReserva + duracion;

    const hayConflicto = citas.some(cita => {
      if (cita.fecha !== fecha || cita.estado === 'cancelada') return false;
      if (empleadoId && cita.empleadoId !== empleadoId) return false;
      
      const [citaH, citaM] = cita.hora.split(':').map(Number);
      const citaInicio = citaH * 60 + citaM;
      const citaFin = citaInicio + (cita.duracion || 30);
      
      return (inicioReserva < citaFin && finReserva > citaInicio);
    });

    if (hayConflicto) {
      return res.status(409).json({
        success: false,
        message: 'El horario seleccionado ya no está disponible'
      });
    }

    // Crear o buscar cliente
    let clientes = readTenantData(tenant.id, 'clientes');
    let clienteExistente = clientes.find(c => 
      c.telefono === cliente.telefono || 
      (cliente.email && c.email === cliente.email)
    );

    if (!clienteExistente) {
      clienteExistente = {
        id: `cli_${Date.now()}`,
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        email: cliente.email || '',
        notas: cliente.notas || '',
        fechaRegistro: new Date().toISOString(),
        origen: 'reserva_online'
      };
      clientes.push(clienteExistente);
      writeTenantData(tenant.id, 'clientes', clientes);
    }

    // Crear la cita
    const nuevaCita = {
      id: `cita_${Date.now()}`,
      clienteId: clienteExistente.id,
      clienteNombre: clienteExistente.nombre,
      clienteTelefono: clienteExistente.telefono,
      clienteEmail: clienteExistente.email,
      servicioId: servicio.id,
      servicioNombre: servicio.nombre,
      empleadoId: empleado?.id || null,
      empleadoNombre: empleado?.nombre || 'Sin asignar',
      fecha,
      hora,
      duracion,
      precio: servicio.precio,
      estado: 'pendiente',
      notas: cliente.notas || '',
      origen: 'online',
      fechaCreacion: new Date().toISOString(),
      codigoConfirmacion: generarCodigoConfirmacion()
    };

    citas.push(nuevaCita);
    writeTenantData(tenant.id, 'citas', citas);

    // TODO: Enviar email de confirmación
    // TODO: Enviar SMS de confirmación

    res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      reserva: {
        id: nuevaCita.id,
        codigo: nuevaCita.codigoConfirmacion,
        salon: tenant.nombre || tenant.empresa,
        servicio: servicio.nombre,
        empleado: empleado?.nombre || 'Por asignar',
        fecha: nuevaCita.fecha,
        hora: nuevaCita.hora,
        duracion: nuevaCita.duracion,
        precio: servicio.precio
      }
    });

  } catch (error) {
    console.error('Error creando reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la reserva'
    });
  }
});

/**
 * GET /api/public/reservas/:codigo
 * Consulta una reserva por código de confirmación
 */
router.get('/reservas/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const tenants = getTenantsDB();

    // Buscar en todos los tenants
    for (const tenant of tenants) {
      const citas = readTenantData(tenant.id, 'citas');
      const cita = citas.find(c => c.codigoConfirmacion === codigo);
      
      if (cita) {
        return res.json({
          success: true,
          reserva: {
            id: cita.id,
            codigo: cita.codigoConfirmacion,
            salon: tenant.nombre || tenant.empresa,
            salonTelefono: tenant.telefono || '',
            salonDireccion: tenant.direccion || '',
            servicio: cita.servicioNombre,
            empleado: cita.empleadoNombre,
            fecha: cita.fecha,
            hora: cita.hora,
            duracion: cita.duracion,
            precio: cita.precio,
            estado: cita.estado,
            cliente: {
              nombre: cita.clienteNombre,
              telefono: cita.clienteTelefono
            }
          }
        });
      }
    }

    res.status(404).json({
      success: false,
      message: 'Reserva no encontrada'
    });

  } catch (error) {
    console.error('Error consultando reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al consultar la reserva'
    });
  }
});

/**
 * PUT /api/public/reservas/:codigo/cancelar
 * Cancela una reserva
 */
router.put('/reservas/:codigo/cancelar', async (req, res) => {
  try {
    const { codigo } = req.params;
    const { motivo } = req.body;
    const tenants = getTenantsDB();

    for (const tenant of tenants) {
      const citas = readTenantData(tenant.id, 'citas');
      const citaIndex = citas.findIndex(c => c.codigoConfirmacion === codigo);
      
      if (citaIndex !== -1) {
        const cita = citas[citaIndex];
        
        // Verificar si ya está cancelada
        if (cita.estado === 'cancelada') {
          return res.status(400).json({
            success: false,
            message: 'La reserva ya está cancelada'
          });
        }

        // Verificar política de cancelación (24 horas antes)
        const fechaCita = new Date(`${cita.fecha}T${cita.hora}`);
        const ahora = new Date();
        const horasAntes = (fechaCita - ahora) / (1000 * 60 * 60);
        
        if (horasAntes < 24) {
          return res.status(400).json({
            success: false,
            message: 'No se puede cancelar con menos de 24 horas de anticipación'
          });
        }

        // Cancelar
        citas[citaIndex] = {
          ...cita,
          estado: 'cancelada',
          motivoCancelacion: motivo || 'Cancelado por el cliente',
          fechaCancelacion: new Date().toISOString(),
          canceladoPor: 'cliente'
        };

        writeTenantData(tenant.id, 'citas', citas);

        // TODO: Enviar email de cancelación

        return res.json({
          success: true,
          message: 'Reserva cancelada exitosamente'
        });
      }
    }

    res.status(404).json({
      success: false,
      message: 'Reserva no encontrada'
    });

  } catch (error) {
    console.error('Error cancelando reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar la reserva'
    });
  }
});

/**
 * GET /api/public/ciudades
 * Lista las ciudades con salones disponibles
 */
router.get('/ciudades', async (req, res) => {
  try {
    const tenants = getTenantsDB();
    
    const ciudades = [...new Set(
      tenants
        .filter(t => t.activo !== false)
        .map(t => t.ciudad || '')
        .filter(Boolean)
    )].sort();

    res.json({
      success: true,
      ciudades
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener ciudades'
    });
  }
});

// Helper para generar código de confirmación
function generarCodigoConfirmacion() {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
}

module.exports = router;
