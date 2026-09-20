/**
 * Supabase Authentication & Profile Management Service
 */

import { getSupabaseClient } from './supabaseClient.js';

let currentUser = null;
let currentProfile = null;
const stateChangeSubscribers = new Set();

export const AuthService = {
  /**
   * Initialize auth state listener
   */
  async init() {
    const supabase = await getSupabaseClient();
    
    // Initial session check
    const { data: { session } } = await supabase.auth.getSession();
    currentUser = session?.user || null;
    if (currentUser) {
      await this.fetchProfile();
    }

    // Subscribe to auth state updates
    supabase.auth.onAuthStateChange(async (event, session) => {
      currentUser = session?.user || null;
      if (currentUser) {
        await this.fetchProfile();
      } else {
        currentProfile = null;
      }
      this.notifySubscribers(event, session);
    });

    return currentUser;
  },

  subscribe(callback) {
    stateChangeSubscribers.add(callback);
    return () => stateChangeSubscribers.delete(callback);
  },

  notifySubscribers(event, session) {
    stateChangeSubscribers.forEach(cb => {
      try {
        cb(event, session, currentUser, currentProfile);
      } catch (e) {
        console.error('Auth subscriber error:', e);
      }
    });
  },

  getUser() {
    return currentUser;
  },

  isAuthenticated() {
    return !!currentUser;
  },

  async getProfile() {
    if (!currentUser) return null;
    if (currentProfile) return currentProfile;
    return await this.fetchProfile();
  },

  async fetchProfile() {
    if (!currentUser) return null;
    const supabase = await getSupabaseClient();

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Profile fetch warning:', error);
      }

      if (data) {
        currentProfile = data;
      } else {
        // Fallback default profile from user metadata
        currentProfile = {
          id: currentUser.id,
          username: currentUser.user_metadata?.username || currentUser.email.split('@')[0],
          avatar_url: currentUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${currentUser.id}`,
          created_at: currentUser.created_at || new Date().toISOString(),
        };
      }
      return currentProfile;
    } catch (e) {
      console.error('Fetch profile error:', e);
      return null;
    }
  },

  /**
   * Email/Password Sign Up
   */
  async signUp(email, password, username) {
    const supabase = await getSupabaseClient();
    const avatar = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(username || email)}`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
          avatar_url: avatar,
        }
      }
    });

    if (error) throw error;
    currentUser = data.user;
    await this.fetchProfile();
    return data;
  },

  /**
   * Email/Password Sign In
   */
  async signIn(email, password) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    currentUser = data.user;
    await this.fetchProfile();
    return data;
  },

  /**
   * Google OAuth Login
   */
  async signInWithGoogle() {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname + '#/profile',
      }
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign Out
   */
  async signOut() {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    currentUser = null;
    currentProfile = null;
    if (error) throw error;
  },

  /**
   * Update Profile Details (Username, Avatar URL)
   */
  async updateProfile({ username, avatar_url }) {
    if (!currentUser) throw new Error('You must be signed in to update your profile.');
    const supabase = await getSupabaseClient();

    const updates = {
      username: username?.trim(),
      avatar_url: avatar_url?.trim(),
      updated_at: new Date().toISOString(),
    };

    // Update in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', currentUser.id);

    if (profileError) {
      console.warn('Profiles update error, attempting insert/metadata sync:', profileError);
    }

    // Also update in auth user_metadata
    await supabase.auth.updateUser({
      data: updates,
    });

    currentProfile = { ...currentProfile, ...updates };
    this.notifySubscribers('PROFILE_UPDATED', { user: currentUser });
    return currentProfile;
  }
};
