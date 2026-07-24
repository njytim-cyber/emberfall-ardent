/* ============================================================
   Enemy — a hostile creature with a small state machine:
     idle → chase → attack → (dead → respawn)
   Built from primitives (a goblin-ish brute). Reads the player
   position for AI; the Combat system resolves its hits.
   ============================================================ */

import * as THREE from 'three';
import { CONFIG } from '../data/config.js';

const TYPES = {
  // --- The Emberwood: corrupted forest guardians ---
  ent:   { name: 'Corrupted Ent', body: 'ent',  color: 0x5a4a30, health: 130, damage: 18, speed: 2.6, scale: 1.5, xp: 60, gold: 25, attackRange: 3.0, attackCd: 1.9, eye: 0x9bff6b },
  thorn: { name: 'Thornling',     body: 'ent',  color: 0x4a5a2c, health: 60, damage: 12, speed: 4.4, scale: 0.85, xp: 40, gold: 15, attackRange: 2.4, attackCd: 1.3, eye: 0xc8ff8b },
  wisp:  { name: 'Blight Wisp',   body: 'wisp', color: 0xbfa0ff, health: 45, damage: 11, speed: 5.6, scale: 0.8, xp: 45, gold: 18, attackRange: 8.0, attackCd: 1.6, eye: 0xd6b8ff },

  // --- Chapter 1: Helix Security (the Undercity checkpoint) ---
  goblin: { name: 'Helix Grunt',   body: 'humanoid', color: 0x37414d, health: 45, damage: 8, speed: 4.5, scale: 0.9, xp: 30, gold: 12, attackRange: 2.2, attackCd: 1.4, eye: 0xff5533 },
  wolf:   { name: 'Recon Drone',   body: 'drone',    color: 0x51708a, health: 35, damage: 10, speed: 7.0, scale: 0.9, xp: 35, gold: 10, attackRange: 2.0, attackCd: 1.1, eye: 0x66ccff },
  ogre:   { name: 'Riot Trooper',  body: 'humanoid', color: 0x2a3038, health: 95, damage: 18, speed: 3.2, scale: 1.3, xp: 70, gold: 30, attackRange: 2.8, attackCd: 1.8, eye: 0xffaa33 },

  // --- Chapter 2: Helix Androids (Vance Spire lobby) ---
  skeleton: { name: 'Combat Android',  body: 'humanoid', color: 0x9aa4b0, health: 55, damage: 12, speed: 5.0, scale: 0.95, xp: 50, gold: 22, attackRange: 2.2, attackCd: 1.2, eye: 0x66ffcc },
  wraith:   { name: 'Stealth Unit',    body: 'humanoid', color: 0x2c3242, health: 45, damage: 15, speed: 7.4, scale: 1.0,  xp: 60, gold: 26, attackRange: 2.2, attackCd: 1.0, eye: 0xb06bff },
  revenant: { name: 'Heavy Enforcer',  body: 'humanoid', color: 0x323c48, health: 150, damage: 21, speed: 3.3, scale: 1.35, xp: 100, gold: 55, attackRange: 2.8, attackCd: 1.7, eye: 0xff4444 },

  // --- Chapter 3: Vance's Elite Guard (cryo-cores absorb Cryo tech — it repairs them!) ---
  frostward: { name: 'Cryo Trooper', body: 'humanoid', color: 0x8fd6ff, health: 85, damage: 14, speed: 4.6, scale: 1.0, xp: 70, gold: 40, attackRange: 2.4, attackCd: 1.8, eye: 0xd6f4ff, freezeDur: 1.6, absorb: 'ice' },
  iceshaman: { name: 'Repair Drone',  body: 'drone',    color: 0x4aa0c8, health: 70, damage: 8, speed: 4.4, scale: 1.0, xp: 80, gold: 45, attackRange: 9.0, attackCd: 2.6, eye: 0x9becff, healAlly: 28, healRange: 12, absorb: 'ice' },
  icegolem:  { name: 'Siege Mech',    body: 'mech',     color: 0x6b7684, health: 230, damage: 24, speed: 2.8, scale: 1.55, xp: 130, gold: 70, attackRange: 3.0, attackCd: 2.0, eye: 0xff3355 },
};

