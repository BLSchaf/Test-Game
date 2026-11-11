// Game rules: pure, deterministic, shared by the game, the solver and the generator.

export const T = { FLOOR: 0, WALL: 1, LEAF: 2, BR_A: 3, BR_B: 4, BURROW: 5, HOLLOW: 6 };
// directions: 0 up, 1 right, 2 down, 3 left
export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];

const TURN_A = [1, 0, 3, 2]; // "/"  up->right, right->up, down->left, left->down
const TURN_B = [3, 2, 1, 0]; // "\"  up->left, right->down, down->right, left->up

/** Fill in derived lookup tables. `L` needs: w, h, cells, acorns, burrows, hollow, start, logs, monkey */
export function finalizeLevel(L) {
  const n = L.w * L.h;
  L.nb = new Int16Array(n * 4);
  for (let i = 0; i < n; i++) {
    const x = i % L.w, y = (i / L.w) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = x + DX[d], ny = y + DY[d];
      L.nb[i * 4 + d] = nx < 0 || ny < 0 || nx >= L.w || ny >= L.h ? -1 : ny * L.w + nx;
    }
  }
  L.acornBit = new Int8Array(n).fill(-1);
  L.acorns.forEach((idx, b) => { L.acornBit[idx] = b; });
  L.fullMask = (1 << L.acorns.length) - 1;
  L.stamp = new Int32Array(n * 4);
  L.stampId = 0;
  return L;
}

export function initialState(L) {
  return { p: L.start, mask: 0, logs: L.logs.slice().sort((a, b) => a - b), m: L.monkey };
}

export function isWon(L, s) {
  return s.mask === L.fullMask && L.cells[s.p] === T.HOLLOW;
}

/**
 * Dash in direction `d`. Returns the new state, or null when nothing changes.
 * If `ev` (array) is given, animation events are pushed to it.
 */
export function move(L, s, d, ev) {
  const cells = L.cells, nb = L.nb;
  let p = s.p, mask = s.mask, logs = s.logs, m = s.m, dir = d;
  let moved = false, changed = false;
  const stampId = ++L.stampId;
  for (;;) {
    const n = nb[p * 4 + dir];
    if (n < 0 || cells[n] === T.WALL) {
      if (ev) ev.push({ t: 'bump', at: p, dir, hard: true });
      break;
    }
    const li = logs.indexOf(n);
    if (li >= 0) {
      let q = n;
      for (;;) {
        const r = nb[q * 4 + dir];
        if (r < 0) break;
        const c = cells[r];
        if (c !== T.FLOOR && c !== T.LEAF) break;
        if (r === m || logs.indexOf(r) >= 0) break;
        const b = L.acornBit[r];
        if (b >= 0 && !(mask & (1 << b))) break;
        q = r;
        if (c === T.LEAF) break;
      }
      if (q !== n) {
        logs = logs.slice();
        logs[li] = q;
        logs.sort((a, b) => a - b);
        changed = true;
        if (ev) ev.push({ t: 'log', from: n, to: q, dir, at: p });
      } else if (ev) ev.push({ t: 'bump', at: p, dir, hard: false });
      break;
    }
    if (n === m) {
      m = p;
      p = n;
      moved = changed = true;
      if (ev) ev.push({ t: 'swap', from: m, to: p, dir });
      break;
    }
    p = n;
    moved = true;
    if (ev) ev.push({ t: 'step', to: p, dir });
    const key = p * 4 + dir;
    if (L.stamp[key] === stampId) break; // endless loop guard
    L.stamp[key] = stampId;
    const b = L.acornBit[p];
    if (b >= 0 && !(mask & (1 << b))) {
      mask |= 1 << b;
      if (ev) ev.push({ t: 'acorn', at: p, bit: b, last: mask === L.fullMask });
    }
    const c = cells[p];
    if (c === T.HOLLOW && mask === L.fullMask) break;
    if (c === T.LEAF) {
      if (ev) ev.push({ t: 'leaf', at: p });
      break;
    }
    if (c === T.BR_A || c === T.BR_B) {
      dir = c === T.BR_A ? TURN_A[dir] : TURN_B[dir];
      if (ev) ev.push({ t: 'turn', at: p, dir });
    } else if (c === T.BURROW) {
      const o = L.burrows[0] === p ? L.burrows[1] : L.burrows[0];
      if (o !== m && logs.indexOf(o) < 0) {
        if (ev) ev.push({ t: 'tele', from: p, to: o, dir });
        p = o;
        const k2 = p * 4 + dir;
        if (L.stamp[k2] === stampId) break;
        L.stamp[k2] = stampId;
      }
    }
  }
  if (!moved && !changed) return null;
  const ns = { p, mask, logs, m };
  if (ev && isWon(L, ns)) ev.push({ t: 'win', at: p });
  return ns;
}

function keyOf(L, s) {
  const n = L.w * L.h + 1;
  let k = s.mask * n + s.p;
  k = k * n + (s.m + 1);
  for (let i = 0; i < s.logs.length; i++) k = k * n + s.logs[i];
  return k;
}

/**
 * Breadth-first search for the shortest solution.
 * Returns { moves: number[] } | { unsolvable: true } | { overflow: true }.
 */
export function solve(L, start, maxNodes = 60000) {
  const s0 = start || initialState(L);
  if (isWon(L, s0)) return { moves: [] };
  const states = [s0];
  const parent = [-1];
  const via = [-1];
  const seen = new Set([keyOf(L, s0)]);
  for (let head = 0; head < states.length; head++) {
    const s = states[head];
    for (let d = 0; d < 4; d++) {
      const ns = move(L, s, d);
      if (!ns) continue;
      const k = keyOf(L, ns);
      if (seen.has(k)) continue;
      seen.add(k);
      states.push(ns);
      parent.push(head);
      via.push(d);
      if (isWon(L, ns)) {
        const moves = [];
        for (let i = states.length - 1; i > 0; i = parent[i]) moves.push(via[i]);
        return { moves: moves.reverse(), nodes: states.length };
      }
      if (states.length > maxNodes) return { overflow: true };
    }
  }
  return { unsolvable: true, nodes: states.length };
}
