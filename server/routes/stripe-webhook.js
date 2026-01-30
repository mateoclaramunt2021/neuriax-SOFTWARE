/**
 * STRIPE WEBHOOK HANDLER - Enterprise Edition
 * =============================================
 * Maneja eventos de Stripe automáticamente
 * Payment intents, suscripciones, refunds, etc.
 * 
 * SEGURIDAD: Verificación de firma Stripe incluida
 * IDEMPOTENCIA: Previene duplicaciones
 * LOGGING: Registro completo de eventos
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10'
});

const dbService = require('../database/dbService');
const twilioService = require('../services/twilioService');
const emailService = require('../services/emailService');
const logger = require('../logger');

// Almacenar eventos procesados para prevenir duplicados (key = idempotency)
const processedEvents = new Map();
const EVENT_EXPIRY = 3600000; // 1 hora

/**
 * Middleware: Verificar firma Stripe
 * IMPORTANTE: Este endpoint NO usa express.json() middleware
 * Necesita body raw para verificar la firma
 */
function verifyStripeSignature(req, res, next) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    logger.error('❌ Webhook: Signature o Secret no encontrados');
    return res.status(401).json({ error: 'Webhook signature missing' });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );

    // Verificar si ya fue procesado
    if (processedEvents.has(event.id)) {
      logger.warn(`⚠️ Webhook: Evento duplicado ${event.id}`);
      return res.json({ received: true, note: 'Already processed' });
    }

    req.event = event;
    next();
  } catch (error) {
    logger.error(`❌ Webhook: Error verificando firma - ${error.message}`);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
}

/**
 * Marcar evento como procesado
 */
function markEventProcessed(eventId) {
  processedEvents.set(eventId, Date.now());

  // Limpiar eventos viejos
  for (const [id, timestamp] of processedEvents.entries()) {
    if (Date.now() - timestamp > EVENT_EXPIRY) {
      processedEvents.delete(id);
    }
  }
}

/**
 * ============================================================
 * MANEJADORES DE EVENTOS STRIPE
 * ============================================================
 */

/**
 * payment_intent.succeeded
 * Cuando un pago se completa exitosamente
 */
async function handlePaymentIntentSucceeded(event) {
  const paymentIntent = event.data.object;
  const { citaId, clienteId } = paymentIntent.metadata;

  logger.info(`✅ [WEBHOOK] Payment Intent exitoso: ${paymentIntent.id}`);

  try {
    if (!citaId) {
      logger.warn(`⚠️ [WEBHOOK] Payment sin citaId asociada: ${paymentIntent.id}`);
      return;
    }

    // 1. Actualizar cita en BD
    const citas = dbService.readJSON('citas.json') || {};
    const cita = citas[citaId];

    if (cita) {
      cita.pagado = true;
      cita.stripeStatus = 'succeeded';
      cita.stripeIntentId = paymentIntent.id;
      cita.confirmado = true;
      cita.fechaPago = new Date().toISOString();
      cita.procesadoPorWebhook = true;
      dbService.writeJSON('citas.json', citas);

      logger.info(`✅ [WEBHOOK] Cita actualizada: ${citaId} - Pagado`);

      // 2. Enviar SMS de confirmación
      const clientes = dbService.readJSON('clientes.json') || {};
      const cliente = Object.values(clientes).find(c => c.id === clienteId);

      if (cliente && cliente.telefono) {
        try {
          await twilioService.confirmacionReserva(
            cliente.nombre,
            cliente.telefono,
            'Servicio',
            cita.fecha,
            cita.hora,
            paymentIntent.amount / 100
          );
          logger.info(`✅ [WEBHOOK] SMS enviado: ${cliente.telefono}`);
        } catch (err) {
          logger.error(`❌ [WEBHOOK] Error enviando SMS: ${err.message}`);
        }
      }

      // 3. Enviar email de confirmación
      if (cliente && cliente.email) {
        try {
          await emailService.enviarConfirmacionPago(
            cliente.email,
            cliente.nombre,
            cita,
            paymentIntent.amount / 100
          );
          logger.info(`✅ [WEBHOOK] Email enviado: ${cliente.email}`);
        } catch (err) {
          logger.error(`❌ [WEBHOOK] Error enviando email: ${err.message}`);
        }
      }
    } else {
      logger.warn(`⚠️ [WEBHOOK] Cita no encontrada: ${citaId}`);
    }
  } catch (error) {
    logger.error(`❌ [WEBHOOK] Error en payment_intent.succeeded: ${error.message}`);
    throw error;
  }
}

