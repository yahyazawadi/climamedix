import { useState, useEffect } from 'preact/hooks';
import { useAuth } from '../../auth/hooks/useAuth';
import { supabase } from '../../../utils/supabaseClient';

export function SliderManagerPage({ lang, onNavigate }) {
  const { userProfile } = useAuth();
  
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

  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'superadmin')) {
    return <div style={{ padding: '100px', textAlign: 'center', color: 'white' }}>Access Denied</div>;
  }

  return (
    <div style={{ padding: '120px 40px 60px', minHeight: '100vh', background: '#050c1a', color: '#fff', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#15b47a' }}>
            {lang === 'ar' ? 'إدارة واجهة الرئيسية (Slider Manager)' : 'Homepage Slider Manager'}
          </h1>
          <p style={{ margin: 0, opacity: 0.7 }}>
            {lang === 'ar' ? 'حدد المحتوى الذي تريد إبرازه في الشريحة العلوية للصفحة الرئيسية.' : 'Select content to feature on the homepage hero slider.'}
          </p>
        </div>
        <button 
          onClick={() => setShowCustomModal(true)}
          style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px solid #3b82f6', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {lang === 'ar' ? '+ إعلان مخصص' : '+ Custom Announcement'}
        </button>
      </div>

      {/* Top Half: Active Slider Items */}
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '30px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '12px', height: '12px', background: '#15b47a', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 10px #15b47a' }}></span>
          {lang === 'ar' ? 'الشرائح النشطة حالياً' : 'Currently Active on Homepage'}
        </h2>
        
        {sliderItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', opacity: 0.5 }}>
            {lang === 'ar' ? 'لا يوجد محتوى في واجهة الرئيسية حالياً.' : 'Slider is currently empty.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {sliderItems.map((item, idx) => (
              <div key={idx} style={{ background: '#0b2849', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(21, 180, 122, 0.3)' }}>
                <img src={item.image_url} alt="" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                <button 
                  onClick={() => handleRemoveFromSlider(item.id)}
                  style={{ position: 'absolute', top: '10px', right: '10px', background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}
                >
                  &times;
                </button>
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', display: 'inline-block', padding: '4px 8px', borderRadius: '4px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {item.entity_type}
                  </div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>{lang === 'ar' ? item.title_ar : item.title_en}</h4>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Half: Database Inventory */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
          <h2 style={{ fontSize: '20px', margin: 0 }}>{lang === 'ar' ? 'مكتبة المحتوى (اختر للإضافة)' : 'Content Inventory (Click to add)'}</h2>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder={lang === 'ar' ? 'بحث...' : 'Search...'} 
              value={searchQuery}
              onInput={e => setSearchQuery(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '8px', color: '#fff', outline: 'none' }}
            />
            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '8px', color: '#fff', outline: 'none' }}
            >
              <option value="all" style={{ color: '#000' }}>{lang === 'ar' ? 'الكل' : 'All Types'}</option>
              <option value="course" style={{ color: '#000' }}>{lang === 'ar' ? 'المساقات' : 'Courses'}</option>
              <option value="news" style={{ color: '#000' }}>{lang === 'ar' ? 'الأخبار' : 'News'}</option>
              <option value="event" style={{ color: '#000' }}>{lang === 'ar' ? 'الفعاليات' : 'Events'}</option>
              <option value="opportunity" style={{ color: '#000' }}>{lang === 'ar' ? 'الفرص' : 'Opportunities'}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading Database...</div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: lang === 'ar' ? 'right' : 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '16px', fontWeight: 'bold', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Type</th>
                  <th style={{ padding: '16px', fontWeight: 'bold', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Title</th>
                  <th style={{ padding: '16px', fontWeight: 'bold', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Image Status</th>
                  <th style={{ padding: '16px', fontWeight: 'bold', fontSize: '14px', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredContent.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px' }}>
                      <span style={{ background: 'rgba(21, 180, 122, 0.1)', color: '#15b47a', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {item.type}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 'bold', fontSize: '15px' }}>{item.title}</td>
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

      {/* Modal for Missing Images */}
      {showModal && selectedContent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#0b2849', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '500px', border: '1px solid #15b47a' }}>
            <h3 style={{ marginTop: 0 }}>{lang === 'ar' ? 'تنبيه: الصورة مفقودة' : 'Notice: Missing Cover Image'}</h3>
            <p style={{ opacity: 0.8, fontSize: '14px', lineHeight: '1.5' }}>
              {lang === 'ar' ? 'هذا المحتوى ليس له صورة غلاف افتراضية. لتتمكن من عرضه في الواجهة الرئيسية، يرجى إرفاق رابط صورة هنا:' : `This ${selectedContent.type} has no default cover image. To feature it on the homepage, please provide an image URL:`}
            </p>
            <input 
              type="text" 
              placeholder="https://images.unsplash.com/photo-..."
              value={customImageUrl}
              onInput={e => setCustomImageUrl(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', outline: 'none', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleAddToSlider(selectedContent, customImageUrl)} style={{ padding: '10px 20px', borderRadius: '8px', background: '#15b47a', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Upload & Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Custom Announcements */}
      {showCustomModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#0b2849', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '500px', border: '1px solid #3b82f6' }}>
            <h3 style={{ marginTop: 0, color: '#3b82f6' }}>{lang === 'ar' ? 'إضافة إعلان مخصص' : 'Add Custom Announcement'}</h3>
            <p style={{ opacity: 0.8, fontSize: '14px', lineHeight: '1.5', marginBottom: '20px' }}>
              {lang === 'ar' ? 'قم بإضافة شريحة مخصصة للواجهة لا تنتمي لأي مساق أو خبر موجود.' : 'Create a completely custom slide that does not belong to any database entity.'}
            </p>
            
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', opacity: 0.7 }}>Title</label>
            <input type="text" value={customTitle} onInput={e => setCustomTitle(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', outline: 'none', marginBottom: '15px' }} />
            
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', opacity: 0.7 }}>Image URL</label>
            <input type="text" value={customImage} onInput={e => setCustomImage(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', outline: 'none', marginBottom: '15px' }} />
            
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', opacity: 0.7 }}>Target Link URL (Optional)</label>
            <input type="text" value={customLink} onInput={e => setCustomLink(e.target.value)} placeholder="https://" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', outline: 'none', marginBottom: '20px' }} />
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCustomModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAddCustomAnnouncement} style={{ padding: '10px 20px', borderRadius: '8px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Publish to Slider</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
