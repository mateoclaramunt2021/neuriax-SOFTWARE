/**
 * SEMANA 1 TESTING - Script para probar integración
 * ================================================
 * Ejecutar: node server/testing/semana1-test.js
 */

const fs = require('fs');
const path = require('path');
const twilioService = require('../services/twilioService');
const stripeService = require('../services/stripeService');
const dbService = require('../database/dbService');

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🔬 SEMANA 1 - TEST SUITE');
console.log('═══════════════════════════════════════════════════════════════\n');

let testsPassed = 0;
let testsFailed = 0;

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function logTest(name, success, details = '') {
  const symbol = success ? '✅' : '❌';
  const color = success ? colors.green : colors.red;
  console.log(`${color}${symbol} ${name}${colors.reset}`);
  if (details) console.log(`   ${details}`);
  if (success) testsPassed++;
  else testsFailed++;
}

async function runTests() {
  // ================== TEST 1: TWILIO SERVICE ==================
  console.log(`\n${colors.bold}📱 TEST 1: TWILIO SERVICE${colors.reset}`);
  console.log('───────────────────────────────────────────────────\n');

  try {
    // Test SMS
    const smsResult = await twilioService.sendSMS(
      '+56912345678',
      'Test SMS desde NEURIAX'
    );
    logTest('sendSMS()', smsResult.success, `Mock mode: ${twilioService.mockMode}`);

    // Test recordatorio 24h
    const rec24 = await twilioService.recordatorio24h(
      'Juan Pérez',
      '+56912345678',
      'Corte de Pelo',
      '2025-01-27',
      '14:00'
    );
    logTest('recordatorio24h()', rec24.success);

    // Test recordatorio 1h
    const rec1h = await twilioService.recordatorio1h(
      'Juan Pérez',
      '+56912345678',
      'Corte de Pelo',
      '14:00'
    );
    logTest('recordatorio1h()', rec1h.success);

    // Test confirmación
    const conf = await twilioService.confirmacionReserva(
      'Juan Pérez',
      '+56912345678',
      'Corte de Pelo',
      '2025-01-27',
      '14:00',
      50000
    );
    logTest('confirmacionReserva()', conf.success);

  } catch (error) {
    logTest('TWILIO SERVICE', false, error.message);
  }

  // ================== TEST 2: STRIPE SERVICE ==================
  console.log(`\n${colors.bold}💳 TEST 2: STRIPE SERVICE${colors.reset}`);
  console.log('───────────────────────────────────────────────────\n');

  try {
    // Test crear cliente
    const cliente = await stripeService.crearCliente(
      'Test Cliente',
      'test@neuriax.com',
      '+56912345678',
      { tenantId: 'test', externalId: '123' }
    );
    logTest('crearCliente()', cliente.success, cliente.stripeCustomerId || '');

    // Test Payment Intent
    const intent = await stripeService.crearPaymentIntent(
      5000,
      'cliente_123',
      'cita_456',
      'test@neuriax.com',
      { servicioNombre: 'Test Corte' }
    );
    logTest('crearPaymentIntent()', intent.success, intent.intentId || '');

    // Test sesión checkout
    const sesion = await stripeService.crearSesionCheckout(
      [{ nombre: 'Corte', precio: 50, cantidad: 1 }],
      'cliente_123',
      'http://localhost:3000/success',
      'http://localhost:3000/cancel'
    );
    logTest('crearSesionCheckout()', sesion.success, sesion.sessionId || '');

    // Test obtener métodos de pago (cliente no existe, por eso fallará)
    if (cliente.stripeCustomerId) {
      const metodos = await stripeService.obtenerMetodosPago(cliente.stripeCustomerId);
      logTest('obtenerMetodosPago()', metodos.success);
    }

  } catch (error) {
    logTest('STRIPE SERVICE', false, error.message);
  }

  // ================== TEST 3: DATABASE SERVICE ==================
  console.log(`\n${colors.bold}💾 TEST 3: DATABASE SERVICE${colors.reset}`);
  console.log('───────────────────────────────────────────────────\n');

  try {
    // Test escribir JSON
    const testData = {
      test_cita_semana1: {
        id: 'test_123',
        clienteId: 'cli_456',
        fecha: '2025-01-27',
        hora: '14:00',
        servicio: 'Corte',
        montoCobrado: 50000,
        pagado: false,
        recordado24h: false,
        recordado1h: false
      }
    };

    dbService.writeJSON('test_semana1.json', testData);
    logTest('writeJSON()', true);

    // Test leer JSON
    const readData = dbService.readJSON('test_semana1.json');
    logTest('readJSON()', readData && readData.test_cita_semana1 ? true : false);

    // Test eliminar archivo de test
    const testFile = path.join(__dirname, '../database/test_semana1.json');
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
      logTest('cleanup()', true);
    }

  } catch (error) {
    logTest('DATABASE SERVICE', false, error.message);
  }

  // ================== TEST 4: REMINDER SCHEDULER ==================
  console.log(`\n${colors.bold}⏰ TEST 4: REMINDER SCHEDULER${colors.reset}`);
  console.log('───────────────────────────────────────────────────\n');

  try {
    const schedulerFile = path.join(__dirname, '../schedulers/reminderScheduler.js');
    const exists = fs.existsSync(schedulerFile);
    logTest('reminderScheduler.js exists', exists);

    if (exists) {
      const content = fs.readFileSync(schedulerFile, 'utf8');
      const hasCron1 = content.includes('CRON-24h');
      const hasCron2 = content.includes('CRON-1h');
      const hasCleanup = content.includes('CRON-CLEANUP');

      logTest('CRON-24h implementado', hasCron1);
      logTest('CRON-1h implementado', hasCron2);
      logTest('CRON-CLEANUP implementado', hasCleanup);
    }

  } catch (error) {
    logTest('REMINDER SCHEDULER', false, error.message);
  }

  // ================== TEST 5: ROUTES CONFIGURATION ==================
  console.log(`\n${colors.bold}🛣️  TEST 5: ROUTES CONFIGURATION${colors.reset}`);
  console.log('───────────────────────────────────────────────────\n');

  try {
    const stripeRoutesFile = path.join(__dirname, '../routes/stripe.js');
    const cambioCitasFile = path.join(__dirname, '../routes/cambio-citas.js');
    const indexFile = path.join(__dirname, '../index.js');

    logTest('stripe.js exists', fs.existsSync(stripeRoutesFile));
    logTest('cambio-citas.js exists', fs.existsSync(cambioCitasFile));

    const indexContent = fs.readFileSync(indexFile, 'utf8');
    logTest('Routes imported in index.js', 
      indexContent.includes('stripeRouter') && indexContent.includes('cambioCitasRouter')
    );
    logTest('Routes registered with app.use', 
      indexContent.includes('/api/stripe') && indexContent.includes('/api/citas/cambio')
    );

  } catch (error) {
    logTest('ROUTES CONFIGURATION', false, error.message);
  }

  // ================== RESUMEN ==================
  console.log(`\n${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}📊 RESULTADOS:${colors.reset}`);
  console.log(`   ${colors.green}✅ PASSED: ${testsPassed}${colors.reset}`);
  console.log(`   ${colors.red}❌ FAILED: ${testsFailed}${colors.reset}`);
  console.log(`   ${colors.yellow}📈 SUCCESS RATE: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%${colors.reset}`);
  console.log(`${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  // Instrucciones siguientes
  console.log(`${colors.bold}🚀 PRÓXIMOS PASOS:${colors.reset}\n`);
  console.log(`1. ${colors.blue}Configurar variables de entorno${colors.reset}`);
  console.log(`   - Editar server/.env`);
  console.log(`   - Agregar TWILIO_ACCOUNT_SID`);
  console.log(`   - Agregar TWILIO_AUTH_TOKEN`);
  console.log(`   - Agregar STRIPE_SECRET_KEY`);
  console.log(`   - Agregar STRIPE_PUBLIC_KEY\n`);

  console.log(`2. ${colors.blue}Iniciar servidor${colors.reset}`);
  console.log(`   - cd server`);
  console.log(`   - node index.js\n`);

  console.log(`3. ${colors.blue}Probar endpoints${colors.reset}`);
  console.log(`   - POST /api/stripe/payment-intent`);
  console.log(`   - POST /api/public/citas/cambio-cita`);
  console.log(`   - POST /api/public/citas/solicitar-cambio\n`);

  console.log(`4. ${colors.blue}Monitorear logs${colors.reset}`);
  console.log(`   - Verificar SMS enviados en Twilio Console`);
  console.log(`   - Verificar Pagos en Stripe Dashboard\n`);
}

// Ejecutar tests
runTests().catch(error => {
  console.error('Error ejecutando tests:', error);
  process.exit(1);
});
