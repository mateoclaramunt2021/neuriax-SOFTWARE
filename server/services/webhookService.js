/**
 * PASO 17 - Webhook Service
 * Maneja registro, validación, dispatch y auditoría de webhooks
 * Incluye retry logic, firma HMAC, y event tracking
 */

const crypto = require('crypto');
const https = require('https');
const http = require('http');
const logger = require('../logger');

class WebhookService {
  constructor() {
    this.webhooks = [];
    this.logs = [];
    this.events = [];
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 segundos
    this.timeout = 10000; // 10 segundos
  }

  /**
   * Registrar un webhook
   * @param {Object} webhookData - {url, events, secret, active, name, description}
   * @returns {Object} Webhook registrado
   */
  registerWebhook(webhookData) {
    const webhook = {
      id: this.generateId(),
      url: webhookData.url,
      events: webhookData.events || ['*'], // * = todos los eventos
      secret: webhookData.secret || this.generateSecret(),
      name: webhookData.name || 'Webhook ' + new Date().toLocaleDateString(),
      description: webhookData.description || '',
      active: webhookData.active !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastTriggeredAt: null,
      deliveryCount: 0,
      failureCount: 0,
      headers: webhookData.headers || {},
      retryPolicy: webhookData.retryPolicy || {
        maxRetries: this.maxRetries,
        initialDelay: this.retryDelay,
        exponentialBackoff: true
      }
    };

    this.webhooks.push(webhook);
    logger.info(`Webhook registrado: ${webhook.id} -> ${webhook.url}`);
    return webhook;
  }

  /**
   * Obtener todos los webhooks
   */
  getWebhooks() {
    return this.webhooks;
  }

  /**
   * Obtener webhook por ID
   */
  getWebhook(webhookId) {
    return this.webhooks.find(w => w.id === webhookId);
  }

  /**
   * Actualizar webhook
   */
  updateWebhook(webhookId, updates) {
    const webhook = this.getWebhook(webhookId);
    if (!webhook) throw new Error('Webhook no encontrado');

    Object.assign(webhook, updates, {
      updatedAt: new Date().toISOString()
    });

    logger.info(`Webhook actualizado: ${webhookId}`);
    return webhook;
  }

  /**
   * Eliminar webhook
   */
  deleteWebhook(webhookId) {
    const index = this.webhooks.findIndex(w => w.id === webhookId);
    if (index === -1) throw new Error('Webhook no encontrado');

    this.webhooks.splice(index, 1);
    logger.info(`Webhook eliminado: ${webhookId}`);
    return true;
  }

  /**
   * Disparar evento
   * @param {string} eventName - Nombre del evento
   * @param {Object} data - Datos del evento
   * @param {string} resource - Recurso afectado (user, role, permission, etc)
   */
  async triggerEvent(eventName, data, resource = 'general') {
    const event = {
      id: this.generateId(),
      name: eventName,
      resource,
      data,
      timestamp: new Date().toISOString(),
      webhooksTriggered: 0,
      webhooksFailed: 0
    };

    this.events.push(event);

    // Obtener webhooks interesados en este evento
    const targetWebhooks = this.webhooks.filter(w => 
      w.active && (w.events.includes('*') || w.events.includes(eventName) || w.events.includes(resource))
    );

    if (targetWebhooks.length === 0) {
      logger.info(`Evento disparado: ${eventName} (sin webhooks configurados)`);
      return event;
    }

    // Disparar webhook para cada uno
    for (const webhook of targetWebhooks) {
      this.dispatchWebhook(webhook, event);
    }

    logger.info(`Evento disparado: ${eventName} (${targetWebhooks.length} webhooks)`);
    return event;
  }

  /**
   * Disparar webhook con reintentos
   */
  async dispatchWebhook(webhook, event, attempt = 1) {
    try {
      const payload = this.createPayload(webhook, event);
      const signature = this.generateSignature(payload, webhook.secret);

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'X-Webhook-Signature': signature,
          'X-Webhook-ID': webhook.id,
          'X-Webhook-Event': event.name,
          'X-Webhook-Delivery': event.id,
          'User-Agent': 'NEURIAX-Webhook/1.0',
          ...webhook.headers
        },
        timeout: this.timeout
      };

      const protocol = webhook.url.startsWith('https') ? https : http;

