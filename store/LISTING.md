# Draft listing — review before submission

## Name

Streamshade — Twitch companion

## Short description

Customize Twitch with VAFT stream protection, quieter navigation, chat styling, and optional bonus-point claiming.

## Detailed description

Make Twitch feel more like your space.

Streamshade combines configurable stream protection with small improvements to Twitch's interface. Start with a guided setup, then adjust everything from the toolbar popup or All settings.

Stream protection:
- Smart quality uses the bundled VAFT engine to try higher-quality clean replacement streams during ad breaks.
- Low-bandwidth prefers a lighter replacement near 360p.
- Mute ads keeps normal playback and silences the ad.
- When no clean replacement is available, choose muted ad playback or waiting for a clean stream.

Make it yours:
- Hide Turbo trial promotions, Bits purchase buttons, and the Prime crown.
- Hide Stories and selected sidebar recommendations.
- Expand a collapsed channel list on hover.
- Alternate chat message backgrounds, hide the scrollbar, or move chat to the left.
- Choose how already-received deleted messages appear.
- Show available stream uptime on preview cards.
- Pause front-page carousel autoplay and optionally claim channel-point bonuses.

Settings and aggregate counters stay in your browser. No analytics, Streamshade account, or external proxy. Twitch data is processed only for the enabled features; see the privacy policy for details.

Important: replacement-stream availability depends on Twitch. Ads may still appear, quality may be reduced, and playback may buffer. Do not combine this with another Twitch-specific ad blocker. General uBlock filtering can remain enabled. Independent of Twitch and 7TV. Uses the MIT-licensed VAFT engine from TwitchAdSolutions.

## Single purpose

Provide a customizable Twitch viewing experience by reducing playback interruptions and on-page interface distractions.

## Permission justification

`storage`: stores viewing preferences, setup completion, and aggregate ad-break/bonus counters locally. Does not persist browsing history, chat messages, credentials, or playback tokens.

Twitch content-script access: runs on www.twitch.tv, player.twitch.tv, and m.twitch.tv to apply the selected player and interface features. No all-sites access is requested.

## Reviewer notes

The executable extension is self-contained in the ZIP. `engine/vaft.js` is generated from a pinned, MIT-licensed VAFT v24 source. The MAIN-world integration wraps only same-origin classic blob workers initiated by Twitch. It includes the bundled ad-handling functions and imports the original Twitch blob worker. No Streamshade code, feature flags, or JavaScript updates are downloaded from a remote service; updates require an extension release. This integration runs without extension APIs. Please assess this design under the MV3 context-isolation exemption. The isolated content scripts bridge settings and limited player statuses; arbitrary background fetches are not exposed.

Data disclosure preparation: review authentication information (transient Twitch authorization/device/session headers), website content (playlists, rendered chat, card metadata), user activity (bonus-button clicks), and Twitch URLs/channel identifiers. Do not select a blanket “no user data handled” claim solely because there is no Streamshade server. Disclosures must match the final code and hosted privacy policy.

## Test instructions

1. Install and complete the automatic setup. Choose Smart quality and Hide Turbo promotions.
2. Disable any other Twitch-specific blocker, then open/reload a live Twitch channel.
3. Use the popup to select each ad mode independently. Real ad occurrence varies by account and region. There is no assertion that an ad appears on a fixed schedule.
4. The top-navigation “Try 1-Month Ad-Free” control should disappear with Hide Turbo enabled; disabling the option restores it.
5. All settings → About & setup → Run setup again opens the guide without resetting other preferences.
6. Logged-out Twitch browsing can verify layout controls. Bonus claiming requires your own logged-in Twitch session and an available bonus. No credentials are provided or required by Streamshade itself.

Code/test evidence: see the packaged `VALIDATION.md`. Real-ad validation remains necessary before advertising reliable blocking.
