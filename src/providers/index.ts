import type { ProviderType } from '../types';
import { fetchWithTimeout } from '../utils/fetch';
import { getProviderById } from '../../shared/providers';

type TestResult = { success: boolean; message: string; latency?: number; responseBody?: string };

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
      return { success: result.success, message: result.message, latency: result.latency, responseBody: JSON.stringify(result) };
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

    // Read response body for debugging
    const rawBody = await response.text().catch(() => '');
    let parsedBody: Record<string, unknown> | null = null;
    try { parsedBody = JSON.parse(rawBody); } catch { /* not JSON */ }

    if (request.parseAs === 'googlemaps') {
      const status = (parsedBody as Record<string, unknown>)?.status as string | undefined;
      if (status === 'OK' || status === 'ZERO_RESULTS') {
        return { success: true, message: 'API key is valid', latency, responseBody: rawBody };
      }
      return { success: false, message: status ? `API error: ${status}` : 'API error: Invalid response', latency, responseBody: rawBody };
    }

    if (response.ok) {
      return { success: true, message: 'API key is valid', latency, responseBody: rawBody };
    }

    // Extract error detail from response body if available
    const errorDetail = (parsedBody as Record<string, unknown>)?.error;
    const errorMessage = typeof errorDetail === 'string'
      ? errorDetail
      : typeof errorDetail === 'object' && errorDetail !== null
        ? (errorDetail as Record<string, unknown>).message as string || ''
        : '';

    if (response.status === 401) {
      return { success: false, message: `Invalid or incorrect API key (401 Unauthorized)${errorMessage ? ': ' + errorMessage : ''}`, latency, responseBody: rawBody };
    }

    if (response.status === 403) {
      return { success: false, message: `Invalid or incorrect API key (403 Forbidden)${errorMessage ? ': ' + errorMessage : ''}`, latency, responseBody: rawBody };
    }

    if (response.status === 429) {
      return { success: true, message: 'API key is valid (rate limited)', latency, responseBody: rawBody };
    }

    if (response.status === 400) {
      // Differentiate: if the error mentions "invalid" key specifically, it's an incorrect key, not bad format
      const isIncorrectKey = errorMessage.toLowerCase().includes('api key not valid')
        || errorMessage.toLowerCase().includes('invalid api key')
        || errorMessage.toLowerCase().includes('invalid key')
        || errorMessage.toLowerCase().includes('api_key_invalid');
      if (isIncorrectKey) {
        return { success: false, message: `Invalid or incorrect API key (400)${errorMessage ? ': ' + errorMessage : ''}`, latency, responseBody: rawBody };
      }
      return { success: false, message: `Invalid API key format (400 Bad Request)${errorMessage ? ': ' + errorMessage : ''}`, latency, responseBody: rawBody };
    }

    return { success: false, message: `API error: ${response.status} ${response.statusText}${errorMessage ? ' - ' + errorMessage : ''}`, latency, responseBody: rawBody };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `Network error: ${errMsg}`, responseBody: errMsg };
  }
}
