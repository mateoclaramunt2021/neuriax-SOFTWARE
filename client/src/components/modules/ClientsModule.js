/**
 * Clients Module - Gestión de Clientes CRM con Historial Completo
 * NEURIAX Salon Manager
 * Vista profesional con timeline, estadísticas y notas
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import '../../styles/modules.css';
import '../../styles/clients.css';


export default function ClientsModule() {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const { isAuthenticated } = useAuth();
  
  // Estados principales
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados de UI
  const [showNewForm, setShowNewForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  
  // Estados del cliente seleccionado (historial)
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientHistory, setClientHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'citas' | 'compras' | 'notas'
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    notas_iniciales: ''
  });
  
  // Estado para nueva nota
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('general');

  // Cargar clientes
  const fetchClients = useCallback(async (retryCount = 0) => {
    // Esperar a que el token esté disponible (máximo 10 reintentos)
    const token = localStorage.getItem('accessToken');
    if (!token && retryCount < 10) {
      setTimeout(() => fetchClients(retryCount + 1), 100);
      return;
    }
    
    if (!token) {
      setLoading(false);
      setError('Sesión no válida');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/clientes');
      if (res.data?.success) {
        setClients(res.data.data || []);
      } else {
        setClients([]);
      }
    } catch (err) {
      console.error('Error cargando clientes:', err);
      setError('Error al cargar clientes');
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Solo cargar cuando esté autenticado
    if (isAuthenticated) {
      // Pequeño delay para asegurar que el token esté en localStorage
      const timer = setTimeout(() => {
        fetchClients();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, fetchClients]);

  // Cargar historial del cliente
  const loadClientHistory = async (clientId) => {
    setHistoryLoading(true);
    try {
      const res = await api.get(`/clientes/${clientId}/historial`);
      if (res.data.success) {
        setClientHistory(res.data.data);
      }
    } catch (err) {
      notifyError('Error al cargar historial del cliente');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Seleccionar cliente
  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setActiveTab('timeline');
    loadClientHistory(client.id);
  };

  // Cerrar vista de detalle
  const handleCloseDetail = () => {
    setSelectedClient(null);
    setClientHistory(null);
  };

  // Crear cliente
  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!formData.nombre) {
      notifyError('El nombre es obligatorio');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/clientes', formData);
      if (res.data.success) {
        setClients(prev => [...prev, res.data.data]);
        setFormData({ nombre: '', email: '', telefono: '', direccion: '', notas_iniciales: '' });
        setShowNewForm(false);
        notifySuccess(`Cliente ${formData.nombre} creado correctamente`);
      } else {
        notifyError(res.data.message || 'Error al crear cliente');
      }
    } catch (err) {
      notifyError('Error al crear cliente');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar cliente
  const handleDeleteClient = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de eliminar este cliente?')) return;
    
    try {
      await api.delete(`/clientes/${id}`);
      setClients(prev => prev.filter(c => c.id !== id));
      if (selectedClient?.id === id) {
        handleCloseDetail();
      }
      notifySuccess('Cliente eliminado');
    } catch (err) {
      notifyError('Error al eliminar cliente');
    }
  };

  // Cambiar estado del cliente
  const handleStatusChange = async (id, newStatus, e) => {
    e.stopPropagation();
    try {
      const client = clients.find(c => c.id === id);
      if (!client) return;
      const updated = { ...client, activo: newStatus === 'active' ? 1 : 0 };
      await api.put(`/clientes/${id}`, updated);
      setClients(prev => prev.map(c => c.id === id ? updated : c));
      notifySuccess('Estado actualizado');
    } catch (err) {
      notifyError('Error al actualizar estado');
    }
  };

  // Agregar nota al cliente
  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedClient) return;
    
    try {
      const res = await api.post(`/clientes/${selectedClient.id}/notas`, {
        texto: newNote,
        tipo: noteType
      });
      if (res.data.success) {
        // Recargar historial
        loadClientHistory(selectedClient.id);
        setNewNote('');
        notifySuccess('Nota agregada');
      }
    } catch (err) {
      notifyError('Error al agregar nota');
    }
  };

  // Filtrar clientes
  const filteredClients = clients.filter(client => {
    const matchesSearch = (client.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.telefono || '').includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && client.activo === 1) ||
                         (filterStatus === 'inactive' && client.activo === 0);
    return matchesSearch && matchesStatus;
  });

  // Estadísticas generales
  const stats = {
    total: clients.length,
    active: clients.filter(c => c.activo === 1).length,
    inactive: clients.filter(c => c.activo === 0).length,
    newThisMonth: clients.filter(c => {
      if (!c.fecha_registro) return false;
      const regDate = new Date(c.fecha_registro);
      const now = new Date();
      return regDate.getMonth() === now.getMonth() && regDate.getFullYear() === now.getFullYear();
    }).length
  };

  // Formatear fecha
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Formatear hora
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener icono de estado de cita
  const getStatusIcon = (estado) => {
    const icons = {
      'confirmada': '✅',
      'pendiente': '⏳',
      'completada': '✓',
      'cancelada': '❌',
      'no-show': '🚫'
    };
    return icons[estado] || '📅';
  };

  // Obtener color de tipo de nota
  const getNoteTypeColor = (tipo) => {
    const colors = {
      'general': '#6366f1',
      'importante': '#ef4444',
      'preferencia': '#10b981',
      'alergia': '#f59e0b',
      'recordatorio': '#8b5cf6'
    };
    return colors[tipo] || '#6366f1';
  };

  if (loading && clients.length === 0) {
    return (
      <div className="module-loading">
        <div className="spinner"></div>
        <p>Cargando clientes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <p>❌ {error}</p>
        <button onClick={fetchClients}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="clients-module">
      {/* Header */}
      <div className="clients-header">
        <div className="header-left">
          <h2>👥 Gestión de Clientes</h2>
          <p className="header-subtitle">CRM profesional con historial completo</p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vista lista"
            >
              ☰
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vista cuadrícula"
            >
              ▦
            </button>
          </div>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="new-client-btn"
          >
            {showNewForm ? '✕ Cancelar' : '➕ Nuevo Cliente'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="clients-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Clientes</div>
          </div>
        </div>
        <div className="stat-card active">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Activos</div>
          </div>
        </div>
        <div className="stat-card inactive">
          <div className="stat-icon">⏸️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.inactive}</div>
            <div className="stat-label">Inactivos</div>
          </div>
        </div>
        <div className="stat-card new">
          <div className="stat-icon">🆕</div>
          <div className="stat-content">
            <div className="stat-value">{stats.newThisMonth}</div>
            <div className="stat-label">Nuevos este mes</div>
          </div>
        </div>
      </div>

      {/* Formulario nuevo cliente */}
      {showNewForm && (
        <form className="new-client-form" onSubmit={handleAddClient}>
          <h3>➕ Nuevo Cliente</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre Completo *</label>
              <input
                type="text"
                placeholder="Nombre del cliente"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="cliente@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                placeholder="+34 600 123 456"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Dirección</label>
              <input
                type="text"
                placeholder="Calle, número, ciudad"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>
            <div className="form-group full-width">
              <label>Notas iniciales</label>
              <textarea
                placeholder="Preferencias, alergias, información importante..."
                value={formData.notas_iniciales}
                onChange={(e) => setFormData({ ...formData, notas_iniciales: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setShowNewForm(false)} className="cancel-btn">
              Cancelar
            </button>
            <button type="submit" className="submit-btn">
              👤 Crear Cliente
            </button>
          </div>
        </form>
      )}

      {/* Filtros */}
      <div className="clients-filters">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">Todos los estados</option>
          <option value="active">✅ Activos</option>
          <option value="inactive">⏸️ Inactivos</option>
        </select>
      </div>

      {/* Contenido principal */}
      <div className="clients-content">
        {/* Lista de clientes */}
        <div className={`clients-list ${selectedClient ? 'with-detail' : ''}`}>
          {filteredClients.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">👥</span>
              <p>No hay clientes que coincidan</p>
              <button onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}>
                Limpiar filtros
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Registro</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(client => (
                  <tr 
                    key={client.id} 
                    onClick={() => handleSelectClient(client)}
                    className={selectedClient?.id === client.id ? 'selected' : ''}
                  >
                    <td>
                      <div className="client-cell">
                        <div className="client-avatar">
                          {(client.nombre || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div className="client-info">
                          <span className="client-name">{client.nombre}</span>
                          <span className="client-email">{client.email || '—'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        {client.telefono && <span>📱 {client.telefono}</span>}
                        {client.email && <span>✉️ {client.email}</span>}
                      </div>
                    </td>
                    <td>{formatDate(client.fecha_registro)}</td>
                    <td>
                      <select
                        value={client.activo === 1 ? 'active' : 'inactive'}
                        onChange={(e) => handleStatusChange(client.id, e.target.value, e)}
                        onClick={(e) => e.stopPropagation()}
                        className={`status-badge ${client.activo === 1 ? 'active' : 'inactive'}`}
                      >
                        <option value="active">✅ Activo</option>
                        <option value="inactive">⏸️ Inactivo</option>
                      </select>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSelectClient(client); }}
                          className="action-btn view"
                          title="Ver historial"
                        >
                          📋
                        </button>
                        <button
                          onClick={(e) => handleDeleteClient(client.id, e)}
                          className="action-btn delete"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="clients-grid">
              {filteredClients.map(client => (
                <div 
                  key={client.id} 
                  className={`client-card ${selectedClient?.id === client.id ? 'selected' : ''}`}
                  onClick={() => handleSelectClient(client)}
                >
                  <div className="card-header">
                    <div className="client-avatar large">
                      {(client.nombre || 'C').charAt(0).toUpperCase()}
                    </div>
                    <span className={`status-dot ${client.activo === 1 ? 'active' : 'inactive'}`} />
                  </div>
                  <div className="card-body">
                    <h4>{client.nombre}</h4>
                    <p className="client-contact">
                      {client.telefono && <span>📱 {client.telefono}</span>}
                      {client.email && <span>✉️ {client.email}</span>}
                    </p>
                    <p className="client-date">
                      Cliente desde {formatDate(client.fecha_registro)}
                    </p>
                  </div>
                  <div className="card-actions">
                    <button onClick={(e) => handleDeleteClient(client.id, e)} className="delete-btn">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel de detalle/historial */}
        {selectedClient && (
          <div className="client-detail-panel">
            <div className="detail-header">
              <button className="close-detail" onClick={handleCloseDetail}>✕</button>
              <div className="detail-avatar">
                {(selectedClient.nombre || 'C').charAt(0).toUpperCase()}
              </div>
              <h3>{selectedClient.nombre}</h3>
              <div className="detail-contact">
                {selectedClient.telefono && <span>📱 {selectedClient.telefono}</span>}
                {selectedClient.email && <span>✉️ {selectedClient.email}</span>}
              </div>
              <p className="detail-since">
                Cliente desde {formatDate(selectedClient.fecha_registro)}
              </p>
            </div>

            {historyLoading ? (
              <div className="detail-loading">
                <div className="spinner"></div>
                <p>Cargando historial...</p>
              </div>
            ) : clientHistory && (
              <>
                {/* Estadísticas del cliente */}
                <div className="client-stats-grid">
                  <div className="client-stat">
                    <span className="stat-number">
                      €{clientHistory.estadisticas.totalGastado.toFixed(2)}
                    </span>
                    <span className="stat-text">Total Gastado</span>
                  </div>
                  <div className="client-stat">
                    <span className="stat-number">{clientHistory.estadisticas.totalCitas}</span>
                    <span className="stat-text">Citas Totales</span>
                  </div>
                  <div className="client-stat">
                    <span className="stat-number">{clientHistory.estadisticas.citasCompletadas}</span>
                    <span className="stat-text">Completadas</span>
                  </div>
                  <div className="client-stat">
                    <span className="stat-number">{clientHistory.estadisticas.diasComoCliente}</span>
                    <span className="stat-text">Días como cliente</span>
                  </div>
                </div>

                {/* Servicios favoritos */}
                {clientHistory.serviciosFavoritos.length > 0 && (
                  <div className="favorite-services">
                    <h4>⭐ Servicios Favoritos</h4>
                    <div className="services-list">
                      {clientHistory.serviciosFavoritos.map(s => (
                        <span key={s.id} className="service-tag">
                          {s.nombre} ({s.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tabs */}
                <div className="detail-tabs">
                  <button 
                    className={activeTab === 'timeline' ? 'active' : ''}
                    onClick={() => setActiveTab('timeline')}
                  >
                    📅 Timeline
                  </button>
                  <button 
                    className={activeTab === 'citas' ? 'active' : ''}
                    onClick={() => setActiveTab('citas')}
                  >
                    📋 Citas ({clientHistory.citas.length})
                  </button>
                  <button 
                    className={activeTab === 'compras' ? 'active' : ''}
                    onClick={() => setActiveTab('compras')}
                  >
                    🛒 Compras ({clientHistory.ventas.length})
                  </button>
                  <button 
                    className={activeTab === 'notas' ? 'active' : ''}
                    onClick={() => setActiveTab('notas')}
                  >
                    📝 Notas ({clientHistory.notas.length})
                  </button>
                </div>

                {/* Contenido de tabs */}
                <div className="tab-content">
                  {activeTab === 'timeline' && (
                    <div className="timeline">
                      {clientHistory.timeline.length === 0 ? (
                        <div className="empty-tab">
                          <p>No hay actividad registrada</p>
                        </div>
                      ) : (
                        clientHistory.timeline.map((item, idx) => (
                          <div key={idx} className={`timeline-item ${item.tipo}`}>
                            <div className="timeline-marker">
                              {item.tipo === 'cita' ? getStatusIcon(item.estado) : '🛒'}
                            </div>
                            <div className="timeline-content">
                              <div className="timeline-date">
                                {formatDate(item.fecha)} {item.hora && `a las ${item.hora}`}
                              </div>
                              <div className="timeline-title">
                                {item.tipo === 'cita' ? (
                                  <>
                                    Cita: {item.serviciosDetalle?.map(s => s.nombre).join(', ') || 'Sin servicios'}
                                    {item.empleado && <span className="timeline-employee">con {item.empleado}</span>}
                                  </>
                                ) : (
                                  <>Compra por €{parseFloat(item.total || 0).toFixed(2)}</>
                                )}
                              </div>
                              {item.notas && (
                                <div className="timeline-notes">{item.notas}</div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'citas' && (
                    <div className="citas-list">
                      {clientHistory.citas.length === 0 ? (
                        <div className="empty-tab">
                          <p>No hay citas registradas</p>
                        </div>
                      ) : (
                        clientHistory.citas.map(cita => (
                          <div key={cita.id} className={`cita-card ${cita.estado}`}>
                            <div className="cita-status">{getStatusIcon(cita.estado)}</div>
                            <div className="cita-info">
                              <div className="cita-date">
                                {formatDate(cita.fecha)} a las {cita.hora}
                              </div>
                              <div className="cita-services">
                                {cita.serviciosDetalle?.map(s => s.nombre).join(', ') || 'Sin servicios'}
                              </div>
                              {cita.empleado && (
                                <div className="cita-employee">Con: {cita.empleado}</div>
                              )}
                            </div>
                            <div className="cita-estado">
                              <span className={`estado-badge ${cita.estado}`}>
                                {cita.estado}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'compras' && (
                    <div className="compras-list">
                      {clientHistory.ventas.length === 0 ? (
                        <div className="empty-tab">
                          <p>No hay compras registradas</p>
                        </div>
                      ) : (
                        clientHistory.ventas.map(venta => (
                          <div key={venta.id} className="compra-card">
                            <div className="compra-icon">🛒</div>
                            <div className="compra-info">
                              <div className="compra-date">{formatDate(venta.fecha)}</div>
                              <div className="compra-items">
                                {venta.items?.length || 0} productos
                              </div>
                            </div>
                            <div className="compra-total">
                              €{parseFloat(venta.total || 0).toFixed(2)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'notas' && (
                    <div className="notas-section">
                      {/* Agregar nueva nota */}
                      <div className="add-note-form">
                        <select 
                          value={noteType} 
                          onChange={(e) => setNoteType(e.target.value)}
                          className="note-type-select"
                        >
                          <option value="general">📝 General</option>
                          <option value="importante">⚠️ Importante</option>
                          <option value="preferencia">💫 Preferencia</option>
                          <option value="alergia">🚨 Alergia</option>
                          <option value="recordatorio">🔔 Recordatorio</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Escribe una nota..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                        />
                        <button onClick={handleAddNote} disabled={!newNote.trim()}>
                          ➕
                        </button>
                      </div>
                      
                      {/* Lista de notas */}
                      <div className="notas-list">
                        {clientHistory.notas.length === 0 ? (
                          <div className="empty-tab">
                            <p>No hay notas para este cliente</p>
                          </div>
                        ) : (
                          [...clientHistory.notas].reverse().map(nota => (
                            <div key={nota.id} className="nota-card">
                              <div 
                                className="nota-type-indicator"
                                style={{ backgroundColor: getNoteTypeColor(nota.tipo) }}
                              />
                              <div className="nota-content">
                                <div className="nota-date">
                                  {formatDate(nota.fecha)} {formatTime(nota.fecha)}
                                </div>
                                <div className="nota-text">{nota.texto}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
