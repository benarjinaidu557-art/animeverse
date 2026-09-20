/**
 * Admin Watch Sources Management Dashboard - AnimeVerse (Phase 9)
 * Route: #/admin/watch-sources
 * 
 * Provides authorized administrators with:
 * 1. Overview of discovered watch sources across all anime.
 * 2. Status verification actions: VERIFY, REJECT, EDIT, DELETE.
 * 3. Match Confidence score auditing.
 * 4. YouTube Data API v3 daily quota tracker and discovery queue status.
 * 5. On-demand official scan trigger.
 */

import { AdminService } from '../services/adminService.js';
import { Toast } from '../components/Toast.js';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const AdminWatchSourcesView = {
  sources: [],
  currentTab: 'ALL',
  searchQuery: '',
  langFilter: 'ALL',
  queueStatus: null,

  async render(container, queryParams = {}) {
    // Check admin authentication
    if (!AdminService.isAdmin()) {
      const pass = prompt('Administrator Verification Required\nPlease enter the Administrator Passcode:');
      if (!pass || !AdminService.unlockAdmin(pass)) {
        Toast.show('Access denied. Administrator privileges required.', 'error');
        window.router.navigate('/');
        return;
      }
    }

    container.innerHTML = `
      <div class="container" style="padding-top: 28px; padding-bottom: 60px;">
        
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 28px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="section-accent-bar red" style="width: 4px; height: 28px; background: #ff0000; border-radius: 2px;"></span>
              <h1 style="font-size: 1.8rem; font-weight: 800; color: #fff; margin: 0;">Admin Watch Sources &amp; Discovery</h1>
              <span style="font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 999px; background: rgba(139,92,246,0.2); border: 1px solid rgba(139,92,246,0.4); color: #c4b5fd;">Admin Mode</span>
            </div>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin: 4px 0 0 0;">
              Review, verify, and manage officially discovered YouTube episodes and series playlists.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <button type="button" id="btn-trigger-scan" class="btn btn-secondary" style="padding: 8px 16px; display: flex; align-items: center; gap: 6px; font-size: 0.84rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>Scan Anime by ID</span>
            </button>
            <button type="button" id="btn-refresh-dashboard" class="btn btn-secondary" style="padding: 8px 14px; font-size: 0.84rem;">
              ↻ Refresh
            </button>
          </div>
        </div>

        <!-- Metric Stat Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px;">
          
          <div style="background: var(--bg-card); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 18px 20px;">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Total Sources</div>
            <div id="stat-total" style="font-size: 1.8rem; font-weight: 800; color: #fff;">--</div>
          </div>

          <div style="background: var(--bg-card); border: 1px solid rgba(34,197,94,0.25); border-radius: 12px; padding: 18px 20px;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #22c55e; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Verified (Published)</div>
            <div id="stat-verified" style="font-size: 1.8rem; font-weight: 800; color: #22c55e;">--</div>
          </div>

          <div style="background: var(--bg-card); border: 1px solid rgba(245,158,11,0.25); border-radius: 12px; padding: 18px 20px;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Pending Review</div>
            <div id="stat-pending" style="font-size: 1.8rem; font-weight: 800; color: #fbbf24;">--</div>
          </div>

          <div style="background: var(--bg-card); border: 1px solid rgba(139,92,246,0.25); border-radius: 12px; padding: 18px 20px;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #c4b5fd; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">API Quota Today</div>
            <div id="stat-quota" style="font-size: 1.8rem; font-weight: 800; color: #c4b5fd;">-- / 90</div>
          </div>

        </div>

        <!-- Tabs and Filter Toolbar -->
        <div style="background: var(--bg-card); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; margin-bottom: 24px;">
          
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.2);">
            
            <!-- Status Tabs -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <button type="button" class="btn-source-tab active" data-tab="ALL" style="padding: 6px 14px; border-radius: 20px; border: 1px solid #ff0000; background: #ff0000; color: #fff; font-size: 0.8rem; font-weight: 700; cursor: pointer;">
                All (<span id="count-tab-all">0</span>)
              </button>
              <button type="button" class="btn-source-tab" data-tab="pending" style="padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.15); background: transparent; color: var(--text-secondary); font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                Pending Review (<span id="count-tab-pending">0</span>)
              </button>
              <button type="button" class="btn-source-tab" data-tab="verified" style="padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.15); background: transparent; color: var(--text-secondary); font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                Verified (<span id="count-tab-verified">0</span>)
              </button>
              <button type="button" class="btn-source-tab" data-tab="rejected" style="padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.15); background: transparent; color: var(--text-secondary); font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                Rejected (<span id="count-tab-rejected">0</span>)
              </button>
            </div>

            <!-- Search & Language Filter -->
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <select id="admin-filter-lang" style="padding: 6px 12px; background: #12141f; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.82rem; outline: none;">
                <option value="ALL">All Languages</option>
                <option value="Hindi">Hindi Dub</option>
                <option value="Telugu">Telugu Dub</option>
                <option value="Tamil">Tamil Dub</option>
                <option value="English">English</option>
                <option value="Japanese">Japanese Sub</option>
              </select>

              <input 
                type="text" 
                id="admin-search-sources" 
                placeholder="Search title, ID, or channel..." 
                style="padding: 6px 12px; background: #12141f; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.82rem; outline: none; width: 220px;" 
              />
            </div>

          </div>

          <!-- Sources Table -->
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.84rem;">
              <thead>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); color: var(--text-muted); font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(0,0,0,0.1);">
                  <th style="padding: 12px 18px;">Anime / ID</th>
                  <th style="padding: 12px 14px;">Ep / Season</th>
                  <th style="padding: 12px 14px;">Language</th>
                  <th style="padding: 12px 14px;">Distributor</th>
                  <th style="padding: 12px 14px;">Video ID</th>
                  <th style="padding: 12px 14px;">Confidence</th>
                  <th style="padding: 12px 14px;">Status</th>
                  <th style="padding: 12px 18px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody id="admin-sources-tbody">
                <tr>
                  <td colspan="8" style="padding: 40px; text-align: center; color: var(--text-dim);">Loading watch sources...</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

      </div>
    `;

    this.bindEvents(container);
    await this.loadDashboardData();
  },

  bindEvents(container) {
    // Refresh button
    document.getElementById('btn-refresh-dashboard')?.addEventListener('click', () => {
      this.loadDashboardData();
      Toast.show('Dashboard refreshed', 'info');
    });

    // On-demand scan trigger button
    document.getElementById('btn-trigger-scan')?.addEventListener('click', async () => {
      const animeIdInput = prompt('Enter the numeric AniList Anime ID to scan (e.g. 116006):');
      if (!animeIdInput) return;
      const cleanId = parseInt(animeIdInput.trim(), 10);
      if (isNaN(cleanId) || cleanId <= 0) {
        Toast.show('Please enter a valid numeric AniList ID.', 'error');
        return;
      }

      Toast.show(`Queuing Anime ID ${cleanId} for official YouTube scan...`, 'info');
      try {
        const origin = window.location.origin || 'http://localhost:3000';
        const res = await fetch(`${origin}/api/youtube-discover?animeId=${cleanId}&title=Anime&season=1&region=IN&force=true`);
        const data = await res.json();
        if (data.success) {
          Toast.show(`Scan complete! Found ${data.count} official episode candidate(s).`, 'success');
          await this.loadDashboardData();
        } else {
          Toast.show(data.message || 'Scan completed with no results', 'info');
        }
      } catch (err) {
        Toast.show(err.message || 'Error triggering scan', 'error');
      }
    });

    // Tab buttons
    container.querySelectorAll('.btn-source-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('.btn-source-tab').forEach(b => {
          b.style.background = 'transparent';
          b.style.borderColor = 'rgba(255,255,255,0.15)';
          b.style.color = 'var(--text-secondary)';
          b.classList.remove('active');
        });
        btn.style.background = '#ff0000';
        btn.style.borderColor = '#ff0000';
        btn.style.color = '#fff';
        btn.classList.add('active');

        this.currentTab = btn.dataset.tab;
        this.renderTableRows();
      });
    });

    // Search filter input
    const searchInput = document.getElementById('admin-search-sources');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderTableRows();
    });

    // Language dropdown filter
    const langSelect = document.getElementById('admin-filter-lang');
    langSelect?.addEventListener('change', (e) => {
      this.langFilter = e.target.value;
      this.renderTableRows();
    });
  },

  async loadDashboardData() {
    try {
      const origin = window.location.origin || 'http://localhost:3000';
      const [sourcesRes, queueRes] = await Promise.all([
        fetch(`${origin}/api/admin/watch-sources`).then(r => r.json()),
        fetch(`${origin}/api/queue-status`).then(r => r.json())
      ]);

      this.sources = sourcesRes.sources || [];
      this.queueStatus = queueRes || {};

      this.updateStats();
      this.renderTableRows();
    } catch (err) {
      console.error('[AdminWatchSourcesView] Load error:', err);
      const tbody = document.getElementById('admin-sources-tbody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" style="padding: 30px; text-align: center; color: #f87171;">Failed to load data: ${err.message}</td></tr>`;
      }
    }
  },

  updateStats() {
    const total = this.sources.length;
    const verified = this.sources.filter(s => s.verification_status === 'verified').length;
    const pending = this.sources.filter(s => s.verification_status === 'pending').length;
    const rejected = this.sources.filter(s => s.verification_status === 'rejected').length;

    const statTotal = document.getElementById('stat-total');
    const statVerified = document.getElementById('stat-verified');
    const statPending = document.getElementById('stat-pending');
    const statQuota = document.getElementById('stat-quota');

    if (statTotal) statTotal.textContent = total;
    if (statVerified) statVerified.textContent = verified;
    if (statPending) statPending.textContent = pending;
    if (statQuota) {
      statQuota.textContent = `${this.queueStatus?.quotaUsedToday || 0} / ${this.queueStatus?.quotaLimitDaily || 90}`;
    }

    const tabAll = document.getElementById('count-tab-all');
    const tabPending = document.getElementById('count-tab-pending');
    const tabVerified = document.getElementById('count-tab-verified');
    const tabRejected = document.getElementById('count-tab-rejected');

    if (tabAll) tabAll.textContent = total;
    if (tabPending) tabPending.textContent = pending;
    if (tabVerified) tabVerified.textContent = verified;
    if (tabRejected) tabRejected.textContent = rejected;
  },

  renderTableRows() {
    const tbody = document.getElementById('admin-sources-tbody');
    if (!tbody) return;

    let filtered = this.sources;

    if (this.currentTab !== 'ALL') {
      filtered = filtered.filter(s => s.verification_status === this.currentTab);
    }

    if (this.langFilter !== 'ALL') {
      filtered = filtered.filter(s => (s.language || '').toLowerCase().includes(this.langFilter.toLowerCase()));
    }

    if (this.searchQuery) {
      filtered = filtered.filter(s =>
        (s.video_title || '').toLowerCase().includes(this.searchQuery) ||
        String(s.anime_id) === this.searchQuery ||
        (s.channel_name || '').toLowerCase().includes(this.searchQuery) ||
        (s.video_id || '').toLowerCase().includes(this.searchQuery)
      );
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="padding: 40px; text-align: center; color: var(--text-dim);">
            No watch sources match the selected criteria.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(source => {
      const confScore = Math.round((Number(source.match_confidence) || 1.0) * 100);
      let confBadgeColor = '#22c55e';
      if (confScore < 60) confBadgeColor = '#ef4444';
      else if (confScore < 85) confBadgeColor = '#f59e0b';

      let statusBadge = `<span style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); color: #22c55e;">Verified</span>`;
      if (source.verification_status === 'pending') {
        statusBadge = `<span style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); color: #fbbf24;">Pending Review</span>`;
      } else if (source.verification_status === 'rejected') {
        statusBadge = `<span style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171;">Rejected</span>`;
      }

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
          <td style="padding: 14px 18px;">
            <div style="font-weight: 700; color: #fff;">
              <a href="#/anime/${source.anime_id}" style="color: #fff; text-decoration: none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
                ${escapeHtml(source.video_title || `Anime #${source.anime_id}`)}
              </a>
            </div>
            <div style="font-size: 0.74rem; color: var(--text-dim); margin-top: 2px;">ID: ${source.anime_id}</div>
          </td>

          <td style="padding: 14px 14px; white-space: nowrap;">
            <span style="font-weight: 600; color: #e2e8f0;">S${source.season_number || 1} Ep ${source.episode_number || 1}</span>
          </td>

          <td style="padding: 14px 14px; white-space: nowrap;">
            <span style="font-size: 0.74rem; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); color: #a5b4fc;">
              ${escapeHtml(source.language || 'Official Audio')}
            </span>
          </td>

          <td style="padding: 14px 14px; white-space: nowrap;">
            <div style="color: #e2e8f0; font-weight: 600;">${escapeHtml(source.channel_name || 'Partner')}</div>
            <div style="font-size: 0.72rem; color: var(--text-dim);">${source.region || 'IN'}</div>
          </td>

          <td style="padding: 14px 14px; font-family: monospace; font-size: 0.78rem;">
            <a href="https://www.youtube.com/watch?v=${source.video_id}" target="_blank" rel="noopener" style="color: #60a5fa; text-decoration: none;">
              ${source.video_id} ↗
            </a>
          </td>

          <td style="padding: 14px 14px; white-space: nowrap;">
            <span style="font-size: 0.76rem; font-weight: 700; color: ${confBadgeColor};">
              ${confScore}%
            </span>
          </td>

          <td style="padding: 14px 14px; white-space: nowrap;">
            ${statusBadge}
          </td>

          <td style="padding: 14px 18px; text-align: right; white-space: nowrap;">
            ${source.verification_status !== 'verified' ? `
              <button type="button" class="btn-action-verify" data-id="${source.video_id}" data-anime="${source.anime_id}" style="padding: 4px 10px; background: #22c55e; border: none; border-radius: 6px; color: #fff; font-size: 0.75rem; font-weight: 700; cursor: pointer; margin-right: 4px;">
                Verify
              </button>
            ` : ''}

            ${source.verification_status !== 'rejected' ? `
              <button type="button" class="btn-action-reject" data-id="${source.video_id}" data-anime="${source.anime_id}" style="padding: 4px 10px; background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.4); border-radius: 6px; color: #f87171; font-size: 0.75rem; font-weight: 700; cursor: pointer; margin-right: 4px;">
                Reject
              </button>
            ` : ''}

            <button type="button" class="btn-action-delete" data-id="${source.video_id}" style="padding: 4px 8px; background: transparent; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: var(--text-dim); font-size: 0.75rem; cursor: pointer;">
              ✕
            </button>
          </td>
        </tr>
      `;
    }).join('');

    this.bindRowActionButtons();
  },

  bindRowActionButtons() {
    const origin = window.location.origin || 'http://localhost:3000';

    // Verify Action
    document.querySelectorAll('.btn-action-verify').forEach(btn => {
      btn.onclick = async () => {
        const videoId = btn.dataset.id;
        const animeId = btn.dataset.anime;
        btn.disabled = true;
        try {
          const res = await fetch(`${origin}/api/admin/verify-source`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ animeId, videoId, status: 'verified' })
          });
          const data = await res.json();
          if (data.success) {
            Toast.show('Source verified and published to users!', 'success');
            await this.loadDashboardData();
          } else {
            Toast.show(data.error || 'Failed to verify source', 'error');
          }
        } catch (e) {
          Toast.show(e.message, 'error');
        } finally {
          btn.disabled = false;
        }
      };
    });

    // Reject Action
    document.querySelectorAll('.btn-action-reject').forEach(btn => {
      btn.onclick = async () => {
        const videoId = btn.dataset.id;
        const animeId = btn.dataset.anime;
        btn.disabled = true;
        try {
          const res = await fetch(`${origin}/api/admin/verify-source`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ animeId, videoId, status: 'rejected' })
          });
          const data = await res.json();
          if (data.success) {
            Toast.show('Source rejected (hidden from users)', 'info');
            await this.loadDashboardData();
          } else {
            Toast.show(data.error || 'Failed to reject source', 'error');
          }
        } catch (e) {
          Toast.show(e.message, 'error');
        } finally {
          btn.disabled = false;
        }
      };
    });

    // Delete Action
    document.querySelectorAll('.btn-action-delete').forEach(btn => {
      btn.onclick = async () => {
        const videoId = btn.dataset.id;
        if (!confirm(`Are you sure you want to permanently delete watch source ${videoId}?`)) return;
        btn.disabled = true;
        try {
          const res = await fetch(`${origin}/api/admin/delete-source`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoId })
          });
          const data = await res.json();
          if (data.success) {
            Toast.show('Source deleted', 'info');
            await this.loadDashboardData();
          } else {
            Toast.show(data.error || 'Failed to delete source', 'error');
          }
        } catch (e) {
          Toast.show(e.message, 'error');
        } finally {
          btn.disabled = false;
        }
      };
    });
  }
};
