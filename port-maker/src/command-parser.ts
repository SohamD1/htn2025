export interface Command {
  type: string;
  params: any;
}

export class CommandParser {
  static parse(input: string): Command | null {
    const trimmed = input.trim().toLowerCase();
    
    if (!trimmed) {
      return null;
    }

    // Horizontal line command: "horizontal line 210" or "hline 210"
    const horizontalLineMatch = trimmed.match(/^(?:horizontal\s+line|hline)\s+(\d+(?:\.\d+)?)$/);
    if (horizontalLineMatch) {
      return {
        type: 'horizontal_line',
        params: {
          price: parseFloat(horizontalLineMatch[1])
        }
      };
    }

    // Vertical line command: "vertical line" or "vline" (uses current time)
    const verticalLineMatch = trimmed.match(/^(?:vertical\s+line|vline)$/);
    if (verticalLineMatch) {
      return {
        type: 'vertical_line',
        params: {
          time: Math.floor(Date.now() / 1000)
        }
      };
    }

    // Clear command: "clear" or "clear all"
    const clearMatch = trimmed.match(/^(?:clear|clear\s+all)$/);
    if (clearMatch) {
      return {
        type: 'clear',
        params: {}
      };
    }

    // Symbol change command: "symbol AAPL" or "stock MSFT"
    const symbolMatch = trimmed.match(/^(?:symbol|stock)\s+([a-zA-Z]+)$/);
    if (symbolMatch) {
      return {
        type: 'symbol',
        params: {
          symbol: symbolMatch[1].toUpperCase()
        }
      };
    }

    // Support level command: "support 180"
    const supportMatch = trimmed.match(/^support\s+(\d+(?:\.\d+)?)$/);
    if (supportMatch) {
      return {
        type: 'horizontal_line',
        params: {
          price: parseFloat(supportMatch[1]),
          color: '#4CAF50' // Green for support
        }
      };
    }

    // Resistance level command: "resistance 220"
    const resistanceMatch = trimmed.match(/^resistance\s+(\d+(?:\.\d+)?)$/);
    if (resistanceMatch) {
      return {
        type: 'horizontal_line',
        params: {
          price: parseFloat(resistanceMatch[1]),
          color: '#F44336' // Red for resistance
        }
      };
    }

    // Moving Average commands: "ma 20" or "sma 50" or "ema 21"
    const maMatch = trimmed.match(/^(?:ma|sma)\s+(\d+)$/);
    if (maMatch) {
      return {
        type: 'moving_average',
        params: {
          period: parseInt(maMatch[1]),
          type: 'sma'
        }
      };
    }

    const emaMatch = trimmed.match(/^ema\s+(\d+)$/);
    if (emaMatch) {
      return {
        type: 'moving_average',
        params: {
          period: parseInt(emaMatch[1]),
          type: 'ema'
        }
      };
    }

    // Fibonacci retracement: "fib 100 200" (from price 100 to price 200)
    const fibMatch = trimmed.match(/^(?:fib|fibonacci)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/);
    if (fibMatch) {
      return {
        type: 'fibonacci',
        params: {
          startPrice: parseFloat(fibMatch[1]),
          endPrice: parseFloat(fibMatch[2])
        }
      };
    }

    // Bollinger Bands: "bb 20" or "bollinger 20"
    const bbMatch = trimmed.match(/^(?:bb|bollinger)\s+(\d+)$/);
    if (bbMatch) {
      return {
        type: 'bollinger_bands',
        params: {
          period: parseInt(bbMatch[1])
        }
      };
    }

    // Help command
    const helpMatch = trimmed.match(/^(?:help|\?)$/);
    if (helpMatch) {
      return {
        type: 'help',
        params: {}
      };
    }

    return null;
  }

  static getHelpText(): string {
    return `
Available Commands:

LINES & LEVELS:
• horizontal line <price> - Draw horizontal line at specified price
• hline <price> - Short form for horizontal line
• vertical line - Draw vertical line at current time
• vline - Short form for vertical line
• support <price> - Draw green support line at price
• resistance <price> - Draw red resistance line at price

TECHNICAL INDICATORS:
• ma <period> - Simple Moving Average (e.g., ma 20)
• sma <period> - Simple Moving Average (e.g., sma 50)
• ema <period> - Exponential Moving Average (e.g., ema 21)
• bb <period> - Bollinger Bands (e.g., bb 20)
• fib <start> <end> - Fibonacci retracement (e.g., fib 100 200)

CHART CONTROLS:
• symbol <ticker> - Change stock symbol (e.g., AAPL, MSFT)
• stock <ticker> - Same as symbol command
• clear - Remove all drawn lines and indicators
• help - Show this help message

Examples:
• horizontal line 210
• support 180, resistance 220
• ma 50, ema 21
• fib 150 200
• bb 20
• symbol TSLA
    `.trim();
  }
}
