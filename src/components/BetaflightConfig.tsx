/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DroneConfig, FrameType, FlightMode } from '../types';
import { platform } from '../platform';
import { Sliders, Zap, Shield, HelpCircle, Eye, RefreshCw } from 'lucide-react';

interface BetaflightConfigProps {
  config: DroneConfig;
  onChange: (newConfig: DroneConfig) => void;
  onStartGame: () => void;
}

export const BetaflightConfig: React.FC<BetaflightConfigProps> = ({
  config,
  onChange,
  onStartGame,
}) => {
  const [unlockedPalettes, setUnlockedPalettes] = React.useState<string[]>([]);
  React.useEffect(() => {
    const unlockedStr = platform.storage.get('dronedoit_unlocked_palettes') || '[]';
    try {
      const parsed = JSON.parse(unlockedStr);
      setUnlockedPalettes(parsed);
    } catch (e) {
      setUnlockedPalettes(['Orange', 'Magenta', 'Cyan', 'Lime']);
    }
  }, []);

  const updateField = (key: keyof DroneConfig, value: any) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  // Betaflight rate formula calculation for graphing
  // x is stick input from -1.0 to 1.0
  const getDegPerSec = (x: number, rcRate: number, superRate: number, expo: number) => {
    const absX = Math.abs(x);
    // Apply Expo
    let expoFactor = x;
    if (expo > 0) {
      expoFactor = x * Math.pow(absX, 3) * expo + x * (1 - expo);
    }
    
    // Apply Rates
    let degPerSec = 200 * rcRate * expoFactor;
    if (superRate > 0) {
      const denom = 1.0 - Math.min(0.99, superRate) * Math.abs(expoFactor);
      degPerSec = degPerSec / denom;
    }
    
    return degPerSec; // Degrees per second
  };

  // Generate SVG path for the rate curve
  const generateCurvePath = () => {
    const points: string[] = [];
    const width = 280;
    const height = 140;
    const padding = 10;
    
    for (let px = 0; px <= width; px++) {
      // Scale px (0 to width) to stick input x (-1.0 to 1.0)
      const x = (px / width) * 2 - 1;
      const degSec = getDegPerSec(x, config.rcRate, config.superRate, config.expo);
      
      // Scale degSec (approx range -1200 to 1200) to visual height
      const maxDegSec = 1200; // Cap visual scale
      const py = height / 2 - (degSec / maxDegSec) * (height / 2 - padding);
      
      const clampedPy = Math.max(padding, Math.min(height - padding, py));
      points.push(`${px},${clampedPy}`);
    }
    return `M ${points.join(' L ')}`;
  };

  // Calculate maximum rate (at stick input = 1.0)
  const maxRate = Math.round(Math.abs(getDegPerSec(1.0, config.rcRate, config.superRate, config.expo)));

  return (
    <div id="betaflight-tuner" className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-6 text-white max-w-4xl mx-auto shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md relative overflow-hidden">
      {/* Jet Set Radio Style Tag */}
      <div className="absolute top-0 right-0 bg-[#ff2e93] text-black font-mono text-xs font-bold px-4 py-1 skew-x-12 origin-top-right">
        BETAFLIGHT RATE TUNER v4.4
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side: Parameters Tuning */}
        <div className="flex-1 space-y-6">
          <div>
            <h2 className="text-2xl font-black text-[#ff6b00] tracking-tight uppercase flex items-center gap-2">
              <Sliders className="w-6 h-6 text-[#ff2e93]" />
              Drone Engineering
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Customize your quadcopter frame, LED strip glowing hue, and Betaflight flight control characteristics.
            </p>
          </div>

          {/* 1. Frame selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">Quadcopter Frame Type</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'true_x', name: 'True X', desc: 'Symmetric, agile' },
                { id: 'deadcat', name: 'Deadcat', desc: 'Quiet props, stable' },
                { id: 'toothpick', name: 'Toothpick', desc: 'Ultra light, twitchy' },
              ].map((frame) => (
                <button
                  key={frame.id}
                  id={`btn-frame-${frame.id}`}
                  onClick={() => updateField('frameType', frame.id as FrameType)}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                    config.frameType === frame.id
                      ? 'border-[#00e5ff] bg-[#00e5ff]/10 text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-sm">{frame.name}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{frame.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. LED Color selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">LED Accent Neon Glow</label>
            <div className="flex flex-wrap gap-2">
              {[
                { hex: '#ff6b00', name: 'Orange', bg: 'bg-[#ff6b00]' },
                { hex: '#ff2e93', name: 'Magenta', bg: 'bg-[#ff2e93]' },
                { hex: '#00e5ff', name: 'Cyan', bg: 'bg-[#00e5ff]' },
                { hex: '#b6ff00', name: 'Lime', bg: 'bg-[#b6ff00]' },
                { hex: '#a855f7', name: 'Tokyo Purple', bg: 'bg-[#a855f7]' },
                { hex: '#facc15', name: 'Graffiti Yellow', bg: 'bg-[#facc15]' },
                { hex: '#fbbf24', name: 'Shibuya Gold', bg: 'bg-[#fbbf24]' },
                { hex: '#10b981', name: 'Beat Special Emerald', bg: 'bg-[#10b981]' },
              ].map((color) => {
                const isUnlocked = ['Orange', 'Magenta', 'Cyan', 'Lime'].includes(color.name) || unlockedPalettes.includes(color.name);
                return (
                  <button
                    key={color.hex}
                    id={`btn-color-${color.name.toLowerCase().replace(/\s+/g, '-')}`}
                    disabled={!isUnlocked}
                    onClick={() => isUnlocked && updateField('ledColor', color.hex)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
                      !isUnlocked 
                        ? 'opacity-40 border-neutral-950 bg-neutral-950 text-neutral-600 cursor-not-allowed'
                        : config.ledColor === color.hex
                          ? 'border-white bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${color.bg} shadow-md inline-block`} />
                    {color.name} {!isUnlocked && '🔒'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pilot Call-sign input (JSR Graffiti Aesthetic) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1">
              <span className="text-[#ff2e93]">★</span> Pilot Call-Sign (Graffiti Tag)
            </label>
            <div className="relative">
              <input
                id="input-pilot-callsign"
                type="text"
                maxLength={12}
                value={config.pilotCallsign || ''}
                onChange={(e) => updateField('pilotCallsign', e.target.value.toUpperCase())}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#ff2e93] text-white font-black italic rounded-xl px-4 py-2.5 text-sm uppercase tracking-wider outline-none placeholder-neutral-600 transition-all focus:ring-1 focus:ring-[#ff2e93]"
                placeholder="PILOT CALL-SIGN..."
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#ff2e93] font-black italic">
                TAG
              </div>
            </div>
          </div>

          {/* 3. Flight Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#b6ff00]" /> Flight Mode
              </label>
              <div className="flex rounded-lg overflow-hidden border border-neutral-800 p-0.5 bg-neutral-950">
                <button
                  id="btn-mode-angle"
                  onClick={() => updateField('flightMode', 'ANGLE')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                    config.flightMode === 'ANGLE'
                      ? 'bg-[#b6ff00] text-black shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  ANGLE (Self-Level)
                </button>
                <button
                  id="btn-mode-acro"
                  onClick={() => updateField('flightMode', 'ACRO')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                    config.flightMode === 'ACRO'
                      ? 'bg-[#ff2e93] text-white shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  ACRO (Full Rate)
                </button>
              </div>
            </div>

            {/* Camera Tilt */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-[#00e5ff]" /> FPV Camera Tilt
              </label>
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1">
                <input
                  type="range"
                  min="0"
                  max="55"
                  step="5"
                  value={config.cameraTilt}
                  onChange={(e) => updateField('cameraTilt', parseInt(e.target.value))}
                  className="w-full accent-[#00e5ff] cursor-pointer"
                />
                <span className="font-mono text-sm font-bold text-[#00e5ff] w-10 text-right">{config.cameraTilt}°</span>
              </div>
            </div>
          </div>

          {/* Rates Sliders */}
          <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-neutral-300">Betaflight Rates Tuner</span>
              <span className="text-[10px] text-neutral-500 font-mono">Roll / Pitch Rate Profile</span>
            </div>

            {/* RC Rate */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400 font-medium">RC Rate (Base speed)</span>
                <span className="font-mono font-bold text-[#ff6b00]">{config.rcRate.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={config.rcRate}
                onChange={(e) => updateField('rcRate', parseFloat(e.target.value))}
                className="w-full accent-[#ff6b00] cursor-pointer h-1 bg-neutral-800 rounded-lg appearance-none"
              />
            </div>

            {/* Super Rate */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400 font-medium">Super Rate (Max deflection boost)</span>
                <span className="font-mono font-bold text-[#ff2e93]">{config.superRate.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.85"
                step="0.05"
                value={config.superRate}
                onChange={(e) => updateField('superRate', parseFloat(e.target.value))}
                className="w-full accent-[#ff2e93] cursor-pointer h-1 bg-neutral-800 rounded-lg appearance-none"
              />
            </div>

            {/* Expo */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400 font-medium">Expo (Center stick damping)</span>
                <span className="font-mono font-bold text-[#00e5ff]">{config.expo.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.80"
                step="0.05"
                value={config.expo}
                onChange={(e) => updateField('expo', parseFloat(e.target.value))}
                className="w-full accent-[#00e5ff] cursor-pointer h-1 bg-neutral-800 rounded-lg appearance-none"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Visual Graph Curve */}
        <div className="w-full md:w-80 flex flex-col justify-between space-y-6">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col items-center">
            <span className="text-xs font-bold text-neutral-300 mb-2 uppercase tracking-wide">Dynamic Rate Curve</span>
            
            {/* SVG Plot */}
            <div className="relative w-full h-[140px] bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800">
              {/* Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-20">
                <div className="border-r border-dashed border-neutral-500 h-full w-full"></div>
                <div className="border-r border-dashed border-neutral-500 h-full w-full"></div>
                <div className="border-r border-dashed border-neutral-500 h-full w-full"></div>
                <div className="border-b border-dashed border-neutral-500 w-full h-full"></div>
                <div className="border-b border-dashed border-neutral-500 w-full h-full"></div>
                <div className="border-b border-dashed border-neutral-500 w-full h-full"></div>
              </div>
              
              {/* Half center vertical line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-neutral-800 pointer-events-none"></div>
              {/* Center horizontal line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-800 pointer-events-none"></div>

              {/* Curve Drawing */}
              <svg className="w-full h-full overflow-visible">
                <path
                  d={generateCurvePath()}
                  fill="none"
                  stroke="url(#grad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00e5ff" />
                    <stop offset="50%" stopColor="#ff2e93" />
                    <stop offset="100%" stopColor="#ff6b00" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="flex justify-between w-full mt-3 px-1 text-center">
              <div>
                <span className="text-[10px] text-neutral-500 block uppercase">Max angular speed</span>
                <span className="font-mono text-base font-black text-[#ff2e93]">{maxRate}°/s</span>
              </div>
              <div className="border-l border-neutral-800 mx-2"></div>
              <div>
                <span className="text-[10px] text-neutral-500 block uppercase">Center deadband</span>
                <span className="font-mono text-base font-black text-[#00e5ff]">{(config.expo * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-[11px] text-neutral-400 space-y-1.5">
              <div className="font-bold text-neutral-300 uppercase flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-[#ff6b00]" /> Flight Tips:
              </div>
              <p>• **ANGLE Mode** has auto-leveling and is highly recommended for beginners using keyboard controls!</p>
              <p>• **ACRO Mode** allows flips, rolls, and inverted flights but requires continuous precise inputs.</p>
              <p>• Adjust **Expo** to make small center stick adjustments smoother and avoid twitchiness.</p>
            </div>

            {/* LAUNCH BUTTON */}
            <button
              id="btn-save-launch"
              onClick={onStartGame}
              className="w-full bg-gradient-to-r from-[#ff6b00] to-[#ff2e93] hover:from-[#ff2e93] hover:to-[#ff6b00] text-black font-black text-lg py-4 rounded-xl shadow-[0_0_25px_rgba(255,107,0,0.4)] hover:shadow-[0_0_35px_rgba(255,46,147,0.6)] hover:scale-[1.02] transform transition-all duration-200 uppercase flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-5 h-5 animate-pulse fill-current text-black" />
              LOCK & LAUNCH SIM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
