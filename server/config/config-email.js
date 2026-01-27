/**
 * CONFIGURACIÓN DE EMAIL - NEURIAX
 * 
 * Para usar Gmail necesitas generar una "Contraseña de aplicación":
 * 1. Ve a tu cuenta de Google: https://myaccount.google.com/
 * 2. Seguridad > Verificación en 2 pasos (actívala si no está)
 * 3. Seguridad > Contraseñas de aplicaciones
 * 4. Genera una nueva para "Correo" en "Otro (nombre personalizado)"
 * 5. Copia la contraseña de 16 caracteres aquí abajo
 */

module.exports = {
  // Configuración SMTP para Gmail
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'neuriaxx@gmail.com',
      pass: 'jvdqxmxrrqnqhhmt'
    }
  },
  
  // Datos del remitente
  sender: {
    name: 'NEURIAX - GestióPro',
    email: 'neuriaxx@gmail.com'
  },
  
  // URLs de la aplicación
  urls: {
    app: 'http://localhost:3000',
    dashboard: 'http://localhost:3000/dashboard',
    login: 'http://localhost:3000/login',
    support: 'mailto:neuriaxx@gmail.com'
  }
};
