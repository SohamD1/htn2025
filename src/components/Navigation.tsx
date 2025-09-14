import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Navigation.css';

const Navigation: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <div className="rbc-logo-small">RBC</div>
        <span className="brand-text">InvestEase</span>
      </div>

      <div className="nav-links">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Dashboard
        </NavLink>
        <NavLink to="/portfolios" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Portfolios
        </NavLink>
        <NavLink to="/cash" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Cash Management
        </NavLink>
        <NavLink to="/simulation" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Simulation
        </NavLink>
        <NavLink to="/playground" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Playground
        </NavLink>
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </nav>
  );
};

export default Navigation;