# ✅ PASOS DE ACTIVACIÓN - SISTEMA COBROS APP v2.0

**Objetivo**: Activar todas las mejoras sin romper nada
**Tiempo estimado**: 20-30 minutos
**Riesgo**: BAJO (cambios backward compatible)

---

## 🔧 PASO 1: VERIFICAR ARCHIVOS CREADOS

### Verificar que los archivos existen
```bash
# Desde la raíz del proyecto
ls -la server/routes/stripe-webhook.js          # ✅ Debe existir
ls -la server/services/stripeService.js         # ✅ Debe estar actualizado
ls -la client/src/components/CheckoutPage-enterprise.js  # ✅ Debe existir
ls -la client/package.json                      # ✅ Actualizado con Stripe
```

### Verificar contenido
```bash
# Verificar que stripeService.js tiene idempotencia
grep -i "idempotency" server/services/stripeService.js  # Debe tener varios matches

# Verificar que webhook está registrado en index.js
grep "stripe-webhook" server/index.js  # Debe encontrarse

# Verificar que CheckoutPage tiene CardElement
grep "CardElement" client/src/components/CheckoutPage-enterprise.js  # Debe encontrarse
```

---

## ⚙️ PASO 2: ACTUALIZAR CONFIGURACIÓN

### 2.1 Backend - .env
```bash
# Editar archivo .env en la raíz del servidor
# Agregar o actualizar estas líneas:

STRIPE_SECRET_KEY=sk_test_...           # O sk_live_ en producción
STRIPE_PUBLISHABLE_KEY=pk_test_...      # O pk_live_ en producción
STRIPE_TEST_MODE=true                   # O false en producción
STRIPE_WEBHOOK_SECRET=whsec_...         # Obtener de Stripe Dashboard

# Otros servicios (ya debería estar)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

EMAIL_SERVICE=gmail                     # O tu servicio
EMAIL_USER=...
EMAIL_PASSWORD=...
```

### 2.2 Frontend - .env
```bash
# Editar archivo .env en client/
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_...  # O pk_live_ en producción
REACT_APP_API_URL=http://localhost:3001/api  # Cambiar en producción
```

### 2.3 Verificar variables
```bash
# Backend
echo "STRIPE_SECRET_KEY: $STRIPE_SECRET_KEY"
echo "STRIPE_WEBHOOK_SECRET: $STRIPE_WEBHOOK_SECRET"

# Frontend
echo "REACT_APP_STRIPE_PUBLIC_KEY: $REACT_APP_STRIPE_PUBLIC_KEY"
```

---

## 📦 PASO 3: INSTALAR DEPENDENCIAS

### 3.1 Dependencias del Backend (Stripe ya debería estar)
```bash
cd server
npm list stripe      # Verificar que está instalado v10+
npm list node-cron  # Debe estar instalado
npm list twilio     # Debe estar instalado

# Si faltan:
npm install stripe node-cron twilio
```

### 3.2 Dependencias del Frontend (IMPORTANTE)
```bash
cd client

# Actualizar con nuevas dependencias Stripe
npm install

# Verificar instalación
npm list @stripe/react-stripe-js
npm list @stripe/js

# Debe mostrar:
# ├── @stripe/js@3.x.x
# └── @stripe/react-stripe-js@2.x.x
```

---

## 🔄 PASO 4: ACTIVAR WEBHOOK (CRÍTICO)

### 4.1 Verificar que webhook está registrado en index.js
```bash
grep -A2 "stripe-webhook" server/index.js
# Debe mostrar algo como:
# const stripeWebhookRouter = require('./routes/stripe-webhook');
# app.use('/api/stripe/webhook', stripeWebhookRouter);
# // ANTES de app.use(express.json())
```

### 4.2 Registrar webhook en Stripe Dashboard
1. Ir a https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://tudominio.com/api/stripe/webhook` (en producción)
4. Events to send:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
5. Click "Create endpoint"
6. Copiar el Signing secret (whsec_...)
7. Guardar en `.env` como `STRIPE_WEBHOOK_SECRET=whsec_...`

### 4.3 Verificar webhook en local (para testing)
```bash
# Usar Stripe CLI para recibir webhooks en desarrollo
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Esto te dará un signing secret para desarrollo
# Guardar en .env como STRIPE_WEBHOOK_SECRET=whsec_test_...
```

---

## 📝 PASO 5: ACTUALIZAR CHECKOUT PAGE

### 5.1 Opción A: Reemplazar completamente (RECOMENDADO)
```bash
cd client/src/components

# Backup del antiguo
cp CheckoutPage.js CheckoutPage.js.backup

# Reemplazar con versión segura
cp CheckoutPage-enterprise.js CheckoutPage.js

# Verificar
grep "CardElement" CheckoutPage.js  # Debe encontrarse
grep "useStripe" CheckoutPage.js    # Debe encontrarse
```

### 5.2 Opción B: Actualizar manualmente
Si prefieres mantener customizaciones:
1. Abrir `CheckoutPage-enterprise.js` como referencia
2. Comparar con `CheckoutPage.js` actual
3. Actualizar sección por sección:
   - Imports (agregar @stripe/react-stripe-js)
   - PaymentForm component (usar hooks)
   - CardElement (reemplazar input manual)
   - procesarPago function (usar stripe.confirmCardPayment)

