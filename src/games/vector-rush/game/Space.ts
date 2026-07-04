import * as THREE from "three";
import { getDotTexture } from "./dotTexture";
import {
  CAMERA_Z,
  FIELD_HALF_HEIGHT,
  FIELD_HALF_WIDTH,
  FOG_FAR,
  STAR_COUNT,
} from "./constants";

const STAR_DEPTH = FOG_FAR * 0.95;
const STAR_WRAP = STAR_DEPTH + CAMERA_Z + 10;

const RING_COUNT = 16;
const RING_SPACING = 20;
const RING_SPAN = RING_COUNT * RING_SPACING;


/**
 * Smooth Saturn-like latitudinal banding: creamy golds blended along the
 * sphere's latitude with a few band frequencies + faint noise (bands run
 * horizontally so they wrap around the globe).
 */
function makeSaturnTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  
  // Base golden background
  ctx.fillStyle = "#caa96e";
  ctx.fillRect(0, 0, w, h);
  
  // Create beautiful latitudinal bands using a detailed gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  
  // North polar region (bluish-grey cap)
  gradient.addColorStop(0.0, "rgb(75,85,95)");
  gradient.addColorStop(0.1, "rgb(115,120,115)");
  
  // Northern bands (tan, gold, brown stripes)
  gradient.addColorStop(0.2, "rgb(160,135,100)");
  gradient.addColorStop(0.3, "rgb(202,169,110)");
  gradient.addColorStop(0.38, "rgb(150,120,85)");
  gradient.addColorStop(0.42, "rgb(233,220,188)"); // thin bright zone
  gradient.addColorStop(0.45, "rgb(180,150,115)");
  
  // Equatorial Zone (bright creamy gold, very wide)
  gradient.addColorStop(0.50, "rgb(240,225,190)");
  gradient.addColorStop(0.55, "rgb(245,230,200)");
  gradient.addColorStop(0.60, "rgb(230,210,170)");
  
  // Southern bands
  gradient.addColorStop(0.66, "rgb(175,145,110)");
  gradient.addColorStop(0.72, "rgb(202,169,110)");
  gradient.addColorStop(0.80, "rgb(140,110,80)");
  gradient.addColorStop(0.90, "rgb(115,120,115)");
  
  // South polar region (bluish-grey cap)
  gradient.addColorStop(1.0, "rgb(75,85,95)");
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  
  // Add fine horizontal lines (micro-banding) for extreme realism
  const numMicroBands = 80;
  for (let i = 0; i < numMicroBands; i++) {
    const y = Math.random() * h;
    const height = 1 + Math.random() * 4;
    const alpha = 0.02 + Math.random() * 0.08;
    ctx.fillStyle = Math.random() < 0.5 ? `rgba(255, 255, 255, ${alpha})` : `rgba(50, 30, 10, ${alpha})`;
    ctx.fillRect(0, y, w, height);
  }
  
  // Add horizontal wind shear waves / atmospheric turbulence
  const numWaves = 10;
  for (let k = 0; k < numWaves; k++) {
    const yCenter = 50 + Math.random() * (h - 100);
    const waveAmp = 1 + Math.random() * 3;
    const waveFreq = 4 + Math.random() * 8;
    const alpha = 0.03 + Math.random() * 0.06;
    
    ctx.fillStyle = Math.random() < 0.5 ? `rgba(255, 245, 220, ${alpha})` : `rgba(70, 50, 30, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(0, yCenter);
    for (let x = 0; x <= w; x += 10) {
      const y = yCenter + Math.sin((x / w) * waveFreq * Math.PI * 2) * waveAmp;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, yCenter + 20);
    ctx.lineTo(0, yCenter + 20);
    ctx.closePath();
    ctx.fill();
  }
  
  // Draw faint white storm oval spots in the temperate zones
  const numStorms = 3;
  for (let s = 0; s < numStorms; s++) {
    const sx = Math.random() * w;
    const sy = Math.random() < 0.5 ? 150 + Math.random() * 50 : 350 + Math.random() * 50;
    const rx = 10 + Math.random() * 15;
    const ry = 4 + Math.random() * 6;
    const alpha = 0.05 + Math.random() * 0.1;
    
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Storm trailing tail
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
    ctx.beginPath();
    ctx.ellipse(sx + rx * 1.5, sy, rx * 1.2, ry * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/** A cratered, mottled grey moon texture. */
function makeMoonTexture(): THREE.CanvasTexture {
  const s = 128;
  const canvas = document.createElement("canvas");
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#b8b3a4";
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 90; i++) {
    const r = 1 + Math.random() * 6;
    const shade = 140 + Math.floor(Math.random() * 70);
    ctx.fillStyle = `rgba(${shade - 40},${shade - 42},${shade - 55},0.5)`;
    ctx.beginPath();
    ctx.arc(Math.random() * s, Math.random() * s, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** A realistic radial texture for Saturn's rings with fine divisions and Cassini gap. */
function makeRingTexture(innerRatio: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  
  const cx = size / 2;
  const cy = size / 2;
  
  // Calculate pixel radii based on inner / outer ratio
  const rInner = (size / 2) * innerRatio;
  const rOuter = size / 2;
  
  // Create a high-fidelity radial gradient matching Saturn's rings profile
  const grad = ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
  
  // C Ring (0.0 to 0.25): Translucent, tan/amber dust
  grad.addColorStop(0.0, "rgba(50, 40, 30, 0.0)");
  grad.addColorStop(0.05, "rgba(90, 75, 55, 0.15)");
  grad.addColorStop(0.15, "rgba(110, 95, 75, 0.25)");
  grad.addColorStop(0.23, "rgba(80, 65, 50, 0.15)");
  grad.addColorStop(0.25, "rgba(40, 30, 20, 0.05)");
  
  // B Ring (0.25 to 0.65): Brightest, creamy gold/white ice
  grad.addColorStop(0.26, "rgba(160, 135, 100, 0.6)");
  grad.addColorStop(0.30, "rgba(220, 195, 160, 0.85)");
  grad.addColorStop(0.40, "rgba(240, 215, 180, 0.95)");
  grad.addColorStop(0.50, "rgba(215, 190, 155, 0.9)");
  grad.addColorStop(0.58, "rgba(235, 210, 175, 0.95)");
  grad.addColorStop(0.64, "rgba(180, 155, 120, 0.7)");
  grad.addColorStop(0.65, "rgba(80, 65, 50, 0.2)");
  
  // Cassini Division (0.65 to 0.70): Dark gap
  grad.addColorStop(0.655, "rgba(20, 15, 10, 0.03)");
  grad.addColorStop(0.68, "rgba(10, 8, 5, 0.01)");
  grad.addColorStop(0.695, "rgba(20, 15, 10, 0.03)");
  
  // A Ring (0.70 to 0.95): Semi-bright, textured tan
  grad.addColorStop(0.70, "rgba(120, 100, 80, 0.4)");
  grad.addColorStop(0.74, "rgba(195, 170, 135, 0.7)");
  grad.addColorStop(0.82, "rgba(175, 150, 120, 0.65)");
  grad.addColorStop(0.88, "rgba(185, 160, 130, 0.7)");
  
  // Encke Gap (0.90 to 0.92)
  grad.addColorStop(0.90, "rgba(130, 110, 85, 0.5)");
  grad.addColorStop(0.908, "rgba(30, 25, 20, 0.04)");
  grad.addColorStop(0.916, "rgba(30, 25, 20, 0.04)");
  grad.addColorStop(0.924, "rgba(140, 120, 95, 0.6)");
  
  // Outer edge fading
  grad.addColorStop(0.95, "rgba(165, 140, 110, 0.6)");
  grad.addColorStop(0.98, "rgba(80, 65, 50, 0.15)");
  grad.addColorStop(1.0, "rgba(40, 30, 20, 0.0)");
  
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw concentric micro-bands for extra realism (fine texture)
  ctx.shadowBlur = 0;
  const fineLines = [0.1, 0.18, 0.32, 0.35, 0.44, 0.47, 0.53, 0.56, 0.62, 0.72, 0.77, 0.85, 0.94];
  for (const t of fineLines) {
    const r = rInner + (rOuter - rInner) * t;
    const alpha = 0.05 + Math.random() * 0.12;
    ctx.strokeStyle = Math.random() < 0.6 ? `rgba(255, 245, 230, ${alpha})` : `rgba(30, 22, 15, ${alpha})`;
    ctx.lineWidth = 0.5 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * The space backdrop: a deep parallax starfield, scrolling rectangular
 * "corridor" outlines that mark the flight-lane cross-section, and a huge,
 * close ringed Saturn (only partly in frame, its banded rings sweeping across)
 * plus a distant moon. The vista stays put (very far away) while stars scroll.
 */
export class Space {
  readonly group: THREE.Group;

  private readonly stars: THREE.Points;
  private readonly starPositions: Float32Array;
  private readonly rings: THREE.LineLoop[] = [];

  constructor() {
    this.group = new THREE.Group();

    // --- Starfield ---
    this.starPositions = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      this.starPositions[i * 3] = (Math.random() * 2 - 1) * FIELD_HALF_WIDTH * 3.2;
      this.starPositions[i * 3 + 1] = (Math.random() * 2 - 1) * FIELD_HALF_HEIGHT * 3.2;
      this.starPositions[i * 3 + 2] = CAMERA_Z - Math.random() * STAR_DEPTH;
    }
    const starGeom = new THREE.BufferGeometry();
    starGeom.setAttribute("position", new THREE.BufferAttribute(this.starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xbcd4ff,
      map: getDotTexture(),
      size: 0.42,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      fog: true,
    });
    this.stars = new THREE.Points(starGeom, starMat);
    this.group.add(this.stars);

    // --- Corridor rings (rectangular outlines scrolling toward the camera) ---
    const w = FIELD_HALF_WIDTH;
    const h = FIELD_HALF_HEIGHT;
    const ringGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-w, -h, 0),
      new THREE.Vector3(w, -h, 0),
      new THREE.Vector3(w, h, 0),
      new THREE.Vector3(-w, h, 0),
    ]);
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x2f6f9e,
      transparent: true,
      opacity: 0.4,
      fog: true,
    });
    for (let i = 0; i < RING_COUNT; i++) {
      const ring = new THREE.LineLoop(ringGeom, ringMat);
      ring.position.z = CAMERA_Z - i * RING_SPACING;
      this.rings.push(ring);
      this.group.add(ring);
    }

    this.buildVista();
  }

  /** A huge close Saturn (partly in frame) with banded rings + a distant moon. */
  private buildVista(): void {
    const R = 200;
    const saturn = new THREE.Group();
    // Position Saturn closer and further to the right/top so only the left limb is visible
    saturn.position.set(220, -130, -100);
    // Adjust rotation so the rings sweep diagonally across the screen
    saturn.rotation.set(2.15, -0.3, 0);

    // --- Globe: lit banded sphere (directional light gives the terminator). ---
    const globeMat = new THREE.MeshStandardMaterial({
      map: makeSaturnTexture(),
      roughness: 0.85, // soft gas sheen
      metalness: 0.05,
      emissive: 0x0c0906,
      emissiveIntensity: 0.9,
      fog: false,
    });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 64), globeMat);
    saturn.add(globe);

    // --- Thin atmosphere rim (back-side additive shell glows at the limb). ---
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0xffe8bd, // warm golden glowing atmospheric rim
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.03, 48, 48), atmoMat);
    saturn.add(atmo);

    // --- Ring system: realistic custom canvas radial texture.
    // Rings depth-test against the opaque globe, so the far arc is hidden behind
    // the planet — the natural "shadow"/occlusion of the reference photo. ---
    const inner = R * 1.8;
    const outer = R * 3;
    
    const ringTex = makeRingTexture(inner / outer);
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTex,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false,
    });
    const ringGeom = new THREE.RingGeometry(inner, outer, 160);
    const ring = new THREE.Mesh(ringGeom, ringMat);
    saturn.add(ring);

    this.group.add(saturn);

    // --- A small cratered moon far off to the upper-left, like the reference. ---
    const moonMat = new THREE.MeshStandardMaterial({
      map: makeMoonTexture(),
      roughness: 1,
      metalness: 0,
      emissive: 0x060606,
      emissiveIntensity: 1,
      fog: false,
    });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(6, 40, 40), moonMat);
    moon.position.set(-40, 22, -170);
    this.group.add(moon);
  }

  /** Scrolls stars and corridor rings toward the camera to convey motion. */
  scroll(distance: number): void {
    // Stars move at full speed; wrap them back to the far end.
    for (let i = 0; i < STAR_COUNT; i++) {
      let z = this.starPositions[i * 3 + 2] + distance;
      if (z > CAMERA_Z + 5) z -= STAR_WRAP;
      this.starPositions[i * 3 + 2] = z;
    }
    (this.stars.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    for (const ring of this.rings) {
      ring.position.z += distance;
      if (ring.position.z > CAMERA_Z + 4) ring.position.z -= RING_SPAN;
    }
  }
}
