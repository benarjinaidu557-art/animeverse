/**
 * AnimeVerse Environment Loader
 * Exposes public environment variables to client-side scripts.
 * In production/Vercel, these match NEXT_PUBLIC_* variables.
 */
window.ENV = window.ENV || {
  NEXT_PUBLIC_SUPABASE_URL: "https://ddjxbklfcqxslbbeymsr.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_jIFgnjM1jPy1MbyDSSouxg_gvGPpKh2"
};

// Safe Global HTML String Escaper (available immediately to all scripts & modules)
window.escapeHtml = window.escapeHtml || function(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
window.escapeHTML = window.escapeHtml;
window.escape_html = window.escapeHtml;

