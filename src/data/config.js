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
    healthRegen: 0.5,    // 3 HP every 6 seconds — a trickle, so you're not immortal
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

  // --- World: a CIRCLE. Plaza tower at the centre, city ringed around it,
  //     forest surrounding that. You spiral inward along a winding spoke.
  //     "z" is the radial distance from the centre (300 = outer forest, 6 = plaza).
  world: {
    streetHalfWidth: 9,        // half-width of the inward spoke path
    plazaHalfWidth: 26,        // open plaza at the centre
    startZ: 300,               // spawn: outer edge of the Emberwood
    forestMidZ: 170,           // deep wood → blighted edge (chapter beat)
    forestEndZ: 66,            // forest gives way to the city ring here
    slumsZ: 40,                // the slums (chapter beat)
    avenueZ: 22,               // inner city, approaching the plaza
    plazaZ: 6,                 // the central plaza / tower
    endZ: 0,                   // dead centre
    cityInnerR: 26,            // inner radius of the city ring
    cityOuterR: 60,            // outer radius of the city ring
    fogNear: 40,
    fogFar: 150,               // keeps the centre hidden until you spiral in
    // The command-tower interior, built far offset so it never overlaps the map
    interior: { x: 1000, z: 0, roomHalf: 19, floorHeight: 12, floors: 4 },
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
  // Sharper, more frequent bends so the trail visibly turns and twists
  return (34 * Math.sin(z * 0.032) + 20 * Math.sin(z * 0.013 + 1.0)) * taper;
}
