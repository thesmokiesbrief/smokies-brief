// Writes data/attractions.json from content.js for partner sites.
// Guest-facing: no local-only deals, no Smokies Brief branding, no live ride waits (those come from Queue-Times).
// Expired items (until < today) are dropped here; sites also hide items outside from/until on their own.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(root, 'content.js'), 'utf8'), ctx);
const K = ctx.window.CONTENT, A = K.attractions;
const today = new Date().toISOString().slice(0, 10);
const live = x => !x.until || x.until >= today;
const pick = (x, keys) => Object.fromEntries(keys.filter(k => x[k] !== undefined && x[k] !== null).map(k => [k, x[k]]));
const feed = {
  updated: new Date().toISOString(),
  dollywood: {
    url: A.dollywood.url,
    seasons: A.dollywood.seasons.filter(live).map(x => pick(x, ['from', 'until', 'name', 'url'])),
    deals: A.dollywood.deals.filter(live).map(x => pick(x, ['title', 'text', 'from', 'until', 'url'])),
    tips: A.dollywood.tips.filter(live).map(x => pick(x, ['text', 'from', 'until', 'url']))
  },
  cards: A.cards.filter(live).map(x => pick(x, ['name', 'town', 'title', 'text', 'from', 'until', 'url']))
};
fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'data', 'attractions.json'), JSON.stringify(feed, null, 1));
console.log('attractions.json:', feed.dollywood.seasons.length, 'seasons,', feed.dollywood.deals.length, 'deals,', feed.dollywood.tips.length, 'tips,', feed.cards.length, 'cards');
