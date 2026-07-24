/* ============================================================
   Player — the hero. Builds a simple armored figure from
   primitives, handles third-person movement, camera orbit,
   collision against town obstacles, and core stats
   (health / mana / xp / leveling). Combat + magic live in the
   systems, which read/modify this entity.
   ============================================================ */

import * as THREE from 'three';
import { CONFIG } from '../data/config.js';
import { STARTING_SPELLS } from '../data/spells.js';

export class Player {
  constructor(scene, camera, town) {
    this.scene = scene;
    this.camera = camera;
    this.town = town;
    const c = CONFIG.player;

    // --- Stats ---
    this.level = 1;
    this.xp = 0;
    this.xpToNext = CONFIG.leveling.baseXP;
    this.maxHealth = c.maxHealth;
    this.health = c.maxHealth;
    this.maxMana = c.maxMana;
    this.mana = c.maxMana;
    this.meleeDamage = c.meleeDamage;
    this.alive = true;

    // --- Status effects ---
    this.rootTimer = 0;     // > 0 => frozen in place (can't move)

    // --- Dash ability ---
    this.dashTimer = 0;
    this.dashCd = 0;
    this.dashDir = new THREE.Vector3();

    // --- Charge-up pose (abilities / Limit Break) ---
    this.chargeTimer = 0;

    // --- Equipment (bought from the shop) ---
    this.equipment = { weapon: null, armor: null };
    this.weaponBonus = 0;   // added to melee damage
    this.damageReduction = 0; // fraction of incoming damage negated (0..1)

    // --- Spellbook + inventory ---
    this.learnedSpells = [...STARTING_SPELLS];        // spell ids the hero knows
    this.loadout = [...STARTING_SPELLS].slice(0, 3);  // equipped to keys , . /
    while (this.loadout.length < 3) this.loadout.push(null);
    this.inventory = { potions: 5, ethers: 3, gold: 0 };

    // --- Movement / camera state ---
    this.position = town.playerSpawn.clone();
    this.velocity = new THREE.Vector3();
    this.facing = 0;             // model yaw
    this.camYaw = 0;
    this.camPitch = 0.35;
    this._camPos = new THREE.Vector3();
    this.meleeTimer = 0;
    this._attackAnim = 0;

    this._buildMesh();
  }

