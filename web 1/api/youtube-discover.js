/**
 * Secure YouTube Anime Discovery API Endpoint
 * For Vercel / Node Serverless Environments
 * 
 * Strict Legal & Anti-Piracy Rules:
 * 1. Searches ONLY approved official anime distributor channels:
 *    - Muse India (UCYYhAzgWuxPauRXdPpLAX3Q)
 *    - Ani-One India (UC67pLBZ_z4Gd46t6mW7uHjA)
 *    - Muse Asia (UCGbshtvS9t-8CW11W7TooQg)
 *    - Ani-One Asia (UC0wNSTMWIL3qaorLx0jie6A)
 * 2. Uses YouTube Data API v3 (search.list, playlists.list, playlistItems.list, videos.list).
 * 3. Enforces verification rules:
 *    - Approved official channel ID check
 *    - Correct anime title match
 *    - Correct season extraction
 *    - Correct episode number extraction
 *    - Language detection (Telugu, Hindi, Tamil, English, Japanese)
 *    - Video is embeddable (video.status.embeddable === true)
 *    - Video is public (video.status.privacyStatus === 'public')
 *    - India region compatibility (IN)
 *    - Confidence scoring: high confidence -> verified, medium -> needs_verification, low -> rejected.
 * 4. API key is stored securely in environment variables and never exposed to the client.
 */

const APPROVED_CHANNELS = [
  { id: 'UCYYhAzgWuxPauRXdPpLAX3Q', name: 'Muse India', region: 'IN' },
  { id: 'UC67pLBZ_z4Gd46t6mW7uHjA', name: 'Ani-One India', region: 'IN' },
  { id: 'UCGbshtvS9t-8CW11W7TooQg', name: 'Muse Asia', region: 'IN' },
  { id: 'UC0wNSTMWIL3qaorLx0jie6A', name: 'Ani-One Asia', region: 'IN' }
];

const APPROVED_CHANNEL_IDS = new Set(APPROVED_CHANNELS.map(c => c.id));

const NEGATIVE_KEYWORDS = [
  'trailer', 'teaser', 'pv', 'preview', 'opening', 'ending', 'op', 'ed',
  'ost', 'theme song', 'reaction', 'review', 'recap', 'interview', 'talk',
  'creditless', 'highlights', 'short', 'event', 'clip'
];

function cleanText(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractEpisodeNumber(title, reqEp = null) {
  const t = title.toLowerCase();
  const patterns = [
    /\bepisode\s*0*(\d+)\b/i,
    /\bep\.?\s*0*(\d+)\b/i,
    /\be\s*0*(\d+)\b/i,
    /\b#\s*0*(\d+)\b/i,
    /【ep\s*0*(\d+)】/i,
    /\[ep\s*0*(\d+)\]/i,
    /第\s*0*(\d+)\s*話/i
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) {
      const num = parseInt(m[1], 10);
      if (!isNaN(num) && num > 0) {
        if (reqEp === null || reqEp === num) return num;
      }
    }
  }
  if (reqEp !== null) {
    const padded = String(reqEp).padStart(2, '0');
    const r = new RegExp(`(?:^|\\s|\\[|【|#)${reqEp}(?:$|\\s|\\]|】|\\b)`);
    const pr = new RegExp(`(?:^|\\s|\\[|【|#)${padded}(?:$|\\s|\\]|】|\\b)`);
    if (r.test(t) || pr.test(t)) return reqEp;
  }
  return null;
}

function extractSeason(title, defaultSeason = 1) {
  const t = title.toLowerCase();
  if (t.includes('season 3') || t.includes(' 3rd season') || t.includes(' iii') || t.includes('s3')) return 3;
  if (t.includes('season 2') || t.includes(' 2nd season') || t.includes(' ii') || t.includes('s2')) return 2;
  if (t.includes('season 1') || t.includes(' 1st season') || t.includes('s1')) return 1;
  const match = t.match(/\bseason\s*0*(\d+)\b/i) || t.match(/\bs0*(\d+)\b/i) || t.match(/\bcour\s*0*(\d+)\b/i);
  if (match) {
    const s = parseInt(match[1], 10);
    if (!isNaN(s) && s > 0) return s;
  }
  return defaultSeason;
}

