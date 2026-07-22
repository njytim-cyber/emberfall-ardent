/* ============================================================
   HUD — the real-time overworld interface: HP/MP/XP bars, the
   equipped quick-cast loadout ( , . / ) with cooldown overlays, a
   nearest-enemy target panel, crosshair, quest tracker, prompts,
   and the floating message log / damage numbers.
   ============================================================ */

import * as THREE from 'three';
import { SPELLS_BY_ID } from '../data/spells.js';

const SLOT_KEYS = [',', '.', '/'];

export class HUD {
  constructor(camera) {
    this.camera = camera;
    this._proj = new THREE.Vector3();
    this._loadoutSig = '';

    this.el = {
      healthFill: document.getElementById('health-fill'),
      healthText: document.getElementById('health-text'),
      manaFill: document.getElementById('mana-fill'),
      manaText: document.getElementById('mana-text'),
      xpFill: document.getElementById('xp-fill'),
      levelText: document.getElementById('level-text'),
      spellBar: document.getElementById('spell-bar'),
      targetPanel: document.getElementById('target-panel'),
      targetName: document.getElementById('target-name'),
      targetHpFill: document.getElementById('target-hp-fill'),
      log: document.getElementById('message-log'),
      hud: document.getElementById('hud'),
    };

    this._buildExtras();
  }

  _buildExtras() {
    this.objectiveEl = document.createElement('div');
    this.objectiveEl.id = 'objective';
    this.objectiveEl.innerHTML = `<span class="obj-label">QUEST</span><span class="obj-text"></span>`;
    this.el.hud.appendChild(this.objectiveEl);
    this.objTextEl = this.objectiveEl.querySelector('.obj-text');

    this.promptEl = document.createElement('div');
    this.promptEl.id = 'interact-prompt';
    this.promptEl.classList.add('hidden');
    this.el.hud.appendChild(this.promptEl);

    // Layer for floating enemy health bars
    this.enemyBarLayer = document.createElement('div');
    this.enemyBarLayer.id = 'enemy-bars';
    this.el.hud.appendChild(this.enemyBarLayer);
    this._enemyBars = new Map();   // uid -> { el, name, fill }

    // Frozen indicator
    this.frozenEl = document.createElement('div');
    this.frozenEl.id = 'frozen-overlay';
    this.frozenEl.className = 'hidden';
    this.frozenEl.innerHTML = '<span>❄ FROZEN</span>';
    this.el.hud.appendChild(this.frozenEl);

    // Limit Break gauge
    this.limitWrap = document.createElement('div');
    this.limitWrap.id = 'limit-gauge';
    this.limitWrap.innerHTML = '<span class="lg-label">LIMIT</span><div class="lg-bar"><div class="lg-fill"></div></div><span class="lg-hint">R</span>';
    this.el.hud.appendChild(this.limitWrap);
    this.limitFill = this.limitWrap.querySelector('.lg-fill');

    // Lock-on reticle
    this.reticle = document.createElement('div');
    this.reticle.id = 'lock-reticle';
    this.reticle.className = 'hidden';
    this.reticle.innerHTML = '<span></span>';
    this.el.hud.appendChild(this.reticle);

    // Limit-break flash + banner overlay
    this.limitFx = document.createElement('div');
    this.limitFx.id = 'limit-fx';
    this.limitFx.className = 'hidden';
    this.limitFx.innerHTML = '<div class="lf-flash"></div><div class="lf-banner">LIMIT BREAK</div>';
    this.el.hud.appendChild(this.limitFx);
  }

  /** Full-screen flash + banner when the Limit Break fires. */
  limitFlash() {
    this.limitFx.classList.remove('hidden');
    // restart the CSS animation
    this.limitFx.classList.remove('go');
    void this.limitFx.offsetWidth;
    this.limitFx.classList.add('go');
    clearTimeout(this._limitTimer);
    this._limitTimer = setTimeout(() => this.limitFx.classList.add('hidden'), 1200);
  }

  show() { this.el.hud.classList.remove('hidden'); }
  hide() { this.el.hud.classList.add('hidden'); }

  update(player, cooldowns = {}, extra = {}) {
    const hp = player.health / player.maxHealth;
    this.el.healthFill.style.width = `${hp * 100}%`;
    this.el.healthText.textContent = `${Math.ceil(player.health)} / ${player.maxHealth}`;

    const mp = player.mana / player.maxMana;
    this.el.manaFill.style.width = `${mp * 100}%`;
    this.el.manaText.textContent = `${Math.floor(player.mana)} / ${player.maxMana}`;

    this.el.xpFill.style.width = `${(player.xp / player.xpToNext) * 100}%`;
    this.el.levelText.textContent = `Lv ${player.level}`;

    this._renderLoadout(player);

    // Limit gauge + lock-on reticle
    const limit = extra.limit || 0;
    this.limitFill.style.width = `${limit}%`;
    this.limitWrap.classList.toggle('full', limit >= 100);
    this.updateLock(extra.lock);

    // Frozen indicator
    this.frozenEl.classList.toggle('hidden', !(player.rootTimer > 0));

    // Per-frame cooldown overlays + affordability
    player.loadout.forEach((id, i) => {
      const slot = this.slots[i];
      if (!slot) return;
      const spell = id ? SPELLS_BY_ID[id] : null;
      const frac = id && cooldowns[id] ? cooldowns[id] : 0;
      slot.cd.style.height = `${frac * 100}%`;
      slot.root.classList.toggle('no-mana', !!spell && player.mana < spell.mpCost);
    });
  }

