/* ============================================================
   Story script — EMBERFALL (long-form).

   The ancient EMBERWOOD is dying. HELIX and its President VANCE
   drain the forest's living heart to power Project SUNSET — a grid
   to control the city of Ardent. As the wood sickens, its guardians
   (ents, wisps) have gone feral. You are CADE, last warden of
   Emberfall: cut through the wood, breach the city, and end Vance.

   Beats fire as you advance; each chapter has several.
   line = { speaker, portrait, text, mood? }
   ============================================================ */

export const SCENES = {
  // ================= CHAPTER 1 — The Emberwood =================
  intro: [
    { speaker: 'Narrator', portrait: '🌲', text: 'The EMBERWOOD — a forest older than the city beside it, its trees lit from within by a soft, living glow. Wardens have kept it a thousand years.', mood: 'dark' },
    { speaker: 'Narrator', portrait: '🍂', text: 'Now that glow guts out, tree by tree. The wood runs a fever, and its gentle guardians thrash in delirium, striking at anything that moves.', mood: 'dark' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'Cade — you\'re awake. Thank the ember. The wood pulled you under when the sickness spiked three days ago. You\'ve been out cold in the roots.' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Three days? Rae, the trees are moving. The ents — they\'re coming right at me.', mood: 'hero' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'I know. And I know how that sounds coming from me, but you have to fight them. They\'re not themselves. They\'re in agony.' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'What did this? The wood hasn\'t so much as dropped a leaf out of turn in my whole life.', mood: 'hero' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'Helix. They ran a drain-line from the city into the Emberheart at the wood\'s core — siphoning its life straight into Vance\'s SUNSET grid.' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'Every tree that goes dark is life they\'ve stolen. The guardians feel it die and they lash out. It\'s not evil, Cade. It\'s grief.' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Then I end the grief at its source. I cut the line and I make Vance answer for it.', mood: 'hero' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'That\'s the warden I trained. The drain-line runs to the city plaza, dead ahead through the wood. I\'ll be on your ear the whole way. Move carefully — and quickly.' },
    { speaker: 'Narrator', portrait: '📻', text: 'CHAPTER 1 — THE EMBERWOOD', mood: 'dark' },
    { speaker: 'Narrator', portrait: '⚔️', text: 'OBJECTIVE: Push down the forest path. Groups of corrupted guardians block the way — clear each group to advance.', mood: 'dark' },
  ],

  forest_omen: [
    { speaker: '???', portrait: '🌟', text: '…warden…', mood: 'hero' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Who\'s there? Rae — tell me you heard that.', mood: 'hero' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'I heard it. That\'s not on any channel, Cade. That\'s the wood itself — the Emberheart, speaking through what\'s left of its strength.' },
    { speaker: '???', portrait: '🌟', text: '…you carry the old ember in you… the last of a line that swore to keep me… I feel you drawing near…', mood: 'hero' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'I\'m coming. Hold on. Whatever they\'ve done, I\'ll undo it.', mood: 'hero' },
    { speaker: '???', portrait: '🌟', text: '…hurry… when the last light goes out, I will not wake again… free me…', mood: 'hero' },
  ],

  forest_mid: [
    { speaker: 'Narrator', portrait: '📻', text: 'CHAPTER 2 — THE BLIGHTED EDGE', mood: 'dark' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'You\'re past the deep grove. Feel that? The air\'s colder — the sickness is thickest up ahead, closest to the drain.' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'The wisps are worse here. They used to lead travelers home. Now they burn.', mood: 'hero' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'The corruption drives them. Put them down gently as you can and keep pushing — the tree line ends just ahead. That\'s where the wood becomes their city.' },
  ],

  // The Blight Warden — climax of Chapter 2, guarding the forest's edge
  blight_appear: [
    { speaker: 'Narrator', portrait: '🌳', text: 'The ground heaves. The tree line itself tears loose — roots ripping free of the black soil — and rises into a towering thing of bark, thorn, and sickly green fire.', mood: 'dark' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'Cade, that\'s the Grovewarden — the eldest guardian of the whole Emberwood. It\'s stood at this boundary since before the city had a name.', mood: 'dark' },
    { speaker: 'The Blight Warden', portrait: '🌳', text: 'N O N E … P A S S … the heart bleeds… the light dies… and the small ones with blades only bring MORE ENDING…', mood: 'boss' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Old one — it\'s me. A warden. I\'m going to the source to STOP this. You know my line. You know why I\'m here.', mood: 'hero' },
    { speaker: 'The Blight Warden', portrait: '🌳', text: 'I know only the pain… the blight has eaten my name… if you are truly warden — then prove it, and put me DOWN.', mood: 'boss' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'It\'s too far gone to reason with, Cade. It\'s guarding the boundary out of grief. You\'ll have to break through it. Make it quick — make it clean.' },
  ],

  blight_defeat: [
    { speaker: 'The Blight Warden', portrait: '🍂', text: 'Ahh… the fire cools… I remember now. Grovewarden. That was… my name. Thank you, small one, for reaching where the rot had buried it.', mood: 'boss' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Rest, elder. I\'ll cut the drain and the wood will wake you again. I swear it on the line.', mood: 'hero' },
    { speaker: 'The Blight Warden', portrait: '🌱', text: 'Then go… the boundary is open… the city of steel lies beyond my last root. End the one who does this. Go, warden…', mood: 'boss' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'The eldest guardian just stood down for you. The forest still knows its own. The tree line ends ahead — that\'s the edge of Ardent. Push on.' },
  ],

  // ================= CHAPTER 2 — The City Gate =================
  chapter2: [
    { speaker: 'Narrator', portrait: '🏙️', text: 'The trees thin, then stop — cut to raw stumps. Beyond the last of the Emberwood rises a wall of steel and cold light: the edge of ARDENT.', mood: 'dark' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'They cut the old boundary trees. The ones that were here before the first brick of this city.', mood: 'hero' },
    { speaker: 'Nyx', portrait: '👩‍💻', text: 'Cade — Nyx here. Rae patched me in. I\'m already deep in Helix\'s network, and I\'ve got eyes on you. Which is to say: so do they. You just walked onto every camera they own.' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Let them watch. It\'ll save me the trouble of announcing myself. Where\'s the drain-line?', mood: 'hero' },
    { speaker: 'Nyx', portrait: '👩‍💻', text: 'Straight down Vance Avenue to the central plaza. That\'s where SUNSET runs, that\'s where the drain terminates, and that\'s where Vance holds court like it\'s a throne room.' },
    { speaker: 'Nyx', portrait: '👩‍💻', text: 'Bad news: the whole avenue is a Helix security gauntlet — grunts, recon drones, riot troopers, and worse the closer you get. Good news: I can thin their firewalls as you go.' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'The wood is counting on you, Cade. Every second we talk, another tree goes dark. Get through that city.' },
    { speaker: 'Narrator', portrait: '📻', text: 'CHAPTER 3 — THE SLUMS', mood: 'dark' },
  ],

  city_mid: [
    { speaker: 'Nyx', portrait: '👩‍💻', text: 'Halfway up the avenue. Their security AI just re-tagged you from "intruder" to "priority threat." Congratulations, I think.' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'The lights up ahead — that green in the sky. That\'s the wood\'s light, isn\'t it.', mood: 'hero' },
    { speaker: 'Nyx', portrait: '👩‍💻', text: 'Yeah. That column over the plaza is the SUNSET conduit. Every bit of it was alive an hour ago. Keep going — it gets uglier from here.' },
  ],

  // ================= CHAPTER 3 — Vance Avenue =================
  chapter3: [
    { speaker: 'Narrator', portrait: '📻', text: 'CHAPTER 4 — THE INNER CITY', mood: 'dark' },
    { speaker: 'President Vance', portrait: '👔', text: 'So the forest sent a champion. How quaint. I\'ve watched you carve through my androids on forty cameras, warden. You have my attention.', mood: 'boss' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Cut the drain-line, Vance. Give the wood back its heart, and I\'ll walk out of your city.', mood: 'hero' },
    { speaker: 'President Vance', portrait: '👔', text: 'That "heart" is the cleanest, cheapest, most reliable power this city has ever had. Do you know what light cost the people of Ardent before me? Everything.', mood: 'boss' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'And now it costs a thousand years of forest. That\'s not a bargain. That\'s a theft you dressed up as progress.', mood: 'hero' },
    { speaker: 'President Vance', portrait: '👔', text: 'Spoken like someone who\'s never had to keep the lights on for millions. Come to the plaza, warden. I\'ll educate you personally.', mood: 'boss' },
    { speaker: 'Nyx', portrait: '👩‍💻', text: 'He\'s waiting at the plaza, Cade. Clear the last of his elite guard and it\'s just you and him. I\'ll have the drain-line schematics ready when you get there.' },
  ],

  pre_boss: [
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'The plaza\'s just ahead. Cade — before you go in. Whatever he says up there, remember why you came. Not for revenge. For the wood.' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'I remember. It talked to me, Rae. It\'s still in there, still holding on. I\'m not letting it go dark.', mood: 'hero' },
    { speaker: '???', portrait: '🌟', text: '…so close now, warden… I can feel your ember at the gates… end it…', mood: 'hero' },
  ],

  // ================= CHAPTER 4 — The Plaza =================
  boss_appear: [
    { speaker: 'Narrator', portrait: '🌆', text: 'THE PLAZA. At its center a pillar of stolen green light pours up out of the ground into the SUNSET grid — the Emberheart\'s life, bleeding into the sky.', mood: 'dark' },
    { speaker: 'President Vance', portrait: '👔', text: 'Beautiful, isn\'t it? A whole forest, refined into pure, obedient power. No rot. No waste. No sentiment.', mood: 'boss' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'You\'re bleeding something ancient to death to charge a battery, and you call the WOOD wasteful.', mood: 'hero' },
    { speaker: 'President Vance', portrait: '👔', text: 'I\'m killing nothing. I\'m making it USEFUL — something your precious order never managed in a thousand years of standing around in the trees.', mood: 'boss' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'We kept it ALIVE. That was the point. That was always the point.', mood: 'hero' },
    { speaker: 'Narrator', portrait: '⚡', text: 'Vance sets down his tablet and rolls his cuffs. Twin blades of hard light ignite from his sleeves — Helix executive-protection, the priciest bodyguard money can buy, worn like a watch.', mood: 'dark' },
    { speaker: 'President Vance', portrait: '👔', text: 'CHAPTER 5 — I built this city with these hands, warden. I will not be unmade by a gardener with a sword. Come. Let me show you what real power costs.', mood: 'boss' },
  ],

  boss_phase: [{ speaker: 'President Vance', portrait: '👔', text: 'You think this HURTS me? EMP surge — freeze where you stand, and watch your precious wood go dark for good!', mood: 'boss' }],

  enter_tower: [
    { speaker: 'Narrator', portrait: '🏢', text: 'The command-tower doors seal behind you. A cold lobby of glass and steel rises floor upon floor toward the top.', mood: 'dark' },
    { speaker: 'Nyx', portrait: '👩‍💻', text: 'I\'ve spoofed the internal locks, Cade — the escalators are live. But every floor between you and Vance is a kill-box. Fight up. I\'ll keep the lifts running.' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Then it\'s a long way up. Clear a floor, ride the escalator, repeat. Let\'s go.', mood: 'hero' },
    { speaker: 'Narrator', portrait: '⬆️', text: 'OBJECTIVE: Clear each floor, then step onto the escalator to climb to the next.', mood: 'dark' },
  ],

  controller_appear: [
    { speaker: 'Narrator', portrait: '🟣', text: 'The escalator opens onto a dim floor. A tall figure waits in the dark, unmoving — and behind its eyes, a hundred screens flicker.', mood: 'dark' },
    { speaker: 'The Unit Controller', portrait: '🕴️', text: 'Warden. I have watched you through every camera, every drone, every unit you\'ve destroyed. I AM those units. Every one you killed… I felt.', mood: 'boss' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Then you already know how this ends.', mood: 'hero' },
    { speaker: 'The Unit Controller', portrait: '🕴️', text: 'I know how it ends for a man who thinks he fights an army of machines… and never noticed the ONE mind behind them all. Let me correct you.', mood: 'boss' },
  ],

  controller_defeat: [
    { speaker: 'The Unit Controller', portrait: '💠', text: 'Impossible… I was the perfect operator… every unit, one will…', mood: 'boss' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'That was the flaw. Cut off the head, the whole net goes dark. Vance is next.', mood: 'hero' },
    { speaker: 'Nyx', portrait: '👩‍💻', text: 'Cade — the second that thing dropped, half of Helix\'s security just went offline. The top floor\'s wide open. Vance is up there. Alone.' },
  ],

  vance_top: [
    { speaker: 'Narrator', portrait: '🌆', text: 'THE TOP FLOOR. Glass on every side, the whole grey city spread out below. At the centre, a throne of screens — and the pillar of stolen green light punching up through the floor into the sky.', mood: 'dark' },
    { speaker: 'President Vance', portrait: '👔', text: 'You climbed my whole tower. Killed my Controller. All for a patch of trees. I almost admire it. Almost.', mood: 'boss' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Shut down SUNSET, Vance. Give the wood back its heart.', mood: 'hero' },
    { speaker: 'President Vance', portrait: '👔', text: 'It IS the heart now. Mine. And I don\'t give back what I\'ve earned.', mood: 'boss' },
    { speaker: 'Narrator', portrait: '⚡', text: 'Vance sets down his tablet and rolls his cuffs. Twin blades of hard light ignite from his sleeves.', mood: 'dark' },
    { speaker: 'President Vance', portrait: '👔', text: 'Come, warden. Let me show you what real power costs.', mood: 'boss' },
  ],

  boss_flee: [
    { speaker: 'President Vance', portrait: '👔', text: 'Enough. Enough! This is— this is a ROUT. Security! Get me to the roof, get me the lift, get me—', mood: 'boss' },
    { speaker: 'Narrator', portrait: '🏃', text: 'His blades sputter out. Vance turns on his heel and bolts for a waiting executive lift.', mood: 'dark' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'Oh no you don\'t.', mood: 'hero' },
    { speaker: 'Narrator', portrait: '⚔️', text: 'Cade rips the blade from his back in a single motion and closes the distance in a heartbeat.', mood: 'dark' },
  ],

  true_ending: [
    { speaker: 'President Vance', portrait: '💥', text: 'No… the grid… the city needs… ME. Without me they\'re back in the DARK…', mood: 'boss' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'No, Vance. They just needed you gone. There was always another way to keep the lights on. You just never looked for it.', mood: 'hero' },
    { speaker: 'Narrator', portrait: '💠', text: 'The exosuit goes dark. Cade drives a blade into the conduit and severs the drain-line — and the pillar of stolen light reverses, pouring back down into the earth, racing home through the roots.', mood: 'dark' },
    { speaker: '???', portrait: '🌟', text: '…warmth… oh, warmth again… thank you, warden. The Emberwood remembers those who keep it. It will remember you longest of all.', mood: 'hero' },
    { speaker: 'Nyx', portrait: '👩‍💻', text: 'Cade — every screen in Ardent just went black, then lit up green. The city\'s running on the wood\'s light now… but freely given this time, not torn out.' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'You saved them both — the forest and the city that grew up beside it. There hasn\'t been a warden like you in ten generations.' },
    { speaker: 'Rae', portrait: '🧑‍🚀', text: 'Come home, Cade. There\'s a whole wood waking up that wants to thank you in person. And it\'s glowing again — really glowing.' },
    { speaker: 'Cade (You)', portrait: '🕶️', text: 'On my way. Leave a light on for me — a real one.', mood: 'hero' },
    { speaker: 'Narrator', portrait: '🏆', text: 'THE END — Thank you for playing EMBERFALL. (Foes still stir along the path if you want to keep training.)', mood: 'dark' },
  ],
};
