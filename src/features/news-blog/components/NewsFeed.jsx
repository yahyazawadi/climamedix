import { useState, useMemo, useLayoutEffect, useEffect, useRef } from 'preact/hooks';
import gsap from 'gsap';
import { ArticleCard } from './ArticleCard';

export const KNOWN_CATEGORIES = {
  'الكل': { ar: 'الكل', en: 'All' },
  'all': { ar: 'الكل', en: 'All' },
  'أخرى': { ar: 'أخرى', en: 'Other' },
  'other': { ar: 'أخرى', en: 'Other' },
  'Other': { ar: 'أخرى', en: 'Other' },
  'المناخ والصحة': { ar: 'المناخ والصحة', en: 'Climate & Health' },
  'Climate & Health': { ar: 'المناخ والصحة', en: 'Climate & Health' },
  'climate_health': { ar: 'المناخ والصحة', en: 'Climate & Health' },
  'الأبحاث والابتكار': { ar: 'الأبحاث والابتكار', en: 'Research & Innovation' },
  'Research & Innovation': { ar: 'الأبحاث والابتكار', en: 'Research & Innovation' },
  'research': { ar: 'الأبحاث والابتكار', en: 'Research & Innovation' },
  'أبحاث': { ar: 'الأبحاث والابتكار', en: 'Research & Innovation' },
  'فرص وتطوير': { ar: 'فرص وتطوير', en: 'Opportunities & Dev' },
  'Opportunities & Dev': { ar: 'فرص وتطوير', en: 'Opportunities & Dev' },
  'opportunities': { ar: 'فرص وتطوير', en: 'Opportunities & Dev' },
  'فرص': { ar: 'فرص وتطوير', en: 'Opportunities & Dev' },
  'فعاليات ومؤتمرات': { ar: 'فعاليات ومؤتمرات', en: 'Events & Conferences' },
  'Events & Conferences': { ar: 'فعاليات ومؤتمرات', en: 'Events & Conferences' },
  'events': { ar: 'فعاليات ومؤتمرات', en: 'Events & Conferences' },
  'فعاليات': { ar: 'فعاليات ومؤتمرات', en: 'Events & Conferences' }
};

export function normalizeText(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();
}

export function categoriesMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const transA = KNOWN_CATEGORIES[a];
  const transB = KNOWN_CATEGORIES[b];
  if (transA && (transA.ar === b || transA.en === b)) return true;
  if (transB && (transB.ar === a || transB.en === a)) return true;
  if (transA && transB && (transA.ar === transB.ar || transA.en === transB.en)) return true;
  return false;
}

