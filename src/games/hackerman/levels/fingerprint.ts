import { SoundEffects } from "../game/SoundEffects";
import { type HackLevel, type LevelContext, mulberry32 } from "./types";

/**
 * Nivel 1 — Clon de huella (inspirado en el "fingerprint clone" de GTA Online).
 *
 * A la derecha esta la huella OBJETIVO. A la izquierda una columna de
 * COMPONENTES: la huella partida en `SLOTS` franjas horizontales. Cada franja
 * arranca mostrando un candidato al azar; el jugador cicla los candidatos
 * (izq/der) y confirma (Enter) el que coincide con esa franja del objetivo.
 * Acierto -> la franja queda fijada (verde) y se pasa a la siguiente; error ->
 * flash rojo y bloqueo breve. Todas las franjas fijadas = nivel resuelto.
 *
 * Cada candidato es la misma franja pero de una huella distinta, asi que hay que
 * comparar de verdad contra el objetivo (no alcanza con ciclar a lo bruto: cada
 * intento fallido cuesta tiempo, que es justo el score del juego).
 */

const GRID_W = 60;
const GRID_H = 84;
const SLOTS = 6;
const STRIP_ROWS = GRID_H / SLOTS; // 14
const CANDIDATES = 4; // 1 correcto + 3 senuelos
const CELL = 3; // px por celda en el render
const THRESH = 0.1; // umbral de cresta (más alto = crestas más finas)
const WRONG_LOCK_MS = 750;
const COLOR = "#33ff88";
const ACTIVE_COLOR = "#e6fff1"; // franja en foco: casi blanca, como la referencia
const DIM_COLOR = "rgba(51,255,136,0.3)";

type Fingerprint = Uint8Array; // GRID_W * GRID_H, 1 = cresta

/**
 * Genera una huella con crestas fluidas tipo "loop": anillos ovalados
 * concentricos alrededor de un nucleo, girados y deformados organicamente. A
 * diferencia del ruido en bloques anterior, las crestas quedan continuas y con
 * espaciado parejo, que es lo que hace que se lea como una huella de verdad.
 */
function makeFingerprint(seed: number): Fingerprint {
  const r = mulberry32(seed);
  const cx = GRID_W * (0.4 + 0.2 * r());
  const cy = GRID_H * (0.3 + 0.16 * r()); // nucleo hacia arriba (loop abre abajo)
  const freq = 1.25 + 0.4 * r(); // densidad de crestas
  const stretchX = 0.85 + 0.25 * r();
  const stretchY = 0.44 + 0.18 * r(); // ovalo estirado en vertical
  const twist = (r() - 0.5) * 1.5; // giro tipo whorl
  const warpAmp = 1.9 + 1.1 * r();
  const warpFx = 0.09 + 0.05 * r();
  const warpFy = 0.08 + 0.05 * r();
  const warpPh = r() * Math.PI * 2;
  const warpPh2 = r() * Math.PI * 2;
  const tilt = (r() - 0.5) * 0.3; // deriva global que inclina el patron
  const phase0 = r() * Math.PI * 2;

  const out = new Uint8Array(GRID_W * GRID_H);
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const dx = (x - cx) * stretchX;
      const dy = (y - cy) * stretchY;
      const rad = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx);
      // Warp de dominio en dos ejes: rompe la simetria de "anillos de arbol".
      const warp =
        Math.sin(x * warpFx + y * 0.03 + warpPh) * warpAmp +
        Math.cos(y * warpFy - x * 0.02 + warpPh2) * warpAmp;
      const phase = rad * freq + ang * twist + warp * 0.6 + x * tilt + phase0;
      out[y * GRID_W + x] = Math.sin(phase) > THRESH ? 1 : 0;
    }
  }
  return out;
}

/** Dibuja una franja (o el objetivo entero) de una huella en un canvas. */
function drawBand(
  canvas: HTMLCanvasElement,
  fp: Fingerprint,
  slot: number,
  rows: number,
  color: string
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  const r0 = slot * STRIP_ROWS;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (fp[(r0 + y) * GRID_W + x]) ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
  }
}

