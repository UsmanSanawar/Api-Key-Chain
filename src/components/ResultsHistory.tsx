import { useAppStore } from '../store/useAppStore';
import { PROVIDER_MAP } from '../../shared/providers';

const STATUS_COLORS: Record<string, string> = {
  'true': 'bg-gradient-to-r from-green-900 to-green-800 border-l-4 border-green-400 text-green-100',
  'false': 'bg-gradient-to-r from-red-900 to-red-800 border-l-4 border-red-400 text-red-100',
};

export function ResultsHistory() {
  const results = useAppStore((state) => state.results);
  const clearResults = useAppStore((state) => state.clearResults);

  const handleCopy = (fullKey: string | undefined, keyPreview: string | undefined) => {
    const value = fullKey || keyPreview;
    if (value) {
      navigator.clipboard.writeText(value).then(() => {
        alert(fullKey ? 'Full key copied!' : 'Key preview copied!');
      }).catch(() => {
        alert('Failed to copy');
      });
    }
  };

  if (results.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
        <p className="text-gray-400 text-base">📋 No test results yet</p>
        <p className="text-gray-500 text-xs mt-2">Start testing API keys to see results here</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3 text-center">
      <div className="flex flex-col items-center gap-1.5">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          📊 Test History
          <span className="text-base text-gray-500">({results.length})</span>
        </h2>
        <button
          onClick={clearResults}
          className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 rounded-lg text-white transition font-medium shadow-md"
        >
          🗑️ Clear All
        </button>
      </div>

      <div className="space-y-2">
        {results.map((result) => (
          <div
            key={result.id}
            className={`p-3 rounded-lg shadow-lg ${STATUS_COLORS[result.success ? 'true' : 'false']}`}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 text-left">
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className={`${PROVIDER_MAP[result.provider]?.color || 'bg-gray-600'} px-2 py-0.5 rounded-full text-white font-bold`} style={{fontSize: '10px'}}>
                    {PROVIDER_MAP[result.provider]?.name || result.provider}
                  </span>
                  <span className="text-sm font-bold">
                    {result.success ? '✅' : '❌'}
                  </span>
                  {result.keyPreview && (
                    <span className="font-mono bg-slate-700 px-1.5 py-0.5 rounded text-gray-300" style={{fontSize: '10px'}}>
                      {result.keyPreview}
                    </span>
                  )}
                  {(result.fullKey || result.keyPreview) && (
                    <button
                      onClick={() => handleCopy(result.fullKey, result.keyPreview)}
                      className="text-gray-400 hover:text-white transition" style={{fontSize: '10px'}}
                      title={result.fullKey ? 'Copy full key' : 'Copy key preview'}
                    >
                      📋
                    </button>
                  )}
                </div>
                <p className="text-xs leading-relaxed">{result.message}</p>
              </div>
              <div className="text-right whitespace-nowrap flex flex-col items-end gap-0.5">
                {result.latency && (
                  <p className="font-mono font-bold text-xs">⏱️ {result.latency.toFixed(0)}ms</p>
                )}
                <p className="opacity-80 font-mono" style={{fontSize: '9px'}}>
                  {new Date(result.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
