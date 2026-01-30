/**
 * CHECKOUT PAGE - Sistema de Pagos Profesional con Stripe Elements
 * ================================================================
 * ENTERPRISE SECURITY:
 * ✅ PCI-DSS Compliant - Usa Stripe Elements para datos de tarjeta
 * ✅ Nunca almacena datos de tarjeta en estado local
 * ✅ Cliente crea Payment Method, nunca envía card raw al backend
 * ✅ Soporta 3D Secure para autenticación adicional
 * ✅ Error handling robusto
 * 
 * FLOW:
 * 1. Usuario completa datos de registro
 * 2. Usuario completa form de pago (CardElement de Stripe)
 * 3. Cliente crea Payment Method con Stripe (datos nunca van a backend)
 * 4. Backend crea Payment Intent con el Payment Method
 * 5. Si requiere 3D Secure, se confirma en el cliente
 * 6. Pago confirmado via webhook automático
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import '../styles/checkout.css';

// Inicializar Stripe en el nivel de aplicación
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_51234567890');

/**
 * Componente de Formulario de Pago (dentro de Elements provider)
 */
function PaymentForm({ plan, billingCycle, loading, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    telefono: '',
    nombre_negocio: '',
    password: '',
    passwordConfirm: '',
    // Facturación
    direccion: '',
    ciudad: '',
    codigo_postal: '',
    pais: 'ES',
    nif_cif: '',
    // Términos
    aceptaTerminos: false,
    aceptaPrivacidad: false
  });

  const [step, setStep] = useState(1); // 1: Datos, 2: Pago, 3: Confirmación
  const [cardError, setCardError] = useState('');
  const [cardComplete, setCardComplete] = useState(false);

  const STRIPE_CARD_OPTIONS = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
      },
    },
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCardChange = (event) => {
    setCardError(event.error?.message || '');
    setCardComplete(event.complete);
  };

  const validateFormData = () => {
    const errors = [];

    // Email
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Email inválido');
    }

    // Nombre
    if (!formData.nombre_completo || formData.nombre_completo.length < 3) {
      errors.push('Nombre completo requerido (mín 3 caracteres)');
    }

    // Teléfono
    if (!formData.telefono || formData.telefono.length < 9) {
      errors.push('Teléfono inválido');
    }

    // Negocio
    if (!formData.nombre_negocio || formData.nombre_negocio.length < 3) {
      errors.push('Nombre del negocio requerido');
    }

    // Password
    if (!formData.password || formData.password.length < 8) {
      errors.push('Contraseña mínimo 8 caracteres');
    }

    if (formData.password !== formData.passwordConfirm) {
      errors.push('Las contraseñas no coinciden');
    }

    // Términos
    if (!formData.aceptaTerminos || !formData.aceptaPrivacidad) {
      errors.push('Debe aceptar términos y privacidad');
    }

    return errors;
  };

  const crearPaymentIntent = async () => {
    try {
      setProcessing(true);

      // Calcular monto
      const precioBase = plan?.price || 0;
      const multiplicador = billingCycle === 'yearly' ? 10 : 1; // Descuento anual
      const monto = Math.round(precioBase * multiplicador * 100); // Convertir a centavos

      // Solicitar Payment Intent al backend
      const response = await fetch(`${API_URL}/stripe/payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          monto,
          clienteId: formData.email, // Temporal, se reemplazará con ID real
          citaId: `checkout_${Date.now()}`,
          clienteEmail: formData.email,
          metadata: {
            planId: plan.id,
            billingCycle,
            nombreNegocio: formData.nombre_negocio
          }
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Error creando Payment Intent');
      }

      setClientSecret(data.clientSecret);
      return data;
    } catch (error) {
      console.error('❌ Error creando Payment Intent:', error);
      onError(error.message || 'Error preparando pago');
      setProcessing(false);
      throw error;
    }
  };

  const procesarPago = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe no está cargado');
      return;
    }

    // Validar datos
    const erroresValidacion = validateFormData();
    if (erroresValidacion.length > 0) {
      onError(erroresValidacion.join(', '));
      return;
    }

    setProcessing(true);

    try {
      // 1️⃣ Crear Payment Intent en el backend
      const intentData = await crearPaymentIntent();

      // 2️⃣ Crear Payment Method en el cliente (datos de tarjeta NUNCA van al backend)
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
        billing_details: {
          name: formData.nombre_completo,
          email: formData.email,
          phone: formData.telefono,
          address: {
            line1: formData.direccion,
            city: formData.ciudad,
            postal_code: formData.codigo_postal,
            country: formData.pais
          }
        }
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      // 3️⃣ Confirmar pago en el cliente
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: paymentMethod.id
      });

      if (confirmError) {
        // Manejar 3D Secure u otros errores de autenticación
        if (confirmError.code === 'authentication_required') {
          // El usuario necesita completar 3D Secure - Stripe lo maneja automáticamente
          console.log('🔐 Autenticación 3D Secure requerida');
        }
        throw new Error(confirmError.message);
      }

      // 4️⃣ Pago completado o pendiente 3D Secure
      if (paymentIntent.status === 'succeeded') {
        setStep(3);
        onSuccess({
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status
        });
      } else if (paymentIntent.status === 'requires_action') {
        // Pendiente 3D Secure u otra acción
        console.log('⏳ Pago pendiente de autenticación adicional');
        setStep(3);
        onSuccess({
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          requiresAction: true
        });
      }

    } catch (error) {
      console.error('❌ Error procesando pago:', error);
      onError(error.message || 'Error procesando pago');
    } finally {
      setProcessing(false);
    }
  };

  const siguientePaso = async (e) => {
    e.preventDefault();

    if (step === 1) {
      // Validar datos de registro
      const erroresValidacion = validateFormData();
      if (erroresValidacion.length > 0) {
        onError(erroresValidacion.join(', '));
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Procesar pago
      await procesarPago(e);
    }
  };

  return (
    <form onSubmit={siguientePaso} className="checkout-form">
      {/* PASO 1: Datos de Registro */}
      {step === 1 && (
        <div className="form-step">
          <h2>📋 Datos de Registro</h2>

          <div className="form-group">
            <label>Nombre Completo</label>
            <input
              type="text"
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleInputChange}
              placeholder="Juan Pérez García"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
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
              <label>Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="+34 600 123 456"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Nombre del Negocio</label>
            <input
              type="text"
              name="nombre_negocio"
              value={formData.nombre_negocio}
              onChange={handleInputChange}
              placeholder="Mi Salón de Belleza"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirmar Contraseña</label>
              <input
                type="password"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleInputChange}
                placeholder="Confirma tu contraseña"
                required
              />
            </div>
          </div>

          <h3>📍 Datos de Facturación</h3>

          <div className="form-group">
            <label>Dirección</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              placeholder="Calle Principal 123"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Ciudad</label>
              <input
                type="text"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleInputChange}
                placeholder="Madrid"
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
          </div>

          <div className="form-group">
            <label>NIF/CIF</label>
            <input
              type="text"
              name="nif_cif"
              value={formData.nif_cif}
              onChange={handleInputChange}
              placeholder="12345678A"
            />
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              name="aceptaTerminos"
              checked={formData.aceptaTerminos}
              onChange={handleInputChange}
              id="terminos"
            />
            <label htmlFor="terminos">
              ✅ Acepto los <a href="/terminos" target="_blank">Términos de Servicio</a>
            </label>
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              name="aceptaPrivacidad"
              checked={formData.aceptaPrivacidad}
              onChange={handleInputChange}
              id="privacidad"
            />
            <label htmlFor="privacidad">
              ✅ Acepto la <a href="/privacidad" target="_blank">Política de Privacidad</a>
            </label>
          </div>

          <button type="submit" className="btn-primary btn-lg">
            Siguiente: Pago →
          </button>
        </div>
      )}

      {/* PASO 2: Datos de Pago */}
      {step === 2 && (
        <div className="form-step">
          <h2>💳 Método de Pago</h2>

          <div className="plan-summary">
            <h3>{plan?.name}</h3>
            <p className="price">
              ${(plan?.price * (billingCycle === 'yearly' ? 10 : 1)).toFixed(2)} {billingCycle === 'yearly' ? '/año' : '/mes'}
            </p>
            <p className="description">{plan?.description}</p>
          </div>

          <div className="form-group">
            <label>Información de Tarjeta</label>
            <div className="card-element-container">
              <CardElement
                options={STRIPE_CARD_OPTIONS}
                onChange={handleCardChange}
              />
            </div>
            {cardError && <div className="error-message">{cardError}</div>}
          </div>

          <div className="payment-info">
            <p>🔐 <strong>Tu información es segura</strong></p>
            <p>Utilizamos Stripe para procesar pagos. Tu tarjeta no se almacena en nuestros servidores.</p>
            <p>Se puede requerir autenticación adicional (3D Secure) para confirmar tu identidad.</p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary"
            >
              ← Atrás
            </button>
            <button
              type="submit"
              disabled={processing || !cardComplete || !stripe || !elements}
              className="btn-primary btn-lg"
            >
              {processing ? '⏳ Procesando...' : `Pagar ${(plan?.price * (billingCycle === 'yearly' ? 10 : 1)).toFixed(2)}€`}
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: Confirmación */}
      {step === 3 && (
        <div className="form-step success">
          <h2>✅ ¡Pago Completado!</h2>
          <p className="success-message">
            Tu suscripción a {plan?.name} ha sido confirmada.
          </p>
          <p>Recibirás un email de confirmación en breve.</p>
          <button
            type="button"
            onClick={() => window.location.href = '/dashboard'}
            className="btn-primary btn-lg"
          >
            Ir al Dashboard
          </button>
        </div>
      )}
    </form>
  );
}

/**
 * Componente Principal CheckoutPage
 */
export default function CheckoutPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  const cargarPlan = async () => {
    try {
      const response = await fetch(`${API_URL}/plans/${planId}`);
      const data = await response.json();
      if (data.success) {
        setPlan(data.data);
      } else {
        // Planes por defecto
        const planesDefault = {
          basic: {
            id: 'basic',
            name: 'Plan Básico',
            price: 39,
            description: 'Para emprendedores',
            benefits: ['Hasta 100 clientes', 'Hasta 2 empleados', 'Reportes básicos']
          },
          pro: {
            id: 'pro',
            name: 'Plan Profesional',
            price: 79,
            description: 'Para negocios en crecimiento',
            benefits: ['Clientes ilimitados', 'Hasta 10 empleados', 'Reportes avanzados']
          },
          enterprise: {
            id: 'enterprise',
            name: 'Enterprise',
            price: 0,
            description: 'Para grandes empresas',
            benefits: ['Todo ilimitado', 'Soporte dedicado 24/7']
          }
        };
        setPlan(planesDefault[planId] || null);
      }
    } catch (err) {
      console.error('Error cargando plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const handleSuccess = (data) => {
    console.log('✅ Pago exitoso:', data);
    // El webhook se encargará de actualizar la suscripción
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  const handleError = (errorMsg) => {
    setError(errorMsg);
    console.error('❌ Error:', errorMsg);
  };

  if (loading) {
    return <div className="loading">Cargando plan...</div>;
  }

  if (!plan) {
    return <div className="error">Plan no encontrado</div>;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h1>Contratar {plan.name}</h1>
        <p>{plan.description}</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="checkout-container">
        <div className="checkout-main">
          <Elements stripe={stripePromise}>
            <PaymentForm
              plan={plan}
              billingCycle={billingCycle}
              loading={loading}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </Elements>
        </div>

        <div className="checkout-sidebar">
          <div className="plan-card">
            <h3>{plan.name}</h3>
            <div className="price">
              <span className="amount">${(plan.price * (billingCycle === 'yearly' ? 10 : 1)).toFixed(2)}</span>
              <span className="period">/{billingCycle === 'yearly' ? 'año' : 'mes'}</span>
            </div>

            <div className="billing-cycle-selector">
              <button
                className={`cycle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                Mensual
              </button>
              <button
                className={`cycle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('yearly')}
              >
                Anual (-20%)
              </button>
            </div>

            <ul className="benefits">
              {plan.benefits?.map((benefit, idx) => (
                <li key={idx}>✓ {benefit}</li>
              ))}
            </ul>
          </div>

          <div className="security-badge">
            <p>🔒 <strong>Pago Seguro</strong></p>
            <p>PCI-DSS Compliant - Procesado por Stripe</p>
          </div>
        </div>
      </div>
    </div>
  );
}
