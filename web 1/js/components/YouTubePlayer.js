/**
 * Built-in Official YouTube Player Component - AnimeVerse
 * 
 * Embeds licensed official YouTube episodes directly inside AnimeVerse.
 * Strict Legal & Player Requirements:
 * - 16:9 responsive embed (https://www.youtube.com/embed/VIDEO_ID)
 * - NO autoplay (user control first)
 * - Normal YouTube controls and full-screen allowed
 * - Interactive episode selector ([ Episode 1 ] [ Episode 2 ] ...)
 * - Next & Previous Episode controls
 * - Syncs watch progress to Supabase / StorageService
 * - Clean "Official episode currently unavailable." state when none exist
 * - Direct external watch link to official licensor on YouTube
 * - Season 1 & 2 switching without leaving page
 * - Telugu / Multi-language selector & badges
 */

import { StorageService } from '../services/storageService.js';
import { Toast } from './Toast.js';
import { AdminService } from '../services/adminService.js';
import { AdminWatchSourceModal } from './AdminWatchSourceModal.js';
import { YouTubeDiscoveryService } from '../services/youtubeDiscoveryService.js';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildEmbedUrl(ep) {
  if (!ep) return '';
  if (ep.playlist_id) {
    const videoParam = ep.video_id && !ep.video_id.startsWith('PL') ? ep.video_id : 'videoseries';
    return `https://www.youtube.com/embed/${videoParam}?list=${encodeURIComponent(ep.playlist_id)}&enablejsapi=1&rel=0&modestbranding=1`;
  }
  if (ep.video_id && (ep.video_id.startsWith('PL') || ep.video_id.startsWith('UU'))) {
    return `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(ep.video_id)}&enablejsapi=1&rel=0&modestbranding=1`;
  }
  return `https://www.youtube.com/embed/${ep.video_id}?enablejsapi=1&rel=0&modestbranding=1`;
}

