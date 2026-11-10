import * as THREE from 'three';

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

  // 1. Snow Terrain
  const terrainGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
  // Add gentle undulations to terrain vertices
  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    // Subtle snowy rolling hills
    const distFromCenter = Math.sqrt(x * x + y * y);
    const elevation = Math.sin(x * 0.08) * Math.cos(y * 0.08) * 0.8 + (distFromCenter > 50 ? (distFromCenter - 50) * 0.35 : 0);
    posAttr.setZ(i, elevation);
  }
  terrainGeo.computeVertexNormals();

  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xebf4ff,
    roughness: 0.85,
    metalness: 0.05,
  });

  const terrain = new THREE.Mesh(terrainGeo, snowMat);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = 0;
  terrain.receiveShadow = true;
  scene.add(terrain);

  // 2. Distant Combine Citadel Spire (Iconic Half-Life landmark in the horizon)
  const citadelGroup = new THREE.Group();
  const citadelMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.3,
    metalness: 0.9,
  });
  const citadelGlowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 2.0,
  });

  // Main spire tapering thousands of meters up
  const spireGeo = new THREE.CylinderGeometry(2.5, 12, 140, 8);
  const spire = new THREE.Mesh(spireGeo, citadelMat);
  spire.position.set(0, 70, 0);
  citadelGroup.add(spire);

  // Spire blue energy channel
  const energyStripGeo = new THREE.BoxGeometry(0.8, 120, 1.2);
  const energyStrip = new THREE.Mesh(energyStripGeo, citadelGlowMat);
  energyStrip.position.set(0, 70, 4);
  citadelGroup.add(energyStrip);

  citadelGroup.position.set(0, 0, -90);
  scene.add(citadelGroup);

  // 3. Natural Perimeter: Jagged Arctic Ice & Rock Cliffs
  const rockGeo = new THREE.DodecahedronGeometry(8, 1);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.9,
    metalness: 0.1,
  });

  // Ring of perimeter cliffs keeping player within the research outpost
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 10) {
    const r = 58 + Math.sin(angle * 4) * 6;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    // Skip the entrance to the Borealis hangar at the north
    if (z < -42 && Math.abs(x) < 14) continue;

    const cliff = new THREE.Mesh(rockGeo, rockMat);
    cliff.position.set(x, 4 + Math.random() * 2, z);
    cliff.scale.set(1.4 + Math.random() * 0.8, 2.0 + Math.random() * 1.5, 1.4 + Math.random() * 0.8);
    cliff.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
    scene.add(cliff);

    const box = new THREE.Box3().setFromObject(cliff);
    collisionBoxes.push(box);
  }

  // 4. Research Outpost Buildings & Hangars
  const buildingMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.7,
    metalness: 0.4,
  });

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x374151,
    roughness: 0.8,
    metalness: 0.2,
  });

  // Borealis Hangar (North end)
  const hangarWidth = 28;
  const hangarHeight = 12;
  const hangarDepth = 24;

  const hangar = new THREE.Mesh(
    new THREE.BoxGeometry(hangarWidth, hangarHeight, hangarDepth),
    buildingMat
  );
  hangar.position.set(0, hangarHeight / 2, -54);
  scene.add(hangar);
  collisionBoxes.push(new THREE.Box3().setFromObject(hangar));

  // Borealis Hangar Entrance Archway
  const archL = new THREE.Mesh(new THREE.BoxGeometry(4, 10, 4), wallMat);
  archL.position.set(-8, 5, -42);
  scene.add(archL);
  collisionBoxes.push(new THREE.Box3().setFromObject(archL));

  const archR = new THREE.Mesh(new THREE.BoxGeometry(4, 10, 4), wallMat);
  archR.position.set(8, 5, -42);
  scene.add(archR);
  collisionBoxes.push(new THREE.Box3().setFromObject(archR));

  const archTop = new THREE.Mesh(new THREE.BoxGeometry(20, 2.5, 4), wallMat);
  archTop.position.set(0, 9.5, -42);
  scene.add(archTop);

  // Combine Forcefield Barrier (blocking the archway until power is restored)
  const forcefieldGeo = new THREE.PlaneGeometry(12, 8);
  const forcefieldMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.6,
    transparent: true,
    opacity: 0.75,
    roughness: 0.1,
    side: THREE.DoubleSide,
  });
  const forcefield = new THREE.Mesh(forcefieldGeo, forcefieldMat);
  forcefield.position.set(0, 4, -42);
  scene.add(forcefield);

  // Forcefield collision barrier (will be removed when power is restored)
  const forcefieldBox = new THREE.Box3(
    new THREE.Vector3(-6, 0, -43),
    new THREE.Vector3(6, 8, -41)
  );
  collisionBoxes.push(forcefieldBox);

  // Portal Teleport trigger inside the hangar
  const portalTriggerBox = new THREE.Box3(
    new THREE.Vector3(-8, 0, -56),
    new THREE.Vector3(8, 8, -46)
  );

  // 5. Generator Turbine & Reactor Unit (East side of outpost)
  const generatorBase = new THREE.Mesh(
    new THREE.BoxGeometry(8, 4, 6),
    buildingMat
  );
  generatorBase.position.set(20, 2, -15);
  scene.add(generatorBase);
  collisionBoxes.push(new THREE.Box3().setFromObject(generatorBase));

  // Turbine coil
  const turbine = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 5, 12),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.25 })
  );
  turbine.rotation.z = Math.PI / 2;
  turbine.position.set(20, 4.8, -15);
  scene.add(turbine);

  // 2 Battery Socket Receptacles on generator side
  const socketMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0xe11d48, // starts red, turns cyan when inserted
    emissiveIntensity: 0.8,
  });

  const socketPositions = [
    new THREE.Vector3(17.5, 1.8, -16.5),
    new THREE.Vector3(17.5, 1.8, -13.5),
  ];

  const generatorSockets = socketPositions.map((pos) => {
    const socketMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 10), socketMat);
    socketMesh.rotation.z = Math.PI / 2;
    socketMesh.position.copy(pos);
    scene.add(socketMesh);
    return { position: pos.clone(), filled: false };
  });

  // 6. Industrial Shipping Containers & Barriers (Cover & navigation paths)
  const containerMat = new THREE.MeshStandardMaterial({
    color: 0x0369a1, // Blue freight container
    roughness: 0.6,
    metalness: 0.5,
  });
  const containerOrange = new THREE.MeshStandardMaterial({
    color: 0xc2410c, // Rust orange freight container
    roughness: 0.6,
    metalness: 0.5,
  });

  const containers = [
    { pos: new THREE.Vector3(-14, 1.5, -18), rot: 0.15, mat: containerMat },
    { pos: new THREE.Vector3(-16, 1.5, -6), rot: -0.3, mat: containerOrange },
    { pos: new THREE.Vector3(8, 1.5, 4), rot: 0.6, mat: containerMat },
    { pos: new THREE.Vector3(-8, 1.5, 16), rot: -0.2, mat: containerOrange },
    { pos: new THREE.Vector3(22, 1.5, 10), rot: 0.4, mat: containerMat },
  ];

  containers.forEach(({ pos, rot, mat }) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 7), mat);
    mesh.position.copy(pos);
    mesh.rotation.y = rot;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    collisionBoxes.push(new THREE.Box3().setFromObject(mesh));
  });

  // 7. Radioactive Toxic Waste Canal (South-West corner)
  const canalMat = new THREE.MeshStandardMaterial({
    color: 0x84cc16,
    emissive: 0x4d7c0f,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });

  const canal = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 14), canalMat);
  canal.position.set(-22, 0.05, 12);
  scene.add(canal);

  // Toxic hazard area: triggers Geiger counter and damage if stepped on!
  geigerZones.push({
    center: new THREE.Vector3(-22, 0, 12),
    radius: 9,
  });

  // Radiation warning barrels & signs
  const signPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 2.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x1f2937 })
  );
  signPost.position.set(-14, 1.25, 12);
  scene.add(signPost);

  // 8. Overhead Industrial Floodlights
  const lightPoleMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8 });
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
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 1.8 })
    );
    fixture.position.set(pos.x, 6.4, pos.z);
    scene.add(fixture);

    // Warm work light
    const workLight = new THREE.PointLight(0xfef08a, 1.2, 22);
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
