/**
 * SoundManager — Web Audio API Sound Synthesis
 * Generates all game sounds programmatically (zero external files needed)
 * 
 * Also provides Text-to-Speech for English vocabulary
 */

export class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this._initialized = false;

    this.bgmPlaying = false;
    this.bgmInterval = null;
  }

  /**
   * Initialize AudioContext (must be called after user gesture)
   */
  init() {
    if (this._initialized) return;

    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6;
      this.masterGain.connect(this.ctx.destination);
      
      // Pre-compute slash noise buffer to prevent UI stutter/freeze when slashing
      const bufferSize = this.ctx.sampleRate * 0.15;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      
      this._initialized = true;
    } catch (e) {
      console.warn('Web Audio not supported:', e);
    }
  }

  startBGM() {
    if (!this._initialized || this.isMuted || this.bgmPlaying) return;
    this.bgmPlaying = true;
    
    // Thang âm ngũ cung vui nhộn, lặp lại cho background
    const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 440.00, 392.00, 329.63, 293.66];
    let step = 0;
    
    this.bgmInterval = setInterval(() => {
      if (this.isMuted || this.ctx.state !== 'running') return;
      
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine'; // Tiếng trong mượt
      osc.frequency.value = pentatonic[step % pentatonic.length];
      
      // Tạo âm nảy (plucked) vui nhộn, âm lượng rất nhẹ (0.04) làm nền
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.04, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
      
      step++;
    }, 280); // Nhịp độ vừa phải
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  /**
   * Resume AudioContext if suspended (browser policy)
   */
  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  /**
   * Play a "whoosh" slash sound
   */
  playSlash() {
    if (!this._initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Reuse pre-computed buffer instead of synchronous generation
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    
    // Bandpass filter for "swoosh" character
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.15);
    filter.Q.value = 2;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.15);
  }

  /**
   * Play a satisfying "splat/hit" sound when fruit is sliced
   */
  playHit() {
    if (!this._initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Low thud
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
    
    // High ping overlay
    const ping = this.ctx.createOscillator();
    ping.type = 'sine';
    ping.frequency.setValueAtTime(880, now);
    ping.frequency.exponentialRampToValueAtTime(440, now + 0.15);
    
    const pingGain = this.ctx.createGain();
    pingGain.gain.setValueAtTime(0.2, now);
    pingGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    ping.connect(pingGain);
    pingGain.connect(this.masterGain);
    ping.start(now);
    ping.stop(now + 0.15);
  }

  /**
   * Play score/coin collection sound
   */
  playScore() {
    if (!this._initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Ascending major chord arpeggio
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      const gain = this.ctx.createGain();
      const offset = i * 0.06;
      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.2, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.3);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.3);
    });
  }

  /**
   * Play combo sound (more exciting ascending)
   * @param {number} comboLevel 1-10
   */
  playCombo(comboLevel = 1) {
    if (!this._initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    const baseFreq = 400 + comboLevel * 50;
    
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = baseFreq + i * 100;
      
      const gain = this.ctx.createGain();
      const offset = i * 0.04;
      gain.gain.setValueAtTime(0.1, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.15);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.15);
    }
  }

  /**
   * Play countdown beep
   * @param {number} count - 3, 2, 1, or 0 (GO!)
   */
  playCountdown(count) {
    if (!this._initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    const freq = count === 0 ? 880 : 440;
    const duration = count === 0 ? 0.4 : 0.2;
    
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Play celebration/cheer sound
   */
  playCheer() {
    if (!this._initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Fanfare-like ascending notes
    const notes = [523, 587, 659, 784, 880, 1047]; // C5 to C6
    
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      const gain = this.ctx.createGain();
      const offset = i * 0.1;
      gain.gain.setValueAtTime(0.15, now + offset);
      gain.gain.linearRampToValueAtTime(0.25, now + offset + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.4);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.4);
    });
  }

  /**
   * Play miss/drop sound
   */
  playMiss() {
    if (!this._initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Speak text using Web Speech API (for English vocabulary)
   * @param {string} text
   * @param {string} lang - 'en-US' or 'vi-VN'
   */
  speak(text, lang = 'en-US') {
    if (this.isMuted) return;
    
    // Asynchronous wrapper to prevent main thread blocking (UI stutter / freeze)
    setTimeout(() => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.8; // Slow for kids
        utterance.pitch = 1.2; // Slightly higher for friendly tone
        utterance.volume = 0.8;
        
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis error:', e);
      }
    }, 0);
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 0.6;
    }
    return this.isMuted;
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.ctx) {
      this.ctx.close();
    }
    window.speechSynthesis.cancel();
  }
}
