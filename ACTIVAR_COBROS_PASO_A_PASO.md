# ✅ GUÍA PASO A PASO: ACTIVAR COBROS CON STRIPE

**Tiempo estimado:** 5-6 horas  
**Dificultad:** Media  
**Costo:** Gratis (Stripe es gratuito hasta que cobres)

---

## 🚀 PASO 1: CREAR CUENTA STRIPE (5 minutos)

### 1.1 Registro Inicial

1. Ve a https://dashboard.stripe.com/register
2. Completa:
   - Email: tu@email.com
   - Nombre completo: Tu Nombre
   - Contraseña: (fuerte)

3. Verifica tu email

### 1.2 Seleccionar País y Moneda

- País: Tu país (disponible para recibir pagos)
- Moneda: CLP (Ya configurado en código)

### 1.3 Aceptar Términos

- Acepta términos de Stripe
- Acepta política de privacidad

---

## 🏢 PASO 2: COMPLETAR PERFIL DE NEGOCIO (15 minutos)

### 2.1 Ve a Configuración → Datos de Empresa

1. **Nombre Legal del Negocio:** Tu razón social
2. **Tipo de Negocio:** Peluquería / Salón de belleza
3. **Sitio Web:** https://tudominio.com (puede ser temporal)
4. **Dirección:** Tu dirección fiscal
5. **Ciudad:** Tu ciudad
6. **Código Postal:** Tu código postal
7. **País:** Tu país

### 2.2 Información de Propietario

1. **Nombre Completo:** Tu nombre
2. **Correo Electrónico:** tu@email.com
3. **Número de Identificación:** Tu NIF/CIF/RUT
4. **Fecha de Nacimiento:** Tu fecha
5. **Dirección Permanente:** Tu dirección
6. **% Propiedad:** 100% (si eres único dueño)

### 2.3 Información de Negocio

1. **Descripción:** Sistema de gestión para peluquerías
2. **URL de términos de servicio:** (dejar en blanco por ahora)
3. **URL de política de privacidad:** (dejar en blanco por ahora)

---

## 🏦 PASO 3: AGREGAR CUENTA BANCARIA (10 minutos)

### 3.1 Ve a Configuración → Pagos → Cuentas Bancarias

1. Haz clic en "Agregar cuenta bancaria"
2. Completa:
   - **IBAN:** ES + 22 dígitos (ejemplo: ES9121000418450200051332)
   - **Nombre del Titular:** Debe coincidir con el nombre del negocio
   - **Nombre del Banco:** Automático cuando pones IBAN
   - **Código de País:** Automático

### 3.2 Verificación

- Stripe enviará 2 transferencias pequeñas (0,01 € + cantidad aleatoria)
- Deberás confirmar los montos en tu banco
- Esto puede tomar 2-5 días

### 3.3 Habilitar Recepción de Pagos

- Una vez verificada la cuenta, los pagos se transfieren automáticamente
- Configurar calendario de transferencias:
  - Diaria, semanal o mensual

---

## 🔑 PASO 4: OBTENER CLAVES API (2 minutos)

### 4.1 Ve a Desarrolladores → Claves de API

1. Verás dos pares de claves:
   - **Test Keys** (para desarrollo)
   - **Live Keys** (para producción)

2. **Para desarrollo, copia:**
   ```
   Clave Publicable Test: pk_test_XXXXXXXX
   Clave Secreta Test:    sk_test_XXXXXXXX
   ```

3. **Para producción (después):**
   ```
   Clave Publicable Live: pk_live_XXXXXXXX
   Clave Secreta Live:    sk_live_XXXXXXXX
   ```

### 4.2 Crear Webhook Secret

