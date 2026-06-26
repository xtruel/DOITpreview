export type GateType = "ring" | "square";
export type GateSize = "small" | "medium" | "large";

export interface GateDef {
  /** World position of the gate centre. */
  position: [number, number, number];
  /** Rotation around Y (radians) — orients the opening the drone flies through. */
  rotationY: number;
  type: GateType;
  size: GateSize;
}

export interface LevelDef {
  id: string;
  name: string;
  description: string;
  /** Hint colour used in menus. */
  accent: string;
  /** Where the drone spawns. */
  spawn: [number, number, number];
  /** Initial heading (radians). */
  spawnYaw: number;
  gates: GateDef[];
}

export type GameStatus = "menu" | "countdown" | "playing" | "finished";

/** Inner radius (the hole you fly through) for each size, in world units. */
export const SIZE_RADIUS: Record<GateSize, number> = {
  small: 1.4,
  medium: 2.4,
  large: 3.6,
};