export class Enemy {
  constructor(scene, home, typeKey = 'goblin', override = null) {
    this.scene = scene;
    this.home = home.clone();
    // `override` lets special foes (the boss) tweak the base stat block
    this.type = { ...TYPES[typeKey], ...(override || {}) };
    this.typeKey = typeKey;
    this.isBoss = !!(override && override.isBoss);
    this.onPhase = null;         // Combat sets this for the boss
    this._phased = false;

    this.maxHealth = this.type.health;
    this.health = this.maxHealth;
    this.position = home.clone();
    this.facing = Math.random() * Math.PI * 2;
    this.state = 'idle';
    this.alive = true;
    this.attackTimer = 0;
    this.respawnTimer = 0;
    this.hitFlash = 0;
    this.slow = 1;
    this.slowTimer = 0;
    this.cooldown = 0;
    this._wanderTarget = null;
    this._wanderTimer = 0;

    this._buildMesh();
  }

  _buildMesh() {
    const g = new THREE.Group();
    const t = this.type;
    this.body = t.body || 'humanoid';
    this.hoverHeight = 0;
    this._rotors = [];
    this.baseMat = new THREE.MeshStandardMaterial({ color: t.color, roughness: 0.55, metalness: 0.6 });
    this._eyeColor = t.eye || 0xff8800;
    this._eyeMat = new THREE.MeshStandardMaterial({ color: this._eyeColor, emissive: this._eyeColor, emissiveIntensity: 1.8 });

    if (this.body === 'drone') this._buildDrone(g);
    else if (this.body === 'mech') this._buildMech(g);
    else if (this.body === 'ent') this._buildEnt(g);
    else if (this.body === 'wisp') this._buildWisp(g);
    else this._buildHumanoid(g);

    g.scale.setScalar(t.scale);
    g.position.copy(this.position);
    this.mesh = g;
    this.scene.add(g);
  }

