# ChatGPT Wrapper

A minimal Next.js chat app with streamed responses via the OpenAI Responses API and a built-in mock mode for demos.

## Getting started

Requires Node.js 20.9 or later and pnpm.

```bash
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local
pnpm install
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Checks

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

Set `OPENAI_MODEL` to use a different model. The default is `gpt-4.1-mini`.

## Demo without an API key

Set `MOCK_OPENAI=true` for a temporary online demo. The app streams a fixed response in small SSE chunks and does not make requests to OpenAI. If `OPENAI_API_KEY` is not set, demo mode is enabled automatically, so a fresh deployment without a key can safely demonstrate streaming without calling the API.

To protect the demo with a password, set `APP_PASSWORD` in your hosting provider's environment variables. The browser will prompt for HTTP Basic Auth. The default username is `preview`; override it with `APP_USERNAME` if needed. Use HTTPS, and set the password in your hosting provider's settings rather than in the repository.

Before enabling a real API key on an internet-facing deployment, configure password protection. To use real responses, add `OPENAI_API_KEY` as a secret environment variable in your hosting provider and make sure `MOCK_OPENAI` is not set to `true`.
