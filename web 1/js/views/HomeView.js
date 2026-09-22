/**
 * Home View - Verified YouTube Anime Hub
 * Exclusively displays anime verified to have legitimate, officially licensed
 * full episodes or complete series available on YouTube.
 * 
 * Sections:
 * 1. Hero Section (AnimeVerse, Search Bar, Browse Verified Anime button)
 * 2. Verified YouTube Anime (Filterable grid with language tabs)
 * 3. Trending Verified Anime (Horizontal row sorted by trending)
 * 4. Recently Added Verified Anime (Horizontal row sorted by newest additions)
 * 5. Popular Verified Anime (Responsive grid sorted by popularity)
 */

import { AnimeService } from '../services/animeService.js';
import { AnimeCard } from '../components/AnimeCard.js';
import { HeroSection } from '../components/HeroSection.js';
import { Skeletons } from '../components/Skeletons.js';
import { AdSlot } from '../components/AdSlot.js';

export const HomeView = {
  currentTab: 'all',
  verifiedData: null,

  async render(container) {
    // 1. Initial fast skeleton layout - renders hero instantly so there's NO blank empty area
    container.innerHTML = `
      <div class="container" style="padding-top: 16px;">
        ${HeroSection.render({ totalVerified: 90 })}

        <!-- Verified YouTube Anime Section Skeleton -->
        <section class="section-container" id="verified-catalog-section" style="margin-top: 24px;">
          <div class="section-header">
            <div class="section-title-wrap">
              <span class="section-accent-bar" style="background: #ef4444;"></span>
              <div>
                <h2 class="section-title">Verified YouTube Anime</h2>
                <p class="section-subtitle">100% legal, officially licensed anime streaming for free on YouTube</p>
              </div>
            </div>
          </div>
          <div class="anime-grid">
            ${Skeletons.renderCardSkeletonGrid(8)}
          </div>
        </section>

        <!-- Trending Verified Skeleton -->
        <section class="section-container" style="margin-top: 24px;">
          <div class="section-header">
            <div class="section-title-wrap">
              <span class="section-accent-bar"></span>
              <div>
                <h2 class="section-title">Trending Verified Anime</h2>
                <p class="section-subtitle">Top trending anime streamable on official channels</p>
              </div>
            </div>
          </div>
          <div class="horizontal-scroll-row">
            ${Skeletons.renderCardSkeletonGrid(6)}
          </div>
        </section>
      </div>
    `;

    HeroSection.bindEvents(container);

    try {
      // 2. Fetch enriched verified YouTube anime (cached in memory)
      const data = await AnimeService.getVerifiedHomeAnime();
      this.verifiedData = data;

      const { all = [], trending = [], recentlyAdded = [], popular = [], total = 0 } = data;

      // Strict enforcement: if zero verified anime, display clean empty state
      if (total === 0 || all.length === 0) {
        container.innerHTML = `
          <div class="container" style="padding-top: 16px;">
            ${HeroSection.render({ totalVerified: 0 })}
            <div class="empty-verified-state" style="text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-subtle); margin: 32px 0;">
              <div class="state-icon" style="margin-bottom: 16px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="#ef4444">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 8px;">No verified YouTube anime available yet.</h3>
              <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto 20px;">
                We strictly curate 100% legal, officially licensed anime releases from verified YouTube distributors. Please check back soon.
              </p>
              <a href="#/browse" class="btn-primary" style="display: inline-flex; align-items: center; gap: 8px; width: fit-content; margin: 0 auto;">
                Explore AniList Catalog
              </a>
            </div>
          </div>
        `;
        HeroSection.bindEvents(container);
        return;
      }

      // Calculate language distribution for quick filter tabs
      const countHindi = all.filter(a => (a.verifiedSource?.language || '').toLowerCase().includes('hindi')).length;
      const countEnglish = all.filter(a => (a.verifiedSource?.language || '').toLowerCase().includes('english') || (a.verifiedSource?.language || '').toLowerCase().includes('sub')).length;
      const countTelugu = all.filter(a => (a.verifiedSource?.language || '').toLowerCase().includes('telugu')).length;

      // 3. Render full Home Page with the 5 verified sections
      container.innerHTML = `
        <div class="container" style="padding-top: 16px;">
          <!-- 1. HERO SECTION -->
          ${HeroSection.render({ totalVerified: total, featuredAnime: trending[0] || all[0] })}

          <!-- 2. VERIFIED YOUTUBE ANIME SECTION -->
          <section class="section-container" id="verified-catalog-section" style="margin-top: 32px;">
            <div class="section-header" style="flex-wrap: wrap; gap: 16px; align-items: flex-end;">
              <div class="section-title-wrap">
                <span class="section-accent-bar" style="background: #ef4444;"></span>
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <h2 class="section-title">Verified YouTube Anime</h2>
                    <span class="verified-count-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff0000">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      ${total} Verified
                    </span>
                  </div>
                  <p class="section-subtitle">Full episodes and complete series officially published by verified channels</p>
                </div>
              </div>

              <!-- Quick Language Filter Tabs -->
              <div class="verified-tabs" id="verified-tabs">
                <button type="button" class="tab-btn active" data-tab="all">
                  All (${total})
                </button>
                ${countHindi > 0 ? `
                  <button type="button" class="tab-btn" data-tab="hindi">
                    Hindi Dub (${countHindi})
                  </button>
                ` : ''}
                ${countEnglish > 0 ? `
                  <button type="button" class="tab-btn" data-tab="english">
                    English Sub (${countEnglish})
                  </button>
                ` : ''}
                ${countTelugu > 0 ? `
                  <button type="button" class="tab-btn" data-tab="telugu">
                    Telugu Dub (${countTelugu})
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Verified Grid Container -->
            <div class="anime-grid" id="verified-grid">
              ${all.slice(0, 16).map(anime => AnimeCard.render(anime, { isWatchable: true })).join('')}
            </div>

            ${all.length > 16 ? `
              <div style="text-align: center; margin-top: 24px;">
                <button type="button" class="btn-load-more" id="btn-load-all-verified">
                  Show All ${total} Verified Anime
                </button>
              </div>
            ` : ''}
          </section>

          <!-- 3. TRENDING VERIFIED ANIME -->
          <section class="section-container" style="margin-top: 40px;">
            <div class="section-header">
              <div class="section-title-wrap">
                <span class="section-accent-bar" style="background: var(--accent-gradient);"></span>
                <div>
                  <h2 class="section-title">Trending Verified Anime</h2>
                  <p class="section-subtitle">Most trending verified YouTube anime in the community</p>
                </div>
              </div>
              <a href="#/browse?sort=TRENDING_DESC&watchableOnly=true" class="btn-view-all">
                View All <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
            </div>
            <div class="horizontal-scroll-row">
              ${trending.slice(0, 12).map(anime => AnimeCard.render(anime, { isWatchable: true })).join('')}
            </div>
          </section>

          <!-- ADVERTISEMENT BANNER -->
          ${AdSlot.render('banner', 'home-ad-banner-middle')}

          <!-- 4. RECENTLY ADDED VERIFIED ANIME -->
          <section class="section-container" style="margin-top: 40px;">
            <div class="section-header">
              <div class="section-title-wrap">
                <span class="section-accent-bar" style="background: #10b981;"></span>
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <h2 class="section-title">Recently Added Verified Anime</h2>
                    <span style="background: #10b981; color: #000; font-size: 0.70rem; font-weight: 800; padding: 2px 7px; border-radius: 4px;">New Sources</span>
                  </div>
                  <p class="section-subtitle">Freshly added verified episodes and complete series</p>
                </div>
              </div>
              <a href="#/browse?watchableOnly=true" class="btn-view-all">
                View All <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
            </div>
            <div class="horizontal-scroll-row">
              ${recentlyAdded.slice(0, 12).map(anime => AnimeCard.render(anime, { isWatchable: true })).join('')}
            </div>
          </section>

          <!-- 5. POPULAR VERIFIED ANIME -->
          <section class="section-container" style="margin-top: 40px; margin-bottom: 40px;">
            <div class="section-header">
              <div class="section-title-wrap">
                <span class="section-accent-bar cyan"></span>
                <div>
                  <h2 class="section-title">Popular Verified Anime</h2>
                  <p class="section-subtitle">Highest rated and most popular verified YouTube anime</p>
                </div>
              </div>
              <a href="#/browse?sort=POPULARITY_DESC&watchableOnly=true" class="btn-view-all">
                View All <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
            </div>
            <div class="anime-grid">
              ${popular.slice(0, 12).map(anime => AnimeCard.render(anime, { isWatchable: true })).join('')}
            </div>
          </section>
        </div>
      `;

      // 4. Bind hero interactive events
      HeroSection.bindEvents(container);

      // 5. Bind Language Filter Tabs
      this.bindTabEvents(container, all);

      // 6. Bind Show All button
      const loadMoreBtn = container.querySelector('#btn-load-all-verified');
      if (loadMoreBtn) {
        loadMoreBtn.onclick = () => {
          const grid = container.querySelector('#verified-grid');
          if (grid) {
            grid.innerHTML = all.map(anime => AnimeCard.render(anime, { isWatchable: true })).join('');
            loadMoreBtn.style.display = 'none';
          }
        };
      }

    } catch (error) {
      console.error('[HomeView] Render error:', error);
      container.innerHTML = `
        <div class="container" style="padding-top: 32px;">
          ${HeroSection.render({ totalVerified: 90 })}
          <div class="error-state" style="margin-top: 24px;">
            <div class="state-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3 class="state-title">Unable to Load Verified Anime</h3>
            <p class="state-desc">${error.message || 'Please check your connection and try again.'}</p>
            <button type="button" class="btn-primary" onclick="window.router.refresh()">
              Retry
            </button>
          </div>
        </div>
      `;
      HeroSection.bindEvents(container);
    }
  },

  bindTabEvents(container, allList) {
    const tabsContainer = container.querySelector('#verified-tabs');
    const grid = container.querySelector('#verified-grid');
    if (!tabsContainer || !grid) return;

    tabsContainer.onclick = (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;

      const tab = btn.getAttribute('data-tab');
      tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      let filtered = allList;
      if (tab === 'hindi') {
        filtered = allList.filter(a => (a.verifiedSource?.language || '').toLowerCase().includes('hindi'));
      } else if (tab === 'english') {
        filtered = allList.filter(a => (a.verifiedSource?.language || '').toLowerCase().includes('english') || (a.verifiedSource?.language || '').toLowerCase().includes('sub'));
      } else if (tab === 'telugu') {
        filtered = allList.filter(a => (a.verifiedSource?.language || '').toLowerCase().includes('telugu'));
      }

      grid.innerHTML = filtered.map(anime => AnimeCard.render(anime, { isWatchable: true })).join('');

      const loadMoreBtn = container.querySelector('#btn-load-all-verified');
      if (loadMoreBtn) {
        loadMoreBtn.style.display = 'none';
      }
    };
  }
};
