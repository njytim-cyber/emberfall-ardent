/* ============================================================
   MobileControls — Minecraft-style touch controls, built ONLY on
   touch devices. Left half = a floating joystick that springs up
   under your thumb; right half = swipe to look. A clean, flat action
   pad (attack / abilities / roll / lock / limit) sits bottom-right.
   Feeds the shared Input object exactly like keyboard/mouse do.
   ============================================================ */

import { SPELLS_BY_ID } from '../data/spells.js';

const JOY_RADIUS = 62;          // px travel from centre to full tilt
const JOY_HALF = 70;            // half the joystick base (140px) — for centring

export class MobileControls {
  constructor(input) {
    this.input = input;
    this._joyId = null;
    this._lookId = null;
    this._lookLast = null;
    this._abilitySig = '';
    this._build();
  }

  /** Show the equipped ability icons on the three ability buttons. */
  setAbilities(loadout) {
    const sig = loadout.join('|');
    if (sig === this._abilitySig) return;
    this._abilitySig = sig;
    ['a1', 'a2', 'a3'].forEach((cls, i) => {
      const btn = this.root.querySelector('.' + cls);
      if (!btn) return;
      const sp = loadout[i] ? SPELLS_BY_ID[loadout[i]] : null;
      btn.querySelector('.tb-ico').textContent = sp ? sp.icon : '·';
    });
  }

  _build() {
    const root = document.createElement('div');
    root.id = 'touch-controls';
    root.innerHTML = `
      <div id="move-zone"></div>
      <div id="look-zone"></div>
      <div id="joystick"><div class="joy-base"><div class="joy-knob"></div></div></div>
      <div id="action-pad">
        <div class="pad-row abilities">
          <button class="tbtn small a1" data-key=","><span class="tb-ico">✦</span><span class="tb-lbl">1</span></button>
          <button class="tbtn small a2" data-key="."><span class="tb-ico">✦</span><span class="tb-lbl">2</span></button>
          <button class="tbtn small a3" data-key="/"><span class="tb-ico">✦</span><span class="tb-lbl">3</span></button>
          <button class="tbtn small limit" data-key="r"><span class="tb-ico">💥</span></button>
        </div>
        <div class="pad-row main">
          <button class="tbtn med lock" data-key="mouse2"><span class="tb-ico">◎</span></button>
          <button class="tbtn med dash" data-key="q"><span class="tb-ico">🌀</span></button>
          <button class="tbtn big atk" data-key="mouse0"><span class="tb-ico">⚔️</span></button>
        </div>
      </div>
      <button id="touch-menu" class="tbtn small" data-key="c"><span class="tb-ico">☰</span></button>`;
    document.body.appendChild(root);
    this.root = root;

    this.joy = root.querySelector('#joystick');
    this.knob = root.querySelector('.joy-knob');
    this.moveZone = root.querySelector('#move-zone');
    this.look = root.querySelector('#look-zone');

    this._bindJoystick();
    this._bindLook();
    this._bindButtons(root);
  }

  _bindButtons(root) {
    root.querySelectorAll('[data-key]').forEach((btn) => {
      const key = btn.dataset.key;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        this.input.press(key);
        btn.classList.add('pressed');
      }, { passive: false });
      const up = (e) => { e.preventDefault(); btn.classList.remove('pressed'); };
      btn.addEventListener('touchend', up, { passive: false });
      btn.addEventListener('touchcancel', up, { passive: false });
    });
  }

  // --- Floating joystick: springs up wherever the left thumb lands ---
  _bindJoystick() {
    const drive = (x, y) => {
      let dx = x - this._joyCenter.x, dy = y - this._joyCenter.y;
      const d = Math.hypot(dx, dy);
      if (d > JOY_RADIUS) { dx *= JOY_RADIUS / d; dy *= JOY_RADIUS / d; }
      this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.input.touchAxis.x = dx / JOY_RADIUS;
      this.input.touchAxis.z = dy / JOY_RADIUS;   // up (negative y) = forward (negative z)
      this.input._touchSprint = d > JOY_RADIUS * 0.9;
    };

    const end = () => {
      this._joyId = null;
      this.joy.classList.remove('active');
      this.knob.style.transform = 'translate(0,0)';
      this.input.touchAxis.x = 0; this.input.touchAxis.z = 0;
      this.input._touchSprint = false;
    };
    this._joyEnd = end;

    this.moveZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this._joyId !== null) return;
      const t = e.changedTouches[0];
      this._joyId = t.identifier;
      this._joyCenter = { x: t.clientX, y: t.clientY };
      this._joyStart = { t: performance.now(), x: t.clientX, y: t.clientY };
      this._joyMoved = 0;
      // Spring the joystick up centred under the thumb
      this.joy.style.left = (t.clientX - JOY_HALF) + 'px';
      this.joy.style.top = (t.clientY - JOY_HALF) + 'px';
      this.joy.classList.add('active');
      drive(t.clientX, t.clientY);
    }, { passive: false });

    // Track move/end on the window so a drift outside the zone still counts
    window.addEventListener('touchmove', (e) => {
      if (this._joyId === null) return;
      for (const t of e.changedTouches) if (t.identifier === this._joyId) {
        e.preventDefault();
        this._joyMoved = Math.max(this._joyMoved, Math.hypot(t.clientX - this._joyStart.x, t.clientY - this._joyStart.y));
        drive(t.clientX, t.clientY);
      }
    }, { passive: false });

    const winEnd = (e) => {
      for (const t of e.changedTouches) if (t.identifier === this._joyId) {
        // A quick tap (no drag) toggles auto-run
        const quick = performance.now() - this._joyStart.t < 250;
        if (quick && this._joyMoved < 14) {
          this.input._runToggle = !this.input._runToggle;
          this.joy.classList.toggle('running', this.input._runToggle);
        }
        end();
      }
    };
    window.addEventListener('touchend', winEnd, { passive: false });
    window.addEventListener('touchcancel', winEnd, { passive: false });
  }

  // --- Right half: swipe to look ---
  _bindLook() {
    this.look.addEventListener('touchstart', (e) => {
      if (this._lookId !== null) return;
      const t = e.changedTouches[0];
      this._lookId = t.identifier;
      this._lookLast = { x: t.clientX, y: t.clientY };
    }, { passive: false });
    this.look.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier !== this._lookId) continue;
        const dx = t.clientX - this._lookLast.x, dy = t.clientY - this._lookLast.y;
        this._lookLast = { x: t.clientX, y: t.clientY };
        this.input.mouseDX += dx * 1.4;
        this.input.mouseDY += dy * 1.4;
      }
    }, { passive: false });
    const end = (e) => {
      for (const t of e.changedTouches) if (t.identifier === this._lookId) { this._lookId = null; this._lookLast = null; }
    };
    this.look.addEventListener('touchend', end, { passive: false });
    this.look.addEventListener('touchcancel', end, { passive: false });
  }
}
