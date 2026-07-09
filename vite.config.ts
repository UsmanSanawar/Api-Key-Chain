import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const devApiProxy = () => ({
  name: 'dev-api-proxy',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const url = req.url || '';

      if (!url.startsWith('/api/test-provider')) {
        return next();
      }

      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
        return;
      }

      let body = '';
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          const apiKey = parsed?.apiKey as string | undefined;
          const provider = parsed?.provider as string | undefined;

          if (!apiKey || !provider) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: false, message: 'Provider and API key required' }));
            return;
          }

          let targetUrl = '';
          let headers: Record<string, string> = {};

          if (provider === 'openai') {
            targetUrl = 'https://api.openai.com/v1/models';
            headers = { Authorization: `Bearer ${apiKey}` };
          } else if (provider === 'anthropic') {
            targetUrl = 'https://api.anthropic.com/v1/models';
            headers = {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            };
          } else if (provider === 'gemini') {
            targetUrl = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
          } else if (provider === 'mistral') {
            targetUrl = 'https://api.mistral.ai/v1/models';
            headers = { Authorization: `Bearer ${apiKey}` };
          } else if (provider === 'cohere') {
            targetUrl = 'https://api.cohere.ai/v1/models';
            headers = { Authorization: `Bearer ${apiKey}` };
          } else if (provider === 'huggingface') {
            targetUrl = 'https://huggingface.co/api/whoami-v2';
            headers = { Authorization: `Bearer ${apiKey}` };
          } else if (provider === 'groq') {
            targetUrl = 'https://api.groq.com/openai/v1/models';
            headers = { Authorization: `Bearer ${apiKey}` };
          } else if (provider === 'openrouter') {
            targetUrl = 'https://openrouter.ai/api/v1/models';
            headers = { Authorization: `Bearer ${apiKey}` };
          } else if (provider === 'together') {
            targetUrl = 'https://api.together.xyz/v1/models';
            headers = { Authorization: `Bearer ${apiKey}` };
          } else if (provider === 'perplexity') {
            targetUrl = 'https://api.perplexity.ai/models';
            headers = { Authorization: `Bearer ${apiKey}` };
          } else if (provider === 'deepseek') {
            targetUrl = 'https://api.deepseek.com/v1/models';
            headers = { Authorization: `Bearer ${apiKey}` };
          } else if (provider === 'github') {
            targetUrl = 'https://api.github.com/user';
            headers = {
              Authorization: `Bearer ${apiKey}`,
              Accept: 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
            };
          } else if (provider === 'stripe') {
            targetUrl = 'https://api.stripe.com/v1/customers?limit=1';
            headers = { Authorization: `Bearer ${apiKey}` };
          } else if (provider === 'sendgrid') {
            targetUrl = 'https://api.sendgrid.com/v3/user/profile';
            headers = { Authorization: `Bearer ${apiKey}` };
          } else if (provider === 'xai') {
            targetUrl = 'https://api.x.ai/v1/models';
            headers = { Authorization: `Bearer ${apiKey}` };
          } else if (provider === 'glm') {
            targetUrl = 'https://open.bigmodel.cn/api/paas/v4/models';
            headers = { Authorization: `Bearer ${apiKey}` };
          } else if (provider === 'kimi') {
            targetUrl = 'https://api.moonshot.cn/v1/models';
            headers = { Authorization: `Bearer ${apiKey}` };
          } else if (provider === 'qwen') {
            targetUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/models';
            headers = { Authorization: `Bearer ${apiKey}` };
          } else if (provider === 'doubao') {
            targetUrl = 'https://ark.cn-beijing.volces.com/api/v3/models';
            headers = { Authorization: `Bearer ${apiKey}` };
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: false, message: 'Not found' }));
            return;
          }

          const startTime = Date.now();
          const response = await fetch(targetUrl, {
            method: 'GET',
            headers,
          });

          const latency = Date.now() - startTime;

let message = 'API key is valid';
          let success = response.ok || response.status === 429;

          if (!response.ok) {
            if (response.status === 401) {
              message = 'Invalid or expired API key (401 Unauthorized)';
            } else if (response.status === 403) {
              message = 'API key forbidden (403 Forbidden)';
            } else if (response.status === 429) {
              message = 'API key is valid (rate limited)';
            } else if (response.status === 400) {
              message = 'Invalid API key format (400 Bad Request)';
            } else {
              message = `API error: ${response.status} ${response.statusText}`;
            }
            success = response.status === 429;
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(
            JSON.stringify({
              success,
              message,
              latency,
              status: response.status,
            })
          );
        } catch (error: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(
            JSON.stringify({
              success: false,
              message: `Network error: ${error?.message || 'Unknown error'}`,
            })
          );
        }
      });
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), devApiProxy()],
})
