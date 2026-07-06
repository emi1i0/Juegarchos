// Square play field, letterboxed to the window.
export const VIEW_WIDTH = 600;
export const VIEW_HEIGHT = 600;

// Ring geometry (centered in the view).
export const RING_RADIUS = 205;
export const RING_WIDTH = 32;
// The marker is a thin radial bar ("|") crossing the ring, not a dot.
export const MARKER_THICKNESS = 5;
export const MARKER_OVERHANG = 7;

// Marker orbit speed (radians/second) and how it ramps with each hit.
export const BASE_ANGULAR_SPEED = 1.9;
export const ANGULAR_SPEED_INCREMENT = 0.2;
export const MAX_ANGULAR_SPEED = 7.6;

// Target arc half-width (radians). The full arc is twice this; it shrinks per hit.
export const BASE_TARGET_HALF = 0.55;
export const TARGET_HALF_SHRINK = 0.014;
export const MIN_TARGET_HALF = 0.16;

// When relocating the target, place its center this far ahead of the marker
// (in the travel direction) so there is always some chase distance.
export const RELOCATE_MIN_AHEAD = Math.PI * 0.45;
export const RELOCATE_MAX_AHEAD = Math.PI * 1.55;
// Chance the marker reverses direction on a successful hit.
export const REVERSE_CHANCE = 0.3;

export const MAX_DT = 0.032;

export const COUNTDOWN_LABELS = ["3", "2", "1", "YA"];
export const COUNTDOWN_STEP = 0.75;

export const BEST_KEY = "ring-runner:best";
