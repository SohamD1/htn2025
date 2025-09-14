import { ChartManager } from './chart';
import { CommandParser } from './command-parser';
import { Homepage, StockPreference } from './homepage';
import { claudeService } from './claude-service';
import { analysisService } from './analysis-service';

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

      case 'ask':
        this.handleAskCommand(command.params.query);
        break;

      case 'setkey':
        this.handleSetKeyCommand(command.params.key);
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
      this.addTerminalOutput(`🤖 RBCQuant AI enabled - Try "ask how to..." for smart suggestions`, 'success');
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

  private async handleAskCommand(query: string): Promise<void> {
    this.addTerminalOutput(`🤔 Analyzing: "${query}"...`, 'info');

    const q = query.toLowerCase();

    // Check if query is asking for key levels or analysis
    const needsAnalysis = q.includes('key') || q.includes('level') ||
                         q.includes('support') || q.includes('resistance') ||
                         q.includes('find') || q.includes('identify') ||
                         q.includes('technical') || q.includes('analysis');

    if (needsAnalysis) {
      // Perform actual analysis and execute commands
      await this.performAnalysisAndExecute(query);
    } else {
      // Get command suggestions and auto-execute them
      const suggestions = await claudeService.getCommandSuggestion(query);

      if (suggestions.length === 0) {
        this.addTerminalOutput('No matching commands found. Try "help" for all commands.', 'error');
        return;
      }

      this.addTerminalOutput('💡 Found relevant commands:', 'success');

      // Auto-execute the suggestions
      this.addTerminalOutput('🚀 Auto-executing commands:', 'info');

      for (const suggestion of suggestions) {
        const command = suggestion.command;
        this.addTerminalOutput(`  → ${command} - ${suggestion.reason}`, '');

        // Parse the command - some might need parameters
        let fullCommand = command;

        // Add example parameters for commands that need them
        if (command === 'horizontal line' || command === 'hline') {
          const currentPrice = this.chartManager.currentSymbol === 'AAPL' ? 175 : 100;
          fullCommand = `${command} ${currentPrice}`;
        } else if (command === 'support') {
          const supportPrice = this.chartManager.currentSymbol === 'AAPL' ? 170 : 95;
          fullCommand = `support ${supportPrice}`;
        } else if (command === 'resistance') {
          const resistancePrice = this.chartManager.currentSymbol === 'AAPL' ? 180 : 105;
          fullCommand = `resistance ${resistancePrice}`;
        } else if (command === 'ma' || command === 'sma') {
          fullCommand = `${command} 20`;
        } else if (command === 'ema') {
          fullCommand = `ema 21`;
        } else if (command === 'bb' || command === 'bollinger') {
          fullCommand = `bb 20`;
        } else if (command === 'fib' || command === 'fibonacci') {
          fullCommand = `fib 150 200`;
        } else if (command === 'symbol') {
          fullCommand = `symbol NVDA`;
        } else if (command === 'stock') {
          fullCommand = `stock 1`;
        }

        // Parse and execute
        const parsedCommand = CommandParser.parse(fullCommand);
        if (parsedCommand) {
          await new Promise(resolve => setTimeout(resolve, 300));

          // Execute the full command through normal flow for proper feedback
          this.addTerminalOutput(`user@investiq:~$ ${fullCommand}`, '');
          this.executeCommand(fullCommand);

          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      this.addTerminalOutput('', '');
      this.addTerminalOutput('✨ Commands executed! Check your chart.', 'success');
    }
  }

  private async performAnalysisAndExecute(query: string): Promise<void> {
    try {
      // Get current symbol from chart manager
      const currentSymbol = this.chartManager.currentSymbol || 'AAPL';

      this.addTerminalOutput(`📊 Analyzing ${currentSymbol} price data...`, 'info');

      // Perform technical analysis
      const keyLevels = await analysisService.findKeyLevels(currentSymbol);

      // Display analysis results
      this.addTerminalOutput('', '');
      this.addTerminalOutput(`📈 Analysis Results for ${currentSymbol}:`, 'success');
      this.addTerminalOutput(`  Current Price: $${keyLevels.currentPrice.toFixed(2)}`, '');
      this.addTerminalOutput(`  Price Range: $${keyLevels.priceRange.low.toFixed(2)} - $${keyLevels.priceRange.high.toFixed(2)}`, '');

      if (keyLevels.support.length > 0) {
        this.addTerminalOutput(`  Support Levels: ${keyLevels.support.map(s => '$' + s.toFixed(0)).join(', ')}`, '');
      }

      if (keyLevels.resistance.length > 0) {
        this.addTerminalOutput(`  Resistance Levels: ${keyLevels.resistance.map(r => '$' + r.toFixed(0)).join(', ')}`, '');
      }

      this.addTerminalOutput('', '');

      // Generate and execute commands based on query intent
      const q = query.toLowerCase();
      const commands: string[] = [];

      if (q.includes('support') || q.includes('key') || q.includes('level')) {
        keyLevels.support.slice(0, 2).forEach(level => {
          commands.push(`support ${level.toFixed(0)}`);
        });
      }

      if (q.includes('resistance') || q.includes('key') || q.includes('level')) {
        keyLevels.resistance.slice(0, 2).forEach(level => {
          commands.push(`resistance ${level.toFixed(0)}`);
        });
      }

      if (q.includes('fib') || q.includes('fibonacci') || q.includes('retracement')) {
        commands.push(`fib ${keyLevels.priceRange.low.toFixed(0)} ${keyLevels.priceRange.high.toFixed(0)}`);
      }

      if (q.includes('moving') || q.includes('average') || q.includes('ma')) {
        commands.push('ma 20');
        commands.push('ema 50');
      }

      // If generic "key levels" query or no specific commands yet, add main support/resistance and fib
      if ((q.includes('key') && q.includes('level')) || commands.length === 0) {
        // Clear any duplicate commands first
        commands.length = 0;

        // Add the most important support level
        if (keyLevels.support.length > 0) {
          commands.push(`support ${keyLevels.support[0].toFixed(0)}`);
        }

        // Add the most important resistance level
        if (keyLevels.resistance.length > 0) {
          commands.push(`resistance ${keyLevels.resistance[0].toFixed(0)}`);
        }

        // Add fibonacci retracement
        commands.push(`fib ${keyLevels.priceRange.low.toFixed(0)} ${keyLevels.priceRange.high.toFixed(0)}`);
      }

      // Execute the commands
      if (commands.length > 0) {
        this.addTerminalOutput('🚀 Auto-executing commands:', 'success');

        for (const cmd of commands) {
          this.addTerminalOutput(`  → ${cmd}`, 'info');

          // Parse and execute command
          const parsedCommand = CommandParser.parse(cmd);
          if (parsedCommand) {
            // Small delay for visual effect
            await new Promise(resolve => setTimeout(resolve, 500));

            // Execute the command
            this.executeCommandSilently(parsedCommand);
            this.addTerminalOutput(`    ✓ Executed: ${cmd}`, 'success');
          }
        }

        this.addTerminalOutput('', '');
        this.addTerminalOutput('✨ Analysis complete! Chart updated with key levels.', 'success');
      }

    } catch (error) {
      console.error('Analysis error:', error);
      this.addTerminalOutput('❌ Error performing analysis. Using fallback suggestions.', 'error');

      // Fallback to regular suggestions
      const suggestions = await claudeService.getCommandSuggestion(query);
      if (suggestions.length > 0) {
        this.addTerminalOutput('💡 Suggested commands:', 'info');
        suggestions.forEach(suggestion => {
          this.addTerminalOutput(`  ${suggestion.command} - ${suggestion.reason}`, '');
        });
      }
    }
  }

  private executeCommandSilently(command: any): void {
    // Execute command without terminal output
    switch (command.type) {
      case 'horizontal_line':
        this.chartManager.addHorizontalLine(
          command.params.price,
          command.params.color || '#2196F3'
        );
        break;

      case 'vertical_line':
        this.chartManager.addVerticalLine(command.params.time);
        break;

      case 'support':
        this.chartManager.addHorizontalLine(
          command.params.price,
          '#4CAF50' // Green for support
        );
        break;

      case 'resistance':
        this.chartManager.addHorizontalLine(
          command.params.price,
          '#F44336' // Red for resistance
        );
        break;

      case 'moving_average':
        this.chartManager.addMovingAverage(
          command.params.period,
          command.params.type,
          command.params.type === 'ema' ? '#FF6600' : '#FFA500'
        );
        break;

      case 'fibonacci':
        this.chartManager.addFibonacciRetracement(
          command.params.startPrice,
          command.params.endPrice
        );
        break;

      case 'bollinger_bands':
        this.chartManager.addBollingerBands(command.params.period);
        break;
    }
  }

  private handleSetKeyCommand(key: string): void {
    if (!key || key.trim() === '') {
      this.addTerminalOutput('❌ Invalid API key', 'error');
      return;
    }

    claudeService.setApiKey(key.trim());
    this.addTerminalOutput('✓ RBCQuant API key saved', 'success');
    this.addTerminalOutput('💡 Now "ask" commands will use RBCQuant AI for better suggestions', 'info');
  }

  private showHelp(): void {
    const helpLines = [
      '',
      'RBC InvestIQ - Available Commands:',
      '─────────────────────────────────────────────────────────',
      '🤖 RBCQuant AI Assistant:',
      '• ask <query>             - Get smart command suggestions',
      '',
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
      '📉 Indicators:',
      '• ma <period>             - Simple moving average',
      '• ema <period>            - Exponential moving average',
      '• bb <period>             - Bollinger bands',
      '• fib <start> <end>       - Fibonacci retracement',
      '',
      '🛠️ Terminal:',
      '• history                 - Show command history',
      '• help                    - Show this help message',
      '',
      '📝 Examples:',
      '  ask how to draw price line  - Get command suggestions',
      '  ask moving average          - Find indicator commands',
      '  stocks                      - View your preferences',
      '  symbol NVDA                 - Switch to NVIDIA',
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
