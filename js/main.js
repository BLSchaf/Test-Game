import { initialState, move, solve, isWon, T } from './rules.js';
import { generateAsync, generateDaily, biomeOf, hash2, UNLOCK } from './generator.js';
import { Board } from './board.js';
import { getSprites, shared, dataUrl } from './sprites.js';
import { audio } from './audio.js';
import { STORY, QUIPS } from './story.js';
import { STR, TIP_FOR, NAMES } from './strings.js';

const $ = (id) => document.getElementById(id);
const SAVE_KEY = 'eichelpfad-save-v1';
const MONKEY_UNLOCK = 15;

// ------------------------------------------------------------------ save data
function defaultSave() {
  return {
    lang: (navigator.language || 'de').toLowerCase().startsWith('de') ? 'de' : 'en',
    music: true, sfx: true, char: 'squirrel',
    seed: (Math.random() * 0xffffffff) >>> 0,
    max: 1, cur: 1, stars: {}, seen: {},
    daily: null, lastDaily: 0, streak: 0,
  };
}
let save = defaultSave();
try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) save = Object.assign(save, JSON.parse(raw));
} catch (e) { /* storage unavailable: play without saving */ }
function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ }
}

// ------------------------------------------------------------------ i18n
function t(key, vars) {
  const entry = STR[key];
  let s = entry ? entry[save.lang] : key;
  const guest = save.char === 'squirrel' ? 'monkey' : 'squirrel';
  const all = Object.assign({ p: NAMES[save.char], g: NAMES[guest] }, vars);
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in all ? all[k] : m));
}
const pick = (list) => list[Math.floor(Math.random() * list.length)][save.lang];
function applyTexts() {
  document.documentElement.lang = save.lang;
  document.title = t('title');
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
}

// ------------------------------------------------------------------ setup
const canvas = $('game');
const board = new Board(canvas);
const SH = shared();
const portraits = {
  fips: dataUrl(SH.squirrel.r[0], 5), kiko: dataUrl(SH.monkey.r[0], 5), narrator: dataUrl(SH.acorn, 5),
  squirrel: dataUrl(SH.squirrel.r[0], 5), monkey: dataUrl(SH.monkey.r[0], 5),
};
const img = { acorn: dataUrl(SH.acorn, 4), star: dataUrl(SH.star, 4), starOff: dataUrl(SH.starOff, 4), banana: dataUrl(SH.banana, 4) };
$('logo-acorn').src = dataUrl(SH.acorn, 5);
$('hud-acorn-img').src = img.acorn;
$('btn-menu').firstElementChild.src = dataUrl(SH.icons.menu, 2);
$('btn-undo').firstElementChild.src = dataUrl(SH.icons.undo, 2);
$('btn-restart').firstElementChild.src = dataUrl(SH.icons.restart, 2);
$('btn-skip').firstElementChild.src = dataUrl(SH.icons.skip, 2);
$('btn-hint').firstElementChild.src = dataUrl(SH.banana, 2);
const icon = document.createElement('link');
icon.rel = 'icon';
icon.href = img.acorn;
document.head.appendChild(icon);

audio.setMusic(save.music);
audio.setSfx(save.sfx);
let audioReady = false;
function wakeAudio() {
  if (audioReady) return;
  audioReady = true;
  audio.init();
}
window.addEventListener('pointerdown', wakeAudio, { capture: true });
window.addEventListener('keydown', wakeAudio, { capture: true });

const show = (el, on = true) => el.classList.toggle('hidden', !on);

// ------------------------------------------------------------------ game state
let screen = 'menu'; // menu | game
const G = { mode: null, n: 0, L: null, state: null, history: [], moves: 0, hintUsed: false, won: false, buffer: [], token: 0 };
const levelCache = new Map();

