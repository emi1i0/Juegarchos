import * as THREE from "three";
import { sfx } from "./audio";

/**
 * Dados 3D con Three.js: dos cubos que caen desde arriba, dan volteretas con
 * fisica simulada (gravedad + rebotes) y se asientan mostrando exactamente los
 * valores que tiro el motor. Es un overlay autocontenido (canvas transparente
 * sobre el centro del tablero) con su propio loop; se apaga al asentarse para
 * no gastar CPU (el ultimo frame queda pintado). Sin assets externos: las
 * caras se generan con canvas 2D, siguiendo la convencion del repo.
 *
 * Patron de skills threejs-fundamentals (escena/camara/renderer) y
 * threejs-animation (tumble procedural + slerp de asentado). No usa Rapier:
 * seria sobrepeso para un juego DOM; la fisica de caja que cae es trivial de
 * simular a mano y el resultado se lee igual.
 */

const DIE_SIZE = 1;
const FLOOR_Y = DIE_SIZE / 2;
const GRAVITY = -26;
const RESTITUTION = 0.42;
const DROP_HEIGHT = 5.2;
const SETTLE_DUR = 0.26;
const MIN_BOUNCE_VY = 1.6;

/** Orden de grupos de BoxGeometry: +X, -X, +Y, -Y, +Z, -Z. */
const FACE_VALUES = [3, 4, 1, 6, 2, 5];

/** Coordenadas (col, fila) de los puntos en la grilla 3x3 de una cara. */
const PIP_LAYOUT: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

interface DieBody {
  mesh: THREE.Mesh;
  shadow: THREE.Mesh;
  y: number;
  vy: number;
  angVel: THREE.Vector3;
  bounces: number;
  settling: boolean;
  settleFrom: THREE.Quaternion;
  settleTo: THREE.Quaternion;
  settleT: number;
  done: boolean;
}

