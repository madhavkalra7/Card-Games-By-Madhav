import { getSocket } from '@/socket/client';
import { useVoiceStore } from '@/store/voiceStore';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

interface PeerConnectionRecord {
  pc: RTCPeerConnection;
  audio: HTMLAudioElement;
  analyser?: AnalyserNode;
  gainNode?: GainNode;
  pendingCandidates: RTCIceCandidateInit[];
}

class VoiceManager {
  private localStream: MediaStream | null = null;
  private peers: Map<string, PeerConnectionRecord> = new Map();
  private currentRoomCode: string | null = null;
  private audioCtx: AudioContext | null = null;
  private speakingIntervalId: any = null;
  private isInitialized = false;

  public async joinVoice(roomCode: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const store = useVoiceStore.getState();
    if (store.isInVoice) return true;

    store.setIsConnecting(true);
    store.setError(null);
    this.currentRoomCode = roomCode.toUpperCase();

    try {
      // 1. Initialize and unlock AudioContext on user click (critical for mobile browsers)
      this.setupAudioContext();
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume().catch((e) => console.warn('AudioContext resume warning:', e));
      }

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

      // 3. Setup Web Audio API volume analyzer for local mic
      if (this.audioCtx) {
        try {
          const source = this.audioCtx.createMediaStreamSource(this.localStream);
          const analyser = this.audioCtx.createAnalyser();
          analyser.fftSize = 256;
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
        socket.emit('voice:join', { roomCode: this.currentRoomCode }, (res: any) => {
          if (!res || !res.success) {
            store.setError(res?.error || 'Failed to join voice channel');
            this.leaveVoice();
            resolve(false);
            return;
          }

          store.setIsInVoice(true);
          store.setIsConnecting(false);

          // NOTE: In WebRTC mesh signaling, existing peers in the room receive 'voice:peer-joined'
          // and will initiate the offers to this newly joined peer.
          // This avoids the classic simultaneous offer collision (glare) bug.
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
    this.peers.forEach(({ pc, audio, gainNode }) => {
      try {
        if (gainNode) gainNode.disconnect();
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

    // Mute/unmute all remote audio elements and WebAudio gain nodes
    this.peers.forEach(({ audio, gainNode }) => {
      audio.muted = newDeafened;
      if (gainNode) {
        gainNode.gain.value = newDeafened ? 0 : 1.0;
      }
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

  private startSpeakingMonitor(localAnalyser: AnalyserNode) {
    const dataArray = new Uint8Array(localAnalyser.frequencyBinCount);

    this.speakingIntervalId = setInterval(() => {
      const store = useVoiceStore.getState();
      if (!store.isInVoice || store.isMicMuted) {
        store.setPeerSpeaking('me', false);
        return;
      }

      // Check local mic volume
      localAnalyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const isSpeaking = avg > 14;
      store.setPeerSpeaking('me', isSpeaking);

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

    const pc = new RTCPeerConnection(ICE_SERVERS);
    const audio = new Audio();
    audio.autoplay = true;
    audio.muted = useVoiceStore.getState().isDeafened;
    audio.setAttribute('playsinline', 'true');
    audio.style.display = 'none';
    document.body.appendChild(audio);

    const record: PeerConnectionRecord = {
      pc,
      audio,
      pendingCandidates: [],
    };

    // Stream incoming audio from remote peer
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        // 1. HTMLAudioElement playback
        audio.srcObject = remoteStream;
        audio.play().catch((e) => {
          console.warn('Audio element play note (WebAudio graph will provide output):', e);
        });

        // 2. Web Audio API Direct Speaker Output (bypasses browser autoplay restrictions on mobile!)
        if (this.audioCtx && this.audioCtx.state !== 'closed') {
          try {
            if (this.audioCtx.state === 'suspended') {
              this.audioCtx.resume().catch(() => {});
            }

            const source = this.audioCtx.createMediaStreamSource(remoteStream);
            const gainNode = this.audioCtx.createGain();
            gainNode.gain.value = useVoiceStore.getState().isDeafened ? 0 : 1.0;

            const analyser = this.audioCtx.createAnalyser();
            analyser.fftSize = 256;

            // Connect graph: stream -> analyser
            //                stream -> gainNode -> speaker destination
            source.connect(analyser);
            source.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);

            record.gainNode = gainNode;
            record.analyser = analyser;
          } catch (err) {
            console.warn('Could not attach Web Audio API destination to remote stream:', err);
          }
        }
      }
    };

    // Add our local mic track to this peer
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
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

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === 'disconnected' ||
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed'
      ) {
        this.cleanupPeer(peerId);
      }
    };

    this.peers.set(peerId, record);
    return record;
  }

  public async initiatePeerConnection(peerId: string) {
    try {
      const record = this.getOrCreatePeerRecord(peerId);
      const pc = record.pc;

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);

      const socket = getSocket();
      socket.emit('voice:signal', {
        targetPeerId: peerId,
        signal: { type: 'offer', sdp: offer.sdp },
      });
    } catch (err) {
      console.error(`Failed to initiate WebRTC offer to ${peerId}:`, err);
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
        const offerCollision = pc.signalingState !== 'stable';

        if (offerCollision) {
          if (!isPolite) {
            // Impolite peer ignores the colliding offer
            console.log(`[WebRTC] Offer collision with ${fromPeerId}: ignoring offer as impolite.`);
            return;
          }
          // Polite peer rolls back local description to accept the remote offer
          console.log(`[WebRTC] Offer collision with ${fromPeerId}: rolling back local description.`);
          await pc.setLocalDescription({ type: 'rollback' });
        }

        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));

        // Flush any candidates that arrived before the remote description was set
        for (const cand of record.pendingCandidates) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {}
        }
        record.pendingCandidates = [];

        // Create and send answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('voice:signal', {
          targetPeerId: fromPeerId,
          signal: { type: 'answer', sdp: answer.sdp },
        });
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));

        // Flush pending candidates
        for (const cand of record.pendingCandidates) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {}
        }
        record.pendingCandidates = [];
      } else if (signal.type === 'candidate' && signal.candidate) {
        if (!pc.remoteDescription || !pc.remoteDescription.type) {
          // Buffer candidate until remote description is set
          record.pendingCandidates.push(signal.candidate);
        } else {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.warn('ICE Candidate addition error:', e);
          }
        }
      }
    } catch (err) {
      console.error(`Error handling WebRTC signal from ${fromPeerId}:`, err);
    }
  }

  private cleanupPeer(peerId: string) {
    if (this.peers.has(peerId)) {
      const { pc, audio, gainNode } = this.peers.get(peerId)!;
      try {
        if (gainNode) gainNode.disconnect();
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

    // When an existing peer is told a new peer has joined, initiate the offer to that peer
    socket.on('voice:peer-joined', async ({ peerId }: { peerId: string }) => {
      await this.initiatePeerConnection(peerId);
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
