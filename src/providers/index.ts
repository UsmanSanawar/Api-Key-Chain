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

  // Pre-validate: if the key matches the provider's expected format pattern,
  // any subsequent API error means the key is incorrect (not a format issue).
  const formatValid = meta.detectPattern ? meta.detectPattern.test(apiKey) : true;

  const request = meta.request(apiKey);

  try {
    const response = await fetchWithTimeout(request.url, {
      method: 'GET',
      headers: request.headers,
      timeout: 10000,
    });

    const latency = Date.now() - startTime;

    // Read response body for debugging (may be empty due to CORS)
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

    // Determine if this is a format issue or an incorrect key:
    // 1. If response body explicitly mentions invalid key → incorrect key
    // 2. If key matches the provider's expected format → incorrect key (format is fine)
    // 3. If key doesn't match format and no clear signal → format issue
    const bodyHintsIncorrect = errorMessage.toLowerCase().includes('api key not valid')
      || errorMessage.toLowerCase().includes('invalid api key')
      || errorMessage.toLowerCase().includes('invalid key')
      || errorMessage.toLowerCase().includes('api_key_invalid')
      || errorMessage.toLowerCase().includes('unauthorized')
      || errorMessage.toLowerCase().includes('not found')
      || errorMessage.toLowerCase().includes('denied');

    const bodyHintsFormat = errorMessage.toLowerCase().includes('malformed')
      || errorMessage.toLowerCase().includes('format')
      || errorMessage.toLowerCase().includes('parse error');

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
      // Use body hints if available, otherwise fall back to format pattern check
      if (bodyHintsFormat && !bodyHintsIncorrect) {
        return { success: false, message: `Invalid API key format (400)${errorMessage ? ': ' + errorMessage : ''}`, latency, responseBody: rawBody };
      }
      if (bodyHintsIncorrect || formatValid) {
        // Key format matches but API rejected it → incorrect key
        return { success: false, message: `Invalid or incorrect API key (400 Bad Request)${errorMessage ? ': ' + errorMessage : ''}`, latency, responseBody: rawBody };
      }
      // Key doesn't match expected format and no body hints
      return { success: false, message: `Invalid API key format (400)${errorMessage ? ': ' + errorMessage : ''}`, latency, responseBody: rawBody };
    }

    // Other error statuses
    if (formatValid || bodyHintsIncorrect) {
      return { success: false, message: `Invalid or incorrect API key (${response.status})${errorMessage ? ': ' + errorMessage : ''}`, latency, responseBody: rawBody };
    }
    return { success: false, message: `API error: ${response.status} ${response.statusText}${errorMessage ? ' - ' + errorMessage : ''}`, latency, responseBody: rawBody };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `Network error: ${errMsg}`, responseBody: errMsg };
  }
}
