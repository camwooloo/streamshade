# Publishing Streamshade on the Chrome Web Store

Prepared for version 0.2.1. Source and unpacked builds are distributed through [GitHub](https://github.com/camwooloo/streamshade). No Chrome Web Store listing has been published.

## The install experience

After approval and publication, you share the Chrome Web Store URL. Users choose **Add to Chrome** and confirm the browser's permission prompt. They do not enable Developer mode or manage an unpacked folder. New installs automatically open Streamshade's setup page. Subsequent extension updates are distributed through the store.

## Steps

1. **Register a publisher.** Sign in to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole), accept the developer agreement, and pay the one-time registration fee shown there. Set up your publisher/contact details and enable Google Account two-step verification. Registration is for the publisher, not for every user. [Registration](https://developer.chrome.com/docs/webstore/register), [account setup](https://developer.chrome.com/docs/webstore/set-up-account).
2. **Finish the public materials.** Use `store/LISTING.md` as your listing draft. Complete `store/PRIVACY.md` with the publisher identity and contact address, host it at a publicly accessible HTTPS URL, and use that URL in the dashboard. Do not submit an unfinished contact placeholder.
3. **Provide the listing graphics.** Supply the packaged 128px PNG icon, one 440×280 small promotional image, and at least one real screenshot at 1280×800 or 640×400. Capture the finished popup/settings/onboarding UI; don't advertise unverified ad-blocking results. [Image requirements](https://developer.chrome.com/docs/webstore/images).
4. **Upload the package.** Choose **Add new item** and upload `dist/streamshade-0.2.1.zip`. Its root contains `manifest.json`. Fill in the Store listing, Privacy practices, Distribution, and Test instructions sections. Use the justification and reviewer notes in `store/LISTING.md`. [Publishing instructions](https://developer.chrome.com/docs/webstore/publish).
5. **Choose visibility.** Public is searchable; Unlisted is installable by anyone with the link; Private restricts installation to your selected testers. I suggest Unlisted for initial feedback. All three still undergo policy review. [Distribution options](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution).
6. **Submit for review.** Google can approve, request changes, or reject the item. You can defer publication until after approval. When published, share the store URL. Upload subsequent ZIPs to the same item with a higher manifest version to deliver updates.

## What still needs attention before submission

- Verify real pre-roll and mid-roll ad handling, including return to original quality, in your normal Chrome profile. The current evidence includes synthetic ad replacement and live non-ad playback, not a confirmed real ad blocked.
- **Explain the worker integration explicitly.** All Streamshade logic is bundled. The MAIN-world hook builds a local blob wrapper, then calls `importScripts` on the original same-origin blob worker requested by Twitch. That original worker contains Twitch's website code, not a downloaded Streamshade update. The worker cannot access extension APIs. Chrome policy has an exemption for contexts isolated from extension APIs, but whether this particular arrangement satisfies review is a reviewer determination, not something MV3 formatting alone establishes. Include the source paths and explanation; do not conceal the import or unconditionally assert that there is no externally supplied code. [MV3 policy](https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements), [remote-code guidance](https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code).
- **Disclose local data handling.** No analytics/backend does not mean no data handling: playback URLs, transient Twitch session headers, channel logins for optional uptime, and received chat text are processed. Complete the Privacy practices fields against the actual code. Google requires disclosures even for local-only processing. [Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy), [local data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).
- Retain the bundled VAFT MIT notice and font licenses. Describe the extension as independent of Twitch and 7TV. Do not claim endorsement or guaranteed ad-free/high-resolution playback.

A store listing is the normal path to easy installation. A publicly hosted ZIP or CRX does not replace the store installation flow for ordinary Chrome users.
