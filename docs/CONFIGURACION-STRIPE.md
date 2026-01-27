# 🔐 Configuración de Stripe - Guía Completa

## 📋 Índice
1. [Crear Cuenta Stripe](#crear-cuenta-stripe)
2. [Obtener Claves API](#obtener-claves-api)
3. [Configurar Productos y Precios](#configurar-productos)
4. [Configurar Webhooks](#configurar-webhooks)
5. [Integración en el Sistema](#integracion)
6. [Datos Bancarios](#datos-bancarios)
7. [Modo Producción](#modo-produccion)

---

## 1. 🏦 Crear Cuenta Stripe {#crear-cuenta-stripe}

### Paso 1: Registro
1. Ve a **https://dashboard.stripe.com/register**
2. Ingresa tu email y crea una contraseña
3. Verifica tu email

### Paso 2: Completar Perfil de Negocio
1. **Tipo de negocio**: Selecciona "Empresa" o "Autónomo"
2. **Información del negocio**:
   - Nombre legal de la empresa
   - Nombre comercial (ej: "NEURIAX" o tu marca)
   - Dirección fiscal completa
   - Número de teléfono

### Paso 3: Datos Bancarios (IMPORTANTE)
Para recibir los pagos necesitas:
- **IBAN** de tu cuenta bancaria española
- **Nombre del titular** (debe coincidir con el negocio)
- Stripe verificará la cuenta con un micro-depósito

### Paso 4: Verificación de Identidad
- DNI/NIE del representante legal
- Documento de constitución (si es empresa)
- Stripe revisará en 1-2 días hábiles

---

## 2. 🔑 Obtener Claves API {#obtener-claves-api}

### Acceder a las Claves
1. Ve a: **https://dashboard.stripe.com/apikeys**
2. Encontrarás dos tipos de claves:

### Claves de PRUEBA (Modo Test)
```
Clave Publicable: pk_test_xxxxxxxxxxxx
Clave Secreta:    sk_test_xxxxxxxxxxxx
```
- Usa estas para desarrollo
- Los pagos son simulados
- Tarjeta de prueba: `4242 4242 4242 4242`

### Claves de PRODUCCIÓN (Modo Live)
```
Clave Publicable: pk_live_xxxxxxxxxxxx
Clave Secreta:    sk_live_xxxxxxxxxxxx
```
- ⚠️ **NUNCA expongas la clave secreta**
- Solo activar cuando estés listo para cobros reales

---

## 3. 💳 Configurar Productos y Precios {#configurar-productos}

### Crear Productos en Stripe Dashboard

Ve a: **https://dashboard.stripe.com/products**

#### Plan Básico
1. Click en "Añadir producto"
2. **Nombre**: Plan Básico NEURIAX
3. **Descripción**: Gestión de hasta 100 clientes, 2 usuarios
4. **Precio**: 39€/mes (recurrente mensual)
5. Guarda el **Price ID**: `price_basic_monthly`

#### Plan Profesional
1. Click en "Añadir producto"
2. **Nombre**: Plan Profesional NEURIAX
3. **Descripción**: Gestión ilimitada, 10 usuarios, reportes avanzados
4. **Precio**: 79€/mes (recurrente mensual)
5. Guarda el **Price ID**: `price_pro_monthly`

#### Plan Enterprise
1. Click en "Añadir producto"
2. **Nombre**: Plan Enterprise NEURIAX
3. **Descripción**: Solución completa personalizada
4. **Precio**: Personalizado (contactar ventas)

### Crear Precios Anuales (Opcional)
Para cada producto, añade un precio anual con descuento:
- Plan Básico Anual: 390€/año (2 meses gratis)
- Plan Profesional Anual: 790€/año (2 meses gratis)

---

## 4. 🔔 Configurar Webhooks {#configurar-webhooks}

### ¿Qué son los Webhooks?
Stripe envía notificaciones automáticas cuando:
- Un pago se completa
- Una suscripción se renueva
- Un pago falla
- Se cancela una suscripción

### Configurar en Stripe Dashboard

1. Ve a: **https://dashboard.stripe.com/webhooks**
2. Click en "Añadir endpoint"
3. **URL del endpoint**: `https://tu-dominio.com/api/stripe/webhook`
4. **Eventos a escuchar**:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

5. Guarda el **Webhook Secret**: `whsec_xxxxxxxxxxxx`

---

## 5. 🔧 Integración en el Sistema {#integracion}

### Archivo .env
Crea o edita el archivo `.env` en la raíz del proyecto:

```env
# =====================================
# CONFIGURACIÓN STRIPE
# =====================================

# Modo Test (desarrollo)
STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_AQUI
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_AQUI
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET

# Modo Live (producción) - Descomentar cuando estés listo
# STRIPE_PUBLISHABLE_KEY=pk_live_TU_CLAVE_AQUI
# STRIPE_SECRET_KEY=sk_live_TU_CLAVE_AQUI
# STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET_LIVE

# IDs de Precios de Stripe
STRIPE_PRICE_BASIC_MONTHLY=price_xxxx
STRIPE_PRICE_BASIC_YEARLY=price_xxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxx
STRIPE_PRICE_PRO_YEARLY=price_xxxx

# =====================================
# OTRAS CONFIGURACIONES
# =====================================
NODE_ENV=development
JWT_SECRET=tu-clave-jwt-super-segura
DATABASE_URL=tu-conexion-postgresql
```

### Instalar Dependencia de Stripe
```bash
npm install stripe
```

---

## 6. 🏦 Datos Bancarios Requeridos {#datos-bancarios}

### Para Recibir Pagos Necesitas:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **IBAN** | Cuenta bancaria española | ES12 1234 5678 9012 3456 7890 |
| **Titular** | Nombre exacto del titular | NEURIAX SL |
| **Tipo** | Cuenta corriente empresarial | - |
| **Banco** | Cualquier banco español | CaixaBank, BBVA, Santander |

### Proceso de Verificación
1. Stripe hace un micro-depósito (0.01€)
2. Verificas el código en tu extracto
3. Confirmas en Stripe Dashboard
4. ¡Listo para recibir pagos!

### Tiempos de Transferencia
- **Primera transferencia**: 7-14 días
- **Transferencias siguientes**: 2-3 días hábiles
- **Transferencias instantáneas**: Disponible con tarifa adicional

---

## 7. 🚀 Modo Producción {#modo-produccion}

### Checklist Antes de Ir a Producción

- [ ] Cuenta Stripe verificada completamente
- [ ] Datos bancarios configurados y verificados
- [ ] Productos y precios creados en modo Live
- [ ] Claves de producción en `.env`
- [ ] Webhook configurado con URL de producción
- [ ] SSL/HTTPS activo en tu dominio
- [ ] Términos y condiciones actualizados
- [ ] Política de privacidad con mención a Stripe
- [ ] Probado el flujo completo en modo test

### Cambiar a Producción

1. En Stripe Dashboard, activa el modo "Live"
2. Actualiza las claves en tu `.env`:
```env
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx
```
3. Reinicia el servidor
4. Realiza un pago de prueba real (puedes reembolsarlo)

---

## 📞 Soporte

### Contacto Stripe
- **Documentación**: https://stripe.com/docs
- **Soporte**: https://support.stripe.com
- **Status**: https://status.stripe.com

### Tarjetas de Prueba
| Número | Resultado |
|--------|-----------|
| 4242 4242 4242 4242 | Pago exitoso |
| 4000 0000 0000 0002 | Pago rechazado |
| 4000 0000 0000 3220 | Requiere 3D Secure |

---

## ✅ Resumen de Pasos

1. **Crear cuenta** en stripe.com
2. **Verificar negocio** (DNI, dirección, etc.)
3. **Añadir cuenta bancaria** para recibir fondos
4. **Crear productos** (Plan Básico, Pro, Enterprise)
5. **Obtener claves API** y ponerlas en `.env`
6. **Configurar webhooks** para notificaciones
7. **Probar** con tarjetas de prueba
8. **Activar modo Live** cuando estés listo

---

💡 **IMPORTANTE**: El sistema actual funciona en modo simulación. Una vez configures Stripe con tus claves reales, los pagos serán procesados automáticamente.

Para cualquier duda, contacta: soporte@neuriax.com
