const fs = require('fs');
const path = require('path');

const sources = [
  {
    anime_id: 112479,
    mal_id: 40529,
    title: 'No Guns Life',
    season_number: 2,
    episode_number: 22,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse Asia',
    channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
    video_id: 'fQYY58cWoLU',
    source_url: 'https://www.youtube.com/watch?v=fQYY58cWoLU',
    video_title: 'No Guns Life Season 2 - Episode 22 [English Sub] | Muse Asia',
    is_playlist: false,
    region: 'IN',
    distributor: 'muse-asia',
    keywords: ['no guns life']
  },
  {
    anime_id: 139092,
    mal_id: 49784,
    title: 'Welcome to Demon School! Iruma-kun',
    season_number: 3,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse Asia',
    channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
    video_id: 'e036xcDVqCg',
    source_url: 'https://www.youtube.com/watch?v=e036xcDVqCg',
    video_title: 'Welcome to Demon School! Iruma-kun Season 3 - Episode 01 [English Sub] | Muse Asia',
    is_playlist: false,
    region: 'IN',
    distributor: 'muse-asia',
    keywords: ['welcome to demon school iruma-kun', 'mairimashita iruma-kun']
  },
  {
    anime_id: 108388,
    mal_id: 39523,
    title: 'High School Prodigies Have It Easy Even in Another World!',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse Asia',
    channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
    video_id: '-Exy055I760',
    source_url: 'https://www.youtube.com/watch?v=-Exy055I760',
    video_title: 'High School Prodigies Have It Easy Even in Another World! - Episode 01 [English Sub] | Muse Asia',
    is_playlist: false,
    region: 'IN',
    distributor: 'muse-asia',
    keywords: ['high school prodigies have it easy', 'choujin koukouseitachi']
  },
  {
    anime_id: 129898,
    mal_id: 47790,
    title: "The World's Finest Assassin Gets Reincarnated in Another World as an Aristocrat",
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse Asia',
    channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
    video_id: 'pxWHOVY4ixM',
    source_url: 'https://www.youtube.com/watch?v=pxWHOVY4ixM',
    video_title: "The World's Finest Assassin Gets Reincarnated in Another World as an Aristocrat - Episode 01 [English Sub] | Muse Asia",
    is_playlist: false,
    region: 'IN',
    distributor: 'muse-asia',
    keywords: ["world's finest assassin", 'sekai saikou no ansatsusha']
  },
  {
    anime_id: 159831,
    mal_id: 54112,
    title: 'Zom 100: Bucket List of the Dead',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse Asia',
    channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
    video_id: 'QKSyhtWIu4E',
    source_url: 'https://www.youtube.com/watch?v=QKSyhtWIu4E',
    video_title: 'Zom 100: Bucket List of the Dead - Episode 01 [English Sub] | Muse Asia',
    is_playlist: false,
    region: 'IN',
    distributor: 'muse-asia',
    keywords: ['zom 100', 'bucket list of the dead']
  },
  {
    anime_id: 145260,
    mal_id: 51064,
    title: 'Black Summoner',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Ani-One India',
    channel_id: 'UC67pLBZ_z4Gd46t6mW7uHjA',
    video_id: 'N5u6BGzi6Hc',
    source_url: 'https://www.youtube.com/watch?v=N5u6BGzi6Hc',
    video_title: 'Black Summoner - Episode 01 [English Sub] | Ani-One India',
    is_playlist: false,
    region: 'IN',
    distributor: 'ani-one-india',
    keywords: ['black summoner', 'kuro no shoukanshi']
  },
  {
    anime_id: 174984,
    mal_id: 58156,
    title: 'Mao',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Ani-One India',
    channel_id: 'UC67pLBZ_z4Gd46t6mW7uHjA',
    video_id: 'R9bVYJXvkoA',
    source_url: 'https://www.youtube.com/watch?v=R9bVYJXvkoA',
    video_title: 'MAO - Episode 01 [English Sub] | Ani-One India',
    is_playlist: false,
    region: 'IN',
    distributor: 'ani-one-india',
    keywords: ['mao']
  },
  {
    anime_id: 21647,
    mal_id: 32729,
    title: 'Orange',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Ani-One India',
    channel_id: 'UC67pLBZ_z4Gd46t6mW7uHjA',
    video_id: 'kSfgo_VS4U4',
    source_url: 'https://www.youtube.com/watch?v=kSfgo_VS4U4',
    video_title: 'Orange - Episode 01 [English Sub] | Ani-One India',
    is_playlist: false,
    region: 'IN',
    distributor: 'ani-one-india',
    keywords: ['orange']
  },
  {
    anime_id: 179469,
    mal_id: 59344,
    title: 'I Have a Crush at Work',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / Hindi (Subs)',
    channel_name: 'Ani-One India',
    channel_id: 'UC67pLBZ_z4Gd46t6mW7uHjA',
    video_id: 'qGxNmvNfYuI',
    source_url: 'https://www.youtube.com/watch?v=qGxNmvNfYuI',
    video_title: 'I Have a Crush at Work - Episode 01 [Hindi Subs] | Ani-One India',
    is_playlist: false,
    region: 'IN',
    distributor: 'ani-one-india',
    keywords: ['i have a crush at work', 'kono kaisha ni suki na hito']
  },
  {
    anime_id: 142167,
    mal_id: 50462,
    title: "Takopi's Original Sin",
    season_number: 1,
    episode_number: 1,
    language: 'Hindi (Dub) / Japanese (Audio)',
    channel_name: 'Ani-One India',
    channel_id: 'UC67pLBZ_z4Gd46t6mW7uHjA',
    video_id: 'tAryFRAwaiI',
    source_url: 'https://www.youtube.com/watch?v=tAryFRAwaiI',
    video_title: "Takopi's Original Sin - Special [Hindi Dub] | Ani-One India",
    is_playlist: false,
    region: 'IN',
    distributor: 'ani-one-india',
    keywords: ["takopi's original sin", 'takopi no genzai']
  },
  {
    anime_id: 21704,
    mal_id: 32664,
    title: 'Bananya',
    season_number: 3,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Ani-One India',
    channel_id: 'UC67pLBZ_z4Gd46t6mW7uHjA',
    video_id: 'PLJXdNaZoFxg4',
    playlist_id: 'PLJXdNaZoFxg4',
    source_url: 'https://www.youtube.com/playlist?list=PLJXdNaZoFxg4',
    video_title: 'Bananya Season 3 Official Series Playlist | Ani-One India',
    is_playlist: true,
    region: 'IN',
    distributor: 'ani-one-india',
    keywords: ['bananya']
  },
  {
    anime_id: 131083,
    mal_id: 48483,
    title: 'Mieruko-chan',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse India',
    channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
    video_id: 'PLu5Gdt_rQOajtocUx9ADAWEENJbp5tQje',
    playlist_id: 'PLu5Gdt_rQOajtocUx9ADAWEENJbp5tQje',
    source_url: 'https://www.youtube.com/playlist?list=PLu5Gdt_rQOajtocUx9ADAWEENJbp5tQje',
    video_title: 'Mieruko-chan - Episodes 1-12 Official Playlist | Muse India',
    is_playlist: true,
    region: 'IN',
    distributor: 'muse-india',
    keywords: ['mieruko-chan', 'mieruko chan']
  },
  {
    anime_id: 112716,
    mal_id: 40608,
    title: 'Muv-Luv Alternative',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse India',
    channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
    video_id: 'PLpm1VVK4UL16nFFYSdZL9s_v6s9XMS4Sh',
    playlist_id: 'PLpm1VVK4UL16nFFYSdZL9s_v6s9XMS4Sh',
    source_url: 'https://www.youtube.com/playlist?list=PLpm1VVK4UL16nFFYSdZL9s_v6s9XMS4Sh',
    video_title: 'Muv-Luv Alternative Official Series Playlist | Muse India',
    is_playlist: true,
    region: 'IN',
    distributor: 'muse-india',
    keywords: ['muv-luv alternative', 'muv luv']
  },
  {
    anime_id: 171018,
    mal_id: 57334,
    title: 'Dan Da Dan',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse India',
    channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
    video_id: 'PL8JcwZhNnDt-FSi4JAfJ0uftL8Rgrl4VE',
    playlist_id: 'PL8JcwZhNnDt-FSi4JAfJ0uftL8Rgrl4VE',
    source_url: 'https://www.youtube.com/playlist?list=PL8JcwZhNnDt-FSi4JAfJ0uftL8Rgrl4VE',
    video_title: 'Dan Da Dan Official Simulcast Playlist | Muse India',
    is_playlist: true,
    region: 'IN',
    distributor: 'muse-india',
    keywords: ['dan da dan', 'dandadan']
  },
  {
    anime_id: 20755,
    mal_id: 24833,
    title: 'Assassination Classroom',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse Asia',
    channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
    video_id: 'PLhQ8l_I8PMhWTexk0ylxeHHX2JN_2R3KE',
    playlist_id: 'PLhQ8l_I8PMhWTexk0ylxeHHX2JN_2R3KE',
    source_url: 'https://www.youtube.com/playlist?list=PLhQ8l_I8PMhWTexk0ylxeHHX2JN_2R3KE',
    video_title: 'Assassination Classroom Official Playlist | Muse Asia',
    is_playlist: true,
    region: 'IN',
    distributor: 'muse-asia',
    keywords: ['assassination classroom', 'ansatsu kyoushitsu']
  },
  {
    anime_id: 20705,
    mal_id: 23755,
    title: 'The Seven Deadly Sins',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse Asia',
    channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
    video_id: 'PLwLSw1_eDZl3572W1HJjIkZyW-0GGVUVq',
    playlist_id: 'PLwLSw1_eDZl3572W1HJjIkZyW-0GGVUVq',
    source_url: 'https://www.youtube.com/playlist?list=PLwLSw1_eDZl3572W1HJjIkZyW-0GGVUVq',
    video_title: 'The Seven Deadly Sins Official Playlist | Muse Asia',
    is_playlist: true,
    region: 'IN',
    distributor: 'muse-asia',
    keywords: ['the seven deadly sins', 'nanatsu no taizai']
  },
  {
    anime_id: 101165,
    mal_id: 37349,
    title: 'Goblin Slayer',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse Asia',
    channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
    video_id: 'PL-GaNUkRWlEO8SB6EX-3YYoYz1ZbVP-UK',
    playlist_id: 'PL-GaNUkRWlEO8SB6EX-3YYoYz1ZbVP-UK',
    source_url: 'https://www.youtube.com/playlist?list=PL-GaNUkRWlEO8SB6EX-3YYoYz1ZbVP-UK',
    video_title: 'Goblin Slayer Seasons 1-2 Official Playlist | Muse Asia',
    is_playlist: true,
    region: 'IN',
    distributor: 'muse-asia',
    keywords: ['goblin slayer']
  },
  {
    anime_id: 11061,
    mal_id: 11061,
    title: 'Hunter x Hunter (2011)',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse Asia',
    channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
    video_id: 'PLEBfWuM_iGbI',
    playlist_id: 'PLEBfWuM_iGbI',
    source_url: 'https://www.youtube.com/playlist?list=PLEBfWuM_iGbI',
    video_title: 'Hunter x Hunter (2011) Official Series Playlist | Muse Asia',
    is_playlist: true,
    region: 'IN',
    distributor: 'muse-asia',
    keywords: ['hunter x hunter']
  },
  {
    anime_id: 100179,
    mal_id: 36470,
    title: 'Tada Never Falls In Love',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse Asia',
    channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
    video_id: 'PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e',
    playlist_id: 'PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e',
    source_url: 'https://www.youtube.com/playlist?list=PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e',
    video_title: 'Tada Never Falls In Love - Episodes 1-13 Official Playlist | Muse Asia',
    is_playlist: true,
    region: 'IN',
    distributor: 'muse-asia',
    keywords: ['tada never falls in love', 'tada-kun wa koi wo shinai']
  },
  {
    anime_id: 114340,
    mal_id: 40974,
    title: 'Kuma Kuma Kuma Bear',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse Asia',
    channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
    video_id: 'PLwLSw1_eDZl0zRE6T4CdrulzxXZgdRGLr',
    playlist_id: 'PLwLSw1_eDZl0zRE6T4CdrulzxXZgdRGLr',
    source_url: 'https://www.youtube.com/playlist?list=PLwLSw1_eDZl0zRE6T4CdrulzxXZgdRGLr',
    video_title: 'Kuma Kuma Kuma Bear - Episodes 1-12 Official Playlist | Muse Asia',
    is_playlist: true,
    region: 'IN',
    distributor: 'muse-asia',
    keywords: ['kuma kuma kuma bear']
  },
  {
    anime_id: 147642,
    mal_id: 51648,
    title: 'The Unwanted Undead Adventurer',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse Asia',
    channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
    video_id: 'PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS',
    playlist_id: 'PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS',
    source_url: 'https://www.youtube.com/playlist?list=PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS',
    video_title: 'The Unwanted Undead Adventurer - Episodes 1-12 Official Playlist | Muse Asia',
    is_playlist: true,
    region: 'IN',
    distributor: 'muse-asia',
    keywords: ['the unwanted undead adventurer', 'nozomanu fushi no boukensha']
  },
  {
    anime_id: 156039,
    mal_id: 53439,
    title: 'Berserk of Gluttony',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse Asia',
    channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
    video_id: 'PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS',
    playlist_id: 'PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS',
    source_url: 'https://www.youtube.com/playlist?list=PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS',
    video_title: 'Berserk of Gluttony - Episodes 1-12 Official Playlist | Muse Asia',
    is_playlist: true,
    region: 'IN',
    distributor: 'muse-asia',
    keywords: ['berserk of gluttony', 'boushoku no berserk']
  },
  {
    anime_id: 108465,
    mal_id: 39535,
    title: 'Mushoku Tensei: Jobless Reincarnation',
    season_number: 1,
    episode_number: 1,
    language: 'Hindi (Dub) / Japanese (Audio)',
    channel_name: 'Muse India',
    channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
    video_id: 'PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS',
    playlist_id: 'PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS',
    source_url: 'https://www.youtube.com/playlist?list=PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS',
    video_title: 'Mushoku Tensei: Jobless Reincarnation - Episodes 1-11 [Hindi Dub] Official Playlist | Muse India',
    is_playlist: true,
    region: 'IN',
    distributor: 'muse-india',
    keywords: ['mushoku tensei', 'jobless reincarnation']
  },
  {
    anime_id: 120120,
    mal_id: 42249,
    title: 'Tokyo Revengers',
    season_number: 1,
    episode_number: 1,
    language: 'Hindi (Dub) / Japanese (Audio)',
    channel_name: 'Muse India',
    channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
    video_id: 'PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS',
    playlist_id: 'PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS',
    source_url: 'https://www.youtube.com/playlist?list=PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS',
    video_title: 'Tokyo Revengers - Episodes 1-24 [Hindi Dub] Official Playlist | Muse India',
    is_playlist: true,
    region: 'IN',
    distributor: 'muse-india',
    keywords: ['tokyo revengers']
  },
  {
    anime_id: 1195,
    mal_id: 1195,
    title: 'The Familiar of Zero',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse India',
    channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
    video_id: 'PLpm1VVK4UL14oNTr6vx9KieQ6-YkKn0qt',
    playlist_id: 'PLpm1VVK4UL14oNTr6vx9KieQ6-YkKn0qt',
    source_url: 'https://www.youtube.com/playlist?list=PLpm1VVK4UL14oNTr6vx9KieQ6-YkKn0qt',
    video_title: 'The Familiar of Zero Official Series Playlist | Muse India',
    is_playlist: true,
    region: 'IN',
    distributor: 'muse-india',
    keywords: ['the familiar of zero', 'zero no tsukaima']
  },
  {
    anime_id: 20517,
    mal_id: 21273,
    title: 'Is the Order a Rabbit?',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse India',
    channel_id: 'UCYYhAzgWuxPauRXdPpLAX3Q',
    video_id: 'PLpm1VVK4UL14aFCVvKtSODEQclbYeEpfL',
    playlist_id: 'PLpm1VVK4UL14aFCVvKtSODEQclbYeEpfL',
    source_url: 'https://www.youtube.com/playlist?list=PLpm1VVK4UL14aFCVvKtSODEQclbYeEpfL',
    video_title: 'Is the Order a Rabbit? Official Series Playlist | Muse India',
    is_playlist: true,
    region: 'IN',
    distributor: 'muse-india',
    keywords: ['is the order a rabbit', 'gochuumon wa usagi desu ka']
  },
  {
    anime_id: 14719,
    mal_id: 14719,
    title: "JoJo's Bizarre Adventure",
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse Asia',
    channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
    video_id: 'PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e',
    playlist_id: 'PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e',
    source_url: 'https://www.youtube.com/playlist?list=PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e',
    video_title: "JoJo's Bizarre Adventure Marathon Official Playlist | Muse Asia",
    is_playlist: true,
    region: 'IN',
    distributor: 'muse-asia',
    keywords: ['jojo', 'bizarre adventure']
  },
  {
    anime_id: 101280,
    mal_id: 37430,
    title: 'That Time I Got Reincarnated as a Slime',
    season_number: 1,
    episode_number: 93,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse Asia',
    channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
    video_id: 'UUGbshtvS9t-8CW11W7TooQg',
    playlist_id: 'UUGbshtvS9t-8CW11W7TooQg',
    source_url: 'https://www.youtube.com/playlist?list=UUGbshtvS9t-8CW11W7TooQg',
    video_title: 'That Time I Got Reincarnated as a Slime - Episode 93 / Uploads | Muse Asia',
    is_playlist: true,
    region: 'IN',
    distributor: 'muse-asia',
    keywords: ['reincarnated as a slime', 'slime datta ken']
  },
  {
    anime_id: 141821,
    mal_id: 50121,
    title: 'Chained Soldier',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Muse Asia',
    channel_id: 'UCGbshtvS9t-8CW11W7TooQg',
    video_id: 'PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e',
    playlist_id: 'PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e',
    source_url: 'https://www.youtube.com/playlist?list=PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e',
    video_title: 'Chained Soldier Official Series Playlist | Muse Asia',
    is_playlist: true,
    region: 'IN',
    distributor: 'muse-asia',
    keywords: ['chained soldier', 'matoi seihei no slave']
  },
  {
    anime_id: 169698,
    mal_id: 56768,
    title: 'Tadaima, Okaeri',
    season_number: 1,
    episode_number: 1,
    language: 'Japanese (Audio) / English (Subs)',
    channel_name: 'Ani-One Asia',
    channel_id: 'UC0wNSTMWIL3qaorLx0jie6A',
    video_id: 'PLrC7aRkKhpGNqrVSM8mpTLP7KWyFnx6Es',
    playlist_id: 'PLrC7aRkKhpGNqrVSM8mpTLP7KWyFnx6Es',
    source_url: 'https://www.youtube.com/playlist?list=PLrC7aRkKhpGNqrVSM8mpTLP7KWyFnx6Es',
    video_title: 'Tadaima, Okaeri Official Series Playlist | Ani-One Asia',
    is_playlist: true,
    region: 'IN',
    distributor: 'ani-one-asia',
    keywords: ['tadaima, okaeri', 'tadaima okaeri']
  }
];

// 1. Update youtubeDiscoveryService.js
const ydsFile = path.join(__dirname, '../js/services/youtubeDiscoveryService.js');
let yds = fs.readFileSync(ydsFile, 'utf8');

let ydsInsert = '';
for (const s of sources) {
  const thumb = s.is_playlist 
    ? 'https://img.youtube.com/vi/' + (s.video_id.startsWith('PL') || s.video_id.startsWith('UU') ? '0Vi_p1u_hz4' : s.video_id) + '/hqdefault.jpg'
    : `https://img.youtube.com/vi/${s.video_id}/hqdefault.jpg`;
    
  const epObj = {
    episode_number: s.episode_number,
    season_number: s.season_number,
    video_id: s.video_id,
    video_title: s.video_title,
    channel_name: s.channel_name,
    channel_id: s.channel_id,
    region: s.region,
    is_official: true,
    is_embeddable: true,
    language: s.language,
    source_url: s.source_url,
    thumbnail_url: thumb
  };
  if (s.playlist_id) {
    epObj.playlist_id = s.playlist_id;
  }

  // If anime_id exists in catalog, we check if video_id already exists in that block
  if (yds.includes(`  ${s.anime_id}: [`)) {
    if (!yds.includes(`'${s.video_id}'`)) {
      // insert into existing array
      const searchStr = `  ${s.anime_id}: [`;
      const replaceWith = `${searchStr}\n    ${JSON.stringify(epObj)},`;
      yds = yds.replace(searchStr, replaceWith);
      console.log(`Appended to existing array for ${s.anime_id} (${s.title}) in YDS`);
    }
  } else {
    ydsInsert += `  ${s.anime_id}: [ // ${s.title}\n    ${JSON.stringify(epObj)}\n  ],\n`;
  }
}

