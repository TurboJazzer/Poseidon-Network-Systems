// Staff-only (/staff/api/stock-check): shows the latest morning stock check and can run it now.
//  GET  -> { report, checked_at } (report is null until the first check has run)
//  POST -> runs the check now (no email) and returns the new report
import { getDatabase } from "@netlify/database";
import { json, checkAuth } from "./dell-offers.mjs";
import { runStockCheck } from "../lib/supplier-stock.mjs";

export const createHandler = (getDb, run = runStockCheck) => async (req) => {
  const auth = checkAuth(req);
  if (auth === "unset") return json({ error: "The staff area is not set up yet." }, 503);
  if (auth !== "ok") return json({ error: "Staff login required." }, 401);

  const method = req.method.toUpperCase();
  if (!["GET", "POST"].includes(method)) return json({ error: "Method not allowed." }, 405, { Allow: "GET, POST" });
  if (method === "POST" && req.headers.get("x-requested-with") !== "pns-staff") return json({ error: "Request not allowed." }, 403);

  try {
    const db = getDb();
    if (method === "POST") {
      const out = await run({ db, email: false });
      if (!out.ok) return json({ error: "The refurbished Dell page could not be read just now. Try again in a minute." }, 502);
      return json({ report: out.report, checked_at: out.report.checked_at });
    }
    const rows = await db.sql`SELECT report, checked_at FROM stock_check_report WHERE id = 1`;
    return json(rows.length ? { report: rows[0].report, checked_at: rows[0].checked_at } : { report: null, checked_at: null });
  } catch (err) {
    if (err && err.name === "MissingDatabaseConnectionError") return json({ error: "The database is not connected to this site yet." }, 503);
    console.error("stock-check-report error:", err && err.message ? err.message : err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
};

export default createHandler(() => getDatabase());
