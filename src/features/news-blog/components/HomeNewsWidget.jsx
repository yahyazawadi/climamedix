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
          .limit(4);

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
            })
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
    <section className="figma-discovery-section" style={{ padding: '60px 20px', position: 'relative', zIndex: 10, background: 'rgba(255,255,255,0.3)' }}>
      <div className="discovery-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h2 className="discovery-title" style={{ margin: '0 0 10px 0', fontSize: '2rem', color: '#0b2849' }}>
              {lang === 'ar' ? 'أحدث الأخبار والمقالات' : 'Latest News & Articles'}
            </h2>
            <p className="discovery-subtitle" style={{ margin: 0, color: '#4a6b8c' }}>
              {lang === 'ar' ? 'ابق على اطلاع بآخر التطورات في مجال المناخ والصحة' : 'Stay informed with the latest developments in climate and health'}
            </p>
          </div>
          <Button variant="outline" onClick={() => onNavigate('news-blog')}>
            {lang === 'ar' ? 'عرض الكل' : 'View All'}
          </Button>
        </div>
        <NewsFeed 
          articles={articles} 
          lang={lang}
          hideFilters={true}
          onReadArticle={(article) => onNavigate('article', article.id)} 
        />
      </div>
    </section>
  );
}
