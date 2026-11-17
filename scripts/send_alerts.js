// Sends the "Big weekend in 30 days" email through Kit (free plan) when an alert date arrives.
// Runs every morning after build_alerts.js. No AI.
//
// One-time setup (then it runs on its own):
//   GitHub secret   KIT_API_KEY   - Kit > Settings > Developer > V4 API key
//   GitHub variable KIT_TAG_ID    - the tag your "Big weekend alerts" form adds to subscribers
// If either is missing the script does nothing, so the job never fails.
// DRY_RUN=1 writes the email to data/alert-preview.html instead of sending.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const SITE = process.env.SITE_URL || 'https://thesmokiesbrief.com';
const KEY = process.env.KIT_API_KEY, TAG = parseInt(process.env.KIT_TAG_ID || '', 10);
const DRY = process.env.DRY_RUN === '1';
const iso = d => d.toISOString().slice(0, 10);
const today = process.env.TODAY || iso(new Date());
const daysUntil = s => Math.round((new Date(s + 'T12:00:00Z') - new Date(today + 'T12:00:00Z')) / 864e5);

const feed = JSON.parse(fs.readFileSync(path.join(root, 'data', 'big-weekends.json'), 'utf8'));
const sentPath = path.join(root, 'data', 'alerts-sent.json');
const sent = fs.existsSync(sentPath) ? JSON.parse(fs.readFileSync(sentPath, 'utf8')) : { sent: [] };

// Due: alert date has arrived, it hasn't gone out yet, and the event is still at least 20 days away
// (so a missed morning run still sends the next day, but nothing goes out too late to help).
const due = feed.alerts.filter(a => a.alert_on <= today && daysUntil(a.start) >= 20 && !sent.sent.includes(a.id));
if (!due.length) { console.log('No alerts due today.'); process.exit(0); }
if (!DRY && (!KEY || !TAG)) { console.log(`Alerts due (${due.map(a => a.title).join(', ')}) but Kit isn't connected yet. Skipping.`); process.exit(0); }

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const lead = due[0];
const later = feed.alerts.filter(a => a.start > lead.start && !due.includes(a)).slice(0, 3);
const s = 'font-family:Arial,Helvetica,sans-serif;color:#1D2420;';
const block = a => `
  <div style="border:1px solid #DCD3C3;border-radius:12px;padding:18px 20px;margin:0 0 16px;background:#FBF8F2">
    <p style="${s}margin:0 0 4px;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#B9572B">${esc(a.dates)} &middot; ${esc(a.place)}</p>
    <p style="${s}margin:0 0 8px;font-size:20px;font-weight:bold;line-height:1.25">${esc(a.title)}</p>
    ${a.market ? `<p style="${s}margin:0 0 6px;font-size:15px;line-height:1.5">Last year in ${a.month}, the average Smokies rental got <b>$${a.market.adr} a night</b> at <b>${a.market.occ}% occupancy</b>.</p>` : ''}
    ${a.url ? `<p style="${s}margin:0;font-size:14px"><a href="${esc(a.url)}" style="color:#9A4521">Event details</a></p>` : ''}
  </div>`;

const subject = due.length === 1 ? `Big weekend in 30 days: ${lead.short} (${lead.dates})` : `${due.length} big weekends are 30 days out`;
const preview = 'Check your rate and minimum stay for those dates before they book up.';
const content = `
<div style="${s}max-width:600px;padding-top:18px">
  <a href="${SITE}" style="text-decoration:none"><img src="${SITE}/img/email-header.png" width="600" alt="The Smokies Brief" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:12px;margin:0 0 22px"></a>
  <p style="${s}margin:0 0 6px;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#3E6B57">Big weekend alert</p>
  <p style="${s}margin:0 0 16px;font-size:26px;line-height:1.2;font-family:Georgia,serif">${due.length === 1 ? `${esc(lead.short)} is 30 days out` : 'These big weekends are 30 days out'}</p>
  ${due.map(block).join('')}
  <p style="${s}margin:18px 0 8px;font-size:16px;font-weight:bold">Before these dates book up</p>
  <ul style="${s}margin:0 0 18px;padding-left:20px;font-size:15px;line-height:1.6">
    <li>Check your nightly rate for those dates. If it's still set to your normal rate, consider raising it.</li>
    <li>Set a 2- or 3-night minimum so one-night stays don't break up the weekend.</li>
    <li>Open any nights you blocked, and check that your calendar sync is current.</li>
    <li>Mention the event in your listing description so guests searching for it find you.</li>
  </ul>
  ${later.length ? `<p style="${s}margin:18px 0 6px;font-size:16px;font-weight:bold">Coming up after that</p>
  <ul style="${s}margin:0 0 18px;padding-left:20px;font-size:15px;line-height:1.6">${later.map(a => `<li><b>${esc(a.dates)}</b> &middot; ${esc(a.title)}</li>`).join('')}</ul>` : ''}
  <p style="margin:22px 0"><a href="${SITE}/#events" style="${s}display:inline-block;background:#B9572B;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 22px;border-radius:999px">See the full events calendar</a></p>
  <p style="${s}margin:0;font-size:12px;color:#7A817B;line-height:1.5">Nightly rate and occupancy: AirROI market data for the Smokies, ${esc(lead.market ? lead.market.period : '')}. You're getting this because you signed up for big weekend alerts.</p>
</div>`;

(async () => {
  if (DRY) {
    fs.writeFileSync(path.join(root, 'data', 'alert-preview.html'), `<!doctype html><meta charset="utf-8"><title>${esc(subject)}</title><body style="margin:0;padding:24px;background:#F4EFE6"><p style="font:13px Arial;color:#7A817B">Subject: <b>${esc(subject)}</b><br>Preview: ${esc(preview)}</p>${content}</body>`);
    console.log('DRY RUN. Subject:', subject); return;
  }
  const sendAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();   // 10 minutes from now
  const res = await fetch('https://api.kit.com/v4/broadcasts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Kit-Api-Key': KEY },
    body: JSON.stringify({
      subject, preview_text: preview, description: `Big weekend alert: ${due.map(a => a.title).join(', ')}`,
      content, public: false, published_at: new Date().toISOString(), send_at: sendAt,
      subscriber_filter: [{ all: [{ type: 'tag', ids: [TAG] }] }]
    })
  });
  const body = await res.text();
  if (!res.ok) { console.error('Kit error', res.status, body.slice(0, 300)); process.exit(1); }
  sent.sent.push(...due.map(a => a.id));
  sent.last = { date: today, subject };
  fs.writeFileSync(sentPath, JSON.stringify(sent, null, 1));
  console.log('Scheduled:', subject, 'at', sendAt);
})();
