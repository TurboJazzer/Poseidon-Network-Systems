'use strict';

// Reads the public refurbished Dell page and the public feed it uses, and returns the refurbished products exactly as a
// visitor sees them: the fixed cards in the page, staff edits to those cards (price, stock status, hidden, description)
// and the extra cards for offers staff have published. Used only by the scheduled function chat-stock-sync, never by the
// chat itself. Public data only: no database access and no secrets.

const BASE_URL = (process.env.LIVE_STOCK_BASE_URL || 'https://poseidon-network.com').replace(/\/+$/, '');
const PAGE_PATH = '/refurbished-dell-equipment.html';
const LISTINGS_PATH = '/api/dell-listings';
const TIMEOUT_MS = 4000;
const MAX_PAGE_CHARS = 600000;
const UA = 'PNS-chat-stock-sync/1.0';

const AVAIL_LABEL = { in_stock: 'In stock', coming_soon: 'Coming soon', to_order: 'Available to order' };

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decode(s) {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, function (m, e) {
    if (e.charAt(0) === '#') {
      const n = e.charAt(1).toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    const v = ENTITIES[e.toLowerCase()];
    return v === undefined ? m : v;
  });
}

function text(html) {
  return decode(String(html).replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}

function first(re, s) {
  const m = re.exec(s);
  return m ? m[1] : null;
}

// Same formatting as the page: R5,000 / R5,347.5
function money(n) {
  return 'R' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function inclVat(excl) {
  return Math.round(excl * 115) / 100;
}

function availFromBadge(badge) {
  const b = String(badge || '').toLowerCase();
  if (b.indexOf('coming soon') !== -1) return 'coming_soon';
  if (b.indexOf('available to order') !== -1) return 'to_order';
  if (b.indexOf('in stock') !== -1) return 'in_stock';
  return null;
}

// Same matching rule as the page: a published offer is skipped when its model starts with a fixed card's model.
function norm(s) {
  return String(s || '').toLowerCase().replace(/^dell\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function parseCard(key, chunk) {
  const model = text(first(/<h3[^>]*>([\s\S]*?)<\/h3>/, chunk) || '');
  if (!model) return null;
  const badge = text(first(/<\/h3>\s*<span[^>]*>([\s\S]*?)<\/span>/, chunk) || '');
  const priceDiv = first(/<div[^>]*font-size:20px[^>]*>([\s\S]*?)<\/div>/i, chunk);
  let price = null;
  let priceText = null;
  if (priceDiv !== null) {
    priceText = text(priceDiv);
    const pm = /^R\s*([\d,]+(?:\.\d+)?)\s*excl\. VAT/i.exec(priceText);
    if (pm) price = parseFloat(pm[1].replace(/,/g, ''));
  }
  return {
    key: key,
    model: model,
    availability: availFromBadge(badge),
    badge: badge,
    condition: text(first(/<p[^>]*text-transform:uppercase[^>]*>([\s\S]*?)<\/p>/i, chunk) || ''),
    specs: text(first(/<p[^>]*font-family:monospace[^>]*>([\s\S]*?)<\/p>/i, chunk) || ''),
    description: text(first(/<p[^>]*line-height:1\.6[^>]*>([\s\S]*?)<\/p>/i, chunk) || ''),
    price: price,
    priceText: price === null ? priceText : null,
    page: first(/<a href="(\/product-[^"#?]+)"/, chunk) || null,
    hidden: false,
  };
}

// The fixed cards written in the page, in page order.
function parseFixedCards(html) {
  const start = html.indexOf('id="stock-grid"');
  if (start < 0) return [];
  let body = html.slice(start);
  const end = body.indexOf('</section>');
  if (end > 0) body = body.slice(0, end);
  const re = /<div data-key="([a-z0-9-]{1,60})"/g;
  const marks = [];
  let m;
  while ((m = re.exec(body))) marks.push({ key: m[1], at: m.index });
  const cards = [];
  marks.forEach(function (mk, i) {
    const card = parseCard(mk.key, body.slice(mk.at, i + 1 < marks.length ? marks[i + 1].at : body.length));
    if (card) cards.push(card);
  });
  return cards;
}

// Staff edits to the fixed cards (the same steps as applyStock in the page).
function applyStock(cards, items) {
  (Array.isArray(items) ? items : []).forEach(function (it) {
    if (!it || typeof it.key !== 'string') return;
    const c = cards.find(function (x) { return x.key === it.key.replace(/[^a-z0-9-]/g, ''); });
    if (!c) return;
    if (it.hidden) { c.hidden = true; return; }
    if (it.availability && AVAIL_LABEL[it.availability]) c.availability = it.availability;
    if (it.description) c.description = String(it.description);
    if (typeof it.price_excl_vat === 'number' && Number.isFinite(it.price_excl_vat)) {
      c.price = it.price_excl_vat;
      c.priceText = null;
    }
  });
}

function categoryOf(model) {
  const m = String(model).toLowerCase();
  if (/latitude|precision|xps|inspiron|vostro/.test(m)) return 'Laptop';
  if (/optiplex/.test(m)) return 'Desktop';
  if (/poweredge|server/.test(m)) return 'Server';
  if (/monitor|ultrasharp|\b\d\d\s?in\b/.test(m)) return 'Monitor';
  return undefined;
}

function productFromCard(c) {
  const p = {
    name: /^dell\s/i.test(c.model) ? c.model : 'Dell ' + c.model,
    category: categoryOf(c.model),
    specs: c.specs || undefined,
    availability: AVAIL_LABEL[c.availability] || c.badge || undefined,
    notes: c.description || undefined,
    page: c.page || undefined,
  };
  if (typeof c.price === 'number') {
    p.price = c.price;
    p.currency = 'ZAR';
    p.priceNote = 'excl. VAT (' + money(inclVat(c.price)) + ' incl. VAT)';
  } else if (c.priceText) {
    p.priceNote = c.priceText;
  }
  Object.keys(p).forEach(function (k) { if (p[k] === undefined) delete p[k]; });
  return p;
}

function productFromOffer(o) {
  const specs = [o.cpu, o.ram, o.storage, o.screen].filter(Boolean).join(' · ');
  const defaultNote = o.unit_condition === 'refurbished' ? 'Factory reconditioned and tested, with a 1-year warranty.' : undefined;
  const p = {
    name: /^dell\s/i.test(o.model) ? o.model : 'Dell ' + o.model,
    category: categoryOf(o.model),
    specs: specs || undefined,
    price: o.price_excl_vat,
    currency: 'ZAR',
    priceNote: 'excl. VAT (' + money(inclVat(o.price_excl_vat)) + ' incl. VAT)',
    availability: AVAIL_LABEL[o.availability] || AVAIL_LABEL.in_stock,
    notes: o.website_text || defaultNote,
  };
  Object.keys(p).forEach(function (k) { if (p[k] === undefined) delete p[k]; });
  return p;
}

// Pure step: page HTML + feed JSON -> products a visitor sees. Exported for testing.
function buildProducts(html, listings) {
  const cards = parseFixedCards(String(html));
  if (!cards.length) throw new Error('no cards found on the refurbished page');
  const have = cards.map(function (c) { return norm(c.model); });
  const feed = listings && typeof listings === 'object' ? listings : {};
  applyStock(cards, feed.stock);
  const products = cards.filter(function (c) { return !c.hidden; }).map(productFromCard);
  (Array.isArray(feed.offers) ? feed.offers : []).forEach(function (o) {
    if (!o || typeof o.model !== 'string' || typeof o.price_excl_vat !== 'number' || !Number.isFinite(o.price_excl_vat)) return;
    const m = norm(o.model);
    if (have.some(function (h) { return h && m.indexOf(h) === 0; })) return;
    products.push(productFromOffer(o));
  });
  return products;
}

async function fetchText(fetchFn, url, accept) {
  const res = await fetchFn(url, { headers: { 'user-agent': UA, accept: accept }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(url + ' answered ' + res.status);
  const body = await res.text();
  if (body.length > MAX_PAGE_CHARS) throw new Error(url + ' is unexpectedly large');
  return body;
}

// Reads both public addresses and returns the products. Throws if either cannot be read or the page has no cards.
async function readPageProducts(fetchFn) {
  const results = await Promise.all([
    fetchText(fetchFn || fetch, BASE_URL + PAGE_PATH, 'text/html'),
    fetchText(fetchFn || fetch, BASE_URL + LISTINGS_PATH, 'application/json'),
  ]);
  return buildProducts(results[0], JSON.parse(results[1]));
}

module.exports = { readPageProducts, buildProducts, parseFixedCards };
