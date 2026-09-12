# Streamshade privacy policy

Streamshade is an independent, open-source Twitch companion published by camwooloo.

Publisher: **camwooloo**

Privacy and support contact: [Streamshade support](https://github.com/camwooloo/streamshade/issues). GitHub issues are public: do not post credentials, tokens, private conversations, or other sensitive information.

Applies to Streamshade version 0.2.1. Last updated: 12 September 2026.

## What Streamshade processes

Streamshade runs on supported Twitch pages to provide the features you enable. It processes Twitch playback playlists, stream URLs, playback tokens, and existing Twitch authorization/device/session headers to request alternative playback. Those values remain in page/worker memory and are sent only to Twitch's playback services as required for that feature. Streamshade does not ask for your Twitch password.

Optional uptime display reads visible stream-card metadata or requests stream start times from Twitch using the channel login. Channel identifiers and start times are cached temporarily in page memory.

This handling includes Twitch channel usernames, device/session identifiers, authentication information, current Twitch page and stream-resource URLs, website content, and network activity needed for the viewing features. No general browsing-history log, keystroke logger, location tracking, health-data feature, or financial-data feature is provided. Streamshade does not access your email or private-message inboxes.

Deleted-message display temporarily caches already-received chat text in the current tab. The cache is bounded and is not written to persistent storage. It cannot retrieve text deleted before the tab received it. Closing the tab discards this memory; disabling the feature clears its retained display/cache.

Automatic bonus claiming, when enabled, clicks the available Twitch channel-point bonus button. It does not purchase Bits, redeem rewards, or spend points.

## What is stored locally

The extension stores preferences, first-run setup timestamps/completion, and aggregate counts of detected ad breaks and observed bonus claims in this browser's extension storage. It does not store a history of visited channels, chat messages, session headers, passwords, or playback tokens there.

## Sharing and network requests

Streamshade has no analytics endpoint, advertising service, external proxy, or publisher-operated data backend. It does not sell user data or use it for advertising. Playback and optional uptime requests go directly to Twitch and its content-delivery services over HTTPS. Twitch handles those requests under its own policies. Fonts and extension assets are bundled locally.

Data is used only to deliver the enabled viewing features. It is not transferred to the publisher for unrelated processing.

Streamshade's use of user data follows the Chrome Web Store User Data Policy, including its Limited Use requirements. Data is not used or transferred for advertising, creditworthiness, lending, or purposes unrelated to the extension's stated viewing features. The publisher has no backend that receives extension-collected user data for human review. Twitch receives only the requests needed for Twitch functionality. If you voluntarily contact support through GitHub, GitHub processes that communication under its own privacy policy and the publisher can read what you submit.

## Your controls

Change individual features in All settings or pause the extension from the popup. Reset aggregate counters in All settings. Closing Twitch tabs discards their transient memory; uninstalling the extension removes its local extension storage. If you revisit this setup guide, choices are applied only when you finish it.

## Contact and changes

Use the publisher privacy contact above for questions. Any future release that changes data handling must update this policy and the store disclosures accordingly.
