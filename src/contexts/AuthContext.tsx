import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client } from '../services/rbc-service';
import rbcAPI from '../services/rbc-service';
import rbcSyncService from '../services/rbc-sync-service';
import portfolioService from '../services/portfolio-service';

interface BackendUser {
  user_id: string;
  client_id: string;
  user_name: string;
  email: string;
  money: number;
  txs: Array<{
    type: 'buy' | 'sell';
    symbol: string;
    amount: number;
    price: number;
    timestamp: string;
  }>;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentClient: Client | null;
  clients: Client[];
  backendUser: BackendUser | null;
  needsAccountCreation: boolean;
  token: string | null;
  login: (teamName: string, email: string) => Promise<void>;
  setAuthenticatedUser: (user: any) => void;
  logout: () => void;
  selectClient: (client: Client) => void;
  refreshClients: () => Promise<void>;
  refreshBackendUser: () => Promise<void>;
  setAccountCreationComplete: (newClientInfo?: any) => void;
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
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [needsAccountCreation, setNeedsAccountCreation] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔄 Initializing authentication...');

      const authToken = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');

      // PRIMARY AUTH: Check backend authentication first
      if (authToken && userData) {
        try {
          const user = JSON.parse(userData);
          console.log('✅ Found stored auth data for user:', user.user_name);
          console.log('💰 Stored money:', user.money);
          console.log('📊 Stored transactions:', user.txs?.length || 0);

          setIsAuthenticated(true);
          setBackendUser(user);
          setToken(authToken);

          // Check if user needs RBC account creation
          // Skip for users who have been using the app (to avoid disrupting existing workflows)
          const userCreatedDate = user.created_at ? new Date(user.created_at) : null;
          const cutoffDate = new Date('2025-09-14'); // Today's date - only apply to brand new accounts

          if (!user.rbc_client_id) {
            // If user was created recently (after cutoff), they're truly new and need setup
            if (userCreatedDate && userCreatedDate > cutoffDate) {
              console.log('⚠️  New user detected - needs investment account creation');
              setNeedsAccountCreation(true);
            } else {
              console.log('📝 Existing user without RBC account - skipping forced creation for now');
              setNeedsAccountCreation(false);
            }
          } else {
            console.log('✅ User has RBC client ID:', user.rbc_client_id);
            setNeedsAccountCreation(false);
          }

          // SECONDARY: Try to set up RBC API token for portfolio features
          const portfolioToken = localStorage.getItem('portfolio_api_token');
          if (!portfolioToken) {
            console.log('🔄 No RBC token found, attempting to refresh...');
            try {
              await rbcAPI.registerTeam({
                team_name: `${user.user_name}'s Investment Team`,
                contact_email: user.email
              });
              console.log('✅ RBC token refreshed successfully');
            } catch (error) {
              console.warn('⚠️  Failed to refresh RBC token (portfolio features may be limited):', error);
            }
          }

          // TERTIARY: Load RBC portfolio data if available
          try {
            const cachedClients = localStorage.getItem('rbc_clients_cache');
            if (cachedClients) {
              const clients = JSON.parse(cachedClients);
              setClients(clients);
              if (clients.length > 0 && !currentClient) {
                setCurrentClient(clients[0]);
              }
            }
            await refreshClients();
          } catch (error) {
            console.warn('⚠️  Failed to load RBC portfolio data:', error);
          }

        } catch (error) {
          console.error('❌ Failed to initialize backend auth:', error);
          // Clear invalid auth data
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          setIsAuthenticated(false);
        }
      } else {
        console.log('⚪ No stored authentication found');
        setIsAuthenticated(false);
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
      console.log('🔄 Refreshing clients from backend and RBC API...');

      // First try to get clients from backend database
      let clientList: Client[] = [];
      try {
        const backendClients = await portfolioService.getBackendClients();
        console.log('📦 Backend clients loaded:', backendClients.length);

        // Convert backend clients to frontend Client format
        clientList = backendClients.map(bc => ({
          id: bc.rbc_client_id,
          name: bc.name,
          email: bc.email,
          cash: bc.cash || 0,
          team_name: bc.team_name,
          portfolios: [], // Will be loaded separately
          created_at: bc.rbc_created_at || new Date().toISOString(),
          updated_at: bc.rbc_updated_at || new Date().toISOString()
        }));
      } catch (backendError) {
        console.warn('⚠️  Failed to load clients from backend:', backendError);
      }

      // Also try to get fresh data from RBC API (if token available)
      try {
        const rbcClients = await rbcAPI.getClients();
        console.log('🔗 RBC API clients loaded:', rbcClients.length);

        // Merge RBC API data with backend data (RBC API takes precedence for fresh data)
        for (const rbcClient of rbcClients) {
          const existingIndex = clientList.findIndex(c => c.id === rbcClient.id);
          if (existingIndex >= 0) {
            // Update existing client with fresh RBC data
            clientList[existingIndex] = { ...clientList[existingIndex], ...rbcClient };
          } else {
            // Add new client from RBC API
            clientList.push(rbcClient);
          }
        }
      } catch (rbcError) {
        console.warn('⚠️  Failed to refresh from RBC API (using backend data only):', rbcError);
      }

      console.log('✅ Total clients loaded:', clientList.length);
      setClients(clientList);

      // Update current client with fresh data if it exists
      if (currentClient) {
        const updatedCurrentClient = clientList.find(client => client.id === currentClient.id);
        if (updatedCurrentClient) {
          setCurrentClient(updatedCurrentClient);
          console.log('✅ Current client updated:', updatedCurrentClient.name);
        }
      } else if (clientList.length > 0) {
        setCurrentClient(clientList[0]);
        console.log('✅ Set first client as current:', clientList[0].name);
      }

    } catch (error) {
      console.error('❌ Failed to refresh clients:', error);
    }
  };

  const refreshBackendUser = async () => {
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        console.log('No auth token found for user refresh');
        return;
      }

      const response = await fetch('http://localhost:3001/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success && data.user) {
        console.log('✅ Backend user refreshed:', data.user.user_name);
        console.log('💰 Updated money:', data.user.money);
        setBackendUser(data.user);
        localStorage.setItem('user_data', JSON.stringify(data.user));
      } else {
        console.error('Failed to refresh backend user:', data.message);
      }
    } catch (error) {
      console.error('Error refreshing backend user:', error);
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
    setBackendUser(null);
    setNeedsAccountCreation(false);
    setToken(null);
  };

  const selectClient = (client: Client) => {
    setCurrentClient(client);
  };

  const setAccountCreationComplete = async (newClientInfo?: any) => {
    console.log('🎉 Account creation completed, refreshing user data...');
    setNeedsAccountCreation(false);

    // If we have the new client info, add it to the clients list and set it as current
    if (newClientInfo) {
      console.log('🎯 Auto-switching to newly created client:', newClientInfo.name);

      // Add the new client to the existing clients list
      setClients(prevClients => {
        const existingIndex = prevClients.findIndex(c => c.id === newClientInfo.id);
        if (existingIndex >= 0) {
          // Update existing client
          const updatedClients = [...prevClients];
          updatedClients[existingIndex] = newClientInfo;
          return updatedClients;
        } else {
          // Add new client
          return [...prevClients, newClientInfo];
        }
      });

      // Set the new client as the current client
      setCurrentClient(newClientInfo);
      console.log('✅ Current client set to:', newClientInfo.name);
    }

    // Refresh data to ensure consistency
    await refreshBackendUser();
    await refreshClients();
  };

  const setAuthenticatedUser = async (user: any) => {
    console.log('🔄 Setting authenticated user:', user.user_name);
    setIsAuthenticated(true);
    setBackendUser(user);
    
    // Set token from localStorage
    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
      setToken(authToken);
    }

    // Check if user needs RBC account creation
    // Skip for users who have been using the app (to avoid disrupting existing workflows)
    const userCreatedDate = user.created_at ? new Date(user.created_at) : null;
    const cutoffDate = new Date('2025-09-14'); // Today's date - only apply to brand new accounts

    if (!user.rbc_client_id) {
      // If user was created recently (after cutoff), they're truly new and need setup
      if (userCreatedDate && userCreatedDate > cutoffDate) {
        console.log('⚠️  New user detected - needs investment account creation');
        setNeedsAccountCreation(true);
      } else {
        console.log('📝 Existing user without RBC account - skipping forced creation for now');
        setNeedsAccountCreation(false);
      }
    } else {
      console.log('✅ User has RBC client ID:', user.rbc_client_id);
      setNeedsAccountCreation(false);
    }

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
        backendUser,
        needsAccountCreation,
        token,
        login,
        setAuthenticatedUser,
        logout,
        selectClient,
        refreshClients,
        refreshBackendUser,
        setAccountCreationComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};