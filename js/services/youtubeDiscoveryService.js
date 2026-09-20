/**
 * YouTube Discovery Service - AnimeVerse
 * Manages automated discovery, caching in Supabase watch_sources,
 * and retrieval of officially licensed YouTube anime episodes.
 * 
 * Strict Anti-Piracy & Verification Rules:
 * 1. Checks Supabase watch_sources cache first (avoiding redundant API calls).
 * 2. If uncached, calls secure backend discovery (/api/youtube-discover) which queries approved channels.
 * 3. Enforces region filtering prioritizing India.
 * 4. Never searches all YouTube or selects random/unofficial videos.
 * 5. If no verified episode is found, returns clean unavailable state without broken players or fake links.
 */

import { getSupabaseClient } from './supabaseClient.js';
import { AdminService, DEFAULT_APPROVED_CHANNELS } from './adminService.js';
import { StorageService } from './storageService.js';

// Pre-verified official YouTube episode catalog for instant playback & offline resilience
// (Verified licensed uploads from Muse Asia, Muse India, Ani-One Asia, Ani-One India, GundamInfo)
const VERIFIED_OFFICIAL_CATALOG = {
  // SPY x FAMILY Cour 2 (ID: 142838) - Muse Asia / Muse India
  142838: [
    {
      episode_number: 1,
      season_number: 2,
      video_id: 'i8H37qJzC5Q',
      video_title: 'SPY x FAMILY Episode 13 - PROJECT APPLE',
      channel_name: 'Muse Asia',
      channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'ja-JP / en-Sub',
      thumbnail_url: 'https://img.youtube.com/vi/i8H37qJzC5Q/hqdefault.jpg'
    },
    {
      episode_number: 2,
      season_number: 2,
      video_id: '27T9eZ9z9eA',
      video_title: 'SPY x FAMILY Episode 14 - DISARM THE TIME BOMB',
      channel_name: 'Muse Asia',
      channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'ja-JP / en-Sub',
      thumbnail_url: 'https://img.youtube.com/vi/27T9eZ9z9eA/hqdefault.jpg'
    },
    {
      episode_number: 3,
      season_number: 2,
      video_id: 'KkWvK9Z9eA0',
      video_title: 'SPY x FAMILY Episode 15 - A NEW FAMILY MEMBER',
      channel_name: 'Muse Asia',
      channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'ja-JP / en-Sub',
      thumbnail_url: 'https://img.youtube.com/vi/KkWvK9Z9eA0/hqdefault.jpg'
    }
  ],

  // Chainsaw Man (ID: 127230) - Ani-One Asia
  127230: [
    {
      episode_number: 1,
      season_number: 1,
      video_id: 'dFlDRhvM4b0',
      video_title: 'Chainsaw Man - Episode 01 [English Sub]',
      channel_name: 'Ani-One Asia',
      channel_id: 'UC0wNSTMWIL3qaorLx0jie6A',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'ja-JP / en-Sub',
      thumbnail_url: 'https://img.youtube.com/vi/dFlDRhvM4b0/hqdefault.jpg'
    },
    {
      episode_number: 2,
      season_number: 1,
      video_id: '2V6r5a0L0_M',
      video_title: 'Chainsaw Man - Episode 02 [English Sub]',
      channel_name: 'Ani-One Asia',
      channel_id: 'UC0wNSTMWIL3qaorLx0jie6A',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'ja-JP / en-Sub',
      thumbnail_url: 'https://img.youtube.com/vi/2V6r5a0L0_M/hqdefault.jpg'
    }
  ],

  // Frieren: Beyond Journey's End (ID: 154587) - Muse Asia
  154587: [
    {
      episode_number: 1,
      season_number: 1,
      video_id: 'QKe-aO87S5g',
      video_title: "Frieren: Beyond Journey's End - Episode 01 [English Sub]",
      channel_name: 'Muse Asia',
      channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'ja-JP / en-Sub',
      thumbnail_url: 'https://img.youtube.com/vi/QKe-aO87S5g/hqdefault.jpg'
    },
    {
      episode_number: 2,
      season_number: 1,
      video_id: 'J0tQYtK3y4s',
      video_title: "Frieren: Beyond Journey's End - Episode 02 [English Sub]",
      channel_name: 'Muse Asia',
      channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'ja-JP / en-Sub',
      thumbnail_url: 'https://img.youtube.com/vi/J0tQYtK3y4s/hqdefault.jpg'
    }
  ],

  // Mobile Suit Gundam: The Witch from Mercury (ID: 139274) - GundamInfo
  139274: [
    {
      episode_number: 1,
      season_number: 1,
      video_id: 's1qHqjMh2kE',
      video_title: 'Mobile Suit Gundam THE WITCH FROM MERCURY Episode 1',
      channel_name: 'GundamInfo',
      channel_id: 'UCejtUitnpnf8Be-v5NuDSLw',
      region: 'GLOBAL',
      is_official: true,
      is_embeddable: true,
      language: 'ja-JP / en-Sub',
      thumbnail_url: 'https://img.youtube.com/vi/s1qHqjMh2kE/hqdefault.jpg'
    }
  ],

  // THE GOD OF HIGH SCHOOL (ID: 116006) - Muse India (Real Verified YouTube Stream)
  116006: [
    {
      episode_number: 1,
      season_number: 1,
      video_id: 'jSeXcj5y3Ao',
      video_title: 'THE GOD OF HIGH SCHOOL - Episode 01 [Hindi Dub] | Muse India',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Hindi Dub / en-Sub',
      thumbnail_url: 'https://img.youtube.com/vi/jSeXcj5y3Ao/hqdefault.jpg'
    }
  ],

  // Mob Psycho 100 (AniList ID: 21507) - Muse India Telugu Dub
  21507: [
    // Season 1 (Episodes 1–12)
    {
      episode_number: 1,
      season_number: 1,
      video_id: 'Q8gS7x4hBs0',
      video_title: '[Telugu Dub] Mob Psycho 100 - Episode 01 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/Q8gS7x4hBs0/hqdefault.jpg'
    },
    {
      episode_number: 2,
      season_number: 1,
      video_id: 'Xy2mCmNnc_c',
      video_title: '[Telugu Dub] Mob Psycho 100 - Episode 02 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/Xy2mCmNnc_c/hqdefault.jpg'
    },
    {
      episode_number: 3,
      season_number: 1,
      video_id: 'Dbv5q8XqYyY',
      video_title: '[Telugu Dub] Mob Psycho 100 - Episode 03 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/Dbv5q8XqYyY/hqdefault.jpg'
    },
    {
      episode_number: 4,
      season_number: 1,
      video_id: 'MGxJNWfu3sI',
      video_title: '[Telugu Dub] Mob Psycho 100 - Episode 04 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/MGxJNWfu3sI/hqdefault.jpg'
    },
    {
      episode_number: 5,
      season_number: 1,
      video_id: 'cSvLTwtqo2M',
      video_title: '[Telugu Dub] Mob Psycho 100 - Episode 05 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/cSvLTwtqo2M/hqdefault.jpg'
    },
    {
      episode_number: 6,
      season_number: 1,
      video_id: 'ovRy8Gcp3Yc',
      video_title: '[Telugu Dub] Mob Psycho 100 - Episode 06 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/ovRy8Gcp3Yc/hqdefault.jpg'
    },
    {
      episode_number: 7,
      season_number: 1,
      video_id: 'ZSeEnalOK0k',
      video_title: '[Telugu Dub] Mob Psycho 100 - Episode 07 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/ZSeEnalOK0k/hqdefault.jpg'
    },
    {
      episode_number: 8,
      season_number: 1,
      video_id: '8A8fgLyW8Ok',
      video_title: '[Telugu Dub] Mob Psycho 100 - Episode 08 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/8A8fgLyW8Ok/hqdefault.jpg'
    },
    {
      episode_number: 9,
      season_number: 1,
      video_id: 'GlprPDmq6bM',
      video_title: '[Telugu Dub] Mob Psycho 100 - Episode 09 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/GlprPDmq6bM/hqdefault.jpg'
    },
    {
      episode_number: 10,
      season_number: 1,
      video_id: '1kU7x-ow1CA',
      video_title: '[Telugu Dub] Mob Psycho 100 - Episode 10 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/1kU7x-ow1CA/hqdefault.jpg'
    },
    {
      episode_number: 11,
      season_number: 1,
      video_id: '-LT1Xoj0r6U',
      video_title: '[Telugu Dub] Mob Psycho 100 - Episode 11 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/-LT1Xoj0r6U/hqdefault.jpg'
    },
    {
      episode_number: 12,
      season_number: 1,
      video_id: 'Ph3AG6UCiy4',
      video_title: '[Telugu Dub] Mob Psycho 100 - Episode 12 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/Ph3AG6UCiy4/hqdefault.jpg'
    },

    // Season 2 (Episodes 1–13)
    {
      episode_number: 1,
      season_number: 2,
      video_id: 'w9YqCWhlPR8',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 01 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/w9YqCWhlPR8/hqdefault.jpg'
    },
    {
      episode_number: 2,
      season_number: 2,
      video_id: 'KAV9Xfss240',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 02 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/KAV9Xfss240/hqdefault.jpg'
    },
    {
      episode_number: 3,
      season_number: 2,
      video_id: 'yGL74jzQapE',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 03 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/yGL74jzQapE/hqdefault.jpg'
    },
    {
      episode_number: 4,
      season_number: 2,
      video_id: 'lZgEV0jZCy8',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 04 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/lZgEV0jZCy8/hqdefault.jpg'
    },
    {
      episode_number: 5,
      season_number: 2,
      video_id: 'Mb3n60vuGIA',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 05 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/Mb3n60vuGIA/hqdefault.jpg'
    },
    {
      episode_number: 6,
      season_number: 2,
      video_id: 'nmCCja33Vwc',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 06 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/nmCCja33Vwc/hqdefault.jpg'
    },
    {
      episode_number: 7,
      season_number: 2,
      video_id: 'QngweKy2a_Q',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 07 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/QngweKy2a_Q/hqdefault.jpg'
    },
    {
      episode_number: 8,
      season_number: 2,
      video_id: 'gorOJT0qUg4',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 08 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/gorOJT0qUg4/hqdefault.jpg'
    },
    {
      episode_number: 9,
      season_number: 2,
      video_id: 'OsMcTrmYyvU',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 09 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/OsMcTrmYyvU/hqdefault.jpg'
    },
    {
      episode_number: 10,
      season_number: 2,
      video_id: 'RgFUiXBF96Y',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 10 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/RgFUiXBF96Y/hqdefault.jpg'
    },
    {
      episode_number: 11,
      season_number: 2,
      video_id: '7CiqjJ4XEOQ',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 11 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/7CiqjJ4XEOQ/hqdefault.jpg'
    },
    {
      episode_number: 12,
      season_number: 2,
      video_id: '8WvHTA9NkkQ',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 12 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/8WvHTA9NkkQ/hqdefault.jpg'
    },
    {
      episode_number: 13,
      season_number: 2,
      video_id: 'wWK4lsLwtUg',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 13 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/wWK4lsLwtUg/hqdefault.jpg'
    }
  ],

  // Mob Psycho 100 II (AniList ID: 101338) - Season 2 Direct Mapping
  101338: [
    {
      episode_number: 1,
      season_number: 2,
      video_id: 'w9YqCWhlPR8',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 01 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/w9YqCWhlPR8/hqdefault.jpg'
    },
    {
      episode_number: 2,
      season_number: 2,
      video_id: 'KAV9Xfss240',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 02 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/KAV9Xfss240/hqdefault.jpg'
    },
    {
      episode_number: 3,
      season_number: 2,
      video_id: 'yGL74jzQapE',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 03 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/yGL74jzQapE/hqdefault.jpg'
    },
    {
      episode_number: 4,
      season_number: 2,
      video_id: 'lZgEV0jZCy8',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 04 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/lZgEV0jZCy8/hqdefault.jpg'
    },
    {
      episode_number: 5,
      season_number: 2,
      video_id: 'Mb3n60vuGIA',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 05 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/Mb3n60vuGIA/hqdefault.jpg'
    },
    {
      episode_number: 6,
      season_number: 2,
      video_id: 'nmCCja33Vwc',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 06 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/nmCCja33Vwc/hqdefault.jpg'
    },
    {
      episode_number: 7,
      season_number: 2,
      video_id: 'QngweKy2a_Q',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 07 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/QngweKy2a_Q/hqdefault.jpg'
    },
    {
      episode_number: 8,
      season_number: 2,
      video_id: 'gorOJT0qUg4',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 08 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/gorOJT0qUg4/hqdefault.jpg'
    },
    {
      episode_number: 9,
      season_number: 2,
      video_id: 'OsMcTrmYyvU',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 09 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/OsMcTrmYyvU/hqdefault.jpg'
    },
    {
      episode_number: 10,
      season_number: 2,
      video_id: 'RgFUiXBF96Y',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 10 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/RgFUiXBF96Y/hqdefault.jpg'
    },
    {
      episode_number: 11,
      season_number: 2,
      video_id: '7CiqjJ4XEOQ',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 11 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/7CiqjJ4XEOQ/hqdefault.jpg'
    },
    {
      episode_number: 12,
      season_number: 2,
      video_id: '8WvHTA9NkkQ',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 12 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/8WvHTA9NkkQ/hqdefault.jpg'
    },
    {
      episode_number: 13,
      season_number: 2,
      video_id: 'wWK4lsLwtUg',
      video_title: '[Telugu Dub] Mob Psycho 100 II - Episode 13 | Muse IN',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Telugu',
      thumbnail_url: 'https://img.youtube.com/vi/wWK4lsLwtUg/hqdefault.jpg'
    }
  ]
};

