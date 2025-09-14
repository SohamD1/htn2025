import { Datafeed } from './datafeed';

export class AnalysisService {
  private datafeed: Datafeed;

  constructor() {
    this.datafeed = new Datafeed();
  }

  async findKeyLevels(symbol: string): Promise<KeyLevels> {
    try {
      // Get recent price data (90 days)
      const now = Math.floor(Date.now() / 1000);
      const threeMonthsAgo = now - (90 * 24 * 60 * 60);

      const bars = await this.getBarsForRange('1D', threeMonthsAgo, now, symbol);

      if (bars.length < 20) {
        throw new Error('Insufficient data for analysis');
      }

      // Extract price data
      const highs = bars.map(b => b.high);
      const lows = bars.map(b => b.low);
      const closes = bars.map(b => b.close);
      const volumes = bars.map(b => b.volume);

      // Find support and resistance levels
      const support = this.findSupportLevels(lows, closes, volumes);
      const resistance = this.findResistanceLevels(highs, closes, volumes);

      // Calculate fibonacci levels from recent swing
      const recentHigh = Math.max(...highs.slice(-30));
      const recentLow = Math.min(...lows.slice(-30));
      const fibLevels = this.calculateFibonacciLevels(recentLow, recentHigh);

      // Calculate moving averages
      const currentPrice = closes[closes.length - 1];
      const ma20 = this.calculateSMA(closes, 20);
      const ma50 = this.calculateSMA(closes, 50);

      return {
        currentPrice,
        support,
        resistance,
        fibonacci: fibLevels,
        movingAverages: {
          ma20: ma20[ma20.length - 1],
          ma50: ma50.length > 0 ? ma50[ma50.length - 1] : null
        },
        priceRange: {
          high: recentHigh,
          low: recentLow
        }
      };
    } catch (error) {
      console.error('Error finding key levels:', error);
      throw error;
    }
  }

  private findSupportLevels(lows: number[], closes: number[], volumes: number[]): number[] {
    const levels: number[] = [];
    const priceFrequency = new Map<number, number>();

    // Round prices to nearest dollar for grouping
    lows.forEach((low, i) => {
      const roundedLow = Math.round(low);
      const currentFreq = priceFrequency.get(roundedLow) || 0;
      // Weight by volume
      const weight = volumes[i] > 0 ? Math.log(volumes[i]) : 1;
      priceFrequency.set(roundedLow, currentFreq + weight);
    });

    // Also check closes for support
    closes.forEach((close, i) => {
      const roundedClose = Math.round(close);
      const currentFreq = priceFrequency.get(roundedClose) || 0;
      const weight = volumes[i] > 0 ? Math.log(volumes[i]) : 1;
      priceFrequency.set(roundedClose, currentFreq + weight * 0.5);
    });

    // Sort by frequency and get top levels
    const sortedLevels = Array.from(priceFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([price]) => price)
      .sort((a, b) => a - b);

    return sortedLevels;
  }

  private findResistanceLevels(highs: number[], closes: number[], volumes: number[]): number[] {
    const levels: number[] = [];
    const priceFrequency = new Map<number, number>();

    // Round prices to nearest dollar for grouping
    highs.forEach((high, i) => {
      const roundedHigh = Math.round(high);
      const currentFreq = priceFrequency.get(roundedHigh) || 0;
      // Weight by volume
      const weight = volumes[i] > 0 ? Math.log(volumes[i]) : 1;
      priceFrequency.set(roundedHigh, currentFreq + weight);
    });

    // Also check closes for resistance
    closes.forEach((close, i) => {
      const roundedClose = Math.round(close);
      const currentFreq = priceFrequency.get(roundedClose) || 0;
      const weight = volumes[i] > 0 ? Math.log(volumes[i]) : 1;
      priceFrequency.set(roundedClose, currentFreq + weight * 0.5);
    });

    // Sort by frequency and get top levels
    const sortedLevels = Array.from(priceFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([price]) => price)
      .sort((a, b) => b - a);

    return sortedLevels;
  }

  private calculateFibonacciLevels(low: number, high: number): FibonacciLevels {
    const diff = high - low;
    return {
      0: low,
      0.236: low + diff * 0.236,
      0.382: low + diff * 0.382,
      0.5: low + diff * 0.5,
      0.618: low + diff * 0.618,
      0.786: low + diff * 0.786,
      1: high
    };
  }

  private calculateSMA(data: number[], period: number): number[] {
    if (period <= 0 || data.length < period) {
      return [];
    }

    const sma: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const sum = slice.reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  private async getBarsForRange(resolution: string, from: number, to: number, symbol: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.datafeed.getBars(
        { name: symbol },
        resolution,
        { from, to },
        (bars, meta) => {
          if (meta.noData) {
            resolve([]);
          } else {
            resolve(bars);
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  generateCommandsFromAnalysis(levels: KeyLevels): string[] {
    const commands: string[] = [];

    // Add support levels
    if (levels.support.length > 0) {
      commands.push(`support ${levels.support[0].toFixed(0)}`);
      if (levels.support.length > 1) {
        commands.push(`support ${levels.support[1].toFixed(0)}`);
      }
    }

    // Add resistance levels
    if (levels.resistance.length > 0) {
      commands.push(`resistance ${levels.resistance[0].toFixed(0)}`);
      if (levels.resistance.length > 1) {
        commands.push(`resistance ${levels.resistance[1].toFixed(0)}`);
      }
    }

    // Add fibonacci if there's a clear range
    if (levels.priceRange) {
      commands.push(`fib ${levels.priceRange.low.toFixed(0)} ${levels.priceRange.high.toFixed(0)}`);
    }

    // Add moving averages if they're significant
    if (levels.movingAverages.ma20) {
      commands.push(`hline ${levels.movingAverages.ma20.toFixed(0)}`);
    }

    return commands;
  }
}

export interface KeyLevels {
  currentPrice: number;
  support: number[];
  resistance: number[];
  fibonacci: FibonacciLevels;
  movingAverages: {
    ma20: number | null;
    ma50: number | null;
  };
  priceRange: {
    high: number;
    low: number;
  };
}

interface FibonacciLevels {
  0: number;
  0.236: number;
  0.382: number;
  0.5: number;
  0.618: number;
  0.786: number;
  1: number;
}

export const analysisService = new AnalysisService();