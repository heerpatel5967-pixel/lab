/**
 * VOXSTUDIO - ElevenLabs AI Voice Narration Application
 * Core JavaScript logic: API integration, audio playback,
 * Web Audio API visualizer, history manager, and UI interactions.
 */

(function () {
  'use strict';

  // =========================================================================
  // State & Configuration
  // =========================================================================
  const CONFIG = {
    DEFAULT_API_KEY: 'sk_d65b3949e718dc18403900eb959418145ed922fdcc02a27c',
    API_BASE: 'https://api.elevenlabs.io/v1',
    STORAGE_KEY: 'voxstudio_elevenlabs_key',
    STORAGE_THEME: 'voxstudio_theme',
  };

  const state = {
    apiKey: localStorage.getItem(CONFIG.STORAGE_KEY) || CONFIG.DEFAULT_API_KEY,
    models: [],
    voices: [],
    currentAudioBlob: null,
    currentAudioUrl: null,
    currentVoicePreviewUrl: null,
    isGenerating: false,
    history: [],
    userQuota: null,
    playbackSpeeds: [0.8, 1.0, 1.25, 1.5, 2.0],
    currentSpeedIndex: 1, // 1.0x default
  };

  // Web Audio Visualizer Context
  let audioCtx = null;
  let analyser = null;
  let audioSourceNode = null;
  let visualizerAnimationId = null;

  // =========================================================================
  // DOM Elements
  // =========================================================================
  const el = {
    // Header & Status
    apiStatusBadge: document.getElementById('apiStatusBadge'),
    statusLabel: document.getElementById('statusLabel'),
    quotaPill: document.getElementById('quotaPill'),
    quotaText: document.getElementById('quotaText'),
    openSettingsBtn: document.getElementById('openSettingsBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),

    // Input & Presets
    scriptInput: document.getElementById('scriptInput'),
    pasteBtn: document.getElementById('pasteBtn'),
    clearBtn: document.getElementById('clearBtn'),
    charCountNum: document.getElementById('charCountNum'),
    wordCount: document.getElementById('wordCount'),
    estTime: document.getElementById('estTime'),
    presetChips: document.querySelectorAll('.preset-chip'),

    // Advanced Sliders
    stabilitySlider: document.getElementById('stabilitySlider'),
    stabilityVal: document.getElementById('stabilityVal'),
    similaritySlider: document.getElementById('similaritySlider'),
    similarityVal: document.getElementById('similarityVal'),
    styleSlider: document.getElementById('styleSlider'),
    styleVal: document.getElementById('styleVal'),
    speakerBoostToggle: document.getElementById('speakerBoostToggle'),

    // Model & Voice Selectors
    modelSelect: document.getElementById('modelSelect'),
    modelBadge: document.getElementById('modelBadge'),
    modelDescription: document.getElementById('modelDescription'),
    voiceSelect: document.getElementById('voiceSelect'),
    voiceTagsContainer: document.getElementById('voiceTagsContainer'),
    previewVoiceBtn: document.getElementById('previewVoiceBtn'),
    previewBtnText: document.getElementById('previewBtnText'),
    audioFormatSelect: document.getElementById('audioFormatSelect'),
    refreshVoiceModelBtn: document.getElementById('refreshVoiceModelBtn'),

    // Action Button
    playNarrationBtn: document.getElementById('playNarrationBtn'),
    playBtnIcon: document.getElementById('playBtnIcon'),
    playSpinner: document.getElementById('playSpinner'),
    playBtnMainLabel: document.getElementById('playBtnMainLabel'),
    playBtnSubLabel: document.getElementById('playBtnSubLabel'),
    generationStatus: document.getElementById('generationStatus'),

    // Audio Player Elements
    playerCard: document.getElementById('playerCard'),
    trackTitle: document.getElementById('trackTitle'),
    trackSubtitle: document.getElementById('trackSubtitle'),
    downloadAudioBtn: document.getElementById('downloadAudioBtn'),
    copyShareBtn: document.getElementById('copyShareBtn'),
    visualizerCanvas: document.getElementById('visualizerCanvas'),
    visualizerIdle: document.getElementById('visualizerIdle'),
    currentTime: document.getElementById('currentTime'),
    totalDuration: document.getElementById('totalDuration'),
    seekBarTrack: document.getElementById('seekBarTrack'),
    seekBarFill: document.getElementById('seekBarFill'),
    seekBarBuffered: document.getElementById('seekBarBuffered'),
    ctrlPlayPauseBtn: document.getElementById('ctrlPlayPauseBtn'),
    ctrlPlayPauseIcon: document.getElementById('ctrlPlayPauseIcon'),
    seekBackBtn: document.getElementById('seekBackBtn'),
    seekFwdBtn: document.getElementById('seekFwdBtn'),
    restartBtn: document.getElementById('restartBtn'),
    speedToggleBtn: document.getElementById('speedToggleBtn'),
    speedVal: document.getElementById('speedVal'),
    muteToggleBtn: document.getElementById('muteToggleBtn'),
    volumeIcon: document.getElementById('volumeIcon'),
    volumeSlider: document.getElementById('volumeSlider'),
    loopToggleBtn: document.getElementById('loopToggleBtn'),
    audioElement: document.getElementById('audioElement'),
    previewAudioElement: document.getElementById('previewAudioElement'),

    // History
    historyCount: document.getElementById('historyCount'),
    historyList: document.getElementById('historyList'),
    historyEmpty: document.getElementById('historyEmpty'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),

    // Settings Modal
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    toggleKeyVisibilityBtn: document.getElementById('toggleKeyVisibilityBtn'),
    keyEyeIcon: document.getElementById('keyEyeIcon'),
    verifyKeyBtn: document.getElementById('verifyKeyBtn'),
    saveKeyBtn: document.getElementById('saveKeyBtn'),
    accountTier: document.getElementById('accountTier'),
    charUsageStats: document.getElementById('charUsageStats'),
    charUsageFill: document.getElementById('charUsageFill'),
    voiceSlotsVal: document.getElementById('voiceSlotsVal'),
    resetDateVal: document.getElementById('resetDateVal'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer'),
  };

  // Preset Text Snippets
  const PRESETS = {
    story: "The old library was quiet, save for the ticking of an antique brass clock. Dust motes drifted lazily through shafts of amber sunlight, illuminating shelves stacked high with leather-bound tales of forgotten kingdoms.",
    keynote: "Today, we're unveiling an entirely new paradigm for human-machine interaction. By fusing neural generative synthesis with spatial acoustic resonance, speech feels indistinguishable from reality.",
    podcast: "Deep beneath the Arctic ice sheet, in perpetual midnight, hydrothermal vents nourish alien ecosystems that defy our standard understanding of terrestrial biology.",
    cinematic: "In the year 2184, the research outpost orbiting the rings of Saturn transmitted a final sequence of harmonic pulses—and then went completely dark.",
  };

  // Model Descriptions and Badges Mapping
  const MODEL_METADATA = {
    eleven_multilingual_v2: {
      badge: 'Best Emotion',
      desc: 'Our most life-like, emotionally rich model across 29 languages. Best for storytelling, audiobooks, and expressive narration.',
    },
    eleven_turbo_v2_5: {
      badge: 'Low Latency',
      desc: 'High-quality synthesis with ultra-low latency across 32 languages. Great for real-time interactive apps and dialogue.',
    },
    eleven_flash_v2_5: {
      badge: '~75ms Speed',
      desc: 'Our ultra-fast synthesis model across 32 languages. Optimized for instant response times.',
    },
    eleven_v4: {
      badge: 'Fastest 90+ Langs',
      desc: 'State-of-the-art emotive model with rich multilingual cadence supporting 90+ languages.',
    },
    eleven_v4_turbo: {
      badge: 'Turbo 90+ Langs',
      desc: 'Fastest and emotive model optimized for low latency across 90+ languages.',
    },
    eleven_v3: {
      badge: 'Expressive',
      desc: 'Highly expressive speech model supporting 70+ languages with deep tonal nuances.',
    },
    eleven_turbo_v2: {
      badge: 'English Fast',
      desc: 'English-only low-latency model tuned for rapid generation speed.',
    },
  };

  // =========================================================================
  // Notifications & Toast
  // =========================================================================
  function showToast(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass} toast-icon"></i>
      <span class="toast-text">${escapeHtml(message)}</span>
    `;

    el.toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 350);
    }, duration);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // API Client
  // =========================================================================
  async function fetchUserQuota() {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/user`, {
        headers: { 'xi-api-key': state.apiKey },
      });

      if (!res.ok) {
        throw new Error(`User status error (${res.status})`);
      }

      const data = await res.json();
      state.userQuota = data.subscription;
      updateQuotaUI(data.subscription);
      setConnectionStatus(true);
      return data;
    } catch (err) {
      console.warn('Failed to fetch user quota:', err);
      setConnectionStatus(false, err.message);
      return null;
    }
  }

  function updateQuotaUI(sub) {
    if (!sub) return;
    const used = sub.character_count || 0;
    const limit = sub.character_limit || 10000;
    const remaining = Math.max(0, limit - used);
    const percent = Math.min(100, Math.round((used / limit) * 100));

    el.quotaText.textContent = `${used.toLocaleString()} / ${limit.toLocaleString()} chars`;
    el.charUsageStats.textContent = `${used.toLocaleString()} / ${limit.toLocaleString()} (${remaining.toLocaleString()} left)`;
    el.charUsageFill.style.width = `${percent}%`;

    el.accountTier.textContent = `${sub.tier || 'Free'} Tier`;
    el.voiceSlotsVal.textContent = `${sub.voice_slots_used || 0} / ${sub.voice_limit || 3}`;

    if (sub.next_character_count_reset_unix) {
      const resetDate = new Date(sub.next_character_count_reset_unix * 1000);
      el.resetDateVal.textContent = resetDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    }
  }

  function setConnectionStatus(connected, message = '') {
    const dot = el.apiStatusBadge.querySelector('.status-dot');
    if (connected) {
      dot.className = 'status-dot online';
      el.statusLabel.textContent = 'API Connected';
    } else {
      dot.className = 'status-dot error';
      el.statusLabel.textContent = message || 'API Disconnected';
    }
  }

  async function loadModels() {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/models`, {
        headers: { 'xi-api-key': state.apiKey },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Filter only models that support text-to-speech
      const ttsModels = data.filter((m) => m.can_do_text_to_speech);
      if (ttsModels.length > 0) {
        state.models = ttsModels;
        populateModelDropdown(ttsModels);
      }
    } catch (err) {
      console.warn('Could not load dynamic models, using built-in defaults:', err);
      // Keep existing default options in select
    }
    updateModelInfo();
  }

  function populateModelDropdown(modelsList) {
    const currentVal = el.modelSelect.value;
    el.modelSelect.innerHTML = '';

    // Prioritize multilingual v2, turbo v2.5, flash v2.5, v4
    const preferredOrder = [
      'eleven_multilingual_v2',
      'eleven_turbo_v2_5',
      'eleven_flash_v2_5',
      'eleven_v4',
      'eleven_v4_turbo',
      'eleven_v3',
      'eleven_turbo_v2',
    ];

    modelsList.sort((a, b) => {
      const indexA = preferredOrder.indexOf(a.model_id);
      const indexB = preferredOrder.indexOf(b.model_id);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    modelsList.forEach((m) => {
      const opt = document.createElement('option');
      opt.value = m.model_id;
      let label = m.name;
      if (m.languages && m.languages.length) {
        label += ` (${m.languages.length} Languages)`;
      }
      opt.textContent = label;
      el.modelSelect.appendChild(opt);
    });

    if (modelsList.some((m) => m.model_id === currentVal)) {
      el.modelSelect.value = currentVal;
    } else {
      el.modelSelect.value = 'eleven_multilingual_v2';
    }
  }

  async function loadVoices() {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/voices`, {
        headers: { 'xi-api-key': state.apiKey },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.voices && data.voices.length > 0) {
        state.voices = data.voices;
        populateVoiceDropdown(data.voices);
      }
    } catch (err) {
      console.warn('Could not load dynamic voices, using built-in list:', err);
    }
    updateVoiceTags();
  }

  function populateVoiceDropdown(voicesList) {
    const currentVal = el.voiceSelect.value;
    el.voiceSelect.innerHTML = '';

    voicesList.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v.voice_id;

      // Build descriptive title
      let label = v.name;
      const labels = v.labels || {};
      const descParts = [];
      if (labels.accent) descParts.push(capitalize(labels.accent));
      if (labels.gender) descParts.push(capitalize(labels.gender));
      if (labels.descriptive) descParts.push(capitalize(labels.descriptive));

      if (descParts.length > 0) {
        label += ` (${descParts.join(', ')})`;
      }

      opt.textContent = label;
      el.voiceSelect.appendChild(opt);
    });

    // Default to George or previous value
    if (voicesList.some((v) => v.voice_id === currentVal)) {
      el.voiceSelect.value = currentVal;
    } else {
      const george = voicesList.find((v) => v.name.toLowerCase().includes('george'));
      if (george) el.voiceSelect.value = george.voice_id;
    }
  }

  function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function updateModelInfo() {
    const modelId = el.modelSelect.value;
    const meta = MODEL_METADATA[modelId] || {
      badge: 'Neural',
      desc: 'ElevenLabs neural speech synthesis model.',
    };

    el.modelBadge.textContent = meta.badge;
    el.modelDescription.textContent = meta.desc;
  }

  function updateVoiceTags() {
    const voiceId = el.voiceSelect.value;
    const voice = state.voices.find((v) => v.voice_id === voiceId);

    el.voiceTagsContainer.innerHTML = '';

    if (!voice || !voice.labels) {
      // Default fallback pills
      el.voiceTagsContainer.innerHTML = `
        <span class="tag-pill"><i class="fa-solid fa-microphone"></i> Studio Voice</span>
        <span class="tag-pill"><i class="fa-solid fa-sparkles"></i> High Fidelity</span>
      `;
      state.currentVoicePreviewUrl = null;
      return;
    }

    state.currentVoicePreviewUrl = voice.preview_url || null;

    const labels = voice.labels;
    if (labels.accent) {
      addTagPill('fa-earth-americas', capitalize(labels.accent));
    }
    if (labels.gender) {
      addTagPill('fa-user', capitalize(labels.gender));
    }
    if (labels.age) {
      addTagPill('fa-clock', capitalize(labels.age).replace('_', ' '));
    }
    if (labels.use_case) {
      addTagPill('fa-sparkles', capitalize(labels.use_case).replace('_', ' '));
    }
    if (labels.descriptive) {
      addTagPill('fa-wand-magic-sparkles', capitalize(labels.descriptive));
    }
  }

  function addTagPill(iconClass, text) {
    const pill = document.createElement('span');
    pill.className = 'tag-pill';
    pill.innerHTML = `<i class="fa-solid ${iconClass}"></i> ${escapeHtml(text)}`;
    el.voiceTagsContainer.appendChild(pill);
  }

  // =========================================================================
  // Text-To-Speech Generation
  // =========================================================================
  async function generateSpeech() {
    const text = el.scriptInput.value.trim();

    if (!text) {
      showToast('Please type or paste some text into the script input field.', 'error');
      el.scriptInput.focus();
      return;
    }

    if (text.length > 5000) {
      showToast('Text exceeds 5,000 characters limit for a single narration request.', 'error');
      return;
    }

    if (state.isGenerating) return;

    const voiceId = el.voiceSelect.value;
    const modelId = el.modelSelect.value;
    const outputFormat = el.audioFormatSelect.value;

    const voiceSettings = {
      stability: parseFloat(el.stabilitySlider.value),
      similarity_boost: parseFloat(el.similaritySlider.value),
      style: parseFloat(el.styleSlider.value),
      use_speaker_boost: el.speakerBoostToggle.checked,
    };

    setGeneratingState(true);

    try {
      el.generationStatus.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin text-primary"></i> Synthesizing audio via ElevenLabs...`;

      const requestUrl = `${CONFIG.API_BASE}/text-to-speech/${voiceId}?output_format=${outputFormat}`;
      const payload = {
        text: text,
        model_id: modelId,
        voice_settings: voiceSettings,
      };

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'xi-api-key': state.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorDetail = `Status code ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson && errJson.detail) {
            errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
          }
        } catch (_) {}

        throw new Error(errorDetail);
      }

      // Convert audio binary stream into Blob
      const audioBlob = await response.blob();
      state.currentAudioBlob = audioBlob;

      if (state.currentAudioUrl) {
        URL.revokeObjectURL(state.currentAudioUrl);
      }
      state.currentAudioUrl = URL.createObjectURL(audioBlob);

      // Setup audio element source
      el.audioElement.src = state.currentAudioUrl;
      el.audioElement.playbackRate = state.playbackSpeeds[state.currentSpeedIndex];

      // Update Track info
      const voiceName = el.voiceSelect.options[el.voiceSelect.selectedIndex]?.text.split('(')[0].trim() || 'Selected Voice';
      const modelName = el.modelSelect.options[el.modelSelect.selectedIndex]?.text.split('(')[0].trim() || modelId;

      el.trackTitle.textContent = `Narration: "${text.substring(0, 42)}${text.length > 42 ? '...' : ''}"`;
      el.trackSubtitle.textContent = `Model: ${modelName} • Voice: ${voiceName}`;

      // Start audio playback
      await playAudio();

      // Add to session history
      addToHistory({
        text,
        voiceName,
        modelName,
        voiceId,
        modelId,
        blob: audioBlob,
        url: state.currentAudioUrl,
        timestamp: new Date(),
      });

      // Update user quota in background
      fetchUserQuota();

      showToast('Narration synthesized successfully!', 'success');
      el.generationStatus.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> Synthesis complete & playing`;
    } catch (err) {
      console.error('Speech generation failed:', err);
      showToast(`Generation failed: ${err.message}`, 'error', 6000);
      el.generationStatus.innerHTML = `<i class="fa-solid fa-circle-exclamation text-danger"></i> Failed: ${escapeHtml(err.message)}`;
    } finally {
      setGeneratingState(false);
    }
  }

  function setGeneratingState(generating) {
    state.isGenerating = generating;
    el.playNarrationBtn.disabled = generating;

    if (generating) {
      el.playBtnIcon.style.display = 'none';
      el.playSpinner.style.display = 'block';
      el.playBtnMainLabel.textContent = 'Generating Speech...';
      el.playBtnSubLabel.textContent = 'Connecting to neural voice synthesis';
    } else {
      el.playBtnIcon.style.display = 'inline-block';
      el.playSpinner.style.display = 'none';
      el.playBtnMainLabel.textContent = 'Synthesize & Play Narration';
      el.playBtnSubLabel.textContent = 'Using ElevenLabs API • Shortcut: Ctrl+Enter';
    }
  }

  // =========================================================================
  // Audio Playback & Web Audio API Visualizer
  // =========================================================================
  function initAudioVisualizer() {
    if (audioCtx) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();

      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128; // 64 frequency data bins
      analyser.smoothingTimeConstant = 0.8;

      audioSourceNode = audioCtx.createMediaElementSource(el.audioElement);
      audioSourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);

      drawVisualizerLoop();
    } catch (e) {
      console.warn('Web Audio API initialization note:', e);
    }
  }

  function drawVisualizerLoop() {
    const canvas = el.visualizerCanvas;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    function renderFrame() {
      visualizerAnimationId = requestAnimationFrame(renderFrame);

      ctx.clearRect(0, 0, width, height);

      const isPlaying = !el.audioElement.paused && !el.audioElement.ended && el.audioElement.currentTime > 0;

      if (!isPlaying || !analyser) {
        el.visualizerIdle.style.opacity = '1';

        // Draw flat subtle idle waveform
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
        ctx.lineWidth = 2;
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        return;
      }

      el.visualizerIdle.style.opacity = '0';
      analyser.getByteFrequencyData(dataArray);

      // Create gradient for waveform bars
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, '#4f46e5');
      gradient.addColorStop(0.5, '#8b5cf6');
      gradient.addColorStop(1, '#06b6d4');

      const barWidth = (width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * (height * 0.85);

        ctx.fillStyle = gradient;
        // Rounded bar top
        ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);

        // Reflection below
        ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
        ctx.fillRect(x, height, barWidth - 2, barHeight * 0.2);

        x += barWidth;
      }
    }

    renderFrame();
  }

  async function playAudio() {
    initAudioVisualizer();
    if (audioCtx && audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    try {
      await el.audioElement.play();
      updatePlayPauseButton(true);
    } catch (err) {
      console.warn('Playback error / autoplay blocked:', err);
      updatePlayPauseButton(false);
    }
  }

  function pauseAudio() {
    el.audioElement.pause();
    updatePlayPauseButton(false);
  }

  function togglePlayPause() {
    if (!el.audioElement.src) {
      showToast('No audio loaded yet. Generate speech first!', 'info');
      return;
    }
    if (el.audioElement.paused) {
      playAudio();
    } else {
      pauseAudio();
    }
  }

  function updatePlayPauseButton(isPlaying) {
    if (isPlaying) {
      el.ctrlPlayPauseIcon.className = 'fa-solid fa-pause';
    } else {
      el.ctrlPlayPauseIcon.className = 'fa-solid fa-play';
    }
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Preview Voice Sample
  async function toggleVoicePreview() {
    if (!state.currentVoicePreviewUrl) {
      showToast('No sample preview audio available for this voice.', 'info');
      return;
    }

    const preview = el.previewAudioElement;

    if (!preview.paused && preview.src === state.currentVoicePreviewUrl) {
      preview.pause();
      el.previewBtnText.textContent = 'Preview Voice';
      el.previewVoiceBtn.querySelector('i').className = 'fa-solid fa-circle-play';
      return;
    }

    // Stop main audio if playing
    if (!el.audioElement.paused) pauseAudio();

    preview.src = state.currentVoicePreviewUrl;
    try {
      el.previewBtnText.textContent = 'Playing...';
      el.previewVoiceBtn.querySelector('i').className = 'fa-solid fa-circle-pause';
      await preview.play();
    } catch (err) {
      console.warn('Preview play error:', err);
      el.previewBtnText.textContent = 'Preview Voice';
      el.previewVoiceBtn.querySelector('i').className = 'fa-solid fa-circle-play';
    }
  }

  // =========================================================================
  // Download & Copy Helpers
  // =========================================================================
  function downloadCurrentAudio() {
    if (!state.currentAudioBlob) {
      showToast('No audio generated yet to download.', 'info');
      return;
    }

    const voiceName = el.voiceSelect.options[el.voiceSelect.selectedIndex]?.text.split('(')[0].trim().toLowerCase().replace(/\s+/g, '-');
    const modelId = el.modelSelect.value;
    const filename = `voxstudio-${voiceName}-${modelId}-${Date.now()}.mp3`;

    const a = document.createElement('a');
    a.href = state.currentAudioUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast(`Downloading "${filename}"`, 'success');
  }

  function copyCurrentScript() {
    const text = el.scriptInput.value;
    if (!text) {
      showToast('No text to copy.', 'info');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      showToast('Script copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Unable to copy to clipboard.', 'error');
    });
  }

  // =========================================================================
  // Session History Management
  // =========================================================================
  function addToHistory(item) {
    state.history.unshift(item);
    renderHistory();
  }

  function renderHistory() {
    el.historyCount.textContent = state.history.length;

    if (state.history.length === 0) {
      el.historyEmpty.style.display = 'flex';
      el.historyList.querySelectorAll('.history-item').forEach((i) => i.remove());
      return;
    }

    el.historyEmpty.style.display = 'none';

    // Clear existing history items
    el.historyList.querySelectorAll('.history-item').forEach((i) => i.remove());

    state.history.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'history-item';

      const timeStr = item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      card.innerHTML = `
        <div class="history-left">
          <button class="history-play-btn" data-index="${index}" title="Play this narration">
            <i class="fa-solid fa-play"></i>
          </button>
          <div class="history-info">
            <span class="history-text-preview" title="${escapeHtml(item.text)}">
              ${escapeHtml(item.text)}
            </span>
            <div class="history-meta">
              <span><i class="fa-solid fa-user"></i> ${escapeHtml(item.voiceName)}</span>
              <span>&bull;</span>
              <span><i class="fa-solid fa-brain"></i> ${escapeHtml(item.modelName)}</span>
              <span>&bull;</span>
              <span><i class="fa-solid fa-clock"></i> ${timeStr}</span>
            </div>
          </div>
        </div>
        <div class="history-actions">
          <button class="chip-btn history-download-btn" data-index="${index}" title="Download audio">
            <i class="fa-solid fa-download"></i>
          </button>
        </div>
      `;

      el.historyList.appendChild(card);
    });
  }

  function clearHistory() {
    state.history = [];
    renderHistory();
    showToast('Session history cleared', 'info');
  }

  // =========================================================================
  // Text Input Stats & Auto Resize
  // =========================================================================
  function updateTextStats() {
    const text = el.scriptInput.value;
    const charCount = text.length;
    el.charCountNum.textContent = charCount.toLocaleString();

    // Word count
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    el.wordCount.textContent = `${words.toLocaleString()} words`;

    // Estimated speech time (~150 words per minute => ~2.5 words/sec)
    const estSeconds = words > 0 ? Math.ceil((words / 150) * 60) : 0;
    el.estTime.textContent = estSeconds < 60 ? `~${estSeconds} sec speech` : `~${(estSeconds / 60).toFixed(1)} min speech`;

    // Warn if near limit
    if (charCount > 4800) {
      el.charCountNum.style.color = 'var(--accent-rose)';
    } else {
      el.charCountNum.style.color = '';
    }
  }

  // =========================================================================
  // Settings & Theme
  // =========================================================================
  function openSettings() {
    el.apiKeyInput.value = state.apiKey;
    el.settingsModal.classList.add('open');
    fetchUserQuota();
  }

  function closeSettings() {
    el.settingsModal.classList.remove('open');
  }

  function saveSettings() {
    const newKey = el.apiKeyInput.value.trim();
    if (!newKey) {
      showToast('API key cannot be empty.', 'error');
      return;
    }
    state.apiKey = newKey;
    localStorage.setItem(CONFIG.STORAGE_KEY, newKey);
    showToast('API Key saved successfully!', 'success');
    closeSettings();
    loadModels();
    loadVoices();
    fetchUserQuota();
  }

  async function verifyApiKey() {
    const keyToTest = el.apiKeyInput.value.trim();
    if (!keyToTest) {
      showToast('Please enter an API key to verify.', 'error');
      return;
    }

    try {
      el.verifyKeyBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Verifying...`;
      const res = await fetch(`${CONFIG.API_BASE}/user`, {
        headers: { 'xi-api-key': keyToTest },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      state.apiKey = keyToTest;
      localStorage.setItem(CONFIG.STORAGE_KEY, keyToTest);
      updateQuotaUI(data.subscription);
      showToast('API key verified! Subscription synced.', 'success');
    } catch (err) {
      showToast(`Verification failed: ${err.message}`, 'error');
    } finally {
      el.verifyKeyBtn.innerHTML = `<i class="fa-solid fa-shield-check"></i> Verify & Sync`;
    }
  }

  function toggleTheme() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const nextTheme = isLight ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem(CONFIG.STORAGE_KEY + '_theme', nextTheme);

    const icon = el.themeToggleBtn.querySelector('i');
    icon.className = nextTheme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }

  // =========================================================================
  // Event Listeners
  // =========================================================================
  function setupEventListeners() {
    // Generate Button & Keyboard Shortcut
    el.playNarrationBtn.addEventListener('click', generateSpeech);
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        generateSpeech();
      }
    });

    // Text Input Stats
    el.scriptInput.addEventListener('input', updateTextStats);

    // Paste & Clear
    el.clearBtn.addEventListener('click', () => {
      el.scriptInput.value = '';
      updateTextStats();
      el.scriptInput.focus();
    });

    el.pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        el.scriptInput.value = text;
        updateTextStats();
        showToast('Text pasted from clipboard', 'info');
      } catch (err) {
        showToast('Please press Ctrl+V to paste into the text box.', 'info');
      }
    });

    // Preset chips
    el.presetChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const key = chip.getAttribute('data-preset');
        if (PRESETS[key]) {
          el.scriptInput.value = PRESETS[key];
          updateTextStats();
          showToast(`Loaded ${chip.textContent.trim()} prompt`, 'info');
        }
      });
    });

    // Sliders
    el.stabilitySlider.addEventListener('input', () => {
      el.stabilityVal.textContent = parseFloat(el.stabilitySlider.value).toFixed(2);
    });
    el.similaritySlider.addEventListener('input', () => {
      el.similarityVal.textContent = parseFloat(el.similaritySlider.value).toFixed(2);
    });
    el.styleSlider.addEventListener('input', () => {
      el.styleVal.textContent = parseFloat(el.styleSlider.value).toFixed(2);
    });

    // Model & Voice Change
    el.modelSelect.addEventListener('change', updateModelInfo);
    el.voiceSelect.addEventListener('change', updateVoiceTags);
    el.refreshVoiceModelBtn.addEventListener('click', () => {
      loadModels();
      loadVoices();
      fetchUserQuota();
      showToast('Refreshing models and voices from ElevenLabs...', 'info');
    });

    // Voice Preview Button
    el.previewVoiceBtn.addEventListener('click', toggleVoicePreview);
    el.previewAudioElement.addEventListener('ended', () => {
      el.previewBtnText.textContent = 'Preview Voice';
      el.previewVoiceBtn.querySelector('i').className = 'fa-solid fa-circle-play';
    });

    // Audio Player Events
    el.ctrlPlayPauseBtn.addEventListener('click', togglePlayPause);

    el.seekBackBtn.addEventListener('click', () => {
      el.audioElement.currentTime = Math.max(0, el.audioElement.currentTime - 5);
    });

    el.seekFwdBtn.addEventListener('click', () => {
      el.audioElement.currentTime = Math.min(el.audioElement.duration || 0, el.audioElement.currentTime + 5);
    });

    el.restartBtn.addEventListener('click', () => {
      el.audioElement.currentTime = 0;
      playAudio();
    });

    // Playback Speed Toggle
    el.speedToggleBtn.addEventListener('click', () => {
      state.currentSpeedIndex = (state.currentSpeedIndex + 1) % state.playbackSpeeds.length;
      const newSpeed = state.playbackSpeeds[state.currentSpeedIndex];
      el.audioElement.playbackRate = newSpeed;
      el.speedVal.textContent = `${newSpeed.toFixed(1)}x`;
    });

    // Volume & Mute
    el.volumeSlider.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      el.audioElement.volume = vol;
      el.audioElement.muted = vol === 0;
      updateVolumeIcon(vol);
    });

    el.muteToggleBtn.addEventListener('click', () => {
      el.audioElement.muted = !el.audioElement.muted;
      if (el.audioElement.muted) {
        el.volumeIcon.className = 'fa-solid fa-volume-xmark';
      } else {
        updateVolumeIcon(el.audioElement.volume);
      }
    });

    function updateVolumeIcon(vol) {
      if (vol === 0) el.volumeIcon.className = 'fa-solid fa-volume-xmark';
      else if (vol < 0.5) el.volumeIcon.className = 'fa-solid fa-volume-low';
      else el.volumeIcon.className = 'fa-solid fa-volume-high';
    }

    // Loop Toggle
    el.loopToggleBtn.addEventListener('click', () => {
      el.audioElement.loop = !el.audioElement.loop;
      el.loopToggleBtn.style.color = el.audioElement.loop ? 'var(--primary-500)' : '';
      showToast(el.audioElement.loop ? 'Audio loop enabled' : 'Audio loop disabled', 'info');
    });

    // Audio Element Time Update & Progress
    el.audioElement.addEventListener('timeupdate', () => {
      const cur = el.audioElement.currentTime || 0;
      const dur = el.audioElement.duration || 0;
      el.currentTime.textContent = formatTime(cur);

      if (dur > 0) {
        const pct = (cur / dur) * 100;
        el.seekBarFill.style.width = `${pct}%`;
      }
    });

    el.audioElement.addEventListener('loadedmetadata', () => {
      el.totalDuration.textContent = formatTime(el.audioElement.duration);
    });

    el.audioElement.addEventListener('ended', () => {
      if (!el.audioElement.loop) {
        updatePlayPauseButton(false);
      }
    });

    // Seek Bar Click / Drag
    el.seekBarTrack.addEventListener('click', (e) => {
      const rect = el.seekBarTrack.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const fraction = Math.max(0, Math.min(1, clickX / rect.width));
      if (el.audioElement.duration) {
        el.audioElement.currentTime = fraction * el.audioElement.duration;
      }
    });

    // Download & Copy buttons
    el.downloadAudioBtn.addEventListener('click', downloadCurrentAudio);
    el.copyShareBtn.addEventListener('click', copyCurrentScript);

    // History Item Clicks (Event Delegation)
    el.historyList.addEventListener('click', (e) => {
      const playBtn = e.target.closest('.history-play-btn');
      if (playBtn) {
        const index = parseInt(playBtn.getAttribute('data-index'), 10);
        const item = state.history[index];
        if (item) {
          el.audioElement.src = item.url;
          el.trackTitle.textContent = `Narration: "${item.text.substring(0, 42)}..."`;
          el.trackSubtitle.textContent = `Model: ${item.modelName} • Voice: ${item.voiceName}`;
          playAudio();
          showToast(`Playing historical clip`, 'info');
        }
        return;
      }

      const dlBtn = e.target.closest('.history-download-btn');
      if (dlBtn) {
        const index = parseInt(dlBtn.getAttribute('data-index'), 10);
        const item = state.history[index];
        if (item) {
          const a = document.createElement('a');
          a.href = item.url;
          a.download = `narration-${item.voiceName}-${Date.now()}.mp3`;
          a.click();
        }
      }
    });

    el.clearHistoryBtn.addEventListener('click', clearHistory);

    // Settings Modal
    el.openSettingsBtn.addEventListener('click', openSettings);
    el.closeSettingsBtn.addEventListener('click', closeSettings);
    el.settingsModal.addEventListener('click', (e) => {
      if (e.target === el.settingsModal) closeSettings();
    });

    el.toggleKeyVisibilityBtn.addEventListener('click', () => {
      const isPass = el.apiKeyInput.type === 'password';
      el.apiKeyInput.type = isPass ? 'text' : 'password';
      el.keyEyeIcon.className = isPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });

    el.saveKeyBtn.addEventListener('click', saveSettings);
    el.verifyKeyBtn.addEventListener('click', verifyApiKey);

    // Theme Toggle
    el.themeToggleBtn.addEventListener('click', toggleTheme);
  }

  // =========================================================================
  // App Initialization
  // =========================================================================
  function init() {
    // Restore theme
    const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEY + '_theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      const icon = el.themeToggleBtn.querySelector('i');
      icon.className = savedTheme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }

    // Setup events
    setupEventListeners();

    // Default sample text
    el.scriptInput.value = PRESETS.story;
    updateTextStats();

    // Load initial data
    loadModels();
    loadVoices();
    fetchUserQuota();

    console.log('VoxStudio ElevenLabs Studio initialized successfully.');
  }

  // Launch on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
