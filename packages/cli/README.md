# apikeychain

Check that the API keys in a `.env` file or your CI secrets still work, and fail the build when one doesn't.

- Recognises keys for the providers supported by [Api Key Chain](https://apikeychain.app) (OpenAI, Anthropic, Google Gemini, Stripe, GitHub, Slack and many more)
- Sends each key only to its own provider, with one read-only request
- Never prints full keys
- No dependencies, Node 18+

## Usage

```bash
npx apikeychain .env
npx apikeychain --env --only OPENAI_API_KEY,STRIPE_SECRET_KEY
```

| Option | Meaning |
|---|---|
| `[file]` | `.env` file to check (default `.env`) |
| `--env` | Check environment variables instead of a file |
| `--only A,B` | Only these variable names |
| `--json` | Machine-readable output |
| `--strict` | Also fail on provider errors (timeouts, 5xx) and unrecognised keys |
| `--quiet` | Only print problems |
| `-v`, `--version` | Show the version |

Exit codes: `0` all valid · `1` a key is invalid · `2` usage or file error.

## GitHub Action

```yaml
- uses: actions/checkout@v4
- uses: UsmanSanawar/Api-Key-Chain@v1
  with:
    env-names: OPENAI_API_KEY,STRIPE_SECRET_KEY
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

## Want alerts between deploys?

[apikeychain.app](https://apikeychain.app) can watch saved keys and email you when one stops working or is about to expire.

## License

MIT
