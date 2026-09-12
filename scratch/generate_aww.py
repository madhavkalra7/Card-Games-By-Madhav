import math
import wave
import struct
import os

def generate_aww(filename, duration=1.8, sample_rate=44100):
    num_samples = int(duration * sample_rate)
    samples = []

    # Chorus voices with pitch glide:
    # Starts at ~420Hz, rises to ~445Hz, then slides down to ~240Hz
    # Formant filter approximation: mix harmonics with vocal envelope
    for i in range(num_samples):
        t = i / sample_rate
        
        # Envelope: Attack 0.08s, Sustain, Decay from 1.2s to 1.8s
        if t < 0.08:
            env = t / 0.08
        elif t < 1.1:
            env = 1.0 - 0.15 * (t - 0.08)
        else:
            env = 0.85 * max(0.0, 1.0 - (t - 1.1) / 0.7)
            
        # Pitch curve: "Awww" inflection (slight rise then sad droop)
        if t < 0.15:
            f0 = 415 + 30 * math.sin(t / 0.15 * (math.pi / 2))
        else:
            progress = (t - 0.15) / (duration - 0.15)
            # Gentle exponential drop with comic vibrato
            vibrato = 3.5 * math.sin(2 * math.pi * 5.5 * t) * (progress ** 0.5)
            f0 = 445 * math.pow(0.55, progress) + vibrato

        # Formant frequencies (Ah -> Oh/Aw)
        # Formant 1: 720Hz -> 480Hz
        # Formant 2: 1200Hz -> 820Hz
        progress_f = min(1.0, t / (duration * 0.85))
        f1 = 750 - 270 * progress_f
        f2 = 1250 - 430 * progress_f

        # Harmonics sum weighted by vocal formants
        val = 0.0
        # Voice 1 (lead)
        phase1 = 2 * math.pi * f0 * t
        # Voice 2 (detuned slightly +4Hz for crowd chorus)
        phase2 = 2 * math.pi * (f0 * 1.012) * t + 0.5
        # Voice 3 (sub-harmony a minor third down for sad crowd feel)
        phase3 = 2 * math.pi * (f0 * 0.84) * t + 1.2

        for h in range(1, 10):
            freq = f0 * h
            # Formant resonance weights
            res1 = 1.0 / (1.0 + 0.08 * math.pow(freq - f1, 2) / (f1 + 1))
            res2 = 0.7 / (1.0 + 0.08 * math.pow(freq - f2, 2) / (f2 + 1))
            weight = (res1 + res2) / (h ** 0.6)
            val += weight * (math.sin(phase1 * h) * 0.5 + math.sin(phase2 * h) * 0.3 + math.sin(phase3 * h) * 0.2)

        # Funny cartoon slide whistle layer (gentle triangle wave)
        slide_f = 520 * math.pow(0.5, min(1.0, t / 1.5))
        triangle = (2 / math.pi) * math.asin(math.sin(2 * math.pi * slide_f * t))
        val = val * 0.75 + triangle * 0.25 * env

        sample = int(max(-32767, min(32767, val * env * 22000)))
        samples.append(sample)

    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        raw_data = struct.pack('<' + 'h' * len(samples), *samples)
        wav_file.writeframes(raw_data)
    print(f"Generated {filename} successfully ({len(samples)} samples)")

if __name__ == '__main__':
    generate_aww('e:/Card Games By madhav/public/sounds/aww.wav')
