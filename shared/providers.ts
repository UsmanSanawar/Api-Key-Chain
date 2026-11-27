/**
 * Single source of truth for every supported provider.
 *
 * Used by the browser (src/providers), the Vercel relay (api/test-provider.ts),
 * the Vite dev server, and copied verbatim into the SaaS edge functions, so
 * this file must stay dependency-free and runtime-agnostic (browser, Node, Deno).
 */

export type ProviderType =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'mistral'
  | 'cohere'
  | 'huggingface'
  | 'groq'
  | 'openrouter'
  | 'together'
  | 'perplexity'
  | 'deepseek'
  | 'github'
  | 'stripe'
  | 'sendgrid'
  | 'xai'
  | 'glm'
  | 'kimi'
  | 'qwen'
  | 'doubao'
  | 'fireworks'
  | 'cerebras'
  | 'nebius'
  | 'deepinfra'
  | 'hyperbolic'
  | 'novita'
  | 'ai21'
  | 'replicate'
  | 'elevenlabs'
  | 'assemblyai'
  | 'deepgram'
  | 'pinecone'
  | 'mailgun'
  | 'brevo'
  | 'postmark'
  | 'resend'
  | 'twilio'
  | 'slack'
  | 'notion'
  | 'gitlab'
  | 'vercel'
  | 'netlify'
  | 'digitalocean'
  | 'cloudflare'
  | 'discord'
  | 'telegram'
  | 'hubspot'
  | 'mailchimp'
  | 'airtable'
  | 'linear'
  | 'heroku'
  | 'sentry'
  | 'mapbox'
  | 'asana'
  | 'square'
  | 'datadog'
  | 'postman'
  | 'render'
  | 'neon'
  | 'lemonsqueezy';

/**
 * `direct` — the provider allows browser (CORS) requests, so the key goes
 * straight from the browser to the provider.
 * `proxy` — the provider blocks browser requests, so the test is relayed
 * through the stateless /api/test-provider function.
 */
export type Transport = 'direct' | 'proxy';

export type ProviderRequest = {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
};

export type Verdict = { success: boolean; message: string };

/** One fact about a valid key, read from the provider's own response (e.g. account, scopes, credit). */
export type KeyDetail = { label: string; value: string };

export type ProviderMeta = {
  id: ProviderType;
  name: string;
  color: string;
  detectPattern: RegExp | null;
  order: number;
  detectPriority: number;
  /** Empty string renders an initials badge instead of an image. */
  logoUrl: string;
  transport: Transport;
  request: (apiKey: string) => ProviderRequest;
  /**
   * Other endpoints (e.g. other regions) tried in order when the previous one
   * rejects the key with 401/403.
   */
  fallbackRequests?: (apiKey: string) => ProviderRequest[];
  /** Provider-specific interpretation; return undefined to use the default mapping. */
  interpret?: (status: number, body: string, apiKey: string) => Verdict | undefined;
  /**
   * Facts about a valid key taken from the successful response only (no extra
   * requests). Never include email addresses or other personal data.
   */
  describe?: (body: unknown, headers: Headers | null, apiKey: string) => KeyDetail[];
};

// ── Helpers for describe() ─────────────────────────────────────────

/** Reads a nested field; returns a short string for strings/numbers/booleans, else undefined. */
function field(obj: unknown, path: string): string | undefined {
  let cur: unknown = obj;
  for (const part of path.split('.')) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  if (typeof cur === 'string') return cur.trim() ? cur.slice(0, 120) : undefined;
  if (typeof cur === 'number' && Number.isFinite(cur)) return String(cur);
  if (typeof cur === 'boolean') return cur ? 'yes' : 'no';
  return undefined;
}

function details(...pairs: [string, string | undefined | null][]): KeyDetail[] {
  return pairs
    .filter((p): p is [string, string] => typeof p[1] === 'string' && p[1] !== '')
    .map(([label, value]) => ({ label, value }));
}

/** "Models available" for OpenAI-style { data: [...] } or Gemini-style { models: [...] } lists. */
function modelCount(body: unknown): KeyDetail[] {
  if (!body || typeof body !== 'object') return [];
  const b = body as Record<string, unknown>;
  const list = Array.isArray(b.data) ? b.data : Array.isArray(b.models) ? b.models : null;
  return list && list.length > 0 ? [{ label: 'Models available', value: String(list.length) }] : [];
}

const usd = (v: string | undefined) => (v !== undefined && !Number.isNaN(Number(v)) ? `$${Number(v).toFixed(2)}` : undefined);

const bearer = (apiKey: string) => ({ Authorization: `Bearer ${apiKey}` });

