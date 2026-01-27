/**
 * ErrorBoundary Component
 * Captura errores en el árbol de componentes
 */

import React from 'react';
import '../styles/errorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log del error
    console.error('Error caught by boundary:', error, errorInfo);

    // Incrementar contador de errores
    this.setState((prev) => ({
      error,
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // Enviar a servidor de logs si está disponible
    if (window.errorLogger) {
      window.errorLogger.error('Component Error', error, {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      });
    }

    // Si hay muchos errores, hacer reload
    if (this.state.errorCount > 5) {
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;

    if (hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">💥</div>

            <h1 className="error-title">
              {this.props.title || 'Algo salió mal'}
            </h1>

            <p className="error-message">
              {this.props.message ||
                'Disculpa, ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.'}
            </p>

            {process.env.NODE_ENV === 'development' && error && (
              <details className="error-details">
                <summary>Detalles del error (desarrollo)</summary>
                <pre className="error-stack">
                  {error.toString()}
                  {'\n\n'}
                  {errorInfo && errorInfo.componentStack}
                </pre>
              </details>
            )}

            {errorCount > 3 && (
              <p className="error-warning">
                Se han detectado múltiples errores. Se recargará la página
                automáticamente.
              </p>
            )}

            <div className="error-actions">
              <button
                className="btn btn-secondary"
                onClick={this.handleReset}
              >
                Intentar de nuevo
              </button>

              <button
                className="btn btn-primary"
                onClick={this.handleReload}
              >
                Recargar página
              </button>
            </div>

            {this.props.fallback && (
              <div className="error-fallback">
                {this.props.fallback}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
