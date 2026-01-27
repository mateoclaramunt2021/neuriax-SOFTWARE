/**
 * SISTEMA DE INFORMES AUTOMÁTICOS
 * NEURIAX Salon Manager
 * 
 * Genera y envía informes por email:
 * - Diario: Resumen del día
 * - Semanal: Resumen de la semana
 * - Mensual: Resumen del mes
 * - Trimestral: Resumen del trimestre
 * - Anual: Resumen del año
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Cargar configuración desde archivo externo
let configEmail;
try {
  configEmail = require('../config/config-email.js');
  // Transformar al formato esperado
  configEmail = {
    servicio: 'gmail',
    email_origen: configEmail.smtp?.auth?.user || 'neuriaxx@gmail.com',
    password: configEmail.smtp?.auth?.pass || '',
    emails_destino: [configEmail.smtp?.auth?.user || 'neuriaxx@gmail.com'],
    nombre_negocio: 'GestióPro by NEURIAX',
    hora_informe_diario: 21,
    enviar_semanal: true,
    enviar_mensual: true,
    enviar_trimestral: true,
    enviar_anual: true
  };
} catch (e) {
  console.log('⚠️ config-email.js no encontrado. Informes automáticos en modo simulación.');
  configEmail = {
    servicio: 'gmail',
    email_origen: 'neuriaxx@gmail.com',
    password: '',
    emails_destino: ['neuriaxx@gmail.com'],
    nombre_negocio: 'GestióPro by NEURIAX',
    hora_informe_diario: 21,
    enviar_semanal: true,
    enviar_mensual: true,
    enviar_trimestral: true,
    enviar_anual: true
  };
}

// Configuración de email desde archivo externo
const EMAIL_CONFIG = {
  servicio: configEmail.servicio,
  email_origen: configEmail.email_origen,
  password: configEmail.password,
  emails_destino: configEmail.emails_destino,
  nombre_negocio: configEmail.nombre_negocio
};

// Ruta de la base de datos
const DB_PATH = path.join(__dirname, '..', 'database', 'database.json');

// Cargar base de datos
function cargarDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error cargando BD:', error);
    return { ventas: [], clientes: [], servicios: [], gastos: [] };
  }
}

// Configurar transporter de email
function crearTransporter() {
  const configs = {
    gmail: {
      service: 'gmail',
      auth: {
        user: EMAIL_CONFIG.email_origen,
        pass: EMAIL_CONFIG.password
      }
    },
    outlook: {
      service: 'hotmail',
      auth: {
        user: EMAIL_CONFIG.email_origen,
        pass: EMAIL_CONFIG.password
      }
    },
    yahoo: {
      service: 'yahoo',
      auth: {
        user: EMAIL_CONFIG.email_origen,
        pass: EMAIL_CONFIG.password
      }
    },
    custom: {
      host: 'smtp.tuservidor.com',
      port: 587,
      secure: false,
      auth: {
        user: EMAIL_CONFIG.email_origen,
        pass: EMAIL_CONFIG.password
      }
    }
  };

  return nodemailer.createTransport(configs[EMAIL_CONFIG.servicio] || configs.gmail);
}

// Formatear moneda
function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(valor || 0);
}

// Formatear fecha
function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// ==================== GENERADORES DE INFORMES ====================

// Generar informe diario
function generarInformeDiario(fecha = new Date()) {
  const db = cargarDB();
  const fechaStr = fecha.toISOString().split('T')[0];
  
  const ventasDia = (db.ventas || []).filter(v => 
    v.fecha && v.fecha.split('T')[0] === fechaStr
  );
  
  const gastosDia = (db.gastos || []).filter(g => 
    g.fecha && g.fecha.split('T')[0] === fechaStr
  );

  const totalVentas = ventasDia.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
  const totalGastos = gastosDia.reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);
  const efectivo = ventasDia.filter(v => v.metodo_pago === 'efectivo').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
  const tarjeta = ventasDia.filter(v => v.metodo_pago === 'tarjeta').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
  const transferencia = ventasDia.filter(v => v.metodo_pago === 'transferencia').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);

  // Servicios más vendidos del día
  const serviciosVendidos = {};
  ventasDia.forEach(v => {
    (v.servicios || []).forEach(s => {
      const nombre = s.nombre || 'Sin nombre';
      serviciosVendidos[nombre] = (serviciosVendidos[nombre] || 0) + (s.cantidad || 1);
    });
  });

  const topServicios = Object.entries(serviciosVendidos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    tipo: 'DIARIO',
    fecha: formatearFecha(fecha),
    resumen: {
      totalVentas,
      cantidadVentas: ventasDia.length,
      totalGastos,
      cantidadGastos: gastosDia.length,
      neto: totalVentas - totalGastos,
      ticketPromedio: ventasDia.length > 0 ? totalVentas / ventasDia.length : 0
    },
    porMetodoPago: { efectivo, tarjeta, transferencia },
    topServicios,
    ventas: ventasDia.map(v => ({
      hora: new Date(v.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      cliente: v.cliente_nombre || 'Cliente',
      total: v.total,
      metodo: v.metodo_pago
    })),
    gastos: gastosDia
  };
}

// Generar informe semanal
function generarInformeSemanal(fecha = new Date()) {
  const db = cargarDB();
  
  // Calcular inicio y fin de semana
  const inicioSemana = new Date(fecha);
  inicioSemana.setDate(fecha.getDate() - fecha.getDay() + 1); // Lunes
  const finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6); // Domingo

  const inicioStr = inicioSemana.toISOString().split('T')[0];
  const finStr = finSemana.toISOString().split('T')[0];

  const ventasSemana = (db.ventas || []).filter(v => {
    if (!v.fecha) return false;
    const fechaVenta = v.fecha.split('T')[0];
    return fechaVenta >= inicioStr && fechaVenta <= finStr;
  });

  const gastosSemana = (db.gastos || []).filter(g => {
    if (!g.fecha) return false;
    const fechaGasto = g.fecha.split('T')[0];
    return fechaGasto >= inicioStr && fechaGasto <= finStr;
  });

  const totalVentas = ventasSemana.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
  const totalGastos = gastosSemana.reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);

  // Por día de la semana
  const porDia = {};
  ventasSemana.forEach(v => {
    const dia = v.fecha.split('T')[0];
    if (!porDia[dia]) porDia[dia] = { ventas: 0, total: 0 };
    porDia[dia].ventas++;
    porDia[dia].total += parseFloat(v.total) || 0;
  });

  return {
    tipo: 'SEMANAL',
    periodo: `${formatearFecha(inicioSemana)} - ${formatearFecha(finSemana)}`,
    resumen: {
      totalVentas,
      cantidadVentas: ventasSemana.length,
      totalGastos,
      neto: totalVentas - totalGastos,
      promedioDiario: totalVentas / 7
    },
    porDia
  };
}

// Generar informe mensual
function generarInformeMensual(fecha = new Date()) {
  const db = cargarDB();
  
  const año = fecha.getFullYear();
  const mes = fecha.getMonth();
  const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  
  const inicioMes = new Date(año, mes, 1);
  const finMes = new Date(año, mes + 1, 0);
  
  const inicioStr = inicioMes.toISOString().split('T')[0];
  const finStr = finMes.toISOString().split('T')[0];

  const ventasMes = (db.ventas || []).filter(v => {
    if (!v.fecha) return false;
    const fechaVenta = v.fecha.split('T')[0];
    return fechaVenta >= inicioStr && fechaVenta <= finStr;
  });

  const gastosMes = (db.gastos || []).filter(g => {
    if (!g.fecha) return false;
    const fechaGasto = g.fecha.split('T')[0];
    return fechaGasto >= inicioStr && fechaGasto <= finStr;
  });

  const totalVentas = ventasMes.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
  const totalGastos = gastosMes.reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);

  // Clientes únicos
  const clientesUnicos = [...new Set(ventasMes.map(v => v.cliente_id))].length;

  // Servicios top
  const serviciosVendidos = {};
  ventasMes.forEach(v => {
    (v.servicios || []).forEach(s => {
      const nombre = s.nombre || 'Sin nombre';
      if (!serviciosVendidos[nombre]) {
        serviciosVendidos[nombre] = { cantidad: 0, ingresos: 0 };
      }
      serviciosVendidos[nombre].cantidad += s.cantidad || 1;
      serviciosVendidos[nombre].ingresos += (parseFloat(s.precio) || 0) * (s.cantidad || 1);
    });
  });

  const topServicios = Object.entries(serviciosVendidos)
    .map(([nombre, data]) => ({ nombre, ...data }))
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 10);

  // Por método de pago
  const efectivo = ventasMes.filter(v => v.metodo_pago === 'efectivo').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
  const tarjeta = ventasMes.filter(v => v.metodo_pago === 'tarjeta').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
  const transferencia = ventasMes.filter(v => v.metodo_pago === 'transferencia').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);

  // Gastos por categoría
  const gastosPorCategoria = {};
  gastosMes.forEach(g => {
    const cat = g.categoria || 'Otros';
    gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + (parseFloat(g.monto) || 0);
  });

  return {
    tipo: 'MENSUAL',
    periodo: nombreMes.toUpperCase(),
    resumen: {
      totalVentas,
      cantidadVentas: ventasMes.length,
      totalGastos,
      neto: totalVentas - totalGastos,
      margen: totalVentas > 0 ? ((totalVentas - totalGastos) / totalVentas * 100).toFixed(1) : 0,
      clientesAtendidos: clientesUnicos,
      ticketPromedio: ventasMes.length > 0 ? totalVentas / ventasMes.length : 0
    },
    porMetodoPago: { efectivo, tarjeta, transferencia },
    topServicios,
    gastosPorCategoria
  };
}

// Generar informe trimestral
function generarInformeTrimestral(fecha = new Date()) {
  const año = fecha.getFullYear();
  const trimestre = Math.floor(fecha.getMonth() / 3);
  
  const meses = [];
  for (let i = 0; i < 3; i++) {
    const mesFecha = new Date(año, trimestre * 3 + i, 15);
    meses.push(generarInformeMensual(mesFecha));
  }

  const totalVentas = meses.reduce((sum, m) => sum + m.resumen.totalVentas, 0);
  const totalGastos = meses.reduce((sum, m) => sum + m.resumen.totalGastos, 0);
  const cantidadVentas = meses.reduce((sum, m) => sum + m.resumen.cantidadVentas, 0);

  return {
    tipo: 'TRIMESTRAL',
    periodo: `Q${trimestre + 1} ${año}`,
    resumen: {
      totalVentas,
      cantidadVentas,
      totalGastos,
      neto: totalVentas - totalGastos,
      margen: totalVentas > 0 ? ((totalVentas - totalGastos) / totalVentas * 100).toFixed(1) : 0
    },
    porMes: meses.map(m => ({
      mes: m.periodo,
      ventas: m.resumen.totalVentas,
      gastos: m.resumen.totalGastos,
      neto: m.resumen.neto
    }))
  };
}

// Generar informe anual
function generarInformeAnual(fecha = new Date()) {
  const año = fecha.getFullYear();
  
  const meses = [];
  for (let i = 0; i < 12; i++) {
    const mesFecha = new Date(año, i, 15);
    meses.push(generarInformeMensual(mesFecha));
  }

  const totalVentas = meses.reduce((sum, m) => sum + m.resumen.totalVentas, 0);
  const totalGastos = meses.reduce((sum, m) => sum + m.resumen.totalGastos, 0);
  const cantidadVentas = meses.reduce((sum, m) => sum + m.resumen.cantidadVentas, 0);

  // Mejor y peor mes
  const mesesOrdenados = [...meses].sort((a, b) => b.resumen.totalVentas - a.resumen.totalVentas);
  const mejorMes = mesesOrdenados[0];
  const peorMes = mesesOrdenados[mesesOrdenados.length - 1];

  return {
    tipo: 'ANUAL',
    periodo: `AÑO ${año}`,
    resumen: {
      totalVentas,
      cantidadVentas,
      totalGastos,
      neto: totalVentas - totalGastos,
      margen: totalVentas > 0 ? ((totalVentas - totalGastos) / totalVentas * 100).toFixed(1) : 0,
      promedioMensual: totalVentas / 12
    },
    mejorMes: { mes: mejorMes.periodo, ventas: mejorMes.resumen.totalVentas },
    peorMes: { mes: peorMes.periodo, ventas: peorMes.resumen.totalVentas },
    porMes: meses.map(m => ({
      mes: m.periodo,
      ventas: m.resumen.totalVentas,
      gastos: m.resumen.totalGastos,
      neto: m.resumen.neto
    }))
  };
}

// ==================== GENERADOR DE HTML ====================

function generarHTMLInforme(informe) {
  const estilos = `
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px; }
      .header h1 { margin: 0; font-size: 24px; }
      .header p { margin: 10px 0 0; opacity: 0.9; }
      .card { background: white; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      .card h2 { color: #333; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
      .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
      .stat-box { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
      .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
      .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
      .positive { color: #28a745 !important; }
      .negative { color: #dc3545 !important; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
      th { background: #f8f9fa; font-weight: 600; }
      .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    </style>
  `;

  let contenido = '';
  
  // Resumen principal
  contenido += `
    <div class="card">
      <h2>📊 Resumen ${informe.tipo}</h2>
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-value positive">${formatearMoneda(informe.resumen.totalVentas)}</div>
          <div class="stat-label">Total Ventas</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${informe.resumen.cantidadVentas}</div>
          <div class="stat-label">Nº Ventas</div>
        </div>
        <div class="stat-box">
          <div class="stat-value negative">${formatearMoneda(informe.resumen.totalGastos)}</div>
          <div class="stat-label">Total Gastos</div>
        </div>
        <div class="stat-box">
          <div class="stat-value ${informe.resumen.neto >= 0 ? 'positive' : 'negative'}">${formatearMoneda(informe.resumen.neto)}</div>
          <div class="stat-label">Beneficio Neto</div>
        </div>
      </div>
    </div>
  `;

  // Por método de pago (si existe)
  if (informe.porMetodoPago) {
    contenido += `
      <div class="card">
        <h2>💳 Por Método de Pago</h2>
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-value">${formatearMoneda(informe.porMetodoPago.efectivo)}</div>
            <div class="stat-label">💵 Efectivo</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${formatearMoneda(informe.porMetodoPago.tarjeta)}</div>
            <div class="stat-label">💳 Tarjeta</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${formatearMoneda(informe.porMetodoPago.transferencia)}</div>
            <div class="stat-label">🏦 Transferencia</div>
          </div>
        </div>
      </div>
    `;
  }

  // Top servicios (si existe)
  if (informe.topServicios && informe.topServicios.length > 0) {
    contenido += `
      <div class="card">
        <h2>✂️ Servicios Más Vendidos</h2>
        <table>
          <tr><th>Servicio</th><th>Cantidad</th><th>Ingresos</th></tr>
          ${informe.topServicios.map(s => `
            <tr>
              <td>${typeof s === 'object' ? s.nombre : s[0]}</td>
              <td>${typeof s === 'object' ? s.cantidad : s[1]}</td>
              <td>${typeof s === 'object' && s.ingresos ? formatearMoneda(s.ingresos) : '-'}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  // Por mes (para trimestrales y anuales)
  if (informe.porMes) {
    contenido += `
      <div class="card">
        <h2>📅 Desglose por Período</h2>
        <table>
          <tr><th>Período</th><th>Ventas</th><th>Gastos</th><th>Neto</th></tr>
          ${informe.porMes.map(m => `
            <tr>
              <td>${m.mes}</td>
              <td class="positive">${formatearMoneda(m.ventas)}</td>
              <td class="negative">${formatearMoneda(m.gastos)}</td>
              <td class="${m.neto >= 0 ? 'positive' : 'negative'}">${formatearMoneda(m.neto)}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      ${estilos}
    </head>
    <body>
      <div class="header">
        <h1>💈 ${EMAIL_CONFIG.nombre_negocio}</h1>
        <p>Informe ${informe.tipo} - ${informe.periodo || informe.fecha}</p>
      </div>
      ${contenido}
      <div class="footer">
        <p>Este informe fue generado automáticamente el ${new Date().toLocaleString('es-ES')}</p>
        <p>Sistema de Gestión - NEURIAX Salon Manager</p>
      </div>
    </body>
    </html>
  `;
}

// ==================== ENVÍO DE EMAIL ====================

async function enviarInforme(tipo, fecha = new Date()) {
  let informe;
  
  switch (tipo) {
    case 'diario':
      informe = generarInformeDiario(fecha);
      break;
    case 'semanal':
      informe = generarInformeSemanal(fecha);
      break;
    case 'mensual':
      informe = generarInformeMensual(fecha);
      break;
    case 'trimestral':
      informe = generarInformeTrimestral(fecha);
      break;
    case 'anual':
      informe = generarInformeAnual(fecha);
      break;
    default:
      informe = generarInformeDiario(fecha);
  }

  const html = generarHTMLInforme(informe);
  
  try {
    const transporter = crearTransporter();
    
    await transporter.sendMail({
      from: `"${EMAIL_CONFIG.nombre_negocio}" <${EMAIL_CONFIG.email_origen}>`,
      to: EMAIL_CONFIG.emails_destino.join(', '),
      subject: `📊 Informe ${informe.tipo} - ${informe.periodo || informe.fecha} | ${EMAIL_CONFIG.nombre_negocio}`,
      html: html
    });

    console.log(`✅ Informe ${tipo} enviado correctamente`);
    return { success: true, mensaje: `Informe ${tipo} enviado` };
  } catch (error) {
    console.error(`❌ Error enviando informe ${tipo}:`, error);
    return { success: false, error: error.message };
  }
}

// ==================== PROGRAMADOR DE TAREAS ====================

function programarInformes() {
  const ahora = new Date();
  
  // Calcular tiempo hasta las 21:00 (9 PM) para el informe diario
  const horaInformeDiario = 21;
  let proximoDiario = new Date(ahora);
  proximoDiario.setHours(horaInformeDiario, 0, 0, 0);
  
  if (ahora >= proximoDiario) {
    proximoDiario.setDate(proximoDiario.getDate() + 1);
  }
  
  const tiempoHastaDiario = proximoDiario - ahora;
  
  console.log(`📅 Próximo informe diario: ${proximoDiario.toLocaleString('es-ES')}`);
  
  // Programar informe diario
  setTimeout(() => {
    enviarInforme('diario');
    // Reprogramar para el día siguiente
    setInterval(() => enviarInforme('diario'), 24 * 60 * 60 * 1000);
  }, tiempoHastaDiario);

  // Verificar si es fin de semana, mes, trimestre o año
  const verificarInformesEspeciales = () => {
    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const diaDelMes = hoy.getDate();
    const mes = hoy.getMonth();
    
    // Domingo = informe semanal
    if (diaSemana === 0) {
      enviarInforme('semanal');
    }
    
    // Último día del mes = informe mensual
    const ultimoDiaMes = new Date(hoy.getFullYear(), mes + 1, 0).getDate();
    if (diaDelMes === ultimoDiaMes) {
      enviarInforme('mensual');
      
      // Fin de trimestre (marzo, junio, septiembre, diciembre)
      if ([2, 5, 8, 11].includes(mes)) {
        enviarInforme('trimestral');
      }
      
      // Fin de año (diciembre)
      if (mes === 11) {
        enviarInforme('anual');
      }
    }
  };

  // Verificar diariamente a las 21:30
  setTimeout(() => {
    verificarInformesEspeciales();
    setInterval(verificarInformesEspeciales, 24 * 60 * 60 * 1000);
  }, tiempoHastaDiario + 30 * 60 * 1000);

  console.log('✅ Sistema de informes automáticos activado');
}

// Función alias para iniciar el programador
function iniciarProgramador() {
  return programarInformes();
}

// Exportar funciones
module.exports = {
  generarInformeDiario,
  generarInformeSemanal,
  generarInformeMensual,
  generarInformeTrimestral,
  generarInformeAnual,
  enviarInforme,
  programarInformes,
  iniciarProgramador,
  EMAIL_CONFIG
};
