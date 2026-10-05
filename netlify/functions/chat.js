// Netlify Function: /api/chat (mapped via netlify.toml redirect from /.netlify/functions/chat)
// Calls the Claude API server-side, grounded on an embedded knowledge base (no filesystem reads,
// since Netlify's function bundler does not automatically package non-JS files).
// Requires an ANTHROPIC_API_KEY environment variable set in Netlify (Site settings > Environment variables).

const KNOWLEDGE_BASE = {
  "business": {
    "name": "Poseidon Network Systems",
    "founded": 2004,
    "location": "Sea Point, Cape Town, South Africa, 8005",
    "serviceArea": [
      "Cape Town",
      "Western Cape",
      "Sea Point",
      "Bellville",
      "Century City",
      "Stellenbosch",
      "Montague Gardens"
    ],
    "phone": "021 300 8278",
    "whatsapp": "062 788 3650",
    "whatsappNote": "Ask the visitor to click the WhatsApp button on the site (hero section, quote section, or footer) rather than reading out the number.",
    "hours": "Mon to Fri, 07:30 to 17:30",
    "supportModel": "Remote-first via secure remote access (AnyDesk) for troubleshooting and configuration. Onsite visits happen only when a problem cannot be fixed remotely.",
    "description": "Poseidon Network Systems provides IT support, business VoIP, network infrastructure, and new and refurbished Dell hardware. Based in Sea Point, Cape Town, serving businesses and homes across the Western Cape since 2004. Poseidon is a Dell Technologies Authorized Partner for new Dell equipment only; refurbished stock does not come from Dell.",
    "disambiguation": "Operates at poseidon-network.com. Not affiliated with poseidon.network or any blockchain, cryptocurrency, or decentralized computing project."
  },
  "services": [
    {
      "name": "Managed IT Support & Helpdesk",
      "description": "Remote monitoring and troubleshooting via secure remote access (AnyDesk), with a real person to call when something goes wrong."
    },
    {
      "name": "Business VoIP & Hosted Switchboard",
      "description": "Cloud-based switchboard (hosted PBX). Handsets are set up remotely before delivery and plug into existing network points. Starts with a free phone bill review and a free remote network readiness check. Any new cabling or switches go to an installation partner, with Poseidon as the single point of contact."
    },
    {
      "name": "New & Refurbished Hardware",
      "description": "Refurbished Dell units with a 1-year warranty for price-conscious clients, new Dell hardware for brand-aware buyers, and any other IT hardware sourced on request."
    },
    {
      "name": "Repairs, Maintenance & Network Cabling",
      "description": "Diagnostics, repair, and structured cabling or network setup for desktops, laptops, servers, and offices. Delivered onsite when hardware or cabling work requires it."
    },
    {
      "name": "Consumables & Supplies",
      "description": "Toner, cabling, peripherals, and everyday items that keep an office running."
    },
    {
      "name": "Business Continuity & Backup",
      "description": "Backup strategy and disaster recovery so downtime never means data loss."
    }
  ],
  "hardwarePositioning": "Refurbished Dell (factory reconditioned) with a 1-year warranty first for price-conscious clients, new Dell for brand-aware buyers, plus any other IT hardware sourced on request. Not limited to one vendor.",
  "products": {
    "refurbished": [
      {
        "name": "Dell Latitude 5400",
        "category": "Laptop",
        "specs": "Intel Core i5-8th Gen, 8GB DDR4, 256GB SSD, 14\" screen, Windows 11 Pro",
        "price": 5000,
        "currency": "ZAR",
        "priceNote": "excl. VAT",
        "availability": "In Stock",
        "notes": "Factory reconditioned and tested. Includes free bag and 1-year warranty (battery covered for 6 months). 4G Card/LTE WWAN upgrade available."
      },
      {
        "name": "Dell OptiPlex 3070 Micro",
        "category": "Desktop",
        "specs": "Intel Core i5-8th Gen, 8GB DDR4, 256GB SSD, Windows 11 Pro",
        "price": 4650,
        "currency": "ZAR",
        "priceNote": "excl. VAT",
        "availability": "Coming Soon",
        "notes": "Factory reconditioned and tested. Includes keyboard & mouse and 1-year warranty (battery covered for 6 months). Monitor sold separately."
      },
      {
        "name": "Dell OptiPlex 5060 SFF",
        "category": "Desktop",
        "specs": "Intel Core i5-8th Gen, 16GB DDR4, 256GB SSD, Windows 11 Pro",
        "price": 5940,
        "currency": "ZAR",
        "priceNote": "excl. VAT",
        "availability": "Coming Soon",
        "notes": "Factory reconditioned and tested. Includes keyboard & mouse and 1-year warranty (battery covered for 6 months). Monitor sold separately."
      },
      {
        "name": "Dell Latitude 5330",
        "category": "Laptop",
        "specs": "Intel Core i5-12th Gen, 16GB DDR4, 512GB SSD, 13.3\" screen, Windows 11 Pro",
        "price": 8600,
        "currency": "ZAR",
        "priceNote": "excl. VAT (R9,890 incl. 15% VAT)",
        "availability": "In Stock",
        "notes": "Factory reconditioned and tested. Includes free bag and 1-year warranty (battery covered for 6 months)."
      },
      {
        "name": "Dell Latitude 7430 2-in-1",
        "category": "Laptop",
        "specs": "Intel Core i7-12th Gen, 32GB DDR4, 512GB SSD, 14\" touchscreen, Windows 11 Pro",
        "price": 14180,
        "currency": "ZAR",
        "priceNote": "excl. VAT",
        "availability": "Coming Soon",
        "notes": "Factory reconditioned and tested 2-in-1 touchscreen laptop. Includes free bag and 1-year warranty (battery covered for 6 months)."
      },
      {
        "name": "Dell PowerEdge R760 2U Server",
        "category": "Server",
        "specs": "2x Intel Xeon Silver 4416+, configurable RAM/HDD, PERC H755 RAID, Quad-port 10GB NIC, iDRAC9",
        "price": 235295,
        "currency": "ZAR",
        "priceNote": "excl. VAT",
        "availability": "Out of Stock",
        "notes": "Recertified Dell PowerEdge enterprise rack server, 24x 2.5\" backplane, 5-year warranty (per supplier)."
      }
    ],
    "new": [
      {
        "name": "Dell OptiPlex 7000 MFF",
        "category": "Desktop",
        "specs": "Intel Core Ultra / 14th Gen, Micro Form Factor",
        "availability": "Available to order",
        "notes": "Compact commercial desktop built for dense office and call-center deployments. New, Dell OEM warranty."
      },
      {
        "name": "Dell Latitude 5540",
        "category": "Laptop",
        "specs": "15\" business laptop",
        "availability": "Available to order",
        "notes": "Durable enterprise laptop for mobile staff and hybrid teams. New, Dell OEM warranty."
      },
      {
        "name": "Dell PowerEdge R760",
        "category": "Server",
        "specs": "2U rack server",
        "availability": "Available to order",
        "notes": "Enterprise rack server for on-premise compute and virtualization. New, Dell OEM warranty."
      }
    ]
  },
  "faq": [
    {
      "question": "What brands of IT hardware and workstations do you supply?",
      "answer": "We standardize on Dell commercial laptops, desktops, and enterprise devices, and tailor other brands where a specific office requires it. We also supply specialized office equipment, including commercial and barcode label printers."
    },
    {
      "question": "Do you manage hardware repairs and device replacements?",
      "answer": "Yes. We coordinate diagnostics, component upgrades, and repair or replacement pipelines for laptops, desktop workstations, and network-connected printing systems to minimize office downtime."
    },
    {
      "question": "Can you assist with setting up or expanding our physical network?",
      "answer": "Yes. We design, install, and support routers, switches, firewalls, structured cabling, and managed wireless access points, built for high availability and failover redundancy."
    },
    {
      "question": "How do you support Google Workspace and Microsoft 365 migrations?",
      "answer": "We handle end-to-end cloud setup including domain configuration, user account migration, license management, shared drive structures, and administrative security enforcement like Multi-Factor Authentication (MFA)."
    },
    {
      "question": "How do you ensure our data security and POPIA compliance?",
      "answer": "We deploy a multi-layered security framework featuring network firewalls, endpoint antivirus/anti-malware protection, role-based cloud access controls, and automated encrypted backups designed to keep your business compliant with local data privacy laws (POPIA)."
    },
    {
      "question": "What is the difference between the New Dell and Refurbished Dell pages?",
      "answer": "New Dell Equipment covers brand-new Dell commercial hardware with Dell OEM warranty, supplied as a Dell Technologies Authorized Partner. Refurbished Dell Equipment covers factory reconditioned Dell hardware with a 1-year warranty (battery 6 months), typically at a lower price point. Refurbished stock does not come from Dell."
    },
    {
      "question": "How do I request a quote?",
      "answer": "Use the quote form on the homepage, call 021 300 8278, or message via WhatsApp at +27 62 788 3650. We respond within one business day."
    },
    {
      "question": "Do you deliver?",
      "answer": "Within 40km of Cape Town, arranged per order. Further away, we can courier it at your cost. Check your order and note any damage on the delivery note before you sign."
    },
    {
      "question": "Is the battery covered?",
      "answer": "Yes. On refurbished units the battery is covered for 6 months, within the 1-year warranty."
    },
    {
      "question": "Are you a Dell partner?",
      "answer": "Yes. Poseidon is a Dell Technologies Authorized Partner for new Dell equipment."
    }
  ],
  "pages": {
    "home": "/",
    "newDellEquipment": "/new-dell-equipment.html",
    "refurbishedDellEquipment": "/refurbished-dell-equipment.html",
    "faq": "/faq.html",
    "resources": "/resources.html",
    "terms": "/terms.html",
    "privacy": "/privacy.html",
    "voip": "/business-voip-cape-town.html",
    "phoneBillChecklist": "/phone-bill-checklist.html",
    "refurbishedLaptopChecklist": "/refurbished-laptop-checklist.html"
  },
  "policies": {
    "dellPartner": "Poseidon is a Dell Technologies Authorized Partner. This applies to new Dell equipment only. Never say or imply refurbished stock comes from Dell.",
    "warrantyRefurbished": "1-year warranty: a faulty unit is repaired or replaced. The battery is covered for 6 months. Accidental, liquid and power-surge damage aren't covered.",
    "factoryReconditioned": "Each unit goes through a full set of reliability tests and is completely cleaned before sale. Units sold as A-grade have no cosmetic defects and look like new. Every unit ships with Windows 11 Pro.",
    "delivery": "Within 40km of Cape Town, arranged per order. Further away, we can courier it at your cost. Check your order and note any damage on the delivery note before you sign. Do not describe delivery as free and do not quote courier prices or delivery times.",
    "payment": "Payment is due before delivery. Businesses can pay within 30 days of invoice if agreed in writing.",
    "returns": "Businesses: tell us within 7 days of delivery if anything isn't as ordered. Private buyers can cancel within 7 working days of delivery if the unit is unused and returned undamaged in its original packaging.",
    "voipContract": "Month to month after the initial term, with one calendar month's written notice.",
    "emergencyCalls": "Don't rely on VoIP for 112, 10111 or 10177. Keep a mobile phone available.",
    "billReview": "Free phone bill review: WhatsApp a photo or PDF of your last phone bill to 062 788 3650 and we send back a one-page comparison with a cloud-based switchboard. No obligation."
  }
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 8;
const rateLimitStore = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { windowStart: now, count: 1 });
    return true;
  }
  entry.count += 1;
  return entry.count <= RATE_LIMIT_MAX;
}

