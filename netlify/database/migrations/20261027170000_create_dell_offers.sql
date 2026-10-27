-- Dell offers found in Universe Direct reseller emails.
-- Managed from the staff page /staff/dell-offers.html through netlify/functions/dell-offers.mjs.
-- Applied automatically by Netlify at deploy time. Do not edit once applied; add a new migration instead.

CREATE TABLE dell_offers (
  id                      BIGSERIAL PRIMARY KEY,
  model                   TEXT NOT NULL,
  cpu                     TEXT,
  ram                     TEXT,
  storage                 TEXT,
  screen                  TEXT,
  unit_condition          TEXT NOT NULL DEFAULT 'unknown'
                          CHECK (unit_condition IN ('refurbished', 'new', 'unknown')),
  supplier                TEXT NOT NULL DEFAULT 'Universe Direct',
  supplier_price_excl_vat NUMERIC(12, 2)
                          CHECK (supplier_price_excl_vat IS NULL OR supplier_price_excl_vat >= 0),
  our_price_excl_vat      NUMERIC(12, 2)
                          CHECK (our_price_excl_vat IS NULL OR our_price_excl_vat >= 0),
  -- Optional unique reference (for example the Gmail thread id) so the same offer is never saved twice.
  source_ref              TEXT UNIQUE,
  source_url              TEXT,
  first_seen              DATE NOT NULL DEFAULT CURRENT_DATE,
  status                  TEXT NOT NULL DEFAULT 'new'
                          CHECK (status IN ('new', 'listed', 'sold', 'dropped')),
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX dell_offers_status_seen_idx ON dell_offers (status, first_seen DESC);
