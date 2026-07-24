/* ============================================================
   Story — the forest → city → plaza journey. Chapter beats fire as
   the hero advances (position triggers); the Game calls the reach*
   methods. New blade-arts unlock as the takedown count climbs.
   ============================================================ */

import { Cutscene } from './Cutscene.js';
import { SCENES } from '../data/story.js';
import { SPELLS_BY_ID } from '../data/spells.js';

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
      forestOmenShown: false,
      forestMidShown: false,
      cityReached: false,
      cityMidShown: false,
      avenueReached: false,
      preBossShown: false,
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
    if (f.complete) return 'Ardent & the Emberwood are free. (Free roam)';
    if (f.bossSpawned) return 'Ch.4 — Take down President Vance!';
    if (f.avenueReached) return 'Ch.3 · Reach the plaza and confront Vance.';
    if (f.cityReached) return `Ch.2 · Fight up Vance Avenue · takedowns: ${f.kills}`;
    if (f.introSeen) return `Ch.1 · Push through the Emberwood · takedowns: ${f.kills}`;
    return 'Wake, warden…';
  }

  onEnemyDefeated() {
    this.flags.kills++;
    for (const u of KILL_UNLOCKS) {
      if (this.flags.kills === u.at && this.player.learnSpell(u.id) && this.onSpellLearned) {
        this.onSpellLearned(SPELLS_BY_ID[u.id]);
      }
    }
  }

  // ---- Chapter 1: the Emberwood ----
  async reachOmen() { if (this.flags.forestOmenShown) return; this.flags.forestOmenShown = true; await this.play('forest_omen'); }
  async reachForestMid() { if (this.flags.forestMidShown) return; this.flags.forestMidShown = true; await this.play('forest_mid'); }

  // ---- Chapter 2: the city gate ----
  async reachCity() { if (this.flags.cityReached) return; this.flags.cityReached = true; this.flags.chapter = 2; await this.play('chapter2'); }
  async reachCityMid() { if (this.flags.cityMidShown) return; this.flags.cityMidShown = true; await this.play('city_mid'); }

  // ---- Chapter 3: the avenue ----
  async reachAvenue() { if (this.flags.avenueReached) return; this.flags.avenueReached = true; this.flags.chapter = 3; await this.play('chapter3'); }
  async reachPreBoss() { if (this.flags.preBossShown) return; this.flags.preBossShown = true; await this.play('pre_boss'); }

  // ---- Chapter 4: the plaza / boss ----
  canFightBoss() { return this.flags.avenueReached && !this.flags.bossSpawned && !this.flags.complete; }
  async spawnBoss() { await this.play('boss_appear'); this.flags.chapter = 4; this.flags.bossSpawned = true; }
  bossPhaseCallback = async () => { await this.play('boss_phase'); };

  async onBossDefeated() {
    this.flags.bossDefeated = true;
    if (this.player.learnSpell('ultima') && this.onSpellLearned) this.onSpellLearned(SPELLS_BY_ID['ultima']);
    await this.play('true_ending');
    this.flags.complete = true;
  }
}
