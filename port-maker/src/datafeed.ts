// Simple datafeed implementation for TradingView
export class Datafeed {
  onReady(callback: (config: any) => void) {
    setTimeout(() => {
      callback({
        supported_resolutions: ['1', '5', '15', '30', '60', '1D', '1W', '1M'],
        supports_group_request: false,
        supports_marks: false,
        supports_search: true,
        supports_timescale_marks: false,
      });
    }, 0);
  }

  searchSymbols(userInput: string, exchange: string, symbolType: string, onResultReadyCallback: (symbols: any[]) => void) {
    // Simple symbol search - in a real implementation, you'd fetch from an API
    const symbols = [
      { symbol: 'AAPL', full_name: 'Apple Inc.', description: 'AAPL', exchange: 'NASDAQ', type: 'stock' },
      { symbol: 'GOOGL', full_name: 'Alphabet Inc.', description: 'GOOGL', exchange: 'NASDAQ', type: 'stock' },
      { symbol: 'MSFT', full_name: 'Microsoft Corporation', description: 'MSFT', exchange: 'NASDAQ', type: 'stock' },
      { symbol: 'TSLA', full_name: 'Tesla, Inc.', description: 'TSLA', exchange: 'NASDAQ', type: 'stock' },
    ];

    const filteredSymbols = symbols.filter(symbol => 
      symbol.symbol.toLowerCase().includes(userInput.toLowerCase()) ||
      symbol.full_name.toLowerCase().includes(userInput.toLowerCase())
    );

    setTimeout(() => onResultReadyCallback(filteredSymbols), 0);
  }

  resolveSymbol(symbolName: string, onSymbolResolvedCallback: (symbolInfo: any) => void, onResolveErrorCallback: (error: string) => void) {
    const symbolInfo = {
      name: symbolName,
      full_name: symbolName,
      description: symbolName,
      type: 'stock',
      session: '0930-1600',
      timezone: 'America/New_York',
      ticker: symbolName,
      exchange: 'NASDAQ',
      minmov: 1,
      pricescale: 100,
      has_intraday: true,
      has_no_volume: false,
      has_weekly_and_monthly: true,
      supported_resolutions: ['1', '5', '15', '30', '60', '1D', '1W', '1M'],
      volume_precision: 0,
      data_status: 'streaming',
    };

    setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
  }

  getBars(symbolInfo: any, resolution: string, periodParams: any, onHistoryCallback: (bars: any[], meta: any) => void, onErrorCallback: (error: string) => void) {
    const { from, to } = periodParams;
    const symbol = symbolInfo.name;

    // Map TradingView resolution to yfinance interval
    const interval = this.mapResolutionToYfinance(resolution);
    if (!interval) {
        onErrorCallback(`Unsupported resolution: ${resolution}`);
        return;
    }

    // Calculate period based on requested time range
    const fromDate = new Date(from * 1000);
    const toDate = new Date(to * 1000);
    const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 3600 * 24));
    
    // Use longer periods to ensure we get enough data
    let period = '3mo'; // Default to 3 months for better MA/BB calculations
    if (diffDays > 90) period = '6mo';
    if (diffDays > 180) period = '1y';
    if (diffDays > 365) period = '2y';
    if (diffDays > 730) period = '5y';


    const backendUrl = `http://127.0.0.1:5001/history?symbol=${symbol}&period=${period}&interval=${interval}`;

    fetch(backendUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }

            if (!Array.isArray(data)) {
              throw new Error("Invalid data format from backend");
            }

            const bars = data.map(d => ({
                ...d,
                time: d.time * 1000, // Convert seconds to milliseconds
            }));
            
            onHistoryCallback(bars, { noData: bars.length === 0 });
        })
        .catch(error => {
            console.error('Failed to fetch bars:', error);
            onErrorCallback(error.message);
        });
  }

  subscribeBars(symbolInfo: any, resolution: string, onRealtimeCallback: (bar: any) => void, subscriberUID: string, onResetCacheNeededCallback: () => void) {
    // For now, we'll keep real-time updates mocked, as setting up a real-time stream is more complex.
    // In a real application, you'd connect to a WebSocket or use polling.
    console.log(`Subscribing to real-time updates for ${symbolInfo.name}`);
    // You can leave this empty or with a simple mock update for demonstration
  }

  unsubscribeBars(subscriberUID: string) {
    console.log(`Unsubscribing from real-time updates: ${subscriberUID}`);
    // Clear any intervals or connections associated with the subscriberUID
  }

  private mapResolutionToYfinance(resolution: string): string | null {
      // Mapping from TradingView resolutions to yfinance intervals
      // yfinance intervals: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
      const mapping: { [key: string]: string } = {
          '1': '1m',
          '5': '5m',
          '15': '15m',
          '30': '30m',
          '60': '1h',
          '1D': '1d',
          '1W': '1wk',
          '1M': '1mo',
      };

      return mapping[resolution] || null;
  }

  public getTimeStep(resolution: string): number {
    switch (resolution) {
      case '1': return 60;
      case '5': return 300;
      case '15': return 900;
      case '30': return 1800;
      case '60': return 3600;
      case '1D': return 86400;
      case '1W': return 604800;
      case '1M': return 2592000;
      default: return 86400; // Default to 1 day
    }
  }
}
