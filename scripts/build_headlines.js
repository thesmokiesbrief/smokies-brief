// Daily (every two hours) Smokies headlines from local news RSS feeds. No AI, no keys.
// 1. Reads each feed, keeps stories about Sevier County and the Smokies, skips crime and tragedy.
// 2. Saves a rolling 30-day list in data/headlines.json (so stories from fast-moving feeds aren't lost).
// 3. Rewrites the Top stories and Latest headlines blocks in index.html between the HEADLINES markers.
// Headlines are shown as published and link straight to the original story.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const storePath = path.join(root, 'data', 'headlines.json'), indexPath = path.join(root, 'index.html');
const UA = 'Mozilla/5.0 (compatible; TheSmokiesBrief/1.0; +https://thesmokiesbrief.com)';
const TZ = 'America/New_York', KEEP_DAYS = 30, TOP_DAYS = 7, LIST_N = 12;

// local: true = every story in the feed is about the area (still filtered for crime/tragedy)
const SOURCES = [
  { src: 'WATE', url: 'https://www.wate.com/news/sevier-county-news/feed/', local: true },
  { src: 'WATE', url: 'https://www.wate.com/news/smoky-mountains/feed/' },
  { src: 'WVLT', url: 'https://www.wvlt.tv/arc/outboundfeeds/rss/?outputType=xml' },
  { src: 'WBIR', url: 'https://www.wbir.com/feeds/syndication/rss/news/local' },
  { src: 'Smokies.LIVE', url: 'https://smokies.live/feed/' },
  { src: 'National Park Service', url: 'https://www.nps.gov/feeds/getNewsRSS.htm?id=grsm', local: true, maxDays: 14 }
];

const PLACE = /\b(gatlinburg|pigeon forge|sevierville|sevier county|sevier|wears valley|pittman center|kodak|seymour|smokies|smoky mountains?|great smoky|dollywood|cades cove|newfound gap|ober|anakeesta|townsend|cosby|parkway|the island|douglas lake|english mountain|kuwohi|le ?conte)\b/i;
const SKIP = /\b(last seen|search(es|ing)? for|rescue\w*|accused|fraud|theft|killed|kills|dead|death|dies|died|deceased|fatal|crash|charged|charges|arrest\w*|murder\w*|shoot\w*|shot|stabb\w*|missing|robbery|robbed|dui|sentenc\w*|indict\w*|abuse|assault\w*|inmate|overdose|homicide|suspect|police chase|pursuit|court|trial|jail|prison|body found|drown\w*|vols|football|basketball|baseball|softball|volleyball|soccer|playoff\w*|touchdown|sec |kyle field|parker mccollum|celebrity|lottery)\b/i;

// first match wins; weight decides Top stories
const TAGS = [
  ['Rules', 10, /\b(short-term rentals?|vacation rentals?|overnight rentals?|strs?|ordinances?|zoning|rezon\w*|occupancy tax|hotel[- ]motel tax|property tax\w*|tax rate|planning commission|county commission\w*|board of (mayor|commissioners)|aldermen|moratorium|regulat\w*|annex\w*|hoa|poa|dues|building codes?|fire codes?)\b/i],
  ['Platforms', 9, /\b(airbnb|vrbo|booking\.com|expedia|evolve|vacasa)\b/i],
  ['The Numbers', 9, /\b(occupancy|bookings?|revenue|sales tax|visitors? (spent|spending)|record|percent|%|home prices?|real estate|housing market|inventory|appraisal|property values?|economic impact)\b/i],
  ['New Supply', 8, /\b(develop\w*|site plan|construction|groundbreaking|new hotel|resort|subdivision|water park|approv\w* .*(project|plan)|opening|opens|to open|coming to|expansion|expand\w*)\b/i],
  ['Tourism', 7, /\b(tourism|tourists?|visitors?|travel\w*|flights?|airport|allegiant|crowds?|busiest|holiday weekend|thanksgiving|spring break)\b/i],
  ['Roads', 6, /\b(road|roads|closure|closed|closes|traffic|lane|i-40|interstate|u\.s\. 441|us 441|highway|bridge|detour|repaving|parkway)\b/i],
  ['Weather', 6, /\b(snow\w*|forecast|storm\w*|rain\w*|wind\w*|freez\w*|ice|icy|cold|heat|flood\w*|fire danger|burn ban|drought|tornado)\b/i],
  ['Safety', 5, /\b(wildfires?|fire department|firefight\w*|emergency|911|drone program|evacuat\w*|power outage|outage)\b/i],
  ['Events', 4, /\b(festival|winterfest|concert|parade|lights|christmas|holiday\w*|market|celebrat\w*|tree lighting|fireworks|show)\b/i],
  ['Attractions', 3, /\b(dollywood|aquarium|ober|anakeesta|the island|skypark|attraction\w*|coaster|ride|museum|skating)\b/i],
  ['Park', 5, /\b(national park|nps|trail\w*|cades cove|elk|bears?|hik\w*|campground\w*|ranger\w*)\b/i],
  ['Jobs', 3, /\b(jobs?|workforce|hiring|employ\w*|wages?)\b/i]
];
const TOWN = [['Gatlinburg', /gatlinburg/i], ['Pigeon Forge', /pigeon forge/i], ['Sevierville', /sevierville/i], ['Sevier County', /sevier/i], ['Park', /great smoky|national park/i]];

