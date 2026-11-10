import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDamage,
  applyHeal,
  canFireWeapon,
  consumeWeaponAmmo,
  addAmmo,
  calculateGravityPuntImpulse,
  calculateExplosionDamage,
  getMissionPhase,
} from './combat';
import { WeaponInfo } from './types';

test('applyDamage protects health when HEV suit power is available', () => {
  const initialHealth = 100;
  const initialSuit = 100;
  const damage = 50; // 50 raw damage -> 80% (40) absorbed by suit, 20% (10) to health

  const result = applyDamage(initialHealth, initialSuit, damage);
  assert.equal(result.newSuitPower, 60);
  assert.equal(result.newHealth, 90);
  assert.equal(result.isDead, false);
});

test('applyDamage bleeds excess damage into health when suit power depletes', () => {
  const initialHealth = 100;
  const initialSuit = 10;
  const damage = 50; // suit absorbs 10 max, remaining 40 to health

  const result = applyDamage(initialHealth, initialSuit, damage);
  assert.equal(result.newSuitPower, 0);
  assert.equal(result.newHealth, 60);
  assert.equal(result.isDead, false);
});

test('applyDamage triggers death when health reaches zero', () => {
  const result = applyDamage(30, 0, 50);
  assert.equal(result.newHealth, 0);
  assert.equal(result.isDead, true);
});

test('applyHeal caps at maximum capacity', () => {
  const result = applyHeal(85, 100, 25);
  assert.equal(result.newVal, 100);
  assert.equal(result.amountGained, 15);
});

test('weapon firing logic enforces cooldown and ammunition requirements', () => {
  const pulseRifle: WeaponInfo = {
    id: 'pulse_rifle',
    name: 'Overwatch Standard Issue Pulse Rifle',
    role: 'Rapid Plasma Fire',
    slotKey: '3',
    maxAmmo: 120,
    currentAmmo: 30,
    cooldown: 0.12,
    damage: 22,
    unlocked: true,
  };

  // Ready to fire
  assert.equal(canFireWeapon(pulseRifle, 1.0, 0.5), true);
  // Cooldown active
  assert.equal(canFireWeapon(pulseRifle, 0.55, 0.5), false);

  // Depleted ammo
  const emptyRifle = { ...pulseRifle, currentAmmo: 0 };
  assert.equal(canFireWeapon(emptyRifle, 1.0, 0.5), false);

  // Gravity Gun has infinite charge
  const gravityGun: WeaponInfo = {
    id: 'gravity_gun',
    name: 'Zero-Point Energy Field Manipulator',
    role: 'Physics Manipulation & Punt',
    slotKey: '2',
    maxAmmo: 1,
    currentAmmo: 0,
    cooldown: 0.25,
    damage: 40,
    unlocked: true,
  };
  assert.equal(canFireWeapon(gravityGun, 1.0, 0.5), true);
});

test('consumeWeaponAmmo correctly decrements ammo except for gravity gun & crowbar', () => {
  const pulseRifle: WeaponInfo = {
    id: 'pulse_rifle',
    name: 'Pulse Rifle',
    role: 'Assault',
    slotKey: '3',
    maxAmmo: 120,
    currentAmmo: 15,
    cooldown: 0.1,
    damage: 20,
    unlocked: true,
  };

  const consumed = consumeWeaponAmmo(pulseRifle);
  assert.equal(consumed.currentAmmo, 14);

  const crowbar: WeaponInfo = {
    id: 'crowbar',
    name: 'Crowbar',
    role: 'Melee',
    slotKey: '1',
    maxAmmo: 1,
    currentAmmo: 1,
    cooldown: 0.4,
    damage: 25,
    unlocked: true,
  };
  assert.equal(consumeWeaponAmmo(crowbar).currentAmmo, 1);
});

test('calculateGravityPuntImpulse scales smoothly with range', () => {
  const closeImpulse = calculateGravityPuntImpulse(2, 32);
  const farImpulse = calculateGravityPuntImpulse(10, 32);
  const outOfRange = calculateGravityPuntImpulse(15, 32);

  assert.ok(closeImpulse > farImpulse);
  assert.equal(outOfRange, 0);
});

test('calculateExplosionDamage calculates falloff quadratic blast', () => {
  const centerHit = calculateExplosionDamage(0, 10, 200);
  const halfRadiusHit = calculateExplosionDamage(5, 10, 200);
  const outsideHit = calculateExplosionDamage(11, 10, 200);

  assert.equal(centerHit, 200);
  assert.ok(halfRadiusHit > 0 && halfRadiusHit < centerHit);
  assert.equal(outsideHit, 0);
});

test('getMissionPhase advances through phases correctly', () => {
  assert.equal(getMissionPhase(0, false, false).phase, 1);
  assert.equal(getMissionPhase(1, false, false).phase, 1);
  assert.equal(getMissionPhase(2, false, false).phase, 2);
  assert.equal(getMissionPhase(2, true, false).phase, 3);
  assert.equal(getMissionPhase(2, true, true).phase, 4);
});
