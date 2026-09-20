/**
 * AnimeCard Component
 * Reusable card rendering with hover interactions, watchlist toggling, favorite toggling, and routing.
 */

import { StorageService } from '../services/storageService.js';
import { AnimeService } from '../services/animeService.js';

export const AnimeCard = {
  /**
   * Generates HTML string for an Anime Card
   * @param {Object} anime - AniList Media object
   */
  render(anime) {
    if (!anime) return '';

    const id = anime.id;
    const title = AnimeService.formatTitle(anime.title);
    const score = AnimeService.formatScore(anime.averageScore);
    const status = AnimeService.formatStatus(anime.status);
    const statusClass = (anime.status || '').toLowerCase();
    const year = anime.seasonYear || '';
    const format = anime.format ? anime.format.replace('_', ' ') : 'TV';
    const episodes = anime.episodes ? `${anime.episodes} eps` : 'Ongoing';
    const poster = anime.coverImage?.large || anime.coverImage?.medium || 'https://placehold.co/300x450/1e1b2e/c4b5fd?text=No+Poster';
    
    const isWatchlisted = StorageService.isInWatchlist(id);
    const isFavorite = StorageService.isFavorite(id);
    const genres = (anime.genres || []).slice(0, 2);

    return `
      <article class="anime-card" data-anime-id="${id}">
        <div class="anime-card-media" onclick="window.router.navigate('/anime/${id}')">
          <img 
            class="anime-card-poster" 
            src="${poster}" 
            alt="${escapeHtml(title)}" 
            loading="lazy"
            onerror="this.src='https://placehold.co/300x450/1e1b2e/c4b5fd?text=AnimeVerse';"
          />
          <div class="anime-card-overlay"></div>

          <!-- Score Badge -->
          ${anime.averageScore ? `
            <div class="card-badge-top">
              <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>${score}</span>
            </div>
          ` : ''}

          <!-- Quick Actions Bar (Top Right) -->
          <div style="position: absolute; top: 8px; right: 8px; display: flex; flex-direction: column; gap: 6px; z-index: 3;" onclick="event.stopPropagation()">
            <!-- Watchlist Bookmark Button -->
            <button 
              type="button" 
              class="card-action-bookmark ${isWatchlisted ? 'active' : ''}" 
              title="${isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}"
              data-action="toggle-watchlist"
              data-anime-id="${id}"
              aria-label="Add to Watchlist"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="${isWatchlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>

            <!-- Favorite Heart Button -->
            <button 
              type="button" 
              class="card-action-bookmark ${isFavorite ? 'active' : ''}" 
              style="${isFavorite ? 'background: #ec4899; color: #fff; border-color: #f472b6;' : ''}"
              title="${isFavorite ? 'Remove Favorite' : 'Mark Favorite'}"
              data-action="toggle-favorite"
              data-anime-id="${id}"
              aria-label="Mark as Favorite"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>

          <!-- Status Badge -->
          <span class="card-badge-status ${statusClass}">${status}</span>
          <span class="card-badge-episodes">${episodes}</span>
        </div>

        <div class="anime-card-content" onclick="window.router.navigate('/anime/${id}')">
          <h3 class="anime-card-title" title="${escapeHtml(title)}">${escapeHtml(title)}</h3>
          
          <div class="anime-card-meta">
            <span>${format}</span>
            ${year ? `<span>•</span><span>${year}</span>` : ''}
          </div>

          <div class="anime-card-genres">
            ${genres.map(g => `<span class="genre-pill">${escapeHtml(g)}</span>`).join('')}
          </div>
        </div>
      </article>
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
