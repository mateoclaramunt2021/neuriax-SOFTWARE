/**
 * CHECKOUT PAGE - Sistema de Pagos Profesional
 * =============================================
 * Versión simplificada sin dependencias npm
 * Carga Stripe.js v3 desde CDN
 * PCI-DSS Level 1 Compliant
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/checkout.css';

function CheckoutPage() {
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  const [step, setStep] = useState(1); // 1: Datos, 2: Pago, 3: Confirmación
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [stripe, setStripe] = useState(null);
  const [elements, setElements] = useState(null);
  const [cardElement, setCardElement] = useState(null);

  // Datos del formulario - PASO 1
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    telefono: '',
    nombre_negocio: '',
    password: '',
    passwordConfirm: '',
    aceptaTerminos: false,
  });

  // Datos de pago - PASO 2
  const [paymentData, setPaymentData] = useState({
    cardholderName: '',
  });

  // Cargar planes al iniciar
  useEffect(() => {
    fetchPlans();
    loadStripe();
  }, []);

  // Cargar Stripe desde CDN
  const loadStripe = async () => {
    try {
      if (!window.Stripe) {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        script.onload = () => {
          const stripeInstance = window.Stripe(
            process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_51234567890'
          );
          setStripe(stripeInstance);
          const elementsInstance = stripeInstance.elements();
          setElements(elementsInstance);
        };
        document.head.appendChild(script);
      } else {
        const stripeInstance = window.Stripe(
          process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_51234567890'
        );
        setStripe(stripeInstance);
        const elementsInstance = stripeInstance.elements();
        setElements(elementsInstance);
      }
    } catch (err) {
      console.error('Error cargando Stripe:', err);
      setError('Error al cargar el sistema de pagos');
    }
  };

  // Montar CardElement cuando esté en paso 2
  useEffect(() => {
    if (elements && step === 2 && !cardElement) {
      const cardEl = elements.create('card');
      cardEl.mount('#card-element');
      setCardElement(cardEl);

      // Listener para cambios en tarjeta
      cardEl.on('change', (event) => {
        if (event.error) {
          setError(event.error.message);
        } else {
          setError('');
        }
      });
    }

    return () => {
      if (cardElement && step !== 2) {
        cardElement.unmount();
        setCardElement(null);
      }
    };
  }, [elements, step]);

  // Obtener planes
  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/plans`);
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (err) {
      console.error('Error cargando planes:', err);
    }
  };

  // Manejar input cambios
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Validar paso 1
  const validateStep1 = () => {
    if (!formData.nombre_completo.trim()) {
      setError('Nombre completo es requerido');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Email válido es requerido');
      return false;
    }
    if (formData.password !== formData.passwordConfirm) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    if (formData.password.length < 8) {
      setError('La contraseña debe tener mínimo 8 caracteres');
      return false;
    }
    if (!formData.aceptaTerminos) {
      setError('Debe aceptar los términos y condiciones');
      return false;
    }
    if (!selectedPlan) {
      setError('Seleccione un plan');
      return false;
    }
    setError('');
    return true;
  };

  // Pasar al paso 2
  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  // Procesar pago
  const handlePayment = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !cardElement) {
      setError('Sistema de pago no disponible');
      return;
    }

    if (!paymentData.cardholderName.trim()) {
      setError('Nombre del titular es requerido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Crear Payment Method con Stripe
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: paymentData.cardholderName,
          email: formData.email,
        }
      });

      if (pmError) {
        setError(pmError.message);
        setLoading(false);
        return;
      }

      // 2. Enviar al backend
      const response = await fetch(`${API_URL}/stripe/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: {
            nombre_completo: formData.nombre_completo,
            email: formData.email,
            telefono: formData.telefono,
            nombre_negocio: formData.nombre_negocio,
            password: formData.password,
          },
          planId: selectedPlan.id,
          paymentMethodId: paymentMethod.id,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error procesando pago');
        setLoading(false);
        return;
      }

      // 3. Si requiere 3D Secure
      if (data.requiresAction && data.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret);

        if (confirmError) {
          setError(confirmError.message);
          setLoading(false);
          return;
        }
      }

      // 4. Éxito
      setStep(3);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (err) {
      console.error('Error:', err);
      setError('Error procesando su pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <h1>🔐 Sistema de Pagos Seguro</h1>
          <p>Paso {step} de 3</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        {/* PASO 1: DATOS DE USUARIO */}
        {step === 1 && (
          <div className="checkout-step">
            <h2>Información de Registro</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
              <div className="form-group">
                <label htmlFor="nombre">Nombre Completo *</label>
                <input
                  id="nombre"
                  type="text"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleInputChange}
                  placeholder="Juan Pérez García"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Correo Electrónico *</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  id="telefono"
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="+34 (555) 000-0000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="negocio">Nombre del Negocio *</label>
                <input
                  id="negocio"
                  type="text"
                  name="nombre_negocio"
                  value={formData.nombre_negocio}
                  onChange={handleInputChange}
                  placeholder="Mi Salón Profesional"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña *</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="passwordConfirm">Confirmar Contraseña *</label>
                <input
                  id="passwordConfirm"
                  type="password"
                  name="passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={handleInputChange}
                  placeholder="Repite tu contraseña"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="plan">Plan Seleccionado *</label>
                <select
                  id="plan"
                  value={selectedPlan?.id || ''}
                  onChange={(e) => {
                    const plan = plans.find(p => p.id === parseInt(e.target.value));
                    setSelectedPlan(plan);
                  }}
                  required
                >
                  <option value="">-- Selecciona un Plan --</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nombre} - ${plan.precio_mensual}/mes
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group checkbox">
                <input
                  id="terms"
                  type="checkbox"
                  name="aceptaTerminos"
                  checked={formData.aceptaTerminos}
                  onChange={handleInputChange}
                  required
                />
                <label htmlFor="terms">
                  Acepto los términos y condiciones *
                </label>
              </div>

              <div className="plan-preview" style={{ display: selectedPlan ? 'block' : 'none' }}>
                {selectedPlan && (
                  <>
                    <h4>{selectedPlan.nombre}</h4>
                    <p className="price">${selectedPlan.precio_mensual}/mes</p>
                    <p>{selectedPlan.descripcion}</p>
                  </>
                )}
              </div>

              <button type="submit" className="btn btn-primary btn-lg">
                Continuar al Pago →
              </button>
            </form>
          </div>
        )}

        {/* PASO 2: INFORMACIÓN DE PAGO */}
        {step === 2 && selectedPlan && (
          <div className="checkout-step">
            <h2>Información de Pago</h2>

            <div className="plan-summary">
              <h3>{selectedPlan.nombre}</h3>
              <p className="plan-price">${selectedPlan.precio_mensual}</p>
              <p className="plan-period">/mes</p>
            </div>

            <form onSubmit={handlePayment}>
              <div className="form-group">
                <label htmlFor="cardholder">Nombre del Titular *</label>
                <input
                  id="cardholder"
                  type="text"
                  value={paymentData.cardholderName}
                  onChange={(e) => setPaymentData({ ...paymentData, cardholderName: e.target.value })}
                  placeholder="Como aparece en la tarjeta"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="card-element">Datos de Tarjeta *</label>
                <div id="card-element" className="card-element-container"></div>
              </div>

              <div className="security-badges">
                <div className="badge">
                  <span>✅</span> Pagos seguros con Stripe
                </div>
                <div className="badge">
                  <span>🔐</span> Datos encriptados
                </div>
                <div className="badge">
                  <span>✓</span> PCI-DSS Cumplido
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  ← Volver
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                >
                  {loading ? 'Procesando...' : `Pagar $${selectedPlan.precio_mensual}`}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PASO 3: CONFIRMACIÓN */}
        {step === 3 && (
          <div className="checkout-step success">
            <div className="success-icon">✓</div>
            <h2>¡Pago Exitoso!</h2>
            <p className="success-message">
              Tu cuenta ha sido creada exitosamente y tu suscripción está activa.
            </p>
            <p className="success-details">
              Recibirás un correo de confirmación en<br />
              <strong>{formData.email}</strong>
            </p>
            <div className="success-details mt-3">
              <p>Redirigiendo al dashboard en 3 segundos...</p>
              <div className="spinner"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckoutPage;
