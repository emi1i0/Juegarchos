import { GRID_SIZE, VIEW_WIDTH, VIEW_HEIGHT, type LaneData } from "./constants";
import { Frog } from "./Frog";
import { Obstacle } from "./Obstacle";

export class Renderer {
  private waveOffset = 0;

  public draw(
    ctx: CanvasRenderingContext2D,
    frog: Frog,
    lanes: Map<number, LaneData>,
    cameraY: number,
    dt: number
  ): void {
    // Clear canvas
    ctx.fillStyle = "#0c0e12";
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    // Update wave animations
    this.waveOffset += dt * 30;

    // Save context and apply camera scroll translation
    ctx.save();
    ctx.translate(0, -cameraY);

    // Determine range of visible rows
    // Grid coordinate bounds in visible screen
    const topRow = Math.floor(cameraY / GRID_SIZE) - 1;
    const bottomRow = Math.ceil((cameraY + VIEW_HEIGHT) / GRID_SIZE) + 1;

    // 1. Draw Visible Lane Backgrounds
    for (let r = topRow; r <= bottomRow; r++) {
      const lane = lanes.get(r);
      if (lane) {
        this.drawLaneBackground(ctx, r, lane.type);
      }
    }

    // 2. Draw Visible Lane Obstacles
    for (let r = topRow; r <= bottomRow; r++) {
      const lane = lanes.get(r);
      if (lane) {
        this.drawObstacles(ctx, lane.obstacles);
      }
    }

    // 3. Draw Frog
    this.drawFrog(ctx, frog);

    // Restore context
    ctx.restore();
  }

