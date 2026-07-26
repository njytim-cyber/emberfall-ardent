/* ============================================================
   Waves — group encounters as you spiral inward. Each spawns when
   you reach it and the previous group is cleared; you're locked
   behind it until then. Forest → slums → inner city → plaza.
   ("z" = radial distance from the centre; smaller = closer in.)
   ============================================================ */

export const WAVES = [
  // --- Chapter 1: THE DEEP WOOD (outer rings, z 300 → 170) ---
  { triggerZ: 282, z: 268, tag: 'forest', foes: ['thorn', 'wisp'] },
  { triggerZ: 258, z: 244, tag: 'forest', foes: ['thorn', 'thorn'] },
  { triggerZ: 234, z: 220, tag: 'forest', foes: ['ent', 'thorn', 'wisp'] },
  { triggerZ: 210, z: 196, tag: 'forest', foes: ['thorn', 'wisp', 'wisp'] },
  { triggerZ: 186, z: 172, tag: 'forest', foes: ['ent', 'ent', 'thorn'] },

  // --- Chapter 2: THE BLIGHTED EDGE (inner forest, z 170 → 66) ---
  { triggerZ: 164, z: 152, tag: 'forest', foes: ['ent', 'thorn', 'wisp'] },
  { triggerZ: 142, z: 130, tag: 'forest', foes: ['ent', 'ent', 'wisp'] },
  { triggerZ: 120, z: 108, tag: 'forest', foes: ['thorn', 'thorn', 'ent', 'wisp'] },
  { triggerZ: 100, z: 88, tag: 'forest', foes: ['ent', 'wisp', 'wisp', 'thorn'] },
  { triggerZ: 84, z: 74, tag: 'forest', foes: ['ent', 'thorn', 'ent', 'wisp'] },

  // --- Slums / inner city (ring around the plaza) ---
  { triggerZ: 62, z: 54, tag: 'city', foes: ['goblin', 'goblin', 'wolf'] },
  { triggerZ: 48, z: 40, tag: 'city', foes: ['skeleton', 'wraith', 'wolf'] },
  { triggerZ: 36, z: 28, tag: 'city', foes: ['revenant', 'iceshaman', 'goblin'] },
  { triggerZ: 26, z: 18, tag: 'city', foes: ['frostward', 'icegolem', 'wolf'] },
  { triggerZ: 16, z: 11, tag: 'city', foes: ['revenant', 'frostward', 'iceshaman', 'wolf'] },
];
