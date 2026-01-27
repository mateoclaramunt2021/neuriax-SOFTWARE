/* ========================================
   NEURIAX SALON MANAGER v2.0
   Error Handling & Logging Premium
   PASO 23 - Sistema Completo de Errores
   ======================================== */

// ============================================
// LOG LEVELS & CONFIGURATION
// ============================================

const LOG_LEVELS = {
  DEBUG: { level: 0, name: 'DEBUG', color: '#7c3aed', emoji: '🔍' },
  INFO: { level: 1, name: 'INFO', color: '#3b82f6', emoji: 'ℹ️' },
  WARN: { level: 2, name: 'WARN', color: '#f59e0b', emoji: '⚠️' },
  ERROR: { level: 3, name: 'ERROR', color: '#ef4444', emoji: '❌' },
  CRITICAL: { level: 4, name: 'CRITICAL', color: '#7f1d1d', emoji: '🚨' }
};

const CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  minLevel: process.env.NODE_ENV === 'development' ? LOG_LEVELS.DEBUG.level : LOG_LEVELS.INFO.level,
  maxLogs: 1000,
  enableConsole: true,
  enableStorage: true,
  enableRemote: false, // Para producción
  remoteEndpoint: '/api/logs',
  persistLogs: true,
  storageKey: 'app_logs'
};

// ============================================
// ERROR LOGGER SERVICE
// ============================================

class ErrorLogger {
  constructor() {
    this.logs = [];
    this.listeners = [];
    this.sessionId = this.generateSessionId();
    this.loadLogsFromStorage();
    this.setupGlobalHandlers();
  }

  // ============================================
  // CORE LOGGING METHODS
  // ============================================

  log(message, level = LOG_LEVELS.INFO, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      message,
      level: level.name,
      levelValue: level.level,
      context: this.sanitizeContext(context),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stack: this.getStackTrace(),
      id: this.generateLogId()
    };

    // Check if should log
    if (logEntry.levelValue < CONFIG.minLevel) return;

    // Store
    this.storeLog(logEntry);

    // Console output
    if (CONFIG.enableConsole && CONFIG.isDevelopment) {
      this.logToConsole(logEntry, level);
    }

    // Notify listeners
    this.notifyListeners(logEntry);

    // Remote logging
    if (CONFIG.enableRemote && logEntry.levelValue >= LOG_LEVELS.ERROR.level) {
      this.sendToRemote(logEntry);
    }

