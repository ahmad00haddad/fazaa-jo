-- 1. جدول الإشعارات (Notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  title text not null,
  body text not null,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 2. جدول التقييمات (Ratings) للمستجيبين
CREATE TABLE IF NOT EXISTS public.user_ratings (
  id uuid default gen_random_uuid() primary key,
  request_id uuid references public.fazaa_requests(id) not null,
  rater_id uuid not null,
  responder_id uuid not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  created_at timestamptz default now(),
  UNIQUE(request_id)
);

ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for ratings" 
ON public.user_ratings FOR SELECT USING (true);

CREATE POLICY "Users can insert ratings if they own the request" 
ON public.user_ratings FOR INSERT 
WITH CHECK (
  auth.uid() = rater_id AND
  EXISTS (SELECT 1 FROM public.fazaa_requests WHERE id = request_id AND user_id = auth.uid())
);
