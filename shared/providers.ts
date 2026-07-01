import type { ProviderType } from '../src/types';

export type ProviderRequest = {
  url: string;
  headers?: Record<string, string>;
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

export const PROVIDERS: ProviderMeta[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    color: 'bg-green-600',
    detectPattern: /^sk-(proj-[^.]*\.|.*T3BlbkFJ)/,
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
    detectPattern: null,
    order: 40,
    detectPriority: 999,
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
    detectPattern: /^co_/,
    order: 50,
    detectPriority: 85,
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
    detectPattern: null,
    order: 90,
    detectPriority: 999,
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
    id: 'xai',
    name: 'xAI (Grok)',
    color: 'bg-lime-600',
    detectPattern: /^xai-/,
    order: 105,
    detectPriority: 55,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/XAI_logo.svg/1200px-XAI_logo.svg.png',
    request: (apiKey) => ({
      url: 'https://api.x.ai/v1/models',
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  },
  {
    id: 'glm',
    name: 'GLM (ZhiPu AI)',
    color: 'bg-pink-600',
    detectPattern: null,
    order: 115,
    detectPriority: 999,
    logoUrl: 'https://bigmodel.ai/_next/static/media/logo.76b9c7b0.png',
    request: (apiKey) => ({
      url: 'https://open.bigmodel.cn/api/paas/v4/models',
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  },
  {
    id: 'kimi',
    name: 'Kimi (Moonshot)',
    color: 'bg-slate-600',
    detectPattern: null,
    order: 117,
    detectPriority: 999,
    logoUrl: 'https://www.moonshot.cn/_next/static/media/logo.8c9d8a2b.png',
    request: (apiKey) => ({
      url: 'https://api.moonshot.cn/v1/models',
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  },
  {
    id: 'qwen',
    name: 'Qwen (Alibaba)',
    color: 'bg-red-600',
    detectPattern: null,
    order: 118,
    detectPriority: 999,
    logoUrl: 'https://img.alicdn.com/imgextra/i3/O1CN01QomVqX1c3hEsDdmHv_!!6000000003115-2-tps-150-150.png',
    request: (apiKey) => ({
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/models',
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  },
  {
    id: 'doubao',
    name: 'Doubao (ByteDance)',
    color: 'bg-blue-500',
    detectPattern: null,
    order: 119,
    detectPriority: 999,
    logoUrl: 'https://www.volcengine.com/assets/favicon.ico',
    request: (apiKey) => ({
      url: 'https://ark.cn-beijing.volces.com/api/v3/models',
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    color: 'bg-sky-600',
    detectPattern: /^sk-[a-f0-9]{32}$/,
    order: 120,
    detectPriority: 30,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/DeepSeek_logo.svg',
    request: (apiKey) => ({
      url: 'https://api.deepseek.com/v1/models',
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  },
  {
    id: 'stripe',
    name: 'Stripe',
    color: 'bg-purple-700',
    detectPattern: /^sk_(test|live)_/,
    order: 125,
    detectPriority: 75,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
    request: (apiKey) => ({
      url: 'https://api.stripe.com/v1/customers?limit=1',
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  },
  {
    id: 'github',
    name: 'GitHub',
    color: 'bg-gray-700',
    detectPattern: /^(ghp_|github_pat_)/,
    order: 130,
    detectPriority: 60,
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
