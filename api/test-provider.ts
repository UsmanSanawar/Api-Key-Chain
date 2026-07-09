/**
 * Serverless function for testing API keys (single endpoint)
 * Deployed to Vercel as a serverless function
 */

import type { ProviderType } from '../src/types';
import { getProviderById } from '../shared/providers';

export default async function handler(request: any): Promise<any> {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, message: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    const { apiKey, provider } = body || {};

    if (!apiKey || !provider) {
      return new Response(
        JSON.stringify({ success: false, message: 'Provider and API key required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const meta = getProviderById(provider as ProviderType);
    if (!meta) {
      return new Response(
        JSON.stringify({ success: false, message: 'Provider not supported yet' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
    const requestInfo = meta.request(apiKey);

    const startTime = Date.now();
    const response = await fetch(requestInfo.url, {
      method: 'GET',
      headers: requestInfo.headers,
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      return new Response(
        JSON.stringify({ success: true, message: 'API key is valid', latency, status: response.status }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    let message = `API error: ${response.status} ${response.statusText}`;
    let success = response.status === 429;

    if (response.status === 401) message = 'Invalid or expired API key (401 Unauthorized)';
    else if (response.status === 403) message = 'API key forbidden (403 Forbidden)';
    else if (response.status === 429) message = 'API key is valid (rate limited)';
    else if (response.status === 400) message = 'Invalid API key format (400 Bad Request)';

    return new Response(
      JSON.stringify({ success, message, latency, status: response.status }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