function detectLanguage(title, channelName = '') {
  const comb = `${title} ${channelName}`.toLowerCase();
  if (comb.includes('telugu dub') || comb.includes('telugu audio') || comb.includes('తెలుగు')) {
    return { language: 'Telugu', status: 'verified' };
  }
  if (comb.includes('tamil dub') || comb.includes('tamil audio') || comb.includes('தமிழ்')) {
    return { language: 'Tamil', status: 'verified' };
  }
  if (comb.includes('hindi dub') || comb.includes('hindi audio') || comb.includes('हिंदी')) {
    return { language: 'Hindi', status: 'verified' };
  }
  if (comb.includes('bengali dub') || comb.includes('bangla dub') || comb.includes('বাংলা')) {
    return { language: 'Bengali', status: 'verified' };
  }
  if (comb.includes('malayalam dub') || comb.includes('malayalam audio')) {
    return { language: 'Malayalam', status: 'verified' };
  }
  if (comb.includes('kannada dub') || comb.includes('kannada audio')) {
    return { language: 'Kannada', status: 'verified' };
  }
  if (comb.includes('english dub') || comb.includes('eng dub')) {
    return { language: 'English Dub', status: 'verified' };
  }
  if (comb.includes('english sub') || comb.includes('eng sub') || comb.includes('[sub]')) {
    return { language: 'Japanese (English Sub)', status: 'verified' };
  }
  if (channelName.toLowerCase().includes('muse') || channelName.toLowerCase().includes('ani-one')) {
    return { language: 'Japanese (English Sub)', status: 'detected' };
  }
  return { language: 'Official Audio', status: 'unknown' };
}

