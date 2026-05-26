import React from 'react';

export default function SoldierVitals({ vitals }) {
  const { health, fatigue, ammo, battery, heartRate } = vitals;

  // Determine vital status color class
  const getBarColor = (val, type) => {
    if (type === 'fatigue') {
      if (val > 70) return 'var(--neon-red)';
      if (val > 40) return 'var(--neon-amber)';
      return 'var(--neon-green)';
    }
    // For health, ammo, battery: higher is better
    if (val < 30) return 'var(--neon-red)';
    if (val < 60) return 'var(--neon-amber)';
    return 'var(--neon-green)';
  };

  // Heart rate pulse animation duration (seconds per beat)
  const pulseDuration = 60 / heartRate;
  
  // Dynamic color for cardio indicators
  const cardioColor = heartRate > 110 ? 'var(--neon-red)' : 'var(--neon-green)';
  const cardioGlow = heartRate > 110 ? 'var(--glow-red)' : 'var(--glow-green)';

  return (
    <div className="hud-panel">
      <div className="hud-panel-header">
        <h3>Soldier Vitals</h3>
        <span className="mono" style={{ color: 'var(--neon-cyan)', fontSize: '0.72rem', letterSpacing: '0.5px' }}>
          OPERATOR: SLDR-081
        </span>
      </div>
      <div className="hud-panel-body" style={{ gap: '15px' }}>
        
        {/* Heart Rate & Live ECG Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: 'rgba(2, 10, 22, 0.45)',
          padding: '12px',
          borderRadius: '4px',
          border: '1px solid rgba(0, 240, 255, 0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Animated Heart Pulsing */}
            <div style={{
              position: 'relative',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${cardioColor}33`,
              borderRadius: '50%',
            }}>
              <svg 
                viewBox="0 0 24 24" 
                fill={cardioColor} 
                style={{
                  width: '22px',
                  height: '22px',
                  animation: `pulse-heart ${pulseDuration}s infinite`,
                  filter: `drop-shadow(0 0 4px ${cardioColor})`
                }}
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div>
              <div className="vital-label" style={{ fontSize: '0.65rem' }}>Cardio Rhythm Monitor</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                <span className="vital-number mono" style={{ color: cardioColor, textShadow: cardioGlow }}>
                  {heartRate}
                </span>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>BPM</span>
              </div>
            </div>
            <div className="mono" style={{ 
              marginLeft: 'auto', 
              fontSize: '0.65rem', 
              color: cardioColor, 
              border: `1px solid ${cardioColor}44`,
              padding: '2px 5px',
              borderRadius: '2px',
              background: `${cardioColor}11`
            }}>
              {heartRate > 110 ? 'ECG: ELEVATED' : 'ECG: NOMINAL'}
            </div>
          </div>

          {/* Live ECG Canvas graph */}
          <div style={{ position: 'relative', width: '100%' }}>
            <svg viewBox="0 0 100 20" style={{
              width: '100%', 
              height: '35px', 
              background: 'rgba(0, 0, 0, 0.4)', 
              border: '1px solid rgba(0, 240, 255, 0.1)', 
              borderRadius: '3px'
            }}>
              {/* Gridlines */}
              <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(0, 240, 255, 0.05)" strokeWidth="0.5" />
              <line x1="25" y1="0" x2="25" y2="20" stroke="rgba(0, 240, 255, 0.05)" strokeWidth="0.5" />
              <line x1="50" y1="0" x2="50" y2="20" stroke="rgba(0, 240, 255, 0.05)" strokeWidth="0.5" />
              <line x1="75" y1="0" x2="75" y2="20" stroke="rgba(0, 240, 255, 0.05)" strokeWidth="0.5" />
              
              {/* Animating Waveform */}
              <path 
                d="M 0 10 L 15 10 L 17 8 L 19 12 L 21 10 L 26 10 L 28 2 L 31 18 L 33 10 L 40 10 L 42 9 L 44 11 L 46 10 L 60 10 L 62 8 L 64 12 L 66 10 L 71 10 L 73 2 L 76 18 L 78 10 L 85 10 L 87 9 L 89 11 L 91 10 L 100 10" 
                fill="none" 
                stroke={cardioColor} 
                strokeWidth="1.2" 
                className="ecg-line" 
                style={{
                  animationDuration: `${pulseDuration * 2}s`, // Match speed of rhythm
                  filter: `drop-shadow(0 0 2px ${cardioColor})`
                }}
              />
            </svg>
          </div>
        </div>

        {/* HP Integrity */}
        <div className="vital-item">
          <div className="vital-value-row">
            <span className="vital-label">HP Integrity (Biosecure)</span>
            <span className="vital-number mono" style={{ color: getBarColor(health, 'health'), fontSize: '1.15rem' }}>{health}%</span>
          </div>
          <div className="vital-bar-container">
            <div 
              className="vital-bar" 
              style={{ 
                width: `${health}%`, 
                backgroundColor: getBarColor(health, 'health'),
                boxShadow: `0 0 6px ${getBarColor(health, 'health')}`
              }}
            ></div>
          </div>
        </div>

        {/* Ammunition status */}
        <div className="vital-item">
          <div className="vital-value-row">
            <span className="vital-label">Ammunition status</span>
            <span className="vital-number mono" style={{ color: getBarColor(ammo, 'ammo'), fontSize: '1.15rem' }}>{ammo}%</span>
          </div>
          <div className="vital-bar-container">
            <div 
              className="vital-bar" 
              style={{ 
                width: `${ammo}%`, 
                backgroundColor: getBarColor(ammo, 'ammo'),
                boxShadow: `0 0 6px ${getBarColor(ammo, 'ammo')}`
              }}
            ></div>
          </div>
        </div>

        {/* Fatigue Index */}
        <div className="vital-item">
          <div className="vital-value-row">
            <span className="vital-label">Fatigue index</span>
            <span className="vital-number mono" style={{ color: getBarColor(fatigue, 'fatigue'), fontSize: '1.15rem' }}>{fatigue}%</span>
          </div>
          <div className="vital-bar-container">
            <div 
              className="vital-bar" 
              style={{ 
                width: `${fatigue}%`, 
                backgroundColor: getBarColor(fatigue, 'fatigue'),
                boxShadow: `0 0 6px ${getBarColor(fatigue, 'fatigue')}`
              }}
            ></div>
          </div>
        </div>

        {/* Battery Power */}
        <div className="vital-item">
          <div className="vital-value-row">
            <span className="vital-label">Hardware battery power</span>
            <span className="vital-number mono" style={{ color: getBarColor(battery, 'battery'), fontSize: '1.15rem' }}>{battery}%</span>
          </div>
          <div className="vital-bar-container">
            <div 
              className="vital-bar" 
              style={{ 
                width: `${battery}%`, 
                backgroundColor: getBarColor(battery, 'battery'),
                boxShadow: `0 0 6px ${getBarColor(battery, 'battery')}`
              }}
            ></div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-heart {
          0% { transform: scale(1); }
          30% { transform: scale(1.22); }
          45% { transform: scale(1.05); }
          60% { transform: scale(1.28); }
          100% { transform: scale(1); }
        }
      `}} />
    </div>
  );
}
