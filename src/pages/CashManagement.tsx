import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import rbcAPI from '../services/rbc-service';
import Navigation from '../components/Navigation';
import '../styles/CashManagement.css';

const CashManagement: React.FC = () => {
  const { currentClient, clients, refreshClients, selectClient } = useAuth();
  const [depositAmount, setDepositAmount] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [initialCash, setInitialCash] = useState('');
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleDeposit = async () => {
    if (!currentClient || !depositAmount) return;

    setLoading(true);
    setMessage('');
    try {
      await rbcAPI.depositToClient(
        currentClient.id,
        parseFloat(depositAmount)
      );
      setMessage('Deposit successful!');
      setDepositAmount('');
      await refreshClients();
    } catch (error: any) {
      setMessage(error.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const newClient = await rbcAPI.createClient({
        name: newClientName,
        email: newClientEmail,
        cash: parseFloat(initialCash) || 0,
      });

      setMessage('Client created successfully!');
      setShowCreateClient(false);
      setNewClientName('');
      setNewClientEmail('');
      setInitialCash('');

      await refreshClients();
      selectClient(newClient);
    } catch (error: any) {
      setMessage(error.message || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await rbcAPI.deleteClient(clientId);
      setMessage('Client deleted successfully');
      await refreshClients();
    } catch (error: any) {
      setMessage(error.message || 'Failed to delete client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cash-management">
      <Navigation />
      <div className="cash-content">
        <div className="cash-header">
          <h1>Cash Management</h1>
          <button
            className="create-client-btn"
            onClick={() => setShowCreateClient(true)}
          >
            + Create New Client
          </button>
        </div>

        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {currentClient ? (
          <div className="cash-main">
            <div className="current-balance-card">
              <h2>Current Client</h2>
              <div className="client-details">
                <p className="client-name">{currentClient.name}</p>
                <p className="client-email">{currentClient.email}</p>
                <div className="balance-display">
                  <span className="balance-label">Available Cash</span>
                  <span className="balance-amount">
                    ${currentClient.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="deposit-card">
              <h3>Deposit Funds</h3>
              <div className="deposit-form">
                <input
                  type="number"
                  placeholder="Enter amount to deposit"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <button
                  className="deposit-btn"
                  onClick={handleDeposit}
                  disabled={loading || !depositAmount || parseFloat(depositAmount) <= 0}
                >
                  {loading ? 'Processing...' : 'Deposit'}
                </button>
              </div>
            </div>

            <div className="clients-list">
              <h3>All Clients</h3>
              <div className="client-cards">
                {clients.map(client => (
                  <div
                    key={client.id}
                    className={`client-card ${client.id === currentClient.id ? 'active' : ''}`}
                  >
                    <div className="client-card-header">
                      <div>
                        <h4>{client.name}</h4>
                        <p>{client.email}</p>
                      </div>
                      <div className="client-actions">
                        {client.id !== currentClient.id && (
                          <button
                            className="switch-btn"
                            onClick={() => selectClient(client)}
                          >
                            Switch
                          </button>
                        )}
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteClient(client.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="client-card-body">
                      <div className="stat">
                        <span>Cash</span>
                        <span>${client.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="stat">
                        <span>Portfolios</span>
                        <span>{client.portfolios?.length || 0}</span>
                      </div>
                      <div className="stat">
                        <span>Created</span>
                        <span>{new Date(client.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="no-client-message">
            <h2>No Clients Found</h2>
            <p>Create your first client to start managing finances</p>
            <button
              className="create-first-client-btn"
              onClick={() => setShowCreateClient(true)}
            >
              Create Your First Client
            </button>
          </div>
        )}

        {showCreateClient && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Create New Client</h2>
              <form onSubmit={handleCreateClient}>
                <div className="form-group">
                  <label>Client Name</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Enter client name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Initial Cash Deposit (Optional)</label>
                  <input
                    type="number"
                    value={initialCash}
                    onChange={(e) => setInitialCash(e.target.value)}
                    placeholder="Enter initial deposit amount"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateClient(false);
                      setNewClientName('');
                      setNewClientEmail('');
                      setInitialCash('');
                    }}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashManagement;