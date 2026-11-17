(function(){
  const D = window.DATA;
  const C = {ink:'#1D2420', ink3:'#7A817B', line:'#E4DCCD', ember:'#B9572B', moss:'#3E6B57', spruce:'#2C4639', gold:'#C9A65A', paper:'#F4EFE6'};
  const fmt$ = v => '$' + Math.round(v).toLocaleString('en-US');
  const fmtK = v => v >= 1e6 ? '$' + (v/1e6).toFixed(2).replace(/0$/,'') + 'M' : '$' + Math.round(v/1000) + 'K';

  if (window.Chart){
    Chart.defaults.font.family = "'Satoshi', 'General Sans', 'Helvetica Neue', Arial, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = C.ink3;
  }
  const yearTicks = labels => ({
    color: C.ink3, autoSkip:false, maxRotation:0,
    callback(v){ const l = labels[v]; if(!l || !l.endsWith('-01')) return ''; const y=+l.slice(0,4); return (this.chart.width < 520 && y % 2) ? '' : (this.chart.width < 520 ? "'" + l.slice(2,4) : l.slice(0,4)); }
  });
  const tooltip = {backgroundColor:C.ink, titleFont:{weight:'600'}, padding:10, cornerRadius:8, displayColors:false};

  function spark(el, data, color, fill){
    new Chart(el, {type:'line', data:{labels:data.map((_,i)=>i), datasets:[{data, borderColor:color, borderWidth:2, pointRadius:0, tension:.35, fill:true, backgroundColor:fill}]},
      options:{responsive:true, maintainAspectRatio:false, animation:{duration:900}, plugins:{legend:{display:false}, tooltip:{enabled:false}},
        scales:{x:{display:false}, y:{display:false}}, layout:{padding:{bottom:0}}}});
  }

  function charts(){
    if (!window.Chart) return;
    // sparklines
    const heat2023 = D.heat.values.slice(D.heat.dates.indexOf('2023-01'));
    const map = {inventory:D.inventory, dtp:D.dtp, sale:D.sale, heat:heat2023};
    document.querySelectorAll('.spark').forEach(el=>{
      const k = el.dataset.series; const dark = el.closest('.kpi-dark');
      spark(el, map[k], dark ? '#F2C9A8' : C.moss, dark ? 'rgba(242,201,168,.12)' : 'rgba(62,107,87,.10)');
    });

    // gap
    const g = D.gap;
    new Chart(document.getElementById('gapChart'), {type:'line',
      data:{labels:g.dates, datasets:[
        {label:'Top third', data:g.top, borderColor:C.ember, backgroundColor:'rgba(185,87,43,.08)', fill:true, borderWidth:2.5, pointRadius:0, tension:.3},
        {label:'Bottom third', data:g.bottom, borderColor:C.moss, backgroundColor:'rgba(62,107,87,.08)', fill:true, borderWidth:2.5, pointRadius:0, tension:.3}]},
      options:{responsive:true, maintainAspectRatio:false, interaction:{mode:'index', intersect:false},
        plugins:{legend:{display:false}, tooltip:{...tooltip, callbacks:{label:c=>c.dataset.label+': '+fmt$(c.parsed.y)}}},
        scales:{x:{grid:{display:false}, ticks:yearTicks(g.dates), border:{display:false}},
          y:{grid:{color:C.line}, border:{display:false}, ticks:{callback:v=>'$'+(v/1000)+'K', maxTicksLimit:5}}}}});

    // heat history
    const h = D.heat;
    new Chart(document.getElementById('heatChart'), {type:'line',
      data:{labels:h.dates, datasets:[{data:h.values, borderColor:C.spruce, borderWidth:2, pointRadius:0, tension:.3, fill:false},
        {data:h.values.map(()=>50), borderColor:C.gold, borderDash:[4,4], borderWidth:1.2, pointRadius:0}]},
      options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:{...tooltip, filter:i=>i.datasetIndex===0}},
        interaction:{mode:'index', intersect:false},
        scales:{x:{grid:{display:false}, ticks:{...yearTicks(h.dates), font:{size:11}}, border:{display:false}}, y:{display:false, min:0, max:100}}}});

    // months of supply
    const m = D.mos;
    new Chart(document.getElementById('mosChart'), {type:'bar',
      data:{labels:m.dates, datasets:[
        {type:'line', label:'Balanced (6 months)', data:m.dates.map(()=>6), borderColor:C.ink, borderDash:[5,4], borderWidth:1.2, pointRadius:0},
        {label:'Months of supply', data:m.values, backgroundColor:m.values.map(v=> v>6 ? 'rgba(62,107,87,.85)' : 'rgba(185,87,43,.75)'), borderRadius:2, barPercentage:.9, categoryPercentage:1}]},
      options:{responsive:true, maintainAspectRatio:false, interaction:{mode:'index', intersect:false},
        plugins:{legend:{display:false}, tooltip:{...tooltip, filter:i=>i.datasetIndex===1, callbacks:{label:c=>c.parsed.y+' months'}}},
        scales:{x:{grid:{display:false}, ticks:yearTicks(m.dates), border:{display:false}}, y:{grid:{color:C.line}, border:{display:false}, ticks:{maxTicksLimit:5}}}}});
  }

  // gauge
  function gauge(){
    const v = D.heat.values[D.heat.values.length-1];
    const needle = document.getElementById('needle');
    needle.style.transform = 'rotate(-90deg)';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ needle.style.transform = 'rotate(' + (-90 + v*1.8) + 'deg)'; }));
  }

  // ladder
  function ladder(town){
    const L = D.ladder[town]; const max = Math.max(...Object.values(D.ladder).flatMap(t=>Object.values(t).map(x=>x.value)));
    const el = document.getElementById('ladder');
    el.innerHTML = ['1','2','3','4','5'].map(b=>{
      const r = L[b]; const up = r.yoy >= 0;
      return `<div class="rung"><span class="rung-beds">${b==='5'?'5+':b} BR</span><span class="rung-bar"><i data-w="${(r.value/max*100).toFixed(1)}"></i></span><span class="rung-val">${fmtK(r.value)}</span><span class="chip ${up?'up':'dn'}">${up?'▲':'▼'} ${Math.abs(r.yoy).toFixed(1)}%</span></div>`;
    }).join('');
    requestAnimationFrame(()=>requestAnimationFrame(()=> el.querySelectorAll('i').forEach(i=> i.style.width = i.dataset.w + '%')));
  }
  document.querySelectorAll('.seg button').forEach(b=> b.addEventListener('click', ()=>{
    document.querySelectorAll('.seg button').forEach(x=>x.setAttribute('aria-selected', x===b));
    ladder(b.dataset.town);
  }));

  // calculator
  const ex = {1:180, 2:230, 3:300, 4:380, 5:520};
  const $ = id => document.getElementById(id);
  const bar = $('monthBar'); bar.innerHTML = Array.from({length:30}, ()=>'<span></span>').join('');
  $('cMort').value = D.rate;
  let rateTouched = false;
  function fill(){
    const t = $('cTown').value, b = $('cBeds').value;
    $('cPrice').value = Math.round(D.ladder[t][b].value/1000)*1000;
    if (!rateTouched) $('cRate').value = ex[b];
    calc();
  }
  function calc(){
    const price = +$('cPrice').value || 0, down = (+$('cDown').value||0)/100, r = (+$('cMort').value||0)/1200, n = 360;
    const P = price*(1-down);
    const pay = r>0 ? P*r/(1-Math.pow(1+r,-n)) : P/n;
    const fixed = +$('cFixed').value || 0, nightly = +$('cRate').value || 0, varc = (+$('cVar').value||0)/100;
    const total = pay + fixed; const net = nightly*(1-varc);
    const nights = net>0 ? total/net : Infinity;
    const shown = isFinite(nights) ? (nights>30.4 ? '30+' : nights.toFixed(1)) : '—';
    $('rNights').textContent = shown;
    $('rOcc').textContent = isFinite(nights) ? Math.min(100, nights/30.4*100).toFixed(0)+'%' : '—';
    $('rPay').textContent = fmt$(pay);
    $('rCost').textContent = fmt$(total);
    const KR = window.CONTENT && window.CONTENT.rates;
    if (KR && KR.occ && KR.occ.length){ const avg = Math.round(KR.occ.reduce((a,b)=>a+b,0)/KR.occ.length); const cmp = $('rCmp'); if (cmp) cmp.textContent = `For comparison, Sevier County Airbnb listings averaged ${avg}% occupancy over the past 12 months (AirROI).`; }
    const on = isFinite(nights) ? Math.min(30, Math.ceil(nights)) : 0;
    bar.querySelectorAll('span').forEach((s,i)=> s.classList.toggle('on', i < on));
  }
  $('cTown').addEventListener('change', fill);
  $('cBeds').addEventListener('change', ()=>{ rateTouched=false; fill(); });
  $('cRate').addEventListener('input', ()=>{ rateTouched=true; calc(); });
  ['cPrice','cDown','cMort','cVar','cFixed'].forEach(id=> $(id).addEventListener('input', calc));

  // poll
  document.querySelectorAll('.poll-opts button').forEach(b=> b.addEventListener('click', ()=>{
    document.querySelector('.poll-opts').hidden = true;
    document.querySelector('.poll-res').hidden = false;
  }));

  // reveal
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} }), {threshold:.12}) : null;
  document.querySelectorAll('.story, .rule, .kpi, .noise-item, .trio-grid>article, .ps-card, .att, .dolly, .cam, .npscam, .fr, .tool, .market .panel').forEach(el=>{ if(io){ el.classList.add('reveal'); io.observe(el);} });

  // live NPS stills: refresh every 15 minutes without a page reload
  setInterval(()=>document.querySelectorAll('.np-img img').forEach(im=>{ im.src = im.src.split('?')[0] + '?t=' + Date.now(); }), 9e5);

  // market report text, all from data.js (rebuilt every morning by scripts/build_market.js)
  function words(){
    const MON = ['Jan','Feb','Mar','Apr','May','June','July','Aug','Sept','Oct','Nov','Dec'];
    const FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const ym = s => ({y:+s.slice(0,4), m:+s.slice(5,7)-1});
    const nice = s => { const d = ym(s); return MON[d.m] + ' ' + d.y; };
    const set = (id, v, html) => { const e = document.getElementById(id); if (e) e[html ? 'innerHTML' : 'textContent'] = v; };
    const pct = v => (v >= 0 ? '+' : '\u2212') + Math.abs(v).toFixed(Math.abs(v) < 10 ? 1 : 0) + '%';
    const a = ym(D.asof);
    set('mrKicker', `Market Report \u00b7 ${FULL[a.m]} ${a.y}`);
    set('mrNext', `Next update mid-${FULL[(a.m + 2) % 12]}`);
    const hv = D.heat.values, h = hv[hv.length-1], lbl = h < 45 ? "Buyer's market" : h > 55 ? "Seller's market" : 'Balanced market';
    const hmax = Math.max(...hv), hi = hv.indexOf(hmax);
    set('mrHeat', h); set('mrHeatLbl', lbl);
    const g = document.getElementById('mrGauge'); if (g) g.setAttribute('aria-label', `Market gauge at ${h} out of 100, ${h < 45 ? 'favoring buyers' : h > 55 ? 'favoring sellers' : 'balanced'}`);
    set('mrHeatNote', `Peaked at ${hmax} in ${nice(D.heat.dates[hi])}. Zillow's market heat index; 50 is balanced.`);
    const G = D.gap, n = G.top.length - 1, tmax = Math.max(...G.top), ti = G.top.indexOf(tmax);
    const tch = (G.top[n] / tmax - 1) * 100, bch = (G.bottom[n] / G.bottom[n-12] - 1) * 100;
    const tnum = document.getElementById('mrTopNum'), bnum = document.getElementById('mrBotNum');
    if (ti < n - 1){ set('mrTopNum', pct(tch)); set('mrTopTxt', `Top third since its ${nice(G.dates[ti])} peak (${fmtK(tmax)} \u2192 ${fmtK(G.top[n])})`); if (tnum) tnum.className = 'c-num ' + (tch < 0 ? 'neg' : 'pos'); }
    else { const t12 = (G.top[n] / G.top[n-12] - 1) * 100; set('mrTopNum', pct(t12)); set('mrTopTxt', `Top third, past 12 months (${fmtK(G.top[n])}), a new high`); if (tnum) tnum.className = 'c-num ' + (t12 < 0 ? 'neg' : 'pos'); }
    set('mrBotNum', pct(bch)); set('mrBotTxt', `Bottom third, past 12 months (${fmtK(G.bottom[n])})`); if (bnum) bnum.className = 'c-num ' + (bch < 0 ? 'neg' : 'pos');
    const mv = D.mos.values, mos = mv[mv.length-1], mmin = Math.min(...mv), mi = mv.indexOf(mmin);
    set('mrMos', `${mos} <span>months</span>`, true);
    set('mrMosNote', `Homes for sale \u00f7 monthly sales. Under 6 favors sellers, over 6 favors buyers. Was ${mmin} in ${nice(D.mos.dates[mi])}.`);
    if (D.ladderAsof){ const l = ym(D.ladderAsof); set('mrLadNote', `Typical home value by bedroom count, change vs. ${FULL[l.m]} ${l.y - 1}.`); }
    set('tMkVal', `${h}<small>/100</small>`, true);
    set('tMkSub', `${lbl} \u00b7 under 50 favors buyers`);
    // plain-language lines, written from the numbers (no AI)
    const up = v => (v >= 0 ? 'up ' : 'down ') + Math.abs(v).toFixed(Math.abs(v) < 10 ? 1 : 0) + '%';
    const topLine = ti < n - 1 ? `Higher-priced homes are ${up(tch)} from their ${FULL[ym(G.dates[ti]).m]} ${ym(G.dates[ti]).y} peak` : `Higher-priced homes are at a new high`;
    const mosLine = mos > 6 ? `Homes are taking longer to sell, with ${mos} months of supply (6 is balanced).` : `Homes are selling quickly, with ${mos} months of supply (6 is balanced).`;
    set('mrSum', `<b>In plain terms:</b> ${lbl.toLowerCase()}. ${topLine}, while lower-priced homes are ${up(bch)} over the past year. ${mosLine}`, true);
    set('mrHeatMean', '<b>What it means:</b> ' + (h < 45 ? 'more homes than buyers. A good time to buy and negotiate; slower to sell.' : h > 55 ? 'more buyers than homes. Sellers have the upper hand; buyers should move quickly.' : 'neither buyers nor sellers have a clear edge right now.'), true);
    const topNow = ti < n - 1 ? tch : (G.top[n] / G.top[n-12] - 1) * 100;
    set('mrGapMean', '<b>What it means:</b> ' + (topNow < bch ? 'higher-priced homes have lost the most ground. Lower-priced homes are holding their value better.' : 'higher-priced homes are gaining faster than lower-priced ones.'), true);
    set('mrMosMean', '<b>What it means:</b> ' + (mos > 6 ? 'if you list now, expect a longer wait and more room for buyers to negotiate.' : 'listings are moving fast. Sellers have the edge.'), true);
    if (D.rate_date){ const r = new Date(D.rate_date + 'T12:00:00'); set('mrRate', `${D.rate}%, ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][r.getMonth()]} ${r.getDate()}, ${r.getFullYear()}`); }
  }

  words(); charts(); gauge(); ladder('Gatlinburg'); fill();
})();

