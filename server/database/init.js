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

  // Crear usuario de demo si no existe (usando credenciales demo/admin123)
  const demoExists = db.usuarios.find(u => u.username === 'demo');
  if (!demoExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 12);
    
    db.usuarios.push({
      id: 2,
      username: 'demo',
      password: hashedPassword,
      nombre_completo: 'Demo Profesional',
      email: 'demo@salon.com',
      rol: 'owner',
      activo: 1,
      fecha_creacion: new Date().toISOString(),
      ultimo_acceso: null
    });
    
    saveDatabase();
    
    console.log('✅ Usuario de demo creado:');
    console.log('   Usuario: demo');
    console.log('   Contraseña: admin123');
  }

  // Agregar datos ficticios de 1 año para demostración
  if (!db.clientes_demo || db.clientes_demo.length === 0) {
    // Crear clientes ficticios
    const clientesDemo = [
      { id: 1, nombre: 'María García', telefono: '666111222', email: 'maria@email.com', fecha_registro: new Date(Date.now() - 365*24*60*60*1000).toISOString(), activo: 1 },
      { id: 2, nombre: 'Carmen López', telefono: '666333444', email: 'carmen@email.com', fecha_registro: new Date(Date.now() - 330*24*60*60*1000).toISOString(), activo: 1 },
      { id: 3, nombre: 'Ana Martínez', telefono: '666555666', email: 'ana@email.com', fecha_registro: new Date(Date.now() - 300*24*60*60*1000).toISOString(), activo: 1 },
      { id: 4, nombre: 'Sofía Rodríguez', telefono: '666777888', email: 'sofia@email.com', fecha_registro: new Date(Date.now() - 250*24*60*60*1000).toISOString(), activo: 1 },
      { id: 5, nombre: 'Lorena Fernández', telefono: '666999000', email: 'lorena@email.com', fecha_registro: new Date(Date.now() - 200*24*60*60*1000).toISOString(), activo: 1 },
      { id: 6, nombre: 'Elena Pérez', telefono: '666111333', email: 'elena@email.com', fecha_registro: new Date(Date.now() - 150*24*60*60*1000).toISOString(), activo: 1 },
      { id: 7, nombre: 'Patricia Jiménez', telefono: '666444555', email: 'patricia@email.com', fecha_registro: new Date(Date.now() - 100*24*60*60*1000).toISOString(), activo: 1 },
      { id: 8, nombre: 'Rosa Torres', telefono: '666666777', email: 'rosa@email.com', fecha_registro: new Date(Date.now() - 60*24*60*60*1000).toISOString(), activo: 1 }
    ];
    
    // Crear ventas ficticias de todo el año
    const ventasDemo = [];
    let ventaId = 1;
    for (let mes = 0; mes < 12; mes++) {
      for (let dia = 0; dia < 25; dia++) {
        const fecha = new Date(Date.now() - (365-mes*30-dia)*24*60*60*1000);
        const cliente = clientesDemo[Math.floor(Math.random() * clientesDemo.length)];
        const monto = 20 + Math.floor(Math.random() * 100);
        const metodos = ['efectivo', 'tarjeta', 'transferencia'];
        
        ventasDemo.push({
          id: ventaId++,
          cliente_id: cliente.id,
          fecha: fecha.toISOString(),
          monto: monto,
          metodo_pago: metodos[Math.floor(Math.random() * metodos.length)],
          descripcion: ['Corte', 'Tinte', 'Mechas', 'Alisado', 'Peinado'][Math.floor(Math.random() * 5)],
          estado: 'completada'
        });
      }
    }

    // Crear citas ficticias de todo el año
    const citasDemo = [];
    let citaId = 1;
    for (let mes = 0; mes < 12; mes++) {
      for (let dia = 0; dia < 20; dia++) {
        const fecha = new Date(Date.now() - (365-mes*30-dia)*24*60*60*1000);
        const cliente = clientesDemo[Math.floor(Math.random() * clientesDemo.length)];
        const servicios = ['Corte', 'Tinte Completo', 'Mechas', 'Alisado', 'Peinado'];
        
        citasDemo.push({
          id: citaId++,
          cliente_id: cliente.id,
          fecha: fecha.toISOString().split('T')[0],
          hora: '09:00,10:00,11:00,14:00,15:00'[Math.floor(Math.random() * 5)],
          duracion: [30, 60, 120][Math.floor(Math.random() * 3)],
          servicio: servicios[Math.floor(Math.random() * servicios.length)],
          estado: ['completada', 'cancelada', 'no_asistio'][Math.floor(Math.random() * 3)],
          monto: 20 + Math.floor(Math.random() * 80)
        });
      }
    }

    db.clientes_demo = clientesDemo;
    db.ventas_demo = ventasDemo;
    db.citas_demo = citasDemo;
    
    saveDatabase();
    console.log('✅ Datos de demo de 1 año agregados');
    console.log(`   - ${clientesDemo.length} clientes ficticios`);
    console.log(`   - ${ventasDemo.length} ventas ficticias`);
    console.log(`   - ${citasDemo.length} citas ficticias`);
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

