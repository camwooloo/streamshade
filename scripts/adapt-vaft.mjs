// Reproducible integration of the pinned MIT-licensed upstream source.
// This script runs ONLY during development/build, never in the extension.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
let code = (await readFile('reference/vaft.js', 'utf8')).replaceAll('\r\n', '\n');
function replace(from, to) {
  if (!code.includes(from)) throw new Error(`Upstream integration anchor missing: ${from.slice(0, 100)}`);
  code = code.replace(from, to);
}
function replaceSection(start, end, value) {
  const a = code.indexOf(start), b = code.indexOf(end, a);
  if (a < 0 || b < 0) throw new Error(`Upstream section missing: ${start}`);
  code = code.slice(0, a) + value + code.slice(b);
}
replace('twitch-videoad.js text/javascript\n', '// Adapted from TwitchAdSolutions VAFT v24. See THIRD_PARTY_NOTICES.md.\n');
replace("    const ourTwitchAdSolutionsVersion", `    let streamshadeSettings = { enabled: false, mode: 'adaptive', muteFallback: true };
    let lastStreamshadeStatus = { state: 'ready' };
    function sendStatus(data) {
        lastStreamshadeStatus = data;
        window.postMessage({ source: 'streamshade:engine', type: 'playback', ...data }, location.origin);
    }
    function applyStreamshadeSettings(scope, value) {
        scope.StreamshadeEnabled = value.enabled === true;
        scope.StreamshadeMode = value.mode;
        scope.BackupPlayerTypes = value.mode === 'swap' ? ['autoplay', 'embed', 'popout'] : ['embed', 'popout', 'autoplay'];
        scope.ForceAccessTokenPlayerType = value.enabled && value.mode !== 'mute' ? 'popout' : null;
        scope.IsAdStrippingEnabled = value.muteFallback === false;
        scope.PlayerReloadMinimalRequestsPlayerIndex = value.mode === 'swap' ? 0 : 2;
        scope.PlayerReloadMinimalRequestsTime = value.mode === 'adaptive' ? 0 : 1500;
        if (scope.StreamInfos) for (const info of Object.values(scope.StreamInfos)) {
            info.BackupEncodingsM3U8Cache = [];
        }
    }
    const ourTwitchAdSolutionsVersion`);
replace('        console.log("skipping vaft', '        sendStatus({ state: "conflict" });\n        console.log("skipping vaft');
replace("        scope.AdSignifier = 'stitched';", "        scope.StreamshadeEnabled = false;\n        scope.StreamshadeMode = 'adaptive';\n        scope.LastBackupQuality = null;\n        scope.AdSignifier = 'stitched';");
// Keep other extensions' worker prototypes intact; detect conflicts in the UI.
replaceSection('    const workerStringConflicts = [', '    function hookWindowWorker() {', '');
replace("        const reinsert = getWorkersForReinsert(window.Worker);\n        const newWorker = class Worker extends getCleanWorker(window.Worker) {", "        const OriginalWorker = window.Worker;\n        const newWorker = class Worker extends OriginalWorker {");
replace("                    isTwitchWorker = new URL(twitchBlobUrl).origin.endsWith('.twitch.tv');", "                    const workerUrl = new URL(String(twitchBlobUrl), location.href);\n                    isTwitchWorker = workerUrl.protocol === 'blob:' && workerUrl.origin === location.origin && options?.type !== 'module';");
replace('                if (!isTwitchWorker) {', "                if (options?.type === 'module') sendStatus({ state: 'unsupported' });\n                if (!isTwitchWorker) {");
replace('                    ${getWasmWorkerJs.toString()}', '                    ${applyStreamshadeSettings.toString()}');
replace("                    const workerString = getWasmWorkerJs('${twitchBlobUrl.replaceAll(\"'\", \"%27\")}');", '');
replace('                    declareOptions(self);', '                    declareOptions(self);\n                    applyStreamshadeSettings(self, ${JSON.stringify(streamshadeSettings)});');
replace("                        if (e.data.key == 'UpdateClientVersion') {", "                        if (e.data?.key === 'StreamshadeSettings') {\n                            applyStreamshadeSettings(self, e.data.value);\n                        } else if (e.data?.key == 'UpdateClientVersion') {");
// Header interpolation must use JSON string literals, never quote concatenation.
for (const key of ['GQLDeviceID', 'AuthorizationHeader', 'ClientIntegrityHeader', 'ClientVersion', 'ClientSession']) {
  const pattern = new RegExp(`                    ${key} = \\$\\{[^\\n]+\\};`);
  if (!pattern.test(code)) throw new Error(`Missing header ${key}`);
  code = code.replace(pattern, `                    ${key} = \${JSON.stringify(${key} ?? null)};`);
}
replace('                    eval(workerString);', '                    importScripts(${JSON.stringify(String(twitchBlobUrl))});');
replace('                super(URL.createObjectURL(new Blob([newBlobStr])), options);', `                const wrapperUrl = URL.createObjectURL(new Blob([newBlobStr], { type: 'text/javascript' }));
                super(wrapperUrl, options);
                setTimeout(() => URL.revokeObjectURL(wrapperUrl), 30000);
                this.addEventListener('error', () => sendStatus({ state: 'error' }));`);
