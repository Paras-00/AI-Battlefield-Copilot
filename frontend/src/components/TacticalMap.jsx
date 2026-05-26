import React from 'react';
import { playSound } from '../utils/sound';

export default function TacticalMap({ 
  soldierPos, 
  basePos, 
  obstacles, 
  enemyThreats, 
  activeRoute, 
  onToggleObstacle 
}) {
  const width = 15;
  const height = 15;

  const isObstacle = (x, y) => {
    return obstacles.some(obs => obs[0] === x && obs[1] === y);
  };

  const getThreat = (x, y) => {
    const matched = enemyThreats.find(t => t.x === x && t.y === y);
    return matched ? matched.threat : 0;
  };

  const isPath = (x, y) => {
    if ((x === soldierPos.x && y === soldierPos.y) || (x === basePos.x && y === basePos.y)) {
      return false;
    }
    return activeRoute.some(node => node[0] === x && node[1] === y);
  };

  const handleCellClick = (x, y) => {
    if ((x === soldierPos.x && y === soldierPos.y) || (x === basePos.x && y === basePos.y)) {
      return;
    }
    playSound.tick();
    if (onToggleObstacle) {
      onToggleObstacle(x, y);
    }
  };

  // Render 15x15 grid cells row-by-row
  const renderCells = () => {
    const cells = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let cellClass = 'grid-cell cell-normal';
        let customStyle = {};

        const threat = getThreat(x, y);

        if (x === soldierPos.x && y === soldierPos.y) {
          cellClass = 'grid-cell cell-soldier';
        } else if (x === basePos.x && y === basePos.y) {
          cellClass = 'grid-cell cell-base';
        } else if (isObstacle(x, y)) {
          cellClass = 'grid-cell cell-obstacle';
        } else if (isPath(x, y)) {
          cellClass = 'grid-cell cell-path';
        } else if (threat > 0.6) {
          cellClass = 'grid-cell cell-threat-high';
        } else if (threat > 0.2) {
          cellClass = 'grid-cell cell-threat-low';
        }

        cells.push(
          <div
            key={`${x}-${y}`}
            className={cellClass}
            style={customStyle}
            onClick={() => handleCellClick(x, y)}
            title={`Sector: [${x}, ${y}]${threat > 0 ? ` | Threat: ${Math.round(threat*100)}%` : ' | Clear'}`}
          />
        );
      }
    }
    return cells;
  };

  // Generate coordinate array indices [0..14]
  const coordIndices = Array.from({ length: 15 }, (_, i) => i);

  return (
    <div className="hud-panel" style={{ flex: 1.5 }}>
      <div className="hud-panel-header">
        <h3>Tactical Battlefield Matrix</h3>
        <span className="mono glow-text-cyan" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
          RADAR SYSTEM ACTIVE
        </span>
      </div>
      <div className="hud-panel-body" style={{ justifyContent: 'center', alignItems: 'center' }}>
        
        {/* Dynamic status coordinates readout */}
        <div className="mono" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          width: '100%', 
          maxWidth: '465px',
          background: 'rgba(0, 240, 255, 0.05)',
          padding: '6px 12px',
          border: '1px solid rgba(0, 240, 255, 0.15)',
          borderRadius: '3px',
          fontSize: '0.72rem',
          marginBottom: '10px'
        }}>
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>SOLDIER VECTOR: </span>
            <span className="glow-text-cyan">[{soldierPos.x}, {soldierPos.y}]</span>
          </div>
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>BASE DEST: </span>
            <span className="glow-text-green">[{basePos.x}, {basePos.y}]</span>
          </div>
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>PATH NODES: </span>
            <span style={{ color: 'var(--neon-blue)', fontWeight: 'bold' }}>{activeRoute.length}</span>
          </div>
        </div>

        <div className="map-outer-container">
          <div className="map-coordinate-box">
            {/* Top Coordinate Header (X-axis) */}
            <div className="map-header-coords">
              {coordIndices.map(idx => (
                <div key={idx} style={{ width: '100%' }}>{idx}</div>
              ))}
            </div>

            {/* Left Coordinates (Y-axis) */}
            <div className="map-left-coords">
              {coordIndices.map(idx => (
                <div key={idx}>{idx}</div>
              ))}
            </div>

            {/* Main 15x15 Matrix Map */}
            <div className="tactical-grid">
              {renderCells()}
            </div>
          </div>

          {/* Map Legend */}
          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-color soldier"></div>
              <span>Soldier</span>
            </div>
            <div className="legend-item">
              <div className="legend-color base"></div>
              <span>Objective Base</span>
            </div>
            <div className="legend-item">
              <div className="legend-color path"></div>
              <span>Safe Vector</span>
            </div>
            <div className="legend-item">
              <div className="legend-color obstacle"></div>
              <span>Obstacle</span>
            </div>
            <div className="legend-item">
              <div className="legend-color threat"></div>
              <span>Danger Zone</span>
            </div>
          </div>
          
          <div className="mono" style={{ fontSize: '0.65rem', textAlign: 'center', marginTop: '15px', color: 'rgba(255,255,255,0.45)', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '10px', width: '100%', maxWidth: '440px' }}>
            💡 Tip: Click any cell to toggle obstacles. Route vector automatically bypasses obstacles and danger zones.
          </div>
        </div>
      </div>
    </div>
  );
}
