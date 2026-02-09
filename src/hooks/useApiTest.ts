import { useCallback } from 'react';
import type { ApiTestResult, ProviderType } from '../types';
import { testProvider } from '../providers/index.ts';
import { useAppStore } from '../store/useAppStore';

export function useApiTest() {
  const addResult = useAppStore((state) => state.addResult);

  const test = useCallback(
    async (provider: ProviderType, apiKey: string) => {
      const startTime = Date.now();
      
      console.log(`[API Test] Starting test for provider: ${provider}`);
      console.log(`[API Test] API Key length: ${apiKey.length} characters`);
      
      let testResult;

      try {
        testResult = await testProvider(provider, apiKey);

        const keyPreview = apiKey.length > 4 ? `***${apiKey.slice(-4)}` : '****';
        
        const result: ApiTestResult = {
          id: Math.random().toString(36).substring(7),
          provider,
          timestamp: startTime,
          success: testResult.success,
          message: testResult.message,
          latency: testResult.latency,
          keyPreview,
          fullKey: apiKey,
          responseBody: testResult.responseBody,
        };

        console.log(`[API Test] Test result:`, result);
        console.log(`[API Test] Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (result.latency) {
          console.log(`[API Test] Response time: ${result.latency}ms`);
        }

        addResult(result);
        return testResult;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[API Test] Error occurred:`, error);
        console.error(`[API Test] Error message: ${errorMessage}`);
        
        return {
          success: false,
          message: `Error: ${errorMessage}`,
        };
      }
    },
    [addResult]
  );

  return { test };
}
