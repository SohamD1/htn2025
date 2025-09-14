import rbcAPI from './rbc-service';

// Transaction interface for user transactions
export interface ITransaction {
  type: 'buy' | 'sell';
  symbol: string;
  amount: number;
  price: number;
  timestamp: Date;
}

// User interface for localStorage storage
export interface IUser {
  client_id: string;
  user_id: string;
  user_name: string;
  email: string;
  password: string;
  money: number;
  txs: ITransaction[];
  created_at: Date;
  updated_at: Date;
}

export interface RegisterUserData {
  user_name: string;
  email: string;
  password: string;
  money?: number;
}

export interface LoginUserData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    user_id: string;
    client_id: string;
    rbc_client_id?: string;
    user_name: string;
    email: string;
    money: number;
    txs: ITransaction[];
  };
  token?: string;
}

export interface TransactionData {
  type: 'buy' | 'sell';
  symbol: string;
  amount: number;
  price: number;
}

class AuthService {
  private static instance: AuthService;
  private readonly BACKEND_URL = 'http://localhost:3001/api';
  private readonly CURRENT_USER_KEY = 'user_data';
  private readonly AUTH_TOKEN_KEY = 'auth_token';

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Initialize service
  public async initialize(): Promise<void> {
    console.log('Auth service initialized (MongoDB backend mode)');
  }

