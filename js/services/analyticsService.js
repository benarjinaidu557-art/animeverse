/**
 * Daily Unique Visitor Analytics Service - AnimeVerse
 * 
 * Strictly tracks unique visitors per calendar day without collecting
 * any personal information (names, emails, Google accounts).
 * Uses an anonymous, randomly generated visitor ID stored in localStorage,
 * and records exactly 1 entry per visitor per calendar day in Supabase.
 */

import { getSupabaseClient } from './supabaseClient.js';

const STORAGE_KEYS = {
  VISITOR_ID: 'animeverse_anon_visitor_id',
  LAST_VISIT_DATE: 'animeverse_last_recorded_visit_date'
};

export const AnalyticsService = {
  /**
   * Retrieves or creates an anonymous UUID stored locally in the browser
   */
  getOrCreateVisitorId() {
    try {
      let visitorId = localStorage.getItem(STORAGE_KEYS.VISITOR_ID);
      if (!visitorId || typeof visitorId !== 'string' || visitorId.length < 10) {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
          visitorId = crypto.randomUUID();
        } else {
          visitorId = 'anon_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 12);
        }
        localStorage.setItem(STORAGE_KEYS.VISITOR_ID, visitorId);
      }
      return visitorId;
    } catch {
      return 'anon_fallback_' + Math.random().toString(36).substring(2, 10);
    }
  },

  /**
   * Returns calendar date string formatted as YYYY-MM-DD in local time
   */
  getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Records today's visit if not already recorded.
   * Safe to call on every page load/refresh; deduplicates via local cache
   * and the unique constraint on (visitor_id, visit_date) in Supabase.
   */
  async recordDailyVisit() {
    const today = this.getLocalDateString();
    const visitorId = this.getOrCreateVisitorId();

    try {
      // 1. Fast local deduplication check: if this browser already recorded a visit today, skip
      const lastRecorded = localStorage.getItem(STORAGE_KEYS.LAST_VISIT_DATE);
      if (lastRecorded === today) {
        return { success: true, isNewToday: false, reason: 'cached_today' };
      }

      // 2. Insert into Supabase daily_visitors table
      const supabase = await getSupabaseClient();
      const { error } = await supabase
        .from('daily_visitors')
        .insert([{
          visitor_id: visitorId,
          visit_date: today
        }]);

      if (error) {
        // If error is duplicate unique constraint (code 23505), ignore safely
        const isDuplicate = error.code === '23505' || 
          (error.message && (error.message.includes('unique') || error.message.includes('duplicate') || error.message.includes('violates')));

        if (isDuplicate) {
          localStorage.setItem(STORAGE_KEYS.LAST_VISIT_DATE, today);
          return { success: true, isNewToday: false, reason: 'duplicate_ignored' };
        }

        console.warn('[AnalyticsService] Daily visit notice:', error.message || error);
        return { success: false, error };
      }

      // Successfully recorded new daily visit
      localStorage.setItem(STORAGE_KEYS.LAST_VISIT_DATE, today);
      return { success: true, isNewToday: true };

    } catch (err) {
      console.warn('[AnalyticsService] Record visit notice:', err);
      return { success: false, error: err };
    }
  },

  /**
   * Queries Supabase daily_visitors to calculate metrics:
   * - Today's unique visitors
   * - Yesterday's unique visitors
   * - Last 7 days
   * - Last 30 days
   * - Total unique visitor-days
   * - 7-day daily breakdown array for visual analytics
   */
  async getVisitorAnalytics() {
    const now = new Date();
    const today = this.getLocalDateString(now);
    const yesterday = this.getLocalDateString(new Date(now.getTime() - 86400000));
    const sevenDaysAgo = this.getLocalDateString(new Date(now.getTime() - 6 * 86400000));
    const thirtyDaysAgo = this.getLocalDateString(new Date(now.getTime() - 29 * 86400000));

    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from('daily_visitors')
        .select('visitor_id, visit_date, created_at')
        .order('visit_date', { ascending: false });

      if (error) {
        console.warn('[AnalyticsService] Analytics query notice:', error);
      }

      const records = Array.isArray(data) ? data : [];

      // Calculate requested metrics
      const todayCount = records.filter(r => r.visit_date === today).length;
      const yesterdayCount = records.filter(r => r.visit_date === yesterday).length;
      const last7DaysCount = records.filter(r => r.visit_date >= sevenDaysAgo && r.visit_date <= today).length;
      const last30DaysCount = records.filter(r => r.visit_date >= thirtyDaysAgo && r.visit_date <= today).length;
      const totalCount = records.length;

      // Generate 7-day daily breakdown array
      const dailyBreakdown = [];
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(now.getTime() - i * 86400000);
        const dateStr = this.getLocalDateString(targetDate);
        const dayLabel = targetDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        const count = records.filter(r => r.visit_date === dateStr).length;

        dailyBreakdown.push({
          date: dateStr,
          label: dayLabel,
          isToday: dateStr === today,
          count
        });
      }

      return {
        today: todayCount,
        yesterday: yesterdayCount,
        last7Days: last7DaysCount,
        last30Days: last30DaysCount,
        total: totalCount,
        totalUniqueVisitorDays: totalCount,
        dailyBreakdown,
        dailyBreakdown7d: dailyBreakdown,
        todayDateStr: today
      };

    } catch (err) {
      console.warn('[AnalyticsService] Compute analytics notice:', err);
      return {
        today: 0,
        yesterday: 0,
        last7Days: 0,
        last30Days: 0,
        total: 0,
        totalUniqueVisitorDays: 0,
        dailyBreakdown: [],
        dailyBreakdown7d: [],
        todayDateStr: today
      };
    }
  }
};