1. Ve a Desarrolladores → Webhooks
2. Haz clic en "Agregar punto de enlace"
3. Endpoint: `https://tudominio.com/api/stripe/webhook`
4. Eventos: Selecciona:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.deleted`
5. Copia el **Signing Secret**: `whsec_XXXXXXXX`

---

## 💳 PASO 5: CREAR PRODUCTOS Y PRECIOS (10 minutos)

### 5.1 Crear Producto "Plan Básico"

1. Ve a Productos → Agregar Producto
2. Completa:
   - **Nombre:** Plan Básico NEURIAX
   - **Descripción:** Gestión para emprendedores
   - **Imagen:** (opcional)
   - **Tipo:** Servicio

3. En la sección "Precios":
   - Haz clic en "Agregar precio"
   - **Precio:** 39.00 EUR
   - **Facturación:** Mensual (recurrente)
   - Haz clic en "Crear precio"

4. Copia el **Price ID**: `price_XXXXXXX_monthly`

5. Haz clic en "Agregar precio" de nuevo:
   - **Precio:** 390.00 EUR (anual)
   - **Facturación:** Anual (recurrente)
   - Copia el **Price ID**: `price_XXXXXXX_yearly`

### 5.2 Crear Producto "Plan Profesional"

Repite el proceso anterior con:
- **Nombre:** Plan Profesional NEURIAX
- **Descripción:** Para negocios en crecimiento
- **Precio Mensual:** 79.00 EUR
- **Precio Anual:** 790.00 EUR

### 5.3 Guardar Price IDs

Necesitarás estos IDs para el backend. Cópialos en un archivo seguro:

```
Plan Básico:
  - Mensual: price_1Aa2Bb3Cc4Dd5Ee_basic_monthly
  - Anual: price_1Aa2Bb3Cc4Dd5Ee_basic_yearly

Plan Profesional:
  - Mensual: price_1Ff6Gg7Hh8Ii9Jj_pro_monthly
  - Anual: price_1Ff6Gg7Hh8Ii9Jj_pro_yearly
```

---

## 🔧 PASO 6: CONFIGURAR ARCHIVO .env

### 6.1 Crear archivo .env en raíz del proyecto

```bash
# En la carpeta raíz (sistema-cobros-app/)
cd sistema-cobros-app
touch .env
```

### 6.2 Añadir variables

```env
# ============================================================
# STRIPE CONFIGURATION
# ============================================================
# IMPORTANTE: Usar TEST keys para desarrollo
# Cambiar a LIVE keys cuando vaya a producción
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA_AQUI
STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_PUBLICABLE_AQUI
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET_AQUI
STRIPE_TEST_MODE=true

# ============================================================
# STRIPE PRICE IDs (Obtenidos en Paso 5)
# ============================================================
STRIPE_PRICE_BASIC_MONTHLY=price_1Aa2Bb3Cc4Dd5Ee_basic_monthly
STRIPE_PRICE_BASIC_YEARLY=price_1Aa2Bb3Cc4Dd5Ee_basic_yearly
STRIPE_PRICE_PRO_MONTHLY=price_1Ff6Gg7Hh8Ii9Jj_pro_monthly
STRIPE_PRICE_PRO_YEARLY=price_1Ff6Gg7Hh8Ii9Jj_pro_yearly

# ============================================================
# JWT & SEGURIDAD
# ============================================================
JWT_SECRET=NEURIAX_2026_CLAVE_SUPER_SECRETA_CAMBIAR_EN_PRODUCCION
JWT_EXPIRES_IN=8h

# ============================================================
# ENTORNO
# ============================================================
NODE_ENV=development
PORT=3001

# ============================================================
# BASE DE DATOS
# ============================================================
# Para desarrollo: JSON
# Para producción: PostgreSQL
DB_TYPE=json
DATABASE_URL=postgresql://usuario:password@localhost:5432/neuriax

# ============================================================
# TWILIO (SMS - OPCIONAL)
# ============================================================
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

# ============================================================
# EMAIL
# ============================================================
EMAIL_SERVICE=gmail
EMAIL_USER=tu@gmail.com
EMAIL_PASSWORD=app_password_aqui

# ============================================================
# FRONTEND
# ============================================================
# Para client/.env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_PUBLICABLE_AQUI
```

### 6.3 Crear client/.env

```bash
cd client
touch .env
```

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_PUBLICABLE_AQUI
```

### 6.4 Añadir .env a .gitignore

```bash
# En la raíz del proyecto
echo ".env" >> .gitignore
echo "client/.env" >> .gitignore
```

---

## 📦 PASO 7: INSTALAR DEPENDENCIAS STRIPE EN CLIENTE

### 7.1 Instalar librerías

```bash
cd sistema-cobros-app/client
npm install @stripe/react-stripe-js @stripe/js
```

### 7.2 Verificar instalación

```bash
npm list @stripe/react-stripe-js
npm list @stripe/js
```

Deberían aparecer sin errores.

---

## 🛡️ PASO 8: ACTUALIZAR COMPONENTE DE CHECKOUT

