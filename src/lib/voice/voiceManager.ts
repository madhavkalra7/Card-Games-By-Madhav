import { getSocket } from '@/socket/client';
import { useVoiceStore } from '@/store/voiceStore';

// Multi-layered ICE servers: High-speed Google STUN + Metered OpenRelay TURN servers
// TURN is essential for mobile cellular networks (Jio, Airtel, Vi, T-Mobile, etc.) and symmetric NAT firewalls.
const getIceServers = (): RTCConfiguration => {
  const customTurnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const customTurnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const customTurnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  const servers: RTCIceServer[] = [
    // Google Public STUN
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Metered Public STUN
    { urls: 'stun:openrelay.metered.ca:80' },
    // Metered Free OpenRelay TURN (UDP & TCP & TLS fallbacks)
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
        'turns:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelay',
      credential: 'openrelay',
    },
  ];

  // Optional custom TURN credentials configured in environment variables
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
  };
};

interface PeerConnectionRecord {
  pc: RTCPeerConnection;
  audio: HTMLAudioElement;
  analyser?: AnalyserNode;
  pendingCandidates: RTCIceCandidateInit[];
  makingOffer: boolean;
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

    try {
      // 1. Initialize and unlock AudioContext on user gesture (crucial for iOS Safari & Android Chrome)
      this.setupAudioContext();
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume().catch((e) => console.warn('AudioContext resume warning:', e));
      }
      this.primeAudioContext();

      // Register interaction unlocker so any subsequent tap unblocks pending remote audio
      this.registerAutoplayUnlock();

      // 2. Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
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

          // Connect to existing voice peers returned by server
          const existingPeers: string[] = res.peers || [];
          console.log(`[WebRTC] Successfully joined voice room ${this.currentRoomCode}. Existing peers:`, existingPeers);

          for (const peerId of existingPeers) {
            await this.initiatePeerConnection(peerId);
          }

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
    this.peers.forEach(({ pc, audio }) => {
      try {
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
    audio.style.display = 'none';
    document.body.appendChild(audio);

    const record: PeerConnectionRecord = {
      pc,
      audio,
      pendingCandidates: [],
      makingOffer: false,
    };

    // Ensure audio transceiver is created with sendrecv capability
    try {
      pc.addTransceiver('audio', { direction: 'sendrecv' });
    } catch (e) {}

    // Stream incoming audio from remote peer
    pc.ontrack = (event) => {
      let stream = (event.streams && event.streams[0]) || null;
      if (!stream && event.track) {
        stream = new MediaStream([event.track]);
      }
      if (!stream) return;

      // 1. Play dedicated remote stream via HTMLAudioElement (cleanest audio output, native echo cancelation)
      audio.srcObject = stream;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.warn(`[WebRTC] Audio element play blocked for ${peerId}:`, e);
          this.registerAutoplayUnlock();
        });
      }

      // 2. Attach Web Audio API analyser ONLY for speaking detection indicator
      // Never route to audioCtx.destination! Dual routing causes echo feedback, phase cancelation,
      // and complete silence on iOS Safari (Apple WebKit Bug #215449).
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

    // Add our local mic tracks to this peer connection
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
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

    // Auto-restart ICE on failure (essential for mobile network transitions e.g. Wi-Fi <-> LTE)
    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state with ${peerId}: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed') {
        console.warn(`[WebRTC] ICE failed with ${peerId}. Triggering ICE restart...`);
        this.initiatePeerConnection(peerId, true);
      } else if (pc.iceConnectionState === 'disconnected') {
        // Brief grace period before cleaning up disconnected peer
        setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
            this.cleanupPeer(peerId);
          }
        }, 6000);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'closed') {
        this.cleanupPeer(peerId);
      }
    };

    this.peers.set(peerId, record);
    return record;
  }

  public async initiatePeerConnection(peerId: string, iceRestart = false) {
    try {
      const record = this.getOrCreatePeerRecord(peerId);
      const pc = record.pc;

      if (record.makingOffer || pc.signalingState !== 'stable') {
        console.log(`[WebRTC] Skipping offer creation to ${peerId} (makingOffer=${record.makingOffer}, state=${pc.signalingState})`);
        return;
      }

      record.makingOffer = true;
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
          iceRestart,
        });
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

        // Create and set local answer description
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('voice:signal', {
          targetPeerId: fromPeerId,
          signal: { type: 'answer', sdp: answer.sdp },
        });

        // Flush any candidates that arrived before remote description was set
        for (const cand of record.pendingCandidates) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {}
        }
        record.pendingCandidates = [];
      } else if (signal.type === 'answer') {
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));

          // Flush pending candidates
          for (const cand of record.pendingCandidates) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {}
          }
          record.pendingCandidates = [];
        }
      } else if (signal.type === 'candidate' && signal.candidate) {
        if (!pc.remoteDescription || !pc.remoteDescription.type) {
          record.pendingCandidates.push(signal.candidate);
        } else {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
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
      const { pc, audio } = this.peers.get(peerId)!;
      try {
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
