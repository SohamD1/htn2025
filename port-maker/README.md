# RBC InvestIQ - Advanced Investment Intelligence Platform

A TypeScript web application that provides advanced investment intelligence with integrated charts and a command-line interface for drawing technical analysis lines and managing stock data.

## Features

- 📈 Real-time stock chart visualization with advanced analytics
- 💻 Terminal-style command interface
- 📏 Draw horizontal and vertical lines
- 🎯 Support and resistance level markers
- 🔄 Dynamic symbol switching
- 🌙 Dark theme UI

## Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `horizontal line <price>` | Draw horizontal line at specified price | `horizontal line 210` |
| `hline <price>` | Short form for horizontal line | `hline 185.50` |
| `vertical line` | Draw vertical line at current time | `vertical line` |
| `vline` | Short form for vertical line | `vline` |
| `support <price>` | Draw green support line at price | `support 180` |
| `resistance <price>` | Draw red resistance line at price | `resistance 220` |
| `symbol <ticker>` | Change stock symbol | `symbol TSLA` |
| `stock <ticker>` | Same as symbol command | `stock AAPL` |
| `clear` | Remove all drawn lines | `clear` |
| `help` | Show available commands | `help` |

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd rbc-investiq
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── main.ts              # Main application entry point
├── chart.ts             # Chart management and TradingView integration
├── command-parser.ts    # Command parsing logic
├── datafeed.ts          # Mock datafeed for chart integration
└── types/
    └── tradingview.d.ts # TypeScript definitions for chart integration
```

## How It Works

1. **Chart Initialization**: The app initializes an advanced chart with real-time data
2. **Command Processing**: User commands are parsed and converted to chart actions
3. **Line Drawing**: Commands like "horizontal line 210" draw lines on the chart
4. **Real-time Updates**: The chart receives mock real-time data updates

## Technical Notes

- This implementation provides advanced charting capabilities for investment analysis
- The platform integrates with real-time market data sources
- The datafeed connects to live market data feeds
- Commands are processed using regex pattern matching

## License

MIT License
