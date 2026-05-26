import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import { playSound } from '../utils/sound';

export default function VoiceConsole({ voiceLogs, onSubmitQuery }) {
  const [textQuery, setTextQuery] = useState('');
  const terminalEndRef = useRef(null);

  const handleSpeechResult = useCallback((transcript) => {
    playSound.confirm();
    if (onSubmitQuery) {
      onSubmitQuery(transcript);
    }
  }, [onSubmitQuery]);

  const { isListening, speechSupported, startListening, stopListening } = useSpeech(handleSpeechResult);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [voiceLogs]);

  const handleMicToggle = () => {
    if (isListening) {
      playSound.tick();
      stopListening();
    } else {
      playSound.confirm();
      startListening();
    }
  };

  const handleSubmitText = (e) => {
    e.preventDefault();
    if (!textQuery.trim()) return;
    playSound.tick();
    if (onSubmitQuery) {
      onSubmitQuery(textQuery);
    }
    setTextQuery('');
  };

  const handleQuickCommand = (cmdText) => {
    playSound.tick();
    if (onSubmitQuery) {
      onSubmitQuery(cmdText);
    }
  };

  return (
    <div className="hud-panel">
      <div className="hud-panel-header">
        <h3>Voice Interface & Console</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="status-dot active"></span>
          <span className="mono" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>OFFLINE NLP</span>
        </div>
      </div>
      
      <div className="hud-panel-body" style={{ gap: '10px' }}>
        {/* Voice Trigger Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(2, 10, 22, 0.45)',
          padding: '10px 14px',
          border: '1px solid rgba(0, 240, 255, 0.12)',
          borderRadius: '4px'
        }}>
          <div>
            <div className="vital-label" style={{ marginBottom: '2px' }}>Comm Link Mode</div>
            <div className="mono glow-text-cyan" style={{ fontSize: '0.82rem', fontWeight: 'bold' }}>
              {isListening ? 'COMMLINK OPEN' : 'AWAITING VOX'}
            </div>
          </div>
          
          {/* Glowing Waveform and Microphone Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={`audio-wave ${isListening ? 'active' : ''}`}>
              <div className="audio-bar" style={{ backgroundColor: isListening ? 'var(--neon-red)' : 'var(--neon-cyan)' }}></div>
              <div className="audio-bar" style={{ backgroundColor: isListening ? 'var(--neon-red)' : 'var(--neon-cyan)' }}></div>
              <div className="audio-bar" style={{ backgroundColor: isListening ? 'var(--neon-red)' : 'var(--neon-cyan)' }}></div>
              <div className="audio-bar" style={{ backgroundColor: isListening ? 'var(--neon-red)' : 'var(--neon-cyan)' }}></div>
              <div className="audio-bar" style={{ backgroundColor: isListening ? 'var(--neon-red)' : 'var(--neon-cyan)' }}></div>
              <div className="audio-bar" style={{ backgroundColor: isListening ? 'var(--neon-red)' : 'var(--neon-cyan)' }}></div>
            </div>
            
            <button 
              className={`hud-btn ${isListening ? 'btn-danger' : 'btn-green'}`}
              onClick={handleMicToggle}
              style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0',
                fontSize: '1.25rem',
                boxShadow: isListening ? 'var(--glow-red)' : 'var(--glow-green)'
              }}
              title={speechSupported ? "Press to talk" : "Speech Synthesis unsupported in browser"}
            >
              🎤
            </button>
          </div>
        </div>

        {/* Tactical Log Terminal */}
        <div className="mono" style={{
          flex: 1,
          background: 'rgba(1, 6, 16, 0.85)',
          border: '1px solid rgba(0,240,255,0.18)',
          borderRadius: '4px',
          padding: '12px',
          fontSize: '0.8rem',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '170px',
          maxHeight: '270px',
          overflowY: 'auto',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.9)'
        }}>
          <div style={{ 
            borderBottom: '1px solid rgba(0,240,255,0.12)', 
            paddingBottom: '5px', 
            marginBottom: '10px', 
            color: 'rgba(0,240,255,0.5)', 
            fontSize: '0.68rem',
            fontWeight: 'bold',
            letterSpacing: '1px'
          }}>
            TACTICAL CO-PILOT COMMUNICATIONS TERMINAL
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {voiceLogs.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', fontSize: '0.78rem' }}>
                &gt; No active transmissions. Press microphone or enter text command below.
              </div>
            ) : (
              voiceLogs.map((log) => (
                <div key={log.id} className="voice-log-item">
                  <div className="voice-header">
                    <span style={{ color: 'var(--neon-cyan)', fontWeight: 'bold' }}>INTENT: {log.intent} (Conf: {log.confidence})</span>
                    <span>{log.timestamp}</span>
                  </div>
                  <div className="voice-query">
                    <span style={{ color: 'rgba(255,255,255,0.4)', marginRight: '6px' }}>SLDR_081&gt;</span>
                    "{log.query}"
                  </div>
                  <div className="voice-reply">
                    <span style={{ color: 'var(--neon-green)', fontWeight: 'bold', marginRight: '6px' }}>COPILOT&gt;</span>
                    {log.reply}
                  </div>
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Text Override Input */}
        <form onSubmit={handleSubmitText} style={{ display: 'flex', gap: '6px' }}>
          <div style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            alignItems: 'center'
          }}>
            <span className="mono" style={{
              position: 'absolute',
              left: '10px',
              color: 'rgba(0, 240, 255, 0.4)',
              fontSize: '0.8rem',
              pointerEvents: 'none'
            }}>SLDR_081&gt;</span>
            <input
              type="text"
              className="mono"
              placeholder="Type query (e.g. enemy nearby?)..."
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid var(--border-color)',
                borderRadius: '3px',
                padding: '8px 10px 8px 85px',
                color: '#fff',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            />
          </div>
          <button type="submit" className="hud-btn">Execute</button>
        </form>

        {/* Quick Test Queries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="vital-label" style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>Quick Command Presets</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            <button className="hud-btn" style={{ fontSize: '0.65rem', padding: '4px 8px' }} onClick={() => handleQuickCommand("Enemy nearby?")}>
              Enemy check
            </button>
            <button className="hud-btn" style={{ fontSize: '0.65rem', padding: '4px 8px' }} onClick={() => handleQuickCommand("dushman kidhar hai?")}>
              dushman kidhar hai?
            </button>
            <button className="hud-btn" style={{ fontSize: '0.65rem', padding: '4px 8px' }} onClick={() => handleQuickCommand("Best route to base")}>
              Safe Route
            </button>
            <button className="hud-btn" style={{ fontSize: '0.65rem', padding: '4px 8px' }} onClick={() => handleQuickCommand("safe rasta batao")}>
              safe rasta batao
            </button>
            <button className="hud-btn" style={{ fontSize: '0.65rem', padding: '4px 8px' }} onClick={() => handleQuickCommand("Ammo status")}>
              Ammo status
            </button>
            <button className="hud-btn" style={{ fontSize: '0.65rem', padding: '4px 8px' }} onClick={() => handleQuickCommand("status report")}>
              Status report
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
