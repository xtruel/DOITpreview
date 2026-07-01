/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Platform services abstraction.
 *
 * droneDoIT ships to two targets from ONE codebase:
 *   - web   → GitHub Pages / itch.io (preview / demo), saves in localStorage
 *   - steam → desktop wrapper (Electron/Tauri) with Steamworks: real achievements,
 *             leaderboards and cloud saves
 *
 * Game code never talks to localStorage or Steamworks directly — it goes through
 * this `platform` singleton. Swapping the implementation is the ONLY seam needed
 * to light up Steam features later. The web implementation below is byte-for-byte
 * equivalent to the previous direct localStorage usage, so behaviour is unchanged.
 */

export type PlatformName = 'web' | 'steam';

export interface PlatformStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  getJSON<T>(key: string, fallback: T): T;
  setJSON(key: string, value: unknown): void;
}

export interface PlatformServices {
  readonly name: PlatformName;
  readonly isSteam: boolean;
  readonly storage: PlatformStorage;
  /** Unlock an achievement. Web: persisted via storage. Steam: Steamworks. */
  unlockAchievement(id: string): void;
  isAchievementUnlocked(id: string): boolean;
  /** Submit a lap time to a level leaderboard. Web: no-op (local best already saved). */
  submitScore(levelId: number, timeMs: number): void;
}

// --- Web implementation ------------------------------------------------------

const webStorage: PlatformStorage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* quota / private mode */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
  getJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
};

const ACH_KEY = 'dronedoit_steam_achievements';

const webPlatform: PlatformServices = {
  name: 'web',
  isSteam: false,
  storage: webStorage,
  unlockAchievement(id) {
    const got = webStorage.getJSON<string[]>(ACH_KEY, []);
    if (!got.includes(id)) webStorage.setJSON(ACH_KEY, [...got, id]);
  },
  isAchievementUnlocked(id) {
    return webStorage.getJSON<string[]>(ACH_KEY, []).includes(id);
  },
  submitScore() {
    // No-op on web: the local best record is the leaderboard source of truth.
    // The Steam build overrides this to call Steamworks leaderboard upload.
  },
};

// --- Target selection --------------------------------------------------------
// The Steam desktop build will set VITE_TARGET=steam at build time (and provide
// a steam implementation). Until then everything resolves to the web platform.

const target = (import.meta.env.VITE_TARGET as PlatformName | undefined) ?? 'web';

export const platform: PlatformServices = target === 'steam' ? webPlatform /* TODO: steamPlatform */ : webPlatform;
