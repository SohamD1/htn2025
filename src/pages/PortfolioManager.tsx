import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Portfolio, PortfolioCreate } from '../services/rbc-service';
import rbcAPI from '../services/rbc-service';
import Navigation from '../components/Navigation';
import '../styles/PortfolioManager.css';

const PortfolioManager: React.FC = () => {
  const { currentClient, refreshClients } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const portfolioTypes = [
    { value: 'aggressive_growth', label: 'Aggressive Growth', description: 'High risk, high reward strategy' },
    { value: 'growth', label: 'Growth', description: 'Moderate-high risk with growth focus' },
    { value: 'balanced', label: 'Balanced', description: 'Balanced risk and reward' },
    { value: 'conservative', label: 'Conservative', description: 'Lower risk, steady returns' },
    { value: 'very_conservative', label: 'Very Conservative', description: 'Minimal risk, capital preservation' }
  ];

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
      console.log('Loading portfolios for client:', currentClient.id);
      const data = await rbcAPI.getClientPortfolios(currentClient.id);
      console.log('Loaded portfolios in PortfolioManager:', data);
      setPortfolios(data);
    } catch (error) {
      console.error('Failed to load portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async (type: string, amount: number) => {
    if (!currentClient) return;

    setLoading(true);
    setMessage('');
    try {
      console.log('Creating portfolio for client:', currentClient);
      const result = await rbcAPI.createPortfolio(currentClient.id, {
        type: type as PortfolioCreate['type'],
        initialAmount: amount
      });
      console.log('Portfolio created:', result);
      
      setMessage('Portfolio created successfully!');
      setShowCreateModal(false);
      
      // Refresh client data first to get updated cash amount
      await refreshClients();
      // Then reload portfolios to show the new portfolio
      await loadPortfolios();
    } catch (error: any) {
      console.error('Portfolio creation error:', error);
      setMessage(error.message || 'Failed to create portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedPortfolio || !transferAmount) return;

    setLoading(true);
    setMessage('');
    try {
      const result = await rbcAPI.transferToPortfolio(
        selectedPortfolio.id,
        parseFloat(transferAmount)
      );
      setMessage(result.message);
      setTransferAmount('');
      loadPortfolios();
      refreshClients();
    } catch (error: any) {
      setMessage(error.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!selectedPortfolio || !withdrawAmount) return;

    setLoading(true);
    setMessage('');
    try {
      const result = await rbcAPI.withdrawFromPortfolio(
        selectedPortfolio.id,
        parseFloat(withdrawAmount)
      );
      setMessage(result.message);
      setWithdrawAmount('');
      loadPortfolios();
      refreshClients();
    } catch (error: any) {
      setMessage(error.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portfolio-manager">
      <Navigation />
      <div className="manager-content">
        <div className="manager-header">
          <h1>Portfolio Management</h1>
          <button
            className="create-btn"
            onClick={() => setShowCreateModal(true)}
            disabled={!currentClient}
          >
            + Create New Portfolio
          </button>
        </div>

        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {!currentClient ? (
          <div className="no-client">
            <p>Please create a client first to manage portfolios</p>
          </div>
        ) : (
          <>
            <div className="portfolios-list">
              <h2>Your Portfolios</h2>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : portfolios.length === 0 ? (
                <div className="no-portfolios">No portfolios yet. Create one to get started!</div>
              ) : (
                <div className="portfolio-items">
                  {portfolios.map(portfolio => (
                    <div
                      key={portfolio.id}
                      className={`portfolio-item ${selectedPortfolio?.id === portfolio.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPortfolio(portfolio)}
                    >
                      <div className="portfolio-info">
                        <h3>{portfolio.type.replace('_', ' ').toUpperCase()}</h3>
                        <p>Current Value: ${portfolio.current_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        <p>Invested: ${portfolio.invested_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedPortfolio && (
              <div className="portfolio-actions">
                <h2>Manage Portfolio</h2>
                <div className="action-cards">
                  <div className="action-card">
                    <h3>Transfer Funds</h3>
                    <p>Available Cash: ${currentClient.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    <input
                      type="number"
                      placeholder="Amount to transfer"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      min="0"
                      max={currentClient.cash}
                      step="0.01"
                    />
                    <button
                      onClick={handleTransfer}
                      disabled={loading || !transferAmount || parseFloat(transferAmount) <= 0}
                    >
                      Transfer to Portfolio
                    </button>
                  </div>

                  <div className="action-card">
                    <h3>Withdraw Funds</h3>
                    <p>Portfolio Value: ${selectedPortfolio.current_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    <input
                      type="number"
                      placeholder="Amount to withdraw"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      min="0"
                      max={selectedPortfolio.current_value}
                      step="0.01"
                    />
                    <button
                      onClick={handleWithdraw}
                      disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                    >
                      Withdraw to Cash
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {showCreateModal && (
          <CreatePortfolioModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreatePortfolio}
            portfolioTypes={portfolioTypes}
            availableCash={currentClient?.cash || 0}
          />
        )}
      </div>
    </div>
  );
};

interface CreatePortfolioModalProps {
  onClose: () => void;
  onCreate: (type: string, amount: number) => void;
  portfolioTypes: Array<{ value: string; label: string; description: string }>;
  availableCash: number;
}

const CreatePortfolioModal: React.FC<CreatePortfolioModalProps> = ({
  onClose,
  onCreate,
  portfolioTypes,
  availableCash
}) => {
  const [selectedType, setSelectedType] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedType && amount) {
      onCreate(selectedType, parseFloat(amount));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create New Portfolio</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Portfolio Type</label>
            <div className="portfolio-type-options">
              {portfolioTypes.map(type => (
                <div
                  key={type.value}
                  className={`type-option ${selectedType === type.value ? 'selected' : ''}`}
                  onClick={() => setSelectedType(type.value)}
                >
                  <h4>{type.label}</h4>
                  <p>{type.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Initial Investment</label>
            <p className="available-cash">Available: ${availableCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              max={availableCash}
              step="0.01"
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={!selectedType || !amount || parseFloat(amount) <= 0}
            >
              Create Portfolio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PortfolioManager;