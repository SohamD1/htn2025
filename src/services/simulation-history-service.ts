import { SimulationResult } from './rbc-service';

export interface SavedSimulation {
  id: string;
  clientId: string;
  clientName: string;
  timestamp: string;
  monthsSimulated: number;
  results: SimulationResult[];
  summary: {
    totalInitial: number;
    totalProjected: number;
    totalGrowth: number;
    growthPercentage: string;
  };
}

class SimulationHistoryService {
  private static instance: SimulationHistoryService;
  private storageKey = 'simulation_history';

  private constructor() {}

  static getInstance(): SimulationHistoryService {
    if (!SimulationHistoryService.instance) {
      SimulationHistoryService.instance = new SimulationHistoryService();
    }
    return SimulationHistoryService.instance;
  }

  // Save a new simulation result
  saveSimulation(
    clientId: string,
    clientName: string,
    monthsSimulated: number,
    results: SimulationResult[]
  ): SavedSimulation {
    const summary = this.calculateSummary(results);
    
    const savedSimulation: SavedSimulation = {
      id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientId,
      clientName,
      timestamp: new Date().toISOString(),
      monthsSimulated,
      results,
      summary
    };

    const existingSimulations = this.getAllSimulations();
    const updatedSimulations = [savedSimulation, ...existingSimulations];
    
    // Keep only the last 50 simulations to prevent localStorage bloat
    const trimmedSimulations = updatedSimulations.slice(0, 50);
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(trimmedSimulations));
    } catch (error) {
      console.error('Failed to save simulation to localStorage:', error);
      // If storage is full, try removing older simulations
      const reducedSimulations = updatedSimulations.slice(0, 20);
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(reducedSimulations));
      } catch (secondError) {
        console.error('Failed to save even reduced simulation history:', secondError);
      }
    }

    return savedSimulation;
  }

  // Get all saved simulations
  getAllSimulations(): SavedSimulation[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading simulation history from localStorage:', error);
    }
    return [];
  }

  // Get simulations for a specific client
  getClientSimulations(clientId: string): SavedSimulation[] {
    return this.getAllSimulations().filter(sim => sim.clientId === clientId);
  }

  // Get a specific simulation by ID
  getSimulationById(id: string): SavedSimulation | null {
    const simulations = this.getAllSimulations();
    return simulations.find(sim => sim.id === id) || null;
  }

  // Delete a simulation
  deleteSimulation(id: string): boolean {
    const simulations = this.getAllSimulations();
    const filteredSimulations = simulations.filter(sim => sim.id !== id);
    
    if (filteredSimulations.length !== simulations.length) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(filteredSimulations));
        return true;
      } catch (error) {
        console.error('Failed to delete simulation:', error);
      }
    }
    return false;
  }

  // Clear all simulation history
  clearAllHistory(): boolean {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Failed to clear simulation history:', error);
      return false;
    }
  }

  // Calculate summary statistics for simulation results
  private calculateSummary(results: SimulationResult[]) {
    const totalInitial = results.reduce((sum, r) => sum + r.initialValue, 0);
    const totalProjected = results.reduce((sum, r) => sum + r.projectedValue, 0);
    const totalGrowth = totalProjected - totalInitial;
    const growthPercentage = totalInitial > 0 ? (totalGrowth / totalInitial * 100).toFixed(2) : '0';

    return {
      totalInitial,
      totalProjected,
      totalGrowth,
      growthPercentage
    };
  }

  // Get statistics about simulation history
  getHistoryStats() {
    const simulations = this.getAllSimulations();
    const uniqueClients = new Set(simulations.map(sim => sim.clientId)).size;
    const totalSimulations = simulations.length;
    const avgGrowth = simulations.length > 0 
      ? simulations.reduce((sum, sim) => sum + parseFloat(sim.summary.growthPercentage), 0) / simulations.length
      : 0;

    return {
      totalSimulations,
      uniqueClients,
      averageGrowthPercentage: avgGrowth.toFixed(2),
      oldestSimulation: simulations.length > 0 ? simulations[simulations.length - 1].timestamp : null,
      newestSimulation: simulations.length > 0 ? simulations[0].timestamp : null
    };
  }
}

// Export singleton instance
export const simulationHistoryService = SimulationHistoryService.getInstance();
export default simulationHistoryService;
