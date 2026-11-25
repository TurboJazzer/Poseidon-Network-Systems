// Runs every morning (scheduled function, no public address): 04:30 UTC, which is 06:30 in South Africa.
// Reads the public refurbished Dell page, checks each product against Universe Direct's public stock, saves the
// report for /staff/stock-check.html and emails it. It only reports: it never changes a card on the website.
//
// Email uses the settings the site already has: RESEND_API_KEY plus STOCK_CHECK_TO and STOCK_CHECK_FROM
// (falls back to BILL_REVIEW_TO and BILL_REVIEW_FROM). Without them the report is still saved and shown on the staff page.
import { getDatabase } from "@netlify/database";
import { runStockCheck } from "../lib/supplier-stock.mjs";

export default async () => {
  try {
    await runStockCheck({ db: getDatabase() });
  } catch (err) {
    if (err && err.name === "MissingDatabaseConnectionError") console.log("stock-check: database not connected yet.");
    else console.error("stock-check error:", err && err.message ? err.message : err);
  }
};

export const config = { schedule: "30 4 * * *" };
