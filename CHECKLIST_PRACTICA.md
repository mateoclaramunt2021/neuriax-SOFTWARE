# ✔️ CHECKLIST PRÁCTICO - QUÉ FALTA ARREGLAR

> Usa este documento como tu lista de tareas. Marca cada item según avances.

---

## 📋 CHECKLIST RÁPIDO (10 MIN OVERVIEW)

```
¿NECESITO STRIPE PARA COBRAR?
  [X] SÍ, es lo mejor para PCI-DSS
  [ ] No, voy a usar otra plataforma

¿TENGO UNA CUENTA EN STRIPE?
  [ ] Ya la tengo
  [ ] Necesito crearla

¿TENGO LAS CLAVES API?
  [ ] Test keys listas
  [ ] Live keys listas
  [ ] Nada de eso

¿TENGO ARCHIVO .env?
  [ ] Sí, con todas variables
  [ ] Sí, pero incompleto
  [ ] No existe

¿TENGO STRIPE ELEMENTS EN CLIENTE?
  [ ] Ya lo tengo
  [ ] Necesito instalarlo
  [ ] ¿Qué es eso?

¿TENGO WEBHOOK HANDLER?
  [ ] Implementado y funcionando
  [ ] Parcialmente hecho
  [ ] No existe

¿PUEDO COBRAR AHORA?
  [ ] SÍ, completamente
  [ ] Parcialmente (con riesgos)
  [ ] No, faltan muchas cosas
```

---

## 🔧 CHECKLIST DETALLADO POR SECCIÓN

### SECCIÓN A: CUENTA STRIPE

#### A.1 Crear Cuenta (5 minutos)

- [ ] Ir a https://dashboard.stripe.com/register
- [ ] Crear cuenta con email
- [ ] Verificar email
- [ ] Seleccionar país
- [ ] Completar nombre y datos básicos
- [ ] ✅ COMPLETADO: Ahora tienes dashboard de Stripe

#### A.2 Verificar Negocio (15 minutos)

En Stripe Dashboard → Configuración → Datos de Empresa:

- [ ] Nombre legal del negocio
- [ ] Dirección completa
- [ ] NIF/CIF/RUT
- [ ] Teléfono de contacto
- [ ] Email de administrador
- [ ] Nombre del dueño
- [ ] Fechas de nacimiento (dueños)
- [ ] % de propiedad
- [ ] Descripción del negocio
- [ ] Sitio web (puede ser temporal)
- [ ] ✅ COMPLETADO: Perfil verificado

#### A.3 Agregar Cuenta Bancaria (10 minutos)

En Stripe Dashboard → Configuración → Pagos:

- [ ] IBAN verificado
- [ ] Nombre del titular correcto
- [ ] Banco confirmado
- [ ] Verificación completada (transferencias de prueba)
- [ ] ✅ COMPLETADO: Listo para recibir pagos

#### A.4 Obtener Claves (2 minutos)

En Stripe Dashboard → Desarrolladores → Claves de API:

- [ ] Clave Secreta Test (sk_test_...)
- [ ] Clave Publicable Test (pk_test_...)
- [ ] Clave Secreta Live (sk_live_...) *para después*
- [ ] Clave Publicable Live (pk_live_...) *para después*
- [ ] ✅ COMPLETADO: Claves guardadas seguramente

#### A.5 Crear Webhook Secret (2 minutos)

En Stripe Dashboard → Desarrolladores → Webhooks:

- [ ] Crear nuevo webhook endpoint
- [ ] Endpoint URL: https://tudominio.com/api/stripe/webhook
- [ ] Seleccionar eventos (payment_intent.*, customer.subscription.*)
- [ ] Copiar Signing Secret (whsec_...)
- [ ] ✅ COMPLETADO: Webhook secret guardado

#### A.6 Crear Productos y Precios

En Stripe Dashboard → Productos:

**Plan Básico:**
- [ ] Crear producto "Plan Básico NEURIAX"
- [ ] Descripción: "Gestión para emprendedores"
- [ ] Precio mensual: 39€ (Price ID: price_xxx_monthly)
- [ ] Precio anual: 390€ (Price ID: price_xxx_yearly)
- [ ] Guardar IDs en archivo seguro

**Plan Profesional:**
- [ ] Crear producto "Plan Profesional NEURIAX"
- [ ] Descripción: "Para negocios en crecimiento"
- [ ] Precio mensual: 79€ (Price ID: price_xxx_monthly)
- [ ] Precio anual: 790€ (Price ID: price_xxx_yearly)
- [ ] Guardar IDs en archivo seguro

