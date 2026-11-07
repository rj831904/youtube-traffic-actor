/**
 * Comprehensive device profiles with realistic viewports, device scale factors,
 * touch flags, and modern user agents for realistic multi-device traffic emulation.
 */

export const DEVICE_PROFILES = {
    // Desktop Profiles
    windows_chrome: {
        name: 'Windows 11 / Chrome 128',
        category: 'desktop',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        viewport: {
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            isLandscape: true,
        },
    },
    windows_edge: {
        name: 'Windows 11 / Edge 128',
        category: 'desktop',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0',
        viewport: {
            width: 1536,
            height: 864,
            deviceScaleFactor: 1.25,
            isMobile: false,
            hasTouch: false,
            isLandscape: true,
        },
    },
    mac_safari: {
        name: 'macOS Sonoma / Safari 17.5',
        category: 'desktop',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
        viewport: {
            width: 1440,
            height: 900,
            deviceScaleFactor: 2,
            isMobile: false,
            hasTouch: false,
            isLandscape: true,
        },
    },
    mac_chrome: {
        name: 'macOS Sonoma / Chrome 128',
        category: 'desktop',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        viewport: {
            width: 1680,
            height: 1050,
            deviceScaleFactor: 2,
            isMobile: false,
            hasTouch: false,
            isLandscape: true,
        },
    },
    linux_chrome: {
        name: 'Ubuntu Linux / Chrome 128',
        category: 'desktop',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        viewport: {
            width: 1366,
            height: 768,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            isLandscape: true,
        },
    },

    // Mobile Phone Profiles
    iphone_15_pro: {
        name: 'Apple iPhone 15 Pro',
        category: 'mobile',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        viewport: {
            width: 393,
            height: 852,
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
            isLandscape: false,
        },
    },
    iphone_14: {
        name: 'Apple iPhone 14',
        category: 'mobile',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        viewport: {
            width: 390,
            height: 844,
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
            isLandscape: false,
        },
    },
    pixel_8_pro: {
        name: 'Google Pixel 8 Pro',
        category: 'mobile',
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Mobile Safari/537.36',
        viewport: {
            width: 412,
            height: 915,
            deviceScaleFactor: 2.625,
            isMobile: true,
            hasTouch: true,
            isLandscape: false,
        },
    },
    samsung_s24: {
        name: 'Samsung Galaxy S24 Ultra',
        category: 'mobile',
        userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Mobile Safari/537.36',
        viewport: {
            width: 384,
            height: 824,
            deviceScaleFactor: 3.75,
            isMobile: true,
            hasTouch: true,
            isLandscape: false,
        },
    },

    // Tablet Profiles
    ipad_pro_12: {
        name: 'Apple iPad Pro 12.9',
        category: 'tablet',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        viewport: {
            width: 1024,
            height: 1366,
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
            isLandscape: false,
        },
    },
    samsung_tab_s9: {
        name: 'Samsung Galaxy Tab S9',
        category: 'tablet',
        userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Safari/537.36',
        viewport: {
            width: 800,
            height: 1280,
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
            isLandscape: false,
        },
    },
};

/**
 * Returns a device profile based on user configuration.
 *
 * @param {string} deviceType - 'RANDOM' | 'DESKTOP_ONLY' | 'MOBILE_ONLY' | 'TABLET_ONLY' | 'CUSTOM'
 * @param {string} [customDeviceKey] - Key from DEVICE_PROFILES when deviceType is 'CUSTOM'
 * @returns {object} Device profile
 */
export function resolveDeviceProfile(deviceType = 'RANDOM', customDeviceKey = 'windows_chrome') {
    const allKeys = Object.keys(DEVICE_PROFILES);

    if (deviceType === 'CUSTOM' && DEVICE_PROFILES[customDeviceKey]) {
        return DEVICE_PROFILES[customDeviceKey];
    }

    if (deviceType === 'DESKTOP_ONLY') {
        const desktopKeys = allKeys.filter((k) => DEVICE_PROFILES[k].category === 'desktop');
        const key = desktopKeys[Math.floor(Math.random() * desktopKeys.length)];
        return DEVICE_PROFILES[key];
    }

    if (deviceType === 'MOBILE_ONLY') {
        const mobileKeys = allKeys.filter((k) => DEVICE_PROFILES[k].category === 'mobile');
        const key = mobileKeys[Math.floor(Math.random() * mobileKeys.length)];
        return DEVICE_PROFILES[key];
    }

    if (deviceType === 'TABLET_ONLY') {
        const tabletKeys = allKeys.filter((k) => DEVICE_PROFILES[k].category === 'tablet');
        const key = tabletKeys[Math.floor(Math.random() * tabletKeys.length)];
        return DEVICE_PROFILES[key];
    }

    // Default 'RANDOM' - Realistic internet traffic distribution:
    // ~50% Mobile, ~40% Desktop, ~10% Tablet
    const roll = Math.random();
    let category = 'mobile';
    if (roll < 0.5) {
        category = 'mobile';
    } else if (roll < 0.9) {
        category = 'desktop';
    } else {
        category = 'tablet';
    }

    const filtered = allKeys.filter((k) => DEVICE_PROFILES[k].category === category);
    const selectedKey = filtered[Math.floor(Math.random() * filtered.length)] || allKeys[0];
    return DEVICE_PROFILES[selectedKey];
}