/**
 * payment_intent.payment_failed
 * Cuando un pago falla
 */
async function handlePaymentIntentFailed(event) {
  const paymentIntent = event.data.object;
  const { citaId, clienteId } = paymentIntent.metadata;

  logger.warn(`❌ [WEBHOOK] Payment Intent FALLIDO: ${paymentIntent.id}`);

  try {
    if (!citaId) return;

    // 1. Actualizar cita
    const citas = dbService.readJSON('citas.json') || {};
    const cita = citas[citaId];

    if (cita) {
      cita.pagado = false;
      cita.stripeStatus = 'failed';
      cita.stripeIntentId = paymentIntent.id;
      cita.procesadoPorWebhook = true;
      dbService.writeJSON('citas.json', citas);

      // 2. Notificar al cliente
      const clientes = dbService.readJSON('clientes.json') || {};
      const cliente = Object.values(clientes).find(c => c.id === clienteId);

      if (cliente && cliente.email) {
        try {
          await emailService.enviarFalloPago(
            cliente.email,
            cliente.nombre,
            paymentIntent.last_payment_error?.message || 'Intenta de nuevo con otra tarjeta'
          );
          logger.info(`✅ [WEBHOOK] Email fallo enviado: ${cliente.email}`);
        } catch (err) {
          logger.error(`❌ [WEBHOOK] Error enviando email de fallo: ${err.message}`);
        }
      }

      if (cliente && cliente.telefono) {
        try {
          await twilioService.notificarFalloPago(
            cliente.nombre,
            cliente.telefono,
            cita.fecha,
            cita.hora
          );
        } catch (err) {
          logger.error(`❌ [WEBHOOK] Error enviando SMS fallo: ${err.message}`);
        }
      }
    }
  } catch (error) {
    logger.error(`❌ [WEBHOOK] Error en payment_intent.payment_failed: ${error.message}`);
  }
}

/**
 * payment_intent.amount_capturable_updated
 * Cuando se requiere acción adicional (3D Secure, etc)
 */
async function handlePaymentIntentRequiresAction(event) {
  const paymentIntent = event.data.object;
  logger.warn(`⚠️ [WEBHOOK] Payment requiere acción adicional: ${paymentIntent.id}`);

  // Notificar al usuario en el frontend a través de polling
  // o guardar estado en BD
  if (paymentIntent.status === 'requires_action') {
    logger.info(`📋 [WEBHOOK] 3D Secure requerido para: ${paymentIntent.id}`);
  }
}

/**
 * customer.subscription.created
 * Cuando se crea una suscripción exitosa
 */
async function handleSubscriptionCreated(event) {
  const subscription = event.data.object;
  logger.info(`✅ [WEBHOOK] Suscripción creada: ${subscription.id}`);

  try {
    // Obtener cliente de Stripe para obtener email
    const customer = subscription.customer;
    
    // Guardar suscripción en BD
    const subscriptions = dbService.readJSON('subscriptions.json') || {};
    subscriptions[subscription.id] = {
      stripeSubscriptionId: subscription.id,
      customerId: customer,
      planId: subscription.items.data[0]?.price?.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      metadata: subscription.metadata
    };
    dbService.writeJSON('subscriptions.json', subscriptions);

    logger.info(`✅ [WEBHOOK] Suscripción guardada en BD: ${subscription.id}`);
  } catch (error) {
    logger.error(`❌ [WEBHOOK] Error en customer.subscription.created: ${error.message}`);
  }
}

