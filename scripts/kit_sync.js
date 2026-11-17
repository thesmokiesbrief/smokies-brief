// Makes sure everyone who signed up through a site form has the matching Kit tag,
// so the alert and Monday Brief emails reach them. Kit's free plan can't add tags from a form,
// so this runs before each send. No AI. Does nothing if Kit isn't connected.
// Also handles the Unsubscribe form on privacy.html: anyone who submits it is unsubscribed from
// everything. Each request is handled once (data/unsub-done.json keeps hashed IDs, no emails),
// so someone who later signs up again isn't removed a second time.
//
// Needs: GitHub secret KIT_API_KEY, variables KIT_TAG_ID (alerts) and KIT_WEEKLY_TAG_ID (Monday Brief).
// Form IDs come from site-config.js, the same place the site reads them.
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const KEY = process.env.KIT_API_KEY;
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'site-config.js'), 'utf8'), ctx);
const cfg = ctx.window.SB_CONFIG || {};
const pairs = [
  [cfg.kitAlertsFormId, process.env.KIT_TAG_ID, 'Big weekend alerts'],
  [cfg.kitWeeklyFormId, process.env.KIT_WEEKLY_TAG_ID, 'Monday Brief']
].filter(([f, t]) => f && t);

if (!KEY || (!pairs.length && !cfg.kitUnsubFormId)) { console.log("Kit isn't connected yet. Nothing to sync."); process.exit(0); }

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
  if (cfg.kitUnsubFormId) try {
    const donePath = path.join(root, 'data', 'unsub-done.json');
    const done = fs.existsSync(donePath) ? JSON.parse(fs.readFileSync(donePath, 'utf8')) : { done: [] };
    const seen = new Set(done.done);
    const asked = await all(`/forms/${cfg.kitUnsubFormId}/subscribers`); // active only; already-unsubscribed people drop off
    let n = 0;
    for (const s of asked) {
      const h = crypto.createHash('sha256').update(`${s.id}:${s.added_at || s.created_at || ''}`).digest('hex').slice(0, 20);
      if (seen.has(h)) continue;
      await api(`/subscribers/${s.id}/unsubscribe`, { method: 'POST', body: '{}' });
      done.done.push(h); seen.add(h); n++;
    }
    if (n) { done.updated = new Date().toISOString(); fs.writeFileSync(donePath, JSON.stringify(done, null, 1) + '\n'); }
    console.log(`Unsubscribe requests: ${n} handled.`);
  } catch (e) { console.log('Unsubscribe step problem (will retry tomorrow): ' + e.message); }
  for (const [form, tag, label] of pairs) {
    const signed = await all(`/forms/${form}/subscribers`);
    const tagged = new Set((await all(`/tags/${tag}/subscribers`)).map(s => s.id));
    const todo = signed.filter(s => !tagged.has(s.id));
    for (const s of todo) await api(`/tags/${tag}/subscribers/${s.id}`, { method: 'POST', body: '{}' });
    console.log(`${label}: ${signed.length} from the form, ${todo.length} newly tagged.`);
  }
})().catch(e => { console.log('Kit sync problem (emails will still try to send): ' + e.message); });
