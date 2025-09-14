import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import martianAPI from '../services/martian-service';
import '../styles/Playground.css';

interface SketchfabViewerProps {
  level: number;
}

interface DailyQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  term: string;
}

interface UserProgress {
  totalPoints: number;
  streak: number;
  lastAnsweredDate: string;
  answeredToday: boolean;
}

const SketchfabViewer: React.FC<SketchfabViewerProps> = ({ level }) => {
  const getSketchfabUrl = () => {
    let modelId = "";

    switch(level) {
      case 1:
        modelId = "52429e4ef7bf4deda1309364a2cda86f"; // Forest House
        break;
      case 2:
        modelId = "d47d455e85b54fa1aa7ccecaf4b705c4"; // Original House
        break;
      case 3:
        modelId = "bf649e50139b4528984e2264f4d51110"; // Taka House
        break;
      case 4:
        modelId = "3d6fdf3d714148f882a044d70c7abdab"; // Fantasy House
        break;
      case 5:
        modelId = "3d6fdf3d714148f882a044d70c7abdab"; // Fantasy House with effects
        break;
      default:
        modelId = "52429e4ef7bf4deda1309364a2cda86f"; // Forest House fallback
    }

    return `https://sketchfab.com/models/${modelId}/embed?autostart=1&transparent=0&ui_controls=1&ui_infos=0&ui_inspector=0&ui_stop=0&ui_watermark=0&ui_watermark_link=0`;
  };

  return (
    <div className="sketchfab-container">
      <iframe
        title={`House Level ${level}`}
        frameBorder="0"
        allowFullScreen
        width="100%"
        height="100%"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        src={getSketchfabUrl()}
        style={{
          borderRadius: '12px',
          filter: level >= 5 ? 'hue-rotate(45deg) saturate(1.5)' :
                  level >= 3 ? 'hue-rotate(15deg) saturate(1.2)' : 'none'
        }}
      />

      {/* Level overlay effects */}
      {level >= 2 && (
        <div className="level-overlay level-2">
          <div className="floating-icon">🔥</div>
        </div>
      )}

      {level >= 3 && (
        <div className="level-overlay level-3">
          <div className="floating-icon garden">🌸</div>
        </div>
      )}

      {level >= 4 && (
        <div className="level-overlay level-4">
          <div className="floating-icon fence">🚪</div>
        </div>
      )}

      {level >= 5 && (
        <div className="level-overlay level-5">
          <div className="floating-icon magic">✨</div>
          <div className="magic-glow"></div>
        </div>
      )}
    </div>
  );
};

