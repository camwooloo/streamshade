import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { DEFAULTS } from '../extension/shared.js';

const extensionPath = path.resolve('dist/streamshade');
await mkdir('artifacts', { recursive: true });
const context = await chromium.launchPersistentContext(path.resolve('.test-profile'), {
  ...(process.env.STREAMSHADE_BROWSER ? { executablePath: process.env.STREAMSHADE_BROWSER } : { channel: 'chromium' }), headless: true, viewport: { width: 1440, height: 1100 },
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
});
const results = [];
const errors = [];
try {
  let worker = context.serviceWorkers().find(item => item.url().startsWith('chrome-extension://') && item.url().endsWith('/background.js'));
  if (!worker) worker = await context.waitForEvent('serviceworker', { predicate: item => item.url().startsWith('chrome-extension://') && item.url().endsWith('/background.js'), timeout: 15000 });
  const id = new URL(worker.url()).host;
  for (let i = 0; i < 30 && !await worker.evaluate(() => Boolean(globalThis.chrome?.storage?.local)); i++) await new Promise(resolve => setTimeout(resolve, 100));
  for (let i = 0; i < 30 && !await worker.evaluate(async () => Boolean((await chrome.storage.local.get('stats')).stats)); i++) await new Promise(resolve => setTimeout(resolve, 100));
  await worker.evaluate(async () => chrome.storage.local.set({ settings: { enabled: true, mode: 'adaptive', autoClaim: false, showIndicator: true, muteFallback: true }, stats: { breaks: 0, claims: 0 } }));
  const options = await context.newPage();
  options.on('pageerror', error => errors.push(error.message));
  await options.goto(`chrome-extension://${id}/ui/options.html`);
  await options.locator('#mode-adaptive').waitFor();
  assert.ok(await options.locator('#mode-adaptive').isChecked());
  await options.evaluate(() => document.fonts.ready);
  await options.screenshot({ path: 'artifacts/settings-desktop.png', fullPage: true, animations: 'disabled' });
  await options.screenshot({ path: 'artifacts/settings-overview.png', animations: 'disabled' });
  assert.ok(await options.locator('.topbar .github-link .lucide-github').isVisible());
  assert.equal(await options.locator('.topbar .github-link').getAttribute('href'), 'https://github.com/camwooloo/streamshade');
  await options.setViewportSize({width:1440,height:700});
  for (const section of ['extras', 'chat', 'sidebar', 'browsing', 'about', 'chat', 'protection']) {
    await options.evaluate(id => window.scrollTo(0, document.getElementById(id).getBoundingClientRect().top + scrollY - 32), section);
    await options.waitForFunction(id => document.querySelector('.nav-link[aria-current="location"]')?.hash === '#' + id, section);
    assert.equal(await options.locator('.nav-link.active').count(), 1);
    assert.ok(await options.evaluate(() => document.querySelector('.sidebar-bottom').getBoundingClientRect().top >= document.querySelector('.sidebar nav').getBoundingClientRect().bottom + 20), 'Sidebar navigation must not overlap its supporting text');
  }
  await options.locator('.nav-link[href="#sidebar"]').click();
  await options.waitForFunction(() => document.querySelector('.nav-link.active').hash === '#sidebar');
  await options.screenshot({path:'artifacts/settings-scrolled.png', animations:'disabled'});
  await options.setViewportSize({width:1000,height:600});
  assert.ok(await options.evaluate(() => document.querySelector('.sidebar-content').getBoundingClientRect().height <= innerHeight - 48));
  await options.setViewportSize({width:1440,height:1100});
  await options.evaluate(()=>scrollTo(0,0));
  await options.waitForFunction(() => document.querySelector('.nav-link.active').hash === '#protection');
  results.push('Settings navigation tracks manual scrolling in both directions and clicks; sticky sidebar content never overlaps, including at short viewport heights.');
  await options.locator('#autoClaim').check();
  await options.waitForFunction(() => document.querySelector('#toast').textContent.startsWith('Saved'));
  assert.equal((await worker.evaluate(async () => (await chrome.storage.local.get('settings')).settings)).autoClaim, true);
  results.push('Real unpacked MV3 extension loads; settings persist through Chrome storage.');
  await options.setViewportSize({ width: 390, height: 844 });
  await options.screenshot({ path: 'artifacts/settings-mobile.png', fullPage: true, animations: 'disabled' });
  assert.equal(await options.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

  const popup = await context.newPage();
  popup.on('pageerror', error => errors.push(error.message));
  await popup.setViewportSize({ width: 400, height: 640 });
  await popup.goto(`chrome-extension://${id}/ui/popup.html`);
  await popup.locator('#autoClaim').waitFor();
  assert.ok(await popup.locator('#autoClaim').isChecked());
  await popup.evaluate(() => document.fonts.ready);
  await popup.screenshot({ path: 'artifacts/popup.png', fullPage: true, animations: 'disabled' });
  assert.ok(await popup.locator('.topbar .github-link .lucide-github').isVisible());
  assert.ok(await popup.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.ok(await popup.evaluate(() => document.body.scrollHeight <= 600), 'Popup must fit Chrome’s 600px maximum height');
  results.push('Popup shares settings; desktop and narrow layouts render without horizontal overflow.');

  const welcome = await context.newPage();
  welcome.on('pageerror', error => errors.push(error.message));
  await welcome.setViewportSize({ width: 1280, height: 800 });
  await welcome.goto(`chrome-extension://${id}/ui/welcome.html`);
  await welcome.locator('#setup-next:not([disabled])').waitFor();
  await welcome.evaluate(() => document.fonts.ready);
  await welcome.screenshot({ path: 'artifacts/onboarding-welcome.png', animations: 'disabled' });
  assert.ok(await welcome.locator('.topbar .github-link .lucide-github').isVisible());
  const exposed = await welcome.locator('[data-choice]').evaluateAll(inputs => inputs.map(input => input.dataset.choice));
  assert.deepEqual([...exposed, 'mode'].sort(), Object.keys(DEFAULTS).sort(), 'Onboarding must include every preference');
  await welcome.locator('#setup-next').click(); // Playback
  await welcome.locator('input[name="mode"][value="swap"]').check();
  await welcome.locator('#setup-next').click(); // Extras
  await welcome.locator('#autoClaim').uncheck();
  await welcome.locator('#showIndicator').uncheck();
  await welcome.locator('#setup-next').click(); // Chat
  await welcome.locator('#chatOnLeft').check();
  await welcome.locator('#deletedStyle').selectOption('strikethrough');
  await welcome.screenshot({path:'artifacts/onboarding-chat.png',fullPage:true,animations:'disabled'});
  await welcome.locator('#setup-next').click(); // Sidebar
  await welcome.locator('#sidebarHover').check();
  await welcome.locator('#hideStories').uncheck();
  await welcome.locator('#setup-next').click(); // Browsing
  await welcome.locator('#showUptime').check();
  await welcome.locator('#hideTurbo').check();
  await welcome.locator('#hidePrime').check();
  await welcome.screenshot({path:'artifacts/onboarding-preferences.png',fullPage:true,animations:'disabled'});
  await welcome.setViewportSize({ width: 390, height: 844 });
  for (let i=0;i<6;i++) {
    assert.equal(await welcome.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await welcome.locator('#setup-back').click();
    if (i===4) break; // Welcome
  }
  for (let i=0;i<6;i++) await welcome.locator('#setup-next').click(); // Review
  await welcome.screenshot({path:'artifacts/onboarding-review-mobile.png',fullPage:true,animations:'disabled'});
  assert.equal(await welcome.locator('#setup-review dt').count(), Object.keys(DEFAULTS).length);
  assert.ok((await welcome.locator('#setup-review').innerText()).includes('Strikethrough'));
  assert.equal(await worker.evaluate(async () => (await chrome.storage.local.get('settings')).settings.mode), 'adaptive', 'Draft must not save before Finish');
  await welcome.locator('#setup-back').click();
  assert.ok(await welcome.locator('#hidePrime').isChecked());
  await welcome.locator('#setup-next').click();
  await welcome.locator('#setup-next').click();
  await welcome.locator('#setup-done').waitFor();
  const completed = await worker.evaluate(async () => chrome.storage.local.get(['settings', 'onboarding']));
  assert.ok(completed.onboarding.completedAt); assert.equal(completed.onboarding.version, 2);
  for (const [key,value] of Object.entries({mode:'swap',autoClaim:false,showIndicator:false,chatOnLeft:true,deletedStyle:'strikethrough',sidebarHover:true,hideStories:false,showUptime:true,hideTurbo:true,hidePrime:true})) assert.equal(completed.settings[key], value, key);
  await welcome.close();
  await worker.evaluate(async defaults => chrome.storage.local.set({settings:{...defaults,autoClaim:true}}), DEFAULTS);
  results.push('Seven-step onboarding exposes every preference, preserves drafts across Back, reviews and saves every section, and fits narrow screens.');

  const master = '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=6000000,RESOLUTION=1920x1080,FRAME-RATE=60,CODECS="avc1.64002A,mp4a.40.2"\nhttps://video-edge.ttvnw.net/1080.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=700000,RESOLUTION=640x360,FRAME-RATE=30,CODECS="avc1.64001f,mp4a.40.2"\nhttps://video-edge.ttvnw.net/360.m3u8';
  const ad = '#EXTM3U\n#EXT-X-DATERANGE:ID="stitched-ad",X-TV-TWITCH-AD-POD-POSITION="MIDROLL"\n#EXTINF:2.0,ad\nhttps://video-edge.ttvnw.net/ad.ts';
  const clean = '#EXTM3U\n#EXTINF:2.0,live\nhttps://video-edge.ttvnw.net/live.ts';
  let isAd = true;
  let tokenTypes = [];
  let playlistCounts = new Map();
  await context.route('https://gql.twitch.tv/gql', async route => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
    const body = route.request().postDataJSON();
    if (Array.isArray(body)) return route.fulfill({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body.map(() => ({ data: { user: { stream: { createdAt: new Date(Date.now() - 3661000).toISOString() } } } }))) });
    tokenTypes.push(body.variables.playerType);
    await route.fulfill({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ data: { streamPlaybackAccessToken: { signature: 'fixture', value: 'fixture' } } }) });
  });
  await context.route('https://usher.ttvnw.net/**', route => route.fulfill({ contentType: 'application/vnd.apple.mpegurl', headers: { 'Access-Control-Allow-Origin': '*' }, body: master }));
  await context.route('https://video-edge.ttvnw.net/**', route => {
    const url = route.request().url();
    const n = (playlistCounts.get(url) || 0) + 1;
    playlistCounts.set(url, n);
    // The first 1080 request is Twitch's primary stream. A repeated request is
    // the clean fallback; the 360 fixture is always clean.
    return route.fulfill({ contentType: 'application/vnd.apple.mpegurl', headers: { 'Access-Control-Allow-Origin': '*' }, body: isAd && url.endsWith('/1080.m3u8') && n === 1 ? ad : clean });
  });
  await context.route('https://www.twitch.tv/streamshade_fixture', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body><div class="video-player" style="position:relative;width:800px;height:450px"><video></video></div><div data-test-selector="community-points-summary"><button id="bonus"><span data-test-selector="claimable-bonus__icon">Claim bonus</span></button></div><button id="reward">Spend points</button></body></html>' }));
  const twitch = await context.newPage();
  twitch.on('pageerror', error => errors.push(error.message));
  await twitch.goto('https://www.twitch.tv/streamshade_fixture');
  await twitch.evaluate(() => {
    window.rewardClicks = 0;
    document.querySelector('#reward').addEventListener('click', () => window.rewardClicks++);
    document.querySelector('#bonus').addEventListener('click', event => event.currentTarget.remove());
  });
  await twitch.waitForFunction(() => window.StreamshadeEnabled === true);
  assert.equal(await twitch.evaluate(() => window.StreamshadeMode), 'adaptive');
  await twitch.waitForFunction(() => !document.querySelector('#bonus'));
  await new Promise(resolve => setTimeout(resolve, 1200));
  assert.equal((await worker.evaluate(async () => (await chrome.storage.local.get('stats')).stats)).claims, 1);
  assert.equal(await twitch.evaluate(() => window.rewardClicks), 0);
  results.push('Bonus claiming clicks the bonus once, records removal, and never clicks a reward.');

  async function runPlayer() {
    return twitch.evaluate(() => new Promise((resolve, reject) => {
      const blob = new Blob([`self.addEventListener('message', async event => {
        if (event.data !== 'play') return;
        try {
          await fetch('https://usher.ttvnw.net/api/channel/hls/tester.m3u8?original=1');
          const response = await fetch('https://video-edge.ttvnw.net/1080.m3u8');
          self.postMessage({fixture: true, text: await response.text()});
        } catch (error) { self.postMessage({fixture: true, error: error.message}); }
      });`], { type: 'text/javascript' });
      const original = URL.createObjectURL(blob);
      const player = new Worker(original);
      const timeout = setTimeout(() => { player.terminate(); reject(new Error('Worker fixture timed out')); }, 25000);
      player.addEventListener('message', event => {
        if (!event.data?.fixture) return;
        clearTimeout(timeout); player.terminate(); URL.revokeObjectURL(original);
        event.data.error ? reject(new Error(event.data.error)) : resolve(event.data.text);
      });
      player.addEventListener('error', error => { clearTimeout(timeout); reject(new Error(error.message)); });
      player.postMessage('play');
    }));
  }
  assert.equal(await runPlayer(), clean);
  assert.equal(tokenTypes[0], 'embed', `Observed token attempts: ${JSON.stringify(tokenTypes)}`);
  results.push('Actual MAIN-world hook wraps a classic blob Worker; an ad fixture becomes clean HLS through mocked Twitch token/CDN requests.');

  await worker.evaluate(async () => { const { settings } = await chrome.storage.local.get('settings'); await chrome.storage.local.set({ settings: { ...settings, mode: 'mute' } }); });
  await twitch.waitForFunction(() => window.StreamshadeMode === 'mute');
  playlistCounts.clear(); tokenTypes = [];
  assert.equal(await runPlayer(), ad);
  assert.equal(tokenTypes.length, 0);
  await twitch.waitForFunction(() => document.querySelector('video').muted);
  isAd = false; playlistCounts.clear();
  assert.equal(await runPlayer(), clean);
  await twitch.waitForFunction(() => !document.querySelector('video').muted);
  results.push('Mute mode preserves ad playback, skips backup tokens, and restores audio when the break ends.');

  // Appearance fixtures use representative Twitch targets, without relying on
  // live accounts or modifying a real channel's chat.
  await twitch.evaluate(() => {
    const host = document.createElement('div'); host.id = 'appearance-fixture';
    host.innerHTML = `<nav class="top-nav"><button data-a-target="top-nav-get-bits-button">Get Bits</button><div class="top-nav__prime">Prime crown</div><a href="/turbo">Try Turbo 1 month</a><button id="turbo-trial"><span>Try 1-Month Ad-Free</span></button><button id="inbox">Inbox</button></nav><p id="chat-turbo-mention">Try 1-Month Ad-Free</p>
    <div class="side-nav side-nav--collapsed" style="width:50px;height:150px"><button data-a-target="side-nav-expand-button">Expand</button><div class="side-nav-section" id="followed"><h3>Followed Channels</h3></div><div class="side-nav-section" id="suggested"><h3>Suggested Channels</h3></div><div class="side-nav-section" id="viewers"><h3>Viewers Also Watch</h3></div><div class="side-nav-section" id="categories"><h3>Recommended Categories</h3></div><div data-a-target="stories-section" id="stories">Stories</div></div>
    <div class="chat-scrollable-area"><div class="chat-scrollable-area__message-container"><div class="chat-line__message" data-id="msg-one"><span class="text-fragment">Before moderation</span></div><div class="chat-line__message"><span class="text-fragment">Second message</span></div></div></div>
    <a href="/tester" data-a-target="preview-card-image-link" style="display:block;position:relative;width:250px;height:140px">Stream card</a>
    <div class="channel-root__right-column" style="position:fixed;right:0;width:340px;height:200px">Chat</div><div class="channel-root__main">Player column</div><div class="twilight-main"></div>`;
    document.body.append(host);
    host.querySelector('.side-nav').addEventListener('click', event => {
      const button = event.target.closest('button'); if (!button) return;
      const nav = host.querySelector('.side-nav');
      const collapsed = nav.classList.toggle('side-nav--collapsed');
      nav.classList.toggle('side-nav--expanded', !collapsed);
      button.dataset.aTarget = collapsed ? 'side-nav-expand-button' : 'side-nav-collapse-button';
      nav.style.width = collapsed ? '50px' : '240px';
    });
  });
  await worker.evaluate(async () => { const { settings } = await chrome.storage.local.get('settings'); await chrome.storage.local.set({ settings: { ...settings, hideBits: true, hidePrime: true, hideTurbo: true, sidebarHover: true, showUptime: true, chatOnLeft: true, deletedStyle: 'dimmed' } }); });
  await twitch.waitForFunction(() => document.documentElement.classList.contains('ss-hideBits'));
  for (const selector of ['[data-a-target="top-nav-get-bits-button"]', '.top-nav__prime', '.top-nav a', '#suggested', '#viewers', '#categories', '#stories']) assert.ok(await twitch.locator(selector).isHidden(), `${selector} should be hidden`);
  assert.ok(await twitch.locator('#followed').isVisible());
  await twitch.waitForFunction(() => getComputedStyle(document.querySelector('#turbo-trial')).display === 'none');
  assert.ok(await twitch.locator('#inbox').isVisible()); assert.ok(await twitch.locator('#chat-turbo-mention').isVisible());
  await twitch.evaluate(() => { const button=document.createElement('button'); button.id='turbo-trial-dynamic'; button.setAttribute('aria-label','Turbo'); button.textContent='Try 1-Month Ad-Free'; document.querySelector('.top-nav').append(button); });
  await twitch.waitForFunction(() => getComputedStyle(document.querySelector('#turbo-trial-dynamic')).display === 'none');
  results.push('Screenshot-style and dynamically added Turbo trial buttons hide without hiding inbox controls or chat text.');
  await twitch.locator('.side-nav').dispatchEvent('pointerenter');
  await twitch.waitForFunction(() => document.querySelector('.side-nav').classList.contains('side-nav--expanded'));
  await twitch.locator('.side-nav').dispatchEvent('pointerleave');
  await twitch.waitForFunction(() => document.querySelector('.side-nav').classList.contains('side-nav--collapsed'));
  assert.equal(await twitch.locator('.channel-root__right-column').evaluate(node => getComputedStyle(node).left), '0px');
  await twitch.waitForFunction(() => document.querySelector('.ss-uptime')?.textContent.startsWith('LIVE 1:01:'), { timeout: 15000 });
  results.push('Bits, Prime, Turbo and selected recommendation sections hide while followed channels remain; hover opens/closes the sidebar; chat moves left; uptime uses a mocked Twitch start time.');
  await twitch.evaluate(() => {
    const line = document.querySelector('[data-id="msg-one"]');
    line.innerHTML = '<span data-a-target="chat-deleted-message-placeholder">Message deleted</span>';
  });
  await twitch.waitForFunction(() => document.querySelector('.ss-deleted-copy')?.textContent === 'Before moderation');
  assert.equal(await twitch.locator('[data-id="msg-one"]').evaluate(node => getComputedStyle(node).opacity), '0.45');
  await worker.evaluate(async () => { const { settings } = await chrome.storage.local.get('settings'); await chrome.storage.local.set({ settings: { ...settings, deletedStyle: 'strikethrough' } }); });
  await twitch.waitForFunction(() => getComputedStyle(document.querySelector('[data-id="msg-one"]')).textDecorationLine === 'line-through');
  results.push('Deleted text already received in the tab is retained and switches between dimmed and strikethrough styling.');

  await context.route('https://www.twitch.tv/', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><div class="front-page-carousel"><video id="featured"></video></div><video id="ordinary"></video>' }));
  const home = await context.newPage();
  home.on('pageerror', error => errors.push(error.message));
  await home.goto('https://www.twitch.tv/');
  await home.waitForFunction(() => document.documentElement.classList.contains('ss-pauseFeatured'));
  const paused = await home.evaluate(async () => {
    let count = 0;
    const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
    canvas.getContext('2d').fillRect(0, 0, 32, 32);
    const paint = setInterval(() => { canvas.getContext('2d').fillStyle = Math.random() > .5 ? 'red' : 'blue'; canvas.getContext('2d').fillRect(0, 0, 32, 32); }, 40);
    for (const video of document.querySelectorAll('video')) {
      video.muted = true;
      video.srcObject = canvas.captureStream(1);
      video.addEventListener('pause', () => { if (video.id === 'featured') count++; else count += 100; });
      await Promise.race([video.play().catch(() => {}), new Promise(resolve => setTimeout(resolve, 1500))]);
    }
    await new Promise(resolve => setTimeout(resolve, 50));
    await Promise.race([document.querySelector('#featured').play().catch(() => {}), new Promise(resolve => setTimeout(resolve, 1500))]);
    await new Promise(resolve => setTimeout(resolve, 100));
    clearInterval(paint);
    return count;
  });
  assert.equal(paused, 1, JSON.stringify(errors));
  await home.close();
  results.push('Front-page carousel autoplay is paused once per source; manual replay and ordinary videos are left alone.');

  await worker.evaluate(async () => { const { settings } = await chrome.storage.local.get('settings'); await chrome.storage.local.set({ settings: { ...settings, enabled: false } }); });
  await twitch.waitForFunction(() => window.StreamshadeEnabled === false);
  isAd = true; playlistCounts.clear();
  assert.equal(await runPlayer(), ad);
  assert.equal(tokenTypes.length, 0);
  await twitch.waitForFunction(() => !document.documentElement.classList.contains('ss-hideBits'));
  assert.ok(await twitch.locator('[data-a-target="top-nav-get-bits-button"]').isVisible());
  assert.ok(await twitch.locator('#turbo-trial').isVisible());
  assert.equal(await twitch.locator('.ss-deleted-copy').count(), 0);
  results.push('Protection-off passes through the original playlist without requesting a backup.');
  assert.deepEqual(errors, []);
  results.push('No uncaught page errors in tested extension UI or fixture player.');
  await writeFile('artifacts/browser-results.json', JSON.stringify({ results, errors }, null, 2));
  console.log(results.join('\n'));
} finally { await context.close(); }
