interface FetchOptions {
  timeout?: number;
  retries?: number;
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit & FetchOptions = {},
  retries = 0
): Promise<Response> {
  const { timeout = 10000, retries: maxRetries = 2, ...fetchOptions } = options;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (retries < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (retries + 1)));
      return fetchWithTimeout(url, options, retries + 1);
    }
    throw error;
  }
}
