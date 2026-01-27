const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase, saveDatabase, loadDatabase } = require('../database/init');
const authService = require('../services/authService');
const securityService = require('../services/securityService');
const emailService = require('../services/emailService');

const router = express.Router();

// LOGIN - PASO 9: Sistema JWT con Seguridad Reforzada
router.post('/login', async (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { username, password, rememberMe } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Usuario y contraseña son requeridos' 
      });
    }

    // PASO 9: Verificar rate limiting
    const rateLimit = securityService.checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
        retryAfter: rateLimit.retryAfter
      });
    }

    // PASO 9: Verificar si la cuenta/IP está bloqueada
    const lockCheck = securityService.isAccountLocked(username);
    if (lockCheck.locked) {
      return res.status(423).json({
        success: false,
        message: lockCheck.message,
        lockedUntil: lockCheck.lockedUntil,
        remainingMinutes: lockCheck.remainingMinutes
      });
    }

    // Buscar usuario por username O email (para más flexibilidad)
    const usuario = db.usuarios.find(u => 
      (u.username === username || u.email === username) && u.activo === 1
    );

    if (!usuario) {
      // PASO 9: Registrar intento fallido
      const failedResult = securityService.recordFailedLogin(username);
      return res.status(401).json({ 
        success: false, 
        message: 'El usuario no existe',
        remainingAttempts: failedResult.remainingAttempts,
        locked: failedResult.locked
      });
    }

    // PASO 9: Verificar si el usuario específico está bloqueado
    const userLockCheck = securityService.isAccountLocked(usuario.id);
    if (userLockCheck.locked) {
      return res.status(423).json({
        success: false,
        message: userLockCheck.message,
        lockedUntil: userLockCheck.lockedUntil,
        remainingMinutes: userLockCheck.remainingMinutes
      });
    }

    // Verificar contraseña
    const passwordValida = bcrypt.compareSync(password, usuario.password);

    if (!passwordValida) {
      // PASO 9: Registrar intento fallido por userId
      const failedResult = securityService.recordFailedLogin(usuario.id);
      return res.status(401).json({ 
        success: false, 
        message: 'Contraseña incorrecta',
        remainingAttempts: failedResult.remainingAttempts,
        locked: failedResult.locked,
        lockedUntil: failedResult.lockedUntil
      });
    }

    // PASO 9: Login exitoso - limpiar intentos fallidos
    securityService.clearFailedAttempts(usuario.id);
    securityService.clearFailedAttempts(username);

    // PASO 9: Verificar si 2FA está habilitado
    const has2FA = securityService.is2FAEnabled(usuario.id);
    if (has2FA) {
      // Generar token temporal para flujo 2FA
      const tempToken = jwt.sign(
        { id: usuario.id, require2FA: true },
        authService.config.accessTokenSecret,
        { expiresIn: '5m' }
      );
      
      return res.json({
        success: true,
        require2FA: true,
        tempToken,
        message: 'Introduce el código de autenticación'
      });
    }

    // Generar Access Token y Refresh Token
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: clientIP
    };

    const accessToken = authService.generateAccessToken(usuario);
    const refreshToken = authService.generateRefreshToken(usuario, deviceInfo);

    // PASO 9: Generar Remember Me token si está activo
    let rememberMeToken = null;
    if (rememberMe) {
      const rmResult = securityService.generateRememberMeToken(usuario.id, deviceInfo);
      rememberMeToken = rmResult.token;
    }

    // Actualizar último acceso
    usuario.ultimo_acceso = new Date().toISOString();

    // Registrar sesión
    if (!db.sesiones) db.sesiones = [];
    db.sesiones.push({
      id: db.sesiones.length + 1,
      usuario_id: usuario.id,
      token: accessToken,
      fecha_inicio: new Date().toISOString(),
      fecha_fin: null,
      ip_address: clientIP,
      user_agent: req.headers['user-agent']
    });

    saveDatabase();

    // Obtener permisos del usuario
    const permissions = authService.getPermissionsForRole(usuario.rol);

    // Construir respuesta
    const response = {
      success: true,
      message: 'Login exitoso',
      token: accessToken,
      refreshToken: refreshToken,
      expiresIn: 900, // 15 minutos
      usuario: {
        id: usuario.id,
        username: usuario.username,
        nombre_completo: usuario.nombre_completo,
        email: usuario.email,
        rol: usuario.rol,
        permissions: permissions,
        has2FA: has2FA
      }
    };

    // Añadir remember me token si existe
    if (rememberMeToken) {
      response.rememberMeToken = rememberMeToken;
      response.rememberMeExpiresIn = securityService.SECURITY_CONFIG.rememberMeDays * 24 * 60 * 60; // segundos
    }

    res.json(response);

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error en el servidor' 
    });
  }
});

