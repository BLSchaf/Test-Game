// Board: draws a level on the canvas and plays the move animations.
import { T, DX, DY } from './rules.js';
import { TS, getSprites } from './sprites.js';
import { hash2 } from './generator.js';

const STEP_TIME = 0.045;

export class Board {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.level = null;
    this.insets = { top: 0, bottom: 0 };
    this.queue = [];
    this.particles = [];
    this.ambient = [];
    this.time = 0;
    this.shake = 0;
    this.hintDir = -1;
    this.sfx = () => {};
    this.dim = 0;
    this.playerKind = 'squirrel';
    this.wobble = {};
    this.resize();
  }

  get busy() { return this.queue.length > 0; }

  setLevel(L, state, biome, playerKind) {
    this.level = L;
    this.biomeName = biome;
    this.S = getSprites(biome);
    this.playerKind = playerKind || 'squirrel';
    this.queue = [];
    this.particles = [];
    this.wobble = {};
    this.hintDir = -1;
    this.wallKind = new Uint8Array(L.w * L.h);
    for (let i = 0; i < L.w * L.h; i++) this.wallKind[i] = hash2(L.seed ^ (L.n * 131), i) % this.S.walls.length;
    this.snap(state);
    this.layout();
    if (this.ambientKind !== this.S.biome.ambient) {
      this.ambientKind = this.S.biome.ambient;
      this.ambient = [];
    }
  }

  snap(state) {
    const L = this.level;
    this.queue = [];
    this.state = state;
    this.pl = { x: state.p % L.w, y: (state.p / L.w) | 0, face: this.pl ? this.pl.face : 'r', oy: 0, ox: 0, scale: 1 };
    this.mk = state.m >= 0 ? { x: state.m % L.w, y: (state.m / L.w) | 0, oy: 0 } : null;
    this.logs = state.logs.map((i) => ({ x: i % L.w, y: (i / L.w) | 0, cell: i }));
    this.mask = state.mask;
    this.open = state.mask === L.fullMask ? 1 : 0;
    this.hintDir = -1;
  }

  resize(insets) {
    if (insets) this.insets = insets;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = Math.max(1, Math.round(window.innerWidth * dpr));
    const h = Math.max(1, Math.round(window.innerHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.dpr = dpr;
    this.layout();
  }

  layout() {
    const L = this.level;
    if (!L) return;
    const W = this.canvas.width, H = this.canvas.height;
    const top = this.insets.top * this.dpr, bottom = this.insets.bottom * this.dpr;
    const availH = Math.max(50, H - top - bottom);
    let s = Math.min(W / ((L.w + 1.2) * TS), availH / ((L.h + 1.2) * TS));
    s = s >= 2 ? Math.floor(s) : Math.max(1, Math.floor(s * 2) / 2);
    s = Math.min(s, 6 * Math.ceil(this.dpr));
    this.s = s;
    this.tile = TS * s;
    this.ox = Math.round((W - L.w * this.tile) / 2);
    this.oy = Math.round(top + (availH - L.h * this.tile) / 2);
  }

  // ---------------------------------------------------------------- animation

  nudge(dir) {
    if (this.busy) return;
    this.queue.push(this.bumpAnim(dir, true));
  }

  bumpAnim(dir, hard) {
    const pl = this.pl;
    return {
      dur: 0.11,
      start: () => { this.sfx('bump'); if (hard) this.shake = Math.max(this.shake, 1.2); },
      update: (k) => {
        const a = Math.sin(k * Math.PI) * 0.16;
        pl.ox = DX[dir] * a;
        pl.oy2 = DY[dir] * a;
      },
      end: () => { pl.ox = 0; pl.oy2 = 0; },
    };
  }

  play(events, finalState, done) {
    const L = this.level;
    const pl = this.pl;
    const q = this.queue;
    this.hintDir = -1;
    let first = true;
    for (const e of events) {
      switch (e.t) {
        case 'step': {
          const tx = e.to % L.w, ty = (e.to / L.w) | 0;
          const isFirst = first;
          let sx, sy;
          q.push({
            dur: STEP_TIME,
            start: () => {
              sx = pl.x; sy = pl.y;
              if (e.dir === 1) pl.face = 'r';
              if (e.dir === 3) pl.face = 'l';
              if (isFirst) this.sfx('move');
              this.dust(sx, sy, e.dir);
            },
            update: (k) => { pl.x = sx + (tx - sx) * k; pl.y = sy + (ty - sy) * k; },
            end: () => { pl.x = tx; pl.y = ty; },
          });
          break;
        }
        case 'acorn':
          q.push({
            dur: 0,
            start: () => {
              this.mask |= 1 << e.bit;
              this.sfx('acorn');
              this.sparkle(e.at % L.w, (e.at / L.w) | 0, ['#fff3c4', '#f4c95a', '#ffffff']);
              if (e.last) { this.opening = 0.001; setTimeout(() => this.sfx('open'), 140); }
            },
          });
          break;
        case 'leaf':
          q.push({ dur: 0.05, start: () => { this.sfx('leaf'); this.burst(e.at % L.w, (e.at / L.w) | 0, this.S.leafCols, 12); } });
          break;
        case 'turn':
          q.push({ dur: 0, start: () => { this.sfx('bounce'); this.wobble[e.at] = 0.3; if (e.dir === 1) pl.face = 'r'; if (e.dir === 3) pl.face = 'l'; } });
          break;
        case 'tele': {
          const tx = e.to % L.w, ty = (e.to / L.w) | 0;
          q.push({
            dur: 0.09, start: () => this.sfx('burrow'),
            update: (k) => { pl.scale = 1 - k; }, end: () => { pl.x = tx; pl.y = ty; },
          });
          q.push({
            dur: 0.09, start: () => this.burst(tx, ty, ['#8f5f3f', '#d8aa72', '#6a4230'], 6),
            update: (k) => { pl.scale = k; }, end: () => { pl.scale = 1; },
          });
          break;
        }
        case 'bump':
          q.push(this.bumpAnim(e.dir, e.hard));
          break;
        case 'log': {
          const li = this.logs.findIndex((l) => l.cell === e.from);
          const lg = this.logs[li];
          const tx = e.to % L.w, ty = (e.to / L.w) | 0;
          const dist = Math.abs(tx - lg.x) + Math.abs(ty - lg.y);
          const bump = this.bumpAnim(e.dir, false);
          q.push({
            dur: 0.08 + dist * 0.05,
            start: () => { this.sfx('log'); this.shake = Math.max(this.shake, 1); lg.sx = lg.x; lg.sy = lg.y; },
            update: (k) => {
              const ek = 1 - (1 - k) * (1 - k);
              lg.x = lg.sx + (tx - lg.sx) * ek; lg.y = lg.sy + (ty - lg.sy) * ek;
              lg.roll = k * dist;
              bump.update(Math.min(1, k * 2.5));
            },
            end: () => { lg.x = tx; lg.y = ty; lg.cell = e.to; lg.roll = 0; bump.end(); this.dust(tx, ty, e.dir); },
          });
          break;
        }
        case 'swap': {
          const mk = this.mk;
          const ax = e.from % L.w, ay = (e.from / L.w) | 0, bx = e.to % L.w, by = (e.to / L.w) | 0;
          q.push({
            dur: 0.24,
            start: () => { this.sfx('swap'); if (e.dir === 1) pl.face = 'r'; if (e.dir === 3) pl.face = 'l'; },
            update: (k) => {
              const ek = k * k * (3 - 2 * k), hop = Math.sin(k * Math.PI);
              pl.x = ax + (bx - ax) * ek; pl.y = ay + (by - ay) * ek; pl.oy = -hop * 0.25;
              mk.x = bx + (ax - bx) * ek; mk.y = by + (ay - by) * ek; mk.oy = -hop * 0.7;
            },
            end: () => { pl.x = bx; pl.y = by; pl.oy = 0; mk.x = ax; mk.y = ay; mk.oy = 0; this.sparkle(ax, ay, ['#f4c95a', '#fff']); },
          });
          break;
        }
        case 'win':
          q.push({
            dur: 0.45,
            start: () => { this.sfx('win'); this.confetti(e.at % L.w, (e.at / L.w) | 0); },
            update: (k) => { pl.oy = -Math.sin(Math.min(1, k * 2) * Math.PI) * 0.5; pl.scale = k < 0.5 ? 1 : 1 - (k - 0.5) * 2; },
            end: () => { pl.scale = 0; pl.oy = 0; },
          });
          break;
      }
      first = false;
    }
    q.push({
      dur: 0,
      start: () => {
        const won = pl.scale === 0;
        const face = pl.face;
        this.state = finalState;
        this.queue = [];
        if (!won) { this.snap(finalState); this.pl.face = face; } else { this.mask = finalState.mask; }
        if (done) done();
      },
    });
  }

  dust(x, y, dir) {
    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x: (x + 0.5) * TS + (Math.random() - 0.5) * 6, y: (y + 0.85) * TS,
        vx: -DX[dir] * 14 + (Math.random() - 0.5) * 10, vy: -DY[dir] * 14 - Math.random() * 8,
        g: 0, life: 0.3, max: 0.3, col: 'rgba(255,250,235,0.75)', size: 2,
      });
    }
  }

  burst(x, y, cols, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 20 + Math.random() * 40;
      this.particles.push({
        x: (x + 0.5) * TS, y: (y + 0.6) * TS, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30,
        g: 130, life: 0.5 + Math.random() * 0.3, max: 0.8, col: cols[i % cols.length], size: 2,
      });
    }
  }

  sparkle(x, y, cols) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      this.particles.push({
        x: (x + 0.5) * TS, y: (y + 0.5) * TS, vx: Math.cos(a) * 34, vy: Math.sin(a) * 34,
        g: 0, life: 0.32, max: 0.32, col: cols[i % cols.length], size: i % 2 ? 1 : 2,
      });
    }
  }

  confetti(x, y) {
    const cols = [...this.S.leafCols, '#f4c95a', '#ffffff'];
    for (let i = 0; i < 46; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = 50 + Math.random() * 90;
      this.particles.push({
        x: (x + 0.5) * TS, y: (y + 0.4) * TS, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        g: 150, life: 0.9 + Math.random() * 0.7, max: 1.6, col: cols[i % cols.length], size: 1 + (i % 2),
      });
    }
  }

  update(dt) {
    this.time += dt;
    let budget = dt;
    let guard = 0;
    while (this.queue.length && guard++ < 50) {
      const a = this.queue[0];
      if (!a.started) { a.started = true; a.t = 0; if (a.start) a.start(); if (this.queue[0] !== a) continue; }
      if (a.dur <= 0) { if (a.end) a.end(); if (this.queue[0] === a) this.queue.shift(); continue; }
      const need = a.dur - a.t;
      if (budget >= need) {
        budget -= need;
        if (a.update) a.update(1);
        if (a.end) a.end();
        if (this.queue[0] === a) this.queue.shift();
      } else {
        a.t += budget;
        if (a.update) a.update(a.t / a.dur);
        break;
      }
    }
    if (this.opening) {
      this.opening += dt * 4;
      if (this.opening >= 1) { this.opening = 0; this.open = 1; }
    }
    this.shake = Math.max(0, this.shake - dt * 9);
    for (const k in this.wobble) { this.wobble[k] -= dt; if (this.wobble[k] <= 0) delete this.wobble[k]; }
    const ps = this.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life -= dt;
      if (p.life <= 0) { ps[i] = ps[ps.length - 1]; ps.pop(); continue; }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.updateAmbient(dt);
  }

  updateAmbient(dt) {
    if (!this.s) return;
    const W = this.canvas.width / this.s, H = this.canvas.height / this.s;
    const kind = this.ambientKind;
    const target = kind === 'firefly' ? 16 : kind === 'snow' ? 46 : 20;
    const am = this.ambient;
    while (am.length < target) {
      const fresh = am.length < target && this.time > 1 && kind !== 'firefly';
      am.push({
        x: Math.random() * W, y: fresh ? -4 : Math.random() * H, ph: Math.random() * 6.28,
        sp: 0.6 + Math.random() * 0.8, c: Math.floor(Math.random() * 4), sz: Math.random() < 0.4 ? 2 : 1,
      });
    }
    for (const a of am) {
      a.ph += dt * a.sp * 2;
      if (kind === 'firefly') {
        a.x += Math.cos(a.ph * 0.7) * 6 * dt;
        a.y += Math.sin(a.ph) * 5 * dt;
      } else {
        const fall = kind === 'snow' ? 13 : 17;
        a.y += fall * a.sp * dt;
        a.x += (Math.sin(a.ph) * 10 + (kind === 'snow' ? 2 : 7)) * dt;
        if (a.y > H + 4) { a.y = -4; a.x = Math.random() * W; }
        if (a.x > W + 4) a.x = -4;
      }
    }
  }

  // ------------------------------------------------------------------ drawing

  spr(img, x, y, scale = 1, oxPx = 0, oyPx = 0) {
    const t = this.tile;
    const size = t * scale;
    const dx = Math.round(this.ox + x * t + (t - size) / 2 + oxPx * this.s);
    const dy = Math.round(this.oy + y * t + (t - size) / 2 + oyPx * this.s);
    this.ctx.drawImage(img, dx, dy, Math.round(size), Math.round(size));
  }

  shadow(x, y, w = 10) {
    const s = this.s, t = this.tile;
    const cx = this.ox + (x + 0.5) * t, cy = this.oy + y * t + 13 * s;
    const g = this.ctx;
    g.fillStyle = 'rgba(30,25,35,0.22)';
    g.fillRect(Math.round(cx - (w / 2) * s), Math.round(cy), Math.round(w * s), Math.round(2 * s));
    g.fillRect(Math.round(cx - (w / 2 - 1) * s), Math.round(cy - s), Math.round((w - 2) * s), Math.round(4 * s));
  }

  draw() {
    const g = this.ctx, L = this.level, S = this.S;
    const W = this.canvas.width, H = this.canvas.height;
    if (!L) { g.fillStyle = '#5d7d3c'; g.fillRect(0, 0, W, H); return; }
    g.imageSmoothingEnabled = false;
    const t = this.tile;
    g.save();
    if (this.shake > 0) {
      const m = this.shake * this.s;
      g.translate(Math.round(Math.sin(this.time * 90) * m), Math.round(Math.cos(this.time * 70) * m));
    }
    const x0 = -Math.ceil(this.ox / t) - 1, x1 = L.w + Math.ceil((W - this.ox - L.w * t) / t) + 1;
    const y0 = -Math.ceil(this.oy / t) - 1, y1 = L.h + Math.ceil((H - this.oy - L.h * t) / t) + 1;
    const inside = (x, y) => x >= 0 && y >= 0 && x < L.w && y < L.h;
    const seed = L.seed ^ (L.n * 7919);

    // ground
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const hsh = hash2(seed, (x + 64) * 512 + (y + 64));
        if (inside(x, y)) this.spr(S.grass[(hsh % 4) * 2 + ((x + y) & 1)], x, y);
        else this.spr(S.outer[hsh % S.outer.length], x, y);
      }
    }
    // soft frame around the clearing
    g.fillStyle = 'rgba(40,30,30,0.16)';
    const b = Math.round(this.s * 2);
    g.fillRect(this.ox - b, this.oy - b, L.w * t + 2 * b, b);
    g.fillRect(this.ox - b, this.oy + L.h * t, L.w * t + 2 * b, b);
    g.fillRect(this.ox - b, this.oy, b, L.h * t);
    g.fillRect(this.ox + L.w * t, this.oy, b, L.h * t);

    // floor-level objects
    for (let i = 0; i < L.cells.length; i++) {
      const c = L.cells[i];
      const x = i % L.w, y = (i / L.w) | 0;
      if (c === T.BURROW) this.spr(S.burrow, x, y);
      else if (c === T.LEAF) this.spr(S.leaf[i % 2], x, y);
      else if (c === T.BR_A || c === T.BR_B) {
        const wob = this.wobble[i] ? Math.sin(this.wobble[i] * 60) * this.wobble[i] * 5 : 0;
        this.spr(c === T.BR_A ? S.brA : S.brB, x, y, 1, wob, -wob);
      }
    }

    // rows: trees, walls, acorns, actors (drawn back to front)
    const actors = [];
    const pl = this.pl;
    if (pl.scale > 0) actors.push({ kind: 'player', y: pl.y + 0.01 });
    if (this.mk) actors.push({ kind: 'monkey', y: this.mk.y });
    this.logs.forEach((lg) => actors.push({ kind: 'log', y: lg.y - 0.01, lg }));
    actors.sort((a, b2) => a.y - b2.y);
    let ai = 0;
    const blink = (this.time % 3.4) < 0.14 ? 1 : 0;
    const bob = Math.floor(this.time * 2.2) % 2;
    const guestKind = this.playerKind === 'squirrel' ? 'monkey' : 'squirrel';

    const drawActor = (a) => {
      if (a.kind === 'log') {
        this.shadow(a.lg.x, a.lg.y, 14);
        const r = a.lg.roll ? (Math.floor(a.lg.roll * 4) % 2) : 0;
        this.spr(S.log, a.lg.x, a.lg.y, 1, 0, -r);
      } else if (a.kind === 'monkey') {
        const mk = this.mk;
        this.shadow(mk.x, mk.y, 9);
        const face = pl.x < mk.x ? 'l' : 'r';
        this.spr(S[guestKind][face][((this.time + 1.3) % 4.1) < 0.14 ? 1 : 0], mk.x, mk.y + mk.oy, 1, 0, -1 - (Math.floor(this.time * 2.2 + 0.5) % 2));
      } else {
        if (pl.scale > 0.6) this.shadow(pl.x + (pl.ox || 0), pl.y + (pl.oy2 || 0), 9);
        const moving = this.busy;
        this.spr(S[this.playerKind][pl.face][blink], pl.x + (pl.ox || 0), pl.y + pl.oy + (pl.oy2 || 0), pl.scale, 0, -1 - (moving ? 0 : bob));
      }
    };

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        if (inside(x, y)) {
          const i = y * L.w + x;
          const c = L.cells[i];
          if (c === T.WALL) this.spr(S.walls[this.wallKind[i]], x, y, 1, 0, -2);
          else if (c === T.HOLLOW) {
            if (this.open || this.opening) {
              const pulse = 0.5 + 0.5 * Math.sin(this.time * 4);
              g.fillStyle = `rgba(255,217,120,${0.16 + pulse * 0.12})`;
              const r = t * (0.75 + pulse * 0.08);
              g.beginPath();
              g.arc(this.ox + (x + 0.5) * t, this.oy + (y + 0.6) * t, r, 0, 6.3);
              g.fill();
            }
            this.spr(this.open || this.opening > 0.5 ? S.hollowOpen : S.hollowClosed, x, y, 1, 0, -1);
          }
          const bit = L.acornBit[i];
          if (bit >= 0 && !(this.mask & (1 << bit))) {
            this.shadow(x, y, 7);
            const ab = Math.sin(this.time * 3 + i * 1.7) > 0.3 ? -1 : 0;
            this.spr(S.acorn, x, y, 1, 0, ab - 1);
            if (((this.time * 1.3 + i * 0.37) % 2.6) < 0.12) {
              g.fillStyle = '#fff';
              g.fillRect(Math.round(this.ox + x * t + 10 * this.s), Math.round(this.oy + y * t + 5 * this.s), this.s, this.s);
            }
          }
        } else {
          const ring = x === -1 || y === -1 || x === L.w || y === L.h;
          const hsh = hash2(seed + 77, (x + 64) * 512 + (y + 64));
          const pTree = ring ? 0.82 : 0.5;
          if ((hsh % 1000) / 1000 < pTree) this.spr(S.trees[(hsh >>> 10) % S.trees.length], x, y, 1, ((hsh >>> 14) % 5) - 2, ((hsh >>> 18) % 4) - 3);
        }
      }
      while (ai < actors.length && actors[ai].y < y + 0.5) drawActor(actors[ai++]);
    }
    while (ai < actors.length) drawActor(actors[ai++]);

    // hint arrow
    if (this.hintDir >= 0 && !this.busy) {
      const d = this.hintDir;
      const off = 0.95 + (Math.floor(this.time * 4) % 2) * 0.1;
      const cx = this.ox + (pl.x + 0.5 + DX[d] * off) * t, cy = this.oy + (pl.y + 0.5 + DY[d] * off) * t;
      g.save();
      g.translate(Math.round(cx), Math.round(cy));
      g.rotate((d * Math.PI) / 2);
      g.drawImage(S.arrow, -t / 2, -t / 2, t, t);
      g.restore();
    }

    // particles
    for (const p of this.particles) {
      g.globalAlpha = Math.min(1, (p.life / p.max) * 2);
      g.fillStyle = p.col;
      g.fillRect(Math.round(this.ox + p.x * this.s), Math.round(this.oy + p.y * this.s), p.size * this.s, p.size * this.s);
    }
    g.globalAlpha = 1;
    g.restore();

    // ambient weather
    const s = this.s;
    const kind = this.ambientKind;
    for (const a of this.ambient) {
      if (kind === 'firefly') {
        const glow = 0.5 + 0.5 * Math.sin(a.ph * 1.7);
        g.fillStyle = `rgba(255,236,150,${0.12 * glow})`;
        g.fillRect(Math.round((a.x - 2) * s), Math.round((a.y - 2) * s), 5 * s, 5 * s);
        g.fillStyle = `rgba(255,244,190,${0.35 + 0.65 * glow})`;
        g.fillRect(Math.round(a.x * s), Math.round(a.y * s), s, s);
      } else if (kind === 'snow') {
        g.fillStyle = a.sz === 2 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)';
        g.fillRect(Math.round(a.x * s), Math.round(a.y * s), a.sz * s, a.sz * s);
      } else {
        g.fillStyle = S.leafCols[a.c];
        const flip = Math.sin(a.ph * 1.5) > 0;
        g.fillRect(Math.round(a.x * s), Math.round(a.y * s), (flip ? 3 : 2) * s, (flip ? 2 : 3) * s);
        g.fillStyle = 'rgba(60,35,30,0.55)';
        g.fillRect(Math.round((a.x + 1) * s), Math.round((a.y + 1) * s), s, s);
      }
    }

    if (S.biome.tint) { g.fillStyle = S.biome.tint; g.fillRect(0, 0, W, H); }
    // vignette
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(20,14,24,0)');
    vg.addColorStop(1, 'rgba(20,14,24,0.5)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
    if (this.dim > 0) { g.fillStyle = `rgba(28,20,30,${this.dim})`; g.fillRect(0, 0, W, H); }
  }
}