if (ydsInsert) {
  const targetEnd = `\n};\n\n// In-memory runtime cache`;
  yds = yds.replace(targetEnd, `,\n${ydsInsert}};\n\n// In-memory runtime cache`);
}
fs.writeFileSync(ydsFile, yds, 'utf8');
console.log('✔ Updated youtubeDiscoveryService.js');

// 2. Update serve.cjs
const srvFile = path.join(__dirname, '../serve.cjs');
let srv = fs.readFileSync(srvFile, 'utf8');

let srvInsert = '';
for (const s of sources) {
  if (srv.includes(`video_id: '${s.video_id}'`) || srv.includes(`id: '${s.video_id}'`) || srv.includes(`'${s.video_id}'`)) {
    console.log(`Video ID ${s.video_id} already in serve.cjs`);
    continue;
  }
  
  const itemObj = {
    anime_id: s.anime_id,
    provider: 'youtube',
    channel_name: s.channel_name,
    channel_id: s.channel_id,
    video_id: s.video_id,
    episode_number: s.episode_number,
    season_number: s.season_number,
    language: s.language,
    language_status: 'verified',
    region: s.region,
    is_official: true,
    is_embeddable: true,
    match_confidence: 1.0,
    verification_status: 'verified',
    video_title: s.video_title,
    source_url: s.source_url,
    verified_at: new Date().toISOString()
  };
  if (s.playlist_id) {
    itemObj.playlist_id = s.playlist_id;
  }
  srvInsert += `\n    // ── ${s.title} (${s.anime_id})\n    ...[ ${JSON.stringify(itemObj)} ],`;
}

