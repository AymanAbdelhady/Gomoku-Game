/**
 * Optional realtime sync server — zero dependencies, Node >= 22.18.
 *
 *   npm run build && npm run serve      →  http://<this-machine>:8787
 *
 * Serves the built app from ./dist and a tiny realtime API so an operator
 * tablet, the projector laptop and any confidence monitors share one state
 * across the venue network:
 *
 *   GET  /api/health       service probe used by the app's auto-detection
 *   GET  /api/state        current state snapshot (operators with the key also see pledges awaiting approval)
 *   GET  /api/stream       Server-Sent Events: a `state` frame on every change (?key= for operators)
 *   POST /api/auth         { passcode } → 200 if it matches SYNC_OPERATOR_KEY
 *   POST /api/actions      { actions: [{ id, action }] } (header x-operator-key)
 *   POST /api/donor/join   guest joins from their phone (public, rate-limited)
 *   POST /api/pledge       joined guest pledges an amount (public, rate-limited)
 *   GET  /api/donors       PRIVATE pledger contact list for follow-up (header x-operator-key)
 *   POST /api/assets       upload a logo { dataUrl } (header x-operator-key) → { name }
 *   GET  /api/assets/:name serve an uploaded logo
 *
 * Pledger contact details are kept in server/data/donors.json and are never
 * part of the shared state that displays and phones receive.
 *
 * The same pure reducer used in the browser applies every action here, so
 * behaviour is identical in local and server modes. State is persisted to
 * server/data/state.json after each change.
 *
 * This is a prototype relay for a trusted venue network, not a hardened
 * internet service: put it behind HTTPS and real authentication (or replace
 * it with Supabase/Firebase) before exposing it publicly.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual, randomInt, randomBytes, createHash } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import type { AppState, DonorAccount } from '../src/types/index.ts';
import { makeAccount, makePledge, pledgeError, redactPending, toSession, validateJoin, type JoinInput } from '../src/state/pledging.ts';
import type { Action } from '../src/state/actions.ts';
import { reducer } from '../src/state/reducer.ts';
import { normaliseState } from '../src/state/store/persistence.ts';
import { createInitialState } from '../src/config/defaults.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const DATA_FILE = join(ROOT, 'server', 'data', 'state.json');
const DONORS_FILE = join(ROOT, 'server', 'data', 'donors.json');
const ASSETS_DIR = join(ROOT, 'server', 'data', 'assets');
const ASSET_TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' };
const PORT = Number(process.env.PORT ?? 8787);
const OPERATOR_KEY = process.env.SYNC_OPERATOR_KEY ?? 'gaza';

let state: AppState = loadState();
const seen: string[] = [];
/** SSE clients, and whether each is an operator (sees pledges awaiting approval). */
const clients = new Map<ServerResponse, boolean>();

interface StoredDonor extends DonorAccount {
  tokenHash: string;
  pledges: number;
  lastPledgeAt: number;
}
const donors: Map<string, StoredDonor> = loadDonors();

function loadDonors(): Map<string, StoredDonor> {
  try {
    if (existsSync(DONORS_FILE)) return new Map((JSON.parse(readFileSync(DONORS_FILE, 'utf8')) as StoredDonor[]).map((d) => [d.id, d]));
  } catch (err) {
    console.warn('Could not read pledger list:', err);
  }
  return new Map();
}
async function saveDonors() {
  await mkdir(dirname(DONORS_FILE), { recursive: true });
  await writeFile(DONORS_FILE, JSON.stringify([...donors.values()]), { mode: 0o600 });
}
const hash = (s: string) => createHash('sha256').update(s).digest('hex');

/** Simple fixed-window rate limiter keyed by IP or pledger. */
const hits = new Map<string, { count: number; reset: number }>();
function limited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  h.count++;
  return h.count > max;
}
const ip = (req: IncomingMessage) => req.socket.remoteAddress ?? 'unknown';

function lanUrls(): string[] {
  const out: string[] = [];
  for (const list of Object.values(networkInterfaces())) {
    for (const n of list ?? []) if (n.family === 'IPv4' && !n.internal) out.push(`http://${n.address}:${PORT}/`);
  }
  return out;
}

function loadState(): AppState {
  try {
    if (existsSync(DATA_FILE)) return normaliseState(JSON.parse(readFileSync(DATA_FILE, 'utf8')));
  } catch (err) {
    console.warn('Could not read saved state, starting fresh:', err);
  }
  return createInitialState();
}

let saveTimer: NodeJS.Timeout | null = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    await mkdir(dirname(DATA_FILE), { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(state));
  }, 250);
}

