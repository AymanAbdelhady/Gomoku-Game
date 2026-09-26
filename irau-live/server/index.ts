/**
 * Optional realtime sync server — zero dependencies, Node >= 22.18.
 *
 *   npm run build && npm run serve      →  http://<this-machine>:8787
 *
 * Serves the built app from ./dist and a tiny realtime API so an operator
 * tablet, the projector laptop and any confidence monitors share one state
 * across the venue network:
 *
 *   GET  /api/health    service probe used by the app's auto-detection
 *   GET  /api/state     current state snapshot (public: no personal data is stored)
 *   GET  /api/stream    Server-Sent Events: a `state` frame on every change
 *   POST /api/auth      { passcode } → 200 if it matches SYNC_OPERATOR_KEY
 *   POST /api/actions   { actions: [{ id, action }] } (header x-operator-key)
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
import { timingSafeEqual, randomInt } from 'node:crypto';
import type { AppState } from '../src/types/index.ts';
import type { Action } from '../src/state/actions.ts';
import { reducer } from '../src/state/reducer.ts';
import { normaliseState } from '../src/state/store/persistence.ts';
import { createInitialState } from '../src/config/defaults.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const DATA_FILE = join(ROOT, 'server', 'data', 'state.json');
const PORT = Number(process.env.PORT ?? 8787);
const OPERATOR_KEY = process.env.SYNC_OPERATOR_KEY ?? 'gaza';

let state: AppState = loadState();
const seen: string[] = [];
const clients = new Set<ServerResponse>();

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
  const frame = `event: state\ndata: ${JSON.stringify(state)}\n\n`;
  for (const res of clients) res.write(frame);
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
    if (path === '/api/health') return json(res, 200, { ok: true, service: 'irau-live-sync', rev: state.rev });
    if (path === '/api/state' && req.method === 'GET') return json(res, 200, state);

    if (path === '/api/stream') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' });
      res.write(`retry: 2000\nevent: state\ndata: ${JSON.stringify(state)}\n\n`);
      clients.add(res);
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
  console.log(`  ▸ Donor page      http://localhost:${PORT}/#/give`);
  if (!process.env.SYNC_OPERATOR_KEY) console.warn(`\n  ⚠ Using the default operator passcode "gaza". Set SYNC_OPERATOR_KEY before a real event.`);
  console.log('');
});

demoLoop();
