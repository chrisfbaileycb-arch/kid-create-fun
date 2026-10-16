// Interactive 3D Paintable Grass & Meadow Growth Sandbox
// Embeds 100,000 GPU-Instanced 14-Segment Curved 3D Grass Blades + Sculpted Dirt Patch
// directly into the unified Kids 3D Design Studio scene.

import * as THREE from 'three';
import {
  DIRT_VERTEX_SHADER,
  DIRT_FRAGMENT_SHADER,
  GRASS_VERTEX_SHADER,
  GRASS_FRAGMENT_SHADER
} from './grassShaders.js';
import { GRASS_PRESETS } from './grassUI.js';

const PATCH_SIZE = 11.5;
const MAX_BLADE_COUNT = 100000;
const MAP_RES = 256;

export { GRASS_PRESETS };

export function evaluateMeadowTerrainHeight(x, z) {
  const r2 = (x * x + z * z) / (PATCH_SIZE * PATCH_SIZE * 0.25);
  const mound = Math.max(0.0, 1.0 - r2 * 0.35) * 0.22;
  const hills =
    Math.sin(x * 0.45 + 0.4) * Math.cos(z * 0.42 - 0.3) * 0.18 +
    Math.sin(x * 0.95 - z * 0.8) * 0.06;
  const clods =
    Math.sin(x * 2.4 + Math.cos(z * 2.1)) * 0.025 +
    Math.cos(z * 3.8 - Math.sin(x * 3.3)) * 0.014 +
    Math.sin(x * 7.5 + z * 6.8) * 0.006;
  return mound + hills + clods;
}

