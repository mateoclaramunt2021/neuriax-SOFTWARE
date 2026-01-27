/**
 * RescheduleModal - Modal para cambiar cita online
 * NEURIAX Salon Manager
 * SEMANA 1: Cambio de citas
 */

import React, { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import './reschedule-modal.css';

const RescheduleModal = ({ citaId, citaActual, onClose, onSuccess }) => {
  const { success: notifySuccess, error: notifyError } = useNotification();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Código, Step 2: Seleccionar fecha/hora
  const [horariosDisponibles, setHorariosDisponibles] = useState({});
  
  const [codigoConfirmacion, setCodigoConfirmacion] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  
  const [selectedFecha, setSelectedFecha] = useState('');
  const [selectedHora, setSelectedHora] = useState('');
  
  const [error, setError] = useState(null);

  // Obtener horarios disponibles
  const solicitarCambio = async (e) => {
    e.preventDefault();
    
    if (!emailCliente || !codigoConfirmacion) {
      setError('Email y código de confirmación requeridos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/public/citas/solicitar-cambio', {
        emailCliente,
        codigoConfirmacion
      });

      if (response.data.success) {
        setHorariosDisponibles(response.data.horariosDisponibles);
        setStep(2);
        notifySuccess('Verificación exitosa. Selecciona un nuevo horario.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al verificar datos');
      notifyError(err.response?.data?.error || 'Error al verificar datos');
    } finally {
      setLoading(false);
    }
  };

  // Confirmar cambio de cita
  const confirmarCambio = async (e) => {
    e.preventDefault();

    if (!selectedFecha || !selectedHora) {
      setError('Selecciona fecha y hora');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/public/citas/cambio-cita', {
        citaId,
        codigoConfirmacion,
        nuevaFecha: selectedFecha,
        nuevaHora: selectedHora
      });

      if (response.data.success) {
        notifySuccess('¡Cita cambiad exitosamente!');
        onSuccess(response.data.cita);
        setTimeout(() => onClose(), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar cita');
      notifyError(err.response?.data?.error || 'Error al cambiar cita');
    } finally {
      setLoading(false);
    }
  };

  // Obtener fechas disponibles
  const fechasDisponibles = Object.keys(horariosDisponibles).sort();

  // Horarios para la fecha seleccionada
  const horariosDelDia = selectedFecha ? horariosDisponibles[selectedFecha] || [] : [];

  const formatearFecha = (fecha) => {
    const date = new Date(`${fecha}T00:00:00`);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="reschedule-overlay" onClick={onClose}>
      <div className="reschedule-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reschedule-header">
          <h2>📅 Cambiar Cita</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="reschedule-body">
          {/* PASO 1: Verificación */}
          {step === 1 && (
            <form onSubmit={solicitarCambio} className="reschedule-form">
              <div className="form-header">
                <p className="form-title">Verifica tu identidad</p>
                <p className="form-subtitle">Para cambiar tu cita, necesitamos confirmar tus datos</p>
              </div>

              <div className="current-cita">
                <h3>Tu cita actual:</h3>
                <p className="cita-info">
                  <span className="cita-icon">📅</span>
                  <span>{citaActual?.fecha} a las {citaActual?.hora}</span>
                </p>
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={emailCliente}
                  onChange={(e) => setEmailCliente(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  disabled={loading}
                />
                <small>Usa el email con el que reservaste</small>
              </div>

              <div className="form-group">
                <label>Código de Confirmación *</label>
                <input
                  type="text"
                  value={codigoConfirmacion}
                  onChange={(e) => setCodigoConfirmacion(e.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                  maxLength="6"
                  required
                  disabled={loading}
                />
                <small>Revisa tu email o SMS para el código</small>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Verificando...' : 'Verificar y Continuar'}
              </button>
            </form>
          )}

          {/* PASO 2: Seleccionar nueva fecha y hora */}
          {step === 2 && (
            <form onSubmit={confirmarCambio} className="reschedule-form">
              <div className="form-header">
                <p className="form-title">Selecciona nuevo horario</p>
                <p className="form-subtitle">Elige la fecha y hora que mejor te conviene</p>
              </div>

              <div className="current-cita">
                <h3>Cambio de:</h3>
                <p className="cita-info">
                  <span className="cita-icon">📅</span>
                  <span>{citaActual?.fecha} a las {citaActual?.hora}</span>
                </p>
                <p className="cita-info arrow">⬇️</p>
                {selectedFecha && selectedHora && (
                  <p className="cita-info new">
                    <span className="cita-icon">✅</span>
                    <span>{selectedFecha} a las {selectedHora}</span>
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>Fecha Disponible *</label>
                <div className="fecha-grid">
                  {fechasDisponibles.length > 0 ? (
                    fechasDisponibles.map(fecha => (
                      <button
                        key={fecha}
                        type="button"
                        className={`fecha-option ${selectedFecha === fecha ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedFecha(fecha);
                          setSelectedHora(''); // Reset hora cuando cambia fecha
                        }}
                      >
                        <span className="fecha-number">{fecha.split('-')[2]}</span>
                        <span className="fecha-name">
                          {formatearFecha(fecha).split(',')[0].split(' ')[0].substring(0, 3)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="no-fechas">No hay fechas disponibles</p>
                  )}
                </div>
              </div>

              {selectedFecha && (
                <div className="form-group">
                  <label>Hora Disponible *</label>
                  <div className="hora-grid">
                    {horariosDelDia.length > 0 ? (
                      horariosDelDia.map(hora => (
                        <button
                          key={hora}
                          type="button"
                          className={`hora-option ${selectedHora === hora ? 'selected' : ''}`}
                          onClick={() => setSelectedHora(hora)}
                        >
                          <span className="hora-icon">⏰</span>
                          {hora}
                        </button>
                      ))
                    ) : (
                      <p className="no-horas">No hay horas disponibles para esta fecha</p>
                    )}
                  </div>
                </div>
              )}

              {error && <div className="error-message">{error}</div>}

              <div className="button-group">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || !selectedFecha || !selectedHora}
                >
                  {loading ? 'Procesando...' : 'Confirmar Cambio'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;
