/**
 * FeedbackAnimations - Animaciones de Success/Error/Warning
 * Proporciona feedback visual animado al usuario
 */
import React, { useEffect, useState, useCallback } from 'react';
import './FeedbackAnimations.css';

/**
 * SuccessAnimation - Checkmark animado
 */
export const SuccessAnimation = ({ 
  size = 'medium', // small, medium, large
  message,
  onComplete,
  autoHide = false,
  duration = 2000,
  className = '' 
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onComplete]);

  if (!visible) return null;

  return (
    <div className={`feedback-animation success-animation success-animation--${size} ${className}`}>
      <div className="success-icon">
        <svg viewBox="0 0 52 52" className="success-svg">
          <circle className="success-circle" cx="26" cy="26" r="25" fill="none" />
          <path className="success-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
        </svg>
      </div>
      {message && <p className="feedback-message">{message}</p>}
    </div>
  );
};

/**
 * ErrorAnimation - X animada
 */
export const ErrorAnimation = ({ 
  size = 'medium',
  message,
  onComplete,
  autoHide = false,
  duration = 2000,
  shake = true,
  className = '' 
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onComplete]);

  if (!visible) return null;

  return (
    <div className={`feedback-animation error-animation error-animation--${size} ${shake ? 'animate-shake' : ''} ${className}`}>
      <div className="error-icon">
        <svg viewBox="0 0 52 52" className="error-svg">
          <circle className="error-circle" cx="26" cy="26" r="25" fill="none" />
          <path className="error-x" fill="none" d="M16 16 36 36 M36 16 16 36" />
        </svg>
      </div>
      {message && <p className="feedback-message">{message}</p>}
    </div>
  );
};

/**
 * WarningAnimation - Triángulo de advertencia animado
 */
export const WarningAnimation = ({ 
  size = 'medium',
  message,
  onComplete,
  autoHide = false,
  duration = 3000,
  pulse = true,
  className = '' 
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onComplete]);

  if (!visible) return null;

  return (
    <div className={`feedback-animation warning-animation warning-animation--${size} ${pulse ? 'animate-pulse' : ''} ${className}`}>
      <div className="warning-icon">
        <svg viewBox="0 0 52 52" className="warning-svg">
          <path 
            className="warning-triangle" 
            fill="none" 
            d="M26 8 L48 44 L4 44 Z" 
          />
          <line className="warning-exclamation-line" x1="26" y1="20" x2="26" y2="32" />
          <circle className="warning-exclamation-dot" cx="26" cy="38" r="2" />
        </svg>
      </div>
      {message && <p className="feedback-message">{message}</p>}
    </div>
  );
};

/**
 * InfoAnimation - Información animada
 */
export const InfoAnimation = ({ 
  size = 'medium',
  message,
  onComplete,
  autoHide = false,
  duration = 2000,
  className = '' 
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onComplete]);

  if (!visible) return null;

  return (
    <div className={`feedback-animation info-animation info-animation--${size} ${className}`}>
      <div className="info-icon">
        <svg viewBox="0 0 52 52" className="info-svg">
          <circle className="info-circle" cx="26" cy="26" r="25" fill="none" />
          <circle className="info-dot" cx="26" cy="16" r="3" />
          <line className="info-line" x1="26" y1="24" x2="26" y2="40" />
        </svg>
      </div>
      {message && <p className="feedback-message">{message}</p>}
    </div>
  );
};

/**
 * FeedbackToast - Toast animado con feedback
 */
export const FeedbackToast = ({ 
  type = 'success', // success, error, warning, info
  message,
  title,
  onClose,
  duration = 4000,
  position = 'top-right',
  showIcon = true,
  showProgress = true,
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  if (!isVisible) return null;

  const icons = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i'
  };

  return (
    <div 
      className={`
        feedback-toast 
        feedback-toast--${type} 
        feedback-toast--${position}
        ${isLeaving ? 'is-leaving' : 'is-entering'}
        ${className}
      `}
    >
      {showIcon && (
        <div className="toast-icon">
          <span>{icons[type]}</span>
        </div>
      )}
      <div className="toast-content">
        {title && <strong className="toast-title">{title}</strong>}
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close" onClick={handleClose}>
        ✕
      </button>
      {showProgress && duration > 0 && (
        <div 
          className="toast-progress"
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
};

/**
 * ConfettiEffect - Efecto de confetti para celebraciones
 */
export const ConfettiEffect = ({ 
  active = false,
  particleCount = 50,
  duration = 3000,
  className = '' 
}) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (active) {
      const colors = ['#6c5ce7', '#00b894', '#fd79a8', '#fdcb6e', '#74b9ff', '#e17055'];
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        left: Math.random() * 100,
        delay: Math.random() * 500,
        duration: 2000 + Math.random() * 1000,
        rotation: Math.random() * 360
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, particleCount, duration]);

  if (!active || particles.length === 0) return null;

  return (
    <div className={`confetti-container ${className}`}>
      {particles.map(particle => (
        <span
          key={particle.id}
          className="confetti-particle"
          style={{
            left: `${particle.left}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}ms`,
            animationDuration: `${particle.duration}ms`,
            transform: `rotate(${particle.rotation}deg)`
          }}
        />
      ))}
    </div>
  );
};

/**
 * CountUpAnimation - Número que cuenta hacia arriba
 */
export const CountUpAnimation = ({ 
  end,
  start = 0,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
  onComplete,
  className = '' 
}) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    const startTime = Date.now();
    const range = end - start;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (range * easeOut);
      
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    requestAnimationFrame(animate);
  }, [start, end, duration, onComplete]);

  return (
    <span className={`count-up ${className}`}>
      {prefix}{count.toFixed(decimals)}{suffix}
    </span>
  );
};

/**
 * TypewriterText - Texto que se escribe letra por letra
 */
export const TypewriterText = ({ 
  text,
  speed = 50,
  delay = 0,
  cursor = true,
  onComplete,
  className = '' 
}) => {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(cursor);

  useEffect(() => {
    let currentIndex = 0;
    
    const startTyping = () => {
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
          if (cursor) {
            setTimeout(() => setShowCursor(false), 1000);
          }
          onComplete?.();
        }
      }, speed);

      return () => clearInterval(interval);
    };

    const timeout = setTimeout(startTyping, delay);
    return () => clearTimeout(timeout);
  }, [text, speed, delay, cursor, onComplete]);

  return (
    <span className={`typewriter ${className}`}>
      {displayText}
      {showCursor && <span className="typewriter-cursor">|</span>}
    </span>
  );
};

const FeedbackAnimations = {
  SuccessAnimation,
  ErrorAnimation,
  WarningAnimation,
  InfoAnimation,
  FeedbackToast,
  ConfettiEffect,
  CountUpAnimation,
  TypewriterText
};

export default FeedbackAnimations;