interface Slot {
  el: HTMLDivElement;
  canvas: HTMLCanvasElement;
  candidates: Fingerprint[];
  correct: number; // indice del candidato correcto
  current: number; // candidato mostrado
  locked: boolean;
}

export class FingerprintLevel implements HackLevel {
  readonly id = "fingerprint";
  readonly title = "CLON DE HUELLA";
  readonly controls = "Flechas para elegir franja y ciclar candidatos. Enter fija la que coincide con el objetivo.";

  private targetCanvas!: HTMLCanvasElement;
  private slotList!: HTMLDivElement;
  private signalEls: HTMLDivElement[] = [];
  private slots: Slot[] = [];
  private active = 0;
  private target!: Fingerprint;
  private busy = false;
  private wrongTimer: number | null = null;
  private readonly ctx: LevelContext;

  constructor(ctx: LevelContext) {
    this.ctx = ctx;
  }

  mount(host: HTMLElement): void {
    host.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.className = "fp";

    // --- Columna izquierda: señales + componentes ---
    const left = document.createElement("div");
    left.className = "fp__col fp__components";

    const sigHead = document.createElement("div");
    sigHead.className = "fp__head";
    sigHead.textContent = "SENALES DESCIFRADAS";
    const signals = document.createElement("div");
    signals.className = "fp__signals";
    this.signalEls = [];
    for (let i = 0; i < SLOTS; i++) {
      const dot = document.createElement("div");
      dot.className = "fp__signal";
      signals.appendChild(dot);
      this.signalEls.push(dot);
    }

    const compHead = document.createElement("div");
    compHead.className = "fp__head";
    compHead.textContent = "COMPONENTES";
    const slotList = document.createElement("div");
    slotList.className = "fp__slots";

    left.append(sigHead, signals, compHead, slotList);

    // --- Columna derecha: objetivo ---
    const right = document.createElement("div");
    right.className = "fp__col fp__target";
    const rightHead = document.createElement("div");
    rightHead.className = "fp__head";
    rightHead.textContent = "CLON OBJETIVO";
    this.targetCanvas = document.createElement("canvas");
    this.targetCanvas.width = GRID_W * CELL;
    this.targetCanvas.height = GRID_H * CELL;
    this.targetCanvas.className = "fp__target-canvas";
    right.append(rightHead, this.targetCanvas);

    wrap.append(left, right);
    host.appendChild(wrap);

    this.slotList = slotList;
  }

  begin(): void {
    this.clearWrongTimer();
    this.busy = false;
    this.active = 0;
    this.slots = [];
    this.slotList.innerHTML = "";

    const baseSeed = (Math.random() * 1e9) >>> 0;
    this.target = makeFingerprint(baseSeed);
    // Huellas senuelo: una por candidato-extra, compartidas por todas las franjas.
    const decoys: Fingerprint[] = [];
    for (let i = 0; i < CANDIDATES - 1; i++) decoys.push(makeFingerprint(baseSeed + 101 + i * 977));

    for (let s = 0; s < SLOTS; s++) {
      const pool = [this.target, ...decoys];
      // Barajar y recordar donde quedo el correcto (el objetivo).
      const order = pool.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      const candidates = order.map((i) => pool[i]);
      const correct = order.indexOf(0);

      const el = document.createElement("div");
      el.className = "fp__slot";
      const prev = document.createElement("button");
      prev.className = "fp__arrow";
      prev.textContent = "‹";
      const canvas = document.createElement("canvas");
      canvas.width = GRID_W * CELL;
      canvas.height = STRIP_ROWS * CELL;
      canvas.className = "fp__slot-canvas";
      const next = document.createElement("button");
      next.className = "fp__arrow";
      next.textContent = "›";
      el.append(prev, canvas, next);
      this.slotList.appendChild(el);

      const slot: Slot = {
        el,
        canvas,
        candidates,
        correct,
        current: Math.floor(Math.random() * CANDIDATES),
        locked: false,
      };
      this.slots.push(slot);

      const idx = s;
      prev.addEventListener("click", () => {
        this.setActive(idx);
        this.cycle(-1);
      });
      next.addEventListener("click", () => {
        this.setActive(idx);
        this.cycle(1);
      });
      // Click sobre la franja = confirmar el candidato mostrado (ideal para touch).
      canvas.addEventListener("click", () => {
        this.setActive(idx);
        this.confirm();
      });
    }

    // El objetivo es la huella entera (las 6 franjas seguidas).
    drawBand(this.targetCanvas, this.target, 0, GRID_H, COLOR);

    this.signalEls.forEach((d) => d.classList.remove("is-on"));
    this.slots.forEach((_, i) => this.renderSlot(i));
    this.setActive(0);
    this.updateStatus();
  }