// REGISTRO PARA CLIENTES
router.post('/register-client', async (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { nombre, email, password, passwordConfirm, telefono } = req.body;

    // Validaciones
    if (!nombre || !email || !password || !passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    if (db.usuarios.find(u => u.email === email)) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    const nuevoId = Math.max(...db.usuarios.map(u => u.id || 0), 0) + 1;
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

    const nuevoCliente = {
      id: nuevoId,
      username: username,
      email: email,
      password: bcrypt.hashSync(password, 12),
      nombre_completo: nombre,
      telefono: telefono || '',
      tipo_usuario: 'cliente',
      rol: 'cliente',
      activo: 1,
      plan: 'trial',
      dias_prueba: 7,
      verificado: false,
      fecha_creacion: new Date().toISOString(),
      ultimo_acceso: null
    };

    db.usuarios.push(nuevoCliente);
    saveDatabase();

    // Enviar email de bienvenida a cliente (no esperamos respuesta)
    emailService.enviarEmailBienvenidaCliente(email, nombre).catch(err => {
      console.error('Error enviando email a cliente:', err);
    });

    const accessToken = authService.generateAccessToken(nuevoCliente);
    const refreshToken = authService.generateRefreshToken(nuevoCliente, {
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Cuenta de cliente creada exitosamente',
      token: accessToken,
      refreshToken: refreshToken,
      usuario: {
        id: nuevoCliente.id,
        nombre: nuevoCliente.nombre_completo,
        email: nuevoCliente.email,
        tipo: 'cliente'
      }
    });

  } catch (error) {
    console.error('Error en registro de cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar cliente'
    });
  }
});

// REGISTRO PARA EMPRESAS
router.post('/register-business', async (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { nombreEmpresa, nombreDueno, email, password, passwordConfirm, telefono } = req.body;

    // Validaciones
    if (!nombreEmpresa || !nombreDueno || !email || !password || !passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    if (db.usuarios.find(u => u.email === email)) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    const nuevoId = Math.max(...db.usuarios.map(u => u.id || 0), 0) + 1;
    const username = nombreDueno.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);

    // Crear tenant para la empresa
    const tenantId = 'tenant_' + Date.now();
    if (!db.tenants) db.tenants = [];
    
    const nuevoTenant = {
      id: tenantId,
      nombre: nombreEmpresa,
      fecha_creacion: new Date().toISOString(),
      plan: 'trial',
      dias_trial: 7,
      fecha_inicio_trial: new Date().toISOString(),
      estado: 'activo'
    };
    db.tenants.push(nuevoTenant);

    const nuevoUsuario = {
      id: nuevoId,
      username: username,
      email: email,
      password: bcrypt.hashSync(password, 12),
      nombre_completo: nombreDueno,
      nombre_empresa: nombreEmpresa,
      telefono: telefono || '',
      tenant_id: tenantId,
      tipo_usuario: 'empresa',
      rol: 'admin',
      activo: 1,
      verificado: false,
      fecha_creacion: new Date().toISOString(),
      ultimo_acceso: null,
      perfil_completado: false
    };

    db.usuarios.push(nuevoUsuario);
    saveDatabase();

    // Enviar email de bienvenida a empresa (no esperamos respuesta)
    emailService.enviarEmailBienvenidaEmpresa(email, nombreDueno, nombreEmpresa, tenantId, 7).catch(err => {
      console.error('Error enviando email a empresa:', err);
    });

    const accessToken = authService.generateAccessToken(nuevoUsuario);
    const refreshToken = authService.generateRefreshToken(nuevoUsuario, {
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Empresa registrada. Completa tu perfil para empezar',
      token: accessToken,
      refreshToken: refreshToken,
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre_completo,
        email: nuevoUsuario.email,
        empresa: nuevoUsuario.nombre_empresa,
        tenant_id: tenantId,
        tipo: 'empresa'
      }
    });

  } catch (error) {
    console.error('Error en registro de empresa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar empresa'
    });
  }
});

// LOGOUT
router.post('/logout', (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const token = req.headers.authorization?.split(' ')[1];
    const refreshToken = req.body.refreshToken;

    if (token) {
      const sesion = db.sesiones.find(s => s.token === token);
      if (sesion) {
        sesion.fecha_fin = new Date().toISOString();
        saveDatabase();
      }
    }

    // PASO 3: Revocar refresh token
    if (refreshToken) {
      authService.revokeRefreshToken(refreshToken);
    }

    res.json({ 
      success: true, 
      message: 'Sesión cerrada exitosamente' 
    });

  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al cerrar sesión' 
    });
  }
});

// PASO 3: Logout de todos los dispositivos
router.post('/logout-all', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token requerido' });
    }

    const verification = authService.verifyAccessToken(token);
    if (!verification.valid) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    const result = authService.revokeAllUserTokens(verification.decoded.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al cerrar sesiones' });
  }
});

