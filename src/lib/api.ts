/** Both Vite and Vercel proxy /api to the separate backend. */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Hosted clients always use the Vercel proxy. An old build-time API override
  // must not bypass it and introduce cross-origin browser requests.
  const base = import.meta.env.DEV
    ? (import.meta.env['VITE_API_URL'] || '').trim().replace(/\/+$/, '')
    : '';
  const token = typeof window === 'undefined' ? null : sessionStorage.getItem('th26_admin_token');
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token && !headers.has('Authorization')) headers.set('Authorization', 'Bearer ' + token);

  let response: Response;
  try {
    response = await fetch(base + path, { ...options, headers, signal: AbortSignal.timeout(60000) });
  } catch {
    throw new Error('Unable to reach the server. Please wait a moment and try again.');
  }

  const raw = await response.text();
  if (!raw.trim()) {
    throw new Error(`The server returned an empty response (HTTP ${response.status}). Please wait a moment and try again.`);
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`The API returned an unexpected response (HTTP ${response.status}). Please contact the site administrator.`);
  }
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
      ? data.error : `Server request failed (HTTP ${response.status}). Please try again.`;
    throw new Error(message);
  }
  if (data === null || typeof data !== 'object') {
    throw new Error('The server returned an invalid response. Please try again.');
  }
  return data as T;
}
