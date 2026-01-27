import React from 'react';
import '../styles/UpgradePrompt.css';

/**
 * Componente UpgradePrompt
 * Muestra cuando un usuario ha alcanzado límite de plan
 * Proporciona botones para upgradear o cerrar
 */
const UpgradePrompt = ({ 
  isOpen, 
  onClose, 
  resourceType,
  current,
  limit,
  planName,
  planId
}) => {
  if (!isOpen) return null;

  const resourceLabels = {
    'clientes': 'Cliente',
    'servicios': 'Servicio',
    'empleados': 'Empleado',
    'usuarios': 'Usuario de sistema',
    'reportesAvanzados': 'Reporte avanzado',
    'apiAccess': 'Acceso API'
  };

  const upgradeMessages = {
    'clientes': 'Crea ilimitados clientes con planes superiores',
    'servicios': 'Acceso a más servicios y personalización avanzada',
    'empleados': 'Gestiona equipos más grandes sin límites',
    'usuarios': 'Invita a más usuarios de sistema para tu equipo',
    'reportesAvanzados': 'Reportes detallados, gráficos y análisis avanzado',
    'apiAccess': 'Integración API completa con tus sistemas'
  };

  const recommendedPlans = {
    'trial': 'professional',
    'starter': 'professional',
    'professional': 'enterprise',
    'enterprise': null
  };

  const handleUpgrade = () => {
    window.location.href = '/checkout?upgrade=true&plan=' + (recommendedPlans[planId] || 'professional');
  };

  return (
    <div className="upgrade-prompt-overlay" onClick={onClose}>
      <div className="upgrade-prompt-modal" onClick={(e) => e.stopPropagation()}>
        {/* Cerrar */}
        <button className="upgrade-prompt-close" onClick={onClose}>
          ✕
        </button>

        {/* Icono */}
        <div className="upgrade-prompt-icon">
          📊
        </div>

        {/* Contenido */}
        <div className="upgrade-prompt-content">
          <h2 className="upgrade-prompt-title">
            Límite de plan alcanzado
          </h2>

          <p className="upgrade-prompt-description">
            Has alcanzado el límite de <strong>{limit}</strong> {resourceLabels[resourceType]?.toLowerCase() || resourceType}s 
            en tu plan <strong>{planName}</strong>.
          </p>

          {/* Estadísticas */}
          <div className="upgrade-prompt-stats">
            <div className="upgrade-prompt-stat">
              <div className="stat-value">{current}</div>
              <div className="stat-label">Actual</div>
            </div>
            <div className="upgrade-prompt-stat-divider">de</div>
            <div className="upgrade-prompt-stat">
              <div className="stat-value">{limit}</div>
              <div className="stat-label">Límite</div>
            </div>
          </div>

          {/* Beneficios */}
          <div className="upgrade-prompt-benefit">
            <p className="benefit-title">¿Qué obtendrás con un plan superior?</p>
            <p className="benefit-text">
              {upgradeMessages[resourceType] || 'Más recursos y funcionalidades premium'}
            </p>
          </div>

          {/* Botones */}
          <div className="upgrade-prompt-actions">
            <button 
              className="upgrade-prompt-btn upgrade-btn"
              onClick={handleUpgrade}
            >
              💳 Upgradear ahora
            </button>
            <button 
              className="upgrade-prompt-btn close-btn"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>

          {/* Pie */}
          <p className="upgrade-prompt-footer">
            Obtén acceso ilimitado y funcionalidades premium
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradePrompt;