function dateKey(d = new Date()) {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}
function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}
function currentStreak() {
  return save.lastDaily === dateKey() || save.lastDaily === yesterdayKey() ? save.streak : 0;
}
function dailySolved() {
  return save.daily && save.daily.key === dateKey();
}
function totalStars() {
  return Object.values(save.stars).reduce((a, b) => a + b, 0);
}
function monkeyUnlocked() {
  return save.max >= MONKEY_UNLOCK;
}

function getLevel(mode, n) {
  const key = mode === 'daily' ? 'd' + n : save.seed + ':' + n;
  if (!levelCache.has(key)) {
    if (levelCache.size > 12) levelCache.delete(levelCache.keys().next().value);
    levelCache.set(key, mode === 'daily' ? generateDaily(n) : generateAsync(save.seed, n));
  }
  return levelCache.get(key);
}

// ------------------------------------------------------------------ menu
let attract = { token: 0 };
function showMenu() {
  screen = 'menu';
  G.token++;
  G.mode = null;
  show($('hud-top'), false); show($('hud-bottom'), false); show($('tip'), false); show($('toast'), false);
  show($('overlay'), false); show($('story'), false); show($('loading'), false);
  show($('menu'));
  save.cur = Math.min(Math.max(1, save.cur), save.max);
  refreshMenu();
  audio.playMusic('menu');
  board.sfx = () => {};
  board.dim = 0.3;
  board.resize({ top: 0, bottom: 0 });
  runAttract();
}

function refreshMenu() {
  applyTexts();
  $('btn-journey').textContent = `${t('journey')} · ${t('level')} ${save.cur}`;
  $('lvl-prev').disabled = save.cur <= 1;
  $('lvl-next').disabled = save.cur >= save.max;
  const info = $('journey-info');
  info.innerHTML = '';
  const st = save.stars[save.cur];
  for (let i = 0; i < 3; i++) {
    const im = document.createElement('img');
    im.src = st > i ? img.star : img.starOff;
    info.appendChild(im);
  }
  const tot = document.createElement('span');
  tot.textContent = ` · ${t('total')} ${totalStars()}`;
  info.appendChild(tot);
  const streak = currentStreak();
  $('btn-daily').textContent = (dailySolved() ? t('dailyDone') : t('daily')) + (streak > 0 ? ` · ${t('streak', { n: streak })}` : '');
  show($('btn-char'), monkeyUnlocked());
  $('char-img').src = portraits[save.char];
  $('char-label').textContent = t('playAs');
}

async function runAttract() {
  const my = ++attract.token;
  const alive = () => my === attract.token && screen === 'menu';
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let i = 0;
  while (alive()) {
    const n = Math.max(6, save.max) + (i++ % 3);
    const L = await generateAsync(hash2(save.seed, 4242 + i), n);
    if (!alive()) return;
    let s = initialState(L);
    board.setLevel(L, s, biomeOf(save.cur), save.char);
    await wait(900);
    for (const d of L.solution) {
      if (!alive()) return;
      const ev = [];
      const ns = move(L, s, d, ev);
      if (!ns) break;
      s = ns;
      await new Promise((r) => board.play(ev, ns, r));
      await wait(420);
    }
    await wait(1500);
  }
}

// ------------------------------------------------------------------ story
let storyState = null;
function playStory(lines) {
  return new Promise((resolve) => {
    storyState = { lines, i: 0, shown: 0, done: resolve, timer: 0 };
    show($('story'));
    storyLine();
  });
}
function storyLine() {
  const st = storyState;
  const line = st.lines[st.i];
  $('story-portrait').src = portraits[line.who];
  $('story-name').textContent = line.who === 'narrator' ? '' : line.who === 'fips' ? 'Fips' : 'Kiko';
  st.text = line[save.lang];
  st.shown = 0;
  clearInterval(st.timer);
  st.timer = setInterval(() => {
    st.shown = Math.min(st.text.length, st.shown + 1);
    $('story-line').textContent = st.text.slice(0, st.shown);
    if (st.shown % 3 === 1) audio.sfx('story');
    if (st.shown >= st.text.length) clearInterval(st.timer);
  }, 24);
}
function storyAdvance(skipAll) {
  const st = storyState;
  if (!st) return;
  if (!skipAll && st.shown < st.text.length) {
    st.shown = st.text.length;
    $('story-line').textContent = st.text;
    clearInterval(st.timer);
    return;
  }
  st.i++;
  if (skipAll || st.i >= st.lines.length) {
    clearInterval(st.timer);
    storyState = null;
    show($('story'), false);
    st.done();
  } else storyLine();
}
$('story').addEventListener('click', (e) => { storyAdvance(e.target.id === 'story-skip'); });

