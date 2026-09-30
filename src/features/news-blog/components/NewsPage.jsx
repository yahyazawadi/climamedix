import { useState, useEffect, useRef } from 'preact/hooks';
import { lazy, Suspense } from 'preact/compat';
import { supabase } from '../../../utils/supabaseClient';
import { NewsFeed } from './NewsFeed';
import { useAuth } from '../../auth/hooks/useAuth';
import { extractSnippet } from '../../../utils/contentFormatter';

// Lazy-load the heavy Mapbox-based news map. An IntersectionObserver will
// mount it only when scrolled into view and unmount (freeing WebGL GPU RAM)
// when it leaves the viewport.
const NewsMap = lazy(() => import('./NewsMap').then(m => ({ default: m.NewsMap })));

export function NewsPage({ lang, onNavigate }) {
  const { user, hasPermission } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapVisible, setMapVisible] = useState(false);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      setMapVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setMapVisible(entry.isIntersecting),
      { rootMargin: '200px 0px' }
    );
    const el = mapContainerRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); observer.disconnect(); };
  }, []);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const { data, error } = await supabase
          .from('news_articles_accessible')
          .select('*')
          .order('published_at', { ascending: false });

        if (error) throw error;
        
        // Map data to match NewsFeed properties
        const mappedArticles = (data || []).map(article => {
          let categoryKey = article.category || 'المناخ والصحة';
          if (article.category === 'climate_health') categoryKey = 'المناخ والصحة';
          else if (article.category === 'research') categoryKey = 'الأبحاث والابتكار';
          else if (article.category === 'opportunities') categoryKey = 'فرص وتطوير';
          else if (article.category === 'events') categoryKey = 'فعاليات ومؤتمرات';
          
          let categoryLabel = categoryKey;
          if (lang === 'en') {
            if (article.category === 'climate_health' || categoryKey === 'المناخ والصحة') categoryLabel = 'Climate & Health';
            else if (article.category === 'research' || categoryKey === 'الأبحاث والابتكار') categoryLabel = 'Research & Innovation';
            else if (article.category === 'opportunities' || categoryKey === 'فرص وتطوير') categoryLabel = 'Opportunities & Dev';
            else if (article.category === 'events' || categoryKey === 'فعاليات ومؤتمرات') categoryLabel = 'Events & Conferences';
          }

          const rawContent = lang === 'en' && article.content_en ? article.content_en : (article.content_ar || '');
          const summary = extractSnippet(rawContent, 120);

          return {
            id: article.id,
            title: lang === 'en' && article.title_en ? article.title_en : article.title_ar,
            title_ar: article.title_ar,
            title_en: article.title_en,
            summary: summary,
            content_ar: article.content_ar,
            content_en: article.content_en,
            categoryKey: categoryKey, // For filtering
            category: categoryLabel,  // For display
            image: article.cover_image,
            author: article.author_name,
            date: new Date(article.published_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-SA', {
              year: 'numeric', month: 'long', day: 'numeric'
            }),
            views_count: article.views_count || 0,
            likes_count: article.likes_count || 0,
            created_by: article.created_by
          };
        });

        setArticles(mappedArticles);
      } catch (err) {
        console.error('Error fetching articles:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, [lang]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      
      {/* Header Banner Block */}
      <div 
        style={{
          background: 'linear-gradient(90deg, #15b47a 0%, #12a978 5%, #0c8774 23%, #066d71 41%, #025a6e 60%, #004f6d 79%, #004c6d 100%)',
          padding: '160px 20px 50px 20px',
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(11, 40, 73, 0.1)',
          direction: lang === 'ar' ? 'rtl' : 'ltr'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: 'clamp(28px, 4vw, 40px)', 
            fontWeight: 'bold', 
            color: '#ffffff', 
            marginBottom: '16px',
            fontFamily: lang === 'ar' ? 'Tajawal, sans-serif' : 'Outfit, sans-serif',
            textShadow: '0 2px 4px rgba(0,0,0,0.15)'
          }}>
            {lang === 'ar' ? 'الأخبار والمدونة' : 'News & Blog'}
          </h1>
          <p style={{ 
            fontSize: 'clamp(14px, 1.8vw, 16px)', 
            color: 'rgba(255, 255, 255, 0.9)', 
            maxWidth: '750px', 
            margin: '0 auto',
            lineHeight: '1.6',
            fontFamily: lang === 'ar' ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
          }}>
            {lang === 'ar' 
              ? 'اكتشف أحدث المقالات والأبحاث والفرص في مجال المناخ والصحة.' 
              : 'Discover the latest articles, research, and opportunities in climate and health.'}
          </p>
        </div>
      </div>

      <div 
        className="news-page-body"
        style={{ 
          flexGrow: 1,
          padding: 'clamp(20px, 4vw, 50px) clamp(12px, 3vw, 20px) 80px clamp(12px, 3vw, 20px)',
          position: 'relative',
          zIndex: 1,
          background: '#f8fafc',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div ref={mapContainerRef} style={{ maxWidth: '1200px', margin: '0 auto clamp(24px, 4vw, 40px) auto', width: '100%', minHeight: '400px' }}>
          {mapVisible ? (
            <Suspense fallback={<div style={{ width: '100%', height: '400px', borderRadius: '16px', background: '#eaf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#014C6D', fontFamily: 'Tajawal, sans-serif' }}>{lang === 'ar' ? 'جاري تحميل الخريطة...' : 'Loading map...'}</div>}>
              <NewsMap lang={lang} />
            </Suspense>
          ) : (
            <div style={{ width: '100%', height: '400px', borderRadius: '16px', background: '#eaf2f8' }} />
          )}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#0b2849' }}>
            {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : (
          <NewsFeed 
            articles={articles} 
            lang={lang}
            onReadArticle={(article) => onNavigate('article', article.id)} 
            onEditArticle={(article) => onNavigate('write-article', `id=${article.id}`)}
            user={user}
            hasPermission={hasPermission}
          />
        )}
      </div>
    </div>
  );
}
