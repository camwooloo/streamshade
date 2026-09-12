# Streamshade 0.2.1 — Privacy tab

Paste each numbered Privacy TXT file into its matching dashboard field. All four are below the 1,000-character limit.

| Dashboard field | File |
| --- | --- |
| Single purpose description | Privacy-01-Single-Purpose.txt |
| storage justification | Privacy-02-Storage-Justification.txt |
| Host permission justification | Privacy-03-Host-Permission-Justification.txt |
| Remote code justification | Privacy-04-Remote-Code-Justification.txt |

## Remote code selection

For this build, keep **Yes, I am using remote code** and explain the Twitch worker integration with file 04. Streamshade's own logic is packaged locally, but the wrapper imports Twitch-supplied executable worker code that is outside the package. Declaring this makes the integration visible to the reviewer.

The MV3 policy has an exemption for code running in contexts isolated from extension APIs. Our explanation requests review under that provision; it does not claim Google has approved the architecture. Selecting Yes does not by itself make an MV3 implementation acceptable.

## Data usage — suggested declarations based on the 0.2.1 code

Google requires disclosure of local-only handling too. The following is a mapping from the current implementation to the dashboard categories; it is not a claim that any of this is uploaded to a Streamshade server.

- **Personally identifiable information:** Twitch device/session identifiers and channel usernames are processed for Twitch playback and optional uptime.
- **Authentication information:** existing Twitch authorization/integrity headers and playback tokens are used transiently for Twitch requests.
- **Personal communications:** already-rendered Twitch chat-message text can be retained temporarily for deleted-message styling. Streamshade does not access email or private-message inboxes.
- **Web history:** current Twitch channel/page and requested stream-resource URLs are handled for playback and uptime. Streamshade does not keep a browsing-history log or access Chrome's history database.
- **User activity:** Twitch player requests are monitored and bonus-button availability/claim outcomes are observed. There is no general-purpose click or keystroke logger.
- **Website content:** stream playlists, stream-card metadata, rendered chat, and selected Twitch interface elements.

Leave **Health information**, **Financial and payment information**, and **Location** unchecked for the current implementation. These are not features or data categories deliberately collected by Streamshade. Do not claim the extension handles no user data.

For the three Limited Use certifications, the current code uses data only for the extension's stated viewing features, does not sell it or transfer it for unrelated purposes, and does not use it for creditworthiness or lending. Your privacy policy and any future changes must remain consistent with these statements.

## Privacy policy URL

Paste this published URL: https://github.com/camwooloo/streamshade/blob/main/store/PRIVACY.md

The completed policy names camwooloo as publisher and uses the public GitHub support page as the contact.

## Sources checked

- https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements
- https://developer.chrome.com/docs/webstore/program-policies/user-data-faq

These recommendations were checked against extension/manifest.json, the VAFT adaptation, the MAIN-world page-data bridge, chat-text caching, and bonus-claim handling.
