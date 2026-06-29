import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../../../utils/supabaseClient';
import { Button } from '../../shared/components/Button';
import { GlassCard } from '../../shared/components/GlassCard';
import 'react-quill/dist/quill.snow.css';

export function ArticleReaderPage({ lang, onNavigate }) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

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
          setArticle(data);
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
              </div>
              
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
