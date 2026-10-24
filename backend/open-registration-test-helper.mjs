import { createApiServer } from './server.mjs';

// Test-only policy: exercise database writes and duplicate checks independently
// of the final closure. HTTP clients and environment variables cannot select it.
export function createOpenRegistrationTestServer(env, request) {
  return createApiServer(env, request, {
    registrationClosure: (selected, existing = []) => selected.some(id => ['fifa', 'bid-wars'].includes(id) && !existing.includes(id)) ? 'Registration is closed' : null,
  });
}
