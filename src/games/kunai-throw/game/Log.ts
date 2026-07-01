import {
  COLLISION_ANGLE,
  KUNAI_EMBED,
  LOG_CENTER_X,
  LOG_CENTER_Y,
  LOG_RADIUS,
} from "./constants";
import { drawKunai, StuckKunai } from "./Kunai";

/** Smallest absolute difference between two angles, wrapped to [0, PI]. */
function angleDelta(a: number, b: number): number {
  let d = Math.abs(a - b) % (Math.PI * 2);
  if (d > Math.PI) d = Math.PI * 2 - d;
  return d;
}

export class Log {
  /** Current rotation of the log (radians). */
  rotation = 0;
  readonly stuck: StuckKunai[] = [];

  private baseSpeed = 1.4; // radians per second
  private dir = 1;
  private reverses = false;
  private reverseInterval = 1.4;
  private reverseTimer = 1.4;
  private sineAmp = 0;
  private sineFreq = 1.5;
  private time = 0;

  /** Configure the rotation pattern and pre-stuck obstacles for a level. */
  setLevel(level: number): void {
    this.stuck.length = 0;
    this.time = 0;
    this.rotation = 0;
    this.dir = Math.random() < 0.5 ? 1 : -1;

    // Speed ramps up with the level and is capped so it stays fair.
    this.baseSpeed = Math.min(1.3 + level * 0.22, 4.2);

    // From level 3 the log periodically reverses direction.
    this.reverses = level >= 3;
    this.reverseInterval = 1.0 + Math.random() * 1.2;
    this.reverseTimer = this.reverseInterval;

    // From level 5 the speed pulses via a sine wave for an uneven rhythm.
    this.sineAmp = level >= 5 ? Math.min(0.6 + level * 0.12, 2.2) : 0;
    this.sineFreq = 1.2 + Math.random();

    // Pre-place obstacle kunais that the player must avoid (grows with level).
    const obstacles = Math.min(Math.max(level - 1, 0), 6);
    let attempts = 0;
    while (this.stuck.length < obstacles && attempts < 200) {
      attempts++;
      const rel = Math.random() * Math.PI * 2;
      if (this.canPlaceAt(rel, COLLISION_ANGLE * 1.6)) {
        this.stuck.push(new StuckKunai(rel, true));
      }
    }
  }

  update(dt: number): void {
    this.time += dt;

    if (this.reverses) {
      this.reverseTimer -= dt;
      if (this.reverseTimer <= 0) {
        this.dir *= -1;
        this.reverseTimer = this.reverseInterval;
      }
    }

    let speed = this.baseSpeed;
    if (this.sineAmp) speed += this.sineAmp * Math.sin(this.time * this.sineFreq);
    this.rotation += speed * this.dir * dt;
  }

  /** World angle (center -> kunai) that an incoming kunai would occupy. */
  worldToRel(worldAngle: number): number {
    return worldAngle - this.rotation;
  }

  /** True if no existing kunai is within `gap` radians of the given rel angle. */
  canPlaceAt(relAngle: number, gap = COLLISION_ANGLE): boolean {
    return this.stuck.every((k) => angleDelta(k.relAngle, relAngle) >= gap);
  }

  addStuck(relAngle: number): void {
    this.stuck.push(new StuckKunai(relAngle));
  }

  draw(ctx: CanvasRenderingContext2D, stuckCount: number): void {
    const cx = LOG_CENTER_X;
    const cy = LOG_CENTER_Y;
    const r = LOG_RADIUS;

    // Stuck kunais first so the wood body overlaps their embedded tips.
    for (const k of this.stuck) {
      const world = k.relAngle + this.rotation;
      const dir = { x: Math.cos(world), y: Math.sin(world) };
      const tipX = cx + dir.x * (r - KUNAI_EMBED);
      const tipY = cy + dir.y * (r - KUNAI_EMBED);
      // Tip points inward (toward the center), so the body sticks outward.
      drawKunai(ctx, tipX, tipY, world + Math.PI, k.enemy);
    }

    ctx.save();
    ctx.translate(cx, cy);

    // Outer bark ring.
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = "#5b3a1e";
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#3f2712";
    ctx.stroke();

    // Wood face with a radial gradient.
    const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r);
    grad.addColorStop(0, "#d9a15c");
    grad.addColorStop(0.65, "#c07f3c");
    grad.addColorStop(1, "#9a5f28");
    ctx.beginPath();
    ctx.arc(0, 0, r - 8, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Growth rings, rotating with the wood for a tactile spin cue.
    ctx.rotate(this.rotation);
    ctx.strokeStyle = "rgba(90, 55, 22, 0.45)";
    ctx.lineWidth = 2;
    for (let i = 1; i <= 4; i++) {
      const rr = (r - 14) * (i / 5) + 6;
      ctx.beginPath();
      ctx.ellipse(2, -2, rr, rr * 0.92, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Stuck count in the (non-rotating) center of the log.
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "bold 46px 'Courier New', Courier, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 6;
    ctx.fillText(String(stuckCount), cx, cy);
    ctx.restore();
  }
}
