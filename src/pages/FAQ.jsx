import React, { useState } from 'react';
import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import { lightTheme } from '../theme.js';

const sections = [
  { title: 'Hardware & Procurement', items: [
    { key: 'h1', q: 'What brands of IT hardware and workstations do you supply?', a: 'While we tailor hardware solutions to specific office requirements across various brands, we primarily standardize on and recommend Dell commercial laptops, desktops, and enterprise devices for maximum reliability and ease of support. We also handle specialized office equipment including commercial and barcode label printers.' },
    { key: 'h2', q: 'Do you manage hardware repairs and device replacements?', a: 'Yes. We coordinate diagnostics, component upgrades, and repair or replacement pipelines for laptops, desktop workstations, and network-connected printing systems to minimize office downtime.' }
  ]},
  { title: 'Network & Infrastructure', items: [
    { key: 'n1', q: 'Can you assist with setting up or expanding our physical network?', a: 'Absolutely. We design, install, and support physical local network infrastructure including routers, switches, firewalls, structured cabling, and managed wireless access points built for high availability and failover redundancy.' }
  ]},
  { title: 'Cloud & Security', items: [
    { key: 'c1', q: 'How do you support Google Workspace and Microsoft 365 migrations?', a: 'We handle end-to-end cloud setup including domain configuration, user account migration, license management, shared drive structures, and administrative security enforcement like Multi-Factor Authentication (MFA).' },
    { key: 'c2', q: 'How do you ensure our data security and POPIA compliance?', a: 'We deploy a multi-layered security framework featuring network firewalls, endpoint antivirus/anti-malware protection, role-based cloud access controls, and automated encrypted backups designed to keep your business compliant with local data privacy laws (POPIA).' }
  ]}
];

export default function FAQ() {
  const theme = lightTheme;
  const [open, setOpen] = useState({});
  const toggle = (key) => setOpen((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", color: theme.bodyText, background: theme.pageBg, minHeight: '100vh' }}>
      <Nav theme={theme} />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '72px 24px 96px' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 40, fontWeight: 700, color: '#0D1B4B', margin: '0 0 12px' }}>Frequently Asked Questions</h1>
        <p style={{ fontSize: 16, color: '#5A6588', margin: '0 0 48px' }}>Answers on hardware, network infrastructure, cloud services, and security.</p>

        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: '#0D1B4B', margin: '0 0 16px' }}>{section.title}</h2>
            {section.items.map((item) => (
              <div key={item.key} style={{ border: '1px solid #E4E9F5', borderRadius: 8, marginBottom: 10, overflow: 'hidden', background: '#fff' }}>
                <button onClick={() => toggle(item.key)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '18px 20px', fontSize: 15, fontWeight: 600, color: '#0D1B4B', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontFamily: 'inherit' }}>
                  <span>{item.q}</span>
                  <span style={{ color: '#2D5BE3', fontSize: 18, flexShrink: 0 }}>{open[item.key] ? '−' : '+'}</span>
                </button>
                {open[item.key] && <div style={{ padding: '0 20px 18px', fontSize: 14, color: '#5A6588', lineHeight: 1.7 }}>{item.a}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
      <Footer theme={theme} />
    </div>
  );
}
