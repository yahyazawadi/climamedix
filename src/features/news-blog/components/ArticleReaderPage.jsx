import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../../../utils/supabaseClient';
import { Button } from '../../shared/components/Button';
import { GlassCard } from '../../shared/components/GlassCard';
import 'react-quill/dist/quill.snow.css';

export function ArticleReaderPage({ lang, onNavigate }) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copied, setCopied] = useState(false);

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
      <div style={{ paddingTop: '150px', paddingBottom: '100px', minHeight: '100vh', textAlign: 'center', color: '#0b2849' }}>
        {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
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

  const title = lang === 'en' && article.title_en ? article.title_en : article.title_ar;
  const content = lang === 'en' && article.content_en ? article.content_en : (article.content_ar || '');
  const dateStr = new Date(article.published_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert(lang === 'ar' ? 'تم نسخ الرابط إلى الحافظة' : 'Link copied to clipboard');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    <div style={{ paddingTop: '100px', paddingBottom: '80px', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px' }}>
        
        <div style={{ marginBottom: '20px' }}>
          <Button variant="text" onClick={() => onNavigate('news-blog')} style={{ padding: 0, color: '#4a6b8c' }}>
            {lang === 'ar' ? '← العودة للأخبار' : '→ Back to News'}
          </Button>
        </div>

        <GlassCard style={{ padding: '0', overflow: 'hidden', borderRadius: '24px' }}>
          {article.cover_image && (
            <div style={{ width: '100%', height: '350px', overflow: 'hidden', backgroundColor: '#e2effa' }}>
              <img 
                src={article.cover_image} 
                alt={title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
          )}
          
          <div style={{ padding: '40px' }}>
            <h1 style={{ 
              fontSize: '2.2rem', 
              color: '#0b2849', 
              marginBottom: '20px', 
              fontFamily: 'var(--font-heading)',
              lineHeight: '1.4'
            }}>
              {title}
            </h1>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px', 
              paddingBottom: '20px', 
              borderBottom: '1px solid rgba(11, 40, 73, 0.1)',
              color: '#4a6b8c',
              fontSize: '0.95rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {article.author_avatar && (
                    <img 
                      src={article.author_avatar} 
                      alt={article.author_name}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  )}
                  <span><strong>{lang === 'ar' ? 'بواسطة:' : 'By:'}</strong> {article.author_name}</span>
                </span>
                <span>•</span>
                <span>{dateStr}</span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title={lang === 'ar' ? 'المشاهدات' : 'Views'}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  {article.views_count || 0}
                </span>
                <span 
                  onClick={handleToggleLike}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: article.userLiked ? '#e63946' : 'inherit', transition: 'color 0.2s ease' }} 
                  title={lang === 'ar' ? 'الإعجابات' : 'Likes'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={article.userLiked ? '#e63946' : 'none'} stroke={article.userLiked ? '#e63946' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'fill 0.2s ease, stroke 0.2s ease' }}>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  {article.likes_count || 0}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                {copied && (
                  <div style={{
                    position: 'absolute',
                    top: '-35px',
                    right: lang === 'ar' ? '30px' : 'auto',
                    left: lang === 'en' ? '30px' : 'auto',
                    background: '#15b47a',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(21, 180, 122, 0.3)',
                    zIndex: 20,
                    animation: 'fadeIn 0.2s ease-in-out'
                  }}>
                    {lang === 'ar' ? 'تم النسخ!' : 'Copied!'}
                    <div style={{
                      position: 'absolute',
                      bottom: '-4px',
                      right: lang === 'ar' ? '16px' : 'auto',
                      left: lang === 'en' ? '16px' : 'auto',
                      width: '8px',
                      height: '8px',
                      background: '#15b47a',
                      transform: 'rotate(45deg)'
                    }} />
                  </div>
                )}
                <button 
                  onClick={handleCopy}
                  title={lang === 'ar' ? 'نسخ الرابط' : 'Copy Link'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#4a6b8c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'rgba(11, 40, 73, 0.05)';
                    e.currentTarget.style.color = '#0b2849';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#4a6b8c';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                </button>
                <button 
                  onClick={handleShare}
                  title={lang === 'ar' ? 'مشاركة' : 'Share'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#4a6b8c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'rgba(11, 40, 73, 0.05)';
                    e.currentTarget.style.color = '#0b2849';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#4a6b8c';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                </button>
              </div>
            </div>

            <div 
              className="article-content ql-editor"
              style={{ 
                color: '#2a415a', 
                fontSize: '1.1rem', 
                lineHeight: '1.8',
                fontFamily: 'var(--font-body)',
                padding: 0,
                overflowY: 'visible'
              }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
