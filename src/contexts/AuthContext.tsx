import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client } from '../services/rbc-service';
import rbcAPI from '../services/rbc-service';

interface AuthContextType {
  isAuthenticated: boolean;
  currentClient: Client | null;
  clients: Client[];
  login: (teamName: string, email: string) => Promise<void>;
  logout: () => void;
  selectClient: (client: Client) => void;
  refreshClients: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('portfolio_api_token');
    if (token) {
      setIsAuthenticated(true);
      refreshClients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (teamName: string, email: string) => {
    try {
      await rbcAPI.registerTeam({
        team_name: teamName,
        contact_email: email,
      });

      setIsAuthenticated(true);
      await refreshClients();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const refreshClients = async () => {
    try {
      const clientList = await rbcAPI.getClients();
      setClients(clientList);
      if (clientList.length > 0 && !currentClient) {
        setCurrentClient(clientList[0]);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const logout = () => {
    rbcAPI.clearToken();
    setIsAuthenticated(false);
    setCurrentClient(null);
    setClients([]);
  };

  const selectClient = (client: Client) => {
    setCurrentClient(client);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentClient,
        clients,
        login,
        logout,
        selectClient,
        refreshClients,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};