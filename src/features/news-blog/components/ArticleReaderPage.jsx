import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../../../utils/supabaseClient';
import { Button } from '../../shared/components/Button';
import { GlassCard } from '../../shared/components/GlassCard';
import { AmbientParticles } from '../../shared/components/AmbientParticles';
import { ShareActionButtons } from '../../shared/components/ShareActionButtons';
import { useAuth } from '../../auth/hooks/useAuth';
import { formatArticleContent } from '../../../utils/contentFormatter';
import 'react-quill/dist/quill.snow.css';

export function ArticleReaderPage({ lang, onNavigate }) {
  const { user, hasPermission } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');

        if (!articleId) {
          setErrorMsg(lang === 'ar' ? 'المقال غير موجود' : 'Article not found');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('news_articles_accessible')
          .select('*')
          .eq('id', articleId)
          .single();

        if (error) throw error;
        if (!data) {
          setErrorMsg(lang === 'ar' ? 'المقال غير موجود' : 'Article not found');
        } else {
          // Fetch author avatar
          if (data.created_by) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('avatar_url')
              .eq('id', data.created_by)
              .single();
            if (profileData?.avatar_url) {
              data.author_avatar = profileData.avatar_url;
            }
          }

          let userLiked = false;
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: reaction } = await supabase
              .from('article_reactions')
              .select('user_id')
              .eq('article_id', articleId)
              .eq('user_id', user.id)
              .single();
            if (reaction) userLiked = true;
          }

          supabase.rpc('increment_article_view', { article_id: articleId }).then();

          setArticle({ 
            ...data, 
            userLiked, 
            views_count: (data.views_count || 0) + 1 
          });
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setErrorMsg(lang === 'ar' ? 'حدث خطأ أثناء تحميل المقال' : 'Error loading article');
      } finally {
        setLoading(false);
      }
    }
    
    fetchArticle();
  }, [lang]);

  if (loading) {
    return (
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <AmbientParticles />
        </div>
        <div style={{ paddingTop: 'clamp(120px, 12vw, 140px)', paddingBottom: '60px', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '0 clamp(12px, 3vw, 20px)' }}>
            <GlassCard style={{ padding: '0', overflow: 'hidden', borderRadius: 'clamp(16px, 3vw, 24px)' }}>
              <div style={{ width: '100%', height: 'clamp(200px, 40vw, 480px)', backgroundColor: 'rgba(11,40,73,0.05)', animation: 'pulse 1.5s infinite' }}></div>
              <div style={{ padding: 'clamp(16px, 4vw, 40px)' }}>
                <div style={{ width: '60%', height: '40px', backgroundColor: 'rgba(11,40,73,0.05)', marginBottom: '20px', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
                <div style={{ width: '30%', height: '20px', backgroundColor: 'rgba(11,40,73,0.05)', marginBottom: '40px', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
                
                <div style={{ width: '100%', height: '16px', backgroundColor: 'rgba(11,40,73,0.05)', marginBottom: '12px', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
                <div style={{ width: '100%', height: '16px', backgroundColor: 'rgba(11,40,73,0.05)', marginBottom: '12px', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
                <div style={{ width: '80%', height: '16px', backgroundColor: 'rgba(11,40,73,0.05)', marginBottom: '12px', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg || !article) {
    return (
      <div style={{ paddingTop: '150px', paddingBottom: '100px', minHeight: '100vh', textAlign: 'center', color: '#0b2849' }}>
        <h2>{errorMsg}</h2>
        <Button variant="outline" onClick={() => onNavigate('news-blog')} style={{ marginTop: '20px' }}>
          {lang === 'ar' ? 'العودة للأخبار' : 'Back to News'}
        </Button>
      </div>
    );
  }

  const isRtl = lang === 'ar';
  const title = lang === 'en' && article.title_en ? article.title_en : article.title_ar;
  const rawContent = lang === 'en' && article.content_en ? article.content_en : (article.content_ar || '');
  const content = formatArticleContent(rawContent);
  const dateStr = new Date(article.published_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const handleToggleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert(lang === 'ar' ? 'يرجى تسجيل الدخول أولاً للإعجاب' : 'Please login first to like');
      return;
    }
    
    if (article.userLiked) {
      await supabase.from('article_reactions').delete().eq('article_id', article.id).eq('user_id', user.id);
      setArticle(prev => ({
        ...prev,
        userLiked: false,
        likes_count: Math.max(0, (prev.likes_count || 0) - 1)
      }));
    } else {
      await supabase.from('article_reactions').insert({ article_id: article.id, user_id: user.id });
      setArticle(prev => ({
        ...prev,
        userLiked: true,
        likes_count: (prev.likes_count || 0) + 1
      }));
    }
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <AmbientParticles />
      </div>
      <div style={{ paddingTop: 'clamp(120px, 12vw, 140px)', paddingBottom: '60px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '0 clamp(12px, 3vw, 20px)' }}>
        
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <Button variant="text" onClick={() => onNavigate('news')} style={{ padding: '4px 0', color: '#4a6b8c', fontSize: '15px' }}>
            {lang === 'ar' ? '→ العودة للأخبار' : '← Back to News'}
          </Button>
        </div>

        <GlassCard style={{ padding: '0', overflow: 'hidden', borderRadius: 'clamp(16px, 3vw, 24px)' }}>
          {article.cover_image && (
            <div style={{ width: '100%', height: 'clamp(200px, 45vw, 480px)', maxHeight: '480px', overflow: 'hidden', backgroundColor: '#e2effa' }}>
              <img 
                src={article.cover_image} 
                alt={title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
          )}
          
          <div style={{ padding: 'clamp(16px, 4vw, 40px)' }} dir={isRtl ? 'rtl' : 'ltr'}>
            <h1 style={{ 
              fontSize: 'clamp(1.35rem, 3.5vw, 2.2rem)', 
              color: '#0b2849', 
              marginBottom: '18px', 
              fontFamily: 'var(--font-heading)',
              lineHeight: '1.4',
              textAlign: isRtl ? 'right' : 'left',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}>
              {title}
            </h1>
            
            <div className="article-meta-header" style={{ 
              marginBottom: '24px', 
              paddingBottom: '16px', 
              borderBottom: '1px solid rgba(11, 40, 73, 0.1)'
            }}>
              {/* Row 1: Author */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  {article.author_avatar && (
                    <img 
                      src={article.author_avatar} 
                      alt={article.author_name}
                      style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                  )}
                  <span style={{ wordBreak: 'break-word', color: '#0b2849', fontSize: '0.95rem' }}>
                    <strong>{lang === 'ar' ? 'بواسطة:' : 'By:'}</strong> {article.author_name}
                  </span>
                </span>
              </div>

              {/* Row 2: Date on start side, Views on the opposite side of date (same row!) */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginTop: '10px',
                color: '#64748b', 
                fontSize: '0.88rem' 
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  {dateStr}
                </span>

                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }} title={lang === 'ar' ? 'المشاهدات' : 'Views'}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  {article.views_count || 0}
                </span>
              </div>

              {/* Row 3: Action Buttons (Heart with likes badge on right, Share & Edit on left) */}
              <div style={{ 
                display: 'flex', 
                width: '100%',
                marginTop: '12px', 
                paddingTop: '12px', 
                borderTop: '1px dashed rgba(11, 40, 73, 0.08)' 
              }}>
                <ShareActionButtons 
                  lang={lang} 
                  title={title}
                  onLike={handleToggleLike}
                  userLiked={article.userLiked}
                  likesCount={article.likes_count || 0}
                  onEdit={
                    (hasPermission?.('manage:any_article') ||
                    (hasPermission?.('write:articles') && user?.id === article.created_by))
                      ? () => onNavigate('write-article', `id=${article.id}`)
                      : undefined
                  }
                />
              </div>
            </div>

            <div 
              className={`article-content ql-editor ${isRtl ? 'ql-direction-rtl' : ''}`}
              dir={isRtl ? 'rtl' : 'ltr'}
              style={{ 
                color: '#2a415a', 
                fontSize: 'clamp(1rem, 2.5vw, 1.1rem)', 
                lineHeight: '1.85',
                fontFamily: 'var(--font-body)',
                padding: 0,
                overflowY: 'visible',
                direction: isRtl ? 'rtl' : 'ltr',
                textAlign: isRtl ? 'right' : 'left',
                overflowWrap: 'break-word',
                wordBreak: 'break-word'
              }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
            <style dangerouslySetInnerHTML={{__html: `
              .article-content[dir="rtl"],
              .article-content.ql-direction-rtl {
                direction: rtl !important;
                text-align: right !important;
              }
              .article-content[dir="ltr"] {
                direction: ltr !important;
                text-align: left !important;
              }
              .article-content {
                overflow-wrap: break-word !important;
                word-break: break-word !important;
                max-width: 100% !important;
              }
              .article-content h1, .article-content h2, .article-content h3, .article-content h4 {
                color: #0b2849;
                font-family: var(--font-heading);
                font-weight: 700;
                margin-top: 1.6em;
                margin-bottom: 0.7em;
                line-height: 1.4;
                text-align: inherit;
                word-break: break-word;
                overflow-wrap: break-word;
              }
              .article-content h1 { font-size: clamp(1.4rem, 3.5vw, 1.8rem); border-bottom: 2px solid rgba(21, 180, 122, 0.2); padding-bottom: 8px; }
              .article-content h2 { font-size: clamp(1.25rem, 3vw, 1.5rem); }
              .article-content h3 { font-size: clamp(1.1rem, 2.5vw, 1.25rem); color: #15b47a; }
              .article-content h4 { font-size: clamp(1rem, 2vw, 1.1rem); }
              .article-content p {
                margin-bottom: 1.2em;
                line-height: 1.85;
                text-align: inherit !important;
                word-break: break-word;
                overflow-wrap: break-word;
              }
              .article-content ul {
                list-style-type: disc !important;
                margin: 1.2em 0 !important;
                padding-inline-start: 1.8em !important;
                padding-inline-end: 0 !important;
              }
              .article-content ol {
                list-style-type: decimal !important;
                margin: 1.2em 0 !important;
                padding-inline-start: 1.8em !important;
                padding-inline-end: 0 !important;
              }
              .article-content ul li,
              .article-content ol li,
              .article-content li {
                display: list-item !important;
                list-style-type: inherit !important;
                padding: 0 !important;
                margin-bottom: 0.6em !important;
                line-height: 1.85 !important;
                text-align: inherit !important;
                word-break: break-word;
                overflow-wrap: break-word;
              }
              .article-content li::before {
                content: none !important;
                display: none !important;
              }
              .article-content img {
                max-width: 100% !important;
                height: auto !important;
                border-radius: 12px;
              }
              .article-content video, .article-content iframe {
                max-width: 100% !important;
                border-radius: 12px;
              }
              .article-content table {
                width: 100% !important;
                display: block;
                overflow-x: auto;
              }
              .article-content strong {
                color: #0b2849;
                font-weight: 700;
              }
              .article-content blockquote {
                border-inline-start: 4px solid #15b47a;
                margin: 1.5em 0;
                padding: 10px 20px;
                background: rgba(21, 180, 122, 0.05);
                border-radius: 4px;
                color: #004c6d;
                font-style: italic;
              }
            `}} />
          </div>
        </GlassCard>
      </div>
      </div>
    </div>
  );
}
