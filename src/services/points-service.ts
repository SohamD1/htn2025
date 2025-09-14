interface PointsData {
  totalPoints: number;
  lastUpdated: string;
}

interface PointsListener {
  (points: number): void;
}

class PointsService {
  private static instance: PointsService;
  private listeners: PointsListener[] = [];
  private currentClientId: string | null = null;
  private storageKeyPrefix = 'crib_quest_points_';

  private constructor() {}

  static getInstance(): PointsService {
    if (!PointsService.instance) {
      PointsService.instance = new PointsService();
    }
    return PointsService.instance;
  }

  // Set the current client ID for points tracking
  setCurrentClient(clientId: string | null): void {
    if (this.currentClientId !== clientId) {
      this.currentClientId = clientId;
      // Notify listeners of the points change for the new client
      this.notifyListeners(this.getTotalPoints());
    }
  }

  // Get the storage key for the current client
  private getStorageKey(): string {
    if (!this.currentClientId) {
      return this.storageKeyPrefix + 'default';
    }
    return this.storageKeyPrefix + this.currentClientId;
  }

  // Get current total points for the active client
  getTotalPoints(): number {
    try {
      const stored = localStorage.getItem(this.getStorageKey());
      if (stored) {
        const data: PointsData = JSON.parse(stored);
        return data.totalPoints || 0;
      }
    } catch (error) {
      console.error('Error reading points from localStorage:', error);
    }
    return 0;
  }

  // Add points to the total
  addPoints(amount: number): number {
    const currentPoints = this.getTotalPoints();
    const newTotal = currentPoints + amount;
    this.setTotalPoints(newTotal);
    return newTotal;
  }

  // Subtract points from the total (for upgrades, etc.)
  subtractPoints(amount: number): number {
    const currentPoints = this.getTotalPoints();
    const newTotal = Math.max(0, currentPoints - amount);
    this.setTotalPoints(newTotal);
    return newTotal;
  }

  // Set total points directly for the active client
  setTotalPoints(points: number): void {
    try {
      const data: PointsData = {
        totalPoints: Math.max(0, points),
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
      
      // Notify all listeners of the change
      this.notifyListeners(data.totalPoints);
    } catch (error) {
      console.error('Error saving points to localStorage:', error);
    }
  }

  // Check if user has enough points for a purchase/upgrade
  hasEnoughPoints(requiredAmount: number): boolean {
    return this.getTotalPoints() >= requiredAmount;
  }

  // Subscribe to points changes
  subscribe(listener: PointsListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners of points change
  private notifyListeners(points: number): void {
    this.listeners.forEach(listener => {
      try {
        listener(points);
      } catch (error) {
        console.error('Error notifying points listener:', error);
      }
    });
  }

  // Reset points for the current client
  resetPoints(): void {
    this.setTotalPoints(0);
  }

  // Reset points for a specific client
  resetPointsForClient(clientId: string): void {
    try {
      const storageKey = this.storageKeyPrefix + clientId;
      localStorage.removeItem(storageKey);
      
      // If this is the current client, notify listeners
      if (this.currentClientId === clientId) {
        this.notifyListeners(0);
      }
    } catch (error) {
      console.error('Error resetting points for client:', error);
    }
  }

  // Get points data with metadata for the active client
  getPointsData(): PointsData {
    try {
      const stored = localStorage.getItem(this.getStorageKey());
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading points data from localStorage:', error);
    }
    
    return {
      totalPoints: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  // Get current client ID
  getCurrentClientId(): string | null {
    return this.currentClientId;
  }
}

// Export singleton instance
export const pointsService = PointsService.getInstance();
export default pointsService;
