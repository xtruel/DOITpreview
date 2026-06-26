import type { GateDef, GateSize, GateType, LevelDef } from "./types";

/**
 * Build a gate along a path. `heading` is the direction of travel (radians);
 * the gate opening is oriented perpendicular to it automatically.
 */
function gate(
  position: [number, number, number],
  heading: number,
  type: GateType,
  size: GateSize,
): GateDef {
  return { position, rotationY: heading, type, size };
}

/** Demo — a gentle, forgiving intro course to learn the controls. */
const demo: LevelDef = {
  id: "demo",
  name: "Demo · Primo Volo",
  description: "Percorso ampio e morbido per prendere confidenza con i comandi.",
  accent: "#5eead4",
  spawn: [0, 4, 12],
  spawnYaw: Math.PI, // facing -Z
  gates: [
    gate([0, 4, 4], Math.PI, "ring", "large"),
    gate([0, 5, -6], Math.PI, "ring", "large"),
    gate([-4, 5, -16], Math.PI * 0.85, "square", "large"),
    gate([-10, 6, -26], Math.PI * 0.7, "ring", "medium"),
    gate([-4, 7, -36], Math.PI * 0.55, "ring", "medium"),
    gate([6, 7, -44], Math.PI * 0.4, "square", "large"),
    gate([14, 6, -52], Math.PI * 0.5, "ring", "large"),
  ],
};

/** Slalom — tighter, alternating left/right with mixed sizes. */
const slalom: LevelDef = {
  id: "slalom",
  name: "Slalom",
  description: "Curve strette alternate e gate medi: ritmo e precisione.",
  accent: "#a78bfa",
  spawn: [0, 4, 14],
  spawnYaw: Math.PI,
  gates: [
    gate([0, 4, 6], Math.PI, "ring", "medium"),
    gate([4, 5, -2], Math.PI * 0.9, "square", "medium"),
    gate([-4, 5, -10], Math.PI * 1.1, "ring", "medium"),
    gate([5, 6, -18], Math.PI * 0.85, "ring", "small"),
    gate([-5, 6, -26], Math.PI * 1.15, "square", "medium"),
    gate([4, 8, -34], Math.PI * 0.9, "ring", "small"),
    gate([-3, 9, -42], Math.PI * 1.1, "ring", "medium"),
    gate([0, 7, -50], Math.PI, "square", "large"),
  ],
};

/** Pro — vertical changes, small rings, the real test. */
const pro: LevelDef = {
  id: "pro",
  name: "Pro · Acro",
  description: "Cambi di quota, anelli piccoli e gate ravvicinati. Solo per esperti.",
  accent: "#fb7185",
  spawn: [0, 6, 16],
  spawnYaw: Math.PI,
  gates: [
    gate([0, 6, 8], Math.PI, "ring", "small"),
    gate([6, 9, 0], Math.PI * 0.8, "square", "small"),
    gate([-6, 4, -8], Math.PI * 1.2, "ring", "small"),
    gate([8, 11, -16], Math.PI * 0.75, "ring", "small"),
    gate([-8, 5, -24], Math.PI * 1.25, "square", "medium"),
    gate([2, 13, -32], Math.PI * 0.95, "ring", "small"),
    gate([-2, 6, -40], Math.PI * 1.05, "ring", "small"),
    gate([6, 10, -48], Math.PI * 0.85, "square", "small"),
    gate([0, 8, -56], Math.PI, "ring", "medium"),
  ],
};

export const LEVELS: LevelDef[] = [demo, slalom, pro];

export function getLevel(id: string): LevelDef {
  return LEVELS.find((l) => l.id === id) ?? demo;
}
