// Seeded procedural level generator. Every level is verified by the solver,
// which also yields the minimum number of moves ("par").
import { T, finalizeLevel, initialState, move, solve } from './rules.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash2(a, b) {
  let h = (a ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = (h + Math.imul(b + 0x7f4a7c15, 0xc2b2ae35)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0x27d4eb2f) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

// Journey level at which each element first appears.
export const UNLOCK = { leaf: 4, log: 8, branch: 13, burrow: 19, monkey: 26 };
const FEATURES = ['leaf', 'log', 'branch', 'burrow', 'monkey'];

export function biomeOf(n) {
  return ['autumn', 'dusk', 'frost'][Math.floor((n - 1) / 13) % 3];
}

/** Difficulty parameters for journey level n (1-based). */
export function paramsFor(n, rnd) {
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  let w, h;
  if (n <= 2) [w, h] = [5, 6];
  else if (n < 8) [w, h] = [6, 7];
  else if (n < 19) [w, h] = [6, 8];
  else if (n < 30) [w, h] = rnd() < 0.5 ? [6, 8] : [7, 9];
  else [w, h] = rnd() < 0.35 ? [6, 8] : [7, 9];

  const unlocked = FEATURES.filter((f) => n >= UNLOCK[f]);
  const intro = FEATURES.find((f) => UNLOCK[f] === n) || null;
  let feats = [];
  if (intro) feats = [intro];
  else if (unlocked.length) {
    const pool = unlocked.slice();
    // freshly unlocked elements show up more often for a while
    const weights = pool.map((f) => (n - UNLOCK[f] < 4 ? 3 : 1));
    const count = Math.min(pool.length, n < 12 ? 1 : ri(1, n < 22 ? 2 : 3));
    for (let i = 0; i < count; i++) {
      const total = weights.reduce((a, b) => a + b, 0);
      let r = rnd() * total, k = 0;
      while (r >= weights[k]) r -= weights[k++];
      feats.push(pool[k]);
      pool.splice(k, 1);
      weights.splice(k, 1);
    }
  }
  const breather = n > 5 && n % 5 === 0;
  let center = Math.min(3 + n * 0.24, 11);
  if (intro) center = Math.max(3, center - 2.5);
  else if (breather) center -= 2;
  if (n === 1) center = 2.6;
  const minPar = Math.max(2, Math.round(center - 1));
  const maxPar = Math.round(center + 1.6);
  let acorns = Math.min(6, 2 + Math.floor(n / 7) + (n > 3 && rnd() < 0.4 ? 1 : 0));
  if (intro) acorns = Math.max(2, acorns - 1);
  return {
    w, h, acorns, minPar, maxPar, intro,
    walls: 0.1 + rnd() * 0.07,
    leaf: feats.includes('leaf') ? ri(1, 3) : 0,
    log: feats.includes('log') ? ri(1, 2) : 0,
    branch: feats.includes('branch') ? ri(1, 3) : 0,
    burrow: feats.includes('burrow') ? 1 : 0,
    monkey: feats.includes('monkey') ? 1 : 0,
  };
}

function shuffle(arr, rnd) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildCandidate(P, rnd) {
  const { w, h } = P;
  const n = w * h;
  const cells = new Uint8Array(n);
  const wallCount = Math.round(n * P.walls);
  const order = shuffle([...Array(n).keys()], rnd);
  for (let i = 0; i < wallCount; i++) cells[order[i]] = T.WALL;

  // keep only the largest connected floor region
  const comp = new Int16Array(n).fill(-1);
  let best = -1, bestSize = 0, cid = 0;
  for (let i = 0; i < n; i++) {
    if (cells[i] === T.WALL || comp[i] >= 0) continue;
    const stack = [i];
    comp[i] = cid;
    let size = 0;
    while (stack.length) {
      const c = stack.pop();
      size++;
      const x = c % w, y = (c / w) | 0;
      if (x > 0 && cells[c - 1] !== T.WALL && comp[c - 1] < 0) { comp[c - 1] = cid; stack.push(c - 1); }
      if (x < w - 1 && cells[c + 1] !== T.WALL && comp[c + 1] < 0) { comp[c + 1] = cid; stack.push(c + 1); }
      if (y > 0 && cells[c - w] !== T.WALL && comp[c - w] < 0) { comp[c - w] = cid; stack.push(c - w); }
      if (y < h - 1 && cells[c + w] !== T.WALL && comp[c + w] < 0) { comp[c + w] = cid; stack.push(c + w); }
    }
    if (size > bestSize) { bestSize = size; best = cid; }
    cid++;
  }
  const free = [];
  for (let i = 0; i < n; i++) {
    if (cells[i] !== T.WALL && comp[i] !== best) cells[i] = T.WALL;
    if (cells[i] !== T.WALL) free.push(i);
  }
  const need = P.leaf + P.branch + P.burrow * 2 + 1 + P.log + P.monkey + 1 + P.acorns;
  if (free.length < need + 6) return null;
  shuffle(free, rnd);
  let k = 0;
  const take = () => free[k++];
  for (let i = 0; i < P.leaf; i++) cells[take()] = T.LEAF;
  for (let i = 0; i < P.branch; i++) cells[take()] = rnd() < 0.5 ? T.BR_A : T.BR_B;
  let burrows = null;
  if (P.burrow) {
    burrows = [take(), take()];
    cells[burrows[0]] = cells[burrows[1]] = T.BURROW;
  }
  const hollow = take();
  cells[hollow] = T.HOLLOW;
  const logs = [];
  for (let i = 0; i < P.log; i++) logs.push(take());
  const monkey = P.monkey ? take() : -1;
  const start = take();
  const acorns = [];
  for (let i = 0; i < P.acorns; i++) acorns.push(take());
  return finalizeLevel({ w, h, cells, acorns, burrows, hollow, start, logs, monkey });
}

const EVENT_FEATURE = { leaf: 'leaf', log: 'log', turn: 'branch', tele: 'burrow', swap: 'monkey' };

function usedFeatures(L, moves) {
  const used = new Set();
  let s = initialState(L);
  for (const d of moves) {
    const ev = [];
    s = move(L, s, d, ev);
    for (const e of ev) if (EVENT_FEATURE[e.t]) used.add(EVENT_FEATURE[e.t]);
  }
  return used;
}

/**
 * Generator-style implementation so callers can spread the work over frames.
 * Yields after each attempt; returns the finished level.
 */
export function* generateSteps(seed, n, opts = {}) {
  const rnd = mulberry32(hash2(seed, n));
  const P = opts.params || paramsFor(n, rnd);
  const present = FEATURES.filter((f) => P[f] > 0);
  let fallback = null, fallbackScore = Infinity;
  const MAX = 500;
  for (let attempt = 0; attempt < MAX; attempt++) {
    const L = buildCandidate(P, rnd);
    if (L) {
      const res = solve(L, null, 40000);
      if (res.moves && res.moves.length >= 1) {
        const par = res.moves.length;
        const used = usedFeatures(L, res.moves);
        const usedCount = present.filter((f) => used.has(f)).length;
        const needUsed = Math.min(present.length, 2);
        const introOk = !P.intro || used.has(P.intro);
        const parOk = par >= P.minPar && par <= P.maxPar;
        const done = parOk && introOk && usedCount >= needUsed;
        const score =
          (par < P.minPar ? (P.minPar - par) * 2 : par > P.maxPar ? par - P.maxPar : 0) +
          (introOk ? 0 : 6) + (needUsed - Math.min(usedCount, needUsed)) * 2;
        if (done || score < fallbackScore) {
          L.par = par;
          L.solution = res.moves;
          L.seed = seed;
          L.n = n;
          L.intro = P.intro;
          L.features = present;
          if (done) return L;
          fallback = L;
          fallbackScore = score;
        }
      }
    }
    yield attempt;
  }
  if (fallback) return fallback;
  // Extremely unlikely: fall back to a simple open level.
  return yield* generateSteps(seed ^ 0x5bd1e995, n, {
    params: { w: 6, h: 7, acorns: 3, minPar: 1, maxPar: 99, intro: null, walls: 0.14, leaf: 0, log: 0, branch: 0, burrow: 0, monkey: 0 },
  });
}

export function generateSync(seed, n, opts) {
  const it = generateSteps(seed, n, opts);
  for (;;) {
    const r = it.next();
    if (r.done) return r.value;
  }
}

/** Runs the generator in slices so the UI stays responsive. Result is independent of timing. */
export function generateAsync(seed, n, opts) {
  return new Promise((resolve) => {
    const it = generateSteps(seed, n, opts);
    const slice = () => {
      const t0 = performance.now();
      for (;;) {
        const r = it.next();
        if (r.done) return resolve(r.value);
        if (performance.now() - t0 > 10) break;
      }
      setTimeout(slice, 0);
    };
    slice();
  });
}

/** Parameters for the daily puzzle: a full-featured, medium-hard clearing. */
export function dailyParams(rnd) {
  const P = paramsFor(34, rnd);
  P.minPar = 8;
  P.maxPar = 12;
  return P;
}

export function generateDaily(dateKey) {
  const seed = hash2(0xda11e, dateKey);
  const rnd = mulberry32(seed);
  return generateAsync(seed, 34, { params: dailyParams(rnd) });
}
