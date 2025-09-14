import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SimulationResult } from '../services/rbc-service';
import rbcAPI from '../services/rbc-service';
import Navigation from '../components/Navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/Simulation.css';

const Simulation: React.FC = () => {
  const { currentClient } = useAuth();
  const [months, setMonths] = useState('3');
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runSimulation = async () => {
    if (!currentClient) {
      setError('Please select a client first');
      return;
    }

    setLoading(true);
    setError('');
    setSimulationResults([]);

    try {
      const response = await rbcAPI.simulateClient(currentClient.id, parseInt(months));
      setSimulationResults(response.results);
    } catch (err: any) {
      setError(err.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (simulationResults.length === 0) return [];

    const allDates = new Set<string>();
    simulationResults.forEach(result => {
      result.growth_trend.forEach(point => {
        allDates.add(point.date);
      });
    });

    const sortedDates = Array.from(allDates).sort();

    return sortedDates.map(date => {
      const dataPoint: any = { date: new Date(date).toLocaleDateString() };

      simulationResults.forEach(result => {
        const trend = result.growth_trend.find(p => p.date === date);
        const strategyName = result.strategy.replace('_', ' ').toUpperCase();
        dataPoint[strategyName] = trend ? trend.value : null;
      });

      return dataPoint;
    });
  };

  const getSimulationSummary = () => {
    if (simulationResults.length === 0) return null;

    const totalInitial = simulationResults.reduce((sum, r) => sum + r.initialValue, 0);
    const totalProjected = simulationResults.reduce((sum, r) => sum + r.projectedValue, 0);
    const totalGrowth = totalProjected - totalInitial;
    const growthPercentage = totalInitial > 0 ? (totalGrowth / totalInitial * 100).toFixed(2) : '0';

    return {
      totalInitial,
      totalProjected,
      totalGrowth,
      growthPercentage
    };
  };

  const chartData = prepareChartData();
  const summary = getSimulationSummary();

  const COLORS = ['#003DA5', '#FFD23F', '#4ECDC4', '#96CEB4', '#88D8B0'];

  return (
    <div className="simulation">
      <Navigation />
      <div className="simulation-content">
        <div className="simulation-header">
          <h1>Portfolio Simulation</h1>
          <p className="subtitle">Project future portfolio performance</p>
        </div>

        {!currentClient ? (
          <div className="no-client-message">
            <p>Please create a client and portfolios first to run simulations</p>
          </div>
        ) : (
          <>
            <div className="simulation-controls">
              <div className="control-card">
                <h3>Simulation Settings</h3>
                <div className="settings-form">
                  <div className="form-group">
                    <label>Client</label>
                    <div className="client-display">
                      <span className="client-name">{currentClient.name}</span>
                      <span className="client-email">{currentClient.email}</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Simulation Period</label>
                    <select
                      value={months}
                      onChange={(e) => setMonths(e.target.value)}
                      disabled={loading}
                    >
                      <option value="1">1 Month</option>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="9">9 Months</option>
                      <option value="12">12 Months</option>
                    </select>
                  </div>

                  <button
                    className="run-simulation-btn"
                    onClick={runSimulation}
                    disabled={loading}
                  >
                    {loading ? 'Running Simulation...' : 'Run Simulation'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </div>

            {simulationResults.length > 0 && (
              <>
                <div className="simulation-summary">
                  <h2>Simulation Results</h2>
                  <div className="summary-cards">
                    <div className="summary-card">
                      <span className="label">Initial Value</span>
                      <span className="value">
                        ${summary?.totalInitial.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="summary-card">
                      <span className="label">Projected Value</span>
                      <span className="value highlight">
                        ${summary?.totalProjected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="summary-card">
                      <span className="label">Total Growth</span>
                      <span className={`value ${(summary?.totalGrowth || 0) >= 0 ? 'positive' : 'negative'}`}>
                        ${summary?.totalGrowth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="summary-card">
                      <span className="label">Growth Rate</span>
                      <span className={`value ${(summary?.totalGrowth || 0) >= 0 ? 'positive' : 'negative'}`}>
                        {summary?.growthPercentage}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="simulation-chart">
                  <h3>Projected Growth Over Time</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => `$${value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                      <Legend />
                      {simulationResults.map((result, index) => (
                        <Line
                          key={result.portfolioId}
                          type="monotone"
                          dataKey={result.strategy.replace('_', ' ').toUpperCase()}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="portfolio-details">
                  <h3>Portfolio Breakdown</h3>
                  <div className="portfolio-cards">
                    {simulationResults.map(result => (
                      <div key={result.portfolioId} className="portfolio-result-card">
                        <h4>{result.strategy.replace('_', ' ').toUpperCase()}</h4>
                        <div className="result-stats">
                          <div className="stat">
                            <span>Initial</span>
                            <span>${result.initialValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="stat">
                            <span>Projected</span>
                            <span className="highlight">
                              ${result.projectedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="stat">
                            <span>Growth</span>
                            <span className={result.projectedValue - result.initialValue >= 0 ? 'positive' : 'negative'}>
                              ${(result.projectedValue - result.initialValue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="stat">
                            <span>Return</span>
                            <span className={result.projectedValue - result.initialValue >= 0 ? 'positive' : 'negative'}>
                              {result.initialValue > 0
                                ? ((result.projectedValue - result.initialValue) / result.initialValue * 100).toFixed(2)
                                : '0'}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Simulation;