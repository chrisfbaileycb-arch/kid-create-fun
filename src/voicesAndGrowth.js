// Kids Voice Personas, Growth Progression & 4-Tab Project Workspace State
// Pure safe state & Web Audio / Speech helpers for the Kids Interactive Design Studio

export const VOICE_PERSONAS = [
  {
    id: 'sunny',
    name: 'Sunny Sprout',
    role: 'Cheerful Playmate',
    pitch: 1.26,
    rate: 0.96,
    oscType: 'triangle',
    chordNotes: [523.25, 659.25, 783.99, 1046.5],
    voicePattern: /(google|samantha|victoria|zira|natural|female|child)/i,
    samplePhrase: 'Hi friend! I love designing colorful fur coats and spelling big dream words with you!',
    funFact: 'Higher pitch means faster sound vibrations! Sunny vibrates at a bright, happy frequency.'
  },
  {
    id: 'owl',
    name: 'Professor Hoot',
    role: 'Wise Science Guide',
    pitch: 0.88,
    rate: 0.91,
    oscType: 'sine',
    chordNotes: [392.0, 493.88, 587.33, 783.99],
    voicePattern: /(daniel|alex|david|fred|male|uk|british)/i,
    samplePhrase: 'Hoot hoot! Did you know sunlight and water help every blade of grass grow tall and green?',
    funFact: 'Calm, steady speech helps our brains hear every single consonant and vowel sound clearly!'
  },
  {
    id: 'robot',
    name: 'Sparky Bot',
    role: 'Coding & Maker Helper',
    pitch: 1.48,
    rate: 1.06,
    oscType: 'square',
    chordNotes: [587.33, 783.99, 880.0, 1174.66],
    voicePattern: /(google|trinoids|zarvox|albert|reed|english)/i,
    samplePhrase: 'Beep boop! Ready to turn your creative ideas into awesome developer blueprints and code!',
    funFact: 'Robots synthesize speech by combining tiny sound building blocks called phonemes!'
  },
  {
    id: 'cosmic',
    name: 'Captain Nova',
    role: 'Star & Sky Explorer',
    pitch: 1.08,
    rate: 0.98,
    oscType: 'sine',
    chordNotes: [440.0, 554.37, 659.25, 830.61],
    voicePattern: /(karen|moira|tessa|samantha|google)/i,
    samplePhrase: 'Three, two, one, blast off! Let us paint a glowing aurora sky and explore the stars!',
    funFact: 'In outer space there is no air for sound waves, so astronauts use radio waves to talk!'
  },
  {
    id: 'fairy',
    name: 'Willow Breeze',
    role: 'Gentle Garden Storyteller',
    pitch: 1.38,
    rate: 0.92,
    oscType: 'triangle',
    chordNotes: [523.25, 659.25, 783.99, 987.77],
    voicePattern: /(fiona|victoria|samantha|female|natural)/i,
    samplePhrase: 'Listen closely to the gentle breeze! Every flower and word starts as a tiny seed.',
    funFact: 'Soft, musical voices use smooth sine and triangle sound waves that feel relaxing to our ears.'
  },
  {
    id: 'dino',
    name: 'Barnaby Dino',
    role: 'Friendly Gentle Giant',
    pitch: 0.70,
    rate: 0.86,
    oscType: 'triangle',
    chordNotes: [261.63, 329.63, 392.0, 523.25],
    voicePattern: /(fred|ralph|daniel|david|male)/i,
    samplePhrase: 'Roar-hello little inventor! Big dreams grow one small step at a time!',
    funFact: 'Big animals have longer vocal cords, which make deeper, lower-frequency bass sounds!'
  }
];

export const GROWTH_STAGES = [
  {
    level: 1,
    title: 'Curious Seed',
    minXP: 0,
    nextXP: 50,
    summary: 'Planting your first creative ideas, colors, and words!'
  },
  {
    level: 2,
    title: 'Creative Sprout',
    minXP: 50,
    nextXP: 130,
    summary: 'Growing your 3D world with voices, fur physics, and living meadow grass!'
  },
  {
    level: 3,
    title: 'Blooming Designer',
    minXP: 130,
    nextXP: 240,
    summary: 'Combining character design, nature science, and story voices across tabs!'
  },
  {
    level: 4,
    title: 'Kid Dev Master',
    minXP: 240,
    nextXP: 400,
    summary: 'Turning imagination into real developer blueprints, mind maps, and code!'
  }
];

