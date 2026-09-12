import { Rank } from '@/lib/types';

export type VoiceLanguage = 'EN' | 'HI';

const STORAGE_KEY = 'bluff_voice_language';

export function getStoredVoiceLanguage(): VoiceLanguage {
  if (typeof window === 'undefined') return 'EN';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'HI' || saved === 'EN') return saved;
  } catch {
    // Ignore storage errors
  }
  return 'EN';
}

export function setStoredVoiceLanguage(lang: VoiceLanguage): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Ignore storage errors
  }
}

// English card rank names
const RANK_NAMES_EN: Record<Rank, string> = {
  'A': 'Ace',
  'K': 'King',
  'Q': 'Queen',
  'J': 'Jack',
  '10': '10',
  '9': '9',
  '8': '8',
  '7': '7',
  '6': '6',
  '5': '5',
  '4': '4',
  '3': '3',
  '2': '2',
};

// Authentic Desi Hindi rank names (Devanagari script for native Hindi voices)
const DESI_RANK_NAMES_HI_SCRIPT: Record<Rank, { singular: string; plural: string }> = {
  'A': { singular: 'इक्के', plural: 'इक्के' },
  'K': { singular: 'बादशाह', plural: 'बादशाह' },
  'Q': { singular: 'बेगम', plural: 'बेगम' },
  'J': { singular: 'गुलाम', plural: 'गुलाम' },
  '10': { singular: 'दहले', plural: 'दहले' },
  '9': { singular: 'नेहले', plural: 'नेहले' },
  '8': { singular: 'अट्ठे', plural: 'अट्ठे' },
  '7': { singular: 'सत्ते', plural: 'सत्ते' },
  '6': { singular: 'छक्के', plural: 'छक्के' },
  '5': { singular: 'पंजे', plural: 'पंजे' },
  '4': { singular: 'चौके', plural: 'चौके' },
  '3': { singular: 'तिक्की', plural: 'तिक्की' },
  '2': { singular: 'दुक्की', plural: 'दुक्की' },
};

// Authentic Desi Hindi rank names (Romanized for Indian English voices)
const DESI_RANK_NAMES_HI_ROMAN: Record<Rank, { singular: string; plural: string }> = {
  'A': { singular: 'Ikke', plural: 'Ikke' },
  'K': { singular: 'Badshah', plural: 'Badshah' },
  'Q': { singular: 'Begum', plural: 'Begum' },
  'J': { singular: 'Ghulam', plural: 'Ghulam' },
  '10': { singular: 'Dehle', plural: 'Dehle' },
  '9': { singular: 'Nehle', plural: 'Nehle' },
  '8': { singular: 'Atthe', plural: 'Atthe' },
  '7': { singular: 'Satte', plural: 'Satte' },
  '6': { singular: 'Chhakke', plural: 'Chhakke' },
  '5': { singular: 'Panje', plural: 'Panje' },
  '4': { singular: 'Chauke', plural: 'Chauke' },
  '3': { singular: 'Tikki', plural: 'Tikki' },
  '2': { singular: 'Dukki', plural: 'Dukki' },
};

// Hindi words for numbers 1 to 5
const HINDI_COUNT_WORDS: Record<number, string> = {
  1: 'ek',
  2: 'do',
  3: 'teen',
  4: 'chaar',
  5: 'paanch',
};

const HINDI_COUNT_WORDS_DEVANAGARI: Record<number, string> = {
  1: 'एक',
  2: 'दो',
  3: 'तीन',
  4: 'चार',
  5: 'पांच',
};

/**
 * Generate natural spoken text for the claim.
 * English: "3 cards of Queen", "1 card of Ace"
 * Hindi (Desi): "बेगम के तीन पत्ते" (Begum ke teen patte), "इक्के का एक पत्ता" (Ikke ka ek patta)
 */
export function getBluffAnnouncementText(
  count: number,
  rank: Rank,
  lang: VoiceLanguage,
  isNativeHindiVoice: boolean
): string {
  if (lang === 'EN') {
    const cardName = RANK_NAMES_EN[rank] || rank;
    return `${count} ${count === 1 ? 'card' : 'cards'} of ${cardName}`;
  }

  // Desi Hindi Mode
  if (isNativeHindiVoice) {
    const hiRank = DESI_RANK_NAMES_HI_SCRIPT[rank] || { singular: rank, plural: rank };
    if (count === 1) {
      return `${hiRank.singular} का एक पत्ता`;
    }
    const countWord = HINDI_COUNT_WORDS_DEVANAGARI[count] || `${count}`;
    return `${hiRank.plural} के ${countWord} पत्ते`;
  }

  // Fallback for Indian English voices pronouncing Romanized Hindi
  const romanRank = DESI_RANK_NAMES_HI_ROMAN[rank] || { singular: rank, plural: rank };
  const countWord = HINDI_COUNT_WORDS[count] || `${count}`;
  return count === 1 ? `${romanRank.singular} ka ek patta` : `${romanRank.plural} ke ${countWord} patte`;
}

