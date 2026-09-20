/**
 * AniList GraphQL API Service
 * Endpoint: https://graphql.anilist.co
 * Handles queries, in-memory caching, and error handling.
 */

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache
const queryCache = new Map();

function getSessionCache(key) {
  try {
    const raw = sessionStorage.getItem('al_cache_' + key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setSessionCache(key, data) {
  try {
    sessionStorage.setItem('al_cache_' + key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch {
    // sessionStorage quota exceeded or unavailable; ignore
  }
}

/**
 * Execute a GraphQL query against AniList with client caching and stale-fallback resilience
 */
export async function fetchAniListGraphQL(query, variables = {}) {
  // Simple hash for cache key
  const cacheKey = JSON.stringify({ query, variables });
  let cached = queryCache.get(cacheKey);

  if (!cached) {
    const sess = getSessionCache(cacheKey);
    if (sess) {
      cached = sess;
      queryCache.set(cacheKey, sess);
    }
  }

  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  try {
    const response = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        // If rate limited, use stale cache if available
        if (cached && cached.data) {
          console.warn('[AniList API]: Rate limit hit (429), serving stale cached data.');
          return cached.data;
        }
        throw new Error('Rate limit reached on AniList API. Please wait a few seconds and try again.');
      }
      throw new Error(`AniList API responded with status ${response.status}`);
    }

    const json = await response.json();

    if (json.errors && json.errors.length > 0) {
      const errorMsg = json.errors.map(e => e.message).join(' | ');
      throw new Error(`AniList GraphQL Error: ${errorMsg}`);
    }

    // Cache successful response in memory and sessionStorage
    queryCache.set(cacheKey, {
      data: json.data,
      timestamp: Date.now(),
    });
    setSessionCache(cacheKey, json.data);

    return json.data;
  } catch (error) {
    // If network failed but we have stale cache, serve stale cache gracefully
    if (cached && cached.data) {
      console.warn('[AniList API]: Network error, serving cached data fallback.', error);
      return cached.data;
    }
    console.error('[AniList API Error]:', error);
    throw error;
  }
}

// ============================================================================
// GraphQL Query Fragments & Statements
// ============================================================================

const MEDIA_CARD_FIELDS = `
  id
  title {
    romaji
    english
    native
  }
  coverImage {
    extraLarge
    large
    medium
    color
  }
  bannerImage
  description(asHtml: false)
  genres
  seasonYear
  season
  status
  format
  episodes
  duration
  averageScore
  popularity
  nextAiringEpisode {
    episode
    airingAt
    timeUntilAiring
  }
  studios(isMain: true) {
    nodes {
      id
      name
    }
  }
`;

export const QUERIES = {
  // Trending anime
  GET_TRENDING: `
    query GetTrending($page: Int = 1, $perPage: Int = 12) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
          ${MEDIA_CARD_FIELDS}
        }
      }
    }
  `,

  // Popular anime
  GET_POPULAR: `
    query GetPopular($page: Int = 1, $perPage: Int = 12) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
          ${MEDIA_CARD_FIELDS}
        }
      }
    }
  `,

  // Recently updated / Currently Airing
  GET_RECENTLY_UPDATED: `
    query GetRecentlyUpdated($page: Int = 1, $perPage: Int = 12) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: ANIME, status: RELEASING, sort: UPDATED_AT_DESC, isAdult: false) {
          ${MEDIA_CARD_FIELDS}
        }
      }
    }
  `,

  // New releases (Current Season)
  GET_NEW_RELEASES: `
    query GetNewReleases($seasonYear: Int, $season: MediaSeason, $page: Int = 1, $perPage: Int = 12) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: ANIME, seasonYear: $seasonYear, season: $season, sort: POPULARITY_DESC, isAdult: false) {
          ${MEDIA_CARD_FIELDS}
        }
      }
    }
  `,

  // Upcoming Anime
  GET_UPCOMING: `
    query GetUpcoming($page: Int = 1, $perPage: Int = 12) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC, isAdult: false) {
          ${MEDIA_CARD_FIELDS}
        }
      }
    }
  `,

  // Top Rated Anime
  GET_TOP_RATED: `
    query GetTopRated($page: Int = 1, $perPage: Int = 12) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: ANIME, sort: SCORE_DESC, isAdult: false) {
          ${MEDIA_CARD_FIELDS}
        }
      }
    }
  `,

  // Full Anime Details Query
  GET_ANIME_DETAILS: `
    query GetAnimeDetails($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_CARD_FIELDS}
        source
        countryOfOrigin
        hashtag
        synonyms
        characters(perPage: 8, sort: ROLE) {
          edges {
            role
            node {
              id
              name {
                full
                native
              }
              image {
                medium
                large
              }
            }
            voiceActors(language: JAPANESE) {
              id
              name {
                full
                native
              }
              image {
                medium
              }
            }
          }
        }
        staff(perPage: 6) {
          edges {
            role
            node {
              id
              name {
                full
              }
              image {
                medium
              }
            }
          }
        }
        relations {
          edges {
            relationType
            node {
              id
              title {
                romaji
                english
              }
              coverImage {
                medium
                large
              }
              format
              status
              averageScore
            }
          }
        }
        externalLinks {
          id
          url
          site
          type
          icon
          color
        }
        streamingEpisodes {
          title
          thumbnail
          url
          site
        }
        recommendations(perPage: 6, sort: RATING_DESC) {
          nodes {
            mediaRecommendation {
              ${MEDIA_CARD_FIELDS}
            }
          }
        }
      }
    }
  `,

  // Multi-faceted search and filter
  SEARCH_AND_FILTER: `
    query SearchAnime(
      $page: Int = 1,
      $perPage: Int = 20,
      $search: String,
      $genre: String,
      $seasonYear: Int,
      $season: MediaSeason,
      $status: MediaStatus,
      $sort: [MediaSort]
    ) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(
          type: ANIME,
          search: $search,
          genre: $genre,
          seasonYear: $seasonYear,
          season: $season,
          status: $status,
          sort: $sort,
          isAdult: false
        ) {
          ${MEDIA_CARD_FIELDS}
        }
      }
    }
  `,

  // Airing schedule for Calendar View
  GET_AIRING_SCHEDULE: `
    query GetAiringSchedule($airingAt_greater: Int, $airingAt_lesser: Int, $page: Int = 1, $perPage: Int = 50) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
          currentPage
        }
        airingSchedules(
          airingAt_greater: $airingAt_greater,
          airingAt_lesser: $airingAt_lesser,
          sort: TIME
        ) {
          id
          airingAt
          timeUntilAiring
          episode
          media {
            ${MEDIA_CARD_FIELDS}
          }
        }
      }
    }
  `,

  // Advanced Discovery Query with format, minimum score, and popularity
  ADVANCED_DISCOVERY: `
    query AdvancedDiscovery(
      $page: Int = 1,
      $perPage: Int = 20,
      $search: String,
      $genre: String,
      $genre_in: [String],
      $seasonYear: Int,
      $season: MediaSeason,
      $status: MediaStatus,
      $format: MediaFormat,
      $averageScore_greater: Int,
      $popularity_greater: Int,
      $sort: [MediaSort] = [POPULARITY_DESC]
    ) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(
          type: ANIME,
          search: $search,
          genre: $genre,
          genre_in: $genre_in,
          seasonYear: $seasonYear,
          season: $season,
          status: $status,
          format: $format,
          averageScore_greater: $averageScore_greater,
          popularity_greater: $popularity_greater,
          sort: $sort,
          isAdult: false
        ) {
          ${MEDIA_CARD_FIELDS}
        }
      }
    }
  `,

  // List all available genres from AniList
  GET_GENRES: `
    query {
      GenreCollection
    }
  `,

  // Character Details Query
  GET_CHARACTER_DETAILS: `
    query GetCharacterDetails($id: Int) {
      Character(id: $id) {
        id
        name {
          full
          native
          alternative
        }
        image {
          large
          medium
        }
        description(asHtml: false)
        gender
        age
        dateOfBirth {
          year
          month
          day
        }
        favourites
        media(type: ANIME, sort: POPULARITY_DESC, perPage: 16) {
          edges {
            characterRole
            voiceActors(language: JAPANESE) {
              id
              name {
                full
                native
              }
              image {
                medium
              }
            }
            node {
              id
              title {
                romaji
                english
              }
              coverImage {
                large
                medium
              }
              format
              status
              seasonYear
              averageScore
            }
          }
        }
      }
    }
  `,

  // Character Search Query
  SEARCH_CHARACTERS: `
    query SearchCharacters($search: String, $page: Int = 1, $perPage: Int = 24) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        characters(search: $search, sort: FAVOURITES_DESC) {
          id
          name {
            full
            native
          }
          image {
            large
            medium
          }
          favourites
          media(type: ANIME, perPage: 2) {
            nodes {
              id
              title {
                romaji
                english
              }
            }
          }
        }
      }
    }
  `
};
