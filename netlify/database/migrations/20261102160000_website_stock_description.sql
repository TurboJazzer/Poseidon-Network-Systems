-- Staff can also reword the description line on a fixed card. NULL means the description written in the page.
ALTER TABLE website_stock ADD COLUMN description TEXT CHECK (description IS NULL OR char_length(description) <= 300);
