const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOGS_DIR, `app-${new Date().toISOString().split('T')[0]}.log`);

// Crear directorio de logs si no existe
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Buffer para escritura eficiente
let logBuffer = [];
let flushTimer = null;

class Logger {
  constructor() {
    this.logFile = LOG_FILE;
    this.maxBufferSize = 50; // Flush cada 50 mensajes
    this.flushInterval = 5000; // O cada 5 segundos
  }

  /**
   * Flush del buffer al archivo
   */
  flushBuffer() {
    if (logBuffer.length === 0) return;
    
    const messages = logBuffer.join('\n') + '\n';
    logBuffer = [];
    
    // Escritura asíncrona para no bloquear
    fs.appendFile(this.logFile, messages, 'utf8', (err) => {
      if (err) console.error('Error escribiendo log:', err.message);
    });
  }

  /**
   * Escribe log con formato (optimizado con buffer)
   * @param {string} level - Nivel de log (ERROR, WARN, INFO, DEBUG)
   * @param {string} message - Mensaje
   * @param {object} data - Datos adicionales (opcional)
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`;
    
    // Console output con colores (solo si no es DEBUG en producción)
    if (process.env.NODE_ENV !== 'production' || level !== 'DEBUG') {
      this.consoleLog(level, logMessage);
    }
    
    // Agregar al buffer
    logBuffer.push(logMessage);
    
    // Flush si el buffer está lleno o es un error
    if (logBuffer.length >= this.maxBufferSize || level === 'ERROR') {
      this.flushBuffer();
    } else if (!flushTimer) {
      // Programar flush si no hay timer activo
      flushTimer = setTimeout(() => {
        this.flushBuffer();
        flushTimer = null;
      }, this.flushInterval);
    }
  }

  consoleLog(level, message) {
    const colors = {
      ERROR: '\x1b[31m',   // Rojo
      WARN: '\x1b[33m',    // Amarillo
      INFO: '\x1b[36m',    // Cyan
      DEBUG: '\x1b[35m'    // Magenta
    };
    const reset = '\x1b[0m';
    
    console.log(`${colors[level]}${message}${reset}`);
  }

  error(message, data = null) {
    this.log(LOG_LEVELS.ERROR, message, data);
  }

  warn(message, data = null) {
    this.log(LOG_LEVELS.WARN, message, data);
  }

  info(message, data = null) {
    this.log(LOG_LEVELS.INFO, message, data);
  }

  debug(message, data = null) {
    this.log(LOG_LEVELS.DEBUG, message, data);
  }

  /**
   * Log de petición HTTP
   */
  logRequest(method, path, statusCode, duration) {
    this.info(`${method} ${path} - ${statusCode}`, { duration: `${duration}ms` });
  }

  /**
   * Log de autenticación
   */
  logAuth(username, success, reason = null) {
    if (success) {
      this.info(`✓ Login exitoso: ${username}`);
    } else {
      this.warn(`✗ Login fallido: ${username}`, { reason });
    }
  }

  /**
   * Log de operación de datos
   */
  logDataOperation(operation, collection, success, details = null) {
    const status = success ? '✓' : '✗';
    this.info(`${status} ${operation} en ${collection}`, details);
  }
}

module.exports = new Logger();
