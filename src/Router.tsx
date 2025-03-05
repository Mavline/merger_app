import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import App from './App';
import VerticalMergePage from './pages/VerticalMergePage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';

// Navigation bar that will be shown on all pages
const Navigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="nav-container">
      <div className="nav-content">
        <Link 
          to="/" 
          className={`nav-link ${currentPath === '/' ? 'active' : ''}`}
        >
          HORIZONTAL MERGE
        </Link>
        <Link 
          to="/vertical-merge" 
          className={`nav-link ${currentPath === '/vertical-merge' ? 'active' : ''}`}
        >
          VERTICAL MERGE
        </Link>
        <Link 
          to="/about" 
          className={`nav-link ${currentPath === '/about' ? 'active' : ''}`}
        >
          ABOUT
        </Link>
      </div>
    </nav>
  );
};

// Reset button that will be shown on all pages
const ResetButton = () => (
  <div className="reset-container">
    <button
      onClick={() => window.location.reload()}
      className="reset-button"
    >
      RESET
    </button>
    <span className="reset-text">
      Start over, refresh process or clear memory
    </span>
  </div>
);

// Layout component to wrap all routes
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="router-container">
      <div className="star star1"></div>
      <div className="star star2"></div>
      <div className="star star3"></div>
      <div className="star star4"></div>
      <div className="star star5"></div>
      <div className="star star1" style={{ top: '5%', left: '15%' }}></div>
      <div className="star star2" style={{ top: '8%', left: '25%' }}></div>
      <div className="star star3" style={{ top: '12%', left: '35%' }}></div>
      <div className="star star4" style={{ top: '18%', left: '45%' }}></div>
      <div className="star star5" style={{ top: '22%', left: '55%' }}></div>
      <div className="star star1" style={{ top: '28%', left: '65%' }}></div>
      <div className="star star2" style={{ top: '32%', left: '75%' }}></div>
      <div className="star star3" style={{ top: '38%', left: '85%' }}></div>
      <div className="star star4" style={{ top: '42%', left: '5%' }}></div>
      <div className="star star5" style={{ top: '48%', left: '15%' }}></div>
      <div className="star star1" style={{ top: '52%', left: '25%' }}></div>
      <div className="star star2" style={{ top: '58%', left: '35%' }}></div>
      <div className="star star3" style={{ top: '62%', left: '45%' }}></div>
      <div className="star star4" style={{ top: '68%', left: '55%' }}></div>
      <div className="star star5" style={{ top: '72%', left: '65%' }}></div>
      <div className="star star1" style={{ top: '78%', left: '75%' }}></div>
      <div className="star star2" style={{ top: '82%', left: '85%' }}></div>
      <div className="star star3" style={{ top: '88%', left: '5%' }}></div>
      <div className="star star4" style={{ top: '92%', left: '15%' }}></div>
      <div className="star star5" style={{ top: '95%', left: '25%' }}></div>
      <div className="star star1" style={{ top: '15%', left: '80%' }}></div>
      <div className="star star2" style={{ top: '25%', left: '20%' }}></div>
      <div className="star star3" style={{ top: '35%', left: '40%' }}></div>
      <div className="star star4" style={{ top: '45%', left: '60%' }}></div>
      <div className="star star5" style={{ top: '55%', left: '80%' }}></div>
      <Navigation />
      <ResetButton />
      {children}
    </div>
  );
};

// Main router component
const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <Layout>
            <App customNavigation={<></>} />
          </Layout>
        } />
        <Route path="/vertical-merge" element={
          <Layout>
            <VerticalMergePage />
          </Layout>
        } />
        <Route path="/about" element={
          <Layout>
            <AboutPage />
          </Layout>
        } />
        <Route path="*" element={
          <Layout>
            <NotFoundPage />
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;