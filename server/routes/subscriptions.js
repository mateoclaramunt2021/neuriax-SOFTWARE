/**
 * SUBSCRIPTIONS ROUTES - Sistema de Pagos con Stripe
 * Gestión de suscripciones y membresías NEURIAX
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || 'neuriax-secret-key-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Base de datos (en producción sería PostgreSQL/MongoDB)
const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, '../database/database.json');

// Cargar planes
const plansConfig = require('../config/plans.js');

/**
 * Cargar base de datos
 */
const loadDB = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { 
      usuarios: [], 
      subscriptions: [], 
      payments: [],
      tenants: [] 
    };
  }
};

/**
 * Guardar base de datos
 */
const saveDB = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

/**
 * Generar ID único
 */
const generateId = () => crypto.randomBytes(16).toString('hex');

/**
 * GET /api/subscriptions/plans
 * Obtener todos los planes disponibles
 */
router.get('/plans', (req, res) => {
  try {
    const plans = Object.values(plansConfig.plans).map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency || 'EUR',
      period: plan.period || 'monthly',
      icon: plan.icon,
      benefits: plan.benefits,
      features: plan.features,
      limitations: plan.limitations,
      // Precio anual (2 meses gratis)
      yearlyPrice: plan.price > 0 ? plan.price * 10 : -1,
      // IDs de Stripe (se configuran en producción)
      stripePriceIdMonthly: `price_${plan.id}_monthly`,
      stripePriceIdYearly: `price_${plan.id}_yearly`
    }));

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo planes'
    });
  }
});

/**
 * POST /api/subscriptions/create-checkout
 * Crear sesión de checkout y procesar pago
 */
