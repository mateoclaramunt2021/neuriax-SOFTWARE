/**
 * SettingsModule - Configuración del Sistema
 * NEURIAX Salon Manager
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './modules.css';

const SettingsModule = () => {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const { isAuthenticated } = useAuth();
  
  const [activeSection, setActiveSection] = useState('negocio');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Configuración del negocio
  const [configNegocio, setConfigNegocio] = useState({
    nombre: 'NEURIAX Salon',
    nif_cif: '',
    direccion: '',
    codigo_postal: '',
    ciudad: '',
    provincia: '',
    telefono: '',
    email: '',
    web: '',
    logo_url: '',
    horario_apertura: '09:00',
    horario_cierre: '20:00',
    dias_laborables: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'],
    intervalo_citas: 30
  });

  // Configuración fiscal
  const [configFiscal, setConfigFiscal] = useState({
    iva_porcentaje: 21,
    iva_reducido: 10,
    iva_superreducido: 4,
    moneda: 'EUR',
    formato_factura: 'FAC-{YEAR}-{NUM}',
    num_factura_actual: 1,
    mostrar_precios_con_iva: true,
    permitir_descuentos: true,
    descuento_max_porcentaje: 50
  });

  // Configuración de notificaciones
  const [configNotificaciones, setConfigNotificaciones] = useState({
    email_confirmacion_cita: true,
    email_recordatorio_cita: true,
    horas_antes_recordatorio: 24,
    sms_confirmacion_cita: false,
    sms_recordatorio_cita: false,
    notificar_cita_cancelada: true,
    notificar_nueva_cita: true,
    email_resumen_diario: false,
    email_resumen_semanal: true
  });

  // Configuración de citas
  const [configCitas, setConfigCitas] = useState({
    permitir_reservas_online: true,
    anticipacion_minima_horas: 2,
    anticipacion_maxima_dias: 30,
    permitir_cancelacion_cliente: true,
    horas_cancelacion_minimo: 24,
    duracion_default: 30,
    espacio_entre_citas: 0,
    mostrar_precios_online: true,
    requiere_confirmacion: false
  });

  // Configuración de seguridad
  const [configSeguridad, setConfigSeguridad] = useState({
    tiempo_sesion_minutos: 60,
    intentos_login_max: 5,
    bloqueo_minutos: 15,
    requiere_2fa: false,
    backup_automatico: true,
    frecuencia_backup: 'diario',
    mantener_backups_dias: 30,
    registrar_actividad: true
  });

  const sections = [
    { id: 'negocio', label: 'Datos del Negocio', icon: '🏪' },
    { id: 'fiscal', label: 'Facturación e IVA', icon: '📄' },
    { id: 'notificaciones', label: 'Notificaciones', icon: '🔔' },
    { id: 'citas', label: 'Citas Online', icon: '📅' },
    { id: 'seguridad', label: 'Seguridad', icon: '🔒' },
    { id: 'datos', label: 'Importar/Exportar', icon: '💾' }
  ];

  const diasSemana = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];

  // Cargar configuración
  const cargarConfiguracion = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/configuracion');
      if (response.data.success && response.data.data) {
        const config = response.data.data;
        if (config.negocio) setConfigNegocio(prev => ({ ...prev, ...config.negocio }));
        if (config.fiscal) setConfigFiscal(prev => ({ ...prev, ...config.fiscal }));
        if (config.notificaciones) setConfigNotificaciones(prev => ({ ...prev, ...config.notificaciones }));
        if (config.citas) setConfigCitas(prev => ({ ...prev, ...config.citas }));
        if (config.seguridad) setConfigSeguridad(prev => ({ ...prev, ...config.seguridad }));
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      // Los valores por defecto ya están establecidos
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => cargarConfiguracion(), 50);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, cargarConfiguracion]);

  // Guardar configuración
  const handleSave = async () => {
    try {
      setSaving(true);
      const configCompleta = {
        negocio: configNegocio,
        fiscal: configFiscal,
        notificaciones: configNotificaciones,
        citas: configCitas,
        seguridad: configSeguridad,
        ultima_actualizacion: new Date().toISOString()
      };

      await api.put('/configuracion', configCompleta);
      notifySuccess('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      notifyError('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  // Handlers para cambios
  const handleNegocioChange = (e) => {
    const { name, value } = e.target;
    setConfigNegocio(prev => ({ ...prev, [name]: value }));
  };

  const handleFiscalChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfigFiscal(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
    }));
  };

  const handleNotificacionesChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfigNotificaciones(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) : value)
    }));
  };

  const handleCitasChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfigCitas(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) : value)
    }));
  };

  const handleSeguridadChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfigSeguridad(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) : value)
    }));
  };

  const handleDiaLaborableToggle = (dia) => {
    setConfigNegocio(prev => ({
      ...prev,
      dias_laborables: prev.dias_laborables.includes(dia)
        ? prev.dias_laborables.filter(d => d !== dia)
        : [...prev.dias_laborables, dia]
    }));
  };

  // Exportar datos
  const handleExport = (tipo) => {
    const data = {
      version: '1.0',
      fecha_exportacion: new Date().toISOString(),
      tipo,
      datos: {
        configuracion: {
          negocio: configNegocio,
          fiscal: configFiscal,
          notificaciones: configNotificaciones,
          citas: configCitas,
          seguridad: configSeguridad
        }
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuriax-${tipo}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowExportModal(false);
    notifySuccess('Datos exportados correctamente');
  };

  // Importar datos
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.datos?.configuracion) {
          const config = data.datos.configuracion;
          if (config.negocio) setConfigNegocio(prev => ({ ...prev, ...config.negocio }));
          if (config.fiscal) setConfigFiscal(prev => ({ ...prev, ...config.fiscal }));
          if (config.notificaciones) setConfigNotificaciones(prev => ({ ...prev, ...config.notificaciones }));
          if (config.citas) setConfigCitas(prev => ({ ...prev, ...config.citas }));
          if (config.seguridad) setConfigSeguridad(prev => ({ ...prev, ...config.seguridad }));
          notifySuccess('Datos importados correctamente. Recuerda guardar los cambios.');
        } else {
          notifyError('Formato de archivo no válido');
        }
      } catch (err) {
        notifyError('Error al leer el archivo');
      }
    };
    reader.readAsText(file);
    setShowImportModal(false);
  };

  if (loading) {
    return (
      <div className="module-loading">
        <div className="spinner"></div>
        <p>Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="module-settings">
      {/* Sidebar de secciones */}
      <div className="settings-sidebar">
        {sections.map(section => (
          <button
            key={section.id}
            className={`settings-nav-btn ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            <span className="nav-icon">{section.icon}</span>
            <span className="nav-label">{section.label}</span>
          </button>
        ))}
        
        <div className="settings-save-box">
          <button 
            className="btn btn-primary btn-block"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '💾 Guardando...' : '💾 Guardar Todo'}
          </button>
        </div>
      </div>

      {/* Contenido de la sección */}
      <div className="settings-content">
        {/* Sección: Datos del Negocio */}
        {activeSection === 'negocio' && (
          <div className="settings-section">
            <div className="section-header">
              <h3>🏪 Datos del Negocio</h3>
              <p>Información general de tu establecimiento</p>
            </div>
            <div className="form-grid">
              <div className="form-group full">
                <label>Nombre del Negocio *</label>
                <input
                  type="text"
                  name="nombre"
                  value={configNegocio.nombre}
                  onChange={handleNegocioChange}
                  placeholder="Mi Salón de Belleza"
                />
              </div>
              <div className="form-group">
                <label>NIF/CIF</label>
                <input
                  type="text"
                  name="nif_cif"
                  value={configNegocio.nif_cif}
                  onChange={handleNegocioChange}
                  placeholder="B12345678"
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={configNegocio.telefono}
                  onChange={handleNegocioChange}
                  placeholder="912 345 678"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={configNegocio.email}
                  onChange={handleNegocioChange}
                  placeholder="contacto@misalon.com"
                />
              </div>
              <div className="form-group">
                <label>Web</label>
                <input
                  type="url"
                  name="web"
                  value={configNegocio.web}
                  onChange={handleNegocioChange}
                  placeholder="https://www.misalon.com"
                />
              </div>
              <div className="form-group full">
                <label>Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={configNegocio.direccion}
                  onChange={handleNegocioChange}
                  placeholder="Calle Principal, 123"
                />
              </div>
              <div className="form-group">
                <label>Código Postal</label>
                <input
                  type="text"
                  name="codigo_postal"
                  value={configNegocio.codigo_postal}
                  onChange={handleNegocioChange}
                  placeholder="28001"
                />
              </div>
              <div className="form-group">
                <label>Ciudad</label>
                <input
                  type="text"
                  name="ciudad"
                  value={configNegocio.ciudad}
                  onChange={handleNegocioChange}
                  placeholder="Madrid"
                />
              </div>
              <div className="form-group">
                <label>Provincia</label>
                <input
                  type="text"
                  name="provincia"
                  value={configNegocio.provincia}
                  onChange={handleNegocioChange}
                  placeholder="Madrid"
                />
              </div>

              <div className="form-divider full">
                <span>Horario de Atención</span>
              </div>

              <div className="form-group">
                <label>Hora Apertura</label>
                <input
                  type="time"
                  name="horario_apertura"
                  value={configNegocio.horario_apertura}
                  onChange={handleNegocioChange}
                />
              </div>
              <div className="form-group">
                <label>Hora Cierre</label>
                <input
                  type="time"
                  name="horario_cierre"
                  value={configNegocio.horario_cierre}
                  onChange={handleNegocioChange}
                />
              </div>
              <div className="form-group">
                <label>Intervalo de Citas (min)</label>
                <select
                  name="intervalo_citas"
                  value={configNegocio.intervalo_citas}
                  onChange={handleNegocioChange}
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos</option>
                </select>
              </div>

              <div className="form-group full">
                <label>Días Laborables</label>
                <div className="days-selector">
                  {diasSemana.map(dia => (
                    <label 
                      key={dia.key}
                      className={`day-option ${configNegocio.dias_laborables.includes(dia.key) ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={configNegocio.dias_laborables.includes(dia.key)}
                        onChange={() => handleDiaLaborableToggle(dia.key)}
                      />
                      <span>{dia.label.substring(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección: Facturación e IVA */}
        {activeSection === 'fiscal' && (
          <div className="settings-section">
            <div className="section-header">
              <h3>📄 Facturación e IVA</h3>
              <p>Configuración fiscal y de facturación</p>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>IVA General (%)</label>
                <input
                  type="number"
                  name="iva_porcentaje"
                  value={configFiscal.iva_porcentaje}
                  onChange={handleFiscalChange}
                  min="0"
                  max="100"
                />
              </div>
              <div className="form-group">
                <label>IVA Reducido (%)</label>
                <input
                  type="number"
                  name="iva_reducido"
                  value={configFiscal.iva_reducido}
                  onChange={handleFiscalChange}
                  min="0"
                  max="100"
                />
              </div>
              <div className="form-group">
                <label>IVA Superreducido (%)</label>
                <input
                  type="number"
                  name="iva_superreducido"
                  value={configFiscal.iva_superreducido}
                  onChange={handleFiscalChange}
                  min="0"
                  max="100"
                />
              </div>
              <div className="form-group">
                <label>Moneda</label>
                <select
                  name="moneda"
                  value={configFiscal.moneda}
                  onChange={handleFiscalChange}
                >
                  <option value="EUR">€ Euro (EUR)</option>
                  <option value="USD">$ Dólar (USD)</option>
                  <option value="GBP">£ Libra (GBP)</option>
                  <option value="MXN">$ Peso Mexicano (MXN)</option>
                </select>
              </div>

              <div className="form-divider full">
                <span>Numeración de Facturas</span>
              </div>

              <div className="form-group">
                <label>Formato de Factura</label>
                <input
                  type="text"
                  name="formato_factura"
                  value={configFiscal.formato_factura}
                  onChange={handleFiscalChange}
                  placeholder="FAC-{YEAR}-{NUM}"
                />
                <small className="form-hint">Variables: {'{YEAR}'}, {'{MONTH}'}, {'{NUM}'}</small>
              </div>
              <div className="form-group">
                <label>Próximo Número</label>
                <input
                  type="number"
                  name="num_factura_actual"
                  value={configFiscal.num_factura_actual}
                  onChange={handleFiscalChange}
                  min="1"
                />
              </div>

              <div className="form-divider full">
                <span>Opciones de Precios</span>
              </div>

              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    name="mostrar_precios_con_iva"
                    checked={configFiscal.mostrar_precios_con_iva}
                    onChange={handleFiscalChange}
                  />
                  <span className="switch-slider"></span>
                  <span className="switch-text">Mostrar precios con IVA incluido</span>
                </label>
              </div>
              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    name="permitir_descuentos"
                    checked={configFiscal.permitir_descuentos}
                    onChange={handleFiscalChange}
                  />
                  <span className="switch-slider"></span>
                  <span className="switch-text">Permitir descuentos</span>
                </label>
              </div>
              {configFiscal.permitir_descuentos && (
                <div className="form-group">
                  <label>Descuento Máximo (%)</label>
                  <input
                    type="number"
                    name="descuento_max_porcentaje"
                    value={configFiscal.descuento_max_porcentaje}
                    onChange={handleFiscalChange}
                    min="0"
                    max="100"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sección: Notificaciones */}
        {activeSection === 'notificaciones' && (
          <div className="settings-section">
            <div className="section-header">
              <h3>🔔 Notificaciones</h3>
              <p>Configura las notificaciones automáticas</p>
            </div>
            <div className="form-grid">
              <div className="form-divider full">
                <span>Notificaciones por Email</span>
              </div>
              
              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    name="email_confirmacion_cita"
                    checked={configNotificaciones.email_confirmacion_cita}
                    onChange={handleNotificacionesChange}
                  />
                  <span className="switch-slider"></span>
                  <span className="switch-text">Email de confirmación de cita</span>
                </label>
              </div>
              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    name="email_recordatorio_cita"
                    checked={configNotificaciones.email_recordatorio_cita}
                    onChange={handleNotificacionesChange}
                  />
                  <span className="switch-slider"></span>
                  <span className="switch-text">Email de recordatorio</span>
                </label>
              </div>
              {configNotificaciones.email_recordatorio_cita && (
                <div className="form-group">
                  <label>Horas antes del recordatorio</label>
                  <select
                    name="horas_antes_recordatorio"
                    value={configNotificaciones.horas_antes_recordatorio}
                    onChange={handleNotificacionesChange}
                  >
                    <option value={1}>1 hora antes</option>
                    <option value={2}>2 horas antes</option>
                    <option value={12}>12 horas antes</option>
                    <option value={24}>24 horas antes</option>
                    <option value={48}>48 horas antes</option>
                  </select>
                </div>
              )}

              <div className="form-divider full">
                <span>Notificaciones SMS (Premium)</span>
              </div>

              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    name="sms_confirmacion_cita"
                    checked={configNotificaciones.sms_confirmacion_cita}
                    onChange={handleNotificacionesChange}
                  />
                  <span className="switch-slider"></span>
                  <span className="switch-text">SMS de confirmación</span>
                </label>
              </div>
              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    name="sms_recordatorio_cita"
                    checked={configNotificaciones.sms_recordatorio_cita}
                    onChange={handleNotificacionesChange}
                  />
                  <span className="switch-slider"></span>
                  <span className="switch-text">SMS de recordatorio</span>
                </label>
              </div>

              <div className="form-divider full">
                <span>Notificaciones Internas</span>
              </div>

              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    name="notificar_nueva_cita"
                    checked={configNotificaciones.notificar_nueva_cita}
                    onChange={handleNotificacionesChange}
                  />
                  <span className="switch-slider"></span>
                  <span className="switch-text">Notificar nuevas citas</span>
                </label>
              </div>
              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    name="notificar_cita_cancelada"
                    checked={configNotificaciones.notificar_cita_cancelada}
                    onChange={handleNotificacionesChange}
                  />
                  <span className="switch-slider"></span>
                  <span className="switch-text">Notificar cancelaciones</span>
                </label>
              </div>

              <div className="form-divider full">
                <span>Resúmenes Automáticos</span>
              </div>

              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    name="email_resumen_diario"
                    checked={configNotificaciones.email_resumen_diario}
                    onChange={handleNotificacionesChange}
                  />
                  <span className="switch-slider"></span>
                  <span className="switch-text">Resumen diario por email</span>
                </label>
              </div>
              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    name="email_resumen_semanal"
                    checked={configNotificaciones.email_resumen_semanal}
                    onChange={handleNotificacionesChange}
                  />
                  <span className="switch-slider"></span>
                  <span className="switch-text">Resumen semanal por email</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Sección: Citas Online */}
        {activeSection === 'citas' && (
          <div className="settings-section">
            <div className="section-header">
              <h3>📅 Reservas Online</h3>
              <p>Configura las reservas desde tu web o app</p>
            </div>
            <div className="form-grid">
              <div className="form-group full">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    name="permitir_reservas_online"
                    checked={configCitas.permitir_reservas_online}
                    onChange={handleCitasChange}
                  />
                  <span className="switch-slider"></span>
                  <span className="switch-text">Permitir reservas online</span>
                </label>
              </div>

              {configCitas.permitir_reservas_online && (
                <>
                  <div className="form-group">
                    <label>Anticipación Mínima</label>
                    <select
                      name="anticipacion_minima_horas"
                      value={configCitas.anticipacion_minima_horas}
                      onChange={handleCitasChange}
                    >
                      <option value={1}>1 hora antes</option>
                      <option value={2}>2 horas antes</option>
                      <option value={4}>4 horas antes</option>
                      <option value={24}>1 día antes</option>
                      <option value={48}>2 días antes</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Anticipación Máxima</label>
                    <select
                      name="anticipacion_maxima_dias"
                      value={configCitas.anticipacion_maxima_dias}
                      onChange={handleCitasChange}
                    >
                      <option value={7}>1 semana</option>
                      <option value={14}>2 semanas</option>
                      <option value={30}>1 mes</option>
                      <option value={60}>2 meses</option>
                      <option value={90}>3 meses</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Duración por defecto (min)</label>
                    <select
                      name="duracion_default"
                      value={configCitas.duracion_default}
                      onChange={handleCitasChange}
                    >
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={60}>60 minutos</option>
                      <option value={90}>90 minutos</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Espacio entre citas (min)</label>
                    <input
                      type="number"
                      name="espacio_entre_citas"
                      value={configCitas.espacio_entre_citas}
                      onChange={handleCitasChange}
                      min="0"
                      max="60"
                    />
                  </div>

                  <div className="form-divider full">
                    <span>Cancelaciones</span>
                  </div>

                  <div className="form-group">
                    <label className="switch-label">
                      <input
                        type="checkbox"
                        name="permitir_cancelacion_cliente"
                        checked={configCitas.permitir_cancelacion_cliente}
                        onChange={handleCitasChange}
                      />
                      <span className="switch-slider"></span>
                      <span className="switch-text">Permitir cancelación por cliente</span>
                    </label>
                  </div>
                  {configCitas.permitir_cancelacion_cliente && (
                    <div className="form-group">
                      <label>Mínimo horas antes para cancelar</label>
                      <select
                        name="horas_cancelacion_minimo"
                        value={configCitas.horas_cancelacion_minimo}
                        onChange={handleCitasChange}
                      >
                        <option value={1}>1 hora</option>
                        <option value={2}>2 horas</option>
                        <option value={12}>12 horas</option>
                        <option value={24}>24 horas</option>
                        <option value={48}>48 horas</option>
                      </select>
                    </div>
                  )}

                  <div className="form-divider full">
                    <span>Opciones Adicionales</span>
                  </div>

                  <div className="form-group">
                    <label className="switch-label">
                      <input
                        type="checkbox"
                        name="mostrar_precios_online"
                        checked={configCitas.mostrar_precios_online}
                        onChange={handleCitasChange}
                      />
                      <span className="switch-slider"></span>
                      <span className="switch-text">Mostrar precios en reservas online</span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="switch-label">
                      <input
                        type="checkbox"
                        name="requiere_confirmacion"
                        checked={configCitas.requiere_confirmacion}
                        onChange={handleCitasChange}
                      />
                      <span className="switch-slider"></span>
                      <span className="switch-text">Requiere confirmación manual</span>
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Sección: Seguridad */}
        {activeSection === 'seguridad' && (
          <div className="settings-section">
            <div className="section-header">
              <h3>🔒 Seguridad y Backups</h3>
              <p>Configuración de seguridad y copias de seguridad</p>
            </div>
            <div className="form-grid">
              <div className="form-divider full">
                <span>Sesiones</span>
              </div>

              <div className="form-group">
                <label>Tiempo de sesión (minutos)</label>
                <input
                  type="number"
                  name="tiempo_sesion_minutos"
                  value={configSeguridad.tiempo_sesion_minutos}
                  onChange={handleSeguridadChange}
                  min="15"
                  max="480"
                />
              </div>
              <div className="form-group">
                <label>Intentos máximos de login</label>
                <input
                  type="number"
                  name="intentos_login_max"
                  value={configSeguridad.intentos_login_max}
                  onChange={handleSeguridadChange}
                  min="3"
                  max="10"
                />
              </div>
              <div className="form-group">
                <label>Tiempo de bloqueo (minutos)</label>
                <input
                  type="number"
                  name="bloqueo_minutos"
                  value={configSeguridad.bloqueo_minutos}
                  onChange={handleSeguridadChange}
                  min="5"
                  max="60"
                />
              </div>
              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    name="requiere_2fa"
                    checked={configSeguridad.requiere_2fa}
                    onChange={handleSeguridadChange}
                  />
                  <span className="switch-slider"></span>
                  <span className="switch-text">Requerir 2FA (Premium)</span>
                </label>
              </div>

              <div className="form-divider full">
                <span>Backups Automáticos</span>
              </div>

              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    name="backup_automatico"
                    checked={configSeguridad.backup_automatico}
                    onChange={handleSeguridadChange}
                  />
                  <span className="switch-slider"></span>
                  <span className="switch-text">Activar backups automáticos</span>
                </label>
              </div>
              {configSeguridad.backup_automatico && (
                <>
                  <div className="form-group">
                    <label>Frecuencia de backup</label>
                    <select
                      name="frecuencia_backup"
                      value={configSeguridad.frecuencia_backup}
                      onChange={handleSeguridadChange}
                    >
                      <option value="cada_6_horas">Cada 6 horas</option>
                      <option value="diario">Diario</option>
                      <option value="semanal">Semanal</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Mantener backups (días)</label>
                    <input
                      type="number"
                      name="mantener_backups_dias"
                      value={configSeguridad.mantener_backups_dias}
                      onChange={handleSeguridadChange}
                      min="7"
                      max="365"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    name="registrar_actividad"
                    checked={configSeguridad.registrar_actividad}
                    onChange={handleSeguridadChange}
                  />
                  <span className="switch-slider"></span>
                  <span className="switch-text">Registrar actividad del sistema</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Sección: Importar/Exportar */}
        {activeSection === 'datos' && (
          <div className="settings-section">
            <div className="section-header">
              <h3>💾 Importar/Exportar Datos</h3>
              <p>Gestiona tus datos y copias de seguridad</p>
            </div>
            
            <div className="data-actions">
              <div className="data-action-card">
                <div className="action-icon">📤</div>
                <h4>Exportar Datos</h4>
                <p>Descarga una copia de tu configuración y datos en formato JSON</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowExportModal(true)}
                >
                  Exportar
                </button>
              </div>

              <div className="data-action-card">
                <div className="action-icon">📥</div>
                <h4>Importar Datos</h4>
                <p>Restaura configuración desde un archivo JSON exportado previamente</p>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowImportModal(true)}
                >
                  Importar
                </button>
              </div>

              <div className="data-action-card warning">
                <div className="action-icon">⚠️</div>
                <h4>Restablecer Configuración</h4>
                <p>Restaura todos los ajustes a los valores predeterminados</p>
                <button 
                  className="btn btn-danger"
                  onClick={() => {
                    if (window.confirm('¿Estás seguro? Esta acción no se puede deshacer.')) {
                      notifySuccess('Configuración restablecida');
                    }
                  }}
                >
                  Restablecer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Exportar */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📤 Exportar Datos</h3>
              <button className="modal-close" onClick={() => setShowExportModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Selecciona qué datos deseas exportar:</p>
              <div className="export-options">
                <button 
                  className="export-option"
                  onClick={() => handleExport('configuracion')}
                >
                  <span className="option-icon">⚙️</span>
                  <span className="option-text">Solo Configuración</span>
                </button>
                <button 
                  className="export-option"
                  onClick={() => handleExport('completo')}
                >
                  <span className="option-icon">📦</span>
                  <span className="option-text">Backup Completo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Importar */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📥 Importar Datos</h3>
              <button className="modal-close" onClick={() => setShowImportModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="import-dropzone">
                <input
                  type="file"
                  id="import-file"
                  accept=".json"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                />
                <label htmlFor="import-file" className="dropzone-content">
                  <span className="dropzone-icon">📁</span>
                  <span className="dropzone-text">Selecciona un archivo JSON</span>
                  <span className="dropzone-hint">o arrastra y suelta aquí</span>
                </label>
              </div>
              <p className="import-warning">
                ⚠️ La importación sobrescribirá la configuración actual
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsModule;
