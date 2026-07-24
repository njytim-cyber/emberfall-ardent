/* ============================================================
   Abilities — Cade's combat tech, cast in real time with , . /.
   (Still called "spells" internally so the engine is unchanged;
   only the presentation is sci-fi.) Costs Energy (EN).

   Fields:
     type     : 'magic' (offensive projectile) | 'heal' | 'drain'
     target   : 'enemy' | 'self'
     power    : base magnitude (scaled by the caster's tech stat)
     mpCost   : energy cost
     cooldown : seconds before it can fire again
     speed    : projectile travel speed (offensive only)
     splash   : area-of-effect radius on impact (0 = single target)
     element  : damage type (used for enemy absorption)
     startsLearned / unlock : how Cade acquires it
   ============================================================ */

export const SPELLS = [
  // ---- Starting blade arts (equipped to , . / by default) ----
  { id: 'fireball',  name: 'Braver', icon: '🗡️', type: 'magic', target: 'enemy', power: 60, mpCost: 25, cooldown: 1.1, speed: 30, splash: 2.6, element: 'fire', anim: 'leap', startsLearned: true,
    description: 'A leaping overhead sword slash that cleaves the ground.' },
  { id: 'frostbolt', name: 'Cryo Edge', icon: '❄️', type: 'magic', target: 'enemy', power: 40, mpCost: 15, cooldown: 0.55, speed: 32, splash: 0, slow: 0.55, slowDuration: 3, element: 'ice', startsLearned: true,
    description: 'A chilling blade wave that slows. (Cryo units absorb it!)' },
  { id: 'renew',     name: 'Recovery', icon: '✚', type: 'heal', target: 'self', power: 60, mpCost: 30, cooldown: 3.5, element: 'holy', startsLearned: true,
    description: 'Field medicine — mend your wounds.' },

  // ---- Acquired blade arts ----
  { id: 'thunder',   name: 'Cross-Slash', icon: '⚡', type: 'magic', target: 'enemy', power: 80, mpCost: 30, cooldown: 1.0, speed: 44, splash: 1.8, element: 'thunder', unlock: 'kill2',
    description: 'A crackling cross-shaped slash that arcs into foes.' },
  { id: 'drain',     name: 'Siphon Strike', icon: '🩸', type: 'drain', target: 'enemy', power: 60, mpCost: 28, cooldown: 1.2, speed: 24, splash: 0, element: 'dark', unlock: 'kill4',
    description: 'A cursed edge that steals the life of what it cuts.' },
  { id: 'meteor',    name: 'Blade Beam', icon: '💥', type: 'magic', target: 'enemy', power: 130, mpCost: 45, cooldown: 1.7, speed: 24, splash: 4.0, element: 'fire', unlock: 'kill6',
    description: 'A massive energy wave loosed from your blade.' },
  { id: 'cure2',     name: 'Full Cure', icon: '➕', type: 'heal', target: 'self', power: 130, mpCost: 45, cooldown: 5, element: 'holy', unlock: 'kill9',
    description: 'Channel a surge of vitality — a big instant heal.' },
  { id: 'blizzard',  name: 'Frost Cyclone', icon: '🌀', type: 'magic', target: 'enemy', power: 110, mpCost: 40, cooldown: 1.5, speed: 22, splash: 3.4, element: 'ice', unlock: 'kill12',
    description: 'A spinning storm of ice blades. (Cryo units absorb it!)' },
  { id: 'holy',      name: 'Lightbringer', icon: '🔆', type: 'magic', target: 'enemy', power: 120, mpCost: 50, cooldown: 2.2, speed: 40, splash: 2.6, element: 'holy', unlock: 'kill15',
    description: 'A searing beam of holy light that cleaves armor.' },
  { id: 'ultima',    name: 'Omnislash', icon: '⚔️', type: 'magic', target: 'enemy', power: 280, mpCost: 80, cooldown: 2.5, speed: 30, splash: 5.0, element: 'dark', unlock: 'bossDefeated',
    description: 'An unstoppable flurry of blade energy — the ultimate art.' },
];

export const SPELLS_BY_ID = Object.fromEntries(SPELLS.map((s) => [s.id, s]));
export const STARTING_SPELLS = SPELLS.filter((s) => s.startsLearned).map((s) => s.id);

export const SPELL_UNLOCKS = SPELLS.reduce((acc, s) => {
  if (s.unlock) (acc[s.unlock] ||= []).push(s.id);
  return acc;
}, {});

// Damage-type colours — CSS strings for UI, hex numbers for three.js
export const ELEMENT_COLOR = {
  fire: '#ff6b3d', ice: '#5ac8ff', holy: '#7bff9b',
  thunder: '#ffe14a', dark: '#b06bff', physical: '#e8e0d0',
};
export const ELEMENT_HEX = {
  fire: 0xff5a1e, ice: 0x5ac8ff, holy: 0x7bff9b,
  thunder: 0xffe14a, dark: 0xb06bff, physical: 0xffffff,
};
