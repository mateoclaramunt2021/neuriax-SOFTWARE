/**
 * CHECKOUT PAGE - Sistema de Pagos Profesional con Stripe
 * Página de contratación de planes NEURIAX
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/checkout.css';

export default function CheckoutPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Datos del formulario de registro
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    telefono: '',
    nombre_negocio: '',
    password: '',
    passwordConfirm: '',
    // Datos de facturación
    direccion: '',
    ciudad: '',
    codigo_postal: '',
    pais: 'ES',
    nif_cif: '',
    // Aceptar términos
    aceptaTerminos: false,
    aceptaPrivacidad: false
  });

  // Datos de tarjeta (simulado - Stripe Elements los maneja)
  const [cardData, setCardData] = useState({
    numero: '',
    expiry: '',
    cvc: '',
    nombre: ''
  });

  const [step, setStep] = useState(1); // 1: Datos, 2: Pago, 3: Confirmación
  const [billingCycle, setBillingCycle] = useState('monthly'); // monthly / yearly
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  const cargarPlan = async () => {
    try {
      const response = await fetch(`${API_URL}/plans/${planId}`);
      const data = await response.json();
      if (data.success) {
        setPlan(data.data);
      } else {
        setError('Plan no encontrado');
      }
    } catch (err) {
      console.error('Error cargando plan:', err);
      // Planes por defecto si no hay conexión
      const planesDefault = {
        basic: { id: 'basic', name: 'Plan Básico', price: 39, description: 'Para emprendedores', benefits: ['Hasta 100 clientes', 'Hasta 2 empleados', 'Reportes básicos', 'Punto de venta', 'Soporte email'] },
        pro: { id: 'pro', name: 'Plan Profesional', price: 79, description: 'Para negocios en crecimiento', benefits: ['Clientes ilimitados', 'Hasta 10 empleados', 'Reportes avanzados', 'Inventario completo', 'Notificaciones SMS', 'Soporte prioritario'] },
        enterprise: { id: 'enterprise', name: 'Enterprise', price: -1, description: 'Para grandes empresas', benefits: ['Todo ilimitado', 'Multi-sucursal', 'API personalizada', 'Soporte dedicado 24/7'] }
      };
      setPlan(planesDefault[planId] || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Formatear número de tarjeta
    if (name === 'numero') {
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
    }
    // Formatear fecha de expiración
    if (name === 'expiry') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2);
      }
    }
    // Formatear CVC
    if (name === 'cvc') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setCardData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const validateStep1 = () => {
    if (!formData.nombre_completo || !formData.email || !formData.telefono) {
      setError('Por favor completa todos los campos obligatorios');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.passwordConfirm) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    if (!formData.nombre_negocio) {
      setError('Por favor ingresa el nombre de tu negocio');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!cardData.numero || cardData.numero.replace(/\s/g, '').length < 16) {
      setError('Número de tarjeta inválido');
      return false;
    }
    if (!cardData.expiry || cardData.expiry.length < 5) {
      setError('Fecha de expiración inválida');
      return false;
    }
    if (!cardData.cvc || cardData.cvc.length < 3) {
      setError('CVC inválido');
      return false;
    }
    if (!cardData.nombre) {
      setError('Ingresa el nombre del titular');
      return false;
    }
    if (!formData.aceptaTerminos || !formData.aceptaPrivacidad) {
      setError('Debes aceptar los términos y la política de privacidad');
      return false;
    }
    setError('');
    return true;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      procesarPago();
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
    setError('');
  };

  const procesarPago = async () => {
    setProcessing(true);
    setError('');

    try {
      // 1. Crear checkout session en el backend
      const response = await fetch(`${API_URL}/subscriptions/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          billingCycle,
          userData: {
            nombre_completo: formData.nombre_completo,
            email: formData.email,
            telefono: formData.telefono,
            nombre_negocio: formData.nombre_negocio,
            password: formData.password,
            direccion: formData.direccion,
            ciudad: formData.ciudad,
            codigo_postal: formData.codigo_postal,
            pais: formData.pais,
            nif_cif: formData.nif_cif
          },
          // En producción, esto se reemplaza por Stripe Elements
          paymentMethod: {
            last4: cardData.numero.slice(-4),
            brand: detectCardBrand(cardData.numero)
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setStep(3);
        
        // Guardar token si viene
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
        }
      } else {
        setError(data.message || 'Error procesando el pago');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión. Por favor intenta de nuevo.');
    } finally {
      setProcessing(false);
    }
  };

  const detectCardBrand = (number) => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    return 'card';
  };

  const getCardIcon = () => {
    const brand = detectCardBrand(cardData.numero);
    const icons = {
      visa: '💳 Visa',
      mastercard: '💳 Mastercard',
      amex: '💳 Amex',
      card: '💳'
    };
    return icons[brand];
  };

  const calcularPrecio = () => {
    if (!plan || plan.price === -1) return null;
    const precioBase = plan.price;
    if (billingCycle === 'yearly') {
      return {
        mensual: precioBase,
        total: precioBase * 10, // 2 meses gratis
        ahorro: precioBase * 2
      };
    }
    return {
      mensual: precioBase,
      total: precioBase,
      ahorro: 0
    };
  };

  if (loading) {
    return (
      <div className="checkout-loading">
        <div className="spinner"></div>
        <p>Cargando información del plan...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="checkout-error-page">
        <div className="error-content">
          <span className="error-icon">❌</span>
          <h2>Plan no encontrado</h2>
          <p>El plan que buscas no existe o no está disponible.</p>
          <button onClick={() => navigate('/')}>Volver al inicio</button>
        </div>
      </div>
    );
  }

  if (plan.price === -1) {
    return (
      <div className="checkout-enterprise">
        <div className="enterprise-content">
          <span className="enterprise-icon">🏢</span>
          <h2>Plan Enterprise</h2>
          <p>Para grandes empresas con necesidades personalizadas</p>
          <div className="contact-info">
            <h3>Contacta con nuestro equipo comercial</h3>
            <div className="contact-methods">
              <a href="mailto:enterprise@neuriax.com" className="contact-btn email">
                <span>📧</span> enterprise@neuriax.com
              </a>
              <a href="tel:+34900123456" className="contact-btn phone">
                <span>📞</span> +34 900 123 456
              </a>
            </div>
            <p className="contact-note">Te responderemos en menos de 24 horas laborables</p>
          </div>
          <button className="back-btn" onClick={() => navigate('/')}>← Volver</button>
        </div>
      </div>
    );
  }

  const precio = calcularPrecio();

  return (
    <div className="checkout-page">
      {/* Header */}
      <header className="checkout-header">
        <div className="header-content">
          <div className="brand" onClick={() => navigate('/')}>
            <span className="brand-icon">💈</span>
            <div className="brand-text">
              <h1>NEURIAX</h1>
              <span>Checkout Seguro</span>
            </div>
          </div>
          <div className="security-badge">
            <span>🔒</span> Pago 100% Seguro
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="checkout-progress">
        <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-number">{step > 1 ? '✓' : '1'}</div>
          <span>Tus Datos</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-number">{step > 2 ? '✓' : '2'}</div>
          <span>Pago</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
          <div className="step-number">{step > 3 ? '✓' : '3'}</div>
          <span>Confirmación</span>
        </div>
      </div>

      <div className="checkout-container">
        {/* Main Content */}
        <div className="checkout-main">
          {/* Step 1: User Data */}
          {step === 1 && (
            <div className="checkout-step step-1">
              <h2>Información de tu cuenta</h2>
              <p className="step-desc">Estos datos se usarán para crear tu cuenta en NEURIAX</p>

              <div className="form-section">
                <h3>👤 Datos Personales</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nombre completo *</label>
                    <input
                      type="text"
                      name="nombre_completo"
                      value={formData.nombre_completo}
                      onChange={handleInputChange}
                      placeholder="Tu nombre y apellidos"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono *</label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      placeholder="+34 600 000 000"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Nombre del Negocio *</label>
                    <input
                      type="text"
                      name="nombre_negocio"
                      value={formData.nombre_negocio}
                      onChange={handleInputChange}
                      placeholder="Tu salón de belleza"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>🔐 Contraseña de acceso</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Contraseña *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirmar Contraseña *</label>
                    <input
                      type="password"
                      name="passwordConfirm"
                      value={formData.passwordConfirm}
                      onChange={handleInputChange}
                      placeholder="Repite tu contraseña"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>📍 Datos de Facturación (opcional)</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Dirección</label>
                    <input
                      type="text"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      placeholder="Calle, número, piso..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Ciudad</label>
                    <input
                      type="text"
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleInputChange}
                      placeholder="Tu ciudad"
                    />
                  </div>
                  <div className="form-group">
                    <label>Código Postal</label>
                    <input
                      type="text"
                      name="codigo_postal"
                      value={formData.codigo_postal}
                      onChange={handleInputChange}
                      placeholder="28001"
                    />
                  </div>
                  <div className="form-group">
                    <label>NIF/CIF (para factura)</label>
                    <input
                      type="text"
                      name="nif_cif"
                      value={formData.nif_cif}
                      onChange={handleInputChange}
                      placeholder="12345678A"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="checkout-step step-2">
              <h2>Método de Pago</h2>
              <p className="step-desc">Tu información está protegida con encriptación SSL de 256 bits</p>

              <div className="payment-methods">
                <div className="payment-method active">
                  <input type="radio" name="paymentMethod" checked readOnly />
                  <span className="method-icon">💳</span>
                  <span>Tarjeta de Crédito/Débito</span>
                  <div className="card-brands">
                    <span>Visa</span>
                    <span>Mastercard</span>
                    <span>Amex</span>
                  </div>
                </div>
              </div>

              <div className="card-form">
                <div className="form-group">
                  <label>Número de tarjeta</label>
                  <div className="card-input-wrapper">
                    <input
                      type="text"
                      name="numero"
                      value={cardData.numero}
                      onChange={handleCardChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                    />
                    <span className="card-brand">{getCardIcon()}</span>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Fecha de expiración</label>
                    <input
                      type="text"
                      name="expiry"
                      value={cardData.expiry}
                      onChange={handleCardChange}
                      placeholder="MM/YY"
                      maxLength="5"
                    />
                  </div>
                  <div className="form-group">
                    <label>CVC</label>
                    <input
                      type="text"
                      name="cvc"
                      value={cardData.cvc}
                      onChange={handleCardChange}
                      placeholder="123"
                      maxLength="4"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Nombre del titular</label>
                  <input
                    type="text"
                    name="nombre"
                    value={cardData.nombre}
                    onChange={handleCardChange}
                    placeholder="Como aparece en la tarjeta"
                  />
                </div>
              </div>

              <div className="terms-section">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="aceptaTerminos"
                    checked={formData.aceptaTerminos}
                    onChange={handleInputChange}
                  />
                  <span>Acepto los <a href="/terminos" target="_blank">Términos y Condiciones</a></span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="aceptaPrivacidad"
                    checked={formData.aceptaPrivacidad}
                    onChange={handleInputChange}
                  />
                  <span>Acepto la <a href="/privacidad" target="_blank">Política de Privacidad</a></span>
                </label>
              </div>

              <div className="security-info">
                <div className="security-item">
                  <span>🔒</span>
                  <span>Pago seguro SSL</span>
                </div>
                <div className="security-item">
                  <span>🛡️</span>
                  <span>Protección de datos</span>
                </div>
                <div className="security-item">
                  <span>↩️</span>
                  <span>Cancela cuando quieras</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && success && (
            <div className="checkout-step step-3">
              <div className="success-content">
                <div className="success-icon">✓</div>
                <h2>¡Pago completado con éxito!</h2>
                <p>Bienvenido a NEURIAX, {formData.nombre_completo}</p>
                
                <div className="subscription-details">
                  <h3>Resumen de tu suscripción</h3>
                  <div className="detail-row">
                    <span>Plan:</span>
                    <strong>{plan.name}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Email:</span>
                    <strong>{formData.email}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Negocio:</span>
                    <strong>{formData.nombre_negocio}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Precio:</span>
                    <strong>{precio.total}€/{billingCycle === 'yearly' ? 'año' : 'mes'}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Próximo cobro:</span>
                    <strong>{new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}</strong>
                  </div>
                </div>

                <div className="next-steps">
                  <h3>Próximos pasos</h3>
                  <ol>
                    <li>Revisa tu email para confirmar tu cuenta</li>
                    <li>Inicia sesión con tu email y contraseña</li>
                    <li>Configura tu primer servicio y empleado</li>
                    <li>¡Empieza a gestionar tu salón!</li>
                  </ol>
                </div>

                <button className="btn-primary large" onClick={() => navigate('/login')}>
                  Ir al Panel de Control →
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 3 && (
            <div className="checkout-actions">
              {step > 1 && (
                <button className="btn-secondary" onClick={prevStep} disabled={processing}>
                  ← Anterior
                </button>
              )}
              <button 
                className="btn-primary" 
                onClick={nextStep}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <span className="spinner-small"></span>
                    Procesando...
                  </>
                ) : step === 2 ? (
                  `Pagar ${precio.total}€`
                ) : (
                  'Continuar →'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar - Order Summary */}
        <div className="checkout-sidebar">
          <div className="order-summary">
            <h3>Resumen del pedido</h3>
            
            <div className="plan-card">
              <div className="plan-icon">
                {plan.id === 'basic' ? '🎯' : '⭐'}
              </div>
              <div className="plan-info">
                <h4>{plan.name}</h4>
                <p>{plan.description}</p>
              </div>
            </div>

            <div className="billing-toggle">
              <button 
                className={billingCycle === 'monthly' ? 'active' : ''}
                onClick={() => setBillingCycle('monthly')}
              >
                Mensual
              </button>
              <button 
                className={billingCycle === 'yearly' ? 'active' : ''}
                onClick={() => setBillingCycle('yearly')}
              >
                Anual
                <span className="save-badge">-17%</span>
              </button>
            </div>

            <div className="price-breakdown">
              <div className="price-row">
                <span>{plan.name}</span>
                <span>{precio.mensual}€/mes</span>
              </div>
              {billingCycle === 'yearly' && (
                <>
                  <div className="price-row discount">
                    <span>Descuento anual</span>
                    <span>-{precio.ahorro}€</span>
                  </div>
                  <div className="price-row subtotal">
                    <span>12 meses × {precio.mensual}€</span>
                    <span>{precio.mensual * 12}€</span>
                  </div>
                </>
              )}
              <div className="price-row total">
                <span>Total {billingCycle === 'yearly' ? 'anual' : 'mensual'}</span>
                <span className="total-price">{precio.total}€</span>
              </div>
            </div>

            <div className="plan-features-mini">
              <h4>Incluye:</h4>
              <ul>
                {plan.benefits && plan.benefits.slice(0, 5).map((benefit, idx) => (
                  <li key={idx}>
                    <span className="check">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="guarantee">
              <span>🛡️</span>
              <div>
                <strong>Garantía de satisfacción</strong>
                <p>Cancela en cualquier momento sin compromiso</p>
              </div>
            </div>
          </div>

          <div className="help-box">
            <h4>¿Necesitas ayuda?</h4>
            <p>Nuestro equipo está aquí para ti</p>
            <a href="mailto:soporte@neuriax.com">📧 soporte@neuriax.com</a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="checkout-footer">
        <div className="footer-content">
          <div className="payment-badges">
            <span>💳 Visa</span>
            <span>💳 Mastercard</span>
            <span>💳 Amex</span>
            <span>🔒 SSL Secure</span>
          </div>
          <p>© 2025 NEURIAX. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
