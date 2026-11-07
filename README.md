# YouTube Traffic & Video Viewer Actor

A full-featured [Apify Actor](https://apify.com) built with Crawlee, Puppeteer, and Puppeteer-Extra Stealth to automate organic-style YouTube video viewing, dwell-time testing, and traffic generation.

---

## 🚀 Key Features

- 🎥 **Targeted YouTube Playback:** Plays watch URLs and shorts with automated play initiation.
- 🥷 **Stealth Anti-Detection:** Uses `puppeteer-extra-plugin-stealth` and randomized viewport dimensions to prevent automated bot flagging.
- 🍪 **Auto-Consent Handling:** Automatically detects and accepts YouTube/Google GDPR cookie prompts.
- ⚡ **Ad Handling:** Automatically clicks "Skip Ad" and closes overlay sponsor banners as soon as they become dismissible.
- ⏱️ **Configurable Dwell Time:** Randomizes watch duration between configurable minimum and maximum thresholds.
- 📉 **Low-Bandwidth Mode:** Automatically sets video playback quality to 144p (`tiny`) and mutes audio to minimize proxy bandwidth and CPU utilization.
- 🖱️ **Human Micro-Interactions:** Performs subtle cursor gliding and small scrolls to emulate natural user activity.
- 🌐 **Proxy Rotation:** Integrates natively with Apify Residential/Datacenter Proxies or custom proxy groups.
- 📊 **Structured Dataset Output:** Records video metadata (title, channel, seconds played, timestamp) to the Apify dataset.

---

## ⚙️ Input Schema

| Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `videoUrls` | `Array<string>` | *(Required)* | List of YouTube video URLs to view. |
| `viewsPerVideo` | `Integer` | `1` | Number of viewing sessions to run for each URL. |
| `watchDurationMin` | `Integer` | `45` | Minimum watch time in seconds. |
| `watchDurationMax` | `Integer` | `90` | Maximum watch time in seconds (randomized per session). |
| `playbackQuality` | `String` | `"tiny"` | Resolution: `"tiny"` (144p), `"small"` (240p), `"medium"` (360p), `"hd720"`. |
| `muteAudio` | `Boolean` | `true` | Mutes audio for autoplay compliance and silent background runs. |
| `enableInteractions` | `Boolean` | `true` | Simulates mouse moves, small scroll actions, and pop-up dismissals. |
| `maxConcurrency` | `Integer` | `1` | Number of simultaneous browser instances. |
| `proxyConfiguration`| `Object` | `{ "useApifyProxy": true }` | Proxy settings (Residential recommended for high view count). |

### Example Input JSON

```json
{
  "videoUrls": [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  ],
  "viewsPerVideo": 5,
  "watchDurationMin": 60,
  "watchDurationMax": 120,
  "playbackQuality": "tiny",
  "muteAudio": true,
  "enableInteractions": true,
  "maxConcurrency": 2,
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  }
}
```

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
# Install Apify CLI globally if needed
npm install -g apify-cli

# Login to your Apify account
apify login

# Test run locally with Apify environment
apify run

# Push directly to your Apify Actor repository
apify push
```

---

## 📁 Project Structure

```
youtube-traffic-actor/
├── .actor/
│   ├── actor.json           # Actor configuration & metadata
│   └── input_schema.json    # Interactive input form for Apify Console
├── src/
│   └── main.js              # Core crawler, stealth, playback & interaction logic
├── Dockerfile               # Production container definition
├── package.json             # Dependencies and runtime scripts
└── README.md                # Documentation
```
