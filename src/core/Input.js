/* ============================================================
   Input — keyboard state + pointer-lock mouse look.
   Exposes a simple polling API the rest of the game reads each frame.
   ============================================================ */

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.locked = false;
    this.touchAxis = { x: 0, z: 0 };   // set by MobileControls
    this._touchSprint = false;
    this._runToggle = false;           // toggled by tapping the joystick
    this.lookSens = parseFloat(localStorage.getItem('emberfall_sens')) || 1;

    // one-shot buffers (consumed by systems, then cleared each frame)
    this.pressed = new Set();
    this._justCastKeys = [];

    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (!this.keys.has(k)) this.pressed.add(k);
      this.keys.add(k);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));

    this.canvas.addEventListener('click', () => {
      if (!this.locked) this.canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.canvas;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
    });

    document.addEventListener('mousedown', (e) => {
      if (!this.locked) return;
      if (e.button === 0) this.pressed.add('mouse0');
      if (e.button === 2) this.pressed.add('mouse2');
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  isDown(key) { return this.keys.has(key); }
  wasPressed(key) { return this.pressed.has(key); }

  // Movement axes relative to camera facing (keyboard, else touch joystick)
  get moveX() {
    const k = (this.isDown('d') ? 1 : 0) - (this.isDown('a') ? 1 : 0);
    return k !== 0 ? k : (this.touchAxis ? this.touchAxis.x : 0);
  }
  get moveZ() {
    const k = (this.isDown('s') ? 1 : 0) - (this.isDown('w') ? 1 : 0);
    return k !== 0 ? k : (this.touchAxis ? this.touchAxis.z : 0);
  }
  get sprinting() { return this.isDown('shift') || this._touchSprint || this._runToggle; }

  /** Called by mobile controls to simulate a key press for one frame. */
  press(key) { this.pressed.add(key); }

  // Consume accumulated mouse delta for this frame
  consumeMouse() {
    const dx = this.mouseDX, dy = this.mouseDY;
    this.mouseDX = 0;
    this.mouseDY = 0;
    return { dx, dy };
  }

  // Clear one-shot state — call at the END of each frame
  endFrame() {
    this.pressed.clear();
  }
}