const Playground: React.FC = () => {
  const [progress, setProgress] = useState<UserProgress>({
    totalPoints: 0,
    streak: 0,
    lastAnsweredDate: '',
    answeredToday: false
  });
  const [houseLevel, setHouseLevel] = useState(1);
  const [dailyQuestion, setDailyQuestion] = useState<DailyQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const upgradeCosts = {
    2: 25,
    3: 50,
    4: 75,
    5: 100
  };

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('crib-quest-progress');
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      setProgress(parsed);
      setHouseLevel(Math.min(5, Math.floor(parsed.totalPoints / 25) + 1));
    }
    generateDailyQuestion();
  }, []);

  // Save progress to localStorage
  const saveProgress = (newProgress: UserProgress) => {
    localStorage.setItem('crib-quest-progress', JSON.stringify(newProgress));
    setProgress(newProgress);
  };

  const generateDailyQuestion = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toDateString();
      const savedQuestion = localStorage.getItem(`daily-question-${today}`);
      
      if (savedQuestion) {
        setDailyQuestion(JSON.parse(savedQuestion));
        setIsLoading(false);
        return;
      }

      // Use cheap model for generating daily questions
      const prompt = `Generate a multiple choice finance question for students. 
      Focus on basic financial concepts like compound interest, diversification, risk vs return, budgeting, or investing basics.
      Return ONLY a JSON object in this exact format:
      {
        "question": "What is compound interest?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Brief explanation of why this is correct",
        "term": "Compound Interest"
      }`;

      const response = await martianAPI.simpleChat(prompt, 'openai/gpt-4.1-nano');
      
      // Try to extract JSON from response
      let questionData;
      try {
        // Look for JSON in the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          questionData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        // Fallback question if API fails
        questionData = {
          question: "What is the main benefit of diversifying your investment portfolio?",
          options: [
            "It guarantees higher returns",
            "It reduces overall investment risk",
            "It eliminates all investment fees",
            "It only works with stocks"
          ],
          correctAnswer: 1,
          explanation: "Diversification helps reduce risk by spreading investments across different assets, so if one performs poorly, others may perform well.",
          term: "Portfolio Diversification"
        };
      }

      questionData.id = today;
      setDailyQuestion(questionData);
      localStorage.setItem(`daily-question-${today}`, JSON.stringify(questionData));
    } catch (error) {
      console.error('Error generating daily question:', error);
      // Fallback question
      const fallbackQuestion = {
        id: new Date().toDateString(),
        question: "What does 'compound interest' mean?",
        options: [
          "Interest calculated only on the original amount",
          "Interest calculated on both the original amount and previously earned interest",
          "Interest that decreases over time",
          "Interest paid only at the end of the investment period"
        ],
        correctAnswer: 1,
        explanation: "Compound interest is when you earn interest on both your original investment and the interest you've already earned, creating exponential growth over time.",
        term: "Compound Interest"
      };
      setDailyQuestion(fallbackQuestion);
    }
    setIsLoading(false);
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null || !dailyQuestion) return;

    const isCorrect = selectedAnswer === dailyQuestion.correctAnswer;
    setShowResult(true);
    setShowExplanation(true);

    if (isCorrect && !progress.answeredToday) {
      const today = new Date().toDateString();
      const newPoints = progress.totalPoints + 5;
      const newStreak = progress.lastAnsweredDate === new Date(Date.now() - 86400000).toDateString() 
        ? progress.streak + 1 
        : 1;
      
      const newProgress = {
        totalPoints: newPoints,
        streak: newStreak,
        lastAnsweredDate: today,
        answeredToday: true
      };
      
      saveProgress(newProgress);
      setHouseLevel(Math.min(5, Math.floor(newPoints / 25) + 1));
    }
  };

  const handleUpgrade = () => {
    const nextLevel = (houseLevel + 1) as keyof typeof upgradeCosts;
    const cost = upgradeCosts[nextLevel];

    if (cost && progress.totalPoints >= cost) {
      const newProgress = {
        ...progress,
        totalPoints: progress.totalPoints - cost
      };
      saveProgress(newProgress);
      setHouseLevel(nextLevel);
    }
  };

  const canUpgrade = houseLevel < 5 && progress.totalPoints >= (upgradeCosts[(houseLevel + 1) as keyof typeof upgradeCosts] || 0);

  const getLevelDescription = () => {
    switch(houseLevel) {
      case 1: return "Starter Crib - Your financial journey begins";
      case 2: return "Growing Crib - Building financial knowledge";
      case 3: return "Smart Crib - Developing investment wisdom";
      case 4: return "Elite Crib - Advanced financial mastery";
      case 5: return "Ultimate Crib - Financial genius achieved!";
      default: return "";
    }
  };

  const resetDaily = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setShowExplanation(false);
    generateDailyQuestion();
  };

  return (
    <div className="playground-container">
      <Navigation />

      <div className="crib-quest-header">
        <div className="quest-title">
          <h1>The Crib Quest</h1>
          <p>Answer daily finance questions to upgrade your crib</p>
        </div>

        <div className="stats-section">
          <div className="stat-card">
            <div>
              <div className="stat-value">{progress.totalPoints}</div>
              <div className="stat-label">Total Points</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div>
              <div className="stat-value">{progress.streak}</div>
              <div className="stat-label">Day Streak</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div>
              <div className="stat-value">Level {houseLevel}</div>
              <div className="stat-label">Crib Level</div>
            </div>
          </div>
        </div>
      </div>

      <div className="daily-question-section">
        <h2>Daily Finance Challenge</h2>
        
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Generating today's question...</p>
          </div>
        ) : dailyQuestion ? (
          <div className="question-card">
            <div className="question-header">
              <span className="question-term">{dailyQuestion.term}</span>
              <span className="question-reward">+5 points</span>
            </div>
            
            <h3>{dailyQuestion.question}</h3>
            
            <div className="options-grid">
              {dailyQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`option-button ${
                    selectedAnswer === index ? 'selected' : ''
                  } ${
                    showResult ? (
                      index === dailyQuestion.correctAnswer ? 'correct' :
                      selectedAnswer === index ? 'incorrect' : 'neutral'
                    ) : ''
                  }`}
                  onClick={() => !showResult && setSelectedAnswer(index)}
                  disabled={showResult}
                >
                  {String.fromCharCode(65 + index)}. {option}
                </button>
              ))}
            </div>

            {!showResult ? (
              <button
                className="submit-button"
                onClick={handleAnswerSubmit}
                disabled={selectedAnswer === null || progress.answeredToday}
              >
                {progress.answeredToday ? 'Already Answered Today!' : 'Submit Answer'}
              </button>
            ) : (
              <div className="result-section">
                <div className={`result-message ${selectedAnswer === dailyQuestion.correctAnswer ? 'correct' : 'incorrect'}`}>
                  {selectedAnswer === dailyQuestion.correctAnswer ? (
                    <>Correct! +5 points earned</>
                  ) : (
                    <>Incorrect. Better luck tomorrow</>
                  )}
                </div>
                
                {showExplanation && (
                  <div className="explanation">
                    <h4>Explanation</h4>
                    <p>{dailyQuestion.explanation}</p>
                  </div>
                )}
                
                <button className="new-question-button" onClick={resetDaily}>
                  Generate New Question
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="error-state">
            <p>Unable to load today's question. Please try again later.</p>
            <button onClick={generateDailyQuestion}>Retry</button>
          </div>
        )}
      </div>

      <div className="crib-upgrade-section">
        <h2>Your Crib</h2>
        <div className="crib-info">
          <div className="level-info">
            <h3>Level {houseLevel} Crib</h3>
            <p>{getLevelDescription()}</p>
          </div>

          <div className="upgrade-controls">
            {houseLevel < 5 ? (
              <>
                <button
                  className={`upgrade-button ${canUpgrade ? '' : 'disabled'}`}
                  onClick={handleUpgrade}
                  disabled={!canUpgrade}
                >
                  Upgrade to Level {houseLevel + 1}
                  <span className="upgrade-cost">
                    Cost: {upgradeCosts[(houseLevel + 1) as keyof typeof upgradeCosts]} points
                  </span>
                </button>
                {!canUpgrade && houseLevel < 5 && (
                  <p className="insufficient-points">
                    Need {(upgradeCosts[(houseLevel + 1) as keyof typeof upgradeCosts] || 0) - progress.totalPoints} more points!
                  </p>
                )}
              </>
            ) : (
              <div className="max-level">
                ULTIMATE CRIB ACHIEVED
              </div>
            )}
          </div>
        </div>

        <div className="canvas-container">
          <SketchfabViewer level={houseLevel} />
        </div>

        <div className="level-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(houseLevel / 5) * 100}%` }}
            />
          </div>
          <div className="level-markers">
            {[1, 2, 3, 4, 5].map(level => (
              <div
                key={level}
                className={`level-marker ${houseLevel >= level ? 'achieved' : ''}`}
              >
                {level}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Playground;