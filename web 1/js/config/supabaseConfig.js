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

const cleanUrl = (url) => {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
};

const getEnv = (key) => {
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  return null;
};

const DEFAULT_URL = cleanUrl(getEnv('NEXT_PUBLIC_SUPABASE_URL')) || 'https://ddjxbklfcqxslbbeymsr.supabase.co';
const DEFAULT_KEY = getEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 'sb_publishable_jIFgnjM1jPy1MbyDSSouxg_gvGPpKh2';

export const SUPABASE_CONFIG = {
  // Configured via environment variables or dynamic localStorage
  URL: cleanUrl(getStoredItem('animeverse_supabase_url')) || DEFAULT_URL,
  ANON_KEY: getStoredItem('animeverse_supabase_anon_key') || DEFAULT_KEY,

  isConfigured() {
    return (
      this.URL &&
      this.ANON_KEY &&
      !this.URL.includes('your-project') &&
      !this.URL.includes('PASTE YOUR') &&
      !this.ANON_KEY.includes('...')
    );
  },

  updateCredentials(url, anonKey) {
    const sanitized = cleanUrl(url);
    if (sanitized) setStoredItem('animeverse_supabase_url', sanitized);
    if (anonKey) setStoredItem('animeverse_supabase_anon_key', anonKey.trim());
    this.URL = sanitized || '';
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
    this.URL = DEFAULT_URL;
    this.ANON_KEY = DEFAULT_KEY;
  }
};
