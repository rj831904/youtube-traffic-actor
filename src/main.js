import { Actor, log } from 'apify';
import { PuppeteerCrawler } from 'crawlee';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { resolveDeviceProfile } from './devices.js';
import { injectAdvancedFingerprint } from './fingerprint.js';

// Initialize the stealth plugin to avoid anti-bot detection
puppeteerExtra.use(StealthPlugin());

await Actor.init();

// Fetch input parameters
const input = (await Actor.getInput()) || {};
const {
    videoUrls = [],
    viewsPerVideo = 1,
    deviceType = 'RANDOM',
    customDevice = 'windows_chrome',
    watchDurationMin = 45,
    watchDurationMax = 90,
    playbackQuality = 'tiny',
    muteAudio = true,
    enableInteractions = true,
    enableAdvancedFingerprinting = true,
    browserPerProxy = true,
    maxConcurrency = 1,
    proxyConfiguration: rawProxyConfig,
} = input;

if (!Array.isArray(videoUrls) || videoUrls.length === 0) {
    log.error('No video URLs provided. Please specify at least one valid YouTube URL.');
    await Actor.exit({ exitCode: 1 });
}

log.info('Starting YouTube Traffic & Viewer Actor', {
    totalUrls: videoUrls.length,
    viewsPerVideo,
    deviceType,
    customDevice: deviceType === 'CUSTOM' ? customDevice : undefined,
    watchDurationMin,
    watchDurationMax,
    playbackQuality,
    muteAudio,
    enableInteractions,
    enableAdvancedFingerprinting,
    browserPerProxy,
    maxConcurrency,
});

// Configure proxy if specified
let proxyConfiguration;
if (rawProxyConfig) {
    proxyConfiguration = await Actor.createProxyConfiguration(rawProxyConfig);
}

// Build request list with desired sessions and per-session device profile
const requests = [];
for (let urlIdx = 0; urlIdx < videoUrls.length; urlIdx++) {
    const rawUrl = videoUrls[urlIdx].trim();
    if (!rawUrl) continue;

    for (let sessionIdx = 1; sessionIdx <= viewsPerVideo; sessionIdx++) {
        const minDur = Math.max(10, watchDurationMin);
        const maxDur = Math.max(minDur, watchDurationMax);
        const targetDuration = Math.floor(Math.random() * (maxDur - minDur + 1)) + minDur;
        const deviceProfile = resolveDeviceProfile(deviceType, customDevice);

        requests.push({
            url: rawUrl,
            uniqueKey: `${rawUrl}___session_${sessionIdx}___${Date.now()}_${Math.random()}`,
            userData: {
                videoIndex: urlIdx + 1,
                totalVideos: videoUrls.length,
                sessionIndex: sessionIdx,
                totalSessions: viewsPerVideo,
                targetDuration,
                deviceProfile,
            },
        });
    }
}

log.info(`Total viewing sessions queued: ${requests.length}`);

