// Newest from host podcasts: reads each show's public RSS feed and rewrites the PODCASTS block in index.html
// with the latest episode from each. No AI, no keys. If a feed fails, that show keeps yesterday's episode.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const indexPath = path.join(root, 'index.html');

const SHOWS = [
  { name: 'Thanks For Visiting', feed: 'https://feeds.captivate.fm/thanksforvisiting/', home: 'https://podcasts.apple.com/us/podcast/thanks-for-visiting/id1451872835' },
  { name: 'The Short Term Show', feed: 'https://feeds.castos.com/q428w', home: 'https://podcasts.apple.com/us/podcast/the-short-term-show/id1576433178' },
  { name: 'Vacation Rental Scale-Up', feed: 'https://anchor.fm/s/f77ceb7c/podcast/rss', home: 'https://podcasts.apple.com/us/podcast/vacation-rental-scale-up/id1752075462' }
];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const decode = s => String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&apos;|&#39;|&#039;/g, "'").replace(/&quot;/g, '"').replace(/&#8217;/g, '\u2019').replace(/&#8220;|&#8221;/g, '"')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

async function latest(show) {
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const res = await fetch(show.feed, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (podcast list)' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const xml = await res.text();
    const item = (xml.split(/<item[\s>]/)[1] || '').split('</item>')[0];
    const pick = tag => { const m = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)); return m ? decode(m[1]) : ''; };
    const title = pick('title').replace(/^\d+\.\s*/, '');
    const link = pick('link') || show.home;
    const d = new Date(pick('pubDate'));
    if (!title) throw new Error('no episode found');
    return { title, link: /^https?:\/\//.test(link) ? link : show.home, date: isNaN(d) ? '' : `${MON[d.getMonth()]} ${d.getDate()}` };
  } finally { clearTimeout(timer); }
}

(async () => {
  let html = fs.readFileSync(indexPath, 'utf8');
  const re = /(<!-- PODCASTS:START -->)([\s\S]*?)(<!-- PODCASTS:END -->)/;
  const m = html.match(re);
  if (!m) throw new Error('missing PODCASTS markers in index.html');
  const rows = [];
  for (const show of SHOWS) {
    try {
      const ep = await latest(show);
      rows.push(`      <a class="media" href="${esc(ep.link)}" target="_blank" rel="noopener">
        <span class="m-ico">▶</span><span><b>${esc(show.name)}</b>${esc(ep.title)}${ep.date ? `<small>${ep.date}</small>` : ''}</span>
      </a>`);
    } catch (e) {
      console.log(`${show.name}: ${e.message}; keeping the last episode`);
      const old = m[2].match(new RegExp(`<a class="media"[^>]*>\\s*<span class="m-ico">▶</span><span><b>${show.name.replace(/[-]/g, '\\-')}</b>[\\s\\S]*?</a>`));
      if (old) rows.push('      ' + old[0]);
    }
  }
  if (!rows.length) return console.log('No podcast feeds read; leaving the list as is.');
  const out = html.replace(re, `$1\n${rows.join('\n')}\n      $3`);
  if (out !== html) { fs.writeFileSync(indexPath, out); console.log('Podcast list updated.'); } else console.log('Podcast list unchanged.');
})();
