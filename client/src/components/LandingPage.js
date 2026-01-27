/**
 * NEURIAX - Landing Page BEAUTYSTYLE PREMIUM
 * Plataforma SaaS para Gestión de Salones de Belleza
 * Sistema Completo: Agenda, POS, CRM, Inventario, Reportes
 * Versión: Cliente + Profesional + Marketplace
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/landing-beautystyle.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function LandingPage() {
  const navigate = useNavigate();
  const [planes, setPlanes] = useState([]);
  const [faqOpen, setFaqOpen] = useState(null);

  const cargarPlanes = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/plans`);
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const planesActivos = data.data.filter(p => p.id !== 'trial');
        setPlanes(planesActivos);
      } else {
        setDefaultPlans();
      }
    } catch (error) {
      setDefaultPlans();
    }
  }, []);

  useEffect(() => {
    cargarPlanes();
  }, [cargarPlanes]);

  const setDefaultPlans = () => {
    setPlanes([
      {
        id: 'basic',
        name: 'Plan Básico',
        price: 39,
        description: 'Ideal para emprendedores y freelancers',
        popular: false,
        benefits: [
          '✓ Hasta 50 clientes activos',
          '✓ 1 usuario/empleado',
          '✓ Agenda visual completa',
          '✓ Punto de venta integrado',
          '✓ 200 citas/mes',
          '✓ Reportes básicos',
          '✓ Recordatorios por email',
          '✓ Soporte por email',
          '✓ 2 GB almacenamiento'
        ]
      },
      {
        id: 'pro',
        name: 'Plan Profesional',
        price: 79,
        description: 'Para salones en crecimiento',
        popular: true,
        benefits: [
          '✓ Hasta 500 clientes activos',
          '✓ Hasta 5 empleados',
          '✓ 5000 citas/mes',
          '✓ Agenda con multiempleado',
          '✓ POS con métodos de pago',
          '✓ SMS + Email automáticos',
          '✓ Gestión de inventario',
          '✓ Reportes avanzados',
          '✓ Exportación PDF/Excel',
          '✓ Soporte prioritario',
          '✓ 15 GB almacenamiento'
        ]
      },
      {
        id: 'enterprise',
        name: 'Plan Enterprise',
        price: null,
        description: 'Para cadenas y franquicias',
        popular: false,
        benefits: [
          '✓ Clientes ilimitados',
          '✓ Empleados ilimitados',
          '✓ Citas ilimitadas',
          '✓ Multi-sucursal',
          '✓ API para integraciones',
          '✓ Reportes personalizados',
          '✓ Soporte 24/7 dedicado',
          '✓ Gerente de cuenta',
          '✓ Branding personalizado',
          '✓ Single Sign-On (SSO)',
          '✓ Almacenamiento ilimitado',
          '✓ Capacitación incluida'
        ]
      }
    ]);
  };

  const scrollToSection = (sectionId) => {
    const cleanId = sectionId.replace('#', '');
    const element = document.getElementById(cleanId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: '¿Cuánto dura el periodo de prueba gratuito?',
      a: 'Ofrecemos 7 días de prueba gratuita con acceso completo a todas las funcionalidades del plan Profesional. No se requiere tarjeta de crédito para comenzar.'
    },
    {
      q: '¿Puedo cambiar de plan en cualquier momento?',
      a: 'Sí, puedes actualizar o degradar tu plan cuando lo necesites. Los cambios se aplican de inmediato y el cobro se prorratea según el tiempo restante.'
    },
    {
      q: '¿Mis datos están seguros?',
      a: 'Absolutamente. Utilizamos encriptación SSL de 256 bits, copias de seguridad automáticas diarias y cumplimos con GDPR. Tus datos nunca se comparten con terceros.'
    },
    {
      q: '¿Funciona en móviles y tablets?',
      a: 'Sí, NEURIAX es 100% responsive. Funciona perfectamente en cualquier dispositivo: ordenadores, tablets y smartphones iOS/Android.'
    },
    {
      q: '¿Cómo funciona el Marketplace para clientes?',
      a: 'Los clientes pueden buscar salones cerca de su ubicación, ver servicios, precios, reseñas y reservar citas directamente. Tú apareces automáticamente al registrarte.'
    },
    {
      q: '¿Puedo importar mis clientes actuales?',
      a: 'Sí, ofrecemos importación masiva desde Excel/CSV. También puedes añadir clientes manualmente o dejar que se registren ellos mismos.'
    }
  ];

  return (
    <div className="landing-beautystyle">
      {/* NAVBAR PREMIUM */}
      <nav className="navbar-beautystyle">
        <div className="navbar-container">
          <div className="navbar-brand">
            <span className="brand-icon">✨</span>
            NEURIAX
          </div>
          <ul className="navbar-links">
            <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>Cómo Funciona</a></li>
            <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Funciones</a></li>
            <li><a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}>Precios</a></li>
            <li><a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}>FAQ</a></li>
            <li><a href="#marketplace" onClick={(e) => { e.preventDefault(); navigate('/marketplace'); }}>🏪 Marketplace</a></li>
          </ul>
          <div className="navbar-buttons">
            <button className="btn-navbar btn-login" onClick={() => navigate('/login-cliente')}>Soy Cliente</button>
            <button className="btn-navbar btn-login-pro" onClick={() => navigate('/login-profesional')}>Soy Profesional</button>
            <button className="btn-navbar btn-profesional" onClick={() => navigate('/register-business')}>Prueba Gratis</button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION - ULTRA PREMIUM */}
      <section className="hero-beautystyle">
        <div className="hero-floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <span className="badge-icon">🚀</span>
              <span>Software #1 para Salones de Belleza</span>
            </div>
            <h1>
              La Plataforma Todo-en-Uno para 
              <span className="gradient-word"> Gestionar Tu Salón</span>
            </h1>
            <p className="hero-description">
              Agenda inteligente, punto de venta, gestión de clientes, inventario, 
              recordatorios automáticos y reportes en tiempo real. 
              Todo lo que necesitas para hacer crecer tu negocio.
            </p>
            <div className="hero-features-list">
              <div className="hero-feature-item">
                <span className="check-icon">✓</span>
                <span>Agenda visual drag & drop</span>
              </div>
              <div className="hero-feature-item">
                <span className="check-icon">✓</span>
                <span>Reservas online 24/7</span>
              </div>
              <div className="hero-feature-item">
                <span className="check-icon">✓</span>
                <span>Pagos integrados</span>
              </div>
              <div className="hero-feature-item">
                <span className="check-icon">✓</span>
                <span>SMS y Email automáticos</span>
              </div>
            </div>
            <div className="hero-buttons-container">
              <button className="btn-hero btn-hero-primary" onClick={() => navigate('/register-business')}>
                <span>Empezar 7 Días Gratis</span>
                <span className="btn-arrow">→</span>
              </button>
              <button className="btn-hero btn-hero-secondary" onClick={() => scrollToSection('how-it-works')}>
                <span className="play-icon">▶</span>
                Ver Cómo Funciona
              </button>
            </div>
            <div className="hero-trust">
              <span className="trust-text">🔒 Sin tarjeta de crédito</span>
              <span className="trust-divider">•</span>
              <span className="trust-text">⚡ Configuración en 5 min</span>
              <span className="trust-divider">•</span>
              <span className="trust-text">❌ Cancela cuando quieras</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-dashboard-preview">
              <div className="dashboard-header">
                <div className="dashboard-dots">
                  <span></span><span></span><span></span>
                </div>
                <span className="dashboard-title">Dashboard NEURIAX</span>
              </div>
              <div className="dashboard-content">
                <div className="dashboard-stat">
                  <span className="stat-icon">📅</span>
                  <div className="stat-info">
                    <span className="stat-value">24</span>
                    <span className="stat-label">Citas Hoy</span>
                  </div>
                </div>
                <div className="dashboard-stat">
                  <span className="stat-icon">👥</span>
                  <div className="stat-info">
                    <span className="stat-value">1,247</span>
                    <span className="stat-label">Clientes</span>
                  </div>
                </div>
                <div className="dashboard-stat">
                  <span className="stat-icon">💰</span>
                  <div className="stat-info">
                    <span className="stat-value">€4,820</span>
                    <span className="stat-label">Este Mes</span>
                  </div>
                </div>
                <div className="dashboard-calendar">
                  <div className="calendar-row">
                    <div className="calendar-slot occupied">9:00 - Corte</div>
                    <div className="calendar-slot occupied">10:00 - Color</div>
                  </div>
                  <div className="calendar-row">
                    <div className="calendar-slot free">11:30 - Libre</div>
                    <div className="calendar-slot occupied">12:00 - Manicura</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="hero-floating-card card-1">
              <span className="card-icon">📱</span>
              <span>Reserva confirmada</span>
            </div>
            <div className="hero-floating-card card-2">
              <span className="card-icon">💳</span>
              <span>+€85 recibido</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-number">10K+</span>
            <span className="stat-desc">Profesionales Confían en Nosotros</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">2M+</span>
            <span className="stat-desc">Citas Gestionadas</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">98%</span>
            <span className="stat-desc">Satisfacción del Cliente</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">35%</span>
            <span className="stat-desc">Menos Cancelaciones</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-header">
          <span className="section-tag">SIMPLE Y RÁPIDO</span>
          <h2>¿Cómo Funciona NEURIAX?</h2>
          <p>Empieza a gestionar tu salón profesionalmente en minutos</p>
        </div>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon">📝</div>
            <h3>Regístrate Gratis</h3>
            <p>Crea tu cuenta en menos de 2 minutos. Configura tu salón, servicios, precios y horarios.</p>
          </div>
          <div className="step-connector">
            <div className="connector-line"></div>
            <div className="connector-arrow">→</div>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon">⚙️</div>
            <h3>Personaliza Todo</h3>
            <p>Añade tu equipo, configura recordatorios automáticos y personaliza tu perfil en el Marketplace.</p>
          </div>
          <div className="step-connector">
            <div className="connector-line"></div>
            <div className="connector-arrow">→</div>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon">🚀</div>
            <h3>¡Listo para Crecer!</h3>
            <p>Recibe reservas online, gestiona citas, cobra fácilmente y mira tu negocio crecer.</p>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="features-beautystyle">
        <div className="section-header">
          <span className="section-tag">FUNCIONALIDADES</span>
          <h2>Todo lo que Necesitas en Un Solo Lugar</h2>
          <p>Herramientas profesionales diseñadas específicamente para salones de belleza</p>
        </div>
        <div className="features-grid">
          <div className="feature-card-beauty">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">📅</div>
            </div>
            <h3>Agenda Inteligente</h3>
            <p>Visualiza y gestiona citas con drag & drop. Evita solapamientos, configura horarios por empleado y sincroniza automáticamente.</p>
            <ul className="feature-list">
              <li>Vista diaria, semanal y mensual</li>
              <li>Bloqueo de horas y descansos</li>
              <li>Colores por servicio o empleado</li>
            </ul>
          </div>
          <div className="feature-card-beauty">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">👥</div>
            </div>
            <h3>Gestión de Clientes (CRM)</h3>
            <p>Conoce a cada cliente: historial completo, preferencias, productos usados, notas y fechas importantes.</p>
            <ul className="feature-list">
              <li>Fichas de cliente detalladas</li>
              <li>Historial de servicios y pagos</li>
              <li>Segmentación y etiquetas</li>
            </ul>
          </div>
          <div className="feature-card-beauty">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">💳</div>
            </div>
            <h3>Punto de Venta (POS)</h3>
            <p>Cobra fácilmente con múltiples métodos de pago. Control de caja, tickets digitales y facturación.</p>
            <ul className="feature-list">
              <li>Efectivo, tarjeta, transferencia</li>
              <li>Tickets y facturas automáticas</li>
              <li>Cierre de caja diario</li>
            </ul>
          </div>
          <div className="feature-card-beauty">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">🔔</div>
            </div>
            <h3>Recordatorios Automáticos</h3>
            <p>Reduce ausencias hasta un 35% con SMS y emails automáticos antes de cada cita.</p>
            <ul className="feature-list">
              <li>SMS y Email personalizables</li>
              <li>Recordatorio 24h y 1h antes</li>
              <li>Confirmación automática</li>
            </ul>
          </div>
          <div className="feature-card-beauty">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">📦</div>
            </div>
            <h3>Control de Inventario</h3>
            <p>Gestiona productos, stock mínimo, proveedores y alertas de reposición automáticas.</p>
            <ul className="feature-list">
              <li>Stock en tiempo real</li>
              <li>Alertas de inventario bajo</li>
              <li>Historial de movimientos</li>
            </ul>
          </div>
          <div className="feature-card-beauty">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">📊</div>
            </div>
            <h3>Reportes y Analytics</h3>
            <p>Visualiza el rendimiento de tu negocio con dashboards en tiempo real y reportes exportables.</p>
            <ul className="feature-list">
              <li>Ingresos por día/mes/año</li>
              <li>Servicios más vendidos</li>
              <li>Rendimiento por empleado</li>
            </ul>
          </div>
        </div>
      </section>

      {/* MARKETPLACE FOR CLIENTS */}
      <section className="marketplace-section">
        <div className="marketplace-content">
          <div className="marketplace-text">
            <span className="section-tag">PARA TUS CLIENTES</span>
            <h2>Marketplace: Donde Tus Clientes Te Encuentran</h2>
            <p>Cuando te registras, tu salón aparece automáticamente en nuestro Marketplace. Tus clientes pueden:</p>
            <ul className="marketplace-benefits">
              <li>
                <span className="benefit-icon">🔍</span>
                <span>Buscarte por ubicación, servicios o nombre</span>
              </li>
              <li>
                <span className="benefit-icon">📅</span>
                <span>Reservar citas online las 24 horas del día</span>
              </li>
              <li>
                <span className="benefit-icon">⭐</span>
                <span>Ver fotos de tu trabajo y reseñas reales</span>
              </li>
              <li>
                <span className="benefit-icon">📱</span>
                <span>Gestionar sus citas desde el móvil</span>
              </li>
              <li>
                <span className="benefit-icon">🔔</span>
                <span>Recibir recordatorios automáticos</span>
              </li>
            </ul>
            <button className="btn-marketplace" onClick={() => navigate('/marketplace')}>
              Explorar Marketplace →
            </button>
          </div>
          <div className="marketplace-visual">
            <div className="phone-mockup">
              <div className="phone-screen">
                <div className="app-header">
                  <span>🔍 Buscar salones cerca de ti</span>
                </div>
                <div className="salon-card-preview">
                  <div className="salon-img">💇</div>
                  <div className="salon-info">
                    <span className="salon-name">Salon Premium</span>
                    <span className="salon-rating">⭐ 4.9 (127 reseñas)</span>
                    <span className="salon-location">📍 A 0.5 km</span>
                  </div>
                </div>
                <div className="salon-card-preview">
                  <div className="salon-img">💅</div>
                  <div className="salon-info">
                    <span className="salon-name">Beauty Center</span>
                    <span className="salon-rating">⭐ 4.8 (89 reseñas)</span>
                    <span className="salon-location">📍 A 1.2 km</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="pricing-beautystyle">
        <div className="section-header">
          <span className="section-tag">PRECIOS TRANSPARENTES</span>
          <h2>Planes que Crecen Contigo</h2>
          <p>Sin sorpresas ni costos ocultos. Elige el plan que mejor se adapte a tu negocio.</p>
        </div>
        <div className="pricing-trial-banner">
          <span className="trial-icon">🎁</span>
          <span>Todos los planes incluyen <strong>7 días de prueba gratis</strong> con acceso completo</span>
        </div>
        <div className="pricing-grid">
          {planes.map((plan) => (
            <div 
              key={plan.id} 
              className={`pricing-card ${plan.popular ? 'popular' : ''}`}
            >
              {plan.popular && <div className="popular-badge">⭐ Más Popular</div>}
              <h3>{plan.name}</h3>
              <div className="pricing-description">{plan.description}</div>
              <div className="price">
                {plan.price && plan.price > 0 ? (
                  <>€{plan.price}<span className="price-period">/mes</span></>
                ) : (
                  'Contactar'
                )}
              </div>
              {plan.price && plan.price > 0 && (
                <div className="price-yearly">
                  Ahorra 20% pagando anual: €{Math.round(plan.price * 12 * 0.8)}/año
                </div>
              )}
              <button 
                className={`btn-pricing ${plan.popular ? 'btn-pricing-primary' : 'btn-pricing-secondary'}`}
                onClick={() => navigate('/register-business')}
              >
                {plan.price && plan.price > 0 ? 'Empezar Gratis' : 'Solicitar Demo'}
              </button>
              <ul className="pricing-features">
                {plan.benefits.map((benefit, i) => (
                  <li key={i}>{benefit.replace('✓ ', '')}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pricing-guarantee">
          <span className="guarantee-icon">🛡️</span>
          <span>Garantía de satisfacción de 30 días. Si no estás contento, te devolvemos el dinero.</span>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="testimonials-section">
        <div className="section-header">
          <span className="section-tag">TESTIMONIOS</span>
          <h2>Lo Que Dicen Nuestros Clientes</h2>
          <p>Miles de profesionales ya confían en NEURIAX para gestionar su negocio</p>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
            <p className="testimonial-text">"Antes perdía muchas citas por olvidos. Con los recordatorios automáticos de NEURIAX, las cancelaciones bajaron un 40%. Increíble."</p>
            <div className="testimonial-author">
              <div className="author-avatar">👩</div>
              <div className="author-info">
                <span className="author-name">María García</span>
                <span className="author-role">Peluquería Style, Madrid</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
            <p className="testimonial-text">"El punto de venta es súper fácil. Cobrar con tarjeta, llevar la caja, todo integrado. Me ahorra al menos 2 horas de trabajo al día."</p>
            <div className="testimonial-author">
              <div className="author-avatar">👨</div>
              <div className="author-info">
                <span className="author-name">Carlos Rodríguez</span>
                <span className="author-role">Barbería Premium, Barcelona</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
            <p className="testimonial-text">"Mis clientes reservan directamente desde el móvil. Ya no tengo que atender llamadas mientras trabajo. Es un cambio total."</p>
            <div className="testimonial-author">
              <div className="author-avatar">👩</div>
              <div className="author-info">
                <span className="author-name">Ana Martínez</span>
                <span className="author-role">Beauty Center, Valencia</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="faq-section">
        <div className="section-header">
          <span className="section-tag">PREGUNTAS FRECUENTES</span>
          <h2>¿Tienes Dudas?</h2>
          <p>Aquí respondemos las preguntas más comunes</p>
        </div>
        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item ${faqOpen === index ? 'open' : ''}`}
              onClick={() => setFaqOpen(faqOpen === index ? null : index)}
            >
              <div className="faq-question">
                <span>{faq.q}</span>
                <span className="faq-toggle">{faqOpen === index ? '−' : '+'}</span>
              </div>
              <div className="faq-answer">
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-beautystyle">
        <div className="cta-content">
          <h2>¿Listo para Transformar Tu Salón?</h2>
          <p>Únete a más de 10,000 profesionales que ya gestionan su negocio con NEURIAX</p>
          <div className="cta-features">
            <span>✓ 7 días gratis</span>
            <span>✓ Sin tarjeta de crédito</span>
            <span>✓ Configuración en minutos</span>
            <span>✓ Soporte incluido</span>
          </div>
          <div className="cta-buttons">
            <button className="cta-button-primary" onClick={() => navigate('/register-business')}>
              Empezar Ahora Gratis
            </button>
            <button className="cta-button-secondary" onClick={() => navigate('/marketplace')}>
              Explorar Marketplace
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer-beautystyle">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">✨ NEURIAX</div>
            <p className="footer-tagline">La plataforma todo-en-uno para salones de belleza profesionales.</p>
            <div className="footer-social">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">𝕏</a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">📷</a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">in</a>
            </div>
          </div>
          <div className="footer-section">
            <h3>Producto</h3>
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Funciones</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}>Precios</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/marketplace'); }}>Marketplace</a>
            <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}>FAQ</a>
          </div>
          <div className="footer-section">
            <h3>Empresa</h3>
            <a href="mailto:hola@neuriax.com">Contacto</a>
            <a href="/">Blog</a>
            <a href="/">Sobre Nosotros</a>
            <a href="/">Trabaja con Nosotros</a>
          </div>
          <div className="footer-section">
            <h3>Legal</h3>
            <Link to="/terms">Términos de Servicio</Link>
            <Link to="/privacy">Política de Privacidad</Link>
            <Link to="/cookies">Política de Cookies</Link>
            <a href="/">GDPR</a>
          </div>
          <div className="footer-section">
            <h3>Soporte</h3>
            <a href="mailto:soporte@neuriax.com">Centro de Ayuda</a>
            <a href="/">Documentación</a>
            <a href="/">Estado del Sistema</a>
            <a href="/">API Developers</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 NEURIAX. Todos los derechos reservados.</p>
          <p>Hecho con 💜 en España</p>
        </div>
      </footer>
    </div>
  );
}
