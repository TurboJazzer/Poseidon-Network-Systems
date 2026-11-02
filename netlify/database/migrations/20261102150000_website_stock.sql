-- Staff edits to the fixed product cards on refurbished-dell-equipment.html (price, stock status, hide).
-- One row per card, keyed by the card's data-key on the page. No row means the card shows as written in the page.
CREATE TABLE website_stock (
  card_key         TEXT PRIMARY KEY CHECK (card_key ~ '^[a-z0-9-]{1,60}$'),
  price_excl_vat   NUMERIC(12,2) CHECK (price_excl_vat IS NULL OR (price_excl_vat >= 0 AND price_excl_vat <= 10000000)),
  availability     TEXT CHECK (availability IS NULL OR availability IN ('in_stock','coming_soon','to_order')),
  hidden           BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
