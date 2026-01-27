/**
 * Animations Index - Sistema completo de animaciones
 * NEURIAX Salon Manager - PASO 7: Animaciones y Micro-interacciones
 * 
 * Este módulo exporta todos los componentes y hooks de animación
 * para un sistema profesional de micro-interacciones.
 */

// CSS imports - deben ir primero
import './PageTransition.css';
import './AnimatedComponents.css';
import './LoadingStates.css';
import './FeedbackAnimations.css';
import './ScrollAnimations.css';
import './PullToRefresh.css';

// Page Transitions
export {
  FadeTransition,
  SlideTransition,
  ScaleTransition,
  ModuleTransition,
  StaggeredList,
  AnimatedPresence,
  usePageTransition,
  TRANSITION_TYPES
} from './PageTransition';

// Animated Components (Hover Effects)
export {
  AnimatedCard,
  AnimatedButton,
  RippleEffect,
  HoverCard,
  MagneticButton
} from './AnimatedComponents';

// Loading States
export {
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
} from './LoadingStates';

// Feedback Animations
export {
  SuccessAnimation,
  ErrorAnimation,
  WarningAnimation,
  InfoAnimation,
  FeedbackToast,
  ConfettiEffect,
  CountUpAnimation,
  TypewriterText
} from './FeedbackAnimations';

// Scroll Animations
export {
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
} from './ScrollAnimations';

// Pull to Refresh (Mobile)
export {
  PullToRefresh,
  SwipeRefresh,
  usePullToRefresh
} from './PullToRefresh';

// Demo/Showcase Component
export { AnimationShowcase } from './AnimationShowcase';

// Re-export default desde cada módulo para facilitar importaciones
export { default as PageTransitionDefaults } from './PageTransition';
export { default as AnimatedComponentsDefaults } from './AnimatedComponents';
export { default as LoadingStatesDefaults } from './LoadingStates';
export { default as FeedbackAnimationsDefaults } from './FeedbackAnimations';
export { default as ScrollAnimationsDefaults } from './ScrollAnimations';
export { default as PullToRefreshDefault } from './PullToRefresh';
