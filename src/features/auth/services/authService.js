import { supabase } from '../../../utils/supabaseClient';

// In-memory & session cache for Supabase user profiles and permission lookups
const _profileCache = new Map();

export const authService = {
  _profileCache,

  /**
   * Retrieve cached user profile if present and not expired
   */
  getCachedProfile(userId) {
    if (!userId) return null;
    const entry = _profileCache.get(userId);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      _profileCache.delete(userId);
      return null;
    }
    return entry.data;
  },

  /**
   * Cache user profile with TTL (default 5 minutes)
   */
  setCachedProfile(userId, profile, ttlMs = 5 * 60 * 1000) {
    if (!userId || !profile) return;
    _profileCache.set(userId, {
      data: profile,
      expiry: Date.now() + ttlMs,
      cachedAt: Date.now()
    });
  },

  /**
   * Clear cache for specific user or all users
   */
  clearProfileCache(userId) {
    if (userId) {
      _profileCache.delete(userId);
    } else {
      _profileCache.clear();
    }
  },

  /**
   * Sign up a new user with email and password
   */
  async signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: metadata, // OAuth metadata or additional fields
      },
    });
    if (error) throw error;
    return data;
  },

  /**
   * Sign in an existing user with email and password
   */
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    
    // Set online status to true
    if (data?.user) {
      await this.updateOnlineStatus(data.user.id, true);
    }
    return data;
  },

  /**
   * Sign in with OAuth providers (Google, Facebook, Apple, Twitter/X, etc.)
   */
  async signInWithOAuth(provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  },

  /**
   * Sign out the current user
   */
  async signOut(userId) {
    if (userId) {
      this.clearProfileCache(userId);
      try {
        await this.updateOnlineStatus(userId, false);
      } catch (err) {
        console.error('Failed to set online status to false on sign out:', err);
      }
    } else {
      this.clearProfileCache();
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Update the online status of a user in the profiles table
   */
  async updateOnlineStatus(userId, isOnline) {
    if (!userId) return;
    
    const updatePayload = {
      online: isOnline,
      last_seen: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);
    
    if (error) {
      console.error(`Error updating online status to ${isOnline}:`, error);
      throw error;
    }
    return data;
  },

  /**
   * Get the current user profile from the database, utilizing the cache when available
   */
  async getUserProfile(userId, { forceRefresh = false } = {}) {
    if (!userId) return null;

    if (!forceRefresh) {
      const cached = this.getCachedProfile(userId);
      if (cached) return cached;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;

    // Fetch custom permissions for this user
    try {
      const { data: permsData } = await supabase
        .from('user_permissions')
        .select('permissions(perm_key)')
        .eq('user_id', userId)
        .eq('is_granted', true);
        
      if (permsData) {
        data.custom_permissions = permsData
          .map(row => row.permissions?.perm_key)
          .filter(Boolean);
      } else {
        data.custom_permissions = [];
      }
    } catch (err) {
      console.error('Error fetching custom permissions:', err);
      data.custom_permissions = [];
    }

    // Cache the retrieved profile
    this.setCachedProfile(userId, data);

    return data;
  }
};
