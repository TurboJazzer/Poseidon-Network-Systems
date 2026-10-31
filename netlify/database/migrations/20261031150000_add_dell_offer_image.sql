-- Product photo for each Dell offer, taken from the Universe Direct product page.
-- image_url is the full-size photo address; image_checked_at stops the site searching again on every page view.
ALTER TABLE dell_offers ADD COLUMN image_url TEXT;
ALTER TABLE dell_offers ADD COLUMN image_checked_at TIMESTAMPTZ;
