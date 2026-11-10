import * as THREE from 'three';
import {
  createSnowTextures,
  createContainerTexture,
  createIndustrialWallTexture,
} from './proceduralModels';

export interface WorldProps {
  scene: THREE.Scene;
  collisionBoxes: THREE.Box3[];
  generatorSockets: { position: THREE.Vector3; filled: boolean }[];
  forcefieldMesh: THREE.Mesh | null;
  portalTriggerBox: THREE.Box3;
  geigerZones: { center: THREE.Vector3; radius: number }[];
}

export function buildBorealisWorld(scene: THREE.Scene): WorldProps {
  const collisionBoxes: THREE.Box3[] = [];
  const geigerZones: { center: THREE.Vector3; radius: number }[] = [];

  // 1. Snow Terrain with high-detail PBR maps (tracks, crystalline frost, micro-relief bump)
  const terrainGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const distFromCenter = Math.sqrt(x * x + y * y);
    const elevation =
      Math.sin(x * 0.08) * Math.cos(y * 0.08) * 0.8 +
      (distFromCenter > 48 ? (distFromCenter - 48) * 0.4 : 0);
    posAttr.setZ(i, elevation);
  }
  terrainGeo.computeVertexNormals();

  const { map: snowMap, bump: snowBump } = createSnowTextures();
  const snowMat = new THREE.MeshStandardMaterial({
    map: snowMap,
    bumpMap: snowBump,
    bumpScale: 0.12,
    roughness: 0.75,
    metalness: 0.1,
  });

  const terrain = new THREE.Mesh(terrainGeo, snowMat);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = 0;
  terrain.receiveShadow = true;
  scene.add(terrain);

  // 2. Distant Combine Citadel Spire (Iconic landmark with glowing energy conduits)
  const citadelGroup = new THREE.Group();
  const citadelMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.25,
    metalness: 0.95,
  });
  const citadelGlowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 3.5,
  });

  // Main tapering monolith
  const spireGeo = new THREE.CylinderGeometry(2.5, 14, 160, 8);
  const spire = new THREE.Mesh(spireGeo, citadelMat);
  spire.position.set(0, 80, 0);
  citadelGroup.add(spire);

  // Spire vertical energy conduits
  for (let ang = 0; ang < Math.PI * 2; ang += Math.PI / 2) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.8, 140, 1.2), citadelGlowMat);
    strip.position.set(Math.cos(ang) * 4.5, 80, Math.sin(ang) * 4.5);
    citadelGroup.add(strip);
  }

  // Top pulsing nexus beacon
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(6, 12, 12), citadelGlowMat);
  beacon.position.set(0, 155, 0);
  citadelGroup.add(beacon);

  citadelGroup.position.set(0, 0, -95);
  scene.add(citadelGroup);

  // 3. Natural Perimeter: Jagged Arctic Rock & Ice Cliffs
  const rockGeo = new THREE.DodecahedronGeometry(8, 1);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.85,
    metalness: 0.2,
  });

  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 10) {
    const r = 58 + Math.sin(angle * 4) * 6;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    if (z < -42 && Math.abs(x) < 14) continue; // Leave northern hangar opening

    const cliff = new THREE.Mesh(rockGeo, rockMat);
    cliff.position.set(x, 4 + Math.random() * 2, z);
    cliff.scale.set(1.5 + Math.random() * 0.8, 2.2 + Math.random() * 1.5, 1.5 + Math.random() * 0.8);
    cliff.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
    scene.add(cliff);

    collisionBoxes.push(new THREE.Box3().setFromObject(cliff));
  }

  // 4. Borealis Hangar Entrance with Detailed Industrial Wall & Stencils
  const { map: wallMap, bump: wallBump } = createIndustrialWallTexture();
  const hangarWallMat = new THREE.MeshStandardMaterial({
    map: wallMap,
    bumpMap: wallBump,
    bumpScale: 0.08,
    roughness: 0.6,
    metalness: 0.4,
  });

  const hangarWidth = 32;
  const hangarHeight = 14;
  const hangarDepth = 24;

  const hangar = new THREE.Mesh(
    new THREE.BoxGeometry(hangarWidth, hangarHeight, hangarDepth),
    hangarWallMat
  );
  hangar.position.set(0, hangarHeight / 2, -54);
  scene.add(hangar);
  collisionBoxes.push(new THREE.Box3().setFromObject(hangar));

  // Overhead steel truss archway
  const archL = new THREE.Mesh(new THREE.BoxGeometry(4, 11, 4), hangarWallMat);
  archL.position.set(-8, 5.5, -42);
  scene.add(archL);
  collisionBoxes.push(new THREE.Box3().setFromObject(archL));

  const archR = new THREE.Mesh(new THREE.BoxGeometry(4, 11, 4), hangarWallMat);
  archR.position.set(8, 5.5, -42);
  scene.add(archR);
  collisionBoxes.push(new THREE.Box3().setFromObject(archR));

  const archTop = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 4), hangarWallMat);
  archTop.position.set(0, 10.5, -42);
  scene.add(archTop);

  // Combine Forcefield Barrier
  const forcefieldGeo = new THREE.PlaneGeometry(12, 9);
  const forcefieldMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 2.2,
    transparent: true,
    opacity: 0.78,
    roughness: 0.1,
    side: THREE.DoubleSide,
  });
  const forcefield = new THREE.Mesh(forcefieldGeo, forcefieldMat);
  forcefield.position.set(0, 4.5, -42);
  scene.add(forcefield);

  const forcefieldBox = new THREE.Box3(
    new THREE.Vector3(-6, 0, -43),
    new THREE.Vector3(6, 9, -41)
  );
  collisionBoxes.push(forcefieldBox);

  // Portal trigger inside hangar
  const portalTriggerBox = new THREE.Box3(
    new THREE.Vector3(-8, 0, -56),
    new THREE.Vector3(8, 9, -46)
  );

  // 5. Heavy Rusted Corrugated Shipping Containers (High visual realism)
  const blueCont = createContainerTexture('#0369a1', 'APERTURE-SCIENCE // C-17');
  const orangeCont = createContainerTexture('#c2410c', 'COMBINE LOGISTICS // DIV-08');

  const containerData = [
    { pos: new THREE.Vector3(-14, 1.6, -18), rot: 0.15, tex: blueCont },
    { pos: new THREE.Vector3(-16, 1.6, -6), rot: -0.3, tex: orangeCont },
    { pos: new THREE.Vector3(8, 1.6, 4), rot: 0.6, tex: blueCont },
    { pos: new THREE.Vector3(-8, 1.6, 16), rot: -0.2, tex: orangeCont },
    { pos: new THREE.Vector3(22, 1.6, 10), rot: 0.4, tex: blueCont },
    { pos: new THREE.Vector3(18, 1.6, -24), rot: -0.5, tex: orangeCont },
  ];

  const steelCornerMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    metalness: 0.85,
    roughness: 0.3,
  });

  containerData.forEach(({ pos, rot, tex }) => {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      map: tex.map,
      bumpMap: tex.bump,
      bumpScale: 0.15,
      roughness: 0.65,
      metalness: 0.4,
    });

    // Main hull
    const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 7.5), mat);
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    // 4 Corner steel support pillars
    [-1.6, 1.6].forEach((cx) => {
      [-3.75, 3.75].forEach((cz) => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.25, 0.2), steelCornerMat);
        pillar.position.set(cx, 0, cz);
        group.add(pillar);
      });
    });

    // Rear door locking rods
    [-0.5, 0.5].forEach((rx) => {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 3.1, 6), steelCornerMat);
      rod.position.set(rx, 0, 3.8);
      group.add(rod);
    });

    group.position.copy(pos);
    group.rotation.y = rot;
    scene.add(group);
    collisionBoxes.push(new THREE.Box3().setFromObject(group));
  });

  // 6. Detailed Industrial Power Generator (Turbine with copper coils)
  const genGroup = new THREE.Group();
  const genBaseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.8,
    roughness: 0.3,
  });

  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(8, 3.8, 6), genBaseMat);
  baseMesh.position.set(20, 1.9, -15);
  scene.add(baseMesh);
  collisionBoxes.push(new THREE.Box3().setFromObject(baseMesh));

  // Turbine coil
  const turbine = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 5.5, 16),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 })
  );
  turbine.rotation.z = Math.PI / 2;
  turbine.position.set(20, 4.6, -15);
  scene.add(turbine);

  // Copper coil wrappings
  for (let i = -2; i <= 2; i++) {
    const coil = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.12, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.95, roughness: 0.15 })
    );
    coil.rotation.y = Math.PI / 2;
    coil.position.set(20 + i * 0.9, 4.6, -15);
    scene.add(coil);
  }

  // 2 Battery Sockets with glowing status indicator ring
  const socketMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0xe11d48,
    emissiveIntensity: 1.2,
  });

  const socketPositions = [
    new THREE.Vector3(17.4, 1.8, -16.5),
    new THREE.Vector3(17.4, 1.8, -13.5),
  ];

  const generatorSockets = socketPositions.map((pos) => {
    const socketMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 12), socketMat);
    socketMesh.rotation.z = Math.PI / 2;
    socketMesh.position.copy(pos);
    scene.add(socketMesh);
    return { position: pos.clone(), filled: false };
  });

  // 7. Radioactive Toxic Waste Canal with glowing green sludge & steam
  const canalMat = new THREE.MeshStandardMaterial({
    color: 0x84cc16,
    emissive: 0x4d7c0f,
    emissiveIntensity: 2.2,
    roughness: 0.15,
  });

  const canal = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 16), canalMat);
  canal.position.set(-22, 0.05, 12);
  scene.add(canal);

  geigerZones.push({
    center: new THREE.Vector3(-22, 0, 12),
    radius: 9.5,
  });

  // 8. Overhead Industrial Floodlights
  const lightPoleMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.85 });
  const lightPositions = [
    new THREE.Vector3(-5, 0, -28),
    new THREE.Vector3(14, 0, -22),
    new THREE.Vector3(-6, 0, 0),
    new THREE.Vector3(12, 0, 18),
  ];

  lightPositions.forEach((pos) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 6.5, 8), lightPoleMat);
    pole.position.set(pos.x, 3.25, pos.z);
    scene.add(pole);

    const fixture = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.4, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 2.5 })
    );
    fixture.position.set(pos.x, 6.4, pos.z);
    scene.add(fixture);

    const workLight = new THREE.PointLight(0xfef08a, 1.2, 24);
    workLight.position.set(pos.x, 6.2, pos.z);
    scene.add(workLight);
  });

  return {
    scene,
    collisionBoxes,
    generatorSockets,
    forcefieldMesh: forcefield,
    portalTriggerBox,
    geigerZones,
  };
}
