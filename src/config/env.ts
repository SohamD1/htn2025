// Environment configuration
export const config = {
  // API Configuration
  apiUrl: process.env.REACT_APP_API_URL || 'https://2dcq63co40.execute-api.us-east-1.amazonaws.com/dev',
  
  // App Configuration
  appName: 'RBC InvestEase',
  defaultMoney: 10000,
  minMoney: 100,
  maxMoney: 1000000,
  
  // Development mode
  isDevelopment: process.env.NODE_ENV === 'development'
};

export default config;
