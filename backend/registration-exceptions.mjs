import { closedRegistrationError, normalizeRrn } from '../shared/registrationRules.ts';

// A single main-admin exception. Never applied to the public registration route.
export function approvedClosedEvents(rrn) {
  return typeof rrn === 'string' && normalizeRrn(rrn) === '240181601070' ? ['fifa'] : [];
}

export function adminClosedRegistrationError(record, original) {
  const retained = original && normalizeRrn(record.rrn) === normalizeRrn(original.rrn) ? original.selected_events : [];
  return closedRegistrationError(record.selected_events, [
    ...retained, ...approvedClosedEvents(record.rrn),
  ]);
}
