DROP POLICY IF EXISTS "Allow read options" ON public.quiz_options; CREATE POLICY "Allow read options" ON public.quiz_options FOR SELECT USING (true); NOTIFY pgrst, 'reload schema';
