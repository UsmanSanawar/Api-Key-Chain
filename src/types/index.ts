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
  | 'doubao';

export interface ApiTestResult {
  id: string;
  provider: ProviderType;
  timestamp: number;
  success: boolean;
  statusCode?: number;
  message: string;
  latency?: number;
  endpoint?: string;
  keyPreview?: string;
  fullKey?: string;
  responseBody?: string;
}

export interface BookmarkedKey {
  id: string;
  name: string;
  provider: ProviderType;
  keyPrefix: string; // Only store prefix for security
  createdAt: number;
}

