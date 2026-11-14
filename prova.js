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
  { id: 'calcolatrice', name: 'Calcolatrice', icon: '🧮', dock: false, color: 'linear-gradient(135deg, #ffb340, #ff7a00)' },
  { id: 'impostazioni', name: 'Impostazioni', icon: '⚙️', dock: false, color: 'linear-gradient(135deg, #c7cedb, #7a8496)' },
  { id: 'meteo', name: 'Meteo', icon: '⛅', dock: false, color: 'linear-gradient(135deg, #62b8ff, #1d6ef2)' },
  { id: 'galleria', name: 'Galleria', icon: '🌸', dock: true, color: 'linear-gradient(135deg, #ff7eb3, #ff2d78)' },
  { id: 'musica', name: 'Musica', icon: '🎵', dock: true, color: 'linear-gradient(135deg, #ff6f5e, #ff2d55)' },
  { id: 'spotify', name: 'Spotify', icon: '🎧', dock: true, color: 'linear-gradient(135deg, #3ddc6f, #128a3e)' },
  { id: 'snake', name: 'Snake', icon: '🐍', dock: false, color: 'linear-gradient(135deg, #3ddc84, #0ea05a)' },
  { id: 'g2048', name: '2048', icon: '🔢', dock: false, color: 'linear-gradient(135deg, #ffd75e, #ff9d00)' },
  { id: 'sparatutto', name: 'Sparatutto', icon: '🚀', dock: false, color: 'linear-gradient(135deg, #ff4d6d, #c9184a)' },
  { id: 'cronometro', name: 'Cronometro', icon: '⏱️', dock: false, color: 'linear-gradient(135deg, #5e60ce, #3a0ca3)' },
  { id: 'piega', name: 'Piega', icon: '📱', dock: true, action: 'fold', color: 'linear-gradient(135deg, #9d7bff, #5b3dff)' },
];

const keyRouter = { handler: null };
const cleanupFns = [];

/* ---------- Motore musicale globale ---------- */

const PLAYER_SONGS = {
  musica: [
    { title: 'Pieghevole', artist: 'Leica Sound', cover: 'linear-gradient(140deg, #ff6a00, #ff3d8a)', glow: 'rgba(255,106,0,0.55)', dur: 214 },
    { title: 'Waterdrop', artist: 'Hinge Collective', cover: 'linear-gradient(140deg, #00c6ff, #7c5cff)', glow: 'rgba(0,150,255,0.5)', dur: 187 },
    { title: 'Titanio', artist: 'Folding Machine', cover: 'linear-gradient(140deg, #8b939e, #2b2f3a)', glow: 'rgba(140,150,165,0.45)', dur: 243 },
    { title: 'Neon Fold', artist: 'Aurora Kwan', cover: 'linear-gradient(140deg, #ff5f6d, #ffc371)', glow: 'rgba(255,95,109,0.5)', dur: 198 },
  ],
  spotify: [
    { title: 'Mezzanotte Digitale', artist: 'Club HyperOS', cover: 'linear-gradient(140deg, #3ddc6f, #0a6e33)', glow: 'rgba(61,220,111,0.45)', dur: 232 },
    { title: 'Correnti', artist: 'Luna Ferrari', cover: 'linear-gradient(140deg, #4776e6, #8e54e9)', glow: 'rgba(142,84,233,0.45)', dur: 205 },
    { title: 'Squircle', artist: 'The Rounded Corners', cover: 'linear-gradient(140deg, #11998e, #38ef7d)', glow: 'rgba(56,239,125,0.4)', dur: 176 },
    { title: '120 Hz', artist: 'AMOLED Dreams', cover: 'linear-gradient(140deg, #ffd24a, #ff6a00)', glow: 'rgba(255,180,40,0.45)', dur: 221 },
  ],
};

const player = {
  source: 'musica',
  index: 0,
  pos: 0,
  playing: false,
  timer: null,
  listeners: new Set(),
};

