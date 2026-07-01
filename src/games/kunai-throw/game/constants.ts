export const BEST_KEY = "kunai-throw:best";

// Fixed logical resolution the canvas renders at (scaled to fit the viewport).
export const VIEW_WIDTH = 480;
export const VIEW_HEIGHT = 760;

export const MAX_DT = 0.05; // clamp large frame gaps (tab switches) to avoid tunneling

// The rotating log (tronco) sits in the upper half of the screen.
export const LOG_CENTER_X = VIEW_WIDTH / 2;
export const LOG_CENTER_Y = 250;
export const LOG_RADIUS = 108;

// Kunai geometry (tip at origin, body extends backwards along its pointing axis).
export const KUNAI_LENGTH = 120; // blade + handle + ring, in pixels
export const KUNAI_WIDTH = 16;
export const KUNAI_EMBED = 18; // how deep the tip sinks into the wood when stuck

// A kunai is launched from the bottom and travels up until its tip reaches the log.
export const KUNAI_SPEED = 2200; // pixels per second while in flight
export const KUNAI_READY_TIP_Y = VIEW_HEIGHT - 150; // resting tip position of the ready kunai

// The log's bottom point (where a launched kunai makes contact). In canvas
// coordinates (y grows downward) straight down is +PI/2.
export const IMPACT_ANGLE = Math.PI / 2;

// Minimum angular gap (radians) between two stuck kunais. Landing closer than
// this to an existing kunai counts as a collision and ends the run.
export const COLLISION_ANGLE = 0.2;

// How many kunais must be stuck to clear a level (grows with the level).
export const KUNAIS_BASE = 6;

export const COUNTDOWN_LABELS = ["3", "2", "1", "YA"];
export const COUNTDOWN_STEP = 0.7; // seconds per countdown step

export const SOUND_VOLUME = 0.18;
