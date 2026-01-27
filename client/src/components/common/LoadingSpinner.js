/**
 * Loading Spinner Component
 * Componente reutilizable para estados de carga
 */
import React from 'react';
import '../../styles/loading.css';

export function LoadingSpinner({ 
  size = 'medium', 
  color = 'primary',
  text = '',
  fullScreen = false,
  overlay = false 
}) {
  const spinnerClasses = `spinner spinner-${size} spinner-${color}`;
  
  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className={spinnerClasses}>
          <div className="spinner-circle"></div>
          <div className="spinner-circle"></div>
          <div className="spinner-circle"></div>
        </div>
        {text && <p className="loading-text">{text}</p>}
      </div>
    );
  }
  
  if (overlay) {
    return (
      <div className="loading-overlay">
        <div className={spinnerClasses}>
          <div className="spinner-circle"></div>
          <div className="spinner-circle"></div>
          <div className="spinner-circle"></div>
        </div>
        {text && <p className="loading-text">{text}</p>}
      </div>
    );
  }
  
  return (
    <div className="loading-inline">
      <div className={spinnerClasses}>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
}

export function LoadingSkeleton({ 
  width = '100%', 
  height = '20px', 
  rounded = false,
  circle = false,
  count = 1,
  gap = '10px'
}) {
  const style = {
    width: circle ? height : width,
    height,
    borderRadius: circle ? '50%' : rounded ? '8px' : '4px'
  };
  
  if (count === 1) {
    return <div className="skeleton" style={style}></div>;
  }
  
  return (
    <div className="skeleton-group" style={{ gap }}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="skeleton" style={style}></div>
      ))}
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="loading-card">
      <div className="loading-card-header">
        <LoadingSkeleton circle height="40px" />
        <div className="loading-card-title">
          <LoadingSkeleton width="60%" height="16px" />
          <LoadingSkeleton width="40%" height="12px" />
        </div>
      </div>
      <LoadingSkeleton width="100%" height="80px" rounded />
      <div className="loading-card-footer">
        <LoadingSkeleton width="30%" height="14px" />
        <LoadingSkeleton width="20%" height="14px" />
      </div>
    </div>
  );
}

export function LoadingTable({ rows = 5, cols = 4 }) {
  return (
    <div className="loading-table">
      <div className="loading-table-header">
        {[...Array(cols)].map((_, i) => (
          <LoadingSkeleton key={i} width={`${100/cols}%`} height="20px" />
        ))}
      </div>
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="loading-table-row">
          {[...Array(cols)].map((_, colIndex) => (
            <LoadingSkeleton 
              key={colIndex} 
              width={`${80 + Math.random() * 20}%`} 
              height="16px" 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function LoadingButton({ children = 'Cargando...', disabled = true }) {
  return (
    <button className="loading-button" disabled={disabled}>
      <span className="loading-button-spinner"></span>
      {children}
    </button>
  );
}

export default LoadingSpinner;
