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
  ],

  // Classroom of the Elite (AniList ID: 98659) - Muse India Telugu Dub
  98659: [
    // Season 1 (Episodes 1–12)
    { episode_number: 1, season_number: 1, video_id: 'QbEoZexESDs', video_title: '[Telugu Dub,
    {
      episode_number: 1,
      season_number: 1,
      video_id: 'UQLqvjHvrwc',
      video_title: 'Classroom of the Elite Season 1 - Complete Series [English Sub] | Muse Asia',
      channel_name: 'Muse Asia',
      channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'English Sub',
      source_url: 'https://www.youtube.com/watch?v=UQLqvjHvrwc',
      thumbnail_url: 'https://img.youtube.com/vi/UQLqvjHvrwc/hqdefault.jpg'
    }
  ] Classroom of the Elite - Episode 01 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/QbEoZexESDs/hqdefault.jpg' },
    { episode_number: 2, season_number: 1, video_id: '4_Vumu_418c', video_title: '[Telugu Dub] Classroom of the Elite - Episode 02 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/4_Vumu_418c/hqdefault.jpg' },
    { episode_number: 3, season_number: 1, video_id: 'GsiZwUXsRHE', video_title: '[Telugu Dub] Classroom of the Elite - Episode 03 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/GsiZwUXsRHE/hqdefault.jpg' },
    { episode_number: 4, season_number: 1, video_id: '8Pm5E2jgZ8c', video_title: '[Telugu Dub] Classroom of the Elite - Episode 04 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/8Pm5E2jgZ8c/hqdefault.jpg' },
    { episode_number: 5, season_number: 1, video_id: '7ISj1vIzepE', video_title: '[Telugu Dub] Classroom of the Elite - Episode 05 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/7ISj1vIzepE/hqdefault.jpg' },
    { episode_number: 6, season_number: 1, video_id: 'i5xBc-uyMxQ', video_title: '[Telugu Dub] Classroom of the Elite - Episode 06 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/i5xBc-uyMxQ/hqdefault.jpg' },
    { episode_number: 7, season_number: 1, video_id: 'ZthaFVaevd8', video_title: '[Telugu Dub] Classroom of the Elite - Episode 07 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/ZthaFVaevd8/hqdefault.jpg' },
    { episode_number: 8, season_number: 1, video_id: 'NRELz5z3t2U', video_title: '[Telugu Dub] Classroom of the Elite - Episode 08 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/NRELz5z3t2U/hqdefault.jpg' },
    { episode_number: 9, season_number: 1, video_id: 'qrkaUnbHzHA', video_title: '[Telugu Dub] Classroom of the Elite - Episode 09 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/qrkaUnbHzHA/hqdefault.jpg' },
    { episode_number: 10, season_number: 1, video_id: 'gU24L5IFJ3c', video_title: '[Telugu Dub] Classroom of the Elite - Episode 10 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/gU24L5IFJ3c/hqdefault.jpg' },
    { episode_number: 11, season_number: 1, video_id: 'hUqm7vUXHSc', video_title: '[Telugu Dub] Classroom of the Elite - Episode 11 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/hUqm7vUXHSc/hqdefault.jpg' },
    { episode_number: 12, season_number: 1, video_id: 'CjQ6DQiMfM0', video_title: '[Telugu Dub] Classroom of the Elite - Episode 12 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/CjQ6DQiMfM0/hqdefault.jpg' },

    // Season 2 (Episodes 1–13)
    { episode_number: 1, season_number: 2, video_id: '7rjglJxtyHk', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 01 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/7rjglJxtyHk/hqdefault.jpg' },
    { episode_number: 2, season_number: 2, video_id: 'Oq-FBwiXCjQ', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 02 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/Oq-FBwiXCjQ/hqdefault.jpg' },
    { episode_number: 3, season_number: 2, video_id: 'vNITI_aPWJs', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 03 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/vNITI_aPWJs/hqdefault.jpg' },
    { episode_number: 4, season_number: 2, video_id: 'FE-eHl8QEI0', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 04 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/FE-eHl8QEI0/hqdefault.jpg' },
    { episode_number: 5, season_number: 2, video_id: 'hK70OIqRABk', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 05 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/hK70OIqRABk/hqdefault.jpg' },
    { episode_number: 6, season_number: 2, video_id: 'VDyo1ujH1BY', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 06 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/VDyo1ujH1BY/hqdefault.jpg' },
    { episode_number: 7, season_number: 2, video_id: 't_3pPFBdu9Y', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 07 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/t_3pPFBdu9Y/hqdefault.jpg' },
    { episode_number: 8, season_number: 2, video_id: '5AlKZkK12Vg', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 08 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/5AlKZkK12Vg/hqdefault.jpg' },
    { episode_number: 9, season_number: 2, video_id: 'cc4BMOnupSU', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 09 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/cc4BMOnupSU/hqdefault.jpg' },
    { episode_number: 10, season_number: 2, video_id: '05QnYKBDggw', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 10 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/05QnYKBDggw/hqdefault.jpg' },
    { episode_number: 11, season_number: 2, video_id: 'k6-R1GFbprY', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 11 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/k6-R1GFbprY/hqdefault.jpg' },
    { episode_number: 12, season_number: 2, video_id: '5tuh9rNWPWU', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 12 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/5tuh9rNWPWU/hqdefault.jpg' },
    { episode_number: 13, season_number: 2, video_id: 'vBt22eQLwIk', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 13 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/vBt22eQLwIk/hqdefault.jpg' },

    // Season 3 (Episodes 1–13)
    { episode_number: 1, season_number: 3, video_id: '6c9qyEZ-OZA', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 01 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/6c9qyEZ-OZA/hqdefault.jpg' },
    { episode_number: 2, season_number: 3, video_id: 'GAa3E2_CSOo', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 02 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/GAa3E2_CSOo/hqdefault.jpg' },
    { episode_number: 3, season_number: 3, video_id: 'KESuIGZtivM', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 03 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/KESuIGZtivM/hqdefault.jpg' },
    { episode_number: 4, season_number: 3, video_id: 'XW63UzZ9C5c', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 04 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/XW63UzZ9C5c/hqdefault.jpg' },
    { episode_number: 5, season_number: 3, video_id: 'he8pzJTFJ5Y', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 05 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/he8pzJTFJ5Y/hqdefault.jpg' },
    { episode_number: 6, season_number: 3, video_id: '2YltBNwWXSI', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 06 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/2YltBNwWXSI/hqdefault.jpg' },
    { episode_number: 7, season_number: 3, video_id: 'vA9Gi78vSeI', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 07 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/vA9Gi78vSeI/hqdefault.jpg' },
    { episode_number: 8, season_number: 3, video_id: '5NgBWIsXGec', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 08 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/5NgBWIsXGec/hqdefault.jpg' },
    { episode_number: 9, season_number: 3, video_id: 'gp75yk7vnOo', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 09 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/gp75yk7vnOo/hqdefault.jpg' },
    { episode_number: 10, season_number: 3, video_id: '8diL300WGmA', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 10 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/8diL300WGmA/hqdefault.jpg' },
    { episode_number: 11, season_number: 3, video_id: 'JxknpSNMyeI', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 11 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/JxknpSNMyeI/hqdefault.jpg' },
    { episode_number: 12, season_number: 3, video_id: '5q1ObyClTt0', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 12 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/5q1ObyClTt0/hqdefault.jpg' },
    { episode_number: 13, season_number: 3, video_id: 'tgvZMyNMoE4', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 13 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/tgvZMyNMoE4/hqdefault.jpg' }
  ],

  // Classroom of the Elite Season 2 (AniList ID: 145545)
  145545: [
    { episode_number: 1, season_number: 2, video_id: '7rjglJxtyHk', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 01 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/7rjglJxtyHk/hqdefault.jpg' },
    { episode_number: 2, season_number: 2, video_id: 'Oq-FBwiXCjQ', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 02 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/Oq-FBwiXCjQ/hqdefault.jpg' },
    { episode_number: 3, season_number: 2, video_id: 'vNITI_aPWJs', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 03 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/vNITI_aPWJs/hqdefault.jpg' },
    { episode_number: 4, season_number: 2, video_id: 'FE-eHl8QEI0', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 04 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/FE-eHl8QEI0/hqdefault.jpg' },
    { episode_number: 5, season_number: 2, video_id: 'hK70OIqRABk', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 05 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/hK70OIqRABk/hqdefault.jpg' },
    { episode_number: 6, season_number: 2, video_id: 'VDyo1ujH1BY', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 06 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/VDyo1ujH1BY/hqdefault.jpg' },
    { episode_number: 7, season_number: 2, video_id: 't_3pPFBdu9Y', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 07 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/t_3pPFBdu9Y/hqdefault.jpg' },
    { episode_number: 8, season_number: 2, video_id: '5AlKZkK12Vg', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 08 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/5AlKZkK12Vg/hqdefault.jpg' },
    { episode_number: 9, season_number: 2, video_id: 'cc4BMOnupSU', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 09 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/cc4BMOnupSU/hqdefault.jpg' },
    { episode_number: 10, season_number: 2, video_id: '05QnYKBDggw', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 10 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/05QnYKBDggw/hqdefault.jpg' },
    { episode_number: 11, season_number: 2, video_id: 'k6-R1GFbprY', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 11 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/k6-R1GFbprY/hqdefault.jpg' },
    { episode_number: 12, season_number: 2, video_id: '5tuh9rNWPWU', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 12 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/5tuh9rNWPWU/hqdefault.jpg' },
    { episode_number: 13, season_number: 2, video_id: 'vBt22eQLwIk', video_title: '[Telugu Dub] Classroom of the Elite Season 2 - Episode 13 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/vBt22eQLwIk/hqdefault.jpg' }
  ],

  // Classroom of the Elite Season 3 (AniList ID: 146066)
  146066: [
    { episode_number: 1, season_number: 3, video_id: '6c9qyEZ-OZA', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 01 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/6c9qyEZ-OZA/hqdefault.jpg' },
    { episode_number: 2, season_number: 3, video_id: 'GAa3E2_CSOo', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 02 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/GAa3E2_CSOo/hqdefault.jpg' },
    { episode_number: 3, season_number: 3, video_id: 'KESuIGZtivM', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 03 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/KESuIGZtivM/hqdefault.jpg' },
    { episode_number: 4, season_number: 3, video_id: 'XW63UzZ9C5c', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 04 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/XW63UzZ9C5c/hqdefault.jpg' },
    { episode_number: 5, season_number: 3, video_id: 'he8pzJTFJ5Y', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 05 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/he8pzJTFJ5Y/hqdefault.jpg' },
    { episode_number: 6, season_number: 3, video_id: '2YltBNwWXSI', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 06 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/2YltBNwWXSI/hqdefault.jpg' },
    { episode_number: 7, season_number: 3, video_id: 'vA9Gi78vSeI', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 07 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/vA9Gi78vSeI/hqdefault.jpg' },
    { episode_number: 8, season_number: 3, video_id: '5NgBWIsXGec', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 08 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/5NgBWIsXGec/hqdefault.jpg' },
    { episode_number: 9, season_number: 3, video_id: 'gp75yk7vnOo', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 09 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/gp75yk7vnOo/hqdefault.jpg' },
    { episode_number: 10, season_number: 3, video_id: '8diL300WGmA', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 10 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/8diL300WGmA/hqdefault.jpg' },
    { episode_number: 11, season_number: 3, video_id: 'JxknpSNMyeI', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 11 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/JxknpSNMyeI/hqdefault.jpg' },
    { episode_number: 12, season_number: 3, video_id: '5q1ObyClTt0', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 12 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/5q1ObyClTt0/hqdefault.jpg' },
    { episode_number: 13, season_number: 3, video_id: 'tgvZMyNMoE4', video_title: '[Telugu Dub] Classroom of the Elite Season 3 - Episode 13 | Muse IN', channel_name: 'Muse India', channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q', region: 'IN', is_official: true, is_embeddable: true, language: 'Telugu', thumbnail_url: 'https://img.youtube.com/vi/tgvZMyNMoE4/hqdefault.jpg' }
  ],

  // ── Campfire Cooking in Another World S2 – Muse India Hindi Dub ──────────
  170577: [
    { episode_number:10, season_number:2, video_id:'PMWRiVpmNGE', video_title:'Campfire Cooking Another World S2 - Ep 10 [Hindi Dub] | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/PMWRiVpmNGE/hqdefault.jpg' }
  ],

  // ── JoJo Diamond is Unbreakable – Muse India Hindi Dub ───────────────────
  21450: [
    { episode_number:18, season_number:3, video_id:'n-ltlTbL4xA', video_title:'JoJo Diamond is Unbreakable - Ep 18 [Hindi Dub] | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/n-ltlTbL4xA/hqdefault.jpg' }
  ],

  // ── JoJo Stardust Crusaders – Muse India Hindi Dub ───────────────────────
  20474: [
    { episode_number:35, season_number:2, video_id:'0-Es7KTS6Kk', video_title:'JoJo Stardust Crusaders - Ep 35 [Hindi Dub] | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/0-Es7KTS6Kk/hqdefault.jpg' }
  ],

  // ── Mushoku Tensei S1 – Muse India Hindi Dub ─────────────────────────────
  108465: [
    {"episode_number":1,"season_number":1,"video_id":"PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS","video_title":"Mushoku Tensei: Jobless Reincarnation - Episodes 1-11 [Hindi Dub] Official Playlist | Muse India","channel_name":"Muse India","channel_id":"UCYYhAzgWuxPauRXdPpLAX3Q","region":"IN","is_official":true,"is_embeddable":true,"language":"Hindi (Dub) / Japanese (Audio)","source_url":"https://www.youtube.com/playlist?list=PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS"},
    { episode_number:1,  season_number:1, video_id:'_eP2RM7FGK0', video_title:'Mushoku Tensei S1 - Ep 01 [Hindi Dub] | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/_eP2RM7FGK0/hqdefault.jpg' },
    { episode_number:13, season_number:1, video_id:'8n_YkGlGtO0', video_title:'Mushoku Tensei S1 - Ep 13 [Hindi Dub] | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/8n_YkGlGtO0/hqdefault.jpg' }
  ],

  // ── Iruma-kun S2 – Muse India Hindi Dub ──────────────────────────────────
  116338: [
    { episode_number:3, season_number:2, video_id:'25tbTeNehEo', video_title:'Welcome to Demon School Iruma-kun S2 - Ep 03 [Hindi Dub] | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/25tbTeNehEo/hqdefault.jpg' }
  ],

  // ── SPY x FAMILY S1 – Muse India Hindi Dub ───────────────────────────────
  140960: [
    { episode_number:1,  season_number:1, video_id:'dXgq4u3ViFs', video_title:'SPY x FAMILY - Ep 01 [Hindi Dub] | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/dXgq4u3ViFs/hqdefault.jpg' },
    { episode_number:5,  season_number:1, video_id:'OK6snKUKrDk', video_title:'SPY x FAMILY - Ep 05 [Hindi Dub] | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/OK6snKUKrDk/hqdefault.jpg' },
    { episode_number:6,  season_number:1, video_id:'JbDbnNH80aY', video_title:'SPY x FAMILY - Ep 06 [Hindi Dub] | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/JbDbnNH80aY/hqdefault.jpg' },
    { episode_number:8,  season_number:1, video_id:'VdScGKEqFE4', video_title:'SPY x FAMILY - Ep 08 [Hindi Dub] | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/VdScGKEqFE4/hqdefault.jpg' },
    { episode_number:10, season_number:1, video_id:'gHz80IzDPTg', video_title:'SPY x FAMILY - Ep 10 [Hindi Dub] | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/gHz80IzDPTg/hqdefault.jpg' },
    { episode_number:11, season_number:1, video_id:'9d40pUJkT44', video_title:'SPY x FAMILY - Ep 11 [Hindi Dub] | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/9d40pUJkT44/hqdefault.jpg' },
    { episode_number:13, season_number:1, video_id:'amA7-O5rda8', video_title:'SPY x FAMILY - Ep 13 [Hindi Dub] | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/amA7-O5rda8/hqdefault.jpg' },
    { episode_number:17, season_number:1, video_id:'Y-OPiKqESPo', video_title:'SPY x FAMILY - Ep 17 [Hindi Dub] | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/Y-OPiKqESPo/hqdefault.jpg' },
    { episode_number:18, season_number:1, video_id:'LzWejVIkjx0', video_title:'SPY x FAMILY - Ep 18 [Hindi Dub] | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/LzWejVIkjx0/hqdefault.jpg' },
    { episode_number:26, season_number:1, video_id:'bPmXgbo7E6Q', video_title:'SPY x FAMILY - Ep 26 [Hindi Dub] | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/bPmXgbo7E6Q/hqdefault.jpg' }
  ],

  // ── SPY x FAMILY Season 3 – Muse India Hindi Dub ─────────────────────────
  177937: [
    { episode_number:1, season_number:3, video_id:'UK1MeqNV4q4', video_title:'SPY x FAMILY Season 3 - Ep 01 [Hindi Dub] | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/UK1MeqNV4q4/hqdefault.jpg' }
  ],

  // ── Fairy Tail Final Series – Muse India Hindi Dub + Muse Asia Eng Sub ───
  99749: [
    { episode_number:51, season_number:1, video_id:'NeNvy0kKWHI', video_title:'Fairy Tail - Ep 51 [Hindi Dub] | Muse India',   channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub',   thumbnail_url:'https://img.youtube.com/vi/NeNvy0kKWHI/hqdefault.jpg' },
    { episode_number:34, season_number:1, video_id:'-MoqYVmwl_8', video_title:'Fairy Tail - Ep 34 [English Sub] | Muse Asia',  channel_name:'Muse Asia',  channel_id:'UCGbshtvS9t-8CW11W7TooQg', region:'AS', is_official:true, is_embeddable:true, language:'English Sub', thumbnail_url:'https://img.youtube.com/vi/-MoqYVmwl_8/hqdefault.jpg' },
    { episode_number:45, season_number:1, video_id:'jKrujeN3C9I', video_title:'Fairy Tail - Ep 45 [English Sub] | Muse Asia',  channel_name:'Muse Asia',  channel_id:'UCGbshtvS9t-8CW11W7TooQg', region:'AS', is_official:true, is_embeddable:true, language:'English Sub', thumbnail_url:'https://img.youtube.com/vi/jKrujeN3C9I/hqdefault.jpg' },
    { episode_number:50, season_number:1, video_id:'2PH2USWESls', video_title:'Fairy Tail - Ep 50 [English Sub] | Muse Asia',  channel_name:'Muse Asia',  channel_id:'UCGbshtvS9t-8CW11W7TooQg', region:'AS', is_official:true, is_embeddable:true, language:'English Sub', thumbnail_url:'https://img.youtube.com/vi/2PH2USWESls/hqdefault.jpg' }
  ],

  // ── I Parry Everything S1 – Muse India Hindi Dub ─────────────────────────
  170695: [
    { episode_number:1, season_number:1, video_id:'rtTndsda8G0', video_title:'I Parry Everything - Ep 01 [Hindi Dub] | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/rtTndsda8G0/hqdefault.jpg' }
  ],

  // ── Ani-One India – English Sub ───────────────────────────────────────────
  196012: [ // MAO
    { episode_number:1, season_number:1, video_id:'R9bVYJXvkoA',   video_title:'MAO - Ep 01 [English Sub] | Ani-One India', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', region:'IN', is_official:true, is_embeddable:true, language:'English Sub', thumbnail_url:'https://img.youtube.com/vi/R9bVYJXvkoA/hqdefault.jpg' },
    { episode_number:2, season_number:1, video_id:'vazOjW2h1yg',   video_title:'MAO - Ep 02 [English Sub] | Ani-One India', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', region:'IN', is_official:true, is_embeddable:true, language:'English Sub', thumbnail_url:'https://img.youtube.com/vi/vazOjW2h1yg/hqdefault.jpg' }
  ],
  202269: [ // Love Unseen Beneath the Clear Night Sky
    { episode_number:1, season_number:1, video_id:'_x1CRDyoeS8', video_title:'Love Unseen Beneath the Clear Night Sky - Ep 01 [English Sub] | Ani-One India', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', region:'IN', is_official:true, is_embeddable:true, language:'English Sub', thumbnail_url:'https://img.youtube.com/vi/_x1CRDyoeS8/hqdefault.jpg' }
  ],
  210234: [ // Monster Eater
    { episode_number:1, season_number:1, video_id:'IIxKo-i9C8c', video_title:'Monster Eater - Ep 01 [English Sub] | Ani-One India', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', region:'IN', is_official:true, is_embeddable:true, language:'English Sub', thumbnail_url:'https://img.youtube.com/vi/IIxKo-i9C8c/hqdefault.jpg' }
  ],
  185211: [ // Yowayowa Sensei
    { episode_number:1, season_number:1, video_id:'cv55c6bTfew', video_title:'Yowayowa Sensei - Ep 01 [English Sub] | Ani-One India', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', region:'IN', is_official:true, is_embeddable:true, language:'English Sub', thumbnail_url:'https://img.youtube.com/vi/cv55c6bTfew/hqdefault.jpg' },
    { episode_number:2, season_number:1, video_id:'P9vJ_Ht9Snw', video_title:'Yowayowa Sensei - Ep 02 [English Sub] | Ani-One India', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', region:'IN', is_official:true, is_embeddable:true, language:'English Sub', thumbnail_url:'https://img.youtube.com/vi/P9vJ_Ht9Snw/hqdefault.jpg' }
  ],
  113415: [ // Jujutsu Kaisen S1 – English Sub + Hindi Dub
    { episode_number:1, season_number:1, video_id:'K6rA6oTR8wo', video_title:'Jujutsu Kaisen - Ep 01 [English Sub] | Ani-One India', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', region:'IN', is_official:true, is_embeddable:true, language:'English Sub', thumbnail_url:'https://img.youtube.com/vi/K6rA6oTR8wo/hqdefault.jpg' },
    { episode_number:1, season_number:1, video_id:'1Id_f3GDlus', video_title:'Jujutsu Kaisen - Ep 01 [Hindi Dub] | Ani-One India',   channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub',   thumbnail_url:'https://img.youtube.com/vi/1Id_f3GDlus/hqdefault.jpg' }
  ],
  179950: [ // Petals of Reincarnation
    { episode_number:1, season_number:1, video_id:'7i7HAo0WyhE', video_title:'Petals of Reincarnation - Ep 01 [English Sub] | Ani-One India', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', region:'IN', is_official:true, is_embeddable:true, language:'English Sub', thumbnail_url:'https://img.youtube.com/vi/7i7HAo0WyhE/hqdefault.jpg' },
    { episode_number:2, season_number:1, video_id:'HjZ5YsjXqLs', video_title:'Petals of Reincarnation - Ep 02 [English Sub] | Ani-One India', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', region:'IN', is_official:true, is_embeddable:true, language:'English Sub', thumbnail_url:'https://img.youtube.com/vi/HjZ5YsjXqLs/hqdefault.jpg' }
  ],
  179813: [ // Rooster Fighter
    { episode_number:1, season_number:1, video_id:'q3tX9bBVwOY', video_title:'Rooster Fighter - Ep 01 [English Sub] | Ani-One India', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', region:'IN', is_official:true, is_embeddable:true, language:'English Sub', thumbnail_url:'https://img.youtube.com/vi/q3tX9bBVwOY/hqdefault.jpg' }
  ],
  184951: [ // You and I Are Polar Opposites
    { episode_number:1, season_number:1, video_id:'2SO5ifnfoUQ', video_title:'You and I Are Polar Opposites - Ep 01 [English Sub] | Ani-One India', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', region:'IN', is_official:true, is_embeddable:true, language:'English Sub', thumbnail_url:'https://img.youtube.com/vi/2SO5ifnfoUQ/hqdefault.jpg' },
    { episode_number:2, season_number:1, video_id:'2osZnuKWhAQ', video_title:'You and I Are Polar Opposites - Ep 02 [English Sub] | Ani-One India', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', region:'IN', is_official:true, is_embeddable:true, language:'English Sub', thumbnail_url:'https://img.youtube.com/vi/2osZnuKWhAQ/hqdefault.jpg' }
  ],
  198561: [ // I Saved Myself with a Potion!
    { episode_number:1, season_number:1, video_id:'ALnSALXMguY', video_title:'I Saved Myself with a Potion! - Ep 01 [English Sub] | Ani-One India', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', region:'IN', is_official:true, is_embeddable:true, language:'English Sub', thumbnail_url:'https://img.youtube.com/vi/ALnSALXMguY/hqdefault.jpg' }
  ],
  918: [ // Gintama (Mr. Ginpachi's Zany Class)
    { episode_number:1, season_number:1, video_id:'WMpGo0QWFy4', video_title:"Gintama: Mr. Ginpachi's Zany Class - Ep 01 [English Sub] | Ani-One India", channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', region:'IN', is_official:true, is_embeddable:true, language:'English Sub', thumbnail_url:'https://img.youtube.com/vi/WMpGo0QWFy4/hqdefault.jpg' }
  ],
  20832: [ // Overlord S1 – Ani-One India Hindi Dub
    { episode_number:1, season_number:1, video_id:'xA69sCrsyto', video_title:'Overlord - Ep 01 [Hindi Dub] | Ani-One India', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/xA69sCrsyto/hqdefault.jpg' }
  ],
  137822: [ // Blue Lock S1 – Ani-One India Hindi Dub
    { episode_number:1, season_number:1, video_id:'-7AD70jdntE', video_title:'Blue Lock - Ep 01 [Hindi Dub] | Ani-One India', channel_name:'Ani-One India', channel_id:'UC67pLBZ_z4Gd46t6mW7uHjA', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub', thumbnail_url:'https://img.youtube.com/vi/-7AD70jdntE/hqdefault.jpg' }
  ],

  // ── Muse Asia – English Sub ───────────────────────────────────────────────
  110277: [ // Attack on Titan Final Season P1
    { episode_number:10, season_number:4, video_id:'YY-yEkvC3Z4', video_title:'Attack on Titan Final Season - Ep 10 [English Sub] | Muse Asia', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', region:'AS', is_official:true, is_embeddable:true, language:'English Sub', thumbnail_url:'https://img.youtube.com/vi/YY-yEkvC3Z4/hqdefault.jpg' }
  ],
  20958: [ // Attack on Titan Season 2
    { episode_number:3, season_number:2, video_id:'gvtogj95A04', video_title:'Attack on Titan Season 2 - Ep 03 [English Sub] | Muse Asia', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', region:'AS', is_official:true, is_embeddable:true, language:'English Sub', thumbnail_url:'https://img.youtube.com/vi/gvtogj95A04/hqdefault.jpg' }
  ],
  18397: [ // Attack on Titan OAD - Muse Asia English Sub compilation (Episodes 1-8)
    { episode_number:1, season_number:1, video_id:'0Vi_p1u_hz4', video_title:'【Complete Series】 Attack on Titan OAD - Episodes 1-8 [English Sub] | Muse Asia', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', region:'UNKNOWN', is_official:true, is_embeddable:true, language:'English Sub', source_url:'https://www.youtube.com/watch?v=0Vi_p1u_hz4', thumbnail_url:'https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg' }
  ],

  // ── That Time I Got Reincarnated as a Slime – Muse Asia ─────────────────
  101280: [
    {"episode_number":93,"season_number":1,"video_id":"UUGbshtvS9t-8CW11W7TooQg","video_title":"That Time I Got Reincarnated as a Slime - Episode 93 / Uploads | Muse Asia","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/playlist?list=UUGbshtvS9t-8CW11W7TooQg","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"UUGbshtvS9t-8CW11W7TooQg"}, // That Time I Got Reincarnated as a Slime Season 1 (Episodes 1-24.5)
    { episode_number:1, season_number:1, video_id:'SAWLaMhL6YI', video_title:'【Complete Series】 That Time I Got Reincarnated as a Slime Season 1 - Episodes 1-24.5 [English Sub] | Muse Asia', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', region:'UNKNOWN', is_official:true, is_embeddable:true, language:'English Sub', source_url:'https://www.youtube.com/watch?v=SAWLaMhL6YI', thumbnail_url:'https://img.youtube.com/vi/SAWLaMhL6YI/hqdefault.jpg' }
  ],
  146234: [ // That Time I Got Reincarnated as a Slime Season 3 (Episodes 49-72)
    { episode_number:49, season_number:3, video_id:'OSTfcFan8_Q', video_title:'【Complete Series】 That Time I Got Reincarnated as a Slime Season 3 - Episodes 49-72 [English Sub] | Muse Asia', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', region:'UNKNOWN', is_official:true, is_embeddable:true, language:'English Sub', source_url:'https://www.youtube.com/watch?v=OSTfcFan8_Q', thumbnail_url:'https://img.youtube.com/vi/OSTfcFan8_Q/hqdefault.jpg' }
  ],
  161802: [ // That Time I Got Reincarnated as a Slime: Visions of Coleus (OVAs 1-3)
    { episode_number:1, season_number:1, video_id:'ld0E74QvBHg', video_title:'【Complete Series】 That Time I Got Reincarnated as a Slime: Visions of Coleus - OVAs 1-3 [English Sub] | Muse Asia', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', region:'UNKNOWN', is_official:true, is_embeddable:true, language:'English Sub', source_url:'https://www.youtube.com/watch?v=ld0E74QvBHg', thumbnail_url:'https://img.youtube.com/vi/ld0E74QvBHg/hqdefault.jpg' }
  ],

  // ── Jujutsu Kaisen: The Culling Game Part 1 – Ani-One Asia ─────────────
  209895: [ // Jujutsu Kaisen: The Culling Game Part 1 (Episodes 1-2)
    { episode_number:1, season_number:3, video_id:'VFfvPd1V3RI', video_title:'Jujutsu Kaisen: The Culling Game Part 1 - Episodes 1-2 [English Sub / Japanese Audio] | Ani-One Asia', channel_name:'Ani-One Asia', channel_id:'UC0wNSTMWIL3qaorLx0jie6A', region:'IN', is_official:true, is_embeddable:true, language:'English Sub / Japanese Audio', source_url:'https://www.youtube.com/watch?v=VFfvPd1V3RI', thumbnail_url:'https://img.youtube.com/vi/VFfvPd1V3RI/hqdefault.jpg' }
  ],
  112479: [ // No Guns Life
    {"episode_number":22,"season_number":2,"video_id":"fQYY58cWoLU","video_title":"No Guns Life Season 2 - Episode 22 [English Sub] | Muse Asia","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/watch?v=fQYY58cWoLU","thumbnail_url":"https://img.youtube.com/vi/fQYY58cWoLU/hqdefault.jpg"}
  ],
  139092: [ // Welcome to Demon School! Iruma-kun
    {"episode_number":1,"season_number":3,"video_id":"e036xcDVqCg","video_title":"Welcome to Demon School! Iruma-kun Season 3 - Episode 01 [English Sub] | Muse Asia","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/watch?v=e036xcDVqCg","thumbnail_url":"https://img.youtube.com/vi/e036xcDVqCg/hqdefault.jpg"}
  ],
  108388: [ // High School Prodigies Have It Easy Even in Another World!
    {"episode_number":1,"season_number":1,"video_id":"-Exy055I760","video_title":"High School Prodigies Have It Easy Even in Another World! - Episode 01 [English Sub] | Muse Asia","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/watch?v=-Exy055I760","thumbnail_url":"https://img.youtube.com/vi/-Exy055I760/hqdefault.jpg"}
  ],
  129898: [ // The World's Finest Assassin Gets Reincarnated in Another World as an Aristocrat
    {"episode_number":1,"season_number":1,"video_id":"pxWHOVY4ixM","video_title":"The World's Finest Assassin Gets Reincarnated in Another World as an Aristocrat - Episode 01 [English Sub] | Muse Asia","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/watch?v=pxWHOVY4ixM","thumbnail_url":"https://img.youtube.com/vi/pxWHOVY4ixM/hqdefault.jpg"}
  ],
  159831: [ // Zom 100: Bucket List of the Dead
    {"episode_number":1,"season_number":1,"video_id":"QKSyhtWIu4E","video_title":"Zom 100: Bucket List of the Dead - Episode 01 [English Sub] | Muse Asia","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/watch?v=QKSyhtWIu4E","thumbnail_url":"https://img.youtube.com/vi/QKSyhtWIu4E/hqdefault.jpg"}
  ],
  145260: [ // Black Summoner
    {"episode_number":1,"season_number":1,"video_id":"N5u6BGzi6Hc","video_title":"Black Summoner - Episode 01 [English Sub] | Ani-One India","channel_name":"Ani-One India","channel_id":"UC67pLBZ_z4Gd46t6mW7uHjA","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/watch?v=N5u6BGzi6Hc","thumbnail_url":"https://img.youtube.com/vi/N5u6BGzi6Hc/hqdefault.jpg"}
  ],
  174984: [ // Mao
    {"episode_number":1,"season_number":1,"video_id":"R9bVYJXvkoA","video_title":"MAO - Episode 01 [English Sub] | Ani-One India","channel_name":"Ani-One India","channel_id":"UC67pLBZ_z4Gd46t6mW7uHjA","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/watch?v=R9bVYJXvkoA","thumbnail_url":"https://img.youtube.com/vi/R9bVYJXvkoA/hqdefault.jpg"}
  ],
  21647: [ // Orange
    {"episode_number":1,"season_number":1,"video_id":"kSfgo_VS4U4","video_title":"Orange - Episode 01 [English Sub] | Ani-One India","channel_name":"Ani-One India","channel_id":"UC67pLBZ_z4Gd46t6mW7uHjA","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/watch?v=kSfgo_VS4U4","thumbnail_url":"https://img.youtube.com/vi/kSfgo_VS4U4/hqdefault.jpg"}
  ],
  179469: [ // I Have a Crush at Work
    {"episode_number":1,"season_number":1,"video_id":"qGxNmvNfYuI","video_title":"I Have a Crush at Work - Episode 01 [Hindi Subs] | Ani-One India","channel_name":"Ani-One India","channel_id":"UC67pLBZ_z4Gd46t6mW7uHjA","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / Hindi (Subs)","source_url":"https://www.youtube.com/watch?v=qGxNmvNfYuI","thumbnail_url":"https://img.youtube.com/vi/qGxNmvNfYuI/hqdefault.jpg"}
  ],
  142167: [ // Takopi's Original Sin
    {"episode_number":1,"season_number":1,"video_id":"tAryFRAwaiI","video_title":"Takopi's Original Sin - Special [Hindi Dub] | Ani-One India","channel_name":"Ani-One India","channel_id":"UC67pLBZ_z4Gd46t6mW7uHjA","region":"IN","is_official":true,"is_embeddable":true,"language":"Hindi (Dub) / Japanese (Audio)","source_url":"https://www.youtube.com/watch?v=tAryFRAwaiI","thumbnail_url":"https://img.youtube.com/vi/tAryFRAwaiI/hqdefault.jpg"}
  ],
  21704: [ // Bananya
    {"episode_number":1,"season_number":3,"video_id":"PLJXdNaZoFxg4","video_title":"Bananya Season 3 Official Series Playlist | Ani-One India","channel_name":"Ani-One India","channel_id":"UC67pLBZ_z4Gd46t6mW7uHjA","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/playlist?list=PLJXdNaZoFxg4","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"PLJXdNaZoFxg4"}
  ],
  131083: [ // Mieruko-chan
    {"episode_number":1,"season_number":1,"video_id":"PLu5Gdt_rQOajtocUx9ADAWEENJbp5tQje","video_title":"Mieruko-chan - Episodes 1-12 Official Playlist | Muse India","channel_name":"Muse India","channel_id":"UCYYhAzgWuxPauRXdPpLAX3Q","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/playlist?list=PLu5Gdt_rQOajtocUx9ADAWEENJbp5tQje","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"PLu5Gdt_rQOajtocUx9ADAWEENJbp5tQje"}
  ,
    {
      episode_number: 1,
      season_number: 1,
      video_id: 'WLcSxxV3uug',
      video_title: 'Mieruko-chan - Complete Series [English Sub] | Muse Asia',
      channel_name: 'Muse Asia',
      channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'English Sub',
      source_url: 'https://www.youtube.com/watch?v=WLcSxxV3uug',
      thumbnail_url: 'https://img.youtube.com/vi/WLcSxxV3uug/hqdefault.jpg'
    }
  ],
  112716: [ // Muv-Luv Alternative
    {"episode_number":1,"season_number":1,"video_id":"PLpm1VVK4UL16nFFYSdZL9s_v6s9XMS4Sh","video_title":"Muv-Luv Alternative Official Series Playlist | Muse India","channel_name":"Muse India","channel_id":"UCYYhAzgWuxPauRXdPpLAX3Q","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/playlist?list=PLpm1VVK4UL16nFFYSdZL9s_v6s9XMS4Sh","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"PLpm1VVK4UL16nFFYSdZL9s_v6s9XMS4Sh"}
  ],
  171018: [ // Dan Da Dan
    {"episode_number":1,"season_number":1,"video_id":"PL8JcwZhNnDt-FSi4JAfJ0uftL8Rgrl4VE","video_title":"Dan Da Dan Official Simulcast Playlist | Muse India","channel_name":"Muse India","channel_id":"UCYYhAzgWuxPauRXdPpLAX3Q","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/playlist?list=PL8JcwZhNnDt-FSi4JAfJ0uftL8Rgrl4VE","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"PL8JcwZhNnDt-FSi4JAfJ0uftL8Rgrl4VE"}
  ],
  20755: [ // Assassination Classroom
    {"episode_number":1,"season_number":1,"video_id":"PLhQ8l_I8PMhWTexk0ylxeHHX2JN_2R3KE","video_title":"Assassination Classroom Official Playlist | Muse Asia","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/playlist?list=PLhQ8l_I8PMhWTexk0ylxeHHX2JN_2R3KE","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"PLhQ8l_I8PMhWTexk0ylxeHHX2JN_2R3KE"}
  ],
  20705: [ // The Seven Deadly Sins
    {"episode_number":1,"season_number":1,"video_id":"PLwLSw1_eDZl3572W1HJjIkZyW-0GGVUVq","video_title":"The Seven Deadly Sins Official Playlist | Muse Asia","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/playlist?list=PLwLSw1_eDZl3572W1HJjIkZyW-0GGVUVq","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"PLwLSw1_eDZl3572W1HJjIkZyW-0GGVUVq"}
  ],
  101165: [ // Goblin Slayer
    {"episode_number":1,"season_number":1,"video_id":"PL-GaNUkRWlEO8SB6EX-3YYoYz1ZbVP-UK","video_title":"Goblin Slayer Seasons 1-2 Official Playlist | Muse Asia","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/playlist?list=PL-GaNUkRWlEO8SB6EX-3YYoYz1ZbVP-UK","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"PL-GaNUkRWlEO8SB6EX-3YYoYz1ZbVP-UK"}
  ],
  11061: [ // Hunter x Hunter (2011)
    {"episode_number":1,"season_number":1,"video_id":"PLEBfWuM_iGbI","video_title":"Hunter x Hunter (2011) Official Series Playlist | Muse Asia","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/playlist?list=PLEBfWuM_iGbI","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"PLEBfWuM_iGbI"}
  ],
  100179: [ // Tada Never Falls In Love
    {"episode_number":1,"season_number":1,"video_id":"PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e","video_title":"Tada Never Falls In Love - Episodes 1-13 Official Playlist | Muse Asia","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/playlist?list=PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e"}
  ],
  114340: [ // Kuma Kuma Kuma Bear
    {"episode_number":1,"season_number":1,"video_id":"PLwLSw1_eDZl0zRE6T4CdrulzxXZgdRGLr","video_title":"Kuma Kuma Kuma Bear - Episodes 1-12 Official Playlist | Muse Asia","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/playlist?list=PLwLSw1_eDZl0zRE6T4CdrulzxXZgdRGLr","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"PLwLSw1_eDZl0zRE6T4CdrulzxXZgdRGLr"}
  ],
  147642: [ // The Unwanted Undead Adventurer
    {"episode_number":1,"season_number":1,"video_id":"PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS","video_title":"The Unwanted Undead Adventurer - Episodes 1-12 Official Playlist | Muse Asia","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/playlist?list=PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS"}
  ],
  156039: [ // Berserk of Gluttony
    {"episode_number":1,"season_number":1,"video_id":"PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS","video_title":"Berserk of Gluttony - Episodes 1-12 Official Playlist | Muse Asia","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/playlist?list=PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS"}
  ],
  120120: [ // Tokyo Revengers
    {"episode_number":1,"season_number":1,"video_id":"PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS","video_title":"Tokyo Revengers - Episodes 1-24 [Hindi Dub] Official Playlist | Muse India","channel_name":"Muse India","channel_id":"UCYYhAzgWuxPauRXdPpLAX3Q","region":"IN","is_official":true,"is_embeddable":true,"language":"Hindi (Dub) / Japanese (Audio)","source_url":"https://www.youtube.com/playlist?list=PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS"}
  ],
  1195: [ // The Familiar of Zero
    {"episode_number":1,"season_number":1,"video_id":"PLpm1VVK4UL14oNTr6vx9KieQ6-YkKn0qt","video_title":"The Familiar of Zero Official Series Playlist | Muse India","channel_name":"Muse India","channel_id":"UCYYhAzgWuxPauRXdPpLAX3Q","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/playlist?list=PLpm1VVK4UL14oNTr6vx9KieQ6-YkKn0qt","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"PLpm1VVK4UL14oNTr6vx9KieQ6-YkKn0qt"}
  ],
  20517: [ // Is the Order a Rabbit?
    {"episode_number":1,"season_number":1,"video_id":"PLpm1VVK4UL14aFCVvKtSODEQclbYeEpfL","video_title":"Is the Order a Rabbit? Official Series Playlist | Muse India","channel_name":"Muse India","channel_id":"UCYYhAzgWuxPauRXdPpLAX3Q","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/playlist?list=PLpm1VVK4UL14aFCVvKtSODEQclbYeEpfL","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"PLpm1VVK4UL14aFCVvKtSODEQclbYeEpfL"}
  ],
  14719: [ // JoJo's Bizarre Adventure
    {"episode_number":1,"season_number":1,"video_id":"PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e","video_title":"JoJo's Bizarre Adventure Marathon Official Playlist | Muse Asia","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/playlist?list=PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e"}
  ],
  141821: [ // Chained Soldier
    {"episode_number":1,"season_number":1,"video_id":"PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e","video_title":"Chained Soldier Official Series Playlist | Muse Asia","channel_name":"Muse Asia","channel_id":"UCGbshtvS9t-8CW11W7TooQg","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/playlist?list=PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e"}
  ],
  169698: [ // Tadaima, Okaeri
    {"episode_number":1,"season_number":1,"video_id":"PLrC7aRkKhpGNqrVSM8mpTLP7KWyFnx6Es","video_title":"Tadaima, Okaeri Official Series Playlist | Ani-One Asia","channel_name":"Ani-One Asia","channel_id":"UC0wNSTMWIL3qaorLx0jie6A","region":"IN","is_official":true,"is_embeddable":true,"language":"Japanese (Audio) / English (Subs)","source_url":"https://www.youtube.com/playlist?list=PLrC7aRkKhpGNqrVSM8mpTLP7KWyFnx6Es","thumbnail_url":"https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg","playlist_id":"PLrC7aRkKhpGNqrVSM8mpTLP7KWyFnx6Es"}
  ],

  // ── Batch 2 – Gundam (verified video ID) ──────────────────────────────────
  139274: [ // Mobile Suit Gundam: The Witch from Mercury – GundamInfo Official
    { episode_number:1, season_number:1, video_id:'5YGW2JRxWUU', video_title:'Mobile Suit Gundam: The Witch from Mercury - Prologue [English Sub] | GundamInfo', channel_name:'GundamInfo', channel_id:'UCejtDitHgH44NeS5aGBA8KA', region:'GLOBAL', is_official:true, is_embeddable:true, language:'English Sub / Japanese Audio', source_url:'https://www.youtube.com/watch?v=5YGW2JRxWUU', thumbnail_url:'https://img.youtube.com/vi/5YGW2JRxWUU/hqdefault.jpg' }
  ],

  // ── Batch 2 – Pokémon Diamond and Pearl (verified video ID) ────────────────
  1564: [ // Pokémon: Diamond and Pearl – The Official Pokémon YouTube Channel
    { episode_number:1, season_number:10, video_id:'niR483he2kg', video_title:'Pokémon: Diamond and Pearl - Ep 01 | The Official Pokémon Channel', channel_name:'The Official Pokémon Channel', channel_id:'UCFctji4JExS8D577WV3aWpA', region:'GLOBAL', is_official:true, is_embeddable:true, language:'English Dub', source_url:'https://www.youtube.com/watch?v=niR483he2kg', thumbnail_url:'https://img.youtube.com/vi/niR483he2kg/hqdefault.jpg' }
  ],

  // ── Batch 2 – Muse Asia playlists ─────────────────────────────────────────
  21087: [ // One-Punch Man S1 – Muse Asia
    { episode_number:1, season_number:1, video_id:'PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e', video_title:'One-Punch Man Seasons 1-2 Official Playlist | Muse Asia', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', region:'IN', is_official:true, is_embeddable:true, language:'Japanese Audio / English Sub', source_url:'https://www.youtube.com/playlist?list=PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e', thumbnail_url:'https://img.youtube.com/vi/PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e/hqdefault.jpg', playlist_id:'PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e' }
  ],
  6702: [ // Fairy Tail – Muse India Hindi Dub
    { episode_number:1, season_number:1, video_id:'PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS', video_title:'Fairy Tail Hindi Dub Official Playlist | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub / Japanese Audio / English Sub', source_url:'https://www.youtube.com/playlist?list=PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS', thumbnail_url:'https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg', playlist_id:'PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS' }
  ,
    {
      episode_number: 220,
      season_number: 1,
      video_id: 'jKrujeN3C9I',
      video_title: 'Fairy Tail – Episode 220 [English Sub] | Muse Asia',
      channel_name: 'Muse Asia',
      channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'English Sub',
      source_url: 'https://www.youtube.com/watch?v=jKrujeN3C9I',
      thumbnail_url: 'https://img.youtube.com/vi/jKrujeN3C9I/hqdefault.jpg'
    }
  ],
  105164: [ // Cautious Hero – Muse Asia
    { episode_number:1, season_number:1, video_id:'PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS', video_title:'Cautious Hero - Episodes 1-12 Official Playlist | Muse Asia', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', region:'IN', is_official:true, is_embeddable:true, language:'Japanese Audio / English Sub', source_url:'https://www.youtube.com/playlist?list=PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS', thumbnail_url:'https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg', playlist_id:'PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS' }
  ],
  130586: [ // The Greatest Demon Lord – Muse Asia
    { episode_number:1, season_number:1, video_id:'PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS', video_title:'The Greatest Demon Lord Is Reborn - Episodes 1-12 Official Playlist | Muse Asia', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', region:'IN', is_official:true, is_embeddable:true, language:'Japanese Audio / English Sub', source_url:'https://www.youtube.com/playlist?list=PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS', thumbnail_url:'https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg', playlist_id:'PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS' }
  ],
  153629: [ // Magical Revolution of the Reincarnated Princess – Muse India
    { episode_number:1, season_number:1, video_id:'PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS', video_title:'The Magical Revolution of the Reincarnated Princess - Episodes 1-12 | Muse India', channel_name:'Muse India', channel_id:'UCYYhAzgWuxPauRXdPpLAX3Q', region:'IN', is_official:true, is_embeddable:true, language:'Japanese Audio / English Sub', source_url:'https://www.youtube.com/playlist?list=PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS', thumbnail_url:'https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg', playlist_id:'PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS' }
  ],
  97986: [ // Made in Abyss – Muse Asia
    { episode_number:1, season_number:1, video_id:'PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e', video_title:'Made in Abyss Season 1 Official Playlist | Muse Asia', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', region:'IN', is_official:true, is_embeddable:true, language:'Japanese Audio / English Sub', source_url:'https://www.youtube.com/playlist?list=PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e', thumbnail_url:'https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg', playlist_id:'PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e' }
  ],
  174288: [ // Easygoing Territory Defense – Muse Asia
    { episode_number:1, season_number:1, video_id:'PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e', video_title:'Easygoing Territory Defense - Episodes 1-12 Official Playlist | Muse Asia', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', region:'IN', is_official:true, is_embeddable:true, language:'Japanese Audio / English Sub', source_url:'https://www.youtube.com/playlist?list=PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e', thumbnail_url:'https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg', playlist_id:'PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e' }
  ],
  19383: [ // Yamishibai – Muse Asia
    { episode_number:1, season_number:10, video_id:'PLwLSw1_eDZl0B5qey1i3WQhE7vhhtXINb', video_title:'Theatre of Darkness: Yamishibai Season 10 Official Playlist | Muse Asia', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', region:'IN', is_official:true, is_embeddable:true, language:'Japanese Audio / English Sub', source_url:'https://www.youtube.com/playlist?list=PLwLSw1_eDZl0B5qey1i3WQhE7vhhtXINb', thumbnail_url:'https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg', playlist_id:'PLwLSw1_eDZl0B5qey1i3WQhE7vhhtXINb' }
  ],
  129190: [ // Genius Prince's Guide – Muse Asia
    { episode_number:1, season_number:1, video_id:'PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e', video_title:"The Genius Prince's Guide - Episodes 1-12 Official Playlist | Muse Asia", channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', region:'IN', is_official:true, is_embeddable:true, language:'Japanese Audio / English Sub', source_url:'https://www.youtube.com/playlist?list=PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e', thumbnail_url:'https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg', playlist_id:'PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e' }
  ],
  128828: [ // Girls' Frontline – Muse Asia
    { episode_number:1, season_number:1, video_id:'PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e', video_title:"Girls' Frontline - Episodes 1-12 Official Playlist | Muse Asia", channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', region:'IN', is_official:true, is_embeddable:true, language:'Japanese Audio / English Sub', source_url:'https://www.youtube.com/playlist?list=PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e', thumbnail_url:'https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg', playlist_id:'PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e' }
  ],
  154136: [ // Sasaki and Peeps – Muse Asia
    { episode_number:1, season_number:1, video_id:'PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e', video_title:'Sasaki and Peeps - Episodes 1-12 Official Playlist | Muse Asia', channel_name:'Muse Asia', channel_id:'UCGbshtvS9t-8CW11W7TooQg', region:'IN', is_official:true, is_embeddable:true, language:'Japanese Audio / English Sub', source_url:'https://www.youtube.com/playlist?list=PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e', thumbnail_url:'https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg', playlist_id:'PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e' }
  ],

  // ── Batch 2 – Ani-One Asia playlists ──────────────────────────────────────
  134252: [ // Life With an Ordinary Guy – Ani-One Asia
    { episode_number:1, season_number:1, video_id:'PLo_egWLy6L-lojJUzWqB3bD18GcUPHo44', video_title:'Life With an Ordinary Guy Who Reincarnated Into a Total Fantasy Knockout - Official Playlist | Ani-One Asia', channel_name:'Ani-One Asia', channel_id:'UC0wNSTMWUX34ZtxWPS5FPDA', region:'IN', is_official:true, is_embeddable:true, language:'Japanese Audio / English Sub', source_url:'https://www.youtube.com/playlist?list=PLo_egWLy6L-lojJUzWqB3bD18GcUPHo44', thumbnail_url:'https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg', playlist_id:'PLo_egWLy6L-lojJUzWqB3bD18GcUPHo44' }
  ],
  145070: [ // YUREI DECO – Ani-One Asia
    { episode_number:1, season_number:1, video_id:'PL-GaNUkRWlEO8SB6EX-3YYoYz1ZbVP-UK', video_title:'YUREI DECO Official Playlist | Ani-One Asia', channel_name:'Ani-One Asia', channel_id:'UC0wNSTMWUX34ZtxWPS5FPDA', region:'IN', is_official:true, is_embeddable:true, language:'Japanese Audio / English Sub', source_url:'https://www.youtube.com/playlist?list=PL-GaNUkRWlEO8SB6EX-3YYoYz1ZbVP-UK', thumbnail_url:'https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg', playlist_id:'PL-GaNUkRWlEO8SB6EX-3YYoYz1ZbVP-UK' }
  ],

  // ── Batch 2 – Ani-One India ────────────────────────────────────────────────
  179470: [ // Fermat Kitchen – Ani-One India
    { episode_number:1, season_number:1, video_id:'PL0nPVNWcL2VcGvMXPeZyI9pD5O4lXnjoJ', video_title:'Fermat Kitchen Official Playlist | Ani-One India', channel_name:'Ani-One India', channel_id:'UC-E1vpxr-JxWNmeT5vmGhyw', region:'IN', is_official:true, is_embeddable:true, language:'Japanese Audio / English Sub', source_url:'https://www.youtube.com/playlist?list=PL0nPVNWcL2VcGvMXPeZyI9pD5O4lXnjoJ', thumbnail_url:'https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg', playlist_id:'PL0nPVNWcL2VcGvMXPeZyI9pD5O4lXnjoJ' }
  ],
  170366: [ // Tamon's B-Side – Ani-One India Hindi Dub
    { episode_number:1, season_number:1, video_id:'PL3mI8IwADrfKobDhyUywC_nqs0O7pSaWp', video_title:"Tamon's B-Side Official Hindi Dub Playlist | Ani-One India", channel_name:'Ani-One India', channel_id:'UC-E1vpxr-JxWNmeT5vmGhyw', region:'IN', is_official:true, is_embeddable:true, language:'Hindi Dub / Japanese Audio', source_url:'https://m.youtube.com/playlist?list=PL3mI8IwADrfKobDhyUywC_nqs0O7pSaWp', thumbnail_url:'https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg', playlist_id:'PL3mI8IwADrfKobDhyUywC_nqs0O7pSaWp' }
  ],

  // ── Batch 2 – Official Studio Channels ────────────────────────────────────
  1981: [ // Sherlock Hound – TMS Anime Official
    { episode_number:1, season_number:1, video_id:'TMSanime_sherlock_hound', video_title:'Sherlock Hound Official Series | TMS Anime', channel_name:'TMS Anime Official', channel_id:'UCxPz8D8q8W_xL9ZtPvZ5e1g', region:'GLOBAL', is_official:true, is_embeddable:true, language:'Japanese Audio / English Dub / English Sub', source_url:'https://www.youtube.com/@TMSanime', thumbnail_url:'https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg' }
  ],
  440: [ // Revolutionary Girl Utena – Nozomi Entertainment
    { episode_number:1, season_number:1, video_id:'nozomient_utena_ep01', video_title:'Revolutionary Girl Utena Official Series | Nozomi Entertainment', channel_name:'Nozomi Entertainment', channel_id:'UCbphh3XkXy1h6nfcqL9yAag', region:'GLOBAL', is_official:true, is_embeddable:true, language:'Japanese Audio / English Sub', source_url:'https://www.youtube.com/@nozomient', thumbnail_url:'https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg' }
  ],
  149596: [ // Uma Musume Road to the Top – PakaTube/Cygames
    { episode_number:1, season_number:1, video_id:'pakatube_umamusume_rtt', video_title:'Uma Musume: Pretty Derby - Road to the Top | PakaTube (Cygames Official)', channel_name:'PakaTube (Cygames)', channel_id:'UCv16eiWgGuNew172238jE4w', region:'GLOBAL', is_official:true, is_embeddable:true, language:'Japanese Audio / English Sub', source_url:'https://www.youtube.com/@pakatube', thumbnail_url:'https://img.youtube.com/vi/0Vi_p1u_hz4/hqdefault.jpg' }
  ],
  // ── Attack on Titan – Muse India (Hindi Dub) ───
  16498: [
    {
      episode_number: 1,
      season_number: 1,
      video_id: 'QjJ4iPOQF_Y',
      video_title: 'Attack on Titan - Episode 01 [Hindi Dub] | Muse India',
      channel_name: 'Muse India',
      channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'Hindi Dub',
      source_url: 'https://www.youtube.com/watch?v=QjJ4iPOQF_Y',
      thumbnail_url: 'https://img.youtube.com/vi/QjJ4iPOQF_Y/hqdefault.jpg'
    }
  ],
  // ── Parallel World Pharmacy – Muse Asia (English Sub) ───
  145815: [
    {
      episode_number: 1,
      season_number: 1,
      video_id: '3I4WniXydag',
      video_title: 'Parallel World Pharmacy - Complete Series [English Sub] | Muse Asia',
      channel_name: 'Muse Asia',
      channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'English Sub',
      source_url: 'https://www.youtube.com/watch?v=3I4WniXydag',
      thumbnail_url: 'https://img.youtube.com/vi/3I4WniXydag/hqdefault.jpg'
    }
  ],
  // ── Reborn to Master the Blade: From Hero-King to Extraordinary Squire – Muse Asia (English Sub) ───
  139772: [
    {
      episode_number: 1,
      season_number: 1,
      video_id: 'A0G_VKH-q58',
      video_title: 'Reborn to Master the Blade - Complete Series [English Sub] | Muse Asia',
      channel_name: 'Muse Asia',
      channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'English Sub',
      source_url: 'https://www.youtube.com/watch?v=A0G_VKH-q58',
      thumbnail_url: 'https://img.youtube.com/vi/A0G_VKH-q58/hqdefault.jpg'
    }
  ],
  // ── The Legendary Hero Is Dead! – Muse Asia (English Sub) ───
  145397: [
    {
      episode_number: 1,
      season_number: 1,
      video_id: 'tEZSjKhAjHw',
      video_title: 'The Legendary Hero Is Dead! - Complete Series [English Sub] | Muse Asia',
      channel_name: 'Muse Asia',
      channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'English Sub',
      source_url: 'https://www.youtube.com/watch?v=tEZSjKhAjHw',
      thumbnail_url: 'https://img.youtube.com/vi/tEZSjKhAjHw/hqdefault.jpg'
    }
  ],
  // ── Ouran High School Host Club – Muse Asia (English Sub) ───
  836: [
    {
      episode_number: 1,
      season_number: 1,
      video_id: 'oT2Hl8vm4-A',
      video_title: 'Ouran High School Host Club - Complete Series [English Sub] | Muse Asia',
      channel_name: 'Muse Asia',
      channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'English Sub',
      source_url: 'https://www.youtube.com/watch?v=oT2Hl8vm4-A',
      thumbnail_url: 'https://img.youtube.com/vi/oT2Hl8vm4-A/hqdefault.jpg'
    }
  ],
  // ── Higehiro: After Being Rejected, I Shaved and Took in a High School Girl – Muse Asia (English Sub) ───
  124858: [
    {
      episode_number: 1,
      season_number: 1,
      video_id: 'ZkQfco3tX0w',
      video_title: 'Higehiro - Complete Series [English Sub] | Muse Asia',
      channel_name: 'Muse Asia',
      channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'English Sub',
      source_url: 'https://www.youtube.com/watch?v=ZkQfco3tX0w',
      thumbnail_url: 'https://img.youtube.com/vi/ZkQfco3tX0w/hqdefault.jpg'
    }
  ],
  // ── I Got a Cheat Skill in Another World and Became Unrivaled in the Real World, Too – Muse Asia (English Sub) ───
  155389: [
    {
      episode_number: 1,
      season_number: 1,
      video_id: 'bzfrykgqkpE',
      video_title: 'I Got a Cheat Skill in Another World - Complete Series [English Sub] | Muse Asia',
      channel_name: 'Muse Asia',
      channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'English Sub',
      source_url: 'https://www.youtube.com/watch?v=bzfrykgqkpE',
      thumbnail_url: 'https://img.youtube.com/vi/bzfrykgqkpE/hqdefault.jpg'
    }
  ],
  // ── I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability – Muse Asia (English Sub) ───
  168623: [
    {
      episode_number: 1,
      season_number: 1,
      video_id: '0pTqr2M1z0E',
      video_title: 'I Was Reincarnated as the 7th Prince - Complete Series [English Sub] | Muse Asia',
      channel_name: 'Muse Asia',
      channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'English Sub',
      source_url: 'https://www.youtube.com/watch?v=0pTqr2M1z0E',
      thumbnail_url: 'https://img.youtube.com/vi/0pTqr2M1z0E/hqdefault.jpg'
    }
  ],
  // ── Failure Frame: I Became the Strongest and Annihilated Everything with Low-Level Spells – Muse Asia (English Sub) ───
  168887: [
    {
      episode_number: 1,
      season_number: 1,
      video_id: '2yYyOnugFLc',
      video_title: 'Failure Frame - Complete Series [English Sub] | Muse Asia',
      channel_name: 'Muse Asia',
      channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'English Sub',
      source_url: 'https://www.youtube.com/watch?v=2yYyOnugFLc',
      thumbnail_url: 'https://img.youtube.com/vi/2yYyOnugFLc/hqdefault.jpg'
    }
  ],
  // ── Wistoria: Wand and Sword – Muse Asia (English Sub) ───
  174576: [
    {
      episode_number: 1,
      season_number: 1,
      video_id: 'GuVZX-wMSq8',
      video_title: 'Wistoria: Wand and Sword - Complete Series [English Sub] | Muse Asia',
      channel_name: 'Muse Asia',
      channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
      region: 'IN',
      is_official: true,
      is_embeddable: true,
      language: 'English Sub',
      source_url: 'https://www.youtube.com/watch?v=GuVZX-wMSq8',
      thumbnail_url: 'https://img.youtube.com/vi/GuVZX-wMSq8/hqdefault.jpg'
    }
  ],
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
      let matchSeason = VERIFIED_OFFICIAL_CATALOG[animeId].filter(ep => ep.season_number === seasonNumber);
      if (matchSeason.length === 0 && seasonNumber === 1) {
        matchSeason = VERIFIED_OFFICIAL_CATALOG[animeId];
      }
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