    return logEntry;
  }

  debug(message, context = {}) {
    return this.log(message, LOG_LEVELS.DEBUG, context);
  }

  info(message, context = {}) {
    return this.log(message, LOG_LEVELS.INFO, context);
  }

  warn(message, context = {}) {
    return this.log(message, LOG_LEVELS.WARN, context);
  }

  error(message, error = null, context = {}) {
    const errorContext = {
      ...context,
      error: this.extractError(error),
      errorType: error?.constructor?.name || 'Unknown',
      errorMessage: error?.message || message
    };
    return this.log(message, LOG_LEVELS.ERROR, errorContext);
  }

  critical(message, error = null, context = {}) {
    const errorContext = {
      ...context,
      error: this.extractError(error),
      errorType: error?.constructor?.name || 'Unknown',
      errorMessage: error?.message || message
    };
    return this.log(message, LOG_LEVELS.CRITICAL, errorContext);
  }

  // ============================================
  // STORAGE & PERSISTENCE
  // ============================================

  storeLog(logEntry) {
    this.logs.push(logEntry);

    // Limit stored logs
    if (this.logs.length > CONFIG.maxLogs) {
      this.logs.shift();
    }

    // Persist to localStorage
    if (CONFIG.persistLogs && CONFIG.enableStorage) {
      try {
        const recentLogs = this.logs.slice(-100); // Store last 100
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(recentLogs));
      } catch (e) {
        console.error('Failed to persist logs:', e);
      }
    }
  }

  loadLogsFromStorage() {
    if (!CONFIG.persistLogs || !CONFIG.enableStorage) return;

    try {
      const stored = localStorage.getItem(CONFIG.storageKey);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load logs from storage:', e);
    }
  }

  clearLogs() {
    this.logs = [];
    if (CONFIG.enableStorage) {
      try {
        localStorage.removeItem(CONFIG.storageKey);
      } catch (e) {
        console.error('Failed to clear logs:', e);
      }
    }
  }

  // ============================================
  // LOG RETRIEVAL & FILTERING
  // ============================================

  getLogs(filter = {}) {
    let filtered = [...this.logs];

    if (filter.level) {
      filtered = filtered.filter(log => log.level === filter.level);
    }

    if (filter.minLevel) {
      const minValue = LOG_LEVELS[filter.minLevel]?.level || 0;
      filtered = filtered.filter(log => log.levelValue >= minValue);
    }

    if (filter.message) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(filter.message.toLowerCase())
      );
    }

    if (filter.startTime) {
      const startDate = new Date(filter.startTime);
      filtered = filtered.filter(log => new Date(log.timestamp) >= startDate);
    }

    if (filter.endTime) {
      const endDate = new Date(filter.endTime);
      filtered = filtered.filter(log => new Date(log.timestamp) <= endDate);
    }

    if (filter.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  getErrorLogs() {
    return this.getLogs({ minLevel: 'ERROR' });
  }

  getWarnings() {
    return this.getLogs({ level: 'WARN' });
  }

  getSessionLogs() {
    return this.logs.filter(log => log.sessionId === this.sessionId);
  }

  getLastError() {
    const errors = this.getErrorLogs();
    return errors[errors.length - 1] || null;
  }

  // ============================================
  // LISTENERS (FOR REAL-TIME UPDATES)
  // ============================================

  onLog(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(logEntry) {
    this.listeners.forEach(callback => {
      try {
        callback(logEntry);
      } catch (e) {
        console.error('Listener error:', e);
      }
    });
  }

  // ============================================
  // CONSOLE OUTPUT
  // ============================================

  logToConsole(logEntry, level) {
    const { message, context, level: levelName } = logEntry;
    const prefix = `[${levelName}]`;
    const style = `color: ${level.color}; font-weight: bold;`;

    console.log(`%c${level.emoji} ${prefix} ${message}`, style, context);
  }

  // ============================================
  // ERROR UTILITIES
  // ============================================

  extractError(error) {
    if (!error) return null;

    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    }

    return error;
  }

  sanitizeContext(context) {
    const sanitized = { ...context };

    // Remove sensitive data
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authToken'];
    sensitiveKeys.forEach(key => {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  getStackTrace() {
    if (!CONFIG.isDevelopment) return null;

    try {
      const stack = new Error().stack;
      return stack?.split('\n').slice(3, 8).join('\n') || null;
    } catch {
      return null;
    }
  }

  // ============================================
  // UTILITIES
  // ============================================

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateLogId() {
    return `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  setupGlobalHandlers() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.error(`Uncaught error: ${event.message}`, event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error(`Unhandled promise rejection: ${event.reason}`, event.reason, {
        promise: 'unhandledRejection'
      });
    });
  }

  sendToRemote(logEntry) {
    if (!CONFIG.enableRemote) return;

    fetch(CONFIG.remoteEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    }).catch(err => {
      console.error('Failed to send log to remote:', err);
    });
  }

  // ============================================
  // EXPORT & REPORTING
  // ============================================

  exportLogs(format = 'json') {
    const logs = this.getLogs();

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    if (format === 'csv') {
      const headers = ['Timestamp', 'Level', 'Message', 'Context'];
      const rows = logs.map(log => [
        log.timestamp,
        log.level,
        log.message,
        JSON.stringify(log.context)
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return csv;
    }

    return JSON.stringify(logs);
  }

  downloadLogs(filename = `logs-${Date.now()}.json`) {
    const logs = this.exportLogs('json');
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  getLogStats() {
    const logs = this.logs;
    const stats = {
      total: logs.length,
      byLevel: {},
      errorCount: 0,
      warningCount: 0,
      firstLog: logs[0]?.timestamp || null,
      lastLog: logs[logs.length - 1]?.timestamp || null,
      averagePerHour: 0
    };

    // Count by level
    Object.keys(LOG_LEVELS).forEach(key => {
      const level = LOG_LEVELS[key].name;
      const count = logs.filter(log => log.level === level).length;
      stats.byLevel[level] = count;

      if (level === 'ERROR') stats.errorCount = count;
      if (level === 'WARN') stats.warningCount = count;
    });

    // Calculate average
    if (stats.firstLog && stats.lastLog) {
      const timeDiff = (new Date(stats.lastLog) - new Date(stats.firstLog)) / (1000 * 60 * 60);
      stats.averagePerHour = timeDiff > 0 ? (stats.total / timeDiff).toFixed(2) : 0;
    }

    return stats;
  }

  printStats() {
    const stats = this.getLogStats();
    console.table(stats);
    console.log('Logs by level:', stats.byLevel);
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const errorLogger = new ErrorLogger();

// ============================================
// ERROR HANDLER UTILITIES
// ============================================

export const handleError = (error, context = {}) => {
  errorLogger.error(error?.message || 'An error occurred', error, context);
  return {
    success: false,
    error: error?.message || 'An error occurred',
    context
  };
};

export const handleAsyncError = async (asyncFn, context = {}) => {
  try {
    return await asyncFn();
  } catch (error) {
    return handleError(error, context);
  }
};

export const logUserAction = (action, details = {}) => {
  errorLogger.info(`User action: ${action}`, details);
};

export const logApiCall = (method, endpoint, status, details = {}) => {
  const message = `API ${method} ${endpoint} - Status: ${status}`;
  const level = status >= 400 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
  errorLogger.log(message, level, { method, endpoint, status, ...details });
};

export const logPerformance = (name, duration, threshold = 1000) => {
  const level = duration > threshold ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
  errorLogger.log(`Performance: ${name} took ${duration}ms`, level, {
    name,
    duration,
    threshold,
    exceeded: duration > threshold
  });
};

// ============================================
// ERROR TYPES
// ============================================

export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class AuthError extends Error {
  constructor(message, code = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export class NetworkError extends Error {
  constructor(message, statusCode = null) {
    super(message);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
  }
}

export class BusinessLogicError extends Error {
  constructor(message, errorCode = null) {
    super(message);
    this.name = 'BusinessLogicError';
    this.errorCode = errorCode;
  }
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  errorLogger,
  LOG_LEVELS,
  CONFIG,
  handleError,
  handleAsyncError,
  logUserAction,
  logApiCall,
  logPerformance,
  ValidationError,
  AuthError,
  NetworkError,
  BusinessLogicError
};
