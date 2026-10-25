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
  | 'cloudflare';

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
};

const bearer = (apiKey: string) => ({ Authorization: `Bearer ${apiKey}` });

export const PROVIDERS: ProviderMeta[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    color: 'bg-green-600',
    detectPattern: /^sk-(proj-[^.]*\.|.*T3BlbkFJ)/,
    order: 10,
    detectPriority: 90,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.openai.com/v1/models', headers: bearer(apiKey) }),
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    color: 'bg-orange-600',
    detectPattern: /^sk-ant-/,
    order: 20,
    detectPriority: 10,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg',
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
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    color: 'bg-blue-600',
    detectPattern: /^AIza[0-9A-Za-z_-]{35}/,
    order: 30,
    detectPriority: 80,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Google_Gemini_logo_2025.svg',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Mistral_AI_logo_%282025%E2%80%93%29.svg',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Cohere_logo.svg',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/45/Hugging_Face_logo.svg',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://huggingface.co/api/whoami-v2', headers: bearer(apiKey) }),
  },
  {
    id: 'groq',
    name: 'Groq',
    color: 'bg-indigo-600',
    detectPattern: /^gsk_/,
    order: 70,
    detectPriority: 20,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Groq_logo.svg',
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
    logoUrl: 'https://files.buildwithfern.com/openrouter.docs.buildwithfern.com/docs/5a7e2b0bd58241d151e9e352d7a4f898df12c062576c0ce0184da76c3635c5d3/content/assets/logo.svg',
    transport: 'direct',
    // /models is public; /key requires a valid key.
    request: (apiKey) => ({ url: 'https://openrouter.ai/api/v1/key', headers: bearer(apiKey) }),
  },
  {
    id: 'together',
    name: 'Together',
    color: 'bg-fuchsia-600',
    detectPattern: null,
    order: 90,
    detectPriority: 999,
    logoUrl: 'https://cdn.prod.website-files.com/64f6f2c0e3f4c5a91c1e823a/6500732503885fd3e7e06d70_logo-dark.svg',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Perplexity_AI_logo.svg',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Z.ai_%28company_logo%29.svg',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/87/Kimi-logo-2025.png',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Qwen_Logo.svg',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/ff/Doubao_logo.jpg',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/DeepSeek_logo.svg',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
    transport: 'direct',
    // Balance holds no customer PII, unlike /v1/customers.
    request: (apiKey) => ({ url: 'https://api.stripe.com/v1/balance', headers: bearer(apiKey) }),
    interpret: (status, _body, apiKey) =>
      status === 403 && apiKey.startsWith('rk_')
        ? { success: true, message: 'Restricted key is valid (it lacks the Balance read permission used for this test)' }
        : undefined,
  },
  {
    id: 'github',
    name: 'GitHub',
    color: 'bg-gray-700',
    detectPattern: /^(ghp_|github_pat_)/,
    order: 130,
    detectPriority: 60,
    logoUrl: 'https://brand.github.com/_next/static/media/logo-03.cc5e5332.png',
    transport: 'direct',
    request: (apiKey) => ({
      url: 'https://api.github.com/user',
      headers: {
        ...bearer(apiKey),
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }),
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    color: 'bg-blue-700',
    detectPattern: /^SG\./,
    order: 150,
    detectPriority: 95,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b6/SendGrid_2016_Logo.png',
    transport: 'proxy',
    request: (apiKey) => ({ url: 'https://api.sendgrid.com/v3/scopes', headers: bearer(apiKey) }),
  },

  // ── AI inference ───────────────────────────────────────────────────
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    color: 'bg-orange-500',
    detectPattern: /^fw_/,
    order: 121,
    detectPriority: 40,
    logoUrl: '',
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
    logoUrl: '',
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
    logoUrl: '',
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
    logoUrl: '',
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
    logoUrl: '',
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
    logoUrl: '',
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
    logoUrl: '',
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
    logoUrl: '',
    transport: 'proxy',
    request: (apiKey) => ({ url: 'https://api.replicate.com/v1/account', headers: bearer(apiKey) }),
  },

  // ── Voice & vector ────────────────────────────────────────────────
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    color: 'bg-stone-700',
    detectPattern: null,
    order: 131,
    detectPriority: 999,
    logoUrl: '',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.elevenlabs.io/v1/user', headers: { 'xi-api-key': apiKey } }),
  },
  {
    id: 'assemblyai',
    name: 'AssemblyAI',
    color: 'bg-blue-800',
    detectPattern: null,
    order: 132,
    detectPriority: 999,
    logoUrl: '',
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
    logoUrl: '',
    transport: 'proxy',
    request: (apiKey) => ({ url: 'https://api.deepgram.com/v1/projects', headers: { Authorization: `Token ${apiKey}` } }),
  },
  {
    id: 'pinecone',
    name: 'Pinecone',
    color: 'bg-cyan-800',
    detectPattern: /^pcsk_/,
    order: 134,
    detectPriority: 43,
    logoUrl: '',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.pinecone.io/indexes', headers: { 'Api-Key': apiKey } }),
  },

  // ── Email & messaging ─────────────────────────────────────────────
  {
    id: 'mailgun',
    name: 'Mailgun',
    color: 'bg-red-700',
    detectPattern: null,
    order: 151,
    detectPriority: 999,
    logoUrl: '',
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
    logoUrl: '',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.brevo.com/v3/account', headers: { 'api-key': apiKey } }),
  },
  {
    id: 'postmark',
    name: 'Postmark',
    color: 'bg-yellow-700',
    detectPattern: null,
    order: 153,
    detectPriority: 999,
    logoUrl: '',
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
  },
  {
    id: 'resend',
    name: 'Resend',
    color: 'bg-black',
    detectPattern: /^re_/,
    order: 154,
    detectPriority: 45,
    logoUrl: '',
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
    logoUrl: '',
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
  },
  {
    id: 'slack',
    name: 'Slack',
    color: 'bg-purple-800',
    detectPattern: /^(xoxb-|xoxp-|xapp-)/,
    order: 156,
    detectPriority: 46,
    logoUrl: '',
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
  },

  // ── Developer platforms ───────────────────────────────────────────
  {
    id: 'notion',
    name: 'Notion',
    color: 'bg-neutral-800',
    detectPattern: /^(ntn_|secret_)/,
    order: 160,
    detectPriority: 47,
    logoUrl: '',
    transport: 'direct',
    request: (apiKey) => ({
      url: 'https://api.notion.com/v1/users/me',
      headers: { ...bearer(apiKey), 'Notion-Version': '2022-06-28' },
    }),
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    color: 'bg-orange-600',
    detectPattern: /^glpat-/,
    order: 161,
    detectPriority: 48,
    logoUrl: '',
    transport: 'direct',
    // gitlab.com only — self-managed instances use their own host.
    request: (apiKey) => ({ url: 'https://gitlab.com/api/v4/user', headers: { 'PRIVATE-TOKEN': apiKey } }),
  },
  {
    id: 'vercel',
    name: 'Vercel',
    color: 'bg-black',
    detectPattern: /^vcp_/,
    order: 162,
    detectPriority: 49,
    logoUrl: '',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.vercel.com/v2/user', headers: bearer(apiKey) }),
    // Vercel answers 403 {"invalidToken": true} for bad tokens.
    interpret: (status, body) =>
      status === 403 && body.includes('invalidToken') ? { success: false, message: 'Invalid or expired token (403)' } : undefined,
  },
  {
    id: 'netlify',
    name: 'Netlify',
    color: 'bg-teal-500',
    detectPattern: null,
    order: 163,
    detectPriority: 999,
    logoUrl: '',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.netlify.com/api/v1/user', headers: bearer(apiKey) }),
  },
  {
    id: 'digitalocean',
    name: 'DigitalOcean',
    color: 'bg-blue-600',
    detectPattern: /^dop_v1_/,
    order: 164,
    detectPriority: 51,
    logoUrl: '',
    transport: 'direct',
    request: (apiKey) => ({ url: 'https://api.digitalocean.com/v2/account', headers: bearer(apiKey) }),
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    color: 'bg-orange-500',
    detectPattern: /^cfut_/,
    order: 165,
    detectPriority: 52,
    logoUrl: '',
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
    if (response.status !== 401 && response.status !== 403) break;
  }

  return result!;
}
