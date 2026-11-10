import React from 'react';
import { Volume2, VolumeX, Shield, Play } from 'lucide-react';
import { soundSystem } from '../game/audio';

interface TitleScreenProps {
  onStart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 pointer-events-auto flex flex-col justify-between p-8 md:p-14 select-none bg-radial-[at_top_left] from-transparent via-black/30 to-black/70">
      {/* Top Bar with Black Mesa / Aperture branding & Audio Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border border-amber-500/40 bg-amber-950/30 flex items-center justify-center">
            <span className="text-amber-400 font-bold text-lg leading-none">λ</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-mono tracking-widest text-amber-400/80">VALVE PROTOCOL // BOREALIS ARCHIVE</span>
            <span className="text-[10px] font-mono text-neutral-400">SECTOR C-17 ARCTIC RESEARCH STATION</span>
          </div>
        </div>

        <button
          onClick={onToggleMute}
          className="flex items-center gap-2 px-3 py-1.5 rounded border border-amber-500/30 bg-black/60 text-amber-400 hover:bg-amber-950/40 hover:border-amber-400 transition-colors text-xs font-mono cursor-pointer"
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          <span>{isMuted ? 'MUTED' : 'AUDIO ON'}</span>
        </button>
      </div>

      {/* Hero Centerpiece: Inline SVG Title Lockup */}
      <div className="max-w-2xl my-auto flex flex-col items-start">
        {/* Lambda Crest & Title SVG */}
        <div className="flex items-center gap-5 mb-4">
          <svg className="w-20 h-20 md:w-24 md:h-24 drop-shadow-[0_0_25px_rgba(245,158,11,0.5)]" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="46" stroke="#f59e0b" strokeWidth="4" className="opacity-80" />
            <circle cx="50" cy="50" r="41" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 6" className="opacity-60" />
            {/* Iconic Lambda character λ */}
            <path
              d="M 28 78 L 48 38 L 54 24 L 62 24 L 56 38 L 74 78 L 62 78 L 49 48 L 36 78 Z"
              fill="#fbbf24"
            />
          </svg>

          <div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.35)] flex items-baseline gap-2">
              HALF-LIFE <span className="text-amber-500 font-serif italic text-5xl sm:text-7xl md:text-8xl">3</span>
            </h1>
            <p className="text-xs sm:text-sm font-mono tracking-[0.3em] text-amber-200/90 uppercase font-semibold mt-1">
              THE BOREALIS INCURSION
            </p>
          </div>
        </div>

        {/* Narrative premise */}
        <p className="text-neutral-300 text-sm md:text-base max-w-xl font-sans leading-relaxed mb-8 drop-shadow bg-black/40 p-3.5 rounded border-l-2 border-amber-500/80">
          The research vessel <strong className="text-amber-300">Borealis</strong> has reappeared in the Arctic wastes. Combine Overwatch forces are securing the dimensional teleport core. Wield the Zero-Point Energy Field Manipulator and break the blockade.
        </p>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <button
            onClick={onStart}
            data-start="true"
            className="flex items-center justify-center gap-3 px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold tracking-wider text-base rounded shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play size={18} fill="currentColor" />
            <span>AWAKEN GORDON FREEMAN</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono text-amber-400/80 bg-amber-950/40 px-3.5 py-2.5 rounded border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>PRESS [ENTER] OR [SPACE] TO START</span>
          </div>
        </div>
      </div>

      {/* Control Hints Line */}
      <div className="border-t border-amber-500/20 pt-4 flex flex-col md:flex-row items-center justify-between text-xs font-mono text-neutral-400 gap-2">
        <div>
          <span className="text-amber-400 font-semibold">CONTROLS:</span> WASD Move · Mouse Aim & Fire · Right-Click Gravity Latch · E Interact · 1-4 Weapons · Esc Pause
        </div>
        <div className="text-[11px] text-neutral-500">
          HEV SUIT MARK V // POWERED BY BLACK MESA RESEARCH
        </div>
      </div>
    </div>
  );
};