  private drawLaneBackground(ctx: CanvasRenderingContext2D, row: number, type: "grass" | "road" | "river"): void {
    const y = row * GRID_SIZE;

    if (type === "grass") {
      // Grass Safe Zone (Indigo/Greenish dark palette)
      ctx.fillStyle = "#111b15";
      ctx.fillRect(0, y, VIEW_WIDTH, GRID_SIZE);

      // Neon grid line
      ctx.strokeStyle = "rgba(57, 255, 20, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIEW_WIDTH, y);
      ctx.moveTo(0, y + GRID_SIZE);
      ctx.lineTo(VIEW_WIDTH, y + GRID_SIZE);
      ctx.stroke();
    } else if (type === "road") {
      // Road Lane
      ctx.fillStyle = "#14171d";
      ctx.fillRect(0, y, VIEW_WIDTH, GRID_SIZE);

      // Lane separator
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIEW_WIDTH, y);
      ctx.stroke();
    } else if (type === "river") {
      // River Lane
      ctx.fillStyle = "#091326";
      ctx.fillRect(0, y, VIEW_WIDTH, GRID_SIZE);

      // Neon animated ripples
      ctx.strokeStyle = "rgba(0, 240, 255, 0.07)";
      ctx.lineWidth = 1.5;
      const centerY = y + GRID_SIZE / 2;
      ctx.beginPath();
      for (let x = 0; x < VIEW_WIDTH; x += 10) {
        const waveY = centerY + Math.sin((x + this.waveOffset + row * 100) * 0.04) * 3;
        if (x === 0) ctx.moveTo(x, waveY);
        else ctx.lineTo(x, waveY);
      }
      ctx.stroke();
    }
  }

  private drawObstacles(ctx: CanvasRenderingContext2D, obstacles: Obstacle[]): void {
    obstacles.forEach((obs) => {
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = obs.color;

      if (obs.type === "car") {
        // Draw neon car
        ctx.fillStyle = obs.color;
        this.fillRoundedRect(ctx, obs.x + 2, obs.y + 4, obs.width - 4, obs.height - 8, 6);

        // Headlights
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 6;
        if (obs.dir === 1) {
          ctx.beginPath();
          ctx.arc(obs.x + obs.width - 5, obs.y + 8, 3, 0, Math.PI * 2);
          ctx.arc(obs.x + obs.width - 5, obs.y + obs.height - 8, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(obs.x + 5, obs.y + 8, 3, 0, Math.PI * 2);
          ctx.arc(obs.x + 5, obs.y + obs.height - 8, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (obs.type === "log") {
        // Draw logs
        ctx.fillStyle = "#7b4f23";
        ctx.strokeStyle = "#ff9a00";
        ctx.lineWidth = 1.5;
        this.fillRoundedRect(ctx, obs.x + 1, obs.y + 4, obs.width - 2, obs.height - 8, 4);
        this.strokeRoundedRect(ctx, obs.x + 1, obs.y + 4, obs.width - 2, obs.height - 8, 4);

        // Bark details
        ctx.strokeStyle = "rgba(255, 154, 0, 0.4)";
        ctx.beginPath();
        ctx.moveTo(obs.x + 10, obs.y + obs.height / 2);
        ctx.lineTo(obs.x + obs.width - 10, obs.y + obs.height / 2);
        ctx.stroke();
      } else if (obs.type === "turtle") {
        // Draw turtles
        ctx.fillStyle = "#1b6336";
        ctx.strokeStyle = "#32cd32";
        ctx.lineWidth = 2;

        const turtleCount = Math.floor(obs.width / 30);
        const radius = 12;
        const spacing = obs.width / turtleCount;

        for (let i = 0; i < turtleCount; i++) {
          const cx = obs.x + i * spacing + spacing / 2;
          const cy = obs.y + obs.height / 2 + 2;

          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = "rgba(50, 205, 50, 0.5)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.restore();
    });
  }

  private drawFrog(ctx: CanvasRenderingContext2D, frog: Frog): void {
    if (frog.isDead) {
      const deathProgress = frog.deathTime / frog.maxDeathTime;
      ctx.save();
      ctx.strokeStyle = "rgba(57, 255, 20, " + (1 - deathProgress) + ")";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(frog.x + GRID_SIZE / 2, frog.y + GRID_SIZE / 2, GRID_SIZE * deathProgress * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.beginPath();
      const numLines = 8;
      const center = { x: frog.x + GRID_SIZE / 2, y: frog.y + GRID_SIZE / 2 };
      const startDist = GRID_SIZE * deathProgress * 0.3;
      const endDist = GRID_SIZE * deathProgress * 0.8;
      for (let i = 0; i < numLines; i++) {
        const angle = (i * Math.PI * 2) / numLines;
        ctx.moveTo(center.x + Math.cos(angle) * startDist, center.y + Math.sin(angle) * startDist);
        ctx.lineTo(center.x + Math.cos(angle) * endDist, center.y + Math.sin(angle) * endDist);
      }
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.save();
    
    const hopScale = frog.isJumping ? 1.25 - Math.abs(frog.jumpProgress - 0.5) * 0.5 : 1.0;
    const verticalOffset = frog.isJumping ? Math.sin(frog.jumpProgress * Math.PI) * 10 : 0;

    const cx = frog.x + GRID_SIZE / 2;
    const cy = frog.y + GRID_SIZE / 2 - verticalOffset;

    ctx.translate(cx, cy);
    let rotation = 0;
    switch (frog.facing) {
      case "right": rotation = Math.PI / 2; break;
      case "down": rotation = Math.PI; break;
      case "left": rotation = -Math.PI / 2; break;
      case "up": rotation = 0; break;
    }
    ctx.rotate(rotation);
    ctx.scale(hopScale, hopScale);

    ctx.shadowBlur = 12;
    ctx.shadowColor = "#39ff14";

    // Frog Main Body
    ctx.fillStyle = "#39ff14";
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-5, -6, 3, 0, Math.PI * 2);
    ctx.arc(5, -6, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(-5, -7, 1.2, 0, Math.PI * 2);
    ctx.arc(5, -7, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Limbs
    ctx.fillStyle = "#2ad010";
    ctx.beginPath();
    ctx.arc(-8, 5, 4, 0, Math.PI * 2);
    ctx.arc(8, 5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-8, -4, 3, 0, Math.PI * 2);
    ctx.arc(8, -4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private fillRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }

  private strokeRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.stroke();
  }
}
