/**
 * Home View - Verified YouTube Anime Hub
 * Exclusively displays anime verified to have legitimate, officially licensed
 * full episodes or complete series available on YouTube.
 * 
 * Supports global language filtering (All Languages, Telugu, Hindi, Tamil, English,
 * Japanese, Malayalam, Kannada, Bengali, Other) with persistent state.
 */

import { AnimeService } from '../services/animeService.js';
import { AnimeCard } from '../components/AnimeCard.js';
import { HeroSection } from '../components/HeroSection.js';
import { Skeletons } from '../components/Skeletons.js';
import { AdSlot } from '../components/AdSlot.js';
import { LanguageFilterService, SUPPORTED_LANGUAGES } from '../services/languageFilterService.js';
import { escapeHtml } from '../utils/stringUtils.js';

export const HomeView = {
  verifiedData: null,
  activeLanguage: 'ALL',

  async render(container) {
    this.activeLanguage = LanguageFilterService.getActiveLanguage();

    // 1. Initial fast skeleton layout
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
      // 2. Fetch enriched verified YouTube anime
      const data = await AnimeService.getVerifiedHomeAnime();
      this.verifiedData = data;

      const { all = [], trending = [], recentlyAdded = [], popular = [], total = 0 } = data;

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

      // Compute language distribution across all verified anime
      const langCounts = LanguageFilterService.getLanguageCounts(all);
      const activeLang = this.activeLanguage;

      // Filter verified lists by active language
      const filteredAll = LanguageFilterService.filterAnimeList(all, activeLang);
      const filteredTrending = LanguageFilterService.filterAnimeList(trending, activeLang);
      const filteredRecent = LanguageFilterService.filterAnimeList(recentlyAdded, activeLang);
      const filteredPopular = LanguageFilterService.filterAnimeList(popular, activeLang);

      // 3. Render full Home Page
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
                    <span class="verified-count-badge" id="verified-count-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff0000">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      <span id="verified-count-num">${filteredAll.length}</span> Verified ${activeLang !== 'ALL' ? `(${escapeHtml(activeLang)})` : ''}
                    </span>
                  </div>
                  <p class="section-subtitle">Full episodes and complete series officially published by verified channels</p>
                </div>
              </div>

              <!-- Language Controls on Home Page -->
              <div class="home-language-controls" style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                <!-- Full 10-Option Language Dropdown -->
                <div class="home-language-selector-wrap">
                  <label for="home-language-select" class="home-language-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    <span>Language:</span>
                  </label>
                  <select id="home-language-select" class="home-language-dropdown" aria-label="Filter by Language">
                    ${SUPPORTED_LANGUAGES.map(lang => {
                      const count = langCounts[lang.id] || 0;
                      return `
                        <option value="${lang.id}" ${activeLang === lang.id ? 'selected' : ''}>
                          ${lang.label} (${count})
                        </option>
                      `;
                    }).join('')}
                  </select>
                </div>

                <!-- Quick Filter Tabs -->
                <div class="verified-tabs" id="verified-tabs">
                  <button type="button" class="tab-btn ${activeLang === 'ALL' ? 'active' : ''}" data-lang="ALL">
                    All (${total})
                  </button>
                  ${(langCounts['Telugu'] > 0) ? `
                    <button type="button" class="tab-btn ${activeLang === 'Telugu' ? 'active' : ''}" data-lang="Telugu">
                      Telugu (${langCounts['Telugu']})
                    </button>
                  ` : ''}
                  ${(langCounts['Hindi'] > 0) ? `
                    <button type="button" class="tab-btn ${activeLang === 'Hindi' ? 'active' : ''}" data-lang="Hindi">
                      Hindi (${langCounts['Hindi']})
                    </button>
                  ` : ''}
                  ${(langCounts['English'] > 0) ? `
                    <button type="button" class="tab-btn ${activeLang === 'English' ? 'active' : ''}" data-lang="English">
                      English (${langCounts['English']})
                    </button>
                  ` : ''}
                  ${(langCounts['Japanese'] > 0) ? `
                    <button type="button" class="tab-btn ${activeLang === 'Japanese' ? 'active' : ''}" data-lang="Japanese">
                      Japanese (${langCounts['Japanese']})
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>

            <!-- Verified Grid Container -->
            <div id="verified-grid-wrapper">
              ${filteredAll.length > 0 ? `
                <div class="anime-grid" id="verified-grid">
                  ${filteredAll.slice(0, 16).map(anime => AnimeCard.render(anime, { isWatchable: true })).join('')}
                </div>
                ${filteredAll.length > 16 ? `
                  <div style="text-align: center; margin-top: 24px;">
                    <button type="button" class="btn-load-more" id="btn-load-all-verified">
                      Show All ${filteredAll.length} Verified Anime
                    </button>
                  </div>
                ` : ''}
              ` : `
                <div class="empty-language-state" style="text-align: center; padding: 48px 24px; background: rgba(18, 20, 31, 0.65); border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 16px; margin: 24px 0;">
                  <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(139, 92, 246, 0.12); color: var(--accent-purple-light); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  </div>
                  <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff; margin-bottom: 6px;">No verified anime available in this language yet.</h3>
                  <p style="color: var(--text-muted); font-size: 0.88rem; max-width: 440px; margin: 0 auto 16px; line-height: 1.5;">
                    We strictly index official licensed streams. New regional language releases will appear here as soon as verified by our distributors.
                  </p>
                  <button type="button" class="btn-primary btn-reset-home-lang" style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.84rem; padding: 8px 18px; border-radius: 9999px;">
                    Show All Languages
                  </button>
                </div>
              `}
            </div>
          </section>

          <!-- 3. TRENDING VERIFIED ANIME -->
          <section class="section-container" id="home-trending-section" style="margin-top: 40px; ${filteredTrending.length === 0 ? 'display: none;' : ''}">
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
            <div class="horizontal-scroll-row" id="home-trending-row">
              ${filteredTrending.slice(0, 12).map(anime => AnimeCard.render(anime, { isWatchable: true })).join('')}
            </div>
          </section>

          <!-- ADVERTISEMENT BANNER -->
          ${AdSlot.render('banner', 'home-ad-banner-middle')}

          <!-- 4. RECENTLY ADDED VERIFIED ANIME -->
          <section class="section-container" id="home-recent-section" style="margin-top: 40px; ${filteredRecent.length === 0 ? 'display: none;' : ''}">
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
            <div class="horizontal-scroll-row" id="home-recent-row">
              ${filteredRecent.slice(0, 12).map(anime => AnimeCard.render(anime, { isWatchable: true })).join('')}
            </div>
          </section>

          <!-- 5. POPULAR VERIFIED ANIME -->
          <section class="section-container" id="home-popular-section" style="margin-top: 40px; margin-bottom: 40px; ${filteredPopular.length === 0 ? 'display: none;' : ''}">
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
            <div class="anime-grid" id="home-popular-grid">
              ${filteredPopular.slice(0, 12).map(anime => AnimeCard.render(anime, { isWatchable: true })).join('')}
            </div>
          </section>
        </div>
      `;

      // 4. Bind hero interactive events
      HeroSection.bindEvents(container);

      // 5. Bind Language Controls
      this.bindLanguageEvents(container, data);

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

  /**
   * Binds dropdown and tab language switching events
   */
  bindLanguageEvents(container, data) {
    const { all = [], trending = [], recentlyAdded = [], popular = [], total = 0 } = data;
    const select = container.querySelector('#home-language-select');
    const tabsContainer = container.querySelector('#verified-tabs');
    const gridWrapper = container.querySelector('#verified-grid-wrapper');
    const countBadgeNum = container.querySelector('#verified-count-num');
    const countBadge = container.querySelector('#verified-count-badge');

    const trendingSec = container.querySelector('#home-trending-section');
    const trendingRow = container.querySelector('#home-trending-row');
    const recentSec = container.querySelector('#home-recent-section');
    const recentRow = container.querySelector('#home-recent-row');
    const popularSec = container.querySelector('#home-popular-section');
    const popularGrid = container.querySelector('#home-popular-grid');

    const applyLanguage = (selectedLang) => {
      this.activeLanguage = LanguageFilterService.setActiveLanguage(selectedLang);

      // Synchronize dropdown
      if (select && select.value !== this.activeLanguage) {
        select.value = this.activeLanguage;
      }

      // Synchronize quick filter tabs
      if (tabsContainer) {
        tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
          const btnLang = btn.getAttribute('data-lang');
          if (btnLang === this.activeLanguage) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
      }

      // Filter lists
      const filtered = LanguageFilterService.filterAnimeList(all, this.activeLanguage);
      const filteredTrending = LanguageFilterService.filterAnimeList(trending, this.activeLanguage);
      const filteredRecent = LanguageFilterService.filterAnimeList(recentlyAdded, this.activeLanguage);
      const filteredPopular = LanguageFilterService.filterAnimeList(popular, this.activeLanguage);

      // Update count badge
      if (countBadge) {
        countBadge.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff0000">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <span id="verified-count-num">${filtered.length}</span> Verified ${this.activeLanguage !== 'ALL' ? `(${this.activeLanguage})` : ''}
        `;
      }

      // Render verified catalog grid or required empty state
      if (gridWrapper) {
        if (filtered.length === 0) {
          gridWrapper.innerHTML = `
            <div class="empty-language-state" style="text-align: center; padding: 48px 24px; background: rgba(18, 20, 31, 0.65); border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 16px; margin: 24px 0;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(139, 92, 246, 0.12); color: var(--accent-purple-light); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </div>
              <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff; margin-bottom: 6px;">No verified anime available in this language yet.</h3>
              <p style="color: var(--text-muted); font-size: 0.88rem; max-width: 440px; margin: 0 auto 16px; line-height: 1.5;">
                We strictly index official licensed streams. New regional language releases will appear here as soon as verified by our distributors.
              </p>
              <button type="button" class="btn-primary btn-reset-home-lang" style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.84rem; padding: 8px 18px; border-radius: 9999px;">
                Show All Languages
              </button>
            </div>
          `;
          const resetBtn = gridWrapper.querySelector('.btn-reset-home-lang');
          if (resetBtn) {
            resetBtn.onclick = () => applyLanguage('ALL');
          }
        } else {
          gridWrapper.innerHTML = `
            <div class="anime-grid" id="verified-grid">
              ${filtered.slice(0, 16).map(anime => AnimeCard.render(anime, { isWatchable: true })).join('')}
            </div>
            ${filtered.length > 16 ? `
              <div style="text-align: center; margin-top: 24px;">
                <button type="button" class="btn-load-more" id="btn-load-all-verified">
                  Show All ${filtered.length} Verified Anime
                </button>
              </div>
            ` : ''}
          `;

          const loadMoreBtn = gridWrapper.querySelector('#btn-load-all-verified');
          if (loadMoreBtn) {
            loadMoreBtn.onclick = () => {
              const grid = gridWrapper.querySelector('#verified-grid');
              if (grid) {
                grid.innerHTML = filtered.map(anime => AnimeCard.render(anime, { isWatchable: true })).join('');
                loadMoreBtn.style.display = 'none';
              }
            };
          }
        }
      }

      // Update secondary sections
      if (trendingSec && trendingRow) {
        if (filteredTrending.length === 0) {
          trendingSec.style.display = 'none';
        } else {
          trendingSec.style.display = 'block';
          trendingRow.innerHTML = filteredTrending.slice(0, 12).map(anime => AnimeCard.render(anime, { isWatchable: true })).join('');
        }
      }

      if (recentSec && recentRow) {
        if (filteredRecent.length === 0) {
          recentSec.style.display = 'none';
        } else {
          recentSec.style.display = 'block';
          recentRow.innerHTML = filteredRecent.slice(0, 12).map(anime => AnimeCard.render(anime, { isWatchable: true })).join('');
        }
      }

      if (popularSec && popularGrid) {
        if (filteredPopular.length === 0) {
          popularSec.style.display = 'none';
        } else {
          popularSec.style.display = 'block';
          popularGrid.innerHTML = filteredPopular.slice(0, 12).map(anime => AnimeCard.render(anime, { isWatchable: true })).join('');
        }
      }
    };

    // Dropdown change listener
    if (select) {
      select.addEventListener('change', (e) => {
        applyLanguage(e.target.value);
      });
    }

    // Quick filter tab click listener
    if (tabsContainer) {
      tabsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        const lang = btn.getAttribute('data-lang');
        if (lang) {
          applyLanguage(lang);
        }
      });
    }

    // Wire initial Show All button if present
    const loadMoreBtn = container.querySelector('#btn-load-all-verified');
    if (loadMoreBtn) {
      loadMoreBtn.onclick = () => {
        const grid = container.querySelector('#verified-grid');
        const filtered = LanguageFilterService.filterAnimeList(all, this.activeLanguage);
        if (grid) {
          grid.innerHTML = filtered.map(anime => AnimeCard.render(anime, { isWatchable: true })).join('');
          loadMoreBtn.style.display = 'none';
        }
      };
    }
  }
};
