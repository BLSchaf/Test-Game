// All pixel art is generated in code: 16x16 sprites from character maps and small procedural painters.
import { mulberry32 } from './generator.js';

export const TS = 16;

const BASE = {
  k: '#3a2a2a', e: '#241a1a',
  o: '#e0843a', O: '#b9592a', c: '#fbe9c8', w: '#fffaf0', p: '#e58f93',
  b: '#8f5f3f', B: '#6a4230', n: '#d8aa72', N: '#b78650',
  g: '#7fae4e', G: '#4f7f3f', y: '#f4c95a', Y: '#d99a34',
  r: '#d4553f', R: '#a23a33', s: '#a9a6a8', S: '#77737c', l: '#d2cfcc',
  d: '#2a1d22', h: '#ffd978',
};

const MAPS = {
  squirrel: [
    '.kk....kk.......',
    'kook..kook.kkk..',
    'koOkkkkOokkoook.',
    'koooooooookoOook',
    'kooooooooookoOok',
    'kooeoooeookkoOok',
    'koocccccookoOOok',
    '.koccpccokkoOok.',
    '..kkccckkooOook.',
    '..kooccookoOok..',
    '.koooccoookook..',
    '.koooccoookkk...',
    '.kookooookook...',
    '..kkkkkkkkkk....',
    '................',
    '................',
  ],
  monkey: [
    '................',
    '....kkkkkk......',
    '...kbbbbbbk.....',
    '.kkbbbbbbbbkk...',
    'knkbnnbbnnbknk..',
    'knkbnennenbknk..',
    '.kkbnnnnnnbkk...',
    '...kbnnpnnbk....',
    '....kbnnnbk..kk.',
    '...kbbkkkbbk.kbk',
    '..kbbnnnbbk..kbk',
    '..kbbnnnbbkkkbk.',
    '..kbkbbbbkbkkk..',
    '...kkkkkkkk.....',
    '................',
    '................',
  ],
  acorn: [
    '................',
    '................',
    '.......kk.......',
    '......kBk.......',
    '....kkkkkkkk....',
    '...kBbBbBbBbk...',
    '...kbBbBbBbBk...',
    '....knnnnnnk....',
    '...knwnnnnnNk...',
    '...knwnnnnnNk...',
    '...knnnnnnNNk...',
    '....knnnnNNk....',
    '.....knnNNk.....',
    '......kkkk......',
    '................',
    '................',
  ],
  log: [
    '................',
    '................',
    '................',
    '..kkkkkkkkkkkk..',
    '.knnkbbbbbbbbbk.',
    'knNNnkbBbbbbBbbk',
    'knNnNkbbbbBbbbbk',
    'knNnNkbbBbbbbBbk',
    'knNNnkBbbbbBbbbk',
    'knNNnkbbbBbbbbBk',
    '.knnkBBBBBBBBBk.',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
    '................',
    '................',
  ],
  hollow: [
    '..GGgGGGGgGGG...',
    '.GggGggggGgggGG.',
    'GgggggGgggggGggG',
    'GgGggggggGgggggG',
    '.GGkkkkkkkkkkGG.',
    '..kbbBbbbbBbbk..',
    '..kbBbkkkkbBbk..',
    '..kbbkDDDDkbbk..',
    '..kBkDDDDDDkbk..',
    '..kbkDDDDDDkBk..',
    '..kbkDDDDDDkbk..',
    '..kbkDDDDDDkbk..',
    '.kbbkDDDDDDkbbk.',
    'kbBbkDDDDDDkbBbk',
    'kkkkkkkkkkkkkkkk',
    '................',
  ],
  star: [
    '................',
    '.......kk.......',
    '......kyyk......',
    '......kyyk......',
    '.....kywyyk.....',
    'kkkkkkywyykkkkkk',
    'kyyyyyyyyyyyyyYk',
    '.kyyyyyyyyyyyYk.',
    '..kyyyyyyyyyYk..',
    '...kyyyyyyyYk...',
    '...kyyyyyyyYk...',
    '..kyyyyYYyyyYk..',
    '..kyyYYkkYYyYk..',
    '.kyYYkk..kkYYYk.',
    '.kkkk......kkkk.',
    '................',
  ],
  banana: [
    '................',
    '...........kk...',
    '..........kBBk..',
    '..........kyk...',
    '.........kyyk...',
    '.........kyyk...',
    '........kyyyk...',
    '.......kyywyk...',
    '......kyywyyk...',
    '.kk..kyyyyyk....',
    'kyykkyyyyyYk....',
    'kYyyyyyyyYk.....',
    '.kYYyyyYYk......',
    '..kkYYYkk.......',
    '....kkk.........',
    '................',
  ],
  undo: [
    '................',
    '................',
    '.....kk.........',
    '....kwk.........',
    '...kwwkkkkk.....',
    '..kwwwwwwwwkk...',
    '...kwwkkkkwwwk..',
    '....kwk...kwwk..',
    '.....kk....kwwk.',
    '...........kwwk.',
    '..........kwwk..',
    '....kkkkkkwwwk..',
    '....kwwwwwwkk...',
    '....kkkkkkk.....',
    '................',
    '................',
  ],
  restart: [
    '................',
    '..........kkk...',
    '.....kkkk.kwk...',
    '...kkwwwwkkwk...',
    '..kwwwkkwwwwk...',
    '..kwwk..kwwwk...',
    '.kwwk..kwwwwk...',
    '.kwwk..kkkkkk...',
    '.kwwk.......kk..',
    '.kwwk......kwwk.',
    '..kwwk....kwwk..',
    '..kwwwkkkkwwwk..',
    '...kkwwwwwwkk...',
    '.....kkkkkk.....',
    '................',
    '................',
  ],
  skip: [
    '................',
    '................',
    '..kk.....kk..kk.',
    '..kwkk...kwkkwk.',
    '..kwwwkk.kwwkwk.',
    '..kwwwwwkkwwwwk.',
    '..kwwwwwwwwwwwk.',
    '..kwwwwwwwwwwwk.',
    '..kwwwwwkkwwwwk.',
    '..kwwwkk.kwwkwk.',
    '..kwkk...kwkkwk.',
    '..kk.....kk..kk.',
    '................',
    '................',
    '................',
    '................',
  ],
  menu: [
    '................',
    '................',
    '..kkkkkkkkkkkk..',
    '..kwwwwwwwwwwk..',
    '..kkkkkkkkkkkk..',
    '................',
    '..kkkkkkkkkkkk..',
    '..kwwwwwwwwwwk..',
    '..kkkkkkkkkkkk..',
    '................',
    '..kkkkkkkkkkkk..',
    '..kwwwwwwwwwwk..',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
    '................',
  ],
  arrow: [
    '................',
    '.......kk.......',
    '......kwwk......',
    '.....kwwwwk.....',
    '....kwwwwwwk....',
    '...kwwwwwwwwk...',
    '..kwwwwwwwwwwk..',
    '..kkkkwwwwkkkk..',
    '.....kwwwwk.....',
    '.....kwwwwk.....',
    '.....kwwwwk.....',
    '.....kwwwwk.....',
    '.....kwwwwk.....',
    '.....kkkkkk.....',
    '................',
    '................',
  ],
};