// PASO 3: Refrescar token
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Refresh token requerido' 
      });
    }

    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip
    };

    const result = authService.refreshTokens(refreshToken, deviceInfo);

    if (!result.success) {
      return res.status(401).json({ 
        success: false, 
        message: result.error 
      });
    }

    res.json({
      success: true,
      token: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al refrescar token' });
  }
});

// PASO 3: Obtener sesiones activas
router.get('/sessions', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token requerido' });
    }

    const verification = authService.verifyAccessToken(token);
    if (!verification.valid) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    const sessions = authService.getUserSessions(verification.decoded.id);
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener sesiones' });
  }
});

// VERIFICAR TOKEN - PASO 3: Mejorado con authService
router.get('/verify', (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token no proporcionado' 
      });
    }

    // PASO 3: Usar authService para verificar
    const verification = authService.verifyAccessToken(token);
    
    if (!verification.valid) {
      return res.status(401).json({ 
        success: false, 
        message: verification.error || 'Token inválido'
      });
    }

    const decoded = verification.decoded;
    const usuario = db.usuarios.find(u => u.id === decoded.id && u.activo === 1);

    if (!usuario) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no válido' 
      });
    }

    // PASO 3: Incluir permisos en la respuesta
    const permissions = authService.getPermissionsForRole(usuario.rol);

    res.json({ 
      success: true, 
      usuario: {
        id: usuario.id,
        username: usuario.username,
        nombre_completo: usuario.nombre_completo,
        email: usuario.email,
        rol: usuario.rol,
        permissions: permissions,
        tenantId: decoded.tenantId
      },
      tokenInfo: {
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
        issuedAt: new Date(decoded.iat * 1000).toISOString()
      }
    });

  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Token inválido o expirado' 
    });
  }
});



// PASO 12: REFRESH TOKEN
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requerido'
      });
    }

    // Verificar y decodificar el refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'NEURIAX_SaaS_Platform_2026_SecretKey');
    
    loadDatabase();
    const db = getDatabase();
    const usuario = db.usuarios.find(u => u.id === decoded.id && u.activo === 1);

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Generar nuevo access token
    const newAccessToken = authService.generateAccessToken(usuario);

    res.json({
      success: true,
      token: newAccessToken,
      expiresIn: 900
    });

  } catch (error) {
    console.error('Error en refresh:', error);
    res.status(401).json({
      success: false,
      message: 'Refresh token inválido o expirado'
    });
  }
});

// PASO 10: VERIFICAR EMAIL
router.post('/verify-email', (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { email, codigo } = req.body;

    if (!email || !codigo) {
      return res.status(400).json({
        success: false,
        message: 'Email y código de verificación requeridos'
      });
    }

    // Buscar usuario
    const usuario = db.usuarios.find(u => u.email === email);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar código
    if (usuario.codigo_verificacion !== codigo) {
      return res.status(400).json({
        success: false,
        message: 'Código de verificación inválido'
      });
    }

    // Marcar como verificado
    usuario.verificado = true;
    delete usuario.codigo_verificacion;
    saveDatabase();

    res.json({
      success: true,
      message: 'Email verificado correctamente',
      usuario: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        verificado: true
      }
    });

  } catch (error) {
    console.error('Error en verificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando email'
    });
  }
});

// PASO 11: FORGOT PASSWORD - Solicitar código de recuperación
router.post('/forgot-password', (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    // Buscar usuario por email
    const usuario = db.usuarios.find(u => u.email === email && u.activo === 1);

    if (!usuario) {
      // Por seguridad, no revelar si el email existe o no
      return res.json({
        success: true,
        message: 'Si el email existe, recibirás un código de recuperación'
      });
    }

    // Generar código de 6 dígitos
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutos

    // Guardar código en usuario
    usuario.reset_code = resetCode;
    usuario.reset_code_expires = resetCodeExpires;
    saveDatabase();

    // En producción, aquí enviarías el email
    console.log(`[DEV] Código de recuperación para ${email}: ${resetCode}`);

    res.json({
      success: true,
      message: 'Si el email existe, recibirás un código de recuperación',
      // Solo en desarrollo, mostrar el código
      _dev_reset_code: process.env.NODE_ENV !== 'production' ? resetCode : undefined
    });

  } catch (error) {
    console.error('Error en forgot-password:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando solicitud'
    });
  }
});

