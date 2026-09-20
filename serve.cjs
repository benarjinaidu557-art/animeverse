const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function loadEnv() {
  const envObj = {};
  for (const file of ['.env', '.env.local']) {
    const full = path.join(__dirname, file);
    if (fs.existsSync(full)) {
      const lines = fs.readFileSync(full, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const idx = trimmed.indexOf('=');
          if (idx > 0) {
            const k = trimmed.slice(0, idx).trim();
            const v = trimmed.slice(idx + 1).trim();
            envObj[k] = v;
          }
        }
      }
    }
  }
  return envObj;
}

// Discovery Queue & API Quota Protection Manager (Phases 13 & 14)
const QueueManager = {
  QUOTA_DAILY_LIMIT: 90, // 90 search calls * 100 units = 9,000 units / 10,000 free tier
  COOLDOWN_MS: 24 * 60 * 60 * 1000, // 24 hours per anime

  quotaCount: 0,
  lastQuotaResetDate: new Date().toISOString().split('T')[0],
  cooldowns: new Map(), // animeId -> timestamp
  queue: [], // Array<{ animeId, title, priority, status, queuedAt }>

  // Local admin persistent store
  adminSources: [
    {
      anime_id: 116006,
      provider: 'youtube',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      video_id: 'jSeXcj5y3Ao',
      episode_number: 1,
      season_number: 1,
      language: 'Hindi Dub',
      language_status: 'verified',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      match_confidence: 1.0,
      verification_status: 'verified',
      video_title: 'THE GOD OF HIGH SCHOOL - Episode 01 [Hindi Dub] | Muse India',
      source_url: 'https://www.youtube.com/watch?v=jSeXcj5y3Ao',
      verified_at: new Date().toISOString()
    },
    // Mob Psycho 100 Season 1 (AniList ID: 21507) - Muse India Telugu Dub
    ...[
      { ep: 1, id: 'Q8gS7x4hBs0', title: '[Telugu Dub] Mob Psycho 100 - Episode 01 | Muse IN' },
      { ep: 2, id: 'Xy2mCmNnc_c', title: '[Telugu Dub] Mob Psycho 100 - Episode 02 | Muse IN' },
      { ep: 3, id: 'Dbv5q8XqYyY', title: '[Telugu Dub] Mob Psycho 100 - Episode 03 | Muse IN' },
      { ep: 4, id: 'MGxJNWfu3sI', title: '[Telugu Dub] Mob Psycho 100 - Episode 04 | Muse IN' },
      { ep: 5, id: 'cSvLTwtqo2M', title: '[Telugu Dub] Mob Psycho 100 - Episode 05 | Muse IN' },
      { ep: 6, id: 'ovRy8Gcp3Yc', title: '[Telugu Dub] Mob Psycho 100 - Episode 06 | Muse IN' },
      { ep: 7, id: 'ZSeEnalOK0k', title: '[Telugu Dub] Mob Psycho 100 - Episode 07 | Muse IN' },
      { ep: 8, id: '8A8fgLyW8Ok', title: '[Telugu Dub] Mob Psycho 100 - Episode 08 | Muse IN' },
      { ep: 9, id: 'GlprPDmq6bM', title: '[Telugu Dub] Mob Psycho 100 - Episode 09 | Muse IN' },
      { ep: 10, id: '1kU7x-ow1CA', title: '[Telugu Dub] Mob Psycho 100 - Episode 10 | Muse IN' },
      { ep: 11, id: '-LT1Xoj0r6U', title: '[Telugu Dub] Mob Psycho 100 - Episode 11 | Muse IN' },
      { ep: 12, id: 'Ph3AG6UCiy4', title: '[Telugu Dub] Mob Psycho 100 - Episode 12 | Muse IN' }
    ].map(item => ({
      anime_id: 21507,
      provider: 'youtube',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      video_id: item.id,
      episode_number: item.ep,
      season_number: 1,
      language: 'Telugu',
      language_status: 'verified',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      match_confidence: 1.0,
      verification_status: 'verified',
      video_title: item.title,
      source_url: `https://www.youtube.com/watch?v=${item.id}`,
      verified_at: new Date().toISOString()
    })),
    // Mob Psycho 100 Season 2 (AniList ID: 101338 / 21507 Season 2) - Muse India Telugu Dub
    ...[
      { ep: 1, id: 'w9YqCWhlPR8', title: '[Telugu Dub] Mob Psycho 100 II - Episode 01 | Muse IN' },
      { ep: 2, id: 'KAV9Xfss240', title: '[Telugu Dub] Mob Psycho 100 II - Episode 02 | Muse IN' },
      { ep: 3, id: 'yGL74jzQapE', title: '[Telugu Dub] Mob Psycho 100 II - Episode 03 | Muse IN' },
      { ep: 4, id: 'lZgEV0jZCy8', title: '[Telugu Dub] Mob Psycho 100 II - Episode 04 | Muse IN' },
      { ep: 5, id: 'Mb3n60vuGIA', title: '[Telugu Dub] Mob Psycho 100 II - Episode 05 | Muse IN' },
      { ep: 6, id: 'nmCCja33Vwc', title: '[Telugu Dub] Mob Psycho 100 II - Episode 06 | Muse IN' },
      { ep: 7, id: 'QngweKy2a_Q', title: '[Telugu Dub] Mob Psycho 100 II - Episode 07 | Muse IN' },
      { ep: 8, id: 'gorOJT0qUg4', title: '[Telugu Dub] Mob Psycho 100 II - Episode 08 | Muse IN' },
      { ep: 9, id: 'OsMcTrmYyvU', title: '[Telugu Dub] Mob Psycho 100 II - Episode 09 | Muse IN' },
      { ep: 10, id: 'RgFUiXBF96Y', title: '[Telugu Dub] Mob Psycho 100 II - Episode 10 | Muse IN' },
      { ep: 11, id: '7CiqjJ4XEOQ', title: '[Telugu Dub] Mob Psycho 100 II - Episode 11 | Muse IN' },
      { ep: 12, id: '8WvHTA9NkkQ', title: '[Telugu Dub] Mob Psycho 100 II - Episode 12 | Muse IN' },
      { ep: 13, id: 'wWK4lsLwtUg', title: '[Telugu Dub] Mob Psycho 100 II - Episode 13 | Muse IN' }
    ].map(item => ({
      anime_id: 21507,
      provider: 'youtube',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      video_id: item.id,
      episode_number: item.ep,
      season_number: 2,
      language: 'Telugu',
      language_status: 'verified',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      match_confidence: 1.0,
      verification_status: 'verified',
      video_title: item.title,
      source_url: `https://www.youtube.com/watch?v=${item.id}`,
      verified_at: new Date().toISOString()
    })),
    // Also registered for 101338 (Mob Psycho 100 II on AniList)
    ...[
      { ep: 1, id: 'w9YqCWhlPR8', title: '[Telugu Dub] Mob Psycho 100 II - Episode 01 | Muse IN' },
      { ep: 2, id: 'KAV9Xfss240', title: '[Telugu Dub] Mob Psycho 100 II - Episode 02 | Muse IN' },
      { ep: 3, id: 'yGL74jzQapE', title: '[Telugu Dub] Mob Psycho 100 II - Episode 03 | Muse IN' },
      { ep: 4, id: 'lZgEV0jZCy8', title: '[Telugu Dub] Mob Psycho 100 II - Episode 04 | Muse IN' },
      { ep: 5, id: 'Mb3n60vuGIA', title: '[Telugu Dub] Mob Psycho 100 II - Episode 05 | Muse IN' },
      { ep: 6, id: 'nmCCja33Vwc', title: '[Telugu Dub] Mob Psycho 100 II - Episode 06 | Muse IN' },
      { ep: 7, id: 'QngweKy2a_Q', title: '[Telugu Dub] Mob Psycho 100 II - Episode 07 | Muse IN' },
      { ep: 8, id: 'gorOJT0qUg4', title: '[Telugu Dub] Mob Psycho 100 II - Episode 08 | Muse IN' },
      { ep: 9, id: 'OsMcTrmYyvU', title: '[Telugu Dub] Mob Psycho 100 II - Episode 09 | Muse IN' },
      { ep: 10, id: 'RgFUiXBF96Y', title: '[Telugu Dub] Mob Psycho 100 II - Episode 10 | Muse IN' },
      { ep: 11, id: '7CiqjJ4XEOQ', title: '[Telugu Dub] Mob Psycho 100 II - Episode 11 | Muse IN' },
      { ep: 12, id: '8WvHTA9NkkQ', title: '[Telugu Dub] Mob Psycho 100 II - Episode 12 | Muse IN' },
      { ep: 13, id: 'wWK4lsLwtUg', title: '[Telugu Dub] Mob Psycho 100 II - Episode 13 | Muse IN' }
    ].map(item => ({
      anime_id: 101338,
      provider: 'youtube',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      video_id: item.id,
      episode_number: item.ep,
      season_number: 2,
      language: 'Telugu',
      language_status: 'verified',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      match_confidence: 1.0,
      verification_status: 'verified',
      video_title: item.title,
      source_url: `https://www.youtube.com/watch?v=${item.id}`,
      verified_at: new Date().toISOString()
    }))
  ],

  checkReset() {
    const today = new Date().toISOString().split('T')[0];
    if (today !== this.lastQuotaResetDate) {
      this.quotaCount = 0;
      this.lastQuotaResetDate = today;
    }
  },

  hasDailyQuota() {
    this.checkReset();
    return this.quotaCount < this.QUOTA_DAILY_LIMIT;
  },

  getQuotaUsed() {
    this.checkReset();
    return this.quotaCount;
  },

  recordSearch(animeId) {
    this.checkReset();
    this.quotaCount++;
    if (animeId) {
      this.cooldowns.set(Number(animeId), Date.now());
    }
  },

  isInCooldown(animeId) {
    if (!animeId) return false;
    const last = this.cooldowns.get(Number(animeId));
    if (!last) return false;
    return (Date.now() - last) < this.COOLDOWN_MS;
  },

  getCooldownRemaining(animeId) {
    const last = this.cooldowns.get(Number(animeId));
    if (!last) return 0;
    return Math.max(0, this.COOLDOWN_MS - (Date.now() - last));
  },

  enqueue({ animeId, title, priority = 2 }) {
    const existing = this.queue.find(q => q.animeId === animeId);
    if (existing) {
      if (priority < existing.priority) existing.priority = priority;
      return existing;
    }
    const item = {
      animeId,
      title,
      priority,
      status: 'queued',
      queuedAt: new Date().toISOString()
    };
    this.queue.push(item);
    this.queue.sort((a, b) => a.priority - b.priority);
    return item;
  },

  getAdminSources() {
    return this.adminSources;
  },

  updateAdminSource({ animeId, videoId, status, episodeNumber, seasonNumber, language }) {
    let item = this.adminSources.find(s => s.video_id === videoId);
    if (!item) {
      item = {
        anime_id: Number(animeId) || 0,
        provider: 'youtube',
        channel_name: 'Official Licensor',
        channel_id: 'OFFICIAL_CHANNEL',
        video_id: videoId,
        episode_number: Number(episodeNumber) || 1,
        season_number: Number(seasonNumber) || 1,
        language: language || 'Japanese (English Sub)',
        language_status: 'verified',
        region: 'IN',
        is_official: true,
        is_embeddable: true,
        match_confidence: 1.0,
        verification_status: status || 'verified',
        source_url: `https://www.youtube.com/watch?v=${videoId}`,
        video_title: `Episode ${episodeNumber || 1}`,
        verified_at: new Date().toISOString()
      };
      this.adminSources.push(item);
    } else {
      if (status) item.verification_status = status;
      if (episodeNumber) item.episode_number = Number(episodeNumber);
      if (seasonNumber) item.season_number = Number(seasonNumber);
      if (language) item.language = language;
      item.verified_at = new Date().toISOString();
    }
    return item;
  },

  deleteAdminSource(videoId) {
    this.adminSources = this.adminSources.filter(s => s.video_id !== videoId);
  }
};

