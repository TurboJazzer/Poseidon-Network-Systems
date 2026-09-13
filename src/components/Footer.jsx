import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer({ theme }) {
  return (
    <div id="contact" style={{ background: theme.footerBg, borderTop: `1px solid ${theme.footerBorder}` }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '56px 24px 32px', display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 40 }}>
        <div>
          <img src="/src/assets/pns_logo_new.png" alt="Poseidon Network Systems" style={{ height: 56, width: 'auto', objectFit: 'contain', marginBottom: 14 }} />
          <p style={{ fontSize: 13, color: theme.muted, lineHeight: 1.7, maxWidth: 320, margin: 0 }}>
            IT support, networks, and hardware for businesses and homes across Cape Town since 2004.
          </p>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: theme.headText, marginBottom: 14 }}>COMPANY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13, color: theme.muted }}>
            <Link to="/services" style={{ color: theme.muted }}>Services</Link>
            <Link to="/faq" style={{ color: theme.muted }}>FAQ</Link>
            <Link to="/#about" style={{ color: theme.muted }}>About</Link>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: theme.headText, marginBottom: 14 }}>CONTACT</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13, color: theme.muted }}>
            <span>Sea Point, Cape Town, 8000</span>
            <a href="tel:+27213008278" style={{ color: theme.muted }}>021 300 8278</a>
            <a href="https://wa.me/27647029962" style={{ color: theme.muted }}>WhatsApp</a>
            <span>Mon-Fri 07:30-17:30</span>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 24px', borderTop: `1px solid ${theme.footerBorder}`, fontSize: 12, color: '#94A0BF', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <span>© 2026 Poseidon Network Systems. All rights reserved.</span>
        <Link to="/terms" style={{ color: '#94A0BF' }}>Terms of Service</Link>
        <Link to="/privacy" style={{ color: '#94A0BF' }}>Privacy Policy</Link>
      </div>
    </div>
  );
}
