// Makes sure everyone who signed up through a site form has the matching Kit tag,
// so the alert and Monday Brief emails reach them. Kit's free plan can't add tags from a form,
// so this runs before each send. No AI. Does nothing if Kit isn't connected.
//
// Needs: GitHub secret KIT_API_KEY, variables KIT_TAG_ID (alerts) and KIT_WEEKLY_TAG_ID (Monday Brief).
// Form IDs come from site-config.js, the same place the site reads them.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const KEY = process.env.KIT_API_KEY;
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'site-config.js'), 'utf8'), ctx);
const cfg = ctx.window.SB_CONFIG || {};
const pairs = [
  [cfg.kitAlertsFormId, process.env.KIT_TAG_ID, 'Big weekend alerts'],
  [cfg.kitWeeklyFormId, process.env.KIT_WEEKLY_TAG_ID, 'Monday Brief']
].filter(([f, t]) => f && t);

if (!KEY || !pairs.length) { console.log("Kit isn't connected yet. Nothing to sync."); process.exit(0); }

const api = async (p, opts = {}) => {
  const r = await fetch('https://api.kit.com/v4' + p, { ...opts, headers: { 'X-Kit-Api-Key': KEY, 'Content-Type': 'application/json', Accept: 'application/json' } });
  if (!r.ok) throw new Error(`${opts.method || 'GET'} ${p} -> ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.status === 204 ? {} : r.json();
};
const all = async p => {
  const out = []; let after = '';
  for (let i = 0; i < 100; i++) {
    const d = await api(`${p}${p.includes('?') ? '&' : '?'}per_page=1000${after ? '&after=' + encodeURIComponent(after) : ''}`);
    out.push(...(d.subscribers || []));
    if (!d.pagination || !d.pagination.has_next_page) break;
    after = d.pagination.end_cursor;
  }
  return out;
};

(async () => {
  for (const [form, tag, label] of pairs) {
    const signed = await all(`/forms/${form}/subscribers`);
    const tagged = new Set((await all(`/tags/${tag}/subscribers`)).map(s => s.id));
    const todo = signed.filter(s => !tagged.has(s.id));
    for (const s of todo) await api(`/tags/${tag}/subscribers/${s.id}`, { method: 'POST', body: '{}' });
    console.log(`${label}: ${signed.length} from the form, ${todo.length} newly tagged.`);
  }
})().catch(e => { console.log('Kit sync problem (emails will still try to send): ' + e.message); });