export const PROVIDERS: ProviderMeta[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    color: 'bg-green-600',
    detectPattern: /^sk-(proj-[^.]*\.|.*T3BlbkFJ)/,
    order: 10,
    detectPriority: 90,
    logoUrl: '/providers/openai.svg',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.openai.com/v1/models', headers: bearer(apiKey) }),
    describe: (_body, _headers, apiKey) =>
      details(['Key type', apiKey.startsWith('sk-proj-') ? 'Project key' : apiKey.startsWith('sk-svcacct-') ? 'Service account key' : undefined]),
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    color: 'bg-orange-600',
    detectPattern: /^sk-ant-/,
    order: 20,
    detectPriority: 10,
    logoUrl: '/providers/anthropic.svg',
    transport: 'direct',
    request: (apiKey) => ({
      url: 'https://api.anthropic.com/v1/models',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // Required for Anthropic to answer CORS preflights from browsers.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
    }),
    describe: (_body, _headers, apiKey) =>
      details(['Key type', apiKey.startsWith('sk-ant-admin') ? 'Admin key' : apiKey.startsWith('sk-ant-api') ? 'API key' : undefined]),
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    color: 'bg-blue-600',
    detectPattern: /^AIza[0-9A-Za-z_-]{35}/,
    order: 30,
    detectPriority: 80,
    logoUrl: '/providers/gemini.svg',
    transport: 'direct',
    // Header instead of ?key= so the key never lands in URLs or logs.
    request: (apiKey) => ({
      url: 'https://generativelanguage.googleapis.com/v1beta/models',
      headers: { 'x-goog-api-key': apiKey },
    }),
  },
  {
    id: 'mistral',
    name: 'Mistral',
    color: 'bg-rose-600',
    detectPattern: null,
    order: 40,
    detectPriority: 999,
    logoUrl: '/providers/mistral.svg',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.mistral.ai/v1/models', headers: bearer(apiKey) }),
  },
  {
    id: 'cohere',
    name: 'Cohere',
    color: 'bg-emerald-600',
    // Cohere documents no key prefix, so keys are selected manually.
    detectPattern: null,
    order: 50,
    detectPriority: 999,
    logoUrl: '/providers/cohere.svg',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.cohere.com/v1/models', headers: bearer(apiKey) }),
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    color: 'bg-yellow-600',
    detectPattern: /^hf_[A-Za-z0-9]{34,}/,
    order: 60,
    detectPriority: 100,
    logoUrl: '/providers/huggingface.svg',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://huggingface.co/api/whoami-v2', headers: bearer(apiKey) }),
    describe: (body) =>
      details(
        ['Account', field(body, 'name')],
        ['Token name', field(body, 'auth.accessToken.displayName')],
        ['Token role', field(body, 'auth.accessToken.role')],
      ),
  },
  {
    id: 'groq',
    name: 'Groq',
    color: 'bg-indigo-600',
    detectPattern: /^gsk_/,
    order: 70,
    detectPriority: 20,
    logoUrl: '/providers/groq.svg',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.groq.com/openai/v1/models', headers: bearer(apiKey) }),
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    color: 'bg-cyan-600',
    detectPattern: /^sk-or-/,
    order: 80,
    detectPriority: 15,
    logoUrl: '/providers/openrouter.svg',
    transport: 'direct',
    // /models is public; /key requires a valid key.
    request: (apiKey) => ({ url: 'https://openrouter.ai/api/v1/key', headers: bearer(apiKey) }),
    describe: (body) =>
      details(
        ['Key label', field(body, 'data.label')],
        ['Credit limit', field(body, 'data.limit') === undefined ? 'No limit' : usd(field(body, 'data.limit'))],
        ['Credit remaining', usd(field(body, 'data.limit_remaining'))],
        ['Used', usd(field(body, 'data.usage'))],
        ['Free tier', field(body, 'data.is_free_tier')],
      ),
  },
  {
    id: 'together',
    name: 'Together',
    color: 'bg-fuchsia-600',
    detectPattern: null,
    order: 90,
    detectPriority: 999,
    logoUrl: '/providers/together.svg',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.together.xyz/v1/models', headers: bearer(apiKey) }),
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    color: 'bg-violet-600',
    detectPattern: /^pplx-/,
    order: 100,
    detectPriority: 50,
    logoUrl: '/providers/perplexity.svg',
    transport: 'direct',
    // /models (no prefix) answers 404; the orchestrator model list requires a valid key.
    request: (apiKey) => ({ url: 'https://api.perplexity.ai/orchestrator/v1/models', headers: bearer(apiKey) }),
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    color: 'bg-lime-600',
    detectPattern: /^xai-/,
    order: 105,
    detectPriority: 55,
    logoUrl: "data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.30047 8.77631L12.0474 23H16.3799L6.63183 8.77631H2.30047ZM6.6285 16.6762L2.29492 23H6.63072L8.79584 19.8387L6.6285 16.6762ZM17.3709 1L9.88007 11.9308L12.0474 15.0944L21.7067 1H17.3709ZM18.1555 7.76374V23H21.7067V2.5818L18.1555 7.76374Z' fill='%23000'/%3E%3C/svg%3E",
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.x.ai/v1/models', headers: bearer(apiKey) }),
  },
  {
    id: 'glm',
    name: 'GLM (Z.ai / ZhiPu)',
    color: 'bg-pink-600',
    detectPattern: null,
    order: 115,
    detectPriority: 999,
    logoUrl: '/providers/glm.svg',
    transport: 'direct',
    // International (z.ai) first, then mainland China (bigmodel.cn).
    request: (apiKey) => ({ url: 'https://api.z.ai/api/paas/v4/models', headers: bearer(apiKey) }),
    fallbackRequests: (apiKey) => [
      { url: 'https://open.bigmodel.cn/api/paas/v4/models', headers: bearer(apiKey) },
    ],
  },
  {
    id: 'kimi',
    name: 'Kimi (Moonshot)',
    color: 'bg-slate-600',
    detectPattern: null,
    order: 117,
    detectPriority: 999,
    logoUrl: '/providers/kimi.png',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.moonshot.ai/v1/models', headers: bearer(apiKey) }),
    fallbackRequests: (apiKey) => [{ url: 'https://api.moonshot.cn/v1/models', headers: bearer(apiKey) }],
  },
  {
    id: 'qwen',
    name: 'Qwen (Alibaba)',
    color: 'bg-red-600',
    detectPattern: null,
    order: 118,
    detectPriority: 999,
    logoUrl: '/providers/qwen.svg',
    transport: 'direct',
    request: (apiKey) => ({
      url: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models',
      headers: bearer(apiKey),
    }),
    fallbackRequests: (apiKey) => [
      { url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/models', headers: bearer(apiKey) },
    ],
  },
  {
    id: 'doubao',
    name: 'Doubao (ByteDance)',
    color: 'bg-blue-500',
    detectPattern: null,
    order: 119,
    detectPriority: 999,
    logoUrl: '/providers/doubao.jpg',
    transport: 'proxy',
    request: (apiKey) => ({ url: 'https://ark.cn-beijing.volces.com/api/v3/models', headers: bearer(apiKey) }),
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    color: 'bg-sky-600',
    detectPattern: /^sk-[a-f0-9]{32}$/,
    order: 120,
    detectPriority: 30,
    logoUrl: '/providers/deepseek.svg',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.deepseek.com/v1/models', headers: bearer(apiKey) }),
  },
  {
    id: 'stripe',
    name: 'Stripe',
    color: 'bg-purple-700',
    detectPattern: /^(sk|rk)_(test|live)_/,
    order: 125,
    detectPriority: 75,
    logoUrl: '/providers/stripe.svg',
    transport: 'direct',
    // Balance holds no customer PII, unlike /v1/customers.
    request: (apiKey) => ({ url: 'https://api.stripe.com/v1/balance', headers: bearer(apiKey) }),
    interpret: (status, _body, apiKey) =>
      status === 403 && apiKey.startsWith('rk_')
        ? { success: true, message: 'Restricted key is valid (it lacks the Balance read permission used for this test)' }
        : undefined,
    describe: (body, _headers, apiKey) =>
      details(
        ['Mode', /^(sk|rk)_live_/.test(apiKey) ? 'Live' : /^(sk|rk)_test_/.test(apiKey) ? 'Test' : field(body, 'livemode') === 'yes' ? 'Live' : undefined],
        ['Key type', apiKey.startsWith('rk_') ? 'Restricted key' : apiKey.startsWith('sk_') ? 'Secret key' : undefined],
      ),
  },
  {
    id: 'github',
    name: 'GitHub',
    color: 'bg-gray-700',
    detectPattern: /^(ghp_|github_pat_)/,
    order: 130,
    detectPriority: 60,
    logoUrl: '/providers/github.png',
    transport: 'direct',
    request: (apiKey) => ({
      url: 'https://api.github.com/user',
      headers: {
        ...bearer(apiKey),
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }),
    describe: (body, headers) => {
      const scopes = headers?.get('x-oauth-scopes');
      return details(
        ['Account', field(body, 'login')],
        ['Account type', field(body, 'type')],
        ['Scopes', scopes === null || scopes === undefined ? undefined : scopes.trim() || 'none'],
      );
    },
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    color: 'bg-blue-700',
    detectPattern: /^SG\./,
    order: 150,
    detectPriority: 95,
    logoUrl: '/providers/sendgrid.png',
    transport: 'proxy',
    request: (apiKey) => ({ url: 'https://api.sendgrid.com/v3/scopes', headers: bearer(apiKey) }),
    describe: (body) => {
      const scopes = (body as { scopes?: unknown })?.scopes;
      if (!Array.isArray(scopes)) return [];
      return details(
        ['Scopes', String(scopes.length)],
        ['Can send mail', scopes.includes('mail.send') ? 'yes' : 'no'],
      );
    },
  },

  // ── AI inference ───────────────────────────────────────────────────
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    color: 'bg-orange-500',
    detectPattern: /^fw_/,
    order: 121,
    detectPriority: 40,
    logoUrl: '/providers/fireworks.svg',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.fireworks.ai/inference/v1/models', headers: bearer(apiKey) }),
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    color: 'bg-orange-700',
    detectPattern: /^csk-/,
    order: 122,
    detectPriority: 41,
    logoUrl: '/providers/cerebras.png',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.cerebras.ai/v1/models', headers: bearer(apiKey) }),
  },
  {
    id: 'nebius',
    name: 'Nebius Token Factory',
    color: 'bg-teal-600',
    detectPattern: null,
    order: 123,
    detectPriority: 999,
    logoUrl: '/providers/nebius.svg',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.tokenfactory.nebius.com/v1/models', headers: bearer(apiKey) }),
  },
  {
    id: 'deepinfra',
    name: 'DeepInfra',
    color: 'bg-indigo-700',
    detectPattern: null,
    order: 124,
    detectPriority: 999,
    logoUrl: '/providers/deepinfra.png',
    transport: 'direct',
    // /v1/openai/models answers 200 without a key; /v1/me requires one.
    request: (apiKey) => ({ url: 'https://api.deepinfra.com/v1/me', headers: bearer(apiKey) }),
  },
  {
    id: 'hyperbolic',
    name: 'Hyperbolic',
    color: 'bg-zinc-700',
    // Keys start with sk_live_, same as Stripe live keys — select manually.
    detectPattern: null,
    order: 126,
    detectPriority: 999,
    logoUrl: '/providers/hyperbolic.png',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.hyperbolic.ai/inference/v1/models', headers: bearer(apiKey) }),
  },
  {
    id: 'novita',
    name: 'Novita AI',
    color: 'bg-emerald-700',
    detectPattern: null,
    order: 127,
    detectPriority: 999,
    logoUrl: '/providers/novita.png',
    transport: 'direct',
    // The model list is public; the balance endpoint requires a valid key.
    request: (apiKey) => ({ url: 'https://api.novita.ai/openapi/v1/billing/balance/detail', headers: bearer(apiKey) }),
  },
  {
    id: 'ai21',
    name: 'AI21 Labs',
    color: 'bg-pink-700',
    detectPattern: null,
    order: 128,
    detectPriority: 999,
    logoUrl: '/providers/ai21.png',
    transport: 'direct',
    // /studio/v1/models answers 200 for any key; the file library requires a valid one.
    request: (apiKey) => ({ url: 'https://api.ai21.com/studio/v1/library/files', headers: bearer(apiKey) }),
  },
  {
    id: 'replicate',
    name: 'Replicate',
    color: 'bg-neutral-700',
    detectPattern: /^r8_/,
    order: 129,
    detectPriority: 42,
    logoUrl: '/providers/replicate.svg',
    transport: 'proxy',
    request: (apiKey) => ({ url: 'https://api.replicate.com/v1/account', headers: bearer(apiKey) }),
    describe: (body) => details(['Account', field(body, 'username')], ['Account type', field(body, 'type')]),
  },

  // ── Voice & vector ────────────────────────────────────────────────
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    color: 'bg-stone-700',
    detectPattern: null,
    order: 131,
    detectPriority: 999,
    logoUrl: '/providers/elevenlabs.svg',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.elevenlabs.io/v1/user', headers: { 'xi-api-key': apiKey } }),
    describe: (body) => {
      const used = field(body, 'subscription.character_count');
      const limit = field(body, 'subscription.character_limit');
      return details(
        ['Plan', field(body, 'subscription.tier')],
        ['Characters used', used && limit ? `${Number(used).toLocaleString('en-US')} / ${Number(limit).toLocaleString('en-US')}` : undefined],
      );
    },
  },
  {
    id: 'assemblyai',
    name: 'AssemblyAI',
    color: 'bg-blue-800',
    detectPattern: null,
    order: 132,
    detectPriority: 999,
    logoUrl: '/providers/assemblyai.png',
    transport: 'direct',
    // AssemblyAI takes the raw key in Authorization (no "Bearer").
    request: (apiKey) => ({ url: 'https://api.assemblyai.com/v2/transcript?limit=1', headers: { Authorization: apiKey } }),
  },
  {
    id: 'deepgram',
    name: 'Deepgram',
    color: 'bg-green-800',
    detectPattern: null,
    order: 133,
    detectPriority: 999,
    logoUrl: '/providers/deepgram.svg',
    transport: 'proxy',
    request: (apiKey) => ({ url: 'https://api.deepgram.com/v1/projects', headers: { Authorization: `Token ${apiKey}` } }),
    describe: (body) => {
      const projects = (body as { projects?: unknown })?.projects;
      return Array.isArray(projects) ? details(['Projects', String(projects.length)]) : [];
    },
  },
  {
    id: 'pinecone',
    name: 'Pinecone',
    color: 'bg-cyan-800',
    detectPattern: /^pcsk_/,
    order: 134,
    detectPriority: 43,
    logoUrl: '/providers/pinecone.png',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.pinecone.io/indexes', headers: { 'Api-Key': apiKey } }),
    describe: (body) => {
      const indexes = (body as { indexes?: unknown })?.indexes;
      return Array.isArray(indexes) ? details(['Indexes', String(indexes.length)]) : [];
    },
  },

  // ── Email & messaging ─────────────────────────────────────────────
  {
    id: 'mailgun',
    name: 'Mailgun',
    color: 'bg-red-700',
    detectPattern: null,
    order: 151,
    detectPriority: 999,
    logoUrl: '/providers/mailgun.svg',
    transport: 'direct',
    // US region first, then EU.
    request: (apiKey) => ({ url: 'https://api.mailgun.net/v4/domains', headers: { Authorization: `Basic ${btoa(`api:${apiKey}`)}` } }),
    fallbackRequests: (apiKey) => [
      { url: 'https://api.eu.mailgun.net/v4/domains', headers: { Authorization: `Basic ${btoa(`api:${apiKey}`)}` } },
    ],
  },
  {
    id: 'brevo',
    name: 'Brevo',
    color: 'bg-teal-700',
    detectPattern: /^xkeysib-/,
    order: 152,
    detectPriority: 44,
    logoUrl: '/providers/brevo.svg',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.brevo.com/v3/account', headers: { 'api-key': apiKey } }),
    describe: (body) => {
      const plans = (body as { plan?: unknown })?.plan;
      const first = Array.isArray(plans) ? plans[0] : undefined;
      return details(['Company', field(body, 'companyName')], ['Plan', field(first, 'type')]);
    },
  },
  {
    id: 'postmark',
    name: 'Postmark',
    color: 'bg-yellow-700',
    detectPattern: null,
    order: 153,
    detectPriority: 999,
    logoUrl: '/providers/postmark.png',
    transport: 'proxy',
    // Server token first, then account token (Postmark answers 401 for the wrong token type).
    request: (apiKey) => ({
      url: 'https://api.postmarkapp.com/server',
      headers: { 'X-Postmark-Server-Token': apiKey, Accept: 'application/json' },
    }),
    fallbackRequests: (apiKey) => [
      {
        url: 'https://api.postmarkapp.com/servers?count=1&offset=0',
        headers: { 'X-Postmark-Account-Token': apiKey, Accept: 'application/json' },
      },
    ],
    describe: (body) => details(['Server', field(body, 'Name')]),
  },
  {
    id: 'resend',
    name: 'Resend',
    color: 'bg-black',
    detectPattern: /^re_/,
    order: 154,
    detectPriority: 45,
    logoUrl: '/providers/resend.svg',
    transport: 'proxy',
    // Resend rejects requests without a User-Agent (browsers can't set one, so this goes via the relay).
    request: (apiKey) => ({ url: 'https://api.resend.com/domains', headers: { ...bearer(apiKey), 'User-Agent': 'ApiKeyChain/1.0' } }),
    interpret: (status, body) => {
      if (status === 401 && body.includes('restricted_api_key')) {
        return { success: true, message: 'API key is valid (sending-only key; it cannot read domains)' };
      }
      if (status === 400 && /api key is invalid/i.test(body)) {
        return { success: false, message: 'Invalid API key (Resend: "API key is invalid")' };
      }
      return undefined;
    },
  },
  {
    id: 'twilio',
    name: 'Twilio',
    color: 'bg-red-600',
    detectPattern: null,
    order: 155,
    detectPriority: 999,
    logoUrl: '/providers/twilio.png',
    transport: 'direct',
    // Enter as "AccountSID:AuthToken" or "ApiKeySID:ApiKeySecret".
    request: (apiKey) => ({
      url: 'https://api.twilio.com/2010-04-01/Accounts.json',
      headers: { Authorization: `Basic ${btoa(apiKey)}` },
    }),
    interpret: (status, _body, apiKey) =>
      status === 401 && !apiKey.includes(':')
        ? { success: false, message: 'Twilio needs both parts — enter it as AccountSID:AuthToken (or ApiKeySID:ApiKeySecret)' }
        : undefined,
    describe: (body) => {
      const accounts = (body as { accounts?: unknown })?.accounts;
      const first = Array.isArray(accounts) ? accounts[0] : undefined;
      return details(['Account', field(first, 'friendly_name')], ['Account type', field(first, 'type')], ['Status', field(first, 'status')]);
    },
  },
  {
    id: 'slack',
    name: 'Slack',
    color: 'bg-purple-800',
    detectPattern: /^(xoxb-|xoxp-|xapp-)/,
    order: 156,
    detectPriority: 46,
    logoUrl: '/providers/slack.png',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://slack.com/api/auth.test', headers: bearer(apiKey) }),
    // Slack answers HTTP 200 with {"ok": false} for bad tokens.
    interpret: (status, body) => {
      if (status !== 200) return undefined;
      try {
        const parsed = JSON.parse(body) as { ok?: boolean; error?: string };
        return parsed.ok
          ? { success: true, message: 'Token is valid' }
          : { success: false, message: `Invalid token (${parsed.error ?? 'not ok'})` };
      } catch {
        return undefined;
      }
    },
    describe: (body) =>
      field(body, 'ok') === 'yes'
        ? details(['Workspace', field(body, 'team')], ['User', field(body, 'user')], ['Bot', field(body, 'bot_id') ? 'yes' : 'no'])
        : [],
  },

  // ── Developer platforms ───────────────────────────────────────────
  {
    id: 'notion',
    name: 'Notion',
    color: 'bg-neutral-800',
    detectPattern: /^(ntn_|secret_)/,
    order: 160,
    detectPriority: 47,
    logoUrl: '/providers/notion.svg',
    transport: 'direct',
    request: (apiKey) => ({
      url: 'https://api.notion.com/v1/users/me',
      headers: { ...bearer(apiKey), 'Notion-Version': '2022-06-28' },
    }),
    describe: (body) => details(['Integration', field(body, 'name')], ['Workspace', field(body, 'bot.workspace_name')]),
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    color: 'bg-orange-600',
    detectPattern: /^glpat-/,
    order: 161,
    detectPriority: 48,
    logoUrl: '/providers/gitlab.svg',
    transport: 'direct',
    // gitlab.com only — self-managed instances use their own host.
    request: (apiKey) => ({ url: 'https://gitlab.com/api/v4/user', headers: { 'PRIVATE-TOKEN': apiKey } }),
    describe: (body) => details(['Account', field(body, 'username')], ['Bot account', field(body, 'bot')]),
  },
  {
    id: 'vercel',
    name: 'Vercel',
    color: 'bg-black',
    detectPattern: /^vcp_/,
    order: 162,
    detectPriority: 49,
    logoUrl: '/providers/vercel.svg',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.vercel.com/v2/user', headers: bearer(apiKey) }),
    // Vercel answers 403 {"invalidToken": true} for bad tokens.
    interpret: (status, body) =>
      status === 403 && body.includes('invalidToken') ? { success: false, message: 'Invalid or expired token (403)' } : undefined,
    describe: (body) => details(['Account', field(body, 'user.username')]),
  },
  {
    id: 'netlify',
    name: 'Netlify',
    color: 'bg-teal-500',
    detectPattern: null,
    order: 163,
    detectPriority: 999,
    logoUrl: '/providers/netlify.svg',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.netlify.com/api/v1/user', headers: bearer(apiKey) }),
    describe: (body) => details(['Account', field(body, 'slug')], ['Name', field(body, 'full_name')]),
  },
  {
    id: 'digitalocean',
    name: 'DigitalOcean',
    color: 'bg-blue-600',
    detectPattern: /^dop_v1_/,
    order: 164,
    detectPriority: 51,
    logoUrl: '/providers/digitalocean.svg',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.digitalocean.com/v2/account', headers: bearer(apiKey) }),
    describe: (body) =>
      details(['Account status', field(body, 'account.status')], ['Droplet limit', field(body, 'account.droplet_limit')], ['Team', field(body, 'account.team.name')]),
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    color: 'bg-orange-500',
    detectPattern: /^cfut_/,
    order: 165,
    detectPriority: 52,
    logoUrl: '/providers/cloudflare.svg',
    transport: 'proxy',
    // User API tokens only (account tokens need an account id).
    request: (apiKey) => ({ url: 'https://api.cloudflare.com/client/v4/user/tokens/verify', headers: bearer(apiKey) }),
    interpret: (status, body) => {
      if (status === 400) return { success: false, message: 'Invalid API token (malformed)' };
      if (status !== 200) return undefined;
      try {
        const tokenStatus = (JSON.parse(body) as { result?: { status?: string } }).result?.status;
        return tokenStatus === 'active'
          ? { success: true, message: 'API token is valid and active' }
          : { success: false, message: `API token is ${tokenStatus ?? 'not active'}` };
      } catch {
        return undefined;
      }
    },
    describe: (body) =>
      details(['Token status', field(body, 'result.status')], ['Expires', field(body, 'result.expires_on')?.slice(0, 10)]),
  },
  // ── Developer & business tools (verified against each provider's API docs, 2026-11) ──
  {
    // https://docs.discord.com/developers/resources/user (GET /users/@me, "Bot <token>")
    id: 'discord',
    name: 'Discord (bot)',
    color: 'bg-indigo-500',
    detectPattern: null,
    order: 170,
    detectPriority: 999,
    logoUrl: '',
    transport: 'proxy',
    request: (apiKey) => ({
      url: 'https://discord.com/api/v10/users/@me',
      // Discord requires a descriptive User-Agent for bot requests.
      headers: { Authorization: `Bot ${apiKey}`, 'User-Agent': 'DiscordBot (https://apikeychain.app, 1.0)' },
    }),
    describe: (body) => details(['Bot', field(body, 'username')], ['Is bot', field(body, 'bot')]),
  },
  {
    // https://core.telegram.org/bots/api#getme
    id: 'telegram',
    name: 'Telegram (bot)',
    color: 'bg-sky-500',
    detectPattern: /^\d{6,12}:[A-Za-z0-9_-]{30,}$/,
    order: 171,
    detectPriority: 60,
    logoUrl: '',
    transport: 'proxy',
    request: (apiKey) => ({ url: `https://api.telegram.org/bot${encodeURIComponent(apiKey)}/getMe` }),
    interpret: (status, body) => {
      // A wrong token returns 401, a malformed one 404 (the token is part of the path).
      if (status === 401 || status === 404) return { success: false, message: 'Invalid bot token' };
      if (status !== 200) return undefined;
      try {
        return (JSON.parse(body) as { ok?: boolean }).ok ? { success: true, message: 'Bot token is valid' } : { success: false, message: 'Invalid bot token' };
      } catch {
        return undefined;
      }
    },
    describe: (body) => details(['Bot', field(body, 'result.username') ? `@${field(body, 'result.username')}` : undefined], ['Name', field(body, 'result.first_name')]),
  },
  {
    // https://developers.hubspot.com/docs/api-reference/account-account-info-v3/details/get-account-info-v3-details
    id: 'hubspot',
    name: 'HubSpot',
    color: 'bg-orange-500',
    detectPattern: null,
    order: 172,
    detectPriority: 999,
    logoUrl: '',
    transport: 'proxy',
    request: (apiKey) => ({ url: 'https://api.hubapi.com/account-info/v3/details', headers: bearer(apiKey) }),
    describe: (body) => details(['Portal ID', field(body, 'portalId')], ['Account type', field(body, 'accountType')], ['Data hosting', field(body, 'dataHostingLocation')]),
  },
  {
    // https://mailchimp.com/developer/marketing/guides/quick-start/ (GET /3.0/ping; the -usN suffix is the data center)
    id: 'mailchimp',
    name: 'Mailchimp',
    color: 'bg-yellow-500',
    detectPattern: /^[0-9a-f]{32}-us\d{1,2}$/,
    order: 173,
    detectPriority: 61,
    logoUrl: '',
    transport: 'proxy',
    request: (apiKey) => {
      const dc = /-(us\d{1,2})$/.exec(apiKey)?.[1] ?? 'us1';
      return { url: `https://${dc}.api.mailchimp.com/3.0/ping`, headers: bearer(apiKey) };
    },
  },
  {
    // https://airtable.com/developers/web/api/get-user-id-scopes
    id: 'airtable',
    name: 'Airtable',
    color: 'bg-blue-500',
    detectPattern: null,
    order: 174,
    detectPriority: 999,
    logoUrl: '',
    transport: 'proxy',
    request: (apiKey) => ({ url: 'https://api.airtable.com/v0/meta/whoami', headers: bearer(apiKey) }),
  },
  {
    // https://linear.app/developers/graphql (personal keys: "Authorization: <key>", no Bearer)
    id: 'linear',
    name: 'Linear',
    color: 'bg-violet-600',
    detectPattern: null,
    order: 175,
    detectPriority: 999,
    logoUrl: '',
    transport: 'proxy',
    request: (apiKey) => ({
      url: 'https://api.linear.app/graphql',
      method: 'POST',
      headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ viewer { name } }' }),
    }),
    interpret: (status, body) => {
      if (status !== 200) return undefined;
      try {
        const parsed = JSON.parse(body) as { data?: { viewer?: unknown }; errors?: { message?: string }[] };
        return parsed.data?.viewer ? { success: true, message: 'API key is valid' } : { success: false, message: parsed.errors?.[0]?.message ?? 'Invalid API key' };
      } catch {
        return undefined;
      }
    },
    describe: (body) => details(['User', field(body, 'data.viewer.name')]),
  },
  {
    // https://devcenter.heroku.com/articles/platform-api-reference#account-info
    id: 'heroku',
    name: 'Heroku',
    color: 'bg-purple-700',
    detectPattern: null,
    order: 176,
    detectPriority: 999,
    logoUrl: '',
    transport: 'proxy',
    request: (apiKey) => ({ url: 'https://api.heroku.com/account', headers: { ...bearer(apiKey), Accept: 'application/vnd.heroku+json; version=3' } }),
    describe: (body) => details(['Name', field(body, 'name')], ['Default team', field(body, 'default_team.name')]),
  },
  {
    // https://docs.sentry.io/api/users/retrieve-the-current-credentials/ (sentry.io only, not self-hosted)
    id: 'sentry',
    name: 'Sentry',
    color: 'bg-purple-900',
    detectPattern: null,
    order: 177,
    detectPriority: 999,
    logoUrl: '',
    transport: 'proxy',
    request: (apiKey) => ({ url: 'https://sentry.io/api/0/', headers: bearer(apiKey) }),
    interpret: (status, body) => {
      if (status !== 200) return undefined;
      // An unauthenticated call also returns 200, with no "auth" object.
      try {
        return (JSON.parse(body) as { auth?: unknown }).auth ? { success: true, message: 'Auth token is valid' } : { success: false, message: 'Invalid auth token' };
      } catch {
        return undefined;
      }
    },
    describe: (body) => {
      const scopes = (body as { auth?: { scopes?: unknown } })?.auth?.scopes;
      return details(['Scopes', Array.isArray(scopes) ? scopes.join(', ').slice(0, 120) : undefined], ['User', field(body, 'user.username')]);
    },
  },
  {
    // https://docs.mapbox.com/api/accounts/tokens/#retrieve-a-token (200 for any token: check "code")
    id: 'mapbox',
    name: 'Mapbox',
    color: 'bg-slate-700',
    detectPattern: /^(pk|sk|tk)\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    order: 178,
    detectPriority: 62,
    logoUrl: '',
    transport: 'proxy',
    request: (apiKey) => ({ url: `https://api.mapbox.com/tokens/v2?access_token=${encodeURIComponent(apiKey)}` }),
    interpret: (status, body) => {
      if (status !== 200) return undefined;
      try {
        const code = (JSON.parse(body) as { code?: string }).code;
        return code === 'TokenValid' ? { success: true, message: 'Access token is valid' } : { success: false, message: `Token not valid (${code ?? 'unknown'})` };
      } catch {
        return undefined;
      }
    },
    describe: (body, _headers, apiKey) =>
      details(['Token type', apiKey.startsWith('sk.') ? 'Secret' : apiKey.startsWith('pk.') ? 'Public' : apiKey.startsWith('tk.') ? 'Temporary' : undefined], ['Account', field(body, 'token.user')]),
  },
  {
    // https://developers.asana.com/reference/getuser (users/me)
    id: 'asana',
    name: 'Asana',
    color: 'bg-rose-500',
    detectPattern: null,
    order: 179,
    detectPriority: 999,
    logoUrl: '',
    transport: 'proxy',
    request: (apiKey) => ({ url: 'https://app.asana.com/api/1.0/users/me', headers: bearer(apiKey) }),
    describe: (body) => details(['User', field(body, 'data.name')]),
  },
  {
    // https://developer.squareup.com/reference/square/merchants-api/retrieve-merchant
    id: 'square',
    name: 'Square',
    color: 'bg-gray-800',
    detectPattern: null,
    order: 180,
    detectPriority: 999,
    logoUrl: '',
    transport: 'proxy',
    request: (apiKey) => ({ url: 'https://connect.squareup.com/v2/merchants/me', headers: bearer(apiKey) }),
    // Sandbox tokens only work on the sandbox host.
    fallbackRequests: (apiKey) => [{ url: 'https://connect.squareupsandbox.com/v2/merchants/me', headers: bearer(apiKey) }],
    describe: (body) => details(['Business', field(body, 'merchant.business_name')], ['Country', field(body, 'merchant.country')]),
  },
  {
    // https://docs.datadoghq.com/api/latest/authentication/ (GET /api/v1/validate; one host per Datadog site)
    id: 'datadog',
    name: 'Datadog',
    color: 'bg-purple-600',
    detectPattern: null,
    order: 181,
    detectPriority: 999,
    logoUrl: '',
    transport: 'proxy',
    request: (apiKey) => ({ url: 'https://api.datadoghq.com/api/v1/validate', headers: { 'DD-API-KEY': apiKey } }),
    // Datadog answers 403 for an unknown key (on every site).
    interpret: (status) => (status === 403 ? { success: false, message: 'Invalid API key (not valid on any Datadog site)' } : undefined),
    fallbackRequests: (apiKey) =>
      ['api.datadoghq.eu', 'api.us3.datadoghq.com', 'api.us5.datadoghq.com', 'api.ap1.datadoghq.com'].map((host) => ({
        url: `https://${host}/api/v1/validate`,
        headers: { 'DD-API-KEY': apiKey },
      })),
  },
  {
    // https://learning.postman.com/docs/developer/postman-api/authentication/
    id: 'postman',
    name: 'Postman',
    color: 'bg-orange-600',
    detectPattern: null,
    order: 182,
    detectPriority: 999,
    logoUrl: '',
    transport: 'proxy',
    request: (apiKey) => ({ url: 'https://api.getpostman.com/me', headers: { 'X-API-Key': apiKey } }),
    describe: (body) => details(['User', field(body, 'user.username')]),
  },
  {
    // https://api-docs.render.com/reference/list-owners
    id: 'render',
    name: 'Render',
    color: 'bg-gray-900',
    detectPattern: null,
    order: 183,
    detectPriority: 999,
    logoUrl: '',
    transport: 'proxy',
    request: (apiKey) => ({ url: 'https://api.render.com/v1/owners?limit=20', headers: { ...bearer(apiKey), Accept: 'application/json' } }),
    describe: (body) => {
      const first = Array.isArray(body) ? (body[0] as { owner?: unknown })?.owner : undefined;
      return details(['Owner', field(first, 'name')], ['Owner type', field(first, 'type')]);
    },
  },
  {
    // https://neon.com/docs/reference/api/users/get-current-user-info
    id: 'neon',
    name: 'Neon',
    color: 'bg-emerald-500',
    detectPattern: null,
    order: 184,
    detectPriority: 999,
    logoUrl: '',
    transport: 'proxy',
    request: (apiKey) => ({ url: 'https://console.neon.tech/api/v2/users/me', headers: { ...bearer(apiKey), Accept: 'application/json' } }),
  },
  {
    // https://docs.lemonsqueezy.com/api/users/retrieve-user
    id: 'lemonsqueezy',
    name: 'Lemon Squeezy',
    color: 'bg-yellow-400',
    detectPattern: null,
    order: 185,
    detectPriority: 999,
    logoUrl: '',
    transport: 'proxy',
    request: (apiKey) => ({ url: 'https://api.lemonsqueezy.com/v1/users/me', headers: { ...bearer(apiKey), Accept: 'application/vnd.api+json' } }),
    describe: (body) => details(['User', field(body, 'data.attributes.name')], ['Test mode', field(body, 'meta.test_mode')]),
  },
];

