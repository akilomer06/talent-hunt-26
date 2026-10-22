import { useMemo, useState } from 'react';
import type { EventItem } from '../data/eventsData';
import type { RegistrationRecord } from '../lib/supabase';
import { assignedEvent, buildDuplicateGroups, formatIndiaTime, registrationMatchesSearch, withoutRegistrationEvent } from '../lib/registrationDuplicates';
import { emptyAdminRegistration, type RegistrationEditRequest } from './RegistrationEditor';
import { RegistrationDetails } from './RegistrationDetails';

export function RegistrationDuplicates({ records, events, onEdit, onDelete }: { records: RegistrationRecord[]; events: EventItem[]; onEdit: (request: RegistrationEditRequest) => void; onDelete: (record: RegistrationRecord) => void }) {
  const groups = useMemo(() => buildDuplicateGroups(records), [records]);
  const [query, setQuery] = useState('');
  const titles = Object.fromEntries(events.map(e => [e.id, e.title]));
  const visible = groups.filter(group => group.records.some(record => registrationMatchesSearch(record, query, titles)) || (titles[group.eventId] || group.eventId).toLowerCase().includes(query.toLowerCase()));
  const eventIds = [...new Set([...events.map(e => e.id), ...groups.map(g => g.eventId)])];
  const copy = (record: RegistrationRecord, eventId: string) => {
    const { id, created_at, ...fields } = record;
    onEdit({ initial: { ...fields, reg_id: '', selected_events: [eventId], team_members: record.team_members.filter(m => !assignedEvent(record, m) || assignedEvent(record, m) === eventId).map(m => ({ ...m, ...(!assignedEvent(record, m) ? { event_id: '' } : {}) })) }, context: `Corrected draft copied from ${record.reg_id} for ${titles[eventId] || eventId}. The original pass and its other event will remain unchanged.` });
  };
  return <div className="space-y-5">
    <header className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-900">Duplicate registrations</h2><p className="text-sm text-slate-600 mt-1">{groups.length} groups across {new Set(groups.map(g => g.eventId)).size} events · {new Set(groups.flatMap(g => g.records.map(r => r.reg_id))).size} flagged passes</p></div><button onClick={() => onEdit({ initial: emptyAdminRegistration() })} className="self-start rounded-lg bg-blue-700 text-white px-4 py-2 text-sm font-semibold">New registration</button></div>
      <p className="text-xs text-slate-600">Read-only analysis of all registrants and teammates. Matching RRNs are strong matches. Matching name/contact or name/academic details with different RRNs are possible matches that require verification. “Exact” ignores casing, extra spaces and participant order.</p>
      <p className="text-xs text-slate-600">All dates use India time (IST), in 12-hour format. Comparisons show submission times; historical edit times are not available. Nothing is merged, changed or deleted automatically.</p>
      <input aria-label="Search duplicates and teammates" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search names, teammates, RRN, pass ID, mobile or event" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
    </header>
    {!visible.length && <p className="rounded-xl border bg-white p-8 text-center text-slate-600">{groups.length ? 'No duplicate groups match your search.' : 'No duplicate registrations detected in the loaded records.'}</p>}
    {eventIds.map(eventId => { const eventGroups = visible.filter(g => g.eventId === eventId); if (!eventGroups.length) return null; return <section key={eventId} className="space-y-4" aria-label={`${titles[eventId] || eventId} duplicate groups`}>
      <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">{titles[eventId] || eventId} · {eventGroups.length} {eventGroups.length === 1 ? 'group' : 'groups'}</h3>
      {eventGroups.map((group, index) => <article key={group.id} className="rounded-xl border border-amber-200 bg-white overflow-hidden">
        <header className="bg-amber-50 p-4 space-y-2"><h4 className="font-bold text-slate-900">Group {index + 1} · {group.records.length} {group.records.length === 1 ? 'registration' : 'registrations'}</h4><div className="flex flex-wrap gap-2">{group.tags.map(tag => <span key={tag} className="rounded-full border border-amber-200 bg-white px-2 py-1 text-xs font-semibold text-amber-900">{tag}</span>)}</div><p className="text-xs text-amber-950">Review the comparisons and every person below. Use “Remove this event only” to keep another event on the same pass. “Delete whole registration” removes both events and all linked teammates.</p></header>
        <div className="p-4 space-y-4">
          {group.internalWarnings.map(warning => <p key={warning} className="text-sm text-red-700">{warning}</p>)}
          {group.comparisons.map(comparison => <section key={`${comparison.from.reg_id}:${comparison.to.reg_id}`} className="rounded-lg border border-slate-200 p-3 space-y-2 text-xs"><h5 className="font-semibold text-slate-900 break-all">{comparison.from.reg_id} → {comparison.to.reg_id}</h5><p className="text-slate-600">Earlier submission: {formatIndiaTime(comparison.from.created_at)} · Later submission: {formatIndiaTime(comparison.to.created_at)}</p><p className="font-semibold text-amber-800">{comparison.tags.join(' · ')}</p><ul className="list-disc pl-5 space-y-1 text-slate-700">{comparison.descriptions.map((description, i) => <li key={i}>{description}</li>)}</ul></section>)}
          {group.records.map(record => <section key={record.reg_id} className="rounded-xl border border-slate-300 p-4 space-y-4"><h5 className="font-bold text-slate-900 break-words">{record.name} · {record.reg_id}</h5><RegistrationDetails record={record} titles={titles} focusEvent={eventId} /><div className="flex flex-wrap gap-2 text-xs font-semibold">
            <button onClick={() => onEdit({ initial: record, original: record })} className="rounded-lg border border-blue-200 text-blue-700 px-3 py-2">Edit registration</button>
            <button onClick={() => copy(record, eventId)} className="rounded-lg border border-blue-200 text-blue-700 px-3 py-2">Create corrected registration for this event</button>
            {record.selected_events.length > 1 && <button onClick={() => onEdit({ initial: withoutRegistrationEvent(record, eventId), original: record, context: `Remove only ${titles[eventId] || eventId}. Review the remaining event and teammates before saving. The pass ID and original submission time are preserved.` })} className="rounded-lg border border-amber-300 text-amber-900 px-3 py-2">Remove this event only</button>}
            <button onClick={() => onDelete(record)} className="rounded-lg border border-red-200 text-red-700 px-3 py-2">Delete whole registration</button>
          </div></section>)}
        </div>
      </article>)}
    </section>; })}
  </div>;
}
