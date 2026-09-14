# DESIGN_SYSTEM.md — Poseidon Network Systems Master UI/UX & Component Spec

> **Target Audience:** Claude Design / AI Code Engines / Frontend Engineers
> **Framework Stack:** React + Tailwind CSS (v3.4+) + Lucide Icons
> **Brand & Business:** Poseidon Network Systems (`poseidon-network.com`)
> **Geo-Targeting:** Cape Town & Western Cape, South Africa (B2B Enterprise IT Infrastructure)

---

## 1. Business Architecture & Channel Routing

### Core Model & Target Personas
* **Primary Offerings:**
  1. **New Enterprise Dell Hardware:** B2B commercial fleet procurement (OptiPlex, Latitude, PowerEdge).
  2. **Refurbished Dell Hardware:** Certified pre-owned and workshop-inspected business devices.
* **Service Coverage:** Western Cape (Cape Town CBD, Bellville, Century City, Montague Gardens, Stellenbosch, Somerset West).
* **Target Personas:**
  * *Persona A (Enterprise Procurement):* CIOs, Corporate IT Managers, Procurement Directors (Focus: New hardware, volume discounts, official OEM warranties, long-life fleets).
  * *Persona B (Value-Focused IT):* SMB Owners, Call Centers, Startups, Systems Integrators (Focus: Cost savings per unit, Grade-A condition, immediate local availability).

### Channel Separation Rule (STRICT)
**New Dell Commercial** and **Refurbished Dell Hardware** MUST NOT be combined on the same catalog grid or hero section without explicit toggle filters or separate landing pages, to avoid keyword cannibalization and conversion friction.

```
[ Shared Navigation / Header ]
                                   │
        ┌──────────────────────────┴──────────────────────────┐
        ▼                                                     ▼
[ /dell-commercial/ ]                                 [ /refurbished-dell/ ]
• Target: Enterprise IT & Procurement                 • Target: SMBs & Budget-Conscious IT
• H1: New Dell Commercial Laptops & Desktops          • H1: Certified Refurbished Dell Hardware
• Trust Signals: OEM Warranty, Bulk Pricing           • Trust Signals: 21-Point Inspection, Grade Ratings
```

---

## 3. Design System & Design Tokens

### Color Palette (Tokens)
```json
{
  "color": {
    "brand": {
      "primary": "#0076CE",
      "primary-hover": "#005BA1",
      "dark": "#0D1B2A",
      "surface": "#F4F7FA"
    },
    "channel-indicators": {
      "new-badge": "#059669",
      "refurb-badge": "#D97706",
      "refurb-badge-bg": "#FEF3C7"
    },
    "neutral": {
      "900": "#111827",
      "700": "#374151",
      "500": "#6B7280",
      "100": "#F3F4F6",
      "white": "#FFFFFF"
    }
  }
}
```

### Typography Scale
- Primary Font: Inter / System Sans-serif (clean, readable B2B utility)
- Monospace Font: JetBrains Mono (for hardware SKUs, part numbers, and specs)
- Display H1: 36px (Mobile) / 48px (Desktop) — Bold (700)
- Section H2: 24px (Mobile) / 32px (Desktop) — SemiBold (600)
- Card H3: 18px / 20px — Medium (500)
- Body Text: 16px — Regular (line-height 1.6)
- Metadata / Specs: 13px / 14px — Regular (line-height 1.4)

### Spacing & Grid System (8pt Grid)
xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px | 2xl: 48px | 3xl: 64px

---

## 4. Component Standards & UI Templates

### A. New Hardware Component Card (`/dell-commercial/`)
Must include: primary SKU/model, generation tag (e.g. "Intel Core Ultra / 14th Gen"), Dell Official Warranty badge, Bulk Pricing Inquiry trigger (Request Quote).
Visual styling: clean white background (#FFFFFF), subtle border (1px solid #E5E7EB), crisp shadow on hover (shadow-md).

### B. Refurbished Hardware Component Card (`/refurbished-dell/`)
Must include: Condition Grade Badge (Grade A Certified), Original vs Refurbished savings indicator (Save 40%), Inspection Guarantee, Stock Count (In Stock Cape Town).
Visual styling: accent banner top border, distinct badge coloring (#D97706), clear stock status pill.

---

## 5. SEO & Copywriting Guidelines (Western Cape Context)

### Target Keywords Matrix
- **New Dell Channel:** dell optiplex distributor cape town, dell latitude fleet procurement, dell commercial desktop bellville, dell server supplier century city
- **Refurbished Channel:** refurbished dell laptops cape town, pre-owned optiplex western cape, cheap business laptops montague gardens, second hand dell latitude stellenbosch

### Geo-Targeting Rules
Always weave Western Cape commercial/industrial hubs into local landing page copy:
- **Cape Town CBD:** financial, corporate, legal enterprise fleets.
- **Century City & Bellville:** managed service providers (MSPs), tech parks, call centers.
- **Montague Gardens & Paarden Eiland:** logistics, industrial IT, warehousing.
- **Stellenbosch & Somerset West:** agri-tech, educational, enterprise offices.

---

## 6. Anti-Slop & Prompt Constraints (Hard Rules)
- **No Mixed Catalogs:** Never generate a unified UI card grid that mixes new and refurbished items without explicit toggle filters or tabbed navigation.
- **B2B CTAs:** Do not use consumer e-commerce terms like "Add to Cart" for enterprise fleets. Use "Request B2B Quote", "Apply for Fleet Pricing", or "Check Cape Town Stock".
- **No Generic Stock Placeholders:** Component cards must feature real Dell series names (OptiPlex 7000 MFF, Latitude 5540, PowerEdge R760) and Western Cape delivery badges.
- **Accessibility Standard:** Maintain a minimum 4.5:1 text-to-background contrast ratio on all UI elements (WCAG 2.2 AA/AAA compliance).

---

## Implementation note
The current live site (`index.html` / `Poseidon Network Systems.dc.html` + FAQ/Terms/Privacy/Resources pages) is a single-page inline-styled build, not React/Tailwind, and has no product catalog yet (no SKUs, stock counts, or pricing data). Building the `/dell-commercial/` and `/refurbished-dell/` catalog pages described here is a larger project requiring real product/inventory data — flag when ready to scope that build.
