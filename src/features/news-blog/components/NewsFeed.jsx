import { useState, useLayoutEffect, useRef } from 'preact/hooks';
import gsap from 'gsap';
import { ArticleCard } from './ArticleCard';

const CATEGORIES = ['الكل', 'المناخ والصحة', 'الأبحاث والابتكار', 'فرص وتطوير', 'فعاليات ومؤتمرات'];

export function NewsFeed({ articles = [], onReadArticle }) {
  const [activeCategory, setActiveCategory] = useState('الكل');
  const feedRef = useRef(null);

  const filteredArticles = activeCategory === 'الكل'
    ? articles
    : articles.filter(art => art.category === activeCategory);

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
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '35px', justifyContent: 'center' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`search-filter-tag ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
            style={{ fontSize: '13.5px', padding: '8px 20px' }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
        {filteredArticles.map((art, idx) => (
          <div key={`${art.title}-${idx}`}>
            <ArticleCard
              {...art}
              onClick={() => onReadArticle(art)}
            />
          </div>
        ))}
        {filteredArticles.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'rgba(11, 40, 73, 0.5)', background: 'rgba(255,255,255,0.4)', borderRadius: '20px', border: '1px dashed rgba(11,40,73,0.2)' }}>
            لا توجد مقالات في هذا القسم حالياً.
          </div>
        )}
      </div>
    </div>
  );
}
