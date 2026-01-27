/**
 * CookiesPage - Política de Cookies
 * NEURIAX Platform
 * Proyecto en Desarrollo
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './legal.css';

const CookiesPage = () => {
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
            <Link to="/privacy">Privacidad</Link>
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
              Esta política de cookies es un borrador orientativo.
            </p>
          </div>

          {/* Title */}
          <div className="legal-title-section">
            <h1>Política de Cookies</h1>
            <p className="legal-subtitle">NEURIAX Platform - Versión Borrador</p>
            <div className="legal-update-date">
              <span className="date-icon">📅</span>
              <span>Última actualización: Enero 2026</span>
            </div>
          </div>

          {/* Section 1 */}
          <section className="legal-section">
            <h2>1. ¿QUÉ SON LAS COOKIES?</h2>
            <p>
              Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo 
              cuando los visitas. Se utilizan para recordar tus preferencias y mejorar tu experiencia.
            </p>
          </section>

          {/* Section 2 */}
          <section className="legal-section">
            <h2>2. COOKIES QUE UTILIZAMOS</h2>
            <p>NEURIAX utiliza únicamente cookies técnicas necesarias para el funcionamiento:</p>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="legal-table" style={{ width: '100%', marginTop: '16px' }}>
                <thead>
                  <tr style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Cookie</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Tipo</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Propósito</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Duración</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '12px' }}>token</td>
                    <td style={{ padding: '12px' }}>Técnica</td>
                    <td style={{ padding: '12px' }}>Autenticación de usuario</td>
                    <td style={{ padding: '12px' }}>8 horas</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px' }}>theme</td>
                    <td style={{ padding: '12px' }}>Preferencia</td>
                    <td style={{ padding: '12px' }}>Tema claro/oscuro</td>
                    <td style={{ padding: '12px' }}>1 año</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px' }}>cookieConsent</td>
                    <td style={{ padding: '12px' }}>Técnica</td>
                    <td style={{ padding: '12px' }}>Recordar aceptación de cookies</td>
                    <td style={{ padding: '12px' }}>1 año</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px' }}>tenant</td>
                    <td style={{ padding: '12px' }}>Técnica</td>
                    <td style={{ padding: '12px' }}>Identificar el negocio</td>
                    <td style={{ padding: '12px' }}>Sesión</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3 */}
          <section className="legal-section">
            <h2>3. TIPOS DE COOKIES</h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px',
              marginTop: '20px'
            }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>✅</span>
                <h4 style={{ color: '#10b981', marginBottom: '8px' }}>Cookies Técnicas</h4>
                <p style={{ fontSize: '14px', color: '#a0a0b2', margin: 0 }}>
                  Necesarias para el funcionamiento. No requieren consentimiento.
                </p>
              </div>
              
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>⚙️</span>
                <h4 style={{ color: '#f59e0b', marginBottom: '8px' }}>Cookies de Preferencias</h4>
                <p style={{ fontSize: '14px', color: '#a0a0b2', margin: 0 }}>
                  Recuerdan tus preferencias como el tema visual.
                </p>
              </div>
              
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>❌</span>
                <h4 style={{ color: '#ef4444', marginBottom: '8px' }}>Cookies de Terceros</h4>
                <p style={{ fontSize: '14px', color: '#a0a0b2', margin: 0 }}>
                  <strong>No utilizamos</strong> cookies de publicidad ni de terceros.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="legal-section">
            <h2>4. CÓMO GESTIONAR LAS COOKIES</h2>
            <p>Puedes gestionar las cookies desde tu navegador:</p>
            
            <ul>
              <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
              <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
              <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies</li>
              <li><strong>Edge:</strong> Configuración → Cookies y permisos del sitio</li>
            </ul>
            
            <div className="legal-highlight-box" style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginTop: '16px'
            }}>
              <p style={{ margin: 0, color: '#f59e0b' }}>
                <strong>⚠️ Nota:</strong> Si desactivas las cookies técnicas, 
                algunas funciones de la aplicación podrían no funcionar correctamente.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section id="contacto" className="legal-section">
            <h2>5. CONTACTO</h2>
            <div className="legal-info-box">
              <p><strong>Email:</strong> contacto@neuriax.com (provisional)</p>
              <p style={{ color: '#a0a0b2', fontSize: '14px', marginTop: '12px' }}>
                * Los datos de contacto definitivos se publicarán cuando NEURIAX esté registrado legalmente.
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
              Esta política de cookies se actualizará cuando NEURIAX esté operativo 
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

export default CookiesPage;
