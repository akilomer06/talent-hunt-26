import type { RegistrationRecord, TeamMember } from './supabase';
import { DEPARTMENTS, SECTIONS_MAP } from './registration';

export interface SectionCount { label: string; students: number; }
export interface DepartmentCount { department: string; students: number; forms: number; sections: SectionCount[]; }
export interface AcademicGroup { key: string; title: string; programme: string; year: string; students: number; forms: number; departments: DepartmentCount[]; }

const clean = (value: string | undefined) => (value || '').trim();
export function normalizeProgramme(value: string) {
  const key = clean(value).replace(/[^a-z]/gi, '').toLowerCase();
  return key === 'btech' ? 'B.Tech' : key === 'mtech' ? 'M.Tech' : clean(value) || 'Programme not recorded';
}
export function normalizeYear(value: string) {
  const key = clean(value).toUpperCase().replace(/[\s.-]/g, '');
  if (['I', '1', '1ST', 'FIRST', '1STYEAR', 'FIRSTYEAR'].includes(key)) return 'I';
  if (['II', '2', '2ND', 'SECOND', '2NDYEAR', 'SECONDYEAR'].includes(key)) return 'II';
  if (['III', '3', '3RD', 'THIRD', '3RDYEAR', 'THIRDYEAR'].includes(key)) return 'III';
  if (['IV', '4', '4TH', 'FOURTH', '4THYEAR', 'FOURTHYEAR'].includes(key)) return 'IV';
  return clean(value) || 'Year not recorded';
}
const yearNames: Record<string, string> = { I: '1st year', II: '2nd year', III: '3rd year', IV: '4th year' };
const yearLabel = (year: string) => yearNames[year] || year;
function normalizeDepartment(value: string) {
  const key = clean(value).replace(/[^a-z]/gi, '').toUpperCase();
  if (key === 'CSE') return 'CSE';
  if (['AIDS', 'AIANDDS'].includes(key)) return 'AI&DS';
  if (key === 'IOT') return 'IoT';
  if (['CYBERSECURITY', 'CS'].includes(key)) return 'Cybersecurity';
  return clean(value) || 'Department not recorded';
}
function sectionLabel(person: TeamMember, department: string, mtech: boolean) {
  const section = clean(person.section).replace(/^(?:section|sec)[\s.-]*/i, '').toUpperCase();
  const label = section ? `Section ${section}` : SECTIONS_MAP[department] ? 'Section not recorded' : 'No section';
  return mtech ? `${yearLabel(normalizeYear(person.year))} · ${label}` : label;
}

export function buildAcademicCounts(records: RegistrationRecord[]) {
  const groups: AcademicGroup[] = [];
  function newDepartment(department: string, mtech: boolean): DepartmentCount {
    return { department, students: 0, forms: 0, sections: mtech ? [] : (SECTIONS_MAP[department] || []).map(section => ({ label: `Section ${section}`, students: 0 })) };
  }
  function addGroup(programme: string, year: string): AcademicGroup {
    const key = programme === 'M.Tech' ? 'M.Tech' : programme + ':' + year;
    let group = groups.find(item => item.key === key);
    if (!group) {
      const departments = programme === 'M.Tech' ? ['CSE', 'AI&DS'] : programme === 'B.Tech' ? [...DEPARTMENTS] : [];
      group = { key, title: programme === 'M.Tech' ? 'M.Tech' : `${programme} · ${yearLabel(year)}`, programme, year, students: 0, forms: 0, departments: departments.map(dept => newDepartment(dept, programme === 'M.Tech')) };
      groups.push(group);
    }
    return group;
  }
  for (const year of ['II', 'III', 'IV']) addGroup('B.Tech', year);
  addGroup('M.Tech', '');

  function location(person: TeamMember) {
    const programme = normalizeProgramme(person.programme);
    const group = addGroup(programme, normalizeYear(person.year));
    const name = normalizeDepartment(person.department);
    let department = group.departments.find(item => item.department === name);
    if (!department) { department = newDepartment(name, programme === 'M.Tech'); group.departments.push(department); }
    return { group, department };
  }
  const people = new Map<string, TeamMember>();
  let missingRrn = 0;
  const rrnKey = (person: TeamMember) => clean(person.rrn).replace(/\s+/g, '').toUpperCase();
  // Registrants take priority over teammate copies when a student also submits
  // their own form. The API returns the most recent registration first.
  for (const record of records) {
    const { group, department } = location(record);
    group.forms++; department.forms++;
    const key = rrnKey(record);
    if (!key) missingRrn++;
    else if (!people.has(key)) people.set(key, record);
  }
  for (const record of records) {
    for (const member of record.team_members || []) {
      const key = rrnKey(member);
      if (!key) missingRrn++;
      else if (!people.has(key)) people.set(key, member);
    }
  }
  for (const person of people.values()) {
    const { group, department } = location(person);
    group.students++; department.students++;
    const label = sectionLabel(person, department.department, group.programme === 'M.Tech');
    let section = department.sections.find(item => item.label === label);
    if (!section) { section = { label, students: 0 }; department.sections.push(section); }
    section.students++;
  }
  for (const group of groups) for (const department of group.departments) {
    department.sections.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  }
  return { groups, students: people.size, forms: records.length, missingRrn };
}
