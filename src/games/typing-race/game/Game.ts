import {
  BEST_KEY,
  CHAMBERS,
  CLEAN_SENTENCE_RELIEF,
  COUNTDOWN_LABELS,
  COUNTDOWN_STEP,
  MAX_DT,
  PRESSURE_FLOOR,
  ROUND_PRESSURE,
  SENTENCE_TIERS,
  SURVIVORS_MAX,
  SURVIVORS_MIN,
  TIME_BASE,
  TIME_MIN,
  TIME_PER_CHAR,
  TIMEOUT_BULLETS,
} from "./constants";
import { Hud } from "./Hud";
import { SoundEffects } from "./SoundEffects";
import { initRoomMode, type RoomMode } from "../../../shared/room/roomMode";

type State = "ready" | "countdown" | "playing" | "roulette" | "gameOver";

/** Dramatizacion del gatillo (ms): suspenso, sostener la muerte, sostener el alivio. */
const TRIGGER_SUSPENSE_MS = 1250;
const DEATH_HOLD_MS = 1150;
const SURVIVE_HOLD_MS = 800;

/** Resultado de una condena (partida). */
export interface RunResult {
  /** Frases superadas (el puntaje). */
  frases: number;
  /** Puesto en la sala virtual (1 = ultimo en pie). */
  placement: number;
  startSurvivors: number;
  wpm: number;
  accuracy: number;
  soleSurvivor: boolean;
}

export class Game {
  private readonly hud: Hud;
  /** Modo sala (multijugador): activo solo con ?room= en la URL. */
  private readonly room: RoomMode | null;

  private state: State = "ready";

  // Frase en curso (modelo estricto: se avanza solo con la tecla correcta).
  private target = "";
  private pos = 0;
  private errorsThisSentence = 0;
  private lastSentence = "";

  // Revolver y progreso de la condena.
  private chamber = 0; // balas cargadas (0..CHAMBERS)
  private round = 1; // sentencia actual (1-based)
  private frases = 0; // frases superadas = puntaje

  // Battle royale virtual.
  private survivors = 0; // vivos incluyendome
  private startSurvivors = 0;
  private reachedSole = false;

  // Timer por frase.
  private timeLimit = 0;
  private timeLeft = 0;

  // Stats secundarias (tabla de resultados).
  private correctKeystrokes = 0;
  private totalKeystrokes = 0;
  private timeElapsed = 0;

  // Pendientes entre la frase y la resolucion del gatillo.
  private completedThisSentence = false;
  private pendingPerfect = false;

  private bestFrases: number | null = null;

  // Countdown / loop.
  private countdownTime = 0;
  private lastCountdownIndex = -1;
  private lastTime = 0;

  constructor(container: HTMLElement) {
    const savedBest = localStorage.getItem(BEST_KEY);
    if (savedBest) this.bestFrases = parseInt(savedBest, 10);

    this.hud = new Hud(container);
    this.hud.showStart(this.bestFrases);

    // Parcial por timeout de sala: las frases superadas hasta el momento.
    this.room = initRoomMode("typing-race", {
      getScore: () => this.frases,
      onStart: () => this.beginCountdown(),
    });

    window.addEventListener("keydown", this.handleKeyDown);

    this.lastTime = performance.now();
    requestAnimationFrame(this.tick);
  }

