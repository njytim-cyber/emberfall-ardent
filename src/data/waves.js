/* ============================================================
   Waves — group encounters as you spiral inward. Each spawns when
   you reach it and the previous group is cleared; you're locked
   behind it until then. Forest → slums → inner city → plaza.
   ("z" = radial distance from the centre; smaller = closer in.)
   ============================================================ */

export const WAVES = [
  // --- Forest (outer rings) ---
  { triggerZ: 272, z: 258, tag: 'forest', foes: ['thorn', 'wisp'] },
  { triggerZ: 236, z: 224, tag: 'forest', foes: ['ent', 'thorn'] },
  { triggerZ: 200, z: 188, tag: 'forest', foes: ['thorn', 'thorn', 'wisp'] },
  { triggerZ: 164, z: 152, tag: 'forest', foes: ['ent', 'ent', 'wisp'] },
  { triggerZ: 128, z: 116, tag: 'forest', foes: ['ent', 'wisp', 'wisp'] },
  { triggerZ: 92, z: 80, tag: 'forest', foes: ['ent', 'thorn', 'ent', 'wisp'] },

  // --- Slums / inner city (ring around the plaza) ---
  { triggerZ: 62, z: 54, tag: 'city', foes: ['goblin', 'goblin', 'wolf'] },
  { triggerZ: 48, z: 40, tag: 'city', foes: ['skeleton', 'wraith', 'wolf'] },
  { triggerZ: 36, z: 28, tag: 'city', foes: ['revenant', 'iceshaman', 'goblin'] },
  { triggerZ: 26, z: 18, tag: 'city', foes: ['frostward', 'icegolem', 'wolf'] },
  { triggerZ: 16, z: 11, tag: 'city', foes: ['revenant', 'frostward', 'iceshaman', 'wolf'] },
];
