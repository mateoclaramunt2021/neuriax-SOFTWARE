/**
 * NEURIAX SaaS Platform - Componentes de Seguridad
 * PASO 9: Autenticación Reforzada
 */

import React, { useState, useEffect, useCallback } from 'react';
import securityService from '../../services/securityService';
import './SecuritySettings.css';

// ==========================================================
// ICONO COMPONENTES (inline para no depender de librería)
// ==========================================================

const Icons = {
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Key: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  ),
  Smartphone: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  ),
  Monitor: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  LogOut: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16,17 21,12 16,7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  Copy: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  RefreshCw: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23,4 23,10 17,10"/>
      <polyline points="1,20 1,14 7,14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  )
};

// ==========================================================
// SESSION MANAGER - Gestión de sesiones activas
// ==========================================================

export const SessionManager = ({ onSessionsChange }) => {
  const [sessions, setSessions] = useState({ active: [], rememberMe: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    const result = await securityService.getActiveSessions();
    if (result.success) {
      setSessions(result.sessions);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleLogoutAll = async () => {
    if (!window.confirm('¿Cerrar todas las sesiones? Tendrás que volver a iniciar sesión.')) {
      return;
    }
    
    setLoggingOutAll(true);
    const result = await securityService.logoutAllSessions();
    
    if (result.success) {
      onSessionsChange?.();
      // Redirigir al login
      window.location.href = '/login';
    } else {
      setError(result.error);
    }
    setLoggingOutAll(false);
  };

  if (loading) {
    return (
      <div className="security-card">
        <div className="security-card-header">
          <div className="security-icon"><Icons.Monitor /></div>
          <h3>Sesiones Activas</h3>
        </div>
        <div className="security-loading">Cargando sesiones...</div>
      </div>
    );
  }

  const totalSessions = sessions.active.length + sessions.rememberMe.length;

  return (
    <div className="security-card">
      <div className="security-card-header">
        <div className="security-icon"><Icons.Monitor /></div>
        <div>
          <h3>Sesiones Activas</h3>
          <p className="security-subtitle">{totalSessions} dispositivo{totalSessions !== 1 ? 's' : ''} conectado{totalSessions !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {error && <div className="security-error">{error}</div>}

      <div className="sessions-list">
        {sessions.active.map((session, index) => (
          <div key={`active-${index}`} className="session-item">
            <div className="session-icon">
              {session.device?.includes('Mobile') ? <Icons.Smartphone /> : <Icons.Monitor />}
            </div>
            <div className="session-info">
              <div className="session-device">
                {securityService.formatDeviceInfo(session.deviceInfo || { browser: session.device })}
              </div>
              <div className="session-meta">
                <span><Icons.Clock /> {securityService.formatRelativeTime(session.createdAt)}</span>
                <span className="session-ip">IP: {session.ip || 'Desconocida'}</span>
              </div>
            </div>
            <div className="session-badge active">Activa</div>
          </div>
        ))}

        {sessions.rememberMe.map((session, index) => (
          <div key={`rm-${index}`} className="session-item">
            <div className="session-icon remember-me">
              <Icons.Key />
            </div>
            <div className="session-info">
              <div className="session-device">
                {securityService.formatDeviceInfo(session.deviceInfo)}
              </div>
              <div className="session-meta">
                <span><Icons.Clock /> Último uso: {securityService.formatRelativeTime(session.lastUsed)}</span>
                <span>Expira: {new Date(session.expiresAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="session-badge remember">Remember Me</div>
          </div>
        ))}

        {totalSessions === 0 && (
          <div className="sessions-empty">
            No hay sesiones activas
          </div>
        )}
      </div>

      <div className="security-card-actions">
        <button 
          className="btn-security-refresh"
          onClick={loadSessions}
          disabled={loading}
        >
          <Icons.RefreshCw /> Actualizar
        </button>
        
        {totalSessions > 0 && (
          <button 
            className="btn-security-danger"
            onClick={handleLogoutAll}
            disabled={loggingOutAll}
          >
            <Icons.LogOut /> {loggingOutAll ? 'Cerrando...' : 'Cerrar todas las sesiones'}
          </button>
        )}
      </div>
    </div>
  );
};

// ==========================================================
// TWO FACTOR SETUP - Configuración de 2FA
// ==========================================================

export const TwoFactorSetup = ({ onStatusChange }) => {
  const [status, setStatus] = useState({ enabled: false, remainingBackupCodes: 0 });
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState(null);
  const [step, setStep] = useState('status'); // status, setup, verify, disable
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    const result = await securityService.get2FAStatus();
    if (result.success) {
      setStatus({ enabled: result.enabled, remainingBackupCodes: result.remainingBackupCodes });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleSetup = async () => {
    setError(null);
    setLoading(true);
    const result = await securityService.setup2FA();
    
    if (result.success) {
      setSetupData(result);
      setStep('setup');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setError(null);
    setLoading(true);
    const result = await securityService.enable2FA(code);
    
    if (result.success) {
      setStatus({ enabled: true, remainingBackupCodes: 10 });
      setStep('status');
      setSetupData(null);
      setCode('');
      onStatusChange?.(true);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleDisable = async () => {
    if (!password) {
      setError('Introduce tu contraseña');
      return;
    }

    setError(null);
    setLoading(true);
    const result = await securityService.disable2FA(password);
    
    if (result.success) {
      setStatus({ enabled: false, remainingBackupCodes: 0 });
      setStep('status');
      setPassword('');
      onStatusChange?.(false);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading && step === 'status') {
    return (
      <div className="security-card">
        <div className="security-card-header">
          <div className="security-icon"><Icons.Smartphone /></div>
          <h3>Autenticación de Dos Factores</h3>
        </div>
        <div className="security-loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="security-card">
      <div className="security-card-header">
        <div className="security-icon"><Icons.Smartphone /></div>
        <div>
          <h3>Autenticación de Dos Factores (2FA)</h3>
          <p className="security-subtitle">
            {status.enabled 
              ? `Activado • ${status.remainingBackupCodes} códigos de respaldo` 
              : 'Añade una capa extra de seguridad'}
          </p>
        </div>
        <div className={`security-status-badge ${status.enabled ? 'enabled' : 'disabled'}`}>
          {status.enabled ? <><Icons.Check /> Activo</> : <><Icons.X /> Inactivo</>}
        </div>
      </div>

      {error && <div className="security-error">{error}</div>}

      {step === 'status' && (
        <div className="security-card-content">
          <p className="security-description">
            {status.enabled 
              ? 'Tu cuenta está protegida con autenticación de dos factores. Cada vez que inicies sesión, necesitarás tu contraseña y un código de tu app de autenticación.'
              : 'La autenticación de dos factores añade una capa adicional de seguridad a tu cuenta. Además de tu contraseña, necesitarás un código de tu teléfono para iniciar sesión.'}
          </p>
          
          <div className="security-card-actions">
            {status.enabled ? (
              <button 
                className="btn-security-danger"
                onClick={() => setStep('disable')}
              >
                <Icons.X /> Desactivar 2FA
              </button>
            ) : (
              <button 
                className="btn-security-primary"
                onClick={handleSetup}
                disabled={loading}
              >
                <Icons.Smartphone /> Configurar 2FA
              </button>
            )}
          </div>
        </div>
      )}

      {step === 'setup' && setupData && (
        <div className="security-card-content twofa-setup">
          <div className="setup-steps">
            <div className="setup-step">
              <span className="step-number">1</span>
              <div className="step-content">
                <h4>Descarga una app de autenticación</h4>
                <p>Google Authenticator, Authy, o similar</p>
              </div>
            </div>
            
            <div className="setup-step">
              <span className="step-number">2</span>
              <div className="step-content">
                <h4>Escanea el código QR o copia el secreto</h4>
                <div className="qr-container">
                  {/* En producción, mostrar QR generado */}
                  <div className="qr-placeholder">
                    <Icons.Smartphone />
                    <span>Escanea con tu app</span>
                  </div>
                  <div className="secret-manual">
                    <label>O introduce este código manualmente:</label>
                    <div className="secret-code">
                      <code>{setupData.secret}</code>
                      <button onClick={() => copyToClipboard(setupData.secret)}>
                        {copiedCode ? <Icons.Check /> : <Icons.Copy />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="setup-step">
              <span className="step-number">3</span>
              <div className="step-content">
                <h4>Introduce el código de 6 dígitos</h4>
                <input
                  type="text"
                  className="twofa-code-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
            </div>
          </div>

          <div className="backup-codes-section">
            <button 
              className="btn-show-backup"
              onClick={() => setShowBackupCodes(!showBackupCodes)}
            >
              {showBackupCodes ? 'Ocultar' : 'Mostrar'} códigos de respaldo
            </button>
            
            {showBackupCodes && (
              <div className="backup-codes-grid">
                <p className="backup-warning">
                  <Icons.AlertTriangle /> Guarda estos códigos en un lugar seguro. 
                  Podrás usarlos si pierdes acceso a tu app de autenticación.
                </p>
                <div className="codes-grid">
                  {setupData.backupCodes?.map((code, i) => (
                    <code key={i}>{code}</code>
                  ))}
                </div>
                <button 
                  className="btn-copy-all"
                  onClick={() => copyToClipboard(setupData.backupCodes?.join('\n'))}
                >
                  <Icons.Copy /> Copiar todos
                </button>
              </div>
            )}
          </div>

          <div className="security-card-actions">
            <button className="btn-security-secondary" onClick={() => setStep('status')}>
              Cancelar
            </button>
            <button 
              className="btn-security-primary"
              onClick={handleVerify}
              disabled={code.length !== 6 || loading}
            >
              {loading ? 'Verificando...' : 'Verificar y Activar'}
            </button>
          </div>
        </div>
      )}

      {step === 'disable' && (
        <div className="security-card-content">
          <div className="disable-warning">
            <Icons.AlertTriangle />
            <p>¿Estás seguro de que quieres desactivar la autenticación de dos factores? Tu cuenta será menos segura.</p>
          </div>
          
          <div className="password-confirm">
            <label>Confirma tu contraseña:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña actual"
            />
          </div>

          <div className="security-card-actions">
            <button className="btn-security-secondary" onClick={() => { setStep('status'); setPassword(''); setError(null); }}>
              Cancelar
            </button>
            <button 
              className="btn-security-danger"
              onClick={handleDisable}
              disabled={!password || loading}
            >
              {loading ? 'Desactivando...' : 'Desactivar 2FA'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================================
// CHANGE PASSWORD - Cambio de contraseña
// ==========================================================

export const ChangePassword = ({ onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const validatePassword = (password) => {
    if (password.length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(password)) return 'Debe incluir una mayúscula';
    if (!/[0-9]/.test(password)) return 'Debe incluir un número';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!currentPassword) {
      setError('Introduce tu contraseña actual');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    const result = await securityService.changePassword(currentPassword, newPassword, confirmPassword);
    
    if (result.success) {
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onSuccess?.();
      setTimeout(() => setSuccess(false), 5000);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = getPasswordStrength(newPassword);
  const strengthLabels = ['', 'Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte', 'Muy fuerte'];
  const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981'];

  return (
    <div className="security-card">
      <div className="security-card-header">
        <div className="security-icon"><Icons.Key /></div>
        <div>
          <h3>Cambiar Contraseña</h3>
          <p className="security-subtitle">Actualiza tu contraseña periódicamente</p>
        </div>
      </div>

      {error && <div className="security-error">{error}</div>}
      {success && <div className="security-success">¡Contraseña actualizada correctamente!</div>}

      <form onSubmit={handleSubmit} className="security-form">
        <div className="form-group">
          <label>Contraseña actual</label>
          <div className="password-input-wrapper">
            <input
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Tu contraseña actual"
            />
            <button 
              type="button" 
              className="password-toggle"
              onClick={() => setShowPasswords(!showPasswords)}
            >
              {showPasswords ? <Icons.EyeOff /> : <Icons.Eye />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Nueva contraseña</label>
          <div className="password-input-wrapper">
            <input
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          {newPassword && (
            <div className="password-strength">
              <div className="strength-bar">
                <div 
                  className="strength-fill" 
                  style={{ 
                    width: `${(strength / 6) * 100}%`,
                    backgroundColor: strengthColors[strength]
                  }}
                />
              </div>
              <span style={{ color: strengthColors[strength] }}>{strengthLabels[strength]}</span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Confirmar nueva contraseña</label>
          <div className="password-input-wrapper">
            <input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
            />
            {confirmPassword && newPassword === confirmPassword && (
              <span className="password-match"><Icons.Check /></span>
            )}
          </div>
        </div>

        <div className="security-card-actions">
          <button 
            type="submit" 
            className="btn-security-primary"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          >
            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ==========================================================
// SECURITY STATS - Estadísticas de seguridad
// ==========================================================

export const SecurityStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const result = await securityService.getSecurityStats();
      if (result.success) {
        setStats(result.stats);
      }
      setLoading(false);
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="security-stats-card loading">
        <div className="security-loading">Cargando estadísticas...</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="security-stats-grid">
      <div className="stat-card">
        <div className="stat-icon"><Icons.Shield /></div>
        <div className="stat-content">
          <span className="stat-value">{stats.twoFactor?.enabled ? 'Activo' : 'Inactivo'}</span>
          <span className="stat-label">2FA</span>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon"><Icons.Monitor /></div>
        <div className="stat-content">
          <span className="stat-value">{(stats.sessions?.active || 0) + (stats.sessions?.rememberMe || 0)}</span>
          <span className="stat-label">Sesiones</span>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon"><Icons.Clock /></div>
        <div className="stat-content">
          <span className="stat-value">{stats.lastLogin ? securityService.formatRelativeTime(stats.lastLogin) : 'N/A'}</span>
          <span className="stat-label">Último acceso</span>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon"><Icons.Key /></div>
        <div className="stat-content">
          <span className="stat-value">{stats.twoFactor?.remainingBackupCodes || 0}</span>
          <span className="stat-label">Códigos respaldo</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================================
// SECURITY SETTINGS PAGE - Página completa de seguridad
// ==========================================================

export const SecuritySettingsPage = () => {
  return (
    <div className="security-settings-page">
      <header className="security-page-header">
        <div className="security-icon-large"><Icons.Shield /></div>
        <div>
          <h1>Seguridad de la Cuenta</h1>
          <p>Gestiona la seguridad de tu cuenta y sesiones activas</p>
        </div>
      </header>

      <SecurityStats />

      <div className="security-sections">
        <TwoFactorSetup />
        <ChangePassword />
        <SessionManager />
      </div>
    </div>
  );
};

export default SecuritySettingsPage;
