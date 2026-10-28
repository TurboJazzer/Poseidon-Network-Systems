// Runs every hour (scheduled function, no public address). Reads the "Dell offers inbox" table in
// Airtable, which the Morning Brief fills, and copies any offer not yet saved into the Dell offers list.
//
// Needs these Netlify environment variables:
//   AIRTABLE_TOKEN    an Airtable personal access token with ONLY the data.records:read scope,
//                     limited to the "PNS Dell Offers Inbox" base. It cannot change anything in Airtable.
//   AIRTABLE_BASE_ID  appwHQvXIzxk1zNJl
//   AIRTABLE_TABLE_ID tblPZu9iLXdgonM3L
// Nothing is deleted or changed in Airtable. Repeats are skipped because source_ref is unique.
import { getDatabase } from "@netlify/database";
import { addOffers } from "../lib/add-offers.mjs";

const LOOKBACK_DAYS = 30;
const MAX_PAGES = 10;

const CONDITION_WORDS = { refurbished: "refurbished", reconditioned: "refurbished", "factory reconditioned": "refurbished", new: "new" };

const clip = (v) => (v === undefined || v === null ? undefined : v);

// Airtable row -> offer object for addOffers.
export const rowToOffer = (fields) => {
  const f = fields || {};
  const cond = String(f["Condition"] || "").trim().toLowerCase();
  return {
    model: clip(f["Model"]),
    source_ref: clip(f["Source ref"]),
    first_seen: clip(f["First seen"]),
    cpu: clip(f["CPU"]),
    ram: clip(f["RAM"]),
    storage: clip(f["Storage"]),
    screen: clip(f["Screen"]),
    unit_condition: CONDITION_WORDS[cond] || "unknown",
    supplier: clip(f["Supplier"]),
    our_price_excl_vat: clip(f["Our price excl VAT"]),
    source_url: clip(f["Source URL"]),
    notes: clip(f["Notes"]),
  };
};

export const readInbox = async (fetchFn, env) => {
  const { AIRTABLE_TOKEN: token, AIRTABLE_BASE_ID: base, AIRTABLE_TABLE_ID: table } = env;
  const formula = `IS_AFTER(CREATED_TIME(), DATEADD(TODAY(), -${LOOKBACK_DAYS}, 'days'))`;
  const rows = [];
  let offset = "";
  for (let page = 0; page < MAX_PAGES; page++) {
    const qs = new URLSearchParams({ pageSize: "100", filterByFormula: formula });
    if (offset) qs.set("offset", offset);
    const res = await fetchFn(`https://api.airtable.com/v0/${encodeURIComponent(base)}/${encodeURIComponent(table)}?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Airtable answered ${res.status}`);
    const data = await res.json();
    for (const r of data.records || []) rows.push(r.fields || {});
    offset = data.offset || "";
    if (!offset) break;
  }
  return rows;
};

export const runSync = async ({ db, fetchFn = fetch, env = process.env, log = console }) => {
  if (!env.AIRTABLE_TOKEN || !env.AIRTABLE_BASE_ID || !env.AIRTABLE_TABLE_ID) {
    log.log("dell-offers-sync: Airtable settings are not set yet, nothing to do.");
    return { skipped: true };
  }
  const rows = await readInbox(fetchFn, env);
  const results = await addOffers(db, rows.map(rowToOffer));
  const count = (k) => results.filter((r) => r.result === k).length;
  const summary = { read: rows.length, added: count("added"), duplicate: count("duplicate"), invalid: count("invalid") };
  log.log("dell-offers-sync:", JSON.stringify(summary));
  for (const r of results) if (r.result === "invalid") log.log("dell-offers-sync: skipped a row:", r.source_ref, r.error);
  return summary;
};

export default async () => {
  try {
    await runSync({ db: getDatabase() });
  } catch (err) {
    if (err && err.name === "MissingDatabaseConnectionError") console.log("dell-offers-sync: database not connected yet.");
    else console.error("dell-offers-sync error:", err && err.message ? err.message : err);
  }
};

export const config = { schedule: "0 * * * *" };
