/* ============================================================
   Projectile — a glowing spell bolt travelling through the world.
   Owned by the Combat system, which checks it against enemies each
   frame. Spawns an expanding burst on impact.
   ============================================================ */

import * as THREE from 'three';
import { ELEMENT_HEX } from '../data/spells.js';

export class Projectile {
  constructor(scene, spell, origin, direction) {
    this.scene = scene;
    this.spell = spell;
    this.color = ELEMENT_HEX[spell.element] || 0xffffff;
    this.direction = direction.clone().normalize();
    this.speed = spell.speed || 26;
    this.radius = 0.35;
    this.splash = spell.splash || 0;
    this.life = 2.5;
    this.dead = false;

    const mat = new THREE.MeshStandardMaterial({ color: this.color, emissive: this.color, emissiveIntensity: 2.5, roughness: 0.3 });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(this.radius, 12, 12), mat);
    this.mesh.position.copy(origin);
    scene.add(this.mesh);

    this.light = new THREE.PointLight(this.color, 6, 8, 2);
    this.mesh.add(this.light);

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(this.radius * 1.8, 12, 12),
      new THREE.MeshBasicMaterial({ color: this.color, transparent: true, opacity: 0.25 })
    );
    this.mesh.add(glow);
  }

  update(dt) {
    this.mesh.position.addScaledVector(this.direction, this.speed * dt);
    this.mesh.rotation.x += dt * 8;
    this.life -= dt;
    if (this.life <= 0 || this.mesh.position.y <= 0.15) this.explode();
  }

  get position() { return this.mesh.position; }

  explode() {
    if (this.dead) return;
    this.dead = true;
    this._burst();
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }

  _burst() {
    const flash = new THREE.PointLight(this.color, 14, 12, 2);
    flash.position.copy(this.mesh.position);
    this.scene.add(flash);

    const ringMat = new THREE.MeshBasicMaterial({ color: this.color, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 14), ringMat);
    ring.position.copy(this.mesh.position);
    this.scene.add(ring);

    const start = performance.now();
    const maxScale = 1 + (this.splash ? this.splash * 2.2 : 3);
    const grow = () => {
      const t = (performance.now() - start) / 350;
      if (t >= 1) {
        this.scene.remove(flash); this.scene.remove(ring);
        ring.geometry.dispose(); ringMat.dispose();
        return;
      }
      ring.scale.setScalar(1 + t * maxScale);
      ringMat.opacity = 0.85 * (1 - t);
      flash.intensity = 14 * (1 - t);
      requestAnimationFrame(grow);
    };
    grow();
  }
}
