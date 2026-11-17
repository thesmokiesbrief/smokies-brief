/* Power outages: reads data/power.json (written every 15 minutes by scripts/fetch_power.py)
   and draws the 48-hour chart, the hero tile and the outage map. */
(function(){
  const $ = id => document.getElementById(id);
  const fmtTime = iso => { if(!iso) return ''; const d = new Date(iso); return d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'}).replace('AM','a.m.').replace('PM','p.m.'); };
  const fmtDay = iso => new Date(iso).toLocaleString('en-US',{weekday:'short',hour:'numeric',timeZone:'America/New_York'}).replace(' AM',' a.m.').replace(' PM',' p.m.');
  let map = null, mapReady = false, county = null, live = null, demoOn = false;

  // Clearly labeled sample outages, only shown when the visitor presses "Show an example"
  const DEMO = {
    outages:[
      {lat:35.7245,lng:-83.5050,out:214,start:new Date(Date.now()-52*6e4).toISOString(),crew:true},
      {lat:35.7745,lng:-83.6105,out:88,start:new Date(Date.now()-25*6e4).toISOString(),crew:false},
      {lat:35.8390,lng:-83.5650,out:31,start:new Date(Date.now()-8*6e4).toISOString(),crew:false}
    ],
    polygons:{type:'FeatureCollection',features:[{type:'Feature',properties:{out:214},geometry:{type:'MultiPolygon',coordinates:[[[[-83.532,35.712],[-83.497,35.705],[-83.482,35.722],[-83.495,35.741],[-83.527,35.743],[-83.532,35.712]]]]}}]}
  };

  function render(d){
    live = d;
    const hourly = d.hourly.map(h=>h.n); const peak = Math.max(...hourly, 0);
    const pi = hourly.indexOf(peak); const peakT = d.hourly[pi] && d.hourly[pi].t;
    $('pwNow').textContent = d.outNow.toLocaleString();
    $('pwTime').textContent = 'Updated ' + fmtTime(d.updated || d.fetched);
    $('pwNote').textContent = `Of ${d.served.toLocaleString()} customers served by Sevier County Electric System, which covers Gatlinburg, Pigeon Forge and Sevierville. ` + (d.planned.length ? `${d.planned.length} planned outage${d.planned.length>1?'s':''} posted.` : 'No planned outages posted.');
    $('pwChart').innerHTML = hourly.map((v,i)=>`<i style="height:${Math.max(2, v/Math.max(peak,1)*100).toFixed(1)}%" title="${d.hourly[i].t ? fmtDay(d.hourly[i].t) : ''}: ${v} customers out"></i>`).join('');
    $('pwPeak').innerHTML = peak ? `Peak in the last 48 hours: <b>${peak.toLocaleString()} customers</b>${peakT ? ' around ' + fmtDay(peakT) : ''}`.replace(/\.?$/,'.') : 'No outages in the last 48 hours.';
    // hero tile
    if ($('tPwVal')) $('tPwVal').innerHTML = `${d.outNow.toLocaleString()}<small> out</small>`;
    if ($('tPwSub')) $('tPwSub').textContent = `Sevier County Electric · 48h peak ${peak.toLocaleString()}`;
    if ($('tPwSpark')) $('tPwSpark').innerHTML = `<polyline points="${hourly.map((v,i)=>`${(i*100/Math.max(hourly.length-1,1)).toFixed(1)},${(30-v/Math.max(peak,1)*28).toFixed(1)}`).join(' ')}" fill="none" stroke="#F2C9A8" stroke-width="1.6" vector-effect="non-scaling-stroke"/>`;
    drawOutages();
  }

  function current(){ return demoOn ? DEMO : (live || {outages:[],polygons:{type:'FeatureCollection',features:[]}}); }

  function pointsFC(list){
    return {type:'FeatureCollection', features:list.map(o=>({type:'Feature', geometry:{type:'Point',coordinates:[o.lng,o.lat]},
      properties:{out:o.out, label:o.out.toLocaleString(), start:o.start ? fmtTime(o.start) : '', crew:o.crew ? 'Crew assigned' : 'Crew not yet assigned'}}))};
  }

  function drawOutages(){
    const c = current(); const n = c.outages.length;
    const ov = $('pwOverlay');
    ov.hidden = n > 0;
    $('pwMap').classList.toggle('is-demo', demoOn);
    if (!mapReady) { drawSvg(); renderProps(); return; }
    map.getSource('outages').setData(pointsFC(c.outages));
    map.getSource('areas').setData(c.polygons);
    renderProps();
  }

  // --- MapLibre map (free OpenFreeMap tiles, no key) ---
  function initMap(){
    if (!window.maplibregl || !county) { drawSvg(); return; }
    try {
      map = new maplibregl.Map({container:'pwMap', style:'https://tiles.openfreemap.org/styles/positron', bounds:[[-83.80,35.58],[-83.24,36.02]], fitBoundsOptions:{padding:16}, attributionControl:{compact:true}, cooperativeGestures:true});
    } catch(e){ drawSvg(); return; }
    map.addControl(new maplibregl.NavigationControl({showCompass:false}), 'top-right');
    map.on('load', ()=>{
      map.addSource('county', {type:'geojson', data:county});
      map.addLayer({id:'county-fill', type:'fill', source:'county', paint:{'fill-color':'#3E6B57','fill-opacity':0.06}});
      map.addLayer({id:'county-line', type:'line', source:'county', paint:{'line-color':'#1F3329','line-width':1.6,'line-dasharray':[2,1.5]}});
      map.addSource('areas', {type:'geojson', data:{type:'FeatureCollection',features:[]}});
      map.addLayer({id:'areas-fill', type:'fill', source:'areas', paint:{'fill-color':'#B9572B','fill-opacity':0.22}});
      map.addLayer({id:'areas-line', type:'line', source:'areas', paint:{'line-color':'#B9572B','line-width':1.5}});
      map.addSource('outages', {type:'geojson', data:{type:'FeatureCollection',features:[]}});
      map.addLayer({id:'out-halo', type:'circle', source:'outages', paint:{'circle-color':'#B9572B','circle-opacity':0.18,'circle-radius':['interpolate',['linear'],['get','out'],1,14,100,24,1000,40]}});
      map.addLayer({id:'out-dot', type:'circle', source:'outages', paint:{'circle-color':'#B9572B','circle-stroke-color':'#fff','circle-stroke-width':2,'circle-radius':['interpolate',['linear'],['get','out'],1,8,100,13,1000,22]}});
      map.addLayer({id:'out-num', type:'symbol', source:'outages', layout:{'text-field':['get','label'],'text-size':11,'text-font':['Noto Sans Bold'],'text-allow-overlap':true}, paint:{'text-color':'#fff'}});
      map.on('click','out-dot', e=>{ const p = e.features[0].properties; new maplibregl.Popup({offset:12}).setLngLat(e.lngLat).setHTML(`<b>${p.label} customers out</b><br>${p.start ? 'Started ' + p.start + '<br>' : ''}${p.crew}`).addTo(map); });
      map.on('mouseenter','out-dot', ()=> map.getCanvas().style.cursor='pointer');
      map.on('mouseleave','out-dot', ()=> map.getCanvas().style.cursor='');
      map.on('click', e=>{ if (map.queryRenderedFeatures(e.point,{layers:['out-dot']}).length) return; addProp({label:'Pin at ' + e.lngLat.lat.toFixed(4) + ', ' + e.lngLat.lng.toFixed(4), lat:e.lngLat.lat, lng:e.lngLat.lng}); });
      mapReady = true; $('pwMap').classList.add('is-gl'); drawOutages();
    });
    map.on('error', ()=>{});
  }

  // --- Fallback: simple SVG map if WebGL or the tile service is unavailable ---
  function drawSvg(){
    const el = $('pwMap'); if (!county || el.classList.contains('is-gl')) return;
    const W=600,H=440, x0=-83.80,x1=-83.24,y0=35.58,y1=36.02;
    const k = Math.cos(35.8*Math.PI/180);
    const sx = W/((x1-x0)*k), sy = H/(y1-y0), s = Math.min(sx,sy);
    const ox = (W-(x1-x0)*k*s)/2, oy=(H-(y1-y0)*s)/2;
    const P = ([lng,lat]) => [(ox+(lng-x0)*k*s).toFixed(1), (oy+(y1-lat)*s).toFixed(1)];
    const ring = county.features[0].geometry.coordinates[0].map(P).map(p=>p.join(',')).join(' ');
    const towns = [['Gatlinburg',-83.5102,35.7143],['Pigeon Forge',-83.5543,35.7884],['Sevierville',-83.5618,35.8681],['Wears Valley',-83.6470,35.7290],['Kodak',-83.6199,35.9734]];
    const c = current();
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="pw-svg"><polygon points="${ring}" class="sv-county"/>`+
      towns.map(([n,lng,lat])=>{const [x,y]=P([lng,lat]);return `<circle cx="${x}" cy="${y}" r="3" class="sv-town"/><text x="${+x+7}" y="${+y+4}" class="sv-lbl">${n}</text>`;}).join('')+
      props.map(p=>{const [x,y]=P([p.lng,p.lat]); return `<rect x="${x-6}" y="${y-6}" width="12" height="12" rx="2" class="sv-prop"/>`;}).join('')+
      c.outages.map(o=>{const [x,y]=P([o.lng,o.lat]); const r=Math.min(22,7+Math.sqrt(o.out)); return `<circle cx="${x}" cy="${y}" r="${r+8}" class="sv-halo"/><circle cx="${x}" cy="${y}" r="${r}" class="sv-out"><title>${o.out} customers out</title></circle><text x="${x}" y="${+y+4}" class="sv-num">${o.out}</text>`;}).join('')+`</svg>`;
  }


  // ---------- "Does my cabin have power?" ----------
  const props = []; const markers = [];
  const R = 3958.8, rad = d => d*Math.PI/180;
  const miles = (a,b) => { const dl = rad(b.lat-a.lat), dn = rad(b.lng-a.lng); const h = Math.sin(dl/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dn/2)**2; return 2*R*Math.asin(Math.sqrt(h)); };
  const inRing = (pt, ring) => { let ins = false; for (let i=0, k=ring.length-1; i<ring.length; k=i++){ const [xi,yi] = ring[i], [xk,yk] = ring[k]; if (((yi>pt.lat) !== (yk>pt.lat)) && (pt.lng < (xk-xi)*(pt.lat-yi)/(yk-yi)+xi)) ins = !ins; } return ins; };
  const inGeom = (pt, g) => { const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates; return polys.some(p => inRing(pt, p[0]) && !p.slice(1).some(h => inRing(pt, h))); };
  function status(p){
    if (county && !inGeom(p, county.features[0].geometry)) return {k:'na', t:'Outside Sevier County Electric’s area', d:'This spot looks outside Sevier County. Check with the utility that serves it.'};
    const c = current();
    const area = c.polygons.features.find(f => inGeom(p, f.geometry));
    if (area) return {k:'off', t:'Likely without power', d:`Inside a reported outage area with ${(area.properties.out||0).toLocaleString()} customers out.`};
    let best = null; c.outages.forEach(o => { const d = miles(p, o); if (!best || d < best.d) best = {d, o}; });
    if (best && best.d <= 0.5) return {k:'near', t:'Outage reported nearby', d:`${best.o.out.toLocaleString()} customers out about ${best.d.toFixed(1)} mi away${best.o.start ? ', since ' + fmtTime(best.o.start) : ''}. ${best.o.crew ? 'A crew is assigned.' : 'No crew assigned yet.'}`};
    if (best && best.d <= 2) return {k:'watch', t:'Outage in the area', d:`The closest outage is ${best.d.toFixed(1)} mi away (${best.o.out.toLocaleString()} customers). Your cabin may still have power.`};
    return {k:'on', t:'No outages reported near here', d: best ? `The closest reported outage is ${best.d.toFixed(1)} mi away.` : 'No outages are reported anywhere in Sevier County right now.'};
  }
  function renderProps(){
    const ul = $('pcList'); if (!ul) return;
    ul.innerHTML = props.map((p,i) => { const s = status(p); return `<li class="pc-item pc-${s.k}"><span class="pc-dot" aria-hidden="true"></span><span class="pc-txt"><b>${s.t}</b><span class="pc-addr">${p.label}</span><small>${s.d}</small></span><button type="button" class="pc-x" data-i="${i}" aria-label="Remove ${p.label}">×</button></li>`; }).join('');
    ul.querySelectorAll('.pc-x').forEach(b => b.addEventListener('click', () => { props.splice(+b.dataset.i, 1); syncProps(); }));
    markers.forEach(m => m.remove()); markers.length = 0;
    if (mapReady) props.forEach(p => { const s = status(p); const el = document.createElement('div'); el.className = 'pc-pin pc-' + s.k; el.title = p.label + ': ' + s.t; markers.push(new maplibregl.Marker({element:el}).setLngLat([p.lng, p.lat]).addTo(map)); });
    const save = $('pcSave'); if (save){ save.hidden = !props.length; const url = location.href.split('#')[0] + '#cabins=' + encodeURIComponent(JSON.stringify(props.map(p => [p.label, +p.lat.toFixed(5), +p.lng.toFixed(5)]))); $('pcLink').href = url; }
  }
  function syncProps(){ renderProps(); if (!mapReady) drawSvg(); try { history.replaceState(null, '', props.length ? $('pcLink').getAttribute('href') : location.href.split('#')[0]); } catch(_){} }
  function addProp(p){ props.push(p); syncProps(); if (mapReady) map.easeTo({center:[p.lng, p.lat], zoom:Math.max(map.getZoom(), 11)}); }

  // Free U.S. Census geocoder (JSONP, no key), with Photon (OpenStreetMap) as a fallback for new mountain roads
  function census(q){ return new Promise((res, rej) => { const cb = 'tsbGeo' + Date.now(); const s = document.createElement('script'); const t = setTimeout(() => { cleanup(); rej(new Error('timeout')); }, 9000);
    function cleanup(){ clearTimeout(t); delete window[cb]; s.remove(); }
    window[cb] = d => { cleanup(); const m = d && d.result && d.result.addressMatches && d.result.addressMatches[0]; m ? res({label:m.matchedAddress.toLowerCase().replace(/\b([a-z])/g, c=>c.toUpperCase()).replace(/, Tn, /, ', TN ').replace(/, Tn /, ', TN '), lat:m.coordinates.y, lng:m.coordinates.x}) : rej(new Error('nomatch')); };
    s.onerror = () => { cleanup(); rej(new Error('neterr')); };
    s.src = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?benchmark=Public_AR_Current&format=jsonp&callback=' + cb + '&address=' + encodeURIComponent(q); document.head.appendChild(s); }); }
  function photon(q){ return fetch('https://photon.komoot.io/api/?limit=1&lat=35.78&lon=-83.55&q=' + encodeURIComponent(q)).then(r => r.json()).then(d => { const f = d.features && d.features.find(f => f.properties.state === 'Tennessee'); if (!f) throw new Error('nomatch'); const pr = f.properties; return {label:[pr.housenumber, pr.street || pr.name, pr.city].filter(Boolean).join(' ').replace(/ (\S+)$/, ', $1') + ' (approx.)', lat:f.geometry.coordinates[1], lng:f.geometry.coordinates[0]}; }); }
  const form = $('pcForm');
  if (form) form.addEventListener('submit', async e => {
    e.preventDefault(); const inp = $('pcAddr'); let q = inp.value.trim(); if (!q) return;
    if (!/\b(TN|Tennessee)\b/i.test(q)) q += ', TN';
    const btn = form.querySelector('button'); btn.disabled = true; btn.textContent = 'Checking…';
    try { const p = await census(q).catch(() => photon(q)); addProp(p); inp.value = ''; }
    catch(_){ const ul = $('pcList'); ul.insertAdjacentHTML('afterbegin', `<li class="pc-item pc-na pc-err"><span class="pc-dot"></span><span class="pc-txt"><b>We couldn't find that address</b><small>Try adding the city, or tap the map where the cabin is.</small></span></li>`); setTimeout(() => { const er = ul.querySelector('.pc-err'); if (er) er.remove(); }, 6000); }
    btn.disabled = false; btn.textContent = 'Check power';
  });
  // restore cabins from a bookmarked link
  try { const m = location.hash.match(/cabins=([^&]+)/); if (m) JSON.parse(decodeURIComponent(m[1])).forEach(([label, lat, lng]) => props.push({label, lat, lng})); } catch(_){}

  $('pwDemo').addEventListener('click', e=>{
    demoOn = !demoOn; e.currentTarget.setAttribute('aria-pressed', demoOn);
    e.currentTarget.textContent = demoOn ? 'Example on · show live' : 'Show an example';
    drawOutages();
  });

  const load = () => fetch('data/power.json?t=' + Date.now()).then(r=>r.json()).then(render).catch(()=>{});
  Promise.all([fetch('data/sevier-county.geojson').then(r=>r.json()).catch(()=>null), load()]).then(([g])=>{ county = g; initMap(); });
  setInterval(load, 5*60*1000); // pick up each 15-minute refresh without a page reload
})();
