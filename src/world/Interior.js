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
    if (isTop) {
      // President Vance's office: glass on every side, the grey city spread below.
      const clearGlass = new THREE.MeshStandardMaterial({
        color: 0x9fc6e8, emissive: 0x6f9fca, emissiveIntensity: 0.28,
        roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.22,
      });
      const frameMat = this._mat(0x2a2f38, { roughness: 0.4, metalness: 0.7 });
      walls.forEach(([x, wy, z, w, d]) => {
        const along = Math.max(w, d);          // wall length
        const isXwall = d > w;                  // this wall runs along z
        // low parapet — a knee-high sill under the glass
        const par = new THREE.Mesh(new THREE.BoxGeometry(w, 1.2, d), wallMat);
        par.position.set(x, y + 0.6, z); par.castShadow = par.receiveShadow = true; this.group.add(par);
        // floor-to-ceiling glass above the sill
        const gW = isXwall ? 0.14 : along * 0.98;
        const gD = isXwall ? along * 0.98 : 0.14;
        const pane = new THREE.Mesh(new THREE.BoxGeometry(gW, wallH - 1.4, gD), clearGlass);
        pane.position.set(x, y + 1.2 + (wallH - 1.4) / 2, z); this.group.add(pane);
        // vertical mullions dividing the glass into tall panels
        const panels = 6;
        for (let p = 1; p < panels; p++) {
          const t = (p / panels - 0.5) * along * 0.98;
          const mull = new THREE.Mesh(new THREE.BoxGeometry(isXwall ? 0.18 : 0.14, wallH - 1.4, isXwall ? 0.14 : 0.18), frameMat);
          mull.position.set(x + (isXwall ? 0 : t), y + 1.2 + (wallH - 1.4) / 2, z + (isXwall ? t : 0));
          this.group.add(mull);
        }
        // top rail capping the glass
        const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), frameMat);
        rail.position.set(x, y + wallH - 0.15, z); this.group.add(rail);
      });
      this._buildSkyline(y);
    } else {
      walls.forEach(([x, wy, z, w, d], k) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), wallMat);
        wall.position.set(x, wy, z); wall.castShadow = wall.receiveShadow = true; this.group.add(wall);
        // window band
        const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, wallH * 0.5, d * 0.85 || 0.2), glass);
        if (d < 1) win.geometry = new THREE.BoxGeometry(0.2, wallH * 0.5, d * 0.85);
        win.position.set(x, y + wallH * 0.55, z); this.group.add(win);
      });
    }

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

  /** The grey city, spread out far below the top-floor glass. A ring of
   *  distant towers whose tops fall away beneath you, dotted with lit windows. */
  _buildSkyline(topY) {
    const litMat = new THREE.MeshStandardMaterial({ color: 0x2a2f3a, emissive: 0xffcf8a, emissiveIntensity: 0.9, roughness: 0.7 });
    const darkMat = this._mat(0x1b2029, { roughness: 0.9, metalness: 0.2 });
    const groundY = topY - I.floorHeight * (I.floors - 0.2);   // street level, well below
    // A hazy ground plane so the city reads as far, far down
    const haze = new THREE.Mesh(new THREE.CircleGeometry(260, 48),
      new THREE.MeshStandardMaterial({ color: 0x3b4250, roughness: 1, metalness: 0 }));
    haze.rotation.x = -Math.PI / 2; haze.position.set(I.x, groundY - 2, I.z); this.group.add(haze);

    const rings = [
      { r: 46, count: 16, hMin: 8, hMax: 20 },
      { r: 78, count: 22, hMin: 14, hMax: 34 },
      { r: 120, count: 26, hMin: 20, hMax: 52 },
      { r: 175, count: 24, hMin: 26, hMax: 70 },
    ];
    for (const ring of rings) {
      for (let n = 0; n < ring.count; n++) {
        const a = (n / ring.count) * Math.PI * 2 + ring.r * 0.13;   // deterministic offset per ring
        const jr = ring.r + ((n * 37) % 20) - 10;
        const bx = I.x + Math.cos(a) * jr;
        const bz = I.z + Math.sin(a) * jr;
        const h = ring.hMin + ((n * 53) % 100) / 100 * (ring.hMax - ring.hMin);
        const w = 5 + ((n * 29) % 6);
        const lit = (n * 41) % 3 !== 0;
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), lit ? litMat : darkMat);
        b.position.set(bx, groundY + h / 2, bz); this.group.add(b);
      }
    }
    // A dim sky glow lamp so the office isn't pitch dark against the glass
    const sky = new THREE.PointLight(0x8fb4e0, 3, 400, 1.5);
    sky.position.set(I.x, topY + 20, I.z); this.group.add(sky);
  }
}
