/**
 * NotificationToast Component
 * Muestra los toasts/notificaciones globales - ROBUSTO Y SIEMPRE VISIBLE
 */
import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import '../../styles/notifications.css';

export function NotificationToast() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="notifications-container" role="region" aria-live="assertive" aria-atomic="true">
      {notifications && notifications.length > 0 && notifications.map((notification) => (
        <div
          key={notification.id}
          className={`toast toast-${notification.type || 'info'}`}
          role="alert"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            backgroundColor: 'white',
            borderLeft: '4px solid',
            minHeight: '60px'
          }}
        >
          <div className="toast-content" style={{ flex: 1, fontWeight: 600, fontSize: '14px' }}>
            {notification.message}
          </div>
          <button
            className="toast-close"
            onClick={() => removeNotification(notification.id)}
            aria-label="Cerrar notificación"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              marginLeft: '16px',
              color: 'inherit',
              padding: 0,
              opacity: 0.6,
              transition: 'opacity 200ms'
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
