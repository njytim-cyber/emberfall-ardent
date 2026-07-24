/* ============================================================
   World — a long, WINDING journey. The walkable corridor snakes
   left and right (pathCenterX) so you can't see the city when you
   spawn deep in the Emberwood; you round the bends, break through
   a gate, and descend into the towering city of Ardent, ending at
   Vance's plaza. Everything is placed relative to the centre-line.
   ============================================================ */

import * as THREE from 'three';
import { CONFIG, pathCenterX } from '../data/config.js';
import { getTexture } from '../core/textures.js';

const W = CONFIG.world;
const cx = pathCenterX;

export class Town {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);

    this.obstacles = [];
    this._signs = [];

    this.playerSpawn = new THREE.Vector3(cx(W.startZ - 4), 0, W.startZ - 4);
    this.raePos = new THREE.Vector3(cx(W.startZ - 10) + 5, 0, W.startZ - 10);
    this.docPos = new THREE.Vector3(cx(-24) - 8, 0, -24);
    this.bossPos = new THREE.Vector3(cx(W.plazaZ), 0, W.plazaZ);

    this._buildGround();
    this._buildForest();
    this._buildGate();
    this._buildCity();
    this._buildSkyline();
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
    // Forest floor everywhere (wide enough to cover the meander)
    const moss = new THREE.Mesh(new THREE.PlaneGeometry(360, len),
      this._mat(0x2f4a2a, { map: getTexture('grass'), roughness: 1 }));
    moss.rotation.x = -Math.PI / 2; moss.position.set(0, -0.03, (W.startZ + W.endZ) / 2);
    moss.receiveShadow = true; this.group.add(moss);

    // Asphalt across the city half
    const cityLen = Math.abs(W.forestEndZ - W.endZ) + 40;
    const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(300, cityLen),
      this._mat(0x23242c, { map: getTexture('cobble'), roughness: 0.7, metalness: 0.15 }));
    asphalt.rotation.x = -Math.PI / 2; asphalt.position.set(0, -0.02, (W.forestEndZ + W.endZ) / 2);
    asphalt.receiveShadow = true; this.group.add(asphalt);

    // The winding path itself — overlapping segments that follow the centre-line
    const pathMat = this._mat(0x59544a, { map: getTexture('cobble'), roughness: 0.9 });
    for (let z = W.startZ; z > W.endZ; z -= 6) {
      const seg = new THREE.Mesh(new THREE.PlaneGeometry(W.streetHalfWidth * 2 + 2, 9), pathMat);
      seg.rotation.x = -Math.PI / 2;
      // yaw the segment to align with the local path tangent
      seg.rotation.z = Math.atan2(cx(z - 3) - cx(z + 3), 6);
      seg.position.set(cx(z), -0.01, z);
      seg.receiveShadow = true; this.group.add(seg);
    }
  }

  // ---------------------------------------------------------
  //  The Emberwood (long + winding)
  // ---------------------------------------------------------
  _buildForest() {
    for (let z = W.startZ - 2; z > W.forestEndZ + 4; z -= 8) {
      const c = cx(z);
      for (const sx of [-1, 1]) {
        for (let rank = 0; rank < 2; rank++) {
          const x = c + sx * (W.streetHalfWidth + 3 + rank * 7 + Math.random() * 5);
          this._tree(x, z + (Math.random() - 0.5) * 5);
        }
      }
      const roll = Math.random(); const px = c + (Math.random() - 0.5) * W.streetHalfWidth * 1.8;
      if (roll < 0.32) this._rock(px, z);
      else if (roll < 0.55) this._fern(px, z);
      else if (roll < 0.72) this._mushroom(px, z);
      else if (roll < 0.8) this._log(px, z);
    }
  }

  _tree(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const glow = [0x6bff9b, 0x6be0ff, 0xb08bff][Math.floor(Math.random() * 3)];
    const h = 7 + Math.random() * 6;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.65, h, 7), this._mat(0x2e2620, { roughness: 1 }));
    trunk.position.y = h / 2; trunk.castShadow = true; g.add(trunk);
    for (let i = 0; i < 3; i++) {
      const r = (2.6 - i * 0.55) * (0.9 + Math.random() * 0.3);
      const cl = new THREE.Mesh(new THREE.SphereGeometry(r, 9, 8),
        this._mat(0x1f3a24, { emissive: glow, emissiveIntensity: 0.5, roughness: 0.9 }));
      cl.position.set((Math.random() - 0.5) * 1.3, h + i * 1.3, (Math.random() - 0.5) * 1.3);
      cl.castShadow = true; g.add(cl);
    }
    if (Math.random() < 0.05) { const l = new THREE.PointLight(glow, 5, 18, 2); l.position.set(0, h * 0.8, 0); g.add(l); }
    this.group.add(g);
    this.obstacles.push({ type: 'circle', x, z, r: 0.85 });
  }

  _rock(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    for (let i = 0, n = 1 + Math.floor(Math.random() * 3); i < n; i++) {
      const s = 0.4 + Math.random() * 0.9;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), this._mat(0x5a5d63, { roughness: 1, metalness: 0.05 }));
      rock.position.set((Math.random() - 0.5) * 1.2, s * 0.5, (Math.random() - 0.5) * 1.2);
      rock.rotation.set(Math.random(), Math.random(), Math.random()); rock.castShadow = rock.receiveShadow = true; g.add(rock);
    }
    this.group.add(g); this.obstacles.push({ type: 'circle', x, z, r: 0.7 });
  }

  _fern(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const leaf = this._mat(0x2f5a2c, { roughness: 0.9 });
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const f = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.8, 4), leaf); f.position.set(Math.cos(a) * 0.18, 0.4, Math.sin(a) * 0.18); f.rotation.set(0.5 * Math.cos(a), a, 0.5 * Math.sin(a)); g.add(f); }
    this.group.add(g);
  }

  _mushroom(x, z) {
    const glow = [0x6bff9b, 0xff8bd0, 0x8bb0ff][Math.floor(Math.random() * 3)];
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.7, 6), this._mat(0xd8d0c0)); stalk.position.y = 0.35; g.add(stalk);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), this._mat(0x222, { emissive: glow, emissiveIntensity: 1.4 })); cap.position.y = 0.7; g.add(cap);
    this.group.add(g); this._signs.push({ mat: cap.material, phase: Math.random() * 6 });
  }

  _log(x, z) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 3 + Math.random() * 2, 8), this._mat(0x3a2e22, { roughness: 1 }));
    log.rotation.z = Math.PI / 2; log.rotation.y = Math.random() * Math.PI; log.position.set(x, 0.35, z); log.castShadow = log.receiveShadow = true;
    this.group.add(log); this.obstacles.push({ type: 'circle', x, z, r: 0.8 });
  }

  // ---------------------------------------------------------
  _buildGate() {
    const z = W.forestEndZ, c = cx(z);
    const stone = this._mat(0x50535c, { roughness: 0.9, metalness: 0.2 });
    for (const sx of [-1, 1]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(3.5, 16, 3.5), stone);
      pillar.position.set(c + sx * (W.streetHalfWidth + 2.5), 8, z); pillar.castShadow = true; this.group.add(pillar);
      this.obstacles.push({ type: 'box', x: c + sx * (W.streetHalfWidth + 2.5), z, hw: 1.8, hd: 1.8 });
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(W.streetHalfWidth * 2 + 9, 3.5, 3.5), stone);
    lintel.position.set(c, 17, z); lintel.castShadow = true; this.group.add(lintel);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(14, 2.4, 0.5), this._mat(0x111, { emissive: 0xff3b5c, emissiveIntensity: 2 }));
    sign.position.set(c, 17, z + 1.9); this.group.add(sign); this._signs.push({ mat: sign.material, phase: 0 });
  }

  // ---------------------------------------------------------
  //  The city of Ardent — bigger and taller
  // ---------------------------------------------------------
  _buildCity() {
    const palettes = [
      { wall: 0x8892a0, glow: 0x66ccff, sign: 0xff4d6d },
      { wall: 0x6d7480, glow: 0xffa94d, sign: 0x4dd0e1 },
      { wall: 0x9aa0ab, glow: 0x9b6bff, sign: 0xffd54d },
      { wall: 0x5c636f, glow: 0x5ce0a0, sign: 0xff6d4d },
    ];
    let i = 0;
    for (let z = W.forestEndZ - 8; z > W.plazaZ + 18; z -= 15) {
      const c = cx(z);
      for (const sx of [-1, 1]) {
        const x = c + sx * (W.streetHalfWidth + 11 + Math.random() * 3);
        this._building(x, z + (Math.random() - 0.5) * 3, sx, palettes[i % palettes.length], 1);
        this._streetLight(c + sx * (W.streetHalfWidth + 2.5), z + 7);
        i++;
      }
    }
  }

  /** Distant, low-detail skyscraper skyline for scale (few meshes each). */
  _buildSkyline() {
    for (let z = W.forestEndZ - 20; z > W.plazaZ + 10; z -= 26) {
      const c = cx(z);
      for (const sx of [-1, 1]) {
        const x = c + sx * (W.streetHalfWidth + 34 + Math.random() * 24);
        const h = 45 + Math.random() * 45, w = 12 + Math.random() * 10;
        const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, w),
          this._mat(0x2b303a, { emissive: [0x22384f, 0x3a2f4a][i2n(x)], emissiveIntensity: 0.25, roughness: 0.6, metalness: 0.4 }));
        tower.position.set(x, h / 2, z); this.group.add(tower);
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 6), this._mat(0x300, { emissive: 0xff0000, emissiveIntensity: 2 }));
        beacon.position.set(x, h + 1, z); this.group.add(beacon);
        this._signs.push({ mat: beacon.material, phase: Math.random() * 6, beacon: true });
      }
    }
  }

  _streetLight(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 6, 8), this._mat(0x33363d, { metalness: 0.6, roughness: 0.5 }));
    pole.position.y = 3; pole.castShadow = true; g.add(pole);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.3), this._mat(0x222, { emissive: 0xfff2c0, emissiveIntensity: 1 }));
    lamp.position.set(x > 0 ? -1.2 : 1.2, 5.7, 0); g.add(lamp);
    this.group.add(g); this.obstacles.push({ type: 'circle', x, z, r: 0.4 });
  }

  _building(x, z, sx, pal) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
    const wallTex = getTexture('plaster', '#ffffff');
    const depth = 15 + Math.random() * 7, baseW = 14 + Math.random() * 6;
    const tiers = 3 + Math.floor(Math.random() * 3);
    let h = 0, w = baseW, d = depth;
    for (let t = 0; t < tiers; t++) {
      const th = 11 + Math.random() * 12;
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, th, d), this._mat(pal.wall, { map: wallTex, roughness: 0.75, metalness: 0.25 }));
      body.position.set(0, h + th / 2, 0); body.castShadow = body.receiveShadow = true; g.add(body);
      this._windows(g, w, th, d, h, pal.glow);
      h += th; w *= 0.82; d *= 0.86;
    }
    this._rooftop(g, w, d, h);
    const store = new THREE.Mesh(new THREE.BoxGeometry(baseW + 0.4, 3.4, depth + 0.4), this._mat(0x2a2c32, { roughness: 0.7 }));
    store.position.set(0, 1.7, 0); g.add(store);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(baseW * 0.55, 1.2, 0.2), this._mat(0x111, { emissive: pal.sign, emissiveIntensity: 1.6 }));
    sign.position.set(0, 5, depth / 2 + 0.15); g.add(sign); this._signs.push({ mat: sign.material, phase: Math.random() * 6 });
    this.group.add(g);
    const co = Math.abs(Math.cos(g.rotation.y)), si = Math.abs(Math.sin(g.rotation.y));
    this.obstacles.push({ type: 'box', x, z, hw: (baseW / 2) * co + (depth / 2) * si, hd: (baseW / 2) * si + (depth / 2) * co });
  }

  _windows(g, w, th, d, baseY, glow) {
    const lit = new THREE.MeshStandardMaterial({ color: 0x101418, emissive: glow, emissiveIntensity: 0.7, roughness: 0.2, metalness: 0.4 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.3, metalness: 0.5 });
    const cols = Math.max(3, Math.floor(w / 2.4)), rows = Math.max(2, Math.floor(th / 2.8));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(w / cols * 0.7, 1.1, 0.15), Math.random() < 0.5 ? lit : dark);
      win.position.set((c - (cols - 1) / 2) * (w / cols), baseY + 1.7 + r * (th - 2) / rows, d / 2 + 0.06); g.add(win);
    }
  }

  _rooftop(g, w, d, h) {
    const metal = this._mat(0x44484f, { metalness: 0.6, roughness: 0.5 });
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2.2, 12), this._mat(0x6b5a45, { roughness: 0.8 }));
    tank.position.set(-w * 0.2, h + 1.1, -d * 0.15); tank.castShadow = true; g.add(tank);
    const ac = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.9, 1.3), metal);
    ac.position.set((Math.random() - 0.5) * w * 0.6, h + 0.45, (Math.random() - 0.5) * d * 0.5); g.add(ac);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), this._mat(0x330000, { emissive: 0xff0000, emissiveIntensity: 2 }));
    beacon.position.set(w * 0.25, h + 2, d * 0.1); g.add(beacon); this._signs.push({ mat: beacon.material, phase: Math.random() * 6, beacon: true });
  }

  // ---------------------------------------------------------
  _buildPlaza() {
    const c = cx(W.plazaZ);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W.plazaHalfWidth * 2 + 12, 46),
      this._mat(0x3a3d45, { map: getTexture('cobble'), roughness: 0.7, metalness: 0.2 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(c, 0.02, W.plazaZ - 3); floor.receiveShadow = true; this.group.add(floor);

    // Towering Helix HQ backdrop
    const g = new THREE.Group(); g.position.set(cx(W.endZ + 6), 0, W.endZ + 6);
    let h = 0, w = 38, d = 20;
    for (let t = 0; t < 6; t++) {
      const th = 16 + t * 3;
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, th, d), this._mat(0x30343c, { roughness: 0.5, metalness: 0.5 }));
      body.position.set(0, h + th / 2, 0); body.castShadow = true; g.add(body);
      this._windows(g, w, th, d, h, 0xffd36b);
      h += th; w *= 0.84; d *= 0.87;
    }
    const logo = new THREE.Mesh(new THREE.BoxGeometry(26, 4.5, 0.5), this._mat(0x111, { emissive: 0xff3b5c, emissiveIntensity: 2 }));
    logo.position.set(0, 26, d / 2 + 10); g.add(logo); this._signs.push({ mat: logo.material, phase: 0 });
    this.group.add(g);
    this.obstacles.push({ type: 'box', x: cx(W.endZ + 6), z: W.endZ + 6, hw: 20, hd: 11 });
  }

  update(dt, elapsed) {
    for (const s of this._signs) {
      s.mat.emissiveIntensity = s.beacon
        ? (Math.sin(elapsed * 4 + s.phase) > 0.6 ? 2 : 0.2)
        : 1.3 + Math.sin(elapsed * 2 + s.phase) * 0.4;
    }
  }
}

// tiny deterministic pick helper for skyline tint
function i2n(x) { return Math.abs(Math.round(x)) % 2; }