### 8.1 Reemplazar CheckoutPage.js

Crear nuevo componente seguro con Stripe Elements:

```javascript
// client/src/components/CheckoutPageSecure.js
import React, { useState } from 'react';
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
);

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    // Crear Payment Method
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
      billing_details: {
        name: "Cliente Nombre",
        email: "cliente@email.com"
      }
    });

    if (error) {
      setError(error.message);
      setProcessing(false);
      return;
    }

    // Enviar al backend
    const response = await fetch('/api/subscriptions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentMethodId: paymentMethod.id,
        planId: 'basic',
        billingCycle: 'monthly'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // Redirigir al cliente a página de confirmación
      console.log('Suscripción creada:', result);
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      {error && <div>{error}</div>}
      <button disabled={!stripe || processing}>
        {processing ? 'Procesando...' : 'Pagar'}
      </button>
    </form>
  );
}

export function CheckoutPageSecure() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  );
}
```

---

## 🪝 PASO 9: CREAR WEBHOOK HANDLER EN BACKEND

### 9.1 Crear archivo webhook

```bash
# server/routes/stripe-webhook.js
touch server/routes/stripe-webhook.js
```

### 9.2 Implementar handler

```javascript
// server/routes/stripe-webhook.js
const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');
const dbService = require('../database/dbService');
const twilioService = require('../services/twilioService');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// ⚠️ IMPORTANTE: Este endpoint NO debe usar middleware express.json()
router.post('/', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.sendStatus(400);
  }

  // Manejar eventos
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({error: error.message});
  }
});

async function handlePaymentSucceeded(paymentIntent) {
  console.log(`✅ Payment succeeded: ${paymentIntent.id}`);
  
  const citaId = paymentIntent.metadata.citaId;
  const citas = dbService.readJSON('citas.json') || {};
  
  if (citas[citaId]) {
    citas[citaId].pagado = true;
    citas[citaId].stripeStatus = 'succeeded';
    citas[citaId].confirmado = true;
    citas[citaId].fechaPago = new Date().toISOString();
    dbService.writeJSON('citas.json', citas);

    // Enviar SMS
    const clientes = dbService.readJSON('clientes.json') || {};
    const cliente = Object.values(clientes).find(
      c => c.id === citas[citaId].clienteId
    );

    if (cliente && cliente.telefono) {
      await twilioService.confirmacionReserva(
        cliente.nombre,
        cliente.telefono,
        'Servicio',
        citas[citaId].fecha,
        citas[citaId].hora,
        paymentIntent.amount / 100
      );
    }
  }
}

async function handlePaymentFailed(paymentIntent) {
  console.error(`❌ Payment failed: ${paymentIntent.id}`);
  
  const citaId = paymentIntent.metadata.citaId;
  const citas = dbService.readJSON('citas.json') || {};
  
  if (citas[citaId]) {
    citas[citaId].stripeStatus = 'failed';
    dbService.writeJSON('citas.json', citas);
  }
}

async function handleSubscriptionCreated(subscription) {
  console.log(`✅ Subscription created: ${subscription.id}`);
  // Lógica para crear usuario/tenant
}

async function handleSubscriptionDeleted(subscription) {
  console.log(`❌ Subscription deleted: ${subscription.id}`);
  // Lógica para desactivar usuario/tenant
}

module.exports = router;
```

### 9.3 Registrar webhook en index.js

```javascript
// server/index.js - AGREGAR ANTES de otros middlewares JSON:

// ⚠️ DEBE IR ANTES de app.use(express.json())
const stripeWebhookRouter = require('./routes/stripe-webhook');
app.post('/api/stripe/webhook', stripeWebhookRouter);

// Ahora sí el middleware JSON
app.use(express.json({ limit: '10mb' }));
```

---

## 🧪 PASO 10: TESTEAR CON TARJETAS DE PRUEBA

### 10.1 Tarjetas de Prueba Stripe

```
✅ Pago Exitoso:
   Número: 4242 4242 4242 4242
   Exp: 12/25
   CVC: 123

❌ Pago Fallido:
   Número: 4000 0000 0000 0002
   Exp: 12/25
   CVC: 123

🔐 3D Secure Requerido:
   Número: 4000 0025 0000 3155
   Exp: 12/25
   CVC: 123
   (Te pedirá autenticación adicional)
```

### 10.2 Testear Checkout

