import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/ClientSelector.css';

const ClientSelector: React.FC = () => {
  const { currentClient, clients, selectClient } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      selectClient(client);
      setIsOpen(false);
    }
  };

  if (clients.length <= 1) {
    return null;
  }

  return (
    <div className="client-selector">
      <button
        className="client-selector-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="client-name">{currentClient?.name || 'Select Client'}</span>
        <span className="dropdown-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="client-dropdown">
          {clients.map(client => (
            <div
              key={client.id}
              className={`client-option ${client.id === currentClient?.id ? 'selected' : ''}`}
              onClick={() => handleSelectClient(client.id)}
            >
              <div className="client-info">
                <span className="client-option-name">{client.name}</span>
                <span className="client-option-email">{client.email}</span>
              </div>
              <div className="client-balance">
                ${client.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientSelector;