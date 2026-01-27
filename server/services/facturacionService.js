/**
 * PASO 50: Sistema de Facturación Electrónica
 * Servicio completo para generación, gestión y envío de facturas electrónicas
 * Incluye soporte para múltiples formatos y regulaciones
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURACIÓN DE FACTURACIÓN
// ============================================================================

const FACTURACION_CONFIG = {
  // Información de la empresa
  empresa: {
    nombre: 'NEURIAX Salon',
    razonSocial: 'NEURIAX Technologies S.L.',
    nif: 'B12345678',
    direccion: 'Calle Principal 123',
    codigoPostal: '28001',
    ciudad: 'Madrid',
    provincia: 'Madrid',
    pais: 'España',
    telefono: '+34 912 345 678',
    email: 'facturacion@NEURIAX.com',
    web: 'www.NEURIAX.com',
    logo: '/images/logo.png'
  },
  
  // Configuración fiscal
  fiscal: {
    regimen: 'general', // 'general', 'simplificado', 'recargo'
    tipoIVA: {
      general: 21,
      reducido: 10,
      superreducido: 4,
      exento: 0
    },
    retencionIRPF: 0, // Para servicios profesionales
    moneda: 'EUR',
    simboloMoneda: '€'
  },
  
  // Series de facturación
  series: {
    facturas: { prefijo: 'FAC', contador: 0 },
    rectificativas: { prefijo: 'REC', contador: 0 },
    proformas: { prefijo: 'PRO', contador: 0 },
    tickets: { prefijo: 'TIC', contador: 0 }
  },
  
  // Formatos de exportación
  exportFormats: ['PDF', 'XML', 'JSON', 'FACTURAE'],
  
  // Retención de facturas (años)
  retencionAnios: 6,
  
  // Límites
  limites: {
    maxLineasFactura: 100,
    maxDescuentoGlobal: 50, // %
    maxDiasVencimiento: 365
  }
};

// ============================================================================
// CLASE PRINCIPAL DEL SERVICIO
// ============================================================================

class FacturacionService {
  constructor() {
    this.facturas = [];
    this.contadores = { ...FACTURACION_CONFIG.series };
    this.clientes = new Map();
    this.plantillas = new Map();
    this.estadisticas = {
      totalEmitidas: 0,
      totalImporte: 0,
      totalIVA: 0,
      porEstado: {},
      porMes: {}
    };
    
    this.init();
  }
  
  // --------------------------------------------------------------------------
  // INICIALIZACIÓN
  // --------------------------------------------------------------------------
  
  init() {
    this.loadData();
    this.initPlantillas();
    console.log('✓ Servicio de Facturación Electrónica inicializado');
  }
  
  loadData() {
    try {
      const dataPath = path.join(__dirname, '../database/facturas.json');
      if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        this.facturas = data.facturas || [];
        this.contadores = data.contadores || this.contadores;
        this.estadisticas = data.estadisticas || this.estadisticas;
      }
    } catch (error) {
      console.log('Iniciando con datos de facturación vacíos');
    }
  }
  
  saveData() {
    try {
      const dataPath = path.join(__dirname, '../database/facturas.json');
      fs.writeFileSync(dataPath, JSON.stringify({
        facturas: this.facturas,
        contadores: this.contadores,
        estadisticas: this.estadisticas,
        lastUpdate: new Date().toISOString()
      }, null, 2));
    } catch (error) {
      console.error('Error guardando facturas:', error);
    }
  }
  
  initPlantillas() {
    this.plantillas.set('estandar', {
      id: 'estandar',
      nombre: 'Factura Estándar',
      campos: ['numero', 'fecha', 'cliente', 'lineas', 'totales']
    });
    
    this.plantillas.set('detallada', {
      id: 'detallada',
      nombre: 'Factura Detallada',
      campos: ['numero', 'fecha', 'cliente', 'lineas', 'impuestos', 'totales', 'notas']
    });
    
    this.plantillas.set('simplificada', {
      id: 'simplificada',
      nombre: 'Factura Simplificada (Ticket)',
      campos: ['numero', 'fecha', 'lineas', 'total']
    });
  }
  
  // --------------------------------------------------------------------------
  // GENERACIÓN DE NÚMERO DE FACTURA
  // --------------------------------------------------------------------------
  
  generarNumeroFactura(tipo = 'facturas') {
    const serie = this.contadores[tipo];
    if (!serie) throw new Error(`Serie no válida: ${tipo}`);
    
    const year = new Date().getFullYear();
    serie.contador++;
    
    const numero = `${serie.prefijo}-${year}-${String(serie.contador).padStart(6, '0')}`;
    this.saveData();
    
    return numero;
  }
  
  // --------------------------------------------------------------------------
  // CREAR FACTURA
  // --------------------------------------------------------------------------
  
  crearFactura(datosFactura) {
    const {
      cliente,
      lineas,
      tipoIVA = 'general',
      descuentoGlobal = 0,
      notas = '',
      formaPago = 'efectivo',
      diasVencimiento = 0,
      tipo = 'facturas',
      empleadoId = null,
      ventaId = null
    } = datosFactura;
    
    // Validaciones
    if (!cliente || !cliente.nombre) {
      throw new Error('Datos del cliente requeridos');
    }
    
    if (!lineas || lineas.length === 0) {
      throw new Error('La factura debe tener al menos una línea');
    }
    
    if (lineas.length > FACTURACION_CONFIG.limites.maxLineasFactura) {
      throw new Error(`Máximo ${FACTURACION_CONFIG.limites.maxLineasFactura} líneas por factura`);
    }
    
    if (descuentoGlobal > FACTURACION_CONFIG.limites.maxDescuentoGlobal) {
      throw new Error(`Descuento máximo: ${FACTURACION_CONFIG.limites.maxDescuentoGlobal}%`);
    }
    
    // Calcular líneas con IVA
    const porcentajeIVA = FACTURACION_CONFIG.fiscal.tipoIVA[tipoIVA];
    const lineasCalculadas = lineas.map(linea => {
      const baseLinea = linea.cantidad * linea.precioUnitario;
      const descuentoLinea = baseLinea * (linea.descuento || 0) / 100;
      const baseConDescuento = baseLinea - descuentoLinea;
      const ivaLinea = baseConDescuento * porcentajeIVA / 100;
      
      return {
        ...linea,
        baseImponible: parseFloat(baseConDescuento.toFixed(2)),
        iva: parseFloat(ivaLinea.toFixed(2)),
        total: parseFloat((baseConDescuento + ivaLinea).toFixed(2))
      };
    });
    
    // Calcular totales
    const subtotal = lineasCalculadas.reduce((sum, l) => sum + l.baseImponible, 0);
    const descuentoGlobalImporte = subtotal * descuentoGlobal / 100;
    const baseImponible = subtotal - descuentoGlobalImporte;
    const totalIVA = baseImponible * porcentajeIVA / 100;
    const totalFactura = baseImponible + totalIVA;
    
    // Crear factura
    const factura = {
      id: `fact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      numero: this.generarNumeroFactura(tipo),
      tipo: tipo === 'rectificativas' ? 'rectificativa' : 
            tipo === 'proformas' ? 'proforma' : 
            tipo === 'tickets' ? 'simplificada' : 'ordinaria',
      
      // Fechas
      fechaEmision: new Date().toISOString(),
      fechaOperacion: new Date().toISOString(),
      fechaVencimiento: new Date(Date.now() + diasVencimiento * 24 * 60 * 60 * 1000).toISOString(),
      
      // Emisor
      emisor: { ...FACTURACION_CONFIG.empresa },
      
      // Cliente
      cliente: {
        nombre: cliente.nombre,
        nif: cliente.nif || '',
        direccion: cliente.direccion || '',
        codigoPostal: cliente.codigoPostal || '',
        ciudad: cliente.ciudad || '',
        provincia: cliente.provincia || '',
        pais: cliente.pais || 'España',
        email: cliente.email || '',
        telefono: cliente.telefono || ''
      },
      
      // Líneas
      lineas: lineasCalculadas,
      
      // Impuestos
      impuestos: {
        tipoIVA: tipoIVA,
        porcentajeIVA: porcentajeIVA,
        baseImponible: parseFloat(baseImponible.toFixed(2)),
        cuotaIVA: parseFloat(totalIVA.toFixed(2))
      },
      
      // Totales
      totales: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        descuentoGlobal: descuentoGlobal,
        descuentoImporte: parseFloat(descuentoGlobalImporte.toFixed(2)),
        baseImponible: parseFloat(baseImponible.toFixed(2)),
        totalIVA: parseFloat(totalIVA.toFixed(2)),
        totalFactura: parseFloat(totalFactura.toFixed(2))
      },
      
      // Pago
      formaPago: formaPago,
      estado: 'emitida', // emitida, pagada, vencida, anulada
      estadoPago: 'pendiente', // pendiente, parcial, pagado
      importePagado: 0,
      
      // Metadatos
      notas: notas,
      empleadoId: empleadoId,
      ventaId: ventaId,
      moneda: FACTURACION_CONFIG.fiscal.moneda,
      
      // Control
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      hash: null // Para firma electrónica
    };
    
    // Generar hash único
    factura.hash = this.generarHash(factura);
    
    // Guardar
    this.facturas.push(factura);
    this.actualizarEstadisticas(factura);
    this.saveData();
    
    return factura;
  }
  
  // --------------------------------------------------------------------------
  // CREAR FACTURA DESDE VENTA
  // --------------------------------------------------------------------------
  
  crearFacturaDesdeVenta(venta, datosCliente) {
    const lineas = venta.items.map(item => ({
      descripcion: item.nombre,
      cantidad: item.cantidad,
      precioUnitario: item.precio,
      descuento: item.descuento || 0,
      unidad: 'unidad'
    }));
    
    return this.crearFactura({
      cliente: datosCliente,
      lineas: lineas,
      ventaId: venta.id,
      empleadoId: venta.empleadoId,
      formaPago: venta.metodoPago || 'efectivo',
      notas: `Generada desde venta #${venta.id}`
    });
  }
  
  // --------------------------------------------------------------------------
  // CREAR FACTURA RECTIFICATIVA
  // --------------------------------------------------------------------------
  
  crearFacturaRectificativa(facturaOriginalId, motivo, lineasRectificadas) {
    const facturaOriginal = this.obtenerFactura(facturaOriginalId);
    if (!facturaOriginal) {
      throw new Error('Factura original no encontrada');
    }
    
    const factura = this.crearFactura({
      cliente: facturaOriginal.cliente,
      lineas: lineasRectificadas,
      tipo: 'rectificativas',
      notas: `Rectificación de factura ${facturaOriginal.numero}. Motivo: ${motivo}`
    });
    
    // Vincular con original
    factura.facturaRectificada = facturaOriginalId;
    factura.motivoRectificacion = motivo;
    
    this.saveData();
    return factura;
  }
  
  // --------------------------------------------------------------------------
  // OPERACIONES CRUD
  // --------------------------------------------------------------------------
  
  obtenerFactura(id) {
    return this.facturas.find(f => f.id === id || f.numero === id);
  }
  
  listarFacturas(filtros = {}) {
    let resultado = [...this.facturas];
    
    // Filtrar por estado
    if (filtros.estado) {
      resultado = resultado.filter(f => f.estado === filtros.estado);
    }
    
    // Filtrar por tipo
    if (filtros.tipo) {
      resultado = resultado.filter(f => f.tipo === filtros.tipo);
    }
    
    // Filtrar por cliente
    if (filtros.clienteNombre) {
      resultado = resultado.filter(f => 
        f.cliente.nombre.toLowerCase().includes(filtros.clienteNombre.toLowerCase())
      );
    }
    
    // Filtrar por fecha
    if (filtros.fechaDesde) {
      resultado = resultado.filter(f => 
        new Date(f.fechaEmision) >= new Date(filtros.fechaDesde)
      );
    }
    
    if (filtros.fechaHasta) {
      resultado = resultado.filter(f => 
        new Date(f.fechaEmision) <= new Date(filtros.fechaHasta)
      );
    }
    
    // Filtrar por importe
    if (filtros.importeMinimo) {
      resultado = resultado.filter(f => 
        f.totales.totalFactura >= filtros.importeMinimo
      );
    }
    
    if (filtros.importeMaximo) {
      resultado = resultado.filter(f => 
        f.totales.totalFactura <= filtros.importeMaximo
      );
    }
    
    // Ordenar
    resultado.sort((a, b) => new Date(b.fechaEmision) - new Date(a.fechaEmision));
    
    // Paginación
    if (filtros.limite) {
      const offset = filtros.offset || 0;
      resultado = resultado.slice(offset, offset + filtros.limite);
    }
    
    return resultado;
  }
  
  actualizarFactura(id, cambios) {
    const index = this.facturas.findIndex(f => f.id === id);
    if (index === -1) {
      throw new Error('Factura no encontrada');
    }
    
    // No permitir cambios en ciertos campos
    const camposProtegidos = ['id', 'numero', 'hash', 'createdAt'];
    camposProtegidos.forEach(campo => delete cambios[campo]);
    
    this.facturas[index] = {
      ...this.facturas[index],
      ...cambios,
      updatedAt: new Date().toISOString(),
      version: this.facturas[index].version + 1
    };
    
    this.saveData();
    return this.facturas[index];
  }
  
  anularFactura(id, motivo) {
    const factura = this.obtenerFactura(id);
    if (!factura) {
      throw new Error('Factura no encontrada');
    }
    
    if (factura.estado === 'anulada') {
      throw new Error('La factura ya está anulada');
    }
    
    factura.estado = 'anulada';
    factura.motivoAnulacion = motivo;
    factura.fechaAnulacion = new Date().toISOString();
    factura.updatedAt = new Date().toISOString();
    
    this.saveData();
    return factura;
  }
  
  // --------------------------------------------------------------------------
  // PAGOS
  // --------------------------------------------------------------------------
  
  registrarPago(facturaId, importe, metodoPago = 'efectivo', referencia = '') {
    const factura = this.obtenerFactura(facturaId);
    if (!factura) {
      throw new Error('Factura no encontrada');
    }
    
    if (factura.estado === 'anulada') {
      throw new Error('No se puede pagar una factura anulada');
    }
    
    const nuevoPagado = factura.importePagado + importe;
    
    if (nuevoPagado > factura.totales.totalFactura) {
      throw new Error('El importe supera el total de la factura');
    }
    
    factura.importePagado = parseFloat(nuevoPagado.toFixed(2));
    
    if (factura.importePagado >= factura.totales.totalFactura) {
      factura.estadoPago = 'pagado';
      factura.estado = 'pagada';
      factura.fechaPago = new Date().toISOString();
    } else if (factura.importePagado > 0) {
      factura.estadoPago = 'parcial';
    }
    
    // Registrar en historial de pagos
    if (!factura.pagos) factura.pagos = [];
    factura.pagos.push({
      fecha: new Date().toISOString(),
      importe: importe,
      metodoPago: metodoPago,
      referencia: referencia
    });
    
    factura.updatedAt = new Date().toISOString();
    this.saveData();
    
    return factura;
  }
  
  // --------------------------------------------------------------------------
  // EXPORTACIÓN
  // --------------------------------------------------------------------------
  
  exportarFactura(id, formato = 'JSON') {
    const factura = this.obtenerFactura(id);
    if (!factura) {
      throw new Error('Factura no encontrada');
    }
    
    switch (formato.toUpperCase()) {
      case 'JSON':
        return this.exportarJSON(factura);
      case 'XML':
        return this.exportarXML(factura);
      case 'FACTURAE':
        return this.exportarFacturae(factura);
      default:
        throw new Error(`Formato no soportado: ${formato}`);
    }
  }
  
  exportarJSON(factura) {
    return JSON.stringify(factura, null, 2);
  }
  
  exportarXML(factura) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Factura>
  <Cabecera>
    <NumeroFactura>${factura.numero}</NumeroFactura>
    <Tipo>${factura.tipo}</Tipo>
    <FechaEmision>${factura.fechaEmision}</FechaEmision>
    <FechaVencimiento>${factura.fechaVencimiento}</FechaVencimiento>
  </Cabecera>
  <Emisor>
    <NombreRazonSocial>${factura.emisor.razonSocial}</NombreRazonSocial>
    <NIF>${factura.emisor.nif}</NIF>
    <Direccion>${factura.emisor.direccion}</Direccion>
    <CodigoPostal>${factura.emisor.codigoPostal}</CodigoPostal>
    <Ciudad>${factura.emisor.ciudad}</Ciudad>
  </Emisor>
  <Receptor>
    <NombreRazonSocial>${factura.cliente.nombre}</NombreRazonSocial>
    <NIF>${factura.cliente.nif}</NIF>
    <Direccion>${factura.cliente.direccion}</Direccion>
    <CodigoPostal>${factura.cliente.codigoPostal}</CodigoPostal>
    <Ciudad>${factura.cliente.ciudad}</Ciudad>
  </Receptor>
  <Detalle>
    ${factura.lineas.map(l => `
    <Linea>
      <Descripcion>${l.descripcion}</Descripcion>
      <Cantidad>${l.cantidad}</Cantidad>
      <PrecioUnitario>${l.precioUnitario}</PrecioUnitario>
      <BaseImponible>${l.baseImponible}</BaseImponible>
      <CuotaIVA>${l.iva}</CuotaIVA>
      <Total>${l.total}</Total>
    </Linea>`).join('')}
  </Detalle>
  <Totales>
    <BaseImponible>${factura.totales.baseImponible}</BaseImponible>
    <TotalIVA>${factura.totales.totalIVA}</TotalIVA>
    <TotalFactura>${factura.totales.totalFactura}</TotalFactura>
  </Totales>
</Factura>`;
    return xml;
  }
  
  exportarFacturae(factura) {
    // Formato Facturae 3.2.2 (estándar español)
    const facturae = `<?xml version="1.0" encoding="UTF-8"?>
<fe:Facturae xmlns:fe="http://www.facturae.es/Facturae/2014/v3.2.2/Facturae">
  <FileHeader>
    <SchemaVersion>3.2.2</SchemaVersion>
    <Modality>I</Modality>
    <InvoiceIssuerType>EM</InvoiceIssuerType>
  </FileHeader>
  <Parties>
    <SellerParty>
      <TaxIdentification>
        <PersonTypeCode>J</PersonTypeCode>
        <ResidenceTypeCode>R</ResidenceTypeCode>
        <TaxIdentificationNumber>${factura.emisor.nif}</TaxIdentificationNumber>
      </TaxIdentification>
      <LegalEntity>
        <CorporateName>${factura.emisor.razonSocial}</CorporateName>
        <AddressInSpain>
          <Address>${factura.emisor.direccion}</Address>
          <PostCode>${factura.emisor.codigoPostal}</PostCode>
          <Town>${factura.emisor.ciudad}</Town>
          <Province>${factura.emisor.provincia}</Province>
          <CountryCode>ESP</CountryCode>
        </AddressInSpain>
      </LegalEntity>
    </SellerParty>
    <BuyerParty>
      <TaxIdentification>
        <PersonTypeCode>${factura.cliente.nif ? 'J' : 'F'}</PersonTypeCode>
        <ResidenceTypeCode>R</ResidenceTypeCode>
        <TaxIdentificationNumber>${factura.cliente.nif || '00000000T'}</TaxIdentificationNumber>
      </TaxIdentification>
      <LegalEntity>
        <CorporateName>${factura.cliente.nombre}</CorporateName>
        <AddressInSpain>
          <Address>${factura.cliente.direccion || 'N/A'}</Address>
          <PostCode>${factura.cliente.codigoPostal || '00000'}</PostCode>
          <Town>${factura.cliente.ciudad || 'N/A'}</Town>
          <Province>${factura.cliente.provincia || 'N/A'}</Province>
          <CountryCode>ESP</CountryCode>
        </AddressInSpain>
      </LegalEntity>
    </BuyerParty>
  </Parties>
  <Invoices>
    <Invoice>
      <InvoiceHeader>
        <InvoiceNumber>${factura.numero}</InvoiceNumber>
        <InvoiceDocumentType>FC</InvoiceDocumentType>
        <InvoiceClass>OO</InvoiceClass>
      </InvoiceHeader>
      <InvoiceIssueData>
        <IssueDate>${factura.fechaEmision.split('T')[0]}</IssueDate>
        <InvoiceCurrencyCode>EUR</InvoiceCurrencyCode>
        <TaxCurrencyCode>EUR</TaxCurrencyCode>
        <LanguageName>es</LanguageName>
      </InvoiceIssueData>
      <TaxesOutputs>
        <Tax>
          <TaxTypeCode>01</TaxTypeCode>
          <TaxRate>${factura.impuestos.porcentajeIVA}</TaxRate>
          <TaxableBase><TotalAmount>${factura.totales.baseImponible}</TotalAmount></TaxableBase>
          <TaxAmount><TotalAmount>${factura.totales.totalIVA}</TotalAmount></TaxAmount>
        </Tax>
      </TaxesOutputs>
      <InvoiceTotals>
        <TotalGrossAmount>${factura.totales.subtotal}</TotalGrossAmount>
        <TotalGeneralDiscounts>${factura.totales.descuentoImporte}</TotalGeneralDiscounts>
        <TotalGrossAmountBeforeTaxes>${factura.totales.baseImponible}</TotalGrossAmountBeforeTaxes>
        <TotalTaxOutputs>${factura.totales.totalIVA}</TotalTaxOutputs>
        <InvoiceTotal>${factura.totales.totalFactura}</InvoiceTotal>
        <TotalOutstandingAmount>${factura.totales.totalFactura - factura.importePagado}</TotalOutstandingAmount>
        <TotalExecutableAmount>${factura.totales.totalFactura}</TotalExecutableAmount>
      </InvoiceTotals>
      <Items>
        ${factura.lineas.map((l, i) => `
        <InvoiceLine>
          <ItemDescription>${l.descripcion}</ItemDescription>
          <Quantity>${l.cantidad}</Quantity>
          <UnitOfMeasure>01</UnitOfMeasure>
          <UnitPriceWithoutTax>${l.precioUnitario}</UnitPriceWithoutTax>
          <TotalCost>${l.baseImponible}</TotalCost>
          <GrossAmount>${l.baseImponible}</GrossAmount>
          <TaxesOutputs>
            <Tax>
              <TaxTypeCode>01</TaxTypeCode>
              <TaxRate>${factura.impuestos.porcentajeIVA}</TaxRate>
              <TaxableBase><TotalAmount>${l.baseImponible}</TotalAmount></TaxableBase>
              <TaxAmount><TotalAmount>${l.iva}</TotalAmount></TaxAmount>
            </Tax>
          </TaxesOutputs>
        </InvoiceLine>`).join('')}
      </Items>
    </Invoice>
  </Invoices>
</fe:Facturae>`;
    return facturae;
  }
  
  // --------------------------------------------------------------------------
  // ESTADÍSTICAS Y REPORTES
  // --------------------------------------------------------------------------
  
  actualizarEstadisticas(factura) {
    this.estadisticas.totalEmitidas++;
    this.estadisticas.totalImporte += factura.totales.totalFactura;
    this.estadisticas.totalIVA += factura.totales.totalIVA;
    
    // Por estado
    if (!this.estadisticas.porEstado[factura.estado]) {
      this.estadisticas.porEstado[factura.estado] = 0;
    }
    this.estadisticas.porEstado[factura.estado]++;
    
    // Por mes
    const mes = factura.fechaEmision.substring(0, 7);
    if (!this.estadisticas.porMes[mes]) {
      this.estadisticas.porMes[mes] = { cantidad: 0, importe: 0 };
    }
    this.estadisticas.porMes[mes].cantidad++;
    this.estadisticas.porMes[mes].importe += factura.totales.totalFactura;
  }
  
  obtenerEstadisticas(periodo = 'mes') {
    const ahora = new Date();
    let fechaInicio;
    
    switch (periodo) {
      case 'dia':
        fechaInicio = new Date(ahora.setHours(0, 0, 0, 0));
        break;
      case 'semana':
        fechaInicio = new Date(ahora.setDate(ahora.getDate() - 7));
        break;
      case 'mes':
        fechaInicio = new Date(ahora.setMonth(ahora.getMonth() - 1));
        break;
      case 'anio':
        fechaInicio = new Date(ahora.setFullYear(ahora.getFullYear() - 1));
        break;
      default:
        fechaInicio = new Date(0);
    }
    
    const facturasPeriodo = this.facturas.filter(f => 
      new Date(f.fechaEmision) >= fechaInicio
    );
    
    const emitidas = facturasPeriodo.length;
    const totalFacturado = facturasPeriodo.reduce((sum, f) => sum + f.totales.totalFactura, 0);
    const totalIVA = facturasPeriodo.reduce((sum, f) => sum + f.totales.totalIVA, 0);
    const pagadas = facturasPeriodo.filter(f => f.estado === 'pagada').length;
    const pendientes = facturasPeriodo.filter(f => f.estado === 'emitida').length;
    const anuladas = facturasPeriodo.filter(f => f.estado === 'anulada').length;
    
    const importePagado = facturasPeriodo.reduce((sum, f) => sum + f.importePagado, 0);
    const importePendiente = totalFacturado - importePagado;
    
    return {
      periodo,
      emitidas,
      pagadas,
      pendientes,
      anuladas,
      totalFacturado: parseFloat(totalFacturado.toFixed(2)),
      totalIVA: parseFloat(totalIVA.toFixed(2)),
      baseImponible: parseFloat((totalFacturado - totalIVA).toFixed(2)),
      importePagado: parseFloat(importePagado.toFixed(2)),
      importePendiente: parseFloat(importePendiente.toFixed(2)),
      promedioFactura: emitidas > 0 ? parseFloat((totalFacturado / emitidas).toFixed(2)) : 0,
      tasaCobro: emitidas > 0 ? parseFloat(((pagadas / emitidas) * 100).toFixed(1)) : 0
    };
  }
  
  obtenerFacturasVencidas() {
    const ahora = new Date();
    return this.facturas.filter(f => 
      f.estado === 'emitida' && 
      new Date(f.fechaVencimiento) < ahora
    ).map(f => {
      const diasVencida = Math.floor((ahora - new Date(f.fechaVencimiento)) / (1000 * 60 * 60 * 24));
      return { ...f, diasVencida };
    });
  }
  
  // --------------------------------------------------------------------------
  // UTILIDADES
  // --------------------------------------------------------------------------
  
  generarHash(factura) {
    const datos = `${factura.numero}|${factura.fechaEmision}|${factura.totales.totalFactura}`;
    let hash = 0;
    for (let i = 0; i < datos.length; i++) {
      const char = datos.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).toUpperCase();
  }
  
  validarNIF(nif) {
    if (!nif) return false;
    
    nif = nif.toUpperCase().replace(/\s/g, '');
    
    // DNI: 8 números + letra
    if (/^\d{8}[A-Z]$/.test(nif)) {
      const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
      const numero = parseInt(nif.substring(0, 8));
      return nif[8] === letras[numero % 23];
    }
    
    // NIE: X/Y/Z + 7 números + letra
    if (/^[XYZ]\d{7}[A-Z]$/.test(nif)) {
      let numero = nif.substring(1, 8);
      if (nif[0] === 'X') numero = '0' + numero;
      else if (nif[0] === 'Y') numero = '1' + numero;
      else if (nif[0] === 'Z') numero = '2' + numero;
      const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
      return nif[8] === letras[parseInt(numero) % 23];
    }
    
    // CIF: Letra + 7 números + dígito/letra control
    if (/^[ABCDEFGHJNPQRSUVW]\d{7}[A-Z0-9]$/.test(nif)) {
      return true; // Validación simplificada
    }
    
    return false;
  }
  
  obtenerConfiguracion() {
    return {
      empresa: FACTURACION_CONFIG.empresa,
      fiscal: FACTURACION_CONFIG.fiscal,
      exportFormats: FACTURACION_CONFIG.exportFormats
    };
  }
  
  actualizarConfiguracionEmpresa(datos) {
    Object.assign(FACTURACION_CONFIG.empresa, datos);
    return FACTURACION_CONFIG.empresa;
  }
}

// ============================================================================
// INSTANCIA SINGLETON
// ============================================================================

const facturacionService = new FacturacionService();

// ============================================================================
// RUTAS EXPRESS
// ============================================================================

function createFacturacionRoutes(verificarToken) {
  const router = require('express').Router();
  
  // =========================================================================
  // RUTAS ESPECÍFICAS PRIMERO (antes de las rutas con :id)
  // =========================================================================
  
  // Crear factura
  router.post('/crear', verificarToken, (req, res) => {
    try {
      const factura = facturacionService.crearFactura(req.body);
      res.json({ success: true, factura });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  
  // Crear factura desde venta
  router.post('/desde-venta', verificarToken, (req, res) => {
    try {
      const { venta, cliente } = req.body;
      const factura = facturacionService.crearFacturaDesdeVenta(venta, cliente);
      res.json({ success: true, factura });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  
  // Listar facturas
  router.get('/listar', verificarToken, (req, res) => {
    try {
      const facturas = facturacionService.listarFacturas(req.query);
      const estadisticas = facturacionService.obtenerEstadisticas('mes');
      res.json({ 
        success: true, 
        facturas, 
        total: facturas.length,
        estadisticas 
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Estadísticas (DEBE IR ANTES de /:id)
  router.get('/estadisticas/:periodo', verificarToken, (req, res) => {
    try {
      const estadisticas = facturacionService.obtenerEstadisticas(req.params.periodo);
      res.json({ success: true, estadisticas });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Facturas vencidas (DEBE IR ANTES de /:id)
  router.get('/reportes/vencidas', verificarToken, (req, res) => {
    try {
      const vencidas = facturacionService.obtenerFacturasVencidas();
      res.json({ success: true, facturas: vencidas, total: vencidas.length });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Configuración GET (DEBE IR ANTES de /:id)
  router.get('/config/empresa', verificarToken, (req, res) => {
    try {
      const config = facturacionService.obtenerConfiguracion();
      res.json({ success: true, config });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Actualizar configuración empresa
  router.put('/config/empresa', verificarToken, (req, res) => {
    try {
      const empresa = facturacionService.actualizarConfiguracionEmpresa(req.body);
      res.json({ success: true, empresa });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  
  // Validar NIF
  router.post('/validar/nif', verificarToken, (req, res) => {
    try {
      const { nif } = req.body;
      const valido = facturacionService.validarNIF(nif);
      res.json({ success: true, nif, valido });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  
  // Rectificativa
  router.post('/rectificativa', verificarToken, (req, res) => {
    try {
      const { facturaOriginalId, motivo, lineas } = req.body;
      const factura = facturacionService.crearFacturaRectificativa(
        facturaOriginalId, motivo, lineas
      );
      res.json({ success: true, factura });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  
  // =========================================================================
  // RUTAS CON PARÁMETRO :id AL FINAL
  // =========================================================================
  
  // Obtener factura por ID
  router.get('/:id', verificarToken, (req, res) => {
    try {
      const factura = facturacionService.obtenerFactura(req.params.id);
      if (!factura) {
        return res.status(404).json({ success: false, error: 'Factura no encontrada' });
      }
      res.json({ success: true, factura });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Actualizar factura
  router.put('/:id', verificarToken, (req, res) => {
    try {
      const factura = facturacionService.actualizarFactura(req.params.id, req.body);
      res.json({ success: true, factura });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  
  // Anular factura
  router.post('/:id/anular', verificarToken, (req, res) => {
    try {
      const { motivo } = req.body;
      const factura = facturacionService.anularFactura(req.params.id, motivo);
      res.json({ success: true, factura });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  
  // Registrar pago
  router.post('/:id/pago', verificarToken, (req, res) => {
    try {
      const { importe, metodoPago, referencia } = req.body;
      const factura = facturacionService.registrarPago(
        req.params.id, importe, metodoPago, referencia
      );
      res.json({ success: true, factura });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  
  // Exportar factura
  router.get('/:id/exportar/:formato', verificarToken, (req, res) => {
    try {
      const contenido = facturacionService.exportarFactura(
        req.params.id, 
        req.params.formato
      );
      
      const formato = req.params.formato.toUpperCase();
      let contentType = 'application/json';
      let extension = 'json';
      
      if (formato === 'XML' || formato === 'FACTURAE') {
        contentType = 'application/xml';
        extension = 'xml';
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 
        `attachment; filename=factura_${req.params.id}.${extension}`);
      res.send(contenido);
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  
  return router;
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

module.exports = {
  facturacionService,
  FacturacionService,
  FACTURACION_CONFIG,
  createFacturacionRoutes
};
