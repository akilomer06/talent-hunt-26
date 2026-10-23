import { useState } from 'react';
import { FileSpreadsheet, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { buildEventCsv, downloadCsv, type EventParticipant } from '../lib/participantExports';
import type { RegistrationRecord } from '../lib/supabase';
import { EventGroups } from './EventGroups';

export function EventParticipantsDialog({ event, participants, records, unassignedCount, onClose }: {
  event: { id: string; title: string }; participants: EventParticipant[]; records: RegistrationRecord[]; unassignedCount: number; onClose: () => void;
}) {
  const [tab, setTab] = useState<'participants' | 'groups'>('participants');
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const exportExcel = async () => {
    if (exporting || !participants.length) return;
    setExporting(true);
    setExportError('');
    try {
      const { buildEventWorkbook, downloadWorkbook } = await import('../lib/excelExports');
      await downloadWorkbook(buildEventWorkbook(event, participants), `Talent-Hunt-2K26-${event.id}-Participants.xlsx`);
    } catch { setExportError('Unable to create Excel. Please try again or download CSV.'); }
    finally { setExporting(false); }
  };
  const query = search.trim().toLowerCase();
  const visible = participants.filter(person => [person.name, person.rrn, person.mobile, person.department, person.section || '', ...person.passIds].some(value => value.toLowerCase().includes(query)));
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="w-[calc(100%-24px)] max-w-6xl max-h-[90dvh] flex flex-col gap-4 overflow-hidden bg-white text-slate-900 p-4 sm:p-6">
      <div className="pr-8"><DialogTitle>{event.title} participants</DialogTitle>
        <DialogDescription className="mt-2 text-slate-600">{participants.length} unique participants, including registrants and teammates. Teammates share their registration’s pass ID. Repeated RRNs count once; all linked pass IDs are listed.</DialogDescription></div>
      {unassignedCount > 0 && <p className="text-sm text-amber-800">{unassignedCount} older teammate records have no clear event assignment. Review the unassigned section in the main CSV before issuing certificates.</p>}
      <div role="tablist" aria-label="Event Participants views" className="flex gap-2"><button role="tab" aria-selected={tab === 'participants'} onClick={() => setTab('participants')} className={`rounded-lg px-3 py-2 text-sm ${tab === 'participants' ? 'bg-blue-700 text-white' : 'bg-slate-100'}`}>Participants</button><button role="tab" aria-selected={tab === 'groups'} onClick={() => setTab('groups')} className={`rounded-lg px-3 py-2 text-sm ${tab === 'groups' ? 'bg-blue-700 text-white' : 'bg-slate-100'}`}>Event Groups</button></div>
      {tab === 'groups' ? <div role="tabpanel" className="min-h-0 overflow-y-auto"><EventGroups records={records} events={[event]} fixedEvent={event.id} /></div> : <>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex flex-1 min-w-48 gap-2 items-center border border-slate-300 rounded-lg px-3 py-2"><Search className="w-4 h-4 text-slate-500" /><input aria-label="Search event participants" placeholder="Name, RRN, pass ID or department" className="min-w-0 w-full text-sm bg-white" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-blue-700 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50" disabled={exporting || !participants.length} onClick={() => void exportExcel()}><FileSpreadsheet className="w-4 h-4" />{exporting ? 'Preparing workbook…' : 'Export participants Excel'}</button>
        <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 text-slate-700 px-4 py-2.5 text-sm font-semibold disabled:opacity-50" disabled={!participants.length} onClick={() => downloadCsv(buildEventCsv(event, participants), `Talent-Hunt-2K26-${event.id}-Participants.csv`)}>Export all participants CSV</button>
      </div>
      {exportError && <p role="alert" className="text-sm text-red-700">{exportError}</p>}
      <p className="text-xs text-slate-500">Showing {visible.length} of {participants.length} participants</p>
      <div className="overflow-auto min-h-0 border border-slate-200 rounded-lg">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="sticky top-0 bg-slate-100"><tr>{['Pass ID(s)', 'Name', 'RRN', 'Mobile', 'Programme', 'Year', 'Department', 'Section', 'Role', 'Registered By', 'Registration Date(s)'].map(label => <th key={label} scope="col" className="px-3 py-3 font-semibold">{label}</th>)}</tr></thead>
          <tbody>{visible.map((person, index) => <tr key={person.rrn || index} className="border-t border-slate-200">
            {[person.passIds.join('; '), person.name, person.rrn, person.mobile, person.programme, person.year, person.department, person.section || '—', person.roles.join('; '), person.registeredBy.join('; '), person.registrationDates.join('; ') || '—'].map((value, col) => <td key={col} className="px-3 py-3">{value}</td>)}
          </tr>)}{!visible.length && <tr><td colSpan={11} className="px-3 py-8 text-center text-slate-500">{participants.length ? 'No matching participants.' : 'No participants registered for this event yet.'}</td></tr>}</tbody>
        </table>
      </div>
      <p className="text-sm font-semibold">Total participants: {participants.length}</p>
      </>}
    </DialogContent>
  </Dialog>;
}
