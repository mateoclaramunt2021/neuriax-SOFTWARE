/**
 * STRIPESERVICE - Servicio de Pagos Stripe
 * =========================================
 * Gestiona pagos, suscripciones y webhooks
 * Integración con planes de precios
 * 
 * KEYWORD: STRIPE PAGOS - Sistema de cobros integrado
 */

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe = null;

if (stripeSecretKey) {
  stripe = require('stripe')(stripeSecretKey, {
    apiVersion: '2024-04-10'
  });
} else {
  console.warn('⚠️ STRIPE_SECRET_KEY no configurada - Stripe no inicializada (modo demo)');
}

const testMode = process.env.STRIPE_TEST_MODE === 'true';

console.log(`💳 STRIPE SERVICE: Modo ${testMode ? 'TEST' : 'PRODUCCIÓN'}`);

/**
 * Crear Payment Intent para una reserva
 * @param {number} monto - Monto en centavos (ej: 5000 = $50.00)
 * @param {string} clienteId - ID del cliente
 * @param {string} citaId - ID de la cita
 * @param {string} clienteEmail - Email del cliente
 * @param {Object} metadata - Datos adicionales {nombreServicio, fecha, hora, etc}
 * @returns {Promise<{success: boolean, clientSecret: string|null, error: string|null}>}
 */
async function crearPaymentIntent(monto, clienteId, citaId, clienteEmail, metadata = {}) {
  try {
    if (monto <= 0) {
      return { success: false, clientSecret: null, error: 'Monto debe ser mayor a 0' };
    }

    if (!stripe) {
      console.warn('⚠️ Stripe no configurado - usando modo simulación');
      return {
        success: true,
        clientSecret: `mock_${Date.now()}`,
        error: null,
        intentId: `mock_intent_${Date.now()}`
      };
    }

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(monto), // Convertir a entero si es necesario
      currency: 'clp', // Pesos chilenos
      description: `Reserva ${metadata.nombreServicio || 'Servicio'}`,
      metadata: {
        clienteId,
        citaId,
        clienteEmail,
        ...metadata
      },
      receipt_email: clienteEmail,
      // Opcionales para mejorar UX:
      statement_descriptor: 'NEURIAX', // Visible en estado de cuenta
      setup_future_usage: 'on_session' // Permitir guardar método de pago
    });

    console.log(`✅ [PAYMENT INTENT] ${clienteId}: $${(monto / 100).toFixed(2)} CLP (ID: ${intent.id})`);

    return {
      success: true,
      clientSecret: intent.client_secret,
      error: null,
      intentId: intent.id
    };

  } catch (error) {
    console.error(`❌ Error creando Payment Intent:`, error.message);
    return {
      success: false,
      clientSecret: null,
      error: error.message,
      intentId: null
    };
  }
}

/**
 * Confirmar que un Payment Intent fue pagado
 * @param {string} intentId - ID del Payment Intent
 * @returns {Promise<{success: boolean, status: string, error: string|null}>}
 */
async function verificarPago(intentId) {
  try {
    if (!stripe) {
      console.warn('⚠️ Stripe no configurado');
      return { success: true, status: 'succeeded', error: null };
    }

    const intent = await stripe.paymentIntents.retrieve(intentId);

    if (intent.status === 'succeeded') {
      console.log(`✅ [PAGO CONFIRMADO] ${intentId}`);
      return { success: true, status: intent.status, error: null };
    } else if (intent.status === 'processing') {
      console.log(`⏳ [PAGO PROCESANDO] ${intentId}`);
      return { success: false, status: intent.status, error: 'Pago en procesamiento' };
    } else if (intent.status === 'requires_payment_method') {
      return { success: false, status: intent.status, error: 'Requiere método de pago' };
    } else {
      return { success: false, status: intent.status, error: `Estado: ${intent.status}` };
    }

  } catch (error) {
    console.error(`❌ Error verificando pago:`, error.message);
    return { success: false, status: null, error: error.message };
  }
}

/**
 * Crear sesión de checkout para frontend
 * @param {Array<{nombre: string, precio: number, cantidad: number}>} lineas - Items a cobrar
 * @param {string} clienteId - ID del cliente (para metadata)
 * @param {string} successUrl - URL para redireccionar si pago es exitoso
 * @param {string} cancelUrl - URL para redireccionar si pago es cancelado
 * @returns {Promise<{success: boolean, sessionId: string|null, error: string|null}>}
 */
async function crearSesionCheckout(lineas, clienteId, successUrl, cancelUrl) {
  try {
    if (!stripe) return { success: true, sessionId: `mock_${Date.now()}`, error: null };
    
    // Preparar items para Stripe
    const lineItems = lineas.map(item => ({
      price_data: {
        currency: 'clp',
        product_data: {
          name: item.nombre,
          description: item.descripcion || ''
        },
        unit_amount: Math.round(item.precio * 100) // Convertir a centavos
      },
      quantity: item.cantidad || 1
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        clienteId
      }
    });

    console.log(`✅ [CHECKOUT SESSION] ${clienteId}: ${session.id}`);

    return {
      success: true,
      sessionId: session.id,
      error: null
    };

  } catch (error) {
    console.error(`❌ Error creando sesión checkout:`, error.message);
    return {
      success: false,
      sessionId: null,
      error: error.message
    };
  }
}

