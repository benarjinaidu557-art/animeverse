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
    })),
    // Classroom of the Elite Season 1 (AniList ID: 98659) - Muse India Telugu Dub
    ...[
      { ep: 1, id: 'QbEoZexESDs', title: '[Telugu Dub] Classroom of the Elite - Episode 01 | Muse IN' },
      { ep: 2, id: '4_Vumu_418c', title: '[Telugu Dub] Classroom of the Elite - Episode 02 | Muse IN' },
      { ep: 3, id: 'GsiZwUXsRHE', title: '[Telugu Dub] Classroom of the Elite - Episode 03 | Muse IN' },
      { ep: 4, id: '8Pm5E2jgZ8c', title: '[Telugu Dub] Classroom of the Elite - Episode 04 | Muse IN' },
      { ep: 5, id: '7ISj1vIzepE', title: '[Telugu Dub] Classroom of the Elite - Episode 05 | Muse IN' },
      { ep: 6, id: 'i5xBc-uyMxQ', title: '[Telugu Dub] Classroom of the Elite - Episode 06 | Muse IN' },
      { ep: 7, id: 'ZthaFVaevd8', title: '[Telugu Dub] Classroom of the Elite - Episode 07 | Muse IN' },
      { ep: 8, id: 'NRELz5z3t2U', title: '[Telugu Dub] Classroom of the Elite - Episode 08 | Muse IN' },
      { ep: 9, id: 'qrkaUnbHzHA', title: '[Telugu Dub] Classroom of the Elite - Episode 09 | Muse IN' },
      { ep: 10, id: 'gU24L5IFJ3c', title: '[Telugu Dub] Classroom of the Elite - Episode 10 | Muse IN' },
      { ep: 11, id: 'hUqm7vUXHSc', title: '[Telugu Dub] Classroom of the Elite - Episode 11 | Muse IN' },
      { ep: 12, id: 'CjQ6DQiMfM0', title: '[Telugu Dub] Classroom of the Elite - Episode 12 | Muse IN' }
    ].map(item => ({
      anime_id: 98659,
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
    // Classroom of the Elite Season 2 (AniList IDs: 98659 S2 / 145545) - Muse India Telugu Dub
    ...[
      { ep: 1, id: '7rjglJxtyHk', title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 01 | Muse IN' },
      { ep: 2, id: 'Oq-FBwiXCjQ', title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 02 | Muse IN' },
      { ep: 3, id: 'vNITI_aPWJs', title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 03 | Muse IN' },
      { ep: 4, id: 'FE-eHl8QEI0', title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 04 | Muse IN' },
      { ep: 5, id: 'hK70OIqRABk', title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 05 | Muse IN' },
      { ep: 6, id: 'VDyo1ujH1BY', title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 06 | Muse IN' },
      { ep: 7, id: 't_3pPFBdu9Y', title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 07 | Muse IN' },
      { ep: 8, id: '5AlKZkK12Vg', title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 08 | Muse IN' },
      { ep: 9, id: 'cc4BMOnupSU', title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 09 | Muse IN' },
      { ep: 10, id: '05QnYKBDggw', title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 10 | Muse IN' },
      { ep: 11, id: 'k6-R1GFbprY', title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 11 | Muse IN' },
      { ep: 12, id: '5tuh9rNWPWU', title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 12 | Muse IN' },
      { ep: 13, id: 'vBt22eQLwIk', title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 13 | Muse IN' }
    ].flatMap(item => [
      {
        anime_id: 98659,
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
      },
      {
        anime_id: 145545,
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
      }
    ]),
    // Classroom of the Elite Season 3 (AniList IDs: 98659 S3 / 146066) - Muse India Telugu Dub
    ...[
      { ep: 1, id: '6c9qyEZ-OZA', title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 01 | Muse IN' },
      { ep: 2, id: 'GAa3E2_CSOo', title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 02 | Muse IN' },
      { ep: 3, id: 'KESuIGZtivM', title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 03 | Muse IN' },
      { ep: 4, id: 'XW63UzZ9C5c', title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 04 | Muse IN' },
      { ep: 5, id: 'he8pzJTFJ5Y', title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 05 | Muse IN' },
      { ep: 6, id: '2YltBNwWXSI', title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 06 | Muse IN' },
      { ep: 7, id: 'vA9Gi78vSeI', title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 07 | Muse IN' },
      { ep: 8, id: '5NgBWIsXGec', title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 08 | Muse IN' },
      { ep: 9, id: 'gp75yk7vnOo', title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 09 | Muse IN' },
      { ep: 10, id: '8diL300WGmA', title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 10 | Muse IN' },
      { ep: 11, id: 'JxknpSNMyeI', title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 11 | Muse IN' },
      { ep: 12, id: '5q1ObyClTt0', title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 12 | Muse IN' },
      { ep: 13, id: 'tgvZMyNMoE4', title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 13 | Muse IN' }
    ].flatMap(item => [
      {
        anime_id: 98659,
        provider: 'youtube',
        channel_name: 'Muse India',
        channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
        video_id: item.id,
        episode_number: item.ep,
        season_number: 3,
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
      },
      {
        anime_id: 146066,
        provider: 'youtube',
        channel_name: 'Muse India',
        channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
        video_id: item.id,
        episode_number: item.ep,
        season_number: 3,
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
      }
    ]),

    // ── MUSE INDIA – Hindi Dub ────────────────────────────────────────────
    // Campfire Cooking in Another World S2 (170577)
    ...[ { ep:10, id:'PMWRiVpmNGE', title:'Campfire Cooking Another World S2 - Ep 10 [Hindi Dub] | Muse India' } ]
      .map(item => ({ anime_id:170577, provider:'youtube', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', video_id:item.id, episode_number:item.ep, season_number:2, language:'Hindi Dub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // JoJo Diamond is Unbreakable (21450)
    ...[ { ep:18, id:'n-ltlTbL4xA', title:"JoJo Diamond is Unbreakable - Ep 18 [Hindi Dub] | Muse India" } ]
      .map(item => ({ anime_id:21450, provider:'youtube', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', video_id:item.id, episode_number:item.ep, season_number:3, language:'Hindi Dub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // JoJo Stardust Crusaders (20474)
    ...[ { ep:35, id:'0-Es7KTS6Kk', title:"JoJo Stardust Crusaders - Ep 35 [Hindi Dub] | Muse India" } ]
      .map(item => ({ anime_id:20474, provider:'youtube', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', video_id:item.id, episode_number:item.ep, season_number:2, language:'Hindi Dub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // Mushoku Tensei S1 (108465)
    ...[ { ep:1, id:'_eP2RM7FGK0', title:'Mushoku Tensei S1 - Ep 01 [Hindi Dub] | Muse India' }, { ep:13, id:'8n_YkGlGtO0', title:'Mushoku Tensei S1 - Ep 13 [Hindi Dub] | Muse India' } ]
      .map(item => ({ anime_id:108465, provider:'youtube', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', video_id:item.id, episode_number:item.ep, season_number:1, language:'Hindi Dub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // Iruma-kun S2 (116338)
    ...[ { ep:3, id:'25tbTeNehEo', title:'Welcome to Demon School Iruma-kun S2 - Ep 03 [Hindi Dub] | Muse India' } ]
      .map(item => ({ anime_id:116338, provider:'youtube', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', video_id:item.id, episode_number:item.ep, season_number:2, language:'Hindi Dub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // Mob Psycho 100 S1 (21507) Hindi Dub
    ...[ { ep:1, id:'eZ_rS0vj2Hg', title:'Mob Psycho 100 - Ep 01 [Hindi Dub] | Muse India' }, { ep:6, id:'SqaDcusgyus', title:'Mob Psycho 100 - Ep 06 [Hindi Dub] | Muse India' } ]
      .map(item => ({ anime_id:21507, provider:'youtube', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', video_id:item.id, episode_number:item.ep, season_number:1, language:'Hindi Dub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // SPY x FAMILY S1 (140960) Hindi Dub
    ...[ { ep:1, id:'dXgq4u3ViFs' }, { ep:5, id:'OK6snKUKrDk' }, { ep:6, id:'JbDbnNH80aY' }, { ep:8, id:'VdScGKEqFE4' }, { ep:10, id:'gHz80IzDPTg' }, { ep:11, id:'9d40pUJkT44' }, { ep:13, id:'amA7-O5rda8' }, { ep:17, id:'Y-OPiKqESPo' }, { ep:18, id:'LzWejVIkjx0' }, { ep:26, id:'bPmXgbo7E6Q' } ]
      .map(item => ({ anime_id:140960, provider:'youtube', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', video_id:item.id, episode_number:item.ep, season_number:1, language:'Hindi Dub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:`SPY x FAMILY - Ep ${String(item.ep).padStart(2,'0')} [Hindi Dub] | Muse India`, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // SPY x FAMILY Season 3 (177937) Hindi Dub
    ...[ { ep:1, id:'UK1MeqNV4q4', title:'SPY x FAMILY Season 3 - Ep 01 [Hindi Dub] | Muse India' } ]
      .map(item => ({ anime_id:177937, provider:'youtube', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', video_id:item.id, episode_number:item.ep, season_number:3, language:'Hindi Dub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // Fairy Tail Final Series (99749) Hindi Dub
    ...[ { ep:51, id:'NeNvy0kKWHI', title:'Fairy Tail - Ep 51 [Hindi Dub] | Muse India' } ]
      .map(item => ({ anime_id:99749, provider:'youtube', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', video_id:item.id, episode_number:item.ep, season_number:1, language:'Hindi Dub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // I Parry Everything S1 (170695) Hindi Dub
    ...[ { ep:1, id:'rtTndsda8G0', title:'I Parry Everything - Ep 01 [Hindi Dub] | Muse India' } ]
      .map(item => ({ anime_id:170695, provider:'youtube', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', video_id:item.id, episode_number:item.ep, season_number:1, language:'Hindi Dub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // ── ANI-ONE INDIA ────────────────────────────────────────────────────
    // MAO (196012)
    ...[ { ep:1, id:'R9bVYJXvkoA' }, { ep:2, id:'vazOjW2h1yg' } ]
      .map(item => ({ anime_id:196012, provider:'youtube', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', video_id:item.id, episode_number:item.ep, season_number:1, language:'English Sub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:`MAO - Ep ${String(item.ep).padStart(2,'0')} [English Sub] | Ani-One India`, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // Love Unseen Beneath the Clear Night Sky (202269)
    ...[ { ep:1, id:'_x1CRDyoeS8', title:'Love Unseen Beneath the Clear Night Sky - Ep 01 [English Sub] | Ani-One India' } ]
      .map(item => ({ anime_id:202269, provider:'youtube', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', video_id:item.id, episode_number:item.ep, season_number:1, language:'English Sub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // Monster Eater (210234)
    ...[ { ep:1, id:'IIxKo-i9C8c', title:'Monster Eater - Ep 01 [English Sub] | Ani-One India' } ]
      .map(item => ({ anime_id:210234, provider:'youtube', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', video_id:item.id, episode_number:item.ep, season_number:1, language:'English Sub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // Yowayowa Sensei (185211)
    ...[ { ep:1, id:'cv55c6bTfew' }, { ep:2, id:'P9vJ_Ht9Snw' } ]
      .map(item => ({ anime_id:185211, provider:'youtube', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', video_id:item.id, episode_number:item.ep, season_number:1, language:'English Sub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:`Yowayowa Sensei - Ep ${String(item.ep).padStart(2,'0')} [English Sub] | Ani-One India`, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // Jujutsu Kaisen S1 (113415) English Sub + Hindi Dub
    ...[ { ep:1, id:'K6rA6oTR8wo', lang:'English Sub' }, { ep:1, id:'1Id_f3GDlus', lang:'Hindi Dub' } ]
      .map(item => ({ anime_id:113415, provider:'youtube', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', video_id:item.id, episode_number:item.ep, season_number:1, language:item.lang, language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:`Jujutsu Kaisen - Ep 01 [${item.lang}] | Ani-One India`, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // Petals of Reincarnation (179950)
    ...[ { ep:1, id:'7i7HAo0WyhE' }, { ep:2, id:'HjZ5YsjXqLs' } ]
      .map(item => ({ anime_id:179950, provider:'youtube', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', video_id:item.id, episode_number:item.ep, season_number:1, language:'English Sub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:`Petals of Reincarnation - Ep ${String(item.ep).padStart(2,'0')} [English Sub] | Ani-One India`, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // Rooster Fighter (179813)
    ...[ { ep:1, id:'q3tX9bBVwOY', title:'Rooster Fighter - Ep 01 [English Sub] | Ani-One India' } ]
      .map(item => ({ anime_id:179813, provider:'youtube', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', video_id:item.id, episode_number:item.ep, season_number:1, language:'English Sub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // You and I Are Polar Opposites (184951)
    ...[ { ep:1, id:'2SO5ifnfoUQ' }, { ep:2, id:'2osZnuKWhAQ' } ]
      .map(item => ({ anime_id:184951, provider:'youtube', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', video_id:item.id, episode_number:item.ep, season_number:1, language:'English Sub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:`You and I Are Polar Opposites - Ep ${String(item.ep).padStart(2,'0')} [English Sub] | Ani-One India`, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // I Saved Myself with a Potion (198561)
    ...[ { ep:1, id:'ALnSALXMguY', title:'I Saved Myself with a Potion! - Ep 01 [English Sub] | Ani-One India' } ]
      .map(item => ({ anime_id:198561, provider:'youtube', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', video_id:item.id, episode_number:item.ep, season_number:1, language:'English Sub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // Gintama Mr. Ginpachi (918)
    ...[ { ep:1, id:'WMpGo0QWFy4', title:"Gintama: Mr. Ginpachi's Zany Class - Ep 01 [English Sub] | Ani-One India" } ]
      .map(item => ({ anime_id:918, provider:'youtube', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', video_id:item.id, episode_number:item.ep, season_number:1, language:'English Sub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // Overlord S1 (20832) Hindi Dub
    ...[ { ep:1, id:'xA69sCrsyto', title:'Overlord - Ep 01 [Hindi Dub] | Ani-One India' } ]
      .map(item => ({ anime_id:20832, provider:'youtube', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', video_id:item.id, episode_number:item.ep, season_number:1, language:'Hindi Dub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // Blue Lock S1 (137822) Hindi Dub
    ...[ { ep:1, id:'-7AD70jdntE', title:'Blue Lock - Ep 01 [Hindi Dub] | Ani-One India' } ]
      .map(item => ({ anime_id:137822, provider:'youtube', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', video_id:item.id, episode_number:item.ep, season_number:1, language:'Hindi Dub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // ── MUSE ASIA – English Sub ──────────────────────────────────────────
    // Attack on Titan Final Season P1 (110277)
    ...[ { ep:10, id:'YY-yEkvC3Z4', title:'Attack on Titan Final Season - Ep 10 [English Sub] | Muse Asia' } ]
      .map(item => ({ anime_id:110277, provider:'youtube', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', video_id:item.id, episode_number:item.ep, season_number:4, language:'English Sub', language_status:'verified', region:'AS', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // Attack on Titan Season 2 (20958)
    ...[ { ep:3, id:'gvtogj95A04', title:'Attack on Titan Season 2 - Ep 03 [English Sub] | Muse Asia' } ]
      .map(item => ({ anime_id:20958, provider:'youtube', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', video_id:item.id, episode_number:item.ep, season_number:2, language:'English Sub', language_status:'verified', region:'AS', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // Fairy Tail Final Series (99749) English Sub (Muse Asia)
    ...[ { ep:34, id:'-MoqYVmwl_8' }, { ep:45, id:'jKrujeN3C9I' }, { ep:50, id:'2PH2USWESls' } ]
      .map(item => ({ anime_id:99749, provider:'youtube', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', video_id:item.id, episode_number:item.ep, season_number:1, language:'English Sub', language_status:'verified', region:'AS', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:`Fairy Tail - Ep ${String(item.ep).padStart(2,'0')} [English Sub] | Muse Asia`, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // ── Attack on Titan OAD (18397) ──────────────────────────────────────
    ...[ { ep:1, id:'0Vi_p1u_hz4', title:'【Complete Series】 Attack on Titan OAD - Episodes 1-8 [English Sub] | Muse Asia' } ]
      .map(item => ({ anime_id:18397, provider:'youtube', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', video_id:item.id, episode_number:item.ep, season_number:1, language:'English Sub', language_status:'verified', region:'UNKNOWN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // ── That Time I Got Reincarnated as a Slime S1 (101280) ──────────────
    ...[ { ep:1, id:'SAWLaMhL6YI', title:'【Complete Series】 That Time I Got Reincarnated as a Slime Season 1 - Episodes 1-24.5 [English Sub] | Muse Asia' } ]
      .map(item => ({ anime_id:101280, provider:'youtube', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', video_id:item.id, episode_number:item.ep, season_number:1, language:'English Sub', language_status:'verified', region:'UNKNOWN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // ── That Time I Got Reincarnated as a Slime S3 (146234) ──────────────
    ...[ { ep:49, id:'OSTfcFan8_Q', title:'【Complete Series】 That Time I Got Reincarnated as a Slime Season 3 - Episodes 49-72 [English Sub] | Muse Asia' } ]
      .map(item => ({ anime_id:146234, provider:'youtube', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', video_id:item.id, episode_number:item.ep, season_number:3, language:'English Sub', language_status:'verified', region:'UNKNOWN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // ── That Time I Got Reincarnated as a Slime: Visions of Coleus (161802) ─
    ...[ { ep:1, id:'ld0E74QvBHg', title:'【Complete Series】 That Time I Got Reincarnated as a Slime: Visions of Coleus - OVAs 1-3 [English Sub] | Muse Asia' } ]
      .map(item => ({ anime_id:161802, provider:'youtube', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', video_id:item.id, episode_number:item.ep, season_number:1, language:'English Sub', language_status:'verified', region:'UNKNOWN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // ── Jujutsu Kaisen: The Culling Game Part 1 (209895) ─────────────────
    ...[ { ep:1, id:'VFfvPd1V3RI', title:'Jujutsu Kaisen: The Culling Game Part 1 - Episodes 1-2 [English Sub / Japanese Audio] | Ani-One Asia' } ]
      .map(item => ({ anime_id:209895, provider:'youtube', channel_name:'Ani-One Asia', channel_id:'UC0wNSTMWIL3qaorLx0jie6A', video_id:item.id, episode_number:item.ep, season_number:3, language:'English Sub / Japanese Audio', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),
    // ── No Guns Life (112479)
    ...[ {"anime_id":112479,"provider":"youtube","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","video_id":"fQYY58cWoLU","episode_number":22,"season_number":2,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"No Guns Life Season 2 - Episode 22 [English Sub] | Muse Asia","source_url":"https://www.youtube.com/watch?v=fQYY58cWoLU","verified_at":"2026-09-21T12:40:37.620Z"} ],
    // ── Welcome to Demon School! Iruma-kun (139092)
    ...[ {"anime_id":139092,"provider":"youtube","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","video_id":"e036xcDVqCg","episode_number":1,"season_number":3,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Welcome to Demon School! Iruma-kun Season 3 - Episode 01 [English Sub] | Muse Asia","source_url":"https://www.youtube.com/watch?v=e036xcDVqCg","verified_at":"2026-09-21T12:40:37.620Z"} ],
    // ── High School Prodigies Have It Easy Even in Another World! (108388)
    ...[ {"anime_id":108388,"provider":"youtube","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","video_id":"-Exy055I760","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"High School Prodigies Have It Easy Even in Another World! - Episode 01 [English Sub] | Muse Asia","source_url":"https://www.youtube.com/watch?v=-Exy055I760","verified_at":"2026-09-21T12:40:37.621Z"} ],
    // ── The World's Finest Assassin Gets Reincarnated in Another World as an Aristocrat (129898)
    ...[ {"anime_id":129898,"provider":"youtube","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","video_id":"pxWHOVY4ixM","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"The World's Finest Assassin Gets Reincarnated in Another World as an Aristocrat - Episode 01 [English Sub] | Muse Asia","source_url":"https://www.youtube.com/watch?v=pxWHOVY4ixM","verified_at":"2026-09-21T12:40:37.621Z"} ],
    // ── Zom 100: Bucket List of the Dead (159831)
    ...[ {"anime_id":159831,"provider":"youtube","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","video_id":"QKSyhtWIu4E","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Zom 100: Bucket List of the Dead - Episode 01 [English Sub] | Muse Asia","source_url":"https://www.youtube.com/watch?v=QKSyhtWIu4E","verified_at":"2026-09-21T12:40:37.621Z"} ],
    // ── Black Summoner (145260)
    ...[ {"anime_id":145260,"provider":"youtube","channel_name":"Ani-One India","channel_id":"UC67pLBZ_z4Gd46t6mW7uHjA","video_id":"N5u6BGzi6Hc","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Black Summoner - Episode 01 [English Sub] | Ani-One India","source_url":"https://www.youtube.com/watch?v=N5u6BGzi6Hc","verified_at":"2026-09-21T12:40:37.621Z"} ],
    // ── Orange (21647)
    ...[ {"anime_id":21647,"provider":"youtube","channel_name":"Ani-One India","channel_id":"UC67pLBZ_z4Gd46t6mW7uHjA","video_id":"kSfgo_VS4U4","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Orange - Episode 01 [English Sub] | Ani-One India","source_url":"https://www.youtube.com/watch?v=kSfgo_VS4U4","verified_at":"2026-09-21T12:40:37.621Z"} ],
    // ── I Have a Crush at Work (179469)
    ...[ {"anime_id":179469,"provider":"youtube","channel_name":"Ani-One India","channel_id":"UC67pLBZ_z4Gd46t6mW7uHjA","video_id":"qGxNmvNfYuI","episode_number":1,"season_number":1,"language":"Japanese (Audio) / Hindi (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"I Have a Crush at Work - Episode 01 [Hindi Subs] | Ani-One India","source_url":"https://www.youtube.com/watch?v=qGxNmvNfYuI","verified_at":"2026-09-21T12:40:37.621Z"} ],
    // ── Takopi's Original Sin (142167)
    ...[ {"anime_id":142167,"provider":"youtube","channel_name":"Ani-One India","channel_id":"UC67pLBZ_z4Gd46t6mW7uHjA","video_id":"tAryFRAwaiI","episode_number":1,"season_number":1,"language":"Hindi (Dub) / Japanese (Audio)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Takopi's Original Sin - Special [Hindi Dub] | Ani-One India","source_url":"https://www.youtube.com/watch?v=tAryFRAwaiI","verified_at":"2026-09-21T12:40:37.621Z"} ],
    // ── Bananya (21704)
    ...[ {"anime_id":21704,"provider":"youtube","channel_name":"Ani-One India","channel_id":"UC67pLBZ_z4Gd46t6mW7uHjA","video_id":"PLJXdNaZoFxg4","episode_number":1,"season_number":3,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Bananya Season 3 Official Series Playlist | Ani-One India","source_url":"https://www.youtube.com/playlist?list=PLJXdNaZoFxg4","verified_at":"2026-09-21T12:40:37.621Z","playlist_id":"PLJXdNaZoFxg4"} ],
    // ── Mieruko-chan (131083)
    ...[ {"anime_id":131083,"provider":"youtube","channel_name":"Muse India","channel_id":"UCYYhAzgWuxPauRXdPpLAX3Q","video_id":"PLu5Gdt_rQOajtocUx9ADAWEENJbp5tQje","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Mieruko-chan - Episodes 1-12 Official Playlist | Muse India","source_url":"https://www.youtube.com/playlist?list=PLu5Gdt_rQOajtocUx9ADAWEENJbp5tQje","verified_at":"2026-09-21T12:40:37.621Z","playlist_id":"PLu5Gdt_rQOajtocUx9ADAWEENJbp5tQje"} ],
    // ── Muv-Luv Alternative (112716)
    ...[ {"anime_id":112716,"provider":"youtube","channel_name":"Muse India","channel_id":"UCYYhAzgWuxPauRXdPpLAX3Q","video_id":"PLpm1VVK4UL16nFFYSdZL9s_v6s9XMS4Sh","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Muv-Luv Alternative Official Series Playlist | Muse India","source_url":"https://www.youtube.com/playlist?list=PLpm1VVK4UL16nFFYSdZL9s_v6s9XMS4Sh","verified_at":"2026-09-21T12:40:37.621Z","playlist_id":"PLpm1VVK4UL16nFFYSdZL9s_v6s9XMS4Sh"} ],
    // ── Dan Da Dan (171018)
    ...[ {"anime_id":171018,"provider":"youtube","channel_name":"Muse India","channel_id":"UCYYhAzgWuxPauRXdPpLAX3Q","video_id":"PL8JcwZhNnDt-FSi4JAfJ0uftL8Rgrl4VE","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Dan Da Dan Official Simulcast Playlist | Muse India","source_url":"https://www.youtube.com/playlist?list=PL8JcwZhNnDt-FSi4JAfJ0uftL8Rgrl4VE","verified_at":"2026-09-21T12:40:37.621Z","playlist_id":"PL8JcwZhNnDt-FSi4JAfJ0uftL8Rgrl4VE"} ],
    // ── Assassination Classroom (20755)
    ...[ {"anime_id":20755,"provider":"youtube","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","video_id":"PLhQ8l_I8PMhWTexk0ylxeHHX2JN_2R3KE","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Assassination Classroom Official Playlist | Muse Asia","source_url":"https://www.youtube.com/playlist?list=PLhQ8l_I8PMhWTexk0ylxeHHX2JN_2R3KE","verified_at":"2026-09-21T12:40:37.622Z","playlist_id":"PLhQ8l_I8PMhWTexk0ylxeHHX2JN_2R3KE"} ],
    // ── The Seven Deadly Sins (20705)
    ...[ {"anime_id":20705,"provider":"youtube","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","video_id":"PLwLSw1_eDZl3572W1HJjIkZyW-0GGVUVq","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"The Seven Deadly Sins Official Playlist | Muse Asia","source_url":"https://www.youtube.com/playlist?list=PLwLSw1_eDZl3572W1HJjIkZyW-0GGVUVq","verified_at":"2026-09-21T12:40:37.622Z","playlist_id":"PLwLSw1_eDZl3572W1HJjIkZyW-0GGVUVq"} ],
    // ── Goblin Slayer (101165)
    ...[ {"anime_id":101165,"provider":"youtube","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","video_id":"PL-GaNUkRWlEO8SB6EX-3YYoYz1ZbVP-UK","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Goblin Slayer Seasons 1-2 Official Playlist | Muse Asia","source_url":"https://www.youtube.com/playlist?list=PL-GaNUkRWlEO8SB6EX-3YYoYz1ZbVP-UK","verified_at":"2026-09-21T12:40:37.622Z","playlist_id":"PL-GaNUkRWlEO8SB6EX-3YYoYz1ZbVP-UK"} ],
    // ── Hunter x Hunter (2011) (11061)
    ...[ {"anime_id":11061,"provider":"youtube","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","video_id":"PLEBfWuM_iGbI","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Hunter x Hunter (2011) Official Series Playlist | Muse Asia","source_url":"https://www.youtube.com/playlist?list=PLEBfWuM_iGbI","verified_at":"2026-09-21T12:40:37.622Z","playlist_id":"PLEBfWuM_iGbI"} ],
    // ── Tada Never Falls In Love (100179)
    ...[ {"anime_id":100179,"provider":"youtube","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","video_id":"PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Tada Never Falls In Love - Episodes 1-13 Official Playlist | Muse Asia","source_url":"https://www.youtube.com/playlist?list=PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e","verified_at":"2026-09-21T12:40:37.622Z","playlist_id":"PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e"} ],
    // ── Kuma Kuma Kuma Bear (114340)
    ...[ {"anime_id":114340,"provider":"youtube","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","video_id":"PLwLSw1_eDZl0zRE6T4CdrulzxXZgdRGLr","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Kuma Kuma Kuma Bear - Episodes 1-12 Official Playlist | Muse Asia","source_url":"https://www.youtube.com/playlist?list=PLwLSw1_eDZl0zRE6T4CdrulzxXZgdRGLr","verified_at":"2026-09-21T12:40:37.622Z","playlist_id":"PLwLSw1_eDZl0zRE6T4CdrulzxXZgdRGLr"} ],
    // ── The Unwanted Undead Adventurer (147642)
    ...[ {"anime_id":147642,"provider":"youtube","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","video_id":"PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"The Unwanted Undead Adventurer - Episodes 1-12 Official Playlist | Muse Asia","source_url":"https://www.youtube.com/playlist?list=PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS","verified_at":"2026-09-21T12:40:37.622Z","playlist_id":"PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS"} ],
    // ── Berserk of Gluttony (156039)
    ...[ {"anime_id":156039,"provider":"youtube","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","video_id":"PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Berserk of Gluttony - Episodes 1-12 Official Playlist | Muse Asia","source_url":"https://www.youtube.com/playlist?list=PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS","verified_at":"2026-09-21T12:40:37.622Z","playlist_id":"PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS"} ],
    // ── Mushoku Tensei: Jobless Reincarnation (108465)
    ...[ {"anime_id":108465,"provider":"youtube","channel_name":"Muse India","channel_id":"UCYYhAzgWuxPauRXdPpLAX3Q","video_id":"PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS","episode_number":1,"season_number":1,"language":"Hindi (Dub) / Japanese (Audio)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Mushoku Tensei: Jobless Reincarnation - Episodes 1-11 [Hindi Dub] Official Playlist | Muse India","source_url":"https://www.youtube.com/playlist?list=PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS","verified_at":"2026-09-21T12:40:37.622Z","playlist_id":"PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS"} ],
    // ── Tokyo Revengers (120120)
    ...[ {"anime_id":120120,"provider":"youtube","channel_name":"Muse India","channel_id":"UCYYhAzgWuxPauRXdPpLAX3Q","video_id":"PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS","episode_number":1,"season_number":1,"language":"Hindi (Dub) / Japanese (Audio)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Tokyo Revengers - Episodes 1-24 [Hindi Dub] Official Playlist | Muse India","source_url":"https://www.youtube.com/playlist?list=PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS","verified_at":"2026-09-21T12:40:37.622Z","playlist_id":"PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS"} ],
    // ── The Familiar of Zero (1195)
    ...[ {"anime_id":1195,"provider":"youtube","channel_name":"Muse India","channel_id":"UCYYhAzgWuxPauRXdPpLAX3Q","video_id":"PLpm1VVK4UL14oNTr6vx9KieQ6-YkKn0qt","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"The Familiar of Zero Official Series Playlist | Muse India","source_url":"https://www.youtube.com/playlist?list=PLpm1VVK4UL14oNTr6vx9KieQ6-YkKn0qt","verified_at":"2026-09-21T12:40:37.622Z","playlist_id":"PLpm1VVK4UL14oNTr6vx9KieQ6-YkKn0qt"} ],
    // ── Is the Order a Rabbit? (20517)
    ...[ {"anime_id":20517,"provider":"youtube","channel_name":"Muse India","channel_id":"UCYYhAzgWuxPauRXdPpLAX3Q","video_id":"PLpm1VVK4UL14aFCVvKtSODEQclbYeEpfL","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Is the Order a Rabbit? Official Series Playlist | Muse India","source_url":"https://www.youtube.com/playlist?list=PLpm1VVK4UL14aFCVvKtSODEQclbYeEpfL","verified_at":"2026-09-21T12:40:37.622Z","playlist_id":"PLpm1VVK4UL14aFCVvKtSODEQclbYeEpfL"} ],
    // ── JoJo's Bizarre Adventure (14719)
    ...[ {"anime_id":14719,"provider":"youtube","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","video_id":"PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"JoJo's Bizarre Adventure Marathon Official Playlist | Muse Asia","source_url":"https://www.youtube.com/playlist?list=PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e","verified_at":"2026-09-21T12:40:37.622Z","playlist_id":"PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e"} ],
    // ── That Time I Got Reincarnated as a Slime (101280)
    ...[ {"anime_id":101280,"provider":"youtube","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","video_id":"UUGbshtvS9t-8CW11W7TooQg","episode_number":93,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"That Time I Got Reincarnated as a Slime - Episode 93 / Uploads | Muse Asia","source_url":"https://www.youtube.com/playlist?list=UUGbshtvS9t-8CW11W7TooQg","verified_at":"2026-09-21T12:40:37.622Z","playlist_id":"UUGbshtvS9t-8CW11W7TooQg"} ],
    // ── Chained Soldier (141821)
    ...[ {"anime_id":141821,"provider":"youtube","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","video_id":"PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Chained Soldier Official Series Playlist | Muse Asia","source_url":"https://www.youtube.com/playlist?list=PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e","verified_at":"2026-09-21T12:40:37.622Z","playlist_id":"PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e"} ],
    // ── Tadaima, Okaeri (169698)
    ...[ {"anime_id":169698,"provider":"youtube","channel_name":"Ani-One Asia","channel_id":"UC0wNSTMWIL3qaorLx0jie6A","video_id":"PLrC7aRkKhpGNqrVSM8mpTLP7KWyFnx6Es","episode_number":1,"season_number":1,"language":"Japanese (Audio) / English (Subs)","language_status":"verified","region":"IN","is_official":true,"is_embeddable":true,"match_confidence":1,"verification_status":"verified","video_title":"Tadaima, Okaeri Official Series Playlist | Ani-One Asia","source_url":"https://www.youtube.com/playlist?list=PLrC7aRkKhpGNqrVSM8mpTLP7KWyFnx6Es","verified_at":"2026-09-21T12:40:37.622Z","playlist_id":"PLrC7aRkKhpGNqrVSM8mpTLP7KWyFnx6Es"} ],

    // ── Batch 2 – Specific video IDs ──────────────────────────────────────────
    // Mobile Suit Gundam: The Witch from Mercury (139274) – GundamInfo Official
    ...[ { ep:1, id:'5YGW2JRxWUU', title:'Mobile Suit Gundam: The Witch from Mercury - Prologue [English Sub] | GundamInfo' } ]
      .map(item => ({ anime_id:139274, provider:'youtube', channel_name:'GundamInfo', channel_id:'UCejtDitHgH44NeS5aGBA8KA', video_id:item.id, episode_number:item.ep, season_number:1, language:'English Sub / Japanese Audio', language_status:'verified', region:'GLOBAL', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // Pokémon: Diamond and Pearl (1564) – The Official Pokémon Channel
    ...[ { ep:1, id:'niR483he2kg', title:'Pokémon: Diamond and Pearl - Ep 01 | The Official Pokémon Channel' } ]
      .map(item => ({ anime_id:1564, provider:'youtube', channel_name:'The Official Pokémon Channel', channel_id:'UCFctji4JExS8D577WV3aWpA', video_id:item.id, episode_number:item.ep, season_number:10, language:'English Dub', language_status:'verified', region:'GLOBAL', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() })),

    // SPY×FAMILY S2 (158927) – Muse India Hindi Dub
    ...[ { ep:1, id:'dXgq4u3ViFs', title:'SPY x FAMILY Season 2 - Ep 01 [Hindi Dub] | Muse India' } ]
      .map(item => ({ anime_id:158927, provider:'youtube', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', video_id:item.id, episode_number:item.ep, season_number:2, language:'Hindi Dub', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:0.9, verification_status:'verified', video_title:item.title, source_url:`https://www.youtube.com/watch?v=${item.id}`, verified_at:new Date().toISOString() }))
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

  updateAdminSource({ animeId, videoId, status, episodeNumber, seasonNumber, language, channelName, channelId, videoTitle, region, isOfficial, isEmbeddable, matchConfidence }) {
    let item = this.adminSources.find(s => s.video_id === videoId && (!animeId || s.anime_id === Number(animeId)));
    if (!item) {
      item = {
        anime_id: Number(animeId) || 0,
        provider: 'youtube',
        channel_name: channelName || 'Official Licensor',
        channel_id: channelId || 'OFFICIAL_CHANNEL',
        video_id: videoId,
        episode_number: Number(episodeNumber) || 1,
        season_number: Number(seasonNumber) || 1,
        language: language || 'Japanese (English Sub)',
        language_status: 'verified',
        region: region || 'IN',
        is_official: isOfficial !== undefined ? isOfficial : true,
        is_embeddable: isEmbeddable !== undefined ? isEmbeddable : true,
        match_confidence: matchConfidence !== undefined ? matchConfidence : 1.0,
        verification_status: status || 'verified',
        source_url: `https://www.youtube.com/watch?v=${videoId}`,
        video_title: videoTitle || `Episode ${episodeNumber || 1}`,
        verified_at: new Date().toISOString()
      };
      this.adminSources.push(item);
    } else {
      if (status) item.verification_status = status;
      if (episodeNumber) item.episode_number = Number(episodeNumber);
      if (seasonNumber) item.season_number = Number(seasonNumber);
      if (language) item.language = language;
      if (videoTitle) item.video_title = videoTitle;
      if (channelName) item.channel_name = channelName;
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

    const requestedLang = (urlObj.searchParams.get('language') || '').trim();

    const APPROVED_CHANNELS = [
      { id: 'UCYYhAzgWuxPauRXdPpLAX3Q', name: 'Muse India', region: 'IN' },
      { id: 'UC67pLBZ_z4Gd46t6mW7uHjA', name: 'Ani-One India', region: 'IN' },
      { id: 'UCGbshtvS9t-8CW11W7TooQg', name: 'Muse Asia', region: 'IN' },
      { id: 'UC0wNSTMWIL3qaorLx0jie6A', name: 'Ani-One Asia', region: 'IN' }
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

    // Language detection (Phase 6)
    function detectLang(title, channelName = '') {
      const comb = `${title} ${channelName}`.toLowerCase();
      if (comb.includes('telugu dub') || comb.includes('telugu audio') || comb.includes('తెలుగు')) return { language: 'Telugu', status: 'verified' };
      if (comb.includes('tamil dub') || comb.includes('tamil audio') || comb.includes('தமிழ்')) return { language: 'Tamil', status: 'verified' };
      if (comb.includes('bengali dub') || comb.includes('bangla dub') || comb.includes('বাংলা')) return { language: 'Bengali', status: 'verified' };
      if (comb.includes('malayalam dub') || comb.includes('malayalam audio')) return { language: 'Malayalam', status: 'verified' };
      if (comb.includes('kannada dub') || comb.includes('kannada audio')) return { language: 'Kannada', status: 'verified' };
      if (comb.includes('hindi dub') || comb.includes('hindi audio') || comb.includes('हिंदी') || (channelName.toLowerCase().includes('india') && comb.includes('dub') && !comb.includes('eng'))) return { language: 'Hindi', status: 'verified' };
      if (comb.includes('english dub') || comb.includes('eng dub')) return { language: 'English Dub', status: 'verified' };
      if (comb.includes('english sub') || comb.includes('eng sub') || comb.includes('[sub]')) return { language: 'Japanese (English Sub)', status: 'verified' };
      if (channelName.toLowerCase().includes('muse') || channelName.toLowerCase().includes('ani-one')) return { language: 'Japanese (English Sub)', status: 'detected' };
      return { language: 'Official Audio', status: 'unknown' };
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
          // 1. Check for official series playlist
          const plQuery = (requestedLang && requestedLang !== 'All') ? `${title} ${requestedLang}` : title;
          const plUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${channel.id}&q=${encodeURIComponent(plQuery)}&maxResults=5&key=${apiKey}`;
          const plRes = await fetch(plUrl);
          if (plRes.ok) {
            const plData = await plRes.json();
            for (const pl of (plData.items || [])) {
              const plTitle = pl.snippet?.title || '';
              const { match } = matchTitle(plTitle, titlesToMatch);
              if (match) {
                const pItemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${pl.id}&maxResults=50&key=${apiKey}`;
                const pItemsRes = await fetch(pItemsUrl);
                if (pItemsRes.ok) {
                  const pItemsData = await pItemsRes.json();
                  const vIds = (pItemsData.items || []).map(it => it.contentDetails?.videoId).filter(Boolean);
                  if (vIds.length > 0) {
                    // Call videos.list to check embeddable and public status
                    const vListUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,status,contentDetails&id=${vIds.join(',')}&key=${apiKey}`;
                    const vListRes = await fetch(vListUrl);
                    if (vListRes.ok) {
                      const vListData = await vListRes.json();
                      for (const v of (vListData.items || [])) {
                        const vid = v.id;
                        if (!vid || seen.has(vid)) continue;
                        if (!APPROVED_SET.has(v.snippet?.channelId)) continue;
                        if (v.status?.privacyStatus !== 'public') continue;

                        const isEmbeddable = v.status?.embeddable === true;
                        const vTitle = v.snippet?.title || '';
                        const ep = extractEp(vTitle, requestedEp);
                        const epSeason = extractSeason(vTitle, season);
                        const lang = detectLang(vTitle, channel.name);

                        if (season && epSeason !== season) continue;
                        if (requestedLang && requestedLang !== 'All') {
                          if (!lang.language.toLowerCase().includes(requestedLang.toLowerCase())) continue;
                        }

                        seen.add(vid);
                        const isHighConfidence = isEmbeddable && ep !== null;
                        const verificationStatus = isHighConfidence ? 'verified' : (isEmbeddable ? 'needs_verification' : 'rejected');

                        discovered.push({
                          anime_id: animeId,
                          provider: 'youtube',
                          channel_name: channel.name,
                          channel_id: channel.id,
                          video_id: vid,
                          episode_number: ep || 1,
                          season_number: epSeason,
                          language: lang.language,
                          language_status: lang.status,
                          region: channel.region || regionCode,
                          is_official: true,
                          is_embeddable: isEmbeddable,
                          match_confidence: isHighConfidence ? 1.0 : 0.75,
                          verification_status: verificationStatus,
                          source_url: `https://www.youtube.com/watch?v=${vid}`,
                          video_title: vTitle,
                          thumbnail_url: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.medium?.url || '',
                          verified_at: new Date().toISOString()
                        });
                      }
                    }
                  }
                }
              }
            }
          }

          // 2. If no episodes found via playlist, fallback to search.list
          if (discovered.length === 0) {
            const qTerm = (requestedLang && requestedLang !== 'All') ? `${title} Season ${season} ${requestedLang} Episode` : `${title} Episode`;
            const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.id}&q=${encodeURIComponent(qTerm)}&type=video&regionCode=${regionCode}&videoEmbeddable=true&maxResults=25&key=${apiKey}`;
            const resRaw = await fetch(ytUrl);
            if (resRaw.ok) {
              const data = await resRaw.json();
              const candidateIds = (data.items || []).map(it => it.id?.videoId).filter(Boolean);
              if (candidateIds.length > 0) {
                const vCheckUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${candidateIds.join(',')}&key=${apiKey}`;
                const vCheckRes = await fetch(vCheckUrl);
                if (vCheckRes.ok) {
                  const vCheckData = await vCheckRes.json();
                  for (const v of (vCheckData.items || [])) {
                    const vid = v.id;
                    if (!vid || seen.has(vid)) continue;
                    if (!APPROVED_SET.has(v.snippet?.channelId)) continue;
                    if (v.status?.privacyStatus !== 'public') continue;

                    const isEmbeddable = v.status?.embeddable === true;
                    const vTitle = v.snippet?.title || '';
                    const { match } = matchTitle(vTitle, titlesToMatch);
                    if (!match) continue;

                    const ep = extractEp(vTitle, requestedEp);
                    const epSeason = extractSeason(vTitle, season);
                    const lang = detectLang(vTitle, channel.name);

                    if (season && epSeason !== season) continue;
                    if (requestedLang && requestedLang !== 'All') {
                      if (!lang.language.toLowerCase().includes(requestedLang.toLowerCase())) continue;
                    }

                    seen.add(vid);
                    const isHighConfidence = isEmbeddable && ep !== null;
                    const verificationStatus = isHighConfidence ? 'verified' : (isEmbeddable ? 'needs_verification' : 'rejected');

                    discovered.push({
                      anime_id: animeId,
                      provider: 'youtube',
                      channel_name: channel.name,
                      channel_id: channel.id,
                      video_id: vid,
                      episode_number: ep || 1,
                      season_number: epSeason,
                      language: lang.language,
                      language_status: lang.status,
                      region: channel.region || regionCode,
                      is_official: true,
                      is_embeddable: isEmbeddable,
                      match_confidence: isHighConfidence ? 1.0 : 0.75,
                      verification_status: verificationStatus,
                      source_url: `https://www.youtube.com/watch?v=${vid}`,
                      video_title: vTitle,
                      thumbnail_url: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.medium?.url || '',
                      verified_at: new Date().toISOString()
                    });
                  }
                }
              }
            }
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

  // Admin Batch Save Sources (Requirement 9)
  if (safePath === '/api/admin/save-sources' && req.method === 'POST') {
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
        const sources = Array.isArray(payload.sources) ? payload.sources : [];
        let savedCount = 0;
        for (const s of sources) {
          if (!s.video_id) continue;
          QueueManager.updateAdminSource({
            animeId: s.anime_id,
            videoId: s.video_id,
            status: s.verification_status || 'verified',
            episodeNumber: s.episode_number,
            seasonNumber: s.season_number,
            language: s.language,
            channelName: s.channel_name,
            channelId: s.channel_id,
            videoTitle: s.video_title,
            region: s.region,
            isOfficial: s.is_official,
            isEmbeddable: s.is_embeddable,
            matchConfidence: s.match_confidence
          });
          savedCount++;
        }
        res.end(JSON.stringify({
          success: true,
          count: savedCount,
          message: `Successfully saved ${savedCount} verified watch sources!`
        }));
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
