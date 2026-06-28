/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { DroneConfig, Level, LapRecord } from './types';
import { LEVELS } from './levels';
import { BetaflightConfig } from './components/BetaflightConfig';
import { FPVSimulator } from './components/FPVSimulator';
import { PilotProfile } from './components/PilotProfile';
import { sound } from './components/SoundEngine';
import { Play, Sparkles, Award, Palette, Music, Volume2, VolumeX, HelpCircle, Flame, Shield, Globe, Cpu, RotateCcw, ChevronRight, X, User } from 'lucide-react';

const DEFAULT_LEADERBOARDS: { [key: number]: { pilotName: string; timeMs: number; date: string; droneFrame: string }[] } = {
  1: [
    { pilotName: "BEAT", timeMs: 22400, date: "06/20/2026", droneFrame: "toothpick" },
    { pilotName: "GUM", timeMs: 25100, date: "06/18/2026", droneFrame: "true_x" },
    { pilotName: "TAB", timeMs: 27900, date: "06/21/2026", droneFrame: "deadcat" },
    { pilotName: "MEW", timeMs: 31200, date: "06/22/2026", droneFrame: "toothpick" },
    { pilotName: "CORN", timeMs: 34500, date: "06/15/2026", droneFrame: "true_x" },
  ],
  2: [
    { pilotName: "BEAT", timeMs: 34200, date: "06/20/2026", droneFrame: "toothpick" },
    { pilotName: "GUM", timeMs: 38700, date: "06/19/2026", droneFrame: "true_x" },
    { pilotName: "CORN", timeMs: 42100, date: "06/15/2026", droneFrame: "true_x" },
    { pilotName: "TAB", timeMs: 45900, date: "06/21/2026", droneFrame: "deadcat" },
    { pilotName: "MEW", timeMs: 49800, date: "06/22/2026", droneFrame: "toothpick" },
  ],
  3: [
    { pilotName: "GUM", timeMs: 44200, date: "06/19/2026", droneFrame: "true_x" },
    { pilotName: "BEAT", timeMs: 46800, date: "06/20/2026", droneFrame: "toothpick" },
    { pilotName: "CORN", timeMs: 51200, date: "06/15/2026", droneFrame: "true_x" },
    { pilotName: "TAB", timeMs: 56900, date: "06/21/2026", droneFrame: "deadcat" },
    { pilotName: "MEW", timeMs: 62400, date: "06/22/2026", droneFrame: "toothpick" },
  ]
};

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'simulator' | 'profile'>('menu');
  const [selectedLevel, setSelectedLevel] = useState<Level>(LEVELS[0]);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [isGlitching, setIsGlitching] = useState<boolean>(false);
  const [showRecordsModal, setShowRecordsModal] = useState<boolean>(false);
  const [recordsActiveTab, setRecordsActiveTab] = useState<number>(1);
  const [leaderboard, setLeaderboard] = useState<{ [key: number]: LapRecord | null }>({
    1: null,
    2: null,
    3: null,
  });

  // Default Drone Betaflight Config (persisted so the pilot's setup sticks)
  const [config, setConfig] = useState<DroneConfig>(() => {
    const defaults: DroneConfig = {
      frameType: 'true_x',
      ledColor: '#ff2e93', // Magenta neon default
      rcRate: 1.15,
      superRate: 0.65,
      expo: 0.25,
      yawRate: 2.2,
      flightMode: 'ANGLE', // ANGLE is much easier for beginners using web keyboard
      cameraTilt: 25,
      pilotCallsign: localStorage.getItem('dronedoit_pilot_callsign') || 'GRAFF_RACER',
    };
    try {
      const storedConfig = localStorage.getItem('dronedoit_config');
      if (storedConfig) return { ...defaults, ...JSON.parse(storedConfig) };
    } catch {
      /* ignore malformed config */
    }
    return defaults;
  });

  // Persist pilot callsign and the full config when they change
  useEffect(() => {
    localStorage.setItem('dronedoit_pilot_callsign', config.pilotCallsign);
    localStorage.setItem('dronedoit_config', JSON.stringify(config));
  }, [config]);

  // Load personal bests
  useEffect(() => {
    const fetchBests = () => {
      const updated: { [key: number]: LapRecord | null } = {};
      LEVELS.forEach((lvl) => {
        const stored = localStorage.getItem(`dronedoit_best_${lvl.id}`);
        if (stored) {
          updated[lvl.id] = JSON.parse(stored);
        } else {
          updated[lvl.id] = null;
        }
      });
      setLeaderboard(updated);
    };

    fetchBests();
  }, [screen]);

  // Audio helper toggles
  const handleToggleAudio = () => {
    if (!audioEnabled) {
      sound.init();
      sound.resume();
      sound.startMenuMusic();
      setAudioEnabled(true);
    } else {
      sound.stopMenuMusic();
      setAudioEnabled(false);
    }
  };

  const triggerGlitchNavigation = (action: () => void) => {
    setIsGlitching(true);
    // play a quick glitch sound effect if possible
    sound.playBeep();
    setTimeout(() => {
      action();
      setTimeout(() => {
        setIsGlitching(false);
      }, 150);
    }, 250);
  };

  const startLevelSim = (lvl: Level) => {
    triggerGlitchNavigation(() => {
      setSelectedLevel(lvl);
      // Stop menu music to make room for roaring FPV drone motor sound
      sound.stopMenuMusic();
      setScreen('simulator');
    });
  };

  const handleBackToMenu = () => {
    triggerGlitchNavigation(() => {
      setScreen('menu');
      // Restart groovy procedural menu beats if audio was on
      if (audioEnabled) {
        setTimeout(() => {
          sound.startMenuMusic();
        }, 200);
      }
    });
  };

  const goToScreen = (target: 'menu' | 'profile') => {
    triggerGlitchNavigation(() => setScreen(target));
  };

  const getLeaderboardForLevel = (lvlId: number) => {
    const defaults = DEFAULT_LEADERBOARDS[lvlId] || [];
    const stored = localStorage.getItem(`dronedoit_best_${lvlId}`);
    if (!stored) return defaults;
    
    try {
      const userRecord: LapRecord = JSON.parse(stored);
      // Map user record to same format
      const mappedUser = {
        pilotName: `${config.pilotCallsign || 'YOU'} (YOU)`,
        timeMs: userRecord.timeMs,
        date: userRecord.date || new Date().toLocaleDateString(),
        droneFrame: userRecord.droneFrame || config.frameType,
      };
      
      // Combine and sort ascending
      const combined = [...defaults, mappedUser];
      combined.sort((a, b) => a.timeMs - b.timeMs);
      
      // Deduplicate pilot entries
      const unique: typeof combined = [];
      const namesSeen = new Set<string>();
      combined.forEach(p => {
        if (!namesSeen.has(p.pilotName)) {
          unique.push(p);
          namesSeen.add(p.pilotName);
        }
      });
      
      return unique.slice(0, 5);
    } catch (e) {
      return defaults;
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#fdfdfd] text-black font-sans relative flex flex-col overflow-x-hidden dot-grid">
      {/* Decorative JSR background watermark text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.02] select-none z-0">
        <h1 className="text-[25vw] font-black italic leading-none">JETSET</h1>
      </div>

      {/* HEADER SECTION - Jet Set Radio Style */}
      <header className="h-24 bg-[#ff6b00] border-b-4 border-black flex items-center justify-between px-6 md:px-12 z-20 shadow-[0_4px_0_rgba(0,0,0,1)] select-none">
        <div className="flex items-center gap-4">
          <div className="bg-white outline-ink p-2.5 skew-box flex items-center gap-1">
            <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-outline select-none">
              droneDoIT
            </h1>
          </div>
          <span className="hidden sm:inline-block font-black text-[10px] uppercase bg-black text-[#b6ff00] px-2 py-1 skew-x-12">
            FPV SPEED SIMULATOR v1.2
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Pilot HQ / profile toggle (hidden while flying) */}
          {screen !== 'simulator' && (
            <button
              id="btn-pilot-hq"
              onClick={() => goToScreen(screen === 'profile' ? 'menu' : 'profile')}
              className={`flex items-center gap-2 px-4 py-2 border-2 border-black font-black uppercase text-xs skew-box transition-all duration-150 cursor-pointer shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#000] ${
                screen === 'profile' ? 'bg-[#00e5ff] text-black' : 'bg-white text-black'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{screen === 'profile' ? 'BACK TO GARAGE' : 'PILOT HQ'}</span>
            </button>
          )}

          {/* procedural soundtrack controller */}
          <button
            id="btn-toggle-audio"
            onClick={handleToggleAudio}
            className={`flex items-center gap-2 px-4 py-2 border-2 border-black font-black uppercase text-xs skew-box transition-all duration-150 cursor-pointer shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#000] ${
              audioEnabled ? 'bg-[#b6ff00] text-black' : 'bg-neutral-900 text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{audioEnabled ? "BEATS ONLINE" : "LOAD OST BEATS"}</span>
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {screen === 'simulator' ? (
        <FPVSimulator level={selectedLevel} config={config} onBackToMenu={handleBackToMenu} />
      ) : screen === 'profile' ? (
        <PilotProfile config={config} onChange={setConfig} onEnterGarage={() => goToScreen('menu')} />
      ) : (
        <main className="flex-1 flex flex-col lg:flex-row p-6 md:p-8 gap-8 relative z-10 max-w-7xl mx-auto w-full">
          
          {/* LEFT COLUMN: Rates Tuner and Drone Customizer */}
          <div className="flex-1 flex flex-col gap-8">
            {/* Style overview card */}
            <div className="bg-[#00e5ff] outline-ink p-6 relative flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full halftone-bg pointer-events-none opacity-10"></div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-5 h-5 text-black" />
                  <h2 className="text-2xl font-black uppercase italic">Y2K FPV Arena</h2>
                </div>
                <p className="text-xs font-bold leading-relaxed uppercase max-w-xl text-neutral-800">
                  Step into the cel-shaded retro future of FPV drone flight. Configure customizable rates with realistic Betaflight physics, toggle self-leveling, and test your speed lines through luminous neon gate courses.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="bg-black text-[#ff6b00] px-2.5 py-0.5 rounded text-[10px] font-black uppercase">#ff6b00 ORANGE</span>
                <span className="bg-black text-[#ff2e93] px-2.5 py-0.5 rounded text-[10px] font-black uppercase">#ff2e93 MAGENTA</span>
                <span className="bg-black text-[#00e5ff] px-2.5 py-0.5 rounded text-[10px] font-black uppercase">#00e5ff CYAN</span>
                <span className="bg-black text-[#b6ff00] px-2.5 py-0.5 rounded text-[10px] font-black uppercase">#b6ff00 LIME</span>
              </div>
            </div>

            {/* Betaflight Tuner Widget */}
            <BetaflightConfig config={config} onChange={setConfig} onStartGame={() => startLevelSim(selectedLevel)} />
          </div>

          {/* RIGHT COLUMN: Level select and Records */}
          <div className="w-full lg:w-[480px] flex flex-col gap-6">
            
            {/* Level Selector Heading */}
            <div className="bg-black text-white p-4 outline-ink flex justify-between items-center">
              <span className="text-xs font-black text-[#ff2e93] tracking-wider uppercase">Select Speed Course</span>
              <button 
                id="btn-open-global-records"
                onClick={() => setShowRecordsModal(true)}
                className="text-xs font-black bg-[#b6ff00] hover:bg-[#ff2e93] text-black hover:text-white px-3 py-1 skew-x-12 cursor-pointer transition-all flex items-center gap-1"
              >
                <Award className="w-3.5 h-3.5" /> JSR RECORDS
              </button>
            </div>

            {/* Level Cards List */}
            <div className="space-y-4">
              {LEVELS.map((lvl) => {
                const bestLap = leaderboard[lvl.id];
                const isSelected = selectedLevel.id === lvl.id;
                
                return (
                  <div
                    key={lvl.id}
                    id={`level-card-${lvl.id}`}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`outline-ink p-0 flex rounded-lg overflow-hidden transition-all cursor-pointer select-none group relative bg-white ${
                      isSelected ? 'ring-4 ring-black scale-[1.01]' : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    {/* Level Number Ribbon */}
                    <div className={`w-14 flex items-center justify-center border-r-4 border-black ${
                      lvl.id === 1 ? 'bg-[#ff6b00]' : lvl.id === 2 ? 'bg-[#ff2e93]' : 'bg-[#b6ff00]'
                    }`}>
                      <span className="rotate-[-90deg] font-black whitespace-nowrap text-xl uppercase tracking-wider text-black">
                        {lvl.difficulty}
                      </span>
                    </div>

                    {/* Level Details */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 block uppercase">
                            {lvl.subtitle}
                          </span>
                          <h3 className="text-xl font-black uppercase italic leading-tight group-hover:text-[#ff2e93] transition-colors mt-0.5">
                            {lvl.name}
                          </h3>
                        </div>
                        {isSelected && (
                          <span className="bg-black text-white text-[9px] font-black uppercase px-2 py-0.5 rounded skew-x-12">
                            SELECTED
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-neutral-500 font-medium leading-relaxed uppercase mt-2">
                        {lvl.description}
                      </p>

                      {/* Best record details */}
                      <div className="mt-4 pt-3 border-t border-dashed border-neutral-200 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5 text-neutral-600">
                          <Award className="w-4 h-4 text-[#ff6b00]" />
                          <span className="font-bold">BEST LAP:</span>
                        </div>
                        <span className="font-mono font-black text-black">
                          {bestLap ? formatTime(bestLap.timeMs) : 'NO RECORD YET'}
                        </span>
                      </div>

                      {/* Launch Button when selected */}
                      {isSelected && (
                        <button
                          id={`btn-launch-lvl-${lvl.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            startLevelSim(lvl);
                          }}
                          className="mt-4 w-full bg-[#b6ff00] hover:bg-[#ff2e93] text-black hover:text-white font-black py-2.5 rounded border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_rgba(0,0,0,1)] uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          ENTER RACING GRID <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick calibration / instructions guide card */}
            <div className="bg-neutral-950 text-white p-5 outline-ink space-y-3">
              <h4 className="text-xs font-black uppercase text-[#00e5ff] tracking-wide flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" /> PRE-FLIGHT TRAINING
              </h4>
              <p className="text-[10px] text-neutral-400 uppercase leading-relaxed">
                • If you have never flown FPV before, keep the flight mode set to **ANGLE**. The drone will self-level automatically when you release rotation commands.
              </p>
              <p className="text-[10px] text-neutral-400 uppercase leading-relaxed">
                • For professional aerobatics, toggle **ACRO** mode and make minor inputs.
              </p>
              <p className="text-[10px] text-neutral-400 uppercase leading-relaxed">
                • Turn on **OST BEATS** in the top right to start the breakbeat rhythm!
              </p>
            </div>

          </div>
        </main>
      )}

      {/* GLOBAL SCREEN GLITCH TRANSITION OVERLAY */}
      {isGlitching && (
        <div className="fixed inset-0 bg-neutral-900 z-50 pointer-events-none flex items-center justify-center animate-global-glitch select-none overflow-hidden">
          <div className="scanlines-overlay absolute inset-0 opacity-40"></div>
          <div className="text-center">
            <h1 className="text-[#ff2e93] text-5xl font-black italic tracking-tighter uppercase select-none skew-x-12 animate-pulse">
              SIGNAL INTERFERENCE...
            </h1>
            <p className="font-mono text-[10px] text-green-400 mt-2 tracking-widest uppercase animate-pulse">
              [ ANALOG RETRIEVING ]
            </p>
          </div>
        </div>
      )}

      {/* GLOBAL RECORDS MODAL (GRAFFITI JSR STYLE) */}
      {showRecordsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-40 flex items-center justify-center p-4 select-none">
          <div className="bg-neutral-900 border-4 border-black p-6 md:p-8 max-w-2xl w-full relative outline-ink shadow-[10px_10px_0_#000]">
            {/* Close Button */}
            <button 
              onClick={() => setShowRecordsModal(false)}
              className="absolute -top-3 -right-3 bg-[#ff2e93] border-2 border-black p-1.5 rounded-full text-black hover:bg-white transition-all cursor-pointer shadow-[3px_3px_0_#000] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <X className="w-5 h-5 font-black" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <span className="text-[10px] bg-[#00e5ff] text-black px-2 py-0.5 font-mono font-black uppercase skew-x-12 inline-block">
                HALL OF SPEED
              </span>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-[#ff6b00] mt-1.5 flex items-center gap-2">
                <Award className="w-8 h-8 text-[#ff2e93]" />
                GLOBAL PILOT RECORDS
              </h2>
              <p className="text-xs text-neutral-400 mt-1 uppercase">
                The fastest lap times ever spray painted into the Tokyo Y2K sky. Can you beat the legends?
              </p>
            </div>

            {/* Level Tabs selector */}
            <div className="flex gap-2 mb-6 bg-neutral-950 p-1 border border-neutral-800 rounded">
              {LEVELS.map(lvl => (
                <button
                  key={lvl.id}
                  onClick={() => setRecordsActiveTab(lvl.id)}
                  className={`flex-1 py-2 font-black uppercase text-xs rounded transition-all cursor-pointer ${
                    recordsActiveTab === lvl.id
                      ? 'bg-[#ff2e93] text-white shadow-[0_0_10px_rgba(255,46,147,0.3)]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {lvl.name}
                </button>
              ))}
            </div>

            {/* Leaderboard Table */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden p-4">
              <table className="w-full text-left font-mono text-xs text-neutral-300">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-500 font-bold uppercase text-[10px]">
                    <th className="pb-2 w-12 text-center">RANK</th>
                    <th className="pb-2">PILOT CALLSIGN</th>
                    <th className="pb-2">DRONE GEAR</th>
                    <th className="pb-2">DATE COMPLETED</th>
                    <th className="pb-2 text-right">LAP TIME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 text-left">
                  {getLeaderboardForLevel(recordsActiveTab).map((record, index) => {
                    const isUser = record.pilotName.includes('(YOU)');
                    return (
                      <tr 
                        key={index} 
                        className={`transition-colors ${isUser ? 'bg-[#ff6b00]/10 text-white font-bold' : 'hover:bg-neutral-900/40'}`}
                      >
                        <td className="py-3 text-center">
                          <span className={`inline-block w-6 h-6 leading-6 rounded-full font-black text-center ${
                            index === 0 
                              ? 'bg-[#fbbf24] text-black' 
                              : index === 1 
                                ? 'bg-neutral-300 text-black' 
                                : index === 2 
                                  ? 'bg-[#cd7f32] text-black' 
                                  : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3 flex items-center gap-1.5 font-bold">
                          {isUser ? (
                            <span className="text-[#ff6b00]">{record.pilotName}</span>
                          ) : (
                            <span>{record.pilotName}</span>
                          )}
                        </td>
                        <td className="py-3 uppercase text-neutral-400">{record.droneFrame}</td>
                        <td className="py-3 text-neutral-500">{record.date}</td>
                        <td className="py-3 text-right font-black text-white text-sm tracking-wider">
                          {formatTime(record.timeMs)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowRecordsModal(false)}
                className="bg-white text-black font-black uppercase text-xs px-6 py-2.5 rounded border-2 border-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0_#000] cursor-pointer"
              >
                RETURN TO RUN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
