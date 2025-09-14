/// <reference path="./types/tradingview.d.ts" />

// Using RBC InvestIQ advanced charting - integrated trading platform
import { Datafeed } from './datafeed';

export class ChartManager {
  private widget: TradingView.IChartingLibraryWidget | null = null;
  private chartApi: TradingView.IChartApi | null = null;
  private shapes: any[] = [];
  private datafeed: Datafeed;
  public currentSymbol: string = 'AAPL';

  constructor() {
    this.datafeed = new Datafeed();
  }

  async initializeChart(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Load RBC InvestIQ charting library
        this.loadTradingViewLibrary().then(() => {
          // Use RBC InvestIQ's advanced charting widget
          this.widget = new window.TradingView.widget({
            width: '100%',
            height: '100%',
            symbol: 'NASDAQ:AAPL',
            interval: 'D',
            container_id: 'investiq_chart',
            timezone: 'Etc/UTC',
            theme: 'dark',
            style: '1',
            locale: 'en',
            toolbar_bg: '#f1f3f6',
            enable_publishing: false,
            allow_symbol_change: true,
            disabled_features: [],
            enabled_features: [],
            studies: [
              'Volume@tv-basicstudies'
            ],
            show_popup_button: true,
            popup_width: '1000',
            popup_height: '650'
          });

          // Wait longer for the widget to fully initialize
          setTimeout(() => {
            console.log('Chart widget loaded and ready for symbol changes');
            resolve();
          }, 3000); // Increased delay for better reliability
        }).catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async loadTradingViewLibrary(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.TradingView) {
        resolve();
        return;
      }

      // Load the RBC InvestIQ charting library
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        console.log('RBC InvestIQ charting library loaded successfully');
        resolve();
      };
      script.onerror = (error) => {
        console.error('Failed to load RBC InvestIQ charting library:', error);
        reject(new Error('Failed to load RBC InvestIQ charting library'));
      };
      
