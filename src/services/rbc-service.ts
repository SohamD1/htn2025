// Portfolio Simulation & Market Sandbox API Service
import config from '../config/env';
import rbcSyncService from './rbc-sync-service';

// Base URL for the API
const BASE_URL = config.apiUrl;

// TypeScript interfaces for API types
export interface TeamRegistration {
  team_name: string;
  contact_email: string;
}

export interface TeamAuthResponse {
  teamId: string;
  jwtToken: string;
  expiresAt: string;
}

export interface ClientCreate {
  name: string;
  email: string;
  cash: number;
  portfolios?: string[];
}

export interface ClientUpdate {
  name?: string;
  email?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  team_name: string;
  portfolios: Portfolio[];
  cash: number;
  created_at: string;
  updated_at: string;
}

export interface PortfolioCreate {
  type: 'aggressive_growth' | 'growth' | 'balanced' | 'conservative' | 'very_conservative';
  initialAmount: number;
}

export interface Portfolio {
  id: string;
  client_id: string;
  team_name: string;
  type: 'aggressive_growth' | 'growth' | 'balanced' | 'conservative' | 'very_conservative';
  created_at: string;
  invested_amount: number;
  current_value: number;
  total_months_simulated: number;
  transactions: Transaction[];
  growth_trend: GrowthDataPoint[];
}

export interface Transaction {
  id: string;
  date: string;
  type: 'deposit' | 'withdraw' | 'growth';
  amount: number;
  balance_after: number;
}

export interface GrowthDataPoint {
  date: string;
  value: number;
}

export interface SimulationRequest {
  months: number; // 1-12 months
}

export interface SimulationResult {
  portfolioId: string;
  strategy: string;
  monthsSimulated: number;
  daysSimulated: number;
  initialValue: number;
  projectedValue: number;
  totalGrowthPoints: number;
  simulationId: string;
  growth_trend: GrowthDataPoint[];
}

export interface MultipleSimulationResponse {
  message: string;
  results: SimulationResult[];
}

export interface ErrorResponse {
  message: string;
  error?: string;
  code?: string;
}

export interface PortfolioAnalysis {
  portfolioId: string;
  trailingReturns: Record<string, string>;
  calendarReturns: Record<string, string>;
}

// API Service Class
export class PortfolioAPIService {
  private token: string | null = null;

