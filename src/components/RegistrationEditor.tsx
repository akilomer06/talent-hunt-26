import { useRef, useState } from 'react';
import type { EventItem } from '../data/eventsData';
import { createAdminRegistration, updateRegistration, type RegistrationRecord, type TeamMember } from '../lib/supabase';
import { assignedEvent, FIELD_LABELS, PERSON_FIELDS, withoutRegistrationEvent } from '../lib/registrationDuplicates';
import { TEAM_RULES, validateEventTeams } from '../../shared/registrationRules';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { RegistrationDetails } from './RegistrationDetails';

export const emptyAdminRegistration = (): RegistrationRecord => ({ reg_id: '', name: '', rrn: '', mobile: '', programme: 'B.Tech', year: 'II', department: 'CSE', section: '', selected_events: [], team_members: [] });
const emptyTeammate = (eventId: string): TeamMember => ({ event_id: eventId, name: '', rrn: '', mobile: '', programme: 'B.Tech', year: 'II', department: 'CSE', section: '' });
export interface RegistrationEditRequest { initial: RegistrationRecord; original?: RegistrationRecord; context?: string }
export function RegistrationEditor({ request, events, onClose, onSaved }: { request: RegistrationEditRequest; events: EventItem[]; onClose: () => void; onSaved: (record: RegistrationRecord) => void }) {
  const [draft, setDraft] = useState<RegistrationRecord>(() => ({ ...request.initial, selected_events: [...request.initial.selected_events], team_members: (request.initial.team_members || []).map(member => ({ ...member, ...(assignedEvent(request.initial, member) ? { event_id: assignedEvent(request.initial, member)! } : {}) })) }));
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const createRequestId = useRef<string | null>(null);
  const titles = Object.fromEntries(events.map(e => [e.id, e.title]));
  const allEvents = [...events.map(e => ({ id: e.id, title: e.title })), ...draft.selected_events.filter(id => !titles[id]).map(id => ({ id, title: id }))];
  const validate = () => {
    if (!PERSON_FIELDS.filter(f => f !== 'section').every(f => (draft[f] || '').trim())) return 'Complete all registrant fields.';
    if (!/^\d{10}$/.test(draft.mobile.trim())) return 'Enter a 10-digit registrant mobile number.';
    return validateEventTeams(draft.selected_events, draft.team_members, draft.rrn);
  };
  const save = async () => {
    if (busy) return;
    const issue = validate();
    if (issue) { setError(issue); setReview(false); return; }
    setBusy(true); setError('');
    try {
      if (!request.original && !createRequestId.current) createRequestId.current = crypto.randomUUID().replace(/-/g, '');
      const saved = request.original ? await updateRegistration(draft, request.original) : await createAdminRegistration(draft, createRequestId.current!);
      onSaved(saved); onClose();
    }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to save. Refresh before retrying.'); }
    finally { setBusy(false); }
  };
  const inputs = (person: TeamMember, update: (p: TeamMember) => void, prefix: string) => <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{PERSON_FIELDS.map(field => <label key={field} className="text-xs font-medium text-slate-700">{FIELD_LABELS[field]}{field !== 'section' && ' *'}<input aria-label={`${prefix} ${FIELD_LABELS[field]}`} className="block mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900" value={person[field] || ''} required={field !== 'section'} maxLength={field === 'section' ? 100 : 200} onChange={e => update({ ...person, [field]: e.target.value })} /></label>)}</div>;
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white text-slate-900">
    <DialogHeader><DialogTitle>{request.original ? `Edit registration ${request.original.reg_id}` : 'New corrected registration'}</DialogTitle><DialogDescription>{request.context || 'Edit a local draft, review all details, then explicitly save. Opening this form changes no database records.'}</DialogDescription></DialogHeader>
    <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-900">{request.original ? 'This updates this pass only and preserves its ID and original submission time. Other registrations are not changed.' : 'This creates a separate pass. Existing registrations are kept; remove the duplicate event from its old pass only after the corrected pass is saved.'}</p>
    {error && <p role="alert" className="text-sm text-red-700 rounded-lg bg-red-50 p-3">{error}</p>}
    {review ? <div className="space-y-5">
      <h3 className="font-semibold">Review before saving to the database</h3>
      {request.original && <section className="rounded-xl border border-slate-200 p-4"><h4 className="font-semibold mb-3">Before</h4><RegistrationDetails record={request.original} titles={titles} /></section>}
      <section className="rounded-xl border border-blue-200 p-4"><h4 className="font-semibold mb-3">After</h4><RegistrationDetails record={draft} titles={titles} /></section>
      <div className="flex flex-wrap gap-3"><button disabled={busy} onClick={() => setReview(false)} className="rounded-lg border px-4 py-2 text-sm">Back to editing</button><button disabled={busy} onClick={() => void save()} className="rounded-lg bg-blue-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50">{busy ? 'Saving…' : request.original ? 'Confirm and save changes' : 'Confirm and create registration'}</button></div>
    </div> : <form onSubmit={e => { e.preventDefault(); const issue = validate(); setError(issue || ''); if (!issue) setReview(true); }} className="space-y-6">
      <fieldset disabled={busy} className="space-y-5">
        <section><h3 className="font-semibold mb-3">Registrant</h3>{inputs(draft, person => setDraft({ ...draft, ...person }), 'Registrant')}</section>
        <section><h3 className="font-semibold mb-2">Events</h3><p className="text-xs text-slate-500 mb-3">Choose at most one technical and one non-technical event. Removing an event from this draft removes only its assigned teammates.</p><div className="grid sm:grid-cols-2 gap-2">{allEvents.map(event => <label key={event.id} className="flex items-center gap-2 text-sm rounded-lg border p-2"><input type="checkbox" checked={draft.selected_events.includes(event.id)} onChange={e => setDraft(e.target.checked ? { ...draft, selected_events: [...draft.selected_events, event.id] } : withoutRegistrationEvent(draft, event.id))} />{event.title}<span className="ml-auto text-xs text-slate-500">{TEAM_RULES[event.id]?.category === 'technical' ? 'Technical' : 'Non-technical'}</span></label>)}</div></section>
        <section className="space-y-4"><h3 className="font-semibold">Teammates ({draft.team_members.length})</h3>
          {draft.selected_events.map(id => { const rule = TEAM_RULES[id]; return <p key={id} className="text-xs text-slate-600">{titles[id] || id}: {rule ? `${rule.min}–${rule.max} total participants including registrant` : 'Review event rules'}</p>; })}
          {draft.team_members.map((member, index) => <section key={index} className="rounded-lg border border-slate-200 p-3 space-y-3"><div className="flex flex-wrap justify-between gap-2"><h4 className="text-sm font-semibold">Teammate {index + 1}</h4><button type="button" onClick={() => setDraft({ ...draft, team_members: draft.team_members.filter((_, i) => i !== index) })} className="text-xs text-red-700">Remove teammate from draft</button></div>
            <label className="text-xs text-slate-600">Event *<select aria-label={`Teammate ${index + 1} event`} required value={member.event_id || ''} onChange={e => setDraft({ ...draft, team_members: draft.team_members.map((m, i) => i === index ? { ...m, event_id: e.target.value } : m) })} className="block w-full rounded-md border p-2 mt-1"><option value="">Assign event</option>{draft.selected_events.filter(id => (TEAM_RULES[id]?.max || 1) > 1).map(id => <option key={id} value={id}>{titles[id] || id}</option>)}</select></label>
            {inputs(member, person => setDraft({ ...draft, team_members: draft.team_members.map((m, i) => i === index ? person : m) }), `Teammate ${index + 1}`)}
          </section>)}
          <div className="flex flex-wrap gap-2">{draft.selected_events.filter(id => (TEAM_RULES[id]?.max || 1) > 1).map(id => <button type="button" key={id} disabled={1 + draft.team_members.filter(m => m.event_id === id).length >= TEAM_RULES[id]!.max} onClick={() => setDraft({ ...draft, team_members: [...draft.team_members, emptyTeammate(id)] })} className="rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-xs disabled:opacity-40">+ Teammate for {titles[id] || id}</button>)}</div>
        </section>
        <div className="flex gap-3"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel draft</button><button type="submit" className="rounded-lg bg-blue-700 text-white px-4 py-2 text-sm font-semibold">Review changes</button></div>
      </fieldset>
    </form>}
  </DialogContent></Dialog>;
}
