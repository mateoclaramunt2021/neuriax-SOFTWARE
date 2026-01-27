/**
 * ScrollAnimations - Animaciones de Scroll con IntersectionObserver
 * Reveal on scroll, parallax, sticky elements
 */
import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import './ScrollAnimations.css';

/* ===========================================
   HOOKS PARA SCROLL
   =========================================== */

/**
 * useInView - Detecta cuando un elemento está visible en el viewport
 */
export const useInView = (options = {}) => {
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = true,
    delay = 0
  } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Respeta preferencias de movimiento reducido
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsInView(true);
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => {
              setIsInView(true);
              setHasAnimated(true);
            }, delay);
          } else {
            setIsInView(true);
            setHasAnimated(true);
          }
          
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, delay]);

  return [ref, isInView, hasAnimated];
};

/**
 * useScrollProgress - Devuelve el progreso del scroll (0-1)
 */
export const useScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollProgress = scrollTop / (documentHeight - windowHeight);
      setProgress(Math.min(Math.max(scrollProgress, 0), 1));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return progress;
};

/**
 * useParallax - Efecto parallax basado en scroll
 */
export const useParallax = (speed = 0.5) => {
  const [offset, setOffset] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const windowCenter = window.innerHeight / 2;
      const distanceFromCenter = elementCenter - windowCenter;
      setOffset(distanceFromCenter * speed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return [ref, offset];
};

/**
 * useScrollDirection - Detecta la dirección del scroll
 */
export const useScrollDirection = () => {
  const [direction, setDirection] = useState('down');
  const [lastScroll, setLastScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      
      if (currentScroll > lastScroll) {
        setDirection('down');
      } else if (currentScroll < lastScroll) {
        setDirection('up');
      }
      
      setLastScroll(currentScroll);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScroll]);

  return direction;
};

/* ===========================================
   COMPONENTES
   =========================================== */

/**
 * ScrollReveal - Wrapper que anima al entrar en viewport
 */
export const ScrollReveal = ({
  children,
  animation = 'fadeUp', // fadeUp, fadeDown, fadeLeft, fadeRight, zoomIn, flip
  delay = 0,
  duration = 600,
  threshold = 0.1,
  triggerOnce = true,
  className = '',
  style = {},
  as: Component = 'div'
}) => {
  const [ref, isInView] = useInView({ threshold, triggerOnce, delay });

  return (
    <Component
      ref={ref}
      className={`
        scroll-reveal 
        scroll-reveal--${animation}
        ${isInView ? 'is-visible' : ''}
        ${className}
      `}
      style={{
        ...style,
        '--reveal-duration': `${duration}ms`,
        '--reveal-delay': `${delay}ms`
      }}
    >
      {children}
    </Component>
  );
};

/**
 * StaggerReveal - Contenedor que anima hijos con stagger
 */
