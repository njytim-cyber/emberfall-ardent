/* ============================================================
   Story — one linear mission: fight down the avenue of Ardent to
   the plaza, then take down President Vance (the only boss).
   New tech abilities unlock as you rack up takedowns.
   ============================================================ */

import { Cutscene } from './Cutscene.js';
import { SCENES } from '../data/story.js';
import { SPELLS_BY_ID } from '../data/spells.js';

// Abilities acquired as the takedown count climbs
const KILL_UNLOCKS = [
  { at: 2, id: 'thunder' },
  { at: 4, id: 'drain' },
  { at: 6, id: 'meteor' },
  { at: 9, id: 'cure2' },
  { at: 12, id: 'blizzard' },
  { at: 15, id: 'holy' },
];

export class Story {
  constructor(player) {
    this.player = player;
    this.cutscene = new Cutscene();
    this.onSpellLearned = null;

    this.flags = {
      introSeen: false,
      chapter: 1,
      kills: 0,
      chapter2Shown: false,
      chapter3Shown: false,
      bossSpawned: false,
      bossDefeated: false,
      complete: false,
    };
  }

  get active() { return this.cutscene.active; }

  async play(sceneKey) {
    const scene = SCENES[sceneKey];
    if (scene) await this.cutscene.play(scene);
  }

  async playIntro() { await this.play('intro'); this.flags.introSeen = true; }

  objective() {
    const f = this.flags;
    if (f.complete) return 'Ardent is free. (Free roam)';
    if (f.bossSpawned) return 'Ch.3 — Take down President Vance!';
    if (f.chapter === 3) return `Ch.3 · Push to the plaza — takedowns: ${f.kills}`;
    if (f.chapter === 2) return `Ch.2 · Fight up the avenue — takedowns: ${f.kills}/11`;
    if (f.introSeen) return `Ch.1 · Break the checkpoint — takedowns: ${f.kills}/5`;
    return 'Meet Rae to begin (the "!").';
  }

  /**
   * Every takedown: count it, hand out tech, and advance chapters.
   * Returns a cutscene key to play (chapter transition) or null.
   */
  onEnemyDefeated() {
    this.flags.kills++;
    for (const u of KILL_UNLOCKS) {
      if (this.flags.kills === u.at && this.player.learnSpell(u.id) && this.onSpellLearned) {
        this.onSpellLearned(SPELLS_BY_ID[u.id]);
      }
    }
    if (this.flags.kills >= 5 && !this.flags.chapter2Shown) {
      this.flags.chapter2Shown = true; this.flags.chapter = 2; return 'chapter2';
    }
    if (this.flags.kills >= 11 && !this.flags.chapter3Shown) {
      this.flags.chapter3Shown = true; this.flags.chapter = 3; return 'chapter3';
    }
    return null;
  }

  // ---- The lone boss: President Vance at the plaza (Chapter 3 only) ----
  canFightBoss() { return this.flags.chapter === 3 && !this.flags.bossSpawned && !this.flags.complete; }

  async spawnBoss() { await this.play('boss_appear'); this.flags.bossSpawned = true; }
  bossPhaseCallback = async () => { await this.play('boss_phase'); };

  async onBossDefeated() {
    this.flags.bossDefeated = true;
    if (this.player.learnSpell('ultima') && this.onSpellLearned) this.onSpellLearned(SPELLS_BY_ID['ultima']);
    await this.play('true_ending');
    this.flags.complete = true;
  }
}
