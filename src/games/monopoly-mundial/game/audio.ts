/**
 * SFX procedurales con Web Audio, siguiendo el patron de audio de la skill
 * threejs-gameplay-systems: el juego emite eventos de estado (los fx del
 * motor) y este modulo los convierte en sonido. Sin assets externos; todo
 * se sintetiza (osciladores + ruido filtrado). Mute persistido en localStorage.
 */

const MUTE_KEY = "mg:monopoly-mundial:mute";

let ctx: AudioContext | null = null;
let muted = localStorage.getItem(MUTE_KEY) === "1";

function ac(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function isMuted(): boolean {
  return muted;
}

export function toggleMute(): boolean {
  muted = !muted;
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  return muted;
}

function tone(freq: number, dur: number, opts: { type?: OscillatorType; gain?: number; at?: number; slide?: number } = {}): void {
  const audio = ac();
  if (!audio) return;
  const t0 = audio.currentTime + (opts.at ?? 0);
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = opts.type ?? "triangle";
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(opts.gain ?? 0.12, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur: number, opts: { gain?: number; at?: number; freq?: number; q?: number } = {}): void {
  const audio = ac();
  if (!audio) return;
  const t0 = audio.currentTime + (opts.at ?? 0);
  const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * dur), audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = opts.freq ?? 1800;
  filter.Q.value = opts.q ?? 0.8;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(opts.gain ?? 0.1, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(audio.destination);
  src.start(t0);
}

export const sfx = {
  /** Dados golpeando la mesa. */
  dice(): void {
    noise(0.08, { gain: 0.14, freq: 2600 });
    noise(0.06, { gain: 0.1, freq: 3200, at: 0.09 });
  },
  /** Tick de la ficha avanzando una casilla. */
  step(): void {
    tone(520, 0.05, { type: "square", gain: 0.04 });
  },
  /** Golpe seco de un dado 3D rebotando en la mesa. */
  diceTap(): void {
    noise(0.05, { gain: 0.09, freq: 1500, q: 1.2 });
    tone(240, 0.04, { type: "square", gain: 0.03, slide: 150 });
  },
  /** Plata que entra o sale. */
  cash(): void {
    tone(880, 0.08, { type: "square", gain: 0.06 });
    tone(1320, 0.1, { type: "square", gain: 0.06, at: 0.07 });
  },
  /** Compra de propiedad: acorde corto ascendente. */
  buy(): void {
    tone(523, 0.12, { gain: 0.09 });
    tone(659, 0.12, { gain: 0.09, at: 0.08 });
    tone(784, 0.2, { gain: 0.1, at: 0.16 });
  },
  /** Tarjeta VAR/FIFA: barrido. */
  card(): void {
    tone(300, 0.25, { type: "sawtooth", gain: 0.05, slide: 900 });
  },
  /** Silbato del arbitro (tarjeta roja / suspension). */
  whistle(): void {
    tone(2100, 0.18, { type: "square", gain: 0.07, slide: 2300 });
    tone(2100, 0.3, { type: "square", gain: 0.07, at: 0.2, slide: 1900 });
  },
  /** Hinchada al pasar por el Saque Inicial. */
  goal(): void {
    noise(0.7, { gain: 0.07, freq: 900, q: 0.4 });
    tone(523, 0.14, { gain: 0.08 });
    tone(659, 0.14, { gain: 0.08, at: 0.12 });
    tone(784, 0.14, { gain: 0.08, at: 0.24 });
    tone(1046, 0.3, { gain: 0.09, at: 0.36 });
  },
  /** Construccion de tribuna: golpe seco. */
  build(): void {
    tone(160, 0.12, { type: "square", gain: 0.1, slide: 90 });
    noise(0.07, { gain: 0.08, freq: 700, at: 0.02 });
  },
  /** Alarma de deuda. */
  alarm(): void {
    tone(440, 0.12, { type: "square", gain: 0.07 });
    tone(370, 0.16, { type: "square", gain: 0.07, at: 0.14 });
  },
  /** Quiebra: descenso triste. */
  bankrupt(): void {
    tone(392, 0.2, { type: "sawtooth", gain: 0.07 });
    tone(330, 0.2, { type: "sawtooth", gain: 0.07, at: 0.18 });
    tone(262, 0.35, { type: "sawtooth", gain: 0.08, at: 0.36 });
  },
  /** Cambio de turno. */
  turn(): void {
    tone(700, 0.07, { gain: 0.05 });
  },
  /** Fanfarria de campeon. */
  win(): void {
    const notes = [523, 659, 784, 1046, 784, 1046];
    notes.forEach((freq, i) => tone(freq, 0.18, { gain: 0.1, at: i * 0.14 }));
    noise(1.2, { gain: 0.06, freq: 1000, q: 0.4, at: 0.2 });
  },
  /** Beep del countdown (3/2/1) y arranque (YA). */
  count(final: boolean): void {
    tone(final ? 880 : 440, final ? 0.35 : 0.12, { type: "square", gain: 0.08 });
  },
};

/** Reproduce el fx del motor que corresponda (kind emitido por engine.ts). */
export function playFx(kind: string): void {
  const map: Record<string, () => void> = {
    dice: sfx.dice,
    cash: sfx.cash,
    buy: sfx.buy,
    card: sfx.card,
    whistle: sfx.whistle,
    goal: sfx.goal,
    build: sfx.build,
    alarm: sfx.alarm,
    bankrupt: sfx.bankrupt,
    turn: sfx.turn,
    win: sfx.win,
  };
  map[kind]?.();
}
