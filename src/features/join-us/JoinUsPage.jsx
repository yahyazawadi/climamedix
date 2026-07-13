import { useState, useEffect, useRef } from 'preact/hooks';
import { supabase } from '../../utils/supabaseClient';
import { uploadFileToR2 } from '../../utils/s3Client';
import { translations } from '../../i18n/translations';
import { Button } from '../shared/components/Button';
import { useAuth } from '../auth/hooks/useAuth';
import { GlassCard } from '../shared/components/GlassCard';

export function JoinUsPage({ lang, onNavigate }) {
  const { hasPermission } = useAuth();
  const canViewRequests = hasPermission('view:join_requests');
  
  const t = translations[lang] || translations.ar;
  const isArabic = lang === 'ar';
  
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    profession: '', 
    birth_date: '',
    university_org: '',
    work: '',
    is_activist: false,
    activist_field: '',
    is_researcher: false,
    researcher_field: '',
    bio: '',
    cv: null,
    city: '',
    country: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);
  
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const handleApproveRequest = async (item) => {
    setProcessingId(item.id);
    try {
      // 1. Check if user profile exists
      const { data: profile, error: findError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', item.email)
        .maybeSingle();

      if (findError) throw findError;
      if (!profile) {
        alert(isArabic 
          ? 'لم يتم العثور على مستخدم مسجل بهذا البريد الإلكتروني. يجب على المستخدم إنشاء حساب أولاً.' 
          : 'No registered user found with this email. The user must sign up first.'
        );
        return;
      }

      // 2. Update role & copy professional details to profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: item.track === 'research' ? 'researcher' : 'educator',
          profession: item.profession,
          university_or_org: item.university_org,
          is_activist: item.is_activist,
          field_of_activism: item.activist_field,
          is_researcher: item.is_researcher,
          field_of_research: item.researcher_field,
          bio: item.bio
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // 3. Keep the request for history, just update local state
      setRequests(prev => prev.map(r => r.id === item.id ? { ...r, isApproved: true } : r));
      alert(isArabic ? 'تمت الموافقة وترقية المستخدم بنجاح!' : 'User approved and promoted successfully!');
    } catch (err) {
      console.error(err);
      alert(isArabic ? `حدث خطأ: ${err.message}` : `Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (item) => {
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Are you sure you want to delete this request?')) return;
    setProcessingId(item.id);
    try {
      const { error } = await supabase
        .from('join_requests')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      setRequests(prev => prev.filter(r => r.id !== item.id));
    } catch (err) {
      console.error(err);
      alert(isArabic ? `حدث خطأ: ${err.message}` : `Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Fetch requests if admin
  useEffect(() => {
    if (canViewRequests) {
      const fetchRequests = async () => {
        setLoadingRequests(true);
        const { data, error } = await supabase
          .from('join_requests')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          const { data: profiles } = await supabase.from('profiles').select('email, role, id');
          const profilesByEmail = {};
          if (profiles) {
            profiles.forEach(p => profilesByEmail[p.email] = { role: p.role, id: p.id });
          }
          const requestsWithStatus = data.map(req => {
            const profile = profilesByEmail[req.email];
            const isApproved = profile && (profile.role === 'researcher' || profile.role === 'educator');
            return { ...req, isApproved, profileId: profile ? profile.id : null };
          });
          setRequests(requestsWithStatus);
        }
        setLoadingRequests(false);
      };
      fetchRequests();
    }
  }, [canViewRequests]);

  // Scroll to top and fetch IP-based location on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Automatically fetch user location via IP
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data && data.city && data.country_name) {
          setForm(prev => ({ ...prev, city: data.city, country: data.country_name }));
        }
      })
      .catch(err => console.error('Could not fetch location:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    
    try {
      let cvUrl = null;
      if (form.cv) {
        cvUrl = await uploadFileToR2(form.cv, 'cvs');
      }

      const { error } = await supabase
        .from('join_requests')
        .insert([
          {
            full_name: form.name,
            email: form.email,
            profession: form.profession,
            birth_date: form.birth_date || null,
            university_org: form.university_org,
            work: form.work,
            is_activist: form.is_activist,
            activist_field: form.activist_field,
            is_researcher: form.is_researcher,
            researcher_field: form.researcher_field,
            bio: form.bio,
            cv_url: cvUrl,
            city: form.city,
            country: form.country,
            track: selectedTrack
          }
        ]);
        
      if (error) {
        throw error;
      }
      
      setSuccess(true);
      setSelectedTrack(null);
      setForm({ 
        name: '', email: '', profession: '', birth_date: '', university_org: '', 
        work: '', is_activist: false, activist_field: '', is_researcher: false, researcher_field: '', bio: '', cv: null, city: '', country: ''
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => {
        setSuccess(false);
        onNavigate('home');
      }, 3500);
    } catch (error) {
      console.error("Error submitting join request:", error);
      console.error("Error Details:", JSON.stringify(error, null, 2));
      const displayErr = error.message || error.toString();
      setErrorMsg(isArabic ? `حدث خطأ أثناء الإرسال. (${displayErr})` : `An error occurred. (${displayErr})`);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%', 
    padding: '13px 16px', 
    borderRadius: '12px', 
    border: '1px solid rgba(11, 40, 73, 0.15)', 
    fontSize: '14px', 
    outline: 'none', 
    background: '#ffffff',
    color: '#0b2849',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    fontSize: '13px', 
    fontWeight: 'bold', 
    color: '#0b2849', 
    display: 'block', 
    marginBottom: '8px',
    fontFamily: isArabic ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      
      {/* 1. Header Banner Block */}
      <div 
        className="opportunities-banner"
        style={{
          background: 'linear-gradient(90deg, #15b47a 0%, #12a978 5%, #0c8774 23%, #066d71 41%, #025a6e 60%, #004f6d 79%, #004c6d 100%)',
          padding: '160px 20px 60px 20px',
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(11, 40, 73, 0.1)',
          direction: isArabic ? 'rtl' : 'ltr'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: 'clamp(28px, 4vw, 40px)', 
            fontWeight: 'bold', 
            color: '#ffffff', 
            marginBottom: '16px',
            fontFamily: isArabic ? 'Tajawal, sans-serif' : 'Outfit, sans-serif',
            textShadow: '0 2px 4px rgba(0,0,0,0.15)'
          }}>
            {t.joinUsPageTitle}
          </h1>
          
          <p style={{ 
            fontSize: 'clamp(14px, 1.8vw, 16px)', 
            color: 'rgba(255, 255, 255, 0.9)', 
            maxWidth: '700px', 
            margin: '0 auto',
            lineHeight: '1.6',
            fontFamily: isArabic ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
          }}>
            {t.joinUsPageIntro}
          </p>
        </div>
      </div>

      {/* 2. Content Block */}
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
          maxWidth: '650px', 
          margin: '0 auto', 
          textAlign: isArabic ? 'right' : 'left', 
          direction: isArabic ? 'rtl' : 'ltr' 
        }}>
          
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 10px 30px rgba(11, 40, 73, 0.06)',
            border: '1px solid rgba(11, 40, 73, 0.08)',
            padding: '40px 35px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '5px',
              background: 'linear-gradient(90deg, #15b47a, #004c6d)'
            }}></div>

            {success ? (
              <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                <div style={{ 
                  marginBottom: '20px',
                  animation: 'bounce 1s ease infinite alternate',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '72px', height: '72px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #15b47a, #004c6d)'
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <h3 style={{ 
                  color: '#15b47a', 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  marginBottom: '10px',
                  fontFamily: isArabic ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
                }}>
                  {t.joinSuccessTitle}
                </h3>
                <p style={{ 
                  color: 'rgba(11, 40, 73, 0.7)', 
                  fontSize: '15px', 
                  lineHeight: '1.6',
                  fontFamily: isArabic ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
                }}>
                  {t.joinSuccessDesc}
                </p>
              </div>
            ) : !selectedTrack ? (
              /* Track Selection Step */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '10px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <h3 style={{
                    color: '#0b2849', fontSize: '22px', fontWeight: 'bold', marginBottom: '10px',
                    fontFamily: isArabic ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
                  }}>{t.trackSelectionTitle}</h3>
                  <p style={{ color: 'rgba(11, 40, 73, 0.6)', fontSize: '14px', lineHeight: '1.6' }}>{t.trackSelectionDesc}</p>
                </div>

                {/* Research Track Card */}
                <div
                  onClick={() => setSelectedTrack('research')}
                  style={{
                    padding: '28px 24px', borderRadius: '16px', cursor: 'pointer',
                    border: '2px solid rgba(21, 180, 122, 0.2)',
                    background: 'linear-gradient(135deg, rgba(21, 180, 122, 0.04) 0%, rgba(0, 76, 109, 0.04) 100%)',
                    transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#15b47a'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(21, 180, 122, 0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(21, 180, 122, 0.2)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '14px',
                      background: 'linear-gradient(135deg, #15b47a, #004c6d)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="15" r="1"/><path d="M16 2v4"/><path d="M12 2v4"/><path d="M12 6a4 4 0 0 1 4 4c0 5-6 10-6 10S4 15 4 10a4 4 0 0 1 4-4h4z"/><path d="M16 6a4 4 0 0 1 4 4c0 2.5-2 5.5-4 7.5"/></svg>
                    </div>
                    <h4 style={{ margin: 0, color: '#0b2849', fontSize: '17px', fontWeight: 'bold',
                      fontFamily: isArabic ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
                    }}>{t.trackResearch}</h4>
                  </div>
                  <p style={{ margin: 0, color: 'rgba(11, 40, 73, 0.65)', fontSize: '13.5px', lineHeight: '1.7' }}>{t.trackResearchDesc}</p>
                </div>

                {/* Community Health Educator Card */}
                <div
                  onClick={() => setSelectedTrack('educator')}
                  style={{
                    padding: '28px 24px', borderRadius: '16px', cursor: 'pointer',
                    border: '2px solid rgba(0, 76, 109, 0.2)',
                    background: 'linear-gradient(135deg, rgba(0, 76, 109, 0.04) 0%, rgba(21, 180, 122, 0.04) 100%)',
                    transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#004c6d'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 76, 109, 0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 76, 109, 0.2)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '14px',
                      background: 'linear-gradient(135deg, #004c6d, #15b47a)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
                    </div>
                    <h4 style={{ margin: 0, color: '#0b2849', fontSize: '17px', fontWeight: 'bold',
                      fontFamily: isArabic ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
                    }}>{t.trackEducator}</h4>
                  </div>
                  <p style={{ margin: 0, color: 'rgba(11, 40, 73, 0.65)', fontSize: '13.5px', lineHeight: '1.7' }}>{t.trackEducatorDesc}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Track indicator + back button */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', borderRadius: '12px',
                  background: selectedTrack === 'research'
                    ? 'linear-gradient(135deg, rgba(21, 180, 122, 0.08), rgba(0, 76, 109, 0.08))'
                    : 'linear-gradient(135deg, rgba(0, 76, 109, 0.08), rgba(21, 180, 122, 0.08))',
                  border: `1px solid ${selectedTrack === 'research' ? 'rgba(21, 180, 122, 0.2)' : 'rgba(0, 76, 109, 0.2)'}`
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: selectedTrack === 'research'
                      ? 'linear-gradient(135deg, #15b47a, #004c6d)'
                      : 'linear-gradient(135deg, #004c6d, #15b47a)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {selectedTrack === 'research'
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="15" r="1"/><path d="M16 2v4"/><path d="M12 2v4"/><path d="M12 6a4 4 0 0 1 4 4c0 5-6 10-6 10S4 15 4 10a4 4 0 0 1 4-4h4z"/><path d="M16 6a4 4 0 0 1 4 4c0 2.5-2 5.5-4 7.5"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
                    }
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#0b2849', flex: 1,
                    fontFamily: isArabic ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
                  }}>{selectedTrack === 'research' ? t.trackResearch : t.trackEducator}</span>
                  <button type="button" onClick={() => setSelectedTrack(null)} style={{
                    background: 'none', border: 'none', color: '#15b47a', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 'bold', textDecoration: 'underline',
                    fontFamily: isArabic ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
                  }}>{isArabic ? 'تغيير' : 'Change'}</button>
                </div>
                {errorMsg && (
                  <div style={{ 
                    padding: '14px 16px', 
                    background: 'rgba(255, 77, 77, 0.08)', 
                    color: '#ff4d4d', 
                    borderRadius: '12px', 
                    fontSize: '14px', 
                    textAlign: 'center',
                    border: '1px solid rgba(255, 77, 77, 0.15)',
                    fontWeight: '500'
                  }}>
                    {errorMsg}
                  </div>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={labelStyle}>{t.fullNameLabel}</label>
                    <input 
                      type="text" required placeholder={t.fullNamePlaceholder}
                      value={form.name} onInput={(e) => setForm({ ...form, name: e.target.value })}
                      style={inputStyle}
                      onFocus={(e) => e.target.style.borderColor = '#15b47a'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(11, 40, 73, 0.15)'}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>{t.emailLabel}</label>
                    <input 
                      type="email" required placeholder="name@example.com" 
                      value={form.email} onInput={(e) => setForm({ ...form, email: e.target.value })}
                      style={inputStyle}
                      onFocus={(e) => e.target.style.borderColor = '#15b47a'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(11, 40, 73, 0.15)'}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={labelStyle}>{t.birthDateLabel}</label>
                    <input 
                      type="date"
                      value={form.birth_date} onInput={(e) => setForm({ ...form, birth_date: e.target.value })}
                      style={inputStyle}
                      onFocus={(e) => e.target.style.borderColor = '#15b47a'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(11, 40, 73, 0.15)'}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>{t.professionLabel}</label>
                    <input 
                      type="text" required placeholder={t.professionPlaceholder}
                      value={form.profession} onInput={(e) => setForm({ ...form, profession: e.target.value })}
                      style={inputStyle}
                      onFocus={(e) => e.target.style.borderColor = '#15b47a'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(11, 40, 73, 0.15)'}
                    />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={labelStyle}>{t.universityLabel}</label>
                    <input 
                      type="text" placeholder={t.universityPlaceholder}
                      value={form.university_org} onInput={(e) => setForm({ ...form, university_org: e.target.value })}
                      style={inputStyle}
                      onFocus={(e) => e.target.style.borderColor = '#15b47a'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(11, 40, 73, 0.15)'}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>{t.workLabel}</label>
                    <input 
                      type="text" placeholder={t.workPlaceholder}
                      value={form.work} onInput={(e) => setForm({ ...form, work: e.target.value })}
                      style={inputStyle}
                      onFocus={(e) => e.target.style.borderColor = '#15b47a'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(11, 40, 73, 0.15)'}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    id="isActivist"
                    checked={form.is_activist}
                    onChange={(e) => setForm({ ...form, is_activist: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#15b47a' }}
                  />
                  <label htmlFor="isActivist" style={{ fontSize: '14px', color: '#0b2849', cursor: 'pointer', fontWeight: 'bold' }}>
                    {t.isActivistLabel}
                  </label>
                </div>

                {form.is_activist && (
                  <div>
                    <label style={labelStyle}>{t.activistFieldLabel}</label>
                    <input 
                      type="text" required placeholder={t.activistFieldPlaceholder}
                      value={form.activist_field} onInput={(e) => setForm({ ...form, activist_field: e.target.value })}
                      style={inputStyle}
                      onFocus={(e) => e.target.style.borderColor = '#15b47a'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(11, 40, 73, 0.15)'}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    id="isResearcher"
                    checked={form.is_researcher}
                    onChange={(e) => setForm({ ...form, is_researcher: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#15b47a' }}
                  />
                  <label htmlFor="isResearcher" style={{ fontSize: '14px', color: '#0b2849', cursor: 'pointer', fontWeight: 'bold' }}>
                    {t.isResearcherLabel}
                  </label>
                </div>

                {form.is_researcher && (
                  <div>
                    <label style={labelStyle}>{t.researcherFieldLabel}</label>
                    <input 
                      type="text" required placeholder={t.researcherFieldPlaceholder}
                      value={form.researcher_field} onInput={(e) => setForm({ ...form, researcher_field: e.target.value })}
                      style={inputStyle}
                      onFocus={(e) => e.target.style.borderColor = '#15b47a'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(11, 40, 73, 0.15)'}
                    />
                  </div>
                )}

                <div>
                  <label style={labelStyle}>{t.bioLabel}</label>
                  <textarea 
                    rows="3" placeholder={t.bioPlaceholder}
                    value={form.bio} onInput={(e) => setForm({ ...form, bio: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={(e) => e.target.style.borderColor = '#15b47a'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(11, 40, 73, 0.15)'}
                  />
                </div>
                
                <div>
                  <label style={labelStyle}>
                    {isArabic ? 'السيرة الذاتية (اختياري)' : 'Resume / CV (Optional)'}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Button 
                      variant="gradient" 
                      type="button"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    >
                      {isArabic ? 'رفع الملف' : 'Upload File'}
                    </Button>
                    <span style={{ fontSize: '13px', color: 'rgba(11, 40, 73, 0.7)' }}>
                      {form.cv ? form.cv.name : (isArabic ? 'لم يتم اختيار ملف' : 'No file chosen')}
                    </span>
                  </div>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    ref={fileInputRef}
                    onChange={(e) => setForm({ ...form, cv: e.target.files[0] })}
                    style={{ display: 'none' }}
                  />
                  <small style={{ display: 'block', marginTop: '6px', fontSize: '11.5px', color: 'rgba(11, 40, 73, 0.5)' }}>
                    {isArabic ? 'صيغ الملفات المدعومة: PDF, DOC, DOCX' : 'Supported formats: PDF, DOC, DOCX'}
                  </small>
                </div>
                
                <div style={{ marginTop: '10px' }}>
                  <Button 
                    variant="gradient"
                    type="submit" 
                    disabled={submitting}
                    style={{ width: '100%', padding: '14px', fontSize: '15.5px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      {submitting && (
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                      )}
                      <span>{submitting ? t.submittingJoinReq : t.submitJoinReq}</span>
                    </div>
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Admin: Pending Join Requests (separate section below the form) */}
          {canViewRequests && (
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 10px 30px rgba(11, 40, 73, 0.06)',
              border: '1px solid rgba(11, 40, 73, 0.08)',
              padding: '40px 35px',
              position: 'relative',
              overflow: 'hidden',
              marginTop: '30px'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '5px',
                background: 'linear-gradient(90deg, #f0a841, #ea4335)'
              }}></div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ color: '#0b2849', fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
                  {isArabic ? 'طلبات الانضمام' : 'Pending Join Requests'}
                  {loadingRequests && <span style={{ fontSize: '14px', fontWeight: 'normal', margin: '0 10px', color: '#15b47a' }}>{isArabic ? 'جاري التحميل...' : 'Loading...'}</span>}
                  {!loadingRequests && <span style={{ fontSize: '14px', fontWeight: 'normal', margin: '0 10px', color: 'rgba(11,40,73,0.5)' }}>({requests.length})</span>}
                </h3>
                {requests.map(item => (
                  <GlassCard 
                    key={item.id} 
                    style={{ 
                      padding: '16px 20px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      border: '1px solid rgba(11, 40, 73, 0.1)',
                      flexDirection: 'column'
                    }}
                  >
                    <h4 style={{ margin: 0, color: '#0b2849', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>{item.full_name}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', color: 'rgba(11,40,73,0.7)', width: '100%' }}>
                      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <span><strong>{isArabic ? 'البريد:' : 'Email:'}</strong> {item.email}</span>
                        <span><strong>{isArabic ? 'التخصص:' : 'Profession:'}</strong> {item.profession}</span>
                        <span><strong>{isArabic ? 'التاريخ:' : 'Date:'}</strong> {new Date(item.created_at).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}</span>
                        {item.track && <span><strong>{t.trackLabel}:</strong> {item.track === 'research' ? t.trackResearch : t.trackEducator}</span>}
                        {item.city && item.country && <span><strong>{isArabic ? 'الموقع:' : 'Location:'}</strong> {item.city}, {item.country}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        {item.birth_date && <span><strong>{isArabic ? 'الميلاد:' : 'Birth:'}</strong> {new Date(item.birth_date).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}</span>}
                        {item.university_org && <span><strong>{isArabic ? 'الجامعة/المنظمة:' : 'Org:'}</strong> {item.university_org}</span>}
                        {item.work && <span><strong>{isArabic ? 'العمل:' : 'Work:'}</strong> {item.work}</span>}
                        {item.is_activist && <span><strong>{isArabic ? 'ناشط:' : 'Activist:'}</strong> {isArabic ? 'نعم' : 'Yes'} ({item.activist_field || (isArabic ? 'غير محدد' : 'Unspecified')})</span>}
                        {item.is_researcher && <span><strong>{isArabic ? 'باحث:' : 'Researcher:'}</strong> {isArabic ? 'نعم' : 'Yes'} ({item.researcher_field || (isArabic ? 'غير محدد' : 'Unspecified')})</span>}
                      </div>
                      {item.bio && (
                        <div style={{ marginTop: '8px', fontStyle: 'italic', background: 'rgba(11,40,73,0.03)', padding: '10px', borderRadius: '8px' }}>
                          "{item.bio}"
                        </div>
                      )}
                      {item.cv_url && (
                        <div style={{ marginTop: '8px' }}>
                          <a href={item.cv_url} target="_blank" rel="noreferrer" style={{ color: '#15b47a', textDecoration: 'underline', fontWeight: 'bold' }}>
                            {isArabic ? 'عرض السيرة الذاتية (CV)' : 'View Resume (CV)'}
                          </a>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px', borderTop: '1px solid rgba(11,40,73,0.08)', paddingTop: '12px', width: '100%', alignItems: 'center' }}>
                        {item.isApproved ? (
                          <button 
                            onClick={() => {
                              if (item.profileId) {
                                window.history.pushState({}, '', `/admin/users?id=${item.profileId}`);
                                onNavigate('admin-users');
                              }
                            }}
                            style={{ padding: '6px 14px', borderRadius: '8px', background: 'rgba(21,180,122,0.1)', color: '#15b47a', fontWeight: 'bold', fontSize: '13px', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(21,180,122,0.2)'}
                            onMouseOut={(e) => e.target.style.background = 'rgba(21,180,122,0.1)'}
                            title={isArabic ? 'انتقل إلى صفحة صلاحيات المستخدم' : 'Go to User Permissions Page'}
                          >
                            ✓ {isArabic ? 'موافق عليه ومسجل' : 'Approved & Registered'}
                          </button>
                        ) : (
                          <>
                            <Button 
                              variant="gradient" 
                              disabled={processingId !== null}
                              onClick={() => handleApproveRequest(item)}
                              style={{ fontSize: '12px', padding: '6px 14px' }}
                            >
                              {processingId === item.id ? (isArabic ? 'جاري الترقية...' : 'Promoting...') : (isArabic ? 'قبول وترقية العضو' : 'Approve & Promote')}
                            </Button>
                            <Button 
                              variant="outline" 
                              disabled={processingId !== null}
                              onClick={() => handleRejectRequest(item)}
                              style={{ 
                                fontSize: '12px', 
                                padding: '6px 14px', 
                                color: '#ff4d4d', 
                                borderColor: 'rgba(255,77,77,0.3)',
                                background: 'transparent'
                              }}
                            >
                              {isArabic ? 'حذف الطلب' : 'Delete Request'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
                {requests.length === 0 && !loadingRequests && (
                  <p style={{ textAlign: 'center', color: 'rgba(11, 40, 73, 0.5)', padding: '20px' }}>
                    {isArabic ? 'لا توجد طلبات انضمام حالياً.' : 'No join requests yet.'}
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
