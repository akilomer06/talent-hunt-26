import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../lib/api';
import { readFileSync } from 'node:fs';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  sessionStorage.clear();
});

describe('frontend API connection', () => {
  it('uses the same-origin API proxy for admin and registration requests', async () => {
    vi.stubEnv('VITE_API_URL', '');
    const request = vi.fn().mockImplementation(async () => Response.json({ success: true }));
    vi.stubGlobal('fetch', request);
    await apiRequest('/api/admin/login', { method: 'POST', body: '{}' });
    await apiRequest('/api/registrations', { method: 'POST', body: '{}' });
    expect(request.mock.calls.map(call => call[0])).toEqual(['/api/admin/login', '/api/registrations']);
  });

  it('supports an explicit Render origin and sends the admin token', async () => {
    vi.stubEnv('VITE_API_URL', 'https://talent-hunt-26.onrender.com/');
    sessionStorage.setItem('th26_admin_token', 'test-token');
    const request = vi.fn().mockResolvedValue(Response.json([]));
    vi.stubGlobal('fetch', request);
    await apiRequest('/api/registrations');
    expect(request.mock.calls[0]?.[0]).toBe('https://talent-hunt-26.onrender.com/api/registrations');
    expect(request.mock.calls[0]?.[1].headers.get('Authorization')).toBe('Bearer test-token');
  });

  it.each([
    [new Response('', { status: 502 }), 'empty response (HTTP 502)'],
    [new Response('<!DOCTYPE html><html></html>'), 'unexpected response (HTTP 200)'],
    [Response.json({ error: 'Incorrect passcode' }, { status: 401 }), 'Incorrect passcode'],
    [Response.json(null), 'invalid response'],
  ])('reports unusable API responses without JSON parsing errors', async (response, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    await expect(apiRequest('/api/admin/login')).rejects.toThrow(message);
  });

  it('reports an unreachable backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(apiRequest('/api/registrations')).rejects.toThrow('Unable to reach the server');
  });

  it('routes API requests to Render before the Vercel website fallback', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
    const route = config.routes[0];
    for (const path of ['/api/admin/login', '/api/registrations', '/api/content']) {
      expect(path.replace(new RegExp('^' + route.src + '$'), route.dest))
        .toBe('https://talent-hunt-26.onrender.com' + path);
    }
  });
});
