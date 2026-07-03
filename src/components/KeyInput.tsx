import { useEffect, useState } from 'react';
import { useKeyInput } from '../hooks/useKeyInput';
import { useApiTest } from '../hooks/useApiTest';
import { detectProvider } from '../utils/detection';
import { PROVIDERS_SORTED, PROVIDER_MAP } from '../../shared/providers';
import type { ProviderType } from '../types';

export function KeyInput() {
  const {
    apiKey,
    detectedProvider,
    handleKeyChange,
    reset,
  } = useKeyInput();
  const { test } = useApiTest();
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<
    { success: boolean; message: string; latency?: number; responseBody?: string } | null
  >(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [providerSearch, setProviderSearch] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkKeys, setBulkKeys] = useState('');
  const [showEndpoint, setShowEndpoint] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [showFullResponse, setShowFullResponse] = useState(false);

  useEffect(() => {
    // Force auto-detect when bulk mode is enabled
    if (isBulkMode) {
      setAutoDetect(true);
    }
  }, [isBulkMode]);

  useEffect(() => {
    if (autoDetect && detectedProvider) {
      setSelectedProvider(detectedProvider);
    } else if (!autoDetect) {
      // Keep manual selection when switching to manual mode
    } else {
      setSelectedProvider(null);
    }
  }, [detectedProvider, autoDetect]);

  // Parse bulk keys: support both newline and comma separated
  const parseBulkKeys = (input: string): string[] => {
    return input
      .split(/[\n,]/)
      .map(key => key.trim())
      .filter(key => key.length > 0);
  };

  const handleBulkTest = async () => {
    if (!bulkKeys.trim()) {
      setTestResult({
        success: false,
        message: 'Please provide at least one API key',
      });
      return;
    }

    const keys = parseBulkKeys(bulkKeys);
    if (keys.length === 0) {
      setTestResult({
        success: false,
        message: 'Please provide at least one valid API key',
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null); // Clear previous result
    try {
      // Test each key with 1 second delay - each uses its own auto-detected provider
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        // Auto-detect provider for this specific key
        const provider = detectProvider(key);
        
        // Test with the detected provider (same as single test mode)
        // If provider not detected, test will handle it (provider can be null)
        if (provider) {
          const result = await test(provider, key);
          // Display each result immediately
          setTestResult(result);
        }
        
        // Add 1 second delay between tests (but not after the last one)
        if (i < keys.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Show summary message after all tests complete
      setTestResult({
        success: true,
        message: `Successfully tested ${keys.length} API key${keys.length > 1 ? 's' : ''}. Results shown in history.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (isBulkMode) {
      await handleBulkTest();
      return;
    }

    let provider = selectedProvider;
    
    if (!provider || !apiKey) {
      setTestResult({
        success: false,
        message: 'Please provide API key and select a provider',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await test(provider, apiKey);
      setTestResult(result);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-2 text-center">
      {/* API Key Input Section */}
      <div className="space-y-1.5 p-3 bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-gray-200 uppercase tracking-widest">
            API Key
          </label>

          {/* Single/Bulk Toggle */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-gray-400">Single</span>
            <button
              onClick={() => setIsBulkMode(!isBulkMode)}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isBulkMode ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isBulkMode ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className="text-xs text-gray-400">Bulk</span>
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          <div className="flex-1 relative">
            {isBulkMode ? (
              <textarea
                value={bulkKeys}
                onChange={(e) => setBulkKeys(e.target.value)}
                placeholder="Insert/paste API keys each in new line OR separated by comma"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition font-mono text-[11px] min-h-[70px] resize-none"
              />
            ) : (
              <>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.includes('\n') || val.includes(',')) {
                      setIsBulkMode(true);
                      setBulkKeys(val);
                    } else {
                      handleKeyChange(val);
                    }
                  }}
                  placeholder="Paste your API key..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition font-mono text-[11px]"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition text-base bg-slate-800 px-1.5 py-0.5 rounded"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? '👁️' : '👁️‍🗨️'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Provider Selection Section */}
      <div className="space-y-2 p-3 bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <label className="block text-xs font-bold text-gray-200 uppercase tracking-widest">
            Provider
          </label>

          {/* Toggle Switch */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-gray-400">Manual</span>
            <button
              onClick={() => !isBulkMode && setAutoDetect(!autoDetect)}
              disabled={isBulkMode}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isBulkMode ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                autoDetect ? 'bg-blue-600' : 'bg-gray-600'
              }`}
              title={isBulkMode ? 'Auto-detect is forced in bulk mode' : ''}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoDetect ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className="text-xs text-gray-400">Auto</span>
            {isBulkMode && <span className="text-xs text-amber-400 ml-2">(forced)</span>}
          </div>

          <div className="flex justify-end">
            <input
              type="text"
              value={providerSearch}
              onChange={(e) => setProviderSearch(e.target.value)}
              placeholder="Search..."
              className="max-w-[75px] px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {PROVIDERS_SORTED.filter((provider) => {
            const query = providerSearch.trim().toLowerCase();
            if (!query) return true;
            return (
              provider.name.toLowerCase().includes(query) ||
              provider.id.toLowerCase().includes(query)
            );
          }).map((provider) => {
            const isSelected = selectedProvider === provider.id;
            const isDisabled = autoDetect || isBulkMode;

            return (
              <button
                key={provider.id}
                onClick={() => !isDisabled && setSelectedProvider(provider.id)}
                disabled={isDisabled}
                className={`py-1 px-1.5 rounded-lg transition border-2 flex flex-col items-center justify-center gap-0 h-11 ${
                  isSelected
                    ? 'bg-[#f2f5f3] text-slate-900 opacity-100 shadow-lg border-blue-400'
                    : 'bg-[#f2f5f3] text-slate-800 border-gray-300'
                } ${
                  isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:shadow-md hover:scale-105 active:scale-95 transition-transform duration-200'
                }`}
              >
                <img 
                  src={provider.logoUrl} 
                  alt={provider.name}
                  className="w-auto h-full object-contain max-h-[28px]"
                />
                <span className="text-[8px] leading-tight">{provider.name}</span>
              </button>
            );
          })}
        </div>

        {autoDetect && detectedProvider === 'gemini' && apiKey.startsWith('AIza') && (
          <div className="text-[10px] text-amber-300 text-center">
            If this is a Google Maps key, switch to Google Maps manually.
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleTest}
          disabled={isLoading || (!isBulkMode && (!apiKey || !selectedProvider)) || (isBulkMode && !bulkKeys.trim())}
          className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition text-xs shadow-lg hover:scale-[1.02] active:scale-95 disabled:hover:scale-100 border border-blue-400 disabled:border-slate-500"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-1.5">
              <span className="animate-spin">⚙️</span> Testing...
            </span>
          ) : (
            <span>⚡ {isBulkMode ? 'Test All' : 'Test'}</span>
          )}
        </button>
        <button
          onClick={() => {
            reset();
            setBulkKeys('');
            setTestResult(null);
            setShowKey(false);
            setShowEndpoint(false);
            setShowResponse(false);
            setShowFullResponse(false);
          }}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition shadow-md hover:scale-[1.02] active:scale-95 border border-slate-600 text-[11px]"
        >
          🗑️ Clear
        </button>
      </div>

      {/* Info Box */}
      <div className="p-2 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 border border-indigo-700 rounded-lg text-indigo-100 shadow-md" style={{fontSize: '9px'}}>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="font-bold flex items-center gap-1">💡 Tip:</span>
          <span className="text-indigo-200">Paste key with Ctrl+V</span>
          <span className="text-indigo-200">• 👁️ to show/hide</span>
          {isBulkMode && <span className="text-indigo-200">• 1s delay between tests</span>}
        </div>
      </div>

      {/* Test Result */}
      {testResult && (() => {
        const endpointUrl = selectedProvider ? PROVIDER_MAP[selectedProvider]?.request('')?.url : null;
        const prettyResponse = (() => {
          if (!testResult.responseBody) return null;
          try {
            const parsed = JSON.parse(testResult.responseBody);
            return JSON.stringify(parsed, null, 2);
          } catch {
            return testResult.responseBody;
          }
        })();
        const responseTruncated = prettyResponse && prettyResponse.length > 200;

        return (
          <div className="text-left">
            <div
              className={`p-2.5 rounded-lg border-l-4 shadow-lg transition ${
                testResult.success
                  ? 'bg-gradient-to-r from-green-900 to-green-800 border-green-400 text-green-100'
                  : 'bg-gradient-to-r from-red-900 to-red-800 border-red-400 text-red-100'
              }`}
            >
              {/* Top row: provider badge + status + toggles */}
              <p className="font-bold text-xs flex items-center gap-1.5">
                {selectedProvider && PROVIDER_MAP[selectedProvider] && (
                  <span className={`${PROVIDER_MAP[selectedProvider].color || 'bg-gray-600'} px-1.5 py-px rounded text-white font-bold shrink-0`} style={{fontSize: '9px'}}>
                    {PROVIDER_MAP[selectedProvider].name}
                  </span>
                )}
                {testResult.success ? '✅ Success' : '❌ Failed'}
                {endpointUrl && (
                  <button
                    onClick={() => setShowEndpoint(!showEndpoint)}
                    className={`px-1 py-px rounded text-[9px] font-mono transition-all ${
                      showEndpoint
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/70 hover:bg-slate-600 text-gray-400 hover:text-gray-200'
                    }`}
                    title="Toggle endpoint URL"
                  >
                    🔗 endpoint
                  </button>
                )}
                {testResult.responseBody && (
                  <button
                    onClick={() => setShowResponse(!showResponse)}
                    className={`px-1 py-px rounded text-[9px] font-mono transition-all ${
                      showResponse
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700/70 hover:bg-slate-600 text-gray-400 hover:text-gray-200'
                    }`}
                    title="Toggle response body"
                  >
                    📋 response
                  </button>
                )}
              </p>

              {/* Message */}
              <p className="text-[11px] mt-1 leading-relaxed">{testResult.message}</p>

              {/* Expanded: Endpoint */}
              {showEndpoint && endpointUrl && (
                <div className="mt-1.5 pt-1.5 border-t border-white/10">
                  <div className="flex items-center gap-1.5 bg-black/25 rounded px-2 py-1">
                    <span className="text-[9px] text-blue-300 shrink-0 font-bold">🔗 Endpoint:</span>
                    <code className="font-mono text-[9px] text-blue-100 break-all flex-1">{endpointUrl}</code>
                  </div>
                </div>
              )}

              {/* Expanded: Response */}
              {showResponse && prettyResponse && (
                <div className="mt-1.5 pt-1.5 border-t border-white/10">
                  <div className="bg-black/25 rounded px-2 py-1">
                    <span className="text-[9px] text-purple-300 font-bold">📋 Response:</span>
                    <pre className="font-mono text-[9px] text-purple-100 whitespace-pre-wrap break-all overflow-x-auto max-h-40 overflow-y-auto bg-black/20 rounded px-1.5 py-1 mt-0.5">
                      {showFullResponse || !responseTruncated
                        ? prettyResponse
                        : prettyResponse.slice(0, 200) + '…'
                      }
                    </pre>
                    {responseTruncated && (
                      <button
                        onClick={() => setShowFullResponse(!showFullResponse)}
                        className="text-[9px] text-purple-400 hover:text-purple-200 transition mt-0.5"
                      >
                        {showFullResponse ? '▲ Show less' : `▼ Show full response (${prettyResponse.length} chars)`}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Latency */}
              {testResult.latency && (
                <p className="text-[11px] mt-1 opacity-90 flex items-center gap-1.5 font-mono">
                  <span>⏱️</span> <strong>{testResult.latency.toFixed(0)}ms</strong>
                </p>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
