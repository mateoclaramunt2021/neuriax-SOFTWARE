/**
 * PageTransition - Transiciones de Página Profesionales
 * Proporciona animaciones suaves entre módulos/páginas
 */
import React, { useEffect, useState, useRef } from 'react';
import './PageTransition.css';

/**
 * Tipos de transición disponibles
 */
export const TRANSITION_TYPES = {
  FADE: 'fade',
  SLIDE_UP: 'slide-up',
  SLIDE_DOWN: 'slide-down',
  SLIDE_LEFT: 'slide-left',
  SLIDE_RIGHT: 'slide-right',
  SCALE: 'scale',
  ZOOM: 'zoom',
  FLIP: 'flip',
  NONE: 'none'
};

/**
 * PageTransition Component
 * Envuelve contenido y aplica transiciones al montarse/desmontarse
 */
const PageTransition = ({ 
  children, 
  type = TRANSITION_TYPES.FADE,
  duration = 300,
  delay = 0,
  className = '',
  onEnter,
  onEntered,
  onExit,
  onExited,
  show = true
}) => {
  const [state, setState] = useState(show ? 'entered' : 'exited');
  const [mounted, setMounted] = useState(show);
  const nodeRef = useRef(null);

  useEffect(() => {
    if (show) {
      setMounted(true);
      setState('entering');
      onEnter?.();
      
      const timer = setTimeout(() => {
        setState('entered');
        onEntered?.();
      }, duration + delay);
      
      return () => clearTimeout(timer);
    } else {
      setState('exiting');
      onExit?.();
      
      const timer = setTimeout(() => {
        setState('exited');
        setMounted(false);
        onExited?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, delay, onEnter, onEntered, onExit, onExited]);

  if (!mounted) return null;

  const transitionStyle = {
    '--transition-duration': `${duration}ms`,
    '--transition-delay': `${delay}ms`
  };

  return (
    <div 
      ref={nodeRef}
      className={`page-transition page-transition--${type} page-transition--${state} ${className}`}
      style={transitionStyle}
    >
      {children}
    </div>
  );
};

/**
 * FadeTransition - Transición de opacidad simple
 */
export const FadeTransition = ({ children, show = true, duration = 300, ...props }) => (
  <PageTransition type={TRANSITION_TYPES.FADE} show={show} duration={duration} {...props}>
    {children}
  </PageTransition>
);

/**
 * SlideTransition - Transición de deslizamiento
 */
export const SlideTransition = ({ 
  children, 
  direction = 'up',
  show = true, 
  duration = 300, 
  ...props 
}) => {
  const typeMap = {
    up: TRANSITION_TYPES.SLIDE_UP,
    down: TRANSITION_TYPES.SLIDE_DOWN,
    left: TRANSITION_TYPES.SLIDE_LEFT,
    right: TRANSITION_TYPES.SLIDE_RIGHT
  };
  
  return (
    <PageTransition 
      type={typeMap[direction] || TRANSITION_TYPES.SLIDE_UP} 
      show={show} 
      duration={duration} 
      {...props}
    >
      {children}
    </PageTransition>
  );
};

/**
 * ScaleTransition - Transición de escala
 */
export const ScaleTransition = ({ children, show = true, duration = 300, ...props }) => (
  <PageTransition type={TRANSITION_TYPES.SCALE} show={show} duration={duration} {...props}>
    {children}
  </PageTransition>
);

/**
 * ModuleTransition - Específico para módulos del Dashboard
 * Aplica transiciones al cambiar de módulo activo
 */
export const ModuleTransition = ({ 
  children, 
  moduleKey,
  type = TRANSITION_TYPES.FADE,
  duration = 250
}) => {
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionState, setTransitionState] = useState('entered');
  const prevKeyRef = useRef(moduleKey);

  useEffect(() => {
    if (prevKeyRef.current !== moduleKey) {
      // Iniciar exit
      setTransitionState('exiting');
      
      const exitTimer = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionState('entering');
        
        const enterTimer = setTimeout(() => {
          setTransitionState('entered');
        }, duration);
        
        return () => clearTimeout(enterTimer);
      }, duration / 2);
      
      prevKeyRef.current = moduleKey;
      return () => clearTimeout(exitTimer);
    } else {
      setDisplayChildren(children);
    }
  }, [moduleKey, children, duration]);

  return (
    <div 
      className={`module-transition module-transition--${type} module-transition--${transitionState}`}
      style={{ '--transition-duration': `${duration}ms` }}
    >
      {displayChildren}
    </div>
  );
};

/**
 * StaggeredList - Lista con animación escalonada
 */
export const StaggeredList = ({ 
  children, 
  staggerDelay = 50,
  type = 'fadeInUp',
  className = ''
}) => {
  const items = React.Children.toArray(children);
  
  return (
    <div className={`staggered-list ${className}`}>
      {items.map((child, index) => (
        <div 
          key={index}
          className={`staggered-item animate-${type}`}
          style={{ 
            animationDelay: `${index * staggerDelay}ms`,
            animationFillMode: 'both'
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

/**
 * AnimatedPresence - Detecta cuando elementos entran/salen del DOM
 */
export const AnimatedPresence = ({ 
  children, 
  initial = true,
  exitBeforeEnter = false 
}) => {
  const [currentChildren, setCurrentChildren] = useState(children);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (exitBeforeEnter && isAnimating) return;
    
    if (children !== currentChildren) {
      if (exitBeforeEnter) {
        setIsAnimating(true);
        // Esperar a que termine la animación de salida
        setTimeout(() => {
          setCurrentChildren(children);
          setIsAnimating(false);
        }, 300);
      } else {
        setCurrentChildren(children);
      }
    }
  }, [children, currentChildren, exitBeforeEnter, isAnimating]);

  return <>{currentChildren}</>;
};

/**
 * Hook para controlar transiciones programáticamente
 */
export const usePageTransition = (initialShow = true) => {
  const [isVisible, setIsVisible] = useState(initialShow);
  const [isAnimating, setIsAnimating] = useState(false);

  const show = (callback) => {
    setIsAnimating(true);
    setIsVisible(true);
    setTimeout(() => {
      setIsAnimating(false);
      callback?.();
    }, 300);
  };

  const hide = (callback) => {
    setIsAnimating(true);
    setIsVisible(false);
    setTimeout(() => {
      setIsAnimating(false);
      callback?.();
    }, 300);
  };

  const toggle = (callback) => {
    if (isVisible) {
      hide(callback);
    } else {
      show(callback);
    }
  };

  return {
    isVisible,
    isAnimating,
    show,
    hide,
    toggle
  };
};

export default PageTransition;
