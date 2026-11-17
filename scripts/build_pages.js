// Builds the site's lasting, search-friendly pages from data the site already collects. No AI, no keys.
//   rules/            short-term rental rules by area (scripts/rules-facts.json + Rules Watch in data/rules.json)
//   market/           Sevier County cabin market report (data.js + content.js), plus one saved page per month
//   big-weekends/     big weekends to price for (data/big-weekends.json + content.js)
//   brief/            weekly archive: one page per week, frozen once the week is over
//   sitemap.xml       every indexable page, with the date it last changed
// Runs every morning in .github/workflows/feeds.yml after the market, rules and alerts steps.
// Pages are only rewritten when their content changes, so dates in the sitemap stay honest.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const SITE = 'https://thesmokiesbrief.com/';
global.window = {};
require(path.join(root, 'data.js'));
require(path.join(root, 'content.js'));
const D = window.DATA, C = window.CONTENT;
const read = (p, d) => { try { return JSON.parse(fs.readFileSync(path.join(root, p), 'utf8')); } catch { return d; } };
const RULES = read('data/rules.json', { towns: {} });
const FACTS = read('scripts/rules-facts.json', { areas: [] });
const BIG = read('data/big-weekends.json', { alerts: [] });
const HEAD = read('data/headlines.json', { items: [] });
const TODAY = C.today || new Date().toISOString().slice(0, 10);

// ---------- helpers ----------
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MON = MONTHS.map(m => m.slice(0, 3));
const ym = s => { const [y, m] = s.split('-'); return `${MONTHS[+m - 1]} ${y}`; };
const ymd = s => { const [y, m, d] = s.split('-'); return `${MONTHS[+m - 1]} ${+d}, ${y}`; };
const md = s => { const [, m, d] = s.split('-'); return `${MON[+m - 1]} ${+d}`; };
const usd = n => '$' + Math.round(n).toLocaleString('en-US');
const pct = (a, b) => b ? (a / b - 1) * 100 : 0;
const sgn = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + '%';
const upDown = v => v > 0.05 ? 'up' : v < -0.05 ? 'down' : 'flat';
const monthsBack = (s, n) => { const [y, m] = s.split('-').map(Number); const t = y * 12 + (m - 1) - n; return `${Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, '0')}`; };
const series = (start, arr) => { const o = {}; arr.forEach((v, i) => { o[monthsBack(start, -i)] = v; }); return o; };
const mondayOf = s => { const d = new Date(s + 'T12:00:00Z'); const k = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - k); return d.toISOString().slice(0, 10); };
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const ext = (href, text, cls = '') => `<a href="${esc(href)}" target="_blank" rel="noopener"${cls ? ` class="${cls}"` : ''}>${text}</a>`;

const BRAND_SVG = '<svg class="bm" viewBox="0 0 64 56" aria-hidden="true"><path d="M6 10 H10 V48 a3 3 0 0 1 -6 0 V12 a2 2 0 0 1 2 -2 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><rect x="10" y="4" width="50" height="47" rx="3" fill="none" stroke="currentColor" stroke-width="3.2"/><path d="M17 22.5 L26 14 L35 22.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.5 21 V30 H32.5 V21" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><rect x="24.2" y="24.5" width="3.6" height="5.5" fill="currentColor"/><rect x="39" y="14" width="15" height="3" rx="1.5" fill="currentColor"/><rect x="39" y="20.5" width="15" height="3" rx="1.5" fill="currentColor"/><rect x="39" y="27" width="15" height="3" rx="1.5" fill="currentColor"/><rect x="17" y="35" width="37" height="3" rx="1.5" fill="currentColor"/><rect x="17" y="41.5" width="37" height="3" rx="1.5" fill="currentColor"/></svg>';
const NAV = [['rules/', 'STR rules'], ['market/', 'Market report'], ['big-weekends/', 'Big weekends'], ['brief/', 'Weekly archive']];

