// RBC Data Synchronization Service
// Syncs RBC API data with our MongoDB backend

import { Client, Portfolio, MultipleSimulationResponse } from './rbc-service';

class RBCSyncService {
  private static instance: RBCSyncService;
  private readonly BACKEND_URL = 'http://localhost:3001/api';

  private constructor() {}

  public static getInstance(): RBCSyncService {
    if (!RBCSyncService.instance) {
      RBCSyncService.instance = new RBCSyncService();
    }
    return RBCSyncService.instance;
  }

  // Generic API request method
  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`${this.BACKEND_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.message || 'API request failed');
    }

    return response.json();
  }

  // Save RBC Client to backend
  async saveClient(client: Client): Promise<void> {
    try {
      console.log('Saving RBC client to backend:', client.id);
      
      await this.apiRequest('/rbc/clients', {
        method: 'POST',
        body: JSON.stringify({
          rbc_client_id: client.id,
          name: client.name,
          email: client.email,
          team_name: client.team_name,
          cash: client.cash,
          rbc_created_at: client.created_at,
          rbc_updated_at: client.updated_at
        }),
      });
      
      console.log('RBC client saved to backend successfully');
    } catch (error) {
      console.error('Failed to save RBC client to backend:', error);
      // Don't throw - this is a background sync operation
    }
  }

  // Save RBC Portfolio to backend
  async savePortfolio(portfolio: Portfolio): Promise<void> {
    try {
      console.log('Saving RBC portfolio to backend:', portfolio.id);
      
      await this.apiRequest('/rbc/portfolios', {
        method: 'POST',
        body: JSON.stringify({
          rbc_client_id: portfolio.client_id,
          rbc_portfolio_id: portfolio.id,
          team_name: portfolio.team_name,
          type: portfolio.type,
          invested_amount: portfolio.invested_amount,
          current_value: portfolio.current_value,
          total_months_simulated: portfolio.total_months_simulated,
          transactions: portfolio.transactions,
          growth_trend: portfolio.growth_trend,
          rbc_created_at: portfolio.created_at
        }),
      });
      
      console.log('RBC portfolio saved to backend successfully');
    } catch (error) {
      console.error('Failed to save RBC portfolio to backend:', error);
      // Don't throw - this is a background sync operation
    }
  }

  // Save RBC Simulation to backend
  async saveSimulation(clientId: string, simulationResponse: MultipleSimulationResponse): Promise<void> {
    try {
      console.log('Saving RBC simulation to backend for client:', clientId);
      
      await this.apiRequest('/rbc/simulations', {
        method: 'POST',
        body: JSON.stringify({
          rbc_client_id: clientId,
          simulation_type: simulationResponse.message.includes('fallback') ? 'fallback' : 'api',
          months_requested: simulationResponse.results.length > 0 ? simulationResponse.results[0].monthsSimulated : 1,
          message: simulationResponse.message,
          results: simulationResponse.results.map(result => ({
            rbc_portfolio_id: result.portfolioId,
            strategy: result.strategy,
            months_simulated: result.monthsSimulated,
            days_simulated: result.daysSimulated,
            initial_value: result.initialValue,
            projected_value: result.projectedValue,
            total_growth_points: result.totalGrowthPoints,
            simulation_id: result.simulationId,
            growth_trend: result.growth_trend
          }))
        }),
      });
      
      console.log('RBC simulation saved to backend successfully');
    } catch (error) {
      console.error('Failed to save RBC simulation to backend:', error);
      // Don't throw - this is a background sync operation
    }
  }

  // Load RBC Clients from backend
  async loadClients(): Promise<Client[]> {
    try {
      console.log('Loading RBC clients from backend...');
      
      const response = await this.apiRequest<{ success: boolean; clients: any[] }>('/rbc/clients');
      
      if (response.success && response.clients) {
        const clients: Client[] = response.clients.map(client => ({
          id: client.rbc_client_id,
          name: client.name,
          email: client.email,
          team_name: client.team_name,
          portfolios: [], // Will be loaded separately
          cash: client.cash,
          created_at: client.rbc_created_at || client.created_at,
          updated_at: client.rbc_updated_at || client.updated_at
        }));
        
        console.log('Loaded RBC clients from backend:', clients.length);
        return clients;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to load RBC clients from backend:', error);
      return [];
    }
  }

  // Load RBC Portfolios from backend
  async loadPortfolios(clientId?: string): Promise<Portfolio[]> {
    try {
      console.log('Loading RBC portfolios from backend...');
      
      const queryParams = clientId ? `?rbc_client_id=${clientId}` : '';
      const response = await this.apiRequest<{ success: boolean; portfolios: any[] }>(`/rbc/portfolios${queryParams}`);
      
      if (response.success && response.portfolios) {
        const portfolios: Portfolio[] = response.portfolios.map(portfolio => ({
          id: portfolio.rbc_portfolio_id,
          client_id: portfolio.rbc_client_id,
          team_name: portfolio.team_name,
          type: portfolio.type,
          created_at: portfolio.rbc_created_at || portfolio.created_at,
          invested_amount: portfolio.invested_amount,
          current_value: portfolio.current_value,
          total_months_simulated: portfolio.total_months_simulated,
          transactions: portfolio.transactions,
          growth_trend: portfolio.growth_trend
        }));
        
        console.log('Loaded RBC portfolios from backend:', portfolios.length);
        return portfolios;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to load RBC portfolios from backend:', error);
      return [];
    }
  }

  // Load RBC Simulations from backend
  async loadSimulations(clientId?: string, limit: number = 10): Promise<any[]> {
    try {
      console.log('Loading RBC simulations from backend...');
      
      const queryParams = new URLSearchParams();
      if (clientId) queryParams.append('rbc_client_id', clientId);
      queryParams.append('limit', limit.toString());
      
      const response = await this.apiRequest<{ success: boolean; simulations: any[] }>(`/rbc/simulations?${queryParams}`);
      
      if (response.success && response.simulations) {
        console.log('Loaded RBC simulations from backend:', response.simulations.length);
        return response.simulations;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to load RBC simulations from backend:', error);
      return [];
    }
  }

  // Sync all RBC data for a user (called on login)
  async syncUserData(): Promise<{ clients: Client[]; portfolios: Portfolio[] }> {
    try {
      console.log('Starting full RBC data sync...');
      
      const clients = await this.loadClients();
      const portfolios = await this.loadPortfolios();
      
      // Store in localStorage for offline access
      if (clients.length > 0) {
        localStorage.setItem('rbc_clients_cache', JSON.stringify(clients));
      }
      
      if (portfolios.length > 0) {
        localStorage.setItem('rbc_portfolios_cache', JSON.stringify(portfolios));
        
        // Also update localStorage portfolio tracking
        const portfoliosByClient: Record<string, string[]> = {};
        portfolios.forEach(portfolio => {
          if (!portfoliosByClient[portfolio.client_id]) {
            portfoliosByClient[portfolio.client_id] = [];
          }
          portfoliosByClient[portfolio.client_id].push(portfolio.id);
        });
        
        // Update localStorage portfolio tracking
        Object.entries(portfoliosByClient).forEach(([clientId, portfolioIds]) => {
          const key = `client_portfolios_${clientId}`;
          localStorage.setItem(key, JSON.stringify(portfolioIds));
        });
      }
      
      console.log('RBC data sync completed:', { clients: clients.length, portfolios: portfolios.length });
      
      return { clients, portfolios };
    } catch (error) {
      console.error('RBC data sync failed:', error);
      return { clients: [], portfolios: [] };
    }
  }

  // Clear cached data (called on logout)
  clearCache(): void {
    localStorage.removeItem('rbc_clients_cache');
    localStorage.removeItem('rbc_portfolios_cache');
    
    // Clear portfolio tracking data
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('client_portfolios_')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('RBC cache cleared');
  }
}

// Export singleton instance
export const rbcSyncService = RBCSyncService.getInstance();
export default rbcSyncService;
