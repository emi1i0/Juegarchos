import { GRID_SIZE, COLS, VIEW_WIDTH } from "./constants";

export class Frog {
  public gridX = 0;
  public gridY = 0;
  
  // Pixel coordinates for rendering and smooth interpolation
  public x = 0;
  public y = 0;
  public targetX = 0;
  public targetY = 0;

  // Jump animation
  public isJumping = false;
  public jumpProgress = 0; // 0 to 1
  public facing: "up" | "down" | "left" | "right" = "up";

  // Death state
  public isDead = false;
  public deathTime = 0; // Duration of death animation
  public maxDeathTime = 0.5; // 0.5 seconds

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.gridX = Math.floor(COLS / 2);
    this.gridY = 0;
    
    this.targetX = this.gridX * GRID_SIZE;
    this.targetY = this.gridY * GRID_SIZE;
    this.x = this.targetX;
    this.y = this.targetY;
    
    this.isJumping = false;
    this.jumpProgress = 0;
    this.facing = "up";
    this.isDead = false;
    this.deathTime = 0;
  }

  public move(dx: number, dy: number): void {
    if (this.isDead) return;

    // Determine direction
    if (dx > 0) this.facing = "right";
    else if (dx < 0) this.facing = "left";
    else if (dy > 0) this.facing = "down";
    else if (dy < 0) this.facing = "up";

    // Update target grid coordinates with bounding checks
    const nextGridX = Math.max(0, Math.min(COLS - 1, this.gridX + dx));
    const nextGridY = Math.min(0, this.gridY + dy);

    if (nextGridX !== this.gridX || nextGridY !== this.gridY) {
      this.gridX = nextGridX;
      this.gridY = nextGridY;
      
      // Snap target positions to new grid slot
      this.targetX = this.gridX * GRID_SIZE;
      this.targetY = this.gridY * GRID_SIZE;
      
      this.isJumping = true;
      this.jumpProgress = 0;
    }
  }

  public update(dt: number, currentLogSpeed: number = 0): void {
    if (this.isDead) {
      this.deathTime += dt;
      return;
    }

    // If on a log/turtle, float with it
    if (currentLogSpeed !== 0) {
      this.x += currentLogSpeed * dt;
      this.targetX += currentLogSpeed * dt;
      
      // Keep logical grid coordinate updated with continuous pixel position
      this.gridX = Math.round(this.x / GRID_SIZE);
      
      // Check if floated off screen
      if (this.x < -GRID_SIZE / 2 || this.x > VIEW_WIDTH - GRID_SIZE / 2) {
        this.die();
        return;
      }
    }

    // Interpolate position for smooth rendering
    const lerpSpeed = 16; // Speed of movement interpolation
    
    // If jumping, interpolate jump progress
    if (this.isJumping) {
      this.jumpProgress += dt * 8; // Adjust speed of hop
      if (this.jumpProgress >= 1) {
        this.isJumping = false;
        this.jumpProgress = 0;
      }
    }

    this.x += (this.targetX - this.x) * lerpSpeed * dt;
    this.y += (this.targetY - this.y) * lerpSpeed * dt;
  }

  public die(): void {
    if (this.isDead) return;
    this.isDead = true;
    this.deathTime = 0;
  }

  /**
   * Snaps the frog's horizontal target position to the nearest grid column.
   * Useful when jumping off a moving log/turtle to land on a fixed tile or another lane.
   */
  public snapToGrid(): void {
    this.gridX = Math.max(0, Math.min(COLS - 1, Math.round(this.x / GRID_SIZE)));
    this.targetX = this.gridX * GRID_SIZE;
  }
}
