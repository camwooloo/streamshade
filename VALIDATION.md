# Validation

Validated on 2026-09-12. This file distinguishes automated fixtures from a live Twitch ad break.

## Results

Version 0.2.0: **14 unit tests passed**, including first-install onboarding, migration without preference resets, and no repeated setup on updates. Browser regression tests passed for the screenshot's Turbo button, dynamically inserted Turbo buttons, preservation of unrelated navigation/chat text, and the full onboarding flow (back navigation, mobile layout, save/completion). UI screenshots were visually reviewed. The real user account's current Turbo DOM was not directly inspected; this fix is verified against its supplied label/button shape.

- `npm test`: **14 passed**. Covers settings validation, the upstream HLS parser, 1080p and 360p selection, clean fallback replacement, end-of-ad restoration, fallback order, mute-only pass-through, disabling, Request preservation, MV3 permission boundaries, and onboarding lifecycle.
- `npm run test:browser` with installed Microsoft Edge: **passed** against the actual unpacked extension. Covers Chrome storage persistence, popup/settings synchronization, 390px and 1440px layouts, the 600px popup height limit, classic blob Worker injection, a mocked ad-to-clean-stream flow, sound restoration, one-time bonus claiming, UI hiding without hiding followed channels, sidebar hover, left chat, uptime, deleted-message styling, front-page autoplay pausing using a real canvas MediaStream, and reverting changes when disabled. No uncaught page errors in the suite.
- Read-only, logged-out live Twitch smoke check: a real stream played with `readyState=4` and advancing playback time. Sidebar hover expanded/collapsed successfully; the Prime crown was hidden; eight real stream-card uptime badges appeared. Left-chat layout switched Twitch's current three-column flex layout and retained playing video.
- **No real ad break occurred during the live smoke check.** No claim is made that real pre-rolls or mid-rolls were successfully blocked. Authenticated rewards, every moderation event shape, HEVC recovery, alternate Twitch layouts, and Chrome Web Store approval remain unverified.
- Downloaded Playwright Chromium failed to launch on this Windows host with a side-by-side assembly error. Installed branded Chrome did not load the extension through command-line flags. Automated extension checks therefore ran in installed Edge's Chromium engine; the user must still load the build into their normal Chrome via Developer mode.

Evidence: `artifacts/browser-results.json`, `artifacts/live-smoke.json`, and UI screenshots in `artifacts/`. `scripts/live-smoke.mjs` is an optional live inspection command; ordinary tests use fixtures and do not contact a real Twitch channel.

## Manual live acceptance

1. Disable the old Twitch uBlock script and other Twitch blockers; load Streamshade unpacked; reload Twitch.
2. Open a live channel at a chosen quality. During a real pre-roll and mid-roll, record whether Smart quality replaces the ad and which resolution the player actually displays.
3. Confirm the original quality, mute state, volume, and playback resume after the ad. Check AVC and, if available, HEVC streams separately.
4. Try Low-bandwidth and Mute ads separately with a reload between each. Test unavailable backups, paused playback, a muted stream, and manually unmuting during an ad.
5. Opt into bonus claiming. Confirm a real bonus increases Twitch's channel-point balance exactly once. Check navigation between channels and multiple tabs.
6. Check the Chrome extension error list and player console for CSP or worker failures.

Passing synthetic tests does not verify actual Twitch ad blocking or Chrome Web Store approval.
