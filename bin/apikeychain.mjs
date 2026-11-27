#!/usr/bin/env node

// cli/index.ts
import { readFileSync, existsSync } from "node:fs";

// shared/providers.ts
function field(obj, path) {
  let cur = obj;
  for (const part of path.split(".")) {
    if (!cur || typeof cur !== "object") return void 0;
    cur = cur[part];
  }
  if (typeof cur === "string") return cur.trim() ? cur.slice(0, 120) : void 0;
  if (typeof cur === "number" && Number.isFinite(cur)) return String(cur);
  if (typeof cur === "boolean") return cur ? "yes" : "no";
  return void 0;
}
function details(...pairs) {
  return pairs.filter((p) => typeof p[1] === "string" && p[1] !== "").map(([label, value]) => ({ label, value }));
}
function modelCount(body) {
  if (!body || typeof body !== "object") return [];
  const b = body;
  const list = Array.isArray(b.data) ? b.data : Array.isArray(b.models) ? b.models : null;
  return list && list.length > 0 ? [{ label: "Models available", value: String(list.length) }] : [];
}
var usd = (v) => v !== void 0 && !Number.isNaN(Number(v)) ? `$${Number(v).toFixed(2)}` : void 0;
var bearer = (apiKey) => ({ Authorization: `Bearer ${apiKey}` });
var PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    color: "bg-green-600",
    detectPattern: /^sk-(proj-[^.]*\.|.*T3BlbkFJ)/,
    order: 10,
    detectPriority: 90,
    logoUrl: "/providers/openai.svg",
    transport: "direct",
    request: (apiKey) => ({ url: "https://api.openai.com/v1/models", headers: bearer(apiKey) }),
    describe: (_body, _headers, apiKey) => details(["Key type", apiKey.startsWith("sk-proj-") ? "Project key" : apiKey.startsWith("sk-svcacct-") ? "Service account key" : void 0])
  },
  {
    id: "anthropic",
    name: "Anthropic",
    color: "bg-orange-600",
    detectPattern: /^sk-ant-/,
    order: 20,
    detectPriority: 10,
    logoUrl: "/providers/anthropic.svg",
    transport: "direct",
    request: (apiKey) => ({
      url: "https://api.anthropic.com/v1/models",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        // Required for Anthropic to answer CORS preflights from browsers.
        "anthropic-dangerous-direct-browser-access": "true"
      }
    }),
    describe: (_body, _headers, apiKey) => details(["Key type", apiKey.startsWith("sk-ant-admin") ? "Admin key" : apiKey.startsWith("sk-ant-api") ? "API key" : void 0])
  },
  {
    id: "gemini",
    name: "Google Gemini",
    color: "bg-blue-600",
    detectPattern: /^AIza[0-9A-Za-z_-]{35}/,
    order: 30,
    detectPriority: 80,
    logoUrl: "/providers/gemini.svg",
    transport: "direct",
    // Header instead of ?key= so the key never lands in URLs or logs.
    request: (apiKey) => ({
      url: "https://generativelanguage.googleapis.com/v1beta/models",
      headers: { "x-goog-api-key": apiKey }
    })
  },
  {
    id: "mistral",
    name: "Mistral",
    color: "bg-rose-600",
    detectPattern: null,
    order: 40,
    detectPriority: 999,
    logoUrl: "/providers/mistral.svg",
    transport: "direct",
    request: (apiKey) => ({ url: "https://api.mistral.ai/v1/models", headers: bearer(apiKey) })
  },
  {
    id: "cohere",
    name: "Cohere",
    color: "bg-emerald-600",
    // Cohere documents no key prefix, so keys are selected manually.
    detectPattern: null,
    order: 50,
    detectPriority: 999,
    logoUrl: "/providers/cohere.svg",
    transport: "direct",
    request: (apiKey) => ({ url: "https://api.cohere.com/v1/models", headers: bearer(apiKey) })
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    color: "bg-yellow-600",
    detectPattern: /^hf_[A-Za-z0-9]{34,}/,
    order: 60,
    detectPriority: 100,
    logoUrl: "/providers/huggingface.svg",
    transport: "direct",
    request: (apiKey) => ({ url: "https://huggingface.co/api/whoami-v2", headers: bearer(apiKey) }),
    describe: (body) => details(
      ["Account", field(body, "name")],
      ["Token name", field(body, "auth.accessToken.displayName")],
      ["Token role", field(body, "auth.accessToken.role")]
    )
  },
  {
    id: "groq",
    name: "Groq",
    color: "bg-indigo-600",
    detectPattern: /^gsk_/,
    order: 70,
    detectPriority: 20,
    logoUrl: "/providers/groq.svg",
    transport: "direct",
    request: (apiKey) => ({ url: "https://api.groq.com/openai/v1/models", headers: bearer(apiKey) })
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    color: "bg-cyan-600",
    detectPattern: /^sk-or-/,
    order: 80,
    detectPriority: 15,
    logoUrl: "/providers/openrouter.svg",
    transport: "direct",
    // /models is public; /key requires a valid key.
    request: (apiKey) => ({ url: "https://openrouter.ai/api/v1/key", headers: bearer(apiKey) }),
    describe: (body) => details(
      ["Key label", field(body, "data.label")],
      ["Credit limit", field(body, "data.limit") === void 0 ? "No limit" : usd(field(body, "data.limit"))],
      ["Credit remaining", usd(field(body, "data.limit_remaining"))],
      ["Used", usd(field(body, "data.usage"))],
      ["Free tier", field(body, "data.is_free_tier")]
    )
  },
  {
    id: "together",
    name: "Together",
    color: "bg-fuchsia-600",
    detectPattern: null,
    order: 90,
    detectPriority: 999,
    logoUrl: "/providers/together.svg",
    transport: "direct",
    request: (apiKey) => ({ url: "https://api.together.xyz/v1/models", headers: bearer(apiKey) })
  },
  {
    id: "perplexity",
    name: "Perplexity",
    color: "bg-violet-600",
    detectPattern: /^pplx-/,
    order: 100,
    detectPriority: 50,
    logoUrl: "/providers/perplexity.svg",
    transport: "direct",
    // /models (no prefix) answers 404; the orchestrator model list requires a valid key.
    request: (apiKey) => ({ url: "https://api.perplexity.ai/orchestrator/v1/models", headers: bearer(apiKey) })
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    color: "bg-lime-600",
    detectPattern: /^xai-/,
    order: 105,
    detectPriority: 55,
    logoUrl: "data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.30047 8.77631L12.0474 23H16.3799L6.63183 8.77631H2.30047ZM6.6285 16.6762L2.29492 23H6.63072L8.79584 19.8387L6.6285 16.6762ZM17.3709 1L9.88007 11.9308L12.0474 15.0944L21.7067 1H17.3709ZM18.1555 7.76374V23H21.7067V2.5818L18.1555 7.76374Z' fill='%23000'/%3E%3C/svg%3E",
    transport: "direct",
    request: (apiKey) => ({ url: "https://api.x.ai/v1/models", headers: bearer(apiKey) })
  },
  {
    id: "glm",
    name: "GLM (Z.ai / ZhiPu)",
    color: "bg-pink-600",
    detectPattern: null,
    order: 115,
    detectPriority: 999,
    logoUrl: "/providers/glm.svg",
    transport: "direct",
    // International (z.ai) first, then mainland China (bigmodel.cn).
    request: (apiKey) => ({ url: "https://api.z.ai/api/paas/v4/models", headers: bearer(apiKey) }),
    fallbackRequests: (apiKey) => [
      { url: "https://open.bigmodel.cn/api/paas/v4/models", headers: bearer(apiKey) }
    ]
  },
  {
    id: "kimi",
    name: "Kimi (Moonshot)",
    color: "bg-slate-600",
    detectPattern: null,
    order: 117,
    detectPriority: 999,
    logoUrl: "/providers/kimi.png",
    transport: "direct",
    request: (apiKey) => ({ url: "https://api.moonshot.ai/v1/models", headers: bearer(apiKey) }),
    fallbackRequests: (apiKey) => [{ url: "https://api.moonshot.cn/v1/models", headers: bearer(apiKey) }]
  },
  {
    id: "qwen",
    name: "Qwen (Alibaba)",
    color: "bg-red-600",
    detectPattern: null,
    order: 118,
    detectPriority: 999,
    logoUrl: "/providers/qwen.svg",
    transport: "direct",
    request: (apiKey) => ({
      url: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models",
      headers: bearer(apiKey)
    }),
    fallbackRequests: (apiKey) => [
      { url: "https://dashscope.aliyuncs.com/compatible-mode/v1/models", headers: bearer(apiKey) }
    ]
  },
  {
    id: "doubao",
    name: "Doubao (ByteDance)",
    color: "bg-blue-500",
    detectPattern: null,
    order: 119,
    detectPriority: 999,
    logoUrl: "/providers/doubao.jpg",
    transport: "proxy",
    request: (apiKey) => ({ url: "https://ark.cn-beijing.volces.com/api/v3/models", headers: bearer(apiKey) })
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    color: "bg-sky-600",
    detectPattern: /^sk-[a-f0-9]{32}$/,
    order: 120,
    detectPriority: 30,
    logoUrl: "/providers/deepseek.svg",
    transport: "direct",
    request: (apiKey) => ({ url: "https://api.deepseek.com/v1/models", headers: bearer(apiKey) })
  },
  {
    id: "stripe",
    name: "Stripe",
    color: "bg-purple-700",
    detectPattern: /^(sk|rk)_(test|live)_/,
    order: 125,
    detectPriority: 75,
    logoUrl: "/providers/stripe.svg",
    transport: "direct",
    // Balance holds no customer PII, unlike /v1/customers.
    request: (apiKey) => ({ url: "https://api.stripe.com/v1/balance", headers: bearer(apiKey) }),
    interpret: (status, _body, apiKey) => status === 403 && apiKey.startsWith("rk_") ? { success: true, message: "Restricted key is valid (it lacks the Balance read permission used for this test)" } : void 0,
    describe: (body, _headers, apiKey) => details(
      ["Mode", /^(sk|rk)_live_/.test(apiKey) ? "Live" : /^(sk|rk)_test_/.test(apiKey) ? "Test" : field(body, "livemode") === "yes" ? "Live" : void 0],
      ["Key type", apiKey.startsWith("rk_") ? "Restricted key" : apiKey.startsWith("sk_") ? "Secret key" : void 0]
    )
  },
  {
    id: "github",
    name: "GitHub",
    color: "bg-gray-700",
    detectPattern: /^(ghp_|github_pat_)/,
    order: 130,
    detectPriority: 60,
    logoUrl: "/providers/github.png",
    transport: "direct",
    request: (apiKey) => ({
      url: "https://api.github.com/user",
      headers: {
        ...bearer(apiKey),
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    }),
    describe: (body, headers) => {
      const scopes = headers?.get("x-oauth-scopes");
      return details(
        ["Account", field(body, "login")],
        ["Account type", field(body, "type")],
        ["Scopes", scopes === null || scopes === void 0 ? void 0 : scopes.trim() || "none"]
      );
    }
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    color: "bg-blue-700",
    detectPattern: /^SG\./,
    order: 150,
    detectPriority: 95,
    logoUrl: "/providers/sendgrid.png",
    transport: "proxy",
    request: (apiKey) => ({ url: "https://api.sendgrid.com/v3/scopes", headers: bearer(apiKey) }),
    describe: (body) => {
      const scopes = body?.scopes;
      if (!Array.isArray(scopes)) return [];
      return details(
        ["Scopes", String(scopes.length)],
        ["Can send mail", scopes.includes("mail.send") ? "yes" : "no"]
      );
    }
  },
  // ── AI inference ───────────────────────────────────────────────────
  {
    id: "fireworks",
    name: "Fireworks AI",
    color: "bg-orange-500",
    detectPattern: /^fw_/,
    order: 121,
    detectPriority: 40,
    logoUrl: "/providers/fireworks.svg",
    transport: "direct",
    request: (apiKey) => ({ url: "https://api.fireworks.ai/inference/v1/models", headers: bearer(apiKey) })
  },
  {
    id: "cerebras",
    name: "Cerebras",
    color: "bg-orange-700",
    detectPattern: /^csk-/,
    order: 122,
    detectPriority: 41,
    logoUrl: "/providers/cerebras.png",
    transport: "direct",
    request: (apiKey) => ({ url: "https://api.cerebras.ai/v1/models", headers: bearer(apiKey) })
  },
  {
    id: "nebius",
    name: "Nebius Token Factory",
    color: "bg-teal-600",
    detectPattern: null,
    order: 123,
    detectPriority: 999,
    logoUrl: "/providers/nebius.svg",
    transport: "direct",
    request: (apiKey) => ({ url: "https://api.tokenfactory.nebius.com/v1/models", headers: bearer(apiKey) })
  },
  {
    id: "deepinfra",
    name: "DeepInfra",
    color: "bg-indigo-700",
    detectPattern: null,
    order: 124,
    detectPriority: 999,
    logoUrl: "/providers/deepinfra.png",
    transport: "direct",
    // /v1/openai/models answers 200 without a key; /v1/me requires one.
    request: (apiKey) => ({ url: "https://api.deepinfra.com/v1/me", headers: bearer(apiKey) })
  },
  {
    id: "hyperbolic",
    name: "Hyperbolic",
    color: "bg-zinc-700",
    // Keys start with sk_live_, same as Stripe live keys — select manually.
    detectPattern: null,
    order: 126,
    detectPriority: 999,
    logoUrl: "/providers/hyperbolic.png",
    transport: "direct",
    request: (apiKey) => ({ url: "https://api.hyperbolic.ai/inference/v1/models", headers: bearer(apiKey) })
  },
  {
    id: "novita",
    name: "Novita AI",
    color: "bg-emerald-700",
    detectPattern: null,
    order: 127,
    detectPriority: 999,
    logoUrl: "/providers/novita.png",
    transport: "direct",
    // The model list is public; the balance endpoint requires a valid key.
    request: (apiKey) => ({ url: "https://api.novita.ai/openapi/v1/billing/balance/detail", headers: bearer(apiKey) })
  },
  {
    id: "ai21",
    name: "AI21 Labs",
    color: "bg-pink-700",
    detectPattern: null,
    order: 128,
    detectPriority: 999,
    logoUrl: "/providers/ai21.png",
    transport: "direct",
    // /studio/v1/models answers 200 for any key; the file library requires a valid one.
    request: (apiKey) => ({ url: "https://api.ai21.com/studio/v1/library/files", headers: bearer(apiKey) })
  },
  {
    id: "replicate",
    name: "Replicate",
    color: "bg-neutral-700",
    detectPattern: /^r8_/,
    order: 129,
    detectPriority: 42,
    logoUrl: "/providers/replicate.svg",
    transport: "proxy",
    request: (apiKey) => ({ url: "https://api.replicate.com/v1/account", headers: bearer(apiKey) }),
    describe: (body) => details(["Account", field(body, "username")], ["Account type", field(body, "type")])
  },
  // ── Voice & vector ────────────────────────────────────────────────
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    color: "bg-stone-700",
    detectPattern: null,
    order: 131,
    detectPriority: 999,
    logoUrl: "/providers/elevenlabs.svg",
    transport: "direct",
    request: (apiKey) => ({ url: "https://api.elevenlabs.io/v1/user", headers: { "xi-api-key": apiKey } }),
    describe: (body) => {
      const used = field(body, "subscription.character_count");
      const limit = field(body, "subscription.character_limit");
      return details(
        ["Plan", field(body, "subscription.tier")],
        ["Characters used", used && limit ? `${Number(used).toLocaleString("en-US")} / ${Number(limit).toLocaleString("en-US")}` : void 0]
      );
    }
  },
  {
    id: "assemblyai",
    name: "AssemblyAI",
    color: "bg-blue-800",
    detectPattern: null,
    order: 132,
    detectPriority: 999,
    logoUrl: "/providers/assemblyai.png",
    transport: "direct",
    // AssemblyAI takes the raw key in Authorization (no "Bearer").
    request: (apiKey) => ({ url: "https://api.assemblyai.com/v2/transcript?limit=1", headers: { Authorization: apiKey } })
  },
  {
    id: "deepgram",
    name: "Deepgram",
    color: "bg-green-800",
    detectPattern: null,
    order: 133,
    detectPriority: 999,
    logoUrl: "/providers/deepgram.svg",
    transport: "proxy",
    request: (apiKey) => ({ url: "https://api.deepgram.com/v1/projects", headers: { Authorization: `Token ${apiKey}` } }),
    describe: (body) => {
      const projects = body?.projects;
      return Array.isArray(projects) ? details(["Projects", String(projects.length)]) : [];
    }
  },
  {
    id: "pinecone",
    name: "Pinecone",
    color: "bg-cyan-800",
    detectPattern: /^pcsk_/,
    order: 134,
    detectPriority: 43,
    logoUrl: "/providers/pinecone.png",
    transport: "direct",
    request: (apiKey) => ({ url: "https://api.pinecone.io/indexes", headers: { "Api-Key": apiKey } }),
    describe: (body) => {
      const indexes = body?.indexes;
      return Array.isArray(indexes) ? details(["Indexes", String(indexes.length)]) : [];
    }
  },
  // ── Email & messaging ─────────────────────────────────────────────
  {
    id: "mailgun",
    name: "Mailgun",
    color: "bg-red-700",
    detectPattern: null,
    order: 151,
    detectPriority: 999,
    logoUrl: "/providers/mailgun.svg",
    transport: "direct",
    // US region first, then EU.
    request: (apiKey) => ({ url: "https://api.mailgun.net/v4/domains", headers: { Authorization: `Basic ${btoa(`api:${apiKey}`)}` } }),
    fallbackRequests: (apiKey) => [
      { url: "https://api.eu.mailgun.net/v4/domains", headers: { Authorization: `Basic ${btoa(`api:${apiKey}`)}` } }
    ]
  },
  {
    id: "brevo",
    name: "Brevo",
    color: "bg-teal-700",
    detectPattern: /^xkeysib-/,
    order: 152,
    detectPriority: 44,
    logoUrl: "/providers/brevo.svg",
    transport: "direct",
    request: (apiKey) => ({ url: "https://api.brevo.com/v3/account", headers: { "api-key": apiKey } }),
    describe: (body) => {
      const plans = body?.plan;
      const first = Array.isArray(plans) ? plans[0] : void 0;
      return details(["Company", field(body, "companyName")], ["Plan", field(first, "type")]);
    }
  },
  {
    id: "postmark",
    name: "Postmark",
    color: "bg-yellow-700",
    detectPattern: null,
    order: 153,
    detectPriority: 999,
    logoUrl: "/providers/postmark.png",
    transport: "proxy",
    // Server token first, then account token (Postmark answers 401 for the wrong token type).
    request: (apiKey) => ({
      url: "https://api.postmarkapp.com/server",
      headers: { "X-Postmark-Server-Token": apiKey, Accept: "application/json" }
    }),
    fallbackRequests: (apiKey) => [
      {
        url: "https://api.postmarkapp.com/servers?count=1&offset=0",
        headers: { "X-Postmark-Account-Token": apiKey, Accept: "application/json" }
      }
    ],
    describe: (body) => details(["Server", field(body, "Name")])
  },
  {
    id: "resend",
    name: "Resend",
    color: "bg-black",
    detectPattern: /^re_/,
    order: 154,
    detectPriority: 45,
    logoUrl: "/providers/resend.svg",
    transport: "proxy",
    // Resend rejects requests without a User-Agent (browsers can't set one, so this goes via the relay).
    request: (apiKey) => ({ url: "https://api.resend.com/domains", headers: { ...bearer(apiKey), "User-Agent": "ApiKeyChain/1.0" } }),
    interpret: (status, body) => {
      if (status === 401 && body.includes("restricted_api_key")) {
        return { success: true, message: "API key is valid (sending-only key; it cannot read domains)" };
      }
      if (status === 400 && /api key is invalid/i.test(body)) {
        return { success: false, message: 'Invalid API key (Resend: "API key is invalid")' };
      }
      return void 0;
    }
  },
  {
    id: "twilio",
    name: "Twilio",
    color: "bg-red-600",
    detectPattern: null,
    order: 155,
    detectPriority: 999,
    logoUrl: "/providers/twilio.png",
    transport: "direct",
    // Enter as "AccountSID:AuthToken" or "ApiKeySID:ApiKeySecret".
    request: (apiKey) => ({
      url: "https://api.twilio.com/2010-04-01/Accounts.json",
      headers: { Authorization: `Basic ${btoa(apiKey)}` }
    }),
    interpret: (status, _body, apiKey) => status === 401 && !apiKey.includes(":") ? { success: false, message: "Twilio needs both parts \u2014 enter it as AccountSID:AuthToken (or ApiKeySID:ApiKeySecret)" } : void 0,
    describe: (body) => {
      const accounts = body?.accounts;
      const first = Array.isArray(accounts) ? accounts[0] : void 0;
      return details(["Account", field(first, "friendly_name")], ["Account type", field(first, "type")], ["Status", field(first, "status")]);
    }
  },
  {
    id: "slack",
    name: "Slack",
    color: "bg-purple-800",
    detectPattern: /^(xoxb-|xoxp-|xapp-)/,
    order: 156,
    detectPriority: 46,
    logoUrl: "/providers/slack.png",
    transport: "direct",
    request: (apiKey) => ({ url: "https://slack.com/api/auth.test", headers: bearer(apiKey) }),
    // Slack answers HTTP 200 with {"ok": false} for bad tokens.
    interpret: (status, body) => {
      if (status !== 200) return void 0;
      try {
        const parsed = JSON.parse(body);
        return parsed.ok ? { success: true, message: "Token is valid" } : { success: false, message: `Invalid token (${parsed.error ?? "not ok"})` };
      } catch {
        return void 0;
      }
    },
    describe: (body) => field(body, "ok") === "yes" ? details(["Workspace", field(body, "team")], ["User", field(body, "user")], ["Bot", field(body, "bot_id") ? "yes" : "no"]) : []
  },
  // ── Developer platforms ───────────────────────────────────────────
  {
    id: "notion",
    name: "Notion",
    color: "bg-neutral-800",
    detectPattern: /^(ntn_|secret_)/,
    order: 160,
    detectPriority: 47,
    logoUrl: "/providers/notion.svg",
    transport: "direct",
    request: (apiKey) => ({
      url: "https://api.notion.com/v1/users/me",
      headers: { ...bearer(apiKey), "Notion-Version": "2022-06-28" }
    }),
    describe: (body) => details(["Integration", field(body, "name")], ["Workspace", field(body, "bot.workspace_name")])
  },
  {
    id: "gitlab",
    name: "GitLab",
    color: "bg-orange-600",
    detectPattern: /^glpat-/,
    order: 161,
    detectPriority: 48,
    logoUrl: "/providers/gitlab.svg",
    transport: "direct",
    // gitlab.com only — self-managed instances use their own host.
    request: (apiKey) => ({ url: "https://gitlab.com/api/v4/user", headers: { "PRIVATE-TOKEN": apiKey } }),
    describe: (body) => details(["Account", field(body, "username")], ["Bot account", field(body, "bot")])
  },
  {
    id: "vercel",
    name: "Vercel",
    color: "bg-black",
    detectPattern: /^vcp_/,
    order: 162,
    detectPriority: 49,
    logoUrl: "/providers/vercel.svg",
    transport: "direct",
    request: (apiKey) => ({ url: "https://api.vercel.com/v2/user", headers: bearer(apiKey) }),
    // Vercel answers 403 {"invalidToken": true} for bad tokens.
    interpret: (status, body) => status === 403 && body.includes("invalidToken") ? { success: false, message: "Invalid or expired token (403)" } : void 0,
    describe: (body) => details(["Account", field(body, "user.username")])
  },
  {
    id: "netlify",
    name: "Netlify",
    color: "bg-teal-500",
    detectPattern: null,
    order: 163,
    detectPriority: 999,
    logoUrl: "/providers/netlify.svg",
    transport: "direct",
    request: (apiKey) => ({ url: "https://api.netlify.com/api/v1/user", headers: bearer(apiKey) }),
    describe: (body) => details(["Account", field(body, "slug")], ["Name", field(body, "full_name")])
  },
  {
    id: "digitalocean",
    name: "DigitalOcean",
    color: "bg-blue-600",
    detectPattern: /^dop_v1_/,
    order: 164,
    detectPriority: 51,
    logoUrl: "/providers/digitalocean.svg",
    transport: "direct",
    request: (apiKey) => ({ url: "https://api.digitalocean.com/v2/account", headers: bearer(apiKey) }),
    describe: (body) => details(["Account status", field(body, "account.status")], ["Droplet limit", field(body, "account.droplet_limit")], ["Team", field(body, "account.team.name")])
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    color: "bg-orange-500",
    detectPattern: /^cfut_/,
    order: 165,
    detectPriority: 52,
    logoUrl: "/providers/cloudflare.svg",
    transport: "proxy",
    // User API tokens only (account tokens need an account id).
    request: (apiKey) => ({ url: "https://api.cloudflare.com/client/v4/user/tokens/verify", headers: bearer(apiKey) }),
    interpret: (status, body) => {
      if (status === 400) return { success: false, message: "Invalid API token (malformed)" };
      if (status !== 200) return void 0;
      try {
        const tokenStatus = JSON.parse(body).result?.status;
        return tokenStatus === "active" ? { success: true, message: "API token is valid and active" } : { success: false, message: `API token is ${tokenStatus ?? "not active"}` };
      } catch {
        return void 0;
      }
    },
    describe: (body) => details(["Token status", field(body, "result.status")], ["Expires", field(body, "result.expires_on")?.slice(0, 10)])
  },
  // ── Developer & business tools (verified against each provider's API docs, 2026-11) ──
  {
    // https://docs.discord.com/developers/resources/user (GET /users/@me, "Bot <token>")
    id: "discord",
    name: "Discord (bot)",
    color: "bg-indigo-500",
    detectPattern: null,
    order: 170,
    detectPriority: 999,
    logoUrl: "",
    transport: "proxy",
    request: (apiKey) => ({
      url: "https://discord.com/api/v10/users/@me",
      // Discord requires a descriptive User-Agent for bot requests.
      headers: { Authorization: `Bot ${apiKey}`, "User-Agent": "DiscordBot (https://apikeychain.app, 1.0)" }
    }),
    describe: (body) => details(["Bot", field(body, "username")], ["Is bot", field(body, "bot")])
  },
  {
    // https://core.telegram.org/bots/api#getme
    id: "telegram",
    name: "Telegram (bot)",
    color: "bg-sky-500",
    detectPattern: /^\d{6,12}:[A-Za-z0-9_-]{30,}$/,
    order: 171,
    detectPriority: 60,
    logoUrl: "",
    transport: "proxy",
    request: (apiKey) => ({ url: `https://api.telegram.org/bot${encodeURIComponent(apiKey)}/getMe` }),
    interpret: (status, body) => {
      if (status === 401 || status === 404) return { success: false, message: "Invalid bot token" };
      if (status !== 200) return void 0;
      try {
        return JSON.parse(body).ok ? { success: true, message: "Bot token is valid" } : { success: false, message: "Invalid bot token" };
      } catch {
        return void 0;
      }
    },
    describe: (body) => details(["Bot", field(body, "result.username") ? `@${field(body, "result.username")}` : void 0], ["Name", field(body, "result.first_name")])
  },
  {
    // https://developers.hubspot.com/docs/api-reference/account-account-info-v3/details/get-account-info-v3-details
    id: "hubspot",
    name: "HubSpot",
    color: "bg-orange-500",
    detectPattern: null,
    order: 172,
    detectPriority: 999,
    logoUrl: "",
    transport: "proxy",
    request: (apiKey) => ({ url: "https://api.hubapi.com/account-info/v3/details", headers: bearer(apiKey) }),
    describe: (body) => details(["Portal ID", field(body, "portalId")], ["Account type", field(body, "accountType")], ["Data hosting", field(body, "dataHostingLocation")])
  },
  {
    // https://mailchimp.com/developer/marketing/guides/quick-start/ (GET /3.0/ping; the -usN suffix is the data center)
    id: "mailchimp",
    name: "Mailchimp",
    color: "bg-yellow-500",
    detectPattern: /^[0-9a-f]{32}-us\d{1,2}$/,
    order: 173,
    detectPriority: 61,
    logoUrl: "",
    transport: "proxy",
    request: (apiKey) => {
      const dc = /-(us\d{1,2})$/.exec(apiKey)?.[1] ?? "us1";
      return { url: `https://${dc}.api.mailchimp.com/3.0/ping`, headers: bearer(apiKey) };
    }
  },
  {
    // https://airtable.com/developers/web/api/get-user-id-scopes
    id: "airtable",
    name: "Airtable",
    color: "bg-blue-500",
    detectPattern: null,
    order: 174,
    detectPriority: 999,
    logoUrl: "",
    transport: "proxy",
    request: (apiKey) => ({ url: "https://api.airtable.com/v0/meta/whoami", headers: bearer(apiKey) })
  },
  {
    // https://linear.app/developers/graphql (personal keys: "Authorization: <key>", no Bearer)
    id: "linear",
    name: "Linear",
    color: "bg-violet-600",
    detectPattern: null,
    order: 175,
    detectPriority: 999,
    logoUrl: "",
    transport: "proxy",
    request: (apiKey) => ({
      url: "https://api.linear.app/graphql",
      method: "POST",
      headers: { Authorization: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ query: "{ viewer { name } }" })
    }),
    interpret: (status, body) => {
      if (status !== 200) return void 0;
      try {
        const parsed = JSON.parse(body);
        return parsed.data?.viewer ? { success: true, message: "API key is valid" } : { success: false, message: parsed.errors?.[0]?.message ?? "Invalid API key" };
      } catch {
        return void 0;
      }
    },
    describe: (body) => details(["User", field(body, "data.viewer.name")])
  },
  {
    // https://devcenter.heroku.com/articles/platform-api-reference#account-info
    id: "heroku",
    name: "Heroku",
    color: "bg-purple-700",
    detectPattern: null,
    order: 176,
    detectPriority: 999,
    logoUrl: "",
    transport: "proxy",
    request: (apiKey) => ({ url: "https://api.heroku.com/account", headers: { ...bearer(apiKey), Accept: "application/vnd.heroku+json; version=3" } }),
    describe: (body) => details(["Name", field(body, "name")], ["Default team", field(body, "default_team.name")])
  },
  {
    // https://docs.sentry.io/api/users/retrieve-the-current-credentials/ (sentry.io only, not self-hosted)
    id: "sentry",
    name: "Sentry",
    color: "bg-purple-900",
    detectPattern: null,
    order: 177,
    detectPriority: 999,
    logoUrl: "",
    transport: "proxy",
    request: (apiKey) => ({ url: "https://sentry.io/api/0/", headers: bearer(apiKey) }),
    interpret: (status, body) => {
      if (status !== 200) return void 0;
      try {
        return JSON.parse(body).auth ? { success: true, message: "Auth token is valid" } : { success: false, message: "Invalid auth token" };
      } catch {
        return void 0;
      }
    },
    describe: (body) => {
      const scopes = body?.auth?.scopes;
      return details(["Scopes", Array.isArray(scopes) ? scopes.join(", ").slice(0, 120) : void 0], ["User", field(body, "user.username")]);
    }
  },
  {
    // https://docs.mapbox.com/api/accounts/tokens/#retrieve-a-token (200 for any token: check "code")
    id: "mapbox",
    name: "Mapbox",
    color: "bg-slate-700",
    detectPattern: /^(pk|sk|tk)\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    order: 178,
    detectPriority: 62,
    logoUrl: "",
    transport: "proxy",
    request: (apiKey) => ({ url: `https://api.mapbox.com/tokens/v2?access_token=${encodeURIComponent(apiKey)}` }),
    interpret: (status, body) => {
      if (status !== 200) return void 0;
      try {
        const code = JSON.parse(body).code;
        return code === "TokenValid" ? { success: true, message: "Access token is valid" } : { success: false, message: `Token not valid (${code ?? "unknown"})` };
      } catch {
        return void 0;
      }
    },
    describe: (body, _headers, apiKey) => details(["Token type", apiKey.startsWith("sk.") ? "Secret" : apiKey.startsWith("pk.") ? "Public" : apiKey.startsWith("tk.") ? "Temporary" : void 0], ["Account", field(body, "token.user")])
  },
  {
    // https://developers.asana.com/reference/getuser (users/me)
    id: "asana",
    name: "Asana",
    color: "bg-rose-500",
    detectPattern: null,
    order: 179,
    detectPriority: 999,
    logoUrl: "",
    transport: "proxy",
    request: (apiKey) => ({ url: "https://app.asana.com/api/1.0/users/me", headers: bearer(apiKey) }),
    describe: (body) => details(["User", field(body, "data.name")])
  },
  {
    // https://developer.squareup.com/reference/square/merchants-api/retrieve-merchant
    id: "square",
    name: "Square",
    color: "bg-gray-800",
    detectPattern: null,
    order: 180,
    detectPriority: 999,
    logoUrl: "",
    transport: "proxy",
    request: (apiKey) => ({ url: "https://connect.squareup.com/v2/merchants/me", headers: bearer(apiKey) }),
    // Sandbox tokens only work on the sandbox host.
    fallbackRequests: (apiKey) => [{ url: "https://connect.squareupsandbox.com/v2/merchants/me", headers: bearer(apiKey) }],
    describe: (body) => details(["Business", field(body, "merchant.business_name")], ["Country", field(body, "merchant.country")])
  },
  {
    // https://docs.datadoghq.com/api/latest/authentication/ (GET /api/v1/validate; one host per Datadog site)
    id: "datadog",
    name: "Datadog",
    color: "bg-purple-600",
    detectPattern: null,
    order: 181,
    detectPriority: 999,
    logoUrl: "",
    transport: "proxy",
    request: (apiKey) => ({ url: "https://api.datadoghq.com/api/v1/validate", headers: { "DD-API-KEY": apiKey } }),
    // Datadog answers 403 for an unknown key (on every site).
    interpret: (status) => status === 403 ? { success: false, message: "Invalid API key (not valid on any Datadog site)" } : void 0,
    fallbackRequests: (apiKey) => ["api.datadoghq.eu", "api.us3.datadoghq.com", "api.us5.datadoghq.com", "api.ap1.datadoghq.com"].map((host) => ({
      url: `https://${host}/api/v1/validate`,
      headers: { "DD-API-KEY": apiKey }
    }))
  },
  {
    // https://learning.postman.com/docs/developer/postman-api/authentication/
    id: "postman",
    name: "Postman",
    color: "bg-orange-600",
    detectPattern: null,
    order: 182,
    detectPriority: 999,
    logoUrl: "",
    transport: "proxy",
    request: (apiKey) => ({ url: "https://api.getpostman.com/me", headers: { "X-API-Key": apiKey } }),
    describe: (body) => details(["User", field(body, "user.username")])
  },
  {
    // https://api-docs.render.com/reference/list-owners
    id: "render",
    name: "Render",
    color: "bg-gray-900",
    detectPattern: null,
    order: 183,
    detectPriority: 999,
    logoUrl: "",
    transport: "proxy",
    request: (apiKey) => ({ url: "https://api.render.com/v1/owners?limit=20", headers: { ...bearer(apiKey), Accept: "application/json" } }),
    describe: (body) => {
      const first = Array.isArray(body) ? body[0]?.owner : void 0;
      return details(["Owner", field(first, "name")], ["Owner type", field(first, "type")]);
    }
  },
  {
    // https://neon.com/docs/reference/api/users/get-current-user-info
    id: "neon",
    name: "Neon",
    color: "bg-emerald-500",
    detectPattern: null,
    order: 184,
    detectPriority: 999,
    logoUrl: "",
    transport: "proxy",
    request: (apiKey) => ({ url: "https://console.neon.tech/api/v2/users/me", headers: { ...bearer(apiKey), Accept: "application/json" } })
  },
  {
    // https://docs.lemonsqueezy.com/api/users/retrieve-user
    id: "lemonsqueezy",
    name: "Lemon Squeezy",
    color: "bg-yellow-400",
    detectPattern: null,
    order: 185,
    detectPriority: 999,
    logoUrl: "",
    transport: "proxy",
    request: (apiKey) => ({ url: "https://api.lemonsqueezy.com/v1/users/me", headers: { ...bearer(apiKey), Accept: "application/vnd.api+json" } }),
    describe: (body) => details(["User", field(body, "data.attributes.name")], ["Test mode", field(body, "meta.test_mode")])
  }
];
var PROVIDER_LOOKUP = new Map(PROVIDERS.map((p) => [p.id, p]));
var PROVIDER_MAP = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, p])
);
var PROVIDERS_SORTED = [...PROVIDERS].sort((a, b) => a.order - b.order);
var PROVIDERS_DETECT_ORDER = [...PROVIDERS].filter((p) => p.detectPattern).sort((a, b) => a.detectPriority - b.detectPriority);
function getProviderById(id) {
  return PROVIDER_LOOKUP.get(id);
}
var MAX_BODY_CHARS = 8e3;
function extractErrorMessage(rawBody) {
  let parsed;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return "";
  }
  if (!parsed || typeof parsed !== "object") return "";
  const obj = parsed;
  const candidates = [obj.error, obj.message, obj.detail, obj.errors];
  for (const c of candidates) {
    if (typeof c === "string" && c) return c;
    if (Array.isArray(c) && c[0] && typeof c[0] === "object") {
      const m = c[0].message;
      if (typeof m === "string") return m;
    }
    if (c && typeof c === "object" && typeof c.message === "string") {
      return c.message;
    }
  }
  return "";
}
var INVALID_HINTS = ["api key not valid", "invalid api key", "invalid key", "api_key_invalid", "unauthorized", "denied", "incorrect api key"];
var FORMAT_HINTS = ["malformed", "format", "parse error"];
function classifyResponse(meta, apiKey, status, statusText, rawBody) {
  const custom = meta.interpret?.(status, rawBody, apiKey);
  if (custom) return custom;
  const detail = extractErrorMessage(rawBody);
  const suffix = detail ? `: ${detail}` : "";
  const lower = detail.toLowerCase();
  if (status >= 200 && status < 300) return { success: true, message: "API key is valid" };
  if (status === 429) return { success: true, message: "API key is valid (rate limited)" };
  if (status === 401) return { success: false, message: `Invalid or incorrect API key (401 Unauthorized)${suffix}` };
  if (status === 403) return { success: false, message: `API key rejected or missing permissions (403 Forbidden)${suffix}` };
  if (status === 400) {
    const hintsIncorrect = INVALID_HINTS.some((h) => lower.includes(h));
    const hintsFormat = FORMAT_HINTS.some((h) => lower.includes(h));
    const formatValid = meta.detectPattern ? meta.detectPattern.test(apiKey) : true;
    if (hintsFormat && !hintsIncorrect) return { success: false, message: `Invalid API key format (400)${suffix}` };
    if (hintsIncorrect || formatValid) return { success: false, message: `Invalid or incorrect API key (400 Bad Request)${suffix}` };
    return { success: false, message: `Invalid API key format (400)${suffix}` };
  }
  if (status === 404) {
    return { success: false, message: `Test endpoint not found (404) \u2014 the provider API may have changed${suffix}` };
  }
  if (status >= 500) {
    return { success: false, message: `Provider error (${status}) \u2014 could not determine key validity, try again later${suffix}` };
  }
  return { success: false, message: `API error: ${status} ${statusText}${detail ? " - " + detail : ""}`.trim() };
}
function describeKey(meta, rawBody, headers, apiKey) {
  let body = null;
  try {
    body = JSON.parse(rawBody);
  } catch {
  }
  try {
    const own = meta.describe ? meta.describe(body, headers, apiKey) : [];
    const models = meta.request("").url.endsWith("/models") ? modelCount(body) : [];
    return [...own, ...models].slice(0, 6);
  } catch {
    return [];
  }
}
async function runProviderTest(meta, apiKey, doFetch) {
  const requests = [meta.request(apiKey), ...meta.fallbackRequests?.(apiKey) ?? []];
  let result;
  for (const request of requests) {
    const startTime = Date.now();
    const response = await doFetch(request);
    const latency = Date.now() - startTime;
    const rawBody = await response.text().catch(() => "");
    const verdict = classifyResponse(meta, apiKey, response.status, response.statusText, rawBody);
    result = {
      ...verdict,
      status: response.status,
      latency,
      endpoint: request.url,
      responseBody: rawBody.slice(0, MAX_BODY_CHARS)
    };
    if (verdict.success && response.status >= 200 && response.status < 300) {
      const found = describeKey(meta, rawBody, response.headers, apiKey);
      if (found.length > 0) result.details = found;
    }
    if (response.status !== 401 && response.status !== 403) break;
  }
  return result;
}

