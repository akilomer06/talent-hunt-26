import { useMemo, useState } from 'react';
import type { RegistrationRecord } from '../lib/supabase';
import { buildEventGroups, eventTitle } from '../lib/participationViews';
import { formatIndiaTime } from '../lib/registrationDuplicates';

export function EventGroups({ records, events, fixedEvent }: { records: RegistrationRecord[]; events: Array<{ id: string; title: string }>; fixedEvent?: string }) {
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const groups = useMemo(() => buildEventGroups(records), [records]);
  const labels = [...events, ...[...groups.events.keys()].filter(id => !events.some(e => e.id === id)).map(id => ({ id, title: eventTitle(id) }))];
  const chosen = fixedEvent || selected;
  const query = search.trim().toLowerCase();
  const exportEvent = async (event: { id: string; title: string }) => {
    setBusy(event.id); setError('');
    try {
      const { buildEventGroupsWorkbook, downloadWorkbook } = await import('../lib/excelExports');
      await downloadWorkbook(buildEventGroupsWorkbook(event, groups.events.get(event.id) || [], groups.unassigned.filter(a => a.possibleEvents.includes(event.id))), `Talent-Hunt-2K26-${event.id}-Teams.xlsx`);
    } catch { setError('Unable to create the team workbook. Please try again.'); }
    finally { setBusy(''); }
  };
  return <section className="space-y-5 text-slate-900" aria-label="Event Groups">
    <header className="space-y-3"><h2 className="text-xl font-bold">Event Groups</h2><p className="text-sm text-slate-600">Original teams stay together. The pass ID identifies the source registration and team. BGMI’s fifth player is marked as substitute based on the existing form slot. Historical duplicate teams remain visible.</p>
      <div className="flex flex-wrap gap-3">{!fixedEvent && <select aria-label="Filter event groups" value={selected} onChange={e => setSelected(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">All events</option>{labels.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}</select>}
      <input aria-label="Search event groups" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, RRN, phone or pass ID" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" /></div>
    </header>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {labels.filter(e => !chosen || chosen === e.id).map(event => {
      const all = groups.events.get(event.id) || [];
      const visible = all.filter(group => [group.record.reg_id, ...group.members.flatMap(m => [m.person.name, m.person.rrn, m.person.mobile])].some(v => v.toLowerCase().includes(query)));
      return <section key={event.id} aria-label={`${event.title} groups`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <header className="flex flex-wrap justify-between gap-3 items-center"><div><h3 className="font-bold">{event.title}</h3><p className="text-xs text-slate-600">{all.length} groups · {all.reduce((n, g) => n + g.members.length, 0)} member entries</p></div><button disabled={!!busy} onClick={() => void exportEvent(event)} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy === event.id ? 'Preparing…' : `Download ${event.title} Excel`}</button></header>
        {!visible.length && <p className="text-sm text-slate-500">{all.length ? 'No matching teams.' : 'No teams registered yet.'}</p>}
        {visible.map(group => <article key={group.id} className="rounded-lg border border-slate-300 overflow-hidden"><header className="bg-slate-100 px-3 py-3 text-sm space-y-1"><p className="font-semibold break-words">Team / Pass ID: {group.record.reg_id}</p><p>Registered by {group.record.name} · {group.record.rrn} · {group.record.mobile}</p><p className="text-xs text-slate-600">{group.members.length} members · Submitted {formatIndiaTime(group.record.created_at)}</p></header><div className="overflow-x-auto"><table className="w-full text-xs text-left whitespace-nowrap"><thead className="bg-slate-50"><tr>{['Role', 'Name', 'RRN', 'Phone', 'Programme', 'Year', 'Department', 'Section', 'Assignment'].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{group.members.map((m, i) => <tr key={i} className="border-t border-slate-200">{[m.role, m.person.name, m.person.rrn, m.person.mobile, m.person.programme, m.person.year, m.person.department, m.person.section || '—', m.assignment].map((v, j) => <td key={j} className="p-3">{v}</td>)}</tr>)}</tbody></table></div></article>)}
      </section>;
    })}
    {groups.unassigned.filter(a => !chosen || a.possibleEvents.includes(chosen)).length > 0 && <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2"><h3 className="font-bold">Historical teammates needing event assignment</h3><p className="text-sm">These original entries have no clear event assignment. They are retained here and in the relevant Excel’s Needs review sheet rather than assigned to a team by guesswork.</p>{groups.unassigned.filter(a => !chosen || a.possibleEvents.includes(chosen)).map(a => <p key={`${a.record.reg_id}:${a.index}`} className="text-xs">{a.record.reg_id} · {a.member.name} · RRN {a.member.rrn} · {a.member.mobile} · Possible events: {a.possibleEvents.map(eventTitle).join(', ')}</p>)}</section>}
  </section>;
}
