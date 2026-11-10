export type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

export type WeaponId = 'crowbar' | 'gravity_gun' | 'pulse_rifle' | 'shotgun';

export interface WeaponInfo {
  id: WeaponId;
  name: string;
  role: string;
  slotKey: string;
  maxAmmo: number;
  currentAmmo: number;
  cooldown: number; // in seconds
  damage: number;
  unlocked: boolean;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  suitPower: number;
  maxSuitPower: number;
  stamina: number;
  score: number;
  enemiesDefeated: number;
  powerCoresInserted: number;
  totalPowerCoresRequired: number;
  bossDefeated: boolean;
  activeWeapon: WeaponId;
  isAimingAtProp: boolean;
  isHoldingProp: boolean;
  geigerLevel: number; // 0 to 1
  hazardDamageTimer: number;
}

export type EnemyType = 'headcrab' | 'combine_soldier' | 'combine_hunter';

export interface Objective {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}
