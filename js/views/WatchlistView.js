/**
 * Watchlist View
 * User's personal library and tracking manager with status filters.
 */

import { StorageService } from '../services/storageService.js';
import { AnimeCard } from '../components/AnimeCard.js';

export const WatchlistView = {
  currentTab: 'all',

  render(container) {
    const watchlist = StorageService.getWatchlist();
    const favorites = StorageService.getFavorites();

    const filterList = (tab) => {
      if (tab === 'all') return watchlist;
      if (tab === 'favorites') return watchlist.filter(item => favorites.includes(Number(item.id)));
      return watchlist.filter(item => item.status === tab);
    };

    const displayItems = filterList(this.currentTab);

    container.innerHTML = `
      <div class="container" style="padding-top: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
          <div>
            <h1 style="font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 6px;">My Anime Library</h1>
            <p style="color: var(--text-muted); font-size: 0.95rem;">Track your ongoing series, completed classics, and plan to watch.</p>
          </div>
          <div style="font-size: 0.9rem; color: var(--text-secondary); background: var(--bg-card); border: 1px solid var(--border-subtle); padding: 8px 16px; border-radius: var(--radius-full);">
            Total Saved: <strong style="color: #fff;">${watchlist.length}</strong> shows
          </div>
        </div>

        <!-- Filter Tabs -->
        <div style="display: flex; gap: 8px; margin-bottom: 28px; overflow-x: auto; padding-bottom: 8px;">
          ${[
            { key: 'all', label: `All (${watchlist.length})` },
            { key: 'watching', label: `Watching (${watchlist.filter(i => i.status === 'watching').length})` },
            { key: 'plan_to_watch', label: `Plan to Watch (${watchlist.filter(i => i.status === 'plan_to_watch').length})` },
            { key: 'completed', label: `Completed (${watchlist.filter(i => i.status === 'completed').length})` },
            { key: 'favorites', label: `Favorites (${favorites.length})` },
          ].map(tab => `
            <button 
              type="button" 
              class="tab-btn" 
              data-tab="${tab.key}"
              style="
                padding: 8px 18px;
                border-radius: var(--radius-full);
                background: ${this.currentTab === tab.key ? 'var(--accent-purple)' : 'var(--bg-card)'};
                color: ${this.currentTab === tab.key ? '#fff' : 'var(--text-secondary)'};
                border: 1px solid ${this.currentTab === tab.key ? 'var(--accent-purple)' : 'var(--border-subtle)'};
                font-size: 0.88rem;
                font-weight: 600;
                cursor: pointer;
                transition: all var(--transition-fast);
              "
            >
              ${tab.label}
            </button>
          `).join('')}
        </div>

        <!-- Anime Items Grid -->
        <div id="watchlist-grid-area">
          ${displayItems.length > 0 ? `
            <div class="anime-grid">
              ${displayItems.map(item => {
                // Adapt stored item to AnimeCard interface
                const animeObj = {
                  id: item.id,
                  title: { english: item.title, romaji: item.romajiTitle },
                  coverImage: { large: item.coverImage },
                  averageScore: item.averageScore,
                  episodes: item.episodes,
                  genres: item.genres,
                  status: item.status,
                };
                return AnimeCard.render(animeObj);
              }).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <div class="state-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h3 class="state-title">Your Watchlist is Empty</h3>
              <p class="state-desc">You haven't added any anime to this list yet. Explore popular and trending series to build your library.</p>
              <button type="button" class="btn-primary" onclick="window.router.navigate('/browse')">
                Explore Catalog
              </button>
            </div>
          `}
        </div>
      </div>
    `;

    // Bind tab events
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        this.currentTab = btn.getAttribute('data-tab');
        this.render(container);
      };
    });
  }
};
