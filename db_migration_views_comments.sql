-- 1. Add views_count to news_articles
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 2. Create article_reactions table to track likes/hearts per user
CREATE TABLE IF NOT EXISTS public.article_reactions (
    article_id UUID REFERENCES public.news_articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (article_id, user_id)
);

-- Enable RLS on article_reactions
ALTER TABLE public.article_reactions ENABLE ROW LEVEL SECURITY;

-- Reactions Policies: Anyone can read reactions, but only authenticated users can insert/delete their own
CREATE POLICY "Allow read reactions" ON public.article_reactions FOR SELECT USING (true);
CREATE POLICY "Allow insert own reaction" ON public.article_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow delete own reaction" ON public.article_reactions FOR DELETE USING (auth.uid() = user_id);

-- 3. Create article_comments table
CREATE TABLE IF NOT EXISTS public.article_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES public.news_articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on article_comments
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;

-- Comments Policies: Anyone can read comments, but only authenticated users can insert their own, and only the author or an admin can delete
CREATE POLICY "Allow read comments" ON public.article_comments FOR SELECT USING (true);
CREATE POLICY "Allow insert own comment" ON public.article_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow update own comment" ON public.article_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow delete own comment" ON public.article_comments FOR DELETE USING (auth.uid() = user_id OR public.has_permission(auth.uid(), 'admin:manage_users'));

-- 4. Update the news_articles_accessible view to include views_count
DROP VIEW IF EXISTS public.news_articles_accessible;
CREATE OR REPLACE VIEW public.news_articles_accessible AS
SELECT 
    id, title_ar, title_en, category, cover_image, author_name, published_at,
    teaser_permission_key, full_access_permission_key, created_by, views_count,
    CASE 
        WHEN public.has_permission(auth.uid(), full_access_permission_key) OR created_by = auth.uid() 
        THEN content_ar 
        ELSE NULL 
    END AS content_ar,
    CASE 
        WHEN public.has_permission(auth.uid(), full_access_permission_key) OR created_by = auth.uid() 
        THEN content_en 
        ELSE NULL 
    END AS content_en
FROM public.news_articles
WHERE public.has_permission(auth.uid(), teaser_permission_key) 
   OR public.has_permission(auth.uid(), full_access_permission_key)
   OR created_by = auth.uid();

GRANT SELECT ON public.news_articles_accessible TO anon, authenticated;
