/* ============================================================
   Game — orchestrator + state machine for the single-mission,
   linear-street version of EMBERFALL: fight down Vance Avenue,
   reach the plaza, and take down President Vance (the lone boss).

   States: 'cutscene' | 'menu' | 'explore' | 'gameover'
   Features: real-time combat, dash, lock-on (right-click), and a
   Limit Break (R when the gauge is full).
   ============================================================ */

import * as THREE from 'three';
import { Input } from './Input.js';
import { Director } from './Director.js';
import { Environment } from '../world/Environment.js';
import { Town } from '../world/Town.js';
import { Player } from '../entities/Player.js';
import { NPC } from '../entities/NPC.js';
import { Combat } from '../systems/Combat.js';
import { Story } from '../story/Story.js';
import { HUD } from '../ui/HUD.js';
import { Menu } from '../ui/Menu.js';
import { Shop } from '../ui/Shop.js';
import { MobileControls } from '../ui/MobileControls.js';
import { SPELLS_BY_ID } from '../data/spells.js';
import { CONFIG } from '../data/config.js';

const QUICK_KEYS = [',', '.', '/'];
const CHAPTER_NAMES = { 1: 'THE DEEP WOOD', 2: 'THE BLIGHTED EDGE', 3: 'THE CITY GATE', 4: 'VANCE AVENUE', 5: 'THE PLAZA' };

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.running = false;
    this.state = 'cutscene';
    this.busy = false;
    this.onGameOver = null;

    // Touch/tablet detection → lighter rendering for smooth mobile play
    this.isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 ||
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');

    // --- Renderer (dialed back on mobile) ---
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !this.isMobile, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.3 : 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = this.isMobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 800);

    // --- World ---
    this.environment = new Environment(this.scene, this.renderer, { low: this.isMobile });
    this.town = new Town(this.scene);

    // --- Entities & systems ---
    this.input = new Input(canvas);
    if (this.isMobile) this.mobile = new MobileControls(this.input);
    this.hud = new HUD(this.camera);
    this.player = new Player(this.scene, this.camera, this.town);
    // Party companion — Aria, a ranged caster (different look + moveset). AI-follows;
    // press ; to swap who you control.
    this.ally = new Player(this.scene, this.camera, this.town, {
      name: 'Aria', ai: true, tunicColor: 0x6d2f6d, hairColor: 0x5a2a12,
      loadout: ['thunder', 'blizzard', 'holy'],
    });
    this.ally.position.copy(this.player.position).add(new THREE.Vector3(2.6, 0, 1.4));
    this.combat = new Combat(this.scene, this.player, this.town, this.hud);
    this.menu = new Menu();
    this.shop = new Shop();
    this.story = new Story(this.player);

    this.cooldowns = {};
    this.limit = 0;             // Limit Break gauge 0..100
    this._lastChapter = 1;

    // --- Cinematic camera ---
    this.director = new Director(this.camera);
    this._pendingFocus = null;
    this._pendingMode = 'orbit';

    // --- Wiring ---
    this.story.onSpellLearned = (spell) => this.hud.log(`Acquired ${spell.icon} ${spell.name}!`, 'crit');
    this.menu.onClose = () => { this.state = 'explore'; this._lock(); };
    this.shop.onClose = () => { this.state = 'explore'; this._lock(); };
    this.hud.onSensChange = (v) => { this.input.lookSens = v; };

    // Takedowns tally + may trigger a chapter cutscene
    this.combat.onEnemyDefeated = () => {
      const scene = this.story.onEnemyDefeated();
      if (scene) { this._setFocus(this.player.position, 'orbit'); this._runCutscene(() => this.story.play(scene)); }
    };
    // Limit gauge charges ONLY from damaging drones (generous — ~1-2 drones fills it)
    this.combat.onDroneDamage = (dmg) => { this.limit = Math.min(100, this.limit + dmg * 2.4); };
    this.combat.onLimitStart = () => { this.hud.limitFlash(); this._shake = 0.35; };
    this.combat.onLimitRelease = () => { this._shake = 0.75; };
    this._limitReady = false;
    this.combat.onBossPhase = () => this._runCutscene(() => this.story.bossPhaseCallback());
    this.combat.onBossDefeated = () => this._runCutscene(async () => {
      const bossPos = this.combat.boss ? this.combat.boss.position.clone() : this.player.position.clone();
      this.combat.boss = null;
      this._setFocus(this.player.position, 'orbit');
      await this.story.play('boss_flee');
      // Cade draws from his back and finishes it — a decisive slash
      this.player.inCombat = true;
      this.player.braver(Math.atan2(bossPos.x - this.player.position.x, bossPos.z - this.player.position.z));
      this.combat._braverSlash(0xff5a1e);
      this._shake = 0.6;
      await new Promise((r) => setTimeout(r, 850));
      await this.story.onBossDefeated();       // grants Omnislash + plays the ending
    });
    this.combat.onPlayerDeath = () => this._gameOver();
    // A new group of enemies appears — auto lock-on to it
    this.combat.onWave = (wave) => {
      this.hud.log(wave.tag === 'forest' ? '🌿 Corrupted guardians block the path!' : '🚨 Helix security moves in!', 'crit');
      this.combat.acquireLock();
    };
    this._shake = 0;

    // --- NPCs: Rae (contact) + Doc (always-open vendor) ---
    this.rae = new NPC(this.scene, this.town.raePos, { name: 'Rae', kind: 'npc' });
    this.doc = new NPC(this.scene, this.town.docPos, { name: 'Doc', kind: 'merchant' });
    this.nearbyNPC = null;

    this.clock = new THREE.Clock();
    this._elapsed = 0;
    window.addEventListener('resize', () => this._onResize());
  }

  _setFocus(vec, mode = 'orbit') { this._pendingFocus = new THREE.Vector3(vec.x, vec.y || 0, vec.z); this._pendingMode = mode; }

  async start() {
    this.running = true;
    this.hud.show();
    this.clock.start();
    this._loop();

    this.busy = true;
    this._setFocus(this.player.position, 'pushin');
    await this.story.playIntro();
    this.busy = false;
    this.state = 'explore';
    this._lastChapter = 1;
    this.hud.setChapter(1, CHAPTER_NAMES[1]);
    this.hud.setParty(this.player.name, this.ally.name);
    this.hud.setObjective(this.story.objective());
    this._lock();
  }

  // ---------------------------------------------------------
  _loop() {
    if (!this.running) return;
    requestAnimationFrame(() => this._loop());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this._elapsed += dt;

    this.town.update(dt, this._elapsed);

    if (this.story.active && !this.director.active) {
      this.director.start(this._pendingFocus || this.player.position, this._pendingMode);
      this._pendingFocus = null;
    } else if (!this.story.active && this.director.active) {
      this.director.stop();
      this.player._camPos.copy(this.camera.position);
    }

    if (this.state === 'explore' && !this.busy && !this.story.active) {
      this._updateExplore(dt);
    } else {
      this.rae.update(dt, this.player);
      this.doc.update(dt, this.player);
      this.director.update(dt);
      this.hud.updateEnemyBars([]);
      this.input.consumeMouse();
    }

    this.hud.update(this.player, this._cdFractions(), { limit: this.limit, lock: this.combat.lockTarget });
    if (this.mobile) this.mobile.setAbilities(this.player.loadout);
    // Flash a title card when the chapter advances
    if (this.story.flags.chapter !== this._lastChapter) {
      this._lastChapter = this.story.flags.chapter;
      this.hud.setChapter(this._lastChapter, CHAPTER_NAMES[this._lastChapter] || '');
    }

    // Camera shake (Limit Break / big hits)
    if (this._shake > 0) {
      this._shake -= dt;
      const m = this._shake * 0.6;
      this.camera.position.x += (Math.random() - 0.5) * m;
      this.camera.position.y += (Math.random() - 0.5) * m;
      this.camera.position.z += (Math.random() - 0.5) * m;
    }

    this.input.endFrame();
    this.renderer.render(this.scene, this.camera);
  }

  _updateExplore(dt) {
    if (this.input.wasPressed('c')) { this._openMenu(); return; }

    for (const id in this.cooldowns) if (this.cooldowns[id] > 0) this.cooldowns[id] = Math.max(0, this.cooldowns[id] - dt);

    // Announce when the Limit is ready to fire
    if (this.limit >= 100 && !this._limitReady) { this._limitReady = true; this.hud.log('⚡ LIMIT READY — press R!', 'crit'); }
    if (this.limit < 100) this._limitReady = false;

    // Dash
    if (this.input.wasPressed('control') || this.input.wasPressed('q')) {
      if (this.player.dash(this.input)) this.hud.log('⟫ Dash', 'system');
    }
    // Lock-on toggle (right mouse)
    if (this.input.wasPressed('mouse2')) {
      if (this.combat.lockTarget) { this.combat.clearLock(); }
      else if (this.combat.acquireLock()) this.hud.log('🎯 Locked on', 'system');
    }
    // Limit Break
    if (this.input.wasPressed('r') && this.limit >= 100) { this.combat.unleashLimit(); this.limit = 0; }

    const frozen = this.player.rootTimer > 0;
    if (!frozen) {
      if (this.input.wasPressed('mouse0') || this.input.wasPressed(' ')) this._melee();
      for (let i = 0; i < QUICK_KEYS.length; i++) if (this.input.wasPressed(QUICK_KEYS[i])) this._cast(i);
    }

    // Swap controlled character
    if (this.input.wasPressed(';')) this._switchChar();

    this.player.update(dt, this.input);
    this.combat.update(dt);
    this.combat.validateLock();

    // Party companion: follow the leader + auto-attack
    this.ally.inCombat = this.combat.livingCount > 0;
    this.ally.updateFollow(dt, this.player.position);
    this.ally._allyCd -= dt;
    if (this.ally._allyCd <= 0 && this.combat.livingCount > 0) {
      if (this.combat.allyBolt(this.ally.position)) { this.ally._allyCd = 1.1; this.ally.triggerAttackAnim(); }
    }

    // Doc's stall — always open
    this.nearbyNPC = null;
    this.hud.setPrompt(null);
    this.rae.setInteractable(false);
    this.rae.update(dt, this.player);
    this.doc.setInteractable(true);
    if (this.doc.update(dt, this.player)) {
      this.nearbyNPC = this.doc;
      this.hud.setPrompt('Press E — trade with Doc');
    }
    if (this.nearbyNPC && this.input.wasPressed('e')) { this._interact(); return; }

    // Position-triggered story beats (each fires once as you advance)
    const z = this.player.position.z;
    const f = this.story.flags;
    const W = CONFIG.world;
    const beats = [
      [z <= 230 && !f.forestOmenShown, () => this.story.reachOmen()],                                   // Ch.1 omen
      [z <= W.forestMidZ && !f.forestMidShown, () => this.story.reachForestMid()],                       // Ch.2
      [z <= W.forestEndZ && !f.cityReached, () => this.story.reachCity()],                               // Ch.3
      [z <= -42 && f.cityReached && !f.cityMidShown, () => this.story.reachCityMid()],
      [z <= W.avenueZ && f.cityReached && !f.avenueReached, () => this.story.reachAvenue()],             // Ch.4
      [z <= -158 && f.avenueReached && !f.preBossShown, () => this.story.reachPreBoss()],
    ];
    for (const [cond, fn] of beats) {
      if (cond) { this._setFocus(this.player.position, 'orbit'); this._runCutscene(fn); return; }
    }

    // President Vance appears at the plaza (Chapter 4)
    if (this.story.canFightBoss() && this.player.position.distanceTo(this.town.bossPos) < 22) {
      this._triggerBoss();
      return;
    }

    this.hud.setObjective(this.story.objective());
  }

  // ---------------------------------------------------------
  _melee() {
    const lock = this.combat.lockTarget;
    if (lock && lock.alive) {
      const to = lock.position.clone().sub(this.player.position);
      this.player.facing = Math.atan2(to.x, to.z);
    } else if (this.input.moveX === 0 && this.input.moveZ === 0) {
      this.player.facing = this.player.camYaw + Math.PI;
    }
    this.combat.meleeAttack();
  }

  _cast(slot) {
    const id = this.player.loadout[slot];
    if (!id) return;
    const spell = SPELLS_BY_ID[id];
    if ((this.cooldowns[id] || 0) > 0) return;
    if (this.player.mana < spell.mpCost) { this.hud.log('ATB not charged.', 'system'); return; }

    this.player.mana -= spell.mpCost;
    this.cooldowns[id] = spell.cooldown || 0.6;
    this.player.triggerAttackAnim();

    if (spell.type === 'heal') {
      const amt = Math.round(spell.power + (10 + this.player.level * 2) * 0.3);
      const healed = this.player.heal(amt);
      this.hud.floatDamage(this.player.position, Math.round(healed), 'heal');
      this.hud.log(`${spell.icon} ${spell.name} restores ${Math.round(healed)} HP`, 'heal');
    } else {
      this.combat.castProjectile(spell);
    }
  }

  _cdFractions() {
    const out = {};
    for (const id in this.cooldowns) {
      const total = SPELLS_BY_ID[id]?.cooldown || 1;
      if (this.cooldowns[id] > 0) out[id] = this.cooldowns[id] / total;
    }
    return out;
  }

  // ---------------------------------------------------------
  /** Swap which party member you control; the other becomes the AI companion. */
  _switchChar() {
    const tmp = this.player; this.player = this.ally; this.ally = tmp;
    this.player.ai = false; this.ally.ai = true;
    this.combat.player = this.player;
    this.player._camPos.copy(this.camera.position);   // smooth camera hand-over
    this.hud.setParty(this.player.name, this.ally.name);
    this.hud.log(`↔ Now controlling ${this.player.name}`, 'crit');
  }

  _openMenu() { this.state = 'menu'; this._unlock(); this.hud.setPrompt(null); this.menu.open(this.player); }

  async _interact() {
    this.hud.setPrompt(null);
    if (this.nearbyNPC === this.doc) {
      this.state = 'menu';
      this._unlock();
      this.shop.open(this.player);
    }
  }

  async _triggerBoss() {
    this._setFocus(this.town.bossPos, 'orbit');
    this.combat.clearLock();
    await this._runCutscene(async () => {
      await this.story.spawnBoss();
      this.combat.spawnBoss(this.town.bossPos, 'frostqueen');   // 'frostqueen' def = President Vance
    });
  }

  async _runCutscene(fn) {
    if (this.busy) return;
    this.busy = true;
    this.state = 'cutscene';
    this._unlock();
    await fn();
    if (this.state !== 'gameover') {
      this.state = 'explore';
      this.busy = false;
      this.hud.setObjective(this.story.objective());
      this._lock();
    }
  }

  _gameOver() { this.state = 'gameover'; this.busy = false; this._unlock(); if (this.onGameOver) this.onGameOver(); }

  respawn() {
    this.player.respawn();
    this.player.health = this.player.maxHealth;
    this.player.mana = this.player.maxMana;
    this.state = 'explore';
    this.busy = false;
    this.hud.log('Rebooted from the last safe node.', 'system');
    this._lock();
  }

  _lock() { if (document.pointerLockElement !== this.canvas) this.canvas.requestPointerLock?.(); }
  _unlock() { document.exitPointerLock?.(); }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
