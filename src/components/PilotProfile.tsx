/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { DroneConfig } from '../types';
import {
  ACHIEVEMENTS,
  BASE_PALETTES,
  COLOR_OPTIONS,
  FRAME_OPTIONS,
  formatTime,
  getRank,
  readPilotStats,
  resetPilotCareer,
} from '../profile';
import {
  User, Award, Gauge, Flag, Skull, Zap, Trophy, Ghost, Palette, RotateCcw,
  ChevronRight, Star, Route, Target,
} from 'lucide-react';

interface PilotProfileProps {
  config: DroneConfig;
  onChange: (config: DroneConfig) => void;
  onEnterGarage: () => void;
}

export const PilotProfile: React.FC<PilotProfileProps> = ({ config, onChange, onEnterGarage }) => {
  // Read once on mount; the profile is only shown between races so it is fresh.
  const [refresh, setRefresh] = useState(0);
  const stats = useMemo(() => readPilotStats(), [refresh, config.pilotCallsign]);
  const [confirmReset, setConfirmReset] = useState(false);

  const rank = getRank(stats.totalGates);
  const bestOverall = stats.bests
    .filter((b) => b.record)
    .reduce<number | null>((acc, b) => (acc === null ? b.record!.timeMs : Math.min(acc, b.record!.timeMs)), null);

  const update = (key: keyof DroneConfig, value: any) => onChange({ ...config, [key]: value });

  const handleReset = () => {
    resetPilotCareer();
    setConfirmReset(false);
    setRefresh((n) => n + 1);
  };

  const StatBox = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) => (
    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-neutral-500">
        {icon} {label}
      </div>
      <div className="font-black text-lg font-mono" style={{ color: accent }}>{value}</div>
    </div>
  );

  return (
    <main className="flex-1 flex flex-col gap-6 p-6 md:p-8 relative z-10 max-w-7xl mx-auto w-full dot-grid">
      {/* IDENTITY BANNER */}
      <div className="bg-black text-white outline-ink relative overflow-hidden">
        <div className="absolute inset-0 halftone-bg opacity-[0.07] pointer-events-none" />
        <div className="absolute top-0 right-0 bg-[#b6ff00] text-black text-[10px] font-black uppercase px-3 py-1 skew-x-12 origin-top-right">
          PILOT HQ
        </div>

        <div className="flex flex-col md:flex-row items-stretch">
          {/* Drone avatar / livery */}
          <div className="md:w-56 bg-neutral-950 border-b-4 md:border-b-0 md:border-r-4 border-black flex flex-col items-center justify-center p-6 gap-3">
            <div
              className="relative w-28 h-28 rounded-2xl flex items-center justify-center"
              style={{ boxShadow: `0 0 35px ${config.ledColor}55`, border: `3px solid ${config.ledColor}` }}
            >
              {/* 4 rotor dots = a tiny quad glyph */}
              {[
                'top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2',
              ].map((pos) => (
                <span key={pos} className={`absolute ${pos} w-5 h-5 rounded-full animate-pulse`} style={{ backgroundColor: config.ledColor }} />
              ))}
              <User className="w-10 h-10" style={{ color: config.ledColor }} />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              {config.frameType.replace('_', ' ')} FRAME
            </span>
          </div>

          {/* Identity details */}
          <div className="flex-1 p-6 flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-500">Pilot Call-sign</span>
              <input
                value={config.pilotCallsign}
                maxLength={12}
                onChange={(e) => update('pilotCallsign', e.target.value.toUpperCase())}
                className="block w-full bg-transparent text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-outline text-white outline-none focus:text-[#ff2e93] transition-colors"
                placeholder="GRAFF_RACER"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className="font-black italic uppercase text-sm px-4 py-1.5 skew-box border-2 border-black"
                style={{ backgroundColor: rank.current.color, color: '#000' }}
              >
                <Star className="w-4 h-4 inline mr-1 -mt-0.5" />
                {rank.current.name}
              </span>
              {rank.next && (
                <span className="text-[10px] font-mono uppercase text-neutral-400">
                  {stats.totalGates}/{rank.next.min} gates → {rank.next.name}
                </span>
              )}
            </div>

            {/* Rank progress bar */}
            <div className="w-full bg-neutral-900 h-2 rounded overflow-hidden border border-neutral-800">
              <div className="h-full transition-all" style={{ width: `${rank.progress * 100}%`, backgroundColor: rank.current.color }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT: career stats + records */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatBox icon={<Route className="w-3 h-3" />} label="Total Distance" value={`${Math.round(stats.totalDistance)}m`} accent="#00e5ff" />
            <StatBox icon={<Target className="w-3 h-3" />} label="Gates Passed" value={`${stats.totalGates}`} accent="#b6ff00" />
            <StatBox icon={<Flag className="w-3 h-3" />} label="Races Finished" value={`${stats.racesFinished}`} accent="#ff6b00" />
            <StatBox icon={<Skull className="w-3 h-3" />} label="Crashes" value={`${stats.crashes}`} accent="#ff2e93" />
            <StatBox icon={<Gauge className="w-3 h-3" />} label="Top Speed" value={`${stats.topSpeed} km/h`} accent="#00e5ff" />
            <StatBox icon={<Trophy className="w-3 h-3" />} label="Best Lap" value={bestOverall !== null ? formatTime(bestOverall) : '—'} accent="#facc15" />
          </div>

          {/* Personal bests per level */}
          <div className="bg-neutral-900 outline-ink p-5 text-white">
            <h2 className="text-sm font-black uppercase text-[#ff2e93] tracking-wider flex items-center gap-1.5 mb-3">
              <Award className="w-4 h-4 text-[#b6ff00]" /> Track Records
            </h2>
            <div className="space-y-2">
              {stats.bests.map((b) => (
                <div key={b.levelId} className="flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded skew-x-12 ${
                      b.difficulty === 'EASY' ? 'bg-[#b6ff00] text-black' : b.difficulty === 'MEDIUM' ? 'bg-[#ff6b00] text-black' : 'bg-[#ff2e93] text-white'
                    }`}>{b.difficulty}</span>
                    <span className="font-black italic uppercase text-sm truncate">{b.name}</span>
                    {b.hasGhost && <Ghost className="w-3.5 h-3.5 text-[#00e5ff] shrink-0" />}
                    {b.beatPar && <span className="text-[8px] font-black uppercase bg-[#10b981] text-black px-1.5 py-0.5 rounded shrink-0">SUB-PAR</span>}
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <div className="font-mono font-black text-sm text-white">{b.record ? formatTime(b.record.timeMs) : 'NO RECORD'}</div>
                    <div className="text-[9px] font-mono text-neutral-500">PAR {formatTime(b.parTimeMs)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-neutral-900 outline-ink p-5 text-white">
            <h2 className="text-sm font-black uppercase text-[#b6ff00] tracking-wider flex items-center gap-1.5 mb-3">
              <Zap className="w-4 h-4 text-[#ff2e93]" /> Achievements
              <span className="text-[10px] text-neutral-500 font-mono ml-auto">
                {ACHIEVEMENTS.filter((a) => a.check(stats)).length}/{ACHIEVEMENTS.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ACHIEVEMENTS.map((a) => {
                const got = a.check(stats);
                return (
                  <div key={a.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${got ? 'bg-neutral-950 border-neutral-700' : 'bg-neutral-950/40 border-neutral-900 opacity-50'}`}>
                    <span className="text-xl">{got ? a.icon : '🔒'}</span>
                    <div className="min-w-0">
                      <div className={`font-black text-xs uppercase truncate ${got ? 'text-white' : 'text-neutral-500'}`}>{a.name}</div>
                      <div className="text-[10px] text-neutral-500 truncate">{a.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: garage (livery) + actions */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          <div className="bg-black text-white outline-ink p-5">
            <h2 className="text-sm font-black uppercase text-[#00e5ff] tracking-wider flex items-center gap-1.5 mb-3">
              <Palette className="w-4 h-4 text-[#ff2e93]" /> Garage · Livery
            </h2>

            {/* Frame select */}
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Frame</label>
            <div className="grid grid-cols-3 gap-2 mt-1 mb-4">
              {FRAME_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => update('frameType', f.id)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    config.frameType === f.id ? 'border-[#00e5ff] bg-[#00e5ff]/10 text-[#00e5ff]' : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-[11px]">{f.name}</div>
                </button>
              ))}
            </div>

            {/* LED color */}
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">LED Neon (unlock via achievements)</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {COLOR_OPTIONS.map((c) => {
                const unlocked = BASE_PALETTES.includes(c.name) || stats.unlockedPalettes.includes(c.name);
                return (
                  <button
                    key={c.hex}
                    disabled={!unlocked}
                    onClick={() => unlocked && update('ledColor', c.hex)}
                    title={c.name + (unlocked ? '' : ' (locked)')}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      !unlocked ? 'opacity-30 cursor-not-allowed border-neutral-800' : config.ledColor === c.hex ? 'border-white scale-110' : 'border-neutral-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={onEnterGarage}
            className="w-full bg-[#b6ff00] hover:bg-[#ff2e93] text-black hover:text-white font-black py-3 rounded border-2 border-black shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#000] uppercase text-sm tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            ENTER RACING GRID <ChevronRight className="w-4 h-4" />
          </button>

          {/* Reset career */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full text-[11px] font-black uppercase text-neutral-400 hover:text-[#ff2e93] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset career data
              </button>
            ) : (
              <div className="space-y-2 text-center">
                <p className="text-[11px] text-neutral-400 font-bold uppercase">Wipe all stats, records & ghosts?</p>
                <div className="flex gap-2">
                  <button onClick={handleReset} className="flex-1 bg-[#ff2e93] text-white font-black text-[11px] uppercase py-2 rounded cursor-pointer">Confirm</button>
                  <button onClick={() => setConfirmReset(false)} className="flex-1 bg-neutral-800 text-white font-black text-[11px] uppercase py-2 rounded cursor-pointer">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
