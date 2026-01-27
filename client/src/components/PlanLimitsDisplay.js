import React, { useState, useEffect } from 'react';
import '../styles/PlanLimitsDisplay.css';

/**
 * Componente PlanLimitsDisplay
 * Muestra la información del plan y los límites de recursos
 * Se integra en DashboardPro
 */
const PlanLimitsDisplay = ({ 
  planName, 
  planId,
  usage = {},
  limits = {},
  diasRestantes = null,
  onUpgradeClick 
}) => {
  const [alertResources, setAlertResources] = useState([]);

  // Detectar recursos que están al 80% o más
  useEffect(() => {
    const alerts = [];
    
    Object.keys(limits).forEach(key => {
      if (key.startsWith('limite_')) {
        const limit = limits[key];
        const current = usage[key.replace('limite_', '')] || 0;
        const percentage = (current / limit) * 100;
        
        if (percentage >= 80) {
          alerts.push({
            type: key.replace('limite_', ''),
            current,
            limit,
            percentage: Math.round(percentage)
          });
        }
      }
    });

    setAlertResources(alerts);
  }, [usage, limits]);

  const getResourceLabel = (resourceType) => {
    const labels = {
      'clientes': 'Clientes',
      'servicios': 'Servicios',
      'empleados': 'Empleados',
      'usuarios': 'Usuarios de Sistema'
    };
    return labels[resourceType] || resourceType;
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 100) return '#ef4444'; // Rojo
    if (percentage >= 80) return '#f59e0b';   // Ámbar
    return '#10b981';                         // Verde
  };

  const getPlanBadgeColor = () => {
    const colors = {
      'trial': 'badge-trial',
      'starter': 'badge-starter',
      'professional': 'badge-professional',
      'enterprise': 'badge-enterprise'
    };
    return colors[planId] || 'badge-starter';
  };

  return (
    <div className="plan-limits-display">
      {/* Header con info del plan */}
      <div className="plan-limits-header">
        <div className="plan-info">
          <h3 className="plan-name">📋 Plan Actual</h3>
          <div className="plan-badge-wrapper">
            <span className={`plan-badge ${getPlanBadgeColor()}`}>
              {planName}
            </span>
            {diasRestantes !== null && (
              <span className="trial-badge">
                {diasRestantes} días
              </span>
            )}
          </div>
        </div>

        <button 
          className="upgrade-btn-compact"
          onClick={onUpgradeClick}
        >
          ⬆️ Upgradear
        </button>
      </div>

      {/* Alertas de recursos cercanos al límite */}
      {alertResources.length > 0 && (
        <div className="plan-limits-alerts">
          {alertResources.map((alert, idx) => (
            <div 
              key={idx}
              className="alert-item"
              style={{ borderLeftColor: getStatusColor(alert.percentage) }}
            >
              <div className="alert-content">
                <p className="alert-title">
                  ⚠️ {getResourceLabel(alert.type)} al {alert.percentage}%
                </p>
                <p className="alert-detail">
                  Usando {alert.current} de {alert.limit}
                </p>
              </div>
              <div 
                className="progress-bar"
                style={{ 
                  backgroundColor: getStatusColor(alert.percentage),
                  width: `${Math.min(alert.percentage, 100)}%`
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Límites de todos los recursos */}
      <div className="plan-limits-grid">
        {Object.keys(limits).map((limitKey, idx) => {
          const resourceType = limitKey.replace('limite_', '');
          const limit = limits[limitKey];
          const current = usage[resourceType] || 0;
          const percentage = Math.round((current / limit) * 100);
          const remaining = Math.max(0, limit - current);

          return (
            <div key={idx} className="limit-card">
              <div className="limit-card-header">
                <h4 className="limit-title">{getResourceLabel(resourceType)}</h4>
                <span className="limit-percentage" style={{ color: getStatusColor(percentage) }}>
                  {percentage}%
                </span>
              </div>

              <div className="limit-stats">
                <span className="stat-current">{current}</span>
                <span className="stat-separator">/</span>
                <span className="stat-limit">{limit}</span>
              </div>

              <div className="limit-bar-container">
                <div 
                  className="limit-bar-fill"
                  style={{ 
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: getStatusColor(percentage)
                  }}
                />
              </div>

              <p className="limit-remaining">
                {remaining} disponible{remaining !== 1 ? 's' : ''}
              </p>
            </div>
          );
        })}
      </div>

      {/* Info de plan */}
      <div className="plan-limits-info">
        <p>
          <strong>Plan {planName}</strong> incluye todos los beneficios del servicio.
        </p>
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
          ¿Necesitas más? Contacta a soporte o upgradea tu plan.
        </p>
      </div>
    </div>
  );
};

export default PlanLimitsDisplay;