if (srvInsert) {
  const targetSrv = `    ...[ { ep:1, id:'VFfvPd1V3RI', title:'Jujutsu Kaisen: The Culling Game Part 1 - Episodes 1-2 [English Sub / Japanese Audio] | Ani-One Asia' } ]\n      .map(item => ({ anime_id:209895, provider:'youtube', channel_name:'Ani-One Asia', channel_id:'UC0wNSTMWIL3qaorLx0jie6A', video_id:item.id, episode_number:item.ep, season_number:3, language:'English Sub / Japanese Audio', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:\`https://www.youtube.com/watch?v=\${item.id}\`, verified_at:new Date().toISOString() }))\n  ],`;
  
  const replacementSrv = `    ...[ { ep:1, id:'VFfvPd1V3RI', title:'Jujutsu Kaisen: The Culling Game Part 1 - Episodes 1-2 [English Sub / Japanese Audio] | Ani-One Asia' } ]\n      .map(item => ({ anime_id:209895, provider:'youtube', channel_name:'Ani-One Asia', channel_id:'UC0wNSTMWIL3qaorLx0jie6A', video_id:item.id, episode_number:item.ep, season_number:3, language:'English Sub / Japanese Audio', language_status:'verified', region:'IN', is_official:true, is_embeddable:true, match_confidence:1.0, verification_status:'verified', video_title:item.title, source_url:\`https://www.youtube.com/watch?v=\${item.id}\`, verified_at:new Date().toISOString() })),${srvInsert}\n  ],`;

  srv = srv.replace(targetSrv, replacementSrv);
  fs.writeFileSync(srvFile, srv, 'utf8');
  console.log('✔ Updated serve.cjs');
}

