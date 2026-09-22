/**
 * Language Filter Service - AnimeVerse
 * Manages global language filter state, supported language definitions,
 * and strict verified audio/subtitle matching against the database.
 */

export const SUPPORTED_LANGUAGES = [
  { id: 'ALL', label: 'All Languages' },
  { id: 'Telugu', label: 'Telugu' },
  { id: 'Hindi', label: 'Hindi' },
  { id: 'Tamil', label: 'Tamil' },
  { id: 'English', label: 'English' },
  { id: 'Japanese', label: 'Japanese' },
  { id: 'Malayalam', label: 'Malayalam' },
  { id: 'Kannada', label: 'Kannada' },
  { id: 'Bengali', label: 'Bengali' },
  { id: 'Other', label: 'Other' },
];

const STORAGE_KEY = 'animeverse_global_language';
const listeners = new Set();

export const LanguageFilterService = {
  SUPPORTED_LANGUAGES,

  /**
   * Returns list of supported language options
   */
  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  },

  /**
   * Retrieves the currently active language (persisted in localStorage)
   */
  getActiveLanguage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGUAGES.some(l => l.id.toLowerCase() === saved.toLowerCase())) {
        const found = SUPPORTED_LANGUAGES.find(l => l.id.toLowerCase() === saved.toLowerCase());
        return found ? found.id : 'ALL';
      }
    } catch {}
    return 'ALL';
  },

  /**
   * Updates and persists the active language filter across the application
   */
  setActiveLanguage(lang) {
    const valid = SUPPORTED_LANGUAGES.find(l => l.id.toLowerCase() === (lang || '').toLowerCase());
    const newLang = valid ? valid.id : 'ALL';
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {}
    listeners.forEach(fn => {
      try {
        fn(newLang);
      } catch (err) {
        console.error('[LanguageFilterService] Listener error:', err);
      }
    });
    return newLang;
  },

  /**
   * Subscribes to global language changes
   */
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  /**
   * Strictly matches an anime or watch source against a requested language.
   * Examines primary language metadata, episode-level audio/subtitle tags, and video titles.
   * 
   * @param {Object} item Anime card or watch source
   * @param {string} targetLang Language to filter by (e.g. 'Telugu', 'Hindi', 'ALL')
   * @returns {boolean}
   */
  matchesLanguage(item, targetLang) {
    if (!item) return false;
    const cleanTarget = (targetLang || 'ALL').trim();
    if (cleanTarget === 'ALL' || cleanTarget === '') return true;

    // Collect all language signals from the anime / watch source
    const signals = [];

    if (typeof item.language === 'string') signals.push(item.language);
    if (item.verifiedSource && typeof item.verifiedSource.language === 'string') {
      signals.push(item.verifiedSource.language);
    }
    if (item.watchSource && typeof item.watchSource.language === 'string') {
      signals.push(item.watchSource.language);
    }

    // Check all episode entries if available
    const eps = item.all_episodes || item.verifiedSource?.all_episodes || item.episodes;
    if (Array.isArray(eps)) {
      eps.forEach(ep => {
        if (ep && typeof ep.language === 'string') signals.push(ep.language);
        if (ep && typeof ep.video_title === 'string') signals.push(ep.video_title);
      });
    }

    if (typeof item.video_title === 'string') signals.push(item.video_title);

    // Build unified lowercase search corpus
    const corpus = signals.join(' ').toLowerCase();
    if (!corpus.trim()) {
      return cleanTarget === 'Other';
    }

    switch (cleanTarget) {
      case 'Telugu':
        return corpus.includes('telugu');

      case 'Hindi':
        return corpus.includes('hindi');

      case 'Tamil':
        return corpus.includes('tamil');

      case 'English':
        return corpus.includes('english') || corpus.includes('en-sub') || corpus.includes('en-dub') || corpus.includes('eng');

      case 'Japanese':
        return corpus.includes('japanese') || corpus.includes('ja-jp') || corpus.includes('jp-sub') || corpus.includes('nihongo');

      case 'Malayalam':
        return corpus.includes('malayalam');

      case 'Kannada':
        return corpus.includes('kannada');

      case 'Bengali':
        return corpus.includes('bengali') || corpus.includes('bangla');

      case 'Other': {
        const standard = [
          'telugu', 'hindi', 'tamil', 'english', 'en-sub', 'en-dub', 'eng',
          'japanese', 'ja-jp', 'jp-sub', 'nihongo',
          'malayalam', 'kannada', 'bengali', 'bangla'
        ];
        return !standard.some(std => corpus.includes(std));
      }

      default:
        return corpus.includes(cleanTarget.toLowerCase());
    }
  },

  /**
   * Filters an array of anime or sources by language
   */
  filterAnimeList(list, targetLang) {
    if (!Array.isArray(list)) return [];
    if (!targetLang || targetLang === 'ALL') return list;
    return list.filter(item => this.matchesLanguage(item, targetLang));
  },

  /**
   * Computes counts for each supported language from an anime list
   */
  getLanguageCounts(list) {
    const counts = {};
    SUPPORTED_LANGUAGES.forEach(lang => {
      counts[lang.id] = this.filterAnimeList(list, lang.id).length;
    });
    return counts;
  }
};
