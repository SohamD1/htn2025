// Portfolio service to handle backend RBC data integration
class PortfolioService {
  private readonly BACKEND_URL = 'http://localhost:3001/api';

  // Get auth token from localStorage
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Make authenticated API request
  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.BACKEND_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  }

  // Get RBC clients from backend
  async getBackendClients(): Promise<any[]> {
    try {
      const response = await this.apiRequest<any>('/rbc/clients');
      return response.clients || [];
    } catch (error) {
      console.error('Failed to fetch backend clients:', error);
      throw error;
    }
  }

  // Get portfolios for a specific RBC client from backend
  async getBackendPortfolios(rbcClientId?: string): Promise<any[]> {
    try {
      let endpoint = '/rbc/portfolios';
      if (rbcClientId) {
        endpoint += `?rbc_client_id=${rbcClientId}`;
      }

      const response = await this.apiRequest<any>(endpoint);
      return response.portfolios || [];
    } catch (error) {
      console.error('Failed to fetch backend portfolios:', error);
      throw error;
    }
  }

  // Get simulations for a specific RBC client from backend
  async getBackendSimulations(rbcClientId?: string, limit = 10): Promise<any[]> {
    try {
      let endpoint = '/rbc/simulations';
      const params = new URLSearchParams();
      if (rbcClientId) {
        params.append('rbc_client_id', rbcClientId);
      }
      params.append('limit', limit.toString());

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const response = await this.apiRequest<any>(endpoint);
      return response.simulations || [];
    } catch (error) {
      console.error('Failed to fetch backend simulations:', error);
      throw error;
    }
  }

  // Save RBC client data to backend
  async saveClientToBackend(clientData: {
    rbc_client_id: string;
    name: string;
    email: string;
    team_name: string;
    cash: number;
    rbc_created_at?: string;
    rbc_updated_at?: string;
  }): Promise<any> {
    try {
      const response = await this.apiRequest<any>('/rbc/clients', {
        method: 'POST',
        body: JSON.stringify({
          ...clientData,
          rbc_created_at: clientData.rbc_created_at || new Date().toISOString(),
          rbc_updated_at: clientData.rbc_updated_at || new Date().toISOString()
        }),
      });
      return response;
    } catch (error) {
      console.error('Failed to save client to backend:', error);
      throw error;
    }
  }

  // Save RBC portfolio data to backend
  async savePortfolioToBackend(portfolioData: {
    rbc_client_id: string;
    rbc_portfolio_id: string;
    team_name: string;
    type: 'aggressive_growth' | 'growth' | 'balanced' | 'conservative' | 'very_conservative';
    invested_amount: number;
    current_value: number;
    total_months_simulated?: number;
    transactions?: Array<{
      rbc_transaction_id: string;
      date: string;
      type: 'deposit' | 'withdraw' | 'growth';
      amount: number;
      balance_after: number;
    }>;
    growth_trend?: Array<{
      date: string;
      value: number;
    }>;
    rbc_created_at?: string;
  }): Promise<any> {
    try {
      const response = await this.apiRequest<any>('/rbc/portfolios', {
        method: 'POST',
        body: JSON.stringify({
          ...portfolioData,
          total_months_simulated: portfolioData.total_months_simulated || 0,
          transactions: portfolioData.transactions || [],
          growth_trend: portfolioData.growth_trend || [],
          rbc_created_at: portfolioData.rbc_created_at || new Date().toISOString()
        }),
      });
      return response;
    } catch (error) {
      console.error('Failed to save portfolio to backend:', error);
      throw error;
    }
  }

  // Save RBC simulation data to backend
  async saveSimulationToBackend(simulationData: {
    rbc_client_id: string;
    simulation_type?: 'api' | 'fallback';
    months_requested: number;
    message: string;
    results: Array<{
      rbc_portfolio_id: string;
      strategy: 'aggressive_growth' | 'growth' | 'balanced' | 'conservative' | 'very_conservative';
      months_simulated: number;
      days_simulated: number;
      initial_value: number;
      projected_value: number;
      total_growth_points: number;
      simulation_id: string;
      growth_trend?: Array<{
        date: string;
        value: number;
      }>;
    }>;
  }): Promise<any> {
    try {
      const response = await this.apiRequest<any>('/rbc/simulations', {
        method: 'POST',
        body: JSON.stringify({
          ...simulationData,
          simulation_type: simulationData.simulation_type || 'api'
        }),
      });
      return response;
    } catch (error) {
      console.error('Failed to save simulation to backend:', error);
      throw error;
    }
  }

  // Sync RBC data from API to backend
  async syncRBCDataToBackend(rbcClientId: string, rbcApiData: any): Promise<{
    clients: any[];
    portfolios: any[];
    simulations: any[];
  }> {
    const results = {
      clients: [] as any[],
      portfolios: [] as any[],
      simulations: [] as any[]
    };

    try {
      console.log('🔄 Syncing RBC data to backend for client:', rbcClientId);

      // Sync client data if provided
      if (rbcApiData.client) {
        const clientResult = await this.saveClientToBackend({
          rbc_client_id: rbcClientId,
          name: rbcApiData.client.name,
          email: rbcApiData.client.email,
          team_name: rbcApiData.client.teamName || 'Investment Team',
          cash: rbcApiData.client.cash || 0,
          rbc_created_at: rbcApiData.client.createdAt,
          rbc_updated_at: rbcApiData.client.updatedAt
        });
        results.clients.push(clientResult.client);
      }

      // Sync portfolio data if provided
      if (rbcApiData.portfolios && rbcApiData.portfolios.length > 0) {
        for (const portfolio of rbcApiData.portfolios) {
          try {
            const portfolioResult = await this.savePortfolioToBackend({
              rbc_client_id: rbcClientId,
              rbc_portfolio_id: portfolio.id,
              team_name: portfolio.teamName || 'Investment Team',
              type: portfolio.type || 'balanced',
              invested_amount: portfolio.investedAmount || 0,
              current_value: portfolio.currentValue || 0,
              total_months_simulated: portfolio.totalMonthsSimulated,
              transactions: portfolio.transactions,
              growth_trend: portfolio.growthTrend,
              rbc_created_at: portfolio.createdAt
            });
            results.portfolios.push(portfolioResult.portfolio);
          } catch (portError) {
            console.warn('Failed to sync portfolio:', portfolio.id, portError);
          }
        }
      }

      console.log('✅ RBC data sync completed:', results);
      return results;

    } catch (error) {
      console.error('❌ Failed to sync RBC data to backend:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const portfolioService = new PortfolioService();
export default portfolioService;