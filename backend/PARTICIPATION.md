# Participation review and event groups

Deploy the frontend and backend from the same commit. No registration-data
migration is needed for these views or the API validation.

## Portals

- `/admin`: Event Groups and 3+ Events Participants, alongside the existing tabs.
- `/adminregistration`: read-only Event Groups and per-event Excel downloads.
- A dashboard event card also opens Participants / Event Groups views.

The views are calculated from the same loaded registrations. Saving an edit or
deleting a source pass updates that state and recalculates the roster, counts,
groups and excess-event list. Refresh retrieves changes saved in another browser.
There is no separate participant table or copied registration data.

The 3+ list counts distinct event IDs per normalized RRN, including registrant,
teammate and substitute associations. Different names or phone numbers on source
records remain visible; the tool does not merge or overwrite them by RRN.
Actions edit the specific source pass, not every pass sharing that RRN. Removing
a teammate opens a reviewed draft and retains the other members. Existing team
size validation still applies. Whole-pass deletion explicitly lists its scope
and requires confirmation; it removes all members/events on that pass.

## New registration checks

All public registrations, admin-created registrations and edited participation
are checked against all database pages. A normalized RRN preserves leading zeros
and ignores whitespace/case. An RRN cannot join an event twice, participate in a
third event, or participate in a second event in the same category, regardless
of which person submitted the pass. Unchanged historical memberships are retained
and may be corrected or reduced; adding participation is checked for every RRN.
The checks and writes are serialized within the backend process.

`POST /api/participation` is read-only and returns only the entered RRNs' event
IDs, titles, categories and roles. It never returns names, phones, pass IDs or
other team members. The registration form checks entered RRNs after a debounce;
the save endpoint always repeats the authoritative validation. Failed database
checks prevent a write.

## Database safeguard

For cross-process protection, run `backend/event-rrn-uniqueness.sql` once in the
**Talent Hunt** Supabase SQL Editor (project **spowdisyvuvaicasewdf**). Do not run
it against another project. It is safe to run again. It installs private helper
functions and a trigger without updating, deleting or inserting registrations.
It also upgrades the earlier duplicate-event trigger to enforce category and
overall event limits for newly introduced participation. Anonymous/authenticated
database access remains restricted by `backend/secure-policies.sql`.

The trigger uses a transaction advisory lock, an invoker function and the
backend's service role. Only retained historical claims are grandfathered.
Install this before adding API processes or allowing additional database writers.
This file's presence in Git does not install the trigger in Supabase.

## Teams and Excel

Each group uses the original registration pass ID as its team identifier.
Every event has its own downloadable `.xlsx`, with contiguous team blocks,
registrant details, roles, RRN, phone, academic details, source pass, event,
submission date, team size and a final member-entry total. IDs/phones are text.
Existing flat participant downloads and combined registration exports remain.

BGMI's optional fourth teammate (fifth person including the registrant) is marked
as Substitute, based on the existing form order. Historical forms have no
separate stored substitute flag. Unassigned historical teammates are inferred
only when exactly one team event is possible and no explicit assignment is
present. Ambiguous entries are retained in a review section / Needs review
worksheet and reserve their possible events for validation. They are never
silently inserted into an assumed team. Historical duplicate teams stay visible.

## Verification

`npm test`, `npm run test:backend`, `npx tsc --noEmit`, `npm run build`.
Automated API tests use isolated mock data. No live registrations are written.
