/**
 * Plain mutable object written by the flight loop every frame and polled by the
 * HUD via requestAnimationFrame. Keeping this out of React state means the 3D
 * canvas never re-renders just to update a number on screen.
 */
export interface Telemetry {
  elapsed: number; // seconds since the run started
  gatesPassed: number;
  totalGates: number;
  speed: number; // world units / second
  altitude: number;
  /** Index of the next gate to fly through (-1 when course complete). */
  nextGate: number;
}

export const telemetry: Telemetry = {
  elapsed: 0,
  gatesPassed: 0,
  totalGates: 0,
  speed: 0,
  altitude: 0,
  nextGate: 0,
};

export function resetTelemetry(totalGates: number) {
  telemetry.elapsed = 0;
  telemetry.gatesPassed = 0;
  telemetry.totalGates = totalGates;
  telemetry.speed = 0;
  telemetry.altitude = 0;
  telemetry.nextGate = 0;
}
