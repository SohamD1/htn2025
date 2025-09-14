import { ChartManager } from './chart';
import { CommandParser } from './command-parser';
import { Homepage, StockPreference } from './homepage';

class StockChartApp {
  private chartManager: ChartManager;
  private commandInput: HTMLInputElement | null = null;
  private terminalBody: HTMLElement | null = null;
  private commandHistory: string[] = [];
  private historyIndex: number = -1;
  private homepage: Homepage;
  private isHomepageActive = true;
  private userPreferences: StockPreference[] = [];

  constructor() {
    this.chartManager = new ChartManager();
    this.homepage = new Homepage((preferences) => this.onHomepageComplete(preferences));
    this.init();
  }

  private async init(): Promise<void> {
    try {
      // Load homepage CSS
      this.loadHomepageCSS();

      // Check if user has saved preferences
      const savedPreferences = localStorage.getItem('investiq-stock-preferences');
      if (savedPreferences) {
        // Skip homepage if user has preferences
        try {
          this.userPreferences = JSON.parse(savedPreferences);
          this.isHomepageActive = false;
          await this.initializeMainApp();
        } catch (error) {
          // If parsing fails, show homepage
          this.showHomepage();
        }
      } else {
        // Show homepage for new users
        this.showHomepage();
      }

      console.log('App initialization complete');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }

  private loadHomepageCSS(): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/homepage.css';
    document.head.appendChild(link);
  }

  private showHomepage(): void {
    this.isHomepageActive = true;
    this.homepage.render();
  }

  private async onHomepageComplete(preferences: StockPreference[]): Promise<void> {
    this.userPreferences = preferences;
    this.isHomepageActive = false;

    // Show loading transition
    this.showLoadingTransition();

    // Initialize main app
    setTimeout(async () => {
      await this.initializeMainApp();
    }, 1500);
  }

  private showLoadingTransition(): void {
    const container = document.querySelector('.container');
    if (container) {
      container.innerHTML = `
        <div class="loading-transition">
          <div class="rbc-logo">
            <div class="logo-text">RBC</div>
            <div class="logo-subtitle">InvestIQ</div>
          </div>
          <div class="loading-message">
            <h2>Preparing Your Investment Dashboard...</h2>
            <div class="loading-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      `;
    }
  }

  private async initializeMainApp(): Promise<void> {
    // Restore original HTML structure
    this.restoreMainAppHTML();

    // Set up terminal first (synchronously)
    this.setupTerminal();

    // Initialize the chart with user's preferred stock
    await this.chartManager.initializeChart();

    // Set default symbol to user's first preference
    if (this.userPreferences.length > 0) {
      await this.chartManager.changeSymbol(this.userPreferences[0].symbol);
    }

    // Show personalized welcome message
    this.showPersonalizedWelcomeMessage();
  }

  private restoreMainAppHTML(): void {
    const container = document.querySelector('.container');
    if (container) {
      container.innerHTML = `
        <div class="chart-container">
          <div id="investiq_chart"></div>
        </div>
        <div class="terminal-container">
          <div class="terminal-header">
            <div class="terminal-controls">
              <div class="terminal-dot red"></div>
              <div class="terminal-dot yellow"></div>
              <div class="terminal-dot green"></div>
            </div>
            <div class="terminal-title">RBC InvestIQ Terminal — bash — 80×24</div>
          </div>
          <div class="terminal-body" id="terminalBody">
            <div class="terminal-output info">RBC InvestIQ Advanced Investment Intelligence v1.0.0</div>
            <div class="terminal-output">Type 'help' for available commands</div>
            <div class="terminal-input-line">
              <span class="terminal-prompt">user@investiq:~$</span>
              <input
                type="text"
                id="commandInput"
                class="terminal-input"
                placeholder="Enter command..."
                autocomplete="off"
                spellcheck="false"
              />
              <button id="executeBtn" style="margin-left: 10px; padding: 2px 8px; background: #21262d; color: white; border: 1px solid #30363d; border-radius: 3px; font-size: 12px;">Execute</button>
            </div>
          </div>
        </div>
      `;
    }
  }

