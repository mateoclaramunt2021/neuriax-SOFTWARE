/**
 * Rutas API - Configuración de Salones
 * Endpoints para setup inicial de empresas
 * © 2026 NEURIAX
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { verificarToken } = require('../middleware/auth');

// Controlador de base de datos
const dbService = require('../database/dbService');

// Configuración de multer para subida de imágenes
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten archivos de imagen'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB máximo
  }
});

/**
 * POST /api/salon/generar-descripcion-ia
 * Genera descripción del salón con IA
 */
router.post('/generar-descripcion-ia', verificarToken, async (req, res) => {
  try {
    const { nombreSalon, tipo = 'peluqueria' } = req.body;

    if (!nombreSalon) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del salón es requerido.'
      });
    }

    // Descripción generada con plantillas profesionales
    const descripciones = {
      peluqueria: [
        `Bienvenido a ${nombreSalon}, tu salón de confianza. Contamos con un equipo de profesionales altamente capacitados en tendencias de corte, color y tratamientos capilares. Nuestro objetivo es que salgas de aquí sintiéndote renovado y confiado. Ofrecemos servicios de corte, tinte, tratamientos nutritivos y peinados especiales para eventos. ¡Ven a disfrutar de una experiencia única!`,
        
        `En ${nombreSalon} creemos que tu cabello es tu mejor accesorio. Nos especializamos en crear looks únicos y personalizados según tu estilo. Nuestras peluqueras están constantemente actualizadas con las últimas técnicas y tendencias de moda. Utilizamos productos de calidad premium para cuidar tu cabello. ¡Te esperamos!`,
        
        `${nombreSalon} es tu destino para transformaciones capilares de ensueño. Con más de una década de experiencia, nuestro equipo se dedica a crear cortes impecables, colores vibrantes y tratamientos rejuvenecedores. Cada cliente es único y merecedor de atención personalizada. ¡Reserva tu cita hoy!`
      ],
      estetica: [
        `Bienvenido a ${nombreSalon}, tu santuario de belleza y bienestar. Ofrecemos servicios completos de estética facial y corporal con las técnicas más modernas. Nuestras esteticientas son expertas certificadas en cuidado de piel, depilación, masajes y tratamientos rejuvenecedores. ¡Déjate cuidar!`,
        
        `En ${nombreSalon} tu belleza es nuestra pasión. Contamos con tratamientos especializados para cada tipo de piel y necesidad. Usamos productos naturales y de calidad certificada. Nuestro ambiente relajante es perfecto para que disfrutes de un día de spa. ¡Ven a renovarte!`
      ],
      barberia: [
        `Bienvenido a ${nombreSalon}, barbería premium para caballeros. Nos especializamos en cortes clásicos, modernos y diseños de barba. Nuestros barberos son maestros del oficio con atención al detalle. Utilizamos productos de calidad superior y técnicas tradicionales. ¡Tu estilo es nuestro arte!`,
        
        `En ${nombreSalon} nos dedicamos a perfeccionar tu imagen. Ofrecemos servicios de corte, afeitado de barbería y diseño de barba personalizado. Cada cliente recibe atención exclusiva en un ambiente cómodo y profesional. ¡Ven a experimentar la verdadera barbería!`
      ],
      general: [
        `Bienvenido a ${nombreSalon}, tu lugar de confianza para transformaciones de belleza. Contamos con profesionales expertos en todos los servicios capilares y estéticos. Nos comprometemos con tu satisfacción y bienestar. ¡Reserva tu cita hoy!`
      ]
    };

    const opciones = descripciones[tipo] || descripciones.general;
    const descripcionSeleccionada = opciones[Math.floor(Math.random() * opciones.length)];

    res.json({
      success: true,
      descripcion: descripcionSeleccionada,
      message: 'Descripción generada exitosamente'
    });
  } catch (error) {
    console.error('Error generando descripción IA:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar descripción. Intenta nuevamente.'
    });
  }
});

/**
 * POST /api/salon/configurar-perfil
 * Guarda la configuración inicial del perfil del salón
 */