// PASO 11b: VERIFY RESET CODE - Verificar código de recuperación
router.post('/verify-reset-code', (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email y código son requeridos'
      });
    }

    // Buscar usuario
    const usuario = db.usuarios.find(u => u.email === email && u.activo === 1);

    if (!usuario) {
      return res.status(400).json({
        success: false,
        message: 'Código inválido o expirado'
      });
    }

    // Verificar código
    if (usuario.reset_code !== code) {
      return res.status(400).json({
        success: false,
        message: 'Código inválido o expirado'
      });
    }

    // Verificar expiración
    if (new Date() > new Date(usuario.reset_code_expires)) {
      return res.status(400).json({
        success: false,
        message: 'El código ha expirado. Solicita uno nuevo.'
      });
    }

    res.json({
      success: true,
      message: 'Código verificado correctamente'
    });

  } catch (error) {
    console.error('Error en verify-reset-code:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando código'
    });
  }
});

// PASO 11c: RESET PASSWORD - Cambiar contraseña
router.post('/reset-password', (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, código y nueva contraseña son requeridos'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener mínimo 6 caracteres'
      });
    }

    // Buscar usuario
    const usuario = db.usuarios.find(u => u.email === email && u.activo === 1);

    if (!usuario) {
      return res.status(400).json({
        success: false,
        message: 'Error al cambiar contraseña'
      });
    }

    // Verificar código nuevamente
    if (usuario.reset_code !== code) {
      return res.status(400).json({
        success: false,
        message: 'Código inválido o expirado'
      });
    }

    // Verificar expiración
    if (new Date() > new Date(usuario.reset_code_expires)) {
      return res.status(400).json({
        success: false,
        message: 'El código ha expirado. Solicita uno nuevo.'
      });
    }

    // Actualizar contraseña
    usuario.password = bcrypt.hashSync(newPassword, 12);
    
    // Limpiar códigos de recuperación
    delete usuario.reset_code;
    delete usuario.reset_code_expires;
    
    saveDatabase();

    console.log(`[INFO] Contraseña cambiada para ${email}`);

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });

  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña'
    });
  }
});

// ==========================================================
// PASO 9: AUTENTICACIÓN REFORZADA - ENDPOINTS ADICIONALES
// ==========================================================

// LOGIN CON REMEMBER ME TOKEN
router.post('/login-remember', async (req, res) => {
  try {
    const { rememberMeToken } = req.body;

    if (!rememberMeToken) {
      return res.status(400).json({
        success: false,
        message: 'Token requerido'
      });
    }

    // Verificar token remember me
    const verification = securityService.verifyRememberMeToken(rememberMeToken);
    
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: verification.error || 'Token inválido'
      });
    }

    // Obtener usuario
    loadDatabase();
    const db = getDatabase();
    const usuario = db.usuarios.find(u => u.id === verification.userId && u.activo === 1);

    if (!usuario) {
      securityService.revokeRememberMeToken(rememberMeToken);
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar si 2FA está habilitado
    const has2FA = securityService.is2FAEnabled(usuario.id);
    if (has2FA) {
      const tempToken = jwt.sign(
        { id: usuario.id, require2FA: true },
        authService.config.accessTokenSecret,
        { expiresIn: '5m' }
      );
      
      return res.json({
        success: true,
        require2FA: true,
        tempToken,
        message: 'Introduce el código de autenticación'
      });
    }

    // Generar nuevos tokens
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };

    const accessToken = authService.generateAccessToken(usuario);
    const refreshToken = authService.generateRefreshToken(usuario, deviceInfo);

    // Actualizar último acceso
    usuario.ultimo_acceso = new Date().toISOString();
    saveDatabase();

    const permissions = authService.getPermissionsForRole(usuario.rol);

    res.json({
      success: true,
      message: 'Login automático exitoso',
      token: accessToken,
      refreshToken: refreshToken,
      expiresIn: 900,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        nombre_completo: usuario.nombre_completo,
        email: usuario.email,
        rol: usuario.rol,
        permissions: permissions,
        has2FA: has2FA
      }
    });

  } catch (error) {
    console.error('Error en login-remember:', error);
    res.status(500).json({
      success: false,
      message: 'Error en login automático'
    });
  }
});

// VERIFICAR 2FA Y COMPLETAR LOGIN
router.post('/verify-2fa', async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({
        success: false,
        message: 'Token temporal y código son requeridos'
      });
    }

    // Verificar token temporal
    let decoded;
    try {
      decoded = jwt.verify(tempToken, authService.config.accessTokenSecret);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token temporal expirado o inválido'
      });
    }

    if (!decoded.require2FA) {
      return res.status(400).json({
        success: false,
        message: 'Token no válido para 2FA'
      });
    }

    // Verificar código 2FA
    const verification = securityService.verify2FACode(decoded.id, code);
    
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: 'Código de verificación incorrecto'
      });
    }

    // Obtener usuario
    loadDatabase();
    const db = getDatabase();
    const usuario = db.usuarios.find(u => u.id === decoded.id && u.activo === 1);

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Generar tokens completos
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };

    const accessToken = authService.generateAccessToken(usuario);
    const refreshToken = authService.generateRefreshToken(usuario, deviceInfo);

    // Actualizar último acceso
    usuario.ultimo_acceso = new Date().toISOString();
    saveDatabase();

    const permissions = authService.getPermissionsForRole(usuario.rol);

    res.json({
      success: true,
      message: verification.usedBackupCode 
        ? 'Login exitoso (código de respaldo usado)' 
        : 'Login exitoso',
      token: accessToken,
      refreshToken: refreshToken,
      expiresIn: 900,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        nombre_completo: usuario.nombre_completo,
        email: usuario.email,
        rol: usuario.rol,
        permissions: permissions,
        has2FA: true
      },
      usedBackupCode: verification.usedBackupCode
    });

  } catch (error) {
    console.error('Error en verify-2fa:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando 2FA'
    });
  }
});

