/* ============================================================
   main.js — entry point / application shell.
   Handles the loading screen, start menu, death/respawn flow, and
   boots the Game once the player chooses to begin.
   ============================================================ */

import { Game } from './core/Game.js';

const $ = (id) => document.getElementById(id);

const loadingScreen = $('loading-screen');
const startMenu = $('start-menu');
const deathScreen = $('death-screen');
const loaderFill = document.querySelector('.loader-fill');

let game = null;

// --- Fake asset warm-up so the loader feels alive (world builds fast) ---
function runLoader() {
  let pct = 0;
  const steps = [
    'Booting the city…',
    'Rendering Ardent…',
    'Lighting the neon…',
    'Deploying Helix security…',
    'Loading your ability rig…',
  ];
  const text = document.querySelector('.loader-text');
  const timer = setInterval(() => {
    pct = Math.min(100, pct + 8 + Math.random() * 14);
    loaderFill.style.width = `${pct}%`;
    text.textContent = steps[Math.min(steps.length - 1, Math.floor(pct / 20))];
    if (pct >= 100) {
      clearInterval(timer);
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
        startMenu.classList.remove('hidden');
      }, 300);
    }
  }, 220);
}

function beginGame() {
  startMenu.classList.add('hidden');
  deathScreen.classList.add('hidden');

  if (!game) {
    game = new Game($('game-canvas'));
    game.onGameOver = () => {
      setTimeout(() => deathScreen.classList.remove('hidden'), 600);
    };
    // Game.start() plays the intro cutscene, then grabs the mouse itself.
    game.start();
  }
}

function respawn() {
  deathScreen.classList.add('hidden');
  game.respawn();
}

// --- Wire up UI ---
$('start-btn').addEventListener('click', beginGame);
$('respawn-btn').addEventListener('click', respawn);

// Boot
window.addEventListener('load', runLoader);
