/**
 * AnimatedComponents - Componentes con Hover Effects Premium
 * Incluye: AnimatedCard, AnimatedButton, Ripple Effect
 */
import React, { useState, useRef, useCallback } from 'react';
import './AnimatedComponents.css';

/**
 * AnimatedCard - Tarjeta con efectos hover premium
 */
export const AnimatedCard = ({ 
  children, 
  className = '',
  variant = 'lift', // lift, glow, tilt, scale, border
  onClick,
  disabled = false,
  delay = 0,
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const [tiltStyle, setTiltStyle] = useState({});

  const handleMouseMove = useCallback((e) => {
    if (variant !== 'tilt' || !cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`,
    });
  }, [variant]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (variant === 'tilt') {
      setTiltStyle({ transform: 'perspective(1000px) rotateX(0) rotateY(0) scale(1)' });
    }
  }, [variant]);

  return (
    <div
      ref={cardRef}
      className={`animated-card animated-card--${variant} ${isHovered ? 'is-hovered' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      style={{ 
        ...tiltStyle, 
        animationDelay: `${delay}ms` 
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={!disabled ? onClick : undefined}
      {...props}
    >
      {children}
      {variant === 'glow' && <div className="card-glow-effect" />}
      {variant === 'border' && <div className="card-border-effect" />}
    </div>
  );
};

/**
 * AnimatedButton - Botón con efectos de clic y hover
 */
export const AnimatedButton = ({ 
  children, 
  className = '',
  variant = 'primary', // primary, secondary, ghost, danger, success
  size = 'medium', // small, medium, large
  effect = 'ripple', // ripple, pulse, scale, glow
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  ...props 
}) => {
  const buttonRef = useRef(null);
  const [ripples, setRipples] = useState([]);

  const createRipple = useCallback((e) => {
    if (effect !== 'ripple' || disabled || loading) return;
    
    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const ripple = {
      id: Date.now(),
      x,
      y,
      size
    };
    
    setRipples(prev => [...prev, ripple]);
    
    // Limpiar ripple después de la animación
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, 600);
  }, [effect, disabled, loading]);

  const handleClick = (e) => {
    createRipple(e);
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      className={`
        animated-button 
        animated-button--${variant} 
        animated-button--${size}
        animated-button--effect-${effect}
        ${loading ? 'is-loading' : ''} 
        ${disabled ? 'is-disabled' : ''} 
        ${className}
      `}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {/* Ripple container */}
      {effect === 'ripple' && (
        <span className="ripple-container">
          {ripples.map(ripple => (
            <span
              key={ripple.id}
              className="ripple"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: ripple.size,
                height: ripple.size
              }}
            />
          ))}
        </span>
      )}
      
      {/* Loading spinner */}
      {loading && (
        <span className="button-spinner">
          <span className="spinner-circle" />
        </span>
      )}
      
      {/* Content */}
      <span className={`button-content ${loading ? 'is-hidden' : ''}`}>
        {icon && iconPosition === 'left' && (
          <span className="button-icon button-icon--left">{icon}</span>
        )}
        <span className="button-text">{children}</span>
        {icon && iconPosition === 'right' && (
          <span className="button-icon button-icon--right">{icon}</span>
        )}
      </span>
    </button>
  );
};

/**
 * RippleEffect - Efecto ripple reutilizable
 */
export const RippleEffect = ({ 
  color = 'rgba(255, 255, 255, 0.3)',
  duration = 600,
  children,
  className = '',
  ...props
}) => {
  const containerRef = useRef(null);
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const ripple = { id: Date.now(), x, y, size };
    setRipples(prev => [...prev, ripple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, duration);
  };

  return (
    <div 
      ref={containerRef}
      className={`ripple-wrapper ${className}`}
      onClick={handleClick}
      style={{ '--ripple-color': color, '--ripple-duration': `${duration}ms` }}
      {...props}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="ripple-circle"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size
          }}
        />
      ))}
    </div>
  );
};

/**
 * HoverCard - Tarjeta con efecto hover 3D
 */
export const HoverCard = ({ 
  children, 
  className = '',
  intensity = 10,
  ...props 
}) => {
  const cardRef = useRef(null);
  const [style, setStyle] = useState({});

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * intensity;
    const rotateY = ((centerX - x) / centerX) * intensity;
    
    setStyle({
      transform: `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`,
      transition: 'transform 0.1s ease-out'
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0) rotateY(0)',
      transition: 'transform 0.5s ease-out'
    });
  };

  return (
    <div
      ref={cardRef}
      className={`hover-card ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * MagneticButton - Botón con efecto magnético
 */
export const MagneticButton = ({ 
  children, 
  className = '',
  strength = 0.3,
  ...props 
}) => {
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    setPosition({
      x: x * strength,
      y: y * strength
    });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <button
      ref={buttonRef}
      className={`magnetic-button ${className}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </button>
  );
};

export default AnimatedCard;
