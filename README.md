# Api Key Chain 🔐

<p align="center">
  <img src="https://img.shields.io/npm/v/test-api-key?color=yellow" alt="npm version">
  <img src="https://img.shields.io/github/license/UsmanSanawar/Test-Api-Key?color=yellow" alt="license">
  <img src="https://img.shields.io/github/stars/UsmanSanawar/Test-Api-Key?style=social" alt="stars">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs welcome">
</p>

<p align="center">
  <strong>Instantly validate API keys for 19+ providers — directly in your browser.</strong><br>
  Open source. Secure. No server needed.
</p>

<p align="center">
  <a href="https://apikeychain.app"><strong>🌐 Live Demo →</strong></a>
  &nbsp;|&nbsp;
  <a href="https://apikeychain.app/pricing"><strong>☁️ Upgrade to Cloud →</strong></a>
</p>

---

## 🚀 Features

| | |
|---|---|
| 🌐 **19 Providers** | OpenAI, Anthropic, Gemini, DeepSeek, xAI, Groq, Cohere, Mistral, OpenRouter, Together, Perplexity, Hugging Face, GLM, Kimi, Qwen, Doubao, Stripe, SendGrid, GitHub |
| 🔍 **Auto-Detect** | Smart pattern matching identifies your provider — paste a key, we figure out which one |
| ⚡ **Instant Validation** | Real API calls with status codes, latency (ms), and full response body |
| 📦 **Bulk Testing** | Paste multiple keys (comma or newline separated) — auto-switches to bulk mode |
| 🔗 **Endpoint Viewer** | Toggle to see the exact API URL being tested |
| 📋 **Response Viewer** | Pretty-printed JSON response with copy-to-clipboard and expand/collapse |
| 📊 **Test History** | Timestamped results persist in localStorage across refreshes |
| 🔒 **Secure by Design** | Keys never leave your browser — sent directly to provider APIs. No server, no storage |
| 🌐 **CORS-Safe Proxy** | Built-in Vite dev proxy for all 19 providers — test from `localhost` with zero config |
| 📋 **One-Click Copy** | Copy API keys, endpoint URLs, and response bodies in a single click |
| 🎨 **Clean UI** | Dark theme with provider logos, responsive design, Tailwind CSS |

---

## ☁️ Api Key Chain Cloud

The OSS version is fully functional. The [cloud version](https://apikeychain.app) adds:

- 🔒 **Encrypted Key Vault** — Store keys with Zero-Knowledge (PBKDF2 + AES-256-GCM) or Server-Encrypted (Envelope Encryption via Supabase Vault)
- 🩺 **Background Health Checks** — Auto-validate saved keys on schedule
- 📊 **Cloud History & Analytics** — Cross-device synced test history
- 💳 **Premium Plan** — $4.99/month

👉 **[Try Api Key Chain Cloud →](https://apikeychain.app)** | **[View Pricing →](https://apikeychain.app/pricing)**

---

## 📦 Installation

```bash
npm install test-api-key
```

## ⚡ Quick Start

```jsx
import { KeyInput, ResultsHistory } from 'test-api-key';
import 'test-api-key/dist/style.css';

export default function App() {
  return (
    <div>
      <KeyInput />
      <ResultsHistory />
    </div>
  );
}
```

Or clone and run the full app:

```bash
git clone https://github.com/UsmanSanawar/Test-Api-Key.git
cd Test-Api-Key
npm install
npm run dev
```

---

## 🌐 Supported Providers

| Provider | Detect Pattern | Auto-Detect |
|----------|---------------|-------------|
| OpenAI | `sk-proj-...` / `sk-...` | ✅ High |
| Anthropic | `sk-ant-...` | ✅ High |
| Google Gemini | `AIza...` (35 chars) | ✅ High |
| DeepSeek | `sk-...` (32 hex) | ✅ Medium |
| xAI (Grok) | `xai-...` | ✅ Medium |
| Groq | `gsk_...` | ✅ Medium |
| Cohere | `co_...` | ✅ High |
| Mistral AI | Manual selection | ⚠️ No pattern |
| OpenRouter | `sk-or-...` | ✅ Medium |
| Together | Manual selection | ⚠️ No pattern |
| Perplexity | `pplx-...` | ✅ Medium |
| Hugging Face | `hf_...` (34+ chars) | ✅ High |
| GLM (ZhiPu AI) | Manual selection | ⚠️ No pattern |
| Kimi (Moonshot) | Manual selection | ⚠️ No pattern |
| Qwen (Alibaba) | Manual selection | ⚠️ No pattern |
| Doubao (ByteDance) | Manual selection | ⚠️ No pattern |
| Stripe | `sk_test_...` / `sk_live_...` | ✅ High |
| SendGrid | `SG....` | ✅ High |
| GitHub | `ghp_...` / `github_pat_...` | ✅ High |

---

## 🔧 How It Works

1. **Paste** your API key in the input field
2. Provider is **auto-detected** from the key pattern — or select manually
3. Click **Test** — a real API request is sent from your browser to the provider
4. See **instant results** with status code, latency, and full response body

> ⚠️ Keys are sent **directly** to each provider's API from your browser. No intermediary server. Nothing is logged or stored.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── KeyInput.tsx         # Main input + provider grid + test button
│   └── ResultsHistory.tsx   # Test history with endpoint/response toggles
├── hooks/
│   ├── useApiTest.ts        # Test orchestration hook
│   └── useKeyInput.ts       # Key input + auto-detect hook
├── providers/
│   └── index.ts             # API test logic with fallback (edge → direct)
├── store/
│   └── useAppStore.ts       # Zustand store with localStorage persistence
├── types/
│   └── index.ts             # TypeScript types (ProviderType, ApiTestResult)
├── utils/
│   ├── detection.ts         # Provider auto-detection engine
│   └── fetch.ts             # Fetch wrapper with timeout + retries
├── App.tsx                  # Main app layout
└── main.tsx                 # Entry point

shared/
└── providers.ts             # 19 provider definitions (URLs, patterns, logos)

api/
└── test-provider.ts         # Vercel serverless function (production)
```

---

## 🛠️ Development

```bash
npm install        # Install dependencies
npm run dev        # Start dev server (http://localhost:5173)
npm run build      # Production build
npm run lint       # ESLint
```

### Adding a New Provider

1. Add to `shared/providers.ts`:
   ```ts
   {
     id: 'newprovider',
     name: 'New Provider',
     color: 'bg-...-600',
     detectPattern: /^np_/,        // or null if no pattern
     order: 200,                    // sort order in grid
     detectPriority: 100,           // lower = checked first
     logoUrl: 'https://...',
     request: (apiKey) => ({
       url: 'https://api.newprovider.com/v1/models',
       headers: { Authorization: `Bearer ${apiKey}` },
     }),
   }
   ```
2. Add to `src/types/index.ts` → `ProviderType` union
3. Add proxy entry in `vite.config.ts` for dev testing
4. Test and submit a PR!

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 License

MIT © [Usman Sanawar](https://github.com/UsmanSanawar)

---

<p align="center">
  <strong>⭐ Star this repo if you find it useful!</strong><br>
  <a href="https://apikeychain.app">apikeychain.app</a>
</p>
