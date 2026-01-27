/**
 * InventoryModule - Gestión de Inventario/Productos
 * NEURIAX Salon Manager
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './modules.css';

const InventoryModule = () => {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const { isAuthenticated } = useAuth();
  
  // States
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    precio_compra: '',
    precio_venta: '',
    stock: '',
    stock_minimo: '',
    unidad: 'unidad',
    proveedor: '',
    codigo_barras: ''
  });

  // Categorías predefinidas
  const categorias = [
    'Tintes',
    'Tratamientos',
    'Champús',
    'Acondicionadores',
    'Styling',
    'Accesorios',
    'Herramientas',
    'Otros'
  ];

  // Cargar productos desde la API - solo una vez al montar
  const cargarProductos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/inventario');
      if (response.data?.success) {
        setProductos(response.data.data || []);
      } else {
        setProductos([]);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => cargarProductos(), 50);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, cargarProductos]);

  // Filtrar productos
  const productosFiltrados = productos.filter(producto => {
    const matchSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       producto.codigo_barras?.includes(searchTerm);
    const matchCategory = filterCategory === 'all' || producto.categoria === filterCategory;
    const matchStock = filterStock === 'all' ||
                      (filterStock === 'low' && producto.stock <= producto.stock_minimo) ||
                      (filterStock === 'out' && producto.stock === 0) ||
                      (filterStock === 'ok' && producto.stock > producto.stock_minimo);
    return matchSearch && matchCategory && matchStock;
  });

  // Estadísticas
  const stats = {
    totalProductos: productos.length,
    bajoStock: productos.filter(p => p.stock <= p.stock_minimo && p.stock > 0).length,
    sinStock: productos.filter(p => p.stock === 0).length,
    valorInventario: productos.reduce((sum, p) => sum + (p.precio_compra * p.stock), 0)
  };

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productoData = {
        ...formData,
        precio_compra: parseFloat(formData.precio_compra),
        precio_venta: parseFloat(formData.precio_venta),
        stock: parseInt(formData.stock),
        stock_minimo: parseInt(formData.stock_minimo)
      };

      if (editingProduct) {
        // Actualizar via API
        const response = await api.put(`/inventario/${editingProduct.id}`, productoData);
        if (response.data.success) {
          notifySuccess('Producto actualizado correctamente');
          cargarProductos();
        } else {
          notifyError(response.data.message || 'Error al actualizar producto');
        }
      } else {
        // Crear nuevo via API
        const response = await api.post('/inventario', productoData);
        if (response.data.success) {
          notifySuccess('Producto creado correctamente');
          cargarProductos();
        } else {
          notifyError(response.data.message || 'Error al crear producto');
        }
      }
      closeModal();
    } catch (error) {
      notifyError('Error al guardar el producto');
    }
  };

  const handleEdit = (producto) => {
    setEditingProduct(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      categoria: producto.categoria,
      precio_compra: producto.precio_compra,
      precio_venta: producto.precio_venta,
      stock: producto.stock,
      stock_minimo: producto.stock_minimo,
      unidad: producto.unidad || 'unidad',
      proveedor: producto.proveedor || '',
      codigo_barras: producto.codigo_barras || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        const response = await api.delete(`/inventario/${id}`);
        if (response.data.success) {
          notifySuccess('Producto eliminado');
          cargarProductos();
        } else {
          notifyError(response.data.message || 'Error al eliminar producto');
        }
      } catch (error) {
        console.error('Error eliminando producto:', error);
        notifyError('Error de conexión al eliminar producto');
      }
    }
  };

  const handleMovement = (producto, tipo) => {
    setSelectedProduct(producto);
    setShowMovementModal(true);
  };

  const handleMovementSubmit = async (cantidad, tipo) => {
    try {
      const newStock = tipo === 'entrada' 
        ? selectedProduct.stock + parseInt(cantidad)
        : selectedProduct.stock - parseInt(cantidad);
      
      const response = await api.put(`/inventario/${selectedProduct.id}`, {
        stock: Math.max(0, newStock)
      });
      
      if (response.data.success) {
        setShowMovementModal(false);
        setSelectedProduct(null);
        notifySuccess(`Movimiento de ${tipo} registrado`);
        cargarProductos();
      } else {
        notifyError(response.data.message || 'Error al registrar movimiento');
      }
    } catch (error) {
      console.error('Error en movimiento de stock:', error);
      notifyError('Error de conexión al registrar movimiento');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      nombre: '',
      descripcion: '',
      categoria: '',
      precio_compra: '',
      precio_venta: '',
      stock: '',
      stock_minimo: '',
      unidad: 'unidad',
      proveedor: '',
      codigo_barras: ''
    });
  };

  const getStockStatus = (producto) => {
    if (producto.stock === 0) return { label: 'Sin Stock', class: 'out' };
    if (producto.stock <= producto.stock_minimo) return { label: 'Bajo', class: 'low' };
    return { label: 'OK', class: 'ok' };
  };

  if (loading) {
    return (
      <div className="module-loading">
        <div className="spinner"></div>
        <p>Cargando inventario...</p>
      </div>
    );
  }

  return (
    <div className="module-inventory">
      {/* Header con estadísticas */}
      <div className="module-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalProductos}</span>
            <span className="stat-label">Productos</span>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <span className="stat-value">{stats.bajoStock}</span>
            <span className="stat-label">Bajo Stock</span>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">🚫</div>
          <div className="stat-info">
            <span className="stat-value">{stats.sinStock}</span>
            <span className="stat-label">Sin Stock</span>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-value">€{stats.valorInventario.toFixed(2)}</span>
            <span className="stat-label">Valor Total</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="module-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar producto o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todo el stock</option>
            <option value="ok">Stock OK</option>
            <option value="low">Bajo stock</option>
            <option value="out">Sin stock</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <span>➕</span> Nuevo Producto
          </button>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="module-table-container">
        <table className="module-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio Compra</th>
              <th>Precio Venta</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  <div className="empty-icon">📦</div>
                  <p>No hay productos que mostrar</p>
                </td>
              </tr>
            ) : (
              productosFiltrados.map(producto => {
                const stockStatus = getStockStatus(producto);
                return (
                  <tr key={producto.id}>
                    <td>
                      <div className="product-info">
                        <strong>{producto.nombre}</strong>
                        {producto.codigo_barras && (
                          <small className="product-code">{producto.codigo_barras}</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">{producto.categoria}</span>
                    </td>
                    <td>€{producto.precio_compra.toFixed(2)}</td>
                    <td>€{producto.precio_venta.toFixed(2)}</td>
                    <td>
                      <div className="stock-info">
                        <span className="stock-value">{producto.stock}</span>
                        <small className="stock-min">Min: {producto.stock_minimo}</small>
                      </div>
                    </td>
                    <td>
                      <span className={`stock-status ${stockStatus.class}`}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn add"
                          onClick={() => handleMovement(producto, 'entrada')}
                          title="Añadir stock"
                        >
                          ➕
                        </button>
                        <button
                          className="action-btn remove"
                          onClick={() => handleMovement(producto, 'salida')}
                          title="Restar stock"
                        >
                          ➖
                        </button>
                        <button
                          className="action-btn edit"
                          onClick={() => handleEdit(producto)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDelete(producto.id)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de producto */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label>Nombre del Producto *</label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej: Champú Profesional"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Categoría *</label>
                    <select
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {categorias.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Código de Barras</label>
                    <input
                      type="text"
                      name="codigo_barras"
                      value={formData.codigo_barras}
                      onChange={handleInputChange}
                      placeholder="EAN/UPC"
                    />
                  </div>

                  <div className="form-group">
                    <label>Precio Compra (€) *</label>
                    <input
                      type="number"
                      name="precio_compra"
                      value={formData.precio_compra}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label>Precio Venta (€) *</label>
                    <input
                      type="number"
                      name="precio_venta"
                      value={formData.precio_venta}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label>Stock Actual *</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      required
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Stock Mínimo *</label>
                    <input
                      type="number"
                      name="stock_minimo"
                      value={formData.stock_minimo}
                      onChange={handleInputChange}
                      required
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Unidad</label>
                    <select
                      name="unidad"
                      value={formData.unidad}
                      onChange={handleInputChange}
                    >
                      <option value="unidad">Unidad</option>
                      <option value="ml">Mililitros (ml)</option>
                      <option value="gr">Gramos (gr)</option>
                      <option value="kg">Kilogramos (kg)</option>
                      <option value="litro">Litros</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Proveedor</label>
                    <input
                      type="text"
                      name="proveedor"
                      value={formData.proveedor}
                      onChange={handleInputChange}
                      placeholder="Nombre del proveedor"
                    />
                  </div>

                  <div className="form-group full">
                    <label>Descripción</label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Descripción del producto..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de movimiento de stock */}
      {showMovementModal && selectedProduct && (
        <MovementModal
          producto={selectedProduct}
          onClose={() => {
            setShowMovementModal(false);
            setSelectedProduct(null);
          }}
          onSubmit={handleMovementSubmit}
        />
      )}
    </div>
  );
};

/**
 * Modal de movimiento de stock
 */
const MovementModal = ({ producto, onClose, onSubmit }) => {
  const [cantidad, setCantidad] = useState('');
  const [tipo, setTipo] = useState('entrada');
  const [motivo, setMotivo] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cantidad && parseInt(cantidad) > 0) {
      onSubmit(cantidad, tipo);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Movimiento de Stock</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="product-summary">
              <strong>{producto.nombre}</strong>
              <span className="current-stock">Stock actual: {producto.stock}</span>
            </div>

            <div className="form-group">
              <label>Tipo de Movimiento</label>
              <div className="radio-group">
                <label className={`radio-option ${tipo === 'entrada' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    value="entrada"
                    checked={tipo === 'entrada'}
                    onChange={(e) => setTipo(e.target.value)}
                  />
                  <span className="radio-icon">➕</span>
                  Entrada
                </label>
                <label className={`radio-option ${tipo === 'salida' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    value="salida"
                    checked={tipo === 'salida'}
                    onChange={(e) => setTipo(e.target.value)}
                  />
                  <span className="radio-icon">➖</span>
                  Salida
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Cantidad</label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                min="1"
                required
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label>Motivo (opcional)</label>
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="compra">Compra a proveedor</option>
                <option value="venta">Venta</option>
                <option value="ajuste">Ajuste de inventario</option>
                <option value="devolucion">Devolución</option>
                <option value="merma">Merma/Pérdida</option>
                <option value="uso_interno">Uso interno</option>
              </select>
            </div>

            {cantidad && (
              <div className="stock-preview">
                <span>Stock resultante:</span>
                <strong className={tipo === 'entrada' ? 'positive' : 'negative'}>
                  {tipo === 'entrada' 
                    ? producto.stock + parseInt(cantidad || 0)
                    : Math.max(0, producto.stock - parseInt(cantidad || 0))
                  }
                </strong>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Registrar Movimiento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryModule;
