import { useEffect, useState } from 'react';
import { useKeyInput } from '../hooks/useKeyInput';
import { useApiTest } from '../hooks/useApiTest';
import { PROVIDERS_SORTED } from '../../shared/providers';
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
    { success: boolean; message: string; latency?: number } | null
  >(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [providerSearch, setProviderSearch] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkKeys, setBulkKeys] = useState('');

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
    let provider = selectedProvider;
    
    if (!provider || !bulkKeys.trim()) {
      setTestResult({
        success: false,
        message: 'Please provide at least one API key and select a provider',
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
    try {
      // Test each key with 1 second delay
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        // Trigger tests through the same flow as single test
        await test(provider, key);
        
        // Add 1 second delay between tests (but not after the last one)
        if (i < keys.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      setTestResult({
        success: true,
        message: `Successfully tested ${keys.length} API key${keys.length > 1 ? 's' : ''}. Results shown in history.`,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error during bulk testing: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    <div className="w-full max-w-2xl mx-auto space-y-4 text-center">
      {/* API Key Input Section */}
      <div className="space-y-2 p-4 bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-sm">
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
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition font-mono text-xs min-h-[100px] resize-none"
              />
            ) : (
              <>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  placeholder="Paste your API key..."
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition font-mono text-xs"
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
      <div className="space-y-3 p-5 bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <label className="block text-xs font-bold text-gray-200 uppercase tracking-widest">
            Provider
          </label>

          {/* Toggle Switch */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-gray-400">Manual</span>
            <button
              onClick={() => setAutoDetect(!autoDetect)}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                autoDetect ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoDetect ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className="text-xs text-gray-400">Auto</span>
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

        <div className="grid grid-cols-4 gap-2">
          {PROVIDERS_SORTED.filter((provider) => {
            const query = providerSearch.trim().toLowerCase();
            if (!query) return true;
            return (
              provider.name.toLowerCase().includes(query) ||
              provider.id.toLowerCase().includes(query)
            );
          }).map((provider) => {
            const isSelected = selectedProvider === provider.id;
            const isDisabled = autoDetect;

            return (
              <button
                key={provider.id}
                onClick={() => !isDisabled && setSelectedProvider(provider.id)}
                disabled={isDisabled}
                className={`py-2 px-2 rounded-lg transition border-2 flex flex-col items-center justify-center gap-0.5 h-16 ${
                  isSelected
                    ? 'bg-[#f2f5f3] text-slate-900 opacity-100 shadow-lg border-blue-400'
                    : 'bg-[#f2f5f3] text-slate-800 border-gray-300'
                } ${
                  isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:shadow-md hover:scale-110 active:scale-95 transition-transform duration-200'
                }`}
              >
                <img 
                  src={provider.logoUrl} 
                  alt={provider.name}
                  className="w-auto h-full object-contain max-h-[60px]"
                />
                <span className="text-[10px] leading-tight">{provider.name}</span>
              </button>
            );
          })}
        </div>

        {autoDetect && detectedProvider === 'gemini' && apiKey.startsWith('AIza') && (
          <div className="text-[10px] text-amber-300 text-center">
            If this is a Google Maps key, switch to Google Maps manually.
          </div>
        )}

        {selectedProvider === 'twilio' && (
          <div className="text-[10px] text-amber-300 text-center">
            Twilio needs Account SID + Auth Token or API Key + Secret (Basic auth).
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleTest}
          disabled={isLoading || (!isBulkMode && !apiKey) || (isBulkMode && !bulkKeys.trim()) || !selectedProvider}
          className="flex-1 py-3 px-5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition text-sm shadow-xl transform hover:scale-105 active:scale-95 disabled:hover:scale-100 border border-blue-400 disabled:border-slate-500"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
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
          }}
          className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition shadow-lg transform hover:scale-105 active:scale-95 border border-slate-600 text-xs"
        >
          🗑️ Clear
        </button>
      </div>

      {/* Info Box */}
      <div className="p-3 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 border border-indigo-700 rounded-lg text-indigo-100 shadow-lg" style={{fontSize: '10px'}}>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="font-bold flex items-center gap-1">💡 Tip:</span>
          <span className="text-indigo-200">Paste key with Ctrl+V</span>
          <span className="text-indigo-200">• 👁️ to show/hide</span>
          {isBulkMode && <span className="text-indigo-200">• 1s delay between tests</span>}
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div
          className={`p-3 rounded-lg border-l-4 shadow-xl transform transition ${
            testResult.success
              ? 'bg-gradient-to-r from-green-900 to-green-800 border-green-400 text-green-100'
              : 'bg-gradient-to-r from-red-900 to-red-800 border-red-400 text-red-100'
          }`}
        >
          <p className="font-bold text-sm flex items-center gap-2">
            {testResult.success ? '✅ Success' : '❌ Failed'}
          </p>
          <p className="text-xs mt-1.5 leading-relaxed">{testResult.message}</p>
          {testResult.latency && (
            <p className="text-xs mt-1.5 opacity-90 flex items-center gap-2 font-mono">
              <span>⏱️</span> <strong>{testResult.latency.toFixed(0)}ms</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