  _buildMesh() {
    const g = new THREE.Group();

    // --- Human materials ---
    const skin = new THREE.MeshStandardMaterial({ color: 0xd9a877, roughness: 0.65 });
    const hair = new THREE.MeshStandardMaterial({ color: 0x3a2416, roughness: 0.9 });
    const tunic = new THREE.MeshStandardMaterial({ color: 0x3f6d53, roughness: 0.85 });   // green traveller's tunic
    const belt = new THREE.MeshStandardMaterial({ color: 0x4a3220, roughness: 0.8 });
    const pants = new THREE.MeshStandardMaterial({ color: 0x5b4636, roughness: 0.9 });
    const boot = new THREE.MeshStandardMaterial({ color: 0x2e2119, roughness: 0.85 });
    const steel = new THREE.MeshStandardMaterial({ color: 0xc8ccd4, roughness: 0.3, metalness: 0.85 });

    // --- Torso (chest tapering to waist) ---
    const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.55, 12), tunic);
    chest.position.y = 1.18; chest.castShadow = true; g.add(chest);
    // shoulders
    const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), tunic);
    shoulders.scale.set(1, 0.6, 0.8);
    shoulders.position.y = 1.42; shoulders.castShadow = true; g.add(shoulders);
    // belt + hips
    const beltMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.12, 12), belt);
    beltMesh.position.y = 0.9; g.add(beltMesh);
    const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.25, 12), pants);
    hips.position.y = 0.78; hips.castShadow = true; g.add(hips);

    // --- Neck + head ---
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.14, 8), skin);
    neck.position.y = 1.55; g.add(neck);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), skin);
    head.scale.set(0.92, 1.05, 0.95);
    head.position.y = 1.75; head.castShadow = true; g.add(head);
    // hair cap
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.235, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), hair);
    hairCap.position.y = 1.78; g.add(hairCap);
    // nose (tiny) for a face read
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 6), skin);
    nose.rotation.x = Math.PI / 2; nose.position.set(0, 1.74, 0.21); g.add(nose);
    // eyes
    for (const sx of [-0.08, 0.08]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a }));
      eye.position.set(sx, 1.78, 0.19); g.add(eye);
    }

    // --- Legs (thigh + shin + boot) ---
    this.legs = [];
    for (const sx of [-0.12, 0.12]) {
      const leg = new THREE.Group();
      const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.35, 4, 8), pants);
      thigh.position.y = 0.5; thigh.castShadow = true; leg.add(thigh);
      const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.32, 4, 8), pants);
      shin.position.y = 0.18; shin.castShadow = true; leg.add(shin);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.3), boot);
      foot.position.set(0, 0.02, 0.06); leg.add(foot);
      leg.position.x = sx;
      g.add(leg);
      this.legs.push(leg);
    }

    // --- Left arm (upper + forearm + hand) ---
    const makeArm = (side) => {
      const arm = new THREE.Group();
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.3, 4, 8), tunic);
      upper.position.y = -0.18; upper.castShadow = true; arm.add(upper);
      const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.28, 4, 8), skin);
      fore.position.y = -0.5; fore.castShadow = true; arm.add(fore);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), skin);
      hand.position.y = -0.68; arm.add(hand);
      arm.position.set(side * 0.34, 1.42, 0);
      return arm;
    };

    const lArm = makeArm(-1);
    g.add(lArm);
    this.leftArm = lArm;

    // --- Right arm swings on attack; holds a sword ---
    this.armGroup = makeArm(1);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.02), steel);
    blade.position.set(0, -1.2, 0.05); blade.castShadow = true; this.armGroup.add(blade);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.8, roughness: 0.3 }));
    guard.position.set(0, -0.72, 0.05); this.armGroup.add(guard);
    g.add(this.armGroup);

    this.mesh = g;
    this.mesh.position.copy(this.position);
    this.scene.add(g);
  }

  // ---------------------------------------------------------
  //  Camera-relative movement + collision
  // ---------------------------------------------------------
  update(dt, input) {
    if (!this.alive) return;

    // Mouse look → camera orbit
    const { dx, dy } = input.consumeMouse();
    const cam = CONFIG.camera;
    this.camYaw -= dx * cam.sensitivity;
    this.camPitch = THREE.MathUtils.clamp(this.camPitch + dy * cam.sensitivity, cam.pitchMin, cam.pitchMax);

    // Frozen in place? Look around but don't move.
    if (this.rootTimer > 0) this.rootTimer -= dt;
    const frozen = this.rootTimer > 0;

    // Movement vector in camera space
    const mx = input.moveX, mz = input.moveZ;
    const moving = !frozen && (mx !== 0 || mz !== 0);
    if (moving) {
      // camera-relative: W (mz=-1) walks away from the camera, into the scene
      const angle = Math.atan2(mx, mz) + this.camYaw;
      const speed = CONFIG.player.moveSpeed * (input.sprinting ? CONFIG.player.sprintMultiplier : 1) * (this.slow || 1);
      const dir = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));

      const next = this.position.clone().addScaledVector(dir, speed * dt);
      this._resolveCollision(next);
      this.position.copy(next);

      // smoothly face travel direction
      this.facing = this._lerpAngle(this.facing, angle, 0.2);
    }

    // Dash burst (independent of normal movement)
    if (this.dashCd > 0) this.dashCd -= dt;
    if (this.dashTimer > 0 && !frozen) {
      this.dashTimer -= dt;
      const next = this.position.clone().addScaledVector(this.dashDir, 26 * dt);
      this._resolveCollision(next);
      this.position.copy(next);
    }

    // Regen
    this.mana = Math.min(this.maxMana, this.mana + CONFIG.player.manaRegen * dt);
    this.health = Math.min(this.maxHealth, this.health + CONFIG.player.healthRegen * dt);

    // Timers
    if (this.meleeTimer > 0) this.meleeTimer -= dt;
    if (this._attackAnim > 0) this._attackAnim -= dt;
    if (this.slowTimer > 0) { this.slowTimer -= dt; if (this.slowTimer <= 0) this.slow = 1; }

    // Charge-up pose takes priority over the attack swing: weapon thrust
    // overhead with a little tremble while power gathers.
    const swing = this._attackAnim > 0 ? Math.sin((1 - this._attackAnim / 0.3) * Math.PI) : 0;
    if (this.chargeTimer > 0) {
      this.chargeTimer -= dt;
      this.armGroup.rotation.x = 2.6 + Math.sin(performance.now() * 0.05) * 0.12;
      this.mesh && (this.mesh.rotation.z = Math.sin(performance.now() * 0.06) * 0.03);
    } else {
      this.armGroup.rotation.x = -swing * 2.4;
      if (this.mesh) this.mesh.rotation.z = 0;
    }

    // Walk cycle: swing legs + off-arm, add a little bob
    const t = performance.now() * 0.011;
    if (this.legs) {
      this.legs[0].rotation.x = moving ? Math.sin(t) * 0.6 : this.legs[0].rotation.x * 0.8;
      this.legs[1].rotation.x = moving ? -Math.sin(t) * 0.6 : this.legs[1].rotation.x * 0.8;
    }
    if (this.leftArm && swing === 0) this.leftArm.rotation.x = moving ? -Math.sin(t) * 0.5 : this.leftArm.rotation.x * 0.8;
    const bob = moving ? Math.abs(Math.sin(t)) * 0.06 : 0;

    this.mesh.position.copy(this.position);
    this.mesh.position.y = bob;
    this.mesh.rotation.y = this.facing;

    this._updateCamera(dt);
  }

  _resolveCollision(next) {
    const r = CONFIG.player.radius;
    for (const o of this.town.obstacles) {
      if (o.type === 'circle') {
        const dx = next.x - o.x, dz = next.z - o.z;
        const dist = Math.hypot(dx, dz);
        const min = o.r + r;
        if (dist < min && dist > 0.0001) {
          const push = (min - dist);
          next.x += (dx / dist) * push;
          next.z += (dz / dist) * push;
        }
      } else if (o.type === 'box') {
        const dx = next.x - o.x, dz = next.z - o.z;
        const px = o.hw + r - Math.abs(dx);
        const pz = o.hd + r - Math.abs(dz);
        if (px > 0 && pz > 0) {
          if (px < pz) next.x += Math.sign(dx) * px;
          else next.z += Math.sign(dz) * pz;
        }
      }
    }
    // Keep on the street: clamp to a corridor that widens at the boss plaza
    const w = CONFIG.world;
    const half = next.z < w.plazaZ + 18 ? w.plazaHalfWidth : w.streetHalfWidth;
    next.x = Math.max(-half, Math.min(half, next.x));
    next.z = Math.max(w.endZ + 4, Math.min(w.startZ, next.z));
  }

  _updateCamera(dt) {
    const c = CONFIG.camera;
    const cosP = Math.cos(this.camPitch);
    const offset = new THREE.Vector3(
      Math.sin(this.camYaw) * cosP * c.distance,
      Math.sin(this.camPitch) * c.distance + c.height,
      Math.cos(this.camYaw) * cosP * c.distance
    );
    const target = this.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    this._camPos.lerp(target.clone().add(offset), c.smooth);
    this.camera.position.copy(this._camPos);
    this.camera.lookAt(target);
  }

  /** Direction the camera/player is aiming (for spells & melee) */
  getAimDirection() {
    const cosP = Math.cos(this.camPitch);
    return new THREE.Vector3(-Math.sin(this.camYaw) * cosP, -Math.sin(this.camPitch), -Math.cos(this.camYaw) * cosP).normalize();
  }

  triggerAttackAnim() { this._attackAnim = 0.3; }

  /** Hold a charge-up pose for `seconds` (ability cast / Limit Break). */
  charge(seconds) { this.chargeTimer = Math.max(this.chargeTimer, seconds); }

  applyDamage(amount) {
    const reduced = Math.max(1, Math.round(amount * (1 - this.damageReduction)));
    this.health = Math.max(0, this.health - reduced);
    if (this.health <= 0) this.alive = false;
    return this.health <= 0;
  }

  /** Freeze the hero in place for `seconds` (EMP / cryo). */
  applyRoot(seconds) { this.rootTimer = Math.max(this.rootTimer, seconds); }

  /** Quick evasive dash in the current move direction (or camera-forward). */
  dash(input) {
    if (this.dashCd > 0 || this.rootTimer > 0) return false;
    const mx = input.moveX, mz = input.moveZ;
    const angle = (mx !== 0 || mz !== 0) ? Math.atan2(mx, mz) + this.camYaw : this.camYaw + Math.PI;
    this.dashDir.set(Math.sin(angle), 0, Math.cos(angle));
    this.facing = angle;
    this.dashTimer = 0.2;
    this.dashCd = 1.1;
    return true;
  }

  /** Melee damage including any equipped weapon bonus. */
  getMeleeDamage() { return this.meleeDamage + this.weaponBonus; }

  equipWeapon(id, bonus) { this.equipment.weapon = id; this.weaponBonus = bonus; }
  equipArmor(id, reduction) { this.equipment.armor = id; this.damageReduction = reduction; }

  heal(amount) {
    const before = this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    return this.health - before;
  }

  applySlow(factor, duration) {
    this.slow = factor;
    this.slowTimer = duration;
  }

  gainXP(amount) {
    this.xp += amount;
    let leveled = false;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this._levelUp();
      leveled = true;
    }
    return leveled;
  }

  // --- Spellbook ---
  /** Learn a spell; auto-equips into the first empty , . / slot. Returns true if new. */
  learnSpell(id) {
    if (this.learnedSpells.includes(id)) return false;
    this.learnedSpells.push(id);
    const empty = this.loadout.indexOf(null);
    if (empty !== -1) this.loadout[empty] = id;
    return true;
  }

  knowsSpell(id) { return this.learnedSpells.includes(id); }

  /** Equip spell `id` into loadout slot (0,1,2). Null clears the slot. */
  equipSpell(slot, id) {
    if (slot < 0 || slot > 2) return;
    // if this spell is already in another slot, swap it out to avoid duplicates
    if (id) {
      const existing = this.loadout.indexOf(id);
      if (existing !== -1 && existing !== slot) this.loadout[existing] = this.loadout[slot];
    }
    this.loadout[slot] = id;
  }

  _levelUp() {
    const L = CONFIG.leveling;
    this.level++;
    this.maxHealth += L.healthPerLevel;
    this.maxMana += L.manaPerLevel;
    this.meleeDamage += L.damagePerLevel;
    this.health = this.maxHealth;   // full heal on level up
    this.mana = this.maxMana;
    this.xpToNext = Math.round(this.xpToNext * L.xpGrowth);
  }

  respawn() {
    this.alive = true;
    this.health = this.maxHealth;
    this.mana = this.maxMana;
    this.position.copy(this.town.playerSpawn);
    this.velocity.set(0, 0, 0);
  }

  _lerpAngle(a, b, t) {
    let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
  }
}
