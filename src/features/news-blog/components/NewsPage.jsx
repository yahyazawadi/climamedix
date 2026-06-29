import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../../../utils/supabaseClient';
import { NewsFeed } from './NewsFeed';

export function NewsPage({ lang, onNavigate }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

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
          let categoryKey = 'المناخ والصحة'; // Default
          if (article.category === 'research') categoryKey = 'الأبحاث والابتكار';
          if (article.category === 'opportunities') categoryKey = 'فرص وتطوير';
          if (article.category === 'events') categoryKey = 'فعاليات ومؤتمرات';
          
          let categoryLabel = categoryKey;
          if (lang === 'en') {
            if (article.category === 'climate_health') categoryLabel = 'Climate & Health';
            if (article.category === 'research') categoryLabel = 'Research & Innovation';
            if (article.category === 'opportunities') categoryLabel = 'Opportunities & Dev';
            if (article.category === 'events') categoryLabel = 'Events & Conferences';
          }

          const rawContent = lang === 'en' && article.content_en ? article.content_en : (article.content_ar || '');
          const summary = rawContent.replace(/<[^>]+>/g, '').substring(0, 120) + '...';

          return {
            id: article.id,
            title: lang === 'en' && article.title_en ? article.title_en : article.title_ar,
            summary: summary,
            categoryKey: categoryKey, // For filtering
            category: categoryLabel,  // For display
            image: article.cover_image,
            author: article.author_name,
            date: new Date(article.published_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-SA', {
              year: 'numeric', month: 'long', day: 'numeric'
            }),
            views_count: article.views_count || 0,
            likes_count: article.likes_count || 0
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

      <div style={{ 
        flexGrow: 1,
        padding: '50px 20px 80px 20px',
        position: 'relative',
        zIndex: 1,
        background: '#f8fafc',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#0b2849' }}>
            {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : (
          <NewsFeed 
            articles={articles} 
            lang={lang}
            onReadArticle={(article) => onNavigate('article', article.id)} 
          />
        )}
      </div>
    </div>
  );
}
