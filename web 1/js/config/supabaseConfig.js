/**
 * Supabase Configuration
 * Users can define their Supabase credentials here or configure them via the UI.
 * IMPORTANT: NEVER use service_role or secret keys here. Only use the public 'anon' key.
 */

const getStoredItem = (key) => {
  if (typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return null;
};

const setStoredItem = (key, val) => {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, val);
    } catch {
      // ignore
    }
  }
};

export const SUPABASE_CONFIG = {
  // Replace these with your Supabase Project details from Project Settings > API
  URL: getStoredItem('animeverse_supabase_url') || 'https://your-project.supabase.co',
  ANON_KEY: getStoredItem('animeverse_supabase_anon_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',

  isConfigured() {
    return (
      this.URL &&
      this.ANON_KEY &&
      !this.URL.includes('your-project') &&
      !this.ANON_KEY.includes('...')
    );
  },

  updateCredentials(url, anonKey) {
    if (url) setStoredItem('animeverse_supabase_url', url.trim());
    if (anonKey) setStoredItem('animeverse_supabase_anon_key', anonKey.trim());
    this.URL = url ? url.trim() : '';
    this.ANON_KEY = anonKey ? anonKey.trim() : '';
  },

  setCredentials(url, anonKey) {
    this.updateCredentials(url, anonKey);
  },

  clear() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('animeverse_supabase_url');
        localStorage.removeItem('animeverse_supabase_anon_key');
      } catch {
        // ignore
      }
    }
    this.URL = 'https://your-project.supabase.co';
    this.ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
  }
};
