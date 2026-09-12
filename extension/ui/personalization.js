export function personalization(toggle, icon) {
  const group = (id, label, title, content) => `<section class="extras-panel personalization-panel" id="${id}"><div class="section-heading"><div><span class="eyebrow">${label}</span><h2>${title}</h2></div></div><div class="settings-list">${content}</div></section>`;
  return group('chat', 'CHAT / THE WAY YOU LIKE IT', 'A nicer place to hang out.',
    toggle('alternatingChat', 'Alternating message backgrounds', 'Subtle stripes make busy conversations easier to follow.', 'wave') +
    toggle('hideChatScrollbar', 'Hide the chat scrollbar', 'A cleaner chat column. Scrolling still works normally.', 'sliders') +
    toggle('chatOnLeft', 'Move chat to the left', 'Put chat left of the player and the channel sidebar on the right.', 'screen') +
    `<label class="setting-row select-row" for="deletedStyle"><span class="setting-icon">${icon('sliders')}</span><span class="setting-copy"><strong>Deleted message style</strong><span>Style messages already received in this tab. Earlier deletions cannot be recovered.</span></span><select id="deletedStyle" data-setting="deletedStyle" aria-label="Deleted message style"><option value="native">Twitch default</option><option value="hidden">Hidden</option><option value="dimmed">Dimmed</option><option value="strikethrough">Strikethrough</option><option value="keep">Keep visible</option></select></label>`
  ) + group('sidebar', 'SIDEBAR / LESS DISTRACTION', 'Just your kind of channels.',
    toggle('sidebarHover', 'Expand channel list on hover', 'Temporarily open a collapsed sidebar. It closes when you leave.', 'arrow') +
    toggle('hideStories', 'Hide Stories', 'Remove Stories from the sidebar and Following page.', 'screen') +
    toggle('hideViewersAlsoWatch', 'Hide “Viewers Also Watch”', 'Clear the extra recommendations from the sidebar.', 'screen') +
    toggle('hideSuggestedChannels', 'Hide suggested live channels', 'Keep the sidebar focused on channels you follow.', 'screen') +
    toggle('hideRecommendedCategories', 'Hide recommended categories', 'Remove category suggestions from the sidebar.', 'screen')
  ) + group('browsing', 'BROWSING / A QUIETER TWITCH', 'Keep the good bits.',
    toggle('showUptime', 'Show uptime on stream preview cards', 'See how long a stream has been live. Uses Twitch start-time data when available.', 'wave') +
    toggle('pauseFeatured', 'Pause front-page featured streams', 'Stop carousel autoplay on the home page. You can still press play.', 'sound') +
    toggle('hideBits', 'Hide Bits buying', 'Remove Get Bits purchase buttons from the top navigation.', 'spark') +
    toggle('hidePrime', 'Hide the Prime crown', 'Remove Prime offers from the top navigation.', 'shield') +
    toggle('hideTurbo', 'Hide Turbo promotions', 'Remove the top-bar Turbo trial and upsell prompts.', 'bolt')
  );
}
