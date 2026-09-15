(function(){
  var open = false;
  var messages = [];
  var sending = false;

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

  var bubble, panel, msgList, input, sendBtn;

  function render(){
    msgList.innerHTML = '';
    messages.forEach(function(m){
      msgList.appendChild(el('div', { style: {
        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
        background: m.role === 'user' ? '#2D5BE3' : '#F6F8FD',
        color: m.role === 'user' ? '#fff' : '#0D1B4B',
        padding: '10px 14px', borderRadius: '10px', maxWidth: '80%', fontSize: '14px', lineHeight: '1.5'
      }}, [m.text]));
    });
    if (sending) {
      msgList.appendChild(el('div', { style: { alignSelf: 'flex-start', color: '#94A0BF', fontSize: '13px', padding: '4px 14px' } }, ['Typing...']));
    }
    msgList.scrollTop = msgList.scrollHeight;
  }

  async function send(){
    var text = input.value.trim();
    if (!text || sending) return;
    messages.push({ role: 'user', text: text });
    input.value = '';
    sending = true;
    render();
    try {
      // Backend endpoint: forwards to Claude (or another LLM) server-side, grounded on knowledge-base.json.
      // Replace with your real endpoint once deployed.
      var res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages })
      });
      if (!res.ok) throw new Error('failed');
      var data = await res.json();
      messages.push({ role: 'assistant', text: data.reply || "Sorry, I couldn't process that." });
    } catch (e) {
      messages.push({ role: 'assistant', text: "I'm having trouble connecting right now. Please WhatsApp us at 064 702 9962 or call 021 300 8278." });
    }
    sending = false;
    render();
  }

  function buildPanel(){
    msgList = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', overflowY: 'auto', flex: '1', background: '#fff' } });
    messages.push({ role: 'assistant', text: "Hi! I'm the Poseidon Network Systems assistant. Ask me about new or refurbished Dell hardware, IT support, or pricing." });

    input = el('input', { placeholder: 'Type a message...', style: { flex: '1', border: '1px solid #E4E9F5', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', fontFamily: "'Inter',sans-serif" }, onKeydown: function(e){ if (e.key === 'Enter') send(); } });
    sendBtn = el('button', { style: { background: '#2D5BE3', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }, onClick: send }, ['Send']);

    panel = el('div', { style: {
      position: 'fixed', bottom: '92px', right: '24px', width: '340px', maxWidth: 'calc(100vw - 32px)', height: '460px',
      background: '#fff', borderRadius: '14px', boxShadow: '0 24px 60px rgba(13,27,75,0.25)', border: '1px solid #E4E9F5',
      display: 'none', flexDirection: 'column', overflow: 'hidden', zIndex: '9998', fontFamily: "'Inter',sans-serif"
    }}, [
      el('div', { style: { background: '#2D5BE3', color: '#fff', padding: '14px 16px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' } }, [
        el('img', { src: 'assets/pns_logo_new_sm.png', alt: '', width: '24', height: '24', style: { width: '24px', height: '24px', objectFit: 'contain', flexShrink: '0' } }),
        el('span', {}, ['Poseidon Assistant'])
      ]),
      msgList,
      el('div', { style: { display: 'flex', gap: '8px', padding: '12px', borderTop: '1px solid #E4E9F5' } }, [input, sendBtn])
    ]);
    document.body.appendChild(panel);
    render();
  }

  function init(){
    bubble = el('button', {
      'aria-label': 'Open chat assistant',
      style: {
        position: 'fixed', bottom: '24px', right: '24px', width: '56px', height: '56px', borderRadius: '50%',
        background: '#2D5BE3', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer',
        boxShadow: '0 12px 30px rgba(13,27,75,0.3)', zIndex: '9999', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0'
      },
      onClick: function(){
        open = !open;
        if (!panel) buildPanel();
        panel.style.display = open ? 'flex' : 'none';
        bubble.innerHTML = '';
        bubble.appendChild(open ? el('span', { style: { fontSize: '24px', color: '#fff' } }, ['✕']) : el('img', { src: 'assets/pns_logo_new_sm.png', alt: 'Chat', width: '32', height: '32', style: { width: '32px', height: '32px', objectFit: 'contain', borderRadius: '50%' } }));
      }
    }, [el('img', { src: 'assets/pns_logo_new_sm.png', alt: 'Chat', width: '32', height: '32', style: { width: '32px', height: '32px', objectFit: 'contain', borderRadius: '50%' } })]);
    document.body.appendChild(bubble);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
