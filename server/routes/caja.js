const express = require('express');
const { getDatabase, saveDatabase, loadDatabase } = require('../database/init');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// Helper para obtener tenantId de manera consistente
const getTenantId = (req) => req.tenantId || req.user?.tenantId || req.usuario?.tenantId || req.headers['x-tenant-id'] || 'demo';

// Obtener estado de caja actual
router.get('/actual', verificarToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const tenantId = getTenantId(req);
    
    // Buscar caja abierta del tenant
    const cajas = (db.cajas || []).filter(c => c.tenantId === tenantId);
    const cajaAbierta = cajas.find(c => c.estado === 'abierta');

    if (!cajaAbierta) {
      return res.json({
        success: true,
        caja: null,
        mensaje: 'No hay caja abierta'
      });
    }

    // Calcular totales del día (solo ventas del tenant)
    const hoy = new Date().toISOString().split('T')[0];
    const ventas = (db.ventas || []).filter(v => v.tenantId === tenantId || v.tenant_id === tenantId);
    const gastos = (db.gastos || []).filter(g => g.tenantId === tenantId);
    
    const ventasHoy = ventas.filter(v => {
      if (!v.fecha) return false;
      return v.fecha.split('T')[0] === hoy;
    });

    const totalEfectivo = ventasHoy.filter(v => v.metodo_pago === 'efectivo').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
    const totalTarjeta = ventasHoy.filter(v => v.metodo_pago === 'tarjeta').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
    const totalTransferencia = ventasHoy.filter(v => v.metodo_pago === 'transferencia').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);

    const gastosHoy = gastos.filter(g => {
      if (!g.fecha) return false;
      return g.fecha.split('T')[0] === hoy;
    });

    const totalGastos = gastosHoy.reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);

    res.json({
      success: true,
      caja: {
        ...cajaAbierta,
        totalEfectivo,
        totalTarjeta,
        totalTransferencia,
        totalVentas: totalEfectivo + totalTarjeta + totalTransferencia,
        totalGastos,
        cantidadVentas: ventasHoy.length,
        cantidadGastos: gastosHoy.length,
        efectivoEnCaja: (cajaAbierta.monto_inicial || 0) + totalEfectivo - totalGastos
      }
    });
  } catch (error) {
    console.error('Error obteniendo caja actual:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener caja actual' 
    });
  }
});

// Obtener historial de cajas
router.get('/historial', verificarToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const tenantId = getTenantId(req);
    
    const cajas = (db.cajas || [])
      .filter(c => c.tenantId === tenantId)
      .sort((a, b) => new Date(b.fecha_apertura) - new Date(a.fecha_apertura));

    res.json({
      success: true,
      cajas
    });
  } catch (error) {
    console.error('Error obteniendo historial de cajas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener historial' 
    });
  }
});

// Abrir caja
router.post('/abrir', verificarToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const { monto_inicial, notas } = req.body;

    // Verificar que no haya caja abierta para este tenant
    const cajas = (db.cajas || []).filter(c => c.tenantId === tenantId);
    const cajaAbierta = cajas.find(c => c.estado === 'abierta');
    
    if (cajaAbierta) {
      return res.status(400).json({
        success: false,
        message: 'Ya hay una caja abierta. Ciérrala primero.'
      });
    }

    if (monto_inicial === undefined || monto_inicial < 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto inicial debe ser mayor o igual a 0'
      });
    }

    const nuevaCaja = {
      id: (db.cajas || []).length > 0 ? Math.max(...db.cajas.map(c => c.id)) + 1 : 1,
      tenantId,
      fecha_apertura: new Date().toISOString(),
      fecha_cierre: null,
      monto_inicial: parseFloat(monto_inicial),
      monto_final: null,
      estado: 'abierta',
      notas_apertura: notas || '',
      notas_cierre: null,
      usuario_apertura: req.usuario?.username || 'admin'
    };

    if (!db.cajas) db.cajas = [];
    db.cajas.push(nuevaCaja);
    saveDatabase();

    res.json({
      success: true,
      message: 'Caja abierta exitosamente',
      caja: nuevaCaja
    });
  } catch (error) {
    console.error('Error abriendo caja:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al abrir caja' 
    });
  }
});

