/* ============================================================
   Story script — EMBERFALL: a 3-chapter cyberpunk story.

   The megacorp HELIX rules the city of ARDENT through its
   President, VANCE — metering the air, water, and power of
   millions. The resistance cell EMBERFALL fights to bring it
   down. You are CADE, an Emberfall operative.

     Chapter 1 — The Undercity : hit a Helix checkpoint
     Chapter 2 — Vance Spire   : infiltrate, then escape lockdown
     Chapter 3 — The Summit    : kill President Vance

   Scene keys are reused by the Story manager; only the content
   changes. line = { speaker, portrait, text, mood? }
   ============================================================ */

export const SCENES = {
  // ================= CHAPTER 1 — The Undercity =================
  intro: [
    { speaker: 'Narrator', portrait: '🏙️', text: 'ARDENT, high noon. A city of a hundred million, every breath of it metered by one corporation: HELIX.', mood: 'dark' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'Cade — comms check. President Vance is about to flip Project SUNSET live: a grid that turns every citizen into a controllable node.' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Then he doesn\'t get to finish. Where is he?', mood: 'hero' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'Helix HQ — straight down Vance Avenue. The whole street\'s a gauntlet of security between you and the man himself. I\'ll be on your ear the whole way.' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'Fight your way to the plaza and end this, Cade. Doc\'s got a stall on the strip if you need gear.' },
    { speaker: 'Narrator', portrait: '📻', text: 'CHAPTER 1 — THE CHECKPOINT', mood: 'dark' },
    { speaker: 'Narrator', portrait: '⚔️', text: 'OBJECTIVE: Fight down Vance Avenue to the plaza. Move into an enemy to engage.', mood: 'dark' },
  ],

  quest_start: [
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'That checkpoint is crawling with Helix security — grunts, recon drones, riot troopers.' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'Take down THREE of their units and their squad captain will come running.' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Three down, then the captain. On it.', mood: 'hero' },
    { speaker: 'Narrator', portrait: '⚔️', text: 'OBJECTIVE: Take down 3 Helix security units. Move into an enemy to engage.', mood: 'dark' },
  ],

  progress_1: [{ speaker: 'Rae', portrait: '🧑‍🚀', text: 'One squad down! Helix is rerouting patrols. Keep the pressure on.' }],
  progress_2: [{ speaker: 'Rae', portrait: '🧑‍🚀', text: 'Two down! Their captain\'s breaking cover — I can see him on the cams.' }],

  boss_appear: [
    { speaker: 'Narrator', portrait: '🌆', text: 'The plaza. Vance stands before Helix HQ, his SUNSET grid pulsing overhead — and as you approach, his desk folds away.', mood: 'dark' },
    { speaker: 'President Vance', portrait: '👔', text: 'The famous Emberfall operative. You\'ve cut through my whole avenue. Impressive. Pointless — but impressive.', mood: 'boss' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Shut down SUNSET, Vance. Now. Or I do it the loud way.', mood: 'hero' },
    { speaker: 'President Vance', portrait: '👔', text: 'SUNSET is ORDER, boy.', mood: 'boss' },
    { speaker: 'Narrator', portrait: '🦿', text: 'Servos scream as an executive combat exosuit seals around him — Helix\'s last, best weapon.', mood: 'dark' },
    { speaker: 'President Vance', portrait: '👔', text: 'I built this city. I will not be unmade by a rat in a mask. Come — let me show you real power.', mood: 'boss' },
  ],

  boss_phase: [{ speaker: 'President Vance', portrait: '👔', text: 'You think this HURTS me? EMP surge — freeze, and watch your city burn!', mood: 'boss' }],

  // ---- Chapter 2: mid-avenue ----
  chapter2: [
    { speaker: 'Narrator', portrait: '📻', text: 'CHAPTER 2 — THE ASCENT', mood: 'dark' },
    { speaker: 'Nyx', portrait: '👩‍💻', text: 'Cade, it\'s Nyx — I\'m patched into your comms now. You just tripped Helix\'s inner cordon. They\'re rerouting every unit on the block to you.' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'And Vance started the SUNSET countdown the second you hit the street. You\'ve got minutes, not hours. Keep pushing.' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Then I stop walking and start running. Watch my back, both of you.', mood: 'hero' },
    { speaker: 'Nyx', portrait: '👩‍💻', text: 'Heads up — combat androids and cryo units ahead. The cryo ones drink cold tech; don\'t hand them a Cryo Edge.' },
  ],

  // ---- Chapter 3: the final stretch ----
  chapter3: [
    { speaker: 'Narrator', portrait: '📻', text: 'CHAPTER 3 — THE PLAZA', mood: 'dark' },
    { speaker: 'President Vance', portrait: '👔', text: 'So the little ember made it to my doorstep. I\'ve watched you cut through my whole avenue on forty cameras.', mood: 'boss' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Then you know I\'m not stopping. Shut SUNSET down, Vance.', mood: 'hero' },
    { speaker: 'President Vance', portrait: '👔', text: 'Come to the plaza and make me. My elite guard will be… a formality. And then you and I will have words.', mood: 'boss' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'That\'s the last stretch, Cade. Clear his guard and Vance is all that\'s left. End this.' },
  ],

  gorbash_defeat: [
    { speaker: 'Riot Captain Brand', portrait: '💥', text: 'Impossible… you\'re just… one operative…', mood: 'boss' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Emberfall\'s never just one. Rae — the road?', mood: 'hero' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'Open. But listen — SUNSET goes live from inside Vance Spire itself. If you can reach the tower, you can stop it at the source.' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'Head for the Spire district. My best hacker, Nyx, will meet you on comms there. Go, Cade.' },
    { speaker: 'Narrator', portrait: '🧭', text: 'CHAPTER 2 — Travel the road to Vance Spire.', mood: 'dark' },
  ],

  // ================= CHAPTER 2 — Vance Spire =================
  arrive_duskhaven: [
    { speaker: 'Narrator', portrait: '🏢', text: 'VANCE SPIRE claws a mile into the smog, its lower floors a fortress of blue security light.', mood: 'dark' },
    { speaker: 'Nyx', portrait: '👩‍💻', text: 'Cade, Nyx here. I\'m already in their network. The lift to the executive floors is locked behind a security cordon.' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'So I make some noise and you slip through the gap?', mood: 'hero' },
    { speaker: 'Nyx', portrait: '👩‍💻', text: 'Exactly. Thin out their androids and the cordon drops. Ping me when you\'re ready to start the run.' },
  ],

  quest2_start: [
    { speaker: 'Nyx', portrait: '👩‍💻', text: 'The lobby\'s guarded by combat androids, stealth units, and heavy enforcers. Nasty.' },
    { speaker: 'Nyx', portrait: '👩‍💻', text: 'Scrap FOUR of them and the security cordon collapses — then their lift-guardian wakes up.' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Four androids, then whatever\'s guarding the lift. Copy.', mood: 'hero' },
    { speaker: 'Narrator', portrait: '⚔️', text: 'OBJECTIVE: Destroy 4 Helix androids in the Spire lobby.', mood: 'dark' },
  ],

  progress_c1: [{ speaker: 'Nyx', portrait: '👩‍💻', text: 'One down — cordon weakening. I\'m peeling their firewall as you go.' }],
  progress_c2: [{ speaker: 'Nyx', portrait: '👩‍💻', text: 'Halfway. Their security AI just flagged you as a "priority threat." Congrats.' }],
  progress_c3: [{ speaker: 'Nyx', portrait: '👩‍💻', text: 'One more android and the cordon is OPEN.' }],

  boss2_appear: [
    { speaker: 'Narrator', portrait: '🦾', text: 'The floor splits. A Hunter-Class Mech unfolds from the lift shaft, targeting lasers sweeping red across the lobby.', mood: 'dark' },
    { speaker: 'Nyx', portrait: '👩‍💻', text: 'That\'s a HUNTER, Cade — Helix\'s flagship war-frame. Do NOT let it corner you.' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Big machine. Big weak spots. Let\'s find them.', mood: 'hero' },
  ],

  boss2_phase: [{ speaker: 'Hunter-Class Mech', portrait: '🦾', text: 'THREAT ESCALATION. WEAPONS FREE. PURGE INITIATED.', mood: 'boss' }],

  malketh_defeat: [
    { speaker: 'Hunter-Class Mech', portrait: '💥', text: 'CORE… BREACH… LOCKDOWN… ENGAGED…', mood: 'boss' },
    { speaker: 'Nyx', portrait: '👩‍💻', text: 'Cade — the Hunter tripped a full lockdown! Blast doors are dropping across the whole district. You have to MOVE.', mood: 'dark' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Get me a way up to Vance!', mood: 'hero' },
    { speaker: 'Nyx', portrait: '👩‍💻', text: 'Working it — the maintenance lift to the Summit is one district over. But you\'re hurt. There\'s a fixer nearby who owes Emberfall a favor.' },
    { speaker: 'Doc', portrait: '🧑‍🔧', text: 'Name\'s Doc. Nyx says you\'re good for it. Grab what you need off my rack, kid — the Summit doesn\'t forgive.' },
    { speaker: 'Narrator', portrait: '🛒', text: 'OBJECTIVE: Buy any item from Doc (the "$") before the ascent.', mood: 'dark' },
  ],

  shop_bought: [
    { speaker: 'Doc', portrait: '🧑‍🔧', text: 'Good pick. Now get out of my shop before the lockdown finds it. The Summit lift is open — go end this.' },
    { speaker: 'Narrator', portrait: '🧭', text: 'CHAPTER 3 — Ascend to the Summit and reach President Vance.', mood: 'dark' },
  ],

  // ================= CHAPTER 3 — The Summit =================
  arrive_frosthold: [
    { speaker: 'Narrator', portrait: '🌆', text: 'THE SUMMIT. Above the smog at last — glass, gold, and silence. And at its center, a throne of screens.', mood: 'dark' },
    { speaker: 'President Vance', portrait: '👔', text: 'The famous Emberfall operative. You\'ve cost me a checkpoint, a Hunter, and a very expensive evening. Impressive. Pointless, but impressive.', mood: 'boss' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Shut down SUNSET, Vance. Now. Or I do it the loud way.', mood: 'hero' },
    { speaker: 'President Vance', portrait: '👔', text: 'SUNSET is mercy, boy — order for a city that would eat itself without me. My guard will show you the door. The high one.', mood: 'boss' },
    { speaker: 'Narrator', portrait: '⚔️', text: 'OBJECTIVE: Wipe out 4 of Vance\'s elite guard to reach him.', mood: 'dark' },
  ],

  progress_f1: [{ speaker: 'President Vance', portrait: '👔', text: 'You dent my guard and think you\'ve won something. Charming.', mood: 'boss' }],
  progress_f2: [{ speaker: 'President Vance', portrait: '👔', text: 'Do you know what I\'ve spent keeping this city ALIVE? More than you\'ll ever be worth.', mood: 'boss' }],
  progress_f3: [{ speaker: 'President Vance', portrait: '👔', text: 'One guard left. Fine. If you want it done properly, I\'ll do it myself.', mood: 'boss' }],

  boss3_appear: [
    { speaker: 'Narrator', portrait: '🦿', text: 'Vance\'s desk folds away. Servos scream as an executive combat exosuit seals around him — Helix\'s last, best weapon.', mood: 'dark' },
    { speaker: 'President Vance', portrait: '👔', text: 'I built this city. I will not be unmade by a rat in a mask. Come — let me show you real power.', mood: 'boss' },
    { speaker: 'Narrator', portrait: '⚔️', text: 'Bring down President Vance. End Helix\'s reign.', mood: 'dark' },
  ],

  boss3_phase: [{ speaker: 'President Vance', portrait: '👔', text: 'You think this HURTS me? EMP surge — freeze, and watch your city burn!', mood: 'boss' }],

  true_ending: [
    { speaker: 'President Vance', portrait: '💥', text: 'No… I AM Helix… without me… the city… falls…', mood: 'boss' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'No, Vance. Without you, it finally stands.', mood: 'hero' },
    { speaker: 'Narrator', portrait: '🌇', text: 'The exosuit goes dark. Across Ardent, SUNSET flickers and dies — and for the first time in a lifetime, the grid answers to no one.', mood: 'dark' },
    { speaker: 'Nyx', portrait: '👩‍💻', text: 'It\'s done, Cade. Every screen in the city just went black, then… lit up with our sign. Emberfall\'s.' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'You gave a hundred million people their air back tonight. Come home, operative. There\'s a whole city to rebuild — and it\'s ours now.' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'On my way. Leave a light on.', mood: 'hero' },
    { speaker: 'Narrator', portrait: '🏆', text: 'THE END — Thank you for playing EMBERFALL. (The city\'s still dangerous; foes respawn if you want to keep fighting.)', mood: 'dark' },
  ],
};

// Thresholds before each chapter boss appears
export const MARAUDERS_TO_DEFEAT = 3;
export const CORRUPTED_TO_DEFEAT = 4;
export const FROZEN_TO_DEFEAT = 4;