- [ ] ✅ COMPLETADO: Todos productos creados

### SECCIÓN B: ARCHIVO .env

#### B.1 Crear Archivo .env

En la raíz del proyecto (sistema-cobros-app/):

```bash
touch .env
```

- [ ] Archivo .env creado
- [ ] NO subido a Git (.gitignore actualizado)
- [ ] ✅ COMPLETADO: Archivo seguro

#### B.2 Variables de Stripe

```env
# Copiar y pegar exactamente:

STRIPE_SECRET_KEY=sk_test_Tu_Clave_Aqui
STRIPE_PUBLISHABLE_KEY=pk_test_Tu_Clave_Aqui
STRIPE_WEBHOOK_SECRET=whsec_Tu_Secret_Aqui
STRIPE_TEST_MODE=true

# Price IDs (obtenidos en A.6)
STRIPE_PRICE_BASIC_MONTHLY=price_1Aa2Bb3Cc4Dd5Ee_basic_monthly
STRIPE_PRICE_BASIC_YEARLY=price_1Aa2Bb3Cc4Dd5Ee_basic_yearly
STRIPE_PRICE_PRO_MONTHLY=price_1Ff6Gg7Hh8Ii9Jj_pro_monthly
STRIPE_PRICE_PRO_YEARLY=price_1Ff6Gg7Hh8Ii9Jj_pro_yearly
```

- [ ] STRIPE_SECRET_KEY añadida
- [ ] STRIPE_PUBLISHABLE_KEY añadida
- [ ] STRIPE_WEBHOOK_SECRET añadida
- [ ] STRIPE_TEST_MODE = true
- [ ] ✅ COMPLETADO: Stripe configurado

#### B.3 Variables de Seguridad

```env
JWT_SECRET=NEURIAX_2026_CAMBIAR_EN_PRODUCCION
JWT_EXPIRES_IN=8h
NODE_ENV=development
PORT=3001
```

- [ ] JWT_SECRET configurado (cambiar del genérico)
- [ ] NODE_ENV = development
- [ ] CORS_ORIGIN configurado si es necesario
- [ ] ✅ COMPLETADO: Seguridad básica

#### B.4 Variables de Base de Datos (Opcional para desarrollo)

```env
# Usar JSON en desarrollo
DB_TYPE=json

# PostgreSQL para producción (después)
# DATABASE_URL=postgresql://usuario:pass@localhost:5432/neuriax
```

- [ ] Variables DB configuradas
- [ ] ✅ COMPLETADO: Base de datos lista

#### B.5 Variables Opcionales

```env
# Twilio (si quieres SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+34...

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=tu@gmail.com
EMAIL_PASSWORD=app_password
```

- [ ] Twilio configurado (o comentado)
- [ ] Email configurado (o comentado)
- [ ] ✅ COMPLETADO: Configuración completa

### SECCIÓN C: CLIENTE .env

En la carpeta client/:

```bash
cd client
touch .env
```

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_Tu_Clave_Aqui
```

- [ ] client/.env creado
- [ ] REACT_APP_API_URL correcta
- [ ] REACT_APP_STRIPE_PUBLISHABLE_KEY = pk_test_...
- [ ] NO contiene sk_test_ (NUNCA en cliente)
- [ ] ✅ COMPLETADO: Cliente configurado

### SECCIÓN D: INSTALACIÓN DE DEPENDENCIAS

#### D.1 Backend (server/)

Ya deberías tener en package.json:

```bash
npm list | grep stripe
```

Verifica:
- [ ] `stripe`: ^20.2.0
- [ ] `twilio`: ^5.12.0
- [ ] `bcryptjs`: ^2.4.3
- [ ] `jsonwebtoken`: ^9.0.2
- [ ] Todas dependencias instaladas: `npm install`

- [ ] ✅ COMPLETADO: Backend dependencias

#### D.2 Cliente (client/)

```bash
cd client
npm list | grep stripe
```

Deberías ver:
- [ ] `@stripe/react-stripe-js`: Debe estar instalado
- [ ] `@stripe/js`: Debe estar instalado

Si NO están:
```bash
npm install @stripe/react-stripe-js @stripe/js
```

- [ ] @stripe/react-stripe-js instalado
- [ ] @stripe/js instalado
- [ ] npm start funciona sin errores
- [ ] ✅ COMPLETADO: Cliente dependencias

### SECCIÓN E: ACTUALIZAR COMPONENTES FRONTEND

#### E.1 CheckoutPage.js

**Ubicación:** `client/src/components/CheckoutPage.js`

- [ ] Importa `loadStripe` de `@stripe/stripe-js`
- [ ] Importa `Elements`, `CardElement`, `useStripe`, `useElements`
- [ ] Cargas Stripe: `const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)`
- [ ] Envuelves formulario en `<Elements stripe={stripePromise}>`
- [ ] Usas `CardElement` en lugar de input manual
- [ ] NO almacenas número de tarjeta en state
- [ ] NO envías tarjeta al backend
- [ ] Usas `stripe.createPaymentMethod()` en cliente
- [ ] Manejo de errores implementado
- [ ] Tests en navegador sin errores
- [ ] ✅ COMPLETADO: CheckoutPage segura

#### E.2 PaymentPage.js

**Ubicación:** `client/src/components/PaymentPage.js`

- [ ] Importa librerías Stripe
- [ ] Usa CardElement para tarjeta
- [ ] Implementa manejo de 3D Secure
- [ ] NO envía número de tarjeta
- [ ] Validaciones correctas
- [ ] Manejo de errores completo
- [ ] Tests en navegador
- [ ] ✅ COMPLETADO: PaymentPage segura

### SECCIÓN F: ACTUALIZAR BACKEND

#### F.1 Crear Webhook Handler

**Crear archivo:** `server/routes/stripe-webhook.js`

```javascript
// Debe tener:
const express = require('express');
const router = express.Router();

