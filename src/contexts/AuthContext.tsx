import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client } from '../services/rbc-service';
import rbcAPI from '../services/rbc-service';
import rbcSyncService from '../services/rbc-sync-service';

interface AuthContextType {
  isAuthenticated: boolean;
  currentClient: Client | null;
  clients: Client[];
  login: (teamName: string, email: string) => Promise<void>;
  setAuthenticatedUser: (user: any) => void;
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
    const initializeAuth = async () => {
      const portfolioToken = localStorage.getItem('portfolio_api_token');
      const authToken = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');
      
      if (authToken && userData) {
        try {
          const user = JSON.parse(userData);
          setIsAuthenticated(true);
          
          // If we don't have a portfolio token, try to get one
          if (!portfolioToken) {
            console.log('No RBC token found, attempting to refresh...');
            try {
              await rbcAPI.registerTeam({
                team_name: `${user.user_name}'s Investment Team`,
                contact_email: user.email
              });
              console.log('RBC token refreshed successfully');
            } catch (error) {
              console.warn('Failed to refresh RBC token:', error);
            }
          }
          
          // Load cached RBC data first
          try {
            const cachedClients = localStorage.getItem('rbc_clients_cache');
            if (cachedClients) {
              const clients = JSON.parse(cachedClients);
              setClients(clients);
              if (clients.length > 0 && !currentClient) {
                setCurrentClient(clients[0]);
              }
            }
          } catch (error) {
            console.error('Failed to load cached RBC data:', error);
          }
          
          // Try to load clients from RBC API
          await refreshClients();
        } catch (error) {
          console.error('Failed to initialize auth:', error);
        }
      } else if (portfolioToken) {
        setIsAuthenticated(true);
        refreshClients();
      }
    };
    
    initializeAuth();
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
      
      // Update current client with fresh data if it exists
      if (currentClient) {
        const updatedCurrentClient = clientList.find(client => client.id === currentClient.id);
        if (updatedCurrentClient) {
          setCurrentClient(updatedCurrentClient);
          console.log('Current client updated with fresh data:', updatedCurrentClient);
        }
      } else if (clientList.length > 0) {
        setCurrentClient(clientList[0]);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const logout = () => {
    rbcAPI.clearToken();
    rbcSyncService.clearCache();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setIsAuthenticated(false);
    setCurrentClient(null);
    setClients([]);
  };

  const selectClient = (client: Client) => {
    setCurrentClient(client);
  };

  const setAuthenticatedUser = async (user: any) => {
    setIsAuthenticated(true);
    
    // Sync RBC data from backend on login
    try {
      console.log('Syncing RBC data from backend...');
      const syncedData = await rbcSyncService.syncUserData();
      
      if (syncedData.clients.length > 0) {
        setClients(syncedData.clients);
        
        // Set first client as current if none selected
        if (!currentClient) {
          setCurrentClient(syncedData.clients[0]);
        }
      }
      
      console.log('RBC data sync completed');
    } catch (error) {
      console.error('Failed to sync RBC data:', error);
    }
    
    // Refresh clients after setting authenticated user (gets latest from RBC API)
    try {
      await refreshClients();
    } catch (error) {
      console.error('Failed to refresh clients after login:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentClient,
        clients,
        login,
        setAuthenticatedUser,
        logout,
        selectClient,
        refreshClients,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};