function canvas(w = TS, h = TS) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function fromMap(map, pal) {
  const c = canvas(map[0].length, map.length);
  const g = c.getContext('2d');
  map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      g.fillStyle = pal[ch] || '#f0f';
      g.fillRect(x, y, 1, 1);
    }
  });
  return c;
}

function paint(fn, w = TS, h = TS) {
  const c = canvas(w, h);
  const g = c.getContext('2d');
  fn((x, y, col) => {
    if (x < 0 || y < 0 || x >= w || y >= h || !col) return;
    g.fillStyle = col;
    g.fillRect(x | 0, y | 0, 1, 1);
  });
  return c;
}

export function flipX(src) {
  const c = canvas(src.width, src.height);
  const g = c.getContext('2d');
  g.translate(src.width, 0);
  g.scale(-1, 1);
  g.drawImage(src, 0, 0);
  return c;
}

function silhouette(src, col) {
  const c = canvas(src.width, src.height);
  const g = c.getContext('2d');
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = col;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

export const BIOMES = {
  autumn: {
    bg: '#5d7d3c',
    grass: ['#a9bd5c', '#9fb455'], grassDot: '#8ba248', outer: ['#7f9c48', '#789545'], outerDot: '#67843c',
    canopies: [['#f0a03c', '#d9772f', '#a9502a'], ['#e2573d', '#bf3f36', '#8c2c2f'], ['#f6cf55', '#e0a53a', '#b3782c'], ['#8fb552', '#5f8f43', '#3f6a38']],
    leaves: ['#e2573d', '#f0a03c', '#f6cf55', '#b9592a'],
    ambient: 'leaf', tint: null, ui: '#f6a04a',
  },
  dusk: {
    bg: '#2f4a4a',
    grass: ['#7fa27c', '#779a76'], grassDot: '#62876a', outer: ['#537a68', '#4d7262'], outerDot: '#3f6356',
    canopies: [['#d97a4a', '#b2553f', '#7c3a3c'], ['#b8506a', '#8e3b5c', '#632c4c'], ['#e3b260', '#bd8647', '#8a5d3a'], ['#5f9278', '#42725f', '#2f564e']],
    leaves: ['#b8506a', '#d97a4a', '#e3b260', '#7c3a3c'],
    ambient: 'firefly', tint: 'rgba(40,30,90,0.16)', ui: '#e58fa8',
  },
  frost: {
    bg: '#6f93a3',
    grass: ['#d6e9e4', '#cbe1dd'], grassDot: '#b2cfd0', outer: ['#b3d0d2', '#a9c8cb'], outerDot: '#93b6bd',
    canopies: [['#ffffff', '#cfe4ea', '#8fb3c4'], ['#f2fafa', '#b9d8dc', '#6f9fb0'], ['#e9f3ef', '#9cc5b8', '#5c9388'], ['#ffffff', '#d7e3f2', '#98a9cc']],
    leaves: ['#ffffff', '#d7ecf2', '#b9d8dc', '#e9f3ef'],
    ambient: 'snow', tint: null, ui: '#8fd0e0',
  },
};

function grassTile(rnd, cols, dot, extra) {
  return paint((px) => {
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) px(x, y, cols);
    for (let i = 0; i < 5; i++) {
      const x = 1 + Math.floor(rnd() * 13), y = 2 + Math.floor(rnd() * 12);
      px(x, y, dot);
      if (rnd() < 0.6) px(x + 1, y - 1, dot);
      if (rnd() < 0.3) px(x - 1, y - 1, dot);
    }
    if (extra && rnd() < 0.5) {
      const x = 2 + Math.floor(rnd() * 11), y = 3 + Math.floor(rnd() * 10);
      px(x, y, extra[Math.floor(rnd() * extra.length)]);
      px(x + 1, y, extra[Math.floor(rnd() * extra.length)]);
    }
  });
}

function blob(px, cx, cy, rx, ry, cols, outline = BASE.k, rnd) {
  for (let y = 0; y < TS; y++) {
    for (let x = 0; x < TS; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      const ex = (x + 0.5 - cx) / (rx - 1), ey = (y + 0.5 - cy) / (ry - 1);
      if (ex * ex + ey * ey > 1) { px(x, y, outline); continue; }
      const lx = (x + 0.5 - (cx - rx * 0.35)) / rx, ly = (y + 0.5 - (cy - ry * 0.4)) / ry;
      const l = lx * lx + ly * ly;
      let c = l < 0.28 ? cols[0] : l < 0.95 ? cols[1] : cols[2];
      if (rnd && rnd() < 0.12) c = cols[l < 0.6 ? 1 : 0];
      px(x, y, c);
    }
  }
}

function treeSprite(cols, rnd) {
  return paint((px) => {
    for (let y = 11; y < 15; y++) { px(6, y, BASE.k); px(7, y, BASE.b); px(8, y, BASE.B); px(9, y, BASE.k); }
    for (let x = 6; x < 10; x++) px(x, 15, BASE.k);
    px(5, 15, BASE.k); px(10, 15, BASE.k);
    blob(px, 8, 6.5, 7.5, 6.5, cols, BASE.k, rnd);
  });
}

function pineSprite(cols) {
  return paint((px) => {
    for (let y = 12; y < 15; y++) { px(7, y, BASE.b); px(8, y, BASE.B); px(6, y, BASE.k); px(9, y, BASE.k); }
    for (let x = 6; x < 10; x++) px(x, 15, BASE.k);
    const tiers = [[0, 5], [4, 9], [8, 13]];
    tiers.forEach(([top, bottom], ti) => {
      for (let y = top; y <= bottom; y++) {
        const half = 1 + Math.floor(((y - top) / (bottom - top)) * (3 + ti * 1.5));
        for (let x = 8 - half - 1; x <= 7 + half + 1; x++) {
          const edge = x === 8 - half - 1 || x === 7 + half + 1 || y === bottom;
          px(x, y, edge ? BASE.k : x < 7 ? cols[0] : x < 9 ? cols[1] : cols[2]);
        }
      }
    });
    px(7, 0, BASE.k); px(8, 0, BASE.k);
  });
}

function bushSprite(cols, berry, rnd) {
  return paint((px) => {
    blob(px, 8, 10, 7.5, 5.5, cols, BASE.k, rnd);
    for (let i = 0; i < 4; i++) px(3 + Math.floor(rnd() * 10), 8 + Math.floor(rnd() * 4), berry);
  });
}

function rockSprite(rnd) {
  return paint((px) => {
    blob(px, 8, 10, 7, 5.5, [BASE.l, BASE.s, BASE.S], BASE.k);
    blob(px, 11, 12, 4, 3.4, [BASE.l, BASE.s, BASE.S], BASE.k);
    px(5, 8, BASE.w); px(6, 8, BASE.w);
    if (rnd() < 0.7) { px(4, 12, BASE.G); px(5, 13, BASE.g); }
  });
}

function leafPile(cols, rnd) {
  return paint((px) => {
    for (let y = 4; y < 15; y++) {
      for (let x = 0; x < TS; x++) {
        const dx = (x + 0.5 - 8) / 7.6, dy = (y + 0.5 - 14) / 9.5;
        const d = dx * dx + dy * dy;
        if (d > 1) continue;
        const ex = (x + 0.5 - 8) / 6.6, ey = (y + 0.5 - 14) / 8.5;
        if (ex * ex + ey * ey > 1 || y === 14) { px(x, y, BASE.k); continue; }
        px(x, y, cols[Math.floor(rnd() * cols.length)]);
      }
    }
  });
}

function branchSprite(rnd, leafCols) {
  // "/" shaped springy twig, from bottom-left to top-right
  return paint((px) => {
    for (let y = 0; y < TS; y++) {
      for (let x = 0; x < TS; x++) {
        const d = x + y - 15, along = x - y;
        if (Math.abs(along) > 11) continue;
        if (Math.abs(d) === 2 || (Math.abs(d) < 2 && Math.abs(along) > 9)) px(x, y, BASE.k);
        else if (Math.abs(d) < 2) px(x, y, d < 0 ? '#f0cf9a' : d === 0 ? BASE.n : BASE.N);
      }
    }
    const leaf = (x, y, c, c2) => {
      for (let j = -1; j <= 3; j++) for (let i = -1; i <= 3; i++) {
        const corner = (i === -1 || i === 3) && (j === -1 || j === 3);
        if (corner) continue;
        const edge = i === -1 || i === 3 || j === -1 || j === 3;
        px(x + i, y + j, edge ? BASE.k : i + j > 2 ? c2 : c);
      }
    };
    leaf(2, 3, leafCols[0], leafCols[1]);
    leaf(11, 10, leafCols[0], leafCols[1]);
  });
}

function burrowSprite() {
  return paint((px) => {
    blob(px, 8, 9.5, 7.5, 5.5, [BASE.n, BASE.b, BASE.B], BASE.k);
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
      const dx = (x + 0.5 - 8) / 5, dy = (y + 0.5 - 10) / 3.2;
      if (dx * dx + dy * dy <= 1) px(x, y, y < 9 ? '#120c10' : BASE.d);
    }
  });
}

const cache = {};

export function getSprites(biomeName) {
  if (cache[biomeName]) return cache[biomeName];
  const bio = BIOMES[biomeName];
  const rnd = mulberry32(biomeName.length * 977 + 5);
  const S = { biome: bio };
  S.grass = [];
  for (let i = 0; i < 8; i++) S.grass.push(grassTile(rnd, bio.grass[i % 2], bio.grassDot, null));
  S.outer = [];
  for (let i = 0; i < 6; i++) S.outer.push(grassTile(rnd, bio.outer[i % 2], bio.outerDot, bio.leaves));
  S.trees = bio.canopies.map((c, i) => (i === 3 ? pineSprite(c) : treeSprite(c, rnd)));
  S.trees.push(treeSprite(bio.canopies[0], rnd), treeSprite(bio.canopies[1], rnd));
  S.walls = [
    S.trees[0], S.trees[1], S.trees[2], S.trees[3],
    bushSprite(bio.canopies[3], biomeName === 'frost' ? '#d4553f' : BASE.r, rnd),
    rockSprite(rnd), rockSprite(rnd),
  ];
  S.leaf = [leafPile(bio.leaves, rnd), leafPile(bio.leaves, rnd)];
  S.leafCols = bio.leaves;
  const brA = branchSprite(rnd, [bio.canopies[3][0], bio.canopies[3][1]]);
  S.brA = brA;
  S.brB = flipX(brA);
  S.burrow = burrowSprite();
  const canopyPal = { ...BASE, g: bio.canopies[3][0], G: bio.canopies[3][1] };
  const closed = MAPS.hollow.map((r, y) => r.replace(/D/g, (m, x) => (x === 9 && y === 10 ? 'y' : (x + y) % 5 === 0 ? 'N' : 'n')));
  const open = MAPS.hollow.map((r, y) => r.replace(/D/g, (m, x) => (y > 10 && x > 5 && x < 10 ? 'h' : y > 9 && x > 6 && x < 9 ? 'h' : 'd')));
  S.hollowClosed = fromMap(closed, canopyPal);
  S.hollowOpen = fromMap(open, canopyPal);
  Object.assign(S, shared());
  cache[biomeName] = S;
  return S;
}

let sharedCache = null;
export function shared() {
  if (sharedCache) return sharedCache;
  const mk = (name) => {
    const a = fromMap(MAPS[name], BASE);
    const blinkPal = { ...BASE, e: name === 'squirrel' ? BASE.O : BASE.N };
    const b = fromMap(MAPS[name], blinkPal);
    return { r: [a, b], l: [flipX(a), flipX(b)], white: silhouette(a, '#fff') };
  };
  sharedCache = {
    squirrel: mk('squirrel'),
    monkey: mk('monkey'),
    acorn: fromMap(MAPS.acorn, BASE),
    log: fromMap(MAPS.log, BASE),
    star: fromMap(MAPS.star, BASE),
    starOff: fromMap(MAPS.star, { ...BASE, y: '#b9a58c', Y: '#9c8a74', w: '#cbb9a0' }),
    banana: fromMap(MAPS.banana, BASE),
    arrow: fromMap(MAPS.arrow, { ...BASE, w: '#fff3c4' }),
    icons: {
      undo: fromMap(MAPS.undo, { ...BASE, w: '#fff7e6' }),
      restart: fromMap(MAPS.restart, { ...BASE, w: '#fff7e6' }),
      skip: fromMap(MAPS.skip, { ...BASE, w: '#fff7e6' }),
      menu: fromMap(MAPS.menu, { ...BASE, w: '#fff7e6' }),
    },
  };
  return sharedCache;
}

/** Upscaled data URL of a sprite for use in the DOM. */
export function dataUrl(sprite, scale = 4) {
  const c = canvas(sprite.width * scale, sprite.height * scale);
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(sprite, 0, 0, c.width, c.height);
  return c.toDataURL();
}
