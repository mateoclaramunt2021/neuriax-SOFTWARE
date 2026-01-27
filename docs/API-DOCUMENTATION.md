# 📚 DOCUMENTACIÓN API - NEURIAX Salon Manager

**Versión:** FASE 12 COMPLETADA  
**Última actualización:** 23 Enero 2026  
**Status:** ✅ Producción

---

## 🔑 AUTENTICACIÓN

### Endpoints de Autenticación

#### 1. **POST /api/auth/login**
Inicia sesión y obtiene token JWT

**Request:**
```bash
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Sesión iniciada correctamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "username": "admin",
    "nombre_completo": "Administrador",
    "rol": "administrador"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

---

#### 2. **POST /api/auth/logout**
Cierra sesión (requiere token)

**Request:**
```bash
POST http://localhost:3001/api/auth/logout
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Sesión cerrada"
}
```

---

#### 3. **GET /api/auth/verify**
Verifica si el token es válido (requiere token)

**Request:**
```bash
GET http://localhost:3001/api/auth/verify
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "usuario": {
    "id": 1,
    "username": "admin",
    "nombre_completo": "Administrador",
    "rol": "administrador",
    "iat": 1674415200,
    "exp": 1674452400
  }
}
```

---

## 💇 SERVICIOS (CRUD)

### 1. **GET /api/servicios**
Lista todos los servicios (requiere token)

**Request:**
```bash
GET http://localhost:3001/api/servicios
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Corte de cabello",
      "categoria": "Corte",
      "precio": 25.00,
      "duracion": 30
    }
  ],
  "total": 5
}
```

---

### 2. **POST /api/servicios**
Crea un nuevo servicio (requiere token)

**Request:**
```bash
POST http://localhost:3001/api/servicios
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "Tratamiento capilar",
  "categoria": "Tratamiento",
  "precio": 45.00,
  "duracion": 45
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Servicio creado",
  "data": {
    "id": 6,
    "nombre": "Tratamiento capilar",
    "categoria": "Tratamiento",
    "precio": 45.00,
    "duracion": 45
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validación fallida",
  "errores": [
    "Nombre del servicio requerido",
    "Precio debe ser un número válido"
  ]
}
```

---

### 3. **PUT /api/servicios/:id**
Actualiza un servicio (requiere token)

**Request:**
```bash
PUT http://localhost:3001/api/servicios/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "Corte de cabello Premium",
  "precio": 35.00
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Servicio actualizado",
  "data": {
    "id": 1,
    "nombre": "Corte de cabello Premium",
    "precio": 35.00
  }
}
```

---

### 4. **DELETE /api/servicios/:id**
Elimina un servicio (requiere token)

**Request:**
```bash
DELETE http://localhost:3001/api/servicios/1
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Servicio eliminado"
}
```

---

## 👥 CLIENTES (CRUD)

### 1. **GET /api/clientes**
Lista todos los clientes (requiere token)

**Request:**
```bash
GET http://localhost:3001/api/clientes
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "María García",
      "telefono": "666123456",
      "email": "maria@example.com",
      "notas": "Cliente frecuente"
    }
  ],
  "total": 8
}
```

---

### 2. **POST /api/clientes**
Crea un nuevo cliente (requiere token)

**Request:**
```bash
POST http://localhost:3001/api/clientes
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "telefono": "666987654",
  "email": "juan@example.com",
  "notas": "Primer cliente"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Cliente registrado",
  "data": {
    "id": 9,
    "nombre": "Juan Pérez",
    "telefono": "666987654",
    "email": "juan@example.com",
    "notas": "Primer cliente"
  }
}
```

---

## 📊 DASHBOARD

### **GET /api/dashboard**
Obtiene estadísticas del sistema (requiere token)

**Request:**
```bash
GET http://localhost:3001/api/dashboard
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total_servicios": 5,
    "total_clientes": 8,
    "total_empleados": 3,
    "total_ventas_hoy": 120.50,
    "citas_pendientes": 5
  }
}
```

---

## 💳 VENTAS

### **GET /api/ventas**
Lista todas las ventas (requiere token)

**Request:**
```bash
GET http://localhost:3001/api/ventas
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "cliente_id": 1,
      "servicios": [...],
      "total": 75.00,
      "fecha": "2026-01-23T10:30:00Z"
    }
  ]
}
```

---

### **POST /api/ventas**
Registra una nueva venta (requiere token)

**Request:**
```bash
POST http://localhost:3001/api/ventas
Authorization: Bearer <token>
Content-Type: application/json

{
  "cliente_id": 1,
  "servicios": [
    {"id": 1, "cantidad": 1, "precio": 25.00}
  ],
  "descuento": 0,
  "metodo_pago": "efectivo",
  "notas": "Cliente frecuente - descuento aplicado"
}
```

---

## 📅 CITAS

### **GET /api/citas**
Lista todas las citas (requiere token)

### **POST /api/citas**
Crea una nueva cita (requiere token)

---

## 👨‍💼 EMPLEADOS

### **GET /api/empleados**
Lista todos los empleados (requiere token)

---

## 📦 INVENTARIO

### **GET /api/inventario**
Lista inventario (requiere token)

---

## 📈 REPORTES

### **GET /api/reportes**
Genera reportes (requiere token)

---

## 💰 CAJA

### **GET /api/caja**
Información de la caja (requiere token)

---

## ⚙️ CONFIGURACIÓN

### **GET /api/configuracion**
Obtiene configuración del negocio (requiere token)

### **PUT /api/configuracion**
Actualiza configuración del negocio (requiere token)

---

## 🔒 SEGURIDAD

### Headers Requeridos
```
Authorization: Bearer <token_jwt>
Content-Type: application/json
```

### Códigos de Error
- **400 Bad Request** - Validación fallida
- **401 Unauthorized** - Token no válido/expirado
- **404 Not Found** - Recurso no encontrado
- **500 Internal Server Error** - Error del servidor

### Credenciales Por Defecto
```
Usuario: admin
Contraseña: admin123
```

---

## 📝 FORMATO DE RESPUESTAS

### Respuesta Exitosa
```json
{
  "success": true,
  "message": "Descripción del éxito",
  "data": {...}
}
```

### Respuesta con Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "errores": ["Error 1", "Error 2"]
}
```

---

## 🚀 EXAMPLES CURL

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Obtener Servicios
```bash
curl -X GET http://localhost:3001/api/servicios \
  -H "Authorization: Bearer <token>"
```

### Crear Servicio
```bash
curl -X POST http://localhost:3001/api/servicios \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Corte","categoria":"Corte","precio":25,"duracion":30}'
```

---

**API Documentation - v1.0**  
**© 2026 NEURIAX Salon Manager**
