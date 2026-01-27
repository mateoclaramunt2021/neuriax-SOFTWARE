/**
 * PrivacyPage - Política de Privacidad
 * NEURIAX Platform
 * Proyecto en Desarrollo
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './legal.css';

const PrivacyPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page">
      {/* Header */}
      <header className="legal-header">
        <div className="legal-header-content">
          <Link to="/" className="legal-logo">
            <span className="logo-icon">💇</span>
            <span className="logo-text">NEURIAX</span>
          </Link>
          <nav className="legal-nav">
            <Link to="/terms">Términos</Link>
            <Link to="/cookies">Cookies</Link>
            <Link to="/login">Iniciar Sesión</Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="legal-content">
        <div className="legal-container">
          {/* Development Notice */}
          <div className="legal-notice-box" style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
            border: '2px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🚧</span>
            <h2 style={{ color: '#8b5cf6', marginBottom: '12px' }}>Proyecto en Desarrollo</h2>
            <p style={{ color: '#a0a0b2', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
              NEURIAX es un proyecto de software en fase de desarrollo. 
              Actualmente no está registrado como empresa ni opera comercialmente.
              Esta política de privacidad es un borrador que se actualizará cuando el proyecto esté operativo.
            </p>
          </div>

          {/* Title */}
          <div className="legal-title-section">
            <h1>Política de Privacidad</h1>
            <p className="legal-subtitle">NEURIAX Platform - Versión Borrador</p>
            <div className="legal-update-date">
              <span className="date-icon">📅</span>
              <span>Última actualización: Enero 2026</span>
            </div>
          </div>

          {/* Intro */}
          <section className="legal-section">
            <h2>AVISO IMPORTANTE</h2>
            <p>
              Este documento es un <strong>borrador</strong> de la política de privacidad que se implementará 
              cuando NEURIAX esté operativo como servicio comercial. Los datos aquí descritos son orientativos 
              sobre cómo se gestionará la privacidad de los usuarios.
            </p>
            <p>
              <strong>Estado actual del proyecto:</strong>
            </p>
            <ul>
              <li>✅ En fase de desarrollo y pruebas</li>
              <li>⏳ Pendiente de registro mercantil</li>
              <li>⏳ Pendiente de alta en la Agencia Española de Protección de Datos</li>
              <li>⏳ Pendiente de certificaciones de seguridad</li>
            </ul>
          </section>

          {/* Section 1 */}
          <section id="responsable" className="legal-section">
            <h2>1. INFORMACIÓN DEL RESPONSABLE (Provisional)</h2>
            
            <div className="legal-info-box">
              <table className="legal-table">
                <tbody>
                  <tr>
                    <td><strong>Proyecto</strong></td>
                    <td>NEURIAX</td>
                  </tr>
                  <tr>
                    <td><strong>Estado</strong></td>
                    <td>En desarrollo - No registrado</td>
                  </tr>
                  <tr>
                    <td><strong>Tipo</strong></td>
                    <td>Software de gestión para peluquerías y salones de belleza</td>
                  </tr>
                  <tr>
                    <td><strong>Email de contacto</strong></td>
                    <td>contacto@neuriax.com (provisional)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="legal-highlight-box" style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginTop: '16px'
            }}>
              <p style={{ margin: 0, color: '#f59e0b' }}>
                <strong>⚠️ Nota:</strong> Una vez que NEURIAX sea una empresa registrada, 
                se proporcionarán todos los datos fiscales y de contacto reales conforme a la legislación vigente.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="datos-recopilados" className="legal-section">
            <h2>2. DATOS QUE RECOPILAREMOS</h2>
            <p>Cuando NEURIAX esté operativo, se recopilarán los siguientes tipos de datos:</p>
            
            <h3>2.1 Datos de identificación</h3>
            <ul>
              <li>Nombre y apellidos</li>
              <li>Correo electrónico</li>
              <li>Teléfono de contacto</li>
              <li>Nombre del negocio (para cuentas profesionales)</li>
            </ul>

            <h3>2.2 Datos técnicos</h3>
            <ul>
              <li>Dirección IP (anonimizada)</li>
              <li>Tipo de navegador y dispositivo</li>
              <li>Datos de uso de la plataforma</li>
            </ul>

            <h3>2.3 Datos del negocio</h3>
            <ul>
              <li>Información de servicios ofrecidos</li>
              <li>Datos de clientes del salón</li>
              <li>Historial de citas y transacciones</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="finalidades" className="legal-section">
            <h2>3. FINALIDADES DEL TRATAMIENTO</h2>
            <p>Los datos se utilizarán para:</p>
            <ul>
              <li>Prestación del servicio de gestión de salones</li>
              <li>Gestión de citas y reservas online</li>
              <li>Comunicaciones relacionadas con el servicio</li>
              <li>Mejora de la plataforma</li>
              <li>Cumplimiento de obligaciones legales</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="derechos" className="legal-section">
            <h2>4. DERECHOS DE LOS USUARIOS</h2>
            <p>Cuando NEURIAX esté operativo, los usuarios podrán ejercer los siguientes derechos:</p>
            
            <div className="legal-rights-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginTop: '20px'
            }}>
              {[
                { icon: '📋', title: 'Acceso', desc: 'Conocer qué datos tenemos' },
                { icon: '✏️', title: 'Rectificación', desc: 'Corregir datos incorrectos' },
                { icon: '🗑️', title: 'Supresión', desc: 'Eliminar tus datos' },
                { icon: '⛔', title: 'Oposición', desc: 'Oponerte al tratamiento' },
                { icon: '📦', title: 'Portabilidad', desc: 'Recibir tus datos' },
                { icon: '⏸️', title: 'Limitación', desc: 'Limitar el uso de datos' }
              ].map((right, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>{right.icon}</span>
                  <h4 style={{ marginBottom: '4px', color: '#fff' }}>{right.title}</h4>
                  <p style={{ fontSize: '13px', color: '#a0a0b2', margin: 0 }}>{right.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5 */}
          <section id="seguridad" className="legal-section">
            <h2>5. MEDIDAS DE SEGURIDAD</h2>
            <p>NEURIAX implementará las siguientes medidas de seguridad:</p>
            <ul>
              <li>🔐 Cifrado de datos en tránsito (HTTPS/TLS)</li>
              <li>🔐 Cifrado de contraseñas con bcrypt</li>
              <li>🔐 Autenticación de dos factores (2FA)</li>
              <li>🔐 Copias de seguridad automáticas</li>
              <li>🔐 Acceso restringido por roles</li>
              <li>🔐 Monitorización de accesos</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section id="cookies" className="legal-section">
            <h2>6. COOKIES</h2>
            <p>
              NEURIAX utilizará cookies técnicas necesarias para el funcionamiento del servicio.
              Para más información, consulta nuestra <Link to="/cookies">Política de Cookies</Link>.
            </p>
          </section>

          {/* Section 7 */}
          <section id="contacto" className="legal-section">
            <h2>7. CONTACTO</h2>
            <p>
              Si tienes preguntas sobre este proyecto o esta política de privacidad, 
              puedes contactarnos en:
            </p>
            <div className="legal-info-box">
              <p><strong>Email:</strong> contacto@neuriax.com (provisional)</p>
              <p style={{ color: '#a0a0b2', fontSize: '14px', marginTop: '12px' }}>
                * Los datos de contacto definitivos se publicarán cuando NEURIAX sea una empresa registrada.
              </p>
            </div>
          </section>

          {/* Footer Note */}
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '40px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, color: '#a0a0b2' }}>
              Este documento se actualizará completamente cuando NEURIAX esté operativo 
              como empresa registrada. Gracias por tu interés en el proyecto.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="legal-footer">
        <div className="legal-footer-content">
          <p>© 2026 NEURIAX - Proyecto en Desarrollo</p>
          <div className="legal-footer-links">
            <Link to="/terms">Términos</Link>
            <Link to="/privacy">Privacidad</Link>
            <Link to="/cookies">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPage;
