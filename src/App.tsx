import { useState, useEffect } from 'react';
import './App.css';
import { KeyInput } from './components/KeyInput';
import { ResultsHistory } from './components/ResultsHistory';
import { useAppStore } from './store/useAppStore';

function App() {
  const [showHistory, setShowHistory] = useState(false);
  const results = useAppStore((state) => state.results);

  // Enable console and network logging for testing
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    console.log('🚀 API Key Tester Started');
    console.log('📊 Console and Network logging enabled');
    console.log('📝 Check the Network tab (F12 → Network) to see API requests');

    // Override console methods to add timestamp
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const timestamp = () => new Date().toLocaleTimeString();

    console.log = (...args) => {
      originalLog(`[${timestamp()}]`, ...args);
    };

    console.error = (...args) => {
      originalError(`[${timestamp()}]`, ...args);
    };

    console.warn = (...args) => {
      originalWarn(`[${timestamp()}]`, ...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white grid place-items-center p-4 md:p-6">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Header Section */}
        <header className="mb-5 text-center">
          <div className="mb-2 inline-block">
            <div className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl">
              🔐
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-2 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            API Key Tester
          </h1>
          <p className="text-gray-300 text-sm max-w-3xl mx-auto leading-relaxed font-light">
            Test your API keys instantly. Secure, fast, and completely transparent.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1.5 bg-gradient-to-r from-green-900 to-green-800 text-green-300 rounded-full text-xs font-semibold border border-green-700">✓ Open Source</span>
            <span className="px-3 py-1.5 bg-gradient-to-r from-blue-900 to-blue-800 text-blue-300 rounded-full text-xs font-semibold border border-blue-700">🔒 Private</span>
            <span className="px-3 py-1.5 bg-gradient-to-r from-purple-900 to-purple-800 text-purple-300 rounded-full text-xs font-semibold border border-purple-700">⚡ Instant</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full flex flex-col items-center space-y-5">
          <KeyInput />

          {/* History Toggle Button */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full max-w-2xl mx-auto px-5 py-3 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 rounded-lg text-white transition font-semibold text-sm text-center shadow-lg transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 border border-slate-500"
          >
            <span className="text-lg">{showHistory ? '▼' : '▶'}</span>
            <span>{showHistory ? 'Hide' : 'Show'} Test History</span>
            {showHistory && results && <span className="ml-auto text-xs text-gray-300">({results.length})</span>}
          </button>

          {/* History Section */}
          {showHistory && <ResultsHistory />}
        </main>

        {/* Footer Section */}
        <footer className="mt-6 text-center text-gray-400 text-xs border-t border-gray-800 pt-4">
          <p className="text-gray-500">Made with precision for developers</p>
        </footer>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

export default App;
