/* ============================================================
   World — a linear JOURNEY: you spawn deep in the mystical
   Emberwood (glowing trees, mist), push down the path through a
   city gate, and fight through the streets of Ardent to the plaza
   where President Vance waits. Two visual zones on one path.
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
    this._spores = [];

    this.playerSpawn = new THREE.Vector3(0, 0, W.startZ - 4);
    this.raePos = new THREE.Vector3(5, 0, W.startZ - 10);
    this.docPos = new THREE.Vector3(-8.5, 0, -18);        // Doc's stall inside the city
    this.bossPos = new THREE.Vector3(0, 0, W.plazaZ);

    this._buildGround();
    this._buildForest();
    this._buildGate();
    this._buildCity();
    this._buildPlaza();
  }

  _mat(color, opts = {}) {
    return new THREE.MeshStandardMaterial({
      color, roughness: opts.roughness ?? 0.85, metalness: opts.metalness ?? 0.0,
      map: opts.map || null, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 1,
    });
  }

  // ---------------------------------------------------------
  _buildGround() {
    const len = Math.abs(W.startZ - W.endZ) + 120;
    // Forest floor (mossy green) over the whole thing…
    const moss = new THREE.Mesh(new THREE.PlaneGeometry(400, len),
      this._mat(0x2f4a2a, { map: getTexture('grass'), roughness: 1 }));
    moss.rotation.x = -Math.PI / 2; moss.position.set(0, -0.02, (W.startZ + W.endZ) / 2);
    moss.receiveShadow = true; this.group.add(moss);

    // …with an asphalt overlay across the city half
    const cityLen = Math.abs(W.forestEndZ - W.endZ) + 40;
    const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(340, cityLen),
      this._mat(0x23242c, { map: getTexture('cobble'), roughness: 0.7, metalness: 0.15 }));
    asphalt.rotation.x = -Math.PI / 2; asphalt.position.set(0, -0.015, (W.forestEndZ + W.endZ) / 2);
    asphalt.receiveShadow = true; this.group.add(asphalt);

    // The path itself, running the full length
    const path = new THREE.Mesh(new THREE.PlaneGeometry(W.streetHalfWidth * 2, len),
      this._mat(0x59544a, { map: getTexture('cobble'), roughness: 0.9 }));
    path.rotation.x = -Math.PI / 2; path.position.set(0, 0, (W.startZ + W.endZ) / 2);
    path.receiveShadow = true; this.group.add(path);
  }

  // ---------------------------------------------------------
  //  The Emberwood
  // ---------------------------------------------------------
  _buildForest() {
    // Dense-looking tree line on both sides, kept performant (2 ranks)
    for (let z = W.startZ - 2; z > W.forestEndZ + 4; z -= 7) {
      for (const sx of [-1, 1]) {
        for (let rank = 0; rank < 2; rank++) {
          const x = sx * (W.streetHalfWidth + 3 + rank * 7 + Math.random() * 5);
          this._tree(x, z + (Math.random() - 0.5) * 5);
        }
      }
      // Natural scatter along the path: rocks, ferns, glow-mushrooms, the odd fallen log
      const roll = Math.random();
      const px = (Math.random() - 0.5) * W.streetHalfWidth * 1.85;
      if (roll < 0.35) this._rock(px, z);
      else if (roll < 0.6) this._fern(px, z);
      else if (roll < 0.78) this._mushroom(px, z);
      else if (roll < 0.86) this._log()(px, z);
    }
  }

  _rock(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const s = 0.4 + Math.random() * 0.9;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0),
        this._mat(0x5a5d63, { roughness: 1, metalness: 0.05 }));
      rock.position.set((Math.random() - 0.5) * 1.2, s * 0.5, (Math.random() - 0.5) * 1.2);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = rock.receiveShadow = true; g.add(rock);
    }
    this.group.add(g);
    this.obstacles.push({ type: 'circle', x, z, r: 0.7 });
  }

  _fern(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const leaf = this._mat(0x2f5a2c, { roughness: 0.9 });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const frond = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.8, 4), leaf);
      frond.position.set(Math.cos(a) * 0.18, 0.4, Math.sin(a) * 0.18);
      frond.rotation.set(0.5 * Math.cos(a), a, 0.5 * Math.sin(a)); g.add(frond);
    }
    this.group.add(g);
  }

  _log() {
    return (x, z) => {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 3 + Math.random() * 2, 8),
        this._mat(0x3a2e22, { roughness: 1 }));
      log.rotation.z = Math.PI / 2; log.rotation.y = Math.random() * Math.PI;
      log.position.set(x, 0.35, z); log.castShadow = log.receiveShadow = true;
      this.group.add(log);
      this.obstacles.push({ type: 'circle', x, z, r: 0.8 });
    };
  }

  _tree(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const glow = [0x6bff9b, 0x6be0ff, 0xb08bff][Math.floor(Math.random() * 3)];
    const h = 6 + Math.random() * 5;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, h, 7),
      this._mat(0x2e2620, { roughness: 1 }));
    trunk.position.y = h / 2; trunk.castShadow = true; g.add(trunk);
    // glowing canopy
    for (let i = 0; i < 3; i++) {
      const r = (2.4 - i * 0.5) * (0.9 + Math.random() * 0.3);
      const cl = new THREE.Mesh(new THREE.SphereGeometry(r, 9, 8),
        this._mat(0x1f3a24, { emissive: glow, emissiveIntensity: 0.5, roughness: 0.9 }));
      cl.position.set((Math.random() - 0.5) * 1.2, h + i * 1.2, (Math.random() - 0.5) * 1.2);
      cl.castShadow = true; g.add(cl);
    }
    // a soft spore light near a few trees (kept sparse — WebGL light budget)
    if (Math.random() < 0.05) {
      const light = new THREE.PointLight(glow, 5, 18, 2);
      light.position.set(0, h * 0.8, 0); g.add(light);
    }
    this.group.add(g);
    this.obstacles.push({ type: 'circle', x, z, r: 0.8 });
  }

  _mushroom(x, z) {
    const glow = [0x6bff9b, 0xff8bd0, 0x8bb0ff][Math.floor(Math.random() * 3)];
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.7, 6), this._mat(0xd8d0c0));
    stalk.position.y = 0.35; g.add(stalk);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      this._mat(0x222, { emissive: glow, emissiveIntensity: 1.4 }));
    cap.position.y = 0.7; g.add(cap);
    this.group.add(g);
    this._signs.push({ mat: cap.material, phase: Math.random() * 6 });
  }

  // ---------------------------------------------------------
  //  The city gate (forest → city threshold)
  // ---------------------------------------------------------
  _buildGate() {
    const z = W.forestEndZ;
    const stone = this._mat(0x50535c, { roughness: 0.9, metalness: 0.2 });
    for (const sx of [-1, 1]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(3, 12, 3), stone);
      pillar.position.set(sx * (W.streetHalfWidth + 2), 6, z); pillar.castShadow = true; this.group.add(pillar);
      this.obstacles.push({ type: 'box', x: sx * (W.streetHalfWidth + 2), z, hw: 1.6, hd: 1.6 });
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(W.streetHalfWidth * 2 + 8, 3, 3), stone);
    lintel.position.set(0, 13, z); lintel.castShadow = true; this.group.add(lintel);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 0.4),
      this._mat(0x111, { emissive: 0xff3b5c, emissiveIntensity: 2 }));
    sign.position.set(0, 13, z + 1.6); this.group.add(sign);
    this._signs.push({ mat: sign.material, phase: 0 });
  }

  // ---------------------------------------------------------
  //  The city of Ardent
  // ---------------------------------------------------------
  _buildCity() {
    const palettes = [
      { wall: 0x8892a0, glow: 0x66ccff, sign: 0xff4d6d },
      { wall: 0x6d7480, glow: 0xffa94d, sign: 0x4dd0e1 },
      { wall: 0x9aa0ab, glow: 0x9b6bff, sign: 0xffd54d },
      { wall: 0x5c636f, glow: 0x5ce0a0, sign: 0xff6d4d },
    ];
    let i = 0;
    for (let z = W.forestEndZ - 8; z > W.plazaZ + 16; z -= 17) {
      for (const sx of [-1, 1]) {
        const x = sx * (W.streetHalfWidth + 10 + Math.random() * 3);
        this._building(x, z + (Math.random() - 0.5) * 3, sx, palettes[i % palettes.length]);
        this._streetLight(sx * (W.streetHalfWidth + 2.5), z + 8);
        i++;
      }
    }
  }

  _streetLight(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 6, 8), this._mat(0x33363d, { metalness: 0.6, roughness: 0.5 }));
    pole.position.y = 3; pole.castShadow = true; g.add(pole);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.3), this._mat(0x222, { emissive: 0xfff2c0, emissiveIntensity: 1 }));
    lamp.position.set(x > 0 ? -1.2 : 1.2, 5.7, 0); g.add(lamp);
    this.group.add(g);
    this.obstacles.push({ type: 'circle', x, z, r: 0.4 });
  }

  _building(x, z, sx, pal) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
    const wallTex = getTexture('plaster', '#ffffff');
    const depth = 14 + Math.random() * 6, baseW = 12 + Math.random() * 5;
    const tiers = 2 + Math.floor(Math.random() * 3);
    let h = 0, w = baseW, d = depth;
    for (let t = 0; t < tiers; t++) {
      const th = 8 + Math.random() * 10;
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, th, d), this._mat(pal.wall, { map: wallTex, roughness: 0.75, metalness: 0.25 }));
      body.position.set(0, h + th / 2, 0); body.castShadow = body.receiveShadow = true; g.add(body);
      this._windows(g, w, th, d, h, pal.glow);
      h += th; w *= 0.8; d *= 0.85;
    }
    this._rooftop(g, w, d, h);
    const store = new THREE.Mesh(new THREE.BoxGeometry(baseW + 0.4, 3.2, depth + 0.4), this._mat(0x2a2c32, { roughness: 0.7 }));
    store.position.set(0, 1.6, 0); g.add(store);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(baseW * 0.55, 1.1, 0.2), this._mat(0x111, { emissive: pal.sign, emissiveIntensity: 1.6 }));
    sign.position.set(0, 4.7, depth / 2 + 0.15); g.add(sign);
    this._signs.push({ mat: sign.material, phase: Math.random() * 6 });
    this.group.add(g);
    const cos = Math.abs(Math.cos(g.rotation.y)), sin = Math.abs(Math.sin(g.rotation.y));
    this.obstacles.push({ type: 'box', x, z, hw: (baseW / 2) * cos + (depth / 2) * sin, hd: (baseW / 2) * sin + (depth / 2) * cos });
  }

  _windows(g, w, th, d, baseY, glow) {
    const lit = new THREE.MeshStandardMaterial({ color: 0x101418, emissive: glow, emissiveIntensity: 0.7, roughness: 0.2, metalness: 0.4 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.3, metalness: 0.5 });
    const cols = Math.max(3, Math.floor(w / 2.2)), rows = Math.max(2, Math.floor(th / 2.6));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(w / cols * 0.7, 1.1, 0.15), Math.random() < 0.5 ? lit : dark);
      win.position.set((c - (cols - 1) / 2) * (w / cols), baseY + 1.6 + r * (th - 2) / rows, d / 2 + 0.06); g.add(win);
    }
  }

  _rooftop(g, w, d, h) {
    const metal = this._mat(0x44484f, { metalness: 0.6, roughness: 0.5 });
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2, 12), this._mat(0x6b5a45, { roughness: 0.8 }));
    tank.position.set(-w * 0.2, h + 1, -d * 0.15); tank.castShadow = true; g.add(tank);
    for (let k = 0; k < 2; k++) {
      const ac = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), metal);
      ac.position.set((Math.random() - 0.5) * w * 0.6, h + 0.4, (Math.random() - 0.5) * d * 0.5); g.add(ac);
    }
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), this._mat(0x330000, { emissive: 0xff0000, emissiveIntensity: 2 }));
    beacon.position.set(w * 0.25, h + 2, d * 0.1); g.add(beacon);
    this._signs.push({ mat: beacon.material, phase: Math.random() * 6, beacon: true });
  }

  // ---------------------------------------------------------
  _buildPlaza() {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W.plazaHalfWidth * 2 + 8, 40),
      this._mat(0x3a3d45, { map: getTexture('cobble'), roughness: 0.7, metalness: 0.2 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.01, W.plazaZ - 3); floor.receiveShadow = true; this.group.add(floor);

    const g = new THREE.Group(); g.position.set(0, 0, W.endZ + 6);
    let h = 0, w = 30, d = 16;
    for (let t = 0; t < 5; t++) {
      const th = 12 + t * 2;
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, th, d), this._mat(0x30343c, { roughness: 0.5, metalness: 0.5 }));
      body.position.set(0, h + th / 2, 0); body.castShadow = true; g.add(body);
      this._windows(g, w, th, d, h, 0xffd36b);
      h += th; w *= 0.82; d *= 0.85;
    }
    const logo = new THREE.Mesh(new THREE.BoxGeometry(20, 3.5, 0.4), this._mat(0x111, { emissive: 0xff3b5c, emissiveIntensity: 2 }));
    logo.position.set(0, 20, d / 2 + 8); g.add(logo);
    this._signs.push({ mat: logo.material, phase: 0 });
    this.group.add(g);
    this.obstacles.push({ type: 'box', x: 0, z: W.endZ + 6, hw: 16, hd: 9 });
  }

  update(dt, elapsed) {
    for (const s of this._signs) {
      s.mat.emissiveIntensity = s.beacon
        ? (Math.sin(elapsed * 4 + s.phase) > 0.6 ? 2 : 0.2)
        : 1.3 + Math.sin(elapsed * 2 + s.phase) * 0.4;
    }
  }
}
