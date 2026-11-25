// Professional broadcast audio effects using Web Audio API synthesis
// 100% self-contained, zero external network dependency, ultra-low latency

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Synthesizes a realistic auction gavel strike on a wooden sounding board
 */
function synthesizeGavelStrike(ctx: AudioContext, startTime: number, volume: number = 1.0) {
  // 1. Sharp wooden impact transient
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(320, startTime);
  osc.frequency.exponentialRampToValueAtTime(75, startTime + 0.12);

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(260, startTime);
  filter.Q.setValueAtTime(3.5, startTime);

  oscGain.gain.setValueAtTime(0.001, startTime);
  oscGain.gain.linearRampToValueAtTime(0.85 * volume, startTime + 0.004);
  oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);

  osc.connect(filter);
  filter.connect(oscGain);
  oscGain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + 0.16);

  // 2. High-frequency wood-crack impulse (white noise burst)
  const bufferSize = Math.floor(ctx.sampleRate * 0.04);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.setValueAtTime(1400, startTime);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.7 * volume, startTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  noise.start(startTime);
  noise.stop(startTime + 0.05);
}

/**
 * Synthesizes a subtle stadium crowd cheer and roar
 */
function synthesizeStadiumCheer(ctx: AudioContext, startTime: number, duration: number = 2.4, volume: number = 0.45) {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Pinkish-brown noise for cheering rumble
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.0990460;
    b1 = 0.96300 * b1 + white * 0.2965164;
    b2 = 0.57000 * b2 + white * 1.0526913;
    data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.15;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  // Resonant bandpass filter mimicking crowd acoustic formant
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, startTime);
  filter.Q.setValueAtTime(1.8, startTime);

  // Envelope: swell in quickly, then gently sustain and decay
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.35);
  gain.gain.exponentialRampToValueAtTime(volume * 0.5, startTime + 1.2);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(startTime);
  noise.stop(startTime + duration + 0.05);
}

/**
 * Plays the complete SOLD sound effect:
 * - 3 authentic gavel hammer strikes ("Going once, twice... SOLD!")
 * - Followed by stadium crowd celebration
 */
export function playSoldSound(isMuted: boolean = false): void {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Strike 1 (going once)
    synthesizeGavelStrike(ctx, now, 0.7);

    // Strike 2 (going twice)
    synthesizeGavelStrike(ctx, now + 0.18, 0.75);

    // Strike 3 (final authoritative hammer drop)
    synthesizeGavelStrike(ctx, now + 0.38, 1.0);

    // Stadium crowd cheer swells right after the hammer drops
    synthesizeStadiumCheer(ctx, now + 0.40, 2.2, 0.4);
  } catch (err) {
    // Graceful fallback if user hasn't interacted or audio is restricted
    console.warn('Audio playback error:', err);
  }
}

/**
 * Plays a subtle chime for bid placement
 */
export function playBidChime(isMuted: boolean = false): void {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.setValueAtTime(880.00, now + 0.08); // A5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}
