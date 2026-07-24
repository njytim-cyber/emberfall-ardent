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

  // --- World: a long WINDING journey — deep forest → edge → city → plaza ---
  world: {
    streetHalfWidth: 12,       // walkable half-width of the path/street
    plazaHalfWidth: 24,        // wider open area at the boss plaza
    startZ: 300,               // spawn: deep in the Emberwood (long forest)
    forestMidZ: 150,           // deep wood → blighted edge (chapter beat)
    forestEndZ: 4,             // the wood gives way to the city gate here
    endZ: -200,                // far end (behind the boss plaza)
    plazaZ: -192,              // where President Vance waits
    avenueZ: -70,              // deeper into the city (chapter beat)
    fogNear: 42,
    fogFar: 165,               // keeps the city hidden until you round the bends
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

/**
 * The winding centre-line of the path: how far (in x) the walkable corridor
 * has meandered at depth z. Everything (player bound, trees, buildings,
 * spawns, plaza) is placed relative to this so the road turns and twists.
 * Fades to ~0 near the plaza so the final arena is centred.
 */
export function pathCenterX(z) {
  const w = CONFIG.world;
  const taper = Math.max(0, Math.min(1, (z - w.plazaZ - 24) / 48));
  return (26 * Math.sin(z * 0.019) + 14 * Math.sin(z * 0.047 + 1.3)) * taper;
}
