/**
 * TWILIO SERVICE - Servicio de SMS y WhatsApp
 * 
 * Gestiona el envío de notificaciones automáticas:
 * - SMS de confirmación de reserva
 * - Recordatorios 24h antes
 * - Recordatorios 1h antes
 * - Confirmación de cambios de cita
 * - Notificaciones WhatsApp (opcional)
 */

const twilio = require('twilio');

// Inicializar cliente Twilio con credenciales
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const twilioService = {
  /**
   * Enviar SMS simple
   * @param {string} telefono - Número destino (ej: +34600000000)
   * @param {string} mensaje - Texto a enviar (máximo 160 caracteres)
   * @returns {Promise<{success: boolean, sid?: string, error?: string}>}
   */
  async sendSMS(telefono, mensaje) {
    try {
      // En modo MOCK (para testing sin gastar créditos)
      if (process.env.TWILIO_MOCK === 'true') {
        console.log(`[MOCK SMS] A ${telefono}: "${mensaje}"`);
        return { success: true, sid: `mock-${Date.now()}` };
      }

      // Envío real con Twilio
      const message = await client.messages.create({
        body: mensaje,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: telefono
      });

      console.log(`✅ SMS enviado a ${telefono}: SID ${message.sid}`);
      return { success: true, sid: message.sid };
    } catch (error) {
      console.error(`❌ Error enviando SMS a ${telefono}: ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  /**
   * Enviar WhatsApp (requiere número WhatsApp Business)
   * @param {string} telefono - Número destino
   * @param {string} mensaje - Mensaje WhatsApp
   * @returns {Promise<{success: boolean, sid?: string, error?: string}>}
   */
  async sendWhatsApp(telefono, mensaje) {
    try {
      if (process.env.TWILIO_MOCK === 'true') {
        console.log(`[MOCK WHATSAPP] A ${telefono}: "${mensaje}"`);
        return { success: true, sid: `mock-wa-${Date.now()}` };
      }

      const message = await client.messages.create({
        body: mensaje,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${telefono}`
      });

      console.log(`✅ WhatsApp enviado a ${telefono}: SID ${message.sid}`);
      return { success: true, sid: message.sid };
    } catch (error) {
      console.error(`❌ Error WhatsApp a ${telefono}: ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  /**
   * Recordatorio 24 horas antes de cita
   * Mensaje: "Hola Juan, recordatorio: Corte Hombre el 2025-02-01 a las 14:00. Código: ABC12345"
   */
  async recordatorio24h(cliente, servicio, fecha, hora, codigoConfirmacion) {
    const mensaje = `Hola ${cliente.nombre.split(' ')[0]}, recordatorio: ${servicio} el ${fecha} a las ${hora}. Código: ${codigoConfirmacion}. ✂️`;
    return this.sendSMS(cliente.telefono, mensaje);
  },

  /**
   * Recordatorio 5 horas antes
   * Mensaje: "Hola Juan, recordatorio: en 5 HORAS tienes Corte Hombre a las 19:00. Código: ABC12345"
   */
  async recordatorio5h(cliente, servicio, hora, codigoConfirmacion) {
    const mensaje = `Hola ${cliente.nombre.split(' ')[0]}, recordatorio: ¡en 5 HORAS! ${servicio} a las ${hora}. Código: ${codigoConfirmacion}`;
    return this.sendSMS(cliente.telefono, mensaje);
  },

  /**
   * Recordatorio 1 hora antes
   * Mensaje urgente: "⏰ Juan, ¡en 1 HORA! Corte Hombre a las 14:00. Código: ABC12345"
   */
  async recordatorio1h(cliente, servicio, hora, codigoConfirmacion) {
    const mensaje = `⏰ ${cliente.nombre.split(' ')[0]}, ¡en 1 HORA! ${servicio} a las ${hora}. Código: ${codigoConfirmacion}`;
    return this.sendSMS(cliente.telefono, mensaje);
  },

  /**
   * Confirmación de cambio de cita
   * Mensaje: "✅ Tu cita ha sido cambiada a 2025-02-02 a las 15:00. Código: ABC12345"
   */
  async confirmacionCambio(cliente, fecha, hora, codigoConfirmacion) {
    const mensaje = `✅ ${cliente.nombre.split(' ')[0]}, tu cita ha sido cambiada a ${fecha} a las ${hora}. Código: ${codigoConfirmacion}`;
    return this.sendSMS(cliente.telefono, mensaje);
  },

  /**
   * Confirmación de nueva reserva (opcional)
   * Mensaje: "✅ Reserva confirmada: Corte Hombre, 2025-02-01 14:00. Código: ABC12345"
   */
  async confirmacionReserva(cliente, servicio, fecha, hora, codigoConfirmacion) {
    const mensaje = `✅ Reserva confirmada: ${servicio}, ${fecha} ${hora}. Código: ${codigoConfirmacion}`;
    return this.sendSMS(cliente.telefono, mensaje);
  },

  /**
   * Notificación de no-show (cliente no fue a cita)
   */
  async notificacionNoShow(cliente, servicio, fecha, hora) {
    const mensaje = `ℹ️ ${cliente.nombre.split(' ')[0]}, vimos que no asististe a tu cita de ${servicio} el ${fecha}. ¿Necesitas reprogramar?`;
    return this.sendSMS(cliente.telefono, mensaje);
  }
};

module.exports = twilioService;