const PROVIDER_LOOKUP = new Map<string, ProviderMeta>(PROVIDERS.map((p) => [p.id, p]));

export const PROVIDER_MAP: Record<ProviderType, ProviderMeta> = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, p])
) as Record<ProviderType, ProviderMeta>;

export const PROVIDERS_SORTED = [...PROVIDERS].sort((a, b) => a.order - b.order);
export const PROVIDERS_DETECT_ORDER = [...PROVIDERS]
  .filter((p) => p.detectPattern)
  .sort((a, b) => a.detectPriority - b.detectPriority);

/** Safe for untrusted input: unknown ids (including "constructor" etc.) return undefined. */
export function getProviderById(id: string): ProviderMeta | undefined {
  return PROVIDER_LOOKUP.get(id);
}

/** Every host a provider may be called on — used to build CSP connect-src lists. */
export function getProviderHosts(meta: ProviderMeta): string[] {
  const requests = [meta.request(''), ...(meta.fallbackRequests?.('') ?? [])];
  return [...new Set(requests.map((r) => new URL(r.url).origin))];
}

// ── Response classification ─────────────────────────────────────────

export type ProviderTestResult = {
  success: boolean;
  message: string;
  status?: number;
  latency?: number;
  endpoint: string;
  responseBody?: string;
  /** Facts about a valid key (account, scopes, credit…), when the provider's response includes them. */
  details?: KeyDetail[];
};

