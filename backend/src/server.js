const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;
const PYTHON_AI_URL = 'http://127.0.0.1:8000';

app.use(cors());
app.use(express.json());

// Tactical State Database (In-Memory)
let tacticalState = {
  soldier: {
    x: 1,
    y: 1,
    health: 98,
    fatigue: 20, // 0 - 100
    ammo: 90,     // 0 - 100
    battery: 85,  // 0 - 100
    heartRate: 75 // bpm
  },
  base: {
    x: 13,
    y: 13
  },
  weather: {
    condition: 'CLEAR', // CLEAR, FOGGY, SANDSTORM
    visibility: 0.9     // 0.0 - 1.0
  },
  enemyProbability: 0.15, // 0.0 - 1.0 base chance in grid
  riskProfile: {
    risk_score: 0.18,
    status: 'GREEN',
    action: 'PROCEED',
    recommendation: 'SECURE: Risk profile is normal. Proceed along the planned route.'
  },
  obstacles: [
    [3, 3], [3, 4], [3, 5],
    [7, 7], [8, 7], [9, 7],
    [5, 10], [6, 10], [7, 10]
  ],
  terrainCosts: [], // Grid costs. Will default to 0.0
  enemyThreats: [
    { x: 5, y: 4, threat: 0.8 },
    { x: 10, y: 9, threat: 0.6 }
  ],
  activeRoute: [],
  alerts: [
    { id: '1', type: 'INFO', message: 'Tactical HUD initialized. Co-pilot online.', time: new Date().toLocaleTimeString() }
  ],
  voiceLogs: []
};

// --- MOCK FALLBACKS (In case Python AI Edge is offline) ---

// 1. NLP parsing fallback
function fallbackParseNLP(query, state) {
  const q = query.toLowerCase();
  let intent = 'UNKNOWN';
  
  if (q.includes('enemy') || q.includes('dushman') || q.includes('khatra') || q.includes('danger') || q.includes('threat')) {
    intent = 'ENEMY_CHECK';
  } else if (q.includes('route') || q.includes('rasta') || q.includes('path') || q.includes('safe') || q.includes('map')) {
    intent = 'ROUTE_PLAN';
  } else if (q.includes('ammo') || q.includes('goli') || q.includes('bullet') || q.includes('magazine')) {
    intent = 'AMMO_CHECK';
  } else if (q.includes('status') || q.includes('report') || q.includes('vitals') || q.includes('theek')) {
    intent = 'STATUS_CHECK';
  }

  const isHinglish = /kidhar|rasta|khatra|goli|bachi|hai|bata|ko|dushman/.test(q);
  let reply = '';

  const risk = state.riskProfile.risk_score;
  const ammo = state.soldier.ammo;

  if (intent === 'ENEMY_CHECK') {
    const hasThreat = state.enemyThreats.length > 0;
    if (hasThreat) {
      reply = isHinglish 
        ? "Dhyan dein! Sector mein dushman ki activity detect hui hai. Cover banayein." 
        : "Warning! Enemy activity detected in the active sector. Take cover.";
    } else {
      reply = isHinglish 
        ? "Aas-paas koi khatra nahi dikh raha hai. Sector safe hai."
        : "No immediate threats detected in your near vicinity.";
    }
  } else if (intent === 'ROUTE_PLAN') {
    if (risk > 0.6) {
      reply = isHinglish
        ? `Rasta khatarnak hai (Risk: ${Math.round(risk*100)}%). Alternate route recalculate kar diya hai.`
        : `Current route is compromised (Risk: ${Math.round(risk*100)}%). Diverting to safer route.`;
    } else {
      reply = isHinglish
        ? "Rasta safe hai, primary plan ke hisab se aage badein."
        : "Path is clear. Continue on primary course.";
    }
  } else if (intent === 'AMMO_CHECK') {
    if (ammo < 30) {
      reply = isHinglish
        ? `Alert! Ammo bohot kam hai, sirf ${ammo}% bacha hai. Resupply maangein.`
        : `Warning! Ammo is critically low at ${ammo}%. Request resupply immediately.`;
    } else {
      reply = isHinglish
        ? `Ammo paryaapt hai. Status: ${ammo}% bacha hai.`
        : `Ammo levels stable at ${ammo}%.`;
    }
  } else if (intent === 'STATUS_CHECK') {
    reply = isHinglish
      ? `System normal hai. Ammo ${ammo}%, Fatigue ${state.soldier.fatigue}%, Risk index ${Math.round(risk*100)}% hai.`
      : `All systems nominal. Ammo: ${ammo}%, Fatigue: ${state.soldier.fatigue}%. Current risk factor is ${Math.round(risk*100)}%.`;
  } else {
    reply = isHinglish
      ? "Samajh nahi aaya. Kripya dushman, rasta, ammo ya status ke baare mein poochein."
      : "Command unrecognized. Please query about route safety, enemies, ammo, or status.";
  }

  return { intent, confidence: 0.8, reply, query };
}

