import { useState, useEffect } from 'preact/hooks';
import { useAuth } from '../../auth/hooks/useAuth';
import { supabase } from '../../../utils/supabaseClient';

export function SliderManagerPage({ lang, onNavigate }) {
  const { userProfile, hasPermission } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [contentList, setContentList] = useState([]);
  const [sliderItems, setSliderItems] = useState([]);
  
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for custom image upload
  const [showModal, setShowModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [customImageUrl, setCustomImageUrl] = useState('');
  
  // Custom Announcement Modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customLink, setCustomLink] = useState('');
  const [customImage, setCustomImage] = useState('');

  useEffect(() => {
    fetchEverything();
  }, []);

  const fetchEverything = async () => {
    setLoading(true);
    try {
      // 1. Fetch Courses
      const { data: courses } = await supabase.from('courses').select('id, title_ar, title_en, cover_image, created_at');
      
      // 2. Fetch News
      const { data: news } = await supabase.from('news').select('id, title_ar, title_en, cover_image_url, created_at');
      
      // 3. Fetch Events
      const { data: events } = await supabase.from('events').select('id, title_ar, title_en, cover_image, created_at');
      
      // 4. Fetch Opportunities
      const { data: opportunities } = await supabase.from('opportunities').select('id, title_ar, title_en, image_url, created_at');

      // 5. Fetch Active Slider Items (Assuming table exists, otherwise catch error)
      const { data: sliderData, error: sliderError } = await supabase.from('home_slider').select('*').order('sequence_order', { ascending: true });
      if (!sliderError && sliderData) {
        setSliderItems(sliderData);
      }

      // Merge all content into one universal list
      let allContent = [];
      
      if (courses) allContent.push(...courses.map(c => ({ ...c, type: 'course', image: c.cover_image, title: lang === 'ar' ? c.title_ar : c.title_en })));
      if (news) allContent.push(...news.map(n => ({ ...n, type: 'news', image: n.cover_image_url, title: lang === 'ar' ? n.title_ar : n.title_en })));
      if (events) allContent.push(...events.map(e => ({ ...e, type: 'event', image: e.cover_image, title: lang === 'ar' ? e.title_ar : e.title_en })));
      if (opportunities) allContent.push(...opportunities.map(o => ({ ...o, type: 'opportunity', image: o.image_url, title: lang === 'ar' ? o.title_ar : o.title_en })));

      // Sort by newest
      allContent.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setContentList(allContent);
    } catch (err) {
      console.error("Error fetching content:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToSlider = async (content, customImg = null) => {
    const finalImage = customImg || content.image;
    
    // Safety check - force image upload if missing
    if (!finalImage && !customImg) {
      setSelectedContent(content);
      setShowModal(true);
      return;
    }

    const payload = {
      entity_type: content.type,
      entity_id: content.id,
      title_ar: content.title_ar,
      title_en: content.title_en,
      image_url: finalImage,
      link_url: `/${content.type}/${content.id}`,
      sequence_order: sliderItems.length + 1
    };

    // Optimistic UI Update
    setSliderItems([...sliderItems, payload]);
    setShowModal(false);
    setCustomImageUrl('');

    // Save to DB
    const { error } = await supabase.from('home_slider').insert(payload);
    if (error) {
      console.error("Failed to add to slider table. Please ensure the 'home_slider' table exists.", error);
      alert("Database table 'home_slider' missing! Run the SQL script to create it.");
    } else {
      fetchEverything(); // refresh IDs
    }
  };

  const handleAddCustomAnnouncement = async () => {
    if (!customTitle || !customImage) return alert("Title and Image are required!");

    const payload = {
      entity_type: 'custom',
      entity_id: null,
      title_ar: customTitle,
      title_en: customTitle,
      image_url: customImage,
      link_url: customLink,
      sequence_order: sliderItems.length + 1
    };

    setSliderItems([...sliderItems, payload]);
    setShowCustomModal(false);
    setCustomTitle(''); setCustomLink(''); setCustomImage('');

    await supabase.from('home_slider').insert(payload);
    fetchEverything();
  };

  const handleRemoveFromSlider = async (id) => {
    setSliderItems(sliderItems.filter(item => item.id !== id));
    if (id) {
      await supabase.from('home_slider').delete().eq('id', id);
    }
  };

  const filteredContent = contentList.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchQuery && !item.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (!hasPermission('manage:slider')) {
    return <div style={{ padding: '100px', textAlign: 'center', color: 'white' }}>Access Denied. You do not have the 'manage:slider' permission.</div>;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      
      {/* 1. Header Banner Block (Green-to-Blue Gradient) */}
      <div 
        style={{
          background: 'linear-gradient(90deg, #15b47a 0%, #12a978 5%, #0c8774 23%, #066d71 41%, #025a6e 60%, #004f6d 79%, #004c6d 100%)',
          padding: '160px 20px 50px 20px',
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(11, 40, 73, 0.1)'
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
            {lang === 'ar' ? 'إدارة واجهة الرئيسية (Slider Manager)' : 'Homepage Slider Manager'}
          </h1>
          <p style={{ 
            fontSize: 'clamp(14px, 1.8vw, 16px)', 
            color: 'rgba(255, 255, 255, 0.9)', 
            maxWidth: '750px', 
            margin: '0 auto 35px auto',
            lineHeight: '1.6',
            fontFamily: lang === 'ar' ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
          }}>
            {lang === 'ar' ? 'حدد المحتوى الذي تريد إبرازه في الشريحة العلوية للصفحة الرئيسية.' : 'Select content to feature on the homepage hero slider.'}
          </p>

          <button 
            onClick={() => setShowCustomModal(true)}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '30px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              fontFamily: lang === 'ar' ? 'Tajawal, sans-serif' : 'Outfit, sans-serif',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.25s ease',
              outline: 'none'
            }}
          >
            <span style={{ fontSize: '16px' }}>+</span>
            <span>{lang === 'ar' ? 'إعلان مخصص' : 'Custom Announcement'}</span>
          </button>
        </div>
      </div>

      <div style={{ 
        flexGrow: 1,
        padding: '50px 20px 80px 20px',
        position: 'relative',
        zIndex: 1,
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: lang === 'ar' ? 'right' : 'left' }}>
          
          {/* Top Half: Active Slider Items */}
          <div style={{ background: '#ffffff', border: '1px solid rgba(11, 40, 73, 0.1)', borderRadius: '24px', padding: '30px', marginBottom: '40px', boxShadow: '0 10px 30px rgba(11, 40, 73, 0.05)' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0b2849' }}>
              <span style={{ width: '12px', height: '12px', background: '#15b47a', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 10px rgba(21, 180, 122, 0.4)' }}></span>
              {lang === 'ar' ? 'الشرائح النشطة حالياً' : 'Currently Active on Homepage'}
            </h2>
            
            {sliderItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(11, 40, 73, 0.03)', borderRadius: '16px', color: 'rgba(11, 40, 73, 0.6)' }}>
                {lang === 'ar' ? 'لا يوجد محتوى في واجهة الرئيسية حالياً.' : 'Slider is currently empty.'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {sliderItems.map((item, idx) => (
                  <div key={idx} style={{ background: '#ffffff', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(11, 40, 73, 0.1)', boxShadow: '0 4px 15px rgba(11, 40, 73, 0.05)' }}>
                    <img src={item.image_url} alt="" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                    <button 
                      onClick={() => handleRemoveFromSlider(item.id)}
                      style={{ position: 'absolute', top: '10px', right: '10px', background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 2px 8px rgba(255, 77, 77, 0.4)' }}
                    >
                      &times;
                    </button>
                    <div style={{ padding: '16px' }}>
                      <div style={{ fontSize: '10px', background: 'rgba(21, 180, 122, 0.1)', color: '#15b47a', display: 'inline-block', padding: '4px 8px', borderRadius: '4px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                        {item.entity_type}
                      </div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#0b2849' }}>{lang === 'ar' ? item.title_ar : item.title_en}</h4>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Half: Database Inventory */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
              <h2 style={{ fontSize: '20px', margin: 0, color: '#0b2849' }}>{lang === 'ar' ? 'مكتبة المحتوى (اختر للإضافة)' : 'Content Inventory (Click to add)'}</h2>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder={lang === 'ar' ? 'بحث...' : 'Search...'} 
                  value={searchQuery}
                  onInput={e => setSearchQuery(e.target.value)}
                  style={{ background: '#ffffff', border: '1px solid rgba(11, 40, 73, 0.15)', padding: '10px 16px', borderRadius: '8px', color: '#0b2849', outline: 'none' }}
                />
                <select 
                  value={filterType} 
                  onChange={e => setFilterType(e.target.value)}
                  style={{ background: '#ffffff', border: '1px solid rgba(11, 40, 73, 0.15)', padding: '10px 16px', borderRadius: '8px', color: '#0b2849', outline: 'none' }}
                >
                  <option value="all">{lang === 'ar' ? 'الكل' : 'All Types'}</option>
                  <option value="course">{lang === 'ar' ? 'المساقات' : 'Courses'}</option>
                  <option value="news">{lang === 'ar' ? 'الأخبار' : 'News'}</option>
                  <option value="event">{lang === 'ar' ? 'الفعاليات' : 'Events'}</option>
                  <option value="opportunity">{lang === 'ar' ? 'الفرص' : 'Opportunities'}</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(11, 40, 73, 0.6)' }}>Loading Database...</div>
            ) : (
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(11, 40, 73, 0.1)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(11, 40, 73, 0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid rgba(11, 40, 73, 0.1)' }}>
                      <th style={{ padding: '16px', fontWeight: 'bold', fontSize: '14px', color: '#0b2849' }}>Type</th>
                      <th style={{ padding: '16px', fontWeight: 'bold', fontSize: '14px', color: '#0b2849' }}>Title</th>
                      <th style={{ padding: '16px', fontWeight: 'bold', fontSize: '14px', color: '#0b2849' }}>Image Status</th>
                      <th style={{ padding: '16px', fontWeight: 'bold', fontSize: '14px', color: '#0b2849', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContent.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(11, 40, 73, 0.05)' }}>
                        <td style={{ padding: '16px' }}>
                          <span style={{ background: 'rgba(21, 180, 122, 0.1)', color: '#15b47a', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {item.type}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontWeight: 'bold', fontSize: '15px', color: '#0b2849' }}>{item.title}</td>
                        <td style={{ padding: '16px' }}>
                          {item.image ? (
                            <img src={item.image} alt="" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                          ) : (
                            <span style={{ fontSize: '12px', color: '#ffbd2e', background: 'rgba(255, 189, 46, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                              No Cover Image
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <button 
                            onClick={() => handleAddToSlider(item)}
                            style={{ background: '#15b47a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => e.target.style.background = '#129a68'}
                            onMouseLeave={e => e.target.style.background = '#15b47a'}
                          >
                            + Add to Slider
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Missing Images */}
      {showModal && selectedContent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 12, 26, 0.65)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#ffffff', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '500px', border: '1px solid rgba(11, 40, 73, 0.15)', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', direction: lang === 'ar' ? 'rtl' : 'ltr', textAlign: lang === 'ar' ? 'right' : 'left' }}>
            <h3 style={{ marginTop: 0, color: '#0b2849' }}>{lang === 'ar' ? 'تنبيه: الصورة مفقودة' : 'Notice: Missing Cover Image'}</h3>
            <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '14px', lineHeight: '1.5' }}>
              {lang === 'ar' ? 'هذا المحتوى ليس له صورة غلاف افتراضية. لتتمكن من عرضه في الواجهة الرئيسية، يرجى إرفاق رابط صورة هنا:' : `This ${selectedContent.type} has no default cover image. To feature it on the homepage, please provide an image URL:`}
            </p>
            <input 
              type="text" 
              placeholder="https://images.unsplash.com/photo-..."
              value={customImageUrl}
              onInput={e => setCustomImageUrl(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid rgba(11, 40, 73, 0.15)', color: '#0b2849', outline: 'none', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: '#f1f5f9', color: '#0b2849', border: '1px solid rgba(11, 40, 73, 0.1)', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              <button onClick={() => handleAddToSlider(selectedContent, customImageUrl)} style={{ padding: '10px 20px', borderRadius: '8px', background: '#15b47a', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Upload & Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Custom Announcements */}
      {showCustomModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 12, 26, 0.65)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#ffffff', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '500px', border: '1px solid rgba(11, 40, 73, 0.15)', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', direction: lang === 'ar' ? 'rtl' : 'ltr', textAlign: lang === 'ar' ? 'right' : 'left' }}>
            <h3 style={{ marginTop: 0, color: '#3b82f6' }}>{lang === 'ar' ? 'إضافة إعلان مخصص' : 'Add Custom Announcement'}</h3>
            <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '14px', lineHeight: '1.5', marginBottom: '20px' }}>
              {lang === 'ar' ? 'قم بإضافة شريحة مخصصة للواجهة لا تنتمي لأي مساق أو خبر موجود.' : 'Create a completely custom slide that does not belong to any database entity.'}
            </p>
            
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#0b2849' }}>Title</label>
            <input type="text" value={customTitle} onInput={e => setCustomTitle(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid rgba(11, 40, 73, 0.15)', color: '#0b2849', outline: 'none', marginBottom: '15px' }} />
            
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#0b2849' }}>Image URL</label>
            <input type="text" value={customImage} onInput={e => setCustomImage(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid rgba(11, 40, 73, 0.15)', color: '#0b2849', outline: 'none', marginBottom: '15px' }} />
            
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#0b2849' }}>Target Link URL (Optional)</label>
            <input type="text" value={customLink} onInput={e => setCustomLink(e.target.value)} placeholder="https://" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid rgba(11, 40, 73, 0.15)', color: '#0b2849', outline: 'none', marginBottom: '20px' }} />
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCustomModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: '#f1f5f9', color: '#0b2849', border: '1px solid rgba(11, 40, 73, 0.1)', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              <button onClick={handleAddCustomAnnouncement} style={{ padding: '10px 20px', borderRadius: '8px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Publish to Slider</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
