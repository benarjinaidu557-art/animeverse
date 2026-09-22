/**
 * Discovery & AI Anime Finder View
 * Advanced discovery matrix + Natural Language AI Anime Finder
 * with factual metadata rationale and Surprise Me generator.
 */

import { AnimeService } from '../services/animeService.js';
import { AnimeCard } from '../components/AnimeCard.js';
import { Skeletons } from '../components/Skeletons.js';
import { Toast } from '../components/Toast.js';
import { escapeHtml } from '../utils/stringUtils.js';

export const DiscoverView = {
  activeMode: 'ai', // 'ai' | 'matrix'

  async render(container) {
    const genresList = await AnimeService.getGenres();

    container.innerHTML = `
      <div class="container" style="padding-top: 24px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
          <div>
            <h1 style="font-size: 2.1rem; font-weight: 800; color: #fff; margin-bottom: 6px;">Anime Discovery & AI Finder</h1>
            <p style="color: var(--text-muted); font-size: 0.95rem;">Uncover the perfect series using natural language or granular filters.</p>
          </div>

          <!-- Surprise Me Action -->
          <button type="button" class="btn-surprise" id="btn-discover-surprise">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            </svg>
            Surprise Me!
          </button>
        </div>

        <!-- Mode Toggle Tabs -->
        <div style="display: flex; gap: 12px; margin-bottom: 28px;">
          <button 
            type="button" 
            id="tab-mode-ai" 
            class="mode-tab-btn ${this.activeMode === 'ai' ? 'active' : ''}"
            style="
              padding: 10px 24px;
              border-radius: var(--radius-full);
              background: ${this.activeMode === 'ai' ? 'var(--gradient-primary)' : 'var(--bg-card)'};
              color: #fff;
              border: 1px solid ${this.activeMode === 'ai' ? 'var(--accent-purple-light)' : 'var(--border-subtle)'};
              font-weight: 700;
              font-size: 0.95rem;
              display: flex;
              align-items: center;
              gap: 8px;
              cursor: pointer;
            "
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V17a1 1 0 0 1-2 0v-.07A8 8 0 0 1 4.07 10H5a1 1 0 0 1 0 2h-.93A8 8 0 0 1 11 4.07V5a1 1 0 0 1 2 0v-.93A8 8 0 0 1 19.93 11H19a1 1 0 0 1 0-2h.93A8 8 0 0 1 13 16.93z"/></svg>
            AI Anime Finder
          </button>

          <button 
            type="button" 
            id="tab-mode-matrix" 
            class="mode-tab-btn ${this.activeMode === 'matrix' ? 'active' : ''}"
            style="
              padding: 10px 24px;
              border-radius: var(--radius-full);
              background: ${this.activeMode === 'matrix' ? 'var(--gradient-primary)' : 'var(--bg-card)'};
              color: #fff;
              border: 1px solid ${this.activeMode === 'matrix' ? 'var(--accent-purple-light)' : 'var(--border-subtle)'};
              font-weight: 700;
              font-size: 0.95rem;
              display: flex;
              align-items: center;
              gap: 8px;
              cursor: pointer;
            "
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Advanced Filter Matrix
          </button>
        </div>

        <!-- 1. AI ANIME FINDER INTERFACE -->
        <div id="ai-finder-panel" style="display: ${this.activeMode === 'ai' ? 'block' : 'none'};">
          <div style="
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(6, 182, 212, 0.1) 100%), var(--bg-card);
            border: 1px solid var(--border-accent);
            border-radius: var(--radius-xl);
            padding: 32px;
            margin-bottom: 32px;
          ">
            <h2 style="font-size: 1.4rem; font-weight: 700; color: #fff; margin-bottom: 8px;">
              Describe your dream anime in plain English
            </h2>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 18px;">
              Our query engine maps your prompt to real genres, tropes, themes, and community ratings from AniList.
            </p>

            <div style="position: relative; margin-bottom: 16px;">
              <textarea 
                id="ai-prompt-input" 
                rows="3" 
                placeholder="e.g. I want an action anime with an overpowered main character and fantasy elements..."
                style="
                  width: 100%;
                  background: var(--bg-secondary);
                  border: 1px solid var(--border-light);
                  border-radius: var(--radius-md);
                  padding: 16px;
                  color: #fff;
                  font-size: 1rem;
                  resize: vertical;
                  outline: none;
                "
              >I want an action anime with an overpowered main character and fantasy elements.</textarea>
            </div>

            <!-- Suggestion Chips -->
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; align-items: center;">
              <span style="font-size: 0.78rem; color: var(--text-dim); text-transform: uppercase; font-weight: 600;">Try these:</span>
              ${[
                'Dark psychological thriller with twists',
                'Overpowered MC in fantasy world',
                'Wholesome high school romance and comedy',
                'Futuristic cyberpunk mecha sci-fi',
                'Supernatural mystery movie with masterpiece score'
              ].map(chip => `
                <button 
                  type="button" 
                  class="ai-sample-chip" 
                  style="
                    background: rgba(255,255,255,0.05); 
                    border: 1px solid var(--border-subtle); 
                    border-radius: var(--radius-full); 
                    padding: 4px 12px; 
                    font-size: 0.78rem; 
                    color: var(--text-secondary); 
                    cursor: pointer;
                  "
                  onclick="document.getElementById('ai-prompt-input').value = '${chip}'"
                >
                  ${chip}
                </button>
              `).join('')}
            </div>

            <button type="button" id="btn-run-ai-finder" class="btn-primary" style="padding: 14px 28px; font-size: 1rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Search Anime with AI
            </button>
          </div>

          <!-- AI Results Section -->
          <div id="ai-results-container"></div>
        </div>

        <!-- 2. ADVANCED DISCOVERY MATRIX -->
        <div id="matrix-panel" style="display: ${this.activeMode === 'matrix' ? 'block' : 'none'};">
          <div class="browse-filter-card" style="margin-bottom: 32px;">
            <h3 style="font-size: 1.2rem; font-weight: 700; color: #fff; margin-bottom: 18px;">
              Discovery Criteria Matrix
            </h3>

            <div class="filter-controls-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
              <!-- Genre -->
              <div class="filter-group">
                <label class="filter-label" for="matrix-genre">Genre</label>
                <select id="matrix-genre" class="filter-select">
                  <option value="">All Genres</option>
                  ${genresList.map(g => `<option value="${g}">${g}</option>`).join('')}
                </select>
              </div>

              <!-- Format (TV, MOVIE, OVA, ONA) -->
              <div class="filter-group">
                <label class="filter-label" for="matrix-format">Format</label>
                <select id="matrix-format" class="filter-select">
                  <option value="">All Formats</option>
                  <option value="TV">TV Series</option>
                  <option value="MOVIE">Movie</option>
                  <option value="OVA">OVA</option>
                  <option value="ONA">ONA (Web)</option>
                  <option value="SPECIAL">Special</option>
                </select>
              </div>

              <!-- Season -->
              <div class="filter-group">
                <label class="filter-label" for="matrix-season">Season</label>
                <select id="matrix-season" class="filter-select">
                  <option value="ALL">All Seasons</option>
                  <option value="WINTER">Winter</option>
                  <option value="SPRING">Spring</option>
                  <option value="SUMMER">Summer</option>
                  <option value="FALL">Fall</option>
                </select>
              </div>

              <!-- Year -->
              <div class="filter-group">
                <label class="filter-label" for="matrix-year">Year</label>
                <select id="matrix-year" class="filter-select">
                  <option value="">All Years</option>
                  ${[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2018, 2015, 2010, 2000].map(y => `<option value="${y}">${y}</option>`).join('')}
                </select>
              </div>

              <!-- Status -->
              <div class="filter-group">
                <label class="filter-label" for="matrix-status">Status</label>
                <select id="matrix-status" class="filter-select">
                  <option value="ALL">All Statuses</option>
                  <option value="RELEASING">Airing Now</option>
                  <option value="FINISHED">Finished</option>
                  <option value="NOT_YET_RELEASED">Upcoming</option>
                </select>
              </div>

              <!-- Minimum Rating Slider -->
              <div class="filter-group">
                <label class="filter-label" for="matrix-min-rating">
                  Min Rating: <span id="min-rating-val" style="color: var(--accent-amber); font-weight: 700;">70%</span>
                </label>
                <input 
                  type="range" 
                  id="matrix-min-rating" 
                  min="0" 
                  max="90" 
                  step="5" 
                  value="70" 
                  style="accent-color: var(--accent-purple); margin-top: 10px;"
                />
              </div>
            </div>

            <div style="margin-top: 24px; display: flex; gap: 12px;">
              <button type="button" id="btn-generate-matrix" class="btn-primary">
                Generate Matching Anime
              </button>
            </div>
          </div>

          <!-- Matrix Results -->
          <div id="matrix-results-container"></div>
        </div>
      </div>
    `;

    this.bindEvents();
    // Auto-run default AI search to show initial awesome matches
    this.runAiFinder();
  },

  bindEvents() {
    // Mode Switcher
    const aiTab = document.getElementById('tab-mode-ai');
    const matrixTab = document.getElementById('tab-mode-matrix');
    const aiPanel = document.getElementById('ai-finder-panel');
    const matrixPanel = document.getElementById('matrix-panel');

    if (aiTab && matrixTab) {
      aiTab.onclick = () => {
        this.activeMode = 'ai';
        aiTab.style.background = 'var(--gradient-primary)';
        aiTab.style.borderColor = 'var(--accent-purple-light)';
        matrixTab.style.background = 'var(--bg-card)';
        matrixTab.style.borderColor = 'var(--border-subtle)';
        aiPanel.style.display = 'block';
        matrixPanel.style.display = 'none';
      };

      matrixTab.onclick = () => {
        this.activeMode = 'matrix';
        matrixTab.style.background = 'var(--gradient-primary)';
        matrixTab.style.borderColor = 'var(--accent-purple-light)';
        aiTab.style.background = 'var(--bg-card)';
        aiTab.style.borderColor = 'var(--border-subtle)';
        matrixPanel.style.display = 'block';
        aiPanel.style.display = 'none';
      };
    }

    // AI Finder button
    document.getElementById('btn-run-ai-finder')?.addEventListener('click', () => {
      this.runAiFinder();
    });

    // Rating slider display sync
    const slider = document.getElementById('matrix-min-rating');
    const valDisplay = document.getElementById('min-rating-val');
    if (slider && valDisplay) {
      slider.oninput = () => {
        valDisplay.textContent = slider.value + '%';
      };
    }

    // Matrix Generate button
    document.getElementById('btn-generate-matrix')?.addEventListener('click', () => {
      this.runMatrixDiscovery();
    });

    // Surprise Me button
    document.getElementById('btn-discover-surprise')?.addEventListener('click', async () => {
      try {
        const rand = await AnimeService.getRandomAnime();
        if (rand) {
          Toast.show(`Surprise Match: ${AnimeService.formatTitle(rand.title)}!`, 'success');
          window.router.navigate(`/anime/${rand.id}`);
        }
      } catch {
        Toast.show('Could not fetch surprise anime right now.', 'info');
      }
    });
  },

  async runAiFinder() {
    const input = document.getElementById('ai-prompt-input');
    const container = document.getElementById('ai-results-container');
    if (!input || !container) return;

    const query = input.value.trim();
    if (!query) {
      Toast.show('Please enter a description for the AI finder.', 'info');
      return;
    }

    container.innerHTML = `
      <div style="padding: 24px 0;">
        <div style="margin-bottom: 16px; color: var(--text-muted);">
          Analyzing query, searching genre graph, and cross-referencing AniList metadata...
        </div>
        <div class="anime-grid">${Skeletons.renderCardSkeletonGrid(6)}</div>
      </div>
    `;

    try {
      const { querySummary, results } = await AnimeService.aiAnimeFinder(query);

      if (results.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3 class="state-title">No direct matches found</h3>
            <p class="state-desc">Try broadening your description or exploring with our Advanced Filter Matrix.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="margin-bottom: 24px;">
          <div style="background: rgba(139,92,246,0.1); border: 1px solid var(--border-accent); border-radius: var(--radius-md); padding: 14px 18px; font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 24px;">
            🔍 <strong>AI Query Analysis:</strong> Identified Target Genre: <strong style="color: var(--accent-cyan-light);">${querySummary.targetGenre}</strong>
            ${querySummary.detectedThemes.length > 0 ? `• Key Themes: <span style="color: var(--accent-purple-light);">${querySummary.detectedThemes.join(', ')}</span>` : ''}
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
            ${results.map(anime => `
              <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); overflow: hidden; display: flex; flex-direction: column;">
                <div style="padding: 16px; display: flex; gap: 14px; align-items: flex-start; flex: 1;">
                  <img 
                    src="${anime.coverImage?.large || anime.coverImage?.medium}" 
                    alt="${escapeHtml(AnimeService.formatTitle(anime.title))}" 
                    style="width: 76px; height: 108px; object-fit: cover; border-radius: var(--radius-sm); flex-shrink: 0; cursor: pointer;"
                    onclick="window.router.navigate('/anime/${anime.id}')"
                  />
                  <div style="flex: 1; min-width: 0;">
                    <h4 
                      style="font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 4px; cursor: pointer;"
                      onclick="window.router.navigate('/anime/${anime.id}')"
                    >
                      ${escapeHtml(AnimeService.formatTitle(anime.title))}
                    </h4>
                    <div style="display: flex; gap: 6px; font-size: 0.75rem; color: var(--accent-amber); margin-bottom: 8px;">
                      <span>★ ${(anime.averageScore / 10).toFixed(1)}</span>
                      <span>•</span>
                      <span style="color: var(--text-muted);">${anime.seasonYear || ''}</span>
                    </div>
                    <!-- AI Match Explanation Badge -->
                    <div style="background: rgba(6,182,212,0.1); border-left: 3px solid var(--accent-cyan); padding: 6px 10px; border-radius: 4px; font-size: 0.76rem; color: var(--text-secondary); line-height: 1.4;">
                      💡 <strong>Why it matches:</strong> ${anime.aiExplanation}
                    </div>
                  </div>
                </div>

                <div style="padding: 10px 16px; background: rgba(0,0,0,0.2); border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 0.75rem; color: var(--text-muted);">${anime.format || 'TV'}</span>
                  <button type="button" class="btn-primary" style="padding: 6px 14px; font-size: 0.78rem;" onclick="window.router.navigate('/anime/${anime.id}')">
                    View Details
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state"><p>${err.message}</p></div>`;
    }
  },

  async runMatrixDiscovery() {
    const container = document.getElementById('matrix-results-container');
    if (!container) return;

    const genre = document.getElementById('matrix-genre').value;
    const format = document.getElementById('matrix-format').value;
    const season = document.getElementById('matrix-season').value;
    const year = document.getElementById('matrix-year').value;
    const status = document.getElementById('matrix-status').value;
    const minRating = document.getElementById('matrix-min-rating').value;

    container.innerHTML = `<div class="anime-grid">${Skeletons.renderCardSkeletonGrid(8)}</div>`;

    try {
      const { media } = await AnimeService.discoverAnime({
        genre,
        format,
        season,
        seasonYear: year,
        status,
        minRating,
        perPage: 16,
      });

      if (media.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3 class="state-title">No Anime Matches Found</h3>
            <p class="state-desc">Try lowering the minimum rating or clearing some criteria.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="anime-grid">
          ${media.map(anime => AnimeCard.render(anime)).join('')}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state"><p>${err.message}</p></div>`;
    }
  }
};

