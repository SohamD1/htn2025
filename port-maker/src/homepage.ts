export interface StockPreference {
  symbol: string;
  name: string;
  category: 'tech' | 'ai' | 'semiconductor' | 'cloud' | 'social' | 'ecommerce';
}

export class Homepage {
  private container: HTMLElement | null = null;
  private onComplete: (preferences: StockPreference[]) => void;

  private readonly techStocks: StockPreference[] = [
    { symbol: 'AAPL', name: 'Apple Inc.', category: 'tech' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', category: 'tech' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'tech' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'ecommerce' },
    { symbol: 'TSLA', name: 'Tesla Inc.', category: 'tech' },
    { symbol: 'META', name: 'Meta Platforms Inc.', category: 'social' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'ai' },
    { symbol: 'AMD', name: 'Advanced Micro Devices', category: 'semiconductor' },
    { symbol: 'INTC', name: 'Intel Corporation', category: 'semiconductor' },
    { symbol: 'NFLX', name: 'Netflix Inc.', category: 'tech' },
    { symbol: 'CRM', name: 'Salesforce Inc.', category: 'cloud' },
    { symbol: 'ORCL', name: 'Oracle Corporation', category: 'cloud' },
    { symbol: 'ADBE', name: 'Adobe Inc.', category: 'tech' },
    { symbol: 'NOW', name: 'ServiceNow Inc.', category: 'cloud' },
    { symbol: 'SHOP', name: 'Shopify Inc.', category: 'ecommerce' },
    { symbol: 'SQ', name: 'Block Inc.', category: 'tech' },
    { symbol: 'UBER', name: 'Uber Technologies', category: 'tech' },
    { symbol: 'SPOT', name: 'Spotify Technology', category: 'tech' },
    { symbol: 'ZOOM', name: 'Zoom Video Communications', category: 'tech' },
    { symbol: 'SNOW', name: 'Snowflake Inc.', category: 'cloud' }
  ];

  constructor(onComplete: (preferences: StockPreference[]) => void) {
    this.onComplete = onComplete;
  }

  public render(): void {
    this.container = document.querySelector('.container');
    if (!this.container) {
      console.error('Container not found');
      return;
    }

    this.container.innerHTML = `
      <div class="homepage-overlay">
        <div class="homepage-content">
          <div class="homepage-header">
            <div class="rbc-logo">
              <div class="logo-text">RBC</div>
              <div class="logo-subtitle">InvestIQ</div>
            </div>
            <h1>Welcome to Advanced Investment Intelligence</h1>
            <p>Select your preferred tech stocks to get personalized insights and advanced charting tools</p>
          </div>

          <div class="stock-preferences-section">
            <h2>Choose Your Tech Stock Preferences</h2>
            <div class="category-filters">
              <button class="category-btn active" data-category="all">All Tech</button>
              <button class="category-btn" data-category="ai">AI & ML</button>
              <button class="category-btn" data-category="semiconductor">Semiconductors</button>
              <button class="category-btn" data-category="cloud">Cloud Services</button>
              <button class="category-btn" data-category="social">Social Media</button>
              <button class="category-btn" data-category="ecommerce">E-commerce</button>
            </div>

            <div class="stock-grid" id="stockGrid">
              ${this.renderStockCards()}
            </div>

            <div class="selected-stocks">
              <h3>Selected Stocks (<span id="selectedCount">0</span>)</h3>
              <div class="selected-list" id="selectedList"></div>
            </div>

            <div class="homepage-actions">
              <button class="continue-btn" id="continueBtn" disabled>
                Continue to InvestIQ
                <span class="arrow">→</span>
              </button>
              <p class="help-text">Select at least 3 stocks to continue</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.loadPreferencesFromStorage();
  }

  private renderStockCards(): string {
    return this.techStocks.map(stock => `
      <div class="stock-card" data-symbol="${stock.symbol}" data-category="${stock.category}">
        <div class="stock-header">
          <div class="stock-symbol">${stock.symbol}</div>
          <div class="stock-category category-${stock.category}">${stock.category.toUpperCase()}</div>
        </div>
        <div class="stock-name">${stock.name}</div>
        <div class="stock-price" id="price-${stock.symbol}">Loading...</div>
        <div class="stock-change" id="change-${stock.symbol}"></div>
      </div>
    `).join('');
  }

  private attachEventListeners(): void {
    // Category filtering
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const category = target.dataset.category;

        // Update active category
        categoryBtns.forEach(b => b.classList.remove('active'));
        target.classList.add('active');

        this.filterStocksByCategory(category || 'all');
      });
    });

    // Stock card selection
    const stockCards = document.querySelectorAll('.stock-card');
    stockCards.forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('selected');
        this.updateSelectedStocks();
      });
    });

    // Continue button
    const continueBtn = document.getElementById('continueBtn');
    continueBtn?.addEventListener('click', () => {
      const selectedStocks = this.getSelectedStocks();
      this.savePreferencesToStorage(selectedStocks);
      this.onComplete(selectedStocks);
    });

    // Load stock prices
    this.loadStockPrices();
  }

  private filterStocksByCategory(category: string): void {
    const stockCards = document.querySelectorAll('.stock-card');
    stockCards.forEach(card => {
      const cardElement = card as HTMLElement;
      const cardCategory = cardElement.dataset.category;

      if (category === 'all' || cardCategory === category) {
        cardElement.style.display = 'block';
      } else {
        cardElement.style.display = 'none';
      }
    });
  }

  private updateSelectedStocks(): void {
    const selectedCards = document.querySelectorAll('.stock-card.selected');
    const selectedCount = selectedCards.length;
    const selectedCountEl = document.getElementById('selectedCount');
    const selectedListEl = document.getElementById('selectedList');
    const continueBtn = document.getElementById('continueBtn') as HTMLButtonElement;

    if (selectedCountEl) selectedCountEl.textContent = selectedCount.toString();

    if (selectedListEl) {
      const selectedStocks = Array.from(selectedCards).map(card => {
        const symbol = (card as HTMLElement).dataset.symbol;
        const stock = this.techStocks.find(s => s.symbol === symbol);
        return `<span class="selected-stock">${symbol}</span>`;
      }).join('');
      selectedListEl.innerHTML = selectedStocks;
    }

    // Enable/disable continue button
    if (continueBtn) {
      continueBtn.disabled = selectedCount < 3;
      continueBtn.classList.toggle('enabled', selectedCount >= 3);
    }
  }

  private getSelectedStocks(): StockPreference[] {
    const selectedCards = document.querySelectorAll('.stock-card.selected');
    return Array.from(selectedCards).map(card => {
      const symbol = (card as HTMLElement).dataset.symbol!;
      return this.techStocks.find(s => s.symbol === symbol)!;
    }).filter(Boolean);
  }

  private async loadStockPrices(): void {
    // Load all stocks with mock data
    for (const stock of this.techStocks) {
      try {
        const price = await this.fetchStockPrice(stock.symbol);
        const priceEl = document.getElementById(`price-${stock.symbol}`);
        const changeEl = document.getElementById(`change-${stock.symbol}`);

        if (priceEl && price) {
          priceEl.textContent = `$${price.currentPrice.toFixed(2)}`;
        } else if (priceEl) {
          priceEl.textContent = 'N/A';
        }

        if (changeEl && price) {
          const change = price.change;
          const changePercent = price.changePercent;
          changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`;
          changeEl.className = `stock-change ${change >= 0 ? 'positive' : 'negative'}`;
        }
      } catch (error) {
        console.log(`Could not load price for ${stock.symbol}`);
        const priceEl = document.getElementById(`price-${stock.symbol}`);
        if (priceEl) priceEl.textContent = 'N/A';
      }
    }
  }

  private async fetchStockPrice(symbol: string): Promise<{currentPrice: number, change: number, changePercent: number} | null> {
    try {
      // Using Alpha Vantage or Yahoo Finance alternative
      // For demo purposes, returning mock data
      const mockPrices: {[key: string]: {currentPrice: number, change: number, changePercent: number}} = {
        'AAPL': { currentPrice: 175.43, change: 2.34, changePercent: 1.35 },
        'MSFT': { currentPrice: 378.85, change: -1.23, changePercent: -0.32 },
        'GOOGL': { currentPrice: 138.21, change: 0.87, changePercent: 0.63 },
        'AMZN': { currentPrice: 144.05, change: 3.21, changePercent: 2.28 },
        'TSLA': { currentPrice: 248.50, change: -4.32, changePercent: -1.71 },
        'META': { currentPrice: 325.67, change: 5.43, changePercent: 1.69 },
        'NVDA': { currentPrice: 875.28, change: 12.45, changePercent: 1.44 },
        'AMD': { currentPrice: 152.33, change: -2.11, changePercent: -1.37 },
        'INTC': { currentPrice: 43.21, change: 0.54, changePercent: 1.27 },
        'NFLX': { currentPrice: 421.33, change: 8.76, changePercent: 2.12 },
        'CRM': { currentPrice: 254.87, change: 3.45, changePercent: 1.38 },
        'ORCL': { currentPrice: 118.92, change: -0.78, changePercent: -0.65 },
        'ADBE': { currentPrice: 512.34, change: 7.89, changePercent: 1.56 },
        'NOW': { currentPrice: 684.21, change: 15.67, changePercent: 2.34 },
        'SHOP': { currentPrice: 87.43, change: -2.45, changePercent: -2.73 },
        'SQ': { currentPrice: 78.92, change: 1.23, changePercent: 1.58 },
        'UBER': { currentPrice: 58.76, change: -0.87, changePercent: -1.46 },
        'SPOT': { currentPrice: 178.45, change: 4.32, changePercent: 2.48 },
        'ZOOM': { currentPrice: 89.12, change: -1.56, changePercent: -1.72 },
        'SNOW': { currentPrice: 154.33, change: 6.78, changePercent: 4.59 }
      };

      // Add a small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500));

      return mockPrices[symbol] || null;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  }

  private savePreferencesToStorage(preferences: StockPreference[]): void {
    localStorage.setItem('investiq-stock-preferences', JSON.stringify(preferences));
  }

  private loadPreferencesFromStorage(): void {
    const saved = localStorage.getItem('investiq-stock-preferences');
    if (saved) {
      try {
        const preferences: StockPreference[] = JSON.parse(saved);
        preferences.forEach(pref => {
          const card = document.querySelector(`[data-symbol="${pref.symbol}"]`);
          if (card) {
            card.classList.add('selected');
          }
        });
        this.updateSelectedStocks();
      } catch (error) {
        console.error('Error loading saved preferences:', error);
      }
    }
  }
}