import { useState } from 'preact/hooks';
import { Button } from '../../shared/components/Button';
import { GlassCard } from '../../shared/components/GlassCard';

export function ProgramDetailModal({ program, onClose, onApply }) {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    institution: '',
    motivation: ''
  });

  if (!program) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    if (onApply) {
      onApply(program.id, formData);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 12, 26, 0.6)',
      backdropFilter: 'blur(15px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '28px',
        border: '1px solid rgba(11, 40, 73, 0.15)',
        maxWidth: '850px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        direction: 'rtl',
        textAlign: 'right'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(11, 40, 73, 0.05)',
            border: 'none',
            fontSize: '22px',
            color: '#0b2849',
            cursor: 'pointer',
            fontWeight: 'bold',
            zIndex: 10,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(11, 40, 73, 0.1)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(11, 40, 73, 0.05)'}
        >
          &times;
        </button>

        {/* Hero Cover */}
        <div style={{ position: 'relative', height: '240px', width: '100%', overflow: 'hidden' }}>
          <img 
            src={program.image || '/assets/bg_1.png'} 
            alt={program.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(0deg, rgba(11, 40, 73, 0.9) 0%, rgba(11, 40, 73, 0.4) 100%)',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '30px'
          }}>
            <div>
              <span style={{ 
                background: '#15b47a', 
                color: '#ffffff', 
                padding: '4px 12px', 
                borderRadius: '20px', 
                fontSize: '11px', 
                fontWeight: 'bold',
                display: 'inline-block',
                marginBottom: '10px'
              }}>
                {program.category || 'برنامج مميز'}
              </span>
              <h2 style={{ color: '#ffffff', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
                {program.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Content Grid */}
        <div style={{ padding: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
          
          {/* Right Column: Info & Details */}
          <div>
            <h3 style={{ color: '#0b2849', fontSize: '18px', fontWeight: 'bold', borderBottom: '2px solid rgba(21, 180, 122, 0.2)', paddingBottom: '8px', marginBottom: '15px' }}>
              تفاصيل البرنامج
            </h3>
            
            <p style={{ color: 'rgba(11, 40, 73, 0.8)', fontSize: '14.5px', lineHeight: '1.8', marginBottom: '20px' }}>
              {program.desc}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
              <div style={{ background: 'rgba(0, 76, 109, 0.05)', padding: '12px', borderRadius: '12px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(11, 40, 73, 0.5)' }}>المدة الزمنية:</span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#004c6d', marginTop: '4px' }}>{program.duration || '6 أسابيع'}</div>
              </div>
              <div style={{ background: 'rgba(0, 76, 109, 0.05)', padding: '12px', borderRadius: '12px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(11, 40, 73, 0.5)' }}>المنظم:</span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#004c6d', marginTop: '4px' }}>كلايما ميدكس</div>
              </div>
            </div>

            <h4 style={{ color: '#0b2849', fontSize: '15px', fontWeight: 'bold', marginBottom: '10px' }}>الأهداف الإستراتيجية:</h4>
            <ul style={{ paddingRight: '20px', color: 'rgba(11, 40, 73, 0.75)', fontSize: '13.5px', lineHeight: '1.7', margin: '0 0 25px 0' }}>
              <li>تأهيل الكوادر الصحية للتعامل مع متطلبات التغيرات البيئية الإقليمية.</li>
              <li>دعم الأبحاث الطبية الموجهة نحو إيجاد حلول تكيفية عملية.</li>
              <li>بناء شبكة تواصل فعالة بين الباحثين وصناع السياسة الصحية العرب.</li>
            </ul>

            <h4 style={{ color: '#0b2849', fontSize: '15px', fontWeight: 'bold', marginBottom: '10px' }}>شروط الأهلية:</h4>
            <p style={{ color: 'rgba(11, 40, 73, 0.75)', fontSize: '13.5px', lineHeight: '1.7', margin: 0 }}>
              مفتوح لكافة العاملين في الحقل الطبي والصحي، طلاب الكليات الطبية والعلوم الصحية، والباحثين المهتمين بالقضايا البيئية في العالم العربي.
            </p>
          </div>

          {/* Left Column: Application Form */}
          <div style={{ background: 'rgba(0, 76, 109, 0.03)', border: '1px solid rgba(11, 40, 73, 0.08)', borderRadius: '20px', padding: '24px' }}>
            <h3 style={{ color: '#0b2849', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
              نموذج تقديم الطلب
            </h3>

            {formSubmitted ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#15b47a' }}>
                <div style={{ fontSize: '40px', marginBottom: '15px' }}>✓</div>
                <h4 style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>تم إرسال طلبك بنجاح!</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(11, 40, 73, 0.6)', lineHeight: '1.6' }}>
                  شكراً لاهتمامك ببرامجنا. سيقوم الفريق الأكاديمي بمراجعة طلبك والتواصل معك عبر البريد الإلكتروني قريباً.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#0b2849', display: 'block', marginBottom: '6px' }}>الاسم الكامل</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onInput={(e) => setFormData({...formData, name: e.target.value})}
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', fontSize: '13px', outline: 'none' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#0b2849', display: 'block', marginBottom: '6px' }}>البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onInput={(e) => setFormData({...formData, email: e.target.value})}
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', fontSize: '13px', outline: 'none' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#0b2849', display: 'block', marginBottom: '6px' }}>المؤسسة / المستشفى / الجامعة</label>
                  <input 
                    type="text" 
                    required
                    value={formData.institution}
                    onInput={(e) => setFormData({...formData, institution: e.target.value})}
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', fontSize: '13px', outline: 'none' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#0b2849', display: 'block', marginBottom: '6px' }}>رسالة الدافع (لماذا تود الانضمام؟)</label>
                  <textarea 
                    required
                    rows={4}
                    value={formData.motivation}
                    onInput={(e) => setFormData({...formData, motivation: e.target.value})}
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', fontSize: '13px', outline: 'none', resize: 'vertical' }} 
                  />
                </div>

                <Button type="submit" variant="gradient" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
                  إرسال الطلب
                </Button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
