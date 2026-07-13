import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../../../utils/supabaseClient';
import { NewsFeed } from './NewsFeed';
import { Button } from '../../shared/components/Button';

export function HomeNewsWidget({ lang, onNavigate }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatest() {
      try {
        const { data, error } = await supabase
          .from('news_articles_accessible')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        
        const mappedArticles = (data || []).map(article => {
          let categoryKey = 'المناخ والصحة';
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
          const summary = rawContent.replace(/<[^>]+>/g, '').substring(0, 100) + '...';

          return {
            id: article.id,
            title: lang === 'en' && article.title_en ? article.title_en : article.title_ar,
            summary: summary,
            categoryKey: categoryKey,
            category: categoryLabel,
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
        console.error('Error fetching latest news:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLatest();
  }, [lang]);

  if (loading || articles.length === 0) return null;

  return (
    <section className="figma-discovery-section" style={{ padding: '60px 20px', position: 'relative', zIndex: 10 }}>
      <div className="discovery-container" style={{ maxWidth: '1700px', margin: '0 auto' }}>
        <h2 className="figma-section-title-main">
          {lang === 'ar' ? 'أحدث الأخبار والمقالات' : 'Latest News & Articles'}
        </h2>
        <NewsFeed 
          articles={articles} 
          lang={lang}
          hideFilters={true}
          onReadArticle={(article) => onNavigate('article', article.id)} 
        />
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <Button variant="gradient" style={{ padding: '14px 36px' }} onClick={() => onNavigate('news')}>
            {lang === 'ar' ? 'تصفح جميع الأخبار' : 'Browse All News'}
          </Button>
        </div>
      </div>
    </section>
  );
}
