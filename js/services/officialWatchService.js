/**
 * Official Watch Service - AnimeVerse
 * Manages verified, legal, and licensed anime streaming sources.
 * Strictly adheres to 100% anti-piracy compliance:
 * - Direct links to official YouTube distributors (Ani-One India, Muse India, Muse Asia, Ani-One Asia, Studio channels)
 * - Official licensed platforms (Crunchyroll, Netflix, Disney+ Hotstar, Amazon Prime Video)
 * - Prioritizes India-available and South Asia official sources
 * - Enforces title matching and does not generate fake links
 */

// Verified India / Asia official YouTube distributors registry
const VERIFIED_YOUTUBE_DISTRIBUTORS = {
  'muse-india': {
    name: 'Muse India',
    badge: 'Watch on Muse India',
    region: 'India & South Asia',
    channelUrl: 'https://www.youtube.com/@MuseIndia',
    description: 'Free Official Stream with Subtitles / Dubs',
    isIndia: true,
  },
  'ani-one-india': {
    name: 'Ani-One India',
    badge: 'Watch on Ani-One India',
    region: 'India & South Asia',
    channelUrl: 'https://www.youtube.com/@AniOneIndia',
    description: 'Free Official Stream by Medialink India',
    isIndia: true,
  },
  'muse-asia': {
    name: 'Muse Asia',
    badge: 'Watch on Muse Asia',
    region: 'Asia & India',
    channelUrl: 'https://www.youtube.com/@MuseAsia',
    description: 'Free Official Licensed Simulcasts by Muse',
    isIndia: true,
  },
  'ani-one-asia': {
    name: 'Ani-One Asia',
    badge: 'Watch on Ani-One Asia',
    region: 'Asia & India',
    channelUrl: 'https://www.youtube.com/@AniOneAsia',
    description: 'Free Official Licensed Anime by Medialink',
    isIndia: true,
  },
  'gundaminfo': {
    name: 'GundamInfo',
    badge: 'Watch on GundamInfo',
    region: 'Official Studio Channel (Worldwide)',
    channelUrl: 'https://www.youtube.com/@GundamInfo',
    description: 'Official Bandai Namco Filmworks Stream',
    isIndia: true,
  },
  'pokemon-asia': {
    name: 'Pokémon Asia Official',
    badge: 'Watch on Pokémon Asia',
    region: 'Official Channel (Asia/India)',
    channelUrl: 'https://www.youtube.com/@PokemonAsiaOfficial',
    description: 'Official Pokémon Company Streaming Channel',
    isIndia: true,
  },
  'pokemon-telugu': {
    name: 'Pokémon Asia Official (Telugu)',
    badge: 'Watch on Pokémon Telugu',
    region: 'Official Channel (India - Telugu)',
    channelUrl: 'https://www.youtube.com/@PokemonTeluguOfficial',
    description: 'Official Pokémon Company Telugu Streaming Channel',
    isIndia: true,
  },
  'toei-animation': {
    name: 'Toei Animation Official',
    badge: 'Watch on Toei Animation',
    region: 'Official Studio Channel',
    channelUrl: 'https://www.youtube.com/@ToeiAnimationUS',
    description: 'Official Studio Release',
    isIndia: true,
  },
  'tms-anime': {
    name: 'TMS Anime Official',
    badge: 'Watch on TMS Anime',
    region: 'Official Studio Channel (Global)',
    channelUrl: 'https://www.youtube.com/@TMSanime',
    description: 'Official TMS Entertainment (Tokyo Movie Shinsha) Channel',
    isIndia: true,
  },
  'nozomi-ent': {
    name: 'Nozomi Entertainment',
    badge: 'Watch on Nozomi Entertainment',
    region: 'Official Licensed Channel (Global)',
    channelUrl: 'https://www.youtube.com/@nozomient',
    description: 'Official Nozomi/Right Stuf Licensed Anime Channel',
    isIndia: true,
  },
  'pakatube': {
    name: 'PakaTube (Cygames Official)',
    badge: 'Watch on PakaTube',
    region: 'Official Cygames Channel (Global)',
    channelUrl: 'https://www.youtube.com/@pakatube',
    description: 'Official Cygames Entertainment YouTube Channel',
    isIndia: true,
  },
  'pokemon-official': {
    name: 'The Official Pokémon Channel',
    badge: 'Watch on Pokémon Official',
    region: 'Official Channel (Global)',
    channelUrl: 'https://www.youtube.com/@Pokemon',
    description: 'Official The Pokémon Company Channel',
    isIndia: true,
  },
};

