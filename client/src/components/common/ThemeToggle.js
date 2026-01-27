/**
 * ThemeToggle - Toggle Animado Profesional Día/Noche
 * Componente premium con animaciones suaves y diseño moderno
 */
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = ({ size = 'medium', showLabel = false, className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  const sizeClasses = {
    small: 'theme-toggle--small',
    medium: 'theme-toggle--medium',
    large: 'theme-toggle--large'
  };

  return (
    <div className={`theme-toggle-wrapper ${className}`}>
      <button
        className={`theme-toggle ${sizeClasses[size]} ${isDark ? 'theme-toggle--dark' : 'theme-toggle--light'}`}
        onClick={toggleTheme}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
      >
        {/* Sol */}
        <div className="theme-toggle__sun">
          <div className="sun-icon">
            <div className="sun-core"></div>
            <div className="sun-rays">
              {[...Array(8)].map((_, i) => (
                <span key={i} className="sun-ray" style={{ '--i': i }}></span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Luna */}
        <div className="theme-toggle__moon">
          <div className="moon-icon">
            <div className="moon-surface"></div>
            <div className="moon-craters">
              <span className="crater crater--1"></span>
              <span className="crater crater--2"></span>
              <span className="crater crater--3"></span>
            </div>
            <div className="stars">
              <span className="star star--1"></span>
              <span className="star star--2"></span>
              <span className="star star--3"></span>
            </div>
          </div>
        </div>
        
        {/* Slider background */}
        <div className="theme-toggle__slider">
          <div className="slider-track">
            <div className="slider-thumb"></div>
          </div>
        </div>
      </button>
      
      {showLabel && (
        <span className="theme-toggle__label">
          {isDark ? 'Oscuro' : 'Claro'}
        </span>
      )}
    </div>
  );
};

/**
 * ThemeToggleCompact - Versión compacta para headers
 * Solo muestra el icono con animación
 */
export const ThemeToggleCompact = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      className={`theme-toggle-compact ${isDark ? 'is-dark' : 'is-light'} ${className}`}
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
    >
      <div className="toggle-icon-wrapper">
        {/* Sol */}
        <svg 
          className="toggle-icon sun-icon-svg"
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
        
        {/* Luna */}
        <svg 
          className="toggle-icon moon-icon-svg"
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </div>
    </button>
  );
};

/**
 * ThemeToggleSwitch - Estilo interruptor moderno
 */
export const ThemeToggleSwitch = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <label className={`theme-switch ${className}`}>
      <input
        type="checkbox"
        checked={isDark}
        onChange={toggleTheme}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      />
      <span className="theme-switch__slider">
        <span className="theme-switch__icon theme-switch__icon--sun">
          ☀️
        </span>
        <span className="theme-switch__icon theme-switch__icon--moon">
          🌙
        </span>
      </span>
    </label>
  );
};

export default ThemeToggle;
