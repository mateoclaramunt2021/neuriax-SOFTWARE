/**
 * Appointments Module - Sistema de Agenda Visual Profesional
 * NEURIAX Salon Manager
 * Calendario interactivo con vistas Día/Semana/Mes
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import '../../styles/modules.css';
import '../../styles/calendar.css';

export default function AppointmentsModule() {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const { isAuthenticated } = useAuth();
  
  // Estados principales
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'day', 'week', 'month'
  
  // Modal de cita
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  
  // Datos para el formulario
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  
  // Formulario de cita
  const [formData, setFormData] = useState({
    cliente_id: '',
    empleado_id: '',
    servicios_ids: [],
    fecha: '',
    hora: '',
    duracion: 30,
    notas: '',
    estado: 'confirmed'
  });

  // Horario del negocio
  const businessHours = {
    start: 9,
    end: 20,
    interval: 30
  };

  // Cargar todos los datos
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [citasRes, clientesRes, empleadosRes, serviciosRes] = await Promise.allSettled([
        api.get('/citas'),
        api.get('/clientes'),
        api.get('/empleados'),
        api.get('/servicios')
      ]);

      if (citasRes.status === 'fulfilled') {
        const data = citasRes.value?.data;
        const citasList = data?.citas || data?.data || [];
        setAppointments(citasList.map(c => ({
          id: c.id,
          cliente_id: c.cliente_id,
          cliente_nombre: c.cliente?.nombre || 'Sin cliente',
          cliente_telefono: c.cliente?.telefono || '',
          empleado_id: c.empleado_id,
          empleado_nombre: c.empleado?.nombre || 'Sin asignar',
          servicios_ids: c.servicios_ids || [],
          servicios: c.servicios || [],
          fecha: c.fecha?.split('T')[0] || c.fecha,
          hora: c.hora || '09:00',
          duracion: c.duracion || 30,
          notas: c.notas || '',
          estado: c.estado || 'confirmed'
        })));
      }

      if (clientesRes.status === 'fulfilled') {
        const data = clientesRes.value?.data;
        setClients(data?.data || data?.clientes || []);
      }

      if (empleadosRes.status === 'fulfilled') {
        const data = empleadosRes.value?.data;
        const list = data?.data || data?.empleados || [];
        setEmployees(list.filter(e => e.activo !== false));
      }

      if (serviciosRes.status === 'fulfilled') {
        const data = serviciosRes.value?.data;
        setServices(data?.data || data?.servicios || []);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      notifyError('Error al cargar datos de la agenda');
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => loadAllData(), 50);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, loadAllData]);

  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const diasCortos = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const getWeekDays = useMemo(() => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  const getMonthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = startDay; i > 0; i--) {
      const day = new Date(year, month, 1 - i);
      days.push({ date: day, isCurrentMonth: false });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = businessHours.start; hour < businessHours.end; hour++) {
      for (let min = 0; min < 60; min += businessHours.interval) {
        slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  }, [businessHours.start, businessHours.end, businessHours.interval]);

  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const formatDateKey = (date) => date.toISOString().split('T')[0];

  const getAppointmentsForDay = (date) => {
    const dateKey = formatDateKey(date);
    return appointments.filter(apt => apt.fecha === dateKey);
  };

  const getAppointmentsForSlot = (date, time) => {
    const dateKey = formatDateKey(date);
    return appointments.filter(apt => apt.fecha === dateKey && apt.hora === time);
  };

  const openNewAppointment = (date, time) => {
    setEditingAppointment(null);
    setFormData({
      cliente_id: '',
      empleado_id: '',
      servicios_ids: [],
      fecha: formatDateKey(date),
      hora: time || '09:00',
      duracion: 30,
      notas: '',
      estado: 'confirmed'
    });
    setShowModal(true);
  };

  const openEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      cliente_id: appointment.cliente_id || '',
      empleado_id: appointment.empleado_id || '',
      servicios_ids: appointment.servicios_ids || [],
      fecha: appointment.fecha,
      hora: appointment.hora,
      duracion: appointment.duracion || 30,
      notas: appointment.notas || '',
      estado: appointment.estado || 'confirmed'
    });
    setShowModal(true);
  };

  const handleSaveAppointment = async (e) => {
    e.preventDefault();
    
    if (!formData.fecha || !formData.hora) {
      notifyError('Fecha y hora son obligatorios');
      return;
    }

    setLoading(true);
    try {
      const citaData = {
        cliente_id: formData.cliente_id ? parseInt(formData.cliente_id) : null,
        empleado_id: formData.empleado_id ? parseInt(formData.empleado_id) : null,
        servicios_ids: formData.servicios_ids.map(id => parseInt(id)),
        fecha: formData.fecha,
        hora: formData.hora,
        duracion: parseInt(formData.duracion) || 30,
        notas: formData.notas,
        estado: formData.estado
      };

      if (editingAppointment) {
        await api.put(`/citas/${editingAppointment.id}`, citaData);
        notifySuccess('Cita actualizada correctamente');
      } else {
        await api.post('/citas', citaData);
        notifySuccess('Cita creada correctamente');
      }

      await loadAllData();
      setShowModal(false);
    } catch (error) {
      console.error('Error guardando cita:', error);
      notifyError('Error al guardar la cita');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!editingAppointment || !window.confirm('¿Eliminar esta cita?')) return;

    setLoading(true);
    try {
      await api.delete(`/citas/${editingAppointment.id}`);
      notifySuccess('Cita eliminada');
      await loadAllData();
      setShowModal(false);
    } catch (error) {
      console.error('Error eliminando cita:', error);
      notifyError('Error al eliminar la cita');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await api.put(`/citas/${appointmentId}`, { estado: newStatus });
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId ? { ...apt, estado: newStatus } : apt
      ));
      notifySuccess('Estado actualizado');
    } catch (error) {
      notifyError('Error al actualizar estado');
    }
  };

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      servicios_ids: prev.servicios_ids.includes(serviceId)
        ? prev.servicios_ids.filter(id => id !== serviceId)
        : [...prev.servicios_ids, serviceId]
    }));
  };

  const calculateTotalDuration = () => {
    return formData.servicios_ids.reduce((total, id) => {
      const service = services.find(s => s.id === parseInt(id));
      return total + (service?.duracion || 30);
    }, 0) || 30;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'completed': return '#6366f1';
      case 'cancelled': return '#ef4444';
      case 'no-show': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  const todayStats = useMemo(() => {
    const today = formatDateKey(new Date());
    const todayAppts = appointments.filter(apt => apt.fecha === today);
    return {
      total: todayAppts.length,
      confirmed: todayAppts.filter(a => a.estado === 'confirmed').length,
      pending: todayAppts.filter(a => a.estado === 'pending').length,
      completed: todayAppts.filter(a => a.estado === 'completed').length
    };
  }, [appointments]);

  const renderDayView = () => (
    <div className="calendar-day-view">
      <div className="day-header">
        <h3>{diasSemana[currentDate.getDay()]}, {currentDate.getDate()} de {meses[currentDate.getMonth()]}</h3>
      </div>
      <div className="day-timeline">
        {timeSlots.map(time => {
          const slotAppts = getAppointmentsForSlot(currentDate, time);
          return (
            <div key={time} className="time-slot" onClick={() => openNewAppointment(currentDate, time)}>
              <div className="time-label">{time}</div>
              <div className="slot-content">
                {slotAppts.map(apt => (
                  <div
                    key={apt.id}
                    className="appointment-block"
                    style={{ borderLeftColor: getStatusColor(apt.estado), height: `${(apt.duracion / 30) * 50}px` }}
                    onClick={(e) => { e.stopPropagation(); openEditAppointment(apt); }}
                  >
                    <div className="apt-time">{apt.hora}</div>
                    <div className="apt-client">{apt.cliente_nombre}</div>
                    <div className="apt-service">{apt.servicios?.map(s => s.nombre).join(', ') || 'Servicio'}</div>
                    {apt.empleado_nombre && <div className="apt-employee">👤 {apt.empleado_nombre}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderWeekView = () => (
    <div className="calendar-week-view">
      <div className="week-header">
        <div className="time-header-cell"></div>
        {getWeekDays.map((day, idx) => {
          const isToday = formatDateKey(day) === formatDateKey(new Date());
          return (
            <div key={idx} className={`week-day-header ${isToday ? 'today' : ''}`}>
              <span className="day-name">{diasCortos[day.getDay()]}</span>
              <span className="day-number">{day.getDate()}</span>
            </div>
          );
        })}
      </div>
      <div className="week-body">
        {timeSlots.map(time => (
          <div key={time} className="week-row">
            <div className="time-row-label">{time}</div>
            {getWeekDays.map((day, dayIdx) => {
              const slotAppts = getAppointmentsForSlot(day, time);
              return (
                <div key={dayIdx} className="week-cell" onClick={() => openNewAppointment(day, time)}>
                  {slotAppts.map(apt => (
                    <div
                      key={apt.id}
                      className="week-appointment"
                      style={{ backgroundColor: getStatusColor(apt.estado) }}
                      onClick={(e) => { e.stopPropagation(); openEditAppointment(apt); }}
                      title={`${apt.cliente_nombre} - ${apt.hora}`}
                    >
                      <span className="apt-mini-name">{apt.cliente_nombre?.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  const renderMonthView = () => (
    <div className="calendar-month-view">
      <div className="month-header">
        {diasCortos.map((day, idx) => (
          <div key={idx} className="month-day-name">{day}</div>
        ))}
      </div>
      <div className="month-grid">
        {getMonthDays.map(({ date, isCurrentMonth }, idx) => {
          const dayAppts = getAppointmentsForDay(date);
          const isToday = formatDateKey(date) === formatDateKey(new Date());
          return (
            <div
              key={idx}
              className={`month-day ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}`}
              onClick={() => { setCurrentDate(date); setViewMode('day'); }}
            >
              <div className="month-day-number">{date.getDate()}</div>
              <div className="month-day-appointments">
                {dayAppts.slice(0, 3).map(apt => (
                  <div key={apt.id} className="month-apt-dot" style={{ backgroundColor: getStatusColor(apt.estado) }} title={`${apt.hora} - ${apt.cliente_nombre}`} />
                ))}
                {dayAppts.length > 3 && <span className="more-appointments">+{dayAppts.length - 3}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="appointments-module">
      <div className="calendar-header">
        <div className="calendar-title">
          <h2>📅 Agenda de Citas</h2>
          <div className="today-stats">
            <span className="stat confirmed">✓ {todayStats.confirmed}</span>
            <span className="stat pending">⏳ {todayStats.pending}</span>
            <span className="stat completed">✔ {todayStats.completed}</span>
          </div>
        </div>
        
        <div className="calendar-controls">
          <div className="view-selector">
            <button className={`view-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}>Día</button>
            <button className={`view-btn ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>Semana</button>
            <button className={`view-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>Mes</button>
          </div>

          <div className="date-navigation">
            <button className="nav-btn" onClick={() => navigate(-1)}>‹</button>
            <button className="today-btn" onClick={goToToday}>Hoy</button>
            <button className="nav-btn" onClick={() => navigate(1)}>›</button>
          </div>

          <div className="current-date">
            {viewMode === 'month' ? (
              <span>{meses[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            ) : viewMode === 'week' ? (
              <span>{getWeekDays[0].getDate()} - {getWeekDays[6].getDate()} {meses[currentDate.getMonth()]}</span>
            ) : (
              <span>{currentDate.getDate()} {meses[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            )}
          </div>

          <button className="new-appointment-btn" onClick={() => openNewAppointment(new Date(), '09:00')}>➕ Nueva Cita</button>
        </div>
      </div>

      {loading && <div className="calendar-loading"><div className="spinner"></div><span>Cargando agenda...</span></div>}

      <div className="calendar-container">
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
      </div>

      {viewMode === 'day' && (
        <div className="day-appointments-list">
          <h3>Citas del día ({getAppointmentsForDay(currentDate).length})</h3>
          <div className="appointments-cards">
            {getAppointmentsForDay(currentDate).length === 0 ? (
              <div className="no-appointments">
                <span>📭</span>
                <p>No hay citas programadas para este día</p>
                <button onClick={() => openNewAppointment(currentDate, '09:00')}>Agendar primera cita</button>
              </div>
            ) : (
              getAppointmentsForDay(currentDate).sort((a, b) => a.hora.localeCompare(b.hora)).map(apt => (
                <div key={apt.id} className="appointment-card" style={{ borderLeftColor: getStatusColor(apt.estado) }} onClick={() => openEditAppointment(apt)}>
                  <div className="card-time">{apt.hora}</div>
                  <div className="card-content">
                    <h4>{apt.cliente_nombre}</h4>
                    <p className="card-services">{apt.servicios?.map(s => s.nombre).join(', ') || 'Sin servicio'}</p>
                    {apt.empleado_nombre && <p className="card-employee">👤 {apt.empleado_nombre}</p>}
                  </div>
                  <div className="card-actions">
                    <select value={apt.estado} onChange={(e) => { e.stopPropagation(); handleStatusChange(apt.id, e.target.value); }} onClick={(e) => e.stopPropagation()} className="status-select">
                      <option value="confirmed">✅ Confirmada</option>
                      <option value="pending">⏳ Pendiente</option>
                      <option value="completed">✔ Completada</option>
                      <option value="cancelled">✕ Cancelada</option>
                      <option value="no-show">🚫 No asistió</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="appointment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingAppointment ? '✏️ Editar Cita' : '📅 Nueva Cita'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveAppointment}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>📆 Fecha *</label>
                    <input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>🕐 Hora *</label>
                    <select value={formData.hora} onChange={(e) => setFormData({ ...formData, hora: e.target.value })} required>
                      {timeSlots.map(time => (<option key={time} value={time}>{time}</option>))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>👤 Cliente</label>
                  <select value={formData.cliente_id} onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}>
                    <option value="">-- Seleccionar cliente --</option>
                    {clients.map(client => (<option key={client.id} value={client.id}>{client.nombre} {client.telefono ? `(${client.telefono})` : ''}</option>))}
                  </select>
                </div>

                <div className="form-group">
                  <label>💼 Empleado asignado</label>
                  <select value={formData.empleado_id} onChange={(e) => setFormData({ ...formData, empleado_id: e.target.value })}>
                    <option value="">-- Sin asignar --</option>
                    {employees.map(emp => (<option key={emp.id} value={emp.id}>{emp.nombre} {emp.apellidos || ''} - {emp.rol || 'Empleado'}</option>))}
                  </select>
                </div>

                <div className="form-group">
                  <label>✂️ Servicios</label>
                  <div className="services-checkboxes">
                    {services.map(service => (
                      <label key={service.id} className="service-checkbox">
                        <input type="checkbox" checked={formData.servicios_ids.includes(service.id)} onChange={() => handleServiceToggle(service.id)} />
                        <span className="service-name">{service.nombre || service.name}</span>
                        <span className="service-duration">{service.duracion || 30} min</span>
                        <span className="service-price">€{service.precio || service.price || 0}</span>
                      </label>
                    ))}
                  </div>
                  {formData.servicios_ids.length > 0 && <div className="duration-total">Duración total: {calculateTotalDuration()} minutos</div>}
                </div>

                <div className="form-group">
                  <label>📊 Estado</label>
                  <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })}>
                    <option value="confirmed">✅ Confirmada</option>
                    <option value="pending">⏳ Pendiente</option>
                    <option value="completed">✔ Completada</option>
                    <option value="cancelled">✕ Cancelada</option>
                    <option value="no-show">🚫 No asistió</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>📝 Notas</label>
                  <textarea value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} placeholder="Notas adicionales sobre la cita..." rows={3} />
                </div>
              </div>

              <div className="modal-footer">
                {editingAppointment && <button type="button" className="delete-btn" onClick={handleDeleteAppointment}>🗑️ Eliminar</button>}
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="save-btn" disabled={loading}>{loading ? 'Guardando...' : (editingAppointment ? 'Actualizar' : 'Crear Cita')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
