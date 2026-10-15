# Verification report

Review date: **13 October 2026** (user timezone: Asia/Dubai).

The implementation is ready for local review. Official content/registration omissions are recorded in `CONTENT_CHECKLIST.md`. No website was deployed, and no registration was submitted.

## Commands actually executed

| Command or method                                           | Observed result                                                                                                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm install`                                               | Successful dependency installation. Final package audit: 229 packages, 0 reported vulnerabilities at the time of installation. This is not a security guarantee.  |
| `npm install --package-lock-only`                           | Successful after pinning installed dependency versions.                                                                                                           |
| `npm run typecheck`                                         | Passed TypeScript validation, including during the final production build.                                                                                        |
| `npm run lint`                                              | Passed. Final API-based lint runner explicitly read and linted all 11 TypeScript/TSX source files, including OneDrive placeholders.                               |
| `npm test`                                                  | **24 tests passed** in 2 files.                                                                                                                                   |
| `npm run verify`                                            | Passed typecheck, lint, 24 unit/component tests, production build and static verification.                                                                        |
| `npm run build`                                             | Passed. Vite 8.3.4 client build and native SSR bundle, followed by build-time static generation. Repeated after the final animation changes.                      |
| `scripts/prerender.mjs`                                     | Generated **27 static pages: 26 public routes and a custom 404**. All sixteen competition pages are present. Vercel routing generated from the same central data. |
| `scripts/verify-build.mjs`                                  | Verified 27 unique titles, static page content, description/OG/Twitter metadata, 33 distinct local route/asset links and the Vercel route manifest.               |
| `npm run test:browser`                                      | **18 tests passed**: 9 in Chrome and 9 in Edge, in about 1.5 minutes.                                                                                             |
| `npm run test:browser -- --grep 'mobile menu\|intro runs'`  | After final intro shape/stagger refinements: **4 affected tests passed** in Chrome and Edge.                                                                      |
| `npm run format` / `npm run format:check`                   | Formatting verified. The final runner uses the Prettier API to avoid OneDrive reparse-file glob omissions.                                                        |
| HTTP `Invoke-WebRequest` to `/events/code-break`            | Returned 200 from the production preview.                                                                                                                         |
| SHA256 comparison of original attachments and public copies | All five supplied image files match their originals exactly.                                                                                                      |

The final client bundle is approximately 447.6 kB before gzip / 142.0 kB gzip; CSS approximately 40.3 kB before gzip / 9.5 kB gzip. These are build output sizes, not a Lighthouse performance score. Original logo sizes are intentionally preserved.

## Unit and component coverage

- All sixteen verified names, category assignments and brochure ordering; verified weekday.
- Duplicate IDs/slugs, invalid names/categories/order and invalid/self-related IDs.
- Case-insensitive search, verified-tag filtering, empty results, bookmarked queries and Clear Filters.
- Previous/next boundaries within each category.
- Unique public routes and per-event metadata; unknown-route noindex behavior.
- ISO timestamp validation, actual timezone/offset consistency and invalid calendar dates.
- Missing registration dates, timezone, URL, QR availability and QR verification; reversed/equal windows.
- Registration opening/closing exact boundaries and deceptive/non-Google URLs.
- Countdown remains absent without configuration, computes units correctly, clamps at zero, and rejects a start date different from the event date.
- Conservative archive date boundary with no official timezone.
- Keyboard-operated accordion and expanded/collapsed state.
- Missing image and failed-image fallbacks.
- Announcement dismissal by individual ID; failed localStorage reads/writes.
- Mobile dialog opening/closing, scroll lock and focus restoration.
- Clipboard failure message and selectable URL fallback.
- No external registration actions when incomplete.
- Invalid event slug produces 404 content.
- Error boundary recovery without public diagnostic details.
- Featured-event controls and explicit Pause behavior without moving focus.

## Browser verification

Actually tested installed Windows browsers:

- **Chrome 154.0.8037.98** via Playwright's `chrome` channel.
- **Microsoft Edge 155.0.4283.45** via Playwright's `msedge` channel.

Both were run headlessly against the actual generated production output. Screenshots were separately inspected; the Codex preview-open request returned a queued response. Browser versions are reported as observed, without claiming they are the newest vendor releases.

Checks included:

- Direct loading and hydration of every public route (26 per browser), one page heading and nonempty metadata. No page/console errors observed on these successful routes.
- Genuine 404 HTTP status and the branded fallback for unknown event URLs.
- Search, clear, card navigation, browser Back/Forward, query retention, scroll restoration and event-page refresh.
- Modal focus containment, Escape dismissal, focus return, touch-sized menu controls and menu-link navigation at 390 × 844.
- Layout bounds at widths **320, 390, 768, 1024, 1440 and 1920** across the tested representative routes. No horizontal document overflow remained.
- Reduced-motion intro suppression and keyboard accordion interactions.
- Intro skipping, same-tab refresh without replay, and once-per-session state.
- Automatic featured-carousel rotation and pause on hover/focus; manual controls tested separately.
- No third-party network requests on the tested routes.
- Screenshots of desktop/mobile homepage, event template and registration state; visually inspected for clipping, hierarchy, asset integrity and legibility.

## Accessibility

axe-core scans using WCAG 2 A/AA, 2.1 AA and 2.2 AA tags found **zero violations in the scanned states**. In each browser, desktop scans covered the homepage, both category pages, Code Break, Shutter Verse, registration, schedule, about, venue, FAQs, contact, privacy and 404; the mobile homepage was also scanned. Additional mobile scans passed after the final motion refinement.

Keyboard menu focus and accordion interactions were exercised in real browsers. Outgoing animated routes are inert and hidden from assistive technology until removed. Reduced motion suppresses major motion and carousel auto-rotation. Automated tests cannot establish complete WCAG conformance, evaluate every screen-reader announcement or replace real-device testing.

## Defects found and corrected

1. A rotated decorative ribbon introduced one-pixel horizontal overflow. Root overflow clipping now contains the decoration; the responsive matrix passes.
2. During shared route transitions, an outgoing heading briefly remained in the accessibility tree. A presence guard now makes outgoing content inert and aria-hidden, while preserving the visual transition.
3. Parent initial-animation settings caused the opening mask to jump to its final frame, making Skip Intro unreachable. A dedicated timed CSS mask now controls the opening; the abstract shape genuinely morphs between polygon geometries and the skip control works.
4. A component assertion observed the accordion at the first opacity frame. It now waits for the user-visible expanded result and passes alongside real-browser keyboard checks.
5. Intro test setup originally reused session initialization that obscured the new-session scenario. It now uses a clean browser context with an explicit normal-motion preference; tests verify the actual once-per-tab behavior.
6. OneDrive marked source files as reparse placeholders after syncing; Prettier's CLI globber omitted them. File enumeration now uses filesystem stat/read operations and the Prettier/ESLint APIs so these files are explicitly included. Build/import checks also read them normally.
7. Scroll storage keys now include path, query and history key, preventing unrelated direct URLs from sharing the default history entry key.

## Limits and launch blockers

- **Not tested:** Firefox, macOS Safari, native iPhone Safari, native Android Chrome, real touch hardware or a screen-reader session. Desktop viewport emulation is not claimed as native mobile-browser testing.
- Vercel deployment has not been performed. Local generated routes and fallback status were verified; remote hosting must be checked after authorisation.
- No official start time/timezone exists, so the live countdown is intentionally inactive. Countdown calculations are tested with synthetic test fixtures only.
- No form URL, registration period or QR has been supplied. Production registration therefore remains inactive. No actual QR scan, form submission or open production registration flow could be verified.
- Optional sound/native-device sharing and supplied social previews could not be tested end-to-end because those assets/device interfaces were unavailable. Graceful fallbacks are implemented; clipboard failure handling was tested.
- Unknown faculty/student spellings, event rules, prizes, detailed descriptions and timings are omitted, not invented. Two clearly readable convenors are published.
- No Lighthouse score, SEO ranking, accessibility certification, real-device compatibility or production deployment success is claimed.

The source, runnable build, audited content, asset guide, launch checklist and screenshots are included in the handover.
