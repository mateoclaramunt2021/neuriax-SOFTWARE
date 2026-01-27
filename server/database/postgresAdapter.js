/**
 * ============================================================
 * PASO 57: PostgreSQL Database Adapter
 * NEURIAX Platform - Capa de Abstracción de Base de Datos
 * ============================================================
 * 
 * Este adaptador proporciona una interfaz unificada para trabajar
 * tanto con JSON (desarrollo) como con PostgreSQL (producción).
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

class PostgresAdapter {
    constructor() {
        this.pool = null;
        this.isConnected = false;
        this.config = config.get();
    }

    /**
     * Inicializa la conexión con PostgreSQL
     */
    async connect() {
        if (this.config.type !== 'postgresql') {
            console.log('📦 Modo desarrollo: usando base de datos JSON');
            return true;
        }

        try {
            this.pool = new Pool({
                host: this.config.host,
                port: this.config.port,
                database: this.config.database,
                user: this.config.user,
                password: this.config.password,
                ssl: this.config.ssl,
                min: this.config.pool.min,
                max: this.config.pool.max,
                idleTimeoutMillis: this.config.pool.idleTimeoutMillis,
                connectionTimeoutMillis: this.config.pool.connectionTimeoutMillis
            });

            // Probar conexión
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            
            this.isConnected = true;
            console.log('🐘 Conectado a PostgreSQL correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error conectando a PostgreSQL:', error.message);
            throw error;
        }
    }

    /**
     * Cierra la conexión con PostgreSQL
     */
    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.isConnected = false;
            console.log('🔌 Desconectado de PostgreSQL');
        }
    }

    /**
     * Ejecuta una query SQL
     * @param {string} sql - Query SQL
     * @param {Array} params - Parámetros para la query
     * @returns {Object} Resultado de la query
     */
    async query(sql, params = []) {
        if (!this.isConnected || !this.pool) {
            throw new Error('No hay conexión con la base de datos');
        }

        try {
            const result = await this.pool.query(sql, params);
            return result;
        } catch (error) {
            console.error('❌ Error en query:', error.message);
            console.error('SQL:', sql);
            console.error('Params:', params);
            throw error;
        }
    }

    /**
     * Obtiene un cliente para transacciones
     * @returns {Object} Cliente de PostgreSQL
     */
    async getClient() {
        if (!this.pool) {
            throw new Error('Pool no inicializado');
        }
        return await this.pool.connect();
    }

    /**
     * Ejecuta una transacción
     * @param {Function} callback - Función que recibe el cliente
     * @returns {*} Resultado del callback
     */
    async transaction(callback) {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================================
    // MÉTODOS CRUD GENÉRICOS
    // ========================================================

    /**
     * Obtiene todos los registros de una tabla
     * @param {string} table - Nombre de la tabla
     * @param {Object} options - Opciones de consulta
     */
    async findAll(table, options = {}) {
        const { 
            where = {}, 
            orderBy = 'id', 
            order = 'ASC', 
            limit, 
            offset,
            columns = '*'
        } = options;

        let sql = `SELECT ${columns} FROM salon.${table}`;
        const params = [];
        let paramIndex = 1;

        // WHERE clause
        const whereKeys = Object.keys(where);
        if (whereKeys.length > 0) {
            const conditions = whereKeys.map(key => {
                params.push(where[key]);
                return `${key} = $${paramIndex++}`;
            });
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }

        // ORDER BY
        sql += ` ORDER BY ${orderBy} ${order}`;

        // LIMIT y OFFSET
        if (limit) {
            sql += ` LIMIT $${paramIndex++}`;
            params.push(limit);
        }
        if (offset) {
            sql += ` OFFSET $${paramIndex++}`;
            params.push(offset);
        }

        const result = await this.query(sql, params);
        return result.rows;
    }

    /**
     * Obtiene un registro por ID
     * @param {string} table - Nombre de la tabla
     * @param {number} id - ID del registro
     */
    async findById(table, id) {
        const result = await this.query(
            `SELECT * FROM salon.${table} WHERE id = $1`,
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Obtiene un registro por condición
     * @param {string} table - Nombre de la tabla
     * @param {Object} where - Condiciones
     */
    async findOne(table, where) {
        const keys = Object.keys(where);
        const conditions = keys.map((key, i) => `${key} = $${i + 1}`);
        const values = Object.values(where);

        const result = await this.query(
            `SELECT * FROM salon.${table} WHERE ${conditions.join(' AND ')} LIMIT 1`,
            values
        );
        return result.rows[0] || null;
    }

    /**
     * Inserta un nuevo registro
     * @param {string} table - Nombre de la tabla
     * @param {Object} data - Datos a insertar
     */
    async create(table, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, i) => `$${i + 1}`);

        const result = await this.query(
            `INSERT INTO salon.${table} (${keys.join(', ')}) 
             VALUES (${placeholders.join(', ')}) 
             RETURNING *`,
            values
        );
        return result.rows[0];
    }

    /**
     * Actualiza un registro
     * @param {string} table - Nombre de la tabla
     * @param {number} id - ID del registro
     * @param {Object} data - Datos a actualizar
     */
    async update(table, id, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`);

        const result = await this.query(
            `UPDATE salon.${table} 
             SET ${setClause.join(', ')} 
             WHERE id = $${keys.length + 1} 
             RETURNING *`,
            [...values, id]
        );
        return result.rows[0];
    }

    /**
     * Elimina un registro
     * @param {string} table - Nombre de la tabla
     * @param {number} id - ID del registro
     */
    async delete(table, id) {
        const result = await this.query(
            `DELETE FROM salon.${table} WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    }

    /**
     * Cuenta registros
     * @param {string} table - Nombre de la tabla
     * @param {Object} where - Condiciones opcionales
     */
    async count(table, where = {}) {
        let sql = `SELECT COUNT(*) as total FROM salon.${table}`;
        const params = [];

        const whereKeys = Object.keys(where);
        if (whereKeys.length > 0) {
            const conditions = whereKeys.map((key, i) => {
                params.push(where[key]);
                return `${key} = $${i + 1}`;
            });
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }

        const result = await this.query(sql, params);
        return parseInt(result.rows[0].total);
    }

    // ========================================================
    // MÉTODOS ESPECÍFICOS DEL NEGOCIO
    // ========================================================

    /**
     * Obtiene el resumen del dashboard
     */
    async getDashboardStats() {
        const today = new Date().toISOString().split('T')[0];
        
        const queries = await Promise.all([
            this.query(`SELECT COUNT(*) as total FROM salon.citas WHERE fecha = $1`, [today]),
            this.query(`SELECT COALESCE(SUM(total), 0) as total FROM salon.ventas WHERE DATE(fecha) = $1`, [today]),
            this.query(`SELECT COUNT(*) as total FROM salon.clientes WHERE activo = true`),
            this.query(`SELECT COUNT(*) as total FROM salon.productos WHERE stock_actual <= stock_minimo AND activo = true`)
        ]);

        return {
            citasHoy: parseInt(queries[0].rows[0].total),
            ventasHoy: parseFloat(queries[1].rows[0].total),
            clientesActivos: parseInt(queries[2].rows[0].total),
            productosStockBajo: parseInt(queries[3].rows[0].total)
        };
    }

    /**
     * Obtiene las citas de un día específico
     * @param {string} fecha - Fecha en formato YYYY-MM-DD
     */
    async getCitasPorFecha(fecha) {
        const result = await this.query(`
            SELECT 
                c.*,
                cl.nombre as cliente_nombre,
                cl.telefono as cliente_telefono,
                e.nombre as empleado_nombre,
                s.nombre as servicio_nombre,
                s.precio as servicio_precio,
                s.duracion as servicio_duracion
            FROM salon.citas c
            LEFT JOIN salon.clientes cl ON c.cliente_id = cl.id
            LEFT JOIN salon.empleados e ON c.empleado_id = e.id
            LEFT JOIN salon.servicios s ON c.servicio_id = s.id
            WHERE c.fecha = $1
            ORDER BY c.hora_inicio
        `, [fecha]);
        
        return result.rows;
    }

    /**
     * Obtiene las ventas de un período
     * @param {string} fechaInicio - Fecha inicio
     * @param {string} fechaFin - Fecha fin
     */
    async getVentasPorPeriodo(fechaInicio, fechaFin) {
        const result = await this.query(`
            SELECT 
                v.*,
                c.nombre as cliente_nombre,
                e.nombre as empleado_nombre,
                json_agg(json_build_object(
                    'descripcion', lv.descripcion,
                    'cantidad', lv.cantidad,
                    'precio_unitario', lv.precio_unitario,
                    'subtotal', lv.subtotal
                )) as lineas
            FROM salon.ventas v
            LEFT JOIN salon.clientes c ON v.cliente_id = c.id
            LEFT JOIN salon.empleados e ON v.empleado_id = e.id
            LEFT JOIN salon.lineas_venta lv ON lv.venta_id = v.id
            WHERE DATE(v.fecha) BETWEEN $1 AND $2
            GROUP BY v.id, c.nombre, e.nombre
            ORDER BY v.fecha DESC
        `, [fechaInicio, fechaFin]);
        
        return result.rows;
    }

    /**
     * Registra una venta completa con sus líneas
     * @param {Object} venta - Datos de la venta
     * @param {Array} lineas - Líneas de la venta
     */
    async registrarVenta(venta, lineas) {
        return await this.transaction(async (client) => {
            // Insertar venta
            const ventaResult = await client.query(`
                INSERT INTO salon.ventas (
                    cliente_id, empleado_id, cita_id, subtotal, 
                    descuento_porcentaje, descuento_importe, 
                    base_imponible, iva_total, total, 
                    metodo_pago, propina, notas, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *
            `, [
                venta.cliente_id, venta.empleado_id, venta.cita_id,
                venta.subtotal, venta.descuento_porcentaje || 0,
                venta.descuento_importe || 0, venta.base_imponible,
                venta.iva_total, venta.total, venta.metodo_pago,
                venta.propina || 0, venta.notas, venta.created_by
            ]);

            const ventaId = ventaResult.rows[0].id;

            // Insertar líneas
            for (const linea of lineas) {
                await client.query(`
                    INSERT INTO salon.lineas_venta (
                        venta_id, tipo, servicio_id, producto_id,
                        descripcion, cantidad, precio_unitario,
                        descuento, iva, subtotal, empleado_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                `, [
                    ventaId, linea.tipo, linea.servicio_id,
                    linea.producto_id, linea.descripcion,
                    linea.cantidad, linea.precio_unitario,
                    linea.descuento || 0, linea.iva || 21,
                    linea.subtotal, linea.empleado_id
                ]);
            }

            // Registrar movimiento de caja
            await client.query(`
                INSERT INTO salon.movimientos_caja (
                    tipo, concepto, importe, metodo_pago, venta_id, usuario_id
                ) VALUES ('cobro', $1, $2, $3, $4, $5)
            `, [
                `Venta ${ventaResult.rows[0].numero}`,
                venta.total, venta.metodo_pago, ventaId, venta.created_by
            ]);

            return ventaResult.rows[0];
        });
    }

    /**
     * Genera una factura a partir de una venta
     * @param {number} ventaId - ID de la venta
     * @param {Object} datosFactura - Datos adicionales para la factura
     */
    async generarFactura(ventaId, datosFactura = {}) {
        return await this.transaction(async (client) => {
            // Obtener venta
            const ventaResult = await client.query(`
                SELECT v.*, c.nombre, c.dni_nif, c.direccion, c.email
                FROM salon.ventas v
                LEFT JOIN salon.clientes c ON v.cliente_id = c.id
                WHERE v.id = $1
            `, [ventaId]);

            if (ventaResult.rows.length === 0) {
                throw new Error('Venta no encontrada');
            }

            const venta = ventaResult.rows[0];
            const serie = datosFactura.serie || 'F';
            const year = new Date().getFullYear();

            // Obtener siguiente número de factura
            const numResult = await client.query(`
                SELECT COALESCE(MAX(numero), 0) + 1 as siguiente
                FROM salon.facturas
                WHERE serie = $1 AND EXTRACT(YEAR FROM fecha_emision) = $2
            `, [serie, year]);

            const numero = numResult.rows[0].siguiente;
            const numeroCompleto = `${serie}${year}-${String(numero).padStart(5, '0')}`;

            // Crear factura
            const facturaResult = await client.query(`
                INSERT INTO salon.facturas (
                    serie, numero, numero_completo, cliente_id,
                    cliente_nombre, cliente_nif, cliente_direccion,
                    base_imponible, iva_porcentaje, iva_importe, total,
                    metodo_pago, venta_id, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING *
            `, [
                serie, numero, numeroCompleto, venta.cliente_id,
                datosFactura.cliente_nombre || venta.nombre,
                datosFactura.cliente_nif || venta.dni_nif,
                datosFactura.cliente_direccion || venta.direccion,
                venta.base_imponible, 21, venta.iva_total, venta.total,
                venta.metodo_pago, ventaId, datosFactura.created_by
            ]);

            const facturaId = facturaResult.rows[0].id;

            // Copiar líneas de venta a líneas de factura
            await client.query(`
                INSERT INTO salon.lineas_factura (
                    factura_id, descripcion, cantidad, 
                    precio_unitario, descuento, iva, subtotal
                )
                SELECT 
                    $1, descripcion, cantidad,
                    precio_unitario, descuento, iva, subtotal
                FROM salon.lineas_venta
                WHERE venta_id = $2
            `, [facturaId, ventaId]);

            // Actualizar referencia en venta
            await client.query(`
                UPDATE salon.ventas SET factura_id = $1 WHERE id = $2
            `, [facturaId, ventaId]);

            return facturaResult.rows[0];
        });
    }

    /**
     * Obtiene el balance de caja del día
     */
    async getBalanceCajaHoy() {
        const today = new Date().toISOString().split('T')[0];
        
        const result = await this.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN importe ELSE 0 END), 0) as efectivo,
                COALESCE(SUM(CASE WHEN metodo_pago = 'tarjeta' THEN importe ELSE 0 END), 0) as tarjeta,
                COALESCE(SUM(CASE WHEN metodo_pago = 'bizum' THEN importe ELSE 0 END), 0) as bizum,
                COALESCE(SUM(importe), 0) as total,
                COUNT(*) as operaciones
            FROM salon.movimientos_caja
            WHERE DATE(fecha) = $1 AND tipo IN ('cobro', 'ingreso')
        `, [today]);

        return result.rows[0];
    }

    /**
     * Busca clientes por nombre, teléfono o email
     * @param {string} termino - Término de búsqueda
     */
    async buscarClientes(termino) {
        const result = await this.query(`
            SELECT * FROM salon.clientes
            WHERE activo = true AND (
                nombre ILIKE $1 OR
                apellidos ILIKE $1 OR
                telefono ILIKE $1 OR
                email ILIKE $1
            )
            ORDER BY nombre
            LIMIT 20
        `, [`%${termino}%`]);

        return result.rows;
    }

    /**
     * Obtiene productos con stock bajo
     */
    async getProductosStockBajo() {
        const result = await this.query(`
            SELECT * FROM salon.v_stock_bajo
        `);
        return result.rows;
    }

    /**
     * Ejecuta el script de migración inicial
     */
    async runMigrations() {
        try {
            const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
            const sql = await fs.readFile(migrationPath, 'utf8');
            
            // Dividir por comandos (simplificado)
            const commands = sql.split(';').filter(cmd => cmd.trim());
            
            for (const command of commands) {
                if (command.trim()) {
                    try {
                        await this.query(command);
                    } catch (err) {
                        // Ignorar errores de "ya existe"
                        if (!err.message.includes('already exists')) {
                            console.warn('⚠️ Warning en migración:', err.message);
                        }
                    }
                }
            }
            
            console.log('✅ Migraciones ejecutadas correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error en migraciones:', error.message);
            throw error;
        }
    }

    /**
     * Verifica el estado de la conexión
     */
    async healthCheck() {
        try {
            if (this.config.type !== 'postgresql') {
                return { status: 'ok', type: 'json', message: 'Base de datos JSON activa' };
            }

            const result = await this.query('SELECT NOW() as time, version() as version');
            return {
                status: 'ok',
                type: 'postgresql',
                time: result.rows[0].time,
                version: result.rows[0].version,
                pool: {
                    total: this.pool.totalCount,
                    idle: this.pool.idleCount,
                    waiting: this.pool.waitingCount
                }
            };
        } catch (error) {
            return {
                status: 'error',
                message: error.message
            };
        }
    }
}

// Singleton
const adapter = new PostgresAdapter();

module.exports = adapter;