      return new Promise((resolve, reject) => {
        const req = protocol.request(webhook.url, options, (res) => {
          let responseData = '';

          res.on('data', chunk => {
            responseData += chunk;
          });

          res.on('end', () => {
            const log = {
              id: this.generateId(),
              webhookId: webhook.id,
              eventId: event.id,
              status: res.statusCode,
              statusText: res.statusMessage,
              attempt,
              timestamp: new Date().toISOString(),
              responseTime: Date.now(),
              headers: res.headers,
              body: responseData.substring(0, 500) // Limitar tamaño
            };

            this.logs.push(log);

            webhook.deliveryCount++;
            webhook.lastTriggeredAt = new Date().toISOString();

            if (res.statusCode >= 200 && res.statusCode < 300) {
              logger.info(`✓ Webhook entregado: ${webhook.id} -> ${event.name}`);
              resolve(log);
            } else {
              // Reintentar si está configurado
              if (attempt < webhook.retryPolicy.maxRetries) {
                const delay = webhook.retryPolicy.exponentialBackoff 
                  ? webhook.retryPolicy.initialDelay * Math.pow(2, attempt - 1)
                  : webhook.retryPolicy.initialDelay;

                logger.warn(`⚠ Webhook falló (${res.statusCode}), reintentando en ${delay}ms...`);
                setTimeout(() => {
                  this.dispatchWebhook(webhook, event, attempt + 1);
                }, delay);
              } else {
                webhook.failureCount++;
                logger.error(`✗ Webhook falló permanentemente: ${webhook.id}`);
                reject(new Error(`HTTP ${res.statusCode}`));
              }
            }
          });
        });

        req.on('error', (error) => {
          webhook.failureCount++;
          logger.error(`✗ Error webhook: ${webhook.id} - ${error.message}`);
          reject(error);
        });

        req.on('timeout', () => {
          webhook.failureCount++;
          req.destroy();
          logger.error(`✗ Timeout webhook: ${webhook.id}`);
          reject(new Error('Timeout'));
        });

        req.write(payload);
        req.end();
      });
    } catch (error) {
      logger.error(`Error disparando webhook: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear payload del webhook
   */
  createPayload(webhook, event) {
    const payload = {
      event: event.name,
      resource: event.resource,
      id: event.id,
      timestamp: event.timestamp,
      data: event.data,
      webhookId: webhook.id
    };

    return JSON.stringify(payload);
  }

  /**
   * Generar firma HMAC SHA256
   */
  generateSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verificar firma de webhook entrante
   */
  verifySignature(payload, signature, secret) {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Obtener logs de webhooks
   */
  getWebhookLogs(webhookId = null, limit = 100) {
    let logs = this.logs;

    if (webhookId) {
      logs = logs.filter(l => l.webhookId === webhookId);
    }

    return logs.slice(-limit).reverse();
  }

  /**
   * Obtener estadísticas de webhook
   */
  getWebhookStats(webhookId) {
    const webhook = this.getWebhook(webhookId);
    if (!webhook) throw new Error('Webhook no encontrado');

    const logs = this.logs.filter(l => l.webhookId === webhookId);
    const successLogs = logs.filter(l => l.status >= 200 && l.status < 300);
    const failedLogs = logs.filter(l => l.status >= 400);

    return {
      webhookId,
      totalDeliveries: webhook.deliveryCount,
      totalFailures: webhook.failureCount,
      successRate: webhook.deliveryCount > 0 
        ? ((successLogs.length / logs.length) * 100).toFixed(2) + '%'
        : 'N/A',
      lastTriggeredAt: webhook.lastTriggeredAt,
      recentLogs: logs.slice(-10),
      events: [...new Set(logs.map(l => l.eventId))].length
    };
  }

  /**
   * Probar webhook (simular evento)
   */
  async testWebhook(webhookId, eventName = 'test.event') {
    const webhook = this.getWebhook(webhookId);
    if (!webhook) throw new Error('Webhook no encontrado');

    const testEvent = {
      id: this.generateId(),
      name: eventName,
      resource: 'test',
      data: {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Este es un evento de prueba'
      },
      timestamp: new Date().toISOString(),
      webhooksTriggered: 1,
      webhooksFailed: 0
    };

    return this.dispatchWebhook(webhook, testEvent);
  }

  /**
   * Obtener eventos registrados
   */
  getEvents(limit = 100) {
    return this.events.slice(-limit).reverse();
  }

  /**
   * Generar ID único
   */
  generateId() {
    return `whk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generar secreto seguro
   */
  generateSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Exportar datos para persistencia
   */
  export() {
    return {
      webhooks: this.webhooks,
      logs: this.logs,
      events: this.events
    };
  }

  /**
   * Importar datos desde persistencia
   */
  import(data) {
    if (data.webhooks) this.webhooks = data.webhooks;
    if (data.logs) this.logs = data.logs;
    if (data.events) this.events = data.events;
  }

  /**
   * Limpiar logs antiguos (más de 30 días)
   */
  cleanupOldLogs(daysOld = 30) {
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const before = this.logs.length;

    this.logs = this.logs.filter(log => 
      new Date(log.timestamp).getTime() > cutoff
    );

    const removed = before - this.logs.length;
    logger.info(`Limpiados ${removed} logs de webhook antiguos`);
    return removed;
  }
}

// Singleton
const webhookService = new WebhookService();

module.exports = {
  webhookService,
  WebhookService
};