// src/utils/detection.ts
function detectProvider(key) {
  for (const provider of PROVIDERS_DETECT_ORDER) {
    if (provider.detectPattern && provider.detectPattern.test(key)) {
      return provider.id;
    }
  }
  return null;
}

// src/utils/envParser.ts
var ASSIGNMENT = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/;
function parseValue(raw) {
  const v = raw.trim();
  const quote = v[0];
  if (quote === '"' || quote === "'" || quote === "`") {
    const end = v.indexOf(quote, 1);
    return end > 0 ? v.slice(1, end) : v.slice(1);
  }
  return v.replace(/\s+#.*$/, "").trim();
}
var NAME_HINTS = [
  ["OPENROUTER", "openrouter"],
  ["OPENAI", "openai"],
  ["ANTHROPIC", "anthropic"],
  ["CLAUDE", "anthropic"],
  ["GEMINI", "gemini"],
  ["MISTRAL", "mistral"],
  ["COHERE", "cohere"],
  ["HUGGINGFACE", "huggingface"],
  ["GROQ", "groq"],
  ["TOGETHER", "together"],
  ["PERPLEXITY", "perplexity"],
  ["ZHIPU", "glm"],
  ["MOONSHOT", "kimi"],
  ["KIMI", "kimi"],
  ["DASHSCOPE", "qwen"],
  ["QWEN", "qwen"],
  ["DOUBAO", "doubao"],
  ["DEEPSEEK", "deepseek"],
  ["STRIPE", "stripe"],
  ["GITHUB", "github"],
  ["SENDGRID", "sendgrid"],
  ["FIREWORKS", "fireworks"],
  ["CEREBRAS", "cerebras"],
  ["NEBIUS", "nebius"],
  ["DEEPINFRA", "deepinfra"],
  ["HYPERBOLIC", "hyperbolic"],
  ["NOVITA", "novita"],
  ["AI21", "ai21"],
  ["REPLICATE", "replicate"],
  ["ELEVENLABS", "elevenlabs"],
  ["ASSEMBLYAI", "assemblyai"],
  ["DEEPGRAM", "deepgram"],
  ["PINECONE", "pinecone"],
  ["MAILGUN", "mailgun"],
  ["BREVO", "brevo"],
  ["SENDINBLUE", "brevo"],
  ["POSTMARK", "postmark"],
  ["RESEND", "resend"],
  ["SLACK", "slack"],
  ["NOTION", "notion"],
  ["GITLAB", "gitlab"],
  ["VERCEL", "vercel"],
  ["NETLIFY", "netlify"],
  ["DIGITALOCEAN", "digitalocean"],
  ["CLOUDFLARE", "cloudflare"],
  ["DISCORD", "discord"],
  ["TELEGRAM", "telegram"],
  ["HUBSPOT", "hubspot"],
  ["MAILCHIMP", "mailchimp"],
  ["AIRTABLE", "airtable"],
  ["HEROKU", "heroku"],
  ["SENTRY", "sentry"],
  ["MAPBOX", "mapbox"],
  ["ASANA", "asana"],
  ["DATADOGAPIKEY", "datadog"],
  ["DDAPIKEY", "datadog"],
  ["POSTMANAPIKEY", "postman"],
  ["LEMONSQUEEZY", "lemonsqueezy"]
];
var WORD_HINTS = {
  HF: "huggingface",
  GH: "github",
  XAI: "xai",
  GROK: "xai",
  GLM: "glm",
  PPLX: "perplexity",
  LINEAR: "linear",
  SQUARE: "square",
  RENDER: "render",
  NEON: "neon"
};
var NON_KEY_WORDS = /* @__PURE__ */ new Set([
  "PUBLIC",
  "PUBLISHABLE",
  "PK",
  "WEBHOOK",
  "URL",
  "URI",
  "HOST",
  "PORT",
  "ID",
  "SID",
  "USER",
  "USERNAME",
  "EMAIL",
  "DOMAIN",
  "REGION",
  "MODEL",
  "ENDPOINT",
  "BASE",
  "PROJECT",
  "ORG",
  "ORGANIZATION",
  "TEAM",
  "ACCOUNT",
  "ZONE",
  "NAME",
  "VERSION",
  "ENV",
  "MODE",
  "TIMEOUT",
  "LIMIT",
  "PATH",
  "DIR",
  "FROM",
  "TO"
]);
function providerFromName(name) {
  const upper = name.toUpperCase();
  const words = upper.split(/[^A-Z0-9]+/).filter(Boolean);
  if (words.some((w) => NON_KEY_WORDS.has(w))) return null;
  if (upper.includes("AZURE")) return null;
  const compact = upper.replace(/[^A-Z0-9]/g, "");
  const found = /* @__PURE__ */ new Set();
  for (const [hint, provider] of NAME_HINTS) if (compact.includes(hint)) found.add(provider);
  for (const w of words) if (WORD_HINTS[w]) found.add(WORD_HINTS[w]);
  return found.size === 1 ? [...found][0] : null;
}
function nonKeyReason(value) {
  if (!value) return "empty";
  if (/\s/.test(value)) return "not an API key";
  if (value.includes("://")) return "URL, not an API key";
  if (/^(true|false|yes|no|on|off|null|undefined)$/i.test(value)) return "not an API key";
  if (/^-?\d+(\.\d+)?$/.test(value)) return "number, not an API key";
  if (value.length < 16) return "too short to be an API key";
  if (/^(your|xxx|changeme|replace|<)/i.test(value) || /^(.)\1+$/.test(value)) return "placeholder value";
  return null;
}
function parseEnvFile(text) {
  const entries = [];
  const seen = /* @__PURE__ */ new Map();
  text.split(/\r?\n/).forEach((rawLine, i) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) return;
    const match = ASSIGNMENT.exec(rawLine);
    if (!match) return;
    const name = match[1];
    const value = parseValue(match[2]);
    const entry = { name, value, line: i + 1, provider: null };
    const notKey = nonKeyReason(value);
    const byPattern = value ? detectProvider(value) : null;
    const byName = providerFromName(name);
    let provider = null;
    if (byPattern && (!byName || byName === byPattern || PROVIDER_MAP[byName]?.detectPattern)) {
      provider = byPattern;
    } else if (byName && !notKey) {
      provider = byName;
    }
    if (provider === "twilio" && !value.includes(":")) provider = null;
    if (provider) {
      const dupe = seen.get(value);
      if (dupe) {
        entry.skipReason = `same value as ${dupe}`;
      } else {
        entry.provider = provider;
        seen.set(value, name);
      }
    } else {
      entry.skipReason = notKey ?? "not recognised as an API key";
    }
    entries.push(entry);
  });
  return entries;
}

