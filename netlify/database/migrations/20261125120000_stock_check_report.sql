-- The latest morning stock check: the refurbished Dell page compared with Universe Direct's stock.
-- Written by the scheduled function stock-check; shown on /staff/stock-check.html. Always exactly one row (id = 1).
CREATE TABLE stock_check_report (
  id         SMALLINT PRIMARY KEY CHECK (id = 1),
  report     JSONB NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
