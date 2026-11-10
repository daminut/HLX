import * as THREE from 'three';

// Procedural textures generator
function createHazardStripeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#111827';
  
  ctx.beginPath();
  for (let i = -128; i < 256; i += 32) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 16, 0);
    ctx.lineTo(i - 16, 128);
    ctx.lineTo(i - 32, 128);
  }
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createBarrelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, 256, 256);

  // Metal wear & grime
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  for (let y = 0; y < 256; y += 40) {
    ctx.fillRect(0, y, 256, 6);
  }

  // Yellow warning patch
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(64, 80, 128, 96);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EXPLOSIVE', 128, 120);
  ctx.font = 'bold 18px monospace';
  ctx.fillText('DANGER', 128, 150);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCrateTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#78350f';
  ctx.fillRect(0, 0, 256, 256);

  // Wood planks
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 4;
  for (let y = 0; y < 256; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  // Cross brace
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.lineTo(246, 246);
  ctx.moveTo(246, 10);
  ctx.lineTo(10, 246);
  ctx.stroke();

  // Lambda symbol stenciled in center
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 64px serif';
  ctx.textAlign = 'center';
  ctx.fillText('λ', 128, 148);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// -------------------------------------------------------------
// WEAPONS (First Person Viewmodels)
// -------------------------------------------------------------

/**
 * Procedural Crowbar (Gordon Freeman's iconic melee weapon)
 * 5 distinct parts: Red lacquered shaft, rubber grip sleeve, steel bend, hooked claw tip, and chisel bevel.
 */
export function createCrowbarModel(): THREE.Group {
  const group = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    metalness: 0.85,
    roughness: 0.25,
  });

  const redMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    metalness: 0.35,
    roughness: 0.35,
  });

  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.1,
    roughness: 0.8,
  });

  // 1. Main shaft (red painted hexagonal bar)
  const shaftGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.55, 8);
  const shaft = new THREE.Mesh(shaftGeo, redMat);
  shaft.position.y = 0.22;
  group.add(shaft);

  // 2. Rubber grip bands on middle of shaft
  const gripGeo = new THREE.CylinderGeometry(0.019, 0.019, 0.18, 8);
  const grip = new THREE.Mesh(gripGeo, gripMat);
  grip.position.y = 0.12;
  group.add(grip);

  // 3. Bottom chisel end (steel wedge, seamlessly attached to bottom of shaft)
  const chiselGeo = new THREE.CylinderGeometry(0.016, 0.004, 0.08, 8);
  const chisel = new THREE.Mesh(chiselGeo, steelMat);
  chisel.position.y = -0.09;
  group.add(chisel);

  // 4. Upper steel transition collar
  const collarGeo = new THREE.CylinderGeometry(0.017, 0.016, 0.06, 8);
  const collar = new THREE.Mesh(collarGeo, steelMat);
  collar.position.y = 0.52;
  group.add(collar);

  // 5. Curved hooked crowbar head (steel)
  const bendGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.16, 8);
  const bend = new THREE.Mesh(bendGeo, steelMat);
  bend.position.set(-0.04, 0.59, 0);
  bend.rotation.z = Math.PI * 0.28;
  group.add(bend);

  // 6. Hook claw tip (forked crowbar claw with V-notch)
  const clawGeo = new THREE.BoxGeometry(0.03, 0.09, 0.012);
  const claw = new THREE.Mesh(clawGeo, steelMat);
  claw.position.set(-0.09, 0.65, 0);
  claw.rotation.z = Math.PI * 0.42;
  group.add(claw);

  // Adjust default viewmodel orientation in front of camera
  group.rotation.set(-0.25, 0.28, -0.15);
  group.position.set(0.24, -0.22, -0.42);
  return group;
}

/**
 * Procedural Gravity Gun (Zero-Point Energy Field Manipulator)
 * 8 distinct parts: Heavy orange casing, hazard band, plasma containment chamber,
 * glowing crystal, three articulated manipulator claws, wire conduit.
 */
