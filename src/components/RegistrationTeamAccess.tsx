import { useEffect, useState } from 'react';
import { getRegistrationAccess, setRegistrationAccess, type RegistrationAccess } from '../lib/supabase';

export function RegistrationTeamAccess() {
  const [access, setAccess] = useState<RegistrationAccess | null>(null);
  const [passcode, setPasscode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { getRegistrationAccess().then(setAccess).catch(error => setMessage(error.message)); }, []);
  async function save(enabled: boolean) {
    setBusy(true);
    try {
      setAccess(await setRegistrationAccess(enabled, enabled ? passcode : undefined));
      setPasscode('');
      setMessage(enabled ? 'Registration-team access enabled. Previous team sessions have been signed out.' : 'Registration-team access revoked. Existing team sessions are now blocked.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to update access'); }
    finally { setBusy(false); }
  }
  return <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4" aria-label="Registration-team access">
    <h3 className="text-lg font-bold text-slate-900">Registration-team access</h3>
    <p className="text-sm text-slate-600">The team uses <a href="/adminregistration" className="text-blue-700 underline">/adminregistration</a> to view the dashboard and registration list. They cannot delete registrations or edit the website.</p>
    <p className="text-sm font-semibold">Status: {access ? access.enabled ? 'Enabled' : 'Disabled' : 'Loading…'}</p>
    <form onSubmit={event => { event.preventDefault(); void save(true); }} className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">{access?.configured ? 'New team passcode (optional)' : 'Set a team passcode'}
        <input type="password" minLength={8} maxLength={200} autoComplete="new-password" required={!access?.configured} value={passcode} onChange={event => setPasscode(event.target.value)} className="block w-full mt-1 p-3 border border-slate-300 rounded-lg text-slate-900" />
      </label>
      <p className="text-xs text-slate-500">Use at least eight characters. Share this passcode only with your registration team.</p>
      <div className="flex flex-wrap gap-3">
        <button disabled={!access || busy} className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold disabled:opacity-50">{busy ? 'Saving…' : access?.enabled ? 'Update team access' : 'Enable team access'}</button>
        {access?.enabled && <button type="button" disabled={busy} onClick={() => { setPasscode(''); void save(false); }} className="px-4 py-2 rounded-lg bg-red-700 text-white text-sm font-semibold">Revoke team access</button>}
      </div>
    </form>
    {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
  </section>;
}
