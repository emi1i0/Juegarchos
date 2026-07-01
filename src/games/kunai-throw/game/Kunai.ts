import { KUNAI_LENGTH, KUNAI_WIDTH } from "./constants";

/**
 * Draws a kunai with its tip at (tipX, tipY). `pointAngle` is the direction the
 * tip points to (world radians, y-down); the blade and handle extend backwards
 * from the tip along the opposite direction. `enemy` tints obstacle kunais.
 */
export function drawKunai(
  ctx: CanvasRenderingContext2D,
  tipX: number,
  tipY: number,
  pointAngle: number,
  enemy = false
): void {
  const w = KUNAI_WIDTH;
  const bladeLen = KUNAI_LENGTH * 0.42;
  const handleLen = KUNAI_LENGTH * 0.44;
  const ringR = w * 0.55;

  ctx.save();
  ctx.translate(tipX, tipY);
  // Rotate so the body extends along local -x (behind the tip at the origin).
  ctx.rotate(pointAngle + Math.PI);

  // Blade (steel diamond) with a subtle metallic gradient.
  const grad = ctx.createLinearGradient(0, -w / 2, 0, w / 2);
  if (enemy) {
    grad.addColorStop(0, "#ffe08a");
    grad.addColorStop(0.5, "#f5a623");
    grad.addColorStop(1, "#b26a00");
  } else {
    grad.addColorStop(0, "#f5f9ff");
    grad.addColorStop(0.5, "#c2ccdb");
    grad.addColorStop(1, "#7d8798");
  }
  ctx.fillStyle = grad;
  ctx.strokeStyle = enemy ? "rgba(120,70,0,0.6)" : "rgba(40,50,65,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0); // tip
  ctx.lineTo(bladeLen * 0.55, -w / 2);
  ctx.lineTo(bladeLen, 0);
  ctx.lineTo(bladeLen * 0.55, w / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Handle (dark wrapped grip).
  ctx.fillStyle = enemy ? "#5a3a10" : "#20242c";
  const hStart = bladeLen;
  const hEnd = bladeLen + handleLen;
  ctx.fillRect(hStart, -w * 0.3, handleLen, w * 0.6);

  // Grip wrapping details.
  ctx.strokeStyle = enemy ? "rgba(255,220,140,0.35)" : "rgba(180,190,205,0.3)";
  ctx.lineWidth = 1.5;
  const wraps = 4;
  for (let i = 1; i <= wraps; i++) {
    const x = hStart + (handleLen * i) / (wraps + 1);
    ctx.beginPath();
    ctx.moveTo(x, -w * 0.3);
    ctx.lineTo(x, w * 0.3);
    ctx.stroke();
  }

  // Ring (pommel) at the very end.
  ctx.strokeStyle = enemy ? "#8a5a12" : "#3a4150";
  ctx.lineWidth = w * 0.28;
  ctx.beginPath();
  ctx.arc(hEnd + ringR, 0, ringR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/** A kunai embedded in the log at a fixed angle relative to the wood. */
export class StuckKunai {
  /** Angle of the kunai relative to the log's own rotation (radians). */
  readonly relAngle: number;
  /** Obstacle kunais that are pre-placed at the start of a level. */
  readonly enemy: boolean;

  constructor(relAngle: number, enemy = false) {
    this.relAngle = relAngle;
    this.enemy = enemy;
  }
}
