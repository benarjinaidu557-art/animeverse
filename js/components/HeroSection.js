/**
 * Hero Section Component - Verified YouTube Anime Hub
 * Features:
 * - Brand: AnimeVerse
 * - Title: "Discover Anime You Can Watch on YouTube"
 * - Interactive Search Bar
 * - "Browse Verified Anime" Action Button
 * - Fast, robust, responsive rendering without empty space
 */

export const HeroSection = {
  render(options = {}) {
    const verifiedCount = options.totalVerified || 90;
    const featuredAnime = options.featuredAnime || null;
    const banner = featuredAnime?.bannerImage || featuredAnime?.coverImage?.extraLarge || '';

    return `
      <section class="verified-hero" id="hero-section">
        ${banner ? `
          <div class="verified-hero-bg-wrap">
            <img 
              class="verified-hero-bg" 
              src="${banner}" 
              alt="AnimeVerse Featured"
              loading="lazy"
              onerror="this.style.display='none';"
            />
            <div class="verified-hero-overlay"></div>
          </div>
        ` : `
          <div class="verified-hero-bg-default"></div>
        `}

        <div class="verified-hero-content">
          <div class="verified-hero-pill">
            <span class="pulse-indicator"></span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff0000">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span>100% Legal • Official YouTube Streams</span>
          </div>

          <h1 class="verified-hero-title">AnimeVerse</h1>
          <h2 class="verified-hero-tagline">Discover Anime You Can Watch on YouTube</h2>
          <p class="verified-hero-desc">
            Stream full episodes legally and officially licensed from trusted distributors including Muse India, Muse Asia, Ani-One, and official studio channels.
          </p>

          <!-- Hero Search Bar -->
          <form class="hero-search-form" id="hero-search-form" role="search">
            <div class="hero-search-input-wrap">
              <svg class="hero-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                id="hero-search-input" 
                class="hero-search-input" 
                placeholder="Search verified anime (e.g. Attack on Titan, Fairy Tail, Spy x Family)..." 
                autocomplete="off"
                aria-label="Search verified anime"
              />
              <button type="submit" class="hero-search-btn" id="hero-search-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span>Search</span>
              </button>
            </div>
          </form>

          <!-- Hero Action Buttons -->
          <div class="verified-hero-actions">
            <a href="#verified-catalog-section" class="btn-browse-verified" id="btn-browse-verified-anime">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>Browse Verified Anime</span>
            </a>
            <span class="verified-hero-stat">
              <strong>${verifiedCount}+</strong> Verified Anime Series Available
            </span>
          </div>
        </div>
      </section>
    `;
  },

  bindEvents(container = document) {
    const searchForm = container.querySelector('#hero-search-form');
    const searchInput = container.querySelector('#hero-search-input');
    const browseBtn = container.querySelector('#btn-browse-verified-anime');

    if (searchForm && searchInput) {
      searchForm.onsubmit = (e) => {
        e.preventDefault();
        const query = (searchInput.value || '').trim();
        if (query) {
          window.router.navigate(`/browse?search=${encodeURIComponent(query)}&watchableOnly=true`);
        } else {
          const target = document.getElementById('verified-catalog-section');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      };
    }

    if (browseBtn) {
      browseBtn.onclick = (e) => {
        e.preventDefault();
        const target = document.getElementById('verified-catalog-section');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.router.navigate('/browse?watchableOnly=true');
        }
      };
    }
  }
};
