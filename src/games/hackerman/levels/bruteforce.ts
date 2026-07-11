import { SoundEffects } from "../game/SoundEffects";
import { type HackLevel, type LevelContext } from "./types";

/**
 * Nivel 3 — BruteForce (el minijuego de reels de letras de GTA Online).
 *
 * Cada columna es un carrete de letras que scrollea sin parar. Una banda central
 * marca la fila de captura. En cada carrete hay una letra objetivo resaltada en
 * ROJO; el jugador tiene que DETENER la columna activa (Espacio/Enter/Abajo)
 * justo cuando esa letra roja pasa por la banda. Acierto -> la columna queda
 * fijada (verde) y el foco pasa a la siguiente; fallo -> flash rojo y sigue
 * girando. Todas fijadas = nivel resuelto. Las letras fijadas arman la clave.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const WORDS = [
  "ACCESO",
  "SISTEMA",
  "KERNEL",
  "VECTOR",
  "SOCKET",
  "ROUTER",
  "CIFRADO",
  "MATRIZ",
  "BINARIO",
  "FIREWALL",
  "PAQUETE",
];

const CYCLE = 10; // letras por vuelta del carrete
const ROW_H = 34; // px por fila (5 filas visibles => 170px, fijado en el CSS)
const HALF = 3; // filas a cada lado del centro que se renderizan
const BAND_TOP = 2 * ROW_H; // 68 (fila central, indice 2)
const CATCH_TOL = 0.5; // tolerancia (filas) para considerar la letra en la banda

interface Reel {
  el: HTMLDivElement;
  spans: HTMLSpanElement[]; // pool reposicionado cada frame
  letters: string[]; // ciclo de CYCLE letras
  targetIdx: number; // indice de la letra objetivo (roja) en el ciclo
  offset: number; // posicion de scroll (float, en filas)
  speed: number; // filas por segundo
  locked: boolean;
}

export class BruteForceLevel implements HackLevel {
  readonly id = "bruteforce";
  readonly title = "BRUTEFORCE";
  readonly controls = "Izq/Der elige columna. Espacio/Enter detiene la columna cuando la letra roja cae en la banda.";

  private reelsEl!: HTMLDivElement;
  private bandEl!: HTMLDivElement;
  private reels: Reel[] = [];
  private word = "";
  private active = 0;
  private missTimer: number | null = null;
  private readonly ctx: LevelContext;

  constructor(ctx: LevelContext) {
    this.ctx = ctx;
  }

  mount(host: HTMLElement): void {
    host.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.className = "bf";

    const banner = document.createElement("div");
    banner.className = "bf__banner";
    banner.textContent = "BRUTEFORCE — INTERCEPTANDO CLAVE";

    const grid = document.createElement("div");
    grid.className = "bf__grid";
    this.bandEl = document.createElement("div");
    this.bandEl.className = "bf__band";
    this.reelsEl = document.createElement("div");
    this.reelsEl.className = "bf__reels";
    grid.append(this.bandEl, this.reelsEl);

    wrap.append(banner, grid);
    host.appendChild(wrap);
  }

  begin(): void {
    this.clearMissTimer();
    this.word = WORDS[Math.floor(Math.random() * WORDS.length)];
    this.active = 0;
    this.reels = [];
    this.reelsEl.innerHTML = "";

    for (let c = 0; c < this.word.length; c++) {
      const target = this.word[c];
      // Ciclo de letras al azar con la objetivo insertada en una posicion random.
      const letters: string[] = [];
      for (let i = 0; i < CYCLE; i++) {
        letters.push(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
      }
      const targetIdx = Math.floor(Math.random() * CYCLE);
      letters[targetIdx] = target;

      const el = document.createElement("div");
      el.className = "bf__reel";
      const spans: HTMLSpanElement[] = [];
      for (let k = 0; k < 2 * HALF + 1; k++) {
        const span = document.createElement("span");
        span.className = "bf__letter";
        el.appendChild(span);
        spans.push(span);
      }
      this.reelsEl.appendChild(el);

      const idx = c;
      // Tap en la columna = enfocarla e intentar detenerla (ideal para touch).
      el.addEventListener("click", () => {
        if (this.reels[idx].locked) return;
        if (this.active !== idx) {
          this.setActive(idx);
        } else {
          this.tryCatch();
        }
      });

      this.reels.push({
        el,
        spans,
        letters,
        targetIdx,
        offset: Math.random() * CYCLE,
        speed: 2.4 + Math.random() * 1.2,
        locked: false,
      });
    }

    this.renderActive();
    this.reels.forEach((_, i) => this.renderReel(i));
    this.updateStatus();
  }

  update(dt: number): void {
    for (const reel of this.reels) {
      if (reel.locked) continue;
      reel.offset = (reel.offset + reel.speed * dt) % CYCLE;
    }
    this.reels.forEach((_, i) => this.renderReel(i));
  }

  private renderReel(i: number): void {
    const reel = this.reels[i];
    const base = Math.floor(reel.offset);
    for (let k = 0; k < reel.spans.length; k++) {
      const j = base - HALF + k; // indice absoluto (puede ser negativo)
      const cyc = ((j % CYCLE) + CYCLE) % CYCLE;
      const span = reel.spans[k];
      span.textContent = reel.letters[cyc];
      const dRows = j - reel.offset; // distancia (en filas) al centro de la banda
      span.style.top = `${BAND_TOP + dRows * ROW_H}px`;
      const dist = Math.abs(dRows);
      span.style.opacity = String(Math.max(0.06, 1 - dist * 0.3));
      span.classList.toggle("bf__letter--target", cyc === reel.targetIdx);
    }
  }

  private renderActive(): void {
    this.reels.forEach((reel, i) => {
      reel.el.classList.toggle("is-active", i === this.active && !reel.locked);
      reel.el.classList.toggle("is-locked", reel.locked);
    });
  }

  private setActive(i: number): void {
    if (this.reels[i]?.locked) return;
    this.active = i;
    this.renderActive();
    SoundEffects.playMove();
  }

  private moveActive(dir: number): void {
    if (this.reels.every((r) => r.locked)) return;
    let i = this.active;
    for (let n = 0; n < this.reels.length; n++) {
      i = (i + dir + this.reels.length) % this.reels.length;
      if (!this.reels[i].locked) break;
    }
    this.setActive(i);
  }

  private tryCatch(): void {
    const reel = this.reels[this.active];
    if (!reel || reel.locked) return;

    // Letra mas cercana a la banda y a que distancia esta.
    const nearest = Math.round(reel.offset);
    const dist = Math.abs(reel.offset - nearest);
    const cyc = ((nearest % CYCLE) + CYCLE) % CYCLE;

    if (cyc === reel.targetIdx && dist <= CATCH_TOL) {
      // Acierto: fijar la columna con la objetivo centrada.
      reel.offset = ((reel.targetIdx % CYCLE) + CYCLE) % CYCLE;
      reel.locked = true;
      this.renderReel(this.active);
      this.renderActive();
      SoundEffects.playLock();
      this.ctx.onProgress();
      this.updateStatus();
      if (this.reels.every((r) => r.locked)) {
        this.ctx.onSolved();
        return;
      }
      this.moveActive(1);
    } else {
      // Fallo: flash en la banda; la columna sigue girando.
      SoundEffects.playError();
      this.bandEl.classList.add("is-miss");
      this.clearMissTimer();
      this.missTimer = window.setTimeout(() => {
        this.bandEl.classList.remove("is-miss");
        this.missTimer = null;
      }, 260);
    }
  }

  private updateStatus(): void {
    const done = this.reels.filter((r) => r.locked).length;
    this.ctx.setStatus(`CLAVE ${done}/${this.reels.length}`);
  }

  handleKey(e: KeyboardEvent): void {
    switch (e.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        this.moveActive(-1);
        break;
      case "ArrowRight":
      case "d":
      case "D":
        this.moveActive(1);
        break;
      case "ArrowDown":
      case "s":
      case "S":
      case " ":
      case "Enter":
        e.preventDefault();
        this.tryCatch();
        break;
    }
  }

  private clearMissTimer(): void {
    if (this.missTimer !== null) {
      clearTimeout(this.missTimer);
      this.missTimer = null;
    }
  }

  destroy(): void {
    this.clearMissTimer();
  }
}