// ------------------------------------------------------------------ starting a level
async function startLevel(mode, n) {
  const token = ++G.token;
  attract.token++;
  screen = 'game';
  G.mode = null;
  show($('menu'), false); show($('overlay'), false); show($('toast'), false);
  show($('hud-top'), false); show($('hud-bottom'), false); show($('tip'), false);
  hidePanels();
  const promise = getLevel(mode, n);
  if (mode === 'journey') {
    save.cur = n;
    persist();
    const beat = STORY.find((b) => b.level === n);
    if (beat && !save.seen[n]) {
      board.dim = 0.3;
      await playStory(beat.lines);
      if (token !== G.token) return;
      save.seen[n] = 1;
      persist();
    }
  }
  $('loading').firstElementChild.src = portraits[save.max >= 3 ? 'kiko' : 'narrator'];
  $('loading').lastElementChild.textContent = save.max >= 3 ? pick(QUIPS.loading) : t('loadingDefault');
  const loadTimer = setTimeout(() => { if (token === G.token) show($('loading')); }, 220);
  const L = await promise;
  clearTimeout(loadTimer);
  show($('loading'), false);
  if (token !== G.token) return;

  G.mode = mode; G.n = n; G.L = L;
  G.biome = mode === 'daily' ? ['autumn', 'dusk', 'frost'][Math.floor(Date.now() / 864e5) % 3] : biomeOf(n);
  resetLevelState();
  board.dim = 0;
  board.sfx = (name) => audio.sfx(name);
  show($('hud-top')); show($('hud-bottom'));
  show($('btn-skip'), mode === 'journey');
  let tip = '';
  if (mode === 'journey') {
    if (n === 1) tip = t('tip1');
    else if (n === 2) tip = t('tip2');
    else if (L.intro) tip = t(TIP_FOR[L.intro]);
  }
  $('tip').textContent = tip;
  show($('tip'), !!tip);
  applyTexts();
  updateHud();
  layoutBoard();
  board.setLevel(L, G.state, G.biome, save.char);
  audio.playMusic(G.biome);
  if (mode === 'journey') getLevel('journey', n + 1); // warm up the next one
}

function resetLevelState() {
  G.state = initialState(G.L);
  G.history = [];
  G.moves = 0;
  G.hintUsed = false;
  G.won = false;
  G.buffer = [];
}

function layoutBoard() {
  if (screen !== 'game') { board.resize({ top: 0, bottom: 0 }); return; }
  const top = $('tip').classList.contains('hidden') ? $('hud-top').getBoundingClientRect().bottom - 8 : $('tip').getBoundingClientRect().bottom + 4;
  const bottom = window.innerHeight - $('hud-bottom').getBoundingClientRect().top - 8;
  board.resize({ top: Math.max(0, top), bottom: Math.max(0, bottom) });
}

function updateHud() {
  const L = G.L;
  $('hud-level').textContent = G.mode === 'daily' ? t('daily') : `${t('level')} ${G.n}`;
  $('hud-moves').textContent = `${t('moves')} ${G.moves} · ${t('par')} ${L.par}`;
  let got = 0;
  for (let b = 0; b < L.acorns.length; b++) if (G.state.mask & (1 << b)) got++;
  $('hud-acorns').textContent = `${got}/${L.acorns.length}`;
  $('btn-undo').disabled = G.history.length === 0;
}