// Cerrar caja
router.post('/cerrar', verificarToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const { monto_final, notas } = req.body;

    // Buscar caja abierta del tenant
    const indexCaja = (db.cajas || []).findIndex(c => c.estado === 'abierta' && c.tenantId === tenantId);
    
    if (indexCaja === -1) {
      return res.status(400).json({
        success: false,
        message: 'No hay caja abierta para cerrar'
      });
    }

    // Calcular totales del día (solo del tenant)
    const caja = db.cajas[indexCaja];
    const fechaCaja = caja.fecha_apertura.split('T')[0];
    const ventas = (db.ventas || []).filter(v => v.tenantId === tenantId || v.tenant_id === tenantId);
    const gastos = (db.gastos || []).filter(g => g.tenantId === tenantId);
    
    const ventasDia = ventas.filter(v => {
      if (!v.fecha) return false;
      return v.fecha.split('T')[0] === fechaCaja;
    });

    const totalEfectivo = ventasDia.filter(v => v.metodo_pago === 'efectivo').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
    const totalTarjeta = ventasDia.filter(v => v.metodo_pago === 'tarjeta').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
    const totalTransferencia = ventasDia.filter(v => v.metodo_pago === 'transferencia').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);

    const gastosDia = gastos.filter(g => {
      if (!g.fecha) return false;
      return g.fecha.split('T')[0] === fechaCaja;
    });
    const totalGastos = gastosDia.reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);

    const efectivoEsperado = (caja.monto_inicial || 0) + totalEfectivo - totalGastos;

    // Actualizar caja
    db.cajas[indexCaja] = {
      ...caja,
      fecha_cierre: new Date().toISOString(),
      monto_final: parseFloat(monto_final) || efectivoEsperado,
      estado: 'cerrada',
      notas_cierre: notas || '',
      usuario_cierre: req.usuario?.username || 'admin',
      resumen: {
        totalVentas: totalEfectivo + totalTarjeta + totalTransferencia,
        totalEfectivo,
        totalTarjeta,
        totalTransferencia,
        totalGastos,
        cantidadVentas: ventasDia.length,
        cantidadGastos: gastosDia.length,
        efectivoEsperado,
        diferencia: (parseFloat(monto_final) || efectivoEsperado) - efectivoEsperado
      }
    };

    saveDatabase();

    res.json({
      success: true,
      message: 'Caja cerrada exitosamente',
      caja: db.cajas[indexCaja]
    });
  } catch (error) {
    console.error('Error cerrando caja:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al cerrar caja' 
    });
  }
});

// Registrar gasto
router.post('/gasto', verificarToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const { concepto, monto, categoria } = req.body;

    if (!concepto || !monto) {
      return res.status(400).json({
        success: false,
        message: 'Concepto y monto son requeridos'
      });
    }

    const nuevoGasto = {
      id: (db.gastos || []).length > 0 ? Math.max(...db.gastos.map(g => g.id)) + 1 : 1,
      tenantId,
      concepto,
      monto: parseFloat(monto),
      categoria: categoria || 'General',
      fecha: new Date().toISOString(),
      usuario: req.usuario?.username || 'admin'
    };

    if (!db.gastos) db.gastos = [];
    db.gastos.push(nuevoGasto);
    saveDatabase();

    res.json({
      success: true,
      message: 'Gasto registrado',
      gasto: nuevoGasto
    });
  } catch (error) {
    console.error('Error registrando gasto:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al registrar gasto' 
    });
  }
});

