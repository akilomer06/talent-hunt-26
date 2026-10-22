import type { RegistrationRecord, TeamMember } from '../lib/supabase';
import { FIELD_LABELS, PERSON_FIELDS, assignedEvent, formatIndiaTime } from '../lib/registrationDuplicates';

export function PersonDetails({ person, title }: { person: TeamMember; title: string }) {
  return <section className="rounded-lg border border-slate-200 bg-slate-50 p-3 min-w-0">
    <h5 className="font-semibold text-slate-900 mb-2">{title}</h5>
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
      {PERSON_FIELDS.map(field => <div key={field} className="min-w-0"><dt className="text-slate-500">{FIELD_LABELS[field]}</dt><dd className="text-slate-900 break-words whitespace-pre-wrap">{person[field] || 'Not provided'}</dd></div>)}
    </dl>
  </section>;
}

export function RegistrationDetails({ record, titles, focusEvent }: { record: RegistrationRecord; titles: Record<string, string>; focusEvent?: string | undefined }) {
  return <div className="space-y-3 text-sm">
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
      <p className="min-w-0 break-all">Pass ID: <strong className="font-mono text-slate-900">{record.reg_id || 'Assigned when saved'}</strong></p>
      <p>Submitted: {formatIndiaTime(record.created_at)}</p>
      {record.id && <p className="break-all">Database ID: {record.id}</p>}
    </div>
    <p className="text-xs text-slate-600">All events on this pass: {record.selected_events.map(id => titles[id] || id).join(' · ') || 'None selected'}</p>
    <PersonDetails person={record} title="Registrant" />
    <div className="grid sm:grid-cols-2 gap-3">
      {(record.team_members || []).map((member, i) => {
        const eventId = assignedEvent(record, member);
        return <div key={i} className="space-y-1 min-w-0"><p className={`text-xs font-medium ${focusEvent && eventId === focusEvent ? 'text-blue-700' : 'text-slate-600'}`}>{eventId ? `${eventId === focusEvent ? 'This event · ' : ''}${titles[eventId] || eventId}` : 'Event unassigned — review required'}</p><PersonDetails person={member} title={`Teammate ${i + 1}`} /></div>;
      })}
    </div>
    {!record.team_members?.length && <p className="text-xs text-slate-500">No teammates on this registration.</p>}
  </div>;
}
