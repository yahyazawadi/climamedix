import { useState, useEffect, useMemo } from 'preact/hooks';
import { supabase } from '../../../utils/supabaseClient';
import { GlassCard } from '../../shared/components/GlassCard';
import { Button } from '../../shared/components/Button';
import { useAuth, ROLE_PERMISSIONS } from '../../auth/hooks/useAuth';
import { Search, Shield, User, ChevronDown, Check, X, RefreshCw } from 'lucide-preact';
import './UserManagementDashboard.css';

export function UserManagementDashboard({ lang = 'ar', onNavigate }) {
  const { hasPermission, user } = useAuth();
  const isSuperAdmin = hasPermission('manage:system');

  const [profiles, setProfiles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Panel state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userCustomPerms, setUserCustomPerms] = useState([]); // Array of perm_keys granted individually
  const [roleSearchTerm, setRoleSearchTerm] = useState('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  
  // Modified state for the selected user
  const [draftRole, setDraftRole] = useState('');
  const [draftCustomPerms, setDraftCustomPerms] = useState([]); // List of extra perm_keys
  const [saving, setSaving] = useState(false);

  const ROLES = ['user', 'subscriber', 'researcher', 'educator', 'admin', 'superadmin'];

  const fetchData = async () => {
    if (!isSuperAdmin) return;
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch permissions mapping
      const { data: permsData, error: permsError } = await supabase
        .from('permissions')
        .select('id, perm_key, description');
        
      if (permsError) throw permsError;
      setAllPermissions(permsData || []);

    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isSuperAdmin]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const s = searchTerm.toLowerCase();
      return (
        (p.full_name && p.full_name.toLowerCase().includes(s)) ||
        (p.email && p.email.toLowerCase().includes(s)) ||
        (p.role && p.role.toLowerCase().includes(s)) ||
        (p.profession && p.profession.toLowerCase().includes(s))
      );
    });
  }, [profiles, searchTerm]);

  const totalPages = pageSize === 'all' ? 1 : Math.ceil(filteredProfiles.length / pageSize);
  const paginatedProfiles = useMemo(() => {
    if (pageSize === 'all') return filteredProfiles;
    const start = (currentPage - 1) * pageSize;
    return filteredProfiles.slice(start, start + pageSize);
  }, [filteredProfiles, currentPage, pageSize]);

  const handleManageClick = async (profile) => {
    setSelectedUser(profile);
    setDraftRole(profile.role);
    setRoleSearchTerm('');
    setIsRoleDropdownOpen(false);
    
    // Fetch custom permissions for this user
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('permission_id, is_granted')
        .eq('user_id', profile.id);
        
      if (error) throw error;
      
      // Map permission_id back to perm_key
      const customPermsKeys = (data || [])
        .filter(dp => dp.is_granted)
        .map(dp => {
          const perm = allPermissions.find(p => p.id === dp.permission_id);
          return perm ? perm.perm_key : null;
        })
        .filter(Boolean);
        
      setUserCustomPerms(customPermsKeys);
      setDraftCustomPerms(customPermsKeys);
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      setUserCustomPerms([]);
      setDraftCustomPerms([]);
    }
  };

  const handleRoleSelect = (role) => {
    setDraftRole(role);
    setIsRoleDropdownOpen(false);
    setRoleSearchTerm('');
    // When role changes, we might want to clear custom perms that are now included, 
    // but for simplicity we let them overlap.
  };

  const toggleCustomPermission = (permKey) => {
    setDraftCustomPerms(prev => {
      if (prev.includes(permKey)) return prev.filter(k => k !== permKey);
      return [...prev, permKey];
    });
  };

  const handleSaveAccess = async () => {
    if (draftRole === 'superadmin' && selectedUser.role !== 'superadmin') {
      const emailConfirm = window.prompt(
        lang === 'ar' 
          ? `لترقية هذا المستخدم إلى "مسؤول خارق"، يرجى كتابة بريده الإلكتروني للتأكيد:\n${selectedUser.email}`
          : `To promote this user to Superadmin, please type their email to confirm:\n${selectedUser.email}`
      );
      if (emailConfirm !== selectedUser.email) {
        alert(lang === 'ar' ? 'البريد الإلكتروني غير متطابق. تم الإلغاء.' : 'Email does not match. Cancelled.');
        return;
      }
    }

    if (selectedUser.role === 'superadmin' && draftRole !== 'superadmin') {
      const emailConfirm = window.prompt(
        lang === 'ar' 
          ? `لتجريد هذا المستخدم من صلاحية "مسؤول خارق"، يرجى كتابة بريده الإلكتروني للتأكيد:\n${selectedUser.email}`
          : `To demote this Superadmin, please type their email to confirm:\n${selectedUser.email}`
      );
      if (emailConfirm !== selectedUser.email) {
        alert(lang === 'ar' ? 'البريد الإلكتروني غير متطابق. تم الإلغاء.' : 'Email does not match. Cancelled.');
        return;
      }
    }

    setSaving(true);
    try {
      // 1. Update Profile Role
      if (draftRole !== selectedUser.role) {
        // Warning: This requires an RPC or backend function in Supabase if RLS prevents admins from updating roles.
        // Assuming we have an RPC `update_user_role` or can update directly.
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: draftRole })
          .eq('id', selectedUser.id);
          
        if (roleError) throw roleError;
      }

      // 2. Update Custom Permissions (Simplify: Delete old, insert new)
      // Delete existing custom permissions for this user
      const { error: delError } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', selectedUser.id);
      
      if (delError) throw delError;

      // Insert new custom permissions
      if (draftCustomPerms.length > 0) {
        const inserts = draftCustomPerms.map(permKey => {
          const perm = allPermissions.find(p => p.perm_key === permKey);
          if (!perm) return null;
          return {
            user_id: selectedUser.id,
            permission_id: perm.id,
            is_granted: true
          };
        }).filter(Boolean);

        if (inserts.length > 0) {
          const { error: insError } = await supabase
            .from('user_permissions')
            .insert(inserts);
            
          if (insError) throw insError;
        }
      }

      // Update local state
      setProfiles(prev => prev.map(p => p.id === selectedUser.id ? { ...p, role: draftRole } : p));
      setSelectedUser(null);
      alert(lang === 'ar' ? 'تم حفظ الصلاحيات بنجاح' : 'Permissions saved successfully');
    } catch (err) {
      console.error('Save error:', err);
      alert(lang === 'ar' ? 'حدث خطأ أثناء الحفظ. (قد تحتاج لتخطي RLS)' : 'Error saving. (Might need RPC to bypass RLS)');
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="admin-unauthorized">
        <h2>{lang === 'ar' ? 'غير مصرح لك' : 'Unauthorized'}</h2>
      </div>
    );
  }

  // Calculate inherited permissions based on draftRole
  const inheritedPerms = draftRole === 'superadmin' 
    ? allPermissions.map(p => p.perm_key) // Superadmin has all
    : (ROLE_PERMISSIONS[draftRole] || []);

  const filteredRoles = ROLES.filter(r => r.toLowerCase().includes(roleSearchTerm.toLowerCase()));

  return (
    <div className={`user-management-dashboard ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="umd-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="umd-title">
              <Shield className="umd-title-icon" size={28} />
              {lang === 'ar' ? 'إدارة المستخدمين والصلاحيات' : 'User & Access Management'}
            </h1>
            <p className="umd-subtitle">
              {lang === 'ar' 
                ? 'التحكم الكامل في أدوار المستخدمين وصلاحياتهم الفردية' 
                : 'Full control over user roles and granular permissions'}
            </p>
          </div>
          <Button variant="outline" onClick={fetchData} disabled={loading} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            {lang === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="umd-layout">
        {/* Left/Main Column: User Table */}
        <GlassCard className="umd-table-card">
          <div className="umd-table-controls">
            <div className="umd-search-wrap">
              <Search size={18} className="umd-search-icon" />
              <input 
                type="text" 
                placeholder={lang === 'ar' ? 'ابحث بالاسم، البريد، أو الدور...' : 'Search by name, email, or role...'} 
                value={searchTerm}
                onInput={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="umd-search-input"
              />
            </div>
            
            <div className="umd-pagination-size">
              <label>{lang === 'ar' ? 'عرض:' : 'Show:'}</label>
              <select 
                value={pageSize} 
                onChange={(e) => { 
                  setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value)); 
                  setCurrentPage(1); 
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value="all">{lang === 'ar' ? 'الكل' : 'All'}</option>
              </select>
            </div>
          </div>

          <div className="umd-table-wrapper">
            {loading ? (
              <div className="umd-loading">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
            ) : (
              <table className="umd-table">
                <thead>
                  <tr>
                    <th>{lang === 'ar' ? 'المستخدم' : 'User'}</th>
                    <th>{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                    <th>{lang === 'ar' ? 'الدور' : 'Role'}</th>
                    <th>{lang === 'ar' ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="umd-no-results">
                        {lang === 'ar' ? 'لا توجد نتائج مطابقة' : 'No matching results'}
                      </td>
                    </tr>
                  ) : (
                    paginatedProfiles.map(profile => (
                      <tr key={profile.id} className={selectedUser?.id === profile.id ? 'umd-row-selected' : ''}>
                        <td>
                          <div className="umd-user-cell">
                            {profile.avatar_url ? (
                              <img src={profile.avatar_url} alt="avatar" className="umd-avatar" />
                            ) : (
                              <div className="umd-avatar-placeholder"><User size={16} /></div>
                            )}
                            <div>
                              <div className="umd-user-name">{profile.full_name || (lang === 'ar' ? 'بدون اسم' : 'Unnamed')}</div>
                              <div className="umd-user-prof">{profile.profession || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="umd-email-cell">{profile.email}</td>
                        <td>
                          <span className={`umd-role-badge role-${profile.role}`}>
                            {profile.role}
                          </span>
                        </td>
                        <td>
                          {profile.role === 'superadmin' ? (
                            <span style={{ fontSize: '12px', color: 'rgba(11,40,73,0.5)', fontWeight: 'bold' }}>
                              {lang === 'ar' ? 'محمي بالنظام' : 'System Protected'}
                            </span>
                          ) : (
                            <Button 
                              variant={selectedUser?.id === profile.id ? 'primary' : 'outline'}
                              onClick={() => handleManageClick(profile)}
                              className="umd-manage-btn"
                            >
                              {lang === 'ar' ? 'إدارة الوصول' : 'Manage Access'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {pageSize !== 'all' && totalPages > 1 && (
            <div className="umd-pagination">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)}
              >
                {lang === 'ar' ? 'السابق' : 'Prev'}
              </button>
              <span>{currentPage} / {totalPages}</span>
              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => p + 1)}
              >
                {lang === 'ar' ? 'التالي' : 'Next'}
              </button>
            </div>
          )}
        </GlassCard>

        {/* Right Column: IAM Panel */}
        {selectedUser && (
          <GlassCard className="umd-iam-panel">
            <div className="umd-iam-header">
              <h3>{lang === 'ar' ? 'تعديل صلاحيات' : 'Edit Permissions'}</h3>
              <p className="umd-iam-user-label">{selectedUser.full_name || selectedUser.email}</p>
            </div>

            {/* Base Role Quick Assign */}
            <div className="umd-role-assigner">
              <label className="umd-iam-label">{lang === 'ar' ? 'الدور الأساسي (Quick Assign)' : 'Base Role'}</label>
              <div className="umd-role-combobox">
                <div 
                  className="umd-role-select-trigger" 
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                >
                  <span className={`umd-role-badge role-${draftRole}`}>{draftRole}</span>
                  <ChevronDown size={16} />
                </div>
                
                {isRoleDropdownOpen && (
                  <div className="umd-role-dropdown">
                    <div className="umd-role-search">
                      <Search size={14} />
                      <input 
                        type="text" 
                        autoFocus
                        placeholder={lang === 'ar' ? 'ابحث عن دور...' : 'Search role...'} 
                        value={roleSearchTerm}
                        onInput={e => setRoleSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="umd-role-options">
                      {filteredRoles.map(role => (
                        <div 
                          key={role} 
                          className={`umd-role-option ${draftRole === role ? 'active' : ''}`}
                          onClick={() => handleRoleSelect(role)}
                        >
                          <span className={`umd-role-badge role-${role}`}>{role}</span>
                          {draftRole === role && <Check size={16} className="umd-check" />}
                        </div>
                      ))}
                      {filteredRoles.length === 0 && (
                        <div className="umd-role-option-empty">
                          {lang === 'ar' ? 'لا يوجد دور مطابق' : 'No role found'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Granular Permissions */}
            <div className="umd-permissions-section">
              <label className="umd-iam-label">
                {lang === 'ar' ? 'الصلاحيات الفردية (Granular Permissions)' : 'Granular Permissions'}
              </label>
              
              <div className="umd-permissions-grid">
                {allPermissions.map(perm => {
                  const isInherited = inheritedPerms.includes(perm.perm_key);
                  const isCustom = draftCustomPerms.includes(perm.perm_key);
                  const isGranted = isInherited || isCustom;
                  
                  return (
                    <div 
                      key={perm.perm_key} 
                      className={`umd-perm-card ${isGranted ? 'granted' : ''} ${isInherited ? 'inherited' : ''}`}
                      onClick={() => !isInherited && toggleCustomPermission(perm.perm_key)}
                    >
                      <div className="umd-perm-status">
                        {isGranted ? <Check size={14} /> : <X size={14} />}
                      </div>
                      <div className="umd-perm-info">
                        <span className="umd-perm-key">{perm.perm_key}</span>
                        {isInherited && <span className="umd-perm-inherited-tag">{lang === 'ar' ? 'مضمن' : 'Included'}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="umd-iam-actions">
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button variant="gradient" onClick={handleSaveAccess} disabled={saving}>
                {saving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ الصلاحيات' : 'Save Access')}
              </Button>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
