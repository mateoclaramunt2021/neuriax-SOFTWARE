/**
 * Página para Consultar Reservas
 * Permite a los clientes ver y cancelar sus reservas
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/reservas-publicas.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function MisReservas() {
  const [codigo, setCodigo] = useState('');
  const [reserva, setReserva] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancelando, setCancelando] = useState(false);
  const [cancelada, setCancelada] = useState(false);

  // Buscar reserva
  const buscarReserva = async (e) => {
    e.preventDefault();
    
    if (!codigo.trim()) {
      setError('Introduce tu código de confirmación');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setReserva(null);
      setCancelada(false);

      const res = await fetch(`${API_URL}/api/public/reservas/${codigo.trim().toUpperCase()}`);
      const data = await res.json();

      if (data.success) {
        setReserva(data.reserva);
      } else {
        setError(data.message || 'Reserva no encontrada');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Cancelar reserva
  const cancelarReserva = async () => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
      return;
    }

    try {
      setCancelando(true);

      const res = await fetch(`${API_URL}/api/public/reservas/${codigo}/cancelar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: 'Cancelado por el cliente' })
      });

      const data = await res.json();

      if (data.success) {
        setCancelada(true);
        setReserva(prev => ({ ...prev, estado: 'cancelada' }));
      } else {
        alert(data.message || 'No se pudo cancelar la reserva');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error de conexión');
    } finally {
      setCancelando(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Estado badge
  const getEstadoBadge = (estado) => {
    const estados = {
      'pendiente': { label: 'Pendiente', color: '#f59e0b' },
      'confirmada': { label: 'Confirmada', color: '#10b981' },
      'completada': { label: 'Completada', color: '#8b5cf6' },
      'cancelada': { label: 'Cancelada', color: '#ef4444' },
      'no_asistio': { label: 'No asistió', color: '#6b7280' }
    };
    const config = estados[estado] || estados.pendiente;
    return (
      <span style={{
        background: config.color,
        color: 'white',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="public-page">
      {/* Header */}
      <header className="public-header">
        <div className="public-container header-content">
          <Link to="/salones" className="header-logo">
            <span className="header-logo-icon">💈</span>
            <span className="header-logo-text">NEURIAX</span>
          </Link>

          <div className="header-actions">
            <Link to="/salones" className="header-btn header-btn-outline">
              Buscar Salones
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="public-container" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: '800', 
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            Mis Reservas
          </h1>
          
          <p style={{ 
            color: 'var(--public-text-secondary)', 
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            Introduce tu código de confirmación para ver los detalles de tu reserva
          </p>

          {/* Formulario de búsqueda */}
          <form onSubmit={buscarReserva} style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                className="booking-input"
                placeholder="Código de confirmación (ej: ABC12345)"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                style={{ 
                  flex: 1,
                  fontSize: '18px',
                  letterSpacing: '2px',
                  textAlign: 'center'
                }}
                maxLength={10}
              />
              <button 
                type="submit" 
                className="booking-btn"
                disabled={loading}
                style={{ whiteSpace: 'nowrap' }}
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            
            {error && (
              <p style={{ 
                color: 'var(--public-error)', 
                textAlign: 'center',
                marginTop: '16px',
                fontSize: '14px'
              }}>
                {error}
              </p>
            )}
          </form>

          {/* Resultado */}
          {reserva && (
            <div className="salon-section" style={{ animation: 'slideUp 0.3s ease' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700' }}>
                  Detalles de la Reserva
                </h2>
                {getEstadoBadge(reserva.estado)}
              </div>

              {cancelada && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--public-error)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  <p style={{ color: 'var(--public-error)', fontWeight: '600' }}>
                    ✓ Reserva cancelada correctamente
                  </p>
                </div>
              )}

              <div className="confirmation-details" style={{ marginBottom: '24px' }}>
                <div className="confirmation-detail">
                  <span>Código</span>
                  <span style={{ fontWeight: '700', letterSpacing: '2px' }}>
                    {reserva.codigo}
                  </span>
                </div>
                <div className="confirmation-detail">
                  <span>Salón</span>
                  <span>{reserva.salon}</span>
                </div>
                {reserva.salonDireccion && (
                  <div className="confirmation-detail">
                    <span>Dirección</span>
                    <span>{reserva.salonDireccion}</span>
                  </div>
                )}
                {reserva.salonTelefono && (
                  <div className="confirmation-detail">
                    <span>Teléfono</span>
                    <span>{reserva.salonTelefono}</span>
                  </div>
                )}
                <div className="confirmation-detail">
                  <span>Servicio</span>
                  <span>{reserva.servicio}</span>
                </div>
                <div className="confirmation-detail">
                  <span>Profesional</span>
                  <span>{reserva.empleado}</span>
                </div>
                <div className="confirmation-detail">
                  <span>Fecha</span>
                  <span style={{ fontWeight: '600' }}>{formatDate(reserva.fecha)}</span>
                </div>
                <div className="confirmation-detail">
                  <span>Hora</span>
                  <span style={{ fontWeight: '600' }}>{reserva.hora}</span>
                </div>
                <div className="confirmation-detail">
                  <span>Duración</span>
                  <span>{reserva.duracion} minutos</span>
                </div>
                <div className="confirmation-detail" style={{ 
                  borderTop: '1px solid var(--public-border)',
                  marginTop: '12px',
                  paddingTop: '12px'
                }}>
                  <span style={{ fontWeight: '600' }}>Precio</span>
                  <span style={{ 
                    color: 'var(--public-success)', 
                    fontWeight: '700',
                    fontSize: '20px'
                  }}>
                    {reserva.precio}€
                  </span>
                </div>
              </div>

              {/* Acciones */}
              {reserva.estado === 'pendiente' && !cancelada && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    className="booking-btn"
                    onClick={cancelarReserva}
                    disabled={cancelando}
                    style={{ 
                      flex: 1,
                      background: 'transparent',
                      border: '2px solid var(--public-error)',
                      color: 'var(--public-error)'
                    }}
                  >
                    {cancelando ? 'Cancelando...' : 'Cancelar Reserva'}
                  </button>
                </div>
              )}

              <p className="booking-note" style={{ marginTop: '20px' }}>
                Si necesitas modificar tu reserva, por favor contacta directamente con el salón
                {reserva.salonTelefono && ` al ${reserva.salonTelefono}`}.
              </p>
            </div>
          )}

          {/* Info adicional */}
          <div style={{ 
            marginTop: '60px',
            padding: '24px',
            background: 'var(--public-bg-card)',
            borderRadius: 'var(--public-radius)',
            border: '1px solid var(--public-border)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              ¿No encuentras tu reserva?
            </h3>
            <ul style={{ 
              color: 'var(--public-text-secondary)', 
              fontSize: '14px',
              lineHeight: '1.8',
              paddingLeft: '20px'
            }}>
              <li>Verifica que el código esté escrito correctamente</li>
              <li>El código distingue mayúsculas de minúsculas</li>
              <li>Si has recibido un email de confirmación, el código está ahí</li>
              <li>Contacta con el salón directamente para más ayuda</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ 
        padding: '40px 0', 
        borderTop: '1px solid var(--public-border)',
        marginTop: 'auto'
      }}>
        <div className="public-container" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--public-text-secondary)', fontSize: '14px' }}>
            © 2026 NEURIAX. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