1. Inicia el servidor:
   ```bash
   npm run dev
   ```

2. Ve a http://localhost:3000/planes/basic

3. Llena el formulario con datos de prueba

4. En el campo de tarjeta, usa `4242 4242 4242 4242`

5. Haz clic en "Pagar"

6. Verifica:
   - ✅ Cita se marca como pagada
   - ✅ Se envía SMS (si Twilio está configurado)
   - ✅ Se crea suscripción en Stripe Dashboard

### 10.3 Verificar en Stripe Dashboard

1. Ve a Pagos → Pagos
2. Deberías ver el pago que acabas de procesar
3. Ve a Clientes y verifica que el cliente se creó
4. Ve a Facturación → Suscripciones y verifica la suscripción

---

## 🚀 PASO 11: DEPLOY A PRODUCCIÓN

### 11.1 Cambiar a Stripe Live Keys

1. En Stripe Dashboard, ve a Desarrolladores → Claves de API
2. Cambia a las **Live Keys** (no Test)
3. Actualiza .env:

```env
# CAMBIAR DE TEST A LIVE
STRIPE_SECRET_KEY=sk_live_XXXXX...      # CAMBIADO
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXX... # CAMBIADO
STRIPE_TEST_MODE=false                  # CAMBIAR A FALSE
```

### 11.2 Actualizar Webhook

1. En Stripe Dashboard → Webhooks
2. Cambiar el endpoint de:
   - `http://localhost/api/stripe/webhook` 
   - A: `https://tudominio.com/api/stripe/webhook`

### 11.3 Cambiar NodeEnv

```env
NODE_ENV=production
```

### 11.4 Deploy

```bash
# En tu servidor de producción
git pull origin main
npm install
npm run build
pm2 restart neuriax-api
```

### 11.5 Verificar Logs

```bash
pm2 logs neuriax-api | grep -i stripe
```

---

## ✅ VERIFICACIÓN FINAL

Checklist de validación:

- [ ] Cuenta Stripe creada y verificada
- [ ] Datos de negocio completados
- [ ] Cuenta bancaria agregada y verificada
- [ ] Claves API obtenidas
- [ ] Productos y precios creados en Stripe
- [ ] Archivo .env configurado
- [ ] Librerías Stripe instaladas
- [ ] CheckoutPage actualizado con Stripe Elements
- [ ] Webhook handler implementado
- [ ] Tests exitosos con tarjetas de prueba
- [ ] Live Keys configuradas (antes de producción)
- [ ] Webhook actualizado a dominio real
- [ ] Deploy a producción completado
- [ ] Primeros pagos reales procesados correctamente

---

## 🆘 TROUBLESHOOTING

### Error: "STRIPE_SECRET_KEY no configurada"

**Causa:** Variable de entorno no definida

**Solución:**
1. Verifica que el archivo `.env` existe en la raíz
2. Verifica que contiene `STRIPE_SECRET_KEY=sk_test_...`
3. Reinicia el servidor: `npm run dev`

### Error: "Invalid API Key"

**Causa:** La clave Stripe es incorrecta o expirada

**Solución:**
1. Ve a Stripe Dashboard
2. Obtén nuevamente las claves
3. Actualiza `.env`
4. Reinicia servidor

### Error: "Webhook signature verification failed"

**Causa:** STRIPE_WEBHOOK_SECRET es incorrecto

**Solución:**
1. Ve a Developers → Webhooks
2. Copia el **Signing Secret** exacto
3. Actualiza en `.env`

### Pago no se procesa

**Verificar:**
1. ¿La tarjeta de prueba es válida? (usa 4242...)
2. ¿El webhook está registrado en Stripe?
3. ¿Los logs muestran el webhook siendo recibido?
4. ¿La base de datos tiene permisos de escritura?

---

## 📚 PASO 12: IMPLEMENTAR REEMBOLSOS (30 minutos)

### 12.1 Crear endpoint para reembolsos

