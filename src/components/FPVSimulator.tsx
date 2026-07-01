/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { DroneConfig, Level, Gate, FlightTelemetry, LapRecord } from '../types';
import { sound } from './SoundEngine';
import { platform } from '../platform';
import { Play, RotateCcw, AlertTriangle, Radio, Shield, Gauge, Zap, Sparkles, Award, Palette, CheckCircle, Flame, ChevronRight, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface FPVSimulatorProps {
  level: Level;
  config: DroneConfig;
  onBackToMenu: () => void;
}

interface TelemetryPoint {
  timeMs: number;
  throttle: number;
  pitch: number;
  yaw: number;
  speed: number;
  x: number;
  y: number;
  z: number;
}

export const FPVSimulator: React.FC<FPVSimulatorProps> = ({ level, config, onBackToMenu }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game states
  const [gameState, setGameState] = useState<'countdown' | 'flying' | 'crashed' | 'finished'>('countdown');
  const [countdown, setCountdown] = useState<number | string>(3);
  const [lapTime, setLapTime] = useState<number>(0);
  const [currentGateIdx, setCurrentGateIdx] = useState<number>(0);
  const [battery, setBattery] = useState<number>(100);
  const [speed, setSpeed] = useState<number>(0); // in km/h
  const [altitude, setAltitude] = useState<number>(10); // in meters
  const [collisionActive, setCollisionActive] = useState<boolean>(false);
  const [graffitiTag, setGraffitiTag] = useState<string>('DOIT!');
  const [graffitiSprayed, setGraffitiSprayed] = useState<boolean>(false);
  const [sprayDecals, setSprayDecals] = useState<{ x: number; y: number; color: string; scale: number; text: string }[]>([]);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [personalBest, setPersonalBest] = useState<number | null>(null);

  // OSD glitch state
  const [isLowBatteryGlitching, setIsLowBatteryGlitching] = useState<boolean>(false);
  const [osdLoaded, setOsdLoaded] = useState<boolean>(false);

  // Turbo speed boost mechanic state
  const [turboEnergy, setTurboEnergy] = useState<number>(100);
  const [isTurboActive, setIsTurboActive] = useState<boolean>(false);
  const [isSpeedBurst, setIsSpeedBurst] = useState<boolean>(false);

  // Achievement unlock notification state
  const [achievementToast, setAchievementToast] = useState<string | null>(null);

  // Cumulative statistics for current flight
  const runStatsRef = useRef<{ distance: number; gates: number; topSpeed: number }>({ distance: 0, gates: 0, topSpeed: 0 });

  const [cumulativeDist, setCumulativeDist] = useState<number>(0);
  const [cumulativeGates, setCumulativeGates] = useState<number>(0);
  const [unlockedPalettes, setUnlockedPalettes] = useState<string[]>([]);

  // Physics refs
  const physicsRef = useRef<{
    pos: { x: number; y: number; z: number };
    vel: { x: number; y: number; z: number };
    rot: { pitch: number; roll: number; yaw: number }; // In radians
    angVel: { pitch: number; roll: number; yaw: number };
    throttle: number; // 0 to 1
    inputs: { pitch: number; roll: number; yaw: number; throttle: number };
    telemetryLog: TelemetryPoint[];
    ghostTelemetry: TelemetryPoint[];
    ghostPlaybackIdx: number;
    startTime: number;
    trail: { x: number; y: number; z: number }[];
  }>({
    pos: { x: 0, y: 12, z: 0 },
    vel: { x: 0, y: 0, z: 0 },
    rot: { pitch: 0.1, roll: 0, yaw: 0 },
    angVel: { pitch: 0, roll: 0, yaw: 0 },
    throttle: 0,
    inputs: { pitch: 0, roll: 0, yaw: 0, throttle: 0 },
    telemetryLog: [],
    ghostTelemetry: [],
    ghostPlaybackIdx: 0,
    startTime: 0,
    trail: [],
  });

  // Track user key states
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // --- Refs mirroring state the animation loop READS ---------------------------
  // The physics/render loop must run once and persist for the whole flight. If it
  // depended on these React states it would tear down and rebuild requestAnimationFrame
  // many times per second (every gate, every speed-burst toggle...) causing stutter.
  // We mirror everything the loop reads into refs and keep the effect deps stable.
  const gameStateRef = useRef(gameState);
  const currentGateIdxRef = useRef(0);
  const controlLayoutRef = useRef<'standard' | 'wasd'>('standard');
  const collisionActiveRef = useRef(false);
  const lowBatteryRef = useRef(false);
  const turboActiveRef = useRef(false);
  const speedBurstRef = useRef(false);
  const sprayDecalsRef = useRef<{ x: number; y: number; color: string; scale: number; text: string }[]>([]);
  // Per-frame physics values; flushed to React state at ~14fps for the HUD.
  const batteryRef = useRef(100);
  const turboEnergyRef = useRef(100);
  const speedRef = useRef(0);
  const altitudeRef = useRef(12);
  const lapTimeRef = useRef(0);
  const hudAccumRef = useRef(0);
  const personalBestRef = useRef<number | null>(null);
  const padRestartPrevRef = useRef(false);

  // Keep loop-read refs in sync with React state (cheap, low-frequency).
  // (controlLayout is synced below, after its useState declaration.)
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { sprayDecalsRef.current = sprayDecals; }, [sprayDecals]);
  useEffect(() => { personalBestRef.current = personalBest; }, [personalBest]);

  // Background image preloading
  const levelImageRef = useRef<HTMLImageElement | null>(null);

  // Keyboard layout tip
  const [controlLayout, setControlLayout] = useState<'standard' | 'wasd'>('standard');
  useEffect(() => { controlLayoutRef.current = controlLayout; }, [controlLayout]);

  // Detect a connected controller (browsers require a button press first)
  const [gamepadConnected, setGamepadConnected] = useState(false);
  useEffect(() => {
    const check = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      setGamepadConnected(Array.from(pads).some((g) => g && g.connected));
    };
    window.addEventListener('gamepadconnected', check);
    window.addEventListener('gamepaddisconnected', check);
    check();
    return () => {
      window.removeEventListener('gamepadconnected', check);
      window.removeEventListener('gamepaddisconnected', check);
    };
  }, []);

  // Load Leaderboard / Personal Best & Ghost Data
  useEffect(() => {
    // Entrance animations trigger for OSD
    setTimeout(() => setOsdLoaded(true), 250);

    const storedBest = platform.storage.get(`dronedoit_best_${level.id}`);
    if (storedBest) {
      const bestRecord: LapRecord = JSON.parse(storedBest);
      setPersonalBest(bestRecord.timeMs);
    }

    const dist = parseFloat(platform.storage.get('dronedoit_stat_distance') || '0');
    const gates = parseInt(platform.storage.get('dronedoit_stat_gates') || '0');
    const unlockedStr = platform.storage.get('dronedoit_unlocked_palettes') || '[]';
    let unlockedList: string[] = [];
    try {
      unlockedList = JSON.parse(unlockedStr);
    } catch (e) {
      unlockedList = ['Orange', 'Magenta', 'Cyan', 'Lime'];
    }
    setCumulativeDist(dist);
    setCumulativeGates(gates);
    setUnlockedPalettes(unlockedList);

    const storedGhost = platform.storage.get(`dronedoit_ghost_${level.id}`);
    if (storedGhost) {
      try {
        physicsRef.current.ghostTelemetry = JSON.parse(storedGhost);
      } catch (e) {
        console.error("Failed to load ghost pilot path", e);
      }
    }

    // Preload background prompt graphic
    const img = new Image();
    img.src = level.backgroundImage;
    img.onload = () => {
      levelImageRef.current = img;
    };

    // Reset simulator physics
    resetSimulation();

    return () => {
      sound.stopMotor();
      commitRunStats();
    };
  }, [level]);

  const checkAchievements = (totalDist: number, totalGates: number) => {
    const unlockedStr = platform.storage.get('dronedoit_unlocked_palettes') || '[]';
    let unlocked: string[] = [];
    try {
      unlocked = JSON.parse(unlockedStr);
    } catch (e) {
      unlocked = ['Orange', 'Magenta', 'Cyan', 'Lime'];
    }
    
    const newlyUnlocked: string[] = [];

    if (totalDist >= 1000 && !unlocked.includes('Tokyo Purple')) {
      newlyUnlocked.push('Tokyo Purple');
    }
    if (totalGates >= 20 && !unlocked.includes('Graffiti Yellow')) {
      newlyUnlocked.push('Graffiti Yellow');
    }
    if (totalGates >= 50 && !unlocked.includes('Shibuya Gold')) {
      newlyUnlocked.push('Shibuya Gold');
    }
    
    if (newlyUnlocked.length > 0) {
      const nextUnlocked = [...unlocked, ...newlyUnlocked];
      platform.storage.set('dronedoit_unlocked_palettes', JSON.stringify(nextUnlocked));
      setUnlockedPalettes(nextUnlocked);
      setAchievementToast(`UNLOCKED PALETTE: ${newlyUnlocked.join(', ')}!`);
      sound.playVictory();
      setTimeout(() => setAchievementToast(null), 4000);
    }
  };

  const commitRunStats = () => {
    if (runStatsRef.current.distance <= 0.1 && runStatsRef.current.gates === 0) return;
    
    const storedDist = parseFloat(platform.storage.get('dronedoit_stat_distance') || '0');
    const storedGates = parseInt(platform.storage.get('dronedoit_stat_gates') || '0');
    
    const newDist = storedDist + runStatsRef.current.distance;
    const newGates = storedGates + runStatsRef.current.gates;
    
    platform.storage.set('dronedoit_stat_distance', newDist.toString());
    platform.storage.set('dronedoit_stat_gates', newGates.toString());

    setCumulativeDist(newDist);
    setCumulativeGates(newGates);
    
    // Check achievements
    checkAchievements(newDist, newGates);
    
    // Persist best top speed (km/h) across all runs
    const storedTop = parseFloat(platform.storage.get('dronedoit_stat_topspeed') || '0');
    if (runStatsRef.current.topSpeed > storedTop) {
      platform.storage.set('dronedoit_stat_topspeed', Math.round(runStatsRef.current.topSpeed).toString());
    }

    // Reset run stats for next run
    runStatsRef.current = { distance: 0, gates: 0, topSpeed: 0 };
  };

  const resetSimulation = () => {
    setGameState('countdown');
    setCountdown(3);
    setLapTime(0);
    setCurrentGateIdx(0);
    setBattery(100);
    setSpeed(0);
    setAltitude(18);
    setCollisionActive(false);
    setGraffitiSprayed(false);
    setIsNewRecord(false);
    setTurboEnergy(100);
    setIsTurboActive(false);
    setIsLowBatteryGlitching(false);

    // Reset loop-read refs so the freshly persistent rAF loop sees a clean slate
    currentGateIdxRef.current = 0;
    collisionActiveRef.current = false;
    lowBatteryRef.current = false;
    turboActiveRef.current = false;
    speedBurstRef.current = false;
    batteryRef.current = 100;
    turboEnergyRef.current = 100;
    speedRef.current = 0;
    altitudeRef.current = 18;
    lapTimeRef.current = 0;
    hudAccumRef.current = 0;

    // Start the drone HOVERING instead of at zero throttle, so it holds altitude
    // at launch instead of dropping to the ground before the pilot grabs the sticks.
    // Hover point ≈ gravity/maxThrust ≈ 0.37; 0.40 gives a soft, controllable climb.
    const HOVER_THROTTLE = 0.4;

    // Initial position: airborne over the launch pad, facing the first gate
    physicsRef.current.pos = { x: 0, y: 18, z: -10 };
    physicsRef.current.vel = { x: 0, y: 0, z: 0 };
    physicsRef.current.rot = { pitch: 0, roll: 0, yaw: 0 };
    physicsRef.current.angVel = { pitch: 0, roll: 0, yaw: 0 };
    physicsRef.current.throttle = HOVER_THROTTLE;
    physicsRef.current.inputs = { pitch: 0, roll: 0, yaw: 0, throttle: HOVER_THROTTLE };
    physicsRef.current.telemetryLog = [];
    physicsRef.current.ghostPlaybackIdx = 0;
    physicsRef.current.startTime = Date.now() + 3000; // 3 seconds countdown
    physicsRef.current.trail = [];

    sound.stopMotor();

    // Start countdown timer
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else if (count === 0) {
        setCountdown("FLY!");
      } else {
        clearInterval(interval);
        setGameState('flying');
        physicsRef.current.startTime = Date.now();
        sound.startMotor();
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = true;
      
      // Prevent browser scrolling with arrows or spacebar inside iframe
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Simulator Loop (Physics & Animation rendering)
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const updatePhysics = (dt: number) => {
      if (gameStateRef.current !== 'flying') return;

      const p = physicsRef.current;
      const inputs = p.inputs;

      // Read raw stick TARGETS from the keyboard for the active layout, then
      // smooth the applied inputs toward them so on/off keys feel analogue.
      // Standard FPV Mode 2: Left stick is Throttle/Yaw, Right stick is Pitch/Roll
      let tPitch = 0, tRoll = 0, tYaw = 0;
      if (controlLayoutRef.current === 'standard') {
        // Throttle (W/S) - already a smooth ramp
        if (keysPressed.current['w']) inputs.throttle = Math.min(1, inputs.throttle + 2 * dt);
        else if (keysPressed.current['s']) inputs.throttle = Math.max(0, inputs.throttle - 2 * dt);

        // Yaw (A/D)
        if (keysPressed.current['a']) tYaw = -1;
        else if (keysPressed.current['d']) tYaw = 1;

        // Pitch (Up/I = nose down -> fly forward, Down/K = nose up)
        if (keysPressed.current['arrowup'] || keysPressed.current['i']) tPitch = 1;
        else if (keysPressed.current['arrowdown'] || keysPressed.current['k']) tPitch = -1;

        // Roll (Left/J, Right/L)
        if (keysPressed.current['arrowleft'] || keysPressed.current['j']) tRoll = -1;
        else if (keysPressed.current['arrowright'] || keysPressed.current['l']) tRoll = 1;
      } else {
        // WASD Mode (Casual WASD fly)
        if (keysPressed.current['w']) tPitch = 1;
        else if (keysPressed.current['s']) tPitch = -1;

        if (keysPressed.current['a']) tRoll = -1;
        else if (keysPressed.current['d']) tRoll = 1;

        // Space/Shift for throttle
        if (keysPressed.current[' ']) inputs.throttle = Math.min(1, inputs.throttle + 2 * dt);
        else if (keysPressed.current['shift']) inputs.throttle = Math.max(0, inputs.throttle - 2 * dt);

        // Arrow keys for Yaw
        if (keysPressed.current['arrowleft']) tYaw = -1;
        else if (keysPressed.current['arrowright']) tYaw = 1;
      }

      // --- Gamepad / controller input -----------------------------------------
      // Analogue sticks map straight to the flight targets (Mode 2 by default),
      // overriding the keyboard when a pad is connected. Standard mapping assumed
      // (Xbox/PS/most USB pads report the "standard" gamepad layout).
      let padTurbo = false;
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      let pad = null as Gamepad | null;
      for (const g of pads) { if (g && g.connected) { pad = g; break; } }
      if (pad) {
        const dz = (v: number) => (Math.abs(v) < 0.12 ? 0 : v);
        const lx = dz(pad.axes[0] ?? 0);
        const ly = dz(pad.axes[1] ?? 0);
        const rx = dz(pad.axes[2] ?? 0);
        const ry = dz(pad.axes[3] ?? 0);
        if (controlLayoutRef.current === 'standard') {
          // Mode 2: left stick = throttle (Y) + yaw (X), right stick = pitch (Y) + roll (X)
          inputs.throttle = Math.max(0, Math.min(1, (-ly + 1) / 2));
          tYaw = lx; tPitch = -ry; tRoll = rx;
        } else {
          // Casual: left stick = pitch/roll, right stick = throttle (Y) + yaw (X)
          tPitch = -ly; tRoll = lx;
          inputs.throttle = Math.max(0, Math.min(1, (-ry + 1) / 2));
          tYaw = rx;
        }
        // Turbo on right trigger (7) / RB (5) / A (0)
        padTurbo = !!(pad.buttons[7]?.pressed || pad.buttons[5]?.pressed || pad.buttons[0]?.pressed);
        // Restart on Start button (edge-triggered)
        const startPressed = !!pad.buttons[9]?.pressed;
        if (startPressed && !padRestartPrevRef.current) resetSimulation();
        padRestartPrevRef.current = startPressed;
      }

      // --- Analogue stick smoothing -------------------------------------------
      // Ramp the applied inputs toward the raw targets instead of snapping. This
      // is the single biggest "feel" upgrade for keyboard FPV: gentle stick rise
      // and fall, no jerk. Max deflection (±1) is still reached when a key is held,
      // so top rates are unchanged. Yaw is a touch snappier than pitch/roll.
      const stickEase = Math.min(1, 13 * dt);
      const yawEase = Math.min(1, 16 * dt);
      inputs.pitch += (tPitch - inputs.pitch) * stickEase;
      inputs.roll += (tRoll - inputs.roll) * stickEase;
      inputs.yaw += (tYaw - inputs.yaw) * yawEase;
      if (Math.abs(inputs.pitch) < 0.001) inputs.pitch = 0;
      if (Math.abs(inputs.roll) < 0.001) inputs.roll = 0;
      if (Math.abs(inputs.yaw) < 0.001) inputs.yaw = 0;

      // Live engine audio response
      sound.setThrottle(inputs.throttle);

      // --- Betaflight Rates Calculation ---
      // We convert linear user inputs (-1 to 1) to angular speeds using the Betaflight rate formulas
      // rcRate (base speed), superRate (max deflection boost), expo (center stick damping)
      const calculateAngularSpeed = (input: number, rate: number, superRate: number, expo: number) => {
        const absX = Math.abs(input);
        let expoFactor = input;
        if (expo > 0) {
          expoFactor = input * Math.pow(absX, 3) * expo + input * (1 - expo);
        }
        let radPerSec = 2.0 * rate * expoFactor; // Scale appropriately to radians/sec
        if (superRate > 0) {
          const denom = 1.0 - Math.min(0.99, superRate) * Math.abs(expoFactor);
          radPerSec = radPerSec / denom;
        }
        return radPerSec * 4.5; // multiplier for satisfying speed feel
      };

      const targetPitchRate = calculateAngularSpeed(inputs.pitch, config.rcRate, config.superRate, config.expo);
      const targetRollRate = calculateAngularSpeed(inputs.roll, config.rcRate, config.superRate, config.expo);
      // Yaw typically doesn't use super rates in same profiles, keep it simple and ultra-responsive
      const targetYawRate = inputs.yaw * config.yawRate * 3.5;

      // Pitch, Roll, Yaw rotations based on Flight Mode
      if (config.flightMode === 'ANGLE') {
        // Self-leveling Mode: Stick input determines absolute target pitch/roll angles, lets you hover beautifully!
        const maxAngle = 0.6; // ~35 degrees limit
        const targetPitch = inputs.pitch * maxAngle;
        const targetRoll = inputs.roll * maxAngle;

        // Gently steer towards targets
        p.rot.pitch += (targetPitch - p.rot.pitch) * 8 * dt;
        p.rot.roll += (targetRoll - p.rot.roll) * 8 * dt;
        p.rot.yaw += targetYawRate * dt;
      } else {
        // ACRO Mode: Sticks control exact angular velocities (rotation rates). 
        // No self-leveling! If you rotate 45 degrees, you stay at 45 degrees.
        p.rot.pitch += targetPitchRate * dt;
        p.rot.roll += targetRollRate * dt;
        p.rot.yaw += targetYawRate * dt;
      }

      // Normalise angles
      p.rot.yaw = p.rot.yaw % (Math.PI * 2);

      // --- 3D Flight Physics Vector Math ---
      // Thrust is directed along the drone's localized UP vector
      // We compute the drone's forward, right, and up directions based on Pitch, Roll, and Yaw angles
      const cy = Math.cos(p.rot.yaw);
      const sy = Math.sin(p.rot.yaw);
      const cp = Math.cos(p.rot.pitch);
      const sp = Math.sin(p.rot.pitch);
      const cr = Math.cos(p.rot.roll);
      const sr = Math.sin(p.rot.roll);

      // Local drone up-vector in world coordinates
      const upX = cr * sp * cy + sr * sy;
      const upY = cp * cr;
      const upZ = cr * sp * sy - sr * cy;

      // Forward vector (for air drag and visual tilt)
      const fwdX = cp * cy;
      const fwdY = -sp;
      const fwdZ = cp * sy;

      // Gravity force
      const gravity = 9.81; // m/s^2

      // Check if Turbo boost is requested
      let turboActive = false;
      const wantsTurbo = padTurbo ||
                         (controlLayoutRef.current === 'standard' && keysPressed.current[' ']) ||
                         (controlLayoutRef.current === 'wasd' && (keysPressed.current['shift'] || keysPressed.current['t'] || keysPressed.current['e']));

      if (wantsTurbo && inputs.throttle > 0.1 && turboEnergyRef.current > 0) {
        turboEnergyRef.current = Math.max(0, turboEnergyRef.current - 25 * dt); // depletes in ~4s
        turboActive = turboEnergyRef.current > 0;
      } else {
        turboEnergyRef.current = Math.min(100, turboEnergyRef.current + 12 * dt); // regen in ~8s
      }

      // Update overlay state only on transitions to avoid per-frame React renders.
      const prevTurbo = turboActiveRef.current;
      turboActiveRef.current = turboActive;
      if (turboActive !== prevTurbo) setIsTurboActive(turboActive);

      const speedBurst = inputs.throttle > 0.8 || turboActive;
      const prevBurst = speedBurstRef.current;
      speedBurstRef.current = speedBurst;
      if (speedBurst !== prevBurst) setIsSpeedBurst(speedBurst);

      // Maximum thrust (highly powered drone!)
      const maxThrust = turboActive ? 42.5 : 26.5; 
      const currentThrust = inputs.throttle * maxThrust;

      // Accelerations: Thrust along drone up-vector + gravity pulling straight down
      const ax = upX * currentThrust;
      const ay = upY * currentThrust - gravity;
      const az = upZ * currentThrust;

      // Apply drag forces proportional to velocity squared
      const dragCoeff = 0.08;
      p.vel.x += (ax - p.vel.x * dragCoeff) * dt;
      p.vel.y += (ay - p.vel.y * dragCoeff * 1.5) * dt; // slightly more drag vertically
      p.vel.z += (az - p.vel.z * dragCoeff) * dt;

      // Update positions
      const prevX = p.pos.x;
      const prevY = p.pos.y;
      const prevZ = p.pos.z;

      p.pos.x += p.vel.x * dt * 10;
      p.pos.y += p.vel.y * dt * 10;
      p.pos.z += p.vel.z * dt * 10;

      // Track distance flown this frame
      const dxFlown = p.pos.x - prevX;
      const dyFlown = p.pos.y - prevY;
      const dzFlown = p.pos.z - prevZ;
      const distFlown = Math.sqrt(dxFlown * dxFlown + dyFlown * dyFlown + dzFlown * dzFlown);
      runStatsRef.current.distance += distFlown;

      // Record player trail point
      if (p.trail) {
        p.trail.push({ x: p.pos.x, y: p.pos.y, z: p.pos.z });
        if (p.trail.length > 50) {
          p.trail.shift();
        }
      }

      // Constrain to ground (don't fall through ground)
      if (p.pos.y < 0.2) {
        p.pos.y = 0.2;
        // Bounce or stop vertical velocity
        if (p.vel.y < -3) {
          triggerCrash();
        } else {
          p.vel.y = 0;
          p.vel.x *= 0.8;
          p.vel.z *= 0.8;
        }
      }

      // Sky height boundary
      if (p.pos.y > 180) {
        p.pos.y = 180;
        p.vel.y = 0;
      }

      // Calculate speed (km/h) for HUD OSD
      const rawSpeed = Math.sqrt(p.vel.x * p.vel.x + p.vel.y * p.vel.y + p.vel.z * p.vel.z);
      speedRef.current = Math.round(rawSpeed * 12); // scaled for FPV sensation
      altitudeRef.current = Math.max(0, Math.round(p.pos.y));
      if (speedRef.current > runStatsRef.current.topSpeed) {
        runStatsRef.current.topSpeed = speedRef.current;
      }

      // Slow battery drain (computed every frame, flushed to the HUD on a timer)
      let drain = (0.5 + inputs.throttle * 2.2) * dt;
      const flightTimeMs = Date.now() - p.startTime;
      if (flightTimeMs > 180000) {
        // If time exceeds 3 minutes, drain battery rapidly (per-second, not per-frame)
        drain = Math.max(drain, 10 * dt);
      }
      batteryRef.current = Math.max(0, batteryRef.current - drain);
      if (batteryRef.current < 15 && !lowBatteryRef.current) {
        lowBatteryRef.current = true;
        setIsLowBatteryGlitching(true);
      }

      // Update timer
      lapTimeRef.current = Date.now() - p.startTime;

      // --- Collisions & Gates Passing Logic ---
      const gateIdx = currentGateIdxRef.current;
      const activeGate = level.gates[gateIdx];
      if (activeGate) {
        const dx = p.pos.x - activeGate.x;
        const dy = p.pos.y - activeGate.y;
        const dz = p.pos.z - activeGate.z;
        const distanceToGate = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Check if passing through. FPV check: if drone just crossed the active gate's plane
        // Or if drone is extremely close to the gate's center coordinate (< gate size)
        if (distanceToGate < activeGate.size * 0.7) {
          // Success pass!
          sound.playBeep();
          
          // Trigger a rapid neon flash visual on the screen
          const flash = document.getElementById('screen-neon-flash');
          if (flash) {
            flash.style.opacity = '0.5';
            setTimeout(() => { flash.style.opacity = '0'; }, 100);
          }

          if (gateIdx === level.gates.length - 1) {
            // Finished track!
            currentGateIdxRef.current = gateIdx + 1;
            setCurrentGateIdx(gateIdx + 1);
            setGameState('finished');
            gameStateRef.current = 'finished';
            sound.stopMotor();
            sound.playVictory();
            runStatsRef.current.gates += 1;
            handleRaceFinished();
          } else {
            currentGateIdxRef.current = gateIdx + 1;
            setCurrentGateIdx(gateIdx + 1);
            runStatsRef.current.gates += 1;
          }
        } else if (distanceToGate < activeGate.size * 1.1 && distanceToGate > activeGate.size * 0.7) {
          // Minor collision with gate edge ring! Glitches OSD and bounces back
          if (!collisionActiveRef.current) {
            triggerMinorCollision();
          }
        }
      }

      // Record Telemetry for Replay summaries and Ghost Pilot recording!
      p.telemetryLog.push({
        timeMs: Date.now() - p.startTime,
        throttle: inputs.throttle * 100,
        pitch: p.rot.pitch * (180 / Math.PI),
        yaw: p.rot.yaw * (180 / Math.PI),
        speed: rawSpeed * 12,
        x: p.pos.x,
        y: p.pos.y,
        z: p.pos.z,
      });

      // --- Flush HUD values to React at ~14fps (not every frame) ---------------
      // The canvas keeps rendering at full rAF; only the DOM OSD numbers throttle.
      hudAccumRef.current += dt;
      if (hudAccumRef.current >= 0.07) {
        hudAccumRef.current = 0;
        setSpeed(speedRef.current);
        setAltitude(altitudeRef.current);
        setBattery(batteryRef.current);
        setLapTime(lapTimeRef.current);
        setTurboEnergy(turboEnergyRef.current);
      }
    };

    const triggerMinorCollision = () => {
      collisionActiveRef.current = true;
      setCollisionActive(true);
      sound.playCrash();
      // Drain battery by additional 5%
      batteryRef.current = Math.max(0, batteryRef.current - 5);
      setBattery(batteryRef.current);

      // Bounce drone backward a bit
      physicsRef.current.vel.x *= -0.5;
      physicsRef.current.vel.z *= -0.5;
      physicsRef.current.vel.y += 2.0; // slight lift bounce

      setTimeout(() => {
        collisionActiveRef.current = false;
        setCollisionActive(false);
      }, 500);
    };

    const triggerCrash = () => {
      gameStateRef.current = 'crashed';
      setGameState('crashed');
      sound.stopMotor();
      sound.playCrash();
      const crashes = parseInt(platform.storage.get('dronedoit_stat_crashes') || '0', 10) + 1;
      platform.storage.set('dronedoit_stat_crashes', crashes.toString());
      commitRunStats();
    };

    // Render Canvas Loop
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear Screen
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // --- Draw Realistic 3D Projection Backdrop ---
      const p = physicsRef.current;

      // FPV Camera Angle Translation
      // Camera is rotated by pitch, roll, and yaw, PLUS the FPV camera upward tilt!
      const finalCameraTilt = config.cameraTilt * (Math.PI / 180);
      const camPitch = p.rot.pitch + finalCameraTilt;
      const camRoll = p.rot.roll;
      const camYaw = p.rot.yaw;

      // Utility to project 3D point (world coordinates) to 2D Canvas space
      const project = (x: number, y: number, z: number) => {
        // 1. Translate relative to camera position
        let rx = x - p.pos.x;
        let ry = y - p.pos.y;
        let rz = z - p.pos.z;

        // 2. Rotate around vertical Y axis (Yaw)
        const cosY = Math.cos(-camYaw);
        const sinY = Math.sin(-camYaw);
        let x1 = rx * cosY - rz * sinY;
        let z1 = rx * sinY + rz * cosY;

        // 3. Rotate around lateral X axis (Pitch)
        const cosP = Math.cos(-camPitch);
        const sinP = Math.sin(-camPitch);
        let y2 = ry * cosP - z1 * sinP;
        let z2 = ry * sinP + z1 * cosP;

        // 4. Rotate around longitudinal Z axis (Roll)
        const cosR = Math.cos(-camRoll);
        const sinR = Math.sin(-camRoll);
        let x3 = x1 * cosR - y2 * sinR;
        let y3 = x1 * sinR + y2 * cosR;

        // Clip anything behind camera
        if (z2 <= 2.0) return null;

        // 5. Apply Perspective Projection
        const fov = 350; // Camera focal length / field of view
        const screenX = (x3 * fov) / z2 + width / 2;
        const screenY = (y3 * fov) / z2 + height / 2;

        return { x: screenX, y: screenY, size: fov / z2, depth: z2 };
      };

      // Draw Horizon Sky and Clouds image (Preloaded custom style block backdrop)
      if (levelImageRef.current) {
        // We draw the preloaded prompt image scaled and offset dynamically based on FPV camera yaw and pitch
        // This makes the user feel like they are flying directly inside the generated retro-future city!
        const yawShift = (camYaw * (width / Math.PI)) % width;
        const pitchShift = (camPitch * 150);

        ctx.drawImage(levelImageRef.current, -yawShift, -100 - pitchShift, width, height + 200);
        ctx.drawImage(levelImageRef.current, width - yawShift, -100 - pitchShift, width, height + 200);
        ctx.drawImage(levelImageRef.current, -width - yawShift, -100 - pitchShift, width, height + 200);
      } else {
        // Fallback gradient sky
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#001a33');
        gradient.addColorStop(0.5, '#4a0033');
        gradient.addColorStop(1, '#111111');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw infinity grid ground
      ctx.strokeStyle = level.theme.secondary;
      ctx.lineWidth = 1.2;

      // Ground horizontal perspective grid
      const gridSize = 40;
      const gridRange = 12; // Draw grids in a box around player
      const startGridX = Math.floor(p.pos.x / gridSize) - gridRange;
      const endGridX = Math.ceil(p.pos.x / gridSize) + gridRange;
      const startGridZ = Math.floor(p.pos.z / gridSize) - gridRange;
      const endGridZ = Math.ceil(p.pos.z / gridSize) + gridRange;

      // Draw gridlines
      for (let gx = startGridX; gx <= endGridX; gx++) {
        const xVal = gx * gridSize;
        ctx.beginPath();
        let activeLine = false;
        for (let gz = startGridZ; gz <= endGridZ; gz++) {
          const zVal = gz * gridSize;
          const proj = project(xVal, 0, zVal);
          if (proj) {
            if (!activeLine) {
              ctx.moveTo(proj.x, proj.y);
              activeLine = true;
            } else {
              ctx.lineTo(proj.x, proj.y);
            }
          } else {
            activeLine = false;
          }
        }
        ctx.stroke();
      }

      for (let gz = startGridZ; gz <= endGridZ; gz++) {
        const zVal = gz * gridSize;
        ctx.beginPath();
        let activeLine = false;
        for (let gx = startGridX; gx <= endGridX; gx++) {
          const xVal = gx * gridSize;
          const proj = project(xVal, 0, zVal);
          if (proj) {
            if (!activeLine) {
              ctx.moveTo(proj.x, proj.y);
              activeLine = true;
            } else {
              ctx.lineTo(proj.x, proj.y);
            }
          } else {
            activeLine = false;
          }
        }
        ctx.stroke();
      }

      // Draw Landing Start Pad
      const startPadProj = project(0, 0.1, 0);
      if (startPadProj) {
        ctx.strokeStyle = '#ff6b00';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(startPadProj.x, startPadProj.y, startPadProj.size * 10, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 107, 0, 0.2)';
        ctx.fill();

        // Label on start pad
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = '#ff6b00';
        ctx.textAlign = 'center';
        ctx.fillText("START PAD (LAUNCH)", startPadProj.x, startPadProj.y);

        // Render any spray decals on the landing pad!
        sprayDecalsRef.current.forEach(dec => {
          const decProj = project(dec.x, 0.2, 0);
          if (decProj) {
            ctx.fillStyle = dec.color;
            ctx.font = `italic black ${Math.round(24 * dec.scale)}px sans-serif`;
            ctx.fillText(dec.text, decProj.x, decProj.y);
            // Splatter blobs
            ctx.beginPath();
            ctx.arc(decProj.x - 20, decProj.y + 10, 4, 0, Math.PI * 2);
            ctx.arc(decProj.x + 35, decProj.y - 15, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // --- Draw Course Hoop Gates in 3D ---
      level.gates.forEach((gate, idx) => {
        const proj = project(gate.x, gate.y, gate.z);
        if (!proj) return;

        const isCurrent = idx === currentGateIdxRef.current;
        const isPassed = idx < currentGateIdxRef.current;

        // Neon Glow effect
        ctx.shadowBlur = isCurrent ? 25 : 5;
        ctx.shadowColor = isCurrent ? level.theme.primary : level.theme.secondary;

        ctx.strokeStyle = isCurrent 
          ? level.theme.primary 
          : (isPassed ? 'rgba(0, 229, 255, 0.25)' : level.theme.secondary);
        
        ctx.lineWidth = isCurrent ? 6 : 2.5;

        // Draw Gates (Hoops or Squares)
        if (gate.type === 'hoop') {
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, gate.size * proj.size, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          const s = gate.size * proj.size;
          ctx.strokeRect(proj.x - s, proj.y - s, s * 2, s * 2);
        }

        // Draw gate checkpoint label with "Jet Set" graffiti numbering
        ctx.shadowBlur = 0; // reset shadow for text
        ctx.font = 'black 14px monospace';
        ctx.fillStyle = isCurrent ? '#ffffff' : level.theme.secondary;
        ctx.textAlign = 'center';
        ctx.fillText(`GATE ${idx + 1}`, proj.x, proj.y - (gate.size * proj.size) - 10);

        // Draw a guiding direction helper arrow from active gate towards next gate
        if (isCurrent && idx < level.gates.length - 1) {
          const nextGate = level.gates[idx + 1];
          const nextProj = project(nextGate.x, nextGate.y, nextGate.z);
          if (nextProj) {
            ctx.strokeStyle = '#b6ff00';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(proj.x, proj.y);
            ctx.lineTo(nextProj.x, nextProj.y);
            ctx.stroke();
          }
        }
      });

      // --- Draw Ghost Pilot Replay Run & Trail ---
      if (physicsRef.current.ghostTelemetry.length > 0) {
        const ghostIdx = Math.min(
          physicsRef.current.ghostPlaybackIdx,
          physicsRef.current.ghostTelemetry.length - 1
        );
        const ghostPt = physicsRef.current.ghostTelemetry[ghostIdx];

        // 1. Draw Ghost Ribbon Trail
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00e5ff';
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        let firstGhostPt = true;
        const startIdx = Math.max(0, ghostIdx - 50);
        for (let i = startIdx; i <= ghostIdx; i++) {
          const pt = physicsRef.current.ghostTelemetry[i];
          if (!pt) continue;
          const proj = project(pt.x, pt.y, pt.z);
          if (proj) {
            if (firstGhostPt) {
              ctx.moveTo(proj.x, proj.y);
              firstGhostPt = false;
            } else {
              ctx.lineTo(proj.x, proj.y);
            }
          }
        }
        ctx.stroke();
        ctx.restore();

        // 2. Draw Ghost Drone
        if (ghostPt) {
          const ghostProj = project(ghostPt.x, ghostPt.y, ghostPt.z);
          if (ghostProj) {
            // Draw translucent glowing neon quadcopter for the Ghost!
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00e5ff';
            ctx.fillStyle = 'rgba(0, 229, 255, 0.45)';
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2.5;

            // Simple 3D wireframe cross/quadcopter shape
            const r = 4.5 * ghostProj.size;
            ctx.beginPath();
            ctx.arc(ghostProj.x, ghostProj.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Arms representing 4 motors
            ctx.beginPath();
            ctx.moveTo(ghostProj.x - r, ghostProj.y - r);
            ctx.lineTo(ghostProj.x + r, ghostProj.y + r);
            ctx.moveTo(ghostProj.x - r, ghostProj.y + r);
            ctx.lineTo(ghostProj.x + r, ghostProj.y - r);
            ctx.stroke();

            // Label
            ctx.shadowBlur = 0;
            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = '#00e5ff';
            ctx.fillText("GHOST PILOT PB", ghostProj.x, ghostProj.y - r - 6);
          }

          // Advance ghost index if currently flying
          if (gameStateRef.current === 'flying') {
            physicsRef.current.ghostPlaybackIdx++;
          }
        }
      }

      // --- Draw Player's Own 3D Trail Ribbon ---
      if (physicsRef.current.trail && physicsRef.current.trail.length > 1) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = config.ledColor || '#ff2e93';
        ctx.strokeStyle = `${config.ledColor}66` || 'rgba(255, 46, 147, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        let firstPlayerPt = true;
        physicsRef.current.trail.forEach(pt => {
          const proj = project(pt.x, pt.y, pt.z);
          if (proj) {
            if (firstPlayerPt) {
              ctx.moveTo(proj.x, proj.y);
              firstPlayerPt = false;
            } else {
              ctx.lineTo(proj.x, proj.y);
            }
          }
        });
        ctx.stroke();
        ctx.restore();
      }

      // --- Draw Manga Speed Lines ---
      const isSpeedBurstDraw = p.inputs.throttle > 0.8 || turboActiveRef.current;
      if (speedRef.current > 35 || isSpeedBurstDraw) {
        ctx.save();
        ctx.strokeStyle = isSpeedBurstDraw
          ? (turboActiveRef.current ? 'rgba(255, 46, 147, 0.8)' : 'rgba(255, 255, 255, 0.8)')
          : 'rgba(0, 229, 255, 0.35)';
        ctx.lineWidth = isSpeedBurstDraw ? 3.0 : 1.8;
        const lineCount = isSpeedBurstDraw ? 48 : 14;
        for (let i = 0; i < lineCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radiusInner = width * (isSpeedBurstDraw ? (0.2 + Math.random() * 0.15) : (0.32 + Math.random() * 0.18));
          const radiusOuter = width * 0.85;
          const startX = width / 2 + Math.cos(angle) * radiusInner;
          const startY = height / 2 + Math.sin(angle) * radiusInner;
          const endX = width / 2 + Math.cos(angle) * radiusOuter;
          const endY = height / 2 + Math.sin(angle) * radiusOuter;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        ctx.restore();
      }

      // --- Draw Collision Screen Shake & OSD Static Glitch effects ---
      if (collisionActiveRef.current || lowBatteryRef.current) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 46, 147, 0.1)';
        ctx.fillRect(0, 0, width, height);

        // draw random digital glitch scanlines and rectangles
        const glitchLines = Math.floor(Math.random() * 8) + 2;
        for (let i = 0; i < glitchLines; i++) {
          const yPos = Math.random() * height;
          const glitchHeight = Math.random() * 15 + 2;
          ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0, 229, 255, 0.35)' : 'rgba(255, 46, 147, 0.35)';
          ctx.fillRect(Math.random() * 80 - 40, yPos, width + 100, glitchHeight);
        }
        ctx.restore();
      }
    };

    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000); // capped at 50ms to prevent huge jumps on lag
      lastTime = time;

      updatePhysics(dt);
      draw();

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
    };
    // Intentionally stable: the loop reads live values from refs, so it mounts
    // ONCE and persists for the whole flight instead of tearing down each frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRaceFinished = () => {
    // Career counter: races finished
    const races = parseInt(platform.storage.get('dronedoit_stat_races') || '0', 10) + 1;
    platform.storage.set('dronedoit_stat_races', races.toString());

    // Check for personal record
    const finalTime = Date.now() - physicsRef.current.startTime;
    const isNew = personalBestRef.current === null || finalTime < personalBestRef.current;

    if (isNew) {
      setIsNewRecord(true);
      personalBestRef.current = finalTime;
      setPersonalBest(finalTime);

      const record: LapRecord = {
        levelId: level.id,
        pilotName: "YOU",
        timeMs: finalTime,
        date: new Date().toLocaleDateString(),
        droneFrame: config.frameType,
      };

      platform.storage.set(`dronedoit_best_${level.id}`, JSON.stringify(record));
      // Save entire coordinates trajectory log for future Ghost replays!
      platform.storage.set(`dronedoit_ghost_${level.id}`, JSON.stringify(physicsRef.current.telemetryLog));
      // Steam build uploads this to the per-level leaderboard (no-op on web).
      platform.submitScore(level.id, finalTime);
    }

    // Check if under par time for emerald achievement
    if (finalTime <= level.parTimeMs) {
      const unlockedStr = platform.storage.get('dronedoit_unlocked_palettes') || '[]';
      let unlocked: string[] = [];
      try {
        unlocked = JSON.parse(unlockedStr);
      } catch (e) {
        unlocked = ['Orange', 'Magenta', 'Cyan', 'Lime'];
      }
      if (!unlocked.includes('Beat Special Emerald')) {
        const nextUnlocked = [...unlocked, 'Beat Special Emerald'];
        platform.storage.set('dronedoit_unlocked_palettes', JSON.stringify(nextUnlocked));
        setAchievementToast("UNLOCKED: Beat Special Emerald (Beat the par time!)");
        sound.playVictory();
        setTimeout(() => setAchievementToast(null), 4000);
      }
    }

    commitRunStats();
  };

  const applyGraffitiSpray = () => {
    if (!graffitiTag.trim()) return;

    // Place a neon tag at the landing platform area
    const newDecal = {
      x: physicsRef.current.pos.x + (Math.random() * 10 - 5),
      y: physicsRef.current.pos.z + (Math.random() * 10 - 5),
      color: config.ledColor || '#ff2e93',
      scale: 1 + Math.random() * 0.5,
      text: graffitiTag.toUpperCase(),
    };

    setSprayDecals(prev => [...prev, newDecal]);
    setGraffitiSprayed(true);
    sound.playBeep();
  };

  // Convert milliseconds to beautiful lap timer format (MM:SS.CC)
  const formatTime = (ms: number) => {
    if (ms < 0) ms = 0;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col xl:flex-row gap-6 p-6 dot-grid overflow-y-auto">
      
      {/* LEFT: Game Screen Frame */}
      <div className="flex-1 flex flex-col gap-4">
        {/* HUD/Header */}
        <div className="bg-black text-white p-4 outline-ink flex justify-between items-center relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="bg-[#ff6b00] text-black font-black italic uppercase px-3 py-1 skew-box text-sm">
              LIVE BROADCAST
            </div>
            <h1 className="text-xl font-black italic tracking-tight uppercase text-[#00e5ff]">{level.name}</h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-neutral-500 mr-1">DIFFICULTY:</span>
              <span className={`font-black ${level.difficulty === 'EASY' ? 'text-[#b6ff00]' : level.difficulty === 'MEDIUM' ? 'text-[#ff6b00]' : 'text-[#ff2e93]'}`}>
                {level.difficulty}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 mr-1">PAR TIME:</span>
              <span className="text-white font-bold">{formatTime(level.parTimeMs)}</span>
            </div>
          </div>
        </div>

        {/* FPV Iframe screen container */}
        <div className="relative w-full aspect-video bg-neutral-950 outline-ink rounded-lg overflow-hidden group">
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={854}
            height={480}
            className="w-full h-full object-cover"
          />

          {/* Screen-edge speed blur overlay */}
          {isSpeedBurst && (
            <div 
              id="speed-burst-blur"
              className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_80px_rgba(255,255,255,0.4)] backdrop-blur-[3px] transition-all duration-300"
              style={{
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 15% 15%, 15% 85%, 85% 85%, 85% 15%, 15% 15%)'
              }}
            />
          )}

          {/* Screen neon flash helper */}
          <div
            id="screen-neon-flash"
            className="absolute inset-0 bg-[#00e5ff] opacity-0 transition-opacity duration-100 pointer-events-none z-10"
          />

          {/* OSD Betaflight Overlay (Slide In Entrances with retro Glitch) */}
          <div className={`absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 font-mono text-xs text-green-400 font-bold ${osdLoaded ? 'animate-osd-entrance' : 'opacity-0'} ${isLowBatteryGlitching || collisionActive ? 'animate-damage-state text-red-500' : ''}`}>
            {/* Top OSD Bar */}
            <div className="flex justify-between items-start">
              {/* Battery Status Component & FQV Info */}
              <div className="flex flex-col gap-1.5">
                <div className="bg-black/85 px-3 py-1.5 rounded flex items-center gap-2 border border-green-500/30">
                  <Radio className="w-3.5 h-3.5 text-green-400 animate-pulse" />
                  <span>FQV · {config.frameType.toUpperCase()}</span>
                </div>
                {/* Y2K segmented battery progress bar and voltage readout */}
                <div className="bg-black/85 px-3 py-2 rounded border border-green-500/30 flex items-center gap-2 max-w-[190px]">
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex justify-between text-[8px] tracking-wide text-green-300">
                      <span>BAT VOLTS</span>
                      <span className={battery < 15 || (lapTime > 180000) ? 'text-red-500 animate-pulse font-bold' : 'text-green-400'}>
                        {(14.0 + (battery / 100) * 2.8).toFixed(1)}V
                      </span>
                    </div>
                    <div className="flex gap-0.5 bg-neutral-900 p-0.5 rounded border border-green-500/10">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 flex-1 ${
                            i < Math.ceil(battery / 10)
                              ? battery < 20 || (lapTime > 180000)
                                ? 'bg-red-500 animate-pulse'
                                : 'bg-green-400'
                              : 'bg-neutral-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className={`text-[10px] font-black ${battery < 20 || (lapTime > 180000) ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
                    {battery.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Pilot Call-sign Badge (JSR Graffiti Aesthetic) */}
              <div className="bg-yellow-400 text-black border-2 border-black font-black italic px-4 py-1.5 skew-x-12 uppercase tracking-widest shadow-[3px_3px_0_rgba(0,0,0,1)] text-[11px] pointer-events-auto select-all animate-pulse">
                ⚡ {config.pilotCallsign || 'GRAFF_RACER'} ⚡
              </div>

              <div className="flex flex-col gap-1.5 items-end">
                <div className="bg-black/85 px-3 py-1.5 rounded flex items-center gap-2 border border-green-500/30">
                  <Shield className="w-3.5 h-3.5 text-green-400" />
                  <span>MODE: {config.flightMode}</span>
                </div>

                <div className="bg-black/85 px-3 py-1.5 rounded border border-green-500/30 text-right">
                  <div className="text-green-300">RSSI: 99%</div>
                  <div className="text-[9px] text-white/50">CH 1 5.8G</div>
                </div>
              </div>
            </div>

            {/* Middle OSD: Crosshair Horizon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-24 h-24 border border-green-500/25 rounded-full flex items-center justify-center">
                {/* Center crosshair */}
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                {/* Horizon lines */}
                <div className="absolute left-[-20px] top-1/2 w-8 h-[2px] bg-green-400"></div>
                <div className="absolute right-[-20px] top-1/2 w-8 h-[2px] bg-green-400"></div>
              </div>
            </div>

            {/* Bottom Left/Right OSD meters */}
            <div className="flex justify-between items-end mt-auto gap-2">
              <div className="bg-black/60 p-2.5 rounded border border-green-500/30 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-white">ALTITUDE: {altitude}m</span>
                </div>
                <div>SPD: <span className="text-white font-black text-sm">{speed}</span> km/h</div>
              </div>

              {/* Turbo Energy Bar Meter */}
              <div className="bg-black/60 p-2.5 rounded border border-green-500/30 space-y-1 w-44">
                <div className="flex justify-between text-[10px] items-center">
                  <span>TURBO BOOST</span>
                  <span className={turboEnergy < 30 ? 'text-red-400 animate-pulse font-black' : 'text-[#ff2e93]'}>
                    {Math.round(turboEnergy)}%
                  </span>
                </div>
                <div className="w-full bg-neutral-800 h-2 rounded overflow-hidden border border-neutral-700">
                  <div 
                    className="bg-gradient-to-r from-[#ff6b00] to-[#ff2e93] h-full transition-all duration-75"
                    style={{ width: `${turboEnergy}%` }}
                  />
                </div>
                <div className="text-[8px] text-neutral-400 text-center animate-pulse mt-0.5">
                  {controlLayout === 'standard' ? '[SPACEBAR] BOOST' : '[SHIFT] BOOST'}
                </div>
              </div>

              {/* Progress & Checkpoint */}
              <div className="flex flex-col items-center justify-center bg-black/60 px-4 py-2 rounded border border-green-500/30">
                <div className="text-white/60 text-[9px] uppercase tracking-widest">Waypoint Target</div>
                <div className="text-[#b6ff00] text-sm font-black">
                  GATE {currentGateIdx + 1}/{level.gates.length}
                </div>
              </div>

              <div className="bg-black/60 p-2.5 rounded border border-green-500/30 text-right space-y-1">
                <div className="text-white/60">LAP TIME</div>
                <div className="text-white font-black text-base tracking-widest font-mono">
                  {formatTime(lapTime)}
                </div>
              </div>
            </div>

            {/* Warning Alarm Indicator */}
            {(isLowBatteryGlitching || (lapTime > 180000)) && (
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-black/95 border-4 border-[#ff2e93] text-[#ff2e93] px-6 py-4 rounded-xl flex flex-col items-center gap-2 animate-bounce z-20 shadow-[0_0_30px_rgba(255,46,147,0.5)] max-w-sm text-center pointer-events-auto">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 animate-pulse text-[#ff2e93]" />
                  <span className="font-black text-sm uppercase tracking-wider text-[#ff2e93]">LOW BATTERY ALARM</span>
                </div>
                <div className="font-mono text-[11px] uppercase tracking-wide text-white">
                  {lapTime > 180000 ? (
                    <span className="text-[#ff6b00] font-black">FLIGHT TIME EXCEEDED (3:00 MINS)</span>
                  ) : (
                    <span className="font-bold">CHARGE DEPLETED UNDER 15%</span>
                  )}
                </div>
                <div className="bg-red-950/80 text-white font-mono font-black text-xs px-3 py-1 mt-1 border border-red-500 animate-pulse rounded">
                  VOLTAGE: {(14.0 + (battery / 100) * 2.8).toFixed(1)}V
                </div>
              </div>
            )}

            {/* Achievement Toast */}
            {achievementToast && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-yellow-950/90 border-2 border-[#b6ff00] text-[#b6ff00] px-5 py-3 rounded-xl flex items-center gap-3 animate-global-glitch z-40 shadow-[0_0_15px_rgba(182,255,0,0.4)]">
                <Sparkles className="w-5 h-5 animate-pulse text-yellow-300" />
                <div className="text-left">
                  <div className="text-[10px] text-white/60 tracking-widest uppercase">ACHIEVEMENT UNLOCKED!</div>
                  <span className="font-black text-sm text-white tracking-tight">{achievementToast}</span>
                </div>
              </div>
            )}
          </div>

          {/* COUNTDOWN OVERLAY */}
          {gameState === 'countdown' && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 backdrop-blur-sm">
              <span className="text-[10px] font-mono text-neutral-400 tracking-widest uppercase mb-4 bg-black/80 px-3 py-1 border border-neutral-800 rounded">
                ⚡ INITIALIZING SYNC SYSTEM ⚡
              </span>
              <div 
                key={countdown} 
                className="text-9xl font-black italic tracking-tighter select-none animate-pop-bounce text-cel-shaded"
              >
                {countdown}
              </div>
              <div className="mt-10 text-center text-[10px] font-mono text-neutral-400 uppercase tracking-wider space-y-1 bg-black/80 px-4 py-2 border border-neutral-800 rounded">
                <p className="text-[#b6ff00] font-black">READY PLAYER ONE</p>
                <p className="opacity-70">Controls: {controlLayout === 'standard' ? 'W/S (Throttle) | A/D (Yaw) | I/K (Pitch) | J/L (Roll)' : 'W/S/A/D (Pitch/Roll) | Space/Shift (Throttle) | Left/Right (Yaw)'}</p>
              </div>
            </div>
          )}

          {/* CRASHED OVERLAY */}
          {gameState === 'crashed' && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-30">
              <div className="bg-[#ff2e93] text-black font-black text-xl px-4 py-2 skew-box mb-4 outline-ink uppercase">
                CRITICAL DAMAGE - DISARMED
              </div>
              <p className="text-neutral-400 text-sm max-w-md text-center mb-6">
                Your drone clip-on prop hit a concrete pylon structural guard. Betaflight disarmed to prevent battery fire.
              </p>
              <div className="flex gap-4">
                <button
                  id="btn-restart-crash"
                  onClick={resetSimulation}
                  className="bg-[#b6ff00] text-black font-black px-6 py-2.5 rounded-lg border-2 border-black shadow-[4px_4px_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> REBOOT & TRY AGAIN
                </button>
                <button
                  id="btn-quit-crash"
                  onClick={onBackToMenu}
                  className="bg-white text-black font-black px-6 py-2.5 rounded-lg border-2 border-black shadow-[4px_4px_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase cursor-pointer"
                >
                  EXIT ARENA
                </button>
              </div>
            </div>
          )}

          {/* FINISHED VICTORY OVERLAY */}
          {gameState === 'finished' && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 overflow-y-auto p-4">
              <div className="bg-[#b6ff00] text-black font-black text-3xl px-6 py-2 skew-box mb-3 outline-ink uppercase tracking-tight flex items-center gap-2">
                <Flame className="w-8 h-8 fill-current text-black animate-bounce" />
                RACE COMPLETE!
              </div>
              
              <div className="text-center mb-4">
                <span className="text-neutral-500 text-[10px] uppercase font-mono">FINISH TIME</span>
                <h3 className="text-4xl font-black font-mono text-[#00e5ff] tracking-widest">{formatTime(lapTime)}</h3>
              </div>

              {/* Record / PB Spray Tag UI */}
              {isNewRecord ? (
                <div className="bg-neutral-900 border-2 border-[#ff2e93] p-4 rounded-xl max-w-md w-full mb-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#ff2e93] text-black text-[9px] font-black uppercase px-2 py-0.5">
                    NEW PB RECORD
                  </div>
                  <h4 className="text-xs font-bold uppercase text-[#ff2e93] flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-4 h-4 text-[#b6ff00]" /> SPRAY YOUR CELEBRITY TAG!
                  </h4>
                  <p className="text-[11px] text-neutral-400 mb-3">
                    You beat the track record. Spray paint your name or custom logo onto the landing strip platform:
                  </p>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={12}
                      value={graffitiTag}
                      onChange={(e) => setGraffitiTag(e.target.value)}
                      className="bg-black text-white font-black border border-neutral-800 rounded px-3 py-1.5 text-sm uppercase flex-1"
                      placeholder="GRAFFITI TAG..."
                    />
                    <button
                      id="btn-spray-paint"
                      disabled={graffitiSprayed}
                      onClick={applyGraffitiSpray}
                      className={`px-4 py-1.5 font-black text-xs uppercase rounded cursor-pointer ${graffitiSprayed ? 'bg-neutral-800 text-neutral-500' : 'bg-[#ff6b00] hover:bg-[#ff2e93] text-black'}`}
                    >
                      <Palette className="w-3.5 h-3.5 inline mr-1" />
                      {graffitiSprayed ? "SPRAYED!" : "SPRAY TAG"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg text-xs max-w-sm text-center text-neutral-400 mb-4">
                  <span>Track Personal Best: <strong className="text-white font-mono">{personalBest ? formatTime(personalBest) : 'N/A'}</strong></span>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  id="btn-retry-victory"
                  onClick={resetSimulation}
                  className="bg-[#00e5ff] text-black font-black px-5 py-2 rounded-lg border-2 border-black shadow-[4px_4px_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> RUN AGAIN
                </button>
                <button
                  id="btn-back-victory"
                  onClick={onBackToMenu}
                  className="bg-white text-black font-black px-5 py-2 rounded-lg border-2 border-black shadow-[4px_4px_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase cursor-pointer"
                >
                  MENU
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Flight telemetry & Replay Analytics */}
      <div className="w-full xl:w-96 flex flex-col gap-6">
        
        {/* Real-time flight control reference card */}
        <div className="bg-black text-white p-5 outline-ink relative">
          <h2 className="text-lg font-black uppercase text-[#ff2e93] italic tracking-tight mb-2">
            FPV Control Deck
          </h2>

          {/* Controller status + mapping */}
          <div className={`mb-3 rounded border px-3 py-2 text-[11px] font-mono flex items-center gap-2 ${
            gamepadConnected ? 'bg-[#b6ff00]/10 border-[#b6ff00]/40 text-[#b6ff00]' : 'bg-neutral-950 border-neutral-800 text-neutral-500'
          }`}>
            <span className={`w-2 h-2 rounded-full ${gamepadConnected ? 'bg-[#b6ff00] animate-pulse' : 'bg-neutral-600'}`} />
            {gamepadConnected ? (
              <span>GAMEPAD CONNECTED · L-stick throttle/yaw · R-stick pitch/roll · RT boost · Start restart</span>
            ) : (
              <span>Controller supported — connect a pad and press a button to activate</span>
            )}
          </div>

          <div className="flex gap-2 rounded bg-neutral-950 p-1 mb-3 text-xs border border-neutral-800">
            <button
              onClick={() => setControlLayout('standard')}
              className={`flex-1 py-1 rounded font-bold uppercase transition ${controlLayout === 'standard' ? 'bg-[#ff2e93] text-white' : 'text-neutral-400 hover:text-white'}`}
            >
              Mode 2 (Pro)
            </button>
            <button
              onClick={() => setControlLayout('wasd')}
              className={`flex-1 py-1 rounded font-bold uppercase transition ${controlLayout === 'wasd' ? 'bg-[#ff2e93] text-white' : 'text-neutral-400 hover:text-white'}`}
            >
              Casual WASD
            </button>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {controlLayout === 'standard' ? (
              <>
                <div className="flex justify-between border-b border-neutral-800 pb-1">
                  <span className="text-neutral-400">THROTTLE:</span>
                  <span className="text-[#00e5ff] font-bold">W / S keys</span>
                </div>
                <div className="flex justify-between border-b border-neutral-800 pb-1">
                  <span className="text-neutral-400">YAW (Pan Left/Right):</span>
                  <span className="text-[#00e5ff] font-bold">A / D keys</span>
                </div>
                <div className="flex justify-between border-b border-neutral-800 pb-1">
                  <span className="text-neutral-400">PITCH (Tilt Nose):</span>
                  <span className="text-[#00e5ff] font-bold">I / K keys or Up/Down Arrows</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">ROLL (Lean Side):</span>
                  <span className="text-[#00e5ff] font-bold">J / L keys or Left/Right Arrows</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between border-b border-neutral-800 pb-1">
                  <span className="text-neutral-400">THROTTLE:</span>
                  <span className="text-[#00e5ff] font-bold">Space (Up) / Shift (Down)</span>
                </div>
                <div className="flex justify-between border-b border-neutral-800 pb-1">
                  <span className="text-neutral-400">YAW (Heading):</span>
                  <span className="text-[#00e5ff] font-bold">Left / Right Arrow keys</span>
                </div>
                <div className="flex justify-between border-b border-neutral-800 pb-1">
                  <span className="text-neutral-400">PITCH (Forward/Back):</span>
                  <span className="text-[#00e5ff] font-bold">W / S keys</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">ROLL (Bank Left/Right):</span>
                  <span className="text-[#00e5ff] font-bold">A / D keys</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* CUMULATIVE STATS & UNLOCKED PALETTES */}
        <div className="bg-black text-white p-5 outline-ink relative">
          <h2 className="text-md font-black uppercase text-[#b6ff00] italic tracking-tight mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#ff2e93] animate-pulse" />
            UNLOCKED ARENA GEAR
          </h2>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
              <div className="text-[9px] text-neutral-500 uppercase">Total Distance</div>
              <div className="text-[#00e5ff] font-black text-sm">{Math.round(cumulativeDist)}m</div>
              <div className="w-full bg-neutral-900 h-1 rounded overflow-hidden mt-1">
                <div className="bg-[#00e5ff] h-full" style={{ width: `${Math.min(100, (cumulativeDist / 1000) * 100)}%` }} />
              </div>
              <div className="text-[8px] text-neutral-500 mt-0.5">1000m target</div>
            </div>
            <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
              <div className="text-[9px] text-neutral-500 uppercase">Total Gates</div>
              <div className="text-[#b6ff00] font-black text-sm">{cumulativeGates}</div>
              <div className="w-full bg-neutral-900 h-1 rounded overflow-hidden mt-1">
                <div className="bg-[#b6ff00] h-full" style={{ width: `${Math.min(100, (cumulativeGates / 50) * 100)}%` }} />
              </div>
              <div className="text-[8px] text-neutral-500 mt-0.5">50 gates target</div>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-neutral-400 font-bold uppercase mb-1.5">Custom Color Frames:</div>
            <div className="flex flex-wrap gap-1.5">
              {['Orange', 'Magenta', 'Cyan', 'Lime', 'Tokyo Purple', 'Graffiti Yellow', 'Shibuya Gold', 'Beat Special Emerald'].map(pal => {
                const isUnlocked = unlockedPalettes.includes(pal) || ['Orange', 'Magenta', 'Cyan', 'Lime'].includes(pal);
                return (
                  <span 
                    key={pal} 
                    className={`text-[9px] px-2 py-0.5 font-bold rounded-md border ${isUnlocked ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-neutral-950 border-neutral-900 text-neutral-600 line-through'}`}
                  >
                    {isUnlocked ? '✓' : '🔒'} {pal}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* REPLAY ANALYTICS CHART PANEL */}
        <div className="bg-neutral-900 border-2 border-neutral-800 p-5 rounded-2xl text-white flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black uppercase text-[#b6ff00] tracking-wider flex items-center gap-1.5 mb-1">
              <BarChart2 className="w-4 h-4 text-[#ff2e93]" />
              RACE PERFORMANCE SUMMARY
            </h3>
            <p className="text-[10px] text-neutral-400 mb-4">
              Real-time telemetry analysis. Complete a lap to map and study throttle, pitch, and yaw vectors.
            </p>
          </div>

          <div className="flex-1 min-h-[180px] bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center relative overflow-hidden">
            {physicsRef.current.telemetryLog.length > 5 ? (
              <div className="w-full h-full text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={physicsRef.current.telemetryLog.filter((_, idx) => idx % 4 === 0).slice(-45)} // Decimate points to avoid recharts bloat
                    margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="timeMs" tickFormatter={(tick) => `${(tick / 1000).toFixed(1)}s`} stroke="#555" />
                    <YAxis stroke="#555" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111', borderColor: '#444' }}
                      labelFormatter={(label) => `Time: ${(Number(label)/1000).toFixed(2)}s`}
                    />
                    <Legend wrapperStyle={{ fontSize: '9px' }} />
                    <Line type="monotone" dataKey="throttle" stroke="#ff6b00" name="Throttle %" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="pitch" stroke="#ff2e93" name="Pitch Angle" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="speed" stroke="#00e5ff" name="Speed km/h" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center p-4">
                <Zap className="w-8 h-8 text-neutral-600 mx-auto mb-2 animate-bounce" />
                <span className="text-[11px] text-neutral-500 block">START FLYING TO RECORD LIVE telemetry...</span>
              </div>
            )}
          </div>

          <div className="mt-4 bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-1.5 text-[11px] text-neutral-400">
            <div className="font-bold text-neutral-300 uppercase flex items-center gap-1 text-[10px]">
              <CheckCircle className="w-3.5 h-3.5 text-[#00e5ff]" /> Ghost Telemetry Engine
            </div>
            {physicsRef.current.ghostTelemetry.length > 0 ? (
              <p className="text-[#00e5ff]">• GHOST PILOT ACTIVE: Currently playing back your historic personal best coordinates dynamically.</p>
            ) : (
              <p>• NO GHOST: Complete one perfect, fast run to generate your dynamic flight shadow clone path!</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
