import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../../../../utils/supabaseClient';
import { CertificateGenerator } from './CertificateGenerator';

export function CertificateVerificationPage({ lang = 'ar', certId }) {
  const [certRequest, setCertRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function verifyCert() {
      try {
        setLoading(true);
        // We look up the certificate request by id and verify it is approved
        const { data, error: dbError } = await supabase
          .from('certificate_requests')
          .select('*, courses(title_ar, title_en)')
          .eq('id', certId)
          .eq('status', 'approved')
          .single();

        if (dbError || !data) {
          setError(lang === 'ar' ? 'لم يتم العثور على شهادة معتمدة بهذا المعرف' : 'No approved certificate found with this ID');
        } else {
          setCertRequest(data);
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError(lang === 'ar' ? 'حدث خطأ أثناء التحقق' : 'Error during verification');
      } finally {
        setLoading(false);
      }
    }
    
    if (certId) {
      verifyCert();
    }
  }, [certId, lang]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#0b2849' }}>
        <h2>{lang === 'ar' ? 'جاري التحقق من صحة الشهادة...' : 'Verifying certificate...'}</h2>
      </div>
    );
  }

  if (error || !certRequest) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
        <div style={{ background: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '500px' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 20px auto' }}>
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <h2 style={{ color: '#0b2849', marginBottom: '16px', fontSize: '24px' }}>{lang === 'ar' ? 'شهادة غير صالحة' : 'Invalid Certificate'}</h2>
          <p style={{ color: 'rgba(11,40,73,0.7)', fontSize: '16px' }}>{error}</p>
        </div>
      </div>
    );
  }

  const courseTitle = lang === 'ar' 
    ? (certRequest.courses?.title_ar || 'مساق تدريبي')
    : (certRequest.courses?.title_en || certRequest.courses?.title_ar || 'Training Course');

  const name = certRequest.requested_name_ar || certRequest.requested_name_en;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', position: 'relative' }}>
      <CertificateGenerator
        recipientName={name}
        courseTitle={courseTitle}
        certId={certId}
        onClose={() => { window.location.href = '/' }}
      />
    </div>
  );
}
