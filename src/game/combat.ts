import { WeaponInfo, WeaponId } from './types';

/**
 * Pure combat & physics math module for Half-Life 3 mechanics.
 * Highly testable and deterministic.
 */

export interface DamageResult {
  newHealth: number;
  newSuitPower: number;
  healthLost: number;
  suitPowerLost: number;
  isDead: boolean;
}

/**
 * Classic HEV suit protection:
 * If suit power > 0, HEV suit absorbs 80% of damage and drains suit energy.
 * Remaining 20% affects health. If power reaches 0, excess bleeds into health.
 */
export function applyDamage(
  currentHealth: number,
  currentSuitPower: number,
  rawDamage: number
): DamageResult {
  if (rawDamage <= 0) {
    return {
      newHealth: Math.max(0, currentHealth),
      newSuitPower: Math.max(0, currentSuitPower),
      healthLost: 0,
      suitPowerLost: 0,
      isDead: currentHealth <= 0,
    };
  }

  let suitPowerLost = 0;
  let healthDamage = rawDamage;

  if (currentSuitPower > 0) {
    const suitAbsorption = rawDamage * 0.8;
    suitPowerLost = Math.min(currentSuitPower, suitAbsorption);
    const unabsorbed = suitAbsorption - suitPowerLost;
    healthDamage = (rawDamage * 0.2) + unabsorbed;
  }

  const newSuitPower = Math.max(0, Math.round(currentSuitPower - suitPowerLost));
  const newHealth = Math.max(0, Math.round(currentHealth - healthDamage));
  const healthLost = currentHealth - newHealth;

  return {
    newHealth,
    newSuitPower,
    healthLost,
    suitPowerLost,
    isDead: newHealth <= 0,
  };
}

/**
 * Health Station / Battery Charger recharge calculation
 */
export function applyHeal(
  currentVal: number,
  maxVal: number,
  amount: number
): { newVal: number; amountGained: number } {
  const newVal = Math.min(maxVal, Math.max(0, currentVal + amount));
  return {
    newVal,
    amountGained: newVal - currentVal,
  };
}

/**
 * Check if weapon is ready to fire
 */
export function canFireWeapon(
  weapon: WeaponInfo,
  currentTime: number,
  lastFiredTime: number
): boolean {
  if (currentTime - lastFiredTime < weapon.cooldown) {
    return false;
  }
  if (weapon.id === 'gravity_gun' || weapon.id === 'crowbar') {
    return true; // Infinite energy / melee
  }
  return weapon.currentAmmo > 0;
}

/**
 * Consume ammo when weapon is discharged
 */
export function consumeWeaponAmmo(weapon: WeaponInfo): WeaponInfo {
  if (weapon.id === 'gravity_gun' || weapon.id === 'crowbar') {
    return weapon;
  }
  return {
    ...weapon,
    currentAmmo: Math.max(0, weapon.currentAmmo - 1),
  };
}

/**
 * Add ammo with cap
 */
export function addAmmo(weapon: WeaponInfo, amount: number): WeaponInfo {
  if (weapon.id === 'gravity_gun' || weapon.id === 'crowbar') {
    return weapon;
  }
  return {
    ...weapon,
    currentAmmo: Math.min(weapon.maxAmmo, weapon.currentAmmo + amount),
  };
}

/**
 * HEV Mark V Nanite Auto-Regeneration:
 * When Gordon Freeman avoids taking damage for over 3.5 seconds,
 * the suit's automated medical systems slowly repair health and recharge armor.
 */
export function applyNaniteAutoRegen(
  currentHealth: number,
  currentSuit: number,
  dt: number,
  maxHealth: number = 150,
  maxSuit: number = 150
): { newHealth: number; newSuit: number; didRegen: boolean } {
  if (currentHealth <= 0) return { newHealth: 0, newSuit: 0, didRegen: false };

  const healthRegenRate = 6.0; // HP per sec
  const suitRegenRate = 8.0;   // Power per sec

  const newHealth = Math.min(maxHealth, currentHealth + healthRegenRate * dt);
  const newSuit = Math.min(maxSuit, currentSuit + suitRegenRate * dt);

  const didRegen = newHealth > currentHealth || newSuit > currentSuit;

  return {
    newHealth,
    newSuit,
    didRegen,
  };
}

/**
 * Gravity Gun impulse calculation based on distance and punt velocity
 */
export function calculateGravityPuntImpulse(
  distance: number,
  baseImpulse: number = 48
): number {
  if (distance > 18) return 0;
  const falloff = Math.max(0.5, 1 - (distance / 18) * 0.5);
  return baseImpulse * falloff;
}

/**
 * Explosive barrel splash damage calculation
 */
export function calculateExplosionDamage(
  distance: number,
  radius: number = 11,
  maxDamage: number = 220
): number {
  if (distance >= radius) return 0;
  const factor = 1 - (distance / radius);
  return Math.round(maxDamage * (factor * factor));
}

/**
 * Objective status and narrative chapter calculation
 */
export function getMissionPhase(
  coresInserted: number,
  bossDefeated: boolean,
  hangarBreached: boolean
): {
  phase: number;
  chapterTitle: string;
  title: string;
  hint: string;
  radioSender: 'Alyx Vance' | 'Dr. Judith Mossman' | 'Combine Overwatch' | 'The G-Man';
  radioMessage: string;
} {
  if (coresInserted < 2) {
    return {
      phase: 1,
      chapterTitle: 'CHAPTER 1: THE ARCTIC INGRESS',
      title: `PRIMARY ION DRIVE: Insert Zero-Point Batteries (${coresInserted}/2)`,
      hint: 'Use the Gravity Gun (Right-Click) to grab battery cores from the container yard and slot them into the reactor sockets.',
      radioSender: 'Alyx Vance',
      radioMessage: 'Gordon, Eli and I have your telemetry! Combine scouts are patrolling the perimeter. Get the Primary Ion Drive online to overload their containment grid!',
    };
  }
  if (!bossDefeated) {
    return {
      phase: 2,
      chapterTitle: 'CHAPTER 2: OVERWATCH HUNTER ASSAULT',
      title: 'WARNING: Combine Synth Hunter Unit Deployed',
      hint: 'Hunter armor is heavily reinforced! Punt explosive red barrels and heavy supply crates into its chassis to breach its shielding.',
      radioSender: 'Combine Overwatch',
      radioMessage: 'Warning to all Overwatch units. Anti-citizen Freeman active in drydock sector. Heavy Hunter synthetic deployed. Execute pacification.',
    };
  }
  if (!hangarBreached) {
    return {
      phase: 3,
      chapterTitle: 'CHAPTER 3: BREACHING THE BOREALIS DRYDOCK',
      title: 'CONTAINMENT COLLAPSED: Enter the Aperture Drydock',
      hint: 'The forcefield has dropped. Enter through the hangar blast doors and reach the dimensional teleport bridge.',
      radioSender: 'Dr. Judith Mossman',
      radioMessage: 'Gordon, the forcefield has fallen! The Aperture Science teleport core is just beyond the hangar blast doors. Hurry before the Citadel sends reinforcements!',
    };
  }
  return {
    phase: 4,
    chapterTitle: 'CHAPTER 4: THE APERTURE TELEPORT CORE',
    title: 'MISSION COMPLETE: Dimensional Core Secured',
    hint: 'Gordon Freeman has breached the Borealis and stabilized the dimensional matrix.',
    radioSender: 'The G-Man',
    radioMessage: 'Rather than offer you the illusion of free choice, I shall take the liberty of choosing for you... until your time comes round again.',
  };
}
