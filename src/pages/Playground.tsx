import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import '../styles/Playground.css';

interface SketchfabViewerProps {
  level: number;
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
  const [coins, setCoins] = useState(100);
  const [houseLevel, setHouseLevel] = useState(1);

  const upgradeCosts = {
    2: 20,
    3: 30,
    4: 40,
    5: 50
  };

  const handleUpgrade = () => {
    const nextLevel = (houseLevel + 1) as keyof typeof upgradeCosts;
    const cost = upgradeCosts[nextLevel];

    if (cost && coins >= cost) {
      setCoins(coins - cost);
      setHouseLevel(nextLevel);
    }
  };

  const canUpgrade = houseLevel < 5 && coins >= (upgradeCosts[(houseLevel + 1) as keyof typeof upgradeCosts] || 0);

  const getLevelDescription = () => {
    switch(houseLevel) {
      case 1: return "Forest House - Cozy woodland dwelling";
      case 2: return "Basic House - Simple and sturdy";
      case 3: return "Taka House - Traditional architecture";
      case 4: return "Fantasy House - Magical and mystical";
      case 5: return "Ultimate Fantasy House - Maximum enchantment!";
      default: return "";
    }
  };

  return (
    <div className="playground-container">
      <Navigation />

      <div className="playground-header">
        <div className="coin-display">
          <span className="coin-icon">🪙</span>
          <span className="coin-amount">{coins}</span>
        </div>

        <div className="level-info">
          <h2>House Level {houseLevel}</h2>
          <p>{getLevelDescription()}</p>
        </div>

        <div className="upgrade-section">
          {houseLevel < 5 ? (
            <>
              <button
                className={`upgrade-button ${canUpgrade ? '' : 'disabled'}`}
                onClick={handleUpgrade}
                disabled={!canUpgrade}
              >
                Upgrade to Level {houseLevel + 1}
                <span className="upgrade-cost">
                  Cost: {upgradeCosts[(houseLevel + 1) as keyof typeof upgradeCosts]} 🪙
                </span>
              </button>
              {!canUpgrade && houseLevel < 5 && (
                <p className="insufficient-funds">Not enough coins!</p>
              )}
            </>
          ) : (
            <div className="max-level">
              <span className="star">⭐</span>
              MAX LEVEL REACHED!
              <span className="star">⭐</span>
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
  );
};

export default Playground;