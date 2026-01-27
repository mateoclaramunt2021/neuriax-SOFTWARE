/**
 * NEURIAX - Banner de Trial
 * Muestra los días restantes de la prueba gratuita
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TrialBanner.css';

export default function TrialBanner({ diasRestantes, tenantName }) {
  const navigate = useNavigate();

  if (diasRestantes === null || diasRestantes === undefined || diasRestantes < 0) {
    return null;
  }

  const isUrgent = diasRestantes <= 2;
  const isWarning = diasRestantes <= 4 && diasRestantes > 2;

  return (
    <div className={`trial-banner ${isUrgent ? 'urgent' : ''} ${isWarning ? 'warning' : ''}`}>
      <div className="trial-banner-content">
        <span className="trial-icon">{isUrgent ? '⚠️' : '🎁'}</span>
        <span className="trial-text">
          {diasRestantes === 0 ? (
            <>Tu prueba gratuita termina <strong>hoy</strong></>
          ) : diasRestantes === 1 ? (
            <>Tu prueba gratuita termina <strong>mañana</strong></>
          ) : (
            <>Te quedan <strong>{diasRestantes} días</strong> de prueba gratuita</>
          )}
        </span>
        <button 
          className="upgrade-btn"
          onClick={() => navigate('/checkout/professional')}
        >
          Elegir plan
        </button>
      </div>
    </div>
  );
}
