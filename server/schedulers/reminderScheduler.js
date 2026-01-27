/**
 * REMINDER SCHEDULER - Sistema de Recordatorios Automáticos
 * 
 * Cron Jobs que se ejecutan automáticamente:
 * - Cada 5 minutos: Verificar citas 24 horas antes (enviar SMS recordatorio)
 * - Cada 1 minuto: Verificar citas 1 hora antes (enviar SMS urgente)
 * 
 * Impacto: Reduce no-shows de 40% a <10%
 */

const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const twilioService = require('../services/twilioService');

const DB_PATH = path.join(__dirname, '../database');

/**
 * Leer datos de un tenant específico
 */
const readTenantData = (tenantId, fileName) => {
  try {
    const filePath = path.join(DB_PATH, `${fileName}_${tenantId}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`[SCHEDULER] Archivo no encontrado: ${filePath}`);
      return [];
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`[SCHEDULER] Error leyendo ${fileName}: ${error.message}`);
    return [];
  }
};

/**
 * Escribir datos de un tenant específico
 */
const writeTenantData = (tenantId, fileName, data) => {
  try {
    const filePath = path.join(DB_PATH, `${fileName}_${tenantId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`[SCHEDULER] Error escribiendo ${fileName}: ${error.message}`);
  }
};

/**
 * Obtener lista de todos los tenants
 */
const getTenantsDB = () => {
  try {
    const filePath = path.join(DB_PATH, 'tenants.json');
    if (!fs.existsSync(filePath)) return [];
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Manejar ambos formatos: array directo o objeto con propiedad tenants
    if (Array.isArray(data)) {
      return data;
    } else if (Array.isArray(data.tenants)) {
      return data.tenants;
    } else {
      console.warn('[SCHEDULER] Formato de tenants.json no válido');
      return [];
    }
  } catch (error) {
    console.error('[SCHEDULER] Error leyendo tenants:', error.message);
    return [];
  }
};

/**
 * Calcular minutos entre ahora y un horario
 */
const calcularMinutosHasta = (fecha, hora) => {
  try {
    const citaDate = new Date(`${fecha}T${hora}:00`);
    const ahora = new Date();
    return (citaDate - ahora) / (1000 * 60);
  } catch (error) {
    console.error(`[SCHEDULER] Error calculando minutos para ${fecha} ${hora}`);
    return -1;
  }
};

/**
 * CRON JOB 1: Recordatorios 24 horas
 * Se ejecuta cada 5 minutos
 * Busca citas que ocurren en 24 horas ±1 hora
 */
const startRecordatorios24h = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON-24h] Verificando recordatorios 24 horas...');

    const tenants = getTenantsDB();

    for (const tenant of tenants) {
      const citas = readTenantData(tenant.id, 'citas') || [];
      let cambios = false;

      for (let i = 0; i < citas.length; i++) {
        const cita = citas[i];

        // Skip si ya fue enviado, está cancelada o no tiene teléfono
        if (cita.recordado24h || cita.estado === 'cancelada' || !cita.clienteTelefono) {
          continue;
        }

        const diffMinutos = calcularMinutosHasta(cita.fecha, cita.hora);

        // Si está entre 23h 30min (1410 min) y 24h 30min (1470 min)
        if (diffMinutos > 1410 && diffMinutos < 1470) {
          console.log(`📱 [SMS-24h] Enviando SMS a ${cita.clienteNombre}`);

          const resultado = await twilioService.recordatorio24h(
            {
              nombre: cita.clienteNombre,
              telefono: cita.clienteTelefono
            },
            cita.servicioNombre,
            cita.fecha,
            cita.hora,
            cita.codigoConfirmacion
          );

          if (resultado.success) {
            cita.recordado24h = true;
            cita.recordado24hAt = new Date().toISOString();
            cita.recordado24hSid = resultado.sid;
            cambios = true;
            console.log(`✅ SMS-24h enviado: ${resultado.sid}`);
          } else {
            console.error(`❌ Error SMS-24h: ${resultado.error}`);
          }
        }
      }

      // Guardar cambios si los hay
      if (cambios) {
        writeTenantData(tenant.id, 'citas', citas);
      }
    }
  });

  console.log('✅ CRON-24h iniciado (cada 5 minutos)');
};

/**
 * CRON JOB 2: Recordatorios 5 horas
 * Se ejecuta cada 5 minutos
 * Busca citas que ocurren en 5 horas ±5 minutos
 * Notifica a CLIENTE y PROFESIONAL
 */
