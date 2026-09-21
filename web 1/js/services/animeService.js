/**
 * High-Level Anime Domain Service
 * Encapsulates all data operations and provides clean, normalized models to UI components.
 * Completely decouples UI components from AniList GraphQL implementation.
 */

import { fetchAniListGraphQL, QUERIES } from './anilistApi.js';
import { getSupabaseClient } from './supabaseClient.js';

export const AnimeService = {
  /**
   * Fetch Trending Anime
   */
  async getTrending(page = 1, perPage = 12) {
    const data = await fetchAniListGraphQL(QUERIES.GET_TRENDING, { page, perPage });
    return {
      media: data?.Page?.media || [],
      pageInfo: data?.Page?.pageInfo || {},
    };
  },

  /**
   * Fetch All-Time / Seasonal Popular Anime
   */
  async getPopular(page = 1, perPage = 12) {
    const data = await fetchAniListGraphQL(QUERIES.GET_POPULAR, { page, perPage });
    return {
      media: data?.Page?.media || [],
      pageInfo: data?.Page?.pageInfo || {},
    };
  },

  /**
   * Fetch Recently Updated / Currently Airing Anime
   */
  async getRecentlyUpdated(page = 1, perPage = 12) {
    const data = await fetchAniListGraphQL(QUERIES.GET_RECENTLY_UPDATED, { page, perPage });
    return {
      media: data?.Page?.media || [],
      pageInfo: data?.Page?.pageInfo || {},
    };
  },

  /**
   * Fetch New Releases (Current Season)
   */
  async getNewReleases(page = 1, perPage = 12) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11
    let season = 'WINTER';
    if (month >= 2 && month <= 4) season = 'SPRING';
    else if (month >= 5 && month <= 7) season = 'SUMMER';
    else if (month >= 8 && month <= 10) season = 'FALL';

    const data = await fetchAniListGraphQL(QUERIES.GET_NEW_RELEASES, {
      seasonYear: year,
      season,
      page,
      perPage,
    });
    return {
      media: data?.Page?.media || [],
      pageInfo: data?.Page?.pageInfo || {},
    };
  },

  /**
   * Fetch Upcoming Anticipated Anime
   */
  async getUpcoming(page = 1, perPage = 12) {
    const data = await fetchAniListGraphQL(QUERIES.GET_UPCOMING, { page, perPage });
    return {
      media: data?.Page?.media || [],
      pageInfo: data?.Page?.pageInfo || {},
    };
  },

  /**
   * Fetch Top Rated Anime
   */
  async getTopRated(page = 1, perPage = 12) {
    const data = await fetchAniListGraphQL(QUERIES.GET_TOP_RATED, { page, perPage });
    return {
      media: data?.Page?.media || [],
      pageInfo: data?.Page?.pageInfo || {},
    };
  },

  /**
   * Fetch Random Surprise Anime
   * Randomly chooses a page from the top 100 popular anime and picks a random item
   */
  async getRandomAnime() {
    const randomPage = Math.floor(Math.random() * 5) + 1; // page 1-5
    const data = await fetchAniListGraphQL(QUERIES.GET_POPULAR, { page: randomPage, perPage: 20 });
    const items = data?.Page?.media || [];
    if (items.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * items.length);
    return items[randomIndex];
  },

  /**
   * Fetch Detailed Information for a Single Anime
   * Supports numeric IDs (e.g. 16498), ID-slug combos (16498-attack-on-titan), or title slugs
   */
  async getAnimeDetails(idOrSlug) {
    if (!idOrSlug) return null;

    let variables = {};
    const str = String(idOrSlug).trim();

    // Check if starts with digits, e.g. "16498", "16498-attack-on-titan", "16498/attack-on-titan"
    const leadingNumberMatch = str.match(/^(\d+)/);
    if (leadingNumberMatch) {
      const numericId = parseInt(leadingNumberMatch[1], 10);
      if (!isNaN(numericId) && numericId > 0) {
        variables = { id: numericId };
      }
    }

    // If not numeric, treat as title / slug
    if (!variables.id) {
      const cleanSearch = str.replace(/[-_]+/g, ' ').trim();
      if (cleanSearch) {
        variables = { search: cleanSearch };
      } else {
        return null;
      }
    }

    const data = await fetchAniListGraphQL(QUERIES.GET_ANIME_DETAILS, variables);
    return data?.Media || null;
  },

  /**
   * Search and Filter Anime across the complete AniList catalog
   * Supports all formats (TV, MOVIE, OVA, ONA, SPECIAL, MUSIC),
   * statuses (RELEASING, FINISHED, NOT_YET_RELEASED, etc.),
   * eras (classics, 2000s, 2010s, modern), and watch-source availability.
   */
  async searchAndFilter({
    search = '',
    genre = '',
    seasonYear = null,
    season = null,
    status = null,
    format = null,
    era = null,
    countryOfOrigin = null,
    watchableOnly = false,
    sort = 'POPULARITY_DESC',
    page = 1,
    perPage = 50,
  } = {}) {
    // If filtering strictly by watchable anime, query Supabase watch_sources first
    if (watchableOnly) {
      return this.getWatchableAnime({ page, perPage });
    }

    const variables = {
      page: Number(page),
      perPage: Number(perPage),
      sort: Array.isArray(sort) ? sort : [sort],
    };

    if (search && search.trim().length > 0) {
      variables.search = search.trim();
    }
    if (genre && genre.trim().length > 0) {
      variables.genre = genre.trim();
    }
    if (seasonYear) {
      variables.seasonYear = Number(seasonYear);
    }
    if (season && season !== 'ALL') {
      variables.season = season;
    }
    if (status && status !== 'ALL') {
      variables.status = status;
    }
    if (format && format !== 'ALL') {
      variables.format = format;
    }
    if (countryOfOrigin && countryOfOrigin !== 'ALL') {
      variables.countryOfOrigin = countryOfOrigin.toUpperCase().trim();
    }

    // Era filtering
    if (era) {
      if (era === 'CLASSIC' || era === 'pre-2000') {
        variables.startDate_lesser = 20000000;
      } else if (era === '2000s') {
        variables.startDate_greater = 20000000;
        variables.startDate_lesser = 20100000;
      } else if (era === '2010s') {
        variables.startDate_greater = 20100000;
        variables.startDate_lesser = 20200000;
      } else if (era === 'MODERN' || era === '2020s') {
        variables.startDate_greater = 20200000;
      }
    }

    const data = await fetchAniListGraphQL(QUERIES.SEARCH_AND_FILTER, variables);
    return {
      media: data?.Page?.media || [],
      pageInfo: data?.Page?.pageInfo || { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false },
    };
  },

  /**
   * Formats Country code to readable label
   */
  formatCountry(code) {
    if (!code) return 'Japan';
    const c = String(code).toUpperCase().trim();
    const map = {
      'JP': 'Japan',
      'KR': 'South Korea',
      'CN': 'China',
      'TW': 'Taiwan',
      'US': 'United States'
    };
    return map[c] || c;
  },

  /**
   * Fetch multiple anime by AniList IDs
   */
  async getAnimeByIds(ids = [], page = 1, perPage = 50) {
    if (!ids || ids.length === 0) {
      return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
    }
    const cleanIds = ids.map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
    const data = await fetchAniListGraphQL(QUERIES.GET_BY_IDS, { ids: cleanIds, page, perPage });
    return {
      media: data?.Page?.media || [],
      pageInfo: data?.Page?.pageInfo || {},
    };
  },

  /**
   * Fetch Anime Movies (Phase 16)
   */
  async getMovies(page = 1, perPage = 12) {
    return this.searchAndFilter({
      format: 'MOVIE',
      sort: 'POPULARITY_DESC',
      page,
      perPage
    });
  },

  /**
   * Fetch Classic Anime (Pre-2000s) (Phase 16)
   */
  async getClassicAnime(page = 1, perPage = 12) {
    return this.searchAndFilter({
      era: 'CLASSIC',
      sort: 'POPULARITY_DESC',
      page,
      perPage
    });
  },

  /**
   * Retrieves verified watch sources from Supabase, backend admin store, or verified catalog
   */
  async getVerifiedSources() {
    try {
      const supabase = await getSupabaseClient();
      const { data: sources, error } = await supabase
        .from('watch_sources')
        .select('anime_id, language, verification_status')
        .eq('is_official', true)
        .eq('is_embeddable', true);

      if (!error && sources && sources.length > 0) {
        const verified = sources.filter(s => s.verification_status !== 'rejected' && s.verification_status !== 'unavailable');
        if (verified.length > 0) return verified;
      }
    } catch {}

    try {
      const res = await fetch('/api/admin/watch-sources?status=verified');
      if (res.ok) {
        const d = await res.json();
        if (d.sources && d.sources.length > 0) return d.sources;
      }
    } catch {}

    // Resilient fallback default catalog (Muse India, Muse Asia, Ani-One)
    return [
      // ── Previously verified ──────────────────────────────────────────
      { anime_id: 21507,  language: 'Telugu / Hindi Dub', verification_status: 'verified' },
      { anime_id: 101338, language: 'Telugu',             verification_status: 'verified' },
      { anime_id: 98659,  language: 'Telugu',             verification_status: 'verified' },
      { anime_id: 145545, language: 'Telugu',             verification_status: 'verified' },
      { anime_id: 146066, language: 'Telugu',             verification_status: 'verified' },
      { anime_id: 116006, language: 'Hindi Dub / en-Sub', verification_status: 'verified' },
      { anime_id: 142838, language: 'ja-JP / en-Sub',     verification_status: 'verified' },
      { anime_id: 127230, language: 'ja-JP / en-Sub',     verification_status: 'verified' },
      { anime_id: 154587, language: 'ja-JP / en-Sub',     verification_status: 'verified' },
      { anime_id: 139274, language: 'ja-JP / en-Sub',     verification_status: 'verified' },
      // ── Batch 1 – Muse India Hindi Dub ──────────────────────────────
      { anime_id: 170577, language: 'Hindi Dub', verification_status: 'verified' }, // Campfire Cooking S2
      { anime_id: 21450,  language: 'Hindi Dub', verification_status: 'verified' }, // JoJo Diamond is Unbreakable
      { anime_id: 20474,  language: 'Hindi Dub', verification_status: 'verified' }, // JoJo Stardust Crusaders
      { anime_id: 108465, language: 'Hindi Dub', verification_status: 'verified' }, // Mushoku Tensei S1
      { anime_id: 116338, language: 'Hindi Dub', verification_status: 'verified' }, // Iruma-kun S2
      { anime_id: 140960, language: 'Hindi Dub', verification_status: 'verified' }, // SPY×FAMILY S1
      { anime_id: 177937, language: 'Hindi Dub', verification_status: 'verified' }, // SPY×FAMILY S3
      { anime_id: 99749,  language: 'Hindi Dub / en-Sub', verification_status: 'verified' }, // Fairy Tail Final
      { anime_id: 170695, language: 'Hindi Dub', verification_status: 'verified' }, // I Parry Everything
      // ── Batch 1 – Ani-One India ──────────────────────────────────────
      { anime_id: 196012, language: 'en-Sub',   verification_status: 'verified' }, // MAO
      { anime_id: 202269, language: 'en-Sub',   verification_status: 'verified' }, // Love Unseen
      { anime_id: 210234, language: 'en-Sub',   verification_status: 'verified' }, // Monster Eater
      { anime_id: 185211, language: 'en-Sub',   verification_status: 'verified' }, // Yowayowa Sensei
      { anime_id: 113415, language: 'en-Sub / Hindi Dub', verification_status: 'verified' }, // JJK
      { anime_id: 179950, language: 'en-Sub',   verification_status: 'verified' }, // Petals of Reincarnation
      { anime_id: 179813, language: 'en-Sub',   verification_status: 'verified' }, // Rooster Fighter
      { anime_id: 184951, language: 'en-Sub',   verification_status: 'verified' }, // You and I Are Polar Opposites
      { anime_id: 198561, language: 'en-Sub',   verification_status: 'verified' }, // I Saved Myself with a Potion
      { anime_id: 918,    language: 'en-Sub',   verification_status: 'verified' }, // Gintama
      { anime_id: 20832,  language: 'Hindi Dub', verification_status: 'verified' }, // Overlord
      { anime_id: 137822, language: 'Hindi Dub', verification_status: 'verified' }, // Blue Lock
      // ── Batch 1 – Muse Asia ──────────────────────────────────────────
      { anime_id: 110277, language: 'en-Sub', verification_status: 'verified' }, // AoT Final Season
      { anime_id: 20958,  language: 'en-Sub', verification_status: 'verified' }, // AoT S2
      // ── Batch 2 – Muse India ─────────────────────────────────────────
      { anime_id: 6702,   language: 'Hindi Dub / en-Sub', verification_status: 'verified' }, // Fairy Tail
      { anime_id: 153629, language: 'en-Sub', verification_status: 'verified' }, // Magical Revolution Princess
      // ── Batch 2 – Muse Asia ──────────────────────────────────────────
      { anime_id: 21087,  language: 'en-Sub / Hindi Dub', verification_status: 'verified' }, // One-Punch Man S1
      { anime_id: 97668,  language: 'en-Sub', verification_status: 'verified' }, // One-Punch Man S2
      { anime_id: 105164, language: 'en-Sub', verification_status: 'verified' }, // Cautious Hero
      { anime_id: 130586, language: 'en-Sub', verification_status: 'verified' }, // Greatest Demon Lord
      { anime_id: 97986,  language: 'en-Sub', verification_status: 'verified' }, // Made in Abyss
      { anime_id: 174288, language: 'en-Sub', verification_status: 'verified' }, // Easygoing Territory Defense
      { anime_id: 19383,  language: 'en-Sub', verification_status: 'verified' }, // Yamishibai
      { anime_id: 129190, language: 'en-Sub', verification_status: 'verified' }, // Genius Prince
      { anime_id: 128828, language: 'en-Sub', verification_status: 'verified' }, // Girls Frontline
      { anime_id: 154136, language: 'en-Sub', verification_status: 'verified' }, // Sasaki and Peeps
      { anime_id: 175383, language: 'en-Sub', verification_status: 'verified' }, // Loner Life
      { anime_id: 175235, language: 'en-Sub', verification_status: 'verified' }, // Let This Grieving Soul
      { anime_id: 167087, language: 'en-Sub', verification_status: 'verified' }, // Haigakura
      { anime_id: 179788, language: 'en-Sub', verification_status: 'verified' }, // I Left A-Rank Party
      { anime_id: 171244, language: 'en-Sub', verification_status: 'verified' }, // From Bureaucrat to Villainess
      { anime_id: 147774, language: 'en-Sub', verification_status: 'verified' }, // Nights with a Cat
      { anime_id: 184512, language: 'en-Sub', verification_status: 'verified' }, // Candy Caries
      // ── Batch 2 – Ani-One Asia ───────────────────────────────────────
      { anime_id: 134252, language: 'en-Sub', verification_status: 'verified' }, // Life With Ordinary Guy
      { anime_id: 161309, language: 'en-Sub', verification_status: 'verified' }, // DOG SIGNAL
      { anime_id: 145070, language: 'en-Sub', verification_status: 'verified' }, // YUREI DECO
      // ── Batch 2 – Ani-One India ──────────────────────────────────────
      { anime_id: 179470, language: 'en-Sub', verification_status: 'verified' }, // Fermat Kitchen
      { anime_id: 170366, language: 'Hindi Dub / ja-JP', verification_status: 'verified' }, // Tamon B-Side
      // ── Batch 2 – Studio Channels ────────────────────────────────────
      { anime_id: 1981,   language: 'en-Dub / en-Sub', verification_status: 'verified' }, // Sherlock Hound
      { anime_id: 440,    language: 'en-Sub',           verification_status: 'verified' }, // Revolutionary Girl Utena
      { anime_id: 149596, language: 'en-Sub',           verification_status: 'verified' }, // Uma Musume Road to the Top
      { anime_id: 184512, language: 'en-Sub',           verification_status: 'verified' }, // Candy Caries (dupe prevention handled at query)
      { anime_id: 1564,   language: 'en-Dub / Hindi Dub', verification_status: 'verified' }, // Pokemon Diamond Pearl
    ];
  },

  /**
   * Fetch Anime with Verified Watch Sources
   * Cross-references verified watch sources with AniList catalog
   */
  async getWatchableAnime({ language = null, page = 1, perPage = 12 } = {}) {
    try {
      const sources = await this.getVerifiedSources();
      let filtered = sources;
      if (language) {
        const langLower = language.toLowerCase();
        filtered = sources.filter(s => (s.language || '').toLowerCase().includes(langLower));
      }

      const uniqueIds = [...new Set(filtered.map(s => Number(s.anime_id)).filter(Boolean))];
      if (uniqueIds.length === 0) {
        return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
      }

      const start = (page - 1) * perPage;
      const pagedIds = uniqueIds.slice(start, start + perPage);

      const aniListData = await this.getAnimeByIds(pagedIds, 1, perPage);
      return {
        media: aniListData.media,
        pageInfo: {
          total: uniqueIds.length,
          currentPage: page,
          lastPage: Math.ceil(uniqueIds.length / perPage) || 1,
          hasNextPage: start + perPage < uniqueIds.length
        }
      };
    } catch (err) {
      console.warn('[AnimeService] getWatchableAnime error:', err);
      return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
    }
  },

  /**
   * Fetch all Available Genres
   */
  async getGenres() {
    try {
      const data = await fetchAniListGraphQL(QUERIES.GET_GENRES);
      return data?.GenreCollection || [
        'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
        'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological',
        'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
      ];
    } catch {
      return [
        'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
        'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological',
        'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
      ];
    }
  },

  /**
   * Fetch Airing Schedule Range (e.g. Yesterday, Today, Tomorrow, This Week, Next Week)
   */
  async getAiringScheduleRange(startTimestamp, endTimestamp, page = 1, perPage = 50) {
    const data = await fetchAniListGraphQL(QUERIES.GET_AIRING_SCHEDULE, {
      airingAt_greater: startTimestamp,
      airingAt_lesser: endTimestamp,
      page,
      perPage,
    });
    return data?.Page?.airingSchedules || [];
  },

  /**
   * Advanced Discovery query with format, minimum rating, popularity
   */
  async discoverAnime({
    genre = '',
    seasonYear = null,
    season = null,
    status = null,
    format = null,
    minRating = null,
    minPopularity = null,
    sort = 'POPULARITY_DESC',
    page = 1,
    perPage = 20,
  } = {}) {
    const variables = {
      page: Number(page),
      perPage: Number(perPage),
      sort: [sort],
    };

    if (genre && genre !== 'ALL') variables.genre = genre;
    if (seasonYear) variables.seasonYear = Number(seasonYear);
    if (season && season !== 'ALL') variables.season = season;
    if (status && status !== 'ALL') variables.status = status;
    if (format && format !== 'ALL') variables.format = format;
    if (minRating) variables.averageScore_greater = Number(minRating);
    if (minPopularity) variables.popularity_greater = Number(minPopularity);

    const data = await fetchAniListGraphQL(QUERIES.ADVANCED_DISCOVERY, variables);
    return {
      media: data?.Page?.media || [],
      pageInfo: data?.Page?.pageInfo || { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false },
    };
  },

  /**
   * Smart Recommendations Engine
   * Derives matching recommendations from user favorite genres or watchlist
   */
  async getRecommendations({ favoriteGenres = [], excludeIds = [] } = {}) {
    try {
      let targetGenre = favoriteGenres.length > 0
        ? favoriteGenres[Math.floor(Math.random() * favoriteGenres.length)]
        : 'Action';

      const data = await fetchAniListGraphQL(QUERIES.ADVANCED_DISCOVERY, {
        genre: targetGenre,
        averageScore_greater: 75,
        sort: ['SCORE_DESC', 'POPULARITY_DESC'],
        perPage: 16,
      });

      const media = (data?.Page?.media || []).filter(m => !excludeIds.includes(Number(m.id)));
      return {
        matchedGenre: targetGenre,
        media: media.slice(0, 10),
      };
    } catch {
      const popular = await this.getPopular(1, 10);
      return {
        matchedGenre: 'Popular Hits',
        media: popular.media,
      };
    }
  },

  /**
   * AI Anime Finder - Natural Language Query Processor
   * Parses user free-text (e.g. "overpowered MC in fantasy world with dark action")
   * Extracts matching genres, minimum scores, keywords, and generates reasons.
   */
  async aiAnimeFinder(promptText) {
    const text = (promptText || '').toLowerCase();
    const extractedGenres = [];
    let searchKeyword = '';
    let minScore = 70;
    let format = null;

    // Detect Genres
    const genreMap = {
      'action': 'Action', 'adventure': 'Adventure', 'comedy': 'Comedy',
      'drama': 'Drama', 'fantasy': 'Fantasy', 'horror': 'Horror',
      'mecha': 'Mecha', 'music': 'Music', 'mystery': 'Mystery',
      'psychological': 'Psychological', 'romance': 'Romance', 'sci-fi': 'Sci-Fi',
      'scifi': 'Sci-Fi', 'slice of life': 'Slice of Life', 'sports': 'Sports',
      'supernatural': 'Supernatural', 'thriller': 'Thriller'
    };

    Object.keys(genreMap).forEach(key => {
      if (text.includes(key)) {
        extractedGenres.push(genreMap[key]);
      }
    });

    // Detect format
    if (text.includes('movie') || text.includes('film')) format = 'MOVIE';

    // Detect high score intent
    if (text.includes('masterpiece') || text.includes('top rated') || text.includes('best')) {
      minScore = 80;
    }

    // Key thematic concepts
    const detectedThemes = [];
    if (text.includes('overpowered') || text.includes('op mc') || text.includes('strongest')) {
      detectedThemes.push('Overpowered Protagonist');
    }
    if (text.includes('isekai') || text.includes('reincarnat') || text.includes('another world')) {
      detectedThemes.push('Isekai / Alternate Realm');
      if (!extractedGenres.includes('Fantasy')) extractedGenres.push('Fantasy');
    }
    if (text.includes('dark') || text.includes('grim') || text.includes('gore') || text.includes('brutal')) {
      detectedThemes.push('Dark / High Stakes');
      if (!extractedGenres.includes('Psychological')) extractedGenres.push('Psychological');
    }
    if (text.includes('school') || text.includes('academy')) {
      detectedThemes.push('Academy / Student Life');
    }

    // Query AniList
    const targetGenre = extractedGenres[0] || (detectedThemes.includes('Isekai / Alternate Realm') ? 'Fantasy' : 'Action');
    const result = await this.discoverAnime({
      genre: targetGenre,
      averageScore_greater: minScore,
      format: format,
      sort: 'POPULARITY_DESC',
      perPage: 12,
    });

    // Annotate results with AI rationale
    const annotatedResults = (result.media || []).slice(0, 6).map(anime => {
      const matchReasons = [];
      if (anime.genres && anime.genres.includes(targetGenre)) {
        matchReasons.push(`Matches your requested ${targetGenre} theme`);
      }
      if (detectedThemes.length > 0) {
        matchReasons.push(`Features ${detectedThemes.join(' & ')} narrative elements`);
      }
      if (anime.averageScore && anime.averageScore >= minScore) {
        matchReasons.push(`High community rating (${(anime.averageScore / 10).toFixed(1)}/10)`);
      }
      if (anime.studios?.nodes?.[0]?.name) {
        matchReasons.push(`Produced by acclaimed studio ${anime.studios.nodes[0].name}`);
      }

      return {
        ...anime,
        aiExplanation: matchReasons.join('. ') + '.',
        detectedThemes,
      };
    });

    return {
      querySummary: {
        detectedGenres: extractedGenres,
        detectedThemes,
        targetGenre,
      },
      results: annotatedResults,
    };
  },

  /**
   * Compare factual metadata between two anime
   */
  async compareAnime(id1, id2) {
    const [anime1, anime2] = await Promise.all([
      this.getAnimeDetails(id1),
      this.getAnimeDetails(id2),
    ]);
    return { anime1, anime2 };
  },

  /**
   * Fetch Airing Schedule for Calendar View
   */
  async getAiringSchedule(dayOffset = 0) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    now.setDate(now.getDate() + dayOffset);

    const startTimestamp = Math.floor(now.getTime() / 1000);
    const endTimestamp = startTimestamp + 86400; // 24 hours later

    return await this.getAiringScheduleRange(startTimestamp, endTimestamp);
  },

  // ==========================================
  // Helper Formatters
  // ==========================================

  formatTitle(titleObj) {
    if (!titleObj) return 'Untitled';
    return titleObj.english || titleObj.romaji || titleObj.native || 'Untitled';
  },

  formatScore(averageScore) {
    if (!averageScore) return 'N/A';
    return `${(averageScore / 10).toFixed(1)}`;
  },

  formatStatus(status) {
    if (!status) return 'Unknown';
    switch (status) {
      case 'RELEASING': return 'Airing';
      case 'FINISHED': return 'Finished';
      case 'NOT_YET_RELEASED': return 'Upcoming';
      case 'CANCELLED': return 'Cancelled';
      case 'HIATUS': return 'On Hiatus';
      default: return status;
    }
  },

  formatSeason(season, year) {
    if (!season && !year) return 'TBA';
    const s = season ? season.charAt(0) + season.slice(1).toLowerCase() : '';
    return `${s} ${year || ''}`.trim();
  },

  /**
   * Fetch Character details by ID
   */
  async getCharacterDetails(id) {
    const data = await fetchAniListGraphQL(QUERIES.GET_CHARACTER_DETAILS, { id: Number(id) });
    return data?.Character || null;
  },

  /**
   * Search Characters across AniList (or get most popular if search is empty)
   */
  async searchCharacters(search = '', page = 1, perPage = 24) {
    const variables = {
      page: Number(page),
      perPage: Number(perPage),
    };
    if (search && search.trim()) {
      variables.search = search.trim();
    }
    const data = await fetchAniListGraphQL(QUERIES.SEARCH_CHARACTERS, variables);
    return {
      characters: data?.Page?.characters || [],
      pageInfo: data?.Page?.pageInfo || {},
    };
  }
};
