export class AudioEngine {
  private static ctx: AudioContext | null = null;
  private static masterGain: GainNode | null = null;
  private static isInitialized = false;

  private static ostInterval: number | null = null;
  private static tension: number = 0;
  private static currentBeat = 0;
  private static droneOsc: OscillatorNode | null = null;
  private static droneGain: GainNode | null = null;
  private static enabled = true;

  public static isEnabled() {
    return this.enabled;
  }

  public static setEnabled(val: boolean) {
    this.enabled = val;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(val ? 0.6 : 0, this.ctx?.currentTime || 0, 0.1);
    }
  }

  public static init() {
    if (this.isInitialized) {
      if (this.ctx?.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      this.ctx = new AudioContextClass();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6;
      
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;

      this.masterGain.connect(compressor);
      compressor.connect(this.ctx.destination);
      
      this.isInitialized = true;
    } catch (e) {
      console.warn("Web Audio API failed to initialize.", e);
    }
  }

  public static playHover() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public static playClick() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public static playAlert() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.setValueAtTime(200, now + 0.1);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public static playVocalization(faction: string) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = faction.toLowerCase() === 'chaos' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(faction.toLowerCase() === 'chaos' ? 150 : 300, now);
    osc.frequency.exponentialRampToValueAtTime(faction.toLowerCase() === 'chaos' ? 100 : 400, now + 0.2);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public static playMiracleRain() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 1.5; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(1000, now + 0.5);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noiseSource.start(now);
  }

  public static playMiracleMeteor() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.8);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.8);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.0);
  }

  public static playMiracleRift() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.linearRampToValueAtTime(500, now + 0.5);
    osc.frequency.linearRampToValueAtTime(50, now + 1.2);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.linearRampToValueAtTime(2000, now + 0.5);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.2);
  }

  public static updateAdaptiveDrone(faction: string, zoom: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    
    if (!this.droneOsc) {
      this.droneOsc = this.ctx.createOscillator();
      this.droneOsc.type = 'sine';
      
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.value = 0;
      
      this.droneOsc.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);
      this.droneOsc.start();
    }
    
    // Adjust frequency based on faction
    let targetFreq = 55; // A1
    if (faction === 'nature') targetFreq = 65; // C2
    else if (faction === 'chaos') targetFreq = 41; // E1
    else if (faction === 'order') targetFreq = 73; // D2
    
    this.droneOsc.frequency.setTargetAtTime(targetFreq, now, 1.0);
    
    // Adjust volume based on zoom (louder when zoomed out)
    const normalizedZoom = Math.min(1, Math.max(0, (zoom - 0.5) / 1.5));
    const targetVol = 0.05 + (1 - normalizedZoom) * 0.15;
    
    if (this.droneGain) {
      this.droneGain.gain.setTargetAtTime(targetVol, now, 0.5);
    }
  }

  public static startOST() {
    this.init();
    if (!this.ctx || this.ostInterval !== null) return;
    
    this.ostInterval = window.setInterval(() => {
      this.playOSTBeat();
    }, 1000);
  }

  public static stopOST() {
    if (this.ostInterval !== null) {
      clearInterval(this.ostInterval);
      this.ostInterval = null;
    }
  }

  private static playOSTBeat() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    
    if (this.currentBeat % 4 === 0) {
      const melOsc = this.ctx.createOscillator();
      melOsc.type = 'triangle';
      
      const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00];
      const note = pentatonic[Math.floor(Math.random() * pentatonic.length)];
      
      melOsc.frequency.setValueAtTime(note, now);
      
      const melGain = this.ctx.createGain();
      melGain.gain.setValueAtTime(0.05, now);
      melGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      melOsc.connect(melGain);
      melGain.connect(this.masterGain);
      
      melOsc.start(now);
      melOsc.stop(now + 1.0);
    }

    this.currentBeat++;
  }
}
