/**
 * ConfirmDialog Component
 * Modal de confirmación para acciones destructivas (delete, logout, etc)
 */

import React from 'react';
import '../styles/confirmDialog.css';

const ConfirmDialog = ({
  isOpen,
  title = '¿Confirmar acción?',
  message = '¿Estás seguro de que deseas continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isDangerous = false,
  isLoading = false,
  icon = '⚠️',
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div
        className={`confirm-dialog ${isDangerous ? 'dangerous' : ''} ${isLoading ? 'loading' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-dialog-icon">{icon}</div>

        <h2 className="confirm-dialog-title">{title}</h2>

        <p className="confirm-dialog-message">{message}</p>

        <div className="confirm-dialog-actions">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>

          <button
            className={`btn ${isDangerous ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-small"></span>
                Procesando...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
