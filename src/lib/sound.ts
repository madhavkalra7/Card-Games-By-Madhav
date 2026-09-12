class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cg_muted');
      this.isMuted = saved === 'true';
    }
  }

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public unlock(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public getContext(): AudioContext | null {
    return this.unlock();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('cg_muted', this.isMuted ? 'true' : 'false');
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Card slide / deal sound (gentle white-noise sweep + filter)
  public playCardSlide() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch {
      // Audio context might be restricted before user interaction
    }
  }

  // Alias for drawing cards
  public playCardDraw() {
    this.playCardSlide();
  }

  // Card snap / flip sound (crisp high click)
  public playCardFlip() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {}
  }

  // Bazaar Open golden chime
  public playBazaarOpen() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.25, this.ctx!.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + idx * 0.08);
        osc.stop(this.ctx!.currentTime + idx * 0.08 + 0.45);
      });
    } catch {}
  }

  private lastPenaltyPlayTime: number = 0;

  // Penalty sound: replaced with /chakko.ogg (auto penalty & penalty calls)
  public playPenalty() {
    if (this.isMuted) return;
    const now = Date.now();
    if (now - this.lastPenaltyPlayTime < 400) return;
    this.lastPenaltyPlayTime = now;

    try {
      if (typeof window !== 'undefined') {
        const audio = new Audio('/chakko.ogg');
        audio.volume = 0.95;
        audio.loop = false;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('chakko.ogg play error, falling back to synth:', err);
            this.playPenaltySynthFallback();
          });
        }
        return;
      }
    } catch {
      this.playPenaltySynthFallback();
    }
  }

  private playPenaltySynthFallback() {
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch {}
  }

  private lastAwwPlayTime: number = 0;

  // Funny comical "Awwwww~" sound for honest showdown reveal
  public playAww() {
    if (this.isMuted) return;
    const now = Date.now();
    if (now - this.lastAwwPlayTime < 600) return;
    this.lastAwwPlayTime = now;

    try {
      if (typeof window !== 'undefined') {
        const audio = new Audio('/sounds/aww.wav');
        audio.volume = 0.95;
        audio.loop = false;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('aww.wav play error, falling back to synth:', err);
            this.playAwwSynthFallback();
          });
        }
        return;
      }
    } catch {
      this.playAwwSynthFallback();
    }
  }

  // Web Audio synthesizer fallback for comical crowd "Awwwww~"
  private playAwwSynthFallback() {
    try {
      this.init();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      // 1. Vocal formant filter
      const filter1 = ctx.createBiquadFilter();
      filter1.type = 'bandpass';
      filter1.Q.setValueAtTime(4.0, now);
      filter1.frequency.setValueAtTime(740, now);
      filter1.frequency.exponentialRampToValueAtTime(480, now + 1.4);

      const filter2 = ctx.createBiquadFilter();
      filter2.type = 'bandpass';
      filter2.Q.setValueAtTime(5.0, now);
      filter2.frequency.setValueAtTime(1220, now);
      filter2.frequency.exponentialRampToValueAtTime(780, now + 1.4);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.01, now);
      masterGain.gain.linearRampToValueAtTime(0.4, now + 0.08);
      masterGain.gain.setValueAtTime(0.35, now + 1.0);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

      filter1.connect(masterGain);
      filter2.connect(masterGain);
      masterGain.connect(ctx.destination);

      // 2. Harmonized vocal chorus oscillators sliding down
      const pitches = [420, 426, 355]; // Root, detune, minor third
      pitches.forEach((startFreq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx === 0 ? 'sawtooth' : 'triangle';

        // Pitch inflection: initial peak then gentle descent
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.linearRampToValueAtTime(startFreq * 1.06, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 0.58, now + 1.5);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(idx === 0 ? 0.35 : 0.25, now);

        osc.connect(oscGain);
        oscGain.connect(filter1);
        oscGain.connect(filter2);

        osc.start(now);
        osc.stop(now + 1.65);
      });

      // 3. Funny cartoon slide whistle
      const slideOsc = ctx.createOscillator();
      const slideGain = ctx.createGain();
      slideOsc.type = 'sine';
      slideOsc.frequency.setValueAtTime(500, now);
      slideOsc.frequency.exponentialRampToValueAtTime(240, now + 1.3);

      slideGain.gain.setValueAtTime(0.12, now);
      slideGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

      slideOsc.connect(slideGain);
      slideGain.connect(ctx.destination);

      slideOsc.start(now);
      slideOsc.stop(now + 1.35);
    } catch {}
  }

  // Win Victory Fanfare
  public playVictory() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const chords = [
        [523.25, 659.25, 783.99],
        [587.33, 739.99, 880.00],
        [659.25, 830.61, 987.77],
        [783.99, 987.77, 1174.66],
      ];

      chords.forEach((chord, step) => {
        const time = this.ctx!.currentTime + step * 0.22;
        chord.forEach(freq => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);

          gain.gain.setValueAtTime(0.18, time);
          gain.gain.exponentialRampToValueAtTime(0.005, time + 0.5);

          osc.connect(gain);
          gain.connect(this.ctx!.destination);

          osc.start(time);
          osc.stop(time + 0.55);
        });
      });
    } catch {}
  }

  // Timer Tick
  public playTick() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {}
  }

  // ==========================================
  // Desi Virtual Throwables Synthesizers
  // ==========================================

  // 1. Throw Flight Whoosh
  public playThrowWhoosh() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(560, this.ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(240, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch {}
  }

  // 2. Chappal Slap ("PHATAK!")
  public playChappalSlap() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      // Low punchy impact thud
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.18);
      oscGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);

      // Sharp white noise snap for the leather/rubber slap
      const bufferSize = this.ctx.sampleRate * 0.12;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.025));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start();
    } catch {}
  }

  // 3. Hot Chai Splash & Sizzle
  public playChaiSplash() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.35);
      filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {}
  }

  // 4. Tomato Wet Squish
  public playTomatoSquish() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.22);

      gain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.23);
    } catch {}
  }

  // 5. Cash Shower Coin & Chip Sparkle
  public playCashChime() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const notes = [987.77, 1318.51, 1567.98, 1975.53]; // B5, E6, G6, B6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.05);

        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.005, this.ctx!.currentTime + idx * 0.05 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + idx * 0.05);
        osc.stop(this.ctx!.currentTime + idx * 0.05 + 0.32);
      });
    } catch {}
  }

  // 6. Rose Love Harp Chime
  public playRoseChime() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0.18, this.ctx!.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.005, this.ctx!.currentTime + idx * 0.06 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + idx * 0.06);
        osc.stop(this.ctx!.currentTime + idx * 0.06 + 0.42);
      });
    } catch {}
  }

  // Realistic physical book page flip sound (gentle paper flutter + air swoosh)
  public playPageFlip() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // White noise buffer for paper texture
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.28);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(450, now + 0.25);
      filter.Q.setValueAtTime(1.8, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.28);
    } catch {}
  }

  // Shimmer / sparkle sound when inspecting a holographic card
  public playCardShimmer() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const freqs = [880, 1174.66, 1396.91, 1760, 2093];
      freqs.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.04);
        gain.gain.setValueAtTime(0.08, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.27);
      });
    } catch {}
  }
}

export const sounds = new SoundManager();

// Automatically unlock AudioContext on the very first user interaction
if (typeof window !== 'undefined') {
  const unlockAudioOnGesture = () => {
    sounds.unlock();
    window.removeEventListener('click', unlockAudioOnGesture);
    window.removeEventListener('touchstart', unlockAudioOnGesture);
    window.removeEventListener('pointerdown', unlockAudioOnGesture);
    window.removeEventListener('keydown', unlockAudioOnGesture);
  };
  window.addEventListener('click', unlockAudioOnGesture, { passive: true });
  window.addEventListener('touchstart', unlockAudioOnGesture, { passive: true });
  window.addEventListener('pointerdown', unlockAudioOnGesture, { passive: true });
  window.addEventListener('keydown', unlockAudioOnGesture, { passive: true });
}
