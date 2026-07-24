/* ============================================================
   Waves — FF-style group encounters down the long winding path.
   Each wave spawns when the hero reaches its trigger and the
   previous group is cleared; you're locked behind it until then.
   Deep wood → blighted edge → city → plaza. Longer chapters.
   ============================================================ */

export const WAVES = [
  // --- Chapter 1: the deep Emberwood ---
  { triggerZ: 272, z: 260, tag: 'forest', foes: ['thorn', 'wisp'] },
  { triggerZ: 238, z: 226, tag: 'forest', foes: ['ent', 'thorn'] },
  { triggerZ: 204, z: 192, tag: 'forest', foes: ['thorn', 'thorn', 'wisp'] },
  { triggerZ: 170, z: 158, tag: 'forest', foes: ['ent', 'ent', 'wisp'] },

  // --- Chapter 2: the blighted edge ---
  { triggerZ: 132, z: 120, tag: 'forest', foes: ['ent', 'wisp', 'wisp'] },
  { triggerZ: 98, z: 86, tag: 'forest', foes: ['ent', 'thorn', 'wisp'] },
  { triggerZ: 62, z: 50, tag: 'forest', foes: ['ent', 'ent', 'thorn'] },
  { triggerZ: 28, z: 16, tag: 'forest', foes: ['ent', 'ent', 'thorn', 'wisp', 'wisp'] },

  // --- Chapters 3–4: the city of Ardent ---
  { triggerZ: -18, z: -30, tag: 'city', foes: ['goblin', 'goblin', 'wolf'] },
  { triggerZ: -46, z: -58, tag: 'city', foes: ['skeleton', 'wraith', 'wolf'] },
  { triggerZ: -74, z: -86, tag: 'city', foes: ['revenant', 'iceshaman', 'goblin'] },
  { triggerZ: -102, z: -114, tag: 'city', foes: ['frostward', 'icegolem', 'wolf'] },
  { triggerZ: -130, z: -142, tag: 'city', foes: ['revenant', 'frostward', 'iceshaman', 'wolf'] },
  { triggerZ: -158, z: -170, tag: 'city', foes: ['icegolem', 'revenant', 'frostward', 'iceshaman', 'wolf'] },
];
