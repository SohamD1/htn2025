import React, { useState } from 'react';
import { Portfolio } from '../services/rbc-service';
import rbcAPI from '../services/rbc-service';
import '../styles/PortfolioCard.css';

interface PortfolioCardProps {
  portfolio: Portfolio;
  onRefresh: () => void;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ portfolio, onRefresh }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const getStrategyColor = (type: string) => {
    switch (type) {
      case 'aggressive_growth': return '#FF6B6B';
      case 'growth': return '#4ECDC4';
      case 'balanced': return '#45B7D1';
      case 'conservative': return '#96CEB4';
      case 'very_conservative': return '#88D8B0';
      default: return '#6C757D';
    }
  };

  const formatStrategy = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getReturnPercentage = () => {
    if (portfolio.invested_amount === 0) return 0;
    return ((portfolio.current_value - portfolio.invested_amount) / portfolio.invested_amount * 100).toFixed(2);
  };

  const loadAnalysis = async () => {
    if (analysis || loadingAnalysis) return;

    setLoadingAnalysis(true);
    try {
      const result = await rbcAPI.getPortfolioAnalysis(portfolio.id);
      setAnalysis(result);
    } catch (error) {
      console.error('Failed to load analysis:', error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleToggleDetails = () => {
    setShowDetails(!showDetails);
    if (!showDetails && !analysis) {
      loadAnalysis();
    }
  };

  return (
    <div className="portfolio-card">
      <div className="portfolio-header">
        <div
          className="strategy-badge"
          style={{ backgroundColor: getStrategyColor(portfolio.type) }}
        >
          {formatStrategy(portfolio.type)}
        </div>
        <button
          className="details-toggle"
          onClick={handleToggleDetails}
        >
          {showDetails ? 'Hide' : 'View'} Details
        </button>
      </div>

      <div className="portfolio-values">
        <div className="value-item">
          <span className="label">Current Value</span>
          <span className="value">
            ${portfolio.current_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="value-item">
          <span className="label">Invested</span>
          <span className="value">
            ${portfolio.invested_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="value-item">
          <span className="label">Return</span>
          <span className={`value ${Number(getReturnPercentage()) >= 0 ? 'positive' : 'negative'}`}>
            {Number(getReturnPercentage()) >= 0 ? '+' : ''}{getReturnPercentage()}%
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="portfolio-details">
          <div className="detail-section">
            <h4>Portfolio Information</h4>
            <p>Created: {new Date(portfolio.created_at).toLocaleDateString()}</p>
            <p>Months Simulated: {portfolio.total_months_simulated}</p>
          </div>

          {loadingAnalysis && <div className="loading">Loading analysis...</div>}

          {analysis && (
            <div className="detail-section">
              <h4>Performance Analysis</h4>
              <div className="analysis-grid">
                {Object.entries(analysis.trailingReturns || {}).map(([period, value]) => (
                  <div key={period} className="analysis-item">
                    <span className="period">{period}</span>
                    <span className="return-value">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {portfolio.transactions && portfolio.transactions.length > 0 && (
            <div className="detail-section">
              <h4>Recent Transactions</h4>
              <div className="transactions-list">
                {portfolio.transactions.slice(-3).reverse().map(tx => (
                  <div key={tx.id} className="transaction-item">
                    <span className={`tx-type ${tx.type}`}>{tx.type}</span>
                    <span className="tx-amount">
                      ${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="tx-date">
                      {new Date(tx.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PortfolioCard;