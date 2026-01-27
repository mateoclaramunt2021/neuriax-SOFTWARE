/**
 * POS Module Component - Sistema de Punto de Venta Profesional
 * Sistema completo de cobros para peluquerías y salones
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import '../../styles/modules.css';

export default function POSModule() {
  const { success: notifySuccess, error: notifyError, info: notifyInfo } = useNotification();
  const { isAuthenticated } = useAuth();
  
  // Estados principales
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('servicios'); // 'servicios' | 'productos'
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  
  // Datos del backend
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selecciones
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  
  // Descuentos y pagos
  const [discountType, setDiscountType] = useState('percent'); // 'percent' | 'fixed'
  const [discountValue, setDiscountValue] = useState(0);
  const [amountReceived, setAmountReceived] = useState('');
  const [notes, setNotes] = useState('');
  
  // Ticket/Recibo
  const [showTicket, setShowTicket] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const ticketRef = useRef(null);

  // Cargar todos los datos al montar
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => loadAllData(), 50);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadAllData = async (retryCount = 0) => {
    setLoading(true);
    try {
      const [servRes, prodRes, clientRes, empRes] = await Promise.allSettled([
        apiService.get('/servicios'),
        apiService.get('/inventario'),
        apiService.get('/clientes'),
        apiService.get('/empleados')
      ]);

      // Servicios - apiService devuelve {success, data}, y data del server puede ser {success, data} o array
      if (servRes.status === 'fulfilled' && servRes.value?.success) {
        const apiData = servRes.value.data; // Respuesta del servidor
        // El servidor puede devolver { success, data: [...] } o directamente [...]
        const list = Array.isArray(apiData) 
          ? apiData 
          : (apiData?.data || apiData?.servicios || []);
        setServices(list);
      } else {
        setServices(getDefaultServices());
      }

      // Productos
      if (prodRes.status === 'fulfilled' && prodRes.value?.success) {
        const apiData = prodRes.value.data;
        const list = Array.isArray(apiData) 
          ? apiData 
          : (apiData?.data || apiData?.productos || []);
        setProducts(list.filter(p => (p.stock || 0) > 0));
      }

      // Clientes
      if (clientRes.status === 'fulfilled' && clientRes.value?.success) {
        const apiData = clientRes.value.data;
        const list = Array.isArray(apiData) 
          ? apiData 
          : (apiData?.data || apiData?.clientes || []);
        setClients(list);
      }

      // Empleados
      if (empRes.status === 'fulfilled' && empRes.value?.success) {
        const apiData = empRes.value.data;
        const list = Array.isArray(apiData) 
          ? apiData 
          : (apiData?.data || apiData?.empleados || []);
        setEmployees(list.filter(e => e.activo !== false));
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      notifyError('Error al cargar datos. Usando valores de demostración.');
      setServices(getDefaultServices());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultServices = () => [
    { id: 1, nombre: 'Corte de Cabello', precio: 25.00, icono: '✂️', categoria: 'Cortes', duracion: 30 },
    { id: 2, nombre: 'Tinte Completo', precio: 65.00, icono: '🎨', categoria: 'Color', duracion: 90 },
    { id: 3, nombre: 'Mechas', precio: 85.00, icono: '✨', categoria: 'Color', duracion: 120 },
    { id: 4, nombre: 'Barba', precio: 15.00, icono: '💈', categoria: 'Barba', duracion: 20 },
    { id: 5, nombre: 'Lavado y Peinado', precio: 20.00, icono: '💇', categoria: 'Peinados', duracion: 30 },
    { id: 6, nombre: 'Tratamiento Hidratante', precio: 35.00, icono: '💧', categoria: 'Tratamientos', duracion: 45 },
    { id: 7, nombre: 'Alisado Keratina', precio: 150.00, icono: '🌟', categoria: 'Tratamientos', duracion: 180 },
    { id: 8, nombre: 'Corte + Barba', precio: 35.00, icono: '💈', categoria: 'Combos', duracion: 45 },
  ];

  // Filtrar items según búsqueda y pestaña
  const filteredItems = useCallback(() => {
    const items = activeTab === 'servicios' ? services : products;
    if (!searchTerm.trim()) return items;
    
    return items.filter(item => {
      const name = (item.nombre || item.name || '').toLowerCase();
      const category = (item.categoria || item.category || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      return name.includes(search) || category.includes(search);
    });
  }, [activeTab, services, products, searchTerm]);

  // Clientes filtrados
  const filteredClients = clients.filter(c => {
    if (!clientSearch.trim()) return true;
    const search = clientSearch.toLowerCase();
    const name = (c.nombre || c.name || '').toLowerCase();
    const phone = (c.telefono || c.phone || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    return name.includes(search) || phone.includes(search) || email.includes(search);
  });

  // Agregar al carrito
  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id && c.type === (activeTab === 'servicios' ? 'service' : 'product'));
    
    if (existing) {
      // Para productos, verificar stock
      if (activeTab === 'productos') {
        const stockDisponible = (item.stock || 0) - existing.quantity;
        if (stockDisponible <= 0) {
          notifyError('Sin stock disponible');
          return;
        }
      }
      setCart(cart.map(c =>
        c.id === item.id && c.type === existing.type
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      const cartItem = {
        ...item,
        type: activeTab === 'servicios' ? 'service' : 'product',
        quantity: 1,
        price: parseFloat(item.precio || item.price || 0)
      };
      setCart([...cart, cartItem]);
    }
    
    notifyInfo(`${item.nombre || item.name} agregado`);
  };

  // Actualizar cantidad
  const updateQuantity = (id, type, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter(c => !(c.id === id && c.type === type)));
    } else {
      // Verificar stock si es producto
      if (type === 'product') {
        const product = products.find(p => p.id === id);
        if (product && quantity > (product.stock || 0)) {
          notifyError('Stock insuficiente');
          return;
        }
      }
      setCart(cart.map(c =>
        c.id === id && c.type === type ? { ...c, quantity } : c
      ));
    }
  };

  // Remover del carrito
  const removeFromCart = (id, type) => {
    setCart(cart.filter(c => !(c.id === id && c.type === type)));
  };

  // Cálculos
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const discountAmount = discountType === 'percent'
    ? (subtotal * (parseFloat(discountValue) || 0)) / 100
    : parseFloat(discountValue) || 0;
  
  const subtotalWithDiscount = Math.max(0, subtotal - discountAmount);
  const tax = subtotalWithDiscount * 0.21; // 21% IVA
  const total = subtotalWithDiscount + tax;
  
  const change = paymentMethod === 'efectivo' 
    ? Math.max(0, (parseFloat(amountReceived) || 0) - total)
    : 0;

  // Limpiar venta
  const clearSale = () => {
    setCart([]);
    setSelectedClient(null);
    setSelectedEmployee(null);
    setDiscountValue(0);
    setDiscountType('percent');
    setAmountReceived('');
    setNotes('');
    setPaymentMethod('efectivo');
    setClientSearch('');
  };

  // Completar venta
  const handleCompleteSale = async () => {
    // Validaciones
    if (cart.length === 0) {
      notifyError('Agrega al menos un servicio o producto');
      return;
    }

    if (paymentMethod === 'efectivo' && parseFloat(amountReceived) < total) {
      notifyError('El monto recibido es insuficiente');
      return;
    }

    try {
      const ventaData = {
        cliente_id: selectedClient?.id || null,
        cliente_nombre: selectedClient?.nombre || selectedClient?.name || 'Cliente general',
        empleado_id: selectedEmployee?.id || null,
        empleado_nombre: selectedEmployee?.nombre || selectedEmployee?.name || null,
        servicios: cart.filter(i => i.type === 'service').map(item => ({
          id: item.id,
          nombre: item.nombre || item.name,
          precio: item.price,
          cantidad: item.quantity
        })),
        productos: cart.filter(i => i.type === 'product').map(item => ({
          id: item.id,
          nombre: item.nombre || item.name,
          precio: item.price,
          cantidad: item.quantity
        })),
        subtotal: parseFloat(subtotal.toFixed(2)),
        descuento: parseFloat(discountAmount.toFixed(2)),
        descuento_tipo: discountType,
        descuento_valor: parseFloat(discountValue) || 0,
        impuesto: parseFloat(tax.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        metodo_pago: paymentMethod,
        monto_recibido: paymentMethod === 'efectivo' ? parseFloat(amountReceived) : total,
        cambio: paymentMethod === 'efectivo' ? parseFloat(change.toFixed(2)) : 0,
        notas: notes,
        fecha: new Date().toISOString(),
        estado: 'completada'
      };

      const response = await apiService.post('/ventas', ventaData);

      if (response.success || response.id || response.venta) {
        const saleId = response.id || response.venta?.id || Date.now();
        
        // Guardar para el ticket
        setLastSale({
          id: saleId,
          ...ventaData,
          fecha: new Date().toLocaleString('es-ES')
        });
        
        notifySuccess(`✅ Venta #${saleId} completada: €${total.toFixed(2)}`);
        setShowTicket(true);
        
        // Actualizar stock de productos
        loadAllData();
        
      } else {
        throw new Error('Error al procesar la venta');
      }
    } catch (error) {
      console.error('Error completando venta:', error);
      notifyError('Error al procesar la venta. Intenta de nuevo.');
    }
  };

  // Imprimir ticket
  const printTicket = () => {
    if (ticketRef.current) {
      const printContent = ticketRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket #${lastSale?.id}</title>
            <style>
              body { font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; padding: 20px; }
              .ticket-header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
              .ticket-header h2 { margin: 0 0 5px 0; font-size: 18px; }
              .ticket-header p { margin: 2px 0; font-size: 12px; }
              .ticket-items { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
              .ticket-item { display: flex; justify-content: space-between; font-size: 12px; margin: 5px 0; }
              .ticket-totals { margin-bottom: 10px; }
              .ticket-totals .row { display: flex; justify-content: space-between; font-size: 12px; margin: 3px 0; }
              .ticket-totals .total { font-weight: bold; font-size: 16px; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; }
              .ticket-footer { text-align: center; font-size: 11px; border-top: 2px dashed #000; padding-top: 10px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            ${printContent}
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Cerrar ticket y limpiar
  const closeTicket = () => {
    setShowTicket(false);
    clearSale();
  };

  // Cantidades rápidas para pago en efectivo
  const quickAmounts = [5, 10, 20, 50, 100];

  return (
    <div className="pos-module">
      {/* ===== PANEL IZQUIERDO: SERVICIOS Y PRODUCTOS ===== */}
      <section className="pos-catalog">
        {/* Pestañas */}
        <div className="pos-tabs">
          <button
            className={`pos-tab ${activeTab === 'servicios' ? 'active' : ''}`}
            onClick={() => setActiveTab('servicios')}
          >
            ✂️ Servicios ({services.length})
          </button>
          <button
            className={`pos-tab ${activeTab === 'productos' ? 'active' : ''}`}
            onClick={() => setActiveTab('productos')}
          >
            📦 Productos ({products.length})
          </button>
        </div>

        {/* Búsqueda */}
        <div className="pos-search-bar">
          <input
            type="text"
            placeholder={`🔍 Buscar ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pos-search-input"
          />
          {searchTerm && (
            <button className="pos-search-clear" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>

        {/* Grid de items */}
        <div className="pos-items-grid">
          {loading ? (
            <div className="pos-loading">
              <div className="pos-spinner"></div>
              <p>Cargando {activeTab}...</p>
            </div>
          ) : filteredItems().length === 0 ? (
            <div className="pos-empty">
              <span className="pos-empty-icon">{activeTab === 'servicios' ? '✂️' : '📦'}</span>
              <p>No hay {activeTab} disponibles</p>
              {searchTerm && <small>Prueba con otra búsqueda</small>}
            </div>
          ) : (
            filteredItems().map(item => (
              <button
                key={`${activeTab}-${item.id}`}
                className="pos-item-card"
                onClick={() => addToCart(item)}
              >
                <div className="pos-item-icon">
                  {item.icono || item.icon || (activeTab === 'servicios' ? '⭐' : '🛍️')}
                </div>
                <div className="pos-item-info">
                  <span className="pos-item-name">{item.nombre || item.name}</span>
                  <span className="pos-item-category">
                    {item.categoria || item.category || (activeTab === 'servicios' ? 'Servicio' : 'Producto')}
                  </span>
                </div>
                <div className="pos-item-price">€{(item.precio || item.price || 0).toFixed(2)}</div>
                {activeTab === 'productos' && (
                  <span className="pos-item-stock">Stock: {item.stock || 0}</span>
                )}
              </button>
            ))
          )}
        </div>
      </section>

      {/* ===== PANEL DERECHO: CARRITO Y CHECKOUT ===== */}
      <aside className="pos-checkout-panel">
        {/* Selector de Cliente */}
        <div className="pos-client-section">
          <label className="pos-label">👤 Cliente</label>
          <div className="pos-client-selector">
            {selectedClient ? (
              <div className="pos-selected-client">
                <div className="client-info">
                  <span className="client-name">{selectedClient.nombre || selectedClient.name}</span>
                  <span className="client-phone">{selectedClient.telefono || selectedClient.phone}</span>
                </div>
                <button className="client-remove" onClick={() => setSelectedClient(null)}>✕</button>
              </div>
            ) : (
              <div className="pos-client-search">
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                />
                {showClientDropdown && clientSearch && (
                  <div className="client-dropdown">
                    {filteredClients.length === 0 ? (
                      <div className="client-dropdown-empty">Sin resultados</div>
                    ) : (
                      filteredClients.slice(0, 5).map(client => (
                        <button
                          key={client.id}
                          className="client-dropdown-item"
                          onClick={() => {
                            setSelectedClient(client);
                            setClientSearch('');
                            setShowClientDropdown(false);
                          }}
                        >
                          <span>{client.nombre || client.name}</span>
                          <small>{client.telefono || client.phone}</small>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selector de Empleado */}
        <div className="pos-employee-section">
          <label className="pos-label">👨‍💼 Empleado</label>
          <select
            className="pos-select"
            value={selectedEmployee?.id || ''}
            onChange={(e) => {
              const emp = employees.find(em => em.id === e.target.value || em.id === parseInt(e.target.value));
              setSelectedEmployee(emp || null);
            }}
          >
            <option value="">Seleccionar empleado</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre || emp.name} {emp.cargo ? `(${emp.cargo})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Carrito */}
        <div className="pos-cart-section">
          <div className="pos-cart-header">
            <h3>🛒 Carrito</h3>
            <span className="pos-cart-count">{cart.reduce((sum, i) => sum + i.quantity, 0)} items</span>
            {cart.length > 0 && (
              <button className="pos-cart-clear" onClick={clearSale}>Vaciar</button>
            )}
          </div>

          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div className="pos-cart-empty">
                <span>🛒</span>
                <p>Carrito vacío</p>
                <small>Selecciona servicios o productos</small>
              </div>
            ) : (
              cart.map(item => (
                <div key={`${item.type}-${item.id}`} className="pos-cart-item">
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item.nombre || item.name}</span>
                    <span className="cart-item-unit">€{item.price.toFixed(2)} × {item.quantity}</span>
                  </div>
                  <div className="cart-item-controls">
                    <button onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)}>+</button>
                  </div>
                  <div className="cart-item-total">€{(item.price * item.quantity).toFixed(2)}</div>
                  <button className="cart-item-remove" onClick={() => removeFromCart(item.id, item.type)}>✕</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Descuento */}
        {cart.length > 0 && (
          <div className="pos-discount-section">
            <label className="pos-label">🏷️ Descuento</label>
            <div className="pos-discount-row">
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="pos-discount-type"
              >
                <option value="percent">%</option>
                <option value="fixed">€</option>
              </select>
              <input
                type="number"
                min="0"
                max={discountType === 'percent' ? 100 : subtotal}
                step={discountType === 'percent' ? 5 : 1}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="0"
                className="pos-discount-input"
              />
              {discountAmount > 0 && (
                <span className="pos-discount-amount">-€{discountAmount.toFixed(2)}</span>
              )}
            </div>
          </div>
        )}

        {/* Resumen */}
        {cart.length > 0 && (
          <div className="pos-summary">
            <div className="pos-summary-row">
              <span>Subtotal:</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="pos-summary-row discount">
                <span>Descuento:</span>
                <span>-€{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="pos-summary-row">
              <span>IVA (21%):</span>
              <span>€{tax.toFixed(2)}</span>
            </div>
            <div className="pos-summary-row total">
              <span>TOTAL:</span>
              <span>€{total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Métodos de Pago */}
        {cart.length > 0 && (
          <div className="pos-payment-section">
            <label className="pos-label">💳 Método de Pago</label>
            <div className="pos-payment-methods">
              {[
                { id: 'efectivo', icon: '💵', label: 'Efectivo' },
                { id: 'tarjeta', icon: '💳', label: 'Tarjeta' },
                { id: 'transferencia', icon: '🏦', label: 'Transfer.' },
                { id: 'bizum', icon: '📱', label: 'Bizum' },
              ].map(method => (
                <button
                  key={method.id}
                  className={`pos-payment-btn ${paymentMethod === method.id ? 'active' : ''}`}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <span className="payment-icon">{method.icon}</span>
                  <span className="payment-label">{method.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cálculo de Cambio (solo efectivo) */}
        {cart.length > 0 && paymentMethod === 'efectivo' && (
          <div className="pos-cash-section">
            <label className="pos-label">💰 Efectivo Recibido</label>
            <div className="pos-cash-input-row">
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder={`Mínimo €${total.toFixed(2)}`}
                className="pos-cash-input"
              />
            </div>
            <div className="pos-quick-amounts">
              {quickAmounts.map(amount => (
                <button
                  key={amount}
                  className="pos-quick-btn"
                  onClick={() => setAmountReceived(amount.toString())}
                >
                  €{amount}
                </button>
              ))}
              <button
                className="pos-quick-btn exact"
                onClick={() => setAmountReceived(total.toFixed(2))}
              >
                Exacto
              </button>
            </div>
            {parseFloat(amountReceived) >= total && (
              <div className="pos-change">
                <span>Cambio a devolver:</span>
                <strong>€{change.toFixed(2)}</strong>
              </div>
            )}
          </div>
        )}

        {/* Notas */}
        {cart.length > 0 && (
          <div className="pos-notes-section">
            <label className="pos-label">📝 Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
              rows="2"
              className="pos-notes-input"
            />
          </div>
        )}

        {/* Botón Completar Venta */}
        {cart.length > 0 && (
          <button
            className={`pos-complete-btn ${paymentMethod === 'efectivo' && parseFloat(amountReceived) < total ? 'disabled' : ''}`}
            onClick={handleCompleteSale}
            disabled={paymentMethod === 'efectivo' && parseFloat(amountReceived) < total}
          >
            <span className="complete-icon">✅</span>
            <span className="complete-text">Completar Venta</span>
            <span className="complete-total">€{total.toFixed(2)}</span>
          </button>
        )}
      </aside>

      {/* ===== MODAL TICKET/RECIBO ===== */}
      {showTicket && lastSale && (
        <div className="pos-ticket-overlay" onClick={closeTicket}>
          <div className="pos-ticket-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-ticket-header">
              <h2>✅ Venta Completada</h2>
              <button className="pos-ticket-close" onClick={closeTicket}>✕</button>
            </div>
            
            <div className="pos-ticket-content" ref={ticketRef}>
              <div className="ticket-header">
                <h2>NEURIAX</h2>
                <p>Salon Manager</p>
                <p>Ticket #{lastSale.id}</p>
                <p>{lastSale.fecha}</p>
              </div>

              <div className="ticket-client">
                {lastSale.cliente_nombre && lastSale.cliente_nombre !== 'Cliente general' && (
                  <p>Cliente: {lastSale.cliente_nombre}</p>
                )}
                {lastSale.empleado_nombre && (
                  <p>Atendido por: {lastSale.empleado_nombre}</p>
                )}
              </div>

              <div className="ticket-items">
                {[...lastSale.servicios, ...lastSale.productos].map((item, idx) => (
                  <div key={idx} className="ticket-item">
                    <span>{item.cantidad}x {item.nombre}</span>
                    <span>€{(item.precio * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="ticket-totals">
                <div className="row">
                  <span>Subtotal:</span>
                  <span>€{lastSale.subtotal.toFixed(2)}</span>
                </div>
                {lastSale.descuento > 0 && (
                  <div className="row">
                    <span>Descuento:</span>
                    <span>-€{lastSale.descuento.toFixed(2)}</span>
                  </div>
                )}
                <div className="row">
                  <span>IVA (21%):</span>
                  <span>€{lastSale.impuesto.toFixed(2)}</span>
                </div>
                <div className="row total">
                  <span>TOTAL:</span>
                  <span>€{lastSale.total.toFixed(2)}</span>
                </div>
                {lastSale.metodo_pago === 'efectivo' && (
                  <>
                    <div className="row">
                      <span>Pagado:</span>
                      <span>€{lastSale.monto_recibido.toFixed(2)}</span>
                    </div>
                    <div className="row">
                      <span>Cambio:</span>
                      <span>€{lastSale.cambio.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="ticket-payment">
                <p>Método de pago: {lastSale.metodo_pago.charAt(0).toUpperCase() + lastSale.metodo_pago.slice(1)}</p>
              </div>

              <div className="ticket-footer">
                <p>¡Gracias por su visita!</p>
                <p>Le esperamos pronto</p>
              </div>
            </div>

            <div className="pos-ticket-actions">
              <button className="pos-ticket-print" onClick={printTicket}>
                🖨️ Imprimir Ticket
              </button>
              <button className="pos-ticket-new" onClick={closeTicket}>
                ➕ Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
