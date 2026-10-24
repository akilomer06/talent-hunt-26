import { closedRegistrationError, normalizeRrn } from '../shared/registrationRules.ts';
import { eventRrnClaims } from '../shared/participation.ts';

// Closed events remain closed; earlier FIFA exceptions are no longer active.
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