// Obtener resumen de caja del día
router.get('/resumen-dia', verificarToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const tenantId = getTenantId(req);
    
    const hoy = new Date().toISOString().split('T')[0];
    const ventas = (db.ventas || []).filter(v => v.tenantId === tenantId || v.tenant_id === tenantId);
    const gastos = (db.gastos || []).filter(g => g.tenantId === tenantId);
    
    const ventasHoy = ventas.filter(v => {
      if (!v.fecha) return false;
      return v.fecha.split('T')[0] === hoy;
    });

    const gastosHoy = gastos.filter(g => {
      if (!g.fecha) return false;
      return g.fecha.split('T')[0] === hoy;
    });

    const totalEfectivo = ventasHoy.filter(v => v.metodo_pago === 'efectivo').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
    const totalTarjeta = ventasHoy.filter(v => v.metodo_pago === 'tarjeta').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
    const totalTransferencia = ventasHoy.filter(v => v.metodo_pago === 'transferencia').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
    const totalGastos = gastosHoy.reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);

    // Clientes del tenant para el resumen
    const clientesTenant = (db.clientes || []).filter(c => c.tenantId === tenantId);

    res.json({
      success: true,
      resumen: {
        fecha: hoy,
        totalVentas: totalEfectivo + totalTarjeta + totalTransferencia,
        totalEfectivo,
        totalTarjeta,
        totalTransferencia,
        totalGastos,
        cantidadVentas: ventasHoy.length,
        cantidadGastos: gastosHoy.length,
        neto: (totalEfectivo + totalTarjeta + totalTransferencia) - totalGastos
      },
      ventas: ventasHoy.map(v => {
        const cliente = clientesTenant.find(c => c.id === v.cliente_id);
        return {
          id: v.id,
          hora: v.fecha ? new Date(v.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '',
          cliente: cliente ? cliente.nombre : 'Cliente',
          total: v.total,
          metodo_pago: v.metodo_pago
        };
      }),
      gastos: gastosHoy
    });
  } catch (error) {
    console.error('Error obteniendo resumen del día:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener resumen' 
    });
  }
});

// ============================================
// ENDPOINTS AVANZADOS - SISTEMA DE CAJA PROFESIONAL
// ============================================

// Obtener todos los movimientos del día (ventas + gastos + entradas/salidas)
router.get('/movimientos', verificarToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const { fecha } = req.query;
    
    const fechaFiltro = fecha || new Date().toISOString().split('T')[0];
    
    // Obtener ventas del día
    const ventas = (db.ventas || [])
      .filter(v => (v.tenantId === tenantId || v.tenant_id === tenantId) && v.fecha?.startsWith(fechaFiltro))
      .map(v => ({
        id: `venta-${v.id}`,
        tipo: 'venta',
        concepto: `Venta #${v.id}`,
        monto: parseFloat(v.total) || 0,
        metodo_pago: v.metodo_pago || 'efectivo',
        fecha: v.fecha,
        usuario: v.usuario || 'Sistema',
        detalles: v.items || []
      }));
    
    // Obtener gastos del día
    const gastos = (db.gastos || [])
      .filter(g => g.tenantId === tenantId && g.fecha?.startsWith(fechaFiltro))
      .map(g => ({
        id: `gasto-${g.id}`,
        tipo: 'gasto',
        concepto: g.concepto,
        monto: -(parseFloat(g.monto) || 0),
        metodo_pago: 'efectivo',
        categoria: g.categoria,
        fecha: g.fecha,
        usuario: g.usuario || 'Sistema'
      }));
    
    // Obtener entradas/salidas manuales
    const movimientosManuales = (db.movimientos_caja || [])
      .filter(m => m.tenantId === tenantId && m.fecha?.startsWith(fechaFiltro))
      .map(m => ({
        id: `mov-${m.id}`,
        tipo: m.tipo,
        concepto: m.concepto,
        monto: m.tipo === 'entrada' ? parseFloat(m.monto) : -parseFloat(m.monto),
        metodo_pago: 'efectivo',
        fecha: m.fecha,
        usuario: m.usuario || 'Sistema'
      }));
    
    // Combinar y ordenar por fecha
    const movimientos = [...ventas, ...gastos, ...movimientosManuales]
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    // Calcular totales
    const totales = {
      ingresos: movimientos.filter(m => m.monto > 0).reduce((sum, m) => sum + m.monto, 0),
      egresos: movimientos.filter(m => m.monto < 0).reduce((sum, m) => sum + Math.abs(m.monto), 0),
      balance: movimientos.reduce((sum, m) => sum + m.monto, 0)
    };
    
    res.json({
      success: true,
      fecha: fechaFiltro,
      movimientos,
      totales,
      cantidad: movimientos.length
    });
  } catch (error) {
    console.error('Error obteniendo movimientos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener movimientos' });
  }
});

