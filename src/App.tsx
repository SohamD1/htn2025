import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PortfolioManager from './pages/PortfolioManager';
import CashManagement from './pages/CashManagement';
import Simulation from './pages/Simulation';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/portfolios"
              element={
                <PrivateRoute>
                  <PortfolioManager />
                </PrivateRoute>
              }
            />
            <Route
              path="/cash"
              element={
                <PrivateRoute>
                  <CashManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/simulation"
              element={
                <PrivateRoute>
                  <Simulation />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;