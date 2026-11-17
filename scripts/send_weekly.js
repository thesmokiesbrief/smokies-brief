// The Monday Brief: builds the weekly email from content.js and sends it through Kit (free plan). No AI.
// Runs Mondays after the posts job (.github/workflows/posts.yml).
//
// One-time setup (shared with big weekend alerts):
//   GitHub secret   KIT_API_KEY         - Kit > Settings > Developer > V4 API key
//   GitHub variable KIT_WEEKLY_TAG_ID   - the tag your "Monday Brief" form adds to subscribers
// Missing either: the script does nothing. DRY_RUN=1 writes data/weekly-preview.html instead of sending.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(root, 'content.js'), 'utf8'), ctx);
const K = ctx.window.CONTENT;
const SITE = process.env.SITE_URL || 'https://thesmokiesbrief.com';
const KEY = process.env.KIT_API_KEY, TAG = parseInt(process.env.KIT_WEEKLY_TAG_ID || '', 10);
const DRY = process.env.DRY_RUN === '1';
const iso = d => d.toISOString().slice(0, 10);
const today = process.env.TODAY || iso(new Date());
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = s => { const d = new Date(s + 'T12:00:00Z'); return `${MON[d.getUTCMonth()]} ${d.getUTCDate()}`; };
const range = (s, e) => !e || e === s ? fmt(s) : (s.slice(5, 7) === e.slice(5, 7) ? `${fmt(s)}\u2013${+e.slice(8)}` : `${fmt(s)}\u2013${fmt(e)}`);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const sentPath = path.join(root, 'data', 'weekly-sent.json');
const sent = fs.existsSync(sentPath) ? JSON.parse(fs.readFileSync(sentPath, 'utf8')) : { sent: [] };
if (!DRY && sent.sent.includes(today)) { console.log('Already sent today.'); process.exit(0); }
if (!DRY && (!KEY || !TAG)) { console.log("Kit isn't connected yet. Skipping the Monday Brief."); process.exit(0); }

// Only use the daily snapshot (week tiles, roads, busy days) if it's fresh; otherwise leave those parts out.
const ageDays = Math.round((new Date(today + 'T12:00:00Z') - new Date((K.today || '2000-01-01') + 'T12:00:00Z')) / 864e5);
const N = ageDays <= 3 ? (K.now || {}) : {};
if (ageDays > 3) console.log(`Snapshot is ${ageDays} days old; sending calendar and market sections only.`);
const weekEnd = addDays(today, 7), monthOut = addDays(today, 45);
const thisWeek = K.events.filter(e => e.c !== 'meet' && (e.e || e.d) >= today && e.d <= weekEnd);
const bigAhead = K.events.filter(e => ['big', 'conv'].includes(e.c) && e.d > weekEnd && e.d <= monthOut).slice(0, 5);
const m = new Date(today + 'T12:00:00Z').getUTCMonth(), R = K.rates;

const s = 'font-family:Arial,Helvetica,sans-serif;color:#1D2420;';
const h2 = t => `<p style="${s}margin:26px 0 8px;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#3E6B57">${t}</p>`;
const li = h => `<li style="margin:0 0 6px">${h}</li>`;
const ul = items => `<ul style="${s}margin:0;padding-left:20px;font-size:15px;line-height:1.55">${items.join('')}</ul>`;
const btn = (t, u) => `<a href="${u}" style="${s}display:inline-block;background:#B9572B;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:11px 20px;border-radius:999px">${t}</a>`;

