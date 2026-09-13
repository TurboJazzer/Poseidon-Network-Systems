import React, { useState } from 'react';
import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import WhatsAppIcon from '../components/WhatsAppIcon.jsx';
import { lightTheme, darkTheme } from '../theme.js';

const trustStats = [
  { value: '2004', label: 'FOUNDED' },
  { value: '20+', label: 'YEARS SERVING CAPE TOWN' },
  { value: '<24h', label: 'RESPONSE TIME' },
  { value: '1', label: 'PARTNER, EVERY LAYER' }
];

const servicesTeaser = [
  { title: 'New & Refurbished Hardware', desc: 'Refurbished Dell with onsite warranty, new Dell, or any hardware we can source.', color: '#0D1B4B' },
  { title: 'Managed IT Support', desc: 'Ongoing monitoring, troubleshooting, and a real person to call.', color: '#2D5BE3' },
  { title: 'Network Setup & Cabling', desc: 'Structured cabling, Wi-Fi, and network design built to last.', color: '#8FABF5' }
];

const steps = [
  { num: '01', title: 'Reach out', desc: 'Call, email, or submit a quote request with what you need.' },
  { num: '02', title: 'We assess', desc: 'A technician reviews your setup and scopes the right solution.' },
  { num: '03', title: 'We quote', desc: 'You get clear, competitive pricing within one business day.' },
  { num: '04', title: 'We deliver', desc: 'Install, repair, or ongoing support, handled and supported.' }
];

