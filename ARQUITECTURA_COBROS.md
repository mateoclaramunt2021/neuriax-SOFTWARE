# 🏗️ ARQUITECTURA DEL SISTEMA DE COBROS

## 📐 DIAGRAMA GENERAL DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SISTEMA NEURIAX - COBROS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐   │
│  │   FRONTEND       │      │    BACKEND       │      │   STRIPE CLOUD   │   │
│  │   (React)        │      │   (Node + Exp)   │      │                  │   │
│  │                  │      │                  │      │                  │   │
│  │ ┌──────────────┐ │      │ ┌──────────────┐ │      │ ┌──────────────┐ │   │
│  │ │ CheckoutPage │◄──────►│  /subscriptions│◄─────►│ Checkout      │ │   │
│  │ │              │ │      │                │ │      │ Sessions      │ │   │
│  │ └──────────────┘ │      │ ┌──────────────┐ │      │ (Sesión pago) │ │   │
│  │                  │      │ │  /stripe     │ │      │               │ │   │
│  │ ┌──────────────┐ │      │ │ /payment-int │◄─────►│ Payment       │ │   │
│  │ │ PaymentPage  │◄──────►│ │ /verify-pay  │ │      │ Intents       │ │   │
│  │ │              │ │      │ └──────────────┘ │      │ (Intención)   │ │   │
│  │ └──────────────┘ │      │                  │      │               │ │   │
│  │                  │      │ ┌──────────────┐ │      │ Customers     │ │   │
│  │ ┌──────────────┐ │      │ │ stripeService│◄─────►│ (Clientes)    │ │   │
│  │ │Stripe        │ │      │ │              │ │      │               │ │   │
│  │ │Elements      │ │      │ │ Subscriptions│ │      │ Subscriptions │ │   │
│  │ │(CardElement) │ │      │ └──────────────┘ │      │ (Recurrente)  │ │   │
│  │ └──────────────┘ │      │                  │      │               │ │   │
│  │                  │      │ ┌──────────────┐ │      │ Webhooks      │ │   │
│  │ @stripe/js       │      │ │ /webhook     │◄─────┤ (Eventos)      │ │   │
│  │ @stripe/react    │      │ │              │ │      │               │ │   │
│  └──────────────────┘      │ └──────────────┘ │      │ Refunds       │ │   │
│                            └──────────────────┘      │ (Reembolsos)  │ │   │
│                                                      └──────────────┘ │   │
│                                                                           │   │
│  ┌──────────────────┐      ┌──────────────────┐      ┌──────────────┐    │   │
│  │  BASE DE DATOS   │      │    SERVICIOS     │      │  EXTERNOS    │    │   │
│  │                  │      │                  │      │              │    │   │
│  │ ┌──────────────┐ │      │ ┌──────────────┐ │      │ ┌──────────┐ │    │   │
│  │ │ JSON/PostgreSQL        │ │ Twilio SMS   │       │ │ Twilio   │ │    │   │
│  │ │              │ │      │ │              │ │      │ │ API      │ │    │   │
│  │ │ • Usuarios   │ │      │ │ • SMS confir │ │      │ └──────────┘ │    │   │
│  │ │ • Citas      │ │      │ │ • SMS recall │ │      │              │    │   │
│  │ │ • Clientes   │ │      │ └──────────────┘ │      │ ┌──────────┐ │    │   │
│  │ │ • Pagos      │ │      │ ┌──────────────┐ │      │ │ Email    │ │    │   │
│  │ │ • Tenants    │ │      │ │ Email Service│ │      │ │ Service  │ │    │   │
│  │ │              │ │      │ │              │ │      │ └──────────┘ │    │   │
│  │ └──────────────┘ │      │ │ • Recibos    │ │      │              │    │   │
│  │                  │      │ │ • Confirmación        │ ┌──────────┐ │    │   │
│  │                  │      │ └──────────────┘ │      │ │ Logging  │ │    │   │
│  │                  │      │                  │      │ │ / Metrics│ │    │   │
│  │                  │      │                  │      │ └──────────┘ │    │   │
│  └──────────────────┘      └──────────────────┘      └──────────────┘    │   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUJOS DE PAGO DETALLADOS

### FLUJO 1: Checkout de Suscripción

