# Streamshade 0.2.1

## Complete setup, clearer navigation

- Onboarding now includes every preference across seven steps: Welcome, Playback, Extras, Chat, Sidebar, Browsing, and Review. Back navigation keeps your choices, and nothing is saved until Finish.
- All settings now highlights the section you reach by scrolling, keyboard navigation, or clicking a section link.
- The sidebar keeps navigation and supporting text together, fixing the overlap while scrolling. Short windows can scroll the sidebar content without text collisions.
- A labelled GitHub link with Lucide's GitHub icon appears in the popup, settings header, settings sidebar, and onboarding.

## Install or update

Download **streamshade-0.2.1.zip**, extract it, and select the folder containing `manifest.json` using Chrome's **Load unpacked** option at `chrome://extensions` with Developer mode enabled.

If already installed, replace the files in the same extension folder, reload Streamshade at `chrome://extensions`, and reload Twitch. Existing preferences are preserved. Open **All settings → About & setup → Run setup again** to explore the expanded onboarding.

[Full installation guide](https://github.com/camwooloo/streamshade/blob/main/INSTALL.md).

14 unit tests and the unpacked browser integration suite passed, including onboarding coverage of every setting, draft persistence, scrolling in both directions, sidebar geometry, mobile layouts, and visible GitHub links.

This update changes the interface and setup flow. Real ad-break replacement and Chrome Web Store approval remain unverified; clean-stream availability depends on Twitch. Unpacked builds do not update automatically.
