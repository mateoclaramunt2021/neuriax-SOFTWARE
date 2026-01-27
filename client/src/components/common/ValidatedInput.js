/**
 * ValidatedInput Component
 * Input field con validación en tiempo real, error messages y visual feedback
 */

import React, { useState } from 'react';
import '../styles/validatedInput.css';

const ValidatedInput = ({
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  required = false,
  placeholder = '',
  disabled = false,
  minLength,
  maxLength,
  min,
  max,
  pattern,
  hint,
  icon,
  successMessage,
}) => {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;
  const isValid = value && !error;

  return (
    <div className={`validated-input-wrapper ${hasError ? 'error' : ''} ${isValid ? 'success' : ''} ${focused ? 'focused' : ''}`}>
      {label && (
        <label htmlFor={name} className="input-label">
          {icon && <span className="input-icon">{icon}</span>}
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <div className="input-container">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            setFocused(false);
            onBlur && onBlur(e);
          }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          disabled={disabled}
          minLength={minLength}
          maxLength={maxLength}
          min={min}
          max={max}
          pattern={pattern}
          className="validated-input"
          aria-invalid={hasError}
          aria-describedby={`${name}-error`}
        />

        {isValid && (
          <span className="input-success-icon">✓</span>
        )}
        {hasError && (
          <span className="input-error-icon">✕</span>
        )}
      </div>

      {error && (
        <p id={`${name}-error`} className="input-error-message">
          {error}
        </p>
      )}

      {successMessage && isValid && (
        <p className="input-success-message">
          {successMessage}
        </p>
      )}

      {hint && !hasError && (
        <p className="input-hint">
          {hint}
        </p>
      )}

      {maxLength && type === 'text' && (
        <p className="input-counter">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
};

export default ValidatedInput;
