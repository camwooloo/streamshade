import { DEFAULTS, sanitizeSettings } from '../shared.js';
import { personalization } from './personalization.js';
import { trackSections } from './navigation.js';
import { githubLink } from './github-link.js';
const isPopup = document.body.dataset.view === 'popup';
const extension = Boolean(globalThis.chrome?.storage?.local);
let settings = { ...DEFAULTS };
let stats = { breaks: 0, claims: 0 };
let activeTab = null;
let busy = false;
const icons = {
  sliders: '<path d="M4 7h16M4 17h16M8 4v6m8 4v6"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  shield: '<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/><path d="m8 12 3 3 5-6"/>',
  spark: '<path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7L12 3Z"/>',
  screen: '<rect x="3" y="4" width="18" height="13" rx="3"/><path d="M8 21h8m-4-4v4m-2-13 5 3-5 3Z"/>',
  wave: '<path d="M3 12h3l3-7 6 14 3-7h3"/>',
  sound: '<path d="m11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-12h-7l0-8Z"/>',
  link: '<path d="M14 3h7v7m0-7-11 11M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  check: '<path d="m5 12 4 4L19 6"/>'
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.spark}</svg>`;
const modeNames = { adaptive: 'Smart quality', swap: 'Low-bandwidth', mute: 'Mute ads' };
function toggle(key, title, description, symbol) {
  return `<label class="setting-row" for="${key}"><span class="setting-icon">${icon(symbol)}</span><span class="setting-copy"><strong>${title}</strong><span>${description}</span></span><input class="switch" type="checkbox" id="${key}" data-setting="${key}"><span class="switch-track" aria-hidden="true"></span></label>`;
}
function modeCard(id, title, description, symbol, badge) {
  return `<label class="mode-card" for="mode-${id}"><input type="radio" name="mode" value="${id}" id="mode-${id}"><span class="mode-icon">${icon(symbol)}</span><span class="mode-copy"><span class="mode-title">${title}${badge ? `<span class="tiny-label">${badge}</span>` : ''}</span><span class="mode-description">${description}</span></span><span class="radio-mark" aria-hidden="true"></span></label>`;
}
function art() {
  return `<div class="signal-art" aria-hidden="true"><div class="orbital orbit-one"></div><div class="orbital orbit-two"></div><div class="orbital orbit-three"></div><span class="art-spark spark-one">+</span><span class="art-spark spark-two">+</span><div class="mini-stream"><div class="mini-top"><i></i><i></i><i></i><span>LIVE SIGNAL</span></div><svg viewBox="0 0 260 120" fill="none"><path d="M0 86 44 56 83 74 134 23 173 52 209 34 260 76v44H0Z" fill="#73b399" fill-opacity=".16"/><path d="m0 86 44-30 39 18 51-51 39 29 36-18 51 42" stroke="#b9f6cf" stroke-width="2"/><path d="M0 110 44 80 83 98 134 47 173 76 209 58 260 100" stroke="#b9f6cf" stroke-opacity=".22"/><circle cx="134" cy="23" r="5" fill="#b9f6cf"/></svg><div class="mini-progress"><span></span></div></div><span class="art-pill">${icon('check')} STAY IN THE MOMENT</span></div>`;
}
const brand = `<a class="brand" href="options.html" aria-label="Streamshade settings"><img src="../icons/mark.svg" alt="" width="36" height="36"><span>streamshade<span class="brand-period">.</span></span></a>`;
const header = `<header class="topbar">${brand}<span class="version-label">${extension ? 'v' + chrome.runtime.getManifest().version : 'DESIGN PREVIEW'}</span>${isPopup ? `<button class="icon-button" id="open-settings" aria-label="Open all settings">${icon('sliders')}</button>` : '<span class="local-label"><i></i> MADE FOR YOUR MOMENT</span>'}${githubLink}</header>`;
const controls = `<section class="control-panel" id="protection"><div class="section-heading"><div><span class="eyebrow">01 / PLAYBACK</span><h2>Choose your flow.</h2></div><span class="section-note">One mode at a time</span></div><div class="mode-list" role="radiogroup" aria-label="Ad handling method">${modeCard('adaptive', 'Smart quality', 'Try the best quality available. Step down only when needed.', 'wave', 'VAFT')}${modeCard('swap', 'Low-bandwidth', 'Prefer a lighter, near-360p stream during ad breaks.', 'bolt', '')}${modeCard('mute', 'Mute ads', 'Keep normal playback. Silence ads until the stream returns.', 'sound', '')}</div><p class="mode-footnote" id="mode-footnote"></p></section>`;
const extras = `<section class="extras-panel" id="extras"><div class="section-heading"><div><span class="eyebrow">02 / LITTLE UPGRADES</span><h2>Make yourself at home.</h2></div></div><div class="settings-list">${toggle('autoClaim', 'Claim bonus points', 'Collect available channel-point bonuses automatically.', 'spark')}${toggle('showIndicator', 'Show player status', 'A quiet heads-up when Streamshade steps in.', 'screen')}${toggle('muteFallback', 'Mute when no backup is available', 'Keep playback moving. Turn off to wait for a clean stream.', 'sound')}</div></section>`;
const protection = `<section class="protection-strip"><span class="protection-symbol">${icon('shield')}</span><div><strong id="protection-title">Protection is on</strong><span id="protection-detail">Smart quality · ready for your next stream</span></div><label class="standalone-toggle" title="Enable Streamshade"><input type="checkbox" class="switch" id="enabled" data-setting="enabled" aria-label="Enable Streamshade"><span class="switch-track" aria-hidden="true"></span></label></section>`;
const numbers = `<div class="stats-grid"><div><span class="stat-number" id="break-count">0</span><span class="stat-label">AD BREAKS DETECTED</span></div><div><span class="stat-number" id="claim-count">0</span><span class="stat-label">BONUSES CLAIMED</span></div><div class="stats-note">${icon('shield')}<span>Your browser.<br>Your data.</span></div></div>`;
const connection = `<div class="connection"><span class="connection-dot"></span><span id="connection-text">Checking your stream…</span><button class="text-button" id="refresh-stream" hidden>Reload Twitch ${icon('reset')}</button></div>`;
const footer = `<footer><span>Less interruption. More stream.</span>${githubLink}</footer><div class="toast" role="status" aria-live="polite" id="toast"></div>`;

document.querySelector('#app').innerHTML = isPopup ? `${header}<main class="popup-main"><section class="popup-intro"><span class="eyebrow"><i class="live-dot"></i> YOUR TWITCH COMPANION</span><h1>Stay with the stream<span>.</span></h1><p>A little less interruption. A lot more live.</p></section>${protection}${connection}<div class="popup-section-heading"><span>AD HANDLING</span><a href="options.html" id="customize-link">Customize ${icon('arrow')}</a></div><div class="quick-modes" role="radiogroup" aria-label="Ad handling method">${['adaptive', 'swap', 'mute'].map((id, i) => `<label><input type="radio" name="mode" value="${id}">${icon(['wave','bolt','sound'][i])}<span>${modeNames[id]}</span></label>`).join('')}</div><div class="popup-extras">${toggle('autoClaim', 'Bonus points, on autopilot', 'Automatically claim channel bonuses.', 'spark')}</div>${numbers}<a href="options.html" id="all-settings" class="all-settings">All settings <span>Make it yours ${icon('arrow')}</span></a></main>${footer}` : `${header}<div class="workspace"><aside class="sidebar"><span class="eyebrow">YOUR SPACE</span><nav aria-label="Settings sections"><a class="nav-link active" href="#protection">${icon('shield')} Stream protection <span>01</span></a><a class="nav-link" href="#extras">${icon('spark')} Little upgrades <span>02</span></a><a class="nav-link" href="#about">${icon('info')} About & setup <span>03</span></a></nav><div class="sidebar-bottom"><div class="privacy-stamp">${icon('shield')}</div><h3>Good company.<br>Small footprint.</h3><p>No account. No analytics.<br>Just you and the stream.</p><span class="build-tag">MANIFEST V3 <i>·</i> LOCAL FIRST</span></div></aside><main class="settings-main"><section class="hero"><div class="hero-copy"><span class="eyebrow"><i class="live-dot"></i> A BETTER SEAT IN CHAT</span><h1>Your stream,<br><em>uninterrupted.</em></h1><p>Stay for the good bits. Streamshade handles the breaks, so you can stay in the moment.</p></div>${art()}</section>${protection}${connection}<div class="settings-columns"><div>${controls}${extras}</div><aside class="right-rail"><section class="session-card"><span class="eyebrow">SINCE YOU GOT HERE</span><h3>Small wins.<br>More good moments.</h3>${numbers}<button class="text-button reset-stats" id="reset-stats">Reset counters ${icon('reset')}</button></section><section class="quality-note"><span class="quality-glyph">≈</span><h3>Quality takes the lead.</h3><p>Smart quality uses VAFT to look for a clean stream at your current resolution before trying a lower-quality alternative.</p><span>Availability depends on Twitch.</span></section><div class="future-note">${icon('spark')}<p>Room to grow.<br><span>More emote features are on the horizon.</span></p></div></aside></div><section class="about-panel" id="about"><div class="section-heading"><div><span class="eyebrow">06 / THE DETAILS</span><h2>A little transparency.</h2></div><span class="outline-tag">EARLY ACCESS</span></div><details><summary>First time here? ${icon('chevron')}</summary><div class="details-copy"><p>Disable your existing Twitch-specific uBlock script or other Twitch ad blocker, then reload open Twitch tabs. General filtering can stay enabled.</p><p>For this local build, open Chrome’s Extensions page, enable Developer mode, choose <strong>Load unpacked</strong>, and select the <strong>dist/streamshade</strong> folder. Pin the icon for quick controls.</p></div></details><details><summary>What happens during an ad? ${icon('chevron')}</summary><div class="details-copy"><p>Smart quality tries embed and popout playback before autoplay. Low-bandwidth tries autoplay first and targets around 360p. A clean replacement can be unavailable; the fallback either mutes the original ad or waits without ad playback. Normal stream quality returns after the break.</p><p>These methods depend on Twitch’s player and can stop working. This early build needs live testing; a higher-quality replacement is an attempt, never a promise.</p></div></details><details><summary>Permissions, privacy & credits ${icon('chevron')}</summary><div class="details-copy"><p>Streamshade runs only on Twitch pages. Settings and two aggregate counters stay in this browser. No analytics, external proxy, or remote blocker updates. Twitch session headers are used only in page memory for playback requests and are never saved.</p><p>The engine adapts the MIT-licensed VAFT v24 by TwitchAdSolutions contributors. The project was archived in March 2026. Streamshade is independent of Twitch and 7TV. Chat and layout controls are implemented independently; 7TV emote rendering is not included.</p><a href="../THIRD_PARTY_NOTICES.md" target="_blank">Third-party notices ${icon('link')}</a></div></details></section>${footer}</main></div>`;

if (!isPopup) {
  document.querySelector('#about .section-heading').insertAdjacentHTML('afterend', '<p><a class="text-button" href="welcome.html">Run setup again →</a></p>');
  document.querySelector('#extras').insertAdjacentHTML('afterend', personalization(toggle, icon));
  const aboutLink = document.querySelector('.sidebar nav a[href="#about"]');
  aboutLink.insertAdjacentHTML('beforebegin', `<a class="nav-link" href="#chat">${icon('wave')} Chat appearance</a><a class="nav-link" href="#sidebar">${icon('screen')} Channel sidebar</a><a class="nav-link" href="#browsing">${icon('sliders')} Browse & declutter</a>`);
  const sidebar = document.querySelector('.sidebar');
  const content = document.createElement('div');
  content.className = 'sidebar-content';
  content.append(...sidebar.childNodes);
  sidebar.append(content);
  content.querySelector('nav').insertAdjacentHTML('afterend', `<div class="sidebar-project">${githubLink}</div>`);
  document.querySelectorAll('.nav-link').forEach((link, index) => {
    link.querySelector('span')?.remove();
    link.insertAdjacentHTML('beforeend', `<span>${String(index + 1).padStart(2, '0')}</span>`);
  });
  trackSections();
}

async function readData() {
  if (extension) return chrome.storage.local.get(['settings', 'stats']);
  try { return JSON.parse(localStorage.getItem('streamshade-preview') || '{}'); } catch { return {}; }
}
function toast(message) {
  const node = document.querySelector('#toast');
  node.textContent = message;
  node.classList.add('visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('visible'), 2600);
}
function render() {
  document.querySelectorAll('input[data-setting]').forEach(input => { input.checked = settings[input.dataset.setting]; });
  document.querySelectorAll('select[data-setting]').forEach(input => { input.value = settings[input.dataset.setting]; });
  document.querySelectorAll('input[name="mode"]').forEach(input => { input.checked = input.value === settings.mode; });
  document.body.classList.toggle('protection-off', !settings.enabled);
  document.querySelector('#protection-title').textContent = settings.enabled ? 'Protection is on' : 'Taking a breather';
  document.querySelector('#protection-detail').textContent = settings.enabled ? `${modeNames[settings.mode]} · ready for your next stream` : 'Playback changes and bonus claiming are paused';
  document.querySelector('#break-count').textContent = Number(stats.breaks || 0).toLocaleString();
  document.querySelector('#claim-count').textContent = Number(stats.claims || 0).toLocaleString();
  const note = document.querySelector('#mode-footnote');
  if (note) note.textContent = { adaptive: 'High quality first. Lower resolution only when a clean alternative needs it.', swap: 'A lighter stream during ads. Your usual quality returns after the break.', mute: 'Ads still play in this mode. Streamshade manages the sound.' }[settings.mode];
  const fallback = document.querySelector('#muteFallback');
  if (fallback) { fallback.disabled = settings.mode === 'mute'; fallback.closest('.setting-row').classList.toggle('muted-row', fallback.disabled); }
}
async function save(patch) {
  if (busy) return;
  busy = true;
  const previous = settings;
  try {
    const latest = await readData();
    settings = sanitizeSettings({ ...sanitizeSettings(latest.settings), ...patch });
    if (extension) await chrome.storage.local.set({ settings });
    else localStorage.setItem('streamshade-preview', JSON.stringify({ settings, stats }));
    render();
    toast(extension ? 'Saved. Changes apply to open Twitch tabs.' : 'Preview preferences saved locally.');
  } catch { settings = previous; render(); toast('Could not save. Please try again.'); }
  finally { busy = false; }
}
document.querySelectorAll('input[data-setting]').forEach(input => input.addEventListener('change', () => save({ [input.dataset.setting]: input.checked })));
document.querySelectorAll('select[data-setting]').forEach(input => input.addEventListener('change', () => save({ [input.dataset.setting]: input.value })));
document.querySelectorAll('input[name="mode"]').forEach(input => input.addEventListener('change', () => save({ mode: input.value })));
for (const id of ['open-settings', 'all-settings', 'customize-link']) document.getElementById(id)?.addEventListener('click', event => {
  if (extension) { event.preventDefault(); chrome.runtime.openOptionsPage(); }
  else if (id === 'open-settings') location.href = 'options.html';
});
document.querySelector('#reset-stats')?.addEventListener('click', async () => {
  stats = { breaks: 0, claims: 0 };
  if (extension) await chrome.storage.local.set({ stats });
  else localStorage.setItem('streamshade-preview', JSON.stringify({ settings, stats }));
  render(); toast('Counters reset.');
});
async function checkConnection() {
  const text = document.querySelector('#connection-text');
  if (!extension) { text.textContent = 'Design preview · connect the extension to use on Twitch'; return; }
  try {
    [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab?.id) { text.textContent = 'Open a Twitch stream to get started'; return; }
    const status = await chrome.tabs.sendMessage(activeTab.id, { type: 'status' });
    const messages = { connecting: 'Connecting · reload this Twitch tab if needed', ready: 'Connected to Twitch · waiting for playback', watching: 'Connected · watching your stream', replacing: `Clean stream playing${status.quality ? ' · ' + status.quality : ''}`, searching: 'Ad detected · looking for a clean stream', waiting: 'Ad segments held · waiting for a clean stream', unavailable: 'No clean backup available', muting: 'Ad detected · sound is muted', disabled: 'Connected · protection is paused', conflict: 'Another Twitch blocker is active · disable it and reload', unsupported: 'Player worker unsupported · try Mute ads', error: 'Player hook error · reload or try Mute ads' };
    text.textContent = messages[status.state] || 'Connected to Twitch';
    document.querySelector('#refresh-stream').hidden = !['connecting', 'error', 'conflict', 'unsupported'].includes(status.state);
  } catch { text.textContent = 'Open or reload a Twitch stream to connect'; }
}
document.querySelector('#refresh-stream').addEventListener('click', async () => { if (extension && activeTab?.id) { await chrome.tabs.reload(activeTab.id); toast('Reloading Twitch…'); } });
const data = await readData();
settings = sanitizeSettings(data.settings);
stats = data.stats || stats;
render();
await checkConnection();
if (extension) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.settings) settings = sanitizeSettings(changes.settings.newValue);
    if (changes.stats) stats = changes.stats.newValue || { breaks: 0, claims: 0 };
    render();
  });
  setInterval(checkConnection, 4000);
}