  // ---------- Input ----------

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.state === "playing") {
      this.handleTypingKey(e);
      return;
    }
    if (e.key !== "Enter") return;
    if (this.state === "ready") {
      this.beginCountdown();
    } else if (this.state === "gameOver") {
      if (this.room) return; // una sola condena por ronda en sala
      this.beginCountdown();
    }
  };

  private handleTypingKey(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length !== 1) return; // solo caracteres imprimibles; sin backspace

    e.preventDefault();
    const expected = this.target[this.pos];
    this.totalKeystrokes++;

    if (e.key === expected) {
      this.pos++;
      this.correctKeystrokes++;
      SoundEffects.playKey();
      if (this.pos >= this.target.length) {
        this.completeSentence(false);
        return;
      }
      this.hud.renderSentence(this.target, this.pos);
    } else {
      // Cada tecla equivocada carga una bala en el tambor, al instante.
      this.errorsThisSentence++;
      this.chamber = Math.min(CHAMBERS, this.chamber + 1);
      SoundEffects.playError();
      this.hud.flashError();
      this.hud.setChamber(this.chamber);
    }
  }

  // ---------- Frase / ronda ----------

  private pickSentence(): string {
    const r = this.round;
    const tier = r >= 13 ? 3 : r >= 8 ? 2 : r >= 4 ? 1 : 0;
    const pool = SENTENCE_TIERS[tier];
    let s = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1) {
      while (s === this.lastSentence) s = pool[Math.floor(Math.random() * pool.length)];
    }
    this.lastSentence = s;
    return s;
  }

  private loadSentence(): void {
    this.target = this.pickSentence();
    this.pos = 0;
    this.errorsThisSentence = 0;

    const raw = TIME_BASE + this.target.length * TIME_PER_CHAR;
    const pressure = Math.max(PRESSURE_FLOOR, 1 - this.round * ROUND_PRESSURE);
    this.timeLimit = Math.max(TIME_MIN, raw * pressure);
    this.timeLeft = this.timeLimit;

    this.hud.setRound(this.round);
    this.hud.setChamber(this.chamber);
    this.hud.setFrases(this.frases);
    this.hud.setSurvivors(this.survivors, this.startSurvivors);
    this.hud.setTimer(this.timeLeft, this.timeLimit);
    this.hud.renderSentence(this.target, this.pos);
  }

  private beginCountdown(): void {
    this.state = "countdown";

    this.chamber = 0;
    this.round = 1;
    this.frases = 0;
    this.correctKeystrokes = 0;
    this.totalKeystrokes = 0;
    this.timeElapsed = 0;
    this.reachedSole = false;
    this.lastSentence = "";
    this.survivors = randInt(SURVIVORS_MIN, SURVIVORS_MAX);
    this.startSurvivors = this.survivors;

    this.loadSentence();

    this.countdownTime = 0;
    this.lastCountdownIndex = -1;

    this.hud.hideOverlay();
    this.hud.showChrome();
    this.hud.showCountdown(COUNTDOWN_LABELS[0]);
  }

  private startPlaying(): void {
    this.state = "playing";
    this.hud.showPlay();
    this.hud.renderSentence(this.target, this.pos);
  }

  // ---------- Gatillo (ruleta) ----------

  private completeSentence(timedOut: boolean): void {
    this.state = "roulette";
    this.completedThisSentence = !timedOut;
    this.pendingPerfect = !timedOut && this.errorsThisSentence === 0;
    if (timedOut) this.chamber = Math.min(CHAMBERS, this.chamber + TIMEOUT_BULLETS);

    this.hud.setChamber(this.chamber);
    this.hud.startTriggerPull(this.chamber, timedOut);
    SoundEffects.playSpin();
    window.setTimeout(() => this.resolveTrigger(), TRIGGER_SUSPENSE_MS);
  }

  private resolveTrigger(): void {
    if (this.state !== "roulette") return;
    const dead = Math.random() < this.chamber / CHAMBERS;

    if (dead) {
      SoundEffects.playGunshot();
      this.hud.showDeath();
      window.setTimeout(() => this.endGame(), DEATH_HOLD_MS);
      return;
    }

    SoundEffects.playClick();
    if (this.completedThisSentence) this.frases++;
    if (this.pendingPerfect) this.chamber = Math.max(0, this.chamber - CLEAN_SENTENCE_RELIEF);
    this.updateSurvivors();
    this.round++;
    this.hud.showClickRelief(this.chamber, this.frases);
    window.setTimeout(() => this.nextSentence(), SURVIVE_HOLD_MS);
  }

  private nextSentence(): void {
    if (this.state !== "roulette") return;
    this.state = "playing";
    this.loadSentence();
    this.hud.showPlay();
  }

  /** Elimina a otros presos (ambiente battle royale). Nunca baja de 1 (vos). */
  private updateSurvivors(): void {
    if (this.survivors <= 1) return;
    const elim = Math.min(this.survivors - 1, Math.ceil(this.survivors * 0.11) + randInt(0, 2));
    if (elim <= 0) return;
    this.survivors -= elim;
    SoundEffects.playDistantShots(elim);
    this.hud.setSurvivors(this.survivors, this.startSurvivors);
    if (this.survivors <= 1 && !this.reachedSole) {
      this.reachedSole = true;
      this.hud.showSoleSurvivor();
    }
  }

  // ---------- Fin ----------

  private endGame(): void {
    this.state = "gameOver";

    const score = this.frases;
    let isNewBest = false;
    if (this.bestFrases === null || score > this.bestFrases) {
      this.bestFrases = score;
      localStorage.setItem(BEST_KEY, String(score));
      isNewBest = true;
    }

    const minutes = this.timeElapsed / 60;
    const wpm = minutes > 0 ? Math.round(this.correctKeystrokes / 5 / minutes) : 0;
    const accuracy =
      this.totalKeystrokes > 0
        ? Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100)
        : 100;
    const placement = this.reachedSole ? 1 : this.survivors;

    const result: RunResult = {
      frases: score,
      placement,
      startSurvivors: this.startSurvivors,
      wpm,
      accuracy,
      soleSurvivor: this.reachedSole,
    };

    this.hud.showGameOver(result, isNewBest, this.bestFrases ?? 0);

    if (this.room) this.room.reportScore(score);
    else this.hud.showRanking("typing-race", score, "survival");
  }

  // ---------- Loop ----------

  private tick = (now: number): void => {
    const dt = Math.min((now - this.lastTime) / 1000, MAX_DT);
    this.lastTime = now;
    this.update(dt);
    requestAnimationFrame(this.tick);
  };

  private update(dt: number): void {
    if (this.state === "countdown") {
      this.countdownTime += dt;
      const index = Math.floor(this.countdownTime / COUNTDOWN_STEP);
      if (index >= COUNTDOWN_LABELS.length) {
        this.hud.showCountdown(null);
        this.startPlaying();
      } else if (index !== this.lastCountdownIndex) {
        this.lastCountdownIndex = index;
        SoundEffects.playCountdownTick();
        this.hud.showCountdown(COUNTDOWN_LABELS[index]);
      }
    } else if (this.state === "playing") {
      this.timeElapsed += dt;
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.hud.setTimer(0, this.timeLimit);
        this.completeSentence(true);
      } else {
        this.hud.setTimer(this.timeLeft, this.timeLimit);
      }
    }
  }

  dispose(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
  }
}

/** Entero aleatorio en [min, max]. */
function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}