export function createGravityGunModel(): THREE.Group {
  const group = new THREE.Group();

  const orangeMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.35,
    roughness: 0.4,
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    metalness: 0.75,
    roughness: 0.3,
  });

  const hazardMat = new THREE.MeshStandardMaterial({
    map: createHazardStripeTexture(),
    roughness: 0.5,
  });

  const energyMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 2.2,
    roughness: 0.1,
  });

  // 1. Main rear receiver/stock
  const stockGeo = new THREE.BoxGeometry(0.12, 0.14, 0.3);
  const stock = new THREE.Mesh(stockGeo, darkMetalMat);
  stock.position.z = 0.04;
  group.add(stock);

  // 2. Middle orange housing with cooling ribs
  const housingGeo = new THREE.CylinderGeometry(0.085, 0.095, 0.28, 12);
  const housing = new THREE.Mesh(housingGeo, orangeMat);
  housing.rotation.x = Math.PI / 2;
  housing.position.z = -0.18;
  group.add(housing);

  // 3. Hazard stripe collar
  const hazardGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12);
  const hazardMesh = new THREE.Mesh(hazardGeo, hazardMat);
  hazardMesh.rotation.x = Math.PI / 2;
  hazardMesh.position.z = -0.12;
  group.add(hazardMesh);

  // 4. Glowing energy containment core (Zero-Point crystal)
  const coreGeo = new THREE.OctahedronGeometry(0.048, 1);
  const core = new THREE.Mesh(coreGeo, energyMat);
  core.position.z = -0.32;
  core.name = 'gravity_core';
  group.add(core);

  // 5. Front emitter collar
  const emitterGeo = new THREE.CylinderGeometry(0.07, 0.075, 0.12, 12);
  const emitter = new THREE.Mesh(emitterGeo, darkMetalMat);
  emitter.rotation.x = Math.PI / 2;
  emitter.position.z = -0.38;
  group.add(emitter);

  // 6, 7, 8. Three forward-facing claw prongs (visible in view)
  const clawGeo = new THREE.BoxGeometry(0.02, 0.03, 0.16);
  const clawAngles = [-Math.PI * 0.3, Math.PI * 0.3, Math.PI];

  clawAngles.forEach((angle) => {
    const clawHolder = new THREE.Group();
    clawHolder.position.set(0, 0, -0.4);
    clawHolder.rotation.z = angle;

    const claw = new THREE.Mesh(clawGeo, darkMetalMat);
    claw.position.set(0, 0.08, -0.06);
    claw.rotation.x = -0.15; // angled inward

    // Glow tip on claw
    const tipGeo = new THREE.BoxGeometry(0.024, 0.024, 0.04);
    const tip = new THREE.Mesh(tipGeo, energyMat);
    tip.position.set(0, 0.08, -0.14);

    clawHolder.add(claw);
    clawHolder.add(tip);
    group.add(clawHolder);
  });

  group.rotation.set(-0.06, 0.22, 0);
  group.position.set(0.24, -0.22, -0.44);
  return group;
}

/**
 * Procedural Combine Pulse Rifle (Overwatch Standard Issue AR2)
 */
export function createPulseRifleModel(): THREE.Group {
  const group = new THREE.Group();

  const combineMetal = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.85,
    roughness: 0.25,
  });

  const darkGrip = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.2,
    roughness: 0.7,
  });

  const plasmaGlow = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 1.2,
  });

  // 1. Receiver body
  const bodyGeo = new THREE.BoxGeometry(0.08, 0.11, 0.45);
  const body = new THREE.Mesh(bodyGeo, combineMetal);
  group.add(body);

  // 2. Long dark pulse barrel
  const barrelGeo = new THREE.CylinderGeometry(0.022, 0.025, 0.42, 10);
  const barrel = new THREE.Mesh(barrelGeo, combineMetal);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, -0.38);
  group.add(barrel);

  // 3. Glowing blue plasma power cell
  const cellGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.18, 10);
  const cell = new THREE.Mesh(cellGeo, plasmaGlow);
  cell.rotation.z = Math.PI / 2;
  cell.position.set(0.045, -0.01, -0.06);
  group.add(cell);

  // 4. Tactical stock & grip
  const gripGeo = new THREE.BoxGeometry(0.045, 0.15, 0.06);
  const grip = new THREE.Mesh(gripGeo, darkGrip);
  grip.position.set(0, -0.1, 0.08);
  grip.rotation.x = -0.35;
  group.add(grip);

  // 5. Secondary energy muzzle ring
  const muzzleGeo = new THREE.TorusGeometry(0.032, 0.008, 8, 12);
  const muzzle = new THREE.Mesh(muzzleGeo, plasmaGlow);
  muzzle.position.set(0, 0.02, -0.58);
  group.add(muzzle);

  group.rotation.set(-0.06, 0.22, 0);
  group.position.set(0.26, -0.22, -0.48);
  return group;
}

/**
 * Procedural SPAS-12 Shotgun
 */
