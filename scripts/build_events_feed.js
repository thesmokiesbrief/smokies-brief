// Writes data/events.json from content.js so other sites (partner sites)
// can show the same Smokies events. Run by the morning job after content.js is rebuilt.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(root, 'content.js'), 'utf8'), ctx);
const K = ctx.window.CONTENT;
const pub = e => ({ start: e.d || e.s, end: e.e || e.d || e.s, title: e.t, place: e.p || 'Smoky Mountains', category: e.c, url: e.u || null, ...(e.wd ? { weekdays: e.wd } : {}) });
const feed = {
  updated: K.today,
  note: 'Smokies events for Gatlinburg, Pigeon Forge and Sevierville. Categories: big, fest, conv, meet, park, civic.',
  events: K.events.filter(e => e.c !== 'meet').map(pub),
  ongoing: K.spans.map(s => ({ start: s.s, end: s.e, title: s.t, short: s.sh || s.t, category: s.c, url: s.u || null }))
};
fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'data', 'events.json'), JSON.stringify(feed, null, 1));
console.log('events.json:', feed.events.length, 'events,', feed.ongoing.length, 'ongoing');
