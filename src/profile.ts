/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pilot profile aggregation. droneDoIT has no backend yet, so a "profile" is the
 * local career data persisted in localStorage by the simulator. This module reads
 * those scattered keys and turns them into a single structured summary used by the
 * Pilot HQ screen. (Multiplayer / real accounts are on the roadmap.)
 */

import { LEVELS } from './levels';
import type { FrameType, LapRecord } from './types';
import { platform } from './platform';

export const FRAME_OPTIONS: { id: FrameType; name: string; desc: string }[] = [
  { id: 'true_x', name: 'True X', desc: 'Symmetric, agile' },
  { id: 'deadcat', name: 'Deadcat', desc: 'Quiet props, stable' },
  { id: 'toothpick', name: 'Toothpick', desc: 'Ultra light, twitchy' },
];

export const COLOR_OPTIONS: { hex: string; name: string }[] = [
  { hex: '#ff6b00', name: 'Orange' },
  { hex: '#ff2e93', name: 'Magenta' },
  { hex: '#00e5ff', name: 'Cyan' },
  { hex: '#b6ff00', name: 'Lime' },
  { hex: '#a855f7', name: 'Tokyo Purple' },
  { hex: '#facc15', name: 'Graffiti Yellow' },
  { hex: '#fbbf24', name: 'Shibuya Gold' },
  { hex: '#10b981', name: 'Beat Special Emerald' },
];

export const BASE_PALETTES = ['Orange', 'Magenta', 'Cyan', 'Lime'];

export interface PilotRank {
  name: string;
  color: string;
  /** Minimum total gates required to reach this rank. */
  min: number;
}

export const RANKS: PilotRank[] = [
  { name: 'ROOKIE TAGGER', color: '#9ca3af', min: 0 },
  { name: 'STREET RIDER', color: '#00e5ff', min: 10 },
  { name: 'NEON RACER', color: '#b6ff00', min: 25 },
  { name: 'GRAFFITI ACE', color: '#ff6b00', min: 50 },
  { name: 'SHIBUYA LEGEND', color: '#ff2e93', min: 90 },
];

export interface LevelBest {
  levelId: number;
  name: string;
  difficulty: string;
  parTimeMs: number;
  record: LapRecord | null;
  hasGhost: boolean;
  beatPar: boolean;
}

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  /** Palette this achievement unlocks, if any. */
  palette?: string;
  icon: string;
  check: (s: PilotStats) => boolean;
}

export interface PilotStats {
  callsign: string;
  totalDistance: number;
  totalGates: number;
  racesFinished: number;
  crashes: number;
  topSpeed: number;
  unlockedPalettes: string[];
  bests: LevelBest[];
  racesWithGhost: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_flight', name: 'First Broadcast', desc: 'Finish your first race', icon: '🎬', check: (s) => s.racesFinished >= 1 },
  { id: 'tokyo_purple', name: 'Tokyo Purple', desc: 'Fly 1000m total', palette: 'Tokyo Purple', icon: '🛹', check: (s) => s.totalDistance >= 1000 },
  { id: 'graffiti_yellow', name: 'Graffiti Yellow', desc: 'Pass 20 gates total', palette: 'Graffiti Yellow', icon: '🟡', check: (s) => s.totalGates >= 20 },
  { id: 'shibuya_gold', name: 'Shibuya Gold', desc: 'Pass 50 gates total', palette: 'Shibuya Gold', icon: '🥇', check: (s) => s.totalGates >= 50 },
  { id: 'beat_emerald', name: 'Beat Special Emerald', desc: 'Beat a level par time', palette: 'Beat Special Emerald', icon: '💚', check: (s) => s.bests.some((b) => b.beatPar) },
  { id: 'centurion', name: 'Grid Centurion', desc: 'Pass 100 gates total', icon: '💯', check: (s) => s.totalGates >= 100 },
  { id: 'marathon', name: 'Sky Marathon', desc: 'Fly 5000m total', icon: '🏁', check: (s) => s.totalDistance >= 5000 },
  { id: 'velocity', name: 'Velocity Junkie', desc: 'Hit 250 km/h', icon: '⚡', check: (s) => s.topSpeed >= 250 },
  { id: 'completionist', name: 'Course Master', desc: 'Set a record on every level', icon: '👑', check: (s) => s.bests.every((b) => b.record !== null) },
];

function num(key: string): number {
  const v = parseFloat(platform.storage.get(key) || '0');
  return Number.isFinite(v) ? v : 0;
}

export function getRank(totalGates: number): { current: PilotRank; next: PilotRank | null; progress: number } {
  let current = RANKS[0];
  for (const r of RANKS) if (totalGates >= r.min) current = r;
  const idx = RANKS.indexOf(current);
  const next = idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
  const progress = next ? Math.min(1, (totalGates - current.min) / (next.min - current.min)) : 1;
  return { current, next, progress };
}

export function readPilotStats(): PilotStats {
  const unlockedStr = platform.storage.get('dronedoit_unlocked_palettes') || '[]';
  let unlockedPalettes: string[] = [];
  try {
    unlockedPalettes = JSON.parse(unlockedStr);
  } catch {
    unlockedPalettes = [...BASE_PALETTES];
  }

  const bests: LevelBest[] = LEVELS.map((lvl) => {
    let record: LapRecord | null = null;
    const stored = platform.storage.get(`dronedoit_best_${lvl.id}`);
    if (stored) {
      try {
        record = JSON.parse(stored);
      } catch {
        record = null;
      }
    }
    const hasGhost = !!platform.storage.get(`dronedoit_ghost_${lvl.id}`);
    return {
      levelId: lvl.id,
      name: lvl.name,
      difficulty: lvl.difficulty,
      parTimeMs: lvl.parTimeMs,
      record,
      hasGhost,
      beatPar: record ? record.timeMs <= lvl.parTimeMs : false,
    };
  });

  return {
    callsign: platform.storage.get('dronedoit_pilot_callsign') || 'GRAFF_RACER',
    totalDistance: num('dronedoit_stat_distance'),
    totalGates: Math.round(num('dronedoit_stat_gates')),
    racesFinished: Math.round(num('dronedoit_stat_races')),
    crashes: Math.round(num('dronedoit_stat_crashes')),
    topSpeed: Math.round(num('dronedoit_stat_topspeed')),
    unlockedPalettes,
    bests,
    racesWithGhost: bests.filter((b) => b.hasGhost).length,
  };
}

/** Wipe all local career data (keeps the pilot callsign). */
export function resetPilotCareer() {
  const keys = [
    'dronedoit_stat_distance',
    'dronedoit_stat_gates',
    'dronedoit_stat_races',
    'dronedoit_stat_crashes',
    'dronedoit_stat_topspeed',
    'dronedoit_unlocked_palettes',
  ];
  for (const k of keys) platform.storage.remove(k);
  for (const lvl of LEVELS) {
    platform.storage.remove(`dronedoit_best_${lvl.id}`);
    platform.storage.remove(`dronedoit_ghost_${lvl.id}`);
  }
}

export function formatTime(ms: number): string {
  if (ms < 0) ms = 0;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}
