# Streamshade 0.2.0

The first public release of Streamshade, a Chrome Manifest V3 Twitch companion.

## Download & install

Download **streamshade-0.2.0.zip** below, extract it into a permanent folder, then open `chrome://extensions`, enable **Developer mode**, and choose **Load unpacked**. Select the extracted folder containing `manifest.json`.

Complete the welcome flow, disable any other Twitch-specific blocker, and reload Twitch. [Full installation instructions](https://github.com/camwooloo/streamshade/blob/main/INSTALL.md).

## Included

- Locally bundled VAFT with Smart quality, Low-bandwidth, and Mute ads modes.
- Three-step first-install onboarding and optional bonus-point claiming.
- Chat appearance, sidebar hover expansion, stream-card uptime, and browsing controls.
- Switches to hide Bits, Prime, and Turbo promotions, including the newer **Try 1-Month Ad-Free** button.
- A compact popup, full settings page, custom icon, and direct GitHub links.

Existing local installations retain their preferences. Replace files in the same installed folder, reload the extension, and reload Twitch. If Turbo hiding was previously off, enable **Hide Turbo promotions** in settings or run setup again.

## Validation & limitations

14 unit tests and the unpacked browser integration suite passed. Browser fixtures cover clean-stream replacement, muting/restoration, onboarding, and the Turbo-button regression. Normal playback and selected appearance features were checked on live Twitch; real ad-break replacement remains unverified in the live smoke test.

Higher-resolution replacements depend on Twitch and are not guaranteed. This is an early-access unpacked build, not a Chrome Web Store release. GitHub downloads do not update automatically.
