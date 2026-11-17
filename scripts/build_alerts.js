// Big weekend alerts: finds every big draw and convention, and sets an alert date 30 days before it starts.
// Writes:
//   data/big-weekends.json  - upcoming alerts (used by the site and by send_alerts.js)
//   data/big-weekends.ics   - calendar feed hosts can subscribe to once (webcal://thesmokiesbrief.com/data/big-weekends.ics)
// No AI, no accounts. Runs every morning in .github/workflows/feeds.yml.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(root, 'content.js'), 'utf8'), ctx);
const K = ctx.window.CONTENT;
const SITE = process.env.SITE_URL || 'https://thesmokiesbrief.com';
const LEAD = 30;                       // days of notice
const KINDS = ['big', 'conv'];         // holiday weekends, festivals that draw crowds, conventions

const day = s => new Date(s + 'T12:00:00Z');
const iso = d => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = day(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const today = process.env.TODAY || iso(new Date());
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = s => { const d = day(s); return `${MON[d.getUTCMonth()]} ${d.getUTCDate()}`; };
const range = (s, e) => {
  if (!e || e === s) return fmt(s);
  const a = day(s), b = day(e);
  return a.getUTCMonth() === b.getUTCMonth() ? `${fmt(s)}\u2013${b.getUTCDate()}` : `${fmt(s)}\u2013${fmt(e)}`;
};
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

const R = K.rates;
const alerts = K.events
  .filter(e => KINDS.includes(e.c) && e.d > today)
  .map(e => {
    const m = day(e.d).getUTCMonth();
    return {
      id: `${e.d}-${slug(e.t)}`,
      title: e.t,
      short: (e.sh || e.t).replace(/\s*\([^)]*\)\s*/g, ' ').trim(),
      start: e.d,
      end: e.e || e.d,
      dates: range(e.d, e.e),
      place: e.p || 'Smoky Mountains',
      kind: e.c,
      url: e.u || null,
      alert_on: addDays(e.d, -LEAD),
      month: MON[m],
      market: R ? { adr: R.adr[m], occ: R.occ[m], season: R.season[m], period: R.period } : null
    };
  })
  .filter(a => addDays(a.start, -10) >= today)   // too close to be useful once it's under 10 days out
  .sort((a, b) => a.start.localeCompare(b.start));

fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'data', 'big-weekends.json'), JSON.stringify({ updated: new Date().toISOString(), lead_days: LEAD, alerts }, null, 1));

// Calendar feed: one all-day reminder on each alert date
const esc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const fold = line => { const out = []; while (line.length > 74) { out.push(line.slice(0, 74)); line = ' ' + line.slice(74); } out.push(line); return out.join('\r\n'); };
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const ymd = s => s.replace(/-/g, '');
const ev = alerts.map(a => [
  'BEGIN:VEVENT',
  `UID:${a.id}@thesmokiesbrief.com`,
  `DTSTAMP:${stamp}`,
  `DTSTART;VALUE=DATE:${ymd(a.alert_on)}`,
  `DTEND;VALUE=DATE:${ymd(addDays(a.alert_on, 1))}`,
  `SUMMARY:${esc(`Price check: ${a.short} in 30 days`)}`,
  `DESCRIPTION:${esc(`${a.title}, ${a.dates} (${a.place}). Check your nightly rate and minimum stay for those dates before they book up.` + (a.market ? ` Average nightly rate in ${a.month} last year: $${a.market.adr}.` : '') + `\nMore: ${SITE}/#events`)}`,
  `URL:${a.url || SITE + '/#events'}`,
  'BEGIN:VALARM', 'TRIGGER:PT9H', 'ACTION:DISPLAY', `DESCRIPTION:${esc('Price check: ' + a.short)}`, 'END:VALARM',
  'END:VEVENT'
].map(fold).join('\r\n'));
const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Smokies big weekend alerts//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
  'X-WR-CALNAME:Smokies big weekend alerts', 'X-WR-CALDESC:A reminder 30 days before every big weekend in Gatlinburg\\, Pigeon Forge and Sevierville.',
  'REFRESH-INTERVAL;VALUE=DURATION:P1D', 'X-PUBLISHED-TTL:P1D', ...ev, 'END:VCALENDAR'].join('\r\n') + '\r\n';
fs.writeFileSync(path.join(root, 'data', 'big-weekends.ics'), ics);
console.log(`big-weekends: ${alerts.length} upcoming alerts; next: ${alerts.slice(0, 3).map(a => a.alert_on + ' ' + a.title).join(' | ')}`);
