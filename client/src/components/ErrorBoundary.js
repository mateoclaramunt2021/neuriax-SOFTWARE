/**
 * ErrorBoundary - Componente para capturar errores en la aplicación
 * Previene que errores en componentes hijos derrumben toda la app
 * 
 * @component
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */

import React from 'react';
import '../styles/error-boundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Incrementar contador de errores
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log del error en consola para desarrollo
    console.error('Error capturado por ErrorBoundary:', error);
    console.error('Información del error:', errorInfo);

    // Aquí se podría enviar a un servicio de logging en producción
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  /**
   * Envía el error a un servicio de logging externo
   * @param {Error} error - Error capturado
   * @param {Object} errorInfo - Información adicional del error
   */
  logErrorToService = (error, errorInfo) => {
    try {
      // Aquí iría la lógica para enviar a Sentry, LogRocket, etc.
      console.log('Enviando error a servicio de logging...');
    } catch (logError) {
      console.error('Error al registrar en servicio:', logError);
    }
  };

  /**
   * Resetea el estado de error
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    // Recargar la página
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h1>¡Algo salió mal!</h1>
            <p className="error-message">
              Disculpa, hemos encontrado un error inesperado. 
              {this.state.errorCount > 3 && 
                ' Este problema persiste, por favor recarga la página.'}
            </p>

            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Detalles del error (solo en desarrollo)</summary>
                <div className="error-stack">
                  <p><strong>Error:</strong></p>
                  <pre>{this.state.error && this.state.error.toString()}</pre>
                  <p><strong>Stack trace:</strong></p>
                  <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                </div>
              </details>
            )}

            <div className="error-actions">
              <button 
                className="btn-reset"
                onClick={this.handleReset}
              >
                Recargar la página
              </button>
              <button 
                className="btn-home"
                onClick={() => window.location.href = '/'}
              >
                Ir al inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
