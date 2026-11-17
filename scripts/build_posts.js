// Builds this week's ready-to-post images and captions. No AI: fixed designs filled with the site's own data.
// Runs Monday mornings in .github/workflows/posts.yml after content.js is rebuilt.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..'); const out = path.join(root, 'posts', 'latest');
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(root, 'content.js'), 'utf8'), ctx);
const K = ctx.window.CONTENT, N = K.now; const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const day = s => new Date(s + 'T12:00:00'); const today = day(K.today);
const fri = new Date(today); fri.setDate(fri.getDate() + ((5 - fri.getDay() + 7) % 7));
const big = K.events.filter(e => e.c === 'big' && day(e.e || e.d) >= today).slice(0, 5);
const R = K.rates, FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const cm = today.getMonth(), nm = (cm + 1) % 12, pct = Math.round((R.adr[nm] - R.adr[cm]) / R.adr[cm] * 100);
const dctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), dctx);
const DM = dctx.window.DATA, heat = DM.heat.values.at(-1), mos = DM.mos.values.at(-1);
const mkt = heat < 45 ? "a buyer's market" : heat > 55 ? "a seller's market" : 'a balanced market';
const TAGS = '#SmokyMountains #Gatlinburg #PigeonForge #Sevierville #ShortTermRental #STRHost';
const POSTS = [
  { t: 'week', title: 'This week in the Smokies', caption: `This week's numbers for Smokies hosts:\n\n${N.week.map(r => `• ${r[0]}: ${r[1]}`).join('\n')}\n\nThe full rundown is free at thesmokiesbrief.com\n\n${TAGS}` },
  { t: 'weekend', title: 'This weekend', caption: `Here's what's going on in the Smokies this weekend (${MON[fri.getMonth()]} ${fri.getDate()}–${fri.getDate() + 2}). Worth a mention in your check-in messages.\n\nFull calendar: thesmokiesbrief.com\n\n${TAGS} #SmokiesEvents` },
  { t: 'busy', title: 'Busy dates ahead', caption: `Big dates coming up in the Smokies. If your rates are still on autopilot for these, take a look:\n\n${big.map(e => `• ${e.t.replace(/\s*\([^)]*\)\s*$/, '')}`).join('\n')}\n\nEvery date, free: thesmokiesbrief.com\n\n${TAGS} #RevenueManagement` },
  { t: 'roads', title: 'Park roads right now', caption: `Park road update for your guests:\n\n${[...N.roads.slice(0, 2), ...(N.roadsSoon ? [N.roadsSoon] : [])].map(r => '• ' + r).join('\n')}\n\nParking in the park over 15 minutes needs a tag ($5 a day, $15 a week).\n\nLive updates: thesmokiesbrief.com\n\n${TAGS} #GreatSmokyMountains` },
  { t: 'rates', title: 'Nightly rates by month', caption: `${FULL[nm]} nightly rates in Sevier County run about ${Math.abs(pct)}% ${pct >= 0 ? 'above' : 'below'} ${FULL[cm]} on average ($${R.adr[nm]} vs. $${R.adr[cm]}). ${pct >= 0 ? "If you're seeing softer prices right now, the next jump is close." : 'Worth a look at your minimum stays and gap-night pricing before it hits.'}\n\nData: AirROI. More at thesmokiesbrief.com\n\n${TAGS} #AirbnbHost` },
  { t: 'market', title: 'Monthly market check', caption: `Sevier County is ${mkt} right now: about ${Math.round(mos)} months of homes for sale at today's pace, and a market heat score of ${heat} out of 100.\n\nData Provided by Zillow Group. Charts at thesmokiesbrief.com\n\n${TAGS} #SmokyMountainRealEstate` }
];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  const manifest = { updated: new Date().toISOString(), week: K.today, posts: [] };
  for (const p of POSTS) {
    await page.goto('file://' + path.join(root, 'posts', 'template.html') + '?t=' + p.t, { waitUntil: 'networkidle' });
    await page.waitForSelector('body[data-ready="1"]', { timeout: 20000 });
    const file = `${p.t}.jpg`; await page.screenshot({ path: path.join(out, file), type: 'jpeg', quality: 90 });
    manifest.posts.push({ id: p.t, title: p.title, image: `posts/latest/${file}`, caption: p.caption });
    console.log('built', file);
  }
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 1));
  // also a small preview version for the gallery
  await browser.close();
})();
