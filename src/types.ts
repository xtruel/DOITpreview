/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FrameType = 'true_x' | 'deadcat' | 'toothpick';
export type FlightMode = 'ANGLE' | 'ACRO';

export interface DroneConfig {
  frameType: FrameType;
  ledColor: string; // Hex color code
  rcRate: number; // Pitch/Roll RC Rate
  superRate: number; // Pitch/Roll Super Rate
  expo: number; // Pitch/Roll Expo
  yawRate: number; // Yaw Rate
  flightMode: FlightMode;
  cameraTilt: number; // Degrees tilt, impacts visual angle relative to travel vector
  pilotCallsign: string; // Added Pilot Call-sign
}

export interface Gate {
  id: number;
  x: number;      // Horizontal coordinate
  y: number;      // Vertical coordinate (altitude)
  z: number;      // Depth coordinate (distance along track)
  yaw: number;    // Rotation in radians around vertical axis
  pitch: number;  // Rotation in radians around horizontal axis (tilt)
  size: number;   // Diameter of hoop or width of square
  type: 'hoop' | 'square';
}

export interface LevelTheme {
  primary: string;    // e.g. '#ff6b00'
  secondary: string;  // e.g. '#00e5ff'
  glow: string;       // e.g. 'rgba(0, 229, 255, 0.5)'
  textColor: string;  // Tailwind color class
}

export interface Level {
  id: number;
  name: string;
  subtitle: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  backgroundImage: string;
  description: string;
  gates: Gate[];
  theme: LevelTheme;
  parTimeMs: number;
}

export interface LapRecord {
  levelId: number;
  pilotName: string;
  timeMs: number;
  date: string;
  droneFrame: FrameType;
}

export interface FlightTelemetry {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  pitch: number; // radians
  roll: number;  // radians
  yaw: number;   // radians
  throttle: number; // 0 to 1
  battery: number; // 0 to 100
  currentGate: number;
  lap: number;
  state: 'idle' | 'flying' | 'crashed' | 'finished';
}
