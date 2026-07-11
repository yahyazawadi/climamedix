import { useState, useEffect, useMemo } from 'preact/hooks';
import { useAuth } from '../../auth/hooks/useAuth';
import { supabase } from '../../../utils/supabaseClient';
import { GlassCard } from '../../shared/components/GlassCard';
import { BarChart, Users, Globe, Briefcase, Activity, Shield, X, User, RefreshCw } from 'lucide-preact';
import './UserStatsDashboard.css';

const ROLE_COLORS = {
  superadmin: '#ef4444',
  admin: '#8b5cf6',
  educator: '#3b82f6',
  researcher: '#10b981',
  subscriber: '#f59e0b',
  user: '#64748b'
};

const BRAND_COLORS = ['#15b47a', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f43f5e', '#6366f1', '#14b8a6'];

export function UserStatsDashboard({ lang = 'ar' }) {
  const { hasPermission, loading: authLoading } = useAuth();
  const canViewStats = hasPermission('view:user_stats');

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedCategory, setSelectedCategory] = useState(null); // { type: 'role', value: 'admin', title: 'Admins' }

  const fetchProfiles = async () => {
    if (!canViewStats) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [canViewStats]);

  const stats = useMemo(() => {
    const total = profiles.length;
    const online = profiles.filter(p => p.online).length;
    
    const roles = {};
    const countries = {};
    const professions = {};

    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    let newSignups = 0;

    profiles.forEach(p => {
      roles[p.role] = (roles[p.role] || 0) + 1;
      
      const country = p.country || (lang === 'ar' ? 'غير محدد' : 'Unknown');
      countries[country] = (countries[country] || 0) + 1;
      
      const prof = p.profession || (lang === 'ar' ? 'غير محدد' : 'Unknown');
      professions[prof] = (professions[prof] || 0) + 1;
      
      if (new Date(p.created_at) >= thirtyDaysAgo) {
        newSignups++;
      }
    });

    // Sort arrays for rendering
    const rolesArr = Object.entries(roles).sort((a, b) => b[1] - a[1]);
    const countriesArr = Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const profsArr = Object.entries(professions).sort((a, b) => b[1] - a[1]).slice(0, 8);

    // Calculate conic gradient for Donut Chart
    let currentDegree = 0;
    const donutSlices = rolesArr.map(([role, count]) => {
      const percentage = (count / total) * 100;
      const start = currentDegree;
      const end = currentDegree + percentage;
      currentDegree = end;
      return `${ROLE_COLORS[role] || '#ccc'} ${start}% ${end}%`;
    });
    const donutGradient = `conic-gradient(${donutSlices.join(', ')})`;

    return { total, online, rolesArr, countriesArr, profsArr, newSignups, donutGradient };
  }, [profiles, lang]);

  const handleCategoryClick = (type, value, title) => {
    setSelectedCategory({ type, value, title });
  };

  const modalUsers = useMemo(() => {
    if (!selectedCategory) return [];
    return profiles.filter(p => {
      if (selectedCategory.type === 'role') return p.role === selectedCategory.value;
      if (selectedCategory.type === 'online') return p.online === selectedCategory.value;
      if (selectedCategory.type === 'country') {
        const c = p.country || (lang === 'ar' ? 'غير محدد' : 'Unknown');
        return c === selectedCategory.value;
      }
      if (selectedCategory.type === 'profession') {
        const pr = p.profession || (lang === 'ar' ? 'غير محدد' : 'Unknown');
        return pr === selectedCategory.value;
      }
      return false;
    });
  }, [selectedCategory, profiles, lang]);

  if (authLoading) {
    return (
      <div className="admin-unauthorized">
        <div style={{ fontSize: '14px', opacity: 0.6 }}>{lang === 'ar' ? 'جاري التحقق من الصلاحيات...' : 'Verifying permissions...'}</div>
      </div>
    );
  }

  if (!canViewStats) {
    return (
      <div className="admin-unauthorized">
        <h2>{lang === 'ar' ? 'غير مصرح لك بعرض الإحصائيات' : 'Unauthorized to view stats'}</h2>
      </div>
    );
  }

  return (
    <div className={`user-stats-dashboard ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="usd-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="usd-title">
              <BarChart className="usd-title-icon" size={28} />
              {lang === 'ar' ? 'إحصائيات النظام' : 'System Statistics'}
            </h1>
            <p className="usd-subtitle">
              {lang === 'ar' ? 'نظرة شاملة على بيانات المستخدمين' : 'Comprehensive overview of user data'}
            </p>
          </div>
          <button 
            className="usd-refresh-btn" 
            onClick={fetchProfiles} 
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            {lang === 'ar' ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="usd-loading">{lang === 'ar' ? 'جاري تحميل الإحصائيات...' : 'Loading stats...'}</div>
      ) : (
        <div className="usd-content">
          {/* Top KPI Cards */}
          <div className="usd-kpi-grid">
            <GlassCard className="usd-kpi-card">
              <Users size={24} className="usd-kpi-icon text-primary" />
              <div className="usd-kpi-info">
                <h3>{lang === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}</h3>
                <p className="usd-kpi-value">{stats.total}</p>
              </div>
            </GlassCard>

            <GlassCard className="usd-kpi-card" onClick={() => handleCategoryClick('online', true, lang==='ar'?'المتصلون الآن':'Online Users')}>
              <Activity size={24} className="usd-kpi-icon text-success" />
              <div className="usd-kpi-info">
                <h3>{lang === 'ar' ? 'متصلون الآن' : 'Online Now'}</h3>
                <p className="usd-kpi-value">{stats.online}</p>
              </div>
            </GlassCard>

            <GlassCard className="usd-kpi-card">
              <BarChart size={24} className="usd-kpi-icon text-warning" />
              <div className="usd-kpi-info">
                <h3>{lang === 'ar' ? 'تسجيلات (آخر 30 يوم)' : 'Signups (Last 30 Days)'}</h3>
                <p className="usd-kpi-value">{stats.newSignups}</p>
              </div>
            </GlassCard>
          </div>

          <div className="usd-charts-grid">
            {/* Roles Breakdown - Donut Chart */}
            <GlassCard className="usd-chart-card">
              <h3 className="usd-chart-title">
                <Shield size={18} />
                {lang === 'ar' ? 'توزيع الأدوار' : 'Roles Distribution'}
              </h3>
              
              <div className="usd-donut-container">
                <div className="usd-donut-chart" style={{ background: stats.donutGradient }}>
                  <div className="usd-donut-hole">
                    <span>{stats.total}</span>
                    <small>{lang === 'ar' ? 'مستخدم' : 'Users'}</small>
                  </div>
                </div>
                
                <div className="usd-donut-legend">
                  {stats.rolesArr.map(([role, count]) => (
                    <div 
                      key={role} 
                      className="usd-legend-item interactive"
                      onClick={() => handleCategoryClick('role', role, `${lang === 'ar' ? 'أصحاب دور' : 'Users with role'}: ${role}`)}
                    >
                      <span className="usd-legend-color" style={{ backgroundColor: ROLE_COLORS[role] || '#ccc' }}></span>
                      <span className="usd-legend-label">{role}</span>
                      <span className="usd-legend-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Countries Breakdown - Horizontal Bars */}
            <GlassCard className="usd-chart-card">
              <h3 className="usd-chart-title">
                <Globe size={18} />
                {lang === 'ar' ? 'التوزيع الجغرافي' : 'Geographic Distribution'}
              </h3>
              <div className="usd-bar-list">
                {stats.countriesArr.map(([country, count], idx) => {
                  const percentage = Math.round((count / stats.total) * 100);
                  const color = BRAND_COLORS[idx % BRAND_COLORS.length];
                  return (
                    <div 
                      key={country} 
                      className="usd-bar-item interactive"
                      onClick={() => handleCategoryClick('country', country, `${lang === 'ar' ? 'مستخدمين من' : 'Users from'}: ${country}`)}
                    >
                      <div className="usd-bar-info">
                        <span className="usd-bar-label">{country}</span>
                        <span className="usd-bar-count">{count} ({percentage}%)</span>
                      </div>
                      <div className="usd-bar-track">
                        <div className="usd-bar-fill" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* Professions Breakdown - Horizontal Bars */}
            <GlassCard className="usd-chart-card">
              <h3 className="usd-chart-title">
                <Briefcase size={18} />
                {lang === 'ar' ? 'المهن' : 'Professions'}
              </h3>
              <div className="usd-bar-list">
                {stats.profsArr.map(([prof, count], idx) => {
                  const percentage = Math.round((count / stats.total) * 100);
                  const color = BRAND_COLORS[(idx + 4) % BRAND_COLORS.length];
                  return (
                    <div 
                      key={prof} 
                      className="usd-bar-item interactive"
                      onClick={() => handleCategoryClick('profession', prof, `${lang === 'ar' ? 'مهنة' : 'Profession'}: ${prof}`)}
                    >
                      <div className="usd-bar-info">
                        <span className="usd-bar-label">{prof}</span>
                        <span className="usd-bar-count">{count} ({percentage}%)</span>
                      </div>
                      <div className="usd-bar-track">
                        <div className="usd-bar-fill" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Users List Modal */}
      {selectedCategory && (
        <div className="usd-modal-overlay" onClick={() => setSelectedCategory(null)}>
          <GlassCard className="usd-modal-content" onClick={e => e.stopPropagation()}>
            <div className="usd-modal-header">
              <h3>{selectedCategory.title} <span>({modalUsers.length})</span></h3>
              <button className="usd-modal-close" onClick={() => setSelectedCategory(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="usd-modal-list">
              {modalUsers.length === 0 ? (
                <div className="usd-modal-empty">{lang === 'ar' ? 'لا يوجد مستخدمين' : 'No users found'}</div>
              ) : (
                modalUsers.map(u => (
                  <div key={u.id} className="usd-modal-user">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="avatar" className="usd-modal-avatar" />
                    ) : (
                      <div className="usd-modal-avatar-placeholder"><User size={16} /></div>
                    )}
                    <div className="usd-modal-user-info">
                      <div className="usd-modal-user-name">{u.full_name || (lang === 'ar' ? 'بدون اسم' : 'Unnamed')}</div>
                      <div className="usd-modal-user-email">{u.email}</div>
                    </div>
                    {selectedCategory.type !== 'role' && (
                      <span className={`umd-role-badge role-${u.role}`}>{u.role}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
