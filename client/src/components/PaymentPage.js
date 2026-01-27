/**
 * PaymentPage - Página de Pago con Stripe
 * NEURIAX Salon Manager
 * SEMANA 1: Integración Stripe
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import './payment-page.css';

const PaymentPage = () => {
  const { citaId } = useParams();
  const navigate = useNavigate();
  const { success: notifySuccess, error: notifyError } = useNotification();

  const [cita, setCita] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Estado del formulario de pago
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: ''
  });

  // Cargar datos de la cita
  useEffect(() => {
    cargarCita();
  }, [citaId]);

  const cargarCita = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/citas/${citaId}`);
      if (response.data.success) {
        setCita(response.data.cita);
        // Cargar datos del cliente
        if (response.data.cita.clienteId) {
          cargarCliente(response.data.cita.clienteId);
        }
      }
    } catch (err) {
      notifyError('Error al cargar la cita');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cargarCliente = async (clienteId) => {
    try {
      const response = await api.get(`/clientes/${clienteId}`);
      if (response.data.success) {
        setCliente(response.data.cliente);
      }
    } catch (err) {
      console.error('Error al cargar cliente:', err);
    }
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\D/g, '').substring(0, 16);
      formattedValue = formattedValue.replace(/(\d{4})/g, '$1 ').trim();
    } else if (name === 'cardExpiry') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2);
      }
    } else if (name === 'cardCvc') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    }

    setCardData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const procesarPago = async (e) => {
    e.preventDefault();

    if (!cita) {
      notifyError('Cita no encontrada');
      return;
    }

    // Validar datos de tarjeta
    if (!cardData.cardNumber || cardData.cardNumber.replace(/\s/g, '').length !== 16) {
      notifyError('Número de tarjeta inválido');
      return;
    }
    if (!cardData.cardExpiry || cardData.cardExpiry.length !== 5) {
      notifyError('Fecha de expiración inválida (MM/YY)');
      return;
    }
    if (!cardData.cardCvc || cardData.cardCvc.length < 3) {
      notifyError('CVV inválido');
      return;
    }
    if (!cardData.cardName) {
      notifyError('Nombre del titular requerido');
      return;
    }

    setProcessing(true);
    setPaymentStatus('processing');

    try {
      // Paso 1: Crear Payment Intent
      console.log('1️⃣ Creando Payment Intent...');
      const intentResponse = await api.post('/stripe/payment-intent', {
        citaId,
        monto: cita.montoCobrado || 0,
        servicioNombre: 'Servicio de Salón'
      });

      if (!intentResponse.data.success) {
        throw new Error(intentResponse.data.error);
      }

      const { intentId, clientSecret } = intentResponse.data;
      console.log(`✅ Payment Intent creado: ${intentId}`);

      // Paso 2: Confirmar pago (en prod, usar Stripe.js)
      // Por ahora, simulamos la confirmación
      console.log('2️⃣ Procesando pago con Stripe...');
      
      // NOTA: En producción, usar @stripe/react-stripe-js
      // Por ahora, enviamos los datos (en producción nunca harías esto)
      const confirmResponse = await api.post('/stripe/verify-payment', {
        intentId,
        citaId
      });

      if (confirmResponse.data.success) {
        setPaymentStatus('success');
        notifySuccess('¡Pago procesado exitosamente! Tu cita ha sido confirmada.');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setPaymentStatus('failed');
        notifyError(confirmResponse.data.error);
      }

    } catch (error) {
      console.error('Error procesando pago:', error);
      setPaymentStatus('failed');
      notifyError(error.response?.data?.error || 'Error al procesar el pago');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="payment-page loading-state">
        <div className="spinner"></div>
        <p>Cargando información de la cita...</p>
      </div>
    );
  }

  if (!cita) {
    return (
      <div className="payment-page error-state">
        <div className="error-icon">❌</div>
        <h2>Cita no encontrada</h2>
        <button onClick={() => navigate('/dashboard')}>Volver al Dashboard</button>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        {/* Resumen de la Cita */}
        <div className="payment-summary">
          <h1>💳 Finalizar Pago</h1>
          
          <div className="cita-details">
            <div className="detail-row">
              <span className="label">📅 Fecha y Hora:</span>
              <span className="value">{cita.fecha} a las {cita.hora}</span>
            </div>
            
            {cliente && (
              <div className="detail-row">
                <span className="label">👤 Cliente:</span>
                <span className="value">{cliente.nombre}</span>
              </div>
            )}
            
            <div className="detail-row">
              <span className="label">💇 Servicio:</span>
              <span className="value">{cita.servicio || 'Servicio de Salón'}</span>
            </div>

            <div className="detail-row highlight">
              <span className="label">💰 Total a Pagar:</span>
              <span className="value amount">${(cita.montoCobrado || 0).toFixed(0)} CLP</span>
            </div>
          </div>
        </div>

        {/* Formulario de Pago */}
        {paymentStatus !== 'success' && (
          <form onSubmit={procesarPago} className="payment-form">
            <h2>Datos de la Tarjeta</h2>

            <div className="form-group">
              <label>Número de Tarjeta *</label>
              <input
                type="text"
                name="cardNumber"
                value={cardData.cardNumber}
                onChange={handleCardChange}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                required
                disabled={processing}
              />
              <small>Ej: 4532 1234 5678 9010 (Visa)</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Vencimiento (MM/YY) *</label>
                <input
                  type="text"
                  name="cardExpiry"
                  value={cardData.cardExpiry}
                  onChange={handleCardChange}
                  placeholder="12/25"
                  maxLength="5"
                  required
                  disabled={processing}
                />
              </div>

              <div className="form-group">
                <label>CVV *</label>
                <input
                  type="text"
                  name="cardCvc"
                  value={cardData.cardCvc}
                  onChange={handleCardChange}
                  placeholder="123"
                  maxLength="4"
                  required
                  disabled={processing}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Nombre del Titular *</label>
              <input
                type="text"
                name="cardName"
                value={cardData.cardName}
                onChange={(e) => setCardData(prev => ({ ...prev, cardName: e.target.value }))}
                placeholder="Juan Pérez"
                required
                disabled={processing}
              />
            </div>

            <div className="security-notice">
              🔒 Tu información de pago es procesada de forma segura por Stripe
            </div>

            <button
              type="submit"
              className="btn-pay"
              disabled={processing}
            >
              {processing ? (
                <>
                  <span className="spinner-small"></span> Procesando...
                </>
              ) : (
                <>💳 Pagar ${(cita.montoCobrado || 0).toFixed(0)} CLP</>
              )}
            </button>

            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate('/dashboard')}
              disabled={processing}
            >
              Cancelar
            </button>
          </form>
        )}

        {/* Estado del Pago */}
        {paymentStatus === 'success' && (
          <div className="payment-success">
            <div className="success-icon">✅</div>
            <h2>¡Pago Procesado Exitosamente!</h2>
            <p>Tu cita ha sido confirmada y pagada.</p>
            <p className="cita-id">Referencia: {citaId}</p>
            <div className="success-details">
              <p>📧 Se ha enviado una confirmación por correo electrónico</p>
              <p>📱 Recibirás recordatorios por SMS antes de tu cita</p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="btn-success">
              Volver al Dashboard
            </button>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="payment-failed">
            <div className="error-icon">❌</div>
            <h2>El Pago Fue Rechazado</h2>
            <p>Por favor, verifica los datos de tu tarjeta e intenta de nuevo.</p>
            <button
              onClick={() => {
                setPaymentStatus(null);
              }}
              className="btn-retry"
            >
              Intentar Nuevamente
            </button>
          </div>
        )}
      </div>

      {/* Información Adicional */}
      <div className="payment-info">
        <h3>❓ ¿Necesitas Ayuda?</h3>
        <ul>
          <li>📞 Llama al soporte: +34 900 000 000</li>
          <li>📧 Email: soporte@neuriax.com</li>
          <li>💬 Chat en vivo disponible de 9:00 a 18:00</li>
        </ul>
      </div>
    </div>
  );
};

export default PaymentPage;