function playerSong() { return PLAYER_SONGS[player.source][player.index]; }
function playerNotify() { player.listeners.forEach((fn) => fn()); }

function playerStartTimer() {
  if (!player.timer) player.timer = setInterval(playerTick, 1000);
}

function playerTick() {
  player.pos += 1;
  if (player.pos >= playerSong().dur) {
    player.index = (player.index + 1) % PLAYER_SONGS[player.source].length;
    player.pos = 0;
  }
  playerNotify();
  updateIsland();
}

function playerPlay() {
  player.playing = true;
  playerStartTimer();
  playerNotify();
  updateIsland();
}

function playerPause() {
  player.playing = false;
  if (player.timer) { clearInterval(player.timer); player.timer = null; }
  playerNotify();
  updateIsland();
}

function playerTogglePlay() { player.playing ? playerPause() : playerPlay(); }

function playerSelect(source, index) {
  player.source = source;
  player.index = index;
  player.pos = 0;
  playerPlay();
}

function playerSkip(step) {
  const list = PLAYER_SONGS[player.source];
  player.index = (player.index + step + list.length) % list.length;
  player.pos = 0;
  playerNotify();
  updateIsland();
}

/* ---------- Cronometro (motore globale) ---------- */

const stopwatch = { running: false, elapsed: 0, last: 0, laps: [], timer: null, listeners: new Set() };

function swNotify() { stopwatch.listeners.forEach((fn) => fn()); }

function swFormat(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const c = Math.floor((ms % 1000) / 10);
  return pad(m) + ':' + pad(s) + '.' + pad(c);
}

function swTick() {
  const now = performance.now();
  stopwatch.elapsed += now - stopwatch.last;
  stopwatch.last = now;
  swNotify();
  updateIsland();
}

function swStart() {
  if (stopwatch.running) return;
  stopwatch.running = true;
  stopwatch.last = performance.now();
  stopwatch.timer = setInterval(swTick, 33);
  swNotify();
  updateIsland();
}

function swPause() {
  stopwatch.running = false;
  if (stopwatch.timer) { clearInterval(stopwatch.timer); stopwatch.timer = null; }
  swNotify();
  updateIsland();
}

function swToggle() { stopwatch.running ? swPause() : swStart(); }

function swReset() {
  swPause();
  stopwatch.elapsed = 0;
  stopwatch.laps = [];
  swNotify();
  updateIsland();
}

function swLap() {
  if (!stopwatch.running) return;
  stopwatch.laps.push(stopwatch.elapsed);
  swNotify();
}

/* ---------- Hyper Island ---------- */

const island = document.getElementById('hyperIsland');
let islandMode = 'music';

function islandState() {
  const inPlayerApp = currentApp === 'musica' || currentApp === 'spotify';
  if ((player.playing || player.pos > 0) && !inPlayerApp) return 'music';
  if ((stopwatch.running || stopwatch.elapsed > 0) && currentApp !== 'cronometro') return 'stopwatch';
  return null;
}

function updateIsland() {
  const mode = islandState();
  const active = mode && power !== 'off' && power !== 'booting';
  islandMode = mode || islandMode;
  island.classList.toggle('show', !!active);
  if (!active) return;
  if (mode === 'music') {
    islandMode = 'music';
    const s = playerSong();
    island.classList.toggle('paused', !player.playing);
    document.getElementById('hiIco').textContent = player.source === 'spotify' ? '🎧' : '🎵';
    document.getElementById('hiTitle').textContent = s.title + ' · ' + s.artist;
    document.getElementById('hiPlay').textContent = player.playing ? '⏸' : '▶';
  } else {
    islandMode = 'stopwatch';
    island.classList.toggle('paused', !stopwatch.running);
    document.getElementById('hiIco').textContent = '⏱️';
    document.getElementById('hiTitle').textContent = 'Cronometro · ' + swFormat(stopwatch.elapsed);
    document.getElementById('hiPlay').textContent = stopwatch.running ? '⏸' : '▶';
  }
}

