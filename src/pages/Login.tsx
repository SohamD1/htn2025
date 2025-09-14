import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/auth-service';
import rbcAPI from '../services/rbc-service';
import '../styles/Login.css';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    user_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    money: 10000
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();

  // Initialize auth service on component mount
  useEffect(() => {
    const initAuthService = async () => {
      try {
        await authService.initialize();
      } catch (error) {
        console.error('Failed to initialize auth service:', error);
      }
    };
    initAuthService();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'money' ? Number(value) : value
    }));
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
<<<<<<< HEAD
      const response = await authService.loginUser({
        email: formData.email,
        password: formData.password
      });

      if (response.success && response.user && response.token) {
        // Store token in localStorage
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
        
        // For existing users, we need to re-register the team to get RBC token
        // This is needed because RBC tokens don't persist between sessions
        try {
          await rbcAPI.registerTeam({
            team_name: `${response.user.user_name}'s Investment Team`,
            contact_email: response.user.email
          });
          console.log('RBC team token refreshed for existing user');
        } catch (rbcError) {
          console.warn('Failed to refresh RBC token:', rbcError);
        }
        
        // Set authentication state
        setAuthenticatedUser(response.user);
        
        setSuccess('Login successful!');
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        setError(response.message);
      }
=======
      await login(teamName, email);
      navigate('/product-selection');
>>>>>>> refs/remotes/origin/main
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    // Validate money amount
    if (formData.money < 100) {
      setError('Initial money amount must be at least $100');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.registerUser({
        user_name: formData.user_name,
        email: formData.email,
        password: formData.password,
        money: formData.money
      });

      if (response.success && response.user && response.token) {
        // Store token in localStorage
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
        
        // Set authentication state
        setAuthenticatedUser(response.user);
        
        setSuccess('Account created successfully!');
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({
      user_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      money: 10000
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="rbc-logo">
            <div className="logo-text">RBC</div>
          </div>
          <h1>InvestEase</h1>
          <p className="tagline">Student Finance Manager</p>
        </div>

        <div className="auth-toggle">
          <button 
            type="button"
            className={`toggle-btn ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            type="button"
            className={`toggle-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        {isLogin ? (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="user_name">Full Name</label>
              <input
                type="text"
                id="user_name"
                name="user_name"
                value={formData.user_name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password (min 6 characters)"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="money">Initial Money Amount ($)</label>
              <input
                type="number"
                id="money"
                name="money"
                value={formData.money}
                onChange={handleInputChange}
                placeholder="10000"
                min="100"
                max="1000000"
                step="100"
                required
                disabled={loading}
              />
              <small className="form-hint">Default: $10,000 (minimum: $100)</small>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div className="login-footer">
          <p>Secure student portfolio management</p>
          <button type="button" className="toggle-link" onClick={toggleMode}>
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;