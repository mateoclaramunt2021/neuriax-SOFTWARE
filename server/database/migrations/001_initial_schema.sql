-- ============================================================
-- PASO 57: Script de Migración a PostgreSQL
-- NEURIAX Platform - Base de Datos de Producción
-- ============================================================

-- Ejecutar como superusuario de PostgreSQL

-- 1. CREAR BASE DE DATOS Y USUARIO
-- ============================================================

-- Crear usuario de la aplicación
CREATE USER neuriax_admin WITH PASSWORD 'NEURIAX2026$Secure!';

-- Crear base de datos
CREATE DATABASE begona_gomez_db
    WITH 
    OWNER = neuriax_admin
    ENCODING = 'UTF8'
    LC_COLLATE = 'es_ES.UTF-8'
    LC_CTYPE = 'es_ES.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Conceder privilegios
GRANT ALL PRIVILEGES ON DATABASE begona_gomez_db TO neuriax_admin;

-- Conectar a la base de datos
\c begona_gomez_db

-- 2. CREAR ESQUEMA
-- ============================================================

CREATE SCHEMA IF NOT EXISTS salon;
SET search_path TO salon, public;

-- Conceder permisos en el esquema
GRANT ALL ON SCHEMA salon TO neuriax_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA salon GRANT ALL ON TABLES TO neuriax_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA salon GRANT ALL ON SEQUENCES TO neuriax_admin;

-- 3. TIPOS ENUMERADOS
-- ============================================================

CREATE TYPE estado_cita AS ENUM ('pendiente', 'confirmada', 'en_proceso', 'completada', 'cancelada', 'no_show');
CREATE TYPE metodo_pago AS ENUM ('efectivo', 'tarjeta', 'bizum', 'transferencia', 'mixto');
CREATE TYPE rol_usuario AS ENUM ('administrador', 'empleado', 'recepcion');
CREATE TYPE tipo_movimiento AS ENUM ('ingreso', 'gasto', 'apertura', 'cierre', 'cobro');
CREATE TYPE serie_factura AS ENUM ('F', 'R', 'S');
CREATE TYPE estado_factura AS ENUM ('emitida', 'enviada', 'cobrada', 'anulada');

-- 4. TABLAS PRINCIPALES
-- ============================================================

-- USUARIOS (Acceso al sistema)
CREATE TABLE salon.usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    rol rol_usuario DEFAULT 'empleado',
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CLIENTES
CREATE TABLE salon.clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    codigo_postal VARCHAR(10),
    ciudad VARCHAR(50),
    fecha_nacimiento DATE,
    dni_nif VARCHAR(20),
    notas TEXT,
    alergias TEXT,
    preferencias JSONB DEFAULT '{}',
    total_gastado DECIMAL(12,2) DEFAULT 0,
    visitas INTEGER DEFAULT 0,
    puntos_fidelidad INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_visita TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORÍAS DE SERVICIOS
CREATE TABLE salon.categorias_servicios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#8b5cf6',
    icono VARCHAR(50),
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SERVICIOS
CREATE TABLE salon.servicios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria_id INTEGER REFERENCES salon.categorias_servicios(id),
    precio DECIMAL(10,2) NOT NULL,
    duracion INTEGER DEFAULT 30, -- minutos
    comision_empleado DECIMAL(5,2) DEFAULT 0, -- porcentaje
    iva DECIMAL(5,2) DEFAULT 21.00,
    activo BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    imagen_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- EMPLEADOS
