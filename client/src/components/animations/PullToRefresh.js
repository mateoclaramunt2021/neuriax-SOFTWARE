/**
 * PullToRefresh - Componente Pull-to-Refresh para móviles
 * Permite refrescar contenido arrastrando hacia abajo
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import './PullToRefresh.css';

/**
 * PullToRefresh - Wrapper para contenido con pull-to-refresh
 */
export const PullToRefresh = ({
  children,
  onRefresh,
  pullDownThreshold = 80,
  maxPullDown = 120,
  refreshIndicatorHeight = 60,
  disabled = false,
  className = '',
  loadingComponent = null,
  pullingComponent = null,
  releaseComponent = null
}) => {
  const containerRef = useRef(null);
  const [state, setState] = useState({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0
  });
  
  const startY = useRef(0);
  const currentY = useRef(0);

  // Manejar inicio del touch
  const handleTouchStart = useCallback((e) => {
    if (disabled || state.isRefreshing) return;
    
    // Solo iniciar si estamos en el top del scroll
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      setState(prev => ({ ...prev, isPulling: true }));
    }
  }, [disabled, state.isRefreshing]);

  // Manejar movimiento del touch
  const handleTouchMove = useCallback((e) => {
    if (!state.isPulling || disabled || state.isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0) {
      // Aplicar resistencia al pull
      const resistance = 0.5;
      const pullDistance = Math.min(diff * resistance, maxPullDown);
      
      setState(prev => ({ ...prev, pullDistance }));

      // Prevenir scroll nativo cuando estamos haciendo pull
      if (containerRef.current && containerRef.current.scrollTop <= 0) {
        e.preventDefault();
      }
    }
  }, [state.isPulling, disabled, state.isRefreshing, maxPullDown]);

  // Manejar fin del touch
  const handleTouchEnd = useCallback(async () => {
    if (!state.isPulling || disabled) return;

    if (state.pullDistance >= pullDownThreshold) {
      // Ejecutar refresh
      setState(prev => ({ 
        ...prev, 
        isRefreshing: true,
        isPulling: false,
        pullDistance: refreshIndicatorHeight 
      }));

      try {
        await onRefresh?.();
      } catch (error) {
        console.error('Error during refresh:', error);
      } finally {
        // Reset después del refresh
        setState({
          isPulling: false,
          isRefreshing: false,
          pullDistance: 0
        });
      }
    } else {
      // No alcanzó el threshold, reset
      setState({
        isPulling: false,
        isRefreshing: false,
        pullDistance: 0
      });
    }

    startY.current = 0;
    currentY.current = 0;
  }, [state.isPulling, state.pullDistance, pullDownThreshold, refreshIndicatorHeight, onRefresh, disabled]);

  // Calcular el progreso del pull
  const pullProgress = Math.min(state.pullDistance / pullDownThreshold, 1);
  const shouldRelease = state.pullDistance >= pullDownThreshold;

  // Renderizar el indicador
  const renderIndicator = () => {
    if (state.isRefreshing) {
      return loadingComponent || (
        <div className="ptr-loading">
          <div className="ptr-spinner">
            <svg viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
            </svg>
          </div>
          <span>Actualizando...</span>
        </div>
      );
    }

    if (shouldRelease) {
      return releaseComponent || (
        <div className="ptr-release">
          <div className="ptr-arrow ptr-arrow--up">↑</div>
          <span>Soltar para actualizar</span>
        </div>
      );
    }

    return pullingComponent || (
      <div className="ptr-pulling">
        <div 
          className="ptr-arrow"
          style={{ transform: `rotate(${pullProgress * 180}deg)` }}
        >
          ↓
        </div>
        <span>Deslizar para actualizar</span>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`pull-to-refresh-container ${className} ${state.isRefreshing ? 'is-refreshing' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Indicador de refresh */}
      <div 
        className="ptr-indicator"
        style={{
          height: state.pullDistance > 0 ? state.pullDistance : 0,
          opacity: pullProgress,
          transition: state.isPulling ? 'none' : 'all 0.3s ease'
        }}
      >
        {renderIndicator()}
      </div>

      {/* Contenido principal */}
      <div 
        className="ptr-content"
        style={{
          transform: `translateY(${state.pullDistance}px)`,
          transition: state.isPulling ? 'none' : 'transform 0.3s ease'
        }}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Hook para pull-to-refresh custom
 */
export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  maxPull = 120,
  disabled = false
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const targetRef = useRef(null);

  useEffect(() => {
    const element = targetRef.current;
    if (!element || disabled) return;

    const handleTouchStart = (e) => {
      if (element.scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling || isRefreshing) return;
      
      const diff = e.touches[0].clientY - startY.current;
      if (diff > 0 && element.scrollTop <= 0) {
        const resistance = 0.5;
        setPullDistance(Math.min(diff * resistance, maxPull));
        e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh?.();
        } finally {
          setIsRefreshing(false);
        }
      }

      setPullDistance(0);
      setIsPulling(false);
      startY.current = 0;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, isPulling, isRefreshing, maxPull, onRefresh, pullDistance, threshold]);

  return {
    targetRef,
    isRefreshing,
    pullDistance,
    isPulling,
    progress: Math.min(pullDistance / threshold, 1),
    shouldRelease: pullDistance >= threshold
  };
};

/**
 * SwipeRefresh - Versión simplificada del pull-to-refresh
 */
export const SwipeRefresh = ({
  children,
  onRefresh,
  refreshing = false,
  disabled = false,
  className = ''
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);

  const threshold = 80;

  const handleTouchStart = (e) => {
    if (disabled || refreshing) return;
    if (containerRef.current?.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling || disabled || refreshing) return;
    
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 120));
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance >= threshold) {
      onRefresh?.();
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  const progress = pullDistance / threshold;

  return (
    <div
      ref={containerRef}
      className={`swipe-refresh ${className} ${refreshing ? 'is-refreshing' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="swipe-refresh-indicator"
        style={{
          transform: `translateY(${pullDistance - 50}px) scale(${Math.min(progress, 1)})`,
          opacity: progress
        }}
      >
        <div className={`swipe-refresh-spinner ${refreshing ? 'is-spinning' : ''}`}>
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" strokeWidth="2" />
          </svg>
        </div>
      </div>
      
      <div 
        className="swipe-refresh-content"
        style={{
          transform: `translateY(${pullDistance}px)`
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
