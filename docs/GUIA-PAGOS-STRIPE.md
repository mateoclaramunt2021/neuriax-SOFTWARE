# 💳 Guía de Configuración de Pagos con Stripe - NEURIAX

## 🎯 Resumen

Esta guía te explica paso a paso cómo configurar Stripe para cobrar membresías en tu plataforma NEURIAX.

---

## 📋 LO QUE NECESITAS HACER

### PASO 1: Crear cuenta en Stripe (5 minutos)

1. Ve a [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Crea tu cuenta con tu email
3. Confirma tu email

### PASO 2: Completar tu perfil de negocio (10-15 minutos)

En el Dashboard de Stripe:

1. Ve a **Configuración** → **Datos de la empresa**
2. Completa:
   - **Nombre legal del negocio**: Tu nombre o razón social
   - **Dirección**: Tu dirección fiscal
   - **Número de identificación fiscal**: Tu NIF/CIF
   - **Sitio web**: La URL donde tendrás NEURIAX (puede ser temporal)

### PASO 3: Configurar cuenta bancaria para recibir pagos

1. Ve a **Configuración** → **Pagos**
2. En "Cuentas bancarias", haz clic en **Añadir cuenta bancaria**
3. Introduce:
   - **IBAN**: ES + 22 dígitos (ejemplo: ES9121000418450200051332)
   - **Nombre del titular**: Debe coincidir con el nombre del negocio

> ⚠️ **IMPORTANTE**: Sin cuenta bancaria verificada, no podrás recibir pagos.

### PASO 4: Obtener las claves API

1. Ve a **Desarrolladores** → **Claves de API**
2. Copia estas dos claves:

```
📋 Clave publicable (pk_live_xxxxx o pk_test_xxxxx)
📋 Clave secreta (sk_live_xxxxx o sk_test_xxxxx)
```

> 💡 Usa las claves `test` para pruebas y `live` para producción

### PASO 5: Crear los productos y precios en Stripe

En el Dashboard de Stripe:

1. Ve a **Productos** → **Añadir producto**

2. **Crea el Plan Básico**:
   - Nombre: `Plan Básico NEURIAX`
   - Descripción: `Gestión para emprendedores`
   - Precio mensual: `39.00 EUR` (recurrente mensual)
   - Precio anual: `390.00 EUR` (recurrente anual)
   
3. **Crea el Plan Profesional**:
   - Nombre: `Plan Profesional NEURIAX`
   - Descripción: `Para negocios en crecimiento`
   - Precio mensual: `79.00 EUR` (recurrente mensual)
   - Precio anual: `790.00 EUR` (recurrente anual)

4. Después de crear cada precio, copia el **Price ID** (empieza con `price_`)

---

## ⚙️ CONFIGURACIÓN EN TU SERVIDOR

### PASO 6: Crear archivo de configuración

Crea el archivo `.env` en la raíz del proyecto:

```env
# Stripe API Keys (REEMPLAZA CON TUS CLAVES)
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA_AQUI
STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_PUBLICABLE_AQUI
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET_AQUI

# Stripe Price IDs (REEMPLAZA CON TUS IDS)
STRIPE_PRICE_BASIC_MONTHLY=price_xxx_basic_monthly
STRIPE_PRICE_BASIC_YEARLY=price_xxx_basic_yearly
STRIPE_PRICE_PRO_MONTHLY=price_xxx_pro_monthly
STRIPE_PRICE_PRO_YEARLY=price_xxx_pro_yearly

# JWT
JWT_SECRET=tu-clave-secreta-muy-segura-2026

# Base de datos
DATABASE_URL=postgresql://usuario:password@localhost:5432/neuriax
```

### PASO 7: Instalar Stripe en el servidor

```bash
cd sistema-cobros-app
npm install stripe
```

### PASO 8: Configurar Webhooks (IMPORTANTE para cobros automáticos)

En Stripe Dashboard:

1. Ve a **Desarrolladores** → **Webhooks**
2. Haz clic en **Añadir endpoint**
3. URL del endpoint: `https://tudominio.com/api/webhooks/stripe`
4. Eventos a escuchar:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copia el **Webhook Secret** (whsec_xxx) y ponlo en `.env`

---

## 🧪 MODO DE PRUEBA

Para probar el sistema antes de activar pagos reales:

### Tarjetas de prueba de Stripe:

| Número | Resultado |
|--------|-----------|
| 4242 4242 4242 4242 | ✅ Pago exitoso |
| 4000 0000 0000 0002 | ❌ Tarjeta rechazada |
| 4000 0000 0000 3220 | 🔐 Requiere autenticación 3D Secure |

- **Fecha expiración**: Cualquier fecha futura (ej: 12/28)
- **CVC**: Cualquier 3 dígitos (ej: 123)

---

## 🚀 ACTIVAR PAGOS REALES

Una vez que todo funcione en modo prueba:

1. En Stripe Dashboard, haz clic en **Activar cuenta**
2. Completa la verificación de identidad (puede tardar 1-2 días)
3. Cuando esté verificada, cambia las claves de `test` a `live` en `.env`
4. Reinicia el servidor

---

## 📊 RESUMEN DE FLUJO DE PAGO

```
Usuario → Landing Page → Elige Plan → Checkout
                                         ↓
                                    Llena datos
                                         ↓
                                    Paga con tarjeta
                                         ↓
                         Stripe procesa → Webhook confirma
                                         ↓
                              Usuario activado con su plan
                                         ↓
                              Puede acceder al Dashboard
```

---

## 🔒 SEGURIDAD

✅ Los datos de tarjeta NUNCA pasan por tu servidor
✅ Stripe maneja toda la información sensible
✅ Cumple con PCI-DSS automáticamente
✅ Los webhooks verifican la firma de Stripe

---

## 📞 SOPORTE

- **Documentación Stripe**: https://stripe.com/docs
- **Soporte Stripe España**: +34 911 98 15 98
- **Dashboard Stripe**: https://dashboard.stripe.com

---

## ✅ CHECKLIST FINAL

- [ ] Cuenta Stripe creada y verificada
- [ ] Cuenta bancaria añadida y verificada
- [ ] Productos y precios creados
- [ ] Claves API copiadas al `.env`
- [ ] Webhook configurado
- [ ] Pruebas con tarjetas de test completadas
- [ ] Modo live activado

---

## 💰 COMISIONES DE STRIPE

Stripe cobra:
- **1.4% + 0.25€** por transacción con tarjetas europeas
- **2.9% + 0.25€** con tarjetas internacionales

Ejemplo:
- Plan Básico 39€ → Comisión ~0.80€ → Recibes ~38.20€
- Plan Pro 79€ → Comisión ~1.36€ → Recibes ~77.64€

---

¡Listo! Con esta configuración podrás empezar a cobrar membresías de forma profesional y segura.
