# 📖 Manual de Usuario - NEURIAX Platform

## Peluquería & Centro de Estética - v2.0.0

---

## 📋 Índice

1. [Introducción](#introducción)
2. [Requisitos del Sistema](#requisitos-del-sistema)
3. [Acceso al Sistema](#acceso-al-sistema)
4. [Panel Principal (Dashboard)](#panel-principal-dashboard)
5. [Módulos del Sistema](#módulos-del-sistema)
   - [Punto de Venta (POS)](#punto-de-venta-pos)
   - [Agenda de Citas](#agenda-de-citas)
   - [Gestión de Clientes](#gestión-de-clientes)
   - [Catálogo de Servicios](#catálogo-de-servicios)
   - [Inventario](#inventario)
   - [Empleados](#empleados)
   - [Caja](#caja)
   - [Reportes](#reportes)
   - [Analytics](#analytics)
   - [Facturación](#facturación)
   - [Contabilidad](#contabilidad)
   - [Backups](#backups)
   - [API Docs](#api-docs)
   - [Configuración](#configuración)
6. [Preguntas Frecuentes](#preguntas-frecuentes)
7. [Soporte Técnico](#soporte-técnico)

---

## 🎯 Introducción

El **NEURIAX Platform** es una solución integral de gestión para peluquerías y centros de estética. Diseñado para optimizar las operaciones diarias, desde la gestión de citas hasta la facturación electrónica y contabilidad.

### Características Principales

- ✅ **Punto de Venta** - Cobro rápido y eficiente
- ✅ **Agenda Digital** - Gestión completa de citas
- ✅ **CRM de Clientes** - Historial y fidelización
- ✅ **Control de Inventario** - Stock en tiempo real
- ✅ **Facturación Electrónica** - Conforme a normativa española
- ✅ **Contabilidad Integrada** - Asientos automáticos PGC
- ✅ **Reportes Avanzados** - Business Intelligence
- ✅ **Backups Automáticos** - Seguridad de datos

---

## 💻 Requisitos del Sistema

### Navegadores Compatibles
| Navegador | Versión Mínima |
|-----------|----------------|
| Google Chrome | 90+ |
| Mozilla Firefox | 88+ |
| Microsoft Edge | 90+ |
| Safari | 14+ |

### Requisitos de Red
- Conexión a Internet estable
- Puerto 3000 (Frontend) y 3001 (API) disponibles

### Dispositivos
- 💻 Ordenador de escritorio
- 💻 Portátil
- 📱 Tablet (responsive)
- 📱 Móvil (funcionalidad limitada)

---

## 🔐 Acceso al Sistema

### Paso 1: Abrir el Navegador
Accede a la URL del sistema:
```
http://localhost:3000
```
O la URL proporcionada por tu administrador.

### Paso 2: Iniciar Sesión

1. Introduce tu **Usuario**
2. Introduce tu **Contraseña**
3. Haz clic en **Iniciar Sesión**

![Login Screen](./images/login.png)

### Credenciales por Defecto
> ⚠️ **Importante**: Cambia estas credenciales después del primer acceso

| Usuario | Contraseña |
|---------|------------|
| admin | admin123 |

### Recuperar Contraseña
Si olvidaste tu contraseña, contacta al administrador del sistema.

---

## 📊 Panel Principal (Dashboard)

El Dashboard es la pantalla principal donde puedes:

### Estadísticas en Tiempo Real
- 📈 **Ventas del día** - Total facturado hoy
- 👥 **Clientes atendidos** - Número de clientes hoy
- 📅 **Citas pendientes** - Citas programadas
- 💰 **Ingresos del mes** - Facturación mensual

### Acceso Rápido a Módulos
Desde el Dashboard puedes acceder a todos los módulos del sistema haciendo clic en sus iconos.

### Notificaciones
El icono de campana 🔔 muestra las notificaciones importantes:
- Citas próximas
- Stock bajo
- Alertas del sistema

### Actualización de Datos
Haz clic en el botón 🔄 para actualizar las estadísticas.

---

## 📦 Módulos del Sistema

### 💳 Punto de Venta (POS)

El módulo de cobro rápido para atender a tus clientes.

#### Realizar una Venta

1. **Seleccionar Cliente** (opcional)
   - Haz clic en "Buscar Cliente"
   - Escribe el nombre o teléfono
   - Selecciona el cliente

2. **Añadir Servicios**
   - Busca el servicio por nombre
   - Haz clic para añadirlo al carrito
   - Ajusta la cantidad si es necesario

3. **Añadir Productos** (opcional)
   - Cambia a la pestaña "Productos"
   - Selecciona los productos vendidos

4. **Aplicar Descuento** (opcional)
   - Introduce el porcentaje de descuento
   - El total se actualiza automáticamente

5. **Seleccionar Empleado**
   - Elige quién realizó el servicio
   - Esto afecta a las comisiones

6. **Procesar Pago**
   - Selecciona método de pago:
     - 💵 Efectivo
     - 💳 Tarjeta
     - 📱 Bizum
   - Haz clic en "Cobrar"

7. **Imprimir Ticket**
   - El ticket se genera automáticamente
   - Puedes imprimirlo o enviarlo por email

#### Atajos de Teclado
| Tecla | Acción |
|-------|--------|
| F2 | Buscar cliente |
| F3 | Buscar servicio |
| F5 | Aplicar descuento |
| F12 | Procesar pago |
| Esc | Cancelar venta |

---

### 📅 Agenda de Citas

Gestiona todas las citas de tu establecimiento.

#### Vista del Calendario
- **Día**: Ver citas hora por hora
- **Semana**: Vista semanal completa
- **Mes**: Resumen mensual

#### Crear Nueva Cita

1. Haz clic en el botón **+ Nueva Cita**
2. Completa el formulario:
   - **Cliente**: Selecciona o crea nuevo
   - **Servicio**: Elige el servicio
   - **Empleado**: Asigna profesional
   - **Fecha**: Selecciona día
   - **Hora**: Elige horario disponible
   - **Notas**: Observaciones (opcional)
3. Haz clic en **Guardar**

#### Estados de las Citas
| Color | Estado |
|-------|--------|
| 🟡 Amarillo | Pendiente |
| 🟢 Verde | Confirmada |
| 🔵 Azul | En proceso |
| ✅ Gris | Completada |
| 🔴 Rojo | Cancelada |

#### Acciones sobre Citas
- **Editar**: Modifica los datos
- **Confirmar**: Cambia estado a confirmada
- **Cancelar**: Cancela la cita
- **Completar**: Marca como realizada
- **No Show**: Marca si no asistió

#### Recordatorios Automáticos
El sistema envía recordatorios automáticos:
- 24 horas antes por SMS
- 1 hora antes por notificación

---

### 👥 Gestión de Clientes

Base de datos completa de tus clientes.

#### Añadir Nuevo Cliente

1. Haz clic en **+ Nuevo Cliente**
2. Completa los datos:
   - **Nombre** (obligatorio)
   - **Teléfono** (recomendado)
   - **Email**
   - **Fecha de nacimiento**
   - **Dirección**
   - **Notas**
3. Haz clic en **Guardar**

#### Ficha del Cliente
Al hacer clic en un cliente verás:
- **Datos personales**
- **Historial de visitas**
- **Servicios realizados**
- **Total gastado**
- **Puntos de fidelidad**
- **Notas privadas**

#### Búsqueda de Clientes
Usa el buscador para encontrar clientes por:
- Nombre
- Teléfono
- Email

#### Exportar Clientes
1. Haz clic en **Exportar**
2. Selecciona formato (Excel, CSV, PDF)
3. Descarga el archivo

---

### 💇 Catálogo de Servicios

Administra todos los servicios ofrecidos.

#### Añadir Servicio

1. Haz clic en **+ Nuevo Servicio**
2. Completa:
   - **Nombre** (obligatorio)
   - **Categoría**
   - **Precio** (obligatorio)
   - **Duración** (minutos)
   - **Descripción**
   - **Comisión empleado** (%)
3. Haz clic en **Guardar**

#### Categorías de Servicios
Organiza los servicios por categorías:
- Corte
- Color
- Tratamientos
- Maquillaje
- Manicura/Pedicura
- Otros

#### Activar/Desactivar Servicios
- Los servicios desactivados no aparecen en el POS
- Útil para servicios temporales o de temporada

---

### 📦 Inventario

Control de stock de productos.

#### Añadir Producto

1. Haz clic en **+ Nuevo Producto**
2. Completa:
   - **Nombre**
   - **Categoría**
   - **Precio de compra**
   - **Precio de venta**
   - **Stock actual**
   - **Stock mínimo** (alerta)
   - **Proveedor**
3. Haz clic en **Guardar**

#### Movimientos de Stock
- **Entrada**: Recepción de mercancía
- **Salida**: Venta o consumo interno
- **Ajuste**: Corrección de inventario

#### Alertas de Stock
El sistema avisa cuando:
- 🟡 Stock bajo (cerca del mínimo)
- 🔴 Sin stock (agotado)

#### Inventario Físico
1. Haz clic en **Inventario Físico**
2. Introduce las cantidades reales
3. El sistema calcula las diferencias
4. Confirma los ajustes

---

### 👔 Empleados

Gestión del equipo de trabajo.

#### Añadir Empleado

1. Haz clic en **+ Nuevo Empleado**
2. Completa:
   - **Nombre completo**
   - **Puesto**
   - **Teléfono**
   - **Email**
   - **Fecha de alta**
   - **Comisión base** (%)
   - **Especialidades**
3. Haz clic en **Guardar**

#### Horarios
Define los horarios de cada empleado:
- Días laborables
- Hora de entrada/salida
- Pausas

#### Comisiones
Visualiza las comisiones generadas:
- Por servicio
- Por producto
- Total del mes

---

### 💵 Caja

Control de movimientos de efectivo.

#### Abrir Caja
1. Haz clic en **Abrir Caja**
2. Introduce el **Fondo inicial**
3. Confirma

#### Movimientos de Caja
- **Ingreso**: Dinero que entra
- **Gasto**: Dinero que sale
- **Cobro**: Pago de cliente (automático)

#### Registrar Movimiento Manual
1. Haz clic en **+ Movimiento**
2. Selecciona tipo (Ingreso/Gasto)
3. Introduce importe
4. Describe el concepto
5. Guarda

#### Cierre de Caja
1. Haz clic en **Cerrar Caja**
2. Cuenta el efectivo físico
3. Introduce el importe contado
4. El sistema calcula la diferencia
5. Confirma el cierre

#### Cuadre de Caja
| Estado | Descripción |
|--------|-------------|
| ✅ Cuadrada | Diferencia = 0€ |
| ⚠️ Descuadre menor | Diferencia < 5€ |
| ❌ Descuadre mayor | Diferencia > 5€ |

---

### 📈 Reportes

Informes y estadísticas del negocio.

#### Tipos de Reportes

**Ventas**
- Ventas diarias
- Ventas semanales
- Ventas mensuales
- Por empleado
- Por servicio

**Clientes**
- Nuevos clientes
- Clientes frecuentes
- Top clientes
- Clientes inactivos

**Servicios**
- Más solicitados
- Por categoría
- Evolución temporal

**Financiero**
- Ingresos vs gastos
- Rentabilidad
- Comparativas

#### Exportar Reportes
Todos los reportes se pueden exportar a:
- 📊 Excel
- 📄 PDF
- 📁 CSV

---

### 📉 Analytics

Business Intelligence avanzado.

#### Panel de Analytics
- Tendencias de ventas
- Predicciones
- KPIs del negocio
- Análisis de rendimiento

#### Métricas Clave
- **Ticket Medio**: Valor promedio de venta
- **Frecuencia de Visita**: Cada cuánto vuelven
- **Tasa de Retención**: % clientes que repiten
- **Ocupación**: % de horas productivas

---

### 🧾 Facturación

Sistema de facturación electrónica.

#### Crear Factura

1. Haz clic en **+ Nueva Factura**
2. Selecciona cliente
3. Añade líneas de factura
4. Revisa totales (Base + IVA)
5. Emite la factura

#### Series de Facturación
- **F**: Facturas normales
- **R**: Facturas rectificativas
- **S**: Facturas simplificadas

#### Enviar Factura
- Por email automático
- Descarga PDF
- Enlace de acceso

#### Verificar Factura
El sistema incluye código QR de verificación conforme a la normativa española.

---

### 📚 Contabilidad

Integración contable con el Plan General Contable.

#### Asientos Automáticos
El sistema genera asientos contables automáticamente:
- Ventas → 700 Ventas de mercaderías
- Cobros efectivo → 570 Caja
- Cobros tarjeta → 572 Bancos
- IVA → 477 HP IVA Repercutido

#### Libro Mayor
Consulta los movimientos por cuenta.

#### Balance de Sumas y Saldos
Visualiza el estado de todas las cuentas.

#### Exportar a Software Contable
Exporta los asientos en formatos compatibles:
- A3 Contabilidad
- ContaPlus
- Sage
- Excel

---

### 💾 Backups

Sistema de copias de seguridad.

#### Backup Manual
1. Haz clic en **Crear Backup**
2. Espera a que se complete
3. El backup se guarda automáticamente

#### Restaurar Backup
1. Selecciona el backup a restaurar
2. Confirma la acción
3. ⚠️ Los datos actuales se sobrescribirán

#### Backups Automáticos
El sistema realiza backups automáticos:
- Cada 24 horas
- Antes de actualizaciones
- Se mantienen los últimos 30 días

---

### 📖 API Docs

Documentación de la API para desarrolladores.

#### Acceso
- **Swagger UI**: Interfaz interactiva
- **ReDoc**: Documentación detallada
- **OpenAPI JSON**: Especificación técnica

---

### ⚙️ Configuración

Ajustes del sistema.

#### Datos del Negocio
- Nombre comercial
- CIF/NIF
- Dirección
- Teléfono
- Email
- Logo

#### Configuración Fiscal
- Tipo de IVA por defecto
- Retenciones
- Series de facturación

#### Configuración de Tickets
- Cabecera personalizada
- Pie de ticket
- Mensaje de agradecimiento

#### Usuarios y Permisos
- Crear usuarios
- Asignar roles
- Gestionar permisos

#### Notificaciones
- Email de alertas
- Recordatorios SMS
- Informes automáticos

---

## ❓ Preguntas Frecuentes

### ¿Cómo cambio mi contraseña?
1. Ve a Configuración → Mi Perfil
2. Haz clic en "Cambiar contraseña"
3. Introduce la contraseña actual y la nueva
4. Guarda los cambios

### ¿Puedo usar el sistema en varios dispositivos?
Sí, el sistema es accesible desde cualquier dispositivo con navegador web.

### ¿Qué hago si el sistema va lento?
1. Actualiza la página (F5)
2. Limpia la caché del navegador
3. Contacta a soporte si persiste

### ¿Cómo recupero datos borrados?
Los datos eliminados van a la papelera durante 30 días. Contacta a soporte para restauraciones.

### ¿El sistema funciona sin internet?
Actualmente se requiere conexión a internet. La versión offline está en desarrollo.

---

## 🆘 Soporte Técnico

### Contacto
- 📧 Email: soporte@neuriax.com
- 📞 Teléfono: +34 900 123 456
- 💬 Chat en vivo: Disponible en horario laboral

### Horario de Atención
- Lunes a Viernes: 9:00 - 20:00
- Sábados: 10:00 - 14:00

### Reportar un Error
1. Describe el problema detalladamente
2. Incluye capturas de pantalla si es posible
3. Indica los pasos para reproducir el error
4. Envía a soporte@neuriax.com

---

## 📝 Historial de Versiones

| Versión | Fecha | Novedades |
|---------|-------|-----------|
| 2.0.0 | Enero 2026 | Sistema completo con todos los módulos |
| 1.5.0 | Diciembre 2025 | Facturación electrónica y contabilidad |
| 1.0.0 | Noviembre 2025 | Versión inicial |

---

**© 2026 NEURIAX Platform - Todos los derechos reservados**

*Documento generado automáticamente - Última actualización: Enero 2026*