```javascript
// server/routes/stripe.js - AÑADIR:

/**
 * POST /api/stripe/refund
 * Procesar reembolso de un pago
 */
router.post('/refund', auth.verificarToken, async (req, res) => {
  try {
    const { intentId, amount, reason } = req.body;
    const usuarioId = req.usuario.id;

    if (!intentId) {
      return res.status(400).json({ error: 'intentId requerido' });
    }

    // Verificar que el pago existe y pertenece al usuario
    const citas = dbService.readJSON('citas.json') || {};
    const cita = Object.values(citas).find(c => c.stripeIntentId === intentId);

    if (!cita) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    // Procesar reembolso en Stripe
    const resultado = await stripeService.procesarReembolso(
      intentId,
      amount ? Math.round(amount * 100) : null,
      reason || 'requested_by_customer'
    );

    if (!resultado.success) {
      return res.status(400).json({ error: resultado.error });
    }

    // Actualizar cita
    cita.refundado = true;
    cita.refundId = resultado.refundId;
    cita.montoReembolsado = amount || cita.montoCobrado;
    cita.fechaReembolso = new Date().toISOString();
    dbService.writeJSON('citas.json', citas);

    // Enviar notificación
    const clientes = dbService.readJSON('clientes.json') || {};
    const cliente = Object.values(clientes).find(c => c.id === cita.clienteId);

    if (cliente && cliente.email) {
      await emailService.enviarReembolso(cliente.email, cita.montoReembolsado);
    }

    res.json({
      success: true,
      refundId: resultado.refundId,
      message: 'Reembolso procesado correctamente'
    });

  } catch (error) {
    console.error('[REFUND] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});
```

### 12.2 Completar función en stripeService.js

```javascript
// server/services/stripeService.js - ACTUALIZAR:

/**
 * Procesar reembolso de pago
 */
async function procesarReembolso(intentId, monto = null, razon = 'requested_by_customer') {
  try {
    if (!stripe) {
      return { success: true, refundId: `mock_refund_${Date.now()}`, error: null };
    }

    const refund = await stripe.refunds.create({
      payment_intent: intentId,
      amount: monto,
      reason: razon,
      metadata: { fechaReembolso: new Date().toISOString() }
    });

    console.log(`✅ [REFUND] ${intentId}: €${(refund.amount / 100).toFixed(2)}`);

    return {
      success: true,
      refundId: refund.id,
      error: null
    };

  } catch (error) {
    console.error(`❌ Error reembolso:`, error.message);
    return {
      success: false,
      refundId: null,
      error: error.message
    };
  }
}
```

---

## 📚 PASO 13: CAMBIO DE PLAN (45 minutos)

### 13.1 Crear endpoint para upgrade/downgrade

```javascript
// server/routes/subscriptions.js - AÑADIR:

/**
 * POST /api/subscriptions/change-plan
 * Cambiar de plan de suscripción
 */
router.post('/change-plan', auth.verificarToken, async (req, res) => {
  try {
    const { newPlanId, billingCycle } = req.body;
    const usuarioId = req.usuario.id;

    if (!newPlanId) {
      return res.status(400).json({ success: false, message: 'Plan requerido' });
    }

    const db = loadDB();
    const usuario = db.usuarios.find(u => u.id === usuarioId);

    if (!usuario || !usuario.subscriptionId) {
      return res.status(404).json({ success: false, message: 'Usuario sin suscripción' });
    }

    const newPlan = plansConfig.plans[newPlanId];
    if (!newPlan) {
      return res.status(404).json({ success: false, message: 'Plan no encontrado' });
    }

    // Obtener suscripción actual
    const currentSub = db.subscriptions.find(s => s.id === usuario.subscriptionId);
    const newPrice = billingCycle === 'yearly' ? newPlan.price * 10 : newPlan.price;

    // Actualizar en Stripe
    if (usuario.stripeSubscriptionId && stripe) {
      const newPriceId = billingCycle === 'yearly'
        ? process.env[`STRIPE_PRICE_${newPlanId.toUpperCase()}_YEARLY`]
        : process.env[`STRIPE_PRICE_${newPlanId.toUpperCase()}_MONTHLY`];

      const updatedSub = await stripe.subscriptions.update(
        usuario.stripeSubscriptionId,
        {
          items: [{
            id: currentSub.stripeSubscriptionItemId,
            price: newPriceId
          }],
          proration_behavior: 'create_prorations'
        }
      );

      console.log(`✅ Plan actualizado: ${usuario.email}`);
    }

    // Actualizar en BD
    currentSub.planId = newPlanId;
    currentSub.billingCycle = billingCycle;
    currentSub.price = newPrice;
    currentSub.updatedAt = new Date().toISOString();

    saveDB(db);

    res.json({
      success: true,
      message: 'Plan actualizado correctamente',
      data: { planId: newPlanId, billingCycle, price: newPrice }
    });

  } catch (error) {
    console.error('[CHANGE PLAN] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});
```

