/**
 * SERVICIO DE EMAIL PROFESIONAL - NEURIAX SALON MANAGER
 * Sistema completo de emails transaccionales
 * 
 * Funcionalidades:
 * - Plantillas HTML profesionales
 * - Verificación de email
 * - Recuperación de contraseña
 * - Confirmación de citas
 * - Recordatorios automáticos
 * - Facturas por email
 * - Notificaciones del sistema
 */

const nodemailer = require('nodemailer');
const path = require('path');

// Cargar configuración de email
let emailConfig;
try {
  emailConfig = require('../config/config-email.js');
} catch (e) {
  console.log('⚠️ config-email.js no encontrado, usando valores por defecto');
  emailConfig = {
    smtp: { host: 'smtp.gmail.com', port: 587, secure: false, auth: { user: '', pass: '' } },
    sender: { name: 'NEURIAX', email: 'noreply@neuriax.com' },
    urls: { app: 'http://localhost:3000', dashboard: 'http://localhost:3000/dashboard' }
  };
}

// ============================================
// CONFIGURACIÓN DEL TRANSPORTE
// ============================================

const transporter = nodemailer.createTransport({
  host: emailConfig.smtp.host || 'smtp.gmail.com',
  port: emailConfig.smtp.port || 587,
  secure: emailConfig.smtp.secure || false,
  auth: {
    user: emailConfig.smtp.auth.user,
    pass: emailConfig.smtp.auth.pass
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Configuración de la empresa
const CONFIG = {
  appName: 'GestióPro by NEURIAX',
  appUrl: emailConfig.urls?.app || 'http://localhost:3000',
  dashboardUrl: emailConfig.urls?.dashboard || 'http://localhost:3000/dashboard',
  supportEmail: emailConfig.sender?.email || 'neuriaxx@gmail.com',
  senderName: emailConfig.sender?.name || 'NEURIAX',
  senderEmail: emailConfig.sender?.email || 'neuriaxx@gmail.com',
  primaryColor: '#8b5cf6',
  secondaryColor: '#a855f7'
};

// ============================================
// PLANTILLA BASE HTML
// ============================================

const getBaseTemplate = (content, title = 'Notificación') => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${CONFIG.appName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, ${CONFIG.primaryColor} 0%, ${CONFIG.secondaryColor} 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">💈 ${CONFIG.appName}</h1>
    </div>
    <div style="padding: 40px 30px; color: #374151; line-height: 1.6;">
      ${content}
    </div>
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">Este email fue enviado automáticamente por ${CONFIG.appName}</p>
      <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">© ${new Date().getFullYear()} NEURIAX. Todos los derechos reservados.</p>
      <p style="margin: 5px 0;"><a href="${CONFIG.appUrl}" style="color: ${CONFIG.primaryColor}; text-decoration: none;">Visitar sitio web</a> | <a href="mailto:${CONFIG.supportEmail}" style="color: ${CONFIG.primaryColor}; text-decoration: none;">Contactar soporte</a></p>
    </div>
  </div>
</body>
</html>
`;

// ============================================
// ESTILOS REUTILIZABLES
// ============================================

const styles = {
  button: `display: inline-block; background: linear-gradient(135deg, ${CONFIG.primaryColor} 0%, ${CONFIG.secondaryColor} 100%); color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0;`,
  codeBox: `background-color: #f3f4f6; border: 2px dashed ${CONFIG.primaryColor}; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: ${CONFIG.primaryColor}; border-radius: 8px; margin: 20px 0;`,
  infoBox: `background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;`,
  warningBox: `background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;`,
  successBox: `background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;`,
  divider: `height: 1px; background-color: #e5e7eb; margin: 30px 0;`,
  tableCell: `padding: 12px; border-bottom: 1px solid #e5e7eb;`
};

// ============================================
// FUNCIONES DE EMAIL
// ============================================

/**
 * Enviar email de verificación de cuenta
 */
async function enviarEmailVerificacion(email, codigo_verificacion, nombreUsuario = 'Usuario') {
  const content = `
    <h2 style="color: #111827; margin-top: 0;">¡Hola ${nombreUsuario}! 👋</h2>
    <p>Gracias por registrarte en ${CONFIG.appName}. Para completar tu registro, introduce el siguiente código de verificación:</p>
    
    <div style="${styles.codeBox}">${codigo_verificacion}</div>
    
    <div style="${styles.infoBox}">
      <strong>⏰ Este código expira en 24 horas</strong><br>
      Si no solicitaste esta verificación, puedes ignorar este email.
    </div>
    
    <p>Una vez verificado tu email, podrás acceder a todas las funcionalidades de la plataforma.</p>
  `;

  return enviarEmail(email, 'Verifica tu email - ' + CONFIG.appName, content);
}

/**
 * Enviar email de confirmación de registro exitoso
 */
async function enviarEmailConfirmacion(email, nombreUsuario, datosAdicionales = {}) {
  const content = `
    <h2 style="color: #111827; margin-top: 0;">¡Bienvenido a ${CONFIG.appName}! 🎉</h2>
    <p>Hola <strong>${nombreUsuario}</strong>,</p>
    <p>Tu cuenta ha sido creada exitosamente. Ya puedes acceder a todas las funcionalidades de nuestra plataforma de gestión para salones de belleza.</p>
    
    <div style="${styles.successBox}">
      <strong>✅ Registro completado</strong><br>
      Tu cuenta está activa y lista para usar.
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr><td style="${styles.tableCell} color: #6b7280; width: 40%;">📧 Email:</td><td style="${styles.tableCell} font-weight: 500;">${email}</td></tr>
      <tr><td style="${styles.tableCell} color: #6b7280;">👤 Usuario:</td><td style="${styles.tableCell} font-weight: 500;">${nombreUsuario}</td></tr>
      <tr><td style="${styles.tableCell} color: #6b7280;">📅 Fecha:</td><td style="${styles.tableCell} font-weight: 500;">${new Date().toLocaleDateString('es-ES')}</td></tr>
      ${datosAdicionales.plan ? `<tr><td style="${styles.tableCell} color: #6b7280;">📦 Plan:</td><td style="${styles.tableCell} font-weight: 500;">${datosAdicionales.plan}</td></tr>` : ''}
    </table>
    
    <p style="text-align: center;">
      <a href="${CONFIG.appUrl}/login" style="${styles.button}">Acceder a mi cuenta →</a>
    </p>
  `;

  return enviarEmail(email, '¡Bienvenido a ' + CONFIG.appName + '!', content);
}

/**
 * Enviar email de recuperación de contraseña
 */
async function enviarEmailRecuperacion(email, tokenRecuperacion, nombreUsuario = 'Usuario') {
  const resetUrl = `${CONFIG.appUrl}/reset-password?token=${tokenRecuperacion}`;
  
  const content = `
    <h2 style="color: #111827; margin-top: 0;">Recuperar contraseña 🔐</h2>
    <p>Hola <strong>${nombreUsuario}</strong>,</p>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón de abajo para crear una nueva contraseña:</p>
    
    <p style="text-align: center;">
      <a href="${resetUrl}" style="${styles.button}">Restablecer mi contraseña →</a>
    </p>
    
    <div style="${styles.warningBox}">
      <strong>⚠️ Este enlace expira en 1 hora</strong><br>
      Por seguridad, el enlace de recuperación solo es válido durante 60 minutos.
    </div>
    
    <p>Si no puedes hacer clic en el botón, copia y pega esta URL en tu navegador:</p>
    <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">${resetUrl}</p>
    
    <div style="${styles.divider}"></div>
    
    <p style="color: #6b7280; font-size: 14px;">
      <strong>¿No solicitaste esto?</strong><br>
      Si no solicitaste restablecer tu contraseña, puedes ignorar este email.
    </p>
  `;

  return enviarEmail(email, 'Recuperar contraseña - ' + CONFIG.appName, content);
}

/**
 * Enviar recordatorio de cita
 */
async function enviarRecordatorioCita(email, datosCita) {
  const { nombreCliente, servicio, fecha, hora, empleado, direccion } = datosCita;
  
  const content = `
    <h2 style="color: #111827; margin-top: 0;">Recordatorio de cita 📅</h2>
    <p>Hola <strong>${nombreCliente}</strong>,</p>
    <p>Te recordamos que tienes una cita programada. ¡Te esperamos!</p>
    
    <div style="${styles.infoBox}">
      <strong>📋 Detalles de tu cita:</strong>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr><td style="${styles.tableCell} color: #6b7280;">🗓️ Fecha:</td><td style="${styles.tableCell} font-weight: bold;">${fecha}</td></tr>
      <tr><td style="${styles.tableCell} color: #6b7280;">⏰ Hora:</td><td style="${styles.tableCell} font-weight: bold;">${hora}</td></tr>
      <tr><td style="${styles.tableCell} color: #6b7280;">✂️ Servicio:</td><td style="${styles.tableCell}">${servicio}</td></tr>
      ${empleado ? `<tr><td style="${styles.tableCell} color: #6b7280;">👤 Con:</td><td style="${styles.tableCell}">${empleado}</td></tr>` : ''}
      ${direccion ? `<tr><td style="${styles.tableCell} color: #6b7280;">📍 Dirección:</td><td style="${styles.tableCell}">${direccion}</td></tr>` : ''}
    </table>
    
    <div style="${styles.warningBox}">
      <strong>⚠️ ¿Necesitas cancelar o reprogramar?</strong><br>
      Por favor, avísanos con al menos 24 horas de anticipación.
    </div>
  `;

  return enviarEmail(email, `Recordatorio: Tu cita del ${fecha} a las ${hora}`, content);
}

/**
 * Enviar confirmación de cita nueva
 */
async function enviarConfirmacionCita(email, datosCita) {
  const { nombreCliente, servicio, fecha, hora, empleado, precio } = datosCita;
  
  const content = `
    <h2 style="color: #111827; margin-top: 0;">¡Cita confirmada! ✅</h2>
    <p>Hola <strong>${nombreCliente}</strong>,</p>
    <p>Tu cita ha sido reservada exitosamente. Aquí tienes los detalles:</p>
    
    <div style="${styles.successBox}">
      <strong>✅ Reserva confirmada</strong><br>
      Te esperamos en la fecha y hora indicadas.
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr><td style="${styles.tableCell} color: #6b7280;">🗓️ Fecha:</td><td style="${styles.tableCell} font-weight: bold;">${fecha}</td></tr>
      <tr><td style="${styles.tableCell} color: #6b7280;">⏰ Hora:</td><td style="${styles.tableCell} font-weight: bold;">${hora}</td></tr>
      <tr><td style="${styles.tableCell} color: #6b7280;">✂️ Servicio:</td><td style="${styles.tableCell}">${servicio}</td></tr>
      ${empleado ? `<tr><td style="${styles.tableCell} color: #6b7280;">👤 Profesional:</td><td style="${styles.tableCell}">${empleado}</td></tr>` : ''}
      ${precio ? `<tr><td style="${styles.tableCell} color: #6b7280;">💰 Precio:</td><td style="${styles.tableCell}">${precio}€</td></tr>` : ''}
    </table>
    
    <p style="text-align: center;">
      <a href="${CONFIG.appUrl}/mis-citas" style="${styles.button}">Gestionar mis citas →</a>
    </p>
  `;

  return enviarEmail(email, `Cita confirmada: ${servicio} - ${fecha}`, content);
}

/**
 * Enviar factura por email
 */
async function enviarFactura(email, datosFactura) {
  const { numeroFactura, nombreCliente, fecha, items, subtotal, iva, total, metodoPago } = datosFactura;
  
  let itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.descripcion}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.cantidad}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.precio.toFixed(2)}€</td>
    </tr>
  `).join('');
  
  const content = `
    <h2 style="color: #111827; margin-top: 0;">Factura #${numeroFactura} 📄</h2>
    <p>Hola <strong>${nombreCliente}</strong>,</p>
    <p>Adjunto encontrarás los detalles de tu factura. Gracias por confiar en nosotros.</p>
    
    <div style="${styles.successBox}">
      <strong>✅ Pago recibido</strong><br>
      Método de pago: ${metodoPago || 'Tarjeta'}
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Servicio/Producto</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Cant.</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Precio</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 10px; text-align: right;">Subtotal:</td>
          <td style="padding: 10px; text-align: right;">${subtotal.toFixed(2)}€</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 10px; text-align: right;">IVA (21%):</td>
          <td style="padding: 10px; text-align: right;">${iva.toFixed(2)}€</td>
        </tr>
        <tr style="background-color: #f3f4f6;">
          <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold;">TOTAL:</td>
          <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: ${CONFIG.primaryColor};">${total.toFixed(2)}€</td>
        </tr>
      </tfoot>
    </table>
    
    <p style="text-align: center;">
      <a href="${CONFIG.appUrl}/facturas/${numeroFactura}" style="${styles.button}">Ver factura completa →</a>
    </p>
  `;

  return enviarEmail(email, `Factura #${numeroFactura} - ${CONFIG.appName}`, content);
}

