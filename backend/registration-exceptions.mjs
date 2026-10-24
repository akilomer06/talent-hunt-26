import { closedRegistrationError, normalizeRrn } from '../shared/registrationRules.ts';
import { eventRrnClaims } from '../shared/participation.ts';

// The final all-event closure supersedes the earlier participant exceptions.
export function approvedClosedEvents() {
  return [];
}

export function adminClosedRegistrationError(record, original, registrationClosure = closedRegistrationError) {
  const retained = original && normalizeRrn(record.rrn) === normalizeRrn(original.rrn) ? original.selected_events : [];
  const eventError = registrationClosure(record.selected_events, [
    ...retained, ...approvedClosedEvents(record.rrn),
  ]);
  if (eventError || !original) return eventError;
  const previous = eventRrnClaims(original);
  for (const [event, rrns] of eventRrnClaims(record)) {
    if ([...rrns].some(rrn => !previous.get(event)?.has(rrn))) {
      const participantError = registrationClosure([event]);
      if (participantError) return participantError;
    }
  }
  return null;
}
