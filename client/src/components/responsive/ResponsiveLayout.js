/**
 * ========================================
 * RESPONSIVE LAYOUT COMPONENT - NEURIAX
 * Layout adaptativo con sidebar colapsable
 * ========================================
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import './ResponsiveLayout.css';

// ========== BREAKPOINTS ==========
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

// ========== RESPONSIVE CONTEXT ==========
const ResponsiveContext = createContext({
  isMobile: true,
  isTablet: false,
  isDesktop: false,
  sidebarOpen: false,
  toggleSidebar: () => {},
  closeSidebar: () => {},
  breakpoint: 'xs'
});

export const useResponsive = () => useContext(ResponsiveContext);

// ========== USE BREAKPOINT HOOK ==========
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('xs');
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setDimensions({ width, height: window.innerHeight });
      
      if (width >= BREAKPOINTS['2xl']) setBreakpoint('2xl');
      else if (width >= BREAKPOINTS.xl) setBreakpoint('xl');
      else if (width >= BREAKPOINTS.lg) setBreakpoint('lg');
      else if (width >= BREAKPOINTS.md) setBreakpoint('md');
      else if (width >= BREAKPOINTS.sm) setBreakpoint('sm');
      else setBreakpoint('xs');
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return {
    breakpoint,
    ...dimensions,
    isMobile: dimensions.width < BREAKPOINTS.md,
    isTablet: dimensions.width >= BREAKPOINTS.md && dimensions.width < BREAKPOINTS.lg,
    isDesktop: dimensions.width >= BREAKPOINTS.lg,
    isXs: breakpoint === 'xs',
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    is2xl: breakpoint === '2xl'
  };
};

// ========== RESPONSIVE LAYOUT ==========
export const ResponsiveLayout = ({
  children,
  className = '',
  sidebarWidth = 280,
  collapsedWidth = 70,
  breakpoint = 'lg'
}) => {
  const responsive = useBreakpoint();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const isMobileView = responsive.width < BREAKPOINTS[breakpoint];
  
  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    if (isMobileView && sidebarOpen) {
      const handleClick = (e) => {
        if (!e.target.closest('.responsive-sidebar')) {
          setSidebarOpen(false);
        }
      };
      
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [isMobileView, sidebarOpen]);
  
  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobileView) {
      setSidebarOpen(false);
    }
  }, [isMobileView]);
  
  const toggleSidebar = useCallback(() => {
    if (isMobileView) {
      setSidebarOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  }, [isMobileView]);
  
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);
  
  const contextValue = {
    ...responsive,
    sidebarOpen: isMobileView ? sidebarOpen : true,
    sidebarCollapsed: !isMobileView && sidebarCollapsed,
    toggleSidebar,
    closeSidebar,
    isMobileView
  };
  
  return (
    <ResponsiveContext.Provider value={contextValue}>
      <div 
        className={`responsive-layout ${className}`}
        style={{
          '--sidebar-width': `${sidebarWidth}px`,
          '--sidebar-collapsed-width': `${collapsedWidth}px`
        }}
        data-sidebar-open={sidebarOpen}
        data-sidebar-collapsed={sidebarCollapsed}
        data-mobile={isMobileView}
      >
        {children}
      </div>
    </ResponsiveContext.Provider>
  );
};

// ========== RESPONSIVE SIDEBAR ==========
export const ResponsiveSidebar = ({
  children,
  className = '',
  header,
  footer
}) => {
  const { sidebarOpen, sidebarCollapsed, closeSidebar, isMobileView } = useResponsive();
  
  return (
    <>
      {/* Mobile overlay */}
      {isMobileView && sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
      
      <aside 
        className={`
          responsive-sidebar
          ${sidebarOpen || !isMobileView ? 'is-open' : ''}
          ${sidebarCollapsed ? 'is-collapsed' : ''}
          ${className}
        `}
      >
        {header && (
          <div className="sidebar-header">
            {header}
          </div>
        )}
        
        <div className="sidebar-content">
          {children}
        </div>
        
        {footer && (
          <div className="sidebar-footer">
            {footer}
          </div>
        )}
      </aside>
    </>
  );
};

// ========== RESPONSIVE CONTENT ==========
export const ResponsiveContent = ({
  children,
  className = '',
  header,
  padding = true
}) => {
  const { sidebarCollapsed, isMobileView } = useResponsive();
  
  return (
    <main 
      className={`
        responsive-content
        ${sidebarCollapsed ? 'sidebar-collapsed' : ''}
        ${isMobileView ? 'mobile' : ''}
        ${padding ? 'with-padding' : ''}
        ${className}
      `}
    >
      {header && (
        <div className="content-header">
          {header}
        </div>
      )}
      
      <div className="content-body">
        {children}
      </div>
    </main>
  );
};

// ========== RESPONSIVE GRID ==========
export const ResponsiveGrid = ({
  children,
  className = '',
  cols = { xs: 1, sm: 2, md: 2, lg: 3, xl: 4 },
  gap = '1rem'
}) => {
  const { breakpoint } = useBreakpoint();
  
  const getColumns = () => {
    const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpoints.indexOf(breakpoint);
    
    for (let i = currentIndex; i >= 0; i--) {
      if (cols[breakpoints[i]]) {
        return cols[breakpoints[i]];
      }
    }
    
    return cols.xs || 1;
  };
  
  return (
    <div 
      className={`responsive-grid ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${getColumns()}, minmax(0, 1fr))`,
        gap
      }}
    >
      {children}
    </div>
  );
};

// ========== RESPONSIVE STACK ==========
export const ResponsiveStack = ({
  children,
  className = '',
  direction = 'column',
  gap = '1rem',
  align = 'stretch',
  justify = 'flex-start',
  reverseOnMobile = false,
  wrap = false
}) => {
  const { isMobile } = useBreakpoint();
  
  const flexDirection = isMobile 
    ? (reverseOnMobile ? 'column-reverse' : 'column')
    : direction;
  
  return (
    <div 
      className={`responsive-stack ${className}`}
      style={{
        display: 'flex',
        flexDirection,
        gap,
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? 'wrap' : 'nowrap'
      }}
    >
      {children}
    </div>
  );
};

// ========== RESPONSIVE SHOW/HIDE ==========
export const Show = ({ 
  children, 
  above, 
  below, 
  at,
  breakpoint: bpProp 
}) => {
  const { width } = useBreakpoint();
  
  if (above && width < BREAKPOINTS[above]) return null;
  if (below && width >= BREAKPOINTS[below]) return null;
  if (at) {
    const bp = Array.isArray(at) ? at : [at];
    const current = Object.keys(BREAKPOINTS).reverse().find(k => width >= BREAKPOINTS[k]);
    if (!bp.includes(current)) return null;
  }
  
  return <>{children}</>;
};

export const Hide = ({ children, ...props }) => {
  const { width } = useBreakpoint();
  
  if (props.above && width >= BREAKPOINTS[props.above]) return null;
  if (props.below && width < BREAKPOINTS[props.below]) return null;
  if (props.at) {
    const bp = Array.isArray(props.at) ? props.at : [props.at];
    const current = Object.keys(BREAKPOINTS).reverse().find(k => width >= BREAKPOINTS[k]);
    if (bp.includes(current)) return null;
  }
  
  return <>{children}</>;
};

// ========== EXPORTS ==========
export default {
  ResponsiveLayout,
  ResponsiveSidebar,
  ResponsiveContent,
  ResponsiveGrid,
  ResponsiveStack,
  Show,
  Hide,
  useResponsive,
  useBreakpoint,
  BREAKPOINTS
};
