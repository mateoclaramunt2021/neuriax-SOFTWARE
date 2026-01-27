/**
 * AnimationShowcase - Demo de todas las animaciones del sistema
 * PASO 7: Animaciones y Micro-interacciones
 */
import React, { useState } from 'react';
import {
  // Page Transitions
  ModuleTransition,
  
  // Animated Components
  AnimatedCard,
  AnimatedButton,
  HoverCard,
  MagneticButton,
  
  // Loading States
  Spinner,
  LoadingDots,
  PulseLoader,
  ProgressBar,
  SkeletonCard,
  SkeletonTable,
  ButtonLoader,
  
  // Feedback Animations
  SuccessAnimation,
  ErrorAnimation,
  WarningAnimation,
  InfoAnimation,
  FeedbackToast,
  ConfettiEffect,
  CountUpAnimation,
  TypewriterText,
  
  // Scroll Animations
  ScrollReveal,
  StaggerReveal,
  ScrollProgress,
  CountOnScroll,
  ParallaxElement
} from './index';

import './AnimationShowcase.css';

export const AnimationShowcase = () => {
  const [activeTab, setActiveTab] = useState('loading');
  const [showConfetti, setShowConfetti] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [progress, setProgress] = useState(0);

  const addToast = (type) => {
    const newToast = {
      id: Date.now(),
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      message: `Este es un mensaje de ${type} de prueba.`
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const tabs = [
    { id: 'loading', label: 'Loading States' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'cards', label: 'Cards & Buttons' },
    { id: 'scroll', label: 'Scroll Animations' }
  ];

  return (
    <div className="animation-showcase">
      <ScrollProgress position="top" color="#6c5ce7" />
      
      <header className="showcase-header">
        <h1>🎨 Sistema de Animaciones</h1>
        <p>PASO 7: Micro-interacciones Profesionales</p>
      </header>

      {/* Navigation */}
      <nav className="showcase-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="showcase-content">
        <ModuleTransition key={activeTab} animation="slide">
          {/* Loading States */}
          {activeTab === 'loading' && (
            <section className="showcase-section">
              <h2>Loading States</h2>
              
              <div className="demo-grid">
                <div className="demo-item">
                  <h3>Spinners</h3>
                  <div className="demo-row">
                    <Spinner size="small" />
                    <Spinner size="medium" />
                    <Spinner size="large" />
                  </div>
                </div>

                <div className="demo-item">
                  <h3>Loading Dots</h3>
                  <LoadingDots />
                </div>

                <div className="demo-item">
                  <h3>Pulse Loader</h3>
                  <PulseLoader />
                </div>

                <div className="demo-item">
                  <h3>Progress Bar</h3>
                  <ProgressBar progress={progress} />
                  <button 
                    className="demo-btn" 
                    onClick={simulateProgress}
                    style={{ marginTop: '1rem' }}
                  >
                    Simular Progreso
                  </button>
                </div>

                <div className="demo-item">
                  <h3>Skeleton Card</h3>
                  <SkeletonCard />
                </div>

                <div className="demo-item">
                  <h3>Skeleton Table</h3>
                  <SkeletonTable rows={3} columns={3} />
                </div>

                <div className="demo-item">
                  <h3>Button Loader</h3>
                  <ButtonLoader text="Guardando..." />
                </div>
              </div>
            </section>
          )}

          {/* Feedback Animations */}
          {activeTab === 'feedback' && (
            <section className="showcase-section">
              <h2>Feedback Animations</h2>
              
              <div className="demo-grid">
                <div className="demo-item">
                  <h3>Success</h3>
                  <SuccessAnimation size="medium" message="¡Operación exitosa!" />
                </div>

                <div className="demo-item">
                  <h3>Error</h3>
                  <ErrorAnimation size="medium" message="Algo salió mal" shake />
                </div>

                <div className="demo-item">
                  <h3>Warning</h3>
                  <WarningAnimation size="medium" message="Atención requerida" pulse />
                </div>

                <div className="demo-item">
                  <h3>Info</h3>
                  <InfoAnimation size="medium" message="Información importante" />
                </div>

                <div className="demo-item">
                  <h3>Toasts</h3>
                  <div className="demo-row">
                    <button className="demo-btn success" onClick={() => addToast('success')}>
                      Success Toast
                    </button>
                    <button className="demo-btn error" onClick={() => addToast('error')}>
                      Error Toast
                    </button>
                    <button className="demo-btn warning" onClick={() => addToast('warning')}>
                      Warning Toast
                    </button>
                    <button className="demo-btn info" onClick={() => addToast('info')}>
                      Info Toast
                    </button>
                  </div>
                </div>

                <div className="demo-item">
                  <h3>Confetti</h3>
                  <button 
                    className="demo-btn primary"
                    onClick={() => {
                      setShowConfetti(true);
                      setTimeout(() => setShowConfetti(false), 3000);
                    }}
                  >
                    🎉 Lanzar Confetti
                  </button>
                </div>

                <div className="demo-item">
                  <h3>Count Up</h3>
                  <div className="count-demo">
                    <CountUpAnimation end={12500} prefix="€" duration={2500} />
                  </div>
                </div>

                <div className="demo-item">
                  <h3>Typewriter</h3>
                  <TypewriterText 
                    text="Bienvenido al sistema NEURIAX..." 
                    speed={50}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Cards & Buttons */}
          {activeTab === 'cards' && (
            <section className="showcase-section">
              <h2>Cards & Buttons</h2>
              
              <div className="demo-grid">
                <div className="demo-item">
                  <h3>Card - Lift Effect</h3>
                  <AnimatedCard effect="lift" className="demo-card">
                    <h4>Hover me!</h4>
                    <p>Card con efecto de elevación</p>
                  </AnimatedCard>
                </div>

                <div className="demo-item">
                  <h3>Card - Glow Effect</h3>
                  <AnimatedCard effect="glow" className="demo-card">
                    <h4>Hover me!</h4>
                    <p>Card con efecto de brillo</p>
                  </AnimatedCard>
                </div>

                <div className="demo-item">
                  <h3>Card - Tilt Effect</h3>
                  <AnimatedCard effect="tilt" className="demo-card">
                    <h4>Hover me!</h4>
                    <p>Card con efecto 3D</p>
                  </AnimatedCard>
                </div>

                <div className="demo-item">
                  <h3>Card - Scale Effect</h3>
                  <AnimatedCard effect="scale" className="demo-card">
                    <h4>Hover me!</h4>
                    <p>Card con efecto de escala</p>
                  </AnimatedCard>
                </div>

                <div className="demo-item">
                  <h3>3D Hover Card</h3>
                  <HoverCard className="demo-card">
                    <h4>Interactive 3D</h4>
                    <p>Mueve el cursor sobre mí</p>
                  </HoverCard>
                </div>

                <div className="demo-item">
                  <h3>Animated Buttons</h3>
                  <div className="demo-row">
                    <AnimatedButton variant="primary">Primary</AnimatedButton>
                    <AnimatedButton variant="secondary">Secondary</AnimatedButton>
                    <AnimatedButton variant="success">Success</AnimatedButton>
                    <AnimatedButton variant="danger">Danger</AnimatedButton>
                  </div>
                </div>

                <div className="demo-item">
                  <h3>Magnetic Button</h3>
                  <MagneticButton>
                    <span style={{ padding: '1rem 2rem', background: '#6c5ce7', color: 'white', borderRadius: '8px' }}>
                      Acércate a mí
                    </span>
                  </MagneticButton>
                </div>
              </div>
            </section>
          )}

          {/* Scroll Animations */}
          {activeTab === 'scroll' && (
            <section className="showcase-section scroll-section">
              <h2>Scroll Animations</h2>
              <p>Desplázate hacia abajo para ver las animaciones</p>
              
              <div className="scroll-demos">
                <ScrollReveal animation="fadeUp" delay={0}>
                  <div className="scroll-demo-card">
                    <h3>Fade Up</h3>
                    <p>Aparece desde abajo</p>
                  </div>
                </ScrollReveal>

                <ScrollReveal animation="fadeLeft" delay={100}>
                  <div className="scroll-demo-card">
                    <h3>Fade Left</h3>
                    <p>Aparece desde la derecha</p>
                  </div>
                </ScrollReveal>

                <ScrollReveal animation="fadeRight" delay={200}>
                  <div className="scroll-demo-card">
                    <h3>Fade Right</h3>
                    <p>Aparece desde la izquierda</p>
                  </div>
                </ScrollReveal>

                <ScrollReveal animation="zoomIn" delay={300}>
                  <div className="scroll-demo-card">
                    <h3>Zoom In</h3>
                    <p>Aparece con zoom</p>
                  </div>
                </ScrollReveal>

                <StaggerReveal animation="fadeUp" staggerDelay={150}>
                  <div className="scroll-demo-card">
                    <h3>Stagger 1</h3>
                    <p>Primero</p>
                  </div>
                  <div className="scroll-demo-card">
                    <h3>Stagger 2</h3>
                    <p>Segundo</p>
                  </div>
                  <div className="scroll-demo-card">
                    <h3>Stagger 3</h3>
                    <p>Tercero</p>
                  </div>
                </StaggerReveal>

                <div className="parallax-demo">
                  <ParallaxElement speed={0.3}>
                    <div className="parallax-content">
                      <h3>🚀 Parallax Effect</h3>
                      <p>Este elemento se mueve más lento</p>
                    </div>
                  </ParallaxElement>
                </div>

                <div className="count-scroll-demo">
                  <h3>Contadores al Scroll</h3>
                  <div className="counters">
                    <div className="counter-item">
                      <CountOnScroll end={1500} suffix="+" duration={2000} />
                      <span>Clientes</span>
                    </div>
                    <div className="counter-item">
                      <CountOnScroll end={98} suffix="%" duration={2000} />
                      <span>Satisfacción</span>
                    </div>
                    <div className="counter-item">
                      <CountOnScroll end={24} suffix="/7" duration={2000} />
                      <span>Soporte</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </ModuleTransition>
      </main>

      {/* Toasts */}
      {toasts.map((toast, index) => (
        <FeedbackToast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          position="top-right"
          duration={4000}
          onClose={() => removeToast(toast.id)}
          style={{ top: `${1.5 + index * 5}rem` }}
        />
      ))}

      {/* Confetti */}
      <ConfettiEffect active={showConfetti} particleCount={100} />
    </div>
  );
};

export default AnimationShowcase;
