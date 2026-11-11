// Acorn Trail - synthesized audio (Web Audio API only, no assets).
// Public API: audio.init / setMusic / setSfx / playMusic / stopMusic / sfx

const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function noteToMidi(name) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(name);
  if (!m) return null;
  return 12 * (Number(m[3]) + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

// "E5:2 r:1" -> events indexed by start step
function parseMelody(str) {
  const ev = {};
  let step = 0;
  for (const tok of str.trim().split(/\s+/)) {
    const [n, d] = tok.split(':');
    const dur = Number(d || 1);
    if (n !== 'r') ev[step] = { midi: noteToMidi(n), dur };
    step += dur;
  }
  return { ev, total: step };
}

function parseChord(name) {
  const m = /^([A-G])([#b]?)(m|7)?$/.exec(name);
  const pc = (PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
  const q = m[3] === 'm' ? [0, 3, 7] : m[3] === '7' ? [0, 4, 7, 10] : [0, 4, 7];
  return { pc, tones: q };
}

// bpm = beats per minute where one step is an eighth note (stepDur = 30/bpm).
const TRACK_DEFS = {
  menu: {
    bpm: 76, spb: 8, mel: 'triangle', melVol: 0.55, arpType: 'sine', arpVol: 0.2, bassVol: 0.5,
    chords: 'C Am F G C Am F G F C G Am F C G C',
    melody: [
      'E5:2 G5:2 E5:2 D5:2', 'C5:3 D5:1 E5:4', 'A4:2 C5:2 F5:2 E5:2', 'D5:3 B4:1 G4:4',
      'E5:2 G5:2 C6:2 B5:2', 'A5:3 G5:1 E5:4', 'F5:2 A5:2 G5:2 F5:2', 'E5:2 D5:2 B4:4',
      'A4:2 C5:2 A4:2 F4:2', 'G4:2 C5:2 E5:4', 'D5:2 G5:2 F5:2 D5:2', 'C5:2 E5:2 A5:4',
      'A5:2 G5:2 F5:2 E5:2', 'E5:2 D5:2 C5:4', 'B4:2 D5:2 G5:2 F5:2', 'E5:6 r:2',
    ],
    bass: [[0, 0, 3], [4, 7, 3]],
    arp: [0, 1, 2, 1, 0, 1, 2, 1],
  },
  autumn: {
    bpm: 96, spb: 8, mel: 'square', melVol: 0.4, arpType: 'triangle', arpVol: 0.22, bassVol: 0.5,
    chords: 'G Em C D G Em C D C G D Em C G D G',
    melody: [
      'B4:1 D5:1 G5:2 E5:1 D5:1 B4:2', 'E5:2 G5:1 E5:1 D5:2 B4:2', 'C5:1 E5:1 G5:2 E5:1 C5:1 D5:2', 'A4:2 D5:2 F#5:2 A5:2',
      'B5:2 A5:1 G5:1 E5:2 D5:2', 'E5:1 G5:1 B5:2 A5:2 G5:2', 'E5:2 G5:2 E5:2 C5:2', 'D5:2 F#5:2 A4:4',
      'G5:1 E5:1 C5:2 E5:1 G5:1 C6:2', 'B5:2 G5:2 D5:4', 'F#5:2 A5:2 F#5:2 D5:2', 'E5:2 G5:2 B5:4',
      'C6:2 B5:1 A5:1 G5:2 E5:2', 'D5:2 G5:2 B5:2 G5:2', 'A5:2 F#5:2 D5:2 E5:2', 'G5:6 r:2',
    ],
    bass: [[0, 0, 1.5], [2, 7, 1.5], [4, 0, 1.5], [6, 7, 1.5]],
    arp: [-1, 0, -1, 1, -1, 2, -1, 1],
  },
  dusk: {
    bpm: 66, spb: 8, mel: 'triangle', melVol: 0.55, arpType: 'sine', arpVol: 0.2, bassVol: 0.5,
    chords: 'Am G Am G F G Am Am Dm Am F E7 Dm Am E7 Am',
    melody: [
      'E5:4 C5:2 D5:2', 'B4:4 D5:4', 'C5:2 E5:2 A5:4', 'G5:3 E5:1 D5:4',
      'C5:4 A4:2 C5:2', 'D5:4 B4:4', 'A4:2 C5:2 E5:4', 'E5:6 r:2',
      'F5:4 D5:2 A4:2', 'E5:3 C5:1 A4:4', 'A4:2 C5:2 F5:2 E5:2', 'D5:2 B4:2 G#4:2 B4:2',
      'D5:2 F5:2 A5:4', 'C5:2 E5:2 A5:2 G5:2', 'E5:2 G#4:2 B4:4', 'A4:6 r:2',
    ],
    bass: [[0, 0, 4], [4, 7, 3]],
    arp: [0, 2, 1, 2, 0, 2, 1, 2],
  },
  frost: {
    bpm: 92, spb: 6, mel: 'bell', melVol: 0.45, arpType: 'sine', arpVol: 0.16, bassVol: 0.4,
    chords: 'G Em C D G Bm C D Em C G D C D G G',
    melody: [
      'D6:2 B5:2 G5:2', 'E6:2 B5:2 G5:2', 'G5:2 C6:2 E6:2', 'D6:3 A5:3',
      'B5:2 D6:2 G6:2', 'F#6:2 D6:2 B5:2', 'E6:2 G6:2 E6:2', 'D6:4 A5:2',
      'G5:2 B5:2 E6:2', 'E6:3 C6:3', 'D6:2 B5:2 G5:2', 'A5:2 F#5:2 A5:2',
      'C6:2 E6:2 G6:2', 'F#6:2 A6:2 F#6:2', 'G6:4 D6:2', 'B5:6',
    ],
    bass: [[0, 0, 5]],
    arp: [-1, 0, 1, 2, 1, 0],
  },
};

const TRACKS = {};
for (const [name, d] of Object.entries(TRACK_DEFS)) {
  const mel = parseMelody(d.melody.join(' '));
  TRACKS[name] = Object.assign({}, d, {
    name,
    melEv: mel.ev,
    chordList: d.chords.split(/\s+/).map(parseChord),
    totalSteps: d.melody.length * d.spb,
    stepDur: 30 / d.bpm,
  });
}

let ctx = null;
let musicMaster = null;
let sfxBus = null;
let noiseBuf = null;
let inited = false;
let musicOn = true;
let sfxOn = true;
let wantTrack = null;
let cur = null; // active track playback
let timer = null;
let acornChain = 0, acornLast = -10, starChain = 0, starLast = -10, storyN = 0;

const safe = (fn) => { try { return fn(); } catch (e) { return undefined; } };

function cleanup(...nodes) {
  for (const n of nodes) if (n) safe(() => n.disconnect());
}

// One enveloped oscillator voice. o: {type, f1 (end freq), vol, a, sus, filt, q, dest}
function tone(freq, t, dur, o = {}) {
  const vol = o.vol == null ? 0.3 : o.vol;
  const a = Math.min(o.a == null ? 0.012 : o.a, dur * 0.5);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
  const sus = o.sus == null ? 0.5 : o.sus;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(vol * sus, 0.0002), t + dur * 0.5 + a * 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  let f = null;
  if (o.filt) {
    f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = o.filt;
    g.connect(f);
    f.connect(o.dest || sfxBus);
  } else {
    g.connect(o.dest || sfxBus);
  }
  osc.onended = () => cleanup(osc, g, f);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// Filtered noise burst
function noise(t, dur, o = {}) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = o.type || 'bandpass';
  f.frequency.setValueAtTime(o.f0 || 1500, t);
  if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
  f.Q.value = o.q || 1;
  const g = ctx.createGain();
  const vol = o.vol == null ? 0.2 : o.vol;
  const a = Math.min(o.a == null ? 0.01 : o.a, dur * 0.5);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(sfxBus);
  src.onended = () => cleanup(src, f, g);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

const SFX = {
  move: (t) => noise(t, 0.09, { f0: 1200, f1: 2600, q: 1.2, vol: 0.1 }),
  bump: (t) => {
    tone(130, t, 0.14, { f1: 60, vol: 0.45, a: 0.004, sus: 0.3 });
    noise(t, 0.05, { type: 'lowpass', f0: 400, vol: 0.08 });
  },
  acorn: (t, now) => {
    if (now - acornLast > 1.2) acornChain = 0;
    acornLast = now;
    const m = Math.pow(2, Math.min(acornChain, 8) * 0.9 / 12);
    acornChain++;
    tone(880 * m, t, 0.18, { type: 'triangle', vol: 0.3, a: 0.004, sus: 0.3 });
    tone(1760 * m, t, 0.1, { vol: 0.07, a: 0.004 });
    tone(1318.5 * m, t + 0.07, 0.26, { type: 'triangle', vol: 0.3, a: 0.004, sus: 0.3 });
    tone(2637 * m, t + 0.07, 0.12, { vol: 0.07, a: 0.004 });
  },
  leaf: (t) => {
    noise(t, 0.24, { f0: 3200, f1: 2200, q: 0.7, vol: 0.16, a: 0.03 });
    noise(t + 0.06, 0.16, { type: 'highpass', f0: 4500, q: 0.5, vol: 0.05, a: 0.02 });
  },
  log: (t) => {
    tone(190, t, 0.1, { f1: 120, type: 'triangle', vol: 0.4, a: 0.003, sus: 0.3 });
    tone(160, t + 0.09, 0.1, { f1: 100, type: 'triangle', vol: 0.3, a: 0.003, sus: 0.3 });
    noise(t + 0.05, 0.45, { type: 'lowpass', f0: 260, f1: 140, q: 0.8, vol: 0.28, a: 0.08 });
  },
  bounce: (t) => {
    tone(240, t, 0.1, { f1: 720, vol: 0.3, a: 0.005, sus: 0.8 });
    tone(720, t + 0.1, 0.12, { f1: 380, vol: 0.25, a: 0.005, sus: 0.5 });
  },
  burrow: (t) => {
    tone(640, t, 0.2, { f1: 180, type: 'triangle', vol: 0.3, a: 0.01, sus: 0.8 });
    tone(180, t + 0.2, 0.24, { f1: 900, type: 'triangle', vol: 0.3, a: 0.01, sus: 0.8 });
  },
  swap: (t) => {
    tone(440, t, 0.12, { f1: 560, type: 'square', filt: 1500, vol: 0.14, sus: 0.7 });
    tone(700, t + 0.13, 0.2, { f1: 480, type: 'square', filt: 1500, vol: 0.14, sus: 0.6 });
  },
  open: (t) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(f, t + i * 0.075, 0.28, { type: 'triangle', vol: 0.25, a: 0.006, sus: 0.4 }));
  },
  win: (t) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(f, t + i * 0.17, i === 3 ? 0.8 : 0.4, { type: 'triangle', vol: 0.28, a: 0.01, sus: 0.6 }));
    [659.25, 783.99, 1318.5].forEach((f) =>
      tone(f, t + 0.51, 0.7, { vol: 0.12, a: 0.02, sus: 0.6 }));
  },
  star: (t, now) => {
    if (now - starLast > 1.0) starChain = 0;
    starLast = now;
    const m = Math.pow(2, Math.min(starChain, 6) * 2 / 12);
    starChain++;
    tone(1318.5 * m, t, 0.4, { vol: 0.25, a: 0.004, sus: 0.3 });
    tone(2637 * m, t, 0.25, { vol: 0.08, a: 0.004, sus: 0.3 });
  },
  click: (t) => tone(1000, t, 0.04, { type: 'triangle', vol: 0.18, a: 0.002, sus: 0.5 }),
  undo: (t) => tone(620, t, 0.12, { f1: 300, type: 'triangle', vol: 0.25, a: 0.004, sus: 0.7 }),
  hint: (t) => {
    tone(523.25, t, 0.12, { type: 'triangle', vol: 0.22, sus: 0.6 });
    tone(659.25, t + 0.12, 0.12, { type: 'triangle', vol: 0.22, sus: 0.6 });
    tone(740, t + 0.26, 0.28, { f1: 988, type: 'triangle', vol: 0.22, sus: 0.8 });
  },
  story: (t) => {
    const f = 620 + (storyN++ % 4) * 40;
    tone(f, t, 0.05, { type: 'triangle', vol: 0.12, a: 0.003, sus: 0.6 });
  },
  skip: (t) => noise(t, 0.16, { f0: 700, f1: 2200, q: 0.9, vol: 0.12, a: 0.03 }),
};

// ---- Music scheduling ----

function scheduleStep(tr, step, t) {
  const spb = tr.spb;
  const bar = Math.floor(step / spb);
  const s = step % spb;
  const ch = tr.chordList[bar];
  const sd = tr.stepDur;
  const dest = tr.bus;
  const bassRoot = 36 + ch.pc;

  for (const [bs, off, d] of tr.bass) {
    if (bs === s) {
      tone(mtof(bassRoot + off), t, d * sd, { type: 'triangle', vol: tr.bassVol, a: 0.02, sus: 0.6, dest });
    }
  }
  const ai = tr.arp[s];
  if (ai >= 0) {
    const n = ch.tones.length;
    const midi = 60 + ch.pc + ch.tones[ai % n] + (ai >= n ? 12 : 0);
    tone(mtof(midi), t, sd * 1.6, { type: tr.arpType, vol: tr.arpVol, a: 0.012, sus: 0.3, dest });
  }
  const m = tr.melEv[step];
  if (m) {
    const f = mtof(m.midi);
    const dur = m.dur * sd;
    if (tr.mel === 'bell') {
      tone(f, t, Math.max(dur * 1.4, 0.7), { vol: tr.melVol, a: 0.005, sus: 0.25, dest });
      tone(f * 2.76, t, 0.3, { vol: tr.melVol * 0.12, a: 0.004, sus: 0.2, dest });
    } else if (tr.mel === 'square') {
      tone(f, t, dur * 0.95, { type: 'square', filt: 1700, vol: tr.melVol * 0.55, a: 0.012, sus: 0.6, dest });
    } else {
      tone(f, t, dur * 0.98, { type: tr.mel, vol: tr.melVol, a: 0.015, sus: 0.6, dest });
    }
  }
}

function tick() {
  if (!ctx || !cur || cur.dead) return;
  const horizon = ctx.currentTime + 0.2;
  let guard = 0;
  while (cur.next < horizon && guard++ < 64) {
    if (cur.next < ctx.currentTime - 0.1) cur.next = ctx.currentTime + 0.02; // recover after a stall
    safe(() => scheduleStep(cur.tr, cur.step, cur.next));
    cur.next += cur.tr.stepDur;
    cur.step = (cur.step + 1) % cur.tr.totalSteps;
  }
}

function fadeOut(pb, secs) {
  if (!pb || pb.dead) return;
  pb.dead = true;
  const t = ctx.currentTime;
  safe(() => {
    pb.bus.gain.cancelScheduledValues(t);
    pb.bus.gain.setValueAtTime(pb.bus.gain.value, t);
    pb.bus.gain.linearRampToValueAtTime(0, t + secs);
  });
  setTimeout(() => cleanup(pb.bus), (secs + 0.5) * 1000);
}

function stopTimer() {
  if (timer) { clearInterval(timer); timer = null; }
}

function startTrack() {
  if (!ctx || !musicOn || !wantTrack) return;
  const tr = TRACKS[wantTrack];
  if (!tr) return;
  if (cur && !cur.dead && cur.tr === tr) return;
  const t = ctx.currentTime;
  if (cur) fadeOut(cur, 0.6);
  const bus = ctx.createGain();
  bus.gain.setValueAtTime(0, t);
  bus.gain.linearRampToValueAtTime(1, t + 0.6);
  bus.connect(musicMaster);
  cur = { tr, bus, step: 0, next: t + 0.05, dead: false };
  if (!timer) timer = setInterval(tick, 30);
  tick();
}

function onVisibility() {
  if (!ctx || !inited) return;
  safe(() => {
    if (document.hidden) ctx.suspend();
    else ctx.resume();
  });
}

export const audio = {
  init() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        musicMaster = ctx.createGain();
        musicMaster.gain.value = 0.15;
        musicMaster.connect(ctx.destination);
        sfxBus = ctx.createGain();
        sfxBus.gain.value = 0.6;
        sfxBus.connect(ctx.destination);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        inited = true;
        document.addEventListener('visibilitychange', onVisibility);
      }
      const p = ctx.resume();
      if (p && p.catch) p.catch(() => {});
      startTrack();
    } catch (e) { /* never throw */ }
  },

  setMusic(on) {
    on = !!on;
    if (on === musicOn) return;
    musicOn = on;
    safe(() => {
      if (!ctx) return;
      if (!on) { fadeOut(cur, 0.25); cur = null; stopTimer(); }
      else startTrack();
    });
  },

  setSfx(on) { sfxOn = !!on; },

  playMusic(track) {
    if (!TRACKS[track]) return;
    wantTrack = track;
    safe(startTrack);
  },

  stopMusic() {
    wantTrack = null;
    safe(() => {
      if (!ctx) return;
      fadeOut(cur, 0.4);
      cur = null;
      stopTimer();
    });
  },

  sfx(name) {
    if (!ctx || !sfxOn || !SFX[name]) return;
    safe(() => SFX[name](ctx.currentTime + 0.005, ctx.currentTime));
  },
};
