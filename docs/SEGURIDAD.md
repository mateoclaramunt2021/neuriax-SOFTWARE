# 🔒 SEGURIDAD - NEURIAX SaaS Platform

## Resumen de Medidas de Seguridad Implementadas

### 1. 🔐 Hashing de Contraseñas (bcrypt)

- **Algoritmo**: bcrypt con salt rounds = 12
- **Ubicación**: Todas las rutas de registro y cambio de contraseña
- **Protección**: Contraseñas nunca almacenadas en texto plano

```javascript
// Ejemplo de uso
const hashedPassword = bcrypt.hashSync(password, 12);
```

### 2. 🔑 Encriptación de Datos Sensibles (AES-256-GCM)

- **Algoritmo**: AES-256-GCM (autenticado)
- **Datos encriptados**: Email, teléfono, dirección, datos de pago
- **Servicio**: `server/services/securityService.js`

```javascript
const securityService = require('./services/securityService');

// Encriptar
const encryptedEmail = securityService.encrypt(email);

// Desencriptar
const originalEmail = securityService.decrypt(encryptedEmail);
```

### 3. 🛡️ Protección HTTP Headers (Helmet)

Helmet configura automáticamente:
- `X-DNS-Prefetch-Control`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection`
- `Strict-Transport-Security` (HSTS)
- `Referrer-Policy`

### 4. 🚦 Rate Limiting

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `/api/auth/login` | 5 intentos | 15 min |
| `/api/auth/forgot-password` | 3 intentos | 30 min |
| `/api/auth/reset-password` | 10 intentos | 15 min |
| API General | 100 req | 15 min |

### 5. 🔒 Bloqueo por Intentos Fallidos

- **Máximo**: 5 intentos fallidos
- **Bloqueo progresivo**: 1min → 5min → 15min → 1h → 24h
- **Registro**: Por usuario ID e IP

### 6. 📝 Validación y Sanitización

Middleware automático en todas las rutas:
- Sanitización XSS
- Detección de inyección SQL/NoSQL
- Validación de email, teléfono, username
- Validación de contraseña fuerte

**Requisitos de contraseña**:
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número
- No puede ser contraseña común

### 7. 🎫 Tokens JWT

- **Access Token**: 8 horas de validez
- **Refresh Token**: 7 días de validez
- **Remember Me**: 30 días de validez
- **Secret**: Variable de entorno `JWT_SECRET`

### 8. 👤 Autenticación de 2 Factores (2FA)

Sistema preparado con TOTP (Time-based One-Time Password):
- Generación de secretos QR
- Códigos de respaldo
- Ventana de verificación: ±1 período

### 9. 🌐 CORS Configurado

```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID']
};
```

### 10. 📊 Logging de Seguridad

Todos los eventos de seguridad se registran:
- Intentos de login (exitosos y fallidos)
- Cambios de contraseña
- Bloqueos de cuenta
- Posibles ataques detectados

---

## Variables de Entorno de Seguridad

```env
# JWT
JWT_SECRET=tu_clave_super_secreta_aqui

# Encriptación
ENCRYPTION_KEY=tu_clave_aes_256_aqui

# CORS
CORS_ORIGIN=https://tu-dominio.com
```

---

## Archivos de Seguridad Clave

| Archivo | Propósito |
|---------|-----------|
| `server/services/securityService.js` | Servicio central de seguridad |
| `server/middleware/validation.js` | Validación y sanitización |
| `server/middleware/auth.js` | Autenticación JWT |
| `server/routes/auth.js` | Rutas de autenticación |

---

## Checklist de Seguridad ✅

- [x] Contraseñas hasheadas con bcrypt (cost 12)
- [x] Datos sensibles encriptados con AES-256-GCM
- [x] Headers HTTP seguros (Helmet)
- [x] Rate limiting en endpoints sensibles
- [x] Bloqueo por intentos fallidos
- [x] Sanitización de entrada (XSS)
- [x] Detección de inyección SQL/NoSQL
- [x] Validación de contraseña fuerte
- [x] Tokens JWT con expiración
- [x] Sistema 2FA preparado
- [x] CORS configurado
- [x] Logging de eventos de seguridad

---

**Última actualización**: Junio 2025
**Versión**: 1.0.0