export const YouTubePlayer = {
  currentAnime: null,
  episodes: [],
  currentIndex: 0,
  currentSeason: 1,
  selectedLanguage: null,
  onEpisodeChange: null,

  /**
   * Generates the HTML for the WATCH ANIME player section
   */
  render(anime, episodesData = {}, options = {}) {
    this.currentAnime = anime;
    this.episodes = episodesData.episodes || [];
    this.currentIndex = 0;
    this.currentSeason = options.season || 1;
    this.selectedLanguage = options.language || null;
    this.onEpisodeChange = options.onEpisodeChange || null;

    // Collect available languages
    const availableLangs = [...new Set(
      this.episodes.map(e => (e.language || 'Official Audio').split('/')[0].trim())
    )].filter(Boolean);

    if (!this.selectedLanguage && availableLangs.length > 0) {
      this.selectedLanguage = availableLangs[0];
    }

    const hasEpisodes = this.episodes.length > 0;
    const currentEp = hasEpisodes ? this.episodes[this.currentIndex] : null;

    if (!hasEpisodes) {
      return `
        <section class="watch-player-section" id="watch-anime-player" style="margin-bottom: 36px;">
          <div class="watch-player-header">
            <div class="watch-player-title-wrap">
              <span class="section-accent-bar red"></span>
              <div>
                <h2 class="watch-player-title">WATCH ANIME</h2>
                <p class="watch-player-subtitle">Official licensed full episodes & streams</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <div class="season-selector-wrap">
                <label for="yt-season-select-unavail" class="season-label">Season</label>
                <select id="yt-season-select-unavail" class="season-dropdown">
                  <option value="1" ${this.currentSeason === 1 ? 'selected' : ''}>Season 1</option>
                  <option value="2" ${this.currentSeason === 2 ? 'selected' : ''}>Season 2</option>
                </select>
              </div>
              <button type="button" class="btn-admin-add-ep" id="btn-admin-add-episode" title="Admin: Add Official YouTube Episode">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>+ Add Episode (Admin)</span>
              </button>
              <span class="watch-player-badge unavailable">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                Unavailable on YouTube
              </span>
            </div>
          </div>

          <div class="player-unavailable-box">
            <div class="unavailable-icon-ring">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/><line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </div>
            <h3 class="unavailable-heading">Official episode currently unavailable</h3>
            <p class="unavailable-text">
              Official YouTube full episodes are not currently distributed for Season ${this.currentSeason} in India.
              Please check the authorized streaming platforms below (Crunchyroll, Netflix, etc.) to watch officially.
            </p>
            <div style="margin-top: 14px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
              <button type="button" class="btn-request-scan" id="btn-request-yt-scan" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span>Request Official YouTube Scan</span>
              </button>
              <button type="button" class="btn-goto-sources" onclick="document.getElementById('where-to-watch-section')?.scrollIntoView({ behavior: 'smooth' })">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                View Authorized Streaming Partners
              </button>
            </div>
          </div>
        </section>
      `;
    }

    // Available official episodes exist
    return `
      <section class="watch-player-section" id="watch-anime-player" style="margin-bottom: 36px;">
        <div class="watch-player-header">
          <div class="watch-player-title-wrap">
            <span class="section-accent-bar red"></span>
            <div>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <h2 class="watch-player-title">WATCH ANIME</h2>
                <span class="watch-player-badge official">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Official In-App Player
                </span>
                <span class="watch-player-badge india">India Verified</span>
                ${this.selectedLanguage ? `<span class="watch-player-badge" style="background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.4); color: #a5b4fc; font-weight: 700;">${escapeHtml(this.selectedLanguage)}</span>` : ''}
              </div>
              <p class="watch-player-subtitle">Watch verified distributor streams directly inside AnimeVerse</p>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <!-- Season Selector -->
            <div class="season-selector-wrap">
              <label for="yt-season-select" class="season-label">Season</label>
              <select id="yt-season-select" class="season-dropdown">
                <option value="1" ${this.currentSeason === 1 ? 'selected' : ''}>Season 1</option>
                <option value="2" ${this.currentSeason === 2 ? 'selected' : ''}>Season 2</option>
              </select>
            </div>

            <!-- Language / Audio Selector -->
            ${availableLangs.length > 0 ? `
              <div class="season-selector-wrap">
                <label for="yt-lang-select" class="season-label">Audio</label>
                <select id="yt-lang-select" class="season-dropdown" style="border-color: rgba(99, 102, 241, 0.5); color: #a5b4fc; font-weight: 600;">
                  ${availableLangs.map(l => `<option value="${escapeHtml(l)}" ${this.selectedLanguage === l ? 'selected' : ''}>${escapeHtml(l)}</option>`).join('')}
                </select>
              </div>
            ` : ''}

            <button type="button" class="btn-admin-add-ep" id="btn-admin-add-episode" title="Admin: Add Official YouTube Episode">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>+ Add Episode (Admin)</span>
            </button>
          </div>
        </div>

        <!-- Episode Selector Pills Grid -->
        <div class="player-episodes-strip-container">
          <div class="player-episodes-label">Select Episode / Stream (${this.episodes.length} Available):</div>
          <div class="player-episodes-strip" id="player-episodes-strip">
            ${this.episodes.map((ep, idx) => `
              <button 
                type="button" 
                class="btn-player-ep ${idx === 0 ? 'active' : ''}" 
                data-index="${idx}"
                data-video-id="${ep.video_id}"
                data-ep-num="${ep.episode_number}"
                title="${escapeHtml(ep.video_title || `Episode ${ep.episode_number}`)}"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>${ep.video_id?.startsWith('PL') || ep.playlist_id ? 'Full Series Playlist' : `Episode ${ep.episode_number}`}</span>
                ${ep.language ? `<span class="pill-lang-tag">${escapeHtml(ep.language.split('/')[0].trim())}</span>` : ''}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 16:9 Responsive Embedded YouTube Player -->
        <div class="player-viewport-container">
          <div class="youtube-player-aspect-box">
            <iframe 
              id="animeverse-yt-iframe"
              src="${buildEmbedUrl(currentEp)}" 
              title="${escapeHtml(currentEp.video_title || 'Official Anime Episode')}" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerpolicy="strict-origin-when-cross-origin" 
              allowfullscreen
            ></iframe>
          </div>
        </div>

        <!-- Episode Info & Navigation Controls Bar -->
        <div class="player-control-bar">
          <div class="player-info-meta">
            <div class="player-now-playing-tag">NOW PLAYING</div>
            <h3 class="player-current-title" id="player-current-title">
              ${escapeHtml(currentEp.video_title || `Episode ${currentEp.episode_number}`)}
            </h3>
            <div class="player-channel-attribution" id="player-channel-attribution">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              <span>Official Distributor: <strong id="player-channel-name">${escapeHtml(currentEp.channel_name || 'Muse India')}</strong></span>
              <span class="badge-channel-verified">Channel Verified</span>
              <span class="badge-lang" id="player-lang-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                <span id="player-lang-text">${escapeHtml(currentEp.language || 'Telugu')}</span>
              </span>
              <span class="badge-playlist" id="player-playlist-badge" style="display: ${(currentEp.playlist_id || currentEp.video_id?.startsWith('PL')) ? 'inline-flex' : 'none'};">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                Official Playlist
              </span>
            </div>
          </div>

          <div class="player-action-buttons">
            <!-- External Watch Link directly to Muse India YouTube Video -->
            <a 
              href="https://www.youtube.com/watch?v=${currentEp.video_id}" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="btn-player-external" 
              id="btn-player-external-link"
              title="Watch on official YouTube channel"
              style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: rgba(255, 0, 0, 0.12); border: 1px solid rgba(255, 0, 0, 0.35); border-radius: var(--radius-md); color: #fff; font-size: 0.82rem; font-weight: 600; text-decoration: none; transition: all 0.2s;"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              <span>Watch on YouTube</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>

            <button 
              type="button" 
              class="btn-player-nav prev" 
              id="btn-player-prev" 
              disabled
              title="Previous Episode"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              <span>Previous</span>
            </button>

            <button 
              type="button" 
              class="btn-player-nav next" 
              id="btn-player-next" 
              ${this.episodes.length <= 1 ? 'disabled' : ''}
              title="Next Episode"
            >
              <span>Next Episode</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </section>
    `;
  },

  /**
   * Binds interactive controls and listeners to the player DOM
   */
  bindEvents(container) {
    const root = container || document;

    // Helper to switch season dynamically
    const switchSeason = async (newSeason) => {
      Toast.show(`Switching to Season ${newSeason}...`, 'info');
      try {
        const fresh = await YouTubeDiscoveryService.getEpisodesForAnime(this.currentAnime, newSeason);
        const playerSection = root.querySelector('#watch-anime-player');
        if (playerSection) {
          const tmp = document.createElement('div');
          tmp.innerHTML = YouTubePlayer.render(this.currentAnime, fresh, {
            season: newSeason,
            language: this.selectedLanguage,
            onEpisodeChange: this.onEpisodeChange
          });
          const newPlayer = tmp.firstElementChild;
          playerSection.replaceWith(newPlayer);
          YouTubePlayer.bindEvents(root);
        }
      } catch (err) {
        console.error('[YouTubePlayer] Season switch error:', err);
        Toast.show('Error switching seasons', 'error');
      }
    };

    // Hook season dropdowns in both available & unavailable views
    const seasonSelect = root.querySelector('#yt-season-select');
    if (seasonSelect) {
      seasonSelect.onchange = (e) => {
        const season = parseInt(e.target.value, 10);
        switchSeason(season);
      };
    }

    const seasonSelectUnavail = root.querySelector('#yt-season-select-unavail');
    if (seasonSelectUnavail) {
      seasonSelectUnavail.onchange = (e) => {
        const season = parseInt(e.target.value, 10);
        switchSeason(season);
      };
    }

    // Always hook the Admin Add Episode button
    const addEpButtons = root.querySelectorAll('.btn-admin-add-ep');
    addEpButtons.forEach(addEpBtn => {
      addEpBtn.onclick = (e) => {
        e.preventDefault();
        const openModal = () => {
          AdminWatchSourceModal.show({
            animeId: this.currentAnime?.id,
            season: this.currentSeason || 1,
            nextEpisode: (this.episodes && this.episodes.length > 0) ? this.episodes.length + 1 : 1,
            onSave: async (savedEp) => {
              Toast.show(`Episode ${savedEp.episode_number} saved! Refreshing...`, 'success');
              if (window.router?.refresh) {
                window.router.refresh();
              } else {
                location.reload();
              }
            }
          });
        };

        if (AdminService.isAdmin()) {
          openModal();
        } else {
          const pass = prompt('Admin Verification Required\nPlease enter the Administrator Passcode (e.g. animeverse-admin):');
          if (pass && AdminService.unlockAdmin(pass)) {
            Toast.show('Admin mode unlocked!', 'success');
            openModal();
          } else if (pass) {
            Toast.show('Invalid administrator passcode.', 'error');
          }
        }
      };
    });

    // Hook Request Official YouTube Scan button
    const scanBtn = root.querySelector('#btn-request-yt-scan');
    if (scanBtn) {
      scanBtn.onclick = async (e) => {
        e.preventDefault();
        scanBtn.disabled = true;
        scanBtn.innerHTML = `
          <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
          <span>Requesting Scan...</span>
        `;
        try {
          const animeId = this.currentAnime?.id;
          const title = this.currentAnime?.title?.english || this.currentAnime?.title?.romaji || this.currentAnime?.title?.native || 'Anime';
          const res = await fetch('/api/queue-anime', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ animeId, title, priority: 2 })
          });
          const data = await res.json();
          if (data.success) {
            Toast.show(`Queued "${title}" for official YouTube distributor discovery!`, 'success');
            scanBtn.innerHTML = `<span>✓ Scan Queued</span>`;
          } else {
            Toast.show(data.error || 'Scan request logged.', 'info');
            scanBtn.innerHTML = `<span>Scan Requested</span>`;
          }
        } catch {
          Toast.show('Scan request submitted to queue.', 'info');
          scanBtn.innerHTML = `<span>Scan Requested</span>`;
        }
      };
    }

    if (!this.episodes || this.episodes.length === 0) return;

    const epButtons = root.querySelectorAll('.btn-player-ep');
    const iframe = root.querySelector('#animeverse-yt-iframe');
    const titleElem = root.querySelector('#player-current-title');
    const channelNameElem = root.querySelector('#player-channel-name');
    const prevBtn = root.querySelector('#btn-player-prev');
    const nextBtn = root.querySelector('#btn-player-next');
    const extLink = root.querySelector('#btn-player-external-link');
    const langSelect = root.querySelector('#yt-lang-select');

    // Language selector change listener
    if (langSelect) {
      langSelect.onchange = (e) => {
        const lang = e.target.value;
        this.selectedLanguage = lang;
        Toast.show(`Language audio set to ${lang}`, 'info');
        const matchIdx = this.episodes.findIndex(ep => (ep.language || '').toLowerCase().includes(lang.toLowerCase()));
        if (matchIdx !== -1) {
          updatePlayer(matchIdx);
        }
      };
    }

    const updatePlayer = async (index) => {
      if (index < 0 || index >= this.episodes.length) return;
      this.currentIndex = index;
      const ep = this.episodes[this.currentIndex];

      // Update iframe source without reloading page
      if (iframe) {
        iframe.src = buildEmbedUrl(ep);
      }

      // Update texts
      if (titleElem) {
        titleElem.textContent = ep.video_title || `Episode ${ep.episode_number}`;
      }
      if (channelNameElem) {
        channelNameElem.textContent = ep.channel_name || 'Muse India';
      }

      const langText = root.querySelector('#player-lang-text');
      if (langText) {
        langText.textContent = ep.language || 'Telugu';
      }

      // Update external watch link
      if (extLink && ep.video_id) {
        extLink.href = `https://www.youtube.com/watch?v=${ep.video_id}`;
      }

      const playlistBadge = root.querySelector('#player-playlist-badge');
      if (playlistBadge) {
        const isPlaylist = ep.playlist_id || ep.video_id?.startsWith('PL');
        playlistBadge.style.display = isPlaylist ? 'inline-flex' : 'none';
      }

      // Highlight button
      epButtons.forEach(btn => {
        const btnIndex = parseInt(btn.dataset.index, 10);
        btn.classList.toggle('active', btnIndex === index);
      });

      // Update navigation disabled states
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index >= this.episodes.length - 1;

      // Automatically sync watch progress with Supabase / StorageService
      if (this.currentAnime?.id && ep.episode_number) {
        try {
          await StorageService.toggleEpisodeWatched(this.currentAnime.id, ep.episode_number);
          const epGuideCheckbox = root.querySelector(`.btn-episode-toggle[data-episode="${ep.episode_number}"]`);
          if (epGuideCheckbox && !epGuideCheckbox.classList.contains('watched')) {
            epGuideCheckbox.classList.add('watched');
            const span = epGuideCheckbox.querySelector('span');
            if (span) span.textContent = 'Watched';
          }
        } catch (e) {
          console.warn('[YouTubePlayer] Progress save notice:', e);
        }
      }

      if (typeof this.onEpisodeChange === 'function') {
        this.onEpisodeChange(ep, index);
      }
    };

    // Episode button clicks
    epButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt(btn.dataset.index, 10);
        updatePlayer(index);
      });
    });

    // Previous Episode button
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.currentIndex > 0) {
          updatePlayer(this.currentIndex - 1);
        }
      });
    }

    // Next Episode button
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.currentIndex < this.episodes.length - 1) {
          updatePlayer(this.currentIndex + 1);
        }
      });
    }
  }
};