// ------------------------------------------------------------------ playing
function tryMove(dir) {
  if (screen !== 'game' || !G.mode || G.won || storyState || !$('overlay').classList.contains('hidden')) return;
  if (board.busy) {
    if (G.buffer.length < 2) G.buffer.push(dir);
    return;
  }
  const ev = [];
  const ns = move(G.L, G.state, dir, ev);
  if (!ns) { board.nudge(dir); return; }
  G.history.push(G.state);
  G.state = ns;
  G.moves++;
  updateHud();
  if (G.moves === 1 && G.n > 2) show($('tip'), false);
  const token = G.token;
  board.play(ev, ns, () => {
    if (token !== G.token) return;
    if (isWon(G.L, ns)) { G.buffer = []; onWin(); return; }
    if (G.buffer.length) tryMove(G.buffer.shift());
  });
}

function undo() {
  if (screen !== 'game' || !G.mode || G.won || !G.history.length) return;
  G.state = G.history.pop();
  G.moves--;
  G.buffer = [];
  board.snap(G.state);
  audio.sfx('undo');
  updateHud();
}

function restart() {
  if (screen !== 'game' || !G.mode) return;
  const hint = G.hintUsed;
  resetLevelState();
  G.hintUsed = hint;
  board.pl.face = 'r';
  board.snap(G.state);
  board.opening = 0;
  audio.sfx('undo');
  hidePanels();
  show($('overlay'), false);
  updateHud();
}

function toast(text, who = 'kiko', ms = 2800) {
  const el = $('toast');
  el.firstElementChild.src = portraits[who];
  el.lastElementChild.textContent = text;
  show(el, false);
  void el.offsetWidth;
  show(el);
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => show(el, false), ms);
}

function hint() {
  if (screen !== 'game' || !G.mode || G.won || board.busy) return;
  const res = solve(G.L, G.state, 120000);
  audio.sfx('hint');
  const kiko = save.max >= 3;
  if (res.moves && res.moves.length) {
    G.hintUsed = true;
    board.hintDir = res.moves[0];
    toast(kiko ? pick(QUIPS.hint) : t('hintCap'), kiko ? 'kiko' : 'narrator');
  } else {
    toast(pick(QUIPS.stuck), kiko ? 'kiko' : 'narrator', 3600);
  }
}

function starsFor(moves, par) {
  if (moves <= par) return 3;
  if (moves <= par + Math.max(2, Math.round(par * 0.35))) return 2;
  return 1;
}

function onWin() {
  G.won = true;
  let stars = starsFor(G.moves, G.L.par);
  if (G.hintUsed) stars = Math.min(stars, 2);
  let extra = G.hintUsed && G.moves <= G.L.par ? t('hintCap') : '';
  if (G.mode === 'journey') {
    save.stars[G.n] = Math.max(save.stars[G.n] || 0, stars);
    if (G.n >= save.max) save.max = G.n + 1;
  } else {
    const today = dateKey();
    if (!dailySolved()) {
      save.streak = save.lastDaily === yesterdayKey() ? save.streak + 1 : 1;
      save.lastDaily = today;
      save.daily = { key: today, stars, moves: G.moves };
    } else if (stars > save.daily.stars) save.daily = { key: today, stars, moves: G.moves };
    extra = `${t('streak', { n: save.streak })} · ${t('dailyBack')}`;
  }
  persist();
  const token = G.token;
  setTimeout(() => {
    if (token !== G.token) return;
    $('win-title').textContent = stars === 3 ? t('perfect') : stars === 2 ? t('good') : t('solved');
    $('win-moves').textContent = t('winMoves', { m: G.moves, p: G.L.par });
    const kiko = save.max >= 3;
    $('win-portrait').src = portraits[kiko ? 'kiko' : 'fips'];
    $('win-quip').textContent = pick(QUIPS['win' + stars]);
    $('win-extra').textContent = extra;
    $('win-next').textContent = t('next');
    show($('win-next'), G.mode === 'journey');
    const box = $('win-stars');
    box.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const im = document.createElement('img');
      im.src = img.starOff;
      box.appendChild(im);
      if (i < stars) {
        setTimeout(() => {
          if (token !== G.token) return;
          im.src = img.star;
          im.classList.add('on');
          audio.sfx('star');
        }, 350 + i * 280);
      }
    }
    openPanel('win');
  }, 650);
}

