# Portfolio Simulation API Service

A simple TypeScript service for interacting with the Hack the North 2025 Portfolio Simulation & Market Sandbox API.

## Quick Start

1. **Import the service:**
```typescript
import { portfolioAPI } from './api-service';
```

2. **Register your team:**
```typescript
const auth = await portfolioAPI.registerTeam({
  team_name: "Your Team Name",
  contact_email: "team@example.com"
});
// Token is automatically stored for future requests
```

3. **Create a client:**
```typescript
const client = await portfolioAPI.createClient({
  name: "John Doe",
  email: "john@example.com",
  cash: 50000
});
```

4. **Create a portfolio:**
```typescript
const portfolio = await portfolioAPI.createPortfolio(client.id, {
  type: 'balanced',
  initialAmount: 25000
});
```

5. **Run simulation:**
```typescript
const results = await portfolioAPI.simulateClient(client.id, 12);
```

## Available Methods

### Authentication
- `registerTeam(data)` - Register team and get JWT token

### Client Management
- `createClient(data)` - Create new client
- `getClients()` - Get all team clients
- `getClient(id)` - Get specific client
- `updateClient(id, data)` - Update client info
- `deleteClient(id)` - Delete client
- `depositToClient(id, amount)` - Add money to client cash

### Portfolio Management
- `createPortfolio(clientId, data)` - Create new portfolio
- `getClientPortfolios(clientId)` - Get client's portfolios
- `getPortfolio(id)` - Get specific portfolio
- `transferToPortfolio(id, amount)` - Transfer cash to portfolio
- `withdrawFromPortfolio(id, amount)` - Withdraw from portfolio
- `getPortfolioAnalysis(id)` - Get returns analysis

### Simulations
- `simulateClient(clientId, months)` - Simulate all client portfolios

## Portfolio Types

- `aggressive_growth` - High risk, high reward (12-15% annually)
- `growth` - Medium-high risk (8-12% annually) 
- `balanced` - Medium risk (6-10% annually)
- `conservative` - Low-medium risk (4-7% annually)
- `very_conservative` - Low risk (2-5% annually)

## Error Handling

All methods throw errors that you should catch:

```typescript
try {
  const client = await portfolioAPI.createClient(data);
} catch (error) {
  console.error('Failed to create client:', error.message);
}
```

## Complete Example

See `usage-examples.ts` for detailed examples including a complete workflow.

## Files

- `api-service.ts` - Main service file with all API methods
- `usage-examples.ts` - Comprehensive usage examples
- `README.md` - This documentation

## API Base URL

```
https://2dcq63co40.execute-api.us-east-1.amazonaws.com/dev
```

The service handles authentication automatically once you register your team.
