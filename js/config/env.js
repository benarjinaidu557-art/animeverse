/**
 * AnimeVerse Environment Loader
 * Exposes public environment variables to client-side scripts.
 * In production/Vercel, these match NEXT_PUBLIC_* variables.
 */
window.ENV = window.ENV || {
  NEXT_PUBLIC_SUPABASE_URL: "https://ddjxbklfcqxslbbeymsr.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_jIFgnjM1jPy1MbyDSSouxg_gvGPpKh2"
};
