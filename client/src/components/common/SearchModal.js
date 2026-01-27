/**
 * SearchModal - Búsqueda Global (Ctrl+K / Cmd+K)
 * Busca en clientes, citas, servicios, empleados, inventario
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import '../../styles/search-modal.css';

export default function SearchModal({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    clientes: [],
    servicios: [],
    citas: [],
    empleados: [],
    productos: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Focus en input al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setResults({ clientes: [], servicios: [], citas: [], empleados: [], productos: [] });
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Búsqueda con debounce
  const searchAll = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults({ clientes: [], servicios: [], citas: [], empleados: [], productos: [] });
      return;
    }

    setLoading(true);
    try {
      const [clientesRes, serviciosRes, citasRes, empleadosRes, inventarioRes] = await Promise.allSettled([
        api.get(`/clientes?search=${encodeURIComponent(searchQuery)}`),
        api.get(`/servicios?search=${encodeURIComponent(searchQuery)}`),
        api.get(`/citas?search=${encodeURIComponent(searchQuery)}`),
        api.get(`/empleados?search=${encodeURIComponent(searchQuery)}`),
        api.get(`/inventario?search=${encodeURIComponent(searchQuery)}`)
      ]);

      const extractData = (res) => {
        if (res.status === 'fulfilled') {
          const data = res.value?.data;
          return data?.data || data?.clientes || data?.servicios || data?.citas || data?.empleados || data?.productos || [];
        }
        return [];
      };

      // Filtrar localmente si la API no soporta búsqueda
      const filterByQuery = (items, fields) => {
        const q = searchQuery.toLowerCase();
        return (items || []).filter(item => 
          fields.some(field => {
            const value = item[field];
            return value && value.toString().toLowerCase().includes(q);
          })
        ).slice(0, 5);
      };

      const clientes = filterByQuery(extractData(clientesRes), ['nombre', 'name', 'email', 'telefono', 'phone']);
      const servicios = filterByQuery(extractData(serviciosRes), ['nombre', 'name', 'categoria']);
      const citas = filterByQuery(extractData(citasRes), ['cliente', 'servicio', 'fecha']);
      const empleados = filterByQuery(extractData(empleadosRes), ['nombre', 'name', 'email', 'especialidad']);
      const productos = filterByQuery(extractData(inventarioRes), ['nombre', 'name', 'categoria', 'sku']);

      setResults({ clientes, servicios, citas, empleados, productos });
      setSelectedIndex(0);
    } catch (err) {
      console.error('Error en búsqueda:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAll(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchAll]);

  // Obtener todos los resultados como lista plana
  const getAllResults = () => {
    const all = [];
    
    if (activeCategory === 'all' || activeCategory === 'clientes') {
      results.clientes.forEach(item => all.push({ ...item, type: 'cliente', icon: '👤' }));
    }
    if (activeCategory === 'all' || activeCategory === 'servicios') {
      results.servicios.forEach(item => all.push({ ...item, type: 'servicio', icon: '✂️' }));
    }
    if (activeCategory === 'all' || activeCategory === 'citas') {
      results.citas.forEach(item => all.push({ ...item, type: 'cita', icon: '📅' }));
    }
    if (activeCategory === 'all' || activeCategory === 'empleados') {
      results.empleados.forEach(item => all.push({ ...item, type: 'empleado', icon: '👨‍💼' }));
    }
    if (activeCategory === 'all' || activeCategory === 'productos') {
      results.productos.forEach(item => all.push({ ...item, type: 'producto', icon: '📦' }));
    }
    
    return all;
  };

  const flatResults = getAllResults();
  const totalResults = flatResults.length;

  // Navegación con teclado
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, totalResults - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
      handleSelect(flatResults[selectedIndex]);
    }
  };

  // Seleccionar resultado
  const handleSelect = (item) => {
    const moduleMap = {
      cliente: 'clientes',
      servicio: 'servicios',
      cita: 'citas',
      empleado: 'empleados',
      producto: 'inventario'
    };
    
    if (onNavigate) {
      onNavigate(moduleMap[item.type], item);
    }
    onClose();
  };

  // Atajos de teclado global
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ctrl+K o Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  // Scroll al elemento seleccionado
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector('.search-result-item.selected');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Todos', count: totalResults },
    { id: 'clientes', label: 'Clientes', count: results.clientes.length },
    { id: 'servicios', label: 'Servicios', count: results.servicios.length },
    { id: 'citas', label: 'Citas', count: results.citas.length },
    { id: 'empleados', label: 'Empleados', count: results.empleados.length },
    { id: 'productos', label: 'Inventario', count: results.productos.length }
  ];

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        {/* Header con input */}
        <div className="search-header">
          <div className="search-icon">🔍</div>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Buscar clientes, servicios, citas, empleados..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <div className="search-shortcut">
            <kbd>ESC</kbd>
          </div>
        </div>

        {/* Categorías */}
        {query.length >= 2 && (
          <div className="search-categories">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`search-category ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
                {cat.count > 0 && <span className="category-count">{cat.count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Resultados */}
        <div className="search-results" ref={resultsRef}>
          {loading && (
            <div className="search-loading">
              <div className="search-spinner"></div>
              <span>Buscando...</span>
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="search-hint">
              <p>💡 Escribe al menos 2 caracteres para buscar</p>
              <div className="search-shortcuts">
                <div><kbd>↑</kbd> <kbd>↓</kbd> para navegar</div>
                <div><kbd>Enter</kbd> para seleccionar</div>
                <div><kbd>Esc</kbd> para cerrar</div>
              </div>
            </div>
          )}

          {!loading && query.length >= 2 && totalResults === 0 && (
            <div className="search-empty">
              <span className="empty-icon">🔎</span>
              <p>No se encontraron resultados para "{query}"</p>
              <p className="empty-hint">Intenta con otros términos</p>
            </div>
          )}

          {!loading && flatResults.map((item, index) => (
            <div
              key={`${item.type}-${item.id}`}
              className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="result-icon">{item.icon}</div>
              <div className="result-content">
                <div className="result-title">
                  {item.nombre || item.name || item.cliente || 'Sin nombre'}
                </div>
                <div className="result-meta">
                  <span className="result-type">{item.type}</span>
                  {item.email && <span>• {item.email}</span>}
                  {item.telefono && <span>• {item.telefono}</span>}
                  {item.precio && <span>• €{item.precio}</span>}
                  {item.fecha && <span>• {item.fecha}</span>}
                  {item.categoria && <span>• {item.categoria}</span>}
                </div>
              </div>
              <div className="result-action">
                <kbd>↵</kbd>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="search-footer">
          <div className="footer-left">
            <span className="powered-by">⚡ Búsqueda instantánea</span>
          </div>
          <div className="footer-right">
            <span><kbd>Ctrl</kbd> + <kbd>K</kbd> para abrir/cerrar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
