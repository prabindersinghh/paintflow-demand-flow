
-- Add pack_size_litres to products table
ALTER TABLE public.products ADD COLUMN pack_size_litres numeric NOT NULL DEFAULT 1;

-- Update existing products with realistic pack sizes based on category
-- Interior paints: mostly 1L, 4L, 10L
-- Exterior paints: mostly 4L, 10L, 20L
-- Primers/Putty: mostly 1L, 4L, 10L
-- Enamels/Wood: mostly 1L, 4L

UPDATE public.products SET pack_size_litres = CASE
  WHEN category ILIKE '%exterior%' AND name ILIKE '%drum%' THEN 20
  WHEN category ILIKE '%exterior%' AND name ILIKE '%bucket%' THEN 10
  WHEN category ILIKE '%exterior%' THEN 10
  WHEN category ILIKE '%primer%' OR category ILIKE '%putty%' THEN 4
  WHEN category ILIKE '%enamel%' OR category ILIKE '%wood%' THEN 1
  WHEN name ILIKE '%premium%' OR name ILIKE '%luxury%' THEN 4
  ELSE
    -- Distribute across pack sizes based on sku hash for variety
    CASE (abs(hashtext(sku)) % 4)
      WHEN 0 THEN 1
      WHEN 1 THEN 4
      WHEN 2 THEN 10
      WHEN 3 THEN 20
    END
END;
