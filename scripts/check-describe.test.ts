// Quick check of describeKey() with sample provider responses.
// Run: node --experimental-strip-types scripts/check-describe.test.ts
import { describeKey, getProviderById } from '../shared/providers.ts'

const cases: [string, unknown, Record<string, string>, string][] = [
  ['github', { login: 'octocat', type: 'User' }, { 'x-oauth-scopes': 'repo, read:org' }, 'ghp_xxx'],
  ['openrouter', { data: { label: 'sk-or-v1-abc...', limit: null, limit_remaining: null, usage: 1.234, is_free_tier: false } }, {}, 'sk-or-v1-x'],
  ['openai', { data: [{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }] }, {}, 'sk-proj-abc'],
  ['stripe', { object: 'balance', livemode: false }, {}, 'rk_test_abc'],
  ['slack', { ok: true, team: 'Acme', user: 'bot', bot_id: 'B1' }, {}, 'xoxb-1'],
  ['gemini', { models: [{ name: 'a' }] }, {}, 'AIza'],
  ['github', 'not json', {}, 'ghp_x'],
]

let failed = 0
for (const [id, body, headers, key] of cases) {
  const meta = getProviderById(id)!
  const out = describeKey(meta, typeof body === 'string' ? body : JSON.stringify(body), new Headers(headers), key)
  console.log(id.padEnd(11), JSON.stringify(out))
  if (id !== 'github' || typeof body !== 'string') {
    if (out.length === 0) { failed++; console.log('  ^ expected details') }
  }
}
process.exit(failed ? 1 : 0)
