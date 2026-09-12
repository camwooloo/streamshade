(() => {
  'use strict';
  const defaults = globalThis.StreamshadeDefaults;
  let settings = { ...defaults };
  let root;
  let sidebar = null;
  let hoverOpened = false;
  let hoverTimer;
  let path = location.pathname;
  let cardSequence = 0;
  let lastCards = 0;
  const messageCache = new Map();
  let nodeCache = new WeakMap();
  const pausedFeatured = new WeakMap();
  const uptime = new Map();
  const boolKeys = Object.keys(defaults).filter(key => typeof defaults[key] === 'boolean' && key !== 'enabled');
  const chatSelector = '.chat-line__message, .seventv-chat-message';

  function applySettings() {
    root = document.documentElement;
    if (!root) return;
    for (const key of boolKeys) root.classList.toggle(`ss-${key}`, settings.enabled && settings[key]);
    for (const mode of ['hidden', 'dimmed', 'strikethrough', 'keep']) root.classList.toggle(`ss-deleted-${mode}`, settings.enabled && settings.deletedStyle === mode);
    if (!settings.enabled || !settings.sidebarHover) closeHover();
    if (!settings.enabled || settings.deletedStyle === 'native') {
      document.querySelectorAll('.ss-deleted-copy, .ss-deleted-note').forEach(node => node.remove());
      document.querySelectorAll('.ss-has-copy').forEach(node => node.classList.remove('ss-has-copy'));
      messageCache.clear();
      nodeCache = new WeakMap();
    }
    if (!settings.enabled || !settings.showUptime) { document.querySelectorAll('.ss-uptime').forEach(node => node.remove()); document.querySelectorAll('.ss-card-position').forEach(node => node.classList.remove('ss-card-position')); uptime.clear(); }
    // The existing bridge sends settings to both MAIN-world modules.
    window.postMessage({ source: 'streamshade:content', type: 'settings', settings }, location.origin);
    scan();
  }
  function markSections() {
    // Identify sections by their own title, never their index among followed
    // channels. Unknown/localized sections are left alone instead of guessing.
    for (const section of document.querySelectorAll('.side-nav-section, [data-a-target="side-nav-section"], [data-test-selector="stories-shelf"]')) {
      const heading = section.querySelector('h2,h3,[role="heading"],.side-nav-header');
      const title = (heading?.textContent || section.getAttribute('aria-label') || '').trim().toLowerCase();
      const type = /viewers also watch/.test(title) ? 'viewers' : /^(recommended|suggested|live) channels$/.test(title) ? 'suggested' : /recommended categories/.test(title) ? 'categories' : title === 'stories' ? 'stories' : null;
      if (type && section.dataset.streamshadeHide !== type) section.dataset.streamshadeHide = type;
    }
  }
  function markPromotions() {
    // The trial in newer Twitch headers is a button, not a /turbo link.
    // Restrict text matching to navigation controls so chat mentions stay intact.
    for (const nav of document.querySelectorAll('.top-nav, [data-a-target="top-nav-container"]')) {
      for (const control of nav.querySelectorAll('button, a, [role="button"]')) {
        const text = (control.textContent || '').replace(/\s+/g, ' ').trim();
        const label = [control.getAttribute('aria-label'), control.getAttribute('title')].filter(Boolean);
        let turboLink = false;
        try { const url = new URL(control.getAttribute('href'), location.origin); turboLink = url.origin === location.origin && url.pathname === '/turbo'; } catch {}
        const turbo = turboLink || label.some(value => /^turbo(?:\s|$)/i.test(value)) || /^try\s+(?:(?:1|one)[-\s]?month\s+)?ad[-\s]?free$/i.test(text) || /^try\s+turbo\b/i.test(text);
        if (turbo && control.dataset.streamshadePromotion !== 'turbo') control.dataset.streamshadePromotion = 'turbo';
        else if (!turbo && control.hasAttribute('data-streamshade-promotion')) control.removeAttribute('data-streamshade-promotion');
      }
    }
  }
  function sidebarCollapsed() {
    return sidebar?.classList.contains('side-nav--collapsed') || sidebar?.querySelector('[data-a-target="side-nav-expand-button"]');
  }
  function closeHover() {
    clearTimeout(hoverTimer);
    if (hoverOpened && sidebar && !sidebarCollapsed()) sidebar.querySelector('[data-a-target="side-nav-collapse-button"], [data-a-target="side-nav-arrow"]')?.click();
    hoverOpened = false;
  }
  function bindSidebar() {
    const node = document.querySelector('.side-nav');
    if (node === sidebar) return;
    closeHover(); sidebar = node;
    if (!node) return;
    node.addEventListener('pointerenter', () => {
      clearTimeout(hoverTimer);
      if (!settings.enabled || !settings.sidebarHover || !sidebarCollapsed()) return;
      const button = node.querySelector('[data-a-target="side-nav-expand-button"], [data-a-target="side-nav-arrow"]');
      if (button) { hoverOpened = true; button.click(); }
    });
    node.addEventListener('pointerleave', () => { hoverTimer = setTimeout(closeHover, 220); });
    node.addEventListener('click', event => {
      if (event.isTrusted && event.target.closest('[data-a-target="side-nav-collapse-button"], [data-a-target="side-nav-expand-button"], [data-a-target="side-nav-arrow"]')) hoverOpened = false;
    });
  }
  function moveChat() {
    if (!settings.enabled || !settings.chatOnLeft) return;
    const chat = document.querySelector('.channel-root__right-column');
    const nav = document.querySelector('.side-nav');
    const main = document.querySelector('.twilight-main');
    const row = main?.parentElement;
    if (chat && nav && row && getComputedStyle(row).display === 'flex') {
      const navColumn = [...row.children].find(node => node.contains(nav));
      const chatColumn = [...row.children].find(node => node !== main && node.contains(chat));
      if (navColumn && chatColumn && navColumn !== chatColumn) {
        row.classList.add('ss-layout-row'); main.classList.add('ss-main-column');
        navColumn.classList.add('ss-nav-column'); chatColumn.classList.add('ss-chat-column');
      }
    }
    const chatWidth = chat?.getBoundingClientRect().width || 0;
    const navWidth = nav?.getBoundingClientRect().width || 0;
    const width = chatWidth > 50 ? `${Math.round(chatWidth)}px` : '0px';
    if (root.style.getPropertyValue('--ss-chat-width') !== width) root.style.setProperty('--ss-chat-width', width);
    const sidebarWidth = `${Math.round(navWidth)}px`;
    if (root.style.getPropertyValue('--ss-sidebar-width') !== sidebarWidth) root.style.setProperty('--ss-sidebar-width', sidebarWidth);
  }
  function pauseFrontPage() {
    if (!settings.enabled || !settings.pauseFeatured || !/^\/?$/.test(location.pathname)) return;
    for (const video of document.querySelectorAll('.front-page-carousel video, [data-a-target="front-page-carousel"] video, .featured-content-carousel video')) {
      const source = video.currentSrc || video.src;
      if (pausedFeatured.get(video) !== source && !video.paused) { video.pause(); pausedFeatured.set(video, source); }
    }
  }
  function processMessage(line) {
    if (!settings.enabled || settings.deletedStyle === 'native') return;
    const id = line.getAttribute('data-id') || line.getAttribute('data-message-id') || line.getAttribute('msg-id');
    const deleted = line.classList.contains('chat-line__message--deleted') || line.getAttribute('data-deleted') === 'true' || line.querySelector('[data-a-target="chat-deleted-message-placeholder"], .chat-line__message--deleted-notice');
    if (!deleted) {
      if (line.classList.contains('ss-deleted')) line.classList.remove('ss-deleted');
      const fragments = [...line.querySelectorAll('[data-a-target="chat-message-text"], .text-fragment')].filter(node => !node.parentElement.closest('[data-a-target="chat-message-text"]'));
      const text = fragments.map(node => node.textContent).join('');
      if (text && text.length <= 5000) { nodeCache.set(line, text); if (id) messageCache.set(id, text); }
      if (messageCache.size > 500) messageCache.delete(messageCache.keys().next().value);
      return;
    }
    if (!line.classList.contains('ss-deleted')) line.classList.add('ss-deleted');
    const cached = id ? messageCache.get(id) || nodeCache.get(line) : nodeCache.get(line);
    if (cached && !line.querySelector('.ss-deleted-copy') && !line.querySelector('.text-fragment')) {
      const copy = document.createElement('span');
      copy.className = 'ss-deleted-copy'; copy.textContent = cached;
      const note = document.createElement('span'); note.className = 'ss-deleted-note'; note.textContent = '(deleted)';
      line.append(copy, note); line.classList.add('ss-has-copy');
    }
  }
  function cards() {
    if (!settings.enabled || !settings.showUptime || Date.now() - lastCards < 10000) return;
    lastCards = Date.now();
    const items = [];
    for (const card of document.querySelectorAll('[data-a-target="preview-card-image-link"], [data-a-target="preview-card-thumbnail-link"]')) {
      if (!card.getClientRects().length) continue;
      const rect = card.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) continue;
      const login = new URL(card.href, location.href).pathname.match(/^\/([\w]{1,25})\/?$/)?.[1];
      if (!login) continue;
      if (!card.dataset.streamshadeCard) card.dataset.streamshadeCard = `ss-card-${++cardSequence}`;
      card.classList.add('ss-card-position');
      items.push({ id: card.dataset.streamshadeCard, login });
      if (items.length === 8) break;
    }
    if (items.length) window.postMessage({ source: 'streamshade:content', type: 'uptime', items }, location.origin);
  }
  function drawUptime() {
    if (!settings.enabled || !settings.showUptime) return;
    for (const [id, time] of uptime) {
      const card = document.querySelector(`[data-streamshade-card="${id}"]`);
      if (!card) { uptime.delete(id); continue; }
      let badge = card.querySelector('.ss-uptime');
      if (!badge) { badge = document.createElement('span'); badge.className = 'ss-uptime'; card.appendChild(badge); }
      const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
      badge.textContent = `LIVE ${Math.floor(seconds / 3600)}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
      badge.title = 'Stream uptime';
    }
  }
  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin || event.data?.source !== 'streamshade:cards' || !Array.isArray(event.data.items)) return;
    for (const item of event.data.items.slice(0, 8)) if (/^ss-card-\d+$/.test(item.id) && Number.isFinite(item.time) && item.time > 0 && item.time <= Date.now()) uptime.set(item.id, item.time);
    drawUptime();
  });
  function scan() {
    if (!document.documentElement) return;
    if (path !== location.pathname) { path = location.pathname; messageCache.clear(); uptime.clear(); lastCards = 0; closeHover(); }
    markSections(); markPromotions(); bindSidebar(); moveChat(); pauseFrontPage(); cards();
    for (const line of document.querySelectorAll(chatSelector)) processMessage(line);
  }
  const observer = new MutationObserver(records => {
    // Cache newly arrived chat text before a future moderation mutation can
    // replace it. No chat messages are saved to extension storage.
    for (const record of records) {
      const parent = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      const line = parent?.closest(chatSelector);
      if (line) processMessage(line);
      for (const node of record.addedNodes) if (node.nodeType === 1) {
        if (node.matches(chatSelector)) processMessage(node);
        for (const child of node.querySelectorAll(chatSelector)) processMessage(child);
      }
    }
  });
  function start() {
    applySettings();
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['data-deleted'] });
    setInterval(() => { scan(); drawUptime(); }, 1000);
    document.addEventListener('play', pauseFrontPage, true);
  }
  chrome.storage.local.get('settings').then(({ settings: value }) => { settings = { ...defaults, ...value }; if (document.documentElement) start(); else document.addEventListener('DOMContentLoaded', start, { once: true }); });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings) { settings = { ...defaults, ...changes.settings.newValue }; lastCards = 0; applySettings(); }
  });
})();
