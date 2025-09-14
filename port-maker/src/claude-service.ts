export class ClaudeService {
  private apiKey: string | null = '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';
  private apiUrl = 'https://api.anthropic.com/v1/messages';

  constructor() {
    // Hardcoded API key - no need to load from localStorage
    // this.apiKey = localStorage.getItem('claude-api-key');
  }

  setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem('claude-api-key', key);
  }

  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  async askClaude(query: string, availableCommands: string[]): Promise<string> {
    if (!this.apiKey) {
      return 'Set API key first: setkey <your-claude-api-key>';
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 150,
          messages: [{
            role: 'user',
            content: `You are a stock trading terminal assistant. User asks: "${query}"

Available commands:
${availableCommands.join('\n')}

IMPORTANT context:
- "key levels" means support, resistance, and fibonacci levels
- "technical analysis" includes MA, EMA, BB, fibonacci
- "price levels" refers to horizontal lines, support, resistance
- Always suggest multiple related commands when appropriate

For the query above, suggest 1-3 most relevant commands.
Format each as: "command - reason (max 7 words)"

Examples:
Query: "find key levels"
Response:
support - mark key support level
resistance - mark key resistance level
fib - find fibonacci retracement levels

Query: "how to see trends"
Response:
ma - shows price trend direction
ema - responsive trend indicator

Only output the command suggestions, no other text.`
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Claude API error:', error);
      return `Error: ${error.message}`;
    }
  }

  async getCommandSuggestion(userIntent: string): Promise<CommandSuggestion[]> {
    const commands = this.getAllCommands();

    // Quick local search first
    const matches = this.searchCommands(userIntent, commands);

    // If we have API key, enhance with Claude
    if (this.hasApiKey() && matches.length < 3) {
      const claudeResponse = await this.askClaude(userIntent, commands.map(c => c.name));
      return this.parseClaudeResponse(claudeResponse);
    }

    return matches;
  }

  private searchCommands(query: string, commands: Command[]): CommandSuggestion[] {
    const q = query.toLowerCase();
    const suggestions: CommandSuggestion[] = [];

    // Expanded intelligent keyword mapping with related concepts
    const keywords = {
      // Price and levels
      'price': ['horizontal line', 'hline', 'support', 'resistance', 'fib'],
      'level': ['support', 'resistance', 'horizontal line', 'fib'],
      'key': ['support', 'resistance', 'fib'],

      // Support/Resistance
      'support': ['support', 'horizontal line', 'fib'],
      'resistance': ['resistance', 'horizontal line', 'fib'],
      'sr': ['support', 'resistance'],

      // Lines and drawing
      'line': ['horizontal line', 'vertical line', 'hline', 'vline', 'support', 'resistance'],
      'draw': ['horizontal line', 'vertical line', 'support', 'resistance', 'fib'],
      'mark': ['horizontal line', 'vertical line', 'support', 'resistance'],
      'add': ['horizontal line', 'vertical line', 'ma', 'ema', 'bb'],

      // Technical analysis
      'technical': ['ma', 'ema', 'bb', 'fib', 'support', 'resistance'],
      'analysis': ['ma', 'ema', 'bb', 'fib', 'support', 'resistance'],
      'ta': ['ma', 'ema', 'bb', 'fib'],

      // Indicators
      'indicator': ['ma', 'ema', 'bb', 'fib'],
      'moving': ['ma', 'sma', 'ema'],
      'average': ['ma', 'sma', 'ema'],
      'ma': ['ma', 'sma', 'ema'],
      'momentum': ['ma', 'ema'],
      'trend': ['ma', 'ema', 'support', 'resistance'],

      // Volatility
      'volatility': ['bb', 'bollinger'],
      'bollinger': ['bb', 'bollinger'],
      'bands': ['bb', 'bollinger'],
      'bb': ['bb'],

      // Fibonacci
      'fibonacci': ['fib', 'fibonacci'],
      'fib': ['fib', 'fibonacci'],
      'retracement': ['fib', 'fibonacci'],
      'golden': ['fib'],

      // Stock management
      'stock': ['symbol', 'stocks', 'stock'],
      'symbol': ['symbol', 'stock'],
      'ticker': ['symbol', 'stock'],
      'change': ['symbol', 'stock', 'reset'],
      'switch': ['symbol', 'stock'],
      'view': ['stocks', 'symbol'],
      'list': ['stocks', 'help'],
      'preference': ['stocks', 'reset'],

      // Chart control
      'clear': ['clear', 'reset'],
      'remove': ['clear'],
      'delete': ['clear'],
      'clean': ['clear'],
      'reset': ['reset', 'clear'],

      // Help and info
      'help': ['help', 'stocks'],
      'command': ['help'],
      'how': ['help', 'ask'],
      'what': ['help', 'ask'],

      // Time-based
      'time': ['vertical line', 'vline'],
      'now': ['vertical line', 'vline'],
      'current': ['vertical line', 'vline', 'stocks']
    };

    // Score-based matching for better relevance
    const scoreMap = new Map<string, number>();

    // Check each keyword group
    for (const [keyword, cmds] of Object.entries(keywords)) {
      // Check if query contains keyword or keyword contains part of query
      const keywordMatches = q.includes(keyword) ||
                            keyword.includes(q) ||
                            q.split(' ').some(word => keyword.includes(word) || word.includes(keyword));

      if (keywordMatches) {
        for (const cmd of cmds) {
          const currentScore = scoreMap.get(cmd) || 0;
          // Higher score for exact matches
          const score = q.includes(keyword) ? 2 : 1;
          scoreMap.set(cmd, currentScore + score);
        }
      }
    }

    // Also check for partial matches in command names
    commands.forEach(command => {
      const cmdName = command.name.toLowerCase();
      if (cmdName.includes(q) || q.includes(cmdName)) {
        const currentScore = scoreMap.get(command.name) || 0;
        scoreMap.set(command.name, currentScore + 3); // Higher score for direct match
      }
    });

    // Sort by score and create suggestions
    const sortedCommands = Array.from(scoreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Get top 5 matches

    for (const [cmd, score] of sortedCommands) {
      const command = commands.find(c => c.name === cmd);
      if (command && !suggestions.find(s => s.command === cmd)) {
        suggestions.push({
          command: cmd,
          reason: this.getContextualReason(cmd, q)
        });
      }
      if (suggestions.length >= 3) break;
    }

    // If no matches found, suggest help
    if (suggestions.length === 0) {
      suggestions.push({
        command: 'help',
        reason: 'show all available commands'
      });
    }

    return suggestions;
  }

  private getContextualReason(command: string, query: string): string {
    // Context-aware reasons based on query intent
    const q = query.toLowerCase();

    if (q.includes('key') || q.includes('level')) {
      const levelReasons: {[key: string]: string} = {
        'support': 'mark key support level',
        'resistance': 'mark key resistance level',
        'fib': 'find fibonacci key levels',
        'horizontal line': 'draw custom price level'
      };
      if (levelReasons[command]) return levelReasons[command];
    }

    if (q.includes('find') || q.includes('identify')) {
      const findReasons: {[key: string]: string} = {
        'support': 'identify support zones',
        'resistance': 'identify resistance zones',
        'fib': 'find fibonacci levels',
        'ma': 'find trend with MA'
      };
      if (findReasons[command]) return findReasons[command];
    }

    // Default reasons
    return this.getShortReason(command, query);
  }

  private getShortReason(command: string, keyword: string): string {
    const reasons: {[key: string]: string} = {
      'horizontal line': 'draws price level line',
      'vertical line': 'marks time on chart',
      'support': 'green support price level',
      'resistance': 'red resistance price level',
      'symbol': 'change chart stock symbol',
      'stocks': 'show your stock preferences',
      'ma': 'simple moving average indicator',
      'ema': 'exponential moving average indicator',
      'bb': 'bollinger bands volatility indicator',
      'fib': 'fibonacci retracement levels',
      'clear': 'remove all chart overlays',
      'reset': 'reset stock preferences',
      'help': 'show all available commands'
    };

    return reasons[command] || `matches ${keyword} query`;
  }

  private getAllCommands(): Command[] {
    return [
      { name: 'horizontal line', syntax: 'horizontal line <price>', category: 'drawing' },
      { name: 'hline', syntax: 'hline <price>', category: 'drawing' },
      { name: 'vertical line', syntax: 'vertical line', category: 'drawing' },
      { name: 'vline', syntax: 'vline', category: 'drawing' },
      { name: 'support', syntax: 'support <price>', category: 'drawing' },
      { name: 'resistance', syntax: 'resistance <price>', category: 'drawing' },
      { name: 'symbol', syntax: 'symbol <ticker>', category: 'chart' },
      { name: 'stock', syntax: 'stock <number>', category: 'chart' },
      { name: 'stocks', syntax: 'stocks', category: 'info' },
      { name: 'ma', syntax: 'ma <period>', category: 'indicator' },
      { name: 'sma', syntax: 'sma <period>', category: 'indicator' },
      { name: 'ema', syntax: 'ema <period>', category: 'indicator' },
      { name: 'bb', syntax: 'bb <period>', category: 'indicator' },
      { name: 'fib', syntax: 'fib <start> <end>', category: 'indicator' },
      { name: 'clear', syntax: 'clear', category: 'utility' },
      { name: 'reset', syntax: 'reset', category: 'utility' },
      { name: 'help', syntax: 'help', category: 'info' },
      { name: 'history', syntax: 'history', category: 'info' }
    ];
  }

  private parseClaudeResponse(response: string): CommandSuggestion[] {
    const lines = response.split('\n').filter(l => l.trim());
    const suggestions: CommandSuggestion[] = [];

    for (const line of lines) {
      const match = line.match(/^(\w+(?:\s+\w+)?)\s*-\s*(.+)$/);
      if (match) {
        suggestions.push({
          command: match[1].trim(),
          reason: match[2].trim()
        });
      }
    }

    return suggestions.slice(0, 3);
  }
}

interface Command {
  name: string;
  syntax: string;
  category: string;
}

interface CommandSuggestion {
  command: string;
  reason: string;
}

export const claudeService = new ClaudeService();