  // Make API request to backend
  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.BACKEND_URL}${endpoint}`;
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }
    
    return data;
  }

  // Register a new user
  public async registerUser(userData: RegisterUserData): Promise<AuthResponse> {
    try {
      // Register user with backend
      const response = await this.apiRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.success && response.user && response.token) {
        // Store token and user data
        localStorage.setItem(this.AUTH_TOKEN_KEY, response.token);
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(response.user));

        // Register team first to get JWT token, then create RBC client
        try {
          console.log('Creating InvestEase client for user:', userData.user_name);
          
          // First register team to get authentication token
          const teamResponse = await rbcAPI.registerTeam({
            team_name: `${userData.user_name}'s Investment Team`,
            contact_email: userData.email
          });
          console.log('Team registered successfully:', teamResponse.teamId);

          // Then create client with the authenticated token
          const clientResponse = await rbcAPI.createClient({
            name: userData.user_name,
            email: userData.email,
            cash: userData.money || 10000
          });
          console.log('InvestEase client created successfully:', clientResponse.id);
          
          // Store the RBC client ID in the user data and backend
          if (response.user) {
            response.user.rbc_client_id = clientResponse.id;
            
            // Also store the RBC token for portfolio operations
            const rbcToken = rbcAPI.getToken();
            if (rbcToken) {
              localStorage.setItem('portfolio_api_token', rbcToken);
            }
            
            // Update the backend with the RBC client ID
            try {
              await this.updateRBCClientId(clientResponse.id);
              console.log('RBC client ID saved to database');
            } catch (updateError) {
              console.warn('Failed to save RBC client ID to database:', updateError);
            }
          }
          
        } catch (rbcError: any) {
          console.error('Failed to create InvestEase client:', rbcError);
          console.log('Error details:', rbcError.message);
          
          // Still allow registration to succeed, but log the issue
          console.log('User registered in database but InvestEase client creation failed');
          console.log('User can still use the app, but portfolio features may be limited');
        }
      }

      return response;

    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.'
      };
    }
  }

  // Login user
  public async loginUser(loginData: LoginUserData): Promise<AuthResponse> {
    try {
      // Login with backend
      const response = await this.apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      });

      if (response.success && response.user && response.token) {
        // Store token and user data
        localStorage.setItem(this.AUTH_TOKEN_KEY, response.token);
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(response.user));
      }

      return response;

    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed. Please try again.'
      };
    }
  }

  // Verify token (for client-side use)
  public verifyToken(token: string): any {
    try {
      // For JWT tokens, we'll just check if we have a valid token stored
      const storedToken = localStorage.getItem(this.AUTH_TOKEN_KEY);
      return storedToken === token;
    } catch (error) {
      return false;
    }
  }

  // Get user profile from backend
  public async getUserProfile(): Promise<any> {
    try {
      const response = await this.apiRequest<any>('/auth/profile');
      return response.user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Get current user from localStorage
  public getCurrentUser(): any {
    try {
      const currentUser = localStorage.getItem(this.CURRENT_USER_KEY);
      const userData = currentUser ? JSON.parse(currentUser) : null;
      console.log('Current user data from localStorage:', userData);
      return userData;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Add transaction to user
  public async addTransaction(user_id: string, transactionData: TransactionData): Promise<AuthResponse> {
    try {
      // Add transaction via backend
      const response = await this.apiRequest<AuthResponse>('/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });

      if (response.success && response.user) {
        // Update current user in localStorage
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(response.user));
      }

      return response;

    } catch (error: any) {
      console.error('Transaction error:', error);
      return {
        success: false,
        message: error.message || 'Transaction failed. Please try again.'
      };
    }
  }

  // Update user money
  public async updateUserMoney(user_id: string, newAmount: number): Promise<AuthResponse> {
    try {
      // Update money via backend
      const response = await this.apiRequest<AuthResponse>('/auth/money', {
        method: 'PUT',
        body: JSON.stringify({ amount: newAmount }),
      });

      if (response.success && response.user) {
        // Update current user in localStorage
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(response.user));
      }

      return response;

    } catch (error: any) {
      console.error('Update money error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update money. Please try again.'
      };
    }
  }

  // Update RBC client ID in backend
  public async updateRBCClientId(rbcClientId: string): Promise<void> {
    try {
      await this.apiRequest('/auth/rbc-client', {
        method: 'PUT',
        body: JSON.stringify({ rbc_client_id: rbcClientId }),
      });
    } catch (error) {
      console.error('Failed to update RBC client ID:', error);
      throw error;
    }
  }

  // Create new RBC account (simplified - only needs name, gets email from current user)
  public async createNewAccount(accountName: string, initialCash: number = 10000): Promise<any> {
    try {
      // Get current user data to retrieve email
      const currentUser = this.getCurrentUser();
      if (!currentUser || !currentUser.email) {
        throw new Error('No authenticated user found. Please login first.');
      }

      // First ensure we have a valid RBC token by registering a team if needed
      const currentToken = rbcAPI.getToken();
      if (!currentToken) {
        console.log('No RBC token found, registering team first...');
        try {
          // Generate a unique team name to avoid conflicts
          const timestamp = Date.now();
          const teamResponse = await rbcAPI.registerTeam({
            team_name: `${currentUser.user_name}'s Investment Team ${timestamp}`,
            contact_email: currentUser.email
          });
          console.log('Team registered successfully for new account creation:', teamResponse);
          
          // Store the token
          const newToken = rbcAPI.getToken();
          if (newToken) {
            localStorage.setItem('portfolio_api_token', newToken);
            console.log('RBC token stored successfully');
          } else {
            console.error('No token received after team registration');
            throw new Error('No authentication token received from RBC API');
          }
        } catch (teamError: any) {
          console.error('Failed to register team - Full error:', teamError);
          console.error('Error message:', teamError.message);
          console.error('Error response:', teamError.response);
          
          // If team already exists, try to use existing token
          if (teamError.message && teamError.message.includes('already exists')) {
            console.log('Team already exists, checking for existing token...');
            const existingToken = localStorage.getItem('portfolio_api_token');
            if (existingToken) {
              rbcAPI.setToken(existingToken);
              console.log('Using existing RBC token');
            } else {
              throw new Error('Team already exists but no valid token found. Please contact support.');
            }
          } else {
            throw new Error(`Failed to authenticate with RBC API: ${teamError.message || 'Unknown error'}`);
          }
        }
      } else {
        console.log('Using existing RBC token for account creation');
      }

      // Create RBC account using the current user's email
      const accountResponse = await rbcAPI.createClient({
        name: accountName,
        email: currentUser.email,
        cash: initialCash
      });

      console.log('New RBC account created successfully:', accountResponse.id);
      return accountResponse;
    } catch (error) {
      console.error('Failed to create new RBC account:', error);
      throw error;
    }
  }

  // Logout user
  public logout(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
export default authService;