// Registrar entrada de efectivo
router.post('/entrada', verificarToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const { monto, concepto } = req.body;

    if (!monto || monto <= 0) {
      return res.status(400).json({ success: false, message: 'El monto debe ser mayor a 0' });
    }

    if (!db.movimientos_caja) db.movimientos_caja = [];

    const nuevoMovimiento = {
      id: db.movimientos_caja.length > 0 ? Math.max(...db.movimientos_caja.map(m => m.id)) + 1 : 1,
      tenantId,
      tipo: 'entrada',
      monto: parseFloat(monto),
      concepto: concepto || 'Entrada de efectivo',
      fecha: new Date().toISOString(),
      usuario: req.usuario?.username || 'admin'
    };

    db.movimientos_caja.push(nuevoMovimiento);
    saveDatabase();

    res.json({
      success: true,
      message: 'Entrada registrada correctamente',
      movimiento: nuevoMovimiento
    });
  } catch (error) {
    console.error('Error registrando entrada:', error);
    res.status(500).json({ success: false, message: 'Error al registrar entrada' });
  }
});

// Registrar salida de efectivo
router.post('/salida', verificarToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const { monto, concepto } = req.body;

    if (!monto || monto <= 0) {
      return res.status(400).json({ success: false, message: 'El monto debe ser mayor a 0' });
    }

    if (!db.movimientos_caja) db.movimientos_caja = [];

    const nuevoMovimiento = {
      id: db.movimientos_caja.length > 0 ? Math.max(...db.movimientos_caja.map(m => m.id)) + 1 : 1,
      tenantId,
      tipo: 'salida',
      monto: parseFloat(monto),
      concepto: concepto || 'Salida de efectivo',
      fecha: new Date().toISOString(),
      usuario: req.usuario?.username || 'admin'
    };

    db.movimientos_caja.push(nuevoMovimiento);
    saveDatabase();

    res.json({
      success: true,
      message: 'Salida registrada correctamente',
      movimiento: nuevoMovimiento
    });
  } catch (error) {
    console.error('Error registrando salida:', error);
    res.status(500).json({ success: false, message: 'Error al registrar salida' });
  }
});