```
┌─────────────────┐
│   USUARIO WEB   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ CheckoutPage (/planes/:planId)                      │
│                                                     │
│ Paso 1: Ingresa datos                              │
│ - Nombre, email, teléfono                          │
│ - Dirección, NIF/CIF                               │
│ - Selecciona plan (Basic/Pro/Enterprise)           │
│ - Selecciona ciclo (Mensual/Anual)                 │
└──────────┬──────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│ Paso 2: Método de Pago                   │
│                                          │
│ Stripe Elements (CardElement)            │
│ - Nunca almacenar números                │
│ - Encriptación en cliente                │
│ - Validación real de tarjeta             │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ POST /api/subscriptions/create-checkout
│                                      │
│ Request:                             │
│ {                                    │
│   planId: 'basic',                  │
│   billingCycle: 'monthly',          │
│   userData: {...},                  │
│   paymentMethodId: 'pm_xxx'         │
│ }                                    │
└──────────┬──────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────┐
│ Backend: stripeService.crearCliente()      │
│                                            │
│ 1. Verifica email único                   │
│ 2. Crea Customer en Stripe                │
│ 3. Retorna customerId                     │
└──────────┬─────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────┐
│ Backend: stripe.subscriptions.create()     │
│                                            │
│ 1. Usa priceId del plan                   │
│ 2. Suscribe cliente a plan                │
│ 3. Cobra primera cuota                    │
│ 4. Retorna subscriptionId                 │
└──────────┬─────────────────────────────────┘
           │
           ▼
    ┌──────────────────────┐
    │ STRIPE CLOUD         │
    │                      │
    │ Procesa pago         │
    │ • Valida tarjeta     │
    │ • 3D Secure (si req) │
    │ • Cobra dinero       │
    │ • Crea suscripción   │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ payment_intent.      │
    │ succeeded webhook    │
    └──────────┬───────────┘
               │
               ▼
┌────────────────────────────────────────────┐
│ Backend: POST /api/stripe/webhook          │
│                                            │
│ 1. Verifica firma Stripe                   │
│ 2. Extrae datos del evento                 │
│ 3. Crea usuario en BD                      │
│ 4. Crea tenant para cliente                │
│ 5. Envía email bienvenida                  │
│ 6. Retorna 200 OK                          │
└──────────┬─────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ ✅ USUARIO SUSCRITO Y PAGADO         │
│                                      │
│ Accede a su dashboard                │
│ Recibe confirmación por email        │
│ Próximo cobro en 30 días             │
└──────────────────────────────────────┘
```

### FLUJO 2: Pago de Cita

```
┌─────────────────┐
│   USUARIO WEB   │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ PaymentPage (/pago/:citaId)          │
│                                      │
│ GET: Obtiene datos de cita           │
│ - ID, servicios, monto               │
│ - Datos del cliente                  │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Ingresa datos de tarjeta             │
│ (Stripe Elements - CardElement)      │
└──────────┬───────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────┐
│ POST /api/stripe/payment-intent            │
│                                            │
│ Request:                                   │
│ {                                          │
│   citaId: 'cita_123',                     │
│   monto: 50.00,                           │
│   servicioNombre: 'Corte'                │
│ }                                          │
│                                            │
│ Response:                                  │
│ {                                          │
│   clientSecret: 'pi_xxx_secret_xxx',      │
│   intentId: 'pi_xxx',                     │
│   monto: 50.00                            │
│ }                                          │
└──────────┬─────────────────────────────────┘
           │
           ▼
    ┌──────────────────────┐
    │ STRIPE CLOUD         │
    │                      │
    │ Crea Payment Intent  │
    │ • Estado: requires_action o succeeded
    │ • Retorna secret     │
    └──────────┬───────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Frontend: stripe.confirmCardPayment()
│                                      │
│ 1. Confirma el pago                 │
│ 2. Maneja 3D Secure si necesario    │
│ 3. Retorna resultado                │
└──────────┬───────────────────────────┘
           │
           ▼
      Pago exitoso o fallido
           │
           ├─────────────────────┬────────────────────┐
           │                     │                    │
        ✅ EXITOSO            ⚠️  3D SECURE         ❌ FALLIDO
           │                     │                    │
           ▼                     ▼                    ▼
┌──────────────────┐  ┌────────────────────┐  ┌──────────────────┐
│ POST /verify-pay │  │ Redirige a banco   │  │ Muestra error    │
│                  │  │ (autenticación)    │  │ al usuario       │
│ El cliente envía │  │                    │  │                  │
│ intentId y citaId│  │ Cliente autentica  │  │ Puede reintentar │
│                  │  │ en app móvil       │  │                  │
│ Backend verifica │  │                    │  │ webhook recibe:  │
│ pago con Stripe  │  │ Retorna a app      │  │ payment_intent.  │
│                  │  │                    │  │ payment_failed   │
│ Si exitoso:      │  │ Verifica pago      │  └──────────────────┘
│ • Actualiza cita │  │                    │
│ • Envía SMS      │  └────────────────────┘
│ • Retorna success│
└──────────┬───────┘
           │
           ▼
    ┌──────────────────────┐
    │ ÉXITO                │
    │                      │
    │ ✅ Cita pagada       │
    │ ✅ SMS confirmación  │
    │ ✅ Acceso permitido  │
    │                      │
    │ Cliente redirigiído  │
    │ a dashboard          │
    └──────────────────────┘
```

