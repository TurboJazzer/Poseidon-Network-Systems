import React from 'react';
import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import { lightTheme } from '../theme.js';

const services = [
  { title: 'New & Refurbished Hardware', desc: 'Refurbished Dell units with onsite warranty for price-conscious clients, new Dell hardware for brand-aware buyers, and any other IT hardware we can source for your needs.', color: '#0D1B4B', shape: 'rotate(45deg)', badge: true },
  { title: 'Managed IT Support & Helpdesk', desc: 'Ongoing monitoring, troubleshooting, and a real person to call when something goes wrong.', color: '#2D5BE3', shape: 'none' },
  { title: 'Network Setup & Cabling', desc: 'Structured cabling, Wi-Fi, and network design for offices and homes, built to last.', color: '#8FABF5', shape: 'none', round: true },
  { title: 'Repairs & Maintenance', desc: 'Diagnostics and repair for desktops, laptops, servers, and everything in between.', color: '#2D5BE3', shape: 'none' },
  { title: 'Consumables & Supplies', desc: 'Toner, cabling, peripherals, and the everyday items that keep an office running.', color: '#8FABF5', shape: 'none', round: true },
  { title: 'Business Continuity & Backup', desc: 'Backup strategy and disaster recovery so downtime never means data loss.', color: '#0D1B4B', shape: 'rotate(45deg)' }
];

export default function Services() {
  const theme = lightTheme;
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", color: theme.bodyText, background: theme.pageBg, minHeight: '100vh' }}>
      <Nav theme={theme} />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '72px 24px 40px' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 42, fontWeight: 700, color: '#0D1B4B', margin: '0 0 14px' }}>Everything your IT stack needs, from one team</h1>
        <p style={{ fontSize: 16, color: '#5A6588', maxWidth: 640, margin: '0 0 56px', lineHeight: 1.6 }}>Hardware, network, support, and continuity — built and maintained by technicians who understand your whole system.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 1, background: '#E4E9F5', border: '1px solid #E4E9F5', marginBottom: 56 }}>
          {services.map((svc) => (
            <div key={svc.title} style={{ background: '#fff', padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#2D5BE314', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 16, height: 16, background: svc.color, borderRadius: svc.round ? '100%' : 3, transform: svc.shape }} />
              </div>
              <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, fontWeight: 600, color: '#0D1B4B', margin: 0 }}>{svc.title}</h3>
              <p style={{ fontSize: 14, color: '#5A6588', lineHeight: 1.6, margin: 0 }}>{svc.desc}</p>
              {svc.badge && <img src="/src/assets/dell_authorized_partner.png" alt="Dell Technologies Authorized Partner" style={{ height: 48, width: 'auto', objectFit: 'contain', marginTop: 4 }} />}
            </div>
          ))}
        </div>

        <div style={{ background: '#0D1B4B', borderRadius: 8, padding: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center', marginBottom: 80 }}>
          <div>
            <strong style={{ color: '#8FABF5', display: 'block', marginBottom: 8, fontSize: 13, letterSpacing: '0.06em' }}>OUR UNFAIR ADVANTAGE</strong>
            <p style={{ fontSize: 16, color: '#fff', lineHeight: 1.7, margin: 0 }}>Refurbished Dell with onsite warranty first, for price-conscious clients — new Dell for brand-aware buyers, plus any other IT hardware we can source. Not limited to one vendor.</p>
          </div>
          <img src="/src/assets/services_logo.png" alt="Poseidon Network Systems" style={{ width: '100%', maxWidth: 220, height: 'auto', borderRadius: 8, margin: '0 auto' }} />
        </div>

        <div style={{ textAlign: 'center', paddingBottom: 96 }}>
          <a href="/#quote" style={{ display: 'inline-block', background: '#0D1B4B', color: '#fff', fontWeight: 600, fontSize: 15, padding: '15px 32px', borderRadius: 4, textDecoration: 'none' }}>Request a Quote</a>
        </div>
      </div>
      <Footer theme={theme} />
    </div>
  );
}