function page({ file, title, desc, crumbs, body, ld = [] }) {
  const url = SITE + file.replace(/index\.html$/, '');
  const bc = { '@type': 'BreadcrumbList', itemListElement: [['The Smokies Brief', SITE], ...crumbs].map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: u.startsWith('http') ? u : SITE + u })) };
  const graph = { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', '@id': url, url, name: title, description: desc, inLanguage: 'en-US', isPartOf: { '@id': SITE + '#website' }, publisher: { '@id': SITE + '#org' } }, bc, ...ld] };
  const cur = file.split('/')[0] + '/';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="icon" href="/img/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · The Smokies Brief</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#1F3329">
<meta property="og:type" content="article">
<meta property="og:site_name" content="The Smokies Brief">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}img/hero.webp">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(graph)}</script>
<link rel="preconnect" href="https://api.fontshare.com">
<link href="https://api.fontshare.com/v2/css?f[]=zodiak@400,500,700&f[]=satoshi@400,500,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="/pages.css">
</head>
<body>
<header class="masthead" style="position:static"><div class="wrap mast-in"><a href="/" class="wordmark wordmark-sm" aria-label="The Smokies Brief home"><span class="brand">${BRAND_SVG}<span class="bt">The Smokies Brief</span></span></a><nav class="pg-nav" aria-label="Guides">${NAV.map(([h, t]) => `<a href="/${h}"${h === cur ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav></div></header>
<main class="wrap pg">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a>${crumbs.map(([n, u], i) => i === crumbs.length - 1 ? `<span aria-current="page">${esc(n)}</span>` : `<a href="/${u}">${esc(n)}</a>`).join('')}</nav>
${body}
<aside class="pg-sub">
  <div><p class="kicker">Free every Monday</p><h2>Get the Smokies Brief in your inbox.</h2><p>Rules, numbers and news for Smoky Mountain cabin owners, in one short email.</p></div>
  <a class="btn btn-ember" href="/#subscribe">Sign up free</a>
</aside>
</main>
<footer class="pg-foot"><div class="wrap pg-foot-in">
  <nav aria-label="More from the Brief"><a href="/">Today's Brief</a>${NAV.map(([h, t]) => `<a href="/${h}">${t}</a>`).join('')}<a href="/checklists.html">Seasonal checklists</a><a href="/privacy.html">Privacy</a></nav>
  <p>Independent news for Smoky Mountain cabin owners and investors. Published by The Smokies Brief by Weak Things, LLC. Market data provided by Zillow Group. Mortgage rate: Freddie Mac. Nightly rates: AirROI.</p>
</div></footer>
</body>
</html>
`;
}

// ---------- writing ----------
const written = []; // [file, changedDate]
const lastmodPath = path.join(root, 'data', 'pages-lastmod.json');
const lastmod = read('data/pages-lastmod.json', {});
function out(file, html, { freeze = false } = {}) {
  const p = path.join(root, file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const old = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
  if (old !== null && freeze) { written.push(file); return; }
  if (old !== html) { fs.writeFileSync(p, html); lastmod[file] = TODAY; }
  if (!lastmod[file]) lastmod[file] = TODAY;
  written.push(file);
}

// ---------- rules ----------
const watchOf = key => RULES.towns?.[key] || null;
const checkedOn = w => w?.checked ? ymd(w.checked.slice(0, 10)) : null;
function watchBox(key, name) {
  const w = watchOf(key);
  if (!w) return '';
  const rows = (w.agendas || []).slice(0, 6).map(a => `<tr><td>${esc(md(a.date))}</td><td>${ext(a.url, esc(a.title))}</td><td>${a.str ? `<b class="flag">Rental item: ${esc(a.str)}</b>` : 'No rental items'}${a.zoning ? ` · ${a.zoning} zoning item${a.zoning > 1 ? 's' : ''}` : ''}</td></tr>`).join('');
  return `<section class="pg-sec watch">
  <h2>Rules Watch: ${esc(name)} meetings</h2>
  <p class="watch-status ${w.cls === 'ok' ? 'ok' : 'alert'}">${esc(w.status)}</p>
  ${rows ? `<table class="pg-table"><thead><tr><th>Date</th><th>Agenda</th><th>What we found</th></tr></thead><tbody>${rows}</tbody></table>` : ''}
  <p class="pg-note">We read every ${esc(name)} meeting agenda each morning and flag short-term rental items. Last checked ${esc(checkedOn(w) || '')}.</p>
</section>`;
}
const areas = FACTS.areas;
for (const a of areas) {
  const body = `<header class="pg-head">
  <p class="kicker">Short-term rental rules</p>
  <h1>${esc(a.title)}</h1>
  <p class="pg-lede">${esc(a.lede)}</p>
  <p class="pg-meta">Facts checked against official sources on ${esc(ymd(FACTS.verified))}. Meeting agendas checked every morning.</p>
</header>
<section class="pg-cards" aria-label="At a glance">
  <div><span>Permit</span><b>${esc(a.permit)}</b></div>
  <div><span>Cost</span><b>${esc(a.fee)}</b></div>
  <div><span>Inspection</span><b>${esc(a.inspection)}</b></div>
  <div><span>Renewal</span><b>${esc(a.renewal)}</b></div>
</section>
<section class="pg-sec">
  <h2>What ${esc(a.name)} requires</h2>
  <dl class="facts">${a.facts.map(([k, v, s]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)} <a class="src" href="${esc(a.sources[s][1])}" target="_blank" rel="noopener">Source</a></dd></div>`).join('')}</dl>
  ${a.note ? `<p class="pg-callout">${esc(a.note)}</p>` : ''}
  <p class="pg-cta">${ext(a.apply[1], `Go to the ${esc(a.apply[0])} →`, 'btn btn-sm')}</p>
</section>
${watchBox(a.watch, a.name)}
<section class="pg-sec">
  <h2>Sources</h2>
  <ul class="srcs">${a.sources.map(([n, u]) => `<li>${ext(u, esc(n))}</li>`).join('')}</ul>
  <p class="pg-note">This page is a plain-language summary, not legal advice. Rules change, so confirm with the office before you buy, build or apply.</p>
</section>
<section class="pg-sec">
  <h2>Rules in other parts of Sevier County</h2>
  <ul class="pg-links">${areas.filter(b => b !== a).map(b => `<li><a href="/rules/${b.slug}.html"><b>${esc(b.short)}</b><span>${esc(b.permit)}</span></a></li>`).join('')}</ul>
</section>`;
  out(`rules/${a.slug}.html`, page({ file: `rules/${a.slug}.html`, title: a.title, desc: a.desc, crumbs: [['STR rules', 'rules/'], [a.short, `rules/${a.slug}.html`]], body }));
}
{
  const tn = watchOf('tennessee');
  const body = `<header class="pg-head">
  <p class="kicker">Short-term rental rules</p>
  <h1>Sevier County short-term rental rules, by area</h1>
  <p class="pg-lede">The same cabin can face different rules depending on which side of a city line it sits on. Gatlinburg, Pigeon Forge and Sevierville each run their own permits. Everything outside city limits answers to Sevier County. Find your area, then check the details.</p>
  <p class="pg-meta">Facts checked against official sources on ${esc(ymd(FACTS.verified))}. Meeting agendas checked every morning.</p>
</header>
<section class="pg-sec">
  <h2>Compare the areas</h2>
  <div class="tbl-wrap"><table class="pg-table cmp"><thead><tr><th>Area</th><th>Permit</th><th>Cost</th><th>Inspection</th><th>Rules Watch</th></tr></thead><tbody>
  ${areas.map(a => { const w = watchOf(a.watch); return `<tr><th scope="row"><a href="/rules/${a.slug}.html">${esc(a.short)}</a></th><td>${esc(a.permit)}</td><td>${esc(a.fee)}</td><td>${esc(a.inspection)}</td><td>${w ? `<span class="dot ${w.cls === 'ok' ? 'ok' : 'alert'}"></span>${esc(w.status)}` : '—'}</td></tr>`; }).join('')}
  </tbody></table></div>
</section>
<section class="pg-sec">
  <h2>Which rules apply to your cabin?</h2>
  <ol class="steps">
    <li><b>Check the city line, not the mailing address.</b> A Sevierville or Pigeon Forge mailing address can sit outside city limits. Sevierville has a ${ext('https://www.seviervilletn.org/467/Short-Term-Rentals', 'city limits verification map')}.</li>
    <li><b>Inside a city:</b> follow that city's permit rules, get a city business license and a county business license, and pay lodging tax to the city. ${ext('https://www.seviercountytn.gov/government/county_officials/sevier_county_clerk/business_license.php', 'Sevier County Clerk')}</li>
    <li><b>Outside city limits:</b> get the county's yearly Fire Marshal permit, a county business license, and pay lodging tax to the County Trustee.</li>
    <li><b>Buying a rental?</b> Ask whether the current permit transfers to you. In Pigeon Forge's R-1 zone, it doesn't.</li>
  </ol>
</section>
${tn ? `<section class="pg-sec"><h2>Tennessee</h2><p class="watch-status ${tn.cls === 'ok' ? 'ok' : 'alert'}">${esc(tn.status)}</p><p class="pg-note">State bills that could affect short-term rentals are checked every morning during session. ${ext(tn.url, 'Tennessee bill search')}</p></section>` : ''}`;
  out('rules/index.html', page({ file: 'rules/index.html', title: 'Sevier County short-term rental rules by area', desc: 'Compare short-term rental permits, fees and inspections in Gatlinburg, Pigeon Forge, Sevierville and unincorporated Sevier County, with meeting agendas checked every morning.', crumbs: [['STR rules', 'rules/']], body }));
}

// ---------- market ----------
function marketBody(asof) {
  const G = D.gap, H = D.heat, M = D.mos;
  const at = (s, k) => { const i = s.dates.indexOf(k); return i < 0 ? null : i; };
  const gi = at(G, asof), gy = at(G, monthsBack(asof, 12));
  const top = G.top[gi], bot = G.bottom[gi];
  const topY = gy != null ? pct(top, G.top[gy]) : null, botY = gy != null ? pct(bot, G.bottom[gy]) : null;
  const inv = series('2023-01', D.inventory), dtp = series('2023-01', D.dtp), sale = series('2023-01', D.sale);
  const saleM = Object.keys(sale).filter(k => k <= asof).sort().at(-1);
  const heat = H.values[at(H, asof)], heatY = H.values[at(H, monthsBack(asof, 12))];
  const mos = M.values[at(M, asof)], mosY = M.values[at(M, monthsBack(asof, 12))];
  const lbl = heat < 45 ? "buyer's market" : heat > 55 ? "seller's market" : 'balanced market';
  const card = (k, v, sub) => `<div><span>${k}</span><b>${v}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
  const yo = v => v == null ? '' : `${sgn(v)} from a year ago`;
  const invY = inv[monthsBack(asof, 12)], dtpY = dtp[monthsBack(asof, 12)], saleY = sale[monthsBack(saleM, 12)];
  const lad = D.ladder;
  const towns = Object.keys(lad || {});
  const R = C.rates || {};
  const lines = [
    `The typical higher-priced home in Sevier County was worth ${usd(top)} in ${ym(asof)}, ${upDown(topY)} ${topY != null ? Math.abs(topY).toFixed(1) + '%' : ''} from a year earlier.`,
    `There were ${inv[asof]?.toLocaleString('en-US') ?? '—'} homes for sale${invY ? `, ${upDown(pct(inv[asof], invY))} ${Math.abs(pct(inv[asof], invY)).toFixed(0)}% from a year earlier` : ''}, and about ${mos} months of supply.`,
    `Zillow's market heat index read ${heat}, which points to a ${lbl}.`
  ];
  return { top, html: `<section class="pg-sec">
  <p class="pg-summary">${lines.map(esc).join(' ')}</p>
  <div class="pg-stats">
    ${card('Typical value, higher-priced homes', usd(top), yo(topY))}
    ${card('Typical value, lower-priced homes', usd(bot), yo(botY))}
    ${card(`Median sale price (${MON[+saleM.slice(5) - 1]})`, sale[saleM] ? usd(sale[saleM]) : '—', saleY ? yo(pct(sale[saleM], saleY)) : '')}
    ${card('Homes for sale', inv[asof]?.toLocaleString('en-US') ?? '—', invY ? yo(pct(inv[asof], invY)) : '')}
    ${card('Months of supply', mos ?? '—', mosY != null ? `${mosY} a year ago` : '')}
    ${card('Days to pending', dtp[asof] ?? '—', dtpY ? `${dtpY} a year ago` : '')}
    ${card('Market heat index', heat ?? '—', `${heatY != null ? heatY + ' a year ago · ' : ''}50 is balanced`)}
    ${card('30-year mortgage rate', D.rate ? D.rate.toFixed(2) + '%' : '—', D.rate_date ? `Freddie Mac, week of ${md(D.rate_date)}` : '')}
  </div>
  <p class="pg-note">Higher-priced and lower-priced homes are the top and bottom thirds of the market. Sevierville metro (all of Sevier County), single-family homes and condos. Source: ${ext('https://www.zillow.com/research/data/', 'Zillow Research')}.</p>
</section>
${towns.length ? `<section class="pg-sec">
  <h2>Typical home value by bedrooms</h2>
  <div class="tbl-wrap"><table class="pg-table num"><thead><tr><th>Bedrooms</th>${towns.map(t => `<th>${esc(t)}</th>`).join('')}</tr></thead><tbody>
  ${['1', '2', '3', '4', '5'].map(b => `<tr><th scope="row">${b === '5' ? '5+' : b}</th>${towns.map(t => { const c = lad[t][b]; return `<td>${c ? `${usd(c.value)} <small class="${c.yoy < 0 ? 'neg' : 'pos'}">${sgn(c.yoy)}</small>` : '—'}</td>`; }).join('')}</tr>`).join('')}
  </tbody></table></div>
  <p class="pg-note">Middle third of homes in each city, ${esc(ym(D.ladderAsof || asof))}, with the change from a year earlier. Source: Zillow Research.</p>
</section>` : ''}
${R.adr ? `<section class="pg-sec">
  <h2>Nightly rate and occupancy by month</h2>
  <div class="tbl-wrap"><table class="pg-table num"><thead><tr><th>Month</th>${R.months.map(m => `<th>${m}</th>`).join('')}</tr></thead><tbody>
  <tr><th scope="row">Average nightly rate</th>${R.adr.map(v => `<td>${usd(v)}</td>`).join('')}</tr>
  <tr><th scope="row">Occupancy</th>${R.occ.map(v => `<td>${Math.round(v)}%</td>`).join('')}</tr>
  <tr><th scope="row">Season</th>${R.season.map(v => `<td>${esc(v)}</td>`).join('')}</tr>
  </tbody></table></div>
  <p class="pg-note">Sevier County, all active Airbnb listings, ${esc(R.period)}. Source: ${ext('https://www.airroi.com/airbnb-data/united-states/tennessee/sevier-county', 'AirROI')}. Want to know how many booked nights cover your mortgage? Use the <a href="/#tools">free calculator on the homepage</a>.</p>
</section>` : ''}` };
}
{
  const asof = D.asof;
  const mb = marketBody(asof);
  const archFile = `market/${asof}.html`;
  const archTitle = `Sevier County cabin market report, ${ym(asof)}`;
  out(archFile, page({ file: archFile, title: archTitle, desc: `Home values, sale prices, inventory, months of supply and nightly rates for Sevier County, Tennessee in ${ym(asof)}.`, crumbs: [['Market report', 'market/'], [ym(asof), archFile]], body: `<header class="pg-head"><p class="kicker">Monthly market report</p><h1>${esc(archTitle)}</h1><p class="pg-meta">Numbers as of ${esc(ym(asof))}. Saved when Zillow published them.</p></header>${mb.html}` }), { freeze: true });
  const months = fs.readdirSync(path.join(root, 'market')).filter(f => /^\d{4}-\d{2}\.html$/.test(f)).map(f => f.slice(0, 7)).sort().reverse();
  const body = `<header class="pg-head">
  <p class="kicker">Updated monthly</p>
  <h1>Sevier County cabin market report</h1>
  <p class="pg-lede">Home values, sales, supply and nightly rates for Gatlinburg, Pigeon Forge, Sevierville and the rest of Sevier County. New numbers arrive each month when Zillow publishes them, and every month is saved below.</p>
  <p class="pg-meta">Latest numbers: ${esc(ym(asof))}. Page checked ${esc(ymd(TODAY))}.</p>
</header>
${mb.html}
<section class="pg-sec">
  <h2>Past reports</h2>
  <ul class="pg-links">${months.map(m => `<li><a href="/market/${m}.html"><b>${esc(ym(m))}</b><span>Sevier County cabin market report</span></a></li>`).join('')}</ul>
</section>`;
  out('market/index.html', page({ file: 'market/index.html', title: 'Sevier County cabin market report', desc: 'Monthly Sevier County, Tennessee home values, median sale price, inventory, months of supply, days to pending and Airbnb nightly rates, from Zillow Research and AirROI.', crumbs: [['Market report', 'market/']], body }));
  months.forEach(m => written.includes(`market/${m}.html`) || written.push(`market/${m}.html`));
}

