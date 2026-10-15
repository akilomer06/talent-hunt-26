# Content and launch checklist

## Verified and available

- [x] Official event title and all sixteen competition names, categories and exact ordering.
- [x] Monday, 26 October 2026.
- [x] Auditorium / B.S Abdur Rahman Crescent wording.
- [x] School, department and institution branding.
- [x] Original event, college, CSEA and ACM logo files.
- [x] Original brochure JPEG, preserved unchanged and viewable.
- [x] Two clearly readable convenors published.
- [x] Brochure's printed Instagram handle; URL derived from that exact handle.
- [x] Narrow CSE-only eligibility displayed together with the required Crescent-only notice.

## Required before enabling registration

- [ ] Confirm eligibility discrepancy: brochure “ONLY FOR CSE” versus brief “Crescent students only.” Site currently preserves the narrower restriction.
- [ ] Official HTTPS Google Form URL.
- [ ] Official QR image; scan and verify it opens that same form, then set `qrVerified`.
- [ ] Official registration opening and closing timestamps, with seconds and explicit UTC offset.
- [ ] Official IANA timezone; timestamps must match the timezone.
- [ ] Confirm instructions and review open/soon/closed states with the supplied values.

Current registration state: **unconfigured**. No external form button or QR appears. The brochure's “Register Now” artwork is not treated as proof that registration is currently open.

## Countdown and lifecycle

- [ ] Official start time and timezone, not available in the brochure.
- [ ] Set `countdown.startsAt` and `countdown.timezone`, then enable only after validation.
- [x] Until then, display the confirmed date and no countdown target.
- [x] Conservative archive behavior is documented; no event results invented.

## Missing official event content

- [ ] Event descriptions, rules, participation requirements and team sizes.
- [ ] Rounds/formats, equipment/software and prizes.
- [ ] Verified per-event faculty and student coordinator names/roles.
- [ ] Higher-resolution faculty/student small print or authoritative typed list to resolve uncertain spellings and initials.
- [ ] Official contact numbers, emails and messaging links.
- [ ] Timed programme/schedule entries.
- [ ] Verified street address, any specific auditorium name and directions.
- [ ] Any official additional FAQ answers and announcements.

These fields remain absent internally and corresponding optional sections stay hidden. No fabricated descriptions, rules or placeholder tokens are public.

## Assets

- [ ] Original brochure PDF for a true PDF download; current action opens the supplied image.
- [ ] Official default social-sharing image.
- [ ] Optional per-event social images and decorative artwork.
- [ ] Optional licensed intro sound; intro currently silent, with no nonfunctional sound toggle.
- [x] Local font files and licences.

## Deployment and final review

- [ ] Explicit user authorisation to deploy. No deployment has taken place.
- [ ] Actual HTTPS production origin for canonical/OG URLs and sitemap.
- [ ] Confirm public wording and privacy description with organisers.
- [ ] Check the derived Instagram URL and current ownership before launch.
- [ ] Verify native iPhone Safari, macOS Safari, Firefox and Android Chrome.
- [ ] Review with a screen reader and real touch devices. Automated accessibility testing is not full conformance certification.
- [ ] After authorised deployment, test deep links, refreshes, genuine 404 status and registration state on Vercel.

Optional missing content/assets do not prevent a valid local production build. The registration-specific omissions deliberately prevent registration actions from opening.
