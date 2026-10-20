// =============================================================================
// Seeded Zufallsgenerator (mulberry32)
// Der Zustand ist eine einzige Zahl und liegt im Spielstand. Dadurch ist jede
// Simulation reproduzierbar – Voraussetzung für Tests und späteren Mehrspieler.
// =============================================================================

export function createRng(seed) {
  let s = seed >>> 0;

  function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  const rng = {
    next,
    /** Aktueller Zustand, um ihn im Spielstand abzulegen */
    state: () => s,
    /** Ganzzahl zwischen min und max (beide inklusive) */
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    float(min, max) {
      return min + next() * (max - min);
    },
    chance(p) {
      return next() < p;
    },
    pick(arr) {
      return arr[Math.floor(next() * arr.length)];
    },
    /** Normalverteilt (Box-Muller), gekappt auf ±3 Sigma */
    normal(mean = 0, sd = 1) {
      const u = Math.max(next(), 1e-9);
      const v = next();
      const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      return mean + sd * Math.max(-3, Math.min(3, z));
    },
    /** Poisson-verteilte Ganzzahl (für Torchancen) */
    poisson(lambda) {
      const L = Math.exp(-lambda);
      let k = 0;
      let p = 1;
      do {
        k++;
        p *= next();
      } while (p > L);
      return k - 1;
    },
    shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    /** Auswahl nach Gewichten: items = [{ value, weight }] */
    weighted(items) {
      const total = items.reduce((sum, it) => sum + it.weight, 0);
      let r = next() * total;
      for (const it of items) {
        r -= it.weight;
        if (r <= 0) return it.value;
      }
      return items[items.length - 1].value;
    }
  };
  return rng;
}

/** Führt fn mit einem RNG aus, der aus state.rng gespeist wird, und schreibt den Zustand zurück. */
export function withRng(state, fn) {
  const rng = createRng(state.rng);
  const result = fn(rng);
  state.rng = rng.state();
  return result;
}

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