router.post('/create-checkout', async (req, res) => {
  try {
    const { planId, billingCycle, userData, paymentMethod } = req.body;

    // Validar datos requeridos
    if (!planId || !userData || !userData.email || !userData.password) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos. Se requiere plan, email y contraseña.'
      });
    }

    // Obtener plan
    const plan = plansConfig.plans[planId];
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }

    // Plan Enterprise requiere contacto
    if (plan.price === -1) {
      return res.status(400).json({
        success: false,
        message: 'El plan Enterprise requiere contacto con ventas'
      });
    }

    const db = loadDB();

    // Verificar si el email ya existe
    const existingUser = db.usuarios.find(u => u.email === userData.email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado. Por favor inicia sesión.'
      });
    }

    // Calcular precio
    const price = billingCycle === 'yearly' ? plan.price * 10 : plan.price;

    // =====================================================
    // SIMULACIÓN DE PAGO (En producción usar Stripe real)
    // =====================================================
    // En producción, aquí iría:
    // 1. stripe.customers.create()
    // 2. stripe.paymentMethods.attach()
    // 3. stripe.subscriptions.create()
    // =====================================================

    const paymentId = generateId();
    const subscriptionId = generateId();
    const customerId = `cus_${generateId().slice(0, 14)}`;
    const userId = generateId();
    const tenantId = `tenant_${Date.now()}`;

    // Crear hash de contraseña
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Crear nuevo usuario
    const newUser = {
      id: userId,
      username: userData.email.split('@')[0],
      email: userData.email,
      password: hashedPassword,
      nombre_completo: userData.nombre_completo,
      telefono: userData.telefono || '',
      rol: 'admin',
      activo: true,
      tenantId: tenantId,
      stripeCustomerId: customerId,
      createdAt: new Date().toISOString()
    };

    // Crear suscripción
    const subscription = {
      id: subscriptionId,
      stripeSubscriptionId: `sub_${subscriptionId.slice(0, 14)}`,
      userId: userId,
      tenantId: tenantId,
      planId: planId,
      planName: plan.name,
      status: 'active',
      billingCycle: billingCycle,
      priceMonthly: plan.price,
      priceTotal: price,
      currency: 'EUR',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(
        Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
      ).toISOString(),
      cancelAtPeriodEnd: false,
      createdAt: new Date().toISOString()
    };

    // Crear registro de pago
    const payment = {
      id: paymentId,
      stripePaymentIntentId: `pi_${paymentId.slice(0, 24)}`,
      subscriptionId: subscriptionId,
      userId: userId,
      tenantId: tenantId,
      amount: price * 100, // En céntimos
      currency: 'EUR',
      status: 'succeeded',
      paymentMethod: {
        type: 'card',
        last4: paymentMethod?.last4 || '4242',
        brand: paymentMethod?.brand || 'visa'
      },
      description: `${plan.name} - ${billingCycle === 'yearly' ? 'Anual' : 'Mensual'}`,
      invoice: {
        number: `INV-${Date.now()}`,
        pdfUrl: null
      },
      createdAt: new Date().toISOString()
    };

    // Crear tenant (negocio)
    const tenant = {
      id: tenantId,
      nombre: userData.nombre_negocio || `Negocio de ${userData.nombre_completo}`,
      plan: planId,
      subscriptionId: subscriptionId,
      ownerId: userId,
      configuracion: {
        nombre_negocio: userData.nombre_negocio || 'Mi Salón',
        direccion: userData.direccion || '',
        ciudad: userData.ciudad || '',
        codigo_postal: userData.codigo_postal || '',
        pais: userData.pais || 'ES',
        nif_cif: userData.nif_cif || '',
        moneda: 'EUR',
        timezone: 'Europe/Madrid'
      },
      limits: plan.features,
      activo: true,
      createdAt: new Date().toISOString()
    };

    // Guardar en base de datos
    if (!db.usuarios) db.usuarios = [];
    if (!db.subscriptions) db.subscriptions = [];
    if (!db.payments) db.payments = [];
    if (!db.tenants) db.tenants = [];

    db.usuarios.push(newUser);
    db.subscriptions.push(subscription);
    db.payments.push(payment);
    db.tenants.push(tenant);

    saveDB(db);

    // Generar token JWT
    const accessToken = jwt.sign(
      {
        userId: userId,
        email: userData.email,
        rol: 'admin',
        tenantId: tenantId,
        plan: planId
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Enviar email de bienvenida (simulado)
    console.log(`📧 Email de bienvenida enviado a: ${userData.email}`);
    console.log(`✅ Nueva suscripción creada: ${plan.name} - ${price}€/${billingCycle}`);

    res.json({
      success: true,
      message: 'Suscripción creada exitosamente',
      accessToken,
      subscription: {
        id: subscriptionId,
        planId: planId,
        planName: plan.name,
        status: 'active',
        billingCycle: billingCycle,
        price: price,
        nextBillingDate: subscription.currentPeriodEnd
      },
      usuario: {
        id: userId,
        email: userData.email,
        nombre_completo: userData.nombre_completo,
        rol: 'admin',
        tenantId: tenantId
      }
    });

  } catch (error) {
    console.error('Error creando checkout:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando el pago. Por favor intenta de nuevo.'
    });
  }
});

/**
 * GET /api/subscriptions/my-subscription
 * Obtener suscripción del usuario actual
 */
router.get('/my-subscription', (req, res) => {
  try {
    // En producción, extraer userId del token JWT
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const db = loadDB();
    const subscription = db.subscriptions?.find(s => s.userId === decoded.userId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No tienes una suscripción activa'
      });
    }

    const plan = plansConfig.plans[subscription.planId];

    res.json({
      success: true,
      data: {
        ...subscription,
        plan: {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          features: plan.features,
          benefits: plan.benefits
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo suscripción:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo suscripción'
    });
  }
});

/**
 * POST /api/subscriptions/cancel
 * Cancelar suscripción al final del período
 */
