CREATE TABLE public.news_map_nodes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  radius_km numeric DEFAULT 0,
  icon_type text DEFAULT 'alert',
  description_ar text,
  description_en text,
  link text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT news_map_nodes_pkey PRIMARY KEY (id),
  CONSTRAINT news_map_nodes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- RLS policies
ALTER TABLE public.news_map_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view map nodes"
ON public.news_map_nodes FOR SELECT
USING (true);

-- Assuming admins use the service role or a specific RLS policy based on profiles.role
-- For now, allow auth users to insert if we handle permissions in the app.
CREATE POLICY "Authenticated users can insert nodes"
ON public.news_map_nodes FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own nodes"
ON public.news_map_nodes FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own nodes"
ON public.news_map_nodes FOR DELETE
USING (auth.uid() = created_by);
