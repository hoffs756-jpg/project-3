// ── Weather data ──
const weatherData = {
  temp: 58,
  condition: 'cloudy',
  conditionText: 'Mostly Cloudy',
  isDay: true,
  forecast: [
    { day: 'Tue', high: 63, rain: 10 },
    { day: 'Wed', high: 53, rain: 20 },
    { day: 'Thu', high: 60, rain: 25 },
    { day: 'Fri', high: 59, rain: 45 },
    { day: 'Sat', high: 57, rain: 10 },
  ]
};

// ── Atmospheric themes ──
const themes = {
  sunny: {
    word: 'Luminous',
    desc: 'The city breathes gold today.',
    orb1: '#e8c96a', orb2: '#f0a850', orb3: '#e8e0b0',
    particle: 'dust', soundType: 'birds',
  },
  cloudy: {
    word: 'Overcast',
    desc: 'A soft grey ceiling muffles the skyline.',
    orb1: '#6aab8a', orb2: '#8fb8c4', orb3: '#9ab0b8',
    particle: 'drift', soundType: 'wind',
  },
  rainy: {
    word: 'Rain',
    desc: 'Drops tap against the window.',
    orb1: '#4a7a9b', orb2: '#5e8fa8', orb3: '#6a8090',
    particle: 'rain', soundType: 'rain',
  },
  snowy: {
    word: 'Snow',
    desc: 'Sound absorbed by white.',
    orb1: '#a0b8c8', orb2: '#b8cdd8', orb3: '#c8d8e0',
    particle: 'snow', soundType: 'silence',
  },
  clear: {
    word: 'Clear',
    desc: 'The sky opens wide and blue. Horizons stretch further today.',
    orb1: '#5a9ad0', orb2: '#70b0e0', orb3: '#90c8f0',
    particle: 'dust', soundType: 'birds',
  },
  stormy: {
    word: 'Storming',
    desc: 'Awake and electric.',
    orb1: '#4a4060', orb2: '#604858', orb3: '#503860',
    particle: 'rain', soundType: 'thunder',
  }
};

// ── Audio engine ──
let audioCtx = null;
let soundNodes = [];
let soundEnabled = false;
let masterGain = null;

function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
  masterGain.connect(audioCtx.destination);
}

function makeWindSound() {
  const bufSize = audioCtx.sampleRate * 4;
  const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
  const src = audioCtx.createBufferSource();
  src.buffer = buf; src.loop = true;
  const lp = audioCtx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 400;
  const g = audioCtx.createGain(); g.gain.value = 0.15;
  const lfo = audioCtx.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoGain = audioCtx.createGain(); lfoGain.gain.value = 0.05;
  lfo.connect(lfoGain); lfoGain.connect(g.gain); lfo.start();
  src.connect(lp); lp.connect(g); g.connect(masterGain); src.start();
  soundNodes.push(src, lfo);
}

function makeRainSound() {
  const bufSize = audioCtx.sampleRate * 2;
  const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
  const src = audioCtx.createBufferSource();
  src.buffer = buf; src.loop = true;
  const hp = audioCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 600;
  const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 8000;
  const g = audioCtx.createGain(); g.gain.value = 0.12;
  src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(masterGain); src.start();
  soundNodes.push(src);
}

function makeBirdAmbience() {
  const bufSize = audioCtx.sampleRate * 3;
  const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.1;
  const src = audioCtx.createBufferSource();
  src.buffer = buf; src.loop = true;
  const bp = audioCtx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 0.5;
  const g = audioCtx.createGain(); g.gain.value = 0.06;
  const osc = audioCtx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 340;
  const oscG = audioCtx.createGain(); oscG.gain.value = 0.008;
  osc.connect(oscG); oscG.connect(masterGain); osc.start();
  src.connect(bp); bp.connect(g); g.connect(masterGain); src.start();
  soundNodes.push(src, osc);
}

function makeSilentAmbience() {
  const osc = audioCtx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 55;
  const g = audioCtx.createGain(); g.gain.value = 0.012;
  osc.connect(g); g.connect(masterGain); osc.start();
  soundNodes.push(osc);
}

