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
 * Gravity Gun impulse calculation based on distance and punt velocity
 */
export function calculateGravityPuntImpulse(
  distance: number,
  baseImpulse: number = 32
): number {
  // Effective range for maximum punt is within 6 units, decays past that
  if (distance > 12) return 0;
  const falloff = Math.max(0.4, 1 - (distance / 12) * 0.6);
  return baseImpulse * falloff;
}

/**
 * Explosive barrel splash damage calculation
 */
export function calculateExplosionDamage(
  distance: number,
  radius: number = 9,
  maxDamage: number = 180
): number {
  if (distance >= radius) return 0;
  const factor = 1 - (distance / radius);
  return Math.round(maxDamage * (factor * factor));
}

/**
 * Objective status calculation
 */
export function getMissionPhase(
  coresInserted: number,
  bossDefeated: boolean,
  hangarBreached: boolean
): { phase: number; title: string; hint: string } {
  if (coresInserted < 2) {
    return {
      phase: 1,
      title: `POWER GENERATOR: Slot Energy Cores (${coresInserted}/2)`,
      hint: 'Use Gravity Gun (Right-Click) to grab energy batteries and punt them into the reactor sockets.',
    };
  }
  if (!bossDefeated) {
    return {
      phase: 2,
      title: 'COMBINE HUNTER DETECTED: Eliminate Heavy Armor Unit',
      hint: 'Punt explosive red barrels and saw blades at the Combine Hunter to breach its energy shield!',
    };
  }
  if (!hangarBreached) {
    return {
      phase: 3,
      title: 'BOREALIS DOCK BREACH: Access the Dimensional Teleport Bridge',
      hint: 'The forcefield has dropped. Enter the Borealis hangar and activate the dimensional bridge.',
    };
  }
  return {
    phase: 4,
    title: 'MISSION COMPLETE: Dimensional Portal Stabilized',
    hint: 'Gordon Freeman has secured the Borealis prototype.',
  };
}
