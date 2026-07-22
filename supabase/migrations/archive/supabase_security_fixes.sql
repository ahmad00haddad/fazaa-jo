-- المرحلة 1: التدخل الطارئ (Quick Fire Fixes)

-- إغلاق ثغرة "التعديل المفتوح" في fazaa_responses
DROP POLICY IF EXISTS "Only request owners can accept responses" ON public.fazaa_responses;
CREATE POLICY "Only request owners can accept responses" 
ON public.fazaa_responses FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.fazaa_requests 
    WHERE id = fazaa_responses.request_id AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fazaa_requests 
    WHERE id = fazaa_responses.request_id AND user_id = auth.uid()
  )
);

-- منع المستخدمين من الاستجابة لطلباتهم الخاصة
DROP POLICY IF EXISTS "Users can insert responses for themselves" ON public.fazaa_responses;
CREATE POLICY "Users can insert responses for themselves" 
ON public.fazaa_responses FOR INSERT 
WITH CHECK (
  auth.uid() = responder_id 
  AND EXISTS (
    SELECT 1 FROM public.fazaa_requests 
    WHERE id = request_id AND status = 'active' AND user_id != auth.uid()
  )
);

-- تعديل سياسة التقييم user_ratings للتأكد من أن المُقيَّم هو المتطوع الذي تم قبول استجابته بالفعل
DROP POLICY IF EXISTS "Users can insert ratings if they own the request" ON public.user_ratings;
CREATE POLICY "Users can insert ratings if they own the request" 
ON public.user_ratings FOR INSERT 
WITH CHECK (
  auth.uid() = rater_id AND
  EXISTS (
    SELECT 1 FROM public.fazaa_requests 
    WHERE id = request_id AND user_id = auth.uid()
  ) AND
  EXISTS (
    SELECT 1 FROM public.fazaa_responses
    WHERE request_id = public.user_ratings.request_id AND responder_id = public.user_ratings.responder_id AND accepted = true
  )
);


-- المرحلة 2 و 3: تعزيز المنطق التشغيلي وإنشاء المعاملات الذرية (RPC & Triggers)

-- سحب صلاحية إضافة الإشعارات من الـ Client لمنع السبام
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

-- إنشاء دالة RPC لتقديم المساعدة (تتولى إدخال الاستجابة وإرسال الإشعار)
CREATE OR REPLACE FUNCTION offer_help_rpc(
  p_request_id uuid,
  p_request_owner_id uuid,
  p_responder_id uuid,
  p_responder_name text,
  p_message text,
  p_offered_price_jod numeric
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert the response
  INSERT INTO public.fazaa_responses (request_id, responder_id, responder_name, message, offered_price_jod)
  VALUES (p_request_id, p_responder_id, p_responder_name, p_message, p_offered_price_jod);

  -- Insert the notification securely
  INSERT INTO public.notifications (user_id, title, body, link)
  VALUES (p_request_owner_id, 'فزعة جديدة!', p_responder_name || ' عرض تقديم المساعدة في طلبك', '/fazaa');
END;
$$;

-- إنشاء دالة RPC لقبول المساعدة (تتولى التحديثات وإرسال الإشعار كمعاملة ذرية)
CREATE OR REPLACE FUNCTION accept_response_rpc(
  p_response_id uuid,
  p_request_id uuid,
  p_responder_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user owns the request
  IF NOT EXISTS (SELECT 1 FROM public.fazaa_requests WHERE id = p_request_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Accept the response
  UPDATE public.fazaa_responses SET accepted = true WHERE id = p_response_id;

  -- Complete the request
  UPDATE public.fazaa_requests SET status = 'completed' WHERE id = p_request_id;

  -- Send notification to responder securely
  INSERT INTO public.notifications (user_id, title, body, link)
  VALUES (p_responder_id, 'تم قبول استجابتك!', 'تم اختيارك لتقديم الفزعة، تواصل مع صاحب الطلب الآن', '/history');
END;
$$;
