/* ============================================================
   World — a single linear STREET through the city of Ardent
   (FF-style corridor): you fight your way down the avenue toward
   the plaza where President Vance waits. Detailed daytime
   buildings line both sides. Exposes colliders + key positions.
   ============================================================ */

import * as THREE from 'three';
import { CONFIG } from '../data/config.js';
import { getTexture } from '../core/textures.js';

const W = CONFIG.world;

export class Town {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);

    this.obstacles = [];
    this._signs = [];

    // Key positions the Game reads
    this.playerSpawn = new THREE.Vector3(0, 0, W.startZ - 4);
    this.raePos = new THREE.Vector3(5, 0, W.startZ - 10);
    this.docPos = new THREE.Vector3(-8.5, 0, 18);
    this.bossPos = new THREE.Vector3(0, 0, W.plazaZ);
    this.streetSpawns = [];

    this._buildGround();
    this._buildStreetProps();
    this._buildBuildings();
    this._buildPlaza();
    this._buildSpawns();
  }

  _mat(color, opts = {}) {
    return new THREE.MeshStandardMaterial({
      color, roughness: opts.roughness ?? 0.85, metalness: opts.metalness ?? 0.0,
      map: opts.map || null, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 1,
    });
  }

  // ---------------------------------------------------------
  _buildGround() {
    // Base ground plane (well beyond the street)
    const base = new THREE.Mesh(new THREE.PlaneGeometry(400, Math.abs(W.startZ - W.endZ) + 120),
      this._mat(0x2b2d33, { roughness: 0.95 }));
    base.rotation.x = -Math.PI / 2;
    base.position.set(0, -0.02, (W.startZ + W.endZ) / 2);
    base.receiveShadow = true;
    this.group.add(base);

    // Asphalt road down the middle
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(W.streetHalfWidth * 2, Math.abs(W.startZ - W.endZ) + 20),
      this._mat(0x1f2127, { map: getTexture('cobble'), roughness: 0.7, metalness: 0.15 }));
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, (W.startZ + W.endZ) / 2);
    road.receiveShadow = true;
    this.group.add(road);

    // Painted lane dashes down the centre
    const lineMat = this._mat(0xffcc33, { emissive: 0xffcc33, emissiveIntensity: 0.15, roughness: 0.6 });
    for (let z = W.startZ; z > W.endZ; z -= 8) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 3), lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.03, z);
      this.group.add(dash);
    }

    // Raised sidewalks on each side
    const swMat = this._mat(0x6a6c72, { roughness: 0.9 });
    for (const sx of [-1, 1]) {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, Math.abs(W.startZ - W.endZ) + 20), swMat);
      sw.position.set(sx * (W.streetHalfWidth + 3), 0.12, (W.startZ + W.endZ) / 2);
      sw.receiveShadow = true;
      this.group.add(sw);
    }
  }

  _buildStreetProps() {
    // Streetlights + holo-signs marching down both sidewalks
    for (let z = W.startZ - 6; z > W.plazaZ + 12; z -= 14) {
      for (const sx of [-1, 1]) {
        this._streetLight(sx * (W.streetHalfWidth + 2.5), z);
      }
    }
  }

  _streetLight(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 6, 8),
      this._mat(0x33363d, { metalness: 0.6, roughness: 0.5 }));
    pole.position.y = 3; pole.castShadow = true; g.add(pole);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 6),
      this._mat(0x33363d, { metalness: 0.6 }));
    arm.rotation.z = Math.PI / 2; arm.position.set(x > 0 ? -0.8 : 0.8, 5.8, 0); g.add(arm);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.3),
      this._mat(0x222, { emissive: 0xfff2c0, emissiveIntensity: 1.2 }));
    lamp.position.set(x > 0 ? -1.5 : 1.5, 5.7, 0); g.add(lamp);
    this.group.add(g);
    this.obstacles.push({ type: 'circle', x, z, r: 0.4 });
  }

  // ---------------------------------------------------------
  //  Detailed buildings lining the avenue
  // ---------------------------------------------------------
  _buildBuildings() {
    const palettes = [
      { wall: 0x8892a0, glow: 0x66ccff, sign: 0xff4d6d },
      { wall: 0x6d7480, glow: 0xffa94d, sign: 0x4dd0e1 },
      { wall: 0x9aa0ab, glow: 0x9b6bff, sign: 0xffd54d },
      { wall: 0x5c636f, glow: 0x5ce0a0, sign: 0xff6d4d },
      { wall: 0x7f8794, glow: 0x4da6ff, sign: 0xff4de0 },
    ];
    let i = 0;
    for (let z = W.startZ - 4; z > W.plazaZ + 16; z -= 17) {
      for (const sx of [-1, 1]) {
        const x = sx * (W.streetHalfWidth + 10 + Math.random() * 3);
        this._building(x, z + (Math.random() - 0.5) * 3, sx, palettes[i % palettes.length]);
        i++;
      }
    }
  }

  _building(x, z, sx, pal) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;   // face the street

    const wallTex = getTexture('plaster', '#ffffff');
    const depth = 14 + Math.random() * 6;
    const baseW = 12 + Math.random() * 5;
    const tiers = 2 + Math.floor(Math.random() * 3);
    let h = 0, w = baseW, d = depth;

    for (let t = 0; t < tiers; t++) {
      const th = 8 + Math.random() * 10;
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, th, d),
        this._mat(pal.wall, { map: wallTex, roughness: 0.75, metalness: 0.25 }));
      body.position.set(0, h + th / 2, 0);
      body.castShadow = body.receiveShadow = true;
      g.add(body);
      // window grid on the street-facing side (+z local, toward the avenue)
      this._windows(g, w, th, d, h, pal.glow);
      h += th;
      w *= 0.8; d *= 0.85;
    }

    // Rooftop clutter on the top tier
    this._rooftop(g, w, d, h);

    // Ground-floor storefront: darker base + awning + neon sign
    const store = new THREE.Mesh(new THREE.BoxGeometry(baseW + 0.4, 3.2, depth + 0.4),
      this._mat(0x2a2c32, { roughness: 0.7 }));
    store.position.set(0, 1.6, 0); g.add(store);
    const awning = new THREE.Mesh(new THREE.BoxGeometry(baseW * 0.8, 0.25, 2),
      this._mat(pal.sign, { roughness: 0.6 }));
    awning.position.set(0, 3.1, depth / 2 + 1); g.add(awning);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(baseW * 0.55, 1.1, 0.2),
      this._mat(0x111, { emissive: pal.sign, emissiveIntensity: 1.6 }));
    sign.position.set(0, 4.7, depth / 2 + 0.15); g.add(sign);
    this._signs.push({ mat: sign.material, phase: Math.random() * 6 });

    this.group.add(g);

    // Collider footprint (axis-aligned; buildings sit outside the walkable street)
    const cos = Math.abs(Math.cos(g.rotation.y)), sin = Math.abs(Math.sin(g.rotation.y));
    this.obstacles.push({ type: 'box', x, z, hw: (baseW / 2) * cos + (depth / 2) * sin, hd: (baseW / 2) * sin + (depth / 2) * cos });
  }

  _windows(g, w, th, d, baseY, glow) {
    const lit = new THREE.MeshStandardMaterial({ color: 0x101418, emissive: glow, emissiveIntensity: 0.7, roughness: 0.2, metalness: 0.4 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.3, metalness: 0.5 });
    const cols = Math.max(3, Math.floor(w / 2.2));
    const rows = Math.max(2, Math.floor(th / 2.6));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = (c - (cols - 1) / 2) * (w / cols);
        const wy = baseY + 1.6 + r * (th - 2) / rows;
        const win = new THREE.Mesh(new THREE.BoxGeometry(w / cols * 0.7, 1.1, 0.15),
          Math.random() < 0.5 ? lit : dark);
        win.position.set(wx, wy, d / 2 + 0.06);
        g.add(win);
      }
    }
  }

  _rooftop(g, w, d, h) {
    const metal = this._mat(0x44484f, { metalness: 0.6, roughness: 0.5 });
    // water tank
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2, 12), this._mat(0x6b5a45, { roughness: 0.8 }));
    tank.position.set(-w * 0.2, h + 1, -d * 0.15); tank.castShadow = true; g.add(tank);
    // AC units
    for (let k = 0; k < 3; k++) {
      const ac = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), metal);
      ac.position.set((Math.random() - 0.5) * w * 0.6, h + 0.4, (Math.random() - 0.5) * d * 0.5);
      ac.castShadow = true; g.add(ac);
    }
    // antenna mast + red beacon
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4, 6), metal);
    mast.position.set(w * 0.25, h + 2, d * 0.1); g.add(mast);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8),
      this._mat(0x330000, { emissive: 0xff0000, emissiveIntensity: 2 }));
    beacon.position.set(w * 0.25, h + 4, d * 0.1); g.add(beacon);
    this._signs.push({ mat: beacon.material, phase: Math.random() * 6, beacon: true });
  }

  // ---------------------------------------------------------
  //  Boss plaza at the end of the street
  // ---------------------------------------------------------
  _buildPlaza() {
    // Wide plaza floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W.plazaHalfWidth * 2 + 8, 40),
      this._mat(0x3a3d45, { map: getTexture('cobble'), roughness: 0.7, metalness: 0.2 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0.01, W.plazaZ - 3);
    floor.receiveShadow = true;
    this.group.add(floor);

    // Helix HQ backdrop tower (the President's spire) at the far end
    const g = new THREE.Group();
    g.position.set(0, 0, W.endZ + 6);
    let h = 0, w = 30, d = 16;
    for (let t = 0; t < 5; t++) {
      const th = 12 + t * 2;
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, th, d),
        this._mat(0x30343c, { roughness: 0.5, metalness: 0.5 }));
      body.position.set(0, h + th / 2, 0); body.castShadow = true; g.add(body);
      this._windows(g, w, th, d, h, 0xffd36b);
      h += th; w *= 0.82; d *= 0.85;
    }
    // Giant glowing HELIX logo band
    const logo = new THREE.Mesh(new THREE.BoxGeometry(20, 3.5, 0.4),
      this._mat(0x111, { emissive: 0xff3b5c, emissiveIntensity: 2 }));
    logo.position.set(0, 20, d / 2 + 8); g.add(logo);
    this._signs.push({ mat: logo.material, phase: 0 });
    this.group.add(g);
    this.obstacles.push({ type: 'box', x: 0, z: W.endZ + 6, hw: 16, hd: 9 });
  }

  _buildSpawns() {
    // Enemy squads staggered down the avenue
    const zs = [44, 24, 4, -20, -44, -68, -92, -116];
    zs.forEach((z, i) => {
      const off = (i % 2 === 0) ? 4 : -4;
      this.streetSpawns.push(new THREE.Vector3(off, 0, z));
      this.streetSpawns.push(new THREE.Vector3(-off * 0.6, 0, z - 6));
    });
  }

  update(dt, elapsed) {
    // Gentle neon-sign / beacon flicker
    for (const s of this._signs) {
      const f = s.beacon ? (Math.sin(elapsed * 4 + s.phase) > 0.6 ? 2 : 0.2)
                         : 1.3 + Math.sin(elapsed * 2 + s.phase) * 0.4;
      s.mat.emissiveIntensity = f;
    }
  }
}
