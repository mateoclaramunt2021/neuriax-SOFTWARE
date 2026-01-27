/**
 * RUTAS STRIPE - Endpoints para pagos
 * ===================================
 * Crear payment intents, sesiones checkout y gestión de pagos
 * 
 * KEYWORD: RUTAS PAGOS - Endpoints de integración Stripe
 */

const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');
const twilioService = require('../services/twilioService');
const dbService = require('../database/dbService');
const auth = require('../middleware/auth');

/**
 * POST /api/stripe/payment-intent
 * Crear un Payment Intent para una cita
 */
router.post('/payment-intent', auth.verificarToken, async (req, res) => {
  try {
    const { citaId, monto, servicioNombre } = req.body;
    const usuarioId = req.usuario.id;

    if (!citaId || !monto || monto <= 0) {
      return res.status(400).json({
        error: 'Datos inválidos: citaId y monto requeridos'
      });
    }

    // Obtener datos de la cita
    const citas = dbService.readJSON('citas.json') || {};
    const cita = citas[citaId];
    
    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    // Obtener datos del cliente
    const clientes = dbService.readJSON('clientes.json') || {};
    const cliente = Object.values(clientes).find(c => c.id === cita.clienteId);
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Crear Payment Intent en Stripe
    const resultado = await stripeService.crearPaymentIntent(
      monto * 100, // Convertir a centavos
      cita.clienteId,
      citaId,
      cliente.email,
      {
        nombreServicio: servicioNombre || 'Servicio',
        fecha: cita.fecha,
        hora: cita.hora,
        employeeId: cita.employeeId
      }
    );

    if (!resultado.success) {
      return res.status(400).json({
        error: resultado.error
      });
    }

    // Guardar referencia en cita
    cita.stripeIntentId = resultado.intentId;
    cita.stripeStatus = 'pending';
    cita.montoCobrado = monto;
    dbService.writeJSON('citas.json', citas);

    res.json({
      success: true,
      clientSecret: resultado.clientSecret,
      intentId: resultado.intentId,
      monto: monto,
      moneda: 'CLP'
    });

  } catch (error) {
    console.error('[PAYMENT INTENT] Error:', error.message);
    res.status(500).json({
      error: 'Error creando payment intent',
      details: error.message
    });
  }
});

/**
 * POST /api/stripe/verify-payment
 * Verificar que el pago fue procesado
 */
router.post('/verify-payment', auth.verificarToken, async (req, res) => {
  try {
    const { intentId, citaId } = req.body;

    if (!intentId || !citaId) {
      return res.status(400).json({
        error: 'Datos inválidos: intentId y citaId requeridos'
      });
    }

    // Verificar pago en Stripe
    const resultado = await stripeService.verificarPago(intentId);

    if (resultado.success && resultado.status === 'succeeded') {
      // Actualizar cita
      const citas = dbService.readJSON('citas.json') || {};
      const cita = citas[citaId];
      
      if (cita) {
        cita.pagado = true;
        cita.stripeStatus = 'completed';
        cita.confirmado = true;
        cita.fechaPago = new Date().toISOString();
        dbService.writeJSON('citas.json', citas);

        // Enviar SMS de confirmación
        const clientes = dbService.readJSON('clientes.json') || {};
        const cliente = Object.values(clientes).find(c => c.id === cita.clienteId);
        
        if (cliente && cliente.telefono) {
          await twilioService.confirmacionReserva(
            cliente.nombre,
            cliente.telefono,
            'Servicio',
            cita.fecha,
            cita.hora,
            cita.montoCobrado || 0
          );
        }

        console.log(`✅ Cita ${citaId} pagada y confirmada`);
      }

      res.json({
        success: true,
        message: 'Pago confirmado',
        status: resultado.status
      });

    } else {
      res.status(400).json({
        success: false,
        error: resultado.error || 'Pago no procesado',
        status: resultado.status
      });
    }

  } catch (error) {
    console.error('[VERIFY PAYMENT] Error:', error.message);
    res.status(500).json({
      error: 'Error verificando pago',
      details: error.message
    });
  }
});

/**
 * POST /api/stripe/refund
 * Procesar reembolso de un pago
 * (Requiere rol admin)
 */
router.post('/refund', auth.verificarToken, auth.verificarAdmin, async (req, res) => {
  try {
    const { intentId, citaId, monto, razon } = req.body;

    if (!intentId || !citaId) {
      return res.status(400).json({
        error: 'Datos inválidos: intentId y citaId requeridos'
      });
    }

    // Procesar reembolso
    const resultado = await stripeService.procesarReembolso(
      intentId,
      monto || null,
      razon || 'requested_by_customer'
    );

    if (!resultado.success) {
      return res.status(400).json({
        error: resultado.error
      });
    }

    // Actualizar cita
    const citas = dbService.readJSON('citas.json') || {};
    const cita = citas[citaId];
    
    if (cita) {
      cita.reembolsado = true;
      cita.refundId = resultado.refundId;
      cita.montoReembolso = monto || cita.montoCobrado;
      cita.fechaReembolso = new Date().toISOString();
      dbService.writeJSON('citas.json', citas);

      // Notificar cliente
      const clientes = dbService.readJSON('clientes.json') || {};
      const cliente = Object.values(clientes).find(c => c.id === cita.clienteId);
      
      if (cliente && cliente.telefono) {
        await twilioService.sendSMS(
          cliente.telefono,
          `✅ Reembolso procesado.\n\nMonto: $${(monto || cita.montoCobrado).toFixed(0)} CLP\n\nVolverá en 3-5 días bancarios.`
        );
      }
    }

    res.json({
      success: true,
      refundId: resultado.refundId,
      message: 'Reembolso procesado exitosamente'
    });

  } catch (error) {
    console.error('[REFUND] Error:', error.message);
    res.status(500).json({
      error: 'Error procesando reembolso',
      details: error.message
    });
  }
});

/**
 * GET /api/stripe/payment-methods
 * Obtener métodos de pago guardados del cliente
 */
router.get('/payment-methods', auth.verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    // Obtener cliente asociado al usuario
    const clientes = dbService.readJSON('clientes.json') || {};
    const cliente = Object.values(clientes).find(c => c.usuarioId === usuarioId);

    if (!cliente || !cliente.stripeCustomerId) {
      return res.json({
        success: true,
        paymentMethods: []
      });
    }

    // Obtener métodos de pago de Stripe
    const resultado = await stripeService.obtenerMetodosPago(cliente.stripeCustomerId);

    if (!resultado.success) {
      return res.status(400).json({
        error: resultado.error
      });
    }

    // Formatear respuesta
    const metodos = resultado.paymentMethods.map(pm => ({
      id: pm.id,
      tipo: pm.card.brand,
      ultimos4: pm.card.last4,
      vencimiento: `${pm.card.exp_month}/${pm.card.exp_year}`
    }));

    res.json({
      success: true,
      paymentMethods: metodos
    });

  } catch (error) {
    console.error('[PAYMENT METHODS] Error:', error.message);
    res.status(500).json({
      error: 'Error obteniendo métodos de pago',
      details: error.message
    });
  }
});

module.exports = router;
