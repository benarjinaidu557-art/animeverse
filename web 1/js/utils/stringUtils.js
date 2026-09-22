/**
 * AnimeVerse - String & HTML Utility Functions
 * Safe HTML escaping and sanitization helpers.
 */

/**
 * Escapes characters in a string to safe HTML entities to prevent XSS and rendering errors.
 * Handles null, undefined, numbers, and strings safely.
 * 
 * @param {any} str - Value to escape
 * @returns {string} Escaped HTML string
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Case and naming variations aliases for complete safety
export const escapeHTML = escapeHtml;
export const escape_html = escapeHtml;

// Attach to global window and globalThis objects for cross-context safety
if (typeof window !== 'undefined') {
  window.escapeHtml = escapeHtml;
  window.escapeHTML = escapeHtml;
  window.escape_html = escapeHtml;
}

if (typeof globalThis !== 'undefined') {
  globalThis.escapeHtml = escapeHtml;
  globalThis.escapeHTML = escapeHtml;
  globalThis.escape_html = escapeHtml;
}
