/* ============================================================
   Interior — the inside of the Helix command tower. A vertical
   stack of floor rooms joined by escalators. You fight up floor by
   floor: guards → the Unit Controller (2nd boss) → President Vance
   on the top floor. Built once, far offset from the outdoor world.
   ============================================================ */

import * as THREE from 'three';
import { CONFIG } from '../data/config.js';

const I = CONFIG.world.interior;

export class Interior {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.visible = false;             // only shown once you enter
    scene.add(this.group);
    this.built = false;
  }

  /** Floor Y for floor index i. */
  floorY(i) { return i * I.floorHeight; }

  /** Where you arrive on floor i (near the entry / bottom of its escalator). */
  spawnOn(i) { return new THREE.Vector3(I.x, this.floorY(i), I.z + I.roomHalf - 4); }

  /** Where the boss stands on a boss floor. */
  bossOn(i) { return new THREE.Vector3(I.x, this.floorY(i), I.z - I.roomHalf + 5); }

  /** The zone (x within, z near far wall) that rides the escalator up from floor i. */
  escalatorZone(i) { return { x: I.x, z: I.z - I.roomHalf + 2, y: this.floorY(i) }; }

  build() {
    if (this.built) return; this.built = true;
    for (let i = 0; i < I.floors; i++) this._buildFloor(i);
  }

  _mat(color, opts = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.7, metalness: opts.metalness ?? 0.3, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 1 });
  }

  _buildFloor(i) {
    const y = this.floorY(i);
    const rh = I.roomHalf;
    const isTop = i === I.floors - 1;

    // Floor slab
    const floor = new THREE.Mesh(new THREE.BoxGeometry(rh * 2, 0.6, rh * 2),
      this._mat(i === I.floors - 1 ? 0x3a3242 : 0x2b2f38, { roughness: 0.6, metalness: 0.4 }));
    floor.position.set(I.x, y - 0.3, I.z); floor.receiveShadow = true; this.group.add(floor);

    // Ceiling (skip on top floor — open sky-lobby)
    if (!isTop) {
      const ceil = new THREE.Mesh(new THREE.BoxGeometry(rh * 2, 0.4, rh * 2), this._mat(0x1c2028));
      ceil.position.set(I.x, y + I.floorHeight - 0.2, I.z); this.group.add(ceil);
    }

    // Walls with big glowing windows
    const wallMat = this._mat(0x242830, { roughness: 0.5, metalness: 0.5 });
    const glass = this._mat(0x0a1420, { emissive: 0x2f6fae, emissiveIntensity: 0.5, roughness: 0.2, metalness: 0.6 });
    const wallH = I.floorHeight;
    const walls = [
      [I.x, y + wallH / 2, I.z + rh, rh * 2, 0.6],   // far (+z)
      [I.x, y + wallH / 2, I.z - rh, rh * 2, 0.6],   // near (-z)
      [I.x + rh, y + wallH / 2, I.z, 0.6, rh * 2],   // +x
      [I.x - rh, y + wallH / 2, I.z, 0.6, rh * 2],   // -x
    ];
    walls.forEach(([x, wy, z, w, d], k) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), wallMat);
      wall.position.set(x, wy, z); wall.castShadow = wall.receiveShadow = true; this.group.add(wall);
      // window band
      const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, wallH * 0.5, d * 0.85 || 0.2), glass);
      if (d < 1) win.geometry = new THREE.BoxGeometry(0.2, wallH * 0.5, d * 0.85);
      win.position.set(x, y + wallH * 0.55, z); this.group.add(win);
    });

    // Ceiling lights
    const light = new THREE.PointLight(0xcfe0ff, 6, rh * 2.4, 2);
    light.position.set(I.x, y + wallH - 1.5, I.z); this.group.add(light);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 3), this._mat(0x111, { emissive: 0xdfebff, emissiveIntensity: 1.4 }));
    lamp.position.set(I.x, y + wallH - 0.6, I.z); this.group.add(lamp);

    // Helix desk / floor marker
    const desk = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 1.6), this._mat(0x3a3f4a, { metalness: 0.5 }));
    desk.position.set(I.x + rh - 4, y + 0.5, I.z + rh - 4); this.group.add(desk);

    // Floor number sign
    const sign = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 0.2), this._mat(0x111, { emissive: 0x66ccff, emissiveIntensity: 1.6 }));
    sign.position.set(I.x, y + 3, I.z - rh + 0.4); this.group.add(sign);

    // Escalator up to the next floor (a ramp against the near wall)
    if (i < I.floors - 1) {
      const rampLen = Math.hypot(I.floorHeight, 6);
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, rampLen),
        this._mat(0x44484f, { metalness: 0.6, roughness: 0.4 }));
      ramp.position.set(I.x, y + I.floorHeight / 2, I.z - rh + 3);
      ramp.rotation.x = -Math.atan2(I.floorHeight, 6);
      this.group.add(ramp);
      // moving-step glow strips
      for (let s = 0; s < 6; s++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(4, 0.12, 0.4), this._mat(0x111, { emissive: 0x66ccff, emissiveIntensity: 1.2 }));
        step.position.set(I.x, y + (s / 6) * I.floorHeight, I.z - rh + 5.4 - (s / 6) * 6);
        this.group.add(step);
      }
      // handrails
      for (const sx of [-2.2, 2.2]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, rampLen), this._mat(0x22262c, { metalness: 0.6 }));
        rail.position.set(I.x + sx, y + I.floorHeight / 2 + 0.6, I.z - rh + 3); rail.rotation.x = ramp.rotation.x;
        this.group.add(rail);
      }
    }
  }
}
