/**
 * ClientHub - Portal de Búsqueda de Salones
 * Permite a clientes buscar salones y hacer reservas sin necesidad de registro previo
 * © 2026 NEURIAX - Solución Profesional de Gestión de Salones
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/client-hub.css';

export default function ClientHub() {
  const navigate = useNavigate();
  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [busquedaCiudad, setBusquedaCiudad] = useState('');
  const [salones, setSalones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [ciudades, setCiudades] = useState([]);
  const [procesandoBusqueda, setProcesandoBusqueda] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Cargar ciudades disponibles al montar el componente
  useEffect(() => {
    cargarCiudades();
    cargarSalonesInicial();
  }, []);

  const cargarCiudades = async () => {
    try {
      const respuesta = await fetch(`${API_URL}/api/public/ciudades`);
      const datos = await respuesta.json();
      if (datos.success && datos.ciudades && Array.isArray(datos.ciudades)) {
        setCiudades(datos.ciudades.sort());
      }
    } catch (err) {
      console.error('Error al cargar ciudades:', err);
    }
  };

  const cargarSalonesInicial = async () => {
    try {
      setCargando(true);
      const respuesta = await fetch(`${API_URL}/api/public/salones?limite=12`);
      const datos = await respuesta.json();
      if (datos.success && Array.isArray(datos.salones)) {
        setSalones(datos.salones);
      }
    } catch (err) {
      console.error('Error cargando salones iniciales:', err);
    } finally {
      setCargando(false);
    }
  };

  const ejecutarBusqueda = async (e) => {
    e.preventDefault();
    setError('');

    // Validación
    if (!busquedaNombre.trim() && !busquedaCiudad) {
      setError('Por favor, ingresa un nombre de salón o selecciona una ciudad.');
      return;
    }

    try {
      setProcesandoBusqueda(true);
      let url = `${API_URL}/api/public/salones?`;
      
      if (busquedaNombre.trim()) {
        url += `busqueda=${encodeURIComponent(busquedaNombre.trim())}`;
      }
      if (busquedaCiudad) {
        url += (busquedaNombre.trim() ? '&' : '') + `ciudad=${encodeURIComponent(busquedaCiudad)}`;
      }

      const respuesta = await fetch(url);
      const datos = await respuesta.json();

      if (datos.success && Array.isArray(datos.salones)) {
        setSalones(datos.salones);
        if (datos.salones.length === 0) {
          setError('No encontramos salones que coincidan con tu búsqueda. Intenta con otros criterios.');
        }
      } else {
        setError('Error en la búsqueda. Por favor intenta de nuevo.');
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setError('No pudimos conectar con el servidor. Intenta más tarde.');
    } finally {
      setProcesandoBusqueda(false);
    }
  };

  const irADetalles = (salonId) => {
    navigate(`/salon/${salonId}`);
  };

  const limpiarBusqueda = () => {
    setBusquedaNombre('');
    setBusquedaCiudad('');
    setError('');
    cargarSalonesInicial();
  };

  return (
    <div className="client-hub">
      {/* Header */}
      <div className="hub-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Volver a Inicio
        </button>
        <h1>Busca tu Salón Perfecto</h1>
        <p>Descubre salones profesionales cercanos a ti y reserva tu cita en segundos</p>
      </div>

      {/* Sección de Búsqueda */}
      <div className="search-section">
        <form onSubmit={ejecutarBusqueda} className="search-form">
          <div className="search-group">
            <input
              type="text"
              className="search-input"
              placeholder="¿Qué servicio buscas? (p.ej: corte, peinado...)"
              value={busquedaNombre}
              onChange={(e) => setBusquedaNombre(e.target.value)}
            />
          </div>

          <div className="search-group">
            <select
              className="search-select"
              value={busquedaCiudad}
              onChange={(e) => setBusquedaCiudad(e.target.value)}
            >
              <option value="">Selecciona tu ciudad</option>
              {ciudades.map((ciudad) => (
                <option key={ciudad} value={ciudad}>
                  {ciudad}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="search-button"
            disabled={procesandoBusqueda}
          >
            {procesandoBusqueda ? 'Buscando...' : '🔍 Buscar'}
          </button>
        </form>

        {error && <div className="search-error">{error}</div>}
      </div>

      {/* Sección de Resultados */}
      <div className="results-section">
        {cargando && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando salones destacados...</p>
          </div>
        )}

        {!cargando && salones.length > 0 && (
          <>
            <div className="salones-header">
              <h2>
                {procesandoBusqueda || (busquedaNombre || busquedaCiudad)
                  ? `Se encontraron ${salones.length} salones`
                  : 'Salones Recomendados'}
              </h2>
              {(busquedaNombre || busquedaCiudad) && (
                <button onClick={limpiarBusqueda} className="btn-limpiar">
                  Limpiar Filtros
                </button>
              )}
            </div>
            <div className="salones-grid">
              {salones.map((salon) => (
                <div key={salon.id} className="salon-card">
                  <div className="salon-header">
                    <h3>{salon.nombre || 'Salón Sin Nombre'}</h3>
                    {salon.calificacion && (
                      <div className="rating">
                        <span className="stars">
                          {'⭐'.repeat(Math.floor(salon.calificacion))}
                        </span>
                        <span className="rating-value">
                          {salon.calificacion.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {salon.descripcion && (
                    <p className="salon-description">{salon.descripcion}</p>
                  )}

                  <div className="salon-info">
                    {salon.ciudad && (
                      <div className="info-item">
                        <span className="icon">📍</span>
                        <span>{salon.ciudad}</span>
                      </div>
                    )}
                    {salon.telefono && (
                      <div className="info-item">
                        <span className="icon">📱</span>
                        <a href={`tel:${salon.telefono}`} className="info-link">
                          {salon.telefono}
                        </a>
                      </div>
                    )}
                    {salon.email && (
                      <div className="info-item">
                        <span className="icon">✉️</span>
                        <a href={`mailto:${salon.email}`} className="info-link">
                          {salon.email}
                        </a>
                      </div>
                    )}
                    {salon.servicios && (
                      <div className="info-item">
                        <span className="icon">✨</span>
                        <span>{salon.servicios.length || 0} servicios disponibles</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => irADetalles(salon.id)}
                    className="btn-reservar"
                  >
                    Ver Detalles y Reservar
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {!cargando && salones.length === 0 && !error && (
          <div className="no-results">
            <p className="no-results-icon">🔍</p>
            <p>No hay salones disponibles en este momento.</p>
            <p className="no-results-hint">Intenta con otros criterios de búsqueda.</p>
          </div>
        )}
      </div>

      {/* Sección Informativa */}
      <div className="hub-info">
        <div className="info-container">
          <h2>¿Cómo Funciona?</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h4>Busca</h4>
              <p>Encuentra salones según tu ciudad o el servicio que necesitas</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h4>Selecciona</h4>
              <p>Elige el salón que te guste viendo sus servicios y reseñas</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h4>Registra</h4>
              <p>Crea tu cuenta en segundos (o usa tu red social)</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h4>Reserva</h4>
              <p>Elige tu fecha y hora, ¡y listo! Confirmaremos tu cita</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="hub-cta">
        <div className="cta-content">
          <h3>¿Eres un Salón Profesional?</h3>
          <p>Únete a nuestra plataforma y gestiona tus reservas de forma profesional</p>
          <button onClick={() => navigate('/register')} className="btn-cta">
            Registra tu Salón Ahora
          </button>
        </div>
      </div>
    </div>
  );
}
