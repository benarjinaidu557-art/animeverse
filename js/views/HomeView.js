/**
 * Home View
 * Renders Hero Spotlight, Trending, Popular, Recently Updated, New Releases,
 * Upcoming Anime, Top Rated, and Surprise Me section.
 */

import { AnimeService } from '../services/animeService.js';
import { AnimeCard } from '../components/AnimeCard.js';
import { HeroSection } from '../components/HeroSection.js';
import { Skeletons } from '../components/Skeletons.js';
import { Toast } from '../components/Toast.js';
import { AdSlot } from '../components/AdSlot.js';

export const HomeView = {
  async render(container) {
    // Show initial Skeleton layout while fetching from AniList
    container.innerHTML = `
      <div class="container" style="padding-top: 24px;">
        ${Skeletons.renderHeroSkeleton()}
        
        <div class="section-container">
          <div class="section-header">
            <div class="section-title-wrap">
              <span class="section-accent-bar"></span>
              <h2 class="section-title">Trending Anime</h2>
            </div>
          </div>
          <div class="anime-grid">
            ${Skeletons.renderCardSkeletonGrid(6)}
          </div>
        </div>

        <div class="section-container">
          <div class="section-header">
            <div class="section-title-wrap">
              <span class="section-accent-bar cyan"></span>
              <h2 class="section-title">All-Time Popular</h2>
            </div>
          </div>
          <div class="anime-grid">
            ${Skeletons.renderCardSkeletonGrid(6)}
          </div>
        </div>
      </div>
    `;

    try {
      // Parallel fetch from AniList via AnimeService
      const [
        trendingData,
        popularData,
        recentlyUpdatedData,
        newReleasesData,
        upcomingData,
        topRatedData,
      ] = await Promise.all([
        AnimeService.getTrending(1, 10),
        AnimeService.getPopular(1, 10),
        AnimeService.getRecentlyUpdated(1, 10),
        AnimeService.getNewReleases(1, 10),
        AnimeService.getUpcoming(1, 10),
        AnimeService.getTopRated(1, 10),
      ]);

      const featuredAnimeList = trendingData.media.slice(0, 5);

      container.innerHTML = `
        <div class="container" style="padding-top: 24px;">
          <!-- 1. HERO SPOTLIGHT -->
          ${HeroSection.render(featuredAnimeList)}

          <!-- 2. TRENDING ANIME -->
          <section class="section-container">
            <div class="section-header">
              <div class="section-title-wrap">
                <span class="section-accent-bar"></span>
                <div>
                  <h2 class="section-title">Trending Now</h2>
                  <p class="section-subtitle">What the global anime community is watching right now</p>
                </div>
              </div>
              <a href="#/browse?sort=TRENDING_DESC" class="btn-view-all">
                View All <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
            </div>
            <div class="horizontal-scroll-row">
              ${trendingData.media.map(anime => AnimeCard.render(anime)).join('')}
            </div>
          </section>

          <!-- ADVERTISEMENT BANNER -->
          ${AdSlot.render('banner', 'home-ad-banner-top')}

          <!-- 3. ALL-TIME POPULAR -->
          <section class="section-container">
            <div class="section-header">
              <div class="section-title-wrap">
                <span class="section-accent-bar cyan"></span>
                <div>
                  <h2 class="section-title">Popular Anime</h2>
                  <p class="section-subtitle">Most added and followed shows across AniList</p>
                </div>
              </div>
              <a href="#/browse?sort=POPULARITY_DESC" class="btn-view-all">
                View All <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
            </div>
            <div class="anime-grid">
              ${popularData.media.slice(0, 8).map(anime => AnimeCard.render(anime)).join('')}
            </div>
          </section>

          <!-- 4. RECENTLY UPDATED / CURRENTLY AIRING -->
          <section class="section-container">
            <div class="section-header">
              <div class="section-title-wrap">
                <span class="section-accent-bar pink"></span>
                <div>
                  <h2 class="section-title">Recently Updated</h2>
                  <p class="section-subtitle">Fresh episodes and updates straight from Japan</p>
                </div>
              </div>
              <a href="#/browse?status=RELEASING&sort=UPDATED_AT_DESC" class="btn-view-all">
                View All <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
            </div>
            <div class="horizontal-scroll-row">
              ${recentlyUpdatedData.media.map(anime => AnimeCard.render(anime)).join('')}
            </div>
          </section>

          <!-- 8. SURPRISE ME / RANDOM ANIME -->
          <section class="surprise-section">
            <div class="surprise-content">
              <h3>Can't decide what to watch?</h3>
              <p>Let AnimeVerse curate a legendary hidden gem or top-tier series for you with one click.</p>
            </div>
            <button type="button" class="btn-surprise" id="btn-surprise-me">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
              Surprise Me!
            </button>
          </section>

          <!-- 5. NEW RELEASES -->
          <section class="section-container">
            <div class="section-header">
              <div class="section-title-wrap">
                <span class="section-accent-bar gold"></span>
                <div>
                  <h2 class="section-title">New Releases</h2>
                  <p class="section-subtitle">Leading shows premiering this season</p>
                </div>
              </div>
              <a href="#/browse?sort=START_DATE_DESC" class="btn-view-all">
                View All <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
            </div>
            <div class="anime-grid">
              ${newReleasesData.media.slice(0, 8).map(anime => AnimeCard.render(anime)).join('')}
            </div>
          </section>

          <!-- 6. UPCOMING ANIME -->
          <section class="section-container">
            <div class="section-header">
              <div class="section-title-wrap">
                <span class="section-accent-bar cyan"></span>
                <div>
                  <h2 class="section-title">Upcoming Anime</h2>
                  <p class="section-subtitle">Anticipated anime slated for future broadcast</p>
                </div>
              </div>
              <a href="#/browse?status=NOT_YET_RELEASED" class="btn-view-all">
                View All <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
            </div>
            <div class="horizontal-scroll-row">
              ${upcomingData.media.map(anime => AnimeCard.render(anime)).join('')}
            </div>
          </section>

          <!-- 7. TOP RATED -->
          <section class="section-container">
            <div class="section-header">
              <div class="section-title-wrap">
                <span class="section-accent-bar"></span>
                <div>
                  <h2 class="section-title">Top Rated Classics & Modern Masterpieces</h2>
                  <p class="section-subtitle">Highest community scores of all time</p>
                </div>
              </div>
              <a href="#/browse?sort=SCORE_DESC" class="btn-view-all">
                View All <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
            </div>
            <div class="anime-grid">
              ${topRatedData.media.slice(0, 8).map(anime => AnimeCard.render(anime)).join('')}
            </div>
          </section>
        </div>
      `;

      // Bind Hero event listeners
      HeroSection.bindEvents();

      // Bind Surprise Me button
      const surpriseBtn = document.getElementById('btn-surprise-me');
      if (surpriseBtn) {
        surpriseBtn.onclick = async () => {
          surpriseBtn.disabled = true;
          surpriseBtn.innerHTML = `
            <svg class="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
            Finding Gem...
          `;
          try {
            const randomAnime = await AnimeService.getRandomAnime();
            if (randomAnime) {
              Toast.show(`Found: ${AnimeService.formatTitle(randomAnime.title)}!`, 'info');
              window.router.navigate(`/anime/${randomAnime.id}`);
            } else {
              Toast.show('Could not find random anime right now.', 'info');
            }
          } catch {
            Toast.show('Network error while rolling surprise anime', 'info');
          } finally {
            surpriseBtn.disabled = false;
          }
        };
      }

    } catch (error) {
      console.error('Home page render error:', error);
      container.innerHTML = `
        <div class="container" style="padding-top: 40px;">
          <div class="error-state">
            <div class="state-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3 class="state-title">Unable to Connect to AniList API</h3>
            <p class="state-desc">${error.message || 'We could not fetch the latest anime catalog. Please check your internet connection and try again.'}</p>
            <button type="button" class="btn-primary" onclick="window.router.refresh()">
              Retry Connection
            </button>
          </div>
        </div>
      `;
    }
  }
};