/**
 * Find the most suitable female Indian accent voice.
 * Checks for Microsoft Heera, Neerja, Swara, Kalpana, Google हिन्दी, etc.
 */
function findBestVoice(lang: VoiceLanguage): { voice: SpeechSynthesisVoice | null; isNativeHindi: boolean } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { voice: null, isNativeHindi: false };
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) {
    return { voice: null, isNativeHindi: false };
  }

  // Common female voice keywords in browsers (Windows, Android, iOS, macOS)
  const femaleKeywords = ['heera', 'neerja', 'swara', 'kalpana', 'veena', 'ananya', 'aditi', 'priya', 'shruti', 'lekha', 'female', 'zira', 'google हिन्दी'];

  if (lang === 'HI') {
    // 1. Look for female Hindi voice (e.g. Microsoft Swara, Kalpana, Google हिन्दी)
    const femaleHindi = voices.find((v) => {
      const l = v.lang.toLowerCase();
      const n = v.name.toLowerCase();
      const isHindi = l.startsWith('hi');
      const isFemale = femaleKeywords.some((k) => n.includes(k));
      return isHindi && isFemale;
    });
    if (femaleHindi) return { voice: femaleHindi, isNativeHindi: true };

    // 2. Any Hindi voice
    const anyHindi = voices.find((v) => v.lang.toLowerCase().startsWith('hi'));
    if (anyHindi) return { voice: anyHindi, isNativeHindi: true };

    // 3. Fallback: Indian English female voice reading Roman Hindi
    const indianEnglishFemale = voices.find((v) => {
      const l = v.lang.toLowerCase();
      const n = v.name.toLowerCase();
      const isIndian = l.includes('in') || n.includes('india');
      const isFemale = femaleKeywords.some((k) => n.includes(k));
      return isIndian && isFemale;
    });
    if (indianEnglishFemale) return { voice: indianEnglishFemale, isNativeHindi: false };

    // 4. Any Indian voice
    const anyIndian = voices.find((v) => {
      const l = v.lang.toLowerCase();
      const n = v.name.toLowerCase();
      return l.includes('in') || n.includes('india');
    });
    if (anyIndian) return { voice: anyIndian, isNativeHindi: false };
  } else {
    // EN mode: Indian English Female Voice
    // 1. Indian English female voice (e.g., Microsoft Heera, Neerja, Veena)
    const indianFemale = voices.find((v) => {
      const l = v.lang.toLowerCase();
      const n = v.name.toLowerCase();
      const isIndian = l.includes('in') || n.includes('india');
      const isFemale = femaleKeywords.some((k) => n.includes(k));
      return isIndian && isFemale;
    });
    if (indianFemale) return { voice: indianFemale, isNativeHindi: false };

    // 2. Any Indian English voice
    const anyIndianEn = voices.find((v) => {
      const l = v.lang.toLowerCase();
      const n = v.name.toLowerCase();
      return (l === 'en-in' || l === 'en_in' || (l.startsWith('en') && n.includes('india')));
    });
    if (anyIndianEn) return { voice: anyIndianEn, isNativeHindi: false };

    // 3. General English female voice
    const anyFemaleEn = voices.find((v) => {
      const l = v.lang.toLowerCase();
      const n = v.name.toLowerCase();
      return l.startsWith('en') && femaleKeywords.some((k) => n.includes(k));
    });
    if (anyFemaleEn) return { voice: anyFemaleEn, isNativeHindi: false };
  }

  // Final fallback: First available voice
  return { voice: voices[0] || null, isNativeHindi: false };
}

/**
 * Pre-warm speech synthesis so voice lists are fetched immediately by the browser.
 */
export function initBluffAnnouncer(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  // Trigger getVoices to populate internal cache
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}

/**
 * Announce a card claim out loud.
 * Speed is slightly slower than normal (0.85) as requested ("speed normal se thoda slow rkhna female indian accent mein").
 */
export function announceBluffPlay(
  count: number,
  rank: Rank,
  lang: VoiceLanguage = 'EN'
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    // Stop any ongoing announcement so speech is immediate and never lags behind
    window.speechSynthesis.cancel();

    const { voice, isNativeHindi } = findBestVoice(lang);
    const spokenText = getBluffAnnouncementText(count, rank, lang, isNativeHindi);

    const utterance = new SpeechSynthesisUtterance(spokenText);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = lang === 'HI' ? 'hi-IN' : 'en-IN';
    }

    // Requested: "speed normal se thoda slow rkhna" -> 0.85 rate
    utterance.rate = 0.85;

    // Pleasant female pitch tuning
    utterance.pitch = 1.08;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[BluffAnnouncer] Error playing TTS claim announcement:', err);
  }
}
