// Kids Maker & Dev Process Studio (Refactored from Director Mind-Map, Inquest & Deliverables)
// Turns the orchestration suite into an age-appropriate, super fun 3-Step Kid Maker & Dev Lab:
// 1. Idea Mind-Map Canvas (Interactive draggable idea bubbles & voice read-aloud)
// 2. Builder Discovery Quest & Kindness Pledge (4-stage quiz + live learning growth bars)
// 3. Kid Dev Blueprints & Code Exporter (Real JSON, Markdown & playable HTML app cards)

import { VOICE_PERSONAS, getGrowthStage, playPersonaChime } from './voicesAndGrowth.js';

export const KID_BUILDER_QUEST = [
  {
    id: 'q-audience',
    stepTitle: 'Step 1 · Who Is Your Creation Helping?',
    question: 'Every great designer starts with a goal! Who will play and learn with your creation today?',
    options: [
      {
        id: 'opt-readers',
        label: 'Word & Story Explorers',
        desc: 'Kids learning to sound out letters, phonemes, and magical story words!',
        boost: 'Words & Voices +25%',
        scores: { creativity: 20, nature: 15, voice: 30, maker: 20 }
      },
      {
        id: 'opt-botanists',
        label: 'Nature & Garden Scientists',
        desc: 'Curious minds discovering how sunlight, soil, and breeze help meadows grow!',
        boost: 'Nature Science +25%',
        scores: { creativity: 20, nature: 30, voice: 15, maker: 20 }
      },
      {
        id: 'opt-artists',
        label: '3D Character & Color Artists',
        desc: 'Creative makers mixing root-to-tip fur gradients, ears, and cozy skies!',
        boost: 'Design & Color +25%',
        scores: { creativity: 30, nature: 20, voice: 20, maker: 15 }
      },
      {
        id: 'opt-coders',
        label: 'Junior Game & Code Builders',
        desc: 'Future developers who want to see how 3D shaders and code blueprints work!',
        boost: 'Maker Logic +25%',
        scores: { creativity: 20, nature: 15, voice: 20, maker: 30 }
      }
    ]
  },
  {
    id: 'q-habitat',
    stepTitle: 'Step 2 · Where Does Your Creation Live?',
    question: 'Choose the main 3D habitat and science environment for your project:',
    options: [
      {
        id: 'opt-meadow',
        label: 'Sunny Living Meadow (100k Grass Blades)',
        desc: 'A lush outdoor biome where every brush stroke sprouts living 3D grass!',
        boost: 'Photosynthesis Lab',
        scores: { creativity: 22, nature: 30, voice: 18, maker: 22 }
      },
      {
        id: 'opt-sky',
        label: 'Starlight & Rainbow Studio',
        desc: 'A glowing studio stage with customizable clouds, rainbows, and rim lights.',
        boost: 'Light & Optics Lab',
        scores: { creativity: 28, nature: 20, voice: 22, maker: 22 }
      },
      {
        id: 'opt-ar',
        label: 'Live AR Camera Room',
        desc: 'Brings your 3D mascot right onto your real-world desk to talk and wave!',
        boost: 'Spatial AR Tech',
        scores: { creativity: 25, nature: 18, voice: 22, maker: 28 }
      }
    ]
  },
  {
    id: 'q-voice',
    stepTitle: 'Step 3 · How Does Your Creation Communicate?',
    question: 'Pick the primary voice & sound style that helps kids learn best:',
    options: [
      {
        id: 'opt-sunny',
        label: 'Cheerful Storyteller & Spelling Chimes',
        desc: 'Warm, encouraging voice with musical harp notes for every letter tile!',
        boost: 'Phonics Confidence',
        scores: { creativity: 24, nature: 20, voice: 30, maker: 20 }
      },
      {
        id: 'opt-owl',
        label: 'Wise Owl Science & Nature Narrator',
        desc: 'Calm, clear pronunciation with fun science facts about sound and plants.',
        boost: 'Science Vocabulary',
        scores: { creativity: 20, nature: 28, voice: 28, maker: 22 }
      },
      {
        id: 'opt-robot',
        label: 'Sparky Bot Coding & Phoneme Synth',
        desc: 'Playful robot helper that shows how mouth shapes and code work together!',
        boost: 'Audio Engineering',
        scores: { creativity: 24, nature: 18, voice: 26, maker: 30 }
      }
    ]
  },
  {
    id: 'q-promise',
    stepTitle: 'Step 4 · Our Kid Inventor Kindness Promise',
    question: 'Real developers build safe, helpful tools! Which promise guides your creation?',
    options: [
      {
        id: 'opt-kindness',
        label: 'Always Encouraging, Kind & Helpful',
        desc: 'Celebrates every try with patience, warm smiles, and positive words!',
        boost: '100% Kindness Seal',
        scores: { creativity: 25, nature: 25, voice: 25, maker: 25 }
      },
      {
        id: 'opt-curiosity',
        label: 'Safe Curiosity & Experimentation',
        desc: 'Lets kids safely test colors, voices, and grass brushes with 1-click reset.',
        boost: 'Safe Sandbox Seal',
        scores: { creativity: 28, nature: 24, voice: 22, maker: 26 }
      },
      {
        id: 'opt-sharing',
        label: 'Open Creativity & Team Sharing',
        desc: 'Makes clean, readable project cards to share with family, teachers, and friends!',
        boost: 'Open Maker Seal',
        scores: { creativity: 25, nature: 22, voice: 25, maker: 28 }
      }
    ]
  }
];

