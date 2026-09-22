/**
 * Anime Comparison View
 * Factual side-by-side metadata comparison for two anime without declaring a winner.
 */

import { AnimeService } from '../services/animeService.js';
import { Skeletons } from '../components/Skeletons.js';
import { escapeHtml } from '../utils/stringUtils.js';

export const CompareView = {
  anime1: null,
  anime2: null,

  async render(container, params = {}) {
    // Default anime pair: Attack on Titan (16498) vs Jujutsu Kaisen (113415)
    const id1 = params.id1 || 16498;
    const id2 = params.id2 || 113415;

    container.innerHTML = `
      <div class="container" style="padding-top: 24px;">
        <!-- Header -->
        <div style="margin-bottom: 32px; text-align: center;">
          <h1 style="font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 8px;">Anime Side-by-Side Comparison</h1>
          <p style="color: var(--text-muted); font-size: 0.95rem; max-width: 600px; margin: 0 auto;">
            Compare verified production metadata, community ratings, episode counts, and studio credentials side-by-side.
          </p>
        </div>

        <!-- Pickers Row -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 16px; margin-bottom: 28px;">
          <!-- Slot 1 Search Picker -->
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 18px;">
            <label style="font-size: 0.8rem; font-weight: 700; color: var(--accent-purple-light); text-transform: uppercase; display: block; margin-bottom: 8px;">Anime 1</label>
            <div style="position: relative;">
              <input 
                type="text" 
                id="compare-search-1" 
                placeholder="Search first anime..." 
                style="width: 100%; padding: 10px 14px; background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: var(--radius-sm); color: #fff; outline: none;"
              />
              <div id="compare-dropdown-1" class="search-results-list" style="position: absolute; top: 100%; left: 0; right: 0; background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: var(--radius-sm); z-index: 10; display: none;"></div>
            </div>
          </div>

          <!-- Slot 2 Search Picker -->
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 18px;">
            <label style="font-size: 0.8rem; font-weight: 700; color: var(--accent-cyan-light); text-transform: uppercase; display: block; margin-bottom: 8px;">Anime 2</label>
            <div style="position: relative;">
              <input 
                type="text" 
                id="compare-search-2" 
                placeholder="Search second anime..." 
                style="width: 100%; padding: 10px 14px; background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: var(--radius-sm); color: #fff; outline: none;"
              />
              <div id="compare-dropdown-2" class="search-results-list" style="position: absolute; top: 100%; left: 0; right: 0; background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: var(--radius-sm); z-index: 10; display: none;"></div>
            </div>
          </div>
        </div>

        <!-- Comparison Table Area -->
        <div id="comparison-results-area">
          ${Skeletons.renderDetailsSkeleton()}
        </div>
      </div>
    `;

    this.bindSearchPickers(container);
    await this.fetchAndRenderComparison(id1, id2);
  },

  async fetchAndRenderComparison(id1, id2) {
    const resultsArea = document.getElementById('comparison-results-area');
    if (!resultsArea) return;

    try {
      const { anime1, anime2 } = await AnimeService.compareAnime(id1, id2);
      this.anime1 = anime1;
      this.anime2 = anime2;

      if (!anime1 || !anime2) {
        resultsArea.innerHTML = `<div class="error-state"><p>One or both anime could not be found.</p></div>`;
        return;
      }

      resultsArea.innerHTML = this.buildComparisonTable(anime1, anime2);
    } catch (err) {
      console.error('Comparison error:', err);
      resultsArea.innerHTML = `<div class="error-state"><p>${err.message}</p></div>`;
    }
  },

  buildComparisonTable(a1, a2) {
    const title1 = AnimeService.formatTitle(a1.title);
    const title2 = AnimeService.formatTitle(a2.title);

    const rows = [
      { label: 'Release Year', val1: a1.seasonYear || 'TBA', val2: a2.seasonYear || 'TBA' },
      { label: 'Season', val1: AnimeService.formatSeason(a1.season, a1.seasonYear), val2: AnimeService.formatSeason(a2.season, a2.seasonYear) },
      { label: 'Episode Count', val1: a1.episodes ? `${a1.episodes} episodes` : 'Ongoing', val2: a2.episodes ? `${a2.episodes} episodes` : 'Ongoing' },
      { label: 'Episode Duration', val1: a1.duration ? `${a1.duration} mins` : 'N/A', val2: a2.duration ? `${a2.duration} mins` : 'N/A' },
      { label: 'Status', val1: AnimeService.formatStatus(a1.status), val2: AnimeService.formatStatus(a2.status) },
      { label: 'Animation Studio', val1: a1.studios?.nodes?.[0]?.name || 'Unknown', val2: a2.studios?.nodes?.[0]?.name || 'Unknown' },
      { label: 'Average Score', val1: a1.averageScore ? `★ ${(a1.averageScore / 10).toFixed(1)} / 10 (${a1.averageScore}%)` : 'N/A', val2: a2.averageScore ? `★ ${(a2.averageScore / 10).toFixed(1)} / 10 (${a2.averageScore}%)` : 'N/A' },
      { label: 'Popularity Rank', val1: `#${a1.popularity ? a1.popularity.toLocaleString() : 'N/A'} users`, val2: `#${a2.popularity ? a2.popularity.toLocaleString() : 'N/A'} users` },
      { label: 'Source Material', val1: a1.source ? a1.source.replace('_', ' ') : 'N/A', val2: a2.source ? a2.source.replace('_', ' ') : 'N/A' },
      { label: 'Genres', val1: (a1.genres || []).join(', '), val2: (a2.genres || []).join(', ') },
    ];

    return `
      <div style="background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-xl); overflow-x: auto; -webkit-overflow-scrolling: touch; box-shadow: var(--shadow-md);">
        <div style="min-width: 480px;">
        <!-- Side by Side Posters Header -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--border-subtle);">
          <!-- Anime 1 Header -->
          <div style="padding: 28px; text-align: center; border-right: 1px solid var(--border-subtle); background: rgba(139,92,246,0.04);">
            <img 
              src="${a1.coverImage?.large || a1.coverImage?.medium}" 
              alt="${escapeHtml(title1)}" 
              style="width: 140px; aspect-ratio: 11/16; object-fit: cover; border-radius: var(--radius-md); margin: 0 auto 16px; box-shadow: var(--shadow-md);"
            />
            <h2 style="font-size: 1.3rem; font-weight: 800; color: #fff; margin-bottom: 4px;">${escapeHtml(title1)}</h2>
            ${a1.title?.native ? `<p style="font-family: var(--font-jp); font-size: 0.85rem; color: var(--accent-purple-light); margin-bottom: 12px;">${escapeHtml(a1.title.native)}</p>` : ''}
            <button type="button" class="btn-primary" style="padding: 6px 16px; font-size: 0.82rem;" onclick="window.router.navigate('/anime/${a1.id}')">
              View Full Details
            </button>
          </div>

          <!-- Anime 2 Header -->
          <div style="padding: 28px; text-align: center; background: rgba(6,182,212,0.04);">
            <img 
              src="${a2.coverImage?.large || a2.coverImage?.medium}" 
              alt="${escapeHtml(title2)}" 
              style="width: 140px; aspect-ratio: 11/16; object-fit: cover; border-radius: var(--radius-md); margin: 0 auto 16px; box-shadow: var(--shadow-md);"
            />
            <h2 style="font-size: 1.3rem; font-weight: 800; color: #fff; margin-bottom: 4px;">${escapeHtml(title2)}</h2>
            ${a2.title?.native ? `<p style="font-family: var(--font-jp); font-size: 0.85rem; color: var(--accent-cyan-light); margin-bottom: 12px;">${escapeHtml(a2.title.native)}</p>` : ''}
            <button type="button" class="btn-primary" style="padding: 6px 16px; font-size: 0.82rem;" onclick="window.router.navigate('/anime/${a2.id}')">
              View Full Details
            </button>
          </div>
        </div>

        <!-- Metric Rows -->
        <div>
          ${rows.map((r, idx) => `
            <div style="display: grid; grid-template-columns: 1fr 140px 1fr; border-bottom: 1px solid var(--border-subtle); background: ${idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'};">
              <div style="padding: 16px 24px; text-align: right; color: var(--text-primary); font-size: 0.92rem; font-weight: 500;">
                ${escapeHtml(r.val1)}
              </div>
              <div style="padding: 16px 10px; text-align: center; font-size: 0.76rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
                ${r.label}
              </div>
              <div style="padding: 16px 24px; text-align: left; color: var(--text-primary); font-size: 0.92rem; font-weight: 500;">
                ${escapeHtml(r.val2)}
              </div>
            </div>
          `).join('')}
        </div>
        </div>
      </div>
    `;
  },

  bindSearchPickers(container) {
    let t1, t2;

    const setupPicker = (inputId, dropdownId, slotNum) => {
      const input = document.getElementById(inputId);
      const dropdown = document.getElementById(dropdownId);
      if (!input || !dropdown) return;

      input.oninput = (e) => {
        clearTimeout(slotNum === 1 ? t1 : t2);
        const q = e.target.value.trim();
        if (!q) {
          dropdown.style.display = 'none';
          return;
        }

        const timer = setTimeout(async () => {
          dropdown.style.display = 'block';
          dropdown.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--text-muted);">Searching...</div>';
          try {
            const { media } = await AnimeService.searchAndFilter({ search: q, perPage: 5 });
            if (!media || media.length === 0) {
              dropdown.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--text-muted);">No matches</div>';
              return;
            }
            dropdown.innerHTML = media.map(m => `
              <div 
                class="search-result-item" 
                style="padding: 8px 12px; display: flex; align-items: center; gap: 10px; cursor: pointer;"
                data-anime-id="${m.id}"
              >
                <img src="${m.coverImage?.medium}" style="width: 32px; height: 46px; border-radius: 4px; object-fit: cover;" />
                <span style="font-size: 0.85rem; font-weight: 600; color: #fff;">${escapeHtml(AnimeService.formatTitle(m.title))}</span>
              </div>
            `).join('');

            dropdown.querySelectorAll('.search-result-item').forEach(item => {
              item.onclick = () => {
                const id = item.getAttribute('data-anime-id');
                dropdown.style.display = 'none';
                input.value = '';
                if (slotNum === 1) {
                  this.fetchAndRenderComparison(id, this.anime2?.id || 113415);
                } else {
                  this.fetchAndRenderComparison(this.anime1?.id || 16498, id);
                }
              };
            });
          } catch {
            dropdown.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--accent-red);">Search failed</div>';
          }
        }, 300);

        if (slotNum === 1) t1 = timer;
        else t2 = timer;
      };

      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== input) {
          dropdown.style.display = 'none';
        }
      });
    };

    setupPicker('compare-search-1', 'compare-dropdown-1', 1);
    setupPicker('compare-search-2', 'compare-dropdown-2', 2);
  }
};

