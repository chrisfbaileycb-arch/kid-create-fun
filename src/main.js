import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createBlobCreature } from './blobCreature.js';
import { createGPUFurPhysics } from './gpuPhysics.js';
import { createGPUFurSystem } from './furSystem.js';
import { createMinimalUI, FUR_PRESETS } from './ui.js';
import { createEnvironmentManager } from './environments.js';
import { createWordBubbleSystem } from './wordBubbles.js';
import { createInteractiveGrassGarden } from './grassGarden3D.js';
import {
  loadStudioTabs,
  saveStudioTabs,
  createDefaultTab,
  loadGrowthState,
  saveGrowthState,
  getGrowthStage,
  getVoicePersonaById
} from './voicesAndGrowth.js';
import { createKidsWorkspaceUI } from './kidsWorkspaceUI.js';

const container = document.getElementById('canvas-container');
const uiContainer = document.getElementById('ui-root');
const hudHint = document.getElementById('hud-hint');

const urlSearchParams = new URLSearchParams(window.location.search);
const forceWebGL = urlSearchParams.get('gpuFur') === '0' || urlSearchParams.get('mode') === 'webgl';
const initialGpuFur = !forceWebGL;

// Load up to 4 Kids Design Tabs & Learning Growth state
let studioTabs = loadStudioTabs();
let activeTabIndex = 0;
let growthState = loadGrowthState();

const initialTabConfig = studioTabs[0]?.config || {};

const simState = {
  ...FUR_PRESETS[0],
  mascotName: initialTabConfig.mascotName || 'Mr. M',
  baseColor: initialTabConfig.baseColor || FUR_PRESETS[0].baseColor,
  tipColor: initialTabConfig.tipColor || FUR_PRESETS[0].tipColor,
  eyeColor: initialTabConfig.eyeColor || FUR_PRESETS[0].eyeColor,
  cheekColor: initialTabConfig.cheekColor || FUR_PRESETS[0].cheekColor,
  earStyle: initialTabConfig.earStyle || FUR_PRESETS[0].earStyle,
  accessory: initialTabConfig.accessory || FUR_PRESETS[0].accessory,
  keyColor: '#fffbeb',
  lightAngle: -42,
  lightIntensity: 1.55,
  rimIntensity: 1.45,
  windStrength: 0.70,
  environment: initialTabConfig.environment || 'meadow',
  skyTheme: initialTabConfig.skyTheme || 'daydream',
  skyCloudiness: 1.0,
  skySparkle: 0.30,
  skyRainbow: 0.35,
  bubblesEnabled: true,
  wordCategory: initialTabConfig.wordCategory || 'dreamer',
  furReactivity: 1.15,
  gpuFurEnabled: initialGpuFur
};

// 1. Initialize WebGL2 Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
  alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// 2. Scene & Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  80
);
camera.position.set(0.0, 0.45, 6.4);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 2.6;
controls.maxDistance = 18.0;
controls.maxPolarAngle = Math.PI * 0.62;
controls.target.set(0, 0.05, 0);

