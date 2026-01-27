/**
 * Cookie Consent Banner - RGPD/LOPD Compliant
 * NEURIAX Salon Manager
 * 
 * Cumple con:
 * - Reglamento (UE) 2016/679 (RGPD)
 * - Ley Orgánica 3/2018 (LOPDGDD)
 * - Ley 34/2002 (LSSI-CE)
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CookieBanner.css';

const COOKIE_CONSENT_KEY = 'neuriax_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'neuriax_cookie_preferences';

// Configuración de cookies por categoría
const COOKIE_CATEGORIES = {
  necessary: {
    id: 'necessary',
    name: 'Cookies Necesarias',
    description: 'Esenciales para el funcionamiento del sitio. No se pueden desactivar.',
    required: true,
    cookies: [
      { name: 'session_id', purpose: 'Mantener la sesión del usuario', expiry: 'Sesión' },
      { name: 'accessToken', purpose: 'Autenticación JWT', expiry: '7 días' },
      { name: 'XSRF-TOKEN', purpose: 'Protección contra CSRF', expiry: 'Sesión' }
    ]
  },
  functional: {
    id: 'functional',
    name: 'Cookies Funcionales',
    description: 'Permiten recordar tus preferencias y personalizar tu experiencia.',
    required: false,
    cookies: [
      { name: 'theme', purpose: 'Preferencia de tema (claro/oscuro)', expiry: '1 año' },
      { name: 'language', purpose: 'Idioma preferido', expiry: '1 año' },
      { name: 'sidebar_state', purpose: 'Estado del menú lateral', expiry: '30 días' }
    ]
  },
  analytics: {
    id: 'analytics',
    name: 'Cookies Analíticas',
    description: 'Nos ayudan a entender cómo usas el sitio para mejorarlo.',
    required: false,
    cookies: [
      { name: '_ga', purpose: 'Google Analytics - Identificador único', expiry: '2 años' },
      { name: '_gid', purpose: 'Google Analytics - Sesión', expiry: '24 horas' },
      { name: '_gat', purpose: 'Google Analytics - Limitar peticiones', expiry: '1 minuto' }
    ]
  },
  marketing: {
    id: 'marketing',
    name: 'Cookies de Marketing',
    description: 'Utilizadas para mostrarte anuncios relevantes.',
    required: false,
    cookies: [
      { name: '_fbp', purpose: 'Facebook Pixel', expiry: '3 meses' },
      { name: 'ads_prefs', purpose: 'Preferencias de anuncios', expiry: '1 año' }
    ]
  }
};

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false
  });
  const [expandedCategory, setExpandedCategory] = useState(null);

  useEffect(() => {
    // Verificar si ya existe consentimiento
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Mostrar banner después de un pequeño delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Cargar preferencias guardadas
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    }
  }, []);

  const saveConsent = (prefs) => {
    const consentData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      preferences: prefs
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    
    // Disparar evento para que otros componentes puedan reaccionar
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { 
      detail: prefs 
    }));
    
    setIsVisible(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    setPreferences(allAccepted);
    saveConsent(allAccepted);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    setPreferences(onlyNecessary);
    saveConsent(onlyNecessary);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const toggleCategory = (categoryId) => {
    if (categoryId === 'necessary') return; // No se puede desactivar
    setPreferences(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const toggleExpand = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay oscuro */}
      <div className="cookie-overlay" onClick={() => {}} />
      
      {/* Banner principal */}
      <div className={`cookie-banner ${showPreferences ? 'expanded' : ''}`}>
        {!showPreferences ? (
          // Vista inicial del banner
          <div className="cookie-banner-main">
            <div className="cookie-icon">🍪</div>
            
            <div className="cookie-content">
              <h3>Utilizamos cookies</h3>
              <p>
                Usamos cookies propias y de terceros para mejorar tu experiencia, 
                analizar el tráfico y personalizar contenido. Puedes aceptar todas, 
                rechazar las opcionales, o configurar tus preferencias.
              </p>
              <div className="cookie-links">
                <Link to="/privacy">Política de Privacidad</Link>
                <span>•</span>
                <Link to="/cookies">Política de Cookies</Link>
              </div>
            </div>

            <div className="cookie-actions">
              <button 
                className="cookie-btn cookie-btn-secondary"
                onClick={handleRejectAll}
              >
                Rechazar opcionales
              </button>
              <button 
                className="cookie-btn cookie-btn-outline"
                onClick={() => setShowPreferences(true)}
              >
                Configurar
              </button>
              <button 
                className="cookie-btn cookie-btn-primary"
                onClick={handleAcceptAll}
              >
                Aceptar todas
              </button>
            </div>
          </div>
        ) : (
          // Vista de preferencias
          <div className="cookie-preferences">
            <div className="cookie-preferences-header">
              <button 
                className="cookie-back-btn"
                onClick={() => setShowPreferences(false)}
              >
                ← Volver
              </button>
              <h3>Configurar preferencias de cookies</h3>
              <p>
                Selecciona qué categorías de cookies deseas permitir. 
                Las cookies necesarias no se pueden desactivar.
              </p>
            </div>

            <div className="cookie-categories">
              {Object.values(COOKIE_CATEGORIES).map(category => (
                <div 
                  key={category.id} 
                  className={`cookie-category ${preferences[category.id] ? 'active' : ''}`}
                >
                  <div className="cookie-category-header">
                    <div className="cookie-category-info">
                      <div className="cookie-category-toggle">
                        <label className="cookie-switch">
                          <input
                            type="checkbox"
                            checked={preferences[category.id]}
                            onChange={() => toggleCategory(category.id)}
                            disabled={category.required}
                          />
                          <span className="cookie-slider"></span>
                        </label>
                      </div>
                      <div className="cookie-category-text">
                        <h4>
                          {category.name}
                          {category.required && (
                            <span className="cookie-required-badge">Requeridas</span>
                          )}
                        </h4>
                        <p>{category.description}</p>
                      </div>
                    </div>
                    <button 
                      className="cookie-expand-btn"
                      onClick={() => toggleExpand(category.id)}
                    >
                      {expandedCategory === category.id ? '▲' : '▼'}
                    </button>
                  </div>

                  {expandedCategory === category.id && (
                    <div className="cookie-category-details">
                      <table className="cookie-table">
                        <thead>
                          <tr>
                            <th>Cookie</th>
                            <th>Propósito</th>
                            <th>Expiración</th>
                          </tr>
                        </thead>
                        <tbody>
                          {category.cookies.map((cookie, idx) => (
                            <tr key={idx}>
                              <td><code>{cookie.name}</code></td>
                              <td>{cookie.purpose}</td>
                              <td>{cookie.expiry}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="cookie-preferences-footer">
              <button 
                className="cookie-btn cookie-btn-secondary"
                onClick={handleRejectAll}
              >
                Rechazar opcionales
              </button>
              <button 
                className="cookie-btn cookie-btn-primary"
                onClick={handleSavePreferences}
              >
                Guardar preferencias
              </button>
            </div>
          </div>
        )}

        {/* Información legal */}
        <div className="cookie-legal-info">
          <p>
            <strong>NEURIAX Technologies S.L.</strong> • CIF: B12345678 • 
            Cumplimos con RGPD (UE) 2016/679 y LOPDGDD 3/2018
          </p>
        </div>
      </div>
    </>
  );
}

// Hook para verificar consentimiento de cookies
export function useCookieConsent() {
  const [consent, setConsent] = useState(null);

  useEffect(() => {
    const loadConsent = () => {
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPrefs) {
        setConsent(JSON.parse(savedPrefs));
      }
    };

    loadConsent();

    // Escuchar cambios
    const handleChange = (e) => setConsent(e.detail);
    window.addEventListener('cookieConsentChanged', handleChange);
    
    return () => window.removeEventListener('cookieConsentChanged', handleChange);
  }, []);

  return {
    hasConsent: consent !== null,
    consent,
    allowsAnalytics: consent?.analytics || false,
    allowsMarketing: consent?.marketing || false,
    allowsFunctional: consent?.functional || false
  };
}

// Componente para reabrir configuración de cookies
export function CookieSettingsButton({ className }) {
  const reopenSettings = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    window.location.reload();
  };

  return (
    <button 
      className={className || 'cookie-settings-link'}
      onClick={reopenSettings}
    >
      🍪 Configurar Cookies
    </button>
  );
}