// CONFIGURAR 2FA - Generar secreto
router.post('/2fa/setup', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token requerido' });
    }

    const verification = authService.verifyAccessToken(token);
    if (!verification.valid) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    loadDatabase();
    const db = getDatabase();
    const usuario = db.usuarios.find(u => u.id === verification.decoded.id);

    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Generar secreto 2FA
    const setup = securityService.generate2FASecret(usuario.id, usuario.email);

    res.json({
      success: true,
      message: 'Escanea el código QR con Google Authenticator',
      secret: setup.secret,
      qrCodeUrl: setup.otpauthUrl,
      backupCodes: setup.backupCodes
    });

  } catch (error) {
    console.error('Error en 2fa/setup:', error);
    res.status(500).json({
      success: false,
      message: 'Error configurando 2FA'
    });
  }
});

// HABILITAR 2FA (después de verificar código)
router.post('/2fa/enable', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { code } = req.body;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token requerido' });
    }

    if (!code) {
      return res.status(400).json({ success: false, message: 'Código requerido' });
    }

    const verification = authService.verifyAccessToken(token);
    if (!verification.valid) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    const result = securityService.enable2FA(verification.decoded.id, code);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: '2FA habilitado correctamente'
    });

  } catch (error) {
    console.error('Error en 2fa/enable:', error);
    res.status(500).json({
      success: false,
      message: 'Error habilitando 2FA'
    });
  }
});

// DESHABILITAR 2FA
router.post('/2fa/disable', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { password } = req.body;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token requerido' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Contraseña requerida' });
    }

    const verification = authService.verifyAccessToken(token);
    if (!verification.valid) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    // Verificar contraseña
    loadDatabase();
    const db = getDatabase();
    const usuario = db.usuarios.find(u => u.id === verification.decoded.id);

    if (!usuario || !bcrypt.compareSync(password, usuario.password)) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }

    const result = securityService.disable2FA(verification.decoded.id);

    res.json({
      success: true,
      message: '2FA deshabilitado correctamente'
    });

  } catch (error) {
    console.error('Error en 2fa/disable:', error);
    res.status(500).json({
      success: false,
      message: 'Error deshabilitando 2FA'
    });
  }
});

// OBTENER ESTADO 2FA
router.get('/2fa/status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token requerido' });
    }

    const verification = authService.verifyAccessToken(token);
    if (!verification.valid) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    const enabled = securityService.is2FAEnabled(verification.decoded.id);
    const remainingBackupCodes = enabled 
      ? securityService.getRemainingBackupCodes(verification.decoded.id)
      : 0;

    res.json({
      success: true,
      enabled,
      remainingBackupCodes
    });

  } catch (error) {
    console.error('Error en 2fa/status:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estado 2FA'
    });
  }
});

// OBTENER SESIONES ACTIVAS MEJORADO
router.get('/security/sessions', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token requerido' });
    }

    const verification = authService.verifyAccessToken(token);
    if (!verification.valid) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    // Obtener sesiones de JWT refresh tokens
    const jwtSessions = authService.getUserSessions(verification.decoded.id);
    
    // Obtener sesiones de remember me
    const rememberMeSessions = securityService.getUserRememberMeTokens(verification.decoded.id);

    res.json({
      success: true,
      sessions: {
        active: jwtSessions,
        rememberMe: rememberMeSessions
      }
    });

  } catch (error) {
    console.error('Error en security/sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo sesiones'
    });
  }
});

// CERRAR TODAS LAS SESIONES (excepto la actual)
router.post('/security/logout-all', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token requerido' });
    }

    const verification = authService.verifyAccessToken(token);
    if (!verification.valid) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    // Revocar todos los refresh tokens
    const jwtResult = authService.revokeAllUserTokens(verification.decoded.id);
    
    // Revocar todos los remember me tokens
    const rmResult = securityService.revokeAllRememberMeTokens(verification.decoded.id);

    res.json({
      success: true,
      message: 'Todas las sesiones han sido cerradas',
      revokedSessions: jwtResult.message,
      revokedRememberMe: rmResult.revokedCount
    });

  } catch (error) {
    console.error('Error en security/logout-all:', error);
    res.status(500).json({
      success: false,
      message: 'Error cerrando sesiones'
    });
  }
});

