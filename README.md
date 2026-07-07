# Api Key Chain

A simple, open-source tool to validate and test API keys for multiple providers. Perfect for developers who need to verify their API credentials quickly.

## Features

✨ **Multi-Provider Support**
- OpenAI, Anthropic, Google Gemini, Mistral, Cohere, Hugging Face, Groq, OpenRouter, Together, Perplexity, DeepSeek, GitHub, Stripe, Twilio, Google Maps, SendGrid

🔍 **Auto-Detection**
- Automatically detects provider based on API key pattern
- Manual selection override available

🎨 **Clean UI**
- Lightweight React component
- Built with Tailwind CSS
- Responsive design
- Official provider logos

⚡ **Fast & Secure**
- Runs client-side (no server submission)
- Uses official provider APIs
- Shows latency metrics
- Password field support

## Installation

```bash
npm install api-key-tester
```

## Quick Start

```jsx
import { KeyInput } from 'api-key-tester';

export default function App() {
  return (
    <div>
      <KeyInput />
    </div>
  );
}
```

## Supported Providers

| Provider | Pattern | Priority |
|----------|---------|----------|
| OpenAI | `sk-` | High |
| Anthropic | `sk-ant-` | High |
| Google Gemini | `AIza...` | High |
| Mistral | `mistral_` | Medium |
| Cohere | UUID format | Medium |
| Hugging Face | `hf_...` | Medium |
| Groq | `gsk_` | Medium |
| OpenRouter | `sk-or-` | Medium |
| Together | `together_` | Low |
| Perplexity | `pplx-` | Low |
| DeepSeek | `sk-deepseek-` | Low |
| GitHub | `ghp_`, `github_pat_` | High |
| Stripe | `sk_test_`, `sk_live_` | Medium |
| Twilio | `SK...` | High |
| Google Maps | Manual selection only | N/A |
| SendGrid | `SG.` | High |

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm build

# Run linter
npm run lint
```

## Project Structure

```
src/
├── components/        # React components
│   └── KeyInput.tsx  # Main component
├── hooks/            # Custom React hooks
├── types/            # TypeScript types
└── App.tsx           # Main app

shared/
├── providers.ts      # Provider configurations
└── api/              # API testing logic
```

## How It Works

1. **Paste API Key** - Enter your API key in the input field
2. **Auto-Detect or Select** - Provider is detected automatically or manually select
3. **Test** - Click "Test" button to validate the key
4. **Result** - See instant feedback with latency metrics

The tool makes real API calls to validate keys. Keys are never stored or sent to any server beyond the official provider APIs.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Adding a New Provider

1. Add provider config to `shared/providers.ts`
2. Define `ProviderMeta` object with:
   - `id`: Unique identifier
   - `name`: Display name
   - `detectPattern`: Regex for auto-detection
   - `logoUrl`: Official logo URL
   - `request`: Function returning API call config
3. Update `PROVIDERS` array
4. Test with your API key

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://github.com/UsmanSanawar/Test-Api-Key)
- 🐛 [Issues](https://github.com/UsmanSanawar/Test-Api-Key/issues)
- 💬 [Discussions](https://github.com/UsmanSanawar/Test-Api-Key/discussions)

## Disclaimer

This tool is for educational and personal use. Always keep your API keys secure and never share them publicly.

## Author

- Usman Sanawar - [GitHub](https://github.com/UsmanSanawar)

---

**⭐ If you find this useful, please star the repository!**
