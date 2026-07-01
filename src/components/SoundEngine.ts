/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private motorOscs: { osc: OscillatorNode; gain: GainNode }[] = [];
  private motorFilter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private beatIntervalId: any = null;
  private isMusicPlaying: boolean = false;
  private volume: number = 0.5;

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Web Audio API not supported or blocked:", e);
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startMotor() {
    this.init();
    this.resume();
    if (!this.ctx || this.motorOscs.length > 0) return;

    try {
      // We will create a rich quadcopter hum using 4 detuned oscillators to represent 4 motors!
      const motorFrequencies = [55, 55.5, 56, 56.2]; // low base baritone rumble
      const harmonics = [1, 2, 3, 4]; // odd/even harmonics for buzziness

      this.motorFilter = this.ctx.createBiquadFilter();
      this.motorFilter.type = 'lowpass';
      this.motorFilter.frequency.setValueAtTime(180, this.ctx.currentTime);
      this.motorFilter.Q.setValueAtTime(4, this.ctx.currentTime);
      this.motorFilter.connect(this.masterGain!);

      motorFrequencies.forEach((baseFreq) => {
        harmonics.forEach((harmonic, index) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          // Mix sawtooth and square for dirty FPV motor sound
          osc.type = index % 2 === 0 ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(baseFreq * harmonic, this.ctx.currentTime);

          const gain = this.ctx.createGain();
          // Higher harmonics are quieter
          const vol = 0.05 / (harmonic * 1.5);
          gain.gain.setValueAtTime(vol, this.ctx.currentTime);

          osc.connect(gain);
          gain.connect(this.motorFilter!);
          osc.start();

          this.motorOscs.push({ osc, gain });
        });
      });
    } catch (err) {
      console.error("Failed to start motor sound:", err);
    }
  }

  setThrottle(throttle: number) {
    if (!this.ctx || this.motorOscs.length === 0) return;
    const t = Math.max(0, Math.min(1, throttle));

    // Modulate pitch based on throttle
    // Drone motor pitch can go from base ~55Hz to ~220Hz (times harmonics)
    const baseFreqs = [55, 55.5, 56, 56.2];
    const harmonics = [1, 2, 3, 4];

    let oscIdx = 0;
    baseFreqs.forEach((baseFreq) => {
      harmonics.forEach((harmonic) => {
        if (oscIdx >= this.motorOscs.length) return;
        const targetFreq = (baseFreq + t * 240) * harmonic;
        const item = this.motorOscs[oscIdx];
        
        // Fast pitch slide to simulate motor throttle response
        item.osc.frequency.setTargetAtTime(targetFreq, this.ctx!.currentTime, 0.08);
        
        // Gain modulation: revving up increases intensity and vibration
        const baseGain = 0.05 / (harmonic * 1.5);
        const targetGain = baseGain * (0.8 + t * 1.5);
        item.gain.gain.setTargetAtTime(targetGain, this.ctx!.currentTime, 0.05);

        oscIdx++;
      });
    });

    // Open up filter frequency as throttle increases
    if (this.motorFilter) {
      const filterFreq = 180 + t * 1500;
      this.motorFilter.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.1);
    }
  }

  stopMotor() {
    this.motorOscs.forEach((item) => {
      try {
        item.osc.stop();
        item.osc.disconnect();
      } catch (e) {}
    });
    this.motorOscs = [];
    if (this.motorFilter) {
      this.motorFilter.disconnect();
      this.motorFilter = null;
    }
  }

  playBeep() {
    this.init();
    this.resume();
    if (!this.ctx) return;

    try {
      // Quick high pitch synth double-beep for checkpoint success
      const now = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(1760, now + 0.08); // A6
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  playCrash() {
    this.init();
    this.resume();
    if (!this.ctx) return;

    try {
      // Noise buffer for drone crash sound with low frequency explosion
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.4; // 400ms
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(300, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(80, now + 0.3);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.linearRampToValueAtTime(0.01, now + 0.4);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain!);

      // Also add a heavy bass thump
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(90, now);
      subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.4, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      subOsc.connect(subGain);
      subGain.connect(this.masterGain!);

      noiseNode.start(now);
      noiseNode.stop(now + 0.4);
      subOsc.start(now);
      subOsc.stop(now + 0.4);
    } catch (e) {}
  }

  playVictory() {
    this.init();
    this.resume();
    if (!this.ctx) return;

    try {
      // Upbeat Y2K game-complete melody arpeggio
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major Arpeggio
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch (e) {}
  }

  startMenuMusic() {
    this.init();
    this.resume();
    if (!this.ctx || this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    try {
      // Let's program a simple, authentic loop using Web Audio API!
      // This will play a drum beat (snare/kick synthesized) and a cool groovy bassline
      // in the key of G minor (very cyber-retro, think Jet Set Radio!)
      // BPM = 135 (breakbeat tempo)
      const stepDuration = 60 / 135 / 2; // 8th notes
      let step = 0;

      // Bass notes in G minor: G2 (98Hz), Bb2 (116Hz), C3 (130Hz), F2 (87Hz)
      const bassline = [
        98, 98, 0, 98, 116, 116, 0, 130,
        98, 98, 0, 98, 87, 87, 116, 87
      ];

      const playStep = () => {
        if (!this.ctx || !this.isMusicPlaying) return;
        const now = this.ctx.currentTime;

        // 1. Kick Drum (Step 0, 4, 8, 12)
        if (step % 8 === 0 || step % 8 === 5) {
          const kick = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kick.frequency.setValueAtTime(150, now);
          kick.frequency.exponentialRampToValueAtTime(45, now + 0.15);
          kickGain.gain.setValueAtTime(0.25, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

          kick.connect(kickGain);
          kickGain.connect(this.masterGain!);
          kick.start(now);
          kick.stop(now + 0.16);
        }

        // 2. Snare / Rimshot Noise (Step 4, 12)
        if (step % 8 === 4) {
          const snare = this.ctx.createOscillator();
          const snareGain = this.ctx.createGain();
          snare.type = 'triangle';
          snare.frequency.setValueAtTime(220, now);
          snare.frequency.exponentialRampToValueAtTime(100, now + 0.12);

          // Add a high-pitch snap
          const snap = this.ctx.createOscillator();
          snap.type = 'sine';
          snap.frequency.setValueAtTime(1200, now);
          const snapGain = this.ctx.createGain();
          snapGain.gain.setValueAtTime(0.1, now);
          snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

          snareGain.gain.setValueAtTime(0.15, now);
          snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          snare.connect(snareGain);
          snareGain.connect(this.masterGain!);
          snap.connect(snapGain);
          snapGain.connect(this.masterGain!);

          snare.start(now);
          snare.stop(now + 0.15);
          snap.start(now);
          snap.stop(now + 0.06);
        }

        // 3. Hihat (On off-beats)
        if (step % 2 === 1) {
          const hatOsc = this.ctx.createOscillator();
          hatOsc.type = 'triangle';
          hatOsc.frequency.setValueAtTime(8000, now);
          
          const hatFilter = this.ctx.createBiquadFilter();
          hatFilter.type = 'highpass';
          hatFilter.frequency.setValueAtTime(6000, now);

          const hatGain = this.ctx.createGain();
          hatGain.gain.setValueAtTime(0.03, now);
          hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

          hatOsc.connect(hatFilter);
          hatFilter.connect(hatGain);
          hatGain.connect(this.masterGain!);

          hatOsc.start(now);
          hatOsc.stop(now + 0.06);
        }

        // 4. Cool Acid/Retro Bassline
        const bassFreq = bassline[step % bassline.length];
        if (bassFreq > 0) {
          const bassOsc = this.ctx.createOscillator();
          bassOsc.type = 'sawtooth';
          bassOsc.frequency.setValueAtTime(bassFreq, now);

          // Sub frequency double for warmth
          const bassSub = this.ctx.createOscillator();
          bassSub.type = 'triangle';
          bassSub.frequency.setValueAtTime(bassFreq / 2, now);

          // Low pass filter sweep
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(bassFreq * 3, now);
          filter.frequency.exponentialRampToValueAtTime(bassFreq * 1.5, now + stepDuration * 0.8);

          const bassGain = this.ctx.createGain();
          bassGain.gain.setValueAtTime(0.12, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.9);

          bassOsc.connect(filter);
          bassSub.connect(filter);
          filter.connect(bassGain);
          bassGain.connect(this.masterGain!);

          bassOsc.start(now);
          bassSub.start(now);
          bassOsc.stop(now + stepDuration);
          bassSub.stop(now + stepDuration);
        }

        step = (step + 1) % 16;
        
        // Schedule next step
        this.beatIntervalId = setTimeout(playStep, stepDuration * 1000);
      };

      playStep();
    } catch (e) {
      console.error("Error setting up procedural menu music:", e);
    }
  }

  stopMenuMusic() {
    this.isMusicPlaying = false;
    if (this.beatIntervalId) {
      clearTimeout(this.beatIntervalId);
      this.beatIntervalId = null;
    }
  }
}

export const sound = new SoundEngine();