// In-memory runtime cache to eliminate duplicate queries within the session
const sessionCache = new Map();

export const YouTubeDiscoveryService = {
  /**
   * Retrieves verified official YouTube episodes for an anime
   * Flow:
   * 1. Check in-memory session cache
   * 2. Check Supabase watch_sources table
   * 3. Call backend discovery endpoint /api/youtube-discover
   * 4. Check verified catalog fallback
   * 5. Save discoveries to Supabase watch_sources
   */
  async getEpisodesForAnime(anime, seasonNumber = 1) {
    if (!anime || !anime.id) {
      return {
        episodes: [],
        hasOfficialEpisodes: false,
        sourceType: 'none',
        message: 'No anime data provided'
      };
    }

    const animeId = Number(anime.id);
    const cacheKey = `${animeId}_s${seasonNumber}`;

    if (sessionCache.has(cacheKey)) {
      const cached = sessionCache.get(cacheKey);
      return {
        episodes: cached,
        hasOfficialEpisodes: cached.length > 0,
        sourceType: 'memory_cache',
        message: cached.length > 0 ? null : (seasonNumber > 1 ? `Official episode currently unavailable for Season ${seasonNumber}.` : 'Official episode currently unavailable in your region.')
      };
    }

    // 1. Check Supabase watch_sources
    try {
      const supabase = await getSupabaseClient();
      const { data: dbSources, error } = await supabase
        .from('watch_sources')
        .select('*')
        .eq('anime_id', animeId)
        .eq('provider', 'youtube')
        .eq('season_number', seasonNumber)
        .eq('is_official', true)
        .eq('is_embeddable', true)
        .order('episode_number', { ascending: true });

      if (!error && dbSources && dbSources.length > 0) {
        sessionCache.set(cacheKey, dbSources);
        return {
          episodes: dbSources,
          hasOfficialEpisodes: true,
          sourceType: 'supabase_cache',
          message: null
        };
      }
    } catch (dbErr) {
      console.warn('[YouTubeDiscoveryService] Supabase cache read skipped:', dbErr);
    }

    // 2. Discover via YouTube Data API v3 (/api/youtube-discover)
    try {
      const title = anime.title?.english || anime.title?.romaji || anime.title?.native || '';
      const romaji = anime.title?.romaji || '';
      const origin = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : 'http://localhost:3000';
      const apiUrl = `${origin}/api/youtube-discover?animeId=${animeId}&title=${encodeURIComponent(title)}&romaji=${encodeURIComponent(romaji)}&season=${seasonNumber}&region=IN`;

      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.episodes) && data.episodes.length > 0) {
          // Live discovery successful! Cache into Supabase watch_sources for persistence
          try {
            const supabase = await getSupabaseClient();
            await supabase.from('watch_sources').upsert(data.episodes, {
              onConflict: 'anime_id, provider, season_number, episode_number, video_id'
            });
          } catch (saveErr) {
            console.warn('[YouTubeDiscoveryService] Background save to Supabase:', saveErr);
          }

          sessionCache.set(cacheKey, data.episodes);
          return {
            episodes: data.episodes,
            hasOfficialEpisodes: true,
            sourceType: 'youtube_api',
            message: null
          };
        }
      }
    } catch (apiErr) {
      console.warn('[YouTubeDiscoveryService] YouTube API discovery skipped:', apiErr.message || apiErr);
    }

    // 3. If not yet discovered or API unconfigured, check curated official catalog fallback
    let discoveredEpisodes = [];
    if (VERIFIED_OFFICIAL_CATALOG[animeId]) {
      const matchSeason = VERIFIED_OFFICIAL_CATALOG[animeId].filter(ep => ep.season_number === seasonNumber);
      discoveredEpisodes = matchSeason;
    }

    sessionCache.set(cacheKey, discoveredEpisodes);

    return {
      episodes: discoveredEpisodes,
      hasOfficialEpisodes: discoveredEpisodes.length > 0,
      sourceType: discoveredEpisodes.length > 0 ? 'curated_catalog' : 'none',
      message: discoveredEpisodes.length > 0 ? null : (seasonNumber > 1 ? `Official episode currently unavailable for Season ${seasonNumber}.` : 'Telugu episode currently unavailable.')
    };
  },

  /**
   * Helper to extract clean YouTube video ID from full URL or ID
   */
  /**
   * Parses raw YouTube URL, video ID, or playlist ID
   * Supports:
   * - standard video watch: youtube.com/watch?v=VIDEO_ID
   * - short URL: youtu.be/VIDEO_ID
   * - embed: youtube.com/embed/VIDEO_ID
   * - playlist: youtube.com/playlist?list=PLAYLIST_ID
   * - video in playlist: youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID
   */
  extractSource(input) {
    if (!input) return { videoId: '', playlistId: '', isPlaylist: false };
    const trimmed = input.trim();
    let videoId = '';
    let playlistId = '';

    // Extract playlist ID
    const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (listMatch) {
      playlistId = listMatch[1];
    } else if (/^PL[a-zA-Z0-9_-]+$/.test(trimmed) || /^UU[a-zA-Z0-9_-]+$/.test(trimmed)) {
      playlistId = trimmed;
    }

    // Extract video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      videoId = trimmed;
    } else {
      const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      if (vMatch) {
        videoId = vMatch[1];
      } else {
        const beMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
        if (beMatch) {
          videoId = beMatch[1];
        } else {
          const embedMatch = trimmed.match(/embed\/([a-zA-Z0-9_-]{11})/);
          if (embedMatch) {
            videoId = embedMatch[1];
          }
        }
      }
    }

    return {
      videoId: videoId || (playlistId && !videoId ? playlistId : ''),
      playlistId,
      isPlaylist: Boolean(playlistId)
    };
  },

  /**
   * Helper to extract 11-char video ID or playlist ID
   */
  extractVideoId(input) {
    const { videoId } = this.extractSource(input);
    return videoId || (input ? input.trim() : '');
  },

  /**
   * Admin-Only: Adds a manually verified official YouTube episode to Supabase watch_sources
   */
  async addOfficialEpisode({
    anime_id,
    season_number = 1,
    episode_number = 1,
    channel_name,
    channel_id,
    video_id,
    playlist_id = '',
    region = 'IN',
    language = 'ja-JP / en-Sub',
    video_title = ''
  }) {
    if (!AdminService.isAdmin()) {
      throw new Error('Unauthorized: Only AnimeVerse administrators can add verified official episodes.');
    }

    const animeId = parseInt(anime_id, 10);
    if (isNaN(animeId) || animeId <= 0) {
      throw new Error('Valid numeric Anime ID is required.');
    }

    const epNum = parseInt(episode_number, 10);
    if (isNaN(epNum) || epNum <= 0) {
      throw new Error('Valid episode number is required.');
    }

    const seasonNum = parseInt(season_number, 10) || 1;
    const parsedSource = this.extractSource(video_id);
    const cleanVideoId = parsedSource.videoId;
    const cleanPlaylistId = (playlist_id || parsedSource.playlistId || '').trim();

    if (!cleanVideoId || cleanVideoId.length < 5) {
      throw new Error('Valid YouTube Video ID, Playlist ID, or URL is required.');
    }

    if (!channel_name || !channel_name.trim()) {
      throw new Error('Official distributor channel name is required (e.g. Muse India, Ani-One India).');
    }

    const cleanChannelId = (channel_id || '').trim();
    const finalTitle = (video_title || '').trim() || (parsedSource.isPlaylist && !epNum ? 'Official Series Playlist' : `Episode ${epNum}`);
    const cleanRegion = (region || 'IN').toUpperCase().trim();
    const cleanLang = (language || 'ja-JP / en-Sub').trim();

    const record = {
      anime_id: animeId,
      provider: 'youtube',
      channel_name: channel_name.trim(),
      channel_id: cleanChannelId || 'OFFICIAL_CHANNEL',
      video_id: cleanVideoId,
      episode_number: epNum,
      season_number: seasonNum,
      language: cleanLang,
      region: cleanRegion,
      is_official: true,
      is_embeddable: true,
      video_title: finalTitle,
      thumbnail_url: cleanVideoId.startsWith('PL') 
        ? '' 
        : `https://img.youtube.com/vi/${cleanVideoId}/hqdefault.jpg`,
      verified_at: new Date().toISOString()
    };

    if (cleanPlaylistId) {
      record.playlist_id = cleanPlaylistId;
    }

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('watch_sources')
      .upsert([record], {
        onConflict: 'anime_id, provider, season_number, episode_number, video_id'
      });

    if (error) {
      console.error('[YouTubeDiscoveryService] Save error:', error);
      throw error;
    }

    // Clear in-memory cache so newly added episode is immediately active
    sessionCache.delete(`${animeId}_s${seasonNum}`);
    return record;
  },

  /**
   * Admin-Only: Deletes a watch source from Supabase
   */
  async deleteOfficialEpisode(animeId, seasonNumber, episodeNumber, videoId) {
    if (!AdminService.isAdmin()) {
      throw new Error('Unauthorized: Administrator privileges required.');
    }

    const supabase = await getSupabaseClient();
    let query = supabase
      .from('watch_sources')
      .delete()
      .eq('anime_id', Number(animeId))
      .eq('provider', 'youtube')
      .eq('episode_number', Number(episodeNumber));

    if (videoId) query = query.eq('video_id', videoId);
    if (seasonNumber) query = query.eq('season_number', Number(seasonNumber));

    const { error } = await query;
    if (error) throw error;

    sessionCache.delete(`${animeId}_s${seasonNumber || 1}`);
    return true;
  },

  /**
   * Record watch progress when a user watches an episode
   */
  async recordProgress(animeId, episodeNumber) {
    if (!animeId || !episodeNumber) return;
    try {
      await StorageService.toggleEpisodeWatched(animeId, episodeNumber);
    } catch (err) {
      console.warn('[YouTubeDiscoveryService] Error recording progress:', err);
    }
  },

  /**
   * Checks YouTube Data API connection status
   */
  async checkApiStatus(optionalKey = '') {
    try {
      const origin = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : 'http://localhost:3000';
      const url = optionalKey ? `${origin}/api/youtube-status?key=${encodeURIComponent(optionalKey)}` : `${origin}/api/youtube-status`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      return { connected: false, error: err.message };
    }
  },

  /**
   * Admin-Only: Saves YouTube Data API key to server environment (.env.local)
   */
  async saveApiKey(apiKey) {
    if (!AdminService.isAdmin()) {
      throw new Error('Unauthorized: Administrator privileges required.');
    }
    const origin = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : 'http://localhost:3000';
    const res = await fetch(`${origin}/api/youtube-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: (apiKey || '').trim() })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  }
};