// 3. Synchronized 3-Point Studio Lighting Rig
const keyLight = new THREE.DirectionalLight('#fff7ed', simState.lightIntensity * 1.4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.bias = -0.0005;
keyLight.shadow.radius = 2.5;
keyLight.shadow.camera.left = -2.2;
keyLight.shadow.camera.right = 2.2;
keyLight.shadow.camera.top = 2.2;
keyLight.shadow.camera.bottom = -2.2;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 10.0;
keyLight.shadow.camera.updateProjectionMatrix();
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight('#c4b5fd', simState.rimIntensity * 1.2);
rimLight.position.set(-2.4, 1.8, -3.2);
scene.add(rimLight);

const hemiLight = new THREE.HemisphereLight('#f5d0fe', '#1e1b4b', 0.85);
scene.add(hemiLight);

// 4. Create Stylized 3D Fur Mascot + Hybrid GPU Fur + GPGPU Physics
const creature = createBlobCreature();
creature.setMascotStyle({
  earStyle: simState.earStyle,
  accessory: simState.accessory,
  eyeColor: simState.eyeColor,
  cheekColor: simState.cheekColor,
  furReactivity: simState.furReactivity
});
scene.add(creature.root);

const gpuPhysics = createGPUFurPhysics(renderer);
if (simState.gpuFurEnabled && !gpuPhysics.isGPGPUActive) {
  simState.gpuFurEnabled = false;
}
const furSystem = createGPUFurSystem(creature.bodyGeometry, simState);
creature.root.add(furSystem.shellMesh);
creature.root.add(furSystem.strandMesh);

// 4B. Create Interactive 3D Paintable Grass Garden (100,000 GPU-instanced blades)
const grassGarden = createInteractiveGrassGarden(renderer);
scene.add(grassGarden.group);

// Initialize multi-environment manager
const envManager = createEnvironmentManager({
  scene,
  renderer,
  container,
  keyLight,
  rimLight,
  hemiLight,
  furSystem,
  camera
});

let boopShockwave = 0.0;
let workspaceUI = null;

function awardXP(pillarKey, amount = 5) {
  const prevStage = getGrowthStage(growthState.xp);
  growthState.xp = (Number(growthState.xp) || 0) + amount;
  if (pillarKey && typeof growthState[pillarKey] === 'number') {
    growthState[pillarKey] = Math.min(100, growthState[pillarKey] + Math.ceil(amount * 0.6));
  }
  const nextStage = getGrowthStage(growthState.xp);
  saveGrowthState(growthState);

  if (workspaceUI) {
    workspaceUI.sync({ tabs: studioTabs, activeTabIndex, growthState });
  }

  if (nextStage.level > prevStage.level) {
    creature.triggerWave(3.2);
    wordBubbleSystem.speakPhrase(
      `Hooray! You leveled up to Level ${nextStage.level}: ${nextStage.title}! Keep creating and exploring!`,
      true
    );
  }
}

// Initialize Kids' Dream-Builder Pop-Up Word & Spelling Bubbles + Multi-Voice Engine
const wordBubbleSystem = createWordBubbleSystem({
  creature,
  onTriggerBoop: () => {
    boopShockwave = 0.85;
  },
  onStateChange: ({ starsEarned }) => {
    growthState.stars = Math.max(growthState.stars || 0, starsEarned + 3);
    awardXP('voice', 6);
  }
});

function updateLightingFromState() {
  const rad = (simState.lightAngle * Math.PI) / 180.0;
  const lx = Math.sin(rad) * 2.8;
  const ly = 2.1;
  const lz = Math.cos(rad) * 2.8;

  keyLight.position.set(lx, ly, lz);
  keyLight.intensity = simState.lightIntensity * 1.35;
  rimLight.intensity = simState.rimIntensity * 1.15;
  if (simState.keyColor) {
    keyLight.color.set(simState.keyColor);
    furSystem.sharedUniforms.uKeyLightColor.value.set(simState.keyColor);
  }

  furSystem.sharedUniforms.uKeyLightDir.value.set(lx, ly, lz).normalize();
  furSystem.sharedUniforms.uKeyLightIntensity.value = simState.lightIntensity;
  furSystem.sharedUniforms.uRimIntensity.value = simState.rimIntensity;
  creature.skinMaterial.color.set(simState.baseColor).multiplyScalar(0.55);
}

function applyCameraFramingForEnvironment(envId) {
  const activeTab = studioTabs[activeTabIndex] || studioTabs[0];
  const isGardenMode = activeTab && activeTab.mode === 'garden';

  if (isGardenMode) {
    // Frame the 3D Paintable Meadow Garden center-stage and sit the furry buddy on the corner cheering!
    creature.setEnvironmentScale(0.42, -3.4, -2.4);
    controls.target.set(0, 0.0, 0);
    camera.position.set(0.0, 6.2, 9.2);
    controls.minDistance = 2.8;
    controls.maxDistance = 22.0;
    controls.update();
    return;
  }

  const isDesk = envId === 'highrise';
  const isAR = envId === 'ar';
  const s = (isDesk || isAR) ? 0.25 : 1.0;
  const deskX = isDesk ? -0.14 : 0.0;
  const deskZ = isDesk ? 0.42 : 0.0;
  creature.setEnvironmentScale(s, deskX, deskZ);

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  const mobileZoomOut = isMobile
    ? Math.max(1.45, Math.min(1.95, 0.82 / Math.max(0.42, aspect)))
    : 1.0;

  if (isAR) {
    const targetY = -0.94 * (1.0 - s) + 0.05 * s;
    controls.target.set(0.0, targetY, 0.0);
    camera.position.set(0.0, 0.35, 6.2 * mobileZoomOut);
    controls.minDistance = 1.4;
    controls.maxDistance = 14.0 * mobileZoomOut;
    controls.update();
  } else {
    const targetY = -0.94 * (1.0 - s) + 0.05 * s;
    controls.target.set(deskX, targetY, deskZ);
    camera.position.set(deskX, targetY + 0.40 * s, deskZ + 6.4 * s * mobileZoomOut);
    controls.minDistance = 2.6 * s;
    controls.maxDistance = 15.0 * s * mobileZoomOut;
    controls.update();
  }
}

function applyEnvironmentPreset(envId) {
  const prevEnv = simState.environment;
  simState.environment = envId;

  if (typeof creature !== 'undefined' && creature.resetPlacement) {
    if ((prevEnv === 'ar' && envId !== 'ar') || (envId !== 'ar' && creature.isPlaced && creature.isPlaced())) {
      creature.resetPlacement(false);
    }
  }

  const envPreset = envManager.setEnvironment(envId);
  const u = furSystem.sharedUniforms;
  if (envPreset) {
    if (envPreset.keyColor !== undefined) {
      simState.keyColor = envPreset.keyColor;
    }
    simState.lightAngle = envPreset.lightAngle;
    simState.lightIntensity = envPreset.lightIntensity;
    simState.rimIntensity = envPreset.rimIntensity;
    simState.windStrength = envPreset.windStrength;
    u.uWindStrength.value = envPreset.windStrength;
  }
  envManager.setSkyTheme(simState.skyTheme);
  envManager.setSkyParams({
    cloudiness: simState.skyCloudiness,
    sparkle: simState.skySparkle,
    rainbow: simState.skyRainbow
  });

  applyCameraFramingForEnvironment(envId);
  updateLightingFromState();
}

const ALLOWED_ENV_IDS = new Set(['studio', 'meadow', 'highrise', 'ar']);
const urlEnvParam = new URLSearchParams(window.location.search).get('env');
const initialEnvId = urlEnvParam && ALLOWED_ENV_IDS.has(urlEnvParam) ? urlEnvParam : simState.environment;
applyEnvironmentPreset(initialEnvId);

function syncCurrentTabFromSimState() {
  const curTab = studioTabs[activeTabIndex];
  if (!curTab) return;
  curTab.config = {
    ...curTab.config,
    mascotName: simState.mascotName,
    baseColor: simState.baseColor,
    tipColor: simState.tipColor,
    eyeColor: simState.eyeColor,
    cheekColor: simState.cheekColor,
    earStyle: simState.earStyle,
    accessory: simState.accessory,
    skyTheme: simState.skyTheme,
    environment: simState.environment,
    furLength: simState.furLength,
    furDensity: simState.furDensity,
    curliness: simState.curliness,
    clumping: simState.clumping,
    roughness: simState.roughness,
    specular: simState.specular,
    windStrength: simState.windStrength
  };
  saveStudioTabs(studioTabs);
}

// 5. Build Right-Side Mascot, Sky & Coat Controls
const ui = createMinimalUI(uiContainer, simState, (key, value) => {
  const u = furSystem.sharedUniforms;
  switch (key) {
    case 'environment': {
      applyEnvironmentPreset(value);
      ui.syncUI();
      break;
    }
    case 'mascotName': {
      wordBubbleSystem.setMascotName(value);
      break;
    }
    case 'triggerWave': {
      creature.triggerWave(2.2);
      boopShockwave = 0.65;
      break;
    }
    case 'triggerBlink': {
      creature.triggerBlink(Math.random() > 0.45);
      break;
    }
    case 'triggerGreeting': {
      const name = simState.mascotName || 'Mr. M';
      const curVoice = getVoicePersonaById(studioTabs[activeTabIndex]?.config?.voiceId || 'sunny');
      wordBubbleSystem.speakPhrase(
        `Hi friend! I am ${name} speaking with my ${curVoice.name} voice! Let's design and learn together!`,
        true
      );
      break;
    }
    case 'earStyle': {
      creature.setMascotStyle({ earStyle: value });
      awardXP('creativity', 4);
      break;
    }
    case 'accessory': {
      creature.setMascotStyle({ accessory: value });
      awardXP('creativity', 4);
      break;
    }
    case 'eyeColor': {
      creature.setMascotStyle({ eyeColor: value });
      break;
    }
    case 'cheekColor': {
      creature.setMascotStyle({ cheekColor: value });
      break;
    }
    case 'triggerPhoneme': {
      creature.triggerVisemePose(value, 0.95, 1.0);
      awardXP('voice', 3);
      break;
    }
    case 'furReactivity': {
      creature.setFurReactivity(value);
      break;
    }
    case 'bubblesEnabled': {
      wordBubbleSystem.setBubblesEnabled(value);
      break;
    }
    case 'wordCategory': {
      wordBubbleSystem.setWordCategory(value);
      break;
    }
    case 'launchCustomWord': {
      wordBubbleSystem.launchCustomWord(value);
      awardXP('voice', 8);
      break;
    }
    case 'triggerBubbleParty': {
      wordBubbleSystem.triggerBubbleParty();
      awardXP('voice', 6);
      break;
    }
    case 'skyTheme': {
      const sky = envManager.setSkyTheme(value);
      if (sky) {
        simState.keyColor = sky.keyColor;
        simState.skySparkle = sky.sparkle;
        simState.skyRainbow = sky.rainbow;
        updateLightingFromState();
        if (simState.environment === 'studio') {
          document.body.style.background = `radial-gradient(circle at 50% 38%, ${sky.mid}44 0%, ${sky.zenith}66 55%, #060812 100%)`;
        } else {
          document.body.style.background = '';
        }
        ui.syncUI();
      }
      awardXP('creativity', 5);
      break;
    }
    case 'skyCloudiness':
    case 'skySparkle':
    case 'skyRainbow': {
      envManager.setSkyParams({
        cloudiness: simState.skyCloudiness,
        sparkle: simState.skySparkle,
        rainbow: simState.skyRainbow
      });
      break;
    }
    case 'toggleGPUFur': {
      const enabled = Boolean(value);
      simState.gpuFurEnabled = enabled;
      furSystem.setGPUFurEnabled(enabled);
      ui.setGPUFurEnabled(enabled);
      break;
    }
    case 'arToggleMirror': {
      const mirrored = envManager.toggleMirror();
      ui.setMirrorLabel(mirrored);
      break;
    }
    case 'arFlipCamera':
      envManager.flipCamera();
      break;
    case 'furLength':
      u.uFurLength.value = value;
      break;
    case 'furDensity':
      furSystem.updateDensity(value);
      break;
    case 'clumping':
      u.uClumping.value = value;
      break;
    case 'curliness':
      u.uCurliness.value = value;
      break;
    case 'baseColor':
      u.uBaseColor.value.set(value);
      creature.skinMaterial.color.set(value).multiplyScalar(0.55);
      break;
    case 'tipColor':
      u.uTipColor.value.set(value);
      break;
    case 'roughness':
      u.uRoughness.value = value;
      break;
    case 'specular':
      u.uSpecular.value = value;
      break;
    case 'keyColor':
    case 'lightAngle':
    case 'lightIntensity':
    case 'rimIntensity':
      updateLightingFromState();
      break;
    case 'windStrength':
      u.uWindStrength.value = value;
      grassGarden.setParam('windStrength', value);
      break;
    case 'arToggleTapPlace':
      tapToPlaceEnabled = Boolean(value);
      break;
    case 'arToggleLightEst': {
      const enabled = Boolean(value);
      envManager.setLightEstimationEnabled(enabled);
      break;
    }
    case 'arResetPosition':
      creature.resetPlacement();
      envManager.resetARAnchor();
      break;
    default:
      break;
  }
  syncCurrentTabFromSimState();
  if (workspaceUI) {
    workspaceUI.sync({ tabs: studioTabs, activeTabIndex, growthState });
  }
});

// Apply any tab's configuration and mode to the live 3D scene & voice system
function activateTabByIndex(index, announceVoice = true) {
  activeTabIndex = Math.max(0, Math.min(studioTabs.length - 1, index));
  const tab = studioTabs[activeTabIndex];
  if (!tab) return;

  const cfg = tab.config || {};
  simState.mascotName = cfg.mascotName || 'Mr. M';
  simState.baseColor = cfg.baseColor || '#4f35ff';
  simState.tipColor = cfg.tipColor || '#ff9ec7';
  simState.eyeColor = cfg.eyeColor || '#2563eb';
  simState.cheekColor = cfg.cheekColor || '#ff5c8a';
  simState.earStyle = cfg.earStyle || 'bunny';
  simState.accessory = cfg.accessory || 'antennae';
  simState.skyTheme = cfg.skyTheme || 'daydream';
  simState.environment = cfg.environment || 'meadow';

  // Update 3D creature & fur uniforms
  creature.setMascotStyle({
    earStyle: simState.earStyle,
    accessory: simState.accessory,
    eyeColor: simState.eyeColor,
    cheekColor: simState.cheekColor
  });
  furSystem.sharedUniforms.uBaseColor.value.set(simState.baseColor);
  furSystem.sharedUniforms.uTipColor.value.set(simState.tipColor);
  creature.skinMaterial.color.set(simState.baseColor).multiplyScalar(0.55);

  // Update voice profile
  wordBubbleSystem.setMascotName(simState.mascotName);
  wordBubbleSystem.setVoiceProfile({
    voiceId: cfg.voiceId || 'sunny',
    pitch: cfg.voicePitch,
    rate: cfg.voiceRate,
    playChime: announceVoice
  });

  // Toggle 3D Living Meadow vs Standard Mascot/Voice/Dev scene
  const isGarden = tab.mode === 'garden';
  const isDev = tab.mode === 'dev';

  grassGarden.setVisible(isGarden);
  if (isGarden) {
    if (cfg.grassPreset) {
      grassGarden.applyPreset(cfg.grassPreset);
    }
    grassGarden.setParam('brushMode', cfg.brushMode || 'grow');
    grassGarden.setParam('brushRadius', cfg.brushRadius || 1.35);
    grassGarden.setParam('bladeHeight', cfg.bladeHeight || 0.58);
  }

  // Hide floating word bubbles when in Garden or Dev mode so the canvas/meadow is clear
  wordBubbleSystem.setBubblesEnabled(!isGarden && !isDev);

  const commDock = document.getElementById('mascot-comm-dock');
  if (commDock) {
    commDock.style.display = isDev ? 'none' : '';
  }

  applyEnvironmentPreset(isGarden ? 'studio' : simState.environment);
  ui.syncUI();

  if (hudHint) {
    if (isGarden) {
      hudHint.textContent =
        '3D Living Meadow Tab: Drag on soil to paint 100,000 grass blades · Hold Shift + drag to orbit camera!';
    } else if (tab.mode === 'voice') {
      hudHint.textContent =
        'Voice & Word Lab Tab: Test 6 character voices, slide pitch & speed, or pop floating word bubbles!';
    } else if (isDev) {
      hudHint.textContent =
        'Kid Dev Blueprint Tab: Drag idea bubbles on the Mind Map, take the Builder Quest & export your code!';
    } else {
      hudHint.textContent =
        '3D Fur Buddy Tab: Pet or click your mascot to wave & boop · Customize ears, fur colors & sky on the right!';
    }
  }

  if (workspaceUI) {
    workspaceUI.sync({ tabs: studioTabs, activeTabIndex, growthState });
    if (isGarden) {
      workspaceUI.updateGardenCoverage(grassGarden.getCoveragePercentage());
    }
  }

  creature.triggerWave(2.0);
}

// Mount the 4-Tab Kids Workspace UI
workspaceUI = createKidsWorkspaceUI({
  tabs: studioTabs,
  activeTabIndex,
  growthState,
  onSelectTab(newIdx) {
    activateTabByIndex(newIdx, true);
  },
  onAddTab({ title, mode, voiceId }) {
    if (studioTabs.length >= 4) return;
    const newTab = createDefaultTab(studioTabs.length, mode, title);
    if (voiceId) {
      const vp = getVoicePersonaById(voiceId);
      newTab.config.voiceId = vp.id;
      newTab.config.voicePitch = vp.pitch;
      newTab.config.voiceRate = vp.rate;
    }
    studioTabs.push(newTab);
    saveStudioTabs(studioTabs);
    awardXP('creativity', 15);
    activateTabByIndex(studioTabs.length - 1, true);
  },
  onUpdateTab(idx, { title, mode, voiceId }) {
    const t = studioTabs[idx];
    if (!t) return;
    t.title = title || t.title;
    t.mode = mode || t.mode;
    if (voiceId) {
      const vp = getVoicePersonaById(voiceId);
      t.config.voiceId = vp.id;
      t.config.voicePitch = vp.pitch;
      t.config.voiceRate = vp.rate;
    }
    saveStudioTabs(studioTabs);
    awardXP('creativity', 8);
    activateTabByIndex(idx, true);
  },
  onDeleteTab(idx) {
    if (studioTabs.length <= 1) return;
    studioTabs.splice(idx, 1);
    saveStudioTabs(studioTabs);
    const nextIdx = Math.min(activeTabIndex, studioTabs.length - 1);
    activateTabByIndex(nextIdx, false);
  },
  onVoiceChange({ voiceId, pitch, rate, samplePhrase }) {
    saveStudioTabs(studioTabs);
    saveGrowthState(growthState);
    wordBubbleSystem.setVoiceProfile({ voiceId, pitch, rate, playChime: !samplePhrase });
    if (samplePhrase) {
      wordBubbleSystem.speakPhrase(samplePhrase, true);
    }
  },
  onSpeakText(text) {
    saveStudioTabs(studioTabs);
    saveGrowthState(growthState);
    wordBubbleSystem.speakPhrase(text, true);
  },
  onGardenAction(actionKey, val) {
    saveStudioTabs(studioTabs);
    if (actionKey === 'fillMeadow') {
      grassGarden.fillFullMeadow();
      workspaceUI.updateGardenCoverage(grassGarden.getCoveragePercentage());
      wordBubbleSystem.speakPhrase('Full meadow bloom! Look at all one hundred thousand grass blades dancing in the sun!', false);
    } else if (actionKey === 'clearMeadow') {
      grassGarden.clearMeadow();
      workspaceUI.updateGardenCoverage(grassGarden.getCoveragePercentage());
    } else if (actionKey === 'preset') {
      grassGarden.applyPreset(val);
    } else {
      grassGarden.setParam(actionKey, val);
    }
  },
  onAwardXP: awardXP
});

activateTabByIndex(0, false);

let tapToPlaceEnabled = true;

envManager.onARStatusChange((statusText, isLive) => {
  ui.setARStatus(statusText, isLive);
});

envManager.onPlaneDetected((planeInfo) => {
  ui.setARPlaneStatus(
    planeInfo.surfaceType,
    planeInfo.planeY,
    planeInfo.confidence,
    planeInfo.featureCount
  );
});

envManager.onLightEstimated((lightInfo) => {
  if (simState.environment !== 'ar') return;
  if (!lightInfo.isManualReset && !envManager.isLightEstimationEnabled()) return;
  simState.keyColor = lightInfo.keyColor;
  simState.lightAngle = lightInfo.lightAngle;
  simState.lightIntensity = lightInfo.lightIntensity;
  simState.rimIntensity = lightInfo.rimIntensity;
  updateLightingFromState();
  ui.setARLightStatus(lightInfo);
});

// 6. Interactive 3D Pointer Raycasting for Mascot Petting/Booping AND 3D Grass Painting
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2(0, 0);
const pointerLocalPos = new THREE.Vector3(0, 0, 2);
const prevPointerLocalPos = new THREE.Vector3(0, 0, 2);
const pointerVelocity = new THREE.Vector3(0, 0, 0);
let isPointerOverCreature = false;
let pointerDownPos = { x: 0, y: 0 };

// Grass painting pointer state
const currentBrushUV = new THREE.Vector2(0.5, 0.5);
const prevBrushUV = new THREE.Vector2(0.5, 0.5);
let isHoveringGardenDirt = false;
let isPaintingGardenStroke = false;
let strokeAwardCounter = 0;

function isEventOnUIOverlay(e) {
  return Boolean(
    e.target &&
    typeof e.target.closest === 'function' &&
    (e.target.closest('#ui-root') ||
      e.target.closest('#kids-studio-topbar') ||
      e.target.closest('#kids-narrator-menu') ||
      e.target.closest('#kids-mode-deck') ||
      e.target.closest('#kids-studio-modal') ||
      e.target.closest('#page-nav') ||
      e.target.closest('#scene-nav') ||
      e.target.closest('#mobile-controls-btn') ||
      e.target.closest('#mobile-sheet-backdrop') ||
      e.target.closest('#word-stage-card') ||
      e.target.closest('#spelling-stage-card') ||
      e.target.closest('#speech-dock') ||
      e.target.closest('#mascot-comm-dock') ||
      e.target.closest('.word-bubble') ||
      e.target.closest('.floating-word-bubble'))
  );
}

window.addEventListener('pointermove', (e) => {
  if (isEventOnUIOverlay(e)) {
    isPointerOverCreature = false;
    isHoveringGardenDirt = false;
    grassGarden.sharedUniforms.uBrushActive.value = 0.0;
    return;
  }
  pointerNDC.x = (e.clientX / window.innerWidth) * 2.0 - 1.0;
  pointerNDC.y = -(e.clientY / window.innerHeight) * 2.0 + 1.0;

  raycaster.setFromCamera(pointerNDC, camera);

  // Check if in 3D Living Meadow mode and hovering dirt patch
  if (grassGarden.group.visible) {
    const dirtHits = raycaster.intersectObject(grassGarden.dirtMesh, false);
    if (dirtHits.length > 0 && dirtHits[0].uv) {
      prevBrushUV.copy(currentBrushUV);
      currentBrushUV.copy(dirtHits[0].uv);
      grassGarden.sharedUniforms.uBrushUV.value.copy(currentBrushUV);
      grassGarden.sharedUniforms.uBrushActive.value = 1.0;
      isHoveringGardenDirt = true;
      container.style.cursor = 'crosshair';

      if (isPaintingGardenStroke) {
        grassGarden.applyInterpolatedStroke(prevBrushUV, currentBrushUV);
        strokeAwardCounter++;
        if (strokeAwardCounter % 18 === 0) {
          workspaceUI.updateGardenCoverage(grassGarden.getCoveragePercentage());
          awardXP('nature', 2);
        }
      }
      return;
    } else {
      isHoveringGardenDirt = false;
      grassGarden.sharedUniforms.uBrushActive.value = 0.0;
    }
  }

  const hits = raycaster.intersectObject(creature.bodyMesh, false);
  if (hits.length > 0) {
    prevPointerLocalPos.copy(pointerLocalPos);
    pointerLocalPos.copy(hits[0].point);
    creature.root.worldToLocal(pointerLocalPos);

    if (isPointerOverCreature) {
      pointerVelocity.subVectors(pointerLocalPos, prevPointerLocalPos).multiplyScalar(32.0);
    }
    isPointerOverCreature = true;
    container.style.cursor = 'pointer';
    if (simState.environment === 'ar') {
      envManager.updateARCursor(pointerNDC.x, pointerNDC.y, false);
    }
  } else {
    isPointerOverCreature = false;
    pointerVelocity.multiplyScalar(0.5);
    container.style.cursor = 'grab';
    if (simState.environment === 'ar' && tapToPlaceEnabled) {
      envManager.updateARCursor(pointerNDC.x, pointerNDC.y, true);
    }
  }
});

window.addEventListener('pointerdown', (e) => {
  pointerDownPos.x = e.clientX;
  pointerDownPos.y = e.clientY;
  if (isEventOnUIOverlay(e)) {
    return;
  }
  if (grassGarden.group.visible && isHoveringGardenDirt && e.button === 0 && !e.shiftKey && !e.altKey && !e.metaKey) {
    isPaintingGardenStroke = true;
    controls.enabled = false;
    prevBrushUV.copy(currentBrushUV);
    grassGarden.applyInterpolatedStroke(currentBrushUV, currentBrushUV);
    workspaceUI.updateGardenCoverage(grassGarden.getCoveragePercentage());
    return;
  }
  if (isPointerOverCreature) {
    controls.enabled = false;
  }
});

window.addEventListener('pointerup', (e) => {
  if (isPaintingGardenStroke) {
    isPaintingGardenStroke = false;
    controls.enabled = true;
    workspaceUI.updateGardenCoverage(grassGarden.getCoveragePercentage());
    awardXP('nature', 4);
    return;
  }
  controls.enabled = true;
  const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  if (moveDist < 6) {
    if (isEventOnUIOverlay(e)) {
      return;
    }
    if (isPointerOverCreature) {
      creature.triggerBoop();
      boopShockwave = 1.0;
      awardXP('creativity', 3);
    } else if (simState.environment === 'ar' && tapToPlaceEnabled) {
      const planeHit = envManager.estimatePlaneAt(pointerNDC.x, pointerNDC.y);
      if (planeHit && planeHit.point) {
        pointerNDC.set(0, 0);
        creature.placeAt(planeHit.point, planeHit.normal, true, camera.position);
        envManager.triggerPlacementPulse(planeHit.point);
      }
    }
  }
});

let targetDPR = Math.min(window.devicePixelRatio || 1, 2);
let currentDPR = targetDPR;
let wasMobileViewport = window.matchMedia('(max-width: 768px)').matches;

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(currentDPR);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const isMobileNow = window.matchMedia('(max-width: 768px)').matches;
  if (isMobileNow || isMobileNow !== wasMobileViewport) {
    wasMobileViewport = isMobileNow;
    applyCameraFramingForEnvironment(simState.environment);
  }
});

