/**
 * ========================================
 * RESPONSIVE TABLE COMPONENT - NEURIAX
 * Tablas que se convierten en cards en móvil
 * ========================================
 */

import React, { useState, useMemo } from 'react';
import './ResponsiveTable.css';

// ========== RESPONSIVE TABLE ==========
export const ResponsiveTable = ({
  columns = [],
  data = [],
  onRowClick,
  emptyMessage = 'No hay datos para mostrar',
  loading = false,
  className = '',
  stickyHeader = false,
  striped = true,
  hoverable = true,
  compact = false,
  cardMobileView = true,
  sortable = false,
  defaultSort = null,
  actions,
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  mobileCardRender
}) => {
  const [sortConfig, setSortConfig] = useState(defaultSort);
  
  // Sort data
  const sortedData = useMemo(() => {
    if (!sortable || !sortConfig) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, [data, sortConfig, sortable]);
  
  const handleSort = (key) => {
    if (!sortable) return;
    
    setSortConfig(current => {
      if (current?.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };
  
  const isAllSelected = selectedRows.length === data.length && data.length > 0;
  const isSomeSelected = selectedRows.length > 0 && selectedRows.length < data.length;
  
  if (loading) {
    return (
      <div className={`responsive-table-container ${className}`}>
        <div className="table-loading">
          <div className="table-loading-spinner"></div>
          <span>Cargando datos...</span>
        </div>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className={`responsive-table-container ${className}`}>
        <div className="table-empty">
          <span className="table-empty-icon">📋</span>
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`responsive-table-container ${className}`}>
      {/* Desktop Table View */}
      <div className="table-desktop-view">
        <table className={`
          responsive-table
          ${stickyHeader ? 'sticky-header' : ''}
          ${striped ? 'striped' : ''}
          ${hoverable ? 'hoverable' : ''}
          ${compact ? 'compact' : ''}
        `}>
          <thead>
            <tr>
              {selectable && (
                <th className="th-checkbox">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={el => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    ${col.className || ''}
                    ${col.align ? `text-${col.align}` : ''}
                    ${sortable && col.sortable !== false ? 'sortable' : ''}
                    ${sortConfig?.key === col.key ? `sorted-${sortConfig.direction}` : ''}
                  `}
                  style={{ width: col.width }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <span className="th-content">
                    {col.header}
                    {sortable && col.sortable !== false && (
                      <span className="sort-indicator">
                        {sortConfig?.key === col.key ? (
                          sortConfig.direction === 'asc' ? '↑' : '↓'
                        ) : '↕'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              {actions && <th className="th-actions">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className={`
                  ${onRowClick ? 'clickable' : ''}
                  ${selectedRows.includes(row.id) ? 'selected' : ''}
                `}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <td className="td-checkbox" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id)}
                      onChange={() => onSelectRow?.(row.id)}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`${col.className || ''} ${col.align ? `text-${col.align}` : ''}`}
                  >
                    {col.render ? col.render(row[col.key], row, rowIndex) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="td-actions" onClick={e => e.stopPropagation()}>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Card View */}
      {cardMobileView && (
        <div className="table-mobile-view">
          {sortedData.map((row, rowIndex) => (
            <div
              key={row.id || rowIndex}
              className={`
                table-card
                ${onRowClick ? 'clickable' : ''}
                ${selectedRows.includes(row.id) ? 'selected' : ''}
              `}
              onClick={() => onRowClick?.(row)}
            >
              {selectable && (
                <div className="card-checkbox" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(row.id)}
                    onChange={() => onSelectRow?.(row.id)}
                  />
                </div>
              )}
              
              {mobileCardRender ? (
                mobileCardRender(row, rowIndex)
              ) : (
                <div className="card-content">
                  {columns.map((col, colIndex) => {
                    const value = col.render 
                      ? col.render(row[col.key], row, rowIndex)
                      : row[col.key];
                    
                    // First column as title
                    if (colIndex === 0) {
                      return (
                        <div key={col.key} className="card-title">
                          {value}
                        </div>
                      );
                    }
                    
                    // Skip hidden on mobile
                    if (col.hideOnMobile) return null;
                    
                    return (
                      <div key={col.key} className="card-field">
                        <span className="card-label">{col.header}</span>
                        <span className="card-value">{value}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {actions && (
                <div className="card-actions" onClick={e => e.stopPropagation()}>
                  {actions(row)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ========== TABLE ACTION BUTTON ==========
export const TableAction = ({
  icon,
  label,
  onClick,
  variant = 'default',
  disabled = false
}) => {
  return (
    <button
      className={`table-action table-action-${variant}`}
      onClick={onClick}
      disabled={disabled}
      title={label}
    >
      {icon && <span className="table-action-icon">{icon}</span>}
      <span className="table-action-label">{label}</span>
    </button>
  );
};

// ========== TABLE ACTION GROUP ==========
export const TableActions = ({ children }) => {
  return (
    <div className="table-actions-group">
      {children}
    </div>
  );
};

// ========== STATUS BADGE ==========
export const StatusBadge = ({ status, label, size = 'normal' }) => {
  const statusMap = {
    active: 'success',
    inactive: 'danger',
    pending: 'warning',
    completed: 'success',
    cancelled: 'danger',
    processing: 'info',
    default: 'default'
  };
  
  const variant = statusMap[status?.toLowerCase()] || statusMap.default;
  
  return (
    <span className={`status-badge status-badge-${variant} status-badge-${size}`}>
      {label || status}
    </span>
  );
};

// ========== AVATAR CELL ==========
export const AvatarCell = ({ 
  name, 
  subtitle, 
  image, 
  size = 'normal',
  showInitials = true 
}) => {
  const initials = name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
  
  return (
    <div className={`avatar-cell avatar-cell-${size}`}>
      <div className="avatar-cell-image">
        {image ? (
          <img src={image} alt={name} />
        ) : showInitials ? (
          <span className="avatar-initials">{initials}</span>
        ) : (
          <span className="avatar-icon">👤</span>
        )}
      </div>
      <div className="avatar-cell-info">
        <span className="avatar-name">{name}</span>
        {subtitle && <span className="avatar-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
};

// ========== CURRENCY CELL ==========
export const CurrencyCell = ({ 
  value, 
  currency = '€', 
  positive = null,
  decimals = 2
}) => {
  const numValue = parseFloat(value) || 0;
  const isPositive = positive ?? numValue >= 0;
  
  return (
    <span className={`currency-cell ${isPositive ? 'positive' : 'negative'}`}>
      {isPositive ? '' : '-'}
      {Math.abs(numValue).toFixed(decimals)} {currency}
    </span>
  );
};

// ========== DATE CELL ==========
export const DateCell = ({ 
  date, 
  format = 'short',
  showTime = false 
}) => {
  if (!date) return <span className="date-cell empty">-</span>;
  
  const dateObj = new Date(date);
  
  const dateOptions = format === 'long' 
    ? { year: 'numeric', month: 'long', day: 'numeric' }
    : { year: 'numeric', month: '2-digit', day: '2-digit' };
  
  const timeOptions = { hour: '2-digit', minute: '2-digit' };
  
  return (
    <span className="date-cell">
      <span className="date-value">{dateObj.toLocaleDateString('es-ES', dateOptions)}</span>
      {showTime && (
        <span className="time-value">{dateObj.toLocaleTimeString('es-ES', timeOptions)}</span>
      )}
    </span>
  );
};

// ========== EXPORTS ==========
export default {
  ResponsiveTable,
  TableAction,
  TableActions,
  StatusBadge,
  AvatarCell,
  CurrencyCell,
  DateCell
};
