// Runs every 15 minutes (scheduled function, no public address). Reads the public refurbished Dell page
// (/refurbished-dell-equipment.html) and the public feed it uses, and saves the resulting product list in the
// chat_stock_snapshot table. The website chat reads that saved copy, so new, changed, hidden or sold products
// reach the chat within about 15 minutes without a new upload.
//
// The saved copy is only replaced when the page was read successfully and has at least one product,
// so a failed read never wipes the chat's list. Needs no environment variables.
import { getDatabase } from "@netlify/database";
import pageStock from "../lib/page-stock.js";

const { readPageProducts } = pageStock;

export const runChatStockSync = async ({ db, fetchFn = fetch, log = console, read = readPageProducts }) => {
  let products;
  try {
    products = await read(fetchFn);
  } catch (err) {
    log.error("chat-stock-sync: could not read the refurbished page, keeping the saved copy:", err && err.message ? err.message : err);
    return { saved: false, reason: "read failed" };
  }
  if (!Array.isArray(products) || products.length === 0) {
    log.error("chat-stock-sync: the page had no products, keeping the saved copy.");
    return { saved: false, reason: "no products" };
  }
  await db.sql`
    INSERT INTO chat_stock_snapshot (id, products, read_at)
    VALUES (1, ${JSON.stringify(products)}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET products = EXCLUDED.products, read_at = NOW()`;
  log.log("chat-stock-sync: saved", products.length, "products.");
  return { saved: true, count: products.length };
};

export default async () => {
  try {
    await runChatStockSync({ db: getDatabase() });
  } catch (err) {
    if (err && err.name === "MissingDatabaseConnectionError") console.log("chat-stock-sync: database not connected yet.");
    else console.error("chat-stock-sync error:", err && err.message ? err.message : err);
  }
};

export const config = { schedule: "*/15 * * * *" };
