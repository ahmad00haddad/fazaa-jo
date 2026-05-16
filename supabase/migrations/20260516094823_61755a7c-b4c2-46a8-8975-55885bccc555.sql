
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male','female')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Fazaa requests
CREATE TABLE public.fazaa_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  requester_gender TEXT NOT NULL,
  need TEXT NOT NULL,
  category TEXT NOT NULL,
  urgency TEXT NOT NULL,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fazaa_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_fazaa_requests_user ON public.fazaa_requests(user_id);
CREATE INDEX idx_fazaa_requests_created ON public.fazaa_requests(created_at DESC);

-- Fazaa responses
CREATE TABLE public.fazaa_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.fazaa_requests(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  responder_name TEXT NOT NULL,
  message TEXT,
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(request_id, responder_id)
);
ALTER TABLE public.fazaa_responses ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_fazaa_responses_request ON public.fazaa_responses(request_id);
CREATE INDEX idx_fazaa_responses_responder ON public.fazaa_responses(responder_id);

-- Helper function to check request ownership (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_request_owner(_request_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.fazaa_requests WHERE id = _request_id AND user_id = _user_id);
$$;

-- Profiles policies: own row only
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
-- Request owners can see profile (incl. phone) of accepted responders
CREATE POLICY "Request owners view accepted responder profile" ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.fazaa_responses r
      JOIN public.fazaa_requests req ON req.id = r.request_id
      WHERE r.responder_id = profiles.id
        AND req.user_id = auth.uid()
        AND r.accepted = TRUE
    )
  );

-- Fazaa requests policies
CREATE POLICY "Authenticated view all requests" ON public.fazaa_requests FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Users create own requests" ON public.fazaa_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner deletes request" ON public.fazaa_requests FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Fazaa responses policies
CREATE POLICY "Responder views own responses" ON public.fazaa_responses FOR SELECT
  TO authenticated USING (auth.uid() = responder_id);
CREATE POLICY "Request owner views responses" ON public.fazaa_responses FOR SELECT
  TO authenticated USING (public.is_request_owner(request_id, auth.uid()));
CREATE POLICY "Users create own response" ON public.fazaa_responses FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = responder_id
    AND NOT public.is_request_owner(request_id, auth.uid())
  );
CREATE POLICY "Request owner updates response" ON public.fazaa_responses FOR UPDATE
  TO authenticated USING (public.is_request_owner(request_id, auth.uid()));
CREATE POLICY "Responder or owner deletes response" ON public.fazaa_responses FOR DELETE
  TO authenticated USING (
    auth.uid() = responder_id OR public.is_request_owner(request_id, auth.uid())
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, gender)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'مستخدم'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'gender', 'male')
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
