/**
 * Admin Watch Source Modal - AnimeVerse
 * Allows authorized administrators to manually enter verified official YouTube anime episodes
 * into the Supabase watch_sources table.
 * 
 * Fields:
 * - Anime ID (AniList numeric ID)
 * - Season Number
 * - Episode Number
 * - Official Channel Name
 * - Channel ID
 * - YouTube Video ID or URL
 * - Region (IN, GLOBAL, ASIA)
 * - Language (Sub / Dub)
 * - Video Title
 */

import { YouTubeDiscoveryService } from '../services/youtubeDiscoveryService.js';
import { AdminService, DEFAULT_APPROVED_CHANNELS } from '../services/adminService.js';
import { Toast } from './Toast.js';

export const AdminWatchSourceModal = {
  currentAnimeId: null,
  onSavedCallback: null,

  /**
   * Initializes the modal container in DOM if not present
   */
  init() {
    if (document.getElementById('admin-watch-source-modal')) return;

    const modalHtml = `
      <div id="admin-watch-source-modal" class="modal-backdrop" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9999; align-items: center; justify-content: center; backdrop-filter: blur(6px); padding: 16px;">
        <div class="modal-dialog" style="background: #12141f; border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; width: 100%; max-width: 540px; box-shadow: 0 20px 50px rgba(0,0,0,0.7); overflow: hidden;">
          
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 24px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02);">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 32px; height: 32px; border-radius: 8px; background: #ff0000; display: flex; align-items: center; justify-content: center; color: #fff;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #fff;">Official YouTube Watch Manager</h3>
                <span style="font-size: 0.75rem; color: #a1a1aa;">Admin Verification &amp; API Integration</span>
              </div>
            </div>
            <button type="button" id="admin-modal-close-btn" style="background: transparent; border: none; color: #a1a1aa; cursor: pointer; padding: 4px; display: flex;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Tab Bar -->
          <div style="display: flex; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.2); padding: 0 24px;">
            <button type="button" id="tab-btn-manual" style="padding: 12px 16px; background: transparent; border: none; border-bottom: 2px solid #ff0000; color: #fff; font-size: 0.85rem; font-weight: 700; cursor: pointer;">
              Add Episode Manually
            </button>
            <button type="button" id="tab-btn-api" style="padding: 12px 16px; background: transparent; border: none; border-bottom: 2px solid transparent; color: #a1a1aa; font-size: 0.85rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              <span>Connect YouTube API</span>
              <span id="api-status-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #f59e0b;"></span>
            </button>
          </div>

          <!-- Panel 1: Manual Form -->
          <form id="admin-watch-source-form" style="padding: 20px 24px;">
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">Anime ID *</label>
                <input type="number" id="adm-anime-id" required style="width: 100%; padding: 8px 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.88rem; outline: none;" />
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">Season *</label>
                  <input type="number" id="adm-season-num" value="1" min="1" required style="width: 100%; padding: 8px 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.88rem; outline: none;" />
                </div>
                <div>
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">Episode *</label>
                  <input type="number" id="adm-ep-num" value="1" min="1" required style="width: 100%; padding: 8px 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.88rem; outline: none;" />
                </div>
              </div>
            </div>

            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">Official Distributor Channel *</label>
              <select id="adm-channel-preset" style="width: 100%; padding: 8px 12px; background: #1a1d2e; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.88rem; outline: none; margin-bottom: 8px;">
                ${DEFAULT_APPROVED_CHANNELS.map(c => `
                  <option value="${c.name}" data-id="${c.id}">${c.name} (${c.handle})</option>
                `).join('')}
                <option value="custom">Other Official Channel (Custom)</option>
              </select>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <input type="text" id="adm-channel-name" placeholder="Channel Name" value="Muse Asia" required style="width: 100%; padding: 8px 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.85rem; outline: none;" />
                <input type="text" id="adm-channel-id" placeholder="Channel ID (e.g. UCGbshtv...)" value="UCGbshtvS9t-8CW11W7TooQg" required style="width: 100%; padding: 8px 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.85rem; outline: none;" />
              </div>
            </div>

            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">YouTube Video ID, Playlist ID, or Full URL *</label>
              <input type="text" id="adm-video-input" placeholder="e.g. jSeXcj5y3Ao or https://www.youtube.com/playlist?list=PL..." required style="width: 100%; padding: 8px 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.88rem; outline: none;" />
              <div id="adm-video-preview" style="font-size: 0.75rem; color: #22c55e; margin-top: 4px; display: none;">
                <span id="adm-video-type-label">Detected Source:</span> <strong id="adm-video-id-text"></strong>
              </div>
            </div>

            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">Video / Episode Title (Optional)</label>
              <input type="text" id="adm-video-title" placeholder="e.g. Episode 1 - PROJECT APPLE or Full Series Official Playlist" style="width: 100%; padding: 8px 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.88rem; outline: none;" />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px;">
              <div>
                <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">Region *</label>
                <select id="adm-region" style="width: 100%; padding: 8px 12px; background: #1a1d2e; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.88rem; outline: none;">
                  <option value="IN" selected>India (IN)</option>
                  <option value="GLOBAL">Global / Worldwide</option>
                  <option value="ASIA">Asia & South Asia</option>
                </select>
              </div>
              <div>
                <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">Official Audio / Subtitle Language *</label>
                <select id="adm-language-preset" style="width: 100%; padding: 8px 12px; background: #1a1d2e; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.85rem; outline: none; margin-bottom: 6px;">
                  <option value="ja-JP / en-Sub">Japanese Audio (English Sub)</option>
                  <option value="hi-IN Dub">Hindi Dub (Official)</option>
                  <option value="te-IN Dub">Telugu Dub (Official)</option>
                  <option value="ta-IN Dub">Tamil Dub (Official)</option>
                  <option value="bn-IN Dub">Bengali Dub (Official)</option>
                  <option value="en-US Dub">English Dub (Official)</option>
                  <option value="custom">Other / Custom</option>
                </select>
                <input type="text" id="adm-language" value="ja-JP / en-Sub" style="width: 100%; padding: 6px 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.82rem; outline: none;" />
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
              <button type="button" id="adm-cancel-btn" class="btn btn-secondary" style="padding: 8px 18px;">Cancel</button>
              <button type="submit" id="adm-save-btn" class="btn btn-primary" style="background: #ff0000; border-color: #ff0000; padding: 8px 22px;">
                Save Verified Episode
              </button>
            </div>
          </form>

          <!-- Panel 2: Connect YouTube API -->
          <div id="admin-api-panel" style="display: none; padding: 20px 24px;">
            <div id="api-status-box" style="padding: 14px 16px; border-radius: 10px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); margin-bottom: 18px; display: flex; align-items: flex-start; gap: 12px;">
              <div style="color: #f59e0b; margin-top: 2px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div style="flex: 1;">
                <h4 id="api-status-title" style="margin: 0 0 4px; font-size: 0.95rem; font-weight: 700; color: #fff;">Checking Connection...</h4>
                <p id="api-status-desc" style="margin: 0; font-size: 0.8rem; color: #cbd5e1; line-height: 1.4;">Connecting to backend discovery status...</p>
              </div>
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #cbd5e1; margin-bottom: 6px;">Google Cloud YouTube Data API v3 Key *</label>
              <input type="text" id="adm-api-key-input" placeholder="AIzaSy..." style="width: 100%; padding: 10px 14px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.18); border-radius: 8px; color: #fff; font-size: 0.9rem; outline: none; font-family: monospace;" />
              <div style="font-size: 0.74rem; color: #94a3b8; margin-top: 6px; line-height: 1.4;">
                This key enables automatic discovery of official licensed episodes across Muse India, Ani-One India, Muse Asia, and Ani-One Asia. Saved securely in <code>.env.local</code> on the server.
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
              <button type="button" id="adm-test-api-btn" class="btn btn-secondary" style="padding: 8px 18px; display: flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                <span>Test Connection</span>
              </button>
              <button type="button" id="adm-save-api-btn" class="btn btn-primary" style="background: #22c55e; border-color: #22c55e; padding: 8px 22px;">
                Save &amp; Connect API
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this.bindEvents();
  },

  bindEvents() {
    const modal = document.getElementById('admin-watch-source-modal');
    const form = document.getElementById('admin-watch-source-form');
    const closeBtn = document.getElementById('admin-modal-close-btn');
    const cancelBtn = document.getElementById('adm-cancel-btn');
    const presetSelect = document.getElementById('adm-channel-preset');
    const langSelect = document.getElementById('adm-language-preset');
    const langInput = document.getElementById('adm-language');
    const channelNameInput = document.getElementById('adm-channel-name');
    const channelIdInput = document.getElementById('adm-channel-id');
    const videoInput = document.getElementById('adm-video-input');
    const previewDiv = document.getElementById('adm-video-preview');
    const videoIdText = document.getElementById('adm-video-id-text');
    const videoTypeLabel = document.getElementById('adm-video-type-label');

    closeBtn?.addEventListener('click', () => this.hide());
    cancelBtn?.addEventListener('click', () => this.hide());
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) this.hide();
    });

    // Preset channel selection
    presetSelect?.addEventListener('change', (e) => {
      const selected = presetSelect.options[presetSelect.selectedIndex];
      if (e.target.value === 'custom') {
        channelNameInput.value = '';
        channelIdInput.value = '';
        channelNameInput.focus();
      } else {
        channelNameInput.value = selected.value;
        channelIdInput.value = selected.dataset.id || '';
      }
    });

    // Language preset selection
    langSelect?.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        langInput.value = '';
        langInput.focus();
      } else {
        langInput.value = e.target.value;
      }
    });

    // Video input auto-extract preview
    videoInput?.addEventListener('input', () => {
      const source = YouTubeDiscoveryService.extractSource(videoInput.value);
      if (source.isPlaylist && source.videoId && source.videoId !== source.playlistId) {
        if (videoTypeLabel) videoTypeLabel.textContent = 'Detected Video in Official Playlist:';
        videoIdText.textContent = `Video: ${source.videoId} | Playlist: ${source.playlistId}`;
        previewDiv.style.display = 'block';
      } else if (source.isPlaylist) {
        if (videoTypeLabel) videoTypeLabel.textContent = 'Detected Official Playlist:';
        videoIdText.textContent = source.playlistId;
        previewDiv.style.display = 'block';
      } else if (source.videoId && source.videoId.length === 11) {
        if (videoTypeLabel) videoTypeLabel.textContent = 'Detected Video ID:';
        videoIdText.textContent = source.videoId;
        previewDiv.style.display = 'block';
      } else {
        previewDiv.style.display = 'none';
      }
    });

    // Form submit
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('adm-save-btn');
      if (saveBtn) saveBtn.disabled = true;

      try {
        const animeId = parseInt(document.getElementById('adm-anime-id').value, 10);
        const seasonNum = parseInt(document.getElementById('adm-season-num').value, 10) || 1;
        const epNum = parseInt(document.getElementById('adm-ep-num').value, 10);
        const channelName = document.getElementById('adm-channel-name').value;
        const channelId = document.getElementById('adm-channel-id').value;
        const rawVideo = document.getElementById('adm-video-input').value;
        const videoTitle = document.getElementById('adm-video-title').value;
        const region = document.getElementById('adm-region').value;
        const language = document.getElementById('adm-language').value;

        const savedRecord = await YouTubeDiscoveryService.addOfficialEpisode({
          anime_id: animeId,
          season_number: seasonNum,
          episode_number: epNum,
          channel_name: channelName,
          channel_id: channelId,
          video_id: rawVideo,
          region,
          language,
          video_title: videoTitle
        });

        Toast.show(`Episode ${epNum} added to official watch sources!`, 'success');
        this.hide();

        if (typeof this.onSavedCallback === 'function') {
          this.onSavedCallback(savedRecord);
        }
      } catch (err) {
        console.error('Error saving watch source:', err);
        Toast.show(err.message || 'Failed to save watch source', 'error');
      } finally {
        if (saveBtn) saveBtn.disabled = false;
      }
    });

    // Tab Switching
    const tabBtnManual = document.getElementById('tab-btn-manual');
    const tabBtnApi = document.getElementById('tab-btn-api');
    const panelManual = document.getElementById('admin-watch-source-form');
    const panelApi = document.getElementById('admin-api-panel');
    const statusDot = document.getElementById('api-status-dot');
    const statusBox = document.getElementById('api-status-box');
    const statusTitle = document.getElementById('api-status-title');
    const statusDesc = document.getElementById('api-status-desc');
    const apiKeyInput = document.getElementById('adm-api-key-input');
    const testApiBtn = document.getElementById('adm-test-api-btn');
    const saveApiBtn = document.getElementById('adm-save-api-btn');

    const checkApiStatus = async (keyOverride = '') => {
      if (statusTitle) statusTitle.textContent = 'Testing connection...';
      if (statusDesc) statusDesc.textContent = 'Querying YouTube Data API v3...';
      const status = await YouTubeDiscoveryService.checkApiStatus(keyOverride);
      if (status.connected) {
        if (statusDot) statusDot.style.background = '#22c55e';
        if (statusBox) {
          statusBox.style.background = 'rgba(34, 197, 94, 0.12)';
          statusBox.style.borderColor = 'rgba(34, 197, 94, 0.35)';
        }
        if (statusTitle) {
          statusTitle.textContent = 'Connected & Verified';
          statusTitle.style.color = '#22c55e';
        }
        if (statusDesc) {
          statusDesc.textContent = `YouTube Data API is live! Verified channel access: ${status.verifiedChannel || 'Muse India'}.`;
        }
      } else {
        if (statusDot) statusDot.style.background = status.configured ? '#ef4444' : '#f59e0b';
        if (statusBox) {
          statusBox.style.background = status.configured ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)';
          statusBox.style.borderColor = status.configured ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)';
        }
        if (statusTitle) {
          statusTitle.textContent = status.configured ? 'Connection Failed' : 'API Key Not Configured';
          statusTitle.style.color = status.configured ? '#f87171' : '#fbbf24';
        }
        if (statusDesc) {
          statusDesc.textContent = status.error || status.message || 'Enter your Google Cloud YouTube Data API v3 key below.';
        }
      }
    };

    tabBtnManual?.addEventListener('click', () => {
      tabBtnManual.style.borderBottomColor = '#ff0000';
      tabBtnManual.style.color = '#fff';
      tabBtnManual.style.fontWeight = '700';
      tabBtnApi.style.borderBottomColor = 'transparent';
      tabBtnApi.style.color = '#a1a1aa';
      tabBtnApi.style.fontWeight = '600';
      if (panelManual) panelManual.style.display = 'block';
      if (panelApi) panelApi.style.display = 'none';
    });

    tabBtnApi?.addEventListener('click', () => {
      tabBtnApi.style.borderBottomColor = '#ff0000';
      tabBtnApi.style.color = '#fff';
      tabBtnApi.style.fontWeight = '700';
      tabBtnManual.style.borderBottomColor = 'transparent';
      tabBtnManual.style.color = '#a1a1aa';
      tabBtnManual.style.fontWeight = '600';
      if (panelManual) panelManual.style.display = 'none';
      if (panelApi) panelApi.style.display = 'block';
      checkApiStatus(apiKeyInput?.value);
    });

    testApiBtn?.addEventListener('click', async () => {
      testApiBtn.disabled = true;
      try {
        await checkApiStatus(apiKeyInput?.value);
        Toast.show('API connection test completed.', 'info');
      } finally {
        testApiBtn.disabled = false;
      }
    });

    saveApiBtn?.addEventListener('click', async () => {
      const keyVal = (apiKeyInput?.value || '').trim();
      if (!keyVal) {
        Toast.show('Please enter a valid YouTube API key.', 'warning');
        return;
      }
      saveApiBtn.disabled = true;
      try {
        const res = await YouTubeDiscoveryService.saveApiKey(keyVal);
        if (res.success) {
          Toast.show('YouTube API key connected and saved!', 'success');
          await checkApiStatus(keyVal);
        } else {
          Toast.show(res.error || 'Failed to save API key', 'error');
        }
      } catch (err) {
        Toast.show(err.message || 'Error saving API key', 'error');
      } finally {
        saveApiBtn.disabled = false;
      }
    });
  },

  show(options = {}) {
    this.init();
    const modal = document.getElementById('admin-watch-source-modal');
    if (!modal) return;

    this.currentAnimeId = options.animeId || null;
    this.onSavedCallback = options.onSave || null;

    const animeIdInput = document.getElementById('adm-anime-id');
    const seasonInput = document.getElementById('adm-season-num');
    const epInput = document.getElementById('adm-ep-num');
    const videoInput = document.getElementById('adm-video-input');
    const titleInput = document.getElementById('adm-video-title');
    const previewDiv = document.getElementById('adm-video-preview');

    if (animeIdInput && options.animeId) {
      animeIdInput.value = options.animeId;
    }
    if (seasonInput) seasonInput.value = options.season || 1;
    if (epInput) epInput.value = options.nextEpisode || 1;
    if (videoInput) videoInput.value = '';
    if (titleInput) titleInput.value = '';
    if (previewDiv) previewDiv.style.display = 'none';

    modal.style.display = 'flex';
  },

  hide() {
    const modal = document.getElementById('admin-watch-source-modal');
    if (modal) modal.style.display = 'none';
  }
};
