import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { PROVIDER_MAP } from '../../shared/providers';

type ExpandedState = Record<string, { endpoint?: boolean; response?: boolean; responseFull?: boolean }>;

export function ResultsHistory() {
  const results = useAppStore((state) => state.results);
  const clearResults = useAppStore((state) => state.clearResults);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const toggle = (id: string, key: 'endpoint' | 'response') => {
    setExpanded((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: !prev[id]?.[key] },
    }));
  };

  const toggleResponseFull = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: { ...prev[id], responseFull: !prev[id]?.responseFull },
    }));
  };

  const handleCopy = (id: string, fullKey: string | undefined, keyPreview: string | undefined) => {
    const value = fullKey || keyPreview;
    if (value) {
      navigator.clipboard.writeText(value).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
      }).catch(() => {});
    }
  };

  const prettyPrint = (raw: string | undefined): string | null => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return raw;
    }
  };

  const truncateResponse = (text: string, maxLen = 200): string => {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + '…';
  };

  if (results.length === 0) {
    return (
      <div className="p-5 text-center rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
        <p className="text-gray-400 text-sm">📋 No test results yet</p>
        <p className="text-gray-500 text-[10px] mt-1">Start testing API keys to see results here</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-2 text-left">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-gray-100 flex items-center gap-1.5">
          📊 Test History
          <span className="text-xs text-gray-500">({results.length})</span>
        </h2>
        <button
          onClick={clearResults}
          className="px-2 py-1 text-[10px] bg-red-600 hover:bg-red-500 rounded text-white transition font-medium shadow-sm"
        >
          🗑️ Clear All
        </button>
      </div>

      <div className="space-y-1.5">
        {results.map((result) => {
          const isCopied = copiedId === result.id;
          const endpointUrl = PROVIDER_MAP[result.provider]?.request('')?.url;
          const prettyResponse = prettyPrint(result.responseBody);
          const exp = expanded[result.id] || {};
          const responseTruncated = prettyResponse && prettyResponse.length > 200;

          return (
            <div
              key={result.id}
              className={`p-2 rounded-lg shadow-md transition-all ${
                result.success
                  ? 'bg-gradient-to-r from-green-900/80 to-green-800/80 border-l-4 border-green-400 text-green-100'
                  : 'bg-gradient-to-r from-red-900/80 to-red-800/80 border-l-4 border-red-400 text-red-100'
              }`}
            >
              {/* Main row */}
              <div className="flex justify-between items-center gap-2">
                {/* Left: provider + status + toggles + message */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`${PROVIDER_MAP[result.provider]?.color || 'bg-gray-600'} px-1.5 py-px rounded text-white font-bold shrink-0`} style={{fontSize: '9px'}}>
                      {PROVIDER_MAP[result.provider]?.name || result.provider}
                    </span>
                    <span className="text-[11px] font-bold shrink-0">
                      {result.success ? '✅' : '❌'}
                    </span>

                    {/* Toggle pills */}
                    {endpointUrl && (
                      <button
                        onClick={() => toggle(result.id, 'endpoint')}
                        className={`px-1 py-px rounded text-[9px] font-mono transition-all shrink-0 ${
                          exp.endpoint
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700/70 hover:bg-slate-600 text-gray-400 hover:text-gray-200'
                        }`}
                        title="Toggle endpoint URL"
                      >
                        🔗
                      </button>
                    )}
                    {result.responseBody && (
                      <button
                        onClick={() => toggle(result.id, 'response')}
                        className={`px-1 py-px rounded text-[9px] font-mono transition-all shrink-0 ${
                          exp.response
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-700/70 hover:bg-slate-600 text-gray-400 hover:text-gray-200'
                        }`}
                        title="Toggle response body"
                      >
                        📋
                      </button>
                    )}

                    <span className="text-[10px] truncate opacity-80">{result.message}</span>
                  </div>
                </div>

                {/* Center: key preview + copy */}
                <div className="flex items-center gap-1 shrink-0">
                  {result.keyPreview && (
                    <code className="font-mono bg-slate-700/80 px-1.5 py-px rounded text-gray-300 text-[9px] select-none">
                      {result.keyPreview}
                    </code>
                  )}
                  {(result.fullKey || result.keyPreview) && (
                    <button
                      onClick={() => handleCopy(result.id, result.fullKey, result.keyPreview)}
                      className={`px-1.5 py-px rounded text-[9px] transition-all duration-200 shrink-0 ${
                        isCopied
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-600 hover:bg-slate-500 text-gray-300 hover:text-white'
                      }`}
                      title={result.fullKey ? 'Copy full key' : 'Copy key preview'}
                    >
                      {isCopied ? '✓ Copied' : '📋 Copy'}
                    </button>
                  )}
                </div>

                {/* Right: latency + time */}
                <div className="text-right shrink-0 flex items-center gap-2">
                  {result.latency && (
                    <span className="font-mono font-bold text-[10px] opacity-90">
                      {result.latency.toFixed(0)}ms
                    </span>
                  )}
                  <span className="opacity-60 font-mono text-[8px]">
                    {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Expanded: Endpoint */}
              {exp.endpoint && endpointUrl && (
                <div className="mt-1.5 pt-1.5 border-t border-white/10">
                  <div className="flex items-center gap-1.5 bg-black/25 rounded px-2 py-1">
                    <span className="text-[9px] text-blue-300 shrink-0 font-bold">🔗 Endpoint:</span>
                    <code className="font-mono text-[9px] text-blue-100 break-all flex-1">{endpointUrl}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(endpointUrl);
                      }}
                      className="text-[9px] px-1 py-px rounded bg-slate-600 hover:bg-slate-500 text-gray-300 hover:text-white transition shrink-0"
                      title="Copy endpoint URL"
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}

              {/* Expanded: Response */}
              {exp.response && prettyResponse && (
                <div className="mt-1.5 pt-1.5 border-t border-white/10">
                  <div className="bg-black/25 rounded px-2 py-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] text-amber-300 font-bold">📋 Response:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(prettyResponse);
                        }}
                        className="text-[9px] px-1 py-px rounded bg-slate-600 hover:bg-slate-500 text-gray-300 hover:text-white transition shrink-0"
                        title="Copy full response"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <pre className="font-mono text-[9px] text-purple-100 whitespace-pre-wrap break-all overflow-x-auto max-h-40 overflow-y-auto bg-black/20 rounded px-1.5 py-1">
                      {exp.responseFull || !responseTruncated
                        ? prettyResponse
                        : truncateResponse(prettyResponse)
                      }
                    </pre>
                    {responseTruncated && (
                      <button
                        onClick={() => toggleResponseFull(result.id)}
                        className="text-[9px] text-purple-400 hover:text-purple-200 transition mt-0.5"
                      >
                        {exp.responseFull ? '▲ Show less' : `▼ Show full response (${prettyResponse.length} chars)`}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
