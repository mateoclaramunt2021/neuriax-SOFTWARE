import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import '../styles/dualLoginTest.css';

/**
 * DualLoginTest Component
 * Tests the dual authentication system (Profesionales vs Clientes)
 * - Professional Login: username: "mateoclaramunt", password: "1234"
 * - Client Login: username: "maria_garcia", password: "1234"
 */
export default function DualLoginTest() {
  const { loginProfessional, loginClient } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleProfessionalLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await loginProfessional('mateoclaramunt', '1234', true);
      setResult({
        type: 'professional',
        data: response
      });
    } catch (err) {
      setError(err.message || 'Error logging in as professional');
    } finally {
      setLoading(false);
    }
  };

  const handleClientLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await loginClient('maria_garcia', '1234', true);
      setResult({
        type: 'client',
        data: response
      });
    } catch (err) {
      setError(err.message || 'Error logging in as client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dual-login-test-container">
      <div className="test-header">
        <h1>🔐 Sistema de Autenticación Dual</h1>
        <p>Prueba el login para profesionales y clientes</p>
      </div>

      <div className="test-buttons">
        <button 
          onClick={handleProfessionalLogin}
          disabled={loading}
          className="btn btn-professional"
        >
          {loading ? 'Cargando...' : '👨‍💼 Login Profesional'}
        </button>
        <button 
          onClick={handleClientLogin}
          disabled={loading}
          className="btn btn-client"
        >
          {loading ? 'Cargando...' : '👩 Login Cliente'}
        </button>
      </div>

      {error && (
        <div className="test-error">
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className={`test-result ${result.type}`}>
          <h3>✅ {result.type === 'professional' ? 'Login Profesional Exitoso' : 'Login Cliente Exitoso'}</h3>
          <div className="result-content">
            <h4>Datos del Usuario:</h4>
            <pre>{JSON.stringify(result.data, null, 2)}</pre>
          </div>
        </div>
      )}

      <div className="test-info">
        <h3>ℹ️ Credenciales de Prueba</h3>
        <div className="credentials">
          <div className="credential-item">
            <h4>Profesional:</h4>
            <p>Username: <code>mateoclaramunt</code></p>
            <p>Password: <code>1234</code></p>
          </div>
          <div className="credential-item">
            <h4>Cliente:</h4>
            <p>Username: <code>maria_garcia</code></p>
            <p>Password: <code>1234</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