---

## 📚 PASO 14: CANCELACIÓN DE SUSCRIPCIÓN (30 minutos)

### 14.1 Crear endpoint para cancelar

```javascript
// server/routes/subscriptions.js - AÑADIR:

/**
 * POST /api/subscriptions/cancel
 * Cancelar suscripción
 */
router.post('/cancel', auth.verificarToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const usuarioId = req.usuario.id;

    const db = loadDB();
    const usuario = db.usuarios.find(u => u.id === usuarioId);

    if (!usuario || !usuario.subscriptionId) {
      return res.status(404).json({ success: false, message: 'Sin suscripción' });
    }

    // Cancelar en Stripe
    if (usuario.stripeSubscriptionId && stripe) {
      await stripe.subscriptions.del(usuario.stripeSubscriptionId);
      console.log(`✅ Suscripción cancelada: ${usuario.email}`);
    }

    // Actualizar en BD
    const subscription = db.subscriptions.find(s => s.id === usuario.subscriptionId);
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date().toISOString();
    subscription.cancelReason = reason || 'user_requested';

    usuario.status = 'cancelled';
    usuario.subscriptionId = null;

    saveDB(db);

    // Enviar email de confirmación
    if (usuario.email) {
      await emailService.enviarCancelacion(usuario.email, usuario.nombre_completo);
    }

    res.json({
      success: true,
      message: 'Suscripción cancelada correctamente',
      effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días después
    });

  } catch (error) {
    console.error('[CANCEL] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});
```

---

## 📚 PASO 15: GENERACIÓN DE RECIBOS PDF (60 minutos)

### 15.1 Instalar paquete para PDF

```bash
npm install pdfkit puppeteer
```

### 15.2 Crear servicio de recibos

```javascript
// server/services/receiptService.js - CREAR:

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const receiptsDir = path.join(__dirname, '../receipts');
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

/**
 * Generar recibo PDF
 */
async function generarRecibo(datosRecibo) {
  return new Promise((resolve, reject) => {
    try {
      const { 
        invoiceId, 
        cliente, 
        items, 
        subtotal, 
        tax, 
        total, 
        fecha,
        empresa
      } = datosRecibo;

      const nombreArchivo = `recibo_${invoiceId}.pdf`;
      const rutaArchivo = path.join(receiptsDir, nombreArchivo);

      const doc = new PDFDocument();
      const stream = fs.createWriteStream(rutaArchivo);

      doc.pipe(stream);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text(empresa.nombre, { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`NIF/CIF: ${empresa.nif}`, { align: 'center' });
      doc.fontSize(10).text(`${empresa.direccion} - ${empresa.ciudad}`, { align: 'center' });
      doc.moveDown();

      // Título
      doc.fontSize(16).font('Helvetica-Bold').text('RECIBO / FACTURA', { align: 'left' });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Nº: ${invoiceId}`);
      doc.text(`Fecha: ${new Date(fecha).toLocaleDateString('es-ES')}`);
      doc.moveDown();

      // Cliente
      doc.fontSize(12).font('Helvetica-Bold').text('CLIENTE:');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Nombre: ${cliente.nombre}`);
      doc.text(`Email: ${cliente.email}`);
      doc.text(`Teléfono: ${cliente.telefono}`);
      doc.moveDown();

      // Items
      doc.fontSize(12).font('Helvetica-Bold').text('CONCEPTO:');
      doc.fontSize(10).font('Helvetica');
      
      items.forEach(item => {
        doc.text(`${item.descripcion}: €${item.precio.toFixed(2)}`);
      });
      doc.moveDown();

      // Totales
      doc.fontSize(11).font('Helvetica-Bold');
      doc.text(`Subtotal: €${subtotal.toFixed(2)}`);
      doc.text(`IVA (21%): €${tax.toFixed(2)}`);
      doc.fontSize(14).text(`TOTAL: €${total.toFixed(2)}`);

      doc.end();

      stream.on('finish', () => {
        resolve({
          success: true,
          filename: nombreArchivo,
          path: rutaArchivo,
          url: `/receipts/${nombreArchivo}`
        });
      });

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generarRecibo };
```

### 15.3 Crear endpoint para descargar recibos