export type ProviderFetch = (request: ProviderRequest) => Promise<Response>;

const MAX_BODY_CHARS = 8000;

function extractErrorMessage(rawBody: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return '';
  }
  if (!parsed || typeof parsed !== 'object') return '';
  const obj = parsed as Record<string, unknown>;
  const candidates = [obj.error, obj.message, obj.detail, obj.errors];
  for (const c of candidates) {
    if (typeof c === 'string' && c) return c;
    if (Array.isArray(c) && c[0] && typeof c[0] === 'object') {
      const m = (c[0] as Record<string, unknown>).message;
      if (typeof m === 'string') return m;
    }
    if (c && typeof c === 'object' && typeof (c as Record<string, unknown>).message === 'string') {
      return (c as Record<string, unknown>).message as string;
    }
  }
  return '';
}

const INVALID_HINTS = ['api key not valid', 'invalid api key', 'invalid key', 'api_key_invalid', 'unauthorized', 'denied', 'incorrect api key'];
const FORMAT_HINTS = ['malformed', 'format', 'parse error'];

export function classifyResponse(
  meta: ProviderMeta,
  apiKey: string,
  status: number,
  statusText: string,
  rawBody: string,
): Verdict {
  const custom = meta.interpret?.(status, rawBody, apiKey);
  if (custom) return custom;

  const detail = extractErrorMessage(rawBody);
  const suffix = detail ? `: ${detail}` : '';
  const lower = detail.toLowerCase();

  if (status >= 200 && status < 300) return { success: true, message: 'API key is valid' };
  if (status === 429) return { success: true, message: 'API key is valid (rate limited)' };
  if (status === 401) return { success: false, message: `Invalid or incorrect API key (401 Unauthorized)${suffix}` };
  if (status === 403) return { success: false, message: `API key rejected or missing permissions (403 Forbidden)${suffix}` };

  if (status === 400) {
    const hintsIncorrect = INVALID_HINTS.some((h) => lower.includes(h));
    const hintsFormat = FORMAT_HINTS.some((h) => lower.includes(h));
    const formatValid = meta.detectPattern ? meta.detectPattern.test(apiKey) : true;
    if (hintsFormat && !hintsIncorrect) return { success: false, message: `Invalid API key format (400)${suffix}` };
    if (hintsIncorrect || formatValid) return { success: false, message: `Invalid or incorrect API key (400 Bad Request)${suffix}` };
    return { success: false, message: `Invalid API key format (400)${suffix}` };
  }

  if (status === 404) {
    return { success: false, message: `Test endpoint not found (404) — the provider API may have changed${suffix}` };
  }
  if (status >= 500) {
    return { success: false, message: `Provider error (${status}) — could not determine key validity, try again later${suffix}` };
  }
  return { success: false, message: `API error: ${status} ${statusText}${detail ? ' - ' + detail : ''}`.trim() };
}

