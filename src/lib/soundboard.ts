'use client';

import { sounds } from './sound';

export interface SoundboardClip {
  id: string;
  label: string;
  subtitle: string;
  emoji: string;
  category: 'bollywood' | 'viral' | 'beats';
  audioUrl?: string;
  fallbackSynth?: 'cash' | 'slap' | 'dholak' | 'horn' | 'bell' | 'dramatic';
}

export const DESI_SOUNDBOARD_CLIPS: SoundboardClip[] = [
  // ==========================================
  // TOP SPECIAL: Penalty Dialogue
  // ==========================================
  {
    id: 'chakko-naaz',
    label: 'chakko ( Naaz)',
    subtitle: 'Chakko (Naaz) • Penalty Special 🚨',
    emoji: '🚨',
    category: 'viral',
    audioUrl: '/chakko.ogg',
    fallbackSynth: 'horn',
  },

  // ==========================================
  // Category 1: Bollywood & Cinema Memes
  // ==========================================
  {
    id: 'akshay-kar-kya-raha-hai',
    label: 'Kar Kya Raha Hai Yahan?!',
    subtitle: 'Akshay Kumar • Phir Hera Pheri',
    emoji: '🤷‍♂️',
    category: 'bollywood',
    audioUrl: '/sounds/memes/akshay-kar-kya-raha-hai.mp3',
    fallbackSynth: 'dramatic',
  },
  {
    id: 'cid-daya',
    label: 'Kuch To Gadbad Hai Daya!',
    subtitle: 'ACP Pradyuman • CID',
    emoji: '🔍',
    category: 'bollywood',
    audioUrl: '/sounds/memes/cid-daya.mp3',
    fallbackSynth: 'dramatic',
  },
  {
    id: 'rajpal-reaction',
    label: 'Rajpal Yadav Shocked Cry',
    subtitle: 'Rajpal Yadav • Chup Chup Ke',
    emoji: '😱',
    category: 'bollywood',
    audioUrl: '/sounds/memes/rajpal-reaction.mp3',
    fallbackSynth: 'slap',
  },
  {
    id: 'kaleen-bhaiya',
    label: 'Shabash Beta Bahut Badhiya!',
    subtitle: 'Kaleen Bhaiya • Mirzapur',
    emoji: '👑',
    category: 'bollywood',
    audioUrl: '/sounds/memes/kaleen-bhaiya.mp3',
    fallbackSynth: 'horn',
  },
  {
    id: 'munna-bhai-nahi',
    label: 'Nahi! Nahi! Nahi!',
    subtitle: 'Sanjay Dutt • Munna Bhai M.B.B.S',
    emoji: '🙅‍♂️',
    category: 'bollywood',
    audioUrl: '/sounds/memes/munna-bhai-nahi.mp3',
    fallbackSynth: 'slap',
  },
  {
    id: 'jhukega-nahi',
    label: 'Jhukega Nahi Saala!',
    subtitle: 'Pushpa Raj • Allu Arjun',
    emoji: '🧔',
    category: 'bollywood',
    audioUrl: '/sounds/memes/jhukega-nahi.mp3',
    fallbackSynth: 'horn',
  },
  {
    id: 'pushpa-fire-hai-main',
    label: 'Pushpa Pushpa Raj (Fire Hai)',
    subtitle: 'Allu Arjun Pushpa Dialogue',
    emoji: '🔥',
    category: 'bollywood',
    audioUrl: '/sounds/memes/pushpa-fire-hai-main.mp3',
    fallbackSynth: 'horn',
  },
  {
    id: 'pushpa-raj-signature',
    label: 'O Manchi Pushpa Raj',
    subtitle: 'Pushpa Raj Signature Track',
    emoji: '🕶️',
    category: 'bollywood',
    audioUrl: '/sounds/memes/pushpa-raj-signature.mp3',
    fallbackSynth: 'horn',
  },
  {
    id: 'aamir-khan-achha',
    label: 'Achha... (Aamir Khan)',
    subtitle: 'Aamir Khan • PK',
    emoji: '🧐',
    category: 'bollywood',
    audioUrl: '/sounds/memes/aamir-khan-achha.mp3',
    fallbackSynth: 'bell',
  },
  {
    id: 'hey-bhagwan-kya-zulm',
    label: 'Hey Bhagwan Kya Zulm Hai!',
    subtitle: 'Bollywood Dramatic Reaction',
    emoji: '😩',
    category: 'bollywood',
    audioUrl: '/sounds/memes/hey-bhagwan-kya-zulm.mp3',
    fallbackSynth: 'dramatic',
  },
  {
    id: 'ae-kaun-hai-be',
    label: 'Ae Kaun Hai Be?!',
    subtitle: 'Double iSmart Action Dialogue',
    emoji: '🤨',
    category: 'bollywood',
    audioUrl: '/sounds/memes/ae-kaun-hai-be.mp3',
    fallbackSynth: 'slap',
  },

  // ==========================================
  // Category 2: Viral Indian Memes
  // ==========================================
  {
    id: 'ruko-zara',
    label: 'Ruko Zara, Sabar Karo!',
    subtitle: 'Hindustani Bhau Viral Meme',
    emoji: '✋',
    category: 'viral',
    audioUrl: '/sounds/memes/ruko-zara.mp3',
    fallbackSynth: 'horn',
  },
  {
    id: 'puneet-superstar',
    label: 'Acha Theek Hai Samajh Gaya!',
    subtitle: 'Lord Puneet Superstar',
    emoji: '😎',
    category: 'viral',
    audioUrl: '/sounds/memes/puneet-superstar.mp3',
    fallbackSynth: 'horn',
  },
  {
    id: 'abhi-maza-aayega',
    label: 'Abhi Maza Aayega Na Bhidu!',
    subtitle: 'Maza Aayega Viral Meme',
    emoji: '🥳',
    category: 'viral',
    audioUrl: '/sounds/memes/abhi-maza-aayega.mp3',
    fallbackSynth: 'horn',
  },
  {
    id: 'aayein',
    label: 'Aayein?! (Baingan)',
    subtitle: 'Aditya Kumar Viral Meme',
    emoji: '🤨',
    category: 'viral',
    audioUrl: '/sounds/memes/aayein.mp3',
    fallbackSynth: 'slap',
  },
  {
    id: 'baingan',
    label: 'Baingan! 🍆',
    subtitle: 'Aayein Baingan Meme',
    emoji: '🍆',
    category: 'viral',
    audioUrl: '/sounds/memes/baingan.mp3',
    fallbackSynth: 'slap',
  },
  {
    id: 'cameraman-focus',
    label: 'Camera Man Jaldi Focus Karo!',
    subtitle: 'Viral Reels Dialogue',
    emoji: '📸',
    category: 'viral',
    audioUrl: '/sounds/memes/cameraman-focus.mp3',
    fallbackSynth: 'horn',
  },
  {
    id: 'jaldi-waha-se-hato',
    label: 'Jaldi Wahan Se Hato!',
    subtitle: 'Viral Funny Audio',
    emoji: '🏃‍♂️',
    category: 'viral',
    audioUrl: '/sounds/memes/jaldi-waha-se-hato.mp3',
    fallbackSynth: 'slap',
  },
  {
    id: 'carryminati-yeh-kya-hai',
    label: 'Yeh Kya Hai?!',
    subtitle: 'CarryMinati Angry Reaction',
    emoji: '🤬',
    category: 'viral',
    audioUrl: '/sounds/memes/carryminati-yeh-kya-hai.mp3',
    fallbackSynth: 'slap',
  },
  {
    id: 'carryminati-1-second',
    label: 'Lekin 1 Second...',
    subtitle: 'CarryMinati 1 Second Meme',
    emoji: '⏱️',
    category: 'viral',
    audioUrl: '/sounds/memes/carryminati-1-second.mp3',
    fallbackSynth: 'dramatic',
  },
  {
    id: 'peeche-dekho',
    label: 'Peeche Toh Dekho!',
    subtitle: 'Pathan Kid Viral Meme',
    emoji: '👶',
    category: 'viral',
    audioUrl: '/sounds/memes/peeche-dekho.mp3',
    fallbackSynth: 'bell',
  },
  {
    id: 'hey-prabhu',
    label: 'Hey Prabhu Hey Hari Ram!',
    subtitle: 'Jagannath Premavatharam',
    emoji: '🙏',
    category: 'viral',
    audioUrl: '/sounds/memes/hey-prabhu.mp3',
    fallbackSynth: 'dramatic',
  },
  {
    id: 'ye-sab-kya-dekhna-pad-raha',
    label: 'Ye Sab Kya Dekhna Pad Raha Hai!',
    subtitle: 'Ankhon Me Tejaab Meme',
    emoji: '🙈',
    category: 'viral',
    audioUrl: '/sounds/memes/ye-sab-kya-dekhna-pad-raha.mp3',
    fallbackSynth: 'dramatic',
  },
  {
    id: 'so-beautiful-so-elegant',
    label: 'Just Looking Like A Wow!',
    subtitle: 'So Beautiful, So Elegant ✨',
    emoji: '✨',
    category: 'viral',
    audioUrl: '/sounds/memes/so-beautiful-so-elegant.mp3',
    fallbackSynth: 'bell',
  },
  {
    id: 'under-the-water',
    label: 'Hello I am Under The Water!',
    subtitle: 'Here Too Much Raining',
    emoji: '🌊',
    category: 'viral',
    audioUrl: '/sounds/memes/under-the-water.mp3',
    fallbackSynth: 'horn',
  },
  {
    id: 'kaise-kaise-log',
    label: 'Kaise Kaise Log Rehte Hain!',
    subtitle: 'Yahan Par Meme',
    emoji: '👥',
    category: 'viral',
    audioUrl: '/sounds/memes/kaise-kaise-log.mp3',
    fallbackSynth: 'dramatic',
  },
  {
    id: 'kya-haal-hai',
    label: 'Kya Haal Hai!',
    subtitle: 'Desi Greeting Meme',
    emoji: '👋',
    category: 'viral',
    audioUrl: '/sounds/memes/kya-haal-hai.mp3',
    fallbackSynth: 'horn',
  },
  {
    id: 'abe-bahar-nikal',
    label: 'Abe Bahar Nikal!',
    subtitle: 'TikTok Viral Video Audio',
    emoji: '🚪',
    category: 'viral',
    audioUrl: '/sounds/memes/abe-bahar-nikal.mp3',
    fallbackSynth: 'slap',
  },
  {
    id: 'ruk-abhi-batata-hu',
    label: 'Ruk Abhi Batata Hu!',
    subtitle: 'Desi Threat Meme',
    emoji: '👊',
    category: 'viral',
    audioUrl: '/sounds/memes/ruk-abhi-batata-hu.mp3',
    fallbackSynth: 'slap',
  },
  {
    id: 'arey-o-bhai-oye',
    label: 'Arey O Bhai Oye!',
    subtitle: 'Shocked Viral Sound',
    emoji: '📢',
    category: 'viral',
    audioUrl: '/sounds/memes/arey-o-bhai-oye.mp3',
    fallbackSynth: 'horn',
  },
  {
    id: 'ammi-bacha-le',
    label: 'Ammi Bacha Le!',
    subtitle: 'Desi Funny Scream',
    emoji: '🏃',
    category: 'viral',
    audioUrl: '/sounds/memes/ammi-bacha-le.mp3',
    fallbackSynth: 'dramatic',
  },
  {
    id: 'baap-re-baap',
    label: 'Baap Re Baap!',
    subtitle: 'Shocked Desi Reaction',
    emoji: '😲',
    category: 'viral',
    audioUrl: '/sounds/memes/baap-re-baap.mp3',
    fallbackSynth: 'dramatic',
  },
  {
    id: 'chalo-chalo',
    label: 'Chalo Chalo!',
    subtitle: 'Chalo Meme Sound',
    emoji: '🚶‍♂️',
    category: 'viral',
    audioUrl: '/sounds/memes/chalo-chalo.mp3',
    fallbackSynth: 'horn',
  },
  {
    id: 'kaun-hai-ye',
    label: 'Kaun Hai Ye Log?!',
    subtitle: 'Funny Meme Clips',
    emoji: '🤣',
    category: 'viral',
    audioUrl: '/sounds/memes/kaun-hai-ye.mp3',
    fallbackSynth: 'horn',
  },
  {
    id: 'hat-be-kaun-hai-tu',
    label: 'Hatt Be Kaun Hai Tu!',
    subtitle: 'Desi Roasting Dialogue',
    emoji: '😤',
    category: 'viral',
    audioUrl: '/sounds/memes/hat-be-kaun-hai-tu.mp3',
    fallbackSynth: 'slap',
  },
  {
    id: 'saale-tu',
    label: 'Saale Tuu!',
    subtitle: 'Laughing Comedy Audio',
    emoji: '😂',
    category: 'viral',
    audioUrl: '/sounds/memes/saale-tu.mp3',
    fallbackSynth: 'slap',
  },
  {
    id: 'i-am-a-magician',
    label: 'I Am A Magician',
    subtitle: 'O Manchi Magician Dialogue',
    emoji: '🎩',
    category: 'viral',
    audioUrl: '/sounds/memes/i-am-a-magician.mp3',
    fallbackSynth: 'bell',
  },
  {
    id: 'o-manchi-1',
    label: 'O Manchi! (Original)',
    subtitle: 'Funny Comedy Beat',
    emoji: '🕺',
    category: 'viral',
    audioUrl: '/sounds/memes/o-manchi-1.mp3',
    fallbackSynth: 'bell',
  },
  {
    id: 'o-manchi-2',
    label: 'O Manchi! (Part 2)',
    subtitle: 'Desi Comedy Track',
    emoji: '💃',
    category: 'viral',
    audioUrl: '/sounds/memes/o-manchi-2.mp3',
    fallbackSynth: 'bell',
  },
  {
    id: 'heii-free-fire',
    label: 'Heii Free Fire!',
    subtitle: 'Gaming Meme Dialogue',
    emoji: '🎮',
    category: 'viral',
    audioUrl: '/sounds/memes/heii-free-fire.mp3',
    fallbackSynth: 'horn',
  },
  {
    id: 'khelega-free-fire',
    label: 'Khelega Free Fire?!',
    subtitle: 'Desi Gamer Dialogue',
    emoji: '🔫',
    category: 'viral',
    audioUrl: '/sounds/memes/khelega-free-fire.mp3',
    fallbackSynth: 'horn',
  },
  {
    id: 'kaun-hai-be-sms',
    label: 'Kaun Hai Be SMS Ringtone',
    subtitle: 'Desi Funny Notification',
    emoji: '📱',
    category: 'viral',
    audioUrl: '/sounds/memes/kaun-hai-be-sms.mp3',
    fallbackSynth: 'bell',
  },
  {
    id: 'ye-le-sms',
    label: 'Ye Le SMS Ringtone',
    subtitle: 'Classic Alert Sound',
    emoji: '🔔',
    category: 'viral',
    audioUrl: '/sounds/memes/ye-le-sms.mp3',
    fallbackSynth: 'bell',
  },

  // ==========================================
  // Category 3: Table Beats & Casino SFX
  // ==========================================
  {
    id: 'rizz',
    label: 'The Rizz Saxophone',
    subtitle: 'Smooth Rizz Sound Effect 🎷',
    emoji: '🎷',
    category: 'beats',
    audioUrl: '/sounds/memes/rizz.mp3',
    fallbackSynth: 'horn',
  },
  {
    id: 'dramatic-dholak',
    label: 'Bollywood Dholak Roll',
    subtitle: 'Suspense Dholak Beat 🥁',
    emoji: '🥁',
    category: 'beats',
    fallbackSynth: 'dholak',
  },
  {
    id: 'dramatic-horns',
    label: 'Dramatic Brass Horns',
    subtitle: 'Suspense Tana-na-na 🎺',
    emoji: '🎺',
    category: 'beats',
    fallbackSynth: 'horn',
  },
  {
    id: 'casino-bell',
    label: 'Casino Jackpot Bells',
    subtitle: 'Vegas Chimes & Win Bells 🔔',
    emoji: '🔔',
    category: 'beats',
    fallbackSynth: 'bell',
  },
];