// 2. Risk score fallback
function fallbackCalculateRisk(state) {
  const enemyProb = state.enemyProbability;
  // Terrain danger simulated
  let terrainDanger = 0.2;
  if (state.weather.condition === 'SANDSTORM') terrainDanger = 0.8;
  else if (state.weather.condition === 'FOGGY') terrainDanger = 0.5;

  const visibility = state.weather.visibility;
  const fatigue = state.soldier.fatigue / 100;
  const ammo = state.soldier.ammo;

  const baseRisk = (enemyProb * 0.40) + (terrainDanger * 0.30) + ((1.0 - visibility) * 0.15) + (fatigue * 0.15);
  const ammoPenalty = ammo < 30 ? (0.15 * (1.0 - (ammo / 30.0))) : 0.0;
  
  const risk_score = Math.min(1.0, baseRisk + ammoPenalty);
  let status = 'GREEN';
  let action = 'PROCEED';
  let recommendation = 'SECURE: Risk profile is normal. Proceed along the planned route.';

  if (risk_score >= 0.70) {
    status = 'RED';
    action = 'REROUTE_MANDATORY';
    recommendation = 'ALERT: Critical risk index. Abandon current vector immediately. Initiating dynamic tactical rerouting.';
  } else if (risk_score >= 0.40) {
    status = 'YELLOW';
    action = 'PROCEED_WITH_CAUTION';
    recommendation = 'CAUTION: Elevated risk index. Proceed along primary route with high vigilance and stealth.';
  }

  return {
    risk_score: Math.round(risk_score * 100) / 100,
    status,
    action,
    recommendation
  };
}

// 3. Simple BFS/A* routing fallback on 15x15 grid
function fallbackFindRoute(start, end, obstacles, threats) {
  const width = 15;
  const height = 15;
  const obsSet = new Set(obstacles.map(o => `${o[0]},${o[1]}`));
  const threatMap = {};
  threats.forEach(t => {
    threatMap[`${t.x},${t.y}`] = t.threat;
  });

  const queue = [[start]];
  const visited = new Set([`${start[0]},${start[1]}`]);

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];
    const [cx, cy] = current;

    if (cx === end[0] && cy === end[1]) {
      return path;
    }

    // Neighbors (8-way)
    const dirs = [
      [-1,0],[1,0],[0,-1],[0,1],
      [-1,-1],[-1,1],[1,-1],[1,1]
    ];

    // Priority sorting: evaluate safer grid cells first
    const neighbors = [];
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      const key = `${nx},${ny}`;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !obsSet.has(key) && !visited.has(key)) {
        const threat = threatMap[key] || 0;
        neighbors.push({ pos: [nx, ny], cost: threat });
      }
    }

    // Sort neighbors so we prefer low threat cells
    neighbors.sort((a, b) => a.cost - b.cost);

    for (const neighbor of neighbors) {
      visited.add(`${neighbor.pos[0]},${neighbor.pos[1]}`);
      queue.push([...path, neighbor.pos]);
    }
  }
  return []; // No route
}

