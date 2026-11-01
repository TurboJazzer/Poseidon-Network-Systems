-- The Poseidon Network website picture for an offer, made on the staff page (supplier logo, title and price
-- cut out, Poseidon logo added). Stored as base64 JPEG text so the website never depends on the supplier's site.
--   card_image    : base64 of the finished JPEG (never sent to the staff list; served by its own endpoint)
--   card_image_at : when it was made
-- photo_ok now simply means "this offer has a finished website picture" and is set by the picture endpoint.
-- Pictures approved under the old tick-box rule are no longer valid, so the flag is reset.
ALTER TABLE dell_offers ADD COLUMN card_image TEXT;
ALTER TABLE dell_offers ADD COLUMN card_image_at TIMESTAMPTZ;
UPDATE dell_offers SET photo_ok = FALSE;
