/**
 * EmployeesModule - Gestión de Empleados
 * NEURIAX Salon Manager
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './modules.css';

const EmployeesModule = () => {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const { isAuthenticated } = useAuth();
  
  // States
  const [empleados, setEmpleados] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    rol: 'empleado',
    especialidades: [],
    comision_porcentaje: 10,
    salario_base: '',
    fecha_contratacion: '',
    documento_identidad: '',
    direccion: '',
    notas: '',
    activo: true
  });

  // Horario semanal inicial (preparado para futuras funcionalidades)
  // eslint-disable-next-line no-unused-vars
  const defaultSchedule = {
    lunes: { activo: true, entrada: '09:00', salida: '18:00', descanso_inicio: '14:00', descanso_fin: '15:00' },
    martes: { activo: true, entrada: '09:00', salida: '18:00', descanso_inicio: '14:00', descanso_fin: '15:00' },
    miercoles: { activo: true, entrada: '09:00', salida: '18:00', descanso_inicio: '14:00', descanso_fin: '15:00' },
    jueves: { activo: true, entrada: '09:00', salida: '18:00', descanso_inicio: '14:00', descanso_fin: '15:00' },
    viernes: { activo: true, entrada: '09:00', salida: '18:00', descanso_inicio: '14:00', descanso_fin: '15:00' },
    sabado: { activo: true, entrada: '09:00', salida: '14:00', descanso_inicio: null, descanso_fin: null },
    domingo: { activo: false, entrada: null, salida: null, descanso_inicio: null, descanso_fin: null }
  };

  const roles = [
    { value: 'admin', label: 'Administrador', icon: '👑' },
    { value: 'gerente', label: 'Gerente', icon: '🎯' },
    { value: 'estilista', label: 'Estilista', icon: '✂️' },
    { value: 'empleado', label: 'Empleado', icon: '👤' },
    { value: 'recepcion', label: 'Recepción', icon: '📞' }
  ];

  // Cargar datos - solo una vez al montar
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [empResponse, servResponse] = await Promise.allSettled([
        api.get('/empleados'),
        api.get('/servicios')
      ]);
      
      if (empResponse.status === 'fulfilled') {
        const data = empResponse.value?.data;
        setEmpleados(Array.isArray(data) ? data : (data?.data || data?.empleados || []));
      }
      
      if (servResponse.status === 'fulfilled') {
        const data = servResponse.value?.data;
        setServicios(Array.isArray(data) ? data : (data?.data || data?.servicios || []));
      }
      
      if (empResponse.status === 'rejected' || servResponse.status === 'rejected') {
        setError('Error al cargar algunos datos.');
      }
    } catch (err) {
      setError('Error al cargar empleados o servicios.');
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => cargarDatos(), 50);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, cargarDatos]);

  // Filtrar empleados
  const empleadosFiltrados = empleados.filter(emp => {
    const fullName = `${emp.nombre} ${emp.apellidos}`.toLowerCase();
    const matchSearch = fullName.includes(searchTerm.toLowerCase()) ||
                       emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'all' || emp.rol === filterRole;
    const matchStatus = filterStatus === 'all' ||
                       (filterStatus === 'active' && emp.activo) ||
                       (filterStatus === 'inactive' && !emp.activo);
    return matchSearch && matchRole && matchStatus;
  });

  // Estadísticas
  const stats = {
    totalEmpleados: empleados.length,
    activos: empleados.filter(e => e.activo).length,
    estilistas: empleados.filter(e => e.rol === 'estilista' && e.activo).length,
    serviciosMes: empleados.reduce((sum, e) => sum + (e.servicios_mes || 0), 0)
  };

  // Handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEspecialidadToggle = (especialidad) => {
    setFormData(prev => ({
      ...prev,
      especialidades: prev.especialidades.includes(especialidad)
        ? prev.especialidades.filter(e => e !== especialidad)
        : [...prev.especialidades, especialidad]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (editingEmployee) {
        // Update employee in backend
        const res = await api.put(`/empleados/${editingEmployee.id}`, formData);
        setEmpleados(empleados.map(emp =>
          emp.id === editingEmployee.id ? res.data : emp
        ));
        notifySuccess('Empleado actualizado correctamente');
      } else {
        // Create new employee in backend
        const res = await api.post('/empleados', formData);
        setEmpleados(prev => [...prev, res.data]);
        notifySuccess('Empleado creado correctamente');
      }
      closeModal();
    } catch (err) {
      setError('Error al guardar el empleado');
      notifyError('Error al guardar el empleado');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (empleado) => {
    setEditingEmployee(empleado);
    setFormData({
      nombre: empleado.nombre,
      apellidos: empleado.apellidos,
      email: empleado.email,
      telefono: empleado.telefono || '',
      rol: empleado.rol,
      especialidades: empleado.especialidades || [],
      comision_porcentaje: empleado.comision_porcentaje || 10,
      salario_base: empleado.salario_base || '',
      fecha_contratacion: empleado.fecha_contratacion || '',
      documento_identidad: empleado.documento_identidad || '',
      direccion: empleado.direccion || '',
      notas: empleado.notas || '',
      activo: empleado.activo
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const emp = empleados.find(e => e.id === id);
      const res = await api.put(`/empleados/${id}`, { ...emp, activo: !emp.activo });
      setEmpleados(empleados.map(e => e.id === id ? res.data : e));
      notifySuccess('Estado actualizado');
    } catch (err) {
      setError('Error al actualizar el estado');
      notifyError('Error al actualizar el estado');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este empleado?')) return;
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/empleados/${id}`);
      setEmpleados(prev => prev.filter(e => e.id !== id));
      notifySuccess('Empleado eliminado');
    } catch (err) {
      setError('Error al eliminar el empleado');
      notifyError('Error al eliminar el empleado');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = (empleado) => {
    setSelectedEmployee(empleado);
    setShowScheduleModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setActiveTab('info');
    setFormData({
      nombre: '',
      apellidos: '',
      email: '',
      telefono: '',
      rol: 'empleado',
      especialidades: [],
      comision_porcentaje: 10,
      salario_base: '',
      fecha_contratacion: '',
      documento_identidad: '',
      direccion: '',
      notas: '',
      activo: true
    });
  };

  const getRolInfo = (rol) => {
    return roles.find(r => r.value === rol) || { label: rol, icon: '👤' };
  };

  if (loading) {
    return (
      <div className="module-loading">
        <div className="spinner"></div>
        <p>Cargando empleados...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="module-employees">
      {/* Header con estadísticas */}
      <div className="module-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalEmpleados}</span>
            <span className="stat-label">Total Empleados</span>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">{stats.activos}</span>
            <span className="stat-label">Activos</span>
          </div>
        </div>
        <div className="stat-card primary">
          <div className="stat-icon">✂️</div>
          <div className="stat-info">
            <span className="stat-value">{stats.estilistas}</span>
            <span className="stat-label">Estilistas</span>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-value">{stats.serviciosMes}</span>
            <span className="stat-label">Servicios/Mes</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="module-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar empleado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los roles</option>
            {roles.map(rol => (
              <option key={rol.value} value={rol.value}>{rol.icon} {rol.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <span>➕</span> Nuevo Empleado
          </button>
        </div>
      </div>

      {/* Grid de empleados */}
      <div className="employees-grid">
        {empleadosFiltrados.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">👥</div>
            <p>No hay empleados que mostrar</p>
          </div>
        ) : (
          empleadosFiltrados.map(empleado => {
            const rolInfo = getRolInfo(empleado.rol);
            return (
              <div 
                key={empleado.id} 
                className={`employee-card ${!empleado.activo ? 'inactive' : ''}`}
              >
                <div className="employee-header">
                  <div className="employee-avatar">
                    {empleado.nombre.charAt(0)}{empleado.apellidos.charAt(0)}
                  </div>
                  <div className="employee-status-badge">
                    <span className={`status-dot ${empleado.activo ? 'active' : 'inactive'}`}></span>
                    {empleado.activo ? 'Activo' : 'Inactivo'}
                  </div>
                </div>

                <div className="employee-info">
                  <h3 className="employee-name">{empleado.nombre} {empleado.apellidos}</h3>
                  <span className="employee-role">
                    <span className="role-icon">{rolInfo.icon}</span>
                    {rolInfo.label}
                  </span>
                </div>

                <div className="employee-contact">
                  <div className="contact-item">
                    <span className="contact-icon">📧</span>
                    <span className="contact-value">{empleado.email}</span>
                  </div>
                  {empleado.telefono && (
                    <div className="contact-item">
                      <span className="contact-icon">📞</span>
                      <span className="contact-value">{empleado.telefono}</span>
                    </div>
                  )}
                </div>

                {empleado.especialidades && empleado.especialidades.length > 0 && (
                  <div className="employee-specialties">
                    {empleado.especialidades.slice(0, 3).map((esp, idx) => (
                      <span key={idx} className="specialty-tag">{esp}</span>
                    ))}
                    {empleado.especialidades.length > 3 && (
                      <span className="specialty-more">+{empleado.especialidades.length - 3}</span>
                    )}
                  </div>
                )}

                {empleado.rol === 'estilista' && (
                  <div className="employee-stats">
                    <div className="emp-stat">
                      <span className="emp-stat-value">{empleado.servicios_mes || 0}</span>
                      <span className="emp-stat-label">Servicios</span>
                    </div>
                    <div className="emp-stat">
                      <span className="emp-stat-value">€{empleado.ingresos_mes || 0}</span>
                      <span className="emp-stat-label">Ingresos</span>
                    </div>
                    <div className="emp-stat">
                      <span className="emp-stat-value">{empleado.comision_porcentaje}%</span>
                      <span className="emp-stat-label">Comisión</span>
                    </div>
                  </div>
                )}

                <div className="employee-actions">
                  <button
                    className="action-btn schedule"
                    onClick={() => handleSchedule(empleado)}
                    title="Horario"
                  >
                    📅
                  </button>
                  <button
                    className="action-btn edit"
                    onClick={() => handleEdit(empleado)}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    className="action-btn toggle"
                    onClick={() => handleToggleStatus(empleado.id)}
                    title={empleado.activo ? 'Desactivar' : 'Activar'}
                  >
                    {empleado.activo ? '🔒' : '🔓'}
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDelete(empleado.id)}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de empleado */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            
            {/* Tabs */}
            <div className="modal-tabs">
              <button
                className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                👤 Información
              </button>
              <button
                className={`tab-btn ${activeTab === 'work' ? 'active' : ''}`}
                onClick={() => setActiveTab('work')}
              >
                💼 Laboral
              </button>
              <button
                className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
                onClick={() => setActiveTab('skills')}
              >
                ✂️ Especialidades
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Tab: Información Personal */}
                {activeTab === 'info' && (
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Nombre *</label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        required
                        placeholder="Nombre"
                      />
                    </div>
                    <div className="form-group">
                      <label>Apellidos *</label>
                      <input
                        type="text"
                        name="apellidos"
                        value={formData.apellidos}
                        onChange={handleInputChange}
                        required
                        placeholder="Apellidos"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="email@ejemplo.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>Teléfono</label>
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        placeholder="600 000 000"
                      />
                    </div>
                    <div className="form-group">
                      <label>DNI/NIE</label>
                      <input
                        type="text"
                        name="documento_identidad"
                        value={formData.documento_identidad}
                        onChange={handleInputChange}
                        placeholder="12345678A"
                      />
                    </div>
                    <div className="form-group">
                      <label>Rol *</label>
                      <select
                        name="rol"
                        value={formData.rol}
                        onChange={handleInputChange}
                        required
                      >
                        {roles.map(rol => (
                          <option key={rol.value} value={rol.value}>
                            {rol.icon} {rol.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group full">
                      <label>Dirección</label>
                      <input
                        type="text"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleInputChange}
                        placeholder="Dirección completa"
                      />
                    </div>
                  </div>
                )}

                {/* Tab: Información Laboral */}
                {activeTab === 'work' && (
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Fecha de Contratación</label>
                      <input
                        type="date"
                        name="fecha_contratacion"
                        value={formData.fecha_contratacion}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Salario Base (€)</label>
                      <input
                        type="number"
                        name="salario_base"
                        value={formData.salario_base}
                        onChange={handleInputChange}
                        min="0"
                        step="50"
                        placeholder="1200"
                      />
                    </div>
                    <div className="form-group">
                      <label>Comisión (%)</label>
                      <input
                        type="number"
                        name="comision_porcentaje"
                        value={formData.comision_porcentaje}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        placeholder="10"
                      />
                    </div>
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="activo"
                          checked={formData.activo}
                          onChange={handleInputChange}
                        />
                        <span className="checkbox-text">Empleado Activo</span>
                      </label>
                    </div>
                    <div className="form-group full">
                      <label>Notas</label>
                      <textarea
                        name="notas"
                        value={formData.notas}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Notas adicionales..."
                      />
                    </div>
                  </div>
                )}

                {/* Tab: Especialidades */}
                {activeTab === 'skills' && (
                  <div className="skills-section">
                    <p className="skills-hint">Selecciona las especialidades del empleado:</p>
                    <div className="skills-grid">
                      {['Corte Mujer', 'Corte Hombre', 'Color', 'Mechas', 'Balayage', 
                        'Peinados', 'Tratamientos', 'Alisados', 'Permanentes', 
                        'Barbería', 'Manicura', 'Pedicura', 'Extensiones', 'Maquillaje'].map(skill => (
                        <label 
                          key={skill} 
                          className={`skill-option ${formData.especialidades.includes(skill) ? 'selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.especialidades.includes(skill)}
                            onChange={() => handleEspecialidadToggle(skill)}
                          />
                          <span className="skill-name">{skill}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEmployee ? 'Guardar Cambios' : 'Crear Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de horario */}
      {showScheduleModal && selectedEmployee && (
        <ScheduleModal
          empleado={selectedEmployee}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedEmployee(null);
          }}
          onSave={(horario) => {
            const updated = empleados.map(emp =>
              emp.id === selectedEmployee.id ? { ...emp, horario } : emp
            );
            setEmpleados(updated);
            setShowScheduleModal(false);
            setSelectedEmployee(null);
            notifySuccess('Horario actualizado');
          }}
        />
      )}
    </div>
  );
};

/**
 * Modal de horario semanal
 */
const ScheduleModal = ({ empleado, onClose, onSave }) => {
  const [horario, setHorario] = useState(empleado.horario || {
    lunes: { activo: true, entrada: '09:00', salida: '18:00' },
    martes: { activo: true, entrada: '09:00', salida: '18:00' },
    miercoles: { activo: true, entrada: '09:00', salida: '18:00' },
    jueves: { activo: true, entrada: '09:00', salida: '18:00' },
    viernes: { activo: true, entrada: '09:00', salida: '18:00' },
    sabado: { activo: true, entrada: '09:00', salida: '14:00' },
    domingo: { activo: false, entrada: null, salida: null }
  });

  const dias = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];

  const handleDayChange = (dia, field, value) => {
    setHorario(prev => ({
      ...prev,
      [dia]: { ...prev[dia], [field]: value }
    }));
  };

  const handleToggleDay = (dia) => {
    setHorario(prev => ({
      ...prev,
      [dia]: { 
        ...prev[dia], 
        activo: !prev[dia].activo,
        entrada: !prev[dia].activo ? '09:00' : null,
        salida: !prev[dia].activo ? '18:00' : null
      }
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📅 Horario de {empleado.nombre} {empleado.apellidos}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="schedule-grid">
            {dias.map(dia => (
              <div 
                key={dia.key} 
                className={`schedule-day ${horario[dia.key]?.activo ? 'active' : 'inactive'}`}
              >
                <div className="day-header">
                  <label className="day-toggle">
                    <input
                      type="checkbox"
                      checked={horario[dia.key]?.activo || false}
                      onChange={() => handleToggleDay(dia.key)}
                    />
                    <span className="day-name">{dia.label}</span>
                  </label>
                </div>
                {horario[dia.key]?.activo && (
                  <div className="day-times">
                    <div className="time-field">
                      <label>Entrada</label>
                      <input
                        type="time"
                        value={horario[dia.key]?.entrada || '09:00'}
                        onChange={(e) => handleDayChange(dia.key, 'entrada', e.target.value)}
                      />
                    </div>
                    <div className="time-field">
                      <label>Salida</label>
                      <input
                        type="time"
                        value={horario[dia.key]?.salida || '18:00'}
                        onChange={(e) => handleDayChange(dia.key, 'salida', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => onSave(horario)}
          >
            Guardar Horario
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeesModule;
