import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationToast } from './components/common/NotificationToast';
import { Loading } from './components/common/Loading';
import './styles/globals.css';
import './styles/dark-theme.css';
import './styles/responsive.css';
import './styles/dashboardpro-final.css';
import './App.css';

// Lazy load componentes grandes
const LandingPage = lazy(() => import('./components/LandingPage'));
const LoginCliente = lazy(() => import('./components/LoginCliente'));
const LoginPro = lazy(() => import('./components/LoginPro'));
const DashboardCliente = lazy(() => import('./components/DashboardCliente'));
const DashboardPro = lazy(() => import('./components/DashboardPro'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const CheckoutPage = lazy(() => import('./components/CheckoutPage'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const RegistrationChoice = lazy(() => import('./components/RegistrationChoice'));
const RegisterClientForm = lazy(() => import('./components/RegisterClientForm'));
const RegisterBusinessForm = lazy(() => import('./components/RegisterBusinessForm'));
const TrialExpired = lazy(() => import('./components/TrialExpired'));
const TrialBanner = lazy(() => import('./components/TrialBanner'));

// Legal Pages
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const CookiesPage = lazy(() => import('./pages/CookiesPage'));
const CookieBanner = lazy(() => import('./components/CookieBanner'));

// Public Pages
const SalonesPublicos = lazy(() => import('./pages/SalonesPublicos'));
const SalonPublico = lazy(() => import('./pages/SalonPublico'));
const MisReservas = lazy(() => import('./pages/MisReservas'));
const ClientHub = lazy(() => import('./components/ClientHub'));
const SalonProfileSetup = lazy(() => import('./components/SalonProfileSetup'));

/**
 * Componente fallback mientras se carga
 * @returns {React.ReactElement}
 */
const LoadingFallback = () => <Loading text="Cargando..." />;

function AppContent() {
  const { usuario, cargando, isAuthenticated, logout } = useAuth();
  const [trialStatus, setTrialStatus] = useState(null);
  const [checkingTrial, setCheckingTrial] = useState(false);

  // Verificar estado del trial cuando el usuario está autenticado
  useEffect(() => {
    const checkTrialStatus = async () => {
      if (!isAuthenticated) {
        setTrialStatus(null);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) return;

      setCheckingTrial(true);
      try {
        const response = await fetch('http://localhost:3001/api/trial/status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTrialStatus(data);
        }
      } catch (error) {
        console.log('Error verificando trial:', error);
      } finally {
        setCheckingTrial(false);
      }
    };

    checkTrialStatus();
  }, [isAuthenticated]);

  if (cargando || checkingTrial) {
    return <Loading text="Cargando aplicación..." />;
  }

  // Si el trial expiró, mostrar pantalla de upgrade
  const tenant = trialStatus?.tenant || JSON.parse(localStorage.getItem('tenant') || 'null');
  if (isAuthenticated && trialStatus?.trialExpired) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={
            <Suspense fallback={<LoadingFallback />}>
              <TrialExpired tenant={tenant} onLogout={logout} />
            </Suspense>
          } />
          <Route path="/checkout/:planId" element={
            <Suspense fallback={<LoadingFallback />}>
              <CheckoutPage />
            </Suspense>
          } />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      {/* Banner de trial si está activo */}
      {isAuthenticated && trialStatus?.trialActive && (
        <Suspense fallback={null}>
          <TrialBanner 
            diasRestantes={trialStatus.diasRestantes} 
            tenantName={tenant?.nombre}
          />
        </Suspense>
      )}
      <Routes>
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard/cliente" replace /> : (
            <Suspense fallback={<LoadingFallback />}>
              <LandingPage />
            </Suspense>
          )} 
        />
        
        {/* Legacy Login routes redirigen a logins específicos */}
        <Route 
          path="/role-select" 
          element={isAuthenticated ? <Navigate to="/dashboard/cliente" replace /> : (
            <Navigate to="/login-cliente" replace />
          )} 
        />
        
        {/* Legacy Login (mantenido por compatibilidad) */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard/cliente" replace /> : (
            <Navigate to="/login-cliente" replace />
          )} 
        />
        
        {/* Logins específicos por rol */}
        <Route 
          path="/login-cliente" 
          element={isAuthenticated ? <Navigate to="/dashboard/cliente" replace /> : (
            <Suspense fallback={<LoadingFallback />}>
              <LoginCliente />
            </Suspense>
          )} 
        />
        
        <Route 
          path="/login-profesional" 
          element={isAuthenticated ? <Navigate to="/dashboard/profesional" replace /> : (
            <Suspense fallback={<LoadingFallback />}>
              <LoginPro />
            </Suspense>
          )} 
        />
        
        {/* Legacy LoginPro */}
        <Route 
          path="/login-pro" 
          element={isAuthenticated ? <Navigate to="/dashboard/profesional" replace /> : (
            <Suspense fallback={<LoadingFallback />}>
              <LoginPro />
            </Suspense>
          )} 
        />
        
        {/* Registration */}
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/dashboard/cliente" replace /> : (
            <Suspense fallback={<LoadingFallback />}>
              <RegistrationChoice />
            </Suspense>
          )} 
        />
        
        <Route 
          path="/register-client" 
          element={isAuthenticated ? <Navigate to="/dashboard/cliente" replace /> : (
            <Suspense fallback={<LoadingFallback />}>
              <RegisterClientForm />
            </Suspense>
          )} 
        />
        
        <Route 
          path="/register-business" 
          element={isAuthenticated ? <Navigate to="/dashboard/profesional" replace /> : (
            <Suspense fallback={<LoadingFallback />}>
              <RegisterBusinessForm />
            </Suspense>
          )} 
        />
        
        <Route 
          path="/checkout/:planId" 
          element={<Suspense fallback={<LoadingFallback />}><CheckoutPage /></Suspense>} 
        />
        
        <Route 
          path="/forgot-password" 
          element={<Suspense fallback={<LoadingFallback />}><ForgotPassword /></Suspense>} 
        />
        
        {/* Legal Pages */}
        <Route 
          path="/terms" 
          element={<Suspense fallback={<LoadingFallback />}><TermsPage /></Suspense>} 
        />
        <Route 
          path="/privacy" 
          element={<Suspense fallback={<LoadingFallback />}><PrivacyPage /></Suspense>} 
        />
        <Route 
          path="/cookies" 
          element={<Suspense fallback={<LoadingFallback />}><CookiesPage /></Suspense>} 
        />
        
        {/* Public Marketplace */}
        <Route 
          path="/marketplace" 
          element={<Suspense fallback={<LoadingFallback />}><SalonesPublicos /></Suspense>} 
        />
        <Route 
          path="/buscar" 
          element={<Suspense fallback={<LoadingFallback />}><ClientHub /></Suspense>} 
        />
        <Route 
          path="/salon-setup" 
          element={isAuthenticated ? (
            <Suspense fallback={<LoadingFallback />}>
              <SalonProfileSetup />
            </Suspense>
          ) : <Navigate to="/" replace />} 
        />
        <Route 
          path="/salones" 
          element={<Suspense fallback={<LoadingFallback />}><SalonesPublicos /></Suspense>} 
        />
        <Route 
          path="/salon/:id" 
          element={<Suspense fallback={<LoadingFallback />}><SalonPublico /></Suspense>} 
        />
        <Route 
          path="/mis-reservas" 
          element={<Suspense fallback={<LoadingFallback />}><MisReservas /></Suspense>} 
        />
        
        {/* Dashboards específicos por rol */}
        <Route 
          path="/dashboard/cliente" 
          element={isAuthenticated ? (
            <Suspense fallback={<LoadingFallback />}>
              <DashboardCliente usuario={usuario} onLogout={logout} />
            </Suspense>
          ) : <Navigate to="/login-cliente" replace />} 
        />
        
        <Route 
          path="/dashboard/profesional" 
          element={isAuthenticated ? (
            <Suspense fallback={<LoadingFallback />}>
              <DashboardPro usuario={usuario} onLogout={logout} />
            </Suspense>
          ) : <Navigate to="/login-profesional" replace />} 
        />

        {/* Admin Dashboard - ACCESO EXCLUSIVO PARA ADMINISTRADOR */}
        <Route 
          path="/admin/dashboard" 
          element={isAuthenticated && usuario?.rol === 'administrador' ? (
            <Suspense fallback={<LoadingFallback />}>
              <AdminDashboard />
            </Suspense>
          ) : isAuthenticated ? <Navigate to="/dashboard/cliente" replace /> : <Navigate to="/login" replace />} 
        />
        
        {/* Legacy Dashboard (redirige según tipoUsuario) */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? (
            (() => {
              const tipoUsuario = localStorage.getItem('tipoUsuario');
              if (tipoUsuario === 'cliente') {
                return <Navigate to="/dashboard/cliente" replace />;
              } else if (tipoUsuario === 'profesional') {
                return <Navigate to="/dashboard/profesional" replace />;
              }
              return <Navigate to="/role-select" replace />;
            })()
          ) : <Navigate to="/login" replace />} 
        />
      </Routes>
      
      {/* Cookie Banner */}
      <Suspense fallback={null}>
        <CookieBanner />
      </Suspense>
    </Router>
  );
}

/**
 * Componente raíz de la aplicación
 * Envuelve todos los proveedores necesarios
 * @returns {React.ReactElement}
 */
function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <NotificationToast />
          <AppContent />
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