function skipLevel() {
  if (G.mode !== 'journey' || G.won) return;
  askConfirm(t('skipConfirm'), () => {
    audio.sfx('skip');
    if (G.n >= save.max) save.max = G.n + 1;
    persist();
    const line = pick(QUIPS.skip);
    startLevel('journey', G.n + 1).then(() => toast(line, save.max >= 3 ? 'kiko' : 'narrator'));
  });
}

// ------------------------------------------------------------------ panels
function hidePanels() {
  document.querySelectorAll('#overlay .panel').forEach((p) => show(p, false));
}
function openPanel(id) {
  hidePanels();
  show($('overlay'));
  show($(id));
}
function closePanel() {
  hidePanels();
  show($('overlay'), false);
}
let confirmCb = null;
function askConfirm(text, cb) {
  $('confirm-text').textContent = text;
  confirmCb = cb;
  openPanel('confirm');
}
$('confirm-no').onclick = () => { audio.sfx('click'); closePanel(); };
$('confirm-yes').onclick = () => { audio.sfx('click'); closePanel(); const cb = confirmCb; confirmCb = null; if (cb) cb(); };
document.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => { audio.sfx('click'); closePanel(); }; });

function refreshSettings() {
  applyTexts();
  $('set-lang').textContent = t('langName');
  $('set-music').textContent = t(save.music ? 'on' : 'off');
  $('set-sfx').textContent = t(save.sfx ? 'on' : 'off');
  show($('set-char-row'), monkeyUnlocked());
  $('set-char').textContent = NAMES[save.char];
}
function toggleChar() {
  save.char = save.char === 'squirrel' ? 'monkey' : 'squirrel';
  persist();
  board.playerKind = save.char;
  audio.sfx('swap');
}
$('set-lang').onclick = () => { save.lang = save.lang === 'de' ? 'en' : 'de'; persist(); audio.sfx('click'); refreshSettings(); if (screen === 'menu') refreshMenu(); else updateHud(); };
$('set-music').onclick = () => { save.music = !save.music; persist(); audio.setMusic(save.music); audio.sfx('click'); refreshSettings(); };
$('set-sfx').onclick = () => { save.sfx = !save.sfx; persist(); audio.setSfx(save.sfx); audio.sfx('click'); refreshSettings(); };
$('set-char').onclick = () => { toggleChar(); refreshSettings(); if (screen === 'menu') refreshMenu(); };
$('set-reset').onclick = () => {
  audio.sfx('click');
  askConfirm(t('resetConfirm'), () => {
    const keep = { lang: save.lang, music: save.music, sfx: save.sfx, daily: save.daily, lastDaily: save.lastDaily, streak: save.streak };
    save = Object.assign(defaultSave(), keep);
    persist();
    levelCache.clear();
    showMenu();
  });
};

function openHelp() {
  const list = $('help-list');
  list.innerHTML = '';
  const S = getSprites('autumn');
  const add = (sprite, text) => {
    const row = document.createElement('div');
    row.className = 'help-item';
    const im = document.createElement('img');
    im.src = dataUrl(sprite, 3);
    const sp = document.createElement('span');
    sp.textContent = text;
    row.append(im, sp);
    list.appendChild(row);
  };
  const guest = save.char === 'squirrel' ? 'monkey' : 'squirrel';
  add(SH[save.char].r[0], t('helpDash'));
  add(S.acorn, t('helpAcorn'));
  add(S.hollowOpen, t('helpHollow'));
  const feats = [['leaf', S.leaf[0]], ['log', S.log], ['branch', S.brA], ['burrow', S.burrow], ['monkey', SH[guest].r[0]]];
  let lockedShown = false;
  for (const [f, sprite] of feats) {
    if (save.max >= UNLOCK[f]) add(sprite, t(TIP_FOR[f]));
    else if (!lockedShown) { add(S.grass[0], t('locked')); lockedShown = true; }
  }
  add(SH.star, t('helpStars'));
  const keys = document.createElement('div');
  keys.className = 'help-keys';
  keys.textContent = t('keys');
  list.appendChild(keys);
  openPanel('help');
}