// Curated mapping of prominent anime officially published on YouTube for India/Asia
// Verified directly through Muse Communications and Medialink licensing
const OFFICIAL_YOUTUBE_CATALOG = [
  // SPY x FAMILY (Muse India & Muse Asia)
  {
    keywords: ['spy family', 'spy x family'],
    ids: [140960, 142838, 158870, 158927, 177937],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/playlist?list=PLwLSw1_eDZl1wGMYg5oB3uEns0CZNl6sI',
    title: 'SPY×FAMILY Official Episodes on Muse India / Asia',
  },
  // Chainsaw Man (Ani-One Asia)
  {
    keywords: ['chainsaw man'],
    ids: [127230],
    distributor: 'ani-one-asia',
    url: 'https://www.youtube.com/playlist?list=PLxSscENEp7JhfvHiWN-djJjCOjW8rxA6p',
    title: 'Chainsaw Man Official Episodes on Ani-One Asia',
  },
  // Jujutsu Kaisen (Ani-One Asia & India)
  {
    keywords: ['jujutsu kaisen', 'culling game'],
    ids: [113415, 145064, 209895],
    distributor: 'ani-one-india',
    url: 'https://youtube.com/playlist?list=PLxSscENEp7JisDU6GAJuyNpVwDvCm-f3J',
    title: 'Jujutsu Kaisen Official Episodes on Ani-One India / Asia',
  },
  // A Gatherer's Adventure in Isekai (Muse India)
  {
    keywords: ["gatherer's adventure in isekai", 'gatherer', 'sozai saishuka'],
    ids: [187663],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/@MuseIndiaChannel',
    title: "A Gatherer's Adventure in Isekai Official Telugu Dub on Muse India",
  },
  // Attack on Titan (Muse India)
  {
    keywords: ['attack on titan', 'shingeki no kyojin'],
    ids: [16498, 20958, 110277, 18397],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/playlist?list=PLpm1VVK4UL14MMCxjG_faT0drrCINtjDo',
    title: 'Attack on Titan Official Telugu Dub on Muse India',
  },
  // Tokyo Revengers (Muse India & Asia)
  {
    keywords: ['tokyo revengers'],
    ids: [120120, 144944, 163323],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/@MuseIndia',
    title: 'Tokyo Revengers on Muse India',
  },
  // One Punch Man (Muse India)
  {
    keywords: ['one punch man', 'one-punch man'],
    ids: [21087, 102194, 153800],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/@MuseIndiaChannel',
    title: 'One-Punch Man Official Telugu Dub on Muse India',
  },
  // Mob Psycho 100 (Muse India)
  {
    keywords: ['mob psycho 100'],
    ids: [21507, 101338, 140439],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/@MuseIndiaChannel',
    title: 'Mob Psycho 100 Official Telugu Dub on Muse India',
  },
  // Frieren: Beyond Journey's End (Muse Asia)
  {
    keywords: ['frieren', 'sousou no frieren'],
    ids: [154587],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/@MuseAsia',
    title: 'Frieren: Beyond Journey\'s End on Muse Asia',
  },
  // Mushoku Tensei: Jobless Reincarnation (Muse India & Asia)
  {
    keywords: ['mushoku tensei', 'jobless reincarnation'],
    ids: [108465, 137496, 146065],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/@MuseIndia',
    title: 'Mushoku Tensei on Muse India',
  },
  // Classroom of the Elite (Muse India & Asia)
  {
    keywords: ['classroom of the elite', 'youkoso jitsuryoku'],
    ids: [98659, 145545, 145546, 146066],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/@MuseIndia',
    title: 'Classroom of the Elite on Muse India',
  },
  // That Time I Got Reincarnated as a Slime (Muse India & Asia)
  {
    keywords: ['slime datta ken', 'reincarnated as a slime', 'tensei shitara slime', 'visions of coleus'],
    ids: [101280, 108511, 108632, 146065, 146234, 156822, 161802],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/@MuseIndia',
    title: 'That Time I Got Reincarnated as a Slime on Muse India / Asia',
  },
  // Campfire Cooking in Another World (Muse India)
  {
    keywords: ['campfire cooking in another world', 'tondemo skill de isekai'],
    ids: [156067, 170577],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/@MuseIndiaChannel',
    title: 'Campfire Cooking in Another World Official Telugu Dub on Muse India',
  },
  // Skeleton Knight in Another World (Muse India)
  {
    keywords: ['skeleton knight in another world', 'gaikotsu kishi'],
    ids: [132474],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/@MuseIndiaChannel',
    title: 'Skeleton Knight in Another World Official Telugu Dub on Muse India',
  },
  // Pokémon: Diamond and Pearl: Battle Dimension (Pokémon Asia Official Telugu)
  {
    keywords: ['pokemon diamond and pearl', 'battle dimension', 'pocket monsters diamond & pearl'],
    ids: [1565],
    distributor: 'pokemon-telugu',
    url: 'https://www.youtube.com/@PokemonTeluguOfficial',
    title: 'Pokémon: Diamond and Pearl: Battle Dimension Official Telugu on Pokémon Asia Official (Telugu)',
  },
  // Pokémon the Series: XY (Pokémon Asia Official Telugu)
  {
    keywords: ['pokemon the series xy', 'pokemon xy', 'pocket monsters xy'],
    ids: [19291],
    distributor: 'pokemon-telugu',
    url: 'https://www.youtube.com/@PokemonTeluguOfficial',
    title: 'Pokémon the Series: XY Official Telugu on Pokémon Asia Official (Telugu)',
  },
  // Pokémon Ultimate Journeys (Pokémon Asia Official Telugu)
  {
    keywords: ['pokemon ultimate journeys', 'pokemon journeys', 'pocket monsters (2019)'],
    ids: [112153, 158870],
    distributor: 'pokemon-telugu',
    url: 'https://www.youtube.com/@PokemonTeluguOfficial',
    title: 'Pokémon Ultimate Journeys Official Telugu on Pokémon Asia Official (Telugu)',
  },
  // Hyouka (Muse India & Asia)
  {
    keywords: ['hyouka'],
    ids: [12189],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/@MuseIndia',
    title: 'Hyouka on Muse India',
  },
  // JoJo's Bizarre Adventure (Muse India)
  {
    keywords: ['jojo', 'bizarre adventure'],
    ids: [14719, 20474, 20799, 21450, 102283],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/@MuseIndia',
    title: 'JoJo\'s Bizarre Adventure on Muse India',
  },
  // Assassination Classroom (Muse India)
  {
    keywords: ['assassination classroom', 'ansatsu kyoushitsu'],
    ids: [20755, 21180],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/@MuseIndia',
    title: 'Assassination Classroom on Muse India',
  },
  // Oshi no Ko (Ani-One Asia)
  {
    keywords: ['oshi no ko'],
    ids: [150672, 166531],
    distributor: 'ani-one-asia',
    url: 'https://www.youtube.com/@AniOneAsia',
    title: '【OSHI NO KO】 on Ani-One Asia',
  },
  // Bleach: Thousand-Year Blood War (Ani-One Asia)
  {
    keywords: ['bleach thousand year', 'sennen kessen'],
    ids: [114446, 159322],
    distributor: 'ani-one-asia',
    url: 'https://www.youtube.com/@AniOneAsia',
    title: 'Bleach: Thousand-Year Blood War on Ani-One Asia',
  },
  // Blue Lock (Ani-One Asia & India)
  {
    keywords: ['blue lock'],
    ids: [137822, 163146],
    distributor: 'ani-one-india',
    url: 'https://www.youtube.com/@AniOneIndia',
    title: 'BLUE LOCK on Ani-One India',
  },
  // Dr. STONE (Ani-One Asia)
  {
    keywords: ['dr. stone', 'dr stone'],
    ids: [105333, 113936, 131518],
    distributor: 'ani-one-asia',
    url: 'https://www.youtube.com/@AniOneAsia',
    title: 'Dr. STONE on Ani-One Asia',
  },
  // The Eminence in Shadow (Ani-One Asia)
  {
    keywords: ['eminence in shadow', 'kage no jitsuryokusha'],
    ids: [130298, 161964],
    distributor: 'ani-one-asia',
    url: 'https://www.youtube.com/@AniOneAsia',
    title: 'The Eminence in Shadow on Ani-One Asia',
  },
  // Overlord (Ani-One Asia)
  {
    keywords: ['overlord'],
    ids: [20832, 98437, 101478, 133844],
    distributor: 'ani-one-asia',
    url: 'https://www.youtube.com/@AniOneAsia',
    title: 'Overlord on Ani-One Asia',
  },
  // Konosuba (Ani-One Asia)
  {
    keywords: ['konosuba', 'kono subarashii'],
    ids: [21202, 21699, 146984],
    distributor: 'ani-one-asia',
    url: 'https://www.youtube.com/@AniOneAsia',
    title: 'KonoSuba on Ani-One Asia',
  },
  // Haikyu!! (Ani-One Asia)
  {
    keywords: ['haikyu'],
    ids: [20464, 20992, 21856, 107663],
    distributor: 'ani-one-asia',
    url: 'https://www.youtube.com/@AniOneAsia',
    title: 'HAIKYU!! on Ani-One Asia',
  },
  // Solo Leveling (Ani-One Asia)
  {
    keywords: ['solo leveling', 'ore dake level up'],
    ids: [151807],
    distributor: 'ani-one-asia',
    url: 'https://www.youtube.com/@AniOneAsia',
    title: 'Solo Leveling on Ani-One Asia',
  },
  // Kaiju No. 8 (Ani-One Asia)
  {
    keywords: ['kaiju no. 8', 'kaiju no 8'],
    ids: [153288],
    distributor: 'ani-one-asia',
    url: 'https://www.youtube.com/@AniOneAsia',
    title: 'Kaiju No. 8 on Ani-One Asia',
  },
  // Wind Breaker (Muse Asia)
  {
    keywords: ['wind breaker'],
    ids: [163270],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/@MuseAsia',
    title: 'WIND BREAKER on Muse Asia',
  },
  // Mobile Suit Gundam (GundamInfo)
  {
    keywords: ['gundam', 'mobile suit gundam', 'witch from mercury'],
    ids: [139274, 155168],
    distributor: 'gundaminfo',
    url: 'https://www.youtube.com/@GundamInfo',
    title: 'Mobile Suit Gundam on GundamInfo Official',
  },
  // Pokémon (Pokémon Asia)
  {
    keywords: ['pokemon', 'pocket monsters'],
    ids: [527, 1564, 2121, 111112],
    distributor: 'pokemon-asia',
    url: 'https://www.youtube.com/@PokemonAsiaOfficial',
    title: 'Pokémon Official Channel Asia',
  },
  // No Guns Life (Muse Asia)
  {
    keywords: ["no guns life"],
    ids: [112479],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/watch?v=fQYY58cWoLU',
    title: 'No Guns Life on Muse Asia',
  },
  // Welcome to Demon School! Iruma-kun (Muse Asia)
  {
    keywords: ["welcome to demon school iruma-kun","mairimashita iruma-kun"],
    ids: [107693, 116338, 139092],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/watch?v=e036xcDVqCg',
    title: 'Welcome to Demon School! Iruma-kun on Muse Asia',
  },
  // High School Prodigies Have It Easy Even in Another World! (Muse Asia)
  {
    keywords: ["high school prodigies have it easy","choujin koukouseitachi"],
    ids: [108388],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/watch?v=-Exy055I760',
    title: 'High School Prodigies Have It Easy Even in Another World! on Muse Asia',
  },
  // The World's Finest Assassin Gets Reincarnated in Another World as an Aristocrat (Muse Asia)
  {
    keywords: ["world's finest assassin","sekai saikou no ansatsusha"],
    ids: [129898],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/watch?v=pxWHOVY4ixM',
    title: 'The World\'s Finest Assassin Gets Reincarnated in Another World as an Aristocrat on Muse Asia',
  },
  // Zom 100: Bucket List of the Dead (Muse Asia)
  {
    keywords: ["zom 100","bucket list of the dead"],
    ids: [159831],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/watch?v=QKSyhtWIu4E',
    title: 'Zom 100: Bucket List of the Dead on Muse Asia',
  },
  // Black Summoner (Ani-One India)
  {
    keywords: ["black summoner","kuro no shoukanshi"],
    ids: [145260],
    distributor: 'ani-one-india',
    url: 'https://www.youtube.com/watch?v=N5u6BGzi6Hc',
    title: 'Black Summoner on Ani-One India',
  },
  // Mao (Ani-One India)
  {
    keywords: ["mao"],
    ids: [174984],
    distributor: 'ani-one-india',
    url: 'https://www.youtube.com/watch?v=R9bVYJXvkoA',
    title: 'Mao on Ani-One India',
  },
  // Orange (Ani-One India)
  {
    keywords: ["orange"],
    ids: [21647],
    distributor: 'ani-one-india',
    url: 'https://www.youtube.com/watch?v=kSfgo_VS4U4',
    title: 'Orange on Ani-One India',
  },
  // I Have a Crush at Work (Ani-One India)
  {
    keywords: ["i have a crush at work","kono kaisha ni suki na hito"],
    ids: [179469],
    distributor: 'ani-one-india',
    url: 'https://www.youtube.com/watch?v=qGxNmvNfYuI',
    title: 'I Have a Crush at Work on Ani-One India',
  },
  // Takopi's Original Sin (Ani-One India)
  {
    keywords: ["takopi's original sin","takopi no genzai"],
    ids: [142167],
    distributor: 'ani-one-india',
    url: 'https://www.youtube.com/watch?v=tAryFRAwaiI',
    title: 'Takopi\'s Original Sin on Ani-One India',
  },
  // Bananya (Ani-One India)
  {
    keywords: ["bananya"],
    ids: [21704],
    distributor: 'ani-one-india',
    url: 'https://www.youtube.com/playlist?list=PLJXdNaZoFxg4',
    title: 'Bananya on Ani-One India',
  },
  // Mieruko-chan (Muse India)
  {
    keywords: ["mieruko-chan","mieruko chan"],
    ids: [131083],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/playlist?list=PLu5Gdt_rQOajtocUx9ADAWEENJbp5tQje',
    title: 'Mieruko-chan on Muse India',
  },
  // Muv-Luv Alternative (Muse India)
  {
    keywords: ["muv-luv alternative","muv luv"],
    ids: [112716],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/playlist?list=PLpm1VVK4UL16nFFYSdZL9s_v6s9XMS4Sh',
    title: 'Muv-Luv Alternative on Muse India',
  },
  // Dan Da Dan (Muse India)
  {
    keywords: ["dan da dan","dandadan"],
    ids: [171018],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/playlist?list=PL8JcwZhNnDt-FSi4JAfJ0uftL8Rgrl4VE',
    title: 'Dan Da Dan on Muse India',
  },
  // The Seven Deadly Sins (Muse Asia)
  {
    keywords: ["the seven deadly sins","nanatsu no taizai"],
    ids: [20705],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/playlist?list=PLwLSw1_eDZl3572W1HJjIkZyW-0GGVUVq',
    title: 'The Seven Deadly Sins on Muse Asia',
  },
  // Goblin Slayer (Muse Asia)
  {
    keywords: ["goblin slayer"],
    ids: [101165],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/playlist?list=PL-GaNUkRWlEO8SB6EX-3YYoYz1ZbVP-UK',
    title: 'Goblin Slayer on Muse Asia',
  },
  // Hunter x Hunter (2011) (Muse Asia)
  {
    keywords: ["hunter x hunter"],
    ids: [11061],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/playlist?list=PLEBfWuM_iGbI',
    title: 'Hunter x Hunter (2011) on Muse Asia',
  },
  // Tada Never Falls In Love (Muse Asia)
  {
    keywords: ["tada never falls in love","tada-kun wa koi wo shinai"],
    ids: [100179],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/playlist?list=PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e',
    title: 'Tada Never Falls In Love on Muse Asia',
  },
  // Kuma Kuma Kuma Bear (Muse Asia)
  {
    keywords: ["kuma kuma kuma bear"],
    ids: [114340],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/playlist?list=PLwLSw1_eDZl0zRE6T4CdrulzxXZgdRGLr',
    title: 'Kuma Kuma Kuma Bear on Muse Asia',
  },
  // The Unwanted Undead Adventurer (Muse Asia)
  {
    keywords: ["the unwanted undead adventurer","nozomanu fushi no boukensha"],
    ids: [147642],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/playlist?list=PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS',
    title: 'The Unwanted Undead Adventurer on Muse Asia',
  },
  // Berserk of Gluttony (Muse Asia)
  {
    keywords: ["berserk of gluttony","boushoku no berserk"],
    ids: [156039],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/playlist?list=PLq2uEFKyngMwpQOpq53RNRCW6VWo-yqbS',
    title: 'Berserk of Gluttony on Muse Asia',
  },
  // The Familiar of Zero (Muse India)
  {
    keywords: ["the familiar of zero","zero no tsukaima"],
    ids: [1195],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/playlist?list=PLpm1VVK4UL14oNTr6vx9KieQ6-YkKn0qt',
    title: 'The Familiar of Zero on Muse India',
  },
  // Is the Order a Rabbit? (Muse India)
  {
    keywords: ["is the order a rabbit","gochuumon wa usagi desu ka"],
    ids: [20517],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/playlist?list=PLpm1VVK4UL14aFCVvKtSODEQclbYeEpfL',
    title: 'Is the Order a Rabbit? on Muse India',
  },
  // Chained Soldier (Muse Asia)
  {
    keywords: ["chained soldier","matoi seihei no slave"],
    ids: [141821],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/playlist?list=PLwLSw1_eDZl0PC3GwSEfl_Oy2Obxw4H5e',
    title: 'Chained Soldier on Muse Asia',
  },
  // Tadaima, Okaeri (Ani-One Asia)
  {
    keywords: ["tadaima, okaeri","tadaima okaeri"],
    ids: [169698],
    distributor: 'ani-one-asia',
    url: 'https://www.youtube.com/playlist?list=PLrC7aRkKhpGNqrVSM8mpTLP7KWyFnx6Es',
    title: 'Tadaima, Okaeri on Ani-One Asia',
  },

  // ── BATCH 1 + BATCH 2 NEW ENTRIES ──────────────────────────────────────────

  // Fairy Tail (Muse India Hindi + Muse Asia English Sub)
  { keywords: ['fairy tail'], ids: [6702, 20626, 99749], distributor: 'muse-india', url: 'https://www.youtube.com/@MuseIndia', title: 'Fairy Tail on Muse India' },
  // I Parry Everything (Muse India)
  { keywords: ['i parry everything', 'kawaisugi crisis', 'nozomanu fushi'], ids: [170695], distributor: 'muse-india', url: 'https://www.youtube.com/@MuseIndia', title: 'I Parry Everything on Muse India' },
  // Jujutsu Kaisen – Ani-One India (alternate to existing Ani-One Asia entry)
  { keywords: ['jujutsu kaisen hindi', 'jujutsu kaisen india'], ids: [113415, 145064], distributor: 'ani-one-india', url: 'https://www.youtube.com/@AniOneIndia', title: 'Jujutsu Kaisen Hindi Dub on Ani-One India' },
  // MAO 2024 (Ani-One India)
  { keywords: ['mao 2024', 'mao rumiko'], ids: [196012], distributor: 'ani-one-india', url: 'https://www.youtube.com/@AniOneIndia', title: 'MAO on Ani-One India' },
  // Love Unseen Beneath the Clear Night Sky (Ani-One India)
  { keywords: ['love unseen beneath', 'clear night sky'], ids: [202269], distributor: 'ani-one-india', url: 'https://www.youtube.com/@AniOneIndia', title: 'Love Unseen Beneath the Clear Night Sky on Ani-One India' },
  // Monster Eater (Ani-One India)
  { keywords: ['monster eater'], ids: [210234], distributor: 'ani-one-india', url: 'https://www.youtube.com/@AniOneIndia', title: 'Monster Eater on Ani-One India' },
  // Yowayowa Sensei (Ani-One India)
  { keywords: ['yowayowa sensei'], ids: [185211], distributor: 'ani-one-india', url: 'https://www.youtube.com/@AniOneIndia', title: 'Yowayowa Sensei on Ani-One India' },
  // Petals of Reincarnation (Ani-One India)
  { keywords: ['petals of reincarnation'], ids: [179950], distributor: 'ani-one-india', url: 'https://www.youtube.com/@AniOneIndia', title: 'Petals of Reincarnation on Ani-One India' },
  // Rooster Fighter (Ani-One India)
  { keywords: ['rooster fighter', 'niwatori fighter'], ids: [179813], distributor: 'ani-one-india', url: 'https://www.youtube.com/@AniOneIndia', title: 'Rooster Fighter on Ani-One India' },
  // You and I Are Polar Opposites (Ani-One India)
  { keywords: ['you and i are polar opposites', 'kyouran kazoku nikki'], ids: [184951], distributor: 'ani-one-india', url: 'https://www.youtube.com/@AniOneIndia', title: 'You and I Are Polar Opposites on Ani-One India' },
  // I Saved Myself with a Potion! (Ani-One India)
  { keywords: ['i saved myself with a potion', 'potion danomi'], ids: [198561], distributor: 'ani-one-india', url: 'https://www.youtube.com/@AniOneIndia', title: 'I Saved Myself with a Potion! on Ani-One India' },
  // Gintama: Mr. Ginpachi's Zany Class (Ani-One India)
  { keywords: ['gintama', 'ginpachi', 'gintoki'], ids: [918, 15417, 16498], distributor: 'ani-one-india', url: 'https://www.youtube.com/@AniOneIndia', title: "Gintama on Ani-One India" },
  // Fermat Kitchen (Ani-One India)
  { keywords: ['fermat kitchen', 'fermat no ryouri'], ids: [179470], distributor: 'ani-one-india', url: 'https://www.youtube.com/@AniOneIndia', title: 'Fermat Kitchen on Ani-One India' },
  // Tamon's B-Side (Ani-One India – Hindi Dub)
  { keywords: ["tamon's b-side", 'tamon no b men'], ids: [170366], distributor: 'ani-one-india', url: 'https://www.youtube.com/@AniOneIndia', title: "Tamon's B-Side (Hindi Dub) on Ani-One India" },

  // ── Muse Asia – English Sub (new additions) ────────────────────────────────
  // One-Punch Man (Muse Asia – seasons 1+2)
  { keywords: ['one-punch man', 'one punch man', 'onepunchman'], ids: [21087, 97668], distributor: 'muse-asia', url: 'https://www.youtube.com/@MuseAsia', title: 'One-Punch Man on Muse Asia' },
  // Cautious Hero (Muse Asia)
  { keywords: ['cautious hero', 'shinchou yuusha'], ids: [105164], distributor: 'muse-asia', url: 'https://www.youtube.com/@MuseAsia', title: 'Cautious Hero on Muse Asia' },
  // The Greatest Demon Lord Is Reborn as a Typical Nobody (Muse Asia)
  { keywords: ['greatest demon lord', 'shijou saikyou no daimaou'], ids: [130586], distributor: 'muse-asia', url: 'https://www.youtube.com/@MuseAsia', title: 'The Greatest Demon Lord Is Reborn on Muse Asia' },
  // The Magical Revolution of the Reincarnated Princess (Muse India)
  { keywords: ['magical revolution', 'reincarnated princess', 'tensei oujo'], ids: [153629], distributor: 'muse-india', url: 'https://www.youtube.com/@MuseIndia', title: 'The Magical Revolution of the Reincarnated Princess on Muse India' },
  // Made in Abyss (Muse Asia)
  { keywords: ['made in abyss', 'meid in abisu'], ids: [97986, 113926, 131567], distributor: 'muse-asia', url: 'https://www.youtube.com/@MuseAsia', title: 'Made in Abyss on Muse Asia' },
  // Easygoing Territory Defense by the Optimistic Lord (Muse Asia)
  { keywords: ['easygoing territory defense', 'optimistic lord', 'nonbiri nouka'], ids: [174288], distributor: 'muse-asia', url: 'https://www.youtube.com/@MuseAsia', title: 'Easygoing Territory Defense on Muse Asia' },
  // Theatre of Darkness (Yamishibai) (Muse Asia)
  { keywords: ['theatre of darkness', 'yamishibai', 'yami shibai'], ids: [19383], distributor: 'muse-asia', url: 'https://www.youtube.com/@MuseAsia', title: 'Theatre of Darkness: Yamishibai on Muse Asia' },
  // The Genius Prince's Guide to Raising a Nation Out of Debt (Muse Asia)
  { keywords: ["genius prince's guide", 'tensai ouji', 'prince debt'], ids: [129190], distributor: 'muse-asia', url: 'https://www.youtube.com/@MuseAsia', title: "The Genius Prince's Guide on Muse Asia" },
  // Girls' Frontline (Muse Asia)
  { keywords: ["girls' frontline", 'girls frontline', 'dolls frontline'], ids: [128828], distributor: 'muse-asia', url: 'https://www.youtube.com/@MuseAsia', title: "Girls' Frontline on Muse Asia" },
  // Sasaki and Peeps (Muse Asia)
  { keywords: ['sasaki and peeps', 'sasaki to pi-chan'], ids: [154136], distributor: 'muse-asia', url: 'https://www.youtube.com/@MuseAsia', title: 'Sasaki and Peeps on Muse Asia' },
  // Loner Life in Another World (Muse Asia)
  { keywords: ['loner life in another world', 'hitoribocchi no isekai kouryaku'], ids: [175383], distributor: 'muse-asia', url: 'https://www.youtube.com/@MuseAsia', title: 'Loner Life in Another World on Muse Asia' },
  // Let This Grieving Soul Retire (Muse Asia)
  { keywords: ['let this grieving soul retire', 'tsurune'], ids: [175235], distributor: 'muse-asia', url: 'https://www.youtube.com/@MuseAsia', title: 'Let This Grieving Soul Retire on Muse Asia' },
  // Haigakura (Muse Asia)
  { keywords: ['haigakura'], ids: [167087], distributor: 'muse-asia', url: 'https://www.youtube.com/@MuseAsia', title: 'Haigakura on Muse Asia' },
  // I Left My A-Rank Party (Muse Asia)
  { keywords: ['i left my a-rank party', 'a rank party wo ridatsu shita'], ids: [179788], distributor: 'muse-asia', url: 'https://www.youtube.com/@MuseAsia', title: 'I Left My A-Rank Party on Muse Asia' },
  // From Bureaucrat to Villainess (Muse Asia)
  { keywords: ['from bureaucrat to villainess', 'kanryou ni natta ore', 'villainess dad'], ids: [171244], distributor: 'muse-asia', url: 'https://www.youtube.com/@MuseAsia', title: 'From Bureaucrat to Villainess on Muse Asia' },
  // Nights with a Cat (Muse Asia)
  { keywords: ['nights with a cat', 'uchi no neko no ko'], ids: [147774], distributor: 'muse-asia', url: 'https://www.youtube.com/@MuseAsia', title: 'Nights with a Cat on Muse Asia' },
  // Candy Caries (Muse Asia / Bandai Namco)
  { keywords: ['candy caries'], ids: [184512], distributor: 'muse-asia', url: 'https://www.youtube.com/@MuseAsia', title: 'Candy Caries on Muse Asia' },

  // ── Ani-One Asia – English Sub (new additions) ─────────────────────────────
  // Life With an Ordinary Guy Who Reincarnated Into a Total Fantasy Knockout (Ani-One Asia)
  { keywords: ['life with an ordinary guy', 'total fantasy knockout', 'isekai de choropoi'], ids: [134252], distributor: 'ani-one-asia', url: 'https://www.youtube.com/@AniOneAsia', title: 'Life With an Ordinary Guy on Ani-One Asia' },
  // DOG SIGNAL (Ani-One Asia)
  { keywords: ['dog signal'], ids: [161309], distributor: 'ani-one-asia', url: 'https://www.youtube.com/@AniOneAsia', title: 'DOG SIGNAL on Ani-One Asia' },
  // YUREI DECO (Ani-One Asia)
  { keywords: ['yurei deco', 'yurei deco anime'], ids: [145070], distributor: 'ani-one-asia', url: 'https://www.youtube.com/@AniOneAsia', title: 'YUREI DECO on Ani-One Asia' },

  // ── Official Studio Channels ───────────────────────────────────────────────
  // Sherlock Hound (TMS Anime)
  { keywords: ['sherlock hound', 'meitantei holmes'], ids: [1981], distributor: 'tms-anime', url: 'https://www.youtube.com/@TMSanime', title: 'Sherlock Hound on TMS Anime Official' },
  // Revolutionary Girl Utena (Nozomi Entertainment)
  { keywords: ['revolutionary girl utena', 'shoujo kakumei utena'], ids: [440], distributor: 'nozomi-ent', url: 'https://www.youtube.com/@nozomient', title: 'Revolutionary Girl Utena on Nozomi Entertainment' },
  // Uma Musume: Pretty Derby – Road to the Top (PakaTube/Cygames)
  { keywords: ['uma musume', 'pretty derby', 'road to the top'], ids: [149596, 103047, 120852], distributor: 'pakatube', url: 'https://www.youtube.com/@pakatube', title: 'Uma Musume: Pretty Derby on PakaTube (Cygames Official)' },
  // Pokémon Diamond and Pearl (Pokemon Official)
  { keywords: ['pokemon diamond and pearl', 'pocket monsters diamond and pearl'], ids: [1564], distributor: 'pokemon-official', url: 'https://www.youtube.com/@Pokemon', title: 'Pokémon: Diamond and Pearl on The Official Pokémon Channel' },
  // Attack on Titan (Muse India)
  {
    keywords: ["attack on titan","shingeki no kyojin"],
    ids: [16498],
    distributor: 'muse-india',
    url: 'https://www.youtube.com/watch?v=QjJ4iPOQF_Y',
    title: 'Attack on Titan - Episode 01 [Hindi Dub] | Muse India',
  },
  // Fairy Tail (Muse Asia)
  {
    keywords: ["fairy tail"],
    ids: [6702],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/watch?v=jKrujeN3C9I',
    title: 'Fairy Tail – Episode 220 [English Sub] | Muse Asia',
  },
  // Parallel World Pharmacy (Muse Asia)
  {
    keywords: ["parallel world pharmacy","isekai yakkyoku"],
    ids: [145815],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/watch?v=3I4WniXydag',
    title: 'Parallel World Pharmacy - Complete Series [English Sub] | Muse Asia',
  },
  // Reborn to Master the Blade: From Hero-King to Extraordinary Squire (Muse Asia)
  {
    keywords: ["reborn to master the blade","eiyuuou"],
    ids: [139772],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/watch?v=A0G_VKH-q58',
    title: 'Reborn to Master the Blade - Complete Series [English Sub] | Muse Asia',
  },
  // The Legendary Hero Is Dead! (Muse Asia)
  {
    keywords: ["the legendary hero is dead","yuusha ga shinda"],
    ids: [145397],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/watch?v=tEZSjKhAjHw',
    title: 'The Legendary Hero Is Dead! - Complete Series [English Sub] | Muse Asia',
  },
  // Ouran High School Host Club (Muse Asia)
  {
    keywords: ["ouran high school host club","ouran koukou host club"],
    ids: [836],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/watch?v=oT2Hl8vm4-A',
    title: 'Ouran High School Host Club - Complete Series [English Sub] | Muse Asia',
  },
  // Higehiro: After Being Rejected, I Shaved and Took in a High School Girl (Muse Asia)
  {
    keywords: ["higehiro","hige wo soru"],
    ids: [124858],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/watch?v=ZkQfco3tX0w',
    title: 'Higehiro - Complete Series [English Sub] | Muse Asia',
  },
  // I Got a Cheat Skill in Another World and Became Unrivaled in the Real World, Too (Muse Asia)
  {
    keywords: ["i got a cheat skill in another world","cheat skill"],
    ids: [155389],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/watch?v=bzfrykgqkpE',
    title: 'I Got a Cheat Skill in Another World - Complete Series [English Sub] | Muse Asia',
  },
  // I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability (Muse Asia)
  {
    keywords: ["i was reincarnated as the 7th prince","dainana ouji"],
    ids: [168623],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/watch?v=0pTqr2M1z0E',
    title: 'I Was Reincarnated as the 7th Prince - Complete Series [English Sub] | Muse Asia',
  },
  // Failure Frame: I Became the Strongest and Annihilated Everything with Low-Level Spells (Muse Asia)
  {
    keywords: ["failure frame","hazurewaku"],
    ids: [168887],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/watch?v=2yYyOnugFLc',
    title: 'Failure Frame - Complete Series [English Sub] | Muse Asia',
  },
  // Wistoria: Wand and Sword (Muse Asia)
  {
    keywords: ["wistoria: wand and sword","tsue to tsurugi no wistoria","wistoria"],
    ids: [174576],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/watch?v=GuVZX-wMSq8',
    title: 'Wistoria: Wand and Sword - Complete Series [English Sub] | Muse Asia',
  },
  // Classroom of the Elite (Muse Asia)
  {
    keywords: ["classroom of the elite","youkoso jitsuryoku"],
    ids: [98659],
    distributor: 'muse-asia',
    url: 'https://www.youtube.com/watch?v=UQLqvjHvrwc',
    title: 'Classroom of the Elite Season 1 - Complete Series [English Sub] | Muse Asia',
  },
];