export function NewsFeed({ 
  articles = [], 
  categories, 
  onReadArticle, 
  onEditArticle, 
  user, 
  hasPermission, 
  lang = 'ar', 
  hideFilters = false, 
  horizontalScroll = false 
}) {
  const isRtl = lang === 'ar';
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const feedRef = useRef(null);

  // Group and count articles per category, sort descending by article count.
  // Maximum 4 top categories, and the 5th one is "أخرى" (Other) if more categories exist.
  const { categoryList, top4Categories } = useMemo(() => {
    const counts = new Map();
    articles.forEach(art => {
      const key = art.categoryKey || art.category;
      if (key && key !== 'الكل' && key !== 'All' && key !== 'all' && key !== 'أخرى' && key !== 'other' && key !== 'Other') {
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });

    let sortedCategories;
    if (categories && Array.isArray(categories)) {
      sortedCategories = categories.filter(c => c !== 'الكل' && c !== 'All' && c !== 'أخرى' && c !== 'other');
    } else {
      sortedCategories = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(entry => entry[0]);
    }

    const top4 = sortedCategories.slice(0, 4);
    const others = sortedCategories.slice(4);

    const list = ['الكل', ...top4];
    if (others.length > 0) {
      list.push('أخرى');
    }

    return {
      categoryList: list,
      top4Categories: top4
    };
  }, [articles, categories]);

  // If active category is no longer valid, gracefully reset to 'الكل'
  useEffect(() => {
    if (activeCategory !== 'الكل') {
      const exists = categoryList.some(cat => categoriesMatch(cat, activeCategory));
      if (!exists) {
        setActiveCategory('الكل');
      }
    }
  }, [categoryList, activeCategory]);

  // Combined category + search filter
  const filteredArticles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const isOtherActive = categoriesMatch(activeCategory, 'أخرى') || activeCategory === 'other' || activeCategory === 'Other';

    return articles.filter(art => {
      const catKey = art.categoryKey || art.category;

      let matchesCategory = false;
      if (activeCategory === 'الكل') {
        matchesCategory = true;
      } else if (isOtherActive) {
        // "Other" matches any article whose category is NOT in the top 4
        const inTop4 = top4Categories.some(topCat =>
          categoriesMatch(catKey, topCat) || categoriesMatch(art.category, topCat)
        );
        matchesCategory = !inTop4;
      } else {
        matchesCategory = categoriesMatch(catKey, activeCategory) ||
          categoriesMatch(art.category, activeCategory);
      }

      if (!matchesCategory) return false;

      if (!query) return true;
      const q = normalizeText(query);
      const searchTargets = [
        art.title,
        art.title_ar,
        art.title_en,
        art.summary,
        art.content_ar,
        art.content_en,
        art.author,
        art.author_name,
        art.category,
        art.categoryKey
      ];
      return searchTargets.some(target => normalizeText(target).includes(q));
    });
  }, [articles, activeCategory, searchQuery, top4Categories]);

  const animatedCardIdsRef = useRef(new Set());

  useLayoutEffect(() => {
    if (!feedRef.current) return;
    const cards = feedRef.current.querySelectorAll('.article-card, .figma-item-card');
    const newCards = [];
    cards.forEach(card => {
      const id = card.getAttribute('data-article-id');
      if (id) {
        if (!animatedCardIdsRef.current.has(id)) {
          animatedCardIdsRef.current.add(id);
          newCards.push(card);
        }
      } else {
        newCards.push(card);
      }
    });

    if (newCards.length > 0) {
      gsap.fromTo(newCards,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' }
      );
    }
  }, [activeCategory, filteredArticles]);

  return (
    <div ref={feedRef} className="news-feed-component" style={{ width: '100%', maxWidth: '1700px', margin: '0 auto' }}>
      
      {!hideFilters && (
        <div style={{ marginBottom: '35px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          
          {/* Search Bar with collision-free RTL / LTR padding */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '520px' }}>
            <span 
              style={{ 
                position: 'absolute', 
                top: '50%', 
                transform: 'translateY(-50%)',
                [isRtl ? 'right' : 'left']: '16px',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
                zIndex: 2
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onInput={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'ابحث في الأخبار والمقالات...' : 'Search news & articles...'}
              dir={isRtl ? 'rtl' : 'ltr'}
              style={{
                width: '100%',
                paddingTop: '12px',
                paddingBottom: '12px',
                paddingRight: isRtl ? '46px' : (searchQuery ? '40px' : '16px'),
                paddingLeft: isRtl ? (searchQuery ? '40px' : '16px') : '46px',
                borderRadius: '30px',
                border: '1.5px solid rgba(11, 40, 73, 0.15)',
                background: '#ffffff',
                fontSize: '14px',
                fontFamily: isRtl ? 'Tajawal, sans-serif' : 'Outfit, sans-serif',
                color: '#0b2849',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#15b47a';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(11, 40, 73, 0.15)';
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  [isRtl ? 'left' : 'right']: '14px',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '50%'
                }}
                title={isRtl ? 'مسح البحث' : 'Clear search'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>

          {/* Dynamically generated Category Filter Chips */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {categoryList.map(catKey => {
              const label = KNOWN_CATEGORIES[catKey]?.[lang] || catKey;
              const isActive = activeCategory === catKey;
              return (
                <button
                  key={catKey}
                  className={`search-filter-tag ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveCategory(catKey)}
                  style={{ fontSize: '13.5px', padding: '8px 20px' }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={horizontalScroll ? "figma-cards-horizontal-scroll" : "figma-cards-grid-3"}>
        {filteredArticles.map((art) => (
          <ArticleCard
            key={art.id || art.title}
            {...art}
            lang={lang}
            onClick={() => onReadArticle(art)}
            onEdit={() => onEditArticle?.(art)}
            canEdit={
              // manage:any_article = can edit ALL articles
              hasPermission?.('manage:any_article') ||
              // write:articles = can only edit OWN articles
              (hasPermission?.('write:articles') && user && user.id === art.created_by)
            }
          />
        ))}
        {filteredArticles.length === 0 && (
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            padding: '40px', 
            color: 'rgba(11, 40, 73, 0.7)', 
            background: 'rgba(255,255,255,0.6)', 
            borderRadius: '20px', 
            border: '1px dashed rgba(11,40,73,0.2)' 
          }}>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: '500', marginBottom: searchQuery ? '12px' : '0' }}>
              {searchQuery
                ? (lang === 'ar' ? 'لا توجد مقالات تطابق بحثك حالياً.' : 'No articles match your search.')
                : (lang === 'ar' ? 'لا توجد مقالات في هذا القسم حالياً.' : 'No articles available in this category.')}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: '#15b47a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '7px 18px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontFamily: isRtl ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
                }}
              >
                {lang === 'ar' ? 'مسح البحث' : 'Clear search'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
