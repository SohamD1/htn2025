import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import simulationHistoryService, { SavedSimulation } from '../services/simulation-history-service';
import '../styles/SimulationHistory.css';

const SimulationHistory: React.FC = () => {
  const navigate = useNavigate();
  const { currentClient } = useAuth();
  const [simulations, setSimulations] = useState<SavedSimulation[]>([]);
  const [selectedSimulation, setSelectedSimulation] = useState<SavedSimulation | null>(null);
  const [filter, setFilter] = useState<'all' | 'current'>('current');

  useEffect(() => {
    loadSimulations();
  }, [currentClient, filter]);

  const loadSimulations = () => {
    if (filter === 'current' && currentClient) {
      setSimulations(simulationHistoryService.getClientSimulations(currentClient.id));
    } else {
      setSimulations(simulationHistoryService.getAllSimulations());
    }
  };

  const deleteSimulation = (id: string) => {
    if (window.confirm('Are you sure you want to delete this simulation?')) {
      simulationHistoryService.deleteSimulation(id);
      loadSimulations();
      if (selectedSimulation?.id === id) {
        setSelectedSimulation(null);
      }
    }
  };

  const clearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all simulation history? This cannot be undone.')) {
      simulationHistoryService.clearAllHistory();
      loadSimulations();
      setSelectedSimulation(null);
    }
  };

  const prepareChartData = (simulation: SavedSimulation) => {
    if (!simulation.results.length) return [];

    const allDates = new Set<string>();
    simulation.results.forEach(result => {
      result.growth_trend.forEach(point => {
        allDates.add(point.date);
      });
    });

    const sortedDates = Array.from(allDates).sort();

    return sortedDates.map(date => {
      const dataPoint: any = { date: new Date(date).toLocaleDateString() };

      simulation.results.forEach(result => {
        const trend = result.growth_trend.find(p => p.date === date);
        const strategyName = result.strategy.replace('_', ' ').toUpperCase();
        dataPoint[strategyName] = trend ? trend.value : null;
      });

      return dataPoint;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const COLORS = ['#003DA5', '#FFD23F', '#4ECDC4', '#96CEB4', '#88D8B0'];

  return (
    <div className="simulation-history">
      <Navigation />
      <div className="simulation-history-content">
        <div className="history-header">
          <button className="back-btn" onClick={() => navigate('/portfolios')}>
            ← Back to Portfolios
          </button>
          <h1>Simulation History</h1>
          <p className="subtitle">View and analyze your past simulation results</p>
        </div>

        <div className="history-controls">
          <div className="filter-controls">
            <label>Show simulations for:</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as 'all' | 'current')}
            >
              <option value="current">Current Client Only</option>
              <option value="all">All Clients</option>
            </select>
          </div>
          
          {simulations.length > 0 && (
            <button 
              className="clear-history-btn"
              onClick={clearAllHistory}
            >
              Clear All History
            </button>
          )}
        </div>

        {simulations.length === 0 ? (
          <div className="no-simulations">
            <div className="no-simulations-content">
              <h3>No Simulation History</h3>
              <p>You haven't run any simulations yet.</p>
              <button 
                className="run-simulation-btn"
                onClick={() => navigate('/simulation')}
              >
                Run Your First Simulation
              </button>
            </div>
          </div>
        ) : (
          <div className="history-layout">
            <div className="simulations-list">
              <h3>Saved Simulations ({simulations.length})</h3>
              <div className="simulation-cards">
                {simulations.map(simulation => (
                  <div 
                    key={simulation.id}
                    className={`simulation-card ${selectedSimulation?.id === simulation.id ? 'selected' : ''}`}
                    onClick={() => setSelectedSimulation(simulation)}
                  >
                    <div className="simulation-card-header">
                      <h4>{simulation.clientName}</h4>
                      <button 
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSimulation(simulation.id);
                        }}
                        title="Delete simulation"
                      >
                        🗑️
                      </button>
                    </div>
                    
                    <div className="simulation-meta">
                      <span className="date">{formatDate(simulation.timestamp)}</span>
                      <span className="duration">{simulation.monthsSimulated} months</span>
                    </div>
                    
                    <div className="simulation-summary">
                      <div className="summary-item">
                        <span className="label">Growth:</span>
                        <span className={`value ${parseFloat(simulation.summary.growthPercentage) >= 0 ? 'positive' : 'negative'}`}>
                          {simulation.summary.growthPercentage}%
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Final Value:</span>
                        <span className="value">
                          ${simulation.summary.totalProjected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedSimulation && (
              <div className="simulation-details">
                <div className="details-header">
                  <h3>Simulation Details</h3>
                  <span className="simulation-id">ID: {selectedSimulation.id}</span>
                </div>

                <div className="details-summary">
                  <div className="summary-cards">
                    <div className="summary-card">
                      <span className="label">Initial Value</span>
                      <span className="value">
                        ${selectedSimulation.summary.totalInitial.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="summary-card">
                      <span className="label">Projected Value</span>
                      <span className="value highlight">
                        ${selectedSimulation.summary.totalProjected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="summary-card">
                      <span className="label">Total Growth</span>
                      <span className={`value ${selectedSimulation.summary.totalGrowth >= 0 ? 'positive' : 'negative'}`}>
                        ${selectedSimulation.summary.totalGrowth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="summary-card">
                      <span className="label">Growth Rate</span>
                      <span className={`value ${selectedSimulation.summary.totalGrowth >= 0 ? 'positive' : 'negative'}`}>
                        {selectedSimulation.summary.growthPercentage}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="details-chart">
                  <h4>Growth Over Time</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={prepareChartData(selectedSimulation)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => `$${value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                      <Legend />
                      {selectedSimulation.results.map((result, index) => (
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

                <div className="portfolio-breakdown">
                  <h4>Portfolio Breakdown</h4>
                  <div className="portfolio-results">
                    {selectedSimulation.results.map(result => (
                      <div key={result.portfolioId} className="portfolio-result">
                        <h5>{result.strategy.replace('_', ' ').toUpperCase()}</h5>
                        <div className="result-stats">
                          <div className="stat">
                            <span>Initial:</span>
                            <span>${result.initialValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="stat">
                            <span>Projected:</span>
                            <span className="highlight">
                              ${result.projectedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="stat">
                            <span>Return:</span>
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulationHistory;
