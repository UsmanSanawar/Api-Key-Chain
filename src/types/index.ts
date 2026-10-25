export type { ProviderType } from '../../shared/providers';
import type { ProviderType } from '../../shared/providers';

/** `direct` = browser → provider, `proxy` = relayed via /api/test-provider. */
export type TestVia = 'direct' | 'proxy';

export interface ApiTestResult {
  id: string;
  provider: ProviderType;
  timestamp: number;
  success: boolean;
  statusCode?: number;
  message: string;
  latency?: number;
  endpoint?: string;
  via?: TestVia;
  keyPreview?: string;
  /** In-memory only for the current session — never persisted to localStorage. */
  fullKey?: string;
  responseBody?: string;
}
