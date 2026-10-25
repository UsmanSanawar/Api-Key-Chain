import type { TestVia } from '../types';
import { fetchWithTimeout } from '../utils/fetch';
import { getProviderById, runProviderTest } from '../../shared/providers';
import type { ProviderTestResult } from '../../shared/providers';

export type TestResult = ProviderTestResult & { via: TestVia };

const RELAY_URL = '/api/test-provider';

/**
 * Relay the test through the stateless serverless function. Returns null when
 * the relay isn't deployed (e.g. static hosting) so callers can explain why.
 */
async function testViaRelay(provider: string, apiKey: string): Promise<TestResult | null> {
  try {
    const response = await fetch(RELAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey }),
    });
    if (!(response.headers.get('content-type') || '').includes('application/json')) return null;
    const result = await response.json();
    if (typeof result?.success !== 'boolean') return null;
    return { ...result, via: 'proxy' };
  } catch {
    return null;
  }
}

export async function testProvider(provider: string, apiKey: string): Promise<TestResult> {
  const meta = getProviderById(provider);
  if (!meta) {
    return { success: false, message: 'Provider not supported yet', endpoint: '', via: 'direct' };
  }
  const endpoint = meta.request('').url;

  if (meta.transport === 'direct') {
    try {
      const result = await runProviderTest(meta, apiKey, (request) =>
        fetchWithTimeout(request.url, {
          method: request.method ?? 'GET',
          headers: request.headers,
          body: request.body,
          timeout: 10000,
        })
      );
      return { ...result, via: 'direct' };
    } catch (error) {
      // Browser request blocked (CORS, extension, network) — try the relay before giving up.
      const relayed = await testViaRelay(provider, apiKey);
      if (relayed) return relayed;
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `Network error: ${errMsg}`, endpoint, responseBody: errMsg, via: 'direct' };
    }
  }

  const relayed = await testViaRelay(provider, apiKey);
  if (relayed) return relayed;
  return {
    success: false,
    message: `${meta.name} blocks direct browser requests (CORS) and the test relay (${RELAY_URL}) is not available on this deployment.`,
    endpoint,
    via: 'proxy',
  };
}
