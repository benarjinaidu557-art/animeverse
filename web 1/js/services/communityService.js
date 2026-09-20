/**
 * Community Service - AnimeVerse
 * Manages Community Ratings, In-Depth Reviews, Discussion Comments,
 * Helpful Likes, Content Moderation Reporting, and In-App Notifications.
 */

import { getSupabaseClient } from './supabaseClient.js';
import { AuthService } from './authService.js';

export const CommunityService = {
  // ==========================================
  // Helper: Fetch profiles lookup
  // ==========================================
  async _getProfilesMap(userIds) {
    if (!userIds || userIds.length === 0) return {};
    try {
      const supabase = await getSupabaseClient();
      const { data } = await supabase.from('profiles').select('id, username, avatar_url');
      const map = {};
      (data || []).forEach(p => {
        map[p.id] = {
          username: p.username || 'Anime Fan',
          avatarUrl: p.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${p.id}`,
        };
      });
      return map;
    } catch {
      return {};
    }
  },

  // ==========================================
  // Ratings Operations (1-10)
  // ==========================================

  async getAnimeRatings(animeId) {
    const supabase = await getSupabaseClient();
    const currentUser = AuthService.getUser();
    const idStr = String(animeId);

    const { data: allRatings, error } = await supabase
      .from('anime_ratings')
      .select('*')
      .eq('anime_id', idStr);

    if (error) {
      console.warn('Error fetching anime ratings:', error);
      return { averageRating: 0, count: 0, userRating: null, distribution: {} };
    }

    const ratings = allRatings || [];
    const count = ratings.length;
    let sum = 0;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
    let userRating = null;

    ratings.forEach(r => {
      const score = Number(r.rating);
      sum += score;
      if (distribution[score] !== undefined) distribution[score]++;
      if (currentUser && r.user_id === currentUser.id) {
        userRating = score;
      }
    });

    const averageRating = count > 0 ? parseFloat((sum / count).toFixed(1)) : 0;

    return {
      averageRating,
      count,
      userRating,
      distribution,
    };
  },

  async setAnimeRating(animeId, rating, animeMetadata = {}) {
    const user = AuthService.getUser();
    if (!user) throw new Error('You must be signed in to rate anime.');

    const score = parseInt(rating, 10);
    if (isNaN(score) || score < 1 || score > 10) {
      throw new Error('Rating must be an integer between 1 and 10.');
    }

    const supabase = await getSupabaseClient();
    const record = {
      user_id: user.id,
      anime_id: String(animeId),
      rating: score,
      anime_title: animeMetadata.title || '',
      anime_cover: animeMetadata.coverImage || '',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('anime_ratings')
      .insert(record);

    if (error) throw error;
    return { success: true, rating: score };
  },

  async deleteAnimeRating(animeId) {
    const user = AuthService.getUser();
    if (!user) throw new Error('Sign in required.');

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from('anime_ratings')
      .delete()
      .eq('user_id', user.id)
      .eq('anime_id', String(animeId));

    if (error) throw error;
    return { success: true };
  },

  async getUserRatings(userId) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('anime_ratings')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Error fetching user ratings:', error);
      return [];
    }
    return data || [];
  },

  // ==========================================
  // Reviews Operations
  // ==========================================

  async getAnimeReviews(animeId) {
    const supabase = await getSupabaseClient();
    const currentUser = AuthService.getUser();
    const idStr = String(animeId);

    const { data: reviews, error } = await supabase
      .from('anime_reviews')
      .select('*')
      .eq('anime_id', idStr)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching reviews:', error);
      return [];
    }

    if (!reviews || reviews.length === 0) return [];

    // Fetch likes and profiles for all authors
    const userIds = [...new Set(reviews.map(r => r.user_id))];
    const profilesMap = await this._getProfilesMap(userIds);

    const { data: allLikes } = await supabase.from('review_likes').select('*');
    const likesList = allLikes || [];

    return reviews.map(r => {
      const reviewLikes = likesList.filter(l => String(l.review_id) === String(r.id));
      const isLikedByMe = currentUser ? reviewLikes.some(l => l.user_id === currentUser.id) : false;
      const author = profilesMap[r.user_id] || {
        username: r.username || 'Anime Fan',
        avatarUrl: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${r.user_id}`,
      };

      return {
        id: r.id,
        animeId: r.anime_id,
        userId: r.user_id,
        rating: r.rating,
        summary: r.summary,
        content: r.content,
        containsSpoilers: Boolean(r.contains_spoilers),
        animeTitle: r.anime_title,
        animeCover: r.anime_cover,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        author,
        likesCount: reviewLikes.length,
        isLikedByMe,
        isMyReview: currentUser ? currentUser.id === r.user_id : false,
      };
    });
  },

  async createReview({ animeId, rating, summary, content, containsSpoilers = false, animeTitle = '', animeCover = '' }) {
    const user = AuthService.getUser();
    if (!user) throw new Error('You must be signed in to write a review.');

    if (!content || content.trim().length < 10) {
      throw new Error('Review content must be at least 10 characters.');
    }

    const supabase = await getSupabaseClient();
    const profile = await AuthService.getProfile();
    const record = {
      user_id: user.id,
      anime_id: String(animeId),
      rating: rating ? parseInt(rating, 10) : null,
      summary: summary ? summary.trim() : '',
      content: content.trim(),
      contains_spoilers: Boolean(containsSpoilers),
      anime_title: animeTitle,
      anime_cover: animeCover,
      username: profile?.username || user.email?.split('@')[0] || 'Fan',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('anime_reviews')
      .insert(record);

    if (error) throw error;
    return Array.isArray(data) ? data[0] : record;
  },

  async updateReview(reviewId, { rating, summary, content, containsSpoilers }) {
    const user = AuthService.getUser();
    if (!user) throw new Error('Sign in required.');

    const supabase = await getSupabaseClient();
    const updates = {
      updated_at: new Date().toISOString(),
    };
    if (rating !== undefined) updates.rating = parseInt(rating, 10);
    if (summary !== undefined) updates.summary = summary.trim();
    if (content !== undefined) updates.content = content.trim();
    if (containsSpoilers !== undefined) updates.contains_spoilers = Boolean(containsSpoilers);

    const { data, error } = await supabase
      .from('anime_reviews')
      .update(updates)
      .eq('id', reviewId)
      .eq('user_id', user.id);

    if (error) throw error;
    return data;
  },

  async deleteReview(reviewId) {
    const user = AuthService.getUser();
    if (!user) throw new Error('Sign in required.');

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from('anime_reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true };
  },

  async toggleReviewLike(reviewId, authorUserId = null, animeTitle = '') {
    const user = AuthService.getUser();
    if (!user) throw new Error('You must be signed in to mark a review as helpful.');

    const supabase = await getSupabaseClient();
    const { data: existingLikes } = await supabase
      .from('review_likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('review_id', reviewId);

    const isAlreadyLiked = (existingLikes || []).length > 0;

    if (isAlreadyLiked) {
      await supabase
        .from('review_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('review_id', reviewId);

      const { data: countData } = await supabase.from('review_likes').select('*').eq('review_id', reviewId);
      return { liked: false, likesCount: (countData || []).length };
    } else {
      await supabase
        .from('review_likes')
        .insert({
          user_id: user.id,
          review_id: reviewId,
        });

      // Notify author if not self
      if (authorUserId && authorUserId !== user.id) {
        const profile = await AuthService.getProfile();
        await this.createNotification({
          userId: authorUserId,
          type: 'review_like',
          title: 'Review Liked',
          message: `${profile?.username || 'An otaku'} found your review of ${animeTitle || 'an anime'} helpful!`,
          link: `#/anime/${animeTitle ? '' : ''}`,
        }).catch(() => {});
      }

      const { data: countData } = await supabase.from('review_likes').select('*').eq('review_id', reviewId);
      return { liked: true, likesCount: (countData || []).length };
    }
  },

  async getUserReviews(userId) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('anime_reviews')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching user reviews:', error);
      return [];
    }
    return data || [];
  },

  // ==========================================
  // Comments / Discussion Operations
  // ==========================================

  async getAnimeComments(animeId) {
    const supabase = await getSupabaseClient();
    const currentUser = AuthService.getUser();
    const idStr = String(animeId);

    const { data: comments, error } = await supabase
      .from('anime_comments')
      .select('*')
      .eq('anime_id', idStr)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching comments:', error);
      return [];
    }

    if (!comments || comments.length === 0) return [];

    const userIds = [...new Set(comments.map(c => c.user_id))];
    const profilesMap = await this._getProfilesMap(userIds);

    const { data: allLikes } = await supabase.from('comment_likes').select('*');
    const likesList = allLikes || [];

    return comments.map(c => {
      const commentLikes = likesList.filter(l => String(l.comment_id) === String(c.id));
      const isLikedByMe = currentUser ? commentLikes.some(l => l.user_id === currentUser.id) : false;
      const author = profilesMap[c.user_id] || {
        username: c.username || 'Anime Fan',
        avatarUrl: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${c.user_id}`,
      };

      return {
        id: c.id,
        animeId: c.anime_id,
        parentId: c.parent_id || null,
        userId: c.user_id,
        content: c.content,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        author,
        likesCount: commentLikes.length,
        isLikedByMe,
        isMyComment: currentUser ? currentUser.id === c.user_id : false,
      };
    });
  },

  async postComment({ animeId, content, parentId = null }) {
    const user = AuthService.getUser();
    if (!user) throw new Error('You must be signed in to join the discussion.');

    if (!content || !content.trim()) {
      throw new Error('Comment cannot be empty.');
    }

    const supabase = await getSupabaseClient();
    const profile = await AuthService.getProfile();
    const record = {
      user_id: user.id,
      anime_id: String(animeId),
      parent_id: parentId ? String(parentId) : null,
      content: content.trim(),
      username: profile?.username || user.email?.split('@')[0] || 'Fan',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('anime_comments')
      .insert(record);

    if (error) throw error;
    return Array.isArray(data) ? data[0] : record;
  },

  async updateComment(commentId, content) {
    const user = AuthService.getUser();
    if (!user) throw new Error('Sign in required.');

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('anime_comments')
      .update({ content: content.trim(), updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) throw error;
    return data;
  },

  async deleteComment(commentId) {
    const user = AuthService.getUser();
    if (!user) throw new Error('Sign in required.');

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from('anime_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true };
  },

  async toggleCommentLike(commentId) {
    const user = AuthService.getUser();
    if (!user) throw new Error('Sign in required to like comments.');

    const supabase = await getSupabaseClient();
    const { data: existingLikes } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('comment_id', commentId);

    const isAlreadyLiked = (existingLikes || []).length > 0;

    if (isAlreadyLiked) {
      await supabase
        .from('comment_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('comment_id', commentId);

      const { data: countData } = await supabase.from('comment_likes').select('*').eq('comment_id', commentId);
      return { liked: false, likesCount: (countData || []).length };
    } else {
      await supabase
        .from('comment_likes')
        .insert({
          user_id: user.id,
          comment_id: commentId,
        });

      const { data: countData } = await supabase.from('comment_likes').select('*').eq('comment_id', commentId);
      return { liked: true, likesCount: (countData || []).length };
    }
  },

  // ==========================================
  // Moderation Reporting
  // ==========================================

  async submitReport({ targetType, targetId, reason, details = '' }) {
    const user = AuthService.getUser();
    if (!user) throw new Error('You must be signed in to report content.');

    const validReasons = ['spam', 'harassment', 'copyright', 'inappropriate', 'spoiler', 'other'];
    if (!validReasons.includes(reason)) {
      throw new Error('Please select a valid report reason.');
    }

    const supabase = await getSupabaseClient();
    const record = {
      reporter_id: user.id,
      target_type: targetType, // 'review' | 'comment' | 'user'
      target_id: String(targetId),
      reason,
      details: details.trim(),
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('moderation_reports')
      .insert(record);

    if (error) throw error;
    return { success: true, message: 'Report submitted. Our moderation team will review this shortly.' };
  },

  // ==========================================
  // Notifications Operations
  // ==========================================

  async getNotifications() {
    const user = AuthService.getUser();
    if (!user) return [];

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching notifications:', error);
      return [];
    }

    return (data || []).map(n => ({
      id: n.id,
      type: n.type || 'system',
      title: n.title,
      message: n.message,
      link: n.link || '#',
      isRead: Boolean(n.is_read),
      createdAt: n.created_at,
    }));
  },

  async getUnreadCount() {
    const notifications = await this.getNotifications();
    return notifications.filter(n => !n.isRead).length;
  },

  async markAsRead(notificationId) {
    const user = AuthService.getUser();
    if (!user) return;

    const supabase = await getSupabaseClient();
    await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', user.id);
  },

  async markAllAsRead() {
    const user = AuthService.getUser();
    if (!user) return;

    const supabase = await getSupabaseClient();
    await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
  },

  async createNotification({ userId, type, title, message, link = '' }) {
    if (!userId) return;
    const supabase = await getSupabaseClient();
    const record = {
      user_id: userId,
      type: type || 'system',
      title,
      message,
      link,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    return await supabase.from('notifications').insert(record);
  }
};