// ------------------------------------------------------------------ buttons
const click = (id, fn) => { $(id).onclick = () => { audio.sfx('click'); fn(); }; };
click('btn-journey', () => startLevel('journey', save.cur));
click('btn-daily', () => startLevel('daily', dateKey()));
click('lvl-prev', () => { save.cur = Math.max(1, save.cur - 1); persist(); refreshMenu(); });
click('lvl-next', () => { save.cur = Math.min(save.max, save.cur + 1); persist(); refreshMenu(); });
click('btn-help', openHelp);
click('btn-settings', () => { refreshSettings(); openPanel('settings'); });
click('btn-char', () => { toggleChar(); refreshMenu(); });
click('btn-menu', showMenu);
$('btn-undo').onclick = undo;
$('btn-restart').onclick = restart;
$('btn-hint').onclick = hint;
click('btn-skip', skipLevel);
click('win-retry', restart);
click('win-next', () => startLevel('journey', G.n + 1));
click('win-menu', showMenu);

// ------------------------------------------------------------------ input
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  drag = { x: e.clientX, y: e.clientY, id: e.pointerId, used: false };
});
window.addEventListener('pointermove', (e) => {
  if (!drag || drag.used || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  const th = Math.max(18, Math.min(window.innerWidth, window.innerHeight) * 0.045);
  if (Math.abs(dx) < th && Math.abs(dy) < th) return;
  drag.used = true;
  tryMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
});
window.addEventListener('pointerup', () => { drag = null; });
window.addEventListener('pointercancel', () => { drag = null; });
document.addEventListener('contextmenu', (e) => e.preventDefault());

const KEY_DIR = { ArrowUp: 0, w: 0, ArrowRight: 1, d: 1, ArrowDown: 2, s: 2, ArrowLeft: 3, a: 3 };
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (storyState) {
    if (k === 'Enter' || k === ' ') { e.preventDefault(); storyAdvance(false); }
    else if (k === 'Escape') storyAdvance(true);
    return;
  }
  const overlayOpen = !$('overlay').classList.contains('hidden');
  if (overlayOpen) {
    if (!$('win').classList.contains('hidden')) {
      if (k === 'Enter' || k === ' ' || k === 'n') { e.preventDefault(); if (G.mode === 'journey') startLevel('journey', G.n + 1); else showMenu(); }
      else if (k === 'r') restart();
      else if (k === 'Escape') showMenu();
    } else if (k === 'Escape') closePanel();
    return;
  }
  if (screen === 'menu') {
    if (k === 'Enter' || k === ' ') { e.preventDefault(); startLevel('journey', save.cur); }
    return;
  }
  if (k in KEY_DIR) { e.preventDefault(); tryMove(KEY_DIR[k]); }
  else if (k === 'z' || k === 'u' || k === 'Backspace') { e.preventDefault(); undo(); }
  else if (k === 'r') restart();
  else if (k === 'h') hint();
  else if (k === 'Escape') showMenu();
});

window.addEventListener('resize', layoutBoard);
window.addEventListener('orientationchange', () => setTimeout(layoutBoard, 200));

// ------------------------------------------------------------------ main loop
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  board.update(dt);
  board.draw();
  requestAnimationFrame(frame);
}

applyTexts();
showMenu();
requestAnimationFrame(frame);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutBoard);

// small hook for automated tests
window.__game = { G, board, save: () => save, startLevel, tryMove, T };
