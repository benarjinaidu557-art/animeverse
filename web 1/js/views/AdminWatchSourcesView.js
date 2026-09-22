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
import { AnalyticsService } from '../services/analyticsService.js';
import { escapeHtml } from '../utils/stringUtils.js';

export const AdminWatchSourcesView = {
  sources: [],
  discoveredCandidates: [],
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

        <!-- Daily Unique Visitors Analytics Section -->
        <div class="admin-analytics-card" style="background: var(--bg-card); border: 1px solid rgba(139, 92, 246, 0.35); border-radius: 14px; padding: 22px; margin-bottom: 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
          
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(139, 92, 246, 0.2); display: flex; align-items: center; justify-content: center; color: var(--accent-purple-light);">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <h2 style="font-size: 1.2rem; font-weight: 800; color: #fff; margin: 0;">Daily Unique Visitor Analytics</h2>
                  <span style="background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); color: #22c55e; font-size: 0.70rem; font-weight: 700; padding: 2px 7px; border-radius: 999px;">
                    1 Visit / Day Strict
                  </span>
                </div>
                <p style="color: var(--text-muted); font-size: 0.8rem; margin: 2px 0 0 0;">
                  Anonymous privacy-first tracking. Counts each visitor exactly once per calendar day regardless of refreshes or reopens.
                </p>
              </div>
            </div>

            <button type="button" id="btn-refresh-analytics" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              <span>Refresh Stats</span>
            </button>
          </div>

          <!-- 5 Requested Analytics Metric Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin-bottom: 22px;">
            
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 10px; padding: 16px 18px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 0.72rem; font-weight: 700; color: var(--accent-purple-light); text-transform: uppercase;">Today</span>
                <span style="width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 6px #22c55e;"></span>
              </div>
              <div id="stat-visitor-today" style="font-size: 1.75rem; font-weight: 800; color: #fff;">--</div>
              <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Today's unique visitors</div>
            </div>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 16px 18px;">
              <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 4px;">Yesterday</div>
              <div id="stat-visitor-yesterday" style="font-size: 1.75rem; font-weight: 800; color: #fff;">--</div>
              <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Yesterday's unique count</div>
            </div>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 10px; padding: 16px 18px;">
              <div style="font-size: 0.72rem; font-weight: 700; color: #60a5fa; text-transform: uppercase; margin-bottom: 4px;">Last 7 Days</div>
              <div id="stat-visitor-7days" style="font-size: 1.75rem; font-weight: 800; color: #60a5fa;">--</div>
              <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Unique visitor-days</div>
            </div>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 16px 18px;">
              <div style="font-size: 0.72rem; font-weight: 700; color: #fbbf24; text-transform: uppercase; margin-bottom: 4px;">Last 30 Days</div>
              <div id="stat-visitor-30days" style="font-size: 1.75rem; font-weight: 800; color: #fbbf24;">--</div>
              <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Unique visitor-days</div>
            </div>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 16px 18px;">
              <div style="font-size: 0.72rem; font-weight: 700; color: #34d178; text-transform: uppercase; margin-bottom: 4px;">Total Visitor-Days</div>
              <div id="stat-visitor-total" style="font-size: 1.75rem; font-weight: 800; color: #34d178;">--</div>
              <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Total unique records</div>
            </div>

          </div>

          <!-- 7-Day Trend Visual Breakdown -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 16px 18px;">
            <div style="font-size: 0.78rem; font-weight: 700; color: #cbd5e1; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
              <span>Past 7 Days Daily Trend</span>
              <span style="font-size: 0.7rem; color: var(--text-dim);">Strict 1 / day metric</span>
            </div>
            <div id="visitor-chart-bars" style="display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; height: 110px; padding: 8px 4px 0;">
              <div style="color: var(--text-dim); font-size: 0.8rem; margin: auto;">Loading visitor trend...</div>
            </div>
          </div>

        </div>

        <!-- YouTube Episode Discovery Tool -->
        <div style="background: var(--bg-card); border: 1px solid rgba(255, 0, 0, 0.25); border-radius: 14px; padding: 22px; margin-bottom: 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
          
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.3rem;">📺</span>
              <div>
                <h2 style="font-size: 1.2rem; font-weight: 800; color: #fff; margin: 0;">YouTube Episode Discovery</h2>
                <p style="color: var(--text-muted); font-size: 0.8rem; margin: 2px 0 0 0;">
                  Query official licensors (Muse India, Ani-One, Muse Asia) via YouTube Data API v3 with automatic episode &amp; language verification.
                </p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.74rem; color: #22c55e; background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.3); padding: 3px 8px; border-radius: 6px; font-weight: 600;">
                ✓ Official Licensors Only
              </span>
              <span style="font-size: 0.74rem; color: #38bdf8; background: rgba(56,189,248,0.12); border: 1px solid rgba(56,189,248,0.3); padding: 3px 8px; border-radius: 6px; font-weight: 600;">
                Quota Budget Guarded
              </span>
            </div>
          </div>

          <!-- Discovery Inputs -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 16px;">
            <div>
              <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">Anime (Title or AniList ID)</label>
              <input type="text" id="disco-anime" placeholder="e.g. Classroom of the Elite or 98659" value="Classroom of the Elite" style="width: 100%; padding: 8px 12px; background: #12141f; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.85rem; outline: none;" />
            </div>

            <div>
              <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">Season</label>
              <select id="disco-season" style="width: 100%; padding: 8px 12px; background: #12141f; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.85rem; outline: none;">
                <option value="1">Season 1</option>
                <option value="2">Season 2</option>
                <option value="3">Season 3</option>
                <option value="4">Season 4</option>
              </select>
            </div>

            <div>
              <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">Language</label>
              <select id="disco-language" style="width: 100%; padding: 8px 12px; background: #12141f; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.85rem; outline: none;">
                <option value="Telugu" selected>Telugu</option>
                <option value="Hindi">Hindi Dub</option>
                <option value="Tamil">Tamil Dub</option>
                <option value="English">English</option>
                <option value="Japanese">Japanese (English Sub)</option>
              </select>
            </div>

            <div>
              <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">Region</label>
              <select id="disco-region" style="width: 100%; padding: 8px 12px; background: #12141f; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.85rem; outline: none;">
                <option value="IN" selected>India (IN)</option>
                <option value="AS">Asia (AS)</option>
                <option value="JP">Japan (JP)</option>
                <option value="US">Global / US</option>
              </select>
            </div>
          </div>

          <!-- Buttons Bar -->
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <button type="button" id="btn-disco-discover" class="btn btn-primary" style="padding: 9px 18px; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 8px; background: #ff0000; border: none; border-radius: 8px; color: #fff; cursor: pointer;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span>Discover Episodes</span>
              </button>
              <span id="disco-loading-spinner" style="display: none; font-size: 0.82rem; color: #fbbf24;">🔍 Querying official YouTube channels...</span>
            </div>

            <div style="display: flex; align-items: center; gap: 10px;">
              <button type="button" id="btn-disco-verify-selected" class="btn btn-secondary" style="padding: 8px 16px; font-size: 0.82rem; font-weight: 600; display: flex; align-items: center; gap: 6px; background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); color: #22c55e; border-radius: 8px; cursor: pointer;">
                ✓ Verify Selected
              </button>
              <button type="button" id="btn-disco-save-sources" class="btn btn-secondary" style="padding: 8px 16px; font-size: 0.82rem; font-weight: 700; display: flex; align-items: center; gap: 6px; background: #22c55e; border: none; color: #fff; border-radius: 8px; cursor: pointer;">
                💾 Save Verified Sources
              </button>
            </div>
          </div>

          <!-- Discovered Results Table -->
          <div id="disco-results-container" style="display: none; margin-top: 14px; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; background: rgba(0,0,0,0.25);">
            <div style="padding: 10px 16px; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08);">
              <div style="font-size: 0.82rem; font-weight: 700; color: #e2e8f0;">
                Found <span id="disco-count" style="color: #ff0000; font-weight: 800;">0</span> Candidate Episode(s)
              </div>
              <div style="font-size: 0.74rem; color: var(--text-dim);">
                Select episodes to verify and publish to users
              </div>
            </div>
            <div style="max-height: 380px; overflow-y: auto; overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.82rem;">
                <thead>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase; background: rgba(0,0,0,0.15);">
                    <th style="padding: 10px 14px; width: 30px;"><input type="checkbox" id="disco-select-all" checked /></th>
                    <th style="padding: 10px 12px; width: 65px;">Ep #</th>
                    <th style="padding: 10px 14px;">YouTube Title</th>
                    <th style="padding: 10px 12px;">Channel</th>
                    <th style="padding: 10px 12px;">Video ID</th>
                    <th style="padding: 10px 12px;">Language</th>
                    <th style="padding: 10px 12px;">Embeddable</th>
                    <th style="padding: 10px 12px;">Status</th>
                    <th style="padding: 10px 14px; text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody id="disco-results-tbody"></tbody>
              </table>
            </div>
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

    // Refresh Visitor Analytics button
    document.getElementById('btn-refresh-analytics')?.addEventListener('click', async () => {
      await this.loadVisitorAnalytics();
      Toast.show('Visitor analytics refreshed', 'info');
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

    // YouTube Episode Discovery buttons & checkboxes
    document.getElementById('btn-disco-discover')?.addEventListener('click', () => {
      this.handleDiscover();
    });

    document.getElementById('disco-select-all')?.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      document.querySelectorAll('.disco-row-cb').forEach(cb => {
        cb.checked = isChecked;
      });
    });

    document.getElementById('btn-disco-verify-selected')?.addEventListener('click', () => {
      this.handleVerifySelected();
    });

    document.getElementById('btn-disco-save-sources')?.addEventListener('click', () => {
      this.handleSaveSources();
    });
  },

  resolveAnimeId(inputStr, season) {

    if (clean.includes("gatherer's adventure") || clean.includes("gatherer") || clean.includes("sozai saishuka")) return 187663;
    if (clean.includes("skeleton knight") || clean.includes("gaikotsu kishi")) return 132474;
    if (clean.includes("campfire cooking") || clean.includes("tondemo skill")) return 156067;
    if (clean.includes("pokemon") || clean.includes("pokémon") || clean.includes("pocket monsters")) {
      if (clean.includes("diamond") || clean.includes("pearl") || clean.includes("battle dimension") || season === 11) return 1565;
      if (clean.includes("xy") || season === 17) return 19291;
      if (clean.includes("journeys") || clean.includes("ultimate") || season === 25) return 112153;
      return 1565;
    }
    if (clean.includes("attack on titan") || clean.includes("shingeki")) {
      if (season === 2) return 20958;
      return 16498;
    }
    if (clean.includes("one punch") || clean.includes("one-punch")) {
      if (season === 2) return 102194;
      if (season === 3) return 153800;
      return 21087;
    }

    if (!inputStr) return 0;
    const clean = inputStr.trim().toLowerCase();
    const num = parseInt(clean, 10);
    if (!isNaN(num) && String(num) === clean) return num;

    if (clean.includes('classroom of the elite') || clean.includes('youkoso')) {
      if (season === 2) return 145545;
      if (season === 3) return 146066;
      return 98659;
    }
    if (clean.includes('mob psycho')) {
      if (season === 2) return 101338;
      return 21507;
    }
    if (clean.includes('god of high school')) return 116006;
    if (clean.includes('chainsaw man')) return 127230;
    if (clean.includes('frieren')) return 154587;
    if (clean.includes('jujutsu')) return 113415;
    return 0;
  },

  async handleDiscover() {
    const animeInput = document.getElementById('disco-anime')?.value?.trim() || '';
    const season = parseInt(document.getElementById('disco-season')?.value || '1', 10);
    const language = document.getElementById('disco-language')?.value || 'Telugu';
    const region = document.getElementById('disco-region')?.value || 'IN';

    if (!animeInput) {
      Toast.show('Please enter an anime title or AniList ID.', 'error');
      return;
    }

    const animeId = this.resolveAnimeId(animeInput, season);
    const title = isNaN(parseInt(animeInput, 10)) ? animeInput : '';

    const spinner = document.getElementById('disco-loading-spinner');
    const discoverBtn = document.getElementById('btn-disco-discover');
    if (spinner) spinner.style.display = 'inline';
    if (discoverBtn) discoverBtn.disabled = true;

    try {
      const origin = window.location.origin || 'http://localhost:3000';
      const url = `${origin}/api/youtube-discover?animeId=${animeId}&title=${encodeURIComponent(title || animeInput)}&season=${season}&language=${encodeURIComponent(language)}&region=${region}&force=true`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && Array.isArray(data.episodes) && data.episodes.length > 0) {
        this.discoveredCandidates = data.episodes.map(ep => ({
          ...ep,
          anime_id: ep.anime_id || animeId || 98659,
          season_number: ep.season_number || season,
          language: ep.language || language
        }));
        Toast.show(`Discovered ${this.discoveredCandidates.length} official episode(s)!`, 'success');
      } else {
        // Check if existing verified sources match this anime & season
        const matchingExisting = this.sources.filter(s => 
          (s.anime_id === animeId || (title && (s.video_title || '').toLowerCase().includes(title.toLowerCase()))) &&
          (s.season_number === season)
        );
        if (matchingExisting.length > 0) {
          this.discoveredCandidates = matchingExisting;
          Toast.show(`Loaded ${this.discoveredCandidates.length} official episode(s) from catalog.`, 'info');
        } else {
          this.discoveredCandidates = [];
          Toast.show(data.message || 'No official episodes found for this query.', 'info');
        }
      }

      if (data.quotaUsedToday !== undefined && this.queueStatus) {
        this.queueStatus.quotaUsedToday = data.quotaUsedToday;
        this.updateStats();
      }

      this.renderDiscoveredTable();
    } catch (err) {
      console.error('[AdminDiscovery] Error:', err);
      Toast.show(`Discovery error: ${err.message}`, 'error');
    } finally {
      if (spinner) spinner.style.display = 'none';
      if (discoverBtn) discoverBtn.disabled = false;
    }
  },

  renderDiscoveredTable() {
    const container = document.getElementById('disco-results-container');
    const tbody = document.getElementById('disco-results-tbody');
    const countEl = document.getElementById('disco-count');
    if (!container || !tbody) return;

    if (this.discoveredCandidates.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    if (countEl) countEl.textContent = this.discoveredCandidates.length;

    tbody.innerHTML = this.discoveredCandidates.map((c, idx) => {
      const isVerified = c.verification_status === 'verified';
      const isRejected = c.verification_status === 'rejected';

      let statusBadge = `<span style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); color: #22c55e;">Verified</span>`;
      if (c.verification_status === 'needs_verification' || c.verification_status === 'pending') {
        statusBadge = `<span style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); color: #fbbf24;">Needs Verification</span>`;
      } else if (isRejected) {
        statusBadge = `<span style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171;">Rejected</span>`;
      }

      const embedBadge = c.is_embeddable 
        ? `<span style="color: #22c55e; font-weight: 700;">✓ Yes</span>`
        : `<span style="color: #ef4444; font-weight: 700;">✕ No</span>`;

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
          <td style="padding: 10px 14px;">
            <input type="checkbox" class="disco-row-cb" data-idx="${idx}" ${isVerified ? 'checked' : ''} />
          </td>
          <td style="padding: 10px 12px; font-weight: 700; color: #fff;">
            Ep ${c.episode_number || (idx + 1)}
          </td>
          <td style="padding: 10px 14px; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <a href="${c.source_url || 'https://www.youtube.com/watch?v=' + c.video_id}" target="_blank" rel="noopener" style="color: #fff; text-decoration: none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
              ${escapeHtml(c.video_title || 'Episode')}
            </a>
          </td>
          <td style="padding: 10px 12px; white-space: nowrap; color: #e2e8f0; font-weight: 600;">
            ${escapeHtml(c.channel_name || 'Muse India')}
          </td>
          <td style="padding: 10px 12px; font-family: monospace; font-size: 0.78rem;">
            <a href="https://www.youtube.com/watch?v=${c.video_id}" target="_blank" rel="noopener" style="color: #60a5fa; text-decoration: none;">
              ${c.video_id} ↗
            </a>
          </td>
          <td style="padding: 10px 12px; white-space: nowrap;">
            <span style="font-size: 0.72rem; font-weight: 600; padding: 2px 7px; border-radius: 4px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); color: #a5b4fc;">
              ${escapeHtml(c.language || 'Telugu')}
            </span>
          </td>
          <td style="padding: 10px 12px; white-space: nowrap;">
            ${embedBadge}
          </td>
          <td style="padding: 10px 12px; white-space: nowrap;">
            ${statusBadge}
          </td>
          <td style="padding: 10px 14px; text-align: right; white-space: nowrap;">
            ${!isVerified ? `
              <button type="button" class="btn-disco-toggle-verify" data-idx="${idx}" style="padding: 3px 8px; background: #22c55e; border: none; border-radius: 5px; color: #fff; font-size: 0.72rem; font-weight: 700; cursor: pointer;">
                Verify
              </button>
            ` : `
              <button type="button" class="btn-disco-toggle-unverify" data-idx="${idx}" style="padding: 3px 8px; background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.4); border-radius: 5px; color: #f87171; font-size: 0.72rem; font-weight: 600; cursor: pointer;">
                Unverify
              </button>
            `}
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-disco-toggle-verify').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx, 10);
        if (this.discoveredCandidates[idx]) {
          this.discoveredCandidates[idx].verification_status = 'verified';
          this.renderDiscoveredTable();
        }
      };
    });

    tbody.querySelectorAll('.btn-disco-toggle-unverify').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx, 10);
        if (this.discoveredCandidates[idx]) {
          this.discoveredCandidates[idx].verification_status = 'needs_verification';
          this.renderDiscoveredTable();
        }
      };
    });
  },

  handleVerifySelected() {
    const checkboxes = document.querySelectorAll('.disco-row-cb');
    let count = 0;
    checkboxes.forEach(cb => {
      if (cb.checked) {
        const idx = parseInt(cb.dataset.idx, 10);
        if (this.discoveredCandidates[idx]) {
          this.discoveredCandidates[idx].verification_status = 'verified';
          count++;
        }
      }
    });
    this.renderDiscoveredTable();
    Toast.show(`Marked ${count} episode(s) as Verified! Click "Save Verified Sources" to persist.`, 'success');
  },

  async handleSaveSources() {
    // Collect verified episodes or checked items
    const checkedIndices = new Set();
    document.querySelectorAll('.disco-row-cb').forEach(cb => {
      if (cb.checked) checkedIndices.add(parseInt(cb.dataset.idx, 10));
    });

    const toSave = this.discoveredCandidates.filter((c, idx) => 
      c.verification_status === 'verified' || checkedIndices.has(idx)
    ).map(c => ({
      ...c,
      verification_status: 'verified'
    }));

    if (toSave.length === 0) {
      Toast.show('No verified episodes to save. Please select or verify episodes first.', 'info');
      return;
    }

    const saveBtn = document.getElementById('btn-disco-save-sources');
    if (saveBtn) saveBtn.disabled = true;

    try {
      const origin = window.location.origin || 'http://localhost:3000';
      const res = await fetch(`${origin}/api/admin/save-sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: toSave })
      });
      const data = await res.json();
      if (data.success) {
        Toast.show(`Successfully saved ${data.count || toSave.length} verified watch sources!`, 'success');
        await this.loadDashboardData();
      } else {
        Toast.show(data.error || 'Failed to save verified sources.', 'error');
      }
    } catch (err) {
      Toast.show(err.message || 'Error saving sources', 'error');
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
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

    // Also refresh visitor analytics alongside dashboard load
    this.loadVisitorAnalytics();
  },

  async loadVisitorAnalytics() {
    const elToday = document.getElementById('stat-visitor-today');
    const elYesterday = document.getElementById('stat-visitor-yesterday');
    const el7Days = document.getElementById('stat-visitor-7days');
    const el30Days = document.getElementById('stat-visitor-30days');
    const elTotal = document.getElementById('stat-visitor-total');
    const elBars = document.getElementById('visitor-chart-bars');

    try {
      const stats = await AnalyticsService.getVisitorAnalytics();

      if (elToday) elToday.textContent = stats.today.toLocaleString();
      if (elYesterday) elYesterday.textContent = stats.yesterday.toLocaleString();
      if (el7Days) el7Days.textContent = stats.last7Days.toLocaleString();
      if (el30Days) el30Days.textContent = stats.last30Days.toLocaleString();
      if (elTotal) elTotal.textContent = stats.totalUniqueVisitorDays.toLocaleString();

      if (elBars && Array.isArray(stats.dailyBreakdown7d)) {
        const maxCount = Math.max(...stats.dailyBreakdown7d.map(d => d.count), 1);
        elBars.innerHTML = stats.dailyBreakdown7d.map(day => {
          const heightPercent = Math.max(Math.round((day.count / maxCount) * 100), 10);
          const isToday = day.date === stats.todayDateStr;
          const barColor = isToday ? '#6366f1' : '#3b82f6';
          const labelParts = day.date.split('-');
          const shortDate = labelParts.length === 3 ? `${labelParts[1]}/${labelParts[2]}` : day.date;

          return `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 6px;">
              <span style="font-size: 0.72rem; font-weight: 700; color: ${isToday ? '#818cf8' : '#94a3b8'};">
                ${day.count}
              </span>
              <div style="width: 100%; max-width: 38px; height: ${heightPercent}%; background: ${barColor}; border-radius: 4px 4px 0 0; transition: height 0.3s ease; box-shadow: 0 0 10px ${isToday ? 'rgba(99,102,241,0.4)' : 'rgba(59,130,246,0.2)'};" title="${day.date}: ${day.count} unique visitors"></div>
              <span style="font-size: 0.68rem; color: var(--text-dim); margin-top: 2px;">
                ${shortDate}
              </span>
            </div>
          `;
        }).join('');
      }
    } catch (err) {
      console.error('[AdminWatchSourcesView] Failed to load visitor analytics:', err);
      if (elBars) {
        elBars.innerHTML = `<div style="color: #f87171; font-size: 0.8rem; margin: auto;">Unable to load visitor analytics: ${err.message}</div>`;
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