  _renderLoadout(player) {
    const sig = player.loadout.join('|');
    if (sig === this._loadoutSig) return;
    this._loadoutSig = sig;

    this.el.spellBar.innerHTML = '';
    this.slots = [];
    player.loadout.forEach((id, i) => {
      const spell = id ? SPELLS_BY_ID[id] : null;
      const slot = document.createElement('div');
      slot.className = 'spell-slot';
      slot.innerHTML = `
        <span class="key">${SLOT_KEYS[i]}</span>
        <span class="icon">${spell ? spell.icon : '·'}</span>
        <span class="cost">${spell ? spell.mpCost : ''}</span>
        <div class="cd-overlay"></div>`;
      slot.title = spell ? `${spell.name} — ${spell.description}` : 'Empty (press C to equip)';
      this.el.spellBar.appendChild(slot);
      this.slots.push({ root: slot, cd: slot.querySelector('.cd-overlay') });
    });
  }

  /** Position a targeting reticle over the locked enemy. */
  updateLock(target) {
    if (!target || !target.alive) { this.reticle.classList.add('hidden'); return; }
    this._proj.copy(target.position);
    this._proj.y += 1.3 * (target.type.scale || 1);
    this._proj.project(this.camera);
    if (this._proj.z > 1) { this.reticle.classList.add('hidden'); return; }
    this.reticle.classList.remove('hidden');
    this.reticle.style.left = `${(this._proj.x * 0.5 + 0.5) * window.innerWidth}px`;
    this.reticle.style.top = `${(-this._proj.y * 0.5 + 0.5) * window.innerHeight}px`;
  }

  setObjective(text) {
    if (!text) { this.objectiveEl.classList.add('hidden'); return; }
    this.objectiveEl.classList.remove('hidden');
    this.objTextEl.textContent = text;
  }

  setPrompt(text) {
    if (!text) { this.promptEl.classList.add('hidden'); return; }
    this.promptEl.classList.remove('hidden');
    this.promptEl.textContent = text;
  }

  /** Float a health bar above every nearby enemy (multiple at once). */
  updateEnemyBars(list) {
    const seen = new Set();
    for (const e of list) {
      seen.add(e.uid);
      this._proj.copy(e.position);
      this._proj.y += 2.1 * (e.type.scale || 1) + 0.5;
      this._proj.project(this.camera);

      let bar = this._enemyBars.get(e.uid);
      if (this._proj.z > 1) { if (bar) bar.el.style.display = 'none'; continue; }

      if (!bar) {
        const el = document.createElement('div');
        el.className = 'enemy-hpbar';
        el.innerHTML = `<span class="ehp-name"></span><div class="ehp-track"><div class="ehp-fill"></div></div>`;
        this.enemyBarLayer.appendChild(el);
        bar = { el, name: el.querySelector('.ehp-name'), fill: el.querySelector('.ehp-fill') };
        this._enemyBars.set(e.uid, bar);
      }
      bar.el.style.display = '';
      bar.el.style.left = `${(this._proj.x * 0.5 + 0.5) * window.innerWidth}px`;
      bar.el.style.top = `${(-this._proj.y * 0.5 + 0.5) * window.innerHeight}px`;
      bar.el.classList.toggle('boss', !!e.isBoss);
      bar.name.textContent = e.type.name;
      bar.fill.style.width = `${Math.max(0, (e.health / e.maxHealth) * 100)}%`;
    }
    // Remove bars for enemies no longer nearby / alive
    for (const [uid, bar] of this._enemyBars) {
      if (!seen.has(uid)) { bar.el.remove(); this._enemyBars.delete(uid); }
    }
  }

  flashLevelUp() {
    document.body.animate(
      [{ filter: 'brightness(1)' }, { filter: 'brightness(1.7)' }, { filter: 'brightness(1)' }],
      { duration: 500 }
    );
  }

  floatDamage(worldPos, amount, kind = 'enemy-hit') {
    this._proj.copy(worldPos);
    this._proj.y += 1.8;
    this._proj.project(this.camera);
    if (this._proj.z > 1) return;
    const x = (this._proj.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-this._proj.y * 0.5 + 0.5) * window.innerHeight;
    const div = document.createElement('div');
    div.className = `float-dmg ${kind}`;
    div.textContent = kind === 'heal' ? `+${amount}` : amount;
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;
    this.el.hud.appendChild(div);
    setTimeout(() => div.remove(), 1000);
  }

  log(text, cls = '') {
    const div = document.createElement('div');
    div.className = `log-msg ${cls}`;
    div.textContent = text;
    this.el.log.appendChild(div);
    while (this.el.log.children.length > 5) this.el.log.firstChild.remove();
    setTimeout(() => div.remove(), 2600);
  }

  toast(text) { this.log(text, 'system'); }
}
