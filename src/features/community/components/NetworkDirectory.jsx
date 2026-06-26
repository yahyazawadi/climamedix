import { useState, useLayoutEffect, useRef } from 'preact/hooks';
import gsap from 'gsap';
import { GlassCard } from '../../shared/components/GlassCard';

const MOCK_REPRESENTATIVES = [
  { id: 1, name: 'د. مريم العتيبي', role: 'ممثلة الدولة - الأردن', country: 'Jordan', specialty: 'طب طوارئ وبيئة', bio: 'أخصائية طب الطوارئ بمستشفى البشير، مهتمة بدراسة أثر التغير الحراري على جودة الهواء وطوارئ الربو.', email: 'm.otaibi@climamedix.org' },
  { id: 2, name: 'أ. د. خالد الجابر', role: 'سفير البرنامج - السعودية', country: 'Saudi Arabia', specialty: 'الصحة العامة البيئية', bio: 'أستاذ الصحة العامة بجامعة الملك سعود. يركز في أبحاثه على تصميم المستشفيات منخفضة الكربون.', email: 'k.jaber@climamedix.org' },
  { id: 3, name: 'د. يوسف صبري', role: 'ممثل الدولة - مصر', country: 'Egypt', specialty: 'طب الأطفال والملوثات المعلقة', bio: 'باحث ومستشار صحي مهتم بنمذجة انتشار النواقل الحشرية المتأثرة بالفيضانات الموسمية.', email: 'y.sabry@climamedix.org' },
  { id: 4, name: 'د. رانيا الحداد', role: 'ممثلة الدولة - لبنان', country: 'Lebanon', specialty: 'الصحة النفسية المناخية', bio: 'معالجة نفسية وعضو رابطة علم النفس البيئي، تبحث في القلق المناخي واضطرابات ما بعد الكوارث.', email: 'r.haddad@climamedix.org' },
  { id: 5, name: 'د. علي حسين', role: 'ممثل الدولة - العراق', country: 'Iraq', specialty: 'الأمن المائي والوبائيات', bio: 'مدير وحدة رصد الأوبئة بالبصرة، يدرس أثر الجفاف المائي على انتشار النزلات المعوية الحادة.', email: 'a.hussein@climamedix.org' }
];

export function NetworkDirectory({ selectedCountry }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'representatives', 'ambassadors'
  const listRef = useRef(null);

  // Filter profiles based on selected country (from Mapbox) and active tab
  const filteredProfiles = MOCK_REPRESENTATIVES.filter(rep => {
    const matchesCountry = !selectedCountry || selectedCountry === 'all' || rep.country.toLowerCase() === selectedCountry.toLowerCase();
    const matchesTab = activeTab === 'all' || (activeTab === 'representatives' && rep.role.includes('ممثل')) || (activeTab === 'ambassadors' && rep.role.includes('سفير'));
    return matchesCountry && matchesTab;
  });

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo('.network-profile-card',
        { opacity: 0, scale: 0.95, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
      );
    }, listRef);
    return () => ctx.revert();
  }, [selectedCountry, activeTab]);

  return (
    <div ref={listRef} className="network-directory-component" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', direction: 'rtl', textAlign: 'right' }}>
      
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h3 style={{ color: '#0b2849', fontSize: '18px', fontWeight: 'bold', margin: '0 0 5px 0' }}>دليل الشبكة والأعضاء</h3>
          {selectedCountry && selectedCountry !== 'all' && (
            <span style={{ fontSize: '13px', color: '#15b47a', fontWeight: 'bold' }}>
              تصفية حسب الدولة: {selectedCountry} 
              <button 
                onClick={() => window.setSelectedCountry && window.setSelectedCountry('all')} 
                style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', marginRight: '8px', fontSize: '11px' }}
              >
                (إلغاء التصفية)
              </button>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {['all', 'representatives', 'ambassadors'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? '#004c6d' : 'rgba(0, 76, 109, 0.05)',
                color: activeTab === tab ? '#ffffff' : '#0b2849',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab === 'all' ? 'الكل' : tab === 'representatives' ? 'ممثلو الدول' : 'السفراء والأكاديميون'}
            </button>
          ))}
        </div>
      </div>

      {/* Profiles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
        {filteredProfiles.map(rep => (
          <GlassCard 
            key={rep.id} 
            className="network-profile-card" 
            style={{ 
              padding: '24px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              opacity: 0, 
              border: '1px solid rgba(11, 40, 73, 0.12)' 
            }}
          >
            <div>
              <h4 style={{ margin: 0, color: '#0b2849', fontSize: '17px', fontWeight: 'bold' }}>{rep.name}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <span style={{ fontSize: '12px', color: '#15b47a', fontWeight: '600' }}>{rep.role}</span>
                <span style={{ fontSize: '11px', background: 'rgba(0,76,109,0.08)', color: '#004c6d', padding: '2px 8px', borderRadius: '12px' }}>{rep.specialty}</span>
              </div>
            </div>

            <p style={{ margin: '8px 0', color: 'rgba(11, 40, 73, 0.7)', fontSize: '13px', lineHeight: '1.6', flexGrow: 1 }}>
              {rep.bio}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(11,40,73,0.08)', paddingTop: '12px', marginTop: '8px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(11,40,73,0.5)' }}>الدولة: {rep.country}</span>
              <a 
                href={`mailto:${rep.email}`} 
                style={{ 
                  fontSize: '12px', 
                  color: '#004c6d', 
                  textDecoration: 'none', 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                📧 اتصل بالبريد
              </a>
            </div>
          </GlassCard>
        ))}

        {filteredProfiles.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', background: 'rgba(255,255,255,0.4)', borderRadius: '20px', border: '1px dashed rgba(11,40,73,0.2)', color: 'rgba(11, 40, 73, 0.5)' }}>
            لا يوجد أعضاء مسجلين حالياً في هذه الدولة المحددة.
          </div>
        )}
      </div>

    </div>
  );
}
