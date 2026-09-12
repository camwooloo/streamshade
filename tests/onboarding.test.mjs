import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { sanitizeSettings, DEFAULTS } from '../extension/shared.js';
const source = (await readFile('extension/background.js', 'utf8')).replace(/^import .*?;\s*/, '');
function background(initial = {}) {
  const data = structuredClone(initial); const tabs = []; let installed;
  const chrome = { storage: { local: { async get() { return structuredClone(data); }, async set(patch) { Object.assign(data, structuredClone(patch)); } } }, tabs: { async create(value) { tabs.push(value); } }, runtime: { getURL: path => `chrome-extension://fixture/${path}`, onInstalled: { addListener(fn) { installed = fn; } }, onMessage: { addListener() {} } } };
  vm.runInNewContext(source, { chrome, sanitizeSettings, Date, Promise });
  return { data, tabs, install: details => installed(details) };
}
test('first installation saves defaults then opens onboarding once', async () => {
  const bg = background(); await bg.install({ reason: 'install' });
  assert.deepEqual(bg.data.settings, DEFAULTS); assert.equal(bg.data.settings.hideTurbo, true);
  assert.equal(bg.tabs.length, 1); assert.match(bg.tabs[0].url, /ui\/welcome.html$/);
  await bg.install({ reason: 'update' }); assert.equal(bg.tabs.length, 1);
});
test('legacy update offers setup without overwriting explicit settings or counters', async () => {
  const bg = background({ settings: { enabled: false, hideTurbo: false, mode: 'mute' }, stats: { breaks: 10, claims: 3 } });
  await bg.install({ reason: 'update' }); assert.equal(bg.tabs.length, 1);
  assert.equal(bg.data.settings.enabled, false); assert.equal(bg.data.settings.hideTurbo, false);
  assert.deepEqual(bg.data.stats, { breaks: 10, claims: 3 });
});
test('completed setup never reopens on routine extension or browser updates', async () => {
  const bg = background({ onboarding: { completedAt: 123 }, settings: { autoClaim: true } });
  await bg.install({ reason: 'update' }); await bg.install({ reason: 'chrome_update' });
  assert.equal(bg.tabs.length, 0); assert.equal(bg.data.settings.autoClaim, true);
});