export function computeQuestScores(answers) {
  const totals = { creativity: 0, nature: 0, voice: 0, maker: 0 };
  let count = 0;
  KID_BUILDER_QUEST.forEach((q) => {
    const ansId = answers && answers[q.id];
    const opt = q.options.find((o) => o.id === ansId) || q.options[0];
    if (opt) {
      totals.creativity += opt.scores.creativity;
      totals.nature += opt.scores.nature;
      totals.voice += opt.scores.voice;
      totals.maker += opt.scores.maker;
      count++;
    }
  });
  if (count === 0) return { creativity: 75, nature: 75, voice: 75, maker: 75 };
  return {
    creativity: Math.min(100, Math.round((totals.creativity / (count * 30)) * 100)),
    nature: Math.min(100, Math.round((totals.nature / (count * 30)) * 100)),
    voice: Math.min(100, Math.round((totals.voice / (count * 30)) * 100)),
    maker: Math.min(100, Math.round((totals.maker / (count * 30)) * 100))
  };
}

export function generateKidBlueprints(tabs, growthState) {
  const safeTabs = Array.isArray(tabs) ? tabs : [];
  const primaryTab = safeTabs[0] || { title: 'My 3D Fur Buddy', config: {} };
  const scores = computeQuestScores(growthState.questAnswers);
  const stage = getGrowthStage(growthState.xp);

  const mascotConfigJson = JSON.stringify(
    {
      studioName: 'Imagine · Dream · See — Kids 3D Design Studio',
      inventor: growthState.inventorName || 'Young Inventor',
      growthLevel: `Level ${stage.level}: ${stage.title}`,
      starsEarned: growthState.stars || 0,
      kindnessPromiseSealed: Boolean(growthState.pledgeSigned),
      projectTabsCount: safeTabs.length,
      tabs: safeTabs.map((t, idx) => ({
        tabNumber: idx + 1,
        title: t.title,
        designMode: t.mode,
        mascotName: t.config?.mascotName || 'Mr. M',
        voicePersona: t.config?.voiceId || 'sunny',
        voicePitch: t.config?.voicePitch || 1.25,
        furColors: {
          root: t.config?.baseColor || '#4f35ff',
          tip: t.config?.tipColor || '#ff9ec7',
          eyes: t.config?.eyeColor || '#2563eb'
        },
        earStyle: t.config?.earStyle || 'bunny',
        accessory: t.config?.accessory || 'antennae',
        skyTheme: t.config?.skyTheme || 'daydream'
      }))
    },
    null,
    2
  );

  const gardenBiomeJson = JSON.stringify(
    {
      module: '3D Living Meadow & Botany Sandbox',
      gpuInstancedGrassBlades: 100000,
      segmentsPerBlade: 14,
      scienceLesson: 'Plants use sunlight (photosynthesis), water from soil, and carbon dioxide to grow tall green blades!',
      tabGardenSettings: safeTabs.map((t) => ({
        tabTitle: t.title,
        meadowPreset: t.config?.grassPreset || 'Spring Meadow',
        rootSoilColor: t.config?.grassBaseColor || '#14532d',
        sunlitTipColor: t.config?.grassTipColor || '#86efac',
        bladeHeightMeters: t.config?.bladeHeight || 0.58,
        windBreeze: t.config?.windStrength || 0.75
      }))
    },
    null,
    2
  );

  const storyMarkdown = `# ${growthState.inventorName || 'Young Inventor'}'s 4-Tab Design & Voice Storyboard

## Inventor Growth Summary
- **Current Level:** Level ${stage.level} — ${stage.title} (${growthState.xp} XP · ${growthState.stars} Stars)
- **Creativity & Color:** ${scores.creativity}%
- **Nature & Growth Science:** ${scores.nature}%
- **Words & Voice Power:** ${scores.voice}%
- **Maker & Dev Thinking:** ${scores.maker}%

## My Project Tabs (${safeTabs.length} of 4)
${safeTabs
  .map((t, i) => {
    const v = VOICE_PERSONAS.find((p) => p.id === t.config?.voiceId) || VOICE_PERSONAS[0];
    return `### Tab ${i + 1}: ${t.title} (${t.mode.toUpperCase()})
- **Mascot Friend:** ${t.config?.mascotName || 'Mr. M'} (${t.config?.earStyle || 'bunny'} ears)
- **Character Voice:** ${v.name} — *${v.role}* (Pitch ${t.config?.voicePitch || v.pitch}x)
- **Favorite Story Sentence:** "${t.config?.storySentence || 'Dream big and shine bright!'}"
- **Voice Science Fact:** ${v.funFact}`;
  })
  .join('\n\n')}

## Idea Mind-Map Connections
${(growthState.mindMapNodes || [])
  .map((n) => `- **${n.label}** (${n.role}): ${n.note}`)
  .join('\n')}
`;

  const playableHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${primaryTab.title} — Kid Inventor Blueprint Card</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      margin: 0;
      padding: 32px;
      display: flex;
      justify-content: center;
    }
    .card {
      max-width: 680px;
      width: 100%;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 28px;
    }
    h1 { margin: 0 0 8px; color: #fde047; }
    .meta { color: #94a3b8; font-size: 14px; margin-bottom: 20px; }
    .tab-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
    .tab-box { background: #0f172a; border: 1px solid #334155; border-radius: 14px; padding: 16px; }
    .swatch { display: inline-block; width: 16px; height: 16px; border-radius: 50%; vertical-align: middle; margin-right: 6px; }
    button {
      margin-top: 18px;
      background: #38bdf8;
      color: #0f172a;
      border: none;
      border-radius: 10px;
      padding: 10px 18px;
      font-weight: 700;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>${growthState.inventorName || 'Young Inventor'}'s Creation Blueprint</h1>
    <div class="meta">Level ${stage.level}: ${stage.title} · ${safeTabs.length} Custom Design Tabs</div>
    <div class="tab-grid">
      ${safeTabs
        .map(
          (t, idx) => `<div class="tab-box">
        <strong>Tab ${idx + 1}: ${t.title}</strong>
        <p style="font-size:13px;color:#cbd5e1;margin:8px 0;">
          <span class="swatch" style="background:${t.config?.baseColor || '#4f35ff'}"></span>
          <span class="swatch" style="background:${t.config?.tipColor || '#ff9ec7'}"></span>
          Mascot: ${t.config?.mascotName || 'Mr. M'} (${t.config?.earStyle || 'bunny'})
        </p>
        <p style="font-size:12px;color:#94a3b8;margin:0;">"${t.config?.storySentence || 'Dream big!'}"</p>
      </div>`
        )
        .join('')}
    </div>
    <button onclick="speechSynthesis.speak(new SpeechSynthesisUtterance('Hello from ${
      primaryTab.config?.mascotName || 'Mr. M'
    }! Great job building your 4-tab design blueprint!'))">
      Speak My Blueprint Aloud
    </button>
  </div>
</body>
</html>`;

  return [
    {
      filename: 'my-3d-mascot.json',
      title: '1. 3D Mascot & Tabs Recipe (JSON)',
      language: 'json',
      lesson: 'Developers use JSON files to save character colors, ear shapes, and voice settings so the computer remembers every tab!',
      content: mascotConfigJson
    },
    {
      filename: 'living-garden-biome.json',
      title: '2. 3D Meadow & Botany Data (JSON)',
      language: 'json',
      lesson: 'This file stores how tall and dense your 100,000 3D grass blades grow and how strong the wind blows across the meadow!',
      content: gardenBiomeJson
    },
    {
      filename: 'voice-story-book.md',
      title: '3. Voice & Story Guide (Markdown)',
      language: 'markdown',
      lesson: 'Markdown (.md) is how creators write clean storyboards, instructions, and learning notes for their projects!',
      content: storyMarkdown
    },
    {
      filename: 'my-kid-app-blueprint.html',
      title: '4. Playable Web Card (HTML)',
      language: 'html',
      lesson: 'HTML & CSS build real web pages! You can download this file and open it in any browser to hear your creation talk!',
      content: playableHtml
    }
  ];
}

/**
 * Renders the interactive Kid Idea Mind-Map Canvas inside a given <canvas> element
 */
export function mountKidMindMapCanvas(canvas, nodes, onSelectNode) {
  const ctx = canvas.getContext('2d');
  let animId = null;
  let draggingNode = null;
  let selectedId = nodes[0]?.id || null;
  let pulsePhase = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(320, Math.floor(rect.width * dpr));
    canvas.height = Math.max(240, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  window.addEventListener('resize', resize);

  function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / Math.max(1, rect.width),
      y: (e.clientY - rect.top) / Math.max(1, rect.height),
      px: e.clientX - rect.left,
      py: e.clientY - rect.top,
      w: rect.width,
      h: rect.height
    };
  }

  function findNodeAt(px, py, w, h) {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const nx = n.x * w;
      const ny = n.y * h;
      if (Math.hypot(px - nx, py - ny) <= 38) {
        return n;
      }
    }
    return null;
  }

  function onPointerDown(e) {
    const p = getPointerPos(e);
    const hit = findNodeAt(p.px, p.py, p.w, p.h);
    if (hit) {
      draggingNode = hit;
      selectedId = hit.id;
      if (typeof onSelectNode === 'function') {
        onSelectNode(hit);
      }
    }
  }

  function onPointerMove(e) {
    if (!draggingNode) return;
    const p = getPointerPos(e);
    draggingNode.x = Math.max(0.12, Math.min(0.88, p.x));
    draggingNode.y = Math.max(0.16, Math.min(0.84, p.y));
  }

  function onPointerUp() {
    draggingNode = null;
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  function draw() {
    animId = requestAnimationFrame(draw);
    pulsePhase += 0.035;

    const rect = canvas.getBoundingClientRect();
    const w = rect.width || 600;
    const h = rect.height || 320;

    ctx.clearRect(0, 0, w, h);

    // Subtle starry blueprint grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;
    for (let gx = 32; gx < w; gx += 36) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }
    for (let gy = 32; gy < h; gy += 36) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    // Draw connecting lines from hub (node 0) and sequential links
    if (nodes.length > 1) {
      const hub = nodes[0];
      for (let i = 1; i < nodes.length; i++) {
        const target = nodes[i];
        const x1 = hub.x * w;
        const y1 = hub.y * h;
        const x2 = target.x * w;
        const y2 = target.y * h;

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, hub.color || '#818cf8');
        grad.addColorStop(1, target.color || '#38bdf8');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Travelling spark along link
        const t = ((pulsePhase * 0.4 + i * 0.23) % 1);
        const sx = x1 + (x2 - x1) * t;
        const sy = y1 + (y2 - y1) * t;
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw nodes
    nodes.forEach((n) => {
      const nx = n.x * w;
      const ny = n.y * h;
      const isSel = n.id === selectedId;
      const r = isSel ? 34 : 30;

      if (isSel) {
        ctx.fillStyle = `${n.color || '#38bdf8'}33`;
        ctx.beginPath();
        ctx.arc(nx, ny, r + 9, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = n.color || '#38bdf8';
      ctx.lineWidth = isSel ? 3.5 : 2;
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 11.5px "Google Sans", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.label.slice(0, 14), nx, ny - 5);

      ctx.fillStyle = 'rgba(226, 232, 240, 0.72)';
      ctx.font = '500 9.5px "Google Sans", system-ui, sans-serif';
      ctx.fillText(n.role.slice(0, 16), nx, ny + 9);
    });
  }

  draw();

  return {
    destroy() {
      if (animId) cancelAnimationFrame(animId);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', resize);
    }
  };
}
