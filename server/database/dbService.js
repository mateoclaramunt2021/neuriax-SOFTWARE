/**
 * ============================================================
 * PASO 57: Database Service - Servicio Unificado de Base de Datos
 * NEURIAX Platform
 * ============================================================
 * 
 * Proporciona una interfaz única que abstrae tanto JSON como PostgreSQL.
 * En desarrollo usa JSON, en producción usa PostgreSQL.
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('./config');
const postgresAdapter = require('./postgresAdapter');

class DatabaseService {
    constructor() {
        this.config = config.get();
        this.jsonPath = path.join(__dirname, 'database.json');
        this.data = null;
        this.initialized = false;
    }

    /**
     * Inicializa el servicio de base de datos
     */
    async initialize() {
        if (this.initialized) return;

        if (this.config.type === 'postgresql') {
            await postgresAdapter.connect();
            console.log('🐘 DatabaseService: PostgreSQL inicializado');
        } else {
            await this.loadJSON();
            console.log('📦 DatabaseService: JSON inicializado');
        }

        this.initialized = true;
    }

    /**
     * Carga los datos del archivo JSON
     */
    async loadJSON() {
        try {
            const content = await fs.readFile(this.jsonPath, 'utf8');
            this.data = JSON.parse(content);
        } catch (error) {
            // Si no existe, crear estructura inicial
            this.data = this.getDefaultData();
            await this.saveJSON();
        }
    }

    /**
     * Guarda los datos en el archivo JSON
     */
    async saveJSON() {
        await fs.writeFile(
            this.jsonPath,
            JSON.stringify(this.data, null, 2),
            'utf8'
        );
    }

    /**
     * Estructura de datos por defecto
     */
    getDefaultData() {
        return {
            usuarios: [],
            clientes: [],
            servicios: [],
            categorias: [],
            empleados: [],
            productos: [],
            citas: [],
            ventas: [],
            facturas: [],
            movimientosCaja: [],
            sesionesCaja: [],
            asientosContables: [],
            configuracion: {},
            backups: []
        };
    }

    /**
     * Determina si está usando PostgreSQL
     */
    isPostgres() {
        return this.config.type === 'postgresql';
    }

    // ========================================================
    // MÉTODOS CRUD GENÉRICOS
    // ========================================================

    /**
     * Obtiene todos los registros de una colección/tabla
     */
    async findAll(collection, options = {}) {
        if (this.isPostgres()) {
            return await postgresAdapter.findAll(collection, options);
        }

        await this.loadJSON();
        let items = this.data[collection] || [];

        // Aplicar filtros
        if (options.where) {
            items = items.filter(item => {
                return Object.entries(options.where).every(([key, value]) => {
                    return item[key] === value;
                });
            });
        }

        // Ordenar
        if (options.orderBy) {
            const order = options.order === 'DESC' ? -1 : 1;
            items.sort((a, b) => {
                if (a[options.orderBy] < b[options.orderBy]) return -1 * order;
                if (a[options.orderBy] > b[options.orderBy]) return 1 * order;
                return 0;
            });
        }

        // Limit y offset
        if (options.offset) {
            items = items.slice(options.offset);
        }
        if (options.limit) {
            items = items.slice(0, options.limit);
        }

        return items;
    }

    /**
     * Encuentra un registro por ID
     */
    async findById(collection, id) {
        if (this.isPostgres()) {
            return await postgresAdapter.findById(collection, id);
        }

        await this.loadJSON();
        const items = this.data[collection] || [];
        return items.find(item => item.id === parseInt(id)) || null;
    }

    /**
     * Encuentra un registro por condición
     */
    async findOne(collection, where) {
        if (this.isPostgres()) {
            return await postgresAdapter.findOne(collection, where);
        }

        await this.loadJSON();
        const items = this.data[collection] || [];
        return items.find(item => {
            return Object.entries(where).every(([key, value]) => {
                return item[key] === value;
            });
        }) || null;
    }

    /**
     * Crea un nuevo registro
     */
    async create(collection, data) {
        if (this.isPostgres()) {
            return await postgresAdapter.create(collection, data);
        }

        await this.loadJSON();
        if (!this.data[collection]) {
            this.data[collection] = [];
        }

        // Generar ID
        const maxId = this.data[collection].reduce((max, item) => {
            return item.id > max ? item.id : max;
        }, 0);

        const newItem = {
            id: maxId + 1,
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        this.data[collection].push(newItem);
        await this.saveJSON();

        return newItem;
    }

    /**
     * Actualiza un registro
     */
    async update(collection, id, data) {
        if (this.isPostgres()) {
            return await postgresAdapter.update(collection, id, data);
        }

        await this.loadJSON();
        const items = this.data[collection] || [];
        const index = items.findIndex(item => item.id === parseInt(id));

        if (index === -1) {
            return null;
        }

        this.data[collection][index] = {
            ...this.data[collection][index],
            ...data,
            updated_at: new Date().toISOString()
        };

        await this.saveJSON();
        return this.data[collection][index];
    }

    /**
     * Elimina un registro
     */
    async delete(collection, id) {
        if (this.isPostgres()) {
            return await postgresAdapter.delete(collection, id);
        }

        await this.loadJSON();
        const items = this.data[collection] || [];
        const index = items.findIndex(item => item.id === parseInt(id));

        if (index === -1) {
            return null;
        }

        const deleted = this.data[collection].splice(index, 1)[0];
        await this.saveJSON();
        return deleted;
    }

    /**
     * Cuenta registros
     */
    async count(collection, where = {}) {
        if (this.isPostgres()) {
            return await postgresAdapter.count(collection, where);
        }

        await this.loadJSON();
        let items = this.data[collection] || [];

        if (Object.keys(where).length > 0) {
            items = items.filter(item => {
                return Object.entries(where).every(([key, value]) => {
                    return item[key] === value;
                });
            });
        }

        return items.length;
    }

    // ========================================================
    // MÉTODOS ESPECÍFICOS DE NEGOCIO
    // ========================================================

    /**
     * Obtiene estadísticas del dashboard
     */
    async getDashboardStats() {
        if (this.isPostgres()) {
            return await postgresAdapter.getDashboardStats();
        }

        await this.loadJSON();
        const today = new Date().toISOString().split('T')[0];

        const citasHoy = (this.data.citas || []).filter(c => c.fecha === today).length;
        
        const ventasHoy = (this.data.ventas || [])
            .filter(v => v.fecha && v.fecha.startsWith(today))
            .reduce((sum, v) => sum + (v.total || 0), 0);

        const clientesActivos = (this.data.clientes || [])
            .filter(c => c.activo !== false).length;

        const productosStockBajo = (this.data.productos || [])
            .filter(p => p.activo !== false && p.stock_actual <= (p.stock_minimo || 5)).length;

        return {
            citasHoy,
            ventasHoy,
            clientesActivos,
            productosStockBajo
        };
    }

    /**
     * Obtiene las citas de una fecha
     */
    async getCitasPorFecha(fecha) {
        if (this.isPostgres()) {
            return await postgresAdapter.getCitasPorFecha(fecha);
        }

        await this.loadJSON();
        const citas = (this.data.citas || []).filter(c => c.fecha === fecha);

        // Enriquecer con datos relacionados
        return citas.map(cita => {
            const cliente = (this.data.clientes || []).find(c => c.id === cita.cliente_id);
            const empleado = (this.data.empleados || []).find(e => e.id === cita.empleado_id);
            const servicio = (this.data.servicios || []).find(s => s.id === cita.servicio_id);

            return {
                ...cita,
                cliente_nombre: cliente?.nombre || 'Sin cliente',
                cliente_telefono: cliente?.telefono || '',
                empleado_nombre: empleado?.nombre || 'Sin asignar',
                servicio_nombre: servicio?.nombre || 'Sin servicio',
                servicio_precio: servicio?.precio || 0,
                servicio_duracion: servicio?.duracion || 30
            };
        }).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    }

    /**
     * Obtiene ventas por período
     */
    async getVentasPorPeriodo(fechaInicio, fechaFin) {
        if (this.isPostgres()) {
            return await postgresAdapter.getVentasPorPeriodo(fechaInicio, fechaFin);
        }

        await this.loadJSON();
        const ventas = (this.data.ventas || []).filter(v => {
            const fecha = v.fecha.split('T')[0];
            return fecha >= fechaInicio && fecha <= fechaFin;
        });

        return ventas.map(venta => {
            const cliente = (this.data.clientes || []).find(c => c.id === venta.cliente_id);
            const empleado = (this.data.empleados || []).find(e => e.id === venta.empleado_id);

            return {
                ...venta,
                cliente_nombre: cliente?.nombre || 'Cliente general',
                empleado_nombre: empleado?.nombre || 'Sin asignar',
                lineas: venta.lineas || []
            };
        });
    }

    /**
     * Registra una venta con sus líneas
     */
    async registrarVenta(venta, lineas) {
        if (this.isPostgres()) {
            return await postgresAdapter.registrarVenta(venta, lineas);
        }

        await this.loadJSON();

        // Generar número de venta
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const ventasHoy = (this.data.ventas || []).filter(v => 
            v.numero && v.numero.includes(today)
        ).length;
        const numero = `V${today}-${String(ventasHoy + 1).padStart(4, '0')}`;

        const nuevaVenta = await this.create('ventas', {
            ...venta,
            numero,
            lineas,
            fecha: new Date().toISOString()
        });

        // Actualizar stock de productos
        for (const linea of lineas) {
            if (linea.tipo === 'producto' && linea.producto_id) {
                const producto = await this.findById('productos', linea.producto_id);
                if (producto) {
                    await this.update('productos', linea.producto_id, {
                        stock_actual: (producto.stock_actual || 0) - linea.cantidad
                    });
                }
            }
        }

        // Actualizar estadísticas del cliente
        if (venta.cliente_id) {
            const cliente = await this.findById('clientes', venta.cliente_id);
            if (cliente) {
                await this.update('clientes', venta.cliente_id, {
                    total_gastado: (cliente.total_gastado || 0) + venta.total,
                    visitas: (cliente.visitas || 0) + 1,
                    ultima_visita: new Date().toISOString()
                });
            }
        }

        // Registrar movimiento de caja
        await this.create('movimientosCaja', {
            tipo: 'cobro',
            concepto: `Venta ${numero}`,
            importe: venta.total,
            metodo_pago: venta.metodo_pago,
            venta_id: nuevaVenta.id
        });

        return nuevaVenta;
    }

    /**
     * Busca clientes
     */
    async buscarClientes(termino) {
        if (this.isPostgres()) {
            return await postgresAdapter.buscarClientes(termino);
        }

        await this.loadJSON();
        const terminoLower = termino.toLowerCase();

        return (this.data.clientes || [])
            .filter(c => c.activo !== false && (
                (c.nombre && c.nombre.toLowerCase().includes(terminoLower)) ||
                (c.apellidos && c.apellidos.toLowerCase().includes(terminoLower)) ||
                (c.telefono && c.telefono.includes(termino)) ||
                (c.email && c.email.toLowerCase().includes(terminoLower))
            ))
            .slice(0, 20);
    }

    /**
     * Obtiene balance de caja del día
     */
    async getBalanceCajaHoy() {
        if (this.isPostgres()) {
            return await postgresAdapter.getBalanceCajaHoy();
        }

        await this.loadJSON();
        const today = new Date().toISOString().split('T')[0];

        const movimientos = (this.data.movimientosCaja || []).filter(m => 
            m.created_at && m.created_at.startsWith(today) &&
            ['cobro', 'ingreso'].includes(m.tipo)
        );

        return {
            efectivo: movimientos
                .filter(m => m.metodo_pago === 'efectivo')
                .reduce((sum, m) => sum + (m.importe || 0), 0),
            tarjeta: movimientos
                .filter(m => m.metodo_pago === 'tarjeta')
                .reduce((sum, m) => sum + (m.importe || 0), 0),
            bizum: movimientos
                .filter(m => m.metodo_pago === 'bizum')
                .reduce((sum, m) => sum + (m.importe || 0), 0),
            total: movimientos.reduce((sum, m) => sum + (m.importe || 0), 0),
            operaciones: movimientos.length
        };
    }

    /**
     * Health check del servicio
     */
    async healthCheck() {
        if (this.isPostgres()) {
            return await postgresAdapter.healthCheck();
        }

        try {
            await this.loadJSON();
            return {
                status: 'ok',
                type: 'json',
                collections: Object.keys(this.data),
                message: 'Base de datos JSON funcionando correctamente'
            };
        } catch (error) {
            return {
                status: 'error',
                type: 'json',
                message: error.message
            };
        }
    }

    /**
     * Exporta datos para migración a PostgreSQL
     */
    async exportForMigration() {
        await this.loadJSON();
        return this.data;
    }

    /**
     * Importa datos desde JSON a PostgreSQL
     */
    async importFromJSON() {
        if (!this.isPostgres()) {
            throw new Error('Solo disponible en modo PostgreSQL');
        }

        const jsonData = await this.exportForMigration();
        
        // Migrar en orden por dependencias
        const migrationOrder = [
            'usuarios',
            'categorias',
            'servicios',
            'empleados',
            'clientes',
            'productos',
            'citas',
            'ventas',
            'facturas',
            'movimientosCaja',
            'sesionesCaja',
            'asientosContables'
        ];

        const results = {};

        for (const collection of migrationOrder) {
            const items = jsonData[collection] || [];
            let imported = 0;

            for (const item of items) {
                try {
                    await postgresAdapter.create(collection, item);
                    imported++;
                } catch (error) {
                    console.warn(`⚠️ Error importando ${collection}:`, error.message);
                }
            }

            results[collection] = { total: items.length, imported };
            console.log(`✅ ${collection}: ${imported}/${items.length} importados`);
        }

        return results;
    }

    /**
     * Guardar configuración inicial del salón
     */
    guardarSalonSetup(usuarioId, configSalon) {
        try {
            let db = getDatabase();
            if (!db.salonesSetup) db.salonesSetup = {};
            
            db.salonesSetup[usuarioId] = {
                ...configSalon,
                usuarioId,
                fechaCreacion: new Date().toISOString()
            };
            
            saveDatabase(db);
            return db.salonesSetup[usuarioId];
        } catch (error) {
            console.error('Error guardando setup del salón:', error);
            throw error;
        }
    }

    /**
     * Obtener configuración del salón
     */
    obtenerSalonSetup(usuarioId) {
        try {
            let db = getDatabase();
            if (!db.salonesSetup) db.salonesSetup = {};
            
            return db.salonesSetup[usuarioId] || null;
        } catch (error) {
            console.error('Error obteniendo setup del salón:', error);
            throw error;
        }
    }

    /**
     * Actualizar configuración del salón
     */
    actualizarSalonSetup(usuarioId, configActualizada) {
        try {
            let db = getDatabase();
            if (!db.salonesSetup) db.salonesSetup = {};
            
            if (!db.salonesSetup[usuarioId]) {
                throw new Error('Configuración de salón no encontrada');
            }
            
            db.salonesSetup[usuarioId] = {
                ...db.salonesSetup[usuarioId],
                ...configActualizada,
                fechaActualizacion: new Date().toISOString()
            };
            
            saveDatabase(db);
            return db.salonesSetup[usuarioId];
        } catch (error) {
            console.error('Error actualizando setup del salón:', error);
            throw error;
        }
    }

    /**
     * Verificar si el salón completó el setup
     */
    esSetupCompleto(usuarioId) {
        try {
            let db = getDatabase();
            if (!db.salonesSetup) db.salonesSetup = {};
            
            const setup = db.salonesSetup[usuarioId];
            return setup && setup.perfilCompletado === true;
        } catch (error) {
            console.error('Error verificando setup:', error);
            return false;
        }
    }
}

// Singleton
const dbService = new DatabaseService();

module.exports = dbService;