// REVOCAR REMEMBER ME TOKEN ESPECÍFICO
router.delete('/security/remember-me/:tokenId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token requerido' });
    }

    const verification = authService.verifyAccessToken(token);
    if (!verification.valid) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    // Por seguridad no permitimos revocar por tokenId parcial
    // En producción se implementaría una lista de tokens del usuario
    res.json({
      success: true,
      message: 'Usa /security/logout-all para revocar todas las sesiones'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error revocando token'
    });
  }
});

// ESTADÍSTICAS DE SEGURIDAD DEL USUARIO
router.get('/security/stats', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token requerido' });
    }

    const verification = authService.verifyAccessToken(token);
    if (!verification.valid) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    const userId = verification.decoded.id;

    // Obtener estadísticas
    const loginStats = securityService.getLoginAttemptStats(userId);
    const has2FA = securityService.is2FAEnabled(userId);
    const backupCodes = has2FA ? securityService.getRemainingBackupCodes(userId) : 0;
    const activeSessions = authService.getUserSessions(userId).length;
    const rememberMeTokens = securityService.getUserRememberMeTokens(userId).length;

    loadDatabase();
    const db = getDatabase();
    const usuario = db.usuarios.find(u => u.id === userId);

    res.json({
      success: true,
      stats: {
        loginAttempts: loginStats,
        twoFactor: {
          enabled: has2FA,
          remainingBackupCodes: backupCodes
        },
        sessions: {
          active: activeSessions,
          rememberMe: rememberMeTokens
        },
        lastLogin: usuario?.ultimo_acceso || null,
        accountCreated: usuario?.fecha_creacion || null
      }
    });

  } catch (error) {
    console.error('Error en security/stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas'
    });
  }
});

// CAMBIAR CONTRASEÑA (requiere autenticación)
router.post('/security/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token requerido' });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 8 caracteres'
      });
    }

    const verification = authService.verifyAccessToken(token);
    if (!verification.valid) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    loadDatabase();
    const db = getDatabase();
    const usuario = db.usuarios.find(u => u.id === verification.decoded.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    if (!bcrypt.compareSync(currentPassword, usuario.password)) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Actualizar contraseña
    usuario.password = bcrypt.hashSync(newPassword, 12);
    usuario.password_updated_at = new Date().toISOString();
    saveDatabase();

    // Opcionalmente revocar todas las sesiones excepto la actual
    // authService.revokeAllUserTokens(usuario.id);

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });

  } catch (error) {
    console.error('Error en security/change-password:', error);
    res.status(500).json({
      success: false,
      message: 'Error cambiando contraseña'
    });
  }
});

