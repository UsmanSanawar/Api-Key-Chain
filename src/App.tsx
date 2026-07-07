import { useState } from 'react';
import './App.css';
import { KeyInput } from './components/KeyInput';
import { ResultsHistory } from './components/ResultsHistory';
import { useAppStore } from './store/useAppStore';

function App() {
  const [showHistory, setShowHistory] = useState(false);
  const results = useAppStore((state) => state.results);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white flex flex-col items-center justify-start p-3 md:p-4">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative w-full max-w-3xl mx-auto flex flex-col items-center text-center">
        {/* Header Section */}
        <header className="mb-3 text-center">
          <h1 className="text-2xl md:text-3xl font-black mb-1 bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <img src="/Api-Key-Chain-H.png" alt="Api Key Chain" className="h-32 w-auto" />
          </h1>
          <p className="text-gray-400 text-xs max-w-xl mx-auto leading-relaxed">
            Test your API keys instantly. Secure, fast, and completely transparent.
          </p>
          <p className="text-gray-400 text-xs max-w-xl mx-auto leading-relaxed">
            Your keys never leave your browser. All tests run client-side. No servers, no storage, no tricks.
          </p>
          <a href="https://github.com/UsmanSanawar/Api-Key-Chain" target="_blank" rel="noopener noreferrer" className="inline-block mt-1 text-yellow-400 hover:text-yellow-300 text-[11px] underline underline-offset-2 transition">
            Review the source code →
          </a>
          <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
            <span className="px-2 py-0.5 bg-gradient-to-r from-green-900 to-green-800 text-green-300 rounded-full text-[10px] font-semibold border border-green-700">✓ Open Source</span>
            <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-900 to-yellow-800 text-blue-300 rounded-full text-[10px] font-semibold border border-yellow-700">🔒 Private</span>
            <span className="px-2 py-0.5 bg-gradient-to-r from-amber-900 to-amber-800 text-amber-300 rounded-full text-[10px] font-semibold border border-amber-700">⚡ Instant</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full flex flex-col items-center space-y-2.5">
          <KeyInput />

          {/* History Toggle Button */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full max-w-2xl mx-auto px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 rounded-lg text-white transition font-semibold text-xs text-center shadow-md hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 border border-slate-500"
          >
            <span className="text-sm">{showHistory ? '▼' : '▶'}</span>
            <span>{showHistory ? 'Hide' : 'Show'} Test History</span>
            {results.length > 0 && <span className="ml-auto text-[10px] text-gray-300">({results.length})</span>}
          </button>

          {/* History Section */}
          {showHistory && <ResultsHistory />}
        </main>

        {/* Footer Section */}
        <footer className="mt-3 text-center text-gray-400 text-[11px] border-t border-gray-800 pt-2.5 w-full space-y-1">
          <p>
            Made by{' '}
            <a href="https://github.com/UsmanSanawar" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:text-yellow-300 font-semibold transition">
              Usman
            </a>
            {' '}with <span className="text-red-400">❤</span> for developers
          </p>
          <a
            href="https://github.com/UsmanSanawar/Api-Key-Chain"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition text-[10px]"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            Star on GitHub
          </a>
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
