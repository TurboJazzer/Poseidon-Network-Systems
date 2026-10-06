// Free guide forms (bill decoder, refurbished vs new). Works with any form[data-guide-form].
// Without JavaScript the form posts normally and the function redirects to /thank-you-guide.html.
(function () {
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function setErr(input, id, msg) {
    var el = document.getElementById(id);
    if (el) { el.textContent = msg || ''; el.hidden = !msg; }
    if (input) { if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); input.style.borderColor = msg ? '#B42318' : ''; }
  }
  document.addEventListener('input', function (e) {
    var f = e.target.form;
    if (!f || !f.hasAttribute('data-guide-form') || !e.target.getAttribute('aria-invalid')) return;
    var k = f.getAttribute('data-guide-form');
    if (e.target.name === 'name' && e.target.value.trim()) setErr(e.target, k + '-name-e');
    if (e.target.name === 'email' && EMAIL.test(e.target.value.trim())) setErr(e.target, k + '-email-e');
    if (e.target.name === 'consent' && e.target.checked) setErr(e.target, k + '-consent-e');
  });
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f.hasAttribute || !f.hasAttribute('data-guide-form')) return;
    e.preventDefault();
    var k = f.getAttribute('data-guide-form');
    var q = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (n) { if (f[n] && !f[n].value) f[n].value = q.get(n) || ''; });
    var name = f.elements.name, email = f.elements.email, consent = f.elements.consent, ok = true;
    setErr(name, k + '-name-e', name.value.trim() ? '' : 'Please enter your first name.');
    setErr(email, k + '-email-e', EMAIL.test(email.value.trim()) ? '' : 'Enter a valid email address, like name@company.co.za.');
    setErr(consent, k + '-consent-e', consent.checked ? '' : 'Please tick the box so we can email you the guide.');
    if (!name.value.trim() || !EMAIL.test(email.value.trim()) || !consent.checked) {
      var first = f.querySelector('[aria-invalid="true"]'); if (first) first.focus(); return;
    }
    var btn = f.querySelector('button[type="submit"]'), label = btn.textContent, fail = document.getElementById(k + '-fail');
    if (fail) fail.hidden = true;
    btn.disabled = true; btn.textContent = 'Sending\u2026'; btn.style.opacity = '0.8';
    fetch(f.action, { method: 'POST', body: new FormData(f), headers: { 'x-requested-with': 'fetch' } })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (d) {
        if (!d.ok) throw new Error(d.code || 'failed');
        f.hidden = true;
        var okBox = document.getElementById(k + '-ok');
        if (okBox) { okBox.hidden = false; var h = okBox.querySelector('[tabindex="-1"]'); if (h) h.focus(); }
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'lead_magnet_submitted', magnet: f.elements.magnet.value });
      })
      .catch(function (x) {
        var c = String(x && x.message);
        if (c === 'invalid_email') { setErr(email, k + '-email-e', 'Enter a valid email address, like name@company.co.za.'); email.focus(); }
        else if (fail) fail.hidden = false;
        btn.disabled = false; btn.textContent = label; btn.style.opacity = '1';
      });
  });
})();
