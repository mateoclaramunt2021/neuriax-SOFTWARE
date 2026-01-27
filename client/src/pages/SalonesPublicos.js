/**
 * Marketplace de Salones - Página Principal Pública
 * Lista todos los salones disponibles para reservar
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/reservas-publicas.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function SalonesPublicos() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [salones, setSalones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ciudades, setCiudades] = useState([]);
  
  // Filtros
  const [busqueda, setBusqueda] = useState(searchParams.get('q') || '');
  const [ciudad, setCiudad] = useState(searchParams.get('ciudad') || '');
  const [orden, setOrden] = useState(searchParams.get('orden') || 'destacados');

  // Cargar salones
  useEffect(() => {
    const cargarSalones = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (busqueda) params.append('busqueda', busqueda);
        if (ciudad) params.append('ciudad', ciudad);
        if (orden) params.append('orden', orden);

        const res = await fetch(`${API_URL}/api/public/salones?${params}`);
        const data = await res.json();

        if (data.success) {
          setSalones(data.salones);
        } else {
          setError(data.message || 'Error al cargar salones');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    cargarSalones();
  }, [busqueda, ciudad, orden]);

  // Cargar ciudades
  useEffect(() => {
    const cargarCiudades = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/ciudades`);
        const data = await res.json();
        if (data.success) {
          setCiudades(data.ciudades);
        }
      } catch (err) {
        console.error('Error cargando ciudades:', err);
      }
    };
    cargarCiudades();
  }, []);

  // Buscar
  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (busqueda) params.set('q', busqueda);
    if (ciudad) params.set('ciudad', ciudad);
    if (orden) params.set('orden', orden);
    setSearchParams(params);
  };

  // Ir a salón
  const irASalon = (salonId) => {
    navigate(`/salon/${salonId}`);
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

          <form className="header-search" onSubmit={handleSearch}>
            <span className="header-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar salón, servicio, ciudad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </form>

          <div className="header-actions">
            <Link to="/mis-reservas" className="header-btn header-btn-outline">
              Mis Reservas
            </Link>
            <Link to="/" className="header-btn header-btn-primary">
              Soy Profesional
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="public-hero">
        <div className="public-container">
          <h1 className="hero-title">Encuentra tu Salón de Belleza</h1>
          <p className="hero-subtitle">
            Reserva cita en los mejores salones de tu ciudad. 
            Compara precios, servicios y opiniones.
          </p>

          <form className="hero-search" onSubmit={handleSearch}>
            <input
              type="text"
              className="hero-search-input"
              placeholder="¿Qué servicio buscas? Corte, color, manicura..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <button type="submit" className="hero-search-btn">
              Buscar
            </button>
          </form>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">{salones.length}+</div>
              <div className="hero-stat-label">Salones</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">
                {salones.reduce((acc, s) => acc + (s.serviciosCount || 0), 0)}+
              </div>
              <div className="hero-stat-label">Servicios</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">4.8</div>
              <div className="hero-stat-label">Valoración Media</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section className="filters-section">
        <div className="public-container filters-container">
          <div 
            className={`filter-chip ${!ciudad ? 'active' : ''}`}
            onClick={() => setCiudad('')}
          >
            <span className="filter-chip-icon">📍</span>
            Todas las ciudades
          </div>
          
          {ciudades.slice(0, 5).map((c) => (
            <div
              key={c}
              className={`filter-chip ${ciudad === c ? 'active' : ''}`}
              onClick={() => setCiudad(c)}
            >
              {c}
            </div>
          ))}

          <select
            className="filter-select"
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
          >
            <option value="destacados">Destacados</option>
            <option value="valoracion">Mejor valorados</option>
            <option value="precio">Menor precio</option>
            <option value="nombre">Nombre A-Z</option>
          </select>
        </div>
      </section>

      {/* Grid de Salones */}
      <section className="salones-section">
        <div className="public-container">
          <div className="salones-header">
            <h2 className="salones-title">Salones Disponibles</h2>
            <span className="salones-count">
              {salones.length} {salones.length === 1 ? 'salón' : 'salones'} encontrados
            </span>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <div className="loading-text">Cargando salones...</div>
            </div>
          ) : error ? (
            <div className="empty-state">
              <div className="empty-state-icon">❌</div>
              <h3 className="empty-state-title">Error</h3>
              <p className="empty-state-message">{error}</p>
            </div>
          ) : salones.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3 className="empty-state-title">No encontramos salones</h3>
              <p className="empty-state-message">
                Intenta con otra búsqueda o ciudad diferente
              </p>
            </div>
          ) : (
            <div className="salones-grid">
              {salones.map((salon) => (
                <SalonCard 
                  key={salon.id} 
                  salon={salon} 
                  onClick={() => irASalon(salon.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        padding: '40px 0', 
        borderTop: '1px solid var(--public-border)',
        marginTop: '60px'
      }}>
        <div className="public-container" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--public-text-secondary)', fontSize: '14px' }}>
            © 2026 NEURIAX. Todos los derechos reservados.
          </p>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '24px' }}>
            <Link to="/terminos" style={{ color: 'var(--public-text-secondary)', fontSize: '14px' }}>
              Términos y Condiciones
            </Link>
            <Link to="/privacidad" style={{ color: 'var(--public-text-secondary)', fontSize: '14px' }}>
              Política de Privacidad
            </Link>
            <Link to="/" style={{ color: 'var(--public-text-secondary)', fontSize: '14px' }}>
              Área Profesionales
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Componente Card de Salón
function SalonCard({ salon, onClick }) {
  const getIniciales = (nombre) => {
    return nombre
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const categoriaIconos = {
    'Corte': '✂️',
    'Color': '🎨',
    'Peinado': '💇',
    'Manicura': '💅',
    'Barba': '🧔',
    'Tratamiento': '✨',
    'General': '💈'
  };

  return (
    <div className="salon-card" onClick={onClick}>
      <div className="salon-card-image">
        {salon.imagen && salon.imagen !== '/default-salon.jpg' ? (
          <img src={salon.imagen} alt={salon.nombre} />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--public-primary), var(--public-secondary))',
            fontSize: '64px',
            color: 'white'
          }}>
            {getIniciales(salon.nombre)}
          </div>
        )}

        {salon.destacado && (
          <div className="salon-card-badge">⭐ Destacado</div>
        )}

        <div className="salon-card-rating">
          <span className="salon-card-rating-star">★</span>
          {salon.valoracion?.toFixed(1) || '4.5'}
          {salon.numResenas > 0 && (
            <span style={{ opacity: 0.7, marginLeft: '4px' }}>
              ({salon.numResenas})
            </span>
          )}
        </div>
      </div>

      <div className="salon-card-content">
        <h3 className="salon-card-name">{salon.nombre}</h3>
        
        <div className="salon-card-location">
          <span className="salon-card-location-icon">📍</span>
          {salon.ciudad || salon.direccion || 'Sin ubicación'}
        </div>

        <div className="salon-card-services">
          {salon.categorias?.slice(0, 3).map((cat, i) => (
            <span key={i} className="salon-card-service-tag">
              {categoriaIconos[cat] || '💈'} {cat}
            </span>
          ))}
          {!salon.categorias?.length && (
            <>
              <span className="salon-card-service-tag">💈 Peluquería</span>
              <span className="salon-card-service-tag">✂️ Corte</span>
            </>
          )}
        </div>

        <div className="salon-card-footer">
          <div className="salon-card-price">
            Desde <span>{salon.precioMinimo || 15}€</span>
          </div>
          <button className="salon-card-btn" onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}>
            Reservar
          </button>
        </div>
      </div>
    </div>
  );
}
