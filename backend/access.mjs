import { createCipheriv, createDecipheriv, createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export const ACCESS_KEY = '_registration_team_access';

// Secrets stay encrypted at rest, separate from public website settings. Keep
// SESSION_SECRET stable across Render deploys so stored access remains readable.
export function createAccessStore(database, secret) {
  const key = createHash('sha256').update(secret).digest();
  const empty = () => ({ enabled: false, version: '', hash: '', salt: '' });
  async function read() {
    const rows = await database(`site_content?key=eq.${ACCESS_KEY}&select=value`);
    if (!rows?.[0]?.value) return empty();
    try {
      const value = rows[0].value;
      const cipher = createDecipheriv('aes-256-gcm', key, Buffer.from(value.iv, 'hex'));
      cipher.setAuthTag(Buffer.from(value.tag, 'hex'));
      return JSON.parse(Buffer.concat([cipher.update(Buffer.from(value.data, 'hex')), cipher.final()]).toString());
    } catch { return empty(); }
  }
  async function save(body) {
    if (typeof body?.enabled !== 'boolean' || (body.passcode !== undefined && (typeof body.passcode !== 'string' || body.passcode.length > 200))) {
      throw Object.assign(new Error('Invalid access settings'), { status: 400 });
    }
    const current = await read();
    if (body.passcode && body.passcode.length < 8) throw Object.assign(new Error('Use at least 8 characters for the team passcode'), { status: 400 });
    if (body.enabled && !current.hash && !body.passcode) throw Object.assign(new Error('Set a team passcode before enabling access'), { status: 400 });
    const next = { ...current, enabled: body.enabled, version: randomBytes(24).toString('hex') };
    if (body.passcode) {
      next.salt = randomBytes(16).toString('hex');
      next.hash = (await scrypt(body.passcode, next.salt, 64)).toString('hex');
    }
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const data = Buffer.concat([cipher.update(JSON.stringify(next)), cipher.final()]);
    await database('site_content?on_conflict=key', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ key: ACCESS_KEY, value: { iv: iv.toString('hex'), tag: cipher.getAuthTag().toString('hex'), data: data.toString('hex') }, updated_at: new Date().toISOString() }) });
    return status(next);
  }
  const status = value => ({ enabled: value.enabled, configured: !!value.hash });
  async function login(passcode) {
    const value = await read();
    if (!value.enabled || !value.hash) return null;
    const hash = await scrypt(passcode, value.salt, 64);
    return timingSafeEqual(hash, Buffer.from(value.hash, 'hex')) ? value.version : null;
  }
  return { read, save, status, login };
}