const subject = `The Monday Brief: ${fmt(today)}`;
const preview = (N.week || []).slice(0, 2).map(w => w[1]).join(' \u00b7 ') || 'This week in the Smokies for cabin owners and hosts.';
const content = `
<div style="${s}max-width:600px">
  <a href="${SITE}" style="text-decoration:none"><img src="${SITE}/img/email-header.png" width="600" alt="The Smokies Brief" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:12px;margin:0 0 22px"></a>
  <p style="${s}margin:0 0 4px;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#B9572B">The Monday Brief &middot; ${fmt(today)}</p>
  <p style="${s}margin:0 0 10px;font-size:26px;line-height:1.2;font-family:Georgia,serif">This week in the Smokies</p>
  ${(N.week || []).length ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0 8px">${N.week.map(w => `<tr><td style="${s}width:92px;padding:10px 12px;background:#1F3329;color:#F2C9A8;font-family:Georgia,serif;font-size:20px;border-radius:10px 0 0 10px;white-space:nowrap">${esc(w[0])}</td><td style="${s}padding:10px 14px;background:#FBF8F2;border:1px solid #DCD3C3;border-left:0;border-radius:0 10px 10px 0;font-size:15px">${esc(w[1])}</td></tr>`).join('')}</table>` : ''}
  ${thisWeek.length ? h2('On the calendar this week') + ul(thisWeek.map(e => li(`<b>${esc(range(e.d, e.e))}</b> &middot; ${e.u ? `<a href="${esc(e.u)}" style="color:#9A4521">${esc(e.t)}</a>` : esc(e.t)}${e.p ? ` <span style="color:#7A817B">(${esc(e.p)})</span>` : ''}`))) : ''}
  ${bigAhead.length ? h2('Big weekends to price now') + ul(bigAhead.map(e => li(`<b>${esc(range(e.d, e.e))}</b> &middot; ${esc(e.t)}`))) : ''}
  ${(N.roads || []).length ? h2('Park roads') + ul([...N.roads, ...(N.roadsSoon ? [N.roadsSoon] : [])].map(r => li(esc(r)))) : ''}
  ${N.busyDays ? `<p style="${s}margin:10px 0 0;font-size:15px"><b>Busiest park days ahead:</b> ${esc(N.busyDays)}. Expect full lots and slow traffic, and give guests a heads-up.</p>` : ''}
  ${R ? h2('The market') + `<p style="${s}margin:0;font-size:15px;line-height:1.55">Last year in ${MON[m]}, the average Smokies rental got <b>$${R.adr[m]} a night</b> at <b>${R.occ[m]}% occupancy</b> (${esc(R.season[m].toLowerCase())} season).</p>` : ''}
  ${h2('Free this week')}
  ${ul([
    li(`<a href="${SITE}/posts.html" style="color:#9A4521">Ready-to-post images</a> for your Facebook page or groups`),
    li(`<a href="${SITE}/checklists.html" style="color:#9A4521">Seasonal cabin checklists</a> with what's due now`),
    li(`<a href="${SITE}/#power" style="color:#9A4521">Does my cabin have power?</a> Check any address against reported outages`)
  ])}
  <p style="margin:24px 0 8px">${btn('Open today\u2019s Smokies Brief', SITE)}</p>
  <p style="${s}margin:16px 0 0;font-size:12px;color:#7A817B;line-height:1.5">Updated every morning at ${SITE.replace(/^https?:\/\//, '')}. Market numbers: AirROI${R ? ', ' + esc(R.period) : ''}. Forward this to another host who'd want it.</p>
</div>`;

(async () => {
  if (DRY) {
    fs.writeFileSync(path.join(root, 'data', 'weekly-preview.html'), `<!doctype html><meta charset="utf-8"><title>${esc(subject)}</title><body style="margin:0;padding:24px;background:#F4EFE6"><p style="font:13px Arial;color:#7A817B">Subject: <b>${esc(subject)}</b><br>Preview: ${esc(preview)}</p>${content}</body>`);
    console.log('DRY RUN. Subject:', subject); return;
  }
  const res = await fetch('https://api.kit.com/v4/broadcasts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Kit-Api-Key': KEY },
    body: JSON.stringify({
      subject, preview_text: preview, description: subject, content, public: true,
      published_at: new Date().toISOString(), send_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      subscriber_filter: [{ all: [{ type: 'tag', ids: [TAG] }] }]
    })
  });
  const body = await res.text();
  if (!res.ok) { console.error('Kit error', res.status, body.slice(0, 300)); process.exit(1); }
  sent.sent.push(today); sent.sent = sent.sent.slice(-60);
  fs.writeFileSync(sentPath, JSON.stringify(sent, null, 1));
  console.log('Scheduled:', subject);
})();
