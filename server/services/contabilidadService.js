/**
 * PASO 51: Sistema de Conexión Contabilidad
 * Servicio completo para integración contable, exportación de datos y generación de asientos
 * Compatible con formatos estándar de contabilidad (A3, Sage, ContaPlus, Holded)
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURACIÓN CONTABLE
// ============================================================================

const CONTABILIDAD_CONFIG = {
  // Plan General Contable (PGC) - Cuentas más usadas
  cuentas: {
    // Grupo 1 - Financiación básica
    capitalSocial: '100',
    reservaLegal: '112',
    resultadoEjercicio: '129',
    
    // Grupo 2 - Activo no corriente
    mobiliario: '216',
    equiposInformaticos: '217',
    amortizacionAcumulada: '281',
    
    // Grupo 3 - Existencias
    mercaderias: '300',
    materiaPrima: '310',
    
    // Grupo 4 - Acreedores y deudores
    proveedores: '400',
    clientes: '430',
    clientesDudosoCobro: '436',
    haciendaAcreedoraIVA: '4750',
    haciendaDeudoraIVA: '4700',
    haciendaAcreedoraIRPF: '4751',
    organismosSS: '476',
    
    // Grupo 5 - Cuentas financieras
    bancos: '572',
    caja: '570',
    
    // Grupo 6 - Compras y gastos
    comprasMercaderias: '600',
    sueldosSalarios: '640',
    seguridadSocialEmpresa: '642',
    serviciosExternos: '629',
    suministros: '628',
    publicidad: '627',
    gastosFinancieros: '662',
    otrosGastos: '659',
    
    // Grupo 7 - Ventas e ingresos
    ventaServicios: '705',
    ventaProductos: '700',
    descuentosVentas: '709',
    ingresosFinancieros: '769',
    otrosIngresos: '759'
  },
  
  // Tipos de IVA
  tiposIVA: {
    general: { porcentaje: 21, cuentaRepercutido: '477', cuentaSoportado: '472' },
    reducido: { porcentaje: 10, cuentaRepercutido: '477', cuentaSoportado: '472' },
    superreducido: { porcentaje: 4, cuentaRepercutido: '477', cuentaSoportado: '472' }
  },
  
  // Métodos de pago y sus cuentas
  metodosPago: {
    efectivo: '570',
    tarjeta: '572',
    transferencia: '572',
    bizum: '572',
    domiciliacion: '572'
  },
  
  // Formatos de exportación soportados
  formatosExportacion: ['CSV', 'XLS', 'A3', 'SAGE', 'CONTAPLUS', 'JSON'],
  
  // Configuración de empresa
  empresa: {
    ejercicio: new Date().getFullYear(),
    diario: 1, // Diario general
    periodo: new Date().getMonth() + 1
  }
};

// ============================================================================
// CLASE PRINCIPAL
// ============================================================================

class ContabilidadService {
  constructor() {
    this.asientos = [];
    this.libroMayor = new Map();
    this.balances = [];
    this.contadorAsiento = 0;
    this.configuracion = { ...CONTABILIDAD_CONFIG };
    
    this.init();
  }
  
  init() {
    this.loadData();
    console.log('✓ Servicio de Contabilidad inicializado');
  }
  
  loadData() {
    try {
      const dataPath = path.join(__dirname, '../database/contabilidad.json');
      if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        this.asientos = data.asientos || [];
        this.contadorAsiento = data.contadorAsiento || 0;
        this.balances = data.balances || [];
      }
    } catch (error) {
      console.log('Iniciando con datos contables vacíos');
    }
  }
  
  saveData() {
    try {
      const dataPath = path.join(__dirname, '../database/contabilidad.json');
      fs.writeFileSync(dataPath, JSON.stringify({
        asientos: this.asientos,
        contadorAsiento: this.contadorAsiento,
        balances: this.balances,
        lastUpdate: new Date().toISOString()
      }, null, 2));
    } catch (error) {
      console.error('Error guardando contabilidad:', error);
    }
  }

  // --------------------------------------------------------------------------
  // GENERACIÓN DE ASIENTOS CONTABLES
  // --------------------------------------------------------------------------
  
  generarNumeroAsiento() {
    this.contadorAsiento++;
    const year = new Date().getFullYear();
    return `${year}-${String(this.contadorAsiento).padStart(6, '0')}`;
  }
  
  /**
   * Crear asiento contable manual
   */
  crearAsiento(datos) {
    const {
      fecha = new Date().toISOString(),
      concepto,
      lineas, // [{ cuenta, debe, haber, descripcion }]
      documento = '',
      tipo = 'manual'
    } = datos;
    
    // Validar que cuadre
    const totalDebe = lineas.reduce((sum, l) => sum + (l.debe || 0), 0);
    const totalHaber = lineas.reduce((sum, l) => sum + (l.haber || 0), 0);
    
    if (Math.abs(totalDebe - totalHaber) > 0.01) {
      throw new Error(`El asiento no cuadra: Debe=${totalDebe.toFixed(2)}, Haber=${totalHaber.toFixed(2)}`);
    }
    
    const asiento = {
      id: `asiento_${Date.now()}`,
      numero: this.generarNumeroAsiento(),
      fecha: fecha,
      concepto: concepto,
      lineas: lineas.map(l => ({
        cuenta: l.cuenta,
        descripcion: l.descripcion || '',
        debe: parseFloat((l.debe || 0).toFixed(2)),
        haber: parseFloat((l.haber || 0).toFixed(2))
      })),
      documento: documento,
      tipo: tipo,
      totalDebe: parseFloat(totalDebe.toFixed(2)),
      totalHaber: parseFloat(totalHaber.toFixed(2)),
      ejercicio: this.configuracion.empresa.ejercicio,
      periodo: new Date(fecha).getMonth() + 1,
      createdAt: new Date().toISOString()
    };
    
    this.asientos.push(asiento);
    this.actualizarLibroMayor(asiento);
    this.saveData();
    
    return asiento;
  }
  
  /**
   * Generar asiento desde venta/factura
   */
  generarAsientoVenta(venta) {
    const {
      id,
      total,
      subtotal,
      iva = 0,
      metodoPago = 'efectivo',
      cliente = 'Cliente contado',
      fecha = new Date().toISOString(),
      numeroFactura = ''
    } = venta;
    
    const cuentaCobro = this.configuracion.metodosPago[metodoPago] || '570';
    const baseImponible = subtotal || (total / 1.21);
    const cuotaIVA = iva || (total - baseImponible);
    
    const lineas = [
      // Cobro (Debe)
      {
        cuenta: cuentaCobro,
        descripcion: `Cobro ${metodoPago} - ${cliente}`,
        debe: total,
        haber: 0
      },
      // Ingreso por servicios (Haber)
      {
        cuenta: this.configuracion.cuentas.ventaServicios,
        descripcion: `Venta servicios - ${cliente}`,
        debe: 0,
        haber: parseFloat(baseImponible.toFixed(2))
      }
    ];
    
    // IVA repercutido si aplica
    if (cuotaIVA > 0) {
      lineas.push({
        cuenta: this.configuracion.tiposIVA.general.cuentaRepercutido,
        descripcion: `IVA repercutido 21%`,
        debe: 0,
        haber: parseFloat(cuotaIVA.toFixed(2))
      });
    }
    
    return this.crearAsiento({
      fecha,
      concepto: `Venta ${numeroFactura || id} - ${cliente}`,
      lineas,
      documento: numeroFactura || id,
      tipo: 'venta'
    });
  }
  
  /**
   * Generar asiento desde compra/gasto
   */
  generarAsientoCompra(compra) {
    const {
      id,
      total,
      subtotal,
      iva = 0,
      metodoPago = 'transferencia',
      proveedor = 'Proveedor',
      concepto = 'Compra mercaderías',
      fecha = new Date().toISOString(),
      numeroFactura = '',
      cuentaGasto = '600'
    } = compra;
    
    const cuentaPago = this.configuracion.metodosPago[metodoPago] || '572';
    const baseImponible = subtotal || (total / 1.21);
    const cuotaIVA = iva || (total - baseImponible);
    
    const lineas = [
      // Gasto (Debe)
      {
        cuenta: cuentaGasto,
        descripcion: `${concepto} - ${proveedor}`,
        debe: parseFloat(baseImponible.toFixed(2)),
        haber: 0
      }
    ];
    
    // IVA soportado si aplica
    if (cuotaIVA > 0) {
      lineas.push({
        cuenta: this.configuracion.tiposIVA.general.cuentaSoportado,
        descripcion: `IVA soportado 21%`,
        debe: parseFloat(cuotaIVA.toFixed(2)),
        haber: 0
      });
    }
    
    // Pago (Haber)
    lineas.push({
      cuenta: cuentaPago,
      descripcion: `Pago ${metodoPago} - ${proveedor}`,
      debe: 0,
      haber: total
    });
    
    return this.crearAsiento({
      fecha,
      concepto: `Compra ${numeroFactura || id} - ${proveedor}`,
      lineas,
      documento: numeroFactura || id,
      tipo: 'compra'
    });
  }
  
  /**
   * Generar asiento de nómina
   */
  generarAsientoNomina(nomina) {
    const {
      empleado,
      salarioBruto,
      ssEmpresa,
      ssEmpleado,
      irpf,
      salarioNeto,
      fecha = new Date().toISOString(),
      periodo = ''
    } = nomina;
    
    const lineas = [
      // Sueldo bruto (Debe)
      {
        cuenta: this.configuracion.cuentas.sueldosSalarios,
        descripcion: `Sueldo ${empleado}`,
        debe: salarioBruto,
        haber: 0
      },
      // SS empresa (Debe)
      {
        cuenta: this.configuracion.cuentas.seguridadSocialEmpresa,
        descripcion: `SS empresa ${empleado}`,
        debe: ssEmpresa,
        haber: 0
      },
      // SS a pagar (Haber)
      {
        cuenta: this.configuracion.cuentas.organismosSS,
        descripcion: `SS a pagar`,
        debe: 0,
        haber: ssEmpresa + ssEmpleado
      },
      // IRPF a pagar (Haber)
      {
        cuenta: this.configuracion.cuentas.haciendaAcreedoraIRPF,
        descripcion: `IRPF a pagar`,
        debe: 0,
        haber: irpf
      },
      // Neto a pagar (Haber)
      {
        cuenta: this.configuracion.cuentas.bancos,
        descripcion: `Nómina ${empleado}`,
        debe: 0,
        haber: salarioNeto
      }
    ];
    
    return this.crearAsiento({
      fecha,
      concepto: `Nómina ${periodo} - ${empleado}`,
      lineas,
      documento: `NOM-${periodo}`,
      tipo: 'nomina'
    });
  }
  
  /**
   * Generar asiento de arqueo de caja
   */
  generarAsientoArqueo(arqueo) {
    const {
      fecha,
      saldoInicial,
      saldoFinal,
      ingresos,
      gastos,
      diferencia = 0
    } = arqueo;
    
    // Solo crear asiento si hay diferencia
    if (Math.abs(diferencia) < 0.01) {
      return null;
    }
    
    const lineas = [];
    
    if (diferencia > 0) {
      // Sobrante de caja
      lineas.push(
        { cuenta: '570', descripcion: 'Sobrante caja', debe: diferencia, haber: 0 },
        { cuenta: '778', descripcion: 'Ingresos excepcionales', debe: 0, haber: diferencia }
      );
    } else {
      // Faltante de caja
      lineas.push(
        { cuenta: '678', descripcion: 'Gastos excepcionales', debe: Math.abs(diferencia), haber: 0 },
        { cuenta: '570', descripcion: 'Faltante caja', debe: 0, haber: Math.abs(diferencia) }
      );
    }
    
    return this.crearAsiento({
      fecha,
      concepto: `Regularización arqueo caja`,
      lineas,
      documento: `ARQ-${fecha.split('T')[0]}`,
      tipo: 'arqueo'
    });
  }

  // --------------------------------------------------------------------------
  // LIBRO MAYOR
  // --------------------------------------------------------------------------
  
  actualizarLibroMayor(asiento) {
    asiento.lineas.forEach(linea => {
      if (!this.libroMayor.has(linea.cuenta)) {
        this.libroMayor.set(linea.cuenta, {
          cuenta: linea.cuenta,
          movimientos: [],
          saldoDebe: 0,
          saldoHaber: 0
        });
      }
      
      const cuenta = this.libroMayor.get(linea.cuenta);
      cuenta.movimientos.push({
        fecha: asiento.fecha,
        asiento: asiento.numero,
        concepto: linea.descripcion,
        debe: linea.debe,
        haber: linea.haber
      });
      cuenta.saldoDebe += linea.debe;
      cuenta.saldoHaber += linea.haber;
    });
  }
  
  obtenerLibroMayor(cuenta = null) {
    if (cuenta) {
      return this.libroMayor.get(cuenta) || null;
    }
    return Object.fromEntries(this.libroMayor);
  }
  
  obtenerSaldoCuenta(cuenta) {
    const datos = this.libroMayor.get(cuenta);
    if (!datos) return { debe: 0, haber: 0, saldo: 0 };
    
    const saldo = datos.saldoDebe - datos.saldoHaber;
    return {
      debe: datos.saldoDebe,
      haber: datos.saldoHaber,
      saldo: saldo
    };
  }

  // --------------------------------------------------------------------------
  // BALANCES Y REPORTES
  // --------------------------------------------------------------------------
  
  generarBalanceSumas() {
    const balance = {
      fecha: new Date().toISOString(),
      tipo: 'sumas_saldos',
      ejercicio: this.configuracion.empresa.ejercicio,
      cuentas: []
    };
    
    this.libroMayor.forEach((datos, cuenta) => {
      balance.cuentas.push({
        cuenta: cuenta,
        sumaDebe: parseFloat(datos.saldoDebe.toFixed(2)),
        sumaHaber: parseFloat(datos.saldoHaber.toFixed(2)),
        saldoDeudor: datos.saldoDebe > datos.saldoHaber ? 
          parseFloat((datos.saldoDebe - datos.saldoHaber).toFixed(2)) : 0,
        saldoAcreedor: datos.saldoHaber > datos.saldoDebe ? 
          parseFloat((datos.saldoHaber - datos.saldoDebe).toFixed(2)) : 0
      });
    });
    
    // Ordenar por número de cuenta
    balance.cuentas.sort((a, b) => a.cuenta.localeCompare(b.cuenta));
    
    // Totales
    balance.totales = {
      sumaDebe: balance.cuentas.reduce((s, c) => s + c.sumaDebe, 0),
      sumaHaber: balance.cuentas.reduce((s, c) => s + c.sumaHaber, 0),
      saldoDeudor: balance.cuentas.reduce((s, c) => s + c.saldoDeudor, 0),
      saldoAcreedor: balance.cuentas.reduce((s, c) => s + c.saldoAcreedor, 0)
    };
    
    return balance;
  }
  
  generarCuentaResultados(fechaDesde, fechaHasta) {
    const asientosPeriodo = this.asientos.filter(a => 
      a.fecha >= fechaDesde && a.fecha <= fechaHasta
    );
    
    let ingresos = 0;
    let gastos = 0;
    const detalleIngresos = [];
    const detalleGastos = [];
    
    asientosPeriodo.forEach(asiento => {
      asiento.lineas.forEach(linea => {
        const grupo = linea.cuenta.charAt(0);
        
        if (grupo === '7') {
          // Ingresos
          const importe = linea.haber - linea.debe;
          ingresos += importe;
          detalleIngresos.push({
            cuenta: linea.cuenta,
            concepto: linea.descripcion,
            importe: importe
          });
        } else if (grupo === '6') {
          // Gastos
          const importe = linea.debe - linea.haber;
          gastos += importe;
          detalleGastos.push({
            cuenta: linea.cuenta,
            concepto: linea.descripcion,
            importe: importe
          });
        }
      });
    });
    
    return {
      periodo: { desde: fechaDesde, hasta: fechaHasta },
      ingresos: {
        total: parseFloat(ingresos.toFixed(2)),
        detalle: detalleIngresos
      },
      gastos: {
        total: parseFloat(gastos.toFixed(2)),
        detalle: detalleGastos
      },
      resultado: parseFloat((ingresos - gastos).toFixed(2)),
      margen: ingresos > 0 ? parseFloat(((ingresos - gastos) / ingresos * 100).toFixed(2)) : 0
    };
  }
  
  generarLibroDiario(fechaDesde, fechaHasta) {
    return this.asientos
      .filter(a => a.fecha >= fechaDesde && a.fecha <= fechaHasta)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
  
  generarResumenIVA(trimestre, year = new Date().getFullYear()) {
    const mesInicio = (trimestre - 1) * 3;
    const mesFin = mesInicio + 2;
    
    const fechaDesde = new Date(year, mesInicio, 1).toISOString();
    const fechaHasta = new Date(year, mesFin + 1, 0, 23, 59, 59).toISOString();
    
    const asientosPeriodo = this.asientos.filter(a => 
      a.fecha >= fechaDesde && a.fecha <= fechaHasta
    );
    
    let ivaRepercutido = 0;
    let ivaSoportado = 0;
    let baseVentas = 0;
    let baseCompras = 0;
    
    asientosPeriodo.forEach(asiento => {
      asiento.lineas.forEach(linea => {
        if (linea.cuenta === '477') {
          ivaRepercutido += linea.haber - linea.debe;
        } else if (linea.cuenta === '472') {
          ivaSoportado += linea.debe - linea.haber;
        } else if (linea.cuenta.startsWith('70')) {
          baseVentas += linea.haber - linea.debe;
        } else if (linea.cuenta.startsWith('60')) {
          baseCompras += linea.debe - linea.haber;
        }
      });
    });
    
    return {
      trimestre: trimestre,
      year: year,
      periodo: { desde: fechaDesde, hasta: fechaHasta },
      ventas: {
        base: parseFloat(baseVentas.toFixed(2)),
        iva: parseFloat(ivaRepercutido.toFixed(2))
      },
      compras: {
        base: parseFloat(baseCompras.toFixed(2)),
        iva: parseFloat(ivaSoportado.toFixed(2))
      },
      resultado: parseFloat((ivaRepercutido - ivaSoportado).toFixed(2)),
      aIngresar: ivaRepercutido > ivaSoportado,
      importe: Math.abs(parseFloat((ivaRepercutido - ivaSoportado).toFixed(2)))
    };
  }

  // --------------------------------------------------------------------------
  // EXPORTACIÓN DE DATOS
  // --------------------------------------------------------------------------
  
  exportarAsientos(formato, filtros = {}) {
    let asientos = [...this.asientos];
    
    // Aplicar filtros
    if (filtros.fechaDesde) {
      asientos = asientos.filter(a => a.fecha >= filtros.fechaDesde);
    }
    if (filtros.fechaHasta) {
      asientos = asientos.filter(a => a.fecha <= filtros.fechaHasta);
    }
    if (filtros.tipo) {
      asientos = asientos.filter(a => a.tipo === filtros.tipo);
    }
    
    switch (formato.toUpperCase()) {
      case 'JSON':
        return JSON.stringify(asientos, null, 2);
      case 'CSV':
        return this.exportarCSV(asientos);
      case 'A3':
        return this.exportarA3(asientos);
      case 'SAGE':
        return this.exportarSage(asientos);
      case 'CONTAPLUS':
        return this.exportarContaPlus(asientos);
      default:
        throw new Error(`Formato no soportado: ${formato}`);
    }
  }
  
  exportarCSV(asientos) {
    const cabecera = 'Numero;Fecha;Cuenta;Concepto;Debe;Haber;Documento\n';
    
    const lineas = asientos.flatMap(asiento => 
      asiento.lineas.map(linea => 
        `${asiento.numero};${asiento.fecha.split('T')[0]};${linea.cuenta};` +
        `"${linea.descripcion}";${linea.debe};${linea.haber};${asiento.documento}`
      )
    ).join('\n');
    
    return cabecera + lineas;
  }
  
  exportarA3(asientos) {
    // Formato compatible con A3 Software
    return asientos.flatMap(asiento => 
      asiento.lineas.map(linea => ({
        EJERCICIO: asiento.ejercicio,
        PERIODO: asiento.periodo,
        ASESSION: asiento.numero,
        FECHA: asiento.fecha.split('T')[0].replace(/-/g, ''),
        CUENTA: linea.cuenta.padEnd(12, '0'),
        DEBE: linea.debe.toFixed(2),
        HABER: linea.haber.toFixed(2),
        CONCEPTO: linea.descripcion.substring(0, 40),
        DOCUMENTO: asiento.documento.substring(0, 20)
      }))
    );
  }
  
  exportarSage(asientos) {
    // Formato compatible con Sage (ContaPlus moderno)
    const lineas = asientos.flatMap(asiento => 
      asiento.lineas.map((linea, idx) => [
        asiento.ejercicio,
        asiento.numero,
        idx + 1,
        asiento.fecha.split('T')[0],
        linea.cuenta,
        linea.debe.toFixed(2),
        linea.haber.toFixed(2),
        linea.descripcion,
        asiento.documento
      ].join('|'))
    );
    
    return lineas.join('\n');
  }
  
  exportarContaPlus(asientos) {
    // Formato XBase/DBF simulado para ContaPlus clásico
    return asientos.flatMap(asiento => 
      asiento.lineas.map(linea => {
        const fecha = asiento.fecha.split('T')[0].replace(/-/g, '');
        return `${asiento.ejercicio}${fecha}${linea.cuenta.padEnd(12)}` +
               `${String(linea.debe * 100).padStart(15, '0')}` +
               `${String(linea.haber * 100).padStart(15, '0')}` +
               `${linea.descripcion.padEnd(40).substring(0, 40)}`;
      })
    ).join('\n');
  }

  // --------------------------------------------------------------------------
  // IMPORTACIÓN DE DATOS
  // --------------------------------------------------------------------------
  
  importarAsientosCSV(csvData) {
    const lineas = csvData.split('\n').slice(1); // Saltar cabecera
    const asientosAgrupados = new Map();
    
    lineas.forEach(linea => {
      if (!linea.trim()) return;
      
      const [numero, fecha, cuenta, concepto, debe, haber, documento] = 
        linea.split(';').map(s => s.replace(/"/g, '').trim());
      
      if (!asientosAgrupados.has(numero)) {
        asientosAgrupados.set(numero, {
          fecha: fecha,
          concepto: concepto,
          documento: documento,
          lineas: []
        });
      }
      
      asientosAgrupados.get(numero).lineas.push({
        cuenta,
        descripcion: concepto,
        debe: parseFloat(debe) || 0,
        haber: parseFloat(haber) || 0
      });
    });
    
    const importados = [];
    asientosAgrupados.forEach((datos, numero) => {
      try {
        const asiento = this.crearAsiento({
          fecha: new Date(datos.fecha).toISOString(),
          concepto: datos.concepto,
          lineas: datos.lineas,
          documento: datos.documento,
          tipo: 'importado'
        });
        importados.push(asiento);
      } catch (error) {
        console.error(`Error importando asiento ${numero}:`, error.message);
      }
    });
    
    return { importados: importados.length, errores: asientosAgrupados.size - importados.length };
  }

  // --------------------------------------------------------------------------
  // CONSULTAS
  // --------------------------------------------------------------------------
  
  listarAsientos(filtros = {}) {
    let resultado = [...this.asientos];
    
    if (filtros.fechaDesde) {
      resultado = resultado.filter(a => a.fecha >= filtros.fechaDesde);
    }
    if (filtros.fechaHasta) {
      resultado = resultado.filter(a => a.fecha <= filtros.fechaHasta);
    }
    if (filtros.tipo) {
      resultado = resultado.filter(a => a.tipo === filtros.tipo);
    }
    if (filtros.concepto) {
      resultado = resultado.filter(a => 
        a.concepto.toLowerCase().includes(filtros.concepto.toLowerCase())
      );
    }
    
    resultado.sort((a, b) => b.fecha.localeCompare(a.fecha));
    
    if (filtros.limite) {
      resultado = resultado.slice(0, filtros.limite);
    }
    
    return resultado;
  }
  
  obtenerAsiento(id) {
    return this.asientos.find(a => a.id === id || a.numero === id);
  }
  
  obtenerEstadisticas() {
    const año = new Date().getFullYear();
    const asientosAño = this.asientos.filter(a => 
      a.fecha.startsWith(String(año))
    );
    
    let totalIngresos = 0;
    let totalGastos = 0;
    
    asientosAño.forEach(asiento => {
      asiento.lineas.forEach(linea => {
        if (linea.cuenta.startsWith('7')) {
          totalIngresos += linea.haber - linea.debe;
        } else if (linea.cuenta.startsWith('6')) {
          totalGastos += linea.debe - linea.haber;
        }
      });
    });
    
    return {
      ejercicio: año,
      totalAsientos: asientosAño.length,
      ingresos: parseFloat(totalIngresos.toFixed(2)),
      gastos: parseFloat(totalGastos.toFixed(2)),
      resultado: parseFloat((totalIngresos - totalGastos).toFixed(2)),
      porTipo: {
        ventas: asientosAño.filter(a => a.tipo === 'venta').length,
        compras: asientosAño.filter(a => a.tipo === 'compra').length,
        nominas: asientosAño.filter(a => a.tipo === 'nomina').length,
        otros: asientosAño.filter(a => !['venta', 'compra', 'nomina'].includes(a.tipo)).length
      }
    };
  }
  
  obtenerPlanCuentas() {
    return this.configuracion.cuentas;
  }
  
  obtenerConfiguracion() {
    return this.configuracion;
  }
}

// ============================================================================
// INSTANCIA SINGLETON
// ============================================================================

const contabilidadService = new ContabilidadService();

// ============================================================================
// RUTAS EXPRESS
// ============================================================================

function createContabilidadRoutes(verificarToken) {
  const router = require('express').Router();
  
  // Crear asiento manual
  router.post('/asiento', verificarToken, (req, res) => {
    try {
      const asiento = contabilidadService.crearAsiento(req.body);
      res.json({ success: true, asiento });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  
  // Crear asiento desde venta
  router.post('/asiento/venta', verificarToken, (req, res) => {
    try {
      const asiento = contabilidadService.generarAsientoVenta(req.body);
      res.json({ success: true, asiento });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  
  // Crear asiento desde compra
  router.post('/asiento/compra', verificarToken, (req, res) => {
    try {
      const asiento = contabilidadService.generarAsientoCompra(req.body);
      res.json({ success: true, asiento });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  
  // Crear asiento de nómina
  router.post('/asiento/nomina', verificarToken, (req, res) => {
    try {
      const asiento = contabilidadService.generarAsientoNomina(req.body);
      res.json({ success: true, asiento });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  
  // Listar asientos
  router.get('/asientos', verificarToken, (req, res) => {
    try {
      const asientos = contabilidadService.listarAsientos(req.query);
      res.json({ success: true, asientos, total: asientos.length });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Obtener asiento por ID
  router.get('/asiento/:id', verificarToken, (req, res) => {
    try {
      const asiento = contabilidadService.obtenerAsiento(req.params.id);
      if (!asiento) {
        return res.status(404).json({ success: false, error: 'Asiento no encontrado' });
      }
      res.json({ success: true, asiento });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Libro Mayor
  router.get('/libro-mayor', verificarToken, (req, res) => {
    try {
      const libroMayor = contabilidadService.obtenerLibroMayor(req.query.cuenta);
      res.json({ success: true, libroMayor });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Balance de sumas y saldos
  router.get('/balance-sumas', verificarToken, (req, res) => {
    try {
      const balance = contabilidadService.generarBalanceSumas();
      res.json({ success: true, balance });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Cuenta de resultados
  router.get('/cuenta-resultados', verificarToken, (req, res) => {
    try {
      const { fechaDesde, fechaHasta } = req.query;
      const resultado = contabilidadService.generarCuentaResultados(fechaDesde, fechaHasta);
      res.json({ success: true, resultado });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Libro diario
  router.get('/libro-diario', verificarToken, (req, res) => {
    try {
      const { fechaDesde, fechaHasta } = req.query;
      const diario = contabilidadService.generarLibroDiario(fechaDesde, fechaHasta);
      res.json({ success: true, diario });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Resumen IVA trimestral
  router.get('/iva/:trimestre', verificarToken, (req, res) => {
    try {
      const trimestre = parseInt(req.params.trimestre);
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const resumen = contabilidadService.generarResumenIVA(trimestre, year);
      res.json({ success: true, resumen });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Exportar asientos
  router.get('/exportar/:formato', verificarToken, (req, res) => {
    try {
      const contenido = contabilidadService.exportarAsientos(
        req.params.formato,
        req.query
      );
      
      const formato = req.params.formato.toUpperCase();
      let contentType = 'application/json';
      let extension = 'json';
      
      if (formato === 'CSV') {
        contentType = 'text/csv';
        extension = 'csv';
      } else if (['A3', 'SAGE', 'CONTAPLUS'].includes(formato)) {
        contentType = 'text/plain';
        extension = 'txt';
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 
        `attachment; filename=contabilidad_${new Date().toISOString().split('T')[0]}.${extension}`);
      res.send(typeof contenido === 'string' ? contenido : JSON.stringify(contenido, null, 2));
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  
  // Importar asientos CSV
  router.post('/importar/csv', verificarToken, (req, res) => {
    try {
      const { csvData } = req.body;
      const resultado = contabilidadService.importarAsientosCSV(csvData);
      res.json({ success: true, ...resultado });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  
  // Estadísticas
  router.get('/estadisticas', verificarToken, (req, res) => {
    try {
      const estadisticas = contabilidadService.obtenerEstadisticas();
      res.json({ success: true, estadisticas });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Plan de cuentas
  router.get('/plan-cuentas', verificarToken, (req, res) => {
    try {
      const planCuentas = contabilidadService.obtenerPlanCuentas();
      res.json({ success: true, planCuentas });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Configuración
  router.get('/config', verificarToken, (req, res) => {
    try {
      const config = contabilidadService.obtenerConfiguracion();
      res.json({ success: true, config });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  return router;
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

module.exports = {
  contabilidadService,
  ContabilidadService,
  CONTABILIDAD_CONFIG,
  createContabilidadRoutes
};
