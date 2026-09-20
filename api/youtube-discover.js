/**
 * Secure YouTube Anime Discovery API Endpoint
 * For Vercel / Node Serverless Environments
 * 
 * Searches ONLY approved official anime distributor channels:
 * - Ani-One India (UCcDvQM6NucVAlpryMA2K19A)
 * - Muse India (UCYYhAzgWuxPauRXdPpLAX3Q)
 * - Muse Asia (UCGbshtvS9t-8CW11W7TooQg)
 * - Ani-One Asia (UC0wNSTMWIL3qaorLx0jie6A)
 * - GundamInfo (UCejtUitnpnf8Be-v5NuDSLw)
 * 
 * Enforces strict anti-piracy, region filtering (IN), title matching, and embeddability.
 * API key is stored on the server side and NEVER exposed to the client.
 */

const APPROVED_CHANNELS = [
  { id: 'UCcDvQM6NucVAlpryMA2K19A', name: 'Ani-One India', region: 'IN' },
  { id: 'UCYYhAzgWuxPauRXdPpLAX3Q', name: 'Muse India', region: 'IN' },
  { id: 'UCGbshtvS9t-8CW11W7TooQg', name: 'Muse Asia', region: 'IN' },
  { id: 'UC0wNSTMWIL3qaorLx0jie6A', name: 'Ani-One Asia', region: 'IN' },
  { id: 'UCejtUitnpnf8Be-v5NuDSLw', name: 'GundamInfo', region: 'GLOBAL' }
];

const APPROVED_CHANNEL_IDS = new Set(APPROVED_CHANNELS.map(c => c.id));

// Negative keywords that disqualify an item from being an official full episode
const NEGATIVE_KEYWORDS = [
  'trailer', 'teaser', 'pv', 'preview', 'opening', 'ending', 'op', 'ed',
  'ost', 'theme song', 'reaction', 'review', 'recap', 'interview', 'talk',
  'creditless', 'highlights', 'short', 'event'
];

/**
 * Normalizes text for keyword matching
 */
function cleanText(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts episode number from video title
 */
function extractEpisodeNumber(title, targetEp = null) {
  const t = title.toLowerCase();

  // Explicit patterns: "episode 01", "ep 1", "ep.01", "e01", "01"
  const patterns = [
    /\bepisode\s*(\d+)\b/i,
    /\bep\.?\s*(\d+)\b/i,
    /\be(\d+)\b/i,
    /\b#(\d+)\b/i,
    /【ep\s*(\d+)】/i,
    /\[ep\s*(\d+)\]/i,
    /第\s*(\d+)\s*話/i
  ];

  for (const pattern of patterns) {
    const match = t.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0) {
        if (targetEp === null || targetEp === num) return num;
      }
    }
  }

  // If a target episode was requested, check if it appears with word boundaries
  if (targetEp !== null) {
    const padded = String(targetEp).padStart(2, '0');
    if (new RegExp(`\\b${targetEp}\\b`).test(t) || new RegExp(`\\b${padded}\\b`).test(t)) {
      return targetEp;
    }
  }

  return null;
}

/**
 * Matches video title against anime titles
 */
function isTitleMatch(videoTitle, candidateTitles) {
  const cleanVideo = cleanText(videoTitle);

  // Check if any negative keyword is present WITHOUT full episode indicators
  const isFullEp = cleanVideo.includes('full episode') || cleanVideo.includes('episode') || cleanVideo.includes('ep ');
  for (const neg of NEGATIVE_KEYWORDS) {
    if (cleanVideo.includes(neg) && !isFullEp) {
      return false;
    }
  }

  for (const candidate of candidateTitles) {
    if (!candidate) continue;
    const cleanCand = cleanText(candidate);
    if (!cleanCand || cleanCand.length < 3) continue;

    // Check direct substring
    if (cleanVideo.includes(cleanCand)) return true;

    // Check token overlap
    const candTokens = cleanCand.split(' ').filter(w => w.length > 2);
    if (candTokens.length > 0) {
      const matchedTokens = candTokens.filter(tok => cleanVideo.includes(tok));
      const ratio = matchedTokens.length / candTokens.length;
      if (ratio >= 0.65) return true;
    }
  }

  return false;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const queryParams = req.query || {};
  const animeId = queryParams.animeId ? parseInt(queryParams.animeId, 10) : null;
  const title = queryParams.title || '';
  const romaji = queryParams.romaji || '';
  const season = queryParams.season ? parseInt(queryParams.season, 10) : 1;
  const episodeCount = queryParams.episodes ? parseInt(queryParams.episodes, 10) : 12;
  const requestedEp = queryParams.episode ? parseInt(queryParams.episode, 10) : null;
  const regionCode = queryParams.region || 'IN';

  if (!title && !romaji) {
    return res.status(400).json({ error: 'Missing title or romaji parameter' });
  }

  const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      success: false,
      message: 'YouTube API key not configured on server',
      episodes: []
    });
  }

  const titlesToMatch = [title, romaji].filter(Boolean);
  const discoveredEpisodes = [];
  const seenVideos = new Set();

  try {
    // Search across approved official distributor channels
    for (const channel of APPROVED_CHANNELS) {
      const searchQuery = `${title} Episode`;
      const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.id}&q=${encodeURIComponent(searchQuery)}&type=video&regionCode=${regionCode}&videoEmbeddable=true&maxResults=15&key=${apiKey}`;

      const ytRes = await fetch(ytUrl);
      if (!ytRes.ok) {
        // Continue to next channel if quota or error on one
        continue;
      }

      const data = await ytRes.json();
      const items = data.items || [];

      for (const item of items) {
        const videoId = item.id?.videoId;
        if (!videoId || seenVideos.has(videoId)) continue;

        const videoTitle = item.snippet?.title || '';
        const itemChannelId = item.snippet?.channelId;

        // Security check: channel ID must be strictly in approved channel set
        if (!APPROVED_CHANNEL_IDS.has(itemChannelId)) continue;

        // Validate title matching
        if (!isTitleMatch(videoTitle, titlesToMatch)) continue;

        // Determine episode number
        const epNum = extractEpisodeNumber(videoTitle, requestedEp);
        if (!epNum) continue;

        seenVideos.add(videoId);
        discoveredEpisodes.push({
          anime_id: animeId,
          provider: 'youtube',
          channel_name: channel.name,
          channel_id: channel.id,
          video_id: videoId,
          episode_number: epNum,
          season_number: season,
          language: 'ja-JP / en-Sub',
          region: channel.region || 'IN',
          is_official: true,
          is_embeddable: true,
          video_title: videoTitle,
          thumbnail_url: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '',
          verified_at: new Date().toISOString()
        });
      }

      // If we found enough episodes or specific episode, break early
      if (requestedEp && discoveredEpisodes.some(e => e.episode_number === requestedEp)) {
        break;
      }
    }

    // Sort episodes ascending
    discoveredEpisodes.sort((a, b) => a.episode_number - b.episode_number);

    return res.status(200).json({
      success: true,
      count: discoveredEpisodes.length,
      episodes: discoveredEpisodes
    });
  } catch (err) {
    console.error('[YouTube Discover API Error]', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to discover episodes',
      episodes: []
    });
  }
}