export default function Home() {
  const [dark, setDark] = useState(false);
  const [formStatus, setFormStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const theme = dark ? darkTheme : lightTheme;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormStatus(null);
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    try {
      // Replace with your real backend endpoint that forwards to Resend server-side.
      const ENDPOINT = '/api/send-quote';
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('failed');
      setFormStatus("Thanks — we'll be in touch within one business day.");
      e.target.reset();
    } catch {
      setFormStatus('Something went wrong. Please call or WhatsApp us instead.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", color: theme.bodyText, background: theme.pageBg, overflowX: 'hidden' }}>
      <Nav theme={theme} dark={dark} onToggleDark={() => setDark(d => !d)} />

      {/* HERO */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '88px 24px 72px', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 48, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#2D5BE3', padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', color: '#fff', marginBottom: 24 }}>
            SERVING CAPE TOWN &amp; THE WESTERN CAPE SINCE 2004
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 52, lineHeight: 1.08, fontWeight: 700, color: theme.headText, margin: '0 0 22px', letterSpacing: '-0.01em' }}>
            IT infrastructure that just keeps working.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: theme.bodyText, maxWidth: 520, margin: '0 0 32px' }}>
            Poseidon Network Systems is a Sea Point-based IT partner for businesses and homes across Cape Town. Networks, hardware sourced to fit your budget, and support handled by one dependable team.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <a href="#quote" style={{ background: '#0D1B4B', color: '#fff', fontWeight: 600, fontSize: 15, padding: '15px 28px', borderRadius: 4, display: 'inline-block', textDecoration: 'none' }}>Request a Quote</a>
            <a href="tel:+27213008278" style={{ border: `1.5px solid ${theme.headText}`, color: theme.headText, fontWeight: 600, fontSize: 15, padding: '15px 28px', borderRadius: 4, display: 'inline-block', textDecoration: 'none' }}>Call 021 300 8278</a>
            <a href="https://wa.me/27647029962" style={{ border: '1.5px solid #2D5BE3', color: '#2D5BE3', fontWeight: 600, fontSize: 15, padding: '15px 28px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <WhatsAppIcon /> WhatsApp
            </a>
          </div>
        </div>
        <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 6, overflow: 'hidden' }}>
          <img src="/src/assets/hero_photo_sm.jpg" alt="IT technician configuring Dell hardware" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      {/* TRUST STRIP */}
      <div style={{ background: '#0D1B4B' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, textAlign: 'center' }}>
          {trustStats.map((stat) => (
            <div key={stat.label}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: '#fff' }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#A8C0FB', marginTop: 4, letterSpacing: '0.03em' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SERVICES TEASER */}
      <div id="services" style={{ maxWidth: 1180, margin: '0 auto', padding: '96px 24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 32, marginBottom: 44, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 36, fontWeight: 700, color: theme.headText, margin: '0 0 14px', lineHeight: 1.15 }}>Full-spectrum IT, handled end to end</h2>
            <p style={{ fontSize: 16, color: theme.bodyText, lineHeight: 1.6, margin: 0 }}>From cabling a new office to keeping your backups running, our team qualifies in every layer of the stack so you deal with one partner, not five vendors.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <img src="/src/assets/services_logo.png" alt="Poseidon Network Systems" style={{ width: 180, height: 'auto', borderRadius: 8, flexShrink: 0 }} />
            <div style={{ background: theme.cardBg, padding: '16px 18px', borderRadius: 8, borderLeft: '4px solid #2D5BE3', maxWidth: 220 }}>
              <strong style={{ color: theme.headText, display: 'block', marginBottom: 4, fontSize: 13 }}>Our unfair advantage</strong>
              <p style={{ fontSize: 13, color: theme.muted, lineHeight: 1.5, margin: 0 }}>Refurbished Dell with onsite warranty first for price-conscious clients, new Dell for brand-aware buyers, plus any other IT hardware we can source.</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 1, background: theme.cardBorder, border: `1px solid ${theme.cardBorder}` }}>
          {servicesTeaser.map((svc) => (
            <div key={svc.title} style={{ background: theme.cardBg, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#2D5BE314', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 16, height: 16, background: svc.color, borderRadius: 3 }} />
              </div>
              <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, fontWeight: 600, color: theme.headText, margin: 0 }}>{svc.title}</h3>
              <p style={{ fontSize: 14, color: theme.muted, lineHeight: 1.6, margin: 0 }}>{svc.desc}</p>
            </div>
          ))}
        </div>
        <a href="/services" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 28, fontSize: 14, fontWeight: 600, color: '#2D5BE3', textDecoration: 'none' }}>View all services →</a>
      </div>

      {/* ABOUT */}
      <div id="about" style={{ background: '#0D1B4B' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '96px 24px', display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 56, alignItems: 'center' }}>
          <div style={{ aspectRatio: '1/1', borderRadius: 6, overflow: 'hidden' }}>
            <img src="/src/assets/about_photo_sm.jpg" alt="Poseidon Network Systems team working" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 34, fontWeight: 700, color: '#fff', margin: '0 0 18px', lineHeight: 1.2 }}>Two decades on the same street in Sea Point</h2>
            <p style={{ fontSize: 16, color: '#A8C0FB', lineHeight: 1.7, margin: '0 0 18px' }}>
              Founded in 2004, Poseidon Network Systems has grown alongside Cape Town's businesses and households, building networks, supplying hardware, and answering the phone when something breaks. Our technicians hold qualifications across every discipline we offer, so the person on-site is the person who understands your whole system.
            </p>
            <p style={{ fontSize: 16, color: '#A8C0FB', lineHeight: 1.7, margin: 0 }}>
              Whether it's a single home office or a multi-site business, we treat every client's uptime like our own.
            </p>
          </div>
        </div>
      </div>

      {/* PROCESS */}
      <div id="process" style={{ maxWidth: 1180, margin: '0 auto', padding: '96px 24px 80px' }}>
        <div style={{ maxWidth: 560, marginBottom: 52 }}>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 36, fontWeight: 700, color: theme.headText, margin: 0, lineHeight: 1.15 }}>Getting support is simple</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 32 }}>
          {steps.map((step) => (
            <div key={step.num}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 32, fontWeight: 700, color: '#2D5BE330', marginBottom: 12 }}>{step.num}</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.headText, margin: '0 0 8px' }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: theme.muted, lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* QUOTE */}
      <div id="quote" style={{ background: '#0D1B4B' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '96px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56 }}>
          <div>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 34, fontWeight: 700, color: '#fff', margin: '0 0 16px', lineHeight: 1.2 }}>Request a quote</h2>
            <p style={{ fontSize: 16, color: '#A8C0FB', lineHeight: 1.7, margin: '0 0 24px', maxWidth: 420 }}>
              Tell us what you need, network setup, hardware, or ongoing support, and we'll get back to you within one business day with competitive pricing.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: '#A8C0FB' }}>
              <div>Sea Point, Cape Town, 8000</div>
              <div>021 300 8278</div>
              <div><a href="https://wa.me/27647029962" style={{ color: '#A8C0FB', textDecoration: 'underline' }}>WhatsApp: 064 702 9962</a></div>
              <div>Mon-Fri, 07:30-17:30</div>
            </div>
          </div>
          <form onSubmit={handleSubmit} style={{ background: '#0D1B4B', border: '1px solid #2D5BE3', borderRadius: 8, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <input name="name" placeholder="Name" aria-label="Name" required style={inputStyle} />
              <input name="company" placeholder="Company (optional)" aria-label="Company (optional)" style={inputStyle} />
            </div>
            <input name="email" type="email" placeholder="Email" aria-label="Email" required style={inputStyle} />
            <input name="phone" type="tel" placeholder="Phone" aria-label="Phone" style={inputStyle} />
            <select name="need" aria-label="What do you need?" style={{ ...inputStyle, color: '#A8C0FB' }} defaultValue="">
              <option value="" disabled>What do you need?</option>
              <option>Managed IT support</option>
              <option>Network setup &amp; cabling</option>
              <option>Hardware sales</option>
              <option>Repairs &amp; maintenance</option>
              <option>Backup &amp; business continuity</option>
              <option>Something else</option>
            </select>
            <textarea name="message" placeholder="Tell us a bit more..." aria-label="Additional details" rows={3} style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} />
            <button type="submit" disabled={submitting} style={{ background: '#2D5BE3', color: '#fff', fontWeight: 600, fontSize: 15, padding: 14, borderRadius: 4, border: 'none', cursor: 'pointer', marginTop: 4 }}>
              {submitting ? 'Sending...' : 'Send Request'}
            </button>
            {formStatus && <p style={{ margin: 0, fontSize: 13, color: '#A8C0FB' }}>{formStatus}</p>}
          </form>
        </div>
      </div>

      <Footer theme={theme} />
    </div>
  );
}

const inputStyle = {
  background: '#0D1B4B',
  border: '1px solid #2D5BE3',
  borderRadius: 4,
  padding: '12px 14px',
  color: '#fff',
  fontSize: 14
};