router.post('/cancel', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const db = loadDB();
    const subscriptionIndex = db.subscriptions?.findIndex(s => s.userId === decoded.userId);

    if (subscriptionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Suscripción no encontrada'
      });
    }

    // Marcar para cancelar al final del período
    db.subscriptions[subscriptionIndex].cancelAtPeriodEnd = true;
    db.subscriptions[subscriptionIndex].cancelledAt = new Date().toISOString();

    saveDB(db);

    res.json({
      success: true,
      message: 'Tu suscripción se cancelará al final del período actual',
      data: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: db.subscriptions[subscriptionIndex].currentPeriodEnd
      }
    });

  } catch (error) {
    console.error('Error cancelando suscripción:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelando suscripción'
    });
  }
});

/**
 * POST /api/subscriptions/reactivate
 * Reactivar suscripción cancelada
 */
router.post('/reactivate', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const db = loadDB();
    const subscriptionIndex = db.subscriptions?.findIndex(s => s.userId === decoded.userId);

    if (subscriptionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Suscripción no encontrada'
      });
    }

    // Reactivar
    db.subscriptions[subscriptionIndex].cancelAtPeriodEnd = false;
    db.subscriptions[subscriptionIndex].cancelledAt = null;

    saveDB(db);

    res.json({
      success: true,
      message: 'Tu suscripción ha sido reactivada',
      data: {
        status: db.subscriptions[subscriptionIndex].status
      }
    });

  } catch (error) {
    console.error('Error reactivando suscripción:', error);
    res.status(500).json({
      success: false,
      message: 'Error reactivando suscripción'
    });
  }
});

/**
 * POST /api/subscriptions/change-plan
 * Cambiar de plan
 */
router.post('/change-plan', (req, res) => {
  try {
    const { newPlanId } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const newPlan = plansConfig.plans[newPlanId];
    if (!newPlan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }
    
    const db = loadDB();
    const subscriptionIndex = db.subscriptions?.findIndex(s => s.userId === decoded.userId);

    if (subscriptionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Suscripción no encontrada'
      });
    }

    const oldPlan = db.subscriptions[subscriptionIndex].planId;
    
    // Actualizar plan
    db.subscriptions[subscriptionIndex].planId = newPlanId;
    db.subscriptions[subscriptionIndex].planName = newPlan.name;
    db.subscriptions[subscriptionIndex].priceMonthly = newPlan.price;
    db.subscriptions[subscriptionIndex].updatedAt = new Date().toISOString();

    // Actualizar tenant
    const tenantIndex = db.tenants?.findIndex(t => t.id === decoded.tenantId);
    if (tenantIndex !== -1) {
      db.tenants[tenantIndex].plan = newPlanId;
      db.tenants[tenantIndex].limits = newPlan.features;
    }

    saveDB(db);

    res.json({
      success: true,
      message: `Plan cambiado de ${oldPlan} a ${newPlanId}`,
      data: {
        newPlan: newPlanId,
        newPrice: newPlan.price
      }
    });

  } catch (error) {
    console.error('Error cambiando plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error cambiando plan'
    });
  }
});

/**
 * GET /api/subscriptions/invoices
 * Obtener historial de facturas
 */
router.get('/invoices', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const db = loadDB();
    const payments = db.payments?.filter(p => p.userId === decoded.userId) || [];

    res.json({
      success: true,
      data: payments.map(p => ({
        id: p.id,
        invoiceNumber: p.invoice?.number,
        amount: p.amount / 100,
        currency: p.currency,
        status: p.status,
        description: p.description,
        pdfUrl: p.invoice?.pdfUrl,
        createdAt: p.createdAt
      }))
    });

  } catch (error) {
    console.error('Error obteniendo facturas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo facturas'
    });
  }
});

/**
 * POST /api/subscriptions/update-payment-method
 * Actualizar método de pago
 */
router.post('/update-payment-method', (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    // En producción, aquí iría la lógica de Stripe:
    // stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
    // stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId }})

    res.json({
      success: true,
      message: 'Método de pago actualizado correctamente',
      data: {
        last4: paymentMethod.last4,
        brand: paymentMethod.brand
      }
    });

  } catch (error) {
    console.error('Error actualizando método de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando método de pago'
    });
  }
});

module.exports = router;