// cli/index.ts
var VERSION = "1.0.0";
var TIMEOUT_MS = 1e4;
var HELP = `apikeychain ${VERSION} \u2014 check that the API keys in a .env file still work

Usage:
  apikeychain [file]            Check keys in a .env file (default: .env)
  apikeychain --env             Check keys in the current environment variables

Options:
  --only NAME1,NAME2   Only check these variable names
  --json               Print results as JSON
  --strict             Also fail on provider errors (timeouts, 5xx) and unrecognised keys
  --quiet              Only print problems
  -h, --help           Show this help
  -v, --version        Show the version

Exit codes: 0 all valid \xB7 1 a key is invalid (or a problem with --strict) \xB7 2 usage error
Keys are sent only to their own provider. Full keys are never printed.`;
function parseArgs(argv) {
  const opts = { file: ".env", env: false, only: null, json: false, strict: false, quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") {
      console.log(HELP);
      process.exit(0);
    } else if (a === "-v" || a === "--version") {
      console.log(VERSION);
      process.exit(0);
    } else if (a === "--env") opts.env = true;
    else if (a === "--json") opts.json = true;
    else if (a === "--strict") opts.strict = true;
    else if (a === "--quiet") opts.quiet = true;
    else if (a === "--only") opts.only = new Set((argv[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean));
    else if (a.startsWith("--only=")) opts.only = new Set(a.slice(7).split(",").map((s) => s.trim()).filter(Boolean));
    else if (a.startsWith("-")) {
      console.error(`Unknown option: ${a}

${HELP}`);
      process.exit(2);
    } else opts.file = a;
  }
  return opts;
}
var mask = (k) => k.length > 12 ? `${k.slice(0, 6)}\u2026${k.slice(-4)}` : "\u2022\u2022\u2022\u2022";
async function check(provider, key) {
  const meta = getProviderById(provider);
  if (!meta) return { status: "skipped", message: "Provider not supported" };
  let result;
  try {
    result = await runProviderTest(
      meta,
      key,
      (r) => fetch(r.url, { method: r.method ?? "GET", headers: r.headers, body: r.body, signal: AbortSignal.timeout(TIMEOUT_MS) })
    );
  } catch (err) {
    const timeout = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    return { status: "error", message: timeout ? `No response within ${TIMEOUT_MS / 1e3}s` : "Could not reach the provider" };
  }
  const status = result.success ? "valid" : result.status && result.status >= 500 ? "error" : result.status === 404 ? "error" : "invalid";
  return { status, message: result.message, latency: result.latency, details: result.details };
}
var COLORS = { valid: "\x1B[32m", invalid: "\x1B[31m", error: "\x1B[33m", skipped: "\x1B[90m", reset: "\x1B[0m" };
var ICON = { valid: "\u2713", invalid: "\u2717", error: "!", skipped: "-" };
var useColor = process.stdout.isTTY && !process.env.NO_COLOR;
var paint = (s, text) => useColor ? `${COLORS[s]}${text}${COLORS.reset}` : text;
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  let text;
  if (opts.env) {
    text = Object.entries(process.env).map(([k, v]) => `${k}=${JSON.stringify(v ?? "")}`).join("\n");
  } else {
    if (!existsSync(opts.file)) {
      console.error(`File not found: ${opts.file} (use --env to check environment variables)`);
      process.exit(2);
    }
    text = readFileSync(opts.file, "utf8");
  }
  const entries = parseEnvFile(text).filter((e) => !opts.only || opts.only.has(e.name));
  if (opts.only) {
    for (const name of opts.only) if (!entries.some((e) => e.name === name)) entries.push({ name, value: "", line: 0, provider: null, skipReason: "not set" });
  }
  const rows = [];
  const queue = [...entries];
  await Promise.all(Array.from({ length: 4 }, async () => {
    for (let e = queue.shift(); e; e = queue.shift()) {
      if (!e.provider) {
        rows.push({ name: e.name, provider: null, key: e.value ? mask(e.value) : "", status: "skipped", message: e.skipReason ?? "Not recognised as an API key" });
        continue;
      }
      rows.push({ name: e.name, provider: e.provider, key: mask(e.value), ...await check(e.provider, e.value) });
    }
  }));
  rows.sort((a, b) => a.name.localeCompare(b.name));
  const relevant = rows.filter((r) => r.status !== "skipped" || opts.only?.has(r.name));
  const count = (s) => relevant.filter((r) => r.status === s).length;
  const failed = count("invalid") > 0 || opts.strict && (count("error") > 0 || count("skipped") > 0);
  if (opts.json) {
    console.log(JSON.stringify({ ok: !failed, summary: { valid: count("valid"), invalid: count("invalid"), error: count("error"), skipped: count("skipped") }, results: relevant }, null, 2));
  } else {
    if (relevant.length === 0) console.log("No API keys recognised.");
    for (const r of relevant) {
      if (opts.quiet && r.status === "valid") continue;
      const provider = r.provider ? getProviderById(r.provider)?.name ?? r.provider : "";
      const latency = r.latency !== void 0 ? ` (${r.latency} ms)` : "";
      console.log(`${paint(r.status, ICON[r.status])} ${r.name.padEnd(28)} ${provider.padEnd(14)} ${r.key.padEnd(14)} ${paint(r.status, r.message)}${latency}`);
      for (const d of r.details ?? []) console.log(`    ${d.label}: ${d.value}`);
    }
    console.log(`
${count("valid")} valid \xB7 ${count("invalid")} invalid \xB7 ${count("error")} errors${count("skipped") ? ` \xB7 ${count("skipped")} skipped` : ""}`);
  }
  process.exit(failed ? 1 : 0);
}
main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(2);
});
