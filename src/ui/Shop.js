/* ============================================================
   Shop — the merchant's wares. Consumables (Healing Potion, Ether)
   have a stock of 3; gear (Iron Sword, Iron Chestplate) a stock of
   1. When stock hits 0 the item shows SOLD OUT. Buying gear equips
   it (sword → +melee, chestplate → damage reduction).
   The first purchase fires onFirstPurchase (advances the quest).
   ============================================================ */

const ITEMS = [
  { id: 'potion',     name: 'Medkit',      icon: '🧪', price: 40,  stock: 3, desc: 'Restores HP in a pinch (+1 to your kit).' },
  { id: 'ether',      name: 'Energy Cell', icon: '🔋', price: 55,  stock: 3, desc: 'Restores EN in a pinch (+1 to your kit).' },
  { id: 'ironsword',  name: 'Iron Blade',  icon: '🗡️', price: 160, stock: 1, desc: '+10 melee damage. Monomolecular edge.' },
  { id: 'ironplate',  name: 'Combat Vest', icon: '🛡️', price: 220, stock: 1, desc: 'Reduces incoming damage by 35%.' },
];

export class Shop {
  constructor() {
    this._build();
    this.active = false;
    this.onClose = null;
    this.onFirstPurchase = null;
    this._boughtAnything = false;
    // fresh mutable stock
    this.stock = Object.fromEntries(ITEMS.map((it) => [it.id, it.stock]));

    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      if (e.key === 'Escape' || e.key.toLowerCase() === 'b') { e.preventDefault(); this.close(); }
    });
  }

  _build() {
    const root = document.createElement('div');
    root.id = 'shop';
    root.className = 'hidden';
    root.innerHTML = `
      <div class="shop-panel">
        <div class="shop-head">
          <h2>⚒ DOC — BLACK MARKET</h2>
          <span class="shop-gold">💳 <b class="shop-gold-n">0</b></span>
          <button class="shop-close">✕ Leave (B)</button>
        </div>
        <div class="shop-list"></div>
        <div class="shop-note">Medkits &amp; Energy Cells: 3 in stock each · Gear: 1 each. When stock runs out it's SOLD OUT.</div>
      </div>`;
    document.body.appendChild(root);
    this.root = root;
    this.listEl = root.querySelector('.shop-list');
    this.goldEl = root.querySelector('.shop-gold-n');
    root.querySelector('.shop-close').addEventListener('click', () => this.close());
  }

  open(player) {
    this.player = player;
    this.active = true;
    this.root.classList.remove('hidden');
    this._render();
  }

  close() {
    this.active = false;
    this.root.classList.add('hidden');
    if (this.onClose) this.onClose();
  }

  _render() {
    this.goldEl.textContent = this.player.inventory.gold;
    this.listEl.innerHTML = '';
    for (const item of ITEMS) {
      const left = this.stock[item.id];
      const owned = this._owns(item.id);
      const soldOut = left <= 0 || owned;
      const tooPoor = this.player.inventory.gold < item.price;

      const row = document.createElement('div');
      row.className = 'shop-item' + (soldOut ? ' soldout' : '');
      row.innerHTML = `
        <span class="shop-icon">${item.icon}</span>
        <span class="shop-body">
          <span class="shop-name">${item.name} ${owned ? '<em>(equipped)</em>' : ''}</span>
          <span class="shop-desc">${item.desc}</span>
        </span>
        <span class="shop-stock">${soldOut ? 'SOLD OUT' : `x${left}`}</span>
        <span class="shop-price">💳 ${item.price}</span>`;

      const btn = document.createElement('button');
      btn.className = 'shop-buy';
      if (soldOut) { btn.textContent = 'Sold out'; btn.disabled = true; }
      else if (tooPoor) { btn.textContent = 'Need gold'; btn.disabled = true; btn.classList.add('poor'); }
      else { btn.textContent = 'Buy'; btn.addEventListener('click', () => this._buy(item)); }
      row.appendChild(btn);
      this.listEl.appendChild(row);
    }
  }

  _owns(id) {
    const p = this.player;
    return (id === 'ironsword' && p.equipment.weapon === 'ironsword') ||
           (id === 'ironplate' && p.equipment.armor === 'ironplate');
  }

  _buy(item) {
    const p = this.player;
    if (p.inventory.gold < item.price || this.stock[item.id] <= 0) return;
    p.inventory.gold -= item.price;
    this.stock[item.id]--;

    if (item.id === 'potion') p.inventory.potions++;
    else if (item.id === 'ether') p.inventory.ethers++;
    else if (item.id === 'ironsword') { p.equipWeapon('ironsword', 10); this.stock[item.id] = 0; }
    else if (item.id === 'ironplate') { p.equipArmor('ironplate', 0.35); this.stock[item.id] = 0; }

    if (!this._boughtAnything) {
      this._boughtAnything = true;
      if (this.onFirstPurchase) this.onFirstPurchase();
    }
    this._render();
  }
}
