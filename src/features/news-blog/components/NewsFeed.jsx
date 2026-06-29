import { useState, useLayoutEffect, useRef } from 'preact/hooks';
import gsap from 'gsap';
import { ArticleCard } from './ArticleCard';

const CATEGORIES_MAP = {
  'الكل': { ar: 'الكل', en: 'All' },
  'المناخ والصحة': { ar: 'المناخ والصحة', en: 'Climate & Health' },
  'الأبحاث والابتكار': { ar: 'الأبحاث والابتكار', en: 'Research & Innovation' },
  'فرص وتطوير': { ar: 'فرص وتطوير', en: 'Opportunities & Dev' },
  'فعاليات ومؤتمرات': { ar: 'فعاليات ومؤتمرات', en: 'Events & Conferences' }
};

const CATEGORY_KEYS = Object.keys(CATEGORIES_MAP);

export function NewsFeed({ articles = [], onReadArticle, lang = 'ar', hideFilters = false }) {
  const [activeCategory, setActiveCategory] = useState('الكل');
  const feedRef = useRef(null);

  const filteredArticles = activeCategory === 'الكل'
    ? articles
    : articles.filter(art => art.categoryKey === activeCategory);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo('.article-card',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
      );
    }, feedRef);
    return () => ctx.revert();
  }, [activeCategory, articles.length]);

  return (
    <div ref={feedRef} className="news-feed-component" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {!hideFilters && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '35px', justifyContent: 'center' }}>
          {CATEGORY_KEYS.map(catKey => (
            <button
              key={catKey}
              className={`search-filter-tag ${activeCategory === catKey ? 'active' : ''}`}
              onClick={() => setActiveCategory(catKey)}
              style={{ fontSize: '13.5px', padding: '8px 20px' }}
            >
              {CATEGORIES_MAP[catKey][lang] || catKey}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
        {filteredArticles.map((art, idx) => (
          <div key={`${art.title}-${idx}`}>
            <ArticleCard
              {...art}
              lang={lang}
              onClick={() => onReadArticle(art)}
            />
          </div>
        ))}
        {filteredArticles.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'rgba(11, 40, 73, 0.5)', background: 'rgba(255,255,255,0.4)', borderRadius: '20px', border: '1px dashed rgba(11,40,73,0.2)' }}>
            {lang === 'ar' ? 'لا توجد مقالات في هذا القسم حالياً.' : 'No articles available in this category.'}
          </div>
        )}
      </div>
    </div>
  );
}