---

## 📦 ESTRUCTURA DE ARCHIVOS CLAVE

```
sistema-cobros-app/
│
├── .env                          ← ❌ FALTA - Variables de Stripe
│
├── server/
│   ├── index.js                  ← ✅ Servidor principal
│   │
│   ├── routes/
│   │   ├── stripe.js             ← ✅ Endpoints: /payment-intent, /verify-pay
│   │   ├── subscriptions.js       ← ✅ Endpoints: /create-checkout, /plans
│   │   ├── webhooks.js           ← ✅ Webhook genérico
│   │   └── stripe-webhook.js     ← ❌ FALTA - Webhook específico Stripe
│   │
│   ├── services/
│   │   ├── stripeService.js      ← ✅ Lógica de Stripe
│   │   ├── twilioService.js      ← ✅ SMS (integrado)
│   │   └── emailService.js       ← ✅ Email (integrado)
│   │
│   ├── middleware/
│   │   ├── auth.js               ← ✅ Autenticación JWT
│   │   └── planLimits.js         ← ✅ Rate limiting
│   │
│   ├── database/
│   │   ├── database.json         ← ✅ BD local (desarrollo)
│   │   ├── init.js               ← ✅ Inicialización
│   │   └── postgresAdapter.js    ← ✅ Para producción
│   │
│   └── config/
│       └── plans.js              ← ✅ Definición de planes
│
├── client/
│   ├── .env                      ← ❌ FALTA - REACT_APP_STRIPE_KEY
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── CheckoutPage.js   ← ⚠️ Necesita Stripe Elements
│   │   │   └── PaymentPage.js    ← ⚠️ Necesita Stripe Elements
│   │   │
│   │   ├── services/
│   │   │   └── api.js            ← ✅ Cliente HTTP
│   │   │
│   │   └── styles/
│   │       ├── checkout.css      ← ✅ Estilos checkout
│   │       └── payment-page.css  ← ✅ Estilos pago
│   │
│   └── package.json              ← ✅ Tiene stripe pero faltan @stripe/*
│
├── package.json                  ← ✅ Todas dependencias
└── DOCUMENTACION/
    ├── GUIA-PAGOS-STRIPE.md      ← ✅ Documentación básica
    ├── ANALISIS_SISTEMA_COMPLETO.md ← ✅ Este análisis
    └── ACTIVAR_COBROS_PASO_A_PASO.md ← ✅ Guía ejecutiva
```

---

## 🔐 FLUJO DE SEGURIDAD

