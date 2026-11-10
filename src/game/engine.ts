import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  GameState,
  WeaponId,
  WeaponInfo,
  PlayerStats,
} from './types';
import {
  applyDamage,
  applyHeal,
  canFireWeapon,
  consumeWeaponAmmo,
  addAmmo,
  calculateGravityPuntImpulse,
  calculateExplosionDamage,
} from './combat';
import { soundSystem } from './audio';
import {
  createCrowbarModel,
  createGravityGunModel,
  createPulseRifleModel,
  createShotgunModel,
  createExplosiveBarrelMesh,
  createSupplyCrateMesh,
  createEnergyCoreMesh,
  createHealthVialMesh,
  createCombineSoldierMesh,
  createHeadcrabMesh,
  createCombineHunterBossMesh,
} from './proceduralModels';
import { buildBorealisWorld, WorldProps } from './world';

export interface EngineCallbacks {
  onStatsUpdate: (stats: PlayerStats) => void;
  onStateChange: (state: GameState) => void;
  onMessage: (msg: string) => void;
}

export interface PhysicsProp {
  id: string;
  type: 'barrel' | 'crate' | 'core' | 'saw';
  mesh: THREE.Group;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  isHeld: boolean;
  isPunted: boolean;
  health: number;
  radius: number;
  mass: number;
}

export interface Enemy {
  id: string;
  type: 'headcrab' | 'combine_soldier' | 'combine_hunter';
  mesh: THREE.Group;
  health: number;
  maxHealth: number;
  speed: number;
  state: 'idle' | 'chase' | 'attack_windup' | 'attacking' | 'dead';
  timer: number;
  attackCooldown: number;
  isTelegraphing: boolean;
  telegraphTimer: number;
  deadTimer: number;
}

