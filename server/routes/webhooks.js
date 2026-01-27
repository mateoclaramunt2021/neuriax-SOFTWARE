/**
 * PASO 17 - Webhooks Routes
 * Endpoints para gestionar webhooks
 */

const express = require('express');
const router = express.Router();
const { webhookService } = require('../services/webhookService');
const logger = require('../logger');

// Middleware para verificar token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token no proporcionado' });
  }
  next();
}

/**
 * GET /api/webhooks - Listar todos los webhooks
 */
router.get('/', verifyToken, (req, res) => {
  try {
    const webhooks = webhookService.getWebhooks();
    res.json({
      success: true,
      count: webhooks.length,
      data: webhooks.map(w => ({
        id: w.id,
        name: w.name,
        url: w.url,
        events: w.events,
        active: w.active,
        createdAt: w.createdAt,
        lastTriggeredAt: w.lastTriggeredAt,
        deliveryCount: w.deliveryCount,
        failureCount: w.failureCount
      }))
    });
  } catch (error) {
    logger.error('Error listando webhooks: ' + error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/webhooks - Crear nuevo webhook
 */
router.post('/', verifyToken, (req, res) => {
  try {
    const { url, events, secret, name, description, headers } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, message: 'URL requerida' });
    }

    const webhook = webhookService.registerWebhook({
      url,
      events: events || ['*'],
      secret,
      name,
      description,
      headers: headers || {}
    });

    res.status(201).json({
      success: true,
      message: 'Webhook creado',
      data: webhook
    });

    logger.info(`Webhook creado por usuario: ${webhook.id}`);
  } catch (error) {
    logger.error('Error creando webhook: ' + error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/webhooks/:webhookId - Obtener webhook específico
 */
router.get('/:webhookId', verifyToken, (req, res) => {
  try {
    const webhook = webhookService.getWebhook(req.params.webhookId);
    if (!webhook) {
      return res.status(404).json({ success: false, message: 'Webhook no encontrado' });
    }

    res.json({
      success: true,
      data: webhook
    });
  } catch (error) {
    logger.error('Error obteniendo webhook: ' + error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/webhooks/:webhookId - Actualizar webhook
 */
router.put('/:webhookId', verifyToken, (req, res) => {
  try {
    const webhook = webhookService.updateWebhook(req.params.webhookId, req.body);

    res.json({
      success: true,
      message: 'Webhook actualizado',
      data: webhook
    });

    logger.info(`Webhook actualizado: ${req.params.webhookId}`);
  } catch (error) {
    logger.error('Error actualizando webhook: ' + error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/webhooks/:webhookId - Eliminar webhook
 */
router.delete('/:webhookId', verifyToken, (req, res) => {
  try {
    webhookService.deleteWebhook(req.params.webhookId);

    res.json({
      success: true,
      message: 'Webhook eliminado'
    });

    logger.info(`Webhook eliminado: ${req.params.webhookId}`);
  } catch (error) {
    logger.error('Error eliminando webhook: ' + error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/webhooks/:webhookId/logs - Obtener logs del webhook
 */
router.get('/:webhookId/logs', verifyToken, (req, res) => {
  try {
    const logs = webhookService.getWebhookLogs(req.params.webhookId, 100);

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    logger.error('Error obteniendo logs: ' + error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/webhooks/:webhookId/stats - Estadísticas del webhook
 */
router.get('/:webhookId/stats', verifyToken, (req, res) => {
  try {
    const stats = webhookService.getWebhookStats(req.params.webhookId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error obteniendo estadísticas: ' + error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/webhooks/:webhookId/test - Probar webhook
 */
router.post('/:webhookId/test', verifyToken, async (req, res) => {
  try {
    const result = await webhookService.testWebhook(req.params.webhookId, req.body.eventName || 'test.event');

    res.json({
      success: true,
      message: 'Test enviado',
      data: result
    });

    logger.info(`Webhook testeado: ${req.params.webhookId}`);
  } catch (error) {
    logger.error('Error testeando webhook: ' + error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/webhooks/events/list - Listar eventos disparados
 */
router.get('/events/list', verifyToken, (req, res) => {
  try {
    const events = webhookService.getEvents(50);

    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    logger.error('Error listando eventos: ' + error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
