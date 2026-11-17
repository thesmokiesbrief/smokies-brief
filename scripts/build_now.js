// Refreshes the "Right now" snapshot inside content.js. No AI, no paid data.
//   Gatlinburg forecast and weather alerts: National Weather Service (api.weather.gov, no key)
//   Park road closures and alerts: National Park Service (developer.nps.gov; free key in NPS_API_KEY, else DEMO_KEY)
// Also moves the site's date ("today") and the "Last update" stamp forward.
// Runs every morning in feeds.yml (saved to the repo) and every hour in power.yml (published only).
// If a source is down, the last good values stay and the page says when they were checked.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..'), file = path.join(root, 'content.js');
const UA = 'TheSmokiesBrief/1.0 (hello@thesmokiesbrief.com)';
const NPS_KEY = process.env.NPS_API_KEY || 'DEMO_KEY';
const LAT = 35.7143, LON = -83.5102, TZ = 'America/New_York';

const load = src => { const c = { window: {} }; vm.runInNewContext(src, c); return c.window.CONTENT; };
const src = fs.readFileSync(file, 'utf8'), K = load(src), N = K.now;

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/geo+json, application/json' }, signal: AbortSignal.timeout(20000) });
      if (r.ok) return await r.json();
      console.log(`${r.status} from ${url.split('?')[0]}`);
    } catch (e) { console.log(`${e.name} ${(e.cause && e.cause.code) || e.message} from ${url.split('?')[0]}`); }
    await new Promise(r => setTimeout(r, 3000 * (i + 1)));
  }
  return null;
}

const now = new Date();
const part = (o) => Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, ...o }).formatToParts(now).map(p => [p.type, p.value]));
const d = part({ year: 'numeric', month: '2-digit', day: '2-digit' });
const t = part({ weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
const today = `${d.year}-${d.month}-${d.day}`;
const updated = `${t.weekday}, ${t.month} ${t.day}, ${t.hour}:${t.minute} ${t.dayPeriod === 'AM' ? 'a.m.' : 'p.m.'}`;

// "Kuwohi Road Closed Due To Snow And Ice" -> "Kuwohi Road is closed due to snow and ice."
function sentence(s) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  const words = s.split(' '), caps = words.filter(w => /^[A-Z]/.test(w)).length;
  const m = s.match(/^(.*?)\s+(?:is\s+|are\s+)?(closed|open|reopened)\b(.*)$/i);
  if (m && caps / words.length > 0.7) s = `${m[1]} ${/,| and /.test(m[1]) ? 'are' : 'is'} ${m[2].toLowerCase()}${m[3].toLowerCase()}`;
  return /[.!?]$/.test(s) ? s : s + '.';
}
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n)).replace(/[,;:]$/, '') + '…'; };

