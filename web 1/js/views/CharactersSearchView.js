/**
 * Characters Search & Explorer View - AnimeVerse
 * Discover anime characters by name, view top favorite characters,
 * and explore their associated anime series.
 */

import { AnimeService } from '../services/animeService.js';
import { Skeletons } from '../components/Skeletons.js';

export const CharactersSearchView = {
  currentSearch: '',
  currentPage: 1,
  isLoading: false,
  hasNextPage: false,
  characters: [],

  async render(container) {
    this.currentSearch = '';
    this.currentPage = 1;
    this.characters = [];

    container.innerHTML = `
      <div class="container" style="padding: 24px 20px 60px;">
        <!-- Header & Search Banner -->
        <div style="text-align: center; max-width: 760px; margin: 0 auto 36px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); color: var(--accent-purple-light); font-size: 0.85rem; font-weight: 700; padding: 4px 14px; border-radius: var(--radius-full); margin-bottom: 12px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Character Universe
          </div>
          <h1 style="font-size: 2.3rem; font-weight: 800; color: #fff; margin-bottom: 10px; line-height: 1.2;">
            Anime Character Database
          </h1>
          <p style="color: var(--text-muted); font-size: 1rem; line-height: 1.6; margin-bottom: 24px;">
            Search legendary characters, discover their voice actors, and find every anime they appear in.
          </p>

          <!-- Search Form -->
          <form id="char-search-form" style="position: relative; display: flex; gap: 10px; margin-bottom: 18px;">
            <div style="position: relative; flex: 1;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none;">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input 
                type="text" 
                id="char-search-input" 
                placeholder="Search character name (e.g. Gojo, Luffy, Levi, Makima)..." 
                value="${this.currentSearch}"
                style="width: 100%; padding: 14px 18px 14px 48px; background: rgba(22, 22, 34, 0.8); border: 1px solid var(--border-subtle); border-radius: var(--radius-full); color: #fff; font-size: 1rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s;"
              />
            </div>
            <button type="submit" class="btn btn-primary" style="padding: 0 26px; border-radius: var(--radius-full); font-weight: 700; white-space: nowrap;">
              Search
            </button>
          </form>

          <!-- Popular Quick Chips -->
          <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; align-items: center;">
            <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">Popular:</span>
            ${['Gojo', 'Luffy', 'Levi', 'Zoro', 'Makima', 'Naruto', 'Killua', 'Eren'].map(name => `
              <button 
                type="button" 
                class="char-chip-btn" 
                data-name="${name}"
                style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; font-size: 0.82rem; padding: 4px 12px; border-radius: var(--radius-full); cursor: pointer; transition: all 0.2s;"
              >
                ${name}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Section Title / Status -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px;">
          <h2 id="char-section-title" style="font-size: 1.35rem; font-weight: 700; color: #fff;">
            ${this.currentSearch ? `Search Results for "${this.currentSearch}"` : 'Most Popular Characters'}
          </h2>
          <span id="char-count-badge" style="font-size: 0.85rem; color: var(--text-muted);">Loading...</span>
        </div>

        <!-- Characters Grid -->
        <div id="characters-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 24px; margin-bottom: 36px;">
          <!-- Populated by JS -->
        </div>

        <!-- Load More Container -->
        <div id="char-load-more-container" style="text-align: center; display: none; margin-top: 20px;">
          <button type="button" id="btn-char-load-more" class="btn btn-secondary" style="padding: 12px 32px; border-radius: var(--radius-full); font-weight: 700;">
            Load More Characters
          </button>
        </div>
      </div>
    `;

    this._bindEvents(container);
    await this._fetchAndRenderCharacters(container, true);
  },

  _bindEvents(container) {
    const form = container.querySelector('#char-search-form');
    const input = container.querySelector('#char-search-input');
    const chips = container.querySelectorAll('.char-chip-btn');
    const loadMoreBtn = container.querySelector('#btn-char-load-more');

    // Focus input styling
    input.addEventListener('focus', () => {
      input.style.borderColor = 'var(--accent-purple-light)';
      input.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.2)';
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = 'var(--border-subtle)';
      input.style.boxShadow = 'none';
    });

    // Form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.currentSearch = input.value.trim();
      this.currentPage = 1;
      this._fetchAndRenderCharacters(container, true);
    });

    // Quick chip clicks
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const name = chip.dataset.name;
        input.value = name;
        this.currentSearch = name;
        this.currentPage = 1;
        this._fetchAndRenderCharacters(container, true);
      });
      chip.addEventListener('mouseenter', () => {
        chip.style.borderColor = 'var(--accent-purple-light)';
        chip.style.color = '#fff';
        chip.style.background = 'rgba(139, 92, 246, 0.2)';
      });
      chip.addEventListener('mouseleave', () => {
        chip.style.borderColor = 'rgba(255,255,255,0.1)';
        chip.style.color = '#cbd5e1';
        chip.style.background = 'rgba(255,255,255,0.06)';
      });
    });

    // Load more
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        if (!this.isLoading && this.hasNextPage) {
          this.currentPage++;
          this._fetchAndRenderCharacters(container, false);
        }
      });
    }
  },

  async _fetchAndRenderCharacters(container, reset = true) {
    if (this.isLoading) return;
    this.isLoading = true;

    const grid = container.querySelector('#characters-grid');
    const countBadge = container.querySelector('#char-count-badge');
    const titleEl = container.querySelector('#char-section-title');
    const loadMoreContainer = container.querySelector('#char-load-more-container');
    const loadMoreBtn = container.querySelector('#btn-char-load-more');

    if (reset) {
      grid.innerHTML = Array(8).fill(0).map(() => `
        <div style="background: var(--bg-card); border-radius: 16px; overflow: hidden; border: 1px solid var(--border-subtle); height: 360px; display: flex; flex-direction: column;">
          <div style="height: 240px; background: rgba(255,255,255,0.06);"></div>
          <div style="padding: 16px; display: flex; flex-direction: column; gap: 8px;">
            <div style="height: 20px; width: 70%; background: rgba(255,255,255,0.08); border-radius: 6px;"></div>
            <div style="height: 14px; width: 40%; background: rgba(255,255,255,0.05); border-radius: 4px;"></div>
          </div>
        </div>
      `).join('');
      if (loadMoreContainer) loadMoreContainer.style.display = 'none';
    } else if (loadMoreBtn) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'Loading...';
    }

    if (titleEl) {
      titleEl.textContent = this.currentSearch 
        ? `Search Results for "${this.currentSearch}"` 
        : 'Most Popular Characters';
    }

    try {
      const res = await AnimeService.searchCharacters(this.currentSearch, this.currentPage, 24);
      const newChars = res.characters || [];
      this.hasNextPage = Boolean(res.pageInfo?.hasNextPage);

      if (reset) {
        this.characters = newChars;
      } else {
        this.characters = [...this.characters, ...newChars];
      }

      if (countBadge) {
        const total = res.pageInfo?.total || this.characters.length;
        countBadge.textContent = `${total.toLocaleString()} characters found`;
      }

      if (this.characters.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 48px 24px; text-align: center;">
            <div style="font-size: 2.5rem; margin-bottom: 12px;">🔍</div>
            <h3 style="font-size: 1.3rem; font-weight: 700; color: #fff; margin-bottom: 8px;">No Characters Found</h3>
            <p style="color: var(--text-muted); font-size: 0.95rem; max-width: 420px; margin: 0 auto 20px;">
              We couldn't find any characters matching "${this.currentSearch}". Try a different spelling or explore our popular characters.
            </p>
            <button type="button" class="btn btn-secondary" id="btn-char-reset" style="border-radius: var(--radius-full);">
              Show Popular Characters
            </button>
          </div>
        `;
        const resetBtn = grid.querySelector('#btn-char-reset');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            const input = container.querySelector('#char-search-input');
            if (input) input.value = '';
            this.currentSearch = '';
            this.currentPage = 1;
            this._fetchAndRenderCharacters(container, true);
          });
        }
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
        return;
      }

      grid.innerHTML = this.characters.map(char => {
        const name = char.name?.full || 'Unknown';
        const nativeName = char.name?.native || '';
        const image = char.image?.large || char.image?.medium || '';
        const favs = (char.favourites || 0).toLocaleString();
        const mediaNodes = char.media?.nodes || [];

        return `
          <div class="character-card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;">
            <a href="#/character/${char.id}" style="text-decoration: none; color: inherit; display: block; position: relative; padding-top: 125%; overflow: hidden; background: #13131c;">
              <img 
                src="${image}" 
                alt="${name}" 
                loading="lazy"
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s;" 
                onerror="this.src='https://placehold.co/300x400/1e1b2e/c4b5fd?text=No+Image'"
              />
              <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-full); padding: 3px 8px; display: flex; align-items: center; gap: 4px; font-size: 0.75rem; font-weight: 700; color: #fca5a5;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                ${favs}
              </div>
            </a>

            <div style="padding: 16px; display: flex; flex-direction: column; flex: 1; justify-content: space-between;">
              <div>
                <a href="#/character/${char.id}" style="text-decoration: none; color: inherit;">
                  <h3 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 4px 0; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">
                    ${name}
                  </h3>
                </a>
                ${nativeName ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">${nativeName}</div>` : ''}

                <!-- Featured Anime appearances -->
                ${mediaNodes.length > 0 ? `
                  <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.04em;">Appears in:</div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                      ${mediaNodes.map(m => `
                        <a href="#/anime/${m.id}" style="font-size: 0.82rem; color: #cbd5e1; text-decoration: none; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.15s;">
                          • ${m.title?.english || m.title?.romaji || 'Anime'}
                        </a>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>

              <div style="margin-top: 16px;">
                <a href="#/character/${char.id}" class="btn btn-secondary" style="display: block; text-align: center; font-size: 0.85rem; padding: 8px 12px; border-radius: var(--radius-full); text-decoration: none;">
                  View Profile
                </a>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Card hover animations
      grid.querySelectorAll('.character-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-4px)';
          card.style.borderColor = 'var(--accent-purple-light)';
          card.style.boxShadow = '0 12px 28px rgba(139, 92, 246, 0.2)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'translateY(0)';
          card.style.borderColor = 'var(--border-subtle)';
          card.style.boxShadow = 'none';
        });
      });

      // Show/hide load more
      if (loadMoreContainer) {
        loadMoreContainer.style.display = this.hasNextPage ? 'block' : 'none';
        if (loadMoreBtn) {
          loadMoreBtn.disabled = false;
          loadMoreBtn.textContent = 'Load More Characters';
        }
      }

    } catch (err) {
      console.error('Failed to search characters:', err);
      if (reset) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: #ef4444;">
            Failed to retrieve characters. Please check your internet connection and try again.
          </div>
        `;
      }
    } finally {
      this.isLoading = false;
    }
  }
};
