let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

function tone(freq: number, type: OscillatorType, peak: number, dur: number, sweepTo?: number): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (sweepTo !== undefined) osc.frequency.exponentialRampToValueAtTime(sweepTo, now + dur);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  osc.start(now);
  osc.stop(now + dur);
}

/**
 * Rafaga de ruido blanco (percusiones: disparos, clics metalicos). `filter`
 * opcional para amortiguar (disparos lejanos) o abrillantar (clic seco).
 */
function noise(
  peak: number,
  dur: number,
  delay = 0,
  filter?: { type: BiquadFilterType; freq: number },
): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const now = ctx.currentTime + delay;
  const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peak, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  if (filter) {
    const biquad = ctx.createBiquadFilter();
    biquad.type = filter.type;
    biquad.frequency.value = filter.freq;
    src.connect(biquad);
    biquad.connect(gain);
  } else {
    src.connect(gain);
  }
  gain.connect(ctx.destination);
  src.start(now);
  src.stop(now + dur);
}

/** Efectos sintetizados (Web Audio, sin assets) para Final Sentence. */
export class SoundEffects {
  /** Tic grave de la cuenta atras. */
  static playCountdownTick(): void {
    tone(300, "sine", 0.09, 0.07);
  }

  /** Golpe seco de tecla (maquina de escribir). */
  static playKey(): void {
    tone(380, "square", 0.028, 0.025);
    noise(0.04, 0.02, 0, { type: "highpass", freq: 2000 });
  }

  /** Error: una bala metalica entrando al tambor. */
  static playError(): void {
    tone(150, "sawtooth", 0.05, 0.1, 70);
    noise(0.06, 0.05, 0, { type: "bandpass", freq: 900 });
  }

  /** Giro del tambor: traqueteo metalico decelerando. */
  static playSpin(): void {
    for (let i = 0; i < 9; i++) {
      noise(0.05, 0.03, i * 0.055 + i * i * 0.006, { type: "bandpass", freq: 1400 });
    }
  }

  /** Percutor sobre recamara vacia: alivio. */
  static playClick(): void {
    noise(0.14, 0.04, 0, { type: "highpass", freq: 1800 });
    tone(220, "square", 0.05, 0.03);
  }

  /** Disparo: la sentencia final. */
  static playGunshot(): void {
    noise(0.6, 0.18, 0, { type: "lowpass", freq: 3500 });
    tone(90, "sine", 0.5, 0.22, 40);
    tone(55, "sine", 0.35, 0.35, 30);
  }

  /** Disparos lejanos (otros presos que caen). Amortiguados y en cadena. */
  static playDistantShots(count: number): void {
    const n = Math.min(4, Math.max(1, count));
    for (let i = 0; i < n; i++) {
      noise(0.09, 0.09, 0.05 + i * 0.13, { type: "lowpass", freq: 500 });
    }
  }
}
