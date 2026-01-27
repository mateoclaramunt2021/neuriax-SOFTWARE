/**
 * Notification Context - Sistema Global de Notificaciones
 * Maneja toasts, alerts y mensajes del sistema
 */
import React, { createContext, useCallback, useState } from 'react';

export const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = Date.now();
      const notification = { id, message, type };

      setNotifications((prev) => [...prev, notification]);

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }

      return id;
    },
    [removeNotification]
  );

  const success = (message, duration) =>
    addNotification(message, 'success', duration);
  const error = (message, duration) =>
    addNotification(message, 'error', duration);
  const warning = (message, duration) =>
    addNotification(message, 'warning', duration);
  const info = (message, duration) =>
    addNotification(message, 'info', duration);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom Hook
export function useNotification() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe usarse dentro de NotificationProvider');
  }
  return context;
}
