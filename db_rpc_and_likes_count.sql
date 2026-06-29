-- Run this script to add the missing RPC function and update the view to include likes count!

-- 1. Create RPC function for incrementing views
CREATE OR REPLACE FUNCTION public.increment_article_view(article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.news_articles
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update the accessible view to automatically calculate and include likes_count
DROP VIEW IF EXISTS public.news_articles_accessible;
CREATE OR REPLACE VIEW public.news_articles_accessible AS
SELECT 
    id, title_ar, title_en, category, cover_image, author_name, published_at,
    teaser_permission_key, full_access_permission_key, created_by, views_count,
    (SELECT count(*) FROM public.article_reactions WHERE article_id = news_articles.id) AS likes_count,
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
