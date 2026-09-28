import { createContext } from 'preact';
import { useState, useEffect, useContext, useRef } from 'preact/hooks';
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
  user: ['view:public_content', 'view:free_content', 'apply:specialized_roles'],
  subscriber: ['view:public_content', 'view:free_content', 'view:all_courses', 'view:all_articles', 'view:all_research', 'apply:specialized_roles'],
  researcher: ['view:public_content', 'view:free_content', 'view:all_courses', 'view:all_articles', 'view:all_research', 'write:research', 'write:courses', 'write:articles'],
  educator: ['view:public_content', 'view:free_content', 'view:all_courses', 'view:all_articles', 'view:all_research', 'write:events', 'write:articles'],
  admin: [
    'view:public_content', 'view:free_content', 'view:all_courses', 'view:all_articles', 'view:all_research',
    'write:articles', 'manage:any_course', 'manage:courses', 'manage:any_article', 'manage:any_publication',
    'write:research', 'approve:users', 'issue:certs', 'review:posts', 'write:opportunities', 'manage:any_opportunity',
    'write:events', 'manage:any_event', 'write:courses', 'view:join_requests', 'edit:news_map', 'manage:slider'
  ],
  superadmin: [
    'view:public_content', 'view:free_content', 'view:all_courses', 'view:all_articles', 'view:all_research',
    'write:articles', 'manage:any_course', 'manage:courses', 'manage:any_article', 'manage:any_publication',
    'approve:users', 'issue:certs', 'review:posts', 'write:opportunities', 'manage:any_opportunity',
    'write:events', 'manage:any_event', 'write:courses', 'write:research', 'apply:specialized_roles',
    'manage:system', 'view:join_requests', 'edit:news_map', 'view:user_stats', 'manage:slider'
  ]
};

export const ALL_SYSTEM_PERMISSIONS = [
  'view:public_content',
  'view:free_content',
  'view:all_courses',
  'view:all_articles',
  'view:all_research',
  'apply:specialized_roles',
  'write:research',
  'write:courses',
  'write:articles',
  'write:events',
  'manage:any_course',
  'manage:courses',
  'manage:any_article',
  'manage:any_publication',
  'approve:users',
  'issue:certs',
  'review:posts',
  'write:opportunities',
  'manage:any_opportunity',
  'manage:any_event',
  'view:join_requests',
  'edit:news_map',
  'manage:slider',
  'manage:system',
  'view:user_stats'
];

export function evaluatePermission(perm, role, custom_permissions = [], disabledPermissions = []) {
  if (!perm) return true;
  const disabled = Array.isArray(disabledPermissions) ? disabledPermissions : [];
  if (disabled.includes(perm)) return false;

  // Public content is viewable by all users including unauthenticated guests
  if (perm === 'view:public_content') return true;

  // Support permission alias: manage:courses <-> manage:any_course
  const aliasedPerm = perm === 'manage:courses' ? 'manage:any_course' : (perm === 'manage:any_course' ? 'manage:courses' : null);
  if (aliasedPerm && disabled.includes(aliasedPerm)) return false;

  if (!role) return false;

  // Check custom specific permissions granted to the user via admin dashboard
  const custom = Array.isArray(custom_permissions) ? custom_permissions : [];
  if (custom.includes(perm) || (aliasedPerm && custom.includes(aliasedPerm))) {
    return true;
  }

  const rolePerms = (Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, role) && Array.isArray(ROLE_PERMISSIONS[role]))
    ? ROLE_PERMISSIONS[role]
    : ROLE_PERMISSIONS.user;
  return Boolean(rolePerms.includes(perm) || (aliasedPerm && rolePerms.includes(aliasedPerm)));
}

export function AuthProvider({ children, initialProfile = null, initialDevAdmin = false }) {
  const [user, setUser] = useState(initialProfile ? { id: initialProfile.id, email: initialProfile.email } : null);
  const [userProfile, setUserProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(!initialProfile);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [devAdminMode, setDevAdminMode] = useState(initialDevAdmin);
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
    const role = devAdminMode ? 'superadmin' : userProfile?.role;
    return evaluatePermission(perm, role, userProfile?.custom_permissions, disabledPermissions);
  };

  const verifyAndSetDevAdmin = async () => {
    setDevAdminMode(true);
    return true;
  };

  // Helper to fetch profile and update online status – robust retry with exponential backoff
  const fetchProfileAndSetOnline = async (userId, retries = 12) => {
    for (let i = 0; i < retries; i++) {
      try {
        const profile = await authService.getUserProfile(userId);
        setUserProfile(profile);
        await authService.updateOnlineStatus(userId, true);
        return; // success
      } catch (err) {
        console.warn(`Attempt ${i + 1} fetching profile failed. Retrying...`, err.message);
        if (i === retries - 1) {
          console.error('Final attempt failed to fetch profile or set online status:', err);
        } else {
          const delay = 500 * Math.pow(2, i); // exponential backoff: 500ms, 1s, 2s, 4s, ...
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  };

  // 👑 Robust single‑source‑of‑truth auth flow – init first, then subscribe
  const authSubRef = useRef(null);

  useEffect(() => {
    // 1️⃣ Initialise current session (runs once)
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setAccessToken(session?.access_token ?? null);
        if (currentUser) {
          await fetchProfileAndSetOnline(currentUser.id);
        }
      } catch (err) {
        setError(err.message || 'Error initializing auth');
      } finally {
        setLoading(false); // UI ready for first render
      }
    };

    const startListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          setAccessToken(session?.access_token ?? null);

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (currentUser) {
              await fetchProfileAndSetOnline(currentUser.id);
            }
          } else if (event === 'SIGNED_OUT') {
            const prevUserId = user?.id;
            setUserProfile(null);
            if (prevUserId) {
              authService.updateOnlineStatus(prevUserId, false).catch(err =>
                console.error('Failed to set user offline on sign out:', err)
              );
            }
          }
          setLoading(false);
        }
      );
      authSubRef.current = subscription;
    };

    // Run init, then only after it resolves start the listener
    init().then(startListener);

    // Cleanup on unmount
    return () => {
      if (authSubRef.current) {
        authSubRef.current.unsubscribe();
      }
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
    setDevAdminMode(false);
    setUser(null);
    setUserProfile(null);
    setDisabledPermissions([]);
    authService.clearProfileCache();
    try {
      localStorage.removeItem('disabled_permissions');
    } catch (e) {
      console.warn('Could not remove disabled_permissions from localStorage:', e);
    }
    setLoading(true);
    
    // Fire-and-forget backend signOut
    authService.signOut(user?.id).catch(e => 
      console.error('signOut cleanup error:', e)
    );
    
    setLoading(false);
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
    authLoading: loading,
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
