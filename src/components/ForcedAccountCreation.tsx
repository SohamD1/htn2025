import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/auth-service';
import '../styles/ForcedAccountCreation.css';

interface ForcedAccountCreationProps {
  onAccountCreated: (newClientInfo?: any) => void;
}

const ForcedAccountCreation: React.FC<ForcedAccountCreationProps> = ({ onAccountCreated }) => {
  const { backendUser, refreshBackendUser } = useAuth();
  const [accountName, setAccountName] = useState('');
  const [initialCash, setInitialCash] = useState(10000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!backendUser) {
      setError('User not authenticated');
      return;
    }

    if (!accountName.trim()) {
      setError('Account name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🚀 Creating RBC account for user:', backendUser.user_name);

      // Create RBC account using auth service
      const rbcAccount = await authService.createNewAccount(accountName.trim(), initialCash);
      console.log('✅ RBC account created:', rbcAccount.id);

      // Save the RBC client data to backend
      const saveResponse = await fetch('http://localhost:3001/api/rbc/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          rbc_client_id: rbcAccount.id,
          name: accountName.trim(),
          email: backendUser.email,
          team_name: rbcAccount.teamName || `${backendUser.user_name}'s Investment Team`,
          cash: initialCash,
          rbc_created_at: rbcAccount.createdAt || new Date().toISOString(),
          rbc_updated_at: rbcAccount.updatedAt || new Date().toISOString()
        })
      });

      const saveData = await saveResponse.json();
      if (!saveData.success) {
        throw new Error(`Failed to save RBC client: ${saveData.message}`);
      }

      console.log('✅ RBC client saved to backend database');

      // Update the user's RBC client ID in the backend
      try {
        await authService.updateRBCClientId(rbcAccount.id);
        console.log('✅ User updated with RBC client ID');
      } catch (updateError) {
        console.warn('⚠️  Failed to update user RBC client ID:', updateError);
      }

      // Refresh the backend user data to include the new RBC client ID
      await refreshBackendUser();

      console.log('🎉 Account creation completed successfully');

      // Return the new client info so it can be auto-selected
      const newClientInfo = {
        id: rbcAccount.id,
        name: accountName.trim(),
        email: backendUser.email,
        cash: initialCash,
        team_name: rbcAccount.teamName || `${backendUser.user_name}'s Investment Team`,
        portfolios: [], // No portfolios yet
        created_at: rbcAccount.createdAt || new Date().toISOString(),
        updated_at: rbcAccount.updatedAt || new Date().toISOString()
      };

      console.log('🎯 Switching to newly created client:', newClientInfo.name);
      onAccountCreated(newClientInfo);

    } catch (err: any) {
      console.error('❌ Account creation failed:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!backendUser) {
    return (
      <div className="forced-account-creation">
        <div className="creation-card">
          <h2>⚠️ Authentication Required</h2>
          <p>Please log in to create your investment account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="forced-account-creation">
      <div className="creation-card">
        <div className="creation-header">
          <h2>🏦 Create Your Investment Account</h2>
          <p className="creation-subtitle">
            Welcome, <strong>{backendUser.user_name}</strong>!
            Since this is your first time logging in, you need to create an investment account to access portfolio features.
          </p>
        </div>

        <form onSubmit={handleCreateAccount} className="creation-form">
          <div className="form-group">
            <label htmlFor="accountName">
              Investment Account Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder={`${backendUser.user_name}'s Portfolio`}
              required
              disabled={loading}
              className="account-input"
            />
            <small className="input-hint">This will be the name of your investment portfolio</small>
          </div>

          <div className="form-group">
            <label htmlFor="initialCash">
              Initial Cash Amount
            </label>
            <div className="cash-input-wrapper">
              <span className="currency-symbol">$</span>
              <input
                type="number"
                id="initialCash"
                value={initialCash}
                onChange={(e) => setInitialCash(Number(e.target.value))}
                min="1000"
                max="1000000"
                step="1000"
                disabled={loading}
                className="cash-input"
              />
            </div>
            <small className="input-hint">
              Amount available for investing (minimum: $1,000)
            </small>
          </div>

          <div className="account-preview">
            <h4>Account Preview:</h4>
            <ul>
              <li><strong>Account Name:</strong> {accountName || 'Not specified'}</li>
              <li><strong>Account Holder:</strong> {backendUser.user_name}</li>
              <li><strong>Email:</strong> {backendUser.email}</li>
              <li><strong>Initial Cash:</strong> ${initialCash.toLocaleString()}</li>
            </ul>
            <div className="auto-switch-notice">
              <p>
                ✨ <strong>This account will be automatically selected</strong> as your active portfolio once created.
              </p>
            </div>
          </div>

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !accountName.trim()}
            className="create-account-btn"
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Creating Account...
              </>
            ) : (
              'Create Investment Account'
            )}
          </button>
        </form>

        <div className="creation-footer">
          <p className="security-note">
            🔒 Your account will be securely linked to your RBC InvestEase profile
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForcedAccountCreation;