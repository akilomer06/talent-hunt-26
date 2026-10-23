import { isDeepStrictEqual } from 'node:util';

/** PostgREST pSingleVal leaves simple eq values literal, including quote marks.
 * https://github.com/PostgREST/postgrest/blob/main/src/library/PostgREST/ApiRequest/QueryParams.hs
 * These tests model text vs JSONB comparison instead of accepting any PATCH URL.
 */
export function matchesPostgrestFilter(row, params) {
  for (const [field, expression] of params) {
    if (['select', 'order', 'limit', 'offset'].includes(field)) continue;
    if (expression === 'is.null') { if (row[field] !== null) return false; continue; }
    if (!expression.startsWith('eq.')) throw new Error('Unsupported test filter: ' + expression);
    const literal = expression.slice(3);
    if (field === 'team_members' || field === 'selected_events') {
      if (!isDeepStrictEqual(row[field], JSON.parse(literal))) return false;
    } else if (row[field] === null || String(row[field]) !== literal) return false;
  }
  return true;
}
