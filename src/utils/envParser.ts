import type { ProviderType } from '../types';
import { PROVIDER_MAP } from '../../shared/providers';
import { detectProvider } from './detection';

/**
 * Parses pasted .env content and picks out the values that are API keys.
 *
 * A value is tested only when we know which provider it belongs to:
 *  1. its prefix matches a provider's key pattern (sk-ant-, ghp_, …), or
 *  2. the variable name names a provider (MISTRAL_API_KEY) and the value
 *     looks like a secret — needed for providers whose keys have no prefix.
 * Everything else (database URLs, IDs, publishable keys, passwords…) is
 * skipped and never leaves the browser.
 */

export interface EnvEntry {
  /** Variable name, e.g. OPENAI_API_KEY. */
  name: string;
  value: string;
  /** 1-based line number in the pasted text. */
  line: number;
  /** Provider to test against, or null when skipped. */
  provider: ProviderType | null;
  /** Why the entry is skipped (when provider is null). */
  skipReason?: string;
}

const ASSIGNMENT = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/;

/** True when the text has at least one NAME=value line. */
export function looksLikeEnvFile(text: string): boolean {
  return text.split(/\r?\n/).some((line) => ASSIGNMENT.test(line) && !line.trim().startsWith('#'));
}

function parseValue(raw: string): string {
  const v = raw.trim();
  const quote = v[0];
  if (quote === '"' || quote === "'" || quote === '`') {
    const end = v.indexOf(quote, 1);
    return end > 0 ? v.slice(1, end) : v.slice(1);
  }
  // Unquoted: an inline comment starts at whitespace followed by #.
  return v.replace(/\s+#.*$/, '').trim();
}

/**
 * Words in a variable name that point to a provider. Long words match
 * anywhere in the name (ELEVEN_LABS → ELEVENLABS); short ones must be a
 * whole word (HF_TOKEN, GH_TOKEN, XAI_API_KEY).
 */
const NAME_HINTS: [string, ProviderType][] = [
  ['OPENROUTER', 'openrouter'],
  ['OPENAI', 'openai'],
  ['ANTHROPIC', 'anthropic'],
  ['CLAUDE', 'anthropic'],
  ['GEMINI', 'gemini'],
  ['MISTRAL', 'mistral'],
  ['COHERE', 'cohere'],
  ['HUGGINGFACE', 'huggingface'],
  ['GROQ', 'groq'],
  ['TOGETHER', 'together'],
  ['PERPLEXITY', 'perplexity'],
  ['ZHIPU', 'glm'],
  ['MOONSHOT', 'kimi'],
  ['KIMI', 'kimi'],
  ['DASHSCOPE', 'qwen'],
  ['QWEN', 'qwen'],
  ['DOUBAO', 'doubao'],
  ['DEEPSEEK', 'deepseek'],
  ['STRIPE', 'stripe'],
  ['GITHUB', 'github'],
  ['SENDGRID', 'sendgrid'],
  ['FIREWORKS', 'fireworks'],
  ['CEREBRAS', 'cerebras'],
  ['NEBIUS', 'nebius'],
  ['DEEPINFRA', 'deepinfra'],
  ['HYPERBOLIC', 'hyperbolic'],
  ['NOVITA', 'novita'],
  ['AI21', 'ai21'],
  ['REPLICATE', 'replicate'],
  ['ELEVENLABS', 'elevenlabs'],
  ['ASSEMBLYAI', 'assemblyai'],
  ['DEEPGRAM', 'deepgram'],
  ['PINECONE', 'pinecone'],
  ['MAILGUN', 'mailgun'],
  ['BREVO', 'brevo'],
  ['SENDINBLUE', 'brevo'],
  ['POSTMARK', 'postmark'],
  ['RESEND', 'resend'],
  ['SLACK', 'slack'],
  ['NOTION', 'notion'],
  ['GITLAB', 'gitlab'],
  ['VERCEL', 'vercel'],
  ['NETLIFY', 'netlify'],
  ['DIGITALOCEAN', 'digitalocean'],
  ['CLOUDFLARE', 'cloudflare'],
];

const WORD_HINTS: Record<string, ProviderType> = {
  HF: 'huggingface',
  GH: 'github',
  XAI: 'xai',
  GROK: 'xai',
  GLM: 'glm',
  PPLX: 'perplexity',
};

/** Name words that mean "not a secret key" (or not one we can test alone). */
const NON_KEY_WORDS = new Set([
  'PUBLIC', 'PUBLISHABLE', 'PK', 'WEBHOOK', 'URL', 'URI', 'HOST', 'PORT', 'ID', 'SID', 'USER', 'USERNAME',
  'EMAIL', 'DOMAIN', 'REGION', 'MODEL', 'ENDPOINT', 'BASE', 'PROJECT', 'ORG', 'ORGANIZATION', 'TEAM',
  'ACCOUNT', 'ZONE', 'NAME', 'VERSION', 'ENV', 'MODE', 'TIMEOUT', 'LIMIT', 'PATH', 'DIR', 'FROM', 'TO',
]);

function providerFromName(name: string): ProviderType | null {
  const upper = name.toUpperCase();
  const words = upper.split(/[^A-Z0-9]+/).filter(Boolean);
  if (words.some((w) => NON_KEY_WORDS.has(w))) return null;
  // Azure OpenAI and other gateways use different endpoints than the provider itself.
  if (upper.includes('AZURE')) return null;

  const compact = upper.replace(/[^A-Z0-9]/g, '');
  const found = new Set<ProviderType>();
  for (const [hint, provider] of NAME_HINTS) if (compact.includes(hint)) found.add(provider);
  for (const w of words) if (WORD_HINTS[w]) found.add(WORD_HINTS[w]);
  // Two different providers in one name (e.g. OPENAI_TO_GROQ_KEY) is ambiguous.
  return found.size === 1 ? [...found][0] : null;
}

/** Values that are clearly not API keys. */
function nonKeyReason(value: string): string | null {
  if (!value) return 'empty';
  if (/\s/.test(value)) return 'not an API key';
  if (value.includes('://')) return 'URL, not an API key';
  if (/^(true|false|yes|no|on|off|null|undefined)$/i.test(value)) return 'not an API key';
  if (/^-?\d+(\.\d+)?$/.test(value)) return 'number, not an API key';
  if (value.length < 16) return 'too short to be an API key';
  if (/^(your|xxx|changeme|replace|<)/i.test(value) || /^(.)\1+$/.test(value)) return 'placeholder value';
  return null;
}

export function parseEnvFile(text: string): EnvEntry[] {
  const entries: EnvEntry[] = [];
  const seen = new Map<string, string>();

  text.split(/\r?\n/).forEach((rawLine, i) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;
    const match = ASSIGNMENT.exec(rawLine);
    if (!match) return;

    const name = match[1];
    const value = parseValue(match[2]);
    const entry: EnvEntry = { name, value, line: i + 1, provider: null };

    const notKey = nonKeyReason(value);
    const byPattern = value ? detectProvider(value) : null;
    const byName = providerFromName(name);

    let provider: ProviderType | null = null;
    if (byPattern && (!byName || byName === byPattern || PROVIDER_MAP[byName]?.detectPattern)) {
      // A recognised prefix wins, even over a name for another provider that
      // has its own prefix (OPENAI_API_KEY=sk-ant-… is an Anthropic key).
      provider = byPattern;
    } else if (byName && !notKey) {
      // The name says which provider: covers prefix-less keys (MISTRAL_API_KEY),
      // shared prefixes (HYPERBOLIC_API_KEY=sk_live_…) and malformed keys.
      provider = byName;
    }
    // Twilio needs SID:secret in one value; a lone token can't be tested.
    if (provider === 'twilio' && !value.includes(':')) provider = null;

    if (provider) {
      const dupe = seen.get(value);
      if (dupe) {
        entry.skipReason = `same value as ${dupe}`;
      } else {
        entry.provider = provider;
        seen.set(value, name);
      }
    } else {
      entry.skipReason = notKey ?? 'not recognised as an API key';
    }
    entries.push(entry);
  });

  return entries;
}
