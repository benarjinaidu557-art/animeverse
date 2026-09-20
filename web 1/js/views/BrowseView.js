/**
 * Browse & Discovery View
 * Complete search, multi-faceted filtering, sorting, and pagination powered by AniList.
 */

import { AnimeService } from '../services/animeService.js';
import { AnimeCard } from '../components/AnimeCard.js';
import { Skeletons } from '../components/Skeletons.js';
import { AdSlot } from '../components/AdSlot.js';

export const BrowseView = {
  debounceTimer: null,

  async render(container, queryParams = {}) {
    const search = queryParams.search || '';
    const genre = queryParams.genre || '';
    const year = queryParams.year || '';
    const season = queryParams.season || 'ALL';
    const status = queryParams.status || 'ALL';
    const sort = queryParams.sort || 'POPULARITY_DESC';
    const page = Number(queryParams.page) || 1;

    // Load available genres
    const genresList = await AnimeService.getGenres();

    container.innerHTML = `
      <div class="container" style="padding-top: 24px;">
        <!-- Page Title -->
        <div style="margin-bottom: 24px;">
          <h1 style="font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 6px;">Browse Anime</h1>
          <p style="color: var(--text-muted); font-size: 0.95rem;">Search and discover from over 15,000 anime series and movies.</p>
        </div>

        <!-- Filter & Search Controls Card -->
        <div class="browse-filter-card">
          <!-- Search Bar -->
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
                placeholder="Search anime title by English, Romaji, or Japanese..." 
                value="${escapeHtml(search)}"
                autocomplete="off"
              />
            </div>
          </div>

          <!-- Multi-faceted Filter Controls -->
          <div class="filter-controls-grid">
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
                ${[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2015, 2010, 2005, 2000, 1995].map(y => `
                  <option value="${y}" ${String(y) === String(year) ? 'selected' : ''}>${y}</option>
                `).join('')}
              </select>
            </div>

            <!-- Season Select -->
            <div class="filter-group">
              <label class="filter-label" for="filter-season">Season</label>
              <select id="filter-season" class="filter-select">
                <option value="ALL" ${season === 'ALL' ? 'selected' : ''}>All Seasons</option>
                <option value="WINTER" ${season === 'WINTER' ? 'selected' : ''}>Winter</option>
                <option value="SPRING" ${season === 'SPRING' ? 'selected' : ''}>Spring</option>
                <option value="SUMMER" ${season === 'SUMMER' ? 'selected' : ''}>Summer</option>
                <option value="FALL" ${season === 'FALL' ? 'selected' : ''}>Fall</option>
              </select>
            </div>

            <!-- Status Select -->
            <div class="filter-group">
              <label class="filter-label" for="filter-status">Status</label>
              <select id="filter-status" class="filter-select">
                <option value="ALL" ${status === 'ALL' ? 'selected' : ''}>All Statuses</option>
                <option value="RELEASING" ${status === 'RELEASING' ? 'selected' : ''}>Airing Now</option>
                <option value="FINISHED" ${status === 'FINISHED' ? 'selected' : ''}>Finished</option>
                <option value="NOT_YET_RELEASED" ${status === 'NOT_YET_RELEASED' ? 'selected' : ''}>Upcoming</option>
                <option value="CANCELLED" ${status === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
              </select>
            </div>

            <!-- Sort By Select -->
            <div class="filter-group">
              <label class="filter-label" for="filter-sort">Sort By</label>
              <select id="filter-sort" class="filter-select">
                <option value="POPULARITY_DESC" ${sort === 'POPULARITY_DESC' ? 'selected' : ''}>Popularity</option>
                <option value="SCORE_DESC" ${sort === 'SCORE_DESC' ? 'selected' : ''}>Rating</option>
                <option value="START_DATE_DESC" ${sort === 'START_DATE_DESC' ? 'selected' : ''}>Newest</option>
                <option value="TRENDING_DESC" ${sort === 'TRENDING_DESC' ? 'selected' : ''}>Trending</option>
                <option value="TITLE_ROMAJI" ${sort === 'TITLE_ROMAJI' ? 'selected' : ''}>Title (A-Z)</option>
              </select>
            </div>
          </div>

          <!-- Active Filter Tags & Reset -->
          <div class="filter-actions-row">
            <div class="active-filters-list" id="active-filters-tags">
              ${search ? `<span class="filter-tag">Keyword: "${escapeHtml(search)}"</span>` : ''}
              ${genre ? `<span class="filter-tag">Genre: ${escapeHtml(genre)}</span>` : ''}
              ${year ? `<span class="filter-tag">Year: ${year}</span>` : ''}
              ${season !== 'ALL' ? `<span class="filter-tag">Season: ${season}</span>` : ''}
              ${status !== 'ALL' ? `<span class="filter-tag">Status: ${status}</span>` : ''}
            </div>
            ${(search || genre || year || season !== 'ALL' || status !== 'ALL' || sort !== 'POPULARITY_DESC') ? `
              <button type="button" class="btn-reset-filters" id="btn-reset-filters">Reset all filters</button>
            ` : ''}
          </div>
        </div>

        <!-- Ad Placement -->
        ${AdSlot.render('leaderboard', 'browse-top-leaderboard')}

        <!-- Results Grid Container -->
        <div id="browse-results-area">
          <div class="anime-grid">
            ${Skeletons.renderCardSkeletonGrid(12)}
          </div>
        </div>

        <!-- Pagination Bar -->
        <div id="browse-pagination-area"></div>
      </div>
    `;

    // Bind Filter Event Handlers
    this.bindEvents(queryParams);

    // Perform the API search fetch
    await this.fetchAndRenderResults(queryParams);
  },

  bindEvents(currentParams) {
    const searchInput = document.getElementById('browse-search-input');
    const genreSelect = document.getElementById('filter-genre');
    const yearSelect = document.getElementById('filter-year');
    const seasonSelect = document.getElementById('filter-season');
    const statusSelect = document.getElementById('filter-status');
    const sortSelect = document.getElementById('filter-sort');
    const resetBtn = document.getElementById('btn-reset-filters');

    const updateParamsAndNavigate = (newParams) => {
      const merged = { ...currentParams, ...newParams, page: 1 };
      // Clean up empty params
      Object.keys(merged).forEach(key => {
        if (!merged[key] || merged[key] === 'ALL') delete merged[key];
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

    if (genreSelect) {
      genreSelect.addEventListener('change', (e) => {
        updateParamsAndNavigate({ genre: e.target.value });
      });
    }

    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        updateParamsAndNavigate({ year: e.target.value });
      });
    }

    if (seasonSelect) {
      seasonSelect.addEventListener('change', (e) => {
        updateParamsAndNavigate({ season: e.target.value });
      });
    }

    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        updateParamsAndNavigate({ status: e.target.value });
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        updateParamsAndNavigate({ sort: e.target.value });
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        window.router.navigate('/browse');
      });
    }
  },

  async fetchAndRenderResults(queryParams) {
    const resultsArea = document.getElementById('browse-results-area');
    const paginationArea = document.getElementById('browse-pagination-area');
    if (!resultsArea) return;

    try {
      const { media, pageInfo } = await AnimeService.searchAndFilter(queryParams);

      // Handle Empty State
      if (!media || media.length === 0) {
        resultsArea.innerHTML = `
          <div class="empty-state">
            <div class="state-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </div>
            <h3 class="state-title">No Anime Found</h3>
            <p class="state-desc">We couldn't find any anime matching your specified filters. Try adjusting your keywords or clearing some filters.</p>
            <button type="button" class="btn-secondary" onclick="window.router.navigate('/browse')">
              Clear All Filters
            </button>
          </div>
        `;
        if (paginationArea) paginationArea.innerHTML = '';
        return;
      }

      // Render Anime Cards Grid
      resultsArea.innerHTML = `
        <div class="anime-grid">
          ${media.map(anime => AnimeCard.render(anime)).join('')}
        </div>
      `;

      // Render Pagination
      this.renderPagination(paginationArea, pageInfo, queryParams);

    } catch (error) {
      console.error('Browse fetch error:', error);
      resultsArea.innerHTML = `
        <div class="error-state">
          <div class="state-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h3 class="state-title">Failed to load anime results</h3>
          <p class="state-desc">${error.message || 'AniList query failed. Please check your network and try again.'}</p>
          <button type="button" class="btn-primary" onclick="window.router.refresh()">
            Retry Search
          </button>
        </div>
      `;
      if (paginationArea) paginationArea.innerHTML = '';
    }
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
      <div class="pagination-container">
        <a 
          href="${currentPage > 1 ? buildPageUrl(currentPage - 1) : 'javascript:void(0)'}" 
          class="page-btn ${currentPage <= 1 ? 'disabled' : ''}" 
          ${currentPage <= 1 ? 'disabled' : ''}
        >
          &larr; Prev
        </a>

        <span style="font-size: 0.9rem; color: var(--text-muted); padding: 0 12px;">
          Page <strong style="color: var(--text-primary);">${currentPage}</strong> of ${totalPages}
        </span>

        <a 
          href="${hasNext ? buildPageUrl(currentPage + 1) : 'javascript:void(0)'}" 
          class="page-btn ${!hasNext ? 'disabled' : ''}" 
          ${!hasNext ? 'disabled' : ''}
        >
          Next &rarr;
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
