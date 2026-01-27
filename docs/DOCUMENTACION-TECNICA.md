# 🔧 Documentación Técnica - NEURIAX Platform

## Arquitectura y Especificaciones del Sistema v2.0.0

---

## 📋 Índice

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [API REST](#api-rest)
5. [Base de Datos](#base-de-datos)
6. [Autenticación y Seguridad](#autenticación-y-seguridad)
7. [Instalación y Despliegue](#instalación-y-despliegue)
8. [Configuración](#configuración)
9. [Testing](#testing)
10. [Mantenimiento](#mantenimiento)
11. [Troubleshooting](#troubleshooting)

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    React 18 SPA                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │Dashboard │ │   POS    │ │  Citas   │ │Clientes  │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │Inventario│ │Empleados │ │  Caja    │ │Reportes  │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │Analytics │ │Facturac. │ │Contabil. │ │ Backups  │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                         HTTP/HTTPS                               │
│                              │                                   │
└──────────────────────────────│───────────────────────────────────┘
                               │
┌──────────────────────────────│───────────────────────────────────┐
│                         SERVIDOR                                  │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Express.js API                        │   │
│  │                      (Port 3001)                         │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │                 Middlewares                       │   │   │
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │   │   │
│  │  │  │  CORS  │ │Compress│ │  Auth  │ │ Logger │    │   │   │
│  │  │  └────────┘ └────────┘ └────────┘ └────────┘    │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │                   Routes                          │   │   │
│  │  │  /auth  /clientes  /servicios  /citas  /ventas   │   │   │
│  │  │  /inventario  /empleados  /caja  /reportes       │   │   │
│  │  │  /analytics  /facturacion  /contabilidad         │   │   │
│  │  │  /backup  /notificaciones  /docs                  │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │                  Services                         │   │   │
│  │  │  BackupService  FacturacionService               │   │   │
│  │  │  ContabilidadService  InformesAutomaticos        │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Base de Datos                         │   │
│  │                     (JSON Files)                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐               │   │
│  │  │database  │ │facturas  │ │contabil. │               │   │
│  │  │  .json   │ │  .json   │ │  .json   │               │   │
│  │  └──────────┘ └──────────┘ └──────────┘               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Patrón de Diseño

El sistema implementa una arquitectura **Cliente-Servidor** con:

- **Frontend**: Single Page Application (SPA) con React
- **Backend**: API RESTful con Express.js
- **Datos**: JSON file-based storage (escalable a PostgreSQL)
- **Autenticación**: JWT (JSON Web Tokens)

---

## 🛠️ Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.x | Framework UI |
| React Hooks | - | Estado y efectos |
| CSS3 | - | Estilos |
| Fetch API | - | Comunicación HTTP |

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 18.x+ | Runtime JavaScript |
| Express.js | 4.x | Framework HTTP |
| JWT | - | Autenticación |
| Compression | - | GZIP responses |
| CORS | - | Cross-Origin |
| Nodemailer | - | Emails |

### Herramientas de Desarrollo

| Herramienta | Propósito |
|-------------|-----------|
| npm | Gestor de paquetes |
| VS Code | IDE recomendado |
| Git | Control de versiones |
| Postman | Testing API |

---

## 📁 Estructura del Proyecto

```
sistema-cobros-app/
├── 📁 client/                    # Frontend React
│   ├── 📁 public/
│   │   └── index.html
│   ├── 📁 src/
│   │   ├── 📁 analytics/
│   │   │   └── AnalyticsDashboard.js
│   │   ├── 📁 components/
│   │   │   ├── ApiDocsManager.js
│   │   │   ├── BackupManager.js
│   │   │   ├── Caja.js
│   │   │   ├── Citas.js
│   │   │   ├── Clientes.js
│   │   │   ├── Configuracion.js
│   │   │   ├── ContabilidadManager.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Empleados.js
│   │   │   ├── FacturacionManager.js
│   │   │   ├── Inventario.js
│   │   │   ├── Login.js
│   │   │   ├── PerformanceMonitor.js
│   │   │   ├── POS.js
│   │   │   ├── Reportes.js
│   │   │   └── Servicios.js
│   │   ├── 📁 utils/
│   │   │   └── apiClient.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
│
├── 📁 server/                    # Backend Express
│   ├── 📁 database/
│   │   ├── database.json         # Datos principales
│   │   ├── facturas.json         # Facturación
│   │   ├── contabilidad.json     # Contabilidad
│   │   └── init.js
│   ├── 📁 docs/
│   │   ├── index.js              # Rutas documentación
│   │   └── swagger.js            # OpenAPI spec
│   ├── 📁 logs/
│   │   └── *.log
│   ├── 📁 middleware/
│   │   └── auth.js
│   ├── 📁 routes/
│   │   ├── analytics.js
│   │   ├── auth.js
│   │   ├── caja.js
│   │   ├── citas.js
│   │   ├── clientes.js
│   │   ├── configuracion.js
│   │   ├── dashboard.js
│   │   ├── empleados.js
│   │   ├── inventario.js
│   │   ├── notificaciones.js
│   │   ├── reportes.js
│   │   ├── servicios.js
│   │   └── ventas.js
│   ├── 📁 services/
│   │   ├── backupService.js
│   │   ├── contabilidadService.js
│   │   ├── facturacionService.js
│   │   └── informesAutomaticos.js
│   ├── index.js                  # Entry point
│   └── logger.js
│
├── 📁 docs/                      # Documentación
│   ├── MANUAL-USUARIO.md
│   └── DOCUMENTACION-TECNICA.md
│
├── 📁 backups/                   # Copias de seguridad
│
├── .env                          # Variables de entorno
├── package.json
└── README.md
```

---

## 🔌 API REST

### Base URL
```
http://localhost:3001/api
```

### Endpoints Principales

#### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/login` | Iniciar sesión |
| POST | `/auth/logout` | Cerrar sesión |
| GET | `/auth/verify` | Verificar token |

#### Clientes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/clientes` | Listar clientes |
| GET | `/clientes/:id` | Obtener cliente |
| POST | `/clientes` | Crear cliente |
| PUT | `/clientes/:id` | Actualizar cliente |
| DELETE | `/clientes/:id` | Eliminar cliente |

#### Servicios
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/servicios` | Listar servicios |
| POST | `/servicios` | Crear servicio |
| PUT | `/servicios/:id` | Actualizar servicio |
| DELETE | `/servicios/:id` | Eliminar servicio |

#### Ventas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/ventas` | Listar ventas |
| POST | `/ventas` | Registrar venta |

#### Facturación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/facturacion/facturas` | Listar facturas |
| POST | `/facturacion/emitir` | Emitir factura |
| GET | `/facturacion/pdf/:id` | Descargar PDF |

#### Contabilidad
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/contabilidad/estadisticas` | Estadísticas |
| GET | `/contabilidad/plan-cuentas` | Plan contable |
| POST | `/contabilidad/asiento` | Crear asiento |
| GET | `/contabilidad/libro-mayor` | Libro mayor |

### Headers Requeridos

```http
Content-Type: application/json
Authorization: Bearer <token>
```

### Respuestas Estándar

**Éxito (200)**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa"
}
```

**Error (4xx/5xx)**
```json
{
  "success": false,
  "message": "Descripción del error"
}
```

### Documentación Interactiva

- **Swagger UI**: `http://localhost:3001/api/docs`
- **ReDoc**: `http://localhost:3001/api/redoc`
- **OpenAPI JSON**: `http://localhost:3001/api/docs/json`

---

## 💾 Base de Datos

### Estructura database.json

```json
{
  "usuarios": [
    {
      "id": 1,
      "username": "admin",
      "password": "hash...",
      "rol": "administrador",
      "nombre_completo": "Administrador"
    }
  ],
  "clientes": [
    {
      "id": 1,
      "nombre": "María García",
      "telefono": "612345678",
      "email": "maria@email.com",
      "notas": "",
      "fecha_registro": "2026-01-01T10:00:00.000Z",
      "total_gastado": 150.00,
      "visitas": 5
    }
  ],
  "servicios": [
    {
      "id": 1,
      "nombre": "Corte de pelo",
      "categoria": "Corte",
      "precio": 25.00,
      "duracion": 30,
      "activo": true,
      "comision": 10
    }
  ],
  "citas": [
    {
      "id": 1,
      "clienteId": 1,
      "servicioId": 1,
      "empleadoId": 1,
      "fecha": "2026-01-24",
      "hora": "10:00",
      "estado": "pendiente",
      "notas": ""
    }
  ],
  "ventas": [
    {
      "id": 1,
      "fecha": "2026-01-24T11:30:00.000Z",
      "clienteId": 1,
      "empleadoId": 1,
      "items": [],
      "subtotal": 25.00,
      "descuento": 0,
      "total": 25.00,
      "metodoPago": "efectivo"
    }
  ],
  "productos": [],
  "empleados": [],
  "movimientos_caja": [],
  "configuracion": {}
}
```

### Estructura facturas.json

```json
{
  "empresa": {
    "nombre": "NEURIAX Salon Manager",
    "cif": "B12345678",
    "direccion": "Calle Principal 123",
    "codigoPostal": "28001",
    "ciudad": "Madrid",
    "provincia": "Madrid",
    "telefono": "912345678",
    "email": "info@neuriax.com"
  },
  "series": {
    "F": { "ultimoNumero": 0, "prefijo": "F" },
    "R": { "ultimoNumero": 0, "prefijo": "R" },
    "S": { "ultimoNumero": 0, "prefijo": "S" }
  },
  "facturas": []
}
```

### Estructura contabilidad.json

```json
{
  "empresa": {
    "nombre": "NEURIAX Salon Manager",
    "cif": "B12345678"
  },
  "ejercicio": 2026,
  "planCuentas": {
    "100": { "nombre": "Capital social", "tipo": "pasivo" },
    "430": { "nombre": "Clientes", "tipo": "activo" },
    "570": { "nombre": "Caja, euros", "tipo": "activo" },
    "572": { "nombre": "Bancos c/c", "tipo": "activo" },
    "700": { "nombre": "Ventas de mercaderías", "tipo": "ingreso" },
    "477": { "nombre": "HP IVA Repercutido", "tipo": "pasivo" }
  },
  "asientos": [],
  "libroMayor": {}
}
```

---

## 🔐 Autenticación y Seguridad

### JWT (JSON Web Tokens)

**Generación de Token**
```javascript
const token = jwt.sign(
  {
    id: usuario.id,
    username: usuario.username,
    rol: usuario.rol
  },
  JWT_SECRET,
  { expiresIn: '8h' }
);
```

**Verificación de Token**
```javascript
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token no proporcionado' 
    });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
}
```

### Variables de Entorno

```env
# .env
JWT_SECRET=neuriax-saas-2026-secret-key
JWT_EXPIRY=8h
NODE_ENV=development
PORT=3001
```

### Medidas de Seguridad

1. **CORS configurado** - Solo orígenes permitidos
2. **Validación de entrada** - Sanitización de datos
3. **Hashing de contraseñas** - bcrypt (pendiente)
4. **HTTPS** - En producción
5. **Rate limiting** - Protección DDoS (pendiente)
6. **Headers de seguridad** - Helmet.js (pendiente)

---

## 🚀 Instalación y Despliegue

### Requisitos Previos

- Node.js 18.x o superior
- npm 9.x o superior
- Git

### Instalación Local

```bash
# 1. Clonar repositorio
git clone https://github.com/empresa/sistema-cobros-app.git
cd sistema-cobros-app

# 2. Instalar dependencias del servidor
npm install

# 3. Instalar dependencias del cliente
cd client
npm install
cd ..

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 5. Iniciar el sistema
npm start
```

### Despliegue en Producción

#### Opción 1: PM2

```bash
# Instalar PM2
npm install -g pm2

# Iniciar servidor
pm2 start server/index.js --name "begona-api"

# Construir cliente
cd client
npm run build

# Servir con Nginx o similar
```

#### Opción 2: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . .
EXPOSE 3001

CMD ["node", "server/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    volumes:
      - ./data:/app/server/database
```

---

## ⚙️ Configuración

### Configuración del Servidor

```javascript
// server/index.js
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '8h';
```

### Configuración CORS

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://tudominio.com'],
  credentials: true
}));
```

### Configuración de Logs

```javascript
// Niveles: info, warn, error, debug
logger.setLevel('info');
logger.setOutput('./logs/app.log');
```

---

## 🧪 Testing

### Testing Manual API

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Obtener clientes
curl -X GET http://localhost:3001/api/clientes \
  -H "Authorization: Bearer <token>"
```

### Testing con Postman

1. Importar colección desde `/docs/postman-collection.json`
2. Configurar variables de entorno
3. Ejecutar tests

### Testing Automatizado (Futuro)

```javascript
// test/api.test.js
describe('API Tests', () => {
  it('should login successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
```

---

## 🔧 Mantenimiento

### Backups

```bash
# Backup manual
node -e "require('./server/services/backupService').backupService.createBackup()"

# Programar backup (cron)
0 2 * * * cd /app && node -e "require('./server/services/backupService').backupService.createBackup()"
```

### Logs

```bash
# Ver logs en tiempo real
tail -f server/logs/app.log

# Rotar logs (logrotate)
/path/to/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
}
```

### Actualizaciones

```bash
# 1. Backup antes de actualizar
npm run backup

# 2. Pull cambios
git pull origin main

# 3. Instalar dependencias
npm install
cd client && npm install

# 4. Reiniciar servicios
pm2 restart all
```

---

## 🐛 Troubleshooting

### Error: Puerto en uso

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### Error: Token inválido

1. Verificar que el token no ha expirado
2. Comprobar JWT_SECRET en .env
3. Limpiar localStorage y hacer login nuevo

### Error: Base de datos corrupta

```bash
# Restaurar desde backup
node -e "require('./server/services/backupService').backupService.restoreBackup('backup-YYYY-MM-DD.json')"
```

### Error: Memoria insuficiente

```bash
# Aumentar memoria de Node
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### Logs de Depuración

```javascript
// Activar logs detallados
DEBUG=* npm start

// O en código
console.log('Debug:', variable);
logger.debug('Mensaje detallado');
```

---

## 📞 Soporte Técnico

### Contacto Desarrollo
- Email: dev@neuriax.com
- Slack: #sistema-cobros

### Repositorio
- GitHub: https://github.com/empresa/sistema-cobros-app
- Issues: https://github.com/empresa/sistema-cobros-app/issues

### Documentación Adicional
- API Docs: http://localhost:3001/api/docs
- Wiki: https://wiki.neuriax.com

---

**© 2026 NEURIAX Platform - Documentación Técnica v2.0.0**

*Última actualización: Enero 2026*