/** Textura de una cara: fondo claro redondeado + puntos oscuros. */
function faceTexture(value: number, pip: string): THREE.Texture {
  const s = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext("2d")!;

  const r = 22;
  ctx.fillStyle = "#f6f4ec";
  roundRect(ctx, 4, 4, s - 8, s - 8, r);
  ctx.fill();
  ctx.strokeStyle = "rgba(20,40,60,0.14)";
  ctx.lineWidth = 4;
  roundRect(ctx, 4, 4, s - 8, s - 8, r);
  ctx.stroke();

  const rad = value === 1 ? 15 : 12;
  for (const [col, rowPos] of PIP_LAYOUT[value]) {
    const x = s * (0.28 + col * 0.22);
    const y = s * (0.28 + rowPos * 0.22);
    const grad = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, rad);
    grad.addColorStop(0, pip);
    grad.addColorStop(1, "#0c1c2a");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Mancha radial para la sombra proyectada de cada dado. */
function shadowTexture(): THREE.Texture {
  const s = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(s / 2, s / 2, 2, s / 2, s / 2, s / 2);
  grad.addColorStop(0, "rgba(0,0,0,0.5)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(canvas);
}

/** Cuaternion que lleva la cara con valor `v` hacia arriba (+Y). */
function baseQuat(v: number): THREE.Quaternion {
  const q = new THREE.Quaternion();
  const X = new THREE.Vector3(1, 0, 0);
  const Z = new THREE.Vector3(0, 0, 1);
  switch (v) {
    case 1: return q;
    case 6: return q.setFromAxisAngle(X, Math.PI);
    case 2: return q.setFromAxisAngle(X, -Math.PI / 2);
    case 5: return q.setFromAxisAngle(X, Math.PI / 2);
    case 3: return q.setFromAxisAngle(Z, Math.PI / 2);
    case 4: return q.setFromAxisAngle(Z, -Math.PI / 2);
    default: return q;
  }
}

export class Dice3D {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock = new THREE.Clock();
  private readonly dice: DieBody[] = [];
  private readonly faceTex: THREE.Texture[] = [];
  private readonly host: HTMLElement;
  private readonly resizeObs: ResizeObserver;

  private running = false;
  /** Valores que ya se estan mostrando (para no re-acomodar en cada render). */
  private shownKey: string | null = null;
  private onSettle: (() => void) | null = null;
  private readonly tmpAxis = new THREE.Vector3();
  private readonly tmpQuat = new THREE.Quaternion();
  private readonly upAxis = new THREE.Vector3(0, 1, 0);

  constructor(host: HTMLElement) {
    this.host = host;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    this.camera.position.set(0, 6.6, 4.2);
    this.camera.lookAt(0, 0.4, 0);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.DirectionalLight(0xfff2d0, 1.5);
    key.position.set(-3, 7, 4);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fd8ff, 0.5);
    rim.position.set(4, 3, -3);
    this.scene.add(rim);

    // 1..6 en indices 1..6 (0 sin usar) para materiales por cara.
    this.faceTex[0] = faceTexture(1, "#e04040");
    for (let v = 1; v <= 6; v++) this.faceTex[v] = faceTexture(v, "#22384a");

    const shadowTex = shadowTexture();
    const geo = new THREE.BoxGeometry(DIE_SIZE, DIE_SIZE, DIE_SIZE);
    // Dado 1 con puntos oscuros, dado 2 con el 1 en rojo (guino clasico).
    for (let i = 0; i < 2; i++) {
      const mats = FACE_VALUES.map(
        (v) => new THREE.MeshStandardMaterial({ map: this.faceTex[v], roughness: 0.5, metalness: 0.02 }),
      );
      const mesh = new THREE.Mesh(geo, mats);
      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(1.7, 1.7),
        new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.35 }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.02;
      this.scene.add(mesh, shadow);
      this.dice.push({
        mesh,
        shadow,
        y: FLOOR_Y,
        vy: 0,
        angVel: new THREE.Vector3(),
        bounces: 0,
        settling: false,
        settleFrom: new THREE.Quaternion(),
        settleTo: new THREE.Quaternion(),
        settleT: 0,
        done: true,
      });
    }

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(host);
    this.resize();
    this.hide();
  }

  private resize(): void {
    const w = this.host.clientWidth || 1;
    const h = this.host.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    if (!this.running) this.renderer.render(this.scene, this.camera);
  }

  /** Muestra los dados ya asentados en los valores dados, sin animar. */
  showStatic(d1: number, d2: number): void {
    // Si hay una tirada en vuelo, dejarla terminar; si ya se muestran estos
    // valores, no re-acomodar (evita saltos en cada re-render).
    const key = `${d1}-${d2}`;
    if (this.running || this.shownKey === key) {
      this.host.style.display = "";
      return;
    }
    this.shownKey = key;
    this.host.style.display = "";
    const values = [d1, d2];
    this.dice.forEach((die, i) => {
      const q = baseQuat(values[i]).premultiply(this.tmpQuat.setFromAxisAngle(this.upAxis, (i - 0.5) * 0.5));
      die.mesh.quaternion.copy(q);
      die.y = FLOOR_Y;
      die.mesh.position.set(dieX(i), FLOOR_Y, 0);
      die.shadow.position.set(dieX(i), 0.02, 0);
      die.shadow.scale.setScalar(1);
      (die.shadow.material as THREE.MeshBasicMaterial).opacity = 0.35;
      die.settling = false;
      die.done = true;
    });
    this.renderer.render(this.scene, this.camera);
  }

  /** Lanza la animacion de tirada y termina asentando en d1/d2. */
  roll(d1: number, d2: number, onSettle?: () => void): void {
    this.host.style.display = "";
    this.onSettle = onSettle ?? null;
    this.shownKey = `${d1}-${d2}`;
    const values = [d1, d2];
    this.dice.forEach((die, i) => {
      die.y = DROP_HEIGHT + Math.random() * 0.8;
      die.vy = -2 - Math.random() * 2;
      die.angVel.set(rand(9, 15), rand(9, 15), rand(9, 15));
      if (Math.random() < 0.5) die.angVel.x *= -1;
      if (Math.random() < 0.5) die.angVel.z *= -1;
      die.bounces = 0;
      die.settling = false;
      die.settleT = 0;
      die.done = false;
      die.mesh.position.set(dieX(i), die.y, rand(-0.3, 0.3));
      die.mesh.quaternion.setFromEuler(
        new THREE.Euler(rand(0, Math.PI * 2), rand(0, Math.PI * 2), rand(0, Math.PI * 2)),
      );
      const yaw = rand(-0.6, 0.6);
      die.settleTo.copy(baseQuat(values[i])).premultiply(this.tmpQuat.setFromAxisAngle(this.upAxis, yaw));
    });
    if (!this.running) {
      this.running = true;
      this.clock.getDelta();
      this.loop();
    }
  }

  hide(): void {
    this.running = false;
    this.shownKey = null;
    this.host.style.display = "none";
  }

  private loop = (): void => {
    if (!this.running) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    let allDone = true;

    for (const die of this.dice) {
      if (die.done) {
        this.placeShadow(die);
        continue;
      }
      allDone = false;

      if (!die.settling) {
        die.vy += GRAVITY * dt;
        die.y += die.vy * dt;

        // Tumble en espacio de mundo (premultiply).
        const speed = die.angVel.length();
        if (speed > 1e-4) {
          this.tmpAxis.copy(die.angVel).normalize();
          this.tmpQuat.setFromAxisAngle(this.tmpAxis, speed * dt);
          die.mesh.quaternion.premultiply(this.tmpQuat);
        }

        if (die.y <= FLOOR_Y) {
          die.y = FLOOR_Y;
          die.vy = -die.vy * RESTITUTION;
          die.angVel.multiplyScalar(0.55);
          die.bounces++;
          sfx.diceTap();
          if (die.vy < MIN_BOUNCE_VY || die.bounces >= 3) {
            die.settling = true;
            die.settleT = 0;
            die.settleFrom.copy(die.mesh.quaternion);
            die.vy = 0;
          }
        }
      } else {
        die.settleT = Math.min(1, die.settleT + dt / SETTLE_DUR);
        const e = 1 - (1 - die.settleT) * (1 - die.settleT);
        die.mesh.quaternion.slerpQuaternions(die.settleFrom, die.settleTo, e);
        if (die.settleT >= 1) die.done = true;
      }

      die.mesh.position.y = die.y;
      this.placeShadow(die);
    }

    this.renderer.render(this.scene, this.camera);

    if (allDone) {
      this.running = false;
      this.renderer.render(this.scene, this.camera);
      const cb = this.onSettle;
      this.onSettle = null;
      cb?.();
      return;
    }
    requestAnimationFrame(this.loop);
  };

  private placeShadow(die: DieBody): void {
    die.shadow.position.set(die.mesh.position.x, 0.02, die.mesh.position.z);
    const h = Math.max(0, die.y - FLOOR_Y);
    die.shadow.scale.setScalar(1 + h * 0.16);
    (die.shadow.material as THREE.MeshBasicMaterial).opacity = Math.max(0.08, 0.35 - h * 0.045);
  }

  dispose(): void {
    this.running = false;
    this.resizeObs.disconnect();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mat = obj.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
    for (const t of this.faceTex) t?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

function dieX(i: number): number {
  return i === 0 ? -0.95 : 0.95;
}

function rand(a: number, b: number): number {
  return a + Math.random() * (b - a);
}
