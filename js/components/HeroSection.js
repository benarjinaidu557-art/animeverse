/**
 * Hero Section Component
 * Displays rotating or single featured anime showcase with rich backdrop and actions.
 */

import { AnimeService } from '../services/animeService.js';
import { StorageService } from '../services/storageService.js';

export const HeroSection = {
  currentIndex: 0,
  featuredItems: [],
  autoTimer: null,

  init(featuredAnimeList = []) {
    this.featuredItems = featuredAnimeList.filter(a => a && (a.bannerImage || a.coverImage?.extraLarge));
    this.currentIndex = 0;
    this.startAutoCycle();
  },

  startAutoCycle() {
    clearInterval(this.autoTimer);
    if (this.featuredItems.length <= 1) return;
    this.autoTimer = setInterval(() => {
      this.next();
    }, 8000);
  },

  next() {
    if (this.featuredItems.length <= 1) return;
    this.currentIndex = (this.currentIndex + 1) % this.featuredItems.length;
    this.updateDom();
  },

  prev() {
    if (this.featuredItems.length <= 1) return;
    this.currentIndex = (this.currentIndex - 1 + this.featuredItems.length) % this.featuredItems.length;
    this.updateDom();
  },

  render(featuredAnimeList = []) {
    this.init(featuredAnimeList);
    const anime = this.featuredItems[this.currentIndex] || featuredAnimeList[0];
    if (!anime) return '';

    return this.buildHtml(anime);
  },

  buildHtml(anime) {
    const id = anime.id;
    const title = AnimeService.formatTitle(anime.title);
    const nativeTitle = anime.title?.native || '';
    const banner = anime.bannerImage || anime.coverImage?.extraLarge || anime.coverImage?.large;
    const score = AnimeService.formatScore(anime.averageScore);
    const synopsis = anime.description ? anime.description.replace(/<[^>]*>?/gm, '') : 'Dive into this extraordinary anime masterpiece, brimming with stunning visuals, riveting characters, and an unforgettable story.';
    const genres = (anime.genres || []).slice(0, 3);
    const isWatchlisted = StorageService.isInWatchlist(id);

    return `
      <section class="hero-section" id="hero-slider">
        <img 
          class="hero-backdrop" 
          src="${banner}" 
          alt="${escapeHtml(title)}"
          onerror="this.src='https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80';"
        />
        <div class="hero-gradient-overlay"></div>
        <div class="hero-bottom-overlay"></div>

        <div class="hero-container">
          <div class="hero-tags">
            <span class="hero-badge-spotlight">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Featured Spotlight
            </span>
            ${anime.averageScore ? `
              <span class="hero-score-badge">
                ★ ${score} Rating
              </span>
            ` : ''}
            ${genres.map(g => `<span class="genre-pill" style="background: rgba(0,0,0,0.4);">${g}</span>`).join('')}
          </div>

          <h1 class="hero-title">${escapeHtml(title)}</h1>
          ${nativeTitle ? `<p style="font-family: var(--font-jp); color: var(--accent-cyan-light); margin-bottom: 10px; font-size: 1rem;">${escapeHtml(nativeTitle)}</p>` : ''}
          <p class="hero-synopsis">${escapeHtml(synopsis)}</p>

          <div class="hero-actions">
            <button 
              type="button" 
              class="btn-primary" 
              onclick="window.router.navigate('/anime/${id}')"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Explore Anime
            </button>
            <button 
              type="button" 
              class="btn-secondary" 
              data-action="toggle-watchlist" 
              data-anime-id="${id}"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWatchlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              <span>${isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}</span>
            </button>
          </div>
        </div>

        ${this.featuredItems.length > 1 ? `
          <div class="hero-controls">
            <button type="button" class="hero-nav-arrow" id="hero-prev" aria-label="Previous Featured">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button type="button" class="hero-nav-arrow" id="hero-next" aria-label="Next Featured">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        ` : ''}
      </section>
    `;
  },

  updateDom() {
    const heroElem = document.getElementById('hero-slider');
    if (!heroElem) return;
    const anime = this.featuredItems[this.currentIndex];
    if (!anime) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.buildHtml(anime);
    const newHero = tempDiv.firstElementChild;
    heroElem.replaceWith(newHero);
    this.bindEvents();
  },

  bindEvents() {
    const prevBtn = document.getElementById('hero-prev');
    const nextBtn = document.getElementById('hero-next');
    if (prevBtn) {
      prevBtn.onclick = () => {
        this.prev();
        this.startAutoCycle();
      };
    }
    if (nextBtn) {
      nextBtn.onclick = () => {
        this.next();
        this.startAutoCycle();
      };
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
