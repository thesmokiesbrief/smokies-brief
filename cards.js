/* Card engine shared by cards.html (maker) and card.html (the link a host sends). Canvas only, no storage. */
window.CARDS = (function(){
  const MSGS = [
    'Happy holidays from one Smokies host to another',
    'Welcome to the neighborhood, new host',
    'Thanks for the referral',
    'Here\u2019s to a full calendar this season',
    'Congrats on your first booking',
    'Congrats on the five-star review',
    'Thank you for taking such good care of our guests',
    'Happy New Year from the mountains'
  ];
  const SIZES = { square:[1080,1080,'Square'], post:[1080,1350,'Post'], story:[1080,1920,'Story'] };
  const PHOTOS = { hero:'Misty ridges', cabin:'Cabin at dusk', interior:'Cozy interior', road:'Fall road' };
  const STYLES = { classic:'Classic', bold:'Bold', light:'Light' };
  const DISP = '"Zodiak", Georgia, serif', BODY = '"Satoshi", Arial, sans-serif';
  const cache = {};
  function img(src){ if (cache[src]) return cache[src]; const p = new Promise(res=>{ const i = new Image(); i.onload = ()=>res(i); i.onerror = ()=>res(null); i.src = src; }); cache[src] = p; return p; }
  function fonts(){ return document.fonts ? Promise.all([document.fonts.load(`500 90px ${DISP}`), document.fonts.load(`700 40px ${DISP}`), document.fonts.load(`600 36px ${BODY}`), document.fonts.load(`700 26px ${BODY}`)]).catch(()=>{}) : Promise.resolve(); }
  function lines(ctx, text, maxW){ const words = text.split(/\s+/); const out = []; let line = ''; for (const w of words){ const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line){ out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; }
  function cover(ctx, im, W, H){ const s = Math.max(W/im.naturalWidth, H/im.naturalHeight); const iw = im.naturalWidth*s, ih = im.naturalHeight*s; ctx.drawImage(im, (W-iw)/2, (H-ih)/2, iw, ih); }
  async function draw(cv, o){
    const [W,H] = SIZES[o.size] || SIZES.square; cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
    await fonts();
    const im = o.photoImg || await img(o.base + 'img/' + (PHOTOS[o.photo] ? o.photo : 'hero') + '.webp');
    const msg = (o.custom || MSGS[o.m] || MSGS[0]).trim(); const from = (o.from || '').trim(); const txt = msg + (/[.!?]$/.test(msg) ? '' : '.');
    const pad = 84, maxW = W - pad*2;
    if (o.style === 'light'){
      ctx.fillStyle = '#F4EFE6'; ctx.fillRect(0,0,W,H);
      const ph = Math.round(H*(H > 1500 ? 0.5 : H > 1200 ? 0.46 : 0.42)); ctx.save(); ctx.beginPath(); ctx.roundRect(48,48,W-96,ph,28); ctx.clip(); if (im) cover(ctx, im, W, ph+96); ctx.restore();
      const top = 48 + ph + 56, bottom = H - 150; let size = H > 1500 ? 100 : 86, L;
      const fit = () => { ctx.font = `500 ${size}px ${DISP}`; L = lines(ctx, txt, maxW); return L.length*size*1.08 + (from ? 70 : 0) <= bottom - top; };
      while (!fit() && size > 44) size -= 3;
      let y = top + size*0.82; ctx.fillStyle = '#1D2420'; L.forEach(l=>{ ctx.fillText(l, pad, y); y += size*1.08; });
      if (from){ ctx.fillStyle = '#9A4521'; ctx.font = `600 36px ${BODY}`; ctx.fillText('\u2014 ' + from, pad, y + 14); }
      ctx.fillStyle = '#DCD3C3'; ctx.fillRect(pad, H-118, maxW, 2);
      ctx.fillStyle = '#1D2420'; ctx.font = `700 34px ${DISP}`; ctx.textAlign = 'left'; ctx.fillText('The Smokies Brief', pad, H-62);
      ctx.fillStyle = '#7A817B'; ctx.font = `600 24px ${BODY}`; ctx.textAlign = 'right'; ctx.fillText('Free cards for hosts \u00b7 thesmokiesbrief.com', W-pad, H-64); ctx.textAlign = 'left';
      return;
    }
    if (im) cover(ctx, im, W, H); else { ctx.fillStyle = '#1F3329'; ctx.fillRect(0,0,W,H); }
    const g = ctx.createLinearGradient(0,0,0,H);
    if (o.style === 'bold'){ g.addColorStop(0,'rgba(14,22,18,.78)'); g.addColorStop(1,'rgba(14,22,18,.9)'); }
    else { g.addColorStop(0,'rgba(14,22,18,.45)'); g.addColorStop(.45,'rgba(14,22,18,.25)'); g.addColorStop(1,'rgba(14,22,18,.92)'); }
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    let size = o.style === 'bold' ? (H > 1500 ? 120 : 108) : (H > 1500 ? 104 : 92);
    ctx.font = `500 ${size}px ${DISP}`; let L = lines(ctx, txt, maxW);
    while (L.length > (H > 1500 ? 6 : 4) && size > 60){ size -= 4; ctx.font = `500 ${size}px ${DISP}`; L = lines(ctx, txt, maxW); }
    const block = L.length * size * 1.06 + (from ? 90 : 0);
    let y = o.style === 'bold' ? (H - block)/2 + size*0.7 : H - 190 - block + size*0.8;
    ctx.fillStyle = '#F2C9A8'; ctx.font = `700 26px ${BODY}`; ctx.fillText('A NOTE FROM ONE HOST TO ANOTHER'.split('').join(String.fromCharCode(8202)), pad, o.style === 'bold' ? y - size - 30 : 130);
    ctx.fillStyle = '#fff'; ctx.font = `500 ${size}px ${DISP}`; ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 24;
    L.forEach(l=>{ ctx.fillText(l, pad, y); y += size*1.06; }); ctx.shadowBlur = 0;
    if (from){ ctx.fillStyle = '#F2C9A8'; ctx.font = `600 40px ${BODY}`; ctx.fillText('\u2014 ' + from, pad, y + 34); }
    ctx.fillStyle = 'rgba(244,239,230,.22)'; ctx.fillRect(pad, H-130, maxW, 2);
    ctx.fillStyle = '#F4EFE6'; ctx.font = `700 36px ${DISP}`; ctx.fillText('The Smokies Brief', pad, H-70);
    ctx.fillStyle = '#F2C9A8'; ctx.font = `600 24px ${BODY}`; ctx.textAlign = 'right'; ctx.fillText('Free cards for hosts \u00b7 thesmokiesbrief.com', W-pad, H-72); ctx.textAlign = 'left';
  }
  function link(base, o){ const p = new URLSearchParams(); if (o.custom) p.set('t', o.custom.slice(0,140)); else p.set('m', o.m); if (o.from) p.set('f', o.from.slice(0,40)); if (!o.photoImg) p.set('p', o.photo); p.set('s', o.size); p.set('y', o.style); return base + 'card.html?' + p.toString(); }
  function save(cv, name){ cv.toBlob(b=>{ const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }, 'image/jpeg', 0.92); }
  async function share(cv, name, text, url){ return new Promise(res=> cv.toBlob(async b=>{ const f = new File([b], name, {type:'image/jpeg'}); try { if (navigator.canShare && navigator.canShare({files:[f]})) { await navigator.share({files:[f], text}); return res(true); } if (navigator.share && url) { await navigator.share({url, text}); return res(true); } } catch(_){ return res(true); } res(false); }, 'image/jpeg', 0.92)); }
  return { MSGS, SIZES, PHOTOS, STYLES, draw, link, save, share };
})();
