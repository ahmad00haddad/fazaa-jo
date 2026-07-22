-- 1. التأكد من تفعيل RLS على الجداول المعنية
ALTER TABLE public.fazaa_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fazaa_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.area_watch ENABLE ROW LEVEL SECURITY;

-- 2. تأمين جدول الطلبات (fazaa_requests)
-- السماح بالإضافة (INSERT) فقط إذا كان الـ user_id مطابقاً للمستخدم الحالي
CREATE POLICY "Users can insert their own requests" 
ON public.fazaa_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- السماح بالتعديل (UPDATE) فقط لصاحب الطلب
CREATE POLICY "Users can update their own requests" 
ON public.fazaa_requests FOR UPDATE 
USING (auth.uid() = user_id);

-- السماح بالحذف (DELETE) فقط لصاحب الطلب
CREATE POLICY "Users can delete their own requests" 
ON public.fazaa_requests FOR DELETE 
USING (auth.uid() = user_id);

-- 3. تأمين جدول الاستجابات (fazaa_responses)
-- قراءة الاستجابات مسموحة للجميع (أو يمكن حصرها بصاحب الطلب والمستجيب)
CREATE POLICY "Public read access for responses" 
ON public.fazaa_responses FOR SELECT 
USING (true);

-- إضافة استجابة (INSERT) مسموحة فقط للمستخدم نفسه، وبشرط أن الطلب المستهدف "نشط"
CREATE POLICY "Users can insert responses for themselves" 
ON public.fazaa_responses FOR INSERT 
WITH CHECK (
  auth.uid() = responder_id 
  AND EXISTS (
    SELECT 1 FROM public.fazaa_requests 
    WHERE id = request_id AND status = 'active'
  )
);

-- التعديل (UPDATE) - يُسمح فقط لصاحب الطلب بقبول الاستجابة (accepted = true)
CREATE POLICY "Only request owners can accept responses" 
ON public.fazaa_responses FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.fazaa_requests 
    WHERE id = request_id AND user_id = auth.uid()
  )
);

-- الحذف (DELETE) - يُسمح للمستجيب بحذف استجابته، أو لصاحب الطلب برفضها (حذفها)
CREATE POLICY "Responders or Request Owners can delete responses" 
ON public.fazaa_responses FOR DELETE 
USING (
  auth.uid() = responder_id 
  OR EXISTS (
    SELECT 1 FROM public.fazaa_requests 
    WHERE id = request_id AND user_id = auth.uid()
  )
);

-- 4. تأمين جدول التواجد (area_watch)
-- القراءة للجميع
CREATE POLICY "Public read access for area watch" 
ON public.area_watch FOR SELECT USING (true);

-- الإضافة والحذف للمستخدم نفسه فقط
CREATE POLICY "Users can insert their own area watch" 
ON public.area_watch FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own area watch" 
ON public.area_watch FOR DELETE USING (auth.uid() = user_id);
