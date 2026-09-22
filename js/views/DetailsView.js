/**
 * Anime Details View - AnimeVerse
 * Full metadata presentation with banner, characters, staff, relations,
 * interactive episode tracker, authorized streaming sources,
 * and Community System (1-10 Ratings, Reviews, Comments, Likes, and Moderation).
 */

import { AnimeService } from '../services/animeService.js';
import { StorageService } from '../services/storageService.js';
import { CommunityService } from '../services/communityService.js';
import { AuthService } from '../services/authService.js';
import { AnimeCard } from '../components/AnimeCard.js';
import { Skeletons } from '../components/Skeletons.js';
import { Toast } from '../components/Toast.js';
import { AdSlot } from '../components/AdSlot.js';
import { SeoService } from '../services/seoService.js';
import { OfficialWatchService } from '../services/officialWatchService.js';
import { YouTubeDiscoveryService } from '../services/youtubeDiscoveryService.js';
import { YouTubePlayer } from '../components/YouTubePlayer.js';
import { escapeHtml } from '../utils/stringUtils.js';

export const DetailsView = {
  activeAnime: null,
  activeRatings: null,
  activeReviews: [],
  activeComments: [],
  container: null,

  async render(container, params = {}) {
    this.container = container || document.getElementById('app-root');
    const rootContainer = this.container;
    const animeId = params.id;
    if (!animeId) {
      window.router.navigate('/browse');
      return;
    }

    if (!rootContainer) {
      console.error('[DetailsView] No root container element found.');
      return;
    }

    // Render loading skeleton
    rootContainer.innerHTML = Skeletons.renderDetailsSkeleton();

    try {
      const anime = await AnimeService.getAnimeDetails(animeId);
      if (!anime) {
        throw new Error('Anime not found in AniList database.');
      }

      this.activeAnime = anime;
      const realId = anime.id;
      
      // Load community data concurrently with complete error isolation
      let ratings = { averageRating: 0, count: 0, userRating: null, distribution: {} };
      let reviews = [];
      let comments = [];
      try {
        const [r, rev, com] = await Promise.all([
          CommunityService.getAnimeRatings(realId).catch(err => {
            console.warn('[CommunityService] Ratings load error (non-fatal):', err);
            return { averageRating: 0, count: 0, userRating: null, distribution: {} };
          }),
          CommunityService.getAnimeReviews(realId).catch(err => {
            console.warn('[CommunityService] Reviews load error (non-fatal):', err);
            return [];
          }),
          CommunityService.getAnimeComments(realId).catch(err => {
            console.warn('[CommunityService] Comments load error (non-fatal):', err);
            return [];
          }),
        ]);
        if (r) ratings = r;
        if (rev) reviews = rev;
        if (com) comments = com;
      } catch (commErr) {
        console.warn('[DetailsView] Community data fetch error:', commErr);
      }

      this.activeRatings = ratings;
      this.activeReviews = reviews;
      this.activeComments = comments;

      // Discover official YouTube episodes with Supabase caching
      let watchSources = { episodes: [], hasOfficialEpisodes: false };
      const initialSeason = (Number(anime.id) === 101338 || (anime.title?.english || '').includes('Season 2') || (anime.title?.english || '').includes(' II')) ? 2 : 1;
      this.activeSeason = initialSeason;
      try {
        watchSources = await YouTubeDiscoveryService.getEpisodesForAnime(anime, initialSeason);
      } catch (ytErr) {
        console.warn('[DetailsView] YouTube episode discovery notice:', ytErr);
      }
      this.activeWatchSources = watchSources;

      // Update Dynamic SEO & Structured Data safely
      try {
        const displayTitle = AnimeService.formatTitle(anime.title);
        SeoService.update({
          title: displayTitle,
          description: (anime.description || '').replace(/<[^>]*>?/gm, '').slice(0, 160) || `Explore ${displayTitle} on AnimeVerse`,
          image: anime.bannerImage || anime.coverImage?.large,
          type: 'video.tv_show',
          schemaJson: {
            '@context': 'https://schema.org',
            '@type': anime.format === 'MOVIE' ? 'Movie' : 'TVSeries',
            'name': displayTitle,
            'description': (anime.description || '').replace(/<[^>]*>?/gm, ''),
            'image': anime.coverImage?.large || anime.bannerImage,
            'genre': anime.genres || [],
            'startDate': anime.startDate?.year ? `${anime.startDate.year}` : undefined,
            'numberOfEpisodes': anime.episodes || undefined,
            'aggregateRating': (ratings?.count > 0) ? {
              '@type': 'AggregateRating',
              'ratingValue': ratings.averageRating,
              'ratingCount': ratings.count,
              'bestRating': 10,
              'worstRating': 1
            } : undefined
          }
        });
      } catch (seoErr) {
        console.warn('[DetailsView] SEO update error (non-fatal):', seoErr);
      }

      this.renderContent(rootContainer, anime);
    } catch (error) {
      console.error('Details page render error:', error);
      const is404 = (error.message && (error.message.includes('404') || error.message.includes('not found') || error.message.includes('Not Found')));
      rootContainer.innerHTML = `
        <div class="container" style="padding-top: 40px; padding-bottom: 60px;">
          <div class="error-state" style="max-width: 580px; margin: 0 auto; text-align: center; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 20px; padding: 48px 32px;">
            <div class="state-icon" style="width: 64px; height: 64px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; background: rgba(168, 85, 247, 0.1); border-radius: 50%; color: var(--accent-purple-light);">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 class="state-title" style="font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 10px;">
              ${is404 ? 'Anime Not Found' : 'Unable to Load Anime Details'}
            </h2>
            <p class="state-desc" style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 24px; line-height: 1.6;">
              ${is404 ? `We could not find an anime matching "${escapeHtml(animeId)}" in the AniList catalog. It may have been removed or the link may be mistyped.` : (error.message || 'We could not load information for this anime from AniList.')}
            </p>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
              <button type="button" class="btn-primary" onclick="window.router.refresh()" style="padding: 10px 24px;">Retry</button>
              <button type="button" class="btn-secondary" onclick="window.router.navigate('/browse')" style="padding: 10px 24px;">Browse Catalog</button>
              <button type="button" class="btn-secondary" onclick="window.router.navigate('/')" style="padding: 10px 24px;">Go Home</button>
            </div>
          </div>
        </div>
      `;
    }
  },

  renderContent(container, anime) {
    const id = anime.id;
    const title = AnimeService.formatTitle(anime.title);
    const romajiTitle = anime.title?.romaji || '';
    const nativeTitle = anime.title?.native || '';
    const englishTitle = anime.title?.english || '';
    const banner = anime.bannerImage || anime.coverImage?.extraLarge || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80';
    const poster = anime.coverImage?.large || anime.coverImage?.medium || 'https://placehold.co/300x450/1e1b2e/c4b5fd?text=No+Poster';
    const score = AnimeService.formatScore(anime.averageScore);
    const status = AnimeService.formatStatus(anime.status);
    const seasonYear = anime.seasonYear || '';
    const season = anime.season ? anime.season.charAt(0) + anime.season.slice(1).toLowerCase() : '';
    const episodeCount = anime.episodes || 0;
    const duration = anime.duration ? `${anime.duration} mins` : '';
    const mainStudio = anime.studios?.nodes?.[0]?.name || 'Unknown Studio';
    const synopsis = anime.description ? anime.description.replace(/<[^>]*>?/gm, '') : 'No synopsis available.';
    const genres = anime.genres || [];
    const relations = (anime.relations?.edges || []).slice(0, 6);
    const characters = (anime.characters?.edges || []).slice(0, 8);
    const staff = (anime.staff?.edges || []).slice(0, 4);

    const isWatchlisted = StorageService.isInWatchlist(id);
    const isFavorite = StorageService.isFavorite(id);
    const isFollowing = StorageService.isFollowing ? StorageService.isFollowing(id) : false;
    const watchedEpisodes = StorageService.getWatchedEpisodes(id);

    // Prepare episode list
    const streamingEps = anime.streamingEpisodes || [];
    const totalEpsToDisplay = episodeCount > 0 ? episodeCount : (streamingEps.length > 0 ? streamingEps.length : 12);
    
    const episodesList = Array.from({ length: Math.min(totalEpsToDisplay, 100) }, (_, i) => {
      const epNum = i + 1;
      const matchedStreaming = streamingEps.find(se => se.title && se.title.includes(`Episode ${epNum}`));
      return {
        number: epNum,
        title: matchedStreaming ? matchedStreaming.title : `Episode ${epNum}`,
        isWatched: watchedEpisodes.includes(epNum),
        streamUrl: matchedStreaming ? matchedStreaming.url : null,
      };
    });

    // Official & Licensed viewing sources (YouTube, Muse, Ani-One, Crunchyroll, Netflix, etc.)
    const watchData = OfficialWatchService.getWatchSources(anime);
    const { youtubeSources, platformSources, hasAnyOfficialSource, isIndiaPreferred } = watchData;

    const ratings = this.activeRatings || { averageRating: 0, count: 0, userRating: null };
    const reviews = this.activeReviews || [];
    const comments = this.activeComments || [];
    const currentUser = AuthService.getUser();

    container.innerHTML = `
      <div class="container" style="padding-top: 16px; padding-bottom: 60px;">
        <!-- Back Button & Breadcrumbs -->
        <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px; font-size: 0.88rem; color: var(--text-muted);">
          <a href="#/browse" style="display: flex; align-items: center; gap: 4px; color: var(--accent-purple-light); text-decoration: none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            Browse
          </a>
          <span>/</span>
          <span style="color: var(--text-secondary); max-width: min(240px, 45vw); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(title)}</span>
        </div>

        <!-- Hero Header with Banner -->
        <div class="details-hero">
          <img class="details-banner-img" src="${banner}" alt="${escapeHtml(title)}" onerror="this.src='https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80';" />
          <div class="details-banner-gradient"></div>

          <div class="details-header-content">
            <!-- Left: Poster & Action Buttons -->
            <div class="details-poster-wrap">
              <img src="${poster}" alt="${escapeHtml(title)}" />
              <div class="details-poster-actions">
                <button type="button" class="btn-primary" id="details-btn-watchlist" style="width: 100%;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="${isWatchlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span id="details-watchlist-text">${isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}</span>
                </button>
                <button type="button" class="btn-secondary" id="details-btn-favorite" style="width: 100%;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFavorite ? '#ec4899' : 'none'}" stroke="${isFavorite ? '#ec4899' : 'currentColor'}" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span id="details-fav-text">${isFavorite ? 'Favorited' : 'Favorite'}</span>
                </button>
                <button type="button" class="btn-secondary" id="details-btn-follow" style="width: 100%;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFollowing ? 'var(--accent-cyan)' : 'none'}" stroke="${isFollowing ? 'var(--accent-cyan)' : 'currentColor'}" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8" x2="20" y2="14"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                  </svg>
                  <span id="details-follow-text">${isFollowing ? 'Following' : 'Follow Anime'}</span>
                </button>
                <a href="#/compare?id1=${id}" class="btn-secondary" style="width: 100%; text-align: center; font-size: 0.8rem; padding: 8px 12px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; text-decoration: none;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>
                  Compare Anime
                </a>
              </div>
            </div>

            <!-- Right: Title, Alternative Titles, Metadata Pills -->
            <div class="details-info-primary">
              <h1 class="details-title-romaji">${escapeHtml(title)}</h1>
              ${englishTitle && englishTitle !== title ? `<p style="font-size: 1.05rem; color: var(--text-secondary); margin-bottom: 4px;">${escapeHtml(englishTitle)}</p>` : ''}
              ${nativeTitle ? `<p class="details-title-native">${escapeHtml(nativeTitle)}</p>` : ''}

              <!-- Badges & Stats -->
              <div class="details-meta-pills">
                ${anime.averageScore ? `<span class="meta-pill score">★ ${score} AniList</span>` : ''}
                <span class="meta-pill" style="background: rgba(139, 92, 246, 0.2); color: #c4b5fd; border: 1px solid rgba(139, 92, 246, 0.4);">
                  ★ ${ratings.count > 0 ? ratings.averageRating : '—'}/10 Community (${ratings.count})
                </span>
                <span class="meta-pill">${status}</span>
                ${season ? `<span class="meta-pill">${season} ${seasonYear}</span>` : ''}
                ${episodeCount ? `<span class="meta-pill">${episodeCount} Episodes</span>` : ''}
                ${duration ? `<span class="meta-pill">${duration}</span>` : ''}
                ${mainStudio ? `<span class="meta-pill">${escapeHtml(mainStudio)}</span>` : ''}
              </div>

              <!-- Genres -->
              <div class="details-genres">
                ${genres.map(g => `<a href="#/browse?genre=${encodeURIComponent(g)}" class="genre-pill" style="text-decoration: none;">${escapeHtml(g)}</a>`).join('')}
              </div>

              <!-- Synopsis -->
              <div class="details-synopsis">
                <p>${escapeHtml(synopsis)}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Community Rating Widget Bar -->
        <section class="rating-widget-card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 20px 24px; margin-bottom: 32px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 20px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
              <span style="font-size: 1.3rem; font-weight: 800; color: #fff;">Community Rating</span>
              <span style="background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.4); color: #fbbf24; font-size: 0.85rem; font-weight: 800; padding: 2px 8px; border-radius: var(--radius-full);">
                ★ ${ratings.count > 0 ? ratings.averageRating : 'No ratings yet'}
              </span>
            </div>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">
              ${ratings.count} total fan score${ratings.count === 1 ? '' : 's'} submitted by AnimeVerse members.
            </p>
          </div>

          <!-- User Rating Interaction (1 - 10) -->
          <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px; width: 100%; max-width: 400px;">
            <div style="font-size: 0.85rem; color: #cbd5e1; font-weight: 600;">
              ${ratings.userRating ? `Your Rating: <span style="color: #fbbf24; font-weight: 800;">${ratings.userRating} / 10</span>` : 'Rate this anime (1 - 10):'}
            </div>
            <div class="rating-stars-row" style="display: flex; gap: 4px; flex-wrap: wrap; max-width: 100%;">
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => `
                <button 
                  type="button" 
                  class="btn-rate-star ${ratings.userRating && ratings.userRating >= val ? 'active' : ''}" 
                  data-rating="${val}" 
                  title="Rate ${val}/10"
                  style="
                    width: 32px; 
                    height: 32px; 
                    border-radius: 8px; 
                    background: ${ratings.userRating && ratings.userRating >= val ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255,255,255,0.05)'}; 
                    border: 1px solid ${ratings.userRating && ratings.userRating >= val ? '#fbbf24' : 'rgba(255,255,255,0.1)'}; 
                    color: ${ratings.userRating && ratings.userRating >= val ? '#fbbf24' : '#64748b'}; 
                    font-weight: 700; 
                    font-size: 0.8rem; 
                    cursor: pointer; 
                    transition: all 0.15s;
                  "
                >
                  ${val}
                </button>
              `).join('')}
            </div>
          </div>
        </section>

        <!-- WATCH ANIME - Built-in Official YouTube Player -->
        ${YouTubePlayer.render(anime, this.activeWatchSources, { season: this.activeSeason })}

        <!-- Where to Watch Officially Section -->
        <section id="where-to-watch-section" class="watch-officially-card authorized-sources-card" style="margin-bottom: 32px;">
          <div class="watch-section-header">
            <div class="watch-title-group">
              <div class="watch-badge-official">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Where to Watch Officially</span>
              </div>
              <h2 style="font-size: 1.25rem; font-weight: 700; margin: 0; color: #fff;">100% Legal & Licensed Viewing</h2>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              ${isIndiaPreferred ? `
                <span class="watch-badge-india">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                  India & South Asia Verified
                </span>
              ` : ''}
              <span class="anti-piracy-badge">Anti-Piracy Compliant &bull; Official External Links Only</span>
            </div>
          </div>

          ${youtubeSources.length > 0 ? `
            <!-- Verified Official YouTube Streaming -->
            <div class="youtube-official-banner">
              <div class="youtube-banner-header">
                <div class="youtube-icon-pill animeverse-watch-pill">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 1.05rem; color: #fff; display: flex; align-items: center; gap: 8px;">
                    Free Official Streams
                    <span style="font-size: 0.72rem; background: #22c55e; color: #000; font-weight: 800; padding: 2px 7px; border-radius: 9999px;">FREE TO WATCH</span>
                  </div>
                  <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;">
                    Legally licensed by official distributors for India & South Asia &bull; <span class="source-sublabel" style="font-size: 0.76rem; color: var(--text-dim);">Verified YouTube source</span>
                  </div>
                </div>
              </div>

              <div class="youtube-sources-grid">
                ${youtubeSources.map(yt => `
                  <a href="${yt.url}" target="_blank" rel="noopener noreferrer" class="youtube-source-card" title="Watch Episode (Verified YouTube source — Opens on YouTube)">
                    <div style="min-width: 0;">
                      <div style="font-weight: 700; font-size: 0.95rem; color: #fff; margin-bottom: 2px; display: flex; align-items: center; gap: 6px;">
                        ${escapeHtml(yt.name)}
                        ${yt.isIndia ? `<span class="source-badge-india-mini">India</span>` : ''}
                      </div>
                      <div style="font-size: 0.76rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${escapeHtml(yt.description || 'Official Full Episodes / Clips')}
                      </div>
                      <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 4px;">
                        Verified YouTube source
                      </div>
                    </div>
                    <span class="youtube-card-btn animeverse-play-btn">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      Watch Episode
                    </span>
                  </a>
                `).join('')}
              </div>
            </div>
          ` : `
            <div style="margin-bottom: 18px; padding: 12px 16px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); display: flex; align-items: center; gap: 10px; font-size: 0.82rem; color: var(--text-muted);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-dim); flex-shrink: 0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>Official YouTube stream is not currently available for this title in India. Check the licensed subscription platforms below.</span>
            </div>
          `}

          <!-- Licensed Streaming Platforms -->
          <div>
            <div class="sources-disclaimer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Verified Subscription & Licensed Platforms</span>
            </div>

            ${platformSources.length > 0 ? `
              <div class="sources-grid">
                ${platformSources.map(source => {
                  const siteName = source.name || 'Official Stream';
                  const cleanSite = source.key || 'external';
                  return `
                    <a href="${source.url}" target="_blank" rel="noopener noreferrer" class="source-item-btn" title="Watch officially on ${escapeHtml(siteName)}">
                      <div class="source-item-info">
                        <span class="source-logo-pill ${cleanSite}">${escapeHtml(siteName)}</span>
                        <div style="min-width: 0;">
                          <div style="font-size: 0.88rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 6px;">
                            ${escapeHtml(source.badge || `Watch on ${siteName}`)}
                            ${source.isIndia ? `<span class="source-badge-india-mini">India</span>` : ''}
                          </div>
                          <div style="font-size: 0.72rem; color: var(--text-muted);">
                            ${escapeHtml(source.type || 'Official Partner')}
                          </div>
                        </div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0; color: var(--text-dim);"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  `;
                }).join('')}
              </div>
            ` : (youtubeSources.length === 0 ? `
              <div class="sources-empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 8px; color: var(--text-dim);"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                <div style="font-weight: 600; font-size: 0.95rem; color: #fff; margin-bottom: 4px;">Official source not currently available</div>
                <div style="font-size: 0.82rem; color: var(--text-dim); max-width: 480px; margin: 0 auto;">
                  No verified licensed streaming links are listed for your region right now. We do not link to pirate or unauthorized streaming services.
                </div>
              </div>
            ` : '')}
          </div>

          <!-- AniList Legal External Streaming Episodes (when present) -->
          ${(anime.streamingEpisodes && anime.streamingEpisodes.length > 0) ? `
            <div class="streaming-episodes-section" style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-subtle);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="section-accent-bar" style="background: var(--accent-cyan); width: 4px; height: 16px; border-radius: 2px;"></span>
                  <h3 style="font-size: 1rem; font-weight: 700; color: #fff; margin: 0;">
                    Official Streaming Episodes (${anime.streamingEpisodes.length})
                  </h3>
                  <span style="font-size: 0.72rem; background: rgba(56, 189, 248, 0.15); color: var(--accent-cyan); padding: 2px 8px; border-radius: 6px; font-weight: 700;">
                    via ${escapeHtml(anime.streamingEpisodes[0]?.site || 'Authorized Licensor')}
                  </span>
                </div>
                <span style="font-size: 0.78rem; color: var(--text-dim);">Direct official partner links</span>
              </div>

              <div class="streaming-episodes-carousel" style="display: flex; gap: 14px; overflow-x: auto; padding-bottom: 12px; scrollbar-width: thin;">
                ${anime.streamingEpisodes.map((ep, idx) => `
                  <a 
                    href="${ep.url}" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="streaming-ep-card" 
                    title="${escapeHtml(ep.title || `Episode ${idx + 1}`)}"
                    style="
                      flex: 0 0 220px; 
                      background: rgba(255,255,255,0.03); 
                      border: 1px solid var(--border-subtle); 
                      border-radius: 12px; 
                      overflow: hidden; 
                      text-decoration: none; 
                      display: flex; 
                      flex-direction: column; 
                      transition: all 0.2s ease;
                    "
                    onmouseenter="this.style.borderColor='var(--accent-purple)'; this.style.transform='translateY(-2px)'"
                    onmouseleave="this.style.borderColor='var(--border-subtle)'; this.style.transform='translateY(0)'"
                  >
                    <div style="position: relative; width: 100%; aspect-ratio: 16/9; background: #0b0d14; overflow: hidden;">
                      <img 
                        src="${ep.thumbnail || 'https://placehold.co/320x180/1a1a2e/ffffff?text=Episode'}" 
                        alt="${escapeHtml(ep.title || 'Official Stream')}" 
                        style="width: 100%; height: 100%; object-fit: cover;" 
                        loading="lazy" 
                      />
                      <div style="position: absolute; inset: 0; background: linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.8) 100%);"></div>
                      <span style="position: absolute; bottom: 6px; left: 8px; font-size: 0.68rem; font-weight: 800; color: #fff; background: rgba(0,0,0,0.7); padding: 1px 6px; border-radius: 4px;">
                        ${escapeHtml(ep.site || 'Legal Stream')}
                      </span>
                      <span style="position: absolute; top: 6px; right: 6px; width: 22px; height: 22px; border-radius: 50%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: #fff;">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </span>
                    </div>
                    <div style="padding: 10px 12px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                      <div style="font-size: 0.82rem; font-weight: 600; color: #fff; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${escapeHtml(ep.title || `Episode ${idx + 1}`)}
                      </div>
                      <div style="font-size: 0.72rem; color: var(--accent-purple-light); margin-top: 6px; display: flex; align-items: center; gap: 4px;">
                        <span>Watch on ${escapeHtml(ep.site || 'Site')}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </div>
                    </div>
                  </a>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="anti-piracy-footer">
            <div style="display: flex; align-items: center; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
              <span>AnimeVerse exclusively indexes official YouTube distributors (Ani-One, Muse) and legal licensed platforms.</span>
            </div>
            <span>External links open directly in distributor apps or websites.</span>
          </div>
        </section>

        <!-- Advertisement Placement -->
        ${AdSlot.render('banner', 'details-mid-banner')}

        <!-- Episode List Section with Tracker -->
        <section class="episode-list-container">
          <div class="section-header" style="margin-bottom: 0;">
            <div class="section-title-wrap">
              <span class="section-accent-bar pink"></span>
              <div>
                <h2 class="section-title">Episode Guide & Tracker</h2>
                <p class="section-subtitle">Track your progress and mark watched episodes</p>
              </div>
            </div>
            <span style="font-size: 0.85rem; color: var(--accent-purple-light); font-weight: 600;" id="episodes-progress-counter">
              ${watchedEpisodes.length} / ${episodesList.length} Watched
            </span>
          </div>

          <div class="episode-grid">
            ${episodesList.map(ep => `
              <div class="episode-item ${ep.isWatched ? 'watched' : ''}" id="episode-row-${ep.number}">
                <div class="episode-info">
                  <span class="episode-num-badge">${ep.number}</span>
                  <div>
                    <span class="episode-title">${escapeHtml(ep.title)}</span>
                  </div>
                </div>
                <div class="episode-actions">
                  <button 
                    type="button" 
                    class="btn-episode-toggle ${ep.isWatched ? 'watched' : ''}" 
                    data-action="toggle-episode" 
                    data-anime-id="${id}" 
                    data-episode="${ep.number}"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>${ep.isWatched ? 'Watched' : 'Mark'}</span>
                  </button>
                  ${ep.streamUrl ? `
                    <a href="${ep.streamUrl}" target="_blank" rel="noopener noreferrer" class="btn-watch-stream" title="Watch on official source">
                      Watch
                    </a>
                  ` : `
                    <button type="button" class="btn-watch-stream" onclick="document.querySelector('.authorized-sources-card')?.scrollIntoView({ behavior: 'smooth' })">
                      Sources
                    </button>
                  `}
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Characters Section (Linked to Character Profiles) -->
        ${characters.length > 0 ? `
          <section class="section-container">
            <div class="section-header">
              <div class="section-title-wrap">
                <span class="section-accent-bar cyan"></span>
                <h2 class="section-title">Characters & Voice Cast</h2>
              </div>
              <a href="#/characters" style="font-size: 0.85rem; color: var(--accent-purple-light); font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 4px;">
                Browse Character Database
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
            </div>
            <div class="character-grid">
              ${characters.map(edge => {
                if (!edge || !edge.node) return '';
                const char = edge.node;
                const va = edge.voiceActors?.[0];
                return `
                  <a href="#/character/${char.id}" class="character-card" style="text-decoration: none; color: inherit; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;">
                    <img 
                      class="character-thumb" 
                      src="${char.image?.medium || 'https://placehold.co/100x100/1e1b2e/c4b5fd?text=Character'}" 
                      alt="${escapeHtml(char.name?.full || 'Character')}" 
                      loading="lazy"
                      onerror="this.src='https://placehold.co/100x100/1e1b2e/c4b5fd?text=Character';"
                    />
                    <div style="flex: 1; min-width: 0;">
                      <div class="character-name" style="display: flex; align-items: center; justify-content: space-between;">
                        <span>${escapeHtml(char.name?.full || 'Character')}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                      <div class="character-role">${escapeHtml(edge.role || 'Main')}</div>
                      ${va ? `<div style="font-size: 0.72rem; color: var(--accent-cyan-light); margin-top: 2px;">VA: ${escapeHtml(va.name?.full || 'VA')}</div>` : ''}
                    </div>
                  </a>
                `;
              }).join('')}
            </div>
          </section>
        ` : ''}

        <!-- Community Reviews Section -->
        <section class="section-container" id="community-reviews-section">
          <div class="section-header">
            <div class="section-title-wrap">
              <span class="section-accent-bar gold"></span>
              <div>
                <h2 class="section-title">Community Reviews</h2>
                <p class="section-subtitle">Read detailed opinions or share your own thoughts</p>
              </div>
            </div>
            <button type="button" class="btn btn-primary" id="btn-open-review-modal" style="font-size: 0.85rem; padding: 8px 18px; border-radius: var(--radius-full); font-weight: 700;">
              Write a Review
            </button>
          </div>

          ${reviews.length === 0 ? `
            <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 40px; text-align: center; color: var(--text-muted);">
              <div style="font-size: 2rem; margin-bottom: 8px;">✍️</div>
              <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff; margin-bottom: 6px;">No Reviews Yet</h3>
              <p style="font-size: 0.9rem; max-width: 400px; margin: 0 auto 16px;">Be the first to review ${escapeHtml(title)} and help the community discover this anime!</p>
              <button type="button" class="btn btn-secondary" id="btn-open-review-modal-empty" style="border-radius: var(--radius-full); font-size: 0.85rem;">Write First Review</button>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 16px;">
              ${reviews.map(rev => `
                <div class="review-item-card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 20px; transition: border-color 0.2s;">
                  <!-- Review Header -->
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <img 
                        src="${rev.author?.avatarUrl || 'https://placehold.co/50x50/1e1b2e/c4b5fd?text=U'}" 
                        alt="${escapeHtml(rev.author?.username)}" 
                        style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-purple-light);"
                      />
                      <div>
                        <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">${escapeHtml(rev.author?.username)}</div>
                        <div style="font-size: 0.78rem; color: var(--text-muted);">${new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                      </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px;">
                      ${rev.rating ? `
                        <span style="background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.4); color: #fbbf24; font-weight: 800; font-size: 0.85rem; padding: 4px 10px; border-radius: var(--radius-full);">
                          ★ ${rev.rating} / 10
                        </span>
                      ` : ''}
                      ${rev.containsSpoilers ? `
                        <span style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; font-weight: 700; font-size: 0.75rem; padding: 3px 8px; border-radius: 6px;">
                          Spoilers
                        </span>
                      ` : ''}
                    </div>
                  </div>

                  <!-- Summary -->
                  ${rev.summary ? `
                    <h4 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 8px 0;">
                      ${escapeHtml(rev.summary)}
                    </h4>
                  ` : ''}

                  <!-- Content with Spoiler Protection -->
                  <div class="review-body-wrap" style="color: #cbd5e1; font-size: 0.92rem; line-height: 1.6; margin-bottom: 14px;">
                    ${rev.containsSpoilers ? `
                      <div class="spoiler-warning-box" style="background: rgba(239, 68, 68, 0.1); border: 1px dashed rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 12px; text-align: center; cursor: pointer;">
                        <span style="color: #fca5a5; font-size: 0.85rem; font-weight: 600;">⚠️ This review contains spoilers. Click here to reveal.</span>
                      </div>
                      <div class="spoiler-hidden-content" style="display: none; margin-top: 10px; white-space: pre-line;">
                        ${escapeHtml(rev.content)}
                      </div>
                    ` : `
                      <div style="white-space: pre-line;">${escapeHtml(rev.content)}</div>
                    `}
                  </div>

                  <!-- Review Footer / Actions -->
                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px;">
                    <!-- Like Button -->
                    <button 
                      type="button" 
                      class="btn-like-review ${rev.isLikedByMe ? 'liked' : ''}" 
                      data-review-id="${rev.id}"
                      data-author-id="${rev.userId}"
                      style="background: ${rev.isLikedByMe ? 'rgba(139, 92, 246, 0.2)' : 'transparent'}; border: 1px solid ${rev.isLikedByMe ? 'var(--accent-purple-light)' : 'rgba(255,255,255,0.1)'}; color: ${rev.isLikedByMe ? 'var(--accent-purple-light)' : 'var(--text-muted)'}; font-size: 0.82rem; font-weight: 600; padding: 4px 12px; border-radius: var(--radius-full); display: flex; align-items: center; gap: 6px; cursor: pointer; transition: all 0.15s;"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="${rev.isLikedByMe ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                      <span class="like-counter">Helpful (${rev.likesCount})</span>
                    </button>

                    <!-- Author or Report Controls -->
                    <div style="display: flex; align-items: center; gap: 10px;">
                      ${rev.isMyReview ? `
                        <button type="button" class="btn-delete-review" data-review-id="${rev.id}" style="background: none; border: none; color: #ef4444; font-size: 0.8rem; cursor: pointer;">
                          Delete
                        </button>
                      ` : `
                        <button type="button" class="btn-report-content" data-target-type="review" data-target-id="${rev.id}" style="background: none; border: none; color: var(--text-muted); font-size: 0.8rem; display: flex; align-items: center; gap: 4px; cursor: pointer;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                          Report
                        </button>
                      `}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </section>

        <!-- Community Discussion / Comments Section -->
        <section class="section-container" id="community-comments-section">
          <div class="section-header">
            <div class="section-title-wrap">
              <span class="section-accent-bar purple"></span>
              <div>
                <h2 class="section-title">Episode Discussion & Live Comments</h2>
                <p class="section-subtitle">Chat with fellow otakus watching ${escapeHtml(title)}</p>
              </div>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">
              ${comments.length} Comment${comments.length === 1 ? '' : 's'}
            </span>
          </div>

          <!-- Comment Input Box -->
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 18px; margin-bottom: 24px;">
            <form id="comment-post-form">
              <textarea 
                id="comment-input-content" 
                rows="3" 
                placeholder="${currentUser ? 'What did you think of the latest episode? Join the discussion...' : 'Sign in to join the conversation...'}"
                style="width: 100%; background: rgba(15, 15, 23, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #fff; font-size: 0.95rem; padding: 12px; resize: vertical; outline: none; margin-bottom: 12px;"
              ></textarea>
              <div style="display: flex; justify-content: flex-end;">
                <button type="submit" class="btn btn-primary" style="padding: 8px 22px; border-radius: var(--radius-full); font-weight: 700; font-size: 0.88rem;">
                  Post Comment
                </button>
              </div>
            </form>
          </div>

          <!-- Comments List -->
          ${comments.length === 0 ? `
            <div style="text-align: center; padding: 32px; color: var(--text-muted); font-size: 0.9rem;">
              No comments posted yet. Start the conversation!
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${comments.map(comm => `
                <div class="comment-item-card" style="background: rgba(22, 22, 34, 0.6); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <img 
                        src="${comm.author?.avatarUrl || 'https://placehold.co/40x40/1e1b2e/c4b5fd?text=U'}" 
                        alt="${escapeHtml(comm.author?.username)}" 
                        style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;"
                      />
                      <div>
                        <span style="font-weight: 700; color: #fff; font-size: 0.9rem; margin-right: 8px;">${escapeHtml(comm.author?.username)}</span>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">${new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; ${new Date(comm.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    ${comm.isMyComment ? `
                      <button type="button" class="btn-delete-comment" data-comment-id="${comm.id}" style="background: none; border: none; color: #ef4444; font-size: 0.78rem; cursor: pointer;">
                        Delete
                      </button>
                    ` : `
                      <button type="button" class="btn-report-content" data-target-type="comment" data-target-id="${comm.id}" style="background: none; border: none; color: var(--text-muted); font-size: 0.78rem; cursor: pointer;">
                        Report
                      </button>
                    `}
                  </div>

                  <div style="color: #cbd5e1; font-size: 0.92rem; line-height: 1.5; margin-bottom: 8px; white-space: pre-line;">
                    ${escapeHtml(comm.content)}
                  </div>

                  <div style="display: flex; align-items: center; gap: 8px;">
                    <button 
                      type="button" 
                      class="btn-like-comment ${comm.isLikedByMe ? 'liked' : ''}" 
                      data-comment-id="${comm.id}"
                      style="background: ${comm.isLikedByMe ? 'rgba(139, 92, 246, 0.2)' : 'none'}; border: 1px solid ${comm.isLikedByMe ? 'var(--accent-purple-light)' : 'transparent'}; color: ${comm.isLikedByMe ? 'var(--accent-purple-light)' : 'var(--text-muted)'}; font-size: 0.78rem; padding: 2px 8px; border-radius: var(--radius-full); display: flex; align-items: center; gap: 4px; cursor: pointer;"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="${comm.isLikedByMe ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                      <span>${comm.likesCount}</span>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </section>

        <!-- Staff Section -->
        ${staff.length > 0 ? `
          <section class="section-container">
            <div class="section-header">
              <div class="section-title-wrap">
                <span class="section-accent-bar gold"></span>
                <h2 class="section-title">Production Staff</h2>
              </div>
            </div>
            <div class="character-grid">
              ${staff.map(edge => {
                if (!edge || !edge.node) return '';
                const person = edge.node;
                return `
                  <div class="character-card">
                    <img 
                      class="character-thumb" 
                      src="${person.image?.medium || 'https://placehold.co/100x100/1e1b2e/c4b5fd?text=Staff'}" 
                      alt="${escapeHtml(person.name?.full || 'Staff')}" 
                      loading="lazy"
                      onerror="this.src='https://placehold.co/100x100/1e1b2e/c4b5fd?text=Staff';"
                    />
                    <div>
                      <div class="character-name">${escapeHtml(person.name?.full || 'Staff Member')}</div>
                      <div class="character-role">${escapeHtml(edge.role || 'Staff')}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </section>
        ` : ''}

        <!-- Related Anime Section -->
        ${relations.length > 0 ? `
          <section class="section-container">
            <div class="section-header">
              <div class="section-title-wrap">
                <span class="section-accent-bar"></span>
                <h2 class="section-title">Related Anime</h2>
              </div>
            </div>
            <div class="anime-grid">
              ${relations.map(rel => {
                if (!rel || !rel.node) return '';
                return AnimeCard.render(rel.node);
              }).join('')}
            </div>
          </section>
        ` : ''}
      </div>

      <!-- Write Review Modal -->
      <div class="modal-backdrop" id="review-modal-backdrop">
        <div class="modal-content" style="max-width: 520px; padding: 28px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0;">Write Anime Review</h3>
            <button type="button" class="btn-icon" id="review-modal-close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <form id="review-form">
            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 6px; font-weight: 600;">Your Rating (1 - 10)</label>
              <select id="review-input-rating" style="width: 100%; padding: 10px 14px; background: rgba(15, 15, 23, 0.8); border: 1px solid var(--border-subtle); border-radius: 8px; color: #fff; font-size: 0.95rem; outline: none;">
                <option value="10">10 - Masterpiece</option>
                <option value="9" selected>9 - Fantastic</option>
                <option value="8">8 - Very Good</option>
                <option value="7">7 - Good</option>
                <option value="6">6 - Decent</option>
                <option value="5">5 - Average</option>
                <option value="4">4 - Below Average</option>
                <option value="3">3 - Poor</option>
                <option value="2">2 - Terrible</option>
                <option value="1">1 - Catastrophic</option>
              </select>
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 6px; font-weight: 600;">Review Headline / Summary</label>
              <input 
                type="text" 
                id="review-input-summary" 
                placeholder="e.g. A visual tour de force with gripping themes"
                style="width: 100%; padding: 10px 14px; background: rgba(15, 15, 23, 0.8); border: 1px solid var(--border-subtle); border-radius: 8px; color: #fff; font-size: 0.95rem; outline: none;"
              />
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 6px; font-weight: 600;">Detailed Review (Min 10 characters)</label>
              <textarea 
                id="review-input-content" 
                rows="6" 
                placeholder="Share your thoughts on the plot, character development, animation, and music..."
                style="width: 100%; padding: 12px 14px; background: rgba(15, 15, 23, 0.8); border: 1px solid var(--border-subtle); border-radius: 8px; color: #fff; font-size: 0.92rem; outline: none; resize: vertical;"
                required
              ></textarea>
            </div>

            <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="review-input-spoilers" style="width: 16px; height: 16px; accent-color: var(--accent-purple);" />
              <label for="review-input-spoilers" style="font-size: 0.85rem; color: #cbd5e1; cursor: pointer;">
                Contains major plot spoilers
              </label>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
              <button type="button" class="btn btn-secondary" id="review-modal-cancel">Cancel</button>
              <button type="submit" class="btn btn-primary" id="review-modal-submit">Publish Review</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Moderation Report Modal -->
      <div class="modal-backdrop" id="report-modal-backdrop">
        <div class="modal-content" style="max-width: 440px; padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff; margin: 0; display: flex; align-items: center; gap: 6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Report Content
            </h3>
            <button type="button" class="btn-icon" id="report-modal-close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <form id="report-form">
            <input type="hidden" id="report-target-type" />
            <input type="hidden" id="report-target-id" />

            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 6px;">Reason for Report</label>
              <select id="report-reason" style="width: 100%; padding: 8px 12px; background: rgba(15, 15, 23, 0.8); border: 1px solid var(--border-subtle); border-radius: 8px; color: #fff; font-size: 0.9rem; outline: none;">
                <option value="spam">Spam / Advertising</option>
                <option value="harassment">Harassment / Hate Speech</option>
                <option value="spoiler">Unmarked Plot Spoilers</option>
                <option value="copyright">Copyright Infringement / Piracy links</option>
                <option value="inappropriate">Inappropriate / Explicit Material</option>
                <option value="other">Other Violation</option>
              </select>
            </div>

            <div style="margin-bottom: 18px;">
              <label style="display: block; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 6px;">Additional Details (Optional)</label>
              <textarea id="report-details" rows="3" placeholder="Explain why this content violates community guidelines..." style="width: 100%; padding: 8px 12px; background: rgba(15, 15, 23, 0.8); border: 1px solid var(--border-subtle); border-radius: 8px; color: #fff; font-size: 0.88rem; outline: none; resize: vertical;"></textarea>
            </div>

            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button type="button" class="btn btn-secondary" id="report-modal-cancel">Cancel</button>
              <button type="submit" class="btn btn-primary" style="background: #ef4444; border-color: #ef4444;">Submit Report</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Bind Handlers
    this.bindActionHandlers(anime, episodesList);
    this.bindCommunityHandlers(anime);

    // Bind Embedded Official YouTube Player
    YouTubePlayer.bindEvents(this.container || document);
  },

  bindActionHandlers(anime, episodesList) {
    const id = anime.id;

    // Watchlist Toggle
    const watchlistBtn = document.getElementById('details-btn-watchlist');
    const watchlistText = document.getElementById('details-watchlist-text');
    if (watchlistBtn && watchlistText) {
      watchlistBtn.onclick = async () => {
        const added = await StorageService.toggleWatchlist(anime);
        if (added) {
          watchlistText.textContent = 'In Watchlist';
          watchlistBtn.querySelector('svg')?.setAttribute('fill', 'currentColor');
          Toast.show(`Added "${AnimeService.formatTitle(anime.title)}" to your Watchlist!`, 'success');
        } else {
          watchlistText.textContent = 'Add to Watchlist';
          watchlistBtn.querySelector('svg')?.setAttribute('fill', 'none');
          Toast.show(`Removed from your Watchlist`, 'info');
        }
      };
    }

    // Favorite Toggle
    const favBtn = document.getElementById('details-btn-favorite');
    const favText = document.getElementById('details-fav-text');
    if (favBtn && favText) {
      favBtn.onclick = async () => {
        const isFav = await StorageService.toggleFavorite(id);
        if (isFav) {
          favText.textContent = 'Favorited';
          favBtn.querySelector('svg')?.setAttribute('fill', '#ec4899');
          favBtn.querySelector('svg')?.setAttribute('stroke', '#ec4899');
          Toast.show('Added to your Favorites ❤️', 'success');
        } else {
          favText.textContent = 'Favorite';
          favBtn.querySelector('svg')?.setAttribute('fill', 'none');
          favBtn.querySelector('svg')?.setAttribute('stroke', 'currentColor');
          Toast.show('Removed from Favorites', 'info');
        }
      };
    }

    // Follow Toggle
    const followBtn = document.getElementById('details-btn-follow');
    const followText = document.getElementById('details-follow-text');
    if (followBtn && followText) {
      followBtn.onclick = async () => {
        const isFollowing = await StorageService.toggleFollow(anime);
        if (isFollowing) {
          followText.textContent = 'Following';
          followBtn.querySelector('svg')?.setAttribute('fill', 'var(--accent-cyan)');
          followBtn.querySelector('svg')?.setAttribute('stroke', 'var(--accent-cyan)');
          Toast.show(`Now following "${AnimeService.formatTitle(anime.title)}"!`, 'success');
        } else {
          followText.textContent = 'Follow Anime';
          followBtn.querySelector('svg')?.setAttribute('fill', 'none');
          followBtn.querySelector('svg')?.setAttribute('stroke', 'currentColor');
          Toast.show('Unfollowed anime', 'info');
        }
      };
    }

    // Episode Checkmark Toggle
    document.querySelectorAll('[data-action="toggle-episode"]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const epNum = btn.getAttribute('data-episode');
        const isWatched = StorageService.toggleEpisodeWatched(id, epNum);
        
        const row = document.getElementById(`episode-row-${epNum}`);
        if (row) {
          row.classList.toggle('watched', isWatched);
        }
        btn.classList.toggle('watched', isWatched);
        btn.querySelector('span').textContent = isWatched ? 'Watched' : 'Mark';

        // Update progress counter
        const currentWatched = StorageService.getWatchedEpisodes(id);
        const counterElem = document.getElementById('episodes-progress-counter');
        if (counterElem) {
          counterElem.textContent = `${currentWatched.length} / ${episodesList.length} Watched`;
        }
      };
    });
  },

  bindCommunityHandlers(anime) {
    const id = anime.id;
    const animeTitle = AnimeService.formatTitle(anime.title);
    const animeCover = anime.coverImage?.large || anime.coverImage?.medium || '';

    // Rating star buttons
    document.querySelectorAll('.btn-rate-star').forEach(starBtn => {
      starBtn.addEventListener('click', async () => {
        if (!AuthService.isAuthenticated()) {
          Toast.show('Please sign in to rate anime.', 'info');
          window.router.navigate('/profile');
          return;
        }

        const ratingVal = parseInt(starBtn.dataset.rating, 10);
        try {
          await CommunityService.setAnimeRating(id, ratingVal, {
            title: animeTitle,
            coverImage: animeCover,
          });
          Toast.show(`Rated ${ratingVal}/10! Thank you for rating.`, 'success');
          // Refresh ratings
          this.activeRatings = await CommunityService.getAnimeRatings(id);
          const targetContainer = this.container || document.getElementById('app-root');
          this.render(targetContainer, { id });
        } catch (err) {
          Toast.show(err.message || 'Failed to submit rating', 'error');
        }
      });
    });

    // Spoiler warning click reveal
    document.querySelectorAll('.spoiler-warning-box').forEach(box => {
      box.addEventListener('click', () => {
        const hiddenEl = box.nextElementSibling;
        if (hiddenEl) {
          hiddenEl.style.display = 'block';
          box.style.display = 'none';
        }
      });
    });

    // Review Modal Open / Close
    const reviewModal = document.getElementById('review-modal-backdrop');
    const openReviewBtn = document.getElementById('btn-open-review-modal');
    const openReviewEmptyBtn = document.getElementById('btn-open-review-modal-empty');
    const closeReviewBtn = document.getElementById('review-modal-close');
    const cancelReviewBtn = document.getElementById('review-modal-cancel');
    const reviewForm = document.getElementById('review-form');

    const openReview = () => {
      if (!AuthService.isAuthenticated()) {
        Toast.show('Please sign in to write a review.', 'info');
        window.router.navigate('/profile');
        return;
      }
      reviewModal?.classList.add('open');
    };

    const closeReview = () => {
      reviewModal?.classList.remove('open');
    };

    openReviewBtn?.addEventListener('click', openReview);
    openReviewEmptyBtn?.addEventListener('click', openReview);
    closeReviewBtn?.addEventListener('click', closeReview);
    cancelReviewBtn?.addEventListener('click', closeReview);

    // Review Form Submit
    reviewForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rating = document.getElementById('review-input-rating')?.value;
      const summary = document.getElementById('review-input-summary')?.value;
      const content = document.getElementById('review-input-content')?.value;
      const containsSpoilers = document.getElementById('review-input-spoilers')?.checked;

      try {
        await CommunityService.createReview({
          animeId: id,
          rating,
          summary,
          content,
          containsSpoilers,
          animeTitle,
          animeCover,
        });
        Toast.show('Your review has been published!', 'success');
        closeReview();
        // Refresh details
        const targetContainer = this.container || document.getElementById('app-root');
        this.render(targetContainer, { id });
      } catch (err) {
        Toast.show(err.message || 'Failed to submit review.', 'error');
      }
    });

    // Review Helpful Likes
    document.querySelectorAll('.btn-like-review').forEach(likeBtn => {
      likeBtn.addEventListener('click', async () => {
        if (!AuthService.isAuthenticated()) {
          Toast.show('Sign in to mark reviews as helpful.', 'info');
          return;
        }
        const reviewId = likeBtn.dataset.reviewId;
        const authorId = likeBtn.dataset.authorId;
        try {
          const res = await CommunityService.toggleReviewLike(reviewId, authorId, animeTitle);
          likeBtn.classList.toggle('liked', res.liked);
          const counter = likeBtn.querySelector('.like-counter');
          if (counter) counter.textContent = `Helpful (${res.likesCount})`;
          Toast.show(res.liked ? 'Marked as helpful' : 'Removed helpful vote', 'info');
        } catch (err) {
          Toast.show(err.message || 'Error updating like', 'error');
        }
      });
    });

    // Delete Review
    document.querySelectorAll('.btn-delete-review').forEach(delBtn => {
      delBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete this review?')) return;
        const reviewId = delBtn.dataset.reviewId;
        try {
          await CommunityService.deleteReview(reviewId);
          Toast.show('Review deleted.', 'info');
          const targetContainer = this.container || document.getElementById('app-root');
          this.render(targetContainer, { id });
        } catch (err) {
          Toast.show(err.message || 'Failed to delete review', 'error');
        }
      });
    });

    // Comment Post Form
    const commentForm = document.getElementById('comment-post-form');
    const commentInput = document.getElementById('comment-input-content');
    commentForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!AuthService.isAuthenticated()) {
        Toast.show('Please sign in to join the discussion.', 'info');
        window.router.navigate('/profile');
        return;
      }
      const content = commentInput?.value;
      try {
        await CommunityService.postComment({
          animeId: id,
          content,
        });
        if (commentInput) commentInput.value = '';
        Toast.show('Comment posted!', 'success');
        const targetContainer = this.container || document.getElementById('app-root');
        this.render(targetContainer, { id });
      } catch (err) {
        Toast.show(err.message || 'Failed to post comment', 'error');
      }
    });

    // Comment Likes
    document.querySelectorAll('.btn-like-comment').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!AuthService.isAuthenticated()) {
          Toast.show('Sign in to like comments.', 'info');
          return;
        }
        const commentId = btn.dataset.commentId;
        try {
          const res = await CommunityService.toggleCommentLike(commentId);
          btn.classList.toggle('liked', res.liked);
          btn.querySelector('span').textContent = res.likesCount;
        } catch (err) {
          Toast.show(err.message || 'Error liking comment', 'error');
        }
      });
    });

    // Delete Comment
    document.querySelectorAll('.btn-delete-comment').forEach(delBtn => {
      delBtn.addEventListener('click', async () => {
        if (!confirm('Delete your comment?')) return;
        const commentId = delBtn.dataset.commentId;
        try {
          await CommunityService.deleteComment(commentId);
          Toast.show('Comment deleted.', 'info');
          const targetContainer = this.container || document.getElementById('app-root');
          this.render(targetContainer, { id });
        } catch (err) {
          Toast.show(err.message || 'Failed to delete comment', 'error');
        }
      });
    });

    // Moderation Report Modal Trigger
    const reportModal = document.getElementById('report-modal-backdrop');
    const closeReportBtn = document.getElementById('report-modal-close');
    const cancelReportBtn = document.getElementById('report-modal-cancel');
    const reportForm = document.getElementById('report-form');
    const targetTypeInput = document.getElementById('report-target-type');
    const targetIdInput = document.getElementById('report-target-id');

    const openReport = (targetType, targetId) => {
      if (!AuthService.isAuthenticated()) {
        Toast.show('Please sign in to report content.', 'info');
        return;
      }
      if (targetTypeInput) targetTypeInput.value = targetType;
      if (targetIdInput) targetIdInput.value = targetId;
      reportModal?.classList.add('open');
    };

    const closeReport = () => {
      reportModal?.classList.remove('open');
    };

    document.querySelectorAll('.btn-report-content').forEach(btn => {
      btn.addEventListener('click', () => {
        openReport(btn.dataset.targetType, btn.dataset.targetId);
      });
    });

    closeReportBtn?.addEventListener('click', closeReport);
    cancelReportBtn?.addEventListener('click', closeReport);

    reportForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const targetType = targetTypeInput?.value;
      const targetId = targetIdInput?.value;
      const reason = document.getElementById('report-reason')?.value;
      const details = document.getElementById('report-details')?.value;

      try {
        const res = await CommunityService.submitReport({ targetType, targetId, reason, details });
        Toast.show(res.message, 'success');
        closeReport();
      } catch (err) {
        Toast.show(err.message || 'Failed to submit report', 'error');
      }
    });
  }
};