// Realizar arqueo de caja
router.post('/arqueo', verificarToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const { conteo_efectivo, notas } = req.body;

    // Buscar caja abierta
    const cajaAbierta = (db.cajas || []).find(c => c.estado === 'abierta' && c.tenantId === tenantId);
    
    if (!cajaAbierta) {
      return res.status(400).json({ success: false, message: 'No hay caja abierta para arquear' });
    }

    // Calcular efectivo esperado
    const hoy = new Date().toISOString().split('T')[0];
    const ventas = (db.ventas || []).filter(v => 
      (v.tenantId === tenantId || v.tenant_id === tenantId) && 
      v.fecha?.startsWith(hoy) && 
      v.metodo_pago === 'efectivo'
    );
    const gastos = (db.gastos || []).filter(g => g.tenantId === tenantId && g.fecha?.startsWith(hoy));
    const movimientos = (db.movimientos_caja || []).filter(m => m.tenantId === tenantId && m.fecha?.startsWith(hoy));
    
    const ventasEfectivo = ventas.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
    const totalGastos = gastos.reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);
    const entradasManuales = movimientos.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + parseFloat(m.monto), 0);
    const salidasManuales = movimientos.filter(m => m.tipo === 'salida').reduce((sum, m) => sum + parseFloat(m.monto), 0);
    
    const efectivoEsperado = (cajaAbierta.monto_inicial || 0) + ventasEfectivo - totalGastos + entradasManuales - salidasManuales;
    const diferencia = parseFloat(conteo_efectivo) - efectivoEsperado;

    // Guardar arqueo
    if (!db.arqueos) db.arqueos = [];
    
    const nuevoArqueo = {
      id: db.arqueos.length > 0 ? Math.max(...db.arqueos.map(a => a.id)) + 1 : 1,
      tenantId,
      caja_id: cajaAbierta.id,
      fecha: new Date().toISOString(),
      efectivo_esperado: efectivoEsperado,
      efectivo_contado: parseFloat(conteo_efectivo),
      diferencia,
      estado: Math.abs(diferencia) < 0.01 ? 'cuadrado' : diferencia > 0 ? 'sobrante' : 'faltante',
      notas: notas || '',
      usuario: req.usuario?.username || 'admin',
      desglose: {
        monto_inicial: cajaAbierta.monto_inicial,
        ventas_efectivo: ventasEfectivo,
        gastos: totalGastos,
        entradas_manuales: entradasManuales,
        salidas_manuales: salidasManuales
      }
    };

    db.arqueos.push(nuevoArqueo);
    saveDatabase();

    res.json({
      success: true,
      message: 'Arqueo realizado correctamente',
      arqueo: nuevoArqueo
    });
  } catch (error) {
    console.error('Error realizando arqueo:', error);
    res.status(500).json({ success: false, message: 'Error al realizar arqueo' });
  }
});

// Obtener historial de arqueos
router.get('/arqueos', verificarToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const tenantId = getTenantId(req);
    
    const arqueos = (db.arqueos || [])
      .filter(a => a.tenantId === tenantId)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.json({
      success: true,
      arqueos
    });
  } catch (error) {
    console.error('Error obteniendo arqueos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener arqueos' });
  }
});

// Obtener estadísticas de caja (semanal/mensual)
router.get('/estadisticas', verificarToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const { periodo } = req.query; // 'semana' o 'mes'
    
    const hoy = new Date();
    let fechaInicio;
    
    if (periodo === 'mes') {
      fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    } else {
      // Por defecto, última semana
      fechaInicio = new Date(hoy);
      fechaInicio.setDate(hoy.getDate() - 7);
    }
    
    const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
    
    // Filtrar datos del período
    const ventas = (db.ventas || []).filter(v => 
      (v.tenantId === tenantId || v.tenant_id === tenantId) && 
      v.fecha && v.fecha >= fechaInicioStr
    );
    const gastos = (db.gastos || []).filter(g => 
      g.tenantId === tenantId && 
      g.fecha && g.fecha >= fechaInicioStr
    );
    const cajas = (db.cajas || []).filter(c => 
      c.tenantId === tenantId && 
      c.estado === 'cerrada' && 
      c.fecha_cierre >= fechaInicioStr
    );
    
    // Calcular estadísticas
    const totalVentas = ventas.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
    const totalGastos = gastos.reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);
    
    const ventasPorMetodo = {
      efectivo: ventas.filter(v => v.metodo_pago === 'efectivo').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0),
      tarjeta: ventas.filter(v => v.metodo_pago === 'tarjeta').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0),
      transferencia: ventas.filter(v => v.metodo_pago === 'transferencia').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0)
    };
    
    // Agrupar por día para gráfica
    const ventasPorDia = {};
    ventas.forEach(v => {
      const dia = v.fecha?.split('T')[0];
      if (dia) {
        ventasPorDia[dia] = (ventasPorDia[dia] || 0) + (parseFloat(v.total) || 0);
      }
    });
    
    // Categorías de gastos
    const gastosPorCategoria = {};
    gastos.forEach(g => {
      const cat = g.categoria || 'General';
      gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + (parseFloat(g.monto) || 0);
    });
    
    // Promedio de diferencias en arqueos
    const arqueos = (db.arqueos || []).filter(a => 
      a.tenantId === tenantId && a.fecha >= fechaInicioStr
    );
    const promedioDiferencia = arqueos.length > 0 
      ? arqueos.reduce((sum, a) => sum + Math.abs(a.diferencia || 0), 0) / arqueos.length 
      : 0;
    
    res.json({
      success: true,
      periodo: periodo || 'semana',
      fechaInicio: fechaInicioStr,
      fechaFin: hoy.toISOString().split('T')[0],
      estadisticas: {
        totalVentas,
        totalGastos,
        balance: totalVentas - totalGastos,
        cantidadVentas: ventas.length,
        cantidadGastos: gastos.length,
        ticketPromedio: ventas.length > 0 ? totalVentas / ventas.length : 0,
        cajasAbiertas: cajas.length,
        promedioDiferenciaArqueo: promedioDiferencia
      },
      ventasPorMetodo,
      ventasPorDia: Object.entries(ventasPorDia).map(([fecha, total]) => ({ fecha, total })),
      gastosPorCategoria: Object.entries(gastosPorCategoria).map(([categoria, total]) => ({ categoria, total }))
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
});

