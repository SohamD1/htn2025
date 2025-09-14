// Portfolio Simulation & Market Sandbox API Service
// Base URL for the API
const BASE_URL = process.env.REACT_APP_API_URL;

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
      this.token = localStorage.getItem('portfolio_api_token');
    }
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('portfolio_api_token', token);
    }
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('portfolio_api_token');
    }
  }

  // Get authorization headers
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
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
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
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

  // Client Management Methods
  async createClient(data: ClientCreate): Promise<Client> {
    return this.request<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
    return this.request<Portfolio>(`/clients/${clientId}/portfolios`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getClientPortfolios(clientId: string): Promise<Portfolio[]> {
    return this.request<Portfolio[]>(`/clients/${clientId}/portfolios`);
  }

  async getPortfolio(portfolioId: string): Promise<Portfolio> {
    return this.request<Portfolio>(`/portfolios/${portfolioId}`);
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
    return this.request<MultipleSimulationResponse>(`/client/${clientId}/simulate`, {
      method: 'POST',
      body: JSON.stringify({ months }),
    });
  }
}

// Create a singleton instance
export const rbcAPI = new PortfolioAPIService();

// Export default instance for convenience
export default rbcAPI;