```
┌─────────────────────────────────────────────────────────┐
│           CÓMO VIAJA EL DINERO SEGURAMENTE              │
└─────────────────────────────────────────────────────────┘

1️⃣ CLIENTE INGRESA DATOS
   ┌─────────────────────────┐
   │ Navegador (localhost)   │
   │                         │
   │ Número de tarjeta:      │
   │ 4242 4242 4242 4242     │
   │ Vencimiento: 12/25      │
   │ CVC: 123                │
   └────────────┬────────────┘
                │
                ▼
2️⃣ STRIPE ELEMENTS ENCRIPTA
   ┌─────────────────────────┐
   │ Librería Stripe en el   │
   │ cliente (navegador)     │
   │                         │
   │ Encripta: AES-256       │
   │ NUNCA se almacena aquí  │
   └────────────┬────────────┘
                │
                ▼
3️⃣ ENVÍA AL BACKEND (SEGURO)
   ┌──────────────────────────────────────┐
   │ HTTPS (TLS 1.2+)                     │
   │                                      │
   │ {                                    │
   │   paymentMethodId: 'pm_xxx_encrypted'│
   │   citaId: 'cita_123'                │
   │   monto: 50.00                      │
   │ }                                    │
   │                                      │
   │ ❌ NUNCA el número de tarjeta        │
   └────────────┬─────────────────────────┘
                │
                ▼
4️⃣ BACKEND PROCESA (SERVIDOR SEGURO)
   ┌───────────────────────────────────────┐
   │ Node.js + Express (puerto 3001)       │
   │                                       │
   │ • Verifica JWT del cliente           │
   │ • Valida paymentMethodId con Stripe │
   │ • Crea Payment Intent                 │
   │ • NUNCA almacena número de tarjeta   │
   │ • NUNCA loguea datos sensibles       │
   └────────────┬────────────────────────┘
                │
                ▼
5️⃣ ENVÍA A STRIPE (EXTERIOR SEGURO)
   ┌─────────────────────────────────────┐
   │ API Stripe en la nube                │
   │                                      │
   │ HTTPS a: api.stripe.com              │
   │ Con: STRIPE_SECRET_KEY               │
   │                                      │
   │ Stripe recibe:                       │
   │ • paymentMethodId cifrado           │
   │ • Monto, moneda, metadata           │
   │ • Email cliente, descripción        │
   └────────────┬────────────────────────┘
                │
                ▼
6️⃣ STRIPE PROCESA PAGO
   ┌─────────────────────────────────────┐
   │ Data Center Stripe (PCI-DSS nivel 1)│
   │                                      │
   │ • Descifra paymentMethodId          │
   │ • Contacta banco del cliente        │
   │ • 3D Secure (si necesario)          │
   │ • Autoriza cobro                    │
   │ • Devuelve: succeeded/failed        │
   │                                      │
   │ ❌ Nunca retorna número de tarjeta  │
   │ ✅ Solo retorna confirmación        │
   └────────────┬────────────────────────┘
                │
                ▼
7️⃣ WEBHOOK A BACKEND
   ┌────────────────────────────────────────┐
   │ POST /api/stripe/webhook               │
   │                                        │
   │ Event: payment_intent.succeeded        │
   │ SignedIn: STRIPE_WEBHOOK_SECRET        │
   │                                        │
   │ Webhook retorna:                       │
   │ • intent_id: 'pi_xxx'                 │
   │ • Status: 'succeeded'                 │
   │ • Amount: 5000 (centavos)            │
   │ • Metadata: {citaId, clientId}       │
   │                                        │
   │ ❌ NUNCA datos de tarjeta             │
   │ ✅ Solo confirmación segura          │
   └────────────┬─────────────────────────┘
                │
                ▼
8️⃣ BACKEND ACTUALIZA CITA
   ┌──────────────────────────────────────┐
   │ Base de Datos (JSON o PostgreSQL)    │
   │                                      │
   │ Cita.update({                        │
   │   pagado: true,                      │
   │   stripeStatus: 'succeeded',         │
   │   intentId: 'pi_xxx',               │
   │   fechaPago: ahora                   │
   │ })                                   │
   └────────────┬─────────────────────────┘
                │
                ▼
9️⃣ ENVÍA SMS AL CLIENTE
   ┌──────────────────────────────────────┐
   │ Twilio SMS (tercero de confianza)    │
   │                                      │
   │ Mensaje:                             │
   │ "Cita confirmada. Pago recibido."   │
   │                                      │
   │ Link: cita_detalles                 │
   └──────────────────────────────────────┘
                │
                ▼
🔟 DINERO EN CUENTA
   ┌──────────────────────────────────────┐
   │ Cuenta Bancaria (2-3 días)          │
   │                                      │
   │ • Stripe realiza transferencia       │
   │ • A la cuenta registrada             │
   │ • Automaticamente (diaria/semanal)   │
   │ • Menos comisión Stripe (2.9% + 0.30€)
   │                                      │
   │ Ejemplo:                             │
   │ Cobro: €50                          │
   │ Comisión: €1.75                     │
   │ Recibido: €48.25                    │
   └──────────────────────────────────────┘

✅ SEGURIDAD GARANTIZADA:
   ✓ Tarjeta NUNCA en tu servidor
   ✓ Tarjeta NUNCA en tu BD
   ✓ Tarjeta NUNCA en logs
   ✓ Encriptación end-to-end
   ✓ PCI-DSS cumplimiento
```

---

## 📊 ESTADO DE CADA COMPONENTE

