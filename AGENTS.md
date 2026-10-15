<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

Read the existing AGENTS.md rules below before changing the project.

- The imported Talent Hunt app uses `src/App.tsx` as a shared shell for event, category and information routes; navigation uses TanStack Links. Why: every menu destination is shareable while preserving the original components.
- Styling uses the legacy `tailwind.config.js` via `@config` in `src/styles.css`, with RGB-triplet CSS variables. Why: preserves imported styling compatibility while supporting the festival design system.
- Browser-only values (localStorage, current time) must be read in effects, not during render. Why: pages are server-rendered and mismatches break hydration.

- Festival hero and event-card artwork use semantic CSS roles in the global stylesheet, with explicit reveal targets and reduced-motion support. Why: keeps visual variations and animation behavior consistent without changing event data.
- The theme button cycles Paper → Dark → Game; Game adds `.game` (plus `.dark`) on html/body and swaps the home page for `src/components/game/GameHome.tsx` with `gm-*` styles. Why: an arcade layout without touching the Paper/Dark designs.
- Game artwork and cursor effects live in dedicated browser-safe components; pointer listeners initialize in effects and all motion supports reduced motion. Why: event-specific animation stays isolated from event data and SSR.

- Paper and Dark share the `.reading-theme` layout; category views select EventDirectory outside Game and game components remain isolated. Why: theme changes must preserve navigation and readable page hierarchy.
- Shared navigation uses the Radix Sheet and brochure displays use `src/lib/brochure.ts`. Why: centralise accessible focus/scroll management and official asset updates.
- Event details use a text-led introduction, unframed content sections, and a facts sidebar; their accents use shared theme tokens rather than event artwork colours. Why: keeps long-form details readable and consistent across events and themes.