// DEBUG: Obtener lista de usuarios (solo en desarrollo)
router.get('/debug/usuarios', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'No permitido en producción' });
  }
  
  try {
    loadDatabase();
    const db = getDatabase();
    const usuarios = db.usuarios.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      nombre_completo: u.nombre_completo,
      rol: u.rol,
      activo: u.activo,
      fecha_creacion: u.fecha_creacion,
      tipo_usuario: u.tipo_usuario
    }));
    
    res.json({
      success: true,
      total: usuarios.length,
      usuarios
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DEBUG: Crear usuario de test
router.post('/debug/create-test-user', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'No permitido en producción' });
  }

  try {
    loadDatabase();
    const db = getDatabase();
    const { email, password, nombre, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });
    }

    // Verificar si existe
    if (db.usuarios.find(u => u.email === email)) {
      return res.status(400).json({ success: false, message: 'El email ya existe' });
    }

    const nuevoId = Math.max(...db.usuarios.map(u => u.id || 0), 0) + 1;
    const nuevoUsername = username || email.split('@')[0] + nuevoId;

    const nuevoUsuario = {
      id: nuevoId,
      username: nuevoUsername,
      email: email,
      password: bcrypt.hashSync(password, 12),
      nombre_completo: nombre || 'Test User',
      telefono: '',
      tipo_usuario: 'cliente',
      rol: 'cliente',
      activo: 1,
      verificado: true,
      fecha_creacion: new Date().toISOString(),
      ultimo_acceso: null
    };

    db.usuarios.push(nuevoUsuario);
    saveDatabase();

    res.status(201).json({
      success: true,
      message: 'Usuario de test creado exitosamente',
      usuario: {
        id: nuevoUsuario.id,
        username: nuevoUsuario.username,
        email: nuevoUsuario.email,
        nombre_completo: nuevoUsuario.nombre_completo,
        rol: nuevoUsuario.rol
      }
    });
  } catch (error) {
    console.error('Error creando usuario de test:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// NUEVAS RUTAS: PROFESIONALES vs CLIENTES
// ============================================

// LOGIN PARA PROFESIONALES Y CLIENTES
router.post('/login-professional', async (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { username, password, rememberMe } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Credenciales incorrectas' 
      });
    }

    // Buscar en db.usuarios (donde están todos los usuarios)
    const usuario = db.usuarios.find(u => 
      (u.username === username || u.email === username) && (u.activo === 1 || u.activo === true)
    );

    if (!usuario) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales incorrectas' 
      });
    }

    // Verificar contraseña con bcrypt
    const passwordValida = bcrypt.compareSync(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales incorrectas' 
      });
    }

    // Generar tokens
    const accessToken = authService.generateAccessToken(usuario);
    const refreshToken = authService.generateRefreshToken(usuario, {
      userAgent: req.headers['user-agent'],
      ip: clientIP
    });

    // Actualizar último acceso
    usuario.ultimo_acceso = new Date().toISOString();
    
    // Calcular días de prueba restantes si aplica
    let diasPruebaRestantes = 0;
    if (usuario.plan === 'trial' || usuario.tipo_usuario === 'empresa') {
      const fechaInicio = new Date(usuario.fecha_creacion || usuario.createdAt);
      const fechaHoy = new Date();
      const diasTranscurridos = Math.floor((fechaHoy - fechaInicio) / (1000 * 60 * 60 * 24));
      diasPruebaRestantes = Math.max(7 - diasTranscurridos, 0);
      
      // Si la prueba expiró, cambiar el plan a expired
      if (diasPruebaRestantes === 0 && usuario.plan === 'trial') {
        usuario.plan = 'expired';
      }
    }

    saveDatabase();

    const response = {
      success: true,
      message: 'Login exitoso',
      token: accessToken,
      refreshToken: refreshToken,
      expiresIn: 900,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        nombre_completo: usuario.nombre_completo || usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        tipo_usuario: usuario.tipo_usuario,
        tenantId: usuario.tenantId || usuario.tenant_id,
        plan: usuario.plan || 'basic',
        diasPruebaRestantes: diasPruebaRestantes,
        nombre_negocio: usuario.nombre_negocio || usuario.nombre_empresa,
        tipo_negocio: usuario.tipo_negocio
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error en login profesional:', error);
    res.status(500).json({ success: false, message: 'Credenciales incorrectas' });
  }
});

// LOGIN PARA CLIENTES
router.post('/login-client', async (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { username, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Credenciales incorrectas' 
      });
    }

    // Buscar en tabla usuarios con tipo 'cliente'
    const cliente = db.usuarios.find(u => 
      (u.username === username || u.email === username) && 
      (u.activo === 1 || u.activo === true) &&
      (u.tipo_usuario === 'cliente' || u.rol === 'cliente')
    );

    if (!cliente) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales incorrectas' 
      });
    }

    // Verificar contraseña
    const passwordValida = bcrypt.compareSync(password, cliente.password);
    if (!passwordValida) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales incorrectas' 
      });
    }

    // Generar tokens
    const accessToken = authService.generateAccessToken(cliente);
    const refreshToken = authService.generateRefreshToken(cliente, {
      userAgent: req.headers['user-agent'],
      ip: clientIP
    });

    // Actualizar último acceso
    cliente.ultimo_acceso = new Date().toISOString();
    
    // Calcular días de prueba restantes si aplica
    let diasPruebaRestantes = 0;
    if (cliente.plan === 'trial' || cliente.tipo_usuario === 'cliente') {
      const fechaInicio = new Date(cliente.fecha_creacion || cliente.createdAt);
      const fechaHoy = new Date();
      const diasTranscurridos = Math.floor((fechaHoy - fechaInicio) / (1000 * 60 * 60 * 24));
      diasPruebaRestantes = Math.max(7 - diasTranscurridos, 0);
      
      // Si la prueba expiró, cambiar el plan a expired
      if (diasPruebaRestantes === 0 && cliente.plan === 'trial') {
        cliente.plan = 'expired';
      }
    }
    
    saveDatabase();

    const response = {
      success: true,
      message: 'Login exitoso',
      token: accessToken,
      refreshToken: refreshToken,
      expiresIn: 900,
      usuario: {
        id: cliente.id,
        username: cliente.username,
        nombre_completo: cliente.nombre_completo || cliente.nombre,
        email: cliente.email,
        tipo_usuario: 'cliente',
        tenantId: cliente.tenantId || cliente.tenant_id,
        plan: cliente.plan || 'basic',
        diasPruebaRestantes: diasPruebaRestantes
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error en login cliente:', error);
    res.status(500).json({ success: false, message: 'Credenciales incorrectas' });
  }
});