/* ===== freshness, videos, events, nightly rates ===== */
(function(){
  const K = window.CONTENT; if(!K) return;
  const today = new Date(K.today + 'T12:00:00');
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const day = s => new Date(s + 'T12:00:00');

  // "new" headlines: published within the last 2 days (in production: since your last visit, stored on your device)
  let n = 0;
  document.querySelectorAll('.hl-list a').forEach(a=>{
    const age = (today - day(a.dataset.date)) / 864e5;
    if (age <= 1.5){ a.parentElement.classList.add('is-new'); n++; }
  });
  const pill = document.getElementById('newPill');
  if (pill) pill.textContent = n + ' new headlines today';

  // lite YouTube embeds: thumbnail first, real player loads on click
  document.querySelectorAll('.yt').forEach(b=> b.addEventListener('click', ()=>{
    const f = document.createElement('iframe');
    f.src = b.dataset.channel ? 'https://www.youtube-nocookie.com/embed/live_stream?channel=' + b.dataset.channel + '&autoplay=1' : 'https://www.youtube-nocookie.com/embed/' + b.dataset.id + '?autoplay=1&rel=0';
    f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture'; 
    f.title = b.getAttribute('aria-label');
    b.replaceChildren(f); b.style.cursor = 'default';
  }, {once:true}));

  // events: rolling six-month strip (today through the end of the sixth month)
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 7, 1);
  const from = today, span = end - from;
  const pct = d => Math.max(0, Math.min(100, (d - from) / span * 100));
  const strip = document.getElementById('evStrip');
  if (strip){
    let ticks = '';
    for (let i=1;i<7;i++){ const m = new Date(start.getFullYear(), start.getMonth()+i, 1); ticks += `<span class="ev-tick" style="left:${pct(m)}%">${MON[m.getMonth()]}${m.getMonth()===0?' ’'+String(m.getFullYear()).slice(2):''}</span>`; }
    const rows = K.spans.filter(e=> day(e.e) >= from && day(e.s) < end).map(e=>{
      const l = pct(day(e.s)), r = pct(day(e.e)), w = Math.max(r-l, 1.5);
      const right = l > 55; const pos = right ? `right:${(100-r).toFixed(2)}%` : `left:${l.toFixed(2)}%`;
      const ongoing = day(e.s) < from;
      return `<a class="ev-row c-${e.c}" href="${e.u}" target="_blank" rel="noopener" title="${e.t}"><span class="ev-lbl" style="${pos};text-align:${right?'right':'left'}">${e.sh||e.t}${ongoing?' <em>on now</em>':''}</span><span class="ev-track"><i style="left:${l.toFixed(2)}%;width:${w.toFixed(2)}%"></i></span></a>`;
    }).join('');
    const firstTick = pct(new Date(start.getFullYear(), start.getMonth()+1, 1)); const narrow = strip.clientWidth < 600;
    strip.innerHTML = `<div class="ev-axis"><span class="ev-tick ev-tick-now" style="left:0">${(narrow && firstTick < 14) ? '' : 'Today'}</span>${ticks}</div><div class="ev-rows">${rows}</div>`;
  }

  // events: month tabs + month grid + agenda
  const label = {big:'Big draw', fest:'Festival', conv:'Convention', meet:'City meeting', park:'Park', civic:'Community'};
  const WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = Array.from({length:7}, (_,i)=> new Date(start.getFullYear(), start.getMonth()+i, 1));
  const sameMonth = (d,m) => d.getMonth()===m.getMonth() && d.getFullYear()===m.getFullYear();
  const evDays = e => { const out=[]; const a=day(e.d), b=e.e?day(e.e):a; for(let d=new Date(a); d<=b; d.setDate(d.getDate()+1)) if(!e.wd || e.wd.includes(d.getDay())) out.push(new Date(d)); return out; };
  const fmtRange = e => { const a = day(e.d); if(!e.e) return ''; const b = day(e.e); return a.getMonth()===b.getMonth() ? `${MON[a.getMonth()]} ${a.getDate()}–${b.getDate()}` : `${MON[a.getMonth()]} ${a.getDate()} – ${MON[b.getMonth()]} ${b.getDate()}`; };
  const st = {m:0, c:'all'};
  const inCat = e => st.c==='all' || e.c===st.c;
  const inMonth = (e,m) => evDays(e).some(d=> sameMonth(d,m));

  function renderTabs(){
    const t = document.getElementById('evTabs'); if(!t) return;
    t.innerHTML = months.map((m,i)=>{ const n = K.events.filter(e=> inCat(e) && inMonth(e,m)).length;
      return `<button role="tab" aria-selected="${i===st.m}" data-i="${i}"><b>${MON[m.getMonth()]}</b><small>${n}</small></button>`; }).join('');
    t.querySelectorAll('button').forEach(b=> b.addEventListener('click', ()=>{ st.m = +b.dataset.i; renderAll(); }));
  }
  function renderCal(m, list){
    const box = document.getElementById('evCal'); if(!box) return;
    const byDay = {};
    list.forEach(e=> evDays(e).forEach(d=>{ if(sameMonth(d,m)){ (byDay[d.getDate()] ||= []).push(e.c); } }));
    const first = new Date(m.getFullYear(), m.getMonth(), 1).getDay();
    const dim = new Date(m.getFullYear(), m.getMonth()+1, 0).getDate();
    let cells = '';
    for (let i=0;i<first;i++) cells += '<span class="cd cd-x"></span>';
    for (let d=1; d<=dim; d++){
      const dt = new Date(m.getFullYear(), m.getMonth(), d, 12); const wd = dt.getDay();
      const cs = [...new Set(byDay[d]||[])].slice(0,3);
      const cls = ['cd', (wd===5||wd===6)?'cd-wk':'', dt.toDateString()===today.toDateString()?'cd-today':'', dt<today && dt.toDateString()!==today.toDateString()?'cd-past':'', cs.length?'cd-has':''].join(' ');
      cells += cs.length ? `<button class="${cls}" data-d="${d}" aria-label="${MON[m.getMonth()]} ${d}: ${byDay[d].length} event${byDay[d].length>1?'s':''}"><b>${d}</b><span class="cd-dots">${cs.map(c=>`<i class="c-${c}"></i>`).join('')}</span></button>` : `<span class="${cls}"><b>${d}</b></span>`;
    }
    box.innerHTML = `<div class="cal-head"><h3>${m.toLocaleString('en-US',{month:'long'})} <small>${m.getFullYear()}</small></h3><div class="cal-nav"><button type="button" data-step="-1" aria-label="Previous month" ${st.m===0?'disabled':''}>‹</button><button type="button" data-step="1" aria-label="Next month" ${st.m===months.length-1?'disabled':''}>›</button></div></div><div class="cal-grid">${WD.map(w=>`<span class="cw">${w[0]}</span>`).join('')}${cells}</div>`;
    box.querySelectorAll('[data-step]').forEach(b=> b.addEventListener('click', ()=>{ st.m = Math.max(0, Math.min(months.length-1, st.m + +b.dataset.step)); renderAll(); }));
    box.querySelectorAll('.cd-has').forEach(b=> b.addEventListener('click', ()=>{
      const d = b.dataset.d; box.querySelectorAll('.cd-on').forEach(x=>x.classList.remove('cd-on')); b.classList.add('cd-on');
      document.querySelectorAll('.ag-row').forEach(r=> r.classList.toggle('is-hl', r.dataset.days.split(',').includes(d)));
      const hit = document.querySelector('.ag-row.is-hl'); if (hit) hit.scrollIntoView({block:'nearest', behavior:'smooth'});
    }));
  }
  function renderAgenda(m, list){
    const box = document.getElementById('evAgenda'); if(!box) return;
    const items = list.filter(e=> inMonth(e,m)).sort((a,b)=> day(a.d)-day(b.d));
    const mEnd = new Date(m.getFullYear(), m.getMonth()+1, 0, 12);
    const ongoing = K.spans.filter(s=> day(s.s) <= mEnd && day(s.e) >= m);
    let h = `<div class="ag-head"><h3>${m.toLocaleString('en-US',{month:'long'})} <span>${items.length} ${items.length===1?'date':'dates'}</span></h3><p>Tap a date on the calendar to jump to it.</p></div>`;
    if (ongoing.length) h += `<div class="ag-ongoing"><span class="ag-ol">Running this month</span>${ongoing.map(s=>`<a href="${s.u}" target="_blank" rel="noopener" class="c-${s.c}">${s.sh||s.t}<small>${day(s.s)>m ? 'from '+MON[day(s.s).getMonth()]+' '+day(s.s).getDate() : 'through '+MON[day(s.e).getMonth()]+' '+day(s.e).getDate()}</small></a>`).join('')}</div>`;
    h += items.length ? '<div class="ag-list">' + items.map(e=>{
      const md = evDays(e).filter(x=>sameMonth(x,m)); const shown = md[0] || m; const days = md.map(x=>x.getDate()).join(',');
      const r = fmtRange(e); const tag = `<span class="ev-c c-${e.c}">${label[e.c]}</span>`;
      const inner = `<span class="ag-date"><b>${shown.getDate()}</b><small>${WD[shown.getDay()]}</small></span><span class="ag-main"><span class="ag-t">${e.t}</span><span class="ag-m">${e.p}${r?' · '+r:''}</span></span>${tag}`;
      return e.u ? `<a class="ag-row c-${e.c}" data-days="${days}" href="${e.u}" target="_blank" rel="noopener">${inner}</a>` : `<div class="ag-row c-${e.c}" data-days="${days}">${inner}</div>`;
    }).join('') + '</div>' : `<p class="ev-empty">No ${st.c==='all'?'':label[st.c].toLowerCase()+' '}dates listed for ${m.toLocaleString('en-US',{month:'long'})} yet. New dates are added every morning.</p>`;
    box.innerHTML = h;
  }
  function renderAll(){ const m = months[st.m]; const list = K.events.filter(inCat); renderTabs(); renderCal(m, list); renderAgenda(m, list); }
  document.querySelectorAll('.ev-filters button').forEach(b=> b.addEventListener('click', ()=>{
    document.querySelectorAll('.ev-filters button').forEach(x=> x.setAttribute('aria-pressed', x===b));
    st.c = b.dataset.c; renderAll();
  }));
  renderAll();

  // .ics calendar file (in production: a hosted calendar.ics rebuilt every morning, so subscribers get new dates automatically)
  const ics = document.getElementById('icsBtn');
  if (ics) ics.addEventListener('click', ()=>{
    const ymd = s => s.replace(/-/g,''); const next = s => { const d = day(s); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10).replace(/-/g,''); };
    const esc = t => t.replace(/[,;\\]/g, m=>'\\'+m);
    const all = K.events.map(e=>({s:e.d, e:e.e||e.d, t:e.t, p:e.p, u:e.u})).concat(K.spans.map(s=>({s:s.s, e:s.e, t:s.t, p:'Smoky Mountains', u:s.u})));
    const body = all.map((e,i)=>['BEGIN:VEVENT',`UID:tsb-${i}-${ymd(e.s)}@thesmokiesbrief.com`,`DTSTAMP:${ymd(K.today)}T060000Z`,`DTSTART;VALUE=DATE:${ymd(e.s)}`,`DTEND;VALUE=DATE:${next(e.e)}`,`SUMMARY:${esc(e.t)}`,`LOCATION:${esc(e.p)}`, e.u?`URL:${e.u}`:'', 'DESCRIPTION:From The Smokies Brief · thesmokiesbrief.com','END:VEVENT'].filter(Boolean).join('\r\n')).join('\r\n');
    const txt = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//The Smokies Brief//Events//EN\r\nX-WR-CALNAME:Smokies events (The Smokies Brief)\r\n${body}\r\nEND:VCALENDAR\r\n`;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt],{type:'text/calendar'})); a.download = 'smokies-events.ics'; document.body.appendChild(a); a.click(); a.remove();
  });

  // nightly rates chart
  const R = K.rates; const cv = document.getElementById('ratesChart');
  if (cv && window.Chart){
    const bg = R.adr.map((_,i)=> i===R.current ? '#B9572B' : 'rgba(62,107,87,.78)');
    const nowLabel = {id:'nowLabel', afterDatasetsDraw(ch){ const m = ch.getDatasetMeta(1).data[R.current]; if(!m) return; const {ctx} = ch; const top = ch.chartArea.top; ctx.save(); ctx.font = "700 11px Satoshi, sans-serif"; const tw = ctx.measureText('YOU ARE HERE').width + 14; ctx.fillStyle = '#B9572B'; ctx.beginPath(); ctx.roundRect(m.x - tw/2, top - 20, tw, 18, 4); ctx.fill(); ctx.beginPath(); ctx.moveTo(m.x-5, top-2); ctx.lineTo(m.x+5, top-2); ctx.lineTo(m.x, top+4); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('YOU ARE HERE', m.x, top - 11); ctx.restore(); const st = document.getElementById('seasonStrip'); if (st){ st.style.paddingLeft = ch.chartArea.left + 'px'; st.style.paddingRight = (ch.width - ch.chartArea.right) + 'px'; } }};
    new Chart(cv, {data:{labels:R.months, datasets:[
      {type:'line', label:'Occupancy', data:R.occ, yAxisID:'y1', borderColor:'#C9A65A', backgroundColor:'#C9A65A', borderWidth:2.5, pointRadius:3, pointHoverRadius:5, tension:.35},
      {type:'bar', label:'Nightly rate', data:R.adr, yAxisID:'y', backgroundColor:bg, borderRadius:6, barPercentage:.72}
    ]}, plugins:[nowLabel],
    options:{responsive:true, maintainAspectRatio:false, interaction:{mode:'index', intersect:false}, layout:{padding:{top:26}},
      plugins:{legend:{display:false}, tooltip:{backgroundColor:'#1D2420', padding:10, cornerRadius:8, displayColors:false, callbacks:{label:c=> c.dataset.yAxisID==='y' ? 'Nightly rate: $'+c.parsed.y : 'Occupancy: '+c.parsed.y+'%'}}},
      scales:{x:{grid:{display:false}, border:{display:false}, ticks:{autoSkip:false, maxRotation:0, font:{size: cv.clientWidth < 480 ? 10 : 12}}},
        y:{position:'left', min:0, max:800, grid:{color:'#E4DCCD'}, border:{display:false}, ticks:{callback:v=>'$'+v, maxTicksLimit:5}},
        y1:{position:'right', min:0, max:80, grid:{display:false}, border:{display:false}, ticks:{callback:v=>v+'%', maxTicksLimit:5}}}}});
  }
  const ss = document.getElementById('seasonStrip');
  if (ss) ss.innerHTML = R.season.map(s=>`<span class="s-${s}" data-s="${s[0]}"><i>${s}</i></span>`).join('');
})();

