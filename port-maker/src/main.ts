import { ChartManager } from './chart';
import { CommandParser } from './command-parser';

class StockChartApp {
  private chartManager: ChartManager;
  private commandInput: HTMLInputElement | null = null;
  private terminalBody: HTMLElement | null = null;
  private commandHistory: string[] = [];
  private historyIndex: number = -1;

  constructor() {
    this.chartManager = new ChartManager();
    this.init();
  }

  private async init(): Promise<void> {
    try {
      // Set up terminal first (synchronously)
      this.setupTerminal();
      
      // Initialize the chart
      await this.chartManager.initializeChart();
      
      // Show welcome message
      this.showWelcomeMessage();
      
      console.log('App initialization complete');
    } catch (error) {
      console.error('Failed to initialize app:', error);
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
        this.chartManager.changeSymbol(command.params.symbol);
        this.addTerminalOutput(`✓ Changed symbol to ${command.params.symbol}`, 'success');
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
    this.addTerminalOutput('TradingView Stock Chart Terminal v1.0.0', 'info');
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

  private showWelcomeMessage(): void {
    // Welcome message is now in the HTML
  }

  private showHelp(): void {
    const helpLines = [
      '',
      'Available Commands:',
      '─────────────────────────────────────────────────────────',
      '• horizontal line <price>  - Draw horizontal line at price',
      '• hline <price>           - Short form for horizontal line',
      '• vertical line           - Draw vertical line at current time',
      '• vline                   - Short form for vertical line',
      '• support <price>         - Draw green support line',
      '• resistance <price>      - Draw red resistance line',
      '• symbol <ticker>         - Change stock symbol',
      '• stock <ticker>          - Same as symbol command',
      '• clear                   - Remove all drawn lines',
      '• history                 - Show command history',
      '• help                    - Show this help message',
      '',
      'Examples:',
      '  horizontal line 210     - Draw line at $210',
      '  support 180            - Draw support at $180',
      '  symbol TSLA            - Switch to Tesla stock',
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
