# VoxStudio — ElevenLabs AI Voice Narration Studio

A modern, responsive, and studio-grade Text-to-Speech web application built with **HTML5, CSS3, and Vanilla JavaScript**, powered by the **ElevenLabs API**.

Turn any text into lifelike, emotionally rich narration using ElevenLabs neural speech models, with real-time waveform visualization, dynamic voice & model selection, audio player controls, and one-click MP3 download.

---

## 🌟 Key Features

1. **Text Script Editor**:
   - Large, comfortable writing textarea with auto-resizing.
   - Real-time character counter, word counter, and estimated speech duration (~150 wpm).
   - Quick one-click prompt presets (*Audiobook*, *Tech Keynote*, *Documentary*, *Sci-Fi Epic*).
   - Paste from clipboard & Clear text shortcuts.
   - Keyboard shortcut: **`Ctrl + Enter`** to synthesize and play instantly.

2. **Model Selection**:
   - Dynamic model selector loaded directly from the ElevenLabs API (`/v1/models`).
   - Supports:
     - `Eleven Multilingual v2` (29 languages, state-of-the-art emotional cadence)
     - `Eleven Turbo v2.5` (low latency, high quality, 32 languages)
     - `Eleven Flash v2.5` (ultra-fast ~75ms latency)
     - `Eleven v4` & `Eleven v4 Turbo` (90+ languages, fast & emotive)
     - `Eleven v3` & `Eleven v3 Conversational`
     - `Eleven Turbo v2` (English fast)
   - Dynamic badge tags and descriptions for each model.

3. **Narrator Voices & Sample Preview**:
   - Automatically loads all premade and custom voices from your ElevenLabs account (`/v1/voices`).
   - Metadata badges for each voice: Accent (*British, American, Australian*), Gender, and Tone (*Narrative, Conversational, Sassy, Confident*).
   - **Sample Voice Preview Button**: Listen to sample audio of any voice before generating your script.

4. **Acoustic Voice Fine-Tuning**:
   - Stability slider (0.00 – 1.00)
   - Clarity & Similarity Boost slider (0.00 – 1.00)
   - Style Exaggeration slider (0.00 – 1.00)
   - Speaker Boost toggle for enhanced presence and resonance.

5. **Integrated Audio Player & Waveform Visualizer**:
   - Real-time **Web Audio API** canvas visualizer (dancing neon frequency bars / sound waves reacting to speech).
   - Interactive timeline scrubber with click-to-seek and buffered indicators.
   - Play/Pause, Rewind 5s, Forward 5s, Restart.
   - Variable playback speed control (0.8x, 1.0x, 1.25x, 1.5x, 2.0x).
   - Volume slider & instant mute toggle.
   - Continuous audio loop toggle.
   - **Direct .MP3 Download** with descriptive filenames (`voxstudio-george-eleven_multilingual_v2-...mp3`).

6. **Session Narration History**:
   - Keeps track of all generated clips during your session.
   - Instant replay of previous audio clips.
   - Direct download links for each saved clip.

7. **API Key & Subscription Monitor**:
   - Pre-configured with your ElevenLabs API key.
   - Live subscription tracker displaying your character quota (e.g. `0 / 10,000` chars used on Free tier) and voice slots.
   - Secure settings modal allowing you to inspect, verify, or change the API key.

8. **Aesthetic Design**:
   - Dark futuristic theme with glassmorphic cards and subtle neon glows.
   - Responsive layout for desktop, tablet, and mobile screens.
   - Theme toggle (Dark / Light mode).

---

## 🚀 How to Run the Application

You can run VoxStudio in two simple ways:

### Option 1: Direct Browser Launch
Simply double-click `index.html` or open it with your favorite browser:
```bash
# On Windows PowerShell:
Start-Process index.html
```

### Option 2: Local Python Server (Recommended)
VoxStudio comes with a ready-to-run lightweight Python server:
```bash
python server.py
```
Or double-click `start.bat` on Windows. This will automatically open `http://localhost:8000` in your browser.

---

## ⚙️ Configuration & API Key

The application is pre-configured with your key:
```
sk_d65b3949e718dc18403900eb959418145ed922fdcc02a27c
```
- Click the **Settings** icon in the header to view or update your key anytime.
- Use **Verify & Sync** to test connection to ElevenLabs and sync remaining character quota.

---

## 📁 Project Structure

```
c:\Users\Lenovo\portfolio\lab\
├── index.html       # Semantic HTML5 markup, layout, and accessible controls
├── style.css        # Modern CSS design system, glassmorphism, animations & player styling
├── app.js           # ElevenLabs API client, Web Audio visualizer, playback & history logic
├── server.py        # Local Python HTTP server with CORS headers & auto-browser launch
├── start.bat        # Windows one-click start script
└── README.md        # Documentation and guide
```

---

## 🎧 Shortcuts
- **`Ctrl + Enter`** (or `Cmd + Enter`): Synthesize & play speech immediately.
- **Spacebar**: Play/pause when focused on the audio controls.
