/**
 * SalonProfileSetup - Configuración del Perfil del Salón
 * Primer paso obligatorio para nuevas empresas en prueba de 7 días
 * Antes de acceder al Dashboard
 * © 2026 NEURIAX - Setup Profesional de Salones
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/salon-profile-setup.css';

export default function SalonProfileSetup() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  // Estados del formulario
  const [nombreSalon, setNombreSalon] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [googleMaps, setGoogleMaps] = useState('');
  const [paginaWeb, setPaginaWeb] = useState('');
  const [imagenes, setImagenes] = useState([]);
  const [previewImagenes, setPreviewImagenes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [generandoIA, setGenerandoIA] = useState(false);
  const [exito, setExito] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Validaciones
  const validarFormulario = () => {
    if (!nombreSalon.trim()) {
      setError('El nombre del salón es obligatorio.');
      return false;
    }
    if (!descripcion.trim()) {
      setError('La descripción es obligatoria. Puedes generarla con IA.');
      return false;
    }
    if (!whatsapp.trim()) {
      setError('El número de WhatsApp es obligatorio.');
      return false;
    }
    if (!paginaWeb.trim()) {
      setError('Tu página web o redes sociales son obligatorias.');
      return false;
    }
    if (imagenes.length === 0) {
      setError('Debes subir al menos una imagen de tu salón.');
      return false;
    }
    return true;
  };

  // Manejar carga de imágenes
  const manejarImagenes = (e) => {
    const archivos = Array.from(e.target.files);
    
    if (archivos.length + imagenes.length > 5) {
      setError('Máximo 5 imágenes. Ya tienes ' + imagenes.length + ' subidas.');
      return;
    }

    const nuevasImagenes = [];
    const previews = [];

    archivos.forEach((archivo) => {
      if (!archivo.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen.');
        return;
      }

      if (archivo.size > 5 * 1024 * 1024) {
        setError('Las imágenes no pueden superar 5 MB.');
        return;
      }

      nuevasImagenes.push(archivo);

      const lector = new FileReader();
      lector.onload = (evento) => {
        previews.push(evento.target.result);
        if (previews.length === archivos.length) {
          setImagenes([...imagenes, ...nuevasImagenes]);
          setPreviewImagenes([...previewImagenes, ...previews]);
        }
      };
      lector.readAsDataURL(archivo);
    });

    setError('');
  };

  // Remover imagen
  const removerImagen = (indice) => {
    setImagenes(imagenes.filter((_, i) => i !== indice));
    setPreviewImagenes(previewImagenes.filter((_, i) => i !== indice));
  };

  // Generar descripción con IA
  const generarDescripcionIA = async () => {
    if (!nombreSalon.trim()) {
      setError('Primero ingresa el nombre de tu salón.');
      return;
    }

    try {
      setGenerandoIA(true);
      setError('');

      const respuesta = await fetch(`${API_URL}/api/salon/generar-descripcion-ia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          nombreSalon: nombreSalon.trim(),
          tipo: 'peluqueria' // o puede ser flexible
        })
      });

      const datos = await respuesta.json();

      if (datos.success) {
        setDescripcion(datos.descripcion);
        setError('');
      } else {
        setError(datos.message || 'Error al generar descripción.');
      }
    } catch (err) {
      console.error('Error generando descripción IA:', err);
      setError('Error al conectar con el servicio de IA. Intenta escribir manualmente.');
    } finally {
      setGenerandoIA(false);
    }
  };

  // Guardar configuración del salón
  const guardarConfiguracion = async (e) => {
    e.preventDefault();
    setError('');

    if (!validarFormulario()) {
      return;
    }

    try {
      setCargando(true);

      // Crear FormData para enviar archivos
      const formData = new FormData();
      formData.append('nombreSalon', nombreSalon.trim());
      formData.append('descripcion', descripcion.trim());
      formData.append('whatsapp', whatsapp.trim());
      formData.append('googleMaps', googleMaps.trim());
      formData.append('paginaWeb', paginaWeb.trim());

      // Agregar imágenes
      imagenes.forEach((imagen, indice) => {
        formData.append('imagenes', imagen);
      });

      const respuesta = await fetch(`${API_URL}/api/salon/configurar-perfil`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const datos = await respuesta.json();

      if (datos.success) {
        setExito(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(datos.message || 'Error al guardar configuración.');
      }
    } catch (err) {
      console.error('Error guardando configuración:', err);
      setError('Error al guardar. Por favor intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  if (exito) {
    return (
      <div className="setup-container">
        <div className="setup-exito">
          <div className="exito-icon">✅</div>
          <h2>¡Configuración Completada!</h2>
          <p>Tu perfil de salón está listo. Redirigiendo al dashboard...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-container">
      <div className="setup-card">
        {/* Header */}
        <div className="setup-header">
          <h1>Configura tu Perfil de Salón</h1>
          <p>Completa este paso para que tus clientes puedan encontrarte y reservar</p>
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={guardarConfiguracion} className="setup-form">
          {/* Nombre del Salón */}
          <div className="form-section">
            <label htmlFor="nombreSalon" className="form-label">
              📝 Nombre de tu Salón
              <span className="required">*</span>
            </label>
            <input
              id="nombreSalon"
              type="text"
              className="form-input"
              placeholder="Ej: Peluquería Premium, Salón de Belleza María..."
              value={nombreSalon}
              onChange={(e) => setNombreSalon(e.target.value)}
              disabled={cargando}
            />
          </div>

          {/* Descripción */}
          <div className="form-section">
            <label htmlFor="descripcion" className="form-label">
              ✨ Descripción de tu Salón
              <span className="required">*</span>
            </label>
            <textarea
              id="descripcion"
              className="form-textarea"
              placeholder="Cuéntanos sobre tu salón, especialidades, ambiente..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={cargando}
              rows="4"
            />
            <button
              type="button"
              className="btn-generar-ia"
              onClick={generarDescripcionIA}
              disabled={generandoIA || cargando || !nombreSalon.trim()}
            >
              {generandoIA ? '🤖 Generando...' : '🤖 Generar con IA'}
            </button>
          </div>

          {/* WhatsApp */}
          <div className="form-section">
            <label htmlFor="whatsapp" className="form-label">
              💬 WhatsApp
              <span className="required">*</span>
            </label>
            <input
              id="whatsapp"
              type="tel"
              className="form-input"
              placeholder="+34 600 123 456 (con código de país)"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              disabled={cargando}
            />
            <p className="form-hint">Tus clientes podrán contactarte directamente</p>
          </div>

          {/* Google Maps */}
          <div className="form-section">
            <label htmlFor="googleMaps" className="form-label">
              📍 Google Maps
              <span className="optional">(Opcional)</span>
            </label>
            <input
              id="googleMaps"
              type="url"
              className="form-input"
              placeholder="https://maps.google.com/... (enlace de tu ubicación)"
              value={googleMaps}
              onChange={(e) => setGoogleMaps(e.target.value)}
              disabled={cargando}
            />
            <p className="form-hint">Facilita a tus clientes encontrar tu ubicación</p>
          </div>

          {/* Página Web / Redes Sociales */}
          <div className="form-section">
            <label htmlFor="paginaWeb" className="form-label">
              🌐 Página Web o Redes Sociales
              <span className="required">*</span>
            </label>
            <input
              id="paginaWeb"
              type="url"
              className="form-input"
              placeholder="https://www.tusalon.com o tu Instagram/Facebook"
              value={paginaWeb}
              onChange={(e) => setPaginaWeb(e.target.value)}
              disabled={cargando}
            />
            <p className="form-hint">URL donde tus clientes pueden conocer más de ti</p>
          </div>

          {/* Imágenes */}
          <div className="form-section">
            <label htmlFor="imagenes" className="form-label">
              📸 Imágenes de tu Salón
              <span className="required">*</span>
            </label>
            <div className="image-upload">
              <input
                id="imagenes"
                type="file"
                multiple
                accept="image/*"
                className="form-file-input"
                onChange={manejarImagenes}
                disabled={cargando || imagenes.length >= 5}
              />
              <div className="upload-area">
                <span className="upload-icon">📷</span>
                <p>Arrastra imágenes aquí o haz clic para seleccionar</p>
                <span className="upload-limit">
                  Máximo 5 imágenes (5 MB cada una)
                </span>
                <span className="upload-count">
                  {imagenes.length}/5 subidas
                </span>
              </div>
            </div>

            {/* Vista previa de imágenes */}
            {previewImagenes.length > 0 && (
              <div className="image-preview-container">
                <h4>Tus Imágenes:</h4>
                <div className="image-preview-grid">
                  {previewImagenes.map((preview, indice) => (
                    <div key={indice} className="image-preview-item">
                      <img src={preview} alt={`Preview ${indice + 1}`} />
                      <button
                        type="button"
                        className="btn-remove-image"
                        onClick={() => removerImagen(indice)}
                        disabled={cargando}
                        title="Eliminar imagen"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="form-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn-guardar"
              disabled={cargando}
            >
              {cargando ? '⏳ Guardando...' : '✅ Guardar y Continuar'}
            </button>
            <button
              type="button"
              className="btn-saltar"
              onClick={() => navigate('/dashboard')}
              disabled={cargando}
            >
              Saltar por ahora (puedes editar después)
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="setup-info">
          <p>
            <strong>💡 Consejo:</strong> Completa toda tu información ahora. 
            Tus clientes verán esto en el perfil de tu salón. 
            Puedes editarlo en cualquier momento desde Configuración.
          </p>
        </div>
      </div>
    </div>
  );
}
