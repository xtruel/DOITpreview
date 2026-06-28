/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Level } from './types';

// Background concept art lives in /public/images and is resolved against the
// Vite base URL so it works in dev (/) and on GitHub Pages (/DOITpreview/).
const IMG = `${import.meta.env.BASE_URL}images/`;

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
  }
];
