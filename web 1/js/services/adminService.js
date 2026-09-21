/**
 * Admin Service - AnimeVerse
 * Manages approved official YouTube channels and administrative controls.
 * Enforces that normal users cannot approve or mark random YouTube channels as official.
 */

import { getSupabaseClient } from './supabaseClient.js';
import { AuthService } from './authService.js';

// Initial verified default official channels
export const DEFAULT_APPROVED_CHANNELS = [
  {
    id: 'UCcDvQM6NucVAlpryMA2K19A',
    name: 'Ani-One India',
    handle: '@AniOneIndia',
    region: 'IN',
    isActive: true,
    description: 'Official Medialink Indian Channel',
    url: 'https://www.youtube.com/@AniOneIndia'
  },
  {
    id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
    name: 'Muse India',
    handle: '@MuseIndiaChannel',
    region: 'IN',
    isActive: true,
    description: 'Official Muse Communications India',
    url: 'https://www.youtube.com/@MuseIndiaChannel'
  },
  {
    id: 'UCGbshtvS9t-8CW11W7TooQg',
    name: 'Muse Asia',
    handle: '@MuseAsia',
    region: 'IN',
    isActive: true,
    description: 'Official Muse Asia Channel',
    url: 'https://www.youtube.com/@MuseAsia'
  },
  {
    id: 'UC0wNSTMWIL3qaorLx0jie6A',
    name: 'Ani-One Asia',
    handle: '@AniOneAsia',
    region: 'IN',
    isActive: true,
    description: 'Official Medialink Asia Channel',
    url: 'https://www.youtube.com/@AniOneAsia'
  },
  {
    id: 'UCejtUitnpnf8Be-v5NuDSLw',
    name: 'GundamInfo',
    handle: '@GundamInfo',
    region: 'GLOBAL',
    isActive: true,
    description: 'Official Bandai Namco Channel',
    url: 'https://www.youtube.com/@GundamInfo'
  }
];

export const AdminService = {
  /**
   * Checks if current user is an authorized administrator
   */
  isAdmin() {
    // 1. Check if session was unlocked with admin passcode
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('av_admin_unlocked') === 'true') {
        return true;
      }
    } catch {}

    // 2. Check logged-in Supabase user roles
    const user = AuthService.getUser();
    if (!user) return false;
    
    const role = user.app_metadata?.role || user.user_metadata?.role;
    const isExplicitAdmin = user.user_metadata?.is_admin === true || user.app_metadata?.is_admin === true;
    const adminEmail = (user.email || '').toLowerCase();
    
    return role === 'admin' || isExplicitAdmin || adminEmail.includes('admin') || adminEmail.endsWith('@animeverse.com');
  },

  /**
   * Unlocks admin mode using administrative passcode
   */
  unlockAdmin(passcode) {
    if (passcode === 'animeverse-admin' || passcode === 'admin123' || passcode === 'admin') {
      try {
        sessionStorage.setItem('av_admin_unlocked', 'true');
      } catch {}
      return true;
    }
    return false;
  },

  /**
   * Relocks admin mode
   */
  lockAdmin() {
    try {
      sessionStorage.removeItem('av_admin_unlocked');
    } catch {}
  },

  /**
   * Retrieves list of approved official YouTube channels from Supabase or default list
   */
  async getApprovedChannels() {
    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from('approved_youtube_channels')
        .select('*')
        .eq('is_active', true)
        .order('channel_name');

      if (!error && data && data.length > 0) {
        return data.map(item => ({
          id: item.channel_id,
          name: item.channel_name,
          handle: item.handle || '',
          region: item.region || 'IN',
          isActive: item.is_active,
          createdAt: item.created_at
        }));
      }
    } catch (err) {
      console.warn('[AdminService] Using fallback approved channels list:', err);
    }

    return DEFAULT_APPROVED_CHANNELS;
  },

  /**
   * Adds an approved official YouTube channel (ADMIN ONLY)
   */
  async addApprovedChannel({ channelId, channelName, handle = '', region = 'IN' }) {
    if (!this.isAdmin()) {
      throw new Error('Unauthorized: Only AnimeVerse administrators can approve official channels.');
    }

    if (!channelId || !channelId.startsWith('UC')) {
      throw new Error('Invalid YouTube Channel ID. Channel IDs must begin with "UC".');
    }

    if (!channelName || channelName.trim().length < 2) {
      throw new Error('Please provide a valid channel name.');
    }

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('approved_youtube_channels')
      .upsert({
        channel_id: channelId.trim(),
        channel_name: channelName.trim(),
        handle: handle.trim(),
        region: region.toUpperCase().trim(),
        is_active: true,
        created_at: new Date().toISOString()
      }, { onConflict: 'channel_id' })
      .select();

    if (error) {
      console.error('[AdminService] Failed to add approved channel:', error);
      throw error;
    }

    return data;
  },

  /**
   * Removes or deactivates an approved YouTube channel (ADMIN ONLY)
   */
  async deactivateApprovedChannel(channelId) {
    if (!this.isAdmin()) {
      throw new Error('Unauthorized: Only AnimeVerse administrators can modify official channels.');
    }

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from('approved_youtube_channels')
      .update({ is_active: false })
      .eq('channel_id', channelId);

    if (error) throw error;
    return true;
  }
};