  private setupTerminal(): void {
    console.log('Setting up terminal...');
    
    const trySetup = () => {
      this.commandInput = document.getElementById('commandInput') as HTMLInputElement;
      this.terminalBody = document.getElementById('terminalBody') as HTMLElement;
      
      console.log('Elements found:', {
        commandInput: this.commandInput,
        terminalBody: this.terminalBody,
        inputType: this.commandInput?.type,
        inputId: this.commandInput?.id
      });
      
      if (!this.commandInput || !this.terminalBody) {
        console.error('Terminal elements not found, retrying...');
        setTimeout(trySetup, 200);
        return;
      }

      console.log('Terminal elements found successfully, attaching listeners...');
      this.attachEventListeners();
    };

    // Try immediately first
    trySetup();
  }

  private attachEventListeners(): void {
    if (!this.commandInput || !this.terminalBody) {
      console.error('Cannot attach listeners - elements missing');
      return;
    }

    console.log('Attaching event listeners to input element...');

    // Remove any existing listeners first
    const newInput = this.commandInput.cloneNode(true) as HTMLInputElement;
    this.commandInput.parentNode?.replaceChild(newInput, this.commandInput);
    this.commandInput = newInput;

    // Test that the input is working
    this.commandInput.addEventListener('input', () => {
      console.log('Input event detected:', this.commandInput!.value);
    });

    this.commandInput.addEventListener('keydown', (event: KeyboardEvent) => {
      console.log('Keydown event detected:', event.key, event.code);
      
      if (event.key === 'Enter' || event.code === 'Enter') {
        console.log('Enter key detected!');
        event.preventDefault();
        event.stopPropagation();
        
        const command = this.commandInput!.value.trim();
        console.log('Processing command:', command);
        
        if (command) {
          this.addCommandToHistory(command);
          this.addTerminalOutput(`user@stock-terminal:~$ ${command}`);
          this.executeCommand(command);
        } else {
          this.addTerminalOutput(`user@stock-terminal:~$ `);
        }
        this.commandInput!.value = '';
        this.historyIndex = -1;
        return false;
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.navigateHistory(-1);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.navigateHistory(1);
      }
    });

    // Multiple fallback approaches
    this.commandInput.addEventListener('keypress', (event: KeyboardEvent) => {
      console.log('Keypress event detected:', event.key, event.code);
      if (event.key === 'Enter' || event.code === 'Enter') {
        console.log('Enter via keypress!');
        event.preventDefault();
        // Trigger the same logic
        const inputEvent = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' });
        this.commandInput!.dispatchEvent(inputEvent);
      }
    });

    this.commandInput.addEventListener('keyup', (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.code === 'Enter') {
        console.log('Enter via keyup - should have been handled already');
      }
    });

    // Focus on the input when the page loads
    setTimeout(() => {
      this.commandInput!.focus();
      console.log('Terminal input focused');
    }, 200);

    // Keep focus on terminal input
    document.addEventListener('click', (event) => {
      if (this.terminalBody!.contains(event.target as Node)) {
        this.commandInput!.focus();
      }
    });

    // Also ensure focus when clicking anywhere in the terminal area
    this.terminalBody.addEventListener('click', () => {
      this.commandInput!.focus();
    });

    // Add fallback execute button
    const executeBtn = document.getElementById('executeBtn') as HTMLButtonElement;
    if (executeBtn) {
      executeBtn.addEventListener('click', () => {
        console.log('Execute button clicked');
        const command = this.commandInput!.value.trim();
        if (command) {
          this.addCommandToHistory(command);
          this.addTerminalOutput(`user@stock-terminal:~$ ${command}`);
          this.executeCommand(command);
        } else {
          this.addTerminalOutput(`user@stock-terminal:~$ `);
        }
        this.commandInput!.value = '';
        this.historyIndex = -1;
        this.commandInput!.focus();
      });
    }

