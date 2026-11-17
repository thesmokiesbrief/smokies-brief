/* Free tools: check-in message builder, share-card maker, calendar button. All client-side, no storage. */
(function(){
  const K = window.CONTENT; if (!K) return;
  const N = K.now; const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const day = s => new Date(s + 'T12:00:00'); const today = day(K.today);
  const fmt = d => `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`;
  const within = (e, n) => { const a = day(e.d), b = e.e ? day(e.e) : a; const lim = new Date(today); lim.setDate(lim.getDate()+n); return b >= today && a <= lim; };

  // second calendar button reuses the events one
  const b2 = document.getElementById('icsBtn2'); const b1 = document.getElementById('icsBtn');
  if (b2 && b1) b2.addEventListener('click', ()=> b1.click());

  // ---------- check-in message builder ----------
  const opts = document.getElementById('ciOpts'), ta = document.getElementById('ciText');
  function build(){
    const on = new Set([...opts.querySelectorAll('input:checked')].map(i=>i.value));
    const L = ["Hi! We're looking forward to your stay. A few things to know before you head up the mountain:", ''];
    if (on.has('weather')) L.push('Weather: ' + N.weather.slice(0,3).map(w=>`${w[0]} ${w[1]}°, ${w[2].toLowerCase()}`).join(' · ') + '.', '');
    if (on.has('roads')) { L.push('National park roads right now:'); N.roads.slice(0,2).forEach(r=> L.push('• ' + r)); if (N.roadsSoon) L.push('• ' + N.roadsSoon); L.push('Newfound Gap Road can close quickly in snow. Park road line: 865-436-1200, ext. 631.', ''); }
    if (on.has('events')) { const ev = K.events.filter(e=> within(e,7) && e.c!=='meet').slice(0,4); if (ev.length){ L.push('Happening this week:'); ev.forEach(e=> L.push(`• ${fmt(day(e.d))}: ${e.t}`)); L.push(''); } }
    if (on.has('parking')) L.push('Parking anywhere in the national park for more than 15 minutes needs a parking tag: $5 a day or $15 a week. Buy it at a visitor center, or online at recreation.gov and print it (phone screens are not accepted).', '');
    if (on.has('power')) L.push('If the power goes out, call Sevier County Electric at 865-774-6300 and let us know.', '');
    L.push('Message us anytime if you need anything. Enjoy the Smokies!');
    ta.value = L.join('\n');
  }
  if (opts && ta){
    opts.addEventListener('change', build); build();
    document.getElementById('ciCopy').addEventListener('click', async ()=>{
      const note = document.getElementById('ciNote');
      try { await navigator.clipboard.writeText(ta.value); note.textContent = 'Copied. Paste it into your guest message.'; }
      catch(e){ ta.focus(); ta.select(); try { document.execCommand('copy'); note.textContent = 'Copied. Paste it into your guest message.'; } catch(_){ note.textContent = 'Text selected. Press Ctrl+C or Cmd+C to copy.'; } }
    });
  }


  // ---------- guest stay link builder ----------
  const sf = document.getElementById('slForm');
  if (sf){
    const iso = x => x.toISOString().slice(0,10);
    const ci = new Date(today); ci.setDate(ci.getDate() + ((5 - ci.getDay() + 7) % 7 || 7)); const co = new Date(ci); co.setDate(co.getDate() + 3);
    document.getElementById('slIn').value = iso(ci); document.getElementById('slOut').value = iso(co);
    const base = () => { const u = new URL('stay.html', location.href); return u.href.split('?')[0]; };
    function upd(){
      const p = new URLSearchParams(); const v = id => document.getElementById(id).value.trim();
      if (v('slCabin')) p.set('c', v('slCabin')); if (v('slHost')) p.set('h', v('slHost'));
      if (v('slIn')) p.set('a', v('slIn')); if (v('slOut')) p.set('d', v('slOut')); if (v('slNote')) p.set('n', v('slNote'));
      const url = base() + '?' + p.toString(); document.getElementById('slUrl').value = url; document.getElementById('slOpen').href = url;
      const box = document.getElementById('slQr');
      if (window.qrcode){ const qr = qrcode(0, 'M'); qr.addData(url); qr.make(); box.innerHTML = qr.createSvgTag({cellSize:3, margin:2, scalable:true}); } else box.textContent = '';
    }
    sf.addEventListener('input', upd); upd();
    document.getElementById('slCopy').addEventListener('click', async ()=>{ const el = document.getElementById('slUrl'); const m = document.getElementById('slMsg');
      try { await navigator.clipboard.writeText(el.value); m.textContent = 'Copied. Paste it into your guest message.'; } catch(e){ el.select(); try { document.execCommand('copy'); m.textContent = 'Copied.'; } catch(_){ m.textContent = 'Select the link and copy it.'; } } });
  }

  // ---------- share card maker ----------
  const cv = document.getElementById('scCanvas'); if (!cv) return;
  const ctx = cv.getContext('2d'); const W = 1080, H = 1080;
  const bg = new Image(); bg.src = 'img/hero.webp';
  let kind = 'week';
  const MSGS = ['Happy holidays from one Smokies host to another','Welcome to the neighborhood, new host','Thanks for the referral','Here\u2019s to a full calendar this season'];
  const DISP = '"Zodiak", Georgia, serif', BODY = '"Satoshi", Arial, sans-serif';
  function wrap(text, x, y, maxW, lh, font){ ctx.font = font; const words = text.split(' '); let line = '', yy = y; for (const w of words){ const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line){ ctx.fillText(line, x, yy); line = w; yy += lh; } else line = t; } ctx.fillText(line, x, yy); return yy; }
  function base(dark){
    if (bg.complete && bg.naturalWidth){ const s = Math.max(W/bg.naturalWidth, H/bg.naturalHeight); const iw = bg.naturalWidth*s, ih = bg.naturalHeight*s; ctx.drawImage(bg, (W-iw)/2, (H-ih)/2, iw, ih); }
    else { ctx.fillStyle = '#1F3329'; ctx.fillRect(0,0,W,H); }
    const g = ctx.createLinearGradient(0,0,0,H); g.addColorStop(0, `rgba(14,22,18,${dark?0.82:0.35})`); g.addColorStop(.55, `rgba(14,22,18,${dark?0.88:0.45})`); g.addColorStop(1,'rgba(14,22,18,.94)');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  }
  function footer(){
    ctx.fillStyle = 'rgba(244,239,230,.18)'; ctx.fillRect(80, H-150, W-160, 2);
    ctx.fillStyle = '#F4EFE6'; ctx.font = `700 40px ${DISP}`; ctx.textAlign = 'left'; ctx.fillText('The Smokies Brief', 80, H-88);
    ctx.fillStyle = '#F2C9A8'; ctx.font = `600 25px ${BODY}`; ctx.textAlign = 'right'; ctx.fillText('Free every Monday · thesmokiesbrief.com', W-80, H-92); ctx.textAlign = 'left';
  }
  function kicker(t, y){ ctx.fillStyle = '#F2C9A8'; ctx.font = `700 26px ${BODY}`; ctx.fillText(t.toUpperCase().split('').join(String.fromCharCode(8202)), 80, y); }
  function draw(){
    ctx.clearRect(0,0,W,H);
    if (kind === 'week'){
      base(true); kicker('This week in the Smokies · ' + MON[today.getMonth()] + ' ' + today.getDate(), 130);
      ctx.fillStyle = '#fff'; wrap('Four numbers every cabin owner should see', 80, 215, 900, 78, `500 68px ${DISP}`);
      N.week.forEach((r,i)=>{ const y = 400 + i*125; ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(80, y-70, W-160, 105);
        ctx.fillStyle = '#F2C9A8'; ctx.font = `500 58px ${DISP}`; ctx.fillText(r[0], 110, y+6);
        let fs = 32; ctx.font = `500 ${fs}px ${BODY}`; while (ctx.measureText(r[1]).width > W-80-380-30 && fs > 22){ fs--; ctx.font = `500 ${fs}px ${BODY}`; }
        ctx.fillStyle = '#F4EFE6'; ctx.fillText(r[1], 380, y-2); });
    } else if (kind === 'busy'){
      base(true); kicker('Busy dates ahead · price them now', 130);
      ctx.fillStyle = '#fff'; wrap('The next big weekends in the Smokies', 80, 215, 900, 78, `500 68px ${DISP}`);
      const ev = K.events.filter(e=> e.c==='big' && day(e.e||e.d) >= today).slice(0,5);
      let y = 400;
      ev.forEach(e=>{ const d = day(e.d); const t = e.t.replace(/\s*\([^)]*\)\s*$/,'');
        ctx.fillStyle = '#F2C9A8'; ctx.font = `700 30px ${BODY}`; ctx.fillText(`${MON[d.getMonth()]} ${d.getDate()}${e.e ? '–' + (day(e.e).getMonth()===d.getMonth() ? day(e.e).getDate() : MON[day(e.e).getMonth()] + ' ' + day(e.e).getDate()) : ''}`, 112, y);
        ctx.fillStyle = '#F4EFE6'; const yEnd = wrap(t, 330, y, 670, 40, `500 30px ${BODY}`);
        ctx.fillStyle = '#B9572B'; ctx.fillRect(80, y-30, 8, yEnd - y + 42);
        y = yEnd + 74; });
    } else {
      base(false);
      const msg = MSGS[+document.getElementById('scMsg').value]; const from = document.getElementById('scFrom').value.trim();
      kicker('A note from one host to another', 150);
      ctx.fillStyle = '#fff'; const yEnd = wrap(msg + '.', 80, 290, 900, 104, `500 92px ${DISP}`);
      if (from){ ctx.fillStyle = '#F2C9A8'; ctx.font = `600 38px ${BODY}`; ctx.fillText('— ' + from, 80, yEnd + 100); }
    }
    footer();
  }
  document.querySelectorAll('.sc-opts button').forEach(b=> b.addEventListener('click', ()=>{
    document.querySelectorAll('.sc-opts button').forEach(x=> x.setAttribute('aria-pressed', x===b)); kind = b.dataset.k;
    document.getElementById('scHost').hidden = kind !== 'host'; draw();
  }));
  ['scMsg','scFrom'].forEach(id=> document.getElementById(id).addEventListener('input', draw));
  const fname = () => `smokies-brief-${kind}-card.png`;
  document.getElementById('scDl').addEventListener('click', ()=> cv.toBlob(b=>{ const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = fname(); document.body.appendChild(a); a.click(); a.remove(); }, 'image/png'));
  const sh = document.getElementById('scShare');
  sh.addEventListener('click', ()=> cv.toBlob(async b=>{
    const f = new File([b], fname(), {type:'image/png'});
    if (navigator.canShare && navigator.canShare({files:[f]})) { try { await navigator.share({files:[f], text:'From The Smokies Brief: thesmokiesbrief.com'}); } catch(_){} }
    else document.getElementById('scDl').click();
  }, 'image/png'));
  const go = () => draw();
  bg.onload = go;
  (document.fonts ? Promise.all([document.fonts.load(`500 68px ${DISP}`), document.fonts.load(`700 40px ${DISP}`), document.fonts.load(`500 32px ${BODY}`), document.fonts.load(`700 30px ${BODY}`)]).catch(()=>{}) : Promise.resolve()).then(go);
  go();
})();