replace("                twitchWorkers.push(this);", "                twitchWorkers.push(this);");
replaceSection('        let workerInstance = reinsertWorkers(newWorker, reinsert);', '    function hookWorkerFetch() {', `        window.Worker = newWorker;
    }
`);
replace('        };\n        window.Worker = newWorker;', `            terminate() {
                const index = twitchWorkers.indexOf(this);
                if (index >= 0) twitchWorkers.splice(index, 1);
                return super.terminate();
            }
        };
        window.Worker = newWorker;`);
code = code.replaceAll('e.data.key', 'e.data?.key');
replace('        fetch = async function(url, options) {', `        fetch = async function(url, options) {
            if (!StreamshadeEnabled) return realFetch.apply(this, arguments);
            if (url instanceof URL) url = url.href;
            // Twitch currently uses strings. Request objects pass through intact.
            if (typeof url === 'string') {
                let parsed;
                try { parsed = new URL(url); } catch { return realFetch.apply(this, arguments); }
                if (parsed.protocol !== 'https:' || !/(^|\\.)(ttvnw\\.net|twitch\\.tv)$/.test(parsed.hostname)) return realFetch.apply(this, arguments);
            }`);
// Match query-bearing media URLs while letting master URLs reach their branch.
replace("if (url.endsWith('m3u8'))", "if (new URL(url).pathname.endsWith('.m3u8') && !url.includes('/channel/hls/'))");
code = code.replaceAll('processAfter(response);', 'processAfter(response).catch(reject);');
code = code.replaceAll('matches.length > 1', 'matches && matches.length > 1');
replace("            'Authorization': AuthorizationHeader,", "            ...(AuthorizationHeader && { 'Authorization': AuthorizationHeader }),");
replace('    function getStreamUrlForResolution(encodingsM3u8, resolutionInfo) {', `    function getStreamUrlForResolution(encodingsM3u8, resolutionInfo) {
        if (StreamshadeMode === 'swap') resolutionInfo = { ...resolutionInfo, Resolution: '640x360' };`);
replace('        return closestResolutionUrl;', `        const selected = matchedResolutionUrl || closestResolutionUrl;
        const index = encodingsLines.indexOf(selected);
        LastBackupQuality = index > 0 ? parseAttributes(encodingsLines[index - 1])['RESOLUTION']?.split('x')[1] + 'p' : null;
        return selected;`);
replace('                            return matchedResolutionUrl;', "                            LastBackupQuality = resolution.split('x')[1] + 'p';\n                            return matchedResolutionUrl;");
replace('    async function processM3U8(url, textStr, realFetch) {', `    async function processM3U8(url, textStr, realFetch) {
        const originalText = textStr;
        if (!StreamshadeEnabled) return textStr;`);
replace("        const haveAdTags = textStr.includes(AdSignifier) || SimulatedAdsDepth > 0;", `        const haveAdTags = textStr.includes(AdSignifier) || SimulatedAdsDepth > 0;
        if (StreamshadeMode === 'mute') {
            postMessage({ key: 'UpdateAdBlockBanner', hasAds: haveAdTags, isMuteOnly: true });
            return textStr;
        }
        streamInfo.IsReplacing = false;`);
replace('            if (backupM3u8) {\n                textStr = backupM3u8;', `            if (!StreamshadeEnabled || StreamshadeMode === 'mute') return originalText;
            if (backupM3u8) {
                streamInfo.IsReplacing = !backupM3u8.includes(AdSignifier);
                textStr = backupM3u8;`);
replace('            numStrippedAdSegments: streamInfo.NumStrippedAdSegments', '            numStrippedAdSegments: streamInfo.NumStrippedAdSegments,\n            isReplacing: streamInfo.IsReplacing,\n            quality: LastBackupQuality');
replace('    function monitorPlayerBuffering() {', `    function monitorPlayerBuffering() {
        if (!StreamshadeEnabled || StreamshadeMode === 'mute') { setTimeout(monitorPlayerBuffering, 1000); return; }`);
