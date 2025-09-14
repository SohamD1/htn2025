import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/UserDashboard.css';

const UserDashboard: React.FC = () => {
  const { backendUser, refreshBackendUser } = useAuth();

  if (!backendUser) {
    return (
      <div className="user-dashboard">
        <div className="dashboard-card">
          <h3>User Account</h3>
          <p>No user data available</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalTransactionValue = backendUser.txs.reduce((sum, tx) => {
    return sum + (tx.amount * tx.price);
  }, 0);

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h2>Welcome, {backendUser.user_name}!</h2>
        <button
          onClick={refreshBackendUser}
          className="refresh-btn"
          title="Refresh account data"
        >
          🔄
        </button>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card balance-card">
          <h3>Account Balance</h3>
          <div className="balance-amount">
            {formatCurrency(backendUser.money)}
          </div>
          <p className="balance-subtitle">Available Cash</p>
        </div>

        <div className="dashboard-card transactions-card">
          <h3>Transaction Summary</h3>
          <div className="transaction-stats">
            <div className="stat-item">
              <span className="stat-label">Total Transactions</span>
              <span className="stat-value">{backendUser.txs.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Transaction Value</span>
              <span className="stat-value">{formatCurrency(totalTransactionValue)}</span>
            </div>
          </div>
        </div>
      </div>

      {backendUser.txs.length > 0 && (
        <div className="dashboard-card recent-transactions">
          <h3>Recent Transactions</h3>
          <div className="transactions-list">
            {backendUser.txs.slice(-5).reverse().map((tx, index) => (
              <div key={index} className={`transaction-item ${tx.type}`}>
                <div className="transaction-main">
                  <span className="transaction-type">
                    {tx.type === 'buy' ? '📈' : '📉'} {tx.type.toUpperCase()}
                  </span>
                  <span className="transaction-symbol">{tx.symbol}</span>
                  <span className="transaction-amount">
                    {tx.amount} shares @ {formatCurrency(tx.price)}
                  </span>
                </div>
                <div className="transaction-meta">
                  <span className="transaction-total">
                    {formatCurrency(tx.amount * tx.price)}
                  </span>
                  <span className="transaction-date">
                    {formatDate(tx.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {backendUser.txs.length > 5 && (
            <p className="transactions-note">
              Showing 5 most recent transactions (total: {backendUser.txs.length})
            </p>
          )}
        </div>
      )}

      <div className="dashboard-card account-info">
        <h3>Account Information</h3>
        <div className="account-details">
          <div className="detail-item">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{backendUser.email}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">User ID:</span>
            <span className="detail-value">{backendUser.user_id}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Client ID:</span>
            <span className="detail-value">{backendUser.client_id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;