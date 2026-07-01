/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Gate, Level } from './types';

// Background concept art lives in /public/images and is resolved against the
// Vite base URL so it works in dev (/) and on GitHub Pages (/DOITpreview/).
const IMG = `${import.meta.env.BASE_URL}images/`;

/**
 * Procedurally build a long serpentine course. Gates wind left/right (ampX) and
 * rise/fall (ampY) along Z, alternating hoops and squares with varying size. Each
 * gate is auto-oriented to face the direction of travel so long courses read well.
 * This keeps "longer / more complex worlds" trivial to author and tune.
 */
function serpentineCourse(opts: {
  count: number;
  startZ?: number;
  spacing?: number;
  ampX?: number;
  ampY?: number;
  baseY?: number;
  freqX?: number;
  freqY?: number;
  sizeMin?: number;
  sizeMax?: number;
}): Gate[] {
  const {
    count, startZ = 80, spacing = 85, ampX = 40, ampY = 14,
    baseY = 14, freqX = 0.7, freqY = 1.1, sizeMin = 14, sizeMax = 22,
  } = opts;

  // First pass: positions.
  const pts = Array.from({ length: count }, (_, i) => ({
    x: Math.sin(i * freqX) * ampX,
    y: baseY + Math.sin(i * freqY + 0.5) * ampY,
    z: startZ + i * spacing,
  }));

  return pts.map((pt, i) => {
    const next = pts[i + 1] ?? { x: pt.x, y: pt.y, z: pt.z + spacing };
    const yaw = Math.atan2(next.x - pt.x, next.z - pt.z);
    const pitch = Math.atan2(next.y - pt.y, next.z - pt.z) * 0.5;
    // Deterministic size wobble (no Math.random so courses are stable).
    const t = (Math.sin(i * 1.7) + 1) / 2;
    const size = Math.round(sizeMin + t * (sizeMax - sizeMin));
    return {
      id: i + 1,
      x: Math.round(pt.x * 10) / 10,
      y: Math.round(pt.y * 10) / 10,
      z: pt.z,
      yaw: Math.round(yaw * 100) / 100,
      pitch: Math.round(pitch * 100) / 100,
      size,
      type: i % 3 === 1 ? 'square' : 'hoop',
    };
  });
}

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "Demo · Primo Volo",
    subtitle: "STREET TRAINING GROUND",
    difficulty: "EASY",
    backgroundImage: `${IMG}level1_demo.jpg`,
    description: "Floating in a bright Y2K sky-city, fly along a wide, gentle S-curve of large glowing neon hoops and safety square gates. Welcoming, sunny clouds, and low-speed practice layout.",
    parTimeMs: 25000,
    theme: {
      primary: "#ff6b00", // Electric Orange
      secondary: "#00e5ff", // Cyan
      glow: "rgba(0, 229, 255, 0.6)",
      textColor: "text-[#ff6b00]",
    },
    gates: [
      { id: 1, x: 0, y: 10, z: 80, yaw: 0, pitch: 0, size: 20, type: 'hoop' },
      { id: 2, x: 20, y: 15, z: 160, yaw: 0.1, pitch: 0, size: 20, type: 'square' },
      { id: 3, x: 50, y: 10, z: 240, yaw: 0.3, pitch: 0, size: 20, type: 'hoop' },
      { id: 4, x: 30, y: 5, z: 320, yaw: -0.2, pitch: -0.1, size: 20, type: 'hoop' },
      { id: 5, x: -10, y: 12, z: 400, yaw: -0.4, pitch: 0, size: 22, type: 'square' },
      { id: 6, x: -40, y: 20, z: 480, yaw: -0.1, pitch: 0.1, size: 20, type: 'hoop' },
      { id: 7, x: -20, y: 15, z: 560, yaw: 0.2, pitch: 0, size: 20, type: 'hoop' },
      { id: 8, x: 0, y: 10, z: 640, yaw: 0, pitch: 0, size: 25, type: 'square' },
    ],
  },
  {
    id: 2,
    name: "Slalom Rush",
    subtitle: "NEON WALKWAY INTERCEPT",
    difficulty: "MEDIUM",
    backgroundImage: `${IMG}level2_slalom.jpg`,
    description: "A tight slalom course winding through cybernetic grid-structures and walkways. Gates alternate left and right in a rhythmic zig-zag with neon magenta and cyan lighting.",
    parTimeMs: 35000,
    theme: {
      primary: "#ff2e93", // Hot Magenta
      secondary: "#00e5ff", // Cyan
      glow: "rgba(255, 46, 147, 0.6)",
      textColor: "text-[#ff2e93]",
    },
    gates: [
      { id: 1, x: 0, y: 15, z: 70, yaw: 0, pitch: 0, size: 16, type: 'hoop' },
      { id: 2, x: -25, y: 10, z: 140, yaw: -0.4, pitch: 0.1, size: 16, type: 'square' },
      { id: 3, x: 25, y: 20, z: 210, yaw: 0.4, pitch: -0.1, size: 16, type: 'hoop' },
      { id: 4, x: -30, y: 12, z: 280, yaw: -0.5, pitch: 0, size: 16, type: 'square' },
      { id: 5, x: 30, y: 8, z: 350, yaw: 0.5, pitch: 0.2, size: 16, type: 'hoop' },
      { id: 6, x: -15, y: 18, z: 420, yaw: -0.3, pitch: -0.1, size: 16, type: 'square' },
      { id: 7, x: 20, y: 12, z: 490, yaw: 0.4, pitch: 0, size: 16, type: 'hoop' },
      { id: 8, x: 0, y: 15, z: 560, yaw: 0, pitch: 0, size: 18, type: 'hoop' },
    ],
  },
  {
    id: 3,
    name: "Pro · Acro Canyon",
    subtitle: "VERTICAL MEGAPLEX DROP",
    difficulty: "HARD",
    backgroundImage: `${IMG}level3_acro.jpg`,
    description: "The ultimate challenge. Extreme drops and vertical climbs inside a tight canyon bordered by massive graffiti structures. Speed, timing, and pitch agility are critical.",
    parTimeMs: 45000,
    theme: {
      primary: "#b6ff00", // Lime Green
      secondary: "#ff2e93", // Hot Magenta
      glow: "rgba(182, 255, 0, 0.6)",
      textColor: "text-[#b6ff00]",
    },
    gates: [
      { id: 1, x: 0, y: 20, z: 80, yaw: 0, pitch: -0.2, size: 14, type: 'hoop' },
      { id: 2, x: 10, y: -10, z: 160, yaw: 0.2, pitch: 0.4, size: 14, type: 'hoop' }, // steep drop
      { id: 3, x: -20, y: -25, z: 240, yaw: -0.4, pitch: -0.3, size: 14, type: 'square' },
      { id: 4, x: -5, y: 15, z: 310, yaw: 0.1, pitch: -0.5, size: 12, type: 'hoop' }, // sharp climb
      { id: 5, x: 30, y: 45, z: 380, yaw: 0.5, pitch: 0, size: 14, type: 'hoop' },
      { id: 6, x: -10, y: 20, z: 450, yaw: -0.3, pitch: 0.3, size: 12, type: 'square' },
      { id: 7, x: 0, y: -5, z: 520, yaw: 0.1, pitch: -0.1, size: 14, type: 'hoop' },
      { id: 8, x: 0, y: 10, z: 600, yaw: 0, pitch: 0, size: 16, type: 'hoop' },
    ],
  },
  {
    id: 4,
    name: "Neon Skyline",
    subtitle: "ROOFTOP EXPRESS",
    difficulty: "MEDIUM",
    backgroundImage: `${IMG}world_arena.jpg`,
    description: "A long flowing cruise across the floating Y2K skyline. Wide sweeping S-curves over the rooftops — keep your speed lines clean across the longest run yet.",
    parTimeMs: 52000,
    theme: {
      primary: "#00e5ff", // Cyan
      secondary: "#b6ff00", // Lime
      glow: "rgba(0, 229, 255, 0.6)",
      textColor: "text-[#00e5ff]",
    },
    gates: serpentineCourse({ count: 14, startZ: 80, spacing: 95, ampX: 52, ampY: 16, baseY: 18, freqX: 0.6, freqY: 1.0, sizeMin: 15, sizeMax: 22 }),
  },
  {
    id: 5,
    name: "Megaplex Mile",
    subtitle: "ENDLESS GRAFFITI RUN",
    difficulty: "HARD",
    backgroundImage: `${IMG}intro_screen.jpg`,
    description: "The marathon. A serpentine megacourse weaving deep through the city with big vertical swings and tight gates. Stamina, precision and battery management decide it.",
    parTimeMs: 78000,
    theme: {
      primary: "#ff2e93", // Hot Magenta
      secondary: "#00e5ff", // Cyan
      glow: "rgba(255, 46, 147, 0.6)",
      textColor: "text-[#ff2e93]",
    },
    gates: serpentineCourse({ count: 18, startZ: 90, spacing: 100, ampX: 62, ampY: 28, baseY: 24, freqX: 0.5, freqY: 0.85, sizeMin: 12, sizeMax: 18 }),
  }
];
