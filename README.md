# Stealth Browser Skill

A powerful browser automation skill for AI agents that bypasses anti-automation detection. Based on OpenClaw's browser technology.

[中文文档](README.zh-CN.md) | [English](README.md)

## 🌟 Features

- ✅ **Bypass Anti-Automation Detection** - Stealth mode enabled
- ✅ **Real Chrome Browser** - Not headless automation
- ✅ **Persistent Profiles** - Like a real user
- ✅ **AI-Friendly Interface** - Easy for agents to use
- ✅ **Screenshot Support** - Capture page state
- ✅ **Form Interaction** - Fill and submit forms

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/stealth-browser-skill.git
cd stealth-browser-skill

# Install dependencies
npm install

# Install Chrome extension (see below)
```

### Usage

```bash
# Start browser
npm start

# Or use CLI
./cli/stealth-browser open https://example.com
./cli/stealth-browser screenshot
./cli/stealth-browser click @e1
```

## 📁 Project Structure

```
stealth-browser-skill/
├── cli/                    # Command line interface
├── extension/              # Chrome extension
├── server/                 # Relay server
├── lib/                    # Core library
├── profiles/               # Browser profiles
└── README.md
```

## 🔧 Configuration

### Chrome Extension Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder

### Environment Variables

```bash
export STEALTH_BROWSER_PORT=18792
export STEALTH_BROWSER_PROFILE_DIR=~/.stealth-browser/profiles
```

## 🛡️ Anti-Detection Features

- Persistent user data directory
- Real Chrome executable
- Modified fingerprints
- CDP command filtering
- Human-like behavior

## 📄 License

MIT License - See [LICENSE](LICENSE)

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md)

## 🙏 Credits

Based on OpenClaw's browser technology - https://github.com/openclaw/openclaw