      document.head.appendChild(script);
    });
  }

  addHorizontalLine(price: number, color: string = '#2196F3'): void {
    try {
      // Method 1: Try to activate horizontal line drawing tool
      this.activateHorizontalLineTool(price, color);
      
      // Method 2: Create a visual overlay on top of the chart
      this.createHorizontalLineOverlay(price, color);
      
      console.log(`Added horizontal line at price: ${price}`);
    } catch (error) {
      console.error('Error adding horizontal line:', error);
      this.showDrawingInstruction(`Draw horizontal line at $${price}`, color);
    }
  }

  private activateHorizontalLineTool(price: number, color: string): void {
    // Try to programmatically activate RBC InvestIQ's horizontal line tool
    const iframe = document.querySelector('#investiq_chart iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      try {
        // Send message to RBC InvestIQ iframe to activate horizontal line tool
        iframe.contentWindow.postMessage({
          name: 'activate-tool',
          params: {
            tool: 'horizontal-line',
            price: price,
            color: color
          }
        }, '*');
      } catch (e) {
        console.log('Could not communicate with iframe');
      }
    }
  }

  private createHorizontalLineOverlay(price: number, color: string): void {
    const chartContainer = document.getElementById('investiq_chart');
    if (!chartContainer) return;

    // Create an overlay line that appears on top of the chart
    const line = document.createElement('div');
    line.className = 'price-line-overlay';
    line.style.cssText = `
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      background-color: ${color};
      z-index: 1000;
      pointer-events: none;
      box-shadow: 0 0 4px ${color}40;
    `;

    // Add price label
    const label = document.createElement('div');
    label.style.cssText = `
      position: absolute;
      right: 5px;
      top: -12px;
      background: ${color};
      color: white;
      padding: 2px 6px;
      font-size: 11px;
      font-family: monospace;
      border-radius: 2px;
      white-space: nowrap;
    `;
    label.textContent = `$${price.toFixed(2)}`;
    line.appendChild(label);

    // Position the line (this is approximate since we don't have exact price-to-pixel mapping)
    // In a real implementation, you'd need to calculate the exact position based on chart scale
    const approximateTop = this.calculatePricePosition(price);
    line.style.top = `${approximateTop}px`;

    chartContainer.appendChild(line);
    this.shapes.push({ element: line, price: price, type: 'horizontal' });
  }

  private calculatePricePosition(price: number): number {
    // This is a simplified calculation
    // In reality, you'd need to know the chart's price range and scale
    const chartContainer = document.getElementById('investiq_chart');
    if (!chartContainer) return 100;
    
    const containerHeight = chartContainer.offsetHeight;
    // Assume a price range for demonstration (this would need to be dynamic)
    const minPrice = 100;
    const maxPrice = 300;
    const priceRange = maxPrice - minPrice;
    const position = ((maxPrice - price) / priceRange) * containerHeight * 0.8; // 0.8 to account for margins
    
    return Math.max(50, Math.min(containerHeight - 50, position));
  }

  addVerticalLine(time: number, color: string = '#FF9800'): void {
    if (!this.chartApi) {
      console.error('Chart API not available');
      return;
    }

    try {
      const shape = this.chartApi.createShape(
        { time: time, price: 0 },
        {
          shape: 'vertical_line',
          lock: false,
          disableSelection: false,
          disableSave: false,
          disableUndo: false,
          overrides: {
            linecolor: color,
            linewidth: 2,
            linestyle: 0,
          }
        }
      );

      this.shapes.push(shape);
      console.log(`Added vertical line at time: ${new Date(time * 1000).toLocaleString()}`);
    } catch (error) {
      console.error('Error adding vertical line:', error);
    }
  }

  clearAllShapes(): void {
    console.log(`Clearing ${this.shapes.length} shapes/indicators`);
    
    this.shapes.forEach((shape, index) => {
      try {
        console.log(`Removing shape ${index}:`, shape.type || 'unknown');
        
        // Handle new wrapper-based shapes (MA, BB)
        if (shape.element && shape.element.parentNode) {
          shape.element.parentNode.removeChild(shape.element);
          console.log(`Removed element for shape ${index}`);
        }
        
        // Handle old-style shapes with separate labels
        if (shape.label && shape.label.parentNode) {
          shape.label.parentNode.removeChild(shape.label);
          console.log(`Removed label for shape ${index}`);
        }
        
        // Handle direct DOM elements (horizontal lines, etc.)
        if (!shape.element && !shape.label && shape.parentNode) {
          shape.parentNode.removeChild(shape);
          console.log(`Removed direct element for shape ${index}`);
        }
        
        // Handle RBC InvestIQ API shapes
        if (this.chartApi && typeof shape === 'object' && !shape.element && !shape.label) {
          this.chartApi.removeEntity(shape);
          console.log(`Removed RBC InvestIQ shape ${index}`);
        }
      } catch (error) {
        console.error(`Error removing shape ${index}:`, error);
      }
    });

    this.shapes = [];
    console.log('All shapes and indicators cleared');
  }

  changeSymbol(symbol: string): void {
    if (!this.widget) {
      console.error('❌ Widget not available for symbol change');
      throw new Error('Chart widget not initialized');
    }

    if (!symbol || symbol.trim() === '') {
      console.error('❌ Invalid symbol provided');
      throw new Error('Symbol cannot be empty');
    }

    const normalizedSymbol = symbol.trim().toUpperCase();
    this.currentSymbol = normalizedSymbol;

    // Use correct exchange prefixes for different stocks
    const nasdaqStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD', 'INTC', 'NFLX', 'ADBE'];
    const nyseStocks = ['CRM', 'ORCL', 'NOW', 'SHOP', 'SQ', 'UBER', 'SPOT', 'ZOOM', 'SNOW'];

    let symbolToUse: string;
    if (nasdaqStocks.includes(normalizedSymbol)) {
      symbolToUse = `NASDAQ:${normalizedSymbol}`;
    } else if (nyseStocks.includes(normalizedSymbol)) {
      symbolToUse = `NYSE:${normalizedSymbol}`;
    } else {
      // Default to NASDAQ for tech stocks
      symbolToUse = `NASDAQ:${normalizedSymbol}`;
    }

    console.log(`🔄 Attempting to change symbol to: ${symbolToUse}`);
    console.log('Available widget methods:', Object.keys(this.widget));

    // Try multiple approaches for symbol changing
    this.tryMultipleSymbolMethods(symbolToUse, normalizedSymbol);
  }

  private tryMultipleSymbolMethods(symbolToUse: string, normalizedSymbol: string): void {
    let success = false;

    // Method 1: Try setSymbol
    try {
      if (typeof this.widget.setSymbol === 'function') {
        console.log('Trying setSymbol method...');
        this.widget.setSymbol(symbolToUse, '1D');
        success = true;
        console.log(`✅ setSymbol worked for: ${symbolToUse}`);
      } else {
        console.log('setSymbol method not available');
      }
    } catch (error) {
      console.error('setSymbol failed:', error);
    }

    // Method 2: Try chart() API if available
    if (!success) {
      try {
        if (typeof this.widget.chart === 'function') {
          console.log('Trying chart().setSymbol method...');
          const chart = this.widget.chart();
          if (chart && typeof chart.setSymbol === 'function') {
            chart.setSymbol(symbolToUse);
            success = true;
            console.log(`✅ chart().setSymbol worked for: ${symbolToUse}`);
          }
        }
      } catch (error) {
        console.error('chart().setSymbol failed:', error);
      }
    }

    // Method 3: Try recreating the widget (last resort)
    if (!success) {
      console.log('Trying widget recreation method...');
      this.recreateWidgetWithNewSymbol(symbolToUse);
    }
  }

  private recreateWidgetWithNewSymbol(symbol: string): void {
    console.log(`🔄 Recreating widget with symbol: ${symbol}`);

    try {
      // Store the container
      const container = document.getElementById('investiq_chart');
      if (!container) {
        console.error('Chart container not found');
        return;
      }

      // Clear the container
      container.innerHTML = '';

      // Recreate the widget with new symbol
      this.widget = new window.TradingView.widget({
        width: '100%',
        height: '100%',
        symbol: symbol,
        interval: 'D',
        container_id: 'investiq_chart',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: true,
        disabled_features: [],
        enabled_features: [],
        studies: [
          'Volume@tv-basicstudies'
        ],
        show_popup_button: true,
        popup_width: '1000',
        popup_height: '650'
      });

      console.log(`✅ Widget recreated with symbol: ${symbol}`);
    } catch (error) {
      console.error('Failed to recreate widget:', error);
    }
  }


  private showDrawingInstruction(instruction: string, color: string): void {
    // Create an overlay instruction for the user
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid ${color};
      z-index: 10000;
      font-family: monospace;
      font-size: 14px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;
    overlay.textContent = `Manual action needed: ${instruction}`;
    
    document.body.appendChild(overlay);
    
    setTimeout(() => {
      if (overlay.parentNode) {
        document.body.removeChild(overlay);
      }
    }, 4000);
  }

  // Alternative method using RBC InvestIQ's drawing toolbar
  activateDrawingTool(toolName: string): void {
    if (!this.chartApi) {
      console.error('Chart API not available');
      return;
    }

    try {
      // Try to activate drawing tools via the API
      this.chartApi.executeActionById(`linetool${toolName}`);
      console.log(`Activated drawing tool: ${toolName}`);
    } catch (error) {
      console.error('Could not activate drawing tool:', error);
    }
  }

  async addMovingAverage(period: number, type: 'sma' | 'ema', color: string = '#FFA500'): Promise<void> {
    try {
      console.log(`Creating ${type.toUpperCase()}(${period}) moving average with color ${color}`);
      await this.createMovingAverageOverlay(period, type, color);
      console.log(`Added ${type.toUpperCase()}(${period}) moving average`);
    } catch (error) {
      console.error('Error adding moving average:', error);
    }
  }

  private async createMovingAverageOverlay(period: number, type: 'sma' | 'ema', color: string): Promise<void> {
    const chartContainer = document.getElementById('investiq_chart');
    if (!chartContainer) {
      console.error('Chart container not found for MA overlay');
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    `;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: visible; /* Ensure lines aren't clipped */
    `;

    // --- NEW: Use <polyline> instead of <path> ---
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    const points = await this.generateMAPoints(period, type);
    
    polyline.setAttribute('points', points);
    polyline.setAttribute('stroke', color);
    polyline.setAttribute('stroke-width', '2');
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('opacity', '0.8');

    svg.appendChild(polyline);
    wrapper.appendChild(svg);

    // Add label - position it relative to the wrapper
    const existingMACount = this.shapes.filter(s => s.type === 'moving_average').length;
    const label = document.createElement('div');
    label.style.cssText = `
      position: absolute;
      top: ${20 + (existingMACount * 30)}px;
      left: 20px;
      background: ${color};
      color: white;
      padding: 4px 8px;
      font-size: 11px;
      font-family: monospace;
      border-radius: 3px;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    label.textContent = `${type.toUpperCase()}(${period})`;

    wrapper.appendChild(label);
    chartContainer.appendChild(wrapper);
    
    this.shapes.push({ 
      element: wrapper, 
      type: 'moving_average', 
      period: period, 
      maType: type 
    });
  }

  private async generateMAPoints(period: number, type: 'sma' | 'ema'): Promise<string> {
    console.log(`Generating ${type.toUpperCase()}(${period}) points using Yahoo Finance data`);
    
    // Use a longer time range for better moving average calculation
    const now = Math.floor(Date.now() / 1000);
    const threeMonthsAgo = now - (90 * 24 * 60 * 60); // 90 days ago for better MA calculation
    const resolution = '1D';
    
    const bars = await this.getBarsForRange(resolution, threeMonthsAgo, now);
    console.log(`Fetched ${bars.length} bars for ${this.currentSymbol}`);

    if (bars.length < period) {
        console.warn(`Not enough data to calculate ${type.toUpperCase()}(${period}). Need ${period}, got ${bars.length}`);
        // Return empty string but don't throw error
        return '';
    }

    const closePrices = bars.map(bar => bar.close);
    console.log(`Close prices: [${closePrices.slice(0, 5).map(p => p.toFixed(2)).join(', ')}...]`);

    let maData: (number | null)[];
    if (type === 'sma') {
        maData = this.calculateSMA(closePrices, period);
    } else {
        maData = this.calculateEMA(closePrices, period);
    }
    
    const validMAValues = maData.filter(val => val !== null).length;
    console.log(`Calculated ${validMAValues} valid MA values out of ${maData.length} total`);

    const pointArray: string[] = [];
    const chartContainer = document.getElementById('investiq_chart');
    if (!chartContainer) {
        console.error('Chart container not found');
        return '';
    }

    const width = chartContainer.offsetWidth;
    const height = chartContainer.offsetHeight;
    
    // Calculate price range for scaling using close prices and MA values
    const maValues = maData.filter(val => val !== null) as number[];
    const allPrices = [...closePrices, ...maValues];
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    
    console.log(`Price range: ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}, MA values: ${maValues.length}`);
    
    // Calculate time range
    const startTime = bars[0]?.time;
    const endTime = bars[bars.length - 1]?.time;
    const timeRange = endTime - startTime;

    for (let i = 0; i < bars.length; i++) {
        const maValue = maData[i];
        if (maValue !== null) {
            const bar = bars[i];
            
            // Map time to x coordinate
            const timeProgress = (bar.time - startTime) / timeRange;
            const x = timeProgress * width;
            
            // Map price to y coordinate (flipped because y=0 is at top)
            const priceProgress = (maValue - minPrice) / priceRange;
            const y = height * (1 - priceProgress) * 0.8 + height * 0.1; // Use 80% of height with 10% margin
            
            if (x >= 0 && x <= width && y >= 0 && y <= height) {
                pointArray.push(`${x.toFixed(2)},${y.toFixed(2)}`);
            }
        }
    }
    
    return pointArray.join(' ');
  }

  private async getBarsForRange(resolution: string, from: number, to: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
        this.datafeed.getBars(
            { name: this.currentSymbol },
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

  private calculateSMA(data: number[], period: number): (number | null)[] {
    if (period <= 0 || data.length < period) {
        return new Array(data.length).fill(null);
    }

    const sma: (number | null)[] = new Array(data.length).fill(null);
    for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1);
        const sum = slice.reduce((a, b) => a + b, 0);
        sma[i] = sum / period;
    }
    return sma;
  }

  private calculateEMA(data: number[], period: number): (number | null)[] {
    if (period <= 0 || data.length < period) {
        return new Array(data.length).fill(null);
    }

    const ema: (number | null)[] = new Array(data.length).fill(null);
    const k = 2 / (period + 1);
    
    // First EMA is SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += data[i];
    }
    ema[period - 1] = sum / period;

    // Subsequent EMAs
    for (let i = period; i < data.length; i++) {
        const prevEma = ema[i - 1];
        if (prevEma !== null) {
          ema[i] = (data[i] * k) + (prevEma * (1 - k));
        }
    }
    
    return ema;
  }

  addFibonacciRetracement(startPrice: number, endPrice: number): void {
    try {
      this.createFibonacciOverlay(startPrice, endPrice);
      console.log(`Added Fibonacci retracement from ${startPrice} to ${endPrice}`);
    } catch (error) {
      console.error('Error adding Fibonacci retracement:', error);
    }
  }

  private createFibonacciOverlay(startPrice: number, endPrice: number): void {
    const chartContainer = document.getElementById('investiq_chart');
    if (!chartContainer) return;

    const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const fibColors = ['#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#0099FF', '#9900FF', '#FF0000'];
    
    const priceRange = Math.abs(endPrice - startPrice);
    const minPrice = Math.min(startPrice, endPrice);
    
    fibLevels.forEach((level, index) => {
      const price = minPrice + (priceRange * level);
      const position = this.calculatePricePosition(price);
      
      // Create Fibonacci level line
      const fibLine = document.createElement('div');
      fibLine.style.cssText = `
        position: absolute;
        left: 0;
        right: 0;
        height: 1px;
        background-color: ${fibColors[index]};
        top: ${position}px;
        z-index: 998;
        pointer-events: none;
        opacity: 0.7;
      `;

      // Add level label
      const label = document.createElement('div');
      label.style.cssText = `
        position: absolute;
        right: 5px;
        top: -8px;
        background: ${fibColors[index]};
        color: white;
        padding: 1px 4px;
        font-size: 10px;
        font-family: monospace;
        border-radius: 2px;
        white-space: nowrap;
      `;
      label.textContent = `${(level * 100).toFixed(1)}% ($${price.toFixed(2)})`;
      fibLine.appendChild(label);

      chartContainer.appendChild(fibLine);
      this.shapes.push({ 
        element: fibLine, 
        type: 'fibonacci', 
        level: level, 
        price: price 
      });
    });
  }

  async addBollingerBands(period: number): Promise<void> {
    try {
      console.log(`Creating Bollinger Bands(${period}) with Yahoo Finance data`);
      await this.createBollingerBandsOverlay(period);
      console.log(`Added Bollinger Bands(${period})`);
    } catch (error) {
      console.error('Error adding Bollinger Bands:', error);
    }
  }

  private async createBollingerBandsOverlay(period: number): Promise<void> {
    const chartContainer = document.getElementById('investiq_chart');
    if (!chartContainer) return;

    // Create wrapper for all Bollinger Bands
    const wrapper = document.createElement('div');
    wrapper.className = 'bb-overlay-wrapper';
    wrapper.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 998;
    `;

    // Generate Bollinger Bands data using real Yahoo Finance data
    const bandsData = await this.generateBollingerBandsData(period);
    
    if (bandsData.length === 0) {
      console.warn(`No Bollinger Bands data generated for period ${period}`);
      return;
    }

    // Create upper, middle, and lower bands with real data
    const upperBand = this.createBandLineWithData(bandsData, 'upper', '#0066CC', period);
    const middleBand = this.createBandLineWithData(bandsData, 'middle', '#FF6600', period);
    const lowerBand = this.createBandLineWithData(bandsData, 'lower', '#0066CC', period);

    // Add all elements to wrapper
    wrapper.appendChild(upperBand.line);
    wrapper.appendChild(middleBand.line);
    wrapper.appendChild(lowerBand.line);
    wrapper.appendChild(upperBand.label);
    wrapper.appendChild(middleBand.label);
    wrapper.appendChild(lowerBand.label);

    chartContainer.appendChild(wrapper);

    // Store just the wrapper for easy cleanup
    this.shapes.push({ 
      element: wrapper, 
      type: 'bollinger_bands', 
      period: period 
    });
  }

  private async generateBollingerBandsData(period: number): Promise<any[]> {
    console.log(`Generating Bollinger Bands(${period}) data using Yahoo Finance data`);
    
    // Use the same time range as moving averages
    const now = Math.floor(Date.now() / 1000);
    const threeMonthsAgo = now - (90 * 24 * 60 * 60);
    const resolution = '1D';
    
    const bars = await this.getBarsForRange(resolution, threeMonthsAgo, now);
    console.log(`Fetched ${bars.length} bars for Bollinger Bands calculation`);

    if (bars.length < period) {
        console.warn(`Not enough data for Bollinger Bands(${period}). Need ${period}, got ${bars.length}`);
        return [];
    }

    const closePrices = bars.map(bar => bar.close);
    
    // Calculate Simple Moving Average (middle band)
    const sma = this.calculateSMA(closePrices, period);
    
    // Calculate standard deviation for each period
    const bandsData: any[] = [];
    for (let i = 0; i < bars.length; i++) {
        if (sma[i] !== null && i >= period - 1) {
            // Calculate standard deviation for the period
            const slice = closePrices.slice(i - period + 1, i + 1);
            const mean = sma[i]!;
            const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
            const stdDev = Math.sqrt(variance);
            
            bandsData.push({
                time: bars[i].time,
                upper: mean + (2 * stdDev),
                middle: mean,
                lower: mean - (2 * stdDev),
                close: bars[i].close
            });
        }
    }
    
    console.log(`Generated ${bandsData.length} Bollinger Bands data points`);
    return bandsData;
  }

  private createBandLineWithData(bandsData: any[], band: 'upper' | 'lower' | 'middle', color: string, period: number) {
    const chartContainer = document.getElementById('investiq_chart');
    const width = chartContainer!.offsetWidth;
    const height = chartContainer!.offsetHeight;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 998;
      overflow: visible;
    `;

    // Extract band values and calculate price range
    const bandValues = bandsData.map(d => d[band]);
    const allPrices = bandsData.map(d => [d.upper, d.middle, d.lower, d.close]).flat();
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    
    // Calculate time range
    const startTime = bandsData[0]?.time;
    const endTime = bandsData[bandsData.length - 1]?.time;
    const timeRange = endTime - startTime;

    // Generate points for the polyline
    const pointArray: string[] = [];
    for (let i = 0; i < bandsData.length; i++) {
        const dataPoint = bandsData[i];
        const bandValue = dataPoint[band];
        
        // Map time to x coordinate
        const timeProgress = (dataPoint.time - startTime) / timeRange;
        const x = timeProgress * width;
        
        // Map price to y coordinate (flipped because y=0 is at top)
        const priceProgress = (bandValue - minPrice) / priceRange;
        const y = height * (1 - priceProgress) * 0.8 + height * 0.1; // Use 80% of height with 10% margin
        
        if (x >= 0 && x <= width && y >= 0 && y <= height) {
            pointArray.push(`${x.toFixed(2)},${y.toFixed(2)}`);
        }
    }

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', pointArray.join(' '));
    polyline.setAttribute('stroke', color);
    polyline.setAttribute('stroke-width', '1.5');
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('opacity', '0.6');

    svg.appendChild(polyline);

    const label = document.createElement('div');
    label.style.cssText = `
      position: absolute;
      top: ${band === 'upper' ? '20px' : band === 'lower' ? '90%' : '50%'};
      left: 10px;
      background: ${color};
      color: white;
      padding: 2px 6px;
      font-size: 10px;
      font-family: monospace;
      border-radius: 2px;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    label.textContent = `BB ${band}(${period})`;

    return { line: svg, label };
  }

  private generateBandPath(period: number, band: 'upper' | 'lower' | 'middle', width: number, height: number): string {
    if (width === 0 || height === 0) {
      console.warn('Container has no dimensions for bands. Using fallbacks.');
      width = 800;
      height = 600;
    }
    
    const points = 100;
    const pointArray: string[] = [];
    
    for (let i = 0; i < points; i++) {
      const x = (i / (points - 1)) * width;
      const baseY = height * 0.4;
      const amplitude = height * 0.12;
      const frequency = 0.01;
      const bandSpacing = height * 0.08;
      
      let offset = 0;
      if (band === 'upper') {
        offset = -bandSpacing * 1.5;
      } else if (band === 'lower') {
        offset = bandSpacing * 1.5;
      }
      
      const trend = (i / points) * height * 0.08;
      const variation = Math.sin(x * frequency + period * 0.03) * (amplitude * 0.4);
      const noise = (Math.random() - 0.5) * height * 0.01;
      
      const y = baseY + offset + variation + trend + noise;
      const clampedY = Math.max(20, Math.min(height - 20, y));
      
      pointArray.push(`${x.toFixed(2)},${clampedY.toFixed(2)}`);
    }
    
    return pointArray.join(' ');
  }

  private createBandLine(period: number, band: 'upper' | 'lower' | 'middle', color: string) {
    const chartContainer = document.getElementById('investiq_chart');
    const width = chartContainer!.offsetWidth;
    const height = chartContainer!.offsetHeight;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 998;
      overflow: visible;
    `;

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    const points = this.generateBandPath(period, band, width, height);
    
    polyline.setAttribute('points', points);
    polyline.setAttribute('stroke', color);
    polyline.setAttribute('stroke-width', '1.5');
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('opacity', '0.6');

    svg.appendChild(polyline);

    const label = document.createElement('div');
    label.style.cssText = `
      position: absolute;
      top: ${band === 'upper' ? '20px' : band === 'lower' ? '90%' : '50%'};
      left: 10px;
      background: ${color};
      color: white;
      padding: 2px 6px;
      font-size: 10px;
      font-family: monospace;
      border-radius: 2px;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    label.textContent = `BB ${band}(${period})`;

    return { line: svg, label };
  }
}