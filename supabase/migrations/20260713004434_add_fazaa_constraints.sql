ALTER TABLE public.fazaa_requests DROP CONSTRAINT IF EXISTS chk_jordan_bounds;
ALTER TABLE public.fazaa_requests
  ADD CONSTRAINT chk_jordan_bounds CHECK (
    latitude IS NULL OR
    (latitude BETWEEN 29.0 AND 33.5 AND longitude BETWEEN 34.5 AND 39.5)
  );

ALTER TABLE public.fazaa_requests DROP CONSTRAINT IF EXISTS chk_realistic_price;
ALTER TABLE public.fazaa_requests
  ADD CONSTRAINT chk_realistic_price CHECK (price_jod >= 0 AND price_jod <= 1000);
