(() => {
  'use strict';
  const defaults = globalThis.StreamshadeDefaults;
  let settings = { ...defaults };
  let status = { state: 'connecting' };
  let lastStatusTime = 0;
  let wasAd = false;
  let channelPath = location.pathname;
  let indicator;
  let label;
  let mutedVideo = null;
  let userOverrodeMute = false;
  let pendingClaim = null;
  const attemptedButtons = new WeakSet();
  const adStates = ['searching', 'replacing', 'muting', 'unavailable', 'waiting'];
  function sendSettings() { window.postMessage({ source: 'streamshade:content', type: 'settings', settings }, location.origin); }
  function metric(name) { chrome.runtime.sendMessage({ type: 'metric', metric: name }).catch(() => {}); }
  function restoreMute() {
    if (mutedVideo) {
      mutedVideo.removeEventListener('volumechange', onVolumeChange);
      if (!userOverrodeMute && mutedVideo.muted) mutedVideo.muted = false;
      mutedVideo = null;
    }
    userOverrodeMute = false;
  }
  function onVolumeChange() { if (mutedVideo && !mutedVideo.muted) userOverrodeMute = true; }
  function manageMute(active) {
    const video = document.querySelector('video');
    if (!active || mutedVideo && mutedVideo !== video) restoreMute();
    if (!active || !video || mutedVideo || video.muted) return;
    mutedVideo = video;
    video.muted = true;
    video.addEventListener('volumechange', onVolumeChange);
  }
  function visibleAd() {
    return [...document.querySelectorAll('[data-a-target="video-ad-label"], [data-a-target="video-ad-countdown"], [data-test-selector="ad-banner-default-text"]')]
      .some(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden');
  }
  function updateView() {
    const fresh = Date.now() - lastStatusTime < 18000;
    const engineAd = fresh && adStates.includes(status.state);
    const domAd = visibleAd();
    const replacing = fresh && status.state === 'replacing';
    const active = settings.enabled && (engineAd || domAd);
    if (active && !wasAd) metric('breaks');
    wasAd = active;
    manageMute(active && !replacing && (settings.mode === 'mute' || settings.muteFallback));
    if (!indicator && document.body) {
      indicator = document.createElement('div');
      indicator.id = 'streamshade-status';
      const shadow = indicator.attachShadow({ mode: 'closed' });
      const style = document.createElement('style');
      style.textContent = ':host{position:absolute;top:16px;left:16px;z-index:50;pointer-events:none}span{display:block;padding:8px 12px;border:1px solid #b9f6cf38;border-radius:8px;background:#111d20eb;color:#c5f6d7;font:500 12px/1.3 system-ui;box-shadow:0 3px 15px #0003}';
      label = document.createElement('span');
      label.setAttribute('role', 'status');
      shadow.append(style, label);
    }
    if (indicator) {
      const root = document.querySelector('[data-a-target="video-player"], .video-player');
      if (root && indicator.parentElement !== root) root.appendChild(indicator);
      indicator.style.display = active && settings.showIndicator ? '' : 'none';
      label.textContent = replacing ? `Streamshade · live at ${status.quality || 'backup quality'}` : settings.mode === 'mute' ? 'Streamshade · ad muted' : status.state === 'searching' ? 'Streamshade · finding a clean stream' : status.state === 'waiting' ? 'Streamshade · waiting for a clean stream' : settings.muteFallback ? 'Streamshade · backup unavailable · ad muted' : 'Streamshade · backup unavailable';
    }
  }
  function claimBonus() {
    if (pendingClaim) {
      if (!pendingClaim.button.isConnected) { metric('claims'); pendingClaim = null; }
      else if (Date.now() - pendingClaim.time > 8000) pendingClaim = null;
      return;
    }
    if (!settings.enabled || !settings.autoClaim) return;
    const button = document.querySelector('[data-test-selector="community-points-summary"] [data-test-selector="claimable-bonus__icon"]')?.closest('button')
      || document.querySelector('[data-test-selector="claimable-bonus__icon"]')?.closest('button');
    if (!button || button.disabled || attemptedButtons.has(button) || !button.getClientRects().length) return;
    attemptedButtons.add(button);
    pendingClaim = { button, time: Date.now() };
    button.click();
  }
  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin || event.data?.source !== 'streamshade:engine') return;
    if (event.data.type === 'hello') { sendSettings(); return; }
    const states = ['ready', 'watching', 'searching', 'replacing', 'muting', 'unavailable', 'waiting', 'error', 'disabled', 'unsupported', 'conflict'];
    if (event.data.type !== 'playback' || !states.includes(event.data.state)) return;
    status = { state: event.data.state, quality: /^\d{2,4}p$/.test(event.data.quality) ? event.data.quality : null };
    lastStatusTime = Date.now();
    updateView();
  });
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message?.type === 'status') respond({ ...status, engineSeen: lastStatusTime > 0, fresh: Date.now() - lastStatusTime < 18000, settings });
  });
  chrome.storage.local.get('settings').then(result => {
    settings = { ...defaults, ...result.settings };
    sendSettings();
    window.postMessage({ source: 'streamshade:content', type: 'ping' }, location.origin);
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings) {
      settings = { ...defaults, ...changes.settings.newValue };
      sendSettings();
      updateView();
    }
  });
  // A bounded poll survives Twitch's SPA navigation and replaced React roots.
  setInterval(() => {
    if (location.pathname !== channelPath) {
      channelPath = location.pathname;
      lastStatusTime = 0;
      status = { state: 'ready' };
      wasAd = false;
      pendingClaim = null;
      restoreMute();
    }
    updateView();
    claimBonus();
  }, 1000);
  window.addEventListener('pagehide', restoreMute);
})();