/** Provider facts, or a model count for model-list endpoints. Never throws. */
export function describeKey(meta: ProviderMeta, rawBody: string, headers: Headers | null, apiKey: string): KeyDetail[] {
  let body: unknown = null;
  try {
    body = JSON.parse(rawBody);
  } catch {
    // not JSON
  }
  try {
    const own = meta.describe ? meta.describe(body, headers, apiKey) : [];
    const models = meta.request('').url.endsWith('/models') ? modelCount(body) : [];
    return [...own, ...models].slice(0, 6);
  } catch {
    return [];
  }
}

/**
 * Run a provider test with the given fetch implementation. Network errors
 * propagate so callers can decide whether to fall back to the relay.
 */
export async function runProviderTest(
  meta: ProviderMeta,
  apiKey: string,
  doFetch: ProviderFetch,
): Promise<ProviderTestResult> {
  const requests = [meta.request(apiKey), ...(meta.fallbackRequests?.(apiKey) ?? [])];
  let result: ProviderTestResult | undefined;

  for (const request of requests) {
    const startTime = Date.now();
    const response = await doFetch(request);
    const latency = Date.now() - startTime;
    const rawBody = await response.text().catch(() => '');
    const verdict = classifyResponse(meta, apiKey, response.status, response.statusText, rawBody);
    result = {
      ...verdict,
      status: response.status,
      latency,
      endpoint: request.url,
      responseBody: rawBody.slice(0, MAX_BODY_CHARS),
    };
    if (verdict.success && response.status >= 200 && response.status < 300) {
      const found = describeKey(meta, rawBody, response.headers, apiKey);
      if (found.length > 0) result.details = found;
    }
    if (response.status !== 401 && response.status !== 403) break;
  }

  return result!;
}
