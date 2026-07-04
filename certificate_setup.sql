-- ==========================================
-- 1. Create lesson_watch_metrics Table
-- Tracks granular video progress and anti-cheat telemetry
-- ==========================================
CREATE TABLE public.lesson_watch_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  furthest_second_reached numeric DEFAULT 0,
  max_percentage_watched numeric DEFAULT 0,
  actual_play_duration_seconds numeric DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT lesson_watch_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_watch_metrics_unique_user_lesson UNIQUE (user_id, lesson_id)
);

ALTER TABLE public.lesson_watch_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own watch metrics" ON public.lesson_watch_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own watch metrics" ON public.lesson_watch_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own watch metrics" ON public.lesson_watch_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all watch metrics" ON public.lesson_watch_metrics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin'))
);


-- ==========================================
-- 2. Create certificate_requests Table
-- Tracks student requests, pending statuses, and rejection reasons
-- ==========================================
CREATE TABLE public.certificate_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  requested_name_ar text,
  requested_name_en text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  rejection_reason text,
  requested_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamp with time zone,
  certificate_id text REFERENCES public.certificates(id), -- Links to the final issued cert from existing table
  CONSTRAINT certificate_requests_pkey PRIMARY KEY (id),
  CONSTRAINT certificate_requests_unique_user_course UNIQUE (user_id, course_id)
);

ALTER TABLE public.certificate_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own certificate requests" ON public.certificate_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own certificate requests" ON public.certificate_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own pending certificate requests" ON public.certificate_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all certificate requests" ON public.certificate_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin'))
);