| Componente | Función | Estado | URL/Archivo |
|-----------|---------|--------|------------|
| **FRONTEND** |
| CheckoutPage | Formulario suscripción | ⚠️ Necesita Elements | `/client/src/components/CheckoutPage.js` |
| PaymentPage | Formulario cita | ⚠️ Necesita Elements | `/client/src/components/PaymentPage.js` |
| Stripe Elements | Tarjeta segura | ❌ No instalado | `@stripe/react-stripe-js` |
| **BACKEND** |
| stripe.js | Rutas pago | ✅ Completo | `/server/routes/stripe.js` |
| subscriptions.js | Suscripciones | ✅ Completo | `/server/routes/subscriptions.js` |
| stripe-webhook.js | Eventos Stripe | ❌ No existe | `/server/routes/stripe-webhook.js` |
| stripeService.js | Lógica Stripe | ✅ Completo | `/server/services/stripeService.js` |
| **INTEGRACIÓN** |
| Twilio | SMS | ✅ Integrado | `/server/services/twilioService.js` |
| Email | Correos | ✅ Integrado | `/server/services/emailService.js` |
| JWT Auth | Autenticación | ✅ Completo | `/server/middleware/auth.js` |
| **BASES DE DATOS** |
| JSON DB | Desarrollo | ✅ Funcional | `/server/database/database.json` |
| PostgreSQL | Producción | ✅ Configurado | `/server/database/postgresAdapter.js` |
| **VARIABLES DE ENTORNO** |
| STRIPE_SECRET_KEY | API Stripe | ❌ No existe | `.env` |
| STRIPE_PUBLISHABLE_KEY | Clave pública | ❌ No existe | `.env` |
| STRIPE_WEBHOOK_SECRET | Webhook secret | ❌ No existe | `.env` |
| JWT_SECRET | Seguridad JWT | ⚠️ Genérico | `.env` |

---

## 🎯 CHECKLIST DE IMPLEMENTACIÓN

```
FASE 1: SETUP (40 min)
  ☐ Crear cuenta Stripe
  ☐ Completar perfil negocio
  ☐ Agregar cuenta bancaria
  ☐ Obtener claves API (test)
  ☐ Crear productos y precios
  ☐ Crear webhook secret
  ☐ Crear archivo .env con variables
  ☐ npm install (ya hecho)

FASE 2: FRONTEND SEGURO (2 horas)
  ☐ npm install @stripe/react-stripe-js
  ☐ npm install @stripe/js
  ☐ Importar loadStripe
  ☐ Crear componente PaymentForm
  ☐ Reemplazar CheckoutPage
  ☐ Reemplazar PaymentPage
  ☐ Usar CardElement
  ☐ Tests en navegador

FASE 3: BACKEND WEBHOOKS (1.5 horas)
  ☐ Crear stripe-webhook.js
  ☐ Implementar webhook handler
  ☐ Eventos a escuchar
  ☐ Registrar en index.js (ANTES de express.json())
  ☐ Tests con ngrok (si es local)
  ☐ Actualizar STRIPE_WEBHOOK_SECRET en .env

FASE 4: INTEGRACIÓN (1.5 horas)
  ☐ Tests e2e con tarjetas prueba
  ☐ Verificar Stripe Dashboard
  ☐ SMS se envía correctamente
  ☐ BD se actualiza
  ☐ Emails se envían
  ☐ Logs son correctos

FASE 5: PRODUCCIÓN (1.5 horas)
  ☐ Cambiar a Stripe Live Keys
  ☐ Actualizar .env
  ☐ STRIPE_TEST_MODE=false
  ☐ NODE_ENV=production
  ☐ Webhook a dominio real
  ☐ Tests con tarjeta real (pequeño monto)
  ☐ Deploy a producción
  ☐ Monitoreo activo

TOTAL: ~8 horas de trabajo
```

---

## 🚀 ROADMAP FUTURO

### Semana 1 (Ahora): Pagos básicos
- [x] Arquitectura diseñada
- [x] Rutas implementadas
- [ ] Variables de entorno
- [ ] Stripe Elements
- [ ] Webhooks
- [ ] Deploy

### Semana 2: Suscripciones
- [ ] Cambio de plan
- [ ] Cancellations
- [ ] Trial period
- [ ] Renovación automática

### Semana 3: Reembolsos
- [ ] Procesamiento reembolsos
- [ ] Reembolsos parciales
- [ ] Notificaciones
- [ ] Auditoría

### Semana 4: Reportes
- [ ] Dashboard de ingresos
- [ ] Análisis de churn
- [ ] Forecasting
- [ ] Exportar a CSV/PDF

### Mes 2: Escalabilidad
- [ ] Múltiples métodos pago
- [ ] PayPal integración
- [ ] Apple Pay / Google Pay
- [ ] Criptomonedas (opcional)

### Mes 3+: Optimización
- [ ] Recuperación carritos abandonados
- [ ] Promociones y descuentos
- [ ] Programa de referidos
- [ ] Facturación automatizada

---

**Diagrama de arquitectura generado automáticamente**  
**Sistema listo para escalar a producción**
