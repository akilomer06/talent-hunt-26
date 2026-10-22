# Registration review and duplicate resolution

The main `/admin` portal has a **Duplicates** tab. Registration-team access has no duplicate-resolution, create, edit or delete controls. Existing data is not automatically merged, removed or corrected.

- Duplicate analysis uses raw event submissions, including all teammates. Shared RRNs are strong identity matches; name/contact or name/academic matches with a different RRN are labelled for verification. Exact groups ignore letter casing, repeated whitespace, participant order and registrant/teammate role changes.
- Related submissions are grouped once per event, with all registrant and teammate details expanded. Pair comparisons list field changes and members present in only one submission. Times are displayed in `Asia/Kolkata` with AM/PM. Submission timestamps are not presented as an edit history: historical edit times are unavailable.
- A teammate with no event ID is inferred only when there is one possible team event. Ambiguous legacy assignments are flagged and must be assigned manually before saving an edited form.
- **Edit registration** opens a local draft. **Review changes** displays the original and proposed values; only **Confirm and save changes** sends an update.
- **Remove this event only** opens a draft that retains the pass ID, original submission time, the other event, and that event's assigned teammates. Review and confirm it to save. If there is only one event left, use the whole-registration delete confirmation when appropriate.
- **Create corrected registration for this event** copies the selected event into a separate draft. It does not delete the original pass or copy unrelated event selections. Fill in the corrected team, review, and explicitly confirm creation. Once that succeeds, remove the duplicate event from the old pass if needed. **New registration** starts a blank draft. Creation retries reuse a request ID to prevent accidental repeated inserts.
- **Delete whole registration** uses a separate confirmation which warns that all events on that pass will be removed.
- Registration roster search covers both registrants and teammates, and opens team details while searching. Department filters also consider teammates.

## Deployment and verification

Deploy both the Vercel frontend and Render backend from the same commit. The new admin-only API routes are `PUT /api/registrations/:passId` and `POST /api/admin/registrations`. No database migration or environment change is required; the existing server-only Supabase key and secure policies support updates. Legacy databases without a section column are supported through the existing JSON metadata format.

Edits compare the original snapshot and use conditional database filters so concurrent edits return 409 rather than overwrite changed records. Registration-team tokens cannot call the new routes. Tests use in-memory/mock databases, never the production database.

Run `npm test`, `npm run test:backend`, `npx tsc --noEmit`, and `npm run build`.