// High-Fidelity Web Audio Synthesizers via Central SoundManager
export function playSynthSound(type?: string) {
  if (typeof window === 'undefined') return;
  try {
    const ctx = sounds.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'cash') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.3, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.36);
      });
    } else if (type === 'horn') {
      [330, 392, 523, 659].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.25, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.42);
      });
    } else if (type === 'dholak') {
      [130, 95, 120, 80, 55].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        osc.frequency.exponentialRampToValueAtTime(35, now + i * 0.1 + 0.09);
        gain.gain.setValueAtTime(0.5, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.1);
      });
    } else if (type === 'bell') {
      [1200, 1500, 1800, 2400].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gain.gain.setValueAtTime(0.35, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.52);
      });
    } else if (type === 'slap') {
      sounds.playChappalSlap();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } else {
      [150, 180, 225].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.45);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.46);
      });
    }
  } catch (err) {
    console.warn('Audio synthesis fallback error:', err);
  }
}

// Active Audio Element Cache
let currentPlayingAudio: HTMLAudioElement | null = null;

export function stopSoundboardAudio() {
  if (currentPlayingAudio) {
    try {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
      currentPlayingAudio.removeAttribute('src');
      currentPlayingAudio.load();
    } catch {}
    currentPlayingAudio = null;
  }
}

export function playSoundboardAudio(url?: string, fallbackSynth?: string) {
  if (typeof window === 'undefined') return;

  // 1. Prime / resume Web Audio context
  sounds.unlock();

  // 2. Stop and completely unload any previously playing audio
  stopSoundboardAudio();

  // 3. If url provided (local or custom link), play the real MP3 file!
  if (url && url.trim()) {
    try {
      const audio = new Audio(url.trim());
      audio.volume = 0.95;
      audio.loop = false; // Strictly enforce non-looping

      audio.onended = () => {
        if (currentPlayingAudio === audio) {
          currentPlayingAudio = null;
        }
      };
      audio.onerror = () => {
        if (currentPlayingAudio === audio) {
          currentPlayingAudio = null;
        }
      };

      currentPlayingAudio = audio;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // If aborted because another sound was queued or tab was switched, silently return
          if (err?.name === 'AbortError') return;
          console.warn('Audio play fallback to synth:', err);
          if (fallbackSynth) playSynthSound(fallbackSynth);
        });
      }
      return;
    } catch (err) {
      console.warn('Failed to initialize Audio:', err);
    }
  }

  // 4. Fallback synthesizer if no URL or beats category
  if (fallbackSynth) {
    playSynthSound(fallbackSynth);
  }
}
