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

  if (db.clientes.length === 0) {
    db.clientes = [
      { id: 1, nombre: 'María García', telefono: '666111222', email: 'maria@email.com', fecha_registro: new Date().toISOString(), activo: 1 },
      { id: 2, nombre: 'Carmen López', telefono: '666333444', email: 'carmen@email.com', fecha_registro: new Date().toISOString(), activo: 1 },
      { id: 3, nombre: 'Ana Martínez', telefono: '666555666', email: 'ana@email.com', fecha_registro: new Date().toISOString(), activo: 1 }
    ];
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

