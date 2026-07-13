import { supabase } from '../../../utils/supabaseClient';

export const authService = {
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
      try {
        await this.updateOnlineStatus(userId, false);
      } catch (err) {
        console.error('Failed to set online status to false on sign out:', err);
      }
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
   * Get the current user profile from the database
   */
  async getUserProfile(userId) {
    if (!userId) return null;
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

    return data;
  }
};
