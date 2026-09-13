import React from 'react';
import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import { lightTheme } from '../theme.js';

const sections = [
  { title: '1. POPIA Compliance Statement', body: "Poseidon Network Systems is committed to protecting the personal information of our clients and their employees in accordance with South Africa's Protection of Personal Information Act (POPIA)." },
  { title: '2. Data Collection & Usage', body: "In the course of network setups and cloud migrations, we may collect account information, IP addresses, and basic system telemetry needed to configure, secure, and support your infrastructure. This data is used solely to deliver and maintain the services you've engaged us for." },
  { title: '3. Cloud Security Standards', body: "When administering Google Workspace or Microsoft 365 environments, credentials and user data are handled under the security standards of those platforms, with access limited to what is required to complete the engagement, and Multi-Factor Authentication enforced wherever possible." },
  { title: '4. Data Retention & Destruction', body: "Decommissioned storage drives and local server backups are securely wiped or physically destroyed at end of life, in line with standard data sanitization practices." }
];

export default function Privacy() {
  const theme = lightTheme;
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", color: theme.bodyText, background: theme.pageBg, minHeight: '100vh' }}>
      <Nav theme={theme} />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '72px 24px 96px' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 38, fontWeight: 700, color: '#0D1B4B', margin: '0 0 12px' }}>Privacy Policy</h1>
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
            <p style={{ margin: 0 }}>Questions about this policy can be directed to Poseidon Network Systems, Sea Point, Cape Town, 8000, or via <a href="tel:+27213008278">021 300 8278</a>.</p>
          </div>
        </div>
      </div>
      <Footer theme={theme} />
    </div>
  );
}
