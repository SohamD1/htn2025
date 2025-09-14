import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProductSelection.css';

const ProductSelection: React.FC = () => {
  const navigate = useNavigate();

  const handleInvestEaseClick = () => {
    navigate('/dashboard');
  };

  const handleInvestIQClick = () => {
    // TODO: Navigate to InvestIQ page when implemented
    console.log('InvestIQ clicked - feature coming soon');
  };

  return (
    <div className="product-selection-container">
      <div className="product-selection-header">
        <div className="rbc-logo">
          <div className="logo-text">RBC</div>
        </div>
        <h1>Choose Your Product</h1>
        <p className="tagline">Select the investment solution that fits your needs</p>
      </div>

      <div className="product-cards">
        <div className="product-card" onClick={handleInvestEaseClick}>
          <h2>RBC InvestEase</h2>
          <div className="product-icon">📊</div>
          <p className="product-description">
            Student portfolio management with cash tracking, risk simulation, and portfolio optimization tools.
          </p>
          <button className="product-button">Get Started</button>
        </div>

        <div className="product-card" onClick={handleInvestIQClick}>
          <h2>RBC InvestIQ</h2>
          <div className="product-icon">🎯</div>
          <p className="product-description">
            Advanced investment intelligence platform with AI-powered insights and market analysis.
          </p>
          <button className="product-button coming-soon">Coming Soon</button>
        </div>
      </div>
    </div>
  );
};

export default ProductSelection;