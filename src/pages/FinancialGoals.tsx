import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/FinancialGoals.css';

interface StockGoal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  completed: boolean;
  coinsReward: number;
  category: 'diversification' | 'sector_focus' | 'risk_management' | 'dividend_income' | 'growth_stocks' | 'value_investing';
  stockSymbol?: string;
  targetPrice?: number;
  createdAt: string;
}

const FinancialGoals: React.FC = () => {
  const navigate = useNavigate();
  const { currentClient } = useAuth();
  const [goals, setGoals] = useState<StockGoal[]>([]);
  const [coins, setCoins] = useState(0);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetAmount: 0,
    deadline: '',
    category: 'diversification' as const,
    stockSymbol: '',
    targetPrice: 0
  });

  // Get user-specific localStorage keys
  const getUserKey = (key: string) => {
    const clientId = currentClient?.id || 'default';
    return `${key}_${clientId}`;
  };

  // Load data from localStorage on component mount
  useEffect(() => {
    if (!currentClient) return; // Wait for client to be loaded
    
    const savedGoals = localStorage.getItem(getUserKey('stock_goals'));
    const savedCoins = localStorage.getItem(getUserKey('user_coins'));

    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    } else {
      // Initialize with some default stock-related goals
      const defaultGoals: StockGoal[] = [
        {
          id: '1',
          title: 'Portfolio Diversification',
          description: 'Invest in at least 5 different sectors to reduce risk',
          targetAmount: 5000,
          currentAmount: 2000,
          deadline: '2024-12-31',
          completed: false,
          coinsReward: 100,
          category: 'diversification',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Tech Sector Focus',
          description: 'Build a strong position in technology stocks',
          targetAmount: 3000,
          currentAmount: 800,
          deadline: '2024-08-15',
          completed: false,
          coinsReward: 75,
          category: 'sector_focus',
          stockSymbol: 'AAPL',
          targetPrice: 150,
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Dividend Income Stream',
          description: 'Build a portfolio generating $100/month in dividends',
          targetAmount: 2000,
          currentAmount: 500,
          deadline: '2024-10-30',
          completed: false,
          coinsReward: 80,
          category: 'dividend_income',
          createdAt: new Date().toISOString()
        }
      ];
      setGoals(defaultGoals);
      localStorage.setItem(getUserKey('stock_goals'), JSON.stringify(defaultGoals));
    }

    if (savedCoins) {
      setCoins(parseInt(savedCoins));
    }
  }, [currentClient, getUserKey]);

  const addGoal = () => {
    if (!newGoal.title || !newGoal.targetAmount || !newGoal.deadline) return;

    const goal: StockGoal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      targetAmount: newGoal.targetAmount,
      currentAmount: 0,
      deadline: newGoal.deadline,
      completed: false,
      coinsReward: Math.floor(newGoal.targetAmount / 100), // 1 coin per $100
      category: newGoal.category,
      stockSymbol: newGoal.stockSymbol || undefined,
      targetPrice: newGoal.targetPrice || undefined,
      createdAt: new Date().toISOString()
    };

    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);
    localStorage.setItem(getUserKey('stock_goals'), JSON.stringify(updatedGoals));
    setNewGoal({ title: '', description: '', targetAmount: 0, deadline: '', category: 'diversification', stockSymbol: '', targetPrice: 0 });
    setShowAddGoal(false);
  };

  const updateGoalProgress = (goalId: string, amount: number) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        const newAmount = Math.max(0, Math.min(amount, goal.targetAmount));
        const wasCompleted = goal.completed;
        const isNowCompleted = newAmount >= goal.targetAmount;
        
        // Award coins if goal was just completed
        if (!wasCompleted && isNowCompleted) {
          setCoins(prev => {
            const newCoins = prev + goal.coinsReward;
            localStorage.setItem(getUserKey('user_coins'), newCoins.toString());
            return newCoins;
          });
        }

        return {
          ...goal,
          currentAmount: newAmount,
          completed: isNowCompleted
        };
      }
      return goal;
    });

    setGoals(updatedGoals);
    localStorage.setItem(getUserKey('stock_goals'), JSON.stringify(updatedGoals));
  };

  const deleteGoal = (goalId: string) => {
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    setGoals(updatedGoals);
    localStorage.setItem(getUserKey('stock_goals'), JSON.stringify(updatedGoals));
  };


  const getCategoryIcon = (category: string) => {
    const icons = {
      diversification: '🌐',
      sector_focus: '🎯',
      risk_management: '🛡️',
      dividend_income: '💵',
      growth_stocks: '📈',
      value_investing: '💎'
    };
    return icons[category as keyof typeof icons] || '💡';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      diversification: '#FFD200',
      sector_focus: '#005DAA',
      risk_management: '#FFD200',
      dividend_income: '#005DAA',
      growth_stocks: '#FFD200',
      value_investing: '#005DAA'
    };
    return colors[category as keyof typeof colors] || '#005DAA';
  };

  const completedGoals = goals.filter(goal => goal.completed).length;
  const totalGoals = goals.length;
  const progressPercentage = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  return (
    <div className="financial-goals">
      <div className="goals-content">
        <div className="goals-header">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1 className="page-title">Investment Goals</h1>
          <p className="page-subtitle">Track your financial milestones and earn rewards</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{coins}</div>
            <div className="stat-label">Total Points</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{completedGoals}</div>
            <div className="stat-label">Goals Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">Level {Math.floor(coins / 100) + 1}</div>
            <div className="stat-label">Current Level</div>
          </div>
        </div>

        <div className="goals-section-header">
          <h2>Your Investment Goals</h2>
          <button 
            className="add-goal-btn"
            onClick={() => setShowAddGoal(true)}
          >
            + Add Goal
          </button>
        </div>

        <div className="goals-list">
        {goals.map(goal => (
          <div key={goal.id} className={`goal-card ${goal.completed ? 'completed' : ''}`}>
            <div className="goal-header">
              <div className="goal-title">
                <span className="category-icon">{getCategoryIcon(goal.category)}</span>
                <h3>{goal.title}</h3>
              </div>
              <div className="goal-actions">
                <button 
                  className="btn-small"
                  onClick={() => updateGoalProgress(goal.id, goal.currentAmount + 100)}
                >
                  +$100
                </button>
                <button 
                  className="btn-small danger"
                  onClick={() => deleteGoal(goal.id)}
                >
                  Delete
                </button>
              </div>
            </div>
            
            <p className="goal-description">{goal.description}</p>
            
            <div className="goal-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${(goal.currentAmount / goal.targetAmount) * 100}%`,
                    backgroundColor: getCategoryColor(goal.category)
                  }}
                ></div>
              </div>
              <div className="progress-text">
                ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
              </div>
            </div>

            <div className="goal-details">
              <span className="deadline">Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
              <span className="coins-reward">Reward: {goal.coinsReward} 🪙</span>
              {goal.stockSymbol && (
                <span className="stock-symbol">Stock: {goal.stockSymbol}</span>
              )}
              {goal.targetPrice && (
                <span className="target-price">Target Price: ${goal.targetPrice}</span>
              )}
            </div>

            {goal.completed && (
              <div className="completion-badge">
                ✅ Goal Completed! +{goal.coinsReward} coins earned!
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add New Stock Investment Goal</h2>
            <div className="form-group">
              <label>Goal Title</label>
              <input
                type="text"
                value={newGoal.title}
                onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                placeholder="e.g., Tech Sector Focus"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                placeholder="Describe your investment goal..."
              />
            </div>
            <div className="form-group">
              <label>Target Amount ($)</label>
              <input
                type="number"
                value={newGoal.targetAmount}
                onChange={(e) => setNewGoal({...newGoal, targetAmount: Number(e.target.value)})}
                placeholder="5000"
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={newGoal.category}
                onChange={(e) => setNewGoal({...newGoal, category: e.target.value as any})}
              >
                <option value="diversification">Portfolio Diversification</option>
                <option value="sector_focus">Sector Focus</option>
                <option value="risk_management">Risk Management</option>
                <option value="dividend_income">Dividend Income</option>
                <option value="growth_stocks">Growth Stocks</option>
                <option value="value_investing">Value Investing</option>
              </select>
            </div>
            <div className="form-group">
              <label>Stock Symbol (Optional)</label>
              <input
                type="text"
                value={newGoal.stockSymbol}
                onChange={(e) => setNewGoal({...newGoal, stockSymbol: e.target.value})}
                placeholder="e.g., AAPL"
              />
            </div>
            <div className="form-group">
              <label>Target Price (Optional)</label>
              <input
                type="number"
                value={newGoal.targetPrice}
                onChange={(e) => setNewGoal({...newGoal, targetPrice: Number(e.target.value)})}
                placeholder="150"
              />
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input
                type="date"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAddGoal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={addGoal}>
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default FinancialGoals;
