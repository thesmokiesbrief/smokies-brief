// Rules Watch: reads city and county meeting agendas every morning and flags short-term rental items. No AI.
//   Gatlinburg city commission (city site PDFs), Pigeon Forge commission and planning (CivicClerk),
//   Sevierville aldermen and planning (Agenda Center PDFs), Sevier County commission (county site PDFs).
// Looks at agendas from the last 45 days and up to 30 days ahead. Needs `pdftotext` (poppler-utils).
// Saves data/rules.json and rewrites the Rules Watch block in index.html between the RULES markers.
// If a site can't be reached, that town keeps its last result and the page shows when it was checked.
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const dataPath = path.join(root, 'data', 'rules.json'), indexPath = path.join(root, 'index.html');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const TZ = 'America/New_York', BACK = 45, AHEAD = 30;

const STR = /short[- ]term rentals?|overnight rentals?|vacation rentals?|nightly rentals?|tourist residen\w*|transient (?:occupancy|lodging)|\bSTRs?\b|occupancy tax|hotel[- ]motel tax|airbnb|vrbo/i;
const ZON = /\brezon\w*|zoning (?:ordinance|map|amendment|regulations)|amend\w*[^.\n]{0,60}zoning|land use plan/i;

const now = new Date();
const etISO = d => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d).map(x => [x.type, x.value])); return `${p.year}-${p.month}-${p.day}`; };
const today = etISO(now);
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const md = s => { const [, m, d] = s.split('-').map(Number); return `${MON[m - 1]} ${d}`; };
const inWindow = d => d >= addDays(today, -BACK) && d <= addDays(today, AHEAD);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n) => s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n)).replace(/[,;:\s—-]+$/, '') + '…';
const ymd = (y, m, d) => `${y < 100 ? 2000 + y : y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
function dateIn(s) {
  let m = s.match(/(\d{1,2})[-._](\d{1,2})[-._](20\d{2}|\d{2})(?!\d)/); if (m) return ymd(+m[3], +m[1], +m[2]);
  m = s.match(/(\d{2})-(\d{2})-(\d{2})(?!\d)/); if (m) return ymd(+m[1], +m[2], +m[3]);
  m = s.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(20\d{2})/i); if (m) return ymd(+m[3], MONTHS[m[1].toLowerCase()], +m[2]);
  return null;
}

async function fetchRaw(url, asText = true) {
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(encodeURI(decodeURI(url)), { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
      if (r.ok) return asText ? await r.text() : Buffer.from(await r.arrayBuffer());
      console.log(`${r.status} from ${url.slice(0, 120)}`);
    } catch (e) { console.log(`${e.name} from ${url.slice(0, 120)}`); }
    await new Promise(r => setTimeout(r, 4000));
  }
  return null;
}
async function pdfText(url) {
  const buf = await fetchRaw(url, false); if (!buf) return null;
  const f = path.join(os.tmpdir(), 'sb-agenda.pdf'); fs.writeFileSync(f, buf);
  try { return execFileSync('pdftotext', [f, '-'], { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { console.log('pdftotext failed for ' + url.slice(0, 100)); return null; }
}
// one agenda item: the line with the match plus its neighbor, tidied up
function snippet(text, re) {
  const lines = text.split(/\r?\n/).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const i = lines.findIndex(l => re.test(l)); if (i < 0) return '';
  let s = lines[i]; if (s.length < 60 && lines[i + 1]) s += ' ' + lines[i + 1];
  return clip(s.replace(/^[\dA-Z]{1,3}[.)]\s*/, ''), 150);
}

// ----- sources: each returns [{ date, title, url, text }] -----
async function gatlinburg() {
  const parent = await fetchRaw('https://www.gatlinburgtn.gov/documents/gatlinburg-goverment/boards-and-committees/gatlinburg-city-commission/minutes-and-agendas/478917');
  if (!parent) return null;
  const y = today.slice(0, 4), ids = [];
  const KNOWN = { 2026: '23639541' }; // fallback if the index page hides the link
  for (const yr of [y, String(+y - 1)]) { const m = parent.match(new RegExp(`${yr}-city-commission-agendas/(\\d+)`)); if (m || KNOWN[yr]) ids.push([yr, m ? m[1] : KNOWN[yr]]); }
  console.log(`Gatlinburg: agenda folders ${ids.map(x => x.join(':')).join(', ') || 'none'}`);
  const out = [];
  for (const [yr, id] of ids) {
    const page = await fetchRaw(`https://www.gatlinburgtn.gov/documents/gatlinburg-goverment/boards-and-committees/gatlinburg-city-commission/minutes-and-agendas/${yr}-city-commission-agendas/${id}`);
    if (!page) continue;
    const pdfs = new Set(page.match(/https:\/\/files-backend\.assets\.thrillshare\.com\/[^"\\\s]+?\.pdf/g) || []);
    console.log(`Gatlinburg ${yr}: page ${page.length} bytes, ${pdfs.size} PDFs`);
    for (const u of pdfs) {
      const name = decodeURIComponent(u.split('/').pop()), d = dateIn(name);
      if (d && inWindow(d) && /agenda/i.test(name)) out.push({ date: d, title: 'City Commission agenda', url: u + '?disposition=inline' });
    }
  }
  return out;
}
async function pigeonForge() {
  const api = 'https://pigeonforgetn.api.civicclerk.com/v1';
  const raw = await fetchRaw(`${api}/Events?$orderby=startDateTime%20desc&$top=40`);
  if (!raw) return null;
  let v; try { v = JSON.parse(raw).value || []; } catch (e) { return null; }
  const out = [];
  for (const e of v) {
    const d = etISO(new Date(e.startDateTime));
    if (!inWindow(d) || /cancel/i.test(e.eventName)) continue;
    for (const f of (e.publishedFiles || []).filter(f => /agenda/i.test(f.type || ''))) {
      out.push({ date: d, title: e.eventName.replace(/\s+/g, ' '), url: `https://pigeonforgetn.portal.civicclerk.com/event/${e.id}/files/agenda/${f.fileId}`, textUrl: `${api}/Meetings/GetMeetingFileStream(fileId=${f.fileId},plainText=true)` });
    }
  }
  return out;
}
async function sevierville() {
  const page = await fetchRaw('https://www.seviervilletn.org/AgendaCenter');
  if (!page) return null;
  const out = [];
  const sections = page.split(/<h2[^>]*>/).slice(1);
  for (const sec of sections) {
    const body = sec.split('</h2>')[0].replace(/<[^>]+>/g, '').trim();
    if (!/aldermen|planning/i.test(body)) continue;
    for (const row of sec.match(/<tr[^>]*catAgendaRow[\s\S]*?<\/tr>/g) || []) {
      const link = (row.match(/href="(\/AgendaCenter\/ViewFile\/Agenda\/_(\d{2})(\d{2})(\d{4})-\d+)"/) || []);
      if (!link[1]) continue;
      const d = ymd(+link[4], +link[2], +link[3]);
      if (!inWindow(d)) continue;
      const t = row.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/^.*?20\d{2}\s*/, '').replace(/\(PDF\).*$/, '').trim();
      out.push({ date: d, title: t || body, url: 'https://www.seviervilletn.org' + link[1] });
    }
  }
  return out;
}
async function sevierCounty() {
  const base = 'https://www.seviercountytn.gov/government/county_officials/county_commissioners/county_commission_agenda.php';
  const page = await fetchRaw(base);
  if (!page) return null;
  const out = [];
  for (const m of page.matchAll(/href="([^"]+?\.pdf)(?:\?t=(\d{8}))?[^"]*"[^>]*>\s*Agenda\s*</gi)) {
    const name = decodeURIComponent(m[1].split('/').pop());
    const d = dateIn(name) || (m[2] ? ymd(+m[2].slice(0, 4), +m[2].slice(4, 6), +m[2].slice(6, 8)) : null);
    if (d && inWindow(d)) out.push({ date: d, title: 'County Commission agenda', url: new URL(m[1], base).href });
  }
  return out;
}
function tennessee() {
  // General Assembly convenes the second Tuesday in January and usually adjourns by late April
  const y = +today.slice(0, 4);
  const secondTue = yr => { const d = new Date(Date.UTC(yr, 0, 1)); while (d.getUTCDay() !== 2) d.setUTCDate(d.getUTCDate() + 1); d.setUTCDate(d.getUTCDate() + 7); return d.toISOString().slice(0, 10); };
  const open = secondTue(y), close = `${y}-04-30`;
  const inSession = today >= open && today <= close;
  return { cls: inSession ? 'watch' : 'ok', status: inSession ? 'Legislature in session · watch for rental bills' : `Legislature out of session until ${md(secondTue(today > close ? y + 1 : y))}`, url: 'https://wapp.capitol.tn.gov/apps/billsearch/BillSearchAdvanced.aspx', src: 'Bill search →' };
}

