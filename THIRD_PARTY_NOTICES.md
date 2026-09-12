# Third-party notices

## TwitchAdSolutions / VAFT v24

Upstream: https://github.com/pixeltris/TwitchAdSolutions

Source: `vaft/vaft-ublock-origin.js` at repository commit `c51ef2fe8f667f9dc9216eb550924cf0d732ce27`, retrieved 2026-09-12 and kept verbatim in `reference/vaft.js`. SHA-256: `8ba15a99627c3d2a8fab3c3011b43d68ecb89eb40af549b0052d98449f02f591`. Distributed under the MIT License, copyright (c) 2020-present TwitchAdSolutions Contributors. The full license is included as `LICENSE-VAFT.txt` in the packaged extension and in `reference/LICENSE` in the source tree.

Streamshade modifies the upstream integration for Manifest V3, switches between fallback orders, adds configuration and status bridging, replaces runtime eval with an import of Twitch's originally requested blob worker, adds request guards, and omits document-visibility and localStorage overrides. The original contributors do not endorse this extension.

## Fonts

Manrope and DM Mono are distributed under the SIL Open Font License 1.1. The build includes their original license files in `fonts/LICENSE-manrope.txt` and `fonts/LICENSE-dm-mono.txt`. Fonts are bundled locally using the Fontsource npm packages.

## Original assets

7TV's public extension repository was consulted for feature behavior and compatibility selectors (commit `9225dc089759510ae100496a7adeb6db92bf8117`). Its implementation code is not bundled. Streamshade's appearance and uptime implementations are original; the 7TV repository is licensed Apache 2.0 plus Commons Clause, not the VAFT MIT license.

The Streamshade icon and interface artwork are original SVG/CSS assets created for this project. Twitch and 7TV names are used only to describe compatibility and future scope; their logos are not included.
