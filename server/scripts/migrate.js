#!/usr/bin/env node
/**
 * ============================================================
 * NEURIAX Platform - Script de Migración a PostgreSQL
 * ============================================================
 * 
 * Este script automatiza la migración de datos desde JSON
 * a PostgreSQL para entornos de producción.
 * 
 * Uso:
 *   node scripts/migrate.js --check     # Verificar conexión
 *   node scripts/migrate.js --schema    # Crear esquema
 *   node scripts/migrate.js --migrate   # Migrar datos
 *   node scripts/migrate.js --full      # Migración completa
 *   node scripts/migrate.js --rollback  # Revertir última migración
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

// Colores para consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[OK]${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
    title: (msg) => console.log(`\n${colors.magenta}${colors.bright}═══ ${msg} ═══${colors.reset}\n`)
};

// Configuración
const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'begona_gomez_db',
    user: process.env.DB_USER || 'neuriax_admin',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

const MIGRATIONS_DIR = path.join(__dirname, '../database/migrations');
const DATA_DIR = path.join(__dirname, '../database');

class Migrator {
    constructor() {
        this.pool = null;
    }

    async connect() {
        try {
            this.pool = new Pool(config);
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            log.success(`Conectado a PostgreSQL: ${config.host}:${config.port}/${config.database}`);
            return true;
        } catch (error) {
            log.error(`Error de conexión: ${error.message}`);
            return false;
        }
    }

    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            log.info('Conexión cerrada');
        }
    }

    async checkConnection() {
        log.title('VERIFICAR CONEXIÓN');
        
        log.info('Configuración actual:');
        console.log(`  Host:     ${config.host}`);
        console.log(`  Puerto:   ${config.port}`);
        console.log(`  Database: ${config.database}`);
        console.log(`  Usuario:  ${config.user}`);
        console.log(`  SSL:      ${config.ssl ? 'Sí' : 'No'}`);
        console.log('');

        const connected = await this.connect();
        
        if (connected) {
            // Verificar versión de PostgreSQL
            const result = await this.pool.query('SELECT version()');
            log.success(`PostgreSQL: ${result.rows[0].version.split(',')[0]}`);

            // Verificar esquemas existentes
            const schemas = await this.pool.query(`
                SELECT schema_name FROM information_schema.schemata 
                WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
            `);
            log.info(`Esquemas disponibles: ${schemas.rows.map(r => r.schema_name).join(', ')}`);

            // Verificar tablas en salon
            const tables = await this.pool.query(`
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'salon'
            `);
            
            if (tables.rows.length > 0) {
                log.info(`Tablas en 'salon': ${tables.rows.map(r => r.table_name).join(', ')}`);
            } else {
                log.warn('No hay tablas en el esquema salon');
            }
        }

        return connected;
    }

    async createSchema() {
        log.title('CREAR ESQUEMA');

        const connected = await this.connect();
        if (!connected) return false;

        try {
            // Leer el archivo de migración
            const migrationFile = path.join(MIGRATIONS_DIR, '001_initial_schema.sql');
            const sql = await fs.readFile(migrationFile, 'utf8');

            log.info('Ejecutando migración inicial...');

            // Dividir en bloques separados por comentarios de sección
            const blocks = sql.split(/(?=-- \d+\.)/);

            for (const block of blocks) {
                if (block.trim()) {
                    // Extraer descripción del bloque
                    const match = block.match(/-- (\d+)\. (.+)/);
                    if (match) {
                        log.info(`Ejecutando: ${match[2]}`);
                    }

                    // Ejecutar el bloque (ignorar comandos psql como \c)
                    const cleanBlock = block
                        .split('\n')
                        .filter(line => !line.trim().startsWith('\\'))
                        .join('\n');

                    if (cleanBlock.trim()) {
                        try {
                            await this.pool.query(cleanBlock);
                        } catch (err) {
                            // Ignorar errores de "ya existe"
                            if (!err.message.includes('already exists') && 
                                !err.message.includes('ya existe')) {
                                throw err;
                            }
                        }
                    }
                }
            }

            log.success('Esquema creado exitosamente');

            // Registrar migración
            await this.registerMigration('001_initial_schema.sql');

            return true;
        } catch (error) {
            log.error(`Error creando esquema: ${error.message}`);
            return false;
        }
    }

    async migrateData() {
        log.title('MIGRAR DATOS');

        const connected = await this.connect();
        if (!connected) return false;

        try {
            // Leer datos JSON
            const dataFiles = [
                { file: 'database.json', tables: ['usuarios', 'clientes', 'servicios', 'productos', 'citas'] },
                { file: 'tenants.json', tables: ['tenants'] }
            ];

            for (const dataConfig of dataFiles) {
                const filePath = path.join(DATA_DIR, dataConfig.file);
                
                try {
                    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
                    
                    for (const tableName of dataConfig.tables) {
                        if (data[tableName] && Array.isArray(data[tableName])) {
                            await this.migrateTable(tableName, data[tableName]);
                        }
                    }
                } catch (err) {
                    log.warn(`No se pudo leer ${dataConfig.file}: ${err.message}`);
                }
            }

            log.success('Migración de datos completada');
            return true;
        } catch (error) {
            log.error(`Error migrando datos: ${error.message}`);
            return false;
        }
    }

    async migrateTable(tableName, records) {
        if (records.length === 0) {
            log.info(`Tabla ${tableName}: sin registros`);
            return;
        }

        log.info(`Migrando ${tableName}: ${records.length} registros...`);

        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');

            for (const record of records) {
                const columns = Object.keys(record);
                const values = Object.values(record);
                const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

                const query = `
                    INSERT INTO salon.${tableName} (${columns.join(', ')})
                    VALUES (${placeholders})
                    ON CONFLICT (id) DO UPDATE SET
                    ${columns.map(col => `${col} = EXCLUDED.${col}`).join(', ')}
                `;

                try {
                    await client.query(query, values);
                } catch (err) {
                    log.warn(`  Error en registro ID ${record.id}: ${err.message}`);
                }
            }

            await client.query('COMMIT');
            log.success(`  ${tableName}: ${records.length} registros migrados`);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async registerMigration(name) {
        try {
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS salon.migrations (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE,
                    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await this.pool.query(
                'INSERT INTO salon.migrations (name) VALUES ($1) ON CONFLICT DO NOTHING',
                [name]
            );
        } catch (err) {
            log.warn(`No se pudo registrar migración: ${err.message}`);
        }
    }

    async fullMigration() {
        log.title('MIGRACIÓN COMPLETA');

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const confirm = await new Promise(resolve => {
            rl.question(`${colors.yellow}¿Desea continuar con la migración completa? (s/N): ${colors.reset}`, answer => {
                rl.close();
                resolve(answer.toLowerCase() === 's' || answer.toLowerCase() === 'si');
            });
        });

        if (!confirm) {
            log.info('Migración cancelada');
            return;
        }

        const schemaOk = await this.createSchema();
        if (!schemaOk) {
            log.error('Fallo al crear esquema. Abortando.');
            return;
        }

        const dataOk = await this.migrateData();
        if (!dataOk) {
            log.error('Fallo al migrar datos.');
            return;
        }

        log.success('¡Migración completa exitosa!');
    }

    async rollback() {
        log.title('ROLLBACK');

        const connected = await this.connect();
        if (!connected) return false;

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const confirm = await new Promise(resolve => {
            rl.question(`${colors.red}⚠️  ¿Está seguro de eliminar TODAS las tablas? (escriba 'CONFIRMAR'): ${colors.reset}`, answer => {
                rl.close();
                resolve(answer === 'CONFIRMAR');
            });
        });

        if (!confirm) {
            log.info('Rollback cancelado');
            return;
        }

        try {
            await this.pool.query('DROP SCHEMA IF EXISTS salon CASCADE');
            log.success('Esquema salon eliminado');
            return true;
        } catch (error) {
            log.error(`Error en rollback: ${error.message}`);
            return false;
        }
    }
}

// CLI
async function main() {
    console.log(`
${colors.magenta}╔═══════════════════════════════════════════════════════════╗
║     NEURIAX Platform - Script de Migración PostgreSQL     ║
║                      Versión 1.0.0                        ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}
`);

    const args = process.argv.slice(2);
    const command = args[0] || '--help';

    const migrator = new Migrator();

    try {
        switch (command) {
            case '--check':
            case '-c':
                await migrator.checkConnection();
                break;

            case '--schema':
            case '-s':
                await migrator.createSchema();
                break;

            case '--migrate':
            case '-m':
                await migrator.migrateData();
                break;

            case '--full':
            case '-f':
                await migrator.fullMigration();
                break;

            case '--rollback':
            case '-r':
                await migrator.rollback();
                break;

            case '--help':
            case '-h':
            default:
                console.log(`
${colors.cyan}Uso:${colors.reset}
  node scripts/migrate.js <comando>

${colors.cyan}Comandos:${colors.reset}
  --check, -c      Verificar conexión a PostgreSQL
  --schema, -s     Crear esquema de base de datos
  --migrate, -m    Migrar datos desde JSON
  --full, -f       Migración completa (esquema + datos)
  --rollback, -r   Revertir migración (¡PELIGROSO!)
  --help, -h       Mostrar esta ayuda

${colors.cyan}Variables de entorno requeridas:${colors.reset}
  DB_HOST          Host de PostgreSQL (default: localhost)
  DB_PORT          Puerto (default: 5432)
  DB_NAME          Nombre de la base de datos
  DB_USER          Usuario de PostgreSQL
  DB_PASSWORD      Contraseña
  DB_SSL           Usar SSL (true/false)

${colors.cyan}Ejemplo:${colors.reset}
  DB_HOST=db.example.com DB_PASSWORD=secret node scripts/migrate.js --full
`);
        }
    } finally {
        await migrator.disconnect();
    }
}

main().catch(console.error);