/* ===== right now: weather, park and dates from the hourly/morning refresh (scripts/build_now.js) ===== */
(function(){
  const K = window.CONTENT; if (!K || !K.now) return;
  const N = K.now, $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const day = s => new Date(s + 'T12:00:00'), today = day(K.today);
  const md = s => { const x = day(s); return MON[x.getMonth()] + ' ' + x.getDate(); };
  const clock = iso => { const x = new Date(iso); if (isNaN(x)) return ''; const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {timeZone:'America/New_York', hour:'numeric', minute:'2-digit', hour12:true}).formatToParts(x).map(q => [q.type, q.value])); return `${p.hour}:${p.minute} ${p.dayPeriod === 'AM' ? 'a.m.' : 'p.m.'}`; };
  const clip = (s, n) => { s = String(s || ''); return s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n)) + '…'; };
  const set = (id, v, html) => { const e = $(id); if (e && v != null && v !== '') e[html ? 'innerHTML' : 'textContent'] = v; };

  // issue and dates
  const mon = new Date(today); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  const issue = Math.max(1, Math.floor((mon - day('2026-11-16')) / 6048e5) + 1);
  set('issueDate', `Issue ${String(issue).padStart(2,'0')} · Week of ${MONTH[mon.getMonth()]} ${mon.getDate()}, ${mon.getFullYear()}`);
  set('updTime', K.updated);
  const pill = $('newPill'); if (pill && /^0 /.test(pill.textContent)) pill.hidden = true;

  // weather
  const W = N.weather || [];
  const rel = n => /^(today|tonight|this|overnight|late)/i.test(n) ? n.toLowerCase() : n;
  if (W.length > 1){
    set('tWxVal', `${W[0][1]}°`);
    set('tWxSub', `${W[0][2]} ${rel(W[0][0])} · ${W[1][1]}° ${rel(W[1][0])}`);
    set('wxList', W.slice(0,5).map(w => `<li><span class="wx-n">${esc(w[0])}</span><span class="wx-t">${esc(w[1])}°</span><span class="wx-f">${esc(w[2])}</span></li>`).join(''), true);
  }
  const wa = $('wxAlert');
  if (wa){
    const nws = 'https://forecast.weather.gov/MapClick.php?lat=35.7143&lon=-83.5102';
    if (N.wxAlerts === null){ wa.className = 'wx-ok wx-unk'; wa.innerHTML = `Couldn't reach the weather service for alerts just now. <a href="${nws}" target="_blank" rel="noopener">Check NWS →</a>`; }
    else if (N.wxAlerts && N.wxAlerts.length){ wa.className = 'wx-ok wx-warn'; wa.innerHTML = N.wxAlerts.map(a => `<a href="${nws}" target="_blank" rel="noopener"><b>${esc(a.event)}</b> ${esc(a.text)}</a>`).join(''); }
  }

  // park
  const P = N.park;
  if (P && P.length){
    const lbl = {'Danger':'Danger','Park Closure':'Closed','Caution':'Caution','Information':'Info'};
    const cls = {'Danger':'al-closed','Park Closure':'al-closed','Caution':'al-caution','Information':'al-info'};
    set('parkAlerts', P.map(a => {
      const recent = a.date && (today - day(a.date)) / 864e5 <= 30, ad = a.date && day(a.date);
      const since = ad && (ad.getFullYear() === today.getFullYear() ? md(a.date) : `${MON[ad.getMonth()]} ${ad.getFullYear()}`);
      return `<a class="alert-row ${cls[a.cat] || 'al-info'}" href="${esc(a.url)}" target="_blank" rel="noopener"><span class="al-cat">${lbl[a.cat] || esc(a.cat)}</span><span class="al-txt"><b>${esc(a.title)}</b>${a.text ? `<small>${esc(a.text)}</small>` : ''}</span><span class="al-d">${a.date ? (recent ? md(a.date) : 'Since ' + since) : ''}</span></a>`;
    }).join(''), true);
    const C = P.filter(a => a.cat === 'Park Closure' || a.cat === 'Danger'), tile = $('tPark');
    if (C.length){
      const t = C[0].title, m = t.match(/^(.*?)\s+(?:is\s+|are\s+)?closed/i), why = t.match(/due to (.+)$/i);
      set('tParkVal', clip(m ? m[1] + ' closed' : t, 40));
      const why2 = why ? why[1].toLowerCase().replace(/^./, c => c.toUpperCase()) : '';
      set('tParkSub', [why2, C.length > 1 ? `${C.length - 1} other closure${C.length > 2 ? 's' : ''}` : ''].filter(Boolean).join(' · ') || 'See the park alerts');
    } else if (tile){ tile.classList.remove('tile-warn'); set('tParkVal', 'No road closures'); set('tParkSub', 'Per the park\u2019s official alerts'); }
  }

  // Dollywood season
  const D = K.attractions && K.attractions.dollywood;
  if (D && D.seasons){
    const live = D.seasons.find(x => day(x.from) <= today && day(x.until) >= today);
    const next = D.seasons.filter(x => day(x.from) > today).sort((a,b) => a.from.localeCompare(b.from))[0];
    if (live){ set('tDwVal', live.name); set('tDwSub', `Through ${md(live.until)}`); }
    else if (next){ set('tDwVal', next.name); set('tDwSub', `Opens ${md(next.from)}`); }
  }

  // next big draw
  const E = (K.events || []).filter(e => (e.c === 'big' || e.c === 'fest') && day(e.d) >= today).sort((a,b) => a.d.localeCompare(b.d))[0];
  if (E){ const x = day(E.d); set('tNxVal', `${WD[x.getDay()]}, ${MON[x.getMonth()]} ${x.getDate()}`); set('tNxSub', clip(E.t.replace(/\s*\([^)]*\)/g, ''), 58)); }

  // honest timestamps
  const wt = N.weatherChecked && clock(N.weatherChecked), pt = N.parkChecked && clock(N.parkChecked);
  const bk = N.weatherSrc && N.weatherSrc !== 'NWS' ? ' (backup forecast)' : '';
  const line = wt && wt === pt ? `Weather${bk} and park alerts checked ${wt}` : [wt && `Weather${bk} checked ${wt}`, pt && `park alerts checked ${pt}`].filter(Boolean).join(', ');
  if (line) set('boardNote', `${line.replace(/\.$/, '')}. Power refreshes every 15 minutes.`);
})();
