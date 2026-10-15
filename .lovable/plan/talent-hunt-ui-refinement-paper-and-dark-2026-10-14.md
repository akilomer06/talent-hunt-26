# Talent Hunt UI refinement — Paper and Dark

## Direction and scope
Give **Paper and Dark the same carefully arranged layout**, adapted to their existing colours. Keep **Game separate**: no redesign of its opening screen, animated cards, cursor or neon styling. Shared navigation fixes and the new official brochure will work in all three themes.

Use the references’ strengths—clear heading hierarchy, deliberate whitespace, strong section alignment and a proper menu overlay—without copying their branding, inaccurate event descriptions or decorative excess.

## Audit: what to keep and what to fix

### Reference websites
- **NeuralTech:** the strongest lesson is visual hierarchy: prominent display text, restrained supporting copy and generous space between sections. Borrow that rhythm, not its font or colour identity.
- **Your friend’s site:** clearly separates technical and non-technical sections; date, countdown and venue have their own readable arrangement; section headings and “View all” links establish a predictable reading path.
- **Its phone menu:** opens a dedicated navigation overlay with a title, close control and numbered destinations. Our current menu is a small floating panel instead.
- **Do not copy everything:** enormous headings and very small supporting text are not automatically better. The friend’s cards also repeat several labels and its event descriptions differ from ours. Keep our verified content and distinctive artwork.

### Our site
- The Paper/Dark opening description is only **13px on desktop and 12px on phones**; date and eligibility labels are **10px**. Supporting information is too small relative to the title.
- The header fits nine desktop destinations into a compact row, then switches to a floating panel below 1250px. This prioritises fitting links over comfortable reading.
- Header and page content use different phone gutters: **16px versus 20px**, weakening alignment.
- Technical and non-technical routes currently render `GameHome` regardless of the selected theme. Paper/Dark need their own category-page presentation.
- Information pages use a shared `GameInfoPage` wrapper. They need a deliberate Paper/Dark page layout rather than inheriting arcade-oriented structure.
- The venue section hardcodes dark backgrounds even in Paper, producing an abrupt visual change unrelated to the page hierarchy.
- Repeated CSS overrides make text sizes and spacing inconsistent. Consolidate the affected rules rather than adding another override layer.

## Planned changes

### 1. Establish a coherent reading system
- One display font and one supporting font for Paper/Dark, using the existing loaded families; reserve pixel lettering for Game.
- Target body copy: **16px**, with **1.6–1.75 line height**; secondary labels **12–14px**; event titles **22–26px**.
- Heading sizes by breakpoint, not viewport-scaled text: opening title approximately **88px desktop / 64px tablet / 48px phone**; section titles **48px / 40px / 32px**. Adjust actual line breaks if needed to prevent clipping.
- Shared content width around **1200px**, readable prose around **60 characters per line**, and consistent **20–24px phone gutters**.
- A spacing scale of **8, 12, 16, 24, 32, 48, 64, 96px**. Use roughly 80–96px between major desktop sections and 48–64px on phones, avoiding both crowded stacks and empty screenfuls.

### 2. Rebuild navigation around the friend’s menu pattern
- Compact header: Talent Hunt emblem/wordmark, theme control, Register and a clearly labelled Menu control—not a squeezed row of every destination.
- Dedicated overlay: generous navigation type, numbered links, visible close button and active-page indication. Side-panel treatment on wide screens; full-screen treatment on phones.
- Keep the existing destinations: Home, Technical Events, Non-Technical Events, Schedule, Coordinators, About, Venue, FAQs and Contact; include Register in the menu.
- Focus stays within the open menu; Escape and outside click close it; background scrolling stops; selecting a destination closes it.
- No Crescent logo in the header, no organiser showcase, and no added decorative menu cards.

### 3. Rearrange the Paper/Dark opening without replacing its content
- Keep the original institution details, Talent Hunt title, description, date, venue, CSE eligibility, countdown, brochure and registration/explore actions.
- Give the title greater presence and supporting copy a comfortable width; align metadata and countdown on a clear shared baseline.
- Use a full-width opening composition with offset typography and a slim date/countdown area. Move the complete brochure preview into the next dedicated section rather than a competing side-by-side hero card; retain an obvious brochure action in the opening.
- On phones: institution details → title → description → metadata/countdown → actions; show a hint of the following section without forcing everything into one screen.
- Preserve warm cream, near-black, electric blue and vivid orange in Paper; preserve the existing Dark identity and ensure readable contrast.

### 4. Make event discovery feel intentional
- Clearly separated **“Hack the Limits.”** and **“Steal the Spotlight.”** sections, with explicit Technical / Non-technical labels and category-page links.
- Align section heading, short supporting line and category action consistently; position search where it does not interrupt the title.
- Keep event-specific artwork; improve title size, description spacing and team-size placement. Remove redundant labels and avoid nested cards.
- Use a consistent event grid: three columns on wide screens, two when cards remain readable, one on narrow phones.
- Category pages in Paper/Dark use the same design language and show only their eight matching events; Game retains its existing level cards.

### 5. Carry the layout through the remaining pages
- Apply the same heading, width, gutter and spacing rules to About, Schedule, Venue, Coordinators, Contact, FAQs, registration and event-detail pages.
- Event details: clear title and summary, concise metadata, readable rules, rounds and coordinator information; keep registration easy to find without covering content.
- Information pages: unframed content sections, not boxes around every paragraph. Venue colours follow the selected theme.
- Keep the cleaner footer and institutional logo row; align its typography and columns to the new page grid.
- Do not invent fees, registration destinations, schedules or other missing facts.

### 6. Replace the official brochure everywhere
- Use the uploaded **`talent_hunt_names_corrected_final.png`** unchanged as the official brochure.
- Update opening actions, dedicated preview, full-size dialogs and Game’s preview/download to the same asset; retain its full aspect ratio without cutting off names or the QR code.
- Provide working open and download actions with the correct PNG filename.
- Do not automatically replace the separate registration QR or rewrite coordinator records from tiny poster text; this request replaces the brochure artwork, not registration rules or roster data.

### 7. Purposeful motion and verification
- Subtle heading entrances, staggered event reveals and a smooth menu transition. Keep the existing logo intro; no new loading delay.
- Respect reduced motion and keyboard navigation; no Game cursor effects in Paper/Dark.
- Check Paper and Dark at **390px, your current 508px width, tablet and desktop**: text wrapping, consistent alignment, contrast, menu visibility and no horizontal overflow.
- Exercise menu navigation, both category listings, event details, search, registration, FAQ controls and brochure opening/download. Verify Game still behaves as before except for shared navigation and brochure replacement.
- Run existing relevant tests and check preview errors before completion.

## Technical approach
- Retain TanStack routes and the imported shared shell. Add theme-aware rendering for category and information views; keep Game-specific styling isolated.
- Define semantic typography, spacing and surface roles in the global design system, preserving its existing RGB-triplet token setup.
- Upload the new brochure through Lovable Assets and share its pointer across displays. Do not remove unrelated assets or perform a repository-wide asset migration.
- Inspect every content route’s metadata; retain unique titles/descriptions and valid social tags. Add brochure social images only if a meaningful absolute HTTPS asset URL is available—never a relative URL.
- Keep this frontend-only: no new backend, accounts or changes to event business logic.

## Completion outcome
A more readable, deliberately arranged Paper/Dark experience, the friend’s spacious menu pattern, consistent category and information pages, and the corrected brochure across every theme—without losing Talent Hunt’s identity or redesigning Game.