import { sanitizeSettings } from '../shared.js';
import { personalization } from './personalization.js';
import { githubLink } from './github-link.js';
const extension = Boolean(globalThis.chrome?.storage?.local);
const stepNames = ['Welcome', 'Playback', 'Extras', 'Chat', 'Sidebar', 'Browsing', 'Review'];
const lastStep = stepNames.length - 1;
let step = 0;
let draft;
let saving = false;
const dirty = new Set();
const next = document.querySelector('#setup-next');
const back = document.querySelector('#setup-back');
document.querySelector('.topbar').insertAdjacentHTML('beforeend', githubLink);
document.querySelector('.setup-progress').innerHTML = stepNames.map((name, index) => `<span data-step="${index}" aria-label="${index + 1}: ${name}">${String(index + 1).padStart(2, '0')} <b>${name}</b></span>`).join('');
function toggle(key, title, description) {
  return `<label class="setting-row" for="${key}"><span class="setting-copy"><strong>${title}</strong><span>${description}</span></span><input id="${key}" class="switch" type="checkbox" data-choice="${key}"><span class="switch-track" aria-hidden="true"></span></label>`;
}
document.querySelector('#setup-toggles').innerHTML = toggle('enabled', 'Enable Streamshade', 'Apply stream protection and your selected Twitch improvements.');
const extras = document.createElement('section');
extras.className = 'setup-step'; extras.dataset.panel = '2'; extras.hidden = true;
extras.innerHTML = `<span class="eyebrow">LITTLE UPGRADES</span><h1 tabindex="-1">The little <em>extras.</em></h1><p class="setup-lead">Choose the helpers you want alongside your stream.</p><div class="settings-list">${toggle('autoClaim', 'Claim bonus points', 'Automatically collect available channel-point bonuses. Never spend points.')}${toggle('showIndicator', 'Show player status', 'A quiet heads-up when Streamshade steps in.')}${toggle('muteFallback', 'Mute when no backup is available', 'Keep playback moving. Turn off to wait for a clean stream.')}</div>`;
const review = document.querySelector('[data-panel="6"]');
review.before(extras);
// Reuse the settings-page controls so onboarding exposes the same feature set.
const container = document.createElement('div');
container.innerHTML = personalization(toggle, () => '');
[...container.children].forEach((panel, index) => {
  panel.className = 'setup-step'; panel.dataset.panel = String(index + 3); panel.hidden = true;
  panel.removeAttribute('id');
  const title = panel.querySelector('h2');
  const heading = document.createElement('h1'); heading.tabIndex = -1; heading.textContent = title.textContent; title.replaceWith(heading);
  panel.querySelectorAll('.setting-icon').forEach(node => node.remove());
  panel.querySelectorAll('[data-setting]').forEach(input => { input.dataset.choice = input.dataset.setting; input.removeAttribute('data-setting'); });
  review.before(panel);
});
const inputs = [...document.querySelectorAll('[data-choice]')];
const choices = inputs.map(input => [input.dataset.choice, input.closest('label').querySelector('strong').textContent]);
async function read() {
  if (extension) return chrome.storage.local.get(['settings', 'onboarding']);
  try { return JSON.parse(localStorage.getItem('streamshade-preview') || '{}'); } catch { return {}; }
}
function render(focus = true) {
  document.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = Number(panel.dataset.panel) !== step; });
  document.querySelectorAll('[data-step]').forEach(item => { if (Number(item.dataset.step) === step) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current'); });
  back.hidden = step === 0;
  next.textContent = step === 0 ? 'Make it mine →' : step === lastStep ? 'Finish setup ✓' : `Next: ${stepNames[step + 1]} →`;
  document.querySelector('#step-count').textContent = `${step + 1} / ${stepNames.length}`;
  if (step === lastStep) {
    const rows = [['Playback mode', { adaptive: 'Smart quality', swap: 'Low-bandwidth', mute: 'Mute ads' }[draft.mode]], ...choices.map(([key, title]) => [title, key === 'deletedStyle' ? document.querySelector('#deletedStyle').selectedOptions[0].textContent : draft[key] ? 'On' : 'Off'])];
    document.querySelector('#setup-review').replaceChildren(...rows.flatMap(([title, value]) => { const dt = document.createElement('dt'); const dd = document.createElement('dd'); dt.textContent = title; dd.textContent = value; return [dt, dd]; }));
  }
  if (focus) { document.querySelector(`[data-panel="${step}"] h1`).focus(); window.scrollTo(0, 0); }
}
inputs.forEach(input => input.addEventListener('change', () => {
  const key = input.dataset.choice;
  draft[key] = input.type === 'checkbox' ? input.checked : input.value;
  dirty.add(key);
}));
document.querySelectorAll('[name="mode"]').forEach(input => input.addEventListener('change', () => { draft.mode = input.value; dirty.add('mode'); }));
back.addEventListener('click', () => { if (!saving) { step--; render(); } });
next.addEventListener('click', async () => {
  if (saving || !draft) return;
  if (step < lastStep) { step++; render(); return; }
  saving = true; next.disabled = true; back.disabled = true;
  try {
    const latest = await read();
    // Preserve simultaneous changes from another settings tab unless edited here.
    const patch = Object.fromEntries([...dirty].map(key => [key, draft[key]]));
    const settings = sanitizeSettings({ ...latest.settings, ...patch });
    const onboarding = { ...latest.onboarding, completedAt: Date.now(), version: 2 };
    if (extension) await chrome.storage.local.set({ settings, onboarding });
    else localStorage.setItem('streamshade-preview', JSON.stringify({ ...latest, settings, onboarding }));
    review.hidden = true;
    document.querySelector('#setup-actions').hidden = true;
    document.querySelector('#setup-done').hidden = false;
    document.querySelector('#setup-done h1').focus(); window.scrollTo(0, 0);
    document.querySelector('#setup-error').hidden = true;
  } catch {
    const error = document.querySelector('#setup-error'); error.textContent = 'Your preferences could not be saved. Please try finishing setup again.'; error.hidden = false;
    saving = false; next.disabled = false; back.disabled = false;
  }
});
try {
  const stored = await read(); draft = sanitizeSettings(stored.settings);
  if (!stored.onboarding?.completedAt && !draft.hideTurbo) { draft.hideTurbo = true; dirty.add('hideTurbo'); }
  inputs.forEach(input => { if (input.type === 'checkbox') input.checked = draft[input.dataset.choice]; else input.value = draft[input.dataset.choice]; });
  document.querySelectorAll('[name="mode"]').forEach(input => { input.checked = draft.mode === input.value; });
  next.disabled = false; render(false);
} catch {
  const error = document.querySelector('#setup-error'); error.textContent = 'Could not load your preferences. Reload this page to retry.'; error.hidden = false;
}
