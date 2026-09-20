/**
 * High-Level Anime Domain Service
 * Encapsulates all data operations and provides clean, normalized models to UI components.
 * Completely decouples UI components from AniList GraphQL implementation.
 */

import { fetchAniListGraphQL, QUERIES } from './anilistApi.js';

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
   * Search and Filter Anime with complex parameters
   */
  async searchAndFilter({
    search = '',
    genre = '',
    seasonYear = null,
    season = null,
    status = null,
    sort = 'POPULARITY_DESC',
    page = 1,
    perPage = 20,
  } = {}) {
    const variables = {
      page: Number(page),
      perPage: Number(perPage),
      sort: [sort],
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

    const data = await fetchAniListGraphQL(QUERIES.SEARCH_AND_FILTER, variables);
    return {
      media: data?.Page?.media || [],
      pageInfo: data?.Page?.pageInfo || { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false },
    };
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
