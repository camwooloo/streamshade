# Streamshade promo video

30-second, 1920×1080, 30fps Remotion composition with original motion graphics and actual extension screenshots. Silent by design: all information is on screen. No music or voice assets are licensed or required.

Run from this folder:

```sh
npm ci
npm run stills
npm run render
```

Uses installed Edge on Windows by default. Set STREAMSHADE_BROWSER to a compatible Chromium executable elsewhere. Run the root build and scripts/generate-store-assets.mjs first if the screenshots are missing.

The renderer copies required assets into the ignored public folder, renders preview frames to artifacts/video-preview, and writes the final MP4 to Chrome Web Store Uploads. Remotion dependencies are separate from the extension build and never ship in its ZIP.

Scene order: introduction, playback modes, chat/sidebar, guided setup, GitHub closing card. Playback copy describes attempted replacements and their availability limits. No real-ad success or Chrome Web Store approval is claimed.