// Helper to trigger recalculation of route & risk
function recalculateState() {
  // 1. Calculate Risk
  tacticalState.riskProfile = fallbackCalculateRisk(tacticalState);

  // 2. Add alerts if risk is high
  const risk = tacticalState.riskProfile.risk_score;
  const alertCount = tacticalState.alerts.length;
  
  if (risk >= 0.70) {
    const hasRed = tacticalState.alerts.some(a => a.type === 'DANGER');
    if (!hasRed) {
      tacticalState.alerts.unshift({
        id: (alertCount + 1).toString(),
        type: 'DANGER',
        message: 'CRITICAL HAZARD: Route compromise high! Move to alternative vector.',
        time: new Date().toLocaleTimeString()
      });
    }
  } else if (risk >= 0.40) {
    const hasYellow = tacticalState.alerts.some(a => a.type === 'WARNING');
    if (!hasYellow) {
      tacticalState.alerts.unshift({
        id: (alertCount + 1).toString(),
        type: 'WARNING',
        message: 'WARNING: Elevated threat. Stealth mode recommended.',
        time: new Date().toLocaleTimeString()
      });
    }
  }

  // 3. Ammo alarms
  if (tacticalState.soldier.ammo < 30) {
    const hasAmmoAlert = tacticalState.alerts.some(a => a.message.includes('AMMO'));
    if (!hasAmmoAlert) {
      tacticalState.alerts.unshift({
        id: (alertCount + 2).toString(),
        type: 'WARNING',
        message: `WEAPONS ALERT: Ammunition level critically low (${tacticalState.soldier.ammo}%).`,
        time: new Date().toLocaleTimeString()
      });
    }
  }

  // Limit alerts length
  if (tacticalState.alerts.length > 20) {
    tacticalState.alerts = tacticalState.alerts.slice(0, 20);
  }
}

// Run path calculation initially
tacticalState.activeRoute = fallbackFindRoute(
  [tacticalState.soldier.x, tacticalState.soldier.y],
  [tacticalState.base.x, tacticalState.base.y],
  tacticalState.obstacles,
  tacticalState.enemyThreats
);

// --- REST API ENDPOINTS ---

// Fetch current state
app.get('/api/state', (req, res) => {
  recalculateState();
  res.json(tacticalState);
});

// Update state parameters from simulation panel
app.post('/api/state', (req, res) => {
  const { soldier, base, weather, obstacles, enemyThreats, enemyProbability, alerts } = req.body;
  
  if (soldier) tacticalState.soldier = { ...tacticalState.soldier, ...soldier };
  if (base) tacticalState.base = { ...tacticalState.base, ...base };
  if (weather) {
    tacticalState.weather = { ...tacticalState.weather, ...weather };
    if (weather.condition === 'SANDSTORM') {
      tacticalState.weather.visibility = 0.2;
    } else if (weather.condition === 'FOGGY') {
      tacticalState.weather.visibility = 0.45;
    } else {
      tacticalState.weather.visibility = 0.9;
    }
  }
  if (obstacles) tacticalState.obstacles = obstacles;
  if (enemyThreats) tacticalState.enemyThreats = enemyThreats;
  if (enemyProbability !== undefined) tacticalState.enemyProbability = enemyProbability;
  if (alerts) tacticalState.alerts = alerts;

  recalculateState();

  // Try to compute route via Python, fallback if it fails
  axios.post(`${PYTHON_AI_URL}/api/route`, {
    start: [tacticalState.soldier.x, tacticalState.soldier.y],
    end: [tacticalState.base.x, tacticalState.base.y],
    obstacles: tacticalState.obstacles,
    terrain_data: [],
    enemy_threats: tacticalState.enemyThreats
  })
  .then(response => {
    if (response.data.success) {
      tacticalState.activeRoute = response.data.path;
    } else {
      tacticalState.activeRoute = fallbackFindRoute(
        [tacticalState.soldier.x, tacticalState.soldier.y],
        [tacticalState.base.x, tacticalState.base.y],
        tacticalState.obstacles,
        tacticalState.enemyThreats
      );
    }
    res.json(tacticalState);
  })
  .catch(err => {
    // Fallback pathfinding
    tacticalState.activeRoute = fallbackFindRoute(
      [tacticalState.soldier.x, tacticalState.soldier.y],
      [tacticalState.base.x, tacticalState.base.y],
      tacticalState.obstacles,
      tacticalState.enemyThreats
    );
    res.json(tacticalState);
  });
});

