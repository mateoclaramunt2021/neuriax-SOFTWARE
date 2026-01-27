/**
 * NEURIAX - Componente Trial Expirado
 * Se muestra cuando el trial de 7 días ha terminado
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/trial-expired.css';

export default function TrialExpired({ tenant, onLogout }) {
  const navigate = useNavigate();

  const handleUpgrade = (planId) => {
    navigate(`/checkout/${planId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    if (onLogout) onLogout();
    navigate('/');
  };

  return (
    <div className="trial-expired-page">
      <div className="trial-expired-container">
        <div className="expired-header">
          <div className="expired-icon">⏰</div>
          <h1>Tu prueba gratuita ha terminado</h1>
          <p>
            Los 7 días de prueba de <strong>{tenant?.nombre || 'tu salón'}</strong> han finalizado.
            Para continuar usando NEURIAX, elige un plan.
          </p>
        </div>

        <div className="upgrade-options">
          <h2>Elige tu plan</h2>
          
          <div className="plans-grid">
            {/* Starter */}
            <div className="plan-card">
              <div className="plan-header">
                <h3>Starter</h3>
                <p className="plan-desc">Para empezar</p>
              </div>
              <div className="plan-price">
                <span className="currency">€</span>
                <span className="amount">29</span>
                <span className="period">/mes</span>
              </div>
              <ul className="plan-features">
                <li>✓ Hasta 50 clientes</li>
                <li>✓ 1 usuario</li>
                <li>✓ Agenda de citas</li>
                <li>✓ Punto de venta</li>
                <li>✓ Reportes básicos</li>
              </ul>
              <button 
                className="plan-btn secondary"
                onClick={() => handleUpgrade('starter')}
              >
                Seleccionar
              </button>
            </div>

            {/* Professional */}
            <div className="plan-card featured">
              <div className="featured-badge">Recomendado</div>
              <div className="plan-header">
                <h3>Professional</h3>
                <p className="plan-desc">Para crecer</p>
              </div>
              <div className="plan-price">
                <span className="currency">€</span>
                <span className="amount">59</span>
                <span className="period">/mes</span>
              </div>
              <ul className="plan-features">
                <li>✓ Hasta 500 clientes</li>
                <li>✓ 5 usuarios</li>
                <li>✓ Recordatorios automáticos</li>
                <li>✓ Inventario completo</li>
                <li>✓ Reportes avanzados</li>
                <li>✓ Soporte prioritario</li>
              </ul>
              <button 
                className="plan-btn primary"
                onClick={() => handleUpgrade('professional')}
              >
                Seleccionar
              </button>
            </div>

            {/* Business */}
            <div className="plan-card">
              <div className="plan-header">
                <h3>Business</h3>
                <p className="plan-desc">Sin límites</p>
              </div>
              <div className="plan-price">
                <span className="currency">€</span>
                <span className="amount">99</span>
                <span className="period">/mes</span>
              </div>
              <ul className="plan-features">
                <li>✓ Clientes ilimitados</li>
                <li>✓ Usuarios ilimitados</li>
                <li>✓ Multi-sucursal</li>
                <li>✓ API para integraciones</li>
                <li>✓ Soporte telefónico</li>
                <li>✓ Formación incluida</li>
              </ul>
              <button 
                className="plan-btn secondary"
                onClick={() => handleUpgrade('business')}
              >
                Seleccionar
              </button>
            </div>
          </div>
        </div>

        <div className="expired-footer">
          <p>
            ¿Tienes preguntas? <a href="mailto:soporte@neuriax.com">Contáctanos</a>
          </p>
          <button className="logout-link" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
