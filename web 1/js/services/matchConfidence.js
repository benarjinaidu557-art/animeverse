/**
 * Match Confidence & Language Detection Engine - AnimeVerse
 * Calculates technical confidence scores (0.00 - 1.00) for discovered YouTube anime uploads.
 * 
 * Strict Anti-Piracy Rules:
 * - Only approved official channels are eligible for high confidence.
 * - Negative keywords (trailer, pv, reaction, review, ost) are penalized.
 * - Strict episode number parsing avoids "Episode 10" matching "Episode 1".
 * - High threshold (>= 0.85) required for automatic verification.
 * - Borderline scores (0.60 - 0.84) are queued as "pending" for admin review.
 * - Never invent language availability (fallback to "unknown").
 */

// Negative keywords that disqualify an item from being an official full episode
export const NEGATIVE_KEYWORDS = [
  'trailer', 'teaser', 'pv', 'preview', 'opening', 'ending', 'op', 'ed',
  'ost', 'theme song', 'reaction', 'review', 'recap', 'interview', 'talk',
  'creditless', 'highlights', 'short', 'event', 'scene', 'clip', 'amv'
];

/**
 * Normalizes text for clean token matching
 */
export function cleanText(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strict episode number parsing
 * Extracts explicit episode number without confusing "Episode 10" with "Episode 1"
 */
export function parseEpisodeNumber(title, targetEp = null) {
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

  for (const pattern of patterns) {
    const match = t.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0) {
        if (targetEp === null || targetEp === num) return num;
      }
    }
  }

  // If a target episode was requested, check with strict word boundaries
  if (targetEp !== null) {
    const padded = String(targetEp).padStart(2, '0');
    // Ensure word boundaries so "1" does not match "10" or "21"
    const regex = new RegExp(`(?:^|\\s|\\[|【|#)${targetEp}(?:$|\\s|\\]|】|\\b)`);
    const paddedRegex = new RegExp(`(?:^|\\s|\\[|【|#)${padded}(?:$|\\s|\\]|】|\\b)`);
    if (regex.test(t) || paddedRegex.test(t)) {
      return targetEp;
    }
  }

  return null;
}

/**
 * Strict season number parsing
 */
export function parseSeasonNumber(title, targetSeason = 1) {
  const t = title.toLowerCase();
  const patterns = [
    /\bseason\s*0*(\d+)\b/i,
    /\bs0*(\d+)\b/i,
    /\b(\d+)(?:st|nd|rd|th)\s+season\b/i,
    /\bcour\s*0*(\d+)\b/i
  ];

  for (const pattern of patterns) {
    const match = t.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0) return num;
    }
  }

  return targetSeason || 1;
}

/**
 * Detect language from title, description, and channel context
 */
export function detectLanguage(title, description = '', channelName = '') {
  const combined = `${title} ${description} ${channelName}`.toLowerCase();

  // 1. Telugu Dub detection
  if (combined.includes('telugu dub') || combined.includes('telugu audio') || combined.includes('తెలుగు')) {
    return { language: 'Telugu Dub', language_status: 'verified' };
  }

  // 2. Tamil Dub detection
  if (combined.includes('tamil dub') || combined.includes('tamil audio') || combined.includes('தமிழ்')) {
    return { language: 'Tamil Dub', language_status: 'verified' };
  }

  // 3. Bengali Dub detection
  if (combined.includes('bengali dub') || combined.includes('bangla dub') || combined.includes('বাংলা')) {
    return { language: 'Bengali Dub', language_status: 'verified' };
  }

  // 4. Malayalam Dub detection
  if (combined.includes('malayalam dub') || combined.includes('malayalam audio') || combined.includes('മലയാളം')) {
    return { language: 'Malayalam Dub', language_status: 'verified' };
  }

  // 5. Kannada Dub detection
  if (combined.includes('kannada dub') || combined.includes('kannada audio') || combined.includes('ಕನ್ನಡ')) {
    return { language: 'Kannada Dub', language_status: 'verified' };
  }

  // 6. Hindi Dub detection
  if (
    combined.includes('hindi dub') ||
    combined.includes('hindi audio') ||
    combined.includes('in hindi') ||
    combined.includes('हिन्दी') ||
    (channelName.toLowerCase().includes('india') && combined.includes('dub') && !combined.includes('eng'))
  ) {
    return { language: 'Hindi Dub', language_status: 'verified' };
  }

  // 7. English Dub detection
  if (combined.includes('english dub') || combined.includes('eng dub') || combined.includes('[eng dub]')) {
    return { language: 'English Dub', language_status: 'verified' };
  }

  // 8. English Sub detection
  if (combined.includes('english sub') || combined.includes('eng sub') || combined.includes('[sub]')) {
    return { language: 'Japanese (English Sub)', language_status: 'verified' };
  }

  // 9. Default official channel sub fallback
  if (channelName.toLowerCase().includes('muse') || channelName.toLowerCase().includes('ani-one')) {
    return { language: 'Japanese (English Sub)', language_status: 'detected' };
  }

  return { language: 'Unknown Audio', language_status: 'unknown' };
}

