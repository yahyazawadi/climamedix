import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../../../utils/supabaseClient';
import { Button } from '../../shared/components/Button';
import { GlassCard } from '../../shared/components/GlassCard';
import { AmbientParticles } from '../../shared/components/AmbientParticles';
import { ShareActionButtons } from '../../shared/components/ShareActionButtons';
import { useAuth } from '../../auth/hooks/useAuth';
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
      <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <AmbientParticles />
        </div>
        <div style={{ paddingTop: '100px', paddingBottom: '80px', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '0 20px' }}>
            <GlassCard style={{ padding: '0', overflow: 'hidden', borderRadius: '24px' }}>
              <div style={{ width: '100%', height: '500px', backgroundColor: 'rgba(11,40,73,0.05)', animation: 'pulse 1.5s infinite' }}></div>
              <div style={{ padding: '40px' }}>
                <div style={{ width: '60%', height: '40px', backgroundColor: 'rgba(11,40,73,0.05)', marginBottom: '20px', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
                <div style={{ width: '30%', height: '20px', backgroundColor: 'rgba(11,40,73,0.05)', marginBottom: '40px', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
                
                <div style={{ width: '100%', height: '16px', backgroundColor: 'rgba(11,40,73,0.05)', marginBottom: '12px', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
                <div style={{ width: '100%', height: '16px', backgroundColor: 'rgba(11,40,73,0.05)', marginBottom: '12px', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
                <div style={{ width: '80%', height: '16px', backgroundColor: 'rgba(11,40,73,0.05)', marginBottom: '12px', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
              </div>
            </GlassCard>
          </div>
        </div>
      </>
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
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <AmbientParticles />
      </div>
      <div style={{ paddingTop: '100px', paddingBottom: '80px', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '0 20px' }}>
        
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button variant="text" onClick={() => onNavigate('news')} style={{ padding: 0, color: '#4a6b8c' }}>
            {lang === 'ar' ? '← العودة للأخبار' : '← Back to News'}
          </Button>
          {/* Edit button — shown if user has manage:any_article OR if it's their own article and has write:articles */}
          {article && (
            (hasPermission?.('manage:any_article') ||
            (hasPermission?.('write:articles') && user?.id === article.created_by)) && (
              <button
                onClick={() => onNavigate('write-article', `id=${article.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.3)',
                  color: '#0ea5e9', padding: '8px 16px', borderRadius: '10px',
                  cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(14, 165, 233, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)'; }}
                title={lang === 'ar' ? 'تعديل المقال' : 'Edit Article'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                {lang === 'ar' ? 'تعديل' : 'Edit'}
              </button>
            )
          )}
        </div>

        <GlassCard style={{ padding: '0', overflow: 'hidden', borderRadius: '24px' }}>
          {article.cover_image && (
            <div style={{ width: '100%', height: '500px', overflow: 'hidden', backgroundColor: '#e2effa' }}>
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
              
              <ShareActionButtons lang={lang} title={title} />
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
    </>
  );
}