island.addEventListener('click', () => openApp(islandMode === 'stopwatch' ? 'cronometro' : player.source));
document.getElementById('hiPlay').addEventListener('click', (e) => {
  e.stopPropagation();
  if (islandMode === 'stopwatch') swToggle();
  else playerTogglePlay();
});

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
  document.getElementById('cwDate').textContent = short;
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
    playerPause();
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
  btn.querySelector('.ico').style.background = app.color;
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
  else if (id === 'spotify') initSpotify(content);
  else if (id === 'snake') initSnake(content);
  else if (id === 'g2048') init2048(content);
  else if (id === 'sparatutto') initShooter(content);
  else if (id === 'cronometro') initStopwatch(content);
  showView('app');
  updateIsland();
}

function closeApp(silent) {
  runCleanups();
  currentApp = null;
  appFrame.innerHTML = '';
  if (!silent) showView('home');
  updateIsland();
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

/* ---------- Settings (stile HyperOS) ---------- */

function setCard() {
  const card = document.createElement('div');
  card.className = 'set-card';
  return card;
}

function setRow(icon, color, label, right) {
  const row = document.createElement('div');
  row.className = 'set-row';
  const ico = document.createElement('span');
  ico.className = 'set-ico';
  ico.style.background = color;
  ico.textContent = icon;
  const labelEl = document.createElement('span');
  labelEl.className = 'set-name';
  labelEl.textContent = label;
  row.appendChild(ico);
  row.appendChild(labelEl);
  if (right) row.appendChild(right);
  return row;
}

function setValue(text) {
  const v = document.createElement('span');
  v.className = 'set-value';
  v.textContent = text;
  return v;
}

function initSettings(root) {
  root.innerHTML = '';

  const search = document.createElement('div');
  search.className = 'set-search';
  search.textContent = '🔍   Cerca impostazioni';
  root.appendChild(search);

  const net = setCard();
  net.appendChild(setRow('📶', 'linear-gradient(135deg, #62b8ff, #1d6ef2)', 'Wi-Fi', setValue('Xiaomi_5G')));
  net.appendChild(setRow('🔵', 'linear-gradient(135deg, #6ea8ff, #3a6bff)', 'Bluetooth', setValue('Attivo')));
  net.appendChild(setRow('📡', 'linear-gradient(135deg, #3ddc84, #0ea05a)', 'Dati mobili', setValue('5G')));
  root.appendChild(net);

  const wpCard = setCard();
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
  const wpHead = setRow('🎨', 'linear-gradient(135deg, #ff7eb3, #ff2d78)', 'Sfondo');
  wpHead.classList.add('no-border');
  wpCard.appendChild(wpHead);
  wpCard.appendChild(wpRow);
  root.appendChild(wpCard);

  const sys = setCard();
  const themeSwitch = document.createElement('span');
  themeSwitch.className = 'switch';
  themeSwitch.innerHTML = '<input type="checkbox" id="themeSwitch"><span class="track"></span>';
  themeSwitch.querySelector('input').addEventListener('change', (e) => {
    document.body.classList.toggle('light-phone', e.target.checked);
  });
  sys.appendChild(setRow('🌗', 'linear-gradient(135deg, #6f7ba3, #3c4460)', 'Tema chiaro', themeSwitch));
  const aod = document.createElement('span');
  aod.className = 'switch';
  aod.innerHTML = '<input type="checkbox" checked><span class="track"></span>';
  sys.appendChild(setRow('🕐', 'linear-gradient(135deg, #9d7bff, #5b3dff)', 'Always-On Display', aod));
  root.appendChild(sys);

  const info = setCard();
  info.appendChild(setRow('ℹ️', 'linear-gradient(135deg, #c7cedb, #7a8496)', 'Info dispositivo'));
  const infoBody = document.createElement('div');
  infoBody.className = 'set-info';
  infoBody.innerHTML =
    '<div class="info-line"><span>Dispositivo</span><strong>Xiaomi 18 Fold</strong></div>' +
    '<div class="info-line"><span>Sistema</span><strong>HyperOS 4 (Android 16)</strong></div>' +
    '<div class="info-line"><span>Processore</span><strong>Snapdragon 8 Elite Gen 5</strong></div>' +
    '<div class="info-line"><span>RAM</span><strong>16 GB LPDDR5X</strong></div>' +
    '<div class="info-line"><span>Display</span><strong>8,03" AMOLED 2K 120Hz</strong></div>';
  info.appendChild(infoBody);
  root.appendChild(info);
}

/* ---------- Weather (stile HyperOS) ---------- */

function initWeather(root) {
  root.classList.add('no-pad');
  root.innerHTML = '';

  const wx = document.createElement('div');
  wx.className = 'wx';

  const hero = document.createElement('div');
  hero.className = 'wx-hero';
  hero.innerHTML =
    '<p class="wx-city">Milano</p>' +
    '<p class="wx-temp">18°</p>' +
    '<p class="wx-cond">Parzialmente nuvoloso</p>' +
    '<p class="wx-maxmin">Max: 21° · Min: 12°</p>';

  const hourlyData = [['Ora', '⛅', '18°'], ['15:00', '⛅', '19°'], ['16:00', '☀️', '20°'], ['17:00', '☀️', '19°'], ['18:00', '🌇', '17°'], ['19:00', '🌆', '15°'], ['20:00', '🌙', '14°'], ['21:00', '🌙', '13°']];
  const hourly = document.createElement('div');
  hourly.className = 'wx-card wx-hourly';
  hourly.innerHTML = hourlyData.map((h) =>
    '<div class="wx-hour"><span>' + h[0] + '</span><span class="wx-h-ico">' + h[1] + '</span><strong>' + h[2] + '</strong></div>'
  ).join('');

  const days = [
    ['Oggi', '⛅', 12, 21], ['Mercoledì', '☀️', 13, 23], ['Giovedì', '🌧️', 11, 16],
    ['Venerdì', '🌧️', 10, 15], ['Sabato', '☁️', 12, 18], ['Domenica', '☀️', 14, 24],
  ];
  const daysEl = document.createElement('div');
  daysEl.className = 'wx-card wx-days';
  daysEl.innerHTML = days.map((d) => {
    const left = ((d[2] - 8) / 18) * 100;
    const width = ((d[3] - d[2]) / 18) * 100;
    return (
      '<div class="wx-day">' +
      '<span class="wx-d-name">' + d[0] + '</span>' +
      '<span class="wx-d-ico">' + d[1] + '</span>' +
      '<span class="wx-d-min">' + d[2] + '°</span>' +
      '<span class="wx-bar"><span style="left:' + left + '%;width:' + width + '%"></span></span>' +
      '<span class="wx-d-max">' + d[3] + '°</span>' +
      '</div>'
    );
  }).join('');

  const details = document.createElement('div');
  details.className = 'wx-card wx-details';
  details.innerHTML = [
    ['💨', 'Vento', '6 km/h ONO'], ['💧', 'Umidità', '62%'],
    ['🌞', 'Indice UV', '3 · Moderato'], ['👁️', 'Visibilità', '10 km'],
  ].map((d) =>
    '<div class="wx-detail"><span class="wx-dt-ico">' + d[0] + '</span><span class="wx-dt-label">' + d[1] + '</span><strong>' + d[2] + '</strong></div>'
  ).join('');

  wx.appendChild(hero);
  wx.appendChild(hourly);
  wx.appendChild(daysEl);
  wx.appendChild(details);
  root.appendChild(wx);
}

/* ---------- Gallery (stile HyperOS) ---------- */

const GALLERY = [
  'linear-gradient(140deg, #ff6a00, #ff3d8a)',
  'linear-gradient(140deg, #7c5cff, #3a0f4d)',
  'linear-gradient(140deg, #00c6ff, #0072ff)',
  'linear-gradient(140deg, #00e0a4, #00795c)',
  'linear-gradient(140deg, #ffd24a, #ff6a00)',
  'linear-gradient(140deg, #e8e6e1, #6b7080)',
  'linear-gradient(140deg, #ff5f6d, #ffc371)',
  'linear-gradient(140deg, #4776e6, #8e54e9)',
  'linear-gradient(140deg, #11998e, #38ef7d)',
];

function initGallery(root) {
  root.innerHTML = '';
  const label = document.createElement('p');
  label.className = 'gal-label';
  label.textContent = 'Oggi · Milano';
  root.appendChild(label);
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

/* ---------- Music (stile Xiaomi) ---------- */

function fmtTime(s) { return Math.floor(s / 60) + ':' + pad(Math.floor(s % 60)); }

function initMusic(root) {
  root.innerHTML = '';
  root.classList.add('music-root');

  const backdrop = document.createElement('div');
  backdrop.className = 'music-backdrop';

  const now = document.createElement('div');
  now.className = 'music-now';
  now.innerHTML =
    '<div class="music-cover"></div>' +
    '<div class="music-meta"><div class="m-title"></div><div class="m-artist"></div></div>' +
    '<div class="progress"><span></span></div>' +
    '<div class="progress-times"><span></span><span></span></div>';

  const controls = document.createElement('div');
  controls.className = 'music-controls';
  const prevBtn = document.createElement('button');
  prevBtn.className = 'm-btn';
  prevBtn.textContent = '⏮';
  const playBtn = document.createElement('button');
  playBtn.className = 'm-btn play';
  playBtn.textContent = '▶';
  const nextBtn = document.createElement('button');
  nextBtn.className = 'm-btn';
  nextBtn.textContent = '⏭';
  prevBtn.addEventListener('click', () => playerSkip(-1));
  nextBtn.addEventListener('click', () => playerSkip(1));
  playBtn.addEventListener('click', playerTogglePlay);
  controls.appendChild(prevBtn);
  controls.appendChild(playBtn);
  controls.appendChild(nextBtn);

  const queueLabel = document.createElement('p');
  queueLabel.className = 'queue-label';
  queueLabel.textContent = 'Prossimi brani';
  const queue = document.createElement('div');
  queue.className = 'music-queue';

  PLAYER_SONGS.musica.forEach((s, i) => {
    const row = document.createElement('button');
    row.className = 'queue-row';
    row.innerHTML =
      '<span class="q-cover" style="background:' + s.cover + '"></span>' +
      '<span class="q-meta"><strong>' + s.title + '</strong><em>' + s.artist + '</em></span>' +
      '<span class="q-eq"><i></i><i></i><i></i></span>' +
      '<span class="q-dur">' + fmtTime(s.dur) + '</span>';
    row.addEventListener('click', () => playerSelect('musica', i));
    queue.appendChild(row);
  });

  root.appendChild(backdrop);
  root.appendChild(now);
  root.appendChild(controls);
  root.appendChild(queueLabel);
  root.appendChild(queue);

  function render() {
    const s = playerSong();
    const isMusica = player.source === 'musica';
    now.querySelector('.music-cover').style.background = isMusica ? s.cover : 'linear-gradient(140deg, #3a3d4a, #16181f)';
    backdrop.style.background =
      'radial-gradient(90% 55% at 50% 0%, ' + (isMusica ? s.glow : 'rgba(120,120,140,0.25)') + ', transparent 70%)';
    now.querySelector('.m-title').textContent = isMusica ? s.title : 'Riproduzione da Spotify';
    now.querySelector('.m-artist').textContent = isMusica ? s.artist : s.title + ' · ' + s.artist;
    now.querySelector('.progress span').style.width = (player.pos / s.dur) * 100 + '%';
    now.querySelector('.progress-times').innerHTML =
      '<span>' + fmtTime(player.pos) + '</span><span>' + fmtTime(s.dur) + '</span>';
    playBtn.textContent = player.playing ? '⏸' : '▶';
    queue.querySelectorAll('.queue-row').forEach((row, i) => {
      row.classList.toggle('active', isMusica && i === player.index);
      row.classList.toggle('playing', isMusica && i === player.index && player.playing);
    });
  }

  const listener = () => render();
  player.listeners.add(listener);
  addCleanup(() => player.listeners.delete(listener));
  render();
}

/* ---------- Spotify ---------- */

function initSpotify(root) {
  root.innerHTML = '';
  root.classList.add('spo-root');

  const hero = document.createElement('div');
  hero.className = 'spo-hero';
  hero.innerHTML =
    '<p class="spo-kicker">PLAYLIST</p>' +
    '<p class="spo-title">HyperOS Mix</p>' +
    '<p class="spo-sub">Xiaomi 18 Fold · 4 brani</p>';

  const list = document.createElement('div');
  list.className = 'spo-list';

  PLAYER_SONGS.spotify.forEach((s, i) => {
    const row = document.createElement('button');
    row.className = 'spo-row';
    row.innerHTML =
      '<span class="q-cover" style="background:' + s.cover + '"></span>' +
      '<span class="q-meta"><strong>' + s.title + '</strong><em>' + s.artist + '</em></span>' +
      '<span class="q-eq"><i></i><i></i><i></i></span>' +
      '<span class="q-dur">' + fmtTime(s.dur) + '</span>';
    row.addEventListener('click', () => playerSelect('spotify', i));
    list.appendChild(row);
  });

  const nowBar = document.createElement('div');
  nowBar.className = 'spo-now';
  nowBar.innerHTML =
    '<span class="q-cover spo-now-cover"></span>' +
    '<span class="q-meta"><strong></strong><em></em></span>' +
    '<button class="m-btn spo-now-play">▶</button>';
  nowBar.querySelector('.spo-now-play').addEventListener('click', playerTogglePlay);
  nowBar.addEventListener('click', (e) => {
    if (!e.target.closest('.spo-now-play')) playerTogglePlay();
  });

  root.appendChild(hero);
  root.appendChild(list);
  root.appendChild(nowBar);

  function render() {
    const s = playerSong();
    const isSpotify = player.source === 'spotify';
    list.querySelectorAll('.spo-row').forEach((row, i) => {
      row.classList.toggle('active', isSpotify && i === player.index);
      row.classList.toggle('playing', isSpotify && i === player.index && player.playing);
    });
    nowBar.classList.toggle('visible', player.playing || player.pos > 0);
    nowBar.querySelector('.spo-now-cover').style.background = isSpotify ? s.cover : 'linear-gradient(140deg, #3a3d4a, #16181f)';
    nowBar.querySelector('strong').textContent = s.title;
    nowBar.querySelector('em').textContent = s.artist;
    nowBar.querySelector('.spo-now-play').textContent = player.playing ? '⏸' : '▶';
  }

  const listener = () => render();
  player.listeners.add(listener);
  addCleanup(() => player.listeners.delete(listener));
  render();
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

/* ---------- Cronometro (stile Xiaomi) ---------- */

function initStopwatch(root) {
  root.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'sw';

  const display = document.createElement('p');
  display.className = 'sw-time';
  display.textContent = '00:00.00';

  const btns = document.createElement('div');
  btns.className = 'sw-btns';
  const lapBtn = document.createElement('button');
  lapBtn.className = 'sw-btn sw-lap';
  lapBtn.textContent = 'Giro';
  lapBtn.addEventListener('click', () => (stopwatch.running ? swLap() : swReset()));
  const mainBtn = document.createElement('button');
  mainBtn.className = 'sw-btn sw-main';
  mainBtn.textContent = 'Avvia';
  mainBtn.addEventListener('click', swToggle);
  btns.appendChild(lapBtn);
  btns.appendChild(mainBtn);

  const lapsEl = document.createElement('div');
  lapsEl.className = 'sw-laps';

  wrap.appendChild(display);
  wrap.appendChild(btns);
  wrap.appendChild(lapsEl);
  root.appendChild(wrap);

  function render() {
    display.textContent = swFormat(stopwatch.elapsed);
    mainBtn.textContent = stopwatch.running ? 'Pausa' : stopwatch.elapsed > 0 ? 'Riprendi' : 'Avvia';
    mainBtn.classList.toggle('running', stopwatch.running);
    lapBtn.textContent = stopwatch.running ? 'Giro' : stopwatch.elapsed > 0 ? 'Azzera' : 'Giro';

    const n = stopwatch.laps.length;
    let best = -1, worst = -1;
    if (n >= 2) {
      const splits = stopwatch.laps.map((t, i) => t - (stopwatch.laps[i - 1] || 0));
      best = splits.indexOf(Math.min(...splits));
      worst = splits.indexOf(Math.max(...splits));
    }
    lapsEl.innerHTML = stopwatch.laps
      .map((t, i) => ({ t, split: t - (stopwatch.laps[i - 1] || 0), i }))
      .reverse()
      .map(({ t, split, i }) =>
        '<div class="sw-lap' + (i === best ? ' best' : i === worst ? ' worst' : '') + '">' +
        '<span>Giro ' + (i + 1) + '</span>' +
        '<span class="sw-split">' + swFormat(split) + '</span>' +
        '<span>' + swFormat(t) + '</span>' +
        '</div>'
      ).join('');
  }

  const listener = () => render();
  stopwatch.listeners.add(listener);
  addCleanup(() => stopwatch.listeners.delete(listener));

  keyRouter.handler = (e) => {
    if (e.code === 'Space') { e.preventDefault(); swToggle(); }
    else if (e.key === 'l' || e.key === 'L') swLap();
  };

  render();
}

/* ---------- Sparatutto ---------- */

function initShooter(root) {
  root.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'game-wrap';

  const hud = document.createElement('div');
  hud.className = 'game-hud';
  hud.innerHTML = 'Punti: <strong id="shScore">0</strong> · Vite: <strong id="shLives">❤❤❤</strong> · Livello <strong id="shWave">1</strong>';

  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  canvas.width = 300;
  canvas.height = 340;
  const ctx = canvas.getContext('2d');

  const CW = canvas.width, CH = canvas.height;
  let ship, bullets, enemies, score, lives, wave, over, loop, keys, shootCd;

  function makeEnemies() {
    const rows = Math.min(2 + Math.floor(wave / 2), 4);
    const arr = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < 6; c++) {
        arr.push({ x: 30 + c * 44, y: 26 + r * 34, r: 11, alive: true });
      }
    }
    return arr;
  }

  function reset() {
    const old = wrap.querySelector('.game-overlay');
    if (old) old.remove();
    ship = { x: CW / 2, w: 26 };
    bullets = [];
    score = 0;
    lives = 3;
    wave = 1;
    over = false;
    keys = {};
    shootCd = 0;
    enemies = makeEnemies();
    updateHud();
  }

  function updateHud() {
    hud.querySelector('#shScore').textContent = score;
    hud.querySelector('#shLives').textContent = '❤'.repeat(Math.max(lives, 0));
    hud.querySelector('#shWave').textContent = wave;
  }

  function shoot() {
    if (over || shootCd > 0) return;
    bullets.push({ x: ship.x, y: CH - 34 });
    shootCd = 8;
  }

  function gameOver() {
    over = true;
    const ov = document.createElement('div');
    ov.className = 'game-overlay';
    ov.innerHTML = '<p class="big">Game Over</p><p style="color:var(--muted)">Punti: ' + score + '</p>';
    const btn = document.createElement('button');
    btn.textContent = 'Rigioca';
    btn.addEventListener('click', () => { reset(); });
    ov.appendChild(btn);
    wrap.appendChild(ov);
  }

  function step() {
    if (over) return;
    shootCd = Math.max(0, shootCd - 1);

    if (keys.ArrowLeft || keys.a) ship.x = Math.max(16, ship.x - 4.2);
    if (keys.ArrowRight || keys.d) ship.x = Math.min(CW - 16, ship.x + 4.2);
    if (keys.Space) shoot();

    bullets.forEach((b) => { b.y -= 7; });
    bullets = bullets.filter((b) => b.y > -8);

    const speed = 0.35 + wave * 0.16;
    let edge = false;
    enemies.forEach((en) => {
      if (!en.alive) return;
      en.x += speed;
      if (en.x > CW - 14 || en.x < 14) edge = true;
    });
    if (edge) {
      enemies.forEach((en) => { en.x -= speed * 2; en.y += 16; });
    }

    enemies.forEach((en) => {
      if (!en.alive) return;
      bullets.forEach((b) => {
        if (b.y < en.y + en.r && b.y > en.y - en.r && Math.abs(b.x - en.x) < en.r) {
          en.alive = false;
          b.y = -100;
          score += 10;
        }
      });
      if (en.y > CH - 40) {
        en.alive = false;
        lives -= 1;
      }
      if (en.y > CH - 52 && Math.abs(en.x - ship.x) < 20) {
        en.alive = false;
        lives -= 1;
      }
    });

    if (enemies.every((en) => !en.alive)) {
      wave += 1;
      enemies = makeEnemies();
    }
    if (lives <= 0) {
      updateHud();
      gameOver();
      return;
    }
    updateHud();
    draw();
  }

  function draw() {
    ctx.fillStyle = '#0d0f1a';
    ctx.fillRect(0, 0, CW, CH);

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 20; i++) {
      ctx.fillRect((i * 53 + 17) % CW, (i * 91 + 23) % CH, 1.6, 1.6);
    }

    ctx.fillStyle = '#ffd24a';
    bullets.forEach((b) => ctx.fillRect(b.x - 1.5, b.y, 3, 9));

    enemies.forEach((en) => {
      if (!en.alive) return;
      ctx.fillStyle = '#8e54e9';
      ctx.beginPath();
      ctx.roundRect(en.x - en.r, en.y - en.r, en.r * 2, en.r * 2, 5);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(en.x - 4, en.y - 2, 3, 3);
      ctx.fillRect(en.x + 2, en.y - 2, 3, 3);
    });

    ctx.fillStyle = '#ff6a00';
    ctx.beginPath();
    ctx.moveTo(ship.x, CH - 36);
    ctx.lineTo(ship.x - 14, CH - 12);
    ctx.lineTo(ship.x + 14, CH - 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffb84a';
    ctx.fillRect(ship.x - 2, CH - 22, 4, 6);
  }

  keyRouter.handler = (e) => {
    if (['ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) || ['a', 'd'].includes(e.key)) {
      e.preventDefault();
      if (e.type === 'keydown') keys[e.code === 'Space' ? 'Space' : e.key] = true;
    }
  };
  const keyUp = (e) => {
    keys[e.code === 'Space' ? 'Space' : e.key] = false;
  };
  document.addEventListener('keyup', keyUp);
  addCleanup(() => document.removeEventListener('keyup', keyUp));

  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    ship.x = Math.max(16, Math.min(CW - 16, ((e.clientX - rect.left) / rect.width) * CW));
  });
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    shoot();
  });

  const hint = document.createElement('p');
  hint.className = 'game-hint';
  hint.textContent = 'Frecce/A-D per muoverti · Spazio o tap per sparare';

  wrap.appendChild(hud);
  wrap.appendChild(canvas);
  wrap.appendChild(hint);
  root.appendChild(wrap);

  reset();
  draw();
  loop = setInterval(step, 28);
  addCleanup(() => { clearInterval(loop); loop = null; });
}

/* ---------- Keyboard ---------- */

document.addEventListener('keydown', (e) => {
  if (e.key === 'f' || e.key === 'F') toggleFold();
  if (keyRouter.handler) keyRouter.handler(e);
});
