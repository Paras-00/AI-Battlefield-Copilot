import React, { useEffect, useRef } from 'react';
import { playSound } from '../utils/sound';

export default function AlertsPanel({ alerts, onClearAlerts }) {
  const lastAlertIdRef = useRef(null);

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      const topAlert = alerts[0];
      
      if (lastAlertIdRef.current !== topAlert.id) {
        lastAlertIdRef.current = topAlert.id;
        
        if (topAlert.type === 'DANGER') {
          playSound.alarm();
        } else if (topAlert.type === 'WARNING') {
          playSound.warning();
        } else if (topAlert.type === 'INFO') {
          playSound.tick();
        }
      }
    }
  }, [alerts]);

  const handleClear = () => {
    playSound.tick();
    if (onClearAlerts) {
      onClearAlerts();
    }
  };

  const getAlertTag = (type) => {
    if (type === 'DANGER') return '🚨 CRITICAL';
    if (type === 'WARNING') return '⚠️ WARNING';
    return '🛰️ SYSTEM';
  };

  return (
    <div className="hud-panel" style={{ maxHeight: '250px', flex: 1 }}>
      <div className="hud-panel-header">
        <h3>Alert & Diagnostics Log</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className="hud-btn" 
            style={{ fontSize: '0.6rem', padding: '2px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={handleClear}
          >
            Clear Log
          </button>
          <span className="mono glow-text-amber" style={{ fontSize: '0.72rem' }}>
            ALARM CTR: {alerts.filter(a => a.type === 'DANGER' || a.type === 'WARNING').length}
          </span>
        </div>
      </div>
      <div className="hud-panel-body" style={{ padding: '10px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.length === 0 ? (
            <div className="mono" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', padding: '15px', textAlign: 'center' }}>
              &gt; No active warnings. Logs clear.
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className={`alert-log-item alert-type-${alert.type}`}>
                <div className="alert-item-header">
                  <span>{getAlertTag(alert.type)}</span>
                  <span>{alert.time}</span>
                </div>
                <div className="alert-item-msg mono">{alert.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
