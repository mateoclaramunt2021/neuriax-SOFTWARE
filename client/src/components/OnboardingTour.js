/**
 * ONBOARDING TOUR - Tutorial de Bienvenida
 * Guía interactiva para nuevos usuarios
 */

import React, { useState, useEffect } from 'react';
import '../styles/onboarding-tour.css';

const tourSteps = [
  {
    id: 'welcome',
    title: '¡Bienvenido a NEURIAX PRO! 🎉',
    description: 'Tu plataforma completa de gestión para salones de belleza, peluquerías y barberías. Te mostraremos cómo funciona en 3 minutos.',
    icon: '💈',
    position: 'center'
  },
  {
    id: 'dashboard',
    title: 'Tu Panel de Control',
    description: 'Aquí verás todo: clientes activos, ventas del día, citas programadas, ingresos, y estadísticas en tiempo real. Todo actualizado cada segundo.',
    icon: '📊',
    highlight: 'overview',
    position: 'center'
  },
  {
    id: 'marketplace',
    title: '🏪 Nuevo: Marketplace de Salones',
    description: 'Aparece automáticamente en Google y en nuestra plataforma. Los clientes pueden verte, ver tus servicios, precios y horarios. ¡Consigue más reservas online!',
    icon: '🌐',
    highlight: 'marketplace',
    position: 'right'
  },
  {
    id: 'reservas',
    title: 'Reservas Online - 24/7',
    description: 'Tus clientes pueden reservar en línea sin tu intervención. El sistema bloquea horarios automáticamente. Confirmaciones y recordatorios se envían solos.',
    icon: '📅',
    highlight: 'reservas',
    position: 'right'
  },
  {
    id: 'recordatorios',
    title: '🔔 Recordatorios Automáticos',
    description: 'Los clientes reciben recordatorios por SMS/Email 24h, 5h y 1h ANTES de su cita. Reduce tus no-shows hasta un 90%. ¡Muy efectivo!',
    icon: '⏰',
    highlight: 'citas',
    position: 'right'
  },
  {
    id: 'ventas',
    title: 'Punto de Venta (POS)',
    description: 'Cobra rápido: selecciona servicios, agrega productos, aplica descuentos. Genera tickets automáticos. Compatible con efectivo, tarjeta y transferencias.',
    icon: '💳',
    highlight: 'ventas',
    position: 'right'
  },
  {
    id: 'caja',
    title: 'Control de Caja Inteligente',
    description: 'Abre caja cada mañana, registra entradas/salidas, y cierra con arqueo automático. El sistema te dice exactamente cuánto debe haber. ¡Auditoría integrada!',
    icon: '💰',
    highlight: 'caja',
    position: 'right'
  },
  {
    id: 'clientes',
    title: 'Base de Datos de Clientes',
    description: 'Historial completo de cada cliente: visitas, servicios realizados, preferencias, notas, cumpleaños. Todo organizado y buscar en segundos.',
    icon: '👥',
    highlight: 'clientes',
    position: 'right'
  },
  {
    id: 'servicios',
    title: 'Catálogo de Servicios',
    description: 'Define tus servicios con precios, duración, empleados asignados. Categorízalos fácilmente. Se sincroniza automáticamente con el Marketplace.',
    icon: '✂️',
    highlight: 'servicios',
    position: 'right'
  },
  {
    id: 'empleados',
    title: 'Gestión de Tu Equipo',
    description: 'Crea perfiles, asigna permisos (Admin, Recepción, Empleado). Controla horarios, ve quién está disponible. Estadísticas de rendimiento incluidas.',
    icon: '👤',
    highlight: 'empleados',
    position: 'right'
  },
  {
    id: 'inventario',
    title: 'Control de Inventario + POS',
    description: 'Stock de productos integrado con el POS. Alertas automáticas cuando algo se agota. Sincronización en tiempo real con tu tienda.',
    icon: '📦',
    highlight: 'inventario',
    position: 'right'
  },
  {
    id: 'reportes',
    title: 'Reportes Profesionales',
    description: 'Estadísticas detalladas: ingresos por período, servicios top, clientes frecuentes, análisis por empleado, gráficos comparativos. Exporta todo a PDF/Excel.',
    icon: '📈',
    highlight: 'reportes',
    position: 'right'
  },
  {
    id: 'planes',
    title: '💎 Planes Flexible',
    description: 'Elige el que se adapte a ti: Basic (39€), Pro (79€) o Enterprise personalizado. Sin contrato, cancela cuando quieras. Todos incluyen Marketplace.',
    icon: '⭐',
    highlight: 'planes',
    position: 'right'
  },
  {
    id: 'finish',
    title: '¡Listo para facturar! 🚀',
    description: 'Empieza agregando tus servicios, luego tus empleados, y activa el Marketplace. ¡Los clientes te encontrarán online y te harán reservas 24/7!',
    icon: '✅',
    position: 'center'
  }
];

export default function OnboardingTour({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setIsVisible(false);
    if (onSkip) onSkip();
  };

  // Efecto para resaltar elementos del menú
  useEffect(() => {
    if (step.highlight) {
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => {
        item.classList.remove('tour-highlight');
      });
      
      // Encontrar el item correspondiente
      const targetItem = Array.from(navItems).find(item => 
        item.textContent.toLowerCase().includes(step.highlight.toLowerCase()) ||
        item.getAttribute('title')?.toLowerCase().includes(step.highlight.toLowerCase())
      );
      
      if (targetItem) {
        targetItem.classList.add('tour-highlight');
      }
    }

    return () => {
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('tour-highlight');
      });
    };
  }, [step]);

  if (!isVisible) return null;

  return (
    <div className="onboarding-overlay">
      <div className={`onboarding-modal ${step.position}`}>
        {/* Progress bar */}
        <div className="tour-progress">
          <div className="tour-progress-bar" style={{ width: `${progress}%` }}></div>
        </div>

        {/* Skip button */}
        <button className="tour-skip" onClick={handleSkip}>
          Saltar tour ✕
        </button>

        {/* Content */}
        <div className="tour-content">
          <div className="tour-icon">{step.icon}</div>
          <h2 className="tour-title">{step.title}</h2>
          <p className="tour-description">{step.description}</p>
        </div>

        {/* Step indicator */}
        <div className="tour-steps-indicator">
          {tourSteps.map((_, idx) => (
            <span 
              key={idx} 
              className={`step-dot ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
              onClick={() => setCurrentStep(idx)}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="tour-navigation">
          <button 
            className="tour-btn secondary" 
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            ← Anterior
          </button>
          
          <span className="tour-counter">
            {currentStep + 1} / {tourSteps.length}
          </span>

          <button 
            className="tour-btn primary" 
            onClick={handleNext}
          >
            {currentStep === tourSteps.length - 1 ? '¡Empezar!' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook para controlar si mostrar el onboarding
 */
export function useOnboarding() {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('onboardingCompleted');
    if (!completed) {
      // Esperar un poco para que cargue el dashboard primero
      setTimeout(() => setShowTour(true), 500);
    }
  }, []);

  const resetTour = () => {
    localStorage.removeItem('onboardingCompleted');
    setShowTour(true);
  };

  const completeTour = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setShowTour(false);
  };

  return { showTour, setShowTour, resetTour, completeTour };
}