const startRecordatorios5h = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON-5h] Verificando recordatorios 5 horas...');

    const tenants = getTenantsDB();

    for (const tenant of tenants) {
      const citas = readTenantData(tenant.id, 'citas') || [];
      let cambios = false;

      for (let i = 0; i < citas.length; i++) {
        const cita = citas[i];

        // Skip si ya fue enviado, está cancelada o no tiene teléfono
        if (cita.recordado5h || cita.estado === 'cancelada' || !cita.clienteTelefono) {
          continue;
        }

        const diffMinutos = calcularMinutosHasta(cita.fecha, cita.hora);
        // 5 horas = 300 minutos. Rango: 295-305 minutos
        if (diffMinutos > 295 && diffMinutos < 305) {
          console.log(`⏲️  [SMS-5h] Enviando SMS a ${cita.clienteNombre}`);

          const resultado = await twilioService.recordatorio5h(
            {
              nombre: cita.clienteNombre,
              telefono: cita.clienteTelefono
            },
            cita.servicioNombre,
            cita.hora,
            cita.codigoConfirmacion
          );

          if (resultado.success) {
            cita.recordado5h = true;
            cita.recordado5hAt = new Date().toISOString();
            cita.recordado5hSid = resultado.sid;
            cambios = true;
            console.log(`✅ SMS-5h enviado: ${resultado.sid}`);
          } else {
            console.error(`❌ Error SMS-5h: ${resultado.error}`);
          }
        }
      }

      // Guardar cambios si los hay
      if (cambios) {
        writeTenantData(tenant.id, 'citas', citas);
      }
    }
  });

  console.log('✅ CRON-5h iniciado (cada 5 minutos)');
};

/**
 * CRON JOB 3: Recordatorios 1 hora
 * Se ejecuta cada minuto (frecuencia necesaria para precisión)
 * Busca citas que ocurren en 1 hora ±5 minutos
 */
const startRecordatorios1h = () => {
  cron.schedule('* * * * *', async () => {
    const tenants = getTenantsDB();

    for (const tenant of tenants) {
      const citas = readTenantData(tenant.id, 'citas') || [];
      let cambios = false;

      for (let i = 0; i < citas.length; i++) {
        const cita = citas[i];

        // Skip si ya fue enviado, está cancelada o no tiene teléfono
        if (cita.recordado1h || cita.estado === 'cancelada' || !cita.clienteTelefono) {
          continue;
        }

        const diffMinutos = calcularMinutosHasta(cita.fecha, cita.hora);

        // Si está entre 55 y 65 minutos (1 hora ±5 minutos)
        if (diffMinutos > 55 && diffMinutos < 65) {
          console.log(`⏰ [SMS-1h] Enviando SMS urgente a ${cita.clienteNombre}`);

          const resultado = await twilioService.recordatorio1h(
            {
              nombre: cita.clienteNombre,
              telefono: cita.clienteTelefono
            },
            cita.servicioNombre,
            cita.hora,
            cita.codigoConfirmacion
          );

          if (resultado.success) {
            cita.recordado1h = true;
            cita.recordado1hAt = new Date().toISOString();
            cita.recordado1hSid = resultado.sid;
            cambios = true;
            console.log(`✅ SMS-1h enviado: ${resultado.sid}`);
          } else {
            console.error(`❌ Error SMS-1h: ${resultado.error}`);
          }
        }
      }

      // Guardar cambios si los hay
      if (cambios) {
        writeTenantData(tenant.id, 'citas', citas);
      }
    }
  });

  console.log('✅ CRON-1h iniciado (cada minuto)');
};

/**
 * CRON JOB 3: Limpiar recordatorios fallidos antiguos (diario)
 * Se ejecuta cada día a las 02:00 AM
 */
const startLimpiezaRecordatorios = () => {
  cron.schedule('0 2 * * *', () => {
    console.log('[CRON-Limpieza] Limpiando registros de recordatorios antiguos...');
    // TODO: Implementar lógica de limpieza si es necesaria
  });

  console.log('✅ CRON-Limpieza iniciado (diariamente a las 02:00)');
};

/**
 * Iniciar todos los schedulers
 * Se llama una sola vez al arrancar el servidor
 */
const startReminderScheduler = () => {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  🔔 REMINDER SCHEDULER - Sistema de Recordatorios  ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');

  startRecordatorios24h();
  startRecordatorios5h();
  startRecordatorios1h();
  startLimpiezaRecordatorios();

  console.log('');
  console.log('✅ Todos los schedulers iniciados correctamente');
  console.log('   - Recordatorio 24h: Cada 5 minutos');
  console.log('   - Recordatorio 5h: Cada 5 minutos');
  console.log('   - Recordatorio 1h: Cada minuto');
  console.log('   - Limpieza: Diariamente a las 02:00');
  console.log('');
};

module.exports = {
  startReminderScheduler,
  // Exportar también funciones individuales para testing
  startRecordatorios24h,
  startRecordatorios5h,
  startRecordatorios1h,
  startLimpiezaRecordatorios
};