export function createShotgunModel(): THREE.Group {
  const group = new THREE.Group();

  const gunMetal = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.8,
    roughness: 0.35,
  });

  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.85,
  });

  // 1. Receiver
  const recGeo = new THREE.BoxGeometry(0.07, 0.1, 0.38);
  const rec = new THREE.Mesh(recGeo, gunMetal);
  group.add(rec);

  // 2. Dual barrels (primary + tube)
  const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.46, 10), gunMetal);
  barrel1.rotation.x = Math.PI / 2;
  barrel1.position.set(0, 0.03, -0.38);
  group.add(barrel1);

  const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.4, 10), gunMetal);
  barrel2.rotation.x = Math.PI / 2;
  barrel2.position.set(0, -0.015, -0.35);
  group.add(barrel2);

  // 3. Ribbed pump slide
  const pumpGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.16, 12);
  const pump = new THREE.Mesh(pumpGeo, gripMat);
  pump.rotation.x = Math.PI / 2;
  pump.position.set(0, -0.015, -0.32);
  group.add(pump);

  // 4. Pistol grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.06), gripMat);
  grip.position.set(0, -0.1, 0.12);
  grip.rotation.x = -0.4;
  group.add(grip);

  group.rotation.set(-0.06, 0.22, 0);
  group.position.set(0.26, -0.22, -0.48);
  return group;
}

// -------------------------------------------------------------
// INTERACTIVE PROPS & PICKUPS
// -------------------------------------------------------------

/**
 * Explosive Barrel (Red Drum)
 */
export function createExplosiveBarrelMesh(): THREE.Group {
  const group = new THREE.Group();

  const barrelMat = new THREE.MeshStandardMaterial({
    map: createBarrelTexture(),
    metalness: 0.4,
    roughness: 0.45,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    metalness: 0.8,
    roughness: 0.3,
  });

  // Main cylinder
  const bodyGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.25, 16);
  const body = new THREE.Mesh(bodyGeo, barrelMat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Top and bottom protective rims
  [-0.62, 0.62].forEach((y) => {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.028, 8, 16), rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = y;
    group.add(rim);
  });

  // Top bunghole cap
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8), rimMat);
  cap.position.set(0.18, 0.63, 0.1);
  group.add(cap);

  return group;
}

/**
 * Supply Crate (Wood with metal brackets)
 */
export function createSupplyCrateMesh(): THREE.Group {
  const group = new THREE.Group();

  const crateMat = new THREE.MeshStandardMaterial({
    map: createCrateTexture(),
    roughness: 0.8,
    metalness: 0.1,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x374151,
    metalness: 0.7,
    roughness: 0.4,
  });

  // Main box
  const boxGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
  const box = new THREE.Mesh(boxGeo, crateMat);
  box.castShadow = true;
  box.receiveShadow = true;
  group.add(box);

  // Corner metal reinforcement brackets
  const cornerGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
  [-0.45, 0.45].forEach((x) => {
    [-0.45, 0.45].forEach((y) => {
      [-0.45, 0.45].forEach((z) => {
        const corner = new THREE.Mesh(cornerGeo, metalMat);
        corner.position.set(x, y, z);
        group.add(corner);
      });
    });
  });

  return group;
}

/**
 * High-Energy Battery / Power Core (For Generator Sockets)
 */
export function createEnergyCoreMesh(): THREE.Group {
  const group = new THREE.Group();

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.8,
    roughness: 0.25,
  });

  const plasmaMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.8,
    roughness: 0.1,
  });

  // Center cylinder
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.8, 14), plasmaMat);
  group.add(core);

  // Top and bottom electrode contacts
  [-0.42, 0.42].forEach((y) => {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.15, 14), metalMat);
    cap.position.y = y;
    group.add(cap);
  });

  return group;
}

/**
 * Health Pack / Battery Pickup
 */
export function createHealthVialMesh(): THREE.Group {
  const group = new THREE.Group();

  const gelMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x15803d,
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });

  const capMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.9,
    roughness: 0.2,
  });

  const vial = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.45, 10), gelMat);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 10), capMat);
  cap.position.y = 0.24;

  group.add(vial);
  group.add(cap);
  return group;
}

// -------------------------------------------------------------
// ENEMIES & BOSS
// -------------------------------------------------------------

/**
 * Combine Soldier / Overwatch Guard
 * 9 distinct parts: Helm with glowing blue optic, armored chest cuirass, tactical shoulder pauldrons,
 * arms, held weapon, legs, tactical boots.
 */