export const StaggerReveal = ({
  children,
  animation = 'fadeUp',
  staggerDelay = 100,
  threshold = 0.1,
  triggerOnce = true,
  className = '',
  style = {}
}) => {
  const [ref, isInView] = useInView({ threshold, triggerOnce });

  return (
    <div
      ref={ref}
      className={`stagger-reveal ${isInView ? 'is-visible' : ''} ${className}`}
      style={style}
    >
      {React.Children.map(children, (child, index) => (
        <div
          className={`stagger-item stagger-item--${animation}`}
          style={{ '--stagger-index': index, '--stagger-delay': `${staggerDelay}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

/**
 * ParallaxElement - Elemento con efecto parallax
 */
export const ParallaxElement = ({
  children,
  speed = 0.3,
  className = '',
  style = {}
}) => {
  const [ref, offset] = useParallax(speed);

  return (
    <div
      ref={ref}
      className={`parallax-element ${className}`}
      style={{
        ...style,
        transform: `translateY(${offset}px)`
      }}
    >
      {children}
    </div>
  );
};

/**
 * ScrollProgress - Indicador de progreso de scroll
 */
export const ScrollProgress = ({
  position = 'top', // top, bottom
  height = 4,
  color = 'var(--primary-color, #6c5ce7)',
  backgroundColor = 'transparent',
  className = '',
  style = {}
}) => {
  const progress = useScrollProgress();

  return (
    <div
      className={`scroll-progress scroll-progress--${position} ${className}`}
      style={{
        ...style,
        '--progress-height': `${height}px`,
        '--progress-color': color,
        '--progress-bg': backgroundColor,
        '--progress-width': `${progress * 100}%`
      }}
    />
  );
};

/**
 * RevealOnScroll - Componente simple para revelar al scroll
 */
export const RevealOnScroll = ({
  children,
  direction = 'up', // up, down, left, right
  distance = 50,
  duration = 600,
  delay = 0,
  threshold = 0.1,
  triggerOnce = true,
  className = '',
  style = {}
}) => {
  const [ref, isInView] = useInView({ threshold, triggerOnce, delay });

  const getTransform = () => {
    if (!isInView) {
      switch (direction) {
        case 'up': return `translateY(${distance}px)`;
        case 'down': return `translateY(-${distance}px)`;
        case 'left': return `translateX(${distance}px)`;
        case 'right': return `translateX(-${distance}px)`;
        default: return 'none';
      }
    }
    return 'translate(0)';
  };

  return (
    <div
      ref={ref}
      className={`reveal-on-scroll ${className}`}
      style={{
        ...style,
        opacity: isInView ? 1 : 0,
        transform: getTransform(),
        transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

/**
 * CountOnScroll - Contador que se activa al scroll
 */
export const CountOnScroll = ({
  end,
  start = 0,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
  threshold = 0.5,
  className = '',
  style = {}
}) => {
  const [ref, isInView, hasAnimated] = useInView({ threshold, triggerOnce: true });
  const [count, setCount] = useState(start);

  useEffect(() => {
    if (!isInView || (hasAnimated && count === end)) return;

    const startTime = Date.now();
    const range = end - start;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (range * easeOut);
      
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, start, end, duration, hasAnimated, count]);

  return (
    <span ref={ref} className={`count-on-scroll ${className}`} style={style}>
      {prefix}{count.toFixed(decimals)}{suffix}
    </span>
  );
};

/**
 * ScrollFadeSection - Sección que se desvanece al scroll
 */
export const ScrollFadeSection = ({
  children,
  fadeStart = 0, // Cuando empieza a desvanecerse (0-1)
  fadeEnd = 0.5, // Cuando está completamente desvanecido (0-1)
  className = '',
  style = {}
}) => {
  const ref = useRef(null);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      if (!ref.current) return;
      
      const rect = ref.current.getBoundingClientRect();
      const sectionHeight = rect.height;
      const scrollProgress = Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + sectionHeight));
      
      if (scrollProgress >= fadeStart && scrollProgress <= fadeEnd) {
        const fadeProgress = (scrollProgress - fadeStart) / (fadeEnd - fadeStart);
        setOpacity(1 - fadeProgress);
      } else if (scrollProgress < fadeStart) {
        setOpacity(1);
      } else {
        setOpacity(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [fadeStart, fadeEnd]);

  return (
    <div
      ref={ref}
      className={`scroll-fade-section ${className}`}
      style={{ ...style, opacity }}
    >
      {children}
    </div>
  );
};

/**
 * StickyReveal - Elemento sticky que revela contenido
 */
export const StickyReveal = ({
  children,
  height = '200vh',
  stickyOffset = 0,
  className = '',
  style = {}
}) => {
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      
      if (rect.top <= stickyOffset && rect.bottom >= viewportHeight) {
        const scrolled = Math.abs(rect.top - stickyOffset);
        const maxScroll = containerHeight - viewportHeight;
        setProgress(Math.min(scrolled / maxScroll, 1));
      } else if (rect.top > stickyOffset) {
        setProgress(0);
      } else {
        setProgress(1);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [stickyOffset]);

  return (
    <div
      ref={containerRef}
      className={`sticky-reveal-container ${className}`}
      style={{ ...style, height }}
    >
      <div 
        className="sticky-reveal-content"
        style={{ top: stickyOffset }}
      >
        {typeof children === 'function' ? children(progress) : children}
      </div>
    </div>
  );
};

/**
 * ScrollTrigger - Ejecuta callback cuando el elemento entra en viewport
 */
export const ScrollTrigger = ({
  children,
  onEnter,
  onLeave,
  threshold = 0.5,
  triggerOnce = false,
  className = '',
  style = {}
}) => {
  const ref = useRef(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!hasTriggered.current || !triggerOnce) {
            onEnter?.();
            hasTriggered.current = true;
          }
        } else {
          onLeave?.();
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [onEnter, onLeave, threshold, triggerOnce]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
};

/* ===========================================
   CONTEXT PARA ANIMACIONES GLOBALES
   =========================================== */

const ScrollAnimationContext = createContext({
  scrollY: 0,
  scrollDirection: 'down',
  scrollProgress: 0
});

export const ScrollAnimationProvider = ({ children }) => {
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState('down');
  const [scrollProgress, setScrollProgress] = useState(0);
  const lastScroll = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      setScrollY(currentScroll);
      setScrollDirection(currentScroll > lastScroll.current ? 'down' : 'up');
      setScrollProgress(currentScroll / (documentHeight - windowHeight));
      
      lastScroll.current = currentScroll;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <ScrollAnimationContext.Provider value={{ scrollY, scrollDirection, scrollProgress }}>
      {children}
    </ScrollAnimationContext.Provider>
  );
};

export const useScrollAnimation = () => useContext(ScrollAnimationContext);

const ScrollAnimations = {
  // Hooks
  useInView,
  useScrollProgress,
  useParallax,
  useScrollDirection,
  useScrollAnimation,
  // Components
  ScrollReveal,
  StaggerReveal,
  ParallaxElement,
  ScrollProgress,
  RevealOnScroll,
  CountOnScroll,
  ScrollFadeSection,
  StickyReveal,
  ScrollTrigger,
  // Provider
  ScrollAnimationProvider
};

export default ScrollAnimations;
