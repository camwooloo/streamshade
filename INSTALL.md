# Install Streamshade in Chrome

## Download and install

1. Download **streamshade-0.2.0.zip** from the [latest release](https://github.com/camwooloo/streamshade/releases/latest). Choose the Streamshade ZIP in Assets, not GitHub's automatic Source code download.
2. Extract the ZIP into a permanent folder, such as `Documents/Streamshade`. Keep this folder in place while the extension is installed.
3. In Chrome, enter `chrome://extensions` in the address bar.
4. Turn on **Developer mode** in the top-right corner.
5. Click **Load unpacked**. Select the extracted folder that directly contains `manifest.json`.
6. Complete the setup page that opens, then pin Streamshade from Chrome's extensions menu.
7. Disable your old Twitch-specific uBlock script or other Twitch ad blocker, then reload open Twitch tabs. General uBlock filtering can stay enabled.

Chrome remembers the extension after a restart. The ZIP must be extracted first; selecting the ZIP itself will not work. Chrome Web Store installation is not available yet.

If setup does not open, use **All settings → About & setup → Run setup again**. Smart quality is the default playback mode; new installations also hide Turbo promotions by default. Bonus claiming is optional.

## Update an existing unpacked installation

1. Download and extract the new release ZIP.
2. Replace the files inside the **same folder** you originally loaded. Keep `manifest.json` directly inside that folder, not nested in another subfolder.
3. Open `chrome://extensions` and click the reload button on Streamshade's card.
4. Reload your Twitch tabs.

Keep the same extension loaded instead of removing and reinstalling it to retain your preferences. Unpacked installations do not receive automatic GitHub updates.

## Build from source instead

With Node.js 22 or newer, run `npm ci` and `npm run build` in the source folder. In step 5 above, select `dist/streamshade`.

## If something is wrong

- **Manifest missing:** select the extracted folder that contains `manifest.json`, or `dist/streamshade` for a source build.
- **Turbo trial still visible:** enable **All settings → Browse & declutter → Hide Turbo promotions**, reload the extension, then reload Twitch. An existing explicit off preference is preserved on update.
- **Ads, a black screen, or buffering:** disable other Twitch-specific blockers, reload Twitch, and try another playback mode. Smart quality cannot guarantee a clean or high-resolution replacement. Mute ads keeps ordinary ad playback and silences it.
- **An option stopped working:** Twitch can change its layout. [Open an issue](https://github.com/camwooloo/streamshade/issues) with the extension version, browser version, selected mode, and steps to reproduce. Remove tokens, cookies, usernames, and private chat details from any logs or screenshots you share.
