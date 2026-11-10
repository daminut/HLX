import React from 'react';
import { PlayerStats } from '../game/types';
import { Play, RotateCcw, Volume2, VolumeX, Home, Award, Skull } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onExitToTitle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onExitToTitle,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center p-6 select-none pointer-events-auto">
      <div className="w-full max-w-md bg-neutral-950 border border-amber-500/50 rounded-lg p-6 shadow-[0_0_35px_rgba(245,158,11,0.2)]">
        <div className="flex items-center gap-3 border-b border-amber-500/30 pb-4 mb-6">
          <div className="w-7 h-7 rounded border border-amber-500/40 bg-amber-950/40 flex items-center justify-center text-amber-400 font-bold">
            λ
          </div>
          <div>
            <h2 className="text-xl font-mono font-bold text-amber-400 tracking-wider">
              SIMULATION PAUSED
            </h2>
            <p className="text-xs font-mono text-neutral-400">
              HEV SUIT PROTOCOL SUSPENDED
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold rounded shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-colors cursor-pointer"
          >
            <Play size={16} fill="currentColor" />
            <span>RESUME MISSION</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 text-amber-300 font-mono text-sm rounded transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>RESTART LEVEL</span>
          </button>

          <button
            onClick={onToggleMute}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 text-amber-300 font-mono text-sm rounded transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
          </button>

          <button
            onClick={onExitToTitle}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 font-mono text-sm rounded transition-colors cursor-pointer"
          >
            <Home size={16} />
            <span>RETURN TO TITLE</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  stats: PlayerStats;
  onRetry: () => void;
  onExitToTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRetry,
  onExitToTitle,
}) => {
  return (
    <div className="absolute inset-0 z-40 bg-black/90 flex items-center justify-center p-6 select-none pointer-events-auto">
      <div className="w-full max-w-lg bg-neutral-950 border border-red-500/60 rounded-lg p-6 md:p-8 shadow-[0_0_45px_rgba(239,68,68,0.25)] text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-red-500/50 bg-red-950/40 text-red-400 mb-4">
          <Skull size={24} />
        </div>

        <h2 className="text-2xl md:text-3xl font-mono font-extrabold text-red-500 tracking-wider">
          SUBJECT: FREEMAN
        </h2>
        <div className="text-xs font-mono tracking-widest text-red-400/80 mb-6 uppercase">
          STATUS: TERMINATED // VITAL SIGNS FLATLINE
        </div>

        {/* EKG pulse line representation */}
        <div className="h-0.5 bg-red-500/30 w-full relative mb-6">
          <div className="absolute inset-0 bg-red-500/80 blur-[1px]" />
        </div>

        {/* Run metrics */}
        <div className="grid grid-cols-3 gap-3 mb-8 bg-neutral-900/60 p-4 rounded border border-neutral-800">
          <div>
            <div className="text-[10px] font-mono text-neutral-400 uppercase">ENEMIES SLAIN</div>
            <div className="text-xl font-mono font-bold text-amber-400 tabular-nums">{stats.enemiesDefeated}</div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-neutral-400 uppercase">CORES SECURED</div>
            <div className="text-xl font-mono font-bold text-amber-400 tabular-nums">{stats.powerCoresInserted} / 2</div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-neutral-400 uppercase">SCORE</div>
            <div className="text-xl font-mono font-bold text-amber-400 tabular-nums">{stats.score}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRetry}
            data-start="true"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 text-white font-mono font-bold rounded shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>TRY AGAIN</span>
          </button>

          <button
            onClick={onExitToTitle}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-sm rounded transition-colors cursor-pointer"
          >
            <Home size={16} />
            <span>TITLE SCREEN</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  stats: PlayerStats;
  onPlayAgain: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  onPlayAgain,
}) => {
  return (
    <div className="absolute inset-0 z-40 bg-black/90 flex items-center justify-center p-6 select-none pointer-events-auto">
      <div className="w-full max-w-xl bg-neutral-950 border border-amber-500/70 rounded-lg p-6 md:p-8 shadow-[0_0_55px_rgba(245,158,11,0.35)] text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-amber-500/50 bg-amber-950/40 text-amber-400 mb-4">
          <Award size={30} />
        </div>

        <h2 className="text-2xl md:text-3xl font-mono font-extrabold text-amber-400 tracking-wider">
          MISSION ACCOMPLISHED
        </h2>
        <div className="text-xs font-mono tracking-widest text-amber-200/90 mb-6 uppercase">
          BOREALIS DIMENSIONAL CORE SECURED
        </div>

        {/* Cryptic G-Man dialogue box */}
        <div className="bg-neutral-900/90 border-l-4 border-amber-500 p-4 rounded text-left mb-6 font-serif italic text-neutral-200 text-sm leading-relaxed">
          &ldquo;So, Doctor Freeman... you have arrived at last. Rather than offer you the illusion of free choice, I shall take the liberty of choosing for you, if and when your time comes around again. Until then... here is where I get off.&rdquo;
          <div className="text-right text-[11px] font-mono text-amber-400/90 not-italic mt-2">
            — THE G-MAN
          </div>
        </div>

        {/* Run metrics */}
        <div className="grid grid-cols-3 gap-3 mb-8 bg-neutral-900/60 p-4 rounded border border-amber-500/30">
          <div>
            <div className="text-[10px] font-mono text-neutral-400 uppercase">ENEMIES SLAIN</div>
            <div className="text-xl font-mono font-bold text-amber-400 tabular-nums">{stats.enemiesDefeated}</div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-neutral-400 uppercase">HUNTER BOSS</div>
            <div className="text-xl font-mono font-bold text-amber-400">DESTROYED</div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-neutral-400 uppercase">FINAL SCORE</div>
            <div className="text-xl font-mono font-bold text-amber-400 tabular-nums">{stats.score}</div>
          </div>
        </div>

        <button
          onClick={onPlayAgain}
          data-start="true"
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold rounded shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all cursor-pointer transform hover:scale-[1.01]"
        >
          <RotateCcw size={18} />
          <span>PLAY AGAIN</span>
        </button>
      </div>
    </div>
  );
};