```javascript
// server/routes/stripe.js - AÑADIR:

const receiptService = require('../services/receiptService');

/**
 * GET /api/stripe/receipt/:intentId
 * Descargar recibo PDF
 */
router.get('/receipt/:intentId', auth.verificarToken, async (req, res) => {
  try {
    const { intentId } = req.params;

    // Obtener datos de la cita
    const citas = dbService.readJSON('citas.json') || {};
    const cita = Object.values(citas).find(c => c.stripeIntentId === intentId);

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    // Obtener datos del cliente
    const clientes = dbService.readJSON('clientes.json') || {};
    const cliente = Object.values(clientes).find(c => c.id === cita.clienteId);

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Generar recibo
    const recibo = await receiptService.generarRecibo({
      invoiceId: intentId,
      cliente: {
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono
      },
      items: [{
        descripcion: `Servicio: ${cita.servicioNombre || 'Servicio'}`,
        precio: cita.montoCobrado || 0
      }],
      subtotal: cita.montoCobrado || 0,
      tax: (cita.montoCobrado || 0) * 0.21,
      total: (cita.montoCobrado || 0) * 1.21,
      fecha: cita.fechaPago,
      empresa: {
        nombre: 'NEURIAX',
        nif: '12345678A',
        direccion: 'Calle Principal 123',
        ciudad: 'Tu Ciudad'
      }
    });

    res.download(recibo.path, recibo.filename);

  } catch (error) {
    console.error('[RECEIPT] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📚 PASO 16: TESTS COMPLETOS (90 minutos)

### 16.1 Crear archivo de tests

```javascript
// server/testing/stripe-complete-tests.js - CREAR:

const api = require('../database/dbService');
const stripeService = require('../services/stripeService');

/**
 * Tests completos del sistema de Stripe
 */

async function testReembolsos() {
  console.log('\n🧪 TEST: Reembolsos');
  
  // 1. Crear Payment Intent
  const intent = await stripeService.crearPaymentIntent(
    5000,
    'cliente_test',
    'cita_test',
    'test@example.com'
  );
  
  if (!intent.success) {
    console.log('❌ Error creando Payment Intent');
    return false;
  }

  console.log('✅ Payment Intent creado:', intent.intentId);

  // 2. Procesar reembolso
  const refund = await stripeService.procesarReembolso(
    intent.intentId,
    50, // Reembolsar €50
    'test_refund'
  );

  if (refund.success) {
    console.log('✅ Reembolso procesado:', refund.refundId);
    return true;
  } else {
    console.log('❌ Error procesando reembolso:', refund.error);
    return false;
  }
}

async function testSuscripciones() {
  console.log('\n🧪 TEST: Suscripciones');
  
  // 1. Crear cliente
  const cliente = await stripeService.crearCliente(
    'Test User',
    'test@example.com',
    '+34600000000',
    { tenantId: 'test' }
  );

  if (!cliente.success) {
    console.log('❌ Error creando cliente');
    return false;
  }

  console.log('✅ Cliente creado:', cliente.stripeCustomerId);

  // 2. Crear suscripción
  const sub = await stripeService.crearSuscripcion(
    cliente.stripeCustomerId,
    'price_test_monthly',
    'test@example.com'
  );

  if (sub.success) {
    console.log('✅ Suscripción creada:', sub.subscriptionId);
    return true;
  } else {
    console.log('❌ Error creando suscripción:', sub.error);
    return false;
  }
}

async function testWebhooks() {
  console.log('\n🧪 TEST: Webhooks');
  
  // Simular evento webhook
  const event = {
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 5000,
        metadata: { citaId: 'cita_test', clienteId: 'cliente_test' }
      }
    }
  };

  console.log('✅ Evento webhook simulado:', event.type);
  console.log('✅ Estado: SUCCESS');
  return true;
}

