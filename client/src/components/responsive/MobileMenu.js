/**
 * ========================================
 * MOBILE MENU COMPONENT - NEURIAX
 * Menú hamburguesa animado para móvil
 * ========================================
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './MobileMenu.css';

// ========== HAMBURGER BUTTON ==========
export const HamburgerButton = ({ 
  isOpen, 
  onClick, 
  className = '',
  ariaLabel = 'Menú de navegación'
}) => {
  return (
    <button
      className={`hamburger-btn ${isOpen ? 'is-active' : ''} ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      type="button"
    >
      <span className="hamburger-box">
        <span className="hamburger-line hamburger-line-1"></span>
        <span className="hamburger-line hamburger-line-2"></span>
        <span className="hamburger-line hamburger-line-3"></span>
      </span>
    </button>
  );
};

// ========== MOBILE DRAWER ==========
export const MobileDrawer = ({
  isOpen,
  onClose,
  children,
  position = 'left',
  className = '',
  showOverlay = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  width = '280px'
}) => {
  const drawerRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  
  // Close on escape key
  useEffect(() => {
    if (!closeOnEscape) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);
  
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);
  
  // Swipe to close
  const handleTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
  }, []);
  
  const handleTouchMove = useCallback((e) => {
    if (!drawerRef.current) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    if (position === 'left' && diff < 0) {
      const translateX = Math.max(diff, -280);
      drawerRef.current.style.transform = `translateX(${translateX}px)`;
    } else if (position === 'right' && diff > 0) {
      const translateX = Math.min(diff, 280);
      drawerRef.current.style.transform = `translateX(${translateX}px)`;
    }
  }, [position]);
  
  const handleTouchEnd = useCallback(() => {
    if (!drawerRef.current) return;
    
    const diff = currentX.current - startX.current;
    const threshold = 100;
    
    if ((position === 'left' && diff < -threshold) || 
        (position === 'right' && diff > threshold)) {
      onClose();
    }
    
    drawerRef.current.style.transform = '';
  }, [position, onClose]);
  
  return (
    <>
      {/* Overlay */}
      {showOverlay && (
        <div 
          className={`mobile-drawer-overlay ${isOpen ? 'is-visible' : ''}`}
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />
      )}
      
      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`mobile-drawer mobile-drawer-${position} ${isOpen ? 'is-open' : ''} ${className}`}
        style={{ '--drawer-width': width }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        <div className="mobile-drawer-content">
          {children}
        </div>
      </div>
    </>
  );
};

// ========== MOBILE NAV ==========
export const MobileNav = ({
  items = [],
  activeItem,
  onItemClick,
  onClose,
  header,
  footer,
  className = ''
}) => {
  return (
    <nav className={`mobile-nav ${className}`}>
      {/* Header */}
      {header && (
        <div className="mobile-nav-header">
          {header}
          <button 
            className="mobile-nav-close"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}
      
      {/* Navigation Items */}
      <ul className="mobile-nav-list">
        {items.map((item, index) => (
          <li key={item.id || index} className="mobile-nav-item">
            {item.divider ? (
              <div className="mobile-nav-divider">
                {item.label && <span>{item.label}</span>}
              </div>
            ) : (
              <button
                className={`mobile-nav-link ${activeItem === item.id ? 'is-active' : ''} ${item.disabled ? 'is-disabled' : ''}`}
                onClick={() => {
                  if (!item.disabled) {
                    onItemClick?.(item);
                    if (item.closeOnClick !== false) {
                      onClose?.();
                    }
                  }
                }}
                disabled={item.disabled}
              >
                {item.icon && (
                  <span className="mobile-nav-icon">{item.icon}</span>
                )}
                <span className="mobile-nav-label">{item.label}</span>
                {item.badge && (
                  <span className={`mobile-nav-badge ${item.badgeType || ''}`}>
                    {item.badge}
                  </span>
                )}
                {item.arrow && (
                  <span className="mobile-nav-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </span>
                )}
              </button>
            )}
          </li>
        ))}
      </ul>
      
      {/* Footer */}
      {footer && (
        <div className="mobile-nav-footer">
          {footer}
        </div>
      )}
    </nav>
  );
};

// ========== BOTTOM NAV ==========
export const BottomNav = ({
  items = [],
  activeItem,
  onItemClick,
  className = '',
  showLabels = true
}) => {
  return (
    <nav className={`bottom-nav safe-area-bottom ${className}`}>
      {items.map((item, index) => (
        <button
          key={item.id || index}
          className={`bottom-nav-item ${activeItem === item.id ? 'is-active' : ''}`}
          onClick={() => onItemClick?.(item)}
          aria-label={item.label}
          aria-current={activeItem === item.id ? 'page' : undefined}
        >
          <span className="bottom-nav-icon">
            {item.icon}
            {item.badge && (
              <span className="bottom-nav-badge">{item.badge}</span>
            )}
          </span>
          {showLabels && (
            <span className="bottom-nav-label">{item.label}</span>
          )}
        </button>
      ))}
    </nav>
  );
};

// ========== MOBILE HEADER ==========
export const MobileHeader = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  className = '',
  transparent = false,
  fixed = true
}) => {
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    if (!transparent) return;
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [transparent]);
  
  return (
    <header 
      className={`mobile-header ${fixed ? 'is-fixed' : ''} ${transparent ? 'is-transparent' : ''} ${scrolled ? 'is-scrolled' : ''} safe-area-top ${className}`}
    >
      <div className="mobile-header-left">
        {leftAction}
      </div>
      
      <div className="mobile-header-center">
        {title && <h1 className="mobile-header-title">{title}</h1>}
        {subtitle && <span className="mobile-header-subtitle">{subtitle}</span>}
      </div>
      
      <div className="mobile-header-right">
        {rightAction}
      </div>
    </header>
  );
};

