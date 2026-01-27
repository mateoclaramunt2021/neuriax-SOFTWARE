/**
 * NEURIAX - Sistema de Trial de 7 días
 * Maneja registro público con trial y verificación de expiración
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const authService = require('../services/authService');
const emailService = require('../services/emailService');

const router = express.Router();

// Ruta de base de datos
const tenantsPath = path.join(__dirname, '../database/tenants.json');
const dbPath = path.join(__dirname, '../database/database.json');

/**
 * Cargar base de datos de tenants
 */
function loadTenantsDb() {
  try {
    if (fs.existsSync(tenantsPath)) {
      return JSON.parse(fs.readFileSync(tenantsPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error cargando tenants:', error);
  }
  return { tenants: [] };
}

/**
 * Guardar base de datos de tenants
 */
function saveTenantsDb(data) {
  fs.writeFileSync(tenantsPath, JSON.stringify(data, null, 2));
}

/**
 * Cargar base de datos principal
 */
function loadMainDb() {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error cargando DB:', error);
  }
  return { usuarios: [] };
}

/**
 * Guardar base de datos principal
 */
function saveMainDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

/**
 * POST /api/trial/register
 * Registro público con trial de 7 días
 */
router.post('/register', async (req, res) => {
  try {
    const { 
      businessName,
      businessType,
      address,
      email, 
      password,
      ownerName,
      username,
      phone,
      acceptMarketing
    } = req.body;

    // Validaciones
    if (!businessName || !email || !password || !ownerName || !username) {
      return res.status(400).json({
        success: false,
        error: 'Nombre del negocio, email, contraseña, nombre de usuario y nombre del propietario son requeridos'
      });
    }

    // Validar username
    if (username.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'El nombre de usuario debe tener al menos 4 caracteres'
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        error: 'El nombre de usuario solo puede contener letras, números y guiones bajos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido'
      });
    }

    // Cargar bases de datos
    const tenantsDb = loadTenantsDb();
    const mainDb = loadMainDb();

    // Verificar que email no exista
    const emailExists = tenantsDb.tenants.some(t => t.email === email) ||
                        mainDb.usuarios.some(u => u.email === email);
    
    if (emailExists) {
      return res.status(400).json({
        success: false,
        error: 'Este email ya está registrado'
      });
    }

    // Verificar que username no exista
    const usernameExists = mainDb.usuarios.some(u => u.username === username.toLowerCase());
    
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        error: 'Este nombre de usuario ya está en uso. Prueba con otro.'
      });
    }

    // Generar IDs únicos
    const tenantId = `tenant_${Date.now()}`;
    const tenantUuid = uuidv4();
    const userId = Math.max(...mainDb.usuarios.map(u => u.id || 0), 0) + 1;

    // Calcular fecha de expiración del trial (7 días)
    const trialStart = new Date();
    const trialEnd = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + 7);

    // Crear nuevo tenant con trial
    const newTenant = {
      id: tenantId,
      uuid: tenantUuid,
      nombre: businessName,
      slug: businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
      tipo_negocio: businessType || 'peluqueria',
      email: email,
      telefono: phone || '',
      direccion: address || '',
      plan_id: 'trial',
      estado: 'trial',
      fecha_creacion: trialStart.toISOString(),
      trial_start: trialStart.toISOString(),
      trial_end: trialEnd.toISOString(),
      fecha_expiracion: trialEnd.toISOString(),
      accept_marketing: acceptMarketing || false,
      configuracion: {
        nombre_negocio: businessName,
        logo_url: null,
        color_primario: '#6366f1',
        color_secundario: '#8b5cf6',
        timezone: 'Europe/Madrid',
        idioma: 'es',
        moneda: 'EUR',
        formato_fecha: 'DD/MM/YYYY',
        formato_hora: '24h'
      },
      limites_uso: {
        usuarios_actuales: 1,
        clientes_actuales: 0,
        citas_este_mes: 0,
        almacenamiento_usado_mb: 0
      },
      metadata: {
        ip_registro: req.ip || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown',
        referral: req.body.referral || null
      }
    };

    // Crear usuario administrador del tenant
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
      id: userId,
      username: username.toLowerCase(),
      email: email,
      password: hashedPassword,
      nombre_completo: ownerName,
      tenant_id: tenantId,
      rol: 'admin',
      activo: 1,
      verificado: true,
      fecha_creacion: trialStart.toISOString(),
      ultimo_acceso: trialStart.toISOString(),
      permisos: ['admin', 'dashboard', 'clientes', 'citas', 'ventas', 'inventario', 'reportes', 'empleados', 'configuracion']
    };

    // Guardar en bases de datos
    tenantsDb.tenants.push(newTenant);
    mainDb.usuarios.push(newUser);

    saveTenantsDb(tenantsDb);
    saveMainDb(mainDb);

    // Crear base de datos del tenant
    const tenantDbPath = path.join(__dirname, `../database/tenant_${tenantId}.json`);
    const tenantData = {
      clientes: [],
      citas: [],
      servicios: [],
      productos: [],
      ventas: [],
      empleados: [{
        id: 1,
        nombre: ownerName,
        email: email,
        telefono: phone || '',
        rol: 'propietario',
        activo: 1,
        fecha_creacion: trialStart.toISOString()
      }],
      configuracion: newTenant.configuracion
    };
    fs.writeFileSync(tenantDbPath, JSON.stringify(tenantData, null, 2));

    // Generar tokens
    const accessToken = authService.generateAccessToken(newUser);
    const refreshToken = authService.generateRefreshToken(newUser, {
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    // Enviar email de bienvenida
    try {
      await emailService.enviarEmailBienvenidaTrial({
        email: email,
        nombreUsuario: ownerName,
        nombreNegocio: businessName,
        username: newUser.username,
        fechaExpiracion: trialEnd.toISOString(),
        diasRestantes: 7
      });
      console.log(`📧 Email de bienvenida enviado a ${email}`);
    } catch (emailError) {
      console.error('⚠️ Error enviando email de bienvenida:', emailError.message);
      // No fallar el registro por error de email
    }

    res.status(201).json({
      success: true,
      message: '¡Bienvenido! Tu prueba gratuita de 7 días ha comenzado.',
      token: accessToken,
      refreshToken: refreshToken,
      expiresIn: 900,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        nombre_completo: newUser.nombre_completo,
        tenantId: tenantId,
        rol: newUser.rol,
        permisos: newUser.permisos
      },
      tenant: {
        id: tenantId,
        nombre: businessName,
        plan: 'trial',
        trial_end: trialEnd.toISOString(),
        dias_restantes: 7
      }
    });

  } catch (error) {
    console.error('Error en registro trial:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la cuenta. Inténtalo de nuevo.'
    });
  }
});

