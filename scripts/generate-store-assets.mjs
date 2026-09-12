import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULTS } from '../extension/shared.js';

const output = path.resolve('Chrome Web Store Uploads');
await mkdir(output, { recursive: true });
const extensionPath = path.resolve('dist/streamshade');
const browser = await chromium.launchPersistentContext(path.resolve('artifacts/.store-capture-profile'), {
  executablePath: process.env.STREAMSHADE_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true, viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1,
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
});
const manifest = JSON.parse(await readFile('dist/streamshade/manifest.json', 'utf8'));
const exported = [];
async function save(page, filename, width, height) {
  await page.evaluate(() => document.fonts.ready);
  const buffer = await page.screenshot({ animations: 'disabled' });
  const destination = path.join(output, filename);
  await sharp(buffer).flatten({ background: '#101617' }).removeAlpha().toColourspace('srgb').png({ palette: false, compressionLevel: 9 }).toFile(destination);
  const metadata = await sharp(destination).metadata();
  if (metadata.width !== width || metadata.height !== height || metadata.channels !== 3 || metadata.hasAlpha || metadata.depth !== 'uchar') throw new Error(`Invalid upload format: ${filename}`);
  exported.push({ filename, width, height, channels: metadata.channels, format: '24-bit PNG, no alpha' });
}
try {
  let worker = browser.serviceWorkers().find(w => w.url().endsWith('/background.js'));
  worker ||= await browser.waitForEvent('serviceworker');
  for (let i = 0; i < 50; i++) {
    if (await worker.evaluate(() => Boolean(globalThis.chrome?.storage?.local))) {
      if (await worker.evaluate(async () => Boolean((await chrome.storage.local.get('settings')).settings))) break;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  await worker.evaluate(async defaults => chrome.storage.local.set({ settings: defaults, stats: { breaks: 0, claims: 0 }, onboarding: { startedAt: 1, completedAt: 1, version: 2 } }), DEFAULTS);
  const base = `chrome-extension://${new URL(worker.url()).host}`;
  const options = await browser.newPage();
  await options.goto(`${base}/ui/options.html`);
  await options.locator('#mode-adaptive').waitFor();
  await options.evaluate(async () => { await document.fonts.ready; scrollTo(0, 0); await new Promise(requestAnimationFrame); });
  await save(options, 'Screenshot-01-Stream-Protection-1280x800.png', 1280, 800);

  await options.evaluate(() => { const element = document.querySelector('#chat'); scrollTo(0, element.getBoundingClientRect().top + scrollY - 32); });
  await options.waitForFunction(() => document.querySelector('.nav-link.active')?.hash === '#chat');
  await save(options, 'Screenshot-03-Chat-and-Sidebar-1280x800.png', 1280, 800);

  // Opening real disclosure panels below gives the section room to align at the top.
  await options.locator('#about details').evaluateAll(details => details.forEach(item => { item.open = true; }));
  await options.evaluate(() => { const element = document.querySelector('#browsing'); scrollTo(0, element.getBoundingClientRect().top + scrollY - 32); });
  await options.waitForFunction(() => document.querySelector('.nav-link.active')?.hash === '#browsing');
  const browsingImage = `data:image/png;base64,${(await options.locator('#browsing').screenshot({ animations: 'disabled' })).toString('base64')}`;

  const welcome = await browser.newPage();
  await welcome.goto(`${base}/ui/welcome.html`);
  await welcome.locator('#setup-next:not([disabled])').waitFor();
  for (let step = 0; step < 3; step++) await welcome.locator('#setup-next').click();
  await save(welcome, 'Screenshot-05-Guided-Setup-1280x800.png', 1280, 800);

  const popup = await browser.newPage();
  await popup.setViewportSize({ width: 400, height: 600 });
  await popup.goto(`${base}/ui/popup.html`);
  await popup.locator('#all-settings').waitFor();
  await popup.evaluate(() => document.fonts.ready);
  const popupImage = `data:image/png;base64,${(await popup.screenshot({ animations: 'disabled' })).toString('base64')}`;
  const mark = `data:image/svg+xml;base64,${(await readFile('extension/icons/mark.svg')).toString('base64')}`;
  const sans = `data:font/woff2;base64,${(await readFile('extension/fonts/manrope-latin-600-normal.woff2')).toString('base64')}`;
  const mono = `data:font/woff2;base64,${(await readFile('extension/fonts/dm-mono-latin-400-normal.woff2')).toString('base64')}`;
  const style = `@font-face{font-family:Manrope;src:url('${sans}')}@font-face{font-family:Mono;src:url('${mono}')}*{box-sizing:border-box}body{margin:0;background:#101617;color:#edf3ee;font-family:Manrope,sans-serif;overflow:hidden}.canvas{position:relative;width:100vw;height:100vh;overflow:hidden}.brand{display:flex;gap:12px;align-items:center;font-size:25px;letter-spacing:-1px}.brand img{width:43px;height:43px}.brand b{font-weight:600}.brand b span{color:#b9f6cf}.eyebrow{font:10px Mono,monospace;letter-spacing:2px;color:#a1b8ad}.mint{color:#b9f6cf}h1{font-size:66px;line-height:1.08;letter-spacing:-3px;font-weight:600;margin:22px 0}p{font-size:16px;line-height:1.8;color:#a7b9b0}.rings{position:absolute;right:-35px;top:30px;width:660px;height:660px;border:1px solid #3a5243;border-radius:50%;opacity:.5}.rings:before,.rings:after{content:'';position:absolute;border:1px solid #3a5243;border-radius:50%;inset:65px}.rings:after{inset:130px}.spark{position:absolute;color:#95bfa1;font:32px Mono}.popup-frame{position:absolute;padding:8px;border:1px solid #57745e;border-radius:18px;background:#1e3026;box-shadow:0 30px 75px #0007}.popup-frame img{display:block;width:100%;height:auto;border-radius:11px}.rule{height:1px;background:#35483c}.foot{font:10px Mono;color:#89a391;letter-spacing:1px}.pill{display:inline-flex;padding:8px 11px;border:1px solid #45624e;border-radius:5px;color:#b9f6cf;font:10px Mono;letter-spacing:.3px}`;
  async function render(width, height, body, extra = '') {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height });
    await page.setContent(`<html><head><style>${style}${extra}</style></head><body><main class="canvas">${body}</main></body></html>`);
    await page.evaluate(() => Promise.all([...document.images].map(img => img.decode())));
    return page;
  }
  const brand = `<div class="brand"><img src="${mark}" alt=""><b>streamshade<span>.</span></b></div>`;
  const quick = await render(1280, 800, `<div class="rings"></div><span class="spark" style="right:66px;top:73px">+</span><div style="position:absolute;left:76px;top:65px">${brand}</div><div style="position:absolute;left:76px;top:222px;width:540px"><div class="eyebrow">YOUR TWITCH COMPANION</div><h1>Your stream.<br><span class="mint">Your controls.</span></h1><p>Choose your playback mode.<br>Claim bonus points. Make Twitch your own.</p><div style="display:flex;gap:9px;margin-top:27px"><span class="pill">SMART QUALITY</span><span class="pill">LOW-BANDWIDTH</span><span class="pill">MUTE ADS</span></div><div class="rule" style="margin:42px 0 18px;width:420px"></div><span class="foot">NO ACCOUNT. NO ANALYTICS.</span></div><div class="popup-frame" style="right:93px;top:72px;width:420px"><img src="${popupImage}" alt="Streamshade toolbar popup"></div><span class="foot" style="position:absolute;bottom:31px;left:76px">STREAMSHADE ${manifest.version} · ACTUAL EXTENSION INTERFACE</span>`);
  await save(quick, 'Screenshot-02-Quick-Controls-1280x800.png', 1280, 800);

  const declutter = await render(1280, 800, `<div style="position:absolute;left:62px;top:56px">${brand}</div><div style="position:absolute;left:62px;top:222px;width:400px"><div class="eyebrow">BROWSE & DECLUTTER</div><h1 style="font-size:53px">Keep the<br><span class="mint">good bits.</span></h1><p style="max-width:345px">Hide purchase prompts.<br>Choose what autoplays.<br>See how long a stream’s been live.</p><div class="rule" style="margin:35px 0 20px;width:320px"></div><span class="foot">SMALL CHANGES. YOUR CHOICE.</span></div><div class="popup-frame" style="left:503px;right:45px;top:142px;padding:25px;background:#101617"><img src="${browsingImage}" alt="Actual browsing and declutter settings" style="border-radius:0"></div><span class="foot" style="position:absolute;bottom:35px;left:62px">ACTUAL STREAMSHADE SETTINGS</span>`);
  await save(declutter, 'Screenshot-04-Browse-and-Declutter-1280x800.png', 1280, 800);

  const small = await render(440, 280, `<div style="position:absolute;left:28px;top:25px">${brand}</div><div class="rings" style="width:250px;height:250px;right:-140px;top:80px"></div><h1 style="position:absolute;left:28px;top:76px;font-size:43px;letter-spacing:-2px;margin:0">Your Twitch.<br><span class="mint">Your way.</span></h1><div class="rule" style="position:absolute;left:28px;right:28px;bottom:51px"></div><span class="foot" style="position:absolute;left:28px;bottom:28px;font-size:9px;letter-spacing:.2px">STREAM PROTECTION · CHAT · SIDEBAR</span><span class="spark" style="right:39px;top:109px">✦</span>`, '.brand{font-size:21px;gap:9px}.brand img{width:32px;height:32px}');
  await save(small, 'Small-Promo-Tile-440x280.png', 440, 280);

  const marquee = await render(1400, 560, `<div class="rings" style="right:0;top:-90px"></div><div style="position:absolute;left:68px;top:47px">${brand}</div><div style="position:absolute;left:68px;top:158px"><div class="eyebrow">MAKE YOURSELF AT HOME ON TWITCH</div><h1 style="font-size:66px">A little less noise.<br><span class="mint">A lot more live.</span></h1><p style="margin-top:25px">Stream protection. A calmer chat. Your kind of sidebar.</p></div><div class="popup-frame" style="width:320px;right:115px;top:31px;transform:rotate(4deg)"><img src="${popupImage}" alt="Streamshade popup"></div><span class="spark" style="right:48px;top:100px">+</span><span class="spark" style="right:485px;bottom:64px">✦</span><span class="foot" style="position:absolute;left:68px;bottom:39px">YOUR TWITCH COMPANION</span>`);
  await save(marquee, 'Marquee-Promo-Tile-1400x560.png', 1400, 560);
  await writeFile(path.join(output, 'UPLOAD-GUIDE.txt'), `STREAMSHADE — CHROME WEB STORE IMAGES\n\nScreenshots field: upload Screenshot-01 through Screenshot-05, in that order.\nSmall promo tile field: Small-Promo-Tile-440x280.png\nMarquee promo tile field: Marquee-Promo-Tile-1400x560.png\n\nAll seven files are 24-bit RGB PNGs with no transparency, at the exact requested sizes.\nScreenshots use the actual v${manifest.version} extension with default preferences and zero counters in a separate test profile. No Twitch account, chats, or private user data are shown. Screenshot 02 combines the actual popup with explanatory artwork. Promo tiles use the original Streamshade artwork and actual popup.\n\nThe marquee tile is optional. The five screenshots fill the maximum allowed slots.\n`);
  await writeFile(path.join(output, 'image-validation.json'), JSON.stringify(exported, null, 2));
  console.log(JSON.stringify(exported, null, 2));
} finally { await browser.close(); }
