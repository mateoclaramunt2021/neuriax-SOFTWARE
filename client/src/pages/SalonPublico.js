/**
 * Página de Salón Individual con Sistema de Reservas
 * Permite ver servicios, empleados y reservar cita
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../styles/reservas-publicas.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function SalonPublico() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado de reserva
  const [step, setStep] = useState(1); // 1: servicio, 2: empleado, 3: fecha/hora, 4: datos
  const [selectedService, setSelectedService] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Datos del cliente
  const [clientData, setClientData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    notas: ''
  });
  
  // Estado de confirmación
  const [submitting, setSubmitting] = useState(false);
  const [reservaConfirmada, setReservaConfirmada] = useState(null);

  // Cargar datos del salón
  useEffect(() => {
    const cargarSalon = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/public/salones/${id}`);
        const data = await res.json();

        if (data.success) {
          setSalon(data.salon);
        } else {
          setError(data.message || 'Salón no encontrado');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    cargarSalon();
  }, [id]);

  // Cargar disponibilidad cuando se selecciona fecha
  useEffect(() => {
    if (!selectedService || !selectedDate) return;

    const cargarDisponibilidad = async () => {
      try {
        setLoadingSlots(true);
        const params = new URLSearchParams({
          fecha: selectedDate,
          servicioId: selectedService.id
        });
        if (selectedEmployee) {
          params.append('empleadoId', selectedEmployee.id);
        }

        const res = await fetch(`${API_URL}/api/public/salones/${id}/disponibilidad?${params}`);
        const data = await res.json();

        if (data.success) {
          setDisponibilidad(data.disponibilidad);
        }
      } catch (err) {
        console.error('Error cargando disponibilidad:', err);
      } finally {
        setLoadingSlots(false);
      }
    };

    cargarDisponibilidad();
  }, [id, selectedService, selectedEmployee, selectedDate]);

  // Seleccionar servicio
  const handleSelectService = (service) => {
    setSelectedService(service);
    setSelectedEmployee(null);
    setSelectedTime('');
    setStep(2);
  };

  // Seleccionar empleado
  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setSelectedTime('');
    setStep(3);
  };

  // Saltar selección de empleado
  const skipEmployeeSelection = () => {
    setSelectedEmployee(null);
    setStep(3);
  };

  // Seleccionar horario
  const handleSelectTime = (time) => {
    setSelectedTime(time);
    setStep(4);
  };

  // Enviar reserva
  const handleSubmitReserva = async (e) => {
    e.preventDefault();
    
    if (!clientData.nombre || !clientData.telefono) {
      alert('Por favor, completa tu nombre y teléfono');
      return;
    }

    try {
      setSubmitting(true);
      
      const res = await fetch(`${API_URL}/api/public/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonId: id,
          servicioId: selectedService.id,
          empleadoId: selectedEmployee?.id || null,
          fecha: selectedDate,
          hora: selectedTime,
          cliente: clientData
        })
      });

      const data = await res.json();

      if (data.success) {
        setReservaConfirmada(data.reserva);
      } else {
        alert(data.message || 'Error al crear la reserva');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  // Obtener fecha mínima (hoy)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Obtener fecha máxima (30 días)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  // Formatear fecha para mostrar
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  // Loading
  if (loading) {
    return (
      <div className="public-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <div className="loading-text">Cargando salón...</div>
        </div>
      </div>
    );
  }

  // Error
  if (error || !salon) {
    return (
      <div className="public-page">
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <h3 className="empty-state-title">Salón no encontrado</h3>
          <p className="empty-state-message">{error}</p>
          <Link to="/salones" className="booking-btn" style={{ marginTop: '20px', display: 'inline-block' }}>
            Ver todos los salones
          </Link>
        </div>
      </div>
    );
  }

  // Modal de confirmación
  if (reservaConfirmada) {
    return (
      <div className="public-page">
        <div className="confirmation-modal">
          <div className="confirmation-content">
            <div className="confirmation-icon">✓</div>
            <h2 className="confirmation-title">¡Reserva Confirmada!</h2>
            <p className="confirmation-message">
              Tu cita ha sido reservada correctamente. Guarda tu código de confirmación.
            </p>
            
            <div className="confirmation-code">
              {reservaConfirmada.codigo}
            </div>

            <div className="confirmation-details">
              <div className="confirmation-detail">
                <span>Salón</span>
                <span>{reservaConfirmada.salon}</span>
              </div>
              <div className="confirmation-detail">
                <span>Servicio</span>
                <span>{reservaConfirmada.servicio}</span>
              </div>
              <div className="confirmation-detail">
                <span>Profesional</span>
                <span>{reservaConfirmada.empleado}</span>
              </div>
              <div className="confirmation-detail">
                <span>Fecha</span>
                <span>{formatDate(reservaConfirmada.fecha)}</span>
              </div>
              <div className="confirmation-detail">
                <span>Hora</span>
                <span>{reservaConfirmada.hora}</span>
              </div>
              <div className="confirmation-detail">
                <span>Precio</span>
                <span style={{ color: 'var(--public-success)', fontWeight: '700' }}>
                  {reservaConfirmada.precio}€
                </span>
              </div>
            </div>

            <button 
              className="booking-btn"
              onClick={() => navigate('/salones')}
              style={{ marginBottom: '12px' }}
            >
              Buscar más salones
            </button>
            
            <p className="booking-note">
              Recibirás un email con los detalles de tu cita.
              Presenta el código de confirmación al llegar al salón.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page salon-page">
      {/* Header */}
      <header className="public-header">
        <div className="public-container header-content">
          <Link to="/salones" className="header-logo">
            <span className="header-logo-icon">💈</span>
            <span className="header-logo-text">NEURIAX</span>
          </Link>

          <div className="header-actions">
            <Link to="/salones" className="header-btn header-btn-outline">
              ← Volver
            </Link>
          </div>
        </div>
      </header>

      {/* Hero del Salón */}
      <div className="salon-hero">
        {salon.imagen && salon.imagen !== '/default-salon.jpg' ? (
          <img src={salon.imagen} alt={salon.nombre} className="salon-hero-image" />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, var(--public-primary), var(--public-secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '120px',
            color: 'rgba(255,255,255,0.3)'
          }}>
            💈
          </div>
        )}
        
        <div className="salon-hero-overlay">
          <div className="salon-hero-content">
            <h1 className="salon-hero-title">{salon.nombre}</h1>
            <div className="salon-hero-meta">
              <div className="salon-meta-item">
                <span className="salon-meta-icon">★</span>
                {salon.valoracion?.toFixed(1) || '4.5'} 
                {salon.numResenas > 0 && ` (${salon.numResenas} reseñas)`}
              </div>
              <div className="salon-meta-item">
                <span className="salon-meta-icon">📍</span>
                {salon.direccion || salon.ciudad || 'Ver ubicación'}
              </div>
              <div className="salon-meta-item">
                <span className="salon-meta-icon">📞</span>
                {salon.telefono || 'Ver teléfono'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="public-container">
        <div className="salon-content">
          {/* Columna Principal */}
          <div className="salon-main">
            {/* Descripción */}
            <section className="salon-section">
              <h2 className="salon-section-title">
                <div className="salon-section-icon">ℹ️</div>
                Sobre nosotros
              </h2>
              <p className="salon-description">
                {salon.descripcion || 'Bienvenido a nuestro salón. Ofrecemos servicios de peluquería y estética de alta calidad con profesionales experimentados.'}
              </p>
            </section>

            {/* Servicios */}
            <section className="salon-section">
              <h2 className="salon-section-title">
                <div className="salon-section-icon">✂️</div>
                Nuestros Servicios
              </h2>
              <div className="services-list">
                {salon.servicios?.length > 0 ? (
                  salon.servicios.map((servicio) => (
                    <div
                      key={servicio.id}
                      className={`service-item ${selectedService?.id === servicio.id ? 'selected' : ''}`}
                      onClick={() => handleSelectService(servicio)}
                    >
                      <div className="service-info">
                        <div className="service-icon">
                          {getServiceIcon(servicio.categoria)}
                        </div>
                        <div className="service-details">
                          <h4>{servicio.nombre}</h4>
                          <p>{servicio.descripcion || `Servicio de ${servicio.categoria || 'peluquería'}`}</p>
                        </div>
                      </div>
                      <div className="service-meta">
                        <div className="service-price">{servicio.precio}€</div>
                        <div className="service-duration">{servicio.duracion} min</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--public-text-secondary)' }}>
                    No hay servicios disponibles
                  </p>
                )}
              </div>
            </section>

            {/* Equipo */}
            {salon.empleados?.length > 0 && (
              <section className="salon-section">
                <h2 className="salon-section-title">
                  <div className="salon-section-icon">👥</div>
                  Nuestro Equipo
                </h2>
                <div className="employees-grid">
                  {salon.empleados.map((empleado) => (
                    <div
                      key={empleado.id}
                      className={`employee-card ${selectedEmployee?.id === empleado.id ? 'selected' : ''}`}
                      onClick={() => selectedService && handleSelectEmployee(empleado)}
                      style={{ opacity: selectedService ? 1 : 0.6 }}
                    >
                      <div className="employee-avatar">
                        {empleado.foto ? (
                          <img src={empleado.foto} alt={empleado.nombre} />
                        ) : (
                          getInitials(empleado.nombre)
                        )}
                      </div>
                      <div className="employee-name">{empleado.nombre}</div>
                      <div className="employee-specialty">{empleado.especialidad}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Horario */}
            <section className="salon-section">
              <h2 className="salon-section-title">
                <div className="salon-section-icon">🕐</div>
                Horario
              </h2>
              <div className="schedule-grid">
                {Object.entries(salon.horario || {}).map(([dia, horario]) => (
                  <div 
                    key={dia} 
                    className={`schedule-day ${!horario.abierto ? 'closed' : ''}`}
                  >
                    <span className="schedule-day-name">
                      {dia.charAt(0).toUpperCase() + dia.slice(1)}
                    </span>
                    <span className="schedule-day-hours">
                      {horario.abierto 
                        ? `${horario.apertura} - ${horario.cierre}`
                        : 'Cerrado'
                      }
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar de Reserva */}
          <aside className="booking-sidebar">
            <div className="booking-card">
              <h3 className="booking-title">Reservar Cita</h3>

              {/* Steps */}
              <div className="booking-steps">
                <div className={`booking-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                  <div className="booking-step-number">{step > 1 ? '✓' : '1'}</div>
                  <span className="booking-step-label">Servicio</span>
                </div>
                <div className={`booking-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                  <div className="booking-step-number">{step > 2 ? '✓' : '2'}</div>
                  <span className="booking-step-label">Profesional</span>
                </div>
                <div className={`booking-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                  <div className="booking-step-number">{step > 3 ? '✓' : '3'}</div>
                  <span className="booking-step-label">Fecha</span>
                </div>
                <div className={`booking-step ${step >= 4 ? 'active' : ''}`}>
                  <div className="booking-step-number">4</div>
                  <span className="booking-step-label">Datos</span>
                </div>
              </div>

              <div className="booking-form">
                {/* Step 1: Servicio seleccionado */}
                {selectedService && (
                  <div className="booking-summary">
                    <div className="booking-summary-row">
                      <span>Servicio</span>
                      <span>{selectedService.nombre}</span>
                    </div>
                    {selectedEmployee && (
                      <div className="booking-summary-row">
                        <span>Profesional</span>
                        <span>{selectedEmployee.nombre}</span>
                      </div>
                    )}
                    {selectedDate && (
                      <div className="booking-summary-row">
                        <span>Fecha</span>
                        <span>{formatDate(selectedDate)}</span>
                      </div>
                    )}
                    {selectedTime && (
                      <div className="booking-summary-row">
                        <span>Hora</span>
                        <span>{selectedTime}</span>
                      </div>
                    )}
                    <div className="booking-summary-row total">
                      <span>Total</span>
                      <span>{selectedService.precio}€</span>
                    </div>
                  </div>
                )}

                {/* Step 2: Seleccionar empleado */}
                {step === 2 && (
                  <>
                    <p style={{ color: 'var(--public-text-secondary)', fontSize: '14px', textAlign: 'center' }}>
                      Selecciona un profesional o continúa sin preferencia
                    </p>
                    <button 
                      className="booking-btn"
                      onClick={skipEmployeeSelection}
                      style={{ background: 'var(--public-bg-elevated)' }}
                    >
                      Cualquier profesional disponible
                    </button>
                  </>
                )}

                {/* Step 3: Fecha y hora */}
                {step === 3 && (
                  <div className="booking-date-picker">
                    <label style={{ fontSize: '14px', marginBottom: '4px' }}>
                      Selecciona una fecha:
                    </label>
                    <input
                      type="date"
                      className="booking-date-input"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedTime('');
                      }}
                      min={getMinDate()}
                      max={getMaxDate()}
                    />

                    {selectedDate && (
                      <>
                        <label style={{ fontSize: '14px', marginTop: '16px', marginBottom: '4px' }}>
                          Horarios disponibles:
                        </label>
                        {loadingSlots ? (
                          <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div className="loading-spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }}></div>
                          </div>
                        ) : disponibilidad.length > 0 ? (
                          <div className="time-slots">
                            {disponibilidad.map((slot) => (
                              <div
                                key={slot.hora}
                                className={`time-slot ${selectedTime === slot.hora ? 'selected' : ''}`}
                                onClick={() => handleSelectTime(slot.hora)}
                              >
                                {slot.hora}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: 'var(--public-text-secondary)', textAlign: 'center', padding: '20px' }}>
                            No hay horarios disponibles para esta fecha
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Step 4: Datos del cliente */}
                {step === 4 && (
                  <form onSubmit={handleSubmitReserva}>
                    <input
                      type="text"
                      className="booking-input"
                      placeholder="Tu nombre *"
                      value={clientData.nombre}
                      onChange={(e) => setClientData({ ...clientData, nombre: e.target.value })}
                      required
                    />
                    <input
                      type="tel"
                      className="booking-input"
                      placeholder="Tu teléfono *"
                      value={clientData.telefono}
                      onChange={(e) => setClientData({ ...clientData, telefono: e.target.value })}
                      required
                      style={{ marginTop: '12px' }}
                    />
                    <input
                      type="email"
                      className="booking-input"
                      placeholder="Tu email (opcional)"
                      value={clientData.email}
                      onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                      style={{ marginTop: '12px' }}
                    />
                    <textarea
                      className="booking-input"
                      placeholder="Notas adicionales (opcional)"
                      value={clientData.notas}
                      onChange={(e) => setClientData({ ...clientData, notas: e.target.value })}
                      rows={3}
                      style={{ marginTop: '12px', resize: 'none' }}
                    />
                    
                    <button
                      type="submit"
                      className="booking-btn"
                      disabled={submitting || !clientData.nombre || !clientData.telefono}
                      style={{ marginTop: '20px' }}
                    >
                      {submitting ? 'Reservando...' : `Confirmar Reserva - ${selectedService?.precio}€`}
                    </button>
                  </form>
                )}

                {/* Mensaje inicial */}
                {!selectedService && (
                  <p style={{ 
                    color: 'var(--public-text-secondary)', 
                    textAlign: 'center',
                    fontSize: '14px'
                  }}>
                    👆 Selecciona un servicio para comenzar
                  </p>
                )}

                <p className="booking-note">
                  {salon.politicaCancelacion || 'Cancelación gratuita hasta 24 horas antes.'}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// Helpers
function getServiceIcon(categoria) {
  const iconos = {
    'Corte': '✂️',
    'Color': '🎨',
    'Peinado': '💇',
    'Manicura': '💅',
    'Barba': '🧔',
    'Tratamiento': '✨',
    'Maquillaje': '💄',
    'Depilación': '🌸',
    'Masaje': '💆',
    'General': '💈'
  };
  return iconos[categoria] || '💈';
}

function getInitials(nombre) {
  return nombre
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
