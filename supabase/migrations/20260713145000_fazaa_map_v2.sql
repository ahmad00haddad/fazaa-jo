-- ==============================================================================
-- FazaaMap v2: PostGIS + Realtime + Geo-Fuzzing + RPCs
-- ==============================================================================

-- 1) تفعيل PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2) إضافة العمود الجغرافي وتحديث البيانات القديمة
ALTER TABLE public.fazaa_requests
ADD COLUMN IF NOT EXISTS geom_location geography(POINT, 4326);

UPDATE public.fazaa_requests
SET geom_location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND geom_location IS NULL;

-- 3) إنشاء مؤشر GiST لتسريع الاستعلامات المكانية
CREATE INDEX IF NOT EXISTS fazaa_requests_geom_location_idx
ON public.fazaa_requests USING GIST (geom_location);

-- ==============================================================================
-- دوال الخصوصية (Geo-fuzzing)
-- ==============================================================================
-- دالة تقوم بإزاحة الموقع عشوائياً بحد أقصى 200 متر لحماية هوية طالب الفزعة
CREATE OR REPLACE FUNCTION public.fuzz_location(geom geography)
RETURNS geography
LANGUAGE sql IMMUTABLE
AS $$
  SELECT ST_Project(
    geom,
    random() * 200,          -- المسافة العشوائية حتى 200م
    random() * pi() * 2      -- الزاوية العشوائية (360 درجة)
  )::geography;
$$;

-- ==============================================================================
-- RPC: requests_in_view (Bounding Box)
-- تجلب الطلبات داخل الإطار المرئي فقط، مع تطبيق RLS للخصوصية و Fuzzing
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.requests_in_view(
  min_lat float,
  min_long float,
  max_lat float,
  max_long float
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  category text,
  urgency text,
  status text,
  geom_location geography,
  latitude float,
  longitude float,
  price_jod numeric,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_gender text;
BEGIN
  -- جلب جنس المستخدم الحالي لتطبيق قاعدة female_only
  SELECT gender INTO v_gender FROM public.profiles WHERE profiles.id = v_uid;

  RETURN QUERY
  SELECT 
    r.id,
    r.user_id,
    r.category,
    r.urgency,
    r.status,
    -- تطبيق Geo-Fuzzing إذا لم يكن الطلب لي، ولم أكن المستجيب المقبول
    CASE
      WHEN r.user_id = v_uid THEN r.geom_location
      WHEN EXISTS (
        SELECT 1 FROM public.fazaa_responses fr
        WHERE fr.request_id = r.id AND fr.responder_id = v_uid AND fr.accepted = true
      ) THEN r.geom_location
      ELSE public.fuzz_location(r.geom_location)
    END AS geom_location,
    ST_Y(
      (CASE
        WHEN r.user_id = v_uid THEN r.geom_location
        WHEN EXISTS (
          SELECT 1 FROM public.fazaa_responses fr
          WHERE fr.request_id = r.id AND fr.responder_id = v_uid AND fr.accepted = true
        ) THEN r.geom_location
        ELSE public.fuzz_location(r.geom_location)
      END)::geometry
    ) AS latitude,
    ST_X(
      (CASE
        WHEN r.user_id = v_uid THEN r.geom_location
        WHEN EXISTS (
          SELECT 1 FROM public.fazaa_responses fr
          WHERE fr.request_id = r.id AND fr.responder_id = v_uid AND fr.accepted = true
        ) THEN r.geom_location
        ELSE public.fuzz_location(r.geom_location)
      END)::geometry
    ) AS longitude,
    r.price_jod,
    r.created_at
  FROM public.fazaa_requests r
  WHERE 
    -- التحقق من التواجد ضمن البوكس المرئي (Box Filtering)
    r.geom_location::geometry && ST_MakeEnvelope(min_long, min_lat, max_long, max_lat, 4326)
    AND r.status IN ('active', 'in_progress')
    AND (
      -- قاعدة الخصوصية للإناث
      r.female_only = false
      OR v_gender = 'female' 
      OR r.user_id = v_uid
    );
END $$;

-- ==============================================================================
-- RPC: nearby_requests (Radius Search)
-- تجلب الطلبات القريبة مرتبة حسب المسافة الأقرب فالأقرب
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.nearby_requests(
  lat float,
  long float,
  radius_m float DEFAULT 5000
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  category text,
  urgency text,
  status text,
  distance_meters float,
  geom_location geography,
  latitude float,
  longitude float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_gender text;
  v_center geography := ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography;
BEGIN
  SELECT gender INTO v_gender FROM public.profiles WHERE profiles.id = v_uid;

  RETURN QUERY
  SELECT 
    r.id,
    r.user_id,
    r.category,
    r.urgency,
    r.status,
    ST_Distance(r.geom_location, v_center) AS distance_meters,
    CASE
      WHEN r.user_id = v_uid THEN r.geom_location
      WHEN EXISTS (SELECT 1 FROM public.fazaa_responses fr WHERE fr.request_id = r.id AND fr.responder_id = v_uid AND fr.accepted = true) THEN r.geom_location
      ELSE public.fuzz_location(r.geom_location)
    END AS geom_location,
    ST_Y(
      (CASE
        WHEN r.user_id = v_uid THEN r.geom_location
        WHEN EXISTS (SELECT 1 FROM public.fazaa_responses fr WHERE fr.request_id = r.id AND fr.responder_id = v_uid AND fr.accepted = true) THEN r.geom_location
        ELSE public.fuzz_location(r.geom_location)
      END)::geometry
    ) AS latitude,
    ST_X(
      (CASE
        WHEN r.user_id = v_uid THEN r.geom_location
        WHEN EXISTS (SELECT 1 FROM public.fazaa_responses fr WHERE fr.request_id = r.id AND fr.responder_id = v_uid AND fr.accepted = true) THEN r.geom_location
        ELSE public.fuzz_location(r.geom_location)
      END)::geometry
    ) AS longitude
  FROM public.fazaa_requests r
  WHERE 
    ST_DWithin(r.geom_location, v_center, radius_m)
    AND r.status IN ('active', 'in_progress')
    AND (r.female_only = false OR v_gender = 'female' OR r.user_id = v_uid)
  ORDER BY r.geom_location <-> v_center
  LIMIT 100;
END $$;

-- الصلاحيات
REVOKE ALL ON FUNCTION public.requests_in_view(float, float, float, float) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.requests_in_view(float, float, float, float) TO authenticated;

REVOKE ALL ON FUNCTION public.nearby_requests(float, float, float) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nearby_requests(float, float, float) TO authenticated;

-- ==============================================================================
-- ترقية التريجر التلقائي
-- عند إضافة طلب عبر التطبيق وإرسال latitude / longitude، يتم توليد geom_location
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.sync_geom_location()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geom_location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS fazaa_requests_geom_sync_trg ON public.fazaa_requests;
CREATE TRIGGER fazaa_requests_geom_sync_trg
BEFORE INSERT OR UPDATE OF latitude, longitude
ON public.fazaa_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_geom_location();
