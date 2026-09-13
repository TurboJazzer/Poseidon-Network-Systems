# Poseidon Network Systems — Website

React + Vite site for Poseidon Network Systems (IT support/hardware/network provider, Sea Point, Cape Town).

## Setup
```bash
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
```

## Structure
- `src/pages/` — Home, Services, FAQ, Terms, Privacy (routed via `react-router-dom`)
- `src/components/` — shared Nav, Footer, WhatsApp icon
- `src/theme.js` — color tokens (light + dark mode, used on Home)
- `src/assets/` — logos, product/team photos

## Outstanding
- **Quote form**: posts to `/api/send-quote` (placeholder) — replace with a real serverless/backend endpoint that calls the Resend API server-side. Never call Resend directly from the browser (exposes your API key).
- **Google Tag Manager**: add the GTM snippet (container `GTM-P4J773RN`) to `index.html` `<head>` + `<body>` noscript iframe when ready to go live.
- **Cookie consent banner**: not yet implemented — add if required alongside GTM/analytics.
