import { closedRegistrationError, normalizeRrn } from '../shared/registrationRules.ts';

// Main-admin exceptions for the approved participants only. Never applied publicly.
const fifaExceptionRrns = new Set(['240181601070', '240071603001']);

export function approvedClosedEvents(rrn) {
  return typeof rrn === 'string' && fifaExceptionRrns.has(normalizeRrn(rrn)) ? ['fifa'] : [];
}

export function adminClosedRegistrationError(record, original) {
  const retained = original && normalizeRrn(record.rrn) === normalizeRrn(original.rrn) ? original.selected_events : [];
  return closedRegistrationError(record.selected_events, [
    ...retained, ...approvedClosedEvents(record.rrn),
  ]);
}
