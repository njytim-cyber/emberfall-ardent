/* ============================================================
   Waves — FF-style group encounters down the path. Each wave is a
   group of foes that spawns when the hero reaches its trigger and
   the previous group is cleared. Forest groups first, then city.
     triggerZ : spawn once the player has advanced past this z
     z        : where the group forms up
     foes     : enemy type keys (from Enemy TYPES)
     tag      : 'forest' | 'city' (for flavor text / chapter logic)
   ============================================================ */

export const WAVES = [
  // --- The Emberwood ---
  { triggerZ: 78, z: 66, tag: 'forest', foes: ['ent', 'wisp'] },
  { triggerZ: 52, z: 40, tag: 'forest', foes: ['thorn', 'thorn', 'wisp'] },
  { triggerZ: 28, z: 16, tag: 'forest', foes: ['ent', 'thorn', 'wisp'] },
  { triggerZ: 10, z: -2, tag: 'forest', foes: ['ent', 'ent', 'wisp', 'wisp'] },

  // --- The City of Ardent ---
  { triggerZ: -16, z: -28, tag: 'city', foes: ['goblin', 'goblin', 'wolf'] },
  { triggerZ: -40, z: -52, tag: 'city', foes: ['skeleton', 'wraith', 'wolf'] },
  { triggerZ: -64, z: -76, tag: 'city', foes: ['revenant', 'iceshaman', 'goblin'] },
  { triggerZ: -88, z: -100, tag: 'city', foes: ['frostward', 'icegolem', 'wolf'] },
  { triggerZ: -112, z: -124, tag: 'city', foes: ['revenant', 'frostward', 'iceshaman', 'wolf'] },
];
