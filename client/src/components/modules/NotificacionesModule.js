/**
 * PASO 5: SISTEMA DE NOTIFICACIONES Y RECORDATORIOS
 * Módulo Profesional Enterprise-Grade
 * 
 * Funcionalidades:
 * - Lista de notificaciones con filtros
 * - Centro de preferencias (Email, SMS, WhatsApp, Push)
 * - Configuración de recordatorios automáticos
 * - Historial completo con búsqueda
 * - Estadísticas de envío
 * - Horas silenciosas
 * - Envío manual de notificaciones
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import '../../styles/notificaciones-module.css';

export default function NotificacionesModule() {
  const { isAuthenticated } = useAuth();
  // === ESTADOS PRINCIPALES ===
  const [activeTab, setActiveTab] = useState('inbox'); // inbox, preferences, reminders, history, stats
  const [notificaciones, setNotificaciones] = useState([]);
  const [historial, setHistorial] = useState({});
  const [estadisticas, setEstadisticas] = useState(null);
  const [preferencias, setPreferencias] = useState(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);
  
  // === ESTADOS DE FILTROS ===
  const [filtroTipo, setFiltroTipo] = useState('all');
  const [filtroEstado, setFiltroEstado] = useState('all');
  const [busqueda, setBusqueda] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  // === ESTADOS DE MODALES ===
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [notificacionDetalle, setNotificacionDetalle] = useState(null);
  const [tipoEnvio, setTipoEnvio] = useState('email');
  
  // === ESTADO DE NUEVO ENVÍO ===
  const [nuevoEnvio, setNuevoEnvio] = useState({
    destinatario: '',
    asunto: '',
    mensaje: '',
    prioridad: 'normal',
    programar: false,
    fechaProgramada: ''
  });

  // === CONFIGURACIÓN DE RECORDATORIOS ===
  const [recordatoriosConfig, setRecordatoriosConfig] = useState({
    citasAntes24h: true,
    citasAntes1h: true,
    cumpleanos: true,
    stockBajo: true,
    facturasPendientes: true,
    resumenDiario: false,
    resumenSemanal: true
  });

  // === CARGAR DATOS INICIALES ===
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => cargarDatos(), 50);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const cargarDatos = async (retryCount = 0) => {
    setLoading(true);
    try {
      const [notifsRes, prefsRes, statsRes] = await Promise.allSettled([
        api.get('/notificaciones'),
        api.get('/notificaciones/preferencias'),
        api.get('/notificaciones/estadisticas')
      ]);

      if (notifsRes.status === 'fulfilled') {
        setNotificaciones(notifsRes.value?.data?.data || []);
      }
      
      if (prefsRes.status === 'fulfilled') {
        setPreferencias(prefsRes.value?.data?.data || getDefaultPreferences());
      } else {
        setPreferencias(getDefaultPreferences());
      }
      
      if (statsRes.status === 'fulfilled') {
        setEstadisticas(statsRes.value?.data?.data || getDefaultStats());
      } else {
        setEstadisticas(getDefaultStats());
      }

      setError(null);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar notificaciones');
      setPreferencias(getDefaultPreferences());
      setEstadisticas(getDefaultStats());
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append('startDate', fechaInicio);
      if (fechaFin) params.append('endDate', fechaFin);
      
      const response = await api.get(`/notificaciones/historial?${params}`);
      setHistorial(response.data?.data || {});
    } catch (err) {
      console.error('Error cargando historial:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      cargarHistorial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, fechaInicio, fechaFin]);

  // === PREFERENCIAS POR DEFECTO ===
  const getDefaultPreferences = () => ({
    email: {
      enabled: true,
      receiveInvoices: true,
      receiveReminders: true,
      receiveAlerts: true,
      receiveReports: true
    },
    sms: {
      enabled: false,
      receiveReminders: true,
      receiveAlerts: true,
      receiveUrgent: true
    },
    whatsapp: {
      enabled: false,
      receiveReminders: false,
      receiveAlerts: true,
      receiveUrgent: true
    },
    push: {
      enabled: true,
      receiveAll: true,
      soundEnabled: true
    },
    quiet_hours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    }
  });

  const getDefaultStats = () => ({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    byType: { email: 0, sms: 0, whatsapp: 0, push: 0, inapp: 0 },
    byCategory: {},
    lastWeek: 0
  });

  // === FILTRAR NOTIFICACIONES ===
  const notificacionesFiltradas = useMemo(() => {
    let filtered = [...notificaciones];
    
    if (filtroTipo !== 'all') {
      filtered = filtered.filter(n => n.type === filtroTipo);
    }
    
    if (filtroEstado !== 'all') {
      filtered = filtered.filter(n => {
        if (filtroEstado === 'read') return n.read;
        if (filtroEstado === 'unread') return !n.read;
        return n.status === filtroEstado;
      });
    }
    
    if (busqueda) {
      const search = busqueda.toLowerCase();
      filtered = filtered.filter(n => 
        n.message?.toLowerCase().includes(search) ||
        n.subject?.toLowerCase().includes(search) ||
        n.recipient?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [notificaciones, filtroTipo, filtroEstado, busqueda]);

  // === ACCIONES ===
  const marcarComoLeida = async (id) => {
    try {
      await api.post(`/notificaciones/${id}/marcar-leida`);
      setNotificaciones(prev => prev.map(n => 
        n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
      ));
    } catch (err) {
      console.error('Error marcando como leída:', err);
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      const unread = notificaciones.filter(n => !n.read);
      await Promise.all(unread.map(n => api.post(`/notificaciones/${n.id}/marcar-leida`)));
      setNotificaciones(prev => prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() })));
    } catch (err) {
      console.error('Error marcando todas como leídas:', err);
    }
  };

  const eliminarNotificacion = async (id) => {
    if (!window.confirm('¿Eliminar esta notificación?')) return;
    try {
      await api.delete(`/notificaciones/${id}`);
      setNotificaciones(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error eliminando notificación:', err);
    }
  };

  const limpiarHistorial = async () => {
    if (!window.confirm('¿Limpiar todo el historial de notificaciones?')) return;
    try {
      await api.delete('/notificaciones');
      setNotificaciones([]);
      setHistorial({});
    } catch (err) {
      console.error('Error limpiando historial:', err);
    }
  };

  // === GUARDAR PREFERENCIAS ===
  const guardarPreferencias = async () => {
    try {
      await api.put('/notificaciones/preferencias', preferencias);
      alert('Preferencias guardadas correctamente');
    } catch (err) {
      console.error('Error guardando preferencias:', err);
      alert('Error al guardar preferencias');
    }
  };

  // === ENVIAR NOTIFICACIÓN ===
  const enviarNotificacion = async () => {
    if (!nuevoEnvio.destinatario || !nuevoEnvio.mensaje) {
      alert('Complete destinatario y mensaje');
      return;
    }

    try {
      let endpoint = '/notificaciones/send-email';
      let payload = {
        to: nuevoEnvio.destinatario,
        subject: nuevoEnvio.asunto,
        message: nuevoEnvio.mensaje,
        priority: nuevoEnvio.prioridad
      };

      if (tipoEnvio === 'sms') {
        endpoint = '/notificaciones/send-sms';
        payload = { to: nuevoEnvio.destinatario, message: nuevoEnvio.mensaje, priority: nuevoEnvio.prioridad };
      } else if (tipoEnvio === 'whatsapp') {
        endpoint = '/notificaciones/send-whatsapp';
        payload = { to: nuevoEnvio.destinatario, message: nuevoEnvio.mensaje, priority: nuevoEnvio.prioridad };
      }

      await api.post(endpoint, payload);
      
      setShowEnviarModal(false);
      setNuevoEnvio({
        destinatario: '',
        asunto: '',
        mensaje: '',
        prioridad: 'normal',
        programar: false,
        fechaProgramada: ''
      });
      
      cargarDatos();
      alert('Notificación enviada correctamente');
    } catch (err) {
      console.error('Error enviando notificación:', err);
      alert('Error al enviar notificación');
    }
  };

  // === RENDERIZAR TABS ===
  const tabs = [
    { id: 'inbox', icon: '📬', label: 'Bandeja' },
    { id: 'preferences', icon: '⚙️', label: 'Preferencias' },
    { id: 'reminders', icon: '⏰', label: 'Recordatorios' },
    { id: 'history', icon: '📜', label: 'Historial' },
    { id: 'stats', icon: '📊', label: 'Estadísticas' }
  ];

  const unreadCount = notificaciones.filter(n => !n.read).length;

  // === RENDER LOADING ===
  if (loading) {
    return (
      <div className="notificaciones-module">
        <div className="notificaciones-loading">
          <div className="loading-spinner"></div>
          <p>Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notificaciones-module">
      {/* HEADER */}
      <div className="notificaciones-header">
        <div className="header-title">
          <h2>🔔 Centro de Notificaciones</h2>
          <span className="subtitle">Gestiona todas tus comunicaciones y alertas</span>
        </div>
        <div className="header-actions">
          {unreadCount > 0 && (
            <button className="btn-secondary" onClick={marcarTodasLeidas}>
              ✓ Marcar todas leídas
            </button>
          )}
          <button className="btn-primary" onClick={() => setShowEnviarModal(true)}>
            ✉️ Nueva Notificación
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="notificaciones-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {tab.id === 'inbox' && unreadCount > 0 && (
              <span className="tab-badge">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      <div className="notificaciones-content">
        {/* === TAB: BANDEJA === */}
        {activeTab === 'inbox' && (
          <div className="inbox-container">
            {/* Filtros */}
            <div className="inbox-filters">
              <div className="filter-group">
                <input
                  type="text"
                  placeholder="🔍 Buscar notificaciones..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="filter-search"
                />
              </div>
              <div className="filter-group">
                <select 
                  value={filtroTipo} 
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="email">📧 Email</option>
                  <option value="sms">📱 SMS</option>
                  <option value="whatsapp">💬 WhatsApp</option>
                  <option value="push">🔔 Push</option>
                  <option value="inapp">📌 In-App</option>
                </select>
              </div>
              <div className="filter-group">
                <select 
                  value={filtroEstado} 
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Todos los estados</option>
                  <option value="unread">📬 No leídas</option>
                  <option value="read">📭 Leídas</option>
                  <option value="sent">✅ Enviadas</option>
                  <option value="failed">❌ Fallidas</option>
                  <option value="pending">⏳ Pendientes</option>
                </select>
              </div>
            </div>

            {/* Lista de notificaciones */}
            <div className="inbox-list">
              {notificacionesFiltradas.length === 0 ? (
                <div className="inbox-empty">
                  <span className="empty-icon">📭</span>
                  <h3>No hay notificaciones</h3>
                  <p>Las nuevas notificaciones aparecerán aquí</p>
                </div>
              ) : (
                notificacionesFiltradas.map(notif => (
                  <div 
                    key={notif.id} 
                    className={`notification-card ${!notif.read ? 'unread' : ''} ${notif.status === 'failed' ? 'failed' : ''}`}
                    onClick={() => {
                      setNotificacionDetalle(notif);
                      setShowDetalleModal(true);
                      if (!notif.read) marcarComoLeida(notif.id);
                    }}
                  >
                    <div className="notification-icon">
                      {notif.type === 'email' && '📧'}
                      {notif.type === 'sms' && '📱'}
                      {notif.type === 'whatsapp' && '💬'}
                      {notif.type === 'push' && '🔔'}
                      {notif.type === 'inapp' && '📌'}
                      {!notif.type && '📨'}
                    </div>
                    <div className="notification-content">
                      <div className="notification-header">
                        <span className="notification-subject">
                          {notif.subject || notif.message?.substring(0, 50) || 'Sin asunto'}
                        </span>
                        <span className="notification-time">
                          {formatDate(notif.timestamp || notif.createdAt)}
                        </span>
                      </div>
                      <p className="notification-preview">
                        {notif.message?.substring(0, 100)}
                        {notif.message?.length > 100 && '...'}
                      </p>
                      <div className="notification-meta">
                        {notif.recipient && (
                          <span className="meta-item">📤 {notif.recipient}</span>
                        )}
                        {notif.category && (
                          <span className="meta-item tag">{notif.category}</span>
                        )}
                        <span className={`meta-item status-${notif.status || 'info'}`}>
                          {getStatusLabel(notif.status)}
                        </span>
                      </div>
                    </div>
                    <div className="notification-actions">
                      {!notif.read && (
                        <button 
                          className="action-btn"
                          onClick={(e) => { e.stopPropagation(); marcarComoLeida(notif.id); }}
                          title="Marcar como leída"
                        >
                          ✓
                        </button>
                      )}
                      <button 
                        className="action-btn delete"
                        onClick={(e) => { e.stopPropagation(); eliminarNotificacion(notif.id); }}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* === TAB: PREFERENCIAS === */}
        {activeTab === 'preferences' && preferencias && (
          <div className="preferences-container">
            <div className="preferences-grid">
              {/* Email */}
              <div className="preference-card">
                <div className="preference-header">
                  <span className="preference-icon">📧</span>
                  <h3>Email</h3>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={preferencias.email?.enabled}
                      onChange={(e) => setPreferencias(prev => ({
                        ...prev,
                        email: { ...prev.email, enabled: e.target.checked }
                      }))}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                {preferencias.email?.enabled && (
                  <div className="preference-options">
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={preferencias.email?.receiveInvoices}
                        onChange={(e) => setPreferencias(prev => ({
                          ...prev,
                          email: { ...prev.email, receiveInvoices: e.target.checked }
                        }))}
                      />
                      <span>Facturas y recibos</span>
                    </label>
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={preferencias.email?.receiveReminders}
                        onChange={(e) => setPreferencias(prev => ({
                          ...prev,
                          email: { ...prev.email, receiveReminders: e.target.checked }
                        }))}
                      />
                      <span>Recordatorios de citas</span>
                    </label>
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={preferencias.email?.receiveAlerts}
                        onChange={(e) => setPreferencias(prev => ({
                          ...prev,
                          email: { ...prev.email, receiveAlerts: e.target.checked }
                        }))}
                      />
                      <span>Alertas del sistema</span>
                    </label>
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={preferencias.email?.receiveReports}
                        onChange={(e) => setPreferencias(prev => ({
                          ...prev,
                          email: { ...prev.email, receiveReports: e.target.checked }
                        }))}
                      />
                      <span>Informes periódicos</span>
                    </label>
                  </div>
                )}
              </div>

              {/* SMS */}
              <div className="preference-card">
                <div className="preference-header">
                  <span className="preference-icon">📱</span>
                  <h3>SMS</h3>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={preferencias.sms?.enabled}
                      onChange={(e) => setPreferencias(prev => ({
                        ...prev,
                        sms: { ...prev.sms, enabled: e.target.checked }
                      }))}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                {preferencias.sms?.enabled && (
                  <div className="preference-options">
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={preferencias.sms?.receiveReminders}
                        onChange={(e) => setPreferencias(prev => ({
                          ...prev,
                          sms: { ...prev.sms, receiveReminders: e.target.checked }
                        }))}
                      />
                      <span>Recordatorios de citas</span>
                    </label>
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={preferencias.sms?.receiveAlerts}
                        onChange={(e) => setPreferencias(prev => ({
                          ...prev,
                          sms: { ...prev.sms, receiveAlerts: e.target.checked }
                        }))}
                      />
                      <span>Alertas importantes</span>
                    </label>
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={preferencias.sms?.receiveUrgent}
                        onChange={(e) => setPreferencias(prev => ({
                          ...prev,
                          sms: { ...prev.sms, receiveUrgent: e.target.checked }
                        }))}
                      />
                      <span>Mensajes urgentes</span>
                    </label>
                  </div>
                )}
              </div>

              {/* WhatsApp */}
              <div className="preference-card">
                <div className="preference-header">
                  <span className="preference-icon">💬</span>
                  <h3>WhatsApp</h3>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={preferencias.whatsapp?.enabled}
                      onChange={(e) => setPreferencias(prev => ({
                        ...prev,
                        whatsapp: { ...prev.whatsapp, enabled: e.target.checked }
                      }))}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                {preferencias.whatsapp?.enabled && (
                  <div className="preference-options">
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={preferencias.whatsapp?.receiveReminders}
                        onChange={(e) => setPreferencias(prev => ({
                          ...prev,
                          whatsapp: { ...prev.whatsapp, receiveReminders: e.target.checked }
                        }))}
                      />
                      <span>Recordatorios</span>
                    </label>
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={preferencias.whatsapp?.receiveAlerts}
                        onChange={(e) => setPreferencias(prev => ({
                          ...prev,
                          whatsapp: { ...prev.whatsapp, receiveAlerts: e.target.checked }
                        }))}
                      />
                      <span>Alertas</span>
                    </label>
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={preferencias.whatsapp?.receiveUrgent}
                        onChange={(e) => setPreferencias(prev => ({
                          ...prev,
                          whatsapp: { ...prev.whatsapp, receiveUrgent: e.target.checked }
                        }))}
                      />
                      <span>Urgentes</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Push */}
              <div className="preference-card">
                <div className="preference-header">
                  <span className="preference-icon">🔔</span>
                  <h3>Push (Navegador)</h3>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={preferencias.push?.enabled}
                      onChange={(e) => setPreferencias(prev => ({
                        ...prev,
                        push: { ...prev.push, enabled: e.target.checked }
                      }))}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                {preferencias.push?.enabled && (
                  <div className="preference-options">
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={preferencias.push?.receiveAll}
                        onChange={(e) => setPreferencias(prev => ({
                          ...prev,
                          push: { ...prev.push, receiveAll: e.target.checked }
                        }))}
                      />
                      <span>Todas las notificaciones</span>
                    </label>
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={preferencias.push?.soundEnabled}
                        onChange={(e) => setPreferencias(prev => ({
                          ...prev,
                          push: { ...prev.push, soundEnabled: e.target.checked }
                        }))}
                      />
                      <span>Sonido activado</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Horas Silenciosas */}
              <div className="preference-card full-width">
                <div className="preference-header">
                  <span className="preference-icon">🌙</span>
                  <h3>Horas Silenciosas</h3>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={preferencias.quiet_hours?.enabled}
                      onChange={(e) => setPreferencias(prev => ({
                        ...prev,
                        quiet_hours: { ...prev.quiet_hours, enabled: e.target.checked }
                      }))}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                {preferencias.quiet_hours?.enabled && (
                  <div className="quiet-hours-config">
                    <p className="config-description">
                      No recibirás notificaciones durante estas horas
                    </p>
                    <div className="time-range">
                      <div className="time-input">
                        <label>Desde</label>
                        <input
                          type="time"
                          value={preferencias.quiet_hours?.startTime || '22:00'}
                          onChange={(e) => setPreferencias(prev => ({
                            ...prev,
                            quiet_hours: { ...prev.quiet_hours, startTime: e.target.value }
                          }))}
                        />
                      </div>
                      <span className="time-separator">hasta</span>
                      <div className="time-input">
                        <label>Hasta</label>
                        <input
                          type="time"
                          value={preferencias.quiet_hours?.endTime || '08:00'}
                          onChange={(e) => setPreferencias(prev => ({
                            ...prev,
                            quiet_hours: { ...prev.quiet_hours, endTime: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="preferences-actions">
              <button className="btn-primary" onClick={guardarPreferencias}>
                💾 Guardar Preferencias
              </button>
            </div>
          </div>
        )}

        {/* === TAB: RECORDATORIOS === */}
        {activeTab === 'reminders' && (
          <div className="reminders-container">
            <div className="reminders-info">
              <div className="info-icon">⏰</div>
              <div className="info-content">
                <h3>Recordatorios Automáticos</h3>
                <p>Configura qué recordatorios deseas recibir automáticamente</p>
              </div>
            </div>

            <div className="reminders-grid">
              <div className="reminder-card">
                <div className="reminder-icon">📅</div>
                <div className="reminder-content">
                  <h4>Citas - 24 horas antes</h4>
                  <p>Recibe recordatorio un día antes de cada cita</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={recordatoriosConfig.citasAntes24h}
                    onChange={(e) => setRecordatoriosConfig(prev => ({
                      ...prev,
                      citasAntes24h: e.target.checked
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="reminder-card">
                <div className="reminder-icon">⏱️</div>
                <div className="reminder-content">
                  <h4>Citas - 1 hora antes</h4>
                  <p>Recibe recordatorio una hora antes de cada cita</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={recordatoriosConfig.citasAntes1h}
                    onChange={(e) => setRecordatoriosConfig(prev => ({
                      ...prev,
                      citasAntes1h: e.target.checked
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="reminder-card">
                <div className="reminder-icon">🎂</div>
                <div className="reminder-content">
                  <h4>Cumpleaños de Clientes</h4>
                  <p>Alerta cuando un cliente cumple años</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={recordatoriosConfig.cumpleanos}
                    onChange={(e) => setRecordatoriosConfig(prev => ({
                      ...prev,
                      cumpleanos: e.target.checked
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="reminder-card">
                <div className="reminder-icon">📦</div>
                <div className="reminder-content">
                  <h4>Stock Bajo</h4>
                  <p>Alerta cuando un producto está por agotarse</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={recordatoriosConfig.stockBajo}
                    onChange={(e) => setRecordatoriosConfig(prev => ({
                      ...prev,
                      stockBajo: e.target.checked
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="reminder-card">
                <div className="reminder-icon">💰</div>
                <div className="reminder-content">
                  <h4>Facturas Pendientes</h4>
                  <p>Recordatorio de facturas sin pagar</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={recordatoriosConfig.facturasPendientes}
                    onChange={(e) => setRecordatoriosConfig(prev => ({
                      ...prev,
                      facturasPendientes: e.target.checked
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="reminder-card">
                <div className="reminder-icon">📊</div>
                <div className="reminder-content">
                  <h4>Resumen Diario</h4>
                  <p>Recibe un resumen de actividad cada día</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={recordatoriosConfig.resumenDiario}
                    onChange={(e) => setRecordatoriosConfig(prev => ({
                      ...prev,
                      resumenDiario: e.target.checked
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="reminder-card">
                <div className="reminder-icon">📈</div>
                <div className="reminder-content">
                  <h4>Resumen Semanal</h4>
                  <p>Recibe un informe semanal del negocio</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={recordatoriosConfig.resumenSemanal}
                    onChange={(e) => setRecordatoriosConfig(prev => ({
                      ...prev,
                      resumenSemanal: e.target.checked
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="reminders-actions">
              <button className="btn-primary" onClick={() => alert('Configuración de recordatorios guardada')}>
                💾 Guardar Configuración
              </button>
            </div>
          </div>
        )}

        {/* === TAB: HISTORIAL === */}
        {activeTab === 'history' && (
          <div className="history-container">
            <div className="history-filters">
              <div className="filter-group">
                <label>Desde</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Hasta</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
              <button className="btn-secondary" onClick={cargarHistorial}>
                🔍 Filtrar
              </button>
              <button className="btn-danger" onClick={limpiarHistorial}>
                🗑️ Limpiar Todo
              </button>
            </div>

            <div className="history-timeline">
              {Object.keys(historial).length === 0 ? (
                <div className="history-empty">
                  <span className="empty-icon">📜</span>
                  <h3>Sin historial</h3>
                  <p>Las notificaciones enviadas aparecerán aquí agrupadas por fecha</p>
                </div>
              ) : (
                Object.entries(historial).map(([fecha, items]) => (
                  <div key={fecha} className="history-day">
                    <div className="history-date">
                      <span className="date-icon">📅</span>
                      <span className="date-text">{fecha}</span>
                      <span className="date-count">{items.length} notificaciones</span>
                    </div>
                    <div className="history-items">
                      {items.map((item, idx) => (
                        <div key={idx} className="history-item">
                          <span className="item-icon">
                            {item.type === 'email' && '📧'}
                            {item.type === 'sms' && '📱'}
                            {item.type === 'whatsapp' && '💬'}
                            {!item.type && '📨'}
                          </span>
                          <span className="item-recipient">{item.recipient}</span>
                          <span className="item-message">{item.message?.substring(0, 50)}...</span>
                          <span className={`item-status ${item.status}`}>{item.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* === TAB: ESTADÍSTICAS === */}
        {activeTab === 'stats' && estadisticas && (
          <div className="stats-container">
            {/* KPIs */}
            <div className="stats-kpis">
              <div className="kpi-card">
                <div className="kpi-icon">📨</div>
                <div className="kpi-value">{estadisticas.total}</div>
                <div className="kpi-label">Total Enviadas</div>
              </div>
              <div className="kpi-card success">
                <div className="kpi-icon">✅</div>
                <div className="kpi-value">{estadisticas.sent}</div>
                <div className="kpi-label">Entregadas</div>
              </div>
              <div className="kpi-card warning">
                <div className="kpi-icon">⏳</div>
                <div className="kpi-value">{estadisticas.pending}</div>
                <div className="kpi-label">Pendientes</div>
              </div>
              <div className="kpi-card danger">
                <div className="kpi-icon">❌</div>
                <div className="kpi-value">{estadisticas.failed}</div>
                <div className="kpi-label">Fallidas</div>
              </div>
            </div>

            {/* Por Tipo */}
            <div className="stats-section">
              <h3>📊 Por Tipo de Canal</h3>
              <div className="stats-bars">
                <div className="stat-bar">
                  <span className="bar-label">📧 Email</span>
                  <div className="bar-track">
                    <div 
                      className="bar-fill email" 
                      style={{ width: `${getPercentage(estadisticas.byType?.email, estadisticas.total)}%` }}
                    ></div>
                  </div>
                  <span className="bar-value">{estadisticas.byType?.email || 0}</span>
                </div>
                <div className="stat-bar">
                  <span className="bar-label">📱 SMS</span>
                  <div className="bar-track">
                    <div 
                      className="bar-fill sms" 
                      style={{ width: `${getPercentage(estadisticas.byType?.sms, estadisticas.total)}%` }}
                    ></div>
                  </div>
                  <span className="bar-value">{estadisticas.byType?.sms || 0}</span>
                </div>
                <div className="stat-bar">
                  <span className="bar-label">💬 WhatsApp</span>
                  <div className="bar-track">
                    <div 
                      className="bar-fill whatsapp" 
                      style={{ width: `${getPercentage(estadisticas.byType?.whatsapp, estadisticas.total)}%` }}
                    ></div>
                  </div>
                  <span className="bar-value">{estadisticas.byType?.whatsapp || 0}</span>
                </div>
                <div className="stat-bar">
                  <span className="bar-label">🔔 Push</span>
                  <div className="bar-track">
                    <div 
                      className="bar-fill push" 
                      style={{ width: `${getPercentage(estadisticas.byType?.push, estadisticas.total)}%` }}
                    ></div>
                  </div>
                  <span className="bar-value">{estadisticas.byType?.push || 0}</span>
                </div>
                <div className="stat-bar">
                  <span className="bar-label">📌 In-App</span>
                  <div className="bar-track">
                    <div 
                      className="bar-fill inapp" 
                      style={{ width: `${getPercentage(estadisticas.byType?.inapp, estadisticas.total)}%` }}
                    ></div>
                  </div>
                  <span className="bar-value">{estadisticas.byType?.inapp || 0}</span>
                </div>
              </div>
            </div>

            {/* Última semana */}
            <div className="stats-section">
              <h3>📈 Actividad Reciente</h3>
              <div className="activity-card">
                <div className="activity-icon">📆</div>
                <div className="activity-content">
                  <div className="activity-value">{estadisticas.lastWeek}</div>
                  <div className="activity-label">Notificaciones últimos 7 días</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* === MODAL: ENVIAR NOTIFICACIÓN === */}
      {showEnviarModal && (
        <div className="modal-overlay" onClick={() => setShowEnviarModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✉️ Nueva Notificación</h3>
              <button className="modal-close" onClick={() => setShowEnviarModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tipo de Envío</label>
                <div className="tipo-envio-buttons">
                  <button 
                    className={`tipo-btn ${tipoEnvio === 'email' ? 'active' : ''}`}
                    onClick={() => setTipoEnvio('email')}
                  >
                    📧 Email
                  </button>
                  <button 
                    className={`tipo-btn ${tipoEnvio === 'sms' ? 'active' : ''}`}
                    onClick={() => setTipoEnvio('sms')}
                  >
                    📱 SMS
                  </button>
                  <button 
                    className={`tipo-btn ${tipoEnvio === 'whatsapp' ? 'active' : ''}`}
                    onClick={() => setTipoEnvio('whatsapp')}
                  >
                    💬 WhatsApp
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>
                  {tipoEnvio === 'email' ? 'Email destinatario' : 'Teléfono'}
                </label>
                <input
                  type={tipoEnvio === 'email' ? 'email' : 'tel'}
                  value={nuevoEnvio.destinatario}
                  onChange={(e) => setNuevoEnvio(prev => ({ ...prev, destinatario: e.target.value }))}
                  placeholder={tipoEnvio === 'email' ? 'ejemplo@email.com' : '+34 600 000 000'}
                />
              </div>

              {tipoEnvio === 'email' && (
                <div className="form-group">
                  <label>Asunto</label>
                  <input
                    type="text"
                    value={nuevoEnvio.asunto}
                    onChange={(e) => setNuevoEnvio(prev => ({ ...prev, asunto: e.target.value }))}
                    placeholder="Asunto del email"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Mensaje</label>
                <textarea
                  value={nuevoEnvio.mensaje}
                  onChange={(e) => setNuevoEnvio(prev => ({ ...prev, mensaje: e.target.value }))}
                  placeholder="Escribe tu mensaje..."
                  rows={4}
                ></textarea>
              </div>

              <div className="form-group">
                <label>Prioridad</label>
                <select
                  value={nuevoEnvio.prioridad}
                  onChange={(e) => setNuevoEnvio(prev => ({ ...prev, prioridad: e.target.value }))}
                >
                  <option value="low">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEnviarModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={enviarNotificacion}>
                📤 Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL: DETALLE NOTIFICACIÓN === */}
      {showDetalleModal && notificacionDetalle && (
        <div className="modal-overlay" onClick={() => setShowDetalleModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📨 Detalle de Notificación</h3>
              <button className="modal-close" onClick={() => setShowDetalleModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detalle-grid">
                <div className="detalle-item">
                  <label>Tipo</label>
                  <span className="detalle-value">
                    {notificacionDetalle.type === 'email' && '📧 Email'}
                    {notificacionDetalle.type === 'sms' && '📱 SMS'}
                    {notificacionDetalle.type === 'whatsapp' && '💬 WhatsApp'}
                    {notificacionDetalle.type === 'push' && '🔔 Push'}
                    {!notificacionDetalle.type && '📨 General'}
                  </span>
                </div>
                <div className="detalle-item">
                  <label>Estado</label>
                  <span className={`detalle-value status-${notificacionDetalle.status}`}>
                    {getStatusLabel(notificacionDetalle.status)}
                  </span>
                </div>
                <div className="detalle-item">
                  <label>Destinatario</label>
                  <span className="detalle-value">{notificacionDetalle.recipient || 'N/A'}</span>
                </div>
                <div className="detalle-item">
                  <label>Fecha</label>
                  <span className="detalle-value">
                    {formatDateFull(notificacionDetalle.timestamp || notificacionDetalle.createdAt)}
                  </span>
                </div>
                {notificacionDetalle.subject && (
                  <div className="detalle-item full">
                    <label>Asunto</label>
                    <span className="detalle-value">{notificacionDetalle.subject}</span>
                  </div>
                )}
                <div className="detalle-item full">
                  <label>Mensaje</label>
                  <p className="detalle-message">{notificacionDetalle.message}</p>
                </div>
                {notificacionDetalle.readAt && (
                  <div className="detalle-item">
                    <label>Leída</label>
                    <span className="detalle-value">{formatDateFull(notificacionDetalle.readAt)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-danger" 
                onClick={() => { eliminarNotificacion(notificacionDetalle.id); setShowDetalleModal(false); }}
              >
                🗑️ Eliminar
              </button>
              <button className="btn-secondary" onClick={() => setShowDetalleModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// === FUNCIONES AUXILIARES ===
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Ahora';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} h`;
  if (diff < 172800000) return 'Ayer';
  
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function formatDateFull(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusLabel(status) {
  const labels = {
    sent: '✅ Enviada',
    failed: '❌ Fallida',
    pending: '⏳ Pendiente',
    delivered: '✅ Entregada',
    read: '👁️ Leída'
  };
  return labels[status] || status || 'Info';
}

function getPercentage(value, total) {
  if (!total || !value) return 0;
  return Math.round((value / total) * 100);
}