/**
 * Computes match confidence score and verification status
 */
export function evaluateMatchConfidence({
  videoTitle = '',
  videoDescription = '',
  channelId = '',
  channelName = '',
  isEmbeddable = true,
  candidateTitles = [],
  targetEp = null,
  targetSeason = 1,
  approvedChannelSet = new Set()
}) {
  let score = 0.0;
  const cleanVideo = cleanText(videoTitle);

  // 1. Approved Channel Weight (+0.35)
  const isApproved = approvedChannelSet.has(channelId);
  if (isApproved) {
    score += 0.35;
  } else {
    // If channel is not in approved registry, maximum score is strictly capped
    return {
      score: 0.20,
      verification_status: 'rejected',
      reason: 'Channel is not an approved official distributor'
    };
  }

  // 2. Negative keyword penalty
  const isFullEp = cleanVideo.includes('full episode') || cleanVideo.includes('episode') || cleanVideo.includes('ep ');
  for (const neg of NEGATIVE_KEYWORDS) {
    if (cleanVideo.includes(neg) && !isFullEp) {
      return {
        score: 0.10,
        verification_status: 'rejected',
        reason: `Title contains negative keyword: ${neg}`
      };
    }
  }

  // 3. Title Matching (+0.35)
  let bestTitleRatio = 0.0;
  for (const candidate of candidateTitles) {
    if (!candidate) continue;
    const cleanCand = cleanText(candidate);
    if (!cleanCand || cleanCand.length < 3) continue;

    if (cleanVideo.includes(cleanCand)) {
      bestTitleRatio = 1.0;
      break;
    }

    const candTokens = cleanCand.split(' ').filter(w => w.length > 2);
    if (candTokens.length > 0) {
      const matched = candTokens.filter(tok => cleanVideo.includes(tok));
      const ratio = matched.length / candTokens.length;
      if (ratio > bestTitleRatio) bestTitleRatio = ratio;
    }
  }

  if (bestTitleRatio >= 0.80) {
    score += 0.35;
  } else if (bestTitleRatio >= 0.50) {
    score += 0.20;
  } else {
    // Low title match
    return {
      score: 0.30,
      verification_status: 'rejected',
      reason: 'Title does not match anime name'
    };
  }

  // 4. Strict Episode Matching (+0.15)
  const detectedEp = parseEpisodeNumber(videoTitle, targetEp);
  if (targetEp !== null && detectedEp === targetEp) {
    score += 0.15;
  } else if (detectedEp !== null) {
    score += 0.10;
  }

  // 5. Embeddability (+0.10)
  if (isEmbeddable) {
    score += 0.10;
  } else {
    return {
      score: 0.40,
      verification_status: 'rejected',
      reason: 'Video is not embeddable'
    };
  }

  // 6. Official licensor bonus (+0.05)
  if (cleanVideo.includes('official') || cleanVideo.includes('muse') || cleanVideo.includes('ani-one')) {
    score += 0.05;
  }

  // Cap at 1.0
  const finalScore = Math.min(1.0, Math.round(score * 100) / 100);

  // Status determination
  let verification_status = 'rejected';
  if (finalScore >= 0.85) {
    verification_status = 'verified';
  } else if (finalScore >= 0.60) {
    verification_status = 'pending';
  }

  const langInfo = detectLanguage(videoTitle, videoDescription, channelName);
  const detectedSeason = parseSeasonNumber(videoTitle, targetSeason);

  return {
    score: finalScore,
    verification_status,
    detected_episode: detectedEp || targetEp || 1,
    detected_season: detectedSeason,
    language: langInfo.language,
    language_status: langInfo.language_status,
    is_approved: isApproved
  };
}
