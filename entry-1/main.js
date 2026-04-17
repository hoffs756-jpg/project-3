// ── NYC Borough coordinates ───────────────────────────────────
// Using specific lat/lng for each borough center
const BOROUGHS = {
  'Manhattan':    { lat: 40.7831, lon: -73.9712 },
  'Brooklyn':     { lat: 40.6782, lon: -73.9442 },
  'Queens':       { lat: 40.7282, lon: -73.7949 },
  'Bronx':        { lat: 40.8448, lon: -73.8648 },
  'Staten Island':{ lat: 40.5795, lon: -74.1502 },
};

// ── WMO weather code map ──────────────────────────────────────
const WMO = {
  0:  { label: 'Clear sky',          icon: '☀️' },
  1:  { label: 'Mainly clear',       icon: '🌤️' },
  2:  { label: 'Partly cloudy',      icon: '⛅' },
  3:  { label: 'Overcast',           icon: '☁️' },
  45: { label: 'Foggy',              icon: '🌫️' },
  48: { label: 'Icy fog',            icon: '🌫️' },
  51: { label: 'Light drizzle',      icon: '🌦️' },
  53: { label: 'Moderate drizzle',   icon: '🌦️' },
  55: { label: 'Dense drizzle',      icon: '🌧️' },
  61: { label: 'Slight rain',        icon: '🌧️' },
  63: { label: 'Moderate rain',      icon: '🌧️' },
  65: { label: 'Heavy rain',         icon: '🌧️' },
  71: { label: 'Slight snow',        icon: '🌨️' },
  73: { label: 'Moderate snow',      icon: '❄️' },
  75: { label: 'Heavy snow',         icon: '❄️' },
  80: { label: 'Slight showers',     icon: '🌦️' },
  81: { label: 'Moderate showers',   icon: '🌧️' },
  82: { label: 'Violent showers',    icon: '⛈️' },
  95: { label: 'Thunderstorm',       icon: '⛈️' },
  99: { label: 'Heavy thunderstorm', icon: '🌩️' },
};

function getWMO(code) {
  return WMO[code] || { label: 'Unknown', icon: '🌡️' };
}

function formatHour(isoStr) {
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
}

function formatTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getDayName(dateStr, index) {
  if (index === 0) return 'Today';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}

// ── DOM refs ──────────────────────────────────────────────────
const errorMsg      = document.getElementById('errorMsg');
const loadingWrap   = document.getElementById('loading');
const currentCard   = document.getElementById('currentCard');
const statsRow      = document.getElementById('statsRow');
const hourlySection = document.getElementById('hourlySection');
const forecastSection = document.getElementById('forecastSection');

function showError(msg) {
  errorMsg.textContent = msg;
  setTimeout(() => { errorMsg.textContent = ''; }, 4000);
}

function setLoading(on) {
  loadingWrap.style.display = on ? 'flex' : 'none';
}

function hideAll() {
  currentCard.style.display = 'none';
  statsRow.style.display    = 'none';
  hourlySection.style.display   = 'none';
  forecastSection.style.display = 'none';
  document.getElementById('hourlyRow').innerHTML   = '';
  document.getElementById('forecastGrid').innerHTML = '';
}

// ── Fetch and render ──────────────────────────────────────────
async function loadBorough(name) {
  hideAll();
  setLoading(true);

  const coords = BOROUGHS[name];

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${coords.lat}&longitude=${coords.lon}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,surface_pressure` +
      `&hourly=temperature_2m,precipitation_probability,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,sunrise,sunset` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York&forecast_days=7`
    );
    const wx = await res.json();

    setLoading(false);
    renderCurrent(name, wx);
    renderStats(wx);
    renderHourly(wx);
    renderForecast(wx);

  } catch (e) {
    setLoading(false);
    showError('Could not fetch weather data. Please try again.');
  }
}

// ── Render current ────────────────────────────────────────────
function renderCurrent(name, wx) {
  const c    = wx.current;
  const info = getWMO(c.weather_code);

  document.getElementById('mainIcon').textContent    = info.icon;
  document.getElementById('cityName').textContent    = name + ', NY';
  document.getElementById('description').textContent = info.label;
  document.getElementById('temperature').textContent = `${Math.round(c.temperature_2m)}°F`;
  document.getElementById('feelsLike').textContent   = `Feels like ${Math.round(c.apparent_temperature)}°F`;

  currentCard.style.display = 'flex';
}

// ── Render stats ──────────────────────────────────────────────
function renderStats(wx) {
  const c = wx.current;

  document.getElementById('humidity').textContent = `${c.relative_humidity_2m}%`;
  document.getElementById('wind').textContent     = `${Math.round(c.wind_speed_10m)} mph`;
  document.getElementById('pressure').textContent = `${Math.round(c.surface_pressure)} hPa`;
  document.getElementById('uv').textContent       = wx.daily.uv_index_max[0] ?? '—';
  document.getElementById('sunrise').textContent  = formatTime(wx.daily.sunrise[0]);
  document.getElementById('sunset').textContent   = formatTime(wx.daily.sunset[0]);

  statsRow.style.display = 'grid';
}

// ── Render hourly ─────────────────────────────────────────────
function renderHourly(wx) {
  const now   = new Date();
  const times = wx.hourly.time;
  const temps = wx.hourly.temperature_2m;
  const probs = wx.hourly.precipitation_probability;
  const codes = wx.hourly.weather_code;
  const row   = document.getElementById('hourlyRow');

  row.innerHTML = '';
  let count = 0;

  for (let i = 0; i < times.length && count < 24; i++) {
    if (new Date(times[i]) < now) continue;
    const info = getWMO(codes[i]);
    const card = document.createElement('div');
    card.className = 'hour-card';
    card.innerHTML = `
      <div class="hour-time">${formatHour(times[i])}</div>
      <div class="hour-icon">${info.icon}</div>
      <div class="hour-temp">${Math.round(temps[i])}°</div>
      <div class="hour-rain">${probs[i]}% 💧</div>
    `;
    row.appendChild(card);
    count++;
  }

  hourlySection.style.display = 'block';
}

// ── Render forecast ───────────────────────────────────────────
function renderForecast(wx) {
  const d    = wx.daily;
  const grid = document.getElementById('forecastGrid');
  grid.innerHTML = '';

  for (let i = 0; i < d.time.length; i++) {
    const info = getWMO(d.weather_code[i]);
    const card = document.createElement('div');
    card.className = 'day-card';
    card.innerHTML = `
      <div class="day-name">${getDayName(d.time[i], i)}</div>
      <div class="day-icon">${info.icon}</div>
      <div class="day-high">${Math.round(d.temperature_2m_max[i])}°</div>
      <div class="day-low">${Math.round(d.temperature_2m_min[i])}°</div>
      <div class="day-rain">${d.precipitation_sum[i]}″</div>
    `;
    grid.appendChild(card);
  }

  forecastSection.style.display = 'block';
}

// ── Borough button events ─────────────────────────────────────
document.querySelectorAll('.borough-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.borough-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    loadBorough(this.dataset.borough);
  });
});

// ── Load Manhattan on start ───────────────────────────────────
loadBorough('Manhattan');