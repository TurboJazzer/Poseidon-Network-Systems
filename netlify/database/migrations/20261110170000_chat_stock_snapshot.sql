-- One saved copy of the refurbished Dell list as shown on refurbished-dell-equipment.html.
-- The scheduled function chat-stock-sync refreshes it; the website chat reads it. Always exactly one row (id = 1).
CREATE TABLE chat_stock_snapshot (
  id        SMALLINT PRIMARY KEY CHECK (id = 1),
  products  JSONB NOT NULL,
  read_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
