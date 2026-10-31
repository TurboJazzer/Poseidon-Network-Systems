// Staff-only photo for one Dell offer (/staff/api/dell-offers-image?id=N).
//
// The first time a card needs a photo, this finds the full-size picture on the Universe Direct product
// page (the offer's link if it is a Universe Direct product page, otherwise a search for the model),
// saves the picture address on the offer, and passes the picture on to the staff page. Later views use
// the saved address. Add &download=1 to get the file as a download, &refresh=1 to search again.
//
// Security: needs the staff sign-in cookie; only reads from www.universedirect.co.za (the address is
// checked before every fetch); only returns real image types up to 8 MB; read-only apart from saving
// the picture address on the offer.
import { getDatabase } from "@netlify/database";
import { checkAuth, json, IMAGE_URL_RE } from "./dell-offers.mjs";

const HOST = "www.universedirect.co.za";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_HTML = 3 * 1024 * 1024;
const RECHECK_MINUTES = 360; // do not search again for 6 hours after a miss

const PRODUCT_URL_RE = /^https:\/\/www\.universedirect\.co\.za\/product\/[a-z0-9-]+\/?(?:[?#].*)?$/i;

const unescapeHtml = (s) => s.replace(/&amp;/g, "&").replace(/&#0?38;/g, "&").replace(/&quot;/g, '"');

// Full-size picture address from a product page's html (not the 600px thumbnail).
export const imageFromProductHtml = (html) => {
  const cands = [];
  for (const m of html.matchAll(/woocommerce-product-gallery__image[^>]*>\s*<a href="([^"]+)"/g)) cands.push(m[1]);
  for (const m of html.matchAll(/data-large_image="([^"]+)"/g)) cands.push(m[1]);
  const og = /property="og:image" content="([^"]+)"/.exec(html);
  if (og) cands.push(og[1]);
  for (const c of cands) {
    const u = unescapeHtml(c).replace(/-\d+x\d+(\.\w+)$/, "$1");
    if (IMAGE_URL_RE.test(u)) return u;
  }
  return null;
};

const tokens = (s) => String(s || "").toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3);

// Product page addresses in a WooCommerce search result page, best match for the model first.
export const rankProducts = (html, model) => {
  const links = [...new Set([...html.matchAll(/href="(https:\/\/www\.universedirect\.co\.za\/product\/[a-z0-9-]+\/)"/g)].map((m) => m[1]))];
  const want = tokens(model);
  return links
    .map((u) => ({ u, score: want.filter((t) => u.includes(t)).length }))
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.u);
};

const getText = async (fetchFn, url) => {
  if (new URL(url).hostname !== HOST) throw new Error("blocked host");
  const res = await fetchFn(url, { headers: { "User-Agent": UA, "Accept-Language": "en" }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error("page " + res.status);
  const t = await res.text();
  return t.slice(0, MAX_HTML);
};

export const findImageUrl = async (offer, fetchFn) => {
  const pages = [];
  if (offer.source_url && PRODUCT_URL_RE.test(offer.source_url)) pages.push(offer.source_url);
  if (!pages.length) {
    const nums = tokens(offer.model).filter((t) => /\d/.test(t));
    const queries = [offer.model, nums[0]].filter(Boolean);
    for (const q of queries) {
      try {
        const html = await getText(fetchFn, `https://${HOST}/?s=${encodeURIComponent(q)}&post_type=product`);
        pages.push(...rankProducts(html, offer.model).slice(0, 2));
      } catch (_) {}
      if (pages.length) break;
    }
  }
  for (const p of pages) {
    try {
      const img = imageFromProductHtml(await getText(fetchFn, p));
      if (img) return img;
    } catch (_) {}
  }
  return null;
};

const fileName = (u) => new URL(u).pathname.split("/").pop();

export const createImageHandler = (getDb, fetchFn = fetch) => async (req) => {
  const auth = checkAuth(req);
  if (auth === "unset") return json({ error: "The staff area is not set up yet." }, 503);
  if (auth !== "ok") return json({ error: "Staff login required." }, 401);
  if (req.method.toUpperCase() !== "GET") return json({ error: "Method not allowed." }, 405, { Allow: "GET" });

  const url = new URL(req.url);
  const raw = url.searchParams.get("id");
  if (!raw || !/^\d{1,9}$/.test(raw) || Number(raw) < 1) return json({ error: "A valid id is needed." }, 400);
  const id = Number(raw);

  try {
    const db = getDb();
    const rows = await db.sql`
      SELECT id::int AS id, model, source_url, image_url,
             (image_checked_at IS NOT NULL AND image_checked_at > NOW() - (${RECHECK_MINUTES}::int * INTERVAL '1 minute')) AS recently_checked
      FROM dell_offers WHERE id = ${id}`;
    if (!rows.length) return json({ error: "Offer not found." }, 404);
    const offer = rows[0];

    let img = offer.image_url && IMAGE_URL_RE.test(offer.image_url) ? offer.image_url : null;
    const refresh = url.searchParams.get("refresh") === "1";
    if (!img && (refresh || !offer.recently_checked)) {
      img = await findImageUrl(offer, fetchFn);
      if (img) await db.sql`UPDATE dell_offers SET image_url = ${img}, image_checked_at = NOW() WHERE id = ${id}`;
      else await db.sql`UPDATE dell_offers SET image_checked_at = NOW() WHERE id = ${id}`;
    } else if (img && refresh && offer.source_url) {
      const again = await findImageUrl({ ...offer, model: offer.model }, fetchFn);
      if (again) {
        img = again;
        await db.sql`UPDATE dell_offers SET image_url = ${img}, image_checked_at = NOW() WHERE id = ${id}`;
      }
    }
    if (!img) return json({ error: "No photo found for this offer." }, 404);

    const res = await fetchFn(img, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) return json({ error: "The photo could not be loaded." }, 502);
    const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!/^image\/(png|jpeg|webp|gif)$/.test(type)) return json({ error: "That was not a picture." }, 502);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_IMAGE) return json({ error: "The photo is too large." }, 502);

    const headers = {
      "Content-Type": type,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    };
    if (url.searchParams.get("download") === "1") headers["Content-Disposition"] = `attachment; filename="${fileName(img).replace(/[^A-Za-z0-9._-]/g, "_")}"`;
    return new Response(buf, { status: 200, headers });
  } catch (err) {
    if (err && err.name === "MissingDatabaseConnectionError") return json({ error: "The database is not connected to this site yet." }, 503);
    console.error("dell-offers-image error:", err && err.message ? err.message : err);
    return json({ error: "Something went wrong loading the photo." }, 500);
  }
};

export default createImageHandler(() => getDatabase());
