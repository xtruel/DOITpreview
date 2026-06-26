import { useSyncExternalStore } from "react";
import type { GameStatus } from "./types";

/**
 * Tiny reactive store for low-frequency game state (status, results, best times).
 * High-frequency telemetry (timer, speed) lives in telemetry.ts to avoid
 * re-rendering React on every animation frame.
 */
interface GameState {
  status: GameStatus;
  levelId: string;
  /** Time (seconds) of the last completed run. */
  lastTime: number | null;
  /** Best time per level id, persisted to localStorage. */
  bestTimes: Record<string, number>;
}

const BEST_KEY = "dronedoit_best_v1";

function loadBest(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) ?? "{}");
  } catch {
    return {};
  }
}

let state: GameState = {
  status: "menu",
  levelId: "demo",
  lastTime: null,
  bestTimes: loadBest(),
};

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export const gameStore = {
  get: () => state,
  set(patch: Partial<GameState>) {
    state = { ...state, ...patch };
    emit();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Record a finished run; updates best time if improved. */
  finish(levelId: string, time: number) {
    const prev = state.bestTimes[levelId];
    const bestTimes = { ...state.bestTimes };
    if (prev === undefined || time < prev) {
      bestTimes[levelId] = time;
      try {
        localStorage.setItem(BEST_KEY, JSON.stringify(bestTimes));
      } catch {
        /* ignore quota / private mode */
      }
    }
    state = { ...state, status: "finished", lastTime: time, bestTimes };
    emit();
  },
};

export function useGameStore<T>(selector: (s: GameState) => T): T {
  return useSyncExternalStore(
    gameStore.subscribe,
    () => selector(state),
    () => selector(state),
  );
}
