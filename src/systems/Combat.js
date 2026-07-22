/* ============================================================
   Combat — real-time, in-world combat (no battle screen).
   Manages roaming enemies + the active boss across all three acts,
   resolves the player's melee/spells and enemy hits (including
   Frost Wardens that freeze and Ice Shamans that heal allies).
   ============================================================ */

import * as THREE from 'three';
import { Enemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';
import { CONFIG } from '../data/config.js';

// A mixed gauntlet of Helix security down the avenue (harder toward the plaza)
const STREET_TABLE = [
  'goblin', 'wolf', 'goblin', 'skeleton', 'wolf', 'ogre',
  'skeleton', 'iceshaman', 'wraith', 'revenant', 'frostward', 'wolf',
  'revenant', 'icegolem', 'frostward', 'iceshaman',
];

// Bosses — tuned for fair real-time fights (internal ids kept stable)
const BOSSES = {
  gorbash: { bossId: 'gorbash', name: 'Riot Captain Brand', body: 'humanoid', health: 300, damage: 12, speed: 3.4, scale: 1.7,
    xp: 500, gold: 400, color: 0x8a2f38, eye: 0xff3300, attackRange: 3.4, attackCd: 1.8, isBoss: true, phaseThreshold: 0.5, base: 'ogre' },
  malketh: { bossId: 'malketh', name: 'Hunter-Class Mech', body: 'mech', health: 420, damage: 16, speed: 3.6, scale: 2.2,
    xp: 900, gold: 800, color: 0x3a4654, eye: 0xff3344, attackRange: 3.8, attackCd: 1.7, isBoss: true, phaseThreshold: 0.5, base: 'revenant' },
  frostqueen: { bossId: 'frostqueen', name: 'President Vance', body: 'mech', health: 950, damage: 18, speed: 3.7, scale: 2.2,
    xp: 1400, gold: 1200, color: 0xc9a24a, eye: 0xff2222, attackRange: 3.8, attackCd: 1.8, isBoss: true, phaseThreshold: 0.5,
    base: 'revenant', freezeDur: 1.6 },
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

    town.streetSpawns.forEach((pos, i) => {
      const e = new Enemy(this.scene, pos, STREET_TABLE[i % STREET_TABLE.length]);
      e._rewarded = false;
      e.group = 'security';
      e.uid = ENEMY_UID++;
      this.enemies.push(e);
    });
  }

  get all() { return this.boss ? [...this.enemies, this.boss] : this.enemies; }

  // ---------------------------------------------------------
  update(dt) {
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
    const dead = this.player.applyDamage(dmg);
    this.hud.floatDamage(this.player.position, dmg, 'player-hit');

    if (e.type.freezeDur) {
      this.player.applyRoot(e.type.freezeDur);
      this.hud.log(`${e.type.name} freezes you solid!`, 'damage');
    } else {
      this.hud.log(`${e.type.name} hits you for ${dmg}`, 'damage');
    }
    if (dead && this.onPlayerDeath) this.onPlayerDeath();
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
    this._castSlash(spell, dir);
    this.projectiles.push(new Projectile(this.scene, spell, origin, dir));
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

  /** LIMIT BREAK — "OMNI-SURGE": a devastating shockwave around the hero. */
  unleashLimit() {
    const p = this.player;
    p.triggerAttackAnim();
    if (this.onLimitStart) this.onLimitStart();   // screen flash + camera shake

    // Bright core flash
    const flash = new THREE.PointLight(0xfff2a0, 40, 50, 2);
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
      flash.intensity = 40 * (1 - t);
      ring.scale.setScalar(1 + t * 16);
      ringMat.opacity = 0.9 * (1 - t);
      requestAnimationFrame(grow);
    };
    grow();

    const dmg = 90 + this.player.level * 12;   // scales with level
    for (const e of this.all) {
      if (!e.alive) continue;
      if (e.position.distanceTo(p.position) > 16) continue;
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