function startAtmosphereSound(type) {
  stopSound();
  if (!audioCtx) return;
  if (type === 'wind') makeWindSound();
  else if (type === 'rain') makeRainSound();
  else if (type === 'birds') makeBirdAmbience();
  else makeSilentAmbience();
  masterGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 3);
}

function stopSound() {
  soundNodes.forEach(n => { try { n.stop(); } catch(e){} });
  soundNodes = [];
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const dot = document.getElementById('soundDot');
  const lbl = document.getElementById('soundLabel');
  if (soundEnabled) {
    masterGain && masterGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 1);
    dot.classList.remove('muted');
    lbl.textContent = 'Atmosphere on';
  } else {
    masterGain && masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
    dot.classList.add('muted');
    lbl.textContent = 'Atmosphere off';
  }
}

// ── Particle canvas ──
const canvas = document.getElementById('particles');
const ctx2d = canvas.getContext('2d');
let particles = [];
let particleType = 'drift';
let animId;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function createParticles(type) {
  particles = [];
  const count = type === 'rain' ? 120 : type === 'snow' ? 60 : 40;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: type === 'rain' ? (Math.random() - 0.5) * 0.5 : (Math.random() - 0.5) * 0.3,
      vy: type === 'rain' ? 4 + Math.random() * 4 :
           type === 'snow' ? 0.5 + Math.random() * 1 :
           -0.2 - Math.random() * 0.3,
      size: type === 'rain' ? (Math.random() * 1 + 0.5) :
            type === 'snow' ? (Math.random() * 3 + 1) :
            (Math.random() * 2 + 0.5),
      alpha: Math.random() * 0.3 + 0.05,
      life: Math.random(),
    });
  }
}

function drawParticles() {
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    ctx2d.beginPath();
    if (particleType === 'rain') {
      ctx2d.strokeStyle = `rgba(160,200,220,${p.alpha})`;
      ctx2d.lineWidth = p.size;
      ctx2d.moveTo(p.x, p.y);
      ctx2d.lineTo(p.x + p.vx * 3, p.y + p.vy * 2);
      ctx2d.stroke();
    } else {
      ctx2d.fillStyle = `rgba(232,228,220,${p.alpha})`;
      ctx2d.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx2d.fill();
    }
    p.x += p.vx; p.y += p.vy;
    if (p.y > canvas.height + 10) p.y = -10;
    if (p.y < -10) p.y = canvas.height + 10;
    if (p.x > canvas.width + 10) p.x = -10;
    if (p.x < -10) p.x = canvas.width + 10;
  });
  animId = requestAnimationFrame(drawParticles);
}

// ── Live clock ──
function updateClock() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2,'0');
  const m = now.getMinutes().toString().padStart(2,'0');
  const s = now.getSeconds().toString().padStart(2,'0');
  const el = document.getElementById('liveTime');
  if (el) el.textContent = `${h} : ${m} : ${s}`;
}
setInterval(updateClock, 1000);
updateClock();

// ── Apply weather theme ──
function applyTheme(theme) {
  document.documentElement.style.setProperty('--orb1', theme.orb1);
  document.documentElement.style.setProperty('--orb2', theme.orb2);
  document.documentElement.style.setProperty('--orb3', theme.orb3);
  document.documentElement.style.setProperty('--accent', theme.orb1);
  document.querySelectorAll('.orb').forEach((o, i) => {
    setTimeout(() => { o.style.opacity = i === 0 ? '0.6' : i === 1 ? '0.5' : '0.4'; }, i * 300);
  });
  particleType = theme.particle;
  createParticles(particleType);
  document.getElementById('particles').style.opacity = '0.7';
  if (animId) cancelAnimationFrame(animId);
  drawParticles();
}

