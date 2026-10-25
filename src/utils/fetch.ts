interface FetchOptions {
  timeout?: number;
  retries?: number;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * fetch with a timeout. Retries only on timeouts and 5xx responses — CORS and
 * other network errors fail immediately, since retrying them never helps.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & FetchOptions = {},
  attempt = 0
): Promise<Response> {
  const { timeout = 10000, retries = 1, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
    if (response.status >= 500 && attempt < retries) {
      await wait(1000 * (attempt + 1));
      return fetchWithTimeout(url, options, attempt + 1);
    }
    return response;
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'AbortError';
    if (!timedOut) throw error;
    if (attempt < retries) {
      await wait(1000 * (attempt + 1));
      return fetchWithTimeout(url, options, attempt + 1);
    }
    throw new Error(`Request timed out after ${timeout}ms`);
  } finally {
    clearTimeout(timeoutId);
  }
}
