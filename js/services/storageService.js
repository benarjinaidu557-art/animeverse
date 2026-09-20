/**
 * Storage Service - Unified bridge connecting Local State and Supabase Cloud Data.
 * Automatically synchronizes with Supabase when logged in, with LocalStorage fallback.
 */

import { AuthService } from './authService.js';
import { UserDataService } from './userDataService.js';

const STORAGE_KEYS = {
  WATCHLIST: 'animeverse_user_watchlist',
  FAVORITES: 'animeverse_user_favorites',
  EPISODES: 'animeverse_user_watched_episodes',
  FOLLOWED: 'animeverse_user_followed',
};

const listeners = new Set();

function emitChange(event, payload) {
  listeners.forEach(fn => {
    try {
      fn(event, payload);
    } catch (e) {
      console.error('Storage listener error:', e);
    }
  });
}

export const StorageService = {
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  /**
   * Sync cloud data when user logs in
   */
  async syncWithCloud() {
    if (!AuthService.isAuthenticated()) return;

    try {
      const [cloudWatchlist, cloudFavorites, cloudEpisodes, cloudFollowed] = await Promise.all([
        UserDataService.getWatchlist(),
        UserDataService.getFavorites(),
        UserDataService.getAllEpisodeProgress(),
        UserDataService.getFollowedAnime(),
      ]);

      if (cloudWatchlist.length > 0) {
        localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(cloudWatchlist));
      }
      if (cloudFavorites.length > 0) {
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(cloudFavorites));
      }
      if (Object.keys(cloudEpisodes).length > 0) {
        localStorage.setItem(STORAGE_KEYS.EPISODES, JSON.stringify(cloudEpisodes));
      }
      if (cloudFollowed.length > 0) {
        localStorage.setItem(STORAGE_KEYS.FOLLOWED, JSON.stringify(cloudFollowed));
      }

      emitChange('cloud_synced', { 
        watchlist: cloudWatchlist, 
        favorites: cloudFavorites,
        followed: cloudFollowed 
      });
    } catch (err) {
      console.warn('Cloud sync error:', err);
    }
  },

  // ==========================================
  // Watchlist Management
  // ==========================================

  getWatchlist() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  isInWatchlist(animeId) {
    const list = this.getWatchlist();
    return list.some(item => String(item.id) === String(animeId));
  },

  getWatchlistStatus(animeId) {
    const list = this.getWatchlist();
    const item = list.find(item => String(item.id) === String(animeId));
    return item ? item.status : null;
  },

  async addToWatchlist(anime, status = 'watching') {
    const list = this.getWatchlist();
    const existingIndex = list.findIndex(item => String(item.id) === String(anime.id));

    const itemData = {
      id: anime.id,
      title: anime.title?.english || anime.title?.romaji || 'Untitled',
      romajiTitle: anime.title?.romaji || '',
      coverImage: anime.coverImage?.large || anime.coverImage?.medium || '',
      status: status,
      episodes: anime.episodes || 0,
      averageScore: anime.averageScore || null,
      genres: anime.genres || [],
      addedAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...itemData };
    } else {
      list.unshift(itemData);
    }

    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(list));
    emitChange('watchlist_updated', { list, item: itemData });

    // Sync to Supabase if authenticated
    if (AuthService.isAuthenticated()) {
      try {
        await UserDataService.addToWatchlist(anime, status);
      } catch (e) {
        console.warn('Supabase watchlist sync failed:', e);
      }
    }

    return itemData;
  },

  async removeFromWatchlist(animeId) {
    let list = this.getWatchlist();
    list = list.filter(item => String(item.id) !== String(animeId));
    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(list));
    emitChange('watchlist_updated', { list, removedId: animeId });

    // Sync to Supabase if authenticated
    if (AuthService.isAuthenticated()) {
      try {
        await UserDataService.removeFromWatchlist(animeId);
      } catch (e) {
        console.warn('Supabase remove watchlist failed:', e);
      }
    }
  },

  async toggleWatchlist(anime, defaultStatus = 'watching') {
    if (this.isInWatchlist(anime.id)) {
      await this.removeFromWatchlist(anime.id);
      return false;
    } else {
      await this.addToWatchlist(anime, defaultStatus);
      return true;
    }
  },

  // ==========================================
  // Favorites Management
  // ==========================================

  getFavorites() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  isFavorite(animeId) {
    const favs = this.getFavorites();
    return favs.includes(Number(animeId));
  },

  async toggleFavorite(animeId) {
    const favs = this.getFavorites();
    const id = Number(animeId);
    const index = favs.indexOf(id);
    let isFav = false;

    if (index >= 0) {
      favs.splice(index, 1);
      isFav = false;
      if (AuthService.isAuthenticated()) {
        UserDataService.removeFavorite(id).catch(console.warn);
      }
    } else {
      favs.push(id);
      isFav = true;
      if (AuthService.isAuthenticated()) {
        UserDataService.addFavorite(id).catch(console.warn);
      }
    }

    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
    emitChange('favorites_updated', { favorites: favs, id, isFav });
    return isFav;
  },

  // ==========================================
  // Episode Tracking Management
  // ==========================================

  getWatchedEpisodes(animeId) {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.EPISODES) || '{}');
      return all[String(animeId)] || [];
    } catch {
      return [];
    }
  },

  isEpisodeWatched(animeId, episodeNumber) {
    const watched = this.getWatchedEpisodes(animeId);
    return watched.includes(Number(episodeNumber));
  },

  async toggleEpisodeWatched(animeId, episodeNumber) {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.EPISODES) || '{}');
      const key = String(animeId);
      const epNum = Number(episodeNumber);
      let list = all[key] || [];

      let isNowWatched = false;
      if (list.includes(epNum)) {
        list = list.filter(n => n !== epNum);
        isNowWatched = false;
      } else {
        list.push(epNum);
        list.sort((a, b) => a - b);
        isNowWatched = true;
      }

      all[key] = list;
      localStorage.setItem(STORAGE_KEYS.EPISODES, JSON.stringify(all));
      emitChange('episodes_updated', { animeId, episodeNumber: epNum, isNowWatched, watchedList: list });

      // Sync to Supabase if authenticated
      if (AuthService.isAuthenticated()) {
        UserDataService.markEpisodeWatched(animeId, epNum, isNowWatched).catch(console.warn);
      }

      return isNowWatched;
    } catch {
      return false;
    }
  },

  // ==========================================
  // Followed Anime Management
  // ==========================================

  getFollowed() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOLLOWED);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  isFollowing(animeId) {
    const list = this.getFollowed();
    return list.some(item => String(item.id) === String(animeId));
  },

  async followAnime(anime) {
    const list = this.getFollowed();
    const id = Number(anime.id);
    const existing = list.find(item => Number(item.id) === id);

    const followItem = {
      id,
      title: anime.title?.english || anime.title?.romaji || anime.title || 'Untitled',
      coverImage: anime.coverImage?.large || anime.coverImage?.medium || anime.coverImage || '',
      followedAt: Date.now(),
    };

    if (!existing) {
      list.unshift(followItem);
      localStorage.setItem(STORAGE_KEYS.FOLLOWED, JSON.stringify(list));
      emitChange('followed_updated', { followed: list, animeId: id, isFollowing: true });
    }

    if (AuthService.isAuthenticated()) {
      UserDataService.followAnime(anime).catch(console.warn);
    }
    return true;
  },

  async unfollowAnime(animeId) {
    const id = Number(animeId);
    let list = this.getFollowed();
    list = list.filter(item => Number(item.id) !== id);
    localStorage.setItem(STORAGE_KEYS.FOLLOWED, JSON.stringify(list));
    emitChange('followed_updated', { followed: list, animeId: id, isFollowing: false });

    if (AuthService.isAuthenticated()) {
      UserDataService.unfollowAnime(id).catch(console.warn);
    }
    return false;
  },

  async toggleFollow(anime) {
    if (this.isFollowing(anime.id)) {
      return await this.unfollowAnime(anime.id);
    } else {
      return await this.followAnime(anime);
    }
  }
};

// Wire automatic cloud sync upon login
AuthService.subscribe((event) => {
  if (event === 'SIGNED_IN') {
    StorageService.syncWithCloud();
  }
});
