/* ============================================================
   World — a CIRCLE. The Helix plaza tower stands at the centre;
   the city of Ardent is ringed around it; the Emberwood surrounds
   the whole thing. You spiral inward along a winding spoke path
   from the outer forest, through the slums, to the central plaza.
   "z" is radial distance from centre (handled by the Player clamp).
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
    this.raePos = new THREE.Vector3(cx(W.startZ - 10) + 4, 0, W.startZ - 10);
    this.docPos = new THREE.Vector3(cx(46) + (W.streetHalfWidth - 1), 0, 46);
    this.bossPos = new THREE.Vector3(cx(W.plazaZ), 0, W.plazaZ);

    this._buildGround();
    this._buildForest();
    this._buildForestRing();
    this._buildCityRing();
    this._buildPlaza();
  }

  _mat(color, opts = {}) {
    return new THREE.MeshStandardMaterial({
      color, roughness: opts.roughness ?? 0.85, metalness: opts.metalness ?? 0.0,
      map: opts.map || null, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 1,
    });
  }

  /** True if a world point sits on the walkable inward spoke (carve it clear). */
  _inCorridor(x, z, margin = 5) {
    return z > W.endZ && z < W.startZ && Math.abs(x - cx(z)) < W.streetHalfWidth + margin;
  }

  // ---------------------------------------------------------
  _buildGround() {
    // Big forest-floor disc under everything
    const moss = new THREE.Mesh(new THREE.CircleGeometry(W.startZ + 40, 64),
      this._mat(0x37622f, { map: getTexture('grass'), roughness: 1 }));
    moss.rotation.x = -Math.PI / 2; moss.position.y = -0.08; moss.receiveShadow = true; this.group.add(moss);

    // City-ring ground (dark asphalt disc)
    const city = new THREE.Mesh(new THREE.CircleGeometry(W.cityOuterR + 6, 56), this._mat(0x23242c, { roughness: 0.8 }));
    city.rotation.x = -Math.PI / 2; city.position.y = -0.04; city.receiveShadow = true; this.group.add(city);

    this._buildPathRibbon();
  }

  /** One continuous winding ribbon that spirals inward — no overlaps. */
  _buildPathRibbon() {
    const half = W.streetHalfWidth + 1;
    const pos = [], uv = [], idx = [];
    let rows = 0;
    for (let z = W.startZ; z >= W.endZ; z -= 5) {
      const c = cx(z);
      const dcx = cx(z - 1) - cx(z + 1);
      const len = Math.hypot(dcx, -2);
      const px = 2 / len, pz = dcx / len;
      pos.push(c + px * half, 0, z + pz * half, c - px * half, 0, z - pz * half);
      uv.push(0, rows * 0.12, 1, rows * 0.12);
      rows++;
    }
    for (let r = 0; r < rows - 1; r++) {
      const a = r * 2, b = r * 2 + 1, cc = (r + 1) * 2, d = (r + 1) * 2 + 1;
      idx.push(a, b, cc, b, d, cc);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, this._mat(0x59544a, { map: getTexture('cobble'), roughness: 0.9 }));
    mesh.receiveShadow = true; this.group.add(mesh);
  }

  // ---------------------------------------------------------
  //  The Emberwood (dense along the spoke)
  // ---------------------------------------------------------
  _buildForest() {
    for (let z = W.startZ - 2; z > W.forestEndZ - 4; z -= 6.5) {
      const c = cx(z);
      for (const sx of [-1, 1]) {
        for (let rank = 0; rank < 3; rank++) {
          const x = c + sx * (W.streetHalfWidth + 1.5 + rank * 6 + Math.random() * 3.5);
          this._tree(x, z + (Math.random() - 0.5) * 6, rank === 0);
        }
      }
      const roll = Math.random(); const px = c + (Math.random() - 0.5) * W.streetHalfWidth * 1.5;
      if (roll < 0.3) this._rock(px, z);
      else if (roll < 0.52) this._fern(px, z);
      else if (roll < 0.66) this._mushroom(px, z);
      else if (roll < 0.74) this._log(px, z);
    }
  }

  /** A ring of big trees encircling the whole city — "forest surrounding it". */
  _buildForestRing() {
    const r = W.forestEndZ + 8;
    for (let k = 0; k < 60; k++) {
      const a = (k / 60) * Math.PI * 2;
      const x = Math.sin(a) * (r + (Math.random() - 0.5) * 10);
      const z = Math.cos(a) * (r + (Math.random() - 0.5) * 10);
      if (this._inCorridor(x, z, 8)) continue;   // leave the gate open
      this._tree(x, z, true);
    }
  }

  _tree(x, z, edge) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const glow = [0x6bff9b, 0x6be0ff, 0xb08bff][Math.floor(Math.random() * 3)];
    const h = 9 + Math.random() * 8;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.75, h, 7), this._mat(0x2a221c, { roughness: 1 }));
    trunk.position.y = h / 2; trunk.castShadow = true; g.add(trunk);
    const shade = [0x24401f, 0x1c3a1c, 0x2b4a24][Math.floor(Math.random() * 3)];
    for (let i = 0; i < 3; i++) {
      const rr = (3.4 - i * 0.6) * (0.9 + Math.random() * 0.35);
      const cl = new THREE.Mesh(new THREE.SphereGeometry(rr, 8, 7), this._mat(shade, { emissive: glow, emissiveIntensity: 0.35, roughness: 0.95 }));
      cl.position.set((Math.random() - 0.5) * 1.6, h + i * 1.4, (Math.random() - 0.5) * 1.6); cl.castShadow = true; g.add(cl);
    }
    if (Math.random() < 0.04) { const l = new THREE.PointLight(glow, 5, 18, 2); l.position.set(0, h * 0.8, 0); g.add(l); }
    this.group.add(g);
    if (edge) this.obstacles.push({ type: 'circle', x, z, r: 0.9 });
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
  //  The city of Ardent — a ring of buildings around the plaza
  // ---------------------------------------------------------
  _buildCityRing() {
    const palettes = [
      { wall: 0x8892a0, glow: 0x66ccff, sign: 0xff4d6d },
      { wall: 0x6d7480, glow: 0xffa94d, sign: 0x4dd0e1 },
      { wall: 0x9aa0ab, glow: 0x9b6bff, sign: 0xffd54d },
      { wall: 0x5c636f, glow: 0x5ce0a0, sign: 0xff6d4d },
    ];
    let i = 0;
    // two concentric rings of buildings
    for (const r of [W.cityInnerR + 4, W.cityInnerR + 20, W.cityOuterR - 4]) {
      const count = Math.max(8, Math.round(r / 4));
      for (let k = 0; k < count; k++) {
        const a = (k / count) * Math.PI * 2 + (r * 0.05);
        const x = Math.sin(a) * r, z = Math.cos(a) * r;
        if (this._inCorridor(x, z, 7)) continue;   // gate gap for the spoke
        this._building(x, z, Math.atan2(x, z), palettes[i % palettes.length], r > W.cityInnerR + 15 ? 1.4 : 1);
        i++;
      }
    }
    // street lamps flanking the spoke through the city
    for (let z = W.forestEndZ; z > W.plazaZ + 6; z -= 12) {
      const c = cx(z);
      this._streetLight(c - (W.streetHalfWidth + 2), z);
      this._streetLight(c + (W.streetHalfWidth + 2), z);
    }
  }

  _streetLight(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 6, 8), this._mat(0x33363d, { metalness: 0.6, roughness: 0.5 }));
    pole.position.y = 3; pole.castShadow = true; g.add(pole);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.3), this._mat(0x222, { emissive: 0xfff2c0, emissiveIntensity: 1 }));
    lamp.position.y = 5.7; g.add(lamp);
    this.group.add(g); this.obstacles.push({ type: 'circle', x, z, r: 0.4 });
  }

  _building(x, z, faceAngle, pal, tall) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = faceAngle + Math.PI;   // face the centre
    const wallTex = getTexture('plaster', '#ffffff');
    const depth = 12 + Math.random() * 6, baseW = 12 + Math.random() * 6;
    const tiers = 2 + Math.floor(Math.random() * 3);
    let h = 0, w = baseW, d = depth;
    for (let t = 0; t < tiers; t++) {
      const th = (10 + Math.random() * 10) * tall;
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, th, d), this._mat(pal.wall, { map: wallTex, roughness: 0.75, metalness: 0.25 }));
      body.position.set(0, h + th / 2, 0); body.castShadow = body.receiveShadow = true; g.add(body);
      this._windows(g, w, th, d, h, pal.glow);
      h += th; w *= 0.82; d *= 0.86;
    }
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), this._mat(0x330000, { emissive: 0xff0000, emissiveIntensity: 2 }));
    beacon.position.set(w * 0.25, h + 2, d * 0.1); g.add(beacon); this._signs.push({ mat: beacon.material, phase: Math.random() * 6, beacon: true });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(baseW * 0.55, 1.1, 0.2), this._mat(0x111, { emissive: pal.sign, emissiveIntensity: 1.6 }));
    sign.position.set(0, 4.6, depth / 2 + 0.15); g.add(sign); this._signs.push({ mat: sign.material, phase: Math.random() * 6 });
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

  // ---------------------------------------------------------
  //  The central plaza + Helix command tower
  // ---------------------------------------------------------
  _buildPlaza() {
    const floor = new THREE.Mesh(new THREE.CircleGeometry(W.plazaHalfWidth, 48),
      this._mat(0x3a3d45, { map: getTexture('cobble'), roughness: 0.7, metalness: 0.2 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = 0.02; floor.receiveShadow = true; this.group.add(floor);

    // The command tower dead centre
    const g = new THREE.Group(); g.position.set(0, 0, -2);
    let h = 0, w = 26, d = 26;
    for (let t = 0; t < 6; t++) {
      const th = 16 + t * 3;
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, th, d), this._mat(0x30343c, { roughness: 0.5, metalness: 0.5 }));
      body.position.set(0, h + th / 2, 0); body.castShadow = true; g.add(body);
      this._windows(g, w, th, d, h, 0xffd36b);
      h += th; w *= 0.86; d *= 0.86;
    }
    const logo = new THREE.Mesh(new THREE.BoxGeometry(20, 4, 0.5), this._mat(0x111, { emissive: 0xff3b5c, emissiveIntensity: 2 }));
    logo.position.set(0, 22, 13.4); g.add(logo); this._signs.push({ mat: logo.material, phase: 0 });
    this.group.add(g);
    this.obstacles.push({ type: 'box', x: 0, z: -2, hw: 13, hd: 13 });
  }

  update(dt, elapsed) {
    for (const s of this._signs) {
      s.mat.emissiveIntensity = s.beacon
        ? (Math.sin(elapsed * 4 + s.phase) > 0.6 ? 2 : 0.2)
        : 1.3 + Math.sin(elapsed * 2 + s.phase) * 0.4;
    }
  }
}
