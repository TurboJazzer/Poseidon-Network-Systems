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
    var overlay = el('div', {
      id: 'pns-cookie-bar',
      style: {
        position: 'fixed', bottom: '24px', right: '24px', zIndex: '9999',
        fontFamily: "'Inter',sans-serif"
      }
    }, [
      el('div', {
        style: {
          background: '#0D1B4B', border: '1px solid #2D5BE3', borderRadius: '16px',
          padding: '32px', maxWidth: '380px', width: '100%',
          boxShadow: '0 24px 60px rgba(13,27,75,0.4)',
          display: 'flex', flexDirection: 'column', gap: '18px'
        }
      }, [
        el('h3', { style: { margin: '0', fontSize: '18px', fontWeight: '700', color: '#fff' } }, ['Cookie preferences']),
        el('p', { style: { margin: '0', fontSize: '13px', color: '#C4CCE6', lineHeight: '1.6' }, html: 'We use cookies to improve your experience and analyze site traffic. See our <a href="/privacy" style="color:#8FABF5;text-decoration:underline;">Privacy Policy</a> for details.' }),
        el('div', { style: { display: 'flex', gap: '10px', flexDirection: 'column' } }, [
          el('button', {
            style: { background: '#2D5BE3', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '600', padding: '12px 18px', borderRadius: '6px', cursor: 'pointer' },
            onClick: function(){
              localStorage.setItem(KEY, 'accepted');
              if (window.dataLayer) window.dataLayer.push({ event: 'cookie_consent_accepted' });
              hide();
            }
          }, ['Accept']),
          el('button', {
            style: { background: 'transparent', border: '1px solid #2D5BE3', color: '#fff', fontSize: '13px', fontWeight: '600', padding: '12px 18px', borderRadius: '6px', cursor: 'pointer' },
            onClick: function(){ localStorage.setItem(KEY, 'rejected'); hide(); }
          }, ['Reject'])
        ])
      ])
    ]);
    document.body.appendChild(overlay);
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
