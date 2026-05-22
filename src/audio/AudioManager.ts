export default class AudioManager {
  private context: AudioContext;
  private masterGain: GainNode;
  private ambientOscillator: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;

  constructor() {
    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.08;
    this.masterGain.connect(this.context.destination);
  }

  async resume() {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  startAmbient() {
    if (this.ambientOscillator) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 68;
    gain.gain.value = 0.02;
    oscillator.connect(gain);
    gain.connect(this.masterGain);
    oscillator.start();

    this.ambientOscillator = oscillator;
    this.ambientGain = gain;
  }

  stopAmbient() {
    if (this.ambientOscillator) {
      this.ambientOscillator.stop();
      this.ambientOscillator.disconnect();
      this.ambientGain?.disconnect();
      this.ambientOscillator = null;
      this.ambientGain = null;
    }
  }

  playConnect() {
    this.playTone(620, 0.11, 'triangle', 0.18);
  }

  playDisconnect() {
    this.playTone(320, 0.09, 'sawtooth', 0.12);
  }

  playPulse() {
    this.playTone(430, 0.28, 'triangle', 0.14);
  }

  private playTone(frequency: number, duration: number, type: OscillatorType, volume: number) {
    if (this.context.state === 'suspended') {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;
    gain.gain.setTargetAtTime(0, this.context.currentTime + duration * 0.45, duration * 0.15);
    oscillator.connect(gain);
    gain.connect(this.masterGain);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
}
