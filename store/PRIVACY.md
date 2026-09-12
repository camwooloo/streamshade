# Streamshade privacy policy — draft

Before publication, replace the two fields below and host the completed text publicly over HTTPS.

Publisher: **[Your publisher name]**

Privacy contact: **[Your contact email or support URL]**

Applies to Streamshade version 0.2.0. Last updated: 12 September 2026.

## What Streamshade processes

Streamshade runs on supported Twitch pages to provide the features you enable. It processes Twitch playback playlists, stream URLs, playback tokens, and existing Twitch authorization/device/session headers to request alternative playback. Those values remain in page/worker memory and are sent only to Twitch's playback services as required for that feature. Streamshade does not ask for your Twitch password.

Optional uptime display reads visible stream-card metadata or requests stream start times from Twitch using the channel login. Channel identifiers and start times are cached temporarily in page memory.

Deleted-message display temporarily caches already-received chat text in the current tab. The cache is bounded and is not written to persistent storage. It cannot retrieve text deleted before the tab received it. Closing the tab discards this memory; disabling the feature clears its retained display/cache.

Automatic bonus claiming, when enabled, clicks the available Twitch channel-point bonus button. It does not purchase Bits, redeem rewards, or spend points.

## What is stored locally

The extension stores preferences, first-run setup timestamps/completion, and aggregate counts of detected ad breaks and observed bonus claims in this browser's extension storage. It does not store a history of visited channels, chat messages, session headers, passwords, or playback tokens there.

## Sharing and network requests

Streamshade has no analytics endpoint, advertising service, external proxy, or publisher-operated data backend. It does not sell user data or use it for advertising. Playback and optional uptime requests go directly to Twitch and its content-delivery services over HTTPS. Twitch handles those requests under its own policies. Fonts and extension assets are bundled locally.

Data is used only to deliver the enabled viewing features. It is not transferred to the publisher for unrelated processing.

## Your controls

Change individual features in All settings or pause the extension from the popup. Reset aggregate counters in All settings. Closing Twitch tabs discards their transient memory; uninstalling the extension removes its local extension storage. If you revisit this setup guide, choices are applied only when you finish it.

## Contact and changes

Use the publisher privacy contact above for questions. Any future release that changes data handling must update this policy and the store disclosures accordingly.
