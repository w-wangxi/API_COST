# AI API Cost Calculator

A small deployed web tool for estimating and comparing monthly API costs across popular overseas AI models.

The app lets users enter expected usage, such as monthly requests, input tokens, output tokens, generated image count, and image size. It then calculates the estimated monthly cost for text and image models and sorts the results from cheapest to most expensive.

Live demo: https://api-cost-eta.vercel.app

Backend API: https://api-cost-backend.onrender.com

## What This Project Does

- Estimates monthly cost for text models using input token price, cached input token price, and output token price.
- Estimates image generation cost for models billed per image or per megapixel.
- Shows pricing source names, official links, and query dates on a separate pricing page.
- Fetches pricing data from a backend API instead of hardcoding model prices in the frontend.
- Uses DeepSeek to extract structured pricing data from official pricing pages and discovery sources.
- Caches pricing data daily with Redis first, and falls back to a local file cache when Redis is not configured.
- Deploys as a frontend/backend separated project:
  - Frontend on Vercel
  - Backend on Render
  - Redis cache on Upstash

## Tech Stack

### Frontend

- Vue 3
- Vite
- JavaScript
- CSS

### Backend

- Node.js HTTP server
- DeepSeek Chat Completions API
- Redis cache via the `redis` npm package

### Deployment

- Vercel for the frontend
- Render for the backend
- Upstash Redis for production cache

## Project Structure

```text
frontend/          Vue + Vite frontend app
backend/           Node.js backend API
scripts/dev.js     Local development script that starts frontend and backend together
docs/              GitHub Pages writeup
```

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then fill in at least:

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
VITE_API_BASE_URL=http://127.0.0.1:3001
BACKEND_HOST=127.0.0.1
BACKEND_PORT=3001
CORS_ORIGIN=*
```

Redis is optional for local development:

```env
REDIS_URL=redis://127.0.0.1:6379
REDIS_PRICING_CACHE_KEY=api-cost:pricing-cache
REDIS_CONNECT_TIMEOUT_MS=2000
```

If `REDIS_URL` is not set or Redis is unavailable, the backend falls back to `backend/cache/pricing-cache.json`.

### 3. Run locally

```bash
npm run dev
```

This starts:

- Backend API at `http://127.0.0.1:3001`
- Vite frontend at the local URL printed by Vite

You can also run them separately:

```bash
npm run dev:backend
npm run dev:frontend
```

## Build

```bash
npm run build
```

The frontend production build is generated in:

```text
frontend/dist
```

## API Endpoints

```text
GET /api/health
GET /api/pricing
GET /api/pricing?refresh=1
POST /api/pricing/refresh
```

`GET /api/pricing` returns cached pricing data when today's cache exists. Otherwise, the backend refreshes pricing data through the extraction pipeline.

## Pricing Calculation

### Text models

Most text model APIs are priced in `USD / 1M tokens`.

```text
inputCost = inputTokens * monthlyRequests / 1,000,000 * inputPrice
outputCost = outputTokens * monthlyRequests / 1,000,000 * outputPrice
totalCost = inputCost + outputCost
```

If cached input pricing is enabled and the model has a cached input price, the calculator uses `cachedInputPrice` for the input cost.

### Image models

For models billed per image:

```text
totalCost = imageCount * price
```

For models billed per megapixel:

```text
totalCost = imageCount * megapixelPerImage * price
```

## Pricing Data Flow

1. The frontend requests `GET /api/pricing`.
2. The backend checks today's Redis cache.
3. If Redis is unavailable, it checks the local file cache.
4. If no valid cache exists, the backend fetches pricing source pages.
5. DeepSeek extracts structured text and image model pricing.
6. The backend stores the refreshed payload in Redis or local cache.
7. The frontend renders models, source links, query dates, and calculators.

Model prices are not stored in `frontend/src/data/pricingData.js`. That file only keeps scenario presets.

## Environment Variables

### Frontend

```env
VITE_API_BASE_URL=https://your-backend-domain.example.com
```

### Backend

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
BACKEND_HOST=0.0.0.0
CORS_ORIGIN=https://your-frontend-domain.example.com
REDIS_URL=rediss://default:password@your-redis-host:6379
REDIS_PRICING_CACHE_KEY=api-cost:pricing-cache
REDIS_CONNECT_TIMEOUT_MS=2000
```

Do not commit `.env` or any API keys to GitHub.

## Deployment Notes

### Frontend on Vercel

- Build command: `npm run build`
- Output directory: `frontend/dist`
- Environment variable:

```env
VITE_API_BASE_URL=https://api-cost-backend.onrender.com
```

### Backend on Render

- Runtime: Node
- Build command: `npm install`
- Start command: `npm run start`
- Required environment variables:

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
BACKEND_HOST=0.0.0.0
CORS_ORIGIN=https://api-cost-eta.vercel.app
REDIS_URL=your_upstash_redis_url
REDIS_PRICING_CACHE_KEY=api-cost:pricing-cache
REDIS_CONNECT_TIMEOUT_MS=2000
```

Render provides `PORT` automatically, so `BACKEND_PORT` is not required in production.

## Known Limitations

- Some official pricing pages block server-side scraping, so extraction may miss providers or return partial data.
- DeepSeek API quota is required for cache refreshes. If quota is exhausted, refreshing pricing data fails.
- The project estimates cost only. It does not compare model quality, latency, context length, reliability, or benchmark performance.
- LLM-extracted pricing can be wrong or outdated, so important prices should be manually verified against official pages.
- Render free instances can sleep after inactivity, so the first request may take tens of seconds.
- The refresh button can force a new DeepSeek call, which may consume API credits.
- Redis is recommended for deployment, but the local file fallback is not suitable for serverless environments.

## Security Notes

- API keys are kept only on the backend.
- The frontend only receives public pricing data.
- `.env`, build output, cache files, and `node_modules` are ignored by Git.

## Links

- Live frontend: https://api-cost-eta.vercel.app
- Backend health check: https://api-cost-backend.onrender.com/api/health
- GitHub Pages writeup: https://w-wangxi.github.io/API_COST/
