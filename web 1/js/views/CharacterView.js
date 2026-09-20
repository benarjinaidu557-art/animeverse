/**
 * Character Details View - AnimeVerse
 * Dedicated character profile showcasing biography, voice actors (Seiyuu),
 * and all associated anime appearances with roles.
 */

import { AnimeService } from '../services/animeService.js';
import { Skeletons } from '../components/Skeletons.js';
import { SeoService } from '../services/seoService.js';

export const CharacterView = {
  async render(container, characterId) {
    if (!characterId) {
      container.innerHTML = `
        <div class="container" style="padding: 60px 20px; text-align: center;">
          <h2>Character Not Found</h2>
          <p style="color: var(--text-muted); margin-bottom: 20px;">No character ID provided.</p>
          <a href="#/characters" class="btn btn-primary">Browse Characters</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="container" style="padding: 30px 20px;">
        <div class="character-skeleton" style="max-width: 1000px; margin: 0 auto;">
          <div style="height: 32px; width: 220px; background: rgba(255,255,255,0.06); border-radius: 8px; margin-bottom: 24px;"></div>
          <div style="display: grid; grid-template-columns: 280px 1fr; gap: 32px;">
            <div style="height: 380px; background: rgba(255,255,255,0.06); border-radius: 16px;"></div>
            <div>
              <div style="height: 48px; width: 60%; background: rgba(255,255,255,0.06); border-radius: 8px; margin-bottom: 16px;"></div>
              <div style="height: 150px; background: rgba(255,255,255,0.04); border-radius: 12px; margin-bottom: 24px;"></div>
              <div style="height: 180px; background: rgba(255,255,255,0.04); border-radius: 12px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      const character = await AnimeService.getCharacterDetails(characterId);

      if (!character) {
        container.innerHTML = `
          <div class="container" style="padding: 60px 20px; text-align: center;">
            <h2 style="color: #fff;">Character Not Found</h2>
            <p style="color: var(--text-muted); margin: 16px 0 24px;">The requested character could not be retrieved from AniList.</p>
            <a href="#/characters" class="btn btn-primary">Back to Characters</a>
          </div>
        `;
        return;
      }

      const name = character.name?.full || 'Unknown Character';
      const nativeName = character.name?.native || '';
      const altNames = character.name?.alternative || [];
      const image = character.image?.large || character.image?.medium || '';
      const favourites = (character.favourites || 0).toLocaleString();

      SeoService.update({
        title: `${name} - Character Profile`,
        description: (character.description || '').replace(/<[^>]*>?/gm, '').slice(0, 160) || `Learn about ${name} on AnimeVerse`,
        image: image,
        type: 'profile'
      });
      
      // Format birthdate
      let birthDateStr = '';
      if (character.dateOfBirth) {
        const { year, month, day } = character.dateOfBirth;
        if (month && day) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          birthDateStr = `${monthNames[month - 1]} ${day}${year ? ', ' + year : ''}`;
        }
      }

      // Format description with spoiler parsing
      let rawDesc = character.description || 'No biography available for this character.';
      // Replace ~! spoiler !~ tags
      let hasSpoilers = rawDesc.includes('~!');
      let formattedDesc = rawDesc
        .replace(/~!([\s\S]*?)!~/g, '<span class="spoiler-block" title="Click to reveal spoiler">$1</span>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');

      // Media appearances
      const appearances = (character.media?.edges || []).map(edge => {
        const node = edge.node;
        const role = edge.characterRole;
        const vas = edge.voiceActors || [];
        return {
          id: node.id,
          title: node.title?.english || node.title?.romaji || 'Untitled',
          cover: node.coverImage?.large || node.coverImage?.medium || '',
          format: node.format || 'TV',
          year: node.seasonYear || '',
          score: node.averageScore ? (node.averageScore / 10).toFixed(1) : null,
          role: role || 'SUPPORTING',
          voiceActors: vas,
        };
      });

      // Extract unique voice actors
      const voiceActorsMap = new Map();
      appearances.forEach(app => {
        app.voiceActors.forEach(va => {
          if (!voiceActorsMap.has(va.id)) {
            voiceActorsMap.set(va.id, {
              id: va.id,
              name: va.name?.full || 'Unknown Seiyuu',
              native: va.name?.native || '',
              image: va.image?.medium || '',
            });
          }
        });
      });
      const uniqueVoiceActors = Array.from(voiceActorsMap.values());

      container.innerHTML = `
        <div class="container" style="padding: 24px 20px 60px;">
          <!-- Breadcrumb -->
          <nav style="display: flex; align-items: center; gap: 8px; font-size: 0.88rem; color: var(--text-muted); margin-bottom: 24px;">
            <a href="#/" style="color: var(--text-muted); text-decoration: none;">Home</a>
            <span>/</span>
            <a href="#/characters" style="color: var(--text-muted); text-decoration: none;">Characters</a>
            <span>/</span>
            <span style="color: var(--accent-purple-light); font-weight: 600;">${name}</span>
          </nav>

          <!-- Character Profile Header Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 36px; margin-bottom: 48px; background: rgba(22, 22, 34, 0.7); border: 1px solid var(--border-subtle); border-radius: 20px; padding: 28px; backdrop-filter: blur(16px);">
            <!-- Character Avatar Card -->
            <div style="max-width: 320px; width: 100%; margin: 0 auto;">
              <div style="position: relative; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 36px rgba(0,0,0,0.5); border: 2px solid rgba(139, 92, 246, 0.3);">
                <img 
                  src="${image}" 
                  alt="${name}" 
                  style="width: 100%; height: 420px; object-fit: cover; display: block;" 
                  onerror="this.src='https://placehold.co/400x550/1e1b2e/c4b5fd?text=No+Image'"
                />
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(10,10,18,0.95), transparent); padding: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
                  <span style="display: inline-flex; align-items: center; gap: 6px; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; font-size: 0.85rem; padding: 4px 10px; border-radius: var(--radius-full); font-weight: 700;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    ${favourites}
                  </span>
                  ${character.gender ? `<span style="font-size: 0.85rem; color: #cbd5e1; background: rgba(255,255,255,0.1); padding: 3px 8px; border-radius: 6px;">${character.gender}</span>` : ''}
                </div>
              </div>

              <!-- Quick Meta Attributes -->
              <div style="margin-top: 18px; display: flex; flex-direction: column; gap: 8px; font-size: 0.88rem; background: rgba(15, 15, 23, 0.6); padding: 14px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                ${birthDateStr ? `<div style="display: flex; justify-content: space-between;"><span style="color: var(--text-muted);">Birthday:</span><span style="color: #fff; font-weight: 600;">${birthDateStr}</span></div>` : ''}
                ${character.age ? `<div style="display: flex; justify-content: space-between;"><span style="color: var(--text-muted);">Age:</span><span style="color: #fff; font-weight: 600;">${character.age}</span></div>` : ''}
                ${character.bloodType ? `<div style="display: flex; justify-content: space-between;"><span style="color: var(--text-muted);">Blood Type:</span><span style="color: #fff; font-weight: 600;">${character.bloodType}</span></div>` : ''}
                ${altNames.length > 0 ? `
                  <div style="margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px;">
                    <span style="color: var(--text-muted); font-size: 0.8rem; display: block; margin-bottom: 4px;">Also known as:</span>
                    <span style="color: #ddd; font-size: 0.82rem; line-height: 1.4;">${altNames.slice(0, 4).join(', ')}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Biography & Details Column -->
            <div style="display: flex; flex-direction: column; justify-content: flex-start;">
              <div style="margin-bottom: 20px;">
                <h1 style="font-size: 2.2rem; font-weight: 800; color: #fff; margin: 0 0 6px 0; line-height: 1.2;">${name}</h1>
                ${nativeName ? `<h2 style="font-size: 1.15rem; color: var(--accent-purple-light); font-weight: 500; margin: 0 0 16px 0;">${nativeName}</h2>` : ''}
              </div>

              <!-- About Section -->
              <div style="margin-bottom: 28px;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  Biography & Overview
                </h3>

                ${hasSpoilers ? `
                  <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                    <button type="button" id="btn-toggle-all-spoilers" style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #fbbf24; font-size: 0.8rem; font-weight: 600; padding: 4px 12px; border-radius: var(--radius-full); cursor: pointer;">
                      Show Hidden Spoilers
                    </button>
                    <span style="font-size: 0.78rem; color: var(--text-muted);">(Spoilers are hidden by default)</span>
                  </div>
                ` : ''}

                <div class="character-bio-text" style="color: #cbd5e1; font-size: 0.96rem; line-height: 1.7; max-height: 480px; overflow-y: auto; padding-right: 12px; background: rgba(0,0,0,0.2); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.04);">
                  ${formattedDesc}
                </div>
              </div>

              <!-- Voice Actors Section -->
              ${uniqueVoiceActors.length > 0 ? `
                <div>
                  <h3 style="font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                    Voice Actors (Seiyuu)
                  </h3>
                  <div style="display: flex; flex-wrap: wrap; gap: 14px;">
                    ${uniqueVoiceActors.slice(0, 6).map(va => `
                      <div style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 8px 12px; border-radius: 12px;">
                        <img 
                          src="${va.image}" 
                          alt="${va.name}" 
                          style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-purple-light);"
                          onerror="this.src='https://placehold.co/100x100/1e1b2e/c4b5fd?text=VA'"
                        />
                        <div>
                          <div style="font-size: 0.88rem; font-weight: 700; color: #fff;">${va.name}</div>
                          ${va.native ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${va.native}</div>` : ''}
                          <div style="font-size: 0.72rem; color: var(--accent-purple-light); font-weight: 600;">Japanese (VA)</div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Anime Appearances Section -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div>
                <h2 style="font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 4px;">Anime Appearances</h2>
                <p style="color: var(--text-muted); font-size: 0.9rem;">Discover and explore all anime featuring ${name}.</p>
              </div>
              <span style="background: rgba(139, 92, 246, 0.15); color: var(--accent-purple-light); border: 1px solid rgba(139, 92, 246, 0.3); font-weight: 700; font-size: 0.85rem; padding: 4px 12px; border-radius: var(--radius-full);">
                ${appearances.length} Series
              </span>
            </div>

            ${appearances.length === 0 ? `
              <div style="background: var(--bg-card); border-radius: 16px; padding: 40px; text-align: center; color: var(--text-muted);">
                No anime appearances recorded for this character.
              </div>
            ` : `
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px;">
                ${appearances.map(app => `
                  <a href="#/anime/${app.id}" class="anime-appearance-card" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 14px; overflow: hidden; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;">
                    <div style="position: relative; padding-top: 140%; overflow: hidden;">
                      <img 
                        src="${app.cover}" 
                        alt="${app.title}" 
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
                        onerror="this.src='https://placehold.co/300x420/1e1b2e/c4b5fd?text=No+Cover'"
                      />
                      <div style="position: absolute; top: 8px; left: 8px;">
                        <span style="font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 6px; ${app.role === 'MAIN' ? 'background: var(--gradient-primary); color: #fff;' : 'background: rgba(0,0,0,0.7); color: #cbd5e1;'}">
                          ${app.role}
                        </span>
                      </div>
                      ${app.score ? `
                        <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); padding: 2px 7px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; color: #fbbf24; display: flex; align-items: center; gap: 3px;">
                          ★ ${app.score}
                        </div>
                      ` : ''}
                    </div>
                    <div style="padding: 12px; display: flex; flex-direction: column; flex: 1; justify-content: space-between;">
                      <div style="font-size: 0.9rem; font-weight: 700; color: #fff; line-height: 1.3; margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${app.title}
                      </div>
                      <div style="display: flex; justify-content: space-between; font-size: 0.76rem; color: var(--text-muted);">
                        <span>${app.format}</span>
                        <span>${app.year || ''}</span>
                      </div>
                    </div>
                  </a>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      `;

      // Interactive spoiler handlers
      this._bindEvents(container);

    } catch (err) {
      console.error('Failed to load character:', err);
      container.innerHTML = `
        <div class="container" style="padding: 60px 20px; text-align: center;">
          <h2 style="color: #ef4444;">Failed to Load Character</h2>
          <p style="color: var(--text-muted); margin: 12px 0 24px;">${err.message || 'An error occurred while fetching character details.'}</p>
          <a href="#/characters" class="btn btn-primary">Browse Other Characters</a>
        </div>
      `;
    }
  },

  _bindEvents(container) {
    // Individual spoiler click reveal
    const spoilers = container.querySelectorAll('.spoiler-block');
    spoilers.forEach(sp => {
      sp.style.cursor = 'pointer';
      sp.style.background = '#222';
      sp.style.color = 'transparent';
      sp.style.borderRadius = '4px';
      sp.style.padding = '1px 6px';
      sp.style.userSelect = 'none';

      sp.addEventListener('click', () => {
        if (sp.style.color === 'transparent') {
          sp.style.color = '#fff';
          sp.style.background = 'rgba(239, 68, 68, 0.25)';
        } else {
          sp.style.color = 'transparent';
          sp.style.background = '#222';
        }
      });
    });

    // Toggle all spoilers button
    const toggleBtn = container.querySelector('#btn-toggle-all-spoilers');
    if (toggleBtn) {
      let allRevealed = false;
      toggleBtn.addEventListener('click', () => {
        allRevealed = !allRevealed;
        spoilers.forEach(sp => {
          if (allRevealed) {
            sp.style.color = '#fff';
            sp.style.background = 'rgba(239, 68, 68, 0.25)';
          } else {
            sp.style.color = 'transparent';
            sp.style.background = '#222';
          }
        });
        toggleBtn.textContent = allRevealed ? 'Hide Spoilers' : 'Show Hidden Spoilers';
      });
    }

    // Hover styling on appearance cards
    const cards = container.querySelectorAll('.anime-appearance-card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
        card.style.borderColor = 'var(--accent-purple-light)';
        card.style.boxShadow = '0 10px 24px rgba(139, 92, 246, 0.25)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.borderColor = 'var(--border-subtle)';
        card.style.boxShadow = 'none';
      });
    });
  }
};
