/**
 * SEO & Meta Tags Manager
 * Dynamically updates document title, meta descriptions, Open Graph,
 * Twitter Cards, Canonical URLs, and JSON-LD Structured Data per route.
 */

export const SeoService = {
  defaultTitle: 'AnimeVerse - Premium Anime Discovery, Releases & Tracking',
  defaultDescription: 'Discover, track, and discuss thousands of anime series and movies. Real-time release calendar, seasonal simulcasts, and personal library powered by AniList.',
  baseUrl: window.location.origin + window.location.pathname,

  update({
    title,
    description,
    image,
    url,
    type = 'website',
    schemaJson = null
  } = {}) {
    const finalTitle = title ? `${title} | AnimeVerse` : this.defaultTitle;
    const finalDesc = description || this.defaultDescription;
    const finalUrl = url || window.location.href;
    const finalImage = image || `${window.location.origin}/cover-preview.jpg`;

    // 1. Update Title
    document.title = finalTitle;

    // 2. Update Standard Meta Description
    this.setMeta('description', finalDesc);

    // 3. Update Open Graph Tags
    this.setMeta('og:title', finalTitle, 'property');
    this.setMeta('og:description', finalDesc, 'property');
    this.setMeta('og:type', type, 'property');
    this.setMeta('og:url', finalUrl, 'property');
    this.setMeta('og:image', finalImage, 'property');
    this.setMeta('og:site_name', 'AnimeVerse', 'property');

    // 4. Update Twitter Card Tags
    this.setMeta('twitter:card', 'summary_large_image', 'name');
    this.setMeta('twitter:title', finalTitle, 'name');
    this.setMeta('twitter:description', finalDesc, 'name');
    this.setMeta('twitter:image', finalImage, 'name');

    // 5. Update Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', finalUrl);

    // 6. Update JSON-LD Structured Data
    let schemaScript = document.getElementById('seo-structured-data');
    if (schemaJson) {
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.id = 'seo-structured-data';
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schemaJson, null, 2);
    } else if (schemaScript) {
      // Default WebSite schema
      schemaScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'AnimeVerse',
        'url': finalUrl,
        'description': finalDesc,
        'potentialAction': {
          '@type': 'SearchAction',
          'target': `${finalUrl}#/browse?search={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      }, null, 2);
    }
  },

  setMeta(key, value, attr = 'name') {
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  }
};
