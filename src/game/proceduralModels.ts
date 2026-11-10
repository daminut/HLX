import * as THREE from 'three';

// -------------------------------------------------------------
// PROCEDURAL CANVAS TEXTURE GENERATORS (Rich PBR Detail)
// -------------------------------------------------------------

/**
 * Creates high-detail snow ground color & bump maps with tracks, ice, and dirt
 */
export function createSnowTextures(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base snow color with subtle cold blue/gray variation
  ctx.fillStyle = '#eaf2f8';
  ctx.fillRect(0, 0, size, size);

  // Noise / frost crystals
  for (let i = 0; i < 18000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const brightness = Math.floor(220 + Math.random() * 35);
    ctx.fillStyle = `rgb(${brightness},${brightness + 2},${brightness + 6})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  // Trampled bootprints and vehicle tire tracks
  ctx.strokeStyle = 'rgba(180, 200, 215, 0.4)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(120, 0);
  ctx.lineTo(130, size);
  ctx.moveTo(180, 0);
  ctx.lineTo(190, size);
  ctx.stroke();

  // Tire tread marks
  ctx.fillStyle = 'rgba(160, 185, 205, 0.35)';
  for (let y = 0; y < size; y += 16) {
    ctx.fillRect(115, y, 22, 6);
    ctx.fillRect(175, y, 22, 6);
  }

  // Frozen dirt & gravel specks
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = 'rgba(60, 75, 90, 0.25)';
    ctx.beginPath();
    ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(12, 12);

  // Bump map (grayscale for micro-relief height)
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 256;
  bumpCanvas.height = 256;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const v = Math.floor(Math.random() * 255);
    bCtx.fillStyle = `rgb(${v},${v},${v})`;
    bCtx.fillRect(x, y, 1.5, 1.5);
  }

  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(12, 12);

  return { map, bump };
}

/**
 * Creates corrugated, rusted shipping container textures with Combine/Black Mesa stencils
 */
export function createContainerTexture(baseHex: string, label: string): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  // Corrugated vertical metal ribs (3D lighting simulation)
  const ribWidth = 32;
  for (let x = 0; x < size; x += ribWidth) {
    // Highlight side
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(x, 0, ribWidth * 0.4, size);
    // Shadow side
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fillRect(x + ribWidth * 0.5, 0, ribWidth * 0.5, size);
  }

  // Rust drips and oxidation streaks running down from seams
  for (let i = 0; i < 45; i++) {
    const rx = Math.random() * size;
    const rHeight = 40 + Math.random() * 180;
    const rWidth = 4 + Math.random() * 12;
    const grad = ctx.createLinearGradient(rx, 0, rx, rHeight);
    grad.addColorStop(0, 'rgba(120, 50, 20, 0.85)');
    grad.addColorStop(0.7, 'rgba(150, 75, 30, 0.4)');
    grad.addColorStop(1, 'rgba(150, 75, 30, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(rx, 0, rWidth, rHeight);
  }

  // Weathered stencil markings
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(label, 24, 70);

  ctx.font = '14px monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText('SECTOR C-17 LOGISTICS // BOREALIS TRANSIT', 24, 95);
  ctx.fillText('MAX GROSS: 30,480 KG · TARE: 2,200 KG', 24, 115);

  // Barcode and warning sign
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(24, size - 110, 140, 70);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('COMBINE RESTRICTED', 30, size - 78);
  ctx.font = '11px monospace';
  ctx.fillText('PROTOCOL 4-B', 30, size - 58);

  ctx.restore();

  // Grime along bottom
  const bottomGrime = ctx.createLinearGradient(0, size - 80, 0, size);
  bottomGrime.addColorStop(0, 'rgba(20, 25, 30, 0)');
  bottomGrime.addColorStop(1, 'rgba(20, 25, 30, 0.75)');
  ctx.fillStyle = bottomGrime;
  ctx.fillRect(0, size - 80, size, 80);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;

  // Bump map for corrugated ribs
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 256;
  bumpCanvas.height = 256;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);

  const bRib = 16;
  for (let x = 0; x < 256; x += bRib) {
    bCtx.fillStyle = '#b0b0b0';
    bCtx.fillRect(x, 0, bRib * 0.5, 256);
    bCtx.fillStyle = '#505050';
    bCtx.fillRect(x + bRib * 0.5, 0, bRib * 0.5, 256);
  }

  const bump = new THREE.CanvasTexture(bumpCanvas);

  return { map, bump };
}

/**
 * Creates weathered industrial concrete & metal wall texture with caution hazard borders
 */
export function createIndustrialWallTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Concrete gray
  ctx.fillStyle = '#374151';
  ctx.fillRect(0, 0, size, size);

  // Large metal panel seams with rivets
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, size - 8, size - 8);
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.stroke();

  // Rivets along borders
  ctx.fillStyle = '#111827';
  for (let i = 16; i < size; i += 32) {
    ctx.fillRect(8, i, 4, 4);
    ctx.fillRect(size - 12, i, 4, 4);
    ctx.fillRect(size / 2 - 2, i, 4, 4);
  }

  // Hazard diagonal stripes along the base
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, size - 50, size, 50);
  ctx.clip();
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(0, size - 50, size, 50);
  ctx.fillStyle = '#111827';
  for (let x = -50; x < size + 50; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, size);
    ctx.lineTo(x + 20, size);
    ctx.lineTo(x + 50, size - 50);
    ctx.lineTo(x + 30, size - 50);
    ctx.fill();
  }
  ctx.restore();

  // Facility stencil
  ctx.fillStyle = '#9ca3af';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('APERTURE / BLACK MESA JOINT FACILITY', 20, 45);
  ctx.font = 'bold 13px monospace';
  ctx.fillText('RESEARCH SUB-DOCK 03 // BOREALIS ACCESS', 20, 70);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 128;
  bumpCanvas.height = 128;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 128, 128);
  bCtx.strokeStyle = '#303030';
  bCtx.lineWidth = 3;
  bCtx.strokeRect(2, 2, 124, 124);
  const bump = new THREE.CanvasTexture(bumpCanvas);

  return { map, bump };
}

/**
 * Creates high-detail explosive barrel textures (ribbed drum with wear, skull stencil)
 */
function createDetailedBarrelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Industrial red lacquer
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(0, 0, 512, 512);

  // Embossed metallic barrel hoop bands
  const bands = [80, 160, 350, 430];
  bands.forEach((y) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(0, y - 6, 512, 6);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(0, y, 512, 12);
  });

  // Chipped paint & metal scratch marks
  ctx.fillStyle = 'rgba(210, 215, 220, 0.6)';
  for (let i = 0; i < 90; i++) {
    const sx = Math.random() * 512;
    const sy = Math.random() * 512;
    ctx.fillRect(sx, sy, 2 + Math.random() * 6, 1.5);
  }

  // Black Mesa / Combine Flammable Hazard Diamond
  ctx.save();
  ctx.translate(256, 256);

  // Yellow diamond badge
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(0, -90);
  ctx.lineTo(90, 0);
  ctx.lineTo(0, 90);
  ctx.lineTo(-90, 0);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#000000';
  ctx.stroke();

  // Flame / Skull text
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 26px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('FLAMMABLE', 0, -10);
  ctx.font = 'bold 36px serif';
  ctx.fillText('3', 0, 35);
  ctx.font = 'bold 15px monospace';
  ctx.fillText('HAZARD CLASS', 0, 60);

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates high-detail supply crate textures (planks, metal edge brackets, nails, Black Mesa logo)
 */
function createDetailedCrateTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Weathered pine/oak planks
  ctx.fillStyle = '#854d0e';
  ctx.fillRect(0, 0, 512, 512);

  // Wood grain lines
  ctx.strokeStyle = '#713f12';
  for (let y = 0; y < 512; y += 4) {
    ctx.lineWidth = 1 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y + (Math.random() - 0.5) * 3);
    ctx.lineTo(512, y + (Math.random() - 0.5) * 3);
    ctx.stroke();
  }

  // Horizontal plank gaps
  ctx.strokeStyle = '#3f2108';
  ctx.lineWidth = 6;
  for (let y = 0; y < 512; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Diagonal reinforced cross-bracing
  ctx.strokeStyle = '#a16207';
  ctx.lineWidth = 36;
  ctx.beginPath();
  ctx.moveTo(20, 20);
  ctx.lineTo(492, 492);
  ctx.moveTo(492, 20);
  ctx.lineTo(20, 492);
  ctx.stroke();

  // Metal corner brackets
  ctx.fillStyle = '#374151';
  const cornerSize = 75;
  // 4 corners
  [[0, 0], [512 - cornerSize, 0], [0, 512 - cornerSize], [512 - cornerSize, 512 - cornerSize]].forEach(([cx, cy]) => {
    ctx.fillRect(cx, cy, cornerSize, cornerSize);
    // Silver bolt heads
    ctx.fillStyle = '#9ca3af';
    ctx.beginPath();
    ctx.arc(cx + 25, cy + 25, 6, 0, Math.PI * 2);
    ctx.arc(cx + 50, cy + 50, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#374151';
  });

  // Black Mesa Lambda Stencil
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 110px serif';
  ctx.textAlign = 'center';
  ctx.fillText('λ', 256, 290);

  ctx.font = 'bold 20px monospace';
  ctx.fillText('BLACK MESA RESEARCH', 256, 335);
  ctx.font = '14px monospace';
  ctx.fillText('SUPPLY CACHE // REQUISITION 04', 256, 360);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// -------------------------------------------------------------
// GORDON FREEMAN HEV MARK V SUIT FOREARM & GLOVE
// -------------------------------------------------------------

export function createHEVArm(isLeft: boolean = false): THREE.Group {
  const armGroup = new THREE.Group();

  const hevOrangeMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Classic HEV Mark V orange
    metalness: 0.5,
    roughness: 0.35,
  });

  const underSuitMat = new THREE.MeshStandardMaterial({
    color: 0x18181b, // Black ballistic rubber under-suit
    metalness: 0.1,
    roughness: 0.85,
  });

  const gloveMat = new THREE.MeshStandardMaterial({
    color: 0x27272a, // Dark composite combat glove
    metalness: 0.25,
    roughness: 0.7,
  });

  // 1. Forearm base (composite under-suit)
  const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.38, 10), underSuitMat);
  forearm.position.set(0, -0.19, 0.12);
  forearm.rotation.x = -0.4;
  armGroup.add(forearm);

  // 2. Heavy Orange HEV Armor Plating (forearm top shell)
  const armorPlate = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.3), hevOrangeMat);
  armorPlate.position.set(0, -0.16, 0.12);
  armorPlate.rotation.x = -0.4;
  armGroup.add(armorPlate);

  // 3. Wrist guard collar
  const wristGuard = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.06, 10), underSuitMat);
  wristGuard.position.set(0, -0.04, 0.03);
  armGroup.add(wristGuard);

  // 4. Main Hand / Palm
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.065, 0.08), gloveMat);
  palm.position.set(0, 0, 0);
  armGroup.add(palm);

  // 5. Orange armored knuckle plate
  const knuckle = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.02, 0.05), hevOrangeMat);
  knuckle.position.set(0, 0.03, 0.01);
  armGroup.add(knuckle);

  // 6. Segmented fingers wrapping around handle
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.065, 6), gloveMat);
    finger.rotation.z = Math.PI / 2;
    finger.position.set((i - 1.5) * 0.016, -0.015, -0.035);
    armGroup.add(finger);
  }

  // 7. Thumb wrapping around front
  const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 6), gloveMat);
  thumb.rotation.x = Math.PI / 3;
  thumb.position.set(isLeft ? 0.038 : -0.038, 0.02, -0.02);
  armGroup.add(thumb);

  if (isLeft) {
    armGroup.scale.x = -1;
  }

  return armGroup;
}

// -------------------------------------------------------------
// HIGH-FIDELITY WEAPON VIEWMODELS WITH FREEMAN'S HEV ARMS
// -------------------------------------------------------------

/**
 * Procedural Crowbar with Gordon Freeman's HEV Mark V Arm & Glove
 * Gripped firmly at ~45-degree angle pointing into screen center.
 */
export function createCrowbarModel(): THREE.Group {
  const root = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    metalness: 0.9,
    roughness: 0.22,
  });

  const redMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    metalness: 0.45,
    roughness: 0.35,
  });

  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.1,
    roughness: 0.85,
  });

  const crowbarGroup = new THREE.Group();

  // 1. Octagonal forged bar shaft (red painted)
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.58, 8), redMat);
  shaft.position.y = 0.22;
  crowbarGroup.add(shaft);

  // 2. Rubber grip sleeve
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.22, 8), gripMat);
  grip.position.y = 0.12;
  crowbarGroup.add(grip);

  // 3. Spiral cord wraps around grip
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.017, 0.002, 6, 12), steelMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05 + i * 0.045;
    crowbarGroup.add(ring);
  }

  // 4. Exposed bare steel tips from chipped paint
  const wearTop = new THREE.Mesh(new THREE.CylinderGeometry(0.0145, 0.0145, 0.04, 8), steelMat);
  wearTop.position.y = 0.5;
  crowbarGroup.add(wearTop);

  // 5. Bottom forged steel chisel wedge
  const chisel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.003, 0.08, 8), steelMat);
  chisel.position.y = -0.1;
  crowbarGroup.add(chisel);

  // 6. Angled curved forged elbow
  const elbow = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.14, 8), steelMat);
  elbow.position.set(-0.035, 0.56, 0);
  elbow.rotation.z = Math.PI * 0.28;
  crowbarGroup.add(elbow);

  // 7. Forged hook crowbar claw with split notch
  const clawL = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.09, 0.012), steelMat);
  clawL.position.set(-0.085, 0.62, 0.007);
  clawL.rotation.z = Math.PI * 0.44;
  crowbarGroup.add(clawL);

  const clawR = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.09, 0.012), steelMat);
  clawR.position.set(-0.085, 0.62, -0.007);
  clawR.rotation.z = Math.PI * 0.44;
  crowbarGroup.add(clawR);

  // Attach Gordon Freeman's HEV Arm gripping the crowbar
  const arm = createHEVArm(false);
  arm.position.set(0.02, 0.12, 0.02);
  arm.rotation.set(-0.1, -0.2, 0.1);
  crowbarGroup.add(arm);

  // Natural FPS ready pose: tilted forward-inward toward crosshair
  crowbarGroup.rotation.set(-0.35, 0.45, -0.32);
  crowbarGroup.position.set(0.22, -0.26, -0.42);

  root.add(crowbarGroup);
  return root;
}

/**
 * Procedural Gravity Gun (Zero-Point Energy Field Manipulator)
 * High-detail 16-piece mechanical model:
 * Heavy cast housing, hazard collar, glowing glass vacuum chamber with rotating crystal,
 * copper induction coils, vacuum tubes with glowing filaments, voltmeter dial, hydraulic hoses,
 * and three articulated claws with glowing prongs.
 */
export function createGravityGunModel(): THREE.Group {
  const group = new THREE.Group();

  const orangeMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.35,
    roughness: 0.4,
  });

  const darkCastMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.85,
    roughness: 0.25,
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    metalness: 0.9,
    roughness: 0.2,
  });

  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    metalness: 0.95,
    roughness: 0.15,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
    roughness: 0.05,
    metalness: 0.1,
  });

  const plasmaGlowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 2.5,
    roughness: 0.1,
  });

  const orangeGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 2.0,
  });

  // 1. Rear receiver & handle assembly
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.15, 0.28), darkCastMat);
  stock.position.z = 0.02;
  group.add(stock);

  // 2. Middle orange casing with cooling vent louvers
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.098, 0.26, 12), orangeMat);
  housing.rotation.x = Math.PI / 2;
  housing.position.z = -0.18;
  group.add(housing);

  // 3. Black Mesa Hazard stripe collar
  const stripeCanvas = document.createElement('canvas');
  stripeCanvas.width = 128;
  stripeCanvas.height = 128;
  const sCtx = stripeCanvas.getContext('2d')!;
  sCtx.fillStyle = '#f59e0b';
  sCtx.fillRect(0, 0, 128, 128);
  sCtx.fillStyle = '#111827';
  for (let i = -128; i < 256; i += 32) {
    sCtx.beginPath();
    sCtx.moveTo(i, 0);
    sCtx.lineTo(i + 16, 0);
    sCtx.lineTo(i - 16, 128);
    sCtx.lineTo(i - 32, 128);
    sCtx.fill();
  }
  const stripeTex = new THREE.CanvasTexture(stripeCanvas);
  stripeTex.colorSpace = THREE.SRGBColorSpace;
  const hazardMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.092, 0.092, 0.06, 12),
    new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 0.5 })
  );
  hazardMesh.rotation.x = Math.PI / 2;
  hazardMesh.position.z = -0.11;
  group.add(hazardMesh);

  // 4. Heavy copper induction coils wrapped around the barrel (3 rings)
  for (let i = 0; i < 3; i++) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.008, 8, 16), copperMat);
    coil.position.z = -0.16 - i * 0.04;
    group.add(coil);
  }

  // 5. Glass Containment Chamber
  const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.14, 12), glassMat);
  chamber.rotation.x = Math.PI / 2;
  chamber.position.z = -0.32;
  group.add(chamber);

  // 6. Rotating Zero-Point Energy Crystal inside the chamber
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.042, 1), plasmaGlowMat);
  crystal.position.z = -0.32;
  crystal.name = 'gravity_crystal';
  group.add(crystal);

  // 7. Top Vacuum Tubes with glowing orange filaments (2 tubes)
  [-0.035, 0.035].forEach((x) => {
    const tubeGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.07, 8), glassMat);
    tubeGlass.position.set(x, 0.095, -0.06);
    const tubeFilament = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.05, 6), orangeGlowMat);
    tubeFilament.position.set(x, 0.095, -0.06);
    group.add(tubeGlass);
    group.add(tubeFilament);
  });

  // 8. Analog Voltmeter Needle Gauge on the side
  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12), darkCastMat);
  gauge.rotation.z = Math.PI / 2;
  gauge.position.set(0.088, 0.03, -0.08);
  const dialFace = new THREE.Mesh(new THREE.CircleGeometry(0.03, 12), orangeGlowMat);
  dialFace.rotation.y = Math.PI / 2;
  dialFace.position.set(0.099, 0.03, -0.08);
  group.add(gauge);
  group.add(dialFace);

  // 9. Front heavy muzzle emitter collar
  const muzzleCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.075, 0.1, 12), darkCastMat);
  muzzleCollar.rotation.x = Math.PI / 2;
  muzzleCollar.position.z = -0.4;
  group.add(muzzleCollar);

  // 10, 11, 12. Three Articulated Manipulator Claws with Hydraulic Pistons
  const clawAngles = [-Math.PI * 0.35, Math.PI * 0.35, Math.PI];
  clawAngles.forEach((angle) => {
    const clawHolder = new THREE.Group();
    clawHolder.position.set(0, 0, -0.42);
    clawHolder.rotation.z = angle;

    // Hydraulic piston arm
    const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.09, 8), steelMat);
    piston.position.set(0, 0.06, -0.02);
    clawHolder.add(piston);

    // Beveled steel claw prong
    const claw = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.16), darkCastMat);
    claw.position.set(0, 0.085, -0.06);
    claw.rotation.x = -0.16; // curved inward
    clawHolder.add(claw);

    // Glowing energy discharge electrode tip
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.035), plasmaGlowMat);
    tip.position.set(0, 0.085, -0.145);
    clawHolder.add(tip);

    group.add(clawHolder);
  });

  // Attach Gordon Freeman's HEV Arms holding the Gravity Gun
  const rightArm = createHEVArm(false);
  rightArm.position.set(0.04, -0.06, 0.08);
  rightArm.rotation.set(-0.2, -0.15, 0.1);
  group.add(rightArm);

  const leftArm = createHEVArm(true);
  leftArm.position.set(-0.09, -0.04, -0.18);
  leftArm.rotation.set(-0.15, 0.45, -0.2);
  group.add(leftArm);

  group.rotation.set(-0.08, 0.18, 0);
  group.position.set(0.2, -0.22, -0.42);
  return group;
}

/**
 * Procedural Combine Pulse Rifle (Overwatch AR2)
 * High-detail 12-piece model with gunmetal plating, plasma battery, heat dispersion fins,
 * tactical scope, and muzzle energy rings.
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
    metalness: 0.3,
    roughness: 0.7,
  });

  const plasmaGlow = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 2.2,
  });

  // Receiver
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.46), combineMetal);
  group.add(body);

  // Barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.025, 0.44, 10), combineMetal);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, -0.4);
  group.add(barrel);

  // Rotating energy magazine cell
  const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.18, 10), plasmaGlow);
  cell.rotation.z = Math.PI / 2;
  cell.position.set(0.048, -0.01, -0.06);
  group.add(cell);

  // Tactical optical scope
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.18, 8), darkGrip);
  scope.rotation.x = Math.PI / 2;
  scope.position.set(0, 0.085, -0.1);
  group.add(scope);

  // Pistol grip & stock
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.15, 0.06), darkGrip);
  grip.position.set(0, -0.1, 0.08);
  grip.rotation.x = -0.35;
  group.add(grip);

  // Front energy discharge ring
  const muzzleRing = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.007, 8, 14), plasmaGlow);
  muzzleRing.position.set(0, 0.02, -0.6);
  group.add(muzzleRing);

  // Attach Gordon Freeman's HEV Arms holding the Pulse Rifle
  const rightArm = createHEVArm(false);
  rightArm.position.set(0.04, -0.1, 0.06);
  rightArm.rotation.set(-0.25, -0.1, 0.1);
  group.add(rightArm);

  const leftArm = createHEVArm(true);
  leftArm.position.set(-0.06, -0.06, -0.16);
  leftArm.rotation.set(-0.15, 0.35, -0.15);
  group.add(leftArm);

  group.rotation.set(-0.06, 0.22, 0);
  group.position.set(0.26, -0.22, -0.48);
  return group;
}

/**
 * Procedural Combat Shotgun (SPAS-12)
 */
export function createShotgunModel(): THREE.Group {
  const group = new THREE.Group();

  const gunMetal = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.3,
  });

  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.85,
  });

  // Receiver
  const rec = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.38), gunMetal);
  group.add(rec);

  // Twin barrels
  const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.48, 10), gunMetal);
  barrel1.rotation.x = Math.PI / 2;
  barrel1.position.set(0, 0.03, -0.38);
  group.add(barrel1);

  const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 10), gunMetal);
  barrel2.rotation.x = Math.PI / 2;
  barrel2.position.set(0, -0.015, -0.35);
  group.add(barrel2);

  // Pump slide with ribbed grip
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.18, 12), gripMat);
  pump.rotation.x = Math.PI / 2;
  pump.position.set(0, -0.015, -0.32);
  group.add(pump);

  // Pistol grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.06), gripMat);
  grip.position.set(0, -0.1, 0.12);
  grip.rotation.x = -0.4;
  group.add(grip);

  // Attach Gordon Freeman's HEV Arms holding the Shotgun
  const sRightArm = createHEVArm(false);
  sRightArm.position.set(0.04, -0.1, 0.1);
  sRightArm.rotation.set(-0.25, -0.1, 0.1);
  group.add(sRightArm);

  const sLeftArm = createHEVArm(true);
  sLeftArm.position.set(-0.06, -0.05, -0.2);
  sLeftArm.rotation.set(-0.15, 0.35, -0.15);
  group.add(sLeftArm);

  group.rotation.set(-0.06, 0.22, 0);
  group.position.set(0.26, -0.22, -0.48);
  return group;
}

// -------------------------------------------------------------
// INTERACTIVE PROPS WITH DETAILED TEXTURES
// -------------------------------------------------------------

export function createExplosiveBarrelMesh(): THREE.Group {
  const group = new THREE.Group();

  const barrelMat = new THREE.MeshStandardMaterial({
    map: createDetailedBarrelTexture(),
    metalness: 0.45,
    roughness: 0.4,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    metalness: 0.85,
    roughness: 0.25,
  });

  // Main corrugated drum
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.25, 18), barrelMat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Top and bottom protective metal rims
  [-0.62, 0.62].forEach((y) => {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.03, 8, 18), rimMat);
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

export function createSupplyCrateMesh(): THREE.Group {
  const group = new THREE.Group();

  const crateMat = new THREE.MeshStandardMaterial({
    map: createDetailedCrateTexture(),
    roughness: 0.8,
    metalness: 0.1,
  });

  const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), crateMat);
  box.castShadow = true;
  box.receiveShadow = true;
  group.add(box);

  return group;
}

export function createEnergyCoreMesh(): THREE.Group {
  const group = new THREE.Group();

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.85,
    roughness: 0.25,
  });

  const plasmaMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 2.2,
    roughness: 0.1,
  });

  // Center cylinder
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.8, 14), plasmaMat);
  group.add(core);

  // Top and bottom caps
  [-0.42, 0.42].forEach((y) => {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.15, 14), metalMat);
    cap.position.y = y;
    group.add(cap);
  });

  return group;
}

export function createHealthVialMesh(): THREE.Group {
  const group = new THREE.Group();

  const gelMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x15803d,
    emissiveIntensity: 1.4,
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
// HIGH-DETAIL COMBINE SOLDIERS & BOSS
// -------------------------------------------------------------

/**
 * Combine Overwatch Soldier (12 distinct parts)
 * Tactical combat helmet with gas-mask filter vocoder, tactical goggles, armor plates,
 * harness, shoulder pauldrons, combat boots, and pulse rifle with laser sight.
 */
export function createCombineSoldierMesh(): THREE.Group {
  const group = new THREE.Group();

  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.7,
    roughness: 0.35,
  });

  const underMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.85,
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 2.2,
  });

  const redLaserMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
  });

  // 1. Torso armor cuirass
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.65, 0.3), armorMat);
  torso.position.y = 1.15;
  torso.castShadow = true;
  group.add(torso);

  // Tactical harness straps across chest
  const harness = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.32), underMat);
  harness.position.y = 1.25;
  group.add(harness);

  // 2. Head / Helmet
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), armorMat);
  head.position.y = 1.62;
  head.scale.set(0.9, 1.05, 0.95);
  group.add(head);

  // Gas mask filter canister on snout
  const gasMask = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 8), underMat);
  gasMask.rotation.x = Math.PI / 2;
  gasMask.position.set(0, 1.54, 0.18);
  group.add(gasMask);

  // 3. Glowing blue optic lens
  const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 8), visorMat);
  visor.rotation.x = Math.PI / 2;
  visor.position.set(0, 1.65, 0.19);
  group.add(visor);

  // 4, 5. Armored shoulder pauldrons
  [-0.32, 0.32].forEach((x) => {
    const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.22), armorMat);
    pauldron.position.set(x, 1.4, 0);
    group.add(pauldron);
  });

  // 6, 7. Arms holding weapon
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.5, 8), underMat);
  armL.position.set(-0.25, 1.15, 0.18);
  armL.rotation.x = -Math.PI / 3;
  group.add(armL);

  const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.5, 8), underMat);
  armR.position.set(0.22, 1.15, 0.18);
  armR.rotation.x = -Math.PI / 3;
  group.add(armR);

  // 8. Combine weapon with red laser targeting beam
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.65), armorMat);
  gun.position.set(0, 1.05, 0.42);
  group.add(gun);

  // Laser sight beam extending forward
  const laser = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 12, 6), redLaserMat);
  laser.rotation.x = Math.PI / 2;
  laser.position.set(0, 1.05, 6.4);
  group.add(laser);

  // 9, 10. Legs with knee armor & tactical boots
  [-0.14, 0.14].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.85, 8), underMat);
    leg.position.set(x, 0.45, 0);

    const kneePad = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.06), armorMat);
    kneePad.position.set(x, 0.48, 0.1);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.16, 0.25), armorMat);
    boot.position.set(x, 0.08, 0.05);

    group.add(leg);
    group.add(kneePad);
    group.add(boot);
  });

  return group;
}

/**
 * Headcrab
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

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), crabSkin);
  body.scale.set(1.1, 0.7, 1.2);
  body.position.y = 0.28;
  group.add(body);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 6), beakMat);
  beak.position.set(0, 0.14, 0.18);
  beak.rotation.x = Math.PI / 4;
  group.add(beak);

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
 * Combine Hunter Boss
 */
export function createCombineHunterBossMesh(): THREE.Group {
  const group = new THREE.Group();

  const hunterBlue = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f,
    metalness: 0.85,
    roughness: 0.2,
  });

  const jointsMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.9,
    roughness: 0.4,
  });

  const opticMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 2.8,
  });

  // Main carapace hull
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 1.6, 10), hunterBlue);
  hull.position.y = 2.4;
  hull.rotation.x = 0.35;
  hull.castShadow = true;
  group.add(hull);

  // Turret Head with triple optics
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 10), jointsMat);
  head.position.set(0, 3.1, 0.45);
  group.add(head);

  [-0.15, 0, 0.15].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 8), opticMat);
    eye.rotation.x = Math.PI / 2;
    eye.position.set(x, 3.15 - Math.abs(x) * 0.2, 0.8);
    group.add(eye);
  });

  // Dual Flechette cannons
  [-0.35, 0.35].forEach((x) => {
    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.9, 8), hunterBlue);
    cannon.rotation.x = Math.PI / 2;
    cannon.position.set(x, 2.6, 0.7);
    group.add(cannon);
  });

  // Articulated legs with spurs
  [-0.65, 0.65].forEach((x) => {
    const hip = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), jointsMat);
    hip.position.set(x, 2.2, -0.2);
    group.add(hip);

    const upperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 1.4, 8), hunterBlue);
    upperLeg.position.set(x * 1.3, 1.7, 0.1);
    upperLeg.rotation.z = x > 0 ? -0.4 : 0.4;
    group.add(upperLeg);

    const lowerLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.05, 1.6, 8), jointsMat);
    lowerLeg.position.set(x * 1.5, 0.75, 0.4);
    lowerLeg.rotation.x = -0.3;
    group.add(lowerLeg);
  });

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.06, 1.8, 8), jointsMat);
  tail.position.set(0, 1.2, -1.0);
  tail.rotation.x = 0.7;
  group.add(tail);

  return group;
}
