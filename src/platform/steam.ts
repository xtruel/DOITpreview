/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Steam platform implementation — SCAFFOLD / TEMPLATE (not wired yet).
 *
 * When we build the desktop app for Steam (Electron or Tauri), this file becomes
 * the `steam` PlatformServices implementation, selected in platform/index.ts when
 * VITE_TARGET=steam. It requires the Steamworks SDK bridge to be available in the
 * desktop shell:
 *   - Electron: the `steamworks.js` package, called from the main process and
 *     exposed to the renderer via a preload bridge (window.steam).
 *   - Tauri:    a Rust Steamworks binding exposed through tauri `invoke`.
 *
 * Mapping from the existing game data to Steamworks:
 *   - Achievements   → the palette/achievement ids in src/profile.ts (ACHIEVEMENTS)
 *                      map 1:1 to Steam achievement API names.
 *   - Leaderboards   → one Steam leaderboard per level id; submitScore() uploads
 *                      the lap time (lower is better).
 *   - Cloud saves    → Steam Auto-Cloud syncs the storage file; the storage
 *                      adapter can point at the app's userdata dir instead of
 *                      localStorage.
 *
 * Reference skeleton (Electron + steamworks.js), for when we integrate:
 *
 *   import type { PlatformServices } from './index';
 *   // window.steam is exposed by the Electron preload bridge
 *   declare global { interface Window { steam?: any } }
 *
 *   export const steamPlatform: PlatformServices = {
 *     name: 'steam',
 *     isSteam: true,
 *     storage: webStorage, // Electron persists localStorage to disk (Auto-Cloud)
 *     unlockAchievement(id) { window.steam?.activateAchievement(id); },
 *     isAchievementUnlocked(id) { return !!window.steam?.isAchievementActivated(id); },
 *     submitScore(levelId, timeMs) { window.steam?.uploadLeaderboardScore(`level_${levelId}`, timeMs); },
 *   };
 */

export {};
