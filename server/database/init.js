const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.json');

// Estructura de base de datos
let db = {
  usuarios: [],
  sesiones: [],
  clientes: [],
  servicios: [],
  ventas: [],
  empleados: [],
  cajas: [],
  gastos: [],
  citas: [],
  productos: [],
  movimientos_inventario: [],
  configuracion: {
    nombre_negocio: 'NEURIAX Salon Manager',
    telefono: '',
    email: '',
    direccion: ''
  }
};

// Cargar base de datos
function loadDatabase() {
  if (fs.existsSync(dbPath)) {
    const data = fs.readFileSync(dbPath, 'utf8');
    const loadedDb = JSON.parse(data);
    // Actualizar referencia global de db
    Object.assign(db, loadedDb);
  }
  return db;
}

// Guardar base de datos
function saveDatabase() {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
}

// Obtener referencia actual de db
function getDatabase() {
  return db;
}

// Obtener siguiente ID para un array
function getNextId(array) {
  if (!array || array.length === 0) return 1;
  return Math.max(...array.map(item => item.id || 0)) + 1;
}

function initDatabase() {
  loadDatabase();

  // Verificar si existe usuario administrador
  const adminExists = db.usuarios.find(u => u.rol === 'administrador');
  
  if (!adminExists) {
    // Crear usuario administrador por defecto
    const hashedPassword = bcrypt.hashSync('admin123', 12);
    db.usuarios.push({
      id: 1,
      username: 'admin',
      password: hashedPassword,
      nombre_completo: 'Administrador',
      email: 'admin@NEURIAX.com',
      rol: 'administrador',
      activo: 1,
      fecha_creacion: new Date().toISOString(),
      ultimo_acceso: null
    });
    
    saveDatabase();
    
    console.log('✅ Usuario administrador creado:');
    console.log('   Usuario: admin');
    console.log('   Contraseña: admin123');
  }

  // Datos de ejemplo para demostración
  if (!db.servicios || db.servicios.length === 0) {
    db.servicios = [
      { id: 1, nombre: 'Corte de Cabello', categoria: 'Corte', precio: 15, duracion: 30, activo: 1 },
      { id: 2, nombre: 'Tinte Completo', categoria: 'Tinte', precio: 50, duracion: 120, activo: 1 },
      { id: 3, nombre: 'Mechas', categoria: 'Tinte', precio: 60, duracion: 150, activo: 1 },
      { id: 4, nombre: 'Peinado', categoria: 'Peinado', precio: 25, duracion: 45, activo: 1 },
      { id: 5, nombre: 'Tratamiento Capilar', categoria: 'Tratamiento', precio: 35, duracion: 60, activo: 1 }
    ];
    saveDatabase();
  }

  // Crear usuario profesional de demo si no existe
  const demoProExists = db.usuarios.find(u => u.email === 'demo@profesional.com');
  if (!demoProExists) {
    const hashedPassword = bcrypt.hashSync('demo123', 12);
    const tenantId = 'tenant_demo_pro';
    
    // Fecha de creación hace 5 horas (para que tenga menos de 2 horas de prueba visible)
    const createdAtTime = new Date(Date.now() - 5 * 60 * 60 * 1000);
    
    db.usuarios.push({
      id: 999,
      username: 'demopro',
      password: hashedPassword,
      nombre_completo: 'Demo Profesional',
      nombre_empresa: 'Salón de Belleza Premium Demo',
      email: 'demo@profesional.com',
      telefono: '600123456',
      tipo_usuario: 'profesional',
      rol: 'owner',
      plan: 'trial',
      tenant_id: tenantId,
      tenantId: tenantId,
      dias_prueba: 2,
      activo: 1,
      verificado: 1,
      fecha_creacion: createdAtTime.toISOString(),
      ultimo_acceso: new Date().toISOString(),
      perfil_completado: 1
    });

    // Crear tenant para el profesional de demo
    if (!db.tenants) db.tenants = [];
    db.tenants.push({
      id: tenantId,
      nombre: 'Salón de Belleza Premium Demo',
      plan: 'trial',
      dias_trial: 2,
      activo: 1,
      fecha_creacion: createdAtTime.toISOString()
    });

    // Agregar datos de demo específicos para el profesional
    if (!db.servicios_profesional) db.servicios_profesional = [];
    db.servicios_profesional.push(
      { id: 1, tenant_id: tenantId, nombre: 'Corte de Cabello', precio: 20, duracion: 30, activo: 1 },
      { id: 2, tenant_id: tenantId, nombre: 'Tinte Completo', precio: 60, duracion: 120, activo: 1 },
      { id: 3, tenant_id: tenantId, nombre: 'Mechas Balayage', precio: 80, duracion: 150, activo: 1 },
      { id: 4, tenant_id: tenantId, nombre: 'Alisado Brasileño', precio: 100, duracion: 180, activo: 1 }
    );

    saveDatabase();
    
    console.log('✅ Usuario profesional de demo creado:');
    console.log('   Email: demo@profesional.com');
    console.log('   Contraseña: demo123');
    console.log('   Plan: Trial (2 horas)');
  }

  if (db.clientes.length === 0) {
    db.clientes = [
      { id: 1, nombre: 'María García', telefono: '666111222', email: 'maria@email.com', fecha_registro: new Date().toISOString(), activo: 1 },
      { id: 2, nombre: 'Carmen López', telefono: '666333444', email: 'carmen@email.com', fecha_registro: new Date().toISOString(), activo: 1 },
      { id: 3, nombre: 'Ana Martínez', telefono: '666555666', email: 'ana@email.com', fecha_registro: new Date().toISOString(), activo: 1 },
      // Clientes para el profesional de demo
      { id: 101, tenant_id: 'tenant_demo_pro', nombre: 'Sofía Rodríguez', telefono: '601234567', email: 'sofia@email.com', fecha_registro: new Date().toISOString(), activo: 1 },
      { id: 102, tenant_id: 'tenant_demo_pro', nombre: 'Lorena Fernández', telefono: '601234568', email: 'lorena@email.com', fecha_registro: new Date().toISOString(), activo: 1 },
      { id: 103, tenant_id: 'tenant_demo_pro', nombre: 'Elena Pérez', telefono: '601234569', email: 'elena@email.com', fecha_registro: new Date().toISOString(), activo: 1 },
      { id: 104, tenant_id: 'tenant_demo_pro', nombre: 'Patricia Jiménez', telefono: '601234570', email: 'patricia@email.com', fecha_registro: new Date().toISOString(), activo: 1 }
    ];
    
    // Agregar citas de demo
    if (!db.citas) db.citas = [];
    const hoy = new Date();
    const mañana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000);
    
    db.citas.push(
      {
        id: 1,
        tenant_id: 'tenant_demo_pro',
        cliente_id: 101,
        servicio_id: 1,
        fecha: mañana.toISOString().split('T')[0],
        hora: '10:00',
        duracion: 30,
        estado: 'confirmada',
        notas: 'Corte estilo bob',
        fecha_creacion: new Date().toISOString()
      },
      {
        id: 2,
        tenant_id: 'tenant_demo_pro',
        cliente_id: 102,
        servicio_id: 2,
        fecha: mañana.toISOString().split('T')[0],
        hora: '14:00',
        duracion: 120,
        estado: 'confirmada',
        notas: 'Tinte cobertura completa',
        fecha_creacion: new Date().toISOString()
      },
      {
        id: 3,
        tenant_id: 'tenant_demo_pro',
        cliente_id: 103,
        servicio_id: 3,
        fecha: hoy.toISOString().split('T')[0],
        hora: '11:30',
        duracion: 150,
        estado: 'completada',
        notas: 'Mechas balayage',
        fecha_creacion: new Date().toISOString()
      }
    );
    
    // Agregar ventas de demo
    if (!db.ventas) db.ventas = [];
    db.ventas.push(
      {
        id: 1,
        tenant_id: 'tenant_demo_pro',
        cliente_id: 101,
        fecha: hoy.toISOString(),
        monto: 20,
        metodo_pago: 'efectivo',
        descripcion: 'Corte de cabello',
        estado: 'completada'
      },
      {
        id: 2,
        tenant_id: 'tenant_demo_pro',
        cliente_id: 103,
        fecha: hoy.toISOString(),
        monto: 80,
        metodo_pago: 'tarjeta',
        descripcion: 'Mechas Balayage',
        estado: 'completada'
      }
    );
    
    saveDatabase();
  }

  if (db.empleados.length === 0) {
    db.empleados = [
      { 
        id: 1, 
        nombre: 'Ana García', 
        telefono: '666777888', 
        email: 'ana@neuriax.com',
        cargo: 'Estilista Senior',
        comision_porcentaje: 40,
        horario: { lunes: '09:00-18:00', martes: '09:00-18:00', miercoles: '09:00-18:00', jueves: '09:00-18:00', viernes: '09:00-18:00', sabado: '10:00-14:00', domingo: 'Cerrado' },
        servicios_asignados: [1, 2, 3, 4, 5],
        fecha_contratacion: new Date().toISOString(),
        activo: 1
      },
      { 
        id: 2, 
        nombre: 'Laura Sánchez', 
        telefono: '666999000', 
        email: 'laura@neuriax.com',
        cargo: 'Estilista',
        comision_porcentaje: 30,
        horario: { lunes: '09:00-18:00', martes: '09:00-18:00', miercoles: '09:00-18:00', jueves: '09:00-18:00', viernes: '09:00-18:00', sabado: 'Cerrado', domingo: 'Cerrado' },
        servicios_asignados: [1, 4],
        fecha_contratacion: new Date().toISOString(),
        activo: 1
      }
    ];
    saveDatabase();
  }

  console.log('✅ Base de datos inicializada correctamente');
}

module.exports = { getDatabase, getNextId, initDatabase, saveDatabase, loadDatabase };