const TOWNS = [
  { key: 'gatlinburg', name: 'Gatlinburg', run: gatlinburg, home: 'https://www.gatlinburgtn.gov/documents/gatlinburg-goverment/boards-and-committees/gatlinburg-city-commission/minutes-and-agendas/478917' },
  { key: 'pigeonforge', name: 'Pigeon Forge', run: pigeonForge, home: 'https://pigeonforgetn.portal.civicclerk.com/' },
  { key: 'sevierville', name: 'Sevierville', run: sevierville, home: 'https://www.seviervilletn.org/AgendaCenter' },
  { key: 'county', name: 'Sevier County', run: sevierCounty, home: 'https://www.seviercountytn.gov/government/county_officials/county_commissioners/county_commission_agenda.php' }
];

(async () => {
  const prev = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath, 'utf8')) : { towns: {} };
  const result = { checked: now.toISOString(), towns: {} };
  for (const T of TOWNS) {
    let list = null;
    try { list = await T.run(); } catch (e) { console.log(`${T.name}: ${e.message}`); }
    // a town that meets every few weeks with nothing in 45 days usually means the page didn't load right
    if (list && !list.length && prev.towns[T.key] && (prev.towns[T.key].agendas || []).length) list = null;
    if (!list) { result.towns[T.key] = { ...(prev.towns[T.key] || {}), stale: true }; console.log(`${T.name}: unreachable, keeping last result`); continue; }
    list.sort((a, b) => b.date.localeCompare(a.date));
    const read = [];
    for (const a of list.slice(0, 6)) {
      const text = a.textUrl ? await fetchRaw(a.textUrl) : await pdfText(a.url);
      if (!text) continue;
      // only the agenda itself, not attached packets (ordinance tables mention every use type)
      const lines = text.split(/\r?\n/), end = lines.findIndex((l, i) => i > 10 && /^\s*[\dA-Z]{0,3}[.)]?\s*ADJOURN/i.test(l));
      const body = lines.slice(0, end > 0 ? end + 1 : 250).join('\n');
      read.push({ ...a, str: snippet(body, STR), zon: (body.match(new RegExp(ZON.source, 'gi')) || []).length });
    }
    const hit = read.find(a => a.str);
    const zon = read.filter(a => a.zon && a.date >= addDays(today, -14));
    const oldest = read.length ? read[read.length - 1].date : null;
    let r;
    if (hit) r = { cls: 'watch', status: `${md(hit.date)} agenda: ${hit.str}`, url: hit.url, src: 'Agenda →' };
    else if (read.length) r = { cls: 'ok', status: `No rental items on agendas since ${md(oldest)}${zon.length ? ` · zoning item on the ${md(zon[0].date)} agenda` : ''}`, url: read[0].url, src: 'Latest agenda →' };
    else r = { cls: 'ok', status: list.length ? 'Agendas posted but couldn\u2019t be read today' : `No agendas posted since ${md(addDays(today, -BACK))}`, url: T.home, src: 'Meetings →' };
    result.towns[T.key] = { ...r, checked: now.toISOString(), agendas: read.map(a => ({ date: a.date, title: a.title, url: a.url, str: a.str, zoning: a.zon })) };
    console.log(`${T.name}: ${list.length} agendas in window, ${read.length} read · ${r.status}`);
  }
  result.towns.tennessee = { ...tennessee(), checked: now.toISOString() };
  fs.writeFileSync(dataPath, JSON.stringify(result, null, 1) + '\n');

  const names = { gatlinburg: 'Gatlinburg', pigeonforge: 'Pigeon Forge', sevierville: 'Sevierville', county: 'Sevier County', tennessee: 'Tennessee' };
  const cards = Object.entries(names).map(([k, n]) => {
    const t = result.towns[k]; if (!t || !t.status) return '';
    return `      <a class="rule ${t.cls}" href="${esc(t.url)}" target="_blank" rel="noopener">
        <span class="rule-dot"></span><span class="rule-town">${n}</span>
        <span class="rule-status">${esc(t.status)}${t.stale && t.checked ? ` <em>(last checked ${md(etISO(new Date(t.checked)))})</em>` : ''}</span>
        <span class="rule-src">${t.src}</span>
      </a>`;
  }).filter(Boolean).join('\n');
  const tp = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).formatToParts(now).map(x => [x.type, x.value]));
  const note = `<p class="sec-note"><span class="upd">Checked daily</span> City and county meeting agendas, read for short-term rental items · last check ${tp.month} ${tp.day}, ${tp.hour}:${tp.minute} ${tp.dayPeriod === 'AM' ? 'a.m.' : 'p.m.'}</p>`;
  let html = fs.readFileSync(indexPath, 'utf8');
  const re = /(<!-- RULES:START -->)[\s\S]*?(<!-- RULES:END -->)/;
  if (!re.test(html)) throw new Error('missing RULES markers in index.html');
  html = html.replace(re, `$1\n    <div class="sec-head">\n      <h2 class="sec-title">Rules Watch</h2>\n      ${note}\n    </div>\n    <div class="rules-grid">\n${cards}\n    </div>\n    $2`);
  fs.writeFileSync(indexPath, html);
})().catch(e => { console.error(e.message); process.exit(1); });
