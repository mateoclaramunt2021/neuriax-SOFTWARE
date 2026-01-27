/**
 * MarketplaceProfileModule - Gestión del Perfil en Marketplace
 * Permite que las empresas editen su información pública
 * © 2026 NEURIAX
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/marketplace-profile-module.css';

export default function MarketplaceProfileModule() {
  const { usuario } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [imagenesPrevias, setImagenesPrevias] = useState([]);
  const [imagenesNuevas, setImagenesNuevas] = useState([]);
  const [previewNuevas, setPreviewNuevas] = useState([]);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    ciudad: '',
    telefono: '',
    email: '',
    website: '',
    mostrarEnMarketplace: true,
    horarios: {
      lunes: { abierto: true, apertura: '09:00', cierre: '20:00' },
      martes: { abierto: true, apertura: '09:00', cierre: '20:00' },
      miercoles: { abierto: true, apertura: '09:00', cierre: '20:00' },
      jueves: { abierto: true, apertura: '09:00', cierre: '20:00' },
      viernes: { abierto: true, apertura: '09:00', cierre: '20:00' },
      sabado: { abierto: true, apertura: '09:00', cierre: '14:00' },
      domingo: { abierto: false }
    }
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Cargar datos iniciales
  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      setCargando(true);
      const response = await fetch(`${API_URL}/api/salon/marketplace-perfil`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setFormData(prev => ({
          ...prev,
          nombre: data.salon.nombre || '',
          descripcion: data.salon.descripcion || '',
          ciudad: data.salon.ciudad || '',
          telefono: data.salon.telefono || '',
          email: data.salon.email || '',
          website: data.salon.website || '',
          mostrarEnMarketplace: data.salon.mostrarEnMarketplace !== false,
          horarios: data.salon.horarios || prev.horarios
        }));

        setImagenesPrevias(data.salon.imagenes || []);
      }
    } catch (err) {
      console.error('Error cargando perfil:', err);
      setError('Error al cargar el perfil');
    } finally {
      setCargando(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
    setExito('');
  };

  const handleHorarioChange = (dia, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [dia]: {
          ...prev.horarios[dia],
          [campo]: valor
        }
      }
    }));
  };

  const manejarImagenes = (e) => {
    const archivos = Array.from(e.target.files);

    if (archivos.length + imagenesNuevas.length > 5) {
      setError('Máximo 5 imágenes totales permitidas');
      return;
    }

    const nuevasImagenes = [];
    const previews = [];

    archivos.forEach((archivo) => {
      if (!archivo.type.startsWith('image/')) {
        setError('Solo se permiten imágenes');
        return;
      }

      if (archivo.size > 5 * 1024 * 1024) {
        setError('Las imágenes no pueden superar 5 MB');
        return;
      }

      nuevasImagenes.push(archivo);

      const lector = new FileReader();
      lector.onload = (evento) => {
        previews.push(evento.target.result);
        if (previews.length === archivos.length) {
          setImagenesNuevas([...imagenesNuevas, ...nuevasImagenes]);
          setPreviewNuevas([...previewNuevas, ...previews]);
        }
      };
      lector.readAsDataURL(archivo);
    });

    setError('');
  };

  const removerImagenNueva = (indice) => {
    setImagenesNuevas(imagenesNuevas.filter((_, i) => i !== indice));
    setPreviewNuevas(previewNuevas.filter((_, i) => i !== indice));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      setError('El nombre del salón es obligatorio');
      return;
    }

    if (!formData.descripcion.trim()) {
      setError('La descripción es obligatoria');
      return;
    }

    setGuardando(true);

    try {
      const formDataEnvio = new FormData();
      formDataEnvio.append('nombre', formData.nombre.trim());
      formDataEnvio.append('descripcion', formData.descripcion.trim());
      formDataEnvio.append('ciudad', formData.ciudad.trim());
      formDataEnvio.append('telefono', formData.telefono.trim());
      formDataEnvio.append('email', formData.email.trim());
      formDataEnvio.append('website', formData.website.trim());
      formDataEnvio.append('mostrarEnMarketplace', formData.mostrarEnMarketplace);
      formDataEnvio.append('horarios', JSON.stringify(formData.horarios));

      // Agregar imágenes nuevas
      imagenesNuevas.forEach((imagen) => {
        formDataEnvio.append('imagenes', imagen);
      });

      const response = await fetch(`${API_URL}/api/salon/marketplace-perfil`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataEnvio
      });

      const data = await response.json();

      if (data.success) {
        setExito('✅ Perfil actualizado correctamente');
        setImagenesNuevas([]);
        setPreviewNuevas([]);
        
        // Recargar datos
        setTimeout(() => {
          cargarPerfil();
        }, 1500);
      } else {
        setError(data.message || 'Error al guardar cambios');
      }
    } catch (err) {
      console.error('Error guardando perfil:', err);
      setError('Error al guardar cambios');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="module-container marketplace-profile">
        <div className="module-loading">
          <div className="spinner"></div>
          <p>Cargando perfil del marketplace...</p>
        </div>
      </div>
    );
  }

  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <div className="module-container marketplace-profile">
      <div className="module-header">
        <h2>🏪 Mi Perfil en Marketplace</h2>
        <p>Edita cómo aparece tu salón en el marketplace público</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {exito && <div className="alert alert-success">{exito}</div>}

      <form onSubmit={handleSubmit} className="marketplace-form">
        {/* SECCIÓN 1: Información Básica */}
        <div className="form-section">
          <h3>📋 Información Básica</h3>

          <div className="form-group">
            <label htmlFor="nombre">Nombre del Salón *</label>
            <input
              id="nombre"
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Tu salón de belleza"
              disabled={guardando}
            />
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción *</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder="Cuéntale a tus clientes sobre tu salón, especialidades, ambiente..."
              rows="4"
              disabled={guardando}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ciudad">Ciudad</label>
              <input
                id="ciudad"
                type="text"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleInputChange}
                placeholder="Tu ciudad"
                disabled={guardando}
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
                placeholder="+34 600 123 456"
                disabled={guardando}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="tu@email.com"
                disabled={guardando}
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">Sitio Web</label>
              <input
                id="website"
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://tusalon.com"
                disabled={guardando}
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Visibilidad en Marketplace */}
        <div className="form-section">
          <h3>👁️ Visibilidad en Marketplace</h3>
          
          <div className="toggle-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                name="mostrarEnMarketplace"
                checked={formData.mostrarEnMarketplace}
                onChange={handleInputChange}
                disabled={guardando}
              />
              <span className="toggle-text">
                {formData.mostrarEnMarketplace 
                  ? '✅ Mostrar mi salón en el marketplace' 
                  : '❌ Ocultar mi salón del marketplace'}
              </span>
            </label>
            <p className="toggle-info">
              {formData.mostrarEnMarketplace
                ? 'Tu salón es visible para clientes que buscan en el marketplace'
                : 'Tu salón no aparecerá en el marketplace público'}
            </p>
          </div>
        </div>

        {/* SECCIÓN 3: Horarios de Atención */}
        <div className="form-section">
          <h3>⏰ Horarios de Atención</h3>

          <div className="horarios-grid">
            {dias.map((dia, idx) => (
              <div key={dia} className="horario-item">
                <label className="horario-dia">{diasNombres[idx]}</label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.horarios[dia].abierto}
                    onChange={(e) => handleHorarioChange(dia, 'abierto', e.target.checked)}
                    disabled={guardando}
                  />
                  <span>Abierto</span>
                </label>

                {formData.horarios[dia].abierto && (
                  <div className="horario-inputs">
                    <input
                      type="time"
                      value={formData.horarios[dia].apertura}
                      onChange={(e) => handleHorarioChange(dia, 'apertura', e.target.value)}
                      disabled={guardando}
                    />
                    <span>-</span>
                    <input
                      type="time"
                      value={formData.horarios[dia].cierre}
                      onChange={(e) => handleHorarioChange(dia, 'cierre', e.target.value)}
                      disabled={guardando}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SECCIÓN 4: Galería de Imágenes */}
        <div className="form-section">
          <h3>🖼️ Galería de Imágenes</h3>

          {imagenesPrevias.length > 0 && (
            <div className="imagenes-container">
              <h4>Imágenes Actuales ({imagenesPrevias.length})</h4>
              <div className="imagenes-grid">
                {imagenesPrevias.map((img, idx) => (
                  <div key={idx} className="imagen-card">
                    <img src={img} alt={`Imagen ${idx + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="imagenes">Agregar Nuevas Imágenes</label>
            <div className="file-input-wrapper">
              <input
                id="imagenes"
                type="file"
                multiple
                accept="image/*"
                onChange={manejarImagenes}
                disabled={guardando}
              />
              <span>Seleccionar imágenes (máximo 5 total)</span>
            </div>
          </div>

          {previewNuevas.length > 0 && (
            <div className="imagenes-container">
              <h4>Nuevas Imágenes ({previewNuevas.length})</h4>
              <div className="imagenes-grid">
                {previewNuevas.map((preview, idx) => (
                  <div key={idx} className="imagen-card">
                    <img src={preview} alt={`Preview ${idx + 1}`} />
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removerImagenNueva(idx)}
                      disabled={guardando}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : '💾 Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