// REGISTRO DE PROFESIONALES
router.post('/register-professional', async (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { 
      username, 
      email, 
      password, 
      passwordConfirm, 
      nombre_completo, 
      telefono,
      nombre_negocio,
      tipo_negocio,
      plan
    } = req.body;

    // Validaciones
    if (!username || !email || !password || !nombre_completo || !nombre_negocio) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios son requeridos'
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    // Verificar email único en profesionales
    if (db.profesionales.find(p => p.email === email)) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado como profesional'
      });
    }

    const profesionalId = 'prof_' + Date.now();
    const tenantId = 'tenant_' + Date.now();

    const nuevoProfesional = {
      id: profesionalId,
      username: username,
      email: email,
      password: bcrypt.hashSync(password, 12),
      nombre_completo: nombre_completo,
      telefono: telefono || '',
      nombre_negocio: nombre_negocio,
      tipo_negocio: tipo_negocio || 'salon_belleza',
      rol: 'owner',
      plan: 'trial',
      tenantId: tenantId,
      stripeCustomerId: null,
      activo: true,
      verificado: false,
      fecha_creacion: new Date().toISOString(),
      ultimo_acceso: null,
      dias_prueba: 7
    };

    db.profesionales.push(nuevoProfesional);
    
    // Crear tenant para el profesional
    if (!db.tenants) db.tenants = [];
    db.tenants.push({
      id: tenantId,
      profesional_id: profesionalId,
      nombre: nombre_negocio,
      tipo_negocio: tipo_negocio,
      plan: 'trial',
      dias_prueba: 7,
      activo: true,
      fecha_creacion: new Date().toISOString()
    });

    saveDatabase();

    // Enviar email de bienvenida a profesional
    emailService.enviarEmailBienvenidaProfesional(email, nombre_completo, nombre_negocio).catch(err => {
      console.error('Error enviando email a profesional:', err);
    });

    const accessToken = authService.generateAccessToken(nuevoProfesional);
    const refreshToken = authService.generateRefreshToken(nuevoProfesional, {
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Cuenta de profesional creada exitosamente',
      tipoUsuario: 'profesional',
      token: accessToken,
      refreshToken: refreshToken,
      usuario: {
        id: nuevoProfesional.id,
        username: nuevoProfesional.username,
        nombre_completo: nuevoProfesional.nombre_completo,
        email: nuevoProfesional.email,
        nombre_negocio: nuevoProfesional.nombre_negocio,
        tipo_negocio: nuevoProfesional.tipo_negocio,
        rol: nuevoProfesional.rol,
        plan: nuevoProfesional.plan,
        tenantId: tenantId
      }
    });

  } catch (error) {
    console.error('Error en registro de profesional:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar profesional'
    });
  }
});

// REGISTRO DE CLIENTES (nuevo endpoint diferenciado)
router.post('/register-client-new', async (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { 
      username, 
      email, 
      password, 
      passwordConfirm, 
      nombre_completo, 
      telefono,
      interesado_en
    } = req.body;

    // Validaciones
    if (!username || !email || !password || !nombre_completo) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios son requeridos'
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar email único en clientes_registrados
    if (db.clientes_registrados.find(c => c.email === email)) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado'
      });
    }

    const clienteId = 'cli_' + Date.now();

    const nuevoCliente = {
      id: clienteId,
      username: username,
      email: email,
      password: bcrypt.hashSync(password, 12),
      nombre_completo: nombre_completo,
      telefono: telefono || '',
      tipo_usuario: 'cliente',
      plan: 'trial',
      dias_prueba: 7,
      interesado_en: interesado_en || [],
      favoritos_profesionales: [],
      reservas_totales: 0,
      calificacion_promedio: 0,
      activo: true,
      verificado: false,
      fecha_creacion: new Date().toISOString(),
      ultimo_acceso: null
    };

    db.clientes_registrados.push(nuevoCliente);
    saveDatabase();

    // Enviar email de bienvenida a cliente
    emailService.enviarEmailBienvenidaCliente(email, nombre_completo).catch(err => {
      console.error('Error enviando email a cliente:', err);
    });

    const accessToken = authService.generateAccessToken(nuevoCliente);
    const refreshToken = authService.generateRefreshToken(nuevoCliente, {
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Cuenta de cliente creada exitosamente',
      tipoUsuario: 'cliente',
      token: accessToken,
      refreshToken: refreshToken,
      usuario: {
        id: nuevoCliente.id,
        username: nuevoCliente.username,
        nombre_completo: nuevoCliente.nombre_completo,
        email: nuevoCliente.email,
        tipo_usuario: 'cliente',
        interesado_en: nuevoCliente.interesado_en
      }
    });

  } catch (error) {
    console.error('Error en registro de cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar cliente'
    });
  }
});

module.exports = router;
