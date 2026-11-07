# YouTube Traffic & Video Viewer Actor

A full-featured [Apify Actor](https://apify.com) built with Crawlee, Puppeteer, and Puppeteer-Extra Stealth to automate organic-style YouTube video viewing, dwell-time testing, multi-device emulation, and traffic generation.

---

## 🚀 Key Features

- 📱 **Multi-Device Emulation:** Realistic device profiles across Desktop (Windows, macOS, Linux), Mobile (iPhone 14/15, Google Pixel 8, Samsung Galaxy S24), and Tablet (iPad Pro, Galaxy Tab).
- 🧬 **Advanced Fingerprinting Evasion:** (`enableAdvancedFingerprinting`):
  - Injects subtle 1-bit noise into HTML5 Canvas fingerprints (`toDataURL` / `getImageData`).
  - Spoofs WebGL unmasked vendor & renderer to match device hardware (e.g., Apple M2/GPU on Mac/iOS, Qualcomm Adreno on Android, NVIDIA/Intel/AMD on Windows).
  - Micro-variance injection in `AudioContext` channel dynamics.
  - Aligns `navigator.hardwareConcurrency` and `navigator.deviceMemory` with simulated device specs.
- 🔄 **Browser Per Proxy & Session Isolation:** (`browserPerProxy`):
  - Retires browser after single page/session to prevent cross-session cookie, socket, or cache leakage between different proxy IPs.
- 🎲 **Traffic Distribution:** Choose random distribution (mimicking real-world traffic: 50% mobile, 40% desktop, 10% tablet) or lock to specific devices/categories.
- 🎥 **Targeted YouTube Playback:** Automatically handles desktop and mobile YouTube players, starting video playback without user gesture restrictions.
- 🥷 **Stealth Anti-Detection:** Uses `puppeteer-extra-plugin-stealth`, native touch emulation on mobile, and authentic user agents to prevent automated bot flagging.
- 🍪 **Auto-Consent Handling:** Automatically detects and accepts YouTube/Google GDPR cookie and "Before you continue" prompts.
- ⚡ **Ad Handling:** Automatically clicks "Skip Ad" and closes overlay sponsor banners as soon as they become dismissible.
- ⏱️ **Configurable Dwell Time:** Randomizes watch duration between configurable minimum and maximum thresholds.
- 📉 **Low-Bandwidth Mode:** Automatically enforces 144p (`tiny`) video quality and mutes audio to minimize proxy bandwidth and CPU utilization.
- 🖱️ **Human Micro-Interactions:** Performs subtle cursor gliding on desktop and realistic touchscreen taps/swipes on mobile.
- 🌐 **Proxy Rotation:** Integrates natively with Apify Residential/Datacenter Proxies or custom proxy groups.
- 📊 **Structured Dataset Output:** Records video metadata (title, channel, device profile, viewport, seconds played, timestamp) to the Apify dataset.

---

## 📱 Supported Devices

| Category | Profiles Included |
| :--- | :--- |
| **Desktop** | Windows 11 (Chrome / Edge), macOS Sonoma (Safari / Chrome), Ubuntu Linux (Chrome) |
| **Mobile** | Apple iPhone 15 Pro, iPhone 14, Google Pixel 8 Pro, Samsung Galaxy S24 Ultra |
| **Tablet** | Apple iPad Pro 12.9 (iPadOS), Samsung Galaxy Tab S9 (Android) |

---

## ⚙️ Input Schema

| Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `videoUrls` | `Array<string>` | *(Required)* | List of YouTube video URLs to view. |
| `viewsPerVideo` | `Integer` | `1` | Number of viewing sessions to run for each URL. |
| `deviceType` | `String` | `"RANDOM"` | `"RANDOM"`, `"DESKTOP_ONLY"`, `"MOBILE_ONLY"`, `"TABLET_ONLY"`, or `"CUSTOM"`. |
| `customDevice` | `String` | `"windows_chrome"` | Specific device profile when `deviceType` is set to `"CUSTOM"`. |
| `enableAdvancedFingerprinting` | `Boolean` | `true` | Spoofs Canvas, WebGL, AudioContext, and Hardware specs to match simulated devices. |
| `browserPerProxy` | `Boolean` | `true` | Spawns a fresh browser process per proxy/view for total session isolation. |
| `watchDurationMin` | `Integer` | `45` | Minimum watch time in seconds. |
| `watchDurationMax` | `Integer` | `90` | Maximum watch time in seconds (randomized per session). |
| `playbackQuality` | `String` | `"tiny"` | Resolution: `"tiny"` (144p), `"small"` (240p), `"medium"` (360p), `"hd720"`. |
| `muteAudio` | `Boolean` | `true` | Mutes audio for autoplay compliance and silent background runs. |
| `enableInteractions` | `Boolean` | `true` | Simulates mouse moves/touch taps and subtle scroll actions. |
| `maxConcurrency` | `Integer` | `1` | Number of simultaneous browser instances. |
| `proxyConfiguration`| `Object` | `{ "useApifyProxy": true }` | Proxy settings (Residential recommended for high view count). |

---

## 🛠️ Local Development & Deployment

### 1. Run Locally
```bash
npm install
npm start
```
*(Optionally provide inputs in `storage/key_value_stores/default/INPUT.json`)*

### 2. Run with Apify CLI
```bash
# Test run locally with Apify environment
npx apify-cli run

# Push directly to your Apify Actor repository
npx apify-cli push
```

---

## 📁 Project Structure

```
youtube-traffic-actor/
├── .actor/
│   ├── actor.json           # Actor configuration & metadata
│   └── input_schema.json    # Interactive input form for Apify Console (with device & fingerprint options)
├── src/
│   ├── devices.js           # Multi-device definitions & resolution logic
│   ├── fingerprint.js       # Advanced Canvas/WebGL/Audio/Hardware fingerprint evasion
│   └── main.js              # Core crawler, stealth, playback & interaction logic
├── Dockerfile               # Production container definition
├── package.json             # Dependencies and runtime scripts
└── README.md                # Documentation
```