function commit(action: Action) {
  const next = reducer(state, action);
  if (next === state) return;
  state = next;
  scheduleSave();
  const full = `event: state\ndata: ${JSON.stringify(state)}\n\n`;
  const pub = `event: state\ndata: ${JSON.stringify(redactPending(state))}\n\n`;
  for (const [res, operator] of clients) res.write(operator ? full : pub);
}

// Demo clock: in server mode the server, not a browser, drives Demo Mode,
// so several open devices never multiply the simulated gifts.
function demoLoop() {
  const event = state.events[state.activeEventId];
  const interval = event?.demo.intervalMs ?? 3200;
  if (event?.demo.running) {
    commit({ type: 'demo/tick', eventId: event.id, at: Date.now(), seed: randomInt(2 ** 31) });
  }
  setTimeout(demoLoop, event?.demo.running ? interval : 1000);
}

function keyMatches(given: string | undefined): boolean {
  const a = Buffer.from(given ?? '');
  const b = Buffer.from(OPERATOR_KEY);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function readJson<T>(req: IncomingMessage, limit = 2_000_000): Promise<T> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > limit) throw new Error('Payload too large');
    chunks.push(chunk as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

async function serveStatic(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://local');
  let path = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
  if (!path || path.endsWith('/')) path += 'index.html';
  const file = join(DIST, path);
  if (!file.startsWith(DIST)) return json(res, 403, { error: 'Forbidden' });
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not a file');
    const type = MIME[extname(file)] ?? 'application/octet-stream';
    const immutable = path.startsWith('assets/');
    res.writeHead(200, { 'content-type': type, 'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache' });
    res.end(await readFile(file));
  } catch {
    if (!existsSync(join(DIST, 'index.html'))) {
      res.writeHead(503, { 'content-type': 'text/plain' });
      return res.end('App not built yet. Run `npm run build` first.');
    }
    res.writeHead(200, { 'content-type': MIME['.html'], 'cache-control': 'no-cache' });
    res.end(await readFile(join(DIST, 'index.html')));
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://local');
  const path = url.pathname.replace(/^.*\/api\//, '/api/');
  try {
    if (path === '/api/health') return json(res, 200, { ok: true, service: 'irau-live-sync', rev: state.rev, lanUrls: lanUrls() });
    if (path === '/api/state' && req.method === 'GET') {
      return json(res, 200, keyMatches(req.headers['x-operator-key'] as string | undefined) ? state : redactPending(state));
    }

    if (path === '/api/stream') {
      const operator = keyMatches(url.searchParams.get('key') ?? undefined);
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' });
      res.write(`retry: 2000\nevent: state\ndata: ${JSON.stringify(operator ? state : redactPending(state))}\n\n`);
      clients.set(res, operator);
      const ping = setInterval(() => res.write(': ping\n\n'), 15_000);
      req.on('close', () => {
        clearInterval(ping);
        clients.delete(res);
      });
      return;
    }

    if (path === '/api/auth' && req.method === 'POST') {
      const body = await readJson<{ passcode?: string }>(req, 10_000);
      return keyMatches(body.passcode) ? json(res, 200, { ok: true }) : json(res, 401, { ok: false });
    }

    if (path === '/api/actions' && req.method === 'POST') {
      if (!keyMatches(req.headers['x-operator-key'] as string | undefined)) return json(res, 401, { error: 'Operator passcode required' });
      const body = await readJson<{ actions: { id: string; action: Action }[] }>(req);
      for (const { id, action } of body.actions ?? []) {
        if (!id || seen.includes(id)) continue; // replayed from an offline outbox
        seen.push(id);
        if (seen.length > 5000) seen.splice(0, 1000);
        commit(action);
      }
      return json(res, 200, { ok: true, state });
    }

    if (path === '/api/donor/join' && req.method === 'POST') {
      if (limited(`join:${ip(req)}`, 30, 10 * 60_000)) return json(res, 429, { ok: false, error: 'Too many attempts — please wait a moment and try again.' });
      const input = await readJson<JoinInput>(req, 10_000);
      const event = state.events[state.activeEventId];
      const clean: JoinInput = {
        code: String(input.code ?? ''),
        name: String(input.name ?? ''),
        recognition: (['name', 'family', 'anonymous'] as const).includes(input.recognition) ? input.recognition : 'name',
        mobile: String(input.mobile ?? ''),
        email: String(input.email ?? ''),
        consent: input.consent === true,
      };
      const error = validateJoin(event, clean);
      if (error) return json(res, 200, { ok: false, error });
      const account = makeAccount(event, clean, `donor_${randomBytes(9).toString('hex')}`, Date.now());
      const token = randomBytes(24).toString('hex');
      donors.set(account.id, { ...account, tokenHash: hash(token), pledges: 0, lastPledgeAt: 0 });
      await saveDonors();
      commit({ type: 'donor/joined', eventId: event.id });
      return json(res, 200, { ok: true, session: toSession(account, token) });
    }

    if (path === '/api/pledge' && req.method === 'POST') {
      const body = await readJson<{ donorId?: string; token?: string; amount?: number; levelId?: string }>(req, 10_000);
      const donor = body.donorId ? donors.get(body.donorId) : undefined;
      if (!donor || !body.token || hash(String(body.token)) !== donor.tokenHash) return json(res, 200, { ok: false, error: 'Your session has ended — please join again.' });
      const now = Date.now();
      if (now - donor.lastPledgeAt < 3000 || donor.pledges >= 30 || limited(`pledge:${ip(req)}`, 60, 60_000)) {
        return json(res, 200, { ok: false, error: 'One moment — please wait a few seconds between pledges.' });
      }
      const event = state.events[donor.eventId];
      const amount = Number(body.amount);
      const levelId = typeof body.levelId === 'string' ? body.levelId : undefined;
      const error = pledgeError(event, donor, amount, levelId);
      if (error) return json(res, 200, { ok: false, error });
      const pledge = makePledge(event, donor, amount, `plg_${randomBytes(9).toString('hex')}`, now, levelId);
      commit({ type: 'pledge/submit', pledge });
      donor.pledges++;
      donor.lastPledgeAt = now;
      await saveDonors();
      const after = state.events[event.id];
      if (after.donations.some((d) => d.id === pledge.id)) return json(res, 200, { ok: true, status: 'approved', pledge });
      if (after.pendingPledges.some((d) => d.id === pledge.id)) return json(res, 200, { ok: true, status: 'pending', pledge });
      return json(res, 200, { ok: false, error: 'Your pledge could not be recorded. Please try again.' });
    }

    if (path === '/api/donors' && req.method === 'GET') {
      if (!keyMatches(req.headers['x-operator-key'] as string | undefined)) return json(res, 401, { error: 'Operator passcode required' });
      return json(res, 200, [...donors.values()].map(({ tokenHash: _h, pledges: _p, lastPledgeAt: _l, ...d }) => d));
    }

    if (path === '/api/assets' && req.method === 'POST') {
      if (!keyMatches(req.headers['x-operator-key'] as string | undefined)) return json(res, 401, { error: 'Operator passcode required' });
      const { dataUrl } = await readJson<{ dataUrl?: string }>(req, 3_000_000);
      const m = /^data:([a-z+/]+);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl ?? ''));
      const ext = m ? ASSET_TYPES[m[1]] : undefined;
      if (!m || !ext) return json(res, 400, { error: 'Please upload a PNG, JPG, WebP, GIF or SVG image.' });
      const bytes = Buffer.from(m[2], 'base64');
      if (bytes.length > 2_000_000) return json(res, 400, { error: 'That image is too large (2 MB max).' });
      const name = `${createHash('sha256').update(bytes).digest('hex').slice(0, 24)}.${ext}`;
      await mkdir(ASSETS_DIR, { recursive: true });
      await writeFile(join(ASSETS_DIR, name), bytes);
      return json(res, 200, { name });
    }

    const asset = /^\/api\/assets\/([a-f0-9]{24}\.(png|jpg|webp|gif|svg))$/.exec(path);
    if (asset && req.method === 'GET') {
      try {
        const body = await readFile(join(ASSETS_DIR, asset[1]));
        const type = Object.entries(ASSET_TYPES).find(([, e]) => e === asset[2])![0];
        // Uploaded SVGs are only ever used as <img>; this CSP neuters any script if opened directly.
        res.writeHead(200, { 'content-type': type, 'cache-control': 'public, max-age=31536000, immutable', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'", 'x-content-type-options': 'nosniff' });
        return res.end(body);
      } catch {
        return json(res, 404, { error: 'Not found' });
      }
    }

    if (path.startsWith('/api/')) return json(res, 404, { error: 'Not found' });
    return serveStatic(req, res);
  } catch (err) {
    return json(res, 400, { error: err instanceof Error ? err.message : 'Bad request' });
  }
});

server.listen(PORT, () => {
  console.log(`\n  Islamic Relief Australia · live fundraising sync server`);
  console.log(`  ▸ Launcher        http://localhost:${PORT}/`);
  console.log(`  ▸ Live display    http://localhost:${PORT}/#/live`);
  console.log(`  ▸ Operator        http://localhost:${PORT}/#/admin`);
  console.log(`  ▸ Guest pledging  http://localhost:${PORT}/#/give`);
  for (const u of lanUrls()) console.log(`  ▸ On the network  ${u}  (phones and tablets use this)`);
  if (!process.env.SYNC_OPERATOR_KEY) console.warn(`\n  ⚠ Using the default operator passcode "gaza". Set SYNC_OPERATOR_KEY before a real event.`);
  console.log('');
});

demoLoop();