  private renderSlot(i: number): void {
    const slot = this.slots[i];
    const color = slot.locked ? COLOR : i === this.active ? ACTIVE_COLOR : DIM_COLOR;
    drawBand(slot.canvas, slot.candidates[slot.current], i, STRIP_ROWS, color);
    slot.el.classList.toggle("is-locked", slot.locked);
    slot.el.classList.toggle("is-active", i === this.active && !slot.locked);
  }

  private setActive(i: number): void {
    if (this.slots[i]?.locked) return;
    const prev = this.active;
    this.active = i;
    if (prev !== i) this.renderSlot(prev);
    this.renderSlot(i);
  }

  /** Mueve el foco a la siguiente franja sin fijar (dir +1 / -1), salteando fijadas. */
  private moveActive(dir: number): void {
    if (this.slots.every((s) => s.locked)) return;
    let i = this.active;
    for (let n = 0; n < SLOTS; n++) {
      i = (i + dir + SLOTS) % SLOTS;
      if (!this.slots[i].locked) break;
    }
    this.setActive(i);
    SoundEffects.playMove();
  }

  private cycle(dir: number): void {
    if (this.busy) return;
    const slot = this.slots[this.active];
    if (!slot || slot.locked) return;
    slot.current = (slot.current + dir + CANDIDATES) % CANDIDATES;
    this.renderSlot(this.active);
    SoundEffects.playCycle();
  }

  private confirm(): void {
    if (this.busy) return;
    const slot = this.slots[this.active];
    if (!slot || slot.locked) return;

    if (slot.current === slot.correct) {
      slot.locked = true;
      this.renderSlot(this.active);
      this.signalEls[this.active]?.classList.add("is-on");
      SoundEffects.playLock();
      this.ctx.onProgress();
      this.updateStatus();
      if (this.slots.every((s) => s.locked)) {
        this.ctx.onSolved();
        return;
      }
      // Enfocar la siguiente franja sin fijar.
      let i = this.active;
      for (let n = 0; n < SLOTS; n++) {
        i = (i + 1) % SLOTS;
        if (!this.slots[i].locked) break;
      }
      this.setActive(i);
    } else {
      // Error: flash rojo y bloqueo breve (el tiempo corre, asi que cuesta).
      SoundEffects.playError();
      this.busy = true;
      slot.el.classList.add("is-wrong");
      this.wrongTimer = window.setTimeout(() => {
        slot.el.classList.remove("is-wrong");
        this.busy = false;
        this.wrongTimer = null;
      }, WRONG_LOCK_MS);
    }
  }

  private updateStatus(): void {
    const done = this.slots.filter((s) => s.locked).length;
    this.ctx.setStatus(`COMPONENTES ${done}/${SLOTS}`);
  }

  handleKey(e: KeyboardEvent): void {
    switch (e.key) {
      case "ArrowUp":
      case "w":
      case "W":
        this.moveActive(-1);
        break;
      case "ArrowDown":
      case "s":
      case "S":
        this.moveActive(1);
        break;
      case "ArrowLeft":
      case "a":
      case "A":
        this.cycle(-1);
        break;
      case "ArrowRight":
      case "d":
      case "D":
        this.cycle(1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        this.confirm();
        break;
    }
  }

  private clearWrongTimer(): void {
    if (this.wrongTimer !== null) {
      clearTimeout(this.wrongTimer);
      this.wrongTimer = null;
    }
  }

  destroy(): void {
    this.clearWrongTimer();
  }
}
