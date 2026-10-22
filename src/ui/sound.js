// =============================================================================
// Soundeffekte, erzeugt mit der Web Audio API (keine Audiodateien nötig)
// =============================================================================

let ctx = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(a, freq, start, dur, type = 'sine', gain = 0.12, slideTo = null) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime + start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + start + dur);
  g.gain.setValueAtTime(0.0001, a.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, a.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start);
  o.stop(a.currentTime + start + dur + 0.05);
}

function noise(a, start, dur, gain = 0.08, filterFreq = 1200) {
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = filterFreq;
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(a.destination);
  src.start(a.currentTime + start);
}

const SOUNDS = {
  tear: a => { noise(a, 0, 0.35, 0.18, 2400); tone(a, 300, 0.05, 0.25, 'triangle', 0.04, 900); },
  flip: a => { noise(a, 0, 0.08, 0.12, 3000); tone(a, 660, 0.02, 0.12, 'sine', 0.06); },
  shiny: a => { [784, 988, 1175, 1568].forEach((f, i) => tone(a, f, i * 0.08, 0.5, 'sine', 0.07)); },
  pick: a => { tone(a, 523, 0, 0.15, 'triangle', 0.1); tone(a, 784, 0.1, 0.25, 'triangle', 0.1); },
  goal: a => { noise(a, 0, 1.4, 0.16, 900); [523, 659, 784].forEach((f, i) => tone(a, f, 0.05 + i * 0.07, 0.6, 'triangle', 0.08)); },
  goalAgainst: a => { noise(a, 0, 0.9, 0.08, 600); tone(a, 220, 0.05, 0.5, 'sine', 0.06, 160); },
  whistle: a => { tone(a, 2200, 0, 0.35, 'sine', 0.05, 2350); },
  card: a => { tone(a, 440, 0, 0.12, 'triangle', 0.05, 660); },
  tap: a => { tone(a, 880, 0, 0.05, 'sine', 0.03); }
};

/** Kurze Vibration (Android), abschaltbar in den Einstellungen */
export function buzz(pattern, settings = {}) {
  if (settings.haptics === false) return;
  try { navigator.vibrate?.(pattern); } catch { /* ohne Vibration weiter */ }
}

export function playSound(name, settings) {
  if (!settings?.sound) return;
  try {
    const a = audio();
    if (a && SOUNDS[name]) SOUNDS[name](a);
  } catch {
    // Ton ist Beiwerk – Fehler werden ignoriert
  }
}
