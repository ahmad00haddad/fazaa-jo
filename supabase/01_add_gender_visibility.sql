-- Add gender_visibility column
ALTER TABLE public.fazaa_requests 
ADD COLUMN IF NOT EXISTS gender_visibility TEXT DEFAULT 'all';

-- Migrate old 'female_only' boolean to the new text column
UPDATE public.fazaa_requests
SET gender_visibility = 'female_only'
WHERE female_only = true;

-- Note: We can keep female_only for backward compatibility, or drop it later.
