---
name: stealth-browser
description: Anti-detection browser automation skill for AI agents. Bypass anti-automation checks with real Chrome browser.
version: 1.0.0
author: shy3130
license: MIT
homepage: https://github.com/shy3130/stealth-browser-skill
---

# Stealth Browser Skill

A powerful browser automation skill that bypasses anti-automation detection using real Chrome browser with persistent profiles.

## Features

- ✅ **Bypass Anti-Automation Detection** - Stealth mode enabled
- ✅ **Real Chrome Browser** - Not headless automation
- ✅ **Persistent Profiles** - Like a real user
- ✅ **AI-Friendly Interface** - Easy for agents to use
- ✅ **Screenshot Support** - Capture page state
- ✅ **Form Interaction** - Fill and submit forms

## Installation

```bash
# Install dependencies
npm install

# Install Chrome extension
# 1. Open Chrome and go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the extension/ folder
```

## Usage

### Start Browser

```bash
npm start
# or
./cli/stealth-browser.js start
```

### Open URL

```bash
./cli/stealth-browser.js open https://example.com
```

### Get Page Snapshot

```bash
./cli/stealth-browser.js snapshot
```

### Click Element

```bash
./cli/stealth-browser.js click @e1
```

### Fill Form

```bash
./cli/stealth-browser.js fill @e2 "your text"
```

### Take Screenshot

```bash
./cli/stealth-browser.js screenshot --full
```

## Configuration

### Environment Variables

```bash
export STEALTH_BROWSER_PORT=18792
export STEALTH_BROWSER_PROFILE_DIR=~/.stealth-browser/profiles
```

### Chrome Extension

The Chrome extension is required for anti-detection features. Install from `extension/` folder.

## API Reference

### BrowserSession

```javascript
import { BrowserSession } from './lib/browser-session.js';

const session = new BrowserSession();
await session.connect('http://127.0.0.1:18792');

// Navigate
await session.navigate('https://example.com');

// Get snapshot
const snapshot = await session.snapshot();

// Click element
await session.click('@e1');

// Fill input
await session.fill('@e2', 'text');

// Screenshot
await session.screenshot({ path: 'screenshot.png' });

// Close
await session.close();
```

## Anti-Detection Features

- Persistent user data directory
- Real Chrome executable
- Modified browser fingerprints
- CDP command filtering
- Human-like behavior patterns
- Stealth script injection

## Requirements

- Node.js >= 18.0.0
- Google Chrome or Chromium
- macOS, Linux, or Windows

## Links

- [GitHub Repository](https://github.com/shy3130/stealth-browser-skill)
- [中文文档](README.zh-CN.md)
- [Issues](https://github.com/shy3130/stealth-browser-skill/issues)

## License

MIT License - See [LICENSE](LICENSE)

## Credits

Based on OpenClaw's browser technology - https://github.com/openclaw/openclaw
