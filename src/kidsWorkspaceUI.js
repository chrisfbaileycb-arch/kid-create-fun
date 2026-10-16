// Kids 4-Tab Interactive Design Workspace, Voice Lab, 3D Garden Deck & Maker Dev Studio UI
// Pure safe DOM construction (document.createElement / textContent) following Universal Frontend Design guidelines.

import {
  VOICE_PERSONAS,
  DESIGN_TAB_MODES,
  IMAGINE_DESIGN_STEPS,
  buildImagineStepNarration,
  getVoicePersonaById,
  getGrowthStage,
  playPersonaChime
} from './voicesAndGrowth.js';
import { GRASS_PRESETS } from './grassGarden3D.js';
import {
  KID_BUILDER_QUEST,
  computeQuestScores,
  generateKidBlueprints,
  mountKidMindMapCanvas
} from './kidDevStudio.js';

export function createKidsWorkspaceUI({
  tabs,
  activeTabIndex,
  growthState,
  onSelectTab,
  onAddTab,
  onUpdateTab,
  onDeleteTab,
  onVoiceChange,
  onSpeakText,
  onGardenAction,
  onAwardXP
}) {
  let currentTabs = tabs;
  let currentTabIndex = activeTabIndex;
  let currentGrowth = growthState;
  let activeMindMapController = null;
  let activeDevSubTab = 'mindmap'; // 'mindmap' | 'quest' | 'blueprints'
  let activeQuestStep = 0;
  let activeBlueprintIdx = 0;
  let isNarratorMenuOpen = false;

  // =========================================================================
  // 1. TOP 4-TAB KIDS DESIGN STUDIO BAR
  // =========================================================================
  let topBar = document.getElementById('kids-studio-topbar');
  if (!topBar) {
    topBar = document.createElement('header');
    topBar.id = 'kids-studio-topbar';
    topBar.className = 'kids-studio-topbar';
    topBar.setAttribute('aria-label', 'Kids 4-Tab Design Studio Navigation');
    document.body.appendChild(topBar);
  }

  // =========================================================================
  // 1B. AUDIO NARRATOR SELECTION MENU & "IMAGINE" DESIGN GUIDE DRAWER
  // =========================================================================
  let narratorMenu = document.getElementById('kids-narrator-menu');
  if (!narratorMenu) {
    narratorMenu = document.createElement('aside');
    narratorMenu.id = 'kids-narrator-menu';
    narratorMenu.className = 'kids-narrator-menu';
    narratorMenu.setAttribute('aria-label', 'Imagine Design Process Audio Narrator Menu');
    narratorMenu.setAttribute('aria-hidden', 'true');
    document.body.appendChild(narratorMenu);
  }

  // =========================================================================
  // 2. CONTEXTUAL MODE OVERLAYS (VOICE LAB BAR, 3D GARDEN BAR, KID DEV DECK)
  // =========================================================================
  let modeDeck = document.getElementById('kids-mode-deck');
  if (!modeDeck) {
    modeDeck = document.createElement('section');
    modeDeck.id = 'kids-mode-deck';
    modeDeck.className = 'kids-mode-deck';
    modeDeck.setAttribute('aria-label', 'Active Design Tab Studio Tools');
    document.body.appendChild(modeDeck);
  }

  // =========================================================================
  // 3. TAB CUSTOMIZER & GROWTH MODAL
  // =========================================================================
  let modalBackdrop = document.getElementById('kids-studio-modal');
  if (!modalBackdrop) {
    modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'kids-studio-modal';
    modalBackdrop.className = 'kids-studio-modal';
    modalBackdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(modalBackdrop);
  }

  function getActiveNarratorPersona() {
    const activeTab = currentTabs[currentTabIndex] || currentTabs[0];
    const voiceId =
      currentGrowth.narratorVoiceId ||
      activeTab?.config?.voiceId ||
      'sunny';
    return getVoicePersonaById(voiceId);
  }

  function getActiveImagineStep() {
    const idx = Math.max(
      0,
      Math.min(IMAGINE_DESIGN_STEPS.length - 1, Number(currentGrowth.imagineStepIndex) || 0)
    );
    return IMAGINE_DESIGN_STEPS[idx];
  }

  function speakCurrentImagineStep(stepOverride = null, jumpToMatchingTab = false) {
    const activeTab = currentTabs[currentTabIndex] || currentTabs[0];
    const step = stepOverride || getActiveImagineStep();
    const narrator = getActiveNarratorPersona();

    if (jumpToMatchingTab && step.targetMode && activeTab?.mode !== step.targetMode) {
      const matchingIdx = currentTabs.findIndex((t) => t.mode === step.targetMode);
      if (matchingIdx !== -1 && matchingIdx !== currentTabIndex) {
        onSelectTab(matchingIdx);
      }
    }

    const updatedTab = currentTabs[currentTabIndex] || activeTab;
    if (updatedTab && updatedTab.config) {
      updatedTab.config.voiceId = narrator.id;
      updatedTab.config.voicePitch = narrator.pitch;
      updatedTab.config.voiceRate = narrator.rate;
    }

    const script = buildImagineStepNarration(narrator.id, step.id, updatedTab);
    onVoiceChange({
      voiceId: narrator.id,
      pitch: narrator.pitch,
      rate: narrator.rate,
      samplePhrase: script
    });

    if (!Array.isArray(currentGrowth.completedImagineSteps)) {
      currentGrowth.completedImagineSteps = [];
    }
    if (!currentGrowth.completedImagineSteps.includes(step.id)) {
      currentGrowth.completedImagineSteps.push(step.id);
      onAwardXP(step.pillar || 'voice', 8);
    } else {
      onAwardXP('voice', 3);
    }
    renderNarratorMenu();
    renderTopBar();
  }

  function toggleNarratorMenu(forceState) {
    isNarratorMenuOpen =
      typeof forceState === 'boolean' ? forceState : !isNarratorMenuOpen;
    narratorMenu.classList.toggle('open', isNarratorMenuOpen);
    narratorMenu.setAttribute('aria-hidden', String(!isNarratorMenuOpen));
    renderTopBar();
    if (isNarratorMenuOpen) {
      renderNarratorMenu();
    }
  }

  function renderNarratorMenu() {
    narratorMenu.replaceChildren();
    if (!isNarratorMenuOpen) return;

    const activeTab = currentTabs[currentTabIndex] || currentTabs[0];
    const narrator = getActiveNarratorPersona();
    const currentStep = getActiveImagineStep();
    const completedSet = new Set(currentGrowth.completedImagineSteps || []);

    // Header Row
    const header = document.createElement('div');
    header.className = 'narrator-menu-header';

    const titleWrap = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'narrator-menu-title';
    title.textContent = '🔊 Friendly Narrator & "Imagine" Audio Guide';

    const sub = document.createElement('div');
    sub.className = 'narrator-menu-sub';
    sub.textContent = `Pick a friendly narrator voice to guide you step-by-step through designing "${activeTab?.title || 'your world'}"!`;

    titleWrap.appendChild(title);
    titleWrap.appendChild(sub);

    const headerActions = document.createElement('div');
    headerActions.className = 'narrator-header-actions';

    const autoBtn = document.createElement('button');
    autoBtn.type = 'button';
    const autoOn = currentGrowth.narratorAutoGuide !== false;
    autoBtn.className = `kids-mini-btn ${autoOn ? 'active' : ''}`;
    autoBtn.textContent = autoOn ? 'Auto-Speak Steps: ON' : 'Auto-Speak Steps: OFF';
    autoBtn.addEventListener('click', () => {
      currentGrowth.narratorAutoGuide = !autoOn;
      renderNarratorMenu();
    });

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'kids-modal-close';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => {
      toggleNarratorMenu(false);
    });

    headerActions.appendChild(autoBtn);
    headerActions.appendChild(closeBtn);
    header.appendChild(titleWrap);
    header.appendChild(headerActions);
    narratorMenu.appendChild(header);

    // Section 1: 6 Friendly Narrator Voice Cards
    const voiceSecLabel = document.createElement('div');
    voiceSecLabel.className = 'narrator-section-label';
    voiceSecLabel.textContent = '1. Choose Your Friendly Narrator Voice (Click to Hear & Select):';
    narratorMenu.appendChild(voiceSecLabel);

    const voiceGrid = document.createElement('div');
    voiceGrid.className = 'narrator-voice-grid';

    VOICE_PERSONAS.forEach((vp) => {
      const isSelected = vp.id === narrator.id;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `narrator-voice-card ${isSelected ? 'active' : ''}`;
      card.setAttribute('aria-pressed', String(isSelected));

      const topLine = document.createElement('div');
      topLine.className = 'narrator-card-top';

      const vName = document.createElement('span');
      vName.className = 'narrator-card-name';
      vName.textContent = vp.name;

      const vBadge = document.createElement('span');
      vBadge.className = 'narrator-card-badge';
      vBadge.textContent = isSelected ? '🔊 Active Guide' : 'Preview';

      topLine.appendChild(vName);
      topLine.appendChild(vBadge);

      const vRole = document.createElement('div');
      vRole.className = 'narrator-card-role';
      vRole.textContent = `${vp.role} · Pitch ${vp.pitch.toFixed(2)}x · Speed ${vp.rate.toFixed(2)}x`;

      const vFact = document.createElement('div');
      vFact.className = 'narrator-card-fact';
      vFact.textContent = vp.funFact;

      card.appendChild(topLine);
      card.appendChild(vRole);
      card.appendChild(vFact);

      card.addEventListener('click', () => {
        currentGrowth.narratorVoiceId = vp.id;
        if (activeTab && activeTab.config) {
          activeTab.config.voiceId = vp.id;
          activeTab.config.voicePitch = vp.pitch;
          activeTab.config.voiceRate = vp.rate;
        }
        const stepScript = buildImagineStepNarration(vp.id, currentStep.id, activeTab);
        onVoiceChange({
          voiceId: vp.id,
          pitch: vp.pitch,
          rate: vp.rate,
          samplePhrase: `Hi! I am ${vp.name}, your ${vp.role}! ${stepScript}`
        });
        onAwardXP('voice', 6);
        renderTopBar();
        renderModeDeck();
        renderNarratorMenu();
      });

      voiceGrid.appendChild(card);
    });
    narratorMenu.appendChild(voiceGrid);

    // Section 2: 5-Step "Imagine" Design Process Interactive Audio Coach
    const stepSecLabel = document.createElement('div');
    stepSecLabel.className = 'narrator-section-label';
    stepSecLabel.textContent = `2. Guided "Imagine" Design Process (${completedSet.size}/${IMAGINE_DESIGN_STEPS.length} Steps Explored):`;
    narratorMenu.appendChild(stepSecLabel);

    const stepPillsRow = document.createElement('div');
    stepPillsRow.className = 'narrator-steps-row';

    IMAGINE_DESIGN_STEPS.forEach((step, sIdx) => {
      const isCur = step.id === currentStep.id;
      const isDone = completedSet.has(step.id);
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `narrator-step-pill ${isCur ? 'active' : ''} ${isDone ? 'completed' : ''}`;
      pill.textContent = `${isDone ? '✓ ' : ''}${step.shortLabel}`;
      pill.addEventListener('click', () => {
        currentGrowth.imagineStepIndex = sIdx;
        if (currentGrowth.narratorAutoGuide !== false) {
          speakCurrentImagineStep(step, false);
        } else {
          renderNarratorMenu();
          renderTopBar();
        }
      });
      stepPillsRow.appendChild(pill);
    });
    narratorMenu.appendChild(stepPillsRow);

    // Active Step Story & Challenge Box
    const stepBox = document.createElement('div');
    stepBox.className = 'narrator-step-box';

    const stepHeader = document.createElement('div');
    stepHeader.className = 'narrator-step-box-header';

    const stepHeading = document.createElement('div');
    stepHeading.className = 'narrator-step-heading';
    stepHeading.textContent = `Step ${currentStep.stepNumber}: ${currentStep.title} — Narrated by ${narrator.name}`;

    const stepModeTag = document.createElement('span');
    stepModeTag.className = 'narrator-step-mode-tag';
    const targetModeObj =
      DESIGN_TAB_MODES.find((m) => m.id === currentStep.targetMode) || DESIGN_TAB_MODES[0];
    stepModeTag.textContent = `Best in: ${targetModeObj.label}`;

    stepHeader.appendChild(stepHeading);
    stepHeader.appendChild(stepModeTag);
    stepBox.appendChild(stepHeader);

    const scriptQuote = document.createElement('p');
    scriptQuote.className = 'narrator-script-quote';
    scriptQuote.textContent = `"${buildImagineStepNarration(narrator.id, currentStep.id, activeTab)}"`;
    stepBox.appendChild(scriptQuote);

    const challengeBanner = document.createElement('div');
    challengeBanner.className = 'narrator-challenge-banner';
    challengeBanner.textContent = `✨ Fun Try-It Challenge: ${currentStep.challenge}`;
    stepBox.appendChild(challengeBanner);

    // Action Controls Row
    const controlsRow = document.createElement('div');
    controlsRow.className = 'narrator-controls-row';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'kids-mini-btn';
    prevBtn.textContent = '← Prev Step';
    prevBtn.addEventListener('click', () => {
      const curIdx = Number(currentGrowth.imagineStepIndex) || 0;
      const nextIdx = (curIdx - 1 + IMAGINE_DESIGN_STEPS.length) % IMAGINE_DESIGN_STEPS.length;
      currentGrowth.imagineStepIndex = nextIdx;
      if (currentGrowth.narratorAutoGuide !== false) {
        speakCurrentImagineStep(IMAGINE_DESIGN_STEPS[nextIdx], false);
      } else {
        renderNarratorMenu();
        renderTopBar();
      }
    });

    const speakNowBtn = document.createElement('button');
    speakNowBtn.type = 'button';
    speakNowBtn.className = 'kids-action-primary-btn';
    speakNowBtn.textContent = `🔊 Read Step ${currentStep.stepNumber} Aloud (${narrator.name.split(' ')[0]})`;
    speakNowBtn.addEventListener('click', () => {
      speakCurrentImagineStep(currentStep, false);
    });

    const jumpAndGuideBtn = document.createElement('button');
    jumpAndGuideBtn.type = 'button';
    jumpAndGuideBtn.className = 'kids-secondary-btn';
    jumpAndGuideBtn.textContent = `Go to ${targetModeObj.label} & Guide Me`;
    jumpAndGuideBtn.addEventListener('click', () => {
      speakCurrentImagineStep(currentStep, true);
    });

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'kids-mini-btn primary-accent';
    nextBtn.textContent = 'Next Step →';
    nextBtn.addEventListener('click', () => {
      const curIdx = Number(currentGrowth.imagineStepIndex) || 0;
      const nextIdx = (curIdx + 1) % IMAGINE_DESIGN_STEPS.length;
      currentGrowth.imagineStepIndex = nextIdx;
      if (currentGrowth.narratorAutoGuide !== false) {
        speakCurrentImagineStep(IMAGINE_DESIGN_STEPS[nextIdx], false);
      } else {
        renderNarratorMenu();
        renderTopBar();
      }
    });

    controlsRow.appendChild(prevBtn);
    controlsRow.appendChild(speakNowBtn);
    controlsRow.appendChild(jumpAndGuideBtn);
    controlsRow.appendChild(nextBtn);
    stepBox.appendChild(controlsRow);

    narratorMenu.appendChild(stepBox);
  }

  function renderTopBar() {
    topBar.replaceChildren();

    // Zone 1: Brand Wordmark
    const brandBtn = document.createElement('button');
    brandBtn.type = 'button';
    brandBtn.className = 'kids-brand-mark';
    brandBtn.textContent = 'Imagine · Dream · See';
    brandBtn.setAttribute('aria-label', 'Imagine Dream See Kids Design Studio');
    brandBtn.addEventListener('click', () => {
      openGrowthAndTabModal('growth');
    });
    topBar.appendChild(brandBtn);

    // Zone 2: Up to 4 Interactive Project Design Tabs
    const tabsNav = document.createElement('nav');
    tabsNav.className = 'kids-tabs-nav';
    tabsNav.setAttribute('aria-label', 'Design Project Tabs (Up to 4)');

    currentTabs.forEach((tab, idx) => {
      const isActive = idx === currentTabIndex;
      const modeObj = DESIGN_TAB_MODES.find((m) => m.id === tab.mode) || DESIGN_TAB_MODES[0];

      const tabWrap = document.createElement('div');
      tabWrap.className = `kids-tab-item ${isActive ? 'active' : ''}`;

      const tabBtn = document.createElement('button');
      tabBtn.type = 'button';
      tabBtn.className = 'kids-tab-main-btn';
      tabBtn.setAttribute('aria-selected', String(isActive));
      tabBtn.setAttribute('title', `${tab.title} (${modeObj.label})`);

      const swatch = document.createElement('span');
      swatch.className = 'kids-tab-swatch';
      swatch.style.background =
        tab.mode === 'garden'
          ? `linear-gradient(135deg, ${tab.config?.grassTipColor || '#86efac'}, ${tab.config?.grassBaseColor || '#14532d'})`
          : `linear-gradient(135deg, ${tab.config?.tipColor || '#ff9ec7'}, ${tab.config?.baseColor || '#4f35ff'})`;

      const titleSpan = document.createElement('span');
      titleSpan.className = 'kids-tab-title';
      titleSpan.textContent = tab.title;

      const modeSpan = document.createElement('span');
      modeSpan.className = 'kids-tab-mode-label';
      modeSpan.textContent = `· ${modeObj.label}`;

      tabBtn.appendChild(swatch);
      tabBtn.appendChild(titleSpan);
      tabBtn.appendChild(modeSpan);

      tabBtn.addEventListener('click', () => {
        if (idx !== currentTabIndex) {
          onSelectTab(idx);
        }
      });

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'kids-tab-edit-btn';
      editBtn.textContent = 'Edit';
      editBtn.setAttribute('aria-label', `Customize ${tab.title}`);
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openGrowthAndTabModal('edit-tab', idx);
      });

      tabWrap.appendChild(tabBtn);
      tabWrap.appendChild(editBtn);

      if (currentTabs.length > 1) {
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'kids-tab-close-btn';
        closeBtn.textContent = '×';
        closeBtn.setAttribute('aria-label', `Close ${tab.title}`);
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onDeleteTab(idx);
        });
        tabWrap.appendChild(closeBtn);
      }

      tabsNav.appendChild(tabWrap);
    });

    if (currentTabs.length < 4) {
      const addTabBtn = document.createElement('button');
      addTabBtn.type = 'button';
      addTabBtn.className = 'kids-add-tab-btn';
      addTabBtn.textContent = `+ New Tab (${currentTabs.length}/4)`;
      addTabBtn.setAttribute('aria-label', 'Create a new design tab (up to 4 tabs)');
      addTabBtn.addEventListener('click', () => {
        openGrowthAndTabModal('new-tab');
      });
      tabsNav.appendChild(addTabBtn);
    }

    topBar.appendChild(tabsNav);

    // Zone 3: Audio Narrator Selection Menu Trigger & Growth Progress
    const rightZone = document.createElement('div');
    rightZone.className = 'kids-topbar-right';

    const narrator = getActiveNarratorPersona();
    const curStep = getActiveImagineStep();
    const narratorBtn = document.createElement('button');
    narratorBtn.type = 'button';
    narratorBtn.className = `kids-narrator-trigger-btn ${isNarratorMenuOpen ? 'active' : ''}`;
    narratorBtn.textContent = `🔊 Narrator: ${narrator.name} (${curStep.shortLabel}) ▾`;
    narratorBtn.setAttribute('aria-expanded', String(isNarratorMenuOpen));
    narratorBtn.setAttribute('aria-label', 'Open Friendly Narrator Voice Menu and Imagine Design Guide');
    narratorBtn.addEventListener('click', () => {
      toggleNarratorMenu();
    });

    const stage = getGrowthStage(currentGrowth.xp);
    const growthBtn = document.createElement('button');
    growthBtn.type = 'button';
    growthBtn.className = 'kids-growth-trigger-btn';
    growthBtn.textContent = `Lv.${stage.level} ${stage.title} · ${currentGrowth.xp} XP`;
    growthBtn.setAttribute('aria-label', 'View learning growth and customize tabs');
    growthBtn.addEventListener('click', () => {
      openGrowthAndTabModal('growth');
    });

    rightZone.appendChild(narratorBtn);
    rightZone.appendChild(growthBtn);
    topBar.appendChild(rightZone);
  }

  // =========================================================================
  // RENDER ACTIVE TAB'S CONTEXTUAL DECK (GARDEN / VOICE / DEV / MASCOT)
  // =========================================================================
  function renderModeDeck() {
    if (activeMindMapController) {
      activeMindMapController.destroy();
      activeMindMapController = null;
    }
    modeDeck.replaceChildren();

    const activeTab = currentTabs[currentTabIndex] || currentTabs[0];
    if (!activeTab) return;

    modeDeck.setAttribute('data-mode', activeTab.mode);

    if (activeTab.mode === 'mascot') {
      renderMascotQuickBar(activeTab);
    } else if (activeTab.mode === 'garden') {
      renderGardenStudioDeck(activeTab);
    } else if (activeTab.mode === 'voice') {
      renderVoiceLabDeck(activeTab);
    } else if (activeTab.mode === 'dev') {
      renderKidDevStudioDeck(activeTab);
    }
  }

  // --- MODE 1: 3D FUR BUDDY QUICK VOICE & SCENE BAR ---
  function renderMascotQuickBar(activeTab) {
    const bar = document.createElement('div');
    bar.className = 'kids-floating-bar mascot-quick-bar';

    const info = document.createElement('div');
    info.className = 'kids-bar-info';

    const title = document.createElement('span');
    title.className = 'kids-bar-title';
    title.textContent = `${activeTab.title} · ${activeTab.config?.mascotName || 'Mr. M'}`;

    const sub = document.createElement('span');
    sub.className = 'kids-bar-sub';
    const curPersona = getVoicePersonaById(activeTab.config?.voiceId || currentGrowth.narratorVoiceId);
    const curStep = getActiveImagineStep();
    sub.textContent = `Narrator: ${curPersona.name} · Imagine ${curStep.shortLabel}: ${curStep.challenge}`;

    info.appendChild(title);
    info.appendChild(sub);
    bar.appendChild(info);

    // Quick Voice Switcher Row + 1-Click "Guide Me" Audio Button
    const voiceRow = document.createElement('div');
    voiceRow.className = 'kids-quick-pills';

    const guideStepBtn = document.createElement('button');
    guideStepBtn.type = 'button';
    guideStepBtn.className = 'kids-mini-btn primary-accent';
    guideStepBtn.textContent = `🔊 Guide Me (${curStep.shortLabel})`;
    guideStepBtn.setAttribute('title', 'Hear your narrator guide you through the current Imagine step');
    guideStepBtn.addEventListener('click', () => {
      speakCurrentImagineStep(curStep, false);
    });
    voiceRow.appendChild(guideStepBtn);

    VOICE_PERSONAS.forEach((vp) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `kids-mini-btn ${(activeTab.config?.voiceId || currentGrowth.narratorVoiceId || 'sunny') === vp.id ? 'active' : ''}`;
      btn.textContent = vp.name.split(' ')[0];
      btn.setAttribute('title', `${vp.name} (${vp.role})`);
      btn.addEventListener('click', () => {
        currentGrowth.narratorVoiceId = vp.id;
        activeTab.config.voiceId = vp.id;
        activeTab.config.voicePitch = vp.pitch;
        activeTab.config.voiceRate = vp.rate;
        const stepScript = buildImagineStepNarration(vp.id, curStep.id, activeTab);
        onVoiceChange({ voiceId: vp.id, pitch: vp.pitch, rate: vp.rate, samplePhrase: stepScript });
        onAwardXP('voice', 6);
        renderTopBar();
        renderModeDeck();
        if (isNarratorMenuOpen) renderNarratorMenu();
      });
      voiceRow.appendChild(btn);
    });

    bar.appendChild(voiceRow);
    modeDeck.appendChild(bar);
  }

  // --- MODE 2: 3D LIVING MEADOW & GRASS PAINTER BAR ---
  function renderGardenStudioDeck(activeTab) {
    const card = document.createElement('div');
    card.className = 'kids-floating-bar garden-studio-bar';

    const topRow = document.createElement('div');
    topRow.className = 'garden-bar-row';

    const titleBlock = document.createElement('div');
    titleBlock.className = 'kids-bar-info';

    const h = document.createElement('span');
    h.className = 'kids-bar-title';
    h.textContent = `${activeTab.title} · 3D Living Meadow Painter`;

    const sub = document.createElement('span');
    sub.className = 'kids-bar-sub';
    sub.id = 'garden-coverage-readout';
    sub.textContent = 'Drag across the 3D soil to sprout 100,000 living grass blades · Hold Shift + drag to orbit';

    titleBlock.appendChild(h);
    titleBlock.appendChild(sub);
    topRow.appendChild(titleBlock);

    // Brush Mode Buttons: Grow, Comb Wind, Clear Path, Fill All
    const brushGroup = document.createElement('div');
    brushGroup.className = 'kids-quick-pills';

    const modes = [
      { id: 'grow', label: 'Sprout Grass' },
      { id: 'comb', label: 'Comb Breeze' },
      { id: 'erase', label: 'Make Path' }
    ];

    modes.forEach((m) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `kids-mini-btn ${(activeTab.config?.brushMode || 'grow') === m.id ? 'active' : ''}`;
      b.textContent = m.label;
      b.addEventListener('click', () => {
        activeTab.config.brushMode = m.id;
        onGardenAction('brushMode', m.id);
        renderModeDeck();
      });
      brushGroup.appendChild(b);
    });

    const bloomBtn = document.createElement('button');
    bloomBtn.type = 'button';
    bloomBtn.className = 'kids-mini-btn primary-accent';
    bloomBtn.textContent = 'Full Meadow Bloom';
    bloomBtn.addEventListener('click', () => {
      onGardenAction('fillMeadow', true);
      onAwardXP('nature', 12);
    });
    brushGroup.appendChild(bloomBtn);

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'kids-mini-btn';
    resetBtn.textContent = 'Fresh Soil';
    resetBtn.addEventListener('click', () => {
      onGardenAction('clearMeadow', true);
    });
    brushGroup.appendChild(resetBtn);

    topRow.appendChild(brushGroup);
    card.appendChild(topRow);

    // Second Row: Meadow Botany Themes + Height & Brush Size Sliders
    const bottomRow = document.createElement('div');
    bottomRow.className = 'garden-bar-row secondary';

    const presetGroup = document.createElement('div');
    presetGroup.className = 'kids-quick-pills';

    GRASS_PRESETS.forEach((preset) => {
      const pBtn = document.createElement('button');
      pBtn.type = 'button';
      pBtn.className = `kids-mini-btn ${(activeTab.config?.grassPreset || 'Spring Meadow') === preset.name ? 'active' : ''}`;
      pBtn.textContent = preset.name;
      pBtn.addEventListener('click', () => {
        activeTab.config.grassPreset = preset.name;
        activeTab.config.grassBaseColor = preset.baseColor;
        activeTab.config.grassTipColor = preset.tipColor;
        activeTab.config.bladeHeight = preset.bladeHeight;
        onGardenAction('preset', preset.name);
        onAwardXP('nature', 8);
        renderModeDeck();
      });
      presetGroup.appendChild(pBtn);
    });
    bottomRow.appendChild(presetGroup);

    // Compact Sliders for Brush Size & Grass Height
    const slidersWrap = document.createElement('div');
    slidersWrap.className = 'garden-inline-sliders';

    const radiusLabel = document.createElement('label');
    radiusLabel.className = 'inline-slider-label';
    const radiusSpan = document.createElement('span');
    radiusSpan.textContent = `Brush: ${(activeTab.config?.brushRadius || 1.35).toFixed(1)}m`;
    const radiusInput = document.createElement('input');
    radiusInput.type = 'range';
    radiusInput.min = '0.4';
    radiusInput.max = '2.8';
    radiusInput.step = '0.1';
    radiusInput.value = String(activeTab.config?.brushRadius || 1.35);
    radiusInput.addEventListener('input', () => {
      const val = Number(radiusInput.value);
      activeTab.config.brushRadius = val;
      radiusSpan.textContent = `Brush: ${val.toFixed(1)}m`;
      onGardenAction('brushRadius', val);
    });
    radiusLabel.appendChild(radiusSpan);
    radiusLabel.appendChild(radiusInput);

    const heightLabel = document.createElement('label');
    heightLabel.className = 'inline-slider-label';
    const heightSpan = document.createElement('span');
    heightSpan.textContent = `Height: ${Math.round((activeTab.config?.bladeHeight || 0.58) * 100)}cm`;
    const heightInput = document.createElement('input');
    heightInput.type = 'range';
    heightInput.min = '0.25';
    heightInput.max = '1.15';
    heightInput.step = '0.02';
    heightInput.value = String(activeTab.config?.bladeHeight || 0.58);
    heightInput.addEventListener('input', () => {
      const val = Number(heightInput.value);
      activeTab.config.bladeHeight = val;
      heightSpan.textContent = `Height: ${Math.round(val * 100)}cm`;
      onGardenAction('bladeHeight', val);
    });
    heightLabel.appendChild(heightSpan);
    heightLabel.appendChild(heightInput);

    slidersWrap.appendChild(radiusLabel);
    slidersWrap.appendChild(heightLabel);
    bottomRow.appendChild(slidersWrap);

    card.appendChild(bottomRow);
    modeDeck.appendChild(card);
  }

  // --- MODE 3: VOICE, PHONICS & STORY LAB DECK ---
  function renderVoiceLabDeck(activeTab) {
    const panel = document.createElement('div');
    panel.className = 'kids-voice-lab-panel';

    const header = document.createElement('div');
    header.className = 'voice-lab-header';

    const hTitle = document.createElement('h2');
    hTitle.className = 'voice-lab-title';
    hTitle.textContent = `${activeTab.title} · 6 Character Voices & Lip-Sync`;

    const hSub = document.createElement('p');
    hSub.className = 'voice-lab-sub';
    hSub.textContent = 'Pick a character voice, tune pitch & speed waves, and watch your 3D buddy speak!';

    header.appendChild(hTitle);
    header.appendChild(hSub);
    panel.appendChild(header);

    // 6 Voice Persona Cards Grid
    const grid = document.createElement('div');
    grid.className = 'voice-persona-grid';

    const currentVoiceId = activeTab.config?.voiceId || 'sunny';
    const activePersona = getVoicePersonaById(currentVoiceId);

    VOICE_PERSONAS.forEach((vp) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `voice-persona-card ${vp.id === currentVoiceId ? 'active' : ''}`;

      const nameEl = document.createElement('div');
      nameEl.className = 'voice-persona-name';
      nameEl.textContent = vp.name;

      const roleEl = document.createElement('div');
      roleEl.className = 'voice-persona-role';
      roleEl.textContent = `${vp.role} · Pitch ${vp.pitch}x`;

      card.appendChild(nameEl);
      card.appendChild(roleEl);

      card.addEventListener('click', () => {
        activeTab.config.voiceId = vp.id;
        activeTab.config.voicePitch = vp.pitch;
        activeTab.config.voiceRate = vp.rate;
        onVoiceChange({
          voiceId: vp.id,
          pitch: vp.pitch,
          rate: vp.rate,
          samplePhrase: vp.samplePhrase
        });
        onAwardXP('voice', 10);
        renderModeDeck();
      });

      grid.appendChild(card);
    });
    panel.appendChild(grid);

    // Pitch & Speed Sliders
    const slidersRow = document.createElement('div');
    slidersRow.className = 'voice-sliders-row';

    const pitchWrap = document.createElement('label');
    pitchWrap.className = 'voice-slider-box';
    const pitchTop = document.createElement('div');
    pitchTop.className = 'voice-slider-top';
    const pitchLbl = document.createElement('span');
    pitchLbl.textContent = 'Sound Pitch (Frequency)';
    const pitchVal = document.createElement('span');
    pitchVal.textContent = `${Number(activeTab.config?.voicePitch || activePersona.pitch).toFixed(2)}x`;
    pitchTop.appendChild(pitchLbl);
    pitchTop.appendChild(pitchVal);

    const pitchInput = document.createElement('input');
    pitchInput.type = 'range';
    pitchInput.min = '0.55';
    pitchInput.max = '1.75';
    pitchInput.step = '0.05';
    pitchInput.value = String(activeTab.config?.voicePitch || activePersona.pitch);
    pitchInput.addEventListener('input', () => {
      const v = Number(pitchInput.value);
      activeTab.config.voicePitch = v;
      pitchVal.textContent = `${v.toFixed(2)}x`;
      onVoiceChange({
        voiceId: activeTab.config.voiceId || 'sunny',
        pitch: v,
        rate: activeTab.config.voiceRate || activePersona.rate
      });
    });
    pitchWrap.appendChild(pitchTop);
    pitchWrap.appendChild(pitchInput);

    const rateWrap = document.createElement('label');
    rateWrap.className = 'voice-slider-box';
    const rateTop = document.createElement('div');
    rateTop.className = 'voice-slider-top';
    const rateLbl = document.createElement('span');
    rateLbl.textContent = 'Talking Speed (Tempo)';
    const rateVal = document.createElement('span');
    rateVal.textContent = `${Number(activeTab.config?.voiceRate || activePersona.rate).toFixed(2)}x`;
    rateTop.appendChild(rateLbl);
    rateTop.appendChild(rateVal);

    const rateInput = document.createElement('input');
    rateInput.type = 'range';
    rateInput.min = '0.70';
    rateInput.max = '1.30';
    rateInput.step = '0.04';
    rateInput.value = String(activeTab.config?.voiceRate || activePersona.rate);
    rateInput.addEventListener('input', () => {
      const v = Number(rateInput.value);
      activeTab.config.voiceRate = v;
      rateVal.textContent = `${v.toFixed(2)}x`;
      onVoiceChange({
        voiceId: activeTab.config.voiceId || 'sunny',
        pitch: activeTab.config.voicePitch || activePersona.pitch,
        rate: v
      });
    });
    rateWrap.appendChild(rateTop);
    rateWrap.appendChild(rateInput);

    slidersRow.appendChild(pitchWrap);
    slidersRow.appendChild(rateWrap);
    panel.appendChild(slidersRow);

    // Story Sentence Composer & Speak Button
    const storyForm = document.createElement('form');
    storyForm.className = 'voice-story-form';

    const storyInput = document.createElement('input');
    storyInput.type = 'text';
    storyInput.className = 'voice-story-input';
    storyInput.maxLength = 90;
    storyInput.value = activeTab.config?.storySentence || activePersona.samplePhrase;
    storyInput.placeholder = 'Type a sentence or story for your 3D buddy to speak...';

    const speakBtn = document.createElement('button');
    speakBtn.type = 'submit';
    speakBtn.className = 'voice-story-btn';
    speakBtn.textContent = 'Speak Story Aloud';

    storyForm.appendChild(storyInput);
    storyForm.appendChild(speakBtn);

    storyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const phrase = storyInput.value.trim();
      if (!phrase) return;
      activeTab.config.storySentence = phrase;
      onSpeakText(phrase);
      onAwardXP('voice', 8);
    });
    panel.appendChild(storyForm);

    // Science Fun Fact Footer
    const factBox = document.createElement('div');
    factBox.className = 'voice-science-fact';
    factBox.textContent = `Sound Science: ${activePersona.funFact}`;
    panel.appendChild(factBox);

    modeDeck.appendChild(panel);
  }

  // --- MODE 4: KID MAKER & DEV PROCESS STUDIO (MIND-MAP + QUEST + CODE BLUEPRINTS) ---
  function renderKidDevStudioDeck(activeTab) {
    const devModal = document.createElement('div');
    devModal.className = 'kids-dev-studio-card';

    // Top Header + 3 Sub-Stage Tabs
    const devHeader = document.createElement('div');
    devHeader.className = 'kids-dev-header';

    const titleWrap = document.createElement('div');
    const h2 = document.createElement('h2');
    h2.className = 'kids-dev-title';
    h2.textContent = `${activeTab.title} · Kid Maker & Dev Process`;

    const pSub = document.createElement('p');
    pSub.className = 'kids-dev-subtitle';
    pSub.textContent = 'Imagine on the Mind Map · Complete the Builder Quest · Export Real Project Code';

    titleWrap.appendChild(h2);
    titleWrap.appendChild(pSub);
    devHeader.appendChild(titleWrap);

    const subTabsBar = document.createElement('div');
    subTabsBar.className = 'kids-dev-subtabs';

    const subTabs = [
      { id: 'mindmap', label: '1. Idea Mind-Map' },
      { id: 'quest', label: '2. Builder Quest & Growth' },
      { id: 'blueprints', label: '3. Dev Code & Export' }
    ];

    subTabs.forEach((st) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `kids-dev-subtab-btn ${activeDevSubTab === st.id ? 'active' : ''}`;
      btn.textContent = st.label;
      btn.addEventListener('click', () => {
        activeDevSubTab = st.id;
        renderModeDeck();
      });
      subTabsBar.appendChild(btn);
    });

    devHeader.appendChild(subTabsBar);
    devModal.appendChild(devHeader);

    const contentArea = document.createElement('div');
    contentArea.className = 'kids-dev-body';
    devModal.appendChild(contentArea);

    if (activeDevSubTab === 'mindmap') {
      renderMindMapSubStage(contentArea);
    } else if (activeDevSubTab === 'quest') {
      renderBuilderQuestSubStage(contentArea);
    } else {
      renderBlueprintsSubStage(contentArea);
    }

    modeDeck.appendChild(devModal);
  }

  function renderMindMapSubStage(parent) {
    const split = document.createElement('div');
    split.className = 'kids-dev-split';

    const canvasBox = document.createElement('div');
    canvasBox.className = 'kids-mindmap-canvas-box';

    const canvasHint = document.createElement('div');
    canvasHint.className = 'kids-mindmap-hint';
    canvasHint.textContent = 'Drag any idea bubble to rearrange · Click a bubble so your 3D buddy explains it!';
    canvasBox.appendChild(canvasHint);

    const canvasEl = document.createElement('canvas');
    canvasEl.className = 'kids-mindmap-canvas';
    canvasBox.appendChild(canvasEl);
    split.appendChild(canvasBox);

    const sideInspector = document.createElement('div');
    sideInspector.className = 'kids-mindmap-inspector';

    const selTitle = document.createElement('h3');
    selTitle.className = 'inspector-node-title';
    const firstNode = currentGrowth.mindMapNodes[0];
    selTitle.textContent = firstNode ? firstNode.label : 'Select an Idea Bubble';

    const selRole = document.createElement('div');
    selRole.className = 'inspector-node-role';
    selRole.textContent = firstNode ? firstNode.role : '';

    const selNote = document.createElement('p');
    selNote.className = 'inspector-node-note';
    selNote.textContent = firstNode ? firstNode.note : '';

    const speakNodeBtn = document.createElement('button');
    speakNodeBtn.type = 'button';
    speakNodeBtn.className = 'kids-action-primary-btn';
    speakNodeBtn.textContent = 'Read Idea Bubble Aloud';
    let currentSelectedNode = firstNode;
    speakNodeBtn.addEventListener('click', () => {
      if (currentSelectedNode) {
        onSpeakText(`${currentSelectedNode.label}: ${currentSelectedNode.note}`);
      }
    });

    sideInspector.appendChild(selTitle);
    sideInspector.appendChild(selRole);
    sideInspector.appendChild(selNote);
    sideInspector.appendChild(speakNodeBtn);

    // Add New Idea Bubble Form
    const addForm = document.createElement('form');
    addForm.className = 'kids-add-node-form';

    const addHeading = document.createElement('div');
    addHeading.className = 'inspector-sub-heading';
    addHeading.textContent = 'Add Your Own Idea Bubble';

    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.className = 'kids-text-field';
    labelInput.placeholder = 'Idea title (e.g. Rainbow Wings)...';
    labelInput.maxLength = 18;

    const noteInput = document.createElement('input');
    noteInput.type = 'text';
    noteInput.className = 'kids-text-field';
    noteInput.placeholder = 'What does it do? (e.g. Helps fly to clouds)';
    noteInput.maxLength = 70;

    const addBtn = document.createElement('button');
    addBtn.type = 'submit';
    addBtn.className = 'kids-secondary-btn';
    addBtn.textContent = '+ Add Idea to Mind Map';

    addForm.appendChild(addHeading);
    addForm.appendChild(labelInput);
    addForm.appendChild(noteInput);
    addForm.appendChild(addBtn);

    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const l = labelInput.value.trim();
      if (!l) return;
      const n = noteInput.value.trim() || `Custom kid invention: ${l}!`;
      const palette = ['#38bdf8', '#f472b6', '#34d399', '#fbbf24', '#a78bfa'];
      const newNode = {
        id: `node-${Date.now()}`,
        label: l,
        role: 'My Invention',
        x: 0.25 + Math.random() * 0.5,
        y: 0.25 + Math.random() * 0.5,
        color: palette[currentGrowth.mindMapNodes.length % palette.length],
        note: n
      };
      currentGrowth.mindMapNodes.push(newNode);
      onAwardXP('maker', 12);
      onSpeakText(`Added ${l} to your invention mind map!`);
      labelInput.value = '';
      noteInput.value = '';
      selTitle.textContent = newNode.label;
      selRole.textContent = newNode.role;
      selNote.textContent = newNode.note;
      currentSelectedNode = newNode;
    });

    sideInspector.appendChild(addForm);
    split.appendChild(sideInspector);
    parent.appendChild(split);

    requestAnimationFrame(() => {
      activeMindMapController = mountKidMindMapCanvas(
        canvasEl,
        currentGrowth.mindMapNodes,
        (clickedNode) => {
          currentSelectedNode = clickedNode;
          selTitle.textContent = clickedNode.label;
          selRole.textContent = clickedNode.role;
          selNote.textContent = clickedNode.note;
          onSpeakText(`${clickedNode.label}. ${clickedNode.note}`);
          onAwardXP('maker', 4);
        }
      );
    });
  }

  function renderBuilderQuestSubStage(parent) {
    const split = document.createElement('div');
    split.className = 'kids-dev-split';

    // Left: Active Question & Options
    const qBox = document.createElement('div');
    qBox.className = 'kids-quest-box';

    const stepPills = document.createElement('div');
    stepPills.className = 'kids-quest-steps';
    KID_BUILDER_QUEST.forEach((q, idx) => {
      const sBtn = document.createElement('button');
      sBtn.type = 'button';
      sBtn.className = `kids-mini-btn ${idx === activeQuestStep ? 'active' : ''}`;
      sBtn.textContent = `Step ${idx + 1}`;
      sBtn.addEventListener('click', () => {
        activeQuestStep = idx;
        renderModeDeck();
      });
      stepPills.appendChild(sBtn);
    });
    qBox.appendChild(stepPills);

    const curQ = KID_BUILDER_QUEST[activeQuestStep] || KID_BUILDER_QUEST[0];

    const qHeading = document.createElement('h3');
    qHeading.className = 'kids-quest-heading';
    qHeading.textContent = curQ.stepTitle;
    qBox.appendChild(qHeading);

    const qText = document.createElement('p');
    qText.className = 'kids-quest-text';
    qText.textContent = curQ.question;
    qBox.appendChild(qText);

    const optsList = document.createElement('div');
    optsList.className = 'kids-quest-options';

    curQ.options.forEach((opt) => {
      const isSelected = (currentGrowth.questAnswers[curQ.id] || curQ.options[0].id) === opt.id;
      const oBtn = document.createElement('button');
      oBtn.type = 'button';
      oBtn.className = `kids-quest-option-btn ${isSelected ? 'selected' : ''}`;

      const topLine = document.createElement('div');
      topLine.className = 'quest-opt-top';

      const oLabel = document.createElement('span');
      oLabel.className = 'quest-opt-label';
      oLabel.textContent = opt.label;

      const oBoost = document.createElement('span');
      oBoost.className = 'quest-opt-boost';
      oBoost.textContent = opt.boost;

      topLine.appendChild(oLabel);
      topLine.appendChild(oBoost);

      const oDesc = document.createElement('div');
      oDesc.className = 'quest-opt-desc';
      oDesc.textContent = opt.desc;

      oBtn.appendChild(topLine);
      oBtn.appendChild(oDesc);

      oBtn.addEventListener('click', () => {
        currentGrowth.questAnswers[curQ.id] = opt.id;
        onAwardXP('maker', 10);
        onSpeakText(`${opt.label}! ${opt.desc}`);
        if (activeQuestStep < KID_BUILDER_QUEST.length - 1) {
          activeQuestStep++;
        }
        renderModeDeck();
      });

      optsList.appendChild(oBtn);
    });
    qBox.appendChild(optsList);
    split.appendChild(qBox);

    // Right: Live Learning & Growth Gauges + Kindness Promise Seal
    const rightCol = document.createElement('div');
    rightCol.className = 'kids-quest-sidebar';

    const scores = computeQuestScores(currentGrowth.questAnswers);
    const gaugeTitle = document.createElement('h3');
    gaugeTitle.className = 'inspector-node-title';
    gaugeTitle.textContent = 'Learning & Growth Meters';
    rightCol.appendChild(gaugeTitle);

    const meters = [
      { label: 'Design & Color Spark', val: scores.creativity, color: '#f472b6' },
      { label: 'Nature & Meadow Science', val: scores.nature, color: '#34d399' },
      { label: 'Words, Voices & Phonics', val: scores.voice, color: '#fbbf24' },
      { label: 'Kid Maker & Dev Logic', val: scores.maker, color: '#38bdf8' }
    ];

    meters.forEach((m) => {
      const mRow = document.createElement('div');
      mRow.className = 'kids-meter-row';

      const mTop = document.createElement('div');
      mTop.className = 'kids-meter-top';
      const lSpan = document.createElement('span');
      lSpan.textContent = m.label;
      const vSpan = document.createElement('span');
      vSpan.textContent = `${m.val}%`;
      mTop.appendChild(lSpan);
      mTop.appendChild(vSpan);

      const track = document.createElement('div');
      track.className = 'kids-meter-track';
      const fill = document.createElement('div');
      fill.className = 'kids-meter-fill';
      fill.style.width = `${m.val}%`;
      fill.style.background = m.color;
      track.appendChild(fill);

      mRow.appendChild(mTop);
      mRow.appendChild(track);
      rightCol.appendChild(mRow);
    });

    // Kid Inventor Kindness Promise Seal
    const pledgeBox = document.createElement('form');
    pledgeBox.className = 'kids-pledge-box';

    const pledgeTitle = document.createElement('div');
    pledgeTitle.className = 'inspector-sub-heading';
    pledgeTitle.textContent = currentGrowth.pledgeSigned
      ? `Kindness Promise Sealed by ${currentGrowth.inventorName}`
      : 'Sign Your Kid Inventor Promise';

    const nameField = document.createElement('input');
    nameField.type = 'text';
    nameField.className = 'kids-text-field';
    nameField.value = currentGrowth.inventorName || 'Young Inventor';
    nameField.placeholder = 'Your First Name or Inventor Nickname...';
    nameField.maxLength = 22;

    const sealBtn = document.createElement('button');
    sealBtn.type = 'submit';
    sealBtn.className = 'kids-action-primary-btn';
    sealBtn.textContent = currentGrowth.pledgeSigned
      ? 'Promise Sealed · Update Name'
      : 'Seal My Kindness Promise';

    pledgeBox.appendChild(pledgeTitle);
    pledgeBox.appendChild(nameField);
    pledgeBox.appendChild(sealBtn);

    pledgeBox.addEventListener('submit', (e) => {
      e.preventDefault();
      currentGrowth.inventorName = nameField.value.trim() || 'Young Inventor';
      currentGrowth.pledgeSigned = true;
      onAwardXP('maker', 20);
      onSpeakText(
        `Awesome job ${currentGrowth.inventorName}! Your Kid Inventor Kindness Promise is sealed! Now let's check out your code blueprints!`
      );
      activeDevSubTab = 'blueprints';
      renderModeDeck();
    });

    rightCol.appendChild(pledgeBox);
    split.appendChild(rightCol);
    parent.appendChild(split);
  }

  function renderBlueprintsSubStage(parent) {
    const files = generateKidBlueprints(currentTabs, currentGrowth);
    const activeFile = files[activeBlueprintIdx] || files[0];

    const split = document.createElement('div');
    split.className = 'kids-dev-split';

    // Left: File Selector List + Kid Code Lesson
    const fileListCol = document.createElement('div');
    fileListCol.className = 'kids-blueprint-list';

    files.forEach((f, idx) => {
      const fBtn = document.createElement('button');
      fBtn.type = 'button';
      fBtn.className = `kids-blueprint-item ${idx === activeBlueprintIdx ? 'active' : ''}`;

      const fTitle = document.createElement('div');
      fTitle.className = 'blueprint-item-title';
      fTitle.textContent = f.title;

      const fName = document.createElement('div');
      fName.className = 'blueprint-item-name';
      fName.textContent = `${f.filename} · ${f.language.toUpperCase()}`;

      fBtn.appendChild(fTitle);
      fBtn.appendChild(fName);

      fBtn.addEventListener('click', () => {
        activeBlueprintIdx = idx;
        renderModeDeck();
      });

      fileListCol.appendChild(fBtn);
    });

    const lessonBox = document.createElement('div');
    lessonBox.className = 'kids-code-lesson-box';

    const lessonText = document.createElement('p');
    lessonText.textContent = activeFile.lesson;

    const readLessonBtn = document.createElement('button');
    readLessonBtn.type = 'button';
    readLessonBtn.className = 'kids-secondary-btn';
    readLessonBtn.textContent = 'Explain This Code Aloud';
    readLessonBtn.addEventListener('click', () => {
      onSpeakText(activeFile.lesson);
      onAwardXP('maker', 6);
    });

    lessonBox.appendChild(lessonText);
    lessonBox.appendChild(readLessonBtn);
    fileListCol.appendChild(lessonBox);
    split.appendChild(fileListCol);

    // Right: Code Preview & Download Actions
    const codeViewerCol = document.createElement('div');
    codeViewerCol.className = 'kids-code-viewer';

    const codeBar = document.createElement('div');
    codeBar.className = 'kids-code-topbar';

    const fnSpan = document.createElement('span');
    fnSpan.className = 'kids-code-filename';
    fnSpan.textContent = activeFile.filename;

    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'kids-code-actions';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'kids-mini-btn';
    copyBtn.textContent = 'Copy Code';
    copyBtn.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(activeFile.content).catch(() => {});
      }
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy Code';
      }, 1600);
    });

    const dlBtn = document.createElement('button');
    dlBtn.type = 'button';
    dlBtn.className = 'kids-mini-btn primary-accent';
    dlBtn.textContent = `Download ${activeFile.filename}`;
    dlBtn.addEventListener('click', () => {
      const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activeFile.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onAwardXP('maker', 10);
    });

    actionsWrap.appendChild(copyBtn);
    actionsWrap.appendChild(dlBtn);
    codeBar.appendChild(fnSpan);
    codeBar.appendChild(actionsWrap);

    const pre = document.createElement('pre');
    pre.className = 'kids-code-pre';
    const code = document.createElement('code');
    code.textContent = activeFile.content;
    pre.appendChild(code);

    codeViewerCol.appendChild(codeBar);
    codeViewerCol.appendChild(pre);
    split.appendChild(codeViewerCol);

    parent.appendChild(split);
  }

  // =========================================================================
  // MODAL: CREATE / CUSTOMIZE DESIGN TAB (UP TO 4 TABS) OR VIEW GROWTH
  // =========================================================================
  function openGrowthAndTabModal(mode = 'new-tab', editIdx = currentTabIndex) {
    modalBackdrop.replaceChildren();
    modalBackdrop.classList.add('open');
    modalBackdrop.setAttribute('aria-hidden', 'false');

    const dialog = document.createElement('div');
    dialog.className = 'kids-modal-dialog';
    dialog.addEventListener('click', (e) => e.stopPropagation());

    const mHeader = document.createElement('div');
    mHeader.className = 'kids-modal-header';

    const mTitle = document.createElement('h2');
    mTitle.className = 'kids-modal-title';
    mTitle.textContent =
      mode === 'new-tab'
        ? `Create New Design Tab (${currentTabs.length + 1} of 4)`
        : mode === 'edit-tab'
        ? `Customize Design Tab ${editIdx + 1}`
        : 'My Learning Growth & 4-Tab Studio';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'kids-modal-close';
    closeBtn.textContent = 'Done';
    closeBtn.addEventListener('click', closeModal);

    mHeader.appendChild(mTitle);
    mHeader.appendChild(closeBtn);
    dialog.appendChild(mHeader);

    const targetTab =
      mode === 'edit-tab'
        ? currentTabs[editIdx]
        : {
            title: `Design Tab ${currentTabs.length + 1}`,
            mode: DESIGN_TAB_MODES[currentTabs.length % DESIGN_TAB_MODES.length].id,
            config: { voiceId: 'sunny' }
          };

    let selectedMode = targetTab.mode || 'mascot';
    let selectedVoice = targetTab.config?.voiceId || 'sunny';

    // Growth Summary Banner inside Modal
    const stage = getGrowthStage(currentGrowth.xp);
    const growthBanner = document.createElement('div');
    growthBanner.className = 'kids-modal-growth-banner';

    const gLeft = document.createElement('div');
    const gTitle = document.createElement('div');
    gTitle.className = 'growth-banner-title';
    gTitle.textContent = `Level ${stage.level}: ${stage.title} · ${currentGrowth.xp} XP · ${currentGrowth.stars} Stars`;
    const gDesc = document.createElement('div');
    gDesc.className = 'growth-banner-desc';
    gDesc.textContent = stage.summary;
    gLeft.appendChild(gTitle);
    gLeft.appendChild(gDesc);
    growthBanner.appendChild(gLeft);
    dialog.appendChild(growthBanner);

    // Tab Name + Mode Picker Form
    const form = document.createElement('form');
    form.className = 'kids-modal-form';

    const nameLbl = document.createElement('label');
    nameLbl.className = 'kids-form-label';
    nameLbl.textContent = 'Tab Name (What are you designing?)';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'kids-text-field';
    nameInput.maxLength = 22;
    nameInput.value = targetTab.title || 'My Awesome Design';
    nameLbl.appendChild(nameInput);
    form.appendChild(nameLbl);

    const modeHeading = document.createElement('div');
    modeHeading.className = 'kids-form-label';
    modeHeading.textContent = 'Choose Your Interactive Activity for This Tab:';
    form.appendChild(modeHeading);

    const modesGrid = document.createElement('div');
    modesGrid.className = 'kids-mode-picker-grid';
    const modeCardButtons = {};

    DESIGN_TAB_MODES.forEach((m) => {
      const mCard = document.createElement('button');
      mCard.type = 'button';
      mCard.className = `kids-mode-picker-card ${selectedMode === m.id ? 'active' : ''}`;

      const mName = document.createElement('div');
      mName.className = 'mode-card-name';
      mName.textContent = m.label;

      const mDesc = document.createElement('div');
      mDesc.className = 'mode-card-desc';
      mDesc.textContent = m.shortDesc;

      mCard.appendChild(mName);
      mCard.appendChild(mDesc);

      mCard.addEventListener('click', () => {
        selectedMode = m.id;
        Object.values(modeCardButtons).forEach((b) => b.classList.remove('active'));
        mCard.classList.add('active');
        if (mode === 'new-tab') {
          nameInput.value = m.defaultTitle;
        }
      });

      modeCardButtons[m.id] = mCard;
      modesGrid.appendChild(mCard);
    });
    form.appendChild(modesGrid);

    // Voice Persona Selector for this Tab
    const voiceHeading = document.createElement('div');
    voiceHeading.className = 'kids-form-label';
    voiceHeading.textContent = 'Choose Character Voice for This Tab:';
    form.appendChild(voiceHeading);

    const voiceGrid = document.createElement('div');
    voiceGrid.className = 'kids-voice-picker-row';
    const voiceButtons = {};

    VOICE_PERSONAS.forEach((vp) => {
      const vBtn = document.createElement('button');
      vBtn.type = 'button';
      vBtn.className = `kids-mini-btn ${selectedVoice === vp.id ? 'active' : ''}`;
      vBtn.textContent = `${vp.name} (${vp.role.split(' ')[0]})`;
      vBtn.addEventListener('click', () => {
        selectedVoice = vp.id;
        Object.values(voiceButtons).forEach((b) => b.classList.remove('active'));
        vBtn.classList.add('active');
        playPersonaChime(vp.id);
      });
      voiceButtons[vp.id] = vBtn;
      voiceGrid.appendChild(vBtn);
    });
    form.appendChild(voiceGrid);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'kids-action-primary-btn';
    submitBtn.textContent =
      mode === 'new-tab' && currentTabs.length < 4
        ? 'Create Design Tab'
        : `Save Changes to Tab ${(mode === 'edit-tab' ? editIdx : currentTabIndex) + 1}`;
    form.appendChild(submitBtn);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const cleanTitle = nameInput.value.trim() || 'My Design';
      if (mode === 'new-tab' && currentTabs.length < 4) {
        onAddTab({ title: cleanTitle, mode: selectedMode, voiceId: selectedVoice });
      } else {
        const idxToUpdate = mode === 'edit-tab' ? editIdx : currentTabIndex;
        onUpdateTab(idxToUpdate, {
          title: cleanTitle,
          mode: selectedMode,
          voiceId: selectedVoice
        });
      }
      closeModal();
    });

    dialog.appendChild(form);
    modalBackdrop.appendChild(dialog);
  }

  function closeModal() {
    modalBackdrop.classList.remove('open');
    modalBackdrop.setAttribute('aria-hidden', 'true');
  }

  modalBackdrop.addEventListener('click', closeModal);

  renderTopBar();
  renderModeDeck();

  return {
    sync({ tabs: nextTabs, activeTabIndex: nextIdx, growthState: nextGrowth }) {
      if (nextTabs) currentTabs = nextTabs;
      if (typeof nextIdx === 'number') currentTabIndex = nextIdx;
      if (nextGrowth) currentGrowth = nextGrowth;
      renderTopBar();
      renderModeDeck();
      if (isNarratorMenuOpen) {
        renderNarratorMenu();
      }
    },
    updateGardenCoverage(pct) {
      const el = document.getElementById('garden-coverage-readout');
      if (el) {
        el.textContent = `Meadow Growth: ${pct}% Sprouted · Drag on soil to paint 3D grass · Shift + drag to orbit`;
      }
    }
  };
}
