// Netlify Function: /api/chat (mapped via netlify.toml redirect from /.netlify/functions/chat)
// Calls the Claude API server-side, grounded on an embedded knowledge base (no filesystem reads,
// since Netlify's function bundler does not automatically package non-JS files).
// Requires an ANTHROPIC_API_KEY environment variable set in Netlify (Site settings > Environment variables).

const KNOWLEDGE_BASE = {
  "business": {
    "name": "Poseidon Network Systems",
    "founded": 2004,
    "location": "Sea Point, Cape Town, South Africa, 8005",
    "serviceArea": ["Cape Town", "Western Cape", "Sea Point", "Bellville", "Century City", "Stellenbosch", "Montague Gardens"],
    "phone": "021 300 8278",
    "whatsapp": "+27 64 702 9962",
    "whatsappNote": "Ask the visitor to click the WhatsApp button on the site (hero section, quote section, or footer) rather than reading out the number.",
    "hours": "Monday–Friday, 07:30–17:30",
    "description": "IT support, network infrastructure, and Dell hardware provider based in Sea Point, Cape Town, serving businesses and homes across the Western Cape since 2004."
  },
  "services": [
    { "name": "Managed IT Support & Helpdesk", "description": "Ongoing monitoring, troubleshooting, and a real person to call when something goes wrong." },
    { "name": "Network Setup & Cabling", "description": "Structured cabling, Wi-Fi, and network design for offices and homes, built to last." },
    { "name": "New & Refurbished Hardware", "description": "Refurbished Dell units with onsite warranty for price-conscious clients, new Dell hardware for brand-aware buyers, and any other IT hardware sourced on request." },
    { "name": "Repairs & Maintenance", "description": "Diagnostics and repair for desktops, laptops, servers, and everything in between." },
    { "name": "Consumables & Supplies", "description": "Toner, cabling, peripherals, and everyday items that keep an office running." },
    { "name": "Business Continuity & Backup", "description": "Backup strategy and disaster recovery so downtime never means data loss." }
  ],
  "hardwarePositioning": "Refurbished Dell with onsite warranty first for price-conscious clients, new Dell for brand-aware buyers, plus any other IT hardware sourced on request. Not limited to one vendor.",
  "products": {
    "refurbished": [
      { "name": "Dell Latitude 5400", "category": "Laptop", "specs": "Intel Core i5-8th Gen, 8GB DDR4, 256GB SSD, 14\" screen, Windows 11 Pro", "price": 5000, "currency": "ZAR", "priceNote": "excl. VAT", "availability": "In Stock", "notes": "Factory reconditioned and tested. Includes free bag and 1-year warranty. 4G Card/LTE WWAN upgrade available." },
      { "name": "Dell OptiPlex 3070 Micro", "category": "Desktop", "specs": "Intel Core i5-8th Gen, 8GB DDR4, 256GB SSD, Windows 11 Pro", "price": 4650, "currency": "ZAR", "priceNote": "excl. VAT", "availability": "Coming Soon", "notes": "Factory reconditioned and tested. Includes keyboard & mouse and 1-year warranty. Monitor sold separately." },
      { "name": "Dell OptiPlex 5060 SFF", "category": "Desktop", "specs": "Intel Core i5-8th Gen, 16GB DDR4, 256GB SSD, Windows 11 Pro", "price": 5940, "currency": "ZAR", "priceNote": "excl. VAT", "availability": "Coming Soon", "notes": "Factory reconditioned and tested. Includes keyboard & mouse and 1-year warranty. Monitor sold separately." },
      { "name": "Dell Latitude 5330", "category": "Laptop", "specs": "Intel Core i5-12th Gen, 16GB DDR4, 512GB SSD, 13.3\" screen, Windows 11 Pro", "price": 8470, "currency": "ZAR", "priceNote": "excl. VAT", "availability": "In Stock", "notes": "Factory reconditioned and tested. Includes free bag and 1-year warranty." },
      { "name": "Dell Latitude 7430 2-in-1", "category": "Laptop", "specs": "Intel Core i7-12th Gen, 32GB DDR4, 512GB SSD, 14\" touchscreen, Windows 11 Pro", "price": 14180, "currency": "ZAR", "priceNote": "excl. VAT", "availability": "Coming Soon", "notes": "Factory reconditioned and tested 2-in-1 touchscreen laptop. Includes free bag and 1-year warranty." },
      { "name": "Dell PowerEdge R760 2U Server", "category": "Server", "specs": "2x Intel Xeon Silver 4416+, configurable RAM/HDD, PERC H755 RAID, Quad-port 10GB NIC, iDRAC9", "price": 258830, "currency": "ZAR", "priceNote": "excl. VAT", "availability": "Coming Soon", "notes": "Recertified Dell Box enterprise rack server, 24x 2.5\" backplane, 5-year warranty." }
    ],
    "new": [
      { "name": "Dell OptiPlex 7000 MFF", "category": "Desktop", "specs": "Intel Core Ultra / 14th Gen, Micro Form Factor", "availability": "Available to order", "notes": "Compact commercial desktop built for dense office and call-center deployments. New, Dell OEM warranty." },
      { "name": "Dell Latitude 5540", "category": "Laptop", "specs": "15\" business laptop", "availability": "Available to order", "notes": "Durable enterprise laptop for mobile staff and hybrid teams. New, Dell OEM warranty." },
      { "name": "Dell PowerEdge R760", "category": "Server", "specs": "2U rack server", "availability": "Available to order", "notes": "Enterprise rack server for on-premise compute and virtualization. New, Dell OEM warranty." }
    ]
  },
  "faq": [
    { "question": "What brands of IT hardware and workstations do you supply?", "answer": "We standardize on Dell commercial laptops, desktops, and enterprise devices, and tailor other brands where a specific office requires it. We also supply specialized office equipment, including commercial and barcode label printers." },
    { "question": "Do you manage hardware repairs and device replacements?", "answer": "Yes. We coordinate diagnostics, component upgrades, and repair or replacement pipelines for laptops, desktop workstations, and network-connected printing systems to minimize office downtime." },
    { "question": "Can you assist with setting up or expanding our physical network?", "answer": "Yes. We design, install, and support routers, switches, firewalls, structured cabling, and managed wireless access points, built for high availability and failover redundancy." },
    { "question": "How do you support Google Workspace and Microsoft 365 migrations?", "answer": "We handle end-to-end cloud setup including domain configuration, user account migration, license management, shared drive structures, and administrative security enforcement like Multi-Factor Authentication (MFA)." },
    { "question": "How do you ensure our data security and POPIA compliance?", "answer": "We deploy a multi-layered security framework featuring network firewalls, endpoint antivirus/anti-malware protection, role-based cloud access controls, and automated encrypted backups designed to keep your business compliant with local data privacy laws (POPIA)." },
    { "question": "What is the difference between the New Dell and Refurbished Dell pages?", "answer": "New Dell Equipment covers direct-channel, brand-new Dell commercial hardware with full OEM warranty and bulk pricing. Refurbished Dell Equipment covers Grade A factory reconditioned Dell hardware with onsite warranty, typically at a lower price point." },
    { "question": "How do I request a quote?", "answer": "Use the quote form on the homepage, call 021 300 8278, or click the WhatsApp button on the site. We respond within one business day." }
  ],
  "salesGuidance": {
    "role": "You are a sales assistant for Poseidon Network Systems. Answer questions helpfully, then guide qualified visitors toward a quote or contact.",
    "qualifyingQuestions": [
      "Is this for a business/office or a home setup?",
      "New or refurbished hardware, or unsure yet?",
      "How many units/devices are needed?",
      "Any specific brand or spec requirement?",
      "Timeline for purchase or deployment?"
    ],
    "leadCapture": {
      "whenToCapture": "Once the visitor shows buying intent (asks about price, stock, or says they want to proceed), ask for their name, company (optional), email, and phone number so the team can follow up.",
      "fields": ["name", "company", "email", "phone", "need", "message"],
      "handoff": "Direct hot leads to click the WhatsApp button on the site (hero section, quote section, or footer) or use the homepage quote form (index.html#quote) for fastest response. Mention response time is within one business day."
    },
    "upsell": [
      "If a visitor asks about a laptop/desktop, mention onsite warranty and ask if they also need network setup or ongoing IT support.",
      "If a visitor asks about repairs or support, mention hardware refresh options (new or refurbished) if their device sounds old or failing.",
      "For businesses with multiple staff, mention Managed IT Support & Helpdesk and Business Continuity & Backup."
    ],
    "toneGuidance": "Direct, concise, no fluff. Lead with the answer, avoid marketing buzzwords. Always give real prices/specs from this file when available rather than vague ranges."
  },
  "pages": {
    "home": "/index.html",
    "newDellEquipment": "/New Dell Equipment.dc.html",
    "refurbishedDellEquipment": "/Refurbished Dell Equipment.dc.html",
    "faq": "/FAQ.dc.html",
    "resources": "/Resources.dc.html",
    "terms": "/Terms of Service.dc.html",
    "privacy": "/Privacy Policy.dc.html"
  }
};

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: "The assistant isn't configured yet. Please click the WhatsApp button or call 021 300 8278." })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const message = payload.message;
  const history = payload.history;
  if (!message || typeof message !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing message' }) };
  }

  const systemPrompt = 'You are the on-site assistant for Poseidon Network Systems, an IT support and Dell hardware provider in Sea Point, Cape Town. Answer visitor questions using ONLY the facts in this knowledge base JSON. Be direct and concise, no marketing fluff. Always cite real prices/specs/stock status from the data, never invent numbers. When a visitor shows buying intent, ask qualifying questions, then encourage them to click the WhatsApp button or use the quote form on the homepage.\n\nKNOWLEDGE BASE:\n' + JSON.stringify(KNOWLEDGE_BASE);

  const trimmedHistory = Array.isArray(history) ? history.slice(-10) : [];
  const messages = trimmedHistory
    .filter((m) => m && m.role && m.text)
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }));
  messages.push({ role: 'user', content: message });

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 512,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Anthropic API error:', res.status, errText);
      return {
        statusCode: 200,
        body: JSON.stringify({ reply: "I'm having trouble right now. Please click the WhatsApp button or call 021 300 8278." })
      };
    }

    const data = await res.json();
    const reply = (data.content && data.content[0] && data.content[0].text) || "Sorry, I couldn't process that.";

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: reply })
    };
  } catch (err) {
    console.error('Chat function error:', err);
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: "I'm having trouble connecting right now. Please click the WhatsApp button or call 021 300 8278." })
    };
  }
};