  /** Robotic soldier: armored torso, visor head, arms, legs. */
  _buildHumanoid(g) {
    const dark = new THREE.MeshStandardMaterial({ color: 0x1c1e24, roughness: 0.6, metalness: 0.5 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.6, 6, 10), this.baseMat);
    body.position.y = 1.0; body.castShadow = true; g.add(body);
    // chest plate
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.35), dark);
    chest.position.set(0, 1.15, 0.18); g.add(chest);

    // Helmet + glowing visor bar
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.4), dark);
    head.position.y = 1.72; head.castShadow = true; g.add(head);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.1, 0.05), this._eyeMat);
    visor.position.set(0, 1.74, 0.2); g.add(visor);

    // Shoulders + arms
    for (const sx of [-0.52, 0.52]) {
      const sh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), dark);
      sh.position.set(sx, 1.32, 0); g.add(sh);
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.55, 4, 8), this.baseMat);
      arm.position.set(sx, 0.95, 0); arm.castShadow = true; g.add(arm);
    }
    // Legs
    for (const sx of [-0.2, 0.2]) {
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.5, 4, 8), dark);
      leg.position.set(sx, 0.35, 0); leg.castShadow = true; g.add(leg);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.34), dark);
      boot.position.set(sx, 0.07, 0.05); g.add(boot);
    }
  }

  /** Hovering quadrotor drone: chassis, sensor eye, 4 spinning rotors. */
  _buildDrone(g) {
    const dark = new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.5, metalness: 0.7 });
    this.hoverHeight = 1.3;

    // Chassis (flattened rounded body)
    const chassis = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), this.baseMat);
    chassis.scale.set(1, 0.55, 1); chassis.position.y = 1.3; chassis.castShadow = true; g.add(chassis);
    // Under-slung sensor eye (single glowing lens)
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), this._eyeMat);
    lens.position.set(0, 1.12, 0.18); g.add(lens);
    const eyeLight = new THREE.PointLight(this._eyeColor, 2.5, 5, 2);
    eyeLight.position.set(0, 1.1, 0.3); g.add(eyeLight);

    // Four rotor booms + spinning props
    for (const [dx, dz] of [[0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]]) {
      const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6), dark);
      boom.rotation.z = Math.PI / 2;
      boom.rotation.y = Math.atan2(dz, dx);
      boom.position.set(dx * 0.5, 1.3, dz * 0.5); g.add(boom);
      const rotor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.06), dark);
      rotor.position.set(dx, 1.42, dz);
      g.add(rotor);
      this._rotors.push(rotor);
    }
  }

  /** Corrupted Ent: a walking tree — bark trunk, glowing eyes, branch arms, leafy crown. */
  _buildEnt(g) {
    const bark = this.baseMat;
    const leaf = new THREE.MeshStandardMaterial({ color: 0x2f5a2c, roughness: 0.9 });
    const moss = new THREE.MeshStandardMaterial({ color: 0x3a5a2e, roughness: 1 });

    // Trunk body
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.62, 2.2, 8), bark);
    trunk.position.y = 1.2; trunk.castShadow = true; g.add(trunk);
    // gnarled face area + glowing eyes
    for (const sx of [-0.16, 0.16]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), this._eyeMat);
      eye.position.set(sx, 1.7, 0.42); g.add(eye);
    }
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.2), bark);
    brow.position.set(0, 1.9, 0.4); g.add(brow);
    // leafy crown
    for (let i = 0; i < 3; i++) {
      const cl = new THREE.Mesh(new THREE.SphereGeometry(0.7 - i * 0.12, 8, 7), leaf);
      cl.position.set((Math.random() - 0.5) * 0.4, 2.4 + i * 0.35, (Math.random() - 0.5) * 0.4);
      cl.castShadow = true; g.add(cl);
    }
    // branch arms
    for (const sx of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.3, 6), bark);
      arm.position.set(sx * 0.6, 1.4, 0);
      arm.rotation.z = sx * 0.9; arm.castShadow = true; g.add(arm);
      const twig = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), moss);
      twig.position.set(sx * 1.15, 1.85, 0); g.add(twig);
    }
    // root legs
    for (const sx of [-0.25, 0.25]) {
      const root = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.6, 6), bark);
      root.position.set(sx, 0.3, 0); root.castShadow = true; g.add(root);
    }
  }

  /** Blight Wisp: a floating spirit orb with a glowing core and motes. */
  _buildWisp(g) {
    this.hoverHeight = 1.5;
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16),
      new THREE.MeshStandardMaterial({ color: this.baseMat.color, emissive: this._eyeColor, emissiveIntensity: 1.6, roughness: 0.3 }));
    core.position.y = 1.5; g.add(core);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: this._eyeColor, transparent: true, opacity: 0.22 }));
    halo.position.y = 1.5; g.add(halo);
    const light = new THREE.PointLight(this._eyeColor, 3, 7, 2);
    light.position.y = 1.5; g.add(light);
    // orbiting motes (spun in update via _rotors reuse)
    this._motes = new THREE.Group(); this._motes.position.y = 1.5; g.add(this._motes);
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6),
        new THREE.MeshBasicMaterial({ color: this._eyeColor }));
      const a = (i / 3) * Math.PI * 2;
      m.position.set(Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6);
      this._motes.add(m);
    }
  }

  /** Bipedal war-machine: heavy torso, cannon arms, hydraulic legs. */
  _buildMech(g) {
    const dark = new THREE.MeshStandardMaterial({ color: 0x16181e, roughness: 0.5, metalness: 0.7 });

    // Torso block + cockpit
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 0.8), this.baseMat);
    torso.position.y = 1.5; torso.castShadow = true; g.add(torso);
    const hip = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.6), dark);
    hip.position.y = 0.9; g.add(hip);
    // Sensor head with a wide glowing eye band
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.5), dark);
    head.position.y = 2.15; head.castShadow = true; g.add(head);
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.12, 0.04), this._eyeMat);
    eye.position.set(0, 2.17, 0.25); g.add(eye);
    const headLight = new THREE.PointLight(this._eyeColor, 2.5, 7, 2);
    headLight.position.set(0, 2.17, 0.4); g.add(headLight);

    // Shoulder pods + cannon arms
    for (const sx of [-0.85, 0.85]) {
      const pod = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.6), this.baseMat);
      pod.position.set(sx, 1.7, 0); pod.castShadow = true; g.add(pod);
      const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.9, 10), dark);
      cannon.rotation.x = Math.PI / 2;
      cannon.position.set(sx, 1.55, 0.4); cannon.castShadow = true; g.add(cannon);
    }
    // Heavy hydraulic legs + feet
    for (const sx of [-0.35, 0.35]) {
      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.6, 0.4), dark);
      thigh.position.set(sx, 0.6, 0); thigh.castShadow = true; g.add(thigh);
      const shin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.36), this.baseMat);
      shin.position.set(sx, 0.15, 0.02); shin.castShadow = true; g.add(shin);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.6), dark);
      foot.position.set(sx, -0.05, 0.1); g.add(foot);
    }
  }

  update(dt, player) {
    // Respawn handling
    if (!this.alive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this._respawn();
      return;
    }

    if (this.hitFlash > 0) {
      this.hitFlash -= dt;
      const f = Math.max(0, this.hitFlash / 0.15);
      this.baseMat.emissive.setRGB(f, f * 0.2, 0);
    }
    if (this.slowTimer > 0) { this.slowTimer -= dt; if (this.slowTimer <= 0) this.slow = 1; }
    if (this.attackTimer > 0) this.attackTimer -= dt;

    const toPlayer = player.position.clone().sub(this.position);
    const distPlayer = toPlayer.length();
    const distHome = this.position.distanceTo(this.home);

    // --- State transitions ---
    if (player.alive && distPlayer < CONFIG.enemies.aggroRange && distHome < CONFIG.enemies.leashRange) {
      this.state = distPlayer <= this.type.attackRange ? 'attack' : 'chase';
    } else if (distHome > 1.5) {
      this.state = 'return';
    } else {
      this.state = 'idle';
    }

    let moveDir = null;
    let speed = this.type.speed * this.slow;

    if (this.state === 'chase') {
      moveDir = toPlayer.normalize();
    } else if (this.state === 'attack') {
      this.facing = Math.atan2(toPlayer.x, toPlayer.z);
      if (this.attackTimer <= 0) {
        this.attackTimer = this.type.attackCd;
        this.pendingAttack = true;   // Combat system reads & clears this
        this._lunge = 0.2;
      }
    } else if (this.state === 'return') {
      moveDir = this.home.clone().sub(this.position).normalize();
      speed = this.type.speed * 0.8;
    } else {
      // idle wander
      this._wanderTimer -= dt;
      if (this._wanderTimer <= 0) {
        this._wanderTimer = 2 + Math.random() * 3;
        const a = Math.random() * Math.PI * 2;
        this._wanderTarget = this.home.clone().add(new THREE.Vector3(Math.cos(a) * 3, 0, Math.sin(a) * 3));
      }
      if (this._wanderTarget) {
        const d = this._wanderTarget.clone().sub(this.position);
        if (d.length() > 0.5) { moveDir = d.normalize(); speed = this.type.speed * 0.4; }
      }
    }

    if (moveDir) {
      this.position.addScaledVector(moveDir, speed * dt);
      this.facing = Math.atan2(moveDir.x, moveDir.z);
    }

    // Lunge animation offset
    if (this._lunge > 0) this._lunge -= dt;
    const lungeOffset = this._lunge > 0 ? Math.sin((0.2 - this._lunge) / 0.2 * Math.PI) * 0.4 : 0;

    // Vertical motion: floaters (drones/wisps) hover + bob constantly
    const now = performance.now();
    let y = this.hoverHeight || 0;
    if (this.hoverHeight > 0) y += Math.sin(now * 0.004 + (this.uid || 0)) * 0.18;
    else if (moveDir) y += Math.abs(Math.sin(now * 0.015)) * 0.08;

    this.mesh.position.copy(this.position);
    this.mesh.position.y = y;
    this.mesh.position.x += Math.sin(this.facing) * lungeOffset;
    this.mesh.position.z += Math.cos(this.facing) * lungeOffset;
    this.mesh.rotation.y = this.facing;

    // Spin drone rotors / wisp motes
    if (this._rotors.length) for (const r of this._rotors) r.rotation.y += dt * 40;
    if (this._motes) this._motes.rotation.y += dt * 2.2;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.hitFlash = 0.15;

    // Boss enrage at the phase threshold (once)
    if (this.isBoss && !this._phased && this.health > 0 &&
        this.health <= this.maxHealth * (this.type.phaseThreshold || 0.5)) {
      this._phased = true;
      this.type = { ...this.type, damage: Math.round(this.type.damage * 1.25), speed: this.type.speed * 1.3, attackCd: this.type.attackCd * 0.8 };
      if (this.onPhase) this.onPhase();
    }

    if (this.health <= 0) this._die();
    return this.health <= 0;
  }

  /** Called by the Encounter manager after the hero wins the battle. */
  defeat() { this._die(); }

  /** Brief non-aggro cooldown (used after the player flees). */
  stun(seconds) { this.cooldown = seconds; }

  applySlow(factor, duration) { this.slow = factor; this.slowTimer = duration; }

  _die() {
    this.alive = false;
    this.state = 'dead';
    this.respawnTimer = CONFIG.enemies.respawnDelay;
    this.mesh.visible = false;
  }

  _respawn() {
    this.alive = true;
    this.health = this.maxHealth;
    this.position.copy(this.home);
    this.mesh.visible = true;
    this.state = 'idle';
    this._rewarded = false;
    this.baseMat.emissive.setRGB(0, 0, 0);
  }
}
