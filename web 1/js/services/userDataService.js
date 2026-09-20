/**
 * User Data Service - Supabase Database Operations with Row Level Security
 * Manages Watchlists, Favorites, and Episode Progress in Supabase.
 */

import { getSupabaseClient } from './supabaseClient.js';
import { AuthService } from './authService.js';

export const UserDataService = {
  // ==========================================
  // Watchlists Table Operations
  // ==========================================

  async getWatchlist() {
    const user = AuthService.getUser();
    if (!user) return [];

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching watchlist from Supabase:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.anime_id,
      title: row.title,
      romajiTitle: row.romaji_title,
      coverImage: row.cover_image,
      status: row.status,
      episodes: row.episodes,
      averageScore: row.average_score,
      genres: row.genres || [],
      createdAt: row.created_at,
    }));
  },

  async addToWatchlist(anime, status = 'watching') {
    const user = AuthService.getUser();
    if (!user) throw new Error('Sign in required to save to your cloud watchlist.');

    const supabase = await getSupabaseClient();
    const record = {
      user_id: user.id,
      anime_id: anime.id,
      title: anime.title?.english || anime.title?.romaji || 'Untitled',
      romaji_title: anime.title?.romaji || '',
      cover_image: anime.coverImage?.large || anime.coverImage?.medium || '',
      status: status,
      episodes: anime.episodes || 0,
      average_score: anime.averageScore || null,
      genres: anime.genres || [],
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('watchlists')
      .insert(record);

    if (error) throw error;
    return data;
  },

  async updateWatchlistStatus(animeId, status) {
    const user = AuthService.getUser();
    if (!user) throw new Error('Sign in required.');

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('watchlists')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('anime_id', Number(animeId));

    if (error) throw error;
    return data;
  },

  async removeFromWatchlist(animeId) {
    const user = AuthService.getUser();
    if (!user) throw new Error('Sign in required.');

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from('watchlists')
      .delete()
      .eq('user_id', user.id)
      .eq('anime_id', Number(animeId));

    if (error) throw error;
  },

  // ==========================================
  // Favorites Table Operations
  // ==========================================

  async getFavorites() {
    const user = AuthService.getUser();
    if (!user) return [];

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('favorites')
      .select('anime_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }

    return (data || []).map(f => Number(f.anime_id));
  },

  async addFavorite(animeId) {
    const user = AuthService.getUser();
    if (!user) throw new Error('Sign in required.');

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        anime_id: Number(animeId),
      });

    if (error) throw error;
  },

  async removeFavorite(animeId) {
    const user = AuthService.getUser();
    if (!user) throw new Error('Sign in required.');

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('anime_id', Number(animeId));

    if (error) throw error;
  },

  // ==========================================
  // Episode Progress Table Operations
  // ==========================================

  async getAnimeEpisodeProgress(animeId) {
    const user = AuthService.getUser();
    if (!user) return [];

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('episode_progress')
      .select('episode_number, is_watched, last_watched_at')
      .eq('user_id', user.id)
      .eq('anime_id', Number(animeId))
      .eq('is_watched', true);

    if (error) {
      console.error('Error fetching episode progress:', error);
      return [];
    }

    return (data || []).map(row => Number(row.episode_number));
  },

  async getAllEpisodeProgress() {
    const user = AuthService.getUser();
    if (!user) return {};

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('episode_progress')
      .select('anime_id, episode_number, is_watched')
      .eq('user_id', user.id)
      .eq('is_watched', true);

    if (error) return {};

    const map = {};
    (data || []).forEach(row => {
      const id = String(row.anime_id);
      if (!map[id]) map[id] = [];
      map[id].push(Number(row.episode_number));
    });
    return map;
  },

  async markEpisodeWatched(animeId, episodeNumber, isWatched = true) {
    const user = AuthService.getUser();
    if (!user) throw new Error('Sign in required.');

    const supabase = await getSupabaseClient();

    if (isWatched) {
      const { error } = await supabase
        .from('episode_progress')
        .insert({
          user_id: user.id,
          anime_id: Number(animeId),
          episode_number: Number(episodeNumber),
          is_watched: true,
          last_watched_at: new Date().toISOString(),
        });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('episode_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('anime_id', Number(animeId))
        .eq('episode_number', Number(episodeNumber));
      if (error) throw error;
    }
  },

  // ==========================================
  // Followed Anime Table Operations
  // ==========================================

  async getFollowedAnime() {
    const user = AuthService.getUser();
    if (!user) return [];

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('followed_anime')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching followed anime:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: Number(row.anime_id),
      title: row.title,
      coverImage: row.cover_image,
      createdAt: row.created_at,
    }));
  },

  async followAnime(anime) {
    const user = AuthService.getUser();
    if (!user) throw new Error('Sign in required to follow anime.');

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('followed_anime')
      .insert({
        user_id: user.id,
        anime_id: Number(anime.id),
        title: anime.title?.english || anime.title?.romaji || anime.title || 'Untitled',
        cover_image: anime.coverImage?.large || anime.coverImage?.medium || anime.coverImage || '',
      });

    if (error) throw error;
    return data;
  },

  async unfollowAnime(animeId) {
    const user = AuthService.getUser();
    if (!user) throw new Error('Sign in required.');

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from('followed_anime')
      .delete()
      .eq('user_id', user.id)
      .eq('anime_id', Number(animeId));

    if (error) throw error;
  }
};
