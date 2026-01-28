/**
 * NEURIAX - Rutas de Autenticación con Supabase
 * Base de datos PostgreSQL en la nube
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../database/supabase');

const router = express.Router();

// Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || 'neuriax-secret-key-2025';
const JWT_EXPIRES = '15m';
const JWT_REFRESH_EXPIRES = '7d';

// Generar tokens
function generateAccessToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      username: user.username,
      rol: user.rol 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES }
  );
}

// Calcular días de trial restantes
function calcularDiasTrial(trialEndDate) {
  if (!trialEndDate) return 0;
  const end = new Date(trialEndDate);
  const now = new Date();
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// ==================== LOGIN PROFESIONAL ====================
router.post('/login-professional', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      });
    }

    // Buscar usuario por username o email
    let user = await supabase.getUserByUsername(username);
    if (!user) {
      user = await supabase.getUserByEmail(username);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que sea profesional o admin
    if (!['profesional', 'admin'].includes(user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo profesionales pueden acceder aquí.'
      });
    }

    // Verificar contraseña
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }

    // Verificar cuenta activa
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta desactivada'
      });
    }

    // Generar tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Guardar refresh token en BD
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await supabase.saveRefreshToken(user.id, refreshToken, expiresAt.toISOString());

    // Actualizar último acceso
    await supabase.updateUser(user.id, { 
      updated_at: new Date().toISOString() 
    });

    // Calcular días de trial
    const diasTrial = calcularDiasTrial(user.trial_end_date);

    res.json({
      success: true,
      message: 'Login exitoso',
      token: accessToken,
      refreshToken: refreshToken,
      expiresIn: 900,
      usuario: {
        id: user.id,
        username: user.username,
        nombre_completo: user.nombre || user.username,
        email: user.email,
        rol: user.rol,
        plan: user.plan || 'trial',
        diasTrial: diasTrial,
        trialActivo: diasTrial > 0 && user.plan === 'trial'
      }
    });

  } catch (error) {
    console.error('Error en login profesional:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
});

// ==================== LOGIN CLIENTE ====================
router.post('/login-client', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      });
    }

    // Buscar usuario
    let user = await supabase.getUserByUsername(username);
    if (!user) {
      user = await supabase.getUserByEmail(username);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que sea cliente
    if (user.rol !== 'cliente') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo clientes pueden acceder aquí.'
      });
    }

    // Verificar contraseña
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }

    // Verificar cuenta activa
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta desactivada'
      });
    }

    // Generar tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Guardar refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await supabase.saveRefreshToken(user.id, refreshToken, expiresAt.toISOString());

    res.json({
      success: true,
      message: 'Login exitoso',
      token: accessToken,
      refreshToken: refreshToken,
      usuario: {
        id: user.id,
        username: user.username,
        nombre: user.nombre || user.username,
        email: user.email,
        rol: user.rol
      }
    });

  } catch (error) {
    console.error('Error en login cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
});

// ==================== LOGIN GENÉRICO ====================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      });
    }

    // Buscar usuario
    let user = await supabase.getUserByUsername(username);
    if (!user) {
      user = await supabase.getUserByEmail(username);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }

    // Verificar cuenta activa
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta desactivada'
      });
    }

    // Generar tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Guardar refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await supabase.saveRefreshToken(user.id, refreshToken, expiresAt.toISOString());

    // Calcular días de trial
    const diasTrial = calcularDiasTrial(user.trial_end_date);

    res.json({
      success: true,
      message: 'Login exitoso',
      token: accessToken,
      refreshToken: refreshToken,
      expiresIn: 900,
      usuario: {
        id: user.id,
        username: user.username,
        nombre_completo: user.nombre || user.username,
        email: user.email,
        rol: user.rol,
        plan: user.plan || 'trial',
        diasTrial: diasTrial,
        trialActivo: diasTrial > 0 && user.plan === 'trial'
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
});

// ==================== REGISTRO CLIENTE ====================
router.post('/register-client', async (req, res) => {
  try {
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

    // Verificar si el email ya existe
    const existingUser = await supabase.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Crear username único
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario en Supabase
    const newUser = await supabase.createUser({
      email: email,
      username: username,
      password: hashedPassword,
      nombre: nombre,
      telefono: telefono || null,
      rol: 'cliente',
      plan: 'trial',
      is_active: true,
      is_verified: false
    });

    // Generar tokens
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // Guardar refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await supabase.saveRefreshToken(newUser.id, refreshToken, expiresAt.toISOString());

    res.status(201).json({
      success: true,
      message: 'Cuenta creada exitosamente',
      token: accessToken,
      refreshToken: refreshToken,
      usuario: {
        id: newUser.id,
        username: newUser.username,
        nombre: newUser.nombre,
        email: newUser.email,
        rol: 'cliente'
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario'
    });
  }
});

// ==================== REGISTRO PROFESIONAL ====================
// COMENTADO - Usar /api/auth/register-professional del router auth.js en su lugar
// router.post('/register-professional', async (req, res) => {
//   try {
//     const { nombreEmpresa, nombreDueno, email, password, passwordConfirm, telefono } = req.body;
//
//     // Validaciones
//     if (!nombreEmpresa || !nombreDueno || !email || !password || !passwordConfirm) {
//       return res.status(400).json({
//         success: false,
//         message: 'Todos los campos son requeridos'
//       });
//     }
//
//     if (password !== passwordConfirm) {
//       return res.status(400).json({
//         success: false,
//         message: 'Las contraseñas no coinciden'
//       });
//     }
//
//     if (password.length < 6) {
//       return res.status(400).json({
//         success: false,
//         message: 'La contraseña debe tener al menos 6 caracteres'
//       });
//     }
//
//     // Verificar si el email ya existe
//     const existingUser = await supabase.getUserByEmail(email);
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: 'El email ya está registrado'
//       });
//     }
//
//     // Crear username único
//     const username = nombreDueno.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
//
//     // Hash de la contraseña
//     const hashedPassword = await bcrypt.hash(password, 12);
//
//     // Crear usuario profesional en Supabase
//     const newUser = await supabase.createUser({
//       email: email,
//       username: username,
//       password: hashedPassword,
//       nombre: nombreDueno,
//       telefono: telefono || null,
//       rol: 'profesional',
//       plan: 'trial',
//       is_active: true,
//       is_verified: false
//     });
//
//     // Crear suscripción trial
//     await supabase.createSubscription({
//       user_id: newUser.id,
//       plan: 'trial',
//       status: 'active'
//     });
//
//     // Generar tokens
//     const accessToken = generateAccessToken(newUser);
//     const refreshToken = generateRefreshToken(newUser);
//
//     // Guardar refresh token
//     const expiresAt = new Date();
//     expiresAt.setDate(expiresAt.getDate() + 7);
//     await supabase.saveRefreshToken(newUser.id, refreshToken, expiresAt.toISOString());
//
//     res.status(201).json({
//       success: true,
//       message: 'Cuenta de empresa creada exitosamente',
//       token: accessToken,
//       refreshToken: refreshToken,
//       usuario: {
//         id: newUser.id,
//         username: newUser.username,
//         nombre: newUser.nombre,
//         email: newUser.email,
//         nombreEmpresa: nombreEmpresa,
//         rol: 'profesional',
//         plan: 'trial',
//         diasTrial: 7
//       }
//     });
//
//   } catch (error) {
//     console.error('Error en registro profesional:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error al registrar empresa'
//     });
//   }
// });

// ==================== REFRESH TOKEN ====================
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requerido'
      });
    }

    // Verificar token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    // Verificar en BD
    const storedToken = await supabase.getRefreshToken(refreshToken);
    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Verificar expiración
    if (new Date(storedToken.expires_at) < new Date()) {
      await supabase.deleteRefreshToken(refreshToken);
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    // Obtener usuario
    const user = await supabase.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Generar nuevo access token
    const newAccessToken = generateAccessToken(user);

    res.json({
      success: true,
      token: newAccessToken,
      expiresIn: 900
    });

  } catch (error) {
    console.error('Error en refresh token:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
});

// ==================== LOGOUT ====================
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await supabase.deleteRefreshToken(refreshToken);
    }

    res.json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });

  } catch (error) {
    console.error('Error en logout:', error);
    res.json({
      success: true,
      message: 'Sesión cerrada'
    });
  }
});

// ==================== VERIFICAR TOKEN ====================
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Obtener usuario actualizado
    const user = await supabase.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const diasTrial = calcularDiasTrial(user.trial_end_date);

    res.json({
      success: true,
      usuario: {
        id: user.id,
        username: user.username,
        nombre_completo: user.nombre || user.username,
        email: user.email,
        rol: user.rol,
        plan: user.plan || 'trial',
        diasTrial: diasTrial,
        trialActivo: diasTrial > 0 && user.plan === 'trial'
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
});

// ==================== OBTENER PERFIL ====================
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await supabase.getUserById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const diasTrial = calcularDiasTrial(user.trial_end_date);

    res.json({
      success: true,
      usuario: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol,
        plan: user.plan || 'trial',
        diasTrial: diasTrial,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
});

// ==================== HEALTH CHECK ====================
router.get('/health', async (req, res) => {
  try {
    const result = await supabase.testConnection();
    res.json({
      success: true,
      database: 'supabase',
      status: result.connected ? 'connected' : 'disconnected',
      tablesExist: result.tablesExist
    });
  } catch (error) {
    res.json({
      success: false,
      database: 'supabase',
      error: error.message
    });
  }
});

module.exports = router;