// Middleware para body raw (IMPORTANTE)
router.post('/', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Manejo de eventos
    switch(event.type) {
      case 'payment_intent.succeeded':
        // Actualizar cita, enviar SMS
        break;
      case 'payment_intent.payment_failed':
        // Notificar cliente
        break;
    }
    
    res.json({received: true});
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

module.exports = router;
```

- [ ] Archivo stripe-webhook.js creado
- [ ] Usa express.raw() (IMPORTANTE)
- [ ] Verifica firma Stripe
- [ ] Maneja payment_intent.succeeded
- [ ] Maneja payment_intent.payment_failed
- [ ] Actualiza citas en BD
- [ ] Envía SMS
- [ ] Tests completados
- [ ] ✅ COMPLETADO: Webhook implementado

#### F.2 Actualizar index.js

**En:** `server/index.js`

**ANTES de `app.use(express.json())`, añadir:**

```javascript
const stripeWebhookRouter = require('./routes/stripe-webhook');

// ⚠️ IMPORTANTE: Esto DEBE ir ANTES de express.json()
app.post('/api/stripe/webhook', stripeWebhookRouter);
```

- [ ] Webhook router importado
- [ ] Registrado ANTES de express.json()
- [ ] Endpoint: POST /api/stripe/webhook
- [ ] CORS configurado correctamente
- [ ] Tests sin errores
- [ ] ✅ COMPLETADO: Webhook registrado

#### F.3 Revisar stripe.js

**En:** `server/routes/stripe.js`

Verificar que:
- [ ] POST /api/stripe/payment-intent funciona
- [ ] POST /api/stripe/verify-payment funciona
- [ ] Autenticación JWT verificada
- [ ] Errores manejados correctamente
- [ ] Logs informativos sin datos sensibles
- [ ] ✅ COMPLETADO: Rutas stripe funcionando

### SECCIÓN G: PRUEBAS EN DESARROLLO

#### G.1 Iniciar Servidor

```bash
npm run dev
# o
npm start
```

- [ ] Servidor inicia sin errores
- [ ] Puerto 3001 accesible
- [ ] Base de datos inicializa
- [ ] Variables de entorno cargadas
- [ ] Logs muestran "STRIPE SERVICE: Modo TEST"
- [ ] ✅ COMPLETADO: Servidor ready

#### G.2 Iniciar Cliente

```bash
cd client
npm start
```

- [ ] Cliente inicia en puerto 3000
- [ ] Sin errores de Stripe
- [ ] Variables de entorno cargadas
- [ ] ✅ COMPLETADO: Cliente ready

#### G.3 Test 1: Crear Suscripción

1. [ ] Ir a http://localhost:3000/planes/basic
2. [ ] Ingresa datos:
   - Nombre: "Test User"
   - Email: "test@example.com"
   - Teléfono: "+34600000000"
   - Negocio: "Test Salon"
   - Contraseña: "Test123456"
3. [ ] Click "Continuar"
4. [ ] Ingresa tarjeta de prueba: `4242 4242 4242 4242`
5. [ ] Vencimiento: 12/25
6. [ ] CVC: 123
7. [ ] Click "Pagar"

- [ ] No hay errores en consola
- [ ] Tarjeta se acepta
- [ ] Página redirige a confirmación
- [ ] Email recibido
- [ ] En Stripe Dashboard → Payments, aparece el pago
- [ ] ✅ COMPLETADO: Checkout funciona

#### G.4 Test 2: Pago de Cita

1. [ ] Crear cita manualmente en dashboard
2. [ ] Obtener ID de cita
3. [ ] Ir a http://localhost:3000/pago/:citaId
4. [ ] Ingresa datos de pago
5. [ ] Usa tarjeta: `4242 4242 4242 4242`
6. [ ] Click "Pagar"

- [ ] Sin errores
- [ ] Pago procesado
- [ ] Cita se marca como pagada
- [ ] SMS enviado (si Twilio configurado)
- [ ] BD actualizada correctamente
- [ ] ✅ COMPLETADO: Pagos de cita funcionan

#### G.5 Test 3: Webhook

1. [ ] En Stripe Dashboard → Webhooks
2. [ ] Haz click en el webhook
3. [ ] Click en "Send test event"
4. [ ] Selecciona "payment_intent.succeeded"
5. [ ] Click "Send event"

- [ ] Response 200
- [ ] En logs del servidor, ve el evento procesado
- [ ] Base de datos se actualiza si es necesario
- [ ] ✅ COMPLETADO: Webhook funciona

#### G.6 Test 4: Errores

Usa tarjeta de error: `4000 0000 0000 0002`

- [ ] Pago se rechaza correctamente
- [ ] Mensaje de error mostrado
- [ ] Cita NO se marca como pagada
- [ ] Webhook payment_intent.payment_failed recibido
- [ ] ✅ COMPLETADO: Manejo de errores funciona

#### G.7 Test 5: 3D Secure

Usa tarjeta 3D: `4000 0025 0000 3155`

- [ ] Se redirige a autenticación
- [ ] Cliente puede confirmar en popup
- [ ] Después de confirmar, pago procesa
- [ ] Webhook recibe éxito
- [ ] ✅ COMPLETADO: 3D Secure soportado

### SECCIÓN H: TRANSICIÓN A PRODUCCIÓN

#### H.1 Cambiar a Stripe Live Keys

**ANTES de cambiar, ten 100% seguridad de que:**

- [ ] Todos tests pasaron en modo TEST
- [ ] Webhook está configurado correctamente
- [ ] Variables de entorno están seguras
- [ ] Base de datos migrada a PostgreSQL
- [ ] SSL/HTTPS está activado
- [ ] Logs no contienen datos sensibles

En Stripe Dashboard → Desarrolladores → Claves de API:

- [ ] Copia `sk_live_...` (LIVE SECRET)
- [ ] Copia `pk_live_...` (LIVE PUBLISHABLE)

En `.env` (raíz):

```env
STRIPE_SECRET_KEY=sk_live_Tu_Clave_Live_Aqui
STRIPE_PUBLISHABLE_KEY=pk_live_Tu_Clave_Live_Aqui
STRIPE_TEST_MODE=false
```

En `client/.env`:

```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_Tu_Clave_Live_Aqui
```

- [ ] Live secret key en .env (backend)
- [ ] Live public key en .env (backend)
- [ ] Live public key en client/.env
- [ ] STRIPE_TEST_MODE = false
- [ ] NODE_ENV = production
- [ ] ✅ COMPLETADO: Claves cambiadas

#### H.2 Actualizar Webhook en Producción

En Stripe Dashboard → Webhooks:

- [ ] Crear NUEVO webhook (no reutilizar el de test)
- [ ] Endpoint: `https://tudominio.com/api/stripe/webhook`
- [ ] Eventos: payment_intent.*, customer.subscription.*
- [ ] Copiar nuevo Signing Secret (whsec_...)

En `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_tu_nuevo_secret_live
```

- [ ] Nuevo webhook creado
- [ ] Signing secret actualizado en .env
- [ ] ✅ COMPLETADO: Webhook en producción

#### H.3 Verificar HTTPS

```bash
# En la terminal
curl -I https://tudominio.com

# Debe mostrar:
# HTTP/2 200
# Con certificado SSL válido
```

- [ ] HTTPS funciona
- [ ] Certificado SSL válido
- [ ] Redirección HTTP → HTTPS
- [ ] ✅ COMPLETADO: HTTPS seguro

#### H.4 Base de Datos en Producción

Si aún usas JSON:

```env
# Cambiar a PostgreSQL:
DATABASE_URL=postgresql://user:pass@host:5432/neuriax_prod
DB_TYPE=postgresql
```

- [ ] PostgreSQL configurado
- [ ] Credenciales seguras
- [ ] Backups automáticos
- [ ] Acceso restringido
- [ ] ✅ COMPLETADO: BD producción

#### H.5 Deploy a Producción

```bash
# En tu servidor de producción:
cd sistema-cobros-app

# Actualizar código
git pull origin main

# Instalar dependencias
npm install

# Compilar cliente
npm run build

# Iniciar con PM2 o similar
pm2 start server/index.js --name "neuriax-api"

# Ver logs
pm2 logs neuriax-api
```

- [ ] Código descargado
- [ ] Dependencias instaladas
- [ ] Cliente compilado
- [ ] Servidor iniciado
- [ ] Logs sin errores
- [ ] ✅ COMPLETADO: Deploy completado

#### H.6 Test de Pago Real (Pequeño Monto)

1. [ ] Accede a https://tudominio.com/planes/basic
2. [ ] Crea suscripción CON TARJETA REAL
3. [ ] Usa un monto pequeño (€1-5) para test
4. [ ] Verifica en tu cuenta bancaria que el dinero llega (2-3 días)

- [ ] Pago se procesa
- [ ] Dinero llega a tu cuenta
- [ ] Todo funciona en producción
- [ ] ✅ COMPLETADO: Pagos reales funcionando

### SECCIÓN I: MONITOREO CONTINUO

#### I.1 Logs y Errores

```bash
# Ver logs en tiempo real
pm2 logs neuriax-api

# Buscar errores Stripe
pm2 logs neuriax-api | grep -i stripe

# Buscar webhook
pm2 logs neuriax-api | grep webhook
```

- [ ] Logs revisados regularmente
- [ ] Errores de Stripe monitoreados
- [ ] Webhooks se procesan correctamente
- [ ] ✅ COMPLETADO: Monitoreo activo

#### I.2 Dashboard Stripe

Revisar regularmente:

En https://dashboard.stripe.com:

- [ ] Payments → Listar pagos recientes
- [ ] Customers → Verificar clientes
- [ ] Subscriptions → Suscripciones activas
- [ ] Events → Historial de webhooks
- [ ] Developers → Logs de API

- [ ] Pagos se procesan correctamente
- [ ] Sin rechazos inesperados
- [ ] Webhooks se ejecutan
- [ ] ✅ COMPLETADO: Dashboard revisado

#### I.3 Alertas y Notificaciones

En Stripe Dashboard → Configuración → Alertas:

- [ ] Habilitar alertas de pago fallido
- [ ] Alertar sobre cambios de suscripción
- [ ] Notificaciones por email
- [ ] Verificar emails regularmente

- [ ] Alertas configuradas
- [ ] Email de alertas funciona
- [ ] ✅ COMPLETADO: Sistema de alertas

---

## 🎯 RESUMEN FINAL

### Estado Actual

- ✅ Arquitectura: COMPLETA
- ❌ Variables de entorno: FALTA
- ❌ Stripe Elements: FALTA
- ⚠️ Webhooks: PARCIAL
- ❌ Tests: FALTA

### Después de Completar Este Checklist

- ✅ Arquitectura: COMPLETA
- ✅ Variables de entorno: CONFIGURADAS
- ✅ Stripe Elements: INSTALADAS
- ✅ Webhooks: IMPLEMENTADOS
- ✅ Tests: PASADOS
- ✅ LISTO PARA COBRAR

### Tiempo Estimado

| Sección | Tiempo | Completado |
|---------|--------|-----------|
| A: Cuenta Stripe | 35 min | [ ] |
| B: .env (raíz) | 5 min | [ ] |
| C: .env (cliente) | 2 min | [ ] |
| D: Dependencias | 5 min | [ ] |
| E: Frontend | 90 min | [ ] |
| F: Backend | 60 min | [ ] |
| G: Tests | 45 min | [ ] |
| H: Producción | 30 min | [ ] |
| **TOTAL** | **~5 horas** | [ ] |

---

**Checklist versión: 1.0**  
**Última actualización: 30 Enero 2026**  
**Estado: Pronto para implementación**

Marca cada ✅ a medida que completes cada sección. ¡Al final, tendrás un sistema de cobros profesional!
