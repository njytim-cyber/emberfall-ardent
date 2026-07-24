/* ============================================================
   Waves — FF-style group encounters down the long path. Each wave
   is a group that spawns when the hero reaches its trigger and the
   previous group is cleared. You are locked behind the group until
   it's cleared. Deep wood → blighted edge → city → plaza.
   ============================================================ */

export const WAVES = [
  // --- Chapter 1: the deep Emberwood ---
  { triggerZ: 158, z: 146, tag: 'forest', foes: ['thorn', 'wisp'] },
  { triggerZ: 136, z: 124, tag: 'forest', foes: ['ent', 'thorn'] },
  { triggerZ: 114, z: 102, tag: 'forest', foes: ['thorn', 'thorn', 'wisp'] },

  // --- Chapter 2: the blighted edge ---
  { triggerZ: 80, z: 68, tag: 'forest', foes: ['ent', 'wisp', 'wisp'] },
  { triggerZ: 56, z: 44, tag: 'forest', foes: ['ent', 'thorn', 'wisp'] },
  { triggerZ: 32, z: 20, tag: 'forest', foes: ['ent', 'ent', 'wisp'] },
  { triggerZ: 12, z: 0, tag: 'forest', foes: ['ent', 'ent', 'thorn', 'wisp', 'wisp'] },

  // --- Chapters 3–4: the city of Ardent ---
  { triggerZ: -16, z: -28, tag: 'city', foes: ['goblin', 'goblin', 'wolf'] },
  { triggerZ: -40, z: -52, tag: 'city', foes: ['skeleton', 'wraith', 'wolf'] },
  { triggerZ: -64, z: -76, tag: 'city', foes: ['revenant', 'iceshaman', 'goblin'] },
  { triggerZ: -88, z: -100, tag: 'city', foes: ['frostward', 'icegolem', 'wolf'] },
  { triggerZ: -112, z: -124, tag: 'city', foes: ['revenant', 'frostward', 'iceshaman', 'wolf'] },
];
