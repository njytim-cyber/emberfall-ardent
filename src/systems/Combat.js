/* ============================================================
   Combat — real-time, in-world combat (no battle screen).
   Manages roaming enemies + the active boss across all three acts,
   resolves the player's melee/spells and enemy hits (including
   Frost Wardens that freeze and Ice Shamans that heal allies).
   ============================================================ */

import * as THREE from 'three';
import { Enemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';
import { CONFIG, pathCenterX } from '../data/config.js';
import { WAVES } from '../data/waves.js';

// Bosses — tuned for fair real-time fights (internal ids kept stable)
const BOSSES = {
  gorbash: { bossId: 'gorbash', name: 'Riot Captain Brand', body: 'humanoid', health: 300, damage: 12, speed: 3.4, scale: 1.7,
    xp: 500, gold: 400, color: 0x8a2f38, eye: 0xff3300, attackRange: 3.4, attackCd: 1.8, isBoss: true, phaseThreshold: 0.5, base: 'ogre' },
  malketh: { bossId: 'malketh', name: 'Hunter-Class Mech', body: 'mech', health: 420, damage: 16, speed: 3.6, scale: 2.2,
    xp: 900, gold: 800, color: 0x3a4654, eye: 0xff3344, attackRange: 3.8, attackCd: 1.7, isBoss: true, phaseThreshold: 0.5, base: 'revenant' },
  frostqueen: { bossId: 'frostqueen', name: 'President Vance', body: 'suit', health: 950, damage: 20, speed: 3.4, scale: 1.7,
    xp: 1400, gold: 1200, color: 0x24242e, eye: 0xff3030, attackRange: 3.6, attackCd: 1.7, isBoss: true, phaseThreshold: 0.5,
    base: 'revenant', freezeDur: 1.0 },
  // The Unit Controller — Helix's inhuman enforcer, met partway up the tower
  controller: { bossId: 'controller', name: 'The Unit Controller', body: 'suit', health: 720, damage: 19, speed: 4.0, scale: 1.75,
    xp: 1000, gold: 700, color: 0x141420, eye: 0x9b30ff, attackRange: 3.6, attackCd: 1.4, isBoss: true, phaseThreshold: 0.5,
    base: 'wraith', freezeDur: 0.9 },
};

let ENEMY_UID = 0;

export class Combat {
  constructor(scene, player, town, hud) {
    this.scene = scene;
    this.player = player;
    this.town = town;
    this.hud = hud;
    this.enemies = [];
    this.boss = null;
    this.projectiles = [];
    this.lasers = [];        // brief enemy beam FX
    this.lockTarget = null;  // set by the Game's lock-on

    // Hooks wired by the Game
    this.onEnemyDefeated = null;
    this.onBossDefeated = null;
    this.onBossPhase = null;
    this.onPlayerDeath = null;
    this.onDroneDamage = null;   // charges the Limit gauge (drones only)
    this.onLimitStart = null;    // triggers screen flash + camera shake
    this.onLimitRelease = null;
    this.onWave = null;          // (wave) => Game reacts (log / chapter)

    // Wave (group) encounters — spawned one group at a time as you advance
    this.waves = WAVES;
    this.waveIndex = 0;
  }

  get all() { return this.boss ? [...this.enemies, this.boss] : this.enemies; }

  /** Spawn a guard group on a tower floor (at floor height). */
  spawnInteriorFloor(floorY, keys) {
    const IN = CONFIG.world.interior;
    keys.forEach((key, i) => {
      const spread = (i - (keys.length - 1) / 2) * 3.6;
      const pos = new THREE.Vector3(IN.x + spread, floorY, IN.z + (Math.random() - 0.5) * 6 - 2);
      const e = new Enemy(this.scene, pos, key);
      e._rewarded = false; e.group = 'interior'; e.uid = ENEMY_UID++; e.noRespawn = true;
      this.enemies.push(e);
    });
  }

  get livingCount() { return this.enemies.filter((e) => e.alive).length; }
  get wavesDone() { return this.waveIndex >= this.waves.length; }

  /** Spawn the next group once the hero reaches it and the last group is clear. */
  _updateWaves() {
    if (this.waveIndex >= this.waves.length) return;
    if (this.livingCount > 0) return;                     // clear the current group first
    const wave = this.waves[this.waveIndex];
    if (this.player.position.z > wave.triggerZ) return;   // not advanced far enough yet

    wave.foes.forEach((key, i) => {
      const spread = (i - (wave.foes.length - 1) / 2) * 3.2;
      const pos = new THREE.Vector3(pathCenterX(wave.z) + spread, 0, wave.z + (Math.random() - 0.5) * 3);
      const e = new Enemy(this.scene, pos, key);
      e._rewarded = false;
      e.group = wave.tag;
      e.uid = ENEMY_UID++;
      e.noRespawn = true;         // cleared groups stay cleared (progression)
      this.enemies.push(e);
    });
    this._frontZ = wave.z - 3;         // one-group lock: can't pass until cleared
    this.waveIndex++;
    if (this.onWave) this.onWave(wave);
  }

  /** Keep the player behind the current group, or inside the boss arena. */
  _applyBarriers() {
    const W = CONFIG.world;
    this.player.inCombat = this.livingCount > 0 || !!(this.boss && this.boss.alive);
    if (this.boss && this.boss.alive) {
      this.player.frontLineZ = W.endZ + 4;
      this.player.arenaBackZ = W.plazaZ + 22;      // sealed in the plaza arena
    } else if (this.livingCount > 0) {
      this.player.frontLineZ = this._frontZ ?? (W.endZ + 4);
      this.player.arenaBackZ = W.startZ;
    } else {
      this.player.frontLineZ = W.endZ + 4;
      this.player.arenaBackZ = W.startZ;
    }
  }

  // ---------------------------------------------------------
  update(dt) {
    this._updateWaves();
    for (const e of this.all) {
      e.update(dt, this.player);
      if (e.pendingAttack) {
        e.pendingAttack = false;
        this._enemyAttack(e);
      }
    }

    // Advance projectiles + resolve collisions
    for (const p of this.projectiles) {
      p.update(dt);
      if (p.dead) continue;
      for (const e of this.all) {
        if (!e.alive) continue;
        const d = e.position.clone().setY(p.position.y).distanceTo(p.position);
        if (d <= p.radius + 0.8) { this._spellHit(p, e); break; }
      }
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);

    this._updateLasers(dt);
    this._updateEnemyBars();
    this._applyBarriers();
    this.hud.updateBossBar(this.boss);
  }

  /** Resolve one enemy's action: heal an ally, freeze, or just hit. */
  _enemyAttack(e) {
    if (!this.player.alive) return;

    // Ice Shaman / Repair Drone: mend the most-wounded nearby ally instead of striking
    if (e.type.healAlly) {
      const ally = this._mostWoundedAlly(e);
      if (ally) {
        ally.health = Math.min(ally.maxHealth, ally.health + e.type.healAlly);
        this._spawnLaser(e.position, ally.position, 0x66ffcc);   // repair beam
        this.hud.floatDamage(ally.position, e.type.healAlly, 'heal');
        return;
      }
    }

    // Every attacker fires a visible beam at you
    this._spawnLaser(e.position, this.player.position, e.type.eye || 0xff4444);

    const dmg = Math.round(e.type.damage);
    const applied = this.player.applyDamage(dmg);      // returns 0 if dodged (rolling)
    if (applied > 0) this.hud.floatDamage(this.player.position, applied, 'player-hit');   // big red number
    if (applied > 0 && e.type.freezeDur) this.player.applyRoot(e.type.freezeDur);
    if (!this.player.alive && this.onPlayerDeath) this.onPlayerDeath();
  }

  /** A brief glowing beam from `from` to `to`. */
  _spawnLaser(from, to, color) {
    const a = from.clone(); a.y += 1.4;
    const b = to.clone(); b.y += 1.2;
    const len = a.distanceTo(b);
    const geo = new THREE.CylinderGeometry(0.05, 0.05, len, 6);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
    const beam = new THREE.Mesh(geo, mat);
    beam.position.copy(a).lerp(b, 0.5);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    this.scene.add(beam);
    const light = new THREE.PointLight(color, 3, 6, 2);
    light.position.copy(b);
    this.scene.add(light);
    this.lasers.push({ beam, light, life: 0.14, mat });
  }

  _updateLasers(dt) {
    for (const l of this.lasers) {
      l.life -= dt;
      l.mat.opacity = Math.max(0, l.life / 0.14) * 0.9;
      l.light.intensity = Math.max(0, l.life / 0.14) * 3;
      if (l.life <= 0) {
        this.scene.remove(l.beam); this.scene.remove(l.light);
        l.beam.geometry.dispose(); l.mat.dispose();
      }
    }
    this.lasers = this.lasers.filter((l) => l.life > 0);
  }

  _mostWoundedAlly(healer) {
    let best = null, worst = 0.95;
    const range = healer.type.healRange || 12;
    for (const e of this.all) {
      if (!e.alive || e === healer) continue;
      if (e.position.distanceTo(healer.position) > range) continue;
      const frac = e.health / e.maxHealth;
      if (frac < worst) { worst = frac; best = e; }
    }
    return best;
  }

  // ---------------------------------------------------------
  //  Player actions
  // ---------------------------------------------------------
  meleeAttack() {
    const p = this.player;
    if (p.meleeTimer > 0) return;
    p.meleeTimer = CONFIG.player.meleeCooldown;
    p.triggerAttackAnim();

    const forward = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
    let hitAny = false;
    for (const e of this.all) {
      if (!e.alive) continue;
      const to = e.position.clone().sub(p.position); to.y = 0;
      const dist = to.length();
      if (dist > CONFIG.player.meleeRange) continue;
      if (forward.dot(to.normalize()) < 0.35) continue;   // ~120° frontal arc

      hitAny = true;
      let dmg = p.getMeleeDamage(), crit = false;
      if (Math.random() < CONFIG.player.critChance) { dmg = Math.round(dmg * CONFIG.player.critMultiplier); crit = true; }
      else dmg = Math.round(dmg);
      const died = e.takeDamage(dmg);
      this.hud.floatDamage(e.position, dmg, crit ? 'crit' : 'enemy-hit');
      if (e.body === 'drone' && this.onDroneDamage) this.onDroneDamage(dmg);
      if (died) this._reward(e);
    }
    if (!hitAny) this.hud.log('Swing — nothing in reach', 'system');
  }

  castProjectile(spell) {
    const origin = this.player.position.clone(); origin.y = 1.4;
    let dir = this.player.getAimDirection();
    // Lock-on target wins; otherwise soft aim-assist at nearest foe in view
    const target = (this.lockTarget && this.lockTarget.alive) ? this.lockTarget : this._nearestEnemy(24);
    if (target) {
      const aim = target.position.clone(); aim.y = 1.0; aim.sub(origin).normalize();
      if (this.lockTarget || aim.dot(dir) > 0.2) dir = aim;
    }
    dir.y = Math.max(dir.y, -0.05);
    const color = { fire: 0xff5a1e, ice: 0x5ac8ff, holy: 0x9bffb0, thunder: 0xffe14a, dark: 0xb06bff }[spell.element] || 0xffffff;

    // Braver (and any 'leap' art): a leaping overhead slash instead of a plain cast
    if (spell.anim === 'leap') { this._leapCast(spell, dir, color); return; }

    this.player.charge(0.22);                 // brief wind-up pose
    this._chargeOrb(color, 0.22, 1.2);        // energy gathers at the blade
    this._castSlash(spell, dir);
    this.projectiles.push(new Projectile(this.scene, spell, origin, dir));
  }

  /** BRAVER — leap up, cleave down, release a blade wave + ground shock. */
  _leapCast(spell, dir, color) {
    this.player.braver(Math.atan2(dir.x, dir.z));   // face the strike
    this._chargeOrb(color, 0.28, 0.9);              // gather at the raised blade

    // At the downward-cleave moment: big vertical slash + launch the wave
    setTimeout(() => {
      this._braverSlash(color);
      const o = this.player.position.clone(); o.y = 1.6;
      this.projectiles.push(new Projectile(this.scene, spell, o, dir));
    }, 270);

    // Landing impact ring
    setTimeout(() => this._groundRing(color), 490);
  }

  _braverSlash(color) {
    const fwd = new THREE.Vector3(Math.sin(this.player.facing), 0, Math.cos(this.player.facing));
    const pos = this.player.position.clone().addScaledVector(fwd, 1.5); pos.y = 1.9;
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(1.7, 0.18, 8, 18, Math.PI * 1.15),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, side: THREE.DoubleSide }));
    arc.position.copy(pos);
    arc.lookAt(pos.clone().add(fwd));      // face along travel
    arc.rotation.z = Math.PI / 2;          // orient as a vertical downward sweep
    this.scene.add(arc);
    const light = new THREE.PointLight(color, 9, 9, 2); light.position.copy(pos); this.scene.add(light);
    const t0 = performance.now();
    const anim = () => {
      const t = (performance.now() - t0) / 260;
      if (t >= 1) { this.scene.remove(arc); this.scene.remove(light); arc.geometry.dispose(); arc.material.dispose(); return; }
      arc.scale.set(1, 1 + t * 0.7, 1);
      arc.material.opacity = 0.95 * (1 - t);
      light.intensity = 9 * (1 - t);
      requestAnimationFrame(anim);
    };
    anim();
  }

  _groundRing(color) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.9, 32), mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(this.player.position); ring.position.y = 0.08;
    this.scene.add(ring);
    const t0 = performance.now();
    const anim = () => {
      const t = (performance.now() - t0) / 380;
      if (t >= 1) { this.scene.remove(ring); ring.geometry.dispose(); mat.dispose(); return; }
      ring.scale.setScalar(1 + t * 7);
      mat.opacity = 0.85 * (1 - t);
      requestAnimationFrame(anim);
    };
    anim();
  }

  /** A gathering energy orb at the hero's blade while an art charges. */
  _chargeOrb(color, duration, maxScale) {
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }));
    const light = new THREE.PointLight(color, 5, 6, 2);
    this.scene.add(orb); this.scene.add(light);
    const t0 = performance.now();
    const anim = () => {
      const t = (performance.now() - t0) / (duration * 1000);
      const pos = this.player.position.clone(); pos.y = 1.5;
      pos.addScaledVector(new THREE.Vector3(Math.sin(this.player.facing), 0, Math.cos(this.player.facing)), 0.7);
      orb.position.copy(pos); light.position.copy(pos);
      if (t >= 1) { this.scene.remove(orb); this.scene.remove(light); orb.geometry.dispose(); orb.material.dispose(); return; }
      orb.scale.setScalar(0.3 + t * maxScale);
      orb.material.opacity = 0.95 * (1 - t * 0.4);
      light.intensity = 5 * (1 - t * 0.3);
      requestAnimationFrame(anim);
    };
    anim();
  }

  /** A quick crescent slash-arc in front of the hero when an art is cast. */
  _castSlash(spell, dir) {
    const color = { fire: 0xff5a1e, ice: 0x5ac8ff, holy: 0x9bffb0, thunder: 0xffe14a, dark: 0xb06bff }[spell.element] || 0xffffff;
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(1.0, 0.12, 6, 12, Math.PI * 1.1),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, side: THREE.DoubleSide }));
    const pos = this.player.position.clone().addScaledVector(dir, 1.2); pos.y = 1.3;
    arc.position.copy(pos);
    arc.lookAt(pos.clone().add(dir));
    arc.rotation.z = Math.random() * Math.PI;
    this.scene.add(arc);
    const t0 = performance.now();
    const anim = () => {
      const t = (performance.now() - t0) / 220;
      if (t >= 1) { this.scene.remove(arc); arc.geometry.dispose(); arc.material.dispose(); return; }
      arc.scale.setScalar(1 + t * 1.6);
      arc.material.opacity = 0.95 * (1 - t);
      requestAnimationFrame(anim);
    };
    anim();
  }

  /**
   * LIMIT BREAK — "OMNI-SURGE": the hero powers up (charge-up), an energy
   * column builds around them, then releases a devastating shockwave.
   */
  unleashLimit() {
    const p = this.player;
    p.charge(0.75);                              // power-up pose
    if (this.onLimitStart) this.onLimitStart();  // banner + light shake
    this.hud.log('⚡ CHARGING…', 'crit');

    // Rising energy column that swells during the wind-up
    const colMat = new THREE.MeshBasicMaterial({ color: 0xffe070, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.1, 6, 20, 1, true), colMat);
    this.scene.add(col);
    const buildLight = new THREE.PointLight(0xffe070, 0, 22, 2);
    this.scene.add(buildLight);

    const t0 = performance.now();
    const WIND = 620;   // ms of charge-up
    const build = () => {
      const t = (performance.now() - t0) / WIND;
      col.position.copy(p.position); col.position.y = 3;
      buildLight.position.copy(p.position); buildLight.position.y = 2;
      if (t >= 1) {
        this.scene.remove(col); this.scene.remove(buildLight);
        col.geometry.dispose(); colMat.dispose();
        this._limitRelease();
        return;
      }
      const wob = 1 + Math.sin(t * 26) * 0.12;
      col.scale.set(wob, 1 + t * 0.4, wob);
      colMat.opacity = 0.55 * t;
      buildLight.intensity = 22 * t;
      requestAnimationFrame(build);
    };
    build();
  }

  _limitRelease() {
    const p = this.player;
    if (this.onLimitRelease) this.onLimitRelease();   // big shake
    // …then the hero explodes out of the pose with a leaping strike
    p.braver(p.facing);
    this._braverSlash(0xffe070);

    // Core flash
    const flash = new THREE.PointLight(0xfff2a0, 45, 55, 2);
    flash.position.copy(p.position); flash.position.y = 1.5;
    this.scene.add(flash);
    // Expanding ground shockwave ring
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffe070, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.3, 40), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(p.position); ring.position.y = 0.1;
    this.scene.add(ring);

    const start = performance.now();
    const grow = () => {
      const t = (performance.now() - start) / 600;
      if (t >= 1) {
        this.scene.remove(flash); this.scene.remove(ring);
        ring.geometry.dispose(); ringMat.dispose();
        return;
      }
      flash.intensity = 45 * (1 - t);
      ring.scale.setScalar(1 + t * 18);
      ringMat.opacity = 0.9 * (1 - t);
      requestAnimationFrame(grow);
    };
    grow();

    const dmg = 90 + this.player.level * 12;
    for (const e of this.all) {
      if (!e.alive) continue;
      if (e.position.distanceTo(p.position) > 17) continue;
      const died = e.takeDamage(dmg);
      this.hud.floatDamage(e.position, dmg, 'crit');
      if (died) this._reward(e);
    }
    this.hud.log('⚡ OMNI-SURGE! ⚡', 'crit');
  }

  _spellHit(proj, enemy) {
    const spell = proj.spell;
    const point = proj.position.clone();
    proj.explode();

    const mag = 10 + this.player.level * 2;
    const base = spell.power + mag * 0.6;
    const targets = spell.splash > 0
      ? this.all.filter((e) => e.alive && e.position.distanceTo(point) <= spell.splash)
      : [enemy];

    let firstDmg = 0;
    for (const e of targets) {
      if (!e || !e.alive) continue;
      const falloff = spell.splash > 0 ? 1 - (e.position.distanceTo(point) / spell.splash) * 0.4 : 1;
      const amount = Math.max(1, Math.round(base * falloff));

      // Elemental absorption: a foe absorbing this element is HEALED, not hurt
      if (spell.element && e.type.absorb === spell.element) {
        e.health = Math.min(e.maxHealth, e.health + amount);
        this.hud.floatDamage(e.position, amount, 'heal');
        continue;
      }

      if (!firstDmg) firstDmg = amount;
      const died = e.takeDamage(amount);
      this.hud.floatDamage(e.position, amount, 'enemy-hit');
      if (spell.slow) e.applySlow(spell.slow, spell.slowDuration);
      if (e.body === 'drone' && this.onDroneDamage) this.onDroneDamage(amount);
      if (died) this._reward(e);
    }

    if (spell.type === 'drain' && firstDmg > 0) {
      const heal = Math.round(firstDmg * 0.5);
      this.player.heal(heal);
      this.hud.floatDamage(this.player.position, heal, 'heal');
    }
  }

  // ---------------------------------------------------------
  //  Boss
  // ---------------------------------------------------------
  /** Spawn a boss ('gorbash' | 'malketh' | 'frostqueen') at a position. */
  spawnBoss(pos, which = 'gorbash') {
    const def = BOSSES[which] || BOSSES.gorbash;
    const e = new Enemy(this.scene, pos, def.base, def);
    e._rewarded = false;
    e.group = 'boss';
    e.bossId = def.bossId;
    e.uid = ENEMY_UID++;
    e.onPhase = () => { if (this.onBossPhase) this.onBossPhase(e); };
    this.boss = e;
    return e;
  }

  // ---------------------------------------------------------
  //  Rewards / death
  // ---------------------------------------------------------
  _reward(e) {
    if (e._rewarded) return;
    e._rewarded = true;
    const leveled = this.player.gainXP(e.type.xp || 0);
    this.player.inventory.gold += e.type.gold || 0;
    this.hud.log(`${e.type.name} slain! +${e.type.xp} XP`, 'system');
    if (leveled) { this.hud.log(`LEVEL UP! You are now level ${this.player.level}`, 'crit'); this.hud.flashLevelUp?.(); }

    // If the locked foe fell, snap lock-on to the next in the group
    if (e === this.lockTarget) this.acquireLock();

    if (e.isBoss) { this.onBossDefeated?.(e); }
    else { this.onEnemyDefeated?.(e); }
  }

  get bossId() { return this.boss?.bossId || null; }

  _nearestEnemy(max) {
    let best = null, bd = max;
    for (const e of this.all) {
      if (!e.alive) continue;
      const d = e.position.distanceTo(this.player.position);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  // ---- Lock-on ----
  acquireLock() {
    const fwd = new THREE.Vector3(-Math.sin(this.player.camYaw), 0, -Math.cos(this.player.camYaw));
    let best = null, bestScore = 1e9;
    for (const e of this.all) {
      if (!e.alive) continue;
      const to = e.position.clone().sub(this.player.position); to.y = 0;
      const d = to.length();
      if (d > 38) continue;
      const dot = fwd.dot(to.normalize());
      if (dot < 0.0) continue;                 // must be roughly ahead
      const score = d - dot * 10;              // favour centred, close targets
      if (score < bestScore) { bestScore = score; best = e; }
    }
    this.lockTarget = best;
    return best;
  }

  clearLock() { this.lockTarget = null; }

  // ---- Party companion's auto-attack ----
  _nearestEnemyTo(pos, max) {
    let best = null, bd = max;
    for (const e of this.all) { if (!e.alive) continue; const d = e.position.distanceTo(pos); if (d < bd) { bd = d; best = e; } }
    return best;
  }

  /** The companion fires a bolt at the nearest foe. Returns true if it fired. */
  allyBolt(fromPos) {
    const target = this._nearestEnemyTo(fromPos, 26);
    if (!target) return false;
    const origin = fromPos.clone(); origin.y = 1.4;
    const dir = target.position.clone(); dir.y = 1.0; dir.sub(origin).normalize();
    this.projectiles.push(new Projectile(this.scene,
      { power: 46, element: 'thunder', speed: 36, splash: 0, type: 'magic' }, origin, dir));
    return true;
  }

  validateLock() {
    if (this.lockTarget && (!this.lockTarget.alive ||
        this.lockTarget.position.distanceTo(this.player.position) > 42)) {
      this.lockTarget = null;
    }
  }

  /** Feed the HUD every nearby living enemy so it can float their health bars. */
  _updateEnemyBars() {
    const near = this.all.filter((e) => e.alive && e.position.distanceTo(this.player.position) < 26);
    this.hud.updateEnemyBars(near);
  }
}
