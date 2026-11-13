const device = document.getElementById('device');
const powerBtn = document.getElementById('powerBtn');
const foldToggle = document.getElementById('foldToggle');
const homebar = document.getElementById('homebar');
const appFrame = document.getElementById('appFrame');
const coverScreen = document.getElementById('coverScreen');

const views = {
  off: document.getElementById('viewOff'),
  boot: document.getElementById('viewBoot'),
  lock: document.getElementById('viewLock'),
  home: document.getElementById('viewHome'),
  app: document.getElementById('viewApp'),
};

let power = 'off';
let currentApp = null;
let wallpaperIndex = 0;

const WALLPAPERS = [
  'radial-gradient(130% 80% at 85% 0%, rgba(255,106,0,0.4), transparent 55%), radial-gradient(130% 80% at 5% 100%, rgba(124,92,255,0.45), transparent 55%), linear-gradient(165deg, #181038, #0b0b1c)',
  'radial-gradient(130% 80% at 20% 0%, rgba(0,180,255,0.4), transparent 55%), radial-gradient(120% 80% at 90% 100%, rgba(0,90,200,0.5), transparent 55%), linear-gradient(165deg, #061631, #040a18)',
  'radial-gradient(130% 80% at 80% 10%, rgba(0,220,150,0.35), transparent 55%), radial-gradient(120% 80% at 10% 100%, rgba(0,120,90,0.45), transparent 55%), linear-gradient(165deg, #07271e, #04120d)',
  'radial-gradient(130% 80% at 75% 5%, rgba(255,80,130,0.4), transparent 55%), radial-gradient(120% 80% at 15% 100%, rgba(150,40,120,0.45), transparent 55%), linear-gradient(165deg, #2b0e26, #12060f)',
];

const APPS = [
  { id: 'calcolatrice', name: 'Calcolatrice', icon: '🧮', dock: false },
  { id: 'impostazioni', name: 'Impostazioni', icon: '⚙️', dock: false },
  { id: 'meteo', name: 'Meteo', icon: '⛅', dock: false },
  { id: 'galleria', name: 'Galleria', icon: '🖼️', dock: true },
  { id: 'musica', name: 'Musica', icon: '🎵', dock: true },
  { id: 'snake', name: 'Snake', icon: '🐍', dock: false },
  { id: 'g2048', name: '2048', icon: '🔢', dock: false },
  { id: 'piega', name: 'Piega', icon: '📱', dock: true, action: 'fold' },
];

const keyRouter = { handler: null };
const cleanupFns = [];

function addCleanup(fn) { cleanupFns.push(fn); }
function runCleanups() {
  while (cleanupFns.length) cleanupFns.pop()();
  keyRouter.handler = null;
}

/* ---------- Clock ---------- */

function pad(n) { return String(n).padStart(2, '0'); }

function updateClock() {
  const now = new Date();
  const hhmm = pad(now.getHours()) + ':' + pad(now.getMinutes());
  document.getElementById('sbTime').textContent = hhmm;
  document.getElementById('lockTime').textContent = hhmm;
  document.getElementById('cwTime').textContent = hhmm;
  document.getElementById('coverTime').textContent = hhmm;
  const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const months = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  const long = days[now.getDay()] + ' ' + now.getDate() + ' ' + months[now.getMonth()];
  const short = days[now.getDay()].slice(0, 3) + ' ' + now.getDate() + ' ' + months[now.getMonth()].slice(0, 3);
  document.getElementById('lockDate').textContent = long;
  document.getElementById('cwDate').textContent = short + ' · Milano 18°';
  document.getElementById('coverDate').textContent = short;
}
updateClock();
setInterval(updateClock, 15000);

/* ---------- Views ---------- */

function showView(name) {
  Object.entries(views).forEach(([key, el]) => {
    el.classList.toggle('active', key === name);
  });
}

/* ---------- Power ---------- */

function boot() {
  power = 'booting';
  showView('boot');
  const bar = views.boot.querySelector('.boot-bar span');
  bar.style.animation = 'none';
  void bar.offsetWidth;
  bar.style.animation = 'bootload 2.4s ease-in-out forwards';
  setTimeout(() => {
    if (power === 'booting') {
      power = 'lock';
      showView('lock');
      updateCover();
    }
  }, 2600);
}

function powerAction() {
  if (power === 'off') {
    boot();
  } else if (power === 'booting') {
    return;
  } else {
    power = 'off';
    closeApp(true);
    showView('off');
    updateCover();
  }
}

powerBtn.addEventListener('click', powerAction);

function updateCover() {
  coverScreen.classList.toggle('on', power !== 'off' && power !== 'booting');
}

/* ---------- Lock: drag up to unlock ---------- */

(function initLock() {
  const lock = views.lock;
  let startY = null;
  lock.addEventListener('pointerdown', (e) => { startY = e.clientY; });
  lock.addEventListener('pointermove', (e) => {
    if (startY !== null && startY - e.clientY > 60) {
      startY = null;
      unlock();
    }
  });
  lock.addEventListener('pointerup', () => { startY = null; });
  lock.addEventListener('click', () => unlock());
})();

function unlock() {
  if (power === 'lock') {
    power = 'home';
    showView('home');
  }
}

/* ---------- Fold ---------- */

function toggleFold() {
  const folded = device.classList.toggle('folded');
  foldToggle.textContent = folded ? 'Apri il telefono' : 'Piega il telefono';
}

foldToggle.addEventListener('click', toggleFold);

/* ---------- Home bar ---------- */

homebar.addEventListener('click', () => {
  if (power === 'home' || power === 'lock') {
    closeApp();
    showView('home');
  }
});

/* ---------- App grid ---------- */

const appGrid = document.getElementById('appGrid');
const dock = document.getElementById('dock');

function appButton(app) {
  const btn = document.createElement('button');
  btn.className = 'app-icon';
  btn.innerHTML = '<span class="ico">' + app.icon + '</span><span>' + app.name + '</span>';
  btn.addEventListener('click', () => {
    if (app.action === 'fold') { toggleFold(); return; }
    openApp(app.id);
  });
  return btn;
}

APPS.forEach((app) => {
  (app.dock ? dock : appGrid).appendChild(appButton(app));
});

/* ---------- App framework ---------- */

function appHeader(title) {
  const head = document.createElement('div');
  head.className = 'app-head';
  const back = document.createElement('button');
  back.className = 'app-back';
  back.textContent = '‹';
  back.setAttribute('aria-label', 'Indietro');
  back.addEventListener('click', closeApp);
  const titleEl = document.createElement('span');
  titleEl.className = 'app-title';
  titleEl.textContent = title;
  head.appendChild(back);
  head.appendChild(titleEl);
  return head;
}

function openApp(id) {
  runCleanups();
  currentApp = id;
  appFrame.innerHTML = '';
  const content = document.createElement('div');
  content.className = 'app-content';
  const app = APPS.find((a) => a.id === id);
  appFrame.appendChild(appHeader(app ? app.name : id));
  appFrame.appendChild(content);
  if (id === 'calcolatrice') initCalculator(content);
  else if (id === 'impostazioni') initSettings(content);
  else if (id === 'meteo') initWeather(content);
  else if (id === 'galleria') initGallery(content);
  else if (id === 'musica') initMusic(content);
  else if (id === 'snake') initSnake(content);
  else if (id === 'g2048') init2048(content);
  showView('app');
}

function closeApp(silent) {
  runCleanups();
  currentApp = null;
  appFrame.innerHTML = '';
  if (!silent) showView('home');
}

/* ---------- Calculator ---------- */

function initCalculator(root) {
  root.innerHTML = '';
  const display = document.createElement('div');
  display.className = 'calc-display';
  display.textContent = '0';
  const grid = document.createElement('div');
  grid.className = 'calc-grid';

  const keys = [
    ['C', 'fn'], ['⌫', 'fn'], ['%', 'fn'], ['÷', 'op'],
    ['7', ''], ['8', ''], ['9', ''], ['×', 'op'],
    ['4', ''], ['5', ''], ['6', ''], ['−', 'op'],
    ['1', ''], ['2', ''], ['3', ''], ['+', 'op'],
    ['±', 'fn'], ['0', ''], [',', ''], ['=', 'eq'],
  ];

  let cur = '0';
  let acc = null;
  let op = null;
  let fresh = true;

  const apply = (a, b, o) =>
    o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : b === 0 ? NaN : a / b;

  function render() {
    let out = cur;
    if (Math.abs(Number(cur)) >= 1e10 || (cur !== '0' && !isFinite(Number(cur)))) out = Number(cur).toExponential(5);
    display.textContent = out.replace('.', ',');
  }

  function press(k) {
    if (k >= '0' && k <= '9') {
      cur = fresh || cur === '0' ? k : cur + k;
      fresh = false;
    } else if (k === ',') {
      if (fresh) { cur = '0.'; fresh = false; }
      else if (!cur.includes('.')) cur += '.';
    } else if (k === 'C') {
      cur = '0'; acc = null; op = null; fresh = true;
    } else if (k === '⌫') {
      cur = cur.length > 1 ? cur.slice(0, -1) : '0';
    } else if (k === '±') {
      cur = cur.startsWith('-') ? cur.slice(1) : cur === '0' ? cur : '-' + cur;
    } else if (k === '%') {
      cur = String(Number(cur) / 100);
    } else if (['+', '−', '×', '÷'].includes(k)) {
      acc = acc !== null && op && !fresh ? apply(acc, Number(cur), op) : Number(cur);
      op = k;
      fresh = true;
      cur = String(acc);
    } else if (k === '=') {
      if (op !== null && acc !== null) {
        cur = String(apply(acc, Number(cur), op));
        acc = null; op = null; fresh = true;
      }
    }
    render();
  }

  keys.forEach(([label, cls]) => {
    const b = document.createElement('button');
    b.className = 'calc-btn ' + cls;
    b.textContent = label;
    b.addEventListener('click', () => press(label));
    grid.appendChild(b);
  });

  root.appendChild(display);
  root.appendChild(grid);
  keyRouter.handler = (e) => {
    const map = { '/': '÷', '*': '×', '-': '−', '+': '+', Enter: '=', '=': '=', Backspace: '⌫', Escape: 'C', '.': ',', ',': ',' };
    if (e.key >= '0' && e.key <= '9') press(e.key);
    else if (map[e.key]) { e.preventDefault(); press(map[e.key]); }
  };
}

/* ---------- Settings ---------- */

function initSettings(root) {
  root.innerHTML = '';

  const wpGroup = document.createElement('div');
  wpGroup.className = 'set-group';
  wpGroup.innerHTML = '<p class="set-label">Sfondo</p>';
  const wpRow = document.createElement('div');
  wpRow.className = 'wp-row';
  const wpColors = ['#181038, #0b0b1c', '#061631, #040a18', '#07271e, #04120d', '#2b0e26, #12060f'];
  WALLPAPERS.forEach((wp, i) => {
    const sw = document.createElement('button');
    sw.className = 'wp-swatch' + (i === wallpaperIndex ? ' active' : '');
    sw.style.background = 'linear-gradient(165deg, ' + wpColors[i] + ')';
    sw.setAttribute('aria-label', 'Sfondo ' + (i + 1));
    sw.addEventListener('click', () => {
      wallpaperIndex = i;
      document.getElementById('viewHome').style.background = wp;
      wpRow.querySelectorAll('.wp-swatch').forEach((el, j) => el.classList.toggle('active', j === i));
    });
    wpRow.appendChild(sw);
  });
  wpGroup.appendChild(wpRow);
  root.appendChild(wpGroup);

  const themeRow = document.createElement('div');
  themeRow.className = 'set-row';
  themeRow.innerHTML = '<span>Tema chiaro</span><span class="switch"><input type="checkbox" id="themeSwitch"><span class="track"></span></span>';
  themeRow.querySelector('input').addEventListener('change', (e) => {
    document.body.classList.toggle('light-phone', e.target.checked);
  });
  root.appendChild(themeRow);

  const alwaysOn = document.createElement('div');
  alwaysOn.className = 'set-row';
  alwaysOn.innerHTML = '<span>Always-On Display</span><span class="switch"><input type="checkbox" checked><span class="track"></span></span>';
  root.appendChild(alwaysOn);

  const info = document.createElement('div');
  info.className = 'set-group';
  info.innerHTML =
    '<p class="set-label">Info dispositivo</p>' +
    '<div class="info-line"><span>Dispositivo</span><strong>Xiaomi 18 Fold</strong></div>' +
    '<div class="info-line"><span>Sistema</span><strong>HyperOS 4 (Android 16)</strong></div>' +
    '<div class="info-line"><span>Processore</span><strong>Snapdragon 8 Elite Gen 5</strong></div>' +
    '<div class="info-line"><span>RAM</span><strong>16 GB LPDDR5X</strong></div>' +
    '<div class="info-line"><span>Memoria</span><strong>512 GB UFS 4.1</strong></div>' +
    '<div class="info-line"><span>Display</span><strong>8,03" AMOLED 2K 120Hz</strong></div>';
  root.appendChild(info);
}

/* ---------- Weather ---------- */

function initWeather(root) {
  root.innerHTML =
    '<div class="weather-hero">' +
    '<div class="w-ico">⛅</div>' +
    '<div class="w-temp">18°</div>' +
    '<div class="w-city">Milano · Parzialmente nuvoloso</div>' +
    '</div>' +
    '<div class="forecast">' +
    [['Mer', '☀️', '21°'], ['Gio', '⛅', '19°'], ['Ven', '🌧️', '15°'], ['Sab', '☁️', '17°']].map((d) =>
      '<div class="f-day">' + d[0] + '<div class="f-ico">' + d[1] + '</div><strong>' + d[2] + '</strong></div>'
    ).join('') +
    '</div>';
}

/* ---------- Gallery ---------- */

const GALLERY = [
  'linear-gradient(140deg, #ff6a00, #ff3d8a)',
  'linear-gradient(140deg, #7c5cff, #3a0f4d)',
  'linear-gradient(140deg, #00c6ff, #0072ff)',
  'linear-gradient(140deg, #00e0a4, #00795c)',
  'linear-gradient(140deg, #ffd24a, #ff6a00)',
  'linear-gradient(140deg, #e8e6e1, #6b7080)',
];

function initGallery(root) {
  root.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'gal-grid';
  GALLERY.forEach((g, i) => {
    const item = document.createElement('button');
    item.className = 'gal-item';
    item.style.background = g;
    item.setAttribute('aria-label', 'Foto ' + (i + 1));
    item.addEventListener('click', () => {
      const full = document.createElement('div');
      full.className = 'gal-full';
      full.style.background = g;
      full.textContent = 'Tocca per chiudere';
      root.appendChild(full);
      full.addEventListener('click', () => full.remove());
    });
    grid.appendChild(item);
  });
  root.appendChild(grid);
}

/* ---------- Music ---------- */

const SONGS = [
  { title: 'Pieghevole', artist: 'Leica Sound', cover: 'linear-gradient(140deg, #ff6a00, #7c5cff)', dur: 214 },
  { title: 'Waterdrop', artist: 'Hinge Collective', cover: 'linear-gradient(140deg, #00c6ff, #7c5cff)', dur: 187 },
  { title: 'Titanio', artist: 'Folding Machine', cover: 'linear-gradient(140deg, #8b939e, #2b2f3a)', dur: 243 },
];

function initMusic(root) {
  root.innerHTML = '';
  let song = 0;
  let playing = false;
  let pos = 0;
  let timer = null;

  const cover = document.createElement('div');
  cover.className = 'music-cover';
  const meta = document.createElement('div');
  meta.className = 'music-meta';
  const progress = document.createElement('div');
  progress.className = 'progress';
  progress.innerHTML = '<span></span>';
  const times = document.createElement('div');
  times.className = 'progress-times';
  const controls = document.createElement('div');
  controls.className = 'music-controls';

  function fmt(s) { return Math.floor(s / 60) + ':' + pad(Math.floor(s % 60)); }

  function renderMeta() {
    const s = SONGS[song];
    cover.style.background = s.cover;
    meta.innerHTML = '<div class="m-title">' + s.title + '</div><div class="m-artist">' + s.artist + '</div>';
  }

  function renderProgress() {
    const s = SONGS[song];
    progress.querySelector('span').style.width = (pos / s.dur) * 100 + '%';
    times.innerHTML = '<span>' + fmt(pos) + '</span><span>' + fmt(s.dur) + '</span>';
  }

  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  function tick() {
    pos += 1;
    if (pos >= SONGS[song].dur) { pos = 0; song = (song + 1) % SONGS.length; renderMeta(); }
    renderProgress();
  }

  function play() {
    playing = true;
    playBtn.textContent = '⏸';
    stopTimer();
    timer = setInterval(tick, 1000);
    addCleanup(stopTimer);
  }

  function pause() {
    playing = false;
    playBtn.textContent = '▶';
    stopTimer();
  }

  const prevBtn = document.createElement('button');
  prevBtn.className = 'm-btn';
  prevBtn.textContent = '⏮';
  const playBtn = document.createElement('button');
  playBtn.className = 'm-btn play';
  playBtn.textContent = '▶';
  const nextBtn = document.createElement('button');
  nextBtn.className = 'm-btn';
  nextBtn.textContent = '⏭';

  prevBtn.addEventListener('click', () => { song = (song - 1 + SONGS.length) % SONGS.length; pos = 0; renderMeta(); renderProgress(); if (playing) play(); });
  nextBtn.addEventListener('click', () => { song = (song + 1) % SONGS.length; pos = 0; renderMeta(); renderProgress(); if (playing) play(); });
  playBtn.addEventListener('click', () => (playing ? pause() : play()));

  controls.appendChild(prevBtn);
  controls.appendChild(playBtn);
  controls.appendChild(nextBtn);
  root.appendChild(cover);
  root.appendChild(meta);
  root.appendChild(progress);
  root.appendChild(times);
  root.appendChild(controls);
  renderMeta();
  renderProgress();
  addCleanup(stopTimer);
}

/* ---------- Swipe helper ---------- */

function addSwipe(el, cb) {
  let sx = 0, sy = 0;
  const start = (e) => {
    const p = e.touches ? e.touches[0] : e;
    sx = p.clientX; sy = p.clientY;
  };
  const end = (e) => {
    const p = e.changedTouches ? e.changedTouches[0] : e;
    const dx = p.clientX - sx;
    const dy = p.clientY - sy;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) cb(dx > 0 ? 'right' : 'left');
    else cb(dy > 0 ? 'down' : 'up');
  };
  el.addEventListener('touchstart', start, { passive: true });
  el.addEventListener('touchend', end);
  el.addEventListener('mousedown', start);
  el.addEventListener('mouseup', end);
}

/* ---------- Snake ---------- */

function initSnake(root) {
  root.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'game-wrap g2048';
  const hud = document.createElement('div');
  hud.className = 'game-hud';
  hud.innerHTML = 'Punti: <strong id="snakeScore">0</strong>';
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  canvas.width = 300;
  canvas.height = 300;

  const CELL = 15;
  const COLS = canvas.width / CELL;
  const ROWS = canvas.height / CELL;
  const ctx = canvas.getContext('2d');

  let snake, dir, nextDir, food, score, dead, timer;
  const scoreEl = () => hud.querySelector('#snakeScore');

  function spawnFood() {
    do {
      food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some((s) => s.x === food.x && s.y === food.y));
  }

  function draw() {
    ctx.fillStyle = '#0d0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff6a00';
    ctx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#7c5cff' : 'rgba(124,92,255,' + Math.max(0.35, 1 - i / snake.length) + ')';
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
    });
  }

  function step() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS || snake.some((s) => s.x === head.x && s.y === head.y)) {
      gameOver();
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl().textContent = score;
      spawnFood();
    } else {
      snake.pop();
    }
    draw();
  }

  function gameOver() {
    dead = true;
    clearInterval(timer);
    timer = null;
    const ov = document.createElement('div');
    ov.className = 'game-overlay';
    ov.innerHTML = '<p class="big">Game Over</p><p style="color:var(--muted)">Punti: ' + score + '</p>';
    const btn = document.createElement('button');
    btn.textContent = 'Rigioca';
    btn.addEventListener('click', () => { ov.remove(); reset(); });
    ov.appendChild(btn);
    wrap.appendChild(ov);
  }

  function reset() {
    const old = wrap.querySelector('.game-overlay');
    if (old) old.remove();
    snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }];
    dir = { x: 1, y: 0 };
    nextDir = dir;
    score = 0;
    dead = false;
    scoreEl().textContent = '0';
    spawnFood();
    draw();
    if (!timer) {
      timer = setInterval(() => { if (!dead) step(); }, 130);
      addCleanup(() => { clearInterval(timer); timer = null; });
    }
  }

  function turn(nx, ny) {
    if (dir.x === -nx && dir.y === -ny) return;
    nextDir = { x: nx, y: ny };
  }

  keyRouter.handler = (e) => {
    const map = {
      ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
      w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
    };
    if (map[e.key]) { e.preventDefault(); turn(map[e.key][0], map[e.key][1]); }
  };

  addSwipe(canvas, (d) => {
    if (d === 'up') turn(0, -1);
    else if (d === 'down') turn(0, 1);
    else if (d === 'left') turn(-1, 0);
    else turn(1, 0);
  });

  const hint = document.createElement('p');
  hint.className = 'game-hint';
  hint.textContent = 'Frecce, WASD o swipe per muoverti';

  wrap.appendChild(hud);
  wrap.appendChild(canvas);
  wrap.appendChild(hint);
  root.appendChild(wrap);
  reset();
}

