/**
 * Services Module - Catálogo de Servicios
 * Profesional, premium, funcional - Conectado a API
 */
import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import '../../styles/modules.css';

export default function ServicesModule() {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const { isAuthenticated } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar servicios del backend
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => fetchServices(), 50);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/servicios');
      if (res.data.success) {
        // Mapear campos del backend al formato del frontend
        const mapped = (res.data.data || []).map(s => ({
          id: s.id,
          name: s.nombre || s.name,
          description: s.descripcion || s.description || '',
          price: parseFloat(s.precio || s.price || 0),
          duration: parseInt(s.duracion || s.duration || 30),
          icon: s.icon || s.icono || '✂️',
          categoria: s.categoria || 'General'
        }));
        setServices(mapped);
      } else {
        setServices([]);
      }
    } catch (err) {
      setError('Error al cargar servicios');
      notifyError('Error al cargar servicios');
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    icon: '✂️'
  });

  const icons = ['✂️', '🎨', '💈', '💅', '🦶', '💆', '🧖', '💇'];

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.duration) {
      notifyError('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        // Actualizar servicio existente
        const res = await api.put(`/servicios/${editingId}`, {
          nombre: formData.name,
          descripcion: formData.description,
          precio: parseFloat(formData.price),
          duracion: parseInt(formData.duration),
          icono: formData.icon
        });
        if (res.data.success) {
          await fetchServices();
          notifySuccess('Servicio actualizado');
        } else {
          notifyError(res.data.message || 'Error al actualizar');
        }
        setEditingId(null);
      } else {
        // Crear nuevo servicio
        const res = await api.post('/servicios', {
          nombre: formData.name,
          descripcion: formData.description,
          precio: parseFloat(formData.price),
          duracion: parseInt(formData.duration),
          icono: formData.icon,
          categoria: 'General'
        });
        if (res.data.success) {
          await fetchServices();
          notifySuccess(`Servicio "${formData.name}" agregado`);
        } else {
          notifyError(res.data.message || 'Error al crear servicio');
        }
      }
      setFormData({ name: '', description: '', price: '', duration: '', icon: '✂️' });
      setShowNewForm(false);
    } catch (err) {
      notifyError('Error al guardar servicio');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('¿Eliminar este servicio?')) return;
    setLoading(true);
    try {
      await api.delete(`/servicios/${id}`);
      await fetchServices();
      notifySuccess('Servicio eliminado');
    } catch (err) {
      notifyError('Error al eliminar servicio');
    } finally {
      setLoading(false);
    }
  };

  const handleEditService = (service) => {
    setFormData(service);
    setEditingId(service.id);
    setShowNewForm(true);
  };

  return (
    <div className="services-container">
      {loading && <div className="loading-overlay">Cargando...</div>}
      {error && <div className="error-message">{error}</div>}
      <div className="services-header-section">
        <div>
          <h2>Catálogo de Servicios</h2>
          <p className="header-subtitle">Gestiona los servicios que ofreces ({services.length} servicios)</p>
        </div>
        <button
          onClick={() => {
            setShowNewForm(!showNewForm);
            setEditingId(null);
            setFormData({ name: '', description: '', price: '', duration: '', icon: '✂️' });
          }}
          className="new-service-btn"
        >
          {showNewForm ? '✕ Cancelar' : '➕ Nuevo Servicio'}
        </button>
      </div>

      {showNewForm && (
        <form className="service-form" onSubmit={handleAddService}>
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre del Servicio</label>
              <input
                type="text"
                placeholder="Ej: Corte de Cabello"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group full-width">
              <label>Descripción</label>
              <textarea
                placeholder="Describe el servicio..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>Precio (€)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Duración (minutos)</label>
              <input
                type="number"
                placeholder="30"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Icono</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              >
                {icons.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <button type="submit" className="form-submit-btn">
                {editingId ? '💾 Actualizar' : '➕ Agregar'} Servicio
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="services-grid-view">
        {services.map(service => (
          <div key={service.id} className="service-detail-card">
            <div className="service-icon-large">{service.icon}</div>
            <h3>{service.name}</h3>
            <p className="service-description">{service.description}</p>
            <div className="service-details-row">
              <span className="detail-label">Precio:</span>
              <span className="detail-value">€{service.price.toFixed(2)}</span>
            </div>
            <div className="service-details-row">
              <span className="detail-label">Duración:</span>
              <span className="detail-value">{service.duration} min</span>
            </div>
            <div className="service-actions">
              <button
                onClick={() => handleEditService(service)}
                className="edit-service-btn"
                title="Editar servicio"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDeleteService(service.id)}
                className="delete-service-btn"
                title="Eliminar servicio"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
