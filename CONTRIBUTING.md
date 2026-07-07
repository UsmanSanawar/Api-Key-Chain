# Contributing to Api Key Chain

Thank you for your interest in contributing! This document provides guidelines for contributing to the Api Key Chain project.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Test-Api-Key.git
   cd Test-Api-Key
   ```
3. **Create a branch** for your feature:
   ```bash
   git checkout -b feature/my-feature
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Start development server**:
   ```bash
   npm run dev
   ```

## Making Changes

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules: `npm run lint`
- Format code consistently (2 spaces, no semicolons)
- Write meaningful commit messages

### Testing

Before submitting a pull request:
```bash
npm run lint    # Check for linting errors
npm run build   # Ensure project builds
npm run dev     # Test locally
```

## Adding a New Provider

To add support for a new API provider:

1. **Find the logo URL** from official sources (Wikipedia, provider website)
2. **Create detect pattern** - Regex for API key format
3. **Add to `shared/providers.ts`**:

```typescript
{
  id: 'provider-id',
  name: 'Provider Name',
  color: 'bg-blue-600',
  detectPattern: /^pattern_/,
  order: 999,
  detectPriority: 50,
  logoUrl: 'https://official-logo-url.com/logo.svg',
  request: (apiKey) => ({
    url: 'https://api.provider.com/v1/endpoint',
    headers: { Authorization: `Bearer ${apiKey}` },
  }),
}
```

4. **Test with your API key**
5. **Ensure `npm run lint` passes**

### Files to Update

- `shared/providers.ts` - Add provider config
- Update `PROVIDERS_SORTED` order if needed
- Update `README.md` - Add to supported providers table

## Pull Request Process

1. **Create a descriptive PR title**:
   - ✅ `Add Anthropic provider support`
   - ✅ `Fix auto-detection for UUID pattern`
   - ❌ `Fix stuff`

2. **Write a clear description** of what changed and why

3. **Link any related issues**: `Closes #123`

4. **Ensure all checks pass**:
   - ✅ Linting passes
   - ✅ TypeScript compiles
   - ✅ No branch conflicts
   - ✅ At least one maintainer review

5. **Keep PRs focused** - one feature per PR

## Commit Messages

Follow this format:
```
type: brief description

Optional detailed explanation if needed.

Examples:
- feat: add OpenRouter provider
- fix: improve auto-detection accuracy
- docs: update README examples
- refactor: simplify provider detection logic
- chore: update dependencies
```

## Types of Contributions

### Bug Reports 🐛
- Use GitHub Issues
- Include steps to reproduce
- Describe expected vs actual behavior
- Share browser/OS info

### Feature Requests 💡
- Use GitHub Discussions or Issues
- Explain the use case
- Examples help!

### Documentation 📚
- README updates
- Code comments
- JSDoc for functions

### Code Improvements 🔧
- Performance optimizations
- Refactoring
- Better error handling
- New provider support

## Development Tips

### Useful Commands
```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run lint     # Check linting
npm run preview  # Preview production build
```

### Testing Providers

To test a provider:
1. Paste a real API key (or test key if provider offers)
2. The tool will make a real API call
3. Check the result and latency

### Debugging

- Use browser DevTools (F12)
- Check Network tab for API calls
- Inspect React components with React DevTools

## Questions?

- 💬 Open a GitHub Discussion
- 📧 Contact: Usman Sanawar
- 🐛 Found a bug? Open an issue!

## Recognition

All contributors are recognized in:
- This file
- Release notes
- GitHub contributors page

Thank you for contributing! 🎉
