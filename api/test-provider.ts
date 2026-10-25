/**
 * Stateless relay for providers that block browser (CORS) requests.
 *
 * Forwards one test request to the provider and returns the classified result.
 * The API key is never logged or stored. Only same-origin browser requests are
 * accepted (plus any origins listed in ALLOWED_ORIGINS, comma-separated).
 */

import { getProviderById, runProviderTest } from '../shared/providers.js';

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
const MAX_KEY_LENGTH = 1024;
const UPSTREAM_TIMEOUT_MS = 10_000;

// Best-effort, per-instance limiter — enough to stop casual abuse of the relay.
const hits = new Map<string, { count: number; resetAt: number }>();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (allowed.includes(origin)) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt <= now) {
    if (hits.size > 10_000) hits.clear();
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

export async function handleTestProvider(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ success: false, message: 'Method not allowed' }, 405);
  }
  if (!isAllowedOrigin(request)) {
    return json({ success: false, message: 'Origin not allowed' }, 403);
  }

  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (isRateLimited(ip)) {
    return json({ success: false, message: 'Too many tests from this IP — wait a minute and try again.' }, 429);
  }

  let body: { apiKey?: unknown; provider?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ success: false, message: 'Invalid JSON body' }, 400);
  }

  const { apiKey, provider } = body ?? {};
  if (typeof apiKey !== 'string' || !apiKey || apiKey.length > MAX_KEY_LENGTH || typeof provider !== 'string') {
    return json({ success: false, message: 'Provider and API key required' }, 400);
  }

  const meta = getProviderById(provider);
  if (!meta) {
    return json({ success: false, message: 'Provider not supported yet' }, 400);
  }

  try {
    const result = await runProviderTest(meta, apiKey.trim(), (req) =>
      fetch(req.url, {
        method: req.method ?? 'GET',
        headers: req.headers,
        body: req.body,
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      })
    );
    return json(result);
  } catch (error) {
    const message = error instanceof Error && error.name === 'TimeoutError'
      ? `Provider did not respond within ${UPSTREAM_TIMEOUT_MS / 1000}s`
      : 'Could not reach the provider';
    return json({ success: false, message: `Network error: ${message}`, endpoint: meta.request('').url }, 502);
  }
}

export default { fetch: handleTestProvider };
