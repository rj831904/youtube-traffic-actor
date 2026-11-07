/**
 * Advanced browser fingerprint randomization and evasion.
 * Injects noise and realistic hardware properties into Canvas, WebGL, AudioContext,
 * and Navigator APIs matching the active device profile.
 */

export function getDeviceGpuSpecs(deviceCategory, isMacOrIos) {
    if (isMacOrIos) {
        return {
            vendor: 'Apple Inc.',
            renderer: 'Apple M2 Pro (or Apple GPU)',
        };
    }
    if (deviceCategory === 'mobile') {
        return {
            vendor: 'Qualcomm',
            renderer: 'Adreno (TM) 750',
        };
    }
    // Desktop Windows / Linux
    const gpus = [
        { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)' },
        { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)' },
        { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)' },
        { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)' },
    ];
    return gpus[Math.floor(Math.random() * gpus.length)];
}

/**
 * Injects evasive fingerprint overrides into the browser page.
 *
 * @param {import('puppeteer').Page} page
 * @param {object} deviceProfile
 */
export async function injectAdvancedFingerprint(page, deviceProfile) {
    const isMacOrIos =
        deviceProfile.name.toLowerCase().includes('apple') ||
        deviceProfile.name.toLowerCase().includes('iphone') ||
        deviceProfile.name.toLowerCase().includes('ipad') ||
        deviceProfile.name.toLowerCase().includes('mac');

    const gpuSpecs = getDeviceGpuSpecs(deviceProfile.category, isMacOrIos);
    const hardwareConcurrency = isMacOrIos ? 8 : [4, 8, 12, 16][Math.floor(Math.random() * 4)];
    const deviceMemory = [4, 8, 16][Math.floor(Math.random() * 3)];

    await page.evaluateOnNewDocument(
        ({ gpuSpecs, hardwareConcurrency, deviceMemory }) => {
            // 1. Remove webdriver flag
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });

            // 2. Hardware specs
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                get: () => hardwareConcurrency,
            });
            Object.defineProperty(navigator, 'deviceMemory', {
                get: () => deviceMemory,
            });

            // 3. WebGL Vendor & Renderer spoofing
            const getParameterProxyHandler = {
                apply(target, thisArg, args) {
                    const param = args[0];
                    // UNMASKED_VENDOR_WEBGL = 0x9245 (37445)
                    if (param === 37445) {
                        return gpuSpecs.vendor;
                    }
                    // UNMASKED_RENDERER_WEBGL = 0x9246 (37446)
                    if (param === 37446) {
                        return gpuSpecs.renderer;
                    }
                    return Reflect.apply(target, thisArg, args);
                },
            };

            const webglProto = WebGLRenderingContext.prototype;
            webglProto.getParameter = new Proxy(webglProto.getParameter, getParameterProxyHandler);

            if (typeof WebGL2RenderingContext !== 'undefined') {
                const webgl2Proto = WebGL2RenderingContext.prototype;
                webgl2Proto.getParameter = new Proxy(webgl2Proto.getParameter, getParameterProxyHandler);
            }

            // 4. Canvas Fingerprint Noise Injection (imperceptible 1-bit shift)
            const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
            HTMLCanvasElement.prototype.toDataURL = function (type, ...args) {
                const ctx = this.getContext('2d');
                if (ctx && this.width > 0 && this.height > 0) {
                    try {
                        const imgData = ctx.getImageData(0, 0, 1, 1);
                        imgData.data[0] = (imgData.data[0] + 1) % 256;
                        ctx.putImageData(imgData, 0, 0);
                    } catch {
                        // Ignore cross-origin context taint
                    }
                }
                return origToDataURL.apply(this, [type, ...args]);
            };

            // 5. AudioContext Fingerprint Micro-Variance
            if (typeof AudioContext !== 'undefined') {
                const origGetChannelData = AudioBuffer.prototype.getChannelData;
                AudioBuffer.prototype.getChannelData = function (channel) {
                    const data = origGetChannelData.call(this, channel);
                    for (let i = 0; i < data.length; i += 200) {
                        data[i] += (Math.random() - 0.5) * 0.0000001;
                    }
                    return data;
                };
            }

            // 6. Chrome Runtime Mock
            if (!window.chrome) {
                window.chrome = {
                    app: { isInstalled: false },
                    runtime: {},
                    loadTimes: () => {},
                    csi: () => {},
                };
            }
        },
        { gpuSpecs, hardwareConcurrency, deviceMemory }
    );
}
