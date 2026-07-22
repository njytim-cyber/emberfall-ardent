/* ============================================================
   Menu — the pause screen (press C). Two jobs:
     1) Spellbook: assign learned spells to the , . / quick-cast
        slots used in battle & the overworld.
     2) Inventory: view items, gold, and level.
   Click a slot ( , . / ) to select it, then click a spell to equip.
   ============================================================ */

import { SPELLS_BY_ID, ELEMENT_COLOR } from '../data/spells.js';

const SLOT_KEYS = [',', '.', '/'];

export class Menu {
  constructor() {
    this._build();
    this.active = false;
    this.selectedSlot = 0;
    this.onClose = null;
    // C or Esc closes the menu while it's open
    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      if (e.key.toLowerCase() === 'c' || e.key === 'Escape') { e.preventDefault(); this.close(); }
    });
  }

  _build() {
    const root = document.createElement('div');
    root.id = 'game-menu';
    root.className = 'hidden';
    root.innerHTML = `
      <div class="menu-panel">
        <div class="menu-head">
          <h2>ABILITIES &amp; GEAR</h2>
          <button class="menu-close">✕ Close (C)</button>
        </div>
        <div class="menu-cols">
          <div class="menu-col spells-col">
            <h3>Ability Slots <small>(fire with , . / )</small></h3>
            <div class="loadout-row"></div>
            <h3>Tech Abilities <small>click to equip into the selected slot</small></h3>
            <div class="spellbook"></div>
          </div>
          <div class="menu-col inv-col">
            <h3>Gear</h3>
            <div class="inv-list"></div>
            <h3>Operative</h3>
            <div class="hero-info"></div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(root);
    this.root = root;
    this.loadoutRow = root.querySelector('.loadout-row');
    this.spellbookEl = root.querySelector('.spellbook');
    this.invList = root.querySelector('.inv-list');
    this.heroInfo = root.querySelector('.hero-info');
    root.querySelector('.menu-close').addEventListener('click', () => this.close());
  }

  toggle(player) { this.active ? this.close() : this.open(player); }

  open(player) {
    this.player = player;
    this.active = true;
    this.selectedSlot = 0;
    this.root.classList.remove('hidden');
    this._render();
  }

  close() {
    this.active = false;
    this.root.classList.add('hidden');
    if (this.onClose) this.onClose();
  }

  _render() {
    this._renderLoadout();
    this._renderSpellbook();
    this._renderInventory();
  }

  _renderLoadout() {
    this.loadoutRow.innerHTML = '';
    this.player.loadout.forEach((id, slot) => {
      const spell = id ? SPELLS_BY_ID[id] : null;
      const div = document.createElement('div');
      div.className = 'loadout-slot' + (slot === this.selectedSlot ? ' selected' : '');
      div.innerHTML = `
        <span class="lo-key">${SLOT_KEYS[slot]}</span>
        <span class="lo-icon">${spell ? spell.icon : '—'}</span>
        <span class="lo-name">${spell ? spell.name : 'Empty'}</span>`;
      div.addEventListener('click', () => { this.selectedSlot = slot; this._render(); });
      this.loadoutRow.appendChild(div);
    });
  }

  _renderSpellbook() {
    this.spellbookEl.innerHTML = '';
    this.player.learnedSpells.forEach((id) => {
      const spell = SPELLS_BY_ID[id];
      const equippedSlot = this.player.loadout.indexOf(id);
      const col = ELEMENT_COLOR[spell.element] || '#e8e0d0';
      const div = document.createElement('div');
      div.className = 'spell-entry' + (equippedSlot !== -1 ? ' equipped' : '');
      div.innerHTML = `
        <span class="se-icon" style="text-shadow:0 0 8px ${col}">${spell.icon}</span>
        <span class="se-body">
          <span class="se-name">${spell.name}${equippedSlot !== -1 ? ` <em>[${SLOT_KEYS[equippedSlot]}]</em>` : ''}</span>
          <span class="se-desc">${spell.description}</span>
        </span>
        <span class="se-cost">${spell.mpCost} MP</span>`;
      div.addEventListener('click', () => {
        this.player.equipSpell(this.selectedSlot, id);
        // auto-advance selection to the next slot for quick setup
        this.selectedSlot = (this.selectedSlot + 1) % 3;
        this._render();
      });
      this.spellbookEl.appendChild(div);
    });

    // A "clear slot" affordance
    const clear = document.createElement('div');
    clear.className = 'spell-entry clear';
    clear.innerHTML = `<span class="se-icon">🚫</span><span class="se-body"><span class="se-name">Clear selected slot</span></span>`;
    clear.addEventListener('click', () => { this.player.equipSpell(this.selectedSlot, null); this._render(); });
    this.spellbookEl.appendChild(clear);
  }

  _renderInventory() {
    const inv = this.player.inventory;
    const eq = this.player.equipment;
    this.invList.innerHTML = `
      <div class="inv-item"><span>🧪 Medkit</span><span>x${inv.potions}</span></div>
      <div class="inv-item"><span>🔋 Energy Cell</span><span>x${inv.ethers}</span></div>
      <div class="inv-item gold"><span>💳 Credits</span><span>${inv.gold}</span></div>
      <div class="inv-item"><span>🗡️ Weapon</span><span>${eq.weapon === 'ironsword' ? 'Iron Blade' : 'Standard'}</span></div>
      <div class="inv-item"><span>🛡️ Armor</span><span>${eq.armor === 'ironplate' ? 'Combat Vest' : 'None'}</span></div>`;
    this.heroInfo.innerHTML = `
      <div class="inv-item"><span>Level</span><span>${this.player.level}</span></div>
      <div class="inv-item"><span>HP</span><span>${Math.ceil(this.player.health)}/${this.player.maxHealth}</span></div>
      <div class="inv-item"><span>EN</span><span>${Math.floor(this.player.mana)}/${this.player.maxMana}</span></div>
      <div class="inv-item"><span>Abilities</span><span>${this.player.learnedSpells.length}</span></div>`;
  }
}
