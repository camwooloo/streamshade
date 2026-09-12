import { sanitizeSettings } from './shared.js';

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  const stored = await chrome.storage.local.get(['settings', 'stats', 'onboarding']);
  await chrome.storage.local.set({ settings: sanitizeSettings(stored.settings), stats: stored.stats || { breaks: 0, claims: 0 } });
  // Offer setup once on install, including one migration for pre-onboarding builds.
  // Routine updates never reset preferences or reopen a completed setup.
  if ((reason === 'install' || reason === 'update') && !stored.onboarding?.startedAt && !stored.onboarding?.completedAt) {
    await chrome.storage.local.set({ onboarding: { startedAt: Date.now() } });
    await chrome.tabs.create({ url: chrome.runtime.getURL('ui/welcome.html') });
  }
});

// Serialize counter writes across frames and tabs; no browsing history is kept.
let writeQueue = Promise.resolve();
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (!sender.tab || !/^https:\/\/(www|player|m)\.twitch\.tv\//.test(sender.url || '')) return;
  if (message?.type !== 'metric' || !['breaks', 'claims'].includes(message.metric)) return;
  writeQueue = writeQueue.catch(() => {}).then(async () => {
    const { stats = { breaks: 0, claims: 0 } } = await chrome.storage.local.get('stats');
    stats[message.metric] = Math.max(0, Number(stats[message.metric]) || 0) + 1;
    await chrome.storage.local.set({ stats });
    respond({ ok: true });
  }).catch(() => respond({ ok: false }));
  return true;
});