/* ---------- 2048 ---------- */

function init2048(root) {
  root.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'game-wrap';
  const hud = document.createElement('div');
  hud.className = 'game-hud';
  hud.innerHTML = 'Punti: <strong id="g2048Score">0</strong>';
  const board = document.createElement('div');
  board.className = 'g2048-board';
  board.id = 'g2048Board';

  let grid, score, over;
  const scoreEl = () => hud.querySelector('#g2048Score');

  function emptyCells() {
    const out = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!grid[r][c]) out.push([r, c]);
    return out;
  }

  function addTile() {
    const empty = emptyCells();
    if (!empty.length) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  function render() {
    board.innerHTML = '';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const cell = document.createElement('div');
        const v = grid[r][c];
        cell.className = 'g2048-cell' + (v ? ' v' + Math.min(v, 2048) : '');
        cell.textContent = v || '';
        board.appendChild(cell);
      }
    }
  }

  function slide(line) {
    const arr = line.filter((v) => v);
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        score += arr[i];
        arr.splice(i + 1, 1);
      }
    }
    while (arr.length < 4) arr.push(0);
    return arr;
  }

  function move(delta) {
    if (over) return;
    let moved = false;
    const before = JSON.stringify(grid);
    for (let i = 0; i < 4; i++) {
      let line = [];
      for (let j = 0; j < 4; j++) {
        const r = delta.up ? j : delta.down ? 3 - j : i;
        const c = delta.left ? j : delta.right ? 3 - j : i;
        line.push(grid[r][c]);
      }
      line = slide(line);
      for (let j = 0; j < 4; j++) {
        const r = delta.up ? j : delta.down ? 3 - j : i;
        const c = delta.left ? j : delta.right ? 3 - j : i;
        grid[r][c] = line[j];
      }
    }
    moved = before !== JSON.stringify(grid);
    if (moved) {
      addTile();
      scoreEl().textContent = score;
      render();
      if (!canMove()) showOver();
    }
  }

  function canMove() {
    if (emptyCells().length) return true;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (c < 3 && grid[r][c] === grid[r][c + 1]) return true;
        if (r < 3 && grid[r][c] === grid[r + 1][c]) return true;
      }
    }
    return false;
  }

  function showOver() {
    over = true;
    const ov = document.createElement('div');
    ov.className = 'game-overlay';
    ov.innerHTML = '<p class="big">' + (grid.flat().includes(2048) ? 'Hai vinto! 🎉' : 'Game Over') + '</p><p style="color:var(--muted)">Punti: ' + score + '</p>';
    const btn = document.createElement('button');
    btn.textContent = 'Rigioca';
    btn.addEventListener('click', () => { ov.remove(); reset(); });
    ov.appendChild(btn);
    wrap.appendChild(ov);
  }

  function reset() {
    const old = wrap.querySelector('.game-overlay');
    if (old) old.remove();
    grid = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    score = 0;
    over = false;
    scoreEl().textContent = '0';
    addTile();
    addTile();
    render();
  }

  keyRouter.handler = (e) => {
    const dirs = { ArrowUp: { up: 1 }, ArrowDown: { down: 1 }, ArrowLeft: { left: 1 }, ArrowRight: { right: 1 } };
    if (dirs[e.key]) { e.preventDefault(); move(dirs[e.key]); }
  };

  addSwipe(board, (d) => move({ [d]: 1 }));

  const hint = document.createElement('p');
  hint.className = 'game-hint';
  hint.textContent = 'Frecce o swipe per unire i numeri fino a 2048';

  wrap.appendChild(hud);
  wrap.appendChild(board);
  wrap.appendChild(hint);
  root.appendChild(wrap);
  reset();
}

/* ---------- Keyboard ---------- */

document.addEventListener('keydown', (e) => {
  if (e.key === 'f' || e.key === 'F') toggleFold();
  if (keyRouter.handler) keyRouter.handler(e);
});
