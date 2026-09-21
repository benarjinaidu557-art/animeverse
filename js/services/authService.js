/**
 * Supabase Authentication & Profile Management Service
 */

import { getSupabaseClient } from './supabaseClient.js';

let currentUser = null;
let currentProfile = null;
const stateChangeSubscribers = new Set();

export const AuthService = {
  /**
   * Process Supabase OAuth callback (tokens, PKCE code, or OAuth errors)
   * Safely sets the user session, cleans browser URL, and returns clean target route.
   */
  async processOAuthCallback() {
    if (typeof window === 'undefined') return { isOAuth: false };

    const hash = window.location.hash || '';
    const search = window.location.search || '';

    // Quick verification: are OAuth parameters present anywhere in the URL?
    const hasOAuthParams =
      hash.includes('access_token=') ||
      hash.includes('refresh_token=') ||
      hash.includes('error=') ||
      search.includes('code=') ||
      search.includes('access_token=') ||
      search.includes('error=');

    if (!hasOAuthParams) {
      return { isOAuth: false };
    }

    const supabase = await getSupabaseClient();
    const params = new URLSearchParams();

    // 1. Extract search parameters (?code=... or ?error=... or ?access_token=...)
    if (search && search.startsWith('?')) {
      new URLSearchParams(search.slice(1)).forEach((v, k) => params.set(k, v));
    }

    // 2. Extract hash parameters (handles #/profile?access_token=..., #access_token=..., #/profile#access_token=...)
    if (hash && hash.startsWith('#')) {
      const rawHash = hash.slice(1);
      const qIndex = rawHash.indexOf('?');
      if (qIndex !== -1) {
        new URLSearchParams(rawHash.slice(qIndex + 1)).forEach((v, k) => params.set(k, v));
      }
      rawHash.split('#').forEach(part => {
        if (part.includes('=')) {
          const cleanPart = part.includes('?') ? part.slice(part.indexOf('?') + 1) : part;
          new URLSearchParams(cleanPart).forEach((v, k) => params.set(k, v));
        }
      });
    }

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const code = params.get('code');
    const error = params.get('error') || params.get('error_code');
    const errorDescription = params.get('error_description') || params.get('error_message');

    // Determine intended target route (default: /profile)
    let targetRoute = '/profile';
    if (hash.startsWith('#/dashboard')) targetRoute = '/dashboard';

    // Handle OAuth Error case
    if (error || errorDescription) {
      const cleanErrorMsg = decodeURIComponent(errorDescription || error || 'Google sign-in was not completed.');
      try {
        window.history.replaceState(null, '', window.location.pathname + '#/login');
      } catch {}

      return {
        isOAuth: true,
        success: false,
        error: cleanErrorMsg,
        targetRoute: '/login',
      };
    }

    // Handle OAuth Success case
    try {
      if (accessToken) {
        if (supabase?.auth?.setSession) {
          const { data, error: setErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (!setErr && data?.session) {
            currentUser = data.session.user;
            await this.fetchProfile();
          }
        }
      } else if (code) {
        if (supabase?.auth?.exchangeCodeForSession) {
          const { data, error: codeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (!codeErr && data?.session) {
            currentUser = data.session.user;
            await this.fetchProfile();
          }
        }
      }

      // If user not set yet, check session
      if (!currentUser && supabase?.auth?.getSession) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          currentUser = session.user;
          await this.fetchProfile();
        }
      }

      // Remove tokens completely from the browser address bar & history without reloading
      try {
        window.history.replaceState(null, '', window.location.pathname + '#' + targetRoute);
      } catch {}

      if (currentUser) {
        this.notifySubscribers('SIGNED_IN', { user: currentUser });
      }

      return {
        isOAuth: true,
        success: true,
        targetRoute,
      };
    } catch (err) {
      try {
        window.history.replaceState(null, '', window.location.pathname + '#/profile');
      } catch {}
      return {
        isOAuth: true,
        success: false,
        error: err.message,
        targetRoute: '/profile',
      };
    }
  },

  /**
   * Initialize auth state listener and process OAuth callback
   */
  async init() {
    const supabase = await getSupabaseClient();

    // 1. Subscribe to auth state updates
    supabase.auth.onAuthStateChange(async (event, session) => {
      currentUser = session?.user || null;
      if (currentUser) {
        await this.fetchProfile();
      } else {
        currentProfile = null;
      }
      this.notifySubscribers(event, session);
    });

    // 2. Process OAuth callback if present in URL
    await this.processOAuthCallback();

    // 3. Initial session check if not already resolved by OAuth
    if (!currentUser) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUser = session?.user || null;
      if (currentUser) {
        await this.fetchProfile();
      }
    }

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