// Obtener categorías de gastos disponibles
router.get('/categorias-gastos', verificarToken, (req, res) => {
  try {
    const categorias = [
      { id: 'general', nombre: 'General', icono: '📁' },
      { id: 'proveedores', nombre: 'Proveedores', icono: '🏭' },
      { id: 'servicios', nombre: 'Servicios (luz, agua, etc)', icono: '💡' },
      { id: 'sueldos', nombre: 'Sueldos y Salarios', icono: '💰' },
      { id: 'materiales', nombre: 'Materiales de trabajo', icono: '🧴' },
      { id: 'limpieza', nombre: 'Limpieza', icono: '🧹' },
      { id: 'marketing', nombre: 'Marketing/Publicidad', icono: '📢' },
      { id: 'mantenimiento', nombre: 'Mantenimiento', icono: '🔧' },
      { id: 'impuestos', nombre: 'Impuestos', icono: '📋' },
      { id: 'otros', nombre: 'Otros', icono: '📌' }
    ];
    
    res.json({ success: true, categorias });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener categorías' });
  }
});

// Obtener detalle de una caja específica
router.get('/:id', verificarToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const cajaId = parseInt(req.params.id);
    
    const caja = (db.cajas || []).find(c => c.id === cajaId && c.tenantId === tenantId);
    
    if (!caja) {
      return res.status(404).json({ success: false, message: 'Caja no encontrada' });
    }
    
    // Obtener movimientos de esa caja
    const fechaCaja = caja.fecha_apertura.split('T')[0];
    const ventas = (db.ventas || []).filter(v => 
      (v.tenantId === tenantId || v.tenant_id === tenantId) && 
      v.fecha?.startsWith(fechaCaja)
    );
    const gastos = (db.gastos || []).filter(g => 
      g.tenantId === tenantId && g.fecha?.startsWith(fechaCaja)
    );
    const movimientos = (db.movimientos_caja || []).filter(m => 
      m.tenantId === tenantId && m.fecha?.startsWith(fechaCaja)
    );
    const arqueos = (db.arqueos || []).filter(a => 
      a.tenantId === tenantId && a.caja_id === cajaId
    );
    
    res.json({
      success: true,
      caja,
      ventas,
      gastos,
      movimientos,
      arqueos
    });
  } catch (error) {
    console.error('Error obteniendo detalle de caja:', error);
    res.status(500).json({ success: false, message: 'Error al obtener detalle de caja' });
  }
});

module.exports = router;
