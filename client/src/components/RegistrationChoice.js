import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegistrationChoice.css';

const RegistrationChoice = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleClientClick = () => {
    navigate('/register-client', { 
      state: { userType: 'cliente' } 
    });
  };

  const handleBusinessClick = () => {
    navigate('/register-business', { 
      state: { userType: 'empresa' } 
    });
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="registration-choice-container">
      <div className="registration-choice-content">
        <div className="registration-choice-header">
          <h1>¿Quién Eres?</h1>
          <p>Selecciona el tipo de cuenta que deseas crear</p>
        </div>

        <div className="registration-choice-cards">
          <div 
            className={`choice-card ${hoveredCard === 'cliente' ? 'hovered' : ''}`}
            onMouseEnter={() => setHoveredCard('cliente')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={handleClientClick}
          >
            <div className="choice-card-icon client-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h2>Soy Cliente</h2>
            <p className="choice-subtitle">Busca y reserva en salones</p>
            <div className="choice-benefits">
              <div className="benefit">✓ Busca salones cerca de ti</div>
              <div className="benefit">✓ Reserva citas online</div>
              <div className="benefit">✓ Gestiona tus reservas</div>
              <div className="benefit">✓ Recibe notificaciones</div>
            </div>
            <button className="choice-btn client-btn">
              Registrarme como Cliente
            </button>
          </div>

          <div className="choice-divider">o</div>

          <div 
            className={`choice-card ${hoveredCard === 'empresa' ? 'hovered' : ''}`}
            onMouseEnter={() => setHoveredCard('empresa')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={handleBusinessClick}
          >
            <div className="choice-card-icon business-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 21H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2z"></path>
                <path d="M2 9h20"></path>
                <path d="M6 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2"></path>
                <path d="M9 13h6"></path>
                <path d="M9 17h6"></path>
              </svg>
            </div>
            <h2>Soy Profesional</h2>
            <p className="choice-subtitle">Gestiona tu negocio</p>
            <div className="choice-benefits">
              <div className="benefit">✓ Crea tu perfil de negocio</div>
              <div className="benefit">✓ Gestiona tu POS</div>
              <div className="benefit">✓ Administra citas y reservas</div>
              <div className="benefit">✓ Acceso a reportes y analytics</div>
            </div>
            <button className="choice-btn business-btn">
              Registrarme como Profesional
            </button>
          </div>
        </div>

        <div className="registration-choice-footer">
          <p>¿Ya tienes cuenta? <button className="link-btn" onClick={handleBackToLogin}>Inicia sesión aquí</button></p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationChoice;