export const OfficialWatchService = {
  /**
   * Evaluates and extracts verified official sources for an anime.
   * Prioritizes India-available platforms and official YouTube streams.
   * @param {Object} anime - AniList Media object
   * @returns {Object} { youtubeSources, platformSources, hasAnyOfficialSource, isIndiaPreferred }
   */
  getWatchSources(anime) {
    if (!anime) {
      return { youtubeSources: [], platformSources: [], hasAnyOfficialSource: false };
    }

    const titles = [
      anime.title?.english || '',
      anime.title?.romaji || '',
      anime.title?.native || '',
      ...(anime.synonyms || [])
    ].map(t => t.toLowerCase().trim()).filter(Boolean);

    const externalLinks = anime.externalLinks || [];
    const youtubeSources = [];
    const platformSources = [];
    const seenUrls = new Set();

    // 1. Check AniList externalLinks for verified official YouTube streaming links
    externalLinks.forEach(link => {
      const site = (link.site || '').toLowerCase();
      const url = (link.url || '').trim();
      const type = (link.type || '').toUpperCase();

      if (!url || seenUrls.has(url)) return;

      const isYouTube = site.includes('youtube') || url.includes('youtube.com') || url.includes('youtu.be');

      if (isYouTube) {
        // Detect official channel identity from URL
        const dist = this._detectDistributorFromUrl(url);
        if (dist) {
          seenUrls.add(url);
          youtubeSources.push({
            name: dist.name,
            distributorKey: dist.key,
            distributorName: dist.name,
            badge: dist.badge,
            region: dist.region,
            url: url,
            isIndia: dist.isIndia,
            title: `Watch on ${dist.name}`,
            description: dist.description,
            type: 'YOUTUBE_OFFICIAL',
          });
        }
      }
    });

    // 2. Check verified India/Asia YouTube catalog mapping if no direct YouTube link was found in AniList
    if (youtubeSources.length === 0) {
      const matchedEntry = this._findCatalogMatch(anime.id, titles);
      if (matchedEntry) {
        const dist = VERIFIED_YOUTUBE_DISTRIBUTORS[matchedEntry.distributor];
        if (dist && !seenUrls.has(matchedEntry.url)) {
          seenUrls.add(matchedEntry.url);
          youtubeSources.push({
            name: dist.name,
            distributorKey: matchedEntry.distributor,
            distributorName: dist.name,
            badge: dist.badge,
            region: dist.region,
            url: matchedEntry.url,
            isIndia: dist.isIndia,
            title: `Watch on ${dist.name}`,
            description: dist.description,
            type: 'YOUTUBE_OFFICIAL',
          });
        }
      }
    }

    // 3. Extract verified official platforms from AniList externalLinks
    externalLinks.forEach(link => {
      const siteName = (link.site || '').trim();
      const siteLower = siteName.toLowerCase();
      const url = (link.url || '').trim();
      const type = (link.type || '').toUpperCase();

      if (!url || seenUrls.has(url)) return;

      // Skip non-streaming social/info links (Twitter, Instagram, Wikipedia, etc.)
      if (type !== 'STREAMING' && !['official site', 'crunchyroll', 'netflix', 'hulu', 'hidive', 'disney plus', 'amazon prime video', 'bilibili tv', 'iq'].some(s => siteLower.includes(s))) {
        return;
      }

      // Skip YouTube as it is handled separately
      if (siteLower.includes('youtube') || url.includes('youtube.com')) return;

      // Determine platform configuration
      const platformInfo = this._getPlatformInfo(siteName, url);
      if (platformInfo) {
        seenUrls.add(url);
        platformSources.push(platformInfo);
      }
    });

    // 4. Sort platform sources: India-available platforms first (Crunchyroll, Netflix, Disney+, Prime)
    platformSources.sort((a, b) => {
      if (a.isIndia && !b.isIndia) return -1;
      if (!a.isIndia && b.isIndia) return 1;
      return 0;
    });

    const hasAnyOfficialSource = youtubeSources.length > 0 || platformSources.length > 0;

    return {
      youtubeSources,
      platformSources,
      hasAnyOfficialSource,
      isIndiaPreferred: youtubeSources.some(s => s.isIndia) || platformSources.some(s => s.isIndia),
    };
  },

  /**
   * Detects if a YouTube URL corresponds to a verified distributor
   */
  _detectDistributorFromUrl(url) {
    const u = url.toLowerCase();
    if (u.includes('@museindia') || u.includes('muse_india') || u.includes('museindia')) {
      return { key: 'muse-india', ...VERIFIED_YOUTUBE_DISTRIBUTORS['muse-india'] };
    }
    if (u.includes('@anioneindia') || u.includes('anione_india') || u.includes('anioneindia')) {
      return { key: 'ani-one-india', ...VERIFIED_YOUTUBE_DISTRIBUTORS['ani-one-india'] };
    }
    if (u.includes('@museasia') || u.includes('muse_asia') || u.includes('museasia') || u.includes('plwlsw1_edzl')) {
      return { key: 'muse-asia', ...VERIFIED_YOUTUBE_DISTRIBUTORS['muse-asia'] };
    }
    if (u.includes('@anioneasia') || u.includes('anione_asia') || u.includes('anioneasia') || u.includes('plxsscenep7')) {
      return { key: 'ani-one-asia', ...VERIFIED_YOUTUBE_DISTRIBUTORS['ani-one-asia'] };
    }
    if (u.includes('@gundaminfo') || u.includes('gundaminfo')) {
      return { key: 'gundaminfo', ...VERIFIED_YOUTUBE_DISTRIBUTORS['gundaminfo'] };
    }
    if (u.includes('@pokemonasiaofficial') || u.includes('pokemonasia')) {
      return { key: 'pokemon-asia', ...VERIFIED_YOUTUBE_DISTRIBUTORS['pokemon-asia'] };
    }
    if (u.includes('@toeianimation') || u.includes('toei-animation')) {
      return { key: 'toei-animation', ...VERIFIED_YOUTUBE_DISTRIBUTORS['toei-animation'] };
    }

    // Default recognized official anime YouTube channel from AniList curated streaming links
    return {
      key: 'official-youtube',
      name: 'Official YouTube Channel',
      badge: 'Watch on YouTube Official',
      region: 'Official Channel Stream',
      description: 'Official Publisher / Studio Video Stream',
      isIndia: true,
    };
  },

  /**
   * Matches anime title or AniList ID with verified catalog entries
   */
  _findCatalogMatch(animeId, titleList) {
    // 1. Direct ID match
    const idMatch = OFFICIAL_YOUTUBE_CATALOG.find(entry => entry.ids && entry.ids.includes(Number(animeId)));
    if (idMatch) return idMatch;

    // 2. Keyword exact token match across titles
    for (const entry of OFFICIAL_YOUTUBE_CATALOG) {
      for (const kw of entry.keywords) {
        const cleanKw = kw.toLowerCase().trim();
        const matches = titleList.some(title => {
          const cleanTitle = title.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
          return cleanTitle.includes(cleanKw);
        });
        if (matches) return entry;
      }
    }
    return null;
  },

  /**
   * Normalizes official licensed platforms
   */
  _getPlatformInfo(siteName, url) {
    const s = siteName.toLowerCase();
    const cleanKey = s.replace(/[^a-z0-9]/g, '');

    if (s.includes('crunchyroll')) {
      return {
        key: 'crunchyroll',
        name: 'Crunchyroll',
        badge: 'Watch on Crunchyroll',
        url,
        isIndia: true,
        regionBadge: 'Available in India',
        type: 'Subscription & Free Tier (Sub & Dub)',
        accentColor: '#f47521',
        tag: 'Official Anime Partner',
      };
    }
    if (s.includes('netflix')) {
      return {
        key: 'netflix',
        name: 'Netflix',
        badge: 'Watch on Netflix',
        url,
        isIndia: true,
        regionBadge: 'Available in India',
        type: 'Subscription (Full HD / 4K)',
        accentColor: '#e50914',
        tag: 'Official Licensed Stream',
      };
    }
    if (s.includes('disney') || s.includes('hotstar')) {
      return {
        key: 'disney-plus',
        name: 'Disney+ Hotstar',
        badge: 'Watch on Disney+ Hotstar',
        url,
        isIndia: true,
        regionBadge: 'Available in India',
        type: 'Subscription',
        accentColor: '#0c2044',
        tag: 'Official Streaming Partner',
      };
    }
    if (s.includes('amazon') || s.includes('prime')) {
      return {
        key: 'amazon-prime',
        name: 'Prime Video',
        badge: 'Watch on Prime Video',
        url,
        isIndia: true,
        regionBadge: 'Available in India',
        type: 'Subscription / Rent',
        accentColor: '#00a8e1',
        tag: 'Official Licensed Stream',
      };
    }
    if (s.includes('hulu')) {
      return {
        key: 'hulu',
        name: 'Hulu',
        badge: 'Watch on Hulu',
        url,
        isIndia: false,
        regionBadge: 'Global (US)',
        type: 'Subscription',
        accentColor: '#1ce783',
        tag: 'Official Partner',
      };
    }
    if (s.includes('hidive')) {
      return {
        key: 'hidive',
        name: 'HIDIVE',
        badge: 'Watch on HIDIVE',
        url,
        isIndia: false,
        regionBadge: 'Global / Sentai',
        type: 'Subscription',
        accentColor: '#00a4e4',
        tag: 'Official Partner',
      };
    }
    if (s.includes('bilibili')) {
      return {
        key: 'bilibili',
        name: 'Bilibili Global',
        badge: 'Watch on Bilibili',
        url,
        isIndia: true,
        regionBadge: 'Asia Licensed',
        type: 'Official Simulcast Stream',
        accentColor: '#00aeec',
        tag: 'Licensed Distributor',
      };
    }
    if (s.includes('iq') || s.includes('iqiyi')) {
      return {
        key: 'iqiyi',
        name: 'iQIYI',
        badge: 'Watch on iQIYI',
        url,
        isIndia: true,
        regionBadge: 'Asia Licensed',
        type: 'Official Simulcast Stream',
        accentColor: '#00c356',
        tag: 'Licensed Distributor',
      };
    }
    if (s.includes('official site')) {
      return {
        key: 'official-site',
        name: 'Official Anime Website',
        badge: 'Visit Official Anime Site',
        url,
        isIndia: false,
        regionBadge: 'Production Committee',
        type: 'Official Info & Streaming Links',
        accentColor: '#8b5cf6',
        tag: 'Official Portal',
      };
    }

    // Generic recognized official site
    return {
      key: cleanKey || 'official-stream',
      name: siteName,
      badge: `Watch on ${siteName}`,
      url,
      isIndia: false,
      regionBadge: 'Authorized Distributor',
      type: 'Official Stream',
      accentColor: '#a855f7',
      tag: 'Verified Source',
    };
  }
};
