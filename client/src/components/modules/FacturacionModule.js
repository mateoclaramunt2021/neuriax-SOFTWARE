/**
 * FacturacionModule - Sistema de Facturación Electrónica Profesional
 * NEURIAX Salon Manager
 * 
 * Funcionalidades:
 * - Crear facturas ordinarias, simplificadas, proformas
 * - Visualizar y gestionar facturas emitidas
 * - Registrar pagos parciales/totales
 * - Exportar a XML, Facturae, JSON
 * - Facturas rectificativas
 * - Estadísticas y reportes de facturación
 * - Gestión de facturas vencidas
 * - Configuración fiscal de empresa
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './facturacion.css';

// Iconos SVG inline
const Icons = {
  invoice: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M9,13V19H7V13H9M15,15V19H17V15H15M11,11V19H13V11H11Z"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/></svg>,
  filter: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3V3H19V3C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z"/></svg>,
  export: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13,9H14V12H16L12.5,15.5L9,12H11V9H13M11,14H7V12H11M15,18H9V16H15M11,10H7V8H11M18,20H6V4H13V9H18V20Z"/></svg>,
  payment: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20,8H4V6H20M20,18H4V12H20M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/></svg>,
  cancel: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>,
  download: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/></svg>,
  print: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18,3H6V7H18M19,12A1,1 0 0,1 18,11A1,1 0 0,1 19,10A1,1 0 0,1 20,11A1,1 0 0,1 19,12M16,19H8V14H16M19,8H5A3,3 0 0,0 2,11V17H6V21H18V17H22V11A3,3 0 0,0 19,8Z"/></svg>,
  eye: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/></svg>,
  alert: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/></svg>,
  chart: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M16,11.78L20.24,4.45L21.97,5.45L16.74,14.5L10.23,10.75L5.46,19H22V21H2V3H4V17.54L9.5,8L16,11.78Z"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/></svg>,
  edit: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>,
  rectificativa: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19M12,17V14H8V10H12V7L17,12L12,17Z"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/></svg>,
  refresh: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>,
};

// Tipos de IVA
const TIPOS_IVA = {
  general: { valor: 21, nombre: 'General (21%)' },
  reducido: { valor: 10, nombre: 'Reducido (10%)' },
  superreducido: { valor: 4, nombre: 'Super Reducido (4%)' },
  exento: { valor: 0, nombre: 'Exento (0%)' }
};

// Formas de pago
const FORMAS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'bizum', label: 'Bizum' },
  { value: 'domiciliacion', label: 'Domiciliación' }
];

// Estados de factura
const ESTADOS_FACTURA = {
  emitida: { color: '#3498db', icon: Icons.clock, label: 'Emitida' },
  pagada: { color: '#27ae60', icon: Icons.check, label: 'Pagada' },
  vencida: { color: '#e74c3c', icon: Icons.alert, label: 'Vencida' },
  anulada: { color: '#95a5a6', icon: Icons.cancel, label: 'Anulada' }
};

export default function FacturacionModule() {
  const { success, error, warning } = useNotification();
  const { isAuthenticated } = useAuth();
  
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [facturas, setFacturas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [facturasVencidas, setFacturasVencidas] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [configEmpresa, setConfigEmpresa] = useState(null);
  
  // Estados de vista
  const [activeTab, setActiveTab] = useState('facturas'); // facturas, vencidas, estadisticas, configuracion
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(null);
  const [showPagoModal, setShowPagoModal] = useState(null);
  const [showAnularModal, setShowAnularModal] = useState(null);
  const [showExportarModal, setShowExportarModal] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [showRectificativaModal, setShowRectificativaModal] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    tipo: '',
    fechaDesde: '',
    fechaHasta: ''
  });
  const [showFiltros, setShowFiltros] = useState(false);
  
  // Formulario nueva factura
  const [formFactura, setFormFactura] = useState({
    tipo: 'facturas',
    cliente: { nombre: '', nif: '', direccion: '', codigoPostal: '', ciudad: '', provincia: '', email: '', telefono: '' },
    lineas: [{ descripcion: '', cantidad: 1, precioUnitario: 0, descuento: 0 }],
    tipoIVA: 'general',
    descuentoGlobal: 0,
    formaPago: 'efectivo',
    diasVencimiento: 30,
    notas: ''
  });
  
  // Formulario pago
  const [formPago, setFormPago] = useState({ importe: '', metodoPago: 'efectivo', referencia: '' });
  
  // Formulario anulación
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  
  // Formulario configuración
  const [formConfig, setFormConfig] = useState({
    razonSocial: '',
    nombreComercial: '',
    nif: '',
    direccion: '',
    codigoPostal: '',
    ciudad: '',
    provincia: '',
    telefono: '',
    email: ''
  });

  // Cargar datos - evitar bucles infinitos
  const fetchFacturas = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
      if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
      if (filtros.busqueda) params.append('clienteNombre', filtros.busqueda);
      
      const res = await api.get(`/facturacion/listar?${params.toString()}`);
      if (res.data?.success) {
        setFacturas(res.data.facturas || []);
        setEstadisticas(res.data.estadisticas || null);
      }
    } catch (err) {
      console.error('Error cargando facturas:', err);
      // No llamar a error() aquí para evitar bucles
    }
  }, [filtros]); // Removido 'error' de dependencias

  const fetchVencidas = useCallback(async () => {
    try {
      const res = await api.get('/facturacion/reportes/vencidas');
      if (res.data?.success) {
        setFacturasVencidas(res.data.facturas || []);
      }
    } catch (err) {
      console.error('Error cargando vencidas:', err);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get('/facturacion/config/empresa');
      if (res.data?.success) {
        setConfigEmpresa(res.data.config);
        if (res.data.config?.empresa) {
          setFormConfig(res.data.config.empresa);
        }
      }
    } catch (err) {
      console.error('Error cargando config:', err);
    }
  }, []);

  const fetchEstadisticas = useCallback(async (periodo = 'mes') => {
    try {
      const res = await api.get(`/facturacion/estadisticas/${periodo}`);
      if (res.data?.success) {
        setEstadisticas(res.data.estadisticas);
      }
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  }, []);

  useEffect(() => {
    let retryCount = 0;
    const loadData = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token && retryCount < 10) {
        retryCount++;
        setTimeout(loadData, 100);
        return;
      }
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      await Promise.all([fetchFacturas(), fetchVencidas(), fetchConfig()]);
      setLoading(false);
    };
    
    if (isAuthenticated) {
      const timer = setTimeout(loadData, 50);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, fetchFacturas, fetchVencidas, fetchConfig]);

  // Crear factura
  const handleCrearFactura = async () => {
    // Validaciones
    if (!formFactura.cliente.nombre?.trim()) {
      warning('Ingresa el nombre del cliente');
      return;
    }
    
    const lineasValidas = formFactura.lineas.filter(l => l.descripcion?.trim() && l.precioUnitario > 0);
    if (lineasValidas.length === 0) {
      warning('Agrega al menos una línea válida');
      return;
    }

    try {
      const res = await api.post('/facturacion/crear', {
        ...formFactura,
        lineas: lineasValidas
      });
      
      if (res.data?.success) {
        success(`Factura ${res.data.factura.numero} creada correctamente`);
        setShowCrearModal(false);
        resetFormFactura();
        fetchFacturas();
      }
    } catch (err) {
      error(err.response?.data?.error || 'Error al crear factura');
    }
  };

  // Registrar pago
  const handleRegistrarPago = async () => {
    if (!formPago.importe || parseFloat(formPago.importe) <= 0) {
      warning('Ingresa un importe válido');
      return;
    }

    try {
      const res = await api.post(`/facturacion/${showPagoModal.id}/pago`, {
        importe: parseFloat(formPago.importe),
        metodoPago: formPago.metodoPago,
        referencia: formPago.referencia
      });
      
      if (res.data?.success) {
        success('Pago registrado correctamente');
        setShowPagoModal(null);
        setFormPago({ importe: '', metodoPago: 'efectivo', referencia: '' });
        fetchFacturas();
      }
    } catch (err) {
      error(err.response?.data?.error || 'Error al registrar pago');
    }
  };

  // Anular factura
  const handleAnularFactura = async () => {
    if (!motivoAnulacion?.trim()) {
      warning('Ingresa el motivo de anulación');
      return;
    }

    try {
      const res = await api.post(`/facturacion/${showAnularModal.id}/anular`, {
        motivo: motivoAnulacion
      });
      
      if (res.data?.success) {
        success('Factura anulada correctamente');
        setShowAnularModal(null);
        setMotivoAnulacion('');
        fetchFacturas();
      }
    } catch (err) {
      error(err.response?.data?.error || 'Error al anular factura');
    }
  };

  // Exportar factura
  const handleExportar = async (formato) => {
    try {
      const res = await api.get(`/facturacion/${showExportarModal.id}/exportar/${formato}`, {
        responseType: formato === 'JSON' ? 'json' : 'blob'
      });
      
      const blob = formato === 'JSON' 
        ? new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
        : res.data;
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura_${showExportarModal.numero}.${formato.toLowerCase() === 'facturae' ? 'xml' : formato.toLowerCase()}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      success(`Factura exportada en formato ${formato}`);
      setShowExportarModal(null);
    } catch (err) {
      error('Error al exportar factura');
    }
  };

  // Guardar configuración
  const handleGuardarConfig = async () => {
    try {
      const res = await api.put('/facturacion/config/empresa', formConfig);
      if (res.data?.success) {
        success('Configuración guardada correctamente');
        setShowConfigModal(false);
        fetchConfig();
      }
    } catch (err) {
      error('Error al guardar configuración');
    }
  };

  // Reset form
  const resetFormFactura = () => {
    setFormFactura({
      tipo: 'facturas',
      cliente: { nombre: '', nif: '', direccion: '', codigoPostal: '', ciudad: '', provincia: '', email: '', telefono: '' },
      lineas: [{ descripcion: '', cantidad: 1, precioUnitario: 0, descuento: 0 }],
      tipoIVA: 'general',
      descuentoGlobal: 0,
      formaPago: 'efectivo',
      diasVencimiento: 30,
      notas: ''
    });
  };

  // Agregar línea
  const agregarLinea = () => {
    setFormFactura(prev => ({
      ...prev,
      lineas: [...prev.lineas, { descripcion: '', cantidad: 1, precioUnitario: 0, descuento: 0 }]
    }));
  };

  // Eliminar línea
  const eliminarLinea = (index) => {
    if (formFactura.lineas.length === 1) {
      warning('La factura debe tener al menos una línea');
      return;
    }
    setFormFactura(prev => ({
      ...prev,
      lineas: prev.lineas.filter((_, i) => i !== index)
    }));
  };

  // Actualizar línea
  const actualizarLinea = (index, campo, valor) => {
    setFormFactura(prev => ({
      ...prev,
      lineas: prev.lineas.map((l, i) => i === index ? { ...l, [campo]: valor } : l)
    }));
  };

  // Calcular totales
  const totalesCalculados = useMemo(() => {
    const porcentajeIVA = TIPOS_IVA[formFactura.tipoIVA]?.valor || 21;
    let subtotal = 0;
    
    formFactura.lineas.forEach(linea => {
      const base = (linea.cantidad || 0) * (linea.precioUnitario || 0);
      const descuento = base * (linea.descuento || 0) / 100;
      subtotal += base - descuento;
    });
    
    const descuentoGlobal = subtotal * (formFactura.descuentoGlobal || 0) / 100;
    const baseImponible = subtotal - descuentoGlobal;
    const iva = baseImponible * porcentajeIVA / 100;
    const total = baseImponible + iva;
    
    return {
      subtotal: subtotal.toFixed(2),
      descuento: descuentoGlobal.toFixed(2),
      baseImponible: baseImponible.toFixed(2),
      iva: iva.toFixed(2),
      total: total.toFixed(2)
    };
  }, [formFactura.lineas, formFactura.tipoIVA, formFactura.descuentoGlobal]);

  // Formatear moneda
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  // Formatear fecha
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Renderizar loading
  if (loading) {
    return (
      <div className="facturacion-loading">
        <div className="loading-spinner"></div>
        <p>Cargando sistema de facturación...</p>
      </div>
    );
  }

  return (
    <div className="facturacion-module">
      {/* Header */}
      <div className="facturacion-header">
        <div className="header-title">
          <span className="header-icon">{Icons.invoice}</span>
          <h1>Facturación Electrónica</h1>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={() => { fetchFacturas(); fetchVencidas(); }} title="Actualizar">
            {Icons.refresh}
          </button>
          <button className="btn-config" onClick={() => setShowConfigModal(true)} title="Configuración">
            {Icons.settings}
          </button>
          <button className="btn-primary" onClick={() => setShowCrearModal(true)}>
            {Icons.plus}
            <span>Nueva Factura</span>
          </button>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="facturacion-tabs">
        <button 
          className={`tab ${activeTab === 'facturas' ? 'active' : ''}`}
          onClick={() => setActiveTab('facturas')}
        >
          {Icons.invoice}
          <span>Facturas</span>
          <span className="tab-count">{facturas.length}</span>
        </button>
        <button 
          className={`tab ${activeTab === 'vencidas' ? 'active' : ''}`}
          onClick={() => setActiveTab('vencidas')}
        >
          {Icons.alert}
          <span>Vencidas</span>
          {facturasVencidas.length > 0 && (
            <span className="tab-count danger">{facturasVencidas.length}</span>
          )}
        </button>
        <button 
          className={`tab ${activeTab === 'estadisticas' ? 'active' : ''}`}
          onClick={() => { setActiveTab('estadisticas'); fetchEstadisticas(); }}
        >
          {Icons.chart}
          <span>Estadísticas</span>
        </button>
      </div>

      {/* Contenido principal */}
      <div className="facturacion-content">
        
        {/* Tab Facturas */}
        {activeTab === 'facturas' && (
          <div className="facturas-section">
            {/* Barra de búsqueda y filtros */}
            <div className="search-bar">
              <div className="search-input-wrapper">
                <span className="search-icon">{Icons.search}</span>
                <input
                  type="text"
                  placeholder="Buscar por cliente..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                />
              </div>
              <button 
                className={`btn-filter ${showFiltros ? 'active' : ''}`}
                onClick={() => setShowFiltros(!showFiltros)}
              >
                {Icons.filter}
                <span>Filtros</span>
              </button>
            </div>

            {/* Panel de filtros */}
            {showFiltros && (
              <div className="filtros-panel">
                <div className="filtro-group">
                  <label>Estado</label>
                  <select 
                    value={filtros.estado} 
                    onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                  >
                    <option value="">Todos</option>
                    <option value="emitida">Emitidas</option>
                    <option value="pagada">Pagadas</option>
                    <option value="vencida">Vencidas</option>
                    <option value="anulada">Anuladas</option>
                  </select>
                </div>
                <div className="filtro-group">
                  <label>Tipo</label>
                  <select 
                    value={filtros.tipo} 
                    onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
                  >
                    <option value="">Todos</option>
                    <option value="ordinaria">Ordinaria</option>
                    <option value="simplificada">Simplificada</option>
                    <option value="proforma">Proforma</option>
                    <option value="rectificativa">Rectificativa</option>
                  </select>
                </div>
                <div className="filtro-group">
                  <label>Desde</label>
                  <input 
                    type="date" 
                    value={filtros.fechaDesde}
                    onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value }))}
                  />
                </div>
                <div className="filtro-group">
                  <label>Hasta</label>
                  <input 
                    type="date" 
                    value={filtros.fechaHasta}
                    onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value }))}
                  />
                </div>
                <button 
                  className="btn-limpiar"
                  onClick={() => setFiltros({ busqueda: '', estado: '', tipo: '', fechaDesde: '', fechaHasta: '' })}
                >
                  Limpiar
                </button>
              </div>
            )}

            {/* Estadísticas rápidas */}
            {estadisticas && (
              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-icon blue">{Icons.invoice}</div>
                  <div className="stat-info">
                    <span className="stat-value">{estadisticas.emitidas || 0}</span>
                    <span className="stat-label">Emitidas</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">{Icons.check}</div>
                  <div className="stat-info">
                    <span className="stat-value">{formatMoney(estadisticas.importePagado)}</span>
                    <span className="stat-label">Cobrado</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon orange">{Icons.clock}</div>
                  <div className="stat-info">
                    <span className="stat-value">{formatMoney(estadisticas.importePendiente)}</span>
                    <span className="stat-label">Pendiente</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon purple">{Icons.chart}</div>
                  <div className="stat-info">
                    <span className="stat-value">{formatMoney(estadisticas.totalFacturado)}</span>
                    <span className="stat-label">Total Facturado</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de facturas */}
            <div className="facturas-table-container">
              <table className="facturas-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Importe</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.length === 0 ? (
                    <tr className="empty-row">
                      <td colSpan="7">
                        <div className="empty-state">
                          <span className="empty-icon">{Icons.invoice}</span>
                          <p>No hay facturas registradas</p>
                          <button className="btn-primary" onClick={() => setShowCrearModal(true)}>
                            Crear primera factura
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    facturas.map(factura => {
                      const estadoInfo = ESTADOS_FACTURA[factura.estado] || ESTADOS_FACTURA.emitida;
                      return (
                        <tr key={factura.id} className={factura.estado === 'anulada' ? 'row-anulada' : ''}>
                          <td className="numero-cell">
                            <span className="numero-factura">{factura.numero}</span>
                          </td>
                          <td>{formatDate(factura.fechaEmision)}</td>
                          <td className="cliente-cell">
                            <span className="cliente-nombre">{factura.cliente?.nombre}</span>
                            {factura.cliente?.nif && (
                              <span className="cliente-nif">{factura.cliente.nif}</span>
                            )}
                          </td>
                          <td>
                            <span className={`tipo-badge tipo-${factura.tipo}`}>
                              {factura.tipo}
                            </span>
                          </td>
                          <td className="importe-cell">
                            <span className="importe">{formatMoney(factura.totales?.totalFactura)}</span>
                            {factura.estadoPago === 'parcial' && (
                              <span className="pagado-info">
                                Pagado: {formatMoney(factura.importePagado)}
                              </span>
                            )}
                          </td>
                          <td>
                            <span 
                              className="estado-badge"
                              style={{ backgroundColor: estadoInfo.color }}
                            >
                              {estadoInfo.icon}
                              {estadoInfo.label}
                            </span>
                          </td>
                          <td className="acciones-cell">
                            <button 
                              className="btn-action"
                              onClick={() => setShowDetalleModal(factura)}
                              title="Ver detalle"
                            >
                              {Icons.eye}
                            </button>
                            {factura.estado !== 'anulada' && factura.estado !== 'pagada' && (
                              <button 
                                className="btn-action success"
                                onClick={() => {
                                  setFormPago({
                                    importe: (factura.totales?.totalFactura - factura.importePagado).toFixed(2),
                                    metodoPago: 'efectivo',
                                    referencia: ''
                                  });
                                  setShowPagoModal(factura);
                                }}
                                title="Registrar pago"
                              >
                                {Icons.payment}
                              </button>
                            )}
                            <button 
                              className="btn-action info"
                              onClick={() => setShowExportarModal(factura)}
                              title="Exportar"
                            >
                              {Icons.export}
                            </button>
                            {factura.estado !== 'anulada' && (
                              <button 
                                className="btn-action danger"
                                onClick={() => setShowAnularModal(factura)}
                                title="Anular"
                              >
                                {Icons.cancel}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Vencidas */}
        {activeTab === 'vencidas' && (
          <div className="vencidas-section">
            <div className="section-header">
              <h2>Facturas Vencidas</h2>
              <span className="vencidas-count">{facturasVencidas.length} facturas</span>
            </div>
            
            {facturasVencidas.length === 0 ? (
              <div className="empty-vencidas">
                <span className="empty-icon success">{Icons.check}</span>
                <h3>¡Excelente!</h3>
                <p>No tienes facturas vencidas pendientes de cobro</p>
              </div>
            ) : (
              <div className="vencidas-grid">
                {facturasVencidas.map(factura => (
                  <div key={factura.id} className="vencida-card">
                    <div className="vencida-header">
                      <span className="vencida-numero">{factura.numero}</span>
                      <span className="dias-vencida">
                        {factura.diasVencida} días vencida
                      </span>
                    </div>
                    <div className="vencida-cliente">
                      {Icons.user}
                      <span>{factura.cliente?.nombre}</span>
                    </div>
                    <div className="vencida-importe">
                      <span className="label">Pendiente:</span>
                      <span className="valor">
                        {formatMoney(factura.totales?.totalFactura - factura.importePagado)}
                      </span>
                    </div>
                    <div className="vencida-fechas">
                      <div>
                        <span className="label">Emisión:</span>
                        <span>{formatDate(factura.fechaEmision)}</span>
                      </div>
                      <div>
                        <span className="label">Vencimiento:</span>
                        <span className="fecha-vencida">{formatDate(factura.fechaVencimiento)}</span>
                      </div>
                    </div>
                    <div className="vencida-actions">
                      <button 
                        className="btn-cobrar"
                        onClick={() => {
                          setFormPago({
                            importe: (factura.totales?.totalFactura - factura.importePagado).toFixed(2),
                            metodoPago: 'efectivo',
                            referencia: ''
                          });
                          setShowPagoModal(factura);
                        }}
                      >
                        {Icons.payment}
                        Registrar Cobro
                      </button>
                      <button 
                        className="btn-ver"
                        onClick={() => setShowDetalleModal(factura)}
                      >
                        {Icons.eye}
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Estadísticas */}
        {activeTab === 'estadisticas' && (
          <div className="estadisticas-section">
            <div className="periodo-selector">
              <button onClick={() => fetchEstadisticas('dia')} className="btn-periodo">Hoy</button>
              <button onClick={() => fetchEstadisticas('semana')} className="btn-periodo">Semana</button>
              <button onClick={() => fetchEstadisticas('mes')} className="btn-periodo active">Mes</button>
              <button onClick={() => fetchEstadisticas('anio')} className="btn-periodo">Año</button>
            </div>
            
            {estadisticas && (
              <>
                <div className="estadisticas-grid">
                  <div className="stat-big-card">
                    <div className="stat-big-header">
                      <span className="stat-big-icon blue">{Icons.invoice}</span>
                      <span className="stat-big-title">Facturas Emitidas</span>
                    </div>
                    <div className="stat-big-value">{estadisticas.emitidas || 0}</div>
                    <div className="stat-big-detail">
                      <span className="success">{estadisticas.pagadas || 0} pagadas</span>
                      <span className="warning">{estadisticas.pendientes || 0} pendientes</span>
                      <span className="danger">{estadisticas.anuladas || 0} anuladas</span>
                    </div>
                  </div>
                  
                  <div className="stat-big-card">
                    <div className="stat-big-header">
                      <span className="stat-big-icon green">{Icons.payment}</span>
                      <span className="stat-big-title">Total Facturado</span>
                    </div>
                    <div className="stat-big-value">{formatMoney(estadisticas.totalFacturado)}</div>
                    <div className="stat-big-detail">
                      <span>Base Imponible: {formatMoney(estadisticas.baseImponible)}</span>
                      <span>IVA: {formatMoney(estadisticas.totalIVA)}</span>
                    </div>
                  </div>
                  
                  <div className="stat-big-card">
                    <div className="stat-big-header">
                      <span className="stat-big-icon purple">{Icons.chart}</span>
                      <span className="stat-big-title">Tasa de Cobro</span>
                    </div>
                    <div className="stat-big-value">{estadisticas.tasaCobro || 0}%</div>
                    <div className="stat-progress">
                      <div 
                        className="progress-bar"
                        style={{ width: `${estadisticas.tasaCobro || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="stat-big-card">
                    <div className="stat-big-header">
                      <span className="stat-big-icon orange">{Icons.clock}</span>
                      <span className="stat-big-title">Pendiente de Cobro</span>
                    </div>
                    <div className="stat-big-value">{formatMoney(estadisticas.importePendiente)}</div>
                    <div className="stat-big-detail">
                      <span>Cobrado: {formatMoney(estadisticas.importePagado)}</span>
                      <span>Promedio: {formatMoney(estadisticas.promedioFactura)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal Crear Factura */}
      {showCrearModal && (
        <div className="modal-overlay" onClick={() => setShowCrearModal(false)}>
          <div className="modal-container modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{Icons.plus} Nueva Factura</h2>
              <button className="modal-close" onClick={() => setShowCrearModal(false)}>
                {Icons.cancel}
              </button>
            </div>
            <div className="modal-body">
              {/* Tipo de factura */}
              <div className="form-section">
                <h3>Tipo de Documento</h3>
                <div className="tipo-factura-grid">
                  {[
                    { value: 'facturas', label: 'Factura Ordinaria', desc: 'Factura completa con todos los datos fiscales' },
                    { value: 'tickets', label: 'Factura Simplificada', desc: 'Para importes menores (sin datos completos cliente)' },
                    { value: 'proformas', label: 'Proforma', desc: 'Presupuesto o factura provisional' }
                  ].map(tipo => (
                    <div
                      key={tipo.value}
                      className={`tipo-option ${formFactura.tipo === tipo.value ? 'active' : ''}`}
                      onClick={() => setFormFactura(prev => ({ ...prev, tipo: tipo.value }))}
                    >
                      <span className="tipo-label">{tipo.label}</span>
                      <span className="tipo-desc">{tipo.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Datos del cliente */}
              <div className="form-section">
                <h3>Datos del Cliente</h3>
                <div className="form-grid">
                  <div className="form-group span-2">
                    <label>Nombre / Razón Social *</label>
                    <input
                      type="text"
                      value={formFactura.cliente.nombre}
                      onChange={(e) => setFormFactura(prev => ({
                        ...prev,
                        cliente: { ...prev.cliente, nombre: e.target.value }
                      }))}
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div className="form-group">
                    <label>NIF / CIF</label>
                    <input
                      type="text"
                      value={formFactura.cliente.nif}
                      onChange={(e) => setFormFactura(prev => ({
                        ...prev,
                        cliente: { ...prev.cliente, nif: e.target.value.toUpperCase() }
                      }))}
                      placeholder="12345678A"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formFactura.cliente.email}
                      onChange={(e) => setFormFactura(prev => ({
                        ...prev,
                        cliente: { ...prev.cliente, email: e.target.value }
                      }))}
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                  <div className="form-group span-2">
                    <label>Dirección</label>
                    <input
                      type="text"
                      value={formFactura.cliente.direccion}
                      onChange={(e) => setFormFactura(prev => ({
                        ...prev,
                        cliente: { ...prev.cliente, direccion: e.target.value }
                      }))}
                      placeholder="Calle, número, piso..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Código Postal</label>
                    <input
                      type="text"
                      value={formFactura.cliente.codigoPostal}
                      onChange={(e) => setFormFactura(prev => ({
                        ...prev,
                        cliente: { ...prev.cliente, codigoPostal: e.target.value }
                      }))}
                      placeholder="28001"
                    />
                  </div>
                  <div className="form-group">
                    <label>Ciudad</label>
                    <input
                      type="text"
                      value={formFactura.cliente.ciudad}
                      onChange={(e) => setFormFactura(prev => ({
                        ...prev,
                        cliente: { ...prev.cliente, ciudad: e.target.value }
                      }))}
                      placeholder="Madrid"
                    />
                  </div>
                </div>
              </div>

              {/* Líneas de factura */}
              <div className="form-section">
                <div className="section-header-inline">
                  <h3>Líneas de Factura</h3>
                  <button className="btn-add-linea" onClick={agregarLinea}>
                    {Icons.plus} Añadir Línea
                  </button>
                </div>
                <div className="lineas-container">
                  {formFactura.lineas.map((linea, index) => (
                    <div key={index} className="linea-row">
                      <div className="linea-descripcion">
                        <input
                          type="text"
                          placeholder="Descripción del servicio/producto"
                          value={linea.descripcion}
                          onChange={(e) => actualizarLinea(index, 'descripcion', e.target.value)}
                        />
                      </div>
                      <div className="linea-cantidad">
                        <label>Cant.</label>
                        <input
                          type="number"
                          min="1"
                          value={linea.cantidad}
                          onChange={(e) => actualizarLinea(index, 'cantidad', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="linea-precio">
                        <label>Precio</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={linea.precioUnitario}
                          onChange={(e) => actualizarLinea(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="linea-descuento">
                        <label>Dto.%</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={linea.descuento}
                          onChange={(e) => actualizarLinea(index, 'descuento', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="linea-total">
                        {formatMoney(
                          (linea.cantidad || 0) * (linea.precioUnitario || 0) * (1 - (linea.descuento || 0) / 100)
                        )}
                      </div>
                      <button 
                        className="btn-remove-linea"
                        onClick={() => eliminarLinea(index)}
                        title="Eliminar línea"
                      >
                        {Icons.trash}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Configuración fiscal */}
              <div className="form-section">
                <h3>Impuestos y Pago</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tipo de IVA</label>
                    <select
                      value={formFactura.tipoIVA}
                      onChange={(e) => setFormFactura(prev => ({ ...prev, tipoIVA: e.target.value }))}
                    >
                      {Object.entries(TIPOS_IVA).map(([key, val]) => (
                        <option key={key} value={key}>{val.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Descuento Global (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formFactura.descuentoGlobal}
                      onChange={(e) => setFormFactura(prev => ({ ...prev, descuentoGlobal: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Forma de Pago</label>
                    <select
                      value={formFactura.formaPago}
                      onChange={(e) => setFormFactura(prev => ({ ...prev, formaPago: e.target.value }))}
                    >
                      {FORMAS_PAGO.map(fp => (
                        <option key={fp.value} value={fp.value}>{fp.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Vencimiento (días)</label>
                    <input
                      type="number"
                      min="0"
                      value={formFactura.diasVencimiento}
                      onChange={(e) => setFormFactura(prev => ({ ...prev, diasVencimiento: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div className="form-section">
                <div className="form-group">
                  <label>Notas / Observaciones</label>
                  <textarea
                    value={formFactura.notas}
                    onChange={(e) => setFormFactura(prev => ({ ...prev, notas: e.target.value }))}
                    placeholder="Notas adicionales para la factura..."
                    rows="3"
                  />
                </div>
              </div>

              {/* Resumen de totales */}
              <div className="totales-resumen">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>{formatMoney(totalesCalculados.subtotal)}</span>
                </div>
                {parseFloat(totalesCalculados.descuento) > 0 && (
                  <div className="total-row descuento">
                    <span>Descuento:</span>
                    <span>-{formatMoney(totalesCalculados.descuento)}</span>
                  </div>
                )}
                <div className="total-row">
                  <span>Base Imponible:</span>
                  <span>{formatMoney(totalesCalculados.baseImponible)}</span>
                </div>
                <div className="total-row">
                  <span>IVA ({TIPOS_IVA[formFactura.tipoIVA]?.valor}%):</span>
                  <span>{formatMoney(totalesCalculados.iva)}</span>
                </div>
                <div className="total-row total-final">
                  <span>TOTAL:</span>
                  <span>{formatMoney(totalesCalculados.total)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCrearModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleCrearFactura}>
                {Icons.check} Crear Factura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle Factura */}
      {showDetalleModal && (
        <div className="modal-overlay" onClick={() => setShowDetalleModal(null)}>
          <div className="modal-container modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{Icons.eye} Factura {showDetalleModal.numero}</h2>
              <button className="modal-close" onClick={() => setShowDetalleModal(null)}>
                {Icons.cancel}
              </button>
            </div>
            <div className="modal-body">
              <div className="factura-detalle">
                {/* Header de factura */}
                <div className="factura-detalle-header">
                  <div className="factura-info">
                    <div className="factura-numero-grande">{showDetalleModal.numero}</div>
                    <div className="factura-tipo-badge">{showDetalleModal.tipo}</div>
                    <span 
                      className="estado-badge grande"
                      style={{ backgroundColor: ESTADOS_FACTURA[showDetalleModal.estado]?.color }}
                    >
                      {ESTADOS_FACTURA[showDetalleModal.estado]?.icon}
                      {ESTADOS_FACTURA[showDetalleModal.estado]?.label}
                    </span>
                  </div>
                  <div className="factura-fechas">
                    <div>
                      <span className="label">Emisión:</span>
                      <span>{formatDate(showDetalleModal.fechaEmision)}</span>
                    </div>
                    <div>
                      <span className="label">Vencimiento:</span>
                      <span>{formatDate(showDetalleModal.fechaVencimiento)}</span>
                    </div>
                  </div>
                </div>

                {/* Datos emisor y cliente */}
                <div className="factura-partes">
                  <div className="parte-emisor">
                    <h4>Emisor</h4>
                    <p className="nombre">{showDetalleModal.emisor?.razonSocial}</p>
                    <p>{showDetalleModal.emisor?.nif}</p>
                    <p>{showDetalleModal.emisor?.direccion}</p>
                    <p>{showDetalleModal.emisor?.codigoPostal} {showDetalleModal.emisor?.ciudad}</p>
                  </div>
                  <div className="parte-cliente">
                    <h4>Cliente</h4>
                    <p className="nombre">{showDetalleModal.cliente?.nombre}</p>
                    {showDetalleModal.cliente?.nif && <p>{showDetalleModal.cliente.nif}</p>}
                    {showDetalleModal.cliente?.direccion && <p>{showDetalleModal.cliente.direccion}</p>}
                    {(showDetalleModal.cliente?.codigoPostal || showDetalleModal.cliente?.ciudad) && (
                      <p>{showDetalleModal.cliente.codigoPostal} {showDetalleModal.cliente.ciudad}</p>
                    )}
                  </div>
                </div>

                {/* Líneas de factura */}
                <div className="factura-lineas">
                  <h4>Detalle</h4>
                  <table className="lineas-table">
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th>Cant.</th>
                        <th>P. Unit.</th>
                        <th>Dto.</th>
                        <th>Base</th>
                        <th>IVA</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {showDetalleModal.lineas?.map((linea, idx) => (
                        <tr key={idx}>
                          <td>{linea.descripcion}</td>
                          <td className="center">{linea.cantidad}</td>
                          <td className="right">{formatMoney(linea.precioUnitario)}</td>
                          <td className="center">{linea.descuento || 0}%</td>
                          <td className="right">{formatMoney(linea.baseImponible)}</td>
                          <td className="right">{formatMoney(linea.iva)}</td>
                          <td className="right">{formatMoney(linea.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totales */}
                <div className="factura-totales">
                  <div className="totales-grid">
                    <div className="total-item">
                      <span>Subtotal</span>
                      <span>{formatMoney(showDetalleModal.totales?.subtotal)}</span>
                    </div>
                    {showDetalleModal.totales?.descuentoImporte > 0 && (
                      <div className="total-item descuento">
                        <span>Descuento ({showDetalleModal.totales.descuentoGlobal}%)</span>
                        <span>-{formatMoney(showDetalleModal.totales.descuentoImporte)}</span>
                      </div>
                    )}
                    <div className="total-item">
                      <span>Base Imponible</span>
                      <span>{formatMoney(showDetalleModal.totales?.baseImponible)}</span>
                    </div>
                    <div className="total-item">
                      <span>IVA ({showDetalleModal.impuestos?.porcentajeIVA}%)</span>
                      <span>{formatMoney(showDetalleModal.totales?.totalIVA)}</span>
                    </div>
                    <div className="total-item final">
                      <span>TOTAL</span>
                      <span>{formatMoney(showDetalleModal.totales?.totalFactura)}</span>
                    </div>
                  </div>
                </div>

                {/* Estado de pago */}
                <div className="factura-pago-info">
                  <div className="pago-estado">
                    <span className="label">Estado de Pago:</span>
                    <span className={`valor ${showDetalleModal.estadoPago}`}>
                      {showDetalleModal.estadoPago === 'pagado' ? 'Pagado' : 
                       showDetalleModal.estadoPago === 'parcial' ? 'Pago Parcial' : 'Pendiente'}
                    </span>
                  </div>
                  <div className="pago-importes">
                    <div>
                      <span className="label">Pagado:</span>
                      <span className="valor">{formatMoney(showDetalleModal.importePagado)}</span>
                    </div>
                    <div>
                      <span className="label">Pendiente:</span>
                      <span className="valor pendiente">
                        {formatMoney(showDetalleModal.totales?.totalFactura - showDetalleModal.importePagado)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Historial de pagos */}
                {showDetalleModal.pagos && showDetalleModal.pagos.length > 0 && (
                  <div className="factura-pagos-historial">
                    <h4>Historial de Pagos</h4>
                    <div className="pagos-lista">
                      {showDetalleModal.pagos.map((pago, idx) => (
                        <div key={idx} className="pago-item">
                          <span className="pago-fecha">{formatDate(pago.fecha)}</span>
                          <span className="pago-metodo">{pago.metodoPago}</span>
                          <span className="pago-importe">{formatMoney(pago.importe)}</span>
                          {pago.referencia && <span className="pago-ref">{pago.referencia}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notas */}
                {showDetalleModal.notas && (
                  <div className="factura-notas">
                    <h4>Notas</h4>
                    <p>{showDetalleModal.notas}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetalleModal(null)}>
                Cerrar
              </button>
              <button className="btn-info" onClick={() => {
                setShowExportarModal(showDetalleModal);
                setShowDetalleModal(null);
              }}>
                {Icons.export} Exportar
              </button>
              {showDetalleModal.estado !== 'anulada' && showDetalleModal.estado !== 'pagada' && (
                <button className="btn-success" onClick={() => {
                  setFormPago({
                    importe: (showDetalleModal.totales?.totalFactura - showDetalleModal.importePagado).toFixed(2),
                    metodoPago: 'efectivo',
                    referencia: ''
                  });
                  setShowPagoModal(showDetalleModal);
                  setShowDetalleModal(null);
                }}>
                  {Icons.payment} Registrar Pago
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Pago */}
      {showPagoModal && (
        <div className="modal-overlay" onClick={() => setShowPagoModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{Icons.payment} Registrar Pago</h2>
              <button className="modal-close" onClick={() => setShowPagoModal(null)}>
                {Icons.cancel}
              </button>
            </div>
            <div className="modal-body">
              <div className="pago-factura-info">
                <span className="factura-ref">{showPagoModal.numero}</span>
                <span className="cliente-ref">{showPagoModal.cliente?.nombre}</span>
              </div>
              <div className="pago-pendiente-info">
                <span>Total factura:</span>
                <span>{formatMoney(showPagoModal.totales?.totalFactura)}</span>
              </div>
              <div className="pago-pendiente-info">
                <span>Ya pagado:</span>
                <span>{formatMoney(showPagoModal.importePagado)}</span>
              </div>
              <div className="pago-pendiente-info destacado">
                <span>Pendiente:</span>
                <span>{formatMoney(showPagoModal.totales?.totalFactura - showPagoModal.importePagado)}</span>
              </div>
              
              <div className="form-group">
                <label>Importe a Pagar *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={showPagoModal.totales?.totalFactura - showPagoModal.importePagado}
                  value={formPago.importe}
                  onChange={(e) => setFormPago(prev => ({ ...prev, importe: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Método de Pago</label>
                <select
                  value={formPago.metodoPago}
                  onChange={(e) => setFormPago(prev => ({ ...prev, metodoPago: e.target.value }))}
                >
                  {FORMAS_PAGO.map(fp => (
                    <option key={fp.value} value={fp.value}>{fp.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Referencia (opcional)</label>
                <input
                  type="text"
                  value={formPago.referencia}
                  onChange={(e) => setFormPago(prev => ({ ...prev, referencia: e.target.value }))}
                  placeholder="Número de operación, transferencia..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowPagoModal(null)}>
                Cancelar
              </button>
              <button className="btn-success" onClick={handleRegistrarPago}>
                {Icons.check} Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Anular Factura */}
      {showAnularModal && (
        <div className="modal-overlay" onClick={() => setShowAnularModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header danger">
              <h2>{Icons.cancel} Anular Factura</h2>
              <button className="modal-close" onClick={() => setShowAnularModal(null)}>
                {Icons.cancel}
              </button>
            </div>
            <div className="modal-body">
              <div className="anulacion-warning">
                <span className="warning-icon">{Icons.alert}</span>
                <p>Esta acción no se puede deshacer. La factura quedará marcada como anulada.</p>
              </div>
              <div className="anulacion-factura-info">
                <span className="factura-ref">{showAnularModal.numero}</span>
                <span className="importe-ref">{formatMoney(showAnularModal.totales?.totalFactura)}</span>
              </div>
              <div className="form-group">
                <label>Motivo de Anulación *</label>
                <textarea
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  placeholder="Indica el motivo de la anulación..."
                  rows="4"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAnularModal(null)}>
                Cancelar
              </button>
              <button className="btn-danger" onClick={handleAnularFactura}>
                {Icons.cancel} Anular Factura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Exportar */}
      {showExportarModal && (
        <div className="modal-overlay" onClick={() => setShowExportarModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{Icons.export} Exportar Factura</h2>
              <button className="modal-close" onClick={() => setShowExportarModal(null)}>
                {Icons.cancel}
              </button>
            </div>
            <div className="modal-body">
              <div className="exportar-factura-info">
                <span className="factura-ref">{showExportarModal.numero}</span>
                <span className="cliente-ref">{showExportarModal.cliente?.nombre}</span>
              </div>
              <div className="export-options">
                <button className="export-option" onClick={() => handleExportar('JSON')}>
                  <div className="export-icon json">JSON</div>
                  <div className="export-info">
                    <span className="export-title">JSON</span>
                    <span className="export-desc">Formato estructurado para integraciones</span>
                  </div>
                </button>
                <button className="export-option" onClick={() => handleExportar('XML')}>
                  <div className="export-icon xml">XML</div>
                  <div className="export-info">
                    <span className="export-title">XML</span>
                    <span className="export-desc">Formato estándar de intercambio</span>
                  </div>
                </button>
                <button className="export-option" onClick={() => handleExportar('FACTURAE')}>
                  <div className="export-icon facturae">FE</div>
                  <div className="export-info">
                    <span className="export-title">Facturae 3.2.2</span>
                    <span className="export-desc">Formato oficial español para facturas electrónicas</span>
                  </div>
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowExportarModal(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configuración */}
      {showConfigModal && (
        <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="modal-container modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{Icons.settings} Configuración Fiscal</h2>
              <button className="modal-close" onClick={() => setShowConfigModal(false)}>
                {Icons.cancel}
              </button>
            </div>
            <div className="modal-body">
              <div className="form-section">
                <h3>Datos de la Empresa</h3>
                <div className="form-grid">
                  <div className="form-group span-2">
                    <label>Razón Social *</label>
                    <input
                      type="text"
                      value={formConfig.razonSocial}
                      onChange={(e) => setFormConfig(prev => ({ ...prev, razonSocial: e.target.value }))}
                      placeholder="Nombre legal de la empresa"
                    />
                  </div>
                  <div className="form-group span-2">
                    <label>Nombre Comercial</label>
                    <input
                      type="text"
                      value={formConfig.nombreComercial}
                      onChange={(e) => setFormConfig(prev => ({ ...prev, nombreComercial: e.target.value }))}
                      placeholder="Nombre comercial"
                    />
                  </div>
                  <div className="form-group">
                    <label>NIF / CIF *</label>
                    <input
                      type="text"
                      value={formConfig.nif}
                      onChange={(e) => setFormConfig(prev => ({ ...prev, nif: e.target.value.toUpperCase() }))}
                      placeholder="B12345678"
                    />
                  </div>
                  <div className="form-group span-3">
                    <label>Dirección *</label>
                    <input
                      type="text"
                      value={formConfig.direccion}
                      onChange={(e) => setFormConfig(prev => ({ ...prev, direccion: e.target.value }))}
                      placeholder="Calle, número..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Código Postal</label>
                    <input
                      type="text"
                      value={formConfig.codigoPostal}
                      onChange={(e) => setFormConfig(prev => ({ ...prev, codigoPostal: e.target.value }))}
                      placeholder="28001"
                    />
                  </div>
                  <div className="form-group">
                    <label>Ciudad</label>
                    <input
                      type="text"
                      value={formConfig.ciudad}
                      onChange={(e) => setFormConfig(prev => ({ ...prev, ciudad: e.target.value }))}
                      placeholder="Madrid"
                    />
                  </div>
                  <div className="form-group">
                    <label>Provincia</label>
                    <input
                      type="text"
                      value={formConfig.provincia}
                      onChange={(e) => setFormConfig(prev => ({ ...prev, provincia: e.target.value }))}
                      placeholder="Madrid"
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input
                      type="tel"
                      value={formConfig.telefono}
                      onChange={(e) => setFormConfig(prev => ({ ...prev, telefono: e.target.value }))}
                      placeholder="912345678"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formConfig.email}
                      onChange={(e) => setFormConfig(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="info@empresa.com"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowConfigModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleGuardarConfig}>
                {Icons.check} Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
