import { sanitizeSettings } from '../shared.js';
const extension = Boolean(globalThis.chrome?.storage?.local);
const choices = [
  ['hideTurbo', 'Hide Turbo promotions', 'Remove “Try 1-Month Ad-Free” and Turbo offers.'],
  ['hideBits', 'Hide Bits buying', 'Keep purchase buttons out of the top navigation.'],
  ['hidePrime', 'Hide the Prime crown', 'Remove Prime offers from the top navigation.'],
  ['autoClaim', 'Claim bonus points', 'Automatically collect available channel-point bonuses.'],
  ['sidebarHover', 'Expand the sidebar on hover', 'Temporarily expand your collapsed channel list.']
];
let step = 0;
let draft;
let saving = false;
const next = document.querySelector('#setup-next');
const back = document.querySelector('#setup-back');
async function read() {
  if (extension) return chrome.storage.local.get(['settings', 'onboarding']);
  try { return JSON.parse(localStorage.getItem('streamshade-preview') || '{}'); } catch { return {}; }
}
document.querySelector('#setup-toggles').innerHTML = choices.map(([key, title, description]) => `<label class="setting-row" for="${key}"><span class="setting-copy"><strong>${title}</strong><span>${description}</span></span><input id="${key}" class="switch" type="checkbox" data-choice="${key}"><span class="switch-track" aria-hidden="true"></span></label>`).join('');
function render(focus = true) {
  document.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = Number(panel.dataset.panel) !== step; });
  document.querySelectorAll('[data-step]').forEach(item => { if (Number(item.dataset.step) === step) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current'); });
  back.hidden = step === 0;
  next.textContent = step === 0 ? 'Make it mine →' : step === 1 ? 'Review setup →' : 'Finish setup ✓';
  document.querySelector('#step-count').textContent = `${step + 1} / 3`;
  if (step === 2) {
    const rows = [['Playback', { adaptive: 'Smart quality', swap: 'Low-bandwidth', mute: 'Mute ads' }[draft.mode]], ...choices.map(([key, title]) => [title, draft[key] ? 'On' : 'Off'])];
    document.querySelector('#setup-review').replaceChildren(...rows.flatMap(([title, value]) => { const dt = document.createElement('dt'); const dd = document.createElement('dd'); dt.textContent = title; dd.textContent = value; return [dt, dd]; }));
  }
  if (focus) { document.querySelector(`[data-panel="${step}"] h1`).focus(); window.scrollTo(0, 0); }
}
document.querySelectorAll('[data-choice]').forEach(input => input.addEventListener('change', () => { draft[input.dataset.choice] = input.checked; }));
document.querySelectorAll('[name="mode"]').forEach(input => input.addEventListener('change', () => { draft.mode = input.value; }));
back.addEventListener('click', () => { if (!saving) { step--; render(); } });
next.addEventListener('click', async () => {
  if (saving || !draft) return;
  if (step < 2) { step++; render(); return; }
  saving = true; next.disabled = true; back.disabled = true;
  try {
    const latest = await read();
    const patch = Object.fromEntries(['mode', ...choices.map(item => item[0])].map(key => [key, draft[key]]));
    const settings = sanitizeSettings({ ...latest.settings, ...patch });
    const onboarding = { ...latest.onboarding, completedAt: Date.now(), version: 1 };
    if (extension) await chrome.storage.local.set({ settings, onboarding });
    else localStorage.setItem('streamshade-preview', JSON.stringify({ ...latest, settings, onboarding }));
    document.querySelector('[data-panel="2"]').hidden = true;
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
  if (!stored.onboarding?.completedAt) draft.hideTurbo = true;
  document.querySelectorAll('[data-choice]').forEach(input => { input.checked = draft[input.dataset.choice]; });
  document.querySelectorAll('[name="mode"]').forEach(input => { input.checked = draft.mode === input.value; });
  next.disabled = false; render(false);
} catch {
  const error = document.querySelector('#setup-error'); error.textContent = 'Could not load your preferences. Reload this page to retry.'; error.hidden = false;
}