// Netlify Functions rate limiting (v2): applied by Netlify's edge before this handler runs,
// so blocked requests never invoke the function or call the Anthropic API. Invalid/unsupported
// syntax is ignored at deploy time rather than failing the build.
exports.config = {
  rateLimit: {
    windowLimit: 8,
    windowSize: 60,
    aggregateBy: ['ip']
  }
};

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const origin = event.headers.origin || event.headers.Origin || '';
  const referer = event.headers.referer || event.headers.Referer || '';
  const allowedHost = 'poseidon-network.com';
  const originOk = origin.includes(allowedHost) || referer.includes(allowedHost) || (!origin && !referer && process.env.NETLIFY_DEV);
  if (!originOk) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
  }

  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || 'unknown';
  if (!checkRateLimit(ip)) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Too many requests, please try again shortly.' }) };
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

  const MAX_MESSAGE_LEN = 500;
  const MAX_HISTORY_ITEMS = 10;

  let message = payload.message;
  const history = payload.history;
  if (!message || typeof message !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing message' }) };
  }
  if (message.length > MAX_MESSAGE_LEN) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Message too long (max ' + MAX_MESSAGE_LEN + ' characters).' }) };
  }

  const systemPrompt = `You are a sales assistant for Poseidon Network Systems. Answer questions strictly using the provided ground-truth JSON data below.

=== BEHAVIORAL RULES ===
1. HARDWARE POSITIONING: Always position Refurbished Dell units (factory reconditioned, with a 1-year warranty) first for price-conscious clients, New Dell for brand-aware buyers, and state that any other IT hardware can be sourced on request.
2. WHATSAPP HANDOFF: Never output raw phone numbers in chat text. Instruct visitors to click the WhatsApp buttons in the hero, quote, or footer sections of the site.
3. PRICING ACCURACY: Quote exact ZAR figures (excl. VAT) from the JSON file. Do not invent price ranges.
4. LEAD CAPTURE: Once buying intent is shown, ask for: Name, Company, Email, Phone Number, and Need.
5. TONE: Concise, direct, and zero fluff.
6. POLICIES: For delivery, warranty, battery, payment, returns, VoIP contract and emergency calls, use the "policies" wording exactly. Delivery outside 40km of Cape Town (for example Paarl) is by courier at the customer's cost. Never call delivery free and never quote courier prices or delivery times.
7. DELL PARTNER: Poseidon is a Dell Technologies Authorized Partner for new Dell only. Never imply refurbished stock comes from Dell.
8. FORMAT: Reply in plain text only. No markdown, no asterisks, no bullet symbols, no headings. Never use em dashes; use a comma, full stop or colon instead.

=== GROUND TRUTH DATA ===
${JSON.stringify(KNOWLEDGE_BASE)}`;

  const trimmedHistory = Array.isArray(history) ? history.slice(-MAX_HISTORY_ITEMS) : [];
  const messages = trimmedHistory
    .filter((m) => m && m.role && m.text)
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.text).slice(0, MAX_MESSAGE_LEN) }));
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
