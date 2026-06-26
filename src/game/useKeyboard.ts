import { useEffect, useRef } from "react";

/** Logical flight controls mapped to physical keys. */
export interface Controls {
  forward: number; // -1 .. 1  (W / S)
  yaw: number; // -1 .. 1  (A / D)  positive = left
  vertical: number; // -1 .. 1  (ArrowUp / ArrowDown)
  strafe: number; // -1 .. 1  (ArrowRight / ArrowLeft)
  boost: boolean; // Shift
  restart: boolean; // R
}

const KEYS = new Set([
  "KeyW", "KeyS", "KeyA", "KeyD", "KeyR",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "ShiftLeft", "ShiftRight", "Space",
]);

/**
 * Returns a ref holding the current control state. Read it inside useFrame —
 * it never triggers React re-renders.
 */
export function useKeyboard() {
  const controls = useRef<Controls>({
    forward: 0, yaw: 0, vertical: 0, strafe: 0, boost: false, restart: false,
  });
  const down = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const sync = () => {
      const d = down.current;
      const c = controls.current;
      c.forward = (d.KeyW ? 1 : 0) - (d.KeyS ? 1 : 0);
      c.yaw = (d.KeyA ? 1 : 0) - (d.KeyD ? 1 : 0);
      c.vertical = (d.ArrowUp ? 1 : 0) - (d.ArrowDown ? 1 : 0) + (d.Space ? 1 : 0);
      c.strafe = (d.ArrowRight ? 1 : 0) - (d.ArrowLeft ? 1 : 0);
      c.boost = !!(d.ShiftLeft || d.ShiftRight);
      c.restart = !!d.KeyR;
    };
    const onDown = (e: KeyboardEvent) => {
      if (!KEYS.has(e.code)) return;
      e.preventDefault();
      down.current[e.code] = true;
      sync();
    };
    const onUp = (e: KeyboardEvent) => {
      if (!KEYS.has(e.code)) return;
      e.preventDefault();
      down.current[e.code] = false;
      sync();
    };
    const onBlur = () => {
      down.current = {};
      sync();
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return controls;
}
