/**
 * Reports Module - Sistema de Reportes y Análisis Profesional
 * NEURIAX Salon Manager - Enterprise Grade
 * 
 * Características:
 * - KPIs en tiempo real
 * - Gráficos interactivos
 * - Exportación PDF/Excel/CSV
 * - Manejo robusto de errores
 * - UI/UX Profesional
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { exportToCSV, exportToExcel, generatePrintablePDF } from '../../utils/exportUtils';
import '../../styles/modules.css';
import '../../styles/reports-enhanced.css';

export default function ReportsModule() {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const { isAuthenticated } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [reportType, setReportType] = useState('ventas');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const chartRef = useRef(null);
  const fetchedRef = useRef(false);
  const lastParamsRef = useRef('');

  // Calcular fechas según período
  const getDateRange = useCallback((period) => {
    const fin = new Date().toISOString().split('T')[0];
    let inicio;
    switch(period) {
      case 'week':
        inicio = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0];
        break;
      case 'year':
        inicio = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];
        break;
      case 'month':
      default:
        inicio = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
    }
    return { inicio, fin };
  }, []);

  // Cargar datos del backend
  const fetchReportData = useCallback(async (forceRefresh = false) => {
    const currentParams = `${selectedPeriod}-${reportType}`;
    
    // Evitar fetches duplicados
    if (!forceRefresh && fetchedRef.current && lastParamsRef.current === currentParams) {
      return;
    }
    
    setLoading(true);
    
    try {
      const { inicio, fin } = getDateRange(selectedPeriod);
      const res = await api.get(`/reportes?tipo=${reportType}&inicio=${inicio}&fin=${fin}`);
      
      if (res.data?.success && res.data?.data) {
        // El backend puede devolver 'reporte' dentro de 'data'
        const data = res.data.data.reporte || res.data.data;
        setReportData(data);
        fetchedRef.current = true;
        lastParamsRef.current = currentParams;
      } else {
        setReportData(null);
      }
    } catch (err) {
      console.error('Error cargando reportes:', err);
      setReportData(null);
      // Solo mostrar error una vez al inicio, no en cada cambio
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, reportType, getDateRange]);

  // Efecto para cargar datos cuando cambia el período o tipo
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        fetchedRef.current = false;
        fetchReportData();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, selectedPeriod, reportType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Datos por defecto si no hay datos del backend
  const defaultReport = useMemo(() => ({
    totalIngresos: 0,
    totalVentas: 0,
    ticketPromedio: 0,
    totalDescuentos: 0,
    porDia: {},
    porMetodoPago: { efectivo: 0, tarjeta: 0, transferencia: 0 }
  }), []);

  const currentReport = reportData || defaultReport;

  // Preparar datos del gráfico desde los datos del backend
  const chartData = useMemo(() => {
    const entries = Object.entries(currentReport.porDia || {}).slice(-7);
    return entries.map(([fecha, data]) => ({
      day: new Date(fecha).toLocaleDateString('es-ES', { weekday: 'short' }),
      fullDate: fecha,
      sales: typeof data === 'object' ? (data.total || 0) : (data || 0),
      transactions: typeof data === 'object' ? (data.cantidad || 0) : 1
    }));
  }, [currentReport.porDia]);

  // Si no hay datos, mostrar días de ejemplo
  const displayChartData = useMemo(() => {
    if (chartData.length > 0) return chartData;
    
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return days.map(day => ({ 
      day, 
      fullDate: '', 
      sales: 0, 
      transactions: 0 
    }));
  }, [chartData]);

  const maxSales = useMemo(() => 
    Math.max(...displayChartData.map(d => d.sales), 1)
  , [displayChartData]);

  // Calcular totales por método de pago para gráfico circular
  const paymentTotals = useMemo(() => ({
    efectivo: currentReport.porMetodoPago?.efectivo || 0,
    tarjeta: currentReport.porMetodoPago?.tarjeta || 0,
    transferencia: currentReport.porMetodoPago?.transferencia || 0
  }), [currentReport.porMetodoPago]);
  
  const paymentTotal = useMemo(() => 
    paymentTotals.efectivo + paymentTotals.tarjeta + paymentTotals.transferencia
  , [paymentTotals]);

  // Labels de período
  const periodLabels = useMemo(() => ({ 
    week: 'Esta Semana', 
    month: 'Este Mes', 
    year: 'Este Año' 
  }), []);

  // Funciones de exportación
  const handleExportPDF = useCallback(() => {
    setExporting(true);
    try {
      const statsContent = `
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-value">€${(currentReport.totalIngresos || 0).toFixed(2)}</div>
            <div class="stat-label">Ventas Totales</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${currentReport.totalVentas || 0}</div>
            <div class="stat-label">Transacciones</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">€${(currentReport.ticketPromedio || 0).toFixed(2)}</div>
            <div class="stat-label">Ticket Promedio</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">€${(currentReport.totalDescuentos || 0).toFixed(2)}</div>
            <div class="stat-label">Descuentos</div>
          </div>
        </div>
        
        <h3 style="margin-top: 30px; color: #333;">Desglose por Método de Pago</h3>
        <ul style="font-size: 14px; color: #666;">
          <li>Efectivo: €${(paymentTotals.efectivo).toFixed(2)}</li>
          <li>Tarjeta: €${(paymentTotals.tarjeta).toFixed(2)}</li>
          <li>Transferencia: €${(paymentTotals.transferencia).toFixed(2)}</li>
        </ul>
        
        <h3 style="margin-top: 30px; color: #333;">Ventas por Día</h3>
      `;

      const tableData = displayChartData.map(d => ({
        Día: d.day,
        Ventas: `€${d.sales.toFixed(2)}`,
        Transacciones: d.transactions
      }));

      generatePrintablePDF(
        `Reporte de Ventas - ${periodLabels[selectedPeriod]}`,
        statsContent,
        tableData
      );
      notifySuccess('PDF generado correctamente');
    } catch (err) {
      notifyError('Error al generar PDF');
    } finally {
      setExporting(false);
    }
  }, [currentReport, paymentTotals, displayChartData, selectedPeriod, periodLabels, notifySuccess, notifyError]);

  const handleExportExcel = useCallback(() => {
    setExporting(true);
    try {
      const excelData = [
        {
          Concepto: 'Total Ventas',
          Valor: `€${(currentReport.totalIngresos || 0).toFixed(2)}`,
          Periodo: periodLabels[selectedPeriod]
        },
        {
          Concepto: 'Transacciones',
          Valor: currentReport.totalVentas || 0,
          Periodo: ''
        },
        {
          Concepto: 'Ticket Promedio',
          Valor: `€${(currentReport.ticketPromedio || 0).toFixed(2)}`,
          Periodo: ''
        },
        {
          Concepto: 'Descuentos Aplicados',
          Valor: `€${(currentReport.totalDescuentos || 0).toFixed(2)}`,
          Periodo: ''
        },
        { Concepto: '', Valor: '', Periodo: '' },
        { Concepto: 'MÉTODOS DE PAGO', Valor: '', Periodo: '' },
        {
          Concepto: 'Efectivo',
          Valor: `€${(paymentTotals.efectivo).toFixed(2)}`,
          Periodo: `${paymentTotal > 0 ? ((paymentTotals.efectivo / paymentTotal) * 100).toFixed(1) : 0}%`
        },
        {
          Concepto: 'Tarjeta',
          Valor: `€${(paymentTotals.tarjeta).toFixed(2)}`,
          Periodo: `${paymentTotal > 0 ? ((paymentTotals.tarjeta / paymentTotal) * 100).toFixed(1) : 0}%`
        },
        {
          Concepto: 'Transferencia',
          Valor: `€${(paymentTotals.transferencia).toFixed(2)}`,
          Periodo: `${paymentTotal > 0 ? ((paymentTotals.transferencia / paymentTotal) * 100).toFixed(1) : 0}%`
        }
      ];

      exportToExcel(excelData, 'reporte_ventas', 'Resumen');
      notifySuccess('Excel descargado correctamente');
    } catch (err) {
      notifyError('Error al exportar Excel');
    } finally {
      setExporting(false);
    }
  }, [currentReport, paymentTotals, paymentTotal, selectedPeriod, periodLabels, notifySuccess, notifyError]);

  const handleExportCSV = useCallback(() => {
    setExporting(true);
    try {
      const csvData = displayChartData.map(d => ({
        Fecha: d.day,
        Ventas: d.sales,
        Transacciones: d.transactions
      }));
      
      exportToCSV(csvData, 'ventas_diarias');
      notifySuccess('CSV descargado correctamente');
    } catch (err) {
      notifyError('Error al exportar CSV');
    } finally {
      setExporting(false);
    }
  }, [displayChartData, notifySuccess, notifyError]);

  const handleRefresh = useCallback(() => {
    fetchReportData(true);
    notifySuccess('Datos actualizados');
  }, [fetchReportData, notifySuccess]);

  // Calcular estadísticas adicionales
  const additionalStats = useMemo(() => {
    const totalSales = displayChartData.reduce((a, b) => a + b.sales, 0);
    const avgDaily = displayChartData.length > 0 ? totalSales / displayChartData.length : 0;
    const salesWithValue = displayChartData.filter(d => d.sales > 0);
    const minSales = salesWithValue.length > 0 ? Math.min(...salesWithValue.map(d => d.sales)) : 0;
    const bestDay = displayChartData.reduce((best, curr) => 
      curr.sales > best.sales ? curr : best, displayChartData[0] || { day: '-', sales: 0 }
    );

    return { avgDaily, minSales, bestDay };
  }, [displayChartData]);

  return (
    <div className="reports-container">
      {/* Header */}
      <div className="reports-header">
        <div className="reports-title-section">
          <h2>📊 Reportes y Análisis</h2>
          <p className="reports-subtitle">Analiza el rendimiento de tu negocio</p>
        </div>
        <div className="reports-controls">
          <div className="report-type-selector">
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
              className="report-type-select"
            >
              <option value="ventas">📈 Ventas</option>
              <option value="servicios">✂️ Servicios</option>
              <option value="clientes">👥 Clientes</option>
              <option value="empleados">👤 Empleados</option>
              <option value="financiero">💰 Financiero</option>
            </select>
          </div>
          <div className="period-selector">
            {['week', 'month', 'year'].map(period => (
              <button
                key={period}
                className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
                onClick={() => setSelectedPeriod(period)}
              >
                {period === 'week' ? '7 Días' : period === 'month' ? '30 Días' : '1 Año'}
              </button>
            ))}
          </div>
          <button 
            className="refresh-btn" 
            onClick={handleRefresh}
            disabled={loading}
            title="Actualizar datos"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="reports-loading">
          <div className="loading-spinner"></div>
          <p>Cargando análisis...</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="reports-kpi-grid">
        <div className="report-kpi-card kpi-primary">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <p className="kpi-label">Ventas Totales</p>
            <p className="kpi-value">
              €{(currentReport.totalIngresos || 0).toLocaleString('es-ES', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
            <p className="kpi-trend positive">
              <span>📊</span> {periodLabels[selectedPeriod]}
            </p>
          </div>
        </div>

        <div className="report-kpi-card kpi-info">
          <div className="kpi-icon">🛒</div>
          <div className="kpi-content">
            <p className="kpi-label">Transacciones</p>
            <p className="kpi-value">{(currentReport.totalVentas || 0).toLocaleString('es-ES')}</p>
            <p className="kpi-sublabel">ventas realizadas</p>
          </div>
        </div>

        <div className="report-kpi-card kpi-success">
          <div className="kpi-icon">🎯</div>
          <div className="kpi-content">
            <p className="kpi-label">Ticket Promedio</p>
            <p className="kpi-value">€{(currentReport.ticketPromedio || 0).toFixed(2)}</p>
            <p className="kpi-sublabel">por transacción</p>
          </div>
        </div>

        <div className="report-kpi-card kpi-warning">
          <div className="kpi-icon">🏷️</div>
          <div className="kpi-content">
            <p className="kpi-label">Descuentos</p>
            <p className="kpi-value">€{(currentReport.totalDescuentos || 0).toFixed(2)}</p>
            <p className="kpi-sublabel">aplicados</p>
          </div>
        </div>
      </div>

      <div className="reports-grid">
        {/* Sales Chart */}
        <div className="report-section chart-section">
          <div className="section-header">
            <h3>📈 Tendencia de Ventas</h3>
            <button 
              className={`toggle-comparison ${comparisonMode ? 'active' : ''}`}
              onClick={() => setComparisonMode(!comparisonMode)}
            >
              {comparisonMode ? '✓ Comparación activa' : '📊 Comparar'}
            </button>
          </div>
          <div className="chart-container" ref={chartRef}>
            <div className="bar-chart enhanced">
              {displayChartData.map((data, index) => (
                <div key={`${data.day}-${index}`} className="bar-item">
                  <div className="bar-wrapper">
                    <div
                      className="bar animated"
                      style={{ 
                        height: `${Math.max((data.sales / maxSales) * 180, 4)}px`,
                        animationDelay: `${index * 0.1}s`
                      }}
                      title={`${data.day}: €${data.sales.toFixed(2)} - ${data.transactions} transacciones`}
                    >
                      {data.sales > 0 && (
                        <span className="bar-tooltip">
                          <strong>€{data.sales.toFixed(2)}</strong>
                          <small>{data.transactions} ventas</small>
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="bar-label">{data.day}</span>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-color primary"></span>
                Ventas (€)
              </span>
              {comparisonMode && (
                <span className="legend-item">
                  <span className="legend-color secondary"></span>
                  Período anterior
                </span>
              )}
            </div>
          </div>
          
          {/* Empty State */}
          {!loading && chartData.length === 0 && (
            <div className="chart-empty-state">
              <span className="empty-icon">📭</span>
              <p>No hay datos de ventas para este período</p>
              <small>Realiza ventas para ver tus estadísticas aquí</small>
            </div>
          )}
        </div>

        {/* Payment Methods - Donut Style */}
        <div className="report-section payment-section">
          <h3>💳 Métodos de Pago</h3>
          <div className="payment-donut-container">
            <div className="donut-chart">
              <svg viewBox="0 0 100 100">
                {/* Background circle */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e0e0e0" strokeWidth="12" />
                
                {/* Efectivo */}
                {paymentTotal > 0 && paymentTotals.efectivo > 0 && (
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="none" 
                    stroke="#27ae60" 
                    strokeWidth="12"
                    strokeDasharray={`${(paymentTotals.efectivo / paymentTotal) * 251.2} 251.2`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                    className="donut-segment"
                  />
                )}
                
                {/* Tarjeta */}
                {paymentTotal > 0 && paymentTotals.tarjeta > 0 && (
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="none" 
                    stroke="#6c5ce7" 
                    strokeWidth="12"
                    strokeDasharray={`${(paymentTotals.tarjeta / paymentTotal) * 251.2} 251.2`}
                    strokeDashoffset={`${-(paymentTotals.efectivo / paymentTotal) * 251.2}`}
                    transform="rotate(-90 50 50)"
                    className="donut-segment"
                  />
                )}
                
                {/* Transferencia */}
                {paymentTotal > 0 && paymentTotals.transferencia > 0 && (
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="none" 
                    stroke="#f39c12" 
                    strokeWidth="12"
                    strokeDasharray={`${(paymentTotals.transferencia / paymentTotal) * 251.2} 251.2`}
                    strokeDashoffset={`${-((paymentTotals.efectivo + paymentTotals.tarjeta) / paymentTotal) * 251.2}`}
                    transform="rotate(-90 50 50)"
                    className="donut-segment"
                  />
                )}
                
                {/* Center text */}
                <text x="50" y="46" textAnchor="middle" className="donut-total-label">Total</text>
                <text x="50" y="58" textAnchor="middle" className="donut-total-value">
                  €{paymentTotal.toFixed(0)}
                </text>
              </svg>
            </div>
            <div className="payment-legend">
              <div className="payment-legend-item">
                <span className="legend-dot efectivo"></span>
                <span className="legend-label">Efectivo</span>
                <span className="legend-value">€{paymentTotals.efectivo.toFixed(2)}</span>
                <span className="legend-percent">
                  {paymentTotal > 0 ? ((paymentTotals.efectivo / paymentTotal) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="payment-legend-item">
                <span className="legend-dot tarjeta"></span>
                <span className="legend-label">Tarjeta</span>
                <span className="legend-value">€{paymentTotals.tarjeta.toFixed(2)}</span>
                <span className="legend-percent">
                  {paymentTotal > 0 ? ((paymentTotals.tarjeta / paymentTotal) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="payment-legend-item">
                <span className="legend-dot transferencia"></span>
                <span className="legend-label">Transferencia</span>
                <span className="legend-value">€{paymentTotals.transferencia.toFixed(2)}</span>
                <span className="legend-percent">
                  {paymentTotal > 0 ? ((paymentTotals.transferencia / paymentTotal) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="report-section quick-stats">
        <h3>📋 Resumen Rápido</h3>
        <div className="quick-stats-grid">
          <div className="quick-stat">
            <div className="quick-stat-icon">📅</div>
            <div className="quick-stat-info">
              <span className="quick-stat-value">{chartData.length || 0}</span>
              <span className="quick-stat-label">Días con ventas</span>
            </div>
          </div>
          <div className="quick-stat highlight">
            <div className="quick-stat-icon">🏆</div>
            <div className="quick-stat-info">
              <span className="quick-stat-value">€{maxSales.toFixed(0)}</span>
              <span className="quick-stat-label">Mejor día ({additionalStats.bestDay.day})</span>
            </div>
          </div>
          <div className="quick-stat">
            <div className="quick-stat-icon">📉</div>
            <div className="quick-stat-info">
              <span className="quick-stat-value">€{additionalStats.minSales.toFixed(0)}</span>
              <span className="quick-stat-label">Día más bajo</span>
            </div>
          </div>
          <div className="quick-stat">
            <div className="quick-stat-icon">⚡</div>
            <div className="quick-stat-info">
              <span className="quick-stat-value">€{additionalStats.avgDaily.toFixed(0)}</span>
              <span className="quick-stat-label">Promedio diario</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="report-actions enhanced">
        <div className="export-section-header">
          <h4>📤 Exportar Reporte</h4>
          <p>Descarga este reporte en el formato que prefieras</p>
        </div>
        <div className="export-buttons">
          <button 
            className="export-btn pdf" 
            onClick={handleExportPDF}
            disabled={exporting || loading}
          >
            <span className="export-icon">📥</span>
            <span className="export-text">PDF</span>
          </button>
          <button 
            className="export-btn excel"
            onClick={handleExportExcel}
            disabled={exporting || loading}
          >
            <span className="export-icon">📊</span>
            <span className="export-text">Excel</span>
          </button>
          <button 
            className="export-btn csv"
            onClick={handleExportCSV}
            disabled={exporting || loading}
          >
            <span className="export-icon">📋</span>
            <span className="export-text">CSV</span>
          </button>
        </div>
        {exporting && (
          <div className="export-progress">
            <div className="export-spinner"></div>
            <span>Generando archivo...</span>
          </div>
        )}
      </div>

      {/* Data Info Footer */}
      <div className="reports-footer">
        <p className="data-timestamp">
          📊 Datos del período: {periodLabels[selectedPeriod]} 
          {currentReport.totalVentas > 0 ? ` • ${currentReport.totalVentas} transacciones analizadas` : ''}
        </p>
      </div>
    </div>
  );
}
