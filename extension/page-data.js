// Narrow MAIN-world bridge for stream-card start times. No account data leaves
// this page and the extension never stores channel or message history.
(() => {
  let enabled = false;
  let fetching = false;
  const cache = new Map();
  const pageFetch = window.fetch.bind(window);
  const headers = { 'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko' };
  window.fetch = function(input, init) {
    try {
      const url = new URL(typeof input === 'string' || input instanceof URL ? String(input) : input.url, location.href);
      if (url.origin === 'https://gql.twitch.tv') {
        const source = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
        for (const key of ['Client-ID', 'Client-Version', 'Client-Session-Id', 'Client-Integrity', 'X-Device-Id', 'Authorization']) if (source.has(key)) headers[key] = source.get(key);
      }
    } catch {}
    return pageFetch(input, init);
  };
  function reactStart(card) {
    const key = Object.keys(card).find(key => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$'));
    let fiber = key ? card[key] : null;
    for (let i = 0; fiber && i < 15; i++, fiber = fiber.return) {
      const props = fiber.memoizedProps;
      const stream = props?.stream || props?.channel?.stream || props?.data?.stream || props?.user?.stream;
      const time = Date.parse(stream?.createdAt || stream?.startedAt || '');
      if (Number.isFinite(time) && time <= Date.now()) return time;
    }
    return null;
  }
  window.addEventListener('message', async event => {
    if (event.source !== window || event.origin !== location.origin || event.data?.source !== 'streamshade:content') return;
    if (event.data.type === 'settings') { enabled = event.data.settings?.enabled === true && event.data.settings?.showUptime === true; return; }
    if (!enabled || event.data.type !== 'uptime' || !Array.isArray(event.data.items) || fetching) return;
    fetching = true;
    try {
      const items = event.data.items.slice(0, 8).filter(item => /^ss-card-\d+$/.test(item.id) && /^[a-zA-Z0-9_]{1,25}$/.test(item.login));
      const missing = [];
      for (const item of items) {
        const card = document.querySelector(`[data-streamshade-card="${item.id}"]`);
        const time = card && reactStart(card);
        if (time) cache.set(item.login, { time, until: Date.now() + 60000 });
        if (!cache.has(item.login) || cache.get(item.login).until < Date.now()) missing.push(item);
      }
      if (missing.length) {
        try {
          const response = await pageFetch('https://gql.twitch.tv/gql', {
            method: 'POST', headers, signal: AbortSignal.timeout(6000),
            body: JSON.stringify(missing.map(item => ({ operationName: 'StreamshadeUptime', query: 'query StreamshadeUptime($login: String!) { user(login: $login) { stream { createdAt } } }', variables: { login: item.login } })))
          });
          const data = response.ok ? await response.json() : [];
          missing.forEach((item, i) => {
            const value = Date.parse(data[i]?.data?.user?.stream?.createdAt || '');
            const time = Number.isFinite(value) && value <= Date.now() ? value : null;
            cache.set(item.login, { time, until: Date.now() + (time ? 60000 : 300000) });
          });
        } catch { missing.forEach(item => cache.set(item.login, { time: null, until: Date.now() + 300000 })); }
      }
      if (cache.size > 250) for (const key of [...cache.keys()].slice(0, 125)) cache.delete(key);
      if (enabled) window.postMessage({ source: 'streamshade:cards', items: items.map(item => ({ id: item.id, time: cache.get(item.login)?.time || null })) }, location.origin);
    } finally { fetching = false; }
  });
})();