export function createCombineSoldierMesh(): THREE.Group {
  const group = new THREE.Group();

  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Combine grey-blue armor
    metalness: 0.6,
    roughness: 0.35,
  });

  const underMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 2.0,
  });

  // 1. Torso armor
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.65, 0.28), armorMat);
  torso.position.y = 1.15;
  torso.castShadow = true;
  group.add(torso);

  // 2. Head / Helmet
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), armorMat);
  head.position.y = 1.62;
  head.scale.set(0.9, 1.05, 0.95);
  group.add(head);

  // 3. Glowing blue visor eye
  const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 8), visorMat);
  visor.rotation.x = Math.PI / 2;
  visor.position.set(0, 1.64, 0.18);
  group.add(visor);

  // 4, 5. Shoulder pauldrons
  [-0.32, 0.32].forEach((x) => {
    const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.22), armorMat);
    pauldron.position.set(x, 1.4, 0);
    group.add(pauldron);
  });

  // 6. Arms holding weapon forward
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.5, 8), underMat);
  armL.position.set(-0.25, 1.15, 0.18);
  armL.rotation.x = -Math.PI / 3;
  group.add(armL);

  const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.5, 8), underMat);
  armR.position.set(0.22, 1.15, 0.18);
  armR.rotation.x = -Math.PI / 3;
  group.add(armR);

  // 7. Combine gun in hands
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.65), armorMat);
  gun.position.set(0, 1.05, 0.42);
  group.add(gun);

  // 8, 9. Legs & tactical boots
  [-0.14, 0.14].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.85, 8), underMat);
    leg.position.set(x, 0.45, 0);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.16, 0.25), armorMat);
    boot.position.set(x, 0.08, 0.05);
    group.add(leg);
    group.add(boot);
  });

  return group;
}

/**
 * Headcrab (Leaping alien parasite)
 */
export function createHeadcrabMesh(): THREE.Group {
  const group = new THREE.Group();

  const crabSkin = new THREE.MeshStandardMaterial({
    color: 0xc2785c,
    roughness: 0.65,
    metalness: 0.1,
  });

  const beakMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.3,
  });

  // 1. Bulbous body / carapace
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), crabSkin);
  body.scale.set(1.1, 0.7, 1.2);
  body.position.y = 0.28;
  group.add(body);

  // 2. Underbelly beak/maw
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 6), beakMat);
  beak.position.set(0, 0.14, 0.18);
  beak.rotation.x = Math.PI / 4;
  group.add(beak);

  // 3-6. Four claw legs
  const legAngles = [-0.6, 0.6, -2.4, 2.4];
  legAngles.forEach((ang) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.02, 0.35, 6), crabSkin);
    leg.position.set(Math.cos(ang) * 0.26, 0.18, Math.sin(ang) * 0.26);
    leg.rotation.z = Math.cos(ang) * 0.5;
    leg.rotation.x = Math.sin(ang) * 0.5;
    group.add(leg);
  });

  return group;
}

/**
 * Combine Hunter (Tripod Heavy Boss Unit)
 * Terrifying biped/tripod synthetic warmachine with flechette cannons.
 */
export function createCombineHunterBossMesh(): THREE.Group {
  const group = new THREE.Group();

  const hunterBlue = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f,
    metalness: 0.8,
    roughness: 0.25,
  });

  const jointsMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.9,
    roughness: 0.4,
  });

  const opticMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 2.5,
  });

  // 1. Main carapace / hull
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 1.6, 10), hunterBlue);
  hull.position.y = 2.4;
  hull.rotation.x = 0.35;
  hull.castShadow = true;
  group.add(hull);

  // 2. Turret Head with triple optics
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 10), jointsMat);
  head.position.set(0, 3.1, 0.45);
  group.add(head);

  // Triple optic eyes
  [-0.15, 0, 0.15].forEach((x, i) => {
    const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 8), opticMat);
    eye.rotation.x = Math.PI / 2;
    eye.position.set(x, 3.15 - Math.abs(x) * 0.2, 0.8);
    group.add(eye);
  });

  // 3. Flechette cannons (Dual heavy blasters)
  [-0.35, 0.35].forEach((x) => {
    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.9, 8), hunterBlue);
    cannon.rotation.x = Math.PI / 2;
    cannon.position.set(x, 2.6, 0.7);
    group.add(cannon);
  });

  // 4, 5. Powerful articulated insectoid legs
  [-0.65, 0.65].forEach((x) => {
    const hip = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), jointsMat);
    hip.position.set(x, 2.2, -0.2);
    group.add(hip);

    // Upper leg
    const upperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 1.4, 8), hunterBlue);
    upperLeg.position.set(x * 1.3, 1.7, 0.1);
    upperLeg.rotation.z = x > 0 ? -0.4 : 0.4;
    group.add(upperLeg);

    // Lower leg / claw foot
    const lowerLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.05, 1.6, 8), jointsMat);
    lowerLeg.position.set(x * 1.5, 0.75, 0.4);
    lowerLeg.rotation.x = -0.3;
    group.add(lowerLeg);
  });

  // 6. Rear stabilizing tail leg
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.06, 1.8, 8), jointsMat);
  tail.position.set(0, 1.2, -1.0);
  tail.rotation.x = 0.7;
  group.add(tail);

  return group;
}
