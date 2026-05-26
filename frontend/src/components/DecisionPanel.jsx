import React from 'react';
import { playSound } from '../utils/sound';

export default function DecisionPanel({ 
  soldier, 
  weather, 
  enemyProbability, 
  riskProfile, 
  onUpdateState 
}) {
  const { risk_score, status, action, recommendation } = riskProfile;

  // Colors based on threat status
  const getStatusColor = (st) => {
    if (st === 'RED') return 'var(--neon-red)';
    if (st === 'YELLOW') return 'var(--neon-amber)';
    return 'var(--neon-green)';
  };

  const getStatusGlow = (st) => {
    if (st === 'RED') return 'var(--glow-red)';
    if (st === 'YELLOW') return 'var(--glow-amber)';
    return 'var(--glow-green)';
  };

  const handleSliderChange = (field, subField, val) => {
    playSound.tick();
    const updated = {};
    if (subField) {
      updated[field] = { [subField]: val };
    } else {
      updated[field] = val;
    }
    if (onUpdateState) {
      onUpdateState(updated);
    }
  };

  // Calculate component contributions for patent logic visualization
  // Formulas matching python decision engine:
  const enemyContrib = enemyProbability * 0.40;
  
  let terrainDanger = 0.2;
  if (weather.condition === 'SANDSTORM') terrainDanger = 0.8;
  else if (weather.condition === 'FOGGY') terrainDanger = 0.5;
  const terrainContrib = terrainDanger * 0.30;

  const visContrib = (1.0 - weather.visibility) * 0.15;
  const fatigueContrib = (soldier.fatigue / 100) * 0.15;
  const ammoPenalty = soldier.ammo < 30 ? (0.15 * (1.0 - (soldier.ammo / 30.0))) : 0.0;

  return (
    <div className="hud-panel">
      <div className="hud-panel-header">
        <h3>Decision Engine (Risk Model)</h3>
        <span className="mono" style={{ color: getStatusColor(status), textShadow: getStatusGlow(status), fontSize: '0.75rem', fontWeight: 'bold' }}>
          LEVEL: {status}
        </span>
      </div>
      
      <div className="hud-panel-body" style={{ gap: '15px' }}>
        
        {/* Risk Score Indicator Dial */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'rgba(2, 10, 22, 0.45)',
          padding: '15px',
          borderRadius: '4px',
          border: `1px solid ${getStatusColor(status)}`,
          boxShadow: `inset 0 0 15px rgba(0,0,0,0.6)`,
          position: 'relative'
        }}>
          {/* Radar background grids */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            backgroundImage: 'radial-gradient(circle, rgba(0,240,255,0.02) 1px, transparent 1px)',
            backgroundSize: '15px 15px',
            pointerEvents: 'none'
          }} />

          <div className="vital-label" style={{ alignSelf: 'flex-start', fontSize: '0.65rem' }}>Calculated Risk Index</div>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '5px 0', zIndex: 2 }}>
            <span className="mono" style={{ 
              fontSize: '2.8rem', 
              fontWeight: '900', 
              color: getStatusColor(status),
              textShadow: getStatusGlow(status) 
            }}>
              {Math.round(risk_score * 100)}
            </span>
            <span className="mono" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>%</span>
          </div>

          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '3px',
            overflow: 'hidden',
            zIndex: 2,
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{
              width: `${risk_score * 100}%`,
              height: '100%',
              backgroundColor: getStatusColor(status),
              boxShadow: `0 0 8px ${getStatusColor(status)}`,
              transition: 'width 0.4s ease, background-color 0.4s ease'
            }} />
          </div>

          <div className="mono" style={{ 
            fontSize: '0.68rem', 
            marginTop: '8px', 
            color: '#fff', 
            textAlign: 'center',
            letterSpacing: '0.5px',
            zIndex: 2
          }}>
            ACTION DIRECTIVE: <span style={{ color: getStatusColor(status), fontWeight: 'bold' }}>{action}</span>
          </div>
        </div>

        {/* Dynamic Weight Contributions Visualizer */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          padding: '10px 14px',
          borderRadius: '4px',
          border: '1px solid rgba(0,240,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div className="vital-label" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '3px' }}>
            Risk Factor Breakdown (Math Weights)
          </div>
          
          {/* Enemy contribution (40%) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
            <span>Enemy threat (40% wt)</span>
            <span className="mono">{Math.round(enemyContrib * 100)}%</span>
          </div>
          
          {/* Terrain danger (30%) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
            <span>Terrain danger (30% wt)</span>
            <span className="mono">{Math.round(terrainContrib * 100)}%</span>
          </div>
          
          {/* Weather/Vis danger (15%) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
            <span>Visibility Loss (15% wt)</span>
            <span className="mono">{Math.round(visContrib * 100)}%</span>
          </div>

          {/* Fatigue danger (15%) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
            <span>Fatigue index (15% wt)</span>
            <span className="mono">{Math.round(fatigueContrib * 100)}%</span>
          </div>

          {/* Ammo penalty */}
          {ammoPenalty > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--neon-red)' }}>
              <span>Low Ammo Penalty</span>
              <span className="mono">+{Math.round(ammoPenalty * 100)}%</span>
            </div>
          )}
        </div>

        {/* Tactical Recommendation Text */}
        <div className="mono" style={{
          fontSize: '0.75rem',
          padding: '10px 12px',
          background: 'rgba(4, 15, 33, 0.6)',
          borderLeft: `3px solid ${getStatusColor(status)}`,
          lineHeight: '1.45',
          borderRadius: '2px',
          color: '#c8d6e5',
          border: '1px solid rgba(0, 240, 255, 0.08)',
          borderLeftWidth: '3px'
        }}>
          {recommendation}
        </div>

        {/* Simulation Variables Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', borderTop: '1px solid rgba(0,240,255,0.1)', paddingTop: '10px' }}>
          <div className="vital-label" style={{ fontSize: '0.7rem', color: '#fff' }}>Simulated Threat Inputs</div>

          {/* Enemy Prob Slider */}
          <div className="slider-container">
            <div className="slider-header">
              <span>Enemy Proximity Prob.</span>
              <span className="mono glow-text-cyan">{Math.round(enemyProbability * 100)}%</span>
            </div>
            <input 
              type="range" 
              className="hud-slider"
              min="0"
              max="1"
              step="0.05"
              value={enemyProbability}
              onChange={(e) => handleSliderChange('enemyProbability', null, parseFloat(e.target.value))}
            />
          </div>

          {/* Fatigue Slider */}
          <div className="slider-container">
            <div className="slider-header">
              <span>Soldier Fatigue</span>
              <span className="mono glow-text-cyan">{soldier.fatigue}%</span>
            </div>
            <input 
              type="range" 
              className="hud-slider"
              min="10"
              max="100"
              step="1"
              value={soldier.fatigue}
              onChange={(e) => handleSliderChange('soldier', 'fatigue', parseInt(e.target.value))}
            />
          </div>

          {/* Ammo Slider */}
          <div className="slider-container">
            <div className="slider-header">
              <span>Ammunition Level</span>
              <span className="mono glow-text-cyan">{soldier.ammo}%</span>
            </div>
            <input 
              type="range" 
              className="hud-slider"
              min="0"
              max="100"
              step="1"
              value={soldier.ammo}
              onChange={(e) => handleSliderChange('soldier', 'ammo', parseInt(e.target.value))}
            />
          </div>

          {/* Weather Condition */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span className="vital-label">Climate Threat</span>
            <select 
              value={weather.condition}
              onChange={(e) => handleSliderChange('weather', 'condition', e.target.value)}
              className="mono"
              style={{
                background: 'rgba(0,0,0,0.6)',
                color: 'var(--neon-cyan)',
                border: '1px solid var(--border-color)',
                borderRadius: '3px',
                padding: '5px 10px',
                fontSize: '0.75rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="CLEAR">CLEAR VIEW (VIS: 90%)</option>
              <option value="FOGGY">HEAVY FOG (VIS: 45%)</option>
              <option value="SANDSTORM">SANDSTORM (VIS: 20%)</option>
            </select>
          </div>

        </div>

      </div>
    </div>
  );
}