    console.log('Event listeners attached successfully');
  }

  private addCommandToHistory(command: string): void {
    this.commandHistory.unshift(command);
    if (this.commandHistory.length > 100) {
      this.commandHistory.pop();
    }
  }

  private navigateHistory(direction: number): void {
    if (this.commandHistory.length === 0) return;

    this.historyIndex += direction;
    
    if (this.historyIndex < -1) {
      this.historyIndex = -1;
    } else if (this.historyIndex >= this.commandHistory.length) {
      this.historyIndex = this.commandHistory.length - 1;
    }

    if (this.historyIndex === -1) {
      this.commandInput!.value = '';
    } else {
      this.commandInput!.value = this.commandHistory[this.historyIndex];
    }
  }

  private addTerminalOutput(text: string, type: 'success' | 'error' | 'info' | '' = ''): void {
    if (!this.terminalBody) {
      console.error('Terminal body not available');
      return;
    }

    const outputDiv = document.createElement('div');
    outputDiv.className = `terminal-output ${type}`.trim();
    outputDiv.textContent = text;
    
    // Insert before the input line
    const inputLine = this.terminalBody.querySelector('.terminal-input-line');
    if (inputLine) {
      this.terminalBody.insertBefore(outputDiv, inputLine);
    } else {
      this.terminalBody.appendChild(outputDiv);
    }

    // Auto-scroll to bottom
    setTimeout(() => {
      this.terminalBody!.scrollTop = this.terminalBody!.scrollHeight;
    }, 10);
  }

  private executeCommand(input: string): void {
    // Handle special terminal commands first
    if (input === 'clear' || input === 'cls') {
      this.clearTerminal();
      this.chartManager.clearAllShapes(); // Also clear the chart overlays
      this.addTerminalOutput('✓ Cleared terminal and all chart overlays', 'success');
      return;
    }

    if (input === 'history') {
      this.showCommandHistory();
      return;
    }

    if (input === 'stocks' || input === 'preferences') {
      this.showStockPreferences();
      return;
    }

    if (input.startsWith('stock ') && this.userPreferences.length > 0) {
      const stockIndex = parseInt(input.split(' ')[1]) - 1;
      if (stockIndex >= 0 && stockIndex < this.userPreferences.length) {
        const selectedStock = this.userPreferences[stockIndex];
        this.chartManager.changeSymbol(selectedStock.symbol);
        this.addTerminalOutput(`✓ Switched to ${selectedStock.symbol} (${selectedStock.name})`, 'success');
        return;
      }
    }

    if (input === 'reset' || input === 'setup') {
      this.resetPreferences();
      return;
    }

    const command = CommandParser.parse(input);
    
    if (!command) {
      this.addTerminalOutput(`bash: ${input}: command not found`, 'error');
      this.addTerminalOutput(`Type 'help' for available commands`);
      return;
    }

    switch (command.type) {
      case 'horizontal_line':
        this.chartManager.addHorizontalLine(
          command.params.price, 
          command.params.color || '#2196F3'
        );
        this.addTerminalOutput(`✓ Added horizontal line at $${command.params.price}`, 'success');
        break;

      case 'vertical_line':
        this.chartManager.addVerticalLine(command.params.time);
        this.addTerminalOutput('✓ Added vertical line at current time', 'success');
        break;

      case 'clear':
        this.chartManager.clearAllShapes();
        this.addTerminalOutput('✓ Cleared all lines and shapes', 'success');
        break;

      case 'symbol':
        const newSymbol = command.params.symbol;
        this.addTerminalOutput(`🔄 Changing chart symbol to ${newSymbol}...`, 'info');

        // Call the chart manager (it handles its own errors now)
        this.chartManager.changeSymbol(newSymbol);

        // Provide user feedback after a delay
        setTimeout(() => {
          // Update current preferences if this is a user preference stock
          const matchingStock = this.userPreferences.find(stock =>
            stock.symbol.toUpperCase() === newSymbol.toUpperCase()
          );

          if (matchingStock) {
            this.addTerminalOutput(`✓ Switched to ${newSymbol} (${matchingStock.name})`, 'success');
          } else {
            this.addTerminalOutput(`✓ Switched to ${newSymbol}`, 'success');
            this.addTerminalOutput(`💡 Tip: Type 'stocks' to see your preferred stocks`, 'info');
          }
        }, 1500);
        break;

      case 'moving_average':
        this.chartManager.addMovingAverage(
          command.params.period,
          command.params.type,
          command.params.type === 'ema' ? '#FF6600' : '#FFA500'
        );
        this.addTerminalOutput(`✓ Added ${command.params.type.toUpperCase()}(${command.params.period}) moving average`, 'success');
        break;

      case 'fibonacci':
        this.chartManager.addFibonacciRetracement(
          command.params.startPrice,
          command.params.endPrice
        );
        this.addTerminalOutput(`✓ Added Fibonacci retracement from $${command.params.startPrice} to $${command.params.endPrice}`, 'success');
        break;

      case 'bollinger_bands':
        this.chartManager.addBollingerBands(command.params.period);
        this.addTerminalOutput(`✓ Added Bollinger Bands(${command.params.period})`, 'success');
        break;

      case 'help':
        this.showHelp();
        break;

      default:
        this.addTerminalOutput(`Command type "${command.type}" not implemented yet.`, 'error');
    }
  }

  private clearTerminal(): void {
    if (!this.terminalBody) return;
    
    // Clear the browser console
    console.clear();
    
    // Remove all terminal output except the input line
    const outputs = this.terminalBody.querySelectorAll('.terminal-output');
    outputs.forEach(output => {
      output.remove();
    });
    
    // Add back just the welcome messages
    this.addTerminalOutput('RBC InvestIQ Advanced Investment Intelligence v1.0.0', 'info');
    this.addTerminalOutput('Type \'help\' for available commands');
  }

  private showCommandHistory(): void {
    this.addTerminalOutput('Command History:', 'info');
    if (this.commandHistory.length === 0) {
      this.addTerminalOutput('  No commands in history');
    } else {
      this.commandHistory.slice(0, 10).forEach((cmd, index) => {
        this.addTerminalOutput(`  ${this.commandHistory.length - index}: ${cmd}`);
      });
    }
  }

  private showPersonalizedWelcomeMessage(): void {
    if (this.userPreferences.length > 0) {
      const stockList = this.userPreferences.slice(0, 3).map(s => s.symbol).join(', ');
      this.addTerminalOutput('', '');
      this.addTerminalOutput(`🎯 Welcome back! Your preferred stocks: ${stockList}`, 'success');
      this.addTerminalOutput(`📈 Currently viewing: ${this.userPreferences[0].symbol} (${this.userPreferences[0].name})`, 'info');
      this.addTerminalOutput(`💡 Type 'stocks' to switch between your preferences`, 'info');
      this.addTerminalOutput('', '');
    }
  }

  private showStockPreferences(): void {
    if (this.userPreferences.length === 0) {
      this.addTerminalOutput('No stock preferences found. Type "setup" to configure.', 'error');
      return;
    }

    this.addTerminalOutput('Your Stock Preferences:', 'info');
    this.addTerminalOutput('─────────────────────────────────────────', 'info');
    this.userPreferences.forEach((stock, index) => {
      this.addTerminalOutput(`  ${index + 1}. ${stock.symbol} - ${stock.name} (${stock.category.toUpperCase()})`, '');
    });
    this.addTerminalOutput('', '');
    this.addTerminalOutput('Commands:', 'info');
    this.addTerminalOutput('  • stock <number>  - Switch to stock by number', '');
    this.addTerminalOutput('  • symbol <ticker> - Switch to any stock symbol', '');
    this.addTerminalOutput('  • reset          - Reconfigure preferences', '');
  }

  private resetPreferences(): void {
    localStorage.removeItem('investiq-stock-preferences');
    this.addTerminalOutput('✓ Preferences reset. Reloading homepage...', 'success');
    setTimeout(() => {
      location.reload();
    }, 1000);
  }

  private showHelp(): void {
    const helpLines = [
      '',
      'RBC InvestIQ - Available Commands:',
      '─────────────────────────────────────────────────────────',
      '📊 Stock Management:',
      '• stocks                  - Show your stock preferences',
      '• stock <number>          - Switch to stock by preference number',
      '• symbol <ticker>         - Change to any stock symbol',
      '• reset                   - Reset stock preferences',
      '',
      '📈 Chart Analysis:',
      '• horizontal line <price>  - Draw horizontal line at price',
      '• hline <price>           - Short form for horizontal line',
      '• vertical line           - Draw vertical line at current time',
      '• vline                   - Short form for vertical line',
      '• support <price>         - Draw green support line',
      '• resistance <price>      - Draw red resistance line',
      '• clear                   - Remove all drawn lines',
      '',
      '🛠️ Terminal:',
      '• history                 - Show command history',
      '• help                    - Show this help message',
      '',
      '📝 Examples:',
      '  stocks                  - View your preferences',
      '  stock 1                 - Switch to first preferred stock',
      '  horizontal line 210     - Draw line at $210',
      '  support 180            - Draw support at $180',
      '  symbol NVDA            - Switch to NVIDIA',
      ''
    ];

    helpLines.forEach(line => {
      if (line === '') {
        this.addTerminalOutput(' ');
      } else if (line.includes('─')) {
        this.addTerminalOutput(line, 'info');
      } else {
        this.addTerminalOutput(line);
      }
    });
  }

}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new StockChartApp();
});
