/**
 * Input Component - Input reutilizable con validación
 */
import React from 'react';
import '../../styles/components.css';

export function Input({
  name,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  label,
  className = '',
  ...props
}) {
  const hasError = touched && error;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        className={`form-input ${hasError ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {hasError && (
        <span className="form-error">{error}</span>
      )}
    </div>
  );
}