router.post('/configurar-perfil', verificarToken, upload.array('imagenes', 5), async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { nombreSalon, descripcion, whatsapp, googleMaps, paginaWeb } = req.body;

    // Validaciones
    if (!nombreSalon || !descripcion || !whatsapp || !paginaWeb) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben ser completados.'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debes subir al menos una imagen.'
      });
    }

    // Crear carpeta de imágenes si no existe
    const uploadsDir = path.join(__dirname, '../../client/public/uploads/salones', usuarioId);
    await fs.mkdir(uploadsDir, { recursive: true });

    // Guardar imágenes
    const imagenesGuardadas = [];
    for (const file of req.files) {
      const nombreArchivo = `${uuidv4()}${path.extname(file.originalname)}`;
      const rutaArchivo = path.join(uploadsDir, nombreArchivo);
      
      await fs.writeFile(rutaArchivo, file.buffer);
      imagenesGuardadas.push(`/uploads/salones/${usuarioId}/${nombreArchivo}`);
    }

    // Guardar configuración en la base de datos
    const configSalon = {
      usuarioId,
      nombreSalon: nombreSalon.trim(),
      descripcion: descripcion.trim(),
      whatsapp: whatsapp.trim(),
      googleMaps: googleMaps.trim(),
      paginaWeb: paginaWeb.trim(),
      imagenes: imagenesGuardadas,
      perfilCompletado: true,
      fechaCreacion: new Date().toISOString()
    };

    // Guardar en base de datos
    await dbService.guardarSalonSetup(usuarioId, configSalon);

    res.json({
      success: true,
      message: 'Perfil de salón configurado exitosamente.',
      salon: configSalon
    });
  } catch (error) {
    console.error('Error configurando perfil del salón:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar configuración. Intenta nuevamente.'
    });
  }
});

/**
 * GET /api/salon/configuracion/:usuarioId
 * Obtiene configuración del salón
 */
router.get('/configuracion/:usuarioId', verificarToken, async (req, res) => {
  try {
    const { usuarioId } = req.params;

    // Verificar que el usuario solo acceda a su propia configuración
    if (req.usuario.id !== usuarioId && req.usuario.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a esta información.'
      });
    }

    const configSalon = await dbService.obtenerSalonSetup(usuarioId);

    if (!configSalon) {
      return res.status(404).json({
        success: false,
        message: 'Configuración de salón no encontrada.'
      });
    }

    res.json({
      success: true,
      salon: configSalon
    });
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración.'
    });
  }
});

/**
 * PUT /api/salon/configuracion/:usuarioId
 * Actualiza configuración del salón
 */
router.put('/configuracion/:usuarioId', verificarToken, upload.array('imagenes', 5), async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { nombreSalon, descripcion, whatsapp, googleMaps, paginaWeb } = req.body;

    // Verificar permisos
    if (req.usuario.id !== usuarioId && req.usuario.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar esta información.'
      });
    }

    // Validaciones
    if (!nombreSalon || !descripcion || !whatsapp || !paginaWeb) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben ser completados.'
      });
    }

    const configActualizada = {
      nombreSalon: nombreSalon.trim(),
      descripcion: descripcion.trim(),
      whatsapp: whatsapp.trim(),
      googleMaps: googleMaps.trim(),
      paginaWeb: paginaWeb.trim(),
      fechaActualizacion: new Date().toISOString()
    };

    // Manejar nuevas imágenes si existen
    if (req.files && req.files.length > 0) {
      const uploadsDir = path.join(__dirname, '../../client/public/uploads/salones', usuarioId);
      await fs.mkdir(uploadsDir, { recursive: true });

      const imagenesGuardadas = [];
      for (const file of req.files) {
        const nombreArchivo = `${uuidv4()}${path.extname(file.originalname)}`;
        const rutaArchivo = path.join(uploadsDir, nombreArchivo);
        
        await fs.writeFile(rutaArchivo, file.buffer);
        imagenesGuardadas.push(`/uploads/salones/${usuarioId}/${nombreArchivo}`);
      }

      configActualizada.imagenes = imagenesGuardadas;
    }

    // Actualizar en base de datos
    await dbService.actualizarSalonSetup(usuarioId, configActualizada);

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente.',
      salon: configActualizada
    });
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración.'
    });
  }
});

/**
 * PUT /api/salon/marketplace-perfil
 * Actualiza el perfil del salón para el marketplace
 * Incluye: nombre, descripción, ciudad, horarios, etc.
 */