// 7. Zero-GC Real-Time Render Loop
const clock = new THREE.Clock();
let elapsedTime = 0.0;
const webglInertiaDisp = new THREE.Vector3(0, 0, 0);
const webglInertiaVel = new THREE.Vector3(0, 0, 0);
const webglForceTmp = new THREE.Vector3(0, 0, 0);

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.033);
  elapsedTime += dt;

  controls.update();

  if (isPaintingGardenStroke && isHoveringGardenDirt && grassGarden.group.visible) {
    grassGarden.stampAtCurrentUV(currentBrushUV, dt);
  }

  grassGarden.update(elapsedTime, simState.windStrength);

  if (boopShockwave > 0.001) {
    boopShockwave *= Math.exp(-dt * 2.8);
  } else {
    boopShockwave = 0.0;
  }

  pointerVelocity.multiplyScalar(Math.exp(-dt * 12.0));

  wordBubbleSystem.update(dt);
  creature.update(dt, pointerNDC, camera.position, simState.environment === 'ar');
  envManager.update(elapsedTime, simState.windStrength, creature.root);

  let physicsTexture = gpuPhysics.fallbackTexture;
  if (simState.gpuFurEnabled) {
    physicsTexture = gpuPhysics.step({
      time: elapsedTime,
      dt,
      windStrength: simState.windStrength,
      creatureVelocity: creature.animState.velocity,
      creatureAngularVel: creature.animState.angularVelocity,
      pointerLocalPos,
      pointerVelocity,
      pointerActive: isPointerOverCreature,
      boopShockwave,
      facialMorphVel: creature.animState.facialMorphVel,
      facialMorphState: creature.animState.facialMorphState
    });
  } else {
    webglForceTmp.set(0, -0.32, 0);
    webglForceTmp.addScaledVector(creature.animState.velocity, -1.65);
    webglForceTmp.y -= creature.animState.facialMorphVel.x * 2.4;
    webglForceTmp.z += creature.animState.facialMorphVel.z * 2.2;
    if (isPointerOverCreature) {
      webglForceTmp.addScaledVector(pointerVelocity, 0.85);
    }
    webglForceTmp.addScaledVector(webglInertiaDisp, -24.0);
    webglInertiaVel.addScaledVector(webglForceTmp, dt);
    webglInertiaVel.multiplyScalar(Math.exp(-5.5 * dt));
    webglInertiaDisp.addScaledVector(webglInertiaVel, dt);
    if (webglInertiaDisp.lengthSq() > 0.64) {
      webglInertiaDisp.normalize().multiplyScalar(0.8);
    }
  }

  const u = furSystem.sharedUniforms;
  u.uPhysicsTex.value = physicsTexture;
  u.uTime.value = elapsedTime;
  u.uPointerLocalPos.value.copy(pointerLocalPos);
  u.uPointerActive.value = isPointerOverCreature ? 1.0 : 0.0;
  u.uWebGLInertia.value.copy(webglInertiaDisp);
  u.uBoopShockwave.value = boopShockwave;

  u.uTalkMorph.value = creature.animState.talkMorph;
  u.uTalkSmile.value = creature.animState.talkSmile;
  u.uWaveAmount.value = creature.animState.waveAmount;
  u.uWavePhase.value = creature.animState.wavePhase;
  u.uEarBounce.value = creature.animState.earBounce;
  u.uEarStyle.value = creature.animState.earStyleCode;
  u.uVisemeWeightsA.value.copy(creature.animState.visemeWeightsA);
  u.uVisemeWeightsB.value.copy(creature.animState.visemeWeightsB);
  u.uFacialMorphVel.value.copy(creature.animState.facialMorphVel);

  if (ui && typeof ui.updatePhonemeTelemetry === 'function') {
    ui.updatePhonemeTelemetry(creature.getPhonemeTelemetry());
  }

  renderer.render(scene, camera);
}

animate();