/**
 * Enviar alerta de stock bajo
 */
async function enviarAlertaStockBajo(email, productos) {
  let productosHtml = productos.map(p => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${p.nombre}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #ef4444; font-weight: bold;">${p.stock}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${p.minimo}</td>
    </tr>
  `).join('');
  
  const content = `
    <h2 style="color: #111827; margin-top: 0;">⚠️ Alerta de Stock Bajo</h2>
    <p>Los siguientes productos tienen stock por debajo del mínimo establecido:</p>
    
    <div style="${styles.warningBox}">
      <strong>⚠️ ${productos.length} producto(s) necesitan reposición</strong>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #fef3c7;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Producto</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Stock Actual</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Stock Mínimo</th>
        </tr>
      </thead>
      <tbody>
        ${productosHtml}
      </tbody>
    </table>
    
    <p style="text-align: center;">
      <a href="${CONFIG.appUrl}/inventario" style="${styles.button}">Ir a Inventario →</a>
    </p>
  `;

  return enviarEmail(email, `⚠️ Alerta: ${productos.length} producto(s) con stock bajo`, content);
}

/**
 * Enviar resumen diario
 */
async function enviarResumenDiario(email, datos) {
  const { fecha, ventasTotales, citasCompletadas, nuevosClientes, ticketMedio } = datos;
  
  const content = `
    <h2 style="color: #111827; margin-top: 0;">📊 Resumen del día ${fecha}</h2>
    <p>Aquí tienes un resumen de la actividad de tu negocio hoy:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr><td style="${styles.tableCell} color: #6b7280;">💰 Ventas totales:</td><td style="${styles.tableCell}"><strong style="color: #10b981; font-size: 20px;">${ventasTotales.toFixed(2)}€</strong></td></tr>
      <tr><td style="${styles.tableCell} color: #6b7280;">📅 Citas completadas:</td><td style="${styles.tableCell} font-weight: bold;">${citasCompletadas}</td></tr>
      <tr><td style="${styles.tableCell} color: #6b7280;">👥 Nuevos clientes:</td><td style="${styles.tableCell} font-weight: bold;">${nuevosClientes}</td></tr>
      <tr><td style="${styles.tableCell} color: #6b7280;">🎫 Ticket medio:</td><td style="${styles.tableCell} font-weight: bold;">${ticketMedio.toFixed(2)}€</td></tr>
    </table>
    
    <p style="text-align: center;">
      <a href="${CONFIG.appUrl}/reportes" style="${styles.button}">Ver reportes completos →</a>
    </p>
  `;

  return enviarEmail(email, `📊 Resumen diario - ${fecha}`, content);
}

// ============================================
// FUNCIÓN PRINCIPAL DE ENVÍO
// ============================================

async function enviarEmail(to, subject, htmlContent, attachments = []) {
  try {
    const mailOptions = {
      from: `"${CONFIG.appName}" <${process.env.SMTP_USER || 'noreply@neuriax.com'}>`,
      to,
      subject,
      html: getBaseTemplate(htmlContent, subject),
      attachments
    };

    // En desarrollo, simular envío
    if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_PASSWORD) {
      console.log(`📧 [DEV] Email simulado a: ${to}`);
      console.log(`   Asunto: ${subject}`);
      return { success: true, message: 'Email simulado (modo desarrollo)', simulated: true };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email enviado a ${to}: ${info.messageId}`);
    return { success: true, message: 'Email enviado correctamente', messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error enviando email a ${to}:`, error.message);
    return { success: false, message: 'Error al enviar email', error: error.message };
  }
}

async function verificarConfiguracionEmail() {
  try {
    if (!emailConfig.smtp.auth.pass || emailConfig.smtp.auth.pass === 'TU_CONTRASEÑA_DE_APLICACION_AQUI') {
      console.log('📧 Servicio de email en modo simulación (sin contraseña configurada)');
      return { available: true, simulated: true };
    }
    
    await transporter.verify();
    console.log('✅ Servicio de email configurado correctamente');
    return { available: true, simulated: false };
  } catch (error) {
    console.warn('⚠️ Servicio de email no disponible:', error.message);
    return { available: false, error: error.message };
  }
}

/**
 * Enviar email de bienvenida para Trial de 7 días
 * Email profesional y limpio para nuevos usuarios
 */
async function enviarEmailBienvenidaTrial(datos) {
  const { 
    email, 
    nombreUsuario, 
    nombreNegocio, 
    username,
    fechaExpiracion,
    diasRestantes = 7 
  } = datos;

  const fechaExp = new Date(fechaExpiracion).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const content = `
    <h2 style="color: #111827; margin-top: 0; font-size: 28px;">¡Bienvenido a GestióPro! 🎉</h2>
    
    <p style="font-size: 16px;">Hola <strong>${nombreUsuario}</strong>,</p>
    
    <p style="font-size: 16px;">
      Gracias por registrar <strong>${nombreNegocio}</strong> en nuestra plataforma. 
      Tu prueba gratuita de <strong>7 días</strong> ya está activa.
    </p>

    <div style="background: linear-gradient(135deg, ${CONFIG.primaryColor} 0%, ${CONFIG.secondaryColor} 100%); border-radius: 16px; padding: 30px; margin: 30px 0; text-align: center;">
      <p style="color: rgba(255,255,255,0.9); margin: 0 0 10px 0; font-size: 14px;">Tu prueba gratuita expira el:</p>
      <p style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">${fechaExp}</p>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
        <strong>${diasRestantes} días</strong> para explorar todas las funciones
      </p>
    </div>

    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <h3 style="color: #111827; margin: 0 0 16px 0; font-size: 18px;">📋 Datos de tu cuenta</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #6b7280; width: 40%;">Usuario:</td>
          <td style="padding: 10px 0; font-weight: 600; color: #111827;">${username}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280;">Email:</td>
          <td style="padding: 10px 0; font-weight: 600; color: #111827;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280;">Negocio:</td>
          <td style="padding: 10px 0; font-weight: 600; color: #111827;">${nombreNegocio}</td>
        </tr>
      </table>
    </div>

    <h3 style="color: #111827; margin: 30px 0 20px 0; font-size: 18px;">✨ Qué puedes hacer durante tu prueba:</h3>
    
    <div style="display: flex; flex-wrap: wrap; gap: 12px;">
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 12px 16px; flex: 1; min-width: 200px;">
        <span style="font-size: 20px;">📅</span>
        <p style="margin: 8px 0 0 0; font-weight: 500; color: #166534;">Gestionar citas</p>
      </div>
      <div style="background-color: #fef3c7; border-radius: 8px; padding: 12px 16px; flex: 1; min-width: 200px;">
        <span style="font-size: 20px;">👥</span>
        <p style="margin: 8px 0 0 0; font-weight: 500; color: #92400e;">Clientes ilimitados</p>
      </div>
      <div style="background-color: #ede9fe; border-radius: 8px; padding: 12px 16px; flex: 1; min-width: 200px;">
        <span style="font-size: 20px;">💰</span>
        <p style="margin: 8px 0 0 0; font-weight: 500; color: #5b21b6;">Control de ventas</p>
      </div>
      <div style="background-color: #e0f2fe; border-radius: 8px; padding: 12px 16px; flex: 1; min-width: 200px;">
        <span style="font-size: 20px;">📊</span>
        <p style="margin: 8px 0 0 0; font-weight: 500; color: #0369a1;">Reportes completos</p>
      </div>
    </div>

    <p style="text-align: center; margin: 40px 0;">
      <a href="${CONFIG.dashboardUrl}" style="${styles.button}">
        Acceder a mi panel →
      </a>
    </p>

    <div style="${styles.divider}"></div>

    <p style="color: #6b7280; font-size: 14px; text-align: center;">
      ¿Tienes dudas? Responde a este email y te ayudaremos encantados.<br>
      <strong>Equipo NEURIAX</strong>
    </p>
  `;

  const htmlEmail = getBaseTemplate(content, '¡Bienvenido a tu prueba gratuita!');

  const mailOptions = {
    from: {
      name: CONFIG.senderName,
      address: CONFIG.senderEmail
    },
    to: email,
    subject: `🎉 ¡Bienvenido a GestióPro, ${nombreUsuario}! Tu prueba de 7 días está activa`,
    html: htmlEmail
  };

  try {
    // En desarrollo, simular si no hay contraseña configurada
    if (!emailConfig.smtp.auth.pass || emailConfig.smtp.auth.pass === 'TU_CONTRASEÑA_DE_APLICACION_AQUI') {
      console.log(`📧 [SIMULADO] Email de bienvenida para: ${email}`);
      console.log(`   Usuario: ${nombreUsuario}, Negocio: ${nombreNegocio}`);
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email de bienvenida enviado a ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error enviando email de bienvenida a ${email}:`, error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// EMAIL DE BIENVENIDA PARA CLIENTES
// ============================================

async function enviarEmailBienvenidaCliente(email, nombre) {
  const content = `
    <p style="font-size: 16px;">¡Hola <strong>${nombre}</strong>!</p>
    
    <p style="font-size: 16px;">
      Bienvenido a <strong>NEURIAX</strong>, tu plataforma de reservas de belleza.
    </p>

    <div style="background: linear-gradient(135deg, ${CONFIG.primaryColor} 0%, ${CONFIG.secondaryColor} 100%); border-radius: 16px; padding: 30px; margin: 30px 0; text-align: center;">
      <p style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">¡Bienvenido! 🎉</p>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
        Ya puedes buscar y reservar en los mejores salones
      </p>
    </div>

    <h3 style="color: #111827; margin: 24px 0 16px 0; font-size: 18px;">¿Qué puedes hacer?</h3>
    <ul style="color: #6b7280; font-size: 14px; line-height: 1.8;">
      <li>🔍 <strong>Buscar salones</strong> cercanos con los servicios que quieres</li>
      <li>⭐ <strong>Ver opiniones</strong> y calificaciones de otros clientes</li>
      <li>📅 <strong>Reservar citas</strong> directamente sin llamar</li>
      <li>🔔 <strong>Recibir recordatorios</strong> de tus citas</li>
      <li>💰 <strong>Pagar online</strong> de forma segura</li>
    </ul>

    <p style="text-align: center; margin: 40px 0;">
      <a href="${CONFIG.appUrl}/salones" style="${styles.button}">
        Explorar salones →
      </a>
    </p>

    <div style="${styles.infoBox}">
      <p style="color: #0369a1; margin: 0; font-weight: 600;">💡 Consejo</p>
      <p style="color: #0369a1; margin: 8px 0 0 0;">
        Completa tu perfil para obtener recomendaciones personalizadas basadas en tus preferencias
      </p>
    </div>

    <div style="${styles.divider}"></div>

    <p style="color: #6b7280; font-size: 14px; text-align: center;">
      ¿Tienes dudas? Estamos aquí para ayudarte.<br>
      <strong>Equipo NEURIAX</strong>
    </p>
  `;

  const htmlEmail = getBaseTemplate(content, '¡Bienvenido a NEURIAX!');

  const mailOptions = {
    from: {
      name: CONFIG.senderName,
      address: CONFIG.senderEmail
    },
    to: email,
    subject: `¡Hola ${nombre}! Bienvenido a NEURIAX - Tu plataforma de reservas de belleza`,
    html: htmlEmail
  };

  try {
    if (!emailConfig.smtp.auth.pass || emailConfig.smtp.auth.pass === 'TU_CONTRASEÑA_DE_APLICACION_AQUI') {
      console.log(`📧 [SIMULADO] Email de bienvenida para cliente: ${email}`);
      console.log(`   Nombre: ${nombre}`);
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email de bienvenida cliente enviado a ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error enviando email de bienvenida cliente a ${email}:`, error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// EMAIL DE BIENVENIDA PARA EMPRESAS
// ============================================

async function enviarEmailBienvenidaEmpresa(email, nombreDueno, nombreEmpresa, tenantId, diasTrial = 7) {
  const fechaExp = new Date();
  fechaExp.setDate(fechaExp.getDate() + diasTrial);
  const fechaFormato = fechaExp.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const content = `
    <p style="font-size: 16px;">¡Hola <strong>${nombreDueno}</strong>!</p>
    
    <p style="font-size: 16px;">
      ¡Bienvenido a <strong>NEURIAX</strong>! Tu cuenta profesional para <strong>${nombreEmpresa}</strong> está lista.
    </p>

    <p style="font-size: 16px; color: #059669; font-weight: 600;">
      ✓ Tu prueba gratuita de ${diasTrial} días ya está activa
    </p>

    <div style="background: linear-gradient(135deg, ${CONFIG.primaryColor} 0%, ${CONFIG.secondaryColor} 100%); border-radius: 16px; padding: 30px; margin: 30px 0; text-align: center;">
      <p style="color: rgba(255,255,255,0.9); margin: 0 0 10px 0; font-size: 14px;">Tu prueba expira el:</p>
      <p style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">${fechaFormato}</p>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
        Tendrás acceso a <strong>TODAS</strong> las funciones premium
      </p>
    </div>

    <h3 style="color: #111827; margin: 24px 0 16px 0; font-size: 18px;">🚀 Próximos pasos</h3>
    <ol style="color: #6b7280; font-size: 14px; line-height: 2;">
      <li><strong>Completa tu perfil</strong> - Foto, descripción y servicios</li>
      <li><strong>Crea tu agenda</strong> - Define horarios y servicios</li>
      <li><strong>Configura tus tarifas</strong> - Precios y duraciones</li>
      <li><strong>Invita tu equipo</strong> - Agrega profesionales (si aplica)</li>
      <li><strong>Activa reservas online</strong> - Tus clientes pueden agendar 24/7</li>
    </ol>

    <p style="text-align: center; margin: 40px 0;">
      <a href="${CONFIG.dashboardUrl}" style="${styles.button}">
        Ir a mi panel profesional →
      </a>
    </p>

    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <h3 style="color: #111827; margin: 0 0 16px 0; font-size: 18px;">📊 Funciones disponibles</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
        <div><strong>✓ Agenda de citas</strong></div>
        <div><strong>✓ POS (Punto de Venta)</strong></div>
        <div><strong>✓ Clientes ilimitados</strong></div>
        <div><strong>✓ Reportes y analytics</strong></div>
        <div><strong>✓ Portal online 24/7</strong></div>
        <div><strong>✓ Recordatorios automáticos</strong></div>
        <div><strong>✓ Múltiples usuarios</strong></div>
        <div><strong>✓ Integración Stripe</strong></div>
      </div>
    </div>

    <div style="${styles.warningBox}">
      <p style="color: #b45309; margin: 0; font-weight: 600;">⏰ Importante</p>
      <p style="color: #b45309; margin: 8px 0 0 0; font-size: 13px;">
        Después de ${diasTrial} días necesitarás activar un plan. 
        <a href="${CONFIG.dashboardUrl}?tab=planes" style="color: #b45309; font-weight: 600;">Ver planes disponibles</a>
      </p>
    </div>

    <div style="${styles.divider}"></div>

    <p style="color: #6b7280; font-size: 14px; text-align: center;">
      ¿Tienes preguntas? Responde a este email y nuestro equipo te ayudará encantado.<br>
      <strong>Equipo NEURIAX</strong>
    </p>
  `;

  const htmlEmail = getBaseTemplate(content, `¡Bienvenido ${nombreDueno}!`);

  const mailOptions = {
    from: {
      name: CONFIG.senderName,
      address: CONFIG.senderEmail
    },
    to: email,
    subject: `🎉 ${nombreDueno}, tu cuenta profesional en NEURIAX está lista - ${diasTrial} días gratis`,
    html: htmlEmail
  };

  try {
    if (!emailConfig.smtp.auth.pass || emailConfig.smtp.auth.pass === 'TU_CONTRASEÑA_DE_APLICACION_AQUI') {
      console.log(`📧 [SIMULADO] Email de bienvenida para empresa: ${email}`);
      console.log(`   Dueño: ${nombreDueno}, Empresa: ${nombreEmpresa}, Tenant: ${tenantId}`);
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email de bienvenida empresa enviado a ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error enviando email de bienvenida empresa a ${email}:`, error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// EXPORTAR
// ============================================

module.exports = {
  enviarEmailVerificacion,
  enviarEmailConfirmacion,
  enviarEmailRecuperacion,
  enviarRecordatorioCita,
  enviarConfirmacionCita,
  enviarFactura,
  enviarAlertaStockBajo,
  enviarResumenDiario,
  enviarEmail,
  enviarEmailBienvenidaTrial,
  enviarEmailBienvenidaCliente,
  enviarEmailBienvenidaEmpresa,
  verificarConfiguracionEmail,
  CONFIG
};
