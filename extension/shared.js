export const DEFAULTS = Object.freeze({
  enabled: true, mode: 'adaptive', autoClaim: false, showIndicator: true, muteFallback: true,
  alternatingChat: true, hideChatScrollbar: true, showUptime: false,
  hideStories: true, hideViewersAlsoWatch: true, hideSuggestedChannels: true, hideRecommendedCategories: true,
  chatOnLeft: false, deletedStyle: 'dimmed', pauseFeatured: true,
  hideBits: false, hidePrime: false, hideTurbo: true, sidebarHover: false
});
export const MODES = ['swap', 'adaptive', 'mute'];
export function sanitizeSettings(input = {}) {
  return Object.fromEntries(Object.entries(DEFAULTS).map(([key, value]) => [key,
    key === 'mode' ? (MODES.includes(input[key]) ? input[key] : value) : key === 'deletedStyle' ? (['native', 'hidden', 'dimmed', 'strikethrough', 'keep'].includes(input[key]) ? input[key] : value) : (typeof input[key] === 'boolean' ? input[key] : value)
  ]));
}
