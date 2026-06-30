import { useState, useEffect, useMemo } from 'preact/hooks';
import { supabase } from '../../../utils/supabaseClient';
import { GlassCard } from '../../shared/components/GlassCard';
import { useAuth } from '../../auth/hooks/useAuth';
import { BarChart, Users, Globe, Briefcase, Activity, Shield } from 'lucide-preact';
import './UserStatsDashboard.css';

export function UserStatsDashboard({ lang = 'ar' }) {
  const { hasPermission } = useAuth();
  const canViewStats = hasPermission('view:user_stats');

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canViewStats) return;

    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');
        if (error) throw error;
        setProfiles(data || []);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, [canViewStats]);

  const stats = useMemo(() => {
    const total = profiles.length;
    const online = profiles.filter(p => p.online).length;
    
    // Roles breakdown
    const roles = {};
    // Countries breakdown
    const countries = {};
    // Professions breakdown
    const professions = {};

    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    let newSignups = 0;

    profiles.forEach(p => {
      // Role
      roles[p.role] = (roles[p.role] || 0) + 1;
      
      // Country
      const country = p.country || (lang === 'ar' ? 'غير محدد' : 'Unknown');
      countries[country] = (countries[country] || 0) + 1;
      
      // Profession
      const prof = p.profession || (lang === 'ar' ? 'غير محدد' : 'Unknown');
      professions[prof] = (professions[prof] || 0) + 1;
      
      // New signups
      if (new Date(p.created_at) >= thirtyDaysAgo) {
        newSignups++;
      }
    });

    return { total, online, roles, countries, professions, newSignups };
  }, [profiles, lang]);

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
        <h1 className="usd-title">
          <BarChart className="usd-title-icon" size={28} />
          {lang === 'ar' ? 'إحصائيات النظام' : 'System Statistics'}
        </h1>
        <p className="usd-subtitle">
          {lang === 'ar' ? 'نظرة شاملة على بيانات المستخدمين' : 'Comprehensive overview of user data'}
        </p>
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

            <GlassCard className="usd-kpi-card">
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
            {/* Roles Breakdown */}
            <GlassCard className="usd-chart-card">
              <h3 className="usd-chart-title">
                <Shield size={18} />
                {lang === 'ar' ? 'توزيع الأدوار' : 'Roles Distribution'}
              </h3>
              <div className="usd-list">
                {Object.entries(stats.roles).sort((a,b) => b[1] - a[1]).map(([role, count]) => (
                  <div key={role} className="usd-list-item">
                    <span className={`umd-role-badge role-${role}`}>{role}</span>
                    <span className="usd-list-count">{count}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Countries Breakdown */}
            <GlassCard className="usd-chart-card">
              <h3 className="usd-chart-title">
                <Globe size={18} />
                {lang === 'ar' ? 'التوزيع الجغرافي' : 'Geographic Distribution'}
              </h3>
              <div className="usd-list">
                {Object.entries(stats.countries).sort((a,b) => b[1] - a[1]).slice(0, 10).map(([country, count]) => (
                  <div key={country} className="usd-list-item">
                    <span className="usd-list-label">{country}</span>
                    <span className="usd-list-count">{count}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Professions Breakdown */}
            <GlassCard className="usd-chart-card">
              <h3 className="usd-chart-title">
                <Briefcase size={18} />
                {lang === 'ar' ? 'المهن' : 'Professions'}
              </h3>
              <div className="usd-list">
                {Object.entries(stats.professions).sort((a,b) => b[1] - a[1]).slice(0, 10).map(([prof, count]) => (
                  <div key={prof} className="usd-list-item">
                    <span className="usd-list-label">{prof}</span>
                    <span className="usd-list-count">{count}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