(async () => {
  const set = {};

  // weather: forecast periods, each [name, temp, short forecast, daytime 1/0, date]
  // Gatlinburg's NWS grid square (from /points/35.7143,-83.5102); looked up again only if it ever moves
  let fc = await get('https://api.weather.gov/gridpoints/MRX/86,41/forecast');
  if (!fc) { const pt = await get(`https://api.weather.gov/points/${LAT},${LON}`); fc = pt && pt.properties && await get(pt.properties.forecast); }
  if (fc && fc.properties && fc.properties.periods && fc.properties.periods.length) {
    set.weather = fc.properties.periods.slice(0, 8).map(p => [p.name, p.temperature, p.shortForecast, p.isDaytime ? 1 : 0, p.startTime.slice(0, 10)]);
    set.weatherSrc = 'NWS'; set.weatherChecked = now.toISOString();
  } else {
    // backup when the weather service is down: Open-Meteo daily highs and lows (free, no key)
    const om = await get(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=${encodeURIComponent(TZ)}&forecast_days=5`);
    if (om && om.daily && om.daily.time.length > 2) {
      const W = c => c === 0 ? 'Sunny' : c <= 2 ? 'Partly sunny' : c === 3 ? 'Cloudy' : c <= 48 ? 'Fog' : c <= 57 ? 'Drizzle' : c <= 67 ? 'Rain' : c <= 77 ? 'Snow' : c <= 82 ? 'Showers' : c <= 86 ? 'Snow showers' : 'Thunderstorms';
      const night = s => s.replace('Sunny', 'Clear').replace('Partly sunny', 'Partly cloudy');
      const DN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const D = om.daily, w = [];
      for (let i = 0; i < 4 && i + 1 < D.time.length; i++) {
        const nm = i === 0 ? 'Today' : DN[new Date(D.time[i] + 'T12:00:00Z').getUTCDay()];
        w.push([nm, Math.round(D.temperature_2m_max[i]), W(D.weather_code[i]), 1, D.time[i]]);
        w.push([i === 0 ? 'Tonight' : nm + ' Night', Math.round(D.temperature_2m_min[i + 1]), night(W(D.weather_code[i])), 0, D.time[i]]);
      }
      set.weather = w; set.weatherSrc = 'Open-Meteo'; set.weatherChecked = now.toISOString();
    }
  }
  const al = await get(`https://api.weather.gov/alerts/active?point=${LAT},${LON}`);
  if (al && Array.isArray(al.features)) {
    set.wxAlerts = al.features.map(f => f.properties).filter(p => p.status === 'Actual')
      .map(p => ({ event: p.event, until: (p.ends || p.expires || '').slice(0, 16), text: clip(p.headline, 160) }));
    set.wxChecked = now.toISOString();
  } else if (!N.wxChecked || now - new Date(N.wxChecked) > 3 * 36e5) {
    set.wxAlerts = null; // unknown: the page links to NWS instead of saying "no alerts"
  }

  // park: NPS alerts for Great Smoky Mountains
  const np = await get(`https://developer.nps.gov/api/v1/alerts?parkCode=grsm&limit=50&api_key=${NPS_KEY}`);
  if (np && Array.isArray(np.data)) {
    const rank = { 'Danger': 0, 'Park Closure': 1, 'Caution': 2, 'Information': 3 };
    const park = np.data.map(a => {
      const desc = (a.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return {
        cat: a.category, title: a.title.replace(/\.$/, ''),
        text: desc.toLowerCase().replace(/\W/g, '') === a.title.toLowerCase().replace(/\W/g, '') ? '' : clip(desc, 200),
        road: a.category === 'Park Closure' ? sentence(/closed|open/i.test(desc) ? desc.split(/(?<=\.)\s/)[0] : a.title) : '',
        date: (a.lastIndexedDate || '').slice(0, 10),
        url: a.url || 'https://www.nps.gov/grsm/planyourvisit/conditions.htm'
      };
    }).sort((a, b) => (rank[a.cat] ?? 9) - (rank[b.cat] ?? 9) || b.date.localeCompare(a.date));
    set.park = park;
    set.roads = park.filter(a => a.road).map(a => a.road);
    set.parkChecked = now.toISOString();
  }

  // dated notes expire on their own
  if (N.roadsSoon && N.roadsSoonUntil && today > N.roadsSoonUntil) set.roadsSoon = '';
  if (N.busyDays && N.busyDaysUntil && today > N.busyDaysUntil) set.busyDays = '';

  // write back into content.js, one line per key inside `now: {`
  let out = src.replace(/^  updated: .*,$/m, `  updated: ${JSON.stringify(updated)},`).replace(/^  today: .*,$/m, `  today: ${JSON.stringify(today)},`);
  for (const [k, v] of Object.entries(set)) {
    const line = `    ${k}: ${JSON.stringify(v)},`;
    const multi = new RegExp(`^    ${k}: \\[\\n[\\s\\S]*?\\n    \\],$`, 'm'), single = new RegExp(`^    ${k}: .*,$`, 'm');
    if (multi.test(out)) out = out.replace(multi, line);
    else if (single.test(out)) out = out.replace(single, line);
    else out = out.replace(/^  now: \{$/m, `  now: {\n${line}`);
  }
  const K2 = load(out); // refuses to save a file that doesn't parse
  if (K2.today !== today || !K2.now.weather.length) throw new Error('content.js check failed');
  fs.writeFileSync(file, out);
  console.log(`now: ${updated} · weather ${set.weather ? set.weatherSrc : 'kept'} · wx alerts ${set.wxAlerts ? set.wxAlerts.length : set.wxAlerts === null ? 'unknown' : 'kept'} · park ${set.park ? set.park.length + ' alerts' : 'kept'}`);
})().catch(e => { console.error(e.message); process.exit(1); });
