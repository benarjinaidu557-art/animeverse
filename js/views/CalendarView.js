/**
 * Release Calendar View
 * Airing schedule with Yesterday, Today, Tomorrow, This Week, and Next Week filters,
 * timezone-aware countdowns, and authorized stream links.
 */

import { AnimeService } from '../services/animeService.js';
import { StorageService } from '../services/storageService.js';
import { Skeletons } from '../components/Skeletons.js';

export const CalendarView = {
  currentTab: 'today', // 'yesterday' | 'today' | 'tomorrow' | 'this_week' | 'next_week'
  userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',

  async render(container, params = {}) {
    if (params.tab) this.currentTab = params.tab;

    container.innerHTML = `
      <div class="container" style="padding-top: 24px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
          <div>
            <h1 style="font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 6px;">Simulcast Release Calendar</h1>
            <p style="color: var(--text-muted); font-size: 0.95rem;">Track episodes airing straight from Tokyo in your local timezone.</p>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); padding: 8px 14px; border-radius: var(--radius-md); font-size: 0.8rem; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan-light)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <span>Timezone: <strong>${this.userTimezone}</strong></span>
          </div>
        </div>

        <!-- Timeframe Navigation Tabs -->
        <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 28px;">
          ${[
            { key: 'yesterday', label: 'Yesterday' },
            { key: 'today', label: 'Today (Live)' },
            { key: 'tomorrow', label: 'Tomorrow' },
            { key: 'this_week', label: 'This Week' },
            { key: 'next_week', label: 'Next Week' },
          ].map(t => `
            <button 
              type="button" 
              class="cal-tab-btn" 
              data-tab="${t.key}"
              style="
                padding: 10px 20px;
                border-radius: var(--radius-full);
                background: ${this.currentTab === t.key ? 'var(--accent-purple)' : 'var(--bg-card)'};
                color: ${this.currentTab === t.key ? '#fff' : 'var(--text-secondary)'};
                border: 1px solid ${this.currentTab === t.key ? 'var(--accent-purple-light)' : 'var(--border-subtle)'};
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                white-space: nowrap;
                transition: all var(--transition-fast);
              "
            >
              ${t.label}
            </button>
          `).join('')}
        </div>

        <!-- Schedule Items Results Container -->
        <div id="calendar-results-area">
          <div class="anime-grid">
            ${Skeletons.renderCardSkeletonGrid(10)}
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
    await this.fetchAndRenderSchedule();
  },

  bindEvents(container) {
    document.querySelectorAll('.cal-tab-btn').forEach(btn => {
      btn.onclick = () => {
        this.currentTab = btn.getAttribute('data-tab');
        this.render(container);
      };
    });
  },

  async fetchAndRenderSchedule() {
    const resultsArea = document.getElementById('calendar-results-area');
    if (!resultsArea) return;

    // Calculate start and end timestamps based on active tab
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    let start = Math.floor(todayStart.getTime() / 1000);
    let end = start + 86400;

    if (this.currentTab === 'yesterday') {
      start = start - 86400;
      end = start + 86400;
    } else if (this.currentTab === 'tomorrow') {
      start = start + 86400;
      end = start + 86400;
    } else if (this.currentTab === 'this_week') {
      // From beginning of week (Sunday/Monday) to 7 days
      start = start - (now.getDay() * 86400);
      end = start + (7 * 86400);
    } else if (this.currentTab === 'next_week') {
      start = start + ((7 - now.getDay()) * 86400);
      end = start + (7 * 86400);
    }

    try {
      const schedules = await AnimeService.getAiringScheduleRange(start, end, 1, 50);

      if (!schedules || schedules.length === 0) {
        resultsArea.innerHTML = `
          <div class="empty-state">
            <div class="state-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h3 class="state-title">No Airing Releases Found</h3>
            <p class="state-desc">There are no confirmed broadcasts scheduled in this timeframe.</p>
          </div>
        `;
        return;
      }

      // Render calendar items
      resultsArea.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
          ${schedules.map(item => this.renderScheduleCard(item)).join('')}
        </div>
      `;
    } catch (err) {
      console.error('Calendar load error:', err);
      resultsArea.innerHTML = `
        <div class="error-state">
          <h3 class="state-title">Unable to Load Schedule</h3>
          <p class="state-desc">${err.message || 'Error communicating with AniList'}</p>
        </div>
      `;
    }
  },

  renderScheduleCard(item) {
    const anime = item.media;
    if (!anime) return '';

    const id = anime.id;
    const title = AnimeService.formatTitle(anime.title);
    const poster = anime.coverImage?.large || anime.coverImage?.medium || 'https://placehold.co/100x150/1e1b2e/c4b5fd?text=No+Poster';
    const epNum = item.episode;
    const airingAt = item.airingAt; // Unix timestamp
    const airingDate = new Date(airingAt * 1000);
    const nowSecs = Math.floor(Date.now() / 1000);
    const diffSecs = airingAt - nowSecs;

    // Time status string
    let statusText = '';
    let isAired = diffSecs <= 0;

    if (isAired) {
      statusText = 'Aired';
    } else {
      const hours = Math.floor(diffSecs / 3600);
      const mins = Math.floor((diffSecs % 3600) / 60);
      if (hours < 24) {
        statusText = `Airing in ${hours}h ${mins}m`;
      } else {
        const days = Math.floor(hours / 24);
        statusText = `Airing in ${days}d ${hours % 24}h`;
      }
    }

    const localTimeStr = airingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const localDateStr = airingDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const isFollowing = StorageService.isFollowing(id);

    return `
      <div 
        style="
          background: var(--bg-card); 
          border: 1px solid var(--border-subtle); 
          border-radius: var(--radius-lg); 
          padding: 16px; 
          display: flex; 
          gap: 16px; 
          position: relative;
          transition: transform var(--transition-fast), border-color var(--transition-fast);
        "
        onmouseover="this.style.borderColor='var(--border-accent)'; this.style.transform='translateY(-2px)';"
        onmouseout="this.style.borderColor='var(--border-subtle)'; this.style.transform='none';"
      >
        <!-- Poster -->
        <img 
          src="${poster}" 
          alt="${escapeHtml(title)}" 
          style="width: 72px; height: 104px; object-fit: cover; border-radius: var(--radius-sm); flex-shrink: 0; cursor: pointer;"
          onclick="window.router.navigate('/anime/${id}')"
        />

        <!-- Info -->
        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column;">
          <!-- Top Row: Episode & Time -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 0.76rem; font-weight: 700; color: var(--accent-purple-light); background: rgba(139,92,246,0.15); padding: 2px 8px; border-radius: var(--radius-xs);">
              Episode ${epNum}
            </span>
            <span style="font-size: 0.74rem; font-weight: 600; color: ${isAired ? 'var(--text-muted)' : 'var(--accent-emerald)'};">
              ${statusText}
            </span>
          </div>

          <!-- Title -->
          <h3 
            style="font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer;"
            title="${escapeHtml(title)}"
            onclick="window.router.navigate('/anime/${id}')"
          >
            ${escapeHtml(title)}
          </h3>

          <!-- Airing Time (Localized) -->
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>${localDateStr} at ${localTimeStr}</span>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; gap: 8px; margin-top: auto; align-items: center;">
            <button 
              type="button" 
              class="btn-primary" 
              style="padding: 6px 14px; font-size: 0.78rem; border-radius: var(--radius-sm);"
              onclick="window.router.navigate('/anime/${id}')"
            >
              View Anime
            </button>
            <button 
              type="button" 
              class="btn-secondary" 
              style="padding: 6px 12px; font-size: 0.78rem; border-radius: var(--radius-sm);"
              onclick="window.router.navigate('/anime/${id}')"
            >
              Watch Officially
            </button>
          </div>
        </div>
      </div>
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