// Post queries to the voice interface (supports text input)
app.post('/api/query', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  recalculateState();

  const logEntry = {
    id: Date.now().toString(),
    query,
    timestamp: new Date().toLocaleTimeString(),
    intent: 'UNKNOWN',
    reply: '',
    source: 'OFFLINE_ENGINE'
  };

  try {
    // 1. Send query to Python NLP
    const nlpRes = await axios.post(`${PYTHON_AI_URL}/api/nlp`, {
      query,
      context: {
        enemy_probability: tacticalState.enemyProbability,
        risk_score: tacticalState.riskProfile.risk_score,
        ammo: tacticalState.soldier.ammo,
        fatigue: tacticalState.soldier.fatigue,
        heart_rate: tacticalState.soldier.heartRate
      }
    });

    logEntry.intent = nlpRes.data.intent;
    logEntry.reply = nlpRes.data.reply;
    logEntry.source = 'EDGE_PYTHON';

    // If intent is ROUTE_PLAN, trigger route recalculation
    if (logEntry.intent === 'ROUTE_PLAN') {
      try {
        const routeRes = await axios.post(`${PYTHON_AI_URL}/api/route`, {
          start: [tacticalState.soldier.x, tacticalState.soldier.y],
          end: [tacticalState.base.x, tacticalState.base.y],
          obstacles: tacticalState.obstacles,
          terrain_data: [],
          enemy_threats: tacticalState.enemyThreats
        });
        if (routeRes.data.success) {
          tacticalState.activeRoute = routeRes.data.path;
        }
      } catch (e) {
        console.log("Python routing unavailable during NLP hook.");
      }
    }

    // Trigger Python Text-to-Speech locally
    axios.post(`${PYTHON_AI_URL}/api/tts`, {
      text: logEntry.reply,
      play_local: true,
      generate_file: false
    }).catch(e => console.log("TTS playback skipped on edge backend."));

  } catch (err) {
    // Call fallback if Python FastAPI is offline
    const fallback = fallbackParseNLP(query, tacticalState);
    logEntry.intent = fallback.intent;
    logEntry.reply = fallback.reply;
    logEntry.source = 'NODE_FALLBACK';

    if (logEntry.intent === 'ROUTE_PLAN') {
      tacticalState.activeRoute = fallbackFindRoute(
        [tacticalState.soldier.x, tacticalState.soldier.y],
        [tacticalState.base.x, tacticalState.base.y],
        tacticalState.obstacles,
        tacticalState.enemyThreats
      );
    }
  }

  // Add to state logs
  tacticalState.voiceLogs.unshift(logEntry);
  if (tacticalState.voiceLogs.length > 30) {
    tacticalState.voiceLogs = tacticalState.voiceLogs.slice(0, 30);
  }

  // Push to alerts list
  tacticalState.alerts.unshift({
    id: Date.now().toString(),
    type: 'INFO',
    message: `Copilot response: "${logEntry.reply}"`,
    time: new Date().toLocaleTimeString()
  });

  res.json({
    success: true,
    result: logEntry,
    state: tacticalState
  });
});

// Route recalculate trigger
app.post('/api/route/recalculate', async (req, res) => {
  try {
    const routeRes = await axios.post(`${PYTHON_AI_URL}/api/route`, {
      start: [tacticalState.soldier.x, tacticalState.soldier.y],
      end: [tacticalState.base.x, tacticalState.base.y],
      obstacles: tacticalState.obstacles,
      terrain_data: [],
      enemy_threats: tacticalState.enemyThreats
    });
    if (routeRes.data.success) {
      tacticalState.activeRoute = routeRes.data.path;
    }
  } catch (e) {
    tacticalState.activeRoute = fallbackFindRoute(
      [tacticalState.soldier.x, tacticalState.soldier.y],
      [tacticalState.base.x, tacticalState.base.y],
      tacticalState.obstacles,
      tacticalState.enemyThreats
    );
  }
  res.json({ success: true, path: tacticalState.activeRoute });
});

// Mock dynamic telemetry tick to simulate real soldier sensors
setInterval(() => {
  // Random small fluctuation in heart rate
  const hrOffset = Math.floor(Math.random() * 5) - 2;
  tacticalState.soldier.heartRate = Math.max(60, Math.min(160, tacticalState.soldier.heartRate + hrOffset));

  // Battery drains slowly
  if (Math.random() > 0.8) {
    tacticalState.soldier.battery = Math.max(0, tacticalState.soldier.battery - 1);
  }

  // Fatigue increases slightly if soldier moves, fluctuates otherwise
  if (Math.random() > 0.9) {
    tacticalState.soldier.fatigue = Math.max(10, Math.min(100, tacticalState.soldier.fatigue + 1));
  }

  recalculateState();
}, 4000);

app.listen(PORT, () => {
  console.log(`Node.js Backend Coordinator running on port ${PORT}`);
});
