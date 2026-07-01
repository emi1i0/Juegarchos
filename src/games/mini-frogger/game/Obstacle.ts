import { GRID_SIZE, VIEW_WIDTH } from "./constants";

export class Obstacle {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public speed: number;
  public dir: number; // 1 = right, -1 = left
  public type: "car" | "log" | "turtle";
  public color: string;
  public laneIndex: number;

  constructor(
    x: number,
    laneIndex: number,
    width: number,
    speed: number,
    dir: number,
    type: "car" | "log" | "turtle",
    color: string = "#ffffff"
  ) {
    this.x = x;
    this.laneIndex = laneIndex;
    this.y = laneIndex * GRID_SIZE;
    this.width = width;
    this.height = GRID_SIZE - 4; // slight vertical padding
    this.speed = speed;
    this.dir = dir;
    this.type = type;
    this.color = color;
  }

  public update(dt: number): void {
    // Move obstacle
    this.x += this.speed * this.dir * dt;

    // Wrap around screen
    if (this.dir === 1 && this.x > VIEW_WIDTH) {
      this.x = -this.width;
    } else if (this.dir === -1 && this.x < -this.width) {
      this.x = VIEW_WIDTH;
    }
  }

  public collidesWith(px: number, py: number, pSize: number): boolean {
    // Aabb collision check
    return (
      px < this.x + this.width &&
      px + pSize > this.x &&
      py < this.y + this.height &&
      py + pSize > this.y
    );
  }
}
