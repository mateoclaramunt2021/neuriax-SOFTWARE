import { useEffect, useState } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

/**
 * DashboardTour - Tour guiado para nuevos usuarios
 * Muestra un tutorial interactivo del dashboard
 */
export const useDashboardTour = (shouldStartTour) => {
  const [tour, setTour] = useState(null);

  useEffect(() => {
    if (!shouldStartTour) return;

    // Esperar a que los elementos estén en el DOM
    const timer = setTimeout(() => {
      const newTour = new Shepherd.Tour({
        useModalOverlay: true,
        keyboardNavigation: true,
        defaultStepOptions: {
          classes: 'custom-shepherd-step',
          scrollTo: { behavior: 'smooth', block: 'center' }
        }
      });

      // Paso 1: Bienvenida
      newTour.addStep({
        id: 'welcome',
        title: '👋 ¡Bienvenido a NEURIAX PRO!',
        text: 'Tu plataforma completa para gestionar tu salón. Te mostraremos lo más importante en 3 minutos.',
        buttons: [
          {
            text: '⏭️ Siguiente',
            action: () => newTour.next(),
            secondary: false
          },
          {
            text: '❌ Saltar tour',
            action: () => {
              newTour.complete();
              localStorage.setItem('dashboard_tour_shown', 'true');
            },
            secondary: true
          }
        ]
      });

      // Paso 2: Plan Limits
      newTour.addStep({
        id: 'plan-limits',
        title: '💎 Tu Plan Actual',
        text: 'Aquí ves tu plan (Basic, Pro o Enterprise), límites de clientes, servicios y empleados. Puedes upgradear en cualquier momento.',
        attachTo: {
          element: '.plan-limits-display',
          on: 'bottom'
        },
        buttons: [
          { text: '⬅️ Anterior', action: () => newTour.back() },
          { text: '⏭️ Siguiente', action: () => newTour.next() }
        ]
      });

      // Paso 3: Sidebar Menu
      newTour.addStep({
        id: 'sidebar',
        title: '📋 Menú Lateral - Tu Centro de Control',
        text: 'De aquí accedes a todo: POS (ventas), Reservas, Marketplace, Clientes, Servicios, Empleados, Inventario, Reportes y más.',
        attachTo: {
          element: '.sidebar-nav',
          on: 'right'
        },
        buttons: [
          { text: '⬅️ Anterior', action: () => newTour.back() },
          { text: '⏭️ Siguiente', action: () => newTour.next() }
        ]
      });

      // Paso 4: Header Stats
      newTour.addStep({
        id: 'header-stats',
        title: '📈 Tus Números Principales',
        text: 'Ves en tiempo real: clientes activos, citas de hoy, ventas del día e ingresos. Todo actualizado cada segundo.',
        attachTo: {
          element: '.header-left',
          on: 'bottom'
        },
        buttons: [
          { text: '⬅️ Anterior', action: () => newTour.back() },
          { text: '⏭️ Siguiente', action: () => newTour.next() }
        ]
      });

      // Paso 5: POS Module
      newTour.addStep({
        id: 'pos-module',
        title: '💳 Punto de Venta - Tu Caja',
        text: 'El módulo principal para cobrar. Selecciona servicios, agrega productos, aplica descuentos, y genera tickets. ¡Súper rápido!',
        buttons: [
          { text: '⬅️ Anterior', action: () => newTour.back() },
          { text: '⏭️ Siguiente', action: () => newTour.next() }
        ]
      });

      // Paso 6: Reservas Online
      newTour.addStep({
        id: 'reservas',
        title: '🏪 Marketplace + Reservas Online',
        text: 'Tu salón aparece automáticamente en internet. Clientes ven tus servicios, horarios y pueden reservar 24/7. Recordatorios se envían solos.',
        buttons: [
          { text: '⬅️ Anterior', action: () => newTour.back() },
          { text: '⏭️ Siguiente', action: () => newTour.next() }
        ]
      });

      // Paso 7: Reminders
      newTour.addStep({
        id: 'reminders',
        title: '🔔 Recordatorios Automáticos 5h ANTES',
        text: 'Clientes reciben SMS/Email 24h, 5h y 1h antes de su cita. Reduce no-shows hasta 90%. ¡Sistema probado!',
        buttons: [
          { text: '⬅️ Anterior', action: () => newTour.back() },
          { text: '⏭️ Siguiente', action: () => newTour.next() }
        ]
      });

      // Paso 8: Completado
      newTour.addStep({
        id: 'complete',
        title: '🚀 ¡Comenzamos!',
        text: 'Ahora: 1) Agrega tus servicios, 2) Crea empleados, 3) Activa Marketplace. ¡Los clientes te encontrarán online!',
        buttons: [
          { text: '⬅️ Anterior', action: () => newTour.back() },
          {
            text: '✅ Entendido',
            action: () => {
              newTour.complete();
              localStorage.setItem('dashboard_tour_shown', 'true');
            }
          }
        ]
      });

      // Eventos
      newTour.on('complete', () => {
        localStorage.setItem('dashboard_tour_shown', 'true');
      });

      newTour.on('cancel', () => {
        localStorage.setItem('dashboard_tour_shown', 'true');
      });

      setTour(newTour);
      newTour.start();
    }, 500);

    return () => clearTimeout(timer);
  }, [shouldStartTour]);

  return tour;
};

export default useDashboardTour;
