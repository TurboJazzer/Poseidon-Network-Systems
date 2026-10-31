-- Lets staff publish a checked Dell offer as a card on the public refurbished Dell page.
--  published     : staff ticked "show on the website" (only counts while status is 'listed')
--  photo_ok      : staff checked the photo has no supplier price on it and may be shown publicly
--  availability  : badge on the public card
--  website_text  : short public description (internal notes are never shown publicly)
ALTER TABLE dell_offers ADD COLUMN published BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE dell_offers ADD COLUMN photo_ok BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE dell_offers ADD COLUMN availability TEXT NOT NULL DEFAULT 'in_stock'
  CHECK (availability IN ('in_stock', 'coming_soon', 'to_order'));
ALTER TABLE dell_offers ADD COLUMN website_text TEXT;
CREATE INDEX dell_offers_published_idx ON dell_offers (published) WHERE published;