  constructor() {
    // Try to load token from localStorage if available
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('portfolio_api_token');
      this.token = (storedToken && storedToken.trim() !== '') ? storedToken : null;
    }
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('portfolio_api_token', token);
    }
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('portfolio_api_token');
    }
  }

  // Check if token is valid and refresh if needed
  async ensureValidToken(): Promise<boolean> {
    try {
      // If no token or empty token, try to get one
      if (!this.token || this.token.trim() === '') {
        console.log('No valid RBC token found, attempting to register team...');
        
        // Clear any invalid token
        this.clearToken();
        
        // Get user data from localStorage
        const userData = localStorage.getItem('user_data');
        if (!userData) {
          console.error('No user data found for token refresh');
          return false;
        }
        
        const user = JSON.parse(userData);
        const timestamp = Date.now();
        const randomId = Math.floor(Math.random() * 10000);
        
        await this.registerTeam({
          team_name: `${user.user_name}'s Investment Team ${timestamp}_${randomId}`,
          contact_email: user.email
        });
        
        return this.token !== null && this.token.trim() !== '';
      }
      
      // Test if current token works by making a simple API call
      try {
        await this.getClients();
        return true;
      } catch (error) {
        console.log('Current token invalid, refreshing...');
        
        // Clear invalid token
        this.clearToken();
        
        // Get user data for new token
        const userData = localStorage.getItem('user_data');
        if (!userData) {
          console.error('No user data found for token refresh');
          return false;
        }
        
        const user = JSON.parse(userData);
        const timestamp = Date.now();
        const randomId = Math.floor(Math.random() * 10000);
        
        try {
          await this.registerTeam({
            team_name: `${user.user_name}'s Investment Team ${timestamp}_${randomId}`,
            contact_email: user.email
          });
          
          return this.token !== null && this.token.trim() !== '';
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          return false;
        }
      }
    } catch (error) {
      console.error('Failed to ensure valid token:', error);
      return false;
    }
  }

  // Get authorization headers
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.token && this.token.trim() !== '') {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic API request method
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`RBC API Request: ${options.method || 'GET'} ${url}`);
    
    // Ensure we have a valid token before making the request
    if (!endpoint.includes('/teams/register')) {
      const tokenValid = await this.ensureValidToken();
      if (!tokenValid) {
        throw new Error('Unable to obtain valid RBC API token. Please try logging in again.');
      }
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      console.error(`RBC API Error: ${response.status} ${response.statusText}`);
      const errorData: ErrorResponse = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
      console.error('RBC API Error Details:', errorData);
      throw new Error(errorData.message || 'API request failed');
    }

    return response.json();
  }

  // Authentication Methods
  async registerTeam(data: TeamRegistration): Promise<TeamAuthResponse> {
    const result = await this.request<TeamAuthResponse>('/teams/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Automatically set the token after successful registration
    this.setToken(result.jwtToken);
    return result;
  }

  // Force refresh token (useful for debugging or manual refresh)
  async refreshToken(): Promise<boolean> {
    console.log('Forcing RBC token refresh...');
    this.clearToken();
    return await this.ensureValidToken();
  }

  // Client Management Methods
  async createClient(data: ClientCreate): Promise<Client> {
    const result = await this.request<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Sync to backend
    await rbcSyncService.saveClient(result);
    
    return result;
  }

  async getClients(): Promise<Client[]> {
    return this.request<Client[]>('/clients');
  }

  async getClient(clientId: string): Promise<Client> {
    return this.request<Client>(`/clients/${clientId}`);
  }

  async updateClient(clientId: string, data: ClientUpdate): Promise<Client> {
    return this.request<Client>(`/clients/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClient(clientId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/clients/${clientId}`, {
      method: 'DELETE',
    });
  }

  async depositToClient(clientId: string, amount: number): Promise<{
    message: string;
    client: Client;
  }> {
    return this.request<{ message: string; client: Client }>(`/clients/${clientId}/deposit`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  // Portfolio Management Methods
  async createPortfolio(clientId: string, data: PortfolioCreate): Promise<Portfolio> {
    console.log('Creating portfolio for client:', clientId, 'with data:', data);
    const result = await this.request<Portfolio>(`/clients/${clientId}/portfolios`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    console.log('Portfolio creation result:', result);
    
    // Store portfolio ID in localStorage for this client (workaround for broken GET endpoint)
    this.storePortfolioId(clientId, result.id);
    
    // Sync to backend
    await rbcSyncService.savePortfolio(result);
    
    return result;
  }

  // Store portfolio ID for a client
  private storePortfolioId(clientId: string, portfolioId: string) {
    const key = `client_portfolios_${clientId}`;
    const existingIds = JSON.parse(localStorage.getItem(key) || '[]');
    if (!existingIds.includes(portfolioId)) {
      existingIds.push(portfolioId);
      localStorage.setItem(key, JSON.stringify(existingIds));
      console.log('Stored portfolio ID:', portfolioId, 'for client:', clientId);
    }
  }

  // Get stored portfolio IDs for a client
  private getStoredPortfolioIds(clientId: string): string[] {
    const key = `client_portfolios_${clientId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  async getClientPortfolios(clientId: string): Promise<Portfolio[]> {
    console.log('Getting portfolios for client:', clientId);
    
    // Try the official endpoint first
    try {
      const result = await this.request<Portfolio[]>(`/clients/${clientId}/portfolios`);
      console.log('Retrieved portfolios from API:', result);
      
      // If we get results, return them
      if (result && result.length > 0) {
        return result;
      }
    } catch (error) {
      console.warn('Official portfolio endpoint failed:', error);
    }
    
    // Fallback: Use stored portfolio IDs and fetch individually
    console.log('Using localStorage fallback for portfolios...');
    const portfolioIds = this.getStoredPortfolioIds(clientId);
    console.log('Found stored portfolio IDs:', portfolioIds);
    
    if (portfolioIds.length === 0) {
      return [];
    }
    
    // Fetch each portfolio individually
    const portfolios: Portfolio[] = [];
    for (const portfolioId of portfolioIds) {
      try {
        const portfolio = await this.getPortfolio(portfolioId);
        portfolios.push(portfolio);
        console.log('Successfully fetched portfolio:', portfolioId);
      } catch (error) {
        console.warn('Failed to fetch portfolio:', portfolioId, error);
        // Remove invalid portfolio ID from storage
        this.removeStoredPortfolioId(clientId, portfolioId);
      }
    }
    
    console.log('Retrieved portfolios via fallback:', portfolios);
    return portfolios;
  }

  // Remove a portfolio ID from storage
  private removeStoredPortfolioId(clientId: string, portfolioId: string) {
    const key = `client_portfolios_${clientId}`;
    const existingIds = JSON.parse(localStorage.getItem(key) || '[]');
    const updatedIds = existingIds.filter((id: string) => id !== portfolioId);
    localStorage.setItem(key, JSON.stringify(updatedIds));
    console.log('Removed invalid portfolio ID:', portfolioId, 'for client:', clientId);
  }

  async getPortfolio(portfolioId: string): Promise<Portfolio> {
    return this.request<Portfolio>(`/portfolios/${portfolioId}`);
  }

  // Clear stored portfolio IDs for a client (useful for debugging)
  clearStoredPortfolioIds(clientId: string) {
    const key = `client_portfolios_${clientId}`;
    localStorage.removeItem(key);
    console.log('Cleared stored portfolio IDs for client:', clientId);
  }

  async transferToPortfolio(portfolioId: string, amount: number): Promise<{
    message: string;
    portfolio: Portfolio;
    client_cash: number;
  }> {
    return this.request<{
      message: string;
      portfolio: Portfolio;
      client_cash: number;
    }>(`/portfolios/${portfolioId}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async withdrawFromPortfolio(portfolioId: string, amount: number): Promise<{
    message: string;
    portfolio: Portfolio;
    client_cash: number;
  }> {
    return this.request<{
      message: string;
      portfolio: Portfolio;
      client_cash: number;
    }>(`/portfolios/${portfolioId}/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async getPortfolioAnalysis(portfolioId: string): Promise<PortfolioAnalysis> {
    return this.request<PortfolioAnalysis>(`/portfolios/${portfolioId}/analysis`);
  }

  // Simulation Methods
  async simulateClient(clientId: string, months: number): Promise<MultipleSimulationResponse> {
    console.log('Running simulation for client:', clientId, 'months:', months);
    
    try {
      const result = await this.request<MultipleSimulationResponse>(`/client/${clientId}/simulate`, {
        method: 'POST',
        body: JSON.stringify({ months }),
      });
      console.log('Simulation result:', result);
      
      // Sync to backend
      await rbcSyncService.saveSimulation(clientId, result);
      
      return result;
    } catch (error) {
      console.error('Simulation failed:', error);
      
      // If the API simulation fails due to portfolio retrieval issues,
      // we could implement a fallback simulation using individual portfolios
      console.log('Attempting fallback simulation...');
      
      try {
        // Get portfolios using our working method
        const portfolios = await this.getClientPortfolios(clientId);
        console.log('Found portfolios for fallback simulation:', portfolios);
        
        if (portfolios.length === 0) {
          throw new Error('No portfolios found for client. Please create portfolios first.');
        }
        
        // Implement fallback client-side simulation
        console.log('Implementing fallback simulation...');
        const fallbackResult = await this.simulatePortfoliosFallback(portfolios, months);
        
        // Sync fallback simulation to backend
        await rbcSyncService.saveSimulation(clientId, fallbackResult);
        
        return fallbackResult;
        
      } catch (fallbackError) {
        console.error('Fallback simulation also failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  // Fallback simulation method (client-side simulation when API fails)
  private async simulatePortfoliosFallback(portfolios: Portfolio[], months: number): Promise<MultipleSimulationResponse> {
    console.log(`Running client-side simulation for ${portfolios.length} portfolios over ${months} months`);
    
    const results: SimulationResult[] = [];
    
    for (const portfolio of portfolios) {
      const result = this.simulatePortfolioGrowth(portfolio, months);
      results.push(result);
    }
    
    return {
      message: `Client-side simulation completed successfully for ${portfolios.length} portfolios.`,
      results: results
    };
  }

  // Simulate growth for a single portfolio
  private simulatePortfolioGrowth(portfolio: Portfolio, months: number): SimulationResult {
    const daysToSimulate = months * 30; // Approximate 30 days per month
    const growthTrend: GrowthDataPoint[] = [];
    
    // Define annual return rates for different strategies (these are realistic ranges)
    const strategyReturns: Record<string, { min: number, max: number, volatility: number }> = {
      'very_conservative': { min: 0.02, max: 0.05, volatility: 0.02 },
      'conservative': { min: 0.04, max: 0.07, volatility: 0.05 },
      'balanced': { min: 0.06, max: 0.10, volatility: 0.08 },
      'growth': { min: 0.08, max: 0.12, volatility: 0.12 },
      'aggressive_growth': { min: 0.10, max: 0.16, volatility: 0.18 }
    };
    
    const strategy = strategyReturns[portfolio.type] || strategyReturns['balanced'];
    const targetAnnualReturn = (strategy.min + strategy.max) / 2;
    const dailyReturn = targetAnnualReturn / 365;
    
    let currentValue = portfolio.current_value;
    const startDate = new Date();
    
    // Generate daily growth points
    for (let day = 0; day <= daysToSimulate; day++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + day);
      
      // Add some realistic market volatility
      const volatilityFactor = (Math.random() - 0.5) * strategy.volatility * 2;
      const dailyGrowth = dailyReturn + (volatilityFactor / 365);
      
      if (day > 0) {
        currentValue *= (1 + dailyGrowth);
      }
      
      growthTrend.push({
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        value: Math.round(currentValue * 100) / 100 // Round to 2 decimal places
      });
    }
    
    const finalValue = growthTrend[growthTrend.length - 1].value;
    
    return {
      portfolioId: portfolio.id,
      strategy: portfolio.type,
      monthsSimulated: months,
      daysSimulated: daysToSimulate,
      initialValue: portfolio.current_value,
      projectedValue: finalValue,
      totalGrowthPoints: growthTrend.length,
      simulationId: `fallback-sim-${Date.now()}-${portfolio.id}`,
      growth_trend: growthTrend
    };
  }
}

// Create a singleton instance
export const rbcAPI = new PortfolioAPIService();

// Export default instance for convenience
export default rbcAPI;