const ent = s => String(s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const strip = s => ent(ent(s)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n) => s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n)).replace(/[,;:\s]+$/, '') + '…';
const etDate = d => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d).map(x => [x.type, x.value])); return `${p.year}-${p.month}-${p.day}`; };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const md = iso => { const [, m, d] = iso.split('-').map(Number); return `${MON[m - 1]} ${d}`; };
const key = u => u.replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase();
const words = t => new Set(t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 3));
const similar = (a, b) => { const A = words(a), B = words(b); if (!A.size || !B.size) return false; let n = 0; A.forEach(w => B.has(w) && n++); return n / Math.min(A.size, B.size) >= 0.7; };

function tagOf(text) {
  for (const [name, w, re] of TAGS) if (re.test(text)) return [name, w];
  for (const [name, re] of TOWN) if (re.test(text)) return [name, 2];
  return ['Local', 1];
}

async function get(url) {
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml, text/xml' }, signal: AbortSignal.timeout(20000) });
      if (r.ok) return await r.text();
      console.log(`${r.status} from ${url}`);
    } catch (e) { console.log(`${e.name} from ${url}`); }
    await new Promise(r => setTimeout(r, 3000));
  }
  return null;
}

function parse(xml, S, now) {
  const out = [];
  for (const it of xml.match(/<item[\s>][\s\S]*?<\/item>/g) || []) {
    const g = tag => { const m = it.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)); return m ? m[1] : ''; };
    const t = strip(g('title')), u = strip(g('link')) || strip(g('guid')), raw = g('pubDate') || g('dc:date');
    const when = new Date(strip(raw).replace(/ EST$/, ' -0500').replace(/ EDT$/, ' -0400'));
    if (!t || !/^https?:\/\//.test(u) || isNaN(when)) continue;
    const age = (now - when) / 864e5;
    if (age > (S.maxDays || KEEP_DAYS) || age < -1) continue;
    const dek = clip(strip(g('description')).replace(/^[A-Z .,]+, Tenn\.? \([A-Z]+\) ?[—-] ?/, '').replace(/https?:\/\/\S+/g, '').trim(), 220);
    const text = `${t} ${dek}`;
    if (!S.local && !PLACE.test(text)) continue;
    if (SKIP.test(t)) continue;
    const [tag, w] = tagOf(t);
    out.push({ t, u, d: etDate(when), at: when.toISOString(), src: S.src, tag, w, dek });
  }
  return out;
}

