/**
 * Browse & Discovery View - AnimeVerse
 * Complete search, multi-faceted filtering, sorting, 50-per-page batching,
 * and reliable infinite scroll / "Load More" powered by AniList GraphQL API.
 */

import { AnimeService } from '../services/animeService.js';
import { AnimeCard } from '../components/AnimeCard.js';
import { Skeletons } from '../components/Skeletons.js';
import { AdSlot } from '../components/AdSlot.js';
import { LanguageFilterService, SUPPORTED_LANGUAGES } from '../services/languageFilterService.js';

export const BrowseView = {
  debounceTimer: null,
  loadedMedia: [],
  currentPage: 1,
  pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false },
  currentParams: {},
  isLoadingMore: false,
  observer: null,
  verifiedMap: new Map(),

  async render(container, queryParams = {}) {
    this.currentParams = { ...queryParams };
    this.currentPage = Number(queryParams.page) || 1;
    this.loadedMedia = [];
    this.isLoadingMore = false;

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    const search = queryParams.search || '';
    const genre = queryParams.genre || '';
    const year = queryParams.year || '';
    const season = queryParams.season || 'ALL';
    const status = queryParams.status || 'ALL';
    const format = queryParams.format || 'ALL';
    const era = queryParams.era || 'ALL';
    const country = queryParams.country || 'ALL';
    const watchableOnly = queryParams.watchableOnly === 'true' || queryParams.watchableOnly === true;
    const sort = queryParams.sort || 'POPULARITY_DESC';

    const globalLang = LanguageFilterService.getActiveLanguage();
    const language = queryParams.language !== undefined ? queryParams.language : (globalLang !== 'ALL' ? globalLang : 'ALL');
    if (queryParams.language && queryParams.language !== globalLang) {
      LanguageFilterService.setActiveLanguage(queryParams.language);
    }
    this.currentParams.language = language;

    // Load available genres & verified watch sources in parallel
    const [genresList, verifiedSources] = await Promise.all([
      AnimeService.getGenres(),
      AnimeService.getVerifiedSources().catch(() => [])
    ]);

    this.verifiedMap = new Map();
    (verifiedSources || []).forEach(s => {
      this.verifiedMap.set(Number(s.anime_id), s);
    });

    container.innerHTML = `
      <div class="container" style="padding-top: 24px;">
        <!-- Page Title & Header -->
        <div style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
            <h1 style="font-size: 2rem; font-weight: 800; color: #fff; margin: 0;">Browse Anime Catalog</h1>
            <span style="background: rgba(139, 92, 246, 0.15); color: var(--accent-purple-light); border: 1px solid rgba(139, 92, 246, 0.3); font-size: 0.75rem; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
              AniList Live
            </span>
          </div>
          <p style="color: var(--text-muted); font-size: 0.95rem;">
            Explore the vast AniList catalog with real-time metadata, regional filters, and verified official streaming sources.
          </p>
        </div>

        <!-- Filter & Search Controls Card -->
        <div class="browse-filter-card">
          <!-- Multi-Title Search Bar -->
          <div class="browse-search-row">
            <div class="search-input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input 
                type="text" 
                id="browse-search-input" 
                class="browse-search-input" 
                placeholder="Search anime title by English, Romaji, Japanese (e.g. 進撃の巨人), or alternative titles..." 
                value="${escapeHtml(search)}"
                autocomplete="off"
              />
            </div>
          </div>

          <!-- Multi-faceted Filter Controls -->
          <div class="filter-controls-grid">
            <!-- Format Select -->
            <div class="filter-group">
              <label class="filter-label" for="filter-format">Format</label>
              <select id="filter-format" class="filter-select">
                <option value="ALL" ${format === 'ALL' ? 'selected' : ''}>All Formats</option>
                <option value="TV" ${format === 'TV' ? 'selected' : ''}>TV Series</option>
                <option value="MOVIE" ${format === 'MOVIE' ? 'selected' : ''}>Movie</option>
                <option value="OVA" ${format === 'OVA' ? 'selected' : ''}>OVA</option>
                <option value="ONA" ${format === 'ONA' ? 'selected' : ''}>ONA (Web)</option>
                <option value="SPECIAL" ${format === 'SPECIAL' ? 'selected' : ''}>Special</option>
                <option value="MUSIC" ${format === 'MUSIC' ? 'selected' : ''}>Music Video</option>
              </select>
            </div>

            <!-- Status Select -->
            <div class="filter-group">
              <label class="filter-label" for="filter-status">Status</label>
              <select id="filter-status" class="filter-select">
                <option value="ALL" ${status === 'ALL' ? 'selected' : ''}>All Statuses</option>
                <option value="RELEASING" ${status === 'RELEASING' ? 'selected' : ''}>Currently Airing</option>
                <option value="FINISHED" ${status === 'FINISHED' ? 'selected' : ''}>Finished</option>
                <option value="NOT_YET_RELEASED" ${status === 'NOT_YET_RELEASED' ? 'selected' : ''}>Upcoming</option>
                <option value="CANCELLED" ${status === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
              </select>
            </div>

            <!-- Country of Origin Select -->
            <div class="filter-group">
              <label class="filter-label" for="filter-country">Country of Origin</label>
              <select id="filter-country" class="filter-select">
                <option value="ALL" ${country === 'ALL' ? 'selected' : ''}>All Countries</option>
                <option value="JP" ${country === 'JP' ? 'selected' : ''}>Japan (JP)</option>
                <option value="KR" ${country === 'KR' ? 'selected' : ''}>South Korea (KR)</option>
                <option value="CN" ${country === 'CN' ? 'selected' : ''}>China (CN)</option>
                <option value="TW" ${country === 'TW' ? 'selected' : ''}>Taiwan (TW)</option>
              </select>
            </div>

            <!-- Genre Select -->
            <div class="filter-group">
              <label class="filter-label" for="filter-genre">Genre</label>
              <select id="filter-genre" class="filter-select">
                <option value="">All Genres</option>
                ${genresList.map(g => `<option value="${g}" ${g === genre ? 'selected' : ''}>${g}</option>`).join('')}
              </select>
            </div>

            <!-- Year Select -->
            <div class="filter-group">
              <label class="filter-label" for="filter-year">Year</label>
              <select id="filter-year" class="filter-select">
                <option value="">All Years</option>
                ${[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2015, 2010, 2005, 2000, 1995, 1990, 1985].map(y => `
                  <option value="${y}" ${String(y) === String(year) ? 'selected' : ''}>${y}</option>
                `).join('')}
              </select>
            </div>

            <!-- Era Select -->
            <div class="filter-group">
              <label class="filter-label" for="filter-era">Release Era</label>
              <select id="filter-era" class="filter-select">
                <option value="ALL" ${era === 'ALL' ? 'selected' : ''}>All Eras</option>
                <option value="MODERN" ${era === 'MODERN' ? 'selected' : ''}>Modern (2020+)</option>
                <option value="2010s" ${era === '2010s' ? 'selected' : ''}>2010s Era</option>
                <option value="2000s" ${era === '2000s' ? 'selected' : ''}>2000s Era</option>
                <option value="CLASSIC" ${era === 'CLASSIC' ? 'selected' : ''}>Classics (Pre-2000)</option>
              </select>
            </div>

            <!-- Language Filter -->
            <div class="filter-group">
              <label class="filter-label" for="filter-language">
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  Language
                </span>
              </label>
              <select id="filter-language" class="filter-select">
                ${SUPPORTED_LANGUAGES.map(l => `
                  <option value="${l.id}" ${language === l.id ? 'selected' : ''}>${l.label}</option>
                `).join('')}
              </select>
            </div>

            <!-- Watch Source Filter -->
            <div class="filter-group">
              <label class="filter-label" for="filter-watchable">Watch Source</label>
              <select id="filter-watchable" class="filter-select">
                <option value="false" ${!watchableOnly ? 'selected' : ''}>All Catalog Anime</option>
                <option value="true" ${watchableOnly ? 'selected' : ''}>Official YouTube Stream Only</option>
              </select>
            </div>

            <!-- Sort By Select -->
            <div class="filter-group">
              <label class="filter-label" for="filter-sort">Sort By</label>
              <select id="filter-sort" class="filter-select">
                <option value="POPULARITY_DESC" ${sort === 'POPULARITY_DESC' ? 'selected' : ''}>Popularity (Most Popular)</option>
                <option value="TRENDING_DESC" ${sort === 'TRENDING_DESC' ? 'selected' : ''}>Trending Now</option>
                <option value="SCORE_DESC" ${sort === 'SCORE_DESC' ? 'selected' : ''}>Highest Score / Rating</option>
                <option value="UPDATED_AT_DESC" ${sort === 'UPDATED_AT_DESC' ? 'selected' : ''}>Recently Updated</option>
                <option value="START_DATE_DESC" ${sort === 'START_DATE_DESC' ? 'selected' : ''}>Newest Releases</option>
                <option value="TITLE_ROMAJI" ${sort === 'TITLE_ROMAJI' ? 'selected' : ''}>Title (A-Z)</option>
              </select>
            </div>
          </div>

          <!-- Active Filter Tags & Reset -->
          <div class="filter-actions-row">
            <div class="active-filters-list" id="active-filters-tags">
              ${search ? `<span class="filter-tag">Keyword: "${escapeHtml(search)}"</span>` : ''}
              ${format !== 'ALL' ? `<span class="filter-tag">Format: ${format}</span>` : ''}
              ${status !== 'ALL' ? `<span class="filter-tag">Status: ${status}</span>` : ''}
              ${country !== 'ALL' ? `<span class="filter-tag">Country: ${AnimeService.formatCountry(country)}</span>` : ''}
              ${genre ? `<span class="filter-tag">Genre: ${escapeHtml(genre)}</span>` : ''}
              ${year ? `<span class="filter-tag">Year: ${year}</span>` : ''}
              ${era !== 'ALL' ? `<span class="filter-tag">Era: ${era}</span>` : ''}
              ${language && language !== 'ALL' ? `<span class="filter-tag" style="background: rgba(139, 92, 246, 0.2); color: #c4b5fd; border-color: rgba(139, 92, 246, 0.4);">Language: ${escapeHtml(language)}</span>` : ''}
              ${watchableOnly ? `<span class="filter-tag" style="background: rgba(220,38,38,0.2); color:#f87171; border-color: rgba(220,38,38,0.4);">Official YouTube Only</span>` : ''}
            </div>
            ${(search || format !== 'ALL' || status !== 'ALL' || country !== 'ALL' || genre || year || era !== 'ALL' || watchableOnly || (language && language !== 'ALL') || sort !== 'POPULARITY_DESC') ? `
              <button type="button" class="btn-reset-filters" id="btn-reset-filters">Reset all filters</button>
            ` : ''}
          </div>
        </div>

        <!-- Ad Placement -->
        ${AdSlot.render('leaderboard', 'browse-top-leaderboard')}

        <!-- Results Counter & Status -->
        <div id="browse-counter-bar" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div id="browse-counter-text" style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">
            Loading anime from AniList catalog...
          </div>
        </div>

        <!-- Results Grid Container -->
        <div id="browse-results-area">
          <div class="anime-grid">
            ${Skeletons.renderCardSkeletonGrid(12)}
          </div>
        </div>

        <!-- Load More Action & Infinite Sentinel -->
        <div id="browse-loadmore-wrap" style="text-align: center; margin: 36px 0 16px;"></div>
        <div id="browse-infinite-sentinel" style="height: 20px; margin-top: 10px;"></div>

        <!-- Secondary Pagination Bar (Traditional Page Jump) -->
        <div id="browse-pagination-area"></div>
      </div>
    `;

    // Bind Filter and Input Event Handlers
    this.bindEvents(queryParams);

    // Initial Fetch (First 50 items)
    await this.fetchAndRenderResults(queryParams);
  },

  bindEvents(currentParams) {
    const searchInput = document.getElementById('browse-search-input');
    const formatSelect = document.getElementById('filter-format');
    const statusSelect = document.getElementById('filter-status');
    const countrySelect = document.getElementById('filter-country');
    const genreSelect = document.getElementById('filter-genre');
    const yearSelect = document.getElementById('filter-year');
    const eraSelect = document.getElementById('filter-era');
    const watchableSelect = document.getElementById('filter-watchable');
    const sortSelect = document.getElementById('filter-sort');
    const resetBtn = document.getElementById('btn-reset-filters');

    const updateParamsAndNavigate = (newParams) => {
      const merged = { ...currentParams, ...newParams, page: 1 };
      // Clean up empty params
      Object.keys(merged).forEach(key => {
        if (!merged[key] || merged[key] === 'ALL' || merged[key] === 'false') delete merged[key];
      });
      const queryString = new URLSearchParams(merged).toString();
      window.router.navigate(`/browse${queryString ? '?' + queryString : ''}`);
    };

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          updateParamsAndNavigate({ search: e.target.value.trim() });
        }, 400);
      });
    }

    if (formatSelect) {
      formatSelect.addEventListener('change', (e) => updateParamsAndNavigate({ format: e.target.value }));
    }

    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => updateParamsAndNavigate({ status: e.target.value }));
    }

    if (countrySelect) {
      countrySelect.addEventListener('change', (e) => updateParamsAndNavigate({ country: e.target.value }));
    }

    if (genreSelect) {
      genreSelect.addEventListener('change', (e) => updateParamsAndNavigate({ genre: e.target.value }));
    }

    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => updateParamsAndNavigate({ year: e.target.value }));
    }

    if (eraSelect) {
      eraSelect.addEventListener('change', (e) => updateParamsAndNavigate({ era: e.target.value }));
    }

    if (watchableSelect) {
      watchableSelect.addEventListener('change', (e) => updateParamsAndNavigate({ watchableOnly: e.target.value === 'true' }));
    }

    const langSelect = document.getElementById('filter-language');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        LanguageFilterService.setActiveLanguage(e.target.value);
        updateParamsAndNavigate({ language: e.target.value });
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => updateParamsAndNavigate({ sort: e.target.value }));
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        LanguageFilterService.setActiveLanguage('ALL');
        window.router.navigate('/browse?language=ALL');
      });
    }
  },

  async fetchAndRenderResults(queryParams) {
    const resultsArea = document.getElementById('browse-results-area');
    const counterText = document.getElementById('browse-counter-text');
    const loadMoreWrap = document.getElementById('browse-loadmore-wrap');
    const paginationArea = document.getElementById('browse-pagination-area');
    if (!resultsArea) return;

    try {
      const pageToFetch = this.currentPage || 1;
      const activeLang = queryParams.language || this.currentParams.language || LanguageFilterService.getActiveLanguage();
      const { media, pageInfo } = await AnimeService.searchAndFilter({
        ...queryParams,
        language: activeLang,
        countryOfOrigin: queryParams.country,
        page: pageToFetch,
        perPage: 50 // 50 items per API page
      });

      this.pageInfo = pageInfo || { total: 0, currentPage: pageToFetch, lastPage: 1, hasNextPage: false };
      this.loadedMedia = [...media];

      // Handle Empty State
      if (!this.loadedMedia || this.loadedMedia.length === 0) {
        if (counterText) counterText.textContent = 'No matching anime found.';
        const isLangFiltered = activeLang && activeLang !== 'ALL';
        const emptyHeading = isLangFiltered ? 'No verified anime available in this language yet.' : 'No Anime Found';
        const emptyDesc = isLangFiltered 
          ? `We strictly index official licensed anime streams. There are currently no verified streams available for ${escapeHtml(activeLang)} in our database.`
          : `We couldn't find any anime matching your current search or filter combination. Try clearing some filters or searching with different keywords.`;

        resultsArea.innerHTML = `
          <div class="empty-state" style="padding: 48px 24px; text-align: center; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 16px;">
            <div class="state-icon" style="width: 56px; height: 56px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; background: rgba(139, 92, 246, 0.1); border-radius: 50%; color: var(--accent-purple-light);">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <h3 class="state-title" style="color: #fff; font-size: 1.25rem; margin-bottom: 8px;">${emptyHeading}</h3>
            <p class="state-desc" style="color: var(--text-muted); font-size: 0.9rem; max-width: 440px; margin: 0 auto 20px;">
              ${emptyDesc}
            </p>
            <button type="button" class="btn-primary" onclick="window.router.navigate('/browse?language=ALL')">
              Show All Languages
            </button>
          </div>
        `;
        if (loadMoreWrap) loadMoreWrap.innerHTML = '';
        if (paginationArea) paginationArea.innerHTML = '';
        return;
      }

      // Update Result Counter
      this.updateCounterUI();

      // Render Anime Cards Grid
      resultsArea.innerHTML = `
        <div class="anime-grid" id="browse-grid">
          ${this.loadedMedia.map(anime => this.renderCard(anime)).join('')}
        </div>
      `;

      // Render Load More & Pagination controls
      this.renderLoadMoreUI();
      this.renderPagination(paginationArea, this.pageInfo, queryParams);
      this.setupInfiniteScrollObserver();

    } catch (error) {
      console.error('Browse fetch error:', error);
      if (counterText) counterText.textContent = 'Connection error.';
      resultsArea.innerHTML = `
        <div class="error-state" style="padding: 40px 24px; text-align: center; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 16px;">
          <div class="state-icon" style="width: 56px; height: 56px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; background: rgba(239, 68, 68, 0.1); border-radius: 50%; color: #f87171;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3 class="state-title" style="color: #fff; font-size: 1.25rem; margin-bottom: 8px;">Unable to load anime catalog</h3>
          <p class="state-desc" style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
            ${error.message || 'Failed to connect to AniList GraphQL API.'}
          </p>
          <button type="button" class="btn-primary" onclick="window.router.refresh()">
            Retry Search
          </button>
        </div>
      `;
      if (loadMoreWrap) loadMoreWrap.innerHTML = '';
      if (paginationArea) paginationArea.innerHTML = '';
    }
  },

  renderCard(anime) {
    const watchSource = this.verifiedMap.get(Number(anime.id));
    const isWatchable = Boolean(watchSource);
    return AnimeCard.render(anime, { 
      isWatchable,
      watchSource,
      language: watchSource?.language
    });
  },

  updateCounterUI() {
    const counterText = document.getElementById('browse-counter-text');
    if (!counterText) return;
    const totalCount = this.pageInfo?.total || this.loadedMedia.length;
    counterText.innerHTML = `
      Showing <strong style="color: #fff;">${this.loadedMedia.length}</strong> of 
      <strong style="color: #fff;">${totalCount.toLocaleString()}</strong> titles 
      <span style="color: var(--text-dim); font-size: 0.8rem; margin-left: 6px;">(50 per batch)</span>
    `;
  },

  renderLoadMoreUI() {
    const loadMoreWrap = document.getElementById('browse-loadmore-wrap');
    if (!loadMoreWrap) return;

    if (!this.pageInfo.hasNextPage) {
      loadMoreWrap.innerHTML = `
        <div style="font-size: 0.88rem; color: var(--text-dim); padding: 16px;">
          ✓ You've reached the end of the available results for this search (${this.loadedMedia.length} anime).
        </div>
      `;
      return;
    }

    loadMoreWrap.innerHTML = `
      <div style="display: inline-flex; flex-direction: column; align-items: center; gap: 8px;">
        <button 
          type="button" 
          id="btn-load-more-anime"
          class="btn-primary" 
          style="padding: 12px 32px; font-size: 0.95rem; font-weight: 700; border-radius: 12px; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 16px rgba(139, 92, 246, 0.25);"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          <span>Load More Anime (+50)</span>
        </button>
        <span style="font-size: 0.78rem; color: var(--text-dim);">
          Scroll down or click to load next 50 titles
        </span>
      </div>
    `;

    const btn = document.getElementById('btn-load-more-anime');
    if (btn) {
      btn.onclick = () => this.loadNextPage();
    }
  },

  async loadNextPage() {
    if (this.isLoadingMore || !this.pageInfo.hasNextPage) return;

    this.isLoadingMore = true;
    const btn = document.getElementById('btn-load-more-anime');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `
        <svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        <span>Loading Next 50 Anime...</span>
      `;
    }

    try {
      const nextPage = (this.currentPage || 1) + 1;
      const { media, pageInfo } = await AnimeService.searchAndFilter({
        ...this.currentParams,
        countryOfOrigin: this.currentParams.country,
        page: nextPage,
        perPage: 50
      });

      if (media && media.length > 0) {
        this.currentPage = nextPage;
        this.pageInfo = pageInfo || this.pageInfo;
        this.loadedMedia.push(...media);

        // Smoothly append new cards to the DOM grid
        const grid = document.getElementById('browse-grid');
        if (grid) {
          const newHtml = media.map(anime => this.renderCard(anime)).join('');
          grid.insertAdjacentHTML('beforeend', newHtml);
        }

        // Update progress counter
        this.updateCounterUI();
      } else {
        this.pageInfo.hasNextPage = false;
      }
    } catch (err) {
      console.warn('[BrowseView] Load more error:', err);
    } finally {
      this.isLoadingMore = false;
      this.renderLoadMoreUI();
    }
  },

  setupInfiniteScrollObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    const sentinel = document.getElementById('browse-infinite-sentinel');
    if (!sentinel || !window.IntersectionObserver) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && this.pageInfo.hasNextPage && !this.isLoadingMore) {
          this.loadNextPage();
        }
      });
    }, {
      rootMargin: '400px', // Pre-fetch before user hits the exact bottom
      threshold: 0.1
    });

    this.observer.observe(sentinel);
  },

  renderPagination(container, pageInfo, queryParams) {
    if (!container || !pageInfo) return;
    const currentPage = pageInfo.currentPage || 1;
    const hasNext = pageInfo.hasNextPage || false;
    const totalPages = pageInfo.lastPage || currentPage;

    const buildPageUrl = (page) => {
      const merged = { ...queryParams, page };
      return `#/browse?${new URLSearchParams(merged).toString()}`;
    };

    container.innerHTML = `
      <div class="pagination-container" style="margin-top: 24px;">
        <a 
          href="${currentPage > 1 ? buildPageUrl(currentPage - 1) : 'javascript:void(0)'}" 
          class="page-btn ${currentPage <= 1 ? 'disabled' : ''}" 
          ${currentPage <= 1 ? 'disabled' : ''}
          title="Go to previous page"
        >
          &larr; Prev Page
        </a>

        <span style="font-size: 0.9rem; color: var(--text-muted); padding: 0 12px;">
          Batch Page <strong style="color: var(--text-primary);">${currentPage}</strong> of ${totalPages.toLocaleString()}
        </span>

        <a 
          href="${hasNext ? buildPageUrl(currentPage + 1) : 'javascript:void(0)'}" 
          class="page-btn ${!hasNext ? 'disabled' : ''}" 
          ${!hasNext ? 'disabled' : ''}
          title="Go to next page"
        >
          Next Page &rarr;
        </a>
      </div>
    `;
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
