import { createContext } from 'preact';
import { useState, useEffect, useContext } from 'preact/hooks';
import { supabase } from '../../../utils/supabaseClient';
import { authService } from '../services/authService';

const AuthContext = createContext({
  user: null,
  userProfile: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  signInWithOAuth: async () => {},
  signOut: async () => {},
});

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export const ROLE_PERMISSIONS = {
  user: ['view:free_content', 'apply:specialized_roles'],
  subscriber: ['view:free_content', 'view:all_courses', 'view:all_articles', 'view:all_research', 'apply:specialized_roles'],
  researcher: ['view:free_content', 'view:all_courses', 'view:all_articles', 'view:all_research', 'write:research', 'write:courses', 'write:articles'],
  educator: ['view:free_content', 'view:all_courses', 'view:all_articles', 'view:all_research', 'write:events', 'write:articles'],
  admin: [
    'view:free_content', 'view:all_courses', 'view:all_articles', 'view:all_research',
    'write:articles', 'manage:any_course', 'manage:any_article', 'manage:any_publication',
    'approve:users', 'issue:certs', 'review:posts', 'write:opportunities', 'manage:any_opportunity',
    'write:events', 'manage:any_event', 'write:courses', 'view:join_requests', 'edit:news_map'
  ],
  superadmin: [
    'view:free_content', 'view:all_courses', 'view:all_articles', 'view:all_research',
    'write:articles', 'manage:any_course', 'manage:any_article', 'manage:any_publication',
    'approve:users', 'issue:certs', 'review:posts', 'write:opportunities', 'manage:any_opportunity',
    'write:events', 'manage:any_event', 'write:courses', 'write:research', 'apply:specialized_roles',
    'manage:system', 'view:join_requests', 'edit:news_map', 'view:user_stats'
  ]
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [devAdminMode, setDevAdminMode] = useState(false);
  const [disabledPermissions, setDisabledPermissions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('disabled_permissions') || '[]');
    } catch (e) {
      return [];
    }
  });

  const togglePermission = (perm) => {
    setDisabledPermissions(prev => {
      const next = prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm];
      localStorage.setItem('disabled_permissions', JSON.stringify(next));
      return next;
    });
  };

  const hasPermission = (perm) => {
    if (disabledPermissions.includes(perm)) return false;
    const role = devAdminMode ? 'superadmin' : userProfile?.role;
    if (!role) return false;
    if (role === 'superadmin') return true;
    const rolePerms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;
    return rolePerms.includes(perm);
  };

  const verifyAndSetDevAdmin = async () => {
    setDevAdminMode(true);
    return true;
  };

  // Helper to fetch profile and update online status
  const fetchProfileAndSetOnline = async (userId, retries = 4) => {
    for (let i = 0; i < retries; i++) {
      try {
        const profile = await authService.getUserProfile(userId);
        setUserProfile(profile);
        
        // Update status to online: true in the database
        await authService.updateOnlineStatus(userId, true);
        return; // Success!
      } catch (err) {
        console.warn(`Attempt ${i + 1} fetching profile failed. Retrying...`, err.message);
        if (i === retries - 1) {
          console.error('Final attempt failed to fetch profile or set online status:', err);
        } else {
          // Wait 1 second before retrying (gives the DB trigger time to create the profile row)
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  };

  useEffect(() => {
    let active = true;
    // Lock to prevent initializeAuth and onAuthStateChange from racing to fetch the profile simultaneously
    let initDone = false;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setAccessToken(session?.access_token ?? null);

        if (currentUser) {
          await fetchProfileAndSetOnline(currentUser.id);
        }
      } catch (err) {
        if (active) setError(err.message || 'Error initializing auth');
      } finally {
        if (active) {
          initDone = true;
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // 2. Listen for auth changes — but ONLY act after initializeAuth has completed
    // to avoid the race condition where both run concurrently on OAuth redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setAccessToken(session?.access_token ?? null);

      if (currentUser) {
        // Wait for initializeAuth to finish before doing anything.
        // On normal login/OAuth, initDone will be false here; we wait.
        const waitForInit = () => new Promise(resolve => {
          if (initDone) return resolve();
          const interval = setInterval(() => {
            if (initDone || !active) {
              clearInterval(interval);
              resolve();
            }
          }, 50);
        });

        await waitForInit();
        if (!active) return;

        // Re-fetch profile on SIGNED_IN (handles OAuth return where profile may
        // not have been found in the first getSession call), and on TOKEN_REFRESHED.
        // INITIAL_SESSION is skipped because initializeAuth already handled it.
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchProfileAndSetOnline(currentUser.id);
        }
      } else {
        setUserProfile(null);
        if (event === 'SIGNED_OUT') {
          const prevUserId = user?.id;
          if (prevUserId) {
            authService.updateOnlineStatus(prevUserId, false).catch(err =>
              console.error('Failed to set user offline on sign out:', err)
            );
          }
        }
      }
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // 3. Handle page unload / visibility changes to set online = false
  useEffect(() => {
    const handleUnload = () => {
      if (user && accessToken) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseAnonKey) {
          const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`;
          
          const headers = {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          };
          
          const body = JSON.stringify({ 
            online: false,
            last_seen: new Date().toISOString()
          });
          
          // Use keepalive: true to ensure the network request executes even during unload/close
          fetch(url, {
            method: 'PATCH',
            headers,
            body,
            keepalive: true
          }).catch(err => console.error('Error on unload fetch:', err));
        }
      }
    };

    const handleVisibilityChange = () => {
      if (user) {
        if (document.visibilityState === 'hidden') {
          handleUnload();
        } else if (document.visibilityState === 'visible') {
          authService.updateOnlineStatus(user.id, true).catch(err => console.error(err));
        }
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, accessToken]);

  const signIn = async (email, password) => {
    setError(null);
    try {
      const data = await authService.signIn(email, password);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signUp = async (email, password, metadata = {}) => {
    setError(null);
    try {
      const data = await authService.signUp(email, password, metadata);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signInWithOAuth = async (provider) => {
    setError(null);
    try {
      const data = await authService.signInWithOAuth(provider);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      setDevAdminMode(false);
      await authService.signOut(user?.id);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    userProfile: userProfile ? {
      ...userProfile,
      role: devAdminMode ? 'superadmin' : userProfile.role
    } : (devAdminMode ? {
      role: 'superadmin',
      full_name: 'Developer Superadmin',
      email: 'dev@climamedix.local'
    } : null),
    loading,
    error,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    verifyAndSetDevAdmin,
    disabledPermissions,
    togglePermission,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
