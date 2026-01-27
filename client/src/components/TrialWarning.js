import React from 'react';
import '../styles/TrialWarning.css';

/**
 * TrialWarning Component
 * Muestra alerta cuando quedan pocos días de trial
 * Se oculta si quedan más de 3 días
 */
const TrialWarning = ({ diasRestantes, onUpgradeClick, planName }) => {
  // No mostrar si quedan más de 3 días
  if (!diasRestantes || diasRestantes > 3) {
    return null;
  }

  // Determinar severidad
  const isExpired = diasRestantes === 0;
  const isCritical = diasRestantes === 1;
  const severity = isExpired ? 'expired' : isCritical ? 'critical' : 'warning';

  return (
    <div className={`trial-warning trial-${severity}`}>
      <div className="warning-header">
        <div className="warning-icon">
          {isExpired ? '❌' : isCritical ? '🔴' : '⏰'}
        </div>
        <div className="warning-content">
          <h3 className="warning-title">
            {isExpired 
              ? '❌ Tu trial ha expirado'
              : isCritical
              ? '🔴 ¡Últimas 24 horas de trial!'
              : '⏰ Tu trial vence en ' + diasRestantes + ' día' + (diasRestantes > 1 ? 's' : '')
            }
          </h3>
          <p className="warning-message">
            {isExpired
              ? 'Elige un plan para continuar usando tu dashboard.'
              : 'Selecciona un plan ahora para no perder acceso a tus datos y funciones.'}
          </p>
        </div>
      </div>

      <div className="warning-actions">
        {!isExpired && (
          <div className="trial-status">
            <div className="status-bar">
              <div className="status-fill"></div>
            </div>
            <span className="status-text">
              {diasRestantes} día{diasRestantes > 1 ? 's' : ''} restante{diasRestantes > 1 ? 's' : ''}
            </span>
          </div>
        )}

        <button 
          className="upgrade-btn-trial"
          onClick={onUpgradeClick}
        >
          💳 {isExpired ? 'Seleccionar Plan' : 'Upgradear Ahora'}
        </button>
      </div>

      {!isExpired && (
        <div className="warning-info">
          <p>
            <strong>Plan {planName || 'Trial'}:</strong> 7 días gratis para probar todas las funciones
          </p>
        </div>
      )}
    </div>
  );
};

export default TrialWarning;
