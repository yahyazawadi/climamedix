import { useState, useEffect } from 'preact/hooks';
import { useOpportunities } from '../hooks/useOpportunities';
import { OpportunitiesGrid, CATEGORY_MAP } from './OpportunitiesGrid';
import { translations } from '../../../i18n/translations';
import { useAuth } from '../../auth/hooks/useAuth';
import { createOpportunity } from '../services/opportunityService';

const CATEGORY_KEYS = ['all', 'fellowship', 'scholarship', 'conference', 'internship', 'grant'];

export function OpportunitiesPage({ lang }) {
  const { opportunities, loading, error, refreshOpportunities } = useOpportunities();
  const { user, userProfile, hasPermission } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  
  // New opportunity state
  const [newOpp, setNewOpp] = useState({
    title_ar: '',
    title_en: '',
    type: 'fellowship',
    description_ar: '',
    description_en: '',
    eligibility_ar: '',
    eligibility_en: '',
    deadline: '',
    apply_link: '',
    teaser_permission_key: 'view:public_content',
    full_access_permission_key: 'view:free_content'
  });

  const t = translations[lang] || translations.ar;

  const canPost = hasPermission && hasPermission('write:opportunities');

  const teaserPermissionOptions = [
    { 
      key: 'view:public_content', 
      desc_ar: 'عام - يمكن للجميع (بمن فيهم الزوار غير المسجلين) رؤية بطاقة الفرصة', 
      desc_en: 'Public - Anyone (including guests) can see the opportunity card' 
    },
    { 
      key: 'view:free_content', 
      desc_ar: 'المستخدمون المسجلون - يظهر فقط لمن لديهم حساب مسجل', 
      desc_en: 'Registered Users - Only visible to authenticated users' 
    },
    { 
      key: 'view:all_courses', 
      desc_ar: 'المشتركون النشطون - يظهر فقط للمشتركين النشطين في الكورسات', 
      desc_en: 'Subscribers - Only visible to active course subscribers' 
    }
  ];

  const fullAccessPermissionOptions = [
    { 
      key: 'view:public_content', 
      desc_ar: 'عام - رابط التقديم متاح للجميع', 
      desc_en: 'Public - Application link is accessible to anyone' 
    },
    { 
      key: 'view:free_content', 
      desc_ar: 'المستخدمون المسجلون - رابط التقديم يظهر فقط لمن سجل دخوله', 
      desc_en: 'Registered Users - Application link only visible to signed-in users' 
    },
    { 
      key: 'view:all_courses', 
      desc_ar: 'المشتركون النشطون - رابط التقديم يظهر فقط للمشتركين النشطين في الكورسات', 
      desc_en: 'Subscribers - Application link only visible to active course subscribers' 
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newOpp.title_ar) {
      setFormError(lang === 'ar' ? 'العنوان العربي مطلوب' : 'Arabic title is required');
      return;
    }
    if (!newOpp.apply_link) {
      setFormError(lang === 'ar' ? 'رابط التقديم مطلوب' : 'Apply link is required');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError('');
      
      await createOpportunity({
        ...newOpp,
        created_by: user?.id
      });

      await refreshOpportunities();
      setShowAddModal(false);
      setNewOpp({
        title_ar: '',
        title_en: '',
        type: 'fellowship',
        description_ar: '',
        description_en: '',
        eligibility_ar: '',
        eligibility_en: '',
        deadline: '',
        apply_link: '',
        teaser_permission_key: 'view:public_content',
        full_access_permission_key: 'view:free_content'
      });
      alert(lang === 'ar' ? 'تم إضافة الفرصة بنجاح!' : 'Opportunity created successfully!');
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Error occurred while saving');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const filteredOpportunities = activeCategory === 'all' 
    ? opportunities 
    : opportunities.filter(opp => opp.type === activeCategory);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      
      {/* 1. Header Banner Block (Green-to-Blue Gradient) */}
      <div 
        className="opportunities-banner"
        style={{
          background: 'linear-gradient(90deg, #15b47a 0%, #12a978 5%, #0c8774 23%, #066d71 41%, #025a6e 60%, #004f6d 79%, #004c6d 100%)',
          padding: '160px 20px 50px 20px',
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(11, 40, 73, 0.1)',
          direction: lang === 'ar' ? 'rtl' : 'ltr'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Page Title in white for high contrast */}
          <h1 style={{ 
            fontSize: 'clamp(28px, 4vw, 40px)', 
            fontWeight: 'bold', 
            color: '#ffffff', 
            marginBottom: '16px',
            fontFamily: lang === 'ar' ? 'Tajawal, sans-serif' : 'Outfit, sans-serif',
            textShadow: '0 2px 4px rgba(0,0,0,0.15)'
          }}>
            {t.opportunitiesTitle || (lang === 'ar' ? 'فرص التطوير والتمويل' : 'Development & Funding Opportunities')}
          </h1>
          
          {/* Subtitle in semi-transparent white */}
          <p style={{ 
            fontSize: 'clamp(14px, 1.8vw, 16px)', 
            color: 'rgba(255, 255, 255, 0.9)', 
            maxWidth: '750px', 
            margin: '0 auto 35px auto',
            lineHeight: '1.6',
            fontFamily: lang === 'ar' ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
          }}>
            {t.opportunitiesSubtitle || (lang === 'ar' 
              ? 'استكشف الزمالات، المنح، المؤتمرات، والفرص التدريبية المتاحة لبناء قدراتك في مجال العمل المناخي والصحي' 
              : 'Explore fellowships, scholarships, conferences, and training opportunities available to build your capacity in climate and health action')}
          </p>

          {canPost && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'linear-gradient(135deg, #15b47a 0%, #12a978 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '30px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                fontFamily: lang === 'ar' ? 'Tajawal, sans-serif' : 'Outfit, sans-serif',
                marginBottom: '35px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(21, 180, 122, 0.3)',
                transition: 'all 0.25s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(21, 180, 122, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(21, 180, 122, 0.3)';
              }}
            >
              <span style={{ fontSize: '16px' }}>+</span>
              <span>{lang === 'ar' ? 'إضافة فرصة جديدة' : 'Post New Opportunity'}</span>
            </button>
          )}
          
          {/* Center Category Filter Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            flexWrap: 'wrap', 
            justifyContent: 'center',
            width: '100%',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {CATEGORY_KEYS.map(key => (
              <button
                key={key}
                className={`search-filter-tag ${activeCategory === key ? 'active' : ''}`}
                onClick={() => setActiveCategory(key)}
                style={{ 
                  fontSize: '13.5px', 
                  padding: '8px 22px',
                  border: '1px solid rgba(255,255,255,0.25)'
                }}
              >
                {CATEGORY_MAP[key]?.[lang] || key}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Opportunities Content Block (Below the banner on Light gray background) */}
      <div style={{ 
        flexGrow: 1,
        padding: '50px 20px 80px 20px',
        position: 'relative',
        zIndex: 1,
        background: '#f8fafc',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          textAlign: lang === 'ar' ? 'right' : 'left', 
          direction: lang === 'ar' ? 'rtl' : 'ltr' 
        }}>
          {/* Dynamic States */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '15px' }}>
              <div className="premium-spinner" style={{
                width: '50px',
                height: '50px',
                border: '3px solid rgba(21, 180, 122, 0.1)',
                borderTop: '3px solid #15b47a',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{ color: 'rgba(11, 40, 73, 0.6)', fontSize: '15px', fontFamily: 'Tajawal, sans-serif' }}>
                {lang === 'ar' ? 'جاري تحميل الفرص...' : 'Loading opportunities...'}
              </p>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '50px 20px', 
              background: '#ffffff', 
              borderRadius: '20px', 
              boxShadow: '0 10px 30px rgba(11, 40, 73, 0.05)',
              border: '1px solid rgba(255, 77, 77, 0.15)', 
              maxWidth: '600px', 
              margin: '0 auto' 
            }}>
              <span style={{ fontSize: '36px', marginBottom: '15px', display: 'block' }}>⚠️</span>
              <h4 style={{ color: '#ff4d4d', margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>
                {lang === 'ar' ? 'عذراً، حدث خطأ أثناء تحميل البيانات' : 'Sorry, an error occurred while loading data'}
              </h4>
              <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '14px', margin: '0 0 20px 0' }}>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                style={{
                  background: '#0b2849',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  fontFamily: 'Tajawal, sans-serif'
                }}
              >
                {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </button>
            </div>
          ) : (
            <OpportunitiesGrid opportunities={opportunities} activeCategory={activeCategory} lang={lang} />
          )}
        </div>
      </div>

      {/* Add Opportunity Modal Form */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 12, 26, 0.65)',
          backdropFilter: 'blur(15px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '1px solid rgba(11, 40, 73, 0.15)',
            maxWidth: '750px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '35px',
            direction: lang === 'ar' ? 'rtl' : 'ltr',
            textAlign: lang === 'ar' ? 'right' : 'left',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setShowAddModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                left: lang === 'ar' ? 'auto' : '20px',
                right: lang === 'ar' ? '20px' : 'auto',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                color: '#0b2849',
                cursor: 'pointer',
                fontWeight: 'bold',
                zIndex: 10
              }}
            >
              &times;
            </button>

            <h2 style={{ 
              color: '#0b2849', 
              fontSize: '24px', 
              fontWeight: 'bold', 
              marginBottom: '20px', 
              marginTop: 0, 
              fontFamily: lang === 'ar' ? 'Tajawal, sans-serif' : 'Outfit, sans-serif' 
            }}>
              {lang === 'ar' ? 'إضافة فرصة جديدة لقاعدة البيانات' : 'Post New Opportunity'}
            </h2>

            {formError && (
              <div style={{ 
                background: 'rgba(255, 77, 77, 0.1)', 
                border: '1px solid rgba(255, 77, 77, 0.25)', 
                color: '#ff4d4d', 
                padding: '12px 16px', 
                borderRadius: '12px', 
                fontSize: '13.5px', 
                marginBottom: '20px',
                fontWeight: 'bold'
              }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Row 1: Titles (Arabic & English) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#0b2849' }}>
                    {lang === 'ar' ? 'العنوان بالعربية *' : 'Title (Arabic) *'}
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="مثال: زمالة أبحاث صحة المناخ"
                    value={newOpp.title_ar}
                    onChange={(e) => setNewOpp({ ...newOpp, title_ar: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#0b2849' }}>
                    {lang === 'ar' ? 'العنوان بالإنجليزية' : 'Title (English)'}
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Climate Health Fellowship"
                    value={newOpp.title_en}
                    onChange={(e) => setNewOpp({ ...newOpp, title_en: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Row 2: Type, Deadline & Link */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#0b2849' }}>
                    {lang === 'ar' ? 'نوع الفرصة *' : 'Opportunity Type *'}
                  </label>
                  <select 
                    value={newOpp.type}
                    onChange={(e) => setNewOpp({ ...newOpp, type: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', fontSize: '14px', outline: 'none', background: '#fff' }}
                  >
                    <option value="fellowship">{lang === 'ar' ? 'زمالة دراسية' : 'Fellowship'}</option>
                    <option value="scholarship">{lang === 'ar' ? 'منحة تعليمية' : 'Scholarship'}</option>
                    <option value="conference">{lang === 'ar' ? 'مؤتمر علمي' : 'Conference'}</option>
                    <option value="internship">{lang === 'ar' ? 'تدريب عملي' : 'Internship'}</option>
                    <option value="grant">{lang === 'ar' ? 'منحة مالية' : 'Grant'}</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#0b2849' }}>
                    {lang === 'ar' ? 'الموعد النهائي *' : 'Deadline *'}
                  </label>
                  <input 
                    type="date"
                    required
                    value={newOpp.deadline}
                    onChange={(e) => setNewOpp({ ...newOpp, deadline: e.target.value })}
                    style={{ width: '100%', padding: '9px 14px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#0b2849' }}>
                    {lang === 'ar' ? 'رابط التقديم *' : 'Apply Link *'}
                  </label>
                  <input 
                    type="url"
                    required
                    placeholder="https://example.com/apply"
                    value={newOpp.apply_link}
                    onChange={(e) => setNewOpp({ ...newOpp, apply_link: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Row 3: Descriptions (Arabic & English) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#0b2849' }}>
                    {lang === 'ar' ? 'الوصف بالعربية' : 'Description (Arabic)'}
                  </label>
                  <textarea 
                    rows="3"
                    placeholder="اكتب وصفاً للفرصة هنا..."
                    value={newOpp.description_ar}
                    onChange={(e) => setNewOpp({ ...newOpp, description_ar: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#0b2849' }}>
                    {lang === 'ar' ? 'الوصف بالإنجليزية' : 'Description (English)'}
                  </label>
                  <textarea 
                    rows="3"
                    placeholder="Type the description here..."
                    value={newOpp.description_en}
                    onChange={(e) => setNewOpp({ ...newOpp, description_en: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Row 4: Eligibility (Arabic & English) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#0b2849' }}>
                    {lang === 'ar' ? 'شروط الأهلية بالعربية' : 'Eligibility (Arabic)'}
                  </label>
                  <textarea 
                    rows="2"
                    placeholder="مثال: مفتوح للأطباء المقيمين..."
                    value={newOpp.eligibility_ar}
                    onChange={(e) => setNewOpp({ ...newOpp, eligibility_ar: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#0b2849' }}>
                    {lang === 'ar' ? 'شروط الأهلية بالإنجليزية' : 'Eligibility (English)'}
                  </label>
                  <textarea 
                    rows="2"
                    placeholder="e.g. Open to medical residents..."
                    value={newOpp.eligibility_en}
                    onChange={(e) => setNewOpp({ ...newOpp, eligibility_en: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div style={{ borderBottom: '1px dashed rgba(11, 40, 73, 0.15)', margin: '5px 0' }}></div>

              {/* RLS Permissions Controls (Dynamic Stimuli Dropdowns) */}
              <div style={{ background: 'rgba(21, 180, 122, 0.04)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(21, 180, 122, 0.15)' }}>
                <h4 style={{ color: '#0b2849', fontSize: '14.5px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
                  {lang === 'ar' ? 'مستويات صلاحيات الأمان والتحكم (RLS permissions & Stimuli)' : 'Security Levels & Stimuli Configurations'}
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {/* Teaser Permission Dropdown */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#0b2849' }}>
                      {lang === 'ar' ? 'مستوى رؤية الإعلان (Teaser Visibility):' : 'Teaser Card Visibility Level:'}
                    </label>
                    <select
                      value={newOpp.teaser_permission_key}
                      onChange={(e) => setNewOpp({ ...newOpp, teaser_permission_key: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', fontSize: '13.5px', outline: 'none', background: '#fff' }}
                    >
                      {teaserPermissionOptions.map(opt => (
                        <option key={opt.key} value={opt.key}>
                          {opt.key} — {lang === 'ar' ? opt.desc_ar : opt.desc_en}
                        </option>
                      ))}
                    </select>
                    <small style={{ color: 'rgba(11, 40, 73, 0.55)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      {lang === 'ar' ? 'التحكم: يحدد هذا الخيار الفئة التي يسمح لها برؤية الإعلان الترويجي للفرصة في دليل الفرص.' : 'Stimulus: Restricts who is physically allowed to see the teaser block in the public opportunities grid.'}
                    </small>
                  </div>

                  {/* Full Access Permission Dropdown */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#0b2849' }}>
                      {lang === 'ar' ? 'مستوى الوصول للرابط الفعلي (Apply Link Access):' : 'Full Application Link Access Level:'}
                    </label>
                    <select
                      value={newOpp.full_access_permission_key}
                      onChange={(e) => setNewOpp({ ...newOpp, full_access_permission_key: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', fontSize: '13.5px', outline: 'none', background: '#fff' }}
                    >
                      {fullAccessPermissionOptions.map(opt => (
                        <option key={opt.key} value={opt.key}>
                          {opt.key} — {lang === 'ar' ? opt.desc_ar : opt.desc_en}
                        </option>
                      ))}
                    </select>
                    <small style={{ color: 'rgba(11, 40, 73, 0.55)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      {lang === 'ar' ? 'التحكم: يحدد هذا الخيار الفئة التي يسمح لها بفك التشفير عن رابط التقديم الفعلي (المحمي بـ RLS) للتقديم على الفرصة.' : 'Stimulus: Controls column-masking policy on Supabase. Only users satisfying this role will receive the actual Apply Link.'}
                    </small>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: '#f1f5f9',
                    color: '#0b2849',
                    border: '1px solid rgba(11, 40, 73, 0.1)',
                    padding: '10px 24px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13.5px'
                  }}
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  style={{
                    background: 'linear-gradient(135deg, #15b47a 0%, #12a978 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 28px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13.5px',
                    opacity: formSubmitting ? 0.6 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {formSubmitting && (
                    <div style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                  )}
                  <span>{lang === 'ar' ? 'نشر الفرصة الآن' : 'Publish Opportunity'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
