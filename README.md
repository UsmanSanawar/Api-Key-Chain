<p align="center">
  <img src="./public/logo.png" alt="Api Key Chain" width="500" />
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/api-key-chain?color=yellow" alt="npm version">
  <img src="https://img.shields.io/github/license/UsmanSanawar/Api-Key-Chain?color=yellow" alt="license">
  <img src="https://img.shields.io/github/stars/UsmanSanawar/Api-Key-Chain?style=social" alt="stars">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs welcome">
</p>

<p align="center">
  <strong>Instantly validate API keys for 43 providers — straight from your browser.</strong><br>
  Open source. Keys never stored. Free.
</p>

<p align="center">
  <a href="https://apikeychain.app"><strong>🌐 Live Demo →</strong></a>
  &nbsp;|&nbsp;
  <a href="https://apikeychain.app/pricing"><strong>☁️ Upgrade to Cloud →</strong></a>
</p>

<p align="center">
  <strong>Tech Stack:</strong>
  React 19 · Vite 7 · Tailwind CSS 4 · TypeScript · Zustand
</p>

---

## 🚀 Features

| | |
|---|---|
| 🌐 **43 Providers** | **LLMs:** OpenAI, Anthropic, Gemini, DeepSeek, xAI, Mistral, Cohere, Perplexity, GLM, Kimi, Qwen, Doubao · **Inference:** Groq, OpenRouter, Together, Hugging Face, Fireworks, Cerebras, Nebius, DeepInfra, Hyperbolic, Novita, AI21, Replicate · **Audio/vector:** ElevenLabs, AssemblyAI, Deepgram, Pinecone · **Email/messaging:** SendGrid, Mailgun, Brevo, Postmark, Resend, Twilio, Slack · **Payments & dev:** Stripe, GitHub, GitLab, Vercel, Netlify, DigitalOcean, Cloudflare, Notion |
| 🔍 **Auto-Detect** | Smart pattern matching identifies your provider — paste a key, we figure out which one |
| ⚡ **Instant Validation** | Real API calls with status codes, latency (ms), and full response body |
| 📦 **Bulk Testing** | Paste multiple keys (comma or newline separated) — auto-switches to bulk mode |
| 🔗 **Endpoint Viewer** | Toggle to see the exact API URL being tested |
| 📋 **Response Viewer** | Pretty-printed JSON response with copy-to-clipboard and expand/collapse |
| 📊 **Test History** | Timestamped results persist in localStorage across refreshes |
| 🔒 **Secure by Design** | Keys are never stored — not on a server, not even in localStorage. Most providers are called straight from your browser |
| 🌐 **CORS Relay** | Providers that block browser requests go through a stateless relay (`api/test-provider.ts`); each result shows `direct` or `via relay` |
| 🌍 **Region Fallback** | GLM, Kimi, Qwen and Mailgun try the international and regional endpoints automatically |
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
npm install api-key-chain
```

## ⚡ Quick Start

```jsx
import { KeyInput, ResultsHistory } from 'api-key-chain';
import 'api-key-chain/dist/style.css';

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
git clone https://github.com/UsmanSanawar/Api-Key-Chain.git
cd Api-Key-Chain
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
3. Click **Test** — one real, read-only API request is sent to the provider
4. See **instant results** with status code, latency, and full response body

> ⚠️ Most providers are called **directly** from your browser. Providers that block browser (CORS) requests — e.g. SendGrid, Doubao, Replicate, Deepgram, Postmark, Resend, Cloudflare — are relayed through a stateless serverless function that forwards the request once and never logs or stores the key. If a direct request fails, the relay is tried as a fallback.

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
│   └── index.ts             # Runs tests direct or via the relay, per provider
├── store/
│   └── useAppStore.ts       # Zustand store with localStorage persistence
├── types/
│   └── index.ts             # TypeScript types (ProviderType, ApiTestResult)
├── utils/
│   ├── detection.ts         # Provider auto-detection engine
│   └── fetch.ts             # Fetch wrapper with timeout (retries timeouts/5xx only)
├── App.tsx                  # Main app layout
└── main.tsx                 # Entry point

shared/
└── providers.ts             # Provider registry + response classifier (single source of truth)

api/
└── test-provider.ts         # Stateless CORS relay (Vercel function, also used by `npm run dev`)
```

---

## ⚙️ Architecture

Every provider is defined once in [`shared/providers.ts`](shared/providers.ts): its test request, whether it can be called from a browser (`transport: 'direct' | 'proxy'`), optional regional fallbacks, and any provider-specific response rules. The same module is used by the browser, the relay and the dev server.

1. **Direct providers** — your browser calls the provider's endpoint (e.g. `api.openai.com/v1/models`)
2. **Relay providers** — the browser posts the key to [`/api/test-provider`](api/test-provider.ts), which forwards one request and returns the classified result. It accepts same-origin requests only (plus `ALLOWED_ORIGINS`), is rate-limited per IP, and never logs or stores the key.
3. The response is classified (200 valid · 401/403 invalid · 429 valid-but-throttled · provider quirks such as Slack's `ok:false`) and shown with status, latency and body.

Test history is kept in `localStorage` **without** the full key — the full key only lives in memory for the current session.

---

## 🛠️ Development

```bash
npm install        # Install dependencies
npm run dev        # Start dev server (http://localhost:5173)
npm run build      # Production build
npm run lint       # ESLint
```

### 🔒 Security Note

Keys are never stored. Most are sent directly from your browser to the provider; relay providers pass through a stateless function that does not log them.
For the cloud version, saved keys are encrypted with AES-256-GCM before storage — see [Privacy Policy](https://apikeychain.app/privacy).

---

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
     logoUrl: 'https://...',          // or '' for an initials badge
     transport: 'direct',             // 'proxy' if the provider blocks browser (CORS) requests
     request: (apiKey) => ({
       url: 'https://api.newprovider.com/v1/models',
       headers: { Authorization: `Bearer ${apiKey}` },
     }),
   }
   ```
2. Add the id to the `ProviderType` union at the top of `shared/providers.ts`
3. Make sure the endpoint **requires** a valid key — some `/models` endpoints answer 200 for any key
4. `npm run dev` serves the relay locally, so both transports can be tested; then submit a PR!

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
