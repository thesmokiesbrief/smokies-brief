/* Big weekend alerts signup + next alert dates. Data: data/big-weekends.json (rebuilt every morning). */
(function () {
  const box = document.getElementById('bwa'); if (!box) return;
  const cfg = window.SB_CONFIG || {};
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmt = s => { const d = new Date(s + 'T12:00:00'); return `${MON[d.getMonth()]} ${d.getDate()}`; };
  const today = new Date().toISOString().slice(0, 10);
  const list = document.getElementById('bwaNext');
  fetch('data/big-weekends.json', { cache: 'no-cache' }).then(r => r.json()).then(d => {
    const next = d.alerts.filter(a => a.alert_on >= today).slice(0, 4);
    list.innerHTML = next.map(a => `<li><span class="bwa-d"><small>Alert</small><b>${fmt(a.alert_on)}</b></span><span class="bwa-t"><b>${a.short || a.title}</b><small>${a.dates} · ${a.place}</small></span></li>`).join('') || '<li>No alerts scheduled yet.</li>';
  }).catch(() => { list.innerHTML = '<li>Alert dates load when the site is live.</li>'; });

  // Calendar subscription: webcal on the live domain so it updates itself; plain download elsewhere
  const cal = document.getElementById('bwaCal');
  if (/thesmokiesbrief\.com$/.test(location.hostname)) cal.href = 'webcal://' + location.host + '/data/big-weekends.ics';
  else cal.href = 'data/big-weekends.ics';

  const form = document.getElementById('bwaForm'), msg = document.getElementById('bwaMsg');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = form.email.value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) { msg.textContent = 'Please enter a valid email address.'; msg.className = 'bwa-msg err'; return; }
    if (!cfg.kitAlertsFormId) { msg.textContent = 'Email alerts start when the site launches. For now, add the alerts to your calendar below.'; msg.className = 'bwa-msg'; return; }
    const btn = form.querySelector('button'); btn.disabled = true; btn.textContent = 'Signing you up\u2026';
    try {
      const fd = new FormData(); fd.append('email_address', email);
      await fetch(`https://app.kit.com/forms/${cfg.kitAlertsFormId}/subscriptions`, { method: 'POST', body: fd, mode: 'no-cors' });
      form.reset(); btn.textContent = 'You\u2019re signed up';
      msg.textContent = 'Check your inbox to confirm. Your first alert comes 30 days before the next big weekend.'; msg.className = 'bwa-msg ok';
    } catch (err) {
      btn.disabled = false; btn.textContent = 'Get alerts';
      msg.textContent = 'That didn\u2019t go through. Please try again.'; msg.className = 'bwa-msg err';
    }
  });

  // Weekly Monday Brief forms (hero and footer)
  document.querySelectorAll('form[data-kit="weekly"]').forEach(f => f.addEventListener('submit', async e => {
    e.preventDefault();
    const input = f.querySelector('input[type=email]'), btn = f.querySelector('button');
    const email = input.value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) { input.focus(); return; }
    if (!cfg.kitWeeklyFormId) { btn.textContent = 'Starts at launch'; return; }
    btn.disabled = true;
    try {
      const fd = new FormData(); fd.append('email_address', email);
      await fetch(`https://app.kit.com/forms/${cfg.kitWeeklyFormId}/subscriptions`, { method: 'POST', body: fd, mode: 'no-cors' });
      f.reset(); btn.textContent = 'Check your inbox';
    } catch (err) { btn.disabled = false; btn.textContent = 'Try again'; }
  }));
})();
