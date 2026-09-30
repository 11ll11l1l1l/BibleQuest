import { chromium } from 'playwright';

const BASE = process.env.BQ_V6_DEV_URL || 'http://127.0.0.1:4174';
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error?.message || error)));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    const [
      { createYouTubeIframeAdapter },
      { createMediaProviderRegistry },
      { createMediaSessionManager },
    ] = await Promise.all([
      import('/src/v6/media/youtube-iframe-adapter.ts'),
      import('/src/v6/media/registry.ts'),
      import('/src/v6/media/session.ts'),
    ]);

    document.body.innerHTML = '<main><div id="youtube-pip-host"></div></main>';
    const host = document.getElementById('youtube-pip-host');
    if (!host) throw new Error('PiP browser fixture host missing.');

    const calls = [];
    let iframe = null;

    class BrowserYouTubePlayer {
      constructor(target, options = {}) {
        const resolved = typeof target === 'string' ? document.getElementById(target) : target;
        if (!resolved) throw new Error('Fake YouTube target was not resolved.');

        iframe = document.createElement('iframe');
        iframe.title = 'YouTube PiP policy browser fixture';
        iframe.allow = 'autoplay; encrypted-media; fullscreen';
        iframe.src = 'about:blank';
        resolved.replaceChildren(iframe);
        this.events = options.events || {};
        queueMicrotask(() => this.events.onReady?.({ target: this }));
      }
      getIframe() { return iframe; }
      cueVideoById(input) { calls.push('cue:' + input.videoId); }
      loadVideoById(input) { calls.push('load:' + input.videoId); }
      playVideo() { calls.push('play'); }
      pauseVideo() { calls.push('pause'); }
      stopVideo() { calls.push('stop'); }
      seekTo(seconds) { calls.push('seek:' + seconds); }
      getCurrentTime() { return 0; }
      destroy() {
        calls.push('destroy');
        iframe?.remove();
      }
    }

    const adapter = createYouTubeIframeAdapter({
      api: { Player: BrowserYouTubePlayer },
      resolveElement: () => host,
    });
    const providers = createMediaProviderRegistry([adapter]);
    const session = createMediaSessionManager({ providers });

    await session.register('pip-browser', 'recordings');
    await session.setQueue('pip-browser', [{
      source: {
        id: 'recording-browser-pip',
        provider: 'youtube',
        externalId: 'abcdefghijk',
        title: 'Browser PiP fixture',
        durationSeconds: 120,
      },
      resumeSeconds: 0,
    }]);

    const allow = iframe?.allow || '';
    const pipTokens = allow.split(';').map(value => value.trim()).filter(value => value === 'picture-in-picture');
    const supportsIframeAllow = 'allow' in HTMLIFrameElement.prototype;
    const browserPipApi = Boolean(
      document.pictureInPictureEnabled
      && typeof HTMLVideoElement.prototype.requestPictureInPicture === 'function',
    );

    let programmaticError = '';
    try {
      await session.requestPictureInPicture('pip-browser');
    } catch (error) {
      programmaticError = error instanceof Error ? error.message : String(error);
    }

    await session.unregister('pip-browser');

    return {
      allow,
      pipTokenCount: pipTokens.length,
      supportsIframeAllow,
      browserPipApi,
      adapterCapability: adapter.capabilities.pictureInPicture,
      programmaticError,
      calls,
      iframeConnectedAfterUnload: Boolean(iframe?.isConnected),
    };
  });

  assert(result.supportsIframeAllow, 'Chromium must expose the iframe allow policy used for provider PiP permission.');
  assert(result.pipTokenCount === 1, 'YouTube iframe must receive exactly one picture-in-picture permission token.');
  assert(/autoplay/.test(result.allow), 'PiP permission must preserve existing YouTube iframe autoplay policy.');
  assert(/fullscreen/.test(result.allow), 'PiP permission must preserve existing YouTube iframe fullscreen policy.');
  assert(result.adapterCapability === false, 'YouTube adapter must not claim a programmatic PiP API it does not have.');
  assert(
    /does not support picture-in-picture/i.test(result.programmaticError),
    'Unavailable programmatic YouTube PiP must degrade through the explicit provider-capability error.',
  );
  assert(result.calls.includes('cue:abcdefghijk'), 'Browser fixture did not reach a ready YouTube provider load.');
  assert(result.calls.includes('destroy'), 'PiP browser fixture did not release the provider iframe.');
  assert(result.iframeConnectedAfterUnload === false, 'YouTube iframe leaked after PiP capability teardown.');
  assert(errors.length === 0, 'Unexpected PiP browser console/page errors: ' + errors.join(' | '));

  console.log(JSON.stringify({
    pass: true,
    browserPictureInPictureApi: result.browserPipApi,
    providerPermission: 'picture-in-picture',
    programmaticProviderCapability: false,
    fallback: 'explicit unsupported-provider rejection',
  }));
  console.log('PASS V6 media Picture-in-Picture browser acceptance.');
  await context.close();
} finally {
  await browser.close();
}
