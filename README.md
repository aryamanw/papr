<div align="center">

<img src="assets/store/icon-128.svg" width="128" height="128" alt="Papr icon" />

# Papr

**Apply a paper-like matte texture to every web page - quieter eyes, longer reading.**

[Website and live demo](https://aryamanw.github.io/papr/)

[![version](https://img.shields.io/badge/version-1.2.3-c4924a?style=flat-square&labelColor=fdf8f2)](package.json)
[![license](https://img.shields.io/badge/license-MIT-9c7d5e?style=flat-square&labelColor=fdf8f2)](LICENSE)
[![Chrome MV3](https://img.shields.io/badge/Chrome-Manifest_V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)

</div>

---

## Features

- **Overlay toggle** - enable or disable globally from the popup
- **6 paper textures** - Print Paper, Woven Fabric, Fine Press, Aged Newsprint, Torinoko Washi, Parchment
- **Intensity slider** - fine-tune opacity from 15% to 50%
- **Persistent state** - settings survive browser restarts via `chrome.storage.sync`
- **Zero interactivity impact** - `pointer-events: none` overlay never captures clicks or scrolls

## Installation

> Requires Google Chrome.

### Option 1 - Download a release (recommended)

1. Download `papr-1.2.5.zip` from the [latest release](https://github.com/aryamanw/papr/releases/latest)
2. Unzip to a folder on your machine
3. Open `chrome://extensions` in Chrome
4. Enable **Developer Mode** (top-right toggle)
5. Click **Load unpacked** → select the unzipped folder

### Option 2 - Build from source

> Requires Node.js ≥ 18.

```bash
git clone https://github.com/aryamanw/papr.git
cd papr
npm install
npm run build
```

1. Open `chrome://extensions` in Chrome
2. Enable **Developer Mode** (top-right toggle)
3. Click **Load unpacked** → select the `dist/` folder

## Architecture

Papr uses a three-layer architecture where the background service worker owns all persistent state.

```
content script  ←→  background service worker  ←→  popup / options UI
```

| Layer | Path | Responsibility |
|---|---|---|
| Content script | `src/content/` | Injects `#papr-overlay` above all page content; applies texture via CSS + SVG `feTurbulence` filters |
| Background worker | `src/background/` | Persists settings in `chrome.storage.sync`; broadcasts state changes to open tabs |
| Popup | `src/popup/` | Toggle, texture picker, intensity slider, snooze button |

The overlay uses `mix-blend-mode: multiply` so paper grain blends naturally with any page content, while `pointer-events: none` ensures it never intercepts input.
