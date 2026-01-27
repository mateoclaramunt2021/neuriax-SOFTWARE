import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/shared.css';
import './styles/globals.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { initSentry } from './utils/sentryConfig';
import { reportWebVitals, monitorPerformance } from './utils/performanceMonitoring';

// Inicializar Sentry en producción
initSentry();

// Monitorear Web Vitals
reportWebVitals((metric) => {
  console.log('📊 Web Vital:', metric);
  
  // Enviar a Sentry en producción
  if (process.env.NODE_ENV === 'production' && window.__SENTRY__) {
    window.__SENTRY__.captureMessage(`Web Vital: ${metric.name}`, 'info');
  }
});

// Monitorear performance general
monitorPerformance();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
