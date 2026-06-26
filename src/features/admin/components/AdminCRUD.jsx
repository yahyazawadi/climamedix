import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../../../utils/supabaseClient';
import { GlassCard } from '../../shared/components/GlassCard';
import { Button } from '../../shared/components/Button';
import { useAuth } from '../../auth/hooks/useAuth';

export function AdminCRUD() {
  const { hasPermission } = useAuth();
  const [activeSection, setActiveSection] = useState('courses'); // 'courses', 'events', 'opps', 'joinRequests'
  const [items, setItems] = useState({
    courses: [
      { id: 1, title: 'زمالة طب الكوارث المناخية', category: 'طبي بيئي', enrolled: 125 },
      { id: 2, title: 'إدارة مخلفات المستشفيات الخضراء', category: 'إداري مستدام', enrolled: 84 }
    ],
    events: [
      { id: 1, title: 'ورشة عمل: تقييم الأثر البيئي', date: '2026-07-05', registered: 48 },
      { id: 2, title: 'ندوة: أزمة المياه وتأثيرها الصحي', date: '2026-07-12', registered: 92 }
    ],
    opps: [
      { id: 1, title: 'زمالة VSCHEF للأبحاث البيئية', deadline: '2026-07-15', applications: 31 },
      { id: 2, title: 'منحة ماجستير الصحة العامة الخضراء', deadline: '2026-08-30', applications: 18 }
    ],
    joinRequests: []
  });

  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    if (activeSection === 'joinRequests') {
      const fetchRequests = async () => {
        setLoadingRequests(true);
        const { data, error } = await supabase
          .from('join_requests')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setItems(prev => ({ ...prev, joinRequests: data }));
        }
        setLoadingRequests(false);
      };
      fetchRequests();
    }
  }, [activeSection]);

  const [formInputs, setFormInputs] = useState({
    courses: { title: '', category: '' },
    events: { title: '', date: '' },
    opps: { title: '', deadline: '' }
  });

  const handleDelete = (section, id) => {
    setItems(prev => ({
      ...prev,
      [section]: prev[section].filter(item => item.id !== id)
    }));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const section = activeSection;
    const inputs = formInputs[section];
    
    if (!inputs.title) return;

    const newItem = {
      id: Date.now(),
      title: inputs.title,
      ...inputs,
      enrolled: 0,
      registered: 0,
      applications: 0
    };

    setItems(prev => ({
      ...prev,
      [section]: [newItem, ...prev[section]]
    }));

    // Reset inputs
    setFormInputs(prev => ({
      ...prev,
      [section]: Object.keys(prev[section]).reduce((acc, k) => ({ ...acc, [k]: '' }), {})
    }));
  };

  return (
    <div className="admin-crud-component" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', direction: 'rtl', textAlign: 'right' }}>
      
      {/* Sub-Header Navigation */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '1px solid rgba(11,40,73,0.1)', paddingBottom: '15px', flexWrap: 'wrap' }}>
        {['courses', 'events', 'opps'].map(sect => (
          <button
            key={sect}
            onClick={() => setActiveSection(sect)}
            style={{
              background: activeSection === sect ? '#004c6d' : 'transparent',
              color: activeSection === sect ? '#ffffff' : '#0b2849',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            {sect === 'courses' ? 'إدارة المساقات (LMS)' : sect === 'events' ? 'إدارة الفعاليات' : sect === 'opps' ? 'إدارة الفرص والمنح' : 'طلبات الانضمام'}
          </button>
        ))}
        {hasPermission('approve:users') && (
          <button
            onClick={() => setActiveSection('joinRequests')}
            style={{
              background: activeSection === 'joinRequests' ? '#004c6d' : 'transparent',
              color: activeSection === 'joinRequests' ? '#ffffff' : '#0b2849',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            طلبات الانضمام
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: activeSection === 'joinRequests' ? '1fr' : 'repeat(auto-fit, minmax(360px, 1fr))', gap: '30px' }}>
        
        {/* Left Column: Create Form */}
        {activeSection !== 'joinRequests' && (
        <GlassCard style={{ padding: '24px', height: 'fit-content' }}>
          <h3 style={{ color: '#0b2849', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
            إضافة جديد (إنشاء سجل)
          </h3>
          
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#0b2849', display: 'block', marginBottom: '6px' }}>العنوان الرئيسي</label>
              <input 
                type="text" 
                required
                value={formInputs[activeSection].title}
                onInput={(e) => setFormInputs(prev => ({
                  ...prev,
                  [activeSection]: { ...prev[activeSection], title: e.target.value }
                }))}
                style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', fontSize: '13px', outline: 'none' }} 
              />
            </div>

            {activeSection === 'courses' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#0b2849', display: 'block', marginBottom: '6px' }}>التصنيف</label>
                <input 
                  type="text" 
                  placeholder="مثال: طبي بيئي"
                  value={formInputs.courses.category}
                  onInput={(e) => setFormInputs(prev => ({
                    ...prev,
                    courses: { ...prev.courses, category: e.target.value }
                  }))}
                  style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', fontSize: '13px', outline: 'none' }} 
                />
              </div>
            )}

            {activeSection === 'events' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#0b2849', display: 'block', marginBottom: '6px' }}>التاريخ</label>
                <input 
                  type="date" 
                  value={formInputs.events.date}
                  onInput={(e) => setFormInputs(prev => ({
                    ...prev,
                    events: { ...prev.events, date: e.target.value }
                  }))}
                  style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', fontSize: '13px', outline: 'none' }} 
                />
              </div>
            )}

            {activeSection === 'opps' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#0b2849', display: 'block', marginBottom: '6px' }}>الموعد النهائي</label>
                <input 
                  type="text" 
                  placeholder="مثال: 15 يوليو 2026"
                  value={formInputs.opps.deadline}
                  onInput={(e) => setFormInputs(prev => ({
                    ...prev,
                    opps: { ...prev.opps, deadline: e.target.value }
                  }))}
                  style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', fontSize: '13px', outline: 'none' }} 
                />
              </div>
            )}

            <Button type="submit" variant="gradient" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
              نشر وتخزين السجل
            </Button>
          </form>
        </GlassCard>
        )}

        {/* Right Column: Manage List */}
        <div>
          <h3 style={{ color: '#0b2849', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
            السجلات الحالية
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {items[activeSection].map(item => (
              <GlassCard 
                key={item.id} 
                style={{ 
                  padding: '16px 20px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  border: '1px solid rgba(11, 40, 73, 0.1)' 
                }}
              >
                <div>
                  <h4 style={{ margin: 0, color: '#0b2849', fontSize: '15px', fontWeight: 'bold' }}>{item.title}</h4>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '11px', color: 'rgba(11,40,73,0.5)', marginTop: '4px' }}>
                    {activeSection === 'courses' && (
                      <>
                        <span>التصنيف: {item.category}</span>
                        <span>الطلاب: {item.enrolled}</span>
                      </>
                    )}
                    {activeSection === 'events' && (
                      <>
                        <span>التاريخ: {item.date}</span>
                        <span>المسجلون: {item.registered}</span>
                      </>
                    )}
                    {activeSection === 'opps' && (
                      <>
                        <span>الموعد النهائي: {item.deadline}</span>
                        <span>الطلبات: {item.applications}</span>
                      </>
                    )}
                    {activeSection === 'joinRequests' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                          <span>البريد: {item.email}</span>
                          <span>التخصص: {item.profession}</span>
                          <span>التاريخ: {new Date(item.created_at).toLocaleDateString('ar-EG')}</span>
                          {item.city && item.country && <span>الموقع: {item.city}, {item.country}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                          {item.birth_date && <span>الميلاد: {new Date(item.birth_date).toLocaleDateString('ar-EG')}</span>}
                          {item.university_org && <span>الجامعة/المنظمة: {item.university_org}</span>}
                          {item.work && <span>العمل: {item.work}</span>}
                          {item.is_activist && <span>ناشط: نعم ({item.activist_field || 'غير محدد'})</span>}
                        </div>
                        {item.bio && (
                          <div style={{ marginTop: '4px', fontStyle: 'italic', color: 'rgba(11,40,73,0.7)' }}>
                            نبذة: "{item.bio}"
                          </div>
                        )}
                        {item.cv_url && (
                          <div style={{ marginTop: '4px' }}>
                            <a href={item.cv_url} target="_blank" rel="noreferrer" style={{ color: '#15b47a', textDecoration: 'underline' }}>
                              عرض السيرة الذاتية
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {activeSection !== 'joinRequests' && (
                <button 
                  onClick={() => handleDelete(activeSection, item.id)}
                  style={{
                    background: 'rgba(255, 77, 77, 0.08)',
                    border: 'none',
                    color: '#ff4d4d',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255, 77, 77, 0.15)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(255, 77, 77, 0.08)'}
                >
                  حذف السجل
                </button>
                )}
              </GlassCard>
            ))}

            {loadingRequests && activeSection === 'joinRequests' && (
              <div style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</div>
            )}

            {items[activeSection].length === 0 && !loadingRequests && (
              <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.4)', borderRadius: '20px', border: '1px dashed rgba(11,40,73,0.2)', color: 'rgba(11, 40, 73, 0.5)' }}>
                لا توجد سجلات حالياً في هذا القسم.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
