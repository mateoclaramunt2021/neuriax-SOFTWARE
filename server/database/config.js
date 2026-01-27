/**
 * PASO 57: Configuración de Base de Datos PostgreSQL
 * NEURIAX Platform - Proyecto Millonario
 * Preparado para migración a producción
 */

// Configuración de conexión PostgreSQL
const config = {
  development: {
    type: 'json',
    path: './database/database.json'
  },
  production: {
    type: 'postgresql',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'begona_gomez_db',
    user: process.env.DB_USER || 'begona_admin',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    }
  }
};

// Función para obtener la configuración según el entorno
function get() {
  const env = process.env.NODE_ENV || 'development';
  return config[env] || config.development;
}

module.exports = { ...config, get };
