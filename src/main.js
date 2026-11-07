import { Actor, log } from 'apify';
import { PuppeteerCrawler } from 'crawlee';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Initialize the stealth plugin to avoid anti-bot detection
puppeteerExtra.use(StealthPlugin());

await Actor.init();

// Fetch input parameters
const input = (await Actor.getInput()) || {};
const {
    videoUrls = [],
    viewsPerVideo = 1,
    watchDurationMin = 45,
    watchDurationMax = 90,
    playbackQuality = 'tiny',
    muteAudio = true,
    enableInteractions = true,
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
    watchDurationMin,
    watchDurationMax,
    playbackQuality,
    muteAudio,
    enableInteractions,
    maxConcurrency,
});

// Configure proxy if specified
let proxyConfiguration;
if (rawProxyConfig) {
    proxyConfiguration = await Actor.createProxyConfiguration(rawProxyConfig);
}

// Build request list with desired sessions
const requests = [];
for (let urlIdx = 0; urlIdx < videoUrls.length; urlIdx++) {
    const rawUrl = videoUrls[urlIdx].trim();
    if (!rawUrl) continue;

    for (let sessionIdx = 1; sessionIdx <= viewsPerVideo; sessionIdx++) {
        const minDur = Math.max(10, watchDurationMin);
        const maxDur = Math.max(minDur, watchDurationMax);
        const targetDuration = Math.floor(Math.random() * (maxDur - minDur + 1)) + minDur;

        requests.push({
            url: rawUrl,
            uniqueKey: `${rawUrl}___session_${sessionIdx}___${Date.now()}_${Math.random()}`,
            userData: {
                videoIndex: urlIdx + 1,
                totalVideos: videoUrls.length,
                sessionIndex: sessionIdx,
                totalSessions: viewsPerVideo,
                targetDuration,
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
    launchContext: {
        launcher: puppeteerExtra,
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
                '--window-size=1280,800',
            ],
        },
    },
    async requestHandler({ page, request }) {
        const { videoIndex, totalVideos, sessionIndex, totalSessions, targetDuration } = request.userData;
        const currentUrl = request.url;

        log.info(`[Video ${videoIndex}/${totalVideos} | Session ${sessionIndex}/${totalSessions}] Navigating to: ${currentUrl}`);

        // Set realistic viewport
        await page.setViewport({
            width: 1280 + Math.floor(Math.random() * 80),
            height: 720 + Math.floor(Math.random() * 80),
            deviceScaleFactor: 1,
        });

        // Handle Cookie & Consent dialogues
        try {
            await page.waitForNetworkIdle({ idleTime: 1000, timeout: 5000 }).catch(() => {});

            const consentClicked = await page.evaluate(() => {
                // Look for common YouTube / Google consent buttons
                const buttons = Array.from(document.querySelectorAll('button, ytd-button-renderer'));
                for (const btn of buttons) {
                    const text = (btn.innerText || btn.getAttribute('aria-label') || '').toLowerCase();
                    if (
                        text.includes('accept all') ||
                        text.includes('agree') ||
                        text.includes('i agree') ||
                        text.includes('accept the use of cookies')
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

        // Wait for video player element
        try {
            await page.waitForSelector('video, #movie_player', { timeout: 15000 });
        } catch {
            log.warning(`Could not find video player element for ${currentUrl}. Proceeding anyway.`);
        }

        // Apply quality, mute, and start playback
        await page.evaluate(
            ({ mute, quality }) => {
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

        log.info(`[Session ${sessionIndex}/${totalSessions}] Video playback initiated. Watching for ${targetDuration} seconds.`);

        const startTime = Date.now();
        let elapsedSeconds = 0;
        let lastInteractionTime = 0;

        // Monitoring and interaction loop
        while (elapsedSeconds < targetDuration) {
            await new Promise((r) => setTimeout(r, 4000));
            elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

            // Periodically check for skip ad buttons and verify video is still playing
            await page.evaluate(() => {
                // Skip ad if available
                const skipBtn = document.querySelector(
                    '.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button, .videoAdUiSkipButton'
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

            // Perform subtle human-like micro-interactions
            if (enableInteractions && elapsedSeconds - lastInteractionTime >= 15) {
                lastInteractionTime = elapsedSeconds;
                try {
                    const randomX = 100 + Math.floor(Math.random() * 500);
                    const randomY = 150 + Math.floor(Math.random() * 300);
                    await page.mouse.move(randomX, randomY, { steps: 5 });

                    // Occasional slight scroll down and back up
                    if (Math.random() > 0.6) {
                        await page.evaluate(() => window.scrollBy({ top: 150 + Math.random() * 100, behavior: 'smooth' }));
                        await new Promise((r) => setTimeout(r, 2000));
                        await page.evaluate(() => window.scrollBy({ top: -150, behavior: 'smooth' }));
                    }
                } catch {
                    // Ignore transient interaction errors
                }
            }

            const progressPct = Math.min(100, Math.round((elapsedSeconds / targetDuration) * 100));
            log.info(`[Video ${videoIndex}/${totalVideos} | Session ${sessionIndex}/${totalSessions}] Progress: ${elapsedSeconds}s / ${targetDuration}s (${progressPct}%)`);
        }

        // Gather video details for reporting
        const videoInfo = await page.evaluate(() => {
            const titleEl = document.querySelector('h1.ytd-watch-metadata, #container > h1');
            const channelEl = document.querySelector('#owner #channel-name a, ytd-channel-name a');
            const videoEl = document.querySelector('video');
            return {
                title: titleEl ? titleEl.innerText.trim() : 'Unknown Title',
                channel: channelEl ? channelEl.innerText.trim() : 'Unknown Channel',
                currentTime: videoEl ? Math.round(videoEl.currentTime) : null,
                duration: videoEl ? Math.round(videoEl.duration) : null,
            };
        });

        log.info(`[Session ${sessionIndex}/${totalSessions}] Completed view for: "${videoInfo.title}" (${videoInfo.currentTime}s played)`);

        // Save session result to dataset
        await Actor.pushData({
            url: currentUrl,
            title: videoInfo.title,
            channel: videoInfo.channel,
            sessionIndex,
            totalSessions,
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