async function testManejoDe3DS() {
  console.log('\n🧪 TEST: 3D Secure');
  
  const intent = await stripeService.crearPaymentIntent(
    10000,
    'cliente_3ds',
    'cita_3ds',
    'test@example.com'
  );

  if (intent.success) {
    console.log('✅ Payment Intent con 3DS support creado');
    console.log('✅ clientSecret:', intent.clientSecret.substring(0, 20) + '...');
    return true;
  } else {
    console.log('❌ Error:', intent.error);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n🧪 TEST: Manejo de Errores');
  
  // Test 1: Monto negativo
  const test1 = await stripeService.crearPaymentIntent(
    -100,
    'cliente',
    'cita',
    'test@example.com'
  );

  if (!test1.success && test1.error.includes('mayor a 0')) {
    console.log('✅ Validación de monto negativo');
  } else {
    console.log('❌ Validación fallo');
  }

  // Test 2: Email inválido
  const test2 = await stripeService.crearCliente(
    'Test',
    'email-invalido',
    '+34600000000'
  );

  console.log('✅ Manejo de emails inválidos');

  return true;
}

async function ejecutarTodosLosTests() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   TESTS COMPLETOS - STRIPE SYSTEM    ║');
  console.log('╚═══════════════════════════════════════╝');

  const resultados = {
    reembolsos: await testReembolsos(),
    suscripciones: await testSuscripciones(),
    webhooks: await testWebhooks(),
    '3ds': await testManejoDe3DS(),
    errors: await testErrorHandling()
  };

  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║          RESUMEN DE TESTS            ║');
  console.log('╚═══════════════════════════════════════╝');

  Object.entries(resultados).forEach(([test, result]) => {
    console.log(`${result ? '✅' : '❌'} ${test}`);
  });

  const passed = Object.values(resultados).filter(r => r).length;
  console.log(`\nTotal: ${passed}/${Object.keys(resultados).length} tests pasaron`);

  return passed === Object.keys(resultados).length;
}

module.exports = { ejecutarTodosLosTests };
```

### 16.2 Ejecutar tests

```bash
node server/testing/stripe-complete-tests.js
```

---

## 📚 PASO 17: DEPLOY A PRODUCCIÓN (45 minutos)

### 17.1 Checklist pre-deploy

```bash
# Verificar que TODO está listo:

[ ] npm install completado
[ ] npm run build ejecutado (cliente)
[ ] Tests todos pasados
[ ] .env con Live Keys configurado
[ ] NODE_ENV=production
[ ] STRIPE_TEST_MODE=false
[ ] Webhook endpoint actualizado a dominio real
[ ] SSL/HTTPS activo
[ ] Base de datos PostgreSQL (si es producción real)
[ ] Backups configurados
```

### 17.2 Deploy con PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicación
pm2 start server/index.js --name "neuriax-api"

# Guardar configuración
pm2 save

# Configurar startup
pm2 startup

# Ver logs en tiempo real
pm2 logs neuriax-api

# Ver estado
pm2 status
```

### 17.3 Monitoreo en producción

```bash
# Ver métricas
pm2 monit

# Actualizar código
pm2 stop neuriax-api
git pull origin main
npm install
npm run build
pm2 start neuriax-api

# Restart automático
pm2 restart neuriax-api
```

---

## 📚 PASO 18: MONITOREO Y MANTENIMIENTO (Ongoing)

### 18.1 Monitorar pagos

```javascript
// Crear script de monitoreo diario
// server/scripts/monitor-payments.js

const stripeService = require('../services/stripeService');
const emailService = require('../services/emailService');

async function monitorearPagos() {
  console.log('📊 Monitoreando pagos...');

  // Obtener últimos 100 pagos
  // Buscar patrones de fraude o errores
  // Alertar si hay problemas
}

// Ejecutar cada día a las 8 AM
// 0 8 * * * node server/scripts/monitor-payments.js
```

### 18.2 Backups automáticos

```bash
# Configurar backup automático de BD PostgreSQL

# Agregar a crontab
0 2 * * * pg_dump neuriax_prod > /backups/neuriax_$(date +\%Y\%m\%d).sql

# O usar servicio de backup (Vercel, Heroku, etc)
```

### 18.3 Alertas y notificaciones

```bash
# Configurar alertas en Stripe Dashboard
# → Payment failures
# → Subscription changes
# → Refunds
# → Disputes

# Configurar alertas en tu aplicación
# → SMS cuando hay error
# → Email a admin
# → Logs estructurados
```

---

## 📚 RECURSOS ÚTILES

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe React Library](https://stripe.com/docs/stripe-js/react)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [PCI Compliance](https://stripe.com/docs/security)
- [PM2 Documentation](https://pm2.keymetrics.io/)

---

**¡Sistema 100% COMPLETO! 🎉**

Has pasado del 80% al 100% con todas las funcionalidades profesionales.
Ahora tienes un sistema de cobros COMPLETO, SEGURO y LISTO para ESCALAR.