/**
 * POST /api/trial/upgrade
 * Redirigir a página de upgrade cuando el trial expire
 */
router.post('/upgrade', (req, res) => {
  try {
    const { planId } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token requerido' });
    }

    const verification = authService.verifyAccessToken(token);
    if (!verification.valid) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    // Aquí se integraría con Stripe para el checkout
    res.json({
      success: true,
      message: 'Redirigiendo a checkout...',
      checkoutUrl: `/checkout/${planId || 'professional'}`
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error' });
  }
});

/**
 * GET /api/trial/status
 * Obtener estado del trial del usuario autenticado
 */
router.get('/status', (req, res) => {
  try {
    const { getDatabase, loadDatabase } = require('../database/init');
    const authService = require('../services/authService');

    loadDatabase();
    const db = getDatabase();

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token requerido'
      });
    }

    const verification = authService.verifyAccessToken(token);
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    const usuarioId = verification.decoded.id;
    const usuario = db.usuarios.find(u => u.id === usuarioId);

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Si es cliente, no tiene trial
    if (usuario.tipo_usuario === 'cliente') {
      return res.json({
        success: true,
        data: {
          isTrial: false,
          diasRestantes: null,
          status: 'cliente',
          planId: 'cliente',
          planNombre: 'Cliente'
        }
      });
    }

    // Obtener tenant del usuario
    const tenant = db.tenants?.find(t => t.id === usuario.tenant_id);
    if (!tenant) {
      return res.status(400).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    // Calcular estado del trial
    const planId = tenant.plan || 'trial';
    const isTrial = planId === 'trial';

    let diasRestantes = null;
    let trialStatus = 'activo';

    if (isTrial && tenant.dias_trial && tenant.fecha_inicio_trial) {
      const fechaInicio = new Date(tenant.fecha_inicio_trial);
      const ahora = new Date();
      const diasTranscurridos = Math.floor((ahora - fechaInicio) / (1000 * 60 * 60 * 24));
      diasRestantes = Math.max(0, tenant.dias_trial - diasTranscurridos);

      if (diasRestantes === 0) {
        trialStatus = 'expirado';
      } else if (diasRestantes <= 3) {
        trialStatus = 'critico';
      } else if (diasRestantes <= 7) {
        trialStatus = 'alerta';
      }
    }

    res.json({
      success: true,
      data: {
        isTrial: isTrial,
        diasRestantes: diasRestantes,
        status: trialStatus,
        planId: planId,
        planNombre: tenant.nombre || 'Trial',
        tenant: {
          id: tenant.id,
          nombre: tenant.nombre,
          fechaInicio: tenant.fecha_inicio_trial,
          diasTrial: tenant.dias_trial
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo estado del trial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estado del trial',
      error: error.message
    });
  }
});

module.exports = router;
