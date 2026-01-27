/**
 * CajaModule - Sistema de Caja y Arqueo Profesional
 * NEURIAX Salon Manager
 * 
 * Funcionalidades:
 * - Apertura y cierre de caja
 * - Registro de movimientos (entradas/salidas/gastos)
 * - Arqueo de caja con conteo de efectivo
 * - Historial de cajas y movimientos
 * - Estadísticas y reportes
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './caja.css';

export default function CajaModule() {
  const { success, error, warning } = useNotification();
  const { isAuthenticated } = useAuth();
  
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [cajaActual, setCajaActual] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [historialCajas, setHistorialCajas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [categorias, setCategorias] = useState([]);
  
  // Estados de vista
  const [activeTab, setActiveTab] = useState('resumen'); // resumen, movimientos, historial, estadisticas
  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [showCerrarModal, setShowCerrarModal] = useState(false);
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  const [showArqueoModal, setShowArqueoModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(null);
  const [tipoMovimiento, setTipoMovimiento] = useState('gasto');
  
  // Forms
  const [formAbrir, setFormAbrir] = useState({ monto_inicial: '', notas: '' });
  const [formCerrar, setFormCerrar] = useState({ monto_final: '', notas: '' });
  const [formMovimiento, setFormMovimiento] = useState({ monto: '', concepto: '', categoria: 'general' });
  const [formArqueo, setFormArqueo] = useState({ conteo_efectivo: '', notas: '' });
  
  // Cargar datos iniciales
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cajaRes, movRes, histRes, catRes] = await Promise.allSettled([
        api.get('/caja/actual'),
        api.get('/caja/movimientos'),
        api.get('/caja/historial'),
        api.get('/caja/categorias-gastos')
      ]);

      if (cajaRes.status === 'fulfilled') {
        setCajaActual(cajaRes.value?.data?.caja || null);
      }
      if (movRes.status === 'fulfilled') {
        setMovimientos(movRes.value?.data?.movimientos || []);
      }
      if (histRes.status === 'fulfilled') {
        setHistorialCajas(histRes.value?.data?.cajas || []);
      }
      if (catRes.status === 'fulfilled') {
        setCategorias(catRes.value?.data?.categorias || []);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEstadisticas = useCallback(async (periodo = 'semana') => {
    try {
      const res = await api.get(`/caja/estadisticas?periodo=${periodo}`);
      if (res.data?.success) {
        setEstadisticas(res.data);
      }
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        fetchData();
        fetchEstadisticas();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, fetchData, fetchEstadisticas]);

  // Abrir caja
  const handleAbrirCaja = async () => {
    if (!formAbrir.monto_inicial || parseFloat(formAbrir.monto_inicial) < 0) {
      warning('Ingresa un monto inicial válido');
      return;
    }

    try {
      const res = await api.post('/caja/abrir', formAbrir);
      if (res.data?.success) {
        success('Caja abierta correctamente');
        setShowAbrirModal(false);
        setFormAbrir({ monto_inicial: '', notas: '' });
        fetchData();
      } else {
        error(res.data?.message || 'Error al abrir caja');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Error al abrir caja');
    }
  };

  // Cerrar caja
  const handleCerrarCaja = async () => {
    if (!formCerrar.monto_final || parseFloat(formCerrar.monto_final) < 0) {
      warning('Ingresa el monto final contado');
      return;
    }

    try {
      const res = await api.post('/caja/cerrar', formCerrar);
      if (res.data?.success) {
        success('Caja cerrada correctamente');
        setShowCerrarModal(false);
        setFormCerrar({ monto_final: '', notas: '' });
        fetchData();
      } else {
        error(res.data?.message || 'Error al cerrar caja');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Error al cerrar caja');
    }
  };

  // Registrar movimiento (gasto/entrada/salida)
  const handleRegistrarMovimiento = async () => {
    if (!formMovimiento.monto || parseFloat(formMovimiento.monto) <= 0) {
      warning('Ingresa un monto válido');
      return;
    }
    if (!formMovimiento.concepto.trim()) {
      warning('Ingresa un concepto');
      return;
    }

    try {
      let endpoint = '/caja/gasto';
      if (tipoMovimiento === 'entrada') endpoint = '/caja/entrada';
      if (tipoMovimiento === 'salida') endpoint = '/caja/salida';

      const res = await api.post(endpoint, formMovimiento);
      if (res.data?.success) {
        success(`${tipoMovimiento === 'gasto' ? 'Gasto' : tipoMovimiento === 'entrada' ? 'Entrada' : 'Salida'} registrado`);
        setShowMovimientoModal(false);
        setFormMovimiento({ monto: '', concepto: '', categoria: 'general' });
        fetchData();
      } else {
        error(res.data?.message || 'Error al registrar movimiento');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Error al registrar movimiento');
    }
  };

  // Realizar arqueo
  const handleArqueo = async () => {
    if (!formArqueo.conteo_efectivo || parseFloat(formArqueo.conteo_efectivo) < 0) {
      warning('Ingresa el conteo de efectivo');
      return;
    }

    try {
      const res = await api.post('/caja/arqueo', formArqueo);
      if (res.data?.success) {
        const arqueo = res.data.arqueo;
        if (arqueo.estado === 'cuadrado') {
          success('¡Arqueo cuadrado! La caja está correcta');
        } else if (arqueo.estado === 'sobrante') {
          warning(`Arqueo con sobrante de €${arqueo.diferencia.toFixed(2)}`);
        } else {
          error(`Arqueo con faltante de €${Math.abs(arqueo.diferencia).toFixed(2)}`);
        }
        setShowArqueoModal(false);
        setFormArqueo({ conteo_efectivo: '', notas: '' });
        fetchData();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Error al realizar arqueo');
    }
  };

  // Ver detalle de caja histórica
  const handleVerDetalle = async (cajaId) => {
    try {
      const res = await api.get(`/caja/${cajaId}`);
      if (res.data?.success) {
        setShowDetalleModal(res.data);
      }
    } catch (err) {
      error('Error al cargar detalle');
    }
  };

  // Formatear moneda
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  // Formatear fecha
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="caja-module">
        <div className="caja-loading">
          <div className="loading-spinner"></div>
          <p>Cargando sistema de caja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="caja-module">
      {/* HEADER */}
      <header className="caja-header">
        <div className="header-left">
          <h1>💰 Sistema de Caja</h1>
          <p>Gestión completa de tu caja registradora</p>
        </div>
        <div className="header-right">
          {cajaActual ? (
            <div className="caja-status abierta">
              <span className="status-dot"></span>
              <span>Caja Abierta</span>
              <span className="desde">desde {formatDate(cajaActual.fecha_apertura)}</span>
            </div>
          ) : (
            <div className="caja-status cerrada">
              <span className="status-dot"></span>
              <span>Caja Cerrada</span>
            </div>
          )}
        </div>
      </header>

      {/* ACCIONES RÁPIDAS */}
      <div className="caja-actions">
        {!cajaActual ? (
          <button className="btn-action btn-abrir" onClick={() => setShowAbrirModal(true)}>
            <span className="icon">🔓</span>
            <span>Abrir Caja</span>
          </button>
        ) : (
          <>
            <button className="btn-action btn-entrada" onClick={() => { setTipoMovimiento('entrada'); setShowMovimientoModal(true); }}>
              <span className="icon">📥</span>
              <span>Entrada</span>
            </button>
            <button className="btn-action btn-salida" onClick={() => { setTipoMovimiento('salida'); setShowMovimientoModal(true); }}>
              <span className="icon">📤</span>
              <span>Salida</span>
            </button>
            <button className="btn-action btn-gasto" onClick={() => { setTipoMovimiento('gasto'); setShowMovimientoModal(true); }}>
              <span className="icon">💸</span>
              <span>Gasto</span>
            </button>
            <button className="btn-action btn-arqueo" onClick={() => setShowArqueoModal(true)}>
              <span className="icon">📊</span>
              <span>Arqueo</span>
            </button>
            <button className="btn-action btn-cerrar" onClick={() => setShowCerrarModal(true)}>
              <span className="icon">🔒</span>
              <span>Cerrar Caja</span>
            </button>
          </>
        )}
      </div>

      {/* TABS */}
      <div className="caja-tabs">
        <button 
          className={`tab ${activeTab === 'resumen' ? 'active' : ''}`}
          onClick={() => setActiveTab('resumen')}
        >
          📋 Resumen
        </button>
        <button 
          className={`tab ${activeTab === 'movimientos' ? 'active' : ''}`}
          onClick={() => setActiveTab('movimientos')}
        >
          📝 Movimientos
        </button>
        <button 
          className={`tab ${activeTab === 'historial' ? 'active' : ''}`}
          onClick={() => setActiveTab('historial')}
        >
          📚 Historial
        </button>
        <button 
          className={`tab ${activeTab === 'estadisticas' ? 'active' : ''}`}
          onClick={() => { setActiveTab('estadisticas'); fetchEstadisticas(); }}
        >
          📈 Estadísticas
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="caja-content">
        {/* TAB RESUMEN */}
        {activeTab === 'resumen' && (
          <div className="tab-resumen">
            {cajaActual ? (
              <>
                {/* KPIs de la caja actual */}
                <div className="resumen-grid">
                  <div className="resumen-card efectivo">
                    <div className="card-icon">💵</div>
                    <div className="card-info">
                      <span className="card-label">Efectivo en Caja</span>
                      <span className="card-value">{formatMoney(cajaActual.efectivoEnCaja)}</span>
                    </div>
                  </div>
                  <div className="resumen-card ventas">
                    <div className="card-icon">💳</div>
                    <div className="card-info">
                      <span className="card-label">Ventas del Día</span>
                      <span className="card-value">{formatMoney(cajaActual.totalVentas)}</span>
                      <span className="card-detail">{cajaActual.cantidadVentas} operaciones</span>
                    </div>
                  </div>
                  <div className="resumen-card gastos">
                    <div className="card-icon">📤</div>
                    <div className="card-info">
                      <span className="card-label">Gastos</span>
                      <span className="card-value negative">{formatMoney(cajaActual.totalGastos)}</span>
                      <span className="card-detail">{cajaActual.cantidadGastos} registros</span>
                    </div>
                  </div>
                  <div className="resumen-card inicial">
                    <div className="card-icon">🏦</div>
                    <div className="card-info">
                      <span className="card-label">Fondo Inicial</span>
                      <span className="card-value">{formatMoney(cajaActual.monto_inicial)}</span>
                    </div>
                  </div>
                </div>

                {/* Desglose por método de pago */}
                <div className="desglose-section">
                  <h3>Desglose por Método de Pago</h3>
                  <div className="desglose-grid">
                    <div className="desglose-item">
                      <span className="desglose-icon">💵</span>
                      <span className="desglose-label">Efectivo</span>
                      <span className="desglose-value">{formatMoney(cajaActual.totalEfectivo)}</span>
                    </div>
                    <div className="desglose-item">
                      <span className="desglose-icon">💳</span>
                      <span className="desglose-label">Tarjeta</span>
                      <span className="desglose-value">{formatMoney(cajaActual.totalTarjeta)}</span>
                    </div>
                    <div className="desglose-item">
                      <span className="desglose-icon">🏦</span>
                      <span className="desglose-label">Transferencia</span>
                      <span className="desglose-value">{formatMoney(cajaActual.totalTransferencia)}</span>
                    </div>
                  </div>
                </div>

                {/* Últimos movimientos */}
                <div className="ultimos-movimientos">
                  <h3>Últimos Movimientos</h3>
                  {movimientos.length === 0 ? (
                    <p className="no-data">No hay movimientos hoy</p>
                  ) : (
                    <div className="movimientos-list">
                      {movimientos.slice(0, 5).map(mov => (
                        <div key={mov.id} className={`movimiento-item ${mov.monto >= 0 ? 'ingreso' : 'egreso'}`}>
                          <div className="mov-icon">
                            {mov.tipo === 'venta' ? '🛒' : mov.tipo === 'gasto' ? '💸' : mov.tipo === 'entrada' ? '📥' : '📤'}
                          </div>
                          <div className="mov-info">
                            <span className="mov-concepto">{mov.concepto}</span>
                            <span className="mov-hora">{formatDate(mov.fecha)}</span>
                          </div>
                          <span className={`mov-monto ${mov.monto >= 0 ? 'positive' : 'negative'}`}>
                            {mov.monto >= 0 ? '+' : ''}{formatMoney(mov.monto)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="caja-cerrada-info">
                <div className="cerrada-icon">🔒</div>
                <h2>La caja está cerrada</h2>
                <p>Abre la caja para comenzar a registrar operaciones del día</p>
                <button className="btn-primary" onClick={() => setShowAbrirModal(true)}>
                  🔓 Abrir Caja
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB MOVIMIENTOS */}
        {activeTab === 'movimientos' && (
          <div className="tab-movimientos">
            <div className="movimientos-header">
              <h3>Movimientos del Día</h3>
              <span className="movimientos-count">{movimientos.length} registros</span>
            </div>
            
            {movimientos.length === 0 ? (
              <div className="no-movimientos">
                <span className="icon">📝</span>
                <p>No hay movimientos registrados hoy</p>
              </div>
            ) : (
              <div className="movimientos-table-container">
                <table className="movimientos-table">
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Tipo</th>
                      <th>Concepto</th>
                      <th>Método</th>
                      <th>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map(mov => (
                      <tr key={mov.id} className={mov.monto >= 0 ? 'ingreso' : 'egreso'}>
                        <td>{new Date(mov.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          <span className={`tipo-badge ${mov.tipo}`}>
                            {mov.tipo === 'venta' ? '🛒 Venta' : 
                             mov.tipo === 'gasto' ? '💸 Gasto' : 
                             mov.tipo === 'entrada' ? '📥 Entrada' : '📤 Salida'}
                          </span>
                        </td>
                        <td>{mov.concepto}</td>
                        <td>
                          <span className="metodo-badge">
                            {mov.metodo_pago === 'efectivo' ? '💵' : 
                             mov.metodo_pago === 'tarjeta' ? '💳' : '🏦'} {mov.metodo_pago}
                          </span>
                        </td>
                        <td className={`monto ${mov.monto >= 0 ? 'positive' : 'negative'}`}>
                          {mov.monto >= 0 ? '+' : ''}{formatMoney(mov.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB HISTORIAL */}
        {activeTab === 'historial' && (
          <div className="tab-historial">
            <h3>Historial de Cajas</h3>
            
            {historialCajas.length === 0 ? (
              <div className="no-historial">
                <span className="icon">📚</span>
                <p>No hay historial de cajas</p>
              </div>
            ) : (
              <div className="historial-list">
                {historialCajas.map(caja => (
                  <div key={caja.id} className={`historial-item ${caja.estado}`}>
                    <div className="hist-header">
                      <div className="hist-fecha">
                        <span className="dia">{formatDateShort(caja.fecha_apertura)}</span>
                        <span className={`estado-badge ${caja.estado}`}>
                          {caja.estado === 'abierta' ? '🟢 Abierta' : '🔴 Cerrada'}
                        </span>
                      </div>
                      <button className="btn-ver-detalle" onClick={() => handleVerDetalle(caja.id)}>
                        Ver detalle
                      </button>
                    </div>
                    <div className="hist-body">
                      <div className="hist-stat">
                        <span className="label">Inicio</span>
                        <span className="value">{formatMoney(caja.monto_inicial)}</span>
                      </div>
                      {caja.estado === 'cerrada' && (
                        <>
                          <div className="hist-stat">
                            <span className="label">Final</span>
                            <span className="value">{formatMoney(caja.monto_final)}</span>
                          </div>
                          <div className="hist-stat">
                            <span className="label">Ventas</span>
                            <span className="value">{formatMoney(caja.resumen?.totalVentas)}</span>
                          </div>
                          {caja.resumen?.diferencia !== 0 && (
                            <div className="hist-stat diferencia">
                              <span className="label">Diferencia</span>
                              <span className={`value ${caja.resumen?.diferencia > 0 ? 'positive' : 'negative'}`}>
                                {formatMoney(caja.resumen?.diferencia)}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="hist-footer">
                      <span>Apertura: {caja.usuario_apertura}</span>
                      {caja.estado === 'cerrada' && <span>Cierre: {caja.usuario_cierre}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB ESTADÍSTICAS */}
        {activeTab === 'estadisticas' && (
          <div className="tab-estadisticas">
            <div className="estadisticas-header">
              <h3>Estadísticas</h3>
              <div className="periodo-selector">
                <button 
                  className={estadisticas?.periodo === 'semana' ? 'active' : ''} 
                  onClick={() => fetchEstadisticas('semana')}
                >
                  Última Semana
                </button>
                <button 
                  className={estadisticas?.periodo === 'mes' ? 'active' : ''} 
                  onClick={() => fetchEstadisticas('mes')}
                >
                  Este Mes
                </button>
              </div>
            </div>

            {estadisticas ? (
              <>
                {/* KPIs */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-icon">💰</span>
                    <span className="stat-value">{formatMoney(estadisticas.estadisticas?.totalVentas)}</span>
                    <span className="stat-label">Total Ventas</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-icon">💸</span>
                    <span className="stat-value negative">{formatMoney(estadisticas.estadisticas?.totalGastos)}</span>
                    <span className="stat-label">Total Gastos</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-icon">📊</span>
                    <span className="stat-value">{formatMoney(estadisticas.estadisticas?.balance)}</span>
                    <span className="stat-label">Balance</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-icon">🧾</span>
                    <span className="stat-value">{formatMoney(estadisticas.estadisticas?.ticketPromedio)}</span>
                    <span className="stat-label">Ticket Promedio</span>
                  </div>
                </div>

                {/* Ventas por método */}
                <div className="stats-section">
                  <h4>Ventas por Método de Pago</h4>
                  <div className="metodos-chart">
                    {estadisticas.ventasPorMetodo && Object.entries(estadisticas.ventasPorMetodo).map(([metodo, total]) => (
                      <div key={metodo} className="metodo-bar">
                        <span className="metodo-label">
                          {metodo === 'efectivo' ? '💵' : metodo === 'tarjeta' ? '💳' : '🏦'} {metodo}
                        </span>
                        <div className="bar-container">
                          <div 
                            className="bar-fill"
                            style={{ 
                              width: `${estadisticas.estadisticas?.totalVentas > 0 
                                ? (total / estadisticas.estadisticas.totalVentas * 100) 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="metodo-value">{formatMoney(total)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gastos por categoría */}
                {estadisticas.gastosPorCategoria?.length > 0 && (
                  <div className="stats-section">
                    <h4>Gastos por Categoría</h4>
                    <div className="categorias-list">
                      {estadisticas.gastosPorCategoria.map(cat => (
                        <div key={cat.categoria} className="categoria-item">
                          <span className="cat-name">{cat.categoria}</span>
                          <span className="cat-value">{formatMoney(cat.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="loading-stats">
                <div className="loading-spinner"></div>
                <p>Cargando estadísticas...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL ABRIR CAJA */}
      {showAbrirModal && (
        <div className="modal-overlay" onClick={() => setShowAbrirModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔓 Abrir Caja</h3>
              <button className="btn-close" onClick={() => setShowAbrirModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Monto Inicial (Fondo de Caja)</label>
                <div className="input-money">
                  <span className="currency">€</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={formAbrir.monto_inicial}
                    onChange={e => setFormAbrir({...formAbrir, monto_inicial: e.target.value})}
                    autoFocus
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Notas (opcional)</label>
                <textarea 
                  placeholder="Notas de apertura..."
                  value={formAbrir.notas}
                  onChange={e => setFormAbrir({...formAbrir, notas: e.target.value})}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAbrirModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleAbrirCaja}>Abrir Caja</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CERRAR CAJA */}
      {showCerrarModal && (
        <div className="modal-overlay" onClick={() => setShowCerrarModal(false)}>
          <div className="modal-content modal-cerrar" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔒 Cerrar Caja</h3>
              <button className="btn-close" onClick={() => setShowCerrarModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {cajaActual && (
                <div className="cierre-resumen">
                  <div className="cierre-item">
                    <span>Fondo Inicial</span>
                    <span>{formatMoney(cajaActual.monto_inicial)}</span>
                  </div>
                  <div className="cierre-item">
                    <span>Ventas Efectivo</span>
                    <span className="positive">+{formatMoney(cajaActual.totalEfectivo)}</span>
                  </div>
                  <div className="cierre-item">
                    <span>Gastos</span>
                    <span className="negative">-{formatMoney(cajaActual.totalGastos)}</span>
                  </div>
                  <div className="cierre-item total">
                    <span>Efectivo Esperado</span>
                    <span>{formatMoney(cajaActual.efectivoEnCaja)}</span>
                  </div>
                </div>
              )}
              <div className="form-group">
                <label>Monto Contado en Caja</label>
                <div className="input-money">
                  <span className="currency">€</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={formCerrar.monto_final}
                    onChange={e => setFormCerrar({...formCerrar, monto_final: e.target.value})}
                    autoFocus
                  />
                </div>
                {formCerrar.monto_final && cajaActual && (
                  <div className={`diferencia-preview ${parseFloat(formCerrar.monto_final) - cajaActual.efectivoEnCaja === 0 ? 'cuadrado' : parseFloat(formCerrar.monto_final) - cajaActual.efectivoEnCaja > 0 ? 'sobrante' : 'faltante'}`}>
                    {parseFloat(formCerrar.monto_final) - cajaActual.efectivoEnCaja === 0 ? (
                      <span>✅ Caja cuadrada</span>
                    ) : parseFloat(formCerrar.monto_final) - cajaActual.efectivoEnCaja > 0 ? (
                      <span>⚠️ Sobrante: {formatMoney(parseFloat(formCerrar.monto_final) - cajaActual.efectivoEnCaja)}</span>
                    ) : (
                      <span>❌ Faltante: {formatMoney(Math.abs(parseFloat(formCerrar.monto_final) - cajaActual.efectivoEnCaja))}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Notas de Cierre (opcional)</label>
                <textarea 
                  placeholder="Observaciones del cierre..."
                  value={formCerrar.notas}
                  onChange={e => setFormCerrar({...formCerrar, notas: e.target.value})}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCerrarModal(false)}>Cancelar</button>
              <button className="btn-danger" onClick={handleCerrarCaja}>Confirmar Cierre</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MOVIMIENTO */}
      {showMovimientoModal && (
        <div className="modal-overlay" onClick={() => setShowMovimientoModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {tipoMovimiento === 'gasto' ? '💸 Registrar Gasto' : 
                 tipoMovimiento === 'entrada' ? '📥 Entrada de Efectivo' : '📤 Salida de Efectivo'}
              </h3>
              <button className="btn-close" onClick={() => setShowMovimientoModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Monto</label>
                <div className="input-money">
                  <span className="currency">€</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={formMovimiento.monto}
                    onChange={e => setFormMovimiento({...formMovimiento, monto: e.target.value})}
                    autoFocus
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Concepto</label>
                <input 
                  type="text" 
                  placeholder={tipoMovimiento === 'gasto' ? 'Ej: Compra de productos' : tipoMovimiento === 'entrada' ? 'Ej: Cambio de caja' : 'Ej: Pago a proveedor'}
                  value={formMovimiento.concepto}
                  onChange={e => setFormMovimiento({...formMovimiento, concepto: e.target.value})}
                />
              </div>
              {tipoMovimiento === 'gasto' && (
                <div className="form-group">
                  <label>Categoría</label>
                  <select 
                    value={formMovimiento.categoria}
                    onChange={e => setFormMovimiento({...formMovimiento, categoria: e.target.value})}
                  >
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icono} {cat.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowMovimientoModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleRegistrarMovimiento}>Registrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ARQUEO */}
      {showArqueoModal && (
        <div className="modal-overlay" onClick={() => setShowArqueoModal(false)}>
          <div className="modal-content modal-arqueo" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📊 Arqueo de Caja</h3>
              <button className="btn-close" onClick={() => setShowArqueoModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="arqueo-info">
                Cuenta el efectivo físico en caja y registra el total. 
                El sistema calculará si hay diferencia.
              </p>
              {cajaActual && (
                <div className="arqueo-esperado">
                  <span>Efectivo Esperado:</span>
                  <span className="value">{formatMoney(cajaActual.efectivoEnCaja)}</span>
                </div>
              )}
              <div className="form-group">
                <label>Efectivo Contado</label>
                <div className="input-money large">
                  <span className="currency">€</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={formArqueo.conteo_efectivo}
                    onChange={e => setFormArqueo({...formArqueo, conteo_efectivo: e.target.value})}
                    autoFocus
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Notas del Arqueo (opcional)</label>
                <textarea 
                  placeholder="Observaciones..."
                  value={formArqueo.notas}
                  onChange={e => setFormArqueo({...formArqueo, notas: e.target.value})}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowArqueoModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleArqueo}>Realizar Arqueo</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE CAJA */}
      {showDetalleModal && (
        <div className="modal-overlay" onClick={() => setShowDetalleModal(null)}>
          <div className="modal-content modal-detalle" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Detalle de Caja</h3>
              <button className="btn-close" onClick={() => setShowDetalleModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detalle-header">
                <div className="detalle-fecha">
                  <span className="label">Fecha</span>
                  <span className="value">{formatDate(showDetalleModal.caja?.fecha_apertura)}</span>
                </div>
                <span className={`estado-badge ${showDetalleModal.caja?.estado}`}>
                  {showDetalleModal.caja?.estado}
                </span>
              </div>

              <div className="detalle-grid">
                <div className="detalle-item">
                  <span className="label">Monto Inicial</span>
                  <span className="value">{formatMoney(showDetalleModal.caja?.monto_inicial)}</span>
                </div>
                <div className="detalle-item">
                  <span className="label">Monto Final</span>
                  <span className="value">{formatMoney(showDetalleModal.caja?.monto_final)}</span>
                </div>
                {showDetalleModal.caja?.resumen && (
                  <>
                    <div className="detalle-item">
                      <span className="label">Total Ventas</span>
                      <span className="value positive">{formatMoney(showDetalleModal.caja.resumen.totalVentas)}</span>
                    </div>
                    <div className="detalle-item">
                      <span className="label">Total Gastos</span>
                      <span className="value negative">{formatMoney(showDetalleModal.caja.resumen.totalGastos)}</span>
                    </div>
                    <div className="detalle-item">
                      <span className="label">Diferencia</span>
                      <span className={`value ${showDetalleModal.caja.resumen.diferencia >= 0 ? 'positive' : 'negative'}`}>
                        {formatMoney(showDetalleModal.caja.resumen.diferencia)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {showDetalleModal.ventas?.length > 0 && (
                <div className="detalle-section">
                  <h4>Ventas ({showDetalleModal.ventas.length})</h4>
                  <div className="mini-list">
                    {showDetalleModal.ventas.slice(0, 5).map(v => (
                      <div key={v.id} className="mini-item">
                        <span>Venta #{v.id}</span>
                        <span>{formatMoney(v.total)}</span>
                      </div>
                    ))}
                    {showDetalleModal.ventas.length > 5 && (
                      <span className="more">...y {showDetalleModal.ventas.length - 5} más</span>
                    )}
                  </div>
                </div>
              )}

              {showDetalleModal.gastos?.length > 0 && (
                <div className="detalle-section">
                  <h4>Gastos ({showDetalleModal.gastos.length})</h4>
                  <div className="mini-list">
                    {showDetalleModal.gastos.map(g => (
                      <div key={g.id} className="mini-item">
                        <span>{g.concepto}</span>
                        <span className="negative">{formatMoney(g.monto)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowDetalleModal(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
