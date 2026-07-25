/* ============================================================
   Environment — sky, atmospheric fog, and realistic lighting.
   A warm directional "sun" casts soft shadows; a hemisphere light
   fills the shadows with sky/ground bounce for a natural look.
   ============================================================ */

import * as THREE from 'three';
import { CONFIG } from '../data/config.js';

export class Environment {
  constructor(scene, renderer, opts = {}) {
    this.scene = scene;
    const low = !!opts.low;

    // --- Sky: vertical gradient dome ---
    const skyGeo = new THREE.SphereGeometry(500, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        top: { value: new THREE.Color(0x2f6fd0) },       // clear blue zenith
        mid: { value: new THREE.Color(0x9fc4ef) },       // bright sky
        bottom: { value: new THREE.Color(0xe8eef6) },    // hazy bright horizon
      },
      vertexShader: `
        varying vec3 vP;
        void main() {
          vP = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying vec3 vP;
        uniform vec3 top; uniform vec3 mid; uniform vec3 bottom;
        void main() {
          float h = normalize(vP).y;
          vec3 col = h > 0.0 ? mix(mid, top, h) : mix(mid, bottom, -h);
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    this.sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(this.sky);

    // --- Fog: bright daytime haze ---
    scene.fog = new THREE.Fog(0xcdd9e8, CONFIG.world.fogNear, CONFIG.world.fogFar);

    // --- Sun: warm midday key light, crisp shadows ---
    const sun = new THREE.DirectionalLight(0xfff4e0, 3.0);
    sun.position.set(50, 120, 60);
    sun.castShadow = true;
    sun.shadow.mapSize.set(low ? 1024 : 2048, low ? 1024 : 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 320;
    const s = 120;
    sun.shadow.camera.left = -s;
    sun.shadow.camera.right = s;
    sun.shadow.camera.top = s;
    sun.shadow.camera.bottom = -s;
    sun.shadow.bias = -0.0009;
    sun.shadow.normalBias = 0.12;   // kills shadow-acne streaks on the flat ground
    scene.add(sun);
    this.sun = sun;

    // --- Sky/ground bounce fill (blue sky, warm pavement) ---
    const hemi = new THREE.HemisphereLight(0xaecbff, 0x8a8175, 1.0);
    scene.add(hemi);

    // --- Ambient lift so shadows stay readable ---
    scene.add(new THREE.AmbientLight(0xbfd0e6, 0.55));
  }
}
