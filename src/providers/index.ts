import type { ProviderType } from '../types';
import { fetchWithTimeout } from '../utils/fetch';
import { getProviderById } from '../../shared/providers';

type TestResult = { success: boolean; message: string; latency?: number };

export async function testProvider(provider: string, apiKey: string): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const edgeResponse = await fetch('/api/test-provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey }),
    });

    if (edgeResponse.ok) {
      const result = await edgeResponse.json();
      return { success: result.success, message: result.message, latency: result.latency };
    }
  } catch (edgeError) {
    console.warn('[Provider] Edge Function failed, falling back to direct API call:', edgeError);
  }

  const meta = getProviderById(provider as ProviderType);
  if (!meta) {
    return { success: false, message: 'Provider not supported yet' };
  }

  const request = meta.request(apiKey);

  try {
    const response = await fetchWithTimeout(request.url, {
      method: 'GET',
      headers: request.headers,
      timeout: 10000,
    });

    const latency = Date.now() - startTime;

    if (request.parseAs === 'googlemaps') {
      const data = await response.json().catch(() => null);
      const status = data?.status as string | undefined;
      if (status === 'OK' || status === 'ZERO_RESULTS') {
        return { success: true, message: 'API key is valid', latency };
      }
      return { success: false, message: status ? `API error: ${status}` : 'API error: Invalid response', latency };
    }

    if (response.ok) {
      return { success: true, message: 'API key is valid', latency };
    }

    if (response.status === 401) {
      return { success: false, message: 'Invalid or expired API key (401 Unauthorized)', latency };
    }

    if (response.status === 403) {
      return { success: false, message: 'API key forbidden (403 Forbidden)', latency };
    }

    if (response.status === 429) {
      return { success: true, message: 'API key is valid (rate limited)', latency };
    }

    if (response.status === 400) {
      return { success: false, message: 'Invalid API key format (400 Bad Request)', latency };
    }

    return { success: false, message: `API error: ${response.status} ${response.statusText}`, latency };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `Network error: ${errMsg}` };
  }
}
