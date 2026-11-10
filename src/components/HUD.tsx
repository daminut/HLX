import React from 'react';
import { PlayerStats, WeaponId } from '../game/types';
import { getMissionPhase } from '../game/combat';
import { Volume2, VolumeX, Pause, Radio, Zap, Crosshair as CrosshairIcon, Shield, Heart } from 'lucide-react';

interface HUDProps {
  stats: PlayerStats;
  message: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onSelectWeapon: (id: WeaponId) => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  message,
  isMuted,
  onToggleMute,
  onPause,
  onSelectWeapon,
}) => {
  const mission = getMissionPhase(
    stats.powerCoresInserted,
    stats.bossDefeated,
    false
  );

  const weaponsList: { id: WeaponId; key: string; label: string; ammoText: string }[] = [
    { id: 'crowbar', key: '1', label: 'CROWBAR', ammoText: 'MELEE' },
    { id: 'gravity_gun', key: '2', label: 'GRAVITY GUN', ammoText: stats.isHoldingProp ? 'HOLDING' : 'READY' },
    { id: 'pulse_rifle', key: '3', label: 'PULSE RIFLE', ammoText: '60' },
    { id: 'shotgun', key: '4', label: 'SHOTGUN', ammoText: '16' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-5 md:p-8 z-20">
      {/* Top Header: Objective & Top Utilities */}
      <div className="flex items-start justify-between">
        {/* Objective Tracker */}
        <div className="max-w-md bg-black/75 border border-amber-500/40 rounded p-3.5 shadow-[0_0_15px_rgba(245,158,11,0.15)] pointer-events-auto">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-amber-400 font-bold uppercase">
              MISSION DIRECTIVE // PHASE {mission.phase}
            </span>
          </div>
          <h2 className="text-sm font-mono font-bold text-amber-200 uppercase leading-snug">
            {mission.title}
          </h2>
          <p className="text-xs font-sans text-neutral-300 mt-1">
            {mission.hint}
          </p>
        </div>

        {/* Top-Right Utilities: Mute & Pause */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Radiation Warning if near toxic canal */}
          {stats.geigerLevel > 0.1 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-yellow-950/80 border border-yellow-500 text-yellow-400 font-mono text-xs animate-pulse">
              <Radio size={14} />
              <span>RAD HAZARD ({Math.round(stats.geigerLevel * 100)}%)</span>
            </div>
          )}

          <button
            onClick={onToggleMute}
            className="w-9 h-9 rounded border border-amber-500/40 bg-black/70 flex items-center justify-center text-amber-400 hover:bg-amber-950/40 transition-colors cursor-pointer"
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button
            onClick={onPause}
            className="w-9 h-9 rounded border border-amber-500/40 bg-black/70 flex items-center justify-center text-amber-400 hover:bg-amber-950/40 transition-colors cursor-pointer"
            aria-label="Pause Game"
          >
            <Pause size={16} />
          </button>
        </div>
      </div>

      {/* Notification Message (Positioned high so it never occludes crosshair) */}
      {message && !stats.activeTransmission && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-black/85 border border-amber-500/50 px-4 py-2 rounded shadow-[0_0_20px_rgba(245,158,11,0.2)] text-center max-w-lg pointer-events-auto z-30">
          <span className="text-xs font-mono text-amber-300 tracking-wide font-semibold">
            {message}
          </span>
        </div>
      )}

      {/* Resistance & Overwatch Radio Transmission Overlay */}
      {stats.activeTransmission && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-neutral-950/95 border-2 border-emerald-500/60 rounded-md p-4 shadow-[0_0_30px_rgba(16,185,129,0.3)] max-w-xl w-[92vw] pointer-events-auto z-40 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                ENCRYPTED COMMS // {stats.activeTransmission.sender}
              </span>
            </div>
            {/* Audio Waveform visualization */}
            <div className="flex items-end gap-1 h-3.5">
              <span className="w-1 bg-emerald-400 h-2 animate-pulse" />
              <span className="w-1 bg-emerald-400 h-3.5 animate-pulse delay-75" />
              <span className="w-1 bg-emerald-400 h-1.5 animate-pulse delay-150" />
              <span className="w-1 bg-emerald-400 h-3 animate-pulse delay-100" />
            </div>
          </div>
          <p className="text-sm font-sans text-neutral-100 leading-relaxed drop-shadow-sm font-medium">
            "{stats.activeTransmission.text}"
          </p>
        </div>
      )}

      {/* Middle Center Crosshair */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
        {/* Dynamic Crosshair */}
        <div
          className={`w-6 h-6 border rounded-full transition-all duration-150 flex items-center justify-center ${
            stats.isAimingAtProp
              ? 'w-10 h-10 border-2 border-cyan-400 scale-125 shadow-[0_0_15px_rgba(56,189,248,0.7)]'
              : 'border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              stats.isAimingAtProp ? 'bg-cyan-300' : 'bg-amber-400'
            }`}
          />
        </div>

        {/* Gravity Gun Prompt Cue */}
        {stats.isAimingAtProp && (
          <div className="absolute top-8 whitespace-nowrap px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-400 text-[10px] font-mono text-cyan-200 tracking-wider">
            [R-CLICK] GRAVITY FIELD LATCH
          </div>
        )}
      </div>

      {/* Bottom Clusters: Classic Half-Life Amber Gauges */}
      <div className="flex items-end justify-between w-full">
        {/* Left Cluster: HEALTH & SUIT POWER */}
        <div className="flex flex-col gap-1.5 bg-black/80 border border-amber-500/40 rounded p-3 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          {/* HEV Nanite Auto-Regen Pill */}
          {stats.timeSinceLastDamage > 3.5 && (stats.health < (stats.maxHealth || 150) || stats.suitPower < (stats.maxSuitPower || 150)) && (
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 tracking-wider font-semibold mb-0.5 animate-pulse">
              <Zap size={11} className="fill-emerald-400/40" />
              <span>HEV NANITE AUTO-REPAIR ACTIVE</span>
            </div>
          )}

          <div className="flex items-center gap-4">
            {/* Health */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono tracking-widest text-amber-400 font-bold">
                <Heart size={14} className="text-red-500 fill-red-500/40" />
                <span>HEALTH</span>
              </div>
              <div className="text-3xl md:text-4xl font-mono font-extrabold text-amber-400 tabular-nums leading-none drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">
                {Math.max(0, Math.round(stats.health))}
              </div>
              {/* Visual health bar */}
              <div className="w-24 h-1.5 bg-neutral-800 rounded-full mt-2 overflow-hidden border border-neutral-700">
                <div
                  className="h-full bg-amber-400 transition-all duration-200"
                  style={{ width: `${Math.max(0, Math.min(100, (stats.health / (stats.maxHealth || 150)) * 100))}%` }}
                />
              </div>
            </div>

            <div className="w-[1px] h-12 bg-amber-500/30" />

            {/* HEV Suit Armor / Power */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono tracking-widest text-amber-400 font-bold">
                <Shield size={14} className="text-amber-400 fill-amber-400/40" />
                <span>SUIT POWER</span>
              </div>
              <div className="text-3xl md:text-4xl font-mono font-extrabold text-amber-400 tabular-nums leading-none drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">
                {Math.max(0, Math.round(stats.suitPower))}
              </div>
              {/* Visual suit bar */}
              <div className="w-24 h-1.5 bg-neutral-800 rounded-full mt-2 overflow-hidden border border-neutral-700">
                <div
                  className="h-full bg-amber-500 transition-all duration-200"
                  style={{ width: `${Math.max(0, Math.min(100, (stats.suitPower / (stats.maxSuitPower || 150)) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center: Weapon Selection Bar */}
        <div className="hidden sm:flex items-center gap-2 bg-black/80 border border-amber-500/40 rounded p-2 pointer-events-auto">
          {weaponsList.map((w) => {
            const isActive = stats.activeWeapon === w.id;
            return (
              <button
                key={w.id}
                onClick={() => onSelectWeapon(w.id)}
                className={`flex flex-col items-center px-3 py-1.5 rounded transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-black font-bold shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                    : 'text-amber-400/70 hover:bg-amber-950/40 hover:text-amber-300'
                }`}
              >
                <span className="text-[10px] font-mono opacity-80">[{w.key}]</span>
                <span className="text-xs font-mono font-bold whitespace-nowrap">{w.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Cluster: Active Weapon & Ammo */}
        <div className="flex flex-col items-end bg-black/80 border border-amber-500/40 rounded p-3 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <div className="text-[11px] font-mono tracking-widest text-amber-400 font-bold uppercase mb-1">
            WEAPON STATUS
          </div>
          <div className="text-2xl md:text-3xl font-mono font-extrabold text-amber-400 leading-none drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">
            {stats.activeWeapon === 'gravity_gun'
              ? stats.isHoldingProp
                ? 'FIELD ACTIVE'
                : 'GRAV READY'
              : stats.activeWeapon === 'crowbar'
              ? 'MELEE'
              : stats.activeWeapon === 'pulse_rifle'
              ? '60 / ∞'
              : '16 / ∞'}
          </div>
          <div className="text-[10px] font-mono text-neutral-400 mt-1 uppercase">
            {stats.activeWeapon.replace('_', ' ')}
          </div>
        </div>
      </div>
    </div>
  );
};
