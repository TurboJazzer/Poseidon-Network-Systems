import React from 'react';
import { Link } from 'react-router-dom';

export default function Nav({ theme, dark, onToggleDark }) {
  const linkStyle = { fontSize: 14, fontWeight: 500, color: theme.navText, textDecoration: 'none' };
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 50, background: theme.pageBg, borderBottom: `1px solid ${theme.navBorder}` }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <Link to="/"><img src="/src/assets/pns_logo_new.png" alt="Poseidon Network Systems" style={{ height: 64, width: 'auto', objectFit: 'contain' }} /></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/services" style={linkStyle}>Services</Link>
          <Link to="/#about" style={linkStyle}>About</Link>
          <Link to="/faq" style={linkStyle}>FAQ</Link>
          <Link to="/#contact" style={linkStyle}>Contact</Link>
          {onToggleDark && (
            <button onClick={onToggleDark} style={{ fontSize: 13, fontWeight: 600, color: theme.navText, background: 'transparent', border: `1px solid ${theme.navBorder}`, padding: '9px 14px', borderRadius: 4, cursor: 'pointer' }}>
              {dark ? 'Light mode' : 'Dark mode'}
            </button>
          )}
          <Link to="/#quote" style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: '#2D5BE3', padding: '10px 20px', borderRadius: 4, textDecoration: 'none' }}>Request a Quote</Link>
        </div>
      </div>
    </div>
  );
}