replaceSection('    function updateAdblockBanner(data) {', '    function getPlayerAndState() {', `    function updateAdblockBanner(data) {
        isActivelyStrippingAds = data.isStrippingAdSegments;
        sendStatus({
            state: !StreamshadeEnabled ? 'disabled' : !data.hasAds ? 'watching' : data.isMuteOnly ? 'muting' : data.isReplacing ? 'replacing' : data.isStrippingAdSegments ? 'waiting' : data.isReplacing === false ? 'unavailable' : 'searching',
            quality: data.quality || null
        });
    }
`);
replace('    function doTwitchPlayerTask(isPausePlay, isReload) {', '    function doTwitchPlayerTask(isPausePlay, isReload) {\n        if (!StreamshadeEnabled || StreamshadeMode === \'mute\') return;');
replace('            const response = await window.realFetch(fetchRequest.url, fetchRequest.options);', `            if (fetchRequest.url !== 'https://gql.twitch.tv/gql' || fetchRequest.options?.method !== 'POST') throw new Error('Unexpected worker request');
            const response = await nativePageFetch(fetchRequest.url, { ...fetchRequest.options, signal: AbortSignal.timeout(6500) });`);
replaceSection('    function hookFetch() {', '    function onContentLoaded() {', `    const nativePageFetch = window.fetch.bind(window);
    function hookFetch() {
        window.fetch = function(input, init) {
            try {
                const url = new URL(typeof input === 'string' || input instanceof URL ? String(input) : input.url, location.href);
                if (url.origin === 'https://gql.twitch.tv') {
                    const requestHeaders = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
                    const headerMap = [['Client-ID','UpdateClientId'], ['X-Device-Id','UpdateDeviceId'], ['Client-Version','UpdateClientVersion'], ['Client-Session-Id','UpdateClientSession'], ['Client-Integrity','UpdateClientIntegrityHeader'], ['Authorization','UpdateAuthorizationHeader']];
                    for (const [name, key] of headerMap) {
                        if (!requestHeaders.has(name)) continue;
                        const value = requestHeaders.get(name);
                        if (name === 'Client-ID') ClientID = value;
                        if (name === 'X-Device-Id') GQLDeviceID = value;
                        if (name === 'Client-Version') ClientVersion = value;
                        if (name === 'Client-Session-Id') ClientSession = value;
                        if (name === 'Client-Integrity') ClientIntegrityHeader = value;
                        if (name === 'Authorization') AuthorizationHeader = value;
                        postTwitchWorkerMessage(key, value);
                    }
                    if (StreamshadeEnabled && ForceAccessTokenPlayerType && typeof init?.body === 'string' && init.body.includes('PlaybackAccessToken')) {
                        const body = JSON.parse(init.body);
                        for (const item of Array.isArray(body) ? body : [body]) {
                            if (item?.variables?.playerType) item.variables.playerType = ForceAccessTokenPlayerType;
                        }
                        init = { ...init, body: JSON.stringify(body) };
                    }
                }
            } catch { /* Preserve the original request if parsing fails. */ }
            return nativePageFetch(input, init);
        };
    }
`);
// Do not override document visibility or Twitch's localStorage methods.
replaceSection('    function onContentLoaded() {', '    declareOptions(window);', '');
replaceSection('    if (document.readyState ===', '})();', `    window.addEventListener('message', event => {
        if (event.source !== window || event.origin !== location.origin || event.data?.source !== 'streamshade:content') return;
        if (event.data.type === 'settings') {
            const value = event.data.settings;
            if (!value || typeof value.enabled !== 'boolean' || !['adaptive', 'swap', 'mute'].includes(value.mode)) return;
            const nextSettings = { enabled: value.enabled, mode: value.mode, muteFallback: value.muteFallback === true };
            if (JSON.stringify(nextSettings) === JSON.stringify(streamshadeSettings)) return;
            streamshadeSettings = nextSettings;
            applyStreamshadeSettings(window, streamshadeSettings);
            postTwitchWorkerMessage('StreamshadeSettings', streamshadeSettings);
            sendStatus({ state: value.enabled ? 'ready' : 'disabled' });
        }
        if (event.data.type === 'ping') sendStatus(lastStreamshadeStatus);
    });
    window.postMessage({ source: 'streamshade:engine', type: 'hello' }, location.origin);
`);
await mkdir('extension/engine', { recursive: true });
await writeFile('extension/engine/vaft.js', code);
console.log('Adapted pinned VAFT source.');
