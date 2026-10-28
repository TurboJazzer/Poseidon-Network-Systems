// Adds new Dell offers to the dell_offers table. Used by the hourly Airtable sync.
// Every offer needs a source_ref; the table has a unique source_ref, so an offer that is already
// saved is reported as "duplicate" and left alone. New rows always start with status "new".
import { cleanOffer } from "../functions/dell-offers.mjs";

export const addOffers = async (db, list) => {
  const results = [];
  for (const item of list) {
    const ref = item && typeof item === "object" && typeof item.source_ref === "string" ? item.source_ref.trim() : "";
    if (!ref) {
      results.push({ source_ref: null, result: "invalid", error: "source_ref is required." });
      continue;
    }
    const checked = cleanOffer({ ...item, source_ref: ref, status: "new" });
    if (checked.error) {
      results.push({ source_ref: ref, result: "invalid", error: checked.error });
      continue;
    }
    const v = checked.value;
    const notes = v.notes || "Added automatically from the Morning Brief.";
    const rows = await db.sql`
      INSERT INTO dell_offers
        (model, cpu, ram, storage, screen, unit_condition, supplier,
         supplier_price_excl_vat, our_price_excl_vat, source_ref, source_url, first_seen, status, notes)
      VALUES
        (${v.model}, ${v.cpu}, ${v.ram}, ${v.storage}, ${v.screen}, ${v.unit_condition}, ${v.supplier},
         ${v.supplier_price_excl_vat}, ${v.our_price_excl_vat}, ${v.source_ref}, ${v.source_url},
         COALESCE(${v.first_seen}::date, CURRENT_DATE), 'new', ${notes})
      ON CONFLICT (source_ref) DO NOTHING
      RETURNING id::int AS id`;
    results.push(rows.length ? { source_ref: ref, result: "added", id: rows[0].id } : { source_ref: ref, result: "duplicate" });
  }
  return results;
};
