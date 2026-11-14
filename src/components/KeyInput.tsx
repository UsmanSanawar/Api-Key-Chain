import { useEffect, useState } from 'react';
import { useKeyInput } from '../hooks/useKeyInput';
import { useApiTest } from '../hooks/useApiTest';
import { detectProvider } from '../utils/detection';
import { looksLikeEnvFile, parseEnvFile } from '../utils/envParser';
import { PROVIDERS_SORTED, PROVIDER_MAP } from '../../shared/providers';
import type { ProviderMeta } from '../../shared/providers';
import type { ProviderType, TestVia } from '../types';

type DisplayResult = {
  success: boolean;
  message: string;
  latency?: number;
  responseBody?: string;
  endpoint?: string;
  via?: TestVia;
};

type BulkRow = {
  /** Variable name (.env mode) or masked key (list mode). */
  label: string;
  provider: ProviderType | null;
  state: 'pending' | 'testing' | 'valid' | 'invalid' | 'skipped';
  detail: string;
  latency?: number;
};

const maskKey = (key: string) => (key.length > 10 ? `${key.slice(0, 6)}…${key.slice(-4)}` : '••••');

export function ProviderLogo({ provider, className }: { provider: ProviderMeta; className?: string }) {
  if (!provider.logoUrl) {
    const initials = provider.name.replace(/\(.*\)/, '').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2);
    return (
      <span className={`${provider.color} text-white font-bold rounded flex items-center justify-center text-[10px] w-7 h-7`}>
        {initials.toUpperCase()}
      </span>
    );
  }
  return <img src={provider.logoUrl} alt={provider.name} loading="lazy" className={className} />;
}

export interface KeyInputProps {
  /**
   * Provider this tester is for (e.g. on a provider landing page).
   * Auto-detect stays on: a key matching this provider's pattern, or with no
   * detectable pattern, is tested against it; a key that clearly belongs to
   * another provider switches to that provider. The provider grid starts
   * collapsed. Omit for the general tester.
   */
  defaultProvider?: ProviderType;
  /** Start in bulk mode (e.g. on a ".env checker" page). Defaults to single. */
  defaultMode?: 'single' | 'bulk';
}

