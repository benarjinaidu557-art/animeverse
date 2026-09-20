/**
 * Genres View
 * Allows exploration by genre with curated categories and quick navigation to Browse.
 */

import { AnimeService } from '../services/animeService.js';

const GENRE_DESCRIPTIONS = {
  'Action': 'High-octane battles, martial arts, superpowers, and adrenaline rushes.',
  'Adventure': 'Epic quests, mysterious uncharted worlds, and boundless journeys.',
  'Comedy': 'Hilarious gags, witty banter, parodies, and lighthearted fun.',
  'Drama': 'Deep emotional narratives, complex characters, and touching conflicts.',
  'Fantasy': 'Magic spells, mythical beasts, alternate realms, and ancient lore.',
  'Horror': 'Chilling suspense, eerie atmospheres, psychological dread, and frights.',
  'Mahou Shoujo': 'Magical girls, sparkling transformations, and the power of bonds.',
  'Mecha': 'Giant humanoid robots, sci-fi military warfare, and cybernetic pilots.',
  'Music': 'Idols, bands, orchestra symphonies, and musical passion.',
  'Mystery': 'Puzzling crimes, detective cases, secret conspiracies, and twists.',
  'Psychological': 'Mind games, inner battles, moral dilemmas, and thrilling tension.',
  'Romance': 'Heartwarming love stories, romantic chemistry, and relationships.',
  'Sci-Fi': 'Futuristic tech, space travel, AI, cyberpunk cities, and dystopian sagas.',
  'Slice of Life': 'Relatable daily routines, wholesome friendships, and peaceful moments.',
  'Sports': 'Competitive spirit, team camaraderie, tournament stakes, and training.',
  'Supernatural': 'Ghosts, spirits, deities, occult mysteries, and uncanny phenomena.',
  'Thriller': 'Edge-of-your-seat suspense, survival stakes, and high-pressure plots.'
};

export const GenresView = {
  async render(container) {
    const genres = await AnimeService.getGenres();

    container.innerHTML = `
      <div class="container" style="padding-top: 24px;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 8px;">Explore by Genre</h1>
          <p style="color: var(--text-muted); font-size: 0.95rem;">Discover stories tailored to your favorite anime themes and moods.</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-bottom: 48px;">
          ${genres.map(genre => {
            const desc = GENRE_DESCRIPTIONS[genre] || 'Explore top-rated shows and hidden gems in this genre.';
            return `
              <div 
                style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 24px; cursor: pointer; transition: all var(--transition-fast);"
                onmouseover="this.style.borderColor='var(--accent-purple)'; this.style.transform='translateY(-4px)'; this.style.boxShadow='var(--shadow-glow)';"
                onmouseout="this.style.borderColor='var(--border-subtle)'; this.style.transform='none'; this.style.boxShadow='none';"
                onclick="window.router.navigate('/browse?genre=${encodeURIComponent(genre)}')"
              >
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                  <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff;">${genre}</h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple-light)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
                <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;">${desc}</p>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
};