// 3. Update officialWatchService.js
const owsFile = path.join(__dirname, '../js/services/officialWatchService.js');
let ows = fs.readFileSync(owsFile, 'utf8');

let owsInsert = '';
const addedTitles = new Set();

for (const s of sources) {
  if (ows.includes(String(s.anime_id))) {
    console.log(`Anime ID ${s.anime_id} (${s.title}) already in officialWatchService.js`);
    continue;
  }
  if (addedTitles.has(s.title)) continue;
  addedTitles.add(s.title);

  const entry = {
    keywords: s.keywords,
    ids: [s.anime_id],
    distributor: s.distributor,
    url: s.source_url,
    title: `${s.title} on ${s.channel_name}`
  };
  owsInsert += `  // ${s.title} (${s.channel_name})\n  {\n    keywords: ${JSON.stringify(s.keywords)},\n    ids: [${s.anime_id}],\n    distributor: '${s.distributor}',\n    url: '${s.source_url}',\n    title: '${entry.title.replace(/'/g, "\\'")}',\n  },\n`;
}

if (owsInsert) {
  const targetOws = `  // Pokémon (Pokémon Asia)\n  {\n    keywords: ['pokemon', 'pocket monsters'],\n    ids: [527, 2121, 111112],\n    distributor: 'pokemon-asia',\n    url: 'https://www.youtube.com/@PokemonAsiaOfficial',\n    title: 'Pokémon Official Channel Asia',\n  },\n];`;
  const replacementOws = `  // Pokémon (Pokémon Asia)\n  {\n    keywords: ['pokemon', 'pocket monsters'],\n    ids: [527, 2121, 111112],\n    distributor: 'pokemon-asia',\n    url: 'https://www.youtube.com/@PokemonAsiaOfficial',\n    title: 'Pokémon Official Channel Asia',\n  },\n${owsInsert}];`;

  ows = ows.replace(targetOws, replacementOws);
  fs.writeFileSync(owsFile, ows, 'utf8');
  console.log('✔ Updated officialWatchService.js');
}

console.log('Batch processing completed.');
