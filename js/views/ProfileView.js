/**
 * Profile View - AnimeVerse
 * User Profile, Avatar/Username Editing, Episode Progress Breakdown,
 * Cloud Watchlist & Favorites, and Community Activity (My Reviews & My Ratings).
 */

import { AuthService } from '../services/authService.js';
import { StorageService } from '../services/storageService.js';
import { CommunityService } from '../services/communityService.js';
import { AnimeCard } from '../components/AnimeCard.js';
import { Toast } from '../components/Toast.js';
import { SUPABASE_CONFIG } from '../config/supabaseConfig.js';
import { escapeHtml } from '../utils/stringUtils.js';

const CURATED_AVATARS = [
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Goku',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Luffy',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Zoro',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Naruto',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Tanjiro',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Levi',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Nezuko',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Mikasa',
];

export const ProfileView = {
  currentTab: 'watching',
  userReviews: [],
  userRatings: [],

  async render(container) {
    if (!AuthService.isAuthenticated()) {
      await AuthService.getProfile();
    }

    if (!AuthService.isAuthenticated()) {
      container.innerHTML = `
        <div class="container" style="padding: 60px 16px; text-align: center;">
          <div class="empty-state" style="max-width: 500px; margin: 0 auto;">
            <div class="state-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h2 class="state-title">Sign In Required</h2>
            <p class="state-desc">You need to sign in to access your personal profile, cloud watch progress, reviews, and community ratings.</p>
            <div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px;">
              <a href="#/login" class="btn-primary">Sign In</a>
              <a href="#/signup" class="btn-secondary">Create Account</a>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const user = AuthService.getUser();
    const profile = await AuthService.getProfile();
    const watchlist = StorageService.getWatchlist();
    const favorites = StorageService.getFavorites();

    // Fetch community activity
    const [reviews, ratings] = await Promise.all([
      CommunityService.getUserReviews(user.id).catch(() => []),
      CommunityService.getUserRatings(user.id).catch(() => []),
    ]);

    this.userReviews = reviews;
    this.userRatings = ratings;

    const username = profile?.username || user.email.split('@')[0];
    const avatar = profile?.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${user.id}`;
    const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '2026';

    // Calculate episode progress statistics
    let totalEpisodesWatched = 0;
    const progressList = [];

    watchlist.forEach(item => {
      const watchedArr = StorageService.getWatchedEpisodes(item.id);
      totalEpisodesWatched += watchedArr.length;

      if (watchedArr.length > 0 || item.status === 'watching') {
        const total = item.episodes || 0;
        const count = watchedArr.length;
        const percentage = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : (count > 0 ? 100 : 0);

        progressList.push({
          id: item.id,
          title: item.title,
          coverImage: item.coverImage,
          watchedCount: count,
          totalEpisodes: total > 0 ? total : '?',
          percentage,
        });
      }
    });

    // Counts
    const watchingCount = watchlist.filter(w => w.status === 'watching').length;
    const completedCount = watchlist.filter(w => w.status === 'completed').length;
    const planCount = watchlist.filter(w => w.status === 'plan_to_watch').length;
    const favCount = favorites.length;
    const reviewCount = reviews.length;
    const ratingCount = ratings.length;

    container.innerHTML = `
      <div class="container" style="padding-top: 28px; padding-bottom: 60px;">
        <!-- User Profile Header Banner -->
        <div style="
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%), var(--bg-card);
          border: 1px solid var(--border-accent);
          border-radius: var(--radius-xl);
          padding: 32px 36px;
          margin-bottom: 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 24px;
          box-shadow: var(--shadow-md);
        ">
          <!-- User Details -->
          <div style="display: flex; align-items: center; gap: 20px;">
            <div style="position: relative;">
              <img 
                id="profile-avatar-img" 
                src="${avatar}" 
                alt="${escapeHtml(username)}" 
                style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--accent-purple); background: var(--bg-secondary); object-fit: cover;"
              />
              <button 
                type="button" 
                id="btn-open-avatar-picker" 
                title="Change Avatar" 
                style="
                  position: absolute; 
                  bottom: 0; 
                  right: 0; 
                  background: var(--accent-purple); 
                  color: #fff; 
                  width: 26px; 
                  height: 26px; 
                  border-radius: 50%; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.5);
                  cursor: pointer;
                  border: none;
                "
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
            </div>

            <div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <h1 id="profile-display-username" style="font-size: 1.8rem; font-weight: 800; color: #fff;">${escapeHtml(username)}</h1>
                <button type="button" id="btn-edit-username" title="Edit username" style="color: var(--text-muted); background: none; border: none; padding: 4px; cursor: pointer;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
              </div>
              <p style="color: var(--text-muted); font-size: 0.88rem;">${user.email} &bull; Member since ${memberSince}</p>
              
              <!-- Connection Tag -->
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
                <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; padding: 2px 8px; border-radius: var(--radius-xs); background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); border: 1px solid rgba(16, 185, 129, 0.3);">
                  <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--accent-emerald);"></span>
                  ${SUPABASE_CONFIG.isConfigured() ? 'Supabase Live Connected' : 'Supabase Active (Local Simulator)'}
                </span>
                <button type="button" id="btn-supabase-settings" style="font-size: 0.72rem; color: var(--accent-cyan-light); background: none; border: none; text-decoration: underline; cursor: pointer;">
                  Project Settings
                </button>
              </div>
            </div>
          </div>

          <!-- Actions: Logout -->
          <div>
            <button type="button" id="btn-profile-logout" class="btn-secondary" style="border-color: rgba(239, 68, 68, 0.4); color: #fca5a5;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Log Out
            </button>
          </div>
        </div>

        <!-- Quick Stats Matrix -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 36px;">
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; text-align: center;">
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--accent-purple-light); margin-bottom: 4px;">${totalEpisodesWatched}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;">Episodes Watched</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; text-align: center;">
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--accent-cyan-light); margin-bottom: 4px;">${watchlist.length}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;">Anime In Library</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; text-align: center;">
            <div style="font-size: 1.8rem; font-weight: 800; color: #ec4899; margin-bottom: 4px;">${favCount}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;">Favorites</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; text-align: center;">
            <div style="font-size: 1.8rem; font-weight: 800; color: #fbbf24; margin-bottom: 4px;">${ratingCount}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;">Anime Rated</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; text-align: center;">
            <div style="font-size: 1.8rem; font-weight: 800; color: #34d399; margin-bottom: 4px;">${reviewCount}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;">Reviews Written</div>
          </div>
        </div>

        <!-- Episode Watch Progress Breakdown -->
        <section class="section-container" style="margin-bottom: 36px;">
          <div class="section-header">
            <div class="section-title-wrap">
              <span class="section-accent-bar cyan"></span>
              <h2 class="section-title">Episode Progress</h2>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">
              ${progressList.length} In-Progress Title${progressList.length === 1 ? '' : 's'}
            </span>
          </div>

          ${progressList.length > 0 ? `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
              ${progressList.map(item => `
                <div 
                  style="
                    background: var(--bg-card); 
                    border: 1px solid var(--border-subtle); 
                    border-radius: var(--radius-md); 
                    padding: 16px; 
                    display: flex; 
                    gap: 16px; 
                    align-items: center; 
                    cursor: pointer;
                    transition: all var(--transition-fast);
                  "
                  onmouseover="this.style.borderColor='var(--border-accent)'; this.style.transform='translateY(-2px)';"
                  onmouseout="this.style.borderColor='var(--border-subtle)'; this.style.transform='none';"
                  onclick="window.router.navigate('/anime/${item.id}')"
                >
                  <img 
                    src="${item.coverImage || 'https://placehold.co/80x120/1e1b2e/c4b5fd?text=Anime'}" 
                    alt="${escapeHtml(item.title)}" 
                    onerror="this.onerror=null;this.src='https://placehold.co/80x120/1e1b2e/c4b5fd?text=Anime';"
                    style="width: 54px; height: 75px; object-fit: cover; border-radius: var(--radius-xs); flex-shrink: 0;"
                  />
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.95rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 6px;">
                      ${escapeHtml(item.title)}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px;">
                      <span><strong>${item.watchedCount}</strong> / ${item.totalEpisodes} eps</span>
                      <span style="color: var(--accent-purple-light); font-weight: 600;">${item.percentage}%</span>
                    </div>
                    <!-- Progress bar -->
                    <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden;">
                      <div style="width: ${item.percentage}%; height: 100%; background: var(--gradient-primary); border-radius: 999px;"></div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="background: var(--bg-card); border: 1px dashed var(--border-light); border-radius: var(--radius-lg); padding: 32px; text-align: center; color: var(--text-muted);">
              You haven't tracked any episodes yet. Visit any anime details page and click <strong>"Mark Watched"</strong> on episodes to start tracking!
            </div>
          `}
        </section>

        <!-- Personal Library & Community Tabs -->
        <section class="section-container">
          <div class="section-header" style="flex-wrap: wrap; gap: 12px;">
            <div class="section-title-wrap">
              <span class="section-accent-bar pink"></span>
              <h2 class="section-title">Saved Catalog & Activity</h2>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${[
                { key: 'watching', label: `Watching (${watchingCount})` },
                { key: 'completed', label: `Completed (${completedCount})` },
                { key: 'plan_to_watch', label: `Plan to Watch (${planCount})` },
                { key: 'favorites', label: `Favorites (${favCount})` },
                { key: 'reviews', label: `My Reviews (${reviewCount})` },
                { key: 'ratings', label: `My Ratings (${ratingCount})` },
              ].map(tab => `
                <button 
                  type="button" 
                  class="profile-tab-btn" 
                  data-tab="${tab.key}"
                  style="
                    padding: 8px 16px;
                    border-radius: var(--radius-full);
                    background: ${this.currentTab === tab.key ? 'var(--accent-purple)' : 'var(--bg-card)'};
                    color: ${this.currentTab === tab.key ? '#fff' : 'var(--text-secondary)'};
                    border: 1px solid ${this.currentTab === tab.key ? 'var(--accent-purple)' : 'var(--border-subtle)'};
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                  "
                >
                  ${tab.label}
                </button>
              `).join('')}
            </div>
          </div>

          <div id="profile-library-grid" style="min-height: 200px;">
            <!-- Rendered by renderLibraryGrid() -->
          </div>
        </section>
      </div>

      <!-- Avatar Picker Modal -->
      <div class="modal-backdrop" id="avatar-modal-backdrop">
        <div class="modal-content" style="max-width: 440px; padding: 28px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff; margin: 0;">Choose Your Avatar</h3>
            <button type="button" class="btn-icon" id="avatar-modal-close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px;">
            ${CURATED_AVATARS.map(url => `
              <button 
                type="button" 
                class="avatar-option-btn" 
                data-url="${url}"
                style="
                  border: 2px solid rgba(255,255,255,0.1); 
                  border-radius: 50%; 
                  background: var(--bg-secondary); 
                  padding: 4px; 
                  cursor: pointer;
                  transition: all 0.2s;
                "
                onmouseover="this.style.borderColor='var(--accent-purple)'; this.style.transform='scale(1.08)';"
                onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.transform='scale(1)';"
              >
                <img src="${url}" alt="Avatar Option" style="width: 100%; border-radius: 50%; display: block;" />
              </button>
            `).join('')}
          </div>

          <div style="border-top: 1px solid var(--border-subtle); padding-top: 16px;">
            <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">Or enter custom image URL:</label>
            <div style="display: flex; gap: 8px;">
              <input 
                type="url" 
                id="custom-avatar-url-input" 
                placeholder="https://example.com/avatar.jpg" 
                style="flex: 1; padding: 10px 14px; background: rgba(15, 15, 23, 0.8); border: 1px solid var(--border-subtle); border-radius: 8px; color: #fff; font-size: 0.9rem;"
              />
              <button type="button" class="btn btn-primary" id="btn-save-custom-avatar" style="padding: 0 16px; font-size: 0.85rem;">Save</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Supabase Project Configuration Modal -->
      <div class="modal-backdrop" id="supabase-modal-backdrop">
        <div class="modal-content" style="max-width: 520px; padding: 32px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.5rem;">⚡</span>
              <h3 style="font-size: 1.3rem; font-weight: 800; color: #fff; margin: 0;">Supabase Settings</h3>
            </div>
            <button type="button" class="btn-icon" id="supabase-modal-close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6; margin-bottom: 20px;">
            AnimeVerse connects seamlessly with your cloud Supabase database with full Row Level Security (RLS). You can manage watchlists, ratings, reviews, and notifications in real-time.
          </p>

          <form id="supabase-config-form">
            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 6px; font-weight: 600;">Project URL</label>
              <input 
                type="url" 
                id="cfg-supabase-url" 
                value="${escapeHtml(SUPABASE_CONFIG.URL)}" 
                placeholder="https://xyzcompany.supabase.co" 
                style="width: 100%; padding: 10px 14px; background: rgba(15, 15, 23, 0.8); border: 1px solid var(--border-subtle); border-radius: 8px; color: #fff; font-size: 0.9rem;"
              />
            </div>

            <div style="margin-bottom: 24px;">
              <label style="display: block; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 6px; font-weight: 600;">Anon / Public API Key</label>
              <input 
                type="password" 
                id="cfg-supabase-key" 
                value="${escapeHtml(SUPABASE_CONFIG.ANON_KEY)}" 
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..." 
                style="width: 100%; padding: 10px 14px; background: rgba(15, 15, 23, 0.8); border: 1px solid var(--border-subtle); border-radius: 8px; color: #fff; font-size: 0.9rem;"
              />
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <button type="button" class="btn btn-secondary" id="btn-reset-supabase">Reset to Simulator</button>
              <button type="submit" class="btn btn-primary">Save & Reconnect</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.renderLibraryGrid();
    this.bindEvents(profile);
  },

  renderLibraryGrid() {
    const gridElem = document.getElementById('profile-library-grid');
    if (!gridElem) return;

    if (this.currentTab === 'reviews') {
      if (this.userReviews.length === 0) {
        gridElem.innerHTML = `
          <div style="padding: 40px; text-align: center; color: var(--text-muted); background: var(--bg-card); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">
            You haven't written any reviews yet. Visit any anime details page to share your critique!
          </div>
        `;
        return;
      }

      gridElem.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${this.userReviews.map(r => `
            <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 18px; display: flex; gap: 16px; align-items: flex-start;">
              ${r.anime_cover ? `
                <img src="${r.anime_cover}" alt="Anime" style="width: 60px; height: 85px; object-fit: cover; border-radius: 8px; flex-shrink: 0;" />
              ` : ''}
              <div style="flex: 1; min-width: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <a href="#/anime/${r.anime_id}" style="font-weight: 700; color: #fff; font-size: 1.05rem; text-decoration: none;">
                    ${escapeHtml(r.anime_title || 'Anime #' + r.anime_id)}
                  </a>
                  ${r.rating ? `
                    <span style="background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.4); color: #fbbf24; font-weight: 800; font-size: 0.8rem; padding: 2px 8px; border-radius: var(--radius-full);">
                      ★ ${r.rating} / 10
                    </span>
                  ` : ''}
                </div>
                ${r.summary ? `<div style="font-weight: 600; color: #cbd5e1; font-size: 0.92rem; margin-bottom: 4px;">${escapeHtml(r.summary)}</div>` : ''}
                <div style="color: var(--text-muted); font-size: 0.86rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 8px;">
                  ${escapeHtml(r.content)}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: var(--text-muted);">
                  <span>${new Date(r.created_at).toLocaleDateString()}</span>
                  <a href="#/anime/${r.anime_id}" style="color: var(--accent-purple-light); text-decoration: none; font-weight: 600;">View Full Review &rarr;</a>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      return;
    }

    if (this.currentTab === 'ratings') {
      if (this.userRatings.length === 0) {
        gridElem.innerHTML = `
          <div style="padding: 40px; text-align: center; color: var(--text-muted); background: var(--bg-card); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">
            You haven't rated any anime yet. Visit any anime details page and pick your score from 1 to 10!
          </div>
        `;
        return;
      }

      gridElem.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px;">
          ${this.userRatings.map(rt => `
            <a href="#/anime/${rt.anime_id}" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 12px; display: flex; gap: 12px; align-items: center; text-decoration: none; color: inherit; transition: border-color 0.2s, transform 0.2s;" onmouseover="this.style.borderColor='var(--accent-purple-light)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-subtle)'; this.style.transform='none';">
              ${rt.anime_cover ? `
                <img src="${rt.anime_cover}" alt="Anime" style="width: 48px; height: 68px; object-fit: cover; border-radius: 6px; flex-shrink: 0;" />
              ` : ''}
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 700; color: #fff; font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">
                  ${escapeHtml(rt.anime_title || 'Anime #' + rt.anime_id)}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="background: rgba(251, 191, 36, 0.2); border: 1px solid #fbbf24; color: #fbbf24; font-weight: 800; font-size: 0.78rem; padding: 2px 8px; border-radius: var(--radius-full);">
                    ★ ${rt.rating} / 10
                  </span>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">${new Date(rt.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </a>
          `).join('')}
        </div>
      `;
      return;
    }

    const watchlist = StorageService.getWatchlist();
    const favorites = StorageService.getFavorites();

    let items = [];
    if (this.currentTab === 'favorites') {
      items = watchlist.filter(item => favorites.includes(Number(item.id)));
    } else {
      items = watchlist.filter(item => item.status === this.currentTab);
    }

    if (items.length === 0) {
      gridElem.innerHTML = `
        <div style="padding: 36px; text-align: center; color: var(--text-muted); background: var(--bg-card); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">
          No anime in this category yet.
        </div>
      `;
      return;
    }

    gridElem.innerHTML = `
      <div class="anime-grid">
        ${items.map(item => {
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
    `;
  },

  bindEvents(profile) {
    // Logout
    document.getElementById('btn-profile-logout')?.addEventListener('click', async () => {
      await AuthService.signOut();
      Toast.show('Signed out', 'info');
      window.router.navigate('/login');
    });

    // Tab buttons
    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
      btn.onclick = () => {
        this.currentTab = btn.getAttribute('data-tab');
        document.querySelectorAll('.profile-tab-btn').forEach(b => {
          b.style.background = 'var(--bg-card)';
          b.style.color = 'var(--text-secondary)';
          b.style.borderColor = 'var(--border-subtle)';
        });
        btn.style.background = 'var(--accent-purple)';
        btn.style.color = '#fff';
        btn.style.borderColor = 'var(--accent-purple)';
        this.renderLibraryGrid();
      };
    });

    // Edit Username
    document.getElementById('btn-edit-username')?.addEventListener('click', async () => {
      const current = document.getElementById('profile-display-username').textContent;
      const newName = prompt('Enter your new username:', current);
      if (newName && newName.trim() && newName.trim() !== current) {
        try {
          await AuthService.updateProfile({ username: newName.trim() });
          document.getElementById('profile-display-username').textContent = newName.trim();
          Toast.show('Username updated!', 'success');
        } catch (err) {
          Toast.show(err.message || 'Failed to update username', 'info');
        }
      }
    });

    // Avatar Picker Modal
    const avatarModal = document.getElementById('avatar-modal-backdrop');
    document.getElementById('btn-open-avatar-picker')?.addEventListener('click', () => {
      avatarModal?.classList.add('open');
    });

    document.getElementById('avatar-modal-close')?.addEventListener('click', () => {
      avatarModal?.classList.remove('open');
    });

    document.querySelectorAll('.avatar-option-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const url = btn.getAttribute('data-url');
        try {
          await AuthService.updateProfile({ avatar_url: url });
          document.getElementById('profile-avatar-img').src = url;
          avatarModal?.classList.remove('open');
          Toast.show('Avatar updated!', 'success');
        } catch (err) {
          Toast.show('Failed to save avatar', 'error');
        }
      });
    });

    document.getElementById('btn-save-custom-avatar')?.addEventListener('click', async () => {
      const input = document.getElementById('custom-avatar-url-input');
      const url = input?.value.trim();
      if (!url) return;

      try {
        await AuthService.updateProfile({ avatar_url: url });
        document.getElementById('profile-avatar-img').src = url;
        avatarModal?.classList.remove('open');
        Toast.show('Avatar updated!', 'success');
      } catch (err) {
        Toast.show('Failed to save avatar', 'error');
      }
    });

    // Supabase Settings Modal
    const supabaseModal = document.getElementById('supabase-modal-backdrop');
    document.getElementById('btn-supabase-settings')?.addEventListener('click', () => {
      supabaseModal?.classList.add('open');
    });

    document.getElementById('supabase-modal-close')?.addEventListener('click', () => {
      supabaseModal?.classList.remove('open');
    });

    document.getElementById('supabase-config-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = document.getElementById('cfg-supabase-url')?.value.trim();
      const key = document.getElementById('cfg-supabase-key')?.value.trim();

      SUPABASE_CONFIG.setCredentials(url, key);
      Toast.show('Supabase credentials saved! Reloading...', 'success');
      setTimeout(() => window.location.reload(), 1200);
    });

    document.getElementById('btn-reset-supabase')?.addEventListener('click', () => {
      SUPABASE_CONFIG.clear();
      Toast.show('Reset to built-in simulator mode. Reloading...', 'info');
      setTimeout(() => window.location.reload(), 1200);
    });
  }
};