/**
 * Crear cliente en Stripe
 * @param {string} nombre - Nombre del cliente
 * @param {string} email - Email del cliente
 * @param {string} telefono - Teléfono del cliente
 * @param {Object} metadata - Datos adicionales {tenantId, clientId, etc}
 * @returns {Promise<{success: boolean, stripeCustomerId: string|null, error: string|null}>}
 */
async function crearCliente(nombre, email, telefono, metadata = {}) {
  try {
    if (!stripe) return { success: true, stripeCustomerId: `mock_${Date.now()}`, error: null };
    
    const customer = await stripe.customers.create({
      name: nombre,
      email: email,
      phone: telefono,
      metadata: metadata,
      description: `Cliente ${nombre} - ${email}`
    });

    console.log(`✅ [STRIPE CUSTOMER] ${customer.id}: ${nombre}`);

    return {
      success: true,
      stripeCustomerId: customer.id,
      error: null
    };

  } catch (error) {
    console.error(`❌ Error creando cliente en Stripe:`, error.message);
    return {
      success: false,
      stripeCustomerId: null,
      error: error.message
    };
  }
}

/**
 * Actualizar cliente en Stripe
 * @param {string} stripeCustomerId - ID del cliente en Stripe
 * @param {Object} datos - Datos a actualizar {nombre, email, telefono, metadata}
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function actualizarCliente(stripeCustomerId, datos) {
  try {
    if (!stripe) return { success: true, error: null };
    
    const customer = await stripe.customers.update(stripeCustomerId, {
      name: datos.nombre,
      email: datos.email,
      phone: datos.telefono,
      metadata: datos.metadata
    });

    console.log(`✅ [CLIENTE ACTUALIZADO] ${stripeCustomerId}`);
    return { success: true, error: null };

  } catch (error) {
    console.error(`❌ Error actualizando cliente:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Crear una suscripción recurrente
 * @param {string} stripeCustomerId - ID del cliente en Stripe
 * @param {string} planPriceId - ID del precio en Stripe (ej: price_xxx)
 * @param {Object} metadata - Datos adicionales
 * @returns {Promise<{success: boolean, subscriptionId: string|null, error: string|null}>}
 */
async function crearSuscripcion(stripeCustomerId, planPriceId, metadata = {}) {
  try {
    if (!stripe) return { success: true, subscriptionId: `mock_${Date.now()}`, error: null, clientSecret: null };
    
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: planPriceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: metadata
    });

    console.log(`✅ [SUSCRIPCIÓN] ${stripeCustomerId}: ${subscription.id}`);

    return {
      success: true,
      subscriptionId: subscription.id,
      error: null,
      clientSecret: subscription.latest_invoice?.payment_intent?.client_secret
    };

  } catch (error) {
    console.error(`❌ Error creando suscripción:`, error.message);
    return {
      success: false,
      subscriptionId: null,
      error: error.message
    };
  }
}

/**
 * Cancelar una suscripción
 * @param {string} subscriptionId - ID de la suscripción
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function cancelarSuscripcion(subscriptionId) {
  try {
    if (!stripe) return { success: true, error: null };
    
    const subscription = await stripe.subscriptions.del(subscriptionId);

    console.log(`✅ [SUSCRIPCIÓN CANCELADA] ${subscriptionId}`);
    return { success: true, error: null };

  } catch (error) {
    console.error(`❌ Error cancelando suscripción:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Listar métodos de pago guardados de un cliente
 * @param {string} stripeCustomerId - ID del cliente en Stripe
 * @returns {Promise<{success: boolean, paymentMethods: Array|null, error: string|null}>}
 */
async function obtenerMetodosPago(stripeCustomerId) {
  try {
    if (!stripe) return { success: true, paymentMethods: [], error: null };
    
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card'
    });

    console.log(`✅ [MÉTODOS PAGO] ${stripeCustomerId}: ${paymentMethods.data.length} método(s)`);

    return {
      success: true,
      paymentMethods: paymentMethods.data,
      error: null
    };

  } catch (error) {
    console.error(`❌ Error obteniendo métodos de pago:`, error.message);
    return {
      success: false,
      paymentMethods: null,
      error: error.message
    };
  }
}

/**
 * Procesar reembolso de pago
 * @param {string} intentId - ID del Payment Intent a reembolsar
 * @param {number} monto - Monto a reembolsar (opcional, null = reembolsar todo)
 * @param {string} razon - Razón del reembolso
 * @returns {Promise<{success: boolean, refundId: string|null, error: string|null}>}
 */
async function procesarReembolso(intentId, monto = null, razon = 'requested_by_customer') {
  try {
    if (!stripe) return { success: true, refundId: `mock_refund_${Date.now()}`, error: null };
    
    const refund = await stripe.refunds.create({
      payment_intent: intentId,
      amount: monto ? Math.round(monto * 100) : undefined,
      reason: razon,
      metadata: {
        procesado_por: 'neuriax',
        fecha: new Date().toISOString()
      }
    });

    console.log(`✅ [REEMBOLSO] ${refund.id} - Monto: $${(refund.amount / 100).toFixed(2)} CLP`);

    return {
      success: true,
      refundId: refund.id,
      error: null
    };

  } catch (error) {
    console.error(`❌ Error procesando reembolso:`, error.message);
    return {
      success: false,
      refundId: null,
      error: error.message
    };
  }
}

module.exports = {
  crearPaymentIntent,
  verificarPago,
  crearSesionCheckout,
  crearCliente,
  actualizarCliente,
  crearSuscripcion,
  cancelarSuscripcion,
  obtenerMetodosPago,
  procesarReembolso,
  testMode
};
