import { getSocket } from '@/socket/client';
import { useVoiceStore } from '@/store/voiceStore';

// Multi-layered ICE servers: High-speed Google + Cloudflare Anycast STUN + Twilio + Nextcloud + OpenRelay TCP TURN.
// Engineered specifically for resilient cross-network mobile & desktop connections (Jio, Airtel, Vi, Wi-Fi, symmetric NATs).

let dynamicTurnConfig: { turnUrl?: string; username?: string; credential?: string } | null = null;

// Pre-fetch server-side TURN config if configured as Vercel Secret (TURN_URL / TURN_USERNAME / TURN_CREDENTIAL)
if (typeof window !== 'undefined') {
  fetch('/api/turn-servers')
    .then((r) => r.json())
    .then((data) => {
      if (data && data.turnUrl) {
        dynamicTurnConfig = data;
      }
    })
    .catch(() => {});
}

const getIceServers = (): RTCConfiguration => {
  const customTurnUrl = process.env.NEXT_PUBLIC_TURN_URL || dynamicTurnConfig?.turnUrl;
  const customTurnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME || dynamicTurnConfig?.username;
  const customTurnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL || dynamicTurnConfig?.credential;

  const servers: RTCIceServer[] = [
    // 1. Google Public STUN (Ultra-fast 18ms latency, 5 multi-port global anycast endpoints)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },

    // 2. Cloudflare Anycast STUN (Ultra-low 30ms latency, edge nodes across Mumbai, Delhi, Bangalore, Chennai)
    { urls: 'stun:stun.cloudflare.com:3478' },

    // 3. Twilio Global STUN (36ms latency)
    { urls: 'stun:global.stun.twilio.com:3478' },

    // 4. Nextcloud STUN on port 443 (Bypasses restrictive cellular firewalls blocking default STUN UDP 3478)
    { urls: 'stun:stun.nextcloud.com:443' },
    { urls: 'stun:stun.nextcloud.com:3478' },

    // 5. Metered OpenRelay TURN over TCP (Reliably pierces restrictive cellular CGNAT, Jio/Airtel symmetric NAT, and carrier firewalls)
    {
      urls: [
        'turn:openrelay.metered.ca:80?transport=tcp',
        'turn:openrelay.metered.ca:443?transport=tcp',
        'turns:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelay',
      credential: 'openrelay',
    },
  ];

  // Optional custom TURN credentials configured in environment variables (e.g. Metered/Xirsys/Twilio)
  if (customTurnUrl) {
    servers.unshift({
      urls: customTurnUrl,
      username: customTurnUsername,
      credential: customTurnCredential,
    });
  }

  return {
    iceServers: servers,
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceTransportPolicy: 'all',
  };
};

/**
 * Optimizes the WebRTC Session Description Protocol (SDP) specifically for speech audio.
 * Enforces in-band Forward Error Correction (FEC), Discontinuous Transmission (DTX),
 * and optimal 32kbps bitrate to eliminate robotic/choppy voice on mobile and distant networks.
 */
function optimizeOpusSdp(sdp: string): string {
  if (!sdp) return sdp;

  // Find opus payload type (typically 111)
  const opusMatch = sdp.match(/a=rtpmap:(\d+)\s+opus\/48000/i);
  if (!opusMatch) return sdp;

  const pt = opusMatch[1];
  const fmtpRegex = new RegExp(`a=fmtp:${pt}\\s+([^\r\n]*)`, 'i');
  const fmtpMatch = sdp.match(fmtpRegex);

  // Key parameters:
  // - minptime=10: allows low-latency 10ms frame packets under jitter
  // - useinbandfec=1: in-band Forward Error Correction recovers dropped speech packets automatically!
  // - usedtx=1: Discontinuous transmission saves mobile data and bandwidth during silence
  // - stereo=0 & sprop-stereo=0: Mono encoding cuts bandwidth by 50%
  // - maxaveragebitrate=32000: 32kbps pristine voice clarity without cellular packet congestion
  // - cbr=0: variable bitrate adapts dynamically to network fluctuations
  const desiredParams: Record<string, string> = {
    minptime: '10',
    useinbandfec: '1',
    usedtx: '1',
    stereo: '0',
    'sprop-stereo': '0',
    maxaveragebitrate: '32000',
    cbr: '0',
  };

  if (fmtpMatch) {
    const existingParams = fmtpMatch[1].split(';').reduce((acc, param) => {
      const [k, v] = param.trim().split('=');
      if (k) acc[k] = v || '';
      return acc;
    }, {} as Record<string, string>);

    const merged = { ...existingParams, ...desiredParams };
    const newFmtp = Object.entries(merged)
      .map(([k, v]) => (v ? `${k}=${v}` : k))
      .join(';');
    return sdp.replace(fmtpRegex, `a=fmtp:${pt} ${newFmtp}`);
  } else {
    const newFmtp = Object.entries(desiredParams)
      .map(([k, v]) => `${k}=${v}`)
      .join(';');
    return sdp.replace(
      opusMatch[0],
      `${opusMatch[0]}\r\na=fmtp:${pt} ${newFmtp}`
    );
  }
}

interface PeerConnectionRecord {
  pc: RTCPeerConnection;
  audio: HTMLAudioElement;
  analyser?: AnalyserNode;
  pendingCandidates: RTCIceCandidateInit[];
  makingOffer: boolean;
  restartTimer?: any;
}

class VoiceManager {
  private localStream: MediaStream | null = null;
  private peers: Map<string, PeerConnectionRecord> = new Map();
  private currentRoomCode: string | null = null;
  private audioCtx: AudioContext | null = null;
  private speakingIntervalId: any = null;
  private isInitialized = false;
  private unblockRegistered = false;

  public async joinVoice(roomCode: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const store = useVoiceStore.getState();
    if (store.isInVoice) return true;

    store.setIsConnecting(true);
    store.setError(null);
    this.currentRoomCode = roomCode.toUpperCase();

    // Ensure dynamic TURN config is loaded before peer connections start
    if (!dynamicTurnConfig && typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/turn-servers');
        const data = await res.json();
        if (data && data.turnUrl) {
          dynamicTurnConfig = data;
        }
      } catch (e) {}
    }

    try {
      // 1. Initialize and unlock AudioContext on user gesture (crucial for iOS Safari & Android Chrome)
      this.setupAudioContext();
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume().catch((e) => console.warn('AudioContext resume warning:', e));
      }
      this.primeAudioContext();

      // Register interaction unlocker so any subsequent tap unblocks pending remote audio
      this.registerAutoplayUnlock();

      // 2. Request microphone permission with speech-optimized constraints
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },
            channelCount: { ideal: 1 },
            sampleRate: { ideal: 48000 },
          },
          video: false,
        });
      } catch (constraintErr) {
        console.warn('[WebRTC] Advanced audio constraints rejected, falling back to standard audio:', constraintErr);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      }

      // Mark audio tracks as human speech for browser hardware acoustic processors
      stream.getAudioTracks().forEach((track) => {
        if ('contentHint' in track) {
          (track as any).contentHint = 'speech';
        }
      });

      this.localStream = stream;

      // Apply current mute state to mic tracks
      const isMuted = store.isMicMuted;
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });

      // 3. Setup Web Audio API volume analyzer for local mic speaking detection
      if (this.audioCtx) {
        try {
          const source = this.audioCtx.createMediaStreamSource(this.localStream);
          const analyser = this.audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.5;
          source.connect(analyser);
          this.startSpeakingMonitor(analyser);
        } catch (e) {
          console.warn('AudioContext local analyzer error:', e);
        }
      }

      // 4. Setup socket signaling listeners
      this.setupSocketListeners();

      // 5. Emit join voice event to server
      const socket = getSocket();
      return new Promise<boolean>((resolve) => {
        socket.emit('voice:join', { roomCode: this.currentRoomCode }, async (res: any) => {
          if (!res || !res.success) {
            store.setError(res?.error || 'Failed to join voice channel');
            this.leaveVoice();
            resolve(false);
            return;
          }

          store.setIsInVoice(true);
          store.setIsConnecting(false);

          // Single-Offerer Pattern:
          // The server notifies existing peers via 'voice:peer-joined'.
          // Existing peers will initiate offers to this newcomer, preventing glare/collisions.
          // Newcomer sets up connection records and awaits incoming offers.
          const existingPeers: string[] = res.peers || [];
          console.log(`[WebRTC] Successfully joined voice room ${this.currentRoomCode}. Existing peers:`, existingPeers);

          existingPeers.forEach((peerId) => {
            this.getOrCreatePeerRecord(peerId);
          });

          // Fallback safety: If an existing peer does not initiate within 2.5s, newcomer initiates
          setTimeout(() => {
            if (!store.isInVoice) return;
            existingPeers.forEach(async (peerId) => {
              const rec = this.peers.get(peerId);
              if (rec && rec.pc.connectionState !== 'connected' && rec.pc.signalingState === 'stable') {
                console.log(`[WebRTC] Fallback initiating offer to ${peerId}...`);
                await this.initiatePeerConnection(peerId);
              }
            });
          }, 2500);

          resolve(true);
        });
      });
    } catch (err: any) {
      console.error('Microphone access denied or error:', err);
      store.setIsConnecting(false);
      store.setError(
        err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access in your browser settings.'
          : err.message
      );
      this.leaveVoice();
      return false;
    }
  }

  public leaveVoice() {
    // 1. Stop local audio tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // 2. Close and remove all peer connections and audio elements
    this.peers.forEach(({ pc, audio, restartTimer }) => {
      try {
        if (restartTimer) clearTimeout(restartTimer);
        pc.close();
        audio.pause();
        audio.srcObject = null;
        audio.remove();
      } catch (e) {}
    });
    this.peers.clear();

    // 3. Stop speaking monitor
    if (this.speakingIntervalId) {
      clearInterval(this.speakingIntervalId);
      this.speakingIntervalId = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }

    // 4. Emit leave event
    if (this.currentRoomCode) {
      const socket = getSocket();
      socket.emit('voice:leave', { roomCode: this.currentRoomCode });
      this.currentRoomCode = null;
    }

    this.removeSocketListeners();
    useVoiceStore.getState().resetVoiceState();
  }

  public toggleMute(): boolean {
    const store = useVoiceStore.getState();
    const newMuted = !store.isMicMuted;
    store.setIsMicMuted(newMuted);

    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted;
      });
    }

    // Broadcast state to room
    if (this.currentRoomCode) {
      const socket = getSocket();
      socket.emit('voice:state', {
        roomCode: this.currentRoomCode,
        isMuted: newMuted,
        isDeafened: store.isDeafened,
      });
    }

    if (newMuted) {
      useVoiceStore.getState().setPeerSpeaking('me', false);
    }

    return newMuted;
  }

  public toggleDeafen(): boolean {
    const store = useVoiceStore.getState();
    const newDeafened = !store.isDeafened;
    store.setIsDeafened(newDeafened);

    // Mute/unmute all remote audio elements
    this.peers.forEach(({ audio }) => {
      audio.muted = newDeafened;
    });

    // Also auto-mute mic if deafened
    if (newDeafened && !store.isMicMuted) {
      this.toggleMute();
    }

    // Broadcast state to room
    if (this.currentRoomCode) {
      const socket = getSocket();
      socket.emit('voice:state', {
        roomCode: this.currentRoomCode,
        isMuted: useVoiceStore.getState().isMicMuted,
        isDeafened: newDeafened,
      });
    }

    return newDeafened;
  }

  private setupAudioContext() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && (!this.audioCtx || this.audioCtx.state === 'closed')) {
        this.audioCtx = new AudioCtx();
      }
    } catch (e) {
      console.warn('Could not initialize AudioContext:', e);
    }
  }

  // Play a tiny silent buffer to warm up browser audio subsystem on user gesture
  private primeAudioContext() {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.02);
    } catch (e) {}
  }

  // Fallback for strict mobile autoplay policies: unlocks audio on any subsequent tap
  private registerAutoplayUnlock() {
    if (this.unblockRegistered || typeof window === 'undefined') return;
    this.unblockRegistered = true;

    const unlockHandler = () => {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      this.peers.forEach(({ audio }) => {
        if (audio.paused && audio.srcObject) {
          audio.play().catch((err) => console.warn('[WebRTC] Autoplay retry note:', err));
        }
      });

      window.removeEventListener('click', unlockHandler, true);
      window.removeEventListener('touchstart', unlockHandler, true);
      window.removeEventListener('keydown', unlockHandler, true);
      this.unblockRegistered = false;
    };

    window.addEventListener('click', unlockHandler, { capture: true, once: true });
    window.addEventListener('touchstart', unlockHandler, { capture: true, once: true });
    window.addEventListener('keydown', unlockHandler, { capture: true, once: true });
  }

  private startSpeakingMonitor(localAnalyser: AnalyserNode) {
    const dataArray = new Uint8Array(localAnalyser.frequencyBinCount);

    this.speakingIntervalId = setInterval(() => {
      const store = useVoiceStore.getState();
      if (!store.isInVoice || store.isMicMuted) {
        store.setPeerSpeaking('me', false);
      } else {
        // Check local mic volume
        localAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const isSpeaking = avg > 14;
        store.setPeerSpeaking('me', isSpeaking);
      }

      // Check remote peers volume
      this.peers.forEach(({ analyser }, peerId) => {
        if (!analyser || store.isDeafened) {
          store.setPeerSpeaking(peerId, false);
          return;
        }
        const peerData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(peerData);
        let peerSum = 0;
        for (let i = 0; i < peerData.length; i++) {
          peerSum += peerData[i];
        }
        const peerAvg = peerSum / peerData.length;
        store.setPeerSpeaking(peerId, peerAvg > 14);
      });
    }, 120);
  }

  private getOrCreatePeerRecord(peerId: string): PeerConnectionRecord {
    if (this.peers.has(peerId)) {
      return this.peers.get(peerId)!;
    }

    const pc = new RTCPeerConnection(getIceServers());
    const audio = new Audio();
    audio.autoplay = true;
    audio.muted = useVoiceStore.getState().isDeafened;
    audio.volume = 1.0;
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    // Using offscreen fixed styling instead of display:none prevents iOS Safari & Chrome WebKit from pausing background audio
    audio.style.position = 'fixed';
    audio.style.bottom = '0';
    audio.style.left = '0';
    audio.style.width = '1px';
    audio.style.height = '1px';
    audio.style.opacity = '0.001';
    audio.style.pointerEvents = 'none';
    document.body.appendChild(audio);

    const record: PeerConnectionRecord = {
      pc,
      audio,
      pendingCandidates: [],
      makingOffer: false,
    };

    // Stream incoming audio from remote peer
    pc.ontrack = (event) => {
      let stream = (event.streams && event.streams[0]) || null;
      if (!stream && event.track) {
        stream = new MediaStream([event.track]);
      }
      if (!stream) return;

      // 1. Play dedicated remote stream via HTMLAudioElement (cleanest audio output, native echo cancellation)
      audio.srcObject = stream;

      const attemptPlay = () => {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => {
            console.warn(`[WebRTC] Audio element play blocked for ${peerId}:`, e);
            this.registerAutoplayUnlock();
          });
        }
      };

      attemptPlay();

      // Ensure playback when first RTP packet un-mutes the track over the network
      event.track.onunmute = () => {
        attemptPlay();
      };

      // 2. Attach Web Audio API analyser ONLY for speaking detection indicator
      // Never route to audioCtx.destination! Dual routing causes echo feedback and phase cancellation.
      if (this.audioCtx && this.audioCtx.state !== 'closed') {
        try {
          if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(() => {});
          }

          const source = this.audioCtx.createMediaStreamSource(stream);
          const analyser = this.audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.5;
          source.connect(analyser);

          record.analyser = analyser;
        } catch (err) {
          console.warn('[WebRTC] Could not attach Web Audio analyser to remote stream:', err);
        }
      }
    };

    // Add local mic tracks to this peer connection
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        const sender = pc.addTrack(track, this.localStream!);

        // Enforce audio priority and optimal encoding parameters on the sender
        if (sender && sender.setParameters) {
          try {
            const params = sender.getParameters();
            if (!params.encodings || params.encodings.length === 0) {
              params.encodings = [{}];
            }
            params.encodings[0].maxBitrate = 32000;
            params.encodings[0].priority = 'high';
            params.encodings[0].networkPriority = 'high';
            (params as any).degradationPreference = 'maintain-framerate';
            sender.setParameters(params).catch(() => {});
          } catch (e) {}
        }
      });
    } else {
      try {
        pc.addTransceiver('audio', { direction: 'sendrecv' });
      } catch (e) {}
    }

    // ICE Candidate Exchange
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket();
        socket.emit('voice:signal', {
          targetPeerId: peerId,
          signal: { type: 'candidate', candidate: event.candidate },
        });
      }
    };

    // Auto-restart ICE on failure or temporary network switch (e.g. Wi-Fi <-> 4G/5G)
    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state with ${peerId}: ${pc.iceConnectionState}`);

      if (pc.iceConnectionState === 'failed') {
        console.warn(`[WebRTC] ICE failed with ${peerId}. Triggering ICE restart...`);
        this.restartIceForPeer(peerId);
      } else if (pc.iceConnectionState === 'disconnected') {
        // Debounce: Mobile network jitter may briefly disconnect; restart ICE if still down after 2.5s
        if (record.restartTimer) clearTimeout(record.restartTimer);
        record.restartTimer = setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected') {
            console.warn(`[WebRTC] ICE still disconnected with ${peerId}. Triggering ICE restart...`);
            this.restartIceForPeer(peerId);
          }
        }, 2500);
      } else if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        if (record.restartTimer) {
          clearTimeout(record.restartTimer);
          record.restartTimer = undefined;
        }
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${peerId}: ${pc.connectionState}`);
      if (pc.connectionState === 'closed') {
        this.cleanupPeer(peerId);
      }
    };

    this.peers.set(peerId, record);
    return record;
  }

  public async restartIceForPeer(peerId: string) {
    const record = this.peers.get(peerId);
    if (!record) return;

    // Single-initiator rule for ICE restart avoids simultaneous offer glare/deadlock
    const socket = getSocket();
    const isRestartInitiator = socket.id ? socket.id < peerId : true;
    if (!isRestartInitiator) {
      console.log(`[WebRTC] Awaiting ICE restart from peer ${peerId}`);
      return;
    }

    try {
      console.log(`[WebRTC] Initiating ICE restart with ${peerId}...`);
      await this.initiatePeerConnection(peerId, true);
    } catch (e) {
      console.warn(`[WebRTC] Failed to restart ICE with ${peerId}:`, e);
    }
  }

  public async initiatePeerConnection(peerId: string, iceRestart = false) {
    try {
      const record = this.getOrCreatePeerRecord(peerId);
      const pc = record.pc;

      if (record.makingOffer || pc.signalingState !== 'stable') {
        console.log(`[WebRTC] Skipping offer to ${peerId} (makingOffer=${record.makingOffer}, state=${pc.signalingState})`);
        return;
      }

      record.makingOffer = true;
      try {
        const rawOffer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
          iceRestart,
        });

        // Apply Opus forward error correction & speech optimization to offer SDP
        const optimizedSdp = optimizeOpusSdp(rawOffer.sdp || '');
        const offer = new RTCSessionDescription({ type: 'offer', sdp: optimizedSdp });
        await pc.setLocalDescription(offer);

        const socket = getSocket();
        socket.emit('voice:signal', {
          targetPeerId: peerId,
          signal: { type: 'offer', sdp: offer.sdp },
        });
      } finally {
        record.makingOffer = false;
      }
    } catch (err) {
      console.error(`[WebRTC] Failed to initiate offer to ${peerId}:`, err);
    }
  }

  private async handleSignal(fromPeerId: string, signal: any) {
    try {
      const record = this.getOrCreatePeerRecord(fromPeerId);
      const pc = record.pc;
      const socket = getSocket();

      if (signal.type === 'offer') {
        // Perfect Negotiation Pattern: Handle offer glare/collision gracefully
        const isPolite = socket.id ? socket.id < fromPeerId : true;
        const offerCollision = record.makingOffer || pc.signalingState !== 'stable';

        if (offerCollision) {
          if (!isPolite) {
            // Impolite peer ignores colliding offer
            console.log(`[WebRTC] Offer collision with ${fromPeerId}: ignoring offer as impolite.`);
            return;
          }
          // Polite peer rolls back local description to accept remote offer
          console.log(`[WebRTC] Offer collision with ${fromPeerId}: rolling back local description.`);
          await pc.setLocalDescription({ type: 'rollback' });
        }

        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));

        // Create answer and apply Opus Forward Error Correction
        const rawAnswer = await pc.createAnswer();
        const optimizedSdp = optimizeOpusSdp(rawAnswer.sdp || '');
        const answer = new RTCSessionDescription({ type: 'answer', sdp: optimizedSdp });
        await pc.setLocalDescription(answer);

        socket.emit('voice:signal', {
          targetPeerId: fromPeerId,
          signal: { type: 'answer', sdp: answer.sdp },
        });

        // Flush any candidates that arrived before remote description was set
        for (const cand of record.pendingCandidates) {
          try {
            await pc.addIceCandidate(cand);
          } catch (e) {}
        }
        record.pendingCandidates = [];
      } else if (signal.type === 'answer') {
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));

          // Flush pending candidates
          for (const cand of record.pendingCandidates) {
            try {
              await pc.addIceCandidate(cand);
            } catch (e) {}
          }
          record.pendingCandidates = [];
        }
      } else if (signal.type === 'candidate' && signal.candidate) {
        if (!pc.remoteDescription || !pc.remoteDescription.type) {
          record.pendingCandidates.push(signal.candidate);
        } else {
          try {
            await pc.addIceCandidate(signal.candidate);
          } catch (e) {
            console.warn('[WebRTC] ICE candidate addition error:', e);
          }
        }
      }
    } catch (err) {
      console.error(`[WebRTC] Error handling signal from ${fromPeerId}:`, err);
    }
  }

  private cleanupPeer(peerId: string) {
    if (this.peers.has(peerId)) {
      const { pc, audio, restartTimer } = this.peers.get(peerId)!;
      try {
        if (restartTimer) clearTimeout(restartTimer);
        pc.close();
        audio.pause();
        audio.srcObject = null;
        audio.remove();
      } catch (e) {}
      this.peers.delete(peerId);
    }
    useVoiceStore.getState().removePeer(peerId);
  }

  private setupSocketListeners() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    const socket = getSocket();

    // When notified an existing peer or newcomer has joined voice
    socket.on('voice:peer-joined', async ({ peerId }: { peerId: string }) => {
      console.log(`[WebRTC] Received voice:peer-joined from ${peerId}`);
      const existing = this.peers.get(peerId);
      if (!existing || existing.pc.connectionState !== 'connected') {
        await this.initiatePeerConnection(peerId);
      }
    });

    socket.on('voice:signal', async ({ fromPeerId, signal }: { fromPeerId: string; signal: any }) => {
      await this.handleSignal(fromPeerId, signal);
    });

    socket.on(
      'voice:peer-state-changed',
      ({
        peerId,
        isMuted,
        isDeafened,
      }: {
        peerId: string;
        isMuted: boolean;
        isDeafened: boolean;
      }) => {
        useVoiceStore.getState().setPeerState(peerId, { isMuted, isDeafened });
      }
    );

    socket.on('voice:peer-left', ({ peerId }: { peerId: string }) => {
      this.cleanupPeer(peerId);
    });
  }

  private removeSocketListeners() {
    if (!this.isInitialized) return;
    this.isInitialized = false;
    const socket = getSocket();
    socket.off('voice:peer-joined');
    socket.off('voice:signal');
    socket.off('voice:peer-state-changed');
    socket.off('voice:peer-left');
  }
}

export const voiceManager = new VoiceManager();
