// Web Audio API Procedural Funky Music Generator
// Produces an authentic, upbeat 70s/80s style funk groove with slap bass, drums, and clav stabs.

class FunkyMusicEngine {
  private ctx: AudioContext | null = null;
  private isPlayingState: boolean = false;
  private timerId: any = null;
  private masterGain: GainNode | null = null;
  private nextNoteTime: number = 0;
  private currentStep: number = 0;
  private tempo: number = 114; // Funky upbeat tempo
  private subscribers: Set<(playing: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cg_landing_music');
      // Default to true on desktop if user enabled before, or keep false until first user interaction
      this.isPlayingState = saved === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.32, this.ctx.currentTime); // pleasant background volume
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public subscribe(fn: (playing: boolean) => void) {
    this.subscribers.add(fn);
    fn(this.isPlayingState);
    return () => this.subscribers.delete(fn);
  }

  private notify() {
    this.subscribers.forEach(fn => fn(this.isPlayingState));
    if (typeof window !== 'undefined') {
      localStorage.setItem('cg_landing_music', this.isPlayingState ? 'true' : 'false');
    }
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }

  public toggle(): boolean {
    if (this.isPlayingState) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlayingState;
  }

  public start() {
    if (this.isPlayingState && this.timerId) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isPlayingState = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    // Lookahead scheduler loop (runs every 25ms, schedules ahead by 100ms)
    this.timerId = setInterval(() => {
      this.scheduleLoop();
    }, 25);

    this.notify();
  }

  public stop() {
    this.isPlayingState = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.notify();
  }

  private scheduleLoop() {
    if (!this.ctx || !this.isPlayingState) return;

    const secondsPer16th = (60.0 / this.tempo) / 4.0;
    const scheduleAheadTime = 0.12;

    while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
      this.playStep(this.currentStep, this.nextNoteTime);
      this.nextNoteTime += secondsPer16th;
      this.currentStep = (this.currentStep + 1) % 32; // 2-bar loop (32 16th notes)
    }
  }

  private playStep(step: number, time: number) {
    if (!this.ctx || !this.masterGain) return;

    // --- 1. DRUMS ---
    // Kick Drum (Funky syncopated bounce: 0, 6, 10, 16, 22, 26)
    if ([0, 6, 10, 16, 22, 26].includes(step)) {
      this.playKick(time);
    }

    // Snare / Clap (Backbeat on 4, 12, 20, 28 + ghost snares)
    if ([4, 12, 20, 28].includes(step)) {
      this.playSnare(time, 0.7);
    } else if ([15, 31].includes(step)) {
      this.playSnare(time, 0.25); // Ghost snare
    }

    // Hi-Hats (16th groove with accents)
    if (step % 2 === 0) {
      const isOpen = [2, 10, 18, 26].includes(step);
      this.playHiHat(time, isOpen ? 0.45 : 0.25, isOpen);
    } else if ([3, 7, 11, 19, 23, 27].includes(step)) {
      this.playHiHat(time, 0.15, false);
    }

    // --- 2. FUNKY BASSLINE (D minor funk groove) ---
    // Notes: D2=73.4Hz, F2=87.3Hz, G2=98Hz, G#2=103.8Hz, A2=110Hz, C3=130.8Hz, D3=146.8Hz, F3=174.6Hz
    const bassMap: Record<number, { freq: number; dur: number; slap?: boolean }> = {
      0:  { freq: 73.42, dur: 0.2, slap: true },    // D2 punch
      3:  { freq: 146.83, dur: 0.12, slap: true },  // D3 pop
      6:  { freq: 87.31, dur: 0.15 },               // F2
      8:  { freq: 98.00, dur: 0.12 },               // G2
      10: { freq: 103.83, dur: 0.09 },              // G#2 (chromatic slide)
      11: { freq: 110.00, dur: 0.22 },              // A2
      14: { freq: 130.81, dur: 0.15 },              // C3

      16: { freq: 73.42, dur: 0.2, slap: true },    // D2 punch
      19: { freq: 146.83, dur: 0.12, slap: true },  // D3 pop
      22: { freq: 174.61, dur: 0.15 },              // F3
      24: { freq: 146.83, dur: 0.12 },              // D3
      26: { freq: 130.81, dur: 0.12 },              // C3
      28: { freq: 110.00, dur: 0.14 },              // A2
      30: { freq: 130.81, dur: 0.14 },              // C3
    };

    if (bassMap[step]) {
      const b = bassMap[step];
      this.playBassNote(b.freq, time, b.dur, b.slap);
    }

    // --- 3. FUNKY CHORD STABS (Wah Clavinet Stabs) ---
    // Stabs on syncopated funk beats: 2, 5, 12, 14, 18, 21, 28, 30
    if ([2, 5, 14, 18, 21, 30].includes(step)) {
      const chord = step < 16
        ? [293.66, 349.23, 440.00, 523.25] // Dm7 (D4, F4, A4, C5)
        : [293.66, 392.00, 493.88, 659.25]; // G9 (D4, G4, B4, E5)
      this.playChordStab(chord, time, 0.12);
    }
  }

  // Punchy Kick Drum
  private playKick(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.11);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.13);
  }

  // Snappy Snare with Noise Burst
  private playSnare(time: number, vol: number = 0.6) {
    if (!this.ctx || !this.masterGain) return;

    // Tone body
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(90, time + 0.1);

    oscGain.gain.setValueAtTime(vol * 0.4, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.11);

    // Noise snap
    const bufferSize = this.ctx.sampleRate * 0.12;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1100, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(vol * 0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    whiteNoise.start(time);
    whiteNoise.stop(time + 0.13);
  }

  // Crisp Hi-Hat
  private playHiHat(time: number, vol: number, isOpen: boolean) {
    if (!this.ctx || !this.masterGain) return;

    const duration = isOpen ? 0.22 : 0.05;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(8500, time);
    filter.Q.setValueAtTime(2.0, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(time);
    whiteNoise.stop(time + duration + 0.01);
  }

  // Slap Synth Bass (Resonant low-pass filter with envelope)
  private playBassNote(freq: number, time: number, duration: number, slap: boolean = false) {
    if (!this.ctx || !this.masterGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq / 2, time); // Sub-octave for heavy low-end

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(slap ? 4.5 : 3.0, time);

    // Filter envelope (gives the funk "wah/thump")
    const cutoffStart = slap ? freq * 8 : freq * 5;
    filter.frequency.setValueAtTime(cutoffStart, time);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.6, time + duration * 0.7);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(slap ? 0.55 : 0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 0.01);
    osc2.stop(time + duration + 0.01);
  }

  // Funky Clavinet Chords
  private playChordStab(notes: number[], time: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;

    notes.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, time);
      filter.frequency.exponentialRampToValueAtTime(600, time + duration);
      filter.Q.setValueAtTime(2.2, time);

      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.09, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + duration + 0.01);
    });
  }
}

export const funkyMusic = new FunkyMusicEngine();
