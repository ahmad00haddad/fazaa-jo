-- Drop the old policy if it exists to replace it with the gender-aware one
DROP POLICY IF EXISTS "Anyone can read fazaa_requests" ON public.fazaa_requests;

-- Create the new SELECT policy that enforces gender visibility
CREATE POLICY "Gender aware read policy for fazaa_requests" 
ON public.fazaa_requests 
FOR SELECT 
USING (
  -- If it's for everyone, allow read
  gender_visibility = 'all' 
  OR 
  -- If it's my own request, always allow read
  user_id = auth.uid()
  OR 
  -- If female_only, allow read only if current user's gender in profiles is 'female'
  (
    gender_visibility = 'female_only' 
    AND 
    (SELECT gender FROM public.profiles WHERE id = auth.uid()) = 'female'
  )
  OR
  -- If male_only, allow read only if current user's gender in profiles is 'male'
  (
    gender_visibility = 'male_only' 
    AND 
    (SELECT gender FROM public.profiles WHERE id = auth.uid()) = 'male'
  )
);