(async () => {
  const now = new Date();
  const store = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, 'utf8')) : { items: [] };
  let items = store.items || [];
  const seen = new Set(items.map(x => key(x.u)));
  let added = 0, okFeeds = 0;
  for (const S of SOURCES) {
    const xml = await get(S.url);
    if (!xml) continue;
    okFeeds++;
    for (const x of parse(xml, S, now)) {
      if (seen.has(key(x.u)) || items.some(y => similar(y.t, x.t) && Math.abs(new Date(y.at) - new Date(x.at)) < 3 * 864e5)) continue;
      items.push(x); seen.add(key(x.u)); added++;
    }
  }
  const cutoff = new Date(now - KEEP_DAYS * 864e5).toISOString();
  items = items.filter(x => x.at >= cutoff).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 300);
  console.log(`headlines: ${okFeeds}/${SOURCES.length} feeds read, ${added} new, ${items.length} kept`);
  if (!okFeeds) { console.log('No feeds reachable; leaving the page as it is.'); return; }

  // Top stories: most owner-relevant from the last week (rules, platforms, numbers first), newest breaks ties
  const today = etDate(now), dayN = s => Date.parse(s + 'T12:00:00Z') / 864e5, T = dayN(today);
  const fresh = items.filter(x => T - dayN(x.d) <= TOP_DAYS);
  const W = Object.fromEntries(TAGS.map(([n, w]) => [n, w])); W.Guests = 7;
  items.forEach(x => { x.w = W[x.tag] || (TOWN.some(([n]) => n === x.tag) ? 2 : 1); });
  const decay = x => (T - dayN(x.d)) * (x.tag === 'Weather' ? 3 : 1);
  const score = x => x.w * 2 - decay(x) + (x.dek ? 1 : 0) + (/^(WATE|WVLT|WBIR|Smokies\.LIVE|National Park Service)$/.test(x.src) ? 1 : 0);
  const top = [];
  for (const x of [...fresh].sort((a, b) => score(b) - score(a) || b.at.localeCompare(a.at))) {
    if (top.length === 4) break;
    if (top.length === 0 && !x.dek) continue; // the lead needs a summary line
    top.push(x);
  }
  const topKeys = new Set(top.map(x => key(x.u)));
  const sameAsBefore = JSON.stringify({ top: store.top, items: store.items }) === JSON.stringify({ top: top.map(x => x.u), items });
  if (!sameAsBefore) fs.writeFileSync(storePath, JSON.stringify({ updated: now.toISOString(), sources: [...new Set(SOURCES.map(s => s.src))], top: top.map(x => x.u), items }, null, 1) + '\n');
  const list = items.filter(x => !topKeys.has(key(x.u))).slice(0, LIST_N);

  const A = x => `href="${esc(x.u)}" target="_blank" rel="noopener"`;
  let topHtml = '';
  if (top.length >= 2) {
    const [L, ...side] = top;
    topHtml = `<div class="top-stories">
      <a class="ts-lead" ${A(L)}><p class="tag">${esc(L.tag)}</p><h3>${esc(L.t)}</h3><p class="dek">${esc(L.dek)}</p><p class="meta">${esc(L.src)} · ${md(L.d)}</p></a>
      <div class="ts-side">
${side.map(x => `        <a class="ts" ${A(x)}><p class="tag">${esc(x.tag)}</p><h3>${esc(x.t)}</h3><p class="meta">${esc(x.src)} · ${md(x.d)}</p></a>`).join('\n')}
      </div>
    </div>`;
  }
  const listHtml = list.map(x => `        <li><a ${A(x)} data-date="${x.d}"><span class="hl-meta"><span class="hl-tag">${esc(x.tag)}</span><time datetime="${x.d}">${md(x.d)}</time></span><span class="hl-t">${esc(x.t)}</span><span class="hl-src">${esc(x.src)}</span></a></li>`).join('\n');

  let html = fs.readFileSync(indexPath, 'utf8');
  const swap = (name, body) => {
    const re = new RegExp(`(<!-- ${name}:START -->)[\\s\\S]*?(<!-- ${name}:END -->)`);
    if (!re.test(html)) throw new Error(`missing ${name} markers in index.html`);
    html = html.replace(re, `$1\n${body}\n    $2`);
  };
  if (topHtml) swap('TOPSTORIES', '    ' + topHtml);
  if (list.length >= 4) swap('HEADLINES', listHtml);
  fs.writeFileSync(indexPath, html);
  console.log(`top: ${top.map(x => x.tag + ': ' + x.t.slice(0, 50)).join(' | ')}`);
})().catch(e => { console.error(e.message); process.exit(1); });
