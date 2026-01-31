const express = require('express');
const { getDatabase, loadDatabase } = require('../database/init');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// Helper para obtener tenantId
const getTenantId = (req) => req.tenantId || req.user?.tenantId || req.usuario?.tenantId || req.headers['x-tenant-id'] || 'demo';

// Endpoint principal de reportes con tipo dinámico
router.get('/', verificarToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const tenantId = getTenantId(req);
    const { tipo, inicio, fin } = req.query;

    // Filtrar ventas por tenant y fecha
    let ventas = [...(db.ventas || [])].filter(v => v.tenantId === tenantId || v.tenant_id === tenantId);
    if (inicio && fin) {
      ventas = ventas.filter(v => {
        if (!v.fecha) return false;
        const fechaVenta = v.fecha.split('T')[0];
        return fechaVenta >= inicio && fechaVenta <= fin;
      });
    }

    // Datos del tenant para los reportes
    const dbTenant = {
      clientes: (db.clientes || []).filter(c => c.tenantId === tenantId),
      empleados: (db.empleados || []).filter(e => e.tenantId === tenantId),
      servicios: (db.servicios || []).filter(s => s.tenantId === tenantId),
      productos: (db.productos || []).filter(p => p.tenantId === tenantId)
    };

    let resultado = {};

    switch(tipo) {
      case 'ventas':
        resultado = generarReporteVentas(ventas, dbTenant);
        break;
      case 'servicios':
        resultado = generarReporteServicios(ventas, dbTenant);
        break;
      case 'empleados':
        resultado = generarReporteEmpleados(ventas, dbTenant);
        break;
      case 'clientes':
        resultado = generarReporteClientes(ventas, dbTenant);
        break;
      case 'financiero':
        resultado = generarReporteFinanciero(ventas, dbTenant, inicio, fin);
        break;
      case 'horas':
        resultado = generarReporteHoras(ventas);
        break;
      default:
        resultado = generarReporteVentas(ventas, dbTenant);
    }

    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al generar reporte' 
    });
  }
});