function createSeamlessSoilTextures(glRenderer, size = 256) {
  const heightMap = new Float32Array(size * size);
  const albedoData = new Uint8Array(size * size * 4);
  const normalData = new Uint8Array(size * size * 4);

  function tileHash(ix, iy, period) {
    const wx = ((ix % period) + period) % period;
    const wy = ((iy % period) + period) % period;
    let n = (wx * 374761393 + wy * 668265263 + period * 1442695041) | 0;
    n = ((n ^ (n >> 13)) * 1274126177) | 0;
    return ((n ^ (n >> 16)) >>> 0) / 4294967296;
  }

  function tileNoise(u, v, period) {
    const x = u * period;
    const y = v * period;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3.0 - 2.0 * fx);
    const sy = fy * fy * (3.0 - 2.0 * fy);

    const n00 = tileHash(ix, iy, period);
    const n10 = tileHash(ix + 1, iy, period);
    const n01 = tileHash(ix, iy + 1, period);
    const n11 = tileHash(ix + 1, iy + 1, period);

    const nx0 = n00 + (n10 - n00) * sx;
    const nx1 = n01 + (n11 - n01) * sx;
    return nx0 + (nx1 - nx0) * sy;
  }

  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const n1 = tileNoise(u, v, 8);
      const n2 = tileNoise(u, v, 16);
      const n3 = tileNoise(u, v, 32);
      const n4 = tileNoise(u, v, 64);
      const fineGrain = tileHash(x, y, size);

      const crumb = n1 * 0.28 + n2 * 0.26 + n3 * 0.24 + n4 * 0.16 + fineGrain * 0.06;
      heightMap[y * size + x] = crumb;

      const h = Math.max(0.0, Math.min(1.0, (crumb - 0.18) / 0.64));
      const organicPatch = tileNoise(u + 0.31, v + 0.17, 12);

      const rBase = 44 + h * 54 + (organicPatch - 0.5) * 18 + (fineGrain - 0.5) * 14;
      const gBase = 30 + h * 37 + (organicPatch - 0.5) * 12 + (fineGrain - 0.5) * 10;
      const bBase = 20 + h * 24 + (organicPatch - 0.5) * 8 + (fineGrain - 0.5) * 8;
      const ao = Math.max(0.45, Math.min(1.0, 0.52 + h * 0.55));

      const idx = (y * size + x) * 4;
      albedoData[idx] = Math.max(0, Math.min(255, Math.round(rBase)));
      albedoData[idx + 1] = Math.max(0, Math.min(255, Math.round(gBase)));
      albedoData[idx + 2] = Math.max(0, Math.min(255, Math.round(bBase)));
      albedoData[idx + 3] = Math.round(ao * 255);
    }
  }

  const bumpScale = 5.5;
  for (let y = 0; y < size; y++) {
    const ym = (y - 1 + size) % size;
    const yp = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size;
      const xp = (x + 1) % size;
      const hL = heightMap[y * size + xm];
      const hR = heightMap[y * size + xp];
      const hD = heightMap[ym * size + x];
      const hU = heightMap[yp * size + x];

      let nx = (hL - hR) * bumpScale;
      let ny = (hD - hU) * bumpScale;
      let nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;
      nx /= len;
      ny /= len;
      nz /= len;

      const hVal = heightMap[y * size + x];
      const roughness = Math.max(0.55, Math.min(0.95, 0.9 - hVal * 0.25));

      const idx = (y * size + x) * 4;
      normalData[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      normalData[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normalData[idx + 2] = Math.round(roughness * 255);
      normalData[idx + 3] = 255;
    }
  }

  const maxAniso = glRenderer.capabilities.getMaxAnisotropy();

  const albedoTex = new THREE.DataTexture(albedoData, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
  albedoTex.wrapS = THREE.RepeatWrapping;
  albedoTex.wrapT = THREE.RepeatWrapping;
  albedoTex.generateMipmaps = true;
  albedoTex.minFilter = THREE.LinearMipmapLinearFilter;
  albedoTex.magFilter = THREE.LinearFilter;
  albedoTex.anisotropy = maxAniso;
  albedoTex.needsUpdate = true;

  const normalTex = new THREE.DataTexture(normalData, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
  normalTex.wrapS = THREE.RepeatWrapping;
  normalTex.wrapT = THREE.RepeatWrapping;
  normalTex.generateMipmaps = true;
  normalTex.minFilter = THREE.LinearMipmapLinearFilter;
  normalTex.magFilter = THREE.LinearFilter;
  normalTex.anisotropy = maxAniso;
  normalTex.needsUpdate = true;

  return { albedoTex, normalTex };
}

function createGrassBladeTemplate(segments = 14) {
  const positions = [];
  const indices = [];

  for (let s = 0; s <= segments; s++) {
    const h = s / segments;
    positions.push(-1.0, h, 0.0);
    positions.push(1.0, h, 0.0);
  }
  for (let s = 0; s < segments; s++) {
    const r0 = s * 2;
    const r1 = r0 + 2;
    indices.push(r0, r0 + 1, r1);
    indices.push(r0 + 1, r1 + 1, r1);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setIndex(indices);
  return geom;
}

export function createInteractiveGrassGarden(renderer) {
  const group = new THREE.Group();
  group.name = 'InteractiveKidsGrassGarden';
  group.visible = false;

  const state = {
    ...GRASS_PRESETS[0],
    brushMode: 'grow',
    brushRadius: 1.35,
    brushStrength: 0.62,
    brushSoftness: 0.65
  };

  const growthData = new Uint8Array(MAP_RES * MAP_RES * 4);

  function resetGrowthMap(fillValue = 0) {
    for (let i = 0; i < MAP_RES * MAP_RES; i++) {
      const idx = i * 4;
      growthData[idx] = fillValue;
      growthData[idx + 1] = 128;
      growthData[idx + 2] = 128;
      growthData[idx + 3] = (i * 73) & 255;
    }
  }

  function stampBrushAtUV(u, v, radiusMeters, strength, softness, mode, strokeDirX, strokeDirZ) {
    const radiusUV = radiusMeters / PATCH_SIZE;
    const minX = Math.max(0, Math.floor((u - radiusUV) * MAP_RES));
    const maxX = Math.min(MAP_RES - 1, Math.ceil((u + radiusUV) * MAP_RES));
    const minY = Math.max(0, Math.floor((v - radiusUV) * MAP_RES));
    const maxY = Math.min(MAP_RES - 1, Math.ceil((v + radiusUV) * MAP_RES));
    const innerR = radiusUV * (1.0 - softness * 0.82);

    for (let py = minY; py <= maxY; py++) {
      const texV = (py + 0.5) / MAP_RES;
      const dv = texV - v;
      for (let px = minX; px <= maxX; px++) {
        const texU = (px + 0.5) / MAP_RES;
        const du = texU - u;
        const dist = Math.sqrt(du * du + dv * dv);
        if (dist > radiusUV) continue;

        let falloff = 1.0;
        if (dist > innerR && radiusUV > innerR) {
          const t = (dist - innerR) / (radiusUV - innerR);
          falloff = 1.0 - t * t * (3.0 - 2.0 * t);
        }

        const idx = (py * MAP_RES + px) * 4;
        const delta = falloff * strength;

        if (mode === 'grow') {
          const cur = growthData[idx] / 255.0;
          const next = Math.min(1.0, cur + delta * 0.45);
          growthData[idx] = Math.round(next * 255);
        } else if (mode === 'erase') {
          const cur = growthData[idx] / 255.0;
          const next = Math.max(0.0, cur - delta * 0.55);
          growthData[idx] = Math.round(next * 255);
        }

        if (mode === 'grow' || mode === 'comb') {
          const combBlend = Math.min(1.0, delta * (mode === 'comb' ? 0.65 : 0.25));
          const curCX = (growthData[idx + 1] / 255.0) * 2.0 - 1.0;
          const curCZ = (growthData[idx + 2] / 255.0) * 2.0 - 1.0;
          const nextCX = Math.max(-1.0, Math.min(1.0, curCX * (1.0 - combBlend) + strokeDirX * combBlend));
          const nextCZ = Math.max(-1.0, Math.min(1.0, curCZ * (1.0 - combBlend) + strokeDirZ * combBlend));
          growthData[idx + 1] = Math.round((nextCX * 0.5 + 0.5) * 255);
          growthData[idx + 2] = Math.round((nextCZ * 0.5 + 0.5) * 255);
        }
      }
    }
  }

  // Welcoming starter patches of lush grass so the garden looks alive immediately
  resetGrowthMap(0);
  stampBrushAtUV(0.5, 0.5, 2.2, 1.0, 0.72, 'grow', 0.2, 0.1);
  stampBrushAtUV(0.32, 0.42, 1.45, 0.95, 0.7, 'grow', -0.15, 0.2);
  stampBrushAtUV(0.68, 0.58, 1.55, 0.95, 0.7, 'grow', 0.18, -0.15);

  const growthTexture = new THREE.DataTexture(
    growthData,
    MAP_RES,
    MAP_RES,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  );
  growthTexture.wrapS = THREE.ClampToEdgeWrapping;
  growthTexture.wrapT = THREE.ClampToEdgeWrapping;
  growthTexture.minFilter = THREE.LinearFilter;
  growthTexture.magFilter = THREE.LinearFilter;
  growthTexture.needsUpdate = true;

  const { albedoTex: soilAlbedoTex, normalTex: soilNormalTex } = createSeamlessSoilTextures(renderer, 256);

  const dirtGeo = new THREE.PlaneGeometry(PATCH_SIZE, PATCH_SIZE, 128, 128);
  dirtGeo.rotateX(-Math.PI / 2);
  const dPos = dirtGeo.attributes.position;
  for (let i = 0; i < dPos.count; i++) {
    const x = dPos.getX(i);
    const z = dPos.getZ(i);
    dPos.setY(i, evaluateMeadowTerrainHeight(x, z));
  }
  dirtGeo.computeVertexNormals();

  const sharedUniforms = {
    uGrowthMap: { value: growthTexture },
    uSoilAlbedoTex: { value: soilAlbedoTex },
    uSoilNormalTex: { value: soilNormalTex },
    uBladeHeight: { value: state.bladeHeight },
    uBladeDensity: { value: state.bladeDensity },
    uBladeBend: { value: state.bladeBend },
    uBaseColor: { value: new THREE.Color(state.baseColor) },
    uTipColor: { value: new THREE.Color(state.tipColor) },
    uRoughness: { value: state.roughness },
    uSpecular: { value: state.specular },
    uSunDir: { value: new THREE.Vector3(0.5, 0.8, 0.5).normalize() },
    uSunColor: { value: new THREE.Color('#fffbeb') },
    uSunIntensity: { value: state.sunIntensity },
    uRimIntensity: { value: state.rimIntensity },
    uTime: { value: 0.0 },
    uWindStrength: { value: state.windStrength },
    uBrushUV: { value: new THREE.Vector2(0.5, 0.5) },
    uBrushRadiusUV: { value: state.brushRadius / PATCH_SIZE },
    uBrushSoftness: { value: state.brushSoftness },
    uBrushActive: { value: 0.0 },
    uBrushColor: { value: new THREE.Color('#4ade80') }
  };

  const dirtMaterial = new THREE.ShaderMaterial({
    vertexShader: DIRT_VERTEX_SHADER,
    fragmentShader: DIRT_FRAGMENT_SHADER,
    uniforms: sharedUniforms
  });

  const dirtMesh = new THREE.Mesh(dirtGeo, dirtMaterial);
  dirtMesh.name = 'SculptedDirtPatch';
  group.add(dirtMesh);

  const subsoilGeo = new THREE.BoxGeometry(PATCH_SIZE + 0.06, 0.28, PATCH_SIZE + 0.06);
  const subsoilMat = new THREE.MeshStandardMaterial({ color: '#3d281a', roughness: 0.92 });
  const subsoilMesh = new THREE.Mesh(subsoilGeo, subsoilMat);
  subsoilMesh.position.y = -0.14;
  group.add(subsoilMesh);

  const basePedestalGeo = new THREE.BoxGeometry(PATCH_SIZE + 0.22, 0.36, PATCH_SIZE + 0.22);
  const basePedestalMat = new THREE.MeshStandardMaterial({ color: '#1b140e', roughness: 0.95 });
  const basePedestal = new THREE.Mesh(basePedestalGeo, basePedestalMat);
  basePedestal.position.y = -0.44;
  group.add(basePedestal);

  const templateGeo = createGrassBladeTemplate(14);
  const grassGeometry = new THREE.InstancedBufferGeometry();
  grassGeometry.index = templateGeo.index;
  grassGeometry.attributes.position = templateGeo.attributes.position;

  const rootPosArray = new Float32Array(MAX_BLADE_COUNT * 3);
  const rootUVArray = new Float32Array(MAX_BLADE_COUNT * 2);
  const bladeSeedArray = new Float32Array(MAX_BLADE_COUNT);
  const yawAngleArray = new Float32Array(MAX_BLADE_COUNT);

  let prng = 987654321;
  const nextRand = () => {
    prng = (prng * 1664525 + 1013904223) >>> 0;
    return prng / 4294967296;
  };

  const margin = 0.22;
  const usableSpan = PATCH_SIZE - margin * 2.0;

  for (let i = 0; i < MAX_BLADE_COUNT; i++) {
    const rx = (nextRand() - 0.5) * usableSpan;
    const rz = (nextRand() - 0.5) * usableSpan;
    const ry = evaluateMeadowTerrainHeight(rx, rz);

    const u = rx / PATCH_SIZE + 0.5;
    const v = 0.5 - rz / PATCH_SIZE;

    rootPosArray[i * 3] = rx;
    rootPosArray[i * 3 + 1] = ry;
    rootPosArray[i * 3 + 2] = rz;
    rootUVArray[i * 2] = u;
    rootUVArray[i * 2 + 1] = v;
    bladeSeedArray[i] = i / MAX_BLADE_COUNT;
    yawAngleArray[i] = nextRand() * Math.PI * 2.0;
  }

  grassGeometry.setAttribute('aRootPos', new THREE.InstancedBufferAttribute(rootPosArray, 3));
  grassGeometry.setAttribute('aRootUV', new THREE.InstancedBufferAttribute(rootUVArray, 2));
  grassGeometry.setAttribute('aBladeSeed', new THREE.InstancedBufferAttribute(bladeSeedArray, 1));
  grassGeometry.setAttribute('aYawAngle', new THREE.InstancedBufferAttribute(yawAngleArray, 1));
  grassGeometry.instanceCount = Math.floor(MAX_BLADE_COUNT * state.bladeDensity);

  const grassMaterial = new THREE.ShaderMaterial({
    vertexShader: GRASS_VERTEX_SHADER,
    fragmentShader: GRASS_FRAGMENT_SHADER,
    uniforms: sharedUniforms,
    side: THREE.DoubleSide
  });

  const grassMesh = new THREE.Mesh(grassGeometry, grassMaterial);
  grassMesh.name = 'GPUInstancedGrass100k';
  grassMesh.frustumCulled = false;
  group.add(grassMesh);

  function syncBrushUniforms() {
    sharedUniforms.uBrushRadiusUV.value = state.brushRadius / PATCH_SIZE;
    sharedUniforms.uBrushSoftness.value = state.brushSoftness;
    if (state.brushMode === 'grow') {
      sharedUniforms.uBrushColor.value.set('#4ade80');
    } else if (state.brushMode === 'erase') {
      sharedUniforms.uBrushColor.value.set('#fb7185');
    } else {
      sharedUniforms.uBrushColor.value.set('#38bdf8');
    }
  }

  function applyInterpolatedStroke(fromUV, toUV) {
    const dxWorld = (toUV.x - fromUV.x) * PATCH_SIZE;
    const dzWorld = -(toUV.y - fromUV.y) * PATCH_SIZE;
    const worldDist = Math.hypot(dxWorld, dzWorld);

    let strokeDirX = 0.15;
    let strokeDirZ = 0.05;
    if (worldDist > 0.002) {
      strokeDirX = dxWorld / worldDist;
      strokeDirZ = dzWorld / worldDist;
    }

    const stepSizeUV = Math.max(0.004, (state.brushRadius / PATCH_SIZE) * 0.22);
    const uvDist = fromUV.distanceTo(toUV);
    const steps = Math.max(1, Math.ceil(uvDist / stepSizeUV));

    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const u = fromUV.x + (toUV.x - fromUV.x) * t;
      const v = fromUV.y + (toUV.y - fromUV.y) * t;
      stampBrushAtUV(
        u,
        v,
        state.brushRadius,
        state.brushStrength * (1.0 / Math.sqrt(steps)),
        state.brushSoftness,
        state.brushMode,
        strokeDirX,
        strokeDirZ
      );
    }
    growthTexture.needsUpdate = true;
  }

  function getCoveragePercentage() {
    let grownSum = 0;
    const totalPixels = MAP_RES * MAP_RES;
    for (let i = 0; i < totalPixels; i++) {
      grownSum += growthData[i * 4] / 255.0;
    }
    return Math.min(100, Math.round((grownSum / totalPixels) * 100));
  }

  return {
    group,
    dirtMesh,
    state,
    sharedUniforms,
    setVisible(vis) {
      group.visible = Boolean(vis);
      if (!vis) {
        sharedUniforms.uBrushActive.value = 0.0;
      }
    },
    applyInterpolatedStroke,
    stampAtCurrentUV(uv, dt) {
      stampBrushAtUV(
        uv.x,
        uv.y,
        state.brushRadius,
        state.brushStrength * dt * 2.4,
        state.brushSoftness,
        state.brushMode,
        0.15,
        0.08
      );
      growthTexture.needsUpdate = true;
    },
    setParam(key, value) {
      state[key] = value;
      switch (key) {
        case 'brushMode':
        case 'brushRadius':
        case 'brushSoftness':
          syncBrushUniforms();
          break;
        case 'bladeHeight':
          sharedUniforms.uBladeHeight.value = value;
          break;
        case 'bladeDensity':
          sharedUniforms.uBladeDensity.value = value;
          grassGeometry.instanceCount = Math.floor(MAX_BLADE_COUNT * value);
          break;
        case 'bladeBend':
          sharedUniforms.uBladeBend.value = value;
          break;
        case 'baseColor':
        case 'grassBaseColor':
          sharedUniforms.uBaseColor.value.set(value);
          break;
        case 'tipColor':
        case 'grassTipColor':
          sharedUniforms.uTipColor.value.set(value);
          break;
        case 'windStrength':
          sharedUniforms.uWindStrength.value = value;
          break;
        default:
          break;
      }
    },
    applyPreset(presetName) {
      const found = GRASS_PRESETS.find((p) => p.name === presetName) || GRASS_PRESETS[0];
      Object.assign(state, found);
      sharedUniforms.uBaseColor.value.set(found.baseColor);
      sharedUniforms.uTipColor.value.set(found.tipColor);
      sharedUniforms.uBladeHeight.value = found.bladeHeight;
      sharedUniforms.uBladeDensity.value = found.bladeDensity;
      sharedUniforms.uBladeBend.value = found.bladeBend;
      grassGeometry.instanceCount = Math.floor(MAX_BLADE_COUNT * found.bladeDensity);
      syncBrushUniforms();
      return found;
    },
    clearMeadow() {
      resetGrowthMap(0);
      growthTexture.needsUpdate = true;
    },
    fillFullMeadow() {
      resetGrowthMap(235);
      growthTexture.needsUpdate = true;
    },
    getCoveragePercentage,
    update(elapsedTime, windStrength) {
      if (!group.visible) return;
      sharedUniforms.uTime.value = elapsedTime;
      if (typeof windStrength === 'number') {
        sharedUniforms.uWindStrength.value = windStrength;
      }
    }
  };
}
