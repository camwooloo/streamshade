// Read-only smoke inspection of a logged-out Twitch page in a disposable profile.
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULTS } from '../extension/shared.js';
const extensionPath = path.resolve('dist/streamshade');
const browser = await chromium.launchPersistentContext(path.resolve('.live-smoke-profile'), { executablePath: process.env.STREAMSHADE_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`] });
try {
  let worker = browser.serviceWorkers().find(item => item.url().startsWith('chrome-extension://') && item.url().endsWith('/background.js'));
  if (!worker) worker = await browser.waitForEvent('serviceworker', { predicate: item => item.url().startsWith('chrome-extension://') && item.url().endsWith('/background.js') });
  for (let i = 0; i < 20 && !await worker.evaluate(() => Boolean(globalThis.chrome?.storage?.local)); i++) await new Promise(resolve => setTimeout(resolve, 100));
  for (let i = 0; i < 20 && !await worker.evaluate(async () => Boolean((await chrome.storage.local.get('stats')).stats)); i++) await new Promise(resolve => setTimeout(resolve, 100));
  await worker.evaluate(async defaults => chrome.storage.local.set({ settings: { ...defaults, showUptime: true, sidebarHover: true, hidePrime: true } }), DEFAULTS);
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    window.smokeStates = [];
    window.addEventListener('message', event => { if (event.data?.source === 'streamshade:engine') window.smokeStates.push({ type: event.data.type, state: event.data.state, quality: event.data.quality }); });
  });
  await page.goto('https://www.twitch.tv/directory/all', { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(12000);
  const info = await page.evaluate(() => ({ title: document.title, url: location.href,
    classes: document.documentElement.className,
    targets: [...document.querySelectorAll('[data-a-target]')].map(node => node.getAttribute('data-a-target')).filter((value, index, array) => array.indexOf(value) === index),
    sidebar: document.querySelector('.side-nav')?.outerHTML.slice(0, 40000),
    nav: document.querySelector('.top-nav')?.outerHTML.slice(0, 22000),
    cards: [...document.querySelectorAll('[data-a-target*="preview-card"]')].slice(0, 8).map(node => ({ target: node.getAttribute('data-a-target'), tag: node.tagName, href: node.getAttribute('href') }))
  }));
  const arrow = page.locator('[data-a-target="side-nav-arrow"]');
  if (await arrow.count()) {
    await arrow.click(); await page.mouse.move(700, 100);
    await page.locator('.side-nav').dispatchEvent('pointerenter');
    await page.waitForTimeout(400);
    info.hoverExpanded = await page.locator('.side-nav').evaluate(node => node.classList.contains('side-nav--expanded'));
    await page.locator('.side-nav').dispatchEvent('pointerleave');
    await page.waitForTimeout(500);
    info.hoverCollapsed = await page.locator('.side-nav').evaluate(node => node.classList.contains('side-nav--collapsed'));
  }
  info.uptimeBadges = await page.locator('.ss-uptime').count();
  info.taggedCards = await page.locator('[data-streamshade-card]').count();
  info.primeHidden = await page.locator('[data-a-target="prime-offers-icon"]').isHidden();
  info.savedSettings = await worker.evaluate(async () => (await chrome.storage.local.get('settings')).settings);
  const channel = await page.locator('[data-a-target="preview-card-image-link"]').first().getAttribute('href').catch(() => null);
  if (channel && /^\/\w+$/.test(channel)) {
    await page.goto(`https://www.twitch.tv${channel}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(10000);
    await worker.evaluate(async () => { const {settings} = await chrome.storage.local.get('settings'); await chrome.storage.local.set({settings:{...settings,chatOnLeft:true}}); });
    await page.waitForTimeout(1200);
    info.playback = await page.evaluate(() => ({ states: window.smokeStates, videos: [...document.querySelectorAll('video')].map(video => ({ paused: video.paused, time: video.currentTime, readyState: video.readyState })), workerCount: performance.getEntriesByType('resource').filter(item => item.initiatorType === 'script').length,
      columns: ['.channel-root', '.channel-root__main', '.channel-root__right-column', '.twilight-main', '.side-nav', '.persistent-player'].map(selector => { const node = document.querySelector(selector); const style = node && getComputedStyle(node); return { selector, html: node?.outerHTML.slice(0, 700), parents: node && [node.parentElement?.className, node.parentElement?.parentElement?.className], style: style && { position: style.position, width: style.width, left: style.left, right: style.right, padding: style.padding, margin: style.margin, display: style.display, transform: style.transform, flex: style.flex } }; }) }));
  }
  await writeFile('artifacts/live-smoke.json', JSON.stringify(info, null, 2));
  console.log(JSON.stringify({ title: info.title, classes: info.classes, savedSettings: info.savedSettings, hoverExpanded: info.hoverExpanded, hoverCollapsed: info.hoverCollapsed, uptimeBadges: info.uptimeBadges, taggedCards: info.taggedCards, primeHidden: info.primeHidden, playback: info.playback }, null, 2));
} catch (error) { console.log(`Live page inspection unavailable: ${error.message}`); }
finally { await browser.close(); }
