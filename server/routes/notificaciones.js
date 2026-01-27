/**
 * PASO 33: Notificaciones Routes - API REST para sistema de notificaciones
 */

const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const logger = require('../logger');

// Variables globales para simular servicios
let notificationHistory = [];
let userPreferences = {};

/**
 * GET /api/notificaciones - Obtiene todas las notificaciones
 */
router.get('/', verificarToken, (req, res) => {
  try {
    const { type, status, limit = 50, skip = 0 } = req.query;
    const userId = req.user.id;

    let filtered = notificationHistory.filter(n => n.userId === userId);

    if (type) filtered = filtered.filter(n => n.type === type);
    if (status) filtered = filtered.filter(n => n.status === status);

    const total = filtered.length;
    const items = filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(skip, skip + limit);

    res.json({
      success: true,
      data: items,
      pagination: { total, limit: parseInt(limit), skip: parseInt(skip) }
    });
  } catch (error) {
    logger.error('Error en GET /notificaciones:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/notificaciones/historial - Obtiene historial
 */
router.get('/historial', verificarToken, (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    const userId = req.user.id;

    let filtered = notificationHistory.filter(n => n.userId === userId);

    if (startDate) {
      filtered = filtered.filter(n => new Date(n.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(n => new Date(n.timestamp) <= new Date(endDate));
    }
    if (category) {
      filtered = filtered.filter(n => n.category === category);
    }

    const grouped = filtered.reduce((acc, notif) => {
      const date = new Date(notif.timestamp).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(notif);
      return acc;
    }, {});

    res.json({
      success: true,
      data: grouped
    });
  } catch (error) {
    logger.error('Error en GET /historial:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/notificaciones/estadisticas - Obtiene estadísticas
 */
router.get('/estadisticas', verificarToken, (req, res) => {
  try {
    const userId = req.user.id;
    const userNotifications = notificationHistory.filter(n => n.userId === userId);

    const stats = {
      total: userNotifications.length,
      sent: userNotifications.filter(n => n.status === 'sent').length,
      failed: userNotifications.filter(n => n.status === 'failed').length,
      pending: userNotifications.filter(n => n.status === 'pending').length,
      byType: {
        email: userNotifications.filter(n => n.type === 'email').length,
        sms: userNotifications.filter(n => n.type === 'sms').length,
        whatsapp: userNotifications.filter(n => n.type === 'whatsapp').length,
        push: userNotifications.filter(n => n.type === 'push').length,
        inapp: userNotifications.filter(n => n.type === 'inapp').length
      },
      byCategory: {},
      lastWeek: userNotifications.filter(n => {
        const date = new Date(n.timestamp);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date > weekAgo;
      }).length
    };

    // Agrupar por categoría
    userNotifications.forEach(n => {
      if (!stats.byCategory[n.category]) stats.byCategory[n.category] = 0;
      stats.byCategory[n.category]++;
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error en GET /estadisticas:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/notificaciones/preferencias - Obtiene preferencias del usuario
 */
router.get('/preferencias', verificarToken, (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = userPreferences[userId] || getDefaultPreferences();

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('Error en GET /preferencias:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/notificaciones/preferencias - Actualiza preferencias
 */
router.put('/preferencias', verificarToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { email, sms, whatsapp, push, quiet_hours } = req.body;

    userPreferences[userId] = {
      ...userPreferences[userId] || getDefaultPreferences(),
      ...(email && { email }),
      ...(sms && { sms }),
      ...(whatsapp && { whatsapp }),
      ...(push && { push }),
      ...(quiet_hours && { quiet_hours })
    };

    logger.info(`Preferencias actualizadas para usuario ${userId}`);

    res.json({
      success: true,
      message: 'Preferencias actualizadas',
      data: userPreferences[userId]
    });
  } catch (error) {
    logger.error('Error en PUT /preferencias:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/notificaciones/send-email - Envía email
 */
router.post('/send-email', verificarToken, (req, res) => {
  try {
    const { to, subject, template, data, cc, bcc } = req.body;
    const userId = req.user.id;

    if (!to || !subject) {
      return res.status(400).json({ success: false, message: 'Falta to o subject' });
    }

    const notification = {
      id: `email_${Date.now()}`,
      userId,
      type: 'email',
      recipient: to,
      subject,
      template,
      data,
      cc,
      bcc,
      status: 'sent',
      timestamp: new Date().toISOString(),
      category: 'Email'
    };

    notificationHistory.push(notification);

    logger.info(`Email enviado a ${to}`);

    res.json({
      success: true,
      message: 'Email enviado',
      data: notification
    });
  } catch (error) {
    logger.error('Error en POST /send-email:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/notificaciones/send-sms - Envía SMS
 */
router.post('/send-sms', verificarToken, (req, res) => {
  try {
    const { to, message, priority } = req.body;
    const userId = req.user.id;

    if (!to || !message) {
      return res.status(400).json({ success: false, message: 'Falta to o message' });
    }

    const notification = {
      id: `sms_${Date.now()}`,
      userId,
      type: 'sms',
      recipient: to,
      message,
      priority: priority || 'normal',
      status: 'sent',
      timestamp: new Date().toISOString(),
      category: 'SMS'
    };

    notificationHistory.push(notification);

    logger.info(`SMS enviado a ${to}`);

    res.json({
      success: true,
      message: 'SMS enviado',
      data: notification
    });
  } catch (error) {
    logger.error('Error en POST /send-sms:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/notificaciones/send-whatsapp - Envía WhatsApp
 */
router.post('/send-whatsapp', verificarToken, (req, res) => {
  try {
    const { to, message, mediaUrl, priority } = req.body;
    const userId = req.user.id;

    if (!to || !message) {
      return res.status(400).json({ success: false, message: 'Falta to o message' });
    }

    const notification = {
      id: `whatsapp_${Date.now()}`,
      userId,
      type: 'whatsapp',
      recipient: to,
      message,
      mediaUrl,
      priority: priority || 'normal',
      status: 'sent',
      timestamp: new Date().toISOString(),
      category: 'WhatsApp'
    };

    notificationHistory.push(notification);

    logger.info(`WhatsApp enviado a ${to}`);

    res.json({
      success: true,
      message: 'WhatsApp enviado',
      data: notification
    });
  } catch (error) {
    logger.error('Error en POST /send-whatsapp:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/notificaciones/marcar-leida - Marca notificación como leída
 */
router.post('/:id/marcar-leida', verificarToken, (req, res) => {
  try {
    const notification = notificationHistory.find(n => n.id === req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
    }

    notification.read = true;
    notification.readAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Notificación marcada como leída',
      data: notification
    });
  } catch (error) {
    logger.error('Error en POST /marcar-leida:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/notificaciones/:id - Elimina notificación
 */
router.delete('/:id', verificarToken, (req, res) => {
  try {
    const index = notificationHistory.findIndex(n => n.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
    }

    const deleted = notificationHistory.splice(index, 1);

    res.json({
      success: true,
      message: 'Notificación eliminada',
      data: deleted[0]
    });
  } catch (error) {
    logger.error('Error en DELETE /:id:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/notificaciones - Limpia historial
 */
router.delete('/', verificarToken, (req, res) => {
  try {
    const { daysOld } = req.query;
    const userId = req.user.id;

    if (daysOld) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const beforeCount = notificationHistory.length;
      notificationHistory = notificationHistory.filter(n => 
        n.userId !== userId || new Date(n.timestamp) > cutoffDate
      );
      
      const deletedCount = beforeCount - notificationHistory.length;
      
      res.json({
        success: true,
        message: `${deletedCount} notificaciones eliminadas`,
        deletedCount
      });
    } else {
      notificationHistory = notificationHistory.filter(n => n.userId !== userId);
      
      res.json({
        success: true,
        message: 'Historial limpiado'
      });
    }
  } catch (error) {
    logger.error('Error en DELETE /:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Obtiene preferencias por defecto
 */
function getDefaultPreferences() {
  return {
    email: {
      enabled: true,
      receiveInvoices: true,
      receiveReminders: true,
      receiveAlerts: true,
      receiveReports: true
    },
    sms: {
      enabled: false,
      receiveReminders: true,
      receiveAlerts: true,
      receiveUrgent: true
    },
    whatsapp: {
      enabled: false,
      receiveReminders: false,
      receiveAlerts: true,
      receiveUrgent: true
    },
    push: {
      enabled: true,
      receiveAll: true,
      soundEnabled: true
    },
    quiet_hours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    }
  };
}

module.exports = router;
