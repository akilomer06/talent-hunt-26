import { useMemo } from 'react';
import { buildAcademicCounts } from '../lib/academicCounts';
import type { RegistrationRecord } from '../lib/supabase';

export function AcademicCounts({ registrations }: { registrations: RegistrationRecord[] }) {
  const counts = useMemo(() => buildAcademicCounts(registrations), [registrations]);
  return <section className="space-y-8" aria-label="Department and section counts">
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
      <h2 className="text-xl font-bold text-slate-900">Programme, year & section counts</h2>
      <p className="text-sm text-slate-600 mt-2">Unique students, including teammates, counted once by RRN across all events. Form totals count registration forms submitted.</p>
      <div className="flex flex-wrap gap-8 mt-5">
        <p className="text-sm text-slate-600"><strong className="block text-3xl text-blue-700 tabular-nums">{counts.students}</strong>Registered students</p>
        <p className="text-sm text-slate-600"><strong className="block text-3xl text-slate-900 tabular-nums">{counts.forms}</strong>Registration forms</p>
      </div>
      {counts.missingRrn > 0 && <p role="status" className="mt-4 text-sm text-amber-800">{counts.missingRrn} participant records have no RRN and are excluded from student totals. Check their registration details.</p>}
    </div>
    {counts.groups.map(group => <section key={group.key} aria-label={group.title}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h3 className="text-xl font-bold text-slate-900">{group.title}</h3>
        <p className="text-sm text-slate-600"><strong className="text-blue-700">{group.students}</strong> students · {group.forms} forms</p>
      </div>
      <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${group.programme === 'M.Tech' ? '' : 'xl:grid-cols-4'}`}>
        {group.departments.map(department => <article key={department.department} aria-label={`${group.title} ${department.department}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 mb-3">
            <h4 className="font-bold text-slate-900">{department.department}</h4>
            <p className="text-right"><strong className="text-3xl font-bold text-blue-700 tabular-nums">{department.students}</strong><span className="block text-xs text-slate-500">students</span></p>
          </div>
          {department.sections.length > 0 ? <dl className="space-y-2">
            {department.sections.map(section => <div key={section.label} className="flex items-baseline justify-between gap-3 text-sm">
              <dt className="text-slate-600">{section.label}</dt><dd className="font-semibold text-slate-900 tabular-nums">{section.students}</dd>
            </div>)}
          </dl> : <p className="text-sm text-slate-500">{group.programme === 'M.Tech' ? 'Year and section breakdown appears as students register.' : 'No sections · no students yet.'}</p>}
          <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">{department.forms} registration forms submitted</p>
        </article>)}
      </div>
    </section>)}
  </section>;
}
