// Market Report: rebuilds data.js from Zillow Research's free public CSVs and Freddie Mac's mortgage rate. No AI, no keys.
//   Sevierville, TN metro (= Sevier County): top/bottom-third home values, market heat index, inventory,
//   sales count (for months of supply), days to pending, median sale price.
//   Gatlinburg, Pigeon Forge, Sevierville: typical home value by bedroom count (only re-read when Zillow adds a month).
//   Freddie Mac 30-year fixed average (weekly).
// Runs every morning in feeds.yml. Zillow posts new monthly numbers around mid-month; the site picks them up the next morning.
// If a source fails, the last good numbers stay.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..'), file = path.join(root, 'data.js');
const Z = 'https://files.zillowstatic.com/research/public_csvs';
const METRO = 'Sevierville, TN', TOWNS = ['Gatlinburg', 'Pigeon Forge', 'Sevierville'];
const UA = 'Mozilla/5.0 (compatible; TheSmokiesBrief/1.0; +https://thesmokiesbrief.com)';

const load = () => { const c = { window: {} }; vm.runInNewContext(fs.readFileSync(file, 'utf8'), c); return c.window.DATA; };
const old = load();

// Reads a big CSV as a stream and keeps only the header and the rows `want(cols)` accepts.
async function rows(url, want, hint) {
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(180000) });
      if (!r.ok) { console.log(`${r.status} from ${url}`); continue; }
      const dec = new TextDecoder(); let buf = '', head = null; const out = [];
      for await (const chunk of r.body) {
        buf += dec.decode(chunk, { stream: true });
        let n;
        while ((n = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, n).replace(/\r$/, ''); buf = buf.slice(n + 1);
          if (head && hint && !line.includes(hint)) continue;
          const cols = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map(c => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"'));
          if (!head) head = cols; else if (want(cols)) out.push(cols);
        }
      }
      return { head, out };
    } catch (e) { console.log(`${e.name} from ${url}`); }
  }
  return null;
}
// one region's series as { 'YYYY-MM': number }
async function series(p, pick) {
  const t = await rows(`${Z}/${p}`, pick, METRO);
  if (!t || !t.out.length) return null;
  const r = t.out[0], s = {};
  t.head.forEach((h, i) => { if (/^\d{4}-\d{2}-\d{2}$/.test(h) && r[i] !== '') s[h.slice(0, 7)] = +r[i]; });
  return s;
}
const metro = c => c[2] === METRO;
const span = (s, from) => Object.keys(s).filter(k => k >= from).sort();

(async () => {
  const D = JSON.parse(JSON.stringify(old));
  const [top, bot, heat, inv, sales, dtp, sale] = await Promise.all([
    series('zhvi/Metro_zhvi_uc_sfrcondo_tier_0.67_1.0_sm_sa_month.csv', metro),
    series('zhvi/Metro_zhvi_uc_sfrcondo_tier_0.0_0.33_sm_sa_month.csv', metro),
    series('market_temp_index/Metro_market_temp_index_uc_sfrcondo_month.csv', metro),
    series('invt_fs/Metro_invt_fs_uc_sfrcondo_sm_month.csv', metro),
    series('sales_count_now/Metro_sales_count_now_uc_sfrcondo_month.csv', metro),
    series('med_doz_pending/Metro_med_doz_pending_uc_sfrcondo_sm_month.csv', metro),
    series('median_sale_price/Metro_median_sale_price_uc_sfrcondo_month.csv', metro)
  ]);
  let changed = false;
  if (top && bot) { const d = span(top, '2019-01').filter(k => k in bot); D.gap = { dates: d, top: d.map(k => Math.round(top[k])), bottom: d.map(k => Math.round(bot[k])) }; changed = true; }
  if (heat) { const d = span(heat, '2019-01'); D.heat = { dates: d, values: d.map(k => heat[k]) }; changed = true; }
  if (inv && sales) { const d = span(inv, '2019-01').filter(k => sales[k] > 0); D.mos = { dates: d, values: d.map(k => Math.round(inv[k] / sales[k] * 10) / 10) }; changed = true; }
  if (inv) D.inventory = span(inv, '2023-01').map(k => inv[k]);
  if (dtp) D.dtp = span(dtp, '2023-01').map(k => dtp[k]);
  if (sale) D.sale = span(sale, '2023-01').map(k => sale[k]);
  D.asof = [D.heat.dates.at(-1), D.gap.dates.at(-1), D.mos.dates.at(-1)].sort()[0];

  // price ladder: only when Zillow has a newer month than we have (these files are big)
  if (!D.ladderAsof || D.ladderAsof < D.asof) {
    const lad = {}; let asof = null, ok = true;
    for (const b of ['1', '2', '3', '4', '5']) {
      const t = await rows(`${Z}/zhvi/City_zhvi_bdrmcnt_${b}_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv`, c => c[5] === 'TN' && TOWNS.includes(c[2]), ',TN,');
      if (!t) { ok = false; break; }
      const dates = t.head.map((h, i) => [h, i]).filter(([h]) => /^\d{4}-\d{2}-\d{2}$/.test(h));
      for (const r of t.out) {
        const last = [...dates].reverse().find(([, i]) => r[i] !== ''); if (!last) continue;
        const [h, i] = last, prevH = `${+h.slice(0, 4) - 1}${h.slice(4, 7)}`, pi = dates.find(([d]) => d.startsWith(prevH));
        const v = +r[i], pv = pi && r[pi[1]] !== '' ? +r[pi[1]] : null;
        (lad[r[2]] = lad[r[2]] || {})[b] = { value: Math.round(v), yoy: pv ? Math.round((v / pv - 1) * 1000) / 10 : 0 };
        asof = h.slice(0, 7);
      }
    }
    if (ok && TOWNS.every(t => lad[t] && Object.keys(lad[t]).length === 5)) { D.ladder = Object.fromEntries(TOWNS.map(t => [t, lad[t]])); D.ladderAsof = asof; changed = true; }
    else console.log('Price ladder: kept last month');
  }

  // Freddie Mac 30-year fixed
  try {
    const r = await fetch('https://www.freddiemac.com/pmms/docs/PMMS_history.csv', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
    const last = (await r.text()).trim().split(/\r?\n/).reverse().find(l => /^\d+\/\d+\/\d{4},\d/.test(l));
    if (last) { const [d, v] = last.split(','); const [m, dd, y] = d.split('/'); D.rate = +v; D.rate_date = `${y}-${m.padStart(2, '0')}-${dd.padStart(2, '0')}`; changed = true; }
  } catch (e) { console.log('Freddie Mac rate: kept last value'); }

  if (!changed) { console.log('Market: no sources reachable; keeping data.js'); return; }
  const out = 'window.DATA=' + JSON.stringify(D) + ';\n';
  const c = { window: {} }; vm.runInNewContext(out, c); // refuse to save something that doesn't parse
  if (!c.window.DATA.gap.dates.length || !c.window.DATA.ladder.Gatlinburg) throw new Error('data.js check failed');
  fs.writeFileSync(file, out);
  const L = D.heat.values.at(-1), M = D.mos.values.at(-1);
  console.log(`market: as of ${D.asof} · heat ${L} · ${M} months of supply · ladder ${D.ladderAsof} · rate ${D.rate}% (${D.rate_date})`);
})().catch(e => { console.error(e.message); process.exit(1); });