// ========== MOBILE SEARCH ==========
export const MobileSearch = ({
  isOpen,
  onClose,
  onSearch,
  placeholder = 'Buscar...',
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.(query);
  };
  
  return (
    <div className={`mobile-search ${isOpen ? 'is-open' : ''} ${className}`}>
      <form onSubmit={handleSubmit} className="mobile-search-form">
        <button
          type="button"
          className="mobile-search-back"
          onClick={onClose}
          aria-label="Cerrar búsqueda"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="mobile-search-input"
        />
        
        {query && (
          <button
            type="button"
            className="mobile-search-clear"
            onClick={() => setQuery('')}
            aria-label="Limpiar búsqueda"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </button>
        )}
      </form>
    </div>
  );
};

// ========== SWIPE CONTAINER ==========
export const SwipeContainer = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  className = ''
}) => {
  const containerRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const isScrolling = useRef(null);
  
  const handleTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isScrolling.current = null;
  }, []);
  
  const handleTouchMove = useCallback((e) => {
    if (isScrolling.current === true) return;
    
    const diffX = e.touches[0].clientX - startX.current;
    const diffY = e.touches[0].clientY - startY.current;
    
    if (isScrolling.current === null) {
      isScrolling.current = Math.abs(diffY) > Math.abs(diffX);
    }
  }, []);
  
  const handleTouchEnd = useCallback((e) => {
    if (isScrolling.current) return;
    
    const diffX = e.changedTouches[0].clientX - startX.current;
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }
  }, [threshold, onSwipeLeft, onSwipeRight]);
  
  return (
    <div
      ref={containerRef}
      className={`swipe-container ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};

// ========== FAB (FLOATING ACTION BUTTON) ==========
export const FloatingActionButton = ({
  icon,
  onClick,
  label,
  position = 'bottom-right',
  color = 'primary',
  size = 'normal',
  className = ''
}) => {
  return (
    <button
      className={`fab fab-${position} fab-${color} fab-${size} safe-area-bottom ${className}`}
      onClick={onClick}
      aria-label={label}
    >
      <span className="fab-icon">{icon}</span>
      {label && size === 'extended' && (
        <span className="fab-label">{label}</span>
      )}
    </button>
  );
};

// ========== PULL DOWN INDICATOR ==========
export const PullDownIndicator = ({
  progress = 0,
  isRefreshing = false,
  threshold = 80
}) => {
  const rotation = Math.min(progress / threshold * 360, 360);
  const scale = Math.min(progress / threshold, 1);
  
  return (
    <div 
      className={`pull-indicator ${isRefreshing ? 'is-refreshing' : ''}`}
      style={{
        opacity: Math.min(progress / 40, 1),
        transform: `scale(${scale})`
      }}
    >
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <polyline points="1 4 1 10 7 10"></polyline>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
      </svg>
    </div>
  );
};

// ========== EXPORTS ==========
export default {
  HamburgerButton,
  MobileDrawer,
  MobileNav,
  BottomNav,
  MobileHeader,
  MobileSearch,
  SwipeContainer,
  FloatingActionButton,
  PullDownIndicator
};
