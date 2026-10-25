import { useCallback } from 'react';
import type { ApiTestResult, ProviderType } from '../types';
import { testProvider } from '../providers/index.ts';
import type { TestResult } from '../providers/index.ts';
import { useAppStore } from '../store/useAppStore';

export function useApiTest() {
  const addResult = useAppStore((state) => state.addResult);

  const test = useCallback(
    async (provider: ProviderType, apiKey: string): Promise<TestResult> => {
      const startTime = Date.now();

      try {
        const testResult = await testProvider(provider, apiKey);
        const keyPreview = apiKey.length > 4 ? `***${apiKey.slice(-4)}` : '****';

        const result: ApiTestResult = {
          id: crypto.randomUUID(),
          provider,
          timestamp: startTime,
          success: testResult.success,
          statusCode: testResult.status,
          message: testResult.message,
          latency: testResult.latency,
          endpoint: testResult.endpoint,
          via: testResult.via,
          keyPreview,
          fullKey: apiKey,
          responseBody: testResult.responseBody,
        };

        addResult(result);
        return testResult;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, message: `Error: ${errorMessage}`, endpoint: '', via: 'direct' };
      }
    },
    [addResult]
  );

  return { test };
}
