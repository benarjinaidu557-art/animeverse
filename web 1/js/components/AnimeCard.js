/**
 * AnimeCard Component
 * Reusable card rendering with hover interactions, watchlist toggling, favorite toggling,
 * routing, and dedicated Verified YouTube streaming badges/actions.
 */

import { StorageService } from '../services/storageService.js';
import { AnimeService } from '../services/animeService.js';
import { escapeHtml } from '../utils/stringUtils.js';

export const AnimeCard = {
  /**
   * Generates HTML string for an Anime Card
   * @param {Object} anime - AniList Media object with optional verifiedSource
   * @param {Object} options - { isWatchable, hasHindi, showWatchBtn }
   */
  render(anime, options = {}) {
    if (!anime) return '';

    const id = anime.id;
    const title = AnimeService.formatTitle(anime.title);
    const score = AnimeService.formatScore(anime.averageScore);
    const status = AnimeService.formatStatus(anime.status);
    const statusClass = (anime.status || '').toLowerCase();
    const year = anime.seasonYear || '';
    const format = anime.format ? anime.format.replace('_', ' ') : 'TV';
    const poster = anime.coverImage?.large || anime.coverImage?.medium || anime.coverImage?.extraLarge || 'https://placehold.co/300x450/1e1b2e/c4b5fd?text=No+Poster';
    
    const isWatchlisted = StorageService.isInWatchlist(id);
    const isFavorite = StorageService.isFavorite(id);
    const genres = (anime.genres || []).slice(0, 2);

    const vs = anime.verifiedSource || options?.watchSource || anime.watchSource || null;
    const isWatchable = Boolean(options?.isWatchable || anime.isWatchable || anime.hasWatchSource || vs);
    const language = vs?.language || options?.language || anime.language || (options?.hasHindi ? 'Hindi Dub' : (anime.hasHindiDub ? 'Hindi Dub' : (isWatchable ? 'Official' : '')));
    const episodeLabel = vs?.episode_label || (anime.episodes ? `${anime.episodes} eps` : 'Full Episodes');
    const channelName = vs?.channel_name || 'YouTube Official';
    const watchUrl = vs?.source_url || (vs?.video_id ? `https://www.youtube.com/watch?v=${vs.video_id}` : null);

    const langLower = (language || '').toLowerCase();
    const langClass = langLower.includes('telugu') ? 'lang-telugu' : (langLower.includes('hindi') ? 'lang-hindi' : (langLower.includes('english') || langLower.includes('en-sub') ? 'lang-english' : ''));

    return `
      <article class="anime-card ${vs ? 'anime-card-verified' : ''}" data-anime-id="${id}">
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

          <!-- Verified Badges -->
          <div class="card-verified-badges-wrap">
            ${isWatchable ? `
              <span class="badge-yt-pill">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#ff0000">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span>${escapeHtml(channelName)}</span>
              </span>
            ` : ''}
            
            ${language ? `
              <span class="badge-lang-pill ${langClass}">
                ${escapeHtml(language)}
              </span>
            ` : ''}
          </div>

          <!-- Quick Actions Bar (Top Right) -->
          <div class="card-actions-quick" onclick="event.stopPropagation()">
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

          <!-- Episode Available Indicator -->
          <span class="card-badge-episodes-available">${escapeHtml(episodeLabel)}</span>
        </div>

        <div class="anime-card-content" onclick="window.router.navigate('/anime/${id}')">
          <h3 class="anime-card-title" title="${escapeHtml(title)}">${escapeHtml(title)}</h3>
          
          <div class="anime-card-meta">
            <span>${format}</span>
            ${year ? `<span>•</span><span>${year}</span>` : ''}
            <span>•</span>
            <span class="meta-status ${statusClass}">${status}</span>
          </div>

          <div class="anime-card-genres">
            ${genres.map(g => `<span class="genre-pill">${escapeHtml(g)}</span>`).join('')}
          </div>

          <!-- Watch on YouTube Button -->
          ${watchUrl ? `
            <div class="card-watch-footer" onclick="event.stopPropagation()">
              <a 
                href="${escapeHtml(watchUrl)}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="btn-card-watch-yt"
                title="Watch on YouTube (${escapeHtml(channelName)})"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                <span>Watch on YouTube</span>
              </a>
            </div>
          ` : ''}
        </div>
      </article>
    `;
  }
};

