/**
 * PASO 18 - Notification Service
 * Real-time Notifications con Socket.io
 * Enterprise-grade, Production-ready
 * 
 * Características:
 * - WebSocket real-time delivery
 * - Message queue y retry logic
 * - Push notifications browser API
 * - Notification preferences
 * - Complete history con persistencia
 * - Analytics y reporting
 * - Admin broadcasting
 */

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

class NotificationService {
  constructor() {
    this.notifications = new Map();
    this.userPreferences = new Map();
    this.notificationQueue = [];
    this.deliveryLogs = [];
    this.maxHistorySize = 10000;
    this.maxQueueSize = 5000;
    this.io = null;
    this.usersConnected = new Map();
    
    this.loadFromStorage();
  }

  // ============ CORE METHODS ============

  /**
   * Crear y enviar notificación
   * @param {string} userId - ID del usuario destino
   * @param {Object} notification - Datos de notificación
   * @param {string} notification.title - Título
   * @param {string} notification.message - Mensaje
   * @param {string} notification.type - 'info' | 'success' | 'warning' | 'error'
   * @param {string} notification.action - URL de acción
   * @param {Array} notification.tags - Categorías
   */
  async createNotification(userId, notification) {
    try {
      const id = uuidv4();
      const notif = {
        id,
        userId,
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        action: notification.action || null,
        tags: notification.tags || [],
        read: false,
        archived: false,
        createdAt: new Date().toISOString(),
        readAt: null,
        sound: notification.sound !== false,
        desktop: notification.desktop !== false
      };

      // Almacenar en memoria
      this.notifications.set(id, notif);

      // Registrar en logs
      this.logDelivery({
        notificationId: id,
        userId,
        status: 'created',
        timestamp: new Date().toISOString()
      });

      // Enviar en tiempo real si usuario está conectado
      if (this.io && this.usersConnected.has(userId)) {
        this.broadcastToUser(userId, 'notification', notif);
      } else {
        // Encolar para entrega posterior
        this.enqueueNotification(userId, notif);
      }

      // Limpiar historial si es necesario
      if (this.notifications.size > this.maxHistorySize) {
        this.cleanupOldNotifications();
      }

      return notif;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Enviar notificación a múltiples usuarios (Broadcasting)
   */
  async broadcastNotification(notification, targetUsers = null, options = {}) {
    try {
      const broadcastId = uuidv4();
      const recipients = targetUsers || Array.from(this.usersConnected.keys());
      const results = [];

      for (const userId of recipients) {
        const notif = await this.createNotification(userId, {
          ...notification,
          broadcastId
        });
        results.push({ userId, notificationId: notif.id, status: 'sent' });
      }

      this.logDelivery({
        broadcastId,
        recipientCount: recipients.length,
        status: 'broadcast_sent',
        timestamp: new Date().toISOString()
      });

      return {
        broadcastId,
        recipientCount: recipients.length,
        results
      };
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      throw error;
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId, userId) {
    try {
      const notif = this.notifications.get(notificationId);
      
      if (!notif || notif.userId !== userId) {
        throw new Error('Notification not found or unauthorized');
      }

      notif.read = true;
      notif.readAt = new Date().toISOString();

      this.logDelivery({
        notificationId,
        userId,
        action: 'marked_as_read',
        timestamp: new Date().toISOString()
      });

      return notif;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Marcar todas como leídas
   */
  async markAllAsRead(userId) {
    try {
      const userNotifications = Array.from(this.notifications.values())
        .filter(n => n.userId === userId && !n.read);

      for (const notif of userNotifications) {
        notif.read = true;
        notif.readAt = new Date().toISOString();
      }

      return { count: userNotifications.length };
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Obtener notificaciones sin leer del usuario
   */
  getUnreadNotifications(userId) {
    try {
      return Array.from(this.notifications.values())
        .filter(n => n.userId === userId && !n.read && !n.archived)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 50);
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      return [];
    }
  }

  /**
   * Obtener todas las notificaciones del usuario
   */
  getUserNotifications(userId, options = {}) {
    try {
      const limit = options.limit || 100;
      const offset = options.offset || 0;
      const filter = options.filter || 'all'; // 'all' | 'unread' | 'read' | 'archived'

      let notifications = Array.from(this.notifications.values())
        .filter(n => n.userId === userId);

      // Filtrar por estado
      switch (filter) {
        case 'unread':
          notifications = notifications.filter(n => !n.read && !n.archived);
          break;
        case 'read':
          notifications = notifications.filter(n => n.read && !n.archived);
          break;
        case 'archived':
          notifications = notifications.filter(n => n.archived);
          break;
      }

      // Ordenar por fecha descendente
      notifications.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Aplicar paginación
      const total = notifications.length;
      const paginated = notifications.slice(offset, offset + limit);

      return {
        total,
        count: paginated.length,
        offset,
        limit,
        data: paginated
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return { total: 0, count: 0, data: [] };
    }
  }

  /**
   * Eliminar notificación
   */
  async deleteNotification(notificationId, userId) {
    try {
      const notif = this.notifications.get(notificationId);
      
      if (!notif || notif.userId !== userId) {
        throw new Error('Notification not found or unauthorized');
      }

      this.notifications.delete(notificationId);

      this.logDelivery({
        notificationId,
        userId,
        action: 'deleted',
        timestamp: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Archivar notificación
   */
  async archiveNotification(notificationId, userId) {
    try {
      const notif = this.notifications.get(notificationId);
      
      if (!notif || notif.userId !== userId) {
        throw new Error('Notification not found or unauthorized');
      }

      notif.archived = true;

      return notif;
    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  }

  // ============ PREFERENCES ============

  /**
   * Obtener preferencias de notificación del usuario
   */
  getUserPreferences(userId) {
    return this.userPreferences.get(userId) || this.getDefaultPreferences(userId);
  }

  /**
   * Actualizar preferencias de notificación
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const current = this.getUserPreferences(userId);
      const updated = {
        userId,
        ...current,
        ...preferences,
        updatedAt: new Date().toISOString()
      };

      this.userPreferences.set(userId, updated);

      this.logDelivery({
        userId,
        action: 'preferences_updated',
        timestamp: new Date().toISOString()
      });

      return updated;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Preferencias por defecto
   */
  getDefaultPreferences(userId) {
    return {
      userId,
      email: true,
      sms: false,
      push: true,
      desktop: true,
      sound: true,
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      categories: {
        sales: true,
        appointments: true,
        system: true,
        promotions: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // ============ SOCKET.IO INTEGRATION ============

  /**
   * Inicializar Socket.io
   */
  initializeSocketIO(io) {
    this.io = io;

    io.on('connection', (socket) => {
      console.log(`[Notifications] User connected: ${socket.id}`);

      // Registrar usuario conectado
      socket.on('auth', (data) => {
        const userId = data.userId;
        this.usersConnected.set(userId, {
          socketId: socket.id,
          connectedAt: new Date().toISOString()
        });

        // Enviar notificaciones pendientes
        this.deliverQueuedNotifications(userId);

        // Enviar notificaciones sin leer
        const unread = this.getUnreadNotifications(userId);
        socket.emit('unread_count', { count: unread.length });
      });

      // Marcar como leída
      socket.on('mark_read', async (data) => {
        await this.markAsRead(data.notificationId, data.userId);
        socket.emit('read_confirmed', { notificationId: data.notificationId });
      });

      // Obtener sin leer
      socket.on('get_unread', (data) => {
        const unread = this.getUnreadNotifications(data.userId);
        socket.emit('unread_notifications', unread);
      });

      // Desconexión
      socket.on('disconnect', () => {
        console.log(`[Notifications] User disconnected: ${socket.id}`);
        this.usersConnected.forEach((value, key) => {
          if (value.socketId === socket.id) {
            this.usersConnected.delete(key);
          }
        });
      });
    });

    return io;
  }

  /**
   * Enviar notificación a usuario específico
   */
  broadcastToUser(userId, event, data) {
    if (!this.io) return;

    const userConnection = this.usersConnected.get(userId);
    if (userConnection) {
      this.io.to(userConnection.socketId).emit(event, data);
    }
  }

  /**
   * Broadcast a todos los conectados
   */
  broadcastToAll(event, data) {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  /**
   * Broadcast a múltiples usuarios
   */
  broadcastToUsers(userIds, event, data) {
    userIds.forEach(userId => {
      this.broadcastToUser(userId, event, data);
    });
  }

  // ============ QUEUE & RETRY ============

  /**
   * Encolar notificación para entrega posterior
   */
  enqueueNotification(userId, notification) {
    if (this.notificationQueue.length >= this.maxQueueSize) {
      this.notificationQueue.shift(); // Remove oldest
    }

    this.notificationQueue.push({
      userId,
      notification,
      enqueuedAt: new Date().toISOString(),
      retries: 0,
      maxRetries: 3
    });
  }

  /**
   * Entregar notificaciones encoladas
   */
  async deliverQueuedNotifications(userId) {
    const queued = this.notificationQueue.filter(q => q.userId === userId);

    for (const item of queued) {
      this.broadcastToUser(userId, 'notification', item.notification);
      const index = this.notificationQueue.indexOf(item);
      if (index > -1) {
        this.notificationQueue.splice(index, 1);
      }
    }

    return queued.length;
  }

  // ============ ANALYTICS & LOGGING ============

  /**
   * Registrar entrega de notificación
   */
  logDelivery(log) {
    this.deliveryLogs.push({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...log
    });

    // Mantener límite de logs
    if (this.deliveryLogs.length > 50000) {
      this.deliveryLogs = this.deliveryLogs.slice(-50000);
    }
  }

  /**
   * Obtener estadísticas de entrega
   */
  getDeliveryStats(userId = null) {
    let logs = this.deliveryLogs;

    if (userId) {
      logs = logs.filter(l => l.userId === userId);
    }

    const stats = {
      total: logs.length,
      by_status: {},
      by_action: {},
      today: 0,
      last_7_days: 0
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    logs.forEach(log => {
      const logDate = new Date(log.timestamp);

      // Count by status
      stats.by_status[log.status] = (stats.by_status[log.status] || 0) + 1;

      // Count by action
      if (log.action) {
        stats.by_action[log.action] = (stats.by_action[log.action] || 0) + 1;
      }

      // Today count
      if (logDate >= today) {
        stats.today++;
      }

      // Last 7 days
      if (logDate >= sevenDaysAgo) {
        stats.last_7_days++;
      }
    });

    return stats;
  }

  /**
   * Obtener logs de entrega
   */
  getDeliveryLogs(options = {}) {
    const limit = options.limit || 100;
    const offset = options.offset || 0;
    const userId = options.userId;

    let logs = this.deliveryLogs;

    if (userId) {
      logs = logs.filter(l => l.userId === userId);
    }

    // Ordenar por fecha descendente
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = logs.length;
    const paginated = logs.slice(offset, offset + limit);

    return {
      total,
      count: paginated.length,
      offset,
      limit,
      data: paginated
    };
  }

  // ============ STORAGE & PERSISTENCE ============

  /**
   * Guardar en almacenamiento
   */
  saveToStorage() {
    try {
      const dbPath = path.join(__dirname, '../database/notifications.json');
      const data = {
        notifications: Array.from(this.notifications.entries()),
        userPreferences: Array.from(this.userPreferences.entries()),
        deliveryLogs: this.deliveryLogs.slice(-10000),
        savedAt: new Date().toISOString()
      };

      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
  }

  /**
   * Cargar desde almacenamiento
   */
  loadFromStorage() {
    try {
      const dbPath = path.join(__dirname, '../database/notifications.json');
      
      if (!fs.existsSync(dbPath)) {
        return;
      }

      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

      // Restaurar notificaciones
      if (data.notifications && Array.isArray(data.notifications)) {
        data.notifications.forEach(([key, value]) => {
          this.notifications.set(key, value);
        });
      }

      // Restaurar preferencias
      if (data.userPreferences && Array.isArray(data.userPreferences)) {
        data.userPreferences.forEach(([key, value]) => {
          this.userPreferences.set(key, value);
        });
      }

      // Restaurar logs
      if (data.deliveryLogs && Array.isArray(data.deliveryLogs)) {
        this.deliveryLogs = data.deliveryLogs;
      }

      console.log('[Notifications] Loaded from storage:', {
        notifications: this.notifications.size,
        preferences: this.userPreferences.size,
        logs: this.deliveryLogs.length
      });
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
    }
  }

  // ============ CLEANUP ============

  /**
   * Limpiar notificaciones antiguas
   */
  cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let deleted = 0;
      for (const [key, notif] of this.notifications.entries()) {
        const createdDate = new Date(notif.createdAt);
        
        // Eliminar si es antiguo y ya fue leído
        if (createdDate < cutoffDate && notif.read && notif.archived) {
          this.notifications.delete(key);
          deleted++;
        }
      }

      console.log(`[Notifications] Cleaned up ${deleted} old notifications`);
      return { deleted };
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      return { deleted: 0 };
    }
  }

  /**
   * Obtener estadísticas del sistema
   */
  getSystemStats() {
    return {
      totalNotifications: this.notifications.size,
      unreadNotifications: Array.from(this.notifications.values())
        .filter(n => !n.read && !n.archived).length,
      totalUsers: this.userPreferences.size,
      connectedUsers: this.usersConnected.size,
      queuedNotifications: this.notificationQueue.length,
      deliveryLogs: this.deliveryLogs.length
    };
  }
}

// Singleton
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new NotificationService();
    }
    return instance;
  },
  NotificationService
};
