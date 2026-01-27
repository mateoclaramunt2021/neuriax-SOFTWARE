/**
 * LoadingStates - Estados de Carga Animados
 * Incluye: Skeletons, Spinners, Progress Bars, Dots
 */
import React from 'react';
import './LoadingStates.css';

/**
 * Spinner - Indicador de carga circular
 */
export const Spinner = ({ 
  size = 'medium', // small, medium, large, xl
  color = 'primary', // primary, secondary, white, current
  className = '' 
}) => (
  <div className={`spinner spinner--${size} spinner--${color} ${className}`}>
    <div className="spinner-circle" />
  </div>
);

/**
 * LoadingDots - Puntos animados
 */
export const LoadingDots = ({ 
  size = 'medium',
  color = 'primary',
  className = '' 
}) => (
  <div className={`loading-dots loading-dots--${size} loading-dots--${color} ${className}`}>
    <span className="dot" />
    <span className="dot" />
    <span className="dot" />
  </div>
);

/**
 * PulseLoader - Círculo pulsante
 */
export const PulseLoader = ({ 
  size = 'medium',
  color = 'primary',
  className = '' 
}) => (
  <div className={`pulse-loader pulse-loader--${size} pulse-loader--${color} ${className}`}>
    <span className="pulse-ring" />
    <span className="pulse-core" />
  </div>
);

/**
 * ProgressBar - Barra de progreso animada
 */
export const ProgressBar = ({ 
  progress = 0, // 0-100 o undefined para indeterminado
  variant = 'default', // default, striped, animated
  color = 'primary',
  showLabel = false,
  height = 8,
  className = '' 
}) => {
  const isIndeterminate = progress === undefined || progress === null;
  
  return (
    <div 
      className={`progress-bar progress-bar--${variant} progress-bar--${color} ${isIndeterminate ? 'progress-bar--indeterminate' : ''} ${className}`}
      style={{ '--progress-height': `${height}px` }}
    >
      <div 
        className="progress-bar-track"
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : progress}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div 
          className="progress-bar-fill"
          style={{ width: isIndeterminate ? '100%' : `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showLabel && !isIndeterminate && (
        <span className="progress-bar-label">{Math.round(progress)}%</span>
      )}
    </div>
  );
};

/**
 * Skeleton - Placeholder animado para contenido
 */
export const Skeleton = ({ 
  variant = 'text', // text, title, avatar, card, image, button
  width,
  height,
  className = '',
  lines = 1,
  ...props 
}) => {
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`skeleton-group ${className}`} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i}
            className="skeleton skeleton--text"
            style={{ 
              width: i === lines - 1 ? '70%' : '100%',
              height 
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div 
      className={`skeleton skeleton--${variant} ${className}`}
      style={{ width, height }}
      {...props}
    />
  );
};

/**
 * SkeletonCard - Tarjeta skeleton completa
 */
export const SkeletonCard = ({ 
  showAvatar = true,
  showImage = false,
  lines = 3,
  className = '' 
}) => (
  <div className={`skeleton-card ${className}`}>
    {showImage && <Skeleton variant="image" />}
    <div className="skeleton-card-body">
      {showAvatar && (
        <div className="skeleton-card-header">
          <Skeleton variant="avatar" />
          <div className="skeleton-card-meta">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      )}
      <Skeleton variant="title" />
      <Skeleton variant="text" lines={lines} />
    </div>
  </div>
);

/**
 * SkeletonTable - Tabla skeleton
 */
export const SkeletonTable = ({ 
  rows = 5,
  columns = 4,
  className = '' 
}) => (
  <div className={`skeleton-table ${className}`}>
    <div className="skeleton-table-header">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="skeleton-table-row">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" />
        ))}
      </div>
    ))}
  </div>
);

/**
 * LoadingOverlay - Overlay de carga sobre contenido
 */
export const LoadingOverlay = ({ 
  isLoading = false,
  children,
  message = 'Cargando...',
  blur = true,
  className = '' 
}) => (
  <div className={`loading-overlay-container ${className}`}>
    {children}
    {isLoading && (
      <div className={`loading-overlay ${blur ? 'loading-overlay--blur' : ''}`}>
        <div className="loading-overlay-content">
          <Spinner size="large" />
          {message && <p className="loading-overlay-message">{message}</p>}
        </div>
      </div>
    )}
  </div>
);

/**
 * PageLoader - Loader de página completa
 */
export const PageLoader = ({ 
  message = 'Cargando...',
  showLogo = true,
  className = '' 
}) => (
  <div className={`page-loader ${className}`}>
    <div className="page-loader-content">
      {showLogo && (
        <div className="page-loader-logo">
          <span className="logo-text">NEURIAX</span>
        </div>
      )}
      <Spinner size="large" />
      <p className="page-loader-message">{message}</p>
    </div>
  </div>
);

/**
 * ButtonLoader - Loader inline para botones
 */
export const ButtonLoader = ({ 
  size = 'small',
  color = 'white' 
}) => (
  <span className={`button-loader button-loader--${size} button-loader--${color}`}>
    <span className="button-loader-circle" />
  </span>
);

/**
 * ContentLoader - Animación de contenido cargando
 */
export const ContentLoader = ({ 
  width = '100%',
  height = 200,
  children,
  className = '' 
}) => (
  <div 
    className={`content-loader ${className}`}
    style={{ width, height }}
  >
    {children || (
      <>
        <Skeleton variant="title" width="40%" />
        <Skeleton variant="text" lines={4} />
        <Skeleton variant="button" width="120px" />
      </>
    )}
  </div>
);

/**
 * InlineLoader - Loader inline con texto
 */
export const InlineLoader = ({ 
  text = 'Cargando',
  className = '' 
}) => (
  <span className={`inline-loader ${className}`}>
    <span className="inline-loader-text">{text}</span>
    <LoadingDots size="small" />
  </span>
);

const LoadingStates = {
  Spinner,
  LoadingDots,
  PulseLoader,
  ProgressBar,
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  LoadingOverlay,
  PageLoader,
  ButtonLoader,
  ContentLoader,
  InlineLoader
};

export default LoadingStates;
