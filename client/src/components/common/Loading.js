/**
 * Loading Component - Indicador de carga
 */
import React from 'react';
import '../../styles/loading.css';

export function Loading({ size = 'medium', text = 'Cargando...' }) {
  return (
    <div className="loading-container">
      <div className={`spinner spinner-${size}`}></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
}