---

## 🧪 PASO 6: TESTING LOCAL

### 6.1 Iniciar servidor backend
```bash
cd server
npm start
# Debe mostrar: "Server running on http://localhost:3001"
```

### 6.2 Iniciar frontend
```bash
# En otra terminal
cd client
npm start
# Debe abrir http://localhost:3000
```

### 6.3 Probar webhook (Stripe CLI)
```bash
# En otra terminal
stripe listen --forward-to localhost:3001/api/stripe/webhook
# Debe mostrar: "Ready! Your webhook signing secret is: whsec_test_..."
```

### 6.4 Probar Pago
1. Ir a http://localhost:3000/checkout/pro
2. Completar formulario con datos ficticios
3. En tarjeta, usar: 4242 4242 4242 4242
4. Exp: 12/25, CVC: 123
5. Click "Pagar"
6. Debe mostrar "✅ Pago Completado"

### 6.5 Verificar logs
```bash
# En terminal de backend, debe ver:
# ✅ [PAYMENT INTENT] ... 
# ✅ [WEBHOOK] payment_intent.succeeded received
# ✅ [NOTIFICATION] Confirmación enviada a ...
```

---

## 🔍 PASO 7: VERIFICACIÓN

### 7.1 Verificar que stripeService.js está activo
```bash
# Buscar en archivo
grep "generateIdempotencyKey\|retryWithBackoff" server/services/stripeService.js

# Debe encontrar muchos matches
```

### 7.2 Verificar que webhook maneja eventos
```bash
grep "payment_intent\|charge.refunded\|subscription" server/routes/stripe-webhook.js

# Debe encontrar todos los event types
```

### 7.3 Verificar que no hay errores de sintaxis
```bash
node -c server/services/stripeService.js     # No output = OK
node -c server/routes/stripe-webhook.js       # No output = OK
node -c server/index.js                       # No output = OK
```

### 7.4 Verificar imports en cliente
```bash
grep "import.*CardElement\|import.*useStripe" client/src/components/CheckoutPage.js

# Debe encontrar imports de Stripe
```

---

## ⚠️ ROLLBACK (Si algo sale mal)

### 7.1 Rollback de CheckoutPage
```bash
cd client/src/components
cp CheckoutPage.js.backup CheckoutPage.js
npm start
# Volver a versión anterior
```

### 7.2 Rollback de stripeService
```bash
# Si guardaste backup anterior
cp server/services/stripeService.js.backup server/services/stripeService.js
npm start
# Volver a versión anterior
```

### 7.3 Desactivar webhook (si causa problemas)
```bash
# Comentar en server/index.js:
// app.use('/api/stripe/webhook', stripeWebhookRouter);

# Reiniciar servidor
npm start
```

---

## 📋 CHECKLIST FINAL

- [ ] Archivos creados/modificados existen
- [ ] .env actualizado con claves Stripe
- [ ] Webhook registrado en Stripe Dashboard
- [ ] Stripe CLI ejecutándose (opcional pero recomendado)
- [ ] Dependencias de Stripe instaladas en cliente
- [ ] CheckoutPage.js actualizado
- [ ] Backend inicia sin errores
- [ ] Frontend inicia sin errores
- [ ] Pago de prueba funciona
- [ ] Webhook se ejecuta
- [ ] Email se envía (si implementado)
- [ ] SMS se envía (si implementado)
- [ ] Logs muestran operaciones

---

## 📞 TROUBLESHOOTING

### Problema: "Stripe is not defined"
```bash
# Solución:
# 1. Verificar REACT_APP_STRIPE_PUBLIC_KEY en .env
# 2. npm start (reiniciar)
# 3. Limpiar cache: rm -rf node_modules package-lock.json && npm install
```

### Problema: "Webhook signature verification failed"
```bash
# Solución:
# 1. Verificar STRIPE_WEBHOOK_SECRET correcto en .env
# 2. Usar stripe listen para obtener signing secret en local
# 3. npm start (reiniciar backend)
```

### Problema: "CardElement not found"
```bash
# Solución:
# 1. Verificar que CheckoutPage.js está actualizado
# 2. Verificar que @stripe/react-stripe-js está instalado
# 3. npm install (reinstalar dependencias)
```

### Problema: "Payment failed"
```bash
# Solución:
# 1. Usar tarjeta de prueba válida: 4242 4242 4242 4242
# 2. Verificar que stripeService.crearPaymentIntent() funciona
# 3. Revisar logs del backend
```

---

## 🚀 SIGUIENTE PASO

Después de verificar que todo funciona:
1. Crear test suite básico
2. Implementar email templates
3. Setup Sentry para monitoring
4. Hacer load test
5. Deployment a producción

---

**Tiempo total estimado**: 20-30 minutos
**Complejidad**: Media (requiere crear claves Stripe)
**Riesgo**: Bajo (cambios backward compatible)
**Resultado**: Sistema de pagos enterprise-ready

¡Listo para activar! 🚀