export const DESIGN_TAB_MODES = [
  {
    id: 'mascot',
    label: '3D Fur Buddy',
    shortDesc: 'Design a 3D furry mascot, ears, coat colors & cozy sky',
    defaultTitle: 'My 3D Fur Buddy'
  },
  {
    id: 'garden',
    label: '3D Living Meadow',
    shortDesc: 'Paint 100,000 3D grass blades, flowers, sunlight & wind',
    defaultTitle: 'Sprout Meadow'
  },
  {
    id: 'voice',
    label: 'Voice & Word Lab',
    shortDesc: 'Experiment with 6 character voices, phonics & lip-sync stories',
    defaultTitle: 'Voice & Word Lab'
  },
  {
    id: 'dev',
    label: 'Kid Dev Studio',
    shortDesc: 'Map ideas, take the Builder Quest & export real project code',
    defaultTitle: 'Kid Dev Blueprint'
  }
];

const TABS_STORAGE_KEY = 'ids_kids_studio_tabs_v1';
const GROWTH_STORAGE_KEY = 'ids_kids_growth_state_v1';

export function getVoicePersonaById(voiceId) {
  return VOICE_PERSONAS.find((v) => v.id === voiceId) || VOICE_PERSONAS[0];
}

export function playPersonaChime(voiceId = 'sunny') {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!window.__kidsStudioAudioCtx) {
      window.__kidsStudioAudioCtx = new AudioContextClass();
    }
    const ctx = window.__kidsStudioAudioCtx;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const persona = getVoicePersonaById(voiceId);
    const now = ctx.currentTime;
    persona.chordNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = persona.oscType || 'triangle';
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t0 = now + idx * 0.065;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.085, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.24);
      osc.start(t0);
      osc.stop(t0 + 0.25);
    });
  } catch (_e) {
    // Ignore audio context autoplay restrictions
  }
}

export function createDefaultTab(index, modeId = 'mascot', customTitle = '') {
  const modeInfo = DESIGN_TAB_MODES.find((m) => m.id === modeId) || DESIGN_TAB_MODES[0];
  const presetsBySlot = [
    {
      mascotName: 'Mr. M',
      baseColor: '#4f35ff',
      tipColor: '#ff9ec7',
      eyeColor: '#2563eb',
      cheekColor: '#ff5c8a',
      earStyle: 'bunny',
      accessory: 'antennae',
      skyTheme: 'daydream',
      environment: 'meadow',
      voiceId: 'sunny',
      voicePitch: 1.26,
      voiceRate: 0.96,
      grassPreset: 'Spring Meadow',
      grassBaseColor: '#14532d',
      grassTipColor: '#86efac',
      bladeHeight: 0.58,
      bladeDensity: 0.9,
      brushMode: 'grow',
      brushRadius: 1.2,
      storySentence: 'Dream big and shine bright like a friendly star!'
    },
    {
      mascotName: 'Sprout',
      baseColor: '#065f46',
      tipColor: '#86efac',
      eyeColor: '#059669',
      cheekColor: '#fb7185',
      earStyle: 'bear',
      accessory: 'halo',
      skyTheme: 'meadow_bloom',
      environment: 'meadow',
      voiceId: 'fairy',
      voicePitch: 1.38,
      voiceRate: 0.92,
      grassPreset: 'Spring Meadow',
      grassBaseColor: '#14532d',
      grassTipColor: '#86efac',
      bladeHeight: 0.64,
      bladeDensity: 0.92,
      brushMode: 'grow',
      brushRadius: 1.35,
      storySentence: 'Every tiny seed grows with warm sunshine and kindness!'
    },
    {
      mascotName: 'Nova',
      baseColor: '#1e1b4b',
      tipColor: '#67e8f9',
      eyeColor: '#7c3aed',
      cheekColor: '#f472b6',
      earStyle: 'round',
      accessory: 'amulet',
      skyTheme: 'starlight',
      environment: 'studio',
      voiceId: 'cosmic',
      voicePitch: 1.08,
      voiceRate: 0.98,
      grassPreset: 'Cyber Grove',
      grassBaseColor: '#0f172a',
      grassTipColor: '#38bdf8',
      bladeHeight: 0.54,
      bladeDensity: 0.9,
      brushMode: 'comb',
      brushRadius: 1.2,
      storySentence: 'We can explore the galaxy with curiosity and wonder!'
    },
    {
      mascotName: 'Sparky',
      baseColor: '#d97706',
      tipColor: '#fef08a',
      eyeColor: '#0284c7',
      cheekColor: '#fb7185',
      earStyle: 'puppy',
      accessory: 'antennae',
      skyTheme: 'sunset',
      environment: 'highrise',
      voiceId: 'robot',
      voicePitch: 1.48,
      voiceRate: 1.05,
      grassPreset: 'Golden Steppe',
      grassBaseColor: '#5c3a11',
      grassTipColor: '#fde047',
      bladeHeight: 0.68,
      bladeDensity: 0.88,
      brushMode: 'grow',
      brushRadius: 1.2,
      storySentence: 'Imagine it, plan it on the mind map, and build the code!'
    }
  ];

  const slotTemplate = presetsBySlot[index % presetsBySlot.length];
  return {
    id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: (customTitle || modeInfo.defaultTitle).slice(0, 22),
    mode: modeInfo.id,
    createdAt: new Date().toISOString(),
    config: {
      ...slotTemplate,
      furLength: 0.32,
      furDensity: 0.78,
      roughness: 0.75,
      specular: 0.28,
      clumping: 0.35,
      curliness: 0.25,
      windStrength: 0.75,
      lightAngle: -42,
      lightIntensity: 1.55,
      rimIntensity: 1.45,
      wordCategory: 'dreamer'
    }
  };
}

export function loadStudioTabs() {
  try {
    const raw = localStorage.getItem(TABS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 1 && parsed.length <= 4) {
        return parsed;
      }
    }
  } catch (_e) {
    // Fallback to starter tabs
  }
  return [
    createDefaultTab(0, 'mascot', '1. Fur Buddy Studio'),
    createDefaultTab(1, 'garden', '2. 3D Meadow Garden'),
    createDefaultTab(2, 'voice', '3. Voice & Word Lab'),
    createDefaultTab(3, 'dev', '4. Kid Dev Blueprint')
  ];
}

export function saveStudioTabs(tabs) {
  try {
    const clamped = Array.isArray(tabs) ? tabs.slice(0, 4) : [];
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(clamped));
  } catch (_e) {
    // Ignore storage quota errors
  }
}

export const IMAGINE_DESIGN_STEPS = [
  {
    id: 'spark',
    stepNumber: 1,
    title: 'Spark & Imagine',
    shortLabel: '1. Spark Idea',
    targetMode: 'mascot',
    pillar: 'creativity',
    challenge: 'Pick a fun name, ear shape, and crown accessory for your 3D buddy!',
    scripts: {
      sunny:
        'Step 1: Spark and Imagine! Every great invention starts with a playful question: Who is your furry friend today? Try picking Bunny or Bear ears and giving {mascot} a Star Bopper crown!',
      owl:
        'Hoot hoot! Welcome to Step 1 of the Imagine process: Observation and Identity. Let us decide what kind of creature {mascot} will be. Notice how changing the ear silhouette transforms their whole personality!',
      robot:
        'Beep boop! Initializing Imagine Step 1: Character Concept! Input a cool name for {mascot} and select an ear geometry module on the right panel!',
      cosmic:
        'Mission Step 1: Spark your cosmic imagination! Imagine {mascot} landing on a friendly new planet. Which ears and glowing accessory will help them explore?',
      fairy:
        'Welcome to Step 1, little dreamer. Close your eyes for a second and imagine {mascot} waking up in an enchanted cloud. Choose a gentle ear shape and a dreamy halo to begin.',
      dino:
        'Roar-some! Step 1 is all about big imagination! Give {mascot} a bold name, pick your favorite ears, and tap your buddy to see a friendly wave!'
    }
  },
  {
    id: 'colors',
    stepNumber: 2,
    title: 'Dream Colors & Sky',
    shortLabel: '2. Coat & Sky',
    targetMode: 'mascot',
    pillar: 'creativity',
    challenge: 'Mix a Root Fur color and Tip Fur color, then pick a Cozy Sky theme!',
    scripts: {
      sunny:
        'Step 2: Dream Colors and Sky! Look at how {mascot} has two fur colors—one at the roots and one at the tips! Try mixing a bright color combo and picking a Cotton Candy or Rainbow sky!',
      owl:
        'Step 2: Light and Color Optics! When sunlight hits {mascot}, sixty thousand tiny fur strands scatter the light. Experiment with the Root and Tip colors and observe how the rim light glows!',
      robot:
        'Step 2: Shader Color Calibration! Adjust the Root Fur hex color, Tip Fur color, and Cozy Sky atmosphere sliders to compute a custom 3D look for {mascot}!',
      cosmic:
        'Step 2: Atmosphere and Starlight! Let us wrap {mascot} in galaxy colors and dial up the Starlight Twinkle and Rainbow Arc in the sky!',
      fairy:
        'Step 2: Painting with soft colors. Blend a cozy root color with a pastel tip color for {mascot}, and watch the fluffy clouds drift across the sky.',
      dino:
        'Step 2: Stomp into big, bright colors! Try giving {mascot} a golden or berry coat and slide the Wind Breeze to watch all the fur dance!'
    }
  },
  {
    id: 'meadow',
    stepNumber: 3,
    title: 'Sprout the 3D World',
    shortLabel: '3. 3D Meadow',
    targetMode: 'garden',
    pillar: 'nature',
    challenge: 'Switch to a 3D Living Meadow tab and drag across the soil to grow grass!',
    scripts: {
      sunny:
        'Step 3: Sprout your 3D World! Let us paint a living meadow for {mascot}! Drag your brush across the soil to sprout one hundred thousand blades of 3D grass and colorful flowers!',
      owl:
        'Step 3: Ecosystem and Plant Growth! In our 3D Living Meadow, you can paint grass blades, comb the wind direction, and test how golden sunlight helps plants flourish!',
      robot:
        'Step 3: GPU Terrain Instancing! Paint directly onto the 3D soil mesh to spawn up to one hundred thousand real-time grass blades at sixty frames per second!',
      cosmic:
        'Step 3: Terraforming your planet! Use the Grow Grass and Swirl Wind brushes to turn bare soil into a glowing Starlight Mint or Spring Meadow!',
      fairy:
        'Step 3: Whispering Meadow magic. Gently brush across the earth to awaken emerald grass blades and little blossoms while {mascot} cheers for you.',
      dino:
        'Step 3: Dino Garden time! Paint tall, lush grass all across the meadow, or use the Clear Path brush to make secret dinosaur trails!'
    }
  },
  {
    id: 'voice',
    stepNumber: 4,
    title: 'Voice, Phonics & Words',
    shortLabel: '4. Voice & Words',
    targetMode: 'voice',
    pillar: 'voice',
    challenge: 'Pop a floating word bubble or test the Pitch & Speed sliders in the Voice Lab!',
    scripts: {
      sunny:
        'Step 4: Voice and Words! Now let us give {mascot} something wonderful to say! Pop a floating word bubble to spell together, or type your own story sentence!',
      owl:
        'Step 4: Acoustics and Phonetics! Notice how changing the Pitch slider changes sound frequency, and watch how {mascot} moves their jaw and lips for every vowel and consonant sound!',
      robot:
        'Step 4: Audio-Viseme Synchronization! Test the twelve phoneme buttons or launch a custom spelling word bubble to see 8-channel facial morph targets in action!',
      cosmic:
        'Step 4: Cosmic Communications! Send a message across the stars by typing a story or popping floating word bubbles with {mascot}!',
      fairy:
        'Step 4: Singing words and gentle stories. Tap any floating bubble to hear each letter spelled aloud, and watch {mascot} smile as they speak.',
      dino:
        'Step 4: Big Voices and Fun Words! Try sliding the pitch low like a dinosaur or high like a sprout, and pop a word bubble for a Bubble Party!'
    }
  },
  {
    id: 'build',
    stepNumber: 5,
    title: 'Kid Dev Blueprint & Code',
    shortLabel: '5. Dev Blueprint',
    targetMode: 'dev',
    pillar: 'maker',
    challenge: 'Drag idea nodes on the Mind-Map, complete the Builder Quest, and inspect your code!',
    scripts: {
      sunny:
        'Step 5: Build and Share! You are a real Kid Developer now! Connect your big ideas on the Mind-Map, sign the Kid Inventor Promise, and explore the real code behind your {tabTitle} design!',
      owl:
        'Step 5: Engineering and Architecture! Here in the Kid Dev Studio, we organize our thoughts on a Mind-Map, verify our design choices in the Builder Quest, and inspect real JSON and HTML code!',
      robot:
        'Step 5: Code Compilation Complete! Open the Kid Dev Studio to drag force-directed idea nodes, run the Builder Quest diagnostics, and export your project files!',
      cosmic:
        'Step 5: Mission Blueprint Ready! Map out your constellation of ideas on the canvas and download your playable HTML maker card to share with your crew!',
      fairy:
        'Step 5: Weaving your story into code. See how every color, voice, and meadow you imagined turns into a real developer blueprint you can keep forever.',
      dino:
        'Step 5: Master Builder Roar! Check out the Mind-Map, sign your Kid Inventor Promise Seal, and see how your big imagination became real computer code!'
    }
  }
];

export function buildImagineStepNarration(voiceId, stepId, activeTab) {
  const step =
    IMAGINE_DESIGN_STEPS.find((s) => s.id === stepId) || IMAGINE_DESIGN_STEPS[0];
  const persona = getVoicePersonaById(voiceId);
  const mascotName = activeTab?.config?.mascotName || 'Mr. M';
  const tabTitle = activeTab?.title || 'Dream Studio';
  const template =
    (step.scripts && step.scripts[persona.id]) ||
    step.scripts.sunny ||
    persona.samplePhrase;
  return template
    .replace(/\{mascot\}/g, mascotName)
    .replace(/\{tabTitle\}/g, tabTitle);
}

export function loadGrowthState() {
  const defaultGrowth = {
    xp: 35,
    stars: 3,
    creativity: 40,
    nature: 35,
    voice: 45,
    maker: 30,
    narratorVoiceId: 'sunny',
    narratorAutoGuide: true,
    imagineStepIndex: 0,
    completedImagineSteps: [],
    pledgeSigned: false,
    inventorName: 'Young Inventor',
    questAnswers: {
      'q-audience': 'opt-readers',
      'q-habitat': 'opt-meadow',
      'q-voice': 'opt-sunny',
      'q-promise': 'opt-kindness'
    },
    mindMapNodes: [
      { id: 'n-hero', label: '3D Fur Buddy', role: 'Character Design', x: 0.24, y: 0.32, color: '#818cf8', note: 'Soft 3D fur coat, expressive ears, and friendly wave animations.' },
      { id: 'n-voice', label: '6 Fun Voices', role: 'Speech & Phonics', x: 0.52, y: 0.22, color: '#f472b6', note: 'Changes pitch, speed, and mouth visemes so kids can hear every letter sound.' },
      { id: 'n-garden', label: 'Living 3D Meadow', role: 'Nature Growth', x: 0.78, y: 0.36, color: '#34d399', note: '100,000 paintable 3D grass blades that grow with sunlight and gentle wind.' },
      { id: 'n-words', label: 'Word Bubbles', role: 'Spelling Play', x: 0.26, y: 0.72, color: '#fbbf24', note: 'Pop floating word bubbles to spell starter, dreamer, and explorer words!' },
      { id: 'n-promise', label: 'Kindness Promise', role: 'Safe Learning', x: 0.54, y: 0.76, color: '#38bdf8', note: 'Our kid maker rule: always build helpful, kind, and encouraging tools.' },
      { id: 'n-code', label: 'Kid Dev Code', role: 'Blueprint Export', x: 0.80, y: 0.70, color: '#a78bfa', note: 'Turns our 4 design tabs into real JSON & HTML files we can share!' }
    ]
  };

  try {
    const raw = localStorage.getItem(GROWTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaultGrowth,
        ...parsed,
        completedImagineSteps: Array.isArray(parsed.completedImagineSteps)
          ? parsed.completedImagineSteps
          : defaultGrowth.completedImagineSteps,
        questAnswers: { ...defaultGrowth.questAnswers, ...(parsed.questAnswers || {}) },
        mindMapNodes: Array.isArray(parsed.mindMapNodes) && parsed.mindMapNodes.length > 0
          ? parsed.mindMapNodes
          : defaultGrowth.mindMapNodes
      };
    }
  } catch (_e) {
    // Ignore storage read errors
  }
  return defaultGrowth;
}

export function saveGrowthState(state) {
  try {
    localStorage.setItem(GROWTH_STORAGE_KEY, JSON.stringify(state));
  } catch (_e) {
    // Ignore storage errors
  }
}

export function getGrowthStage(xp) {
  const num = Number(xp) || 0;
  for (let i = GROWTH_STAGES.length - 1; i >= 0; i--) {
    if (num >= GROWTH_STAGES[i].minXP) {
      return GROWTH_STAGES[i];
    }
  }
  return GROWTH_STAGES[0];
}
