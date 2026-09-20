/**
 * Personal Dashboard View
 * Displays: Welcome Back, Continue Watching, Recently Watched, My Watchlist,
 * My Favorites, Followed Anime, Upcoming Episodes, Recently Released Episodes,
 * and Smart "Recommended For You" suggestions.
 */

import { AuthService } from '../services/authService.js';
import { StorageService } from '../services/storageService.js';
import { AnimeService } from '../services/animeService.js';
import { AnimeCard } from '../components/AnimeCard.js';
import { Skeletons } from '../components/Skeletons.js';

export const DashboardView = {
  async render(container) {
    const isAuthenticated = AuthService.isAuthenticated();
    const user = AuthService.getUser();
    const profile = await AuthService.getProfile();

    const username = profile?.username || user?.email?.split('@')[0] || 'Anime Fan';
    const watchlist = StorageService.getWatchlist();
    const favorites = StorageService.getFavorites();
    const followed = StorageService.getFollowed();

    // Initial Loading Skeleton
    container.innerHTML = `
      <div class="container" style="padding-top: 24px;">
        <div class="skeleton" style="width: 320px; height: 36px; margin-bottom: 8px;"></div>
        <div class="skeleton" style="width: 220px; height: 20px; margin-bottom: 32px;"></div>
        <div class="anime-grid">${Skeletons.renderCardSkeletonGrid(6)}</div>
      </div>
    `;

    try {
      // 1. Calculate Continue Watching List
      const continueWatchingList = [];
      const userWatchedGenres = new Set();
      const watchedAnimeIds = [];

      watchlist.forEach(item => {
        const watchedArr = StorageService.getWatchedEpisodes(item.id);
        if (watchedArr.length > 0) {
          watchedAnimeIds.push(Number(item.id));
          (item.genres || []).forEach(g => userWatchedGenres.add(g));

          const lastEp = Math.max(...watchedArr);
          const total = item.episodes || 0;
          const percentage = total > 0 ? Math.min(100, Math.round((lastEp / total) * 100)) : (lastEp > 0 ? 100 : 0);

          continueWatchingList.push({
            id: item.id,
            title: item.title,
            coverImage: item.coverImage,
            lastWatchedEpisode: lastEp,
            totalEpisodes: total > 0 ? total : '?',
            percentage,
          });
        }
      });

      // 2. Parallel fetch upcoming & recently released episodes from AniList
      const nowSecs = Math.floor(Date.now() / 1000);
      const [upcomingSchedules, recentSchedules, recommendationsData] = await Promise.all([
        AnimeService.getAiringScheduleRange(nowSecs, nowSecs + 86400 * 4, 1, 10),
        AnimeService.getAiringScheduleRange(nowSecs - 86400 * 2, nowSecs, 1, 8),
        AnimeService.getRecommendations({
          favoriteGenres: Array.from(userWatchedGenres),
          excludeIds: watchedAnimeIds,
        }),
      ]);

      // Filter upcoming episodes that the user follows
      const followedIds = followed.map(f => Number(f.id));
      const followedUpcoming = upcomingSchedules.filter(s => followedIds.includes(Number(s.media?.id)));

      container.innerHTML = `
        <div class="container" style="padding-top: 24px;">
          <!-- Welcome Banner -->
          <div style="
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.16) 0%, rgba(6, 182, 212, 0.12) 100%), var(--bg-card);
            border: 1px solid var(--border-accent);
            border-radius: var(--radius-xl);
            padding: 28px 32px;
            margin-bottom: 36px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
          ">
            <div>
              <div style="font-size: 0.82rem; text-transform: uppercase; font-weight: 700; color: var(--accent-purple-light); letter-spacing: 0.08em; margin-bottom: 4px;">
                WELCOME BACK
              </div>
              <h1 style="font-size: 2rem; font-weight: 800; color: #fff; line-height: 1.2;">
                ${escapeHtml(username)}'s Command Center
              </h1>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">
                ${isAuthenticated ? 'Your personalized anime tracking, upcoming broadcasts, and tailored recommendations.' : 'Sign in to sync your watch progress across all devices.'}
              </p>
            </div>
            ${!isAuthenticated ? `
              <a href="#/login" class="btn-primary">Sign In to Save Progress</a>
            ` : `
              <a href="#/calendar" class="btn-secondary">View Airing Calendar</a>
            `}
          </div>

          <!-- 1. CONTINUE WATCHING -->
          <section class="section-container">
            <div class="section-header">
              <div class="section-title-wrap">
                <span class="section-accent-bar"></span>
                <div>
                  <h2 class="section-title">Continue Watching</h2>
                  <p class="section-subtitle">Pick up right where you left off</p>
                </div>
              </div>
              <a href="#/watchlist" class="btn-view-all">View All</a>
            </div>

            ${continueWatchingList.length > 0 ? `
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
                ${continueWatchingList.map(item => `
                  <div 
                    style="
                      background: var(--bg-card); 
                      border: 1px solid var(--border-subtle); 
                      border-radius: var(--radius-md); 
                      padding: 16px; 
                      display: flex; 
                      gap: 14px; 
                      align-items: center; 
                      cursor: pointer;
                      transition: all var(--transition-fast);
                    "
                    onmouseover="this.style.borderColor='var(--border-accent)'; this.style.transform='translateY(-2px)';"
                    onmouseout="this.style.borderColor='var(--border-subtle)'; this.style.transform='none';"
                    onclick="window.router.navigate('/anime/${item.id}')"
                  >
                    <img 
                      src="${item.coverImage || 'https://placehold.co/80x110/1e1b2e/c4b5fd?text=Anime'}" 
                      alt="${escapeHtml(item.title)}" 
                      onerror="this.onerror=null;this.src='https://placehold.co/80x110/1e1b2e/c4b5fd?text=Anime';"
                      style="width: 52px; height: 75px; object-fit: cover; border-radius: var(--radius-xs); flex-shrink: 0;"
                    />
                    <div style="flex: 1; min-width: 0;">
                      <h4 style="font-size: 0.92rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">
                        ${escapeHtml(item.title)}
                      </h4>
                      <div style="font-size: 0.8rem; color: var(--accent-purple-light); font-weight: 600; margin-bottom: 6px;">
                        Episode ${item.lastWatchedEpisode} of ${item.totalEpisodes}
                      </div>
                      <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden;">
                        <div style="width: ${item.percentage}%; height: 100%; background: var(--gradient-primary); border-radius: 999px;"></div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div style="background: var(--bg-card); border: 1px dashed var(--border-subtle); border-radius: var(--radius-lg); padding: 32px; text-align: center; color: var(--text-muted);">
                No anime in progress. Visit any series and mark episodes to start your tracking dashboard!
              </div>
            `}
          </section>

          <!-- 2. SMART RECOMMENDATIONS FOR YOU -->
          <section class="section-container">
            <div class="section-header">
              <div class="section-title-wrap">
                <span class="section-accent-bar cyan"></span>
                <div>
                  <h2 class="section-title">Recommended For You</h2>
                  <p class="section-subtitle">Suggestions matching your taste in ${recommendationsData.matchedGenre}</p>
                </div>
              </div>
            </div>
            <div class="horizontal-scroll-row">
              ${recommendationsData.media.map(anime => AnimeCard.render(anime)).join('')}
            </div>
          </section>

          <!-- 3. FOLLOWED ANIME UPCOMING EPISODES -->
          ${followedUpcoming.length > 0 ? `
            <section class="section-container">
              <div class="section-header">
                <div class="section-title-wrap">
                  <span class="section-accent-bar gold"></span>
                  <div>
                    <h2 class="section-title">Upcoming for Followed Shows</h2>
                    <p class="section-subtitle">Countdown to new episodes for shows you follow</p>
                  </div>
                </div>
              </div>
              <div class="horizontal-scroll-row">
                ${followedUpcoming.map(item => AnimeCard.render(item.media)).join('')}
              </div>
            </section>
          ` : ''}

          <!-- 4. RECENTLY RELEASED EPISODES (AIRING BROADCASTS) -->
          <section class="section-container">
            <div class="section-header">
              <div class="section-title-wrap">
                <span class="section-accent-bar pink"></span>
                <div>
                  <h2 class="section-title">Recently Released Episodes</h2>
                  <p class="section-subtitle">Newly broadcasted episodes from Japan</p>
                </div>
              </div>
              <a href="#/calendar?tab=yesterday" class="btn-view-all">See Full Calendar</a>
            </div>
            <div class="horizontal-scroll-row">
              ${recentSchedules.map(item => AnimeCard.render({ ...item.media, episodes: `Ep ${item.episode}` })).join('')}
            </div>
          </section>

          <!-- 5. MY WATCHLIST PREVIEW -->
          <section class="section-container">
            <div class="section-header">
              <div class="section-title-wrap">
                <span class="section-accent-bar"></span>
                <div>
                  <h2 class="section-title">My Watchlist</h2>
                  <p class="section-subtitle">${watchlist.length} shows saved in your library</p>
                </div>
              </div>
              <a href="#/watchlist" class="btn-view-all">Manage Library</a>
            </div>
            ${watchlist.length > 0 ? `
              <div class="horizontal-scroll-row">
                ${watchlist.slice(0, 8).map(item => AnimeCard.render({
                  id: item.id,
                  title: { english: item.title, romaji: item.romajiTitle },
                  coverImage: { large: item.coverImage },
                  averageScore: item.averageScore,
                  episodes: item.episodes,
                  genres: item.genres,
                  status: item.status,
                })).join('')}
              </div>
            ` : `
              <div style="background: var(--bg-card); border: 1px dashed var(--border-subtle); border-radius: var(--radius-lg); padding: 32px; text-align: center; color: var(--text-muted);">
                Your watchlist is currently empty. Add series from Home or Browse to build your collection!
              </div>
            `}
          </section>
        </div>
      `;
    } catch (err) {
      console.error('Dashboard error:', err);
      container.innerHTML = `
        <div class="container" style="padding-top: 40px;">
          <div class="error-state">
            <h3 class="state-title">Unable to Load Dashboard</h3>
            <p class="state-desc">${err.message || 'Error loading dashboard components'}</p>
            <button type="button" class="btn-primary" onclick="window.router.refresh()">Retry</button>
          </div>
        </div>
      `;
    }
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
