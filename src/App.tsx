/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, PlayerStats, WeaponId } from './game/types';
import { HalfLifeEngine } from './game/engine';
import { soundSystem } from './game/audio';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { PauseModal, GameOverModal, VictoryModal } from './components/Modals';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<HalfLifeEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('title');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hudMessage, setHudMessage] = useState<string>('');
  const messageTimeoutRef = useRef<number | null>(null);

  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    health: 150,
    maxHealth: 150,
    suitPower: 150,
    maxSuitPower: 150,
    stamina: 100,
    score: 0,
    chapter: 1,
    totalChapters: 4,
    chapterTitle: 'CHAPTER 1: THE ARCTIC INGRESS',
    enemiesDefeated: 0,
    powerCoresInserted: 0,
    totalPowerCoresRequired: 2,
    bossDefeated: false,
    activeWeapon: 'crowbar',
    isAimingAtProp: false,
    isHoldingProp: false,
    geigerLevel: 0,
    hazardDamageTimer: 0,
    timeSinceLastDamage: 999,
    activeTransmission: null,
  });

  const showMessage = useCallback((msg: string) => {
    setHudMessage(msg);
    if (messageTimeoutRef.current) {
      window.clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = window.setTimeout(() => {
      setHudMessage('');
    }, 4500);
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = soundSystem.toggleMute();
    setIsMuted(muted);
  }, []);

  // Initialize engine once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    // Check autostart query parameter
    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart') === '1';

    const engine = new HalfLifeEngine(canvasMountRef.current, {
      onStatsUpdate: (stats) => {
        setPlayerStats(stats);
      },
      onStateChange: (state) => {
        setGameState(state);
      },
      onMessage: (msg) => {
        showMessage(msg);
      },
    });

    engineRef.current = engine;

    if (autostart) {
      engine.startGame();
    }

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [showMessage]);

  const handleStartGame = () => {
    engineRef.current?.startGame();
  };

  const handlePause = () => {
    engineRef.current?.pauseGame();
  };

  const handleResume = () => {
    engineRef.current?.resumeGame();
  };

  const handleRestart = () => {
    engineRef.current?.restartGame();
  };

  const handleExitToTitle = () => {
    setGameState('title');
    document.body.dataset.state = 'title';
    engineRef.current?.restartGame();
  };

  const handleSelectWeapon = (id: WeaponId) => {
    engineRef.current?.switchWeapon(id);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none font-mono">
      {/* 3D WebGL Canvas Viewport Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 z-0 w-full h-full"
        data-testid="half-life-3-viewport"
      />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* In-Game Active HUD */}
      {gameState === 'playing' && (
        <HUD
          stats={playerStats}
          message={hudMessage}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
          onSelectWeapon={handleSelectWeapon}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onExitToTitle={handleExitToTitle}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          stats={playerStats}
          onRetry={handleRestart}
          onExitToTitle={handleExitToTitle}
        />
      )}

      {/* Victory Modal */}
      {gameState === 'victory' && (
        <VictoryModal
          stats={playerStats}
          onPlayAgain={handleRestart}
        />
      )}
    </div>
  );
}