/**
 * customer.subscription.updated
 * Cuando se actualiza una suscripción
 */
async function handleSubscriptionUpdated(event) {
  const subscription = event.data.object;
  logger.info(`✅ [WEBHOOK] Suscripción actualizada: ${subscription.id}`);

  try {
    const subscriptions = dbService.readJSON('subscriptions.json') || {};
    subscriptions[subscription.id] = {
      ...subscriptions[subscription.id],
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };
    dbService.writeJSON('subscriptions.json', subscriptions);
  } catch (error) {
    logger.error(`❌ [WEBHOOK] Error en customer.subscription.updated: ${error.message}`);
  }
}

/**
 * customer.subscription.deleted
 * Cuando se cancela una suscripción
 */
async function handleSubscriptionDeleted(event) {
  const subscription = event.data.object;
  logger.warn(`❌ [WEBHOOK] Suscripción cancelada: ${subscription.id}`);

  try {
    const subscriptions = dbService.readJSON('subscriptions.json') || {};
    if (subscriptions[subscription.id]) {
      subscriptions[subscription.id].status = 'canceled';
      subscriptions[subscription.id].canceledAt = new Date().toISOString();
      dbService.writeJSON('subscriptions.json', subscriptions);
    }
  } catch (error) {
    logger.error(`❌ [WEBHOOK] Error en customer.subscription.deleted: ${error.message}`);
  }
}

/**
 * charge.refunded
 * Cuando se procesa un reembolso
 */
async function handleChargeRefunded(event) {
  const charge = event.data.object;
  logger.info(`💰 [WEBHOOK] Reembolso procesado: ${charge.id}`);

  try {
    // Guardar registro de reembolso
    const refunds = dbService.readJSON('refunds.json') || {};
    refunds[charge.id] = {
      chargeId: charge.id,
      amount: charge.amount / 100,
      currency: charge.currency,
      reason: charge.refunded ? 'Refund processed' : 'Partial refund',
      createdAt: new Date().toISOString()
    };
    dbService.writeJSON('refunds.json', refunds);
  } catch (error) {
    logger.error(`❌ [WEBHOOK] Error en charge.refunded: ${error.message}`);
  }
}

/**
 * ============================================================
 * ENRUTADOR PRINCIPAL
 * ============================================================
 */

// POST /api/stripe/webhook
// IMPORTANTE: Este endpoint NO debe usar express.json() middleware
router.post('/', express.raw({ type: 'application/json' }), verifyStripeSignature, async (req, res) => {
  const event = req.event;

  try {
    logger.info(`📨 [WEBHOOK] Evento recibido: ${event.type} (${event.id})`);

    // Enrutar según tipo de evento
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event);
        break;

      case 'payment_intent.requires_action':
        await handlePaymentIntentRequiresAction(event);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event);
        break;

      default:
        logger.debug(`ℹ️ [WEBHOOK] Evento ignorado: ${event.type}`);
    }

    // Marcar como procesado
    markEventProcessed(event.id);

    // Responder a Stripe
    res.json({
      received: true,
      eventId: event.id,
      type: event.type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`❌ [WEBHOOK] Error procesando evento: ${error.message}`, error);
    
    // Responder con error pero NO retornar 5xx (Stripe reintentará)
    res.status(500).json({
      received: false,
      error: error.message,
      eventId: event.id
    });
  }
});

// GET /api/stripe/webhook/status
// Para verificar que el webhook está funcionando
router.get('/status', (req, res) => {
  res.json({
    status: 'active',
    eventsProcessed: processedEvents.size,
    mode: process.env.STRIPE_TEST_MODE === 'true' ? 'TEST' : 'PRODUCTION',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
