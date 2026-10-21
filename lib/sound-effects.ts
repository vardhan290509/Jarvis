// Zero-KB Procedural Web Audio Synthesizer & Haptic Engine //

class JarvisSoundFX {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private silentOsc: OscillatorNode | null = null;
  private silentGain: GainNode | null = null;

  constructor() {
    // AudioContext is initialized lazily upon first user interaction
  }

  private initContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  // Tactile Haptic Vibration helper
  public haptic(pattern: number | number[] = 10) {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  // 1. Mechanical Button Click (Relay impulse)
  public playClick(pitch: number = 800) {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.025);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.026);

      this.haptic(8);
    } catch (e) {}
  }

  // 2. Rotary Jog Dial Notch Tick
  public playJogTick(notchIndex: number = 0) {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const baseFreq = 950 + (notchIndex % 8) * 40;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.015);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.016);

      this.haptic(5);
    } catch (e) {}
  }

  // 3. Hardware Relay Toggle (Snappy double click)
  public playRelay(stateOn: boolean = true) {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(stateOn ? 600 : 420, now);
      osc.frequency.setValueAtTime(stateOn ? 1200 : 250, now + 0.012);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.036);

      this.haptic([12, 10, 8]);
    } catch (e) {}
  }

  // 4. Telemetry / Radar Beep
  public playTelemetryBlip() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1750, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }

  // 5. Clarification Warm Two-Tone Chime
  public playClarificationChime() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [
        { freq: 523.25, time: now }, // C5
        { freq: 659.25, time: now + 0.08 }, // E5
      ].forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(note.freq, note.time);
        gain.gain.setValueAtTime(0.15, note.time);
        gain.gain.exponentialRampToValueAtTime(0.001, note.time + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(note.time);
        osc.stop(note.time + 0.2);
      });

      this.haptic([20, 30, 20]);
    } catch (e) {}
  }

  // 6. Alarm Siren Tone
  public playAlarmSiren(repeatTimes: number = 3) {
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      for (let i = 0; i < repeatTimes; i++) {
        const offset = i * 0.45;
        const now = ctx.currentTime + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.linearRampToValueAtTime(1400, now + 0.2);
        osc.frequency.linearRampToValueAtTime(880, now + 0.4);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.43);
      }
      this.haptic([500, 200, 500, 200, 500]);
    } catch (e) {}
  }

  // 7. Silent Keep-Alive Loop for Background Browser Persistence + MediaSession
  public startBackgroundKeepAlive() {
    const ctx = this.initContext();
    if (!ctx || this.silentOsc) return;

    try {
      // Create sub-audible oscillator at 15Hz with gain of 0.0001
      this.silentOsc = ctx.createOscillator();
      this.silentGain = ctx.createGain();
      this.silentOsc.type = "sine";
      this.silentOsc.frequency.setValueAtTime(15, ctx.currentTime);
      this.silentGain.gain.setValueAtTime(0.0001, ctx.currentTime);

      this.silentOsc.connect(this.silentGain);
      this.silentGain.connect(ctx.destination);
      this.silentOsc.start();

      // Hook up navigator.mediaSession
      if (typeof window !== "undefined" && "mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "JARVIS // TACTILE 01",
          artist: "NVIDIA x Nebius Personal Agent",
          album: "Mobile OS Controller",
          artwork: [{ src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" }],
        });

        navigator.mediaSession.playbackState = "playing";
        navigator.mediaSession.setActionHandler("play", () => {
          this.playClick(900);
        });
        navigator.mediaSession.setActionHandler("pause", () => {
          this.playClick(400);
        });
      }
    } catch (e) {}
  }

  public stopBackgroundKeepAlive() {
    if (this.silentOsc) {
      try {
        this.silentOsc.stop();
        this.silentOsc.disconnect();
      } catch (e) {}
      this.silentOsc = null;
    }
  }
}

export const soundFX = new JarvisSoundFX();
