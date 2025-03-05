import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Страница не найдена</h2>
        <p>Маршрут <code>{location.pathname}</code> не существует в приложении.</p>
        
        <div className="not-found-actions">
          <button 
            className="back-button"
            onClick={() => navigate(-1)}
          >
            Вернуться назад
          </button>
          <button 
            className="home-button"
            onClick={() => navigate('/')}
          >
            На главную
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 