// Netlify Function: /api/send-quote (mapped via netlify.toml redirect from /.netlify/functions/send-quote)
// Emails quote-request form submissions via Resend.
// Requires a RESEND_API_KEY environment variable set in Netlify (Site settings > Environment variables).

const TO_EMAIL = 'quotes@poseidon-network.com';
const FROM_EMAIL = 'quotes@poseidon-network.com';

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'not_configured' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { name, company, email, phone, need, message } = data;
  if (!name || !email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const html = `
    <h2>New quote request — Poseidon Network Systems</h2>
    <p><strong>Name:</strong> ${esc(name)}</p>
    <p><strong>Company:</strong> ${esc(company) || 'N/A'}</p>
    <p><strong>Email:</strong> ${esc(email)}</p>
    <p><strong>Phone:</strong> ${esc(phone) || 'N/A'}</p>
    <p><strong>Need:</strong> ${esc(need) || 'N/A'}</p>
    <p><strong>Message:</strong><br/>${esc(message) || 'N/A'}</p>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: `Poseidon Network Systems <${FROM_EMAIL}>`,
        to: [TO_EMAIL],
        reply_to: email,
        subject: `New quote request from ${name}`,
        html
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend API error:', res.status, errText);
      return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'send_failed' }) };
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('send-quote function error:', err);
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'exception' }) };
  }
};
