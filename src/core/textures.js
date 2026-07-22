/* ============================================================
   Procedural textures — generated on <canvas> at runtime so the
   game ships with zero image assets yet still looks grounded.
   These feed PBR (MeshStandardMaterial) surfaces for a realistic
   lit look: cobblestone, grass, plaster, wood, roof tiles.
   ============================================================ */

import * as THREE from 'three';

function makeCanvas(size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return { c, ctx: c.getContext('2d') };
}

// Value-noise helper for organic variation
function noise(ctx, size, base, variance) {
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * variance;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
}

function toTexture(canvas, repeat = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Grassy ground with tufts and dirt patches */
export function grassTexture() {
  const size = 256;
  const { c, ctx } = makeCanvas(size);
  ctx.fillStyle = '#3f5a2c';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const g = 60 + Math.random() * 80;
    ctx.fillStyle = `rgba(${g * 0.5}, ${g}, ${g * 0.35}, 0.5)`;
    ctx.fillRect(x, y, 1, 1 + Math.random() * 2);
  }
  // dirt patches
  for (let i = 0; i < 22; i++) {
    ctx.fillStyle = `rgba(90, 70, 45, ${0.15 + Math.random() * 0.25})`;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, 8 + Math.random() * 22, 0, Math.PI * 2);
    ctx.fill();
  }
  noise(ctx, size, 0, 24);
  return toTexture(c, 40);
}

/** Cobblestone path */
export function cobbleTexture() {
  const size = 256;
  const { c, ctx } = makeCanvas(size);
  ctx.fillStyle = '#5b5750';
  ctx.fillRect(0, 0, size, size);
  const cell = 32;
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const ox = (Math.floor(y / cell) % 2) * (cell / 2);
      const px = x + ox, py = y;
      const g = 90 + Math.random() * 50;
      ctx.fillStyle = `rgb(${g}, ${g - 6}, ${g - 14})`;
      ctx.beginPath();
      ctx.roundRect(px + 2, py + 2, cell - 4, cell - 4, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(20,18,15,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  noise(ctx, size, 0, 20);
  return toTexture(c, 1);
}

/** Wall plaster / stucco */
export function plasterTexture(hex = '#cdb892') {
  const size = 128;
  const { c, ctx } = makeCanvas(size);
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = `rgba(90,70,50,${Math.random() * 0.08})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }
  noise(ctx, size, 0, 14);
  return toTexture(c, 2);
}

/** Vertical wood planks */
export function woodTexture(hex = '#6b4a2b') {
  const size = 128;
  const { c, ctx } = makeCanvas(size);
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, size, size);
  const planks = 6, pw = size / planks;
  for (let i = 0; i < planks; i++) {
    const shade = 0.85 + Math.random() * 0.3;
    ctx.fillStyle = `rgba(${107 * shade}, ${74 * shade}, ${43 * shade}, 1)`;
    ctx.fillRect(i * pw, 0, pw - 1, size);
    // grain
    for (let g = 0; g < 6; g++) {
      ctx.strokeStyle = `rgba(40,25,12,${0.1 + Math.random() * 0.15})`;
      ctx.beginPath();
      ctx.moveTo(i * pw + Math.random() * pw, 0);
      ctx.bezierCurveTo(
        i * pw + Math.random() * pw, size * 0.3,
        i * pw + Math.random() * pw, size * 0.6,
        i * pw + Math.random() * pw, size
      );
      ctx.stroke();
    }
  }
  return toTexture(c, 1);
}

/** Clay roof tiles */
export function roofTexture(hex = '#8a3b28') {
  const size = 128;
  const { c, ctx } = makeCanvas(size);
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, size, size);
  const rows = 8, rh = size / rows;
  for (let r = 0; r < rows; r++) {
    for (let x = 0; x < size; x += 18) {
      const g = 0.8 + Math.random() * 0.4;
      ctx.fillStyle = `rgba(${138 * g}, ${59 * g}, ${40 * g}, 1)`;
      ctx.beginPath();
      ctx.roundRect(x + (r % 2) * 9, r * rh, 16, rh - 1, 4);
      ctx.fill();
    }
  }
  noise(ctx, size, 0, 16);
  return toTexture(c, 3);
}

// Shared texture cache so we build each surface only once
const cache = {};
export function getTexture(name, arg) {
  const key = name + (arg || '');
  if (cache[key]) return cache[key];
  let t;
  switch (name) {
    case 'grass': t = grassTexture(); break;
    case 'cobble': t = cobbleTexture(); break;
    case 'plaster': t = plasterTexture(arg); break;
    case 'wood': t = woodTexture(arg); break;
    case 'roof': t = roofTexture(arg); break;
    default: t = grassTexture();
  }
  cache[key] = t;
  return t;
}