const server = http.createServer((req, res) => {
  let safePath = req.url.split('?')[0];
  if (safePath === '/' || safePath === '') safePath = '/index.html';

  // Dynamically serve latest environment variables from .env / .env.local
  if (safePath === '/js/config/env.js') {
    const envVars = loadEnv();
    const body = `window.ENV = Object.assign(window.ENV || {}, ${JSON.stringify(envVars, null, 2)});`;
    res.writeHead(200, {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(body);
    return;
  }

  // Check YouTube API connection status
  if (safePath === '/api/youtube-status') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-youtube-api-key'
    });
    if (req.method === 'OPTIONS') {
      res.end();
      return;
    }

    const envVars = loadEnv();
    const urlObj = new URL(req.url, 'http://localhost:' + PORT);
    const apiKey = urlObj.searchParams.get('key') || req.headers['x-youtube-api-key'] || envVars.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      res.end(JSON.stringify({
        connected: false,
        configured: false,
        message: 'No YouTube API key configured yet. Enter your key in Admin Settings or set YOUTUBE_API_KEY in .env.local.'
      }));
      return;
    }

    // Ping YouTube Data API against Muse India channel
    fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=UCYYhAzgWuxPauRXdPpLAX3Q&key=${apiKey}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          res.end(JSON.stringify({
            connected: false,
            configured: true,
            error: data.error.message || 'Invalid API Key or Quota Exceeded',
            details: data.error
          }));
        } else {
          res.end(JSON.stringify({
            connected: true,
            configured: true,
            message: 'YouTube Data API v3 connected successfully!',
            verifiedChannel: data.items?.[0]?.snippet?.title || 'Muse India'
          }));
        }
      })
      .catch(err => {
        res.end(JSON.stringify({ connected: false, configured: true, error: err.message }));
      });
    return;
  }

  // Save YouTube API key to .env.local
  if (safePath === '/api/youtube-config') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    if (req.method === 'OPTIONS') {
      res.end();
      return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const newKey = (payload.apiKey || '').trim();
        if (!newKey) {
          res.end(JSON.stringify({ success: false, error: 'API key is required.' }));
          return;
        }

        const envLocalPath = path.join(__dirname, '.env.local');
        let currentContent = fs.existsSync(envLocalPath) ? fs.readFileSync(envLocalPath, 'utf8') : '';
        if (currentContent.includes('YOUTUBE_API_KEY=')) {
          currentContent = currentContent.replace(/YOUTUBE_API_KEY=.*(\r?\n|$)/g, `YOUTUBE_API_KEY=${newKey}\n`);
        } else {
          currentContent += `\nYOUTUBE_API_KEY=${newKey}\n`;
        }
        fs.writeFileSync(envLocalPath, currentContent, 'utf8');

        // Also update runtime process.env
        process.env.YOUTUBE_API_KEY = newKey;

        res.end(JSON.stringify({
          success: true,
          message: 'YouTube Data API key saved to .env.local and activated!'
        }));
      } catch (err) {
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Backend endpoint for secure YouTube discovery
  if (safePath === '/api/youtube-discover') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    if (req.method === 'OPTIONS') {
      res.end();
      return;
    }

    const urlObj = new URL(req.url, 'http://localhost:' + PORT);
    const animeId = parseInt(urlObj.searchParams.get('animeId') || '0', 10);
    const title = (urlObj.searchParams.get('title') || '').trim();
    const romaji = (urlObj.searchParams.get('romaji') || '').trim();
    const season = parseInt(urlObj.searchParams.get('season') || '1', 10);
    const requestedEp = urlObj.searchParams.get('episode') ? parseInt(urlObj.searchParams.get('episode'), 10) : null;
    const regionCode = urlObj.searchParams.get('region') || 'IN';
    const forceScan = urlObj.searchParams.get('force') === 'true';

    // Check anime 24-hour cooldown (Phase 14: Quota Protection)
    if (!forceScan && QueueManager.isInCooldown(animeId)) {
      const remainingMs = QueueManager.getCooldownRemaining(animeId);
      const remainingHrs = (remainingMs / (1000 * 60 * 60)).toFixed(1);
      res.end(JSON.stringify({
        success: false,
        cooldown: true,
        message: `Anime ID ${animeId} was scanned recently. On cooldown for ${remainingHrs} more hours.`,
        episodes: []
      }));
      return;
    }

    // Check daily quota limit (Phase 14: Quota Protection)
    if (!QueueManager.hasDailyQuota()) {
      res.end(JSON.stringify({
        success: false,
        quota_exceeded: true,
        message: 'Daily YouTube API discovery limit reached (90 calls/day budget). Resets at 00:00 UTC.',
        episodes: []
      }));
      return;
    }

    const envVars = loadEnv();
    const apiKey = urlObj.searchParams.get('key') || req.headers['x-youtube-api-key'] || envVars.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      res.end(JSON.stringify({
        success: false,
        message: 'YOUTUBE_API_KEY not configured in environment',
        episodes: []
      }));
      return;
    }

    const APPROVED_CHANNELS = [
      { id: 'UCcDvQM6NucVAlpryMA2K19A', name: 'Ani-One India', region: 'IN' },
      { id: 'UCYYhAzgWuxPauRXdPpLAX3Q', name: 'Muse India', region: 'IN' },
      { id: 'UCGbshtvS9t-8CW11W7TooQg', name: 'Muse Asia', region: 'IN' },
      { id: 'UC0wNSTMWIL3qaorLx0jie6A', name: 'Ani-One Asia', region: 'IN' },
      { id: 'UCejtUitnpnf8Be-v5NuDSLw', name: 'GundamInfo', region: 'GLOBAL' }
    ];
    const APPROVED_SET = new Set(APPROVED_CHANNELS.map(c => c.id));
    const NEGATIVE_KEYWORDS = ['trailer', 'teaser', 'pv', 'preview', 'opening', 'ending', 'op', 'ed', 'ost', 'theme song', 'reaction', 'review', 'recap', 'interview', 'talk', 'creditless', 'highlights', 'short', 'clip'];

    function cleanText(str) {
      return (str || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // Strict episode number extraction (Phase 5)
    function extractEp(videoTitle, reqEp) {
      const t = videoTitle.toLowerCase();
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

    function extractSeason(videoTitle, defaultSeason = 1) {
      const t = videoTitle.toLowerCase();
      const match = t.match(/\bseason\s*0*(\d+)\b/i) || t.match(/\bs0*(\d+)\b/i) || t.match(/\bcour\s*0*(\d+)\b/i);
      if (match) {
        const s = parseInt(match[1], 10);
        if (!isNaN(s) && s > 0) return s;
      }
      return defaultSeason;
    }

    // Language detection (Phase 6)
    function detectLang(title, channelName = '') {
      const comb = `${title} ${channelName}`.toLowerCase();
      if (comb.includes('telugu dub') || comb.includes('telugu audio') || comb.includes('తెలుగు')) return { language: 'Telugu Dub', status: 'verified' };
      if (comb.includes('tamil dub') || comb.includes('tamil audio') || comb.includes('தமிழ்')) return { language: 'Tamil Dub', status: 'verified' };
      if (comb.includes('bengali dub') || comb.includes('bangla dub') || comb.includes('বাংলা')) return { language: 'Bengali Dub', status: 'verified' };
      if (comb.includes('malayalam dub') || comb.includes('malayalam audio')) return { language: 'Malayalam Dub', status: 'verified' };
      if (comb.includes('kannada dub') || comb.includes('kannada audio')) return { language: 'Kannada Dub', status: 'verified' };
      if (comb.includes('hindi dub') || comb.includes('hindi audio') || (channelName.toLowerCase().includes('india') && comb.includes('dub') && !comb.includes('eng'))) return { language: 'Hindi Dub', status: 'verified' };
      if (comb.includes('english dub') || comb.includes('eng dub')) return { language: 'English Dub', status: 'verified' };
      if (comb.includes('english sub') || comb.includes('eng sub') || comb.includes('[sub]')) return { language: 'Japanese (English Sub)', status: 'verified' };
      if (channelName.toLowerCase().includes('muse') || channelName.toLowerCase().includes('ani-one')) return { language: 'Japanese (English Sub)', status: 'detected' };
      return { language: 'Unknown Audio', status: 'unknown' };
    }

    function matchTitle(videoTitle, candidates) {
      const cleanVideo = cleanText(videoTitle);
      const isFullEp = cleanVideo.includes('full episode') || cleanVideo.includes('episode') || cleanVideo.includes('ep ');
      for (const neg of NEGATIVE_KEYWORDS) {
        if (cleanVideo.includes(neg) && !isFullEp) return { match: false, ratio: 0 };
      }
      let bestRatio = 0.0;
      for (const cand of candidates) {
        if (!cand) continue;
        const cleanCand = cleanText(cand);
        if (!cleanCand || cleanCand.length < 3) continue;
        if (cleanVideo.includes(cleanCand)) return { match: true, ratio: 1.0 };
        const candTokens = cleanCand.split(' ').filter(w => w.length > 2);
        if (candTokens.length > 0) {
          const matched = candTokens.filter(tok => cleanVideo.includes(tok));
          const ratio = matched.length / candTokens.length;
          if (ratio > bestRatio) bestRatio = ratio;
        }
      }
      return { match: bestRatio >= 0.60, ratio: bestRatio };
    }

    (async () => {
      const titlesToMatch = [title, romaji].filter(Boolean);
      const discovered = [];
      const seen = new Set();

      // Record API search in quota tracker (Phase 14)
      QueueManager.recordSearch(animeId);

      for (const channel of APPROVED_CHANNELS) {
        try {
          const q = `${title} Episode`;
          const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.id}&q=${encodeURIComponent(q)}&type=video&regionCode=${regionCode}&videoEmbeddable=true&maxResults=15&key=${apiKey}`;
          const resRaw = await fetch(ytUrl);
          if (!resRaw.ok) continue;
          const data = await resRaw.json();
          const items = data.items || [];
          for (const item of items) {
            const vid = item.id?.videoId;
            if (!vid || seen.has(vid)) continue;
            const chId = item.snippet?.channelId;
            if (!APPROVED_SET.has(chId)) continue;
            const vTitle = item.snippet?.title || '';
            const { match, ratio } = matchTitle(vTitle, titlesToMatch);
            if (!match) continue;
            const ep = extractEp(vTitle, requestedEp);
            if (!ep) continue;

            seen.add(vid);

            // Compute match confidence score (Phase 8)
            let score = 0.35; // Approved channel
            if (ratio >= 0.8) score += 0.35; else score += 0.20;
            if (requestedEp !== null && ep === requestedEp) score += 0.15; else score += 0.10;
            score += 0.10; // Embeddable
            if (vTitle.toLowerCase().includes('official') || channel.name.includes('Muse') || channel.name.includes('Ani-One')) score += 0.05;
            const finalScore = Math.min(1.0, Math.round(score * 100) / 100);

            // Verification status gate (Phase 8 & 9)
            let verificationStatus = 'rejected';
            if (finalScore >= 0.85) {
              verificationStatus = 'verified';
            } else if (finalScore >= 0.60) {
              verificationStatus = 'pending';
            }

            const lang = detectLang(vTitle, channel.name);
            const epSeason = extractSeason(vTitle, season);

            discovered.push({
              anime_id: animeId,
              provider: 'youtube',
              channel_name: channel.name,
              channel_id: channel.id,
              video_id: vid,
              episode_number: ep,
              season_number: epSeason,
              language: lang.language,
              language_status: lang.status,
              region: channel.region || 'IN',
              is_official: true,
              is_embeddable: true,
              match_confidence: finalScore,
              verification_status: verificationStatus,
              source_url: `https://www.youtube.com/watch?v=${vid}`,
              video_title: vTitle,
              thumbnail_url: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '',
              verified_at: new Date().toISOString()
            });
          }
        } catch (e) {
          // Continue to next channel
        }
      }

      discovered.sort((a, b) => a.episode_number - b.episode_number);
      res.end(JSON.stringify({
        success: true,
        count: discovered.length,
        episodes: discovered,
        quotaUsedToday: QueueManager.getQuotaUsed()
      }));
    })().catch(err => {
      res.end(JSON.stringify({ success: false, error: err.message, episodes: [] }));
    });
    return;
  }

  // Queue an anime for background discovery (Phase 13 & 15)
  if (safePath === '/api/queue-anime' && req.method === 'POST') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    if (req.method === 'OPTIONS') { res.end(); return; }

    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const animeId = parseInt(payload.animeId, 10);
        const title = (payload.title || '').trim();
        const priority = parseInt(payload.priority || '2', 10);
        if (!animeId || !title) {
          res.end(JSON.stringify({ success: false, error: 'Valid animeId and title required.' }));
          return;
        }

        const queued = QueueManager.enqueue({ animeId, title, priority });
        res.end(JSON.stringify({
          success: true,
          message: `Anime "${title}" queued for official source discovery.`,
          queued
        }));
      } catch (e) {
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // Queue Status & Quota metrics endpoint (Phase 14)
  if (safePath === '/api/queue-status') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    });
    if (req.method === 'OPTIONS') { res.end(); return; }

    res.end(JSON.stringify({
      success: true,
      quotaUsedToday: QueueManager.getQuotaUsed(),
      quotaLimitDaily: QueueManager.QUOTA_DAILY_LIMIT,
      quotaResetTime: '00:00 UTC',
      queuedCount: QueueManager.queue.length,
      queue: QueueManager.queue.slice(0, 20),
      cooldownCount: QueueManager.cooldowns.size
    }));
    return;
  }

  // Admin Watch Sources API (Phase 9: Admin Watch Sources Page)
  if (safePath === '/api/admin/watch-sources') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    });
    if (req.method === 'OPTIONS') { res.end(); return; }

    const urlObj = new URL(req.url, 'http://localhost:' + PORT);
    const statusFilter = urlObj.searchParams.get('status') || 'ALL';
    const langFilter = urlObj.searchParams.get('language') || 'ALL';
    const searchQuery = (urlObj.searchParams.get('search') || '').toLowerCase();

    // Serve from in-memory / local admin store
    let sources = QueueManager.getAdminSources();

    if (statusFilter !== 'ALL') {
      sources = sources.filter(s => s.verification_status === statusFilter);
    }
    if (langFilter !== 'ALL') {
      sources = sources.filter(s => (s.language || '').toLowerCase().includes(langFilter.toLowerCase()));
    }
    if (searchQuery) {
      sources = sources.filter(s => 
        (s.video_title || '').toLowerCase().includes(searchQuery) ||
        String(s.anime_id) === searchQuery ||
        (s.channel_name || '').toLowerCase().includes(searchQuery)
      );
    }

    res.end(JSON.stringify({
      success: true,
      count: sources.length,
      sources
    }));
    return;
  }

  // Admin Verify / Reject / Edit Action (Phase 9)
  if (safePath === '/api/admin/verify-source' && req.method === 'POST') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    if (req.method === 'OPTIONS') { res.end(); return; }

    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { animeId, videoId, status, episodeNumber, seasonNumber, language } = payload;
        if (!videoId) {
          res.end(JSON.stringify({ success: false, error: 'Video ID required.' }));
          return;
        }

        const updated = QueueManager.updateAdminSource({
          animeId, videoId, status, episodeNumber, seasonNumber, language
        });

        res.end(JSON.stringify({
          success: true,
          message: `Source ${videoId} marked as ${status || 'updated'}!`,
          source: updated
        }));
      } catch (e) {
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // Admin Delete Source (Phase 9)
  if (safePath === '/api/admin/delete-source' && req.method === 'POST') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    if (req.method === 'OPTIONS') { res.end(); return; }

    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try {
        const { videoId } = JSON.parse(body || '{}');
        QueueManager.deleteAdminSource(videoId);
        res.end(JSON.stringify({ success: true, message: `Source ${videoId} deleted.` }));
      } catch (e) {
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA Fallback to index.html if needed
      fs.readFile(path.join(__dirname, 'index.html'), (err2, indexData) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(indexData);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error');
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`AnimeVerse live preview server running at http://localhost:${PORT}/`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const fallbackPort = PORT + 1;
    console.log(`Port ${PORT} in use, trying http://localhost:${fallbackPort}/...`);
    server.listen(fallbackPort);
  } else {
    console.error('Server error:', err);
  }
});
