-- Create some mock users in auth.users (Note: This requires pgcrypto for UUIDs)
-- This is a conceptual seed script. Supabase local dev provides a better way, 
-- but for production we can insert directly into profiles assuming auth users exist, 
-- OR for testing we can insert into both.

-- For simplicity in this seed script, we will insert into profiles with random UUIDs.
-- You might need to adjust auth.users depending on your testing environment.

DO $$
DECLARE
  male_id UUID := gen_random_uuid();
  female_id UUID := gen_random_uuid();
  city_names TEXT[] := ARRAY['عمّان', 'إربد', 'الزرقاء', 'العقبة', 'السلط'];
  categories TEXT[] := ARRAY['تعطل مركبة', 'دواء عاجل', 'توصيل ومشاوير', 'طوارئ منزل', 'أخرى'];
  urgencies TEXT[] := ARRAY['حرجة', 'عاجلة اليوم', 'عادية'];
  i INT;
  random_city TEXT;
  random_category TEXT;
  random_urgency TEXT;
  random_lat FLOAT;
  random_lng FLOAT;
  random_gender_vis TEXT;
BEGIN

  -- Insert mock profiles (assuming RLS allows it or running as superuser)
  INSERT INTO public.profiles (id, name, gender, verified)
  VALUES 
    (male_id, 'نشمي الأردن', 'male', true),
    (female_id, 'نشمية الأردن', 'female', true);

  -- Insert 40 random Fazaa requests
  FOR i IN 1..40 LOOP
    random_city := city_names[1 + mod(i, array_length(city_names, 1))];
    random_category := categories[1 + mod(i, array_length(categories, 1))];
    random_urgency := urgencies[1 + mod(i, array_length(urgencies, 1))];
    
    -- Random coordinates roughly within Jordan (Amman area 31.9, 35.9)
    random_lat := 31.9 + (random() * 0.5 - 0.25);
    random_lng := 35.9 + (random() * 0.5 - 0.25);

    -- Randomize gender visibility (mostly all, some female_only, some male_only)
    IF i % 5 = 0 THEN
      random_gender_vis := 'female_only';
    ELSIF i % 7 = 0 THEN
      random_gender_vis := 'male_only';
    ELSE
      random_gender_vis := 'all';
    END IF;

    INSERT INTO public.fazaa_requests (
      user_id, 
      requester_name, 
      requester_gender, 
      need, 
      category, 
      urgency, 
      location, 
      latitude, 
      longitude, 
      gender_visibility,
      female_only,
      city, 
      status, 
      requester_verified, 
      price_jod
    )
    VALUES (
      CASE WHEN i % 2 = 0 THEN male_id ELSE female_id END,
      CASE WHEN i % 2 = 0 THEN 'نشمي الأردن' ELSE 'نشمية الأردن' END,
      CASE WHEN i % 2 = 0 THEN 'male' ELSE 'female' END,
      'طلب فزعة تجريبي رقم ' || i || ' للتدريب والاختبار',
      random_category,
      random_urgency,
      random_city || ' - منطقة ' || i,
      random_lat,
      random_lng,
      random_gender_vis,
      CASE WHEN random_gender_vis = 'female_only' THEN true ELSE false END,
      random_city,
      'active',
      true,
      (i % 5) * 2 -- Random prices 0, 2, 4, 6, 8
    );
  END LOOP;
END $$;