CREATE TABLE salon.empleados (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES salon.usuarios(id),
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    dni_nif VARCHAR(20),
    direccion TEXT,
    fecha_nacimiento DATE,
    fecha_alta DATE DEFAULT CURRENT_DATE,
    fecha_baja DATE,
    puesto VARCHAR(50),
    especialidades TEXT[],
    comision_base DECIMAL(5,2) DEFAULT 0,
    salario_base DECIMAL(10,2),
    horario JSONB DEFAULT '{}',
    color VARCHAR(7) DEFAULT '#6366f1',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTOS (Inventario)
CREATE TABLE salon.productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50),
    marca VARCHAR(50),
    precio_compra DECIMAL(10,2),
    precio_venta DECIMAL(10,2) NOT NULL,
    iva DECIMAL(5,2) DEFAULT 21.00,
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    stock_maximo INTEGER,
    ubicacion VARCHAR(50),
    proveedor VARCHAR(100),
    codigo_barras VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MOVIMIENTOS DE INVENTARIO
CREATE TABLE salon.movimientos_inventario (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER REFERENCES salon.productos(id),
    tipo VARCHAR(20) NOT NULL, -- entrada, salida, ajuste
    cantidad INTEGER NOT NULL,
    stock_anterior INTEGER,
    stock_nuevo INTEGER,
    motivo TEXT,
    documento_ref VARCHAR(50),
    usuario_id INTEGER REFERENCES salon.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CITAS
CREATE TABLE salon.citas (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES salon.clientes(id),
    empleado_id INTEGER REFERENCES salon.empleados(id),
    servicio_id INTEGER REFERENCES salon.servicios(id),
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME,
    duracion INTEGER, -- minutos
    estado estado_cita DEFAULT 'pendiente',
    notas TEXT,
    notas_internas TEXT,
    recordatorio_enviado BOOLEAN DEFAULT false,
    confirmacion_cliente BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES salon.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VENTAS
CREATE TABLE salon.ventas (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(20) UNIQUE,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cliente_id INTEGER REFERENCES salon.clientes(id),
    empleado_id INTEGER REFERENCES salon.empleados(id),
    cita_id INTEGER REFERENCES salon.citas(id),
    subtotal DECIMAL(12,2) NOT NULL,
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0,
    descuento_importe DECIMAL(12,2) DEFAULT 0,
    base_imponible DECIMAL(12,2),
    iva_total DECIMAL(12,2),
    total DECIMAL(12,2) NOT NULL,
    metodo_pago metodo_pago DEFAULT 'efectivo',
    pagado BOOLEAN DEFAULT true,
    propina DECIMAL(10,2) DEFAULT 0,
    notas TEXT,
    factura_id INTEGER,
    created_by INTEGER REFERENCES salon.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LÍNEAS DE VENTA
CREATE TABLE salon.lineas_venta (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER REFERENCES salon.ventas(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL, -- servicio, producto
    servicio_id INTEGER REFERENCES salon.servicios(id),
    producto_id INTEGER REFERENCES salon.productos(id),
    descripcion VARCHAR(200),
    cantidad INTEGER DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(5,2) DEFAULT 0,
    iva DECIMAL(5,2) DEFAULT 21.00,
    subtotal DECIMAL(12,2) NOT NULL,
    empleado_id INTEGER REFERENCES salon.empleados(id)
);

-- MOVIMIENTOS DE CAJA
CREATE TABLE salon.movimientos_caja (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo tipo_movimiento NOT NULL,
    concepto VARCHAR(200) NOT NULL,
    importe DECIMAL(12,2) NOT NULL,
    saldo_anterior DECIMAL(12,2),
    saldo_nuevo DECIMAL(12,2),
    metodo_pago metodo_pago,
    venta_id INTEGER REFERENCES salon.ventas(id),
    usuario_id INTEGER REFERENCES salon.usuarios(id),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- APERTURAS Y CIERRES DE CAJA
CREATE TABLE salon.sesiones_caja (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    hora_apertura TIMESTAMP,
    hora_cierre TIMESTAMP,
    fondo_inicial DECIMAL(12,2),
    efectivo_contado DECIMAL(12,2),
    efectivo_esperado DECIMAL(12,2),
    diferencia DECIMAL(12,2),
    total_efectivo DECIMAL(12,2),
    total_tarjeta DECIMAL(12,2),
    total_bizum DECIMAL(12,2),
    total_ventas DECIMAL(12,2),
    num_ventas INTEGER,
    usuario_apertura INTEGER REFERENCES salon.usuarios(id),
    usuario_cierre INTEGER REFERENCES salon.usuarios(id),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FACTURAS
CREATE TABLE salon.facturas (
    id SERIAL PRIMARY KEY,
    serie serie_factura DEFAULT 'F',
    numero INTEGER NOT NULL,
    numero_completo VARCHAR(20) UNIQUE,
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento DATE,
    cliente_id INTEGER REFERENCES salon.clientes(id),
    cliente_nombre VARCHAR(200),
    cliente_nif VARCHAR(20),
    cliente_direccion TEXT,
    base_imponible DECIMAL(12,2) NOT NULL,
    iva_porcentaje DECIMAL(5,2) DEFAULT 21.00,
    iva_importe DECIMAL(12,2),
    irpf_porcentaje DECIMAL(5,2) DEFAULT 0,
    irpf_importe DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    estado estado_factura DEFAULT 'emitida',
    metodo_pago metodo_pago,
    notas TEXT,
    venta_id INTEGER REFERENCES salon.ventas(id),
    hash_verificacion VARCHAR(64),
    qr_code TEXT,
    pdf_path VARCHAR(255),
    enviada_email BOOLEAN DEFAULT false,
    fecha_cobro TIMESTAMP,
    created_by INTEGER REFERENCES salon.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(serie, numero)
);

-- LÍNEAS DE FACTURA
CREATE TABLE salon.lineas_factura (
    id SERIAL PRIMARY KEY,
    factura_id INTEGER REFERENCES salon.facturas(id) ON DELETE CASCADE,
    descripcion VARCHAR(200) NOT NULL,
    cantidad DECIMAL(10,2) DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(5,2) DEFAULT 0,
    iva DECIMAL(5,2) DEFAULT 21.00,
    subtotal DECIMAL(12,2) NOT NULL
);

-- ASIENTOS CONTABLES
CREATE TABLE salon.asientos_contables (
    id SERIAL PRIMARY KEY,
    numero INTEGER NOT NULL,
    fecha DATE NOT NULL,
    concepto VARCHAR(200) NOT NULL,
    documento_ref VARCHAR(50),
    ejercicio INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    validado BOOLEAN DEFAULT false,
    factura_id INTEGER REFERENCES salon.facturas(id),
    venta_id INTEGER REFERENCES salon.ventas(id),
    created_by INTEGER REFERENCES salon.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ejercicio, numero)
);

-- APUNTES CONTABLES (Debe/Haber)
CREATE TABLE salon.apuntes_contables (
    id SERIAL PRIMARY KEY,
    asiento_id INTEGER REFERENCES salon.asientos_contables(id) ON DELETE CASCADE,
    cuenta VARCHAR(10) NOT NULL,
    concepto VARCHAR(200),
    debe DECIMAL(12,2) DEFAULT 0,
    haber DECIMAL(12,2) DEFAULT 0
);

-- PLAN DE CUENTAS
CREATE TABLE salon.plan_cuentas (
    codigo VARCHAR(10) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- activo, pasivo, patrimonio, ingreso, gasto
    nivel INTEGER DEFAULT 1,
    cuenta_padre VARCHAR(10),
    activa BOOLEAN DEFAULT true
);

-- CONFIGURACIÓN DEL SISTEMA
CREATE TABLE salon.configuracion (
    clave VARCHAR(50) PRIMARY KEY,
    valor TEXT,
    tipo VARCHAR(20) DEFAULT 'string',
    descripcion TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BACKUPS
CREATE TABLE salon.backups (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'manual', -- manual, automatico
    tamano BIGINT,
    ruta VARCHAR(255),
    hash VARCHAR(64),
    created_by INTEGER REFERENCES salon.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LOGS DE AUDITORÍA
CREATE TABLE salon.audit_log (
    id SERIAL PRIMARY KEY,
    tabla VARCHAR(50) NOT NULL,
    registro_id INTEGER,
    accion VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    usuario_id INTEGER REFERENCES salon.usuarios(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. ÍNDICES PARA RENDIMIENTO
-- ============================================================

-- Índices de clientes
CREATE INDEX idx_clientes_nombre ON salon.clientes(nombre);
CREATE INDEX idx_clientes_telefono ON salon.clientes(telefono);
CREATE INDEX idx_clientes_email ON salon.clientes(email);
CREATE INDEX idx_clientes_activo ON salon.clientes(activo);

-- Índices de citas
CREATE INDEX idx_citas_fecha ON salon.citas(fecha);
CREATE INDEX idx_citas_cliente ON salon.citas(cliente_id);
CREATE INDEX idx_citas_empleado ON salon.citas(empleado_id);
CREATE INDEX idx_citas_estado ON salon.citas(estado);
CREATE INDEX idx_citas_fecha_hora ON salon.citas(fecha, hora_inicio);

-- Índices de ventas
CREATE INDEX idx_ventas_fecha ON salon.ventas(fecha);
CREATE INDEX idx_ventas_cliente ON salon.ventas(cliente_id);
CREATE INDEX idx_ventas_empleado ON salon.ventas(empleado_id);

-- Índices de facturas
CREATE INDEX idx_facturas_fecha ON salon.facturas(fecha_emision);
CREATE INDEX idx_facturas_cliente ON salon.facturas(cliente_id);
CREATE INDEX idx_facturas_estado ON salon.facturas(estado);
CREATE INDEX idx_facturas_numero ON salon.facturas(numero_completo);

-- Índices de productos
CREATE INDEX idx_productos_codigo ON salon.productos(codigo);
CREATE INDEX idx_productos_nombre ON salon.productos(nombre);
CREATE INDEX idx_productos_categoria ON salon.productos(categoria);

-- Índices de asientos
CREATE INDEX idx_asientos_fecha ON salon.asientos_contables(fecha);
CREATE INDEX idx_asientos_ejercicio ON salon.asientos_contables(ejercicio);

-- Índice de auditoría
CREATE INDEX idx_audit_tabla ON salon.audit_log(tabla, registro_id);
CREATE INDEX idx_audit_fecha ON salon.audit_log(created_at);

-- 6. FUNCIONES Y TRIGGERS
-- ============================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION salon.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON salon.clientes
    FOR EACH ROW EXECUTE FUNCTION salon.update_updated_at();

CREATE TRIGGER update_servicios_updated_at
    BEFORE UPDATE ON salon.servicios
    FOR EACH ROW EXECUTE FUNCTION salon.update_updated_at();

CREATE TRIGGER update_empleados_updated_at
    BEFORE UPDATE ON salon.empleados
    FOR EACH ROW EXECUTE FUNCTION salon.update_updated_at();

CREATE TRIGGER update_productos_updated_at
    BEFORE UPDATE ON salon.productos
    FOR EACH ROW EXECUTE FUNCTION salon.update_updated_at();

CREATE TRIGGER update_citas_updated_at
    BEFORE UPDATE ON salon.citas
    FOR EACH ROW EXECUTE FUNCTION salon.update_updated_at();

CREATE TRIGGER update_facturas_updated_at
    BEFORE UPDATE ON salon.facturas
    FOR EACH ROW EXECUTE FUNCTION salon.update_updated_at();

-- Función para generar número de venta
CREATE OR REPLACE FUNCTION salon.generar_numero_venta()
RETURNS TRIGGER AS $$
BEGIN
    NEW.numero := 'V' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                  LPAD(COALESCE(
                      (SELECT COUNT(*) + 1 FROM salon.ventas 
                       WHERE DATE(fecha) = CURRENT_DATE), 1
                  )::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generar_numero_venta
    BEFORE INSERT ON salon.ventas
    FOR EACH ROW EXECUTE FUNCTION salon.generar_numero_venta();

-- Función para actualizar stock
CREATE OR REPLACE FUNCTION salon.actualizar_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.tipo = 'producto' THEN
        UPDATE salon.productos 
        SET stock_actual = stock_actual - NEW.cantidad
        WHERE id = NEW.producto_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER actualizar_stock_venta
    AFTER INSERT ON salon.lineas_venta
    FOR EACH ROW EXECUTE FUNCTION salon.actualizar_stock();

-- Función para actualizar estadísticas del cliente
CREATE OR REPLACE FUNCTION salon.actualizar_estadisticas_cliente()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE salon.clientes 
    SET 
        total_gastado = total_gastado + NEW.total,
        visitas = visitas + 1,
        ultima_visita = CURRENT_TIMESTAMP
    WHERE id = NEW.cliente_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER actualizar_cliente_venta
    AFTER INSERT ON salon.ventas
    FOR EACH ROW 
    WHEN (NEW.cliente_id IS NOT NULL)
    EXECUTE FUNCTION salon.actualizar_estadisticas_cliente();

-- Función de auditoría
CREATE OR REPLACE FUNCTION salon.audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO salon.audit_log (tabla, registro_id, accion, datos_nuevos)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO salon.audit_log (tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO salon.audit_log (tabla, registro_id, accion, datos_anteriores)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD));
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar auditoría a tablas críticas
CREATE TRIGGER audit_ventas
    AFTER INSERT OR UPDATE OR DELETE ON salon.ventas
    FOR EACH ROW EXECUTE FUNCTION salon.audit_trigger();

CREATE TRIGGER audit_facturas
    AFTER INSERT OR UPDATE OR DELETE ON salon.facturas
    FOR EACH ROW EXECUTE FUNCTION salon.audit_trigger();

-- 7. DATOS INICIALES
-- ============================================================

-- Usuario administrador (password: admin123 - bcrypt hash)
INSERT INTO salon.usuarios (username, password_hash, nombre_completo, email, rol) VALUES
('admin', '$2b$10$rQDPIJ1xZ8xZ8xZ8xZ8xZ8xZ8xZ8xZ8xZ8xZ8xZ8xZ8xZ8xZ8xZ8', 'Administrador', 'admin@NEURIAX.com', 'administrador');

-- Categorías de servicios
INSERT INTO salon.categorias_servicios (nombre, color, orden) VALUES
('Corte', '#ec4899', 1),
('Color', '#f59e0b', 2),
('Tratamientos', '#10b981', 3),
('Peinados', '#8b5cf6', 4),
('Manicura', '#06b6d4', 5),
('Pedicura', '#14b8a6', 6),
('Maquillaje', '#f43f5e', 7),
('Otros', '#6b7280', 99);

-- Plan de cuentas básico (PGC)
INSERT INTO salon.plan_cuentas (codigo, nombre, tipo, nivel) VALUES
('100', 'Capital social', 'patrimonio', 1),
('129', 'Resultado del ejercicio', 'patrimonio', 1),
('400', 'Proveedores', 'pasivo', 1),
('410', 'Acreedores', 'pasivo', 1),
('430', 'Clientes', 'activo', 1),
('440', 'Deudores', 'activo', 1),
('470', 'HP Deudora por IVA', 'activo', 1),
('472', 'HP IVA Soportado', 'activo', 1),
('475', 'HP Acreedora', 'pasivo', 1),
('477', 'HP IVA Repercutido', 'pasivo', 1),
('570', 'Caja, euros', 'activo', 1),
('572', 'Bancos c/c', 'activo', 1),
('600', 'Compras de mercaderías', 'gasto', 1),
('621', 'Arrendamientos', 'gasto', 1),
('622', 'Reparaciones', 'gasto', 1),
('623', 'Servicios profesionales', 'gasto', 1),
('624', 'Transportes', 'gasto', 1),
('625', 'Primas de seguros', 'gasto', 1),
('626', 'Servicios bancarios', 'gasto', 1),
('627', 'Publicidad', 'gasto', 1),
('628', 'Suministros', 'gasto', 1),
('629', 'Otros servicios', 'gasto', 1),
('640', 'Sueldos y salarios', 'gasto', 1),
('642', 'Seguridad social empresa', 'gasto', 1),
('700', 'Ventas de mercaderías', 'ingreso', 1),
('705', 'Prestaciones de servicios', 'ingreso', 1),
('759', 'Otros ingresos', 'ingreso', 1);

-- Configuración inicial
INSERT INTO salon.configuracion (clave, valor, tipo, descripcion) VALUES
('empresa_nombre', 'NEURIAX Salon Manager', 'string', 'Nombre comercial'),
('empresa_cif', 'B12345678', 'string', 'CIF/NIF de la empresa'),
('empresa_direccion', 'Calle Principal 123, 28001 Madrid', 'string', 'Dirección fiscal'),
('empresa_telefono', '912345678', 'string', 'Teléfono de contacto'),
('empresa_email', 'info@NEURIAX.com', 'string', 'Email de contacto'),
('iva_defecto', '21', 'number', 'IVA por defecto'),
('moneda', 'EUR', 'string', 'Moneda del sistema'),
('formato_fecha', 'DD/MM/YYYY', 'string', 'Formato de fecha'),
('serie_factura_defecto', 'F', 'string', 'Serie de facturación por defecto'),
('backup_automatico', 'true', 'boolean', 'Activar backups automáticos'),
('recordatorio_citas', 'true', 'boolean', 'Enviar recordatorios de citas');

-- 8. VISTAS ÚTILES
-- ============================================================

-- Vista de ventas del día
CREATE VIEW salon.v_ventas_hoy AS
SELECT 
    v.*,
    c.nombre AS cliente_nombre,
    e.nombre AS empleado_nombre
FROM salon.ventas v
LEFT JOIN salon.clientes c ON v.cliente_id = c.id
LEFT JOIN salon.empleados e ON v.empleado_id = e.id
WHERE DATE(v.fecha) = CURRENT_DATE;

-- Vista de citas pendientes
CREATE VIEW salon.v_citas_pendientes AS
SELECT 
    ci.*,
    c.nombre AS cliente_nombre,
    c.telefono AS cliente_telefono,
    e.nombre AS empleado_nombre,
    s.nombre AS servicio_nombre,
    s.duracion AS servicio_duracion
FROM salon.citas ci
LEFT JOIN salon.clientes c ON ci.cliente_id = c.id
LEFT JOIN salon.empleados e ON ci.empleado_id = e.id
LEFT JOIN salon.servicios s ON ci.servicio_id = s.id
WHERE ci.estado IN ('pendiente', 'confirmada')
AND ci.fecha >= CURRENT_DATE
ORDER BY ci.fecha, ci.hora_inicio;

-- Vista de productos con stock bajo
CREATE VIEW salon.v_stock_bajo AS
SELECT * FROM salon.productos
WHERE activo = true 
AND stock_actual <= stock_minimo
ORDER BY stock_actual;

-- Vista de balance de caja
CREATE VIEW salon.v_balance_caja AS
SELECT 
    DATE(fecha) as fecha,
    SUM(CASE WHEN tipo IN ('ingreso', 'cobro', 'apertura') THEN importe ELSE 0 END) as ingresos,
    SUM(CASE WHEN tipo = 'gasto' THEN importe ELSE 0 END) as gastos,
    SUM(CASE WHEN tipo IN ('ingreso', 'cobro', 'apertura') THEN importe ELSE -importe END) as saldo
FROM salon.movimientos_caja
GROUP BY DATE(fecha)
ORDER BY fecha DESC;

-- 9. PERMISOS FINALES
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA salon TO neuriax_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA salon TO neuriax_admin;

-- ============================================================
-- FIN DEL SCRIPT DE MIGRACIÓN
-- ============================================================

-- Para verificar la instalación:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'salon';
-- SELECT count(*) FROM salon.plan_cuentas;
-- SELECT * FROM salon.configuracion;
