/* ============================================================
   MobileControls — on-screen touch controls, built ONLY on touch
   devices. Left thumb = movement joystick; right side = drag to
   look; buttons for attack, abilities, dash, lock-on and Limit.
   Feeds the shared Input object the same way keyboard/mouse do.
   ============================================================ */

import { SPELLS_BY_ID } from '../data/spells.js';

export class MobileControls {
  constructor(input) {
    this.input = input;
    this._build();
    this._joyId = null;
    this._lookId = null;
    this._lookLast = null;
    this._abilitySig = '';
  }

  /** Show the equipped ability icons on the three ability buttons. */
  setAbilities(loadout) {
    const sig = loadout.join('|');
    if (sig === this._abilitySig) return;
    this._abilitySig = sig;
    ['a1', 'a2', 'a3'].forEach((cls, i) => {
      const btn = this.root.querySelector('.' + cls);
      const sp = loadout[i] ? SPELLS_BY_ID[loadout[i]] : null;
      btn.querySelector('.tb-ico').textContent = sp ? sp.icon : '·';
    });
  }

  _build() {
    const root = document.createElement('div');
    root.id = 'touch-controls';
    root.innerHTML = `
      <div id="look-zone"></div>
      <div id="joystick"><div class="joy-base"><div class="joy-knob"></div></div></div>
      <div id="touch-buttons">
        <button class="tbtn atk" data-key="mouse0"><span class="tb-ico">⚔️</span></button>
        <button class="tbtn a1" data-key=","><span class="tb-ico">✦</span><span class="tb-lbl">1</span></button>
        <button class="tbtn a2" data-key="."><span class="tb-ico">✦</span><span class="tb-lbl">2</span></button>
        <button class="tbtn a3" data-key="/"><span class="tb-ico">✦</span><span class="tb-lbl">3</span></button>
        <button class="tbtn dash" data-key="q"><span class="tb-ico">🌀</span><span class="tb-lbl">ROLL</span></button>
        <button class="tbtn lock" data-key="mouse2"><span class="tb-ico">◎</span><span class="tb-lbl">LOCK</span></button>
        <button class="tbtn limit" data-key="r"><span class="tb-ico">💥</span><span class="tb-lbl">LIMIT</span></button>
      </div>
      <button id="touch-menu" class="tbtn" data-key="c"><span class="tb-ico">☰</span></button>`;
    document.body.appendChild(root);
    this.root = root;

    this.joy = root.querySelector('#joystick');
    this.knob = root.querySelector('.joy-knob');
    this.look = root.querySelector('#look-zone');

    this._bindJoystick();
    this._bindLook();
    this._bindButtons(root);
  }

  _bindButtons(root) {
    root.querySelectorAll('[data-key]').forEach((btn) => {
      const key = btn.dataset.key;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.input.press(key);
        btn.classList.add('pressed');
      }, { passive: false });
      btn.addEventListener('touchend', (e) => { e.preventDefault(); btn.classList.remove('pressed'); }, { passive: false });
    });
  }

  _bindJoystick() {
    const radius = 55;
    const center = () => { const r = this.joy.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

    const move = (t) => {
      const c = center();
      let dx = t.clientX - c.x, dy = t.clientY - c.y;
      const d = Math.hypot(dx, dy);
      if (d > radius) { dx *= radius / d; dy *= radius / d; }
      this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.input.touchAxis.x = dx / radius;
      this.input.touchAxis.z = dy / radius;   // up (negative y) = forward (negative z)
      this.input._touchSprint = d > radius * 0.92;
    };
    const end = () => {
      this._joyId = null;
      this.knob.style.transform = 'translate(0,0)';
      this.input.touchAxis.x = 0; this.input.touchAxis.z = 0;
      this.input._touchSprint = false;
    };

    this.joy.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      this._joyId = t.identifier;
      this._joyStart = { t: performance.now(), x: t.clientX, y: t.clientY };
      this._joyMoved = 0;
      move(t);
    }, { passive: false });
    this.joy.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) if (t.identifier === this._joyId) {
        this._joyMoved = Math.max(this._joyMoved, Math.hypot(t.clientX - this._joyStart.x, t.clientY - this._joyStart.y));
        move(t);
      }
    }, { passive: false });
    this.joy.addEventListener('touchend', (e) => {
      for (const t of e.changedTouches) if (t.identifier === this._joyId) {
        // A quick tap on the joystick toggles run (sprint)
        const quick = performance.now() - this._joyStart.t < 250;
        if (quick && this._joyMoved < 14) {
          this.input._runToggle = !this.input._runToggle;
          this.joy.classList.toggle('running', this.input._runToggle);
        }
        end();
      }
    }, { passive: false });
    this.joy.addEventListener('touchcancel', end, { passive: false });
  }

  _bindLook() {
    this.look.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      if (this._lookId !== null) return;
      this._lookId = t.identifier;
      this._lookLast = { x: t.clientX, y: t.clientY };
    }, { passive: false });
    this.look.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier !== this._lookId) continue;
        const dx = t.clientX - this._lookLast.x, dy = t.clientY - this._lookLast.y;
        this._lookLast = { x: t.clientX, y: t.clientY };
        // Feed the look delta straight into the mouse-look accumulator
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
