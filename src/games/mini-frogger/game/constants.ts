import { Obstacle } from "./Obstacle";

export const GRID_SIZE = 40;
export const COLS = 13;
export const ROWS = 13;

export const VIEW_WIDTH = COLS * GRID_SIZE; // 520px
export const VIEW_HEIGHT = ROWS * GRID_SIZE; // 520px

export const MAX_DT = 0.1;

export const LIVES_START = 1;

export interface LaneData {
  row: number;
  type: "grass" | "road" | "river";
  speed: number;
  dir: number;
  obstacleType: "car" | "log" | "turtle";
  color: string;
  width: number;
  spacing: number;
  obstacles: Obstacle[];
}
