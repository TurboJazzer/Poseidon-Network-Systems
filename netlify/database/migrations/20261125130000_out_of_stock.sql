-- Adds "out_of_stock" as a stock status for the refurbished Dell page.
-- Applies to the fixed cards (website_stock) and to published Dell offers (dell_offers).
-- The old check on each availability column is looked up by what it checks, so it is replaced whatever it was named.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conrelid::regclass AS tbl, c.conname
    FROM pg_constraint c
    WHERE c.contype = 'c'
      AND c.conrelid IN ('dell_offers'::regclass, 'website_stock'::regclass)
      AND pg_get_constraintdef(c.oid) ILIKE '%availability%'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
  END LOOP;
END $$;

ALTER TABLE dell_offers ADD CONSTRAINT dell_offers_availability_check
  CHECK (availability IN ('in_stock', 'coming_soon', 'to_order', 'out_of_stock'));
ALTER TABLE website_stock ADD CONSTRAINT website_stock_availability_check
  CHECK (availability IS NULL OR availability IN ('in_stock', 'coming_soon', 'to_order', 'out_of_stock'));