// ---------- big weekends ----------
{
  const al = (BIG.alerts || []).filter(a => a.end >= TODAY).sort((a, b) => a.start.localeCompare(b.start));
  const spans = (C.spans || []).filter(s => s.e >= TODAY);
  const kind = k => ({ conv: 'Convention', fest: 'Festival', big: 'Big draw', race: 'Race', show: 'Car show' }[k] || 'Event');
  const body = `<header class="pg-head">
  <p class="kicker">For pricing and minimum stays</p>
  <h1>Big weekends to price for in the Smokies</h1>
  <p class="pg-lede">Conventions, festivals and big draws that fill Gatlinburg, Pigeon Forge and Sevierville cabins. Each one has a date to review your rates and minimum stays, ${BIG.lead_days || 30} days before it starts, plus the typical nightly rate and occupancy for that month.</p>
  <p class="pg-meta">Updated every morning. Last checked ${esc(ymd(TODAY))}.</p>
</header>
<section class="pg-sec">
  <h2>Coming up</h2>
  ${al.length ? `<div class="tbl-wrap"><table class="pg-table bw"><thead><tr><th>Dates</th><th>Event</th><th>Where</th><th>Review rates by</th><th>That month</th></tr></thead><tbody>
  ${al.map(a => `<tr><td><b>${esc(a.dates)}</b></td><td>${ext(a.url, esc(a.title))}<small>${kind(a.kind)}</small></td><td>${esc(a.place)}</td><td>${esc(md(a.alert_on))}${a.alert_on <= TODAY ? ' <small class="flag">Review now</small>' : ''}</td><td>${a.market ? `${usd(a.market.adr)} avg rate · ${Math.round(a.market.occ)}% occupied · ${esc(a.market.season)} season` : '—'}</td></tr>`).join('')}
  </tbody></table></div>` : '<p>No big weekends listed right now. Check back soon.</p>'}
  <p class="pg-note">Month rates and occupancy: Sevier County Airbnb listings, ${esc(C.rates?.period || '')}. Source: AirROI.</p>
</section>
${spans.length ? `<section class="pg-sec">
  <h2>Longer seasons</h2>
  <ul class="pg-links">${spans.map(s => `<li><a href="${esc(s.u)}" target="_blank" rel="noopener"><b>${esc(s.t)}</b><span>${esc(md(s.s))} to ${esc(md(s.e))}${s.e.slice(0, 4) !== s.s.slice(0, 4) ? ', ' + s.e.slice(0, 4) : ''}</span></a></li>`).join('')}</ul>
</section>` : ''}
<section class="pg-sec">
  <h2>Get a reminder</h2>
  <p>Add every big weekend to your calendar once, with the review date built in: <a href="webcal://thesmokiesbrief.com/data/big-weekends.ics">subscribe to the calendar</a>. Or <a href="/#subscribe">sign up for the free email alert</a> that arrives ${BIG.lead_days || 30} days before each one.</p>
</section>`;
  out('big-weekends/index.html', page({ file: 'big-weekends/index.html', title: 'Big weekends to price for in the Smokies', desc: 'Upcoming conventions, festivals and big draws in Pigeon Forge, Gatlinburg and Sevierville, with a date to review cabin rates and the typical nightly rate for that month.', crumbs: [['Big weekends', 'big-weekends/']], body, ld: al.slice(0, 20).map(a => ({ '@type': 'Event', name: a.title, startDate: a.start, endDate: a.end, eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', eventStatus: 'https://schema.org/EventScheduled', location: { '@type': 'Place', name: a.place, address: { '@type': 'PostalAddress', addressRegion: 'TN', addressCountry: 'US', addressLocality: /gatlinburg/i.test(a.place) ? 'Gatlinburg' : /sevierville/i.test(a.place) ? 'Sevierville' : 'Pigeon Forge' } }, url: a.url })) }));
}

// ---------- weekly archive ----------
{
  const wk = mondayOf(TODAY), end = addDays(wk, 6);
  const file = `brief/${wk}.html`;
  const items = (HEAD.items || []).filter(h => h.d >= wk && h.d <= end).sort((a, b) => (b.w || 0) - (a.w || 0) || b.at.localeCompare(a.at)).slice(0, 10);
  const week = (C.now?.week || []);
  const upcoming = (BIG.alerts || []).filter(a => a.start >= wk && a.start <= addDays(wk, 45)).slice(0, 6);
  const W = RULES.towns || {};
  const mb = D.gap ? { top: D.gap.top.at(-1), asof: D.asof } : null;
  const title = `The Smokies Brief, week of ${ymd(wk)}`;
  const body = `<header class="pg-head">
  <p class="kicker">Weekly archive</p>
  <h1>${esc(title)}</h1>
  <p class="pg-meta">${esc(ymd(wk))} to ${esc(ymd(end))}. ${TODAY <= end ? 'This week is still in progress and updates every morning.' : 'Saved at the end of the week.'}</p>
</header>
${week.length ? `<section class="pg-sec"><h2>This week at a glance</h2><div class="pg-stats">${week.map(([v, k]) => `<div><b>${esc(v)}</b><small>${esc(k)}</small></div>`).join('')}</div></section>` : ''}
${items.length ? `<section class="pg-sec"><h2>Top Smokies stories</h2><ul class="pg-news">${items.map(h => `<li>${ext(h.u, esc(h.t))}<small>${esc(h.src)} · ${esc(md(h.d))}${h.tag ? ' · ' + esc(h.tag) : ''}</small>${h.dek ? `<p>${esc(h.dek)}</p>` : ''}</li>`).join('')}</ul><p class="pg-note">Headlines link to their original publishers.</p></section>` : ''}
<section class="pg-sec"><h2>Rules Watch</h2><ul class="pg-links">${[['gatlinburg', 'Gatlinburg', 'rules/gatlinburg.html'], ['pigeonforge', 'Pigeon Forge', 'rules/pigeon-forge.html'], ['sevierville', 'Sevierville', 'rules/sevierville.html'], ['county', 'Sevier County', 'rules/sevier-county.html'], ['tennessee', 'Tennessee', 'rules/']].filter(([k]) => W[k]).map(([k, n, u]) => `<li><a href="/${u}"><b>${n}</b><span>${esc(W[k].status)}</span></a></li>`).join('')}</ul></section>
${upcoming.length ? `<section class="pg-sec"><h2>Big weekends in the next six weeks</h2><ul class="pg-links">${upcoming.map(a => `<li><a href="/big-weekends/"><b>${esc(a.dates)}: ${esc(a.title)}</b><span>${esc(a.place)} · review rates by ${esc(md(a.alert_on))}</span></a></li>`).join('')}</ul></section>` : ''}
${mb ? `<section class="pg-sec"><h2>Market</h2><p>Typical higher-priced home value in Sevier County: <b>${usd(mb.top)}</b> (${esc(ym(mb.asof))}). 30-year mortgage rate: <b>${D.rate?.toFixed(2)}%</b>. <a href="/market/">Full market report →</a></p></section>` : ''}`;
  out(file, page({ file, title, desc: `Smokies cabin owner news, Rules Watch, big weekends and market numbers for the week of ${ymd(wk)}.`, crumbs: [['Weekly archive', 'brief/'], [`Week of ${ymd(wk)}`, file]], body }));
  const weeks = fs.readdirSync(path.join(root, 'brief')).filter(f => /^\d{4}-\d{2}-\d{2}\.html$/.test(f)).map(f => f.slice(0, 10)).sort().reverse();
  weeks.forEach(w => written.includes(`brief/${w}.html`) || written.push(`brief/${w}.html`));
  out('brief/index.html', page({ file: 'brief/index.html', title: 'The Smokies Brief weekly archive', desc: 'Every week of The Smokies Brief: Smoky Mountain cabin owner news, Rules Watch, big weekends and market numbers.', crumbs: [['Weekly archive', 'brief/']], body: `<header class="pg-head"><p class="kicker">Weekly archive</p><h1>The Smokies Brief, every week</h1><p class="pg-lede">News, rules and numbers for Smoky Mountain cabin owners, saved one week at a time.</p></header><section class="pg-sec"><ul class="pg-links">${weeks.map(w => `<li><a href="/brief/${w}.html"><b>Week of ${esc(ymd(w))}</b><span>${w === wk ? 'This week, updated every morning' : 'Saved'}</span></a></li>`).join('')}</ul></section>` }));
}

// ---------- sitemap ----------
{
  const base = [['', 'index.html'], ['checklists.html', 'checklists.html'], ['cards.html', 'cards.html'], ['posts.html', 'posts.html'], ['privacy.html', 'privacy.html'], ['downloads/smokies-seasonal-checklists.pdf'], ['downloads/smokies-winter-guest-guide.pdf']];
  base.forEach(([u]) => { const k = u || 'index.html'; if (!lastmod[k]) lastmod[k] = TODAY; });
  const urls = base.map(([u]) => [SITE + u, lastmod[u || 'index.html']]);
  for (const f of [...new Set(written)].sort()) urls.push([SITE + f.replace(/index\.html$/, ''), lastmod[f] || TODAY]);
  lastmod['index.html'] = TODAY; // the homepage changes every day
  urls[0][1] = TODAY;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, d]) => `  <url><loc>${u}</loc>${d ? `<lastmod>${d}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(root, 'sitemap.xml'), xml);
  fs.writeFileSync(lastmodPath, JSON.stringify(lastmod, null, 1) + '\n');
  console.log(`Pages: ${[...new Set(written)].length}. Sitemap: ${urls.length} URLs.`);
}
