const express = require('express');
const { getDatabase, saveDatabase, loadDatabase } = require('../database/init');
const { verificarToken } = require('../middleware/auth');
const { getTenantFromRequest } = require('../middleware/tenantMiddleware');

const router = express.Router();

// Helper para obtener tenantId de manera consistente
const getTenantId = (req) => req.tenantId || req.tenant?.id || req.user?.tenantId || req.usuario?.tenantId || req.headers['x-tenant-id'] || 'demo';

// Obtener todas las ventas
router.get('/', verificarToken, getTenantFromRequest, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const tenantId = getTenantId(req);
    
    const ventasConInfo = (db.ventas || []).filter(v => v.tenant_id === tenantId || v.tenantId === tenantId).map(venta => {
      const cliente = (db.clientes || []).find(c => c.id === venta.cliente_id && (c.tenant_id === tenantId || c.tenantId === tenantId));
      const empleado = (db.empleados || []).find(e => e.id === venta.empleado_id && (e.tenant_id === tenantId || e.tenantId === tenantId));
      
      return {
        ...venta,
        cliente_nombre: cliente ? cliente.nombre : 'Cliente eliminado',
        empleado_nombre: empleado ? empleado.nombre : 'Sin empleado'
      };
    });

    res.json({
      success: true,
      ventas: ventasConInfo
    });
  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener ventas' 
    });
  }
});

// Crear nueva venta
router.post('/', verificarToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const { cliente_id, servicios, descuento, metodo_pago, notas } = req.body;

    // Validaciones
    if (!cliente_id) {
      return res.status(400).json({
        success: false,
        message: 'El cliente es requerido'
      });
    }

    if (!servicios || servicios.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe agregar al menos un servicio'
      });
    }

    if (!metodo_pago) {
      return res.status(400).json({
        success: false,
        message: 'El método de pago es requerido'
      });
    }

    // Verificar que el cliente existe y pertenece al tenant
    const cliente = (db.clientes || []).find(c => c.id === cliente_id && (c.tenantId === tenantId || c.tenant_id === tenantId));
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Calcular totales
    const subtotal = servicios.reduce((sum, s) => {
      const precio = parseFloat(s.precio) || 0;
      const cantidad = parseInt(s.cantidad) || 1;
      return sum + (precio * cantidad);
    }, 0);
    const descuentoAplicado = parseFloat(descuento) || 0;
    const total = Math.max(0, subtotal - descuentoAplicado);

    // Validar que el descuento no sea mayor al subtotal
    if (descuentoAplicado > subtotal) {
      return res.status(400).json({
        success: false,
        message: 'El descuento no puede ser mayor al subtotal'
      });
    }

    // Crear venta con tenantId
    const nuevaVenta = {
      id: (db.ventas || []).length > 0 ? Math.max(...db.ventas.map(v => v.id)) + 1 : 1,
      tenantId,
      tenant_id: tenantId,
      cliente_id,
      empleado_id: req.usuario?.id || 1,
      servicios: servicios.map(s => ({
        id: s.id,
        nombre: s.nombre,
        precio: parseFloat(s.precio) || 0,
        cantidad: parseInt(s.cantidad) || 1
      })),
      subtotal: parseFloat(subtotal.toFixed(2)),
      descuento: parseFloat(descuentoAplicado.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      metodo_pago,
      notas: notas || '',
      fecha: new Date().toISOString(),
      usuario_registro: req.usuario?.username || 'admin'
    };

    if (!db.ventas) db.ventas = [];
    db.ventas.push(nuevaVenta);
    saveDatabase();

    // Obtener información completa para respuesta
    const ventaCompleta = {
      ...nuevaVenta,
      cliente_nombre: cliente.nombre,
      cliente_telefono: cliente.telefono
    };

    res.json({
      success: true,
      message: 'Venta registrada exitosamente',
      data: ventaCompleta
    });
  } catch (error) {
    console.error('Error creando venta:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al registrar venta' 
    });
  }
});

// Obtener venta por ID
router.get('/:id', verificarToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const venta = (db.ventas || []).find(v => v.id === parseInt(req.params.id) && (v.tenantId === tenantId || v.tenant_id === tenantId));

    if (!venta) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    const cliente = (db.clientes || []).find(c => c.id === venta.cliente_id && (c.tenantId === tenantId || c.tenant_id === tenantId));
    
    res.json({
      success: true,
      venta: {
        ...venta,
        cliente_nombre: cliente ? cliente.nombre : 'Cliente eliminado',
        cliente_telefono: cliente ? cliente.telefono : ''
      }
    });
  } catch (error) {
    console.error('Error obteniendo venta:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener venta' 
    });
  }
});

// Obtener ventas del día
router.get('/hoy/resumen', verificarToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const hoy = new Date().toISOString().split('T')[0];
    
    const ventasHoy = (db.ventas || []).filter(v => (v.tenantId === tenantId || v.tenant_id === tenantId) && v.fecha && v.fecha.startsWith(hoy));
    const totalDia = ventasHoy.reduce((sum, v) => sum + (v.total || 0), 0);

    res.json({
      success: true,
      resumen: {
        cantidad: ventasHoy.length,
        total: totalDia,
        ventas: ventasHoy
      }
    });
  } catch (error) {
    console.error('Error obteniendo resumen del día:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener resumen' 
    });
  }
});

module.exports = router;
