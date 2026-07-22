/* ============================================================
   Director — drives the camera during cutscenes so scenes feel
   cinematic (like an in-engine FF cutscene): a slow orbit or a
   dolly push-in around a focus point, instead of a frozen shot.
   The Game runs this while a cutscene is playing.
   ============================================================ */

import * as THREE from 'three';

export class Director {
  constructor(camera) {
    this.camera = camera;
    this.active = false;
    this.t = 0;
    this.focus = new THREE.Vector3();
    this._look = new THREE.Vector3();
  }

  /** Begin a cinematic move around `focus` (Vector3-like). */
  start(focus, mode = 'orbit') {
    this.active = true;
    this.t = 0;
    this.mode = mode;
    this.focus.set(focus.x, focus.y || 0, focus.z);
    this.angle = Math.random() * Math.PI * 2;   // vary the framing each time
    this.dir = Math.random() < 0.5 ? 1 : -1;
  }

  stop() { this.active = false; }

  update(dt) {
    if (!this.active) return;
    this.t += dt;
    this._look.copy(this.focus).add(new THREE.Vector3(0, 1.5, 0));

    if (this.mode === 'pushin') {
      // Dolly slowly inward while drifting sideways — good for reveals/arrivals
      const r = THREE.MathUtils.lerp(20, 7.5, Math.min(1, this.t / 7));
      const h = THREE.MathUtils.lerp(9, 3.4, Math.min(1, this.t / 7));
      this.angle += dt * 0.05 * this.dir;
      this.camera.position.set(
        this._look.x + Math.sin(this.angle) * r,
        h,
        this._look.z + Math.cos(this.angle) * r
      );
    } else {
      // Steady orbit — good for boss stares and dialogue
      const r = 10, h = 5.5;
      this.angle += dt * 0.16 * this.dir;
      this.camera.position.set(
        this._look.x + Math.sin(this.angle) * r,
        h,
        this._look.z + Math.cos(this.angle) * r
      );
    }
    this.camera.lookAt(this._look);
  }
}
