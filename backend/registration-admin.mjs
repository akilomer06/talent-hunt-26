import { validateEventTeams } from '../shared/registrationRules.ts';

export const registrationFields = ['name', 'rrn', 'mobile', 'programme', 'year', 'department', 'section', 'selected_events', 'team_members'];
const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };
export function normalizeRegistration(row) {
  const metadata = row.team_members;
  return metadata && !Array.isArray(metadata) && Array.isArray(metadata.members)
    ? { ...row, section: row.section || metadata.registrant_section || '', team_members: metadata.members }
    : { ...row, section: row.section || '', team_members: row.team_members || [] };
}
export function validateAdminRegistration(body) {
  const fields = ['name', 'rrn', 'mobile', 'programme', 'year', 'department'];
  if (!body || !fields.every(key => typeof body[key] === 'string' && body[key].trim() && body[key].length <= 200)) fail('Complete the registrant’s personal and academic details.');
  if (!/^\d{10}$/.test(body.mobile.trim())) fail('Enter a 10-digit registrant mobile number.');
  if (!Array.isArray(body.selected_events) || body.selected_events.length < 1 || body.selected_events.length > 2 || !body.selected_events.every(id => typeof id === 'string')) fail('Select one or two events.');
  if (!Array.isArray(body.team_members) || body.team_members.length > 20) fail('Invalid team members.');
  if (body.team_members.some(member => member?.section !== undefined && (typeof member.section !== 'string' || member.section.length > 100))) fail('Invalid teammate section.');
  if (body.section !== undefined && (typeof body.section !== 'string' || body.section.length > 100)) fail('Invalid section.');
  const teamError = validateEventTeams(body.selected_events, body.team_members, body.rrn);
  if (teamError) fail(teamError);
  const cleanPerson = p => Object.fromEntries([...fields, 'section'].map(key => [key, (p[key] || '').trim()]));
  return { ...cleanPerson(body), selected_events: [...body.selected_events], team_members: body.team_members.map(member => ({ ...cleanPerson(member), event_id: member.event_id })) };
}
const canonical = value => JSON.stringify(sortKeys(value));
function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortKeys(value[key])]));
  return value;
}
export function sameRegistrationSnapshot(row, expected) {
  if (!expected || typeof expected !== 'object') return false;
  const snapshot = r => { const normalized = normalizeRegistration(r); return Object.fromEntries(registrationFields.map(key => [key, normalized[key]])); };
  return canonical(snapshot(row)) === canonical(snapshot(expected));
}
/** PostgREST conditions make the single-row update fail if another admin edits it. */
export function registrationUpdateFilter(row) {
  return ['reg_id', ...registrationFields].filter(key => Object.hasOwn(row, key)).map(key => {
    const value = row[key];
    return `${key}=${value === null ? 'is.null' : 'eq.' + encodeURIComponent(JSON.stringify(value))}`;
  }).join('&');
}