router.put('/marketplace-perfil', verificarToken, upload.array('imagenes', 5), async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const tenantId = req.usuario.tenant_id;
    const { 
      nombre, 
      descripcion, 
      ciudad, 
      horarios,
      telefono,
      email,
      website,
      mostrarEnMarketplace 
    } = req.body;

    // Cargar BD de tenants
    const tenantsPath = path.join(__dirname, '..', 'database', 'tenants.json');
    const tenantsData = JSON.parse(await fs.readFile(tenantsPath, 'utf8'));
    
    // Encontrar tenant del usuario
    let tenant = tenantsData.tenants.find(t => t.id === tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant no encontrado'
      });
    }

    // Actualizar información del tenant
    if (nombre) tenant.nombre = nombre.trim();
    if (descripcion) tenant.descripcion = descripcion.trim();
    if (ciudad) tenant.ciudad = ciudad.trim();
    if (telefono) tenant.telefono = telefono.trim();
    if (email) tenant.email = email.trim();
    if (website) tenant.web = website.trim();
    
    // Controlar visibilidad en marketplace
    if (mostrarEnMarketplace !== undefined) {
      if (!tenant.configuracion) tenant.configuracion = {};
      tenant.configuracion.reservasOnline = mostrarEnMarketplace === 'true' || mostrarEnMarketplace === true;
    }

    // Actualizar horarios si se proporcionan
    if (horarios) {
      try {
        const horariosObj = typeof horarios === 'string' ? JSON.parse(horarios) : horarios;
        tenant.horario = horariosObj;
      } catch (e) {
        console.log('No se pudo parsear horarios');
      }
    }

    // Manejar imágenes si existen
    if (req.files && req.files.length > 0) {
      const uploadsDir = path.join(__dirname, '../../client/public/uploads/salones', usuarioId);
      await fs.mkdir(uploadsDir, { recursive: true });

      const imagenesGuardadas = [];
      for (const file of req.files) {
        const nombreArchivo = `${uuidv4()}${path.extname(file.originalname)}`;
        const rutaArchivo = path.join(uploadsDir, nombreArchivo);
        
        await fs.writeFile(rutaArchivo, file.buffer);
        imagenesGuardadas.push(`/uploads/salones/${usuarioId}/${nombreArchivo}`);
      }

      if (!tenant.configuracion) tenant.configuracion = {};
      tenant.configuracion.galeriaImagenes = imagenesGuardadas;
    }

    // Guardar cambios en tenants.json
    tenant.fechaActualizacion = new Date().toISOString();
    await fs.writeFile(tenantsPath, JSON.stringify(tenantsData, null, 2));

    res.json({
      success: true,
      message: 'Perfil del marketplace actualizado exitosamente.',
      salon: {
        nombre: tenant.nombre,
        descripcion: tenant.descripcion,
        ciudad: tenant.ciudad,
        telefono: tenant.telefono,
        email: tenant.email,
        website: tenant.web,
        mostrarEnMarketplace: tenant.configuracion?.reservasOnline !== false,
        horarios: tenant.horario
      }
    });

  } catch (error) {
    console.error('Error actualizando perfil marketplace:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil del marketplace.'
    });
  }
});

/**
 * GET /api/salon/marketplace-perfil
 * Obtiene el perfil actual del salón en el marketplace
 */
router.get('/marketplace-perfil', verificarToken, async (req, res) => {
  try {
    const tenantId = req.usuario.tenant_id;

    // Cargar BD de tenants
    const tenantsPath = path.join(__dirname, '..', 'database', 'tenants.json');
    const tenantsData = JSON.parse(await fs.readFile(tenantsPath, 'utf8'));
    
    const tenant = tenantsData.tenants.find(t => t.id === tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant no encontrado'
      });
    }

    res.json({
      success: true,
      salon: {
        nombre: tenant.nombre,
        descripcion: tenant.descripcion,
        ciudad: tenant.ciudad,
        telefono: tenant.telefono,
        email: tenant.email,
        website: tenant.web,
        mostrarEnMarketplace: tenant.configuracion?.reservasOnline !== false,
        horarios: tenant.horario,
        imagenes: tenant.configuracion?.galeriaImagenes || [],
        activo: tenant.activo !== false
      }
    });

  } catch (error) {
    console.error('Error obteniendo perfil marketplace:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil del marketplace.'
    });
  }
});

module.exports = router;
