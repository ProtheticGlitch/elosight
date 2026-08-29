# EloSight

**See the ELO. Play smarter.**

Browser extension for [FACEIT](https://www.faceit.com) — ELO analytics, win probability, map stats, extended skill levels, and optional automation. Inspired by [Repeek](https://chromewebstore.google.com/detail/repeek-formerly-faceit-en/mokknliiomknodkdmpcellamkopbdmao) and [FACEIT FORECAST](https://chromewebstore.google.com/detail/faceit-forecast/mpkkcddegpblmobincjkbpgfcbejjbcp).

> Unofficial extension. Not affiliated with or endorsed by FACEIT Ltd.

## Features

### Match room
- **Team average ELO** — compare team strength at a glance
- **Per-player ELO badges** — next to every nickname
- **Win probability** — logistic model based on ELO difference
- **ELO change estimate** — approximate gain/loss preview

### Profile
- **Extended levels** — L11, L12+ for 2000+ ELO players
- **Map statistics** — win rate, games played, K/D per map

### Match history
- **Average lobby ELO** per match
- **Estimated ELO delta** per game

### Automation (opt-in, off by default)
- Auto **Ready** in match room
- Auto-accept **party invites**

## Install

### Chrome / Edge / Brave

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this project folder

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. **Load Temporary Add-on**
3. Select `manifest.json`

## FACEIT API key (recommended)

For full map stats and player data:

1. Register at [developers.faceit.com](https://developers.faceit.com/)
2. Create an app and copy your **API Key**
3. Open the EloSight popup → paste the key

Without a key, the extension falls back to data intercepted from FACEIT pages.

**Never commit your API key.** Store it only in the extension settings.

## Project structure

```
├── manifest.json
├── icons/
├── popup/
├── src/
│   ├── background.js
│   ├── injected-bridge.js
│   ├── content-global.js
│   ├── modules/
│   ├── styles/
│   └── utils/
├── PRIVACY.md
└── README.md
```

## Privacy

See [PRIVACY.md](./PRIVACY.md). EloSight does not collect or transmit personal data. Settings are stored locally in your browser.

## Development

Pure JavaScript, no build step. After changes:

1. Reload the extension at `chrome://extensions/`
2. Refresh faceit.com

## License

MIT
