import * as THREE from "three";

/**
 * Builds a stepped gradient map so MeshToonMaterial renders crisp cel-shaded
 * bands instead of smooth shading — the core of the anime/cartoon look.
 */
export function makeToonGradient(steps = 4): THREE.DataTexture {
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) {
    data[i] = Math.round((i / (steps - 1)) * 255);
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

let cached: THREE.DataTexture | null = null;
export function toonGradient(): THREE.DataTexture {
  if (!cached) cached = makeToonGradient(4);
  return cached;
}
