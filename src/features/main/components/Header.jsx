import { useState, useEffect } from 'preact/hooks'
import logo from '../../../assets/logo.svg'
import logoEn from '../../../assets/logo_en.svg'
import { useAuth, ROLE_PERMISSIONS } from '../../auth/hooks/useAuth'
import iconHome from '../../../assets/icon_home.svg'
import iconNews from '../../../assets/asset_3_news.svg'
import iconTraining from '../../../assets/icon_training.svg'
import iconResearch from '../../../assets/icon_research.svg'
import iconAbout from '../../../assets/icon_about.svg'
import iconOpportunities from '../../../assets/asset_2_opportunities.svg'
import iconSearch from '../../../assets/icon_search.svg'
import iconProfile from '../../../assets/icon_profile.svg'
import iconGlobe from '../../../assets/asset_1_globe.svg'
import iconCommunity from '../../../assets/icon_community.svg'
import { translations } from '../../../i18n/translations'

export function Header({ activeSection, currentView, onNavigate, user, userProfile, onLogout, lang, toggleLanguage }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showPermsList, setShowPermsList] = useState(false);
  const [permSearchQuery, setPermSearchQuery] = useState('');

  const { disabledPermissions, togglePermission, hasPermission } = useAuth();
  
  const t = translations[lang] || translations.ar;

  // Close dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showLangDropdown && !e.target.closest('.language-toggle-btn') && !e.target.closest('.lang-dropdown-menu')) {
        setShowLangDropdown(false);
      }
      if (showProfileDropdown && !e.target.closest('.user-profile-dropdown-container')) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showLangDropdown, showProfileDropdown]);

  return (
    <>
      <header class="figma-header">
        <div class="figma-header-container">
          
          {/* Left Side: Brand Logo */}
          <a 
            href="#home" 
            onClick={(e) => {
              e.preventDefault();
              onNavigate(currentView === 'newhome' ? 'newhome' : 'home', 'home');
            }}
            class="figma-logo-link"
          >
            <img src={lang === 'en' ? logoEn : logo} class="figma-logo-img" alt="كلايما ميدكس" />
          </a>

          {/* Center-Right: Navigation Items (RTL order) */}
          <nav class="figma-nav-menu">
            
            {/* Language Toggle with Dropdown */}
            <div style={{ position: 'relative', display: 'flex', alignSelf: 'center', alignItems: 'center' }}>
              <button 
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                class={`figma-nav-item language-toggle-btn ${showLangDropdown ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 8px', outline: 'none' }}
                title="Select Language / اختيار اللغة"
              >
                <img src={iconGlobe} class="figma-nav-icon" alt="Language" />
                <span class="figma-nav-text">{t.language}</span>
              </button>

              {showLangDropdown && (
                <div 
                  class="lang-dropdown-menu" 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translate(-50%, 0)',
                    marginTop: '12px',
                    background: '#0b2849',
                    border: '1.5px solid #15b47a',
                    borderRadius: '32px',
                    padding: '14px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 1000,
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  {/* AR Circle */}
                  <button
                    onClick={() => {
                      if (lang !== 'ar') toggleLanguage();
                      setShowLangDropdown(false);
                    }}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      border: lang === 'ar' ? '2px solid #15b47a' : '2px solid rgba(225, 239, 250, 0.25)',
                      background: lang === 'ar' ? '#15b47a' : 'transparent',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Tajawal, sans-serif',
                      outline: 'none'
                    }}
                    class="lang-circle-btn"
                  >
                    AR
                  </button>

                  {/* EN Circle */}
                  <button
                    onClick={() => {
                      if (lang !== 'en') toggleLanguage();
                      setShowLangDropdown(false);
                    }}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      border: lang === 'en' ? '2px solid #15b47a' : '2px solid rgba(225, 239, 250, 0.25)',
                      background: lang === 'en' ? '#15b47a' : 'transparent',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Tajawal, sans-serif',
                      outline: 'none'
                    }}
                    class="lang-circle-btn"
                  >
                    EN
                  </button>
                </div>
              )}
            </div>

            {/* Auth Item / User Profile Dropdown */}
            {user ? (
              <div 
                class="figma-nav-item user-profile-dropdown-container"
                style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                  <img 
                    src={userProfile?.avatar_url || iconProfile} 
                    onError={(e) => { e.target.onerror = null; e.target.src = iconProfile; e.target.style.border = 'none'; e.target.style.borderRadius = '0'; e.target.style.width = '34px'; e.target.style.height = '34px'; e.target.style.objectFit = 'contain'; }}
                    class="figma-nav-icon" 
                    alt="الملف الشخصي" 
                    style={userProfile?.avatar_url ? { 
                      borderRadius: '50%', 
                      width: '40px', 
                      height: '40px', 
                      objectFit: 'cover', 
                      border: '2px solid rgba(21, 180, 122, 0.4)' 
                    } : {
                      width: '32px', 
                      height: '32px',
                      objectFit: 'contain'
                    }}
                  />
                  <span style={{ 
                    position: 'absolute', 
                    bottom: '0px', 
                    right: '0px', 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    backgroundColor: '#15b47a', 
                    border: '2px solid #004c6d' 
                  }}></span>
                </div>
                <span class="figma-nav-text" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {t.myAccount}
                </span>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <div 
                    class="premium-profile-dropdown"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: lang === 'ar' ? '0' : 'auto',
                      left: lang === 'ar' ? 'auto' : '0',
                      marginTop: '12px',
                      width: '260px',
                      background: 'rgba(11, 40, 73, 0.98)',
                      backdropFilter: 'blur(16px)',
                      borderRadius: '16px',
                      border: '1px solid rgba(225, 239, 250, 0.15)',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                      padding: '16px',
                      zIndex: 1000,
                      textAlign: lang === 'ar' ? 'right' : 'left',
                      direction: lang === 'ar' ? 'rtl' : 'ltr',
                      color: '#ffffff'
                    }}
                  >
                    {/* User Info Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                      <img 
                        src={userProfile?.avatar_url || iconProfile} 
                        onError={(e) => { e.target.onerror = null; e.target.src = iconProfile; e.target.style.border = 'none'; e.target.style.borderRadius = '0'; e.target.style.width = '48px'; e.target.style.height = '48px'; e.target.style.objectFit = 'contain'; }}
                        style={userProfile?.avatar_url ? { 
                          width: '58px', 
                          height: '58px', 
                          borderRadius: '50%', 
                          objectFit: 'cover', 
                          border: '2px solid #15b47a' 
                        } : { 
                          width: '48px', 
                          height: '48px',
                          objectFit: 'contain'
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontWeight: 'bold', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#ffffff' }}>
                          {userProfile?.full_name || user.email.split('@')[0]}
                        </span>
                        <span style={{ fontSize: '12px', opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#E1EFFA' }}>
                          {user.email}
                        </span>
                      </div>
                    </div>

                    {/* Roles & Info tags */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                      {userProfile?.role === 'superadmin' ? (
                        <span style={{ 
                          backgroundColor: 'rgba(21, 180, 122, 0.2)', 
                          color: '#15b47a', 
                          padding: '4px 8px', 
                          borderRadius: '6px', 
                          fontSize: '11px',
                          fontWeight: 'bold',
                          border: '1px solid rgba(21, 180, 122, 0.3)'
                        }}>
                          {lang === 'ar' ? 'مسؤول خارق' : 'Super Admin'}
                        </span>
                      ) : userProfile?.role === 'admin' ? (
                        <span style={{ 
                          backgroundColor: 'rgba(21, 180, 122, 0.2)', 
                          color: '#15b47a', 
                          padding: '4px 8px', 
                          borderRadius: '6px', 
                          fontSize: '11px',
                          fontWeight: 'bold',
                          border: '1px solid rgba(21, 180, 122, 0.3)'
                        }}>
                          {lang === 'ar' ? 'مسؤول' : 'Admin'}
                        </span>
                      ) : (
                        <span style={{ 
                          backgroundColor: 'rgba(225, 239, 250, 0.1)', 
                          color: '#E1EFFA', 
                          padding: '4px 8px', 
                          borderRadius: '6px', 
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          {lang === 'ar' ? 'مستخدم' : 'Student / User'}
                        </span>
                      )}
                      {userProfile?.profession && (
                        <span style={{ 
                          backgroundColor: 'rgba(225, 239, 250, 0.05)', 
                          color: '#E1EFFA', 
                          padding: '4px 8px', 
                          borderRadius: '6px', 
                          fontSize: '11px'
                        }}>
                          {userProfile.profession}
                        </span>
                      )}
                    </div>
                    <div style={{ borderBottom: '1px solid rgba(225, 239, 250, 0.1)', marginBottom: '12px' }}></div>

                    {/* Permissions Collapsible Dropdown (Superadmins only) */}
                    {userProfile?.role === 'superadmin' && (
                      <div style={{ marginBottom: '12px' }}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPermsList(!showPermsList);
                          }}
                          style={{
                            width: '100%',
                            background: 'rgba(225, 239, 250, 0.05)',
                            border: '1px solid rgba(225, 239, 250, 0.1)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            color: '#E1EFFA',
                            fontSize: '12.5px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            outline: 'none',
                            fontFamily: lang === 'ar' ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
                          }}
                        >
                          <span>{lang === 'ar' ? 'صلاحيات الحساب النشطة' : 'Active Account Permissions'}</span>
                          <span style={{ 
                            fontSize: '10px', 
                            transform: showPermsList ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            marginLeft: lang === 'ar' ? '0' : '6px',
                            marginRight: lang === 'ar' ? '6px' : '0'
                          }}>▼</span>
                        </button>
                        
                        {showPermsList && (
                          <div style={{
                            marginTop: '6px',
                            background: 'rgba(5, 12, 26, 0.4)',
                            border: '1px solid rgba(225, 239, 250, 0.08)',
                            borderRadius: '8px',
                            maxHeight: '180px',
                            overflowY: 'auto',
                            padding: '8px 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}>
                            <input
                              type="text"
                              placeholder={lang === 'ar' ? 'بحث في الصلاحيات...' : 'Search permissions...'}
                              value={permSearchQuery}
                              onInput={(e) => setPermSearchQuery(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid rgba(225, 239, 250, 0.2)',
                                background: 'rgba(5, 12, 26, 0.6)',
                                color: '#ffffff',
                                fontSize: '12px',
                                outline: 'none',
                                marginBottom: '4px',
                                fontFamily: 'Tajawal, sans-serif'
                              }}
                            />
                            {ROLE_PERMISSIONS.superadmin.filter(perm => perm.toLowerCase().includes(permSearchQuery.toLowerCase())).map(perm => {
                              const isDisabled = disabledPermissions?.includes(perm);
                              return (
                                <div 
                                  key={perm}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePermission(perm);
                                  }}
                                  style={{
                                    fontSize: '12px',
                                    color: isDisabled ? '#94a3b8' : '#15b47a',
                                    background: isDisabled ? 'rgba(148, 163, 184, 0.08)' : 'rgba(21, 180, 122, 0.1)',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    fontFamily: 'monospace',
                                    textAlign: 'left',
                                    direction: 'ltr',
                                    lineHeight: '1.4',
                                    border: isDisabled ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid rgba(21, 180, 122, 0.2)',
                                    cursor: 'pointer',
                                    textDecoration: isDisabled ? 'line-through' : 'none',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    userSelect: 'none',
                                    transition: 'all 0.15s ease'
                                  }}
                                  title={perm}
                                >
                                  <span>
                                    {permSearchQuery ? (
                                      perm.split(new RegExp(`(${permSearchQuery})`, 'gi')).map((part, i) => 
                                        part.toLowerCase() === permSearchQuery.toLowerCase() ? 
                                          <mark key={i} style={{ backgroundColor: '#ffffff', color: '#0b2849', borderRadius: '2px', padding: '0 2px', fontWeight: 'bold' }}>{part}</mark> 
                                          : part
                                      )
                                    ) : perm}
                                  </span>
                                  <span style={{ fontSize: '10px', opacity: 0.7 }}>
                                    {isDisabled ? (lang === 'ar' ? 'معطلة' : 'Disabled') : '✓'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <a 
                        href="#profile"
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate('profile');
                          setShowProfileDropdown(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          color: '#E1EFFA',
                          textDecoration: 'none',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          background: 'rgba(225, 239, 250, 0.05)',
                          border: '1px solid rgba(225, 239, 250, 0.1)',
                          transition: 'all 0.2s',
                          marginBottom: '4px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(21, 180, 122, 0.15)';
                          e.target.style.color = '#15b47a';
                          e.target.style.borderColor = 'rgba(21, 180, 122, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(225, 239, 250, 0.05)';
                          e.target.style.color = '#E1EFFA';
                          e.target.style.borderColor = 'rgba(225, 239, 250, 0.1)';
                        }}
                      >
                        {lang === 'ar' ? 'الملف الشخصي' : 'My Profile'}
                      </a>

                      {(userProfile?.role === 'admin' || userProfile?.role === 'superadmin') && (
                        <a 
                          href="#debug"
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate('debug');
                            setShowProfileDropdown(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            color: '#E1EFFA',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            background: 'rgba(225, 239, 250, 0.05)',
                            border: '1px solid rgba(225, 239, 250, 0.1)',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(21, 180, 122, 0.15)';
                            e.target.style.color = '#15b47a';
                            e.target.style.borderColor = 'rgba(21, 180, 122, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(225, 239, 250, 0.05)';
                            e.target.style.color = '#E1EFFA';
                            e.target.style.borderColor = 'rgba(225, 239, 250, 0.1)';
                          }}
                        >
                          {lang === 'ar' ? 'لوحة التحكم' : 'Control Panel'}
                        </a>
                      )}

                      {userProfile?.role === 'superadmin' && (
                        <a 
                          href="#admin-users"
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate('admin-users');
                            setShowProfileDropdown(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            color: '#ffffff',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            background: 'rgba(225, 239, 250, 0.05)',
                            border: '1px solid rgba(225, 239, 250, 0.1)',
                            transition: 'all 0.2s',
                            marginTop: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(21, 180, 122, 0.15)';
                            e.target.style.borderColor = 'rgba(21, 180, 122, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(225, 239, 250, 0.05)';
                            e.target.style.borderColor = 'rgba(225, 239, 250, 0.1)';
                          }}
                        >
                          {lang === 'ar' ? 'إدارة المستخدمين' : 'User Management'}
                        </a>
                      )}
                      
                      {(userProfile?.role === 'admin' || userProfile?.role === 'superadmin') && (
                        <a 
                          href="#admin-courses"
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate('admin-courses');
                            setShowProfileDropdown(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            color: '#ffffff',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            background: 'rgba(225, 239, 250, 0.05)',
                            border: '1px solid rgba(225, 239, 250, 0.1)',
                            transition: 'all 0.2s',
                            marginTop: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(16, 185, 129, 0.15)';
                            e.target.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(225, 239, 250, 0.05)';
                            e.target.style.borderColor = 'rgba(225, 239, 250, 0.1)';
                          }}
                        >
                          {lang === 'ar' ? 'منشئ المساقات' : 'Course Builder'}
                        </a>
                      )}

                      {hasPermission('manage:slider') && (
                        <a 
                          href="#admin-slider"
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate('admin-slider');
                            setShowProfileDropdown(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            color: '#ffffff',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            background: 'rgba(225, 239, 250, 0.05)',
                            border: '1px solid rgba(225, 239, 250, 0.1)',
                            transition: 'all 0.2s',
                            marginTop: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(234, 179, 8, 0.15)';
                            e.target.style.borderColor = 'rgba(234, 179, 8, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(225, 239, 250, 0.05)';
                            e.target.style.borderColor = 'rgba(225, 239, 250, 0.1)';
                          }}
                        >
                          {lang === 'ar' ? 'إدارة الرئيسية' : 'Slider Manager'}
                        </a>
                      )}
                      
                      {userProfile?.role === 'superadmin' && (
                        <a 
                          href="#admin-stats"
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate('admin-stats');
                            setShowProfileDropdown(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            color: '#ffffff',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            background: 'rgba(225, 239, 250, 0.05)',
                            border: '1px solid rgba(225, 239, 250, 0.1)',
                            transition: 'all 0.2s',
                            marginTop: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(59, 130, 246, 0.15)';
                            e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(225, 239, 250, 0.05)';
                            e.target.style.borderColor = 'rgba(225, 239, 250, 0.1)';
                          }}
                        >
                          {lang === 'ar' ? 'الإحصائيات' : 'Statistics'}
                        </a>
                      )}
                      
                      {userProfile?.role === 'superadmin' && (
                        <a 
                          href="#admin-certificates"
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate('admin-certificates');
                            setShowProfileDropdown(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            color: '#ffffff',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            background: 'rgba(225, 239, 250, 0.05)',
                            border: '1px solid rgba(225, 239, 250, 0.1)',
                            transition: 'all 0.2s',
                            marginTop: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(59, 130, 246, 0.15)';
                            e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(225, 239, 250, 0.05)';
                            e.target.style.borderColor = 'rgba(225, 239, 250, 0.1)';
                          }}
                        >
                          {lang === 'ar' ? 'تدقيق الشهادات' : 'Cert Audit'}
                        </a>
                      )}

                      <a 
                        href="#logout"
                        onClick={(e) => {
                          e.preventDefault();
                          onLogout();
                          setShowProfileDropdown(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          color: '#ff4d4d',
                          textDecoration: 'none',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          marginTop: '4px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(255, 77, 77, 0.1)'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        {t.logout}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <a 
                href="#auth" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('auth');
                }}
                class={`figma-nav-item ${currentView === 'auth' ? 'active' : ''}`}
              >
                <img src={iconProfile} class="figma-nav-icon" alt="دخول / Login" style={{ height: '32px', width: 'auto' }} />
                <span class="figma-nav-text">{t.login}</span>
              </a>
            )}


            {/* About Us */}
            <a 
              href="#about" 
              onClick={(e) => {
                e.preventDefault();
                onNavigate('about');
              }}
              class={`figma-nav-item ${currentView === 'about' ? 'active' : ''}`}
            >
              <img src={iconAbout} class="figma-nav-icon" alt="من نحن" />
              <span class="figma-nav-text">{t.about}</span>
            </a>

            {/* Community / Join Us */}
            <a 
              href="#join-us" 
              onClick={(e) => {
                e.preventDefault();
                onNavigate('join');
              }}
              class={`figma-nav-item ${currentView === 'join' ? 'active' : ''}`}
            >
              <img src={iconCommunity} class="figma-nav-icon" alt="انضم إلينا" />
              <span class="figma-nav-text">{t.joinUs}</span>
            </a>

            {/* Research */}
            <a 
              href="#research" 
              onClick={(e) => {
                e.preventDefault();
                onNavigate('research');
              }}
              class={`figma-nav-item ${currentView === 'research' ? 'active' : ''}`}
            >
              <img src={iconResearch} class="figma-nav-icon" alt="أبحاث" />
              <span class="figma-nav-text">{t.research}</span>
            </a>

            {/* Opportunities */}
            <a 
              href="#opportunities" 
              onClick={(e) => {
                e.preventDefault();
                onNavigate('opportunities');
              }}
              class={`figma-nav-item ${currentView === 'opportunities' ? 'active' : ''}`}
            >
              <img src={iconOpportunities} class="figma-nav-icon" alt="الفرص" style={{ height: '26px', width: 'auto' }} />
              <span class="figma-nav-text">{t.opportunities}</span>
            </a>

            {/* News */}
            <a 
              href="#news" 
              onClick={(e) => {
                e.preventDefault();
                onNavigate('news');
              }}
              class={`figma-nav-item ${currentView === 'news' ? 'active' : ''}`}
            >
              <img src={iconNews} class="figma-nav-icon" alt="الأخبار" />
              <span class="figma-nav-text">{t.newsBlog}</span>
            </a>

            {/* Learning Hub / Training */}
            <a 
              href="#courses" 
              onClick={(e) => {
                e.preventDefault();
                onNavigate('courses');
              }}
              class={`figma-nav-item ${currentView === 'courses' ? 'active' : ''}`}
            >
              <img src={iconTraining} class="figma-nav-icon" alt="المركز التعليمي" style={{ height: '30px', width: 'auto' }} />
              <span class="figma-nav-text">{lang === 'ar' ? 'المركز التعليمي' : 'Learning Hub'}</span>
            </a>

            {/* Search Input Container */}
            <div class="figma-search-container">
              <input 
                type="text" 
                placeholder={t.search}
                value={searchQuery}
                onInput={(e) => setSearchQuery(e.target.value)}
                class="figma-search-input"
              />
              <img src={iconSearch} class="figma-search-icon" alt="بحث" />
            </div>

            {/* Home */}
            <a 
              href="#home" 
              onClick={(e) => {
                e.preventDefault();
                onNavigate(currentView === 'newhome' ? 'newhome' : 'home');
              }}
              class={`figma-nav-item ${(currentView === 'home' || currentView === 'newhome') ? 'active' : ''}`}
            >
              <img src={iconHome} class="figma-nav-icon" alt="الرئيسية" />
              <span class="figma-nav-text">{t.home}</span>
            </a>

          </nav>

          {/* Far Right: Hamburger Trigger — animates into X when open */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            class={`figma-hamburger-trigger ${drawerOpen ? 'is-open' : ''}`}
            aria-label="القائمة"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

        </div>
      </header>

      {/* Mobile Drawer */}
      <div class={`mobile-drawer ${drawerOpen ? 'open' : ''}`}>
        <nav class="drawer-nav">
          <div style={{ padding: '0 24px 16px', borderBottom: '1px solid rgba(225, 239, 250, 0.07)' }}>
            <div class="figma-search-container" style={{ width: '100%' }}>
              <input 
                type="text" 
                placeholder={t.search}
                value={searchQuery}
                onInput={(e) => setSearchQuery(e.target.value)}
                class="figma-search-input"
              />
              <img src={iconSearch} class="figma-search-icon" alt="بحث" />
            </div>
          </div>
          <a href="#lang" onClick={(e) => { e.preventDefault(); toggleLanguage(); setDrawerOpen(false); }} class="drawer-link" style={{ color: '#15b47a', fontWeight: 'bold' }}>
            {lang === 'ar' ? 'English (EN)' : 'العربية (AR)'}
          </a>
          {user ? (
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px', 
              padding: '16px', 
              marginBottom: '16px',
              border: '1px solid rgba(225, 239, 250, 0.15)',
              textAlign: lang === 'ar' ? 'right' : 'left',
              color: '#ffffff',
              direction: lang === 'ar' ? 'rtl' : 'ltr'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <img 
                  src={userProfile?.avatar_url || iconProfile} 
                  onError={(e) => { e.target.onerror = null; e.target.src = iconProfile; e.target.style.border = 'none'; e.target.style.borderRadius = '0'; e.target.style.width = '42px'; e.target.style.height = '42px'; e.target.style.objectFit = 'contain'; }}
                  style={userProfile?.avatar_url ? { 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '50%', 
                    objectFit: 'cover', 
                    border: '2px solid #15b47a' 
                  } : { 
                    width: '42px', 
                    height: '42px',
                    objectFit: 'contain'
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {userProfile?.full_name || user.email.split('@')[0]}
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(225, 239, 250, 0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </span>
                </div>
              </div>

              {/* Roles Badge & Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                {userProfile?.role === 'admin' ? (
                  <span style={{ backgroundColor: '#15b47a', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                    {lang === 'ar' ? 'مسؤول' : 'Admin'}
                  </span>
                ) : (
                  <span style={{ backgroundColor: 'rgba(225, 239, 250, 0.1)', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
                    {lang === 'ar' ? 'مستخدم' : 'Student'}
                  </span>
                )}

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <a 
                    href="#profile" 
                    onClick={(e) => { e.preventDefault(); onNavigate('profile'); setDrawerOpen(false); }} 
                    style={{ color: '#15b47a', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    {lang === 'ar' ? 'ملفي' : 'Profile'}
                  </a>
                  <span style={{ color: 'rgba(225, 239, 250, 0.2)', fontSize: '12px' }}>|</span>
                  {userProfile?.role === 'admin' && (
                    <>
                      <a 
                        href="#debug" 
                        onClick={(e) => { e.preventDefault(); onNavigate('debug'); setDrawerOpen(false); }} 
                        style={{ color: '#15b47a', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        {lang === 'ar' ? 'التحكم' : 'Control'}
                      </a>
                      <span style={{ color: 'rgba(225, 239, 250, 0.2)', fontSize: '12px' }}>|</span>
                    </>
                  )}
                  {userProfile?.role === 'superadmin' && (
                    <>
                      <a 
                        href="#admin-users" 
                        onClick={(e) => { e.preventDefault(); onNavigate('admin-users'); setDrawerOpen(false); }} 
                        style={{ color: '#15b47a', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        {lang === 'ar' ? 'المستخدمين' : 'Users'}
                      </a>
                      <span style={{ color: 'rgba(225, 239, 250, 0.2)', fontSize: '12px' }}>|</span>
                    </>
                  )}
                  {userProfile?.role === 'superadmin' && (
                    <>
                      <a 
                        href="#admin-stats" 
                        onClick={(e) => { e.preventDefault(); onNavigate('admin-stats'); setDrawerOpen(false); }} 
                        style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        {lang === 'ar' ? 'إحصائيات' : 'Stats'}
                      </a>
                      <span style={{ color: 'rgba(225, 239, 250, 0.2)', fontSize: '12px' }}>|</span>
                      </>
                  )}
                  {userProfile?.role === 'superadmin' && (
                    <>
                      <a 
                        href="#admin-certificates" 
                        onClick={(e) => { e.preventDefault(); onNavigate('admin-certificates'); setDrawerOpen(false); }} 
                        style={{ color: '#8b5cf6', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        {lang === 'ar' ? 'الشهادات' : 'Certs'}
                      </a>
                      <span style={{ color: 'rgba(225, 239, 250, 0.2)', fontSize: '12px' }}>|</span>
                    </>
                  )}
                  {(userProfile?.role === 'admin' || userProfile?.role === 'superadmin') && (
                    <>
                      <a 
                        href="#admin-courses" 
                        onClick={(e) => { e.preventDefault(); onNavigate('admin-courses'); setDrawerOpen(false); }} 
                        style={{ color: '#10b981', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        {lang === 'ar' ? 'منشئ المساقات' : 'Course Builder'}
                      </a>
                      <span style={{ color: 'rgba(225, 239, 250, 0.2)', fontSize: '12px' }}>|</span>
                    </>
                  )}
                  <a 
                    href="#logout" 
                    onClick={(e) => { e.preventDefault(); onLogout(); setDrawerOpen(false); }} 
                    style={{ color: '#ff4d4d', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    {t.logout}
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <a href="#auth" onClick={(e) => { e.preventDefault(); onNavigate('auth'); setDrawerOpen(false); }} class="drawer-link" style={{ color: '#15b47a' }}>{t.login}</a>
          )}
          <a href="#home" onClick={(e) => { e.preventDefault(); onNavigate(currentView === 'newhome' ? 'newhome' : 'home'); setDrawerOpen(false); }} class="drawer-link">{t.home}</a>
          <a href="#about" onClick={(e) => { e.preventDefault(); onNavigate('about'); setDrawerOpen(false); }} class="drawer-link">{t.about}</a>
          <a href="#learning-hub" onClick={(e) => { e.preventDefault(); onNavigate('courses'); setDrawerOpen(false); }} class="drawer-link">{lang === 'ar' ? 'المركز التعليمي' : 'Learning Hub'}</a>
          <a href="#research" onClick={(e) => { e.preventDefault(); onNavigate('research'); setDrawerOpen(false); }} class="drawer-link">{t.research}</a>
          <a href="#opportunities" onClick={(e) => { e.preventDefault(); onNavigate('opportunities'); setDrawerOpen(false); }} class="drawer-link">{t.opportunities}</a>
          <a href="#news" onClick={(e) => { e.preventDefault(); onNavigate('news'); setDrawerOpen(false); }} class="drawer-link">{t.newsBlog}</a>
          <a href="#join-us" onClick={(e) => { e.preventDefault(); onNavigate('join'); setDrawerOpen(false); }} class="drawer-link">{t.joinUs}</a>
        </nav>
      </div>
      <div onClick={() => setDrawerOpen(false)} class={`drawer-overlay ${drawerOpen ? 'open' : ''}`}></div>
    </>
  );
}
