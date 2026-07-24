/* ============================================================
   Global game configuration & balance values.
   Tweak numbers here — no logic lives in this file.
   ============================================================ */

export const CONFIG = {
  // --- Player ---
  player: {
    maxHealth: 140,
    maxMana: 100,        // this is now the ATB gauge
    manaRegen: 16,       // ATB per second (fills the gauge fast)
    healthRegen: 1.5,    // health per second (slow)
    moveSpeed: 7,        // units per second
    sprintMultiplier: 1.7,
    turnSpeed: 3.2,
    meleeDamage: 26,     // hits harder — good for mashing
    meleeRange: 3.4,
    meleeCooldown: 0.32, // fast — spammable
    critChance: 0.18,
    critMultiplier: 2.0,
    radius: 0.5,
    eyeHeight: 1.7,
  },

  // --- Leveling ---
  leveling: {
    baseXP: 100,         // xp needed for level 2
    xpGrowth: 1.5,       // each level costs this much more
    healthPerLevel: 15,
    manaPerLevel: 10,
    damagePerLevel: 3,
  },

  // --- Enemies ---
  enemies: {
    spawnCount: 8,
    respawnDelay: 12,    // seconds until a slain enemy returns
    aggroRange: 14,
    leashRange: 30,      // gives up and returns home beyond this
  },

  // --- World: a long journey — deep forest → blighted edge → city → plaza ---
  world: {
    streetHalfWidth: 12,       // walkable half-width of the path/street
    plazaHalfWidth: 22,        // wider open area at the boss plaza
    startZ: 180,               // spawn: deep in the Emberwood (long forest)
    forestMidZ: 90,            // deep wood → blighted edge (chapter beat)
    forestEndZ: 4,             // the wood gives way to the city gate here
    endZ: -156,                // far end (behind the boss plaza)
    plazaZ: -150,              // where President Vance waits
    avenueZ: -60,              // deeper into the city (chapter beat)
    fogNear: 45,
    fogFar: 300,
  },

  // --- Camera (third person) ---
  camera: {
    distance: 6.5,
    height: 3.2,
    pitchMin: -0.6,
    pitchMax: 0.9,
    sensitivity: 0.0025,
    smooth: 0.12,
  },
};
