import { GlassCard } from '../../shared/components/GlassCard';

export function AnalyticsDashboard() {
  const stats = [
    { title: 'إجمالي الطلاب المسجلين', value: '1,480', change: '+12% هذا الشهر', color: '#004c6d' },
    { title: 'نسبة إتمام المساقات', value: '74.2%', change: '+4.5% زيادة سنوية', color: '#15b47a' },
    { title: 'الشهادات الصادرة', value: '382', change: '+24 شهادة جديدة', color: '#ffd700' }
  ];

  // Mock regional data
  const regionalData = [
    { country: 'مصر', count: 480, pct: 60 },
    { country: 'السعودية', count: 320, pct: 40 },
    { country: 'العراق', count: 240, pct: 30 },
    { country: 'الأردن', count: 200, pct: 25 },
    { country: 'لبنان', count: 120, pct: 15 }
  ];

  return (
    <div className="analytics-dashboard-component" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', direction: 'rtl', textAlign: 'right' }}>
      
      {/* Mini Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '35px' }}>
        {stats.map((stat, idx) => (
          <GlassCard key={idx} style={{ padding: '24px', border: '1px solid rgba(11, 40, 73, 0.1)' }}>
            <span style={{ fontSize: '13px', color: 'rgba(11,40,73,0.5)', fontWeight: 'bold' }}>{stat.title}</span>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#0b2849', margin: '8px 0 4px 0' }}>{stat.value}</div>
            <span style={{ fontSize: '12px', color: '#15b47a', fontWeight: 'bold' }}>{stat.change}</span>
          </GlassCard>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '30px' }}>
        
        {/* SVG Enrollment Line Chart */}
        <GlassCard style={{ padding: '24px' }}>
          <h3 style={{ color: '#0b2849', fontSize: '18px', fontWeight: 'bold', marginBottom: '25px' }}>
            رسم بياني: تسجيل الطلاب الجدد (آخر 5 أشهر)
          </h3>

          <div style={{ position: 'relative', width: '100%', height: '200px', display: 'flex', alignItems: 'flex-end', paddingBottom: '30px' }}>
            {/* SVG Line Graph */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '170px' }} viewBox="0 0 500 170" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(11,40,73,0.06)" strokeWidth="1" />
              <line x1="0" y1="85" x2="500" y2="85" stroke="rgba(11,40,73,0.06)" strokeWidth="1" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="rgba(11,40,73,0.06)" strokeWidth="1" />

              {/* Chart Line */}
              <path 
                d="M 50 140 Q 150 110 250 70 T 450 30" 
                fill="none" 
                stroke="#004c6d" 
                strokeWidth="4" 
                strokeLinecap="round"
              />

              {/* Data Points */}
              <circle cx="50" cy="140" r="6" fill="#15b47a" stroke="#ffffff" strokeWidth="2" />
              <circle cx="150" cy="115" r="6" fill="#15b47a" stroke="#ffffff" strokeWidth="2" />
              <circle cx="250" cy="70" r="6" fill="#15b47a" stroke="#ffffff" strokeWidth="2" />
              <circle cx="350" cy="55" r="6" fill="#15b47a" stroke="#ffffff" strokeWidth="2" />
              <circle cx="450" cy="30" r="6" fill="#15b47a" stroke="#ffffff" strokeWidth="2" />
            </svg>

            {/* X Axis Labels */}
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', padding: '0 30px', fontSize: '11px', color: 'rgba(11,40,73,0.5)', fontWeight: 'bold', zIndex: 2 }}>
              <span>فبراير</span>
              <span>مارس</span>
              <span>أبريل</span>
              <span>مايو</span>
              <span>يونيو</span>
            </div>
          </div>
        </GlassCard>

        {/* Regional bar distribution */}
        <GlassCard style={{ padding: '24px' }}>
          <h3 style={{ color: '#0b2849', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
            توزيع الطلاب حسب الدول الأكثر تفاعلاً
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {regionalData.map((data, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#0b2849', fontWeight: 'bold', marginBottom: '6px' }}>
                  <span>{data.country}</span>
                  <span style={{ color: 'rgba(11,40,73,0.6)' }}>{data.count} طالب</span>
                </div>
                
                {/* Horizontal Progress Bar */}
                <div style={{ width: '100%', height: '8px', background: 'rgba(11,40,73,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${data.pct}%`, 
                      height: '100%', 
                      background: idx % 2 === 0 ? '#004c6d' : '#15b47a', 
                      borderRadius: '4px' 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

      </div>

    </div>
  );
}
