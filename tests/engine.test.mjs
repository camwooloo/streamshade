import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { sanitizeSettings, DEFAULTS } from '../extension/shared.js';

const source = await readFile('extension/engine/vaft.js', 'utf8');
const masterUrl = 'https://usher.ttvnw.net/api/channel/hls/tester.m3u8?token=original';
const mediaUrl = 'https://video-edge.ttvnw.net/live.m3u8';
const master = '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=6000000,RESOLUTION=1920x1080,FRAME-RATE=60,CODECS="avc1.64002A,mp4a.40.2"\nhttps://video-edge.ttvnw.net/1080.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=700000,RESOLUTION=640x360,FRAME-RATE=30,CODECS="avc1.64001f,mp4a.40.2"\nhttps://video-edge.ttvnw.net/360.m3u8';
const ad = '#EXTM3U\n#EXT-X-DATERANGE:ID="stitched-ad",CLASS="twitch-stitched-ad",X-TV-TWITCH-AD-POD-POSITION="MIDROLL"\n#EXTINF:2.0,ad\nhttps://video-edge.ttvnw.net/ad.ts';
const clean = '#EXTM3U\n#EXTINF:2.0,live\nhttps://video-edge.ttvnw.net/live.ts';

function engine(mode = 'adaptive', muteFallback = true) {
  const events = [];
  const ctx = vm.createContext({ console: { log() {}, error() {} }, URL, Headers, Request, Response, AbortSignal, Map, setTimeout() {}, clearTimeout() {}, fetch: async () => new Response(''), document: { location: { hostname: 'www.twitch.tv' } }, location: { origin: 'https://www.twitch.tv' }, postMessage: event => events.push(event) });
  ctx.window = ctx;
  const instrumented = source.slice(0, source.indexOf('    declareOptions(window);')) + `
    declareOptions(window);
    applyStreamshadeSettings(window, { enabled: true, mode: '${mode}', muteFallback: ${muteFallback} });
    globalThis.api = { getStreamUrlForResolution, parseAttributes, getServerTimeFromM3u8, processM3U8, hookWorkerFetch, applyStreamshadeSettings, stripAdSegments, setToken(fn) { getAccessToken = fn; } };
  })();`;
  vm.runInContext(instrumented, ctx);
  const info = { ChannelName: 'tester', UsherParams: '?token=original', LastPlayerReload: 0, EncodingsM3U8: master, Urls: { [mediaUrl]: { Resolution: '1920x1080', FrameRate: 60, Codecs: 'avc1.64002A' } }, BackupEncodingsM3U8Cache: [], RequestedAds: new Set(), NumStrippedAdSegments: 0 };
  ctx.StreamInfosByUrl[mediaUrl] = info;
  return { ctx, events, info, api: ctx.api };
}

test('settings accept known values and reject malformed or extra input', () => {
  assert.deepEqual(sanitizeSettings({ enabled: 'yes', mode: 'proxy', autoClaim: true, endpoint: 'https://example.com' }), { ...DEFAULTS, autoClaim: true });
  assert.equal(DEFAULTS.mode, 'adaptive');
});
test('VAFT parser preserves quoted codec commas and chooses requested 1080p', () => {
  const { api } = engine();
  assert.equal(api.parseAttributes('CODECS="avc1.64002A,mp4a.40.2",RESOLUTION=1920x1080').CODECS, 'avc1.64002A,mp4a.40.2');
  assert.match(api.getStreamUrlForResolution(master, { Resolution: '1920x1080', FrameRate: 60 }), /1080/);
});
test('low-bandwidth targets 360p even when normal stream is 1080p', () => {
  const { api } = engine('swap');
  assert.match(api.getStreamUrlForResolution(master, { Resolution: '1920x1080', FrameRate: 60 }), /360/);
});
test('missing server-time tags do not crash either Twitch API parser', () => {
  const { api, ctx } = engine();
  assert.equal(api.getServerTimeFromM3u8('#EXTM3U'), null);
  ctx.V2API = true;
  assert.equal(api.getServerTimeFromM3u8('#EXTM3U'), null);
});
for (const mode of ['adaptive', 'swap']) test(`${mode}: a clean fallback replaces the ad playlist, then returns to normal`, async () => {
  const { api, events, info } = engine(mode);
  const requests = [];
  api.setToken(async (_, playerType) => { requests.push(playerType); return new Response(JSON.stringify({ data: { streamPlaybackAccessToken: { signature: 'test', value: 'token' } } })); });
  const network = async url => new Response(String(url).includes('usher.') ? master : clean);
  assert.equal(await api.processM3U8(mediaUrl, ad, network), clean);
  assert.equal(requests[0], mode === 'adaptive' ? 'embed' : 'autoplay');
  assert.equal(events.at(-1).isReplacing, true);
  assert.equal(events.at(-1).quality, mode === 'adaptive' ? '1080p' : '360p');
  assert.equal(await api.processM3U8(mediaUrl, clean, network), clean);
  assert.equal(info.IsShowingAd, false);
});
test('adaptive probes embed, popout, autoplay when clean backups are unavailable', async () => {
  const { api, events } = engine();
  const requests = [];
  api.setToken(async (_, type) => { requests.push(type); return new Response('', { status: 403 }); });
  assert.equal(await api.processM3U8(mediaUrl, ad, async () => new Response('')), ad);
  assert.deepEqual(requests, ['embed', 'popout', 'autoplay']);
  assert.equal(events.at(-1).isReplacing, false);
});
test('mute mode emits detection but never requests fallback streams', async () => {
  const { api, events } = engine('mute');
  api.setToken(() => { throw new Error('Unexpected fallback'); });
  assert.equal(await api.processM3U8(mediaUrl, ad, () => { throw new Error('Unexpected fetch'); }), ad);
  assert.equal(events.at(-1).isMuteOnly, true);
});
test('disabling protection returns ads unmodified without probing', async () => {
  const { api, ctx } = engine();
  api.applyStreamshadeSettings(ctx, { enabled: false, mode: 'adaptive', muteFallback: true });
  assert.equal(await api.processM3U8(mediaUrl, ad, () => { throw new Error('Unexpected fetch'); }), ad);
});
test('disabled hook preserves the exact Request object and response', async () => {
  const { api, ctx } = engine();
  const request = new Request(mediaUrl, { headers: { 'X-Test': 'preserved' } });
  const response = new Response(clean);
  ctx.fetch = async input => { assert.equal(input, request); return response; };
  api.applyStreamshadeSettings(ctx, { enabled: false, mode: 'adaptive' });
  api.hookWorkerFetch();
  assert.equal(await ctx.fetch(request), response);
});
test('manifest uses MV3, Twitch-only content scripts, and no broad API permissions', async () => {
  const manifest = JSON.parse(await readFile('extension/manifest.json', 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.ok(manifest.content_scripts.every(script => script.matches.every(match => /^https:\/\/(www|m|player)\.twitch\.tv\//.test(match))));
  assert.equal(manifest.content_scripts[0].world, 'MAIN');
  assert.doesNotMatch(source, /\beval\s*\(|new Function\s*\(/);
});