export class HalfLifeEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private lastTime: number = 0;
  private totalElapsedTime: number = 0;

  private isSoftwareGl: boolean = false;
  private animationFrameId: number = 0;
  private isDestroyed: boolean = false;

  // Game state
  private gameState: GameState = 'title';
  private timeScale: number = 1.0;
  private hitstopTimer: number = 0;
  private cameraShake: number = 0;

  // Snow flurry ambient particle system
  private snowSystem!: THREE.Points;
  private snowPositions!: Float32Array;
  private snowCount: number = 120;

  // Gravity Gun tractor beam lines
  private gravityBeamLines: THREE.Line[] = [];

  // Player state
  private playerPos = new THREE.Vector3(0, 1.7, 24);
  private playerVelocity = new THREE.Vector3(0, 0, 0);
  private yaw: number = 0;
  private pitch: number = 0;
  private isGrounded: boolean = true;
  private isSprinting: boolean = false;

  // Stats
  private health: number = 100;
  private maxHealth: number = 100;
  private suitPower: number = 100;
  private maxSuitPower: number = 100;
  private score: number = 0;
  private enemiesDefeated: number = 0;
  private coresInserted: number = 0;
  private bossSpawned: boolean = false;
  private bossDefeated: boolean = false;
  private portalReached: boolean = false;
  private geigerLevel: number = 0;

  // Weapons
  private activeWeapon: WeaponId = 'crowbar';
  private weapons: Record<WeaponId, WeaponInfo> = {
    crowbar: {
      id: 'crowbar',
      name: 'Crowbar',
      role: 'Heavy Melee',
      slotKey: '1',
      maxAmmo: 1,
      currentAmmo: 1,
      cooldown: 0.38,
      damage: 35,
      unlocked: true,
    },
    gravity_gun: {
      id: 'gravity_gun',
      name: 'Zero-Point Energy Manipulator',
      role: 'Physics Punt & Trap',
      slotKey: '2',
      maxAmmo: 1,
      currentAmmo: 1,
      cooldown: 0.3,
      damage: 50,
      unlocked: true,
    },
    pulse_rifle: {
      id: 'pulse_rifle',
      name: 'Overwatch Pulse Rifle (AR2)',
      role: 'Rapid Plasma Discharge',
      slotKey: '3',
      maxAmmo: 120,
      currentAmmo: 60,
      cooldown: 0.12,
      damage: 24,
      unlocked: true,
    },
    shotgun: {
      id: 'shotgun',
      name: 'SPAS-12 Combat Shotgun',
      role: 'Point-Blank Kinetic Blast',
      slotKey: '4',
      maxAmmo: 32,
      currentAmmo: 16,
      cooldown: 0.75,
      damage: 90,
      unlocked: true,
    },
  };
  private lastFireTimes: Record<WeaponId, number> = {
    crowbar: 0,
    gravity_gun: 0,
    pulse_rifle: 0,
    shotgun: 0,
  };

  // Viewmodel rigs
  private weaponRig!: THREE.Group;
  private weaponModels: Partial<Record<WeaponId, THREE.Group>> = {};
  private weaponRecoil: number = 0;
  private weaponBobTime: number = 0;
  private swingAngle: number = 0;
  private muzzleFlashLight!: THREE.PointLight;

  // World and Physics Props
  private worldData!: WorldProps;
  private props: PhysicsProp[] = [];
  private heldProp: PhysicsProp | null = null;
  private enemies: Enemy[] = [];

  // Particles
  private particles: {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    active: boolean;
  }[] = [];

  // Input states
  private keysHeld = new Set<string>();
  private isPointerLocked: boolean = false;
  private mouseDownLeft: boolean = false;
  private mouseDownRight: boolean = false;
  private crosshairHoveringProp: boolean = false;

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.checkSoftwareGl();
    this.initThree();
    this.initWorld();
    this.initWeapons();
    this.initPropsAndEnemies();
    this.initParticlePool();
    this.initSnowParticles();
    this.initInputListeners();

    // Start render loop with performance.now
    this.lastTime = performance.now();
    this.tick = this.tick.bind(this);
    this.tick();
  }

  private initSnowParticles() {
    const geo = new THREE.BufferGeometry();
    this.snowPositions = new Float32Array(this.snowCount * 3);

    for (let i = 0; i < this.snowCount; i++) {
      this.snowPositions[i * 3] = (Math.random() - 0.5) * 60;
      this.snowPositions[i * 3 + 1] = Math.random() * 25;
      this.snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.snowPositions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.18,
      transparent: true,
      opacity: 0.8,
    });

    this.snowSystem = new THREE.Points(geo, mat);
    this.scene.add(this.snowSystem);
  }

  private checkSoftwareGl() {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        this.isSoftwareGl = true;
        return;
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      this.isSoftwareGl = true;
    }
  }

  private initThree() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a); // Deep arctic night sky
    this.scene.fog = new THREE.FogExp2(0x0f172a, 0.018); // Horizon fog matching sky

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 300);
    this.camera.position.copy(this.playerPos);

    // Studio Environment reflection
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch {
      // Fallback
    }

    // Directional Sunlight (Cold winter sun)
    const sunLight = new THREE.DirectionalLight(0xe0f2fe, 1.4);
    sunLight.position.set(40, 60, 30);
    if (!this.isSoftwareGl) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 160;
      const d = 50;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(sunLight);

    // Cool ambient hemisphere fill
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 0.7);
    this.scene.add(hemiLight);

    // Muzzle flash dynamic light
    this.muzzleFlashLight = new THREE.PointLight(0x38bdf8, 0, 15);
    this.camera.add(this.muzzleFlashLight);
    this.scene.add(this.camera);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private initWorld() {
    this.worldData = buildBorealisWorld(this.scene);
  }

  private initWeapons() {
    this.weaponRig = new THREE.Group();
    this.camera.add(this.weaponRig);

    // Create 3D viewmodels
    this.weaponModels.crowbar = createCrowbarModel();
    this.weaponModels.gravity_gun = createGravityGunModel();
    this.weaponModels.pulse_rifle = createPulseRifleModel();
    this.weaponModels.shotgun = createShotgunModel();

    Object.entries(this.weaponModels).forEach(([id, model]) => {
      if (model) {
        model.visible = id === this.activeWeapon;
        this.weaponRig.add(model);
      }
    });
  }

  private initPropsAndEnemies() {
    // 1. Explosive Barrels
    const barrelLocations = [
      new THREE.Vector3(-8, 0.65, 5),
      new THREE.Vector3(-10, 0.65, -8),
      new THREE.Vector3(10, 0.65, -6),
      new THREE.Vector3(12, 0.65, 8),
      new THREE.Vector3(-4, 0.65, -22),
      new THREE.Vector3(5, 0.65, -30),
    ];

    barrelLocations.forEach((pos, idx) => {
      const mesh = createExplosiveBarrelMesh();
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.props.push({
        id: `barrel_${idx}`,
        type: 'barrel',
        mesh,
        velocity: new THREE.Vector3(),
        angularVelocity: new THREE.Vector3(),
        isHeld: false,
        isPunted: false,
        health: 50,
        radius: 0.5,
        mass: 15,
      });
    });

    // 2. Supply Crates
    const crateLocations = [
      new THREE.Vector3(-6, 0.45, 12),
      new THREE.Vector3(6, 0.45, 14),
      new THREE.Vector3(-18, 0.45, -2),
      new THREE.Vector3(18, 0.45, 2),
      new THREE.Vector3(16, 0.45, -20),
      new THREE.Vector3(-12, 0.45, -26),
    ];

    crateLocations.forEach((pos, idx) => {
      const mesh = createSupplyCrateMesh();
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.props.push({
        id: `crate_${idx}`,
        type: 'crate',
        mesh,
        velocity: new THREE.Vector3(),
        angularVelocity: new THREE.Vector3(),
        isHeld: false,
        isPunted: false,
        health: 40,
        radius: 0.6,
        mass: 12,
      });
    });

    // 3. Energy Batteries / Cores (Needed for Generator)
    const coreLocations = [
      new THREE.Vector3(-14, 0.45, -12), // Behind blue container
      new THREE.Vector3(12, 0.45, 2),    // Near east yard
    ];

    coreLocations.forEach((pos, idx) => {
      const mesh = createEnergyCoreMesh();
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.props.push({
        id: `core_${idx}`,
        type: 'core',
        mesh,
        velocity: new THREE.Vector3(),
        angularVelocity: new THREE.Vector3(),
        isHeld: false,
        isPunted: false,
        health: 9999, // indestructible battery
        radius: 0.4,
        mass: 8,
      });
    });

    // 4. Initial Combine Soldiers
    const soldierLocations = [
      new THREE.Vector3(-8, 0, -14),
      new THREE.Vector3(6, 0, -18),
      new THREE.Vector3(0, 0, -32),
    ];

    soldierLocations.forEach((pos, idx) => {
      const mesh = createCombineSoldierMesh();
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.enemies.push({
        id: `soldier_${idx}`,
        type: 'combine_soldier',
        mesh,
        health: 90,
        maxHealth: 90,
        speed: 3.2,
        state: 'idle',
        timer: Math.random() * 2,
        attackCooldown: 1.5,
        isTelegraphing: false,
        telegraphTimer: 0,
        deadTimer: 0,
      });
    });

    // 5. Headcrabs
    const crabLocations = [
      new THREE.Vector3(-18, 0, 8),
      new THREE.Vector3(-14, 0, 16),
    ];

    crabLocations.forEach((pos, idx) => {
      const mesh = createHeadcrabMesh();
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.enemies.push({
        id: `crab_${idx}`,
        type: 'headcrab',
        mesh,
        health: 30,
        maxHealth: 30,
        speed: 4.5,
        state: 'idle',
        timer: Math.random() * 2,
        attackCooldown: 1.2,
        isTelegraphing: false,
        telegraphTimer: 0,
        deadTimer: 0,
      });
    });
  }

  private initParticlePool() {
    const geo = new THREE.DodecahedronGeometry(0.06, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

    for (let i = 0; i < 40; i++) {
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.visible = false;
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        active: false,
      });
    }
  }

  public spawnParticles(
    origin: THREE.Vector3,
    count: number,
    colorHex: number = 0xfbbf24,
    speed: number = 6
  ) {
    let spawned = 0;
    for (const p of this.particles) {
      if (!p.active) {
        p.active = true;
        p.mesh.visible = true;
        p.mesh.position.copy(origin);
        (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
        p.velocity.set(
          (Math.random() - 0.5) * speed,
          Math.random() * speed + 1,
          (Math.random() - 0.5) * speed
        );
        p.life = 0;
        p.maxLife = 0.35 + Math.random() * 0.3;
        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  private initInputListeners() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    this.renderer.domElement.addEventListener('click', () => {
      if (this.gameState === 'playing' && !this.isPointerLocked) {
        this.renderer.domElement.requestPointerLock?.();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
    });

    window.addEventListener('blur', () => {
      this.keysHeld.clear();
      this.mouseDownLeft = false;
      this.mouseDownRight = false;
    });
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.gameState === 'title') {
      if (e.code === 'Enter' || e.code === 'Space') {
        this.startGame();
      }
      return;
    }

    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (this.gameState === 'playing') {
        this.pauseGame();
      } else if (this.gameState === 'paused') {
        this.resumeGame();
      }
      return;
    }

    if (this.gameState !== 'playing') return;

    this.keysHeld.add(e.code);

    // Weapon selection keys
    if (e.code === 'Digit1') this.switchWeapon('crowbar');
    if (e.code === 'Digit2') this.switchWeapon('gravity_gun');
    if (e.code === 'Digit3') this.switchWeapon('pulse_rifle');
    if (e.code === 'Digit4') this.switchWeapon('shotgun');

    // Interact (E key)
    if (e.code === 'KeyE') {
      this.handleInteract();
    }

    // Mute toggle (M key)
    if (e.code === 'KeyM') {
      soundSystem.toggleMute();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysHeld.delete(e.code);
  };

  private onMouseMove = (e: MouseEvent) => {
    if (this.gameState !== 'playing') return;

    const sensitivity = 0.0022;
    this.yaw -= e.movementX * sensitivity;
    this.pitch -= e.movementY * sensitivity;

    // Clamp pitch between -85 and +85 degrees
    const maxPitch = (Math.PI / 2) * 0.94;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  };

  private onMouseDown = (e: MouseEvent) => {
    if (this.gameState !== 'playing') return;

    if (e.button === 0) {
      this.mouseDownLeft = true;
      this.handlePrimaryFire();
    } else if (e.button === 2) {
      this.mouseDownRight = true;
      this.handleSecondaryFire();
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) this.mouseDownLeft = false;
    if (e.button === 2) this.mouseDownRight = false;
  };

  public startGame() {
    this.gameState = 'playing';
    document.body.dataset.state = 'playing';
    this.callbacks.onStateChange('playing');
    soundSystem.startAmbient();
    soundSystem.playHEVChime();
    this.callbacks.onMessage('HEV Mark V Suit Powered. Gordon Freeman initialized.');
    this.renderer.domElement.requestPointerLock?.();
  }

  public pauseGame() {
    this.gameState = 'paused';
    document.body.dataset.state = 'paused';
    this.callbacks.onStateChange('paused');
    document.exitPointerLock?.();
  }

  public resumeGame() {
    this.gameState = 'playing';
    document.body.dataset.state = 'playing';
    this.callbacks.onStateChange('playing');
    this.renderer.domElement.requestPointerLock?.();
  }

  public restartGame() {
    // Reset player position and stats
    this.playerPos.set(0, 1.7, 24);
    this.playerVelocity.set(0, 0, 0);
    this.health = 100;
    this.suitPower = 100;
    this.score = 0;
    this.enemiesDefeated = 0;
    this.coresInserted = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.portalReached = false;
    this.heldProp = null;

    // Reset weapons
    this.weapons.pulse_rifle.currentAmmo = 60;
    this.weapons.shotgun.currentAmmo = 16;
    this.activeWeapon = 'crowbar';

    // Clear and respawn props and enemies
    this.props.forEach((p) => this.scene.remove(p.mesh));
    this.props = [];
    this.enemies.forEach((e) => this.scene.remove(e.mesh));
    this.enemies = [];
    this.initPropsAndEnemies();

    // Re-enable forcefield
    if (this.worldData.forcefieldMesh) {
      this.worldData.forcefieldMesh.visible = true;
    }

    this.startGame();
  }

  public switchWeapon(id: WeaponId) {
    if (this.activeWeapon === id) return;
    this.activeWeapon = id;
    Object.entries(this.weaponModels).forEach(([k, model]) => {
      if (model) model.visible = k === id;
    });
    this.callbacks.onMessage(`Equipped: ${this.weapons[id].name}`);
  }

  // Handle E key pickup or generator slotting
  private handleInteract() {
    // If holding a battery core and near an empty generator socket -> slot it!
    if (this.heldProp && this.heldProp.type === 'core') {
      const socket = this.worldData.generatorSockets.find(
        (s) => !s.filled && s.position.distanceTo(this.playerPos) < 5
      );
      if (socket) {
        socket.filled = true;
        this.coresInserted++;
        this.heldProp.isHeld = false;
        this.heldProp.mesh.position.copy(socket.position);
        this.heldProp.mesh.rotation.set(0, 0, Math.PI / 2);
        this.heldProp = null;

        soundSystem.playPowerCharge();
        this.callbacks.onMessage(`Generator Core Inserted (${this.coresInserted}/2)`);
        this.checkGeneratorProgress();
        return;
      }
    }

    // Try picking up a nearby prop or health vial
    const forward = this.getCameraForward();
    const raycaster = new THREE.Raycaster(this.camera.position, forward, 0.1, 4.0);
    const meshes = this.props.map((p) => p.mesh);
    const intersects = raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const prop = this.props.find((p) => p.mesh === hitMesh || p.mesh.getObjectById(hitMesh.id));
      if (prop) {
        if (this.heldProp) {
          this.heldProp.isHeld = false;
        }
        prop.isHeld = true;
        this.heldProp = prop;
        soundSystem.playGravityLatch();
      }
    }
  }

  private handlePrimaryFire() {
    const curTime = this.totalElapsedTime;
    const weapon = this.weapons[this.activeWeapon];

    if (!canFireWeapon(weapon, curTime, this.lastFireTimes[this.activeWeapon])) {
      return;
    }

    this.lastFireTimes[this.activeWeapon] = curTime;
    this.weapons[this.activeWeapon] = consumeWeaponAmmo(weapon);

    const forward = this.getCameraForward();

    if (this.activeWeapon === 'crowbar') {
      soundSystem.playCrowbarSwing();
      this.swingAngle = Math.PI * 0.6; // Swing animation trigger
      this.weaponRecoil = 0.15;

      // Melee raycast hit test
      const ray = new THREE.Raycaster(this.camera.position, forward, 0.1, 2.8);
      this.checkMeleeOrHitscanHit(ray, weapon.damage, false);
    } else if (this.activeWeapon === 'gravity_gun') {
      if (this.heldProp) {
        // PUNT HELD PROP WITH MASSIVE VELOCITY!
        const puntImpulse = 42;
        this.heldProp.velocity.copy(forward).multiplyScalar(puntImpulse);
        this.heldProp.angularVelocity.set(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8
        );
        this.heldProp.isHeld = false;
        this.heldProp.isPunted = true;
        this.heldProp = null;

        soundSystem.playGravityPunt();
        this.cameraShake = 0.25;
        this.weaponRecoil = 0.25;
      } else {
        // Shockwave punt at nearby prop or enemy
        soundSystem.playGravityPunt();
        this.weaponRecoil = 0.18;

        const ray = new THREE.Raycaster(this.camera.position, forward, 0.1, 10);
        const meshes = this.props.map((p) => p.mesh);
        const hits = ray.intersectObjects(meshes, true);
        if (hits.length > 0) {
          const hitObj = hits[0].object;
          const prop = this.props.find((p) => p.mesh === hitObj || p.mesh.getObjectById(hitObj.id));
          if (prop) {
            const impulse = calculateGravityPuntImpulse(hits[0].distance, 38);
            prop.velocity.copy(forward).multiplyScalar(impulse);
            prop.isPunted = true;
          }
        }
      }
    } else if (this.activeWeapon === 'pulse_rifle') {
      soundSystem.playPulseRifle();
      this.weaponRecoil = 0.12;
      this.flashMuzzle(0x38bdf8);

      const ray = new THREE.Raycaster(this.camera.position, forward, 0.1, 80);
      this.checkMeleeOrHitscanHit(ray, weapon.damage, true);
    } else if (this.activeWeapon === 'shotgun') {
      soundSystem.playShotgun();
      this.weaponRecoil = 0.35;
      this.cameraShake = 0.35;
      this.flashMuzzle(0xfef08a);

      // Shotgun pellet spread (5 pellets)
      for (let i = 0; i < 5; i++) {
        const spread = new THREE.Vector3(
          forward.x + (Math.random() - 0.5) * 0.08,
          forward.y + (Math.random() - 0.5) * 0.08,
          forward.z + (Math.random() - 0.5) * 0.08
        ).normalize();
        const ray = new THREE.Raycaster(this.camera.position, spread, 0.1, 45);
        this.checkMeleeOrHitscanHit(ray, weapon.damage / 5, true);
      }
    }
  }

  private handleSecondaryFire() {
    if (this.activeWeapon === 'gravity_gun') {
      if (this.heldProp) {
        // Gently drop held prop
        this.heldProp.isHeld = false;
        this.heldProp = null;
        soundSystem.playGravityLatch();
      } else {
        // Latch onto targeted prop
        const forward = this.getCameraForward();
        const ray = new THREE.Raycaster(this.camera.position, forward, 0.1, 12);
        const meshes = this.props.map((p) => p.mesh);
        const hits = ray.intersectObjects(meshes, true);

        if (hits.length > 0) {
          const hitObj = hits[0].object;
          const prop = this.props.find((p) => p.mesh === hitObj || p.mesh.getObjectById(hitObj.id));
          if (prop) {
            prop.isHeld = true;
            this.heldProp = prop;
            soundSystem.playGravityLatch();
          }
        }
      }
    }
  }

  private checkMeleeOrHitscanHit(
    ray: THREE.Raycaster,
    damage: number,
    isProjectile: boolean
  ) {
    // 1. Check enemies
    const enemyMeshes = this.enemies.filter((e) => e.state !== 'dead').map((e) => e.mesh);
    const enemyHits = ray.intersectObjects(enemyMeshes, true);

    if (enemyHits.length > 0) {
      const hitObj = enemyHits[0].object;
      const enemy = this.enemies.find(
        (e) => e.mesh === hitObj || e.mesh.getObjectById(hitObj.id)
      );
      if (enemy) {
        this.damageEnemy(enemy, damage, enemyHits[0].point);
        return;
      }
    }

    // 2. Check props (crates / barrels)
    const propMeshes = this.props.map((p) => p.mesh);
    const propHits = ray.intersectObjects(propMeshes, true);

    if (propHits.length > 0) {
      const hitObj = propHits[0].object;
      const prop = this.props.find((p) => p.mesh === hitObj || p.mesh.getObjectById(hitObj.id));
      if (prop) {
        this.damageProp(prop, damage, propHits[0].point);
        return;
      }
    }

    // Wall hit sparks
    soundSystem.playCrowbarImpact(false);
  }

  private damageEnemy(enemy: Enemy, amount: number, hitPoint: THREE.Vector3) {
    enemy.health -= amount;
    this.spawnParticles(hitPoint, 6, 0xef4444, 4); // Red hit blood/sparks
    soundSystem.playCrowbarImpact(true);

    if (enemy.health <= 0 && enemy.state !== 'dead') {
      enemy.state = 'dead';
      enemy.deadTimer = 0.5;
      this.enemiesDefeated++;
      this.score += enemy.type === 'combine_hunter' ? 500 : 100;

      if (enemy.type === 'combine_hunter') {
        this.bossDefeated = true;
        this.callbacks.onMessage('COMBINE HUNTER DESTROYED! Forcefield Deactivated.');
        soundSystem.playExplosion();
        this.cameraShake = 0.6;
        this.hitstopTimer = 0.08;

        // Drop forcefield
        if (this.worldData.forcefieldMesh) {
          this.worldData.forcefieldMesh.visible = false;
        }
      } else {
        soundSystem.playCombineRadio();
      }
    }
  }

  private damageProp(prop: PhysicsProp, amount: number, hitPoint: THREE.Vector3) {
    prop.health -= amount;
    this.spawnParticles(hitPoint, 4, 0xf59e0b, 3);
    soundSystem.playCrowbarImpact(false);

    if (prop.health <= 0) {
      if (prop.type === 'barrel') {
        this.detonateBarrel(prop);
      } else if (prop.type === 'crate') {
        this.breakCrate(prop);
      }
    }
  }

  private detonateBarrel(barrel: PhysicsProp) {
    soundSystem.playExplosion();
    this.spawnParticles(barrel.mesh.position, 28, 0xf97316, 12); // Fiery blast
    this.cameraShake = 0.5;
    this.hitstopTimer = 0.06;

    // Area explosion damage to enemies and player
    const barrelPos = barrel.mesh.position;

    // Damage enemies
    this.enemies.forEach((enemy) => {
      if (enemy.state !== 'dead') {
        const dist = enemy.mesh.position.distanceTo(barrelPos);
        const dmg = calculateExplosionDamage(dist, 10, 180);
        if (dmg > 0) {
          this.damageEnemy(enemy, dmg, enemy.mesh.position);
        }
      }
    });

    // Damage other barrels in chain reaction
    this.props.forEach((other) => {
      if (other !== barrel && other.type === 'barrel') {
        const dist = other.mesh.position.distanceTo(barrelPos);
        if (dist < 8) {
          other.health -= 100;
          this.detonateBarrel(other);
        }
      }
    });

    // Damage player if caught in blast
    const playerDist = this.playerPos.distanceTo(barrelPos);
    const playerDmg = calculateExplosionDamage(playerDist, 9, 120);
    if (playerDmg > 0) {
      this.takePlayerDamage(playerDmg);
    }

    // Remove barrel
    this.scene.remove(barrel.mesh);
    this.props = this.props.filter((p) => p !== barrel);
    if (this.heldProp === barrel) this.heldProp = null;
  }

  private breakCrate(crate: PhysicsProp) {
    soundSystem.playCrowbarImpact(false);
    this.spawnParticles(crate.mesh.position, 16, 0x78350f, 6); // Wood shards

    // Spawn pickup item (health vial or ammo)
    const vialMesh = createHealthVialMesh();
    vialMesh.position.copy(crate.mesh.position);
    this.scene.add(vialMesh);

    // Give health or suit power
    const heal = applyHeal(this.health, this.maxHealth, 30);
    this.health = heal.newVal;
    const suit = applyHeal(this.suitPower, this.maxSuitPower, 25);
    this.suitPower = suit.newVal;
    soundSystem.playPowerCharge();
    this.callbacks.onMessage('Supply Crate opened: Health & Power Restored.');

    this.scene.remove(crate.mesh);
    this.props = this.props.filter((p) => p !== crate);
    if (this.heldProp === crate) this.heldProp = null;
  }

  private checkGeneratorProgress() {
    if (this.coresInserted >= 2 && !this.bossSpawned) {
      this.bossSpawned = true;
      this.callbacks.onMessage('WARNING: Primary Power Online. Combine Hunter Detected!');
      soundSystem.playHEVChime();

      // Spawn Combine Hunter Boss in front of the hangar
      const bossMesh = createCombineHunterBossMesh();
      bossMesh.position.set(0, 0, -26);
      this.scene.add(bossMesh);

      this.enemies.push({
        id: 'combine_hunter_boss',
        type: 'combine_hunter',
        mesh: bossMesh,
        health: 500,
        maxHealth: 500,
        speed: 3.8,
        state: 'chase',
        timer: 0,
        attackCooldown: 2.0,
        isTelegraphing: false,
        telegraphTimer: 0,
        deadTimer: 0,
      });
    }
  }

  public takePlayerDamage(amount: number) {
    if (this.gameState !== 'playing') return;

    const res = applyDamage(this.health, this.suitPower, amount);
    this.health = res.newHealth;
    this.suitPower = res.newSuitPower;
    this.cameraShake = Math.min(0.8, this.cameraShake + 0.35);

    if (res.isDead) {
      this.gameState = 'gameover';
      document.body.dataset.state = 'gameover';
      this.callbacks.onStateChange('gameover');
      soundSystem.playFlatline();
      document.exitPointerLock?.();
    } else {
      soundSystem.playCrowbarImpact(true);
    }
  }

  private flashMuzzle(colorHex: number) {
    this.muzzleFlashLight.color.setHex(colorHex);
    this.muzzleFlashLight.intensity = 2.5;
  }

  private getCameraForward(): THREE.Vector3 {
    const forward = new THREE.Vector3(0, 0, -1);
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    forward.applyEuler(euler);
    return forward;
  }

  // -------------------------------------------------------------
  // SIMULATION TICK LOOP
  // -------------------------------------------------------------
  private tick() {
    if (this.isDestroyed) return;

    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
    this.totalElapsedTime += dt;

    // Update snow flurry drift
    if (this.snowSystem && this.snowPositions) {
      const posAttr = this.snowSystem.geometry.attributes.position;
      for (let i = 0; i < this.snowCount; i++) {
        let y = this.snowPositions[i * 3 + 1] - dt * 2.5;
        let x = this.snowPositions[i * 3] + Math.sin(this.totalElapsedTime + i) * dt * 0.8;
        if (y < 0) {
          y = 25;
        }
        this.snowPositions[i * 3 + 1] = y;
        this.snowPositions[i * 3] = x;
      }
      posAttr.needsUpdate = true;
    }

    // Hitstop freeze handling
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      // Real-time camera shake and rendering continue
    } else if (this.gameState === 'playing') {
      this.updateSimulation(dt);
    } else if (this.gameState === 'title') {
      this.updateTitleCamera(dt);
    }

    // Camera shake decay
    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - dt * 2.5);
      const shakeMag = this.cameraShake * this.cameraShake * 0.15;
      this.camera.rotation.z = (Math.random() - 0.5) * shakeMag;
    } else {
      this.camera.rotation.z = 0;
    }

    // Muzzle flash decay
    if (this.muzzleFlashLight.intensity > 0) {
      this.muzzleFlashLight.intensity = Math.max(0, this.muzzleFlashLight.intensity - dt * 20);
    }

    // Render frame
    this.renderer.render(this.scene, this.camera);

    // Schedule next frame according to Software-WebGL guard
    if (this.isSoftwareGl) {
      this.afterDraw(() => {
        if (!this.isDestroyed) this.animationFrameId = requestAnimationFrame(this.tick);
      });
    } else {
      this.animationFrameId = requestAnimationFrame(this.tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDestroyed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        window.setTimeout(cb, 16);
      }
    };
    window.setTimeout(poll, 5);
  }

  private updateTitleCamera(dt: number) {
    // Cinematic slow camera pan showing the Borealis research outpost and glowing Citadel spire
    const angle = this.totalElapsedTime * 0.08;
    this.camera.position.x = Math.sin(angle) * 32;
    this.camera.position.z = Math.cos(angle) * 32 + 10;
    this.camera.position.y = 7 + Math.sin(this.totalElapsedTime * 0.4) * 1.5;
    this.camera.lookAt(0, 3, -25);
  }

  private updateSimulation(dt: number) {
    this.updatePlayerMovement(dt);
    this.updateHeldProp(dt);
    this.updatePhysicsProps(dt);
    this.updateEnemies(dt);
    this.updateParticles(dt);
    this.updateViewmodelAnimation(dt);
    this.checkGeigerZones(dt);
    this.checkVictoryCondition();

    // Broadcast updated stats to React HUD
    this.callbacks.onStatsUpdate({
      health: this.health,
      maxHealth: this.maxHealth,
      suitPower: this.suitPower,
      maxSuitPower: this.maxSuitPower,
      stamina: 100,
      score: this.score,
      enemiesDefeated: this.enemiesDefeated,
      powerCoresInserted: this.coresInserted,
      totalPowerCoresRequired: 2,
      bossDefeated: this.bossDefeated,
      activeWeapon: this.activeWeapon,
      isAimingAtProp: this.crosshairHoveringProp,
      isHoldingProp: this.heldProp !== null,
      geigerLevel: this.geigerLevel,
      hazardDamageTimer: 0,
    });
  }

  private updatePlayerMovement(dt: number) {
    const speed = this.keysHeld.has('ShiftLeft') ? 8.5 : 5.2;
    const moveVector = new THREE.Vector3();

    if (this.keysHeld.has('KeyW')) moveVector.z -= 1;
    if (this.keysHeld.has('KeyS')) moveVector.z += 1;
    if (this.keysHeld.has('KeyA')) moveVector.x -= 1;
    if (this.keysHeld.has('KeyD')) moveVector.x += 1;

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize();
      moveVector.applyEuler(new THREE.Euler(0, this.yaw, 0, 'YXZ'));
      moveVector.multiplyScalar(speed);
      this.playerVelocity.x = moveVector.x;
      this.playerVelocity.z = moveVector.z;
    } else {
      this.playerVelocity.x *= 0.75;
      this.playerVelocity.z *= 0.75;
    }

    // Jump
    if (this.keysHeld.has('Space') && this.isGrounded) {
      this.playerVelocity.y = 6.8;
      this.isGrounded = false;
    }

    // Gravity
    this.playerVelocity.y -= 18.0 * dt;

    // Apply movement
    this.playerPos.x += this.playerVelocity.x * dt;
    this.playerPos.z += this.playerVelocity.z * dt;
    this.playerPos.y += this.playerVelocity.y * dt;

    // Ground floor collision
    if (this.playerPos.y <= 1.7) {
      this.playerPos.y = 1.7;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    }

    // World bounds collision
    this.worldData.collisionBoxes.forEach((box) => {
      const playerBox = new THREE.Box3(
        new THREE.Vector3(this.playerPos.x - 0.45, this.playerPos.y - 1.7, this.playerPos.z - 0.45),
        new THREE.Vector3(this.playerPos.x + 0.45, this.playerPos.y + 0.2, this.playerPos.z + 0.45)
      );

      // Skip forcefield collision if boss is defeated (forcefield dropped)
      if (this.bossDefeated && box.min.z === -43) return;

      if (box.intersectsBox(playerBox)) {
        // Push back
        const center = box.getCenter(new THREE.Vector3());
        const diff = this.playerPos.clone().sub(center);
        diff.y = 0;
        diff.normalize().multiplyScalar(0.1);
        this.playerPos.add(diff);
      }
    });

    // Update Camera Transform
    this.camera.position.copy(this.playerPos);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  private updateHeldProp(dt: number) {
    if (!this.heldProp) return;

    // Smoothly pull held prop to float 2.2 meters in front of player's gaze
    const forward = this.getCameraForward();
    const targetPos = this.camera.position.clone().add(forward.clone().multiplyScalar(2.2));

    this.heldProp.mesh.position.lerp(targetPos, 14 * dt);
    this.heldProp.velocity.set(0, 0, 0);

    // Subtle magnetic levitation hover & slow spin
    this.heldProp.mesh.rotation.y += dt * 1.5;

    // Emit blue energy sparks between gravity gun and held prop
    if (Math.random() < 0.25) {
      const sparkPos = this.heldProp.mesh.position.clone().add(
        new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4)
      );
      this.spawnParticles(sparkPos, 1, 0x38bdf8, 2);
    }
  }

  private updatePhysicsProps(dt: number) {
    this.props.forEach((prop) => {
      if (prop.isHeld) return;

      // Gravity
      prop.velocity.y -= 18.0 * dt;

      // Position update
      prop.mesh.position.addScaledVector(prop.velocity, dt);

      // Ground plane collision
      if (prop.mesh.position.y <= prop.radius) {
        prop.mesh.position.y = prop.radius;
        prop.velocity.y = -prop.velocity.y * 0.3; // bounce damping
        prop.velocity.x *= 0.88; // friction
        prop.velocity.z *= 0.88;

        if (Math.abs(prop.velocity.y) < 0.2) {
          prop.velocity.y = 0;
        }
      }

      // Rotation from angular velocity
      prop.mesh.rotation.x += prop.angularVelocity.x * dt;
      prop.mesh.rotation.y += prop.angularVelocity.y * dt;
      prop.mesh.rotation.z += prop.angularVelocity.z * dt;

      // If punted, test collision with enemies
      if (prop.isPunted && prop.velocity.lengthSq() > 16) {
        this.enemies.forEach((enemy) => {
          if (enemy.state !== 'dead') {
            const dist = enemy.mesh.position.distanceTo(prop.mesh.position);
            if (dist < 1.6) {
              const impactDmg = prop.type === 'barrel' ? 180 : 90;
              this.damageEnemy(enemy, impactDmg, enemy.mesh.position);
              prop.isPunted = false;

              if (prop.type === 'barrel') {
                this.detonateBarrel(prop);
              }
            }
          }
        });
      }
    });

    // Check if crosshair is hovering over a grabable prop
    const forward = this.getCameraForward();
    const ray = new THREE.Raycaster(this.camera.position, forward, 0.1, 10);
    const meshes = this.props.map((p) => p.mesh);
    const hits = ray.intersectObjects(meshes, true);
    this.crosshairHoveringProp = hits.length > 0;
  }

  private updateEnemies(dt: number) {
    this.enemies.forEach((enemy) => {
      if (enemy.state === 'dead') {
        enemy.deadTimer -= dt;
        if (enemy.deadTimer > 0) {
          enemy.mesh.position.y -= dt * 1.5; // sink into ground
          enemy.mesh.rotation.x += dt * 2.0; // topple
        }
        return;
      }

      const distToPlayer = enemy.mesh.position.distanceTo(this.playerPos);

      // Behavior state machine
      if (distToPlayer < 28) {
        // Face player
        enemy.mesh.lookAt(this.playerPos.x, enemy.mesh.position.y, this.playerPos.z);

        if (enemy.type === 'headcrab') {
          // Headcrab leaps at player when close
          if (distToPlayer > 2.5) {
            const dir = this.playerPos.clone().sub(enemy.mesh.position).normalize();
            enemy.mesh.position.addScaledVector(dir, enemy.speed * dt);
          } else {
            // Leap attack
            enemy.timer += dt;
            if (enemy.timer > enemy.attackCooldown) {
              enemy.timer = 0;
              soundSystem.playHeadcrabScreech();
              this.takePlayerDamage(18);
              this.spawnParticles(this.playerPos, 5, 0xef4444, 3);
            }
          }
        } else if (enemy.type === 'combine_soldier') {
          // Patrol / shooting burst
          if (distToPlayer > 8) {
            const dir = this.playerPos.clone().sub(enemy.mesh.position).normalize();
            enemy.mesh.position.addScaledVector(dir, enemy.speed * dt);
          }

          enemy.timer += dt;
          if (enemy.timer > enemy.attackCooldown) {
            enemy.timer = 0;
            soundSystem.playCombineRadio();
            this.takePlayerDamage(14);
            this.flashMuzzle(0x38bdf8);
          }
        } else if (enemy.type === 'combine_hunter') {
          // Heavy boss unit
          if (distToPlayer > 6) {
            const dir = this.playerPos.clone().sub(enemy.mesh.position).normalize();
            enemy.mesh.position.addScaledVector(dir, enemy.speed * dt);
          }

          enemy.timer += dt;
          if (enemy.timer > enemy.attackCooldown) {
            enemy.timer = 0;
            // Flechette barrage
            soundSystem.playPulseRifle();
            this.takePlayerDamage(28);
            this.cameraShake = 0.4;
          }
        }
      }
    });
  }

  private updateParticles(dt: number) {
    this.particles.forEach((p) => {
      if (!p.active) return;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
      } else {
        p.velocity.y -= 12 * dt; // gravity
        p.mesh.position.addScaledVector(p.velocity, dt);
        const scale = 1 - p.life / p.maxLife;
        p.mesh.scale.setScalar(scale);
      }
    });
  }

  private updateViewmodelAnimation(dt: number) {
    // Walking weapon bob
    const isMoving = this.playerVelocity.lengthSq() > 0.5;
    if (isMoving && this.isGrounded) {
      this.weaponBobTime += dt * 9;
    } else {
      this.weaponBobTime += dt * 1.5; // gentle breathing bob
    }

    const bobX = Math.cos(this.weaponBobTime) * 0.008;
    const bobY = Math.sin(this.weaponBobTime * 2) * 0.008;

    // Recoil damping
    this.weaponRecoil = Math.max(0, this.weaponRecoil - dt * 2.5);

    // Crowbar swing
    if (this.swingAngle > 0) {
      this.swingAngle = Math.max(0, this.swingAngle - dt * 10);
    }

    const currentModel = this.weaponModels[this.activeWeapon];
    if (currentModel) {
      currentModel.position.x = 0.25 + bobX;
      currentModel.position.y = -0.24 + bobY;
      currentModel.position.z = -0.45 + this.weaponRecoil;

      if (this.activeWeapon === 'crowbar') {
        currentModel.rotation.z = -0.2 - this.swingAngle;
        currentModel.rotation.x = -0.35 + this.swingAngle * 0.6;
      } else if (this.activeWeapon === 'gravity_gun') {
        const crystal = currentModel.getObjectByName('gravity_core');
        if (crystal) {
          crystal.rotation.y += dt * 4.5;
          crystal.rotation.x += dt * 2.5;
          const scale = 1.0 + Math.sin(this.totalElapsedTime * 12) * 0.12;
          crystal.scale.setScalar(scale);
        }
      }
    }
  }

  private checkGeigerZones(dt: number) {
    let maxIntensity = 0;
    this.worldData.geigerZones.forEach((zone) => {
      const dist = this.playerPos.distanceTo(zone.center);
      if (dist < zone.radius) {
        const factor = 1 - dist / zone.radius;
        if (factor > maxIntensity) maxIntensity = factor;
      }
    });

    this.geigerLevel = maxIntensity;

    if (maxIntensity > 0) {
      soundSystem.playGeigerTick(maxIntensity);
      // Radiation damage if in toxic canal
      if (maxIntensity > 0.65) {
        this.takePlayerDamage(dt * 12);
      }
    }
  }

  private checkVictoryCondition() {
    if (this.bossDefeated && !this.portalReached) {
      if (this.worldData.portalTriggerBox.containsPoint(this.playerPos)) {
        this.portalReached = true;
        this.gameState = 'victory';
        document.body.dataset.state = 'gameover';
        this.callbacks.onStateChange('victory');
        soundSystem.playHEVChime();
        this.callbacks.onMessage('Borealis Dimensional Gateway Activated. Mission Accomplished.');
        document.exitPointerLock?.();
      }
    }
  }

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);

    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
