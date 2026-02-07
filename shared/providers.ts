import type { ProviderType } from '../src/types';

export type ProviderRequest = {
  url: string;
  headers?: Record<string, string>;
  parseAs?: 'googlemaps';
};

export type ProviderMeta = {
  id: ProviderType;
  name: string;
  color: string;
  detectPattern: RegExp | null;
  order: number;
  detectPriority: number;
  logoUrl: string;
  request: (apiKey: string) => ProviderRequest;
};

function buildBasicAuth(apiKey: string): string {
  try {
    if (typeof btoa === 'function') return btoa(apiKey);
  } catch {
    // ignore
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bufferCtor = (globalThis as any).Buffer;
    if (bufferCtor) return bufferCtor.from(apiKey).toString('base64');
  } catch {
    // ignore
  }
  return '';
}

export const PROVIDERS: ProviderMeta[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    color: 'bg-green-600',
    detectPattern: /^sk-/,
    order: 10,
    detectPriority: 90,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
    request: (apiKey) => ({
      url: 'https://api.openai.com/v1/models',
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    color: 'bg-orange-600',
    detectPattern: /^sk-ant-/,
    order: 20,
    detectPriority: 10,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg',
    request: (apiKey) => ({
      url: 'https://api.anthropic.com/v1/models',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
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
    request: (apiKey) => ({
      url: `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
    }),
  },
  {
    id: 'mistral',
    name: 'Mistral',
    color: 'bg-rose-600',
    detectPattern: /^mistral_/,
    order: 40,
    detectPriority: 30,
    logoUrl: 'https://mistral.ai/_next/image?url=%2Fstatic%2Fbranding%2Fmistral-logo%2Fmistral-logo-color-black.png&w=828&q=75',
    request: (apiKey) => ({
      url: 'https://api.mistral.ai/v1/models',
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  },
  {
    id: 'cohere',
    name: 'Cohere',
    color: 'bg-emerald-600',
    detectPattern: /^[a-z0-9]{36}$/,
    order: 50,
    detectPriority: 120,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Cohere_logo.svg',
    request: (apiKey) => ({
      url: 'https://api.cohere.ai/v1/models',
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    color: 'bg-yellow-600',
    detectPattern: /^hf_[A-Za-z0-9]{34,}/,
    order: 60,
    detectPriority: 100,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/45/Hugging_Face_logo.svg',
    request: (apiKey) => ({
      url: 'https://huggingface.co/api/whoami-v2',
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  },
  {
    id: 'groq',
    name: 'Groq',
    color: 'bg-indigo-600',
    detectPattern: /^gsk_/,
    order: 70,
    detectPriority: 20,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Grok-feb-2025-logo.svg',
    request: (apiKey) => ({
      url: 'https://api.groq.com/openai/v1/models',
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    color: 'bg-cyan-600',
    detectPattern: /^sk-or-/,
    order: 80,
    detectPriority: 15,
    logoUrl: 'https://files.buildwithfern.com/openrouter.docs.buildwithfern.com/docs/5a7e2b0bd58241d151e9e352d7a4f898df12c062576c0ce0184da76c3635c5d3/content/assets/logo.svg',
    request: (apiKey) => ({
      url: 'https://openrouter.ai/api/v1/models',
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  },
  {
    id: 'together',
    name: 'Together',
    color: 'bg-fuchsia-600',
    detectPattern: /^together_/,
    order: 90,
    detectPriority: 40,
    logoUrl: 'https://cdn.prod.website-files.com/64f6f2c0e3f4c5a91c1e823a/6500732503885fd3e7e06d70_logo-dark.svg',
    request: (apiKey) => ({
      url: 'https://api.together.xyz/v1/models',
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    color: 'bg-violet-600',
    detectPattern: /^pplx-/,
    order: 100,
    detectPriority: 50,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Perplexity_AI_logo.svg',
    request: (apiKey) => ({
      url: 'https://api.perplexity.ai/models',
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    color: 'bg-sky-600',
    detectPattern: /^sk-deepseek-/,
    order: 110,
    detectPriority: 60,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/DeepSeek_logo.svg',
    request: (apiKey) => ({
      url: 'https://api.deepseek.com/v1/models',
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  },
  {
    id: 'github',
    name: 'GitHub',
    color: 'bg-gray-700',
    detectPattern: /^(ghp_|github_pat_)/,
    order: 120,
    detectPriority: 70,
    logoUrl: 'https://brand.github.com/_next/static/media/logo-03.cc5e5332.png',
    request: (apiKey) => ({
      url: 'https://api.github.com/user',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }),
  },
  {
    id: 'stripe',
    name: 'Stripe',
    color: 'bg-purple-700',
    detectPattern: /^sk_(test|live)_/,
    order: 130,
    detectPriority: 75,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
    request: (apiKey) => ({
      url: 'https://api.stripe.com/v1/customers?limit=1',
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  },
  {
    id: 'twilio',
    name: 'Twilio',
    color: 'bg-red-600',
    detectPattern: /^SK[0-9a-fA-F]{32}/,
    order: 140,
    detectPriority: 85,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Twilio-logo-red.svg',
    request: (apiKey) => {
      const basic = buildBasicAuth(apiKey);
      return {
        url: 'https://api.twilio.com/2010-04-01/Accounts.json',
        headers: basic ? { Authorization: `Basic ${basic}` } : undefined,
      };
    },
  },
  {
    id: 'googlemaps',
    name: 'Google Maps',
    color: 'bg-teal-600',
    detectPattern: null,
    order: 31,
    detectPriority: 999,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/dc/Google_Maps_Logo.svg',
    request: (apiKey) => ({
      url: `https://maps.googleapis.com/maps/api/geocode/json?address=Berlin&key=${apiKey}`,
      parseAs: 'googlemaps',
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
    request: (apiKey) => ({
      url: 'https://api.sendgrid.com/v3/user/profile',
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  },
];

export const PROVIDER_MAP: Record<ProviderType, ProviderMeta> = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, p])
) as Record<ProviderType, ProviderMeta>;

export const PROVIDERS_SORTED = [...PROVIDERS].sort((a, b) => a.order - b.order);
export const PROVIDERS_DETECT_ORDER = [...PROVIDERS]
  .filter((p) => p.detectPattern)
  .sort((a, b) => a.detectPriority - b.detectPriority);

export function getProviderById(id: ProviderType) {
  return PROVIDER_MAP[id];
}
