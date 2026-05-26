// Offline Synthesizer using Web Audio API

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const playSound = {
  // Navigation tick sound
  tick: () => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio Context init blocked by browser policy.");
    }
  },

  // Voice command start confirmation
  confirm: () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Dual tone chirp
      [600, 900].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.05, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.1);
        
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.1);
      });
    } catch (e) {}
  },

  // Alert alarm chime
  alarm: () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Siren wobble
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.25);
      osc.frequency.linearRampToValueAtTime(440, now + 0.5);
      
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      
      osc.start();
      osc.stop(now + 0.5);
    } catch (e) {}
  },

  // Warning warning chirp (short beep double)
  warning: () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      [0, 0.15].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(750, now + delay);
        gain.gain.setValueAtTime(0.03, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.08);
        
        osc.start(now + delay);
        osc.stop(now + delay + 0.08);
      });
    } catch (e) {}
  }
};