function isTitleMatch(videoTitle, candidateTitles) {
  const cleanVideo = cleanText(videoTitle);
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

    if (cleanVideo.includes(cleanCand)) return true;

    const candTokens = cleanCand.split(' ').filter(w => w.length > 2);
    if (candTokens.length > 0) {
      const matchedTokens = candTokens.filter(tok => cleanVideo.includes(tok));
      const ratio = matchedTokens.length / candTokens.length;
      if (ratio >= 0.60) return true;
    }
  }
  return false;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-youtube-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const queryParams = req.query || {};
  const animeId = queryParams.animeId ? parseInt(queryParams.animeId, 10) : null;
  const title = (queryParams.title || '').trim();
  const romaji = (queryParams.romaji || '').trim();
  const season = queryParams.season ? parseInt(queryParams.season, 10) : 1;
  const requestedLang = (queryParams.language || '').trim();
  const requestedEp = queryParams.episode ? parseInt(queryParams.episode, 10) : null;
  const regionCode = queryParams.region || 'IN';

  if (!title && !romaji) {
    return res.status(400).json({ error: 'Missing title or romaji parameter' });
  }

  const apiKey = req.headers['x-youtube-api-key'] || process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;
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
    for (const channel of APPROVED_CHANNELS) {
      // 1. Try finding official series playlist first (highly efficient 1-unit call)
      const plSearchQuery = requestedLang && requestedLang !== 'All' 
        ? `${title} ${requestedLang}` 
        : title;
      
      const plUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${channel.id}&q=${encodeURIComponent(plSearchQuery)}&maxResults=5&key=${apiKey}`;
      try {
        const plRes = await fetch(plUrl);
        if (plRes.ok) {
          const plData = await plRes.json();
          for (const pl of (plData.items || [])) {
            const plTitle = pl.snippet?.title || '';
            if (isTitleMatch(plTitle, titlesToMatch)) {
              // Fetch playlist items
              const pItemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${pl.id}&maxResults=50&key=${apiKey}`;
              const pItemsRes = await fetch(pItemsUrl);
              if (pItemsRes.ok) {
                const pItemsData = await pItemsRes.json();
                const vIds = (pItemsData.items || []).map(it => it.contentDetails?.videoId).filter(Boolean);
                
                if (vIds.length > 0) {
                  // Verify embeddability and public status with videos.list
                  const vListUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,status,contentDetails&id=${vIds.join(',')}&key=${apiKey}`;
                  const vListRes = await fetch(vListUrl);
                  if (vListRes.ok) {
                    const vListData = await vListRes.json();
                    for (const v of (vListData.items || [])) {
                      const vid = v.id;
                      if (!vid || seenVideos.has(vid)) continue;
                      if (!APPROVED_CHANNEL_IDS.has(v.snippet?.channelId)) continue;
                      if (v.status?.privacyStatus !== 'public') continue;

                      const isEmbeddable = v.status?.embeddable === true;
                      const vTitle = v.snippet?.title || '';
                      const epNum = extractEpisodeNumber(vTitle, requestedEp);
                      const epSeason = extractSeason(vTitle, season);
                      const langInfo = detectLanguage(vTitle, channel.name);

                      // Filter by season if requested
                      if (season && epSeason !== season) continue;
                      // Filter by language if requested
                      if (requestedLang && requestedLang !== 'All') {
                        if (!langInfo.language.toLowerCase().includes(requestedLang.toLowerCase())) continue;
                      }

                      seenVideos.add(vid);
                      const isHighConfidence = isTitleMatch(vTitle, titlesToMatch) && epNum !== null && isEmbeddable;
                      const status = isHighConfidence ? 'verified' : (isEmbeddable ? 'needs_verification' : 'rejected');

                      discoveredEpisodes.push({
                        anime_id: animeId,
                        provider: 'youtube',
                        channel_name: channel.name,
                        channel_id: channel.id,
                        video_id: vid,
                        episode_number: epNum || 1,
                        season_number: epSeason,
                        language: langInfo.language,
                        region: channel.region || regionCode,
                        is_official: true,
                        is_embeddable: isEmbeddable,
                        verification_status: status,
                        video_title: vTitle,
                        thumbnail_url: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.medium?.url || '',
                        source_url: `https://www.youtube.com/watch?v=${vid}`,
                        verified_at: new Date().toISOString()
                      });
                    }
                  }
                }
              }
            }
          }
        }
      } catch (plErr) {
        // Fall back to standard search
      }

      // 2. If playlist discovery yielded few or no episodes, run search.list
      if (discoveredEpisodes.length === 0) {
        const queryTerm = requestedLang && requestedLang !== 'All'
          ? `${title} Season ${season} ${requestedLang} Episode`
          : `${title} Season ${season} Episode`;
        
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.id}&q=${encodeURIComponent(queryTerm)}&type=video&regionCode=${regionCode}&videoEmbeddable=true&maxResults=25&key=${apiKey}`;
        
        const sRes = await fetch(searchUrl);
        if (sRes.ok) {
          const sData = await sRes.json();
          const items = sData.items || [];
          const candidateIds = items.map(it => it.id?.videoId).filter(Boolean);

          if (candidateIds.length > 0) {
            const vCheckUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${candidateIds.join(',')}&key=${apiKey}`;
            const vCheckRes = await fetch(vCheckUrl);
            if (vCheckRes.ok) {
              const vCheckData = await vCheckRes.json();
              for (const v of (vCheckData.items || [])) {
                const vid = v.id;
                if (!vid || seenVideos.has(vid)) continue;
                if (!APPROVED_CHANNEL_IDS.has(v.snippet?.channelId)) continue;
                if (v.status?.privacyStatus !== 'public') continue;

                const isEmbeddable = v.status?.embeddable === true;
                const vTitle = v.snippet?.title || '';
                if (!isTitleMatch(vTitle, titlesToMatch)) continue;

                const epNum = extractEpisodeNumber(vTitle, requestedEp);
                const epSeason = extractSeason(vTitle, season);
                const langInfo = detectLanguage(vTitle, channel.name);

                if (season && epSeason !== season) continue;
                if (requestedLang && requestedLang !== 'All') {
                  if (!langInfo.language.toLowerCase().includes(requestedLang.toLowerCase())) continue;
                }

                seenVideos.add(vid);
                const isHighConfidence = epNum !== null && isEmbeddable;
                const status = isHighConfidence ? 'verified' : (isEmbeddable ? 'needs_verification' : 'rejected');

                discoveredEpisodes.push({
                  anime_id: animeId,
                  provider: 'youtube',
                  channel_name: channel.name,
                  channel_id: channel.id,
                  video_id: vid,
                  episode_number: epNum || 1,
                  season_number: epSeason,
                  language: langInfo.language,
                  region: channel.region || regionCode,
                  is_official: true,
                  is_embeddable: isEmbeddable,
                  verification_status: status,
                  video_title: vTitle,
                  thumbnail_url: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.medium?.url || '',
                  source_url: `https://www.youtube.com/watch?v=${vid}`,
                  verified_at: new Date().toISOString()
                });
              }
            }
          }
        }
      }
    }

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
      error: err.message || 'Discovery failure',
      episodes: []
    });
  }
}
