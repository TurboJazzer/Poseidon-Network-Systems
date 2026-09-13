(function(){
  var KEY = 'pns_cookie_consent';

  function el(tag, attrs, children){
    var e = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === 'style') Object.assign(e.style, attrs[k]);
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function(c){ if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }

  function hide(){
    var bar = document.getElementById('pns-cookie-bar');
    if (bar) bar.remove();
  }

  function show(){
    hide();
    var bar = el('div', {
      id: 'pns-cookie-bar',
      style: {
        position: 'fixed', bottom: '0', left: '0', right: '0', zIndex: '9999',
        background: '#0D1B4B', borderTop: '1px solid #2D5BE3', padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap',
        fontFamily: "'Inter',sans-serif"
      }
    }, [
      el('p', { style: { margin: '0', fontSize: '13px', color: '#C4CCE6', maxWidth: '640px', lineHeight: '1.6' } , html: 'We use cookies to improve your experience and analyze site traffic. See our <a href="Privacy Policy.dc.html" style="color:#8FABF5;text-decoration:underline;">Privacy Policy</a> for details.' }),
      el('div', { style: { display: 'flex', gap: '10px', flexShrink: '0' } }, [
        el('button', {
          style: { background: 'transparent', border: '1px solid #2D5BE3', color: '#fff', fontSize: '13px', fontWeight: '600', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer' },
          onClick: function(){ localStorage.setItem(KEY, 'rejected'); hide(); }
        }, ['Reject']),
        el('button', {
          style: { background: '#2D5BE3', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '600', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer' },
          onClick: function(){
            localStorage.setItem(KEY, 'accepted');
            if (window.dataLayer) window.dataLayer.push({ event: 'cookie_consent_accepted' });
            hide();
          }
        }, ['Accept'])
      ])
    ]);
    document.body.appendChild(bar);
  }

  window.showCookieBanner = show;

  function init(){
    if (!localStorage.getItem(KEY)) show();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