// Función: Reporte de Ventas
function generarReporteVentas(ventas, db) {
  const totalVentas = ventas.length;
  const totalIngresos = ventas.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
  const totalDescuentos = ventas.reduce((sum, v) => sum + (parseFloat(v.descuento) || 0), 0);
  const ticketPromedio = totalVentas > 0 ? totalIngresos / totalVentas : 0;

  // Por método de pago
  const porMetodoPago = {
    efectivo: ventas.filter(v => v.metodo_pago === 'efectivo').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0),
    tarjeta: ventas.filter(v => v.metodo_pago === 'tarjeta').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0),
    transferencia: ventas.filter(v => v.metodo_pago === 'transferencia').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0)
  };

  // Por día
  const porDia = {};
  ventas.forEach(v => {
    if (!v.fecha) return;
    const dia = v.fecha.split('T')[0];
    if (!porDia[dia]) {
      porDia[dia] = { cantidad: 0, total: 0 };
    }
    porDia[dia].cantidad++;
    porDia[dia].total += parseFloat(v.total) || 0;
  });

  // Lista de ventas con info de cliente
  const ventasDetalle = ventas.map(v => {
    const cliente = (db.clientes || []).find(c => c.id === v.cliente_id);
    return {
      id: v.id,
      fecha: v.fecha,
      cliente: cliente ? cliente.nombre : 'Cliente',
      servicios: v.servicios?.length || 0,
      subtotal: v.subtotal || 0,
      descuento: v.descuento || 0,
      total: v.total || 0,
      metodo_pago: v.metodo_pago || 'efectivo'
    };
  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return {
    reporte: {
      totalVentas,
      totalIngresos,
      totalDescuentos,
      ticketPromedio,
      porMetodoPago,
      porDia
    },
    ventas: ventasDetalle
  };
}

// Función: Reporte de Servicios Top
function generarReporteServicios(ventas, db) {
  const serviciosCount = {};

  ventas.forEach(venta => {
    if (!venta.servicios) return;
    venta.servicios.forEach(vs => {
      const servicioId = vs.id || vs.servicio_id;
      const nombre = vs.nombre || 'Sin nombre';
      const precio = parseFloat(vs.precio) || 0;
      const cantidad = parseInt(vs.cantidad) || 1;
      
      if (!serviciosCount[servicioId]) {
        serviciosCount[servicioId] = { cantidad: 0, nombre, ingresos: 0 };
      }
      serviciosCount[servicioId].cantidad += cantidad;
      serviciosCount[servicioId].ingresos += precio * cantidad;
    });
  });

  const topServicios = Object.entries(serviciosCount)
    .map(([id, data]) => ({
      id: parseInt(id),
      nombre: data.nombre,
      cantidad: data.cantidad,
      ingresos: data.ingresos
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);

  return { servicios: topServicios };
}

// Función: Reporte de Empleados Top
function generarReporteEmpleados(ventas, db) {
  const empleadosStats = {};

  ventas.forEach(venta => {
    const empId = venta.empleado_id || 1;
    if (!empleadosStats[empId]) {
      empleadosStats[empId] = { cantidad: 0, ingresos: 0 };
    }
    empleadosStats[empId].cantidad++;
    empleadosStats[empId].ingresos += parseFloat(venta.total) || 0;
  });

  const empleados = Object.entries(empleadosStats)
    .map(([id, stats]) => {
      const empleado = (db.empleados || []).find(e => e.id === parseInt(id));
      return {
        id: parseInt(id),
        nombre: empleado ? empleado.nombre : 'Administrador',
        cargo: empleado ? empleado.cargo : 'Admin',
        ventas: stats.cantidad,
        ingresos: stats.ingresos
      };
    })
    .sort((a, b) => b.ingresos - a.ingresos);

  return { empleados };
}

// Función: Reporte de Clientes Frecuentes
function generarReporteClientes(ventas, db) {
  const clientesStats = {};

  ventas.forEach(venta => {
    const clienteId = venta.cliente_id;
    if (!clienteId) return;
    
    if (!clientesStats[clienteId]) {
      clientesStats[clienteId] = { visitas: 0, gastado: 0 };
    }
    clientesStats[clienteId].visitas++;
    clientesStats[clienteId].gastado += parseFloat(venta.total) || 0;
  });

  const clientes = Object.entries(clientesStats)
    .map(([id, stats]) => {
      const cliente = (db.clientes || []).find(c => c.id === parseInt(id));
      return {
        id: parseInt(id),
        nombre: cliente ? cliente.nombre : 'Cliente',
        telefono: cliente ? cliente.telefono : '',
        visitas: stats.visitas,
        total_gastado: stats.gastado,
        ticket_promedio: stats.visitas > 0 ? stats.gastado / stats.visitas : 0
      };
    })
    .sort((a, b) => b.visitas - a.visitas)
    .slice(0, 10);

  return { clientes };
}

// Función: Reporte Financiero
function generarReporteFinanciero(ventas, db, inicio, fin) {
  let gastos = [...(db.gastos || [])];
  
  if (inicio && fin) {
    gastos = gastos.filter(g => {
      if (!g.fecha) return false;
      const fechaGasto = g.fecha.split('T')[0];
      return fechaGasto >= inicio && fechaGasto <= fin;
    });
  }

  const totalIngresos = ventas.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
  const totalGastos = gastos.reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);
  const utilidadBruta = totalIngresos - totalGastos;

  // Gastos por categoría
  const gastosPorCategoria = {};
  gastos.forEach(g => {
    const cat = g.categoria || 'Otros';
    gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + (parseFloat(g.monto) || 0);
  });

  return {
    financiero: {
      ingresos: {
        total: totalIngresos,
        cantidad_ventas: ventas.length
      },
      gastos: {
        total: totalGastos,
        cantidad_gastos: gastos.length,
        por_categoria: gastosPorCategoria
      },
      utilidad: {
        bruta: utilidadBruta,
        margen: totalIngresos > 0 ? (utilidadBruta / totalIngresos) * 100 : 0
      }
    }
  };
}

// Función: Reporte de Horas Pico
function generarReporteHoras(ventas) {
  const porHora = {};
  for (let i = 8; i <= 21; i++) {
    porHora[i] = { cantidad: 0, ingresos: 0 };
  }

  ventas.forEach(v => {
    if (!v.fecha) return;
    const hora = new Date(v.fecha).getHours();
    if (porHora[hora]) {
      porHora[hora].cantidad++;
      porHora[hora].ingresos += parseFloat(v.total) || 0;
    }
  });

  const horas = Object.entries(porHora)
    .map(([hora, stats]) => ({
      hora: parseInt(hora),
      hora_formato: `${hora.toString().padStart(2, '0')}:00`,
      cantidad: stats.cantidad,
      ingresos: stats.ingresos
    }))
    .sort((a, b) => b.cantidad - a.cantidad);

  return { horas };
}

module.exports = router;
