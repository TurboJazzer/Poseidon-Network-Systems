import React from 'react';
import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import { lightTheme } from '../theme.js';

const sections = [
  { title: '1. Scope of Service', body: "These terms cover hardware sales (new and refurbished), local network installations and cabling, cloud setup and administration (Google Workspace, Microsoft 365), and ongoing technical maintenance and support provided by Poseidon Network Systems." },
  { title: '2. Hardware Warranties', body: "Hardware sold through Poseidon is covered by the relevant vendor-backed warranty, including OEM partner terms such as Dell's standard commercial warranty on new and certified refurbished units. Poseidon's liability for third-party hardware faults is limited to the remedies available under the applicable vendor warranty." },
  { title: '3. Service Level Agreements (SLA)', body: "Standard response times, for both remote and on-site technical support, and hardware replacement turnarounds are agreed with each client at engagement and set out in the client's service agreement." },
  { title: '4. Client Responsibilities', body: "Clients are responsible for providing a suitable physical environment for installed network equipment, including adequate power protection (UPS/backup power), and for managing user access privileges within their own systems." }
];

export default function Terms() {
  const theme = lightTheme;
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", color: theme.bodyText, background: theme.pageBg, minHeight: '100vh' }}>
      <Nav theme={theme} />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '72px 24px 96px' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 38, fontWeight: 700, color: '#0D1B4B', margin: '0 0 12px' }}>Terms of Service</h1>
        <p style={{ fontSize: 13, color: '#94A0BF', margin: '0 0 40px' }}>Last updated: September 2026</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, fontSize: 15, lineHeight: 1.7 }}>
          {sections.map((s) => (
            <div key={s.title}>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 600, color: '#0D1B4B', margin: '0 0 10px' }}>{s.title}</h2>
              <p style={{ margin: 0 }}>{s.body}</p>
            </div>
          ))}
          <div>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 600, color: '#0D1B4B', margin: '0 0 10px' }}>5. Contact</h2>
            <p style={{ margin: 0 }}>Questions about these terms can be directed to Poseidon Network Systems, Sea Point, Cape Town, 8000, or via <a href="tel:+27213008278">021 300 8278</a>.</p>
          </div>
        </div>
      </div>
      <Footer theme={theme} />
    </div>
  );
}
