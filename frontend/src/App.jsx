import React, { useState, useEffect } from 'react';
import SoldierVitals from './components/SoldierVitals';
import TacticalMap from './components/TacticalMap';
import VoiceConsole from './components/VoiceConsole';
import DecisionPanel from './components/DecisionPanel';
import AlertsPanel from './components/AlertsPanel';
import { playSound } from './utils/sound';

const API_BASE_URL = 'http://127.0.0.1:5000';

export default function App() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeStr, setTimeStr] = useState(new Date().toLocaleTimeString());

  // Periodically update HUD system time
  useEffect(() => {
    const timeTimer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timeTimer);
  }, []);

  // Fetch initial tactical state from Node gateway
  const fetchState = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/state`);
      if (!response.ok) throw new Error('Backend server connection failure.');
      const data = await response.json();
      setState(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('OFFLINE MODE: Connect to backend broker.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchState(true);
    // Poll telemetry data fluctuations every 2 seconds
    const pollInterval = setInterval(() => {
      fetchState(false);
    }, 2000);
    return () => clearInterval(pollInterval);
  }, []);

  // Post state modifications back to server (triggers route & risk updates)
  const handleUpdateState = async (updatedFields) => {
    if (!state) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      const data = await response.json();
      setState(data);
    } catch (err) {
      console.error('Failed to post state updates:', err);
    }
  };

  // Toggle map obstacle coordinate
  const handleToggleObstacle = (x, y) => {
    if (!state) return;
    const isAlreadyObs = state.obstacles.some(obs => obs[0] === x && obs[1] === y);
    let newObstacles;
    if (isAlreadyObs) {
      newObstacles = state.obstacles.filter(obs => !(obs[0] === x && obs[1] === y));
    } else {
      newObstacles = [...state.obstacles, [x, y]];
    }
    handleUpdateState({ obstacles: newObstacles });
  };

  // Post speech or text query to NLP handler
  const handleSubmitQuery = async (queryText) => {
    if (!state) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      });
      const data = await response.json();
      if (data.success) {
        setState(data.state);
      }
    } catch (err) {
      console.error('Failed to submit NLP query:', err);
    }
  };

  // Clear system alert log
  const handleClearAlerts = () => {
    handleUpdateState({ alerts: [] });
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'var(--font-hud)',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid rgba(0, 240, 255, 0.1)',
          borderTopColor: 'var(--neon-cyan)',
          borderRadius: '50%',
          animation: 'spin-border 1s linear infinite'
        }} />
        <div className="glow-text-cyan mono" style={{ fontSize: '1.2rem' }}>BOOTING TACTICAL CO-PILOT SYSTEM...</div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'var(--font-hud)',
        gap: '20px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem' }}>🚨</div>
        <div className="glow-text-red" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>BROKER CONNECTION DISRUPTED</div>
        <div className="mono" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '500px' }}>
          Please make sure the Node.js backend server is running on <code style={{ color: 'var(--neon-cyan)' }}>port 5000</code>. Run <code style={{ color: 'var(--neon-amber)' }}>npm run dev</code> inside the <code style={{ color: 'var(--neon-cyan)' }}>backend</code> folder to launch.
        </div>
        <button className="hud-btn" onClick={() => fetchState(true)}>Retry Connection</button>
      </div>
    );
  }

  const isRedAlert = state.riskProfile.status === 'RED';

  return (
    <div className="hud-container">
      {/* Red strobe lights on Critical Alerts */}
      {isRedAlert && <div className="strobe-alert" />}

      {/* Main Header HUD */}
      <header className="hud-header">
        <div className="hud-logo">
          <h1>AI Battlefield Co-Pilot</h1>
          <span>TACTICAL EDGE v1.2</span>
        </div>
        
        {/* Advanced Telemetry HUD Bar */}
        <div className="hud-time-vitals">
          <div className="mono" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>SECTOR:</span>
            <span className="glow-text-cyan" style={{ animation: 'text-flicker 3s infinite alternate' }}>ECHO-4</span>
          </div>

          <div className="mono" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>COORDS:</span>
            <span style={{ color: '#fff' }}>34.0522° N, 118.2437° W</span>
          </div>

          <div className="mono" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>GPS:</span>
            <span className="status-dot active" style={{ width: '6px', height: '6px', marginRight: '2px' }}></span>
            <span className="glow-text-green" style={{ fontSize: '0.78rem' }}>LOCK</span>
          </div>

          <div className="mono" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>SYS BAT:</span>
            <span style={{ 
              color: state.soldier.battery > 50 ? 'var(--neon-green)' : state.soldier.battery > 25 ? 'var(--neon-amber)' : 'var(--neon-red)' 
            }}>
              🔋 {state.soldier.battery}%
            </span>
          </div>

          <div className="mono" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '20px' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>SYS TIME:</span>
            <span className="glow-text-cyan">{timeStr}</span>
          </div>
          
          <div className="mono" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>ALARM STATUS:</span>
            <span className={isRedAlert ? 'glow-text-red' : 'glow-text-green'} style={{ fontWeight: 'bold' }}>
              {isRedAlert ? 'HAZARD THREAT' : 'SECURE'}
            </span>
          </div>
        </div>
      </header>

      {/* Primary Dashboard Grid */}
      <main className="hud-grid">
        {/* Left Column: Biometrics & Alerts */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '15px', minHeight: '0' }}>
          <SoldierVitals vitals={state.soldier} />
          <AlertsPanel alerts={state.alerts} onClearAlerts={handleClearAlerts} />
        </section>

        {/* Middle Column: Interactive Grid Map */}
        <section style={{ display: 'flex', flexDirection: 'column', minHeight: '0' }}>
          <TacticalMap 
            soldierPos={state.soldier}
            basePos={state.base}
            obstacles={state.obstacles}
            enemyThreats={state.enemyThreats}
            activeRoute={state.activeRoute}
            onToggleObstacle={handleToggleObstacle}
          />
        </section>

        {/* Right Column: AI Risk Controller & Voice Logs */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '15px', minHeight: '0' }}>
          <DecisionPanel 
            soldier={state.soldier}
            weather={state.weather}
            enemyProbability={state.enemyProbability}
            riskProfile={state.riskProfile}
            onUpdateState={handleUpdateState}
          />
          <VoiceConsole 
            voiceLogs={state.voiceLogs}
            onSubmitQuery={handleSubmitQuery}
          />
        </section>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes text-flicker {
          0% { opacity: 0.95; }
          40% { opacity: 0.95; }
          42% { opacity: 0.4; }
          43% { opacity: 0.95; }
          70% { opacity: 0.95; }
          72% { opacity: 0.35; }
          73% { opacity: 0.85; }
          90% { opacity: 0.95; }
          100% { opacity: 0.95; }
        }
      `}} />
    </div>
  );
}
