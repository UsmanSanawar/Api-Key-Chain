/**
 * apikeychain — check the API keys in a .env file (or environment variables)
 * from the command line or CI. Uses the same provider list and .env parser as
 * https://apikeychain.app, calls each provider directly (no relay, nothing is
 * sent anywhere else) and never prints full keys.
 *
 * Exit codes: 0 all keys valid · 1 at least one key invalid · 2 usage/file error
 * (with --strict, provider errors and unknown keys also exit 1).
 */
import { readFileSync, existsSync } from 'node:fs';
import { parseEnvFile } from '../src/utils/envParser';
import { getProviderById, runProviderTest } from '../shared/providers';
import type { ProviderTestResult } from '../shared/providers';

const VERSION = '1.0.0';
const TIMEOUT_MS = 10_000;

type Row = {
  name: string;
  provider: string | null;
  key: string;
  status: 'valid' | 'invalid' | 'error' | 'skipped';
  message: string;
  latency?: number;
  details?: { label: string; value: string }[];
};

const HELP = `apikeychain ${VERSION} — check that the API keys in a .env file still work

Usage:
  apikeychain [file]            Check keys in a .env file (default: .env)
  apikeychain --env             Check keys in the current environment variables

Options:
  --only NAME1,NAME2   Only check these variable names
  --json               Print results as JSON
  --strict             Also fail on provider errors (timeouts, 5xx) and unrecognised keys
  --quiet              Only print problems
  -h, --help           Show this help
  -v, --version        Show the version

Exit codes: 0 all valid · 1 a key is invalid (or a problem with --strict) · 2 usage error
Keys are sent only to their own provider. Full keys are never printed.`;

function parseArgs(argv: string[]) {
  const opts = { file: '.env', env: false, only: null as Set<string> | null, json: false, strict: false, quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') { console.log(HELP); process.exit(0); }
    else if (a === '-v' || a === '--version') { console.log(VERSION); process.exit(0); }
    else if (a === '--env') opts.env = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--strict') opts.strict = true;
    else if (a === '--quiet') opts.quiet = true;
    else if (a === '--only') opts.only = new Set((argv[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean));
    else if (a.startsWith('--only=')) opts.only = new Set(a.slice(7).split(',').map((s) => s.trim()).filter(Boolean));
    else if (a.startsWith('-')) { console.error(`Unknown option: ${a}\n\n${HELP}`); process.exit(2); }
    else opts.file = a;
  }
  return opts;
}

const mask = (k: string) => (k.length > 12 ? `${k.slice(0, 6)}…${k.slice(-4)}` : '••••');

async function check(provider: string, key: string): Promise<Pick<Row, 'status' | 'message' | 'latency' | 'details'>> {
  const meta = getProviderById(provider);
  if (!meta) return { status: 'skipped', message: 'Provider not supported' };
  let result: ProviderTestResult;
  try {
    result = await runProviderTest(meta, key, (r) =>
      fetch(r.url, { method: r.method ?? 'GET', headers: r.headers, body: r.body, signal: AbortSignal.timeout(TIMEOUT_MS) }),
    );
  } catch (err) {
    const timeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    return { status: 'error', message: timeout ? `No response within ${TIMEOUT_MS / 1000}s` : 'Could not reach the provider' };
  }
  const status = result.success ? 'valid' : result.status && result.status >= 500 ? 'error' : result.status === 404 ? 'error' : 'invalid';
  return { status, message: result.message, latency: result.latency, details: result.details };
}

const COLORS = { valid: '\x1b[32m', invalid: '\x1b[31m', error: '\x1b[33m', skipped: '\x1b[90m', reset: '\x1b[0m' };
const ICON = { valid: '✓', invalid: '✗', error: '!', skipped: '-' };
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (s: Row['status'], text: string) => (useColor ? `${COLORS[s]}${text}${COLORS.reset}` : text);

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  let text: string;
  if (opts.env) {
    text = Object.entries(process.env).map(([k, v]) => `${k}=${JSON.stringify(v ?? '')}`).join('\n');
  } else {
    if (!existsSync(opts.file)) { console.error(`File not found: ${opts.file} (use --env to check environment variables)`); process.exit(2); }
    text = readFileSync(opts.file, 'utf8');
  }

  const entries = parseEnvFile(text).filter((e) => !opts.only || opts.only.has(e.name));
  if (opts.only) {
    for (const name of opts.only) if (!entries.some((e) => e.name === name)) entries.push({ name, value: '', line: 0, provider: null, skipReason: 'not set' });
  }

  const rows: Row[] = [];
  // A few at a time: fast, but gentle on provider rate limits.
  const queue = [...entries];
  await Promise.all(Array.from({ length: 4 }, async () => {
    for (let e = queue.shift(); e; e = queue.shift()) {
      if (!e.provider) {
        rows.push({ name: e.name, provider: null, key: e.value ? mask(e.value) : '', status: 'skipped', message: e.skipReason ?? 'Not recognised as an API key' });
        continue;
      }
      rows.push({ name: e.name, provider: e.provider, key: mask(e.value), ...(await check(e.provider, e.value)) });
    }
  }));
  rows.sort((a, b) => a.name.localeCompare(b.name));

  // Unrecognised values that aren't explicitly requested are noise in a .env (DB URLs, flags…).
  const relevant = rows.filter((r) => r.status !== 'skipped' || opts.only?.has(r.name));
  const count = (s: Row['status']) => relevant.filter((r) => r.status === s).length;
  const failed = count('invalid') > 0 || (opts.strict && (count('error') > 0 || count('skipped') > 0));

  if (opts.json) {
    console.log(JSON.stringify({ ok: !failed, summary: { valid: count('valid'), invalid: count('invalid'), error: count('error'), skipped: count('skipped') }, results: relevant }, null, 2));
  } else {
    if (relevant.length === 0) console.log('No API keys recognised.');
    for (const r of relevant) {
      if (opts.quiet && r.status === 'valid') continue;
      const provider = r.provider ? getProviderById(r.provider)?.name ?? r.provider : '';
      const latency = r.latency !== undefined ? ` (${r.latency} ms)` : '';
      console.log(`${paint(r.status, ICON[r.status])} ${r.name.padEnd(28)} ${provider.padEnd(14)} ${r.key.padEnd(14)} ${paint(r.status, r.message)}${latency}`);
      for (const d of r.details ?? []) console.log(`    ${d.label}: ${d.value}`);
    }
    console.log(`\n${count('valid')} valid · ${count('invalid')} invalid · ${count('error')} errors${count('skipped') ? ` · ${count('skipped')} skipped` : ''}`);
  }
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(2);
});
