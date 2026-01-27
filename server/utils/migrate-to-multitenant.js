#!/usr/bin/env node
/**
 * Script de migración a arquitectura Multi-Tenant
 * Agrega tenant_id = "demo" a todos los registros existentes
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/database.json');

try {
  // Leer base de datos actual
  let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // Agregar tenant_id a todas las entidades
  db.clientes = db.clientes.map(c => ({ tenant_id: 'demo', ...c }));
  db.servicios = db.servicios.map(s => ({ tenant_id: 'demo', ...s }));
  db.ventas = db.ventas.map(v => ({ tenant_id: 'demo', ...v }));
  db.empleados = db.empleados.map(e => ({ tenant_id: 'demo', ...e }));
  db.cajas = db.cajas.map(c => ({ tenant_id: 'demo', ...c }));
  db.usuarios = db.usuarios.map(u => ({ tenant_id: 'demo', ...u }));

  // Guardar cambios
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');

  console.log('\n✓ PASO 5 - MIGRACIÓN MULTI-TENANT COMPLETADA\n');
  console.log('  Tenant ID "demo" agregado a:');
  console.log(`   - Clientes: ${db.clientes.length} registros`);
  console.log(`   - Servicios: ${db.servicios.length} registros`);
  console.log(`   - Ventas: ${db.ventas.length} registros`);
  console.log(`   - Empleados: ${db.empleados.length} registros`);
  console.log(`   - Usuarios: ${db.usuarios.length} registros`);
  console.log(`   - Cajas: ${db.cajas.length} registros`);
  console.log(`\n  Tablas multi-tenant creadas:`);
  console.log(`   - tenants: ${db.tenants.length} registro`);
  console.log(`   - platform_users: ${db.platform_users.length} registro`);
  console.log(`   - subscriptions: ${db.subscriptions.length} registro`);
  console.log(`   - tenant_users: ${db.tenant_users.length} registros\n`);

} catch (error) {
  console.error('✗ Error en migración:', error.message);
  process.exit(1);
}