// ── Populate UI ──
function populateWeather() {
  const d = weatherData;
  const condKey = d.condition.toLowerCase().includes('rain') ? 'rainy' :
                  d.condition.toLowerCase().includes('cloud') ? 'cloudy' :
                  d.condition.toLowerCase().includes('snow') ? 'snowy' :
                  d.condition.toLowerCase().includes('storm') ? 'stormy' :
                  d.condition.toLowerCase().includes('clear') ? 'clear' : 'sunny';
  const theme = themes[condKey] || themes.cloudy;
  applyTheme(theme);
  document.getElementById('conditionText').textContent = theme.word;
  setTimeout(() => {
    document.getElementById('conditionWord').classList.add('revealed');
    document.getElementById('senseDesc').textContent = theme.desc;
    document.getElementById('senseDesc').classList.add('visible');
  }, 200);
  document.getElementById('tempDisplay').textContent = `${d.temp}°`;
  document.getElementById('condText').textContent = d.conditionText;
  document.getElementById('highToday').textContent = `${d.forecast[0].high}°`;
  document.getElementById('rainChance').textContent = `${d.forecast[0].rain}%`;
  document.getElementById('dayNight').textContent = d.isDay ? 'Daytime' : 'Nighttime';
  setTimeout(() => {
    document.getElementById('tempDisplay').classList.add('visible');
    document.getElementById('dataMeta').classList.add('visible');
    document.getElementById('divider').classList.add('visible');
    document.getElementById('waveViz').classList.add('visible');
  }, 600);
  const fr = document.getElementById('forecastRow');
  fr.innerHTML = '';
  d.forecast.forEach((f, i) => {
    const el = document.createElement('div');
    el.className = 'forecast-day';
    el.innerHTML = `
      <span class="fc-day">${f.day}</span>
      <span class="fc-high">${f.high}°</span>
      <span class="fc-rain">${f.rain}% rain</span>
      <div class="fc-bar"><div class="fc-bar-fill" id="bar${i}"></div></div>
    `;
    fr.appendChild(el);
  });
  setTimeout(() => {
    document.getElementById('forecastRow').classList.add('visible');
    document.getElementById('bottom-bar').classList.add('visible');
    d.forecast.forEach((f, i) => {
      const bar = document.getElementById(`bar${i}`);
      if (bar) setTimeout(() => { bar.style.transform = `scaleX(${f.rain / 100})`; }, i * 100 + 200);
    });
  }, 1200);
  if (soundEnabled) startAtmosphereSound(theme.soundType);
}

// ── DEV: Theme switcher ──
const themeKeys = ['cloudy', 'rainy', 'sunny', 'clear', 'snowy', 'stormy'];

function previewTheme(condKey) {
  const theme = themes[condKey];
  if (!theme) return;
  document.querySelectorAll('.dev-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === condKey);
  });
  applyTheme(theme);
  const wordEl = document.getElementById('conditionWord');
  const textEl = document.getElementById('conditionText');
  wordEl.classList.remove('revealed');
  setTimeout(() => { textEl.textContent = theme.word; wordEl.classList.add('revealed'); }, 200);
  const desc = document.getElementById('senseDesc');
  desc.style.opacity = '0';
  setTimeout(() => { desc.textContent = theme.desc; desc.style.opacity = '1'; }, 300);
  if (soundEnabled && audioCtx) startAtmosphereSound(theme.soundType);
}

document.addEventListener('keydown', e => {
  const idx = parseInt(e.key) - 1;
  if (idx >= 0 && idx < themeKeys.length) previewTheme(themeKeys[idx]);
});



// ── Enter experience ──
function enterExperience() {
  initAudio();
  soundEnabled = true;
  document.getElementById('intro').classList.add('hidden');
  document.getElementById('weather-view').classList.add('visible');
  populateWeather();
  startAtmosphereSound(themes.cloudy.soundType);

}

// ── Cursor ──
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
  ring.style.left = e.clientX + 'px';
  ring.style.top = e.clientY + 'px';
});
document.addEventListener('mousedown', () => { cursor.style.width = '14px'; cursor.style.height = '14px'; });
document.addEventListener('mouseup',   () => { cursor.style.width = '8px';  cursor.style.height = '8px'; });