// Set up Puppeteer crawler
const crawler = new PuppeteerCrawler({
    proxyConfiguration,
    maxConcurrency,
    navigationTimeoutSecs: 60,
    requestHandlerTimeoutSecs: Math.max(300, watchDurationMax + 120),

    // Browser per proxy & session isolation configuration
    browserPoolOptions: {
        maxOpenPagesPerBrowser: browserPerProxy ? 1 : 4,
        retireBrowserAfterPageCount: browserPerProxy ? 1 : 20,
    },
    sessionPoolOptions: {
        maxPoolSize: browserPerProxy ? 1 : 20,
        sessionOptions: {
            maxUsageCount: browserPerProxy ? 1 : 10,
        },
    },

    launchContext: {
        launcher: puppeteerExtra,
        useIncognitoPages: true,
        launchOptions: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--autoplay-policy=no-user-gesture-required',
            ],
        },
    },

    preNavigationHooks: [
        async ({ page, request }) => {
            const { deviceProfile } = request.userData;
            if (!deviceProfile) return;

            // Apply device viewport and user-agent
            await page.setUserAgent(deviceProfile.userAgent);
            await page.setViewport(deviceProfile.viewport);

            // Inject advanced fingerprint evasion before scripts execute
            if (enableAdvancedFingerprinting) {
                await injectAdvancedFingerprint(page, deviceProfile);
            }
        },
    ],

    async requestHandler({ page, request }) {
        const { videoIndex, totalVideos, sessionIndex, totalSessions, targetDuration, deviceProfile } = request.userData;
        const currentUrl = request.url;

        log.info(
            `[Video ${videoIndex}/${totalVideos} | Session ${sessionIndex}/${totalSessions}] Device: "${deviceProfile.name}" (${deviceProfile.category.toUpperCase()})`
        );
        log.info(`Navigating to: ${currentUrl}`);

        // Handle Cookie & Consent dialogues
        try {
            await page.waitForNetworkIdle({ idleTime: 1000, timeout: 5000 }).catch(() => {});

            const consentClicked = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button, ytd-button-renderer, .c-button, a'));
                for (const btn of buttons) {
                    const text = (btn.innerText || btn.getAttribute('aria-label') || '').toLowerCase();
                    if (
                        text.includes('accept all') ||
                        text.includes('agree') ||
                        text.includes('i agree') ||
                        text.includes('accept the use of cookies') ||
                        text.includes('before you continue')
                    ) {
                        btn.click();
                        return true;
                    }
                }
                return false;
            });

            if (consentClicked) {
                log.info('Accepted YouTube cookie / consent dialog');
                await new Promise((r) => setTimeout(r, 1500));
            }
        } catch {
            // Ignore consent check errors
        }

        // Wait for video player element (handles desktop and mobile YouTube)
        try {
            await page.waitForSelector('video, #movie_player, .player-container', { timeout: 15000 });
        } catch {
            log.warning(`Could not find video player element for ${currentUrl}. Proceeding anyway.`);
        }

        // Trigger mobile/desktop play button and initialize video settings
        await page.evaluate(
            ({ mute, quality }) => {
                // Click any mobile play overlay if present
                const playOverlay = document.querySelector(
                    '.ytm-custom-control-play, button[aria-label*="Play"], .player-control-play-pause-icon'
                );
                if (playOverlay) {
                    playOverlay.click();
                }

                const player = document.getElementById('movie_player');
                const video = document.querySelector('video');

                if (player) {
                    if (mute && typeof player.mute === 'function') player.mute();
                    if (typeof player.setPlaybackQualityRange === 'function') {
                        player.setPlaybackQualityRange(quality, quality);
                    }
                    if (typeof player.playVideo === 'function') player.playVideo();
                }

                if (video) {
                    if (mute) video.muted = true;
                    if (video.paused) {
                        video.play().catch(() => {});
                    }
                }
            },
            { mute: muteAudio, quality: playbackQuality }
        );

        log.info(`[Session ${sessionIndex}/${totalSessions}] Video playback initiated on ${deviceProfile.name}. Target duration: ${targetDuration}s.`);

        const startTime = Date.now();
        let elapsedSeconds = 0;
        let lastInteractionTime = 0;

        // Monitoring and interaction loop
        while (elapsedSeconds < targetDuration) {
            await new Promise((r) => setTimeout(r, 4000));
            elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

            // Periodically check for skip ad buttons, popups, and verify video is still playing
            try {
                await page.evaluate(() => {
                    // Skip ad if available
                    const skipBtn = document.querySelector(
                        '.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button, .videoAdUiSkipButton, .ytm-ad-skip-button'
                    );
                    if (skipBtn) skipBtn.click();

                    // Close ad overlay banners
                    const closeOverlay = document.querySelector('.ytp-ad-overlay-close-button');
                    if (closeOverlay) closeOverlay.click();

                    // Dismiss "Are you still watching?" popup
                    const confirmBtn = document.querySelector('ytd-button-renderer[dialog-confirm] button');
                    if (confirmBtn) confirmBtn.click();

                    // Ensure video is playing
                    const v = document.querySelector('video');
                    if (v && v.paused) {
                        v.play().catch(() => {});
                    }
                });
            } catch {
                // Ignore transient frame detachments or DOM re-renders during ad/video transitions
            }

            // Perform subtle human-like micro-interactions
            if (enableInteractions && elapsedSeconds - lastInteractionTime >= 15) {
                lastInteractionTime = elapsedSeconds;
                try {
                    const maxX = Math.min(deviceProfile.viewport.width - 20, 450);
                    const maxY = Math.min(deviceProfile.viewport.height - 50, 400);
                    const randomX = Math.floor(Math.random() * maxX) + 10;
                    const randomY = Math.floor(Math.random() * maxY) + 50;

                    if (deviceProfile.viewport.hasTouch) {
                        // Touch tap emulation for mobile/tablet
                        await page.touchscreen.tap(randomX, randomY).catch(() => {});
                    } else {
                        // Mouse movement for desktop
                        await page.mouse.move(randomX, randomY, { steps: 4 }).catch(() => {});
                    }

                    // Occasional smooth scroll down and back up
                    if (Math.random() > 0.65) {
                        await page.evaluate(() => window.scrollBy({ top: 120 + Math.random() * 80, behavior: 'smooth' })).catch(() => {});
                        await new Promise((r) => setTimeout(r, 2000));
                        await page.evaluate(() => window.scrollBy({ top: -120, behavior: 'smooth' })).catch(() => {});
                    }
                } catch {
                    // Ignore transient interaction errors
                }
            }

            const progressPct = Math.min(100, Math.round((elapsedSeconds / targetDuration) * 100));
            log.info(
                `[Session ${sessionIndex}/${totalSessions} | ${deviceProfile.category}] Progress: ${elapsedSeconds}s / ${targetDuration}s (${progressPct}%)`
            );
        }

        // Gather video details for reporting
        let videoInfo = {
            title: 'YouTube Video',
            channel: 'Unknown Channel',
            currentTime: null,
            duration: null,
        };
        try {
            videoInfo = await page.evaluate(() => {
                const titleEl = document.querySelector('h1.ytd-watch-metadata, #container > h1, .ytm-item-title');
                const channelEl = document.querySelector('#owner #channel-name a, ytd-channel-name a, .channel-name');
                const videoEl = document.querySelector('video');
                return {
                    title: titleEl ? titleEl.innerText.trim() : 'YouTube Video',
                    channel: channelEl ? channelEl.innerText.trim() : 'Unknown Channel',
                    currentTime: videoEl ? Math.round(videoEl.currentTime) : null,
                    duration: videoEl ? Math.round(videoEl.duration) : null,
                };
            });
        } catch {
            // Fallback gracefully if frame was detached on completion
        }

        log.info(`[Session ${sessionIndex}/${totalSessions}] Finished view on "${deviceProfile.name}" for: "${videoInfo.title}"`);

        // Save session result to dataset
        await Actor.pushData({
            url: currentUrl,
            title: videoInfo.title,
            channel: videoInfo.channel,
            sessionIndex,
            totalSessions,
            device: deviceProfile.name,
            deviceCategory: deviceProfile.category,
            viewport: `${deviceProfile.viewport.width}x${deviceProfile.viewport.height}`,
            advancedFingerprinting: enableAdvancedFingerprinting,
            browserPerProxy,
            watchedSeconds: elapsedSeconds,
            targetDuration,
            videoCurrentTime: videoInfo.currentTime,
            videoTotalDuration: videoInfo.duration,
            quality: playbackQuality,
            timestamp: new Date().toISOString(),
        });
    },
    async failedRequestHandler({ request }, error) {
        log.error(`Request failed: ${request.url} - ${error.message}`);
        await Actor.pushData({
            url: request.url,
            status: 'FAILED',
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    },
});

await crawler.run(requests);

log.info('All YouTube viewing sessions have finished successfully.');
await Actor.exit();
