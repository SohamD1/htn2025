import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Portfolio } from '../services/rbc-service';
import rbcAPI from '../services/rbc-service';
import Navigation from '../components/Navigation';
import PortfolioCard from '../components/PortfolioCard';
import ClientSelector from '../components/ClientSelector';
import PortfolioChart from '../components/PortfolioChart';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const { currentClient } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentClient) {
      loadPortfolios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentClient]);

  const loadPortfolios = async () => {
    if (!currentClient) return;

    setLoading(true);
    try {
      const portfolioList = await rbcAPI.getClientPortfolios(currentClient.id);
      setPortfolios(portfolioList);

      const totalVal = portfolioList.reduce((sum, p) => sum + p.current_value, 0);
      const totalInv = portfolioList.reduce((sum, p) => sum + p.invested_amount, 0);

      setTotalValue(totalVal);
      setTotalInvested(totalInv);
    } catch (error) {
      console.error('Failed to load portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReturnPercentage = () => {
    if (totalInvested === 0) return 0;
    return ((totalValue - totalInvested) / totalInvested * 100).toFixed(2);
  };

  const getPortfolioDistribution = () => {
    return portfolios.map(p => ({
      name: p.type.replace('_', ' ').toUpperCase(),
      value: p.current_value,
      percentage: totalValue > 0 ? (p.current_value / totalValue * 100).toFixed(1) : '0'
    }));
  };

  if (!currentClient) {
    return (
      <div className="dashboard">
        <Navigation />
        <div className="dashboard-content">
          <div className="no-client-message">
            <h2>Welcome to InvestEase</h2>
            <p>Please create a client to get started</p>
            <button
              className="create-client-btn"
              onClick={() => navigate('/cash')}
            >
              Create Your First Client
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Navigation />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Portfolio Dashboard</h1>
          <ClientSelector />
        </div>

        <div className="overview-cards">
          <div className="overview-card">
            <h3>Total Portfolio Value</h3>
            <p className="value">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <span className={`change ${Number(getReturnPercentage()) >= 0 ? 'positive' : 'negative'}`}>
              {Number(getReturnPercentage()) >= 0 ? '+' : ''}{getReturnPercentage()}%
            </span>
          </div>

          <div className="overview-card">
            <h3>Total Invested</h3>
            <p className="value">${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>

          <div className="overview-card">
            <h3>Available Cash</h3>
            <p className="value">${currentClient.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>

          <div className="overview-card">
            <h3>Total Return</h3>
            <p className={`value ${totalValue - totalInvested >= 0 ? 'positive' : 'negative'}`}>
              ${(totalValue - totalInvested).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {portfolios.length > 0 && (
          <div className="portfolio-chart-section">
            <h2>Portfolio Distribution</h2>
            <PortfolioChart data={getPortfolioDistribution()} />
          </div>
        )}

        <div className="portfolios-section">
          <div className="section-header">
            <h2>Your Portfolios</h2>
            <button
              className="add-portfolio-btn"
              onClick={() => navigate('/portfolios')}
            >
              + Add Portfolio
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading portfolios...</div>
          ) : portfolios.length === 0 ? (
            <div className="no-portfolios">
              <p>You don't have any portfolios yet</p>
              <button
                className="create-portfolio-btn"
                onClick={() => navigate('/portfolios')}
              >
                Create Your First Portfolio
              </button>
            </div>
          ) : (
            <div className="portfolio-grid">
              {portfolios.map(portfolio => (
                <PortfolioCard
                  key={portfolio.id}
                  portfolio={portfolio}
                  onRefresh={loadPortfolios}
                />
              ))}
            </div>
          )}
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button
              className="action-btn deposit"
              onClick={() => navigate('/cash')}
            >
              Deposit Cash
            </button>
            <button
              className="action-btn simulate"
              onClick={() => navigate('/simulation')}
            >
              Run Simulation
            </button>
            <button
              className="action-btn manage"
              onClick={() => navigate('/portfolios')}
            >
              Manage Portfolios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;