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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [devAdminMode, setDevAdminMode] = useState(false);

  const verifyAndSetDevAdmin = async () => {
    setDevAdminMode(true);
    return true;
  };

  // Helper to fetch profile and update online status
  const fetchProfileAndSetOnline = async (userId) => {
    try {
      const profile = await authService.getUserProfile(userId);
      setUserProfile(profile);
      
      // Update status to online: true in the database
      await authService.updateOnlineStatus(userId, true);
    } catch (err) {
      console.error('Error fetching profile or setting online status:', err);
    }
  };

  useEffect(() => {
    let active = true;

    // 1. Check current session on load
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
        if (active) {
          setError(err.message || 'Error initializing auth');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      
      const currentUser = session?.user ?? null;
      const prevUser = user;
      
      setUser(currentUser);
      setAccessToken(session?.access_token ?? null);
      
      if (currentUser) {
        await fetchProfileAndSetOnline(currentUser.id);
      } else {
        setUserProfile(null);
        // If there was a user logged in, mark them offline
        if (prevUser) {
          try {
            await authService.updateOnlineStatus(prevUser.id, false);
          } catch (err) {
            console.error('Failed to set previous user offline:', err);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