export function KeyInput({ defaultProvider, defaultMode = 'single' }: KeyInputProps = {}) {
  const {
    apiKey,
    detectedProvider,
    handleKeyChange,
    reset,
  } = useKeyInput();
  const { test } = useApiTest();
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<DisplayResult | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(defaultProvider ?? null);
  const [showProviderGrid, setShowProviderGrid] = useState(!defaultProvider);
  const defaultMeta = defaultProvider ? PROVIDER_MAP[defaultProvider] : undefined;
  const [showKey, setShowKey] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [providerSearch, setProviderSearch] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(defaultMode === 'bulk');
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
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
    if (!autoDetect) return; // In manual mode keep the user's selection.
    if (defaultProvider) {
      const pattern = PROVIDER_MAP[defaultProvider]?.detectPattern ?? null;
      const fitsDefault = !apiKey || pattern === null || pattern.test(apiKey);
      setSelectedProvider(fitsDefault ? defaultProvider : detectedProvider ?? defaultProvider);
      return;
    }
    setSelectedProvider(detectedProvider ?? null);
  }, [detectedProvider, autoDetect, apiKey, defaultProvider]);

  // Parse bulk keys: support both newline and comma separated
  const parseBulkKeys = (input: string): string[] => {
    return input
      .split(/[\n,]/)
      .map(key => key.trim())
      .filter(key => key.length > 0);
  };

  const handleBulkTest = async () => {
    // Build the work list: a .env file (NAME=value lines) or a plain list of keys.
    const isEnv = looksLikeEnvFile(bulkKeys);
    const jobs: { label: string; key: string; provider: ProviderType | null; skip?: string }[] = isEnv
      ? parseEnvFile(bulkKeys).map((e) => ({ label: e.name, key: e.value, provider: e.provider, skip: e.skipReason }))
      : parseBulkKeys(bulkKeys).map((key) => {
          const provider = detectProvider(key);
          return {
            label: maskKey(key),
            key,
            provider,
            skip: provider ? undefined : 'provider not recognised: test it in Single mode and pick the provider',
          };
        });

    if (jobs.length === 0) {
      setBulkRows([]);
      setTestResult({
        success: false,
        message: isEnv ? 'No variables found in the pasted .env content' : 'Please provide at least one API key',
      });
      return;
    }

    const rows: BulkRow[] = jobs.map((j) => ({
      label: j.label,
      provider: j.provider,
      state: j.provider ? 'pending' : 'skipped',
      detail: j.provider ? 'Waiting…' : j.skip ?? 'skipped',
    }));
    setBulkRows([...rows]);

    const toTest = jobs.map((j, index) => ({ ...j, index })).filter((j) => j.provider);
    if (toTest.length === 0) {
      setTestResult({
        success: false,
        message: isEnv
          ? `No API keys recognised in ${jobs.length} variable${jobs.length > 1 ? 's' : ''}. Nothing was sent anywhere.`
          : 'No keys were recognised. Test them in Single mode and pick the provider manually.',
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);
    let valid = 0;
    let invalid = 0;

    try {
      for (let n = 0; n < toTest.length; n++) {
        const job = toTest[n];
        const provider = job.provider as ProviderType;
        rows[job.index] = { ...rows[job.index], state: 'testing', detail: 'Testing…' };
        setBulkRows([...rows]);

        const result = await test(provider, job.key);
        if (result.success) valid++;
        else invalid++;
        rows[job.index] = {
          ...rows[job.index],
          state: result.success ? 'valid' : 'invalid',
          detail: result.message,
          latency: result.latency,
        };
        setBulkRows([...rows]);
        setTestResult({ ...result, message: `[${n + 1}/${toTest.length}] ${job.label} (${PROVIDER_MAP[provider].name}): ${result.message}` });

        // 1 second between requests to stay polite with provider rate limits
        if (n < toTest.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const skipped = jobs.length - toTest.length;
      const parts = [`Tested ${toTest.length} key${toTest.length > 1 ? 's' : ''}: ${valid} valid, ${invalid} invalid.`];
      if (skipped > 0) {
        parts.push(
          isEnv
            ? `${skipped} other variable${skipped > 1 ? 's were' : ' was'} not an API key we can test and ${skipped > 1 ? 'were' : 'was'} not sent anywhere.`
            : `${skipped} key${skipped > 1 ? 's were' : ' was'} not recognised and skipped.`
        );
      }
      setTestResult({ success: invalid === 0, message: parts.join(' ') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (isBulkMode) {
      await handleBulkTest();
      return;
    }

    const provider = selectedProvider;

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
      <div data-webmcp-tool="test_api_key" data-webmcp-description="Test and validate API keys for OpenAI, Anthropic, Google Gemini, DeepSeek, Stripe, GitHub and many more providers" className="space-y-1.5 p-3 bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-gray-200 uppercase tracking-widest">
            API Key
          </label>

          {/* Single/Bulk Toggle */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-gray-400">Single</span>
            <button
              onClick={() => setIsBulkMode(!isBulkMode)}
              aria-label={isBulkMode ? 'Switch to single key mode' : 'Switch to bulk key mode'}
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
                placeholder={'Paste API keys (one per line or comma-separated), or a whole .env file:\nOPENAI_API_KEY=sk-...\nMISTRAL_API_KEY=...'}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition font-mono text-[11px] min-h-[90px] resize-y"
              />
            ) : (
              <>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.includes(',')) {
                      setIsBulkMode(true);
                      setBulkKeys(val);
                    } else {
                      handleKeyChange(val);
                    }
                  }}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    if (pasted.includes('\n') || pasted.includes(',')) {
                      e.preventDefault();
                      setIsBulkMode(true);
                      setBulkKeys(pasted);
                    }
                  }}
                  placeholder={defaultMeta ? `Paste your ${defaultMeta.name} API key...` : 'Paste your API key...'}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition font-mono text-[11px]"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition text-base bg-slate-800 px-1.5 py-0.5 rounded"
                  title={showKey ? 'Hide key' : 'Show key'}
                  aria-label={showKey ? 'Hide key' : 'Show key'}
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
              aria-label={autoDetect ? 'Switch to manual provider selection' : 'Switch to auto-detect provider'}
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
              aria-label="Search providers"
              className="max-w-[75px] px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition text-xs"
            />
          </div>
        </div>

        {!showProviderGrid && (
          <div className="flex items-center justify-center gap-2 text-[11px] text-gray-300">
            {selectedProvider && PROVIDER_MAP[selectedProvider] ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#f2f5f3] text-slate-900 border-2 border-blue-400">
                <ProviderLogo provider={PROVIDER_MAP[selectedProvider]} className="w-auto h-4 object-contain" />
                <span className="font-semibold">{PROVIDER_MAP[selectedProvider].name}</span>
              </span>
            ) : (
              <span>No provider selected</span>
            )}
            <button
              onClick={() => {
                setShowProviderGrid(true);
                // Grid buttons only work in manual mode (bulk mode always auto-detects).
                if (!isBulkMode) setAutoDetect(false);
              }}
              className="text-blue-300 hover:text-blue-200 underline underline-offset-2 transition"
            >
              Change provider
            </button>
          </div>
        )}

        {showProviderGrid && (
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
                title={provider.transport === 'proxy' ? `${provider.name} — tested via relay (blocks browser requests)` : provider.name}
                className={`py-1 px-1.5 rounded-lg transition border-2 flex flex-col items-center justify-center gap-0 h-11 ${
                  isSelected
                    ? 'bg-[#f2f5f3] text-slate-900 opacity-100 shadow-lg border-blue-400'
                    : 'bg-[#f2f5f3] text-slate-800 border-gray-300'
                } ${
                  isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:shadow-md hover:scale-105 active:scale-95 transition-transform duration-200'
                }`}
              >
                <ProviderLogo provider={provider} className="w-auto h-full object-contain max-h-[28px]" />
                <span className="text-[8px] leading-tight">{provider.name}</span>
              </button>
            );
          })}
        </div>
        )}

        {selectedProvider && PROVIDER_MAP[selectedProvider]?.transport === 'proxy' && (
          <div className="text-[10px] text-amber-300 text-center">
            {PROVIDER_MAP[selectedProvider].name} blocks browser requests, so this test is relayed through our stateless
            /api/test-provider function. The key is forwarded once and never logged or stored.
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
            setBulkRows([]);
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
        {isBulkMode && (
          <p className="text-indigo-200/80 mt-1 text-center">
            .env files: only values recognised as API keys are tested. Database URLs, passwords and other values are ignored and never sent anywhere.
          </p>
        )}
      </div>

      {/* Test Result */}
      {testResult && (() => {
        const endpointUrl = testResult.endpoint || (selectedProvider ? PROVIDER_MAP[selectedProvider]?.request('')?.url : null);
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
          <div className="text-left" role="status" aria-live="polite">
            <div
              className={`p-2.5 rounded-lg border-l-4 shadow-lg transition ${
                testResult.success
                  ? 'bg-gradient-to-r from-green-900 to-green-800 border-green-400 text-green-100'
                  : 'bg-gradient-to-r from-red-900 to-red-800 border-red-400 text-red-100'
              }`}
            >
              {/* Top row: provider badge + status + toggles */}
              <p className="font-bold text-xs flex items-center gap-1.5 flex-wrap">
                {!isBulkMode && selectedProvider && PROVIDER_MAP[selectedProvider] && (
                  <span className={`${PROVIDER_MAP[selectedProvider].color || 'bg-gray-600'} px-1.5 py-px rounded text-white font-bold shrink-0`} style={{fontSize: '9px'}}>
                    {PROVIDER_MAP[selectedProvider].name}
                  </span>
                )}
                {testResult.success ? '✅ Success' : '❌ Failed'}
                {testResult.via === 'proxy' && (
                  <span className="px-1 py-px rounded text-[9px] font-mono bg-amber-700/70 text-amber-100" title="Relayed through /api/test-provider">
                    via relay
                  </span>
                )}
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
                    <span className="text-[9px] text-amber-300 font-bold">📋 Response:</span>
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
              {testResult.latency != null && (
                <p className="text-[11px] mt-1 opacity-90 flex items-center gap-1.5 font-mono">
                  <span>⏱️</span> <strong>{testResult.latency.toFixed(0)}ms</strong>
                </p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Bulk / .env results, one row per key or variable */}
      {isBulkMode && bulkRows.length > 0 && (
        <div className="text-left rounded-lg border border-slate-700 bg-slate-900/70 overflow-hidden">
          <ul className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
            {bulkRows.map((row, i) => (
              <li key={`${row.label}-${i}`} className="flex items-start gap-2 px-2.5 py-1.5 text-[11px]">
                <span className="shrink-0 w-4 text-center" aria-hidden="true">
                  {row.state === 'valid' ? '✅' : row.state === 'invalid' ? '❌' : row.state === 'testing' ? '⏳' : row.state === 'pending' ? '•' : '–'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`font-mono break-all ${row.state === 'skipped' ? 'text-gray-500' : 'text-gray-100'}`}>{row.label}</span>
                  {row.provider && PROVIDER_MAP[row.provider] && (
                    <span className={`${PROVIDER_MAP[row.provider].color || 'bg-gray-600'} ml-1.5 px-1.5 py-px rounded text-white font-bold`} style={{ fontSize: '9px' }}>
                      {PROVIDER_MAP[row.provider].name}
                    </span>
                  )}
                  <span className={`block ${row.state === 'invalid' ? 'text-red-300' : row.state === 'valid' ? 'text-green-300' : 'text-gray-500'}`}>
                    {row.detail}
                    {row.latency != null && <span className="font-mono text-gray-400"> · {row.latency.toFixed(0)}ms</span>}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
