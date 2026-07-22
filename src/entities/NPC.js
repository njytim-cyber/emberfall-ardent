/* ============================================================
   NPC — a non-hostile townsfolk (the quest-giver Elder) and the
   overworld boss marker. Shows a floating "!" / "▼" indicator and
   reports when the player is close enough to interact.
   ============================================================ */

import * as THREE from 'three';

export class NPC {
  constructor(scene, position, opts = {}) {
    this.scene = scene;
    this.position = position.clone();
    this.name = opts.name || 'Villager';
    this.interactRange = opts.interactRange || 3.5;
    this.kind = opts.kind || 'npc';       // 'npc' | 'boss'
    this._t = 0;
    this._buildMesh(opts);
  }

  _buildMesh(opts) {
    const g = new THREE.Group();

    if (this.kind === 'boss') {
      // Hulking brute marker
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.9, 1.4, 6, 12),
        new THREE.MeshStandardMaterial({ color: 0x6a2a8a, roughness: 0.7 })
      );
      body.position.y = 1.7; body.castShadow = true; g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x7a3a2a, roughness: 0.8 }));
      head.position.y = 3.0; head.castShadow = true; g.add(head);
      for (const sx of [-0.22, 0.22]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xff2200, emissiveIntensity: 2 }));
        eye.position.set(sx, 3.1, 0.5); g.add(eye);
      }
      // menacing glow
      const light = new THREE.PointLight(0x9b30ff, 8, 12, 2);
      light.position.y = 2.5; g.add(light);
      g.scale.setScalar(1.4);
      this._indicator = this._makeIndicator(0x9b30ff, '▼');
    } else if (this.kind === 'merchant') {
      // Cloaked merchant with a satchel
      const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.6, 12),
        new THREE.MeshStandardMaterial({ color: 0x6b4a24, roughness: 0.85 }));
      robe.position.y = 0.8; robe.castShadow = true; g.add(robe);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xd9a877, roughness: 0.7 }));
      head.position.y = 1.75; head.castShadow = true; g.add(head);
      const hood = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.6, 12),
        new THREE.MeshStandardMaterial({ color: 0x4a3218, roughness: 0.85 }));
      hood.position.y = 2.1; g.add(hood);
      // satchel of wares
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.8 }));
      bag.position.set(0.5, 1.0, 0); bag.castShadow = true; g.add(bag);
      this._indicator = this._makeIndicator(0xffd54a, '$');
    } else {
      // Robed elder
      const robe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.65, 1.6, 12),
        new THREE.MeshStandardMaterial({ color: 0x3a5a8a, roughness: 0.85 })
      );
      robe.position.y = 0.8; robe.castShadow = true; g.add(robe);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xe0b088, roughness: 0.7 }));
      head.position.y = 1.75; head.castShadow = true; g.add(head);
      // beard
      const beard = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 1 }));
      beard.position.y = 1.5; beard.rotation.x = Math.PI; g.add(beard);
      // hat
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 12),
        new THREE.MeshStandardMaterial({ color: 0x2a4a7a, roughness: 0.8 }));
      hat.position.y = 2.15; g.add(hat);
      this._indicator = this._makeIndicator(0xffd54a, '!');
    }

    g.add(this._indicator);
    g.position.copy(this.position);
    this.mesh = g;
    this.scene.add(g);
  }

  _makeIndicator(color, symbol) {
    // A glowing floating sprite made from a canvas texture
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 12;
    ctx.fillText(symbol, 32, 34);
    const tex = new THREE.CanvasTexture(c);
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    spr.scale.set(0.9, 0.9, 0.9);
    spr.position.y = this.kind === 'boss' ? 4.6 : 2.9;
    this._indBaseY = spr.position.y;
    return spr;
  }

  setInteractable(v) { this._indicator.visible = v; }

  update(dt, player) {
    this._t += dt;
    // Bob the indicator + face the player
    this._indicator.position.y = this._indBaseY + Math.sin(this._t * 3) * 0.15;
    const dx = player.position.x - this.position.x;
    const dz = player.position.z - this.position.z;
    this.mesh.rotation.y = Math.atan2(dx, dz);
    return Math.hypot(dx, dz) <= this.interactRange;
  }

  remove() { this.scene.remove(this.mesh); }
}
