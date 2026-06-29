import { useState, useEffect, useRef } from 'preact/hooks';
import { useAuth } from '../../auth/hooks/useAuth';
import { supabase } from '../../../utils/supabaseClient';
import { uploadFileToR2 } from '../../../utils/s3Client';
import { translations } from '../../../i18n/translations';
import { Button } from '../../shared/components/Button';
import { GlassCard } from '../../shared/components/GlassCard';
import './ProfilePage.css';

// Client-side image converter to WebP using HTML Canvas
const convertToWebP = (file) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve(file); // fallback to original file if not an image
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas conversion to WebP failed'));
            return;
          }
          const webpFile = new File(
            [blob], 
            file.name.replace(/\.[^/.]+$/, "") + ".webp", 
            { type: 'image/webp' }
          );
          resolve(webpFile);
        }, 'image/webp', 0.85);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export function ProfilePage({ lang, onNavigate }) {
  const { user, userProfile } = useAuth();
  const t = translations[lang] || translations.ar;
  const isArabic = lang === 'ar';
  
  const [formData, setFormData] = useState({
    title: 'Mr',
    full_name: '',
    birthdate: '',
    city: '',
    country: '',
    profession: '',
    university_or_org: '',
    specialty: '',
    is_activist: false,
    field_of_activism: '',
    is_researcher: false,
    field_of_research: '',
    bio: '',
    avatar_url: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState(null);
  const fileInputRef = useRef(null);

  // Sync with loaded profile data
  useEffect(() => {
    if (userProfile) {
      setFormData({
        title: userProfile.title || 'Mr',
        full_name: userProfile.full_name || '',
        birthdate: userProfile.birthdate || '',
        city: userProfile.city || '',
        country: userProfile.country || '',
        profession: userProfile.profession || '',
        university_or_org: userProfile.university_or_org || '',
        specialty: userProfile.specialty || '',
        is_activist: userProfile.is_activist || false,
        field_of_activism: userProfile.field_of_activism || '',
        is_researcher: userProfile.is_researcher || false,
        field_of_research: userProfile.field_of_research || '',
        bio: userProfile.bio || '',
        avatar_url: userProfile.avatar_url || ''
      });

      // Geolocation lookup if city/country is empty
      if (!userProfile.city || !userProfile.country) {
        fetch('https://ipapi.co/json/')
          .then(res => res.json())
          .then(data => {
            if (data && data.city && data.country_name) {
              setFormData(prev => ({
                ...prev,
                city: prev.city || data.city,
                country: prev.country || data.country_name
              }));
            }
          })
          .catch(err => console.warn('IP location fetch failed:', err));
      }
    }
  }, [userProfile]);

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    setAlert(null);
    try {
      // 1. Convert to WebP format client-side
      const webpFile = await convertToWebP(file);
      
      // 2. Upload WebP to Cloudflare R2
      const publicUrl = await uploadFileToR2(webpFile, 'avatars');
      
      if (!publicUrl) throw new Error('File upload returned empty URL');
      
      // 3. Save to state & database
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
        
      if (error) throw error;
      
      setAlert({ type: 'success', message: t.avatarUpdateSuccess });
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: err.message || (isArabic ? 'فشل رفع الصورة' : 'Failed to upload photo') });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          title: formData.title,
          full_name: formData.full_name,
          birthdate: formData.birthdate || null,
          city: formData.city,
          country: formData.country,
          bio: formData.bio,
          // Only save professional data if user is approved
          ...(isApproved && {
            profession: formData.profession,
            university_or_org: formData.university_or_org,
            specialty: formData.specialty,
            is_activist: formData.is_activist,
            field_of_activism: formData.field_of_activism,
            is_researcher: formData.is_researcher,
            field_of_research: formData.field_of_research,
          })
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setAlert({ type: 'success', message: t.profileUpdateSuccess });
      
      // Scroll to top to show alert
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: err.message || (isArabic ? 'فشل حفظ التعديلات' : 'Failed to save changes') });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-page-viewport" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="profile-main-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <GlassCard style={{ padding: '40px', textAlign: 'center', maxWidth: '400px' }}>
            <h3 style={{ color: '#0b2849', marginBottom: '15px' }}>{isArabic ? 'سجل الدخول للمتابعة' : 'Please Login to Continue'}</h3>
            <Button variant="gradient" onClick={() => onNavigate('auth')}>{t.login}</Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  const role = userProfile?.role || 'user';
  const isApproved = ['admin', 'superadmin', 'researcher', 'educator'].includes(role);

  // Fallback Initials
  const getInitials = (name) => {
    if (!name) return 'CM';
    return name
      .split(' ')
      .slice(0, 2)
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  const getRoleBadgeLabel = (userRole) => {
    switch (userRole) {
      case 'superadmin': return isArabic ? 'مسؤول خارق' : 'Super Admin';
      case 'admin': return isArabic ? 'مسؤول النظام' : 'Administrator';
      case 'researcher': return isArabic ? 'باحث علمي معتمد' : 'Verified Researcher';
      case 'educator': return isArabic ? 'مثقف صحي معتمد' : 'Verified Educator';
      default: return isArabic ? 'عضو المنصة' : 'Platform Member';
    }
  };

  return (
    <div className="profile-page-viewport" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="profile-main-container">
        
        {/* Title Block */}
        <div className="profile-page-title-block">
          <h1 className="profile-page-title">{t.profileTitle}</h1>
          <p className="profile-page-subtitle">{t.profileSubtitle}</p>
        </div>

        {alert && (
          <div className={`profile-status-alert alert-${alert.type}`}>
            <span className="alert-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
              {alert.type === 'success' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              )}
            </span>
            <span className="alert-message">{alert.message}</span>
          </div>
        )}

        <div className="profile-layout-grid">
          
          {/* Left Column: Avatar & Basic Account info */}
          <div className="profile-grid-col-left">
            <GlassCard className="profile-glass-card pfp-card">
              <div className="avatar-uploader-container">
                <div 
                  className={`avatar-circle-wrapper ${uploading ? 'is-uploading' : ''}`}
                  onClick={handleAvatarClick}
                  title={t.pfpUploadBtn}
                >
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt={formData.full_name} className="avatar-image-el" />
                  ) : (
                    <div className="avatar-initials-el">{getInitials(formData.full_name)}</div>
                  )}
                  <div className="avatar-hover-overlay">
                    <svg className="overlay-camera-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ marginBottom: '6px', color: '#ffffff' }}>
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                    <span className="overlay-text-label">{uploading ? t.pfpUploading : t.pfpUploadBtn}</span>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
              </div>

              <div className="profile-meta-details">
                <h3 className="profile-meta-name">{formData.full_name || user.email.split('@')[0]}</h3>
                <p className="profile-meta-email">{user.email}</p>
                <div className={`profile-role-badge badge-${role}`}>
                  {getRoleBadgeLabel(role)}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right Column: Editable Profile details Form */}
          <div className="profile-grid-col-right">
            <GlassCard className="profile-glass-card form-card">
              <form onSubmit={handleSave} className="profile-edit-form">
                
                {/* Section A: Personal Information */}
                <div className="form-section-block">
                  <h4 className="form-section-header">{t.personalSectionTitle}</h4>
                  
                  <div className="form-fields-grid">
                    <div>
                      <label className="form-field-label">{t.titleLabel}</label>
                      <div className="custom-select-wrapper">
                        <select 
                          value={formData.title} 
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="form-input-field select-field"
                        >
                          <option value="Mr">{isArabic ? 'السيد' : 'Mr'}</option>
                          <option value="Ms">{isArabic ? 'السيدة' : 'Ms'}</option>
                          <option value="Dr">{isArabic ? 'الدكتور' : 'Dr'}</option>
                          <option value="Prof">{isArabic ? 'البروفيسور' : 'Prof'}</option>
                        </select>
                        <span className="select-arrow-icon">▼</span>
                      </div>
                    </div>

                    <div>
                      <label className="form-field-label">{t.fullNameLabel}</label>
                      <input 
                        type="text" 
                        required 
                        value={formData.full_name} 
                        onInput={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="form-input-field" 
                      />
                    </div>

                    <div>
                      <label className="form-field-label">{t.birthdateLabel}</label>
                      <input 
                        type="date" 
                        required 
                        value={formData.birthdate} 
                        onInput={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                        className="form-input-field" 
                      />
                    </div>
                  </div>

                  <div className="form-fields-grid style-location-grid">
                    <div>
                      <label className="form-field-label">{t.cityLabel}</label>
                      <input 
                        type="text" 
                        value={formData.city} 
                        onInput={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="form-input-field" 
                      />
                    </div>

                    <div>
                      <label className="form-field-label">{t.countryLabel}</label>
                      <input 
                        type="text" 
                        value={formData.country} 
                        onInput={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="form-input-field" 
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '15px' }}>
                    <label className="form-field-label">{t.bioLabel}</label>
                    <textarea 
                      rows="3" 
                      value={formData.bio} 
                      onInput={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="form-input-field textarea-field"
                    />
                  </div>
                </div>

                {/* Section B: Professional Details (Approved Users Only) */}
                {isApproved && (
                  <div className="form-section-block block-professional animate-fade-in">
                    <h4 className="form-section-header header-green">{t.professionalSectionTitle}</h4>
                    
                    <div className="form-fields-grid">
                      <div>
                        <label className="form-field-label">{t.professionLabel}</label>
                        <div className="custom-select-wrapper">
                          <select 
                            value={formData.profession} 
                            onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                            className="form-input-field select-field"
                          >
                            <option value="doctor">{t.professionDoctor}</option>
                            <option value="researcher">{t.professionResearcher}</option>
                            <option value="student">{t.professionStudent}</option>
                            <option value="other">{t.professionOther}</option>
                          </select>
                          <span className="select-arrow-icon">▼</span>
                        </div>
                      </div>

                      <div>
                        <label className="form-field-label">{t.orgLabel}</label>
                        <input 
                          type="text" 
                          value={formData.university_or_org} 
                          onInput={(e) => setFormData({ ...formData, university_or_org: e.target.value })}
                          className="form-input-field" 
                        />
                      </div>

                      <div>
                        <label className="form-field-label">{t.specialtyLabel}</label>
                        <input 
                          type="text" 
                          value={formData.specialty} 
                          onInput={(e) => setFormData({ ...formData, specialty: e.target.value })}
                          className="form-input-field" 
                        />
                      </div>
                    </div>

                    <div className="checkboxes-wrapper-block">
                      <div className="custom-checkbox-row">
                        <input 
                          type="checkbox" 
                          id="profileIsActivist"
                          checked={formData.is_activist}
                          onChange={(e) => setFormData({ ...formData, is_activist: e.target.checked })}
                          className="custom-checkbox-input"
                        />
                        <label htmlFor="profileIsActivist" className="custom-checkbox-label">{t.activistLabel}</label>
                      </div>

                      {formData.is_activist && (
                        <div className="conditional-input-wrapper animate-slide-down">
                          <label className="form-field-label">{t.activistFieldLabel}</label>
                          <input 
                            type="text" 
                            required 
                            value={formData.field_of_activism} 
                            onInput={(e) => setFormData({ ...formData, field_of_activism: e.target.value })}
                            className="form-input-field" 
                          />
                        </div>
                      )}

                      <div className="custom-checkbox-row">
                        <input 
                          type="checkbox" 
                          id="profileIsResearcher"
                          checked={formData.is_researcher}
                          onChange={(e) => setFormData({ ...formData, is_researcher: e.target.checked })}
                          className="custom-checkbox-input"
                        />
                        <label htmlFor="profileIsResearcher" className="custom-checkbox-label">{t.researcherLabel}</label>
                      </div>

                      {formData.is_researcher && (
                        <div className="conditional-input-wrapper animate-slide-down">
                          <label className="form-field-label">{t.researcherFieldLabel}</label>
                          <input 
                            type="text" 
                            required 
                            value={formData.field_of_research} 
                            onInput={(e) => setFormData({ ...formData, field_of_research: e.target.value })}
                            className="form-input-field" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="form-submit-container">
                  <Button 
                    variant="gradient" 
                    type="submit" 
                    disabled={saving}
                    style={{ minWidth: '160px', padding: '12px 24px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      {saving && (
                        <div className="loading-spinner-el"></div>
                      )}
                      <span>{saving ? t.savingProfileBtn : t.saveProfileBtn}</span>
                    </div>
                  </Button>
                </div>
              </form>
            </GlassCard>
          </div>

        </div>

        {/* Section C: Learning Hub Card */}
        <div className="learning-hub-card-section">
          <GlassCard className="profile-glass-card lms-widget-card">
            <div className="lms-widget-header">
              <div className="lms-header-left">
                <svg className="lms-header-svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ color: '#15b47a', marginRight: isArabic ? '0' : '10px', marginLeft: isArabic ? '10px' : '0' }}>
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
                </svg>
                <h3 className="lms-widget-title">{t.learningHubTitle}</h3>
              </div>
              <Button 
                variant="gradient" 
                onClick={() => onNavigate('home', 'training')}
                style={{ fontSize: '13px', padding: '6px 16px' }}
              >
                {isArabic ? 'تصفح الدورات' : 'Browse Courses'}
              </Button>
            </div>
            
            <div className="lms-widget-body">
              <div className="lms-empty-state-container">
                <p className="lms-empty-text">{t.learningHubPlaceholder}</p>
              </div>
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
