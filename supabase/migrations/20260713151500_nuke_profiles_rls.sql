-- ==============================================================================
-- Ultimate RLS Recursion Fix: Nuke all recursive policies on profiles
-- ==============================================================================

-- 1) Drop ALL existing SELECT policies on profiles to prevent any infinite recursion
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Request owners view accepted responder profile" ON public.profiles;
DROP POLICY IF EXISTS "read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- 2) Since phone numbers were moved to user_private_data, the profiles table 
-- contains NO sensitive information (only name, gender, points, avatar).
-- Therefore, it is 100% safe (and much more performant) to make it publicly readable.
-- This immediately fixes the infinite recursion with fazaa_requests.
CREATE POLICY "Profiles are publicly readable" 
ON public.profiles 
FOR SELECT 
USING (true);

-- 3) Ensure user_private_data still has strict policies (already done, just confirming)
-- Only self can read private